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
  const prev = state.attempts?.[id]?.[stretch.chain.from]?.attempts || 1;
  return 1 + 0.15 * (prev - 1);
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
  const p = attemptChance(level, task.pass + boost);
  const base = task.base * chainScale(state, id, task);
  let dur = 0, attempts = startAttempts, quit = false, failedNoted = false;
  const row = record(state, id, stretchId, { side: task.side || null });
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
        { t: t + dur, stretch: stretchId, team: id, fails: row.fails, effects: [['stress', id, 12]] }, [a, b]);
    }
    if (onFail && onFail(attempts, row, t + dur) === 'quit') { quit = true; break; }
  }
  let start = t;
  if (task.capacity && api?.slot) start = api.slot(stretchId + (task.side ? ':' + task.side : ''), task.capacity, t, dur);
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
          effects: [['pending', id, PENALTIES.botchHelp]] }, seen);
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
      effects: [['pending', id, PENALTIES.botchQuit], ['pop', who, -2]] }, [who, watcher]);
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
      effects: [['pending', id, PENALTIES.allInSkip]] }, [a, b]);
    return runTask(state, team, stretch, t, api, rng, partner(state, id, tired));
  }
  return runTask(state, team, stretch, t, api, rng, 'both');
}

export function resolveTask(state, team, stretch, t, api, rng) {
  switch (stretch.kind) {
    case 'either': return runEither(state, team, stretch, t, api, rng);
    case 'botch': return runBotch(state, team, stretch, t, api, rng);
    case 'allin': case 'superteam': return runAllIn(state, team, stretch, t, api, rng);
    case 'route': return runTask(state, team, stretch, t, api, rng, 'both');
    default: return { end: t };
  }
}
