import type { StatusPlayer, WeekDayResult } from "@/lib/apiTypes";
import { playerTheme } from "@/lib/theme";

const LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Monday–Sunday dots: filled in the colour of whoever took that day's point. */
export function WeekDots({
  days,
  today,
  players,
  size = 40,
}: {
  days: WeekDayResult[];
  today: string;
  players: StatusPlayer[];
  size?: number;
}) {
  const nameById = new Map(players.map((p) => [p.id, p.name]));

  return (
    <div className="flex justify-between gap-1">
      {days.map((day, i) => {
        const isToday = day.date === today;
        let background = "#fff0f3";
        let color = "var(--muted)";
        let border = "none";
        let label = `${day.date}: not played yet`;

        if (day.winnerIds && day.winnerIds.length === 1) {
          const theme = playerTheme(nameById.get(day.winnerIds[0]) ?? "");
          background = theme.color;
          color = theme.onColor;
          label = `${day.date}: ${nameById.get(day.winnerIds[0])} took the point`;
        } else if (day.winnerIds && day.winnerIds.length === 2) {
          background = "linear-gradient(135deg, var(--mukul) 50%, var(--madhulika) 50%)";
          color = "#ffffff";
          label = `${day.date}: tie`;
        } else if (day.winnerIds) {
          background = "var(--absent)";
          label = `${day.date}: no points`;
        } else if (isToday) {
          background = "var(--card)";
          color = "var(--correct)";
          border = "2px solid var(--correct)";
          label = `${day.date}: today`;
        }

        return (
          <div
            key={day.date}
            title={label}
            aria-label={label}
            className="rounded-full flex items-center justify-center font-semibold text-[15px]"
            style={{ width: size, height: size, background, color, border }}
          >
            {LABELS[i]}
          </div>
        );
      })}
    </div>
  );
}
