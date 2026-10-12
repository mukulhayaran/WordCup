"use client";

import { useState } from "react";

export function PinPad({
  onSubmit,
  disabled,
  error,
}: {
  onSubmit: (pin: string) => void;
  disabled?: boolean;
  error?: string | null;
}) {
  const [pin, setPin] = useState("");

  function press(digit: string) {
    if (disabled) return;
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      onSubmit(next);
      setPin("");
    }
  }

  function backspace() {
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-4 w-4 rounded-full border-2 border-brand"
            style={{ background: i < pin.length ? "var(--brand)" : "transparent" }}
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => press(d)}
            className="h-14 w-14 rounded-full bg-card border border-card-border text-lg font-semibold disabled:opacity-50 active:scale-95 transition"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          type="button"
          disabled={disabled}
          onClick={() => press("0")}
          className="h-14 w-14 rounded-full bg-card border border-card-border text-lg font-semibold disabled:opacity-50 active:scale-95 transition"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={backspace}
          className="h-14 w-14 rounded-full bg-card border border-card-border text-sm font-semibold disabled:opacity-50 active:scale-95 transition"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
