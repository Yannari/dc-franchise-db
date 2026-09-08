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
    tier('praise', 'The work was the best thing on that stage and {j} says so plainly.', [
      "{j} leans into the mic and says what the room already knows: {a} understood the assignment better than anybody else tonight.",
      "\"That is what I come here to see,\" {j} tells {a}, and you can hear the relief of a judge who finally got a performance worth praising.",
      "{j} points at {a} and tells her she found {o} in the middle of a challenge that ate most of the cast alive, and she made it look easy.",
      "The critique is short because {j} does not need many words: {a} did the work, the work was excellent, and {o} was the cherry on top.",
      "{j} says {a} gave them exactly what they were looking for — commitment, clarity, and a performance the room will not forget by next week.",
      "\"You came out here and you DID something,\" {j} says, and the emphasis on the verb is the whole review — because half the cast tonight did not.",
    ]),
    tier('fault', 'She did not do the challenge, and no amount of the rest covers it.', [
      "{j} looks at {a} and says she does not know what happened up there, because whatever it was, it was not the challenge they were given.",
      "\"I was confused,\" {j} says flatly. \"I did not know what you were doing, and I do not think you knew either.\" {a} has nothing to answer with.",
      "{j} tells {a} that a beautiful queen standing in a beautiful garment cannot rescue a performance that never arrived, and {p} made it worse.",
      "The critique lands like a verdict: {j} says {a} was lost from the first beat, and the look could not carry a challenge this empty.",
      "{j} shakes her head and tells {a} she has seen what {a} can do, and tonight was not it — the character was hollow, the commitment absent, and {p} was all she could see.",
      "\"You gave us nothing to judge,\" {j} says, and the nothing is the point — {a} was physically present and creatively elsewhere.",
    ])),
  dim('runway',
    'THE GARMENT. Construction, proportion, the idea, and whether it survived '
    + 'contact with a body. A judge arriving here can be entirely uninterested '
    + 'in how funny she was.',
    tier('praise', 'The look is the best thing that walked and {j} takes it apart to say why.', [
      "{j} studies the garment from hem to neckline and tells {a} that this is the look of the night — proportion, idea, finish, all of it working.",
      "\"I cannot stop staring at you,\" {j} says, and then walks {a} through every detail that makes the garment sing — the line, the fabric, the movement.",
      "{j} points out that {a} found {o} on a runway where most queens brought costumes, and the difference between the two has never been clearer.",
      "The critique is a love letter to the construction: {j} tells {a} that every seam is intentional, every choice is earned, and the garment stands on its own.",
      "{j} says the look told a story before {a} opened her mouth, and a runway that speaks for itself is what {o} looks like in practice.",
      "\"This is what fashion looks like on this stage,\" {j} tells {a}, and the sentence is so plain it functions as the highest compliment available.",
    ]),
    tier('fault', 'The garment does not hold up, and a good night does not fix a bad seam.', [
      "{j} tells {a} the garment fell apart the moment she moved, and {p} is not something this panel can overlook no matter how charming the queen inside it is.",
      "\"I wanted to love this,\" {j} says, \"but I cannot get past the construction.\" {a} nods because she already knew — the garment betrayed her the second she hit the light.",
      "{j} says {a} had an idea and then ran out of skill before the idea was finished, and {p} turned a concept into a costume.",
      "The critique is specific and it stings: {j} names the hem, the closure, the weight of the fabric, and tells {a} that a look this ambitious needed hands that matched the ambition.",
      "{j} looks at {a} and says the runway saved nobody tonight, and a queen who walked a garment this unfinished was asking the panel to look the other way.",
      "\"Baby, I love you, but I do not love that garment,\" {j} says, and {a} takes it because {p} is sitting right there on the stage and everybody saw it.",
    ])),
  dim('risk',
    'THE NERVE. Whether she tried something that could have failed. A judge '
    + 'arriving here would rather see an ambitious mess than a safe success.',
    tier('praise', 'She went for something, and {j} rewards the going more than the result.', [
      "{j} tells {a} that what she attempted tonight could have been a disaster, and the fact that it was not is a credit to the nerve it took to try.",
      "\"You scared me,\" {j} says, smiling. \"I thought you were going to eat it. And then you did not, and now I am standing here praising the audacity.\"",
      "{j} says {a} brought {o} to the stage tonight — the willingness to fail publicly, which is the only road to something the panel has not seen before.",
      "The critique is an endorsement of risk: {j} tells {a} that a safe version of tonight would have landed her in the middle, and the gamble put her at the top.",
      "{j} looks at {a} and says the thing every queen needs to hear once — that the mess was worth it, that the ambition read louder than the stumble, and that {o} is rarer than perfection.",
      "\"Other queens played it smart tonight and I have already forgotten them,\" {j} tells {a}. \"I will not forget you. That is what nerve buys.\"",
    ]),
    tier('fault', 'She played it safe, and safe is what {j} came here to warn her about.', [
      "{j} tells {a} she was good tonight — competent, polished, perfectly fine — and asks her whether perfectly fine is really what she travelled here to deliver.",
      "\"I have seen this from you before,\" {j} says. \"And I liked it before. But I cannot keep rewarding the same safe choice every week, and {p} is starting to show.\"",
      "{j} says {a} made every correct decision and not a single interesting one, and the panel can tell the difference between a queen who is coasting and a queen who is competing.",
      "The critique is gentle but the message is not: {j} tells {a} she needs to take a risk soon, because {p} is what happens when talent hides behind reliability.",
      "{j} leans forward and asks {a} what she is afraid of, because the queen standing on that stage tonight was managing her position instead of fighting for it.",
      "\"You are too talented for this,\" {j} says, and the compliment is the sharpest part of the pan — because the talent is real and the cowardice is wasting it.",
    ])),
  dim('polish',
    'THE FINISH. Whether it was FINISHED — the paint, the seam, the timing, '
    + 'the thing between a professional and somebody having a go.',
    tier('praise', 'It was finished, and almost nothing on that stage tonight was.', [
      "{j} tells {a} the difference tonight was the finish — every detail was handled, every transition was clean, and {o} was present from the first moment to the last.",
      "\"Professionalism,\" {j} says, pointing at {a}. \"That is what I am looking at. A queen who treated every inch of this like it mattered.\"",
      "{j} says {a} was not the flashiest thing on that stage, but she was the most complete, and completion is what separates a competitor from a professional.",
      "The critique is about craft: {j} tells {a} that the paint was correct, the garment was pressed, the timing was exact, and that {o} held the whole package together.",
      "{j} looks at {a} and tells her that she did the work before the cameras turned on, and the preparation showed in every beat of the performance.",
      "\"Some queens brought a moment. You brought a SHOW,\" {j} tells {a}, and the distinction is that a show has been rehearsed, refined, and finished.",
    ]),
    tier('fault', 'It is unfinished, and she knew it was unfinished when she walked out.', [
      "{j} asks {a} whether she ran out of time or ran out of effort, because the result is a concept that never became a finished product, and {p} is all over it.",
      "\"Close is not the same as done,\" {j} tells {a}. \"And tonight you were close, and the gap between close and done is where {p} lives.\"",
      "{j} says {a} had every ingredient except the last ten percent, and the last ten percent is the part that turns a rehearsal into a performance.",
      "The critique is surgical: {j} names three details that were almost right and tells {a} that almost-right reads as unfinished under these lights, especially when {p} is visible.",
      "{j} tells {a} that polish is not a bonus round — it is the baseline, and a queen who walks onto this stage with seams showing and paint unblended is asking for exactly this conversation.",
      "\"You have the talent,\" {j} says. \"What you do not have is the discipline to finish what you start, and the gap is {p} staring back at me from that stage.\"",
    ])),
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
  bias('for', 'This judge has always been sold on {y}, and here is a {y} queen.', [
    "— and everybody on that panel knows {j} has a weakness for {y}, so the praise lands with a footnote the room can read.",
    "— and {j} would be the first to admit that a {y} queen walks in with a head start, because that is what taste looks like when it is honest.",
    "— and the lean is showing: {j} lights up at {y} the way some people light up at dessert, and {a} is serving exactly that.",
    "— and the bias is public knowledge by now: {j} loves {y}, {a} brought {y}, and the score reflects the match.",
  ]),
  bias('against', 'This judge has never been sold on {y}, and everybody in the '
    + 'room including {a} knows it before {j} opens her mouth.', [
    "— and the room felt {j} sharpen the moment {a} walked, because a {y} queen has always had to work harder under this particular gaze.",
    "— and the impatience is not personal, it is taste: {j} has never been sold on {y}, and a queen bringing {y} to this stage knows the hill is steeper.",
    "— and {a} knew before the critique started that {j} and {y} have never seen eye to eye, so every note tonight carries a grain of salt the room can taste.",
    "— and the lean is as familiar as the judge: {j} arrives at {y} already unconvinced, and {a} needed to be twice as good to land at the same score.",
  ]),
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
