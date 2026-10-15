import { NextResponse } from "next/server";
import { getDayState, youAndThem } from "@/lib/dayState";
import { todayGameDate } from "@/lib/gameDate";
import { getSessionPlayerId } from "@/lib/session";
import { createMessage, getMessageFrom } from "@/lib/social";
import { canSendMessage, normalizeMessage } from "@/lib/socialRules";

export async function POST(request: Request) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  const message = normalizeMessage((await request.json().catch(() => null))?.body);
  if (!message.ok) return NextResponse.json(message, { status: 422 });

  const gameDate = todayGameDate();
  const { revealed, sides } = await getDayState(gameDate);
  const [you, them] = youAndThem(sides, playerId);

  const check = canSendMessage({
    revealed,
    senderPoints: you.points,
    alreadySent: !!(await getMessageFrom(you.player.id, gameDate)),
  });
  if (!check.ok) return NextResponse.json(check, { status: 409 });

  if ((await createMessage(you.player.id, them.player.id, gameDate, message.body)) === "duplicate") {
    return NextResponse.json({ ok: false, reason: "already_sent" }, { status: 409 });
  }
  return NextResponse.json({ ok: true, body: message.body });
}
