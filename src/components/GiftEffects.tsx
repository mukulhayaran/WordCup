"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { PlayerEffects } from "@/lib/giftRules";
import { GiftArt } from "./GiftArt";
import { prefersReducedMotion } from "./tiles";

/** Decorates a logged-in player's round photo with whatever gift is active. */
export function AvatarFx({ fx, size, children }: { fx?: PlayerEffects; size: number; children: ReactNode }) {
  if (!fx || !(fx.beacon || fx.crown || fx.clown || fx.garland)) return <>{children}</>;
  const beads = 16;
  const r = size / 2 + 1;
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {children}
      {fx.garland && (
        <svg aria-label="Garland of Victory" role="img" className="pointer-events-none absolute" style={{ left: -6, top: -6 }} width={size + 12} height={size + 12}>
          {Array.from({ length: beads }, (_, i) => {
            const a = (i / beads) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={size / 2 + 6 + Math.cos(a) * r}
                cy={size / 2 + 6 + Math.sin(a) * r}
                r={Math.max(2.5, size * 0.07)}
                fill={i % 2 ? "#facc15" : "#f97316"}
              />
            );
          })}
        </svg>
      )}
      {fx.crown && (
        <span className="absolute left-1/2 -translate-x-1/2 text-[#b97c0b]" style={{ top: -size * 0.36 }} role="img" aria-label="Crown">
          <GiftArt icon="crown" size={size * 0.56} />
        </span>
      )}
      {fx.clown && (
        <span
          className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-[#e01f35]"
          style={{ top: "40%", width: size * 0.24, height: size * 0.24 }}
          role="img"
          aria-label="Clown nose"
        />
      )}
      {fx.beacon && (
        <span className="beacon-blink absolute -right-1 -top-1.5 rounded-full bg-white p-0.5 text-[#d91f3d]" role="img" aria-label="Red beacon">
          <GiftArt icon="siren" size={Math.max(16, size * 0.36)} />
        </span>
      )}
    </span>
  );
}

const PETAL_COLOURS = ["#e98aa6", "#f7c873", "#f97316", "#ffffff"];

const SHOWER_MS = 6000;
// A short pause, so a pop-up about to appear can hold the petals back.
const SHOWER_DELAY_MS = 350;
const showerStoreKey = (giftId: string) => `wordcup:shower:${giftId}`;

function showerSeenOn(giftId: string, screen: string) {
  try {
    return (localStorage.getItem(showerStoreKey(giftId)) ?? "").split(",").includes(screen);
  } catch {
    return false;
  }
}

function markShowerSeen(giftId: string, screen: string) {
  try {
    const seen = (localStorage.getItem(showerStoreKey(giftId)) ?? "").split(",").filter(Boolean);
    localStorage.setItem(showerStoreKey(giftId), [...seen, screen].join(","));
  } catch {
    // Storage blocked: the petals may just play again on this screen.
  }
}

/**
 * Petals drift down the first time the winner reaches each screen while a
 * Flower Shower is active. `waiting` holds them back until a pop-up closes.
 */
export function FlowerShower({ giftId, screen, waiting = false }: { giftId?: string | null; screen: string; waiting?: boolean }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!giftId || waiting || prefersReducedMotion() || showerSeenOn(giftId, screen)) return;
    const id = setTimeout(() => {
      markShowerSeen(giftId, screen);
      setPlaying(true);
    }, SHOWER_DELAY_MS);
    return () => clearTimeout(id);
  }, [giftId, screen, waiting]);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setPlaying(false), SHOWER_MS);
    return () => clearTimeout(id);
  }, [playing]);

  if (!playing) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <i
          key={i}
          className="petal-fall absolute block h-[15px] w-[11px] rounded-[70%_15%_70%_15%]"
          style={{
            left: `${(i * 37 + 6) % 98}%`,
            top: -24,
            background: PETAL_COLOURS[i % 4],
            boxShadow: "0 0 0 1px rgb(201 61 102 / 0.18)",
            animationDelay: `${((i * 0.37) % 3).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}
