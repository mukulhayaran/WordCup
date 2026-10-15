import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPlayerId } from "@/lib/session";
import { dismissMessage } from "@/lib/social";

const bodySchema = z.object({ id: z.uuid() });

export async function POST(request: Request) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });

  const dismissed = await dismissMessage(parsed.data.id, playerId);
  return dismissed
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
}
