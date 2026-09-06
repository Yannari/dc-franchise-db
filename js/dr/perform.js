// ══════════════════════════════════════════════════════════════════════
// dr/perform.js — step 1 of three: what she DID
// ══════════════════════════════════════════════════════════════════════
//
// GROUND TRUTH, and nothing in this file knows a judge exists.
//
// That is not tidiness, it is the whole design. A week is decided in three
// recorded steps — what she did, how the panel saw it, what the host did about
// it — and the screens show all three side by side so a viewer can watch them
// disagree. "She was robbed" is only a thing that can happen because these
// three numbers are allowed to differ.
//
// The moment a term like "the judges would like this" appears here, the panel
// stops being a second opinion and becomes an expensive re-ranking of these
// scores, and the show goes back to being "highest stat wins". A source guard
// in tests/dr-perform.test.js asserts this file never reaches for a judge, a
// taste, a panel, a star rating or a bend.
import { dragOf, DRAG_STYLES } from './queen.js';

/** THE noise helper for js/dr/. Symmetric, bounded, seeded. */
export function noise(rng, amt = 2.5) {
  return (rng() - 0.5) * 2 * amt;
}

/** A weighted mean over the craft stats a challenge names. */
export function blendScore(drag, blend) {
  let s = 0;
  let w = 0;
  for (const [k, v] of Object.entries(blend || {})) {
    s += (drag[k] || 5) * v;
    w += v;
  }
  return w ? s / w : 5;
}

// ── A ROLE SHIFTS PROBABILITY, IT NEVER CAPS ──────────────────────────
//
// The user's correction, and it is the right one. An earlier version had the
// Rusical lead able to win or bomb while the ensemble "could only be safe",
// which is a ceiling: it makes a small part a guaranteed mediocre score and
// takes every decision out of it.
//
// What a big part actually does is expose you. The lead is seen for longer, so
// the same queen having the same day lands further from the middle in both
// directions; the ensemble is seen less, so she lands nearer it. These are
// multipliers on the SWING, applied around a fixed centre, which means the
// expected score of a lead and an ensemble member of equal craft is the same
// and only the variance differs. A test asserts exactly that.
export const ROLE_RANGES = { lead: 1.35, featured: 1.15, standard: 1.0, ensemble: 0.75 };

/**
 * What the last two weeks did to her nerve, through temperament.
 *
 * Only the last two count: a bottom placement six weeks ago is not still in
 * her hands. Proportional in temperament, so a steady queen shrugs a bottom
 * off almost entirely and a fragile one carries it into the next challenge.
 *
 *   temperament 3 → a recent bottom costs 0.84
 *   temperament 5 → 0.60
 *   temperament 9 → 0.12
 */
export function nervesFor(record = [], temperament = 5) {
  const t = Number.isFinite(Number(temperament)) ? Number(temperament) : 5;
  let n = 0;
  for (const r of record.slice(-2)) {
    if (r === 'BTM') n += (t - 5) * 0.12 - 0.6;
    else if (r === 'WIN') n += 0.3;
  }
  return n;
}

/**
 * One queen, one maxi challenge, one performance.
 *
 *   role       shifts the swing (see ROLE_RANGES), never the ceiling
 *   prep       from the werk room — help, sabotage, the host's walkthrough
 *   chemistry  the mean bond with her team, already scaled by the caller
 *   record     her results so far, e.g. ['SAFE', 'HIGH', 'BTM']
 *
 * Returns the score and the arithmetic behind it, because a screen that shows
 * a number without showing where it came from is a screen nobody believes.
 */
export function performQueen({
  player, maxi, role = 'standard', prep = 0, chemistry = 0, record = [], rng = Math.random,
}) {
  const d = dragOf(player);
  const s = (player && player.stats) || {};
  const num = (k, dflt = 5) => (Number.isFinite(Number(s[k])) ? Number(s[k]) : dflt);

  const base = blendScore(d, maxi.blend);            // 1..10, what she can do
  const range = ROLE_RANGES[role] ?? 1.0;
  const bold = num('boldness') / 10;                 // 0.1..1

  // How big she went. Not a score: a screen reads it to say whether the night
  // was a gamble, and the lip sync reads the same idea separately.
  const risk = bold * (0.5 + rng() * 0.5);

  // Boldness widens the swing as well as the role does. A bold queen in a big
  // part is the widest thing on the stage, which is correct.
  const swing = noise(rng, (2.5 + bold * 2.0) * range);

  const nerves = nervesFor(record, s.temperament);

  // The night somebody is simply on. Rare, seeded, and recorded so the
  // aftermath can collect it — roughly one performance in twelve.
  const moment = rng() < (1 / 12);
  const momentBonus = moment ? 2.0 + bold : 0;

  // The centre is 5 and the craft is measured FROM it, so the range multiplier
  // widens the distance from the middle rather than scaling the whole score.
  // Scaling the score itself would make a big part worth free points.
  const perf = (base - 5) * range + 5 + swing + prep + chemistry + nerves + momentBonus;

  return {
    perf: Math.round(perf * 100) / 100,
    moment,
    risk,
    parts: { base, range, swing, prep, chemistry, nerves, momentBonus },
  };
}

/**
 * Does this category call for her? 1 fits, 0 clashes, 0.5 when the category
 * names no styles at all — a plain themed runway asks nothing in particular,
 * so nobody is advantaged and nobody is punished.
 */
function fitFor(style, categoryStyles = []) {
  if (!categoryStyles.length) return 0.5;
  return categoryStyles.includes(style) ? 1 : 0;
}

/**
 * One walk down the runway.
 *
 * `sewn` moves the craft from `runway` to `design`, because a look she BUILT
 * is judged on the building. That is why a design week's runway is the thing
 * she made and a Ball has three walks with only one of them sewn.
 */
export function runwayScore({
  player, category = '', sewn = false, categoryStyles = [], rng = Math.random,
}) {
  const d = dragOf(player);
  const craft = sewn ? d.design : d.runway;
  const fit = fitFor(d.style, categoryStyles);
  // The third term is presence: having a point of view at all. Every real
  // style scores it equally — it is not a ranking of styles, it is the
  // difference between a queen with an identity and one without.
  const presence = DRAG_STYLES.includes(d.style) ? 5 : 2.5;

  const score = craft * 0.6 + (fit * 10) * 0.25 + presence * 0.15 + noise(rng, 1.5);
  return {
    score: Math.round(score * 100) / 100,
    fit,
    parts: { craft, fit, presence, category, sewn },
  };
}
