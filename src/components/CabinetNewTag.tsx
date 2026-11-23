"use client";

import { useEffect, useState } from "react";
import { postJson } from "./useExtras";

const SEEN_ON_DEVICE = "wordcup:cabinet-new-seen";

function seenOnThisDevice() {
  try {
    return localStorage.getItem(SEEN_ON_DEVICE) === "1";
  } catch {
    return false;
  }
}

/** Called when a logged-in player opens the cabinet: the tag is gone for good. */
export async function markCabinetNewSeen() {
  const res = await postJson("/api/cabinet/new", {});
  if (!res?.ok) return;
  try {
    localStorage.setItem(SEEN_ON_DEVICE, "1");
  } catch {
    // The server remembers it anyway once they're logged in.
  }
}

/**
 * A bright "NEW" tag for buttons that lead to the Trophy Cabinet. The button
 * needs `relative`. `whenLoggedOut` also shows it on the starter screen, where
 * we don't yet know who is playing.
 */
export function CabinetNewTag({ whenLoggedOut = false }: { whenLoggedOut?: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cabinet/new", { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) return setShow(whenLoggedOut && !seenOnThisDevice());
        if (!res.ok) return setShow(false);
        const data: { isNew: boolean } = await res.json();
        if (!cancelled) setShow(data.isNew);
      })
      .catch(() => {
        // Offline: no tag, nothing else depends on it.
      });
    return () => {
      cancelled = true;
    };
  }, [whenLoggedOut]);

  if (!show) return null;
  return (
    <span className="new-tag absolute -right-2 -top-2 z-10 rounded-full bg-correct px-2 py-0.5 text-[12px] font-bold leading-4 tracking-wide text-white shadow-key">
      NEW
    </span>
  );
}
