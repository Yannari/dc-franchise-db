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
import { emit, playScene, SCENES, decideEnding, prepare, CLASH_KINDS } from './scenes.js';
import { getBond } from '../bonds.js';
import { S } from './state.js';

const CASH = 200;
const people = (st, id) => (id && st.teams[id] ? [st.teams[id].a, st.teams[id].b] : []);

function act(state, kindId, tid, oid, rng, ending = null, data = {}) {
  const ctx = { state, team: { id: tid }, other: oid ? { id: oid } : null, moment: SCENES[kindId].moments[0] ?? null,
    present: [tid, oid].filter(Boolean), event: data.event || null, t: data.t ?? null };
  const e = ending || decideEnding(SCENES[kindId], prepare(ctx), rng);
  const sc = playScene(ctx, kindId, rng, { ending: e });
  if (sc) Object.assign(sc.data, data);
  return sc;
}

// A couple who just won can propose on the mat: a couple not engaged or married yet, close (bond 4 and up), rarely
// after a leg win and more often at the finish. The bolder one asks. A yes is the leg it happened on (engagedAt), not
// their history: the premiere is written after the season, and it still meets a dating couple.
const PROPOSE_RELS = ['dating', 'newly-dating', 'on-off', 'once-engaged'];
const PROPOSE_P = { leg: 0.06, final: 0.35 };
function proposalCheck(state, leg, order, finish, rng) {
  const id = order[0];
  const t = id && state.teams[id];
  if (!t || !PROPOSE_RELS.includes(t.rel) || t.history?.engaged || t.engagedAt || state.proposed?.[id]) return null;
  if (getBond(t.a, t.b) < 4 || rng() >= (leg.kind === 'final' ? PROPOSE_P.final : PROPOSE_P.leg)) return null;
  const [asks, asked] = S(t.a, 'boldness') >= S(t.b, 'boldness') ? [t.a, t.b] : [t.b, t.a];
  const sc = playScene({ state, team: { id }, moment: 'proposal', people: [asks, asked], t: (finish[id] ?? 0) + 0.5,
    stretch: { id: 'mat', kind: 'mat' }, present: [id] }, 'proposal', rng);
  (state.proposed ||= {})[id] = leg.n;
  if (sc?.data?.ending === 'yes') t.engagedAt = leg.n;
  return sc;
}

// When the team going home is told: once everybody is in. After a Save, the team that used it checks in after the one
// going home; two teams in the same minute check in before the one told it's out (read 2026-10-19).
function exitTime(times, out) {
  const lastIn = Math.max(...Object.values(times));
  const tied = Object.entries(times).some(([id, v]) => id !== out && v === lastIn);
  return times[out] < lastIn || tied ? lastIn + 1 : times[out];
}

