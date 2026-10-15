import { describe, expect, it } from "vitest";
import { NOT_PLAYED, scoreDay, type DayOutcome } from "./scoring";
import {
  canNudge,
  canReact,
  canSendMessage,
  isReaction,
  MESSAGE_MAX_CHARS,
  normalizeMessage,
  REACTIONS,
  showNudgeBanner,
} from "./socialRules";

const solved = (numGuesses: number): DayOutcome => ({ played: true, solved: true, numGuesses });

describe("canNudge", () => {
  it("allows a nudge once you've finished and they haven't", () => {
    expect(canNudge({ senderStatus: "won", recipientStatus: "not_played", alreadyNudgedToday: false })).toEqual({ ok: true });
    expect(canNudge({ senderStatus: "lost", recipientStatus: "in_progress", alreadyNudgedToday: false })).toEqual({ ok: true });
  });

  it("refuses if you haven't finished yet", () => {
    expect(canNudge({ senderStatus: "in_progress", recipientStatus: "not_played", alreadyNudgedToday: false })).toEqual({
      ok: false,
      reason: "not_finished",
    });
    expect(canNudge({ senderStatus: "not_played", recipientStatus: "not_played", alreadyNudgedToday: false }).ok).toBe(false);
  });

  it("refuses if they've already finished", () => {
    expect(canNudge({ senderStatus: "won", recipientStatus: "lost", alreadyNudgedToday: false })).toEqual({
      ok: false,
      reason: "they_finished",
    });
  });

  it("allows at most one nudge per day", () => {
    expect(canNudge({ senderStatus: "won", recipientStatus: "not_played", alreadyNudgedToday: true })).toEqual({
      ok: false,
      reason: "already_nudged",
    });
  });
});

describe("showNudgeBanner", () => {
  it("shows until the nudged player finishes", () => {
    expect(showNudgeBanner({ nudgedToday: true, recipientStatus: "not_played" })).toBe(true);
    expect(showNudgeBanner({ nudgedToday: true, recipientStatus: "in_progress" })).toBe(true);
    expect(showNudgeBanner({ nudgedToday: true, recipientStatus: "won" })).toBe(false);
    expect(showNudgeBanner({ nudgedToday: false, recipientStatus: "not_played" })).toBe(false);
  });
});

describe("reactions", () => {
  it("has exactly heart, laugh, fire, crown", () => {
    expect([...REACTIONS]).toEqual(["heart", "laugh", "fire", "crown"]);
    expect(isReaction("fire")).toBe(true);
    expect(isReaction("poop")).toBe(false);
  });

  it("only allows reacting once the day is revealed", () => {
    expect(canReact({ revealed: true, reaction: "heart" })).toEqual({ ok: true });
    expect(canReact({ revealed: false, reaction: "heart" })).toEqual({ ok: false, reason: "not_revealed" });
  });

  it("rejects unknown reactions", () => {
    expect(canReact({ revealed: true, reaction: "thumbs" })).toEqual({ ok: false, reason: "invalid_reaction" });
  });
});

describe("normalizeMessage", () => {
  it("trims and accepts up to 80 characters", () => {
    expect(normalizeMessage("  well played  ")).toEqual({ ok: true, body: "well played" });
    expect(normalizeMessage("a".repeat(MESSAGE_MAX_CHARS)).ok).toBe(true);
  });

  it("rejects empty and over-long messages", () => {
    expect(normalizeMessage("   ")).toEqual({ ok: false, reason: "empty" });
    expect(normalizeMessage("a".repeat(MESSAGE_MAX_CHARS + 1))).toEqual({ ok: false, reason: "too_long" });
  });

  it("counts an emoji as one character", () => {
    expect(normalizeMessage("🏆".repeat(MESSAGE_MAX_CHARS)).ok).toBe(true);
  });
});

describe("canSendMessage", () => {
  it("lets the day's winner send one message after the reveal", () => {
    expect(canSendMessage({ revealed: true, senderPoints: 1, alreadySent: false })).toEqual({ ok: true });
  });

  it("lets both players send on a tie", () => {
    const points = scoreDay(solved(4), solved(4));
    expect(canSendMessage({ revealed: true, senderPoints: points.a, alreadySent: false }).ok).toBe(true);
    expect(canSendMessage({ revealed: true, senderPoints: points.b, alreadySent: false }).ok).toBe(true);
  });

  it("blocks the loser", () => {
    const points = scoreDay(solved(3), solved(5));
    expect(canSendMessage({ revealed: true, senderPoints: points.b, alreadySent: false })).toEqual({
      ok: false,
      reason: "not_winner",
    });
  });

  it("blocks everyone when nobody scored", () => {
    const points = scoreDay(NOT_PLAYED, { played: true, solved: false, numGuesses: null });
    expect(canSendMessage({ revealed: true, senderPoints: points.a, alreadySent: false }).ok).toBe(false);
    expect(canSendMessage({ revealed: true, senderPoints: points.b, alreadySent: false }).ok).toBe(false);
  });

  it("blocks before the reveal and after one message", () => {
    expect(canSendMessage({ revealed: false, senderPoints: 1, alreadySent: false })).toEqual({
      ok: false,
      reason: "not_revealed",
    });
    expect(canSendMessage({ revealed: true, senderPoints: 1, alreadySent: true })).toEqual({
      ok: false,
      reason: "already_sent",
    });
  });
});
