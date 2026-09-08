// ══════════════════════════════════════════════════════════════════════
// dr/data/critique-voices.js — the critique, made of what actually happened
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The critiques were three paragraphs keyed on nothing but `tone`, so the
// same sentence covered a collapsed Snatch Game and a hemline:
//
//   "Michelle Visage looks at Bowie for a long time before speaking, and the
//    pause is its own critique."
//
// It is good prose about nothing. It names no fault, no look, no moment and
// no reason, and it would print unchanged over any queen on any night of any
// season. And the engine knew better the whole time: `critiqueLines` computes
// which term actually moved that judge on that queen and hands it to the
// screen as two tags — `challenge · runway` — sitting above prose that never
// mentions either of them. The judges' authored `petPeeve` and `softSpot`
// were read by nothing at all.
//
// ── WHAT THE ENGINE NOW HANDS YOU ─────────────────────────────────────
//
// Every critique carries a `reason`, measured rather than rolled:
//
//   dimension  challenge | runway | risk | polish — the term that moved THIS
//              judge most on THIS queen, which is her taste weight times the
//              queen's real number. Law arrives at the runway and Ross at the
//              challenge because that is what each of them is actually
//              weighing, so the voice comes out of the selection.
//   direction  praise | fault
//   standing   where she really placed on that dimension tonight, out of the
//              queens still on stage. "Best look of the night" and "third
//              best look" are different critiques and this is the difference.
//   styleLean  what this judge has authored for or against her kind of drag.
//   peeve      the judge's own words for what she cannot forgive.
//   softSpot   and for what she forgives everything else for.
//
// ── THE POOLS ─────────────────────────────────────────────────────────
//
//   CRITIQUE_REASONS  4 dimensions × 2 directions.  What she did, and how it
//                     is being weighed.
//   CRITIQUE_BIAS     2 directions.  When this judge's taste for her kind of
//                     drag is itself the reason, and everybody can tell.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THE REGISTER IS THE MAIN STAGE: performance and verdict. She is standing
// there, the cameras are on her, and the judge is talking TO her rather than
// about her. Tighter and more declarative than the werk room. Judges are
// witty and land a real judgement; a queen receiving one knows she is on
// camera.
//
// Placeholders:
//   {a}  the queen.
//   {j}  the judge speaking.
//   {p}  this judge's pet peeve, in her own words — "a hidden waist", "being
//        off the count", "a cheap fabric under a good idea". USE IT IN THE
//        FAULT TIERS: it is the whole reason a fault sounds like Michelle
//        rather than like a narrator.
//   {o}  her soft spot — "a live vocal", "proportion", "a clean eight".
//        The praise tiers' equivalent.
//   {y}  the queen's drag style, e.g. camp, fashion, pageant. BIAS POOL ONLY.
//
// {p} AND {o} ARE PHRASES, NOT SENTENCES. They drop in as objects: "and {j}
// has never once forgiven {p}" works, "{j} says {p}" does not.
//
// SAY WHERE SHE PLACED WHEN IT IS WORTH SAYING. The engine hands you her real
// standing on that dimension and the prose should use it — the best look of
// the night is a different critique from a look that was fourth of six, and a
// pan that could be about anybody is the thing this file replaces.
//
// Same rules as every other pool, all enforced by tests: no real people
// beyond the panel, this show's vocabulary only, never quote a stat by
// number, four variants minimum, prose rather than captions.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The four things a judge can be weighing. `taste` in js/dr/data/judges.js. */
export const DIMENSIONS = ['challenge', 'runway', 'risk', 'polish'];
export const DIRECTIONS = ['praise', 'fault'];

/** Six, because a critiqued queen draws one every week for a whole season. */
export const CRITIQUE_VARIANTS = 6;

const tiersFrom = (ids, args) => {
  const out = [];
  let i = 0;
  for (const id of ids) {
    const v = args[i];
    if (v && typeof v === 'object' && !Array.isArray(v)) { out.push(v); i += 1; continue; }
    if (Array.isArray(args[i + 1])) { out.push(tier(id, v, args[i + 1])); i += 2; continue; }
    out.push(tier(id, v));
    i += 1;
  }
  return out;
};

// ══════════════════════════════════════════════════════════════════════
// POOL 1 — THE REASON. What she did, weighed by somebody in particular.
// ══════════════════════════════════════════════════════════════════════

