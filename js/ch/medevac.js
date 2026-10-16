// ══════════════════════════════════════════════════════════════════════
// ch/medevac.js — a medical exit, as the moment it is
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16: "same we need a certain focus on medevac too" (after a quit that was "barely a moment").
//   medical-exam   the medic looks at it, with a friend at their side. 'cleared': they can keep going, but one
//                  more bad landing and they're done (the sign); 'out': the medic has already decided.
//   medical        TJ says it, under the MEDICAL tape (exits.js medical)
//   medical-house  the goodbye: friends gutted; somebody who quietly sees one less threat, which the friends see.
// An injury that was cleared can still end it on a later day (season.js dayExits: lingering), so a medevac
// often grows out of an injury the viewer has been watching.
import { gs } from '../core.js';
import { getBond, addBond } from '../bonds.js';
import { S, addScene } from './state.js';
import { nudge } from './mind.js';
import { remember } from './rel.js';
import { medical } from './exits.js';
import { threatRead } from './respect.js';

const pop = (n, d) => { gs.popularity ||= {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; };
const friendOf = (state, n) => state.active.filter(o => o !== n && getBond(n, o) >= 1.5).sort((x, y) => getBond(n, y) - getBond(n, x))[0] || null;

/** The medic clears a bad injury: a scare the viewer sees, and remembers if it ends things later. */
export function medicalScare(state, n) {
  const inj = state.injury?.[n];
  if (!inj) return;
  const friend = friendOf(state, n);
  if (friend) addBond(n, friend, 0.3);
  nudge(state, n, 'confidence', -0.3);
  inj.scared = state.ep;
  addScene(state, 'medical-exam', [n, ...(friend ? [friend] : [])], { part: inj.part, sev: inj.sev, verdict: 'cleared', friend }, [n, ...(friend ? [friend] : [])], 'public');
}

/** The medevac itself: the exam, TJ, the goodbye. */
export function medevac(state, n) {
  const inj = state.injury?.[n] || { part: 'knee', sev: 2 };
  const friend = friendOf(state, n);
  const again = !!inj.scared;
  addScene(state, 'medical-exam', [n, ...(friend ? [friend] : [])], { part: inj.part, sev: inj.sev, verdict: 'out', again, friend }, state.active, 'public');
  medical(state, n);
  pop(n, 1);   // nobody blames a body for giving out; the fans feel for them
  const friends = state.active.filter(o => getBond(n, o) >= 2).sort((x, y) => getBond(n, y) - getBond(n, x)).slice(0, 2);
  // somebody who measures the house in threats, and just lost one
  const relieved = state.active.filter(o => !friends.includes(o) && getBond(o, n) <= 0.5 && S(o, 'strategic') >= 6 && threatRead(state, n) >= 6)
    .sort((x, y) => getBond(x, n) - getBond(y, n))[0] || null;
  for (const o of friends) nudge(state, o, 'morale', -0.6);
  if (relieved) for (const o of friends) { addBond(o, relieved, -0.3); remember(o, relieved, 'glad-my-friend-left', 0.5); }
  addScene(state, 'medical-house', [n, ...friends, ...(relieved ? [relieved] : [])], { friends, relieved, part: inj.part }, state.active, 'villa');
}
