import { NextResponse, connection } from "next/server";
import { cupTotals } from "@/lib/cups";
import { getCupsOverview } from "@/lib/cupsData";
import { getSessionPlayerId } from "@/lib/session";

export async function GET() {
  await connection();

  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });
  }

  // Legacy cups count toward cups won only; daily stats come from site games alone.
  const { history, siteCups, legacy } = await getCupsOverview();
  const names = [history.players.a.name, history.players.b.name];
  return NextResponse.json({ ok: true, ...history, cupTotals: cupTotals(names, legacy, siteCups) });
}
