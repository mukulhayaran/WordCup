"use client";

import { useEffect, useState } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PinPad({
  onSubmit,
  disabled,
  color,
}: {
  onSubmit: (pin: string) => void;
  disabled?: boolean;
  color: string;
}) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    function add(digit: string) {
      if (disabled) return;
      const next = pin + digit;
      if (next.length === 4) {
        setPin("");
        onSubmit(next);
      } else {
        setPin(next);
      }
    }
    function handler(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^\d$/.test(e.key)) add(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pin, disabled, onSubmit]);

  function press(digit: string) {
    if (disabled) return;
    const next = pin + digit;
    if (next.length === 4) {
      setPin("");
      onSubmit(next);
    } else {
      setPin(next);
    }
  }

  const keyClass =
    "h-[72px] w-[72px] rounded-full bg-card shadow-key text-[28px] font-semibold text-ink active:scale-95 transition disabled:opacity-50";

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex gap-5" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[18px] w-[18px] rounded-full transition-colors"
            style={{
              background: i < pin.length ? color : "transparent",
              border: `2px solid ${i < pin.length ? color : "var(--typed)"}`,
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-x-7 gap-y-4">
        {KEYS.map((d) => (
          <button key={d} type="button" disabled={disabled} onClick={() => press(d)} className={keyClass}>
            {d}
          </button>
        ))}
        <div />
        <button type="button" disabled={disabled} onClick={() => press("0")} className={keyClass}>
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPin((p) => p.slice(0, -1))}
          className="h-[72px] w-[72px] rounded-full text-[17px] font-semibold text-muted active:scale-95 transition"
          aria-label="Delete"
        >
          DEL
        </button>
      </div>
    </div>
  );
}
