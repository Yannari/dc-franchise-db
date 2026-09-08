// ══════════════════════════════════════════════════════════════════════
// dr/data/mini-voices.js — the mini challenge, in its own words
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// Third time the same bug, found the same way. This is a Werk Room Dance-Off
// — eight counts, no warning, everybody watching — and the thirteen lines
// that printed under it were about being "funny enough", getting "a laugh",
// "the timing of a person who has done this exact thing in a bar". Nobody is
// telling a joke. It is a dance-off. Those sentences were written for a
// reading challenge and they print, word for word, under a photoshoot, a quiz
// and a wig swap, because `mini-attempt` had three tiers keyed on how well she
// did and no idea what she was doing.
//
// And the same dump had two queens given the SAME LINE verbatim — Nichelle
// and Caleb, "the energy of somebody who has decided that caring too much is
// worse than caring too little", eight rows apart. That is the second half of
// the problem and it is arithmetic: this beat fires ONCE PER QUEEN, thirteen
// times, and the middle tier takes about forty per cent of them. Four variants
// cannot cover five queens. See the variant counts below — they are higher
// here than anywhere else in the show and that is why.
//
// ── WHAT THE MINI ACTUALLY KNOWS, AND NEVER SAID ──────────────────────
//
// A mini is not one thing. js/dr/data/minis.js gives every one of them an
// `interaction`, and it is the most under-used field in the show:
//
//   solo     she performs for the room. A dance-off, a photoshoot, a quick drag.
//   targets  she does a bit ABOUT another queen, TO HER FACE — and the engine
//            has recorded which queen since the day it was written. Three of
//            the seven minis work this way and no line has ever named the
//            person she went after.
//   pairs    the room splits and her result depends partly on what her partner
//            did for her.
//
// So a `targets` mini's prose gets `{b}` and must use it. "She reads the room"
// is not what happens in a reading challenge; she reads ONE QUEEN, who is
// standing there, and the two of them still have to work together tomorrow.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THIRD PERSON. This is the werk room with a camera in it, and the register is
// already set by the rest of the werk room: intimate, funny, quick. A mini is
// the light relief before the maxi and it should read that way — but it is
// also the first time the room finds out what somebody can do.
//
// Placeholders:
//   {a}  the queen performing. Available in every attempt and win tier.
//   {b}  WHO SHE WENT AFTER, or her partner. Legal ONLY in a mini whose
//        `cast` below is 'targets' or 'pairs', and in those it should be used
//        in most lines — it is the whole point. Rejected everywhere else.
//   {c}  the mini, by name, e.g. Werk Room Dance-Off.
//
// SAY WHAT SHE IS PHYSICALLY DOING. That is the instruction. A `nailed` on a
// dance-off is eight counts of something the room did not know she had; on a
// photoshoot it is one frame with a bucket of water hitting her and her face
// still right; on a reading challenge it is one sentence about {b} that takes
// the whole room out. A line that would print under any of the seven is a line
// that has not been written yet.
//
// Same rules as every other pool, all enforced by tests: no real people, this
// show's vocabulary only, never quote a stat by number, prose rather than
// captions.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The three cuts, best to worst. These are `MINI_TIERS` in js/dr/stage.js. */
export const MINI_TIER_IDS = ['nailed', 'decent', 'flat'];

/**
 * HOW MANY VARIANTS EACH TIER NEEDS, and it is not four.
 *
 * `mini-attempt` fires once per living queen — thirteen times in a premiere —
 * and the tiers split the field roughly 30 / 40 / 30. So the middle tier is
 * asked for five distinct lines in a single episode and the outer two for four
 * each, and a four-variant pool is guaranteed to repeat. It did: the dump that
 * built this file printed one line twice in the same mini.
 *
 * The draw is without replacement within an episode, so hitting these numbers
 * removes the repeat entirely rather than making it less likely.
 */
export const MINI_VARIANTS = { announce: 4, nailed: 6, decent: 8, flat: 6, win: 4 };

/**
 * One mini's whole voice.
 *
 * `cast` mirrors `interaction` in js/dr/data/minis.js and decides whether {b}
 * is legal. It is restated here rather than imported so the writer can see it
 * next to the lines, and a test checks the two files agree.
 */
const mini = (id, name, cast, note, tiers) => ({ id, name, cast, note, tiers });

const T = (announce, nailed, decent, flat, win) => [
  tier('announce', announce), tier('nailed', nailed),
  tier('decent', decent), tier('flat', flat), tier('win', win),
];

