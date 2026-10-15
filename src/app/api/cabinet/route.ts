import { NextResponse, connection } from "next/server";
import { buildCabinet, cupTotals } from "@/lib/cups";
import { getCupsOverview } from "@/lib/cupsData";

/** Public like the landing page: cup winners only, no grids or guesses. */
export async function GET() {
  await connection();

  const { history, siteCups, legacy, current } = await getCupsOverview();
  const names = [history.players.a.name, history.players.b.name];

  return NextResponse.json({
    totals: cupTotals(names, legacy, siteCups),
    eras: buildCabinet({ siteCups, current, legacy }),
  });
}
