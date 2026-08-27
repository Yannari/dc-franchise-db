// Firing table over N seasons. Path-neutrality probe for Plan 5 Task 8:
// a text change that consumes no rng draw must leave this file bit-identical.
const _store = new Map();
globalThis.localStorage = {
  getItem: k => (_store.has(k) ? _store.get(k) : null),
  setItem: (k, v) => _store.set(k, String(v)),
  removeItem: k => _store.delete(k), clear: () => _store.clear(),
};
const CORE = await import('../js/core.js');
const { setPlayers } = CORE;
const { playTraitorsSeason } = await import('../js/tr/headless.js');
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
const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

const perKey = new Map();
for (let i = 1; i <= N; i++) {
  setPlayers(ROSTER);
  seedFranchiseHistory(CAST);
  const res = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
  for (const round of res.log) {
    for (const ce of (round.castleEvents || [])) {
      const k = `${ce.event.id}:${ce.consequences?.branch ?? '(none)'}`;
      perKey.set(k, (perKey.get(k) || 0) + 1);
    }
  }
}
for (const k of [...perKey.keys()].sort()) console.log(`${perKey.get(k)}\t${k}`);
