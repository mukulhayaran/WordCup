/** A short, friendly meaning for the day's word, shown after you finish. */
export type WordMeaning = {
  /** Up to two meanings; empty when the dictionary has nothing for the word. */
  items: Array<{ partOfSpeech: string; text: string }>;
  example: string | null;
};

const MAX_ITEMS = 2;
const MAX_CHARS = 180;

type DictDefinition = { definition?: unknown; example?: unknown };
type DictMeaning = { partOfSpeech?: unknown; definitions?: unknown };
type DictEntry = { meanings?: unknown };

const clean = (s: unknown): string | null => {
  if (typeof s !== "string") return null;
  const text = s.replace(/\s+/g, " ").trim();
  return text && text.length <= MAX_CHARS ? text : null;
};

/**
 * Picks the meanings to show from a Free Dictionary API reply: the first
 * usable meaning of each word type (noun, verb…), up to two. If there's only
 * one word type, its first two meanings. The example must use the word.
 */
export function pickMeaning(word: string, reply: unknown): WordMeaning {
  const groups: Array<{ partOfSpeech: string; defs: DictDefinition[] }> = [];
  for (const entry of Array.isArray(reply) ? (reply as DictEntry[]) : []) {
    for (const m of Array.isArray(entry?.meanings) ? (entry.meanings as DictMeaning[]) : []) {
      const partOfSpeech = typeof m?.partOfSpeech === "string" ? m.partOfSpeech : "";
      const defs = Array.isArray(m?.definitions) ? (m.definitions as DictDefinition[]) : [];
      const existing = groups.find((g) => g.partOfSpeech === partOfSpeech);
      if (existing) existing.defs.push(...defs);
      else groups.push({ partOfSpeech, defs: [...defs] });
    }
  }

  const items: WordMeaning["items"] = [];
  for (const g of groups) {
    const text = g.defs.map((d) => clean(d.definition)).find(Boolean);
    if (text) items.push({ partOfSpeech: g.partOfSpeech, text });
    if (items.length === MAX_ITEMS) break;
  }
  if (items.length === 1) {
    const g = groups.find((x) => x.partOfSpeech === items[0].partOfSpeech)!;
    const second = g.defs.map((d) => clean(d.definition)).find((t) => t && t !== items[0].text);
    if (second) items.push({ partOfSpeech: g.partOfSpeech, text: second });
  }

  const usesWord = new RegExp(`\\b${word}`, "i");
  const example =
    items.length === 0
      ? null
      : (groups
          .flatMap((g) => g.defs)
          .map((d) => clean(d.example))
          .find((e) => e && usesWord.test(e)) ?? null);

  return { items, example };
}

/**
 * Looks the word up. Returns an empty meaning when the dictionary doesn't
 * know it, and throws on network trouble so nothing wrong gets saved.
 */
export async function lookUpMeaning(word: string, fetchImpl: typeof fetch = fetch): Promise<WordMeaning> {
  const res = await fetchImpl(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (res.status === 404) return { items: [], example: null };
  if (!res.ok) throw new Error(`Dictionary returned ${res.status}`);
  return pickMeaning(word, await res.json());
}
