// ══════════════════════════════════════════════════════════════════════
// ci/hangout.js — "Please go up to the Hangout to discuss your decision." (spec §9)
// ══════════════════════════════════════════════════════════════════════
//
// The influencers walk the at-risk list one by one (the `views`: what each of
// them privately thinks of each player — Plan 2 writes the pros and cons from
// these), each picks, and if they disagree one gives way. Who gives way: the
// one who cares more about the other and is less bold, with dice. The one who
// gave way may ask for something back ("save mine next time").
import { allied, ALLY_SHIELD } from './alliances.js';
import { rel, bump, S, clamp, makePact } from './state.js';
import { belief } from './beliefs.js';

export const PROTECT = 6;

export function blockScore(state, inf, t) {
  const b = belief(state, inf, t);
  const parts = {
    fake: (1 - b.real) * 3,
    threat: b.threat * 0.6,
    grudge: rel(inf, t, 'resentment') * 0.8,
    noBond: -(rel(inf, t, 'affection') * 0.8 + rel(inf, t, 'trust') * 0.4 + rel(inf, t, 'obligation') * 0.6),
  };
  const shielded = state.pacts.some(p => p.kind === 'protect' && ((p.a === inf && p.b === t) || (p.a === t && p.b === inf)));
  const ally = allied(state, inf, t) ? ALLY_SHIELD * S(state, inf, 'loyalty') / 10 : 0;
  return { total: Object.values(parts).reduce((a, v) => a + v, 0) - (shielded ? PROTECT : 0) - ally, parts };
}

const pickOf = (state, rng, inf, atRisk) => atRisk
  .map(t => [t, blockScore(state, inf, t).total + rng() * 0.5]).sort((a, b) => b[1] - a[1])[0][0];

export function deliberate(state, rng, influencers, atRisk) {
  const views = atRisk.map(t => ({ handle: t,
    by: Object.fromEntries(influencers.map(i => [i, Math.round(blockScore(state, i, t).total * 100) / 100 || 0])) }));  // || 0: no -0 (JSON turns it into 0)
  const picks = Object.fromEntries(influencers.map(i => [i, pickOf(state, rng, i, atRisk)]));
  const offers = influencers.map(i => ({ by: i, target: picks[i] }));
  const distinct = [...new Set(Object.values(picks))];
  let target, decider, yielded = null;
  if (distinct.length === 1) {
    [target] = distinct; [decider] = influencers;
  } else if (influencers.length >= 3) {
    const votes = {};
    for (const t of Object.values(picks)) votes[t] = (votes[t] || 0) + 1;
    const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    decider = top[1] >= 2 ? influencers.find(i => picks[i] === top[0]) : influencers[0];
    target = picks[decider];
  } else {
    const [A, B] = influencers;
    const pull = (x, y) => (rel(x, y, 'affection') + rel(x, y, 'obligation') + 10) / 20 + S(state, x, 'temperament') / 20;
    const pA = clamp(pull(A, B) / (pull(A, B) + pull(B, A)) + (S(state, B, 'boldness') - S(state, A, 'boldness')) / 20, 0.1, 0.9);
    yielded = rng() < pA ? A : B;
    decider = yielded === A ? B : A;
    target = picks[decider];
    offers.push({ by: yielded, yields: true });
    if (rng() < S(state, yielded, 'strategic') / 10) {
      bump(decider, yielded, 'obligation', 2);
      offers.push({ by: yielded, trade: true });
    }
  }
  if (influencers.length >= 2) {
    const [A, B] = influencers;
    if (rng() < clamp((rel(A, B, 'affection') + rel(A, B, 'trust') + 20) / 40, 0, 1) * 0.6) {
      offers.push({ by: A, pact: makePact(state, 'protect', A, B) });
    }
  }
  const parts = blockScore(state, decider, target).parts;
  const reason = Object.entries(parts).sort((a, b) => b[1] - a[1])[0][0];
  const announcer = [...influencers].sort((x, y) => S(state, y, 'boldness') - S(state, x, 'boldness'))[0];
  // The other name they kept coming back to: on screen the Hangout puts two
  // names on the table and cuts before the decision (the show keeps it for
  // Circle Chat). No dice: it reads the scores already drawn.
  const second = views.filter(v => v.handle !== target)
    .map(v => [v.handle, Object.values(v.by).reduce((a, x) => a + x, 0)]).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const runnerUp = second ? { handle: second, reason: Object.entries(blockScore(state, decider, second).parts).sort((a, b) => b[1] - a[1])[0][0] } : null;
  return { target, reason, views, offers, announcer, decider, yielded, runnerUp };
}
