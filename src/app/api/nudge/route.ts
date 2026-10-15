import { NextResponse } from "next/server";
import { getDayState, youAndThem } from "@/lib/dayState";
import { todayGameDate } from "@/lib/gameDate";
import { getSessionPlayerId } from "@/lib/session";
import { createNudge, hasNudged } from "@/lib/social";
import { canNudge } from "@/lib/socialRules";

export async function POST() {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  const gameDate = todayGameDate();
  const { sides } = await getDayState(gameDate);
  const [you, them] = youAndThem(sides, playerId);

  const check = canNudge({
    senderStatus: you.status,
    recipientStatus: them.status,
    alreadyNudgedToday: await hasNudged(you.player.id, gameDate),
  });
  if (!check.ok) return NextResponse.json(check, { status: 409 });

  if ((await createNudge(you.player.id, them.player.id, gameDate)) === "duplicate") {
    return NextResponse.json({ ok: false, reason: "already_nudged" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
