// ══════════════════════════════════════════════════════════════════════
// rr/scenes.js — the scene catalogue as data: register, decide, apply, record
// ══════════════════════════════════════════════════════════════════════
//
// docs/ridonculous-race-scenes.md is the contract between the engine and the
// dialogue. Each kind here is one row of it: when it can fire (`moments` + `when`),
// its endings and what each changes (`fx`). The engine decides the ending FIRST and
// applies it; the words are written later from the record (manual §19). Every
// ending changes something, and `fx` records it in `data.effects`, so nothing is
// cosmetic (CLAUDE.md: every social event has consequences).
import { addScene, S, mayScheme, REL } from './state.js';
import { getBond, addBond } from '../bonds.js';
import { nudgeMind } from './mind.js';
import { perceivedRank, believe } from './knowledge.js';
import { identityOf } from './identities.js';
import { gs } from '../core.js';

import { SCENES, K, register, pairKey } from './scenes/registry.js';

export { SCENES, K, register, pairKey };

const people = (state, id) => (id && state.teams[id] ? [state.teams[id].a, state.teams[id].b] : []);

// ── What a scene may know (the dialogue reads this, never live state; manual §19.2 step 1) ──
// Taken when the scene is played, BEFORE its ending changes anything: how the two stood, where, when.
export const SNAP_KEYS = ['leg', 'phase', 'tod', 'rank', 'band', 'bandX', 'allied', 'rivalry', 'couple', 'rel', 'relFam',
  'identity', 'identityB', 'money', 'broke', 'snapped', 'place', 'stretchKind', 'mode', 'taskTypes', 'fails', 'side', 'lead', 'botcher',
  'relB', 'relFamB', 'brokeB', 'failsB', 'sabKind'];
const ROMANTIC = ['dating', 'married', 'newly-dating', 'on-off', 'once-engaged'];
export const relFamOf = rel => (REL[rel]?.family ? 'family' : ROMANTIC.includes(rel) ? 'romantic' : rel === 'exes' ? 'exes'
  : ['rivals', 'enemies'].includes(rel) ? 'rivals' : 'friends');
export const bandOf = b => (b <= -4 ? 'enemies' : b < -1 ? 'cold' : b >= 3 ? 'friends' : 'neutral');
export function snapOf(st, { tid = null, oid = null, stretch = null, t = null, fails = 0, who = [] } = {}) {
  const [A, B] = people(st, tid), [C, D] = people(st, oid);
  const total = st.totalLegs || Math.max(1, st.leg);
  const f = st.leg / total;
  const across = oid && A ? [A, B].flatMap(x => [C, D].map(y => getBond(x, y))) : null;
  const types = stretch?.types || (stretch?.sides || []).flatMap(s => s.types || []) || [];
  return {
    leg: st.leg,
    phase: f <= 0.34 ? 'early' : f >= 0.67 ? 'late' : 'mid',
    tod: t == null ? null : ((Math.round((st.clock ?? 420) + t) % 1440) + 1440) % 1440,
    rank: tid ? Math.round(perceivedRank(st, tid) * 100) / 100 : null,
    band: A && B ? bandOf(getBond(A, B)) : null,
    bandX: across ? bandOf(across.reduce((s, x) => s + x, 0) / across.length) : null,
    allied: !!(tid && oid && st.alliances.some(al => !al.ended && al.teams.includes(tid) && al.teams.includes(oid))),
    rivalry: tid && oid ? st.rivalry[pairKey(tid, oid)] || 0 : 0,
    couple: (st.couples || []).some(c => !c.ended && who.includes(c.a) && who.includes(c.b)),
    rel: tid ? st.teams[tid].rel : null,
    relFam: tid ? relFamOf(st.teams[tid].rel) : null,
    identity: tid ? st.teams[tid].identity ?? null : null,
    identityB: oid ? st.teams[oid].identity ?? null : null,
    money: tid ? st.money[tid] ?? 0 : null,
    broke: tid ? !(st.money[tid] > 0) : false,
    snapped: !!(tid && st.snapped[tid]),
    place: st.placeNow ?? null,
    stretchKind: stretch?.kind ?? null,
    // how they travel on this stretch (flight, taxi, foot, camel...)
    mode: stretch?.mode ?? null,
    taskTypes: [...new Set(types)],
    fails: fails || 0,
    side: tid && stretch?.id ? st.attempts?.[tid]?.[stretch.id]?.side ?? null : null,
    lead: tid ? st.lead[tid] ?? null : null,
    // who is doing (or just did) this team's Botch or Watch
    botcher: tid ? st.botch?.last?.[tid] ?? null : null,
    // the other team, as it stood: its relationship, its money, how it's doing at this stretch
    relB: oid ? st.teams[oid].rel : null,
    relFamB: oid ? relFamOf(st.teams[oid].rel) : null,
    brokeB: oid ? !(st.money[oid] > 0) : false,
    failsB: oid && stretch?.id ? st.attempts?.[oid]?.[stretch.id]?.fails || 0 : 0,
    // the last sabotage done to this team, as far as anyone knows what it was
    sabKind: tid ? st.sabotaged?.[tid]?.kind ?? null : null,
  };
}

