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
  const { living, players, rng, miniWinner, mini } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  const choices = Object.fromEntries(order.map(n => [n, wantsFor(players[n])]));
  const { picks, events } = contestFor({ order, choices, players, rng });
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
  const charOf = n => characterById(assignment.picks[n]?.choice);

  const perRound = {};
  for (const n of living) perRound[n] = [];

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
      },
    };
  }

  return {
    performances,
    runwayOverride: null,
    events,
    scenes: [{ step: 'maxi-pre', kind: 'snatch-taping', data: { rounds } }],
  };
}
