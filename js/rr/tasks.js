// ══════════════════════════════════════════════════════════════════════
// rr/tasks.js — doing the tasks: attempts that loop until a judge says yes
// ══════════════════════════════════════════════════════════════════════
//
// Spec §7.1. A task is attempts: each takes the base time scaled by skill (and
// spread by temperament where the type is a pressure one); each fails or passes by
// a chance proportional to skill; a fail costs its loop. Either/Or: a team picks a
// side from what it believes, by watching other teams, and switches after failing.
// Botch or Watch: partners alternate (the real show's rule); the watcher may only
// cheer; a botcher who can't do it can quit at four hours. All-In: both must do it.
import { addScene, S, mayScheme, partner } from './state.js';
import { teamLevel, spreadOf } from './skill.js';
import { PENALTIES } from './format.js';
import { gs } from '../core.js';
import { snapOf } from './scenes.js';
import { streamFor } from '../dr/rng.js';

export const attemptChance = (level, pass) => Math.min(0.95, Math.max(0.05, pass + 0.08 * (level - 5)));

const MAX_ATTEMPTS = 10;
const pop = (name, d) => { if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; };
const people = (state, id) => [state.teams[id].a, state.teams[id].b];
const record = (state, id, stretchId, patch) => {
  state.attempts ||= {};
  const row = ((state.attempts[id] ||= {})[stretchId] ||= { attempts: 0, fails: 0 });
  Object.assign(row, patch);
  return row;
};

function chainScale(state, id, stretch) {
  if (!stretch.chain) return 1;
  if (stretch.chain.by === 'picks') return 1 + 0.12 * wrongPicks(state, id, stretch);
  const prev = state.attempts?.[id]?.[stretch.chain.from]?.attempts || 1;
  return 1 + 0.15 * (prev - 1);
}

// A task fed by a picking task (the stew cooked with the team's own spices): each wrong pick makes it worse.
function wrongPicks(state, id, stretch) {
  const p = state.picks?.[id];
  return p && p.leg === state.leg && p.stretch === stretch.chain.from ? p.of - p.right : 0;
}
const chainPenalty = (state, id, task) => (task.chain?.by === 'picks' ? 0.05 * wrongPicks(state, id, task) : 0);

// A picking task (the spices: five out of forty, no judge): one go; how many picks are right is the team's
// knowledge of the task's types, and a team under pressure guesses (the real leg: the ones who didn't know
// grabbed at random). Recorded for the task it feeds (state.picks) and the lines (snap.picked).
function runPick(state, id, task, stretchId, t, level, spread, rng) {
  const stress = people(state, id).reduce((s, n) => s + (state.mind[n]?.stress || 0), 0) / 200;
  const q = Math.min(0.95, Math.max(0.1, 0.15 + 0.08 * level - 0.15 * stress));
  let right = 0;
  for (let i = 0; i < task.pick.of; i++) if (rng() < q) right++;
  (state.picks ||= {})[id] = { leg: state.leg, stretch: stretchId, of: task.pick.of, right };
  record(state, id, stretchId, { attempts: 1, fails: 0, right });
  const dur = task.base * (1 + spread * 0.3 * (rng() - 0.5)) / (level / 5);
  return { end: t + dur, attempts: 1, quit: false, data: { attempts: 1, fails: 0, p: 1, right } };
}

