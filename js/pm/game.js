// ══════════════════════════════════════════════════════════════════════
// pm/game.js — the game player: a storyline over several episodes
// ══════════════════════════════════════════════════════════════════════
//
// User: "how do strategists, schemers and villains play in this show?" —
// they faked feelings for a partner (feelings.js masks), weighed safety at
// the recouplings, stirred the kissing games, threw shade. None of it was a
// story. The show's game players are (from the press):
//   Ron (UK 9): Shaq and Tanya said he'd "latched on" to Lana because
//     everyone liked her; it was taken as proof he was playing a game, he
//     called it "outrageous", then made amends. They were runners-up.
//   Harriett (UK 11): exposed in Never Have I Ever for saying "Nicole needs
//     to be careful with me" and then "you're so great" to her face.
//   Adam (UK 4): the villain, flitting between three; he admitted after that
//     he'd choose "the right person" to stay in the game.
//
// THE ARC — each step a scene, each with consequences:
//   game-plan      [g, f]     g tells a friend the plan. `of`: ally (f is in on it) · shocked
//   game-latch     [g, t]     g works t, the one the villa likes: attraction, a mask
//   game-two-faced [g, x, t]  g says something about t behind t's back; x hears it
//   game-suspect   [x, y, g]  x says it out loud to y: g is playing a game
//   game-called    [x, g, t]  x calls it in front of the villa. `of`: denies · owns · turns
//   game-fallout   [t, g]     t and g, after. `of`: ends · stays · unsure
//   game-end       [g, t]     how it ends. `of`: real (it stopped being a game) · amends · doubles-down
// Only those the franchise lets scheme (CLAUDE.md) ever play one; the one
// they play is who the villa likes most, read from the villa's bonds.
import { addBond, getBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf, roomMates } from './events.js';
import { attr, nudgeAttraction, compatible } from './chemistry.js';
import { romance, schemeEligible, shown, setMask, revealTruth } from './feelings.js';
import { feel } from './emotions.js';

const S = (state, n) => state.profiles[n]?.stats || {};
const st = (state, n, k) => (S(state, n)[k] ?? 5) / 10;
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const pop = (...rows) => Object.fromEntries(rows.filter(r => r && r[0]).map(([n, approval, fame]) => [n, { approval, fame }]));
const MAX_GAMES = 1;

function weighted(rng, opts) {
  const total = opts.reduce((t, o) => t + Math.max(0, o[1]), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const o of opts) if ((r -= Math.max(0, o[1])) < 0) return o[0];
  return opts[opts.length - 1][0];
}
/** How much the villa likes somebody: everyone's bond to them. */
const liked = (state, n) => state.villa.filter(m => m !== n).reduce((s, m) => s + Math.max(0, getBond(m, n)), 0);

function newGame(state, rng) {
  if ((state.games ||= []).filter(g => !g.over).length >= MAX_GAMES || state.ep < 2) return null;
  // Never somebody who was just played themselves (the one Jess played went
  // straight on to play someone else, the same night she said sorry).
  const cands = state.villa.filter(g => schemeEligible(state.profiles[g]) && !(state.games || []).some(x => x.g === g || (x.t === g && state.ep - x.ep < 8)))
    .map(g => [g, st(state, g, 'strategic') * (1 - st(state, g, 'loyalty'))]);
  for (const [g, w] of cands.sort((a, b) => b[1] - a[1])) {
    if (rng() > 0.35 * w + 0.05) continue;
    // The one to latch on to: whoever the villa likes most, that g doesn't really want.
    const t = roomMates(state, g).filter(n => compatible(state, g, n) && romance(g, n) < 5)
      .sort((p, q) => liked(state, q) - liked(state, p))[0];
    if (!t) continue;
    const f = roomMates(state, g).filter(n => n !== t).sort((p, q) => getBond(g, q) - getBond(g, p))[0];
    return { g, t, f, ep: state.ep, stage: 0, suspicion: 0, over: false, knows: f ? [f] : [] };
  }
  return null;
}

