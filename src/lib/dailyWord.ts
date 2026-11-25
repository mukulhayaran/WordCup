import { resolveDailyWord } from "./nytWord";
import { supabaseAdmin } from "./supabaseAdmin";
import { lookUpMeaning, type WordMeaning } from "./wordMeaning";

/**
 * The meaning of a day's word, looked up once and saved next to it. Returns
 * null if it can't be found right now; the game never depends on it.
 */
export async function getWordMeaning(gameDate: string): Promise<WordMeaning | null> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("daily_words")
    .select("solution, meaning")
    .eq("game_date", gameDate)
    .maybeSingle();
  if (error || !data) return null;
  if (data.meaning) return data.meaning as WordMeaning;

  try {
    const meaning = await lookUpMeaning(data.solution);
    await db.from("daily_words").update({ meaning }).eq("game_date", gameDate).is("meaning", null);
    return meaning;
  } catch {
    return null;
  }
}

export type DailyWordRow = {
  game_date: string;
  solution: string;
  days_since_launch: number | null;
  source: "nyt" | "fallback";
};

/**
 * Returns the cached solution for `gameDate`, resolving and storing it on
 * first access. Safe under concurrent calls (e.g. both players loading the
 * game at once): if two requests both miss the cache, the second insert is
 * ignored on conflict and we re-read whatever the first one wrote, so both
 * players always end up with the same stored word.
 */
export async function getOrCreateDailyWord(
  gameDate: string
): Promise<DailyWordRow> {
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("daily_words")
    .select("game_date, solution, days_since_launch, source")
    .eq("game_date", gameDate)
    .maybeSingle();

  if (existing) return existing;

  const resolved = await resolveDailyWord(gameDate);

  const { error: insertError } = await db.from("daily_words").insert({
    game_date: gameDate,
    solution: resolved.solution,
    days_since_launch: resolved.daysSinceLaunch,
    source: resolved.source,
  });

  if (insertError && insertError.code !== "23505") {
    // 23505 = unique_violation (another request already inserted it); any
    // other error is unexpected and should surface.
    throw insertError;
  }

  const { data: row, error: reselectError } = await db
    .from("daily_words")
    .select("game_date, solution, days_since_launch, source")
    .eq("game_date", gameDate)
    .single();

  if (reselectError || !row) {
    throw reselectError ?? new Error("Failed to read back daily word");
  }

  return row;
}
