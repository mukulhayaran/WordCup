import { NextResponse, connection } from "next/server";
import { getWordMeaning } from "@/lib/dailyWord";
import { getGameResult } from "@/lib/game";
import { todayGameDate } from "@/lib/gameDate";
import { getSessionPlayerId } from "@/lib/session";

/** Today's word's meaning, only for a logged-in player who has finished. */
export async function GET() {
  await connection();

  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  const gameDate = todayGameDate();
  const row = await getGameResult(playerId, gameDate);
  if (row?.status !== "won" && row?.status !== "lost") {
    return NextResponse.json({ ok: false, reason: "not_finished" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, gameDate, meaning: await getWordMeaning(gameDate) });
}
