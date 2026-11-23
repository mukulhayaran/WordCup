"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { BackHeader } from "@/components/BackHeader";
import { BadgeShelf } from "@/components/BadgeShelf";
import { markCabinetNewSeen } from "@/components/CabinetNewTag";
import { VaseShelves } from "@/components/FlowerVase";
import { GiftArt } from "@/components/GiftArt";
import { GiftOpenSheet, GiftSendSheet } from "@/components/GiftBox";
import { FlowerShower } from "@/components/GiftEffects";
import { CupTimeline, MondayNewspaper } from "@/components/MondayNewspaper";
import { TrophyIcon } from "@/components/TrophyIcon";
import { useExtras } from "@/components/useExtras";
import type { CabinetResponse, ExtrasResponse } from "@/lib/apiTypes";
import { SHARED, type CabinetTrophy } from "@/lib/cups";
import { GIFT_BY_CODE } from "@/lib/giftCatalog";
import { inDisplayOrder, playerTheme } from "@/lib/theme";

export default function CabinetPage() {
  const [cabinet, setCabinet] = useState<CabinetResponse | null>(null);
  // Only ever loads for a logged-in player; logged-out visitors see just the cups.
  const { extras, refresh } = useExtras();
  const [tab, setTab] = useState<"cups" | "badges" | "gifts">("cups");
  const [readingPaper, setReadingPaper] = useState(false);

  useEffect(() => {
    fetch("/api/cabinet")
      .then((r) => r.json())
      .then(setCabinet);
    markCabinetNewSeen();
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
      <FlowerShower giftId={extras?.showerId} screen="cabinet" waiting={readingPaper} />
      <BackHeader title="Trophy cabinet" />

      {extras && (
        <div className="mt-4 grid grid-cols-3 rounded-full bg-accent-soft p-1" role="tablist" aria-label="Cabinet sections">
          {(["cups", "badges", "gifts"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`h-11 rounded-full text-[15px] font-semibold capitalize text-ink ${tab === t ? "bg-card shadow-key" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {extras && tab === "badges" && (
        <div className="mt-4">
          <BadgeShelf extras={extras} />
        </div>
      )}
      {extras && tab === "gifts" && <GiftsTab extras={extras} refresh={refresh} />}

      {tab === "cups" && (
      <>
      {extras && (
        <div className="mt-4 flex flex-col gap-3">
          <CupTimeline timeline={extras.weekly.timeline} />
          {extras.newspaper && (
            <button
              type="button"
              onClick={() => setReadingPaper(true)}
              className="h-12 rounded-full bg-card text-[16px] font-semibold text-ink shadow-soft"
            >
              Read the Monday Newspaper
            </button>
          )}
        </div>
      )}
      {readingPaper && extras?.newspaper && <MondayNewspaper paper={extras.newspaper} onClose={() => setReadingPaper(false)} />}

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
      </>
      )}
    </main>
  );
}

function GiftsTab({ extras, refresh }: { extras: ExtrasResponse; refresh: () => void }) {
  const [sheet, setSheet] = useState<"send" | "open" | null>(null);
  const owed = extras.gifts.owed;
  const toOpen = extras.gifts.toOpen[0];
  const done = () => {
    setSheet(null);
    refresh();
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {sheet === "send" && owed && <GiftSendSheet owed={owed} onLater={() => setSheet(null)} onDone={done} />}
      {sheet === "open" && toOpen && <GiftOpenSheet gift={toOpen} onLater={() => setSheet(null)} onDone={done} />}
      {toOpen && (
        <button type="button" onClick={() => setSheet("open")} className="h-[54px] rounded-full bg-correct text-[17px] font-semibold text-white">
          Open your gift from {toOpen.fromName}
        </button>
      )}
      {owed && (
        <button type="button" onClick={() => setSheet("send")} className="h-[54px] rounded-full bg-correct text-[17px] font-semibold text-white">
          Send {owed.toName} a gift
        </button>
      )}
      <VaseShelves extras={extras} />
      <section>
        <h2 className="mb-2 text-[16px] font-bold text-ink">Your other gifts</h2>
        {extras.gifts.received.length === 0 ? (
          <p className="rounded-[18px] bg-card px-4 py-3 text-[15px] text-muted shadow-soft">Nothing here yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {extras.gifts.received.map((g) => {
              const gift = GIFT_BY_CODE.get(g.code);
              return (
                <li key={g.id} className="flex items-center gap-3 rounded-[18px] bg-card px-3 py-2.5 text-correct shadow-soft">
                  <GiftArt icon={gift?.icon ?? "gift"} size={28} />
                  <span className="min-w-0 leading-tight text-ink">
                    <span className="block font-semibold">{gift?.name}</span>
                    <span className="block text-[13px] text-muted">
                      From {g.fromName}
                      {g.weekNumber ? ` · Week ${g.weekNumber}` : ""}
                    </span>
                    {g.speech && <span className="block text-[13px] italic break-words">“{g.speech}”</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="rounded-[18px] bg-[#f8eef1] px-4 py-3">
        <p className="font-semibold text-ink">Real gifts: coming soon</p>
      </section>
    </div>
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
