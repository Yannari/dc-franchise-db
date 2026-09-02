// The honest distribution of the longest conflict run, over many seeds.
globalThis.window = globalThis;
const _s = new Map();
globalThis.localStorage = { getItem: k=>_s.has(k)?_s.get(k):null, setItem:(k,v)=>_s.set(k,String(v)), removeItem:k=>_s.delete(k), clear:()=>_s.clear() };
const CORE = await import('../js/core.js');
const { setPlayers } = CORE;
const { playTraitorsSeason } = await import('../js/tr/headless.js');
const { longestRun } = await import('../js/tr/episode-editor.js');
const { seedFranchiseHistory } = await import('../tests/helpers/tr-castle-fixture.js');
const roster = (await import('../franchise_roster.json', { with: { type:'json' } })).default;
for (const f of ['trust','suspicion','grief','cover','romance','callback','testing','journey','mission-fallout','consequences','nightfall']) await import(`../js/tr/castle/${f}.js`);
const R = roster.players.slice(0,18), CAST = R.map(p=>p.name);
const N = Number(process.argv[2] || 60);
const dist = {}; let total=0, over=0, sumPre=0, sumPost=0, worst=0;
for (let seed=2001; seed<2001+N; seed++) {
  setPlayers(R); seedFranchiseHistory(CAST);
  playTraitorsSeason({ cast: CAST, traitorCount:3, seed });
  for (const row of CORE.gs.episodeHistory||[]) {
    const e = row.tr?.castle?.edit; if (!e || e.scenes.length < 8) continue;
    total++;
    const pre = [...e.scenes].sort((a,b)=>(a.firedAt??0)-(b.firedAt??0));
    const rPre = longestRun(pre, s=>s.tone==='conflict');
    const rPost = longestRun(e.scenes, s=>s.tone==='conflict');
    sumPre += rPre; sumPost += rPost;
    dist[rPost] = (dist[rPost]||0)+1;
    if (rPost > 3) { over++; if (rPost > worst) worst = rPost; }
  }
}
console.log(`episodes=${total} raw mean=${(sumPre/total).toFixed(2)} edited mean=${(sumPost/total).toFixed(2)}`);
console.log(`over the cap: ${over} (${(over/total*100).toFixed(1)}%), worst run ${worst}`);
console.log('distribution', JSON.stringify(dist));