export const MINI_VOICES = [
  mini('reading', 'Reading Is Fundamental', 'targets',
    'THE LIBRARY. She stands up and takes one queen apart — {b} — to her face, '
    + 'in front of everybody, and it has to be funny rather than cruel. The '
    + 'oldest ritual in the room. A read that lands is a friendship that '
    + 'survives it; a read that misses is a grudge.',
    T('The library opens and the host explains the only rule: make it funny.',
      'One sentence about {b} and the room is gone. Nobody recovers for a minute.',
      'A decent read. {b} laughs, which is the correct answer either way.',
      'It comes out mean instead of funny, or it does not come out at all.',
      'She had the sharpest tongue in the room and everybody now knows it.')),
  mini('puppets', 'Puppet Parody', 'targets',
    'She is handed a puppet of {b} and has to BE her — the voice, the walk, the '
    + 'thing {b} says twenty times a day and does not know she says. Played to '
    + '{b}\'s face while {b} watches.',
    T('Everybody gets a puppet of somebody else and has to play her.',
      'The impression is so exact that {b} puts her hands over her face.',
      'She finds one thing {b} does and does it, and one thing is enough.',
      'The puppet is a voice she cannot do about a person she has not watched.',
      'She saw {b} more clearly than {b} sees herself, and made it funny.')),
  mini('quick-drag', 'Quick Drag', 'solo',
    'A full look, face and all, against a clock that is far too short. Not a '
    + 'performance — a race, in silence, with everybody visibly panicking at '
    + 'their own station.',
    T('A full look, start to finish, on a clock nobody thinks is fair.',
      'Finished, painted and standing there before the clock stops.',
      'She gets there. Something is unfinished and she is standing in front of it.',
      'Time runs out on a half-built look and she has to present it anyway.',
      'She built a whole look in the time everybody else needed for a face.')),
  mini('photoshoot', 'Photoshoot Mini', 'solo',
    'One frame each, with something going wrong IN SHOT on every take — water, '
    + 'wind, something thrown. The face has to stay right while it happens.',
    T('One frame each, and something goes wrong in every single one of them.',
      'It hits her mid-frame and the face does not move. That is the shot.',
      'She gets a usable frame out of it, eventually, and knows which one.',
      'She flinches, and the camera has already taken the picture.',
      'She has been photographed her whole life and it shows in one frame.')),
  mini('dance-off', 'Werk Room Dance-Off', 'solo',
    'THE MINI THIS FILE WAS BUILT FOR. The music starts with NO WARNING and '
    + 'she has eight counts. No costume, no concept, no preparation — a body, a '
    + 'floor, and a room standing in a circle. Nothing here is about being '
    + 'funny; the old prose thought it was.',
    T('The music starts with no warning and everybody has eight counts.',
      'Eight counts of something the room did not know she had.',
      'She moves well and commits and the circle makes noise for her.',
      'She does not dance, and eight counts is a long time to not dance for.',
      'She took the floor cold and the room has not stopped talking about it.')),
  mini('quiz', 'Herstory Quiz', 'targets',
    'A quiz about the queens themselves, scored on how funny the WRONG answers '
    + 'are. The questions are about {b}, and getting it right is worth less '
    + 'than getting it wrong beautifully.',
    T('A quiz about each other, scored on the wrong answers.',
      'A wrong answer about {b} so good the right one would have been a waste.',
      'She plays along and gets a laugh out of not knowing.',
      'She answers correctly and flatly, which is the only way to lose this.',
      'She understood that the quiz was not a quiz.')),
  mini('wig-swap', 'Wig Swap', 'pairs',
    'She styles {b}\'s wig and then has to WEAR the one {b} did for her. Two '
    + 'jobs, and the second one is out of her hands entirely — she is judged '
    + 'in something somebody else made.',
    T('Everybody styles somebody else\'s wig, and wears the one done for them.',
      'What she built for {b} is better than anything {b} owns.',
      'A serviceable wig, and she wears what {b} gave her without complaint.',
      'She was given something unwearable, or she made one, or both.',
      'She did right by {b} and got away with what {b} did to her.')),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP — how stage.js turns a mini into a voice
// ══════════════════════════════════════════════════════════════════════

export function miniVoice(id) {
  return MINI_VOICES.find(m => m.id === id) || null;
}

/**
 * A mini's lines for one tier, or null.
 *
 * Null rather than a fallback line, for the same reason every other voice pool
 * in this show hands back null: the file ships empty and is filled one mini at
 * a time, and an unwritten mini keeps the generic beat in challenge-beats.js
 * exactly as it reads today rather than printing a blank.
 *
 * The variant floor is NOT enforced here. A tier with two lines written is
 * used, because two specific lines beat four generic ones — the guard is what
 * insists on the full count before it ships.
 */
export function miniLinesFor(id, tierId) {
  const m = miniVoice(id);
  const t = m && m.tiers.find(x => x.id === tierId);
  return t && t.lines.length ? t.lines : null;
}

/** Whether this mini's prose is allowed to name a second queen. */
export function miniNamesOther(id) {
  const m = miniVoice(id);
  return !!m && (m.cast === 'targets' || m.cast === 'pairs');
}

/** Every (mini, tier) pair still short of its variant count. */
export function unwrittenMiniVoices() {
  const out = [];
  for (const m of MINI_VOICES) {
    for (const t of m.tiers) {
      const need = MINI_VARIANTS[t.id] || 4;
      if (t.lines.length < need) out.push(`${m.id}/${t.id} (${t.lines.length}/${need})`);
    }
  }
  return out;
}

/** How many tiers exist, for the progress report. */
export function miniVoiceTierCount() {
  return MINI_VOICES.reduce((n, m) => n + m.tiers.length, 0);
}
