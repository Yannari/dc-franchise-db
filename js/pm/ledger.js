// ══════════════════════════════════════════════════════════════════════
// pm/ledger.js — what the public thinks, from what aired
// ══════════════════════════════════════════════════════════════════════
//
// Two ledgers, the Traitors pattern (js/tr/crowd.js, ADDING-A-SHOW §14.8):
//   approval  -100..+100  — decides votes
//   fame      >= 0, never falls — screen time, any tone
// Followers are DERIVED (fame scaled by approval), not a third ledger.
//
// ONLY AIRED EVENTS WRITE HERE (spec §8). And the rule this show owns: the
// public vote and a bombshell's arrival read these; NO islander decision may.
// tests/pm-ledger-readers.test.js enforces it over the source.

export const CAP = 12;
// First impressions: the real public decides who it likes inside a week or
// two (our episodes 2-4). At 24 over three episodes the first Fan Favourite
// landed at episode 5 on the median, measured over forty seasons.
export const FIRST_CAP = 30;
export const MAJOR_CAP = 35;
export const FIRST_WINDOW = 4;
// …and a good first impression lands harder: an audience that knows nothing
// else about you warms to you fast. At 1.0 the top islander climbed ~15 a week
// and the first Fan Favourite landed at episode 5 (measured, forty seasons).
export const FIRST_WEIGHT = 1.5;
/*
 * WHAT A BETRAYAL COSTS, in scene weights (x SCENE_GAIN). On the real show a
 * mugging-off at a recoupling makes a villain overnight; here a steal cost
 * one small scene's worth, and the first Villain arrived at episode 10 on the
 * median (after Casa), with one season in eight never getting one. Each of
 * these is a major moment already, so the label can move at once.
 */
export const BETRAYAL = { steal: 3, bombshellSteal: 1.5, casaTwist: 4, exposed: 2.75, photos: 3, movieNight: 2 };
// This show is sold on the vote: a scene moves gs.popularity twice as far as
// the same scene on Total Drama.
export const POP_SCALE = 2;
/*
 * HOW FAR ONE AIRED SCENE MOVES THE COUNTRY.
 *
 * Measured at 1.0 over a hundred seasons: NOT ONE season produced a Fan
 * Favourite or a Villain by episode 8 (the spec asks for most of them) and
 * 53% of the villa sat on "Invisible" all season (the spec asks for about a
 * quarter). Per-scene weights are fractions, so eight episodes of them never
 * reached ±60 — the labels existed and nothing could ever earn them.
 * Measured again at 2.6 (still only 2% of seasons) and 3.6 (14%). At 5.0 the
 * hundred seasons give: both a fan favourite and a villain by ep 8 in 33% and
 * by ep 12 in 70%, a fan favourite in 99%, an "Invisible" share of 26% (the
 * spec asks for about a quarter), and end-of-season labels spread across all
 * seven tiers — 574 liked, 497 fan favourite, 435 loved, 236 invisible, 194
 * divisive, 139 disliked, 125 villain. No saturation. The per-episode caps
 * (12 / 24 / 35) still decide how fast anybody can move.
 */
export const SCENE_GAIN = 5.0;
/*
 * A PATTERN HARDENS THE PUBLIC'S READ. One bad week is forgiven; a second and
 * a third are "who they really are" (the negativity bias of impression
 * forming: repeated bad acts read as character, one reads as a slip). Each
 * bad week the public has already seen adds PATTERN to the next bad week's
 * weight, up to PATTERN_MAX of them; a good week wears one off.
 *
 * Why it exists: the bad scenes were spread across the whole villa — a pull
 * while coupled, a gossip, a row — a little each, so nobody's ever added up.
 * When the villa day's rows were capped at three (e1d3e1d0, right for the
 * show), Villain by ep 12 fell from 70% of seasons to 15% and both labels by
 * ep 8 from ~40% to 4% (measured, 60 seasons either side).
 */
