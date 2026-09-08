// ══════════════════════════════════════════════════════════════════════
// dr/chal/snatch-game.js — the taping
// ══════════════════════════════════════════════════════════════════════
//
// The one challenge where the assignment matters more than the performance.
// A queen who gets the character she prepared is playing a different game from
// the one who walked in last and took what was left, and the panel is six
// questions long, so there is nowhere to hide a bad choice.
//
// It is scored ROUND BY ROUND rather than once, because dying on the panel is
// not a low average — it is the specific, watchable thing of three answers in
// a row landing on silence. An average would smooth exactly the event the
// episode is about.
import { SNATCH_CHARACTERS, characterById } from '../data/snatch-characters.js';
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise } from '../perform.js';
import { evt } from '../rules.js';

const ROUNDS = 6;
/** Three answers landing on silence. Not an average — a run. */
const FLOP = 3;
const KILL = 8.5;

// ── THE HOST, WHO WAS NOT IN THIS AT ALL ──────────────────────────────
//
// Snatch Game was six rounds scored in isolation: every queen answered into a
// vacuum and nobody on the other side of the desk existed. That is not the
// segment. The host reads the question, and then he DECIDES what to do with
// what she gives him — feed a queen who is working, or let one who is dying
// hang there while he moves on.
//
// So each round he engages one queen, and which one is not random: he goes
// where the television is. A queen who is landing gets more of him, which
// compounds; a queen who is dying gets him too, because a struggling queen is
// also television, and that is the crueller half of the format.
const ENGAGE_PER_ROUND = 1;
/** What a setup is worth to somebody who can take it. */
const ROPE = 1.6;
/** And what being left to hang costs. */
const HANG = 1.2;

/**
 * Her shortlist, best first.
 *
 * A queen reaches for a character that suits her style and that she can carry.
 * The difficulty subtraction is why the funniest queen in the room can still
 * be found holding the Silent Film Star: everybody wants the good ones, and
 * only one of them gets it.
 */
