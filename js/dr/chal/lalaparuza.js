// ══════════════════════════════════════════════════════════════════════
// dr/chal/lalaparuza.js — a bracket, and being chosen is a thing done to you
// ══════════════════════════════════════════════════════════════════════
//
// The only maxi challenge decided entirely by lip syncing, and the only one
// where a queen names the opponent she wants. Everybody looks for the weakest
// lip syncer in the room, which means the weakest lip syncer gets named twice
// and finds out where she stands in front of everybody.
//
// A single-elimination bracket, not a losers' bracket: a queen who loses is
// done for the night. The FIRST ROUND IS BUILT FROM THE PICKS — if it were
// not, the choosing would be a scene about nothing, which is the failure mode
// this codebase keeps producing.
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom } from '../prep.js';
import { lipsyncScore } from '../lipsync.js';
import { SONGS } from '../data/songs.js';
import { dragOf } from '../queen.js';
import { evt } from '../rules.js';

/** Three wins in one night. */
const ASSASSIN = 3;

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });

  // Everybody names who they would rather face: the weakest lip syncer they
  // can see. Which is why the weakest one hears her name more than once.
  const choices = Object.fromEntries(order.map(n => [n, order
    .filter(o => o !== n)
    .sort((a, b) => dragOf(players[a]).lipsync - dragOf(players[b]).lipsync)]));

  // Naming and facing are two different things, and keeping them apart is the
  // point. Everybody says a name out loud, freely, and several of them say the
  // SAME name — that is the scene. Only then does the pick order decide who
  // actually gets her, which is what contestFor is for. Resolving both at once
  // would make being named twice impossible, and being named twice is the
  // whole of the event below.
  const named = Object.fromEntries(order.map(n => [n, choices[n][0]]));
  const { picks, events } = contestFor({ order, choices, players, rng });

  const chosenCount = {};
  for (const n of order) {
    const c = named[n];
    if (living.includes(c)) chosenCount[c] = (chosenCount[c] || 0) + 1;
  }
  for (const [name, count] of Object.entries(chosenCount)) {
    if (count < 2) continue;
    const choosers = order.filter(n => named[n] === name);
    events.push(evt('picked-on', {
      players: [name, ...choosers],
      bond: choosers.map(c => [name, c, -1]),
      // The room picking on you is worth something with the audience, which is
      // the only currency she has left tonight.
      pop: { [name]: 1 },
      data: { count },
    }));
  }

  return {
    roles: Object.fromEntries(order.map(n => [n, 'standard'])),
    teams: [], order, picks, named, events,
    scenes: [{ step: 'choice', kind: 'bracket-picks', data: { picks, named } }],
  };
}

export function prepare(ctx) {
  const r = prepareRoom(ctx);
  return { prep: r.prep, events: r.events, scenes: r.scenes };
}

/**
 * Round one, from the picks.
 *
 * Walking the order, a queen who is still unpaired faces the opponent she
 * named if that opponent is also still unpaired. Whoever is left over pairs
 * off among themselves, because a challenge cannot leave somebody standing
 * there because the choosing did not divide evenly.
 */
function firstRound(order, picks) {
  const taken = new Set();
  const pairs = [];
  for (const n of order) {
    if (taken.has(n)) continue;
    const want = picks[n]?.choice;
    if (want && want !== n && order.includes(want) && !taken.has(want)) {
      taken.add(n); taken.add(want);
      pairs.push([n, want, true]);
    }
  }
  const rest = order.filter(n => !taken.has(n));
  for (let i = 0; i + 1 < rest.length; i += 2) pairs.push([rest[i], rest[i + 1], false]);
  const bye = rest.length % 2 ? rest[rest.length - 1] : null;
  return { pairs, bye };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, state } = ctx;
  const wins = Object.fromEntries(living.map(n => [n, 0]));
  const losses = Object.fromEntries(living.map(n => [n, 0]));
  const duels = [];
  const events = [];

  const duel = (a, b, round, chosen) => {
    const song = SONGS[Math.floor(rng() * SONGS.length)];
    const sa = lipsyncScore({ player: players[a], song, lipsyncRecord: state.lipsyncRecord?.[a] || [], rng });
    const sb = lipsyncScore({ player: players[b], song, lipsyncRecord: state.lipsyncRecord?.[b] || [], rng });
    const winner = sa.score + (prep[a] || 0) >= sb.score + (prep[b] || 0) ? a : b;
    const loser = winner === a ? b : a;
    wins[winner]++;
    losses[loser]++;
    duels.push({
      round, a, b, chosen: !!chosen, song: song.title,
      scores: { [a]: sa.score, [b]: sb.score }, winner, loser,
    });
    return winner;
  };

  const opening = firstRound(assignment.order || living, assignment.picks || {});
  let alive = opening.pairs.map(([a, b, chosen]) => duel(a, b, 1, chosen));
  if (opening.bye) alive.push(opening.bye);

  let round = 2;
  let guard = 0;
  while (alive.length > 1 && guard++ < 20) {
    const next = [];
    for (let i = 0; i + 1 < alive.length; i += 2) next.push(duel(alive[i], alive[i + 1], round, false));
    if (alive.length % 2) next.push(alive[alive.length - 1]);
    alive = next;
    round++;
  }

  const performances = {};
  for (const n of living) {
    if (wins[n] >= ASSASSIN) {
      events.push(evt('assassin', {
        players: [n], pop: { [n]: 4 },
        state: { assassin: n }, data: { wins: wins[n] },
      }));
    }
    performances[n] = {
      perf: Math.round((5 + wins[n] * 1.6 - losses[n] * 0.9) * 100) / 100,
      moment: wins[n] >= ASSASSIN,
      risk: 0.6,
      role: 'standard', team: null,
      parts: { prep: prep[n] || 0 },
      detail: { wins: wins[n], losses: losses[n] },
    };
  }

  return {
    performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-main', kind: 'bracket', data: { duels, winner: alive[0] || null } }],
  };
}
