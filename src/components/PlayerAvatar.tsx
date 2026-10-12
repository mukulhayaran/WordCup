export function PlayerAvatar({
  name,
  avatarInitial,
  avatarUrl,
  size = 72,
}: {
  name: string;
  avatarInitial: string;
  avatarUrl: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire; next/image's cache would outlive them
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-brand text-white font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {avatarInitial}
    </div>
  );
}
