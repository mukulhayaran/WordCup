import { beforeAll, describe, expect, it } from "vitest";
import { buildSessionValue, verifySessionValue } from "./session";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-do-not-use-in-prod";
});

describe("session cookie signing", () => {
  it("round-trips a valid player id", () => {
    const value = buildSessionValue("player-123");
    expect(verifySessionValue(value)).toBe("player-123");
  });

  it("rejects a tampered player id", () => {
    const value = buildSessionValue("player-123");
    const [, signature] = value.split(".");
    const tampered = `player-999.${signature}`;
    expect(verifySessionValue(tampered)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const value = buildSessionValue("player-123");
    const tampered = value.slice(0, -1) + (value.endsWith("A") ? "B" : "A");
    expect(verifySessionValue(tampered)).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(verifySessionValue("not-a-valid-cookie")).toBeNull();
  });
});
