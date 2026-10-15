import { getOrCreateDailyWord } from "./dailyWord";
import {
  submitGuessWith,
  type GameResultRow,
  type GameStore,
  type SubmitGuessResult,
} from "./guessCore";
import { supabaseAdmin } from "./supabaseAdmin";

export type { GameResultRow, GuessRecord, SubmitGuessResult } from "./guessCore";

const COLUMNS = "player_id, game_date, guesses, num_guesses, status, finished_at";

export async function getGameResult(
  playerId: string,
  gameDate: string
): Promise<GameResultRow | null> {
  const { data } = await supabaseAdmin()
    .from("game_results")
    .select(COLUMNS)
    .eq("player_id", playerId)
    .eq("game_date", gameDate)
    .maybeSingle();
  return data ?? null;
}

const supabaseGameStore: GameStore = {
  get: getGameResult,

  async insertFirst(row) {
    const { data, error } = await supabaseAdmin().from("game_results").insert(row).select(COLUMNS).single();
    // 23505 = unique_violation: another request already created today's row.
    if (error?.code === "23505") return "conflict";
    if (error || !data) throw error ?? new Error("Failed to save guess");
    return data;
  },

  async updateIfGuessCount(row, expectedCount) {
    // guess_count is a database-generated column (length of `guesses`), so this
    // update only lands if the board is exactly as we read it.
    const { data, error } = await supabaseAdmin()
      .from("game_results")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("player_id", row.player_id)
      .eq("game_date", row.game_date)
      .eq("status", "in_progress")
      .eq("guess_count", expectedCount)
      .select(COLUMNS);
    if (error) throw error;
    return data && data.length === 1 ? data[0] : "conflict";
  },
};

export function submitGuess(playerId: string, gameDate: string, rawGuess: string): Promise<SubmitGuessResult> {
  return submitGuessWith(
    { store: supabaseGameStore, getSolution: async (d) => (await getOrCreateDailyWord(d)).solution },
    playerId,
    gameDate,
    rawGuess
  );
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
