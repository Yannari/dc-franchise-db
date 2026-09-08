// ══════════════════════════════════════════════════════════════════════
// dr/data/maxi-voices.js — the draft and the walkthrough, in their own words
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The maxi challenge was HALF fixed. `familyForChallenge` gives the
// performance itself the challenge's own language — a Snatch Game collapse is
// breaking character in the second question, a Rusical collapse is being
// off-key in front of a live band — and that half is good. Two other beats on
// the same night were never touched, and dumping a Snatch Game and reading it
// is what showed how bad they are.
//
// ── ONE: THE PICK NEVER SAYS WHAT SHE PICKED ──────────────────────────
//
// Eleven `pick-reaction` cards on one episode, and between them they say
// "the pick", "it", "this one", "what is available" — on a night where the
// thing being picked is a CELEBRITY SHE HAS TO BE FOR SIX QUESTIONS. The
// engine knows exactly what she got; `assignment.picks[n].choice` has carried
// it since the draft resolver was written, and the screen even title-cases it
// onto the card. The prose could not say it.
//
// "First choice, best choice. Q5 takes what she wanted" is a sentence about
// nothing. "She wanted Judy and she got Judy" is the same beat with the show
// in it.
//
// ── TWO: THE WALKTHROUGH REPEATS ITSELF SIX TIMES ─────────────────────
//
// Worse, and it is arithmetic. The walkthrough event has FOUR variants and
// fires once per queen — ten times on that episode — so the draw exhausts and
// starts repeating. This printed verbatim, six times, in one prep room:
//
//   "The host stops at {a}'s station and looks at what she is building and
//    says one thing. The thing is specific..."
//
// And it is wrong twice over, because on a Snatch Game nobody is BUILDING
// anything — she is choosing a character and writing jokes. The note is also
// never specific, in a sentence that promises it is.
//
// ── THE TWO POOLS ─────────────────────────────────────────────────────
//
//   PICK_VOICES         4 role kinds × 4 pick tiers.  What she got.
//   WALKTHROUGH_VOICES  17 families.                  What the host said about it.
//
// ── WHY ROLE KINDS AND NOT CHALLENGE FAMILIES FOR THE PICK ────────────
//
// Because the pick is the same emotional beat everywhere and only the OBJECT
// changes, and the object arrives as `{d}`. A queen missing her first-choice
// character and a queen missing her first-choice verse are having the same
// afternoon. Keying this on all seventeen families would be sixty-eight tiers
// to say four things.
//
// The four kinds are the authored `roles` field in js/dr/data/challenges.js
// plus the one case it does not cover — a draft whose `roles` is null is
// drafting a PERSON, which is the makeover and the lip sync challenge.
//
// The walkthrough is the opposite case: the host's note is entirely about the
// work in front of her, and the work is different in every family. So that one
// is per family, like the performance it is a note about.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THIRD PERSON, werk room register. Intimate and quick, people mid-job.
//
// Placeholders:
//   {a}  the queen.
//   {d}  WHAT SHE PICKED, already resolved to a readable name — "Judy
//        Garland", "The Prosecutor", "Verse Two", or the queen's own name in
//        a partner draft. THE WHOLE POINT OF THE PICK POOL: use it in most
//        lines. A test rejects a pick tier that never reaches for it.
//   {c}  the challenge, by name.
//
// {d} IS NOT ALWAYS PRETTY. It is a title-cased slug for anything without an
// authored name, so it may read like "Red Lame" or "Slot Three". Write around
// it as an object rather than leaning on it as a phrase: "she got {d}" is
// safe, "the {d} she had been planning all week" is not.
//
// Same rules as every other pool, all enforced by tests: no real people beyond
// the host and the authored panel, this show's vocabulary only, never quote a
// stat by number, prose rather than captions.

import { MAXI_TYPES } from './challenges.js';

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The four pick outcomes. These are the tiers of `pick-reaction`. */
export const PICK_TIER_IDS = ['got-it', 'settled', 'left-over', 'picked-last'];

/**
 * HOW MANY VARIANTS, and it is not four.
 *
 * `pick-reaction` fires once per queen with a pick — eleven times on the
 * episode that produced this file — and `settled` took six of them against a
 * four-variant pool, so two queens got the same paragraph word for word. The
 * walkthrough is worse: four variants, ten fires, and the same line printed
 * six times.
 */
export const MAXI_VARIANTS = { 'got-it': 6, settled: 8, 'left-over': 6, 'picked-last': 6, walkthrough: 8 };

// ══════════════════════════════════════════════════════════════════════
// POOL 1 — THE DRAFT. What she got, and how she took it.
// ══════════════════════════════════════════════════════════════════════

const kind = (id, note, tiers) => ({ kind: id, note, tiers });

const P = (got, settled, left, last) => [
  tier('got-it', got), tier('settled', settled),
  tier('left-over', left), tier('picked-last', last),
];

