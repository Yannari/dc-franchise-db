// ══════════════════════════════════════════════════════════════════════
// dr/data/confessional-lines.js — the piece to camera
// ══════════════════════════════════════════════════════════════════════
//
// A confessional is not a scene in the room. It is one queen, alone, telling
// the camera what she thought of something that just happened in front of
// her — and it is the only place in this show where somebody says the true
// version out loud.
//
// ── IT REACTS. THAT IS THE WHOLE DESIGN ──────────────────────────────
//
// Every line here follows another scene and is about it. `{a}` is the queen
// talking; `{b}` is the other queen in the scene she is talking about. A line
// that would read the same with no scene in front of it is not a confessional,
// it is a thought, and this show already has somewhere to put thoughts.
//
// ── THE TWO AXES, AND ONLY TWO ───────────────────────────────────────
//
// STANCE   did she do it, was it done to her, or did she watch it happen
// HEAT     did the scene bring them together or push them apart
//
// Six tiers from that, plus `alone` for a confessional following a scene with
// nobody else in it. Archetype is DELIBERATELY not an axis: it decides who
// gets picked to speak (js/dr/confessional.js), never which pool she speaks
// from. A third axis would quadruple the writing and halve how often any one
// line is seen, which is how the drag voice pools got thin the first time.
//
// ── WHAT A CONFESSIONAL MAY AND MAY NOT DO ───────────────────────────
//
// It moves her EDIT and never a bond. She is alone with a camera and nobody
// in the room heard it, so a confessional that changed how two queens felt
// about each other would be a relationship the queens themselves cannot
// account for. `sign` on the tier says which way the edit goes: a generous
// read plays well, a shady one is better television and worse for her.
//
// ── UNWRITTEN, ALL OF IT ─────────────────────────────────────────────
//
// Every pool below is empty on purpose. An empty tier emits NO SCENE (see
// js/dr/confessional.js), so the feature is inert rather than broken until
// somebody fills it — which is the same contract the stage and challenge
// beats use. docs/PROSE-PROMPT-dr-confessionals.md is the brief.

/** A tier of lines: what it is for, which way the edit moves, then the lines. */
const tier = (id, note, sign, lines = []) => ({ id, note, sign, lines });

export const CONFESSIONAL_TIERS = [
  tier('did-warm', 'She did the generous thing and is watching herself do it.', +1, []),
  tier('did-cold', 'She was the one who caused it, and the camera is the only '
    + 'place she will admit what she was doing.', -1, []),
  tier('taken-warm', 'Somebody was good to her and she did not expect it.', +1, []),
  tier('taken-cold', 'It was done to her. She smiled in the room. She is not '
    + 'smiling here.', -1, []),
  tier('watched-warm', 'She watched two of them get closer and has a view about '
    + 'what that costs her.', +1, []),
  tier('watched-cold', 'She watched it go wrong from across the room and enjoyed '
    + 'it more than she should have.', -1, []),
  tier('alone', 'The scene had nobody else in it. She is talking about her own '
    + 'week, prompted by what she just did.', -1, []),
];

export const CONFESSIONAL_IDS = CONFESSIONAL_TIERS.map(t => t.id);

export function confessionalTier(id) {
  return CONFESSIONAL_TIERS.find(t => t.id === id) || null;
}

/** Which pools are still empty — the backlog, reported rather than hidden. */
export function unwrittenConfessionalTiers() {
  return CONFESSIONAL_TIERS.filter(t => !t.lines.length).map(t => t.id);
}

/**
 * A tier with fewer than four variants repeats inside a single season, which
 * is the actual bug — four is the floor everywhere in this show's prose.
 */
export function thinConfessionalTiers() {
  return CONFESSIONAL_TIERS.filter(t => t.lines.length && t.lines.length < 4)
    .map(t => `${t.id} (${t.lines.length})`);
}
