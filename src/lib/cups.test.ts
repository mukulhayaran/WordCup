import { describe, expect, it } from "vitest";
import {
  buildCabinet,
  cupTotals,
  legacyDateLabel,
  pendingCelebration,
  SHARED,
  trophyNumber,
  type LegacyCup,
  type SiteCup,
} from "./cups";

const whatsapp: LegacyCup[] = [
  { era: "The WhatsApp era", label: "Cup I", winner: "Madhulika", startDate: null, endDate: null, sortOrder: 1 },
  { era: "The WhatsApp era", label: "Cup II", winner: "Madhulika", startDate: null, endDate: null, sortOrder: 2 },
];

const week = (n: number, start: string, end: string, winner: string): SiteCup => ({
  weekNumber: n,
  weekStart: start,
  weekEnd: end,
  winner,
  scores: { Mukul: 2, Madhulika: 4 },
});
const w1 = week(1, "2026-10-12", "2026-10-18", "Madhulika");
const w2 = week(2, "2026-10-19", "2026-10-25", "Mukul");
const w3 = week(3, "2026-10-26", "2026-11-01", SHARED);

describe("cupTotals", () => {
  it("counts legacy cups toward cups won", () => {
    expect(cupTotals(["Mukul", "Madhulika"], whatsapp, [])).toEqual({ won: { Mukul: 0, Madhulika: 2 }, shared: 0 });
  });

  it("adds site cups and counts shared cups separately", () => {
    expect(cupTotals(["Mukul", "Madhulika"], whatsapp, [w1, w2, w3])).toEqual({
      won: { Mukul: 1, Madhulika: 3 },
      shared: 1,
    });
  });
});

describe("trophyNumber", () => {
  it("continues the winner's count after their legacy cups", () => {
    expect(trophyNumber(w1, whatsapp, [w1, w2])).toBe(3); // Madhulika: Cup I, Cup II, then Week 1
    expect(trophyNumber(w2, whatsapp, [w1, w2])).toBe(1); // Mukul's first
  });

  it("numbers a shared cup among all trophies", () => {
    expect(trophyNumber(w3, whatsapp, [w1, w2, w3])).toBe(5);
  });
});

describe("pendingCelebration", () => {
  const base = { siteCups: [w1], legacy: whatsapp, seenWeekStarts: new Set<string>() };

  it("is nothing while the cup is still running", () => {
    expect(pendingCelebration({ ...base, today: "2026-10-18" })).toBeNull(); // Sunday, cup not over
  });

  it("celebrates the cup that ended at Sunday midnight, from Monday on", () => {
    const c = pendingCelebration({ ...base, today: "2026-10-19" });
    expect(c?.weekNumber).toBe(1);
    expect(c?.winner).toBe("Madhulika");
    expect(c?.trophyNumber).toBe(3);
    expect(c?.nextWeekNumber).toBe(2);
    expect(pendingCelebration({ ...base, today: "2026-10-23" })?.weekNumber).toBe(1); // still that week
  });

  it("shows once per player per cup", () => {
    expect(pendingCelebration({ ...base, today: "2026-10-19", seenWeekStarts: new Set(["2026-10-12"]) })).toBeNull();
  });

  it("only celebrates the most recent cup, not older unseen ones", () => {
    expect(pendingCelebration({ ...base, siteCups: [w1, w2], today: "2026-10-26" })?.weekNumber).toBe(2);
  });

  it("skips weeks nobody played (they're not cups)", () => {
    expect(pendingCelebration({ ...base, siteCups: [], today: "2026-10-19" })).toBeNull();
  });
});

describe("legacyDateLabel", () => {
  it("says 'date unknown' when there are no dates", () => {
    expect(legacyDateLabel(null, null)).toBe("date unknown");
  });

  it("formats whatever dates are known", () => {
    expect(legacyDateLabel("2025-03-03", "2025-03-09")).toBe("Mar 3–9, 2025");
    expect(legacyDateLabel("2025-03-03", null)).toBe("from Mar 3, 2025");
    expect(legacyDateLabel(null, "2025-03-09")).toBe("until Mar 9, 2025");
  });
});

describe("buildCabinet", () => {
  it("puts the site era first with an open slot for the current week, then legacy eras", () => {
    const eras = buildCabinet({ siteCups: [w1], current: { weekNumber: 2, weekStart: "2026-10-19" }, legacy: whatsapp });
    expect(eras.map((e) => e.name)).toEqual(["Word Cup era", "The WhatsApp era"]);
    expect(eras[0].meta).toBe("2026");
    expect(eras[0].trophies).toEqual([
      { label: "Week 1", sublabel: "Oct 12–18", winner: "Madhulika" },
      { label: "Week 2", sublabel: "ends Sunday", winner: null },
    ]);
    expect(eras[1].meta).toBe("before the site");
    expect(eras[1].trophies.map((t) => `${t.label} · ${t.sublabel}`)).toEqual([
      "Cup I · date unknown",
      "Cup II · date unknown",
    ]);
  });
});
