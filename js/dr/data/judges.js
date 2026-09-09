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

/* ── WHO RUNS THE ROOM WHEN THE PANEL IS NOT SITTING ──
   A few challenges are worked away from the main stage with one of these
   people in charge of the day: Michelle directs the video shoot and runs the
   recording booth, and Jamal takes a room that has to learn choreography. It
   was written as "the director" and "the vocal producer", unnamed and
   faceless, which is a stranger the audience has never met giving notes that
   change a result.

   AND SHE IS ON THE PANEL, which is the part that makes this more than a
   label. "I was on that set and she was difficult" is a thing this show says
   out loud, and it means the impression from the day is not hearsay reaching
   the judges — it is one judge's own eyes. js/dr/judging.js weighs it that
   way: full for the person who was there, halved for the seats who only heard
   about it. */
export const MENTORS = {
  'music-video': 'michelle',
  rumix: 'michelle',
  'girl-group': 'jamal',
  choreography: 'jamal',
  rusical: 'jamal',
};

/* AND SOME ROOMS HAVE A DIFFERENT PERSON IN THEM ON THE SAME NIGHT. Michelle
   runs the booth and directs the shoot; the choreography is Jamal's, on every
   challenge that has any. Keyed by BEAT, because "who runs this room" is a
   property of the room and not of the challenge — a Rumix has both of them in
   it on the same afternoon. */
export const MENTOR_BY_BEAT = {
  'booth-session': 'michelle',
  'studio-day': 'michelle',
  rehearsal: 'jamal',
};

/** Who ran the room on this challenge, or null when the host did it alone. */
export function mentorFor(maxiId) {
  const id = MENTORS[maxiId];
  return id ? (JUDGES.find(j => j.id === id) || null) : null;
}

/** Who is in the room for THIS beat, falling back to the challenge's own. */
export function mentorForBeat(beatId, maxiId) {
  const id = MENTOR_BY_BEAT[beatId];
  return id ? (JUDGES.find(j => j.id === id) || null) : mentorFor(maxiId);
}

export const JUDGES = [
  {
    id: 'rupaul', name: 'RuPaul', permanent: true,
    portrait: 'assets/avatars/rupaul.png',
    portraitStage: 'assets/avatars/rupaul-drag.png',
    voice: 'Warm, oracular, decides in one sentence. Loves a story and a comeback, and will say the quiet part out loud kindly.',
    taste: { challenge: 0.45, runway: 0.25, risk: 0.20, polish: 0.10 },
    styleBias: { comedy: 0.4, camp: 0.3, pageant: 0.1, art: -0.1 },
    // Warm, and decides in one sentence. She can be devastating and it still arrives
    // kindly.
    warmth: 0.70,
    petPeeve: 'a queen who plays it safe',
    softSpot: 'a big personality',
  },
  {
    id: 'michelle', name: 'Michelle Visage', permanent: true,
    portrait: 'assets/avatars/michellevisage.png',
    voice: 'Direct and technical. Hard on construction and a hidden waist, soft on a live vocal, and never softens a note to be liked.',
    taste: { challenge: 0.40, runway: 0.40, risk: 0.05, polish: 0.15 },
    styleBias: { pageant: 0.4, fashion: 0.3, glamour: 0.2, 'club-kid': -0.2 },
    // Harder than RuPaul and not as hard as Law. She never softens a note to be liked,
    // and she is capable of real warmth, which is what makes the praise land.
    warmth: 0.20,
    petPeeve: 'a hidden waist',
    softSpot: 'a live vocal',
  },
  {
    id: 'carson', name: 'Carson Kressley', permanent: false,
    portrait: 'assets/avatars/carson.png',
    voice: 'Puns first, fashion second. Delighted by camp, a reveal, and anybody willing to look ridiculous on purpose.',
    taste: { challenge: 0.35, runway: 0.40, risk: 0.15, polish: 0.10 },
    styleBias: { camp: 0.4, comedy: 0.3, fashion: 0.2, spooky: -0.1 },
    // The softest seat on the panel. Puns first and delight second, and even his pans
    // arrive wrapped in a joke.
    warmth: 0.90,
    petPeeve: 'a look with no idea behind it',
    softSpot: 'a joke that lands',
  },
  {
    id: 'ross', name: 'Ross Mathews', permanent: false,
    portrait: 'assets/avatars/ross.png',
    voice: 'Enthusiastic and comedy-minded, cries easily, and will forgive a look entirely for a performance that moved him.',
    taste: { challenge: 0.55, runway: 0.20, risk: 0.15, polish: 0.10 },
    styleBias: { comedy: 0.5, camp: 0.3, broadway: 0.2, art: -0.1 },
    // On the nice side and just short of Carson. He cries easily and forgives a look
    // for a performance that moved him, but he will name the dead air.
    warmth: 0.78,
    petPeeve: 'dead air in the middle of a bit',
    softSpot: 'a heartfelt moment',
  },
  {
    id: 'law', name: 'Law Roach', permanent: false,
    portrait: 'assets/avatars/law.png',
    voice: 'Fashion authority, unimpressed by default. A look either is or it is not, and he will not pretend otherwise to be nice.',
    taste: { challenge: 0.25, runway: 0.55, risk: 0.10, polish: 0.10 },
    styleBias: { fashion: 0.6, art: 0.3, glamour: 0.2, comedy: -0.2, camp: -0.2 },
    // THE HARDEST SEAT ON THE PANEL. Unimpressed by default; a look either is or it is
    // not, and he will not pretend otherwise to be nice.
    warmth: 0.05,
    petPeeve: 'a cheap fabric under a good idea',
    softSpot: 'proportion',
  },
  {
    id: 'ts', name: 'TS Madison', permanent: false,
    portrait: 'assets/avatars/ts.png',
    voice: 'Loud, loving and unfiltered. Rewards nerve and a body, and reads a coward the second she sees one.',
    taste: { challenge: 0.40, runway: 0.25, risk: 0.30, polish: 0.05 },
    styleBias: { 'club-kid': 0.3, dancer: 0.3, comedy: 0.2, pageant: 0.1, art: -0.1 },
    // In between, and genuinely both. Loud and loving until she sees a coward, and then
    // not.
    warmth: 0.50,
    petPeeve: 'no nerve',
    softSpot: 'a stunt she did not see coming',
  },
  {
    id: 'jamal', name: 'Jamal Sims', permanent: false,
    portrait: 'assets/avatars/jamal.png',
    voice: 'A choreographer watching feet and counting. Kind about effort, exact about timing, and he can tell who learned it this morning.',
    taste: { challenge: 0.50, runway: 0.20, risk: 0.10, polish: 0.20 },
    styleBias: { dancer: 0.5, broadway: 0.3, 'club-kid': 0.1, fashion: -0.1 },
    // Nearer the middle. He values EFFORT, which cuts both ways: generous to a queen
    // who clearly worked, exact with one who did not.
    warmth: 0.60,
    petPeeve: 'being off the count',
    softSpot: 'a clean eight',
  },
];
