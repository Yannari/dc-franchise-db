// ══════════════════════════════════════════════════════════════════════
// ss/missions.js — the Voice's secret missions
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §7. The Voice calls somebody to the confessional and hands
// them a job with a deadline (the prime), a reward, and often a price for
// failing: a clue about their own secret on the table. Every real mission was
// one of these families: a fake relationship or feud the house must believe; a
// seduction; a deception; making something happen (get X nominated, make X
// lose); a forfeit. Success is judged on what the HOUSE believes or what
// actually happened, never on a coin.
//
// Archetypes (franchise rules, CLAUDE.md, and the user's 2026-10-23 loosening
// for the house): nice archetypes may fake a couple, lie for fun and keep a
// straight face; they never take a sabotage. Neutrals sabotage only with
// strategic >= 6 and loyalty <= 4.
//
// Pure: takes the state and the hunt's context `{ stat, bond, rng, week, archetype }`.

import { mint } from './kitty.js';
import { secretOf, showClue, addEvidence } from './hunt.js';

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };
const VILLAIN = ['villain', 'mastermind', 'schemer'];
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
const canSabotage = (ctx, n) => {
  const a = ctx.archetype?.(n);
  if (VILLAIN.includes(a)) return true;
  if (NICE.includes(a)) return false;
  return st(ctx, n, 'strategic') >= 6 && st(ctx, n, 'loyalty') <= 4;
};

/** The mission families, with who they suit and how they are judged. */
export const MISSION_TYPES = {
  'fake-couple': { pair: true, judged: 'belief', reward: [5000, 10000], fit: n => ['social', 'boldness'],
    text: (a, b) => `Make the whole house believe that ${a} and ${b} are falling for each other.`, belief: 'We are a couple' },
  'fake-feud': { pair: true, judged: 'belief', reward: [3000, 6000], fit: () => ['boldness', 'strategic'],
    text: (a, b) => `${a} and ${b}: make the house believe you cannot stand each other.`, belief: 'We hate each other' },
  seduction: { pair: false, target: true, judged: 'bond', reward: [3000, 8000], fit: () => ['social', 'boldness'],
    text: (a, _b, t) => `${a}, make ${t} fall for you this week, without ${t} knowing why.` },
  deception: { pair: false, judged: 'belief', reward: [3000, 7000], fit: () => ['strategic', 'boldness'],
    text: a => `${a}, make the house believe you have a secret contact with the outside world.`, belief: 'I am in contact with the outside' },
  'get-nominated': { pair: false, target: true, judged: 'nominated', reward: [3000, 6000], sabotage: true, fit: () => ['strategic', 'social'],
    text: (a, _b, t) => `${a}, get ${t} nominated this week. Nobody may know you were asked.` },
  forfeit: { pair: false, judged: 'endurance', reward: [1000, 4000], fit: () => ['temperament', 'endurance'],
    text: a => `${a}, wear the Voice's costume and serve the house breakfast every morning until the prime.` },
};

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
const fitOf = (ctx, n, type) => MISSION_TYPES[type].fit(n).reduce((s, k) => s + st(ctx, n, k), 0);

export function missionsOf(state) { state.missions ||= []; return state.missions; }

/**
 * Monday: the Voice hands out this week's missions (1–2). Returns the acts.
 * Nobody gets two at once; partners in a shared secret are never paired.
 */