export const PATTERN = 0.7, PATTERN_MAX = 4, BAD_WEEK = -1.5;
/*
 * INVISIBLE IS NOT BEING SEEN. A mild opinion (Liked, Divisive) needs the
 * public to have watched you: an islander with less recent airtime than the
 * villa's median (UNSEEN x it) reads Invisible whatever the small number
 * says. Airtime is `seen`, fame with a memory of SEEN_DECAY a week. The
 * labels only (the vote reads approval). By approval alone 8.8% of the villa
 * was Invisible per episode, the spec asks about a quarter; damping everyday
 * scenes' approval moved it by two points and made villains of the rest.
 * Measured, sixty seasons: 0.6 -> 12.5%, 0.8 -> 15.9%, 1.0 -> 21.0%.
 */
export const UNSEEN = 1.0, SEEN_DECAY = 0.5;
const MILD = new Set(['liked', 'divisive']);
export const LABEL_ORDER = ['villain', 'disliked', 'divisive', 'invisible', 'liked', 'loved',
  'fan-favourite'];
const BANDS = [[60, 'fan-favourite'], [25, 'loved'], [5, 'liked'], [-5, 'invisible'],
  [-25, 'divisive'], [-60, 'disliked']];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pairKey = (a, b) => [a, b].sort().join('|');

export function labelFor(a) {
  for (const [floor, label] of BANDS) if (a >= floor) return label;
  return 'villain';
}

export function createLedger() {
  return { approval: {}, fame: {}, raw: {}, fameRaw: {}, major: {}, lastApplied: {},
    firstEp: {}, label: {}, pending: {}, belief: {}, record: {}, seen: {} };
}

export function noteArrival(L, name, ep) {
  if (L.firstEp[name] != null) return;
  L.firstEp[name] = ep;
  L.approval[name] = 0;
  L.fame[name] = 0;
  L.label[name] = 'invisible';
}

export function recordAired(L, { who, approval = 0, fame = 0, major = false }) {
  if (!who || L.firstEp[who] == null) return;
  L.raw[who] = (L.raw[who] || 0) + approval * SCENE_GAIN;
  L.fameRaw[who] = (L.fameRaw[who] || 0) + Math.max(0, fame);
  if (major) L.major[who] = true;
}

export function nudgeBelief(L, a, b, d) {
  const k = pairKey(a, b);
  L.belief[k] = clamp((L.belief[k] || 0) + d, -30, 30);
}
export function beliefOf(L, a, b) { return L.belief[pairKey(a, b)] || 0; }

export function capFor(L, name, ep) {
  if (L.major[name]) return MAJOR_CAP;
  return (ep - L.firstEp[name]) < FIRST_WINDOW ? FIRST_CAP : CAP;
}

/** Move a label toward a band by at most `max` tiers. */
function stepToward(cur, band, max) {
  const from = LABEL_ORDER.indexOf(cur), to = LABEL_ORDER.indexOf(band);
  const step = Math.max(-max, Math.min(max, to - from));
  return LABEL_ORDER[from + step];
}

/**
 * Apply this episode. Inertia: a quarter of last episode's movement carries,
 * so one good night after a bad run does not erase the run. A label changes
 * only when the new band has held for two closes, and then by at most two
 * tiers — unless this episode held a major moment for them, which moves it
 * at once (spec §8: "unless you do something really major").
 */
