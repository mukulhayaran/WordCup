import type { GuessRecord } from "./apiTypes";
import { isWinningGuess, scoreGuess } from "./feedback";
import { MAX_GUESSES } from "./guessCore";

/** A guess the phone has shown but the server hasn't confirmed saving yet. */
export type PendingGuess = { gameDate: string; index: number; guess: string };

const storageKey = (playerId: string) => `wordcup:pending:${playerId}`;

/** Reads the saved queue; anything missing or unreadable counts as empty. */
export function loadQueue(playerId: string): PendingGuess[] {
  try {
    const raw = window.localStorage.getItem(storageKey(playerId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is PendingGuess =>
        !!p && typeof p.gameDate === "string" && typeof p.index === "number" && typeof p.guess === "string"
    );
  } catch {
    return [];
  }
}

/** Saves the queue; a blocked or full localStorage just means it won't survive a reload. */
export function saveQueue(playerId: string, queue: PendingGuess[]): void {
  try {
    if (queue.length === 0) window.localStorage.removeItem(storageKey(playerId));
    else window.localStorage.setItem(storageKey(playerId), JSON.stringify(queue));
  } catch {
    // Nothing else to do.
  }
}

/** Where a board stands, by the same rules the server uses. */
export function boardStatus(board: GuessRecord[]): "not_started" | "in_progress" | "won" | "lost" {
  if (board.length === 0) return "not_started";
  if (isWinningGuess(board[board.length - 1].feedback)) return "won";
  return board.length >= MAX_GUESSES ? "lost" : "in_progress";
}

/** True if every guess the server has saved is also on the phone's board, in the same place. */
export function boardMatches(serverGuesses: GuessRecord[], localBoard: GuessRecord[]): boolean {
  return (
    serverGuesses.length <= localBoard.length &&
    serverGuesses.every((g, i) => g.guess === localBoard[i].guess)
  );
}

/**
 * Lays the phone's unsaved guesses on top of the server's saved board.
 * Guesses for another day, or already saved, are dropped; the rest must
 * follow on directly from the saved board. If the phone and server disagree
 * about any saved guess, the server wins: "reload".
 */
export function mergeWithServer(
  serverGuesses: GuessRecord[],
  queue: PendingGuess[],
  gameDate: string,
  solution: string
): { board: GuessRecord[]; queue: PendingGuess[] } | "reload" {
  const today = [...queue].filter((p) => p.gameDate === gameDate).sort((a, b) => a.index - b.index);
  const board = [...serverGuesses];
  const remaining: PendingGuess[] = [];

  for (const p of today) {
    if (p.index < serverGuesses.length) {
      if (serverGuesses[p.index].guess !== p.guess) return "reload";
      continue; // already saved
    }
    if (p.index !== board.length) break; // a gap: nothing after it can be placed
    const last = board[board.length - 1];
    if (board.length >= MAX_GUESSES || (last && isWinningGuess(last.feedback))) break; // game already over
    board.push({ guess: p.guess, feedback: scoreGuess(p.guess, solution) });
    remaining.push(p);
  }

  return { board, queue: remaining };
}
