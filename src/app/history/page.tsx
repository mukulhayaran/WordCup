"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { HistoryResult } from "@/lib/history";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryResult | null>(null);

  useEffect(() => {
    fetch("/api/history").then(async (res) => {
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      const data = await res.json();
      setHistory(data);
    });
  }, [router]);

  if (!history) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-foreground/60">Loading…</p>
      </main>
    );
  }

  const { players, weeks, headToHead, averageGuesses, currentStreak } = history;

  return (
    <main className="flex-1 flex flex-col items-center gap-8 px-4 py-8 max-w-2xl mx-auto w-full">
      <header className="w-full flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-dark">History</h1>
        <Link href="/play" className="text-sm text-brand underline">
          Back to game
        </Link>
      </header>

      <section className="w-full grid grid-cols-2 gap-4">
        <Stat label={`${players.a.name} avg guesses`} value={averageGuesses.a?.toFixed(2) ?? "—"} />
        <Stat label={`${players.b.name} avg guesses`} value={averageGuesses.b?.toFixed(2) ?? "—"} />
        <Stat label={`${players.a.name} streak`} value={String(currentStreak.a)} />
        <Stat label={`${players.b.name} streak`} value={String(currentStreak.b)} />
      </section>

      <section className="w-full rounded-2xl bg-card border border-card-border p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-foreground/50">Head-to-head</p>
        <p className="text-lg font-bold mt-1">
          {players.a.name} {headToHead.aWins} – {headToHead.bWins} {players.b.name}
          {headToHead.ties > 0 && <span className="text-sm text-foreground/50"> ({headToHead.ties} ties)</span>}
        </p>
      </section>

      <section className="w-full flex flex-col gap-6">
        {weeks
          .slice()
          .reverse()
          .map((week) => (
            <div key={week.weekStart} className="rounded-2xl bg-card border border-card-border p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  {week.weekStart} – {week.weekEnd}
                  {week.isCurrent && <span className="ml-2 text-xs text-accent">(this week)</span>}
                </p>
                <p className="text-sm font-bold">
                  {week.a} – {week.b}
                  {week.champion !== "tie" && !week.isCurrent && (
                    <span className="ml-2 text-xs font-normal text-foreground/50">
                      🏆 {week.champion === "a" ? players.a.name : players.b.name}
                    </span>
                  )}
                  {week.champion === "tie" && !week.isCurrent && week.days.some((d) => d.revealed) && (
                    <span className="ml-2 text-xs font-normal text-foreground/50">🏆 shared</span>
                  )}
                </p>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {week.days
                  .filter((d) => d.revealed)
                  .map((day) => (
                    <div key={day.gameDate} className="flex items-start gap-4 text-xs">
                      <span className="w-20 shrink-0 text-foreground/50">{day.gameDate}</span>
                      <pre className="leading-tight">{day.aEmojiGrid ?? "did not play"}</pre>
                      <pre className="leading-tight">{day.bEmojiGrid ?? "did not play"}</pre>
                    </div>
                  ))}
                {week.days.filter((d) => d.revealed).length === 0 && (
                  <p className="text-xs text-foreground/40">No finished days yet.</p>
                )}
              </div>
            </div>
          ))}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card border border-card-border p-3 text-center">
      <p className="text-xs text-foreground/50">{label}</p>
      <p className="text-xl font-bold text-brand">{value}</p>
    </div>
  );
}
