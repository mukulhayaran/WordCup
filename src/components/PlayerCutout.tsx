import { playerTheme } from "@/lib/theme";

const DISC = 132;

/**
 * The landing-card portrait: a transparent PNG cutout that pops out of a
 * pale disc (bottom clipped to the disc's curve, head free above it), or the
 * player's initial until a photo is set.
 */
export function PlayerCutout({
  name,
  avatarInitial,
  avatarUrl,
}: {
  name: string;
  avatarInitial: string;
  avatarUrl: string | null;
}) {
  const theme = playerTheme(name);
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{ width: DISC, height: 166, borderRadius: `0 0 ${DISC / 2}px ${DISC / 2}px` }}
    >
      <div className="absolute bottom-0 left-0 rounded-full" style={{ width: DISC, height: DISC, background: theme.soft }} />
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire; next/image's cache would outlive them
        <img
          src={avatarUrl}
          alt={name}
          className="absolute bottom-0 left-1/2 h-[158px] w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
        />
      ) : (
        <span
          className="absolute inset-x-0 bottom-[34px] text-center text-[56px] font-bold leading-none"
          style={{ color: theme.ink }}
          aria-label={name}
        >
          {avatarInitial}
        </span>
      )}
    </div>
  );
}
