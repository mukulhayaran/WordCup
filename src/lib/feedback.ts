export type LetterStatus = "correct" | "present" | "absent";

/**
 * Standard Wordle-style feedback for a 5-letter guess against a solution.
 * Handles duplicate letters the same way Wordle does: each solution letter
 * can only be "claimed" once, correct-position matches are claimed first.
 */
export function scoreGuess(guess: string, solution: string): LetterStatus[] {
  const g = guess.toLowerCase().split("");
  const s = solution.toLowerCase().split("");
  const result: LetterStatus[] = new Array(g.length).fill("absent");
  const solutionLetterAvailable = [...s];

  // First pass: exact position matches.
  for (let i = 0; i < g.length; i++) {
    if (g[i] === s[i]) {
      result[i] = "correct";
      solutionLetterAvailable[i] = null as unknown as string;
    }
  }

  // Second pass: present-but-wrong-position matches, consuming remaining letters.
  for (let i = 0; i < g.length; i++) {
    if (result[i] === "correct") continue;
    const idx = solutionLetterAvailable.indexOf(g[i]);
    if (idx !== -1) {
      result[i] = "present";
      solutionLetterAvailable[idx] = null as unknown as string;
    }
  }

  return result;
}

export function isWinningGuess(statuses: LetterStatus[]): boolean {
  return statuses.every((s) => s === "correct");
}

const EMOJI: Record<LetterStatus, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬜",
};

export function toEmojiRow(statuses: LetterStatus[]): string {
  return statuses.map((s) => EMOJI[s]).join("");
}

export function toEmojiGrid(rows: LetterStatus[][]): string {
  return rows.map(toEmojiRow).join("\n");
}
