"use client";

import { useEffect } from "react";
import type { GuessRecord } from "@/lib/apiTypes";
import type { LetterStatus } from "@/lib/feedback";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

function bestStatusPerLetter(guesses: GuessRecord[]): Record<string, LetterStatus> {
  const rank: Record<LetterStatus, number> = { absent: 0, present: 1, correct: 2 };
  const best: Record<string, LetterStatus> = {};
  for (const g of guesses) {
    g.guess.split("").forEach((letter, i) => {
      const status = g.feedback[i];
      if (!best[letter] || rank[status] > rank[best[letter]]) {
        best[letter] = status;
      }
    });
  }
  return best;
}

const KEY_COLOR: Record<LetterStatus, string> = {
  correct: "var(--tile-correct)",
  present: "var(--tile-present)",
  absent: "var(--tile-absent)",
};

export function Keyboard({
  guesses,
  onKey,
  disabled,
}: {
  guesses: GuessRecord[];
  onKey: (key: string) => void;
  disabled?: boolean;
}) {
  const letterStatus = bestStatusPerLetter(guesses);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (disabled) return;
      if (e.key === "Enter") onKey("ENTER");
      else if (e.key === "Backspace") onKey("BACKSPACE");
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toLowerCase());
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKey, disabled]);

  function Key({ value, wide, label }: { value: string; wide?: boolean; label?: string }) {
    const status = letterStatus[value];
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onKey(value)}
        className={`h-12 ${wide ? "px-3 text-xs" : "w-9"} rounded font-semibold uppercase disabled:opacity-50 active:scale-95 transition`}
        style={{
          background: status ? KEY_COLOR[status] : "var(--card)",
          color: status ? "white" : "var(--foreground)",
          border: "1px solid var(--card-border)",
          flex: wide ? "1 1 0" : undefined,
        }}
      >
        {label ?? value}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1.5 justify-center">
          {i === 2 && <Key value="ENTER" wide label="Enter" />}
          {row.split("").map((l) => (
            <Key key={l} value={l} />
          ))}
          {i === 2 && <Key value="BACKSPACE" wide label="⌫" />}
        </div>
      ))}
    </div>
  );
}
