import { NextResponse } from "next/server";
import { getAllPlayers } from "@/lib/auth";
import { createGift, getLastCup, hasSentGift } from "@/lib/extras";
import { canSendGift, normalizeSpeech } from "@/lib/giftRules";
import { getSessionPlayerId } from "@/lib/session";

export async function POST(request: Request) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const speech = normalizeSpeech(body?.speech);
  if (!speech.ok) return NextResponse.json(speech, { status: 422 });

  const players = await getAllPlayers();
  const you = players.find((p) => p.id === playerId);
  const them = players.find((p) => p.id !== playerId);
  if (!you || !them) return NextResponse.json({ ok: false, reason: "players_not_set_up" }, { status: 500 });

  const cup = await getLastCup();
  const check = canSendGift({
    cup,
    senderName: you.name,
    alreadySent: cup ? await hasSentGift(you.id, cup.weekStart) : false,
    giftCode: body?.giftCode,
  });
  if (!check.ok) {
    return NextResponse.json(check, { status: check.reason === "invalid_gift" ? 422 : 409 });
  }

  const saved = await createGift({
    fromId: you.id,
    toId: them.id,
    weekStart: cup!.weekStart,
    giftCode: body.giftCode,
    speech: speech.speech,
  });
  if (saved === "duplicate") return NextResponse.json({ ok: false, reason: "already_sent" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
