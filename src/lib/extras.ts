import type { ExtrasResponse, ExtrasVase } from "./apiTypes";
import { getAllPlayers } from "./auth";
import {
  chooseBadgePopup,
  computeCupAwards,
  computeDailyAwards,
  countBadges,
  type Award,
  type BadgeCup,
  type BadgeDay,
  type GuessRow,
  type PlayerDay,
  type Side,
} from "./badgeRules";
import { BADGE_BY_ID } from "./badgeCatalog";
import { previousDate, weekdayName } from "./calendar";
import type { SiteCup } from "./cups";
import { getCupsOverview } from "./cupsData";
import { todayGameDate, weekRangeForGameDate } from "./gameDate";
import { GIFT_BY_CODE } from "./giftCatalog";
import { activeEffects, activeShowerId, buildVases, owesGift, type GiftRow, type Vase } from "./giftRules";
import { buildEdition, weeklyLine } from "./newspaper";
import { supabaseAdmin } from "./supabaseAdmin";

const UNIQUE_VIOLATION = "23505";
const PAGE_SIZE = 1000;
const GIFT_COLUMNS = "id, from_player_id, to_player_id, week_start, gift_code, speech, sent_at, opened_at, thanks";

type SavedGame = {
  player_id: string;
  game_date: string;
  guesses: GuessRow[];
  num_guesses: number | null;
  status: "in_progress" | "won" | "lost";
  finished_at: string | null;
};

/** Every saved game, fetched in pages because Supabase caps a single response. */
async function allSavedGames(): Promise<SavedGame[]> {
  const games: SavedGame[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin()
      .from("game_results")
      .select("player_id, game_date, guesses, num_guesses, status, finished_at")
      .order("game_date")
      .order("player_id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    games.push(...((data ?? []) as SavedGame[]));
    if (!data || data.length < PAGE_SIZE) return games;
  }
}

async function allGifts(): Promise<GiftRow[]> {
  const { data, error } = await supabaseAdmin().from("gifts").select(GIFT_COLUMNS).order("sent_at");
  if (error) throw error;
  return (data ?? []) as GiftRow[];
}

export async function getGift(id: string): Promise<GiftRow | null> {
  const { data, error } = await supabaseAdmin().from("gifts").select(GIFT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as GiftRow | null) ?? null;
}

/** The cup that ended last Sunday, if anyone played in it. */
export function cupEndingLastSunday(siteCups: SiteCup[], today: string): SiteCup | null {
  const lastSunday = previousDate(weekRangeForGameDate(today).weekStart);
  return siteCups.find((c) => c.weekEnd === lastSunday) ?? null;
}

export async function getLastCup(now: Date = new Date()): Promise<SiteCup | null> {
  const { siteCups } = await getCupsOverview(now);
  return cupEndingLastSunday(siteCups, todayGameDate(now));
}

/** The first time a player reaches this, today becomes their pop-up starting line. */
async function badgeBaseline(playerId: string, today: string): Promise<string> {
  const db = supabaseAdmin();
  const { error } = await db
    .from("badge_state")
    .upsert({ player_id: playerId, baseline_date: today }, { onConflict: "player_id", ignoreDuplicates: true });
  if (error) throw error;
  const { data, error: readError } = await db
    .from("badge_state")
    .select("baseline_date")
    .eq("player_id", playerId)
    .single();
  if (readError) throw readError;
  return data.baseline_date;
}

async function seenAwardKeys(playerId: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin().from("badge_popups_seen").select("award_key").eq("player_id", playerId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.award_key));
}

