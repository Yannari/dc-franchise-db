// ══════════════════════════════════════════════════════════════════════
// ch/fallout.js — the morning after somebody goes home
// ══════════════════════════════════════════════════════════════════════
//
// Big Brother's fallout (js/bb/fallout.js), for a house where the vote is
// public. The single most reliable engine of a real season is somebody working
// out who sent their friend home and spending the next three weeks on it. Four
// questions, answered the morning after the Arena:
//
//   who is hurt      the friends of the one who left, by how close they were
//   who is relieved  and whether they have the sense to hide it
//   who gets blamed  here the ballots are PUBLIC, so the voters are known
//                    exactly; the one who CALLED OUT the loser is blamed hardest;
//                    and an alliance that set the target is blamed only by
//                    those who know it exists (knowledge.js) — the rest blame
//                    the obvious faces
//   who gets credit  the friends who voted another way, said out loud
import { getBond, addBond } from '../bonds.js';
import { S, addScene } from './state.js';
import { nudge } from './mind.js';
import { remember, resentOf } from './rel.js';
import { believedAlliances, knowsTarget } from './knowledge.js';

export function morningAfter(state, { duel, vote, callout, meetings = [] }) {
  const gone = duel.loser;
  const out = { gone, hurt: [], relieved: [], blamed: [], credited: [] };
  // Who sent them: the voters if the one voted in lost; the caller if the one
  // called out lost.
  const lostAsVotedIn = callout && callout.by === gone;
  const culprits = lostAsVotedIn
    ? (vote?.ballots || []).filter(b => b.target === gone).map(b => b.voter)
    : [callout?.by].filter(Boolean);
  const meeting = meetings.find(m => m.target === gone);
  const al = meeting && state.alliances.find(a => a.id === meeting.alliance);
  for (const o of state.active) {
    const close = getBond(o, gone);
    if (close >= 3) {
      nudge(state, o, 'morale', -0.4 - close * 0.15);
      nudge(state, o, 'homesick', 0.3);
      out.hurt.push(o);
      // Blame: the obvious faces, plus the organiser for anyone who knows the plan.
      const blamed = new Set(culprits.filter(c => c !== o && state.active.includes(c)));
      if (al && state.active.includes(al.leader) && al.leader !== o
        && (believedAlliances(state, o)[al.id] || knowsTarget(state, o, al.leader, gone))) blamed.add(al.leader);
      for (const b of blamed) {
        const weight = b === callout?.by && !lostAsVotedIn ? 1.6 : 1;
        addBond(o, b, -0.6 * weight * (close / 5));
        remember(o, b, 'eliminated-ally', 1.2 * weight, { ally: gone });
        out.blamed.push({ by: o, who: b });
      }
      // Credit: friends of the gone who voted another way.
      for (const b of (vote?.ballots || [])) {
        if (b.voter !== o && b.target !== gone && getBond(b.voter, gone) >= 3) {
          remember(o, b.voter, 'stood-by-my-friend', 0.8, { ally: gone });
          out.credited.push({ by: o, who: b.voter });
        }
      }
    } else if (resentOf(o, gone) >= 3) {
      out.relieved.push(o);
      nudge(state, o, 'morale', 0.4);
      // Hiding it takes temperament; showing it costs with the mourners.
      if (S(o, 'temperament') < 5) for (const h of out.hurt) addBond(h, o, -0.5);
    }
  }
  if (out.hurt.length || out.relieved.length) {
    addScene(state, 'morning-after', [...out.hurt.slice(0, 3), ...out.relieved.slice(0, 1)],
      { gone, hurt: out.hurt, relieved: out.relieved, blamed: out.blamed.slice(0, 6) }, state.active, 'villa');
  }
  return out;
}
