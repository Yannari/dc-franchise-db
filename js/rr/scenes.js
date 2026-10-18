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

// The context a kind reads: the teams, the place, the moment, and helpers.
export function prepare(ctx) {
  if (ctx._ready) return ctx;
  const st = ctx.state;
  const [A, B] = people(st, ctx.team?.id);
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

function makeFx(ctx, effects) {
  const st = ctx.state;
  const push = e => effects.push(e);
  return {
    bond(a, b, d) { if (!a || !b || a === b) return; addBond(a, b, d); push(['bond', a, b, d]); },
    teams(t1, t2, d) { for (const x of people(st, t1)) for (const y of people(st, t2)) addBond(x, y, d); push(['teams', t1, t2, d]); },
    mind(n, key, d) { if (!n) return; nudgeMind(st, n, key, d); push(['mind', n, key, d]); },
    time(teamId, m) {
      if (!teamId || !m) return;
      if (teamId === ctx.tid && m > 0) ctx.extra = (ctx.extra || 0) + m;
      else if (m > 0) ctx.api?.delay?.(teamId, m);
      else st.pending[teamId] = (st.pending[teamId] || 0) + m;
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
    sabotaged(victim, by, seen) { st.sabotaged ||= {}; st.sabotaged[victim] = { by, leg: st.leg, seen: !!seen }; push(['sabotaged', victim, by, !!seen]); },
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
  const effects = [];
  kind._endings[e].fx?.(makeFx(ctx, effects), ctx);
  const data = { ending: e, family: kind.family, effects, t: ctx.t ?? null, stretch: ctx.stretch?.id ?? null,
    team: ctx.tid ?? null, other: ctx.oid ?? null, cause: ctx.cause ?? null, facts: kind.facts ? kind.facts(ctx) : {} };
  const sc = addScene(ctx.state, kindId, who, data, seenByOf(ctx, kind, who));
  const nxt = kind.next?.[e];
  if (nxt) { ctx.state.chained ||= {}; (ctx.state.chained[ctx.tid] ||= []).push({ kind: nxt, cause: sc.id, other: ctx.oid }); }
  return sc;
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
