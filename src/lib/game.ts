import { getOrCreateDailyWord } from "./dailyWord";
import { isWinningGuess, scoreGuess, type LetterStatus } from "./feedback";
import { supabaseAdmin } from "./supabaseAdmin";
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

const MAX_GUESSES = 6;

export async function getGameResult(
  playerId: string,
  gameDate: string
): Promise<GameResultRow | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("game_results")
    .select("player_id, game_date, guesses, num_guesses, status, finished_at")
    .eq("player_id", playerId)
    .eq("game_date", gameDate)
    .maybeSingle();
  return data ?? null;
}

export type SubmitGuessResult =
  | { ok: true; row: GameResultRow; solutionRevealed: string | null }
  | { ok: false; reason: "not_a_word" }
  | { ok: false; reason: "already_finished" };

export async function submitGuess(
  playerId: string,
  gameDate: string,
  rawGuess: string
): Promise<SubmitGuessResult> {
  const guess = rawGuess.trim().toLowerCase();
  if (!isAllowedGuess(guess)) {
    return { ok: false, reason: "not_a_word" };
  }

  const existing = await getGameResult(playerId, gameDate);
  if (existing && existing.status !== "in_progress") {
    return { ok: false, reason: "already_finished" };
  }

  const { solution } = await getOrCreateDailyWord(gameDate);
  const priorGuesses = existing?.guesses ?? [];
  const feedback = scoreGuess(guess, solution);
  const guesses: GuessRecord[] = [...priorGuesses, { guess, feedback }];

  const won = isWinningGuess(feedback);
  const lost = !won && guesses.length >= MAX_GUESSES;
  const status: GameResultRow["status"] = won ? "won" : lost ? "lost" : "in_progress";
  const finished = won || lost;

  const db = supabaseAdmin();
  const { data: row, error } = await db
    .from("game_results")
    .upsert(
      {
        player_id: playerId,
        game_date: gameDate,
        guesses,
        num_guesses: finished ? guesses.length : null,
        status,
        finished_at: finished ? new Date().toISOString() : null,
      },
      { onConflict: "player_id,game_date" }
    )
    .select("player_id, game_date, guesses, num_guesses, status, finished_at")
    .single();

  if (error || !row) throw error ?? new Error("Failed to save guess");

  return {
    ok: true,
    row,
    solutionRevealed: finished ? solution : null,
  };
}

export type PlayerDayStatus = {
  played: boolean; // has a finished (won/lost) result for the day
  inProgress: boolean;
};

export async function getPlayerDayStatus(
  playerId: string,
  gameDate: string
): Promise<PlayerDayStatus> {
  const row = await getGameResult(playerId, gameDate);
  if (!row) return { played: false, inProgress: false };
  return {
    played: row.status !== "in_progress",
    inProgress: row.status === "in_progress",
  };
}
