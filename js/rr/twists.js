// ══════════════════════════════════════════════════════════════════════
// rr/twists.js — Boomerang (and its vote), Yield, Express Pass, Zip-It, Save
// ══════════════════════════════════════════════════════════════════════
//
// Spec §5 (the twists table) and docs/ridonculous-race-scenes.md §12. A twist decides
// here and is recorded as its catalogue scene; the leg (Task 18) acts on what this
// leaves in the state: `state.uturn[id]` (redo the task before the board), `state.yielded`
// (wait at the board), an Express Pass's skipped stretch, a Zip-It win (straight to the mat).
//
// Who a team aims at is the team's choice, read from what it believes: rivalry, grudges
// (a negative bond), and the teams it thinks are near it in the race.
import { SCENES, playScene, decideEnding, prepare, pairKey, snapOf } from './scenes.js';
import { addScene, S } from './state.js';
import { perceivedRank } from './knowledge.js';
import { teamLevel } from './skill.js';
import { runTask } from './tasks.js';
import { getBond } from '../bonds.js';

const YIELD_MINUTES = 30;
const BOARD_LOOK = 2;            // minutes reading the board
const ZIP_TRY = 0.4;             // × the leader's boldness / 10
const TASK_KINDS = ['task', 'botch', 'allin', 'either'];

const people = (st, id) => (id && st.teams[id] ? [st.teams[id].a, st.teams[id].b] : []);
const active = st => st.order.filter(id => !st.gone.includes(id));
const avgBond = (st, a, b) => {
  const xs = people(st, a), ys = people(st, b);
  let s = 0;
  for (const x of xs) for (const y of ys) s += getBond(x, y);
  return s / 4;
};

// (`t` and `stretch`: when and where it happens, so the episode airs it there, not at the end of the leg)
function act(state, kindId, tid, oid, rng, { ending = null, data = {}, present = null, t = null, stretch = null } = {}) {
  const ctx = { state, team: { id: tid }, other: oid ? { id: oid } : null, moment: 'twist',
    present: present || [tid, oid].filter(Boolean), event: data.event || null, ...(t != null ? { t } : {}), ...(stretch ? { stretch } : {}) };
  const e = ending || decideEnding(SCENES[kindId], prepare(ctx), rng);
  const sc = playScene(ctx, kindId, rng, { ending: e });
  if (sc) Object.assign(sc.data, data);
  return sc;
}

function weightedPick(items, rng) {
  const sum = items.reduce((a, x) => a + x.w, 0);
  if (!(sum > 0)) return items[0] ?? null;
  let r = rng() * sum;
  for (const x of items) { r -= x.w; if (r <= 0) return x; }
  return items.at(-1);
}

// Whom a holder aims at: rivalry ×2, a grudge (negative bond), and how close it believes the target is.
function aimWeights(state, holder, targets) {
  const mine = perceivedRank(state, holder);
  return targets.map(x => ({ id: x,
    w: 0.05 + 2 * (state.rivalry[pairKey(holder, x)] || 0) + Math.max(0, -avgBond(state, holder, x))
      + (1 - Math.abs(mine - perceivedRank(state, x))) }));
}

const boardKey = (state, stretch) => `${state.leg}|${stretch.id}`;
const reached = (state, stretch) => ((state.board ||= {})[boardKey(state, stretch)] ||= []);

// ── At the start of a leg ──
// (`pick: false`: the leg holds the pick-a-team Boomerang until Don has opened the leg and said what the cards are for)
export function handOut(state, leg, rng, { pick = true } = {}) {
  const ids = active(state);
  if (!ids.length) return;
  if (leg.twist === 'boomerang' || leg.twist === 'yield') {
    const id = ids[Math.floor(rng() * ids.length)];
    const key = leg.twist === 'boomerang' ? 'boomerang' : 'yield';
    state.passes[id][key] = (state.passes[id][key] || 0) + 1;
    if (key === 'boomerang') act(state, 'boomerang-found', id, null, rng, { t: 0 });
    else addScene(state, 'yield-found', people(state, id), { team: id, effects: [['pass', id, 'yield']], snap: snapOf(state, { tid: id, who: people(state, id) }) });
  }
  if (pick) pickBoomerang(state, leg, rng);
}

// The pick-a-team Boomerang: every team writes one team on a card, and the team on the most cards is sent back.
export function pickBoomerang(state, leg, rng, t = 0) {
  const ids = active(state);
  if (leg.twist === 'boomerang-vote' && ids.length) {
    const pos = id => state.lastOrder.indexOf(id);
    const ballots = [];
    for (const v of ids) {
      const opts = ids.filter(x => x !== v).map(x => {
        const ahead = pos(x) >= 0 && pos(v) >= 0 && pos(x) < pos(v) && pos(v) - pos(x) <= 2 ? 1 : 0;
        return { id: x, w: 0.2 + state.rec[x].legWins + (state.rivalry[pairKey(v, x)] || 0)
          + Math.max(0, -avgBond(state, v, x)) + ahead };
      });
      ballots.push({ from: v, to: weightedPick(opts, rng).id });
    }
    const tally = {};
    for (const b of ballots) tally[b.to] = (tally[b.to] || 0) + 1;
    const target = Object.keys(tally).sort((a, b) => tally[b] - tally[a]
      || state.rec[b].legWins - state.rec[a].legWins || state.order.indexOf(a) - state.order.indexOf(b))[0];
    leg.vote = { ballots, target };
    (state.uturn ||= {})[target] = { by: 'vote', stretch: null };
    state.boomeranged[target] = 'vote';
    const split = tally[target] <= ballots.length / 2;
    act(state, 'boomerang-vote', target, null, rng, { t, ending: split ? 'split' : 'decided', present: [target, ...ids.filter(x => x !== target)],
      data: { event: { target }, ballots, target } });
  }
}

