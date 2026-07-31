// The panels beside a stretch of house life.
//
// Three things went wrong here and all three were invisible rather than loud.
// The panels read the episode's single end-of-week snapshot, so the FIRST
// screen of a week showed the numbers the week finished on. Alliances form at
// the top of a week and nothing narrated it, so a name appeared with no scene
// anywhere explaining it. And the written relationship read — the one Total
// Drama already produces — was throwing inside a try/catch and silently
// rendering nothing.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { getTribeRelationshipHighlights, rpBuildBBHouseLife } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks',
  'Emmah','Millie','Caleb','Wayne','Raj','Julia','Priya','MK','Damien'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][i % 7] }));

function playWeek() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal,
    getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, getTribeRelationshipHighlights });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'twist', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
  const ep = simulateBBEpisode();
  return { ep, houseActs: (ep.acts || []).filter(a => a.type === 'house') };
}

describe('house life panels', () => {
  it('shows each stretch as it stood, not as the week ended', () => {
    const { houseActs } = playWeek();
    expect(houseActs.length).toBeGreaterThan(1);
    for (const act of houseActs) expect(act.state?.bonds, 'no snapshot on the act').toBeTruthy();
    // The picture genuinely moves between stretches.
    const shots = houseActs.map(a => JSON.stringify(a.state.bonds));
    expect(new Set(shots).size, 'every stretch had an identical snapshot').toBeGreaterThan(1);
  });

  it('never names an alliance before something explains it', () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const { houseActs } = playWeek();
      const firstPanel = houseActs.findIndex(a => (a.state?.alliances || []).length);
      if (firstPanel < 0) continue;
      const firstBeat = houseActs.findIndex(a =>
        (a.socialBeats || []).some(b => b.eventId === 'alliance-formed'));
      // A pre-existing alliance carried in from a previous week is fine; one
      // that forms this week must be narrated no later than it is displayed.
      if (firstBeat >= 0) expect(firstBeat).toBeLessThanOrEqual(firstPanel);
    }
  });

  it('carries the written read, not just a bar', () => {
    const { ep, houseActs } = playWeek();
    const html = rpBuildBBHouseLife(ep, houseActs.at(-1), houseActs.length);
    // This threw silently for its whole life. If it ever throws again the
    // count goes to zero and this fails.
    expect((html.match(/class="bbf-read"/g) || []).length,
      'the written relationship read rendered nothing').toBeGreaterThan(0);
    expect(html).toContain('What is actually going on');
  });

  it('names every houseguest at least once', () => {
    const { ep, houseActs } = playWeek();
    const html = rpBuildBBHouseLife(ep, houseActs.at(-1), houseActs.length);
    const missing = ep.houseAtStart.filter(n => !html.includes(n));
    expect(missing, `never named: ${missing.join(', ')}`).toEqual([]);
  });
});

// People decide to work together at any hour, not only in the gap before the
// week starts. Formation used to run once at the top of a week, so an alliance
// could only ever be born before house life began.
describe('alliance formation timing', () => {
  it('can happen in any stretch of the week', () => {
    const phases = new Set();
    for (let attempt = 0; attempt < 6; attempt++) {
      const { houseActs } = playWeek();
      houseActs.forEach(act => {
        if ((act.socialBeats || []).some(b => b.eventId === 'alliance-formed')) phases.add(act.phase);
      });
      if (phases.size >= 2) break;
    }
    expect(phases.size, 'alliances only ever formed in one stretch').toBeGreaterThan(1);
  });

  it('announces an alliance once and treats a new member as its own moment', () => {
    // The lifecycle returns the same field for a brand new alliance and for one
    // that just recruited somebody. Announcing both as a formation produced a
    // "said out loud for the first time" beat on every single recruitment.
    const { houseActs } = playWeek();
    const beats = houseActs.flatMap(a => a.socialBeats || []);
    const announced = beats.filter(b => b.eventId === 'alliance-formed');
    const names = announced.map(b => (b.text.match(/called <strong>([^<]+)<\/strong>/) || [])[1]);
    expect(new Set(names).size, 'the same alliance was announced twice').toBe(names.length);
    // Recruitment beats, when they happen, are a different event entirely.
    for (const b of beats.filter(x => x.eventId === 'alliance-recruited')) {
      expect(b.badgeText).toBe('BROUGHT IN');
      expect(b.text).not.toContain('for the first time');
    }
  });
});
