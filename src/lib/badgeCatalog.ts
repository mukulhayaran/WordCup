export type Rarity = "common" | "rare" | "legendary";
export type BadgeScope = "weekly" | "daily";

export type BadgeDef = {
  id: string;
  name: string;
  how: string;
  icon: string;
  rarity: Rarity;
  scope: BadgeScope;
  group: string;
};

type Row = [id: string, name: string, how: string, icon: string, rarity: Rarity];

const group = (scope: BadgeScope, name: string, rows: Row[]): BadgeDef[] =>
  rows.map(([id, badge, how, icon, rarity]) => ({ id, name: badge, how, icon, rarity, scope, group: name }));

export const BADGES: BadgeDef[] = [
  ...group("weekly", "Holding the cup", [
    ["W1", "Re-elected", "Win 2 cups in a row", "ballot", "rare"],
    ["W2", "Hat-trick Government", "Win 3 cups in a row", "hat", "rare"],
    ["W3", "Dynasty", "Win 5 cups in a row", "hall", "legendary"],
    ["W4", "Rotating Government", "The cup changes hands 4 weeks running", "turn", "rare"],
    ["W5", "Anti-Rotation", "Win twice in a row, ending a run of 3+ swaps", "siren", "rare"],
  ]),
  ...group("weekly", "Taking the cup back", [
    ["W6", "Anti-Incumbency", "Beat last week's champion", "sword", "common"],
    ["W7", "Back in Power", "Win the cup back right after losing it", "chair", "common"],
    ["W8", "No-Confidence Motion", "End a run of 3+ cups", "scale", "legendary"],
  ]),
  ...group("weekly", "How the week was won", [
    ["W9", "Landslide", "Win by 4+ points", "wave", "rare"],
    ["W10", "Clean Sweep", "Win 7–0", "broom", "legendary"],
    ["W11", "Photo Finish", "Win by exactly 1 point", "camera", "common"],
    ["W12", "Exit Polls Were Wrong", "Behind after Friday, still win the cup", "chart", "rare"],
    ["W13", "The Coup", "Not ahead before Sunday, win on Sunday's word", "crown", "rare"],
    ["W14", "Hung Parliament", "The cup ends in a tie", "link", "common"],
    ["W15", "Deposit Forfeited", "Lose the week with 0 or 1 point", "money", "rare"],
  ]),
  ...group("daily", "Beating each other", [
    ["D1", "Motion Passed", "Win 2 days in a row", "ballot", "common"],
    ["D2", "On a Roll Call", "Win 3 days in a row", "flame", "rare"],
    ["D3", "Ordinance Raj", "Win 5 days in a row", "scroll", "legendary"],
    ["D4", "Session Disrupted", "End the other player's run of 3+ daily wins", "stop", "rare"],
    ["D5", "Narrow Vote", "Win by exactly 1 guess", "pinch", "common"],
    ["D6", "Voice Vote", "Win by 3+ guesses", "mic", "rare"],
    ["D7", "Last Party Standing", "You solve it, the other player fails", "person", "rare"],
    ["D8", "Coalition", "Tie on the same number of guesses", "link", "common"],
    ["D9", "Opposition Walkout", "You both fail", "door", "rare"],
  ]),
  ...group("daily", "How you guessed", [
    ["D10", "Insider Information", "Solve in 1 guess", "orb", "legendary"],
    ["D11", "Express Bill", "Solve in 2 guesses", "bolt", "rare"],
    ["D12", "Strong Opening Speech", "3+ letters in the right spot on guess 1", "mic", "common"],
    ["D13", "From the Back Benches", "First guess all grey, still solve it", "chair", "common"],
    ["D14", "Filibuster", "Solve without a single yellow tile", "wall", "rare"],
    ["D15", "Last-Minute Amendment", "Solve on your 6th guess", "clock", "common"],
    ["D16", "Stuck in Committee", "4 right letters for 3 guesses in a row, then solve", "hall", "rare"],
  ]),
  ...group("daily", "Funny shame badges", [
    ["D17", "Didn't Read the Bill", "Reuse a letter you already know is grey", "book", "common"],
    ["D18", "Scam Exposed", "Fail the word", "x", "common"],
    ["D19", "Absent from Parliament", "Miss a day completely", "hide", "common"],
  ]),
  ...group("daily", "Showing up", [
    ["D20", "Morning Assembly", "Finish between 4 and 8 AM", "sun", "common"],
    ["D21", "Midnight Session", "Finish between midnight and 4 AM", "moon", "rare"],
    ["D22", "First to Vote", "Finish first on 5 days of one week", "run", "rare"],
    ["D23", "Full Attendance", "Play 30 days in a row", "cal", "rare"],
    ["D24", "Clean Record", "Solve 10 days in a row", "check", "rare"],
    ["D25", "Senior Leader", "Play 100 games", "star", "legendary"],
  ]),
];

export const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));
