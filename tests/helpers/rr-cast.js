// Casts for The Ridonculous Race's tests: n teams of two drawn from franchise_roster.json,
// each with a relationship and (three times in four) an identity, the way the Casting
// Room will build a season.
import { readFileSync } from 'node:fs';
import { rngFor } from '../../js/dr/rng.js';
import { setPlayers } from '../../js/core.js';
import { newState, addTeams, REL } from '../../js/rr/state.js';
import { IDENTITIES } from '../../js/rr/identities.js';

let _roster = null;
const roster = () => (_roster ||= (() => {
  const r = JSON.parse(readFileSync('franchise_roster.json', 'utf8'));
  return (Array.isArray(r) ? r : r.players || []).filter(p => p && p.name && p.stats);
})());

const IDS = Object.entries(IDENTITIES).map(([id, x]) => ({ id, name: x.name }));

export function raceCast(nTeams = 12, seed = 7) {
  const rng = rngFor(seed * 104729 + 11);
  const pool = [...roster()];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const cast = pool.slice(0, nTeams * 2);
  // identities are drawn without replacement: two teams of Soldiers is no cast
  const bag = [...IDS];
  for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
  const rels = Object.keys(REL);
  const teams = [];
  for (let i = 0; i < nTeams; i++) {
    const a = cast[i * 2].name, b = cast[i * 2 + 1].name;
    const rel = rels[Math.floor(rng() * rels.length)];
    const identity = bag.length && rng() < 0.75 ? bag.pop() : null;
    teams.push({ id: 't' + (i + 1), name: identity ? identity.name : `${a} & ${b}`, a, b, rel,
      identity: identity ? identity.id : null, custom: null });
  }
  return { cast, teams };
}

export function raceState(nTeams = 12, seed = 7, options = {}) {
  const { cast, teams } = raceCast(nTeams, seed);
  setPlayers(cast);
  const st = newState(seed, options);
  addTeams(st, teams);
  return st;
}
