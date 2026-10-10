// ══════════════════════════════════════════════════════════════════════
// td/story/arcs.js — stories that run across episodes, and the camp's free time
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10: "more connected storylines ... I wanna feel like a real series ... revenge
// storyline, maybe romance storyline, friendship storyline". The mentor arc (director.js) showed the
// shape: two people, a scene an episode, each one starting where the last left off, and an ending the
// game state decides. This runs six more of them (lines/n-arcs.js has the scenes):
//   avenge  a's closest friend was voted out, and a knows who wrote the name
//   cling   a won't leave b's side, until b needs air
//   envy    a can't stand how well everything is going for b
//   slack   b coasts while a does the work, until a calls it out and b has a challenge to answer with
//   coach   a teaches b, who can't talk to people, to talk to c
//   fake    a plays a showmance with b for the numbers (villain-eligible a, romance on, romanticCompat)
// Casting reads the engine (bonds, the vote log, popularity, stats, the challenge order, showmances);
// an ending reads it again. Each step moves the bonds of the people in it (FX), so an arc partly earns
// its own ending: a smother scene lowers the bond the talk later reads.
//
// gs.tdStory.arcs2 = { list: [{ type, a, b, c, data, step, last, start, done }], n: { [type]: count } }
// One step of an arc an episode (a step marked `same` may follow the previous one the same day), at
// most two arc scenes a camp a phase, one new arc a camp an episode, two of each type a season, and
// nobody in two open arcs at once. An arc that can't air for four episodes is dropped.
import { gs, players, seasonConfig } from '../../core.js';
import { getBond } from '../../bonds.js';
import { pStats as pStatsOf, romanticCompat } from '../../players.js';
import { factsFor } from '../script/facts.js';
import { challengeOf } from './record.js';

const state = () => ((gs.tdStory ||= {}).arcs2 ||= { list: [], n: {} });
const st = x => { try { return pStatsOf(x) || {}; } catch { return {}; } };
const archOf = x => (players.find(p => p.name === x) || {}).archetype || '';
const byName = (x, y) => x.localeCompare(y);
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);
// the franchise rule: villains scheme; neutrals only with strategic >= 6 and loyalty <= 4; nice never
const canScheme = x => VILLAIN.has(archOf(x)) || (!NICE.has(archOf(x)) && (st(x).strategic ?? 5) >= 6 && (st(x).loyalty ?? 5) <= 4);
const inShowmance = x => (gs.showmances || []).some(s => s.phase !== 'broken-up' && (s.players || []).includes(x));
const together = (x, y) => (gs.showmances || []).some(s => s.phase !== 'broken-up' && (s.players || []).includes(x) && (s.players || []).includes(y));
const pop = x => gs.popularity?.[x] || 0;
const histOf = num => (gs.episodeHistory || []).find(h => h.num === num);
// the closest friend of x here, not in `not`
const friendOf = (x, members, not = [], min = 2) => members.filter(m => m !== x && !not.includes(m) && getBond(x, m) >= min)
  .sort((p, q) => getBond(x, q) - getBond(x, p) || byName(p, q))[0] || null;

