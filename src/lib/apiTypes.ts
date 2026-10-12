import type { LetterStatus } from "./feedback";

export type StatusPlayer = {
  id: string;
  name: string;
  roleLabel: string;
  avatarInitial: string;
  avatarUrl: string | null;
  playedToday: boolean;
};

export type StatusResponse = {
  gameDate: string;
  weekStart: string;
  weekEnd: string;
  weekScore: { a: number; b: number };
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
  you: { name: string; roleLabel: string } | null;
};
