import { describe, expect, it } from "vitest";
import { BADGES } from "./badgeCatalog";
import {
  chooseBadgePopup,
  computeCupAwards,
  computeDailyAwards,
  countBadges,
  reusedGreyLetter,
  type Award,
  type BadgeCup,
  type BadgeDay,
  type GuessRow,
  type PlayerDay,
} from "./badgeRules";
import { scoreGuess } from "./feedback";

const SOLUTION = "fight";
const rows = (...words: string[]): GuessRow[] => words.map((guess) => ({ guess, feedback: scoreGuess(guess, SOLUTION) }));
const NOON_IST = "2026-11-02T06:30:00.000Z";

const won = (words: string[], finishedAt: string | null = NOON_IST): PlayerDay => ({
  status: "won",
  guesses: rows(...words),
  numGuesses: words.length,
  finishedAt,
});
const lost = (finishedAt: string | null = NOON_IST): PlayerDay => ({
  status: "lost",
  guesses: rows("crane", "moody", "plumb", "vexed", "jazzy", "waltz"),
  numGuesses: null,
  finishedAt,
});

const date = (i: number) => new Date(Date.UTC(2026, 10, 2 + i)).toISOString().slice(0, 10); // Mon Nov 2 + i
const ids = (awards: Award[], side?: "a" | "b") => awards.filter((x) => !side || x.side === side).map((x) => x.badgeId);
const single = (a: PlayerDay | null, b: PlayerDay | null) => computeDailyAwards([{ date: date(0), a, b }]);
const IN_THREE = ["crane", "light", "fight"];
const IN_FOUR = ["crane", "plumb", "light", "fight"];

describe("daily badges: head to head", () => {
  const dayWonBy = (side: "a" | "b", i: number): BadgeDay =>
    side === "a"
      ? { date: date(i), a: won(IN_THREE), b: won(IN_FOUR) }
      : { date: date(i), a: won(IN_FOUR), b: won(IN_THREE) };

  it("awards win-streak badges once each at 2, 3 and 5", () => {
    const awards = computeDailyAwards([0, 1, 2, 3, 4].map((i) => dayWonBy("a", i)));
    for (const id of ["D1", "D2", "D3"]) expect(ids(awards, "a").filter((x) => x === id)).toHaveLength(1);
  });

  it("a tied day pauses a streak instead of ending it", () => {
    const awards = computeDailyAwards([
      dayWonBy("a", 0),
      { date: date(1), a: won(IN_THREE), b: won(IN_THREE) },
      dayWonBy("a", 2),
    ]);
    expect(ids(awards, "a")).toContain("D1");
  });

  it("a loss ends a streak, and ending a run of 3 earns Session Disrupted", () => {
    const awards = computeDailyAwards([dayWonBy("a", 0), dayWonBy("a", 1), dayWonBy("a", 2), dayWonBy("b", 3)]);
    expect(ids(awards, "b")).toContain("D4");
    const short = computeDailyAwards([dayWonBy("a", 0), dayWonBy("a", 1), dayWonBy("b", 2)]);
    expect(ids(short, "b")).not.toContain("D4");
  });

  it("Narrow Vote, Voice Vote, Coalition, Last Party Standing and Walkout", () => {
    expect(ids(single(won(IN_THREE), won(IN_FOUR)), "a")).toContain("D5");
    expect(ids(single(won(["fight"]), won(IN_FOUR)), "a")).toContain("D6");
    const tie = single(won(IN_THREE), won(IN_THREE));
    expect(ids(tie, "a")).toContain("D8");
    expect(ids(tie, "b")).toContain("D8");
    expect(ids(single(won(IN_THREE), lost()), "a")).toContain("D7");
    const both = single(lost(), lost());
    expect(ids(both, "a")).toContain("D9");
    expect(ids(both, "b")).toContain("D9");
  });

  it("beating someone who didn't play is not Last Party Standing", () => {
    const awards = single(won(IN_THREE), null);
    expect(ids(awards, "a")).not.toContain("D7");
    expect(ids(awards, "b")).toContain("D19");
  });
});

