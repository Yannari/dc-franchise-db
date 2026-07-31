// The status screen has to be a picture of a moment, not of the week's end.
//
// It read ep.gsSnapshot — taken after everything — no matter where it sat, so
// the copy at the TOP of an episode listed alliances nobody had formed yet,
// targets nobody had set and bonds nothing had moved. Week one opened by
// spoiling week one.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { rpBuildBBOverview, buildBBWeekScreens, getTribeRelationshipHighlights } from '../js/vp-screens.js';
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

const countIn = (html, label) => {
  const i = html.indexOf(label);
  if (i < 0) return null;
  const m = html.slice(i, i + 60).match(/\((\d+)\)/);
  return m ? Number(m[1]) : null;
};

describe('house status respects the chronology', () => {
  it('does not spoil week one before week one has happened', () => {
    reset();
    const ep = simulateBBEpisode();
    const before = rpBuildBBOverview(ep, 'opening');
    // Nothing has happened yet: no alliance, nobody hunting, nobody misreading.
    expect(countIn(before, 'ALLIANCES'), 'alliances shown before any formed').toBe(0);
    expect(countIn(before, 'WHO IS COMING FOR WHOM'), 'targets shown before any set').toBe(0);
    expect(countIn(before, 'WHAT PEOPLE BELIEVE'), 'misreads shown before any formed').toBe(0);
    expect(before).toContain('Before anything happens');
  });

  it('shows the real state once the week has played', () => {
    reset();
    const ep = simulateBBEpisode();
    const after = rpBuildBBOverview(ep, 'closing');
    expect(after).toContain('After everything that happened');
    // The week produced targets, so the closing picture has to carry them.
    const hunts = countIn(after, 'WHO IS COMING FOR WHOM');
    expect(hunts, 'a played week set no targets at all').toBeGreaterThan(0);
  });

  it('puts one at the top of the episode and one at the end', () => {
    reset();
    const ids = buildBBWeekScreens(simulateBBEpisode()).map(s => s.id);
    const before = ids.indexOf('bb-overview');
    const after = ids.indexOf('bb-overview-after');
    expect(before).toBeGreaterThanOrEqual(0);
    expect(after).toBeGreaterThan(before);
    // The opening one comes before any house life; the closing one after the vote.
    const firstHouse = ids.findIndex(id => id.startsWith('bb-house'));
    const eviction = ids.indexOf('bb-evict');
    expect(before).toBeLessThan(firstHouse);
    expect(after).toBeGreaterThan(eviction);
  });

  it('moves between the two, week over week', () => {
    reset();
    let ep = null, guard = 0;
    while (!houseIsAtFinale() && guard++ < 3) { const e = simulateBBEpisode(); if (!e) break; ep = e; }
    const before = rpBuildBBOverview(ep, 'opening');
    const after = rpBuildBBOverview(ep, 'closing');
    // A week that changed nothing at all would mean the snapshots are the same
    // object rather than two moments.
    expect(before).not.toBe(after);
  });
});
