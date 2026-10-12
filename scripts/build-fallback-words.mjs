import { readFileSync, writeFileSync } from "node:fs";

// Hand-picked common, family-friendly 5-letter English words to use as a
// deterministic fallback answer pool if the NYT endpoint is ever down.
// Validated below against the allowed-guesses list (so every fallback
// answer is also guaranteed to be an accepted guess).
const candidates = `
about above abuse actor acute admit adopt adult after again agent agree
ahead alarm album alert alike alive allow alone along alter among anger
angle angry apple apply arena argue arise array aside asset avoid await
awake award aware badly baker basic basis beach began begin being below
bench birth black blame blank blind block blood board boost booth bound
brain brand bread break breed brief bring broad broke brown build built
buyer cable carry catch cause chain chair chaos charm chart chase cheap
check chest chief child china chose civil claim class clean clear click
clock close coach coast could count court cover craft crash crazy cream
crime cross crowd crown curve cycle daily dance dealt death debut delay
depth doing doubt dozen draft drama drank dream dress drill drink drive
drove dying eager early earth eight elite empty enemy enjoy enter entry
equal error event every exact exist extra faith false fault fiber field
fifth fifty fight final first fixed flash fleet floor fluid focus force
forth forty forum found frame frank fraud fresh front fruit fully funny
giant given glass globe going grace grade grand grant grass great green
gross group grown guard guess guest guide happy harsh heart heavy hence
horse hotel house human ideal image index inner input issue joint judge
known label large laser later laugh layer learn lease least leave legal
level light limit lived local logic loose lower lucky lunch lying magic
major maker march match mayor meant media metal might minor minus mixed
model money month moral motor mount mouse mouth movie music needs never
newly night noise north noted novel nurse occur ocean offer often order
other ought paint panel paper party peace phase phone photo piece pilot
pitch place plain plane plant plate point pound power press price pride
prime print prior prize proof proud prove queen quick quiet quite radio
raise range rapid ratio reach ready refer right rival river robot roman
rough round route royal rural scale scene scope score sense serve seven
shall shape share sharp sheet shelf shell shift shine shirt shock shoot
short shown sight since sixth sixty skill sleep slide small smart smile
smoke solid solve sorry sound south space spare speak speed spend spent
split spoke sport staff stage stake stand start state steam steel stick
still stock stone stood store storm story strip stuck study stuff style
sugar suite super sweet table taken taste teach teeth texas thank theft
their theme there these thick thing think third those three threw throw
tight times tired title today topic total touch tough tower track trade
train treat trend trial tribe trick tried tries truck truly trust truth
twice under union unity until upper upset urban usage usual valid value
video virus visit vital voice waste watch water wheel where which while
white whole whose woman women world worry worse worst worth would write
wrong yield young youth
`
  .trim()
  .split(/\s+/);

const allowed = new Set(
  JSON.parse(readFileSync("src/lib/data/allowed-guesses.json", "utf8"))
);

const seen = new Set();
const result = [];
for (const w of candidates) {
  if (!/^[a-z]{5}$/.test(w)) throw new Error(`bad word: ${w}`);
  if (seen.has(w)) throw new Error(`duplicate: ${w}`);
  seen.add(w);
  if (!allowed.has(w)) throw new Error(`not in allowed-guesses list: ${w}`);
  result.push(w);
}

writeFileSync("src/lib/data/fallback-answers.json", JSON.stringify(result));
console.log(`wrote ${result.length} fallback answers`);
