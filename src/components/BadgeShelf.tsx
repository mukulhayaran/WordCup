"use client";

import { useState } from "react";
import { BADGES, BADGE_BY_ID, type BadgeDef, type BadgeScope, type Rarity } from "@/lib/badgeCatalog";
import type { ExtrasResponse } from "@/lib/apiTypes";
import { GiftArt } from "./GiftArt";

const RARITY_LABEL: Record<Rarity, string> = { common: "Common", rare: "Rare", legendary: "Legendary" };

export function BadgeDisc({ badge, earned, size = 58 }: { badge: BadgeDef; earned: boolean; size?: number }) {
  const legendary = earned && badge.rarity === "legendary";
  const ring = !earned || badge.rarity === "common" ? undefined : `0 0 0 3px #fff, 0 0 0 5px ${legendary ? "var(--ink)" : "var(--correct)"}`;
  return (
    <span
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        boxShadow: ring,
        background: !earned ? "#f2e8eb" : legendary ? "var(--correct)" : "var(--present)",
        color: !earned ? "var(--muted)" : legendary ? "#fff" : "var(--ink)",
      }}
    >
      <GiftArt icon={earned ? badge.icon : "lock"} size={size * 0.46} />
    </span>
  );
}

export function BadgeShelf({ extras }: { extras: ExtrasResponse }) {
  const [playerId, setPlayerId] = useState(extras.youId);
  const [scope, setScope] = useState<BadgeScope>("weekly");
  const [pickedId, setPickedId] = useState("W1");

  const counts = extras.badges.counts[playerId] ?? {};
  const earnedTotal = BADGES.filter((b) => counts[b.id]).length;
  const list = BADGES.filter((b) => b.scope === scope);
  const groups = [...new Set(list.map((b) => b.group))];
  const picked = BADGE_BY_ID.get(pickedId) ?? list[0];
  const pickedCount = counts[picked.id] ?? 0;

  return (
    <section className="rise-in">
      <div className="grid grid-cols-2 rounded-full bg-accent-soft p-1" role="tablist" aria-label="Whose badges">
        {extras.players.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === playerId}
            onClick={() => setPlayerId(p.id)}
            className={`h-11 rounded-full text-[15px] font-semibold text-ink ${p.id === playerId ? "bg-card shadow-key" : ""}`}
          >
            {p.id === extras.youId ? "You" : p.name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-[15px] text-muted">
        {earnedTotal} of {BADGES.length} earned
      </p>

      <div className="mt-2 grid grid-cols-2 rounded-full bg-accent-soft p-1" role="tablist" aria-label="Badge type">
        {(["weekly", "daily"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === scope}
            onClick={() => {
              setScope(s);
              setPickedId(s === "weekly" ? "W1" : "D1");
            }}
            className={`h-11 rounded-full text-[15px] font-semibold text-ink ${s === scope ? "bg-card shadow-key" : ""}`}
          >
            {s === "weekly" ? "Weekly cups" : "Daily"}
          </button>
        ))}
      </div>

      <div className="mt-3 flex min-h-[98px] items-center gap-3 rounded-[22px] bg-card px-4 py-3 shadow-soft" aria-live="polite">
        <BadgeDisc badge={picked} earned={pickedCount > 0} />
        <div className="min-w-0 leading-tight">
          <p className="text-[18px] font-bold text-ink">{picked.name}</p>
          <p className="mt-0.5 text-[14px] text-muted">{picked.how}</p>
          <p className="mt-1 text-[13px] font-semibold text-ink">
            {RARITY_LABEL[picked.rarity]} ·{" "}
            {pickedCount ? `earned ${pickedCount} ${pickedCount === 1 ? "time" : "times"}` : "not earned yet"}
          </p>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g}>
          <h3 className="mt-5 mb-2 text-[16px] font-bold text-ink">{g}</h3>
          <div className="grid grid-cols-3 gap-x-2 gap-y-3">
            {list
              .filter((b) => b.group === g)
              .map((b) => {
                const count = counts[b.id] ?? 0;
                return (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={b.id === picked.id}
                    onClick={() => setPickedId(b.id)}
                    className={`flex min-h-[112px] flex-col items-center rounded-[16px] px-0.5 pt-1.5 ${b.id === picked.id ? "bg-accent-soft" : ""}`}
                  >
                    <span className="relative">
                      <BadgeDisc badge={b} earned={count > 0} />
                      {count > 1 && (
                        <span className="absolute -right-1.5 -top-1 min-w-6 rounded-full bg-correct px-1 text-center text-[12px] font-semibold text-white">
                          ×{count}
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 text-center text-[13px] font-semibold leading-[1.12] text-ink">{b.name}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </section>
  );
}

/** The full-screen "New badge!" moment. */
export function BadgePopup({ badgeId, playerName, onClose }: { badgeId: string; playerName: string; onClose: () => void }) {
  const badge = BADGE_BY_ID.get(badgeId);
  if (!badge) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg fade-in" role="dialog" aria-modal="true" aria-label="New badge">
      <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col items-center px-5 pt-10 pb-8 text-center">
        <span className="rounded-full bg-accent-soft px-4 py-1.5 text-[15px] font-semibold text-ink">{RARITY_LABEL[badge.rarity]} badge</span>
        <h1 className="mt-3 text-[44px] font-bold leading-tight text-correct">New badge!</h1>
        <div className="mt-6 tile-pop">
          <BadgeDisc badge={badge} earned size={176} />
        </div>
        <p className="mt-6 text-[32px] font-bold leading-tight text-ink">{badge.name}</p>
        <p className="mt-1 text-[17px] text-muted">{badge.how}</p>
        <p className="mt-1 text-[15px] font-semibold text-ink">Well played, {playerName}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-auto h-[56px] w-full rounded-full bg-correct text-[19px] font-semibold text-white active:scale-[0.98] transition"
        >
          Nice
        </button>
      </div>
    </div>
  );
}
