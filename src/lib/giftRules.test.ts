import { describe, expect, it } from "vitest";
import { SHARED, type SiteCup } from "./cups";
import { GIFTS, GIFT_BY_CODE, senderLine } from "./giftCatalog";
import {
  activeEffects,
  activeShowerId,
  buildVases,
  canOpenGift,
  canSendGift,
  canThank,
  normalizeSpeech,
  owesGift,
  type GiftRow,
} from "./giftRules";
import { buildEdition, reignLength, weeklyLine } from "./newspaper";

const cupOf = (i: number, winner: string, m = 4, d = 3): SiteCup => ({
  weekNumber: i + 1,
  weekStart: `2026-01-${String(5 + i).padStart(2, "0")}`,
  weekEnd: `2026-01-${String(11 + i).padStart(2, "0")}`,
  winner,
  scores: winner === "Mukul" ? { Mukul: m, Madhulika: d } : { Madhulika: m, Mukul: d },
});
const seq = (s: string) => s.split("").map((w, i) => cupOf(i, w === "M" ? "Mukul" : w === "D" ? "Madhulika" : SHARED));
const NAMES: [string, string] = ["Mukul", "Madhulika"];

let n = 0;
const gift = (code: string, over: Partial<GiftRow> = {}): GiftRow => {
  n++;
  return {
    id: `g${n}`,
    from_player_id: "m",
    to_player_id: "d",
    week_start: "2026-01-05",
    gift_code: code,
    speech: null,
    sent_at: "2026-01-12T00:00:00.000Z",
    opened_at: `2026-01-12T00:00:${String(n % 60).padStart(2, "0")}.000Z`,
    thanks: null,
    ...over,
  };
};

describe("who sends a gift", () => {
  it("the loser owes the winner; a tie means both do", () => {
    expect(owesGift(cupOf(0, "Madhulika"), "Mukul")).toBe(true);
    expect(owesGift(cupOf(0, "Madhulika"), "Madhulika")).toBe(false);
    expect(owesGift(cupOf(0, SHARED), "Madhulika")).toBe(true);
    expect(owesGift(null, "Mukul")).toBe(false);
  });

  it("refuses the winner, repeats, no cup and unknown gifts", () => {
    const cup = cupOf(0, "Madhulika");
    expect(canSendGift({ cup, senderName: "Mukul", alreadySent: false, giftCode: "F1" }).ok).toBe(true);
    expect(canSendGift({ cup, senderName: "Madhulika", alreadySent: false, giftCode: "F1" })).toEqual({ ok: false, reason: "not_your_turn" });
    expect(canSendGift({ cup, senderName: "Mukul", alreadySent: true, giftCode: "F1" })).toEqual({ ok: false, reason: "already_sent" });
    expect(canSendGift({ cup: null, senderName: "Mukul", alreadySent: false, giftCode: "F1" })).toEqual({ ok: false, reason: "no_cup" });
    expect(canSendGift({ cup, senderName: "Mukul", alreadySent: false, giftCode: "C1" })).toEqual({ ok: false, reason: "invalid_gift" });
  });

  it("speeches are optional, trimmed and at most 60 characters", () => {
    expect(normalizeSpeech("  hi ")).toEqual({ ok: true, speech: "hi" });
    expect(normalizeSpeech("   ")).toEqual({ ok: true, speech: null });
    expect(normalizeSpeech(undefined)).toEqual({ ok: true, speech: null });
    expect(normalizeSpeech("x".repeat(61)).ok).toBe(false);
    expect(normalizeSpeech("🌸".repeat(60)).ok).toBe(true);
  });

  it("has only the chosen gifts", () => {
    expect(GIFTS.filter((g) => g.category === "flower")).toHaveLength(10);
    expect(GIFTS.filter((g) => g.category === "silly")).toHaveLength(9);
    expect(GIFTS.filter((g) => g.category === "app")).toHaveLength(4);
  });

  it("tells the sender who each gift lands on", () => {
    const line = (code: string) => senderLine(GIFT_BY_CODE.get(code)!, "Madhulika");
    expect(line("A3")).toBe("On Madhulika's photo for a day.");
    expect(line("F10")).toBe("Around Madhulika's photo for a day.");
    expect(line("A2")).toBe("VIP light beside Madhulika's name all week.");
    expect(line("A1")).toBe("Petals fall when Madhulika opens the app, for a day.");
    expect(line("S5")).toBe("Stands in Madhulika's Trophy Cabinet.");
    expect(line("A4")).toBe("Goes on your own photo for a day.");
    expect(line("F1")).toBe(GIFT_BY_CODE.get("F1")!.line);
  });
});