export function gamePlayers(state, rng, entry = null) {
  if (entry && ['final', 'reunion'].includes(entry.moment)) return [];
  const out = [];
  const ev = (kind, players, extra, major = []) => {
    out.push(makeEvent(state, rng, { phase: 'rivals', kind, players, aired: true, major, extra: { pop: {}, ...extra } }));
  };
  for (const G of (state.games || []).filter(x => !x.over)) {
    if (!state.villa.includes(G.g)) { G.over = true; G.why = 'gone'; continue; }
    if (!state.villa.includes(G.t)) {
      // The one being played went home: find the next, or stop.
      G.over = true; G.why = 'target-gone'; continue;
    }
    if (G.ep === state.ep) continue;
    if (rng() < 0.85) step(state, rng, G, ev);
  }
  const G = newGame(state, rng);
  if (G) { state.games.push(G); step(state, rng, G, ev); }
  return out;
}

function step(state, rng, G, ev) {
  const { g, t } = G;
  const here = roomMates(state, g);
  if (!here.includes(t)) return;
  G.stage++;
  // 1. the plan, said to a friend
  const f = G.stage === 1 && G.f && here.includes(G.f) ? G.f : null;
  if (f) {
    const ally = schemeEligible(state.profiles[f]) || getBond(f, t) < 0;
    // A friend who isn't in on it has heard something they may not keep to themselves.
    if (!ally) G.suspicion += 0.6 + st(state, f, 'loyalty');
    else G.knows = G.knows.filter(n => n !== f);   // an ally keeps it quiet
    return ev('game-plan', [g, f], { of: ally ? 'ally' : 'shocked', pop: pop([g, -0.2, 1]) });
  }
  // The one being played can't be told what they don't know yet: the
  // exposure comes when the villa has seen enough.
  const threshold = 2.4;
  if (!G.called && G.suspicion >= threshold) return callIt(state, rng, G, ev);
  if (G.called && !G.fallout) return fallout(state, rng, G, ev);
  if (G.fallout) return endIt(state, rng, G, ev);
  // 2-4. the game itself: latching on, the two faces, and the villa noticing.
  const move = weighted(rng, [
    ['latch', G.stage <= 3 ? 1.4 : 0.6],
    ['two-faced', 0.6 + 0.6 * (1 - st(state, g, 'temperament'))],
    ['suspect', G.suspicion > 0.8 ? 1.2 : 0.4],
  ]);
  if (move === 'latch') {
    nudgeAttraction(state, t, g, 0.3 + 0.5 * st(state, g, 'social'));
    setMask(state, g, t, Math.max(shown(state, g, t), 6 + 3 * st(state, g, 'social')));
    feel(state, t, 'security', 0.5); addBond(t, g, 0.3);
    G.suspicion += 0.2;
    return ev('game-latch', [g, t], { pop: pop([g, 0.1, 1], [t, 0.1, 0.5]) });
  }
  if (move === 'two-faced') {
    const x = here.filter(n => n !== t && !G.knows.includes(n)).sort((p, q) => getBond(g, q) - getBond(g, p))[0];
    if (!x) return;
    G.knows.push(x);
    // Heard by someone who notices things, it counts for more.
    G.suspicion += 0.5 + 0.8 * st(state, x, 'intuition');
    addBond(x, g, -0.2);
    return ev('game-two-faced', [g, x, t], { pop: pop([g, -0.1, 1]) });
  }
  // somebody says it out loud
  const x = G.knows.filter(n => here.includes(n)).sort((p, q) => st(state, q, 'boldness') - st(state, p, 'boldness'))[0]
    || here.filter(n => n !== t).sort((p, q) => st(state, q, 'intuition') - st(state, p, 'intuition'))[0];
  const y = x && here.filter(n => n !== t && n !== x && n !== g).sort((p, q) => getBond(x, q) - getBond(x, p))[0];
  if (!x || !y) return;
  G.suspicion += 0.4 + 0.5 * st(state, y, 'intuition');
  if (!G.knows.includes(y)) G.knows.push(y);
  addBond(y, g, -0.2);
  G.accuser = x;
  return ev('game-suspect', [x, y, g], { pop: pop([x, 0, 0.8]) });
}

