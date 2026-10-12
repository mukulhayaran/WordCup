import allowedGuessesList from "./data/allowed-guesses.json";
import fallbackAnswersList from "./data/fallback-answers.json";

const allowedGuesses = new Set<string>(allowedGuessesList as string[]);
const fallbackAnswers = fallbackAnswersList as string[];

export function isAllowedGuess(word: string): boolean {
  return allowedGuesses.has(word.toLowerCase());
}

/**
 * Deterministically picks a fallback answer for a given game-date, so both
 * players get the same word even when the NYT endpoint is unreachable.
 * Pure function of the date string — no randomness, no external state.
 */
export function fallbackAnswerForDate(gameDate: string): string {
  let hash = 0;
  for (let i = 0; i < gameDate.length; i++) {
    hash = (hash * 31 + gameDate.charCodeAt(i)) >>> 0;
  }
  return fallbackAnswers[hash % fallbackAnswers.length];
}
