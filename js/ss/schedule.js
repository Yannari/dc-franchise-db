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
  prime: ['ss-red-phone', 'ss-dilemmas', 'ss-bridge', 'ss-truths', 'ss-rings'],
  split: ['ss-second-house', 'ss-clans', 'ss-bears'],
  deception: ['ss-false-voice', 'ss-robot'],
  vote: ['ss-house-decides', 'ss-vote-to-evict'],
  ticket: ['ss-ticket'],
};
export const SS_CARD_IDS = new Set(Object.values(SS_CARDS).flat());

/**
 * The season's twists. `weeks`: the timeline's weeks, `{ ep, active, finale }` (active: the housemates that week).
 * Week one has no prime (launch night and the days) and the final has its own night: neither gets a card.
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
    const can = SS_CARDS.noms.filter(id => id !== lastNom && !(ONCE.has(id) && usedNoms.has(id)) && (id !== 'ss-everybody' || w.ep >= 3));
    if (!can.length) continue;
    const id = pick(can);
    usedNoms.add(id); lastNom = id;
    book.push([w.ep, id]);
  }
  // the prime's theme: about half the primes, never one of the last two again
  const recent = [];
  for (const w of W) {
    if (size(w) < 6 || rng() > 0.55) { recent.push(null); continue; }
    const can = SS_CARDS.prime.filter(id => !recent.slice(-2).includes(id));
    const id = pick(can);
    recent.push(id);
    book.push([w.ep, id]);
  }
  // the split: about half the seasons, once, early (weeks two to six, nine or more in the house)
  const splitAt = W.filter(w => w.ep <= 6 && size(w) >= 9);
  if (splitAt.length && rng() < 0.5) book.push([pick(splitAt).ep, pick(SS_CARDS.split)]);
  // who is really talking: a third of the seasons, once (weeks three to eight); the robot needs somebody gone
  const decAt = W.filter(w => w.ep >= 3 && w.ep <= 8 && size(w) >= 7);
  if (decAt.length && rng() < 0.35) book.push([pick(decAt).ep, pick(SS_CARDS.deception)]);
  // the public's vote: the house decides once in a third of the seasons; the vote to eliminate once in two in five,
  // in the second half; never on the same prime
  const hdAt = W.filter(w => w.ep >= 3 && size(w) >= 6);
  const hd = hdAt.length && rng() < 0.35 ? pick(hdAt).ep : null;
  if (hd) book.push([hd, 'ss-house-decides']);
  const half = W.length ? W[Math.floor(W.length / 2)].ep : 0;
  const evAt = W.filter(w => w.ep >= Math.max(4, half) && w.ep !== hd);
  if (evAt.length && rng() < 0.4) book.push([pick(evAt).ep, 'ss-vote-to-evict']);
  // the ticket: once, late (eight or fewer in the house), in half the seasons
  const tkAt = W.filter(w => size(w) <= 8 && size(w) >= 5);
  if (tkAt.length && rng() < 0.5) book.push([pick(tkAt).ep, 'ss-ticket']);
  return book.sort((a, b) => a[0] - b[0]);
}