// The context a kind reads: the teams, the place, the moment, and helpers.
export function prepare(ctx) {
  if (ctx._ready) return ctx;
  const st = ctx.state;
  // `flip`: the moment is about the team's second-listed partner (talk.js weighs both partners)
  const pair = people(st, ctx.team?.id);
  const [A, B] = ctx.flip ? [pair[1], pair[0]] : pair;
  const [C, D] = people(st, ctx.other?.id);
  const tid = ctx.team?.id, oid = ctx.other?.id;
  return Object.assign(ctx, {
    _ready: true, A, B, C, D, tid, oid,
    lead: tid ? st.lead[tid] : null,
    rel: tid ? st.teams[tid].rel : null,
    S, bond: (x, y) => getBond(x, y),
    stress: n => st.mind[n]?.stress ?? 0,
    morale: n => st.mind[n]?.morale ?? 50,
    energy: n => st.mind[n]?.energy ?? 100,
    fails: ctx.event?.fails ?? 0,
    money: id => st.money[id] ?? 0,
    rank: id => perceivedRank(st, id),
    family: id => !!REL[st.teams[id]?.rel]?.family,
    teamBond: () => (oid ? Math.max(...[A, B].flatMap(x => [C, D].map(y => getBond(x, y)))) : 0),
    rivalry: () => (oid ? st.rivalry[pairKey(tid, oid)] || 0 : 0),
    friction: () => { const a = identityOf(st.teams[tid]), b = identityOf(st.teams[oid]);
      return !!(a && b && (a.friction.includes(st.teams[oid].identity) || b.friction.includes(st.teams[tid].identity))); },
    allied: () => st.alliances.some(al => !al.ended && al.teams.includes(tid) && al.teams.includes(oid)),
    peopleDefault: null,
  });
}

