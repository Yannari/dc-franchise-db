// ══════════════════════════════════════════════════════════════════════
// ci/state.js — the season's state, its scene log, and small shared helpers
// ══════════════════════════════════════════════════════════════════════
//
// PLAIN JSON ONLY. A season is saved, replayed and re-aired; a Set or a
// function on the state does not survive JSON.stringify (CLAUDE.md).
//
// A SCENE is the engine's only output besides the numbers. It says who was in
// it (`who`), who saw it (`seenBy` — the only players whose beliefs it may
// move, spec §5.2), what kind it was and its data. No English: Plan 2 writes
// the words from these records.
import { getRelationshipDimension, addRelationshipDimension } from '../relationships.js';

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function newState(seed, options = {}) {
  return {
    seed, day: 0,
    options: { pickBy: 'stats', newcomerRule: 'rate-not-rated', finalists: 5, days: null, script: true, ...options },
    people: {}, profiles: {}, handleOf: {}, active: [], blocked: [], immuneNext: {}, unratedNext: {},
    joinedDay: {}, likesCount: {}, recognised: {},
    beliefs: {}, beliefLog: [], mind: {}, claims: [], know: {}, revealed: {}, ideal: {},
    pacts: [], groups: [], ratings: [], influencerCount: {}, firstPlaces: {},
    scenes: [], seq: 0, pool: [], unused: [], pendingGoodbyes: [], pendingReports: [], ledger: null,
  };
}

export function addScene(state, kind, who, data = {}, seenBy = who) {
  const scene = { id: ++state.seq, day: state.day, kind, who: [...who],
    seenBy: [...new Set(seenBy)], data, aired: true };
  state.scenes.push(scene);
  return scene;
}

// Handles ('@maddie') during the season; person names after a reveal.
export const rel = (a, b, dim) => getRelationshipDimension(a, b, dim);
export const bump = (a, b, dim, delta) => addRelationshipDimension(a, b, dim, delta);

export const peopleOf = (state, handle) => state.profiles[handle]?.players || [];

/** A promise between two profiles: 'rate' (put me first) or 'protect' (we save each other). */
export function makePact(state, kind, a, b) {
  const id = `k${state.pacts.length + 1}`;
  state.pacts.push({ id, kind, a, b, day: state.day, kept: [] });
  return id;
}
export const isActive = (state, handle) => state.active.includes(handle);

/** A profile's stat: the mean over the people behind it (a shared profile is
 *  two), or one person's when `who` names them (whoever won the argument). */
export function S(state, handle, key, { who = null } = {}) {
  if (who && state.people[who]) return state.people[who].stats[key] ?? 5;
  const names = peopleOf(state, handle);
  if (!names.length) return 5;
  return names.reduce((sum, n) => sum + (state.people[n].stats[key] ?? 5), 0) / names.length;
}

// The franchise rule (CLAUDE.md). A threshold here is the rule itself, not
// gameplay: nice archetypes never scheme; neutrals need strategic >= 6 and
// loyalty <= 4. A shared profile schemes only if everyone behind it may.
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAINS = new Set(['villain', 'mastermind', 'schemer']);
export function personMayScheme(person) {
  if (NICE.has(person.archetype)) return false;
  if (VILLAINS.has(person.archetype)) return true;
  return (person.stats.strategic ?? 0) >= 6 && (person.stats.loyalty ?? 10) <= 4;
}
export function schemeEligible(state, handle) {
  const names = peopleOf(state, handle);
  return names.length > 0 && names.every(n => personMayScheme(state.people[n]));
}
