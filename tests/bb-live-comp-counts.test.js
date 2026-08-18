// A Big Brother houseguest's competitions, counted in Big Brother's words.
//
// Reported from a live page: a houseguest with 3 HOHs, 4 vetoes and 3 Block
// Busters was shown as having won THREE competitions.
//
// The live snapshot built every player from `_extractChallengeData`, which
// counts `ep.immunityWinner` and `ep.rewardChalData` — Total Drama's fields. A
// Big Brother week records its wins on `gs.bb.stats`, and the only one of those
// that also lands on `ep.immunityWinner` is the crown. So the number shown was
// her HOH count wearing the word "challenges", and the two categories she won
// most were not counted at all. Measured on one ten-episode season: 10 veto
// wins and 10 Block Buster wins, all invisible.
//
// This is the bug class CLAUDE.md names first: one show's vocabulary printed
// over the other.
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gs, players, seasonConfig, relationships, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { extractLiveSeasonSnapshot } from '../js/stats-export.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Ryan', 'Will', 'Eva', 'Arlo'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'challenge-beast', 'perceptive-player', 'chaos-agent', 'schemer'];
const CAST = NAMES.map((n, i) => ({
  name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function playBB(seed, episodes = 10) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'twist', bbSafetyMode: 'triple', bbSafetyStopsAt: 5, theme: '' });
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
  withSeededRandom(seed, () => {
    for (let i = 0; i < episodes; i++) {
      if (!simulateBBEpisode()) break;
      if (gs.bb?.over) break;
    }
  });
}

describe('the live snapshot speaks the right show', () => {
  beforeEach(() => playBB(313));

  it('agrees with the engine ledger on every houseguest', () => {
    const snap = extractLiveSeasonSnapshot();
    expect(snap.format).toBe('big-brother');
    for (const p of snap.players) {
      const st = gs.bb.stats[p.name] || {};
      expect(p.comps, `${p.name} has no competition breakdown`).toBeTruthy();
      expect(p.comps.hoh, `${p.name} HOH`).toBe(st.hohWins || 0);
      expect(p.comps.veto, `${p.name} veto`).toBe(st.vetoWins || 0);
      expect(p.comps.blockBuster, `${p.name} Block Buster`).toBe(st.blockBusterWins || 0);
      expect(p.timesNominated, `${p.name} nominations`).toBe(st.timesNominated || 0);
    }
  });

  it('counts the two categories that were being dropped', () => {
    const snap = extractLiveSeasonSnapshot();
    const veto = snap.players.reduce((t, p) => t + p.comps.veto, 0);
    const arena = snap.players.reduce((t, p) => t + p.comps.blockBuster, 0);
    // Both were structurally zero before: nothing here read gs.bb.stats.
    expect(veto, 'no veto wins in a whole season').toBeGreaterThan(0);
    expect(arena, 'no Block Buster wins in a season with the arena on').toBeGreaterThan(0);
  });

  it('keeps challengeWins meaning what it means everywhere else', () => {
    // The finished export decided deliberately, and says so in a comment, that
    // challengeWins is HOH + veto and the arena is a separate additional
    // number. One field must not mean two things depending on whether the
    // season has ended, so the live payload matches it and the PAGE sums the
    // parts for its headline.
    const snap = extractLiveSeasonSnapshot();
    for (const p of snap.players) {
      const st = gs.bb.stats[p.name] || {};
      expect(p.challengeWins).toBe((st.hohWins || 0) + (st.vetoWins || 0));
    }
  });

  it('does not put Total Drama fields on a Big Brother player', () => {
    const snap = extractLiveSeasonSnapshot();
    for (const p of snap.players) {
      expect(p, `${p.name} carries immunityWins on a Big Brother season`)
        .not.toHaveProperty('immunityWins');
      expect(p).not.toHaveProperty('rewardWins');
    }
  });
});

describe('a Total Drama season is unchanged', () => {
  it('still reports immunity and reward, and grows no comps block', () => {
    // The fix must not have taught the snapshot to speak only the new show.
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(seasonConfig, { format: 'total-drama' });
    setGs({ ...gs, bb: null, episodeHistory: [{ num: 1, immunityWinner: 'Bowie' }] });
    const snap = extractLiveSeasonSnapshot();
    expect(snap.format).not.toBe('big-brother');
    for (const p of snap.players) {
      expect(p).toHaveProperty('immunityWins');
      expect(p).not.toHaveProperty('comps');
    }
  });
});

describe('the page shows the total a viewer means', () => {
  const page = readFileSync(resolve(process.cwd(), 'player.html'), 'utf8');
  const cells = page.slice(page.indexOf('function _liveStatCells'),
    page.indexOf('function renderLiveStatus'));

  it('sums the three competitions for the headline', () => {
    expect(cells.length, '_liveStatCells is missing').toBeGreaterThan(200);
    expect(cells, 'the headline is read off the payload instead of summed')
      .toMatch(/c\.hoh \|\| 0\) \+ \(c\.veto \|\| 0\) \+ \(c\.blockBuster \|\| 0\)/);
    for (const label of ['HOH', 'Veto', 'Block Buster', 'Comp wins']) {
      expect(cells, `no ${label} cell`).toContain(`'${label}'`);
    }
  });

  it('still labels a Total Drama season in Total Drama words', () => {
    expect(cells).toContain("'Immunity'");
    expect(cells).toContain("'Reward'");
  });
});

describe('the finished export carries the arena too', () => {
  const src = readFileSync(resolve(process.cwd(), 'js/stats-export.js'), 'utf8');

  it('includes it in the season template, not only in the merge', () => {
    // _bbStats has tracked blockBusterWins all along; the season TEMPLATE
    // dropped it, so the document handed to the story writer said a houseguest
    // who won their way off the block four times had won nothing. The two
    // export paths disagreed about the same season.
    // Bounded by the NEXT function, found by its opening paren: plain
    // 'mergeBigBrotherSeason' also matches mergeBigBrotherSeasonsDatabase,
    // which sits earlier in the file and yields an empty slice.
    const from = src.indexOf('function extractBigBrotherSeasonTemplate');
    const tpl = src.slice(from, src.indexOf('export function mergeBigBrotherSeason(', from));
    expect(tpl.length, 'could not locate the season template').toBeGreaterThan(200);
    expect(tpl, 'the season template still drops the Block Buster')
      .toMatch(/blockBusterWins:/);
  });
});
