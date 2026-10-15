"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Trophy } from "lucide-react";
import { CupCelebration } from "@/components/CupCelebration";
import { CupScoreCard } from "@/components/CupScoreCard";
import { MessageCard } from "@/components/MessageCard";
import { NudgeBanner } from "@/components/NudgeBanner";
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
  const [celebrationClosed, setCelebrationClosed] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data: StatusResponse) => {
        // Remembered on this device: go straight to the game, unless there's
        // something waiting for you here (a champion, a nudge or a message).
        const f = data.forYou;
        const waiting = !!f && (!!f.celebration || !!f.nudgeFrom || f.messages.length > 0);
        if (data.sessionPlayerId && !waiting) router.replace("/play");
        else setStatus(data);
      });
  }, [router]);

  async function dismissMessage(id: string) {
    setStatus((s) =>
      s?.forYou ? { ...s, forYou: { ...s.forYou, messages: s.forYou.messages.filter((m) => m.id !== id) } } : s
    );
    await fetch("/api/message/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

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

  const forYou = status.forYou;

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

      {(forYou?.nudgeFrom || (forYou?.messages.length ?? 0) > 0) && (
        <div className="mt-6 flex flex-col gap-3">
          {forYou?.nudgeFrom && <NudgeBanner from={forYou.nudgeFrom} />}
          {forYou?.messages.map((m) => (
            <MessageCard key={m.id} message={m} onDismiss={dismissMessage} />
          ))}
        </div>
      )}

      <div className="mt-7 rise-in">
        <CupScoreCard status={status} />
      </div>
      <Link
        href="/cabinet"
        className="mt-3 flex items-center justify-center gap-1.5 self-center rounded-full bg-accent-soft px-4 py-2 text-[15px] font-semibold text-ink"
      >
        <Trophy className="h-4 w-4 text-correct" strokeWidth={2.6} aria-hidden />
        Trophy cabinet
        <ChevronRight className="h-4 w-4 text-muted" strokeWidth={2.6} aria-hidden />
      </Link>

      <h2 className="mt-9 text-center text-[30px] font-bold text-ink">Who&apos;s playing?</h2>

      <div className="mt-[76px] grid grid-cols-2 gap-4">
        {inDisplayOrder(status.players).map((p) => {
          const theme = playerTheme(p.name);
          const isYou = p.id === status.sessionPlayerId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                // Already logged in as this player on this device: no PIN needed.
                if (isYou) return router.push("/play");
                setSelected(p);
                setPinError(null);
              }}
              className="relative flex flex-col items-center rounded-[28px] bg-card shadow-soft px-3 pt-[96px] pb-6 active:scale-[0.98] transition-transform"
              style={{ borderTop: `6px solid ${theme.color}` }}
            >
              <div className="absolute -top-[78px] left-1/2 -translate-x-1/2">
                <PlayerCutout name={p.name} avatarInitial={p.avatarInitial} avatarUrl={p.avatarUrl} />
              </div>
              {isYou && (
                <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-0.5 text-[12px] font-semibold text-white">
                  You
                </span>
              )}
              <span className="text-[26px] font-bold text-ink">{p.name}</span>
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

      {forYou?.celebration && !celebrationClosed && (
        <CupCelebration
          celebration={forYou.celebration}
          players={status.players}
          onStartWeek={() => {
            setCelebrationClosed(true);
            router.push("/play");
          }}
          onSeeCabinet={() => router.push("/cabinet")}
        />
      )}

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
