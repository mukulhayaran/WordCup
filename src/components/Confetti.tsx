"use client";

import { useState, type CSSProperties } from "react";

const COLORS = ["#c93d66", "#f7c873", "#fbe3ea", "#e98aa6", "#ffffff", "#f0a35e"];

type Piece = { left: number; size: number; color: string; style: CSSProperties };

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    size: 6 + Math.random() * 7,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    style: {
      "--dx": `${(Math.random() - 0.5) * 160}px`,
      "--rot": `${(Math.random() - 0.5) * 900}deg`,
      "--dur": `${1.8 + Math.random() * 1.4}s`,
      "--delay": `${Math.random() * 0.4}s`,
    } as CSSProperties,
  }));
}

/** A one-shot confetti burst. Callers skip rendering it when reduced motion is preferred. */
export function Confetti() {
  const [pieces] = useState(() => makePieces(90));
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            ...p.style,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 3,
          }}
        />
      ))}
    </div>
  );
}