describe("opening and thanks", () => {
  it("only the recipient can open, once", () => {
    const g = gift("F1", { opened_at: null });
    expect(canOpenGift(g, "d").ok).toBe(true);
    expect(canOpenGift(g, "m")).toEqual({ ok: false, reason: "not_found" });
    expect(canOpenGift(gift("F1"), "d")).toEqual({ ok: false, reason: "already_opened" });
    expect(canOpenGift(null, "d")).toEqual({ ok: false, reason: "not_found" });
  });

  it("thanks needs an opened gift, a preset line, and only happens once", () => {
    const line = "Noted by the Cabinet";
    expect(canThank(gift("F1"), "d", line).ok).toBe(true);
    expect(canThank(gift("F1", { opened_at: null }), "d", line)).toEqual({ ok: false, reason: "not_opened" });
    expect(canThank(gift("F1", { thanks: line }), "d", line)).toEqual({ ok: false, reason: "already_thanked" });
    expect(canThank(gift("F1"), "d", "something rude")).toEqual({ ok: false, reason: "invalid_thanks" });
    expect(canThank(gift("F1"), "m", line)).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("the Flower Vase", () => {
  it("6 flowers fill a vase, which moves to the shelf", () => {
    const { current, shelf } = buildVases(Array.from({ length: 7 }, () => gift("F2")));
    expect(shelf).toHaveLength(1);
    expect(shelf[0].flowers).toHaveLength(6);
    expect(current.flowers).toHaveLength(1);
  });

  it("unopened gifts and non-flowers stay out", () => {
    const { current } = buildVases([gift("F1", { opened_at: null }), gift("S1"), gift("A1")]);
    expect(current.flowers).toHaveLength(0);
  });

  it("a Bouquet adds 3 and spills into the next vase", () => {
    const { current, shelf } = buildVases([...Array.from({ length: 5 }, () => gift("F1")), gift("F9")]);
    expect(shelf).toHaveLength(1);
    expect(current.flowers).toHaveLength(2);
  });

  it("a Garland takes no spot and stays on its vase", () => {
    const { current, shelf } = buildVases([gift("F10"), ...Array.from({ length: 6 }, () => gift("F1"))]);
    expect(shelf[0].garlands).toBe(1);
    expect(shelf[0].flowers).toHaveLength(6);
    expect(current.garlands).toBe(0);
  });
});

describe("gifts that change the app", () => {
  const at = (hours: number) => new Date(new Date("2026-01-12T00:00:00.000Z").getTime() + hours * 3600000);
  const opened = "2026-01-12T00:00:00.000Z";

  it("Crown, Shower and Garland last a day; Beacon lasts a week", () => {
    const gifts = ["A1", "A2", "A3", "F10"].map((c) => gift(c, { opened_at: opened }));
    expect(activeEffects(gifts, ["m", "d"], at(23)).d).toEqual({ shower: true, beacon: true, crown: true, clown: false, garland: true });
    expect(activeEffects(gifts, ["m", "d"], at(25)).d).toEqual({ shower: false, beacon: true, crown: false, clown: false, garland: false });
    expect(activeEffects(gifts, ["m", "d"], at(7 * 24 + 1)).d.beacon).toBe(false);
  });

  it("finds the winner's running Flower Shower only", () => {
    const shower = gift("A1", { opened_at: opened });
    expect(activeShowerId([shower], "d", at(23))).toBe(shower.id);
    expect(activeShowerId([shower], "m", at(23))).toBeNull();
    expect(activeShowerId([shower], "d", at(25))).toBeNull();
    expect(activeShowerId([gift("A1", { opened_at: null })], "d", at(1))).toBeNull();
  });

  it("the Clown Nose goes on the sender, the loser", () => {
    const fx = activeEffects([gift("A4", { opened_at: opened })], ["m", "d"], at(1));
    expect(fx.m.clown).toBe(true);
    expect(fx.d.clown).toBe(false);
  });

  it("nothing happens until it's opened", () => {
    expect(activeEffects([gift("A3", { opened_at: null })], ["m", "d"], at(1)).d.crown).toBe(false);
  });
});

describe("the Monday Newspaper", () => {
  const paper = (s: string) => buildEdition(seq(s), s.length - 1, NAMES);

  it("the real story: re-elected after swapping", () => {
    const e = paper("MDMDMDD");
    expect(e.headline).toBe("MADHULIKA RE-ELECTED!");
    expect(e.subhead).toBe("Mukul's rotation hopes in ruins");
    expect(e.scores[0].name).toBe("Madhulika");
  });

  it("covers a tie, a hat-trick, a dynasty and a new champion", () => {
    expect(paper("M=").headline).toBe("HUNG PARLIAMENT!");
    expect(paper("MMM").headline).toBe("HAT-TRICK FOR MUKUL!");
    expect(paper("DDDDD").headline).toBe("THE MADHULIKA DYNASTY!");
    expect(paper("MD").headline).toBe("MADHULIKA TAKES POWER!");
  });

  it("never prints role titles", () => {
    for (const s of ["MDMDMDD", "M=", "MMM", "DDDDD", "MD"]) {
      expect(JSON.stringify(paper(s))).not.toMatch(/minister/i);
    }
  });

  it("counts a reign", () => {
    expect(reignLength(seq("MDD"), 2)).toBe(2);
    expect(reignLength(seq("M="), 1)).toBe(0);
  });

  it("the challenge line appears on Mondays only", () => {
    expect(weeklyLine(seq("MDD"), NAMES, true)).toEqual({
      defendingChampion: "Madhulika",
      challenge: "Madhulika is going for a Hat-trick. Can Mukul stop it?",
    });
    expect(weeklyLine(seq("MDD"), NAMES, false)).toEqual({ defendingChampion: "Madhulika", challenge: null });
    expect(weeklyLine([], NAMES, true)).toEqual({ defendingChampion: null, challenge: null });
  });
});
