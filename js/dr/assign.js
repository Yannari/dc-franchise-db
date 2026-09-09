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
export function captainSplit({ order, captains, players, bond, rng, valueFn }) {
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

    let chosen;
    if (valueFn) {
      chosen = pool.reduce((b, n) => (valueFn(cap, n) > valueFn(cap, b) ? n : b), pool[0]);
    } else {
      const best = pool.reduce((b, n) => (bond(cap, n) > bond(cap, b) ? n : b), pool[0]);
      chosen = bond(cap, best) > 2 ? best : pool[Math.floor(rng() * pool.length)];
    }
    teams[turn % captains.length].push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
    turn++;
  }
  return { teams, events };
}

/** How far down the list a queen with nothing left has fallen. */
const LEFTOVER_DEPTH = 4;

/** How many queens get an out-loud reaction to losing a pick. Not all of them. */
const FOLLOW_UPS = 3;

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
export function contestFor({
  order, choices, players, rng, penaltyScale = 1,
  // How these two feel about each other already. Losing your part to a friend
  // is a different afternoon from losing it to somebody you cannot stand, and
  // without this the draft only knows what kind of person each queen is and
  // not what is between them. Absent for a caller that has no bond layer,
  // which reads as strangers — correct on a premiere.
  bond = () => 0,
}) {
  const taken = new Set();
  const holder = {};
  const picks = {};
  const events = [];
  // One scene per contested thing. Thirteen queens with near-identical
  // shortlists all lose the same slot to the same queen, and reporting that as
  // twelve separate conflicts buries the one that actually happened.
  const fought = new Set();

  /* ── AND WHO MAKES SOMETHING OF IT ──
     A DRAFT WITH ONE EVENT IN IT IS NOT A DRAFT. The dedupe below is right —
     thirteen queens with near-identical shortlists all losing the same slot
     to the same queen is one story, not twelve — but reporting that single
     story and nothing else gave a thirteen-queen hand-out exactly one moment
     of conflict, on a screen whose entire subject is people wanting the same
     thing.
     What was missing is the REACTION, and it is not the same reaction from
     everybody. A hothead says something out loud. A villain took it on
     purpose and lets the room see that she did. A hero decides it does not
     matter and means it. The archetype law in rules.js already draws that
     line and this is exactly the kind of call it exists for, so the follow-up
     is chosen by who these two people are rather than rolled. */
  const arch = n => (players && players[n] && players[n].archetype) || null;
  const HOT = new Set(['hothead', 'chaos-agent', 'wildcard']);
  const TOOK_ON_PURPOSE = new Set(['villain', 'mastermind', 'schemer']);
  const GRACIOUS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer']);
  const NICE_ISH = new Set([...GRACIOUS, 'underdog', 'goat']);
  const bondOf = (a, b) => { try { return Number(bond(a, b)) || 0; } catch { return 0; } };
  const stat = (n, k) => {
    const v = Number(players && players[n] && players[n].stats && players[n].stats[k]);
    return Number.isFinite(v) ? v : 5;
  };
  const lean = (a, set, amt) => (set.has(a) ? amt : 1);

  /**
   * What she does about it — WEIGHTED, never thresholded.
   *
   * The first version cut at `bond >= 3` and `bond <= -2`, which is the exact
   * pattern the rest of this engine refuses: a queen one bond point warmer
   * behaved like a different person, and the same pair produced the same
   * scene every time they met. Everything here is a proportion, so a warm
   * bond makes a blow-up unlikely rather than impossible and a hothead is
   * likelier to say something rather than certain to.
   *
   * THREE INPUTS, and they disagree on purpose. What is already between the
   * two of them outweighs what either is like — a hothead does not go off at
   * her closest friend over a slot — but temperament is what decides whether
   * somebody who is upset lets it show, which is a different question from
   * whether she is upset. Boldness decides whether she says it out loud.
   *
   * And most of the time nothing happens, which is why the empty outcome
   * carries real weight: a draft where every loss becomes a scene is not a
   * draft, it is a brawl.
   */
  const followUp = (keeper, loser, over) => {
    const b = bondOf(keeper, loser);
    const warm = Math.max(0, Math.min(1, (b + 10) / 20));   // 0 hostile, 1 devoted
    const temper = stat(loser, 'temperament');              // high: keeps it together
    const bold = stat(loser, 'boldness');
    const loyal = stat(loser, 'loyalty');

    const w = {
      // She says it to her face. Volatile, bold, and not close to her.
      'contest-said-it': ((10 - temper) / 10) * (bold / 10) * 3.2 * (1 - warm)
        * lean(arch(loser), HOT, 2.2),
      // Of all the queens in the room, it had to be that one.
      'contest-old-grudge': Math.max(0, -b / 10) * 3.0 * ((10 - temper) / 10 + 0.4),
      // The keeper knew, took it anyway, and lets the room see that she did.
      'contest-took-it': (canScheme(players && players[keeper]) ? 1 : 0.15)
        * (stat(keeper, 'boldness') / 10) * 2.4 * (1 - warm)
        * lean(arch(keeper), TOOK_ON_PURPOSE, 1.8),
      // She wanted it and will not make her friend feel bad about it.
      'contest-friendly-fire': warm * warm * 3.4 * (loyal / 10)
        * lean(arch(loser), GRACIOUS, 1.5),
      // She decides it does not matter, and means it.
      'contest-let-it-go': (temper / 10) * 1.6 * lean(arch(loser), NICE_ISH, 2.0),
      // She takes the pick and gets on with her day, which is most drafts.
      '': 2.6,
    };

    const total = Object.values(w).reduce((t, x) => t + x, 0);
    let roll = (rng ? rng() : Math.random()) * total;
    let chosen = '';
    for (const [id, weight] of Object.entries(w)) {
      roll -= weight;
      if (roll <= 0) { chosen = id; break; }
    }
    if (!chosen) return null;

    // The keeper is the subject of her own move; everywhere else it is the
    // queen who lost, because it is her reaction.
    const subject = chosen === 'contest-took-it' ? [keeper, loser] : [loser, keeper];
    const HIT = {
      'contest-said-it': { bond: -1.5, pop: { loser: 1, keeper: -1 } },
      'contest-old-grudge': { bond: NICE_ISH.has(arch(loser)) ? -1.0 : -2.0, pop: { loser: 1, keeper: -1 } },
      'contest-took-it': { bond: -1.0, pop: { keeper: 2 } },
      'contest-friendly-fire': { bond: 0.5, pop: { loser: 1 } },
      'contest-let-it-go': { bond: 1.0, pop: { loser: 1 } },
    }[chosen];
    const pop = {};
    for (const [who, d] of Object.entries(HIT.pop)) pop[who === 'keeper' ? keeper : loser] = d;
    return evt(chosen, {
      players: subject,
      bond: [[subject[0], subject[1], HIT.bond]],
      pop,
      data: { over, keeper, loser, bond: b },
    });
  };

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
    /* THE REACTION IS NOT DEDUPED THE WAY THE CONFLICT IS. Ten queens losing
       one slot to one queen is a single fight, but each of those ten still
       has her own response to losing, and a hothead's is not a hero's. Capped
       so the screen is a draft rather than a brawl. */
    if (lostTo && events.filter(e => e.type !== 'contest').length < FOLLOW_UPS) {
      const f = followUp(lostTo, n, wants[0]);
      if (f) events.push(f);
    }
  }
  return { picks, events };
}
