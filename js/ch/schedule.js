// ══════════════════════════════════════════════════════════════════════
// ch/schedule.js — the season's calendar
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3 "Length". 24 players, 8 into the final: 16 have to go, and the real
// show does it in 16-18 episodes with a few late doubles. The plan is built up
// front from the cast so the Season Timeline can show it (spec §6, manual
// §17.4: the timeline is tested equal to this). What actually happens in an
// episode then adapts: a quit or a disqualification is one fewer the Arena has
// to take (`elimsFor`).
//
// Days, not episodes, are the unit for anything that is a risk per unit of
// time (manual §16.3): each episode carries its days.

export function buildSchedule({ total, finalists, daysPerEpisode = 3, gendered = true, counts = null, episodes = null, twists = {}, pairs = false }) {
  // One-episode twists booked on the Season Timeline (ep-twists.js): a booked double is one of the season's
  // doubles, moved to its episode; a return brings one player back, so the season needs one more episode.
  const booked = kind => Object.entries(twists || {}).filter(([, k]) => k === kind).map(([e]) => Number(e)).filter(e => e >= 1);
  const returns = booked('return');
  const need = Math.max(0, total - finalists) + returns.length;
  // Two late doubles on a full cast; none on a small one.
  // A Pairs season (counted in pairs) is shorter by nature: one late double only on a big one.
  const late = pairs ? (need >= 11 ? 1 : 0) : need >= 12 ? 2 : need >= 8 ? 1 : 0;
  const bookedDoubles = booked('double');
  const doubles = Math.max(late, bookedDoubles.length);
  const n = episodes ?? Math.max(1, need - doubles);
  const twistAt = e => (twists || {})[e] || null;
  const dbl = new Set(bookedDoubles.filter(e => e <= n));
  // The doubles sit in the last third of the season, never on a purge or a return night.
  for (let i = n; i >= 1 && dbl.size < doubles; i--) if (!twistAt(i)) dbl.add(i);
  const out = [];
  let day = 1;
  for (let i = 1; i <= n; i++) {
    const t = twistAt(i);
    out.push({ ep: i, firstDay: day, days: daysPerEpisode, plannedElims: dbl.has(i) ? 2 : 1, ...(t ? { twist: t } : {}), ...(t === 'return' ? { returns: 1 } : {}) });
    day += daysPerEpisode;
  }
  out.push({ ep: n + 1, firstDay: day, days: 2, final: true });
  // Divisions: alternating from a coin toss is done at play time (it reads the
  // season's dice); the plan only says how many weeks each side gets.
  if (gendered && counts) {
    for (const e of out) e.balance = counts;
  }
  return out;
}

// How many the Arena takes this episode. The plan says 1 or 2; exits outside
// the vote (a quit, a disqualification) leave capacity over, and that comes off
// the LAST planned doubles first, so the season keeps its shape. Only when no
// double is left does tonight's elimination go ("no elimination tonight").
// Short of capacity (never by construction, but a re-run may), tonight doubles.
export function elimsFor(schedule, epIndex, need) {
  if (need <= 0) return 0;
  const left = schedule.slice(epIndex).filter(e => !e.final).map(e => e.plannedElims);
  if (!left.length) return Math.min(2, need);
  let surplus = left.reduce((a, b) => a + b, 0) - need;
  for (let i = left.length - 1; i > 0 && surplus > 0; i--) {
    if (left[i] === 2) { left[i] = 1; surplus--; }
  }
  let tonight = left[0];
  if (surplus > 0) tonight = Math.max(0, tonight - surplus);
  if (surplus < 0) tonight = Math.min(2, tonight - surplus);
  return Math.min(tonight, need);
}

// Which division plays this week. Alternate, but when one side has more to
// lose than the other (it is further above its share of the final), it goes
// first, so the final stays balanced (spec §3).
export function divisionFor(state, prev, finalists) {
  if (!state.options.gendered) return 'all';
  // a Pairs season of a man and a woman has one champion pair: every week is everybody's. Men's pairs and women's
  // pairs take turns, counted in pairs (`finalists` is pairs then).
  const pairs = state.options.pairs;
  if (pairs && pairs.shape !== 'same') return 'all';
  const units = d => (pairs ? (state.pairs || []).filter(p => state.division[p.a] === d).length : state.active.filter(n => state.division[n] === d).length);
  const m = units('m');
  const f = units('f');
  const half = finalists / 2;
  const overM = m - half, overF = f - half;
  if (overM <= 0 && overF > 0) return 'f';
  if (overF <= 0 && overM > 0) return 'm';
  if (Math.abs(overM - overF) >= 2) return overM > overF ? 'm' : 'f';
  return prev === 'm' ? 'f' : 'm';
}
