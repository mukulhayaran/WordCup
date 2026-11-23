"use client";

import { useState } from "react";
import type { ExtrasResponse } from "@/lib/apiTypes";
import {
  GIFTS,
  GIFT_BY_CODE,
  SPEECH_MAX_CHARS,
  SPEECH_SUGGESTIONS,
  THANKS,
  senderLine,
  type GiftCategory,
} from "@/lib/giftCatalog";
import { Confetti } from "./Confetti";
import { GiftArt } from "./GiftArt";
import { prefersReducedMotion, vibrate } from "./tiles";
import { postJson } from "./useExtras";

type Owed = NonNullable<ExtrasResponse["gifts"]["owed"]>;
type Tab = GiftCategory | "real";

const TABS: Array<[Tab, string]> = [
  ["flower", "Flowers"],
  ["silly", "Silly"],
  ["app", "In app"],
  ["real", "Real"],
];

const Sheet = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-bg fade-in" role="dialog" aria-modal="true" aria-label={label}>
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col px-5 pt-8 pb-8">{children}</div>
  </div>
);

const primary = "h-[56px] w-full shrink-0 rounded-full bg-correct text-[18px] font-semibold text-white active:scale-[0.98] transition disabled:opacity-50";
const secondary = "h-[52px] w-full shrink-0 rounded-full border-2 border-line bg-card text-[17px] font-semibold text-ink active:scale-[0.98] transition";

