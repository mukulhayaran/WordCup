import { NextResponse, connection } from "next/server";
import { getAllPlayers, type Player } from "@/lib/auth";
import { avatarUrlFor } from "@/lib/avatars";
import { previousDate, weekdayName } from "@/lib/calendar";
import { pendingCelebration } from "@/lib/cups";
import { getCupsOverview } from "@/lib/cupsData";
import { todayGameDate, weekRangeForGameDate } from "@/lib/gameDate";
import { getGameResult } from "@/lib/game";
import { getSessionPlayerId } from "@/lib/session";
import { hasNudged, seenCelebrations, unreadMessagesTo } from "@/lib/social";
import { showNudgeBanner } from "@/lib/socialRules";
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

  const rows = await Promise.all(players.map((p) => getGameResult(p.id, gameDate)));
  const playersWithStatus = await Promise.all(
    players.map(async (p, i) => ({
      id: p.id,
      name: p.name,
      roleLabel: p.role_label,
      avatarInitial: p.avatar_initial,
      avatarUrl: await avatarUrlFor(p),
      playedToday: !!rows[i] && rows[i]!.status !== "in_progress",
      weekPoints: i === 0 ? weekScore.a : weekScore.b,
    }))
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

  const you = players.find((p) => p.id === sessionPlayerId);
  const them = players.find((p) => p.id !== sessionPlayerId);

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
    // Private to the logged-in player; null for anyone not logged in.
    forYou: you && them ? await forPlayer(you, them, gameDate, weekStart, rows[players.indexOf(you)]?.status) : null,
  });
}

async function forPlayer(
  you: Player,
  them: Player,
  gameDate: string,
  weekStart: string,
  yourStatus: "in_progress" | "won" | "lost" | undefined
) {
  const [nudged, messages, seen] = await Promise.all([
    hasNudged(them.id, gameDate),
    unreadMessagesTo(you.id),
    seenCelebrations(you.id),
  ]);

  // Only load the (heavier) cup history if last week's cup hasn't been celebrated yet.
  const lastWeekStart = weekRangeForGameDate(previousDate(weekStart)).weekStart;
  const celebration = seen.has(lastWeekStart)
    ? null
    : await getCupsOverview().then(({ siteCups, legacy }) =>
        pendingCelebration({ today: gameDate, siteCups, legacy, seenWeekStarts: seen })
      );

  return {
    nudgeFrom: showNudgeBanner({ nudgedToday: nudged, recipientStatus: yourStatus ?? "not_played" }) ? them.name : null,
    messages: messages.map((m) => ({ id: m.id, fromName: them.name, gameDate: m.game_date, body: m.body })),
    celebration,
  };
}
