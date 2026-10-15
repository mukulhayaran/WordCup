"use client";

import { useEffect, useState } from "react";
import type { StatusPlayer } from "@/lib/apiTypes";
import { formatWeekRange } from "@/lib/calendar";
import { SHARED, type Celebration } from "@/lib/cups";
import { inDisplayOrder, playerTheme } from "@/lib/theme";
import { Confetti } from "./Confetti";
import { PlayerCutout } from "./PlayerCutout";
import { TrophyIcon } from "./TrophyIcon";
import { prefersReducedMotion, vibrate } from "./tiles";

/** Full-screen "Champion!" for the cup that just ended. Marked seen as soon as it's shown. */
export function CupCelebration({
  celebration,
  players,
  onStartWeek,
  onSeeCabinet,
}: {
  celebration: Celebration;
  players: StatusPlayer[];
  onStartWeek: () => void;
  onSeeCabinet: () => void;
}) {
  const [confetti] = useState(() => !prefersReducedMotion());

  useEffect(() => {
    vibrate([60, 80, 160]);
    fetch("/api/celebration/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: celebration.weekStart }),
    });
  }, [celebration.weekStart]);

  const shared = celebration.winner === SHARED;
  const ordered = inDisplayOrder(players);
  const winners = shared ? ordered : ordered.filter((p) => p.name === celebration.winner);
  // Final score with the champion first (Mukul first on a shared cup).
  const scoreOrder = shared ? ordered : [...winners, ...ordered.filter((p) => p.name !== celebration.winner)];
  const pillTheme = playerTheme(shared ? "Mukul" : celebration.winner);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg fade-in" role="dialog" aria-modal="true" aria-label="Cup champion">
      {confetti && <Confetti />}
      <div className="relative mx-auto flex min-h-full w-full max-w-[480px] flex-col items-center px-5 pt-8 pb-8">
        <span
          className="rounded-full px-4 py-1.5 text-[15px] font-semibold"
          style={{ background: pillTheme.soft, color: pillTheme.ink }}
        >
          Week {celebration.weekNumber} · {formatWeekRange(celebration.weekStart, celebration.weekEnd)}
        </span>
        <h1 className="mt-3 text-center text-[46px] font-bold leading-tight text-correct">
          {shared ? "Shared champions!" : "Champion!"}
        </h1>

        <div className={`mt-6 flex items-end justify-center ${shared ? "-space-x-4" : ""}`}>
          {winners.map((p) => (
            <PlayerCutout
              key={p.id}
              name={p.name}
              avatarInitial={p.avatarInitial}
              avatarUrl={p.avatarUrl}
              disc={shared ? 150 : 200}
              ring
            />
          ))}
        </div>

        <p className="mt-4 text-center text-[32px] font-bold text-ink">{winners.map((p) => p.name).join(" & ")}</p>

        <div className="mt-3 flex items-center gap-5 rounded-[22px] bg-card px-7 py-3 shadow-soft">
          {scoreOrder.map((p, i) => (
            <div key={p.id} className="flex items-center gap-5">
              {i === 1 && <span className="-mt-6 text-[26px] font-bold text-typed">–</span>}
              <div className="text-center leading-tight">
                <p className="text-[34px] font-bold" style={{ color: playerTheme(p.name).ink }}>
                  {celebration.scores[p.name] ?? 0}
                </p>
                <p className="text-[14px] text-muted">{p.name}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 flex items-center gap-2 text-center text-[16px] text-muted">
          <TrophyIcon winner={celebration.winner} size={26} />
          {shared
            ? `Trophy #${celebration.trophyNumber} added to the cabinet`
            : `Trophy #${celebration.trophyNumber} added to ${celebration.winner}'s cabinet`}
        </p>

        <div className="mt-auto flex w-full flex-col gap-3 pt-10">
          <button
            type="button"
            onClick={onStartWeek}
            className="h-[58px] w-full rounded-full bg-correct text-[19px] font-semibold text-white active:scale-[0.98] transition"
          >
            Start Week {celebration.nextWeekNumber}
          </button>
          <button
            type="button"
            onClick={onSeeCabinet}
            className="h-[58px] w-full rounded-full border-2 border-line bg-card text-[18px] font-semibold text-ink active:scale-[0.98] transition"
          >
            See the cabinet
          </button>
        </div>
      </div>
    </div>
  );
}
