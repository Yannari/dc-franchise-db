// ══════════════════════════════════════════════════════════════════════
// dr/chal/girl-group.js — verses, the booth, and who takes the front
// ══════════════════════════════════════════════════════════════════════
//
// Serves the girl group, the Rumix and the music video: one track, parts
// drafted off it, a group number performed together. They differ in flavour,
// which is Plan 3's business — the mechanic is identical, and three copies of
// it would be three places for the spotlight hog to drift out of sync.
//
// The team result is a NUDGE, not a verdict: +0.8 to the winning team and
// -0.4 to the losing one. A standout on the losing team must still be able to
// out-score a passenger on the winning one, because that is a thing that
// happens on this show every season and a flat team score would make it
// impossible.
import { pickOrder, draftRoles, captainSplit } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, ROLE_RANGES } from '../perform.js';
import { canScheme, evt } from '../rules.js';

const PART_LADDER = ['lead', 'featured', 'featured', 'standard', 'standard',
  'ensemble', 'ensemble', 'ensemble'];

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, bond, maxi } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  const events = [];
  let teams;

  if (maxi.format === 'cast') {
    teams = [[...order]];
  } else if (mini?.buys === 'captain' && miniWinner) {
    // The mini's captaincy is spent here: she builds her own team, with
    // everything captainSplit charges a schemer for doing it badly.
    const second = order.find(n => n !== miniWinner);
    const split = captainSplit({ order, captains: [miniWinner, second], players, bond, rng });
    teams = split.teams;
    events.push(...split.events);
  } else {
    const half = Math.ceil(order.length / 2);
    teams = [order.slice(0, half), order.slice(half)];
  }

  // Each team drafts its own ladder, so every team has exactly one lead.
  const roles = {};
  const picks = {};
  for (const t of teams) {
    const d = draftRoles({
      order: order.filter(n => t.includes(n)),
      roleNames: PART_LADDER.slice(0, t.length), rng, players,
    });
    Object.assign(roles, d.roles);
    for (const p of d.picks) picks[p.name] = { ...p, choice: p.role, penalty: 0 };
  }

  return {
    roles, teams, order, picks, events,
    scenes: [{ step: 'choice', kind: 'group-parts', data: { teams, roles } }],
  };
}

export function prepare(ctx) {
  const { living, players, rng } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const verse = {};
  const booth = {};

  for (const n of living) {
    const d = dragOf(players[n]);
    const s = players[n]?.stats || {};
    // Writing the verse is its own job, and a comic can write her way out of
    // a voice she does not have.
    const v = d.singing * 0.5 + d.comedy * 0.3 + (Number(s.mental) || 5) * 0.02 + noise(rng, 2);
    verse[n] = Math.round(v * 100) / 100;
    if (v < 3) {
      events.push(evt('bad-verse', { players: [n], pop: { [n]: -2 }, data: { verse: verse[n] } }));
    } else if (v > 8) {
      events.push(evt('verse-of-the-week', { players: [n], pop: { [n]: 3 }, data: { verse: verse[n] } }));
    }

    // The booth adjusts everybody's prep, because everybody records. It only
    // becomes an EVENT at the ends: a scene per queen per week is not drama,
    // it is a status line, and it would churn six popularity numbers a week
    // for nothing anybody watches.
    const ok = d.singing >= 6;
    booth[n] = ok ? 0.5 : -0.5;
    w.prep[n] = (w.prep[n] || 0) + booth[n];
    if (d.singing >= 8 || d.singing <= 3) {
      events.push(evt('booth', {
        players: [n], pop: { [n]: ok ? 1 : -1 },
        data: { ok, singing: d.singing },
      }));
    }
  }

  return {
    prep: w.prep, events, verse,
    scenes: [...r.scenes, { step: 'prep', kind: 'recording-booth', data: { verse, booth } }],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bond, verse } = ctx;
  const performances = {};
  const events = [];
  const teamOf = n => assignment.teams.find(t => t.includes(n)) || [];
  const raw = {};

  for (const n of living) {
    const d = dragOf(players[n]);
    const team = teamOf(n);
    const chem = team.length > 1
      ? team.filter(o => o !== n).reduce((s, o) => s + bond(n, o), 0) / (team.length - 1) * 0.15
      : 0;
    // The role widens the swing rather than capping it: the lead can win the
    // week or lose it, and the ensemble mostly cannot do either.
    const range = ROLE_RANGES[assignment.roles[n]] ?? 1;
    const base = d.singing * 0.35 + d.dance * 0.35 + d.comedy * 0.15 + d.runway * 0.15;
    raw[n] = (base - 5) * range + 5 + (prep[n] || 0) + chem + noise(rng, 2.2 * range);
  }

  // Somebody takes the front. It works for her and it costs the room.
  for (const team of assignment.teams) {
    if (team.length < 3) continue;
    const hog = team.filter(n => canScheme(players[n]))
      .sort((a, b) => (Number(players[b]?.stats?.boldness) || 5)
        - (Number(players[a]?.stats?.boldness) || 5))[0];
    if (!hog) continue;
    if (rng() > (Number(players[hog]?.stats?.boldness) || 5) / 12) continue;
    raw[hog] += 1.2;
    const others = team.filter(n => n !== hog);
    for (const o of others) raw[o] -= 0.5;
    events.push(evt('spotlight-hog', {
      players: [hog, ...others],
      bond: others.map(o => [hog, o, -1]),
      pop: { [hog]: -2 },
      data: { team: [...team] },
    }));
  }

  // Somebody is carried, and the room knows it. The carrier is paid for it,
  // which is the difference between this and a plain low score.
  for (const team of assignment.teams) {
    if (team.length < 3) continue;
    const mean = team.reduce((s, n) => s + raw[n], 0) / team.length;
    const weakest = team.reduce((w, n) => (raw[n] < raw[w] ? n : w), team[0]);
    const best = team.reduce((b, n) => (raw[n] > raw[b] ? n : b), team[0]);
    if (raw[weakest] < 4 && mean > 7 && best !== weakest) {
      events.push(evt('carried', {
        players: [best, weakest],
        bond: [[best, weakest, 0.5]],
        pop: { [weakest]: -1, [best]: 1 },
        data: { mean: Math.round(mean * 100) / 100 },
      }));
    }
  }

  const means = assignment.teams.map(t =>
    t.reduce((s, n) => s + raw[n], 0) / Math.max(1, t.length));
  const bestTeam = means.indexOf(Math.max(...means));

  for (const n of living) {
    const ti = assignment.teams.findIndex(t => t.includes(n));
    const teamBonus = assignment.teams.length < 2 ? 0 : ti === bestTeam ? 0.8 : -0.4;
    const perf = raw[n] + teamBonus;
    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: perf > 11,
      risk: (Number(players[n]?.stats?.boldness) || 5) / 10,
      role: assignment.roles[n],
      team: ti,
      parts: { prep: prep[n] || 0, teamBonus },
      detail: {
        verse: verse?.[n] ?? null,
        teamWon: ti === bestTeam,
        teamMean: Math.round((means[ti] ?? 0) * 100) / 100,
      },
    };
  }

  return {
    performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-pre', kind: 'group-number', data: { teams: assignment.teams, means, bestTeam } }],
  };
}
