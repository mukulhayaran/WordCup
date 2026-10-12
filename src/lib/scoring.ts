/**
 * A single player's outcome for one game-day, as known at scoring time.
 * `numGuesses` is only meaningful when `solved` is true.
 */
export type DayOutcome = {
  played: boolean;
  solved: boolean;
  numGuesses: number | null;
};

export const NOT_PLAYED: DayOutcome = {
  played: false,
  solved: false,
  numGuesses: null,
};

export type DayPoints = { a: number; b: number };

/**
 * Scores one game-day for two players (a vs b) per Word Cup rules:
 * - Not having played counts as a fail.
 * - A fail loses to any solve.
 * - Both fail: nobody scores.
 * - Both solve: fewer guesses wins 1 point; equal guesses ties, 1 point each.
 */
export function scoreDay(a: DayOutcome, b: DayOutcome): DayPoints {
  const aSolved = a.played && a.solved;
  const bSolved = b.played && b.solved;

  if (!aSolved && !bSolved) {
    return { a: 0, b: 0 };
  }
  if (aSolved && !bSolved) {
    return { a: 1, b: 0 };
  }
  if (!aSolved && bSolved) {
    return { a: 0, b: 1 };
  }

  // Both solved: fewer guesses wins; equal guesses tie.
  const ag = a.numGuesses as number;
  const bg = b.numGuesses as number;
  if (ag < bg) return { a: 1, b: 0 };
  if (bg < ag) return { a: 0, b: 1 };
  return { a: 1, b: 1 };
}

export type CupTally = {
  a: number;
  b: number;
  champion: "a" | "b" | "tie";
};

/** Sums a week's worth of per-day outcomes into a cup tally and champion. */
export function tallyCup(days: Array<{ a: DayOutcome; b: DayOutcome }>): CupTally {
  let a = 0;
  let b = 0;
  for (const day of days) {
    const points = scoreDay(day.a, day.b);
    a += points.a;
    b += points.b;
  }
  const champion: CupTally["champion"] = a === b ? "tie" : a > b ? "a" : "b";
  return { a, b, champion };
}
