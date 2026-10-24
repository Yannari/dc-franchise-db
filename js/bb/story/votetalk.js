// ══════════════════════════════════════════════════════════════════════
// bb/story/votetalk.js — the eviction, before it happens: which conversations air, from the ballots
// ══════════════════════════════════════════════════════════════════════
//
// Total Drama's vote talk (td/story/director.js votePlan / voteTalk: the plan, the swing, the target),
// on Big Brother's week. The season read of 2026-10-13 found weeks where a 5-3 vote aired with no
// plan, no swing and no campaign on screen: the vote just happened. Every week now airs, between the
// veto meeting and the live vote, up to three conversations TRUE of the ballots the engine cast:
//   plan   two voters on the winning side settle it, and say why (the HOH's target, the alliance that
//          called it, a competition threat, a grudge, or only the numbers)
//   swing  the vote that nearly went the other way: somebody talked them into it (swing.yes), or the
//          nominee going home asked for it and did not get the promise (swing.no)
//   read   the nominee going home, with their closest person: sure they are safe (a voter they trust
//          is lying to them), scrambling (it is close), or knowing
// Words only: it reads the week, it changes nothing.
import { gs } from '../../core.js';
import { getBond, getPerceivedBond } from '../../bonds.js';

const closest = (n, pool) => pool.slice().sort((x, y) => getBond(n, y) - getBond(n, x) || (x < y ? -1 : 1))[0] || null;

// ── a Block Buster week ──
// The talk airs before the Block Buster, so it is about all three in the chairs: who a pair wants out,
// and who goes instead if that one wins it (the user, 2026-10-24: "if the target is really x, what if x
// wins blockbuster, we go y... like the real show"). It holds whichever way the arena goes, and it is
// true of the ballots: a voter who evicts E over F has E ahead of F in their order, so their target and
// backup can never contradict the vote the arena's result then leaves them casting.
//   bb.plan(.hoh)  two on the winning side: {target}, else {backup} ({third} the one left)
//   bb.split       one from each side, who want different people ({mine} is a's, {theirs} b's)
function blockBusterTalk(week, here, ballots, out, other) {
  const three = (week.blockBeforeSafety || []).filter(Boolean);
  const voter = b => b.voter && here.has(b.voter) && !three.includes(b.voter) && b.voter !== week.hoh;
  const against = ballots.filter(b => b.evict === out && voter(b)).map(b => b.voter);
  const keep = ballots.filter(b => b.evict !== out && voter(b)).map(b => b.voter);
  // who a set of voters wants out first: least liked first, the one they evict ahead of the one they keep
  const orderFor = (vs, evicts, spares, first = null) => {
    const like = x => vs.reduce((s, v) => s + getBond(v, x), 0) / Math.max(1, vs.length);
    const o = three.slice().sort((x, y) => like(x) - like(y) || (x < y ? -1 : 1));
    if (first && first !== spares && o.includes(first)) o.splice(o.indexOf(first), 1), o.unshift(first);
    const e = o.indexOf(evicts), s = o.indexOf(spares);
    if (e > s) [o[e], o[s]] = [o[s], o[e]];
    return o;
  };
  const talks = [];
  let best = null;
  for (let i = 0; i < against.length; i++) for (let j = i + 1; j < against.length; j++) {
    const s = getBond(against[i], against[j]);
    if (!best || s > best.s) best = { s, a: against[i], b: against[j] };
  }
  if (best) {
    // the Head of Household's target leads, when it is one they would vote out and they are with the HOH
    const aim = (week.acts || []).find(a => a?.type === 'nominations')?.target;
    const withHoh = week.hoh && here.has(week.hoh) && getBond(best.a, week.hoh) + getBond(best.b, week.hoh) >= 2;
    const o = orderFor([best.a, best.b], out, other, withHoh ? aim : null);
    const byHoh = withHoh && o[0] === aim;
    talks.push({ kind: byHoh ? 'bb.plan.hoh' : 'bb.plan', who: { a: best.a, b: best.b }, data: { target: o[0], backup: o[1], third: o[2] },
      why: [`${best.a} and ${best.b} want ${o[0]} out${byHoh ? `, as ${week.hoh} does` : ''}.`, `If ${o[0]} wins the Block Buster, it is ${o[1]}.`] });
  }
  // somebody who ends up on the other side of the vote, with the friend on the winning side they disagree with
  const used = new Set(talks.flatMap(t => Object.values(t.who)));
  let pair = null;
  for (const a of keep.filter(n => !used.has(n))) for (const b of against.filter(n => !used.has(n))) {
    const s = getBond(a, b);
    if (s >= 1 && (!pair || s > pair.s)) pair = { s, a, b };
  }
  if (pair) {
    const mine = orderFor([pair.a], other, out)[0], theirs = orderFor([pair.b], out, other)[0];
    if (mine !== theirs) talks.push({ kind: 'bb.split', who: { a: pair.a, b: pair.b }, data: { mine, theirs },
      why: [`${pair.a} wants ${mine} out; ${pair.b} wants ${theirs}.`] });
  }
  return talks;
}

