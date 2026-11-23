import type { ReactNode } from "react";

const PATHS: Record<string, string> = {
  ballot: "M4 11h16v9H4z M8 11V4h8v7 M10 7l1.5 1.5L14 6",
  hat: "M3 18h18 M7 18V6h10v12 M7 14h10",
  hall: "M3 21h18 M5 21V10 M10 21V10 M14 21V10 M19 21V10 M3 10l9-6 9 6z",
  crown: "M3 8l4 5 5-8 5 8 4-5-2 11H5z",
  scale: "M12 4v16 M7 20h10 M5 7h14 M5 7l-3 7h6z M19 7l-3 7h6z",
  turn: "M4 12a8 8 0 0 1 14-5l2 2 M20 4v5h-5 M20 12a8 8 0 0 1-14 5l-2-2 M4 20v-5h5",
  sword: "M14 3h7v7l-9 9-4-4z M8 13l-3 3 3 3 3-3 M5 19l-2 2",
  link: "M4 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M10 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0",
  chair: "M7 3v10h10V3 M7 13v8 M17 13v8 M7 17h10",
  orb: "M5 13a7 7 0 1 1 14 0a7 7 0 1 1-14 0 M7 21h10 M9 9a4 4 0 0 1 3-2",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  clock: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M12 7v5l3 2",
  wall: "M3 5h18v14H3z M3 10h18 M3 15h18 M9 5v5 M15 5v5 M7 10v5 M13 10v5 M18 10v5 M9 15v4 M15 15v4",
  x: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M9 9l6 6 M15 9l-6 6",
  door: "M5 3h10v18H5z M12 12h.01 M15 8l5 4-5 4",
  cal: "M4 6h16v15H4z M4 10h16 M8 3v5 M16 3v5 M9 15l2 2 4-4",
  star: "M12 3l2.7 5.6 6.2.9-4.5 4.3 1.1 6.2-5.5-3-5.5 3 1.1-6.2L3.1 9.5l6.2-.9z",
  gift: "M4 9h16v4H4z M5 13h14v8H5z M12 9v12 M12 9C9 9 7 7.5 7 6a2 2 0 0 1 4-.5L12 9l1-3.5a2 2 0 0 1 4 .5c0 1.5-2 3-5 3",
  chai: "M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z M16 10h2a2 2 0 0 1 0 5h-2 M8 3v2 M12 3v2",
  salt: "M9 8h6l2 13H7z M10 8V5a2 2 0 0 1 4 0v3 M11 13h.01 M13 16h.01",
  flag: "M5 22V3 M5 4h13l-3 4 3 4H5",
  potato: "M6 8c3-5 10-5 13-1s1 11-5 12-11-1-10-5 0-4 2-6z M10 10h.01 M15 13h.01 M11 15h.01",
  lock: "M6 11h12v10H6z M9 11V7a3 3 0 0 1 6 0v4",
  siren: "M7 18v-6a5 5 0 0 1 10 0v6 M5 21h14 M12 4V2 M5 8L3.5 6.5 M19 8l1.5-1.5",
  wave: "M3 10c3-3 6 3 9 0s6-3 9 0 M3 16c3-3 6 3 9 0s6-3 9 0",
  broom: "M20 3l-8 8 M8 10l6 6-3 5c-3-1-6-3-8-7z",
  camera: "M4 8h4l2-3h4l2 3h4v11H4z M9 13a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  chart: "M4 20V4 M4 20h16 M8 16v-4 M13 16V8 M18 16v-6",
  money: "M3 7h18v10H3z M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  scroll: "M6 4h12v16H6z M9 8h6 M9 12h6 M9 16h4",
  stop: "M8 3h8l5 5v8l-5 5H8l-5-5V8z M8 12h8",
  pinch: "M5 12h14 M8 8l-4 4 4 4 M16 8l4 4-4 4",
  person: "M12 8a3 3 0 1 0 0-6a3 3 0 1 0 0 6 M6 22v-6a6 6 0 0 1 12 0v6",
  mic: "M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0z M5 11a7 7 0 0 0 14 0 M12 18v3",
  book: "M4 5a3 3 0 0 1 3-2h5v18H7a3 3 0 0 0-3 2z M20 5a3 3 0 0 0-3-2h-5v18h5a3 3 0 0 1 3 2z",
  hide: "M3 3l18 18 M10 10a3 3 0 0 0 4 4 M6 6C4 8 3 10 2 12c2 4 6 7 10 7 2 0 3-.5 5-2 M10 5h2c4 0 8 3 10 7-.5 1-1 2-2 3",
  sun: "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8 M12 2v2 M12 20v2 M4 12H2 M22 12h-2 M5 5l1.5 1.5 M17.5 17.5L19 19 M19 5l-1.5 1.5 M6.5 17.5L5 19",
  moon: "M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z",
  run: "M14 4h.01 M8 21l3-6-3-3 3-5 4 3h4 M11 15l4 3v3 M8 9H5",
  check: "M4 12l5 5L20 6",
  flame: "M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-2 1-3 2-4 0 2 1 3 2 3 1-3 0-6 2-10z",
  statue: "M12 7a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5 M8 21h8 M9 21v-4h6v4 M10 17v-6l-3-2 M14 17v-6l4-5 M10 11h4",
  nimbu: "M4 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M14 12c3 1 5 4 5 9-3-1-6-4-6-8z M8 12v9",
  kitkat: "M6 3h12v18H6z M10 3v18 M14 3v18 M6 9h12",
  panipuri: "M4 12h16a8 8 0 0 1-16 0z M6 12a3.5 3.5 0 0 1 6-2.4 M12 9.6a3.5 3.5 0 0 1 6 2.4",
  teddy: "M8 7a2.5 2.5 0 1 0-3 3 M16 7a2.5 2.5 0 1 1 3 3 M6 11a6 6 0 1 0 12 0a6 6 0 1 0-12 0 M10 10h.01 M14 10h.01 M10.5 14c1 .8 2 .8 3 0 M8 17l-2 4h12l-2-4",
  clown: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M10 13a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M8 9h.01 M16 9h.01 M8 17c2 1.5 6 1.5 8 0",
  fries: "M6 10h12l-2 11H8z M8 10V4 M11 10V3 M14 10V4 M17 10V6",
  film: "M4 4h16v16H4z M8 4v16 M16 4v16 M4 9h4 M4 15h4 M16 9h4 M16 15h4",
  music: "M9 18V5l11-2v13 M3 18a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M14 16a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  pen: "M4 20l1-5L16 4l4 4L9 19z",
};

