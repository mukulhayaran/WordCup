import { NextResponse, connection } from "next/server";
import { getExtras } from "@/lib/extras";
import { getSessionPlayerId } from "@/lib/session";

/** Badges, the Newspaper and gifts. Login-only, unlike the public cabinet. */
export async function GET() {
  await connection();

  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  return NextResponse.json(await getExtras(playerId));
}
