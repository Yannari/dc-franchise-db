// Alliances are the core of this format, and the house had a thinner version
// of them than Total Drama did. Checked against the wiki's own account of how
// they work rather than assumptions:
//
//   "Alliances often create nested sub-alliances and final deals... a final 3
//    alliance with Xavier, Derek F and Kyland, a final 3 alliance with Kyland,
//    Tiffany and Hannah, and a final 2 alliance of Tiffany and Hannah."
//
//   "Many times, members of an alliance will defect... Despite initially being
//    in the majority, the alliance soon found itself in the minority after
//    Kaitlyn flipped her vote at the first eviction."
//
// Both of those were impossible here: alreadyPaired refused to let two allies
// form anything else, and every defection dissolved the alliance outright.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks',
  'Emmah','Millie','Caleb','Wayne','Raj','Julia','Priya','MK','Damien'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][i % 7] }));

function playSeasons(n) {
  const stat = { nested: 0, total: 0, betrayals: 0, outcomes: {}, approaches: {},
                 maxLive: 0, maxPerPlayer: 0 };
  for (let s = 0; s < n; s++) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9, twistSchedule: [],
      bbSafetyMode: 'off', bbHaveNots: 'twist', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
    gs.allianceRepairHistory = [];
    let g = 0;
    while (!houseIsAtFinale() && g++ < 30) {
      if (!simulateBBEpisode()) break;
      // Sampled DURING the season: at the end the house is three people and
      // almost everything has collapsed for want of members.
      const live = (gs.namedAlliances || []).filter(a => a.active !== false);
      stat.maxLive = Math.max(stat.maxLive, live.length);
      for (const name of gs.activePlayers || []) {
        stat.maxPerPlayer = Math.max(stat.maxPerPlayer,
          live.filter(a => (a.members || []).includes(name)).length);
      }
    }
    for (const a of gs.namedAlliances || []) { stat.total++; if (a.parent) stat.nested++; }
    for (const w of gs.bb.weeks || []) {
      for (const inc of w.allianceChanges?.betrayals || []) {
        stat.betrayals++;
        if (!inc.repair) continue;
        stat.outcomes[inc.repair.outcome] = (stat.outcomes[inc.repair.outcome] || 0) + 1;
        stat.approaches[inc.repair.approach] = (stat.approaches[inc.repair.approach] || 0) + 1;
      }
    }
  }
  return stat;
}

describe('alliance depth in the house', () => {
  const stat = playSeasons(4);

  it('builds a web, not a pair of duos', () => {
    // A house runs several overlapping alliances at once and people sit in
    // more than one of them.
    expect(stat.maxLive, 'the house never held more than a couple of alliances').toBeGreaterThanOrEqual(4);
    expect(stat.maxPerPlayer, 'nobody was ever in more than a couple').toBeGreaterThanOrEqual(3);
  });

  it('forms alliances inside alliances', () => {
    expect(stat.total).toBeGreaterThan(10);
    expect(stat.nested, 'no sub-alliance ever formed').toBeGreaterThan(0);
    // Nested, but not so common that every group instantly splinters.
    expect(stat.nested / stat.total).toBeLessThan(0.75);
  });

  it('lets an alliance survive a defection, or not', () => {
    expect(stat.betrayals).toBeGreaterThan(0);
    const kinds = Object.keys(stat.outcomes);
    expect(kinds.length, 'every betrayal resolved the same way').toBeGreaterThan(1);
    const survived = (stat.outcomes.forgiven || 0) + (stat.outcomes['working-truce'] || 0);
    const ended = (stat.outcomes.fracture || 0) + (stat.outcomes.rejected || 0);
    expect(survived, 'no alliance ever survived a betrayal').toBeGreaterThan(0);
    expect(ended, 'every betrayal was forgiven').toBeGreaterThan(0);
  });

  it('explains a defection differently depending on who did it', () => {
    // Approach comes from loyalty, temperament, strategic and boldness, so a
    // house of mixed archetypes should produce more than one excuse.
    expect(Object.keys(stat.approaches).length).toBeGreaterThan(2);
  });
});

// A consequence nobody can see is indistinguishable from no consequence.
// Betrayals, repair attempts and collapses all moved bonds, memories and trust
// and never appeared on screen once, so an alliance could vanish between weeks
// with nothing anywhere explaining it.
describe('every alliance transition is visible', () => {
  it('puts a beat on screen for each one', () => {
    const seen = new Set();
    for (let s = 0; s < 3 && seen.size < 5; s++) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond, romanticCompat });
      Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9, twistSchedule: [],
        bbSafetyMode: 'off', bbHaveNots: 'twist', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
      gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
      gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
      gs.allianceRepairHistory = [];
      let g = 0;
      while (!houseIsAtFinale() && g++ < 30) { if (!simulateBBEpisode()) break; }
      for (const w of gs.bb.weeks || []) {
        for (const act of w.acts || []) {
          for (const b of act.socialBeats || []) {
            if (String(b.eventId || '').startsWith('alliance-')) seen.add(b.eventId);
          }
        }
      }
    }
    for (const id of ['alliance-formed', 'alliance-recruited', 'alliance-betrayal',
                      'alliance-repair', 'alliance-collapsed']) {
      expect(seen, `${id} never reaches the screen`).toContain(id);
    }
  });

  it('gives an alliance a name, not a row number', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9, twistSchedule: [],
      bbSafetyMode: 'off', bbHaveNots: 'twist', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
    let g = 0;
    while (!houseIsAtFinale() && g++ < 12) { if (!simulateBBEpisode()) break; }
    const names = (gs.namedAlliances || []).map(a => a.name);
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) expect(n, 'still numbering alliances').not.toMatch(/^BB Alliance \d+$/);
  });
});
