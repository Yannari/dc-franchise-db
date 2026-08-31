// Measure the Shield: how often one is won, how often it blocks, how much of
// the room saw it, and what it costs the Chess mission's rate. Read the output.
//
// Usage: node tools/tr-shield-measure.mjs [seasons] [seedOffset]
const _store = new Map();
globalThis.localStorage = { getItem: k => _store.has(k) ? _store.get(k) : null,
  setItem: (k, v) => _store.set(k, String(v)), removeItem: k => _store.delete(k), clear: () => _store.clear() };
const CORE = await import('../js/core.js');
const { setPlayers } = CORE;
const { playTraitorsSeason } = await import('../js/tr/headless.js');
const { _setShieldMissionEnabled, _setKnowledgeMissionEnabled } = await import('../js/tr/missions.js');
const { alignmentAt } = await import('../js/tr/roles.js');
const roster = (await import('../franchise_roster.json', { with: { type: 'json' } })).default;

const N = Number(process.argv[2] || 200);
const OFF = Number(process.argv[3] || 0);
const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
setPlayers(ROSTER);

function run(n, off) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: off + i + 1 }));
  return out;
}

const seasons = run(N, OFF);

let shields = 0, blocked = 0, expired = 0, missions = 0, chess = 0, reliquary = 0;
let searches = 0, finds = 0, witnessSum = 0, roomSum = 0, unseen = 0, traitorHolders = 0;
let pactAware = 0, beliefs = 0;
const vis = {};
for (const s of seasons) {
  missions += s.missions.length;
  chess += s.missions.filter(m => m.id === 'blind-chess').length;
  reliquary += s.missions.filter(m => m.id === 'the-reliquary').length;
  for (const m of s.missions) {
    if (!m.shield) continue;
    searches++;
    if (m.shield.found) finds++;
  }
  for (const sh of s.shields) {
    shields++;
    if (sh.outcome === 'blocked') blocked++;
    if (sh.outcome === 'expired') expired++;
    if (sh.outcome === 'pending') console.log('PENDING SHIELD LEFT OPEN', sh.ep, sh.holder);
    witnessSum += sh.witnesses.length;
    if (!sh.witnesses.length) unseen++;
    vis[sh.visibility] = (vis[sh.visibility] || 0) + 1;
    if (sh.pactAware) pactAware++;
    beliefs += sh.beliefsFormed || 0;
  }
}
const blockedLog = seasons.reduce((n, s) => n + (s.blockedMurders?.length || 0), 0);
const murders = seasons.reduce((n, s) => n + s.log.filter(r => r.murdered).length, 0);

const f = (x) => (Math.round(x * 1000) / 1000).toFixed(3);
console.log(`seasons ${N} (seed offset ${OFF})`);
console.log(`missions/season      ${f(missions / N)}   chess/season ${f(chess / N)}   reliquary/season ${f(reliquary / N)}`);
console.log(`seasons with a chess mission: ${f(seasons.filter(s => s.missions.some(m => m.id === 'blind-chess')).length / N * 100)}%`);
console.log(`searches ${searches}  finds ${finds}  (${f(finds / Math.max(1, searches) * 100)}% find rate)`);
console.log(`shields/season       ${f(shields / N)}   seasons with >=1 shield: ${f(seasons.filter(s => s.shields.length).length / N * 100)}%`);
console.log(`blocked murders/season ${f(blocked / N)}  (ledger ${blockedLog}, ${f(blockedLog / N)}/season, against ${murders} completed murders)`);
console.log(`shields expiring unused: ${f(expired / Math.max(1, shields) * 100)}%   blocked: ${f(blocked / Math.max(1, shields) * 100)}%`);
console.log(`mean witnesses ${f(witnessSum / Math.max(1, shields))}   unseen shields ${f(unseen / Math.max(1, shields) * 100)}%   pact aware ${f(pactAware / Math.max(1, shields) * 100)}%`);
console.log(`visibility tiers`, vis);
console.log(`shield beliefs formed/season ${f(beliefs / N)}`);
console.log(`pot mean ${f(seasons.reduce((a, s) => a + s.pot, 0) / N)} of ${seasons[0].potCeiling}`
  + `  (${f(seasons.reduce((a, s) => a + s.pot / s.potCeiling, 0) / N)} of ceiling)`);