/** The vote talk for a week's eviction act: [{ kind, who: {a,b}, data, why }]. */
export function voteTalkFor(act, week, present) {
  const here = new Set(present || []);
  const ballots = (act?.ballots || []).filter(b => b && b.voter && b.evict);
  const noms = (act?.nominees || week?.finalNominees || []).filter(Boolean);
  const out = act?.evicted || week?.evicted;
  if (ballots.length < 2 || noms.length < 2 || !out || !here.has(out)) return [];
  const other = noms.find(n => n !== out) || null;
  // a Block Buster week talks before the arena: about three, with a plan for each way it goes
  const buster = (week?.acts || []).find(a => a?.type === 'safety' && a.winner);
  if (buster && (week.blockBeforeSafety || []).length >= 3) return blockBusterTalk(week, here, ballots, out, other);
  const against = ballots.filter(b => b.evict === out).map(b => b.voter).filter(n => here.has(n));
  const keep = ballots.filter(b => b.evict !== out).map(b => b.voter).filter(n => here.has(n));
  const talks = [];

  // ── the plan ──
  if (against.length >= 2) {
    const nom = (week.acts || []).find(a => a?.type === 'nominations');
    const cer = (week.acts || []).find(a => a?.type === 'veto-ceremony');
    const aim = [nom?.backdoorTarget, nom?.target, cer?.replacement].find(n => n && noms.includes(n));
    const bloc = ballots.find(b => b.evict === out && b.assignment?.kind === 'bloc' && b.assignment.by)?.assignment.by || null;
    const named = bloc && (gs.namedAlliances || []).some(a => a?.name === bloc) ? bloc : null;
    const st = gs.bb?.stats?.[out] || {};
    const wins = (st.hohWins || 0) + (st.vetoWins || 0);
    const grudge = against.filter(v => getBond(v, out) <= -2);
    const hoh = week.hoh && week.hoh !== out ? week.hoh : null;
    // every reason that is TRUE of this vote; the plan says the one this season has heard least
    // (an alliance calls most votes in a Big Brother house, so 'the alliance said so' every week was true
    // and dull: the HOH's target, a threat or a grudge, when also true, take their turn)
    const reasons = [named && 'bloc', aim === out && hoh && 'hoh', wins >= 2 && 'threat', grudge.length >= 2 && 'grudge'].filter(Boolean);
    const heard = ((gs.bb ||= {}).voteTalkHeard ||= {});
    const why = reasons.length ? reasons.slice().sort((x, y) => (heard[x] || 0) - (heard[y] || 0))[0] : 'numbers';
    heard[why] = (heard[why] || 0) + 1;
    // the two of them: for a bloc, two of its members; for a grudge, two who have one; else the closest pair
    const al = named ? (gs.namedAlliances || []).find(a => a?.name === named) : null;
    const pool = why === 'grudge' ? grudge : al ? against.filter(v => (al.members || []).includes(v)) : against;
    const base = (pool.length >= 2 ? pool : against);
    let best = null;
    for (let i = 0; i < base.length; i++) for (let j = i + 1; j < base.length; j++) {
      const s = getBond(base[i], base[j]);
      if (!best || s > best.s) best = { s, a: base[i], b: base[j] };
    }
    if (best) talks.push({ kind: `plan.${why}`, who: { a: best.a, b: best.b },
      data: { target: out, ...(other ? { other } : {}), ...(named ? { group: named } : {}) },
      why: [`${best.a} and ${best.b} are voting ${out} out.`, why === 'bloc' ? `${named} called it.` : why === 'hoh' ? `${out} is ${hoh}'s target.`
        : why === 'threat' ? `${out} has won ${wins} competitions.` : why === 'grudge' ? 'It is personal for both of them.' : 'Nobody organised it: the house just landed there.'] });
  }

  // ── the swing ──
  const moved = ballots.find(b => b.evict === out && b.changed && b.changedBy && b.changedBy !== b.voter && b.changedBy !== out
    && here.has(b.voter) && here.has(b.changedBy));
  const torn = ballots.filter(b => b.evict === out && here.has(b.voter) && Math.abs(Number(b.margin) || 9) < 0.6)
    .sort((x, y) => Math.abs(Number(x.margin)) - Math.abs(Number(y.margin)))[0];
  const used = new Set(talks.flatMap(t => Object.values(t.who)));
  if (moved && !used.has(moved.voter)) {
    // the persuader may BE the nominee who stays: then no line names {other} (they would talk about themselves)
    talks.push({ kind: 'swing.yes', who: { a: moved.voter, b: moved.changedBy }, data: { target: out, ...(other && other !== moved.changedBy ? { other } : {}) },
      why: [`${moved.voter} was going to vote the other way.`, `${moved.changedBy} changed ${moved.voter}'s mind.`] });
  } else if (torn && !used.has(torn.voter)) {
    talks.push({ kind: 'swing.no', who: { a: torn.voter, b: out }, data: { target: out, ...(other ? { other } : {}) },
      why: [`${torn.voter} nearly kept ${out}.`, `${out} asked for the vote and did not get a promise.`] });
  }

  // ── the one going home ──
  const friend = closest(out, keep.length ? keep : [...here].filter(n => n !== out && !noms.includes(n)));
  if (friend) {
    const liars = against.filter(v => getPerceivedBond(out, v) >= 2);
    const lead = against.length - keep.length;
    const read = liars.length && lead >= 1 ? 'safe' : lead <= 1 ? 'scramble' : 'knows';
    talks.push({ kind: `read.${read}`, who: { a: out, b: friend }, data: { ...(other ? { other } : {}) },
      why: read === 'safe' ? [`${out} is counting on ${liars.slice(0, 2).join(' and ')}.`, `${liars.length === 1 ? 'That vote is' : 'Those votes are'} going the other way.`]
        : read === 'scramble' ? [`${out} knows it is close.`] : [`${out} knows the votes are not there.`] });
  }
  return talks;
}
