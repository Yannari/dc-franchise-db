// The calibration bands, measured outside vitest so base and head can be run
// from two worktrees and differenced. Deliberately imports ONLY things that
// exist in every revision of this plan, so the same file runs on both.
//
// Usage: node tools/tr-bands.mjs [blockSize] [blocks] [firstSeed]
const _store = new Map();
globalThis.localStorage = { getItem: k => _store.has(k) ? _store.get(k) : null,
  setItem: (k, v) => _store.set(k, String(v)), removeItem: k => _store.delete(k), clear: () => _store.clear() };
const CORE = await import('../js/core.js');
const { setPlayers } = CORE;
const { playTraitorsSeason } = await import('../js/tr/headless.js');
const { _setVoteSuspicionMult } = await import('../js/tr/deduction.js');
const roster = (await import('../franchise_roster.json', { with: { type: 'json' } })).default;
// Optional ablations, present only on revisions that have them.
if (process.env.TR_ABLATE === 'shield-reads') {
  const m = await import('../js/tr/powers.js');
  m._setShieldReadsEnabled(false);
  console.log('ABLATION: shield reads off');
}
if (process.env.TR_ABLATE === 'shield') {
  const m = await import('../js/tr/missions.js');
  m._setShieldMissionEnabled(false);
  console.log('ABLATION: shield mission off');
}

const BLOCK = Number(process.argv[2] || 200);
const BLOCKS = Number(process.argv[3] || 1);
const FIRST = Number(process.argv[4] || 1);
const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
setPlayers(ROSTER);

function run(n, first) {
  return Array.from({ length: n }, (_, i) =>
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: first + i }));
}
function liftOver(seasons, pick) {
  let hits = 0, total = 0, nul = 0;
  seasons.forEach(s => {
    const bans = s.log.filter(r => r.banished);
    pick(bans).forEach(r => { total++; nul += r.traitorsAtVote / r.aliveAtVote; if (r.wasTraitor) hits++; });
  });
  return { lift: hits / total - nul / total, rate: hits / total, total };
}
const EARLY = b => b.slice(0, Math.floor(b.length / 2));
const LATE = b => b.slice(Math.floor(b.length / 2));

function plurality(seasons) {
  let share = 0, n = 0;
  for (const s of seasons) {
    for (const r of s.rounds) {
      const bal = (r.ballots || []).filter(b => b.channel === 'banishment');
      if (!bal.length) continue;
      const tally = {};
      bal.forEach(b => { tally[b.voted] = (tally[b.voted] || 0) + 1; });
      share += Math.max(...Object.values(tally)) / bal.length; n++;
    }
  }
  return share / n;
}

const rows = [];
for (let b = 0; b < BLOCKS; b++) {
  const first = FIRST + b * BLOCK;
  const live = run(BLOCK, first);
  _setVoteSuspicionMult(0);
  let blind;
  try { blind = run(BLOCK, first); } finally { _setVoteSuspicionMult(1); }
  const le = liftOver(live, EARLY), ll = liftOver(live, LATE);
  const be = liftOver(blind, EARLY), bl = liftOver(blind, LATE);
  const chess = live.reduce((a, s) => a + s.missions.filter(m => m.id === 'blind-chess').length, 0) / BLOCK;
  rows.push({
    block: b,
    early: (le.lift - be.lift) * 100,
    earlyRaw: le.lift * 100,
    lateSep: (ll.lift - bl.lift) * 100,
    lateRaw: ll.lift * 100,
    hit: liftOver(live, x => x).rate * 100,
    fw: live.filter(s => s.winner === 'faithfuls').length / BLOCK * 100,
    plur: plurality(live) * 100,
    chess,
    pot: live.reduce((a, s) => a + s.pot / s.potCeiling, 0) / BLOCK,
  });
}
const mean = k => rows.reduce((a, r) => a + r[k], 0) / rows.length;
const sd = k => {
  if (rows.length < 2) return 0;
  const m = mean(k);
  return Math.sqrt(rows.reduce((a, r) => a + (r[k] - m) ** 2, 0) / (rows.length - 1));
};
const f = x => (Math.round(x * 1000) / 1000).toFixed(3);
for (const r of rows) {
  console.log(`block ${r.block} seeds ${FIRST + r.block * BLOCK}..  earlySep ${f(r.early)}  earlyRaw ${f(r.earlyRaw)}`
    + `  lateSep ${f(r.lateSep)}  lateRaw ${f(r.lateRaw)}  hit ${f(r.hit)}  fw ${f(r.fw)}  plur ${f(r.plur)}`
    + `  chess ${f(r.chess)}  pot ${f(r.pot)}`);
}
for (const k of ['early', 'earlyRaw', 'lateSep', 'lateRaw', 'hit', 'fw', 'plur', 'chess', 'pot']) {
  console.log(`${k.padEnd(9)} mean ${f(mean(k))}  sd ${f(sd(k))}  sem ${f(sd(k) / Math.sqrt(rows.length))}`);
}
console.log(JSON.stringify(rows));