function makeFx(ctx, effects, kindId = null) {
  const st = ctx.state;
  const push = e => effects.push(e);
  return {
    bond(a, b, d) { if (!a || !b || a === b) return; addBond(a, b, d); push(['bond', a, b, d]); },
    teams(t1, t2, d) { for (const x of people(st, t1)) for (const y of people(st, t2)) addBond(x, y, d); push(['teams', t1, t2, d]); },
    mind(n, key, d) { if (!n) return; nudgeMind(st, n, key, d); push(['mind', n, key, d]); },
    // minutes lost (or, negative, won): the team at the centre adds them to its stretch;
    // another team's running stretch is pushed or pulled by the clock
    time(teamId, m) {
      if (!teamId || !m) return;
      if (teamId === ctx.tid) ctx.extra = (ctx.extra || 0) + m;
      else ctx.api?.delay?.(teamId, m);
      push(['time', teamId, m]);
    },
    money(teamId, d) { st.money[teamId] = Math.max(0, (st.money[teamId] || 0) + d); push(['money', teamId, d]); },
    owe(from, to) { st.owes.push({ from, to, leg: st.leg }); push(['owe', from, to]); },
    rivalry(t1, t2, n) { const k = pairKey(t1, t2); st.rivalry[k] = Math.max(0, (st.rivalry[k] || 0) + n); push(['rivalry', t1, t2, n]); },
    believe(list, b) { believe(st, list, { leg: st.leg, ...b }); push(['believe', list, b.about, b.claim]); },
    pass(teamId, p) { st.passBoost ||= {}; st.passBoost[teamId] = (st.passBoost[teamId] || 0) + p; push(['pass', teamId, p]); },
    lead(teamId, name) { if (!name) return; st.lead[teamId] = name; push(['lead', teamId, name]); },
    pop(n, d) { if (!gs.popularity) gs.popularity = {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; push(['pop', n, d]); },
    pending(teamId, m) { st.pending[teamId] = (st.pending[teamId] || 0) + m; push(['pending', teamId, m]); },
    rel(teamId, r) { st.teams[teamId].rel = r; push(['rel', teamId, r]); },
    snap(teamId, on) { st.snapped[teamId] = on; push(['snapped', teamId, on]); },
    ally(t1, t2) {
      let al = st.alliances.find(x => !x.ended && (x.teams.includes(t1) || x.teams.includes(t2)));
      if (al) { for (const t of [t1, t2]) if (!al.teams.includes(t)) al.teams.push(t); }
      else st.alliances.push(al = { id: st.alliances.length + 1, teams: [t1, t2], since: st.leg, ended: null });
      push(['ally', t1, t2]);
    },
    unally(t1, t2) {
      for (const al of st.alliances.filter(x => !x.ended && x.teams.includes(t1) && x.teams.includes(t2))) al.ended = st.leg;
      push(['unally', t1, t2]);
    },
    note(key, value) { st.notes ||= {}; st.notes[key] = value; push(['note', key]); },
    // romance: sparks grow to a couple at three; at most four active couples (the franchise cap)
    spark(a, b) {
      const k = pairKey(a, b);
      st.sparks[k] = (st.sparks[k] || 0) + 1;
      push(['spark', a, b]);
      if (st.sparks[k] >= 3 && !st.couples.some(x => !x.ended && pairKey(x.a, x.b) === k)
        && st.couples.filter(x => !x.ended).length < 4) { st.couples.push({ a, b, since: st.leg, ended: null }); push(['couple', a, b]); }
    },
    couple(a, b) {
      const k = pairKey(a, b);
      if (st.couples.some(x => !x.ended && pairKey(x.a, x.b) === k) || st.couples.filter(x => !x.ended).length >= 4) { push(['couple-held', a, b]); return; }
      st.couples.push({ a, b, since: st.leg, ended: null }); push(['couple', a, b]);
    },
    uncouple(a, b) { const k = pairKey(a, b); for (const x of st.couples) if (!x.ended && pairKey(x.a, x.b) === k) x.ended = st.leg; push(['uncouple', a, b]); },
    // which sabotage it was (push, steal, course-sabotage...) is kept, so a confrontation can name it
    sabotaged(victim, by, seen) { st.sabotaged ||= {}; st.sabotaged[victim] = { by, leg: st.leg, seen: !!seen, kind: kindId }; push(['sabotaged', victim, by, !!seen]); },
    custom(name, ...args) { push([name, ...args]); },
  };
}

function seenByOf(ctx, kind, who) {
  if (ctx.seenBy) return ctx.seenBy;
  if (kind.cast === 'team' || kind.cast === 'solo') return [ctx.A, ctx.B].filter(Boolean);
  const here = (ctx.present || []).flatMap(id => people(ctx.state, id));
  return [...new Set([...who, ...here])];
}

function whoOf(ctx, kind) {
  if (ctx.people?.length) return ctx.people;
  switch (kind.cast) {
    case 'solo': return [ctx.A];
    case 'teams': return [ctx.A, ctx.B, ctx.C, ctx.D].filter(Boolean);
    case 'group': return (ctx.present || []).slice(0, 2).flatMap(id => people(ctx.state, id));
    default: return [ctx.A, ctx.B].filter(Boolean);
  }
}

export function decideEnding(kind, ctx, rng) {
  const ws = kind.endings.map(e => { const w = kind._endings[e].w; return Math.max(0, typeof w === 'function' ? w(ctx) : (w ?? 1)); });
  const sum = ws.reduce((a, b) => a + b, 0);
  if (!(sum > 0)) return kind.endings[0];
  let r = rng() * sum;
  for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return kind.endings[i]; }
  return kind.endings.at(-1);
}

export function whenOf(kind, ctx) {
  prepare(ctx);
  if (kind.moments.length && !kind.moments.includes(ctx.moment)) return 0;
  const w = kind.when(ctx);
  return Math.max(0, Number(w) || 0);
}

