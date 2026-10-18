// ══════════════════════════════════════════════════════════════════════
// rr/chill.js — the Chill Zone: check-in, penalties, who goes, the rest
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3 and §7.6. A team's mat time is its finish plus the penalty it must serve
// beside the mat (this leg's, plus one carried from a non-elimination leg, plus half an
// hour for a team marked last leg that didn't win this one). On an elimination leg the
// last team is out without serving its own penalty; a team Don had to go and find is
// out where it stands. On a non-elimination leg the last team stays and takes the leg's
// penalty. Every Don moment here is a catalogue scene (scenes.js emit).
import { DON_GOES_AFTER, MARKED_MINUTES, DEPARTURE_PENALTY } from './format.js';
import { surrender } from './money.js';
import { useSave } from './twists.js';
import { rest } from './mind.js';
import { emit, playScene, SCENES, decideEnding, prepare } from './scenes.js';
import { getBond } from '../bonds.js';

const CASH = 200;
const people = (st, id) => (id && st.teams[id] ? [st.teams[id].a, st.teams[id].b] : []);

function act(state, kindId, tid, oid, rng, ending = null, data = {}) {
  const ctx = { state, team: { id: tid }, other: oid ? { id: oid } : null, moment: SCENES[kindId].moments[0] ?? null,
    present: [tid, oid].filter(Boolean), event: data.event || null };
  const e = ending || decideEnding(SCENES[kindId], prepare(ctx), rng);
  const sc = playScene(ctx, kindId, rng, { ending: e });
  if (sc) Object.assign(sc.data, data);
  return sc;
}

export function checkIn(state, leg, finish, notFinished = [], rng = () => 0.5) {
  const n = leg.n;
  const lastIdx = id => { const i = state.lastOrder.indexOf(id); return i < 0 ? 1e9 : i; };
  const racing = [...Object.keys(finish), ...notFinished.filter(id => !(id in finish))];

  // what each team serves at the mat
  const times = {}, penalties = {};
  const firstRaw = Math.min(...Object.values(finish));
  for (const id of Object.keys(finish)) {
    const pend = (state.pending[id] || 0) + (state.carryPenalty[id] || 0);
    let marked = 0;
    if (state.marked[id] === n && finish[id] + pend > firstRaw) marked = MARKED_MINUTES;
    penalties[id] = pend + marked;
    times[id] = finish[id] + pend + marked;
  }
  const finished = Object.keys(times).sort((a, b) => times[a] - times[b] || lastIdx(a) - lastIdx(b));
  const behindAll = notFinished.filter(id => !(id in finish)).sort((a, b) => lastIdx(a) - lastIdx(b));
  const order = [...finished, ...behindAll];

  const result = { n, order, times, penalties, eliminated: [], how: {}, nonElim: null, onLocation: [], unserved: [], saved: null };

  if (leg.kind === 'elim' || leg.kind === 'final') {
    // Don goes to a team that never reached the mat, or one hours behind the second-last.
    const raw = Object.keys(finish).sort((a, b) => finish[a] - finish[b]);
    const secondLast = raw.length >= 2 ? finish[raw[raw.length - 2]] : null;
    const far = raw.filter(id => secondLast != null && finish[id] - secondLast > DON_GOES_AFTER);
    const onLoc = [...behindAll, ...far.filter(id => !behindAll.includes(id))];
    if (onLoc.length) {
      for (const id of onLoc) {
        result.eliminated.push(id); result.how[id] = 'on-location'; result.onLocation.push(id);
        act(state, 'don-arrives', id, null, rng);
      }
    } else if (leg.kind === 'elim') {
      let out = finished.at(-1);
      if (out && useSave(state, out)) {
        result.saved = out;
        state.rec[out].lasts++;
        out = finished.at(-2);
      }
      if (out) {
        result.eliminated.push(out); result.how[out] = 'last';
        if (penalties[out]) result.unserved.push(out);
        act(state, 'don-elim', out, null, rng);
      }
    }
  } else {
    // a non-elimination leg: the last team stays, and pays
    const last = order.at(-1);
    const p = leg.nonElimPenalty;
    result.nonElim = { id: last, penalty: p };
    state.rec[last].lasts++;
    if (p === 'surrender-money' || p === 'surrender-all') surrender(state, last, p);
    else if (p === 'speed-bump') state.speedBump[last] = n + 1;
    else if (p === 'marked') state.marked[last] = n + 1;
    act(state, 'don-fakeout', last, null, rng, 'relief', { penalty: p });
  }

  // every team's moment on the mat
  order.forEach((id, i) => {
    if (result.eliminated.includes(id)) return;
    emit(state, 'don-place', people(state, id), penalties[id] ? 'penalty-reveal' : 'plain',
      { team: id, place: i + 1, effects: [['placed', id, i + 1]] });
  });

  // the winner's reward
  const first = order[0];
  if (first) {
    state.rec[first].legWins++;
    const r = leg.reward;
    if (r === 'cash') state.money[first] = (state.money[first] || 0) + CASH;
    else if (r === 'express') state.passes[first].express++;
    else if (r === 'save') state.passes[first].save++;
    else if (r === 'first-class') (state.firstClass ||= {})[first] = n + 1;
    if (r === 'call-home') act(state, 'call-home', first, null, rng, 'joy');
    else if (r) act(state, 'reward', first, null, rng, 'prize-joy', { reward: r });
  }

  for (const id of racing) state.rec[id].penalties += state.pending[id] || 0;
  // what a non-elimination last team didn't serve, and the departure penalty, carry
  state.carryPenalty = {};
  if (result.nonElim) {
    const id = result.nonElim.id;
    const carry = (state.pending[id] || 0) + (result.nonElim.penalty === 'departure' ? DEPARTURE_PENALTY : 0);
    if (carry) state.carryPenalty[id] = carry;
  }
  for (const id of result.eliminated) if (!state.gone.includes(id)) state.gone.push(id);

  rest(state);
  state.pending = {};
  state.snapped = {};
  state.lastOrder = order.filter(id => !result.eliminated.includes(id));
  const min = Math.min(...finished.map(id => times[id]));
  result.depart = Object.fromEntries(state.lastOrder.filter(id => id in times).map(id => [id, times[id] - min]));
  state.clock = (state.clock + min + (state.options?.restMinutes ?? 720)) % 1440;
  state.legs.push(result);
  return result;
}

// A team that can't go on: out, and (if the season allows and enough teams remain) the
// eliminated team it owes most comes back; with no debts, the one it's closest to.
export function medevac(state, id, legN, rng) {
  if (!state.gone.includes(id)) state.gone.push(id);
  (state.medevacs ||= []).push({ id, leg: legN });
  const remaining = state.order.filter(x => !state.gone.includes(x)).length;
  let returned = null;
  if (state.options?.medevacReturn !== false && remaining >= 4) {
    const cands = state.gone.filter(x => x !== id && !state.medevacs.some(m => m.id === x));
    const owed = x => state.owes.filter(o => o.from === id && o.to === x).length;
    const close = x => people(state, id).reduce((s, a) => s + people(state, x).reduce((t, b) => t + getBond(a, b), 0), 0);
    cands.sort((a, b) => owed(b) - owed(a) || close(b) - close(a) || state.order.indexOf(a) - state.order.indexOf(b));
    returned = cands[0] ?? null;
    if (returned) {
      state.gone = state.gone.filter(x => x !== returned);
      act(state, 'medevac-choice', id, returned, rng, owed(returned) ? 'repays-kindness' : 'picks-friend');
    }
  }
  state.medevacs.at(-1).returned = returned;
  return { returned };
}
