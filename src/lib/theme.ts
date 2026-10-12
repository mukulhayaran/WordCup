export type PlayerTheme = {
  /** Fill colour (tiles, rings, buttons). */
  color: string;
  /** Text colour on light backgrounds — deeper than `color` where needed for contrast. */
  ink: string;
  /** Pale background tint. */
  soft: string;
  /** Text colour on top of `color`. */
  onColor: string;
};

const THEMES: Record<string, PlayerTheme> = {
  Mukul: { color: "var(--mukul)", ink: "var(--mukul)", soft: "var(--mukul-soft)", onColor: "#ffffff" },
  Madhulika: {
    color: "var(--madhulika)",
    ink: "var(--madhulika-ink)",
    soft: "var(--madhulika-soft)",
    onColor: "var(--ink)",
  },
};

export function playerTheme(name: string): PlayerTheme {
  return THEMES[name] ?? THEMES.Mukul;
}

const DISPLAY_ORDER = ["Mukul", "Madhulika"];

/** Mukul on the left, Madhulika on the right, everywhere. */
export function inDisplayOrder<T extends { name: string }>(players: T[]): T[] {
  return [...players].sort((x, y) => DISPLAY_ORDER.indexOf(x.name) - DISPLAY_ORDER.indexOf(y.name));
}