// ── A team reaches a board (the Don Box after a task) ──
// Returns { end, redo }: `redo` is the stretch the team must run again before it may go on.
export function resolveBoard(state, team, stretch, t, api, rng) {
  const id = team.id;
  const seen = reached(state, stretch);
  let end = t + BOARD_LOOK;
  let redo = null;

  // A team hit by a Boomerang goes back, once.
  const u = state.uturn?.[id];
  if (u && !u.served) {
    u.served = true;
    redo = u.stretch || stretch.after;
    // (a team the cards picked knows why: no guessing who did it)
    act(state, 'boomerang-hit', id, u.by !== 'vote' ? u.by : null, rng, { t, stretch, ending: u.by === 'vote' ? 'fury' : null,
      data: { byVote: u.by === 'vote' } });
    return { end, redo };
  }
  // A yielded team waits.
  if (state.yielded?.[id] && !state.yieldServed?.[id]) {
    (state.yieldServed ||= {})[id] = true;
    end += YIELD_MINUTES;
    act(state, 'yield', id, state.yielded[id], rng, { t, stretch, ending: 'courtesy-of' });
  }
  if (!seen.includes(id)) seen.push(id);

  // The holder of a Boomerang or a Yield uses it on a team not yet here.
  for (const key of ['boomerang', 'yield']) {
    if (!state.passes[id]?.[key]) continue;
    state.passes[id][key] = 0;
    const targets = active(state).filter(x => x !== id && !seen.includes(x) && !state.uturn?.[x]);
    if (key === 'boomerang') {
      if (!targets.length) {
        act(state, 'boomerang-decide', id, null, rng, { t, stretch, ending: 'wasted', data: { wasted: true } });
        continue;
      }
      const target = weightedPick(aimWeights(state, id, targets), rng).id;
      (state.uturn ||= {})[target] = { by: id, stretch: stretch.after };
      state.boomeranged[target] = id;
      act(state, 'boomerang-decide', id, target, rng,
        { t, stretch, ending: (state.rivalry[pairKey(id, target)] || 0) >= 1 ? 'target-rival' : 'target-threat',
          data: { target, rankGap: Math.round(Math.abs(perceivedRank(state, id) - perceivedRank(state, target)) * 100) / 100 } });
    } else if (targets.length) {
      const target = weightedPick(aimWeights(state, id, targets), rng).id;
      (state.yielded ||= {})[target] = id;
      addScene(state, 'yield-decide', people(state, id), { team: id, other: target, t, stretch: stretch.id,
        effects: [['yield', id, target]], snap: snapOf(state, { tid: id, oid: target, stretch, t, who: people(state, id) }) });
    }
  }
  return { end, redo };
}

// ── Express Pass: skip the task the team rates worst this leg (decided once, at the first stretch) ──
function levelAt(state, id, s) {
  if (s.kind === 'either') return Math.max(...(s.sides || []).map(x => teamLevel(state, id, x.types || [])));
  return teamLevel(state, id, s.types || []);
}
export function useExpress(state, team, stretch, stretches = []) {
  const id = team.id;
  if (!state.passes[id]?.express) return false;
  state.expressPlan ||= {};
  const key = `${state.leg}|${id}`;
  if (!(key in state.expressPlan)) {
    const tasks = stretches.filter(s => TASK_KINDS.includes(s.kind));
    let worst = null, lo = Infinity;
    for (const s of tasks) { const l = levelAt(state, id, s); if (l < lo) { lo = l; worst = s.id; } }
    state.expressPlan[key] = worst;
  }
  if (state.expressPlan[key] !== stretch.id) return false;
  state.passes[id].express--;
  // a picking task skipped with the pass still feeds the task after it (the stew is cooked with something): the
  // pass hands over the right ones
  if (stretch.pick) (state.picks ||= {})[id] = { leg: state.leg, stretch: stretch.id, of: stretch.pick.of, right: stretch.pick.of };
  addScene(state, 'express-used', people(state, id), { team: id, stretch: stretch.id, effects: [['express', id, stretch.id]],
    snap: snapOf(state, { tid: id, stretch, who: people(state, id) }) });
  return true;
}

// ── Save: survive one last-place finish ──
export function useSave(state, id) {
  if (!state.passes[id]?.save) return false;
  state.passes[id].save--;
  act(state, 'save-used', id, null, () => 0.1, { ending: 'saved' });
  return true;
}

// ── Zip-It: an optional task; the first team through it skips to the mat ──
// Returns { tried, won, end }. A team tries it once a season; the leader's boldness decides.
export function zipTask(state, team, stretch, t, api, rng) {
  const id = team.id;
  state.zipTried ||= {};
  if (state.zipTried[id] != null) return { tried: false, won: false, end: t };
  if (!(rng() < S(state.lead[id], 'boldness') / 10 * ZIP_TRY)) return { tried: false, won: false, end: t };
  state.zipTried[id] = state.leg;
  const r = runTask(state, team, stretch, t, api, rng);
  state.zipWon ||= {};
  const won = !r.quit && state.zipWon[state.leg] == null;
  if (won) state.zipWon[state.leg] = id;
  act(state, 'zip-it', id, won ? null : state.zipWon[state.leg], rng, { t: r.end, stretch, ending: won ? 'takes-it' : 'beaten-to-it' });
  return { tried: true, won, end: r.end };
}
