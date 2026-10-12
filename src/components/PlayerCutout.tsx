import { playerTheme } from "@/lib/theme";

/**
 * The landing-card portrait: a transparent PNG cutout that pops out above
 * the card on a pale disc, or the player's initial until a photo is set.
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
    <div className="relative mx-auto h-[150px] w-[140px] flex items-end justify-center">
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[124px] w-[124px] rounded-full"
        style={{ background: theme.soft }}
      />
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire; next/image's cache would outlive them
        <img
          src={avatarUrl}
          alt={name}
          className="relative h-full w-auto object-contain object-bottom drop-shadow-[0_8px_12px_rgba(90,42,58,0.18)]"
        />
      ) : (
        <span
          className="relative mb-[30px] text-[56px] font-bold leading-none"
          style={{ color: theme.ink }}
          aria-label={name}
        >
          {avatarInitial}
        </span>
      )}
    </div>
  );
}
