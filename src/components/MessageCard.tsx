"use client";

import { MessageCircle, X } from "lucide-react";
import type { InboxMessage } from "@/lib/apiTypes";
import { weekdayName } from "@/lib/calendar";
import { playerTheme } from "@/lib/theme";

/** A winner's message for the logged-in player, dismissible. */
export function MessageCard({ message, onDismiss }: { message: InboxMessage; onDismiss: (id: string) => void }) {
  const theme = playerTheme(message.fromName);
  return (
    <div className="relative w-full rounded-[24px] bg-card shadow-soft px-5 py-4 rise-in" style={{ borderLeft: `6px solid ${theme.color}` }}>
      <div className="flex items-center gap-2 pr-8 text-[15px] font-semibold text-muted">
        <MessageCircle className="h-4 w-4" strokeWidth={2.6} aria-hidden />
        {message.fromName}&apos;s winning words · {weekdayName(message.gameDate)}
      </div>
      <p className="mt-1.5 text-[19px] font-semibold leading-snug text-ink break-words">“{message.body}”</p>
      <button
        type="button"
        onClick={() => onDismiss(message.id)}
        aria-label="Dismiss message"
        className="absolute right-3 top-3 h-8 w-8 rounded-full bg-accent-soft flex items-center justify-center text-muted"
      >
        <X className="h-4 w-4" strokeWidth={2.6} />
      </button>
    </div>
  );
}