// Play one scene: decide (or take the given ending), apply, record. null when it can't
// happen here (when = 0) or when a scheme has a doer who may not scheme.
export function playScene(ctx, kindId, rng, { ending = null } = {}) {
  const kind = SCENES[kindId];
  if (!kind) return null;
  prepare(ctx);
  const who = whoOf(ctx, kind);
  if (kind.scheme && !mayScheme(who[0])) return null;
  if (!ending && whenOf(kind, ctx) <= 0) return null;
  const e = ending || decideEnding(kind, ctx, rng);
  const snap = snapOf(ctx.state, { tid: ctx.tid, oid: ctx.oid, stretch: ctx.stretch, t: ctx.t, fails: ctx.fails, who });
  const effects = [];
  kind._endings[e].fx?.(makeFx(ctx, effects, kindId), ctx);
  const data = { ending: e, family: kind.family, effects, t: ctx.t ?? null, stretch: ctx.stretch?.id ?? null,
    team: ctx.tid ?? null, other: ctx.oid ?? null, cause: ctx.cause ?? null, facts: kind.facts ? kind.facts(ctx) : {}, snap,
    // why the system played it (a lead changed after an injury or a snap), and where the team stands on the mat
    why: ctx.event?.cause ?? null, matPlace: ctx.matPlace ?? null,
    // in a meeting, the team that just got there (talk.js: the one arriving finds the other already here)
    arriving: ctx.arriving ?? null };
  const sc = addScene(ctx.state, kindId, who, data, seenByOf(ctx, kind, who));
  const nxt = kind.next?.[e];
  if (nxt) { ctx.state.chained ||= {}; (ctx.state.chained[ctx.tid] ||= []).push({ kind: nxt, cause: sc.id, other: ctx.oid }); }
  return sc;
}

// A moment a system decided (the mat, a twist, a ruling): recorded with the ending the
// system chose. With `data.effects` the system's own effects are the record; without them
// the kind's ending applies its fx like any scene.
export function emit(state, kindId, who, ending, data = {}) {
  const kind = SCENES[kindId];
  if (!kind) throw new Error(`rr emit: no scene kind ${kindId}`);
  if (!kind.endings.includes(ending)) throw new Error(`rr emit: ${kindId} has no ending ${ending}`);
  const { effects, seenBy, present, event, stretch, ...rest } = data;
  if (!effects?.length) {
    const ctx = { state, team: rest.team ? { id: rest.team } : null, other: rest.other ? { id: rest.other } : null,
      people: who, present, event, stretch, seenBy, moment: kind.moments[0] ?? null };
    const sc = playScene(ctx, kindId, () => 0.5, { ending });
    Object.assign(sc.data, rest);
    return sc;
  }
  const seen = seenBy || [...new Set([...who, ...people(state, rest.team)])];
  const stretchObj = typeof stretch === 'object' && stretch ? stretch
    : rest.stretch ? { id: rest.stretch, kind: rest.stretch === 'mat' ? 'mat' : rest.stretchKind ?? null } : null;
  const snap = snapOf(state, { tid: rest.team ?? null, oid: rest.other ?? null, stretch: stretchObj, t: rest.t ?? null, who });
  return addScene(state, kindId, who, { ending, family: kind.family, effects, ...rest, snap }, seen);
}

// The weight of a moment, read from what it changed: what makes it worth an interview.
function weight(sc) {
  let w = 0;
  for (const e of sc.data?.effects || []) {
    if (e[0] === 'bond' || e[0] === 'teams') w += Math.abs(e[3]);
    else if (e[0] === 'rivalry') w += e[3];
    else if (['snapped', 'couple', 'uncouple', 'sabotaged', 'ally', 'unally', 'lead', 'rel', 'injured', 'quit-race'].includes(e[0])) w += 1.5;
    else if (e[0] === 'time' || e[0] === 'pending') w += Math.abs(e[2]) / 30;
    else if (e[0] === 'mind') w += Math.abs(e[3]) / 15;
  }
  return w;
}
const INTERVIEWS_PER_LEG = 3;
const MIN_WEIGHT = 0.5;                   // a clear tip or a quick taxi isn't worth a confessional
// endings where a scheme or an offer went wrong for the one who made it
const FAILED = ['caught-out', 'called-out', 'backfires', 'seen', 'discovered', 'refused', 'laughed-off',
  'rejected-rudely', 'wasted', 'fizzles', 'caught-spying', 'thinks-twice', 'held-back'];
const FEAR = ['fear-through', 'phobia', 'injury', 'freezes', 'exhaustion'];

