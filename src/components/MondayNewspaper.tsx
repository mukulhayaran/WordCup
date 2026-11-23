import type { ExtrasResponse } from "@/lib/apiTypes";
import { SHARED } from "@/lib/cups";
import { playerTheme } from "@/lib/theme";

type Newspaper = NonNullable<ExtrasResponse["newspaper"]>;

export function NewspaperPage({ paper }: { paper: Newspaper }) {
  const { edition, speeches } = paper;
  return (
    <article className="rounded-[10px] bg-[#fffdf8] p-4 text-ink shadow-soft" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <p className="border-b-[3px] border-double border-ink pb-1.5 text-center text-[27px] font-bold">The Word Cup Times</p>
      <p className="flex justify-between border-b border-ink py-1 text-[12px]">
        <span>Monday edition</span>
        <span>Week {edition.weekNumber} result</span>
      </p>
      <h2 className="mt-3.5 text-[36px] font-bold leading-none text-correct break-words">{edition.headline}</h2>
      <p className="mt-2 text-[17px] italic">{edition.subhead}</p>
      <div className="mt-3 flex items-center justify-center gap-5 border-y border-ink py-2">
        {edition.scores.map((s, i) => (
          <div key={s.name} className="flex items-center gap-5">
            {i === 1 && <span className="text-[22px] font-bold">–</span>}
            <div className="text-center">
              <p className="text-[30px] font-bold leading-none" style={{ color: playerTheme(s.name).ink }}>
                {s.points}
              </p>
              <p className="mt-1 text-[13px]">{s.name}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[15px] leading-snug">{edition.story}</p>
      {speeches.map((s) => (
        <div key={s.name} className="mt-3 rounded-[8px] bg-accent-soft px-2.5 py-2">
          <p className="text-[12px] font-bold">{s.name}&apos;s Concession Speech</p>
          <p className="text-[15px] italic break-words">“{s.speech}”</p>
        </div>
      ))}
    </article>
  );
}

export function MondayNewspaper({ paper, onClose }: { paper: Newspaper; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg fade-in" role="dialog" aria-modal="true" aria-label="The Monday Newspaper">
      <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col px-5 pt-8 pb-8">
        <NewspaperPage paper={paper} />
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-[56px] w-full shrink-0 rounded-full bg-correct text-[19px] font-semibold text-white active:scale-[0.98] transition"
        >
          Back to the game
        </button>
      </div>
    </div>
  );
}

/** Who won each cup on the site, oldest first. */
export function CupTimeline({ timeline }: { timeline: ExtrasResponse["weekly"]["timeline"] }) {
  if (timeline.length === 0) return null;
  const label = timeline
    .map((c) => `Week ${c.weekNumber}: ${c.winner === SHARED ? "shared" : c.winner}`)
    .join(", ");
  return (
    <section className="rounded-[24px] bg-card px-4 py-4 shadow-soft rise-in">
      <h2 className="text-[18px] font-bold text-ink">Cup timeline</h2>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="img" aria-label={label}>
        {timeline.map((c) => {
          const shared = c.winner === SHARED;
          const theme = playerTheme(c.winner);
          return (
            <div key={c.weekNumber} className="flex shrink-0 flex-col items-center gap-1 text-[12px] text-muted">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[16px] font-bold"
                style={
                  shared
                    ? { background: "linear-gradient(90deg, var(--mukul) 50%, var(--madhulika) 50%)", color: "#fff" }
                    : { background: theme.color, color: theme.onColor }
                }
              >
                {shared ? "=" : c.winner[0]}
              </span>
              W{c.weekNumber}
            </div>
          );
        })}
      </div>
    </section>
  );
}
