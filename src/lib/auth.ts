import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabaseAdmin";
import {
  afterFailedAttempt,
  afterSuccessfulAttempt,
  isLocked,
  minutesRemaining,
} from "./pinLockout";

export type Player = {
  id: string;
  name: string;
  role_label: string;
  avatar_initial: string;
  avatar_photo_path: string | null;
};

export type LoginResult =
  | { ok: true; player: Player }
  | { ok: false; reason: "not_found" | "wrong_pin" }
  | { ok: false; reason: "locked"; minutesRemaining: number };

export async function loginWithPin(
  name: string,
  pin: string
): Promise<LoginResult> {
  const db = supabaseAdmin();

  const { data: player } = await db
    .from("players")
    .select(
      "id, name, role_label, avatar_initial, avatar_photo_path, pin_hash, failed_pin_attempts, locked_until"
    )
    .eq("name", name)
    .maybeSingle();

  if (!player) return { ok: false, reason: "not_found" };

  if (isLocked(player.locked_until)) {
    return {
      ok: false,
      reason: "locked",
      minutesRemaining: minutesRemaining(player.locked_until),
    };
  }

  const matches = bcrypt.compareSync(pin, player.pin_hash);

  if (!matches) {
    const next = afterFailedAttempt(player.failed_pin_attempts);
    await db
      .from("players")
      .update({
        failed_pin_attempts: next.failedPinAttempts,
        locked_until: next.lockedUntil,
      })
      .eq("id", player.id);
    return { ok: false, reason: "wrong_pin" };
  }

  const reset = afterSuccessfulAttempt();
  await db
    .from("players")
    .update({
      failed_pin_attempts: reset.failedPinAttempts,
      locked_until: reset.lockedUntil,
    })
    .eq("id", player.id);

  return {
    ok: true,
    player: {
      id: player.id,
      name: player.name,
      role_label: player.role_label,
      avatar_initial: player.avatar_initial,
      avatar_photo_path: player.avatar_photo_path,
    },
  };
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("players")
    .select("id, name, role_label, avatar_initial, avatar_photo_path")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function getAllPlayers(): Promise<Player[]> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("players")
    .select("id, name, role_label, avatar_initial, avatar_photo_path")
    .order("name");
  return data ?? [];
}
