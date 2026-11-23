"use client";

import { useEffect, useState } from "react";
import type { ExtrasResponse } from "@/lib/apiTypes";
import { BadgePopup } from "./BadgeShelf";
import { GiftOpenSheet, GiftSendSheet } from "./GiftBox";
import { MondayNewspaper } from "./MondayNewspaper";
import { postJson } from "./useExtras";

const SNOOZE_KEY = "wordcup:gift-later";

function readSnoozedWeek(): number | null {
  try {
    const [week, day] = (window.localStorage.getItem(SNOOZE_KEY) ?? "").split("|");
    return day === new Date().toDateString() ? Number(week) : null;
  } catch {
    return null;
  }
}

function snoozeWeek(week: number) {
  try {
    window.localStorage.setItem(SNOOZE_KEY, `${week}|${new Date().toDateString()}`);
  } catch {
    // Storage blocked: the prompt just comes back next time.
  }
}

/**
 * One full-screen moment at a time, between games: a gift to open, a gift to
 * send, the Monday Newspaper, then a new badge. Tells the page when one is up
 * so typing doesn't reach the game board.
 */
export function ExtrasLayer({
  extras,
  active,
  refresh,
  onOpenChange,
}: {
  extras: ExtrasResponse | null;
  active: boolean;
  refresh: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [laterOpen, setLaterOpen] = useState(false);
  const [snoozedWeek, setSnoozedWeek] = useState<number | null>(() => (typeof window === "undefined" ? null : readSnoozedWeek()));
  const [paperClosed, setPaperClosed] = useState(false);
  const [closedPopup, setClosedPopup] = useState<string | null>(null);

  const you = extras?.players.find((p) => p.id === extras.youId);
  const toOpen = !laterOpen ? extras?.gifts.toOpen[0] : undefined;
  const owed = extras?.gifts.owed && extras.gifts.owed.weekNumber !== snoozedWeek ? extras.gifts.owed : null;
  const paper = extras?.newspaper?.unseen && !paperClosed ? extras.newspaper : null;
  const popup = extras?.badges.popup;
  const showPopup = !!popup && popup.keys.join() !== closedPopup;
  const open = !!extras && active && !!(toOpen || owed || paper || showPopup);

  useEffect(() => {
    onOpenChange(open);
  }, [open, onOpenChange]);

  if (!extras || !active) return null;

  if (toOpen) {
    return <GiftOpenSheet key={toOpen.id} gift={toOpen} onLater={() => setLaterOpen(true)} onDone={refresh} />;
  }
  if (owed) {
    return (
      <GiftSendSheet
        key={owed.weekNumber}
        owed={owed}
        onLater={() => {
          snoozeWeek(owed.weekNumber);
          setSnoozedWeek(owed.weekNumber);
        }}
        onDone={refresh}
      />
    );
  }
  if (paper) {
    return (
      <MondayNewspaper
        paper={paper}
        onClose={() => {
          setPaperClosed(true);
          void postJson("/api/newspaper/seen", { weekStart: paper.edition.weekStart });
        }}
      />
    );
  }
  if (popup && showPopup) {
    return (
      <BadgePopup
        badgeId={popup.badgeId}
        playerName={you?.name ?? ""}
        onClose={() => {
          setClosedPopup(popup.keys.join());
          void postJson("/api/badges/seen", { keys: popup.keys });
        }}
      />
    );
  }
  return null;
}
