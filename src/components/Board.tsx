import type { CSSProperties } from "react";
import type { GuessRecord } from "@/lib/apiTypes";
import { TILE_BG, TILE_FG } from "./tiles";

export const FLIP_STAGGER_MS = 260;
export const FLIP_DURATION_MS = 520;

export function Board({
  guesses,
  currentGuess,
  revealingRow,
  shaking,
  onShakeEnd,
  maxRows = 6,
}: {
  guesses: GuessRecord[];
  currentGuess: string;
  /** Index of the row whose tiles should flip in now (just submitted). */
  revealingRow: number | null;
  shaking: boolean;
  onShakeEnd: () => void;
  maxRows?: number;
}) {
  return (
    <div className="flex flex-col gap-[6px]" role="grid" aria-label="Guesses">
      {Array.from({ length: maxRows }, (_, ri) => {
        const submitted = guesses[ri];
        const isCurrent = ri === guesses.length;
        const letters = submitted
          ? submitted.guess.split("")
          : isCurrent
            ? currentGuess.padEnd(5).split("")
            : ["", "", "", "", ""];

        return (
          <div
            key={ri}
            role="row"
            className={`flex gap-[6px] ${isCurrent && shaking ? "row-shake" : ""}`}
            onAnimationEnd={isCurrent ? onShakeEnd : undefined}
          >
            {letters.map((raw, ci) => {
              const letter = raw.trim();
              const status = submitted?.feedback[ci];
              // --tile is set by the page so the board shrinks to fit short screens.
              const base =
                "flex items-center justify-center rounded-[14px] border-2 uppercase font-semibold select-none w-[var(--tile,58px)] h-[var(--tile,58px)] text-[calc(var(--tile,58px)*0.5)]";

              if (status) {
                const style: CSSProperties & Record<string, string> = {
                  background: TILE_BG[status],
                  borderColor: TILE_BG[status],
                  color: TILE_FG[status],
                };
                if (ri === revealingRow) {
                  style["--to-bg"] = TILE_BG[status];
                  style["--to-fg"] = TILE_FG[status];
                  style.animationDelay = `${ci * FLIP_STAGGER_MS}ms`;
                }
                return (
                  <div
                    key={ci}
                    role="gridcell"
                    aria-label={`${letter} ${status}`}
                    className={`${base} ${ri === revealingRow ? "tile-flip" : ""}`}
                    style={style}
                  >
                    {letter}
                  </div>
                );
              }

              return (
                <div
                  // Re-keying on the letter remounts the tile so the pop plays on each keystroke.
                  key={`${ci}-${letter}`}
                  role="gridcell"
                  className={`${base} bg-card ${letter ? "tile-pop" : ""}`}
                  style={{ borderColor: letter ? "var(--typed)" : "var(--line)", color: "var(--ink)" }}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
