export type GiftCategory = "flower" | "silly" | "app";

export type GiftDef = { code: string; name: string; line: string; category: GiftCategory; icon: string };

const list = (category: GiftCategory, rows: Array<[string, string, string, string]>): GiftDef[] =>
  rows.map(([code, name, line, icon]) => ({ code, name, line, category, icon }));

export const GIFTS: GiftDef[] = [
  ...list("flower", [
    ["F1", "Marigold", "The classic victory flower.", "f:marigold"],
    ["F2", "Sunflower", "You were the bright spot this week.", "f:sunflower"],
    ["F3", "Tulip", "Simple and cheerful.", "f:tulip"],
    ["F4", "Mogra", "Small and sweet-smelling.", "f:mogra"],
    ["F5", "Hibiscus", "Bold, for a big win.", "f:hibiscus"],
    ["F6", "Rose", "A classic.", "f:rose"],
    ["F7", "Cactus", "Congratulations, I guess.", "f:cactus"],
    ["F8", "Wilted Flower", "This is how I feel about your win.", "f:wilted"],
    ["F9", "Official Bouquet", "Three flowers at once.", "f:bouquet"],
    ["F10", "Garland of Victory", "Around your photo for a day.", "f:garland"],
  ]),
  ...list("silly", [
    ["S1", "Cutting Chai", "For your hard work.", "chai"],
    ["S2", "Pinch of Salt", "From a very salty loser.", "salt"],
    ["S3", "White Flag", "I surrender, for now.", "flag"],
    ["S4", "Single Potato", "No explanation given.", "potato"],
    ["S5", "Statue of the Winner", "Stands in your Trophy Cabinet.", "statue"],
    ["S12", "Nimbu-Mirchi", "Wards off bad guesses.", "nimbu"],
    ["S21", "KitKat", "Have a break. You've earned it.", "kitkat"],
    ["S22", "Pani Puri", "One plate, extra teekha.", "panipuri"],
    ["S23", "Teddy", "Official mascot of your victory.", "teddy"],
  ]),
  ...list("app", [
    ["A1", "Flower Shower", "Petals fall when you open the app, for a day.", "f:mogra"],
    ["A2", "Red Beacon", "VIP light beside your name all week.", "siren"],
    ["A3", "Crown", "On your photo for a day.", "crown"],
    ["A4", "Clown Nose", "Goes on the sender's photo for a day.", "clown"],
  ]),
];

export const GIFT_BY_CODE = new Map(GIFTS.map((g) => [g.code, g]));

/** `line` speaks to whoever receives the gift; these say the same thing to the sender. */
const SENDER_LINES: Record<string, (toName: string) => string> = {
  F10: (to) => `Around ${to}'s photo for a day.`,
  S5: (to) => `Stands in ${to}'s Trophy Cabinet.`,
  A1: (to) => `Petals fall when ${to} opens the app, for a day.`,
  A2: (to) => `VIP light beside ${to}'s name all week.`,
  A3: (to) => `On ${to}'s photo for a day.`,
  A4: () => "Goes on your own photo for a day.",
};

export const senderLine = (gift: GiftDef, toName: string) => SENDER_LINES[gift.code]?.(toName) ?? gift.line;

export const SPEECH_MAX_CHARS = 60;
export const SPEECH_SUGGESTIONS = ["The voters have spoken. They were wrong.", "I demand a recount.", "Next week, I return."];
export const THANKS = ["Accepted graciously", "Try harder next week", "The least you could do", "Noted by the Cabinet"];

export const BOUQUET_CODE = "F9";
export const GARLAND_CODE = "F10";
/** The three flowers a Bouquet puts in the vase. */
export const BOUQUET_FLOWERS = ["F1", "F5", "F2"];
export const VASE_SIZE = 6;
