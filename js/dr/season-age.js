// ══════════════════════════════════════════════════════════════════════
// dr/season-age.js — lines that need a season behind them
// ══════════════════════════════════════════════════════════════════════
//
// About sixty weekly lines say "every week", "for weeks", "all season" — a
// judge "cannot keep rewarding the same safe choice every week" to a queen on
// her second night, a confessional that somebody "has been safe for weeks" in
// episode two. The pools do not know which night it is, so the renderers ask
// here: in a season's first three nights those lines are left out of the draw
// (or kept, if nothing else in the pool is left).
//
// `week.js` sets the night at the top of every episode. Module state, but a
// week renders synchronously from start to finish, so it is only ever read
// by the week that set it.
let night = 99;

/** Called once per episode, before anything is rendered. */
export function setNightNumber(n) { night = Number(n) || 99; }

export const NEEDS_A_SEASON = /\b(every week|for weeks|all season|week after week|weeks now|every single week|weeks of|safe for weeks|since the first week|all these weeks|weeks in)\b/i;

const textOf = l => (typeof l === 'string' ? l : (l && l.line) || '');

/** The lines of `pool` that can be said tonight. Never empties a pool. */
export function ageOk(pool) {
  if (!pool || night > 3) return pool;
  const kept = pool.filter(l => !NEEDS_A_SEASON.test(textOf(l)));
  return kept.length ? kept : pool;
}
