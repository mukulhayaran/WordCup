"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PinPad } from "@/components/PinPad";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { StatusResponse } from "@/lib/apiTypes";

export default function LandingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data: StatusResponse) => {
        setStatus(data);
        // Already remembered on this device -> skip straight to the game.
        if (data.sessionPlayerId) router.replace("/play");
      });
  }, [router]);

  async function submitPin(pin: string) {
    if (!selectedPlayerId) return;
    setSubmitting(true);
    setPinError(null);
    const player = status?.players.find((p) => p.id === selectedPlayerId);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: player?.name, pin }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (data.ok) {
      router.push("/play");
      return;
    }
    if (data.reason === "locked") {
      setPinError(`Too many wrong tries. Try again in ${data.minutesRemaining}m.`);
    } else {
      setPinError("Wrong PIN, try again.");
    }
  }

  if (!status) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-foreground/60">Loading…</p>
      </main>
    );
  }

  const selectedPlayer = status.players.find((p) => p.id === selectedPlayerId);

  return (
    <main className="flex-1 flex flex-col items-center gap-10 px-6 py-12">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-brand-dark">Word Cup</h1>
        <p className="mt-2 text-foreground/70">Who&apos;s playing?</p>
      </header>

      <div className="flex items-center gap-6 rounded-2xl bg-card border border-card-border px-8 py-4 shadow-sm">
        {status.players.map((p) => (
          <div key={p.id} className="text-center">
            <p className="text-xs uppercase tracking-wide text-foreground/50">{p.name}</p>
            <p className="text-2xl font-bold text-brand">{p.id === status.players[0].id ? status.weekScore.a : status.weekScore.b}</p>
          </div>
        ))}
        <p className="text-xs text-foreground/40">this week&apos;s cup</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
        {status.players.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedPlayerId(p.id);
              setPinError(null);
            }}
            className="flex flex-col items-center gap-3 rounded-2xl bg-card border border-card-border p-6 shadow-sm hover:shadow-md active:scale-[0.98] transition"
          >
            <PlayerAvatar name={p.name} avatarInitial={p.avatarInitial} avatarUrl={p.avatarUrl} size={88} />
            <div className="text-center">
              <p className="text-lg font-bold">{p.name}</p>
              <p className="text-xs text-foreground/50">{p.roleLabel}</p>
            </div>
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                background: p.playedToday ? "rgba(31,158,102,0.15)" : "rgba(109,40,217,0.1)",
                color: p.playedToday ? "var(--tile-correct)" : "var(--brand)",
              }}
            >
              {p.playedToday ? "Played today" : "Not played yet"}
            </span>
          </button>
        ))}
      </div>

      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6" onClick={() => setSelectedPlayerId(null)}>
          <div
            className="bg-card rounded-2xl p-8 flex flex-col items-center gap-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold">Enter {selectedPlayer.name}&apos;s PIN</p>
            <PinPad onSubmit={submitPin} disabled={submitting} error={pinError} />
          </div>
        </div>
      )}
    </main>
  );
}
