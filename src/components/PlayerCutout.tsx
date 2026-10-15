import { playerTheme } from "@/lib/theme";

/**
 * A player's portrait: a transparent PNG cutout that pops out of a pale disc
 * (bottom clipped to the disc's curve, head free above it), or the player's
 * initial until a photo is set.
 */
export function PlayerCutout({
  name,
  avatarInitial,
  avatarUrl,
  disc = 132,
  ring = false,
}: {
  name: string;
  avatarInitial: string;
  avatarUrl: string | null;
  disc?: number;
  /** Outline the disc in the player's colour (celebration screen). */
  ring?: boolean;
}) {
  const theme = playerTheme(name);
  const ringWidth = ring ? Math.round(disc * 0.025) : 0;
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{ width: disc, height: disc * 1.26, borderRadius: `0 0 ${disc / 2}px ${disc / 2}px` }}
    >
      <div
        className="absolute bottom-0 left-0 rounded-full"
        style={{
          width: disc,
          height: disc,
          background: theme.soft,
          boxShadow: ring ? `inset 0 0 0 ${ringWidth}px ${theme.color}` : undefined,
        }}
      />
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire; next/image's cache would outlive them
        <img
          src={avatarUrl}
          alt={name}
          className="absolute bottom-0 left-1/2 w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
          style={{ height: disc * 1.2 }}
        />
      ) : (
        <span
          className="absolute inset-x-0 text-center font-bold leading-none"
          style={{ color: theme.ink, fontSize: disc * 0.42, bottom: disc * 0.26 }}
          aria-label={name}
        >
          {avatarInitial}
        </span>
      )}
    </div>
  );
}
