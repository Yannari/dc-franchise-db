// ══════════════════════════════════════════════════════════════════════
// rr/talk.js — who talks, where, and when: the catalogue played on the clock
// ══════════════════════════════════════════════════════════════════════
//
// Spec §6 and docs/ridonculous-race-scenes.md "Flow". The resolver calls these as the
// clock moves: the partners at every stretch, two teams at every overlap, a room when
// three or more teams are held together. Candidates are the catalogue's kinds whose
// moment is now and whose `when` is true, plus the next step of every open thread for
// the people here, plus any scene a previous one chained. The pacing caps are checked
// before an ending is chosen, so a capped ending is never decided and then hidden.
//
// Each function returns the scenes it played; `scenes.extra` is the minutes the team at
// the centre lost (or won) to them, for the resolver to add to its stretch.
import { SCENES, playScene, whenOf, prepare, interviewAfter, pairKey } from './scenes.js';
import { threadSteps, advanceThreads } from './threads.js';
import { see } from './knowledge.js';
import { getBond } from '../bonds.js';
import { S } from './state.js';

const ONE = 0.6, TWO = 0.25;              // partner moments at a stretch: one 60%, two 25%, none 15%
const PAIR_CAP = 3;                       // the same two people (of different teams), moments per leg
const ROOM_WINDOW = 45;                   // one room per stretch per 45 minutes
const MEET = 0.2, MEET_THREAD = 0.3, MEET_MAX = 0.7;    // a meeting airs a moment: 20%, more when a thread waits on them
const THREAD_PULL = 3;                    // a storyline's next step outweighs a passing moment
// At a stretch, besides the partners (1): the locals there (5), money (6), the body (9), the place (10).
const STRETCH_FAMILIES = [1, 5, 6, 9, 10];
// played by the mechanics that decide them (money.js, chill.js), never offered as talk
const EMITTED = new Set(['beg', 'borrow', 'repay', 'surrender', 'reward', 'call-home']);
const OVERLAP_FAMILIES = [2, 4, 5, 6, 7, 8];
const BLOWUPS = { snap: null, 'old-wound': ['explodes'], blame: ['blow-up'], shove: ['shove'] };

const people = (st, id) => (id && st.teams[id] ? [st.teams[id].a, st.teams[id].b] : []);
const idOf = x => (x && typeof x === 'object' ? x.id : x);
const thisLeg = st => st.scenes.filter(s => s.leg === st.leg);

