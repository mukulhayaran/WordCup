import { NextResponse, connection } from "next/server";
import { buildCabinet, cupTotals } from "@/lib/cups";
import { getCupsOverview } from "@/lib/cupsData";
import { getSessionPlayerId } from "@/lib/session";

export async function GET() {
  await connection();

  if (!(await getSessionPlayerId())) {
    return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });
  }

  const { history, siteCups, legacy, current } = await getCupsOverview();
  const names = [history.players.a.name, history.players.b.name];

  return NextResponse.json({
    totals: cupTotals(names, legacy, siteCups),
    eras: buildCabinet({ siteCups, current, legacy }),
  });
}
