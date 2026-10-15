import { describe, expect, it } from "vitest";
import { MAX_GUESSES, submitGuessWith, type GameResultRow, type GameStore } from "./guessCore";

/** In-memory store with the same compare-and-swap semantics as the real one. */
function memoryStore(): GameStore & { rows: Map<string, GameResultRow> } {
  const rows = new Map<string, GameResultRow>();
  const key = (p: string, d: string) => `${p}|${d}`;
  const tick = () => new Promise((r) => setTimeout(r, 0)); // let concurrent calls interleave
  return {
    rows,
    async get(p, d) {
      await tick();
      const row = rows.get(key(p, d));
      return row ? structuredClone(row) : null;
    },
    async insertFirst(row) {
      await tick();
      if (rows.has(key(row.player_id, row.game_date))) return "conflict";
      rows.set(key(row.player_id, row.game_date), structuredClone(row));
      return row;
    },
    async updateIfGuessCount(row, expected) {
      await tick();
      const current = rows.get(key(row.player_id, row.game_date));
      if (!current || current.status !== "in_progress" || current.guesses.length !== expected) return "conflict";
      rows.set(key(row.player_id, row.game_date), structuredClone(row));
      return row;
    },
  };
}

const deps = (store: GameStore) => ({ store, getSolution: async () => "crane" });
const P = "player-1";
const D = "2026-10-15";

describe("submitGuessWith — simultaneous submissions", () => {
  it("accepts only one of two simultaneous first guesses", async () => {
    const store = memoryStore();
    const results = await Promise.all([
      submitGuessWith(deps(store), P, D, "least"),
      submitGuessWith(deps(store), P, D, "heart"),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.reason === "conflict")).toHaveLength(1);
    expect(store.rows.get(`${P}|${D}`)!.guesses).toHaveLength(1);
  });

  it("never overwrites a guess when two later guesses race", async () => {
    const store = memoryStore();
    await submitGuessWith(deps(store), P, D, "least");
    const results = await Promise.all([
      submitGuessWith(deps(store), P, D, "heart"),
      submitGuessWith(deps(store), P, D, "plant"),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const saved = store.rows.get(`${P}|${D}`)!.guesses.map((g) => g.guess);
    expect(saved).toHaveLength(2);
    expect(saved[0]).toBe("least");
  });

  it("can't exceed 6 guesses even if the 6th is double-submitted", async () => {
    const store = memoryStore();
    for (const w of ["least", "heart", "plant", "moist", "fudge"]) {
      expect((await submitGuessWith(deps(store), P, D, w)).ok).toBe(true);
    }
    const results = await Promise.all([
      submitGuessWith(deps(store), P, D, "bloat"),
      submitGuessWith(deps(store), P, D, "bloat"),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const row = store.rows.get(`${P}|${D}`)!;
    expect(row.guesses).toHaveLength(MAX_GUESSES);
    expect(row.status).toBe("lost");

    const after = await submitGuessWith(deps(store), P, D, "crane");
    expect(after).toEqual({ ok: false, reason: "already_finished" });
  });
});

describe("submitGuessWith — basics", () => {
  it("rejects words that aren't in the list without touching storage", async () => {
    const store = memoryStore();
    expect(await submitGuessWith(deps(store), P, D, "zzzzz")).toEqual({ ok: false, reason: "not_a_word" });
    expect(store.rows.size).toBe(0);
  });

  it("finishes as won and reveals the solution only then", async () => {
    const store = memoryStore();
    const first = await submitGuessWith(deps(store), P, D, "least");
    expect(first.ok && first.solutionRevealed).toBe(null);
    const win = await submitGuessWith(deps(store), P, D, "crane");
    expect(win.ok && win.row.status).toBe("won");
    expect(win.ok && win.row.num_guesses).toBe(2);
    expect(win.ok && win.solutionRevealed).toBe("crane");
  });
});
