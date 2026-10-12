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
