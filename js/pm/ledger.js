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
export const FIRST_CAP = 24;
export const MAJOR_CAP = 35;
export const FIRST_WINDOW = 3;
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
    firstEp: {}, label: {}, pending: {}, belief: {} };
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
  for (const name of Object.keys(L.firstEp)) {
    const wasMajor = !!L.major[name];
    const cap = capFor(L, name, ep);
    const raw = L.raw[name] || 0;
    const applied = Math.round(clamp(0.75 * raw + 0.25 * (L.lastApplied[name] || 0), -cap, cap) * 100) / 100;
    L.approval[name] = clamp((L.approval[name] || 0) + applied, -100, 100);
    L.lastApplied[name] = applied;
    L.fame[name] = (L.fame[name] || 0) + (L.fameRaw[name] || 0);
    if (popularity && applied) popularity[name] = (popularity[name] || 0) + applied * POP_SCALE;
    const band = labelFor(L.approval[name]);
    if (band === L.label[name]) L.pending[name] = null;
    else if (wasMajor) { L.label[name] = band; L.pending[name] = null; }
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
