import { NextResponse, connection } from "next/server";
import { getAllPlayers } from "@/lib/auth";
import { avatarSignedUrl } from "@/lib/avatars";
import { todayGameDate, weekRangeForGameDate } from "@/lib/gameDate";
import { getPlayerDayStatus } from "@/lib/game";
import { getSessionPlayerId } from "@/lib/session";
import { getWeekTally } from "@/lib/weekScore";

export async function GET() {
  // Reflects live, per-request game/session state — never prerender this.
  await connection();

  const players = await getAllPlayers();
  const gameDate = todayGameDate();
  const sessionPlayerId = await getSessionPlayerId();

  const playersWithStatus = await Promise.all(
    players.map(async (p) => {
      const status = await getPlayerDayStatus(p.id, gameDate);
      const avatarUrl = await avatarSignedUrl(p.avatar_photo_path);
      return {
        id: p.id,
        name: p.name,
        roleLabel: p.role_label,
        avatarInitial: p.avatar_initial,
        avatarUrl,
        playedToday: status.played,
      };
    })
  );

  // Live tally for the current week, counting only revealed days so far.
  const { weekStart, weekEnd } = weekRangeForGameDate(gameDate);
  const weekScore =
    players.length === 2
      ? await getWeekTally([players[0], players[1]], weekStart, weekEnd)
      : { a: 0, b: 0 };

  return NextResponse.json({
    gameDate,
    weekStart,
    weekEnd,
    weekScore,
    players: playersWithStatus,
    sessionPlayerId,
  });
}
