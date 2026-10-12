import { isDayRevealed, type FinishStatus } from "./reveal";
import { NOT_PLAYED, scoreDay, type DayOutcome } from "./scoring";
import { supabaseAdmin } from "./supabaseAdmin";
import type { Player } from "./auth";

/** Live point tally for [weekStart, weekEnd], counting only revealed days. */
export async function getWeekTally(
  players: [Player, Player],
  weekStart: string,
  weekEnd: string,
  now: Date = new Date()
): Promise<{ a: number; b: number }> {
  const [a, b] = players;
  const db = supabaseAdmin();
  const { data: rows } = await db
    .from("game_results")
    .select("player_id, game_date, num_guesses, status")
    .gte("game_date", weekStart)
    .lte("game_date", weekEnd);

  type Entry = {
    aStatus?: FinishStatus;
    bStatus?: FinishStatus;
    aGuesses?: number | null;
    bGuesses?: number | null;
  };
  const byDate = new Map<string, Entry>();
  for (const row of rows ?? []) {
    const entry = byDate.get(row.game_date) ?? {};
    if (row.player_id === a.id) {
      entry.aStatus = row.status;
      entry.aGuesses = row.num_guesses;
    }
    if (row.player_id === b.id) {
      entry.bStatus = row.status;
      entry.bGuesses = row.num_guesses;
    }
    byDate.set(row.game_date, entry);
  }

  let totalA = 0;
  let totalB = 0;
  for (const [date, entry] of byDate) {
    const statusA: FinishStatus = entry.aStatus ?? "not_played";
    const statusB: FinishStatus = entry.bStatus ?? "not_played";
    if (!isDayRevealed(date, statusA, statusB, now)) continue;

    const outcomeA: DayOutcome =
      statusA === "won" || statusA === "lost"
        ? { played: true, solved: statusA === "won", numGuesses: entry.aGuesses ?? null }
        : NOT_PLAYED;
    const outcomeB: DayOutcome =
      statusB === "won" || statusB === "lost"
        ? { played: true, solved: statusB === "won", numGuesses: entry.bGuesses ?? null }
        : NOT_PLAYED;

    const points = scoreDay(outcomeA, outcomeB);
    totalA += points.a;
    totalB += points.b;
  }

  return { a: totalA, b: totalB };
}
