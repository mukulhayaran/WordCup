import { datesInRange, weekRangeForGameDate } from "./gameDate";
import { weekNumberSince } from "./calendar";
import { isDayRevealed, type FinishStatus } from "./reveal";
import { NOT_PLAYED, scoreDay, type DayOutcome } from "./scoring";
import { supabaseAdmin } from "./supabaseAdmin";
import type { Player } from "./auth";

export type WeekDay = {
  date: string;
  revealed: boolean;
  points: { a: number; b: number };
};

/** Per-day points for [weekStart, weekEnd]; unrevealed days score nothing yet. */
export async function getWeekBreakdown(
  players: [Player, Player],
  weekStart: string,
  weekEnd: string,
  now: Date = new Date()
): Promise<{ totals: { a: number; b: number }; days: WeekDay[] }> {
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

  const totals = { a: 0, b: 0 };
  const days = datesInRange(weekStart, weekEnd).map((date): WeekDay => {
    const entry = byDate.get(date) ?? {};
    const statusA: FinishStatus = entry.aStatus ?? "not_played";
    const statusB: FinishStatus = entry.bStatus ?? "not_played";
    if (!isDayRevealed(date, statusA, statusB, now)) {
      return { date, revealed: false, points: { a: 0, b: 0 } };
    }

    const outcomeA: DayOutcome =
      statusA === "won" || statusA === "lost"
        ? { played: true, solved: statusA === "won", numGuesses: entry.aGuesses ?? null }
        : NOT_PLAYED;
    const outcomeB: DayOutcome =
      statusB === "won" || statusB === "lost"
        ? { played: true, solved: statusB === "won", numGuesses: entry.bGuesses ?? null }
        : NOT_PLAYED;

    const points = scoreDay(outcomeA, outcomeB);
    totals.a += points.a;
    totals.b += points.b;
    return { date, revealed: true, points };
  });

  return { totals, days };
}

/** Live point tally for [weekStart, weekEnd], counting only revealed days. */
export async function getWeekTally(
  players: [Player, Player],
  weekStart: string,
  weekEnd: string,
  now: Date = new Date()
): Promise<{ a: number; b: number }> {
  const { totals } = await getWeekBreakdown(players, weekStart, weekEnd, now);
  return totals;
}

/** 1-based cup number for the week starting `weekStart` (Week 1 = first week anyone played). */
export async function getCupWeekNumber(weekStart: string): Promise<number> {
  const { data: earliest } = await supabaseAdmin()
    .from("game_results")
    .select("game_date")
    .order("game_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!earliest) return 1;
  return weekNumberSince(weekRangeForGameDate(earliest.game_date).weekStart, weekStart);
}
