"use client";

import { useEffect, useState } from "react";
import { lookUpMeaning, type WordMeaning } from "@/lib/wordMeaning";

/** Asks the server for the saved meaning: null if it has none, undefined if it said no. */
async function savedMeaning(gameDate: string): Promise<WordMeaning | null | undefined> {
  try {
    const res = await fetch("/api/meaning", { cache: "no-store" });
    if (res.status === 401 || res.status === 403) return undefined;
    if (!res.ok) return null;
    const data: { gameDate: string; meaning: WordMeaning | null } = await res.json();
    return data.gameDate === gameDate ? data.meaning : undefined;
  } catch {
    return null;
  }
}

/** "What it means" card on the result screen. Shows nothing if there's no meaning. */
export function WordMeaningCard({ word, gameDate }: { word: string; gameDate: string }) {
  const [meaning, setMeaning] = useState<WordMeaning | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let found = await savedMeaning(gameDate);
      if (found === undefined) return;
      // The dictionary turns away the server but allows browsers, so the phone
      // looks it up itself when the server couldn't.
      if (!found || found.items.length === 0) {
        try {
          found = await lookUpMeaning(word);
        } catch {
          // Offline or the dictionary is down: no card, nothing else depends on it.
        }
      }
      if (!cancelled && found) setMeaning(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [word, gameDate]);

  if (!meaning || meaning.items.length === 0) return null;
  const types = [...new Set(meaning.items.map((i) => i.partOfSpeech).filter(Boolean))];
  const oneType = types.length <= 1;

  return (
    <section className="relative mt-4 rounded-[28px] bg-card shadow-soft px-[22px] py-[18px] rise-in">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] font-semibold text-muted">What it means</p>
        {oneType && types[0] && (
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[13px] font-semibold text-ink">{types[0]}</span>
        )}
      </div>
      <p className="mt-1 text-[28px] font-bold tracking-[0.06em] text-correct">{word.toUpperCase()}</p>
      <ol className="mt-2 list-decimal pl-5 text-[16px] leading-[1.35] text-ink">
        {meaning.items.map((item, i) => (
          <li key={i} className={i > 0 ? "mt-1 break-words" : "break-words"}>
            {!oneType && item.partOfSpeech && <span className="mr-1.5 italic text-muted">{item.partOfSpeech}</span>}
            {item.text}
          </li>
        ))}
      </ol>
      {meaning.example && <p className="mt-2.5 text-[15px] italic text-muted break-words">“{meaning.example}”</p>}
    </section>
  );
}
