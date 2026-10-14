// ══════════════════════════════════════════════════════════════════════
// ch/knowledge.js — what the house knows, and how it finds out
// ══════════════════════════════════════════════════════════════════════
//
// On the shared model (js/knowledge.js): a fact has a truth, each person holds
// a belief with a confidence and a source, beliefs spread person to person
// through people with reasons to lie, and sharp readers (mental + intuition)
// see through what is planted.
//
// The Challenge's split, which decides most of its paranoia:
//
//   PUBLIC   the vote (said out loud), the call-out, the Arena, a fight at a
//            party, a broken deal named in front of the room. Nobody has to
//            find these out; they are receipts (rel.js), not facts.
//   PRIVATE  who is in which alliance, who an alliance is aiming at, who has a
//            deal with whom, who threw the daily, who said yes to a plan and
//            meant no. These travel, or get spotted, or get deduced — and are
//            often wrong.
//
// Every roll here comes from a stream keyed on the season, the day and the
// people (script/rng.js stableRng): finding something out never moves the
// game's own dice.
import { gs } from '../core.js';
import { recordFact, learn, believes, factId, propagate, pruneStale, getFact } from '../knowledge.js';
import { stableRng } from '../script/rng.js';
import { getBond } from '../bonds.js';
import { S } from './state.js';

const day = state => state.day;

export function syncActive(state) {
  gs.activePlayers = [...state.active];
}

// ── facts ────────────────────────────────────────────────────────────
export function noteAlliance(state, al, members = al.members) {
  for (const m of members) {
    recordFact({ type: 'alliance', subject: m, object: String(al.id), payload: { name: al.name }, ep: state.ep });
    for (const k of al.members) learn(k, factId('alliance', m, String(al.id)), { sourceType: 'observed', source: 'in the room', ep: state.ep });
  }
}

export function noteTarget(state, planner, target, toldTo = []) {
  const id = factId('target', planner, target);
  recordFact({ type: 'target', subject: planner, object: target, ep: state.ep });
  learn(planner, id, { sourceType: 'observed', source: 'their own plan', ep: state.ep });
  const rng = stableRng(state.seed, 'target', state.ep, planner, target);
  for (const t of toldTo) learn(t, id, { sourceType: 'told', source: planner, from: planner, ep: state.ep, rng });
}

export function noteDeal(state, a, b) {
  recordFact({ type: 'deal', subject: a, object: b, ep: state.ep });
  for (const k of [a, b]) learn(k, factId('deal', a, b), { sourceType: 'observed', source: 'shook on it', ep: state.ep });
}

export function noteThrow(state, thrower, caughtBy = null) {
  recordFact({ type: 'throw', subject: thrower, ep: state.ep });
  learn(thrower, factId('throw', thrower), { sourceType: 'observed', source: 'did it', ep: state.ep });
  if (caughtBy) learn(caughtBy, factId('throw', thrower), { sourceType: 'observed', source: 'saw it', ep: state.ep });
}

// A yes that meant no: the one fact the audience gets and the house does not
// (Big Brother's vote operation, the same idea).
export function noteFalseYes(state, voter, alliance) {
  recordFact({ type: 'false-yes', subject: voter, object: String(alliance), ep: state.ep });
  learn(voter, factId('false-yes', voter, String(alliance)), { sourceType: 'observed', source: 'their own lie', ep: state.ep });
}

// A meeting can be SEEN. Outsiders with sharp eyes pick up who was in the room.
export function spotMeeting(state, al, present) {
  const out = [];
  for (const o of state.active) {
    if (al.members.includes(o)) continue;
    const r = stableRng(state.seed, 'spot', state.day, al.id, o)();
    if (r > S(o, 'intuition') * 0.035) continue;
    for (const m of present) learn(o, factId('alliance', m, String(al.id)), { sourceType: 'observed', source: 'saw them meeting', ep: state.ep, confidence: 0.75 });
    out.push(o);
  }
  return out;
}

// Outing an alliance in front of the room makes it public.
export function outAlliance(state, al, by) {
  for (const m of al.members.filter(x => state.active.includes(x))) {
    const id = factId('alliance', m, String(al.id));
    if (!getFact(id)) recordFact({ type: 'alliance', subject: m, object: String(al.id), payload: { name: al.name }, ep: state.ep });
    for (const o of state.active) learn(o, id, { sourceType: 'told', source: by, from: by, ep: state.ep, rng: stableRng(state.seed, 'out', state.ep, o, m) });
  }
}

// ── spread ───────────────────────────────────────────────────────────
// Who talks to whom: alliance mates, a partner, close friends — and anyone.
function contactsFor(state) {
  return knower => {
    const allies = new Set();
    for (const al of state.alliances) if (!al.ended && al.members.includes(knower)) al.members.forEach(m => allies.add(m));
    for (const c of state.couples) if (!c.ended && (c.a === knower || c.b === knower)) allies.add(c.a === knower ? c.b : c.a);
    for (const o of state.active) if (o !== knower && getBond(knower, o) >= 4) allies.add(o);
    allies.delete(knower);
    return { allies: [...allies].filter(n => state.active.includes(n)), others: state.active.filter(n => n !== knower) };
  };
}

export function spreadDay(state) {
  syncActive(state);
  const events = propagate(state.ep, { contacts: contactsFor(state), rng: stableRng(state.seed, 'spread', state.day), maxPerFact: 2 });
  pruneStale(state.ep);
  return events;
}

// ── queries ──────────────────────────────────────────────────────────
// The alliances `observer` believes exist: id → believed members.
export function believedAlliances(state, observer, minConf = 0.35) {
  const out = {};
  for (const al of state.alliances) {
    if (al.ended) continue;
    const seen = al.members.filter(m => state.active.includes(m) && (m === observer
      || (believes(observer, factId('alliance', m, String(al.id)), state.ep)?.effectiveConfidence || 0) >= minConf));
    if (seen.length >= 2) out[al.id] = seen;
  }
  return out;
}

export function knowsTarget(state, observer, planner, target) {
  return (believes(observer, factId('target', planner, target), state.ep)?.effectiveConfidence || 0) >= 0.35;
}

export function knowsThrow(state, observer, thrower) {
  return (believes(observer, factId('throw', thrower), state.ep)?.effectiveConfidence || 0) >= 0.4;
}

// Who believes `planner` is coming for `target` — the hunted find out this way.
export function believedHunters(state, target) {
  const out = [];
  for (const p of state.active) if (p !== target && knowsTarget(state, target, p, target)) out.push(p);
  return out;
}

export { day };
