import { NextResponse, connection } from "next/server";
import { getAllPlayers } from "@/lib/auth";
import { avatarSignedUrl } from "@/lib/avatars";
import { weekdayName } from "@/lib/calendar";
import { todayGameDate, weekRangeForGameDate } from "@/lib/gameDate";
import { getPlayerDayStatus } from "@/lib/game";
import { getSessionPlayerId } from "@/lib/session";
import { getCupWeekNumber, getWeekBreakdown } from "@/lib/weekScore";

export async function GET() {
  // Reflects live, per-request game/session state — never prerender this.
  await connection();

  const players = await getAllPlayers();
  const gameDate = todayGameDate();
  const sessionPlayerId = await getSessionPlayerId();
  const { weekStart, weekEnd } = weekRangeForGameDate(gameDate);

  const breakdown =
    players.length === 2
      ? await getWeekBreakdown([players[0], players[1]], weekStart, weekEnd)
      : null;
  const weekScore = breakdown?.totals ?? { a: 0, b: 0 };

  const playersWithStatus = await Promise.all(
    players.map(async (p, i) => {
      const status = await getPlayerDayStatus(p.id, gameDate);
      const avatarUrl = await avatarSignedUrl(p.avatar_photo_path);
      return {
        id: p.id,
        name: p.name,
        roleLabel: p.role_label,
        avatarInitial: p.avatar_initial,
        avatarUrl,
        playedToday: status.played,
        weekPoints: i === 0 ? weekScore.a : weekScore.b,
      };
    })
  );

  // Who took each revealed day's point (both ids on a tie, none if nobody scored).
  const weekDays = (breakdown?.days ?? []).map((d) => ({
    date: d.date,
    winnerIds: d.revealed
      ? [
          ...(d.points.a > 0 ? [players[0].id] : []),
          ...(d.points.b > 0 ? [players[1].id] : []),
        ]
      : null,
  }));

  return NextResponse.json({
    gameDate,
    weekday: weekdayName(gameDate),
    weekNumber: await getCupWeekNumber(weekStart),
    weekStart,
    weekEnd,
    weekScore,
    weekDays,
    players: playersWithStatus,
    sessionPlayerId,
  });
}
