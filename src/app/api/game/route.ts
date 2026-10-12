import { NextResponse, connection } from "next/server";
import { todayGameDate } from "@/lib/gameDate";
import { getGameResult, getPlayerDayStatus } from "@/lib/game";
import { getAllPlayers } from "@/lib/auth";
import { getSessionPlayerId } from "@/lib/session";
import { getOrCreateDailyWord } from "@/lib/dailyWord";
import { solveStreak } from "@/lib/calendar";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  await connection();

  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });
  }

  const gameDate = todayGameDate();
  const row = await getGameResult(playerId, gameDate);

  const players = await getAllPlayers();
  const you = players.find((p) => p.id === playerId) ?? null;
  const opponent = players.find((p) => p.id !== playerId) ?? null;
  const opponentStatus = opponent
    ? await getPlayerDayStatus(opponent.id, gameDate)
    : { played: false, inProgress: false };

  const finished = row?.status === "won" || row?.status === "lost";

  // The answer is only ever sent once this player's own game is over.
  const solution = finished ? (await getOrCreateDailyWord(gameDate)).solution : null;

  const { data: recent } = await supabaseAdmin()
    .from("game_results")
    .select("game_date, status")
    .eq("player_id", playerId)
    .order("game_date", { ascending: false })
    .limit(400);

  return NextResponse.json({
    gameDate,
    status: row?.status ?? "not_started",
    guesses: row?.guesses ?? [],
    numGuesses: row?.num_guesses ?? null,
    opponentPlayedToday: opponentStatus.played,
    opponentName: opponent?.name ?? null,
    finished,
    solution,
    solveStreak: solveStreak(recent ?? [], gameDate),
    you: you ? { id: you.id, name: you.name, roleLabel: you.role_label } : null,
  });
}
