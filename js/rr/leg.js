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
import { resolveTask, runTask, keepRun } from './tasks.js';
import { handOut, pickBoomerang, resolveBoard, useExpress, zipTask, revealBlind } from './twists.js';
import { runLeg } from './clock.js';
import { talkAtStretch, talkAtOverlap, talkAtWait, closeLegTalk } from './talk.js';
import { snapCheck, makeupCheck, leaderCheck } from './team.js';
import { tick, behind } from './mind.js';
import { perceivedRank } from './knowledge.js';
import { teamLevel } from './skill.js';
import { checkIn } from './chill.js';
import { emit, playScene, interviewAfter } from './scenes.js';
import { addScene } from './state.js';
import { DON_GOES_AFTER, DEPART_CARRY, DEPART_CARRY_MAX, FORM, DRIVER } from './format.js';
import { streamFor } from '../dr/rng.js';
import { pairKey } from './scenes/registry.js';

const TASKS = ['either', 'botch', 'allin', 'route', 'superteam'];
const SPEED_BUMP = { base: 15, pass: 0.7, loopCost: 5 };
const SUPER_WAIT = 60;
// a Superteam of two teams this much at odds is 'stuck with the enemy' (one sour moment is not a feud)
const SUPER_ENEMIES = 2;
const DAY = 1440;
const MEET_START = 5;                               // minutes at a task's start where every team arriving is in one spot
const NIGHT = 180;                                  // a closed wait this long is a night, and Don says so
// the Zip-It: the place's hardest kind of task, longer and harder to pass (the first team through skips to the mat)
const ZIP = { base: 1.4, pass: -0.1 };
// the Head-to-Head: a short duel at the mat; a team waits this long for somebody to face before it goes on alone
const DUEL = { min: 8, spread: 10, edge: 0.08, hold: 240 };

const people = (st, id) => [st.teams[id].a, st.teams[id].b];

