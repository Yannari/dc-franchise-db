// ══════════════════════════════════════════════════════════════════════
// rr/route.js — the season's route: one place per leg
// ══════════════════════════════════════════════════════════════════════
//
// Spec §2: booked on the Season Timeline, or drawn. A drawn route starts at the
// start place and ends at the finale. While the library is smaller than the season
// (sub-project 3 brings 41 places), places repeat in the middle, never back to back.
import { streamFor } from '../dr/rng.js';
import { PLACES } from './places.js';

export function drawRoute({ legs, seed = 1, options = {} }) {
  if (Array.isArray(options.route) && options.route.length) return [...options.route];
  const all = Object.values(PLACES);
  const start = all.find(p => p.start)?.id;
  const finale = all.find(p => p.finale)?.id;
  const middle = all.filter(p => !p.start && !p.finale).map(p => p.id);
  const rng = streamFor(seed, 'route');
  for (let i = 0; i < 4; i++) rng();
  const route = [start];
  let bag = [];
  while (route.length < legs - 1) {
    if (!bag.length) {
      bag = [...middle];
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    }
    let k = bag.findIndex(id => id !== route.at(-1));
    if (k < 0) k = 0;
    route.push(bag.splice(k, 1)[0]);
  }
  route.push(finale);
  return route.slice(0, legs);
}