export const PICK_VOICES = [
  kind('characters',
    'SNATCH GAME, and nothing else. {d} is a person she now has to BE — the '
    + 'voice, the hair, the six answers. The most consequential pick in the '
    + 'season: a queen who loses her character loses the week, because the '
    + 'second choice is somebody she has not practised in a mirror.', P(
      'She got {d}, which is the one she has been doing at home for years.',
      'Not {d}, but she has something. She is already rebuilding the voice.',
      'She is left with {d}, whom she has never once attempted.',
      'Last pick, and {d} is whatever nobody else was willing to try.')),
  kind('parts',
    'A SCRIPTED ROLE with lines already written for it. {d} is a part in '
    + 'somebody else\'s script — the size of it, the jokes in it and whether '
    + 'it suits her are all decided before she opens her mouth.', P(
      'She wanted {d} and got {d}, and {d} is the part with the lines in it.',
      'Not the part she wanted. {d} is workable and she is deciding how.',
      '{d} is the part left on the table, and there is a reason it was left.',
      'Picked last, and {d} is a part with almost nothing in it.')),
  kind('slots',
    'A POSITION IN A GROUP NUMBER — a verse, an eight-count, a place in the '
    + 'running order. {d} is not a character, it is real estate: where in the '
    + 'song she stands and how much of it is hers.', P(
      '{d} is the spot everybody wanted and she took it first.',
      '{d} is not the spot she wanted, and she can work with where she is.',
      '{d} is what nobody chose, and she can hear why.',
      'Picked last and handed {d}, which is barely a position at all.')),
  kind('partner',
    'A PERSON, not a thing. {d} is another queen — the one she has to make '
    + 'over, or the one she has to face. Everything about her week now depends '
    + 'on somebody who has her own opinions about it.', P(
      'She took {d}, and taking {d} was the whole plan.',
      '{d} was not who she came for, and {d} will do.',
      'She is left with {d}, which is a pairing neither of them chose.',
      'Picked last and paired with {d} by process of elimination.')),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 2 — THE WALKTHROUGH. What the host said, about this week's work.
// ══════════════════════════════════════════════════════════════════════
//
// She walks the room mid-build and stops at each station. The note is the
// most useful thing anybody says to a queen all week, because the runway can
// still answer it — and this beat has been printing "she looks at what she is
// building and says one thing, and the thing is specific" without ever being
// specific, over challenges where nothing is being built.
//
// SO SAY THE NOTE. Not that a note was given: what it was about. A Snatch
// Game note is about the character choice and whether she has jokes for it. A
// design note is about construction and whether the material is being used or
// hidden. A Rusical note is about whether she knows the words yet.
//
// ONE TIER PER FAMILY. There is no good/bad split: the host's note is neither,
// and a queen taking it well or badly is a separate beat that already exists.
// Write the range inside the pool — some notes are a rescue, some are a
// warning, and the same eight lines should cover both.

const walk = (family, note, lines = []) => ({ family, note, lines: lines.slice() });

export const WALKTHROUGH_VOICES = [
  walk('snatch-game', 'The character, and whether she has six answers for it.'),
  walk('girl-group', 'Her verse, her eight-count, and whether the group is one thing.'),
  walk('rusical', 'The words, the key, and whether she knows it yet.'),
  walk('roast', 'Her material — read aloud, in the room, before anybody laughs.'),
  walk('makeover', 'The two of them side by side, and whether they read as family.'),
  walk('ball', 'Three looks, one of them still in pieces on the table.'),
  walk('design', 'Construction, and whether the material is used or hidden.'),
  walk('talent-show', 'The act, and whether it has an ending.'),
  walk('lalaparuza', 'Almost nothing to walk through, which is its own note.'),
  walk('acting', 'Her lines, her character, and whether she has made a choice.'),
  walk('commercial', 'The concept, and whether anybody could follow it.'),
  walk('improv', 'Nothing written down, so the note is about her instincts.'),
  walk('photoshoot', 'The look she is shooting in, and what it does under a light.'),
  walk('choreography', 'The count, and whether she is on it yet.'),
  walk('singing', 'The vocal, sung to the host, in the werk room, unaccompanied.'),
  walk('runway-challenge', 'The looks themselves, which are the whole week.'),
  walk('generic', 'FALLBACK. A challenge this file does not know the shape of — '
    + 'so the note must not assume a garment, a script, a team or a stage.'),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP
// ══════════════════════════════════════════════════════════════════════

/**
 * Which kind of thing this challenge hands out, or null when it hands out
 * nothing.
 *
 * Read off the authored `roles` field, with the one case it does not name:
 * a draft whose `roles` is null is drafting a PERSON. `assignment: 'none'`
 * challenges return null and never reach the pick pool at all.
 */
export function pickKindFor(challengeId) {
  const c = MAXI_TYPES.find(x => x.id === challengeId);
  if (!c || c.assignment === 'none') return null;
  if (c.roles === 'characters') return 'characters';
  if (c.roles === 'parts') return 'parts';
  if (c.roles === 'slots') return 'slots';
  return 'partner';
}

/** Her lines for this kind of pick, or null — the usual fallback contract. */
export function pickLinesFor(kindId, tierId) {
  const k = PICK_VOICES.find(x => x.kind === kindId);
  const t = k && k.tiers.find(y => y.id === tierId);
  return t && t.lines.length ? t.lines : null;
}

/** The host's note for this family, or null. */
export function walkthroughLinesFor(family) {
  const w = WALKTHROUGH_VOICES.find(x => x.family === family)
    || WALKTHROUGH_VOICES.find(x => x.family === 'generic');
  return w && w.lines.length ? w.lines : null;
}

/** Every tier still short of its variant count. */
export function unwrittenMaxiVoices() {
  const out = [];
  for (const k of PICK_VOICES) {
    for (const t of k.tiers) {
      const need = MAXI_VARIANTS[t.id] || 4;
      if (t.lines.length < need) out.push(`pick:${k.kind}/${t.id} (${t.lines.length}/${need})`);
    }
  }
  const need = MAXI_VARIANTS.walkthrough;
  for (const w of WALKTHROUGH_VOICES) {
    if (w.lines.length < need) out.push(`walkthrough:${w.family} (${w.lines.length}/${need})`);
  }
  return out;
}

/** How many tiers exist, for the progress report. */
export function maxiVoiceTierCount() {
  return PICK_VOICES.reduce((n, k) => n + k.tiers.length, 0) + WALKTHROUGH_VOICES.length;
}