function Petals({ n, rx, ry, dist, fill }: { n: number; rx: number; ry: number; dist: number; fill: string }) {
  return Array.from({ length: n }, (_, i) => (
    <ellipse key={i} cx="12" cy={12 - dist} rx={rx} ry={ry} fill={fill} transform={`rotate(${(i * 360) / n} 12 12)`} />
  ));
}

const Dot = ({ r, fill }: { r: number; fill: string }) => <circle cx="12" cy="12" r={r} fill={fill} />;

const FLOWERS: Record<string, () => ReactNode> = {
  marigold: () => (
    <>
      <Petals n={16} rx={1.7} ry={3.6} dist={7} fill="#f59e0b" />
      <Petals n={12} rx={1.5} ry={2.8} dist={3.8} fill="#f97316" />
      <Dot r={2} fill="#c2410c" />
    </>
  ),
  sunflower: () => (
    <>
      <Petals n={14} rx={1.8} ry={4.2} dist={7} fill="#facc15" />
      <Dot r={5} fill="#7c4a21" />
    </>
  ),
  tulip: () => (
    <>
      <path d="M12 16v7" stroke="#3f8f4f" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 4l3 3 3-4 3 4 3-3v7a6 6 0 0 1-12 0z" fill="#ec4899" />
    </>
  ),
  mogra: () => (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={i} cx="12" cy="6.8" rx="2.8" ry="4.4" fill="#fff" stroke="#dcbcc8" strokeWidth=".6" transform={`rotate(${i * 60} 12 12)`} />
      ))}
      <Dot r={1.8} fill="#f7c873" />
    </>
  ),
  hibiscus: () => (
    <>
      <Petals n={5} rx={4.5} ry={5.6} dist={5.4} fill="#e11d63" />
      <Dot r={1.8} fill="#7f1238" />
      <path d="M12 12l5 5" stroke="#f7c873" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  rose: () => (
    <>
      <Dot r={9} fill="#d61f45" />
      <path d="M12 12c1.5-1 3 .5 2 2.2s-4.5 1.5-5-1.2 2-5.5 5.2-4.6 4.8 4.5 3 7.5" stroke="#8f1230" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </>
  ),
  cactus: () => (
    <>
      <path d="M12 18V4 M12 14H7V9 M12 11h5V7" stroke="#3f8f4f" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 18h10l-1.5 5h-7z" fill="#c9774b" />
    </>
  ),
  wilted: () => (
    <>
      <path d="M7 23c0-9 3-15 10-14" stroke="#7d8a5a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="15" cy="13" rx="2.4" ry="4" fill="#a66b7d" />
      <ellipse cx="19" cy="13" rx="2.4" ry="4" fill="#b98293" />
      <ellipse cx="17" cy="15" rx="2.4" ry="4" fill="#8e5668" />
    </>
  ),
  bouquet: () => (
    <>
      <g transform="scale(.55)">{FLOWERS.marigold()}</g>
      <g transform="translate(11 0) scale(.55)">{FLOWERS.hibiscus()}</g>
      <g transform="translate(5.5 3) scale(.55)">{FLOWERS.sunflower()}</g>
      <path d="M6 13h12l-5 10h-2z" fill="#fbe3ea" stroke="#c93d66" strokeWidth="1.2" />
    </>
  ),
  garland: () =>
    Array.from({ length: 14 }, (_, i) => (
      <circle key={i} cx="12" cy="3.4" r="2.2" fill={i % 2 ? "#facc15" : "#f97316"} transform={`rotate(${(i * 360) / 14} 12 12)`} />
    )),
};

/** A flower's drawing on a 24×24 grid, for placing inside a larger SVG. */
export function FlowerParts({ kind }: { kind: string }) {
  return <>{FLOWERS[kind]?.()}</>;
}

/** A badge or gift picture. Icons starting "f:" are full-colour flowers. */
export function GiftArt({ icon, size = 26 }: { icon: string; size?: number }) {
  if (icon.startsWith("f:")) {
    return (
      <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
        <FlowerParts kind={icon.slice(2)} />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={PATHS[icon] ?? PATHS.gift} />
    </svg>
  );
}
