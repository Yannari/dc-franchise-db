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
import { pickOrder, draftRoles, captainSplit, ROLE_SPOTLIGHT } from '../assign.js';

/**
 * The default hand-out, driven by the challenge's own `assignment` field.
 *
 * Nothing here is positional any more: a queen who picks early can still duck
 * the lead, and a captain builds her team out of the room's bonds rather than
 * out of the array index. That matters because both of those are things the
 * panel refers to later — "you had first pick" only stings if first pick was
 * a choice she actually made.
 */
export function assign(ctx) {
  const { living, players, maxi, rng, miniWinner, mini, bond } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  const events = [];
  const teams = [];
  let roles = {};
  let picks = {};

  if (maxi.assignment === 'captains' && order.length >= 4) {
    // The mini's captaincy is spent here, and only here.
    const heads = mini?.buys === 'captain' && miniWinner
      ? [miniWinner, order.find(n => n !== miniWinner)]
      : order.slice(0, 2);
    const split = captainSplit({ order, captains: heads, players, bond, rng });
    teams.push(...split.teams);
    events.push(...split.events);
  } else if (maxi.format === 'teams') {
    const half = Math.ceil(order.length / 2);
    teams.push(order.slice(0, half), order.slice(half));
  } else if (maxi.format === 'cast') {
    teams.push([...order]);
  } else if (maxi.format === 'pairs') {
    for (let i = 0; i < order.length; i += 2) teams.push(order.slice(i, i + 2));
  }

  if (!maxi.roles) {
    for (const n of order) roles[n] = 'standard';
  } else if (teams.length > 1) {
    // Each team runs its own ladder, so every team has exactly one lead. A
    // single ladder across the room would give one team both big parts.
    const out = teams.map(t => draftRoles({
      order: order.filter(n => t.includes(n)), roleNames: roleLadder(t.length), rng, players,
    }));
    roles = Object.assign({}, ...out.map(o => o.roles));
    picks = keyByName(out.flatMap(o => o.picks));
  } else {
    const d = draftRoles({ order, roleNames: roleLadder(order.length), rng, players });
    roles = d.roles;
    picks = keyByName(d.picks);
  }

  return {
    roles, teams, order, picks, events,
    scenes: [{ step: 'choice', kind: 'assignment', data: { order, teams, roles } }],
  };
}

/**
 * `picks` is keyed by queen everywhere, whichever hand-out produced it.
 *
 * A draft records what she took and whether she ducked; a contest records what
 * she got and what it cost her. Different payloads, one key, so a screen or a
 * critique can ask `picks[name]` without knowing which kind of night it was.
 */
function keyByName(list) {
  return Object.fromEntries(list.map(p => [p.name, p]));
}

/** One lead, a couple of featured parts, the rest filling the stage. */
function roleLadder(n) {
  const out = ['lead'];
  for (let i = 1; i < n; i++) {
    out.push(i < 3 ? 'featured' : i < Math.max(3, n - 2) ? 'standard' : 'ensemble');
  }
  return out.filter(r => ROLE_SPOTLIGHT[r]);
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
