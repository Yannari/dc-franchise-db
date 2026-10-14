// ══════════════════════════════════════════════════════════════════════
// ch/plans.js — what each player is actually trying to do
// ══════════════════════════════════════════════════════════════════════
//
// Big Brother's plans (js/bb/plans.js) for The Challenge's game. A player
// carries ONE plan across the season and revises it when something they could
// see forces a change — nobody rebuilds their game from nothing every week,
// and a plan that resets weekly is no plan at all. Every field records WHY,
// and every change is logged, so the vote, the call-out, the side panel and
// the dialogue all read the same reasons.
//
//   core        the one or two they actually trust
//   targets     who they want in the Arena: dangerous, not on their side,
//               and — this is the Challenge's own question — likely to LOSE
//               when they get there, or likely to call out somebody useful
//   shield      a bigger threat they keep around to hide behind
//   revenge     grudges that crossed the line (resentment + receipts)
//   finalWith   late in the season: who they want beside them in the final
//               (people they think they can outrun, and allies from the other
//               division, who are not competition at all)
//   betrayal    the conditions under which they turn on their own
//
// The plan's skill is Total Drama's and Big Brother's weighting: a reactive
// player carries a target and little else, an architect the whole structure.
import { gs } from '../core.js';
import { S, clamp } from './state.js';
import { threatRead, arenaRead } from './respect.js';
import { trustOf, respectOf, fearOf, grudgeOf, protectOf } from './rel.js';
import { noteTarget } from './knowledge.js';

export function planSkill(name) {
  return S(name, 'strategic') * 0.65 + S(name, 'intuition') * 0.2 + S(name, 'social') * 0.15;
}
const styleFor = skill => (skill >= 7.5 ? 'architect' : skill >= 5 ? 'structured' : 'reactive');

export function stageOf(state) {
  if (state.active.length <= state.options.finalists + 4) return 'late';
  const share = state.ep / Math.max(1, state.plannedEpisodes || 14);
  return share < 0.35 ? 'early' : 'mid';
}

// How dangerous `n` looks to `observer`: the record everybody watched, plus
// what this observer personally fears and respects.
export function threatTo(state, observer, n) {
  return threatRead(state, n) + fearOf(observer, n) * 0.35 + respectOf(observer, n) * 0.2;
}

// How likely `n` is to come back from the Arena, as `observer` reads it.
export const comesBack = (state, n) => clamp((arenaRead(state, n) - 3) / 6, 0, 1);

// The final: who could beat `observer` in a two-day endurance race.
export function finalThreat(state, observer, n) {
  if (state.division[n] !== state.division[observer]) return 0;
  return (S(n, 'endurance') * 0.45 + S(n, 'physical') * 0.25 + S(n, 'mental') * 0.3) + (state.rec[n]?.dailyWins || 0) * 0.3;
}

function readShield(state, name, pool, skill) {
  if (skill < 5.5 || stageOf(state) === 'late') return null;
  const mine = threatRead(state, name);
  const best = pool.filter(n => state.division[n] === state.division[name]
    && threatRead(state, n) > mine + 1 && trustOf(name, n) > -2 && grudgeOf(name, n) < 3)
    .sort((a, b) => threatRead(state, b) - threatRead(state, a))[0];
  if (!best) return null;
  const r = state.rec[best];
  return { name: best, why: r.arenaW ? `${r.arenaW} Arena win${r.arenaW > 1 ? 's' : ''}: the house aims at them, not at me`
    : 'looks like a bigger threat than I do, and draws the room' };
}

function readFinalWith(state, name, pool) {
  if (stageOf(state) !== 'late') return [];
  const mine = finalThreat(state, name, name);
  return pool.map(n => ({ n, edge: state.division[n] !== state.division[name] ? 3 + trustOf(name, n) * 0.3 : mine - finalThreat(state, name, n) + trustOf(name, n) * 0.15 }))
    .filter(x => x.edge > 0.5).sort((a, b) => b.edge - a.edge).slice(0, 3).map(x => x.n);
}

// What it is worth to `name` to see `y` go home.
function valueGone(state, name, y) {
  const strat = S(name, 'strategic') / 10;
  return threatTo(state, name, y) * (0.25 + strat * 0.45) + grudgeOf(name, y) * 0.9
    - Math.max(0, protectOf(name, y)) * (0.25 + S(name, 'loyalty') * 0.05);
}

// What `name` scores `n` as a target, with the reason that dominates.
//
// THE CHALLENGE'S OWN QUESTION. Voting somebody in does not send them home;
// it sends them into a fight. Either they lose (and go), or they win and take
// out whoever they call out. So a strategist does not ask "who is dangerous?"
// but "what does putting them in actually get me?":
//
//   EV = P(they lose) x value(they go) + P(they win) x value(their pick goes)
//        - the risk that their pick is ME
//
// That is how a house stops feeding the same beast into the Arena week after
// week (it did, five times running, before this), and how a cold strategist
// sends a beast in ON PURPOSE to take out somebody else ("use"). A reactive
// player just aims at the scary one; the read is blended by `strategic`.
// `ctx.predict(x)` is who the house expects x to call out (vote.js).
export function targetScore(state, name, n, plan = null, ctx = null) {
  const strat = S(name, 'strategic') / 10;
  const parts = {
    threat: threatTo(state, name, n) * (0.25 + strat * 0.45),
    grudge: grudgeOf(name, n) * 0.9,
    loses: (1 - comesBack(state, n)) * 2.2 * strat,
    final: stageOf(state) === 'late' ? (finalThreat(state, name, n) - 5) * 0.6 * strat : 0,
    protect: -Math.max(0, protectOf(name, n)) * (0.25 + S(name, 'loyalty') * 0.05),
  };
  if (ctx?.predict) {
    const opp = ctx.predict(n);
    const pLose = opp ? 1 / (1 + Math.exp(-(arenaRead(state, opp) - arenaRead(state, n)) * 0.6)) : 0.5;
    // The gut (threat, grudge) keeps (1 - strat) of its weight; the strategist's
    // sum takes the rest: what goes if they lose, what goes if they win.
    parts.threat *= 1 - strat;
    parts.grudge *= 1 - strat;
    parts.loses = 0;
    parts.theyGo = pLose * valueGone(state, name, n) * strat;
    // Sending a beast in to take out somebody else, said as its own reason.
    parts.use = opp && opp !== name ? (1 - pLose) * valueGone(state, name, opp) * strat : 0;
    if (opp === name) parts.risk = -(1 - pLose) * 5 * strat;
  }
  if (plan?.shield === n) parts.shield = -3 * strat;
  if (plan?.finalWith?.includes(n)) parts.finalWith = -2.5 * strat;
  if (plan?.core?.includes(n)) parts.core = -4;
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  const why = Object.entries(parts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0]?.[0] || 'threat';
  return { total, why, parts };
}