// A challenge in stages (the user, 2026-10-20: challenges "not constructed well enough like in the show"). A stretch
// lists its `stages` from its own rules ({ id, share, risk }: the sled's harness, flag course, bear, swap, ice cliff):
// each failed try is placed AT a stage that can go wrong (by its `risk`), and the run is kept as the stages in order,
// a fail where it happened, every stage passed once, across the team's real time at the task. Its own stream: the
// stages tell the run, they never change it.
export function stageRun(state, id, task, stretchId, from, to, fails, quit = false) {
  const stages = task.stages || [];
  if (!stages.length) return null;
  const rng = streamFor(Number(state.seed) || 1, `stages|${state.leg}|${id}|${stretchId}|${task.side || ''}`);
  for (let i = 0; i < 4; i++) rng();
  const risky = stages.filter(x => x.risk > 0), sum = risky.reduce((a, x) => a + x.risk, 0);
  const at = {};
  for (let i = 0; i < fails && sum > 0; i++) {
    let r = rng() * sum, hit = risky.at(-1);
    for (const x of risky) { r -= x.risk; if (r <= 0) { hit = x; break; } }
    at[hit.id] = (at[hit.id] || 0) + 1;
  }
  // a quit ends at the stage it gave up on
  const last = quit ? stages.findLastIndex(x => at[x.id]) : stages.length - 1;
  const units = stages.map(x => (x.share ?? 1) * (1 + 0.6 * (at[x.id] || 0)));
  const total = units.slice(0, last + 1).reduce((a, u) => a + u, 0) || 1;
  const out = [];
  let cum = 0;
  stages.slice(0, last + 1).forEach((x, i) => {
    const n = at[x.id] || 0;
    for (let f = 0; f < n; f++) out.push({ id: x.id, ok: false, t: from + (to - from) * (cum + units[i] * (f + 0.6) / (n + 1)) / total });
    cum += units[i];
    if (!(quit && i === last)) out.push({ id: x.id, ok: true, t: from + (to - from) * cum / total });
  });
  return out;
}

// One run at a task (a side of an Either/Or is a task too). `who` is 'both' or a name.
// `onFail(attempt, row)` lets a Botch decide to quit or a watcher to step in; it returns
// 'quit' to stop.
export function runTask(state, team, task, t, api, rng, who = 'both', { stretchId = task.id, onFail = null, startAttempts = 0 } = {}) {
  const id = team.id;
  const level = Math.max(0.5, teamLevel(state, id, task.types, who));
  const [a, b] = people(state, id);
  const spread = who === 'both' ? (spreadOf(a, task.types) + spreadOf(b, task.types)) / 2 : spreadOf(who, task.types);
  // a pep talk, a bribe, a lucky hat (the catalogue's `pass` effect) helps the next task, once
  const boost = state.passBoost?.[id] || 0;
  if (boost) state.passBoost[id] = 0;
  if (task.pick) return runPick(state, id, task, stretchId, t, level, spread, rng);
  const p = attemptChance(level, task.pass + boost - chainPenalty(state, id, task));
  const base = task.base * chainScale(state, id, task);
  let dur = 0, attempts = startAttempts, quit = false, failedNoted = false;
  const row = record(state, id, stretchId, { side: task.side || null });
  if (!startAttempts) row.fails = 0;
  for (;;) {
    attempts++;
    dur += base * (1 + spread * 0.3 * (rng() - 0.5)) / (level / 5);
    row.attempts = attempts;
    if (rng() < p || attempts >= MAX_ATTEMPTS) break;
    row.fails = (row.fails || 0) + 1;
    dur += task.loopCost;
    for (const n of who === 'both' ? [a, b] : [who]) state.mind[n].stress = Math.min(100, state.mind[n].stress + 6);
    if (row.fails === 2 && !failedNoted) {
      failedNoted = true;
      addScene(state, 'attempt-fail', who === 'both' ? [a, b] : [who, partner(state, id, who)],
        { t: t + dur, stretch: stretchId, team: id, fails: row.fails, effects: [['stress', id, 12]],
          snap: snapOf(state, { tid: id, stretch: task, t: t + dur, fails: row.fails, who: [a, b] }) }, [a, b]);
    }
    if (onFail && onFail(attempts, row, t + dur) === 'quit') { quit = true; break; }
  }
  let start = t;
  if (task.capacity && api?.slot) start = api.slot(stretchId + (task.side ? ':' + task.side : ''), task.capacity, t, dur);
  if (task.stages) row.stages = stageRun(state, id, task, stretchId, start, start + dur, row.fails || 0, quit);
  return { end: start + dur, attempts, quit, data: { attempts, fails: row.fails || 0, p } };
}

