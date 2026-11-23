import type { CabinetEra, Celebration } from "./cups";
import type { LetterStatus } from "./feedback";
import type { PlayerEffects } from "./giftRules";
import type { Edition } from "./newspaper";
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

export type ExtrasFlower = { code: string; fromName: string; weekNumber: number | null; speech: string | null };
export type ExtrasVaseState = { flowers: ExtrasFlower[]; garlands: number };
export type ExtrasVase = { current: ExtrasVaseState; shelf: ExtrasVaseState[] };

/** Badges, the Newspaper and gifts. Login-only, and only ever built from revealed days. */
export type ExtrasResponse = {
  youId: string;
  players: Array<{ id: string; name: string }>;
  badges: {
    counts: Record<string, Record<string, number>>;
    popup: { badgeId: string; keys: string[] } | null;
    today: Record<string, string[]>;
  };
  weekly: {
    defendingChampion: string | null;
    challenge: string | null;
    timeline: Array<{ weekNumber: number; winner: string }>;
  };
  newspaper: { edition: Edition; speeches: Array<{ name: string; speech: string }>; unseen: boolean } | null;
  gifts: {
    owed: { weekNumber: number; toName: string; shared: boolean } | null;
    /** Who it's from only: what's inside stays secret until it's opened. */
    toOpen: Array<{ id: string; fromName: string; weekNumber: number | null }>;
    received: Array<{
      id: string;
      code: string;
      fromName: string;
      weekNumber: number | null;
      speech: string | null;
      thanks: string | null;
    }>;
  };
  vases: Record<string, ExtrasVase>;
  effects: Record<string, PlayerEffects>;
  /** The Flower Shower currently running for you, if any. */
  showerId: string | null;
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
  /** Today's word, so the phone can check guesses itself. Only today's is ever sent. */
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
