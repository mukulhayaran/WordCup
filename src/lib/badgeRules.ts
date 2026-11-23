import { BADGE_BY_ID, type Rarity } from "./badgeCatalog";
import type { LetterStatus } from "./feedback";
import { weekRangeForGameDate } from "./gameDate";
import { NOT_PLAYED, scoreDay, type DayOutcome } from "./scoring";

export type Side = "a" | "b";
export type GuessRow = { guess: string; feedback: LetterStatus[] };

/** One player's saved game for a revealed day. null = they never started it. */
export type PlayerDay = {
  status: "won" | "lost" | "in_progress";
  guesses: GuessRow[];
  numGuesses: number | null;
  finishedAt: string | null;
};

export type BadgeDay = { date: string; a: PlayerDay | null; b: PlayerDay | null };

export type BadgeCup = {
  weekStart: string;
  weekEnd: string;
  a: number;
  b: number;
  winner: Side | "tie";
  /** Points per day, Monday first. */
  days: Array<{ a: number; b: number }>;
};

export type Award = { badgeId: string; side: Side; date: string; key: string };

const SIDES: Side[] = ["a", "b"];
const otherSide = (s: Side): Side => (s === "a" ? "b" : "a");
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

const award = (badgeId: string, side: Side, date: string): Award => ({
  badgeId,
  side,
  date,
  key: `${badgeId}:${side}:${date}`,
});

const isFinished = (d: PlayerDay | null): d is PlayerDay => d?.status === "won" || d?.status === "lost";

function outcome(d: PlayerDay | null): DayOutcome {
  if (!isFinished(d)) return NOT_PLAYED;
  return { played: true, solved: d.status === "won", numGuesses: d.status === "won" ? d.numGuesses : null };
}

const correctCount = (g: GuessRow) => g.feedback.filter((f) => f === "correct").length;

function istHour(iso: string): number {
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS).getUTCHours();
}

/** True if any guess uses a letter an earlier guess already proved isn't in the word. */
export function reusedGreyLetter(guesses: GuessRow[]): boolean {
  const grey = new Set<string>();
  for (const g of guesses) {
    const letters = g.guess.split("");
    if (letters.some((l) => grey.has(l))) return true;
    // A letter marked absent can still be in the word if another copy of it scored.
    letters.forEach((l, i) => {
      const scoredElsewhere = letters.some((other, j) => other === l && g.feedback[j] !== "absent");
      if (g.feedback[i] === "absent" && !scoredElsewhere) grey.add(l);
    });
  }
  return false;
}

/** The badges one finished game earns on its own, whatever the other player did. */
function gameBadges(d: PlayerDay): string[] {
  const ids: string[] = [];
  const first = d.guesses[0];
  if (d.status === "lost") ids.push("D18");
  if (first && correctCount(first) >= 3) ids.push("D12");
  if (reusedGreyLetter(d.guesses)) ids.push("D17");

  if (d.status === "won") {
    if (d.numGuesses === 1) ids.push("D10");
    if (d.numGuesses === 2) ids.push("D11");
    if (d.numGuesses === 6) ids.push("D15");
    if (first && correctCount(first) === 0 && first.feedback.every((f) => f === "absent")) ids.push("D13");
    if (d.guesses.every((g) => !g.feedback.includes("present"))) ids.push("D14");
    const beforeWin = d.guesses.slice(0, -1).slice(-3);
    if (beforeWin.length === 3 && beforeWin.every((g) => correctCount(g) === 4)) ids.push("D16");
  }

  if (d.finishedAt) {
    const hour = istHour(d.finishedAt);
    if (hour < 4) ids.push("D21");
    else if (hour < 8) ids.push("D20");
  }
  return ids;
}

