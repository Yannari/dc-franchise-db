// Dump ONE edited episode as a reader sees it: the cut, the cards, the promises.
globalThis.window = globalThis;
globalThis.document = { getElementById: () => null, createElement: () => ({ style:{}, classList:{add(){},remove(){}}, appendChild(){} }), querySelector: () => null, querySelectorAll: () => [], addEventListener(){}, removeEventListener(){}, body:{appendChild(){},style:{}}, head:{appendChild(){}} };
const _s = new Map();
globalThis.localStorage = { getItem: k=>_s.has(k)?_s.get(k):null, setItem:(k,v)=>_s.set(k,String(v)), removeItem:k=>_s.delete(k), clear:()=>_s.clear() };
const CORE = await import('../js/core.js');
const { setPlayers } = CORE;
const { playTraitorsSeason } = await import('../js/tr/headless.js');
const { seedFranchiseHistory } = await import('../tests/helpers/tr-castle-fixture.js');
const roster = (await import('../franchise_roster.json', { with: { type:'json' } })).default;
for (const f of ['trust','suspicion','grief','cover','romance','callback','testing','journey','mission-fallout','consequences','nightfall']) await import(`../js/tr/castle/${f}.js`);
const { castleDayScenes } = await import('../js/vp-tr/castle-day.js');

const SEED = Number(process.argv[2] || 3);
const EP = Number(process.argv[3] || 4);
const ROSTER = roster.players.slice(0,18), CAST = ROSTER.map(p=>p.name);
setPlayers(ROSTER); seedFranchiseHistory(CAST);
playTraitorsSeason({ cast: CAST, traitorCount:3, seed: SEED });
const rows = CORE.gs.episodeHistory || [];
const row = rows.find(r => r.num === EP);
const e = row.tr.castle.edit;
console.log(`########## SEED ${SEED}  EPISODE ${EP}  (${e.scenes.length} scenes) ##########`);
console.log('\n--- THE CUT ---');
console.log('PRIMARY  :'); for (const a of e.primaryStories) console.log(`   ${a.premise}  [${a.beatsTonight} beats, payoff=${a.payoff}]`);
console.log('SECONDARY:'); for (const a of e.secondaryStories) console.log(`   ${a.premise}  [${a.beatsTonight} beats, payoff=${a.payoff}]`);
console.log('TEXTURE  :', e.textureSlots.map(t=>`${t.purpose}@${t.phase}`).join(', '));
console.log('TONES    :', JSON.stringify(e.toneLedger));
console.log('PACING   :', JSON.stringify(e.pacing));
console.log('\n--- PROMISES ---');
for (const p of e.promises) console.log(`  [${p.status.toUpperCase()}] ${p.owner} (day ${p.ep}) :: ${p.promisedAction}\n        -> ${p.abandonmentReason || p.detail}`);
console.log('\n--- THE EPISODE, AS CARDS ---');
const composed = castleDayScenes(row, 'audience');
let cards = 0;
for (const c of composed) {
  console.log(`\n[${c.phase}] ${c.heading}   (${c.participants.join(', ')})  tone=${c.tone}`);
  for (const card of (c.observerText.audience || c.observerText.public)) {
    cards++;
    console.log(`   (${card.kind}${card.purpose ? ':' + card.purpose : ''}) ${card.text}`);
  }
}
console.log(`\nTOTAL AUDIENCE CARDS: ${cards}`);
