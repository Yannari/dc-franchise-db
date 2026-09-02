// ══════════════════════════════════════════════════════════════════════
// tr/missions/contract.js — what a BESPOKE mission is, and what it owes
// ══════════════════════════════════════════════════════════════════════
//
// Spec §9. js/tr/missions.js models an afternoon as a stat pair, two teams and
// four tiers of prose. That was the right shape for a season's ledger and it
// is the wrong shape for a television episode: it has no phases, no per-player
// record, no host, no rules anybody could follow, and no way for one person's
// decision inside it to become tomorrow's argument. A BESPOKE mission is the
// same afternoon written out — a briefing you could act on, three or more
// phases scored on different stats, a number against every living name, and a
// pot line that adds up.
//
// WHAT THIS FILE IS AND IS NOT. It is the CONTRACT — the record shape, the
// validator, and the pot arithmetic that every bespoke mission shares with the
// seven archetypes so that adding one cannot move the season's payout
// distribution. It is NOT a base class: a mission is a plain object with an
// `id`, a `desc`, an `eligibility` and a `simulate`, and every phase of every
// mission is written by hand. There is no shared "run three phases" helper on
// purpose. The moment four missions share a scoring loop they are one mission
// with four skins, which is the defect the whole task exists to avoid.
//
// ── THE THREE RULES A BESPOKE MISSION INHERITS FROM THE ARCHETYPES ────
//
//   1. IT TAKES ITS OWN RNG STREAM. `simulate(ctx, rng)` is handed the
//      missions' hashed stream (headless.js `_missionRngFor`) and may not
//      touch `Math.random()`. A draw taken from the game's stream here
//      re-rolls every murder, ballot and banishment after it, and the
//      calibration bands would move on a content edit.
//   2. IT PAYS THROUGH THE SAME ARITHMETIC. `missionQuality()` and `payPot()`
//      below are the ONLY way a bespoke mission moves `gs.tr.pot`, and they
//      are the same blend, the same difficulty subtraction, the same pass mark
//      and the same ceiling the archetypes use. That is not tidiness: the pot
//      distribution is a calibrated band (tests/tr-missions.test.js, mean
//      under 0.62 of the ceiling), and a mission with its own private payout
//      curve would move that band from a content edit.
//   3. IT WRITES NOTHING BUT THE POT AND ITS OWN RECORD. No bonds, no beliefs,
//      no audience standing, no targeting. Those consequences are DECLARED on
//      the record (`scenes[].effects`) and applied by the layers that already
//      own them — js/tr/deduction.js for beliefs, js/tr/castle/mission-fallout.js
//      for the argument on the road home, js/tr/crowd.js for the audience.
//      A bond written from here feeds bondResistance() -> suspicion() and the
//      deduction bands would move on a content edit; the same reasoning as the
//      header of js/tr/missions.js, one layer further in.
//
//      AND THE AUDIENCE EFFECT IS `{ kind: 'crowd', name, colour, mult }`,
//      which is the shape js/tr/events.js already declares and js/tr/crowd.js
//      already applies. It is not a stylistic choice: tests/tr-audience.test.js
//      forbids any file under js/tr from so much as NAMING the two audience
//      ledgers, because reading one is ground truth reaching the castle
//      through a channel the belief gate does not watch. A mission declares
//      the moment; it never touches the ledger and never learns its name.
//
// ── THE ONE THING A BESPOKE MISSION MAY DO THAT AN ARCHETYPE MAY NOT ──
//
// It may look at alignment, and only to model a dilemma that only a Traitor
// has. That is legitimate here for the reason it is legitimate in
// `_runChess` and forbidden in a castle event: THE ENGINE MAY KNOW; THE CASTLE
// MAY NOT. What leaves a mission is a BEHAVIOURAL record — a phase result, a
// decision, a deviation — with no role anywhere on it. `validateMissionRecord`
// enforces that literally: an `alignment`, `traitor` or `faithful` key
// anywhere inside the record throws.
//
// AND A TRAITOR NEVER GETS GUARANTEED SABOTAGE. Spec §9: undermining
// coordination is a nudge to a probability, never a switch. Every dilemma
// below is a shift to a roll that the room's own competence can still beat,
// and a Faithful's ordinary mistake produces the same observable — which is
// where the false positives that make the format work come from.