// The route: the flight in (when there is a place to fly from), the place's own stretches,
// and the twist's board right after the first task (the Don Box at its exit).
function buildRoute(state, leg, from, to, rng, nTeams) {
  const air = from ? flightStretches(from, to, nTeams, rng, { book: !!leg.book }) : [];
  const own = to.stretches.map((s, i) => ({ ...s, first: i === 0 }));
  const out = [...air, ...own];
  if (['boomerang', 'yield', 'boomerang-vote', 'boomerang-blind'].includes(leg.twist)) {
    const k = out.findIndex(s => TASKS.includes(s.kind));
    if (k >= 0) out.splice(k + 1, 0, { id: 'board', kind: 'board', after: out[k].id,
      label: leg.twist === 'yield' ? 'The Yield board' : 'The Boomerang board' });
  }
  // the Head-to-Head stands at the mat: the place's last challenge's kind of contest, one team against another
  if (leg.twist === 'head-to-head') {
    const mat = out.findIndex(s => s.kind === 'mat');
    const last = [...own].reverse().find(s => TASKS.includes(s.kind));
    if (mat >= 0 && last) out.splice(mat, 0, { id: 'duel', kind: 'duel', label: 'The Head-to-Head',
      types: last.types || last.sides?.[0]?.types || ['strength'] });
  }
  // the Intersection: two teams at a time do one of the place's challenges together (its first plain one)
  if (leg.twist === 'intersection') {
    // (never a picking task: what it picks feeds the challenge after it)
    const k = out.findIndex(s => !s.air && ['route', 'allin'].includes(s.kind) && s.types?.length && !s.pick);
    if (k >= 0) out[k] = { ...out[k], kind: 'superteam', intersect: true };
  }
  // the Zip-It sits before the place's first task: a team takes it on instead of the leg, or goes past it
  if (leg.twist === 'zip-it') {
    const k = out.findIndex(s => !s.air && TASKS.includes(s.kind));
    const like = k >= 0 ? out[k] : null;
    if (like) {
      const types = like.types || like.sides?.[0]?.types || ['nerve'];
      const base = like.base || like.sides?.[0]?.base || 30, pass = like.pass ?? like.sides?.[0]?.pass ?? 0.5;
      out.splice(k, 0, { id: 'zip', kind: 'zip', label: 'The Zip-It', types, base: Math.round(base * ZIP.base),
        pass: Math.max(0.2, pass + ZIP.pass), loopCost: like.loopCost || like.sides?.[0]?.loopCost || 10 });
    }
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
  handOut(state, leg, rng, { pick: false });

  const { stretches, air } = buildRoute(state, leg, from, to, rng, active.length);
  const idx = id => stretches.findIndex(s => s.id === id);
  const firstTask = to.stretches.find(s => TASKS.includes(s.kind))?.id ?? null;
  const talked = new Set();            // `${team}|${stretch}`: the overlap talk happens once, even after a hold
  const matAt = {};                    // team -> minute it reached the mat
  const superEnd = {};
  const superBy = {};                 // group -> the team whose run the group shares (its attempts are everyone's)
  const superFormed = {};              // stretch -> groups put together there so far
  const superAt = {};                  // `${stretch}|${minute}` -> groups put together in that minute
  const midmat = [];
  const legStart = state.scenes.length;
  // the Chill Zone keeps the teams that checked in: those who arrived in the last two hours are there
  const MAT_COMPANY = 120;
  const atMat = (id, t) => Object.keys(matAt).filter(x => x !== id && matAt[x] <= t && t - matAt[x] <= MAT_COMPANY);

  // the gap a team checked in behind is the gap it leaves behind, until the flights and the opening hours bunch the field:
  // half of it, an hour and a half at most, carries into the leg (2026-10-21, the user: "the last one safe in the
  // previous episode is the one going home in the next episode thats make the simulation useless and predictable";
  // measured: 48% of eliminations, chance 16%)
  const depart = Object.fromEntries(Object.entries(state.legs.at(-1)?.depart || {}).map(([k, v]) => [k, Math.min(DEPART_CARRY_MAX, Math.round(v * DEPART_CARRY))]));
  // and a day is a day: a team's form, and the driver it gets, drawn once a leg from their own stream (nothing else the
  // leg draws moves)
  const luck = streamFor(state.seed, `luck${leg.n}`);
  state.form = {}; state.driver = {};
  for (const id of [...state.order].sort()) { state.form[id] = FORM[0] + (FORM[1] - FORM[0]) * luck(); state.driver[id] = DRIVER[0] + (DRIVER[1] - DRIVER[0]) * luck(); }
  // Don opens the leg, demonstrates each task to the first team there, and reads a twist's rule the first time
  emit(state, 'don-opener', [], rng() < 0.67 ? 'annoyed' : 'bored', { t: 0, place: to.id, effects: [['opener', leg.n, to.id]] });
  const demoed = new Set();
  state.rulesRead ||= {};
  // the pick-a-team Boomerang happens here, at the start: Don says what the cards are for (the first time), then the
  // teams write them (read 2026-10-20: the cards were written before the opener, and the rule came hours later)
  if (leg.twist === 'boomerang-vote') {
    if (!state.rulesRead[leg.twist]) readRule(0, null);
    pickBoomerang(state, leg, rng, 0);
  }
  const starters = [...state.lastOrder.filter(id => active.includes(id)), ...active.filter(id => !state.lastOrder.includes(id))];

  // a twist's rule, the first time the season meets it (he can only grumble about saying it again once he has said one)
  function readRule(t, stretch) {
    const again = Object.keys(state.rulesRead).length > 0 && rng() < 0.2;
    state.rulesRead[leg.twist] = leg.n;
    emit(state, 'don-rule', [], again ? 'grudging-repeat' : 'explained', { t, stretch, rule: leg.twist, effects: [['rule', leg.twist]] });
  }

  // The Head-to-Head: a team that finds another waiting duels it; the winner goes to the mat, the loser waits for the
  // next team, and a loser with nobody left to face goes in last. `duelRes` is the result handed to the team that was
  // waiting (woken when its duel is decided).
  let duelWait = null;
  const duelRes = {};
  const duelDone = {};       // team -> when its last duel ended: a team still mid-duel can't start the next one
  function duelAt(id, s, t, api) {
    const mine = duelRes[id];
    if (mine) { delete duelRes[id]; if (mine.won) return { end: mine.end }; }
    if (duelWait && duelWait !== id) {
      const o = duelWait;
      duelWait = null;
      const lv = x => teamLevel(state, x, s.types || []);
      const p = Math.min(0.85, Math.max(0.15, 0.5 + DUEL.edge * (lv(id) - lv(o))));
      const [w, l] = rng() < p ? [id, o] : [o, id];
      const end = Math.max(t, duelDone[o] ?? -Infinity) + Math.round(DUEL.min + rng() * DUEL.spread);
      duelDone[o] = duelDone[id] = end;
      const last = api.remaining(s.id, [id, o]) === 0;
      const close = Math.abs(lv(w) - lv(l)) < 1;
      const ctx = { state, team: { id: w }, other: { id: l }, moment: 'twist', present: [w, l], stretch: s, t: end };
      playScene(ctx, 'head-to-head', rng, { ending: last ? 'final' : close ? 'close' : 'rout' });
      if (o === w) { duelRes[o] = { won: true, end }; api.wake(o, end); }
      if (id === w) return { end };
      // this team lost: it waits for the next one, or goes in last
      if (last) return { end: end + 2 };
      duelWait = id;
      return { hold: end + DUEL.hold };
    }
    if (duelWait === id || api.remaining(s.id) === 0) {
      // nobody came (or nobody is left to come): on to the mat
      if (duelWait === id && api.remaining(s.id) > 0) return { hold: t + DUEL.hold };
      if (duelWait === id) duelWait = null;
      return { end: t + 1 };
    }
    duelWait = id;
    return { hold: t + DUEL.hold };
  }

  // Where a team is at an Either/Or at minute tt: at its start (the Don Box: everybody arriving is there), or on the
  // side it chose. Two teams meet only in the same spot (the user, 2026-10-21, on Home City: teams on the deck met teams
  // on the stairs, "randomly finding thom and spencer who havent even take the elevator yet but bowie and sami did").
  // (A side is one place, whatever stage each team is at: the teams on the stairs pass each other on the landings.)
  const spotOf = (o, s, tt, from) => {
    if (tt - from <= MEET_START) return 'start';
    return state.attempts?.[o]?.[s.id]?.side || 'task';
  };
  // an Either/Or: the team meets whoever is with it, where and when, through its run
  const meetInside = (id, s, from, to, api) => {
    let extra = 0, watched = false;
    const met = new Set();
    for (let tt = from; tt <= to; tt += 2) {
      const mine = spotOf(id, s, tt, from);
      const now = api.here(s.id, tt).filter(x => x.id !== id && !met.has(x.id) && state.teams[x.id] && spotOf(x.id, s, tt, x.from) === mine).map(x => x.id);
      if (!now.length) continue;
      now.forEach(x => met.add(x));
      // (at its start nobody has begun: they can talk, but nobody has watched anybody at it yet; 2026-10-21, a
      // meeting there aired "they've been at it for an hour" and "has failed this task twice already")
      const atStart = mine === 'start';
      extra += talkAtOverlap(state, id, now, s, tt, api, rng, { atStart }).extra || 0;
      if (!watched && !atStart && now.length >= 2) { watched = true; talkAtWait(state, [id, ...now], s, tt, api, rng, 'watching'); }
    }
    return extra;
  };
  // Once the clock has run: a team's run at a task is as long as it really was, after every minute won or lost to
  // moments and to other teams' pushes. Its stages fit inside it (a minute won once had the zipline's stages still
  // playing after the team had checked in), its moments there too, and the one about passing comes as it leaves.
  // (a team can be at one task twice, sent back to it: each run fits its own visit, each moment the visit it was in)
  const settleRuns = log => {
    const visits = (id, stretch) => log.filter(x => x.id === id && x.stretch === stretch);
    const fitted = new Set();
    for (const row of (state.taskLog || []).filter(r => r.leg === state.leg)) {
      const vs = visits(row.team, row.stretch);
      // (the visit the run was in: the clock's visit starts on arrival, the run after any wait at a closed task)
      const l = vs.find(x => x.from <= row.from + 0.5 && row.from <= x.to + 0.5);
      if (!l || !(l.to >= row.from)) continue;
      row.to = l.to;
      if (!row.stages?.length || fitted.has(row.stages)) continue;
      fitted.add(row.stages);
      const from = row.from, last = Math.max(...row.stages.map(x => x.t));
      if (last > from) for (const x of row.stages) x.t = from + (Math.max(from, x.t) - from) * (l.to - from) / (last - from);
    }
    for (const sc of state.scenes) {
      if (sc.leg !== state.leg || !sc.data?.stretch || !sc.data.team || sc.data.t == null) continue;
      const st = stretches.find(x => x.id === sc.data.stretch);
      if (!st || !TASKS.includes(st.kind)) continue;
      const vs = visits(sc.data.team, sc.data.stretch);
      const l = [...vs].reverse().find(x => x.from <= sc.data.t + 0.5) || vs[0];
      if (!l || !(l.to >= l.from)) continue;
      if (['pass', 'tip'].includes(sc.data.moment)) sc.data.t = l.to;
      else sc.data.t = Math.min(l.to, Math.max(l.from, sc.data.t));
    }
    // an interview is about a moment: it comes after it, wherever that moment now is
    const byId = new Map(state.scenes.filter(x => x.leg === state.leg).map(x => [x.id, x]));
    for (const iv of state.scenes) {
      if (iv.leg !== state.leg || !iv.kind.startsWith('int-') || iv.data?.about == null || iv.data.t == null) continue;
      const ab = byId.get(iv.data.about);
      if (ab?.data?.t != null && iv.data.t < ab.data.t) iv.data.t = ab.data.t;
    }
  };

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

    // the teams already here: one moment for each pair, once (at an Either/Or, through the run: below)
    const inside = TASKS.includes(s.kind) && !!s.sides;
    const meetLater = inside && !talked.has(key);
    if (!talked.has(key) && !inside) {
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
    if ((s.kind === 'board' || s.kind === 'zip' || s.kind === 'duel' || s.intersect) && leg.twist && !state.rulesRead[leg.twist]) readRule(t, s.id);

    // a place that's closed: wait for it to open, with whoever else is waiting
    const until = closedUntil(state, s, t);
    if (until != null) {
      // a night's wait (a challenge shut till morning) is told on screen: the clock jumps across it (director narrate)
      // (only a closure that starts in the evening or the night: a challenge shut till the afternoon is no night)
      const tod = ((state.clock + t) % DAY + DAY) % DAY;
      if (until - t >= NIGHT && (tod >= 17 * 60 || tod < 6 * 60)) (state.nights ||= []).push({ leg: state.leg, stretch: s.id, t, until, team: id });
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
    } else if (s.kind === 'zip') {
      // most teams go straight past it; one that takes it on and is first through skips the rest of the leg's tasks
      // (to the last road into the mat, or the mat)
      const z = zipTask(state, team, s, t, api, rng);
      if (!z.tried) return { end: t };
      res = { end: z.end };
      if (z.won) {
        const mat = stretches.findIndex(x => x.kind === 'mat');
        const road = stretches[mat - 1]?.kind === 'travel' && mat - 1 > idx(s.id) ? mat - 1 : mat;
        res.skip = Math.max(0, road - idx(s.id) - 1);
      }
    } else if (s.kind === 'duel') {
      const d = duelAt(id, s, t, api);
      if (d.hold != null) return d;
      res = d;
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
        superBy[k] = id;
        if (ms.length > 1) {
          // teams are put together as they arrive (nobody picks): rivals are stuck with each other, the last teams in
          // are what's left once the others have formed, anyone else is glad of who they got
          const before = superFormed[s.id] || 0;
          superFormed[s.id] = before + 1;
          const rivals = ms.some((x, i) => ms.slice(i + 1).some(y => (state.rivalry[pairKey(x, y)] || 0) >= SUPER_ENEMIES));
          const last = before > 0 && api.remaining(s.id) <= ms.length - 1;
          // (groups put together in the same minute are told a moment apart: three at once is one scene three times)
          const at = `${s.id}|${v.departs}`;
          const slot = (superAt[at] = (superAt[at] ?? -1) + 1);
          const ctx = { state, team: { id: ms[0] }, other: { id: ms[1] }, moment: 'superteam', present: ms, stretch: s, t: v.departs + 0.3 * Math.floor(slot / 2) };
          playScene(ctx, 'superteam-pick', rng, { ending: rivals ? 'forced-with-enemies' : last ? 'left-over' : 'chosen' });
        }
      }
      // every team in the group ran it: each keeps the shared run, so the episode can show them at it (a minute after
      // they're put together, so the formation airs first)
      const shared = state.attempts?.[superBy[k]]?.[s.id] || {};
      keepRun(state, id, s, v.departs + 1, superEnd[k], { attempts: shared.attempts || 0, fails: shared.fails || 0,
        ...(shared.stages ? { stages: shared.stages.map(x => ({ ...x })) } : {}) });   // its own copy: each team's clock fits its own
      res = { end: superEnd[k] };
    } else if (s.kind === 'midmat') {
      // the finale's halfway mat: the last team to reach it is out where it stands
      midmat.push(id);
      if (api.remaining(s.id) === 0 && active.length > 2) {
        (state.midmatOut ||= {})[leg.n] = id;
        (state.midmatAt ||= {})[leg.n] = t;
        emit(state, 'don-elim', people(state, id), 'accepts', { team: id, t, stretch: s.id, midmat: true });
        return { out: true, end: t };
      }
      emit(state, 'don-place', people(state, id), 'plain', { team: id, t, stretch: s.id, place: midmat.length,
        matPlace: midmat.length === 1 ? 'first' : 'mid', midmat: true, effects: [['midmat', id, midmat.length]] });
      res = { end: t + 2 };
    } else if (s.kind === 'mat') {
      matAt[id] = t;
      res = { end: t };
    } else if (TASKS.includes(s.kind)) {
      if (useExpress(state, team, s, stretches, t)) res = { end: t + 1 };
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
    if (meetLater) { talked.add(key); if (res.end != null) extra += meetInside(id, s, t, res.end, api); }

    // after the stretch: the partners talk, tempers and the clock in their legs
    if (s.kind !== 'mat') {
      const said = talkAtStretch(state, id, s, t, api, rng, res.end ?? null);
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
  settleRuns(run.log);

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
  // a Blind Boomerang's thrower, told at the mat to the team it sent back
  revealBlind(state, leg, { ...run.finish, ...(result.times || {}) }, matAt, rng);
  interviewFloor(state, leg.n, result, rng);
  result.log = run.log;
  result.stretchKinds = Object.fromEntries(stretches.map(s => [s.id, s.kind]));
  Object.assign(result, { place: to.id, placeName: to.name, money: leg.money ?? 0, twist: leg.twist ?? null, clockStart, broke,
    depart: result.depart, starts: Object.fromEntries(starters.map(id => [id, depart[id] || 0])) });
  result.route = stretches.map(s => s.id);
  result.scenes = state.scenes.slice(legStart);
  return result;
}

// Every leg airs confessionals (read 2026-10-19: legs with none). When a leg ends with fewer than IV_FLOOR interviews,
// the teams at the top of the mat, whose check-ins always air (director.js featured), talk about getting there.
const IV_FLOOR = 2;
function interviewFloor(state, n, result, rng) {
  const ivs = () => state.scenes.filter(x => x.leg === n && x.kind.startsWith('int-') && !['int-exit', 'int-bleachers'].includes(x.kind)).length;
  if (ivs() >= IV_FLOOR) return;
  const top = (result.order || []).slice(0, 3);
  const places = state.scenes.filter(x => x.leg === n && x.kind === 'don-place' && top.includes(x.data?.team))
    .sort((x, y) => top.indexOf(x.data.team) - top.indexOf(y.data.team));
  for (const sc of places) {
    if (ivs() >= IV_FLOOR) break;
    interviewAfter(state, sc, rng, { force: true });
  }
}
