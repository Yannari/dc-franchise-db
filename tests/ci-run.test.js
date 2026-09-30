// ci-run.test.js — the Circle is REACHABLE from the run tab (Plan 4 Task 1).
// Every guard here is on the path the run tab takes: the flag, the queue, a
// reload, a re-run, and what gets saved.
import { describe, expect, it } from 'vitest';
import { gs, setGs, players, setPlayers, seasonConfig, formatIsRunnable } from '../js/core.js';
import { isCircleSeason, simulateCircleEpisode, circleEpisodesLeft, circleCastProblem, lastCircleRefusal,
  circleCanRerun, rerunCircleEpisode, circleSeasonShape, circleBookings } from '../js/ci-run.js';
import { makePlayers } from './helpers/ci-cast.js';

function freshSeason(n = 13, extra = {}) {
  // Every Circle option reset: a test that sets one must not leak it into the next.
  Object.assign(seasonConfig, { format: 'the-circle', seasonNumber: 1, ciSetup: {}, ciPool: [], twistSchedule: [],
    ciDays: null, ciFinalists: 5, ciNewcomerRule: 'rate-not-rated', ciPickBy: 'stats', ciAI: false, ...extra });
  setPlayers(makePlayers(n, 5));
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ci: { seed: 505 } });
}
function playAll() {
  const aired = [];
  for (let i = 0; i < 30; i++) { const row = simulateCircleEpisode(); if (!row) break; aired.push(row); }
  return aired;
}

describe('the Circle can be started', () => {
  it('importing ci-run IS the wiring: the flag is set and the show reads as runnable', () => {
    expect(window._ciRunnable).toBe(true);
    expect(formatIsRunnable({ format: 'the-circle' })).toBe(true);
    freshSeason();
    expect(isCircleSeason()).toBe(true);
  });

  it('refuses a cast too small for its finalists, and says why', () => {
    freshSeason(5);
    expect(circleCastProblem()).toMatch(/more players than finalists/);
    expect(simulateCircleEpisode()).toBe(null);
    expect(lastCircleRefusal()).toMatch(/finalists/);
  });
});

import { DEFAULT_POOL } from '../js/ci/default-pool.js';
describe('a season nobody wrote a pool for', () => {
  const catfishNames = rows => new Set(rows.flatMap(r => Object.values(r.ci.profiles || {}))
    .filter(p => p.mode === 'catfish').map(p => p.name));
  it('plays the default Catfish Pool, so some players still hide behind a persona', () => {
    freshSeason(13, { ciPool: undefined });
    const names = catfishNames(playAll());
    expect(names.size).toBeGreaterThan(0);
    const handles = new Set(DEFAULT_POOL.map(p => p.handle));
    for (const n of names) expect(handles.has(n), n).toBe(true);
  });
  it('an author who emptied the pool gets a season with no catfish', () => {
    freshSeason(13, { ciPool: [] });
    expect(catfishNames(playAll()).size).toBe(0);
  });
});

describe('the season options', () => {
  it('plays the Days asked for; a number too small for the cast is raised to the fewest it needs', () => {
    freshSeason(13, { ciDays: 1 });
    const fewest = circleSeasonShape().length;
    expect(fewest).toBeGreaterThanOrEqual(10);
    for (const ciDays of [8, 12, 20, 30]) {
      freshSeason(13, { ciDays });
      const want = Math.max(ciDays, fewest);
      expect(circleSeasonShape().length, `ciDays ${ciDays}`).toBe(want);
      expect(playAll(), `ciDays ${ciDays}`).toHaveLength(want);
      expect(gs.activePlayers.length).toBe(5);
    }
  });

  it('four finalists end the season on four', () => {
    freshSeason(13, { ciFinalists: 4 });
    playAll();
    expect(gs.activePlayers.length).toBe(4);
  });
});

