// Read the Big Brother house-event library the way a player does: assembled
// into real weeks, with state, rather than as disconnected template strings.
//
//   node js/bb-events/read-sample.mjs [seed] [weeks] [scenario]
//
// scenario: plain | twists | relationships
if (!globalThis.localStorage) {
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key), clear: () => values.clear(),
  };
}
globalThis.window ||= globalThis;
globalThis.document ||= {
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener: () => {},
};

const core = await import('../core.js');
const playerApi = await import('../players.js');
const bondApi = await import('../bonds.js');
const { simulateBBEpisode } = await import('../bb-run.js');
const { seasonConfig, setGs, setPlayers, TWIST_CATALOG } = core;
const { pStats, pronouns, romanticCompat } = playerApi;
const { getBond, getPerceivedBond, bKey, bondLabel } = bondApi;

const seed = Number(process.argv[2] || 4107);
const weekLimit = Math.max(1, Number(process.argv[3] || 8));
const scenario = String(process.argv[4] || 'relationships');

function seeded(n) {
  let x = (n >>> 0) || 1;
  return () => {
    x += 0x6D2B79F5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const names = ['Amberly', 'Aaron', 'Dylon', 'Felipe', 'Gyselle', 'Harriett',
  'Hasan', 'Ireland', 'Joel', 'Jules', 'Misha', 'Natasha', 'Nico', 'Tobias',
  'Zella', 'Rhea', 'Cameron'];
const archetypes = ['mastermind', 'social-butterfly', 'hero', 'showmancer',
  'schemer', 'villain', 'floater', 'loyal-soldier', 'underdog', 'goat',
  'hothead', 'wildcard'];
const cast = names.map((name, i) => ({
  name, slug: name.toLowerCase(), gender: i % 2 ? 'm' : 'f',
  sexuality: 'bisexual', archetype: archetypes[i % archetypes.length],
}));

setPlayers(cast);
setGs({
  episode: 0, activePlayers: [...names], eliminated: [], bonds: {},
  relationshipDimensions: {}, perceivedBonds: {}, bondLean: {},
  showmances: [], romanticSparks: [], namedAlliances: [], sideDeals: [],
  advantages: [], chalRecord: {}, popularity: {}, tribes: [], knowledge: {},
  intentions: {}, playerStates: {}, socialStatus: {}, episodeHistory: [], jury: [],
  bb: { outgoingHoh: null, weeks: [], stats: {}, house: null },
});

for (const key of Object.keys(seasonConfig)) delete seasonConfig[key];
Object.assign(seasonConfig, {
  format: 'big-brother', finaleSize: 3, jurySize: 9, romance: 'enabled',
  popularityEnabled: true, setting: 'bb-house', bbHaveNots: 'off',
  bbSafetyMode: 'block-buster', bbDepartures: 'off', theme: '',
  twistSchedule: scenario === 'twists' ? [
    { episode: 2, type: 'bb-have-nots' },
    { episode: 3, type: 'bb-roadkill' },
    { episode: 4, type: 'bb-pandoras-box' },
    { episode: 5, type: 'bb-den-of-temptation' },
    { episode: 6, type: 'bb-care-package' },
  ] : [],
});

if (scenario === 'relationships') {
  core.relationships.splice(0, core.relationships.length,
    { id: 'audit-exes', a: 'Jules', b: 'Natasha', type: 'acquaintance', bond: 1,
      kin: 'exes', leanA: 5, leanB: -2 },
    { id: 'audit-family', a: 'Felipe', b: 'Zella', type: 'ally', bond: 4,
      kin: 'siblings' },
    { id: 'audit-partners', a: 'Aaron', b: 'Gyselle', type: 'ally', bond: 5,
      kin: 'partners' },
    { id: 'audit-old-friends', a: 'Harriett', b: 'Hasan', type: 'friend', bond: 3,
      kin: 'old-friends' });
}

const state = core.gs;
Object.assign(globalThis, { gs: state, players: core.players,
  relationships: core.relationships, seasonConfig, pStats,
  pronouns, romanticCompat, getBond, getPerceivedBond, bKey, bondLabel,
  TWIST_CATALOG });

const originalRandom = Math.random;
Math.random = seeded(seed);
try {
  for (let i = 0; i < weekLimit && state.activePlayers.length > 3; i++) {
    const ep = simulateBBEpisode();
    if (!ep) break;
  }
} finally {
  Math.random = originalRandom;
}

for (const week of state.bb.weeks || []) {
  process.stdout.write(`\n${'='.repeat(72)}\nWEEK ${week.num}\n${'='.repeat(72)}\n`);
  for (const act of week.acts || []) {
    const beats = (act.socialBeats || []).filter(b => b?.text);
    if (!beats.length) continue;
    process.stdout.write(`\n[${String(act.type).toUpperCase()}${act.phase ? ` / ${act.phase}` : ''}]\n`);
    for (const beat of beats) {
      const id = beat.eventId || '(system beat)';
      const who = (beat.players || []).join(', ') || 'no named participants';
      const effects = (beat.effects || []).map(e => e.text).filter(Boolean).join(' | ');
      process.stdout.write(`\n${id} · ${beat.badgeText || ''}\n`);
      process.stdout.write(`people: ${who}\n${String(beat.text).replace(/<[^>]+>/g, '')}\n`);
      if (effects) process.stdout.write(`effects: ${effects}\n`);
    }
  }
}
