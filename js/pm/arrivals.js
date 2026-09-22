// ══════════════════════════════════════════════════════════════════════
// pm/arrivals.js — "Islanders, we have a bombshell"
// ══════════════════════════════════════════════════════════════════════
//
// ONE OF THE FILES ALLOWED TO READ THE PUBLIC LEDGER. A bombshell watched the
// aired episodes from home (spec §7), so their eyes-on list may use what
// aired — at arrival, and nowhere else. The islanders' families watched it
// too, which is the other read in here (`familyVerdict`). A steal from a
// couple the public loves costs the bombshell approval.
import { addBond } from '../bonds.js';
import { seedAttraction, attr } from './chemistry.js';
import { noteArrival, readApproval, coupleScore } from './ledger.js';
import { makeEvent, partnerOf } from './events.js';

export function arriveIslander(state, name, { ep, seed, room = 'villa' }) {
  if (!state.villa.includes(name)) state.villa.push(name);
  if (room === 'casa' && !state.casa.includes(name)) state.casa.push(name);
  noteArrival(state.ledger, name, ep);
  seedAttraction(state, name, seed);
}

export function eyesOnFor(state, name) {
  const authored = (state.profiles[name].eyesOn || []).filter(n => n !== name && state.villa.includes(n));
  if (authored.length) return authored.slice(0, 3);
  return state.villa.filter(n => n !== name && attr(state, name, n) != null)
    .map(n => [n, attr(state, name, n) + readApproval(state.ledger, n) / 25])
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
}

export function arriveBombshell(state, name, { ep, seed, rng }) {
  arriveIslander(state, name, { ep, seed });
  const eyesOn = eyesOnFor(state, name);
  state.profiles[name].eyesOnResolved = eyesOn;
  const events = [makeEvent(state, rng, { phase: 'event', kind: 'entrance', players: [name],
    aired: true, major: [name], extra: { pop: { [name]: { approval: 0.5, fame: 3 } } } })];
  for (const t of eyesOn.slice(0, 2)) {
    addBond(name, t, 0.3 + 0.4 * ((attr(state, t, name) ?? 0) / 10));
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'date', players: [name, t],
      extra: { pop: { [name]: { approval: 0.2, fame: 1.5 }, [t]: { approval: 0, fame: 1 } } } }));
  }
  return { eyesOn, events };
}

export function bombshellSteal(state, name, { rng }) {
  const targets = (state.profiles[name].eyesOnResolved || eyesOnFor(state, name))
    .filter(t => partnerOf(state, t));
  if (!targets.length) return null;
  const stole = targets[0];
  const leftSingle = partnerOf(state, stole);
  const loved = Math.max(0, coupleScore(state.ledger, stole, leftSingle));
  state.couples = state.couples.filter(c => !c.includes(stole));
  state.couples.push([name, stole]);
  const ev = makeEvent(state, rng, { phase: 'event', kind: 'steal', players: [name, stole, leftSingle],
    aired: true, major: [name, stole, leftSingle],
    extra: { pop: { [name]: { approval: -0.05 * loved, fame: 3 },
      [stole]: { approval: 0, fame: 2 }, [leftSingle]: { approval: 1.5, fame: 2 } } } });
  return { stole, leftSingle, events: [ev] };
}

/** The villa splits. The moving gender goes to Casa; arrivals of that gender join the main villa. */
export function openCasa(state, casaNames, { ep, seed, rng, movingGender = 'f' }) {
  const movers = state.villa.filter(n => state.profiles[n].gender === movingGender);
  state.split = true;
  state.casa = [...movers];
  state.casaArrivals = [...casaNames];
  const events = [];
  for (const n of casaNames) {
    const room = state.profiles[n].gender === movingGender ? 'villa' : 'casa';
    arriveIslander(state, n, { ep, seed, room });
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'entrance', players: [n], aired: true,
      major: [n], extra: { pop: { [n]: { approval: 0.3, fame: 2 } } } }));
  }
  return events;
}

/**
 * What an islander's family thinks of their partner. Families watched the
 * AIRED show from home, like a bombshell did (spec §7), so they may read the
 * public ledger — and only here. -1..1.
 */
export function familyVerdict(state, name, partner) {
  const a = readApproval(state.ledger, partner) / 100;
  const belief = coupleScore(state.ledger, name, partner) / 100;
  return Math.max(-1, Math.min(1, 0.6 * a + 0.4 * belief));
}