import { gs, players } from '../../core.js';
import { pStats, pronouns } from '../../players.js';

// ══════════════════════════════════════════════════════════════════════
// THE POT ARITHMETIC — one copy, shared with js/tr/missions.js
// ══════════════════════════════════════════════════════════════════════
//
// These five constants were the private top of js/tr/missions.js and they are
// here now because two files need them and a constant written in two places is
// not a constant. Every number is unchanged, every comment that justified it
// moved with it, and js/tr/missions.js imports them rather than keeping a
// second copy. Nothing about a played season moves.

/**
 * The most a season's missions can ever be worth.
 *
 * A round number in the show's own currency rather than a tuned one — the
 * tuning lives in MISSION_MAX, which is what actually decides how close a
 * season gets. Read `gs.tr.potCeiling` at runtime rather than importing this
 * into gameplay code, so a future format that shortens a season can scale the
 * ceiling with it.
 */
export const POT_CEILING = 120000;

/** The most any ONE mission can add before side objectives. ~13% of the pot. */
export const MISSION_MAX = 15600;

/** What a completed side objective is worth. Deliberately small: ~1.5%. */
export const SIDE_BONUS = 1800;

/**
 * How much of a team's raw competence is burnt off before a penny is paid.
 *
 * A mission scored on stats alone pays out around 55% of maximum for an
 * average cast, every time, and a season of that lands within a rounding error
 * of the ceiling. This is the subtraction that makes a mission possible to
 * FAIL: quality is measured from here upward, so an average performance is a
 * mediocre payday and a bad one is nothing at all.
 */
export const DIFFICULTY = 0.34;

/**
 * Below this the mission pays NOTHING, and the number exists because of a
 * prose defect rather than a balance one — the `failed` narration says
 * "nothing lit, nothing earned", and without a pass mark that line printed
 * over a payment. A mission is a task: the room completes it or it does not.
 */
export const PASS_MARK = 0.15;

/**
 * Where the payday comes from: not the winners, and not an average. 0.6 on the
 * better team and 0.4 on the worse. Weighting it entirely on the winner makes
 * half the cast irrelevant to the money; weighting it evenly makes a strong
 * team pointless. The room is paid for what the room managed, and the stronger
 * half matters more.
 */
export const BEST_WEIGHT = 0.6;

/** How wide the luck is on a team's day. +/- 9 points of performance. */
export const SWING = 0.18;

/**
 * The day's luck on a BESPOKE afternoon, which is wider — and has to be.
 *
 * An archetype scores a team once, so `SWING` is the whole of its variance
 * above the stat line. A bespoke mission scores a team three times and takes
 * the mean, which divides the phase-level noise by about the square root of
 * three. Left at `SWING` the result is a distribution with no tails: measured
 * over 400 afternoons per mission, `triumph` fired 0 times on two of the four
 * and `failed` fired 0 times on two others, so a quarter of the authored
 * summary lines in those files were unreachable content — the exact defect
 * Task 1 shipped and found by dumping seasons rather than by an assertion.
 *
 * 0.30 (+/- 15 points) restores tails comparable to an archetype's: all four
 * tiers now fire on all four missions. It does NOT move the pot band, because
 * a wider symmetric swing around the same mean pays the same on average and
 * the catalogue does not reach a played season in this stage anyway.
 */
export const PHASE_SWING = 0.30;

/** Below four living players there is nobody to make two teams out of. */
export const MIN_PLAYERS = 4;

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export { clamp01 };

