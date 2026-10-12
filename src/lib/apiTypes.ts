import type { LetterStatus } from "./feedback";

export type StatusPlayer = {
  id: string;
  name: string;
  roleLabel: string;
  avatarInitial: string;
  avatarUrl: string | null;
  playedToday: boolean;
  weekPoints: number;
};

/** winnerIds: null = not revealed yet, [] = nobody scored, [id] = winner, [id, id] = tie. */
export type WeekDayResult = { date: string; winnerIds: string[] | null };

export type StatusResponse = {
  gameDate: string;
  weekday: string;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  weekScore: { a: number; b: number };
  weekDays: WeekDayResult[];
  players: StatusPlayer[];
  sessionPlayerId: string | null;
};

export type GuessRecord = { guess: string; feedback: LetterStatus[] };

export type GameResponse = {
  gameDate: string;
  status: "not_started" | "in_progress" | "won" | "lost";
  guesses: GuessRecord[];
  numGuesses: number | null;
  opponentPlayedToday: boolean;
  opponentName: string | null;
  finished: boolean;
  solution: string | null;
  solveStreak: number;
  you: { id: string; name: string; roleLabel: string } | null;
};

export type DuelPlayer = {
  id: string;
  name: string;
  roleLabel: string;
  avatarInitial: string;
  avatarUrl: string | null;
  status: "not_played" | "in_progress" | "won" | "lost";
  numGuesses: number | null;
  rows: LetterStatus[][];
  points: number;
  weekPoints: number;
};

export type DuelResponse =
  | { ok: true; revealed: false }
  | {
      ok: true;
      revealed: true;
      youId: string;
      gameDate: string;
      weekday: string;
      weekNumber: number;
      players: [DuelPlayer, DuelPlayer];
    };
