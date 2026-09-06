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

/**
 * Two queens want the same thing.
 *
 * The shared resolver for every draft where the choices are finite and named —
 * Snatch Game characters, Rusical parts, roast slots, materials. `choices` is
 * each queen's preference list, best first; the order decides who keeps it.
 *
 * A queen who misses her first choice carries a PENALTY into the performance,
 * because playing your second-choice character is measurably harder than
 * playing the one you had prepared. And the pair remember it.
 */
export function contestFor({ order, choices, players, rng }) {
  const taken = new Set();
  const holder = {};
  const picks = {};
  const events = [];

  for (const n of order) {
    const wants = choices[n] || [];
    let got = null;
    let penalty = 0;
    let lostTo = null;

    for (let i = 0; i < wants.length; i++) {
      if (!taken.has(wants[i])) {
        got = wants[i];
        penalty = i ? 0.8 : 0;
        if (i) lostTo = holder[wants[0]] || null;
        break;
      }
    }

    if (!got) {
      // Everything she wanted is gone. She takes what is left, and it costs
      // double — this is the queen picking last with nothing prepared.
      got = `leftover-${n}`;
      penalty = 1.6;
      lostTo = holder[wants[0]] || null;
    }

    taken.add(got);
    holder[got] = n;
    picks[n] = { choice: got, penalty, lostTo };

    if (lostTo) {
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
