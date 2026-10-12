import { describe, expect, it } from "vitest";
import {
  afterFailedAttempt,
  afterSuccessfulAttempt,
  isLocked,
  minutesRemaining,
} from "./pinLockout";

describe("isLocked", () => {
  it("is false when there is no lock", () => {
    expect(isLocked(null)).toBe(false);
  });

  it("is true while lockedUntil is in the future", () => {
    const now = new Date("2026-03-04T10:00:00Z");
    const future = new Date("2026-03-04T10:03:00Z").toISOString();
    expect(isLocked(future, now)).toBe(true);
  });

  it("is false once lockedUntil has passed", () => {
    const now = new Date("2026-03-04T10:10:00Z");
    const past = new Date("2026-03-04T10:03:00Z").toISOString();
    expect(isLocked(past, now)).toBe(false);
  });
});

describe("afterFailedAttempt", () => {
  it("just increments below the max", () => {
    const now = new Date("2026-03-04T10:00:00Z");
    expect(afterFailedAttempt(0, now)).toEqual({
      failedPinAttempts: 1,
      lockedUntil: null,
    });
    expect(afterFailedAttempt(3, now)).toEqual({
      failedPinAttempts: 4,
      lockedUntil: null,
    });
  });

  it("locks for 5 minutes on the 5th consecutive failure", () => {
    const now = new Date("2026-03-04T10:00:00Z");
    const result = afterFailedAttempt(4, now);
    expect(result.failedPinAttempts).toBe(0);
    expect(result.lockedUntil).toBe(
      new Date("2026-03-04T10:05:00Z").toISOString()
    );
  });
});

describe("afterSuccessfulAttempt", () => {
  it("clears attempts and lock", () => {
    expect(afterSuccessfulAttempt()).toEqual({
      failedPinAttempts: 0,
      lockedUntil: null,
    });
  });
});

describe("minutesRemaining", () => {
  it("rounds up to the next whole minute", () => {
    const now = new Date("2026-03-04T10:00:00Z");
    const lockedUntil = new Date("2026-03-04T10:04:30Z").toISOString();
    expect(minutesRemaining(lockedUntil, now)).toBe(5);
  });

  it("is 0 when not locked", () => {
    expect(minutesRemaining(null)).toBe(0);
  });
});
