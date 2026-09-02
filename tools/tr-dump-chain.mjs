// SETUP -> FOLLOW-UP -> COMPLICATION -> PAYOFF, read off the promise ledger.
globalThis.window = globalThis;
const _s = new Map();
globalThis.localStorage = { getItem: k=>_s.has(k)?_s.get(k):null, setItem:(k,v)=>_s.set(k,String(v)), removeItem:k=>_s.delete(k), clear:()=>_s.clear() };
const CORE = await import('../js/core.js');
const { setPlayers } = CORE;
const { playTraitorsSeason } = await import('../js/tr/headless.js');
const { seedFranchiseHistory } = await import('../tests/helpers/tr-castle-fixture.js');
const roster = (await import('../franchise_roster.json', { with: { type:'json' } })).default;
for (const f of ['trust','suspicion','grief','cover','romance','callback','testing','journey','mission-fallout','consequences','nightfall']) await import(`../js/tr/castle/${f}.js`);
const SEED = Number(process.argv[2] || 3);
const ROSTER = roster.players.slice(0,18), CAST = ROSTER.map(p=>p.name);
setPlayers(ROSTER); seedFranchiseHistory(CAST);
playTraitorsSeason({ cast: CAST, traitorCount:3, seed: SEED });
const rows = CORE.gs.episodeHistory || [];
// every scene by thread, across the season
const byThread = new Map();
for (const r of rows) for (const s of (r.tr?.castle?.edit?.scenes || [])) {
  if (!s.threadId) continue;
  if (!byThread.has(s.threadId)) byThread.set(s.threadId, []);
  byThread.get(s.threadId).push({ ep: r.num, ...s });
}
const chains = [];
for (const r of rows) for (const p of (r.tr?.castle?.edit?.promises || [])) {
  if (p.status !== 'resolved') continue;
  const beats = byThread.get(p.threadId) || [];
  if (beats.length >= 3 && p.ep < r.num) chains.push({ p, settledAt: r.num, beats });
}
chains.sort((a,b)=>b.beats.length-a.beats.length);
for (const c of chains.slice(0, Number(process.argv[3]||3))) {
  console.log(`\n================ ${c.p.threadId}  (opened day ${c.p.ep}, paid off day ${c.settledAt}) ================`);
  console.log(`OWNER: ${c.p.owner}   STATUS: ${c.p.status}   -> ${c.p.detail}`);
  c.beats.forEach((b, i) => {
    const label = i === 0 ? 'SETUP' : b.closedNow ? 'PAYOFF' : (i === c.beats.length - 2 ? 'COMPLICATION' : 'FOLLOW-UP');
    console.log(`  [day ${b.ep}] ${label.padEnd(12)} (${b.window}) ${b.line}`);
    if (b.citation) console.log(`                             ^ ${b.citation}`);
    if (b.closedNow) console.log(`                             => outcome: ${b.outcome} (${b.sense})`);
  });
}
console.log(`\n(${chains.length} cross-night payoffs of 3+ beats in seed ${SEED})`);