import { getEpisodeEliminations, buildHubAftermath } from '../js/run-ui.js';
import { circleBlockShape } from '../js/ci-run.js';
import { showWords } from '../js/shows.js';
describe('the site knows who was blocked', () => {
  it('a blocking row names who left; the hub says it in the Circle\'s words', () => {
    freshSeason();
    const aired = playAll();
    const night = aired.find(r => r.ci.blocked.length);
    const people = night.ci.blocked.flatMap(h => night.ci.profiles[h]?.people || []);
    expect(getEpisodeEliminations(night).sort()).toEqual(people.sort());
    const hub = buildHubAftermath(night);
    expect(hub.why).toMatch(/was blocked/);
    expect(`${hub.why} ${hub.voteShape}`).not.toMatch(/vote|ballot|eliminat/i);
    // every blocking night says HOW, never "No blocking" beside a blocking
    for (const r of aired.filter(x => x.ci.blocked.length)) expect(buildHubAftermath(r).voteShape, `ep ${r.num}`).not.toBe('No blocking');
    expect(circleBlockShape([{ name: 'A', channel: 'instant', by: [] }])).toBe('Lowest rated, blocked on the spot');
    expect(circleBlockShape([{ name: 'A', channel: 'influencers', by: ['Kayla', 'Jake'] }])).toBe('Influencers: Kayla & Jake');
    expect(circleBlockShape([{ name: 'A', channel: 'influencers', by: ['Kayla'], secret: true }])).toBe('Secret Influencers');
    expect(showWords('the-circle').shapeLabel).toBeTruthy();
    // an Influencer night says who did it; a catfish is named with the profile
    const infl = aired.find(r => r.exits?.some(x => x.channel === 'influencers' && x.by.length && !x.secret));
    expect(buildHubAftermath(infl).why).toMatch(/ by /);
    const cat = aired.find(r => r.exits?.some(x => x.profile && x.profile !== x.name));
    if (cat) expect(buildHubAftermath(cat).why).toMatch(/playing as/);
    const quiet = aired.find(r => !r.ci.blocked.length && r.num > 1 && r.num < aired.length - 1);
    expect(getEpisodeEliminations(quiet)).toEqual([]);
    const q = buildHubAftermath(quiet);
    expect(`${q.why} ${q.voteShape}`).not.toMatch(/vote|ballot|eliminat/i);
  });
});

describe('what the draw dealt, for the cast cards', () => {
  it('each player: a persona and why, or themselves and what they edited', () => {
    freshSeason(13, { ciPool: undefined });
    simulateCircleEpisode();
    const dealt = gs.ci.dealt;
    expect(Object.keys(dealt).sort()).toEqual(players.map(p => p.name).sort());
    const cat = Object.entries(dealt).filter(([, d]) => d.mode === 'catfish');
    expect(cat.length).toBeGreaterThan(0);
    for (const [, d] of cat) {
      expect(DEFAULT_POOL.map(p => p.id)).toContain(d.personaId);
      expect(d.shown.name).toBe(DEFAULT_POOL.find(p => p.id === d.personaId).handle);
      expect(['strategic', 'protective', 'family', 'experimental']).toContain(d.reason);
    }
    for (const [, d] of Object.entries(dealt).filter(([, x]) => x.mode === 'edited')) expect(d.edits.length).toBeGreaterThan(0);
    expect(gs.ci.unused.length + cat.length).toBe(DEFAULT_POOL.length);
  });
});

describe('a season plays one episode per press', () => {
  it('airs every day of the schedule, then stops, and names the winner', () => {
    freshSeason();
    const days = circleSeasonShape().length;
    const aired = playAll();
    expect(aired).toHaveLength(days);
    expect(aired.map(r => r.num)).toEqual(aired.map((_, i) => i + 1));
    expect(circleEpisodesLeft()).toBe(0);
    expect(gs.phase).toBe('complete');
    expect(gs.ciWinners.length).toBeGreaterThan(0);
    // what is saved is rows, never the engine's state
    expect(JSON.stringify(gs).length).toBeLessThan(6_000_000);
    expect(gs.ci.state).toBeUndefined();
  });

  it('a queue lost to a reload rebuilds the SAME season and keeps what aired', () => {
    freshSeason();
    const first = [simulateCircleEpisode(), simulateCircleEpisode(), simulateCircleEpisode()];
    delete gs._ciQueue;
    const next = simulateCircleEpisode();
    expect(next.num).toBe(4);
    freshSeason();
    const whole = playAll();
    expect(JSON.stringify(whole[3].ci.blocked)).toBe(JSON.stringify(next.ci.blocked));
    expect(first.map(r => r.num)).toEqual([1, 2, 3]);
  });
});

import { buildSeasonHubModel } from '../js/run-ui.js';
describe('reviewing an earlier episode', () => {
  it('the hub shows who was in AFTER that episode, not who is in now', () => {
    freshSeason();
    const aired = playAll();
    const two = aired[1];
    const model = buildSeasonHubModel(gs, seasonConfig, players, 2);
    expect(model.isHistorical).toBe(true);
    expect(model.remaining).toBe(two.ci.people.length);
    expect(model.remaining).not.toBe(gs.activePlayers.length);
  });
});