/**
 * The blend, the difficulty subtraction and the clamp, in one place.
 *
 * Takes the two team performances in either order. Returns 0..1, and it is the
 * SAME number `runMission` computes for an archetype, which is why a bespoke
 * mission cannot move the season's payout distribution by existing.
 */
export function missionQuality(perfA, perfB) {
  const best = Math.max(perfA, perfB);
  const worst = Math.min(perfA, perfB);
  return clamp01((BEST_WEIGHT * best + (1 - BEST_WEIGHT) * worst - DIFFICULTY) / (1 - DIFFICULTY));
}

/**
 * Which tier of prose the afternoon deserves. Narration only.
 *
 * CUT AGAINST THE MEASURED DISTRIBUTION and not against the 0..1 the number
 * happens to live on: quality over 3,491 archetype missions runs p50 0.39,
 * p90 0.50, p99 0.60, max 0.76. At these cuts the tiers fire roughly
 * 4% / 46% / 48% / 2%, so a triumph is rare enough to mean something and a
 * washout is rare enough to hurt, and both actually happen.
 */
export function missionTier(q) {
  if (q >= 0.55) return 'triumph';
  if (q >= 0.40) return 'solid';
  if (q >= PASS_MARK) return 'scraped';
  return 'failed';
}

/**
 * Pay the pot and return the accounting, in the shape the contract demands.
 *
 * Returns `{ potBefore, gross, potEarned, potAfter, tier }`. `potEarned` is
 * what the pot ACTUALLY took, which is not always what the room won: the
 * ceiling is applied here and nowhere else, so a season arriving at the last
 * mission with 4,000 of headroom banks 4,000 of a 15,000 afternoon and the
 * rest is simply gone. The ceiling is a cap on the prize, not a budget the
 * season is scheduled against.
 *
 * MUTATES `gs.tr.pot`, which is the one piece of season state a mission is
 * allowed to touch. The invariant the contract test asserts —
 * `potAfter === potBefore + potEarned` — is true by construction here, so a
 * mission that does its own pot arithmetic is the only way to break it, and
 * `validateMissionRecord` re-checks it against these three fields anyway.
 */
export function payPot(quality, bonus = 0) {
  const potBefore = (gs?.tr?.pot) || 0;
  const gross = Math.round(MISSION_MAX * (quality < PASS_MARK ? 0 : quality)) + Math.max(0, bonus);
  const ceiling = typeof gs?.tr?.potCeiling === 'number' && gs.tr.potCeiling > 0
    ? gs.tr.potCeiling : POT_CEILING;
  const potEarned = Math.max(0, Math.min(gross, ceiling - potBefore));
  if (gs?.tr) gs.tr.pot = potBefore + potEarned;
  return { potBefore, gross, potEarned, potAfter: potBefore + potEarned, tier: missionTier(quality) };
}

// ══════════════════════════════════════════════════════════════════════
// THE SHARED PRIMITIVES — draws, stats, lists. Not a scoring loop.
// ══════════════════════════════════════════════════════════════════════

/** One stat, defaulting to the middle of the scale for anybody unrostered. */
export function statOf(name, key) {
  const v = pStats(name)?.[key];
  return typeof v === 'number' && isFinite(v) ? v : 5;
}

/**
 * A stat with the day on it. THE PROJECT MINIMUM IS 2.5 (AGENTS.md) and every
 * check in every bespoke mission goes through here, so an upset is not a thing
 * a mission may forget to allow. Returns stat points, not a 0..1.
 *
 * Triangular rather than uniform — two draws averaged — because a flat ±2.5
 * makes the extremes as likely as the middle and turns every phase into a coin
 * flip. This keeps the same width and puts the mass where a performance
 * actually lives, while still reaching ±2.5 often enough to overturn a two-
 * point stat gap several times an afternoon.
 */
export function noisy(rng, name, key, m = 2.5) {
  return statOf(name, key) + ((rng() + rng()) - 1) * m;
}

