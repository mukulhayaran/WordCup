"use client";

import { useEffect } from "react";
import type { GuessRecord } from "@/lib/apiTypes";
import type { LetterStatus } from "@/lib/feedback";
import { TILE_BG, TILE_FG } from "./tiles";

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
      if (disabled || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") onKey("ENTER");
      else if (e.key === "Backspace") onKey("BACKSPACE");
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toLowerCase());
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKey, disabled]);

  const key = (value: string, label: string, grow: number, ariaLabel?: string) => {
    const status = letterStatus[value];
    return (
      <button
        key={value}
        type="button"
        disabled={disabled}
        onClick={() => onKey(value)}
        aria-label={ariaLabel ?? label}
        className={`h-[52px] rounded-[12px] font-semibold uppercase active:scale-95 transition-[transform,background-color] duration-200 ${
          label.length > 1 ? "text-[13px]" : "text-[18px]"
        }`}
        style={{
          flex: `${grow} 1 0`,
          background: status ? TILE_BG[status] : "var(--accent-soft)",
          color: status ? TILE_FG[status] : "var(--ink)",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-[6px] w-full max-w-[480px]">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-[6px]">
          {i === 1 && <div style={{ flex: "0.5 1 0" }} />}
          {i === 2 && key("ENTER", "Enter", 1.5)}
          {row.split("").map((l) => key(l, l, 1))}
          {i === 2 && key("BACKSPACE", "Del", 1.5, "Delete")}
          {i === 1 && <div style={{ flex: "0.5 1 0" }} />}
        </div>
      ))}
    </div>
  );
}