// each step: its phase ('pre', 'post' or 'any'), whether it may follow the previous step the same episode, and cast(arc, members, ep, camp)
// → { who, data, outcome, place } or null (not today)
const DEFS = {
  avenge: {
    start(members, ep) {
      const prev = histOf(ep.num - 1);
      const X = prev?.eliminated;
      if (!X || !prev.votingLog?.length) return null;
      const wrote = prev.votingLog.filter(v => v.voted === X && v.voter && v.voter !== X).map(v => v.voter);
      // a knows who wrote it when few did; a whole camp writing one name is nobody's in particular
      if (!wrote.length || wrote.length > 3) return null;
      const a = members.filter(m => !wrote.includes(m) && getBond(m, X) >= 4).sort((p, q) => getBond(q, X) - getBond(p, X) || byName(p, q))[0];
      if (!a) return null;
      const rival = wrote.filter(w => members.includes(w)).sort((p, q) => getBond(a, p) - getBond(a, q) || byName(p, q))[0];
      if (!rival) return null;
      return { a, b: rival, data: { friend: X, rival } };
    },
    // a stays; the rival leaving is the ending, not the end of the arc
    keep: (arc, alive) => alive.has(arc.a),
    steps: [
      { id: 'hurt', phase: 'pre', cast: (arc, m) => { const b = friendOf(arc.a, m, [arc.b]); return b && m.includes(arc.b) ? { who: { a: arc.a, b }, place: 'secret' } : null; } },
      { id: 'plan', phase: 'pre', skipIf: (arc, alive) => !alive.has(arc.b),
        cast: (arc, m) => { const b = friendOf(arc.a, m, [arc.b, arc.lastB]) || friendOf(arc.a, m, [arc.b]); return b && m.includes(arc.b) ? { who: { a: arc.a, b }, place: 'secret' } : null; } },
      { id: 'end', phase: 'pre', cast: (arc, m, ep, camp, alive) => {
        if (alive.has(arc.b)) return m.includes(arc.b) ? { who: { a: arc.a, b: arc.b }, outcome: 'face', place: 'aside' } : null;
        const out = (gs.episodeHistory || []).find(h => h.eliminated === arc.b);
        const paid = (out?.votingLog || []).some(v => v.voter === arc.a && v.voted === arc.b);
        // the one a confided in hears how it ended
        const b = (arc.lastB && m.includes(arc.lastB) ? arc.lastB : null) || friendOf(arc.a, m, [], 1);
        return b ? { who: { a: arc.a, b }, outcome: paid ? 'paid' : 'gone', place: 'secret' } : null;
      } },
    ],
  },
  cling: {
    start(members) {
      const CLINGY = new Set(['underdog', 'goat', 'loyal-soldier', 'floater', 'showmancer', 'wildcard']);
      for (const a of members.filter(x => CLINGY.has(archOf(x))).sort((p, q) => (st(p).social ?? 5) - (st(q).social ?? 5) || byName(p, q))) {
        const b = members.filter(x => x !== a && getBond(a, x) >= 3 && (st(x).social ?? 5) >= (st(a).social ?? 5) + 2 && !together(a, x))
          .sort((p, q) => getBond(a, q) - getBond(a, p) || byName(p, q))[0];
        if (b) return { a, b };
      }
      return null;
    },
    steps: [
      { id: 'cling', phase: 'pre', cast: arc => ({ who: { a: arc.a, b: arc.b }, place: 'aside' }) },
      { id: 'smother', phase: 'any', cast: (arc, m) => { const c = friendOf(arc.b, m, [arc.a], 1); return c ? { who: { a: arc.a, b: arc.b, c }, place: 'aside' } : null; } },
      // b keeps it kind when the friendship is strong and b's temper holds (narrative threshold only)
      { id: 'talk', phase: 'pre', cast: arc => ({ who: { a: arc.a, b: arc.b }, outcome: getBond(arc.a, arc.b) >= 2 && (st(arc.b).temperament ?? 5) >= 4 ? 'kind' : 'snap', place: 'secret' }) },
    ],
  },
  envy: {
    start(members) {
      const pairs = [];
      for (const a of members) for (const b of members) {
        if (a === b || archOf(a) === 'hero') continue;
        const bd = getBond(a, b);
        if (bd < -2 || bd > 1 || pop(b) - pop(a) < 3) continue;
        pairs.push([a, b, pop(b) - pop(a)]);
      }
      pairs.sort((x, y) => y[2] - x[2] || byName(x[0], y[0]) || byName(x[1], y[1]));
      for (const [a, b] of pairs) if (friendOf(a, members, [b])) return { a, b };
      return null;
    },
    steps: [
      { id: 'snipe', phase: 'pre', cast: (arc, m) => { const c = friendOf(arc.a, m, [arc.b]); return c ? { who: { a: arc.a, b: arc.b, c }, place: 'public' } : null; } },
      { id: 'confront', phase: 'any', cast: arc => ({ who: { a: arc.a, b: arc.b }, place: 'aside' }) },
      { id: 'end', phase: 'pre', cast: arc => ({ who: { a: arc.a, b: arc.b }, outcome: getBond(arc.a, arc.b) >= 0 ? 'honest' : 'worse', place: 'aside' }) },
    ],
  },
  slack: {
    preMerge: true,
    start(members) {
      const lazy = members.filter(x => ['floater', 'goat', 'wildcard', 'chaos-agent'].includes(archOf(x)) && (st(x).physical ?? 5) + (st(x).endurance ?? 5) <= 9)
        .sort((p, q) => (st(p).physical ?? 5) + (st(p).endurance ?? 5) - (st(q).physical ?? 5) - (st(q).endurance ?? 5) || byName(p, q))[0];
      if (!lazy) return null;
      const a = members.filter(x => x !== lazy && ['challenge-beast', 'hothead', 'hero', 'loyal-soldier', 'villain', 'mastermind'].includes(archOf(x))
        && (st(x).physical ?? 5) + (st(x).endurance ?? 5) >= 13 && getBond(x, lazy) <= 2)
        .sort((p, q) => (st(q).physical ?? 5) + (st(q).endurance ?? 5) - (st(p).physical ?? 5) - (st(p).endurance ?? 5) || byName(p, q))[0];
      return a ? { a, b: lazy } : null;
    },
    steps: [
      { id: 'notice', phase: 'pre', cast: (arc, m) => { const c = friendOf(arc.a, m, [arc.b], 0); return c ? { who: { a: arc.a, b: arc.b, c }, place: 'public' } : null; } },
      { id: 'callout', phase: 'pre', cast: arc => ({ who: { a: arc.a, b: arc.b }, place: 'aside' }) },
      // the same day: b had the challenge to answer with, and the engine's order says how it went
      { id: 'effort', phase: 'post', same: true, cast: (arc, m, ep, camp) => {
        const ch = challengeOf(ep, camp);
        const i = ch?.order?.indexOf(arc.b) ?? -1;
        if (i < 0) return { drop: true };
        const chal = ep.challengeLabel || 'the challenge';
        return { who: { a: arc.a, b: arc.b }, data: { chal }, outcome: i < ch.order.length / 2 ? 'tried' : 'not', place: 'aside' };
      } },
    ],
  },
  coach: {
    start(members) {
      const b = members.filter(x => (st(x).social ?? 5) <= 4).sort((p, q) => (st(p).social ?? 5) - (st(q).social ?? 5) || byName(p, q))[0];
      if (!b) return null;
      const a = members.filter(x => x !== b && NICE.has(archOf(x)) && (st(x).social ?? 5) >= 7 && getBond(x, b) >= 0)
        .sort((p, q) => (st(q).social ?? 5) - (st(p).social ?? 5) || byName(p, q))[0];
      return a ? { a, b } : null;
    },
    steps: [
      { id: 'offer', phase: 'pre', cast: arc => ({ who: { a: arc.a, b: arc.b }, place: 'aside' }) },
      { id: 'practice', phase: 'pre', cast: (arc, m) => {
        const c = m.filter(x => x !== arc.a && x !== arc.b && Math.abs(getBond(arc.b, x)) <= 1).sort((p, q) => (st(q).social ?? 5) - (st(p).social ?? 5) || byName(p, q))[0];
        if (!c) return null;
        arc.c = c;
        return { who: { a: arc.a, b: arc.b, c }, place: 'aside' };
      } },
      // b made a friend here besides the coach
      { id: 'done', phase: 'any', cast: (arc, m) => {
        const made = m.some(x => x !== arc.a && x !== arc.b && getBond(arc.b, x) >= 2);
        const c = arc.c && m.includes(arc.c) ? arc.c : null;
        if (!made && !c) return null;
        return { who: made ? { a: arc.a, b: arc.b } : { a: arc.a, b: arc.b, c }, outcome: made ? 'made' : 'awkward', place: 'aside' };
      } },
    ],
  },
  fake: {
    minEp: 3,
    start(members) {
      if ((seasonConfig?.romance || 'enabled') === 'disabled') return null;
      for (const a of members.filter(x => canScheme(x) && !inShowmance(x)).sort((p, q) => (st(q).strategic ?? 5) - (st(p).strategic ?? 5) || byName(p, q))) {
        const b = members.filter(x => x !== a && !inShowmance(x) && getBond(a, x) >= 1 && romanticCompat(a, x))
          .sort((p, q) => getBond(a, q) - getBond(a, p) || byName(p, q))[0];
        if (b && friendOf(a, members, [b], 3)) return { a, b, data: { mark: b } };
      }
      return null;
    },
    steps: [
      { id: 'plan', phase: 'pre', cast: (arc, m) => { const b = friendOf(arc.a, m, [arc.b], 3); if (b) arc.ally = b; return b && m.includes(arc.b) ? { who: { a: arc.a, b }, place: 'secret' } : null; } },
      { id: 'flirt', phase: 'any', cast: arc => ({ who: { a: arc.a, b: arc.b }, place: 'aside' }) },
      { id: 'end', phase: 'pre', cast: (arc, m) => {
        // only the ally told in the plan scene knows it was fake
        const b = arc.ally && arc.ally !== arc.b && m.includes(arc.ally) ? arc.ally : null;
        if (!b) return null;
        return { who: { a: arc.a, b }, outcome: together(arc.a, arc.b) ? 'real' : getBond(arc.a, arc.b) >= 5 ? 'guilt' : 'working', place: 'secret' };
      } },
    ],
  },
};
// What each step does to the people in it (the user, 2026-10-10: these are events, so they change bonds).
// [role, role, delta] pairs over the scene's `who` (plus 'rival', the avenge arc's target); 'pop' is popularity.
// director.js applies them, on the live episode only (applyStoryFx).
const FX = {
  'avenge.hurt': [['a', 'b', 1]], 'avenge.plan': [['a', 'b', 1], ['a', 'rival', -1]],
  'avenge.end.face': [['a', 'b', -2]], 'avenge.end.paid': [['a', 'b', 0.5]], 'avenge.end.gone': [['a', 'b', 0.5]],
  'cling.cling': [['a', 'b', 0.5]], 'cling.smother': [['a', 'b', -1], ['b', 'c', 1]],
  'cling.talk.kind': [['a', 'b', 1]], 'cling.talk.snap': [['a', 'b', -2]],
  'envy.snipe': [['a', 'b', -1]], 'envy.confront': [['a', 'b', -1]], 'envy.end.honest': [['a', 'b', 2]], 'envy.end.worse': [['a', 'b', -2]],
  'slack.notice': [['a', 'b', -0.5]], 'slack.callout': [['a', 'b', -1]], 'slack.effort.tried': [['a', 'b', 2], ['pop', 'b', 1]], 'slack.effort.not': [['a', 'b', -1]],
  'coach.offer': [['a', 'b', 1]], 'coach.practice': [['b', 'c', 1]], 'coach.done.made': [['a', 'b', 1], ['pop', 'b', 1]], 'coach.done.awkward': [['a', 'b', 0.5]],
  'fake.plan': [['a', 'b', 1]], 'fake.flirt': [['a', 'b', 1.5]],
};
// roles → names: [[x, y, d]] for bonds, [['pop', x, d]] for popularity
export function fxOf(spec, who, extra = {}) {
  const name = r => who[r] || extra[r] || null;
  return (spec || []).map(([x, y, d]) => x === 'pop' ? ['pop', name(y), d] : [name(x), name(y), d]).filter(([x, y]) => x && y && x !== y);
}
const TYPES = Object.keys(DEFS);
const WHY = {
  avenge: arc => `${arc.a} hasn't forgiven ${arc.b} for voting out ${arc.data.friend}.`,
  cling: arc => `${arc.a} won't leave ${arc.b}'s side.`,
  envy: arc => `${arc.a} can't stand how well everything is going for ${arc.b}.`,
  slack: arc => `${arc.a} is doing the work ${arc.b} isn't.`,
  coach: arc => `${arc.a} is teaching ${arc.b} to talk to people.`,
  fake: arc => `${arc.a} is playing a showmance with ${arc.b} for the numbers.`,
};
const BADGE = { avenge: ['Revenge', 'red'], cling: ['Too Close', 'blue'], envy: ['Jealousy', 'red'], slack: ['Dead Weight', 'red'], coach: ['Lessons', 'gold'], fake: ['Showmance?', 'purple'] };

