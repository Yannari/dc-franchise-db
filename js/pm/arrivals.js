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
import { noteArrival, readApproval, coupleScore, BETRAYAL } from './ledger.js';
import { makeEvent, partnerOf } from './events.js';
import { romance, friendship } from './feelings.js';
import { closedness } from './ladder.js';
import { breakHeart } from './emotions.js';

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
    extra: { pop: { [name]: { approval: -(BETRAYAL.bombshellSteal + 0.05 * loved), fame: 3 },
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
  // The first few walk in one at a time; a big Casa's rest arrive together,
  // one group per villa. Eleven single entrances from a handful of lines read
  // as the same scene six times (measured at a 40-islander cast).
  const SOLO = 4;
  const rest = { villa: [], casa: [] };
  casaNames.forEach((n, i) => {
    const room = state.profiles[n].gender === movingGender ? 'villa' : 'casa';
    arriveIslander(state, n, { ep, seed, room });
    if (i < SOLO) {
      events.push(makeEvent(state, rng, { phase: 'event', kind: 'entrance', players: [n], aired: true,
        major: [n], extra: { pop: { [n]: { approval: 0.3, fame: 2 } } } }));
    } else rest[room].push(n);
  });
  for (const group of Object.values(rest)) {
    if (!group.length) continue;
    events.push(makeEvent(state, rng, { phase: 'event', kind: group.length > 1 ? 'group-entrance' : 'entrance',
      players: group, aired: true, major: [...group],
      extra: { pop: Object.fromEntries(group.map(n => [n, { approval: 0.3, fame: 1.5 }])) } }));
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

// ── HOW A BOMBSHELL NIGHT CAN PLAY (Plan 4.5 phase 2) ─────────────────
// Each is one real format, read from the seasons named beside it, and each
// returns its scenes; the moment (pm/moments.js) dumps anyone it sends home.

// The islanders already there: two bombshells walking in on the same night do
// not stand up for, save or get coupled with each other (measured: the second
// stood for the first, who had just heard nobody stand).
const otherSide = (state, name, tonight = []) => state.villa.filter(n => n !== name && !tonight.includes(n) && attr(state, name, n) != null);

/** Take `pick` for `name`; whoever `pick` was with is left single. */
function coupleWith(state, name, pick) {
  const left = partnerOf(state, pick);
  state.couples = state.couples.filter(c => !c.includes(pick) && !c.includes(name));
  state.couples.push([name, pick]);
  if (left) breakHeart(state, left, pick, 5 * romance(left, pick) / 10);
  return left;
}

/**
 * STAND UP TO BE CHOSEN (UK 12 d24, US 7 d3, US 8 d3). The other side stands
 * if they are interested — in front of their partners — and the bombshell can
 * only choose one who stood. Nobody standing is its own kind of night.
 * Standing reads what the islander feels for the bombshell against how
 * closed off they are with the partner beside them, proportionally.
 */
export function standUp(state, name, { rng, tonight = [] }) {
  const events = [];
  const standers = [];
  for (const c of otherSide(state, name, tonight)) {
    const partner = partnerOf(state, c);
    const want = (attr(state, c, name) ?? 0) / 10;
    const hold = partner ? 0.35 + 0.65 * closedness(state, c, partner) : 0;
    const bold = state.profiles[c].stats.boldness / 10;
    const p = Math.max(0, Math.min(0.95, want * (0.5 + 0.5 * bold) - 0.6 * hold));
    if (rng() >= p) continue;
    standers.push(c);
    if (partner) {
      addBond(partner, c, -1.2 * (0.4 + closedness(state, partner, c)));
      breakHeart(state, partner, c, 1.5 * romance(partner, c) / 10);
    }
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'stand-up', players: partner ? [c, name, partner] : [c, name],
      aired: true, major: partner ? [c] : [],
      extra: { pop: partner ? { [c]: { approval: -0.8, fame: 1.5 }, [partner]: { approval: 0.8, fame: 1 } }
        : { [c]: { approval: 0.1, fame: 0.8 } } } }));
  }
  if (!standers.length) {
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'nobody-stands', players: [name], aired: true, major: [name],
      extra: { pop: { [name]: { approval: 0.8, fame: 2 } } } }));
    return { events, coupled: null };
  }
  const pick = standers.map(c => [c, (attr(state, name, c) ?? 0) + 2 * Math.max(0, friendship(name, c)) / 10 + (rng() - 0.5)])
    .sort((a, b) => b[1] - a[1])[0][0];
  const left = partnerOf(state, pick);
  const loved = left ? Math.max(0, coupleScore(state.ledger, pick, left)) : 0;
  events.push(makeEvent(state, rng, { phase: 'event', kind: 'stand-up-pick', players: left ? [name, pick, left] : [name, pick],
    aired: true, major: left ? [name, pick, left] : [name],
    extra: { stole: left || null, pop: { [name]: { approval: left ? -(BETRAYAL.bombshellSteal + 0.05 * loved) : 0.3, fame: 3 },
      [pick]: { approval: 0, fame: 2 }, ...(left ? { [left]: { approval: 1.5, fame: 2 } } : {}) } } }));
  coupleWith(state, name, pick);
  return { events, coupled: pick };
}

