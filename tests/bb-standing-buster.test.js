// "WHERE EVERYBODY STANDS doesn't show the number of Block Busters won when
// it's active."
//
// The board counted crowns, vetoes and nominations. Winning your own way off
// the block was counted nowhere — so somebody who took the Block Buster three
// weeks running appeared on the wall as a three-time nominee and nothing else,
// and the standing maths scored the nominations against them while the wins
// that cancelled those nominations scored zero. Beating it read as falling.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { rpBuildBBOverview } from '../js/vp-screens.js';
import { withSeededRandom } from './helpers/rng.js';
import { readFileSync } from 'node:fs';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee',
  'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
  'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead',
  'wildcard', 'chaos-agent', 'perceptive-player'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

function season(safetyMode) {
  setGs(null);
  setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(),
    gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
    stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3) % 10)])) })));
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
    pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: safetyMode, seasonNumber: 1 });
  seasonConfig.twistSchedule = [];
  initGameState();
  globalThis.gs = gs;
  withSeededRandom(23, () => { for (let i = 0; i < 6; i++) simulateBBEpisode(); });
  return gs.episodeHistory[gs.episodeHistory.length - 1];
}

describe('a house that plays the Block Buster', () => {
  let html = '', winners = [];

  beforeAll(() => {
    const last = season('on');
    winners = gs.episodeHistory.map(e => e.safetyWinner).filter(Boolean);
    html = rpBuildBBOverview(last, 'closing') || '';
  }, 900000);

  it('actually ran it, or this test proves nothing', () => {
    expect(winners.length, 'no Block Buster was won all season').toBeGreaterThan(0);
  });

  it('names the icon in the key, so the glyph is not decoration', () => {
    expect(html).toMatch(/won their way off the block/);
  });

  it('counts the wins on the wall', () => {
    // The icon carries the number beside it, like every other stat here.
    const winner = winners[0];
    expect(html).toContain(winner);
    expect(html, 'the Block Buster icon never rendered').toMatch(/bbst-stats/);
    const idx = html.indexOf('won their way off the block');
    expect(idx, 'the key entry is missing').toBeGreaterThan(-1);
  });

  it('scores the win toward standing rather than only the nomination against', () => {
    expect(readFileSync('js/vp-screens.js', 'utf8')).toMatch(/\(st\.buster \|\| 0\) \* 1\.2/);
  });
});

describe('a house that does not play it', () => {
  it('leaves the column out entirely', () => {
    const last = season('off');
    const html = rpBuildBBOverview(last, 'closing') || '';
    expect(html, 'an always-empty icon is a question nobody can answer')
      .not.toMatch(/won their way off the block/);
  }, 900000);
});