/** The arc scenes due at this camp this phase: [{ at, item }] for director.js to place. `writeStory` is the
 *  director's own (venue words, whether a vote has happened yet, the spots already taken this stretch); `max`
 *  is the room left (an arc that can't air today waits, up to four episodes). */
export function runArcs(ep, camp, members, phase, nextN, writeStory, max = 2) {
  const S = state();
  const out = [];
  const alive = new Set(gs.activePlayers || members);
  const merged = !!(ep.isMerge || gs.isMerged);
  const busy = () => new Set(S.list.filter(x => !x.done).flatMap(x => [x.a, x.b]));
  // a new arc: one a camp an episode, in the morning, the type least told so far first
  if (phase === 'pre' && ep.num >= 2 && !ep.isFinale && S.list.filter(x => !x.done).length < 4 && !S.list.some(x => x.start === ep.num && x.camp === camp)) {
    const order = [...TYPES].sort((x, y) => (S.n[x] || 0) - (S.n[y] || 0) || ((TYPES.indexOf(x) + ep.num) % TYPES.length) - ((TYPES.indexOf(y) + ep.num) % TYPES.length));
    for (const type of order) {
      const def = DEFS[type];
      if ((S.n[type] || 0) >= 2 || (def.preMerge && merged) || ep.num < (def.minEp || 2)) continue;
      const taken = busy();
      const free = members.filter(m => !taken.has(m));
      const c = def.start(free, ep);
      if (!c || taken.has(c.a) || taken.has(c.b)) continue;
      S.list.push({ type, a: c.a, b: c.b, data: c.data || {}, step: 0, last: -1, lastPhase: null, start: ep.num, camp, done: false });
      S.n[type] = (S.n[type] || 0) + 1;
      break;
    }
  }
  for (const arc of S.list) {
    if (arc.done || out.length >= max) continue;
    const def = DEFS[arc.type];
    const keep = def.keep ? def.keep(arc, alive) : alive.has(arc.a) && alive.has(arc.b);
    if (!keep || (def.preMerge && merged)) { arc.done = true; continue; }
    if (!members.includes(arc.a)) continue;
    let s = def.steps[arc.step];
    // a step whose moment has passed is skipped (the rival left before the plan could air)
    while (s?.skipIf?.(arc, alive)) { arc.step++; s = def.steps[arc.step]; }
    if (!s) { arc.done = true; continue; }
    // 'any': the morning or the evening, whichever has room first (a tribal night's evening is full of vote talk)
    if (s.phase !== 'any' && s.phase !== phase) continue;
    // one step an episode, unless this one follows the last the same day
    if (arc.last === ep.num && !(s.same && arc.lastPhase === 'pre' && phase === 'post')) continue;
    if (arc.last >= 0 && ep.num - arc.last > 4) { arc.done = true; continue; }
    const c = s.cast(arc, members, ep, camp, alive);
    if (c?.drop) { arc.done = true; continue; }
    if (!c) continue;
    const data = { ...arc.data, ...(c.data || {}) };
    const who = c.who;
    const w = writeStory(`arc.${arc.type}.${s.id}`, c.outcome || 'any', who, data, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: nextN(), place: c.place || 'aside', unique: 'soft' });
    if (!w) continue;
    if (s.id === 'hurt' || s.id === 'plan') arc.lastB = who.b;
    arc.last = ep.num; arc.lastPhase = phase; arc.step++;
    if (arc.step >= def.steps.length) arc.done = true;
    const ending = c.outcome && c.outcome !== 'any' ? c.outcome : null;
    const fxKey = `${arc.type}.${s.id}${ending ? '.' + ending : ''}`;
    out.push({ at: phase === 'pre' ? 0.34 + out.length * 0.01 : 0.45 + out.length * 0.01, item: { story: true, kind: `arc.${arc.type}.${s.id}${ending ? '.' + ending : ''}`, storyType: 'arc', step: s.id,
      players: [...new Set(Object.values(who))], lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: 'arc', who, data, spot: w.spot || null }, badgeText: BADGE[arc.type][0], badgeClass: BADGE[arc.type][1], why: [WHY[arc.type](arc)],
      fx: fxOf(FX[fxKey], who, { rival: arc.data.rival }) } });
  }
  return out;
}