/**
 * THE BOMBSHELL SAVES ONE (UK 12 d9, US 6 d27, US 8 d10). The singles of the
 * other side are at risk; the bombshell dates them and keeps one. The rest
 * are dumped — unless the villa has nobody to spare, when they stay single.
 * Needs two singles to be a choice; with fewer the night is only dates.
 */
export function bombshellSaves(state, name, { rng, spare = true, tonight = [] }) {
  const singles = otherSide(state, name, tonight).filter(n => !partnerOf(state, n));
  if (singles.length < 2) return null;
  const events = [makeEvent(state, rng, { phase: 'event', kind: 'save-setup', players: singles.slice(0, 2), aired: true,
    major: [...singles], extra: { pop: Object.fromEntries(singles.map(n => [n, { approval: 0.3, fame: 1.5 }])) } })];
  for (const s of singles.slice(0, 3)) {
    addBond(name, s, 0.3 + 0.4 * ((attr(state, s, name) ?? 0) / 10));
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'date', players: [name, s], aired: true,
      extra: { pop: { [name]: { approval: 0.2, fame: 1 }, [s]: { approval: 0.1, fame: 1 } } } }));
  }
  const pick = singles.map(s => [s, (attr(state, name, s) ?? 0) + 3 * Math.max(0, friendship(name, s)) / 10 + (rng() - 0.5)])
    .sort((a, b) => b[1] - a[1])[0][0];
  const rest = singles.filter(s => s !== pick);
  events.push(makeEvent(state, rng, { phase: 'event', kind: 'bombshell-save', players: [name, pick, rest[0]], aired: true,
    major: [name, pick], extra: { pop: { [name]: { approval: 0.3, fame: 2.5 }, [pick]: { approval: 0.5, fame: 2 } } } }));
  coupleWith(state, name, pick);
  return { events, saved: pick, dumped: spare ? rest : [] };
}

/**
 * THE PUBLIC COUPLES THE BOMBSHELL (US 7 d11, US 8 d10). Viewers voted for
 * who the new arrival should couple up with, so it reads what AIRED — whom the
 * public likes, and whom the bombshell was seen to fancy — and nothing the
 * islanders decided. Whoever the chosen islander was with is left single.
 */
export function publicMatch(state, name, { rng, tonight = [] }) {
  const pool = otherSide(state, name, tonight);
  if (!pool.length) return null;
  const pick = pool.map(c => [c, readApproval(state.ledger, c) / 25 + (attr(state, name, c) ?? 0) / 10 + (rng() - 0.5) * 0.6])
    .sort((a, b) => b[1] - a[1])[0][0];
  const left = partnerOf(state, pick);
  const events = [makeEvent(state, rng, { phase: 'event', kind: 'public-match', players: left ? [name, pick, left] : [name, pick],
    aired: true, major: left ? [name, pick, left] : [name, pick],
    extra: { stole: left || null, pop: { [name]: { approval: 0.2, fame: 2.5 }, [pick]: { approval: 0, fame: 2 },
      ...(left ? { [left]: { approval: 1.2, fame: 2 } } : {}) } } })];
  coupleWith(state, name, pick);
  return { events, coupled: pick };
}
