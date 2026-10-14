// ══════════════════════════════════════════════════════════════════════
// ch/party.js — the night out, the fights, the disqualification
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.8. About one night out a cycle. Drinking raises the conflict risk,
// scaled by temperament; old grudges and fresh ballots are what people fight
// about. A fight that turns PHYSICAL is a disqualification: TJ comes in and
// sends the aggressor home (the real show's rule on violence). This is the
// show's chaos engine, so it stays a real risk without becoming a weekly event:
// a physical fight needs a bad grudge, a short fuse and a big night together.
import { getBond, addBond } from '../bonds.js';
import { S, archetypeOf, addScene, clamp } from './state.js';
import { grudgeOf, intimidated, remember } from './rel.js';
import { nudge } from './mind.js';
import { romanceDay } from './romance.js';

export function partyNight(state, rng) {
  const drink = Object.fromEntries(state.active.map(n => [n,
    clamp((S(n, 'boldness') * 0.5 + (10 - S(n, 'temperament')) * 0.3 + S(n, 'social') * 0.2) / 10 + (rng() - 0.5) * 0.4, 0.05, 1)]));
  addScene(state, 'party', state.active, { drink: Object.fromEntries(Object.entries(drink).map(([k, v]) => [k, +v.toFixed(2)])) }, state.active, 'party');
  romanceDay(state, rng, { boost: 2.5 });
  const fights = [];
  const dq = [];
  const seen = new Set();
  for (const a of state.active) {
    for (const b of state.active) {
      if (a >= b) continue;
      const beef = Math.max(0, -getBond(a, b)) + grudgeOf(a, b) * 0.6 + grudgeOf(b, a) * 0.6;
      // The same two do not fight every night: a fight within two episodes cools it.
      if (state.lastFight?.[`${a}|${b}`] >= state.ep - 1) continue;
      if (beef < 2.5) continue;
      const fuse = ((10 - S(a, 'temperament')) + (10 - S(b, 'temperament'))) / 20;
      const hot = (archetypeOf(a) === 'hothead' || archetypeOf(b) === 'hothead') ? 1.4 : 1;
      const p = clamp((beef - 2) * 0.03 * fuse * (drink[a] + drink[b]) * hot, 0, 0.35);
      if (rng() >= p) continue;
      if (seen.has(a) || seen.has(b)) continue;
      seen.add(a); seen.add(b);
      // Who started it: the shorter fuse and the bigger grudge.
      const starter = (10 - S(a, 'temperament')) + grudgeOf(a, b) >= (10 - S(b, 'temperament')) + grudgeOf(b, a) ? a : b;
      (state.lastFight ||= {})[`${a}|${b}`] = state.ep;
      const other = starter === a ? b : a;
      addBond(a, b, -2);
      intimidated(starter, other, 0.8);
      remember(other, starter, 'started-a-fight', 1.4);
      state.rec[a].fights++; state.rec[b].fights++;
      nudge(state, a, 'morale', -0.6); nudge(state, b, 'morale', -0.6);
      // Physical: the starter's fuse, their boldness, how drunk.
      const pPhys = clamp((10 - S(starter, 'temperament')) / 10 * S(starter, 'boldness') / 10 * drink[starter] * 0.22 * hot, 0, 0.3);
      const physical = rng() < pPhys;
      fights.push({ a: starter, b: other, physical });
      // The house takes sides: friends of each.
      const sides = state.active.filter(x => x !== a && x !== b).map(x => ({ x, lean: getBond(x, starter) - getBond(x, other) }))
        .filter(s => Math.abs(s.lean) >= 2);
      for (const s of sides) {
        const against = s.lean > 0 ? other : starter;
        addBond(s.x, against, -0.5);
      }
      addScene(state, physical ? 'fight-physical' : 'fight', [starter, other], { sides: sides.map(s => ({ who: s.x, with: s.lean > 0 ? starter : other })) }, state.active, 'party');
      if (physical) dq.push({ name: starter, victim: other });
    }
  }
  for (const n of state.active) nudge(state, n, 'energy', -0.9 * drink[n]);
  return { drink, fights, dq };
}
