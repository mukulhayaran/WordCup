import { toEmojiRow, type LetterStatus } from "./feedback";
import { datesInRange, todayGameDate, weekRangeForGameDate } from "./gameDate";
import { isDayRevealed, type FinishStatus } from "./reveal";
import { NOT_PLAYED, scoreDay, tallyCup, type DayOutcome } from "./scoring";
import { supabaseAdmin } from "./supabaseAdmin";
import { getAllPlayers, type Player } from "./auth";

type RawResult = {
  player_id: string;
  game_date: string;
  guesses: Array<{ guess: string; feedback: LetterStatus[] }>;
  num_guesses: number | null;
  status: "in_progress" | "won" | "lost";
};

type DaySummary = {
  gameDate: string;
  revealed: boolean;
  a: DayOutcome;
  b: DayOutcome;
  aEmojiGrid: string | null;
  bEmojiGrid: string | null;
  points: { a: number; b: number };
};

export type WeekSummary = {
  weekStart: string;
  weekEnd: string;
  isCurrent: boolean;
  a: number;
  b: number;
  champion: "a" | "b" | "tie";
  days: DaySummary[];
};

export type HistoryResult = {
  players: { a: Player; b: Player };
  weeks: WeekSummary[];
  headToHead: { aWins: number; bWins: number; ties: number };
  averageGuesses: { a: number | null; b: number | null };
  currentStreak: { a: number; b: number };
};

function toOutcome(row: RawResult | undefined): {
  outcome: DayOutcome;
  status: FinishStatus;
  emojiGrid: string | null;
} {
  if (!row) {
    return { outcome: NOT_PLAYED, status: "not_played", emojiGrid: null };
  }
  const status: FinishStatus = row.status;
  const outcome: DayOutcome =
    status === "in_progress"
      ? NOT_PLAYED // not yet finished; treated as not-played until it is
      : {
          played: true,
          solved: status === "won",
          numGuesses: status === "won" ? row.num_guesses : null,
        };
  const emojiGrid =
    status === "won" || status === "lost"
      ? row.guesses.map((g) => toEmojiRow(g.feedback)).join("\n")
      : null;
  return { outcome, status, emojiGrid };
}

export async function getHistory(now: Date = new Date()): Promise<HistoryResult> {
  const allPlayers = await getAllPlayers();
  if (allPlayers.length < 2) {
    throw new Error("Expected exactly two players to be set up");
  }
  const [a, b] = allPlayers;

  const db = supabaseAdmin();
  const { data: earliest } = await db
    .from("game_results")
    .select("game_date")
    .order("game_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const todayDate = todayGameDate(now);
  const { weekStart: currentWeekStart, weekEnd: currentWeekEnd } =
    weekRangeForGameDate(todayDate);

  if (!earliest) {
    return {
      players: { a, b },
      weeks: [
        {
          weekStart: currentWeekStart,
          weekEnd: currentWeekEnd,
          isCurrent: true,
          a: 0,
          b: 0,
          champion: "tie",
          days: [],
        },
      ],
      headToHead: { aWins: 0, bWins: 0, ties: 0 },
      averageGuesses: { a: null, b: null },
      currentStreak: { a: 0, b: 0 },
    };
  }

  const { weekStart: firstWeekStart } = weekRangeForGameDate(earliest.game_date);
  const allDates = datesInRange(firstWeekStart, currentWeekEnd);

  const { data: rows } = await db
    .from("game_results")
    .select("player_id, game_date, guesses, num_guesses, status")
    .gte("game_date", firstWeekStart)
    .lte("game_date", currentWeekEnd);

  const byDate = new Map<string, { a?: RawResult; b?: RawResult }>();
  for (const row of (rows ?? []) as RawResult[]) {
    const entry = byDate.get(row.game_date) ?? {};
    if (row.player_id === a.id) entry.a = row;
    if (row.player_id === b.id) entry.b = row;
    byDate.set(row.game_date, entry);
  }

  const allDays: DaySummary[] = allDates.map((gameDate) => {
    const entry = byDate.get(gameDate) ?? {};
    const aResult = toOutcome(entry.a);
    const bResult = toOutcome(entry.b);
    const revealed = isDayRevealed(gameDate, aResult.status, bResult.status, now);

    if (!revealed) {
      return {
        gameDate,
        revealed: false,
        a: NOT_PLAYED,
        b: NOT_PLAYED,
        aEmojiGrid: null,
        bEmojiGrid: null,
        points: { a: 0, b: 0 },
      };
    }

    return {
      gameDate,
      revealed: true,
      a: aResult.outcome,
      b: bResult.outcome,
      aEmojiGrid: aResult.emojiGrid,
      bEmojiGrid: bResult.emojiGrid,
      points: scoreDay(aResult.outcome, bResult.outcome),
    };
  });

  // Group into Monday..Sunday weeks.
  const weekMap = new Map<string, DaySummary[]>();
  for (const day of allDays) {
    const { weekStart } = weekRangeForGameDate(day.gameDate);
    const list = weekMap.get(weekStart) ?? [];
    list.push(day);
    weekMap.set(weekStart, list);
  }

  const weeks: WeekSummary[] = Array.from(weekMap.entries())
    .sort(([wa], [wb]) => (wa < wb ? -1 : 1))
    .map(([weekStart, days]) => {
      const { weekEnd } = weekRangeForGameDate(weekStart);
      const tally = tallyCup(days.map((d) => ({ a: d.a, b: d.b })));
      return {
        weekStart,
        weekEnd,
        isCurrent: weekStart === currentWeekStart,
        a: tally.a,
        b: tally.b,
        champion: tally.champion,
        days,
      };
    });

  // Head-to-head and averages, across all revealed days ever played.
  let aWins = 0;
  let bWins = 0;
  let ties = 0;
  let aGuessSum = 0;
  let aGuessCount = 0;
  let bGuessSum = 0;
  let bGuessCount = 0;

  const revealedDaysChronological = allDays.filter((d) => d.revealed);

  for (const day of revealedDaysChronological) {
    if (day.points.a > day.points.b) aWins++;
    else if (day.points.b > day.points.a) bWins++;
    else if (day.a.played || day.b.played) ties++;

    if (day.a.solved && day.a.numGuesses != null) {
      aGuessSum += day.a.numGuesses;
      aGuessCount++;
    }
    if (day.b.solved && day.b.numGuesses != null) {
      bGuessSum += day.b.numGuesses;
      bGuessCount++;
    }
  }

  // Current streak: consecutive most-recent revealed days strictly won.
  function currentStreakFor(key: "a" | "b"): number {
    let streak = 0;
    for (let i = revealedDaysChronological.length - 1; i >= 0; i--) {
      const day = revealedDaysChronological[i];
      const won = key === "a" ? day.points.a > day.points.b : day.points.b > day.points.a;
      if (!won) break;
      streak++;
    }
    return streak;
  }

  return {
    players: { a, b },
    weeks,
    headToHead: { aWins, bWins, ties },
    averageGuesses: {
      a: aGuessCount > 0 ? aGuessSum / aGuessCount : null,
      b: bGuessCount > 0 ? bGuessSum / bGuessCount : null,
    },
    currentStreak: { a: currentStreakFor("a"), b: currentStreakFor("b") },
  };
}
