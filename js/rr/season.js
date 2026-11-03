// ══════════════════════════════════════════════════════════════════════
// rr/season.js — a whole season of The Ridonculous Race, headless
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3. The schedule says which legs eliminate; the route says where each leg
// goes; each leg is played on its own seeded stream, so a re-booked leg doesn't move
// any other (the DR lesson, project_dr_rebook). A team that leaves outside an
// elimination (a medevac with nobody coming back, a team that quits) turns the next
// elimination leg into a non-elimination one, as the Amazing Race does, so the final
// still starts with three. The franchise walks in with the cast (manual §8.3):
// carried bonds, and grudges as rivalries between their teams.
import { setGs } from '../core.js';
import { addBond, setBond, getBond } from '../bonds.js';
import { streamFor } from '../dr/rng.js';
import { newState, addTeams, teamOf, REL, FEEL, feelOf, S, mayScheme } from './state.js';
import { buildSchedule } from './schedule.js';
import { drawRoute } from './route.js';
import { PLACES } from './places.js';
import { DEFAULT_OPTIONS } from './format.js';
import { playLeg } from './leg.js';
import { playFinal } from './final.js';
import { medevac } from './chill.js';
import { pairKey } from './scenes.js';
import { canFancy } from './interest.js';
import { stableRng } from '../script/rng.js';

// The partner of a one-sided team who resents the other, when the Pairs view didn't say: one who may scheme over one
// who may not, then the less loyal, then the sharper (strategic).
export function resenterOf(t) {
  const score = n => (mayScheme(n) ? 100 : 0) + (10 - S(n, 'loyalty')) * 3 + S(n, 'strategic');
  return score(t.b) > score(t.a) ? t.b : t.a;
}

/** What the two of each team already are to each other, and how they feel about it, before the race changes it
 *  (state.js REL start, FEEL shift). */
export function walkIn(state) {
  // (the roster's people are cast before this: canFancy reads their gender, sexuality and age)
  for (const t of Object.values(state.teams)) {
    // (set, not added: addBond scales by temperament and archetype, and this is a starting point, not a moment)
    const start = (REL[t.rel]?.start || 0) + FEEL[feelOf(t)].shift;
    if (start) setBond(t.a, t.b, getBond(t.a, t.b) + start);
    // a one-sided team names who resents whom (the Pairs view); unnamed, it's the colder, sharper of the two
    if (feelOf(t) === 'one-sided' && ![t.a, t.b].includes(t.resents)) t.resents = resenterOf(t);
    // a secret crush is one of them in love with the other: never in a family, and only someone who could fancy their
    // partner at all (rr/interest.js); unnamed, whichever of the two can (both can: the seed picks). Nobody can: warm.
    if (feelOf(t) === 'crush') {
      const other = n => (n === t.a ? t.b : t.a);
      const can = [t.a, t.b].filter(n => canFancy(n, other(n)));
      if (REL[t.rel]?.family || !can.length) { delete t.feel; delete t.crusher; }
      else if (!can.includes(t.crusher)) t.crusher = can.length === 1 ? can[0] : can[Math.floor(stableRng(state.seed, 'rr-crusher', t.id)() * 2)];
    }
    // how they walked in, for what is written about the start once the race has changed it
    t.feel0 = feelOf(t);
    t.rel0 = t.rel;
  }
}

export function playRaceSeason({ teams, options = {}, seed = 1, carried = null }) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cast = teams.flatMap(t => [t.a, t.b]);
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, popularity: {}, activePlayers: [...cast] });
  const state = newState(seed, opts);
  addTeams(state, teams);
  state.lastOrder = [...state.order];

  walkIn(state);
  // the franchise walks in with them
  for (const s of carried?.sums || []) if (cast.includes(s.a) && cast.includes(s.b)) addBond(s.a, s.b, s.delta);
  for (const b of carried?.bonds || []) {
    if (!b.resent || !cast.includes(b.a) || !cast.includes(b.b)) continue;
    const ta = teamOf(state, b.a), tb = teamOf(state, b.b);
    if (!ta || !tb || ta === tb) continue;
    const k = pairKey(ta, tb);
    state.rivalry[k] = (state.rivalry[k] || 0) + Math.min(3, Math.max(1, Math.round(Math.abs(b.delta) * 0.6)));
  }
  state.kin = (carried?.kin || []).filter(k => cast.includes(k.a) && cast.includes(k.b));

  const schedule = buildSchedule({ teams: teams.length, options: opts, seed });
  state.totalLegs = schedule.length;
  const route = drawRoute({ legs: schedule.length, seed, options: opts });
  const legs = [];
  const outOrder = [];
  let owedNonElim = 0;
  let final = null;

  for (const planned of schedule) {
    const n = planned.n;
    // a leg re-run from the run tab (options.rerolls: { leg: times }) draws again; every earlier leg is untouched
    const rng = streamFor(seed, opts.rerolls?.[n] ? `leg${n}r${opts.rerolls[n]}` : `leg${n}`);
    for (let i = 0; i < 4; i++) rng();
    const from = n === 1 ? null : PLACES[route[n - 2]];
    const to = PLACES[route[n - 1]];
    const active = state.order.filter(id => !state.gone.includes(id));
    if (planned.kind === 'final') {
      final = playFinal(state, { ...planned }, from, to, rng);
      legs.push(final);
      break;
    }
    // too few teams left to eliminate here and still race a three-team final, or a debt
    // from a team that left outside an elimination: this leg doesn't eliminate
    let leg = { ...planned };
    if (leg.kind === 'elim' && (owedNonElim > 0 || active.length <= 3)) {
      if (owedNonElim > 0) owedNonElim--;
      leg = { ...leg, kind: 'non', nonElimPenalty: leg.nonElimPenalty || 'departure', converted: true };
    }
    const r = playLeg(state, leg, from, to, rng);
    if (leg.converted) r.converted = true;
    legs.push(r);
    outOrder.push(...r.eliminated);

    // after the leg: a serious injury is a medevac; a team that wants out goes
    for (const id of state.order.filter(x => !state.gone.includes(x))) {
      if (state.injured?.[id] === n) {
        const m = medevac(state, id, n, rng);
        outOrder.push(id);
        if (m.returned) outOrder.splice(outOrder.indexOf(m.returned), 1);
        else owedNonElim++;
      } else if (state.quitting?.[id] === n) {
        state.gone.push(id);
        outOrder.push(id);
        owedNonElim++;
      }
    }
    // a team out early makes the schedule long: the remaining elimination legs still need three at the final
    const left = state.order.filter(id => !state.gone.includes(id)).length;
    const elimsAhead = schedule.filter(l => l.n > n && l.kind === 'elim').length;
    owedNonElim = Math.max(owedNonElim, elimsAhead - Math.max(0, left - 3));
  }

  // placements: the final's three on top, then the order teams left, last out first
  const placements = {};
  if (final) {
    final.order.forEach((id, i) => { placements[id] = i + 1; });
    if (final.midOut) placements[final.midOut] = final.order.length + 1;
  }
  let place = Object.keys(placements).length + 1;
  for (const id of [...outOrder].reverse()) if (placements[id] == null) placements[id] = place++;
  for (const id of state.order) if (placements[id] == null) placements[id] = place++;

  return { state, legs, final, winner: final?.winner ?? null, placements };
}
