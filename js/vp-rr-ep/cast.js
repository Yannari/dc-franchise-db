// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/cast.js — a Ridonculous Race cast from the roster, in the browser
// ══════════════════════════════════════════════════════════════════════
//
// The same draw as tests/helpers/rr-cast.js (raceCast), so seed 8 with twelve teams is
// the same season here as in `npm run rr:read` (tests/rr-vp-steps.test.js holds them
// equal). PURE: the roster comes in as an array (the page fetches franchise_roster.json).
import { rngFor } from '../dr/rng.js';
import { REL } from '../rr/state.js';
import { IDENTITIES } from '../rr/identities.js';

export function rosterPlayers(json) {
  return (Array.isArray(json) ? json : json?.players || []).filter(p => p && p.name && p.stats);
}

export function castFromRoster(roster, nTeams = 12, seed = 7) {
  const rng = rngFor(seed * 104729 + 11);
  const pool = [...roster];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const cast = pool.slice(0, nTeams * 2);
  const bag = Object.entries(IDENTITIES).map(([id, x]) => ({ id, name: x.name }));
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
