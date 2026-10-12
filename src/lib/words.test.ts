import { describe, expect, it } from "vitest";
import { fallbackAnswerForDate, isAllowedGuess } from "./words";

describe("isAllowedGuess", () => {
  it("accepts a common 5-letter word", () => {
    expect(isAllowedGuess("crane")).toBe(true);
    expect(isAllowedGuess("CRANE")).toBe(true);
  });

  it("rejects non-words and wrong lengths", () => {
    expect(isAllowedGuess("zzzzz")).toBe(false);
    expect(isAllowedGuess("cran")).toBe(false);
  });
});

describe("fallbackAnswerForDate", () => {
  it("is deterministic for the same date", () => {
    expect(fallbackAnswerForDate("2026-03-04")).toBe(
      fallbackAnswerForDate("2026-03-04")
    );
  });

  it("returns a 5-letter lowercase word", () => {
    const word = fallbackAnswerForDate("2026-01-01");
    expect(word).toMatch(/^[a-z]{5}$/);
  });

  it("varies across different dates", () => {
    const words = new Set(
      ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"].map(
        fallbackAnswerForDate
      )
    );
    expect(words.size).toBeGreaterThan(1);
  });
});