describe('re-running an episode', () => {
  it('keeps every earlier episode and deals the chosen one again', () => {
    freshSeason();
    const aired = playAll();
    expect(circleCanRerun()).toBe(true);
    const before = JSON.stringify(aired.slice(0, 3).map(r => r.ci.blocked));
    expect(rerunCircleEpisode(4)).toBe(true);
    expect(gs.episodeHistory.filter(r => r.format === 'the-circle').map(r => r.num)).toEqual([1, 2, 3]);
    const again = simulateCircleEpisode();
    expect(again.num).toBe(4);
    expect(JSON.stringify(gs.episodeHistory.slice(0, 3).map(r => r.ci.blocked))).toBe(before);
  });
});

import { circleTimelineDays } from '../js/ci-run.js';
describe('the Season Timeline tiles say what each day is', () => {
  it('before anything airs: what the day holds, and how many are in, projected', () => {
    freshSeason();
    const shape = circleSeasonShape();
    const days = circleTimelineDays();
    expect(days.size).toBe(shape.length);
    const first = days.get(1);
    expect(first.label).toMatch(/Blocking/);
    expect(first.end).toBe(first.start - 1);
    const arrival = shape.find(d => d.arrivals > 0);
    const tile = days.get(arrival.day);
    expect(tile.label).toMatch(/(Newcomer|\d newcomers)/);
    expect(tile.end).toBe(tile.start + arrival.arrivals - (arrival.block ? 1 : 0));
    const social = shape.find(d => !d.block && !d.final && !d.finale);
    expect(days.get(social.day).label).toMatch(/No blocking/);
    expect(days.get(shape.find(d => d.final).day)).toMatchObject({ label: 'Final ratings', end: 5 });
    expect(days.get(shape.find(d => d.finale).day).label).toBe('Finale');
  });

  it('once the season is played, the counts are the ones that happened', () => {
    freshSeason();
    const aired = playAll();
    const days = circleTimelineDays();
    for (const r of aired) expect(days.get(r.num).end, `day ${r.num}`).toBe(r.ci.people.length);
  });
});

describe('the Season Timeline books by episode', () => {
  it('a Circle card booked on episode N books the slot day N is', () => {
    freshSeason();
    const day3 = circleSeasonShape().find(d => d.day === 3);
    seasonConfig.twistSchedule = [{ type: 'ci-sole-influencer', episode: 3 }, { type: 'some-other-show-twist', episode: 3 }];
    expect(circleBookings()).toEqual({ [day3.slot]: ['ci-sole-influencer'] });
  });

  it('and the episode that airs that day plays the card', () => {
    freshSeason();
    const day = [...circleTimelineDays()].find(([, d]) => d.block && d.start > 6)[0];
    seasonConfig.twistSchedule = [{ type: 'ci-sole-influencer', episode: day }];
    const row = playAll().find(r => r.num === day);
    expect(row.ci.night).toEqual({ format: 'sole', booked: true, fellBack: null });
  });
});

import { buildVPScreens } from '../js/vp-screens.js';
import { generateSummaryText } from '../js/text-backlog.js';
describe('an aired episode can be watched and read', () => {
  it('the VP shows every aired scene, and the text backlog says the same lines', () => {
    freshSeason();
    const [, row] = [simulateCircleEpisode(), simulateCircleEpisode()];
    const screens = buildVPScreens(row);
    const aired = row.ci.aired.filter(s => s.script?.blocks?.length).length;
    expect(screens.length).toBe(aired);
    expect(screens.every(s => s.html.includes('Episode 2'))).toBe(true);
    const text = generateSummaryText(row);
    // a line from the first screen appears in the backlog too
    const firstLine = screens[0].html.match(/data-text="([^"]+)"/)?.[1]?.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
    expect(text).toContain(firstLine.slice(0, 30));
  });
});

describe('a row carries what the screens draw', () => {
  it('each profile: the face the room sees, age and job; a catfish names its persona', () => {
    freshSeason(13, { ciPool: undefined });
    const row = simulateCircleEpisode();
    const ps = Object.values(row.ci.profiles);
    for (const p of ps) { expect(p).toHaveProperty('face'); expect(p.age).toBeTruthy(); }
    const cat = ps.find(p => p.mode === 'catfish');
    expect(cat.personaId).toBeTruthy();
    const honest = ps.find(p => p.mode === 'honest');
    if (honest) expect(honest.face).toBe(`portrait:${honest.people[0]}`);
  });
});

