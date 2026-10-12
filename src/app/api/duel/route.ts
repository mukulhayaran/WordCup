import { NextResponse, connection } from "next/server";
import { getAllPlayers } from "@/lib/auth";
import { avatarSignedUrl } from "@/lib/avatars";
import { weekdayName } from "@/lib/calendar";
import { todayGameDate, weekRangeForGameDate } from "@/lib/gameDate";
import { getGameResult } from "@/lib/game";
import { isDayRevealed, type FinishStatus } from "@/lib/reveal";
import { getSessionPlayerId } from "@/lib/session";
import { getCupWeekNumber, getWeekBreakdown } from "@/lib/weekScore";

/** Today's head-to-head. Grids are only returned once the day is revealed. */
export async function GET() {
  await connection();

  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });
  }

  const players = await getAllPlayers();
  if (players.length !== 2) {
    return NextResponse.json({ ok: false, reason: "players_not_set_up" }, { status: 500 });
  }
  const [a, b] = players;
  const gameDate = todayGameDate();
  const [rowA, rowB] = await Promise.all([getGameResult(a.id, gameDate), getGameResult(b.id, gameDate)]);
  const statusA: FinishStatus = rowA?.status ?? "not_played";
  const statusB: FinishStatus = rowB?.status ?? "not_played";

  if (!isDayRevealed(gameDate, statusA, statusB)) {
    return NextResponse.json({ ok: true, revealed: false });
  }

  const { weekStart, weekEnd } = weekRangeForGameDate(gameDate);
  const { totals, days } = await getWeekBreakdown([a, b], weekStart, weekEnd);
  const today = days.find((d) => d.date === gameDate);

  const card = async (
    p: (typeof players)[number],
    row: typeof rowA,
    status: FinishStatus,
    points: number,
    weekPoints: number
  ) => ({
    id: p.id,
    name: p.name,
    roleLabel: p.role_label,
    avatarInitial: p.avatar_initial,
    avatarUrl: await avatarSignedUrl(p.avatar_photo_path),
    status,
    numGuesses: row?.num_guesses ?? null,
    // Colours only — no letters, matching the shareable emoji grid.
    rows: row ? row.guesses.map((g) => g.feedback) : [],
    points,
    weekPoints,
  });

  return NextResponse.json({
    ok: true,
    revealed: true,
    youId: playerId,
    gameDate,
    weekday: weekdayName(gameDate),
    weekNumber: await getCupWeekNumber(weekStart),
    players: [
      await card(a, rowA, statusA, today?.points.a ?? 0, totals.a),
      await card(b, rowB, statusB, today?.points.b ?? 0, totals.b),
    ],
  });
}