/** Two stats blended 0.55/0.45, the archetypes' own weighting, with the day on it. */
export function noisyPair(rng, name, keyA, keyB, m = 2.5) {
  return 0.55 * statOf(name, keyA) + 0.45 * statOf(name, keyB) + ((rng() + rng()) - 1) * m;
}

/** A seeded shuffle. Does not mutate the input. */
export function shuffled(list, rng) {
  const order = [...list];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Two teams out of the living, shuffled, split down the middle, uneven casts one over. */
export function splitTeams(living, rng, names) {
  const order = shuffled(living, rng);
  const half = Math.ceil(order.length / 2);
  return [
    { name: names[0], members: order.slice(0, half) },
    { name: names[1], members: order.slice(half) },
  ];
}

/** English-list a handful of names without inventing an Oxford comma war. */
export function andList(list) {
  const names = [...list];
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Fill `{who}`, `{they}`, `{them}`, `{their}`, `{what}` and their capitals. */
export function render(tpl, slots = {}) {
  let out = String(tpl);
  for (const [k, v] of Object.entries(slots)) out = out.split(`{${k}}`).join(v == null ? '' : v);
  return out;
}

/** The pronoun slots for a name, in the shape `render` wants. NO `Pos` — the table has none. */
export function pronounSlots(name) {
  const pr = pronouns(name) || {};
  return {
    who: name,
    they: pr.sub, They: pr.Sub,
    them: pr.obj, Them: pr.Obj,
    their: pr.posAdj, Their: pr.PosAdj,
    theirs: pr.pos, self: pr.ref,
  };
}

// ══════════════════════════════════════════════════════════════════════
// ARCHETYPE VOICE — the same recorded fact, read three ways
// ══════════════════════════════════════════════════════════════════════
//
// A confessional is who-speaks (decided by weightedPick) times HOW-they-speak,
// and the second half was missing: every confessional in the four missions was
// one hardcoded string, so a hero and a mastermind rescued off the same sand and
// said, word for word, the same thing. That breaks the "Voice and stats" writing
// contract — the fact is fixed, the reading is not. `confessionalVoice` branches
// the text on the SPEAKER's archetype family, read the AGENTS.md way (archetype
// off `players`, never `pStats`, which is stats only), grouped into the three
// behaviour families AGENTS.md already defines. Each family gets a materially
// different take on the identical recorded fact; none of them may invent a fact
// the scene did not carry.
const ARCHETYPE_FAMILY = Object.freeze({
  // villainous — reads the moment for leverage, advantage or grievance
  villain: 'villainous', mastermind: 'villainous', schemer: 'villainous',
  // nice — reads it in terms of the team, fault owned, feeling admitted
  hero: 'nice', 'loyal-soldier': 'nice', 'social-butterfly': 'nice',
  showmancer: 'nice', underdog: 'nice', goat: 'nice',
  // neutral — reads it flatly, defensively, or escalates
  hothead: 'neutral', 'challenge-beast': 'neutral', wildcard: 'neutral',
  'chaos-agent': 'neutral', floater: 'neutral', 'perceptive-player': 'neutral',
});

/** A player's archetype, the AGENTS.md way: off `players`, NOT `pStats`. */
export function archetypeOf(name) {
  return players.find(p => p && p.name === name)?.archetype || null;
}

/**
 * The behaviour family of a speaker's archetype: 'villainous' | 'nice' |
 * 'neutral'. Anything unmapped (or nameless) falls to 'neutral', the flat read.
 */
export function archetypeFamily(name) {
  return ARCHETYPE_FAMILY[archetypeOf(name)] || 'neutral';
}

/**
 * Pick the confessional line for `name` from a `{ villainous, nice, neutral }`
 * bank keyed by the speaker's archetype family. The three must be materially
 * different readings of THE SAME recorded fact — the fact stays put, the voice
 * changes. Missing families fall back within the bank so a partial bank still
 * renders, but every call site here supplies all three.
 */
export function confessionalVoice(name, bank) {
  const fam = archetypeFamily(name);
  return bank[fam] ?? bank.neutral ?? bank.nice ?? bank.villainous ?? '';
}

/**
 * Pick a line this season has not printed lately.
 *
 * Four variants per category is only four variants if the season remembers
 * which it has spent. `window` is what needed a second reading: a season-wide
 * memo is right for a summary drawn twice a season and WRONG for a pool drawn
 * fourteen times, where once everything is used the fallback fires on every
 * remaining draw and one afternoon prints the same template twice.
 *
 * Shares `gs.tr.missionLines` with the archetypes deliberately: it is the
 * season's memo of spent mission prose, and two memos would let a bespoke
 * mission repeat a line an archetype had just used.
 */
export function freshPick(rng, pool, window = 2) {
  if (!Array.isArray(pool) || !pool.length) return '';
  if (gs?.tr && !Array.isArray(gs.tr.missionLines)) gs.tr.missionLines = [];
  const used = gs?.tr?.missionLines;
  if (!used) return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  const mine = used.filter(t => pool.includes(t));
  const recent = window ? mine.slice(-window) : mine;
  const fresh = pool.filter(t => !recent.includes(t));
  const from = fresh.length ? fresh : pool;
  const chosen = from[Math.min(from.length - 1, Math.floor(rng() * from.length))];
  used.push(chosen);
  return chosen;
}

/** Weighted single draw. One rng call whatever the field size, so the stream is cast-stable. */
export function weightedPick(rng, items, weightOf) {
  const w = items.map(weightOf);
  const total = w.reduce((a, b) => a + Math.max(0, b), 0);
  if (!(total > 0)) return items[items.length - 1] ?? null;
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= Math.max(0, w[i]);
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ══════════════════════════════════════════════════════════════════════
// THE CEREMONY — a briefing is a staged scene, not an informational note
// ══════════════════════════════════════════════════════════════════════
//
// The ceremony contract: on first use, the saved record carries the complete
// host speech, the staging, the pauses, the rule points and the transition
// into the action. A mission briefing is on the named list of ceremonies that
// require one.
//
// TWO FIELDS, ONE SOURCE. `rec.ceremony` is the structured record; `briefing`
// is the host's spoken lines joined, and it is DERIVED from `ceremony.hostBeats`
// by `briefingText()` rather than authored a second time. A briefing string
// authored beside the beats is two copies of a speech, and they drift on the
// first edit.
//
// THE HOST IS NEVER NAMED HERE. Global constraint: host explanations use the
// configured host, never a literal name. Every beat below says "the host", and
// the screen substitutes. That also means a briefing written in this layer is
// gender-neutral by construction, which is the standing rule for host prose.

/** A spoken line. `visibility` is who may receive it; a briefing is public. */
export const hostSay = (text, action = null) =>
  ({ kind: 'say', text, action, visibility: 'public' });
/** A staging beat: the host moves, a door opens, a bell is uncovered. */
export const hostDo = (action, text = null) =>
  ({ kind: 'staging', text, action, visibility: 'public' });

/**
 * The host's spoken lines, joined, for `rec.briefing`.
 *
 * The contract test requires this to name a stake — `wins|earn|shield|time|
 * finish` — because a briefing that never says what is at stake is not a
 * briefing. `validateMissionRecord` re-checks it, so a mission cannot ship a
 * speech that explains the props and forgets the prize.
 */
export function briefingText(hostBeats) {
  return (hostBeats || []).filter(b => b.kind === 'say' && b.text)
    .map(b => b.text).join('\n\n');
}

/**
 * A rule point is a promise that a specific rule was actually SPOKEN.
 *
 * `{ id, explainedByBeat }` where `explainedByBeat` indexes into `hostBeats`.
 * The validator checks the index exists and that the beat is a spoken one, so
 * "the host explains the penalty" cannot be satisfied by a staging direction.
 * Every mission must explain, at minimum: what you do, what goes wrong, what
 * it is worth, and how it ends.
 */
export const REQUIRED_RULE_POINTS = Object.freeze(['task', 'failure', 'reward', 'finish']);

// ══════════════════════════════════════════════════════════════════════
// THE RECORD, AND THE VALIDATOR THAT REFUSES A BAD ONE
// ══════════════════════════════════════════════════════════════════════

/**
 * The fields every bespoke mission record carries.
 *
 * The first block is the CONTRACT the task names. The second is the shape the
 * seven archetypes already write, carried unchanged so that every existing
 * reader — js/tr/export.js, js/tr/crowd.js, js/tr/castle/mission-fallout.js,
 * js/tr/deduction.js, headless.js `_missionRecord` — keeps working without a
 * branch. That superset is the whole integration strategy: a bespoke mission
 * IS an archetype record, with an episode's worth of detail hung off it.
 */
export const MISSION_RECORD_FIELDS = Object.freeze([
  // the contract
  'briefing', 'ceremony', 'phases', 'playerScores', 'potBefore', 'potEarned',
  'potAfter', 'shields', 'scenes', 'placements',
  // the archetype shape every existing reader already expects
  'id', 'ep', 'name', 'teams', 'quality', 'tier', 'bestTeam', 'gross', 'earned',
  'sideObjectives', 'summary',
]);

/** Keys that must never appear anywhere inside a record. See the header. */
const FORBIDDEN_KEYS = /^(alignment|role|isTraitor|traitor|faithful|cloak)$/i;

function _scanForAlignment(node, path, out, depth = 0) {
  if (depth > 8 || node == null) return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => _scanForAlignment(v, `${path}[${i}]`, out, depth + 1));
    return;
  }
  if (typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if (FORBIDDEN_KEYS.test(k)) out.push(`${path}.${k}`);
    _scanForAlignment(v, `${path}.${k}`, out, depth + 1);
  }
}

/**
 * Refuse a record that does not honour the contract. Throws with the field.
 *
 * WHY A THROW AND NOT A TEST. The four missions are written by hand and a
 * fifth will be too; a validator that only runs in a test file is a validator
 * the fifth mission's author does not run. `simulate` calls this on its own
 * output before returning, so a malformed record cannot reach a season at all
 * — the same posture as `createTraitorsSceneApi`, which throws on an unknown
 * name rather than filing a warning.
 *
 * What it checks, and why each one is here rather than in a test:
 *
 *   * every contract field is present, and `phases` has at least three;
 *   * `playerScores` names exactly the living field — no ghosts, nobody
 *     missing. This is the one the archetypes could never assert (there is no
 *     per-player mission score in the old shape at all), and Task 7's
 *     measurement is explicit that downstream events must be gated on
 *     something readable. A per-player score is only readable if it is
 *     ALWAYS there;
 *   * the pot line adds up, checked against the three recorded fields rather
 *     than recomputed from `quality` — a reader holding its own copy of the
 *     payout curve is a test of its own arithmetic;
 *   * every scene declares participants and at least one effect, so a scene
 *     that changes nothing cannot be filed as a consequence;
 *   * every rule point points at a spoken host beat;
 *   * and no alignment leaks onto the record, anywhere, at any depth.
 */
export function validateMissionRecord(rec, ctx) {
  const bad = (msg) => { throw new Error(`mission record (${rec?.id ?? '?'}): ${msg}`); };
  if (!rec || typeof rec !== 'object') bad('not an object');
  for (const f of MISSION_RECORD_FIELDS) {
    if (!(f in rec)) bad(`missing field \`${f}\``);
  }

  if (!Array.isArray(rec.phases) || rec.phases.length < 3) {
    bad('a mission needs at least three scored phases');
  }
  for (const [i, ph] of rec.phases.entries()) {
    if (!ph || typeof ph.id !== 'string' || !ph.id) bad(`phase ${i} has no id`);
    if (typeof ph.name !== 'string' || !ph.name) bad(`phase ${ph.id} has no name`);
    if (!Array.isArray(ph.stats) || !ph.stats.length) bad(`phase ${ph.id} names no stats`);
    if (!Array.isArray(ph.beats) || !ph.beats.length) bad(`phase ${ph.id} has no beats`);
    if (!Array.isArray(ph.teams) || ph.teams.length !== 2) bad(`phase ${ph.id} has no two teams`);
  }

  const living = [...(ctx?.living || [])].sort();
  const scored = Object.keys(rec.playerScores || {}).sort();
  if (scored.length !== living.length || scored.some((n, i) => n !== living[i])) {
    bad('playerScores must name exactly the living field — '
      + `${scored.length} scored against ${living.length} living`);
  }
  for (const [n, v] of Object.entries(rec.playerScores)) {
    if (typeof v !== 'number' || !isFinite(v)) bad(`playerScores.${n} is not a finite number`);
  }

  for (const f of ['potBefore', 'potEarned', 'potAfter', 'gross', 'quality']) {
    if (typeof rec[f] !== 'number' || !isFinite(rec[f])) bad(`\`${f}\` is not a finite number`);
  }
  if (rec.potAfter !== rec.potBefore + rec.potEarned) {
    bad(`pot does not add up: ${rec.potBefore} + ${rec.potEarned} != ${rec.potAfter}`);
  }
  if (rec.potEarned < 0) bad('a mission may not take money out of the pot');
  if (rec.earned !== rec.potEarned) bad('`earned` and `potEarned` must be the same money');

  if (typeof rec.briefing !== 'string' || rec.briefing.length < 200) {
    bad('the briefing is shorter than 200 characters — that is a note, not a ceremony');
  }
  if (!/wins|earn|shield|time|finish/i.test(rec.briefing)) {
    bad('the briefing never says what is at stake');
  }
  const beats = rec.ceremony?.hostBeats;
  if (!Array.isArray(beats) || !beats.length) bad('the ceremony has no host beats');
  if (briefingText(beats) !== rec.briefing) {
    bad('`briefing` is not the ceremony\'s own spoken lines — two copies of one speech');
  }
  const points = rec.ceremony?.rulePoints || [];
  for (const want of REQUIRED_RULE_POINTS) {
    const p = points.find(x => x.id === want);
    if (!p) bad(`the host never explains \`${want}\``);
    const b = beats[p.explainedByBeat];
    if (!b || b.kind !== 'say') bad(`rule point \`${want}\` points at beat `
      + `${p.explainedByBeat}, which is not a spoken line`);
  }
  if (typeof rec.ceremony.staging !== 'string' || !rec.ceremony.staging) {
    bad('the ceremony has no staging');
  }

  if (!Array.isArray(rec.scenes) || !rec.scenes.length) bad('a mission produced no scenes');
  for (const s of rec.scenes) {
    if (!s || typeof s.id !== 'string' || !s.id) bad('a scene has no id');
    if (!Array.isArray(s.participants) || !s.participants.length) {
      bad(`scene ${s.id} names no participants`);
    }
    for (const n of s.participants) {
      if (!ctx.living.includes(n)) bad(`scene ${s.id} convened ${n}, who is not in the castle`);
    }
    if (!Array.isArray(s.effects) || !s.effects.length) {
      bad(`scene ${s.id} declares no effect — a scene that changes nothing is not a consequence`);
    }
    if (typeof s.text !== 'string' || s.text.length < 40) bad(`scene ${s.id} has no prose`);
  }

  if (!Array.isArray(rec.placements) || rec.placements.length !== ctx.living.length) {
    bad('`placements` must rank every living player');
  }
  if (!Array.isArray(rec.shields)) bad('`shields` must be an array, empty when none was won');

  const leaks = [];
  _scanForAlignment(rec, 'rec', leaks);
  if (leaks.length) bad(`alignment leaked onto the record at ${leaks.join(', ')}`);

  return rec;
}

/**
 * Rank the living by their mission score, best first, ties broken by name.
 *
 * DETERMINISTIC TIE-BREAK ON PURPOSE. A rank that depends on object key order
 * replays differently after a save/load round trip, and this project's replay
 * guards would catch it as an engine drift on a content edit.
 */
export function placementsFrom(playerScores) {
  return Object.entries(playerScores)
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .map(([name]) => name);
}

/**
 * The context a mission is handed. Built by the picker, never by a mission.
 *
 * `alignment` is a FUNCTION rather than a map so a mission cannot iterate the
 * castle and build one; it answers about one name at a time, which is what a
 * dilemma needs and what a leak would want. `pot` fields are read at build
 * time because a mission must be able to say what the pot was before it ran
 * without asking `gs` — the invariant `potAfter === potBefore + potEarned`
 * has to be checkable against numbers the record itself carries.
 */
export function createMissionCtx({ ep, living, alignmentOf = () => null, shieldsEnabled = true }) {
  const field = [...living];
  return Object.freeze({
    ep,
    living: field,
    potBefore: (gs?.tr?.pot) || 0,
    potCeiling: (typeof gs?.tr?.potCeiling === 'number' && gs.tr.potCeiling > 0)
      ? gs.tr.potCeiling : POT_CEILING,
    // Whether a shield-granting mission may be chosen this afternoon. The
    // equivalence guard in tests/tr-missions.test.js holds the shield mission
    // out (`_setShieldMissionEnabled(false)`), the same as it holds out the
    // archetype Reliquary, so a bespoke mission that grants a Shield reads this
    // in its `eligibility` and stands down when shields are off.
    shieldsEnabled: shieldsEnabled !== false,
    stat: statOf,
    pronounsFor: pronounSlots,
    alignment: (name) => alignmentOf(name, ep),
    /** True when this player has a reason to want the room to fail. Never a switch. */
    conflicted: (name) => alignmentOf(name, ep) === 'traitor',
  });
}

/**
 * The five things a mission must be able to show somebody doing.
 *
 * Spec §9 names them, and they are a REQUIREMENT ON THE MISSION rather than on
 * any one afternoon: a mission that can never produce a coward has no stakes,
 * and one that can never produce an impressive moment has no heroes. So the
 * validator does not demand all five on a single record — a room can have a
 * clean afternoon — and tests/tr-missions-bespoke.test.js demands that each
 * mission reaches all five across a population of seeds, which is the claim
 * that is actually true.
 *
 * `heroic` and `impressive` are separate on purpose: carrying somebody else's
 * crate is not the same act as being the best in the room at your own, and the
 * castle reads them differently at the table.
 */
export const MISSION_BEHAVIOURS = Object.freeze([
  'heroic', 'selfish', 'suspicious', 'cowardly', 'impressive',
]);

/**
 * A recorded scene, in the canonical writing shape, with its effects DECLARED.
 *
 * The effects are not applied here and a mission may not apply them (see the
 * header). What this does is refuse the two shapes that have shipped before:
 * a scene with nobody in it, and a scene whose "consequence" is a mood.
 * `source` on every effect is the sentence a later scene will cite, so the
 * causal chain — stored fact -> eligible reaction -> scene cites the fact ->
 * consequence cites the scene — has something to hold on to.
 */
export function missionScene({ id, eventId, phase, participants, text, behaviour = null,
  effects = [], confessional = null }) {
  if (!Array.isArray(effects) || !effects.length) {
    throw new Error(`missionScene ${id}: a scene must declare at least one effect`);
  }
  for (const e of effects) {
    if (!e.source) throw new Error(`missionScene ${id}: effect \`${e.kind}\` has no source `
      + 'sentence — a later scene cannot cite it');
  }
  if (behaviour && !MISSION_BEHAVIOURS.includes(behaviour)) {
    throw new Error(`missionScene ${id}: unknown behaviour \`${behaviour}\``);
  }
  return { id, eventId, phase, participants: [...participants], text, behaviour,
    effects, confessional };
}
