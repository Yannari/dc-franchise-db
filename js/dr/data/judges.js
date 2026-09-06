// ══════════════════════════════════════════════════════════════════════
// dr/data/judges.js — the panel, authored
// ══════════════════════════════════════════════════════════════════════
//
// A judge is a TASTE, not a difficulty setting. `taste` is how much of a
// verdict comes from the challenge, the runway, the risk she took and how
// polished it was; the four sum to 1, so no judge is simply harsher than
// another — they are looking at different things.
//
// That is the whole reason step 2 exists. If every judge weighed the same
// terms the same way, the panel would be an expensive way to re-rank the
// performance scores and "she was robbed" could never happen. Law weighing the
// runway at 0.55 against Ross's 0.20 is what makes a look queen and a comedy
// queen genuinely disagree about the same night.
//
// `styleBias` is a soft spot (+) or an impatience (−), in points on a
// ten-point view, per drag style. Small numbers on purpose: a bias is a lean,
// never a verdict.
//
// The host has TWO portraits. Out of drag in the werk room, in drag on the
// main stage. A screen that uses the wrong one is wrong twice over, so both
// live here rather than being guessed from the context.
//
// ── THE EIGHT FILES THIS EXPECTS, none of which exists yet ────────────
//   assets/avatars/rupaul.png          (werk room)
//   assets/avatars/rupaul-drag.png     (main stage)
//   assets/avatars/michellevisage.png
//   assets/avatars/carson.png
//   assets/avatars/ross.png
//   assets/avatars/law.png
//   assets/avatars/ts.png
//   assets/avatars/jamal.png
// Nothing in the engine loads an image, so a missing file costs nothing until
// the viewing party is built (Plan 5), where the judge card falls back to
// initials. Recorded here rather than left to be discovered from a broken
// image: the names are fixed and the pictures are not yet drawn.
//
// These paths are deliberately literal and NOT resolved through
// js/avatar-registry.js: that file turns a PLAYER plus a show into a picture,
// and a judge is not a player. A guest judge is, and js/dr/judges.js leaves
// their portrait null for exactly that reason.

export const JUDGES = [
  {
    id: 'rupaul', name: 'RuPaul', permanent: true,
    portrait: 'assets/avatars/rupaul.png',
    portraitStage: 'assets/avatars/rupaul-drag.png',
    voice: 'Warm, oracular, decides in one sentence. Loves a story and a comeback, and will say the quiet part out loud kindly.',
    taste: { challenge: 0.45, runway: 0.25, risk: 0.20, polish: 0.10 },
    styleBias: { comedy: 0.4, camp: 0.3, pageant: 0.1, art: -0.1 },
    petPeeve: 'a queen who plays it safe',
    softSpot: 'a big personality',
  },
  {
    id: 'michelle', name: 'Michelle Visage', permanent: true,
    portrait: 'assets/avatars/michellevisage.png',
    voice: 'Direct and technical. Hard on construction and a hidden waist, soft on a live vocal, and never softens a note to be liked.',
    taste: { challenge: 0.40, runway: 0.40, risk: 0.05, polish: 0.15 },
    styleBias: { pageant: 0.4, fashion: 0.3, glamour: 0.2, 'club-kid': -0.2 },
    petPeeve: 'a hidden waist',
    softSpot: 'a live vocal',
  },
  {
    id: 'carson', name: 'Carson Kressley', permanent: false,
    portrait: 'assets/avatars/carson.png',
    voice: 'Puns first, fashion second. Delighted by camp, a reveal, and anybody willing to look ridiculous on purpose.',
    taste: { challenge: 0.35, runway: 0.40, risk: 0.15, polish: 0.10 },
    styleBias: { camp: 0.4, comedy: 0.3, fashion: 0.2, spooky: -0.1 },
    petPeeve: 'a look with no idea behind it',
    softSpot: 'a joke that lands',
  },
  {
    id: 'ross', name: 'Ross Mathews', permanent: false,
    portrait: 'assets/avatars/ross.png',
    voice: 'Enthusiastic and comedy-minded, cries easily, and will forgive a look entirely for a performance that moved him.',
    taste: { challenge: 0.55, runway: 0.20, risk: 0.15, polish: 0.10 },
    styleBias: { comedy: 0.5, camp: 0.3, broadway: 0.2, art: -0.1 },
    petPeeve: 'dead air in the middle of a bit',
    softSpot: 'a heartfelt moment',
  },
  {
    id: 'law', name: 'Law Roach', permanent: false,
    portrait: 'assets/avatars/law.png',
    voice: 'Fashion authority, unimpressed by default. A look either is or it is not, and he will not pretend otherwise to be nice.',
    taste: { challenge: 0.25, runway: 0.55, risk: 0.10, polish: 0.10 },
    styleBias: { fashion: 0.6, art: 0.3, glamour: 0.2, comedy: -0.2, camp: -0.2 },
    petPeeve: 'a cheap fabric under a good idea',
    softSpot: 'proportion',
  },
  {
    id: 'ts', name: 'TS Madison', permanent: false,
    portrait: 'assets/avatars/ts.png',
    voice: 'Loud, loving and unfiltered. Rewards nerve and a body, and reads a coward the second she sees one.',
    taste: { challenge: 0.40, runway: 0.25, risk: 0.30, polish: 0.05 },
    styleBias: { 'club-kid': 0.3, dancer: 0.3, comedy: 0.2, pageant: 0.1, art: -0.1 },
    petPeeve: 'no nerve',
    softSpot: 'a stunt she did not see coming',
  },
  {
    id: 'jamal', name: 'Jamal Sims', permanent: false,
    portrait: 'assets/avatars/jamal.png',
    voice: 'A choreographer watching feet and counting. Kind about effort, exact about timing, and he can tell who learned it this morning.',
    taste: { challenge: 0.50, runway: 0.20, risk: 0.10, polish: 0.20 },
    styleBias: { dancer: 0.5, broadway: 0.3, 'club-kid': 0.1, fashion: -0.1 },
    petPeeve: 'being off the count',
    softSpot: 'a clean eight',
  },
];
