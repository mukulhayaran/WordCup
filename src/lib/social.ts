import type { LegacyCup } from "./cups";
import type { Reaction } from "./socialRules";
import { supabaseAdmin } from "./supabaseAdmin";

const UNIQUE_VIOLATION = "23505";

// ---- Nudges ----

export async function hasNudged(fromId: string, gameDate: string): Promise<boolean> {
  const { data } = await supabaseAdmin()
    .from("nudges")
    .select("id")
    .eq("from_player_id", fromId)
    .eq("game_date", gameDate)
    .maybeSingle();
  return !!data;
}

/** "duplicate" if this player already nudged today (enforced by a unique constraint too). */
export async function createNudge(fromId: string, toId: string, gameDate: string): Promise<"ok" | "duplicate"> {
  const { error } = await supabaseAdmin()
    .from("nudges")
    .insert({ from_player_id: fromId, to_player_id: toId, game_date: gameDate });
  if (error?.code === UNIQUE_VIOLATION) return "duplicate";
  if (error) throw error;
  return "ok";
}

// ---- Reactions ----

export async function getReaction(fromId: string, gameDate: string): Promise<Reaction | null> {
  const { data } = await supabaseAdmin()
    .from("reactions")
    .select("reaction")
    .eq("from_player_id", fromId)
    .eq("game_date", gameDate)
    .maybeSingle();
  return (data?.reaction as Reaction | undefined) ?? null;
}

/** Sets or changes this player's reaction for the day. */
export async function setReaction(fromId: string, toId: string, gameDate: string, reaction: Reaction): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("reactions")
    .upsert(
      { from_player_id: fromId, to_player_id: toId, game_date: gameDate, reaction, updated_at: new Date().toISOString() },
      { onConflict: "from_player_id,game_date" }
    );
  if (error) throw error;
}

// ---- Winner's messages ----

export type WinnerMessage = { id: string; from_player_id: string; game_date: string; body: string };

export async function getMessageFrom(fromId: string, gameDate: string): Promise<WinnerMessage | null> {
  const { data } = await supabaseAdmin()
    .from("winner_messages")
    .select("id, from_player_id, game_date, body")
    .eq("from_player_id", fromId)
    .eq("game_date", gameDate)
    .maybeSingle();
  return data ?? null;
}

export async function createMessage(
  fromId: string,
  toId: string,
  gameDate: string,
  body: string
): Promise<"ok" | "duplicate"> {
  const { error } = await supabaseAdmin()
    .from("winner_messages")
    .insert({ from_player_id: fromId, to_player_id: toId, game_date: gameDate, body });
  if (error?.code === UNIQUE_VIOLATION) return "duplicate";
  if (error) throw error;
  return "ok";
}

export async function unreadMessagesTo(playerId: string): Promise<WinnerMessage[]> {
  const { data } = await supabaseAdmin()
    .from("winner_messages")
    .select("id, from_player_id, game_date, body")
    .eq("to_player_id", playerId)
    .is("dismissed_at", null)
    .order("game_date", { ascending: false });
  return data ?? [];
}

/** Only the recipient can dismiss; returns false if the message isn't theirs. */
export async function dismissMessage(id: string, playerId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("winner_messages")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("to_player_id", playerId)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) === 1;
}

// ---- Cups ----

export async function getLegacyCups(): Promise<LegacyCup[]> {
  const { data, error } = await supabaseAdmin()
    .from("legacy_cups")
    .select("era, label, winner, start_date, end_date, sort_order")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    era: r.era,
    label: r.label,
    winner: r.winner,
    startDate: r.start_date,
    endDate: r.end_date,
    sortOrder: r.sort_order,
  }));
}

export async function seenCelebrations(playerId: string): Promise<Set<string>> {
  const { data } = await supabaseAdmin()
    .from("cup_celebrations_seen")
    .select("week_start")
    .eq("player_id", playerId);
  return new Set((data ?? []).map((r) => r.week_start));
}

export async function markCelebrationSeen(playerId: string, weekStart: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("cup_celebrations_seen")
    .upsert({ player_id: playerId, week_start: weekStart }, { onConflict: "player_id,week_start", ignoreDuplicates: true });
  if (error) throw error;
}