// What a side should cost this team, as they see it (intuition limits the read).
function expected(state, id, side, rng) {
  const lv = Math.max(0.5, teamLevel(state, id, side.types));
  const p = attemptChance(lv, side.pass);
  const lead = state.lead[id];
  const noise = 1 + 0.4 * (rng() - 0.5) * (10 - S(lead, 'intuition')) / 10;
  return ((side.base / (lv / 5)) / p + side.loopCost * (1 / p - 1)) * noise;
}

export function chooseSide(state, team, stretch, t, api, rng) {
  const id = team.id;
  const lead = state.lead[id];
  const others = (api?.here?.(stretch.id, t) || []).map(x => x.id);
  let best = null, bestCost = Infinity;
  for (const side of stretch.sides) {
    let cost = expected(state, id, side, rng);
    const there = others.filter(o => state.attempts?.[o]?.[stretch.id]?.side === side.id);
    if (there.some(o => (state.attempts[o][stretch.id].fails || 0) >= 2)) cost *= 1.25;   // watching them suffer
    if (!there.length && S(lead, 'boldness') >= 7) cost *= 0.9;                          // the side nobody's doing
    if (cost < bestCost) { bestCost = cost; best = side.id; }
  }
  return best;
}

export function runEither(state, team, stretch, t, api, rng, { side = null } = {}) {
  const id = team.id;
  let pick = side || chooseSide(state, team, stretch, t, api, rng);
  const sideOf = k => ({ ...stretch.sides.find(s => s.id === k), side: k });
  let switched = false;
  let sw = null;
  const first = runTask(state, team, sideOf(pick), t, api, rng, 'both', { stretchId: stretch.id,
    onFail: (n, row) => {
      if (switched || row.fails < 2) return null;
      const other = stretch.sides.find(s => s.id !== pick);
      const here = sideOf(pick);
      const lv = Math.max(0.5, teamLevel(state, id, here.types));
      const remaining = (here.base / (lv / 5)) / attemptChance(lv, here.pass);
      // each failure makes the side they're on feel worse than it is (the show's switchers)
      if (expected(state, id, other, rng) < remaining * (0.6 + 0.25 * row.fails)) { switched = true; sw = other.id; return 'quit'; }
      return null;
    } });
  let end = first.end;
  if (switched) {
    const second = runTask(state, team, sideOf(sw), end + 5, api, rng, 'both', { stretchId: stretch.id, startAttempts: 0 });
    end = second.end;
    pick = sw;
    record(state, id, stretch.id, { side: sw, switched: true });
    (state.switches ||= []).push({ team: id, leg: state.leg, stretch: stretch.id, to: sw });
  }
  return { end, data: { side: pick, switched } };
}

export function pickBotch(state, team, stretch, rng) {
  const id = team.id;
  const t = state.teams[id];
  const last = state.botch.last[id];
  let who;
  if (stretch.random) who = rng() < 0.5 ? t.a : t.b;
  else if (last) who = last === t.a ? t.b : t.a;
  else {
    const better = teamLevel(state, id, stretch.types, t.a) >= teamLevel(state, id, stretch.types, t.b) ? t.a : t.b;
    const worse = better === t.a ? t.b : t.a;
    who = rng() < 0.5 + S(state.lead[id], 'strategic') / 20 ? better : worse;
  }
  state.botch.last[id] = who;
  state.botch.count[who] = (state.botch.count[who] || 0) + 1;
  (state.botch.history ||= []).push({ team: id, who, leg: state.leg, stretch: stretch.id, random: !!stretch.random });
  return who;
}

