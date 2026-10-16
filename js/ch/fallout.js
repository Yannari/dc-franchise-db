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
import { gs } from '../core.js';
import { getBond, addBond } from '../bonds.js';
import { S, addScene } from './state.js';
import { nudge } from './mind.js';
import { remember, resentOf } from './rel.js';
import { believedAlliances, knowsTarget } from './knowledge.js';

export function morningAfter(state, { duel, vote, callout, meetings = [], rng = Math.random, volunteer = false }) {
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
  // How they went: voted in by the house, put in by their own hand, or picked by the one the house voted in
  // (the user, 2026-10-16: Bowie was called out by Manu, and the mourners talked about "the votes")
  const how = lostAsVotedIn ? (volunteer ? 'volunteered' : 'voted') : 'calledout';
  const caller = how === 'calledout' && state.active.includes(callout?.by) ? callout.by : null;
  if (out.hurt.length || out.relieved.length) {
    addScene(state, 'morning-after', [...out.hurt.slice(0, 3), ...out.relieved.slice(0, 1)],
      { gone, hurt: out.hurt, relieved: out.relieved, blamed: out.blamed.slice(0, 6), how, caller }, state.active, 'villa');
  }
  out.payback = payback(state, rng, { gone, how, caller, culprits, hurt: out.hurt });
  return out;
}

// Payback (the user, 2026-10-16: "can people get mad at someone for choosing and eliminating someone they loved?
// can it cause drama and heat?"). The friend who took it hardest goes to the one who did it: the caller, or after
// a vote the voter they trust least. Saying it to a face takes nerve (closeness, boldness, a short fuse); everyone
// else keeps it for the vote, where the grudge above already counts. Said out loud, it costs both of them: the
// two are colder, the one confronted knows they have an enemy and sleeps worse, and the fans like the loyalty.
function payback(state, rng, { gone, how, caller, culprits, hurt }) {
  if (how === 'volunteered') return null;
  const target = o => (how === 'calledout' ? (caller && caller !== o ? caller : null)
    : [...culprits].filter(c => c !== o && state.active.includes(c)).sort((x, y) => getBond(o, x) - getBond(o, y))[0] || null);
  const nerve = o => getBond(o, gone) * 0.35 + S(o, 'boldness') * 0.35 + (10 - S(o, 'temperament')) * 0.3;
  const who = hurt.filter(o => target(o)).sort((x, y) => nerve(y) - nerve(x))[0];
  if (!who) return null;
  if (rng() >= Math.min(0.85, Math.max(0, (nerve(who) - 3) / 5))) return null;
  const at = target(who);
  addBond(who, at, -0.5);
  addBond(at, who, -0.4);
  remember(at, who, 'threatened-me', 0.8, { ally: gone });
  remember(who, at, 'eliminated-ally', 0.4, { ally: gone });
  nudge(state, at, 'paranoia', 0.6);
  nudge(state, who, 'morale', 0.2);
  gs.popularity ||= {}; gs.popularity[who] = (gs.popularity[who] || 0) + 0.3;
  addScene(state, 'payback', [who, at], { gone, how }, state.active, 'villa');
  return { by: who, at };
}
