"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Clock, Trophy } from "lucide-react";
import { BackHeader } from "@/components/BackHeader";
import { MiniGrid } from "@/components/MiniGrid";
import { formatWeekRange, weekdayName } from "@/lib/calendar";
import type { HistoryResult, WeekSummary } from "@/lib/history";
import { inDisplayOrder, playerTheme } from "@/lib/theme";

type Side = "a" | "b";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryResult | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/history").then(async (res) => {
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      setHistory(await res.json());
    });
  }, [router]);

  if (!history) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted">Loading…</p>
      </main>
    );
  }

  const { players, weeks, headToHead, averageGuesses, bestStreak } = history;
  // Mukul on the left, Madhulika on the right, whatever order the API used.
  const [L, R] = inDisplayOrder([
    { side: "a" as Side, ...players.a },
    { side: "b" as Side, ...players.b },
  ]);
  const name = (side: Side) => players[side].name;
  const daysWon = { a: headToHead.aWins, b: headToHead.bWins };

  const playedAny = (w: WeekSummary) => w.days.some((d) => d.a.played || d.b.played);
  const completed = weeks.filter((w) => !w.isCurrent && playedAny(w));
  const cups = {
    a: completed.filter((w) => w.champion === "a").length,
    b: completed.filter((w) => w.champion === "b").length,
    shared: completed.filter((w) => w.champion === "tie").length,
  };
  const totalCups = cups.a + cups.b + cups.shared;

  const current = weeks.find((w) => w.isCurrent);
  const listed = [...(current ? [current] : []), ...completed.slice().reverse()];

  return (
    <main className="flex-1 w-full max-w-[480px] mx-auto px-4 pt-6 pb-10">
      <BackHeader title="Cup history" />

      <section className="mt-6 rounded-[28px] bg-card shadow-soft px-6 pt-5 pb-6 rise-in">
        <p className="text-[17px] font-semibold text-muted">Cups won, all time</p>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end">
          <div>
            <p className="text-[64px] font-bold leading-none" style={{ color: playerTheme(L.name).ink }}>
              {cups[L.side]}
            </p>
            <p className="mt-1 text-[17px] text-muted">{L.name}</p>
          </div>
          <p className="pb-1 text-[17px] text-muted">{cups.shared} shared</p>
          <div className="text-right">
            <p className="text-[64px] font-bold leading-none" style={{ color: playerTheme(R.name).ink }}>
              {cups[R.side]}
            </p>
            <p className="mt-1 text-[17px] text-muted">{R.name}</p>
          </div>
        </div>
        <div className="mt-4 flex h-[18px] gap-1.5">
          {totalCups === 0 ? (
            <div className="flex-1 rounded-full bg-absent" />
          ) : (
            <>
              {cups[L.side] > 0 && (
                <div className="rounded-l-full" style={{ flex: cups[L.side], background: playerTheme(L.name).color }} />
              )}
              {cups.shared > 0 && <div style={{ flex: cups.shared, background: "var(--absent)" }} />}
              {cups[R.side] > 0 && (
                <div className="rounded-r-full" style={{ flex: cups[R.side], background: playerTheme(R.name).color }} />
              )}
            </>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-[28px] bg-card shadow-soft px-6 py-4">
        <div className="flex justify-between border-b border-line pb-3 text-[17px] font-semibold text-muted">
          <span>{L.name}</span>
          <span>{R.name}</span>
        </div>
        {[
          {
            label: "Avg guesses",
            value: (s: Side) => averageGuesses[s]?.toFixed(1) ?? "—",
          },
          { label: "Days won", value: (s: Side) => String(daysWon[s]) },
          { label: "Best streak", value: (s: Side) => String(bestStreak[s]) },
        ].map((row, i, all) => (
          <div
            key={row.label}
            className={`flex items-center justify-between py-4 ${i < all.length - 1 ? "border-b border-line" : ""}`}
          >
            <span className="w-16 text-[26px] font-bold text-ink">{row.value(L.side)}</span>
            <span className="text-[17px] text-muted">{row.label}</span>
            <span className="w-16 text-right text-[26px] font-bold text-ink">{row.value(R.side)}</span>
          </div>
        ))}
      </section>

      <h2 className="mt-8 text-[24px] font-bold text-ink">Past cups</h2>

      <div className="mt-3 flex flex-col gap-3">
        {listed.map((week) => {
          const isOpen = open === week.weekStart;
          const revealedDays = week.days.filter((d) => d.revealed && (d.a.played || d.b.played));
          let title: string;
          let circleBg = "var(--absent)";
          let circleFg = "var(--ink)";
          if (week.isCurrent) {
            title = "This week";
            circleBg = "var(--accent-soft)";
          } else if (week.champion === "tie") {
            title = "Shared cup";
          } else {
            const theme = playerTheme(name(week.champion));
            title = `${name(week.champion)} won`;
            circleBg = theme.color;
            circleFg = theme.onColor;
          }

          return (
            <div key={week.weekStart} className="rounded-[28px] bg-card shadow-soft">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : week.weekStart)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-4 py-4 text-left"
              >
                <div
                  className="h-16 w-16 shrink-0 rounded-full flex items-center justify-center"
                  style={{ background: circleBg, color: circleFg }}
                >
                  {week.isCurrent ? (
                    <Clock className="h-7 w-7" strokeWidth={2.4} aria-hidden />
                  ) : (
                    <Trophy className="h-7 w-7" strokeWidth={2.4} aria-hidden />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[21px] font-bold text-ink">{title}</p>
                  <p className="text-[16px] text-muted">
                    Week {week.weekNumber} · {formatWeekRange(week.weekStart, week.weekEnd)}
                  </p>
                </div>
                <span className="text-[24px] font-bold text-ink">
                  {week[L.side]} – {week[R.side]}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {isOpen && (
                <div className="border-t border-line px-4 pt-3 pb-4 fade-in">
                  {revealedDays.length === 0 ? (
                    <p className="text-[15px] text-muted">No finished days yet.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {revealedDays.map((day) => (
                        <div key={day.gameDate} className="flex items-start gap-4">
                          <div className="w-14 shrink-0 text-[15px] leading-tight text-muted">
                            <p className="font-semibold text-ink">{weekdayName(day.gameDate).slice(0, 3)}</p>
                            <p>{Number(day.gameDate.slice(8))}</p>
                          </div>
                          {[L.side, R.side].map((side) => {
                            const rows = side === "a" ? day.aRows : day.bRows;
                            const outcome = day[side];
                            return (
                              <div key={side} className="flex-1 flex flex-col items-center gap-1">
                                {rows ? <MiniGrid rows={rows} tile={13} /> : null}
                                <p className="text-[13px] text-muted">
                                  {!outcome.played ? "Didn't play" : outcome.solved ? `${outcome.numGuesses}/6` : "X/6"}
                                  {day.points[side] > 0 ? " · +1" : ""}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
