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

export function buildSchedule({ total, starters, finalists = 5, days = null }) {
  const blocks = total - finalists;
  if (blocks < 1) throw new Error(`a season needs at least one blocking: ${total} players, ${finalists} finalists`);
  if (starters < 3) throw new Error('a season needs at least three starting players');
  const newcomers = total - starters;
  const D = Math.max(blocks + 2, days ?? Math.min(DEFAULT_DAYS.max, Math.max(DEFAULT_DAYS.min, total)));
  const mid = D - 3;                       // days 2 .. D-2
  const social = D - 2 - blocks;
  const socialAt = new Set(Array.from({ length: social }, (_, k) => Math.floor((k + 0.5) * mid / social)));
  const day = (n, slot, over = {}) => ({ day: n, slot, block: false, arrivals: 0, final: false, finale: false, ...over });
  const out = [day(1, 'rating1', { block: true })];
  let r = 1;
  for (let i = 0; i < mid; i++) {
    out.push(socialAt.has(i) ? day(i + 2, 'social') : day(i + 2, `rating${++r}`, { block: true }));
  }
  out.push(day(D - 1, 'final-ratings', { final: true }), day(D, 'finale', { finale: true }));

  const cutoff = Math.floor(D * 2 / 3);
  let slots = out.filter(d => d.day > 1 && d.day <= cutoff && out[d.day - 2].block);
  if (slots.length * 2 < newcomers) slots = out.filter(d => d.day > 1 && d.day <= D - 3);
  if (slots.length * 2 < newcomers) throw new Error(`too many newcomers (${newcomers}) for ${D} days`);
  for (let k = 0; k < newcomers; k++) slots[Math.floor(k * slots.length / newcomers)].arrivals++;
  return out;
}
