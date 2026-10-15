import { NextResponse } from "next/server";
import { getDayState, youAndThem } from "@/lib/dayState";
import { todayGameDate } from "@/lib/gameDate";
import { getSessionPlayerId } from "@/lib/session";
import { setReaction } from "@/lib/social";
import { canReact, isReaction } from "@/lib/socialRules";

export async function POST(request: Request) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const gameDate = todayGameDate();
  const { revealed, sides } = await getDayState(gameDate);

  const check = canReact({ revealed, reaction: body?.reaction });
  if (!check.ok) {
    return NextResponse.json(check, { status: check.reason === "invalid_reaction" ? 422 : 409 });
  }

  const [you, them] = youAndThem(sides, playerId);
  if (isReaction(body.reaction)) await setReaction(you.player.id, them.player.id, gameDate, body.reaction);
  return NextResponse.json({ ok: true, reaction: body.reaction });
}
