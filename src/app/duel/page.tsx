"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Trophy } from "lucide-react";
import { BackHeader } from "@/components/BackHeader";
import { MiniGrid } from "@/components/MiniGrid";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { REACTION_ICONS } from "@/components/reactions";
import { vibrate } from "@/components/tiles";
import type { DuelPlayer, DuelResponse } from "@/lib/apiTypes";
import { MESSAGE_MAX_CHARS, REACTIONS, type Reaction } from "@/lib/socialRules";
import { inDisplayOrder, playerTheme } from "@/lib/theme";

type RevealedDuel = Extract<DuelResponse, { revealed: true }>;

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

  return <RevealedDuelView duel={duel} />;
}

function RevealedDuelView({ duel }: { duel: RevealedDuel }) {
  const [reactionByYou, setReactionByYou] = useState<Reaction | null>(duel.social.reactionByYou);
  const [messageByYou, setMessageByYou] = useState<string | null>(duel.social.messageByYou);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function react(reaction: Reaction) {
    const previous = reactionByYou;
    setReactionByYou(reaction);
    vibrate(20);
    const res = await fetch("/api/reaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction }),
    });
    if (!res.ok) setReactionByYou(previous);
  }

  async function sendMessage() {
    setSending(true);
    setError(null);
    const res = await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    const data = await res.json();
    setSending(false);
    if (data.ok) setMessageByYou(data.body);
    else if (data.reason === "too_long") setError(`Keep it to ${MESSAGE_MAX_CHARS} characters.`);
    else if (data.reason === "empty") setError("Write something first.");
    else setError("Couldn't send that one.");
  }

  // Each card shows the reaction its owner received.
  const reactionOn = (p: DuelPlayer) => (p.id === duel.youId ? duel.social.reactionToYou : reactionByYou);
  const draftLength = Array.from(draft.trim()).length;

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
          <DuelCard
            key={p.id}
            player={p}
            highlighted={p.points > 0 && winners.length === 1}
            reaction={reactionOn(p)}
            reactionFrom={duel.players.find((x) => x.id !== p.id)?.name ?? ""}
          />
        ))}
      </section>

      <section className="mt-4 rounded-[28px] bg-card shadow-soft p-5">
        <p className="text-[17px] font-semibold text-muted">React to {opponent.name}&apos;s grid</p>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {REACTIONS.map((r) => {
            const { Icon, label } = REACTION_ICONS[r];
            const selected = reactionByYou === r;
            return (
              <button
                key={r}
                type="button"
                aria-label={label}
                aria-pressed={selected}
                onClick={() => react(r)}
                className={`h-[60px] rounded-[20px] flex items-center justify-center transition active:scale-95 ${
                  selected ? "bg-correct text-white" : "bg-accent-soft text-ink"
                }`}
              >
                <Icon className="h-7 w-7" strokeWidth={2.2} />
              </button>
            );
          })}
        </div>
        {duel.social.reactionToYou && (
          <p className="mt-3 flex items-center gap-1.5 text-[15px] text-muted">
            {opponent.name} reacted
            {(() => {
              const { Icon } = REACTION_ICONS[duel.social.reactionToYou];
              return <Icon className="h-4 w-4 text-correct" strokeWidth={2.6} aria-label={duel.social.reactionToYou} />;
            })()}
            to your grid
          </p>
        )}

        <p className="mt-5 text-[17px] font-semibold text-muted">Winner&apos;s message</p>
        {duel.social.messageToYou && (
          <p className="mt-3 rounded-[20px] bg-accent-soft px-4 py-3 text-[17px] text-ink break-words">
            <span className="font-semibold">{opponent.name}:</span> “{duel.social.messageToYou}”
          </p>
        )}
        {messageByYou ? (
          <p className="mt-3 rounded-[20px] border-2 border-line px-4 py-3 text-[17px] text-ink break-words">
            <span className="font-semibold">You:</span> “{messageByYou}”
          </p>
        ) : duel.social.canMessage ? (
          <>
            <form
              className="mt-3 flex items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!sending) sendMessage();
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={MESSAGE_MAX_CHARS * 2}
                placeholder={`Say something to ${opponent.name}…`}
                aria-label={`Message to ${opponent.name}`}
                className="h-[56px] flex-1 min-w-0 rounded-full border-2 border-line bg-bg px-5 text-[17px] text-ink outline-none placeholder:text-muted/70 focus:border-typed"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={sending || draftLength === 0 || draftLength > MESSAGE_MAX_CHARS}
                className="h-[56px] w-[56px] shrink-0 rounded-full bg-correct flex items-center justify-center text-white transition active:scale-95 disabled:opacity-50"
              >
                <ArrowRight className="h-6 w-6" strokeWidth={2.6} />
              </button>
            </form>
            <p className={`mt-2 px-2 text-right text-[13px] ${draftLength > MESSAGE_MAX_CHARS ? "text-correct" : "text-muted"}`}>
              {error ?? `${draftLength}/${MESSAGE_MAX_CHARS}`}
            </p>
          </>
        ) : (
          !duel.social.messageToYou &&
          !duel.social.youScored && (
            <p className="mt-2 text-[15px] text-muted">Only today&apos;s winner gets to leave a message.</p>
          )
        )}
      </section>
    </main>
  );
}

function DuelCard({
  player,
  highlighted,
  reaction,
  reactionFrom,
}: {
  player: DuelPlayer;
  highlighted: boolean;
  reaction: Reaction | null;
  reactionFrom: string;
}) {
  const theme = playerTheme(player.name);
  const score =
    player.status === "won" ? `${player.numGuesses}/6` : player.status === "lost" ? "X/6" : "—";
  const badge = reaction ? REACTION_ICONS[reaction] : null;
  return (
    <div
      className="relative flex flex-col items-center rounded-[28px] bg-card shadow-soft px-3 pt-5 pb-6"
      style={{ border: `2px solid ${highlighted ? theme.color : "transparent"}` }}
    >
      {badge && (
        <span
          className="absolute right-3 top-3 h-10 w-10 rounded-full bg-correct text-white flex items-center justify-center shadow-key tile-pop"
          title={`${reactionFrom}: ${badge.label}`}
          aria-label={`${reactionFrom} reacted ${badge.label}`}
        >
          <badge.Icon className="h-5 w-5" strokeWidth={2.4} />
        </span>
      )}
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
