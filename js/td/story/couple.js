// ══════════════════════════════════════════════════════════════════════
// td/story/couple.js — a couple between their engine moments (lines/n-couple.js)
// ══════════════════════════════════════════════════════════════════════
// The user's plan, step 3 (2026-10-12): deeper romance, "competing priorities, vulnerability, awkward disagreements,
// earned reconciliation", and 2026-10-14 "don't forget romance". Measured first on the story-step-3 matrix: a couple
// had no romance scene in 522 of its 739 episodes on screen, one in 194, two in 23; the engine's romance moments are
// mostly flirts, and nothing carried a couple from one episode to the next.
//
// One beat a couple a stretch of the day, chosen by what is true for them now:
//   priority  a tribal night where their ballots name different people (ep.votingLog): one asks for the other's vote
//   mend      one to three episodes after an aired disagreement about {c}, both still here: they make it right
//   disagree  a doesn't trust c (bond -1 or worse) and b is c's friend (2 or better): awkward, then quiet; it is recorded
//   open      every third episode or so: a says something real
//   daily     otherwise, every other episode: a small moment that is only theirs
// Every beat moves their bond (fx), and what it starts is recorded only if it airs (commit.js onCommit).
// Proposed to the day's budget (director.js selectScenes): priority and disagree are story, mend is a due payoff, open
// is story, daily is colour.
import { gs, seasonConfig } from '../../core.js';
import { getBond } from '../../bonds.js';
import { onCommit } from './commit.js';

const key = (x, y) => (x < y ? `${x}||${y}` : `${y}||${x}`);
const book = () => (((gs.tdStory ||= {}).couples ||= {}));

/** The active couples whose two people are both in this camp. */
export function couplesIn(members) {
  if (seasonConfig?.romance === 'disabled') return [];
  return (gs.showmances || []).filter(sh => sh.phase !== 'broken-up' && (sh.players || []).length === 2 && sh.players.every(p => members.includes(p)))
    .map(sh => [...sh.players].sort());
}

/**
 * Proposals for this stretch of the day: [{ at, item, src, tier }]. `write` is the director's draft writer
 * (writeStory with draft and the stretch's spot avoidance); `factsFor(who)` the director's facts for a cast.
 */
export function coupleScenes(ep, camp, members, phase, nextN, write, factsFor, { tribalTonight = false } = {}) {
  const out = [];
  const B = book();
  const ballotOf = x => (ep.votingLog || []).find(v => v.voter === x)?.voted || null;
  // the day's engine moments here: a couple whose deal ends today, or one of whom writes the other's name tonight, gets no
  // warm beat on top (read 2026-10-14, carnival ep 9: "I don't think our deal works anymore" and then, the same afternoon,
  // "We fixed it. Not perfectly. But it's fixed", the night Hannah wrote Marissa's name)
  const block = ep.campEvents?.[camp], day = Array.isArray(block) ? block : [...(block?.pre || []), ...(block?.post || [])];
  const SOUR = /^(deal\.(end|double)|recruit\.poach|betray|caught\.)/;
  const sour = (x, y) => ballotOf(x) === y || ballotOf(y) === x
    || day.some(ev => SOUR.test(ev?.scene?.kind || '') && (ev.players || []).includes(x) && (ev.players || []).includes(y));
  for (const [x, y] of couplesIn(members)) {
    if (sour(x, y)) continue;
    const rec = (B[key(x, y)] ||= { tension: null, opened: -99, daily: -99 });
    const tries = [];
    // a tribal night with different names (only after the challenge, when the camp knows it is voting)
    if (phase === 'post' && tribalTonight) {
      const bx = ballotOf(x), by = ballotOf(y);
      if (bx && by && bx !== by && bx !== y && by !== x) {
        const a = getBond(x, bx) <= getBond(y, by) ? x : y, b = a === x ? y : x;
        tries.push({ kind: 'priority', tier: 'story', who: { a, b }, data: { mine: ballotOf(a), other: ballotOf(b) }, fx: [[a, b, -0.3]], why: `${a} and ${b} are writing different names tonight.` });
      }
    }
    if (phase === 'pre') {
      // a disagreement that aired, one to three episodes ago, with the person it was about still here
      const t = rec.tension;
      if (t && !t.mended && ep.num - t.ep >= 1 && ep.num - t.ep <= 3 && members.includes(t.c)) {
        const a = t.by, b = a === x ? y : x;
        tries.push({ kind: 'mend', tier: 'due', who: { a, b }, data: { friend: t.c }, fx: [[a, b, 1]], why: `${a} and ${b} make it right after disagreeing about ${t.c}.`,
          then: () => { t.mended = ep.num; } });
      }
      // somebody one of them distrusts and the other likes
      if (!t || (t.mended && ep.num - t.mended >= 3) || ep.num - t.ep > 4) {
        for (const [a, b] of [[x, y], [y, x]]) {
          const c = members.filter(m => m !== x && m !== y && getBond(a, m) <= -1 && getBond(b, m) >= 2)
            .sort((p, q) => (getBond(a, p) - getBond(b, p)) - (getBond(a, q) - getBond(b, q)) || p.localeCompare(q))[0];
          if (!c) continue;
          tries.push({ kind: 'disagree', tier: 'story', who: { a, b, c }, data: {}, fx: [[a, b, -0.5], [a, c, -0.3]], why: `${a} doesn't trust ${c}, and ${b} is ${c}'s friend.`,
            then: () => { rec.tension = { ep: ep.num, c, by: a, mended: null }; } });
          break;
        }
      }
      if (ep.num - rec.opened >= 3) {
        const a = (ep.num % 2 ? x : y), b = a === x ? y : x;
        tries.push({ kind: 'open', tier: 'story', who: { a, b }, data: {}, fx: [[a, b, 0.75]], why: `${a} tells ${b} something real.`, then: () => { rec.opened = ep.num; } });
      }
    }
    if (ep.num - rec.daily >= 2) {
      const a = ((ep.num + (phase === 'post' ? 1 : 0)) % 2 ? x : y), b = a === x ? y : x;
      tries.push({ kind: 'daily', tier: 'colour', who: { a, b }, data: {}, fx: [[a, b, 0.4]], why: `${a} and ${b}, just the two of them.`, then: () => { rec.daily = ep.num; } });
    }
    // the first one this stretch can write: one beat a couple
    for (const t of tries) {
      const facts = { ...factsFor(t.who), pair: true, third: !!t.who.c, tribal: phase === 'post' && tribalTonight, mine: !!t.data.mine, other: !!t.data.other, friend: !!t.data.friend };
      const w = write(`couple.${t.kind}`, 'any', t.who, t.data, facts, { ep: ep.num, camp, phase, n: nextN(), place: t.kind === 'daily' ? 'aside' : 'secret', unique: true });
      if (!w) continue;
      const item = { story: true, kind: `couple.${t.kind}`, storyType: 'showmance', step: t.kind, players: Object.values(t.who), lines: w.lines, text: w.text, lineId: w.lineId,
        scene: { kind: `couple.${t.kind}`, who: t.who, data: t.data, spot: w.spot || null }, badgeText: t.kind === 'priority' ? 'Torn' : t.kind === 'disagree' ? 'Trouble In Paradise' : t.kind === 'mend' ? 'Making Up' : 'Showmance',
        badgeClass: t.kind === 'priority' || t.kind === 'disagree' ? 'red' : 'green', why: [t.why], fx: t.fx };
      out.push({ at: phase === 'pre' ? 0.52 : 0.62, item: t.then ? onCommit(item, t.then) : item, src: 'couple', tier: t.tier });
      break;
    }
  }
  return out;
}
