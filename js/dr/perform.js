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

/* How much a queen's runway varies from week to week.
   NAMED BECAUSE IT WAS SWEPT, and left where it was because it is not the
   lever it looks like. `craft` here is `d.runway`, a season constant, so the
   same queen tops the runway 43% of weeks — but widening this to 2.5, 3.5 and
   even 4.5 moved the top queen's share of maxi wins only 53% to 49%. The
   concentration is not in any one term; it is three correlated season
   constants (runway craft, polish, style bias) summing in the panel's view.
   See tests/dr-spec-audit.test.js, measurement 2. */
export const RUNWAY_FORM = 1.5;

/* The same idea for finish. Slightly under the runway's, because a queen who
   can sew is a bit more reliable week to week than a queen who can style — the
   work is done before she walks rather than in front of the panel. */
export const POLISH_FORM = 1.4;

/* How differently a queen can land from one week to the next, in the panel's
   eyes — the shared half of it. Tuned by measurement, not taste: see
   tools/dr-domination.mjs. Too small and the board is a ranking of stats; too
   large and craft stops mattering and every week is a coin toss. */
export const PANEL_FORM = 1.5;

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

/* ── HOW BIG SHE WENT TONIGHT, IN ONE PLACE ────────────────────────────
   The panel scores this: `judgeViews` weights `risk * 10` at up to 0.30, so
   its shape decides seasons.

   IT WAS `boldness / 10` — WRITTEN OUT NINE TIMES, once in every challenge
   module — and that is a season constant with no variance whatsoever. A queen
   with boldness 3 handed the panel 3.0 on this axis and a queen with boldness
   10 handed them 10.0, the same two numbers every single week of every single
   season. Measured: two queens in a 13-queen cast never won a maxi across 120
   seasons, and this is one of the two terms that made that possible.
   CLAUDE.md forbids exactly this — "never guarantee results from stats alone,
   upsets must happen regularly" — and a constant is a guarantee.

   Boldness now raises the ODDS of going big rather than fixing the size of it.
   The means still separate clearly (0.29 for boldness 3 against 0.60 for
   boldness 10, so a bold queen still reads as a risk-taker and still scores
   better on average), and the ranges now cross, so a cautious queen can have
   the biggest night on that stage and sometimes does.

   NOT USED BY EVERY MODULE ON PURPOSE. A Rusical's live vocal and a
   LaLaPaRuZa's song are risks the NIGHT carries rather than risks her
   personality chose, so those modules set their own value and should keep
   doing it. This is the rule for "how big did this queen go", not for "how
   exposed was this format". */
export function riskFor(player, rng = Math.random) {
  const b = Number(player?.stats?.boldness);
  const bold = (Number.isFinite(b) ? b : 5) / 10;
  return Math.max(0.05, Math.min(1, 0.15 + bold * 0.45 + noise(rng, 0.28)));
}

/* ── HER TECHNICAL FINISH, WHICH THE PANEL WEIGHS ──────────────────────
   `judgeViews` weights polish at up to 0.20, and `js/dr/week.js` handed it
   HER RAW `mental` STAT. Two problems, and they compound.

   It had ZERO week-to-week variance. Every other input to the panel moves:
   the performance swings, the runway carries RUNWAY_FORM, each judge adds
   their own noise. Polish was the one term that was the same number in
   episode one and episode ten of every season a queen ever played, which
   made it the most reliable thing on the board — an eight-point spread
   between mental 10 and mental 2, banked before anybody performed.

   And it was not craft. This is a show scored on what she can DO, and the
   single most dependable term in the panel's arithmetic was a stat with no
   drag in it at all. A queen with a good head and no hands out-polished a
   seamstress, permanently.

   Finish is now mostly her hands and partly her head, and it has form like
   everything else. The scale is unchanged (1..10), so critiques and the
   judges' own weights read exactly as before. */
export function polishFor(player, rng = Math.random) {
  const d = dragOf(player);
  const m = Number(player?.stats?.mental);
  const mental = Number.isFinite(m) ? m : 5;
  /* MOSTLY HER HEAD, AND DELIBERATELY SO — measured, after trying it the
     other way twice.

     Making polish craft-derived is the obvious move on a craft show and it
     is wrong here, because `perf` and `runway` ALREADY read her craft and
     the panel weights those at up to 0.55 each. A craft-based polish is a
     third helping of the same number: top-three share went 61.9% -> 70.8%
     with design+runway, and 71.7% with design alone. Craft correlates with
     itself, so every craft term stacks.

     Mental is ORTHOGONAL to craft, and that is the point of it. It is the
     lane a queen with ordinary hands and a good head can win in, and taking
     it away flattens the cast into one axis.

     So the axis stays and the two things actually wrong with it are fixed:
     the spread is compressed (an eight-point gap banked before anybody
     performed is now about five) and it has form like every other term, so
     mental 2 on a good night can out-finish mental 10 on a bad one. A small
     design term keeps it honest about being a craft show without letting
     craft count a third time. */
  return Math.max(1, Math.min(10,
    5 + (mental - 5) * 0.55 + (d.design - 5) * 0.15 + noise(rng, POLISH_FORM)));
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

  /* ── HOW BIG SHE WENT TONIGHT ──
     Not a score: a screen reads it to say whether the night was a gamble,
     and the lip sync reads the same idea separately. But the panel DOES
     score it — `judgeViews` weights `risk * 10` at up to 0.30 — so its
     shape decides seasons.

     IT USED TO BE `bold * (0.5 + rng() * 0.5)`, WHICH NEVER OVERLAPPED.
     Boldness 10 drew from [0.50, 1.00] and boldness 3 from [0.15, 0.30]:
     the timid queen's biggest night of her life scored below the bold
     queen's smallest, every week, forever. That is a guarantee from a stat,
     which CLAUDE.md forbids in as many words — upsets must happen.

     Boldness now raises the ODDS of going big rather than setting a floor
     under it. The means still separate (0.29 against 0.60, so a bold queen
     still reads as a risk-taker and still scores better on average), and
     the ranges now cross, so a cautious queen can have the biggest night on
     the stage and occasionally does. */
  const risk = riskFor(player, rng);

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

  // ── WHY FIT IS WORTH LESS THAN THE CRAFT ───────────────────────────
  //
  // A category that suits her is a real advantage and must not be a decisive
  // one. At 0.25 the fit term swung 2.5 points, which is exactly the gap
  // between a runway 9 and a runway 5 — so which prompt the season happened to
  // draw mattered as much as whether she can do a runway at all, and the best
  // queen's crown rate fell from 22% to 12.5% when real categories landed.
  // At 0.15 a wheelhouse category is worth 1.5, comfortably less than the
  // craft gap: an edge, not a verdict.
  const score = craft * 0.7 + (fit * 10) * 0.15 + presence * 0.15 + noise(rng, RUNWAY_FORM);
  return {
    score: Math.round(score * 100) / 100,
    fit,
    parts: { craft, fit, presence, category, sewn },
  };
}
