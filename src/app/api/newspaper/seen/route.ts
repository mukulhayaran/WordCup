import { NextResponse } from "next/server";
import { z } from "zod";
import { markNewspaperSeen } from "@/lib/extras";
import { getSessionPlayerId } from "@/lib/session";

const bodySchema = z.object({ weekStart: z.iso.date() });

export async function POST(request: Request) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });

  await markNewspaperSeen(playerId, parsed.data.weekStart);
  return NextResponse.json({ ok: true });
}
