// ══════════════════════════════════════════════════════════════════════
// dr/chal/lalaparuza.js — a losers-bracket lip sync tournament
// ══════════════════════════════════════════════════════════════════════
//
// The format the show uses from S13/S15 onward: everybody lip syncs in
// Round 1, the LOSERS pair up again in Round 2, and whoever is still
// losing goes to sudden death in Round 3. The last queen standing in
// the losers' bracket is eliminated — the tournament decided it, not
// a separate lip sync after critiques.
//
// FATIGUE is the mechanical point of the format. A queen who loses her
// first lip sync has to perform again immediately, tired, against another
// queen who is also tired. By the third song even the best dancer in the
// room can fall, which is what makes the format dramatic rather than a
// foregone conclusion.
//
// RuPaul still calls each duel. The host's lean bends the result the
// same way it bends an ordinary lip sync — bounded, never more than a
// place or two, and based on her track record.
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom } from '../prep.js';
import { lipsyncScore } from '../lipsync.js';
import { SONGS } from '../data/songs.js';
import { dragOf } from '../queen.js';
import { evt } from '../rules.js';
import { tournamentScenes } from '../smackdown.js';

// Each lip sync costs stamina. The penalty grows: the first repeat is a
// 12% hit, the second is a 22% hit on top, and a hypothetical fourth
// would be brutal. These are multiplied into the score, so a queen with
// two losses is performing at ~68% of her fresh ability.
const FATIGUE_CURVE = [1.0, 0.88, 0.78, 0.65, 0.52];
const fatigueFactor = (lipsyncsAlready) =>
  FATIGUE_CURVE[Math.min(lipsyncsAlready, FATIGUE_CURVE.length - 1)];

// Exported so the smackdown can share the same curve.
export { FATIGUE_CURVE, fatigueFactor };

// A bold queen with a grudge picks her rival. A safe queen picks the
// weakest lip syncer. Boldness * 0.5 is the chance of going bold, but
// only if there IS a rival (bond <= -3) or she's villainous enough to
// target the front-runner. Nice archetypes always play safe.
const NICE_SET = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_SET = new Set(['villain', 'mastermind', 'schemer']);

function pickStrategy(name, others, { players, bond, rng, state }) {
  const p = players[name];
  const bold = (Number(p?.stats?.boldness) || 5) / 10;
  const arch = p?.archetype;

  if (NICE_SET.has(arch) || rng() > bold * 0.5) {
    const sorted = [...others].sort((a, b) =>
      dragOf(players[a]).lipsync - dragOf(players[b]).lipsync);
    return { list: sorted, strategy: 'safe' };
  }

  // Bold path: look for a rival first (worst bond), then front-runner
  const rival = others.reduce((w, n) => (bond(name, n) < bond(name, w) ? n : w), others[0]);
  if (bond(name, rival) <= -3) {
    const rest = others.filter(n => n !== rival);
    return { list: [rival, ...rest], strategy: 'rival' };
  }

  // Villains target front-runners — the queen with the best track record
  if (VILLAIN_SET.has(arch)) {
    const rec = state?.record || {};
    const _w = { WIN: 5, HIGH: 4, SAFE: 3, LOW: 2, BTM: 1, BTM2: 1 };
    const ppe = n => {
      const r = rec[n] || [];
      return r.length ? r.reduce((s, x) => s + (_w[x] ?? 0), 0) / r.length : 3;
    };
    const sorted = [...others].sort((a, b) => ppe(b) - ppe(a));
    return { list: sorted, strategy: 'frontrunner' };
  }

  // Fallback: safe play
  const sorted = [...others].sort((a, b) =>
    dragOf(players[a]).lipsync - dragOf(players[b]).lipsync);
  return { list: sorted, strategy: 'safe' };
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, bond, state } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });

  const strategies = {};
  const choices = Object.fromEntries(order.map(n => {
    const others = order.filter(o => o !== n);
    const { list, strategy } = pickStrategy(n, others, { players, bond, rng, state });
    strategies[n] = strategy;
    return [n, list];
  }));

  const named = Object.fromEntries(order.map(n => [n, choices[n][0]]));
  const { picks, events } = contestFor({
    order, choices, players, rng, bond,
    penaltyScale: 0,
  });

  // Tag each pick with its strategy
  for (const [n, pick] of Object.entries(picks)) {
    pick.strategy = strategies[n] || 'safe';
  }

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
      pop: { [name]: 1 },
      data: { count },
    }));
  }

  // Bold plays against rivals generate heat
  for (const n of order) {
    if (strategies[n] === 'rival' && picks[n]) {
      const target = picks[n].choice;
      events.push(evt('bold-pick', {
        players: [n, target],
        bond: [[n, target, -1]],
        pop: { [n]: 2 },
        data: { strategy: 'rival' },
      }));
    }
  }

  return {
    roles: Object.fromEntries(order.map(n => [n, 'standard'])),
    teams: [], order, picks, named, strategies, events,
    scenes: [{ step: 'choice', kind: 'bracket-picks', data: { picks, named, strategies } }],
  };
}

