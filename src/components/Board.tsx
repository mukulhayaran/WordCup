import type { GuessRecord } from "@/lib/apiTypes";
import type { LetterStatus } from "@/lib/feedback";

const TILE_COLOR: Record<LetterStatus, string> = {
  correct: "var(--tile-correct)",
  present: "var(--tile-present)",
  absent: "var(--tile-absent)",
};

export function Board({
  guesses,
  currentGuess,
  maxRows = 6,
}: {
  guesses: GuessRecord[];
  currentGuess: string;
  maxRows?: number;
}) {
  const rows = Array.from({ length: maxRows }, (_, i) => {
    if (i < guesses.length) return { letters: guesses[i].guess.split(""), feedback: guesses[i].feedback };
    if (i === guesses.length) {
      const letters = currentGuess.padEnd(5).split("");
      return { letters, feedback: null };
    }
    return { letters: ["", "", "", "", ""], feedback: null };
  });

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-2">
          {row.letters.map((letter, ci) => {
            const status = row.feedback?.[ci];
            return (
              <div
                key={ci}
                className="h-14 w-14 flex items-center justify-center text-2xl font-bold rounded border-2 uppercase transition-colors"
                style={{
                  borderColor: status ? TILE_COLOR[status] : letter.trim() ? "var(--brand)" : "var(--card-border)",
                  background: status ? TILE_COLOR[status] : "transparent",
                  color: status ? "white" : "var(--foreground)",
                }}
              >
                {letter.trim()}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
