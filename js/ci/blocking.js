// ══════════════════════════════════════════════════════════════════════
// ci/blocking.js — the block, the visit, the goodbye (spec §9.4, §11)
// ══════════════════════════════════════════════════════════════════════
//
// Plan 1 plays the STANDARD format only (two influencers, the Hangout). The
// other formats of spec §10 are Plan 3 and plug in beside standardBlocking.
//
// The visit is the one time two players share a room before the final. Both
// learn each other's truth. The visited player now holds private knowledge
// — and a schemer may lie about it later (US 7: Madelyn invented what Heather
// said at her visit, and it steered the next blocking).
import { rel, bump, S, clamp, addScene, isActive, schemeEligible } from './state.js';
import { belief } from './beliefs.js';
import { feel, mood } from './mind.js';
import { makeClaim, learn } from './claims.js';
import { revealTo } from './reveal.js';
import { attractionOk } from './chat.js';
import { deliberate } from './hangout.js';

export function atRiskOf(state, influencers) {
  const pool = state.active.filter(h => !influencers.includes(h));
  const exposed = pool.filter(h => !state.immuneNext[h]);
  return exposed.length ? exposed : pool;
}

export function applyBlock(state, h, channel, by, scene) {
  state.active = state.active.filter(x => x !== h);
  state.blocked.push({ handle: h, day: state.day, channel, by: [...by] });
  for (const i of by) {
    bump(h, i, 'resentment', 3);
    const aff = rel(i, h, 'affection');
    if (aff > 0) feel(state, i, 'guilt', aff / 3);
  }
  for (const o of state.active) if (rel(o, h, 'affection') > 3) feel(state, o, 'stress', 1);
}

export function standardBlocking(state, rng, ratingRow) {
  // A tie that makes everybody left an influencer would leave nobody at risk:
  // then only the top two decide.
  let infl = ratingRow.influencers;
  if (!atRiskOf(state, infl).length) infl = infl.slice(0, 2);
  const atRisk = atRiskOf(state, infl);
  for (const h of atRisk) feel(state, h, 'stress', 2);
  const hangout = addScene(state, 'hangout', infl, { atRisk }, infl);
  const d = deliberate(state, rng, infl, atRisk);
  Object.assign(hangout.data, d);
  for (const h of state.active) delete state.immuneNext[h];
  const announcement = addScene(state, 'blocking', [d.announcer, d.target],
    { by: infl, target: d.target, reason: d.reason, channel: 'influencers' }, [...state.active]);
  applyBlock(state, d.target, 'influencers', infl, announcement);
  const visit = runVisit(state, rng, d.target, infl);
  state.pendingGoodbyes.push(d.target);
  return { target: d.target, hangout, announcement, visit };
}

export function chooseVisit(state, rng, h, blockers) {
  const guilt = mood(state, h, 'guilt') / 10;
  return state.active.map(c => {
    const m = {
      friend: Math.max(0, rel(h, c, 'affection')),
      answers: blockers.includes(c) ? rel(h, c, 'resentment') + 2 : 0,
      truth: (1 - belief(state, h, c).real) * 8,
      apology: guilt * Math.max(0, rel(h, c, 'affection')) * 1.5,
    };
    const [motive, w] = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    return { to: c, motive, w: w + rng() * 1.5 };
  }).sort((a, b) => b.w - a.w)[0];
}

export const REPORT_LIE = 1.2;

export function runVisit(state, rng, h, blockers) {
  if (!state.active.length) return null;
  const { to, motive } = chooseVisit(state, rng, h, blockers);
  const sc = addScene(state, 'visit', [h, to], { motive, kiss: false, handed: null });
  revealTo(state, to, h, sc);
  revealTo(state, h, to, sc);
  const suspect = state.active.filter(o => o !== to).map(o => [o, belief(state, h, o).real])
    .sort((a, b) => a[1] - b[1])[0];
  if (suspect && suspect[1] < 0.5) {
    const c = makeClaim(state, { kind: 'catfish', holder: h, about: suspect[0],
      truth: state.profiles[suspect[0]].mode === 'catfish', by: h, to });
    learn(state, to, c, h, sc);
    sc.data.handed = c.id;
  }
  if (attractionOk(state, h, to) && attractionOk(state, to, h)
    && rel(h, to, 'attraction') > 6 && rel(to, h, 'attraction') > 6) sc.data.kiss = true;
  if (schemeEligible(state, to)
    && rng() < clamp(S(state, to, 'strategic') / 10 * (REPORT_LIE - S(state, to, 'loyalty') / 10), 0, 0.9)) {
    state.pendingReports.push({ by: to, blocked: h, day: state.day });
  }
  return sc;
}

export function deliverReports(state, rng) {
  for (const r of state.pendingReports.splice(0)) {
    if (!isActive(state, r.by)) continue;
    const rival = state.active.filter(o => o !== r.by)
      .map(o => [o, rel(r.by, o, 'resentment') + belief(state, r.by, o).threat * 0.5])
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const allies = state.active.filter(o => o !== r.by && o !== rival)
      .map(o => [o, rel(r.by, o, 'affection')]).filter(([, a]) => a > 2)
      .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([o]) => o);
    if (!rival || !allies.length) continue;
    for (const ally of allies) {
      const sc = addScene(state, 'report', [r.by, ally], { blocked: r.blocked, rival, claim: null });
      const c = makeClaim(state, { kind: 'visitSaid', holder: rival, about: ally,
        truth: rel(rival, ally, 'trust') < 0, by: r.by, to: ally });
      learn(state, ally, c, r.by, sc);
      sc.data.claim = c.id;
    }
  }
}

export function goodbyeVideo(state, rng, h) {
  const all = [...state.active];
  const sc = addScene(state, 'goodbye', [h], { mode: state.profiles[h].mode, warning: null }, all);
  for (const o of all) revealTo(state, o, h, sc);
  const top = all.map(o => [o, rel(h, o, 'resentment') + (1 - belief(state, h, o).real) * 3])
    .sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] > 3) {
    const o = top[0];
    const c = belief(state, h, o).real < 0.5
      ? makeClaim(state, { kind: 'catfish', holder: h, about: o, truth: state.profiles[o].mode === 'catfish', secrecy: 'public', by: h })
      : makeClaim(state, { kind: 'distrusts', holder: h, about: o, truth: rel(h, o, 'trust') < 0, secrecy: 'public', by: h });
    for (const x of all) if (x !== o) learn(state, x, c, h, sc);
    feel(state, o, 'paranoia', 2);
    feel(state, o, 'stress', 2);
    sc.data.warning = { about: o, kind: c.kind, claim: c.id };
  }
  const b = state.blocked.find(x => x.handle === h);
  if (b && state.profiles[h].mode !== 'catfish') for (const i of b.by) if (isActive(state, i)) feel(state, i, 'guilt', 1.5);
  return sc;
}