// An ending is warm when it raises the bond between the two teams (read once from the fx
// source: a positive `fx.teams`, an `fx.ally`). Used for the sabotage cap.
const WARM = {};
function warm(kind, e) {
  const k = `${kind.id}/${e}`;
  if (!(k in WARM)) {
    const src = String(kind._endings[e].fx || '');
    WARM[k] = /fx\.teams\([^,]+,[^,]+,\s*\d/.test(src) || /fx\.ally\(/.test(src);
  }
  return WARM[k];
}

export function blowUpUsed(state, tid) {
  return thisLeg(state).some(s => s.data.team === tid && s.kind in BLOWUPS
    && (!BLOWUPS[s.kind] || BLOWUPS[s.kind].includes(s.data.ending)));
}
const REPEAT = 0.3;                       // each earlier play of a kind for this team this leg
function damp(state, kindId, tid) {
  const n = thisLeg(state).filter(s => s.kind === kindId && s.data.team === tid).length;
  return REPEAT ** n;
}
const lovers = ctx => (ctx.people?.length >= 2 ? ctx.people.slice(0, 2) : [ctx.A, ctx.C]);
const partners = (st, x, y) => Object.values(st.teams).some(t => (t.a === x && t.b === y) || (t.a === y && t.b === x));
function pairCount(state, x, y) {
  return thisLeg(state).filter(s => s.data.talk && s.data.family !== 13 && s.who.includes(x) && s.who.includes(y)).length;
}

// The endings this scene may not have here, or 'all' when the scene itself is capped.
// A chained scene continues the moment that caused it (a confession said aloud is answered):
// it isn't held to the pair or romance caps, only to the blow-up and sabotage ones.
function banned(state, ctx, kind) {
  prepare(ctx);
  if (ctx.cause != null) return bannedEndings(state, ctx, kind);
  const who = ctx.people?.length ? ctx.people : [ctx.A, ctx.B, ctx.C, ctx.D].filter(Boolean);
  // the same two people of different teams: at most three moments a leg (partners are together all leg)
  for (const x of who) for (const y of who) {
    if (x < y && !partners(state, x, y) && pairCount(state, x, y) >= PAIR_CAP) return 'all';
  }
  // one romance beat per person per leg
  if (kind.family === 4) {
    const ls = lovers(ctx);
    if (thisLeg(state).some(s => s.data.family === 4 && (s.data.facts?.lovers || []).some(n => ls.includes(n)))) return 'all';
  }
  return bannedEndings(state, ctx, kind);
}

function bannedEndings(state, ctx, kind) {
  const out = new Set();
  // one blow-up per team per leg
  if (kind.id in BLOWUPS && blowUpUsed(state, ctx.tid)) {
    for (const e of BLOWUPS[kind.id] || kind.endings) out.add(e);
  }
  // nothing warm between two teams on the leg one sabotaged the other
  const sab = state.sabotaged || {};
  if (ctx.tid && ctx.oid && ((sab[ctx.tid]?.by === ctx.oid && sab[ctx.tid]?.leg === state.leg) || (sab[ctx.oid]?.by === ctx.tid && sab[ctx.oid]?.leg === state.leg))) {
    for (const e of kind.endings) if (warm(kind, e)) out.add(e);
  }
  if (out.size >= kind.endings.length) return 'all';
  return out;
}

function pickEnding(kind, ctx, rng, ban) {
  const es = kind.endings.filter(e => !ban.has(e));
  const ws = es.map(e => { const w = kind._endings[e].w; return Math.max(0, typeof w === 'function' ? w(ctx) : (w ?? 1)); });
  const sum = ws.reduce((a, b) => a + b, 0);
  if (!(sum > 0)) return es[0] ?? null;
  let r = rng() * sum;
  for (let i = 0; i < es.length; i++) { r -= ws[i]; if (r <= 0) return es[i]; }
  return es.at(-1);
}

// Play one candidate under the caps, then let the threads, the interviews and the chains read it.
function tryPlay(state, ctx, kindId, rng, out, { gate = true } = {}) {
  const kind = SCENES[kindId];
  if (!kind) return null;
  if (gate && whenOf(kind, ctx) <= 0) return null;
  const ban = banned(state, ctx, kind);
  if (ban === 'all') return null;
  const ending = pickEnding(kind, ctx, rng, ban);
  if (!ending) return null;
  const sc = playScene(ctx, kindId, rng, { ending });
  if (!sc) return null;
  sc.data.talk = true;
  out.push(sc);
  out.extra = (out.extra || 0) + (ctx.extra || 0);      // may be negative: a gain
  ctx.extra = 0;
  advanceThreads(state, sc);
  const iv = interviewAfter(state, sc, rng);
  if (iv) { out.push(iv); advanceThreads(state, iv); }
  return sc;
}

function draw(cands, rng) {
  const sum = cands.reduce((a, c) => a + c.w, 0);
  if (!(sum > 0)) return null;
  let r = rng() * sum;
  for (const c of cands) { r -= c.w; if (r <= 0) return c; }
  return cands.at(-1);
}

// Each candidate's weight at its best moment here (the moment it will be played at).
function bestMoment(kind, ctx, moments) {
  let best = 0, at = null;
  for (const m of moments) {
    ctx.moment = m;
    const w = whenOf(kind, ctx);
    if (w > best) { best = w; at = m; }
  }
  return { w: best, moment: at };
}

function typesOf(stretch) { return stretch?.types || (stretch?.sides || []).flatMap(s => s.types || []); }

function momentsAt(state, id, stretch) {
  const m = [];
  if (stretch?.first) m.push('arrive');                 // the place's first stretch: the arrival
  switch (stretch?.kind) {
    case 'travel':
      m.push('travel', 'quiet');
      if (stretch.mode === 'flight') m.push('plane', 'wait', 'airport');
      if ((stretch.cost || 0) > 0) m.push('fare');
      break;
    case 'either': m.push('either', 'tip'); break;
    case 'botch': m.push('botch-pick', 'tip', 'botch-watch'); break;
    case 'allin': case 'task': m.push('tip'); break;
    case 'mat': m.push('mat', 'quiet'); break;
    default: m.push('quiet'); break;
  }
  const at = state.attempts?.[id]?.[stretch?.id];
  if (at?.fails >= 1) m.push('fail');
  if (at && at.attempts > at.fails) m.push('pass');
  const t = state.teams[id];
  if (typesOf(stretch).some(x => ['nerve', 'heights', 'water'].includes(x)) && Math.min(S(t.a, 'boldness'), S(t.b, 'boldness')) < 6) m.push('fear');
  return m;
}

function eventAt(state, id, stretch) {
  const at = state.attempts?.[id]?.[stretch?.id];
  return { fails: at?.fails || 0, passed: !!(at && at.attempts > at.fails) };
}

const baseCtx = (state, id, other, stretch, t, api, extra = {}) => ({
  state, team: { id }, other: other ? { id: other } : null, stretch, t, api,
  present: extra.present || [id, ...(other ? [other] : [])], event: eventAt(state, id, stretch), moment: null, ...extra,
});

// Chained scenes queued for a team: the ones with no other team (or whose other is here).
function takeChains(state, id, others) {
  const q = state.chained?.[id];
  if (!q?.length) return [];
  const out = [];
  for (let i = q.length - 1; i >= 0; i--) {
    const c = q[i];
    const needsOther = ['teams', 'group'].includes(SCENES[c.kind]?.cast);
    if (!needsOther || (c.other && others.includes(c.other))) { out.unshift(c); q.splice(i, 1); }
  }
  return out;
}

function playChain(state, c, id, stretch, t, api, rng, out, present) {
  const kind = SCENES[c.kind];
  const ctx = baseCtx(state, id, kind.cast === 'teams' ? c.other : null, stretch, t, api, { cause: c.cause, present });
  ctx.moment = kind.moments[0] ?? null;
  // a romance chain still needs the two to be able to be a couple (its own gate)
  return tryPlay(state, ctx, c.kind, rng, out, { gate: kind.family === 4 });
}

// ── The partners, at a stretch ──
export function talkAtStretch(state, team, stretch, t, api, rng) {
  const id = idOf(team);
  const out = [];
  out.extra = 0;
  for (const c of takeChains(state, id, [])) playChain(state, c, id, stretch, t, api, rng, out, [id]);
  const r = rng();
  const n = r < ONE ? 1 : r < ONE + TWO ? 2 : 0;
  const moments = momentsAt(state, id, stretch);
  const mine = people(state, id);
  const played = new Set();
  // who else is here (a gloat needs an audience; a side can be chosen by watching)
  const present = [id, ...((api?.here?.(stretch?.id, t)) || []).map(x => x.id).filter(x => x !== id && state.teams[x])];
  for (let k = 0; k < n; k++) {
    const cands = [];
    for (const kind of Object.values(SCENES)) {
      if (!STRETCH_FAMILIES.includes(kind.family) || ['teams', 'group', 'don'].includes(kind.cast) || EMITTED.has(kind.id) || played.has(kind.id)) continue;
      const ctx = baseCtx(state, id, null, stretch, t, api, { present });
      const b = bestMoment(kind, ctx, moments);
      if (b.w > 0) cands.push({ kind: kind.id, w: b.w * damp(state, kind.id, id), moment: b.moment });
    }
    for (const s of threadSteps(state, mine)) {
      const kind = SCENES[s.kindId];
      if (!kind || ['teams', 'group'].includes(kind.cast) || played.has(kind.id)) continue;
      const ctx = baseCtx(state, id, null, stretch, t, api, kind.family === 4 ? { people: s.who, present } : { present });
      const b = bestMoment(kind, ctx, moments);
      if (b.w > 0) cands.push({ kind: kind.id, w: s.weight * THREAD_PULL, moment: b.moment, people: kind.family === 4 ? s.who : null });
    }
    // a capped candidate is skipped and the next one drawn
    while (cands.length) {
      const c = draw(cands, rng);
      if (!c) break;
      cands.splice(cands.indexOf(c), 1);
      const ctx = baseCtx(state, id, null, stretch, t, api, c.people ? { people: c.people, present } : { present });
      ctx.moment = c.moment;
      if (tryPlay(state, ctx, c.kind, rng, out)) { played.add(c.kind); break; }
    }
  }
  return out;
}

// ── Two teams at one place ──
export function talkAtOverlap(state, team, others, stretch, t, api, rng) {
  const id = idOf(team);
  const out = [];
  out.extra = 0;
  const ids = others.map(idOf).filter(o => o && o !== id && state.teams[o]);
  state.metAt ||= {};
  for (const c of takeChains(state, id, ids)) playChain(state, c, id, stretch, t, api, rng, out, [id, ...ids]);
  // at the Chill Zone the race is over: only what belongs on the mat (a console, a gloat, an accusation)
  const moments = stretch?.kind === 'mat' ? ['mat']
    : ['overlap', ...(stretch?.capacity ? ['queue'] : []), ...(stretch?.mode === 'flight' ? ['airport', 'plane'] : [])];
  for (const o of ids) {
    const key = `${state.leg}|${stretch?.id}|${pairKey(id, o)}`;
    if (state.metAt[key]) continue;
    state.metAt[key] = true;
    // the first time these two teams ever meet (size-up reads it; `see` below records the meeting)
    const firstMeet = !state.seen?.[id]?.[o];
    see(state, id, o, state.leg, t, stretch?.id, false);
    const cands = [];
    // both ways round: either team can be the one who acts
    for (const [a, b] of [[id, o], [o, id]]) {
      for (const kind of Object.values(SCENES)) {
        if (kind.cast !== 'teams' || !OVERLAP_FAMILIES.includes(kind.family)) continue;
        const ctx = baseCtx(state, a, b, stretch, t, api, { firstMeet });
        const bm = bestMoment(kind, ctx, moments);
        if (bm.w > 0) cands.push({ kind: kind.id, w: bm.w * damp(state, kind.id, a), moment: bm.moment, a, b, firstMeet });
      }
    }
    const both = [...people(state, id), ...people(state, o)];
    let pull = 0;
    for (const s of threadSteps(state, both)) {
      const kind = SCENES[s.kindId];
      if (!kind || kind.cast !== 'teams') continue;
      const a = people(state, id).includes(s.who[0]) ? id : o;
      const b = a === id ? o : id;
      const extra = kind.family === 4 ? { people: s.who } : {};
      const ctx = baseCtx(state, a, b, stretch, t, api, extra);
      const bm = bestMoment(kind, ctx, moments);
      if (bm.w > 0) { cands.push({ kind: kind.id, w: s.weight * THREAD_PULL, moment: bm.moment, a, b, people: extra.people }); pull += s.weight; }
    }
    const total = cands.reduce((s, c) => s + c.w, 0);
    if (rng() >= Math.min(MEET_MAX, MEET * Math.min(1, total) + MEET_THREAD * pull)) continue;
    while (cands.length) {
      const c = draw(cands, rng);
      if (!c) break;
      cands.splice(cands.indexOf(c), 1);
      const ctx = baseCtx(state, c.a, c.b, stretch, t, api, { firstMeet, ...(c.people ? { people: c.people } : {}) });
      ctx.moment = c.moment;
      if (tryPlay(state, ctx, c.kind, rng, out)) break;
    }
  }
  return out;
}

function roomMoment(stretch) {
  if (stretch?.closed) return 'closed';
  if (stretch?.mode === 'flight') return 'plane';
  if (stretch?.mode === 'bus') return 'bus';
  if (stretch?.capacity) return 'queue';
  if (stretch?.kind === 'mat') return 'mat-crowd';
  if (stretch?.kind === 'botch' || stretch?.kind === 'either') return 'watching';
  return 'queue';
}

// ── Three or more teams held together: one room ──
export function talkAtWait(state, present, stretch, t, api, rng, moment = null) {
  const ids = [...new Set(present.map(idOf))].filter(id => state.teams[id]);
  const out = [];
  out.extra = 0;
  if (ids.length < 3) return out;
  state.roomsAt ||= {};
  const key = `${state.leg}|${stretch?.id}|${moment || roomMoment(stretch)}|${Math.floor(t / ROOM_WINDOW)}`;
  if (state.roomsAt[key]) return out;
  state.roomsAt[key] = true;
  const all = ids.flatMap(id => people(state, id));
  const seat = [];
  const add = n => { if (seat.length < 4 && !seat.includes(n)) seat.push(n); };
  for (const s of threadSteps(state, all)) if (seat.length + s.who.filter(n => !seat.includes(n)).length <= 4) s.who.forEach(add);
  const pairs = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const x = all[i], y = all[j];
    if (people(state, ids.find(id => people(state, id).includes(x))).includes(y)) continue;
    if (pairCount(state, x, y) >= PAIR_CAP) continue;     // a pair already used up this leg isn't seated together
    pairs.push({ x, y, b: Math.abs(getBond(x, y)) });
  }
  pairs.sort((p, q) => q.b - p.b || (p.x + p.y).localeCompare(q.x + q.y));
  for (const p of pairs) { if (seat.length + [p.x, p.y].filter(n => !seat.includes(n)).length <= 4) { add(p.x); add(p.y); } }
  const teamOf = n => ids.find(id => people(state, id).includes(n));
  if (seat.length < 2) return out;           // every pair here has had its moments this leg
  const tid = teamOf(seat[0]);
  const oid = seat.map(teamOf).find(x => x !== tid) || ids.find(x => x !== tid);
  const m = moment || roomMoment(stretch);
  const cands = [];
  for (const kind of Object.values(SCENES)) {
    if (kind.family !== 3) continue;
    const ctx = baseCtx(state, tid, oid, stretch, t, api, { present: ids, people: seat });
    ctx.moment = m;
    const w = whenOf(kind, ctx);
    if (w > 0) cands.push({ kind: kind.id, w });
  }
  while (cands.length) {
    const c = draw(cands, rng);
    if (!c) break;
    cands.splice(cands.indexOf(c), 1);
    const ctx = baseCtx(state, tid, oid, stretch, t, api, { present: ids, people: seat });
    ctx.moment = m;
    if (tryPlay(state, ctx, c.kind, rng, out)) break;
  }
  return out;
}

// ── The end of a leg: every team gets at least two partner moments ──
// `places` (id -> 1-based place) chooses the scene that fits the result; `at` (id ->
// { stretch, t }) is where and when the team was last (the mat).
export function closeLegTalk(state, leg, rng, { places = {}, at = {} } = {}) {
  const out = [];
  out.extra = 0;
  const ids = Object.keys(at).length ? Object.keys(at) : state.order.filter(id => !state.gone.includes(id));
  const n = ids.length;
  for (const id of ids) {
    if (!state.teams[id]) continue;
    const count = () => state.scenes.filter(s => s.leg === leg && s.data.family === 1 && s.data.team === id).length;
    const place = places[id];
    const fit = place == null ? 'bond-moment' : place <= Math.ceil(n / 3) ? 'celebrate' : place > n - Math.ceil(n / 3) ? 'blame' : 'bond-moment';
    const order = [fit, 'bond-moment', 'celebrate'];
    for (let guard = 0; count() < 2 && guard < 4; guard++) {
      let done = false;
      for (const kindId of order) {
        const ctx = baseCtx(state, id, null, { id: at[id]?.stretch ?? 'mat', kind: 'mat' }, at[id]?.t ?? null, null,
          { event: { last: place === n, first: place === 1, passed: true, fails: place === n ? 2 : 0 } });
        ctx.moment = 'mat';
        if (tryPlay(state, ctx, kindId, rng, out, { gate: false })) { done = true; break; }
      }
      if (!done) break;
    }
  }
  if (state.metAt) for (const k of Object.keys(state.metAt)) if (k.startsWith(`${leg}|`)) delete state.metAt[k];
  if (state.roomsAt) for (const k of Object.keys(state.roomsAt)) if (k.startsWith(`${leg}|`)) delete state.roomsAt[k];
  if (state.chained) state.chained = {};
  return out;
}