/** The camp's free time (lines/n-games.js): four people playing something, every other episode a camp. */
export function campGame(ep, camp, members, phase, nextN, writeStory, busy = new Set()) {
  if (phase !== 'pre' || ep.isFinale || members.length < 4) return null;
  const book = ((gs.tdStory ||= {}).games ||= {});
  if (ep.num - (book[camp] ?? -99) < 2) return null;
  // the boldest starts it; their two closest come along; the one they like least is roped in
  const FUN = new Set(['wildcard', 'chaos-agent', 'social-butterfly', 'showmancer', 'goat', 'hothead', 'underdog']);
  const free = members.filter(m => !busy.has(m));
  const pool = free.length >= 4 ? free : members;
  const a = [...pool].sort((p, q) => (FUN.has(archOf(q)) ? 3 : 0) + (st(q).boldness ?? 5) - (FUN.has(archOf(p)) ? 3 : 0) - (st(p).boldness ?? 5) || byName(p, q))[0];
  const rest = pool.filter(m => m !== a).sort((p, q) => getBond(a, q) - getBond(a, p) || byName(p, q));
  if (rest.length < 3) return null;
  const who = { a, b: rest[0], c: rest[1], d: rest[rest.length - 1] };
  const w = writeStory('camp.game', 'any', who, {}, { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), fourth: true }, { ep: ep.num, camp, phase, n: nextN(), place: 'public', unique: true });
  if (!w) return null;
  book[camp] = ep.num;
  return { at: 0.42, item: { story: true, kind: 'camp.game', storyType: 'fun', step: 'game', players: Object.values(who), lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: 'game', who, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [`${a} gets a game going.`],
    // playing together brings the four of them a little closer, the one roped in included
    fx: Object.values(who).flatMap((x, i, all) => all.slice(i + 1).map(y => [x, y, 0.5])) } };
}