function wantsFor(player) {
  const d = dragOf(player);
  return [...SNATCH_CHARACTERS]
    .map(c => ({
      c,
      score: (c.style === d.style ? 3 : 0) + d[c.needs] - c.difficulty + (d.comedy - 5) * 0.2,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.c.id);
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, bond } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  const choices = Object.fromEntries(order.map(n => [n, wantsFor(players[n])]));
  const { picks, events } = contestFor({ order, choices, players, rng, bond });
  const roles = Object.fromEntries(order.map(n => [n, 'standard']));
  return {
    roles, teams: [], order, picks, events,
    scenes: [{ step: 'choice', kind: 'snatch-picks', data: { order, picks } }],
  };
}

export function prepare(ctx) {
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  return {
    prep: w.prep,
    events: [...r.events, ...w.events],
    scenes: [...r.scenes, { step: 'prep', kind: 'walkthrough', data: { notes: w.notes } }],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bond } = ctx;
  const performances = {};
  const events = [];
  const rounds = [];
  const hostBeats = [];
  const charOf = n => characterById(assignment.picks[n]?.choice);

  const perRound = {};
  for (const n of living) perRound[n] = [];

  // Whom the host has already worked with, so one queen does not get the
  // whole taping.
  const engaged = {};

  for (let r = 0; r < ROUNDS; r++) {
    const beat = [];
    for (const n of living) {
      const d = dragOf(players[n]);
      const c = charOf(n);
      // Out of her depth is measured against the stat the character NEEDS, so
      // a comic can carry a hard comic bit and drown in a hard acting one.
      const fit = c
        ? (c.style === d.style ? 1.2 : 0) - Math.max(0, c.difficulty - d[c.needs] / 2) * 0.4
        : -1;
      const score = d.comedy * 0.55 + d.acting * 0.35 + fit + (prep[n] || 0)
        - (assignment.picks[n]?.penalty || 0) + noise(rng, 2.2);
      const rounded = Math.round(score * 100) / 100;
      perRound[n].push(rounded);
      beat.push({ name: n, score: rounded });
    }

    // ── AND THEN THE HOST DOES SOMETHING ABOUT IT ──
    //
    // He picks the most interesting thing on the desk this round — the best
    // answer or the worst, never the middle, because the middle is not
    // television. Whether the exchange helps her is not his decision: a queen
    // with a character can take a setup and run, and a queen without one is
    // simply given more rope.
    const sorted = [...beat].sort((x, y) => y.score - x.score);
    const candidates = [sorted[0], sorted[sorted.length - 1]]
      .filter(x => x && (engaged[x.name] || 0) < 2);
    for (let i = 0; i < ENGAGE_PER_ROUND && candidates.length; i++) {
      const pickIdx = rng() < 0.5 ? 0 : candidates.length - 1;
      const chosen = candidates.splice(pickIdx, 1)[0];
      if (!chosen) break;
      const n = chosen.name;
      engaged[n] = (engaged[n] || 0) + 1;
      const d = dragOf(players[n]);
      // Can she take it? Comedy and nerve, because a setup only works on
      // somebody willing to grab it.
      const takes = (d.comedy + (Number(players[n]?.stats?.boldness) || 5)) / 2;
      const worked = rng() < 0.25 + takes / 20;
      const delta = worked ? ROPE : -HANG;
      perRound[n][perRound[n].length - 1] =
        Math.round((perRound[n][perRound[n].length - 1] + delta) * 100) / 100;
      hostBeats.push({ round: r + 1, name: n, worked, delta });
      events.push(worked
        ? evt('host-played-along', {
          players: [n], pop: { [n]: 2 },
          data: { round: r + 1, character: charOf(n)?.name || null },
        })
        : evt('left-to-hang', {
          players: [n], pop: { [n]: -1 },
          data: { round: r + 1, character: charOf(n)?.name || null },
        }));
    }

    rounds.push({ round: r + 1, answers: beat });
  }

  // Two queens sitting next to each other who like each other build a bit
  // together, and the whole taping lifts for both. Snatch Game is the one
  // challenge where being liked is worth points rather than votes.
  for (let i = 1; i < assignment.order.length; i++) {
    const a = assignment.order[i - 1];
    const b = assignment.order[i];
    if (!perRound[a] || !perRound[b]) continue;
    if (bond(a, b) >= 2 && rng() < 0.4) {
      perRound[a] = perRound[a].map(s => Math.round((s + 0.8) * 100) / 100);
      perRound[b] = perRound[b].map(s => Math.round((s + 0.8) * 100) / 100);
      events.push(evt('double-act', {
        players: [a, b],
        bond: [[a, b, 1]],
        pop: { [a]: 2, [b]: 2 },
        data: { characters: [charOf(a)?.name || null, charOf(b)?.name || null] },
      }));
    }
  }

  for (const n of living) {
    const scores = perRound[n];
    const perf = scores.reduce((s, x) => s + x, 0) / scores.length;
    const flops = scores.filter(s => s < FLOP).length;
    const kills = scores.filter(s => s > KILL).length;
    if (flops >= 3) {
      events.push(evt('dying', {
        players: [n],
        pop: { [n]: -3 },
        state: { snatchDied: n },
        data: { character: charOf(n)?.name || null, flops },
      }));
    }
    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: kills >= 2,
      risk: (Number(players[n]?.stats?.boldness) || 5) / 10,
      role: 'standard',
      team: null,
      parts: { base: perf, prep: prep[n] || 0 },
      detail: {
        character: charOf(n)?.name || null,
        characterId: assignment.picks[n]?.choice || null,
        rounds: scores, flops, kills,
        hostBeats: hostBeats.filter(h => h.name === n),
      },
    };
  }

  return {
    performances,
    runwayOverride: null,
    events,
    scenes: [{ step: 'maxi-pre', kind: 'snatch-taping', data: { rounds, hostBeats } }],
  };
}
