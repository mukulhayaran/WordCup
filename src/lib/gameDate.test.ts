import { describe, expect, it } from "vitest";
import { datesInRange, isGameDateOver, todayGameDate, weekRangeForGameDate } from "./gameDate";

describe("todayGameDate", () => {
  it("uses Asia/Kolkata, which is ahead of UTC", () => {
    // 2026-03-01T19:00:00Z is 2026-03-02 00:30 IST (UTC+5:30) -> already next day in IST.
    const utcLateNight = new Date("2026-03-01T19:00:00Z");
    expect(todayGameDate(utcLateNight)).toBe("2026-03-02");

    // 2026-03-01T17:00:00Z is 2026-03-01 22:30 IST -> still same day in IST.
    const utcEvening = new Date("2026-03-01T17:00:00Z");
    expect(todayGameDate(utcEvening)).toBe("2026-03-01");
  });
});

describe("weekRangeForGameDate", () => {
  it("returns the Monday..Sunday range containing the date", () => {
    // 2026-03-04 is a Wednesday.
    expect(weekRangeForGameDate("2026-03-04")).toEqual({
      weekStart: "2026-03-02", // Monday
      weekEnd: "2026-03-08", // Sunday
    });
  });

  it("handles a Monday and a Sunday correctly", () => {
    expect(weekRangeForGameDate("2026-03-02")).toEqual({
      weekStart: "2026-03-02",
      weekEnd: "2026-03-08",
    });
    expect(weekRangeForGameDate("2026-03-08")).toEqual({
      weekStart: "2026-03-02",
      weekEnd: "2026-03-08",
    });
  });
});

describe("datesInRange", () => {
  it("lists every date inclusive", () => {
    expect(datesInRange("2026-03-02", "2026-03-05")).toEqual([
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
    ]);
  });
});

describe("isGameDateOver", () => {
  it("is true only for dates strictly before today", () => {
    const now = new Date("2026-03-05T12:00:00Z");
    expect(isGameDateOver("2026-03-04", now)).toBe(true);
    expect(isGameDateOver(todayGameDate(now), now)).toBe(false);
  });
});
