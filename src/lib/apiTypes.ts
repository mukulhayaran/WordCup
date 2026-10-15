import type { CabinetEra, Celebration } from "./cups";
import type { LetterStatus } from "./feedback";
import type { Reaction } from "./socialRules";

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

export type InboxMessage = { id: string; fromName: string; gameDate: string; body: string };

/** Only present for the logged-in player. */
export type ForYou = {
  nudgeFrom: string | null;
  messages: InboxMessage[];
  celebration: Celebration | null;
};

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
  forYou: ForYou | null;
};

export type CabinetResponse = {
  totals: { won: Record<string, number>; shared: number };
  eras: CabinetEra[];
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
  youNudged: boolean;
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
      social: {
        reactionByYou: Reaction | null;
        reactionToYou: Reaction | null;
        messageByYou: string | null;
        messageToYou: string | null;
        canMessage: boolean;
        youScored: boolean;
      };
      gameDate: string;
      weekday: string;
      weekNumber: number;
      players: [DuelPlayer, DuelPlayer];
    };
