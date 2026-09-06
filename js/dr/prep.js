// ══════════════════════════════════════════════════════════════════════
// dr/prep.js — the werk room, before it is a performance
// ══════════════════════════════════════════════════════════════════════
//
// Where the social layer reaches the scoreboard. Everything here changes a
// number the panel will later see, which is the point: bonds that never touch
// a result are decoration, and a season where being liked does nothing is a
// season about spreadsheets.
//
// The three things that happen in a workroom, in the order they matter:
// somebody helps, somebody sabotages, and somebody is left alone. The third is
// an EVENT rather than an absence — a queen nobody will help is a story, and
// filing it as "nothing happened" is how it becomes invisible.
import { dragOf } from './queen.js';
import { blendScore, noise } from './perform.js';
import { canScheme, evt, heaviestStat } from './rules.js';

export function prepareRoom({ living, players, maxi, rng, bond }) {
  const key = heaviestStat(maxi);
  const prep = {};
  const events = [];
  const scenes = [];

  for (const n of living) {
    const p = players[n];
    const s = p.stats || {};
    const num = k => (Number.isFinite(Number(s[k])) ? Number(s[k]) : 5);
    prep[n] = (blendScore(dragOf(p), maxi.blend) - 5) * 0.1
      + (num('mental') - 5) * 0.03
      + (num('strategic') - 5) * 0.02;
  }

  const helped = new Set();
  const hurt = new Set();
  const acted = new Set();
  const meanBond = n => (living.length > 1
    ? living.filter(o => o !== n).reduce((t, o) => t + bond(n, o), 0) / (living.length - 1)
    : 0);

  // SABOTAGE FIRST, so a schemer's target is not "already fine because a
  // friend got there". One rival per queen per week: a villain who ruins
  // everybody's day is a cartoon.
  for (const n of living) {
    if (acted.has(n) || !canScheme(players[n])) continue;
    if (dragOf(players[n])[key] < 6) continue;   // she has to know the craft to sabotage it
    const target = living
      .filter(o => o !== n && !hurt.has(o) && bond(n, o) <= -3)
      .sort((a, b) => bond(n, a) - bond(n, b))[0];
    if (!target) continue;
    prep[target] -= 0.7;
    hurt.add(target);
    acted.add(n);
    events.push(evt('sabotage', {
      players: [n, target], bond: [[n, target, -1.5]], pop: { [n]: -3 }, data: { craft: key },
    }));
  }

  for (const n of living) {
    if (acted.has(n) || dragOf(players[n])[key] < 7) continue;
    const friend = living
      .filter(o => o !== n && !helped.has(o) && !hurt.has(o)
        && dragOf(players[o])[key] <= 4 && bond(n, o) >= 3)
      .sort((a, b) => bond(n, b) - bond(n, a))[0];
    if (!friend) continue;
    prep[friend] += 0.6;
    helped.add(friend);
    acted.add(n);
    events.push(evt('help', {
      players: [n, friend], bond: [[n, friend, 1.0]], pop: { [n]: 2 }, data: { craft: key },
    }));
  }

  // The queen nobody will help. An event, not an absence.
  for (const n of living) {
    if (helped.has(n) || meanBond(n) > -3) continue;
    prep[n] -= 0.3;
    events.push(evt('shunned', { players: [n], pop: { [n]: -1 }, data: { craft: key } }));
  }

  scenes.push({
    step: 'prep', kind: 'prep-room',
    data: { craft: key, helped: [...helped], hurt: [...hurt] },
  });
  void rng;
  return { prep, scenes, events };
}

/**
 * The host walks the room.
 *
 * She is right most of the time, and being right is not the same as being
 * HEARD: `intuition` decides whether a queen reads the note correctly and
 * `boldness` whether she is willing to change course this late. So good advice
 * ignored and bad advice taken are both possible, and both cost — which is the
 * whole reason the scene is worth simulating rather than narrating.
 */
export function walkthrough({ living, players, maxi, prep, rng }) {
  const notes = [];
  const events = [];
  for (const n of living) {
    const s = players[n]?.stats || {};
    const num = k => (Number.isFinite(Number(s[k])) ? Number(s[k]) : 5);

    const right = rng() < 0.75;
    const reads = rng() < 0.25 + num('intuition') / 20;
    const acts = rng() < 0.30 + num('boldness') / 16;
    // She takes it when she reads it as worth taking AND is willing to move.
    const took = (right ? reads : !reads) && acts;
    const delta = right ? (took ? 0.7 : -0.4) : (took ? -0.7 : 0.2);

    prep[n] = (prep[n] || 0) + delta;
    notes.push({ name: n, right, took, delta: Math.round(delta * 100) / 100 });
    events.push(evt('walkthrough', {
      players: [n], pop: { [n]: took ? 1 : -1 }, data: { right, took, challenge: maxi.id },
    }));
  }
  void noise;
  return { notes, prep, events };
}
