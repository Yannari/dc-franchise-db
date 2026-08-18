// The two writers that are not HTML.
//
// Event text is authored for the viewing party, which renders markup — a few
// events bold an alliance or a name. `summariseWeek` and the text backlog are
// read in a terminal, and both printed that text straight through, so a real
// transcript said "They name the alliance <strong>The Movement</strong>".
//
// Found by reading a backlog end to end. Neither of these is reachable by
// eyeballing the events, because the markup is CORRECT where it is written.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, plainText } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [];
}

describe('plainText', () => {
  it('takes the markup out and leaves the sentence', () => {
    expect(plainText('They name the alliance <strong>The Movement</strong>, and leave.'))
      .toBe('They name the alliance The Movement, and leave.');
    expect(plainText('One line.<br/>Next line.')).toBe('One line. Next line.');
    expect(plainText(null)).toBe('');
    expect(plainText('nothing to do here')).toBe('nothing to do here');
  });
});

describe('the plain-text transcripts', () => {
  beforeEach(house);

  it('never print a tag, across a run of real weeks', () => {
    let checked = 0;
    for (let seed = 1; seed <= 6; seed++) {
      house();
      for (let ep = 0; ep < 4; ep++) {
        let e;
        try { e = withSeededRandom(seed * 97 + ep * 13, () => simulateBBEpisode()); }
        catch { break; }
        if (!e) break;
        const week = gs.bb.weeks[gs.bb.weeks.length - 1];
        for (const [label, text] of [
          ['summariseWeek', summariseWeek(week)],
          ['generateSummaryText', generateSummaryText(e)],
        ]) {
          checked++;
          const tag = text.match(/<\/?[a-z][^>]*>/i);
          expect(tag, `${label} printed markup: ${tag && tag[0]}`).toBeNull();
        }
      }
    }
    expect(checked, 'no transcripts were produced at all').toBeGreaterThan(10);
  });

  it('never claims a history the season has not had yet', () => {
    // The chair line said "it has been X's chair for three weeks" and was in
    // the pool from week one. Any line claiming elapsed weeks has to be gated
    // on them having elapsed.
    for (let seed = 1; seed <= 30; seed++) {
      house();
      let e;
      try { e = withSeededRandom(seed * 41 + 7, () => simulateBBEpisode()); } catch { continue; }
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      if ((week?.num || 1) > 1) continue;                 // only week one is the bug
      const text = summariseWeek(week) + '\n' + generateSummaryText(e);
      expect(text, 'week one claimed weeks of history')
        .not.toMatch(/for (two|three|four|five) weeks/i);
      expect(text).not.toMatch(/since the first week/i);
    }
  });
});
