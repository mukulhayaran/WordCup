import { NextResponse } from "next/server";
import { z } from "zod";
import { getGift, openGift } from "@/lib/extras";
import { canOpenGift } from "@/lib/giftRules";
import { getSessionPlayerId } from "@/lib/session";

const bodySchema = z.object({ id: z.uuid() });

export async function POST(request: Request) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });

  const gift = await getGift(parsed.data.id);
  const check = canOpenGift(gift, playerId);
  if (!check.ok) return NextResponse.json(check, { status: check.reason === "not_found" ? 404 : 409 });

  const { opened, completedVase } = await openGift(gift!);
  if (!opened) return NextResponse.json({ ok: false, reason: "already_opened" }, { status: 409 });
  return NextResponse.json({
    ok: true,
    gift: { id: gift!.id, code: gift!.gift_code, speech: gift!.speech },
    completedVase,
  });
}