export function closeEpisode(L, ep, popularity = null) {
  const out = {};
  // Recent airtime, and the villa's median of it among those on screen this week.
  const seen = (L.seen ||= {});
  const onScreen = Object.keys(L.fameRaw).filter(n => L.fameRaw[n] > 0);
  for (const n of Object.keys(L.firstEp)) seen[n] = SEEN_DECAY * (seen[n] || 0) + (L.fameRaw[n] || 0);
  const sorted = onScreen.map(n => seen[n]).sort((a, b) => a - b);
  const median = sorted.length ? sorted[sorted.length >> 1] : 0;
  for (const name of Object.keys(L.firstEp)) {
    const wasMajor = !!L.major[name];
    const cap = capFor(L, name, ep);
    const fresh = (ep - L.firstEp[name]) < FIRST_WINDOW;
    // Only the good impression is quickened: turning on somebody takes a
    // moment the public saw (BETRAYAL), not a first week of being noticed.
    const r0 = L.raw[name] || 0;
    const record = (L.record ||= {})[name] || 0;
    const raw = fresh && r0 > 0 ? r0 * FIRST_WEIGHT : r0 < 0 ? r0 * (1 + PATTERN * record) : r0;
    // The nearer the edge, the less a week moves it (user: "they all got to
    // 100 fan favourite, at least the OGs, is it normal?" — 36% of finalists
    // ended on exactly 100, a third of every cast Fan Favourite): the same
    // good week lifts an islander at 20 by most of its weight and one at 90
    // by a tenth, so the top of the board separates instead of piling up.
    const moved = clamp(0.75 * raw + 0.25 * (L.lastApplied[name] || 0), -cap, cap);
    const now = L.approval[name] || 0;
    // Only the climb: a fall from grace is as fast as it ever was (the brake
    // both ways left no villain in twenty seasons).
    const room = moved > 0 ? (100 - now) / 100 : 1;
    // "|| 0": a tiny loss rounds to -0, and -0 does not survive a save.
    const applied = Math.round(moved * Math.max(0, room) * 100) / 100 || 0;
    L.approval[name] = clamp((L.approval[name] || 0) + applied, -100, 100);
    L.lastApplied[name] = applied;
    if (applied <= BAD_WEEK) L.record[name] = Math.min(PATTERN_MAX, record + 1);
    else if (applied >= -BAD_WEEK && record) L.record[name] = record - 1;
    L.fame[name] = (L.fame[name] || 0) + (L.fameRaw[name] || 0);
    if (popularity && applied) popularity[name] = (popularity[name] || 0) + applied * POP_SCALE;
    const b0 = labelFor(L.approval[name]);
    const band = MILD.has(b0) && L.fameRaw[name] > 0 && seen[name] < UNSEEN * median ? 'invisible' : b0;
    // A first impression has nothing to hold against: in an islander's first
    // episodes the label follows the public straight away. The hold and the
    // two-step limit are for an image that already exists (measured: with
    // them from day one the first Fan Favourite waited until episode 5).
    if (band === L.label[name]) L.pending[name] = null;
    else if (wasMajor) { L.label[name] = band; L.pending[name] = null; }
    // Fresh, it follows at once — but two tiers at most, as any other week (a
    // starter went Divisive to Loved on episode 3 of season 64).
    else if (fresh) { L.label[name] = stepToward(L.label[name], band, 2); L.pending[name] = null; }
    else if (L.pending[name] === band) { L.label[name] = stepToward(L.label[name], band, 2); L.pending[name] = null; }
    else L.pending[name] = band;
    out[name] = { approval: L.approval[name], applied, label: L.label[name], fame: L.fame[name] };
  }
  L.raw = {}; L.fameRaw = {}; L.major = {};
  return out;
}

export function readApproval(L, name) { return L.approval[name] || 0; }

/** One star carries a hated partner; belief can still sink the couple. */
export function coupleScore(L, a, b) {
  const x = readApproval(L, a), y = readApproval(L, b);
  return 0.65 * Math.max(x, y) + 0.35 * Math.min(x, y) + beliefOf(L, a, b);
}

/** fame x (1 + 0.6 x approval/100): x0.4 hated to x1.6 adored. */
export function followers(L, name) {
  return Math.round((L.fame[name] || 0) * (1 + 0.6 * readApproval(L, name) / 100) * 1000);
}

export function ledgerSnapshot(L) {
  return { approval: { ...L.approval }, fame: { ...L.fame }, label: { ...L.label } };
}
