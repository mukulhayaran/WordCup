import type { StatusResponse } from "@/lib/apiTypes";
import { inDisplayOrder, playerTheme } from "@/lib/theme";
import { WeekDots } from "./WeekDots";

/** Landing-page cup card: big scores either side of "vs", then the week's day dots. */
export function CupScoreCard({ status }: { status: StatusResponse }) {
  const [left, right] = inDisplayOrder(status.players);
  return (
    <section className="rounded-[28px] bg-card shadow-soft px-6 pt-5 pb-6">
      <div className="flex justify-center">
        <span className="rounded-full bg-accent-soft px-4 py-1 text-[15px] font-semibold text-muted">
          This week&apos;s cup
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center">
        {[left, right].map((p, i) => (
          <div key={p.id} className={`flex flex-col items-center ${i === 1 ? "col-start-3" : ""}`}>
            <span className="text-[64px] font-bold leading-none" style={{ color: playerTheme(p.name).ink }}>
              {p.weekPoints}
            </span>
            <span className="mt-1 text-[17px] text-muted">{p.name}</span>
          </div>
        ))}
        <span className="col-start-2 row-start-1 text-[22px] font-semibold text-typed">vs</span>
      </div>
      <div className="mt-5">
        <WeekDots days={status.weekDays} today={status.gameDate} players={status.players} />
      </div>
    </section>
  );
}
