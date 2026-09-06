// ══════════════════════════════════════════════════════════════════════
// dr/assign.js — who gets what, and the drama that causes
// ══════════════════════════════════════════════════════════════════════
//
// Handing out roles is the first place a week stops being a stat check. Two
// queens want the same Snatch Game character and one of them does not get it;
// a captain builds a team and somebody is picked last. Neither changes a craft
// stat, and both change the night.
//
// So every function here returns EVENTS as well as an answer. A draft that
// merely produced an assignment would be a shuffle with extra steps.
import { canScheme, evt } from './rules.js';

/** How much of the camera a role gets. Used to rank what a queen wants. */
export const ROLE_SPOTLIGHT = { lead: 1.0, featured: 0.7, standard: 0.45, ensemble: 0.2 };

/** The mini rewards that are worth a place at the front of the line. */
const ORDER_BUYS = new Set(['pick-order', 'first-pick']);

/**
 * The order queens choose in.
 *
 * A mini winner leads it when her win bought that — and when the caller passes
 * no mini record at all, which is the caller saying "she won something that
 * puts her first" without naming it. A mini that bought a captaincy or a cash
 * prize does not move her: the reward has to match what is being handed out,
 * or every mini quietly becomes the same mini.
 */
export function pickOrder({ living, miniWinner, mini, rng }) {
  const order = [...living].sort(() => rng() - 0.5);
  const leads = miniWinner && order.includes(miniWinner)
    && (mini ? ORDER_BUYS.has(mini.buys) : true);
  if (leads) {
    order.splice(order.indexOf(miniWinner), 1);
    order.unshift(miniWinner);
  }
  return order;
}

/**
 * Each queen takes the best role still free — usually.
 *
 * `boldness` cuts both ways, and that is the interesting part: a bold queen
 * grabs the lead, and a timid one ducks it on purpose. Ducking is a DECISION,
 * recorded on the pick, because "she had the chance and did not take it" is a
 * thing the panel says about somebody in the bottom later.
 */
export function draftRoles({ order, roleNames, rng, players = {} }) {
  const free = [...roleNames].sort((a, b) => (ROLE_SPOTLIGHT[b] || 0) - (ROLE_SPOTLIGHT[a] || 0));
  const roles = {};
  const picks = [];

  for (const n of order) {
    if (!free.length) {
      roles[n] = 'ensemble';
      picks.push({ name: n, role: 'ensemble', ducked: false });
      continue;
    }
    const bold = (Number(players[n]?.stats?.boldness) || 5) / 10;
    const duck = free.length > 1 && rng() > bold * 0.9 + 0.1;
    const idx = duck ? Math.min(free.length - 1, 1 + Math.floor(rng() * (free.length - 1))) : 0;
    const role = free.splice(idx, 1)[0];
    roles[n] = role;
    picks.push({ name: n, role, ducked: duck });
  }
  return { roles, picks };
}

/**
 * Captains alternate picks.
 *
 * A captain takes somebody she likes when she can. A SCHEMING captain does
 * something else first: she makes sure her worst enemy is on the other team,
 * which is a real strategy and reads as one — the room notices, and it costs
 * her. Once per split, because a captain who dumps everybody is a cartoon.
 */
export function captainSplit({ order, captains, players, bond, rng }) {
  const teams = captains.map(c => [c]);
  const pool = order.filter(n => !captains.includes(n));
  const events = [];
  let turn = 0;
  let dumped = false;

  while (pool.length) {
    const cap = captains[turn % captains.length];
    const other = (turn + 1) % captains.length;

    if (!dumped && canScheme(players[cap]) && pool.length > 1) {
      const worst = pool.reduce((w, n) => (bond(cap, n) < bond(cap, w) ? n : w), pool[0]);
      if (bond(cap, worst) <= -4) {
        teams[other].push(worst);
        pool.splice(pool.indexOf(worst), 1);
        dumped = true;
        events.push(evt('dump', {
          players: [cap, worst],
          bond: [[cap, worst, -1.5]],
          pop: { [cap]: -2 },
          data: { captain: cap, dumped: worst },
        }));
        turn++;
        continue;
      }
    }

    const best = pool.reduce((b, n) => (bond(cap, n) > bond(cap, b) ? n : b), pool[0]);
    const chosen = bond(cap, best) > 2 ? best : pool[Math.floor(rng() * pool.length)];
    teams[turn % captains.length].push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
    turn++;
  }
  return { teams, events };
}

/** How far down the list a queen with nothing left has fallen. */
const LEFTOVER_DEPTH = 4;

/**
 * What missing your first choice costs, by how far you fell.
 *
 * GRADUATED, because a flat fee is wrong in both directions. Measured on a
 * thirteen-queen roast, where the shortlists are nearly identical because
 * every bold queen wants the closer: a flat 0.8 charged twelve of the thirteen
 * the same amount, so the queen who got her second choice paid exactly what
 * the queen who got her last one paid. Second choice is a shrug; nothing left
 * at all is a night she did not prepare for.
 */
function penaltyFor(depth, scale = 1) {
  return Math.round(Math.min(1.6, Math.max(0, depth) * 0.4) * scale * 100) / 100;
}

/**
 * Two queens want the same thing.
 *
 * The shared resolver for every draft where the choices are finite and named —
 * Snatch Game characters, Rusical parts, roast slots, materials. `choices` is
 * each queen's preference list, best first; the order decides who keeps it.
 *
 * A queen who misses her first choice may carry a PENALTY into the
 * performance, because playing your second-choice character is measurably
 * harder than playing the one you had prepared. And the pair remember it.
 *
 * `penaltyScale` EXISTS TO TURN THAT OFF, and most callers should. The penalty
 * means "I prepared for something else", which is true of a Snatch Game
 * character or a Rusical part and false of a roast slot, a makeover partner, a
 * lip sync opponent or a pile of materials: she gets those on the day, and
 * how hard each one is to work with is ALREADY scored by the challenge. Paying
 * the penalty on top of that charges her twice for the same fact. Only the
 * conflict — the event, the bond — belongs everywhere.
 */
export function contestFor({ order, choices, players, rng, penaltyScale = 1 }) {
  const taken = new Set();
  const holder = {};
  const picks = {};
  const events = [];
  // One scene per contested thing. Thirteen queens with near-identical
  // shortlists all lose the same slot to the same queen, and reporting that as
  // twelve separate conflicts buries the one that actually happened.
  const fought = new Set();

  for (const n of order) {
    const wants = choices[n] || [];
    let got = null;
    let depth = -1;

    for (let i = 0; i < wants.length; i++) {
      if (!taken.has(wants[i])) { got = wants[i]; depth = i; break; }
    }

    if (!got) {
      // Everything she wanted is gone. She takes what is left, and it costs
      // the most — this is the queen picking last with nothing prepared.
      got = `leftover-${n}`;
      depth = LEFTOVER_DEPTH;
    }

    const penalty = penaltyFor(depth, penaltyScale);
    const lostTo = depth > 0 ? (holder[wants[0]] || null) : null;

    taken.add(got);
    holder[got] = n;
    picks[n] = { name: n, choice: got, penalty, lostTo, depth };

    if (lostTo && !fought.has(wants[0])) {
      fought.add(wants[0]);
      events.push(evt('contest', {
        players: [lostTo, n],
        bond: [[lostTo, n, -1.0]],
        // The one who lost out gets the room's sympathy, which is worth
        // something on a show where the audience is watching.
        pop: { [n]: 1 },
        data: { over: wants[0], keeper: lostTo, loser: n },
      }));
    }
  }
  void players;
  void rng;
  return { picks, events };
}
