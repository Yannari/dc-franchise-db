// ══════════════════════════════════════════════════════════════════════
// dr/chal/roast.js — a running order, three bits, and a room that cools
// ══════════════════════════════════════════════════════════════════════
//
// Serves the roast and the stand-up challenge. The material matters, but the
// RUNNING ORDER is the challenge: going first means nobody is warm yet, going
// last means everybody has heard the good jokes already, and going fifth after
// two queens have died means walking into a room that has stopped laughing.
//
// So the room has a temperature, and it is the only score in this show that
// depends on what the queen before you did. That is the thing a roast actually
// is, and an engine that scored six sets independently would be scoring six
// auditions.
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise } from '../perform.js';
import { canScheme, evt } from '../rules.js';

// A multiplier on the SPREAD, never a ceiling: the closer can win the night or
// lose it, and the middle of the order mostly does neither.
export const SLOT_DIFFICULTY = { first: 1.4, last: 1.25, middle: 1.0 };

const BITS = 3;
const DUD = 3;
const TEMP_CAP = 1.2;

const slotKind = (i, n) => (i === 0 ? 'first' : i === n - 1 ? 'last' : 'middle');
const slotNo = name => Number(String(name || 'slot-99').split('-')[1]) || 99;

/**
 * How badly she wants each slot, best first.
 *
 * A bold queen wants the closer, then the opener — the two that swing. A
 * nervous one wants the middle, where nothing much can happen to her either
 * way. It is the same instinct that makes her duck the Rusical lead.
 */
function slotPreference(slots, boldness) {
  const last = slots.length - 1;
  const mid = last / 2;
  const bold = boldness >= 6;
  return [...slots].sort((a, b) => {
    const rank = name => {
      const i = slotNo(name) - 1;
      if (bold) return i === last ? 0 : i === 0 ? 1 : 2 + Math.abs(i - mid);
      return Math.abs(i - mid);
    };
    return rank(a) - rank(b);
  });
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  const slots = order.map((_, i) => `slot-${i + 1}`);
  const choices = Object.fromEntries(order.map(n =>
    [n, slotPreference(slots, Number(players[n]?.stats?.boldness) || 5)]));
  const { picks, events } = contestFor({
      order, choices, players, rng,
      // No preparation penalty here — same jokes, a different position: the slot difficulty already scores it.
      penaltyScale: 0,
    });
  return {
    roles: Object.fromEntries(order.map(n => [n, 'standard'])),
    teams: [], order, picks, events,
    scenes: [{ step: 'choice', kind: 'roast-order', data: { picks } }],
  };
}

export function prepare(ctx) {
  const { living, players, rng, assignment } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const bits = {};

  for (const n of living) {
    const d = dragOf(players[n]);
    bits[n] = Array.from({ length: BITS }, () => Math.round(
      (d.comedy * 0.6 + d.acting * 0.25 + (w.prep[n] || 0) + noise(rng, 2.5)) * 100) / 100);
  }

  // A schemer sitting next to a better-written set takes the angle for
  // herself. Once a night: a room where everybody steals from everybody is a
  // cartoon, and it is the specificity that makes it a scene.
  const order = assignment?.order || living;
  for (let i = 1; i < order.length; i++) {
    const thief = order[i];
    const mark = order[i - 1];
    if (!canScheme(players[thief])) continue;
    const mine = bits[thief].reduce((a, b) => a + b, 0);
    const theirs = bits[mark].reduce((a, b) => a + b, 0);
    if (theirs - mine < 4) continue;
    if (rng() > 0.5) continue;
    bits[thief] = bits[thief].map(b => Math.round((b + 0.8) * 100) / 100);
    bits[mark] = bits[mark].map(b => Math.round((b - 0.6) * 100) / 100);
    events.push(evt('stole-a-bit', {
      players: [thief, mark],
      bond: [[thief, mark, -2]],
      pop: { [thief]: -1 },
      data: { thief, mark },
    }));
    break;
  }

  return {
    prep: w.prep, events, bits,
    scenes: [...r.scenes, { step: 'prep', kind: 'writing-room', data: { bits } }],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bits } = ctx;
  const performances = {};
  const events = [];
  const order = [...living].sort((a, b) =>
    slotNo(assignment.picks[a]?.choice) - slotNo(assignment.picks[b]?.choice));

  // The room, carried forward. This is the whole reason a roast is not six
  // independent sets.
  let temp = 0;

  order.forEach((n, i) => {
    const kind = slotKind(i, order.length);
    const range = SLOT_DIFFICULTY[kind];
    const myBits = bits?.[n] || [5, 5, 5];
    const mean = myBits.reduce((a, b) => a + b, 0) / myBits.length;
    const roomTemp = Math.max(-TEMP_CAP, Math.min(TEMP_CAP, temp));
    const perf = (mean - 5) * range + 5 + roomTemp
      - (assignment.picks[n]?.penalty || 0) + noise(rng, 1.2 * range);
    const s = players[n]?.stats || {};

    if (myBits.every(b => b < 4)) {
      events.push(evt('bombed', {
        players: [n], pop: { [n]: -3 },
        state: { [`bombed:${n}`]: true }, data: { slot: i + 1 },
      }));
    }
    // The queen with the nerve to turn on the panel itself, and the score to
    // get away with it. Plan 3 reads the flag in the critiques.
    if ((Number(s.boldness) || 5) >= 8 && perf > 8) {
      events.push(evt('roasted-the-panel', {
        players: [n], pop: { [n]: 4 },
        state: { panelRoasted: n }, data: { slot: i + 1 },
      }));
    }

    temp += perf > 8 ? 0.3 : perf < 4 ? -0.3 : 0;

    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: perf > 10,
      risk: (Number(s.boldness) || 5) / 10,
      role: 'standard', team: null,
      parts: { prep: prep[n] || 0, roomTemp: Math.round(roomTemp * 100) / 100 },
      detail: {
        slot: i + 1, slotKind: kind, bits: myBits,
        roomTemp: Math.round(roomTemp * 100) / 100,
        duds: myBits.filter(b => b < DUD).length,
      },
    };
  });

  return {
    performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-main', kind: 'roast-set', data: { order } }],
  };
}
