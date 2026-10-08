// ══════════════════════════════════════════════════════════════════════
// td/story/threads.js — what people carry from one episode to the next
// ══════════════════════════════════════════════════════════════════════
//
// The user: "nothing is connected", and Disventure Camp's "Spencer wrote my name even though I had
// his back". After each vote, the episode leaves threads between two people on gs.tdStory.threads:
//   grievance  b wrote a's name at a vote a survived, though they were close (bond >= 2). a knows
//              when few people wrote it (two or fewer) or a found out on camera since
//   debt       b warned a their name was out there, or played an idol for a: a owes b
// Each later episode, one open thread at a camp gets a scene (thr.<kind>.<stage>): 1 it's brought
// up, 2 it's still there, 3 it ends, as the bond says: 'mend' (bond back to 2+), 'war' (-2 or
// worse), otherwise it stays at 2. Words only: the engine already moved the bonds.
import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';

const book = () => ((gs.tdStory ||= {}).threads ||= []);

/** After an episode's vote: record the threads it started (director.js, once per episode). */
export function recordThreads(ep, warned = []) {
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
