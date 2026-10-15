import { Hand } from "lucide-react";

export function NudgeBanner({ from, compact = false }: { from: string; compact?: boolean }) {
  return (
    <div
      role="status"
      className={`flex w-full items-center gap-3 rounded-[22px] bg-correct text-white shadow-soft rise-in ${
        compact ? "px-4 py-2.5" : "px-5 py-4"
      }`}
    >
      <div className={`shrink-0 rounded-full bg-white/20 flex items-center justify-center ${compact ? "h-9 w-9" : "h-11 w-11"}`}>
        <Hand className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={2.4} aria-hidden />
      </div>
      <div className="leading-tight">
        <p className={`font-bold ${compact ? "text-[17px]" : "text-[19px]"}`}>{from} nudged you!</p>
        <p className={`opacity-90 ${compact ? "text-[13px]" : "text-[15px]"}`}>Today&apos;s word is waiting for you.</p>
      </div>
    </div>
  );
}
