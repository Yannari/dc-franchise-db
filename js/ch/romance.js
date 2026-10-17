// ══════════════════════════════════════════════════════════════════════
// ch/romance.js — showmances, couples in the vote, breakups
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.8. The franchise's romance rules hold: romanticCompat before any
// spark, and never more than four showmances at once (CLAUDE.md). A couple
// protects each other in the vote and the call-out (vote.js, callout.js); a
// breakup in the house becomes vote material (a grudge and a revenge entry).
import { gs } from '../core.js';
import { romanticCompat } from '../players.js';
import { getBond, addBond } from '../bonds.js';
import { S, archetypeOf, addScene } from './state.js';
import { sparked, remember } from './rel.js';
import { nudge } from './mind.js';

export const MAX_SHOWMANCES = 4;

// Walking in spoken for (state.atHome: a partner at home, not in the cast). A REDUCTION, NOT A BLOCK, as on
// Total Drama (romance.js _homeFactor): being cast is the test only if it can be failed. What they have at home
// sets the price, married the most; how loyal they are decides whether they pay it.
export function homeFactor(state, name) {
  const at = state.atHome?.[name];
  if (!at) return 1;
  const stage = at.stage === 'married' ? 0.25 : at.stage === 'engaged' ? 0.35 : at.stage === 'living-together' ? 0.45 : 0.6;
  const character = 1.8 - (S(name, 'loyalty') / 10) * 1.6;
  return Math.max(0.03, Math.min(1, stage * character));
}
/** Who in a pair has somebody at home. */
export const attachedIn = (state, a, b) => [a, b].filter(n => state.atHome?.[n]);
const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const live = state => state.couples.filter(c => !c.ended);

// A day's sparks. `boost` > 1 on a party night.
export function romanceDay(state, rng, { boost = 1 } = {}) {
  if (!state.options.romance) return;
  const single = state.active.filter(n => !live(state).some(c => c.a === n || c.b === n));
  for (let i = 0; i < single.length; i++) {
    for (let j = i + 1; j < single.length; j++) {
      const a = single[i], b = single[j];
      if (!romanticCompat(a, b)) continue;
      const k = key(a, b);
      const flirt = (S(a, 'social') + S(b, 'social') + S(a, 'boldness') + S(b, 'boldness')) / 40
        + (archetypeOf(a) === 'showmancer' || archetypeOf(b) === 'showmancer' ? 0.25 : 0);
      const p = 0.03 * flirt * boost * (1 + Math.max(0, getBond(a, b)) * 0.1) * homeFactor(state, a) * homeFactor(state, b);
      if (rng() < p) {
        state.sparks[k] = (state.sparks[k] || 0) + 1 + rng();
        addBond(a, b, 0.7);
        sparked(a, b, 0.6);
        addScene(state, 'spark', [a, b], { level: +state.sparks[k].toFixed(2) }, [a, b], boost > 1 ? 'party' : null);
      }
      if ((state.sparks[k] || 0) >= 2.2 && live(state).length < MAX_SHOWMANCES && rng() < 0.45) {
        // somebody here has a partner at home: recorded, so the season can show it and the off-season can
        // resolve what it did (life-resolver.js: "was unfaithful to"), and the audience counts it now
        const overlapping = attachedIn(state, a, b);
        state.couples.push({ a, b, since: state.ep, ended: false, ...(overlapping.length ? { overlapping } : {}) });
        delete state.sparks[k];
        addBond(a, b, 1.5);
        nudge(state, a, 'morale', 1); nudge(state, b, 'morale', 1);
        for (const n of overlapping) { gs.popularity ||= {}; gs.popularity[n] = (gs.popularity[n] || 0) - 1.5; }
        addScene(state, 'showmance', [a, b], overlapping.length ? { overlapping } : {}, state.active, 'public');
        return;
      }
    }
  }
}

// A couple that cracks: a flirt elsewhere, a vote against each other, the
// season wearing on it. The one who ends it is the less attached.
export function breakupCheck(state, rng) {
  for (const c of live(state)) {
    const strain = Math.max(0, 3 - getBond(c.a, c.b)) * 0.04 + 0.006;
    if (rng() >= strain) continue;
    c.ended = state.ep;
    const ender = S(c.a, 'loyalty') < S(c.b, 'loyalty') ? c.a : c.b;
    const left = ender === c.a ? c.b : c.a;
    c.endedBy = ender;
    addBond(c.a, c.b, -4);
    remember(left, ender, 'dumped-me', 2);
    nudge(state, left, 'morale', -2.5); nudge(state, left, 'homesick', 1);
    addScene(state, 'breakup', [ender, left], {}, state.active, 'public');
  }
}

// A couple loses one of them: whoever is left is hit hard.
export function partnerGone(state, name) {
  for (const c of live(state)) {
    if (c.a !== name && c.b !== name) continue;
    const left = c.a === name ? c.b : c.a;
    c.ended = state.ep; c.endedBy = 'exit';
    nudge(state, left, 'morale', -2); nudge(state, left, 'homesick', 1.2);
  }
}