// After a big moment, maybe an interview about it: only from people who saw it, of the
// moment's own team, at most three per team per leg (the show spends them carefully).
export function interviewAfter(state, sc, rng) {
  if (!sc || sc.kind.startsWith('int-')) return null;
  const tid = sc.data?.team;
  if (!tid || !state.teams[tid]) return null;
  const used = state.scenes.filter(x => x.leg === state.leg && x.kind.startsWith('int-') && x.data.team === tid).length;
  if (used >= INTERVIEWS_PER_LEG) return null;
  const w = weight(sc);
  if (w < MIN_WEIGHT) return null;
  if (rng() >= Math.min(0.7, w * 0.25)) return null;
  const who = people(state, tid).filter(n => sc.seenBy.includes(n));
  if (!who.length) return null;
  const kind = SCENES[sc.kind];
  const partnerBond = (sc.data.effects || []).filter(e => e[0] === 'bond' && who.includes(e[1]) && who.includes(e[2])).reduce((s, e) => s + e[3], 0);
  let kindId = 'int-feeling';
  const lovers = sc.data.facts?.lovers || [];
  const firstTime = !state.scenes.some(x => x.kind.startsWith('int-') && x.data.team === tid);
  if (kind?.family === 4 && lovers.some(n => who.includes(n)) && rng() < 0.5) kindId = 'int-secret';
  else if (kind?.scheme || ['alliance-pitch', 'deal', 'boomerang-decide', 'express-give'].includes(sc.kind)) kindId = 'int-strategy';
  else if (sc.data.other && [2, 7, 8, 12].includes(kind?.family)) kindId = 'int-about-team';
  else if (partnerBond < 0 && who.length === 2 && rng() < 0.4) kindId = 'int-contradict';
  else if (firstTime) kindId = 'int-backstory';                 // the first time a team sits down: who they are
  const ivWho = kindId === 'int-secret' ? [lovers.find(n => who.includes(n)) || who[0]] : who;
  const ctx = { state, team: { id: tid }, other: sc.data.other ? { id: sc.data.other } : null, moment: 'interview',
    people: ivWho, seenBy: ivWho, t: sc.data.t, cause: sc.id };
  let ending = null;
  const effs = sc.data.effects || [];
  if (kindId === 'int-feeling') {
    const mood = effs.filter(e => e[0] === 'mind' && who.includes(e[1]))
      .reduce((s, e) => s + (e[2] === 'morale' ? e[3] : e[2] === 'stress' ? -e[3] : 0) / 10, 0);
    // warmth with another team counts too (a good talk on the plane is a good moment)
    const across = effs.filter(e => e[0] === 'teams' && (e[1] === tid || e[2] === tid)).reduce((s, e) => s + e[3] / 2, 0);
    const valence = partnerBond + mood + across;
    ending = valence > 0 ? 'glad' : FEAR.includes(sc.kind) || FEAR.includes(sc.data.ending) ? 'scared'
      : S(who[0], 'temperament') < 5 ? 'angry' : 'hurt';
  } else if (kindId === 'int-strategy') {
    ending = sc.data.facts?.caught || FAILED.includes(sc.data.ending) ? 'justifies' : 'proud';
  } else if (kindId === 'int-about-team') {
    // what the other team is to them now, read from what the moment did between them
    const o = sc.data.other;
    const warm = effs.filter(e => e[0] === 'teams' && [e[1], e[2]].includes(o)).reduce((s, e) => s + e[3], 0);
    const feud = effs.filter(e => e[0] === 'rivalry' && [e[1], e[2]].includes(o)).reduce((s, e) => s + e[3], 0);
    const hit = effs.some(e => (e[0] === 'time' || e[0] === 'pending') && e[1] === tid && e[2] > 0);
    ending = warm > 0 ? 'respect' : feud > 0 || warm < 0 ? 'grudge' : hit ? 'fear' : 'respect';
  }
  const iv = playScene(ctx, kindId, rng, { ending: ending || decideEnding(SCENES[kindId], prepare(ctx), rng) });
  iv.data.about = sc.id;
  return iv;
}

// Load the families (each file registers its kinds).
import './scenes/partners.js';
import './scenes/teams.js';
import './scenes/groups.js';
import './scenes/romance.js';
import './scenes/locals.js';
import './scenes/money.js';
import './scenes/info.js';
import './scenes/sabotage.js';
import './scenes/body.js';
import './scenes/place.js';
import './scenes/don.js';
import './scenes/twist-scenes.js';
import './scenes/interviews.js';
