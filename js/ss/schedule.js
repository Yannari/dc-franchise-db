// ══════════════════════════════════════════════════════════════════════
// ss/schedule.js — a whole Secret Story season of twists, drawn for the timeline
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "the randomizer is not using at all the twists of Secret Story". The timeline's Randomize
// books the season's twists as cards (the TWIST_CATALOG entries with format 'secret-story', read back by
// js/bb/secret-story.js readSchedule), at the rates the engine draws them itself, so a randomized season and a
// surprise one look alike. A season with drawn cards plays exactly them: a week the draw left empty is empty
// (`planned`, below). Cards the user placed by hand only pin their own week.
//
// Pure: (rng, weeks) → [[week, twist id]].

/** The card ids, by what they force (js/bb/secret-story.js SS_SCHEDULE). */
export const SS_CARDS = {
  noms: ['ss-linked', 'ss-for-life', 'ss-inverted', 'ss-houses', 'ss-red-room', 'ss-exclusive', 'ss-everybody'],
  prime: ['ss-red-phone', 'ss-dilemmas', 'ss-bridge', 'ss-truths', 'ss-rings',
    'ss-lie-detector', 'ss-thermal', 'ss-library', 'ss-black-phone', 'ss-families', 'ss-masks', 'ss-fire', 'ss-back-in-time', 'ss-returns', 'ss-temptations', 'ss-gender-war', 'ss-shields', 'ss-safe', 'ss-crystal-ball', 'ss-jungle', 'ss-hearts'],
  split: ['ss-second-house', 'ss-clans', 'ss-bears'],
  deception: ['ss-false-voice', 'ss-robot'],
  vote: ['ss-house-decides', 'ss-vote-to-evict'],
  ticket: ['ss-ticket'],
  launch: ['ss-public-signs'],
};
export const SS_CARD_IDS = new Set(Object.values(SS_CARDS).flat());

// THE EARLIEST WEEK of each twist (the user, 2026-10-30: "why are they already clan ep2 u gotta locked some twist so
// they can only appear later in the game"). The engine's own draws and the timeline's Randomize both keep to it; a
// card placed by hand plays where it is put. 'clans-event' is the house event (the Clan War), not a card.
export const SS_EARLIEST = {
  'ss-linked': 2, 'ss-inverted': 3, 'ss-exclusive': 3, 'ss-houses': 4, 'ss-red-room': 4, 'ss-for-life': 4, 'ss-everybody': 5,
  'ss-red-phone': 2, 'ss-dilemmas': 2, 'ss-bridge': 3, 'ss-rings': 3, 'ss-truths': 4,
  'ss-lie-detector': 3, 'ss-thermal': 3, 'ss-library': 2, 'ss-black-phone': 3, 'ss-families': 4, 'ss-masks': 3, 'ss-fire': 3, 'ss-back-in-time': 4, 'ss-returns': 4, 'ss-temptations': 2, 'ss-gender-war': 3, 'ss-shields': 3, 'ss-safe': 3, 'ss-crystal-ball': 4, 'ss-jungle': 3, 'ss-hearts': 3,
  'ss-second-house': 4, 'ss-clans': 4, 'ss-bears': 5, 'clans-event': 4,
  'ss-false-voice': 4, 'ss-robot': 5, 'ss-house-decides': 3, 'ss-vote-to-evict': 4, 'ss-ticket': 4,
};
/** Two surprises a week at most, the prime's theme included (the engine's own draws; the timeline's cards always play). */
export const SS_MAX_PER_WEEK = 2;
export const earliestOf = id => SS_EARLIEST[id] ?? 2;
/** May the engine draw twist `id` this week? (its earliest week, and room left in the week) */
export function surpriseOk(state, wk, id = null) {
  if (id && wk < earliestOf(id)) return false;
  return ((state?.surprises?.[wk]) || []).length < SS_MAX_PER_WEEK;
}
/** A twist happened this week (drawn or from the timeline): the week's count, and the timeline's record. */
export function markSurprise(state, wk, id) {
  if (!state || !id) return;
  const l = ((state.surprises ||= {})[wk] ||= []);
  if (!l.includes(id)) l.push(id);
}

