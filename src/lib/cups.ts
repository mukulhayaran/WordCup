import { formatWeekRange, previousDate } from "./calendar";
import { weekRangeForGameDate } from "./gameDate";

/** A player's name, or "shared" for a tied cup. */
export type CupWinner = string;
export const SHARED = "shared";

/** A finished Monday–Sunday cup played on the site. */
export type SiteCup = {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  winner: CupWinner;
  scores: Record<string, number>;
};

/** A cup from before the site existed (legacy_cups table). */
export type LegacyCup = {
  era: string;
  label: string;
  winner: CupWinner;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
};

/** Cups won per player plus shared cups. Legacy cups count; daily stats never see them. */
export function cupTotals(
  playerNames: string[],
  legacy: LegacyCup[],
  site: SiteCup[]
): { won: Record<string, number>; shared: number } {
  const won = Object.fromEntries(playerNames.map((n) => [n, 0]));
  let shared = 0;
  for (const cup of [...legacy, ...site]) {
    if (cup.winner === SHARED) shared++;
    else if (cup.winner in won) won[cup.winner]++;
  }
  return { won, shared };
}

/**
 * The trophy number a site cup gets in the cabinet: the winner's own count
 * (legacy cups first, then site cups in order), or for a shared cup, its
 * position among all trophies.
 */
export function trophyNumber(cup: SiteCup, legacy: LegacyCup[], siteChronological: SiteCup[]): number {
  const upToHere = siteChronological.filter((c) => c.weekStart <= cup.weekStart);
  if (cup.winner === SHARED) return legacy.length + upToHere.length;
  return (
    legacy.filter((c) => c.winner === cup.winner).length + upToHere.filter((c) => c.winner === cup.winner).length
  );
}

export type Celebration = SiteCup & { trophyNumber: number; nextWeekNumber: number };

/**
 * The cup to celebrate when a player opens the app: the week that ended at the
 * most recent Sunday midnight IST — if anyone played in it and this player
 * hasn't seen its celebration yet.
 */
export function pendingCelebration(input: {
  today: string;
  siteCups: SiteCup[];
  legacy: LegacyCup[];
  seenWeekStarts: Set<string>;
}): Celebration | null {
  const lastWeekEnd = previousDate(weekRangeForGameDate(input.today).weekStart);
  const cup = input.siteCups.find((c) => c.weekEnd === lastWeekEnd);
  if (!cup || input.seenWeekStarts.has(cup.weekStart)) return null;
  return {
    ...cup,
    trophyNumber: trophyNumber(cup, input.legacy, input.siteCups),
    nextWeekNumber: cup.weekNumber + 1,
  };
}

// ---- Cabinet shelves ----

export type CabinetTrophy = {
  label: string;
  sublabel: string;
  /** null = the current, still-open week (drawn as a dashed empty slot). */
  winner: CupWinner | null;
};

export type CabinetEra = { name: string; meta: string; legacy: boolean; trophies: CabinetTrophy[] };

export const SITE_ERA = "Word Cup era";

const year = (d: string) => d.slice(0, 4);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (d: string) => `${MONTHS[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))}`;

export function legacyDateLabel(startDate: string | null, endDate: string | null): string {
  if (startDate && endDate) return `${formatWeekRange(startDate, endDate)}, ${year(endDate)}`;
  if (startDate) return `from ${day(startDate)}, ${year(startDate)}`;
  if (endDate) return `until ${day(endDate)}, ${year(endDate)}`;
  return "date unknown";
}

function yearSpan(dates: string[]): string {
  const years = [...new Set(dates.map(year))].sort();
  if (years.length === 0) return "";
  return years.length === 1 ? years[0] : `${years[0]}–${years[years.length - 1]}`;
}

/** Shelves: the site era first (finished cups + the open week), then each legacy era. */
export function buildCabinet(input: {
  siteCups: SiteCup[];
  current: { weekNumber: number; weekStart: string };
  legacy: LegacyCup[];
}): CabinetEra[] {
  const siteEra: CabinetEra = {
    name: SITE_ERA,
    meta: yearSpan([...input.siteCups.map((c) => c.weekStart), input.current.weekStart]),
    legacy: false,
    trophies: [
      ...input.siteCups.map((c) => ({
        label: `Week ${c.weekNumber}`,
        sublabel: formatWeekRange(c.weekStart, c.weekEnd),
        winner: c.winner,
      })),
      { label: `Week ${input.current.weekNumber}`, sublabel: "ends Sunday", winner: null },
    ],
  };

  const byEra = new Map<string, LegacyCup[]>();
  for (const cup of [...input.legacy].sort((a, b) => a.sortOrder - b.sortOrder)) {
    byEra.set(cup.era, [...(byEra.get(cup.era) ?? []), cup]);
  }
  const legacyEras: CabinetEra[] = [...byEra.entries()].map(([name, cups]) => {
    const dates = cups.flatMap((c) => [c.startDate, c.endDate]).filter((d): d is string => !!d);
    return {
      name,
      meta: dates.length ? yearSpan(dates) : "before the site",
      legacy: true,
      trophies: cups.map((c) => ({ label: c.label, sublabel: legacyDateLabel(c.startDate, c.endDate), winner: c.winner })),
    };
  });

  return [siteEra, ...legacyEras];
}