export function prepare(ctx) {
  const r = prepareRoom(ctx);
  return { prep: r.prep, events: r.events, scenes: r.scenes };
}

/**
 * Round 1 pairing from the picks.
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
  const duels = [];
  const events = [];
  const lipsyncCount = Object.fromEntries(living.map(n => [n, 0]));

  // PPE-based host lean, the same rule as the standard lip sync. In the
  // early rounds nobody goes home so track record barely matters; in
  // sudden death it decides who gets the chop.
  const _ppeW = { WIN: 5, HIGH: 4, SAFE: 3, LOW: 2, BTM: 1, BTM2: 1 };
  const ROUND_LEAN = [0, 0.2, 0.35, 0.6];
  const hostLean = (n, round) => {
    const rec = state.record?.[n] || [];
    if (!rec.length) return 0;
    const ppe = rec.reduce((s, r) => s + (_ppeW[r] ?? 0), 0) / rec.length;
    const scale = ROUND_LEAN[Math.min(round, ROUND_LEAN.length - 1)];
    return Math.max(0, (ppe - 3.0) * scale);
  };

  const duel = (a, b, round, roundLabel, chosen) => {
    const song = SONGS[Math.floor(rng() * SONGS.length)];
    const fatA = fatigueFactor(lipsyncCount[a] || 0);
    const fatB = fatigueFactor(lipsyncCount[b] || 0);
    const sa = lipsyncScore({ player: players[a], song, lipsyncRecord: state.lipsyncRecord?.[a] || [], rng });
    const sb = lipsyncScore({ player: players[b], song, lipsyncRecord: state.lipsyncRecord?.[b] || [], rng });
    const adjA = sa.score * fatA + (prep[a] || 0) + hostLean(a, round);
    const adjB = sb.score * fatB + (prep[b] || 0) + hostLean(b, round);
    const winner = adjA >= adjB ? a : b;
    const loser = winner === a ? b : a;
    lipsyncCount[a] = (lipsyncCount[a] || 0) + 1;
    lipsyncCount[b] = (lipsyncCount[b] || 0) + 1;
    const strategy = chosen && assignment.strategies?.[a] || null;
    duels.push({
      round, roundLabel, a, b, chosen: !!chosen, strategy,
      song: song.title, artist: song.artist,
      scores: { [a]: sa.score, [b]: sb.score },
      fatigue: { [a]: fatA, [b]: fatB },
      adjusted: { [a]: Math.round(adjA * 100) / 100, [b]: Math.round(adjB * 100) / 100 },
      winner, loser,
    });
    return { winner, loser };
  };

  // ── ROUND 1: everybody lip syncs ──
  const r1 = firstRound(assignment.order || living, assignment.picks || {});
  const r1Winners = [];
  const r1Losers = [];
  for (const [a, b, chosen] of r1.pairs) {
    const { winner, loser } = duel(a, b, 1, 'Round 1', chosen);
    r1Winners.push(winner);
    r1Losers.push(loser);
  }
  if (r1.bye) r1Winners.push(r1.bye);

  // ── ROUND 2: losers face losers ──
  const r2Losers = [];
  const r2Safe = [];
  const r2Alive = [...r1Losers].sort(() => rng() - 0.5);
  for (let i = 0; i + 1 < r2Alive.length; i += 2) {
    const { winner, loser } = duel(r2Alive[i], r2Alive[i + 1], 2, 'Round 2', false);
    r2Safe.push(winner);
    r2Losers.push(loser);
  }
  if (r2Alive.length % 2) r2Losers.push(r2Alive[r2Alive.length - 1]);

  // ── ROUND 3 (SUDDEN DEATH): final elimination ──
  let eliminated = null;
  const r3Alive = [...r2Losers].sort(() => rng() - 0.5);
  while (r3Alive.length > 1) {
    const a = r3Alive.shift();
    const b = r3Alive.shift();
    const { winner, loser } = duel(a, b, 3, 'Sudden Death', false);
    r3Alive.push(winner);
    eliminated = loser;
  }
  const lastSurvivor = r3Alive[0] || null;

  // ── PLACEMENTS from tournament position ──
  // Performance scores are set so the standard judging pipeline naturally
  // produces the right call. Round 1 winners score high, Round 2 survivors
  // score low, and the eliminated queen scores lowest.
  const bestDuelWinner = r1Winners.length
    ? r1Winners.reduce((best, n) => {
      const d = duels.find(dd => dd.winner === n && dd.round === 1);
      const dBest = duels.find(dd => dd.winner === best && dd.round === 1);
      if (!d) return best;
      if (!dBest) return n;
      return (d.adjusted[n] || 0) > (dBest.adjusted[best] || 0) ? n : best;
    })
    : null;

  const performances = {};
  for (const n of living) {
    let perf;
    if (n === eliminated) perf = 1.5;
    else if (n === lastSurvivor) perf = 3.0;
    else if (r2Safe.includes(n)) perf = 4.5;
    else if (n === bestDuelWinner) perf = 9.0;
    else if (r1Winners.includes(n)) perf = 7.0;
    else perf = 5.0;

    const totalSyncs = lipsyncCount[n] || 0;
    performances[n] = {
      perf,
      moment: n === bestDuelWinner,
      risk: 0.6,
      role: 'standard', team: null,
      parts: { prep: prep[n] || 0 },
      detail: {
        lipsyncs: totalSyncs,
        losses: duels.filter(d => d.loser === n).length,
        roundOut: r1Winners.includes(n) ? 1
          : r2Safe.includes(n) ? 2
            : 3,
        place: n === eliminated ? 'ELIM'
          : n === lastSurvivor ? 'BTM'
            : r2Safe.includes(n) ? 'LOW'
              : n === bestDuelWinner ? 'WIN' : 'SAFE',
      },
    };
  }

  // Assassin: two or more lip sync wins in one night (only possible from the
  // loser side — an R1 winner gets exactly one). With a large cast and
  // enough R3 rounds this could go higher, but the losers-bracket format
  // makes 2 the natural threshold.
  for (const n of living) {
    const wins = duels.filter(d => d.winner === n).length;
    if (wins >= 2) {
      events.push(evt('assassin', {
        players: [n], pop: { [n]: 4 },
        state: { assassin: n }, data: { wins },
      }));
    }
  }

  return {
    performances, runwayOverride: null, events,
    // tournamentExit tells week.js that the elimination was decided by the
    // tournament bracket, not by a standard lip sync. The standard lip sync
    // section is skipped and the exit is taken from here.
    tournamentExit: {
      eliminated,
      duels,
      r1Winners, r1Losers, r2Safe, r2Losers,
      lastSurvivor, bestDuelWinner,
      fatigueCurve: FATIGUE_CURVE,
    },
    scenes: tournamentScenes({
      duels, eliminated, r1Winners, r1Losers, r2Safe, r2Losers,
      lastSurvivor, rng, living,
      rankOf: n => {
        const rec = state.record?.[n] || [];
        if (!rec.length) return 0;
        const _w = { WIN: 5, HIGH: 4, SAFE: 3, LOW: 2, BTM: 1, BTM2: 1 };
        return rec.reduce((s, r) => s + (_w[r] ?? 0), 0) / rec.length;
      },
    }),
  };
}
