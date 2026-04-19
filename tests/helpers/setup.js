// Test setup helpers — seed gs and players for unit tests
import { setGs, setPlayers, ARCHETYPES, DEFAULT_STATS } from '../../js/core.js';

/** Minimal game state for testing */
export function seedGs(overrides = {}) {
  const base = {
    episode: 1,
    activePlayers: [],
    bonds: {},
    perceivedBonds: {},
    showmances: [],
    romanticSparks: [],
    namedAlliances: [],
    sideDeals: [],
    advantages: [],
    chalRecord: {},
    popularity: {},
    tribes: {},
  };
  setGs({ ...base, ...overrides });
}

/** Create a test player with given stats/archetype */
export function makePlayer(name, opts = {}) {
  const archetype = opts.archetype || 'floater';
  const baseStats = ARCHETYPES[archetype] || { ...DEFAULT_STATS };
  return {
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    gender: opts.gender || 'm',
    sexuality: opts.sexuality || 'straight',
    archetype,
    stats: { ...baseStats, ...(opts.stats || {}) },
  };
}

/** Seed players array and update gs.activePlayers */
export function seedPlayers(...defs) {
  const list = defs.map(d => typeof d === 'string' ? makePlayer(d) : makePlayer(d.name, d));
  setPlayers(list);
  return list;
}

/** Full setup: gs + players + activePlayers populated */
export function seedGame(playerDefs, gsOverrides = {}) {
  const list = seedPlayers(...playerDefs);
  seedGs({ activePlayers: list.map(p => p.name), ...gsOverrides });
  return list;
}
