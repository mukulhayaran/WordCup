const GAME_TIME_ZONE = "Asia/Kolkata";

/** Returns the current game-date (YYYY-MM-DD) in the shared Asia/Kolkata time zone. */
export function todayGameDate(now: Date = new Date()): string {
  return formatInTimeZone(now, GAME_TIME_ZONE);
}

function formatInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA formats as YYYY-MM-DD
  return formatter.format(date);
}

/**
 * Returns the Monday..Sunday game-date range (inclusive) of the IST week
 * containing `gameDate`.
 */
export function weekRangeForGameDate(gameDate: string): {
  weekStart: string;
  weekEnd: string;
} {
  const [year, month, day] = gameDate.split("-").map(Number);
  // Use noon UTC to avoid any DST/offset edge cases when shifting by whole days.
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  const isoWeekday = d.getUTCDay() === 0 ? 7 : d.getUTCDay(); // Mon=1..Sun=7
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (isoWeekday - 1));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    weekStart: toDateString(monday),
    weekEnd: toDateString(sunday),
  };
}

function toDateString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** All game-dates (YYYY-MM-DD) from weekStart to weekEnd, inclusive. */
export function datesInRange(weekStart: string, weekEnd: string): string[] {
  const [sy, sm, sd] = weekStart.split("-").map(Number);
  const [ey, em, ed] = weekEnd.split("-").map(Number);
  const start = new Date(Date.UTC(sy, sm - 1, sd, 12));
  const end = new Date(Date.UTC(ey, em - 1, ed, 12));
  const dates: string[] = [];
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(toDateString(d));
  }
  return dates;
}

/** True if `gameDate` (YYYY-MM-DD, Asia/Kolkata) is strictly before today's game date. */
export function isGameDateOver(gameDate: string, now: Date = new Date()): boolean {
  return gameDate < todayGameDate(now);
}
