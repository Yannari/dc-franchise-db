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
import { pickOrder, captainSplit } from '../assign.js';
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
export function pickGroupTheme(rng, teamCount = 1, pinnedId) {
  const theme = (pinnedId && GROUP_THEMES.find(t => t.id === pinnedId))
    || GROUP_THEMES[Math.floor(rng() * GROUP_THEMES.length)];
  const pool = [...theme.names];
  const names = [];
  for (let i = 0; i < teamCount; i++) {
    if (!pool.length) pool.push(...theme.names);
    names.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return { ...theme, names };
}


/**
 * Silently sort each team into roles by aptitude.
 *
 * Girl groups do NOT have a formal role draft — the team sorts itself out
 * in the werk room. Roles still exist for scoring (lead amplifies swing,
 * ensemble dampens it) but they are assigned by stats, not picked on camera.
 */
function assignRoles(team, players, rng) {
  const scored = team.map(n => {
    const d = dragOf(players[n]);
    const bold = Number(players[n]?.stats?.boldness) || 5;
    return { name: n, v: d.singing * 0.4 + bold * 0.3 + d.dance * 0.2 + noise(rng, 1) };
  }).sort((a, b) => b.v - a.v);
  const ladder = PART_LADDER.slice(0, team.length);
  const roles = {};
  for (let i = 0; i < scored.length; i++) roles[scored[i].name] = ladder[i] || 'ensemble';
  return roles;
}

/**
 * How valuable a queen is as a team pick for a girl group.
 *
 * Captains pick based on friendship (bonds), how well the queen is doing
 * in the competition (PPE from state.record), and stats that matter for a
 * group number (dance, singing).
 */
function pickValue(cap, name, { bond, players, state, rng }) {
  const b = bond(cap, name);
  const d = dragOf(players[name]);
  const _ppeW = { WIN: 5, HIGH: 4, SAFE: 3, LOW: 2, BTM: 1, BTM2: 1 };
  const rec = state?.record?.[name] || [];
  const ppe = rec.length ? rec.reduce((s, x) => s + (_ppeW[x] ?? 0), 0) / rec.length : 3;
  return b * 1.2 + ppe * 0.8 + (d.dance + d.singing) * 0.15 + noise(rng, 1.5);
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, bond, maxi, state } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  const events = [];
  let teams;

  const ggFmt = ctx.cfg?.ggFormat;
  const teamCount = ggFmt === 'cast' ? 1
    : ggFmt === 'teams-3' || ggFmt === 'ind-3' ? 3
    : ggFmt === 'teams-2' || ggFmt === 'ind-2' ? 2
    : maxi.format === 'cast' ? 1
    : (order.length >= 10 && maxi.format !== 'cast' && rng() < 0.5) ? 3 : 2;

  if (teamCount === 1) {
    teams = [[...order]];
  } else {
    const captains = [];
    if (miniWinner && order.includes(miniWinner)) {
      captains.push(miniWinner);
    }
    const pool = order.filter(n => !captains.includes(n));
    while (captains.length < teamCount && pool.length) {
      const boldest = pool.reduce((best, n) => {
        const b = Number(players[n]?.stats?.boldness) || 5;
        const s = Number(players[n]?.stats?.social) || 5;
        return (b + s * 0.5) > (Number(players[best]?.stats?.boldness) || 5)
          + (Number(players[best]?.stats?.social) || 5) * 0.5 ? n : best;
      }, pool[0]);
      captains.push(boldest);
      pool.splice(pool.indexOf(boldest), 1);
    }
    const valueFn = (cap, name) => pickValue(cap, name, { bond, players, state, rng });
    const split = captainSplit({ order, captains, players, bond, rng, valueFn });
    teams = split.teams;
    events.push(...split.events);
  }

  const pinnedId = ctx.cfg?.ggThemeId;
  const theme = pinnedId
    ? pickGroupTheme(rng, teams.length, pinnedId)
    : pickGroupTheme(rng, teams.length);
  const teamNames = teams.map((_, i) => theme.names[i]);

  const roles = {};
  for (const t of teams) Object.assign(roles, assignRoles(t, players, rng));

  return {
    roles, teams, order, picks: {}, events, theme, teamNames,
    scenes: [
      { step: 'choice', kind: 'team-pick',
        data: { teams, teamNames, captains: teams.map(t => t[0]) } },
    ],
  };
}

export function prepare(ctx) {
  const { living, players, rng, assignment } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const verse = {};
  const booth = {};
  const choreographers = {};

  // Each team picks a choreographer. The best dancer who is also bold enough
  // to take charge usually gets it; the choreographer's dance stat gives the
  // whole team a prep bonus or penalty.
  for (const team of (assignment?.teams || [living])) {
    const candidates = team.map(n => {
      const d = dragOf(players[n]);
      const bold = Number(players[n]?.stats?.boldness) || 5;
      return { name: n, v: d.dance * 0.6 + bold * 0.25 + noise(rng, 1.5) };
    }).sort((a, b) => b.v - a.v);
    const choreo = candidates[0].name;
    choreographers[choreo] = team;
    const d = dragOf(players[choreo]);
    const quality = (d.dance - 5) * 0.3;
    for (const n of team) w.prep[n] = (w.prep[n] || 0) + quality;
    events.push(evt('choreographer', {
      players: [choreo, ...team.filter(n => n !== choreo)],
      pop: { [choreo]: d.dance >= 7 ? 2 : d.dance <= 4 ? -2 : 0 },
      data: { choreographer: choreo, team: [...team], dance: d.dance },
    }));
  }

  for (const n of living) {
    const d = dragOf(players[n]);
    const s = players[n]?.stats || {};
    const v = d.singing * 0.5 + d.comedy * 0.3 + (Number(s.mental) || 5) * 0.02 + noise(rng, 2);
    verse[n] = Math.round(v * 100) / 100;
    if (v < 3) {
      events.push(evt('bad-verse', { players: [n], pop: { [n]: -2 }, data: { verse: verse[n] } }));
    } else if (v > 8) {
      events.push(evt('verse-of-the-week', { players: [n], pop: { [n]: 3 }, data: { verse: verse[n] } }));
    }

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
    prep: w.prep, events, verse, choreographers,
    scenes: [
      ...r.scenes,
      { step: 'prep', kind: 'choreographer-pick',
        data: { choreographers, teams: assignment?.teams || [living] } },
      { step: 'prep', kind: 'recording-booth', data: { verse, booth } },
    ],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bond, verse, maxi, cfg } = ctx;
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
    teamJudged: assignment.teams.length > 1
      && (cfg?.ggFormat ? !cfg.ggFormat.startsWith('ind') : maxi?.format !== 'teams-individual'),
    bestTeam,
    scenes: [{ step: 'maxi-pre', kind: 'group-number', data: { teams: assignment.teams, means, bestTeam } }],
  };
}
