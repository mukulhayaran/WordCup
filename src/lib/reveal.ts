import { isGameDateOver } from "./gameDate";

export type FinishStatus = "not_played" | "in_progress" | "won" | "lost";

/**
 * A day's results become visible to history/status once both players have
 * finished (won or lost), or once the game-day itself is over (at which
 * point nobody can submit any more guesses, so there's nothing left to hide).
 */
export function isDayRevealed(
  gameDate: string,
  statusA: FinishStatus,
  statusB: FinishStatus,
  now: Date = new Date()
): boolean {
  const bothFinished =
    (statusA === "won" || statusA === "lost") &&
    (statusB === "won" || statusB === "lost");
  return bothFinished || isGameDateOver(gameDate, now);
}