describe("daily badges: how you guessed", () => {
  const game = (d: PlayerDay) => ids(single(d, won(IN_FOUR)), "a");

  it("1, 2 and 6 guess solves", () => {
    expect(game(won(["fight"]))).toContain("D10");
    expect(game(won(["light", "fight"]))).toContain("D11");
    expect(game(won(["crane", "plumb", "vexed", "jazzy", "light", "fight"]))).toContain("D15");
  });

  it("Strong Opening Speech needs 3 right on guess 1", () => {
    expect(game(won(["might", "fight"]))).toContain("D12");
    expect(game(won(["crane", "fight"]))).not.toContain("D12");
  });

  it("From the Back Benches needs an all-grey first guess", () => {
    expect(game(won(["crane", "fight"]))).toContain("D13");
    expect(game(won(["light", "fight"]))).not.toContain("D13");
  });

  it("Filibuster means no yellow tiles at all", () => {
    expect(game(won(["crane", "fight"]))).toContain("D14");
    expect(game(won(["thing", "fight"]))).not.toContain("D14");
  });

  it("Stuck in Committee needs 3 guesses on 4 right, then the solve", () => {
    expect(game(won(["light", "might", "sight", "fight"]))).toContain("D16");
    expect(game(won(["crane", "might", "sight", "fight"]))).not.toContain("D16");
  });

  it("Didn't Read the Bill catches a reused grey letter", () => {
    expect(reusedGreyLetter(rows("crane", "crumb"))).toBe(true);
    expect(reusedGreyLetter(rows("crane", "light"))).toBe(false);
  });

  it("a repeated letter that is really in the word doesn't count as grey", () => {
    // The second T of "tatty" is grey, but T is in the word.
    expect(reusedGreyLetter(rows("tatty", "light"))).toBe(false);
  });

  it("Scam Exposed for a fail", () => {
    expect(ids(single(lost(), won(IN_THREE)), "a")).toContain("D18");
  });
});

describe("daily badges: showing up", () => {
  it("uses India time for morning and midnight", () => {
    const at = (iso: string) => ids(single(won(IN_THREE, iso), won(IN_FOUR)), "a");
    expect(at("2026-11-01T19:30:00.000Z")).toContain("D21"); // 1:00 AM IST
    expect(at("2026-11-02T00:30:00.000Z")).toContain("D20"); // 6:00 AM IST
    expect(at("2026-11-02T06:30:00.000Z")).not.toContain("D20"); // noon IST
  });

  it("an unfinished game isn't Absent, and doesn't count as played", () => {
    const started: PlayerDay = { status: "in_progress", guesses: rows("crane"), numGuesses: null, finishedAt: null };
    const awards = ids(single(started, won(IN_THREE)), "a");
    expect(awards).not.toContain("D19");
    expect(awards).not.toContain("D12");
  });

  it("First to Vote on the 5th first finish of a week", () => {
    const days = [0, 1, 2, 3, 4].map((i) => ({
      date: date(i),
      a: won(IN_THREE, `2026-11-0${2 + i}T04:00:00.000Z`),
      b: won(IN_FOUR, `2026-11-0${2 + i}T08:00:00.000Z`),
    }));
    expect(ids(computeDailyAwards(days), "a").filter((x) => x === "D22")).toHaveLength(1);
    expect(ids(computeDailyAwards(days.slice(0, 4)), "a")).not.toContain("D22");
  });

  it("Full Attendance, Clean Record and Senior Leader", () => {
    const make = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
        a: won(IN_THREE),
        b: won(IN_THREE),
      }));
    const awards = computeDailyAwards(make(100));
    expect(ids(awards, "a").filter((x) => x === "D24")).toHaveLength(10);
    expect(ids(awards, "a").filter((x) => x === "D23")).toHaveLength(3);
    expect(ids(awards, "a").filter((x) => x === "D25")).toHaveLength(1);
  });
});

