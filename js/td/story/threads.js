// ══════════════════════════════════════════════════════════════════════
// td/story/threads.js — what people carry from one episode to the next
// ══════════════════════════════════════════════════════════════════════
//
// The user: "nothing is connected", and Disventure Camp's "Spencer wrote my name even though I had
// his back". After each vote, the episode leaves threads between two people on gs.tdStory.threads:
//   grievance  b wrote a's name at a vote a survived, though they were close (bond >= 2). a knows
//              when few people wrote it (two or fewer) or a found out on camera since
//   debt       b warned a their name was out there, or played an idol for a: a owes b
//   rescue     at a challenge ({chal}), b saved a: a owes b                       (chalmoments.js)
//   wronged    at a challenge, b sabotaged or ditched a, and a saw it
//   rivals     at a challenge, a and b went at each other
// The challenge ones start only from a moment that aired at camp (director.js chm scenes).
// Each later episode, one open thread at a camp gets a scene (thr.<kind>.<stage>): 1 it's brought
// up, 2 it's still there, 3 it ends, as the bond says: 'mend' (bond back to 2+), 'war' (-2 or
// worse), otherwise it stays at 2. Words only: the engine already moved the bonds.
import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';

const book = () => ((gs.tdStory ||= {}).threads ||= []);

/** After an episode's vote: record the threads it started (director.js, once per episode). */
export function recordThreads(ep, warned = [], chm = []) {
  const T = book();
  if (T.some(t => t.ep === ep.num)) return;
  const log = (ep.votingLog || []).filter(v => v.voter && v.voted);
  const counts = {};
  log.forEach(v => { counts[v.voted] = (counts[v.voted] || 0) + 1; });
  for (const v of log) {
    if (v.voted === ep.eliminated || v.voter === v.voted) continue;
    if (getBond(v.voted, v.voter) < 2) continue;
    if (T.some(t => t.kind === 'grievance' && t.a === v.voted && t.b === v.voter && !t.done)) continue;
    T.push({ kind: 'grievance', a: v.voted, b: v.voter, ep: ep.num, stage: 0, known: (counts[v.voted] || 0) <= 2, last: ep.num });
  }
  for (const w of warned) if (w.teller && w.knower !== w.teller && !T.some(t => t.kind === 'debt' && t.a === w.knower && t.b === w.teller && !t.done))
    T.push({ kind: 'debt', a: w.knower, b: w.teller, ep: ep.num, stage: 0, known: true, last: ep.num, how: 'warned' });
  // what happened at the challenge, between two people, that the viewer saw come back to camp
  const open = (kind, a, b) => !T.some(t => t.kind === kind && ((t.a === a && t.b === b) || (kind === 'rivals' && t.a === b && t.b === a)) && !t.done);
  for (const it of chm) {
    const [x, y] = it.players || [];
    if (!x || !y || !it.scene?.data?.two) continue;
    const chal = it.scene.data.chal;
    if (it.step === 'saved' && open('rescue', y, x)) T.push({ kind: 'rescue', a: y, b: x, ep: ep.num, stage: 0, known: true, last: ep.num, how: 'chal', chal });
    if ((it.step === 'sabotage' || it.step === 'betray') && open('wronged', y, x)) T.push({ kind: 'wronged', a: y, b: x, ep: ep.num, stage: 0, known: true, last: ep.num, how: it.step, chal });
    if ((it.step === 'clash' || it.step === 'taunt') && open('rivals', x, y)) T.push({ kind: 'rivals', a: x, b: y, ep: ep.num, stage: 0, known: true, last: ep.num, how: it.step, chal });
  }
  for (const p of ep.idolPlays || []) if (p.playedFor && p.playedFor !== p.player && !T.some(t => t.kind === 'debt' && t.a === p.playedFor && t.b === p.player && !t.done))
    T.push({ kind: 'debt', a: p.playedFor, b: p.player, ep: ep.num, stage: 0, known: true, last: ep.num, how: 'idol' });
}

/** The thread due at this camp this episode: both people here, known, not aired last episode. */
export function threadDue(ep, members) {
  const open = book().filter(t => !t.done && t.known && t.ep < ep.num && members.includes(t.a) && members.includes(t.b) && ep.num - t.last >= 1 && (t.stage === 0 || ep.num - t.last >= 2));
  open.sort((x, y) => (x.stage - y.stage) || (y.ep - x.ep));
  const t = open[0];
  if (!t) return null;
  const bond = getBond(t.a, t.b);
  const end = t.stage >= 1 && (bond >= 2 || bond <= -2 || ep.num - t.ep >= 5);
  const stage = t.stage === 0 ? '1' : end ? (bond >= 2 ? 'mend' : bond <= -2 ? 'war' : 'fade') : '2';
  return { t, stage, commit: () => { t.stage = stage === '1' ? 1 : stage === '2' ? 2 : 3; t.last = ep.num; if (t.stage === 3) t.done = true; } };
}
