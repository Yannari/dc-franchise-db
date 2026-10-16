// ══════════════════════════════════════════════════════════════════════
// ch/quit.js — somebody walking out of the game, as the moment it is
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16, on a five-line quit: "this is barely a moment it should be bigger than that with people
// trying to convince them to stay or be happy competition hes gone we shouldnt just be blindsided by it too we
// should see sign from previous episodes wheres the wow effect too and the drama effect".
//
//   wavering   the signs: somebody close to breaking says so, to a friend or to the camera. A quit can only
//              come after a wavering that aired on an earlier day (exits.js dayExits), never out of nowhere.
//   quit-decide  they tell their closest friend first, and the friend tries to talk them out of it. It can work:
//              then they stay, lighter for it, and owe the friend.
//   quit-house the house hears it: friends beg them to stay, and somebody may be openly glad there is one less
//              to beat, which the friends do not forgive.
// Then TJ (exits.js quit), with the QUIT stamp in the viewer.
import { gs } from '../core.js';
import { getBond, addBond } from '../bonds.js';
import { S, addScene } from './state.js';
import { nudge } from './mind.js';
import { remember } from './rel.js';
import { quitRisk } from './exits.js';

const pop = (n, d) => { gs.popularity ||= {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; };
const closest = (state, n) => state.active.filter(o => o !== n).sort((x, y) => getBond(n, y) - getBond(n, x))[0] || null;

/** A day's signs: somebody whose risk of walking out is real says so, at most once in two episodes. */
export function wavering(state, rng) {
  state.wavered ||= {};
  const near = state.active.filter(n => quitRisk(state, n) >= 0.006 && !(state.wavered[n]?.ep >= state.ep - 1))
    .sort((x, y) => quitRisk(state, y) - quitRisk(state, x));
  const n = near[0];
  if (!n || rng() >= 0.6) return null;
  const f = closest(state, n);
  const heard = f && getBond(n, f) >= 2 ? f : null;
  if (heard) { addBond(n, heard, 0.4); remember(n, heard, 'emotional-support', 0.8); nudge(state, n, 'homesick', -0.5); }
  state.wavered[n] = { ep: state.ep, day: state.day };
  addScene(state, 'wavering', [n, ...(heard ? [heard] : [])], { heard }, heard ? [n, heard] : [n], heard ? 'private' : 'confessional');
  return n;
}

/** Has somebody shown the signs on an earlier day? Only then can they walk out. */
export const hasWavered = (state, n) => state.wavered?.[n] && state.wavered[n].day < state.day;

/**
 * The moment before TJ: the friend, then the house. Returns 'stays' when the friend talks them out of it.
 */
export function quitMoment(state, rng, n) {
  const f = closest(state, n);
  const friend = f && getBond(n, f) >= 1.5 ? f : null;
  if (friend) {
    const m = state.mind[n] || {};
    const p = Math.min(0.55, Math.max(0.05, 0.12 + getBond(n, friend) * 0.04 + S(friend, 'social') * 0.025 - Math.max(0, (m.homesick ?? 5) - 6) * 0.05));
    const stays = rng() < p;
    addScene(state, 'quit-decide', [n, friend], { stays }, [n, friend], 'private');
    if (stays) {
      nudge(state, n, 'homesick', -2.5); nudge(state, n, 'morale', 1.5);
      addBond(n, friend, 1); remember(n, friend, 'talked-me-into-staying', 1.4);
      pop(friend, 0.3);
      state.wavered[n] = { ep: state.ep, day: state.day };   // the signs start again from here
      return 'stays';
    }
  }
  // the house: a friend or two pleading, and somebody who is glad and does not hide it well enough
  const pleading = state.active.filter(o => o !== n && getBond(n, o) >= 2).sort((x, y) => getBond(n, y) - getBond(n, x)).slice(0, 2);
  const glad = state.active.filter(o => o !== n && !pleading.includes(o) && (getBond(o, n) <= -1.5 || (S(o, 'strategic') >= 7 && S(n, 'physical') >= 7)))
    .sort((x, y) => getBond(x, n) - getBond(y, n))[0] || null;
  for (const o of pleading) nudge(state, o, 'morale', -0.4);
  if (glad) { for (const o of pleading) { addBond(o, glad, -0.4); remember(o, glad, 'glad-my-friend-left', 0.7); } pop(glad, -0.2); }
  addScene(state, 'quit-house', [n, ...pleading, ...(glad ? [glad] : [])], { pleading, glad, friend }, state.active, 'villa');
  return 'goes';
}
