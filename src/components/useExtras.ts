"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExtrasResponse } from "@/lib/apiTypes";

/**
 * Badges, the Newspaper and gifts for the logged-in player. Stays null when
 * logged out or if anything fails, so the game itself never depends on it.
 */
export function useExtras() {
  const [extras, setExtras] = useState<ExtrasResponse | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/extras");
      if (res.ok) setExtras(await res.json());
    } catch {
      // Offline: keep showing what we have.
    }
  }, []);

  useEffect(() => {
    // Async fetch; state is only set after the response arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { extras, refresh };
}

/** POSTs JSON; returns the reply, or null if the request failed. */
export async function postJson<T = { ok: boolean; reason?: string }>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
