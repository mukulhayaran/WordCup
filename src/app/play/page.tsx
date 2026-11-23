"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Clock, Copy, Crown, Trophy } from "lucide-react";
import { Board, FLIP_DURATION_MS, FLIP_STAGGER_MS } from "@/components/Board";
import { CabinetNewTag } from "@/components/CabinetNewTag";
import { Confetti } from "@/components/Confetti";
import { CupCelebration } from "@/components/CupCelebration";
import { ExtrasLayer } from "@/components/ExtrasLayer";
import { AvatarFx, FlowerShower } from "@/components/GiftEffects";
import { Keyboard } from "@/components/Keyboard";
import { NudgeBanner } from "@/components/NudgeBanner";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { WeekDots } from "@/components/WeekDots";
import { TILE_BG, TILE_FG, prefersReducedMotion, vibrate } from "@/components/tiles";
import { useExtras } from "@/components/useExtras";
import type { ExtrasResponse, GameResponse, GuessRecord, StatusPlayer, StatusResponse } from "@/lib/apiTypes";
import { msUntilNextGameDay } from "@/lib/calendar";
import { scoreGuess, toEmojiRow } from "@/lib/feedback";
import {
  boardMatches,
  boardStatus,
  loadQueue,
  mergeWithServer,
  saveQueue,
  type PendingGuess,
} from "@/lib/pendingGuesses";
import { playerTheme } from "@/lib/theme";
import { isAllowedGuess } from "@/lib/words";

const REVEAL_MS = 4 * FLIP_STAGGER_MS + FLIP_DURATION_MS;
const FIRST_RETRY_MS = 2000;
const MAX_RETRY_MS = 30000;

