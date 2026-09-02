// Baseline measurement for Task 7A: scenes/episode and AUDIENCE cards/episode.
const _store = new Map();
globalThis.window = globalThis;
globalThis.document = { getElementById: () => null, createElement: () => ({ style:{}, classList:{ add(){}, remove(){} }, appendChild(){} }), querySelector: () => null, querySelectorAll: () => [], addEventListener(){}, removeEventListener(){}, body:{ appendChild(){}, style:{} }, head:{ appendChild(){} } };
globalThis.localStorage = { getItem: k => _store.has(k) ? _store.get(k) : null,
  setItem: (k,v) => _store.set(k, String(v)), removeItem: k => _store.delete(k), clear: () => _store.clear() };
const CORE = await import('../js/core.js');
const { setPlayers, gs } = CORE;
const { playTraitorsSeason } = await import('../js/tr/headless.js');
const { seedFranchiseHistory } = await import('../tests/helpers/tr-castle-fixture.js');
const roster = (await import('../franchise_roster.json', { with: { type: 'json' } })).default;
for (const f of ['trust','suspicion','grief','cover','romance','callback','testing','journey','mission-fallout','consequences','nightfall'])
  await import(`../js/tr/castle/${f}.js`);
const { castleDayScenes } = await import('../js/vp-tr/castle-day.js');

const SEEDS = [1,2,3,4,5,6,7,8,9,10,11,42,777,12345];
const CAST_SIZE = Number(process.argv[2] || 18);
const ROSTER = roster.players.slice(0, CAST_SIZE);
const CAST = ROSTER.map(p => p.name);

const sceneCounts = [], cardCounts = [];
for (const seed of SEEDS) {
  setPlayers(ROSTER); seedFranchiseHistory(CAST);
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
  for (const row of (CORE.gs.episodeHistory || [])) {
    if (row.num <= 1 || !row.tr?.castle?.phases || row.tr.endgame) continue;
    sceneCounts.push(row.tr.castle.phases.flatMap(p => p.scenes).length);
    const scenes = castleDayScenes(row, 'audience');
    let cards = 0;
    for (const s of scenes) cards += (s.observerText?.audience || s.observerText?.public || []).length;
    cardCounts.push(cards);
  }
}
function stat(a, label) {
  const s = [...a].sort((x,y)=>x-y);
  const mean = s.reduce((x,y)=>x+y,0)/s.length;
  console.log(`${label}: n=${s.length} min=${s[0]} p10=${s[Math.floor(s.length*0.1)]} median=${s[Math.floor(s.length/2)]} mean=${mean.toFixed(2)} max=${s[s.length-1]}`);
  return mean;
}
stat(sceneCounts, `cast${CAST_SIZE} castle scenes/ep`);
stat(cardCounts, `cast${CAST_SIZE} AUDIENCE castle cards/ep`);
