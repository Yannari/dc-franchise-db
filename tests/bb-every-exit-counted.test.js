// Every way out of the Big Brother house is counted everywhere.
//
// The user, 2026-10-29, after the White Locust's loser was erased: "nina wasnt in that jury house ... its like she
// was erased", "make sure white locust hoh is counted", "the season tape should show double eviction martin and nina",
// "nina is still in the game in the on-air page", then "make sure other bb twist dont make the same mistake happen".
//
// The loser of the chain left through a field (`week.resortEvicted`) that every reader written for `week.evicted`
// missed. This plays each twist that takes somebody out of the house some other way, then asks every reader that
// missed Nina about every houseguest who left: the weeks ledger, the season tape, the On Air standings, the export's
// placements, Kristal's interviews and the jury house. See docs/ADDING-A-SHOW.md §11.5.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// The premieres need a franchise returnee to bring in (bb/premiere-mystery.js mysteryHouseguestOf, the BB Swap's guest),
// and this cast has no past seasons: one of them is given a win, for those two cases only.
const mockCareer = vi.hoisted(() => ({ returnee: null }));
vi.mock('../js/franchise-meta.js', async orig => {
  const real = await orig();
  return { ...real, careerOf: n => n && n === mockCareer.returnee
    ? [{ where: 'Season 1', num: 1, format: 'big-brother', rec: { winner: true, finalist: true, placement: 1 }, total: 16 }]
    : real.careerOf(n) };
});
import { gs, players, seasonConfig, relationships, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { weekExits, seatedJurors } from '../js/bb/jury.js';
import { campers } from '../js/bb/camp-comeback.js';
import { getEpisodeEliminations } from '../js/run-ui.js';
import { extractLiveSeasonSnapshot, extractBigBrotherSeasonTemplate } from '../js/stats-export.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Dana', 'Omar'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'challenge-beast'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme: '' });
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
}
beforeEach(() => house());
afterEach(() => { setGs({ ...gs, bb: null }); seasonConfig.twistSchedule = []; });

/** Plays until the twist has taken somebody out and the season has gone one more week past it. */
function play(type, episode, seed) {
  seasonConfig.twistSchedule = [{ id: 't1', episode, type }];
  const snaps = [];
  withSeededRandom(seed, () => {
    for (let i = 0; i < 20; i++) {
      if (!simulateBBEpisode()) break;
      // the On Air standings as the site would get them that night
      try { snaps.push(extractLiveSeasonSnapshot()); } catch { /* the finale row */ }
      if (gs.bb?.over || gs.phase === 'complete' || (gs.activePlayers || []).length <= 3) break;
    }
  });
  return snaps;
}

const goneFor = () => [...new Set(gs.eliminated || [])]
  .filter(n => !(gs.activePlayers || []).includes(n) && !campers().includes(n));

// [twist, episode, did it take somebody out its own way?]: a seed where it did not is no test of it
const how = h => () => (gs.bb?.weeks || []).some(w => w.resortEvicted && (w.acts || []).some(a => a?.type === h));
// what the engine wrote, not what the readers make of it: a reader that drops the premiere exit must fail below, not here
const premiere = () => (gs.bb?.weeks || []).some(w => w.premiereEvicted);
const many = () => (gs.episodeHistory || []).some(r => (getEpisodeEliminations(r) || []).length >= 2);
const CASES = [
  ['bb-white-locust', 6, how('white-locust')], ['bb-camp-director', 1, how('camp-director')],
  ['bb-double-eviction', 6, many], ['bb-triple-eviction', 5, many], ['bb-instant-eviction', 6, () => true],
  ['bb-split-house', 5, many], ['bb-temptation-premiere', 1, premiere], ['bb-premiere-mystery', 1, premiere],
  ['bb-camp-comeback', 3, () => true], ['bb-battle-back', 4, () => true],
];

describe('every way out of the house is counted everywhere', () => {
  for (const [type, episode, fired] of CASES) {
    it(`${type}: the ledger, the tape, On Air, the placements, Kristal and the jury house`, () => {
      let snaps = [];
      for (const seed of [4242, 11, 23, 37, 51, 77, 91, 103, 131, 157]) {
        house();
        mockCareer.returnee = /premiere/.test(type) ? 'Omar' : null;
        snaps = play(type, episode, seed);
        if (fired()) break;
      }
      expect(fired(), `${type} never took anybody out in ten seeds`).toBe(true);
      const gone = goneFor();
      expect(gone.length, 'nobody left').toBeGreaterThan(0);
      const weeks = gs.bb.weeks || [];
      const ledger = new Set(weeks.flatMap(w => weekExits(w).map(x => x.name)));
      const tape = new Set((gs.episodeHistory || []).flatMap(r => getEpisodeEliminations(r) || []));
      const doc = extractBigBrotherSeasonTemplate(weeks, [...gs.activePlayers], { jurySize: 7 });
      const placed = new Map(doc.placements.map(p => [p.name, p.placement]));
      const interviewed = new Set((gs.exitInterviews || []).map(r => r.guest));
      const live = snaps[snaps.length - 1];
      const jury = seatedJurors();
      const inJuryHouse = new Set(weeks.flatMap(w => (w.acts || []).filter(a => a?.type === 'jury-house')
        .flatMap(a => a.residents || [])));
      const missing = [];
      for (const n of gone) {
        if (!ledger.has(n)) missing.push(`${n}: not in the weeks ledger (bb/jury.js weekExits)`);
        if (!tape.has(n)) missing.push(`${n}: not on the season tape (run-ui.js getEpisodeEliminations)`);
        if (!placed.has(n)) missing.push(`${n}: no placement in the export`);
        if (!interviewed.has(n)) missing.push(`${n}: no Kristal exit interview`);
        const row = live?.players?.find(p => p.name === n);
        if (row && row.status === 'in') missing.push(`${n}: still "in" on the On Air standings`);
        if (jury.includes(n) && row && row.status !== 'jury') missing.push(`${n}: a juror the On Air page calls "${row.status}"`);
        // the jury house has met since they left (a juror who left the final week has not been there yet)
        const exitWeek = weeks.find(w => weekExits(w).some(x => x.name === n));
        const metSince = weeks.some(w => Number(w.num) >= Number(exitWeek?.num) && (w.acts || []).some(a => a?.type === 'jury-house'));
        if (jury.includes(n) && metSince && !inJuryHouse.has(n)) missing.push(`${n}: a juror the jury house never had`);
      }
      const places = [...placed.values()];
      expect(new Set(places).size, 'two houseguests share a placement').toBe(places.length);
      expect(missing, missing.join('\n')).toEqual([]);
    });
  }
});