import { rosterFactsOf } from '../js/ci-run.js';
describe('Create Character reaches the season through the roster', () => {
  it('a cast entry has only game fields; the roster has the rest, found by slug or name', () => {
    window.FRANCHISE_ROSTER = [{ name: 'Hasan', slug: 'hasan', age: 25, occupation: 'Criminal law student', hometown: 'Chicago' }];
    expect(rosterFactsOf({ name: 'Hasan', slug: 'hasan' })).toMatchObject({ age: 25, occupation: 'Criminal law student', hometown: 'Chicago' });
    expect(rosterFactsOf({ name: 'Hasan' })).toMatchObject({ hometown: 'Chicago' });
    expect(rosterFactsOf({ name: 'Nobody' })).toEqual({});
  });
  it('the dealt profile of an honest player shows their real job and hometown', () => {
    freshSeason(13, { ciPool: [] });
    const first = players[0];
    window.FRANCHISE_ROSTER = [{ name: first.name, slug: first.slug, occupation: 'Criminal law student', hometown: 'Chicago' }];
    simulateCircleEpisode();
    expect(gs.ci.dealt[first.name].shown).toMatchObject({ job: 'criminal law student', hometown: 'Chicago' });
    delete window.FRANCHISE_ROSTER;
  });
});

import { circleKnownAs } from '../js/ci-run.js';
describe('"Already famous?" on Auto reads the celebrity system', () => {
  const who = (name, extra = {}) => ({ name, slug: name.toLowerCase(), stats: {}, ...extra });
  it('fame stars decide it: an Icon or Celebrity, a Household Name, a Cult Following, nobody', () => {
    const stars = { ada: 5, bo: 3, cy: 1, di: 0 };
    const k = circleKnownAs([who('Ada'), who('Bo'), who('Cy'), who('Di')], { starsOf: p => stars[p.slug] ?? 0 });
    expect(k.Ada).toMatchObject({ rep: 'celebrity', stars: 5 });
    expect(k.Bo).toMatchObject({ rep: 'threat', stars: 3 });
    expect(k.Cy).toMatchObject({ rep: 'known', stars: 1 });
    expect(k.Di).toMatchObject({ rep: 'none', stars: 0 });
  });
  it('the cast form\'s background set to Celebrity counts, and a returnee is at least known', () => {
    const k = circleKnownAs([who('Ed', { backgroundType: 'celebrity' }), who('Fi', { isReturnee: true })], { starsOf: () => 0 });
    expect(k.Ed.rep).toBe('celebrity');
    expect(k.Fi.rep).toBe('known');
  });
  it('the season hands the rep to the engine', () => {
    freshSeason();
    const k = circleKnownAs(players, { starsOf: () => 0 });
    expect(Object.values(k).every(x => x.rep === 'none')).toBe(true);
  });
});

describe('the player: Next within reach', () => {
  it('each screen has a Next button on the stage, and the keyboard moves on', () => {
    freshSeason();
    const [, row] = [simulateCircleEpisode(), simulateCircleEpisode()];
    const screens = buildVPScreens(row);
    expect(screens[0].html).toMatch(/civ-nextbtn/);
    expect(screens[0].html).toMatch(/civ-stagewrap/);
  });
});

describe('the player files Circle screens under the Circle\'s own words, never "Camp"', () => {
  it('every screen of a played day gets a Circle phase', async () => {
    window.matchMedia ||= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
    const { _vpPhaseForScreen } = await import('../js/vp-ui.js');
    freshSeason();
    const rows = playAll();
    const labels = new Set();
    for (const r of rows.slice(0, 4)) for (const s of buildVPScreens(r)) labels.add(_vpPhaseForScreen(s.id).label);
    for (const l of labels) expect(['The Morning', 'The Day', 'The Ratings', 'The Blocking', 'The Final']).toContain(l);
    expect(labels.has('Camp')).toBe(false);
  });
});

describe('who is known as a villain', () => {
  const who = (name, extra = {}) => ({ name, slug: name.toLowerCase(), stats: {}, ...extra });
  it('someone who has aired before and played a villain or a schemer; a mastermind reads as a big threat', () => {
    const stars = { hea: 1.5, sco: 1, mas: 1, new: 0 };
    const k = circleKnownAs([who('Hea', { archetype: 'villain' }), who('Sco', { archetype: 'schemer' }), who('Mas', { archetype: 'mastermind' }), who('New', { archetype: 'villain' })],
      { starsOf: p => stars[p.slug] ?? 0 });
    expect(k.Hea.rep).toBe('villain');
    expect(k.Sco.rep).toBe('villain');
    expect(k.Mas.rep).toBe('threat');
    expect(k.New.rep).toBe('none');          // a first-timer: nobody has seen them play anything
  });
  it('a celebrity stays a celebrity, whatever they played', () => {
    const k = circleKnownAs([who('Ale', { archetype: 'villain' })], { starsOf: () => 5 });
    expect(k.Ale.rep).toBe('celebrity');
  });
});
