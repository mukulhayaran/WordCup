import { NextResponse } from "next/server";
import { z } from "zod";
import { todayGameDate } from "@/lib/gameDate";
import { submitGuess } from "@/lib/game";
import { getSessionPlayerId } from "@/lib/session";

const bodySchema = z.object({
  guess: z.string().length(5),
});

export async function POST(request: Request) {
  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ ok: false, reason: "not_logged_in" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });
  }

  const gameDate = todayGameDate();
  const result = await submitGuess(playerId, gameDate, parsed.data.guess);

  if (!result.ok) {
    const status = result.reason === "not_a_word" ? 422 : 409;
    return NextResponse.json({ ok: false, reason: result.reason }, { status });
  }

  return NextResponse.json({
    ok: true,
    status: result.row.status,
    guesses: result.row.guesses,
    numGuesses: result.row.num_guesses,
    solution: result.solutionRevealed,
  });
}
