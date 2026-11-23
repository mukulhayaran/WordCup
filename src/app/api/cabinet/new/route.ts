import { NextResponse, connection } from "next/server";
import { hasSeenCabinetNew, markCabinetNewSeen } from "@/lib/extras";
import { getSessionPlayerId } from "@/lib/session";

/** Whether the logged-in player still needs the "NEW" tag on the Trophy Cabinet. */
export async function GET() {
  await connection();

  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  try {
    return NextResponse.json({ isNew: !(await hasSeenCabinetNew(playerId)) });
  } catch {
    // Without the new tables the new features aren't there either.
    return NextResponse.json({ isNew: false });
  }
}

export async function POST() {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });

  await markCabinetNewSeen(playerId);
  return NextResponse.json({ ok: true });
}
