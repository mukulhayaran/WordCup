import { existsSync } from "node:fs";
import path from "node:path";
import { supabaseAdmin } from "./supabaseAdmin";

export const AVATAR_BUCKET = "player-avatars";
const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes

/**
 * Returns a short-lived signed URL for a player's private avatar photo, or
 * null if they have none set. The bucket itself is private, so a photo is
 * never reachable by guessing a permanent URL.
 */
export async function avatarSignedUrl(
  avatarPhotoPath: string | null
): Promise<string | null> {
  if (!avatarPhotoPath) return null;

  const db = supabaseAdmin();
  const { data, error } = await db.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(avatarPhotoPath, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * A player's photo URL. In local development a gitignored
 * public/local-avatars/<Name>.png takes precedence, so photos can be
 * previewed without uploading them anywhere.
 */
export async function avatarUrlFor(player: {
  name: string;
  avatar_photo_path: string | null;
}): Promise<string | null> {
  if (process.env.NODE_ENV === "development") {
    const file = path.join(process.cwd(), "public", "local-avatars", `${player.name}.png`);
    if (existsSync(file)) return `/local-avatars/${encodeURIComponent(player.name)}.png`;
  }
  return avatarSignedUrl(player.avatar_photo_path);
}
