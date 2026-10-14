// Casts for The Challenge's tests: n players drawn from franchise_roster.json,
// half men and half women, each with an original show (a crossover house) and
// a few rookies, the way the site will cast a season.
import { readFileSync } from 'node:fs';
import { rngFor } from '../../js/dr/rng.js';

const SHOWS = ['total-drama', 'big-brother', 'the-traitors', 'drag-race', 'perfect-match', 'the-circle'];
let _roster = null;
const roster = () => (_roster ||= (() => {
  const r = JSON.parse(readFileSync('franchise_roster.json', 'utf8'));
  return (Array.isArray(r) ? r : r.players || []).filter(p => p && p.name && p.stats && ['m', 'f'].includes(p.gender));
})());

export function challengeCast(n = 24, seed = 7, { rookies = 4 } = {}) {
  const rng = rngFor(seed * 104729 + 11);
  const pick = g => {
    const a = roster().filter(p => p.gender === g);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, n / 2);
  };
  const cast = [...pick('m'), ...pick('f')];
  const background = {};
  cast.forEach((p, i) => {
    background[p.name] = { gender: p.gender, origin: SHOWS[Math.floor(rng() * SHOWS.length)], rookie: i % Math.ceil(n / rookies) === 0 };
  });
  return { cast, names: cast.map(p => p.name), background };
}
