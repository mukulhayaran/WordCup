import { SHARED, type SiteCup } from "./cups";

export type Edition = {
  weekStart: string;
  weekNumber: number;
  headline: string;
  subhead: string;
  story: string;
  scores: Array<{ name: string; points: number }>;
};

/** How many cups in a row the winner of cups[index] has now won. */
export function reignLength(cups: SiteCup[], index: number): number {
  const winner = cups[index]?.winner;
  if (!winner || winner === SHARED) return 0;
  let length = 0;
  for (let i = index; i >= 0 && cups[i].winner === winner; i--) length++;
  return length;
}

/** How many times the cup changed hands in the run leading up to cups[index]. */
function swapsBefore(cups: SiteCup[], index: number): number {
  let swaps = 0;
  for (let i = index - 1; i > 0; i--) {
    const [now, before] = [cups[i].winner, cups[i - 1].winner];
    if (now === SHARED || before === SHARED || now === before) break;
    swaps++;
  }
  return swaps;
}

/** The front page for one finished cup. Uses names only, no role titles. */
export function buildEdition(cups: SiteCup[], index: number, playerNames: [string, string]): Edition {
  const cup = cups[index];
  const base = {
    weekStart: cup.weekStart,
    weekNumber: cup.weekNumber,
    scores: [...playerNames]
      .map((name) => ({ name, points: cup.scores[name] ?? 0 }))
      .sort((x, y) => (cup.winner === y.name ? 1 : 0) - (cup.winner === x.name ? 1 : 0)),
  };

  if (cup.winner === SHARED) {
    const [x, y] = playerNames;
    return {
      ...base,
      headline: "HUNG PARLIAMENT!",
      subhead: `${x} and ${y} forced to share power`,
      story: `Week ${cup.weekNumber} ended level at ${cup.scores[x] ?? 0}–${cup.scores[y] ?? 0}. Neither side has conceded.`,
    };
  }

  const winner = cup.winner;
  const loser = playerNames.find((n) => n !== winner) ?? "";
  const [w, l] = [cup.scores[winner] ?? 0, cup.scores[loser] ?? 0];
  const reign = reignLength(cups, index);
  const score = `${w}–${l}`;

  if (reign >= 5) {
    return {
      ...base,
      headline: `THE ${winner.toUpperCase()} DYNASTY!`,
      subhead: `${reign} cups in a row and counting`,
      story: `${winner} won Week ${cup.weekNumber} ${score}. ${loser} is running out of excuses.`,
    };
  }
  if (reign >= 3) {
    return {
      ...base,
      headline: reign === 3 ? `HAT-TRICK FOR ${winner.toUpperCase()}!` : `${winner.toUpperCase()} WINS AGAIN!`,
      subhead: `${reign} cups in a row`,
      story: `${winner} won Week ${cup.weekNumber} ${score}. ${loser}'s party is calling an emergency meeting.`,
    };
  }
  if (reign === 2) {
    const swaps = swapsBefore(cups, index);
    return {
      ...base,
      headline: `${winner.toUpperCase()} RE-ELECTED!`,
      subhead: swaps >= 3 ? `${loser}'s rotation hopes in ruins` : `${loser} demands a recount`,
      story:
        swaps >= 3
          ? `After ${swaps + 1} straight weeks of swapping the cup, ${winner} held on with a ${score} win.`
          : `${winner} held on to the cup with a ${score} win in Week ${cup.weekNumber}.`,
    };
  }
  if (w - l >= 4) {
    return {
      ...base,
      headline: `LANDSLIDE FOR ${winner.toUpperCase()}!`,
      subhead: `${loser} left speechless`,
      story: `${winner} swept to a ${score} win in Week ${cup.weekNumber}.`,
    };
  }
  return {
    ...base,
    headline: `${winner.toUpperCase()} TAKES POWER!`,
    subhead: w - l === 1 ? "A nail-biter to the very end" : `${loser} back in opposition`,
    story: `${winner} won the Week ${cup.weekNumber} cup ${score}.`,
  };
}

export type WeeklyLine = { defendingChampion: string | null; challenge: string | null };

/** The Defending Champion tag all week, plus the challenge line on Mondays. */
export function weeklyLine(cups: SiteCup[], playerNames: [string, string], isMonday: boolean): WeeklyLine {
  const last = cups[cups.length - 1];
  if (!last || last.winner === SHARED) {
    return { defendingChampion: null, challenge: isMonday && last ? "The cup is up for grabs this week." : null };
  }
  const champion = last.winner;
  const rival = playerNames.find((n) => n !== champion) ?? "";
  if (!isMonday) return { defendingChampion: champion, challenge: null };

  const reign = reignLength(cups, cups.length - 1);
  const challenge =
    reign === 1
      ? `${champion} is defending the cup. Can ${rival} take it back?`
      : reign === 2
        ? `${champion} is going for a Hat-trick. Can ${rival} stop it?`
        : reign === 4
          ? `${champion} is one win from a Dynasty. Can ${rival} stop it?`
          : `${champion} is going for ${reign + 1} in a row. Can ${rival} stop it?`;
  return { defendingChampion: champion, challenge };
}
