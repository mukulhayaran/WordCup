import { fallbackAnswerForDate } from "./words";

export type ResolvedWord = {
  solution: string;
  daysSinceLaunch: number | null;
  source: "nyt" | "fallback";
};

type FetchLike = typeof fetch;

/**
 * Resolves the day's solution: tries the NYT Wordle endpoint first, and
 * falls back to a deterministic local word on any failure (network error,
 * non-200 response, or a malformed/non-5-letter solution field). Pure aside
 * from the injected `fetchImpl`, so it's testable without real network calls.
 */
export async function resolveDailyWord(
  gameDate: string,
  fetchImpl: FetchLike = fetch
): Promise<ResolvedWord> {
  try {
    const res = await fetchImpl(
      `https://www.nytimes.com/svc/wordle/v2/${gameDate}.json`
    );
    if (!res.ok) throw new Error(`NYT endpoint returned ${res.status}`);

    const data = await res.json();
    const solution = String(data.solution ?? "").toLowerCase();
    if (!/^[a-z]{5}$/.test(solution)) {
      throw new Error("NYT response missing a valid 5-letter solution");
    }

    const daysSinceLaunch =
      typeof data.days_since_launch === "number"
        ? data.days_since_launch
        : null;

    return { solution, daysSinceLaunch, source: "nyt" };
  } catch {
    return {
      solution: fallbackAnswerForDate(gameDate),
      daysSinceLaunch: null,
      source: "fallback",
    };
  }
}
