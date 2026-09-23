// ══════════════════════════════════════════════════════════════════════
// pm/one-offs.js — the twists a season plays at most once (Plan 4.5 phase 3)
// ══════════════════════════════════════════════════════════════════════
//
// Each is one real format, read from the seasons named beside it. None reads
// the public ledger: these are what the islanders and the producers do, not
// what the public voted (the returning islander, which IS the public's
// choice, lives in arrivals.js with the other ledger readers).
import { addBond } from '../bonds.js';
import { attr } from './chemistry.js';
import { makeEvent, partnerOf } from './events.js';
import { romance, friendship } from './feelings.js';
import { closedness, coupleStrength } from './ladder.js';
import { breakHeart } from './emotions.js';

const others = (state, name, tonight) => state.villa.filter(n => n !== name && !tonight.includes(n));

/**
 * THE SECRET MISSION (UK 13 d3). The host tells a new arrival, in private, to
 * choose a boy and a girl to dump — and once they have, the two are given a
 * second chance and walk back in. Nobody leaves; what changes is that the
 * villa now knows what the new arrival was willing to do. The bombshell picks
 * the islanders whose couples look weakest to someone who has just arrived:
 * the ones they have least reason to like, in the loosest couples.
 */
export function secretMission(state, name, { rng, tonight = [] }) {
  const pool = others(state, name, tonight);
  const pickFrom = g => pool.filter(n => state.profiles[n].gender === g)
    .map(n => { const p = partnerOf(state, n);
      return [n, friendship(name, n) + (attr(state, name, n) ?? 0) / 3 + (p ? 4 * coupleStrength(state, n, p) : 0) + (rng() - 0.5)]; })
    .sort((a, b) => a[1] - b[1])[0]?.[0];
  const boy = pickFrom('m'), girl = pickFrom('f');
  if (!boy || !girl) return null;
  const events = [makeEvent(state, rng, { phase: 'event', kind: 'mission-brief', players: [name], aired: true,
    extra: { pop: { [name]: { approval: 0, fame: 1 } } } })];
  for (const n of [girl, boy]) {
    addBond(n, name, -2.5);
    const p = partnerOf(state, n);
    if (p) { addBond(p, name, -1.5); breakHeart(state, p, name, 0.5); }
  }
  events.push(makeEvent(state, rng, { phase: 'firepit', kind: 'mission-dump', players: [name, girl, boy], aired: true,
    major: [name, girl, boy], extra: { pop: { [name]: { approval: -1.5, fame: 3 }, [girl]: { approval: 1, fame: 2 }, [boy]: { approval: 1, fame: 2 } } } }));
  events.push(makeEvent(state, rng, { phase: 'firepit', kind: 'mission-return', players: [girl, boy], aired: true,
    major: [girl, boy], extra: { pop: { [girl]: { approval: 0.8, fame: 2 }, [boy]: { approval: 0.8, fame: 2 } } } }));
  return { events, chose: [girl, boy] };
}

/**
 * THE SLEEPOVER VILLA (UK 12 d15-17). Each new arrival invites one islander
 * who is coupled up to a separate villa for two nights; then each invited
 * islander chooses to stay with their partner or couple up with the one who
 * invited them. A bombshell nobody twisted for is dumped; a partner left
 * behind is single. The choice is the Casa Amor question, asked of one
 * islander at a time: how settled the couple is, against the pull.
 */
export function sleepover(state, arriving, { rng }) {
  const events = [], dumped = [], invited = new Set();
  const pairs = [];
  for (const b of arriving) {
    const x = others(state, b, arriving).filter(n => partnerOf(state, n) && !invited.has(n) && attr(state, b, n) != null)
      .map(n => [n, (attr(state, b, n) ?? 0) + (rng() - 0.5)]).sort((p, q) => q[1] - p[1])[0]?.[0];
    if (!x) continue;
    invited.add(x);
    pairs.push([b, x, partnerOf(state, x)]);
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'sleepover-invite', players: [b, x, partnerOf(state, x)], aired: true,
      major: [x], extra: { pop: { [b]: { approval: 0, fame: 2 }, [x]: { approval: -0.2, fame: 1.5 } } } }));
  }
  if (!pairs.length) return null;
  for (const [b, x] of pairs) {
    addBond(b, x, 0.8 + 0.6 * ((attr(state, x, b) ?? 0) / 10));
    // Its own scene, not a date: the arrival already took them on one tonight.
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'sleepover-night', players: [b, x], aired: true,
      extra: { pop: { [b]: { approval: 0.2, fame: 1 }, [x]: { approval: 0, fame: 1 } } } }));
  }
  for (const [b, x, p] of pairs) {
    const stay = romance(x, p) / 10 + 0.8 * closedness(state, x, p) + 0.4 * state.profiles[x].stats.loyalty / 10;
    const go = (attr(state, x, b) ?? 0) / 10 + romance(x, b) / 10;
    const twist = go + (rng() - 0.5) * 0.4 > stay;
    if (twist) {
      state.couples = state.couples.filter(c => !c.includes(x));
      state.couples.push([b, x]);
      breakHeart(state, p, x, 5 * romance(p, x) / 10);
      events.push(makeEvent(state, rng, { phase: 'firepit', kind: 'sleepover-choice', players: [x, b, p], aired: true,
        major: [x, b, p], extra: { choice: 'twist', stole: p, pop: { [x]: { approval: -2, fame: 3 }, [p]: { approval: 1.5, fame: 2 } } } }));
    } else {
      addBond(x, p, 0.5);
      events.push(makeEvent(state, rng, { phase: 'firepit', kind: 'sleepover-choice', players: [x, p, b], aired: true,
        major: [x], extra: { choice: 'stick', pop: { [x]: { approval: 1, fame: 2 }, [p]: { approval: 0.5, fame: 1 } } } }));
      dumped.push(b);
    }
  }
  // An arrival who invited nobody (nobody coupled was left) is dumped too.
  for (const b of arriving) if (!pairs.some(([x]) => x === b)) dumped.push(b);
  return { events, dumped };
}

/**
 * IMMUNITY (US 8: the karaoke winners were safe from the dumping). A couples'
 * challenge before the vote; the couple who win cannot be at risk tonight.
 * Won on the challenge — both islanders' physical, social and boldness —
 * never on popularity.
 */
export function immunityChallenge(state, { rng }) {
  if (state.couples.length < 3) return null;
  const score = c => c.reduce((s, n) => { const st = state.profiles[n].stats; return s + st.physical + st.social + st.boldness; }, 0) / 2 + rng() * 6;
  const win = [...state.couples].map(c => [c, score(c)]).sort((a, b) => b[1] - a[1])[0][0];
  const events = [makeEvent(state, rng, { phase: 'event', kind: 'immunity-win', players: [...win], aired: true, major: [...win],
    extra: { pop: Object.fromEntries(win.map(n => [n, { approval: 0.5, fame: 2 }])) } })];
  return { events, immune: [...win] };
}
