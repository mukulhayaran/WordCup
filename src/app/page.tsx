"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trophy } from "lucide-react";
import { CupScoreCard } from "@/components/CupScoreCard";
import { PinPad } from "@/components/PinPad";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerCutout } from "@/components/PlayerCutout";
import { vibrate } from "@/components/tiles";
import type { StatusPlayer, StatusResponse } from "@/lib/apiTypes";
import { inDisplayOrder, playerTheme } from "@/lib/theme";

export default function LandingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [selected, setSelected] = useState<StatusPlayer | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data: StatusResponse) => {
        // Already remembered on this device -> skip straight to the game.
        if (data.sessionPlayerId) router.replace("/play");
        else setStatus(data);
      });
  }, [router]);

  const submitPin = useCallback(
    async (pin: string) => {
      if (!selected) return;
      setSubmitting(true);
      setPinError(null);
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selected.name, pin }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (data.ok) {
        router.push("/play");
        return;
      }
      vibrate(120);
      setPinError(
        data.reason === "locked"
          ? `Too many wrong tries. Try again in ${data.minutesRemaining} min.`
          : "That's not the PIN. Try again."
      );
    },
    [selected, router]
  );

  if (!status) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col w-full max-w-[480px] mx-auto px-5 pt-10 pb-8">
      <header className="text-center">
        <h1 className="flex items-center justify-center gap-3 text-[40px] font-bold leading-none text-ink">
          <Trophy className="h-9 w-9 text-correct" strokeWidth={2.4} aria-hidden />
          Word Cup
        </h1>
        <p className="mt-2 text-[18px] text-muted">
          Week {status.weekNumber} · {status.weekday}
        </p>
      </header>

      <div className="mt-7 rise-in">
        <CupScoreCard status={status} />
      </div>

      <h2 className="mt-10 text-center text-[30px] font-bold text-ink">Who&apos;s playing?</h2>

      <div className="mt-[76px] grid grid-cols-2 gap-4">
        {inDisplayOrder(status.players).map((p) => {
          const theme = playerTheme(p.name);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelected(p);
                setPinError(null);
              }}
              className="relative flex flex-col items-center rounded-[28px] bg-card shadow-soft px-3 pt-[96px] pb-6 active:scale-[0.98] transition-transform"
              style={{ borderTop: `6px solid ${theme.color}` }}
            >
              <div className="absolute -top-[64px] left-1/2 -translate-x-1/2">
                <PlayerCutout name={p.name} avatarInitial={p.avatarInitial} avatarUrl={p.avatarUrl} />
              </div>
              <span className="text-[26px] font-bold text-ink">{p.name}</span>
              <span className="mt-1 text-[16px] text-muted">{p.roleLabel}</span>
              {p.playedToday ? (
                <span className="mt-4 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--madhulika-soft)] px-3 py-1.5 text-[14px] font-semibold text-[var(--madhulika-ink)]">
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                  Played today
                </span>
              ) : (
                <span className="mt-4 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-accent-soft px-3 py-1.5 text-[14px] font-semibold text-correct">
                  <span className="h-2 w-2 rounded-full bg-correct" aria-hidden />
                  Your turn
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-auto pt-12 text-center text-[17px] text-muted">Tap your card to play</p>

      {selected && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={`Enter ${selected.name}'s PIN`}>
          <div className="absolute inset-0 bg-[rgb(201_61_102/0.22)] fade-in" onClick={() => setSelected(null)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[480px] rounded-t-[32px] bg-bg px-6 pt-3 pb-8 shadow-soft sheet-in">
            <div className="mx-auto h-[5px] w-11 rounded-full bg-line" />
            <div className="mt-6 flex flex-col items-center">
              <PlayerAvatar
                name={selected.name}
                avatarInitial={selected.avatarInitial}
                avatarUrl={selected.avatarUrl}
                size={88}
                ring
              />
              <p className="mt-5 text-[30px] font-bold text-ink">Hi, {selected.name}</p>
              <p className="mt-1 text-[17px] text-muted">Enter your 4-digit PIN</p>
              <p className="mt-2 h-5 text-[15px] font-medium text-correct" role="alert">
                {pinError}
              </p>
              <div className="mt-4">
                <PinPad onSubmit={submitPin} disabled={submitting} color={playerTheme(selected.name).color} />
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-8 text-[17px] font-semibold text-correct"
              >
                Not you? Go back
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
