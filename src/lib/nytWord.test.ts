import { describe, expect, it, vi } from "vitest";
import { resolveDailyWord } from "./nytWord";

function fakeFetch(response: Partial<Response> & { jsonBody?: unknown }) {
  return vi.fn(async () => ({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.jsonBody,
  })) as unknown as typeof fetch;
}

describe("resolveDailyWord", () => {
  it("uses the NYT solution when the response is valid", async () => {
    const fetchImpl = fakeFetch({
      jsonBody: { solution: "CRANE", days_since_launch: 900, print_date: "2026-03-04" },
    });
    const result = await resolveDailyWord("2026-03-04", fetchImpl);
    expect(result).toEqual({
      solution: "crane",
      daysSinceLaunch: 900,
      source: "nyt",
    });
  });

  it("falls back deterministically when the request fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const result = await resolveDailyWord("2026-03-04", fetchImpl);
    expect(result.source).toBe("fallback");
    expect(result.solution).toMatch(/^[a-z]{5}$/);
    expect(result.daysSinceLaunch).toBeNull();

    // Same date -> same fallback word, deterministically.
    const again = await resolveDailyWord("2026-03-04", fetchImpl);
    expect(again.solution).toBe(result.solution);
  });

  it("falls back when the HTTP status is not ok", async () => {
    const fetchImpl = fakeFetch({ ok: false, status: 404 });
    const result = await resolveDailyWord("2026-03-05", fetchImpl);
    expect(result.source).toBe("fallback");
  });

  it("falls back when the solution field is missing or malformed", async () => {
    const fetchImpl = fakeFetch({ jsonBody: { solution: "" } });
    const result = await resolveDailyWord("2026-03-06", fetchImpl);
    expect(result.source).toBe("fallback");

    const fetchImpl2 = fakeFetch({ jsonBody: { solution: "toolong" } });
    const result2 = await resolveDailyWord("2026-03-06", fetchImpl2);
    expect(result2.source).toBe("fallback");
  });
});