function callIt(state, rng, G, ev) {
  const { g, t } = G;
  const here = roomMates(state, g);
  const x = [G.accuser, ...G.knows].find(n => n && here.includes(n) && n !== t) || null;
  if (!x) return;
  G.called = true;
  // How they take it, from how they are built: the bold and strategic own
  // it, the hot-headed turn it on the accuser, the rest deny it.
  const react = weighted(rng, [
    ['owns', 1.2 * st(state, g, 'boldness') * st(state, g, 'strategic') * (1 - st(state, g, 'loyalty'))],
    ['turns', 1.2 * (1 - st(state, g, 'temperament')) * st(state, g, 'boldness')],
    ['denies', 0.7],
  ]);
  // t learns what g really feels; the villa's friends of t cool on g.
  revealTruth(state, t, g);
  addRelationshipDimension(t, g, 'trust', -1.5);
  feel(state, t, 'security', -1.2); feel(state, g, 'stress', 1);
  for (const n of here) if (n !== g && getBond(n, t) >= 2) addBond(n, g, -0.4);
  if (react === 'turns') { addBond(g, x, -1); addBond(x, g, -1); addRelationshipDimension(x, g, 'resentment', 0.6); }
  return ev('game-called', [x, g, t], { of: react, pop: pop([g, react === 'owns' ? -0.6 : -1, 3], [x, 0.4, 1.5], [t, 0.5, 1.5]) }, [g, t, x]);
}

function fallout(state, rng, G, ev) {
  const { g, t } = G;
  G.fallout = true;
  // t decides from what t now knows (the truth), and how loyal t is.
  const now = romance(g, t) / 10, want = (attr(state, t, g) ?? 0) / 10;
  const r = rng();
  const of = r < 0.2 + 0.5 * (1 - now) ? 'ends' : r < 0.2 + 0.5 * (1 - now) + 0.5 * want * st(state, t, 'loyalty') ? 'stays' : 'unsure';
  if (of === 'ends') { nudgeAttraction(state, t, g, -2); addBond(t, g, -1.5); addRelationshipDimension(t, g, 'resentment', 1.2); }
  if (of === 'stays') { addBond(t, g, 0.3); feel(state, t, 'stress', 0.5); }
  if (of === 'unsure') { nudgeAttraction(state, t, g, -0.8); feel(state, t, 'stress', 0.8); }
  G.outcome = of;
  return ev('game-fallout', [t, g], { of, pop: pop([t, of === 'stays' ? -0.2 : 0.6, 1.5], [g, -0.3, 1.5]) }, [t, g]);
}

function endIt(state, rng, G, ev) {
  const { g, t } = G;
  G.over = true;
  // It stopped being a game: g fell for t after all (feelings grow in a couple).
  if (romance(g, t) >= 5) {
    setMask(state, g, t, null); nudgeAttraction(state, t, g, 0.6); feel(state, t, 'security', 0.8);
    G.why = 'real';
    return ev('game-end', [g, t], { of: 'real', pop: pop([g, 1, 2], [t, 0.4, 1]) }, [g, t]);
  }
  // Amends, from the ones with some loyalty or warmth in them; the rest double down.
  const amends = rng() < 0.25 + 0.6 * st(state, g, 'loyalty') + 0.2 * st(state, g, 'temperament');
  G.why = amends ? 'amends' : 'doubles-down';
  if (amends) { for (const n of roomMates(state, g)) if (getBond(n, t) >= 2) addBond(n, g, 0.3); addBond(t, g, 0.4); }
  else { feel(state, g, 'stress', -0.3); }
  return ev('game-end', [g, t], { of: amends ? 'amends' : 'doubles-down', pop: pop([g, amends ? 0.8 : -0.5, 2]) });
}
