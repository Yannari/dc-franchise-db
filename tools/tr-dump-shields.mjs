// Dump every Shield a run of seasons produced, with the sentences it printed
// and the state those sentences claim things about. READ THE OUTPUT.
const _store = new Map();
globalThis.localStorage = { getItem: k => _store.has(k) ? _store.get(k) : null,
  setItem: (k, v) => _store.set(k, String(v)), removeItem: k => _store.delete(k), clear: () => _store.clear() };
const CORE = await import('../js/core.js');
const { setPlayers } = CORE;
const { playTraitorsSeason } = await import('../js/tr/headless.js');
const roster = (await import('../franchise_roster.json', { with: { type: 'json' } })).default;

const N = Number(process.argv[2] || 25);
const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
setPlayers(ROSTER);

for (let i = 0; i < N; i++) {
  const s = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i + 1 });
  const traitors = new Set(s.traitors);
  for (const m of s.missions) {
    if (!m.shield) continue;
    const sh = s.shields.find(x => x.ep === m.ep) || null;
    console.log(`\n── season ${i + 1}, ep ${m.ep} — ${m.name} [${m.tier}] earned ${m.earned}`);
    console.log(`   ${m.summary}`);
    for (const l of m.shield.lines) console.log(`   ${l}`);
    for (const o of m.sideObjectives) console.log(`   ${o.line}`);
    console.log(`   LEDGER: searcher ${m.shield.searcher}${traitors.has(m.shield.searcher) ? ' (TRAITOR)' : ''}`
      + ` found=${m.shield.found} visibility=${m.shield.visibility}`
      + ` witnesses=${m.shield.witnesses.length}/${(s.log.find(r => r.ep === m.ep)?.alive) ?? '?'}`
      + (sh ? ` outcome=${sh.outcome} pactAware=${sh.pactAware} beliefs=${sh.beliefsFormed}` : ''));
    if (sh) console.log(`   SAW: ${sh.witnesses.join(', ') || '(nobody)'}`);
    const night = s.log.find(r => r.ep === m.ep);
    if (night) console.log(`   NIGHT: target ${night.murderTarget ?? '-'} murdered ${night.murdered ?? '-'} blocked ${night.blocked}`);
  }
}
