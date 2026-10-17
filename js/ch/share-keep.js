// ══════════════════════════════════════════════════════════════════════
// ch/share-keep.js — the end of a Pairs season: share the money, or keep it all
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-17-ch-pairs-season-design.md §6. Rivals III (Wikipedia, read 2026-10-17):
// "the partner with more points" faced "an ultimate choice at the game's end": Bananas kept all of it, Vince split
// with Jenna, Devin split with Cheyenne. Every finishing pair that won money chooses, the last pair first and the
// champions last, in front of TJ and the cast that was sent home.
//
// The choice is the season's, never a coin flip. Nobody keeps without being the kind who can (CLAUDE.md: nice
// archetypes never steal; a neutral one only with strategic >= 6 and loyalty <= 4: state.js mayScheme). For the
// rest, every term is proportional: how they feel about the partner, who carried whom, the grudges of the season, how
// strategic, loyal and bold they are, how much money they have already, what the two of them were before
// (a couple, family), a rivalry that never healed, and what the audience will think.
import { getBond, addBond } from '../bonds.js';
import { gs } from '../core.js';
import { S, addScene, mayScheme, logistic, archetypeOf } from './state.js';
import { nudge } from './mind.js';
import { grudgeOf, remember } from './rel.js';
import { PURSE } from './stakes.js';
import { carriedBy, tieWord } from './pairs.js';

const pop = (n, d) => { gs.popularity ||= {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; };

// A pair's prize by place: Rivals III's split (275k / 50k / 25k), scaled so first place is two of a solo
// season's champion purses.
export const PAIR_PRIZE = [2, 50 / 275 * 2, 25 / 275 * 2].map(x => Math.round(PURSE.champion * x / 5000) * 5000);

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);

/** What pulls the chooser toward keeping it (+) or sharing (-), term by term. */
export function keepTerms(state, chooser, partner, pair, prize = PAIR_PRIZE[0]) {
  const bond = getBond(chooser, partner);
  const carry = carriedBy(state, chooser, partner);
  const word = tieWord(pair?.kin);
  const couple = (state.couples || []).some(c => !c.ended && ((c.a === chooser && c.b === partner) || (c.a === partner && c.b === chooser)));
  const bank = state.bank?.[chooser] || 0;
  return {
    bond: -bond * 0.32,
    carried: carry ? (carry.by === chooser ? carry.amount * 0.7 : -carry.amount * 0.5) : 0,
    grudge: grudgeOf(chooser, partner) * 0.55,
    strategic: (S(chooser, 'strategic') - 5) * 0.14,
    loyalty: (5 - S(chooser, 'loyalty')) * 0.2,
    bold: (S(chooser, 'boldness') - 5) * 0.06,
    // somebody with little to their name wants it more
    need: (1 - Math.min(1, bank / 100000)) * 0.35,
    // the size of it: half of the champions' money is still life-changing, all of it is more so (Bananas kept 275k)
    size: Math.log(Math.max(1, prize) / PAIR_PRIZE[2]) * 0.35,
    tie: word === 'couple' || couple ? -2.6 : word === 'family' ? -2.8 : word === 'friends' ? -1 : 0,
    // a rivalry that never healed: production put them together, and it stayed war
    rivals: pair?.how === 'rivals' && bond < 0 ? 0.7 + Math.min(1, -bond * 0.12) : 0,
    // the fans are watching, and a social player knows it
    audience: -(S(chooser, 'social') - 4) * 0.1 - Math.max(0, gs.popularity?.[chooser] || 0) * 0.04,
  };
}

const sum = t => Object.values(t).reduce((a, b) => a + b, 0);
// Measured over 100 seasons (audit:ch-spec, pairs block): about one chooser in five keeps.
const KEEP_AT = 1.5;

/** The pair's one decision. pair: { a, b, kin, how }; pts: each partner's final points; place: 1, 2, 3... */
export function decide(state, rng, { members, pts, place, pair }) {
  const prize = PAIR_PRIZE[place - 1] || 0;
  const [x, y] = members;
  // the partner with more points chooses; level, the one TJ would back (respect), then the bolder
  const chooser = (pts[x] || 0) !== (pts[y] || 0) ? ((pts[x] || 0) > (pts[y] || 0) ? x : y)
    : (state.rec[x]?.respect || 0) !== (state.rec[y]?.respect || 0) ? ((state.rec[x]?.respect || 0) > (state.rec[y]?.respect || 0) ? x : y)
    : S(x, 'boldness') >= S(y, 'boldness') ? x : y;
  const partner = chooser === x ? y : x;
  const terms = keepTerms(state, chooser, partner, pair, prize);
  const total = sum(terms);
  const can = mayScheme(chooser) && !NICE.has(archetypeOf(chooser));
  const keep = can && prize > 0 && rng() < logistic((total - KEEP_AT) * 1.3);
  // a nice one who thought about it: the beat before the answer, never the answer
  const hesitate = !keep && total > KEEP_AT;
  // the reason said in the confessional: the biggest term pulling the way they went
  const pulls = Object.entries(terms).filter(([, v]) => (keep ? v > 0 : v < 0)).sort((p, q) => Math.abs(q[1]) - Math.abs(p[1]));
  const why = pulls[0]?.[0] || (keep ? 'greed' : 'bond');
  return { chooser, partner, keep, hesitate, prize, place, why, total: +total.toFixed(2), terms: Object.fromEntries(Object.entries(terms).map(([k, v]) => [k, +v.toFixed(2)])) };
}

/**
 * Every finishing pair with money chooses, the last pair first and the champions last. `pairs`: [{ members, pts,
 * place, pair }] in finishing order. Pays the banks, airs each choice, and writes what it costs. Returns the choices.
 */
export function shareOrKeep(state, rng, pairs) {
  const watching = state.gone.map(g => g.name);
  addScene(state, 'share-keep-rules', pairs.flatMap(p => p.members), { pairs: pairs.map(p => p.members), prizes: pairs.map(p => PAIR_PRIZE[p.place - 1] || 0), watching }, state.active, 'final');
  const out = [];
  for (const p of [...pairs].reverse()) {
    if (!(PAIR_PRIZE[p.place - 1] > 0)) continue;
    const d = decide(state, rng, p);
    const { chooser, partner, keep, prize } = d;
    state.bank[chooser] = (state.bank[chooser] || 0) + (keep ? prize : prize / 2);
    state.bank[partner] = (state.bank[partner] || 0) + (keep ? 0 : prize / 2);
    if (keep) {
      // the heaviest thing one player can do to another on this show (franchise-carry reads it for every season after)
      addBond(partner, chooser, -5);
      remember(partner, chooser, 'kept-the-money', 3, { amount: prize });
      for (const w of state.active) if (w !== chooser && w !== partner && getBond(w, partner) >= 2) addBond(w, chooser, -1);
      pop(chooser, -2.5); pop(partner, 1.5);
      nudge(state, partner, 'morale', -3);
    } else {
      addBond(chooser, partner, 1.2);
      pop(chooser, 0.8); pop(partner, 0.3);
    }
    out.push(d);
    addScene(state, 'share-keep', [chooser, partner], { keep, amount: prize, place: p.place, why: d.why, hesitate: d.hesitate, watching,
      champions: p.place === 1 }, state.active, 'final');
  }
  return out;
}
