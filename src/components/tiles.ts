import type { LetterStatus } from "@/lib/feedback";

export const TILE_BG: Record<LetterStatus, string> = {
  correct: "var(--correct)",
  present: "var(--present)",
  absent: "var(--absent)",
};

export const TILE_FG: Record<LetterStatus, string> = {
  correct: "#ffffff",
  present: "var(--ink)",
  absent: "var(--muted)",
};

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
