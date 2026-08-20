// @vitest-environment jsdom
import { it, expect } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { grantPower } from '../js/bb/powers.js';
import { buildBBWeekScreens, getTribeRelationshipHighlights } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks',
  'Emmah','Millie','Caleb','Wayne','Raj','Julia','Priya','MK','Damien'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][i % 7] }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal,
    getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, getTribeRelationshipHighlights });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'twist', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
}

it('a power lost with the evictee is not lost until the audience sees them go', () => {
  reset();
  // Everybody carries the Cloud, so whoever is evicted is a holder.
  for (const n of NAMES) grantPower('the-cloud', n, { week: 1, visibility: 'secret', source: 'test' });
  const ep = simulateBBEpisode();
  expect(ep.eliminated).toBeTruthy();
  const screens = buildBBWeekScreens(ep);
  const evIdx = screens.findIndex(s => s.id === 'bb-evict');
  for (let i = 0; i < (evIdx < 0 ? screens.length : evIdx); i++) {
    expect(screens[i].html.includes('LOST WITH ITS HOLDER'),
      `${screens[i].label} says a power died before the eviction aired`).toBe(false);
  }
});

it('SPENT does not appear on feeds before the ceremony it was spent at', () => {
  reset();
  for (const n of NAMES) grantPower('the-cloud', n, { week: 1, visibility: 'secret', source: 'test' });
  const ep = simulateBBEpisode();
  const screens = buildBBWeekScreens(ep);
  // the-cloud fires at nominations; any feed BEFORE bb-noms must not say SPENT
  const nomIdx = screens.findIndex(s => s.id === 'bb-noms');
  for (let i = 0; i < (nomIdx < 0 ? 0 : nomIdx); i++) {
    expect(screens[i].html.includes('SPENT THIS WEEK'),
      `${screens[i].label} shows a firing the viewer has not reached`).toBe(false);
  }
});

it('an old episode record with no houseAtStart still shows the evictee before the vote', () => {
  // bb-1 was exported before houseAtStart and openingState existed. On those
  // records the screens fell back to the week-END roster, so every pre-eviction
  // screen dropped the evictee from the wall, the standings and every alliance
  // — and their absence spoiled the vote.
  reset();
  const ep = simulateBBEpisode();
  const gone = ep.eliminated;
  expect(gone).toBeTruthy();
  const aged = { ...ep, houseAtStart: undefined, openingState: undefined };
  const screens = buildBBWeekScreens(aged);
  const before = screens.find(s => s.id === 'bb-overview');
  expect(before, 'no Before screen rendered').toBeTruthy();
  expect(before.html.includes(gone),
    'the Before screen is missing the person who leaves tonight').toBe(true);
  const firstFeed = screens.find(s => /bb-house/.test(s.id));
  if (firstFeed) {
    expect(firstFeed.html.includes(gone),
      'the first feed is missing the person who leaves tonight').toBe(true);
  }
});

it('a double eviction second cycle counts on the record wall, even on an already-played episode', () => {
  reset();
  seasonConfig.twistSchedule = [{ episode: 2, type: 'bb-double-eviction' }];
  simulateBBEpisode();
  const ep2 = simulateBBEpisode();
  expect(ep2.doubleEviction, 'the double did not fire').toBeTruthy();
  const d = ep2.doubleEviction;

  // Imitate the author's real season: the episode was simulated BEFORE
  // safetyWinner/initialNominees were recorded on the double, so strip them —
  // the wall must recover the wins from the second cycle's own acts.
  delete ep2.doubleEviction.safetyWinner;
  delete ep2.doubleEviction.initialNominees;

  const ep3 = simulateBBEpisode();
  const screens = buildBBWeekScreens(ep3);
  const before = screens.find(s => s.id === 'bb-overview');
  expect(before).toBeTruthy();

  // The second-cycle HOH's row must carry a crown count. The row is
  // `<strong class="bbst-name">NAME</strong>` followed by its stat spans.
  const row = before.html.split('bbst-row').find(r => r.includes(`>${d.hoh}</strong>`));
  expect(row, `no wall row for the second-cycle HOH ${d.hoh}`).toBeTruthy();
  expect(/#f0a500/.test(row), `${d.hoh} won the fast-forward's crown and the wall shows nothing`).toBe(true);
});
