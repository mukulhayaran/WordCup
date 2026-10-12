import { describe, expect, it } from "vitest";
import {
  formatWeekRange,
  longestRun,
  msUntilNextGameDay,
  previousDate,
  solveStreak,
  weekdayName,
  weekNumberSince,
} from "./calendar";

describe("weekdayName", () => {
  it("names the weekday of a game date", () => {
    expect(weekdayName("2026-10-13")).toBe("Tuesday");
    expect(weekdayName("2026-10-18")).toBe("Sunday");
  });
});

describe("previousDate", () => {
  it("crosses month and year boundaries", () => {
    expect(previousDate("2026-11-01")).toBe("2026-10-31");
    expect(previousDate("2027-01-01")).toBe("2026-12-31");
  });
});

describe("weekNumberSince", () => {
  it("counts cups from 1", () => {
    expect(weekNumberSince("2026-10-12", "2026-10-12")).toBe(1);
    expect(weekNumberSince("2026-10-12", "2026-10-19")).toBe(2);
    expect(weekNumberSince("2026-10-12", "2026-11-16")).toBe(6);
  });
});

describe("msUntilNextGameDay", () => {
  it("counts down to midnight IST", () => {
    // 2026-10-13T12:30:00Z is 18:00 IST -> 6h until midnight IST.
    expect(msUntilNextGameDay(new Date("2026-10-13T12:30:00Z"))).toBe(6 * 60 * 60 * 1000);
    // 18:29:59 UTC is 23:59:59 IST -> 1 second left.
    expect(msUntilNextGameDay(new Date("2026-10-13T18:29:59Z"))).toBe(1000);
  });
});

describe("formatWeekRange", () => {
  it("formats within and across months", () => {
    expect(formatWeekRange("2026-11-16", "2026-11-22")).toBe("Nov 16–22");
    expect(formatWeekRange("2026-10-26", "2026-11-01")).toBe("Oct 26–Nov 1");
  });
});

describe("solveStreak", () => {
  const won = (game_date: string) => ({ game_date, status: "won" });

  it("counts consecutive solved days ending today", () => {
    expect(solveStreak([won("2026-10-13"), won("2026-10-12"), won("2026-10-10")], "2026-10-13")).toBe(2);
  });

  it("is 0 when today was lost", () => {
    expect(solveStreak([{ game_date: "2026-10-13", status: "lost" }, won("2026-10-12")], "2026-10-13")).toBe(0);
  });

  it("starts from yesterday while today is unfinished", () => {
    expect(solveStreak([{ game_date: "2026-10-13", status: "in_progress" }, won("2026-10-12")], "2026-10-13")).toBe(1);
  });
});

describe("longestRun", () => {
  it("finds the longest run of trues", () => {
    expect(longestRun([true, true, false, true, true, true, false])).toBe(3);
    expect(longestRun([])).toBe(0);
  });
});
