import type { LetterStatus } from "@/lib/feedback";
import { TILE_BG } from "./tiles";

/** A colours-only grid, like the shareable emoji result. */
export function MiniGrid({ rows, tile = 22 }: { rows: LetterStatus[][]; tile?: number }) {
  return (
    <div className="flex flex-col" style={{ gap: tile * 0.2 }}>
      {rows.map((row, ri) => (
        <div key={ri} className="flex" style={{ gap: tile * 0.2 }}>
          {row.map((status, ci) => (
            <div
              key={ci}
              style={{
                width: tile,
                height: tile,
                borderRadius: Math.max(4, tile * 0.27),
                background: TILE_BG[status],
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