const dim = (id, note, ...rest) => ({
  dimension: id, note, tiers: tiersFrom(DIRECTIONS, rest.flat()),
});

export const CRITIQUE_REASONS = [
  dim('challenge',
    'WHAT SHE DID IN THE CHALLENGE — the performance, the character, the joke, '
    + 'the verse. A judge arriving here is unmoved by a beautiful queen who did '
    + 'nothing and will forgive a rough look for a night that worked.',
    'The work was the best thing on that stage and {j} says so plainly.',
    'She did not do the challenge, and no amount of the rest covers it.'),
  dim('runway',
    'THE GARMENT. Construction, proportion, the idea, and whether it survived '
    + 'contact with a body. A judge arriving here can be entirely uninterested '
    + 'in how funny she was.',
    'The look is the best thing that walked and {j} takes it apart to say why.',
    'The garment does not hold up, and a good night does not fix a bad seam.'),
  dim('risk',
    'THE NERVE. Whether she tried something that could have failed. A judge '
    + 'arriving here would rather see an ambitious mess than a safe success.',
    'She went for something, and {j} rewards the going more than the result.',
    'She played it safe, and safe is what {j} came here to warn her about.'),
  dim('polish',
    'THE FINISH. Whether it was FINISHED — the paint, the seam, the timing, '
    + 'the thing between a professional and somebody having a go.',
    'It was finished, and almost nothing on that stage tonight was.',
    'It is unfinished, and she knew it was unfinished when she walked out.'),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 2 — WHEN THE JUDGE IS THE REASON
// ══════════════════════════════════════════════════════════════════════
//
// `styleBias` is authored on every judge and is a real lean: Law is worth a
// fifth of a point against a camp queen before she has walked, and Michelle
// leans toward a pageant one. Small numbers, deliberately — a bias tilts a
// night, never decides it — but when it is the largest thing in a critique it
// is worth saying out loud, because the room can tell.
//
// This fires as a SHORT SECOND CLAUSE after the reason, so write it as an
// aside rather than a verdict. It lands after a line it has not seen, so it
// may not restate what the fault was — only that this judge and this kind of
// drag have never got on, or have always got on.
//
// {y} is her style. Do not make the judge sound unfair: she is not being
// unjust, she has a taste, everybody knows what it is, and she would be the
// first to say so.

const bias = (id, note, lines = []) => ({ id, note, lines: lines.slice() });

export const CRITIQUE_BIAS = [
  bias('for', 'This judge has always been sold on {y}, and here is a {y} queen.'),
  bias('against', 'This judge has never been sold on {y}, and everybody in the '
    + 'room including {a} knows it before {j} opens her mouth.'),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP
// ══════════════════════════════════════════════════════════════════════

/** How strong a style lean has to be before it is worth naming out loud. */
export const BIAS_SPEAKS = 0.3;

/** The reason lines for this dimension and direction, or null. */
export function reasonLinesFor(dimension, direction) {
  const d = CRITIQUE_REASONS.find(x => x.dimension === dimension);
  const t = d && d.tiers.find(y => y.id === direction);
  return t && t.lines.length ? t.lines : null;
}

/**
 * The bias clause, or null.
 *
 * Null on a lean too small to mention, which is most of them — a bias is a
 * tilt and saying it out loud every week would turn every judge into a single
 * joke about one kind of drag.
 */
export function biasLinesFor(styleLean) {
  const n = Number(styleLean) || 0;
  if (Math.abs(n) < BIAS_SPEAKS) return null;
  const b = CRITIQUE_BIAS.find(x => x.id === (n > 0 ? 'for' : 'against'));
  return b && b.lines.length ? b.lines : null;
}

/** Every tier still short of its variant count. */
export function unwrittenCritiqueVoices() {
  const out = [];
  for (const d of CRITIQUE_REASONS) {
    for (const t of d.tiers) {
      if (t.lines.length < CRITIQUE_VARIANTS) {
        out.push(`reason:${d.dimension}/${t.id} (${t.lines.length}/${CRITIQUE_VARIANTS})`);
      }
    }
  }
  for (const b of CRITIQUE_BIAS) {
    if (b.lines.length < 4) out.push(`bias:${b.id} (${b.lines.length}/4)`);
  }
  return out;
}

/** How many tiers exist, for the progress report. */
export function critiqueVoiceTierCount() {
  return CRITIQUE_REASONS.reduce((n, d) => n + d.tiers.length, 0) + CRITIQUE_BIAS.length;
}
