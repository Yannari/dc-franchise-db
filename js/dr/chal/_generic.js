// ══════════════════════════════════════════════════════════════════════
// dr/chal/_generic.js — the default hooks, and the predicates every module shares
// ══════════════════════════════════════════════════════════════════════
//
// A challenge module overrides the hooks it has an opinion about and lets the
// rest fall through to here. A type with no file at all runs entirely on these,
// which is not a gap: a photoshoot IS a solo craft check, and the spine already
// models one.
//
// THE PREDICATES LIVE HERE AND NOWHERE ELSE. The archetype behaviour rules are
// one rule, and a module writing its own copy is how a hero comes to sabotage
// a sewing machine. Every module asks these.
import { dragOf } from '../queen.js';
import { performQueen, blendScore, noise } from '../perform.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { canScheme, canHelp, evt, heaviestStat } from '../rules.js';

export function assign(ctx) {
  const { living, maxi, rng, miniWinner } = ctx;
  const order = [...living].sort(() => rng() - 0.5);
  if (miniWinner && order.includes(miniWinner)) {
    order.splice(order.indexOf(miniWinner), 1);
    order.unshift(miniWinner);
  }

  const teams = [];
  if (maxi.format === 'teams') {
    const half = Math.ceil(order.length / 2);
    teams.push(order.slice(0, half), order.slice(half));
  } else if (maxi.format === 'cast') {
    teams.push([...order]);
  } else if (maxi.format === 'pairs') {
    for (let i = 0; i < order.length; i += 2) teams.push(order.slice(i, i + 2));
  }

  const roles = {};
  order.forEach((n, i) => {
    roles[n] = !maxi.roles ? 'standard'
      : i === 0 ? 'lead'
        : i < 3 ? 'featured'
          : i < Math.max(3, order.length - 2) ? 'standard' : 'ensemble';
  });

  return {
    roles, teams, order, picks: {}, events: [],
    scenes: [{ step: 'choice', kind: 'assignment', data: { order, teams } }],
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
  const { living, players, maxi, assignment, prep, rng, state, bond } = ctx;
  const performances = {};
  for (const n of living) {
    const team = (assignment.teams || []).find(t => t.includes(n)) || null;
    const chemistry = team && team.length > 1
      ? team.filter(o => o !== n).reduce((s, o) => s + bond(n, o), 0) / (team.length - 1) * 0.1
      : 0;
    const r = performQueen({
      player: players[n], maxi, role: assignment.roles[n], prep: prep[n] || 0,
      chemistry, record: state.record[n] || [], rng,
    });
    performances[n] = {
      ...r,
      role: assignment.roles[n],
      team: team ? assignment.teams.indexOf(team) : null,
      detail: {},
    };
  }
  return {
    performances,
    runwayOverride: null,
    events: [],
    scenes: [{ step: maxi.stage === 'pre' ? 'maxi-pre' : 'maxi-main', kind: 'performance', data: {} }],
  };
}

// Re-exported so a challenge module has one place to import from.
export { noise, blendScore, dragOf, canScheme, canHelp, evt, heaviestStat };