async function hasSeenNewspaper(playerId: string, weekStart: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("newspaper_seen")
    .select("week_start")
    .eq("player_id", playerId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function markNewspaperSeen(playerId: string, weekStart: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("newspaper_seen")
    .upsert({ player_id: playerId, week_start: weekStart }, { onConflict: "player_id,week_start", ignoreDuplicates: true });
  if (error) throw error;
}

/** Only keys for this player's own side are stored. */
export async function markBadgesSeen(playerId: string, keys: string[]): Promise<void> {
  const players = await getAllPlayers();
  const side = players[0]?.id === playerId ? "a" : "b";
  const valid = keys.filter((k) => {
    const [id, keySide, date] = k.split(":");
    return BADGE_BY_ID.has(id) && keySide === side && /^\d{4}-\d{2}-\d{2}$/.test(date ?? "");
  });
  if (valid.length === 0) return;
  const { error } = await supabaseAdmin()
    .from("badge_popups_seen")
    .upsert(
      valid.map((award_key) => ({ player_id: playerId, award_key })),
      { onConflict: "player_id,award_key", ignoreDuplicates: true }
    );
  if (error) throw error;
}

/** Stored with the seen pop-ups, so the "NEW" tag needs no table of its own. */
const CABINET_NEW_KEY = "feature:cabinet-new";

export async function hasSeenCabinetNew(playerId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("badge_popups_seen")
    .select("award_key")
    .eq("player_id", playerId)
    .eq("award_key", CABINET_NEW_KEY)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function markCabinetNewSeen(playerId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("badge_popups_seen")
    .upsert({ player_id: playerId, award_key: CABINET_NEW_KEY }, { onConflict: "player_id,award_key", ignoreDuplicates: true });
  if (error) throw error;
}

/** "duplicate" if this player already sent a gift for this cup. */
export async function createGift(input: {
  fromId: string;
  toId: string;
  weekStart: string;
  giftCode: string;
  speech: string | null;
}): Promise<"ok" | "duplicate"> {
  const { error } = await supabaseAdmin().from("gifts").insert({
    from_player_id: input.fromId,
    to_player_id: input.toId,
    week_start: input.weekStart,
    gift_code: input.giftCode,
    speech: input.speech,
  });
  if (error?.code === UNIQUE_VIOLATION) return "duplicate";
  if (error) throw error;
  return "ok";
}

export async function hasSentGift(fromId: string, weekStart: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("gifts")
    .select("id")
    .eq("from_player_id", fromId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** Opens a gift once. Returns the new vase number if this gift completed a vase. */
export async function openGift(gift: GiftRow): Promise<{ opened: boolean; completedVase: number | null }> {
  const received = (await allGifts()).filter((g) => g.to_player_id === gift.to_player_id);
  const before = buildVases(received).shelf.length;
  const openedAt = new Date().toISOString();
  const { data, error } = await supabaseAdmin()
    .from("gifts")
    .update({ opened_at: openedAt })
    .eq("id", gift.id)
    .is("opened_at", null)
    .select("id");
  if (error) throw error;
  if (data?.length !== 1) return { opened: false, completedVase: null };
  const after = buildVases(received.map((g) => (g.id === gift.id ? { ...g, opened_at: openedAt } : g))).shelf.length;
  return { opened: true, completedVase: after > before ? after : null };
}

export async function saveThanks(giftId: string, thanks: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("gifts")
    .update({ thanks })
    .eq("id", giftId)
    .is("thanks", null)
    .select("id");
  if (error) throw error;
  return data?.length === 1;
}

/** Everything badge-, newspaper- and gift-related for the logged-in player. */
export async function getExtras(playerId: string, now: Date = new Date()): Promise<ExtrasResponse> {
  const today = todayGameDate(now);
  const [{ history, siteCups }, games, gifts, baseline, seen] = await Promise.all([
    getCupsOverview(now),
    allSavedGames(),
    allGifts(),
    badgeBaseline(playerId, today),
    seenAwardKeys(playerId),
  ]);
  const { a, b } = history.players;
  const you = playerId === a.id ? a : b;
  const them = playerId === a.id ? b : a;
  const yourSide: Side = playerId === a.id ? "a" : "b";
  const names: [string, string] = [a.name, b.name];
  const nameOf = (id: string) => (id === a.id ? a.name : b.name);

  // ---- Badges: only ever worked out from days that are already revealed ----
  const saved = new Map(games.map((g) => [`${g.player_id}|${g.game_date}`, g]));
  const firstDate = games[0]?.game_date ?? today;
  const toPlayerDay = (id: string, date: string): PlayerDay | null => {
    const g = saved.get(`${id}|${date}`);
    return g ? { status: g.status, guesses: g.guesses, numGuesses: g.num_guesses, finishedAt: g.finished_at } : null;
  };
  const days: BadgeDay[] = history.weeks
    .flatMap((w) => w.days)
    .filter((d) => d.revealed && d.gameDate >= firstDate)
    .map((d) => ({ date: d.gameDate, a: toPlayerDay(a.id, d.gameDate), b: toPlayerDay(b.id, d.gameDate) }));
  const cups: BadgeCup[] = history.weeks
    .filter((w) => !w.isCurrent && w.days.some((d) => d.a.played || d.b.played))
    .map((w) => ({
      weekStart: w.weekStart,
      weekEnd: w.weekEnd,
      a: w.a,
      b: w.b,
      winner: w.champion === "tie" ? "tie" : w.champion,
      days: w.days.map((d) => d.points),
    }));
  const awards: Award[] = [...computeDailyAwards(days), ...computeCupAwards(cups)];
  const popup = chooseBadgePopup(awards, yourSide, baseline, seen);
  const todaysBadges = (side: Side) =>
    awards.filter((x) => x.side === side && x.date === today && x.badgeId.startsWith("D")).map((x) => x.badgeId);

  // ---- Weekly results ----
  const lastCup = cupEndingLastSunday(siteCups, today);
  const weekNumberOf = new Map(siteCups.map((c) => [c.weekStart, c.weekNumber]));
  const line = weeklyLine(siteCups, names, weekdayName(today) === "Monday");
  const edition = lastCup ? buildEdition(siteCups, siteCups.indexOf(lastCup), names) : null;
  const speeches = lastCup
    ? gifts
        .filter((g) => g.week_start === lastCup.weekStart && g.speech)
        .map((g) => ({ name: nameOf(g.from_player_id), speech: g.speech as string }))
    : [];
  const unseen = lastCup ? !(await hasSeenNewspaper(playerId, lastCup.weekStart)) : false;

  // ---- Gifts: what's inside stays hidden until it's opened ----
  const sentThisCup = !!lastCup && gifts.some((g) => g.from_player_id === playerId && g.week_start === lastCup.weekStart);
  const yours = gifts.filter((g) => g.to_player_id === playerId);
  const vaseFor = (id: string): ExtrasVase => {
    const { current, shelf } = buildVases(gifts.filter((g) => g.to_player_id === id));
    const view = (v: Vase) => ({
      garlands: v.garlands,
      flowers: v.flowers.map((f) => ({
        code: f.code,
        fromName: nameOf(f.fromId),
        weekNumber: weekNumberOf.get(f.weekStart) ?? null,
        speech: f.speech,
      })),
    });
    return { current: view(current), shelf: shelf.map(view) };
  };

  return {
    youId: playerId,
    players: [
      { id: a.id, name: a.name },
      { id: b.id, name: b.name },
    ],
    badges: {
      counts: { [a.id]: countBadges(awards, "a"), [b.id]: countBadges(awards, "b") },
      popup: popup ? { badgeId: popup.award.badgeId, keys: popup.keys } : null,
      today: { [a.id]: todaysBadges("a"), [b.id]: todaysBadges("b") },
    },
    weekly: {
      defendingChampion: line.defendingChampion,
      challenge: line.challenge,
      timeline: siteCups.map((c) => ({ weekNumber: c.weekNumber, winner: c.winner })),
    },
    newspaper: edition ? { edition, speeches, unseen } : null,
    gifts: {
      owed:
        lastCup && owesGift(lastCup, you.name) && !sentThisCup
          ? { weekNumber: lastCup.weekNumber, toName: them.name, shared: lastCup.winner !== them.name }
          : null,
      toOpen: yours
        .filter((g) => !g.opened_at)
        .map((g) => ({ id: g.id, fromName: nameOf(g.from_player_id), weekNumber: weekNumberOf.get(g.week_start) ?? null })),
      received: yours
        .filter((g) => g.opened_at && GIFT_BY_CODE.get(g.gift_code)?.category !== "flower")
        .map((g) => ({
          id: g.id,
          code: g.gift_code,
          fromName: nameOf(g.from_player_id),
          weekNumber: weekNumberOf.get(g.week_start) ?? null,
          speech: g.speech,
          thanks: g.thanks,
        }))
        .reverse(),
    },
    vases: { [a.id]: vaseFor(a.id), [b.id]: vaseFor(b.id) },
    effects: activeEffects(gifts, [a.id, b.id], now),
    showerId: activeShowerId(gifts, playerId, now),
  };
}