/** Daily badges across all revealed days, oldest first. A day nobody won pauses a win streak. */
export function computeDailyAwards(days: BadgeDay[]): Award[] {
  const awards: Award[] = [];
  const winRun = { a: 0, b: 0 };
  const playRun = { a: 0, b: 0 };
  const solveRun = { a: 0, b: 0 };
  const games = { a: 0, b: 0 };
  const firstThisWeek = new Map<string, number>();

  for (const day of [...days].sort((x, y) => (x.date < y.date ? -1 : 1))) {
    const { date } = day;
    const points = scoreDay(outcome(day.a), outcome(day.b));
    const winner: Side | null = points.a > points.b ? "a" : points.b > points.a ? "b" : null;

    if (winner) {
      const loser = otherSide(winner);
      if (winRun[loser] >= 3) awards.push(award("D4", winner, date));
      winRun[loser] = 0;
      winRun[winner]++;
      if (winRun[winner] === 2) awards.push(award("D1", winner, date));
      if (winRun[winner] === 3) awards.push(award("D2", winner, date));
      if (winRun[winner] === 5) awards.push(award("D3", winner, date));
    }

    const [a, b] = [day.a, day.b];
    if (isFinished(a) && isFinished(b)) {
      if (a.status === "lost" && b.status === "lost") {
        awards.push(award("D9", "a", date), award("D9", "b", date));
      } else if (a.status === "won" && b.status === "won") {
        const gap = Math.abs((a.numGuesses ?? 0) - (b.numGuesses ?? 0));
        if (gap === 0) awards.push(award("D8", "a", date), award("D8", "b", date));
        if (gap === 1 && winner) awards.push(award("D5", winner, date));
        if (gap >= 3 && winner) awards.push(award("D6", winner, date));
      } else if (winner) {
        awards.push(award("D7", winner, date));
      }

      if (a.finishedAt && b.finishedAt && a.finishedAt !== b.finishedAt) {
        const first: Side = a.finishedAt < b.finishedAt ? "a" : "b";
        const key = `${weekRangeForGameDate(date).weekStart}|${first}`;
        const count = (firstThisWeek.get(key) ?? 0) + 1;
        firstThisWeek.set(key, count);
        if (count === 5) awards.push(award("D22", first, date));
      }
    }

    for (const side of SIDES) {
      const d = day[side];
      if (d === null) awards.push(award("D19", side, date));
      if (isFinished(d)) {
        for (const id of gameBadges(d)) awards.push(award(id, side, date));
        games[side]++;
        playRun[side]++;
        if (games[side] % 100 === 0) awards.push(award("D25", side, date));
        if (playRun[side] % 30 === 0) awards.push(award("D23", side, date));
      } else {
        playRun[side] = 0;
      }
      if (d?.status === "won") {
        solveRun[side]++;
        if (solveRun[side] % 10 === 0) awards.push(award("D24", side, date));
      } else {
        solveRun[side] = 0;
      }
    }
  }
  return awards;
}

const pointsThrough = (cup: BadgeCup, side: Side, dayCount: number) =>
  cup.days.slice(0, dayCount).reduce((sum, d) => sum + d[side], 0);

/** Weekly badges across finished cups, oldest first. A tied cup ends every cup streak. */
export function computeCupAwards(cups: BadgeCup[]): Award[] {
  const awards: Award[] = [];
  let run: { side: Side; count: number } | null = null;
  let swaps = 0;

  cups.forEach((cup, i) => {
    const date = cup.weekEnd;
    const w = cup.winner;
    if (w === "tie") {
      awards.push(award("W14", "a", date), award("W14", "b", date));
      run = null;
      swaps = 0;
      return;
    }

    const loser = otherSide(w);
    const prev = cups[i - 1]?.winner;
    const prev2 = cups[i - 2]?.winner;
    const margin = cup[w] - cup[loser];
    const currentRun = run as { side: Side; count: number } | null;

    if (margin >= 4) awards.push(award("W9", w, date));
    if (cup[w] === 7 && cup[loser] === 0) awards.push(award("W10", w, date));
    if (margin === 1) awards.push(award("W11", w, date));
    if (pointsThrough(cup, w, 5) < pointsThrough(cup, loser, 5)) awards.push(award("W12", w, date));
    if (pointsThrough(cup, w, 6) <= pointsThrough(cup, loser, 6)) awards.push(award("W13", w, date));
    if (cup[loser] <= 1) awards.push(award("W15", loser, date));

    if (prev === loser) {
      awards.push(award("W6", w, date));
      if (prev2 === w) awards.push(award("W7", w, date));
      if (currentRun?.side === loser && currentRun.count >= 3) awards.push(award("W8", w, date));
      swaps++;
      if (swaps === 4) awards.push(award("W4", "a", date), award("W4", "b", date));
    } else {
      if (prev === w && swaps >= 3) awards.push(award("W5", w, date));
      swaps = 0;
    }

    const count: number = currentRun?.side === w ? currentRun.count + 1 : 1;
    run = { side: w, count };
    if (count === 2) awards.push(award("W1", w, date));
    if (count === 3) awards.push(award("W2", w, date));
    if (count === 5) awards.push(award("W3", w, date));
  });
  return awards;
}

const RARITY_RANK: Record<Rarity, number> = { legendary: 3, rare: 2, common: 1 };

/**
 * The one badge to pop up: the rarest new one, newest first. `keys` covers
 * every new award, so the others go quietly to the shelf.
 */
export function chooseBadgePopup(
  awards: Award[],
  side: Side,
  baselineDate: string,
  seen: Set<string>
): { award: Award; keys: string[] } | null {
  const fresh = awards.filter((a) => a.side === side && a.date >= baselineDate && !seen.has(a.key));
  if (fresh.length === 0) return null;
  const rank = (a: Award) => RARITY_RANK[BADGE_BY_ID.get(a.badgeId)?.rarity ?? "common"];
  const best = [...fresh].sort((x, y) => rank(y) - rank(x) || (x.date < y.date ? 1 : x.date > y.date ? -1 : 0))[0];
  return { award: best, keys: fresh.map((a) => a.key) };
}

export function countBadges(awards: Award[], side: Side): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of awards) if (a.side === side) counts[a.badgeId] = (counts[a.badgeId] ?? 0) + 1;
  return counts;
}
