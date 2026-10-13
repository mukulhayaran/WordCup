"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Clock, Copy, Trophy } from "lucide-react";
import { Board, FLIP_DURATION_MS, FLIP_STAGGER_MS } from "@/components/Board";
import { Confetti } from "@/components/Confetti";
import { Keyboard } from "@/components/Keyboard";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { WeekDots } from "@/components/WeekDots";
import { TILE_BG, TILE_FG, prefersReducedMotion, vibrate } from "@/components/tiles";
import type { GameResponse, GuessRecord, StatusPlayer, StatusResponse } from "@/lib/apiTypes";
import { msUntilNextGameDay } from "@/lib/calendar";
import { toEmojiRow } from "@/lib/feedback";
import { playerTheme } from "@/lib/theme";

const REVEAL_MS = 4 * FLIP_STAGGER_MS + FLIP_DURATION_MS;

export default function PlayPage() {
  const router = useRouter();
  const [game, setGame] = useState<GameResponse | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [currentGuess, setCurrentGuess] = useState("");
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [holdBoard, setHoldBoard] = useState(false);
  const [keyboardGuesses, setKeyboardGuesses] = useState<GuessRecord[]>([]);
  const [shaking, setShaking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const loadAll = useCallback(async () => {
    const [gameRes, statusRes] = await Promise.all([fetch("/api/game"), fetch("/api/status")]);
    if (gameRes.status === 401) {
      router.replace("/");
      return;
    }
    const g: GameResponse = await gameRes.json();
    setGame(g);
    setKeyboardGuesses(g.guesses);
    setStatus(await statusRes.json());
  }, [router]);

  useEffect(() => {
    // Async fetch; state is only set after the responses arrive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll]);

  const showToast = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast((t) => (t === text ? null : t)), 1600);
  }, []);

  const rejectGuess = useCallback(
    (text: string) => {
      showToast(text);
      setShaking(true);
      vibrate(80);
    },
    [showToast]
  );

  const busy = submitting || revealingRow !== null || holdBoard;

  const onKey = useCallback(
    async (key: string) => {
      if (!game || game.finished || busy) return;

      if (key === "BACKSPACE") {
        setCurrentGuess((g) => g.slice(0, -1));
        return;
      }
      if (/^[a-z]$/.test(key)) {
        setCurrentGuess((g) => (g.length < 5 ? g + key : g));
        return;
      }
      if (key !== "ENTER") return;

      if (currentGuess.length !== 5) {
        rejectGuess("Not enough letters");
        return;
      }

      setSubmitting(true);
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: currentGuess }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (!data.ok) {
        if (data.reason === "not_a_word") rejectGuess("Not in word list");
        else if (data.reason === "already_finished") loadAll();
        else showToast("Something went wrong — try again");
        return;
      }

      const finished = data.status === "won" || data.status === "lost";
      const reduced = prefersReducedMotion();
      const revealMs = reduced ? 0 : REVEAL_MS;

      setGame({
        ...game,
        status: data.status,
        guesses: data.guesses,
        numGuesses: data.numGuesses,
        finished,
        solution: data.solution,
      });
      setCurrentGuess("");
      setRevealingRow(data.guesses.length - 1);
      if (finished) setHoldBoard(true);

      setTimeout(() => {
        setRevealingRow(null);
        setKeyboardGuesses(data.guesses);
      }, revealMs);

      if (finished) {
        setTimeout(
          () => {
            setHoldBoard(false);
            if (data.status === "won") {
              vibrate([40, 60, 120]);
              if (!reduced) {
                setCelebrate(true);
                setTimeout(() => setCelebrate(false), 4000);
              }
            }
            loadAll();
          },
          revealMs + (reduced ? 0 : 700)
        );
      }
    },
    [game, busy, currentGuess, rejectGuess, showToast, loadAll]
  );

  async function switchPlayer() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  if (!game || !status) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted">Loading…</p>
      </main>
    );
  }

  const you = status.players.find((p) => p.id === game.you?.id) ?? null;
  const opponent = status.players.find((p) => p.id !== game.you?.id) ?? null;

  return (
    <>
      {celebrate && <Confetti />}
      {game.finished && !holdBoard ? (
        <FinishedView game={game} status={status} opponent={opponent} onSwitch={switchPlayer} onRefresh={loadAll} />
      ) : (
        <main
          className="flex-1 flex flex-col items-center w-full max-w-[480px] mx-auto px-4 pt-5 pb-3"
          // Tiles shrink on short screens so the keyboard always stays on-screen.
          style={{ "--tile": "clamp(38px, min(15.5vw, calc((100dvh - 490px) / 6)), 62px)" } as CSSProperties}
        >
          <header className="w-full flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <Trophy className="h-9 w-9 text-correct" strokeWidth={2.4} aria-hidden />
              <div>
                <h1 className="text-[30px] font-bold leading-none text-ink">Word Cup</h1>
                <p className="mt-1 text-[16px] text-muted">
                  {status.weekday} · Week {status.weekNumber}
                </p>
              </div>
            </div>
            <Link
              href="/history"
              aria-label="Cup history"
              className="h-14 w-14 rounded-full bg-accent-soft flex items-center justify-center text-ink"
            >
              <Clock className="h-6 w-6" strokeWidth={2.4} />
            </Link>
          </header>

          {you && opponent && (
            <section className="mt-3 w-full rounded-[28px] bg-card shadow-soft px-4 pt-3 pb-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <PlayerAvatar name={you.name} avatarInitial={you.avatarInitial} avatarUrl={you.avatarUrl} size={46} filled />
                  <div className="leading-tight">
                    <p className="text-[15px] text-muted">You</p>
                    <p className="text-[26px] font-bold text-ink">{you.weekPoints}</p>
                  </div>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-[14px] font-semibold text-muted">
                  this week
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="text-right leading-tight">
                    <p className="text-[15px] text-muted">{opponent.name}</p>
                    <p className="text-[26px] font-bold text-ink">{opponent.weekPoints}</p>
                  </div>
                  <PlayerAvatar
                    name={opponent.name}
                    avatarInitial={opponent.avatarInitial}
                    avatarUrl={opponent.avatarUrl}
                    size={46}
                    filled
                  />
                </div>
              </div>
              <div className="mt-2.5">
                <WeekDots days={status.weekDays} today={status.gameDate} players={status.players} size={36} />
              </div>
              <p className="mt-2 truncate text-center text-[13px] text-muted">
                {opponent.playedToday
                  ? `${opponent.name} finished · result hidden until you're done`
                  : `${opponent.name} hasn't played yet today`}
              </p>
            </section>
          )}

          <div className="relative flex-1 flex items-center justify-center py-3">
            {toast && (
              <div
                role="status"
                className="absolute top-1 z-10 rounded-full bg-ink px-4 py-2 text-[15px] font-semibold text-white fade-in"
              >
                {toast}
              </div>
            )}
            <Board
              guesses={game.guesses}
              currentGuess={currentGuess}
              revealingRow={revealingRow}
              shaking={shaking}
              onShakeEnd={() => setShaking(false)}
            />
          </div>

          <Keyboard guesses={keyboardGuesses} onKey={onKey} disabled={busy} />

          <button type="button" onClick={switchPlayer} className="mt-2 text-[13px] font-semibold text-muted underline">
            Not you? Switch player
          </button>
        </main>
      )}
    </>
  );
}

