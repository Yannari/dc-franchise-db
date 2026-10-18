// ══════════════════════════════════════════════════════════════════════
// rr/team.js — inside a team: the snap, the make-up, who leads
// ══════════════════════════════════════════════════════════════════════
//
// Spec §7.2 and the identities doc ("temperament off the task: where team fights
// come from"): under pressure a volatile partner snaps, the bond drops, and every
// task that needs both of them is slower (skill.js teamwork ×0.92) until they make
// up. Exes snap fastest (state.js REL), a grandparent swallows it for the grandchild.
import { REL, S } from './state.js';
import { getBond } from '../bonds.js';
import { playScene } from './scenes.js';

export function snapCheck(state, id, rng) {
  if (state.snapped[id]) return null;
  const t = state.teams[id];
  const stress = Math.max(state.mind[t.a].stress, state.mind[t.b].stress);
  const hot = S(t.a, 'temperament') <= S(t.b, 'temperament') ? t.a : t.b;
  const p = (stress / 100) * ((10 - S(hot, 'temperament')) / 10) * (REL[t.rel]?.snap ?? 1) * 0.15;
  if (rng() >= p) return null;
  const other = hot === t.a ? t.b : t.a;
  return playScene({ state, team: { id }, moment: 'snap', people: [hot, other] }, 'snap', rng);
}

export function makeupCheck(state, id, rng) {
  if (!state.snapped[id]) return null;
  const t = state.teams[id];
  let p = 0.25 + 0.03 * getBond(t.a, t.b);
  if (t.rel === 'exes' || t.rel === 'enemies') p *= 0.6;
  if (rng() >= Math.max(0.05, p)) return null;
  return playScene({ state, team: { id }, moment: 'makeup' }, 'makeup', rng);
}

// An event that can move the lead: the leader hurt (always), a crush (half the time),
// a snap (the other partner's boldness decides), a win (the one who carried it).
export function leaderCheck(state, id, event, rng, subject = null) {
  const t = state.teams[id];
  const lead = state.lead[id];
  const other = lead === t.a ? t.b : t.a;
  let p = 0;
  if (event === 'injury') p = subject === lead ? 1 : 0;
  else if (event === 'crush') p = subject === lead ? 0.5 : 0;
  else if (event === 'snap') p = 0.3 * S(other, 'boldness') / 10;
  else if (event === 'win') p = subject === other ? 0.3 : 0;
  if (!p || rng() >= p) return null;
  return playScene({ state, team: { id }, moment: 'lead', people: [other, lead], event: { cause: event } }, 'leader-shift', rng);
}
