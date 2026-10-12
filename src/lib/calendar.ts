const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // Asia/Kolkata has no DST
const DAY_MS = 24 * 60 * 60 * 1000;

function parse(gameDate: string): Date {
  const [y, m, d] = gameDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function format(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekdayName(gameDate: string): string {
  return WEEKDAYS[parse(gameDate).getUTCDay()];
}

export function previousDate(gameDate: string): string {
  const d = parse(gameDate);
  d.setUTCDate(d.getUTCDate() - 1);
  return format(d);
}

/** 1-based cup number of `weekStart`, counting from the first cup's Monday. */
export function weekNumberSince(firstWeekStart: string, weekStart: string): number {
  const weeks = Math.round((parse(weekStart).getTime() - parse(firstWeekStart).getTime()) / (7 * DAY_MS));
  return Math.max(1, weeks + 1);
}

/** Milliseconds until the next game day starts (midnight Asia/Kolkata). */
export function msUntilNextGameDay(now: Date = new Date()): number {
  const istMs = now.getTime() + IST_OFFSET_MS;
  const nextMidnightIst = Math.floor(istMs / DAY_MS) * DAY_MS + DAY_MS;
  return nextMidnightIst - istMs;
}

/** "Nov 16–22" within a month, "Oct 26–Nov 1" across months. */
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const s = parse(weekStart);
  const e = parse(weekEnd);
  const sLabel = `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()}`;
  const eLabel =
    s.getUTCMonth() === e.getUTCMonth() ? `${e.getUTCDate()}` : `${MONTHS[e.getUTCMonth()]} ${e.getUTCDate()}`;
  return `${sLabel}–${eLabel}`;
}

/**
 * Consecutive solved days ending today. An unfinished today doesn't break
 * the streak — counting then starts from yesterday.
 */
export function solveStreak(
  results: Array<{ game_date: string; status: string }>,
  today: string
): number {
  const byDate = new Map(results.map((r) => [r.game_date, r.status]));
  let date = byDate.get(today) === "won" || byDate.get(today) === "lost" ? today : previousDate(today);
  let streak = 0;
  while (byDate.get(date) === "won") {
    streak++;
    date = previousDate(date);
  }
  return streak;
}

/** Length of the longest run of `true` values. */
export function longestRun(flags: boolean[]): number {
  let best = 0;
  let run = 0;
  for (const f of flags) {
    run = f ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
