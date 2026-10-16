// ══════════════════════════════════════════════════════════════════════
// ch/wishlist.js — who they would pick, and who they never would
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16: "event of who they want to eliminate could be interesting i dont wanna fight thom hes
// too dangerous i wanna fight x if u pick me im gonna pick u in the arena and u gonna go home that should have
// some influence right?". The threat to a face is vote.js's leverage threat (state.promises); this is the other
// half: somebody at risk this week tells a friend who they would call out if the house sends them in, and who
// they would never touch.
//
// It has weight: having said it, they lean to that pick at the call-out (callout.js calloutTerms: wishlist), and
// the one they fear hears they are feared. And it can get out: a friend with loose lips passes it on, and the one
// named as the easy pick comes to say so to their face, and votes accordingly.
import { getBond, addBond } from '../bonds.js';
import { S, addScene, inDivision } from './state.js';
import { remember, intimidated } from './rel.js';
import { nudge } from './mind.js';
import { arenaRead } from './respect.js';

export function wishlist(state, rng, { division, immune = [] }) {
  const pool = inDivision(state, division).filter(n => !immune.includes(n));
  if (pool.length < 4) return null;
  const read = n => arenaRead(state, n);
  // the strongest one in the division, the one everybody would rather not draw
  const feared = [...pool].sort((x, y) => read(y) - read(x))[0];
  // somebody worried enough about the vote to plan the call-out out loud
  const n = pool.filter(x => x !== feared && read(feared) - read(x) >= 1.2).sort((x, y) => (state.mind[y]?.paranoia || 0) - (state.mind[x]?.paranoia || 0))[0];
  if (!n || rng() >= 0.3) return null;
  const friend = state.active.filter(o => o !== n && getBond(n, o) >= 2).sort((x, y) => getBond(n, y) - getBond(n, x))[0];
  if (!friend) return null;
  // the pick: the weakest they think they can beat, and do not like
  const pick = pool.filter(x => x !== n && x !== feared && x !== friend).sort((x, y) => (read(x) - getBond(n, x) * 0.3) - (read(y) - getBond(n, y) * 0.3))[0];
  if (!pick) return null;
  (state.wishlist ||= {})[n] = { pick, avoid: feared, ep: state.ep };
  intimidated(feared, n, 0.4);
  // loose lips: a friend low on loyalty, or close to the one named, passes it on
  const leaks = rng() < Math.min(0.6, Math.max(0.05, (10 - S(friend, 'loyalty')) * 0.05 + Math.max(0, getBond(friend, pick)) * 0.06));
  addScene(state, 'arena-wishlist', [n, friend], { pick, avoid: feared, leaks }, [n, friend], 'private');
  if (leaks) {
    addBond(pick, n, -0.8); remember(pick, n, 'wants-me-in-the-arena', 1.1);
    nudge(state, n, 'paranoia', 0.5);
    addBond(n, friend, -0.4); remember(n, friend, 'leaked-my-plan', 0.8);
    addScene(state, 'wishlist-leak', [pick, n], { friend, avoid: feared }, state.active, 'villa');
  }
  return { by: n, pick, avoid: feared, leaks };
}
