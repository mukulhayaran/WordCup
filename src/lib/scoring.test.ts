import { describe, expect, it } from "vitest";
import { NOT_PLAYED, scoreDay, tallyCup, type DayOutcome } from "./scoring";

function solved(numGuesses: number): DayOutcome {
  return { played: true, solved: true, numGuesses };
}
function failed(): DayOutcome {
  return { played: true, solved: false, numGuesses: null };
}

describe("scoreDay", () => {
  it("fewer guesses wins the day's point", () => {
    expect(scoreDay(solved(3), solved(5))).toEqual({ a: 1, b: 0 });
    expect(scoreDay(solved(5), solved(3))).toEqual({ a: 0, b: 1 });
  });

  it("a tie (same guess count) gives both players a point", () => {
    expect(scoreDay(solved(4), solved(4))).toEqual({ a: 1, b: 1 });
  });

  it("a fail loses to any solve", () => {
    expect(scoreDay(failed(), solved(6))).toEqual({ a: 0, b: 1 });
    expect(scoreDay(solved(1), failed())).toEqual({ a: 1, b: 0 });
  });

  it("both failing scores nothing", () => {
    expect(scoreDay(failed(), failed())).toEqual({ a: 0, b: 0 });
  });

  it("not playing counts as a fail", () => {
    expect(scoreDay(NOT_PLAYED, solved(6))).toEqual({ a: 0, b: 1 });
    expect(scoreDay(NOT_PLAYED, NOT_PLAYED)).toEqual({ a: 0, b: 0 });
    expect(scoreDay(NOT_PLAYED, failed())).toEqual({ a: 0, b: 0 });
  });
});

describe("tallyCup", () => {
  it("sums a week of days into a cup tally", () => {
    const days = [
      { a: solved(2), b: solved(4) }, // a +1
      { a: solved(3), b: solved(3) }, // tie, both +1
      { a: failed(), b: solved(5) }, // b +1
      { a: NOT_PLAYED, b: solved(6) }, // b +1 (a didn't play, counts as fail)
    ];
    const result = tallyCup(days);
    expect(result).toEqual({ a: 2, b: 3, champion: "b" });
  });

  it("declares shared champions on an equal-score week", () => {
    const days = [
      { a: solved(2), b: solved(5) }, // a +1
      { a: solved(5), b: solved(2) }, // b +1
    ];
    expect(tallyCup(days).champion).toBe("tie");
  });
});