describe("weekly cup badges", () => {
  const cup = (i: number, winner: "a" | "b" | "tie", a = 4, b = 2, days?: Array<{ a: number; b: number }>): BadgeCup => ({
    weekStart: `w${i}`,
    weekEnd: new Date(Date.UTC(2026, 0, 4 + i * 7)).toISOString().slice(0, 10),
    a: winner === "b" ? b : a,
    b: winner === "b" ? a : b,
    winner,
    days: days ?? Array(7).fill({ a: 0, b: 0 }),
  });
  const seq = (s: string) => s.split("").map((w, i) => cup(i, w === "=" ? "tie" : (w as "a" | "b")));

  it("Re-elected, Hat-trick and Dynasty", () => {
    const awards = ids(computeCupAwards(seq("aaaaa")), "a");
    for (const id of ["W1", "W2", "W3"]) expect(awards.filter((x) => x === id)).toHaveLength(1);
  });

  it("the real story: swapping until one player wins twice", () => {
    const awards = computeCupAwards(seq("abababb"));
    expect(ids(awards, "b")).toContain("W1");
    expect(ids(awards, "b")).toContain("W5");
    expect(ids(awards, "a")).toContain("W4");
    expect(ids(awards, "b")).toContain("W4");
  });

  it("no Anti-Rotation without a run of swaps", () => {
    expect(ids(computeCupAwards(seq("abb")), "b")).not.toContain("W5");
  });

  it("Anti-Incumbency, Back in Power and No-Confidence", () => {
    expect(ids(computeCupAwards(seq("ab")), "b")).toContain("W6");
    expect(ids(computeCupAwards(seq("aba")), "a")).toContain("W7");
    expect(ids(computeCupAwards(seq("aaab")), "b")).toContain("W8");
    expect(ids(computeCupAwards(seq("aab")), "b")).not.toContain("W8");
  });

  it("a tied cup gives both Hung Parliament and ends a streak", () => {
    const awards = computeCupAwards(seq("a=a"));
    expect(ids(awards, "a")).toContain("W14");
    expect(ids(awards, "b")).toContain("W14");
    expect(ids(awards, "a")).not.toContain("W1");
  });

  it("margins and Deposit Forfeited", () => {
    expect(ids(computeCupAwards([cup(0, "a", 5, 1)]), "a")).toContain("W9");
    expect(ids(computeCupAwards([cup(0, "a", 7, 0)]), "a")).toContain("W10");
    expect(ids(computeCupAwards([cup(0, "a", 4, 3)]), "a")).toContain("W11");
    expect(ids(computeCupAwards([cup(0, "a", 5, 1)]), "b")).toContain("W15");
    expect(ids(computeCupAwards([cup(0, "a", 5, 2)]), "b")).not.toContain("W15");
  });

  it("Exit Polls and The Coup read the week day by day", () => {
    const comeback = [
      { a: 0, b: 1 },
      { a: 0, b: 1 },
      { a: 1, b: 0 },
      { a: 0, b: 0 },
      { a: 0, b: 0 },
      { a: 1, b: 0 },
      { a: 1, b: 0 },
    ];
    const awards = ids(computeCupAwards([cup(0, "a", 3, 2, comeback)]), "a");
    expect(awards).toContain("W12");
    expect(awards).toContain("W13");
  });
});

describe("badge pop-ups", () => {
  const a = (badgeId: string, d: string, side: "a" | "b" = "a"): Award => ({ badgeId, side, date: d, key: `${badgeId}:${side}:${d}` });

  it("shows only the rarest new badge, and clears the rest with it", () => {
    const popup = chooseBadgePopup([a("D5", "2026-11-03"), a("D10", "2026-11-03"), a("D11", "2026-11-03")], "a", "2026-11-01", new Set());
    expect(popup?.award.badgeId).toBe("D10");
    expect(popup?.keys).toHaveLength(3);
  });

  it("no flood for past games on launch day", () => {
    expect(chooseBadgePopup([a("D10", "2026-10-01")], "a", "2026-11-01", new Set())).toBeNull();
  });

  it("ignores seen badges and the other player's", () => {
    const seen = a("D5", "2026-11-03");
    expect(chooseBadgePopup([seen, a("D10", "2026-11-03", "b")], "a", "2026-11-01", new Set([seen.key]))).toBeNull();
  });

  it("counts repeats per side", () => {
    expect(countBadges([a("D5", "x"), a("D5", "y"), a("D5", "z", "b")], "a")).toEqual({ D5: 2 });
  });

  it("has all 40 badges with unique ids", () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(40);
  });
});
