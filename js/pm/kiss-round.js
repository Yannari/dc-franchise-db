// ══════════════════════════════════════════════════════════════════════
// pm/kiss-round.js — the kisses a kissing challenge is made of
// ══════════════════════════════════════════════════════════════════════
//
// User: "challenge and game kisses should be more common — the goal of a
// challenge is literally to be steamy and create couples, fuel jealousy, be
// shady, break couples, have fun, or create attraction". Sauciest Snogger
// scored every kiss in the villa and showed one; a season had about one
// challenge kiss in it.
//
// A round is a few kisses, each one somebody's choice, and each with a
// motive the engine reads off how they feel and who they are:
//   partner  the safe one, for the loyal and the settled
//   crush    the one they actually fancy, not their partner: attraction
//            grows both ways, and both partners are watching
//   stir     a schemer kissing someone's partner on purpose, to shake that
//            couple (only those the franchise lets scheme)
//   fun      a laugh with a friend — a small spark, a small twinge for a partner
// Every kiss lands: attraction, jealousy the partner saw with their own eyes,
// trust, security, and what the public make of it.
import { addBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { partnerOf } from './events.js';
import { romance, friendship, schemeEligible } from './feelings.js';
import { nudgeAttraction, attr, compatible } from './chemistry.js';
import { feel, jealousyHit } from './emotions.js';

const S = (state, n) => state.profiles[n]?.stats || {};
const pop = (...rows) => Object.fromEntries(rows.filter(r => r[0]).map(([n, approval, fame]) => [n, { approval, fame }]));

function weighted(rng, opts) {
  const total = opts.reduce((t, o) => t + Math.max(0, o[1]), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const o of opts) if ((r -= Math.max(0, o[1])) < 0) return o[0];
  return opts[opts.length - 1][0];
}

/** The choice one islander makes when it is their turn to kiss someone. */
function choose(state, rng, a, targets) {
  const st = S(state, a), p = partnerOf(state, a);
  const loyal = (st.loyalty ?? 5) / 10, bold = (st.boldness ?? 5) / 10;
  const opts = [];
  for (const t of targets) {
    if (t === a || !compatible(state, a, t)) continue;
    const fancy = (attr(state, a, t) ?? 0) / 10;
    if (t === p) { opts.push([['partner', t], 0.4 + 1.2 * loyal + romance(a, t) / 20]); continue; }
    const tp = partnerOf(state, t);
    // The one they fancy, held back by loyalty to a partner of their own.
    opts.push([['crush', t], 2.5 * fancy * (p ? 1 - 0.5 * loyal : 1)]);
    // On purpose, to shake somebody else's couple: a schemer, bold, and the
    // less they like the partner watching, the more it appeals.
    if (tp && tp !== a && schemeEligible(state.profiles[a])) {
      opts.push([['stir', t], 1.6 * bold * (1 - Math.max(0, friendship(a, tp)) / 10) * (0.5 + fancy)]);
    }
    // A laugh with a friend: likelier the less there is in it.
    opts.push([['fun', t], (0.3 + Math.max(0, friendship(a, t)) / 15) * (1 - fancy) * (tp ? 0.6 : 1)]);
  }
  return weighted(rng, opts);
}

/**
 * A round of kisses. `kissers` take their turns in order, each kissing one
 * of `targets` (the challenge decides who may kiss whom), at most `n`
 * kisses and never the same pair twice. `scene` is the caller's own scene
 * maker; `game` names the challenge for the lines.
 */
export function kissRound(state, rng, { kissers, targets, n = 4, game, scene }) {
  const out = [];
  const done = new Set();
  for (const a of kissers) {
    if (out.length >= n) break;
    const got = choose(state, rng, a, targets.filter(t => !done.has([a, t].sort().join('|'))));
    if (!got) continue;
    const [motive, b] = got;
    done.add([a, b].sort().join('|'));
    const pa = partnerOf(state, a), pb = partnerOf(state, b);
    const heat = ((attr(state, a, b) ?? 0) + (attr(state, b, a) ?? 0)) / 20;
    let who = [a, 0, 1.5], them = [b, 0, 1];
    if (motive === 'partner') {
      addBond(a, b, 0.4); feel(state, a, 'security', 0.5); feel(state, b, 'security', 0.6);
      who = [a, 0.3, 1]; them = [b, 0.2, 1];
    } else if (motive === 'crush') {
      nudgeAttraction(state, a, b, 0.5 + 0.4 * heat); nudgeAttraction(state, b, a, 0.3 + 0.4 * heat);
      // Both partners saw it: jealousy they do not need to be told about.
      if (pa) { jealousyHit(state, pa, a, b, 1.2 + 1.8 * heat, { confirmed: true }); addRelationshipDimension(pa, a, 'trust', -0.3); }
      if (pb && pb !== a) jealousyHit(state, pb, b, a, 0.8 + 1.2 * heat, { confirmed: true });
      who = [a, pa ? -0.4 : 0.2, 2]; them = [b, 0, 1.5];
    } else if (motive === 'stir') {
      nudgeAttraction(state, b, a, 0.2);
      if (pb) {
        jealousyHit(state, pb, b, a, 2, { confirmed: true });
        addRelationshipDimension(pb, b, 'trust', -0.4);
        addRelationshipDimension(pb, a, 'resentment', 1.2);
        addBond(pb, a, -1);
      }
      if (pa) jealousyHit(state, pa, a, b, 1, { confirmed: true });
      who = [a, -0.6, 2.5]; them = [b, 0, 1.5];
    } else {
      nudgeAttraction(state, a, b, 0.2); nudgeAttraction(state, b, a, 0.15);
      addBond(a, b, 0.2);
      // Only a game, but a partner still watched it.
      if (pb && pb !== a) jealousyHit(state, pb, b, a, 0.3, { confirmed: true });
      who = [a, 0.2, 1]; them = [b, 0.1, 0.8];
    }
    out.push(scene(state, rng, 'game-kiss', [a, b], { of: motive, game, pop: pop(who, them) },
      motive === 'crush' && pa || motive === 'stir' ? [a] : []));
  }
  return out;
}