// A team going home: the team closest to it comes over (console), a couple says goodbye,
// and the team says its last word to camera (int-exit).
function farewell(state, out, finished, finish, rng, atMat, how = 'last') {
  // a team cut at the finale's midpoint says goodbye there, not at the finish
  const t = how === 'midpoint' && state.midmatAt?.[state.leg] != null ? state.midmatAt[state.leg]
    : finish[out] != null ? (how === 'last' ? exitTime(finish, out) : finish[out]) : Math.max(...Object.values(finish));
  if (!atMat) { const [a, b] = people(state, out); act(state, 'int-exit', out, null, rng, getBond(a, b) >= 0 ? 'grateful' : 'bitter', { t, exitHow: how }); return; }
  const close = (a, b) => people(state, a).reduce((s, x) => s + people(state, b).reduce((u, y) => u + getBond(x, y), 0), 0) / 4;
  // a consoler likes every one of them and hasn't turned on them this leg
  const pair = (x, y) => [x, y].sort().join('|');
  const clashed = new Set((state.scenes || []).filter(s => s.leg === state.leg && CLASH_KINDS.has(s.kind) && s.data?.other != null)
    .map(s => pair(s.data.team, s.data.other)));
  const kind = id => !clashed.has(pair(id, out)) && people(state, id).every(x => people(state, out).every(y => getBond(x, y) >= 0));
  const friends = finished.filter(id => id !== out && kind(id)).sort((a, b) => close(b, out) - close(a, out));
  if (friends[0] && close(friends[0], out) >= 1) {
    const ctx = { state, team: { id: friends[0] }, other: { id: out }, moment: 'mat', t, stretch: { id: 'mat', kind: 'mat' },
      present: [friends[0], out], event: { consoleTarget: out } };
    playScene(ctx, 'console', rng);
  }
  for (const c of (state.couples || []).filter(x => !x.ended)) {
    const mine = people(state, out);
    const leaving = mine.includes(c.a) ? c.a : mine.includes(c.b) ? c.b : null;
    if (!leaving) continue;
    const staying = leaving === c.a ? c.b : c.a;
    const otherTeam = state.order.find(id => people(state, id).includes(staying));
    if (!otherTeam || otherTeam === out) continue;
    playScene({ state, team: { id: out }, other: { id: otherTeam }, people: [leaving, staying], moment: 'elim', t,
      present: [out, otherTeam] }, 'goodbye-kiss', rng);
  }
  const [a, b] = people(state, out);
  act(state, 'int-exit', out, null, rng, getBond(a, b) >= 0 ? 'grateful' : 'bitter', { t, exitHow: how });
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

  const result = { n, kind: leg.kind, order, times, penalties, eliminated: [], how: {}, nonElim: null, onLocation: [], unserved: [], saved: null };

  if (leg.kind === 'final') {
    // the finale: the team cut at the midpoint mat is third; the other two race to the end
    for (const id of behindAll) {
      result.eliminated.push(id);
      result.how[id] = state.midmatOut?.[n] === id ? 'midpoint' : 'on-location';
    }
  } else if (leg.kind === 'elim') {
    // Don goes to a team that never reached the mat, or else one hours behind the second-last.
    const raw = Object.keys(finish).sort((a, b) => finish[a] - finish[b]);
    const secondLast = raw.length >= 2 ? finish[raw[raw.length - 2]] : null;
    const far = raw.filter(id => secondLast != null && finish[id] - secondLast > DON_GOES_AFTER);
    const onLoc = behindAll.length ? behindAll : far;
    if (onLoc.length) {
      for (const id of onLoc) {
        result.eliminated.push(id); result.how[id] = 'on-location'; result.onLocation.push(id);
        act(state, 'don-arrives', id, null, rng, null, { t: Math.max(...Object.values(times)) });
      }
    } else {
      let out = finished.at(-1);
      if (out && useSave(state, out)) {
        result.saved = out;
        state.rec[out].lasts++;
        out = finished.at(-2);
      }
      if (out) {
        result.eliminated.push(out); result.how[out] = 'last';
        if (penalties[out]) result.unserved.push(out);
        act(state, 'don-elim', out, null, rng, null, { t: exitTime(times, out) });
      }
    }
  } else {
    // a non-elimination leg: the last team stays, and pays
    const last = order.at(-1);
    const p = leg.nonElimPenalty;
    result.nonElim = { id: last, penalty: p };
    state.rec[last].lasts++;
    if (p === 'surrender-money' || p === 'surrender-all') surrender(state, last, p);
    if (p === 'surrender-money' || p === 'surrender-all') act(state, 'surrender', last, null, rng, null, { t: finish[last] ?? null, penalty: p });
    if (p === 'speed-bump') state.speedBump[last] = n + 1;
    else if (p === 'marked') state.marked[last] = n + 1;
    act(state, 'don-fakeout', last, null, rng, null, { penalty: p, t: finish[last] ?? null });
  }

  // every team's moment on the mat
  const N = order.length, third = Math.ceil(N / 3);
  const bandOf = i => (i === 0 ? 'first' : i === N - 1 ? 'last' : i < third ? 'top' : i >= N - third ? 'bottom' : 'mid');
  order.forEach((id, i) => {
    if (result.eliminated.includes(id)) return;
    if (leg.kind === 'final') {
      emit(state, 'don-crown', people(state, id), i === 0 ? 'winner' : 'runner-up',
        { team: id, place: i + 1, t: finish[id] ?? null, stretch: 'mat', effects: [['placed', id, i + 1]] });
      return;
    }
    const band = bandOf(i);
    const ending = penalties[id] ? 'penalty-reveal'
      : (state.rec[id].sabotage || 0) >= 1 && rng() < 0.5 ? 'scared-of-them'
      : band === 'mid' && rng() < 0.35 ? 'bored' : 'plain';
    // a penalty: Don stops them where they'd have placed on arrival, and once it's served they check in in their real
    // place (2026-10-22: "we just passed from 2nd to 8th for no reason", the team never seen again after the stool)
    if (ending === 'penalty-reveal') {
      const arrived = Object.keys(finish).filter(x => finish[x] < finish[id]).length + 1;
      emit(state, 'don-place', people(state, id), ending,
        { team: id, place: arrived, matPlace: band, t: finish[id] ?? null, stretch: 'mat', effects: [['penalty', id, penalties[id]]] });
      if (result.nonElim?.id === id) return;
      emit(state, 'don-place', people(state, id), 'penalty-served',
        { team: id, place: i + 1, matPlace: band, t: times[id], minutes: penalties[id], stretch: 'mat', effects: [['placed', id, i + 1]] });
      return;
    }
    emit(state, 'don-place', people(state, id), ending,
      { team: id, place: i + 1, matPlace: band, t: finish[id] ?? null, stretch: 'mat', effects: [['placed', id, i + 1]] });
  });
  // the finale ends on the winners' last words on the stage, and Don signing the season off, once every finalist is in
  // (the user, 2026-10-23: "the winners then the losers then last words of the winner then the host don signing off")
  if (leg.kind === 'final' && order[0] && finish[order[0]] != null) {
    const end = Math.max(...order.filter(id => !result.eliminated.includes(id) && finish[id] != null).map(id => finish[id]));
    emit(state, 'winner-words', people(state, order[0]), 'last-words', { team: order[0], t: end + 1, stretch: 'mat' });
    emit(state, 'don-signoff', people(state, order[0]), 'plain', { team: order[0], t: end + 2, stretch: 'mat', effects: [['signoff', n]] });
  }

  // the winner's reward
  const first = order[0];
  if (first) {
    state.rec[first].legWins++;
    const r = leg.reward;
    if (r === 'cash') state.money[first] = (state.money[first] || 0) + CASH;
    else if (r === 'express') state.passes[first].express++;
    else if (r === 'save') state.passes[first].save++;
    else if (r === 'first-class') (state.firstClass ||= {})[first] = n + 1;
    // the call home is usually joy; now and then the news from home is bad (the scene's weights decide)
    if (r === 'call-home') act(state, 'call-home', first, null, rng, null, { t: finish[first] });
    else if (r) act(state, 'reward', first, null, rng, null, { reward: r, t: finish[first] });
  }

  proposalCheck(state, leg, order, finish, rng);

  for (const id of racing) state.rec[id].penalties += state.pending[id] || 0;
  // what a non-elimination last team didn't serve, and the departure penalty, carry
  state.carryPenalty = {};
  if (result.nonElim) {
    const id = result.nonElim.id;
    const carry = (state.pending[id] || 0) + (result.nonElim.penalty === 'departure' ? DEPARTURE_PENALTY : 0);
    if (carry) state.carryPenalty[id] = carry;
  }
  // goodbyes at the check-in time (finish plus the minutes served at the mat), so they air after the teams before them
  for (const id of result.eliminated) farewell(state, id, finished, times, rng, finish[id] != null, result.how[id]);
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
