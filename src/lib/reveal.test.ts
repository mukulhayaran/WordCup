import { describe, expect, it } from "vitest";
import { isDayRevealed } from "./reveal";

describe("isDayRevealed", () => {
  const today = new Date("2026-03-04T10:00:00Z"); // IST ~15:30, same game-date

  it("is hidden while either player hasn't finished and the day isn't over", () => {
    expect(isDayRevealed("2026-03-04", "won", "in_progress", today)).toBe(false);
    expect(isDayRevealed("2026-03-04", "not_played", "won", today)).toBe(false);
  });

  it("is revealed once both players have finished (won/lost), even if today", () => {
    expect(isDayRevealed("2026-03-04", "won", "lost", today)).toBe(true);
    expect(isDayRevealed("2026-03-04", "lost", "lost", today)).toBe(true);
  });

  it("is revealed once the game-day is over, regardless of status", () => {
    expect(isDayRevealed("2026-03-03", "in_progress", "not_played", today)).toBe(true);
    expect(isDayRevealed("2026-03-03", "not_played", "not_played", today)).toBe(true);
  });
});
