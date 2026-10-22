// ══════════════════════════════════════════════════════════════════════
// rr/lift.js — an elevator: one car, two teams a ride
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-22, on Home City's Sky-deck: "the elevator say 2 at time but what we see its more like evieandnura
// are alone in it then suddenly thre with bowieandsami then right after theyre now with thomandspencer ... we dont see
// them waiting for the elevator and fighting for one of the 2 places or trying to get on it faster than everyone else
// and close the door (only if they have an advance its possible obviously)".
//
// A side with `lift: true` starts at the elevator doors. The car takes `seats` teams a ride; it leaves `doors` minutes
// after the first team steps in (or when it gets back down, if teams were waiting for it), rides up, and comes back
// down before it can take anybody else. A team takes the first ride with room that hasn't left; the rides are kept on
// the state (state.lifts['<leg>|<stretch>']: { rides: [{ id, dep, teams }], riders: { team: { at, ride, missed, by } } })
// so the episode can say who rode with whom, who waited and who was left at the doors.
//
// Three moments, each only where it can happen:
//   the doors are closing on a team already inside when another runs up: it holds them, or (a team that may scheme,
//     the rules on archetypes) shuts them in the runner's face: it is in first, it has the advance
//   the car at the doors is full: the doors close on the team that just got there
//   three teams waiting for a full car: when it comes, the last of the two inside can lose the place to a team that
//     pushes past (one that may scheme), or keep it and argue
import { mayScheme, S } from './state.js';
import { playScene } from './scenes.js';

export const LIFT = { seats: 2, doors: 1, ride: 4, back: 3 };
export const LIFT_STAGES = new Set(['lift-doors', 'elevator']);

const cycle = LIFT.ride + LIFT.back;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const lead = (state, id) => state.lead?.[id] || state.teams[id].a;

function liftAt(state, stretchId) {
  state.lifts ||= {};
  return (state.lifts[`${state.leg}|${stretchId}`] ||= { rides: [], riders: {} });
}

// the first minute from `from` the car can leave and be back down without being up the tower on another ride
function nextFree(L, from) {
  const busy = d => L.rides.some(r => d < r.dep + cycle && r.dep < d + cycle);
  return [from, ...L.rides.map(r => r.dep + cycle).filter(x => x >= from)].sort((a, b) => a - b).find(d => !busy(d));
}
const openRide = (L, t, not = null) => L.rides.filter(r => r !== not && r.dep >= t && r.teams.length < LIFT.seats).sort((a, b) => a.dep - b.dep)[0] || null;
function newRide(L, from) {
  const r = { id: L.rides.length + 1, dep: nextFree(L, from), teams: [] };
  L.rides.push(r);
  return r;
}
const rivalryOf = (state, a, b) => state.rivalry?.[[a, b].sort().join('|')] || 0;
const both = (state, id) => [state.teams[id].a, state.teams[id].b];
// the one of a team who does a move only a schemer may make: the lead if they may, else the partner if they may
const schemer = (state, id) => [lead(state, id), ...both(state, id)].find(n => mayScheme(n)) || null;

// `doer` speaks first (a): the one who shut the doors, pushed past, held them
function moment(state, stretch, kind, tid, oid, t, rng, ending, doer = lead(state, tid)) {
  const [x, y] = both(state, tid);
  const people = [doer, doer === x ? y : x, ...both(state, oid)];
  playScene({ state, team: { id: tid }, other: { id: oid }, moment: 'overlap', present: [tid, oid], stretch, t, people }, kind, rng, { ending });
}
// a team already given its ride is moved to another: its doors and its ride on its run (the rest moves with api.delay)
function moveTo(state, stretch, id, dep) {
  const st = state.attempts?.[id]?.[stretch.id]?.stages || [];
  for (const x of st) {
    if (x.id === 'lift-doors') x.t = dep;
    if (x.id === 'elevator') x.t = dep + LIFT.ride;
  }
}

