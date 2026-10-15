import { useId } from "react";

const COLORS: Record<string, { fill: string; dark: string }> = {
  Mukul: { fill: "#c93d66", dark: "#a12e50" },
  Madhulika: { fill: "#f2be5c", dark: "#d4952a" },
};

/**
 * Flat trophy. `winner` is a player's name, "shared" (half and half), or
 * null for the still-open week (dashed outline).
 */
export function TrophyIcon({ winner, size = 56 }: { winner: string | null; size?: number }) {
  const gradientId = useId();
  const height = (size * 56) / 48;

  if (winner === null) {
    const s = { fill: "none", stroke: "#e39ab2", strokeWidth: 2, strokeDasharray: "3.5 3", strokeLinejoin: "round" as const };
    return (
      <svg width={size} height={height} viewBox="0 0 48 56" aria-hidden>
        <path d="M10 10 H5 a6 6 0 0 0 6 11 M38 10 H43 a6 6 0 0 1 -6 11" {...s} />
        <path d="M10 6 H38 V18 a14 14 0 0 1 -28 0 Z" {...s} />
        <path d="M21 32 V39 M27 32 V39" {...s} />
        <rect x="12" y="41" width="24" height="10" rx="3" {...s} />
      </svg>
    );
  }

  const shared = winner === "shared";
  const c = COLORS[winner] ?? COLORS.Madhulika;
  const fill = shared ? `url(#${gradientId})` : c.fill;
  const dark = shared ? `url(#${gradientId}-d)` : c.dark;

  return (
    <svg width={size} height={height} viewBox="0 0 48 56" aria-hidden>
      {shared && (
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor={COLORS.Mukul.fill} />
            <stop offset="50%" stopColor={COLORS.Madhulika.fill} />
          </linearGradient>
          <linearGradient id={`${gradientId}-d`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor={COLORS.Mukul.dark} />
            <stop offset="50%" stopColor={COLORS.Madhulika.dark} />
          </linearGradient>
        </defs>
      )}
      <path d="M10 10 H5 a6 6 0 0 0 6 11" fill="none" stroke={shared ? COLORS.Mukul.fill : c.fill} strokeWidth="3.5" />
      <path d="M38 10 H43 a6 6 0 0 1 -6 11" fill="none" stroke={shared ? COLORS.Madhulika.fill : c.fill} strokeWidth="3.5" />
      <path d="M10 6 H38 V18 a14 14 0 0 1 -28 0 Z" fill={fill} />
      <rect x="15" y="10" width="3.5" height="12" rx="1.75" fill="#ffffff" opacity="0.45" />
      <rect x="21" y="31" width="6" height="9" fill={dark} />
      <rect x="15" y="38" width="18" height="5" rx="2" fill={fill} />
      <rect x="11" y="43" width="26" height="9" rx="3" fill={dark} />
      <circle cx="24" cy="47.5" r="1.7" fill="#ffffff" opacity="0.75" />
    </svg>
  );
}