export default function PlayPage() {
  const router = useRouter();
  const [game, setGame] = useState<GameResponse | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  // The server's own word on whether today's game is over. The result screen
  // waits for this, not for the phone's local check.
  const [serverFinished, setServerFinished] = useState(false);
  const [queue, setQueueState] = useState<PendingGuess[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [holdBoard, setHoldBoard] = useState(false);
  const [keyboardGuesses, setKeyboardGuesses] = useState<GuessRecord[]>([]);
  const [shaking, setShaking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [celebrationClosed, setCelebrationClosed] = useState(false);
  const { extras, refresh: refreshExtras } = useExtras();
  const [extrasOpen, setExtrasOpen] = useState(false);

  // Read from async code (saving, reloading), which must see the latest values.
  const gameRef = useRef<GameResponse | null>(null);
  const queueRef = useRef<PendingGuess[]>([]);
  const playerIdRef = useRef<string | null>(null);
  const revealingRef = useRef(false);
  const flushingRef = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(FIRST_RETRY_MS);
  const flushRef = useRef<() => void>(() => {});

  useEffect(() => {
    gameRef.current = game;
  }, [game]);
  useEffect(() => {
    revealingRef.current = revealingRow !== null;
  }, [revealingRow]);

  const showToast = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast((t) => (t === text ? null : t)), 1600);
  }, []);

  /** Unsaved guesses live in state (for the "Saving…" pill), a ref and localStorage. */
  const setQueue = useCallback((q: PendingGuess[]) => {
    queueRef.current = q;
    setQueueState(q);
    if (playerIdRef.current) saveQueue(playerIdRef.current, q);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [gameRes, statusRes] = await Promise.all([fetch("/api/game"), fetch("/api/status")]);
      if (gameRes.status === 401) {
        router.replace("/");
        return;
      }
      if (!gameRes.ok || !statusRes.ok) throw new Error("load failed");
      const g: GameResponse = await gameRes.json();
      const s: StatusResponse = await statusRes.json();

      // Put any guesses still waiting on this phone back on top of the saved
      // board. If the two disagree, the server's board wins.
      const pid = g.you?.id ?? null;
      const firstLoad = playerIdRef.current === null;
      playerIdRef.current = pid;
      const pending = firstLoad && pid ? loadQueue(pid) : queueRef.current;
      const merged = g.solution ? mergeWithServer(g.guesses, pending, g.gameDate, g.solution) : "reload";
      const board = merged === "reload" ? g.guesses : merged.board;
      if (merged === "reload" && pending.length > 0) showToast("Updated from your saved game");
      setQueue(merged === "reload" ? [] : merged.queue);

      const local = boardStatus(board);
      const localFinished = local === "won" || local === "lost";
      setGame(
        g.finished
          ? g
          : {
              ...g,
              guesses: board,
              status: local,
              finished: localFinished,
              numGuesses: localFinished ? board.length : null,
            }
      );
      setServerFinished(g.finished);
      if (!revealingRef.current) setKeyboardGuesses(board);
      setStatus(s);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [router, setQueue, showToast]);

  /** Sends unsaved guesses to the server one at a time, oldest first. */
  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = null;

    const retryLater = () => {
      retryTimer.current = setTimeout(() => flushRef.current(), retryDelay.current);
      retryDelay.current = Math.min(retryDelay.current * 2, MAX_RETRY_MS);
    };

    try {
      while (queueRef.current.length > 0) {
        const next = queueRef.current[0];
        let res: Response;
        let data: { ok?: boolean; guesses?: GuessRecord[] } | null;
        try {
          res = await fetch("/api/guess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
          data = await res.json().catch(() => null);
        } catch {
          retryLater(); // offline or the request failed: keep it and try again
          return;
        }

        if (res.status === 401) {
          router.replace("/");
          return;
        }
        if (res.status >= 500 || !data) {
          retryLater();
          return;
        }

        if (data.ok && data.guesses) {
          retryDelay.current = FIRST_RETRY_MS;
          setQueue(queueRef.current.filter((p) => p !== next));
          const localBoard = gameRef.current?.guesses ?? [];
          if (!boardMatches(data.guesses, localBoard)) {
            setQueue([]);
            showToast("Updated from your saved game");
            await loadAll();
            return;
          }
          continue;
        }

        // The server turned it down (another device, a new day, …): its board wins.
        setQueue([]);
        showToast("Updated from your saved game");
        await loadAll();
        return;
      }
    } finally {
      flushingRef.current = false;
    }
  }, [router, setQueue, showToast, loadAll]);

  useEffect(() => {
    flushRef.current = () => void flush();
  }, [flush]);

  useEffect(() => {
    // Async fetch; state is only set after the responses arrive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll]);

  // Whenever something is waiting to be saved, try to send it.
  useEffect(() => {
    if (queue.length > 0) flushRef.current();
  }, [queue.length]);

  // Try again straight away when the connection comes back or the tab is reopened.
  useEffect(() => {
    const retry = () => {
      if (document.visibilityState === "visible" && queueRef.current.length > 0) flushRef.current();
    };
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", retry);
    return () => {
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", retry);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  // Finished on the phone and every guess saved: ask the server to confirm the
  // result before showing it, retrying until it answers.
  const awaitingConfirm = !!game?.finished && !serverFinished && queue.length === 0 && !holdBoard;
  useEffect(() => {
    if (!awaitingConfirm) return;
    // Async fetch; state is only set after the responses arrive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    const id = setInterval(loadAll, 5000);
    return () => clearInterval(id);
  }, [awaitingConfirm, loadAll]);

  const rejectGuess = useCallback(
    (text: string) => {
      showToast(text);
      setShaking(true);
      vibrate(80);
    },
    [showToast]
  );

  const busy = revealingRow !== null || holdBoard || extrasOpen;

  // Today's badges unlock once the day is revealed, so re-check when someone finishes.
  const revealKey = status ? `${serverFinished}:${status.players.filter((p) => p.playedToday).length}` : null;
  const lastRevealKey = useRef<string | null>(null);
  useEffect(() => {
    if (lastRevealKey.current && revealKey && revealKey !== lastRevealKey.current) refreshExtras();
    lastRevealKey.current = revealKey;
  }, [revealKey, refreshExtras]);

  const onKey = useCallback(
    (key: string) => {
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
      if (!isAllowedGuess(currentGuess)) {
        rejectGuess("Not in word list");
        return;
      }
      if (!game.solution) {
        showToast("Something went wrong — try again");
        return;
      }

      // Checked right here on the phone, with the same function the server
      // uses; the server re-checks and saves it in the background.
      const guesses = [...game.guesses, { guess: currentGuess, feedback: scoreGuess(currentGuess, game.solution) }];
      const result = boardStatus(guesses);
      const finished = result === "won" || result === "lost";
      const reduced = prefersReducedMotion();
      const revealMs = reduced ? 0 : REVEAL_MS;

      setGame({ ...game, status: result, guesses, numGuesses: finished ? guesses.length : null, finished });
      setQueue([...queueRef.current, { gameDate: game.gameDate, index: guesses.length - 1, guess: currentGuess }]);
      setCurrentGuess("");
      setRevealingRow(guesses.length - 1);
      if (finished) setHoldBoard(true);

      setTimeout(() => {
        setRevealingRow(null);
        setKeyboardGuesses(guesses);
      }, revealMs);

      if (finished) {
        setTimeout(
          () => {
            setHoldBoard(false);
            if (result === "won") {
              vibrate([40, 60, 120]);
              if (!reduced) {
                setCelebrate(true);
                setTimeout(() => setCelebrate(false), 4000);
              }
            }
          },
          revealMs + (reduced ? 0 : 700)
        );
      }
    },
    [game, busy, currentGuess, rejectGuess, showToast, setQueue]
  );

  async function switchPlayer() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // Go back anyway; the landing page will show who's still logged in.
    }
    router.push("/");
  }

  if (!game || !status) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4">
        {loadError ? (
          <>
            <p className="text-muted">Couldn&apos;t connect.</p>
            <button
              type="button"
              onClick={() => {
                setLoadError(false);
                loadAll();
              }}
              className="rounded-full bg-correct px-5 py-2.5 text-[16px] font-semibold text-white"
            >
              Try again
            </button>
          </>
        ) : (
          <p className="text-muted">Loading…</p>
        )}
      </main>
    );
  }

  const you = status.players.find((p) => p.id === game.you?.id) ?? null;
  const opponent = status.players.find((p) => p.id !== game.you?.id) ?? null;
  const nudgeFrom = game.finished ? null : (status.forYou?.nudgeFrom ?? null);
  const celebration = celebrationClosed ? null : (status.forYou?.celebration ?? null);
  const showResult = game.finished && serverFinished && queue.length === 0 && !holdBoard;
  const betweenGames = !celebration && revealingRow === null && (showResult || game.guesses.length === 0);
  const fxFor = (id?: string) => (id ? extras?.effects[id] : undefined);
  const weekly = extras?.weekly;
  const headerExtra = (weekly?.defendingChampion ? 26 : 0) + (weekly?.challenge ? 42 : 0);

  return (
    <>
      {celebrate && <Confetti />}
      <FlowerShower giftId={extras?.showerId} screen="play" waiting={extrasOpen || !!celebration} />
      <ExtrasLayer extras={extras} active={betweenGames} refresh={refreshExtras} onOpenChange={setExtrasOpen} />
      {celebration && (
        <CupCelebration
          celebration={celebration}
          players={status.players}
          onStartWeek={() => setCelebrationClosed(true)}
          onSeeCabinet={() => router.push("/cabinet")}
        />
      )}
      {showResult ? (
        <FinishedView
          game={game}
          status={status}
          opponent={opponent}
          extras={extras}
          onSwitch={switchPlayer}
          onRefresh={loadAll}
        />
      ) : (
        <main
          className="flex-1 flex flex-col items-center w-full max-w-[480px] mx-auto px-4 pt-5 pb-3"
          // Tiles shrink on short screens so the keyboard always stays on-screen
          // (with a little less room when the nudge banner is showing).
          style={
            {
              "--tile": `clamp(38px, min(15.5vw, calc((100dvh - ${(nudgeFrom ? 556 : 490) + headerExtra}px) / 6)), 62px)`,
            } as CSSProperties
          }
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
              className="relative h-14 w-14 rounded-full bg-accent-soft flex items-center justify-center text-ink"
            >
              <CabinetNewTag />
              <Clock className="h-6 w-6" strokeWidth={2.4} />
            </Link>
          </header>

          {nudgeFrom && (
            <div className="mt-3 w-full">
              <NudgeBanner from={nudgeFrom} compact />
            </div>
          )}

          {you && opponent && (
            <section className="mt-3 w-full rounded-[28px] bg-card shadow-soft px-4 pt-3 pb-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AvatarFx fx={fxFor(you.id)} size={46}>
                    <PlayerAvatar name={you.name} avatarInitial={you.avatarInitial} avatarUrl={you.avatarUrl} size={46} filled />
                  </AvatarFx>
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
                  <AvatarFx fx={fxFor(opponent.id)} size={46}>
                    <PlayerAvatar
                      name={opponent.name}
                      avatarInitial={opponent.avatarInitial}
                      avatarUrl={opponent.avatarUrl}
                      size={46}
                      filled
                    />
                  </AvatarFx>
                </div>
              </div>
              {weekly?.defendingChampion && (
                <p className="mt-1.5 flex items-center justify-center gap-1 text-[13px] font-semibold text-ink">
                  <Crown className="h-3.5 w-3.5 text-correct" strokeWidth={2.6} aria-hidden />
                  {weekly.defendingChampion} · Defending Champion
                </p>
              )}
              {weekly?.challenge && (
                <p className="mt-1.5 rounded-[14px] bg-[var(--madhulika-soft)] px-3 py-1.5 text-center text-[13px] font-semibold leading-tight text-ink">
                  {weekly.challenge}
                </p>
              )}
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
            {(queue.length > 0 || (game.finished && !serverFinished)) && (
              <div
                role="status"
                className="absolute bottom-0 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-muted"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-correct" aria-hidden />
                {game.finished ? "Saving your result…" : "Saving…"}
              </div>
            )}
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
  extras,
  onSwitch,
  onRefresh,
}: {
  game: GameResponse;
  status: StatusResponse;
  opponent: StatusPlayer | null;
  extras: ExtrasResponse | null;
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
  const [nudged, setNudged] = useState(game.youNudged);
  const [nudging, setNudging] = useState(false);

  async function nudge() {
    setNudging(true);
    try {
      const res = await fetch("/api/nudge", { method: "POST" });
      const data = await res.json();
      // "already_nudged" also means the nudge is out there — show it as sent.
      if (data.ok || data.reason === "already_nudged") {
        setNudged(true);
        vibrate(40);
      } else if (data.reason === "they_finished") {
        onRefresh();
      }
    } catch {
      // Offline or the request failed: the button stays tappable to try again.
    } finally {
      setNudging(false);
    }
  }

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
          className="relative h-14 w-14 rounded-full bg-accent-soft flex items-center justify-center text-ink"
        >
          <CabinetNewTag />
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
          <AvatarFx fx={extras?.effects[opponent.id]} size={58}>
            <PlayerAvatar
              name={opponent.name}
              avatarInitial={opponent.avatarInitial}
              avatarUrl={opponent.avatarUrl}
              size={58}
              ring
            />
          </AvatarFx>
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
              <button
                type="button"
                onClick={nudge}
                disabled={nudged || nudging}
                className="shrink-0 rounded-full border-2 px-5 py-2.5 text-[16px] font-semibold transition active:scale-95 disabled:active:scale-100"
                style={
                  nudged
                    ? { borderColor: oppTheme.soft, background: oppTheme.soft, color: oppTheme.ink }
                    : { borderColor: oppTheme.color, background: "var(--card)", color: oppTheme.ink }
                }
              >
                {nudged ? "Nudged ✓" : "Nudge"}
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