export function handOutMissions(state, ctx, { house = [], count = null } = {}) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const list = missionsOf(state);
  const busy = new Set(list.filter(m => m.status === 'active').flatMap(m => m.holders));
  const free = house.filter(n => !busy.has(n));
  const n = count ?? (rng() < 0.45 ? 2 : 1);
  const acts = [];
  for (let i = 0; i < n && free.length >= 2; i++) {
    const types = Object.keys(MISSION_TYPES);
    const type = pick(types, rng);
    const T = MISSION_TYPES[type];
    const cands = free.filter(x => !T.sabotage || canSabotage(ctx, x)).sort((a, b) => fitOf(ctx, b, type) - fitOf(ctx, a, type));
    if (!cands.length) continue;
    const a = cands[Math.floor(rng() * Math.min(3, cands.length))];
    const others = free.filter(x => x !== a && !(secretOf(state, a)?.holders || []).includes(x));
    const b = T.pair ? others.sort((x, y) => fitOf(ctx, y, type) - fitOf(ctx, x, type))[0] : null;
    if (T.pair && !b) continue;
    const target = T.target ? pick(house.filter(x => x !== a && x !== b), rng) : null;
    const holders = [a, b].filter(Boolean);
    const reward = T.reward[0] + Math.round(rng() * ((T.reward[1] - T.reward[0]) / 500)) * 500;
    const m = { id: `m${week}-${list.length}`, week, type, holders, target, text: T.text(a, b, target), reward, status: 'active', deadlineWeek: week };
    list.push(m);
    for (const h of holders) { const k = free.indexOf(h); if (k >= 0) free.splice(k, 1); }
    acts.push({ type: 'ss-mission', week, mission: { ...m },
      beats: [{ text: `The Voice gives ${holders.join(' and ')} a secret mission.`, players: holders, badgeText: 'MISSION', badgeClass: 'gold', part: 'mission' }] });
  }
  return acts;
}

/**
 * During the week, a mission is PLAYED: a fake couple looks like one, so the
 * house starts to suspect it (and might buzz it, which wins the mission).
 */
export function playMissions(state, ctx, { house = [] } = {}) {
  for (const m of missionsOf(state).filter(x => x.status === 'active' && x.week === (ctx.week ?? 0))) {
    const T = MISSION_TYPES[m.type];
    if (T.judged !== 'belief' || !T.belief) continue;
    const perf = m.holders.reduce((s, h) => s + st(ctx, h, 'social') + st(ctx, h, 'strategic'), 0) / (m.holders.length * 20);
    for (const v of house.filter(x => !m.holders.includes(x))) {
      // The act reads as real to the unperceptive.
      const fooled = clamp(perf * 0.9 - st(ctx, v, 'intuition') / 10 * 0.45 + 0.25);
      m.belief ||= {};
      m.belief[v] = Math.round(fooled * 100) / 100;
      // ...and somebody fooled may start to think it IS the holders' secret.
      if (fooled > 0.55 && m.holders[0]) addEvidence(state, ctx, v, m.holders[0], { strength: 0.12, how: 'mission', toward: T.belief });
    }
  }
}

/**
 * The prime: every active mission is judged and revealed. `nominees` = this
 * week's nominations. A failure costs a clue on the holder's own secret.
 */
export function settleMissions(state, ctx, { house = [], nominees = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const acts = [];
  for (const m of missionsOf(state).filter(x => x.status === 'active' && x.deadlineWeek <= week)) {
    const T = MISSION_TYPES[m.type];
    let won;
    if (T.judged === 'belief') {
      const vals = Object.values(m.belief || {});
      won = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length >= 0.5 : false;
    } else if (T.judged === 'bond') {
      won = (ctx.bond?.(m.target, m.holders[0]) ?? 0) + (st(ctx, m.holders[0], 'social') - 5) * 0.3 + (rng() - 0.5) * 2 >= 2.5;
    } else if (T.judged === 'nominated') {
      won = nominees.includes(m.target);
    } else {
      won = rng() < clamp(0.35 + (st(ctx, m.holders[0], 'temperament') + st(ctx, m.holders[0], 'endurance')) / 40);
    }
    m.status = won ? 'won' : 'failed';
    let paid = 0, clue = null;
    if (won) for (const h of m.holders) paid += mint(state, h, m.reward, `mission: ${m.type}`, week);
    else if (m.holders[0] && secretOf(state, m.holders[0]) && !secretOf(state, m.holders[0]).found && rng() < 0.6) {
      clue = showClue(state, ctx, { holder: m.holders[0], how: 'mission', house });
    }
    acts.push({ type: 'ss-mission-result', week, mission: { ...m }, won, paid, clue: clue?.clue || null,
      beats: [{ text: won ? `${m.holders.join(' and ')} pulled off the Voice's mission and win $${m.reward.toLocaleString('en-US')}${m.holders.length > 1 ? ' each' : ''}.`
        : `${m.holders.join(' and ')} failed the Voice's mission.${clue ? ' A clue about their secret goes on the table.' : ''}`,
      players: m.holders, badgeText: won ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED', badgeClass: won ? 'gold' : 'red', part: 'mission' }] });
  }
  return acts;
}
