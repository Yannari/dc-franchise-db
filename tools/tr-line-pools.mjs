// Plan 5 Task 8 sizing run. For every (event, branch) the castle produces in
// REAL seasons: how many firings, and how many DISTINCT lead sentences once
// the names and numbers are masked out. Also the within-season repeat table
// that the second guard bands.
//
// Real seasons rather than direct fire() execution, deliberately: the probe
// world holds six identical players and hands fire() a fixed rng, so a direct
// sweep measures how poor the probe world is, not how big the pool is. Nine
// events read their names off a thread's `parties` and never see ctx.actors
// at all.
const _store = new Map();
globalThis.localStorage = {
  getItem: k => (_store.has(k) ? _store.get(k) : null),
  setItem: (k, v) => _store.set(k, String(v)),
  removeItem: k => _store.delete(k), clear: () => _store.clear(),
};
const CORE = await import('../js/core.js');
const { setPlayers } = CORE;
const { playTraitorsSeason } = await import('../js/tr/headless.js');
const { EVENTS } = await import('../js/tr/events.js');
const { seedFranchiseHistory } = await import('../tests/helpers/tr-castle-fixture.js');
const roster = (await import('../franchise_roster.json', { with: { type: 'json' } })).default;
await import('../js/tr/castle/trust.js');
await import('../js/tr/castle/suspicion.js');
await import('../js/tr/castle/grief.js');
await import('../js/tr/castle/cover.js');
await import('../js/tr/castle/romance.js');
await import('../js/tr/castle/callback.js');
await import('../js/tr/castle/testing.js');
await import('../js/tr/castle/journey.js');

const N = Number(process.argv[2] || 400);
const BASE = Number(process.argv[3] || 0);
const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
const NAMES = [...CAST].sort((a, b) => b.length - a.length);

function lead(note) { return String(note || '').split(/(?<=[.!?])[ ]/)[0]; }
function mask(s) {
  let out = String(s);
  for (const n of NAMES) out = out.split(n).join('~');
  return out.replace(/\d+/g, '#').replace(/~['’]s/g, '~');
}

// Wrap fire() to capture the beats each firing wrote.
const captured = [];
let curSeason = 0;
for (const ev of EVENTS) {
  const orig = ev.fire;
  ev.fire = function (ctx, rng) {
    const before = new Set();
    for (const t of (CORE.gs?.tr?.threads || [])) for (const b of t.beats) before.add(b);
    const res = orig.call(this, ctx, rng);
    const notes = [];
    for (const t of (CORE.gs?.tr?.threads || [])) {
      for (const b of t.beats) if (!before.has(b) && b.note) notes.push(mask(lead(b.note)));
    }
    captured.push({ season: curSeason, id: ev.id, branch: res?.branch ?? '(none)', notes });
    return res;
  };
}

for (let i = 1; i <= N; i++) {
  curSeason = i;
  setPlayers(ROSTER);
  seedFranchiseHistory(CAST);
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: BASE + i });
}

const byKey = new Map();
for (const c of captured) {
  const k = `${c.id}:${c.branch}`;
  if (!byKey.has(k)) byKey.set(k, { n: 0, set: new Set() });
  const e = byKey.get(k);
  e.n++;
  for (const s of c.notes) e.set.add(s);
}
const rows = [...byKey].map(([k, v]) => ({ k, n: v.n, d: v.set.size }));
rows.sort((a, b) => (a.d / Math.min(4, a.n || 1)) - (b.d / Math.min(4, b.n || 1)) || a.d - b.d);
console.log(`=== ${N} seasons, ${byKey.size} (event,branch) keys ===`);
console.log('distinct  firings  key');
for (const r of rows) console.log(`${String(r.d).padStart(8)}  ${String(r.n).padStart(7)}  ${r.k}`);

// Rule A: every key must clear min(4, firings) distinct sentences.
const failA = rows.filter(r => r.d < Math.min(4, r.n));
console.log('\nRULE A (distinct >= min(4, firings)) violations:', failA.length);
for (const r of failA) console.log(`   ${r.d}/${r.n}  ${r.k}`);

// Rule B: within one season, how many times is the same sentence printed?
let worst = 0, worstWhat = '';
const perSeason = new Map();
const byEventRepeat = new Map();
for (const c of captured) {
  if (!perSeason.has(c.season)) perSeason.set(c.season, new Map());
  const m = perSeason.get(c.season);
  for (const s of c.notes) {
    const v = (m.get(s) || 0) + 1;
    m.set(s, v);
    if (v >= 3) byEventRepeat.set(c.id, (byEventRepeat.get(c.id) || 0) + 1);
    if (v > worst) { worst = v; worstWhat = `season ${c.season}: ${s}`; }
  }
}
console.log(String.fromCharCode(10) + '=== events responsible for a 3rd-or-later identical print in a season ===');
for (const [k,v] of [...byEventRepeat].sort((a,b)=>b[1]-a[1]).slice(0,20)) console.log(`   ${v}	${k}`);
const hist = new Map();
for (const m of perSeason.values()) {
  let mx = 0;
  for (const v of m.values()) mx = Math.max(mx, v);
  hist.set(mx, (hist.get(mx) || 0) + 1);
}
console.log('\nWORST within-season repeat of one sentence:', worst);
console.log('   ' + worstWhat);
console.log('distribution of per-season worst repeat:',
  [...hist].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}x:${v}`).join('  '));
