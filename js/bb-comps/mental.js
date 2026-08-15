// ══════════════════════════════════════════════════════════════════════
// bb-comps/mental.js — puzzles, questions and the wall of faces
// ══════════════════════════════════════════════════════════════════════
//
// The competitions where the house's biggest bodies are no help at all, which
// is exactly why they change weeks. A mental competition is how the quiet
// player who has been counted out all season suddenly holds the power.
//
// They also read the season back to the house: a quiz about who voted for whom
// is only answerable by people who were paying attention, and being seen to
// have paid attention is its own kind of exposure.

import { cutAndCover } from './cut-and-cover.js';
import { majorityRules } from './majority-rules.js';
import { morphOMatic } from './morph-o-matic.js';
import { knockout } from './knockout.js';

// Cut and Cover used to live here as one scored roll with four beats on top,
// including a "somebody led and lost it" line handed to a random top-three
// finisher. It now runs the boards pass by pass — with the forced pieces, the
// teardowns and the sightlines the rules always claimed it had — and is far too
// big to sit in a shared file. The id (`bb-mental-puzzle`) is unchanged.
export { cutAndCover } from './cut-and-cover.js';
/** The name it was exported under before it had a file of its own. */
export { cutAndCover as puzzleRace } from './cut-and-cover.js';

// House Record used to live here as a one-roll quiz. It is now Majority Rules —
// a real recurring competition with rounds, eliminations and a tiebreaker — and
// lives in its own file because it is far too big to sit in a shared one. The
// id (`bb-mental-quiz`) is unchanged, so the picker, the season schedule and any
// pinned week still resolve to it.
export { majorityRules } from './majority-rules.js';

// The Wall of Faces used to live here as a one-roll "spot the changed detail".
// It is now Morph 'O' Matic — a real recurring competition with a board of
// morphed faces, wrong registrations and a running clock — in its own file. The
// id (`bb-mental-memory`) is unchanged.
export { morphOMatic } from './morph-o-matic.js';

// Knockout: the most-run competition in the format's history and the only one
// where winning hands you a decision about somebody else rather than a score.
// New to the library rather than a replacement, so it carries its own id.
export { knockout } from './knockout.js';

export const MENTAL_COMPS = [cutAndCover, majorityRules, morphOMatic, knockout];
