"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { BackHeader } from "@/components/BackHeader";
import { TrophyIcon } from "@/components/TrophyIcon";
import type { CabinetResponse } from "@/lib/apiTypes";
import { SHARED, type CabinetTrophy } from "@/lib/cups";
import { inDisplayOrder, playerTheme } from "@/lib/theme";

export default function CabinetPage() {
  const [cabinet, setCabinet] = useState<CabinetResponse | null>(null);

  useEffect(() => {
    fetch("/api/cabinet")
      .then((r) => r.json())
      .then(setCabinet);
  }, []);

  if (!cabinet) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted">Loading…</p>
      </main>
    );
  }

  const names = inDisplayOrder(Object.keys(cabinet.totals.won).map((name) => ({ name })));

  return (
    <main className="flex-1 flex flex-col w-full max-w-[480px] mx-auto px-4 pt-6 pb-6">
      <BackHeader title="Trophy cabinet" />

      <section className="mt-5 grid grid-cols-2 gap-3 rise-in">
        {names.map(({ name }) => {
          const theme = playerTheme(name);
          return (
            <div key={name} className="flex items-center justify-between rounded-[22px] px-4 py-3" style={{ background: theme.soft }}>
              <div className="leading-tight">
                <p className="text-[17px] font-bold text-ink">{name}</p>
                <p className="text-[14px] text-muted">cups won</p>
              </div>
              <span className="text-[38px] font-bold leading-none" style={{ color: theme.ink }}>
                {cabinet.totals.won[name]}
              </span>
            </div>
          );
        })}
      </section>
      {cabinet.totals.shared > 0 && (
        <p className="mt-2 text-center text-[14px] text-muted">
          + {cabinet.totals.shared} shared {cabinet.totals.shared === 1 ? "cup" : "cups"}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-6">
        {cabinet.eras.map((era) => (
          <section
            key={era.name}
            className="rounded-[24px] bg-card shadow-soft px-4 pt-4 pb-5"
            style={{ borderBottom: "12px solid #ecc9d4" }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[18px] font-bold text-ink">{era.name}</h2>
              <span className="flex items-center gap-1.5 text-[14px] text-muted">
                {era.legacy && era.meta === "before the site" && (
                  <MessageCircle className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                )}
                {era.meta}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-4">
              {era.trophies.map((t) => (
                <Trophy key={`${t.label}-${t.sublabel}`} trophy={t} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <div className="flex items-center justify-around rounded-full bg-card shadow-soft px-4 py-3 text-[14px] text-muted">
          {names.map(({ name }) => (
            <span key={name} className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-[5px]" style={{ background: playerTheme(name).color }} />
              {name}
            </span>
          ))}
          <span className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-[5px]"
              style={{ background: "linear-gradient(90deg, var(--mukul) 50%, var(--madhulika) 50%)" }}
            />
            Shared
          </span>
        </div>
      </div>
    </main>
  );
}

function Trophy({ trophy }: { trophy: CabinetTrophy }) {
  const tint =
    trophy.winner === null || trophy.winner === SHARED ? "var(--accent-soft)" : playerTheme(trophy.winner).soft;
  const who =
    trophy.winner === null ? "still being played" : trophy.winner === SHARED ? "shared" : `won by ${trophy.winner}`;
  return (
    <div className="flex w-[84px] flex-col items-center" aria-label={`${trophy.label}, ${trophy.sublabel}, ${who}`}>
      <TrophyIcon winner={trophy.winner} size={52} />
      <div className="mt-2 w-full rounded-[12px] px-1.5 py-1 text-center leading-tight" style={{ background: tint }}>
        <p className="text-[13px] font-bold text-ink">{trophy.label}</p>
        <p className="text-[11px] text-muted">{trophy.sublabel}</p>
      </div>
    </div>
  );
}