/** A team reaches the elevator doors at minute t: the ride it takes. Moves the teams a moment pushes about (api.delay). */
export function rideLift(state, stretch, id, t, api, rng) {
  const L = liftAt(state, stretch.id);
  const me = { at: t, ride: null, missed: null, by: null };
  L.riders[id] = me;
  // (only a team getting there now: a team walking round from the other side later just takes its ride)
  const live = !api || t - (api.now ?? t) <= 2;
  const take = r => { r.teams.push(id); me.ride = r.id; return { dep: r.dep, ride: r.id }; };
  let gone = null;   // the car shut in this team's face: not the one it gets on

  if (live) {
    // the car at the doors, full: they close in this team's face
    // (only teams already there: a team walking round from the other side later is booked, not at the doors yet)
    const there = r => r.teams.every(x => (L.riders[x]?.at ?? Infinity) <= t);
    const full = L.rides.find(r => r.teams.length >= LIFT.seats && r.dep >= t && r.dep - t <= LIFT.doors && there(r));
    if (full) {
      me.missed = 'full';
      me.by = full.teams.at(-1);
      moment(state, stretch, 'lift-door', full.teams.at(-1), id, t, rng, 'full');
    }
    // three teams for two places: the car isn't down yet and the two waiting are going on it
    const queued = !full && L.rides.find(r => r.teams.length >= LIFT.seats && r.dep - t > LIFT.doors && !r.scramble && there(r));
    if (queued) {
      queued.scramble = true;
      const c = queued.teams.at(-1);
      const mine = schemer(state, id), theirs = lead(state, c);
      const p = mine ? clamp(0.2 + 0.05 * (S(mine, 'physical') - S(theirs, 'physical')) + 0.04 * (S(mine, 'boldness') - 5)
        + 0.05 * rivalryOf(state, id, c), 0.05, 0.7) : 0;
      if (rng() < p) {
        // pushed past: this team takes the place, and the one it bumped waits for the next car
        queued.teams[queued.teams.length - 1] = id;
        me.ride = queued.id;
        const them = L.riders[c];
        them.missed = 'pushed';
        them.by = id;
        const next = openRide(L, queued.dep, queued) || newRide(L, queued.dep + cycle);
        next.teams.push(c);
        them.ride = next.id;
        // (a talk already set for the ride up with the team still in the car happened at the doors, before the push:
        // 2026-10-22, the bumped team was seen in the car with a team it never rode with)
        const mates = queued.teams.filter(x => x !== id);
        for (const sc of state.scenes) {
          const d = sc.data || {};
          if (sc.leg !== state.leg || d.stretch !== stretch.id || d.t == null || d.t < queued.dep - 0.5) continue;
          if (![d.team, d.other].includes(c) || !mates.some(x => [d.team, d.other].includes(x))) continue;
          const mate = [d.team, d.other].find(x => x !== c);
          d.t = (Math.max(them.at, L.riders[mate]?.at ?? them.at) + t) / 2;
        }
        moveTo(state, stretch, c, next.dep);
        api?.delay?.(c, next.dep - queued.dep);
        moment(state, stretch, 'lift-scramble', id, c, t, rng, 'pushed-in', mine);
        return { dep: queued.dep, ride: queued.id };
      }
      if (rng() < 0.6) moment(state, stretch, 'lift-scramble', c, id, t, rng, 'held-line');
    }
    // the doors closing on one team inside as this one runs up: held, or shut by a team that's in first
    const closing = openRide(L, t);
    if (closing && closing.teams.length === 1 && closing.dep - t <= LIFT.doors && there(closing)) {
      const inside = closing.teams[0];
      const who = schemer(state, inside);
      const p = who ? clamp(0.3 + 0.06 * (S(who, 'boldness') - 5) - 0.04 * (S(who, 'loyalty') - 5)
        + 0.08 * rivalryOf(state, inside, id), 0.05, 0.85) : 0;
      if (rng() < p) {
        const was = closing.dep;
        // (no sooner than the car is back down from the ride before: shutting the doors can't bring it back faster)
        const back = Math.max(-Infinity, ...L.rides.filter(r => r !== closing && r.dep < was).map(r => r.dep + cycle));
        closing.dep = Math.min(was, Math.max(t, back));
        moveTo(state, stretch, inside, closing.dep);
        api?.delay?.(inside, closing.dep - was);
        me.missed = 'shut';
        me.by = inside;
        gone = closing;
        moment(state, stretch, 'lift-door', inside, id, t, rng, 'shut', who);
      } else {
        moment(state, stretch, 'lift-door', inside, id, t, rng, 'held');
        return take(closing);
      }
    }
  }
  const r = openRide(L, t, gone) || newRide(L, t + LIFT.doors);
  return take(r);
}

/** What the episode can say about a team at an elevator: who rode with it, whether it waited, missed a car. */
export function liftFacts(state, leg, stretchId, team, t) {
  const L = state.lifts?.[`${leg}|${stretchId}`];
  if (!L) return {};
  const me = L.riders[team];
  const ride = me ? L.rides.find(r => r.id === me.ride) : null;
  // teams standing at the doors at minute t (a team deciding sees the line)
  const waiting = t == null ? 0 : Object.values(L.riders).filter(x => {
    const r = L.rides.find(y => y.id === x.ride);
    return r && x.at <= t && t < r.dep;
  }).length;
  return {
    liftWith: ride ? ride.teams.length >= 2 : null,
    liftWaited: ride ? ride.dep - me.at >= 3 : null,
    liftMissed: me ? !!me.missed : null,
    liftQueue: waiting >= 2,
  };
}
