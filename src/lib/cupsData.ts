import { SHARED, type LegacyCup, type SiteCup } from "./cups";
import { getHistory, type HistoryResult } from "./history";
import { getLegacyCups } from "./social";

/** Everything the cabinet, history totals and celebration need. */
export async function getCupsOverview(now: Date = new Date()): Promise<{
  history: HistoryResult;
  siteCups: SiteCup[];
  legacy: LegacyCup[];
  current: { weekNumber: number; weekStart: string };
}> {
  const [history, legacy] = await Promise.all([getHistory(now), getLegacyCups()]);
  const { a, b } = history.players;

  // A finished week only counts as a cup if someone actually played in it.
  const siteCups: SiteCup[] = history.weeks
    .filter((w) => !w.isCurrent && w.days.some((d) => d.a.played || d.b.played))
    .map((w) => ({
      weekNumber: w.weekNumber,
      weekStart: w.weekStart,
      weekEnd: w.weekEnd,
      winner: w.champion === "a" ? a.name : w.champion === "b" ? b.name : SHARED,
      scores: { [a.name]: w.a, [b.name]: w.b },
    }));

  const currentWeek = history.weeks.find((w) => w.isCurrent) ?? history.weeks[history.weeks.length - 1];
  return {
    history,
    siteCups,
    legacy,
    current: { weekNumber: currentWeek.weekNumber, weekStart: currentWeek.weekStart },
  };
}
