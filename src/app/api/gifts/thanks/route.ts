import { NextResponse } from "next/server";
import { z } from "zod";
import { getGift, saveThanks } from "@/lib/extras";
import { canThank } from "@/lib/giftRules";
import { getSessionPlayerId } from "@/lib/session";

const bodySchema = z.object({ id: z.uuid(), thanks: z.string() });

export async function POST(request: Request) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });

  const check = canThank(await getGift(parsed.data.id), playerId, parsed.data.thanks);
  if (!check.ok) return NextResponse.json(check, { status: check.reason === "not_found" ? 404 : 409 });

  if (!(await saveThanks(parsed.data.id, parsed.data.thanks))) {
    return NextResponse.json({ ok: false, reason: "already_thanked" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
