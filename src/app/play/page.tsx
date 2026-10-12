"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Board } from "@/components/Board";
import { Keyboard } from "@/components/Keyboard";
import type { GameResponse } from "@/lib/apiTypes";
import { toEmojiRow, type LetterStatus } from "@/lib/feedback";

export default function PlayPage() {
  const router = useRouter();
  const [game, setGame] = useState<GameResponse | null>(null);
  const [currentGuess, setCurrentGuess] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/game").then(async (res) => {
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      setGame(await res.json());
    });
  }, [router]);

  const onKey = useCallback(
    async (key: string) => {
      if (!game || game.finished || submitting) return;

      if (key === "BACKSPACE") {
        setCurrentGuess((g) => g.slice(0, -1));
        setMessage(null);
        return;
      }
      if (key === "ENTER") {
        if (currentGuess.length !== 5) {
          setMessage("Not enough letters");
          return;
        }
        setSubmitting(true);
        setMessage(null);
        const res = await fetch("/api/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guess: currentGuess }),
        });
        const data = await res.json();
        setSubmitting(false);

        if (!data.ok) {
          setMessage(data.reason === "not_a_word" ? "Not in word list" : "Something went wrong");
          return;
        }
        setCurrentGuess("");
        setGame((g) =>
          g
            ? {
                ...g,
                status: data.status,
                guesses: data.guesses,
                numGuesses: data.numGuesses,
                finished: data.status === "won" || data.status === "lost",
              }
            : g
        );
        return;
      }
      if (/^[a-z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess((g) => g + key);
      }
    },
    [game, currentGuess, submitting]
  );

  async function switchPlayer() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  function shareText(): string {
    if (!game) return "";
    const grid = game.guesses.map((g) => toEmojiRow(g.feedback as LetterStatus[])).join("\n");
    const result = game.status === "won" ? `${game.numGuesses}/6` : "X/6";
    return `Word Cup ${game.gameDate} ${result}\n\n${grid}`;
  }

  async function share() {
    const text = shareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable (e.g. non-HTTPS); ignore silently.
    }
  }

  if (!game) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-foreground/60">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center gap-6 px-4 py-8">
      <header className="w-full max-w-md flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">Word Cup</h1>
          {game.you && <p className="text-xs text-foreground/50">{game.you.name} · {game.you.roleLabel}</p>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Link href="/history" className="text-brand underline">
            History
          </Link>
          <button onClick={switchPlayer} className="text-brand underline">
            Not you? Switch player
          </button>
        </div>
      </header>

      <Board guesses={game.guesses} currentGuess={game.finished ? "" : currentGuess} />

      {message && <p className="text-sm font-medium text-red-600">{message}</p>}

      {game.finished ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-bold">
            {game.status === "won" ? `Solved in ${game.numGuesses}/6!` : "Better luck tomorrow — X/6"}
          </p>
          <p className="text-sm text-foreground/60">
            {game.opponentPlayedToday
              ? `${game.opponentName} has also played today.`
              : `Waiting for ${game.opponentName} to play today.`}
          </p>
          <button
            onClick={share}
            className="px-4 py-2 rounded-full bg-brand text-white text-sm font-semibold active:scale-95 transition"
          >
            {copied ? "Copied!" : "Copy shareable result"}
          </button>
        </div>
      ) : (
        <Keyboard guesses={game.guesses} onKey={onKey} disabled={submitting} />
      )}
    </main>
  );
}
