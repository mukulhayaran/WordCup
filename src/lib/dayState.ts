import { getAllPlayers, type Player } from "./auth";
import { getGameResult, type GameResultRow } from "./game";
import { isDayRevealed, type FinishStatus } from "./reveal";
import { NOT_PLAYED, scoreDay, type DayOutcome } from "./scoring";

export type DaySide = { player: Player; row: GameResultRow | null; status: FinishStatus; points: number };

function outcome(row: GameResultRow | null): DayOutcome {
  if (!row || row.status === "in_progress") return NOT_PLAYED;
  return { played: true, solved: row.status === "won", numGuesses: row.status === "won" ? row.num_guesses : null };
}

/** Both players' results for a game day, whether it's revealed, and who took the point. */
export async function getDayState(gameDate: string): Promise<{ revealed: boolean; sides: [DaySide, DaySide] }> {
  const players = await getAllPlayers();
  if (players.length !== 2) throw new Error("Expected exactly two players to be set up");
  const [a, b] = players;
  const [rowA, rowB] = await Promise.all([getGameResult(a.id, gameDate), getGameResult(b.id, gameDate)]);
  const statusA: FinishStatus = rowA?.status ?? "not_played";
  const statusB: FinishStatus = rowB?.status ?? "not_played";
  const revealed = isDayRevealed(gameDate, statusA, statusB);
  const points = revealed ? scoreDay(outcome(rowA), outcome(rowB)) : { a: 0, b: 0 };
  return {
    revealed,
    sides: [
      { player: a, row: rowA, status: statusA, points: points.a },
      { player: b, row: rowB, status: statusB, points: points.b },
    ],
  };
}

/** [you, them] for the logged-in player. */
export function youAndThem(sides: [DaySide, DaySide], playerId: string): [DaySide, DaySide] {
  return sides[0].player.id === playerId ? [sides[0], sides[1]] : [sides[1], sides[0]];
}
