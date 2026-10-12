export const MAX_PIN_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 5;

/** True if `lockedUntil` is set and still in the future relative to `now`. */
export function isLocked(lockedUntil: string | null, now: Date = new Date()): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil).getTime() > now.getTime();
}

/** Minutes remaining until the lock expires, rounded up (0 if not locked). */
export function minutesRemaining(lockedUntil: string | null, now: Date = new Date()): number {
  if (!isLocked(lockedUntil, now)) return 0;
  const ms = new Date(lockedUntil as string).getTime() - now.getTime();
  return Math.ceil(ms / 60000);
}

/**
 * Given the current failed-attempt count, decides the new state after one
 * more wrong PIN: either just increments, or (on hitting the max) locks the
 * account for LOCKOUT_MINUTES and resets the counter for next time.
 */
export function afterFailedAttempt(
  currentFailedAttempts: number,
  now: Date = new Date()
): { failedPinAttempts: number; lockedUntil: string | null } {
  const next = currentFailedAttempts + 1;
  if (next >= MAX_PIN_ATTEMPTS) {
    const lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60000);
    return { failedPinAttempts: 0, lockedUntil: lockedUntil.toISOString() };
  }
  return { failedPinAttempts: next, lockedUntil: null };
}

/** State to write after a successful login: clears attempts and any lock. */
export function afterSuccessfulAttempt(): {
  failedPinAttempts: number;
  lockedUntil: null;
} {
  return { failedPinAttempts: 0, lockedUntil: null };
}
