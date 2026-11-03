import { afterEach, describe, expect, it, vi } from "vitest";
import type { GuessRecord } from "./apiTypes";
import { scoreGuess } from "./feedback";
import { submitGuessWith, type GameResultRow, type GameStore } from "./guessCore";
import {
  boardMatches,
  boardStatus,
  loadQueue,
  mergeWithServer,
  saveQueue,
  type PendingGuess,
} from "./pendingGuesses";

const SOLUTION = "crane";
const D = "2026-11-03";
const rec = (guess: string): GuessRecord => ({ guess, feedback: scoreGuess(guess, SOLUTION) });
const pend = (index: number, guess: string, gameDate = D): PendingGuess => ({ gameDate, index, guess });

describe("mergeWithServer", () => {
  it("drops guesses the server already saved and keeps the rest, coloured", () => {
    const merged = mergeWithServer([rec("least")], [pend(0, "least"), pend(1, "heart")], D, SOLUTION);
    expect(merged).toEqual({ board: [rec("least"), rec("heart")], queue: [pend(1, "heart")] });
  });

  it("restores a whole board typed offline", () => {
    const merged = mergeWithServer([], [pend(1, "heart"), pend(0, "least")], D, SOLUTION);
    expect(merged !== "reload" && merged.board.map((g) => g.guess)).toEqual(["least", "heart"]);
  });

  it("ignores guesses from another day", () => {
    expect(mergeWithServer([], [pend(0, "least", "2026-11-02")], D, SOLUTION)).toEqual({ board: [], queue: [] });
  });

  it("lets the server win when a saved guess disagrees", () => {
    expect(mergeWithServer([rec("least")], [pend(0, "heart")], D, SOLUTION)).toBe("reload");
  });

  it("stops at a gap", () => {
    const merged = mergeWithServer([], [pend(0, "least"), pend(2, "plant")], D, SOLUTION);
    expect(merged).toEqual({ board: [rec("least")], queue: [pend(0, "least")] });
  });

  it("adds nothing after the game is already won", () => {
    const merged = mergeWithServer([rec("crane")], [pend(1, "least")], D, SOLUTION);
    expect(merged).toEqual({ board: [rec("crane")], queue: [] });
  });

  it("colours guesses exactly as the server does", async () => {
    const rows = new Map<string, GameResultRow>();
    const store: GameStore = {
      async get() {
        return rows.get("r") ?? null;
      },
      async insertFirst(row) {
        rows.set("r", row);
        return row;
      },
      async updateIfGuessCount(row) {
        rows.set("r", row);
        return row;
      },
    };
    const words = ["eerie", "llama", "nanny", "crane"];
    for (const [i, w] of words.entries()) {
      await submitGuessWith({ store, getSolution: async () => SOLUTION }, "p", D, w, i);
    }
    const local = mergeWithServer([], words.map((w, i) => pend(i, w)), D, SOLUTION);
    expect(local !== "reload" && local.board).toEqual(rows.get("r")!.guesses);
  });
});

describe("boardMatches", () => {
  it("is true when the server's board is the start of the phone's", () => {
    expect(boardMatches([rec("least")], [rec("least"), rec("heart")])).toBe(true);
    expect(boardMatches([], [])).toBe(true);
  });

  it("is false when they differ or the server has more", () => {
    expect(boardMatches([rec("heart")], [rec("least")])).toBe(false);
    expect(boardMatches([rec("least"), rec("heart")], [rec("least")])).toBe(false);
  });
});

describe("boardStatus", () => {
  it("follows the server's rules", () => {
    expect(boardStatus([])).toBe("not_started");
    expect(boardStatus([rec("least")])).toBe("in_progress");
    expect(boardStatus([rec("least"), rec("crane")])).toBe("won");
    expect(boardStatus(["least", "heart", "plant", "moist", "fudge", "bloat"].map(rec))).toBe("lost");
  });
});

describe("loadQueue / saveQueue", () => {
  afterEach(() => vi.unstubAllGlobals());

  function fakeStorage() {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  }

  it("round-trips a queue and clears it when empty", () => {
    const localStorage = fakeStorage();
    vi.stubGlobal("window", { localStorage });
    saveQueue("p1", [pend(0, "least")]);
    expect(loadQueue("p1")).toEqual([pend(0, "least")]);
    expect(loadQueue("p2")).toEqual([]);
    saveQueue("p1", []);
    expect(localStorage.getItem("wordcup:pending:p1")).toBeNull();
  });

  it("treats junk as empty", () => {
    const localStorage = fakeStorage();
    localStorage.setItem("wordcup:pending:p1", "{not json");
    vi.stubGlobal("window", { localStorage });
    expect(loadQueue("p1")).toEqual([]);
  });

  it("survives storage that throws or isn't there", () => {
    const boom = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("window", { localStorage: { getItem: boom, setItem: boom, removeItem: boom } });
    expect(loadQueue("p1")).toEqual([]);
    expect(() => saveQueue("p1", [pend(0, "least")])).not.toThrow();
    vi.stubGlobal("window", undefined);
    expect(loadQueue("p1")).toEqual([]);
    expect(() => saveQueue("p1", [])).not.toThrow();
  });
});
