import { playerTheme } from "@/lib/theme";

export function PlayerAvatar({
  name,
  avatarInitial,
  avatarUrl,
  size = 48,
  ring = false,
  filled = false,
}: {
  name: string;
  avatarInitial: string;
  avatarUrl: string | null;
  size?: number;
  /** Draw a ring in the player's colour (PIN sheet, duel cards). */
  ring?: boolean;
  /** Solid player colour instead of the pale tint (score cards). */
  filled?: boolean;
}) {
  const theme = playerTheme(name);
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 overflow-hidden font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: filled ? theme.color : theme.soft,
        color: filled ? theme.onColor : theme.ink,
        border: ring ? `3px solid ${theme.color}` : undefined,
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire; next/image's cache would outlive them
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover object-top" />
      ) : (
        avatarInitial
      )}
    </div>
  );
}
