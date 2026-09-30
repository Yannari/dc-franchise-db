// ══════════════════════════════════════════════════════════════════════
// ci/schedule.js — days from the cast (spec §6.2)
// ══════════════════════════════════════════════════════════════════════
//
// A real US season: 10-14 players over 11-15 days, the first rating and
// blocking on Day 1, newcomers after blockings in the first two-thirds, five
// finalists. The length is built from the cast unless the author sets it, and
// it is never shorter than the blockings need. Games, parties and twists fill
// the social days in Plan 3.
export const DEFAULT_DAYS = { min: 11, max: 15 };

// THE RHYTHM (user, 2026-09-30: "an elimination one episode, a rating a
// different episode"). The ratings END an episode and the blocking OPENS the
// next (season.js), so a ratings day, the day after it and a quiet day make
// the shape. Real seasons differ: US 1 alternates early (ratings in episodes
// 1, 3, 5, 7) and runs them back to back late (9, 10, 11); US 2 has quiet
// episodes with neither (3, 5, 9). `rhythm` picks one of those shapes; with
// none, the social days are spread evenly (the old shape, for callers that
// ask for no rhythm).
export const RHYTHMS = [['breather', 0.4], ['early', 0.35], ['spread', 0.25]];
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/** A season's rhythm key from its cast: the setup preview and the engine read the same shape. */
export const rhythmOf = names => [...names].sort().join('|').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17);
function socialDays(mid, social, rhythm) {
  const spread = () => new Set(Array.from({ length: social }, (_, k) => Math.floor((k + 0.5) * mid / social)));
  if (rhythm == null || social <= 0) return { shape: 'spread', at: spread() };
  const rng = mulberry(rhythm);
  let r = rng() * RHYTHMS.reduce((n, [, w]) => n + w, 0), shape = 'spread';
  for (const [name, w] of RHYTHMS) { if ((r -= w) <= 0) { shape = name; break; } }
  const at = new Set();
  if (shape === 'early') {
    // ratings on alternate days early, back to back late (US 1: ratings 1, 3, 5, 7, then 9, 10, 11)
    for (let i = 0; at.size < social && i < mid; i += 2) at.add(i);
  } else if (shape === 'breather' && social >= 2) {
    // one quiet stretch of two days somewhere in the middle, the rest spread
    const p = 1 + Math.floor(rng() * Math.max(1, mid - 3));
    at.add(p); at.add(p + 1);
    // the other quiet days spread out, never touching the breather or each other
    const rest = social - 2;
    const free = () => Array.from({ length: mid }, (_, i) => i).filter(i => ![...at].some(j => Math.abs(j - i) <= 1));
    for (let k = 0; k < rest; k++) {
      const c = free();
      if (!c.length) break;
      at.add(c[Math.floor((k + 0.5) * c.length / (rest - k)) % c.length]);
    }
  } else {
    for (const i of spread()) at.add(Math.max(0, Math.min(mid - 1, i + (rng() < 0.5 ? 0 : rng() < 0.5 ? 1 : -1))));
  }
  // exactly `social` quiet days, whatever the shape managed
  for (let i = mid - 1; at.size < social && i >= 0; i--) at.add(i);
  return { shape, at };
}

export function buildSchedule({ total, starters, finalists = 5, days = null, rhythm = null }) {
  const blocks = total - finalists;
  if (blocks < 1) throw new Error(`a season needs at least one blocking: ${total} players, ${finalists} finalists`);
  if (starters < 3) throw new Error('a season needs at least three starting players');
  const newcomers = total - starters;
  const D = Math.max(blocks + 2, days ?? Math.min(DEFAULT_DAYS.max, Math.max(DEFAULT_DAYS.min, total)));
  const mid = D - 3;                       // days 2 .. D-2
  const social = D - 2 - blocks;
  const { at: socialAt } = socialDays(mid, social, rhythm);
  const day = (n, slot, over = {}) => ({ day: n, slot, block: false, arrivals: 0, final: false, finale: false, ...over });
  const out = [day(1, 'rating1', { block: true })];
  // Slots are unique (the timeline books by slot): social1, social2, ...
  let r = 1, so = 0;
  for (let i = 0; i < mid; i++) {
    out.push(socialAt.has(i) ? day(i + 2, `social${++so}`) : day(i + 2, `rating${++r}`, { block: true }));
  }
  out.push(day(D - 1, 'final-ratings', { final: true }), day(D, 'finale', { finale: true }));

  // Games and parties (Plan 3a): 1×01 opens with Ice Breaker, so day one has a
  // game; every social day has a game and a party; every other rating day in
  // the middle has a game. Videos from home land two days before the final
  // ratings, as a late-season ritual (US 1, US 4, US 6, US 7).
  out[0].game = true;
  out.filter(d => d.slot.startsWith('social')).forEach(d => { d.game = true; d.party = true; });
  out.filter(d => d.block && d.day > 1).forEach((d, i) => { if (i % 2 === 0) d.game = true; });
  for (const d of out) { d.game = !!d.game; d.party = !!d.party; d.homeVideos = d.day === D - 3; }

  const cutoff = Math.floor(D * 2 / 3);
  let slots = out.filter(d => d.day > 1 && d.day <= cutoff && out[d.day - 2].block);
  if (slots.length * 2 < newcomers) slots = out.filter(d => d.day > 1 && d.day <= D - 3);
  if (slots.length * 2 < newcomers) throw new Error(`too many newcomers (${newcomers}) for ${D} days`);
  for (let k = 0; k < newcomers; k++) slots[Math.floor(k * slots.length / newcomers)].arrivals++;
  return out;
}
