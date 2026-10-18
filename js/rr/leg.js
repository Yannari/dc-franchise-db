// ══════════════════════════════════════════════════════════════════════
// rr/leg.js — one leg, every team, one clock
// ══════════════════════════════════════════════════════════════════════
//
// Spec §6. The leg is the episode. Money and twists are handed out, the route is
// built (the flight in, then the place's stretches), and the clock moves every team
// through it; at each stretch the resolver asks the system that owns it what it costs
// (travel.js, tasks.js, twists.js) and lets the talk layer play what happens between
// people there (talk.js). The mat is chill.js. Every team is seen at every task: no
// team is skipped for being late, and a team only stops when Don goes to find it.
import { payStipend, repayDebts } from './money.js';
import { flightStretches, resolveTravel, boardFlightScenes } from './travel.js';
import { resolveTask, runTask } from './tasks.js';
import { handOut, resolveBoard, useExpress } from './twists.js';
import { runLeg } from './clock.js';
import { talkAtStretch, talkAtOverlap, talkAtWait, closeLegTalk } from './talk.js';
import { snapCheck, makeupCheck, leaderCheck } from './team.js';
import { tick, behind } from './mind.js';
import { perceivedRank } from './knowledge.js';
import { teamLevel } from './skill.js';
import { checkIn } from './chill.js';
import { emit, playScene } from './scenes.js';
import { addScene } from './state.js';
import { DON_GOES_AFTER } from './format.js';

const TASKS = ['either', 'botch', 'allin', 'route', 'superteam'];
const SPEED_BUMP = { base: 25, pass: 0.6, loopCost: 5 };
const SUPER_WAIT = 60;
const DAY = 1440;

const people = (st, id) => [st.teams[id].a, st.teams[id].b];

// The route: the flight in (when there is a place to fly from), the place's own stretches,
// and the twist's board right after the first task (the Don Box at its exit).
function buildRoute(state, leg, from, to, rng, nTeams) {
  const air = from ? flightStretches(from, to, nTeams, rng, { book: !!leg.book }) : [];
  const own = to.stretches.map((s, i) => ({ ...s, first: i === 0 }));
  const out = [...air, ...own];
  if (['boomerang', 'yield', 'boomerang-vote'].includes(leg.twist)) {
    const k = out.findIndex(s => TASKS.includes(s.kind));
    if (k >= 0) out.splice(k + 1, 0, { id: 'board', kind: 'board', after: out[k].id,
      label: leg.twist === 'yield' ? 'The Yield board' : 'The Boomerang board' });
  }
  return { stretches: out, air: air[0] || null };
}

// Closed (a temple at night, a market before dawn): when, in the leg's minutes, it opens next.
function closedUntil(state, s, t) {
  if (s.opens == null) return null;
  const tod = ((state.clock + t) % DAY + DAY) % DAY;
  const closes = s.closes ?? DAY;
  const open = s.opens <= closes ? tod >= s.opens && tod < closes : tod >= s.opens || tod < closes;
  if (open) return null;
  return t + ((s.opens - tod + DAY) % DAY);
}

