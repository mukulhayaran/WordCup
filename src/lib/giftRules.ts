import { SHARED, type SiteCup } from "./cups";
import {
  BOUQUET_CODE,
  BOUQUET_FLOWERS,
  GARLAND_CODE,
  GIFT_BY_CODE,
  SPEECH_MAX_CHARS,
  THANKS,
  VASE_SIZE,
} from "./giftCatalog";

export type GiftRow = {
  id: string;
  from_player_id: string;
  to_player_id: string;
  week_start: string;
  gift_code: string;
  speech: string | null;
  sent_at: string;
  opened_at: string | null;
  thanks: string | null;
};

// ---- Sending ----

export type SpeechResult = { ok: true; speech: string | null } | { ok: false; reason: "too_long" };

/** The Concession Speech is optional. Counts characters the way Postgres does (emoji = 1). */
export function normalizeSpeech(raw: unknown): SpeechResult {
  const speech = typeof raw === "string" ? raw.trim() : "";
  if (Array.from(speech).length > SPEECH_MAX_CHARS) return { ok: false, reason: "too_long" };
  return { ok: true, speech: speech || null };
}

/** The loser gives the winner a gift; on a tied cup, both players give one. */
export function owesGift(cup: SiteCup | null, playerName: string): boolean {
  if (!cup) return false;
  return cup.winner === SHARED || cup.winner !== playerName;
}

export type SendCheck = { ok: true } | { ok: false; reason: "no_cup" | "not_your_turn" | "already_sent" | "invalid_gift" };

export function canSendGift(input: {
  cup: SiteCup | null;
  senderName: string;
  alreadySent: boolean;
  giftCode: unknown;
}): SendCheck {
  if (typeof input.giftCode !== "string" || !GIFT_BY_CODE.has(input.giftCode)) {
    return { ok: false, reason: "invalid_gift" };
  }
  if (!input.cup) return { ok: false, reason: "no_cup" };
  if (!owesGift(input.cup, input.senderName)) return { ok: false, reason: "not_your_turn" };
  if (input.alreadySent) return { ok: false, reason: "already_sent" };
  return { ok: true };
}

// ---- Opening and thanks ----

export type OpenCheck = { ok: true } | { ok: false; reason: "not_found" | "already_opened" };

export function canOpenGift(gift: GiftRow | null, playerId: string): OpenCheck {
  if (!gift || gift.to_player_id !== playerId) return { ok: false, reason: "not_found" };
  if (gift.opened_at) return { ok: false, reason: "already_opened" };
  return { ok: true };
}

export type ThanksCheck = { ok: true } | { ok: false; reason: "not_found" | "not_opened" | "already_thanked" | "invalid_thanks" };

export function canThank(gift: GiftRow | null, playerId: string, thanks: unknown): ThanksCheck {
  if (typeof thanks !== "string" || !THANKS.includes(thanks)) return { ok: false, reason: "invalid_thanks" };
  if (!gift || gift.to_player_id !== playerId) return { ok: false, reason: "not_found" };
  if (!gift.opened_at) return { ok: false, reason: "not_opened" };
  if (gift.thanks) return { ok: false, reason: "already_thanked" };
  return { ok: true };
}

// ---- The Flower Vase ----

export type VaseFlower = { code: string; fromId: string; weekStart: string; speech: string | null };
export type Vase = { flowers: VaseFlower[]; garlands: number };

/**
 * Lays out one player's opened flowers, oldest first. A full vase of 6 moves
 * to the shelf; a Bouquet adds 3 flowers (spilling into the next vase if need
 * be); a Garland drapes on the current vase without taking a spot.
 */
export function buildVases(received: GiftRow[]): { current: Vase; shelf: Vase[] } {
  const shelf: Vase[] = [];
  let current: Vase = { flowers: [], garlands: 0 };
  const opened = received
    .filter((g) => g.opened_at)
    .sort((x, y) => (x.opened_at! < y.opened_at! ? -1 : x.opened_at! > y.opened_at! ? 1 : 0));

  for (const gift of opened) {
    if (GIFT_BY_CODE.get(gift.gift_code)?.category !== "flower") continue;
    if (gift.gift_code === GARLAND_CODE) {
      current.garlands++;
      continue;
    }
    const codes = gift.gift_code === BOUQUET_CODE ? BOUQUET_FLOWERS : [gift.gift_code];
    for (const code of codes) {
      current.flowers.push({ code, fromId: gift.from_player_id, weekStart: gift.week_start, speech: gift.speech });
      if (current.flowers.length === VASE_SIZE) {
        shelf.push(current);
        current = { flowers: [], garlands: 0 };
      }
    }
  }
  return { current, shelf };
}

// ---- Gifts that change the app ----

const DAY_MS = 24 * 60 * 60 * 1000;
const EFFECT_MS: Record<string, number> = { A1: DAY_MS, A2: 7 * DAY_MS, A3: DAY_MS, A4: DAY_MS, F10: DAY_MS };

export type PlayerEffects = { shower: boolean; beacon: boolean; crown: boolean; clown: boolean; garland: boolean };

const noEffects = (): PlayerEffects => ({ shower: false, beacon: false, crown: false, clown: false, garland: false });

/** The newest Flower Shower still running for this player, if any. */
export function activeShowerId(gifts: GiftRow[], playerId: string, now: Date): string | null {
  const live = gifts
    .filter((g) => g.gift_code === "A1" && g.to_player_id === playerId && g.opened_at)
    .filter((g) => now.getTime() - new Date(g.opened_at as string).getTime() < EFFECT_MS.A1)
    .sort((x, y) => (x.opened_at as string).localeCompare(y.opened_at as string));
  return live.at(-1)?.id ?? null;
}

/** Which effects are live, per player. They run from when the gift is opened. */
export function activeEffects(gifts: GiftRow[], playerIds: string[], now: Date): Record<string, PlayerEffects> {
  const result: Record<string, PlayerEffects> = Object.fromEntries(playerIds.map((id) => [id, noEffects()]));
  for (const gift of gifts) {
    const duration = EFFECT_MS[gift.gift_code];
    if (!duration || !gift.opened_at) continue;
    if (now.getTime() - new Date(gift.opened_at).getTime() >= duration) continue;
    const to = result[gift.to_player_id];
    const from = result[gift.from_player_id];
    if (gift.gift_code === "A1" && to) to.shower = true;
    if (gift.gift_code === "A2" && to) to.beacon = true;
    if (gift.gift_code === "A3" && to) to.crown = true;
    if (gift.gift_code === "A4" && from) from.clown = true; // the winner puts it on the loser
    if (gift.gift_code === GARLAND_CODE && to) to.garland = true;
  }
  return result;
}