/**
 * The season's twists. `weeks`: the timeline's weeks, `{ ep, active, finale }` (active: the housemates that week).
 * Week one has no prime (launch night and the days) and the final has its own night: neither gets a card, but for
 * launch night's own (the Public's Signs).
 * @param {() => number} rng
 * @param {Array<{ ep: number, active?: number, finale?: boolean }>} weeks
 * @returns {Array<[number, string]>}
 */
export function ssRandomDraw(rng, weeks = []) {
  const pick = a => a[Math.floor(rng() * a.length) % a.length];
  const W = weeks.filter(w => w && w.ep >= 2 && !w.finale);
  const size = w => Number(w.active) || 99;
  /** @type {Array<[number, string]>} */ const book = [];
  // the nominations' twists: a third of the weeks, never the same one twice running; the once-a-season ones once
  const ONCE = new Set(['ss-for-life', 'ss-everybody', 'ss-houses', 'ss-red-room']);
  const usedNoms = new Set();
  let lastNom = null;
  for (const w of W) {
    if (size(w) < 7 || rng() > 0.33) { lastNom = null; continue; }
    const can = SS_CARDS.noms.filter(id => id !== lastNom && !(ONCE.has(id) && usedNoms.has(id)) && w.ep >= earliestOf(id));
    if (!can.length) continue;
    const id = pick(can);
    usedNoms.add(id); lastNom = id;
    book.push([w.ep, id]);
  }
  // the prime's theme: about half the primes, never one of the last two again
  const recent = [];
  for (const w of W) {
    if (size(w) < 6 || rng() > 0.55) { recent.push(null); continue; }
    const can = SS_CARDS.prime.filter(id => !recent.slice(-2).includes(id) && w.ep >= earliestOf(id));
    if (!can.length) { recent.push(null); continue; }
    const id = pick(can);
    recent.push(id);
    book.push([w.ep, id]);
  }
  // the split: about half the seasons, once, early (weeks two to six, nine or more in the house)
  const splitAt = W.filter(w => w.ep >= 4 && w.ep <= 7 && size(w) >= 9);
  if (splitAt.length && rng() < 0.5) { const w = pick(splitAt); const can = SS_CARDS.split.filter(id => w.ep >= earliestOf(id)); if (can.length) book.push([w.ep, pick(can)]); }
  // who is really talking: a third of the seasons, once (weeks three to eight); the robot needs somebody gone
  const decAt = W.filter(w => w.ep >= 4 && w.ep <= 8 && size(w) >= 7);
  if (decAt.length && rng() < 0.35) { const w = pick(decAt); const can = SS_CARDS.deception.filter(id => w.ep >= earliestOf(id)); if (can.length) book.push([w.ep, pick(can)]); }
  // the public's vote: the house decides once in a third of the seasons; the vote to eliminate once in two in five,
  // in the second half; never on the same prime
  const hdAt = W.filter(w => w.ep >= 3 && size(w) >= 6);
  const hd = hdAt.length && rng() < 0.35 ? pick(hdAt).ep : null;
  if (hd) book.push([hd, 'ss-house-decides']);
  const half = W.length ? W[Math.floor(W.length / 2)].ep : 0;
  const evAt = W.filter(w => w.ep >= Math.max(4, half) && w.ep !== hd);
  if (evAt.length && rng() < 0.4) book.push([pick(evAt).ep, 'ss-vote-to-evict']);
  // the ticket: once, late (eight or fewer in the house), in half the seasons
  const tkAt = W.filter(w => size(w) <= 8 && size(w) >= 5 && w.ep >= earliestOf('ss-ticket'));
  if (tkAt.length && rng() < 0.5) book.push([pick(tkAt).ep, 'ss-ticket']);
  // launch night: the Public's Signs, one season in three (a one-off of the real show, not every year's)
  if (weeks.some(w => w && w.ep === 1) && rng() < 0.34) book.push([1, 'ss-public-signs']);
  return book.sort((a, b) => a[0] - b[0]);
}
