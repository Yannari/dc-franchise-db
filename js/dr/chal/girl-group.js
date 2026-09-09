// ══════════════════════════════════════════════════════════════════════
// dr/chal/girl-group.js — verses, the booth, and who takes the front
// ══════════════════════════════════════════════════════════════════════
//
// Serves the girl group, the Rumix and the music video: one track, parts
// drafted off it, a group number performed together. They differ in flavour,
// which is Plan 3's business — the mechanic is identical, and three copies of
// it would be three places for the spotlight hog to drift out of sync.
//
// The team result drives TEAM-JUDGED placement: the winning team is safe as a
// block (best = WIN, rest = HIGH) and only the losing team provides BTM2/LOW.
// Individual scores still carry a nudge (+0.8 / -0.4) so the host bend and
// within-team ranking reflect how much the team carried or cost each queen.
import { pickOrder, draftRoles, captainSplit } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, ROLE_RANGES, riskFor } from '../perform.js';
import { canScheme, evt } from '../rules.js';

const PART_LADDER = ['lead', 'featured', 'featured', 'standard', 'standard',
  'ensemble', 'ensemble', 'ensemble'];

/* ── THE TRACK, AND WHAT THE GROUP IS CALLED ──
   The girl group challenge ran with no theme at all: teams were "team 1" and
   "team 2", the track was nameless, and two groups performed the same nothing
   every time it came up. A real one always has a sound and a name that falls
   out of it, and the name is half the joke.

   `names` are drawn from and belong to the theme, so a group is never called
   something the track would not produce. One name per team, never repeated
   inside a season — a second Sugar Rush three episodes later is the tell that
   nobody looked. */
export const GROUP_THEMES = [
  { id: 'bubblegum', track: 'Sugar High',
    sound: 'a relentless bubblegum-pop confection with a chorus engineered to lodge in the skull',
    names: ['Sugar Rush', 'The Bonbons', 'Candy Coated', 'Saccharine'] },
  { id: 'disco', track: 'Mirrorball',
    sound: 'four-on-the-floor disco with a string section that will not quit',
    names: ['The Glitterballs', 'Studio Sixty-Nine', 'Hustle', 'The Nightfevers'] },
  { id: 'girl-power', track: 'Watch Me Werk',
    sound: 'nineties girl-power stomp, all shouted ad-libs and a spoken-word bridge',
    names: ['Girl Code', 'The Attitudes', 'Wannabe', 'Fierce Inc.'] },
  { id: 'country', track: 'Ride or Die',
    sound: 'stomp-clap country-pop with a key change nobody asked for',
    names: ['The Rhinestones', 'Boots & Bows', 'The Honky Tonk Angels', 'Dixie Fried'] },
  { id: 'rnb', track: 'Slow Burn',
    sound: 'slinky late-night R&B built for runs, which is a trap for anybody who cannot do one',
    names: ['Velvet', 'The Sirens', 'Smooth Operators', 'After Hours'] },
  { id: 'punk', track: 'Tuck & Roll',
    sound: 'three-chord punk played too fast, screamed more than sung',
    names: ['The Safety Pins', 'Riot Grrrl', 'The Snatch', 'Loud & Wrong'] },
  { id: 'hyperpop', track: 'GLITCH',
    sound: 'hyperpop — pitched vocals, a beat that keeps falling over, and no chorus where you expect one',
    names: ['404', 'The Glitches', 'Bubblecore', 'Nightcore Nasty'] },
  { id: 'ballad', track: 'One More Look',
    sound: 'a power ballad that lives or dies on the last eight bars',
    names: ['The Torch Singers', 'Encore', 'Heartbreak Hotel', 'The Last Call'] },
  { id: 'house', track: 'Feel It',
    sound: 'a piano-led club anthem with a drop the choreography has to earn',
    names: ['The Warehouse', 'Peak Hour', 'The Divas of the Floor', 'Four On The Floor'] },
  { id: 'motown', track: 'Baby Please',
    sound: 'Motown revue — tight harmonies, tighter choreography, and nowhere to hide',
    names: ['The Supremes of Nothing', 'The Marvelous', 'Hit Factory', 'The Temptresses'] },
  { id: 'rock', track: 'Heavy Rotation',
    sound: 'arena rock with a guitar solo somebody has to mime through',
    names: ['The Heartbreakers', 'Big Hair', 'Stadium', 'The Encores'] },
  { id: 'club', track: 'After Party',
    sound: 'a Eurodance club banger with a rap section that is nobody\'s friend',
    names: ['The Afterparty', 'Neon', 'Two AM', 'The Ravers'] },
];

/**
 * One theme for the night, and a distinct name for each team.
 *
 * Names come out of the theme's own list so a group is never called something
 * its track would not produce, and no two teams share one.
 */
export function pickGroupTheme(rng, teamCount = 1) {
  const theme = GROUP_THEMES[Math.floor(rng() * GROUP_THEMES.length)];
  const pool = [...theme.names];
  const names = [];
  for (let i = 0; i < teamCount; i++) {
    if (!pool.length) pool.push(...theme.names);
    names.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return { ...theme, names };
}


export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, bond, maxi } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  const events = [];
  let teams;

  const threeTeams = order.length >= 10 && maxi.format !== 'cast' && rng() < 0.5;
  const teamCount = maxi.format === 'cast' ? 1 : threeTeams ? 3 : 2;

  if (teamCount === 1) {
    teams = [[...order]];
  } else if (mini?.buys === 'captain' && miniWinner) {
    const captains = [miniWinner];
    const rest = order.filter(n => n !== miniWinner);
    for (let i = 1; i < teamCount; i++) captains.push(rest.splice(0, 1)[0]);
    const split = captainSplit({ order, captains, players, bond, rng });
    teams = split.teams;
    events.push(...split.events);
  } else {
    const size = Math.ceil(order.length / teamCount);
    teams = [];
    for (let i = 0; i < teamCount; i++) {
      teams.push(order.slice(i * size, Math.min((i + 1) * size, order.length)));
    }
  }

  // Each team drafts its own ladder, so every team has exactly one lead.
  const roles = {};
  const picks = {};
  // The night's sound, and a name per team that falls out of it.
  const theme = pickGroupTheme(rng, teams.length);
  const teamNames = teams.map((_, i) => theme.names[i]);

  for (const t of teams) {
    const d = draftRoles({
      order: order.filter(n => t.includes(n)),
      roleNames: PART_LADDER.slice(0, t.length), rng, players,
    });
    Object.assign(roles, d.roles);
    for (const p of d.picks) picks[p.name] = { ...p, choice: p.role, penalty: 0 };
  }

  return {
    roles, teams, order, picks, events, theme, teamNames,
    scenes: [{ step: 'choice', kind: 'group-parts',
      data: { teams, roles, teamNames, track: theme.track, sound: theme.sound } }],
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
  const { living, players, assignment, prep, rng, bond, verse, maxi } = ctx;
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
    // Being carried is RELATIVE — a gap between her and the group, not an
    // absolute floor. The absolute version needed the team mean above 7 and
    // fired three times in sixty seasons, which is not a mechanic.
    if (mean - raw[weakest] > 3 && mean > 5.5 && best !== weakest) {
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
      risk: riskFor(players[n], rng),
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
    teamJudged: assignment.teams.length > 1 && maxi?.format !== 'teams-individual',
    bestTeam,
    scenes: [{ step: 'maxi-pre', kind: 'group-number', data: { teams: assignment.teams, means, bestTeam } }],
  };
}