const REASON_TEXT = {
  threat: 'the biggest threat they can reach',
  grudge: 'personal: the receipts are piling up',
  loses: 'they would lose in the Arena',
  theyGo: 'dangerous, and likely to lose the fight',
  use: 'send them in to take somebody else out',
  final: 'nobody wants to run a final against them',
};

export function formPlan(state, name) {
  const pool = state.active.filter(n => n !== name);
  const skill = planSkill(name);
  const byTrust = [...pool].sort((a, b) => trustOf(name, b) - trustOf(name, a));
  const core = byTrust.filter(n => trustOf(name, n) > 1.5).slice(0, skill >= 6 ? 2 : 1);
  const plan = { owner: name, style: styleFor(skill), stage: stageOf(state), core, targets: [], shield: null,
    revenge: [], finalWith: [], betrayal: [], origins: {}, history: [], formedEp: state.ep, revisedEp: state.ep };
  const shield = readShield(state, name, pool, skill);
  if (shield) { plan.shield = shield.name; plan.origins[shield.name] = shield.why; }
  plan.finalWith = readFinalWith(state, name, pool);
  plan.revenge = pool.filter(n => grudgeOf(name, n) >= 2.5);
  const scored = pool.map(n => ({ n, ...targetScore(state, name, n, plan) })).sort((a, b) => b.total - a.total);
  plan.targets = scored.slice(0, skill >= 7 ? 2 : 1).filter(x => x.total > 0.5).map(x => x.n);
  for (const t of plan.targets) plan.origins[t] = REASON_TEXT[scored.find(x => x.n === t).why] || REASON_TEXT.threat;
  plan.betrayal = skill < 6 ? [] : core.filter(n => respectOf(name, n) >= 1.5 && trustOf(name, n) < 4)
    .map(ally => ({ ally, when: 'if they become the biggest threat left in my division' }));
  return plan;
}

function log(plan, state, field, from, to, why) {
  plan.history.push({ ep: state.ep, field, from, to, why });
  if (plan.history.length > 30) plan.history.splice(0, plan.history.length - 30);
}

// Revise against what changed. Keeps what still holds; logs every change.
export function revisePlan(state, name) {
  const old = state.plans[name];
  if (!old) return (state.plans[name] = formPlan(state, name));
  const next = formPlan(state, name);
  // Targets are sticky: a target survives a revision unless the reason has
  // gone (they left, became core, or fell far down the list).
  const keep = old.targets.filter(t => state.active.includes(t) && !next.core.includes(t)
    && targetScore(state, name, t, next).total > 0.2);
  const targets = [...new Set([...keep, ...next.targets])].slice(0, Math.max(1, next.targets.length));
  for (const t of targets) if (!old.targets.includes(t)) log(next, state, 'target', null, t, next.origins[t] || 'moved up the list');
  for (const t of old.targets) if (!targets.includes(t)) log(next, state, 'target', t, null,
    !state.active.includes(t) ? 'gone' : next.core.includes(t) ? 'became a real ally' : 'no longer worth it');
  if (old.shield !== next.shield) log(next, state, 'shield', old.shield, next.shield, next.shield ? next.origins[next.shield] : 'the shield is gone or turned');
  for (const r of next.revenge) if (!old.revenge.includes(r)) log(next, state, 'revenge', null, r, 'resentment crossed into a grudge');
  next.targets = targets;
  for (const t of targets) next.origins[t] ||= old.origins[t] || REASON_TEXT.threat;
  next.history = [...old.history, ...next.history];
  next.formedEp = old.formedEp;
  state.plans[name] = next;
  // The top target enters the house as something people can find out.
  if (targets[0]) noteTarget(state, name, targets[0], next.core);
  return next;
}

export function reviseAll(state) {
  state.plans ||= {};
  for (const n of state.active) revisePlan(state, n);
  for (const n of Object.keys(state.plans)) if (!state.active.includes(n)) delete state.plans[n];
}

export const planOf = (state, name) => state.plans?.[name] || null;

// A betrayal condition met: the ally is now the biggest threat left in the
// planner's division, and the season is late.
export function betrayalReady(state, name, ally) {
  const plan = planOf(state, name);
  if (!plan?.betrayal?.some(b => b.ally === ally) || stageOf(state) !== 'late') return false;
  const rivals = state.active.filter(n => n !== name && state.division[n] === state.division[name]);
  const top = rivals.sort((a, b) => threatTo(state, name, b) - threatTo(state, name, a))[0];
  return top === ally;
}

export { gs };
