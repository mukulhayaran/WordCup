"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Crown, FaceSlightlySmiling, Flame, Heart, Trophy } from "lucide-react";
import { BackHeader } from "@/components/BackHeader";
import { MiniGrid } from "@/components/MiniGrid";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { DuelPlayer, DuelResponse } from "@/lib/apiTypes";
import { inDisplayOrder, playerTheme } from "@/lib/theme";

export default function DuelPage() {
  const router = useRouter();
  const [duel, setDuel] = useState<DuelResponse | null>(null);

  useEffect(() => {
    fetch("/api/duel").then(async (res) => {
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      setDuel(await res.json());
    });
  }, [router]);

  if (!duel) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted">Loading…</p>
      </main>
    );
  }

  if (!duel.revealed) {
    return (
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 pt-6">
        <BackHeader title="Today's duel" />
        <section className="mt-8 rounded-[28px] bg-card shadow-soft p-6 text-center">
          <p className="text-[20px] font-semibold text-ink">Not yet!</p>
          <p className="mt-2 text-[16px] text-muted">Today&apos;s duel unlocks once you&apos;ve both finished.</p>
        </section>
      </main>
    );
  }

  const [left, right] = inDisplayOrder(duel.players);
  const opponent = duel.players.find((p) => p.id !== duel.youId) ?? right;
  const winners = duel.players.filter((p) => p.points > 0);

  let bannerBg = "var(--muted)";
  let bannerFg = "#ffffff";
  let headline = "No points today";
  if (winners.length === 1) {
    const theme = playerTheme(winners[0].name);
    bannerBg = theme.color;
    bannerFg = theme.onColor;
    headline = `${winners[0].name} takes the point!`;
  } else if (winners.length === 2) {
    bannerBg = "linear-gradient(120deg, var(--mukul) 0%, var(--mukul) 45%, var(--madhulika) 100%)";
    headline = "A tie — a point each!";
  }

  return (
    <main className="flex-1 w-full max-w-[480px] mx-auto px-4 pt-6 pb-8">
      <BackHeader title="Today's duel" subtitle={`${duel.weekday} · Week ${duel.weekNumber}`} />

      <section
        className="mt-5 flex items-center gap-4 rounded-[28px] px-5 py-5 shadow-soft rise-in"
        style={{ background: bannerBg, color: bannerFg }}
      >
        <div className="h-16 w-16 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
          <Trophy className="h-8 w-8" strokeWidth={2.4} aria-hidden />
        </div>
        <div>
          <p className="text-[24px] font-bold leading-tight">{headline}</p>
          <p className="mt-0.5 text-[17px] opacity-90">
            Cup score now {left.weekPoints} – {right.weekPoints}
          </p>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        {[left, right].map((p) => (
          <DuelCard key={p.id} player={p} highlighted={p.points > 0 && winners.length === 1} />
        ))}
      </section>

      <section className="mt-4 rounded-[28px] bg-card shadow-soft p-5">
        <p className="text-[17px] font-semibold text-muted">React to {opponent.name}&apos;s grid</p>
        {/* Reactions and messages are visual only for now. */}
        <div className="mt-3 grid grid-cols-4 gap-3">
          {[
            { Icon: Heart, label: "Love" },
            { Icon: FaceSlightlySmiling, label: "Smile" },
            { Icon: Flame, label: "Fire" },
            { Icon: Crown, label: "Crown" },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              aria-disabled="true"
              title="Coming soon"
              className="h-[60px] rounded-[20px] bg-accent-soft flex items-center justify-center text-ink"
            >
              <Icon className="h-7 w-7" strokeWidth={2.2} />
            </button>
          ))}
        </div>

        <p className="mt-5 text-[17px] font-semibold text-muted">Winner&apos;s message</p>
        <div className="mt-3 flex items-center gap-3">
          <input
            disabled
            placeholder={`Say something to ${opponent.name}…`}
            className="h-[56px] flex-1 min-w-0 rounded-full border-2 border-line bg-bg px-5 text-[17px] text-ink placeholder:text-muted/70"
          />
          <button
            type="button"
            aria-label="Send"
            aria-disabled="true"
            title="Coming soon"
            className="h-[56px] w-[56px] shrink-0 rounded-full bg-correct flex items-center justify-center text-white"
          >
            <ArrowRight className="h-6 w-6" strokeWidth={2.6} />
          </button>
        </div>
      </section>
    </main>
  );
}

function DuelCard({ player, highlighted }: { player: DuelPlayer; highlighted: boolean }) {
  const theme = playerTheme(player.name);
  const score =
    player.status === "won" ? `${player.numGuesses}/6` : player.status === "lost" ? "X/6" : "—";
  return (
    <div
      className="flex flex-col items-center rounded-[28px] bg-card shadow-soft px-3 pt-5 pb-6"
      style={{ border: `2px solid ${highlighted ? theme.color : "transparent"}` }}
    >
      <PlayerAvatar name={player.name} avatarInitial={player.avatarInitial} avatarUrl={player.avatarUrl} size={80} ring />
      <p className="mt-3 text-[22px] font-bold text-ink">{player.name}</p>
      <p className="text-[40px] font-bold leading-tight" style={{ color: player.status === "won" ? theme.ink : "var(--muted)" }}>
        {score}
      </p>
      <div className="mt-3">
        {player.rows.length > 0 ? (
          <MiniGrid rows={player.rows} tile={24} />
        ) : (
          <p className="text-[15px] text-muted">Didn&apos;t play</p>
        )}
      </div>
    </div>
  );
}
