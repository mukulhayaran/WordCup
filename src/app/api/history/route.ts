import { NextResponse, connection } from "next/server";
import { getHistory } from "@/lib/history";
import { getSessionPlayerId } from "@/lib/session";

export async function GET() {
  await connection();

  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });
  }

  const history = await getHistory();
  return NextResponse.json({ ok: true, ...history });
}
