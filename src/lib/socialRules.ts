import type { FinishStatus } from "./reveal";

const finished = (s: FinishStatus) => s === "won" || s === "lost";

// ---- Nudges ----

export type NudgeCheck = { ok: true } | { ok: false; reason: "not_finished" | "they_finished" | "already_nudged" };

/** You can nudge once a day, only after finishing, and only if they haven't. */
export function canNudge(input: {
  senderStatus: FinishStatus;
  recipientStatus: FinishStatus;
  alreadyNudgedToday: boolean;
}): NudgeCheck {
  if (!finished(input.senderStatus)) return { ok: false, reason: "not_finished" };
  if (finished(input.recipientStatus)) return { ok: false, reason: "they_finished" };
  if (input.alreadyNudgedToday) return { ok: false, reason: "already_nudged" };
  return { ok: true };
}

/** The "X nudged you!" banner stays up until the nudged player finishes today's game. */
export function showNudgeBanner(input: { nudgedToday: boolean; recipientStatus: FinishStatus }): boolean {
  return input.nudgedToday && !finished(input.recipientStatus);
}

// ---- Reactions ----

export const REACTIONS = ["heart", "laugh", "fire", "crown"] as const;
export type Reaction = (typeof REACTIONS)[number];

export function isReaction(value: unknown): value is Reaction {
  return typeof value === "string" && (REACTIONS as readonly string[]).includes(value);
}

export type ReactionCheck = { ok: true } | { ok: false; reason: "not_revealed" | "invalid_reaction" };

/** One reaction per player per day on the other's grid (changeable), once the day is revealed. */
export function canReact(input: { revealed: boolean; reaction: unknown }): ReactionCheck {
  if (!isReaction(input.reaction)) return { ok: false, reason: "invalid_reaction" };
  if (!input.revealed) return { ok: false, reason: "not_revealed" };
  return { ok: true };
}

// ---- Winner's message ----

export const MESSAGE_MAX_CHARS = 80;

export type MessageBody = { ok: true; body: string } | { ok: false; reason: "empty" | "too_long" };

/** Trims and length-checks a message. Counts characters the way Postgres does (emoji = 1). */
export function normalizeMessage(raw: unknown): MessageBody {
  const body = typeof raw === "string" ? raw.trim() : "";
  const length = Array.from(body).length;
  if (length === 0) return { ok: false, reason: "empty" };
  if (length > MESSAGE_MAX_CHARS) return { ok: false, reason: "too_long" };
  return { ok: true, body };
}

export type MessageCheck =
  | { ok: true }
  | { ok: false; reason: "not_revealed" | "not_winner" | "already_sent" };

/** Only a player who took the day's point may send one message — on a tie, both can. */
export function canSendMessage(input: {
  revealed: boolean;
  senderPoints: number;
  alreadySent: boolean;
}): MessageCheck {
  if (!input.revealed) return { ok: false, reason: "not_revealed" };
  if (input.senderPoints < 1) return { ok: false, reason: "not_winner" };
  if (input.alreadySent) return { ok: false, reason: "already_sent" };
  return { ok: true };
}
