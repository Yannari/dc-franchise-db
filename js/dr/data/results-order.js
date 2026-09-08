// ══════════════════════════════════════════════════════════════════════
// dr/data/results-order.js — the order she calls it in
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The results were emitted in the order the groups happened to be written
// down: win, high, low, btm, bottom. Which means the winner was announced
// first, every single week, to a stage still full of queens who had not been
// told anything — and the last thing the night said was the bottom two, whose
// names everybody had already guessed from the critiques.
//
// That is the opposite of how the call works. The call is the most structured
// four minutes in the show and every part of its order is a decision: who is
// released first, who is left standing longest, and which fact the night ends
// on. A fixed order throws all of that away and reveals the peak before the
// stage has narrowed.
//
// ── THE ORDER IS A DECISION, NOT A SHUFFLE ────────────────────────────
//
// Each order below is a real way of running the call, and which one the host
// uses is chosen from what actually happened tonight — weighted, so a season
// does not run the same shape twelve times and does not run a random one
// either. A frontrunner in the bottom two is a different night from a
// first-time winner, and the host would not call those two the same way.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// There is nothing to write in this file. The prose for each call already
// lives in js/dr/data/stage-beats.js — `result-win`, `result-high`,
// `result-low`, `result-btm`, `result-bottom` — and what changes here is only
// the sequence they fire in. The one new beat is `results-hold`, which is the
// pause before the last block, and its lines are in stage-beats.js with the
// rest.

/** The five calls, in the order they were emitted before any of this. */
export const CALL_GROUPS = ['WIN', 'HIGH', 'LOW', 'BTM', 'BTM2'];

/**
 * The ways a call can be run.
 *
 * `holdBefore` is which block the host pauses before — the beat where she
 * stops talking and lets the room sit in it. It is the last block of the
 * sequence in every order here, because that is what "last" is for, but it
 * is named rather than inferred so an order can put the hold somewhere else
 * without rewriting the renderer.
 */
const order = (id, note, groups, holdBefore) => ({ id, note, groups, holdBefore });

export const RESULT_ORDERS = [
  order('standard',
    'RELIEF, THEN THE PEAK, THEN THE DREAD. The queens who were critiqued and '
    + 'are safe are released first and the stage narrows; the tops are told '
    + 'they are safe and then one of them is told she won; and the two who are '
    + 'left standing there are the two who are left standing there. The '
    + 'ordinary shape, and the one that works on most nights.',
    ['LOW', 'HIGH', 'WIN', 'BTM', 'BTM2'], 'BTM2'),
  order('winner-last',
    'THE WIN IS THE STORY, so it is the last thing the night says. Everything '
    + 'else is settled first — including the bottom, which is unusual and '
    + 'which the room notices — and then the host turns back to the queens who '
    + 'have been standing there not knowing. For a first win, or a win nobody '
    + 'in the room saw coming.',
    ['LOW', 'HIGH', 'BTM', 'BTM2', 'WIN'], 'WIN'),
  order('danger-first',
    'SHE GOES STRAIGHT TO THE BOTTOM. No warm-up, no relief, no easing into '
    + 'it — the first thing the host does is name the queens in trouble, and '
    + 'the rest of the call happens with those two already knowing. For the '
    + 'night a queen who has been winning is down there, when the room needs '
    + 'to feel that before it is told anything good.',
    ['BTM', 'BTM2', 'LOW', 'HIGH', 'WIN'], 'WIN'),
  order('top-first',
    'THE WIN WAS NEVER IN DOUBT and the host does not pretend otherwise. She '
    + 'says it first, gets the good news out of the room, and spends the rest '
    + 'of the call on the part that is actually undecided. For a blowout.',
    ['WIN', 'HIGH', 'LOW', 'BTM', 'BTM2'], 'BTM2'),
];

export function resultOrder(id) {
  return RESULT_ORDERS.find(o => o.id === id) || RESULT_ORDERS[0];
}

/**
 * Which shape tonight is.
 *
 * WEIGHTED, off facts, for the same reason everything else in this engine is:
 * a threshold would make the same night produce the same call every time and
 * a flat roll would make the order mean nothing. So a first-time winner makes
 * `winner-last` likely rather than certain, and `standard` always has real
 * weight because most nights are ordinary nights.
 *
 *   winnerFirstWin  she has never won before tonight
 *   winnerGap       how far clear of second she finished, 0..1
 *   dangerStreak    the best record among the queens in the bottom two,
 *                   0..1 — a queen who has been winning, standing there
 *
 * `rng` is the season's, so a replay calls the night the same way.
 */
export function chooseResultOrder({
  winnerFirstWin = false, winnerGap = 0, dangerStreak = 0, rng = Math.random,
} = {}) {
  const w = {
    standard: 2.4,
    'winner-last': (winnerFirstWin ? 2.2 : 0.4) + (1 - Math.min(1, winnerGap)) * 0.8,
    'danger-first': Math.min(1, dangerStreak) * 3.0,
    'top-first': Math.min(1, winnerGap) * 2.2,
  };
  const total = Object.values(w).reduce((t, x) => t + x, 0);
  let roll = rng() * total;
  for (const [id, weight] of Object.entries(w)) {
    roll -= weight;
    if (roll <= 0) return id;
  }
  return 'standard';
}
