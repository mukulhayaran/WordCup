import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "wordcup_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year "remember this device"

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET environment variable is not set");
  return s;
}

function sign(playerId: string): string {
  return createHmac("sha256", secret()).update(playerId).digest("base64url");
}

/** Builds the signed cookie value "playerId.signature". */
export function buildSessionValue(playerId: string): string {
  return `${playerId}.${sign(playerId)}`;
}

/** Verifies a cookie value and returns the player id, or null if invalid/tampered. */
export function verifySessionValue(value: string): string | null {
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const playerId = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);
  const expected = sign(playerId);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return playerId;
}

export async function setSessionCookie(playerId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, buildSessionValue(playerId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Reads and verifies the session cookie, returning the logged-in player id or null. */
export async function getSessionPlayerId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifySessionValue(raw);
}