// `adjust(team, stretch, t, res)` lets the finale reshape a stretch's result (the footrace).
export function playLeg(state, leg, from, to, rng, { adjust = null } = {}) {
  state.leg = leg.n;
  state.placeNow = to.id;
  const clockStart = state.clock;
  const active = state.order.filter(id => !state.gone.includes(id));
  payStipend(state, leg);
  const broke = active.filter(id => !(state.money[id] > 0));
  repayDebts(state);
  handOut(state, leg, rng);

  const { stretches, air } = buildRoute(state, leg, from, to, rng, active.length);
  const idx = id => stretches.findIndex(s => s.id === id);
  const firstTask = to.stretches.find(s => TASKS.includes(s.kind))?.id ?? null;
  const talked = new Set();            // `${team}|${stretch}`: the overlap talk happens once, even after a hold
  const matAt = {};                    // team -> minute it reached the mat
  const superEnd = {};
  const midmat = [];
  const legStart = state.scenes.length;
  // the Chill Zone keeps the teams that checked in: those who arrived in the last two hours are there
  const MAT_COMPANY = 120;
  const atMat = (id, t) => Object.keys(matAt).filter(x => x !== id && matAt[x] <= t && t - matAt[x] <= MAT_COMPANY);

  const depart = state.legs.at(-1)?.depart || {};
  // Don opens the leg, demonstrates each task to the first team there, and reads a twist's rule the first time
  emit(state, 'don-opener', [], rng() < 0.67 ? 'annoyed' : 'bored', { t: 0, place: to.id, effects: [['opener', leg.n, to.id]] });
  const demoed = new Set();
  state.rulesRead ||= {};
  const starters = [...state.lastOrder.filter(id => active.includes(id)), ...active.filter(id => !state.lastOrder.includes(id))];

  const resolve = (team, s, t, api) => {
    const id = team.id;
    const key = `${id}|${s.id}`;
    let extra = 0;

    // Don goes to find a team hours behind everyone else (an elimination leg only).
    const done = Object.keys(matAt);
    if (leg.kind === 'elim' && s.kind !== 'mat' && done.length >= active.length - 1 && !matAt[id]
      && t > Math.max(...done.map(x => matAt[x])) + DON_GOES_AFTER) {
      return { out: true, end: t };
    }

    // the teams already here: one moment for each pair, once
    if (!talked.has(key)) {
      talked.add(key);
      const here = api.here(s.id, t).map(x => x.id).filter(x => x !== id);
      if (here.length && s.kind !== 'mat') extra += talkAtOverlap(state, id, here, s, t, api, rng).extra || 0;
      if (s.kind === 'mat') {
        // the mat: a team that arrives while others are still there meets them (consoles, gloats)
        const there = atMat(id, t);
        if (there.length) talkAtOverlap(state, id, there, s, t, api, rng);
      }
      if (s.capacity && here.length + 1 > s.capacity) talkAtWait(state, [id, ...here], s, t, api, rng, 'queue');
      // three or more teams at one task: they watch each other
      else if (TASKS.includes(s.kind) && here.length >= 2) talkAtWait(state, [id, ...here], s, t, api, rng, 'watching');
      // three or more on the mat: the crowd at the Chill Zone
      if (s.kind === 'mat') { const there = atMat(id, t); if (there.length >= 2) talkAtWait(state, [id, ...there], s, t, api, rng, 'mat-crowd'); }
    }

    // Don's demonstration, as the first team reaches a task; a twist's rule, the first time the season meets it
    if (TASKS.includes(s.kind) && !demoed.has(s.id)) {
      demoed.add(s.id);
      emit(state, 'don-demo', [], rng() < 0.67 ? 'gag' : 'dry', { t, stretch: s.id, effects: [['demo', s.id]] });
    }
    if (s.kind === 'board' && leg.twist && !state.rulesRead[leg.twist]) {
      state.rulesRead[leg.twist] = leg.n;
      emit(state, 'don-rule', [], 'explained', { t, stretch: s.id, rule: leg.twist, effects: [['rule', leg.twist]] });
    }

    // a place that's closed: wait for it to open, with whoever else is waiting
    const until = closedUntil(state, s, t);
    if (until != null) {
      const here = api.here(s.id, t).map(x => x.id).filter(x => x !== id);
      talkAtWait(state, [id, ...here], { ...s, closed: true }, t, api, rng, 'closed');
      return { hold: until };
    }

    let res;
    if (s.kind === 'travel') {
      res = resolveTravel(state, team, s, t, api, rng);
      if (res.hold != null) {
        const here = api.here(s.id, t).map(x => x.id).filter(x => x !== id);
        talkAtWait(state, [id, ...here], s, t, api, rng, 'bus');
        return res;
      }
    } else if (s.kind === 'board') {
      const b = resolveBoard(state, team, s, t, api, rng);
      if (b.redo) return { end: b.end, back: idx(s.id) - idx(b.redo) };
      res = { end: b.end };
    } else if (s.kind === 'superteam') {
      const v = api.vehicle(s.id, { waitFor: 2, maxWait: SUPER_WAIT }, id, t);
      if (v.departs == null) return { hold: v.group.first + SUPER_WAIT };
      const k = v.group.members.join('|');
      if (superEnd[k] == null) {
        const ms = v.group.members;
        const levels = ms.map(m => teamLevel(state, m, s.types));
        const mean = levels.reduce((a, b) => a + b, 0) / levels.length;
        const own = Math.max(0.5, levels[ms.indexOf(id)]);
        const task = { ...s, pass: s.pass + 0.08 * (mean - own), base: s.base * own / Math.max(0.5, mean) };
        superEnd[k] = runTask(state, team, task, v.departs, api, rng).end;
        if (ms.length > 1) {
          const ctx = { state, team: { id: ms[0] }, other: { id: ms[1] }, moment: 'superteam', present: ms, stretch: s, t: v.departs };
          playScene(ctx, 'superteam-pick', rng, { ending: 'chosen' });
        }
      }
      res = { end: superEnd[k] };
    } else if (s.kind === 'midmat') {
      // the finale's halfway mat: the last team to reach it is out where it stands
      midmat.push(id);
      if (api.remaining(s.id) === 0 && active.length > 2) {
        (state.midmatOut ||= {})[leg.n] = id;
        emit(state, 'don-elim', people(state, id), 'accepts', { team: id, t, stretch: s.id, midmat: true });
        return { out: true, end: t };
      }
      emit(state, 'don-place', people(state, id), 'plain', { team: id, t, stretch: s.id, place: midmat.length,
        midmat: true, effects: [['midmat', id, midmat.length]] });
      res = { end: t + 2 };
    } else if (s.kind === 'mat') {
      matAt[id] = t;
      res = { end: t };
    } else if (TASKS.includes(s.kind)) {
      if (useExpress(state, team, s, stretches)) res = { end: t + 1 };
      else {
        res = resolveTask(state, team, s, t, api, rng);
        // the Speed Bump: one extra task for last leg's non-elimination team, after the first task
        if (s.id === firstTask && state.speedBump[id] === leg.n) {
          const bump = { id: 'speed-bump', kind: 'route', types: s.types || s.sides?.[0]?.types || ['hands'], ...SPEED_BUMP };
          const r2 = runTask(state, team, bump, res.end, api, rng, 'both', { stretchId: 'speed-bump' });
          emit(state, 'speed-bump', people(state, id), r2.data.fails ? 'humiliating' : 'quick',
            { team: id, t: res.end, stretch: s.id });
          res = { ...res, end: r2.end };
        }
      }
    } else {
      res = { end: t };
    }

    if (adjust) res = adjust(team, s, t, res) || res;

    // after the stretch: the partners talk, tempers and the clock in their legs
    if (s.kind !== 'mat') {
      const said = talkAtStretch(state, id, s, t, api, rng);
      extra += said.extra || 0;
      // a hurt partner hands over the lead
      const hurt = said.find(x => x.kind === 'injury' && x.data.ending !== 'minor');
      const at = { stretch: s, t };
      if (hurt) leaderCheck(state, id, 'injury', rng, hurt.who[0], at);
      // a snap can move the lead too
      if (snapCheck(state, id, rng, at)) leaderCheck(state, id, 'snap', rng, null, at);
      makeupCheck(state, id, rng, at);
      behind(state, id, perceivedRank(state, id));
    }
    // the clock runs in whole minutes; a gain can't bring a plane down early
    const gain = s.kind === 'travel' && s.mode === 'flight' ? Math.max(0, extra) : extra;
    const end = Math.max(t, Math.round((res.end ?? t) + gain));
    tick(state, id, end - t);
    return { ...res, end };
  };

  const run = runLeg({ teams: starters.map(id => ({ id, t: depart[id] || 0 })), stretches, resolve });

  // the plane: one room per flight with three or more teams
  if (air) {
    for (const s of boardFlightScenes(state, air)) {
      const ids = s.data.teams;
      if (ids.length < 3) continue;
      // the gate, then the cabin
      const departs = air.flights[s.data.flight]?.departs ?? s.data.t;
      talkAtWait(state, ids, air, departs - 20, null, rng, 'airport');
      talkAtWait(state, ids, air, departs, null, rng, 'plane');
    }
  }

  // the mat: every team has had its moments, then Don
  const lastAt = {};
  for (const l of run.log) if (l.stretch === 'mat') lastAt[l.id] = { stretch: 'mat', t: l.to };
  const prelim = Object.fromEntries(Object.entries(run.finish).sort((a, b) => a[1] - b[1]).map(([id], i) => [id, i + 1]));
  closeLegTalk(state, leg.n, rng, { places: prelim, at: lastAt });

  const result = checkIn(state, leg, run.finish, run.out, rng);
  result.log = run.log;
  result.stretchKinds = Object.fromEntries(stretches.map(s => [s.id, s.kind]));
  Object.assign(result, { place: to.id, placeName: to.name, money: leg.money ?? 0, twist: leg.twist ?? null, clockStart, broke,
    depart: result.depart, starts: Object.fromEntries(starters.map(id => [id, depart[id] || 0])) });
  result.route = stretches.map(s => s.id);
  result.scenes = state.scenes.slice(legStart);
  return result;
}