function praise(numGuesses: number, name: string): string {
  if (numGuesses <= 2) return `Unreal, ${name}!`;
  if (numGuesses <= 4) return `Nice one, ${name}`;
  return `Phew — got there, ${name}`;
}

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function FinishedView({
  game,
  status,
  opponent,
  onSwitch,
  onRefresh,
}: {
  game: GameResponse;
  status: StatusResponse;
  opponent: StatusPlayer | null;
  onSwitch: () => void;
  onRefresh: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // While waiting, check now and then whether the other player has finished.
  useEffect(() => {
    if (opponent?.playedToday) return;
    const id = setInterval(onRefresh, 45000);
    return () => clearInterval(id);
  }, [opponent?.playedToday, onRefresh]);

  async function copyResult() {
    const grid = game.guesses.map((g) => toEmojiRow(g.feedback)).join("\n");
    const score = game.status === "won" ? `${game.numGuesses}/6` : "X/6";
    try {
      await navigator.clipboard.writeText(`Word Cup ${game.gameDate} ${score}\n\n${grid}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (e.g. plain-HTTP preview); nothing else to do.
    }
  }

  const won = game.status === "won";
  const yourName = game.you?.name ?? "";
  const oppTheme = playerTheme(opponent?.name ?? "");

  return (
    <main className="relative flex-1 w-full max-w-[480px] mx-auto px-4 pt-5 pb-6 overflow-hidden">
      {/* Decorative sprinkles, as in the mockup. */}
      <span aria-hidden className="absolute left-7 top-[124px] h-6 w-3 rotate-[25deg] rounded-full bg-[#e98aa6] opacity-70" />
      <span aria-hidden className="absolute left-3 top-[260px] h-3 w-3 rounded-full bg-[#e98aa6] opacity-60" />
      <span aria-hidden className="absolute right-6 top-[150px] h-4 w-2 -rotate-[20deg] rounded-full bg-present opacity-80" />
      <span aria-hidden className="absolute left-1/2 top-[118px] h-3 w-3 rounded-full bg-[#e98aa6] opacity-50" />

      <header className="relative flex items-center justify-between">
        <Link
          href="/history"
          aria-label="Cup history"
          className="h-14 w-14 rounded-full bg-accent-soft flex items-center justify-center text-ink"
        >
          <Trophy className="h-6 w-6" strokeWidth={2.4} />
        </Link>
        <h1 className="text-[30px] font-bold text-ink">Word Cup</h1>
        <button
          type="button"
          onClick={onSwitch}
          aria-label="Switch player"
          className="h-14 w-14 rounded-full bg-accent-soft flex items-center justify-center text-ink"
        >
          <ArrowLeftRight className="h-6 w-6" strokeWidth={2.4} />
        </button>
      </header>

      <section className="relative mt-4 rounded-[28px] bg-card shadow-soft px-6 pt-5 pb-5 text-center rise-in">
        <span className="inline-block rounded-full bg-accent-soft px-4 py-1 text-[15px] font-semibold text-muted">
          {status.weekday}&apos;s word
        </span>
        <h2 className={`mt-2 text-[40px] font-bold leading-tight ${won ? "text-correct" : "text-ink"}`}>
          {won ? `Solved in ${game.numGuesses}!` : "X/6 today"}
        </h2>
        <p className="text-[17px] text-muted">
          {won
            ? praise(game.numGuesses ?? 6, yourName)
            : `The word was ${game.solution?.toUpperCase() ?? "—"}. Tomorrow's yours.`}
        </p>

        <div className="mt-4 flex flex-col items-center gap-[6px]">
          {game.guesses.map((g, ri) => (
            <div key={ri} className="flex gap-[6px]">
              {g.guess.split("").map((letter, ci) => (
                <div
                  key={ci}
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] text-[22px] font-semibold uppercase"
                  style={{ background: TILE_BG[g.feedback[ci]], color: TILE_FG[g.feedback[ci]] }}
                >
                  {letter}
                </div>
              ))}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={copyResult}
          className="mt-5 flex h-[56px] w-full items-center justify-center gap-3 rounded-full bg-correct text-[19px] font-semibold text-white active:scale-[0.98] transition"
        >
          <Copy className="h-5 w-5" strokeWidth={2.6} />
          {copied ? "Copied!" : "Copy result"}
        </button>
      </section>

      {opponent && (
        <section className="relative mt-4 flex items-center gap-3 rounded-[28px] bg-card shadow-soft p-4 rise-in">
          <PlayerAvatar
            name={opponent.name}
            avatarInitial={opponent.avatarInitial}
            avatarUrl={opponent.avatarUrl}
            size={58}
            ring
          />
          {opponent.playedToday ? (
            <>
              <div className="flex-1 min-w-0 leading-snug">
                <p className="text-[17px] font-semibold text-ink">{opponent.name} has finished!</p>
                <p className="text-[14px] text-muted">See who takes today&apos;s point</p>
              </div>
              <Link
                href="/duel"
                className="shrink-0 rounded-full bg-correct px-5 py-3 text-[16px] font-semibold text-white"
              >
                See duel
              </Link>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0 leading-snug">
                <p className="text-[17px] font-semibold text-ink">{opponent.name} hasn&apos;t played yet</p>
                <p className="text-[14px] text-muted">You&apos;ll see the grids once {opponent.name} is done</p>
              </div>
              {/* Visual only for now — nudges aren't wired up yet. */}
              <button
                type="button"
                aria-disabled="true"
                title="Coming soon"
                className="shrink-0 rounded-full border-2 bg-card px-5 py-2.5 text-[16px] font-semibold"
                style={{ borderColor: oppTheme.color, color: oppTheme.ink }}
              >
                Nudge
              </button>
            </>
          )}
        </section>
      )}

      <section className="relative mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[24px] bg-accent-soft px-5 py-3.5">
          <p className="text-[15px] text-muted">Next word in</p>
          <p className="text-[26px] font-bold text-ink">{formatCountdown(msUntilNextGameDay(new Date(now)))}</p>
        </div>
        <div className="rounded-[24px] bg-accent-soft px-5 py-3.5">
          <p className="text-[15px] text-muted">Your streak</p>
          <p className="text-[26px] font-bold text-ink">
            {game.solveStreak} {game.solveStreak === 1 ? "day" : "days"}
          </p>
        </div>
      </section>
    </main>
  );
}
