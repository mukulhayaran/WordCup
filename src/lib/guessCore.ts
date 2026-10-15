import { isWinningGuess, scoreGuess, type LetterStatus } from "./feedback";
import { isAllowedGuess } from "./words";

export type GuessRecord = { guess: string; feedback: LetterStatus[] };

export type GameResultRow = {
  player_id: string;
  game_date: string;
  guesses: GuessRecord[];
  num_guesses: number | null;
  status: "in_progress" | "won" | "lost";
  finished_at: string | null;
};

export const MAX_GUESSES = 6;

/**
 * Storage for game rows. Writes are compare-and-swap: they only apply if
 * nobody else changed the row since it was read, and return "conflict"
 * otherwise. This is what stops a double-tapped Enter or a second tab from
 * overwriting a guess or sneaking in a 7th.
 */
export interface GameStore {
  get(playerId: string, gameDate: string): Promise<GameResultRow | null>;
  /** Creates the row for a first guess; "conflict" if it already exists. */
  insertFirst(row: GameResultRow): Promise<GameResultRow | "conflict">;
  /** Updates only if the stored row still has `expectedCount` guesses and is in progress. */
  updateIfGuessCount(row: GameResultRow, expectedCount: number): Promise<GameResultRow | "conflict">;
}

export type SubmitGuessResult =
  | { ok: true; row: GameResultRow; solutionRevealed: string | null }
  | { ok: false; reason: "not_a_word" | "already_finished" | "conflict" };

export async function submitGuessWith(
  deps: { store: GameStore; getSolution: (gameDate: string) => Promise<string>; now?: () => Date },
  playerId: string,
  gameDate: string,
  rawGuess: string
): Promise<SubmitGuessResult> {
  const guess = rawGuess.trim().toLowerCase();
  if (!isAllowedGuess(guess)) return { ok: false, reason: "not_a_word" };

  const existing = await deps.store.get(playerId, gameDate);
  if (existing && existing.status !== "in_progress") return { ok: false, reason: "already_finished" };

  const priorGuesses = existing?.guesses ?? [];
  if (priorGuesses.length >= MAX_GUESSES) return { ok: false, reason: "already_finished" };

  const solution = await deps.getSolution(gameDate);
  const feedback = scoreGuess(guess, solution);
  const guesses: GuessRecord[] = [...priorGuesses, { guess, feedback }];

  const won = isWinningGuess(feedback);
  const lost = !won && guesses.length >= MAX_GUESSES;
  const finished = won || lost;
  const next: GameResultRow = {
    player_id: playerId,
    game_date: gameDate,
    guesses,
    num_guesses: finished ? guesses.length : null,
    status: won ? "won" : lost ? "lost" : "in_progress",
    finished_at: finished ? (deps.now?.() ?? new Date()).toISOString() : null,
  };

  const saved = existing
    ? await deps.store.updateIfGuessCount(next, priorGuesses.length)
    : await deps.store.insertFirst(next);
  if (saved === "conflict") return { ok: false, reason: "conflict" };

  return { ok: true, row: saved, solutionRevealed: finished ? solution : null };
}
