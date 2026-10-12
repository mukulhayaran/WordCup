import { describe, expect, it } from "vitest";
import { isWinningGuess, scoreGuess, toEmojiRow } from "./feedback";

describe("scoreGuess", () => {
  it("marks exact matches as correct", () => {
    expect(scoreGuess("crane", "crane")).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("marks letters in the wrong position as present", () => {
    // crane = c-r-a-n-e; arose = a-r-o-s-e
    expect(scoreGuess("arose", "crane")).toEqual([
      "present", // a: in crane but at idx 2, not idx 0
      "correct", // r: idx 1 matches both
      "absent", // o: not in crane
      "absent", // s: not in crane
      "correct", // e: idx 4 matches both
    ]);
  });

  it("handles duplicate letters without over-counting", () => {
    // world = w-o-r-l-d; hello = h-e-l-l-o. Only one 'l' in world, so only
    // one of the guess's two 'l's can be marked (the correct-position one).
    expect(scoreGuess("hello", "world")).toEqual([
      "absent", // h: not in world
      "absent", // e: not in world
      "absent", // l: world's only 'l' is at idx 3, already claimed below
      "correct", // l: matches world idx 3 exactly
      "present", // o: in world but at idx 1, not idx 4
    ]);
  });

  it("recognizes a winning guess", () => {
    expect(isWinningGuess(scoreGuess("crane", "crane"))).toBe(true);
    expect(isWinningGuess(scoreGuess("cranf", "crane"))).toBe(false);
  });

  it("renders emoji rows", () => {
    expect(toEmojiRow(scoreGuess("crane", "crane"))).toBe("🟩🟩🟩🟩🟩");
  });
});