export function GiftSendSheet({ owed, onLater, onDone }: { owed: Owed; onLater: () => void; onDone: () => void }) {
  const [tab, setTab] = useState<Tab>("flower");
  const [code, setCode] = useState("F1");
  const [step, setStep] = useState<"pick" | "speech" | "sent">("pick");
  const [speech, setSpeech] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gift = GIFT_BY_CODE.get(code)!;
  const speechLength = Array.from(speech.trim()).length;

  async function send() {
    setSending(true);
    setError(null);
    const res = await postJson("/api/gifts/send", { giftCode: code, speech });
    setSending(false);
    if (res?.ok || res?.reason === "already_sent") {
      vibrate(40);
      setStep("sent");
    } else {
      setError(res ? "Couldn't send that one." : "Couldn't connect. Try again.");
    }
  }

  if (step === "sent") {
    return (
      <Sheet label="Gift sent">
        <div className="my-auto text-center">
          <div className="mx-auto flex h-[176px] w-[176px] items-center justify-center rounded-full bg-accent-soft text-correct tile-pop">
            <GiftArt icon={gift.icon} size={92} />
          </div>
          <h1 className="mt-6 text-[34px] font-bold text-ink">Tribute sent!</h1>
          <p className="mt-1 text-[17px] text-muted">
            {gift.name} is on its way to {owed.toName}.
          </p>
          {speech.trim() && <p className="mt-2 text-[15px] font-semibold text-ink">Your speech is in the Monday Newspaper.</p>}
        </div>
        <button type="button" onClick={onDone} className={primary}>
          Done
        </button>
      </Sheet>
    );
  }

  if (step === "speech") {
    return (
      <Sheet label="Concession Speech">
        <div className="text-center">
          <span className="rounded-full bg-accent-soft px-4 py-1.5 text-[14px] font-semibold text-ink">Step 2 of 2</span>
          <h1 className="mt-3 text-[30px] font-bold leading-tight text-ink">{owed.shared ? "A few words" : "Your Concession Speech"}</h1>
          <p className="mt-1 text-[16px] text-muted">One line, printed in the Monday Newspaper. You can skip it.</p>
        </div>
        <label htmlFor="speech" className="mt-5 text-[14px] font-semibold text-ink">
          What do you have to say?
        </label>
        <input
          id="speech"
          value={speech}
          onChange={(e) => setSpeech(e.target.value)}
          maxLength={SPEECH_MAX_CHARS * 2}
          className="mt-1.5 h-[52px] w-full rounded-[16px] border-2 border-line bg-card px-4 text-[16px] text-ink outline-none focus:border-typed"
        />
        <p className={`mt-1 text-right text-[13px] ${speechLength > SPEECH_MAX_CHARS ? "text-correct" : "text-muted"}`}>
          {speechLength}/{SPEECH_MAX_CHARS}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SPEECH_SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setSpeech(s)} className="min-h-11 rounded-full bg-card px-3 text-left text-[14px] font-semibold leading-tight text-ink shadow-key">
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-[18px] bg-card px-4 py-3 text-correct shadow-soft">
          <GiftArt icon={gift.icon} size={30} />
          <p className="leading-tight text-ink">
            <span className="block text-[13px] text-muted">You&apos;re sending</span>
            <span className="font-semibold">{gift.name}</span>
          </p>
        </div>
        <p className="mt-2 h-5 text-center text-[14px] font-semibold text-correct" role="alert">
          {error}
        </p>
        <div className="mt-auto flex flex-col gap-2.5 pt-3">
          <button type="button" onClick={send} disabled={sending || speechLength > SPEECH_MAX_CHARS} className={primary}>
            {sending ? "Sending…" : `Send to ${owed.toName}`}
          </button>
          <button type="button" onClick={() => setStep("pick")} className={secondary}>
            Back
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet label="Pick a gift">
      <div className="text-center">
        <span className="rounded-full bg-accent-soft px-4 py-1.5 text-[14px] font-semibold text-ink">Week {owed.weekNumber} cup is over</span>
        <h1 className="mt-3 text-[29px] font-bold leading-[1.1] text-ink">
          {owed.shared ? (
            <>
              A shared cup.
              <br />
              Send {owed.toName} a gift!
            </>
          ) : (
            <>
              {owed.toName} won.
              <br />
              Time to pay tribute!
            </>
          )}
        </h1>
      </div>
      <div className="mt-4 grid grid-cols-4 rounded-full bg-accent-soft p-1" role="tablist" aria-label="Gift type">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`h-11 rounded-full text-[14px] font-semibold text-ink ${tab === k ? "bg-card shadow-key" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "real" ? (
        <div className="mt-3 rounded-[18px] bg-[#f8eef1] p-3.5 text-center">
          <span className="rounded-full bg-[var(--madhulika-soft)] px-3 py-1 text-[14px] font-semibold text-ink">Coming soon</span>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {GIFTS.filter((g) => g.category === tab).map((g) => (
            <button
              key={g.code}
              type="button"
              aria-pressed={g.code === code}
              onClick={() => setCode(g.code)}
              className={`flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-[18px] border-2 px-1 py-2 text-[13px] font-semibold leading-[1.1] text-ink shadow-key ${
                g.code === code ? "border-correct bg-accent-soft" : "border-transparent bg-card"
              }`}
            >
              <span className="text-correct">
                <GiftArt icon={g.icon} size={32} />
              </span>
              {g.name}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-[14px] text-muted">
        {gift.name}: {senderLine(gift, owed.toName)}
      </p>
      <div className="mt-auto flex flex-col gap-2.5 pt-4">
        <button type="button" onClick={() => setStep("speech")} className={primary}>
          Next: Concession Speech
        </button>
        <button type="button" onClick={onLater} className={secondary}>
          Maybe later
        </button>
      </div>
    </Sheet>
  );
}

export function GiftOpenSheet({
  gift,
  onLater,
  onDone,
}: {
  gift: ExtrasResponse["gifts"]["toOpen"][number];
  onLater: () => void;
  onDone: () => void;
}) {
  const [opened, setOpened] = useState<{ code: string; speech: string | null; completedVase: number | null } | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);

  async function open() {
    setOpening(true);
    setError(null);
    const res = await postJson<{
      ok: boolean;
      reason?: string;
      gift?: { code: string; speech: string | null };
      completedVase?: number | null;
    }>("/api/gifts/open", { id: gift.id });
    setOpening(false);
    if (res?.ok && res.gift) {
      vibrate([40, 60, 120]);
      setConfetti(!prefersReducedMotion());
      setOpened({ ...res.gift, completedVase: res.completedVase ?? null });
    } else if (res?.reason === "already_opened") {
      onDone();
    } else {
      setError("Couldn't connect. Try again.");
    }
  }

  async function thank(line: string) {
    const previous = thanks;
    setThanks(line);
    const res = await postJson("/api/gifts/thanks", { id: gift.id, thanks: line });
    if (!res?.ok) setThanks(previous);
  }

  if (!opened) {
    return (
      <Sheet label="You've received a gift">
        <div className="text-center">
          {gift.weekNumber && (
            <span className="rounded-full bg-[var(--madhulika-soft)] px-4 py-1.5 text-[14px] font-semibold text-ink">Week {gift.weekNumber}</span>
          )}
          <h1 className="mt-3 text-[36px] font-bold leading-[1.08] text-correct">You&apos;ve received a tribute!</h1>
          <p className="mt-1.5 text-[17px] text-muted">From the Honourable {gift.fromName}.</p>
        </div>
        <button
          type="button"
          onClick={open}
          disabled={opening}
          aria-label="Cut the ribbon and open your gift"
          className="gift-wiggle mx-auto mt-8 flex h-[220px] w-[220px] items-center justify-center rounded-full bg-accent-soft text-correct"
        >
          <GiftArt icon="gift" size={130} />
        </button>
        <p className="mt-6 text-center text-[20px] font-semibold text-ink">{opening ? "Opening…" : "Tap to cut the ribbon"}</p>
        <p className="mt-1 h-5 text-center text-[14px] font-semibold text-correct" role="alert">
          {error}
        </p>
        <button type="button" onClick={onLater} className={`${secondary} mt-auto`}>
          Later
        </button>
      </Sheet>
    );
  }

  const def = GIFT_BY_CODE.get(opened.code);
  return (
    <Sheet label={`You received ${def?.name ?? "a gift"}`}>
      {confetti && <Confetti />}
      <div className="text-center">
        <span className="rounded-full bg-accent-soft px-4 py-1.5 text-[14px] font-semibold text-ink">From {gift.fromName}</span>
        <div className="mx-auto mt-4 flex h-[150px] w-[150px] items-center justify-center rounded-full bg-present tile-pop">
          <span className="flex h-[118px] w-[118px] items-center justify-center rounded-full bg-card text-correct">
            <GiftArt icon={def?.icon ?? "gift"} size={76} />
          </span>
        </div>
        <h1 className="mt-4 text-[29px] font-bold leading-[1.1] text-ink">{def?.name}</h1>
        <p className="mt-0.5 text-[16px] text-muted">{def?.line}</p>
        {opened.speech && <p className="mt-2 text-[16px] italic text-ink break-words">“{opened.speech}”</p>}
        {opened.completedVase && (
          <p className="mt-3 rounded-[14px] bg-correct px-3 py-2 text-[15px] font-semibold text-white">
            Vase #{opened.completedVase} is complete! It&apos;s on your shelf.
          </p>
        )}
      </div>
      <div className="mt-4 rounded-[24px] bg-card p-4 shadow-soft">
        <p className="text-[17px] font-bold text-ink">Vote of Thanks</p>
        <p className="mb-2 text-[14px] text-muted">Send {gift.fromName} a reply</p>
        <div className="grid grid-cols-2 gap-1.5">
          {THANKS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={t === thanks}
              disabled={!!thanks}
              onClick={() => thank(t)}
              className={`min-h-[46px] rounded-[14px] px-2 py-1 text-[14px] font-semibold leading-tight ${
                t === thanks ? "bg-correct text-white" : "bg-accent-soft text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <button type="button" onClick={onDone} className={`${primary} mt-auto`} style={{ marginTop: 16 }}>
        Done
      </button>
    </Sheet>
  );
}