export function runBotch(state, team, stretch, t, api, rng) {
  const id = team.id;
  const who = pickBotch(state, team, stretch, rng);
  const watcher = partner(state, id, who);
  const res = runTask(state, team, stretch, t, api, rng, who, { onFail: (n, row, at) => {
    // the watcher stepping in: a penalty if another team sees it
    if ((mayScheme(watcher) || state.mind[watcher].stress > 60) && rng() < 0.05) {
      const witnesses = (api?.here?.(stretch.id, at) || []).map(x => x.id).filter(x => state.teams[x]);
      if (witnesses.length) {
        state.pending[id] = (state.pending[id] || 0) + PENALTIES.botchHelp;
        const seen = [who, watcher, ...witnesses.flatMap(x => people(state, x))];
        addScene(state, 'helped-botch', [watcher, who], { t: at, stretch: stretch.id, team: id, witnesses,
          effects: [['pending', id, PENALTIES.botchHelp]], snap: snapOf(state, { tid: id, stretch, t: at, who: [watcher, who] }) }, seen);
      }
    }
    if (n >= 5) {
      const q = 0.05 * (state.mind[who].stress / 20) * (10 - S(who, 'boldness')) / 10;
      if (rng() < q) return 'quit';
    }
    return null;
  } });
  if (res.quit) {
    state.pending[id] = (state.pending[id] || 0) + PENALTIES.botchQuit;
    state.rec[id].quits++;
    pop(who, -2);
    addScene(state, 'quit-task', [who, watcher], { t: res.end, stretch: stretch.id, team: id,
      effects: [['pending', id, PENALTIES.botchQuit], ['pop', who, -2]], snap: snapOf(state, { tid: id, stretch, t: res.end, who: [who, watcher] }) }, [who, watcher]);
  }
  return { ...res, data: { ...res.data, who, quit: res.quit } };
}

export function runAllIn(state, team, stretch, t, api, rng) {
  const id = team.id;
  const [a, b] = people(state, id);
  const tired = [a, b].find(n => state.mind[n].energy < 20);
  if (tired && rng() < 0.3) {
    state.pending[id] = (state.pending[id] || 0) + PENALTIES.allInSkip;
    addScene(state, 'allin-alone', [partner(state, id, tired), tired], { t, stretch: stretch.id, team: id,
      effects: [['pending', id, PENALTIES.allInSkip]], snap: snapOf(state, { tid: id, stretch, t, who: [a, b] }) }, [a, b]);
    return runTask(state, team, stretch, t, api, rng, partner(state, id, tired));
  }
  return runTask(state, team, stretch, t, api, rng, 'both');
}

function runAny(state, team, stretch, t, api, rng) {
  switch (stretch.kind) {
    case 'either': return runEither(state, team, stretch, t, api, rng);
    case 'botch': return runBotch(state, team, stretch, t, api, rng);
    case 'allin': case 'superteam': return runAllIn(state, team, stretch, t, api, rng);
    case 'route': return runTask(state, team, stretch, t, api, rng, 'both');
    default: return { end: t };
  }
}

// Every run at a task, kept per leg for the episode (the director shows every team at every task from it).
export function resolveTask(state, team, stretch, t, api, rng) {
  // what the episode may say about this run, as things stood when the team got there
  const snap = snapOf(state, { tid: team.id, stretch, t, who: people(state, team.id) });
  const r = runAny(state, team, stretch, t, api, rng);
  const row = state.attempts?.[team.id]?.[stretch.id] || {};
  keepRun(state, team.id, stretch, t, r.end, { snap,
    side: r.data?.side ?? row.side ?? null, who: r.data?.who ?? null, attempts: row.attempts || 0, fails: row.fails || 0,
    switched: !!r.data?.switched, quit: !!(r.quit || r.data?.quit), ...(r.data?.right != null ? { right: r.data.right } : {}),
    ...(row.stages ? { stages: row.stages } : {}) });
  return r;
}

// The record of one team's run at a task, for the episode. A run that doesn't go through resolveTask (a Superteam's
// teams share one run) keeps its row here too, or the director has no team to show at it.
export function keepRun(state, teamId, stretch, t, end, { snap = null, side = null, who = null, attempts = 0, fails = 0,
  switched = false, quit = false, ...more } = {}) {
  (state.taskLog ||= []).push({ leg: state.leg, team: teamId, stretch: stretch.id, kind: stretch.kind,
    side, who, attempts, fails, switched, quit, from: t, to: end,
    snap: snap || snapOf(state, { tid: teamId, stretch, t, who: people(state, teamId) }), ...more });
}
