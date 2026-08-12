// "Can someone who took themselves off with the veto be put back up by someone
// who saved themselves at the mystery veto ceremony?"
//
// No. A veto save is safety for the WEEK, and a second veto ceremony does not
// reopen it. But the mystery veto's replacement list held the Head of
// Household, the mystery holder, whoever it had just taken down, the current
// block and the season's standing protections — and not the person the FIRST
// veto had saved. They were not in `nominees` either, because the first
// ceremony replaced them there. So they were eligible to be put straight back
// into a chair they had already won their way out of, in the same week.
//
// Checked as an invariant rather than by reconstructing the scenario: whatever
// route a week takes, somebody the veto saved must not be facing the vote.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { withSeededRandom } from './helpers/rng.js';
import { readFileSync } from 'node:fs';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee',
  'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
  'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead',
  'wildcard', 'chaos-agent', 'perceptive-player'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

/** Every week played across a spread of seeds, with the power twists running. */
const weeks = [];
let mysteryVetoWeeks = 0;

beforeAll(() => {
  for (const seed of [3, 7, 11, 17, 23, 29, 41, 53]) {
    setGs(null);
    setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(),
      gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
      stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3 + seed) % 10)])) })));
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
      pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
      bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
    // The twists that put a second veto in the house.
    seasonConfig.twistSchedule = [
      { episode: 2, type: 'bb-secret-power-comp' },
      { episode: 4, type: 'bb-secret-power-comp' },
      { episode: 6, type: 'bb-den-of-temptation' },
    ];
    initGameState();
    globalThis.gs = gs;
    withSeededRandom(seed, () => { for (let i = 0; i < 9; i++) simulateBBEpisode(); });
    for (const w of gs.bb.weeks) {
      weeks.push({ seed, week: w });
      if (w.mysteryVeto || w.mysteryVetoSaved) mysteryVetoWeeks++;
    }
  }
}, 900000);

/** Who the first veto took down, from the week's own record. */
const savedByVeto = w => (w.vetoUsed
  ? ((w.vetoSavedAll || []).length ? w.vetoSavedAll : [w.vetoSaved].filter(Boolean))
  : []);

describe('a veto save is safety for the week', () => {
  it('played enough weeks to be worth asserting on', () => {
    expect(weeks.length).toBeGreaterThan(50);
    expect(weeks.filter(x => savedByVeto(x.week).length).length,
      'no veto was ever used, so this proves nothing').toBeGreaterThan(5);
  });

  it('never puts somebody the veto saved back on the final block', () => {
    for (const { seed, week } of weeks) {
      for (const name of savedByVeto(week)) {
        expect((week.finalNominees || []),
          `season ${seed} week ${week.num}: ${name} came off the block and was put back on it`)
          .not.toContain(name);
      }
    }
  });

  it('never evicts somebody the veto saved that week', () => {
    // The consequence the rule exists to prevent, stated separately because a
    // route that reached it without touching finalNominees would still be wrong.
    for (const { seed, week } of weeks) {
      for (const name of savedByVeto(week)) {
        expect(week.evicted,
          `season ${seed} week ${week.num}: ${name} was saved and evicted in the same week`)
          .not.toBe(name);
      }
    }
  });

  it('holds on the weeks a second veto actually appeared', () => {
    // If the mystery veto never fired in this sample the assertions above are
    // true for a reason that has nothing to do with the fix.
    expect(mysteryVetoWeeks, 'no mystery veto ran, so the hole was never exercised')
      .toBeGreaterThan(0);
  });
});

describe('the protection is written down where the second ceremony reads it', () => {
  it('adds the first veto save to the mystery veto replacement list', () => {
    const src = readFileSync('js/bb/week.js', 'utf8');
    expect(src).toMatch(/const savedByFirstVeto = week\.vetoUsed/);
    expect(src).toMatch(/\.\.\.savedByFirstVeto, \.\.\.untouchable/);
  });

  it('reads the record rather than the ceremony local, so a duos pair is covered', () => {
    // A duos veto takes a whole pair down. Reading the single announced name
    // would protect one of them and leave the other renominable.
    const src = readFileSync('js/bb/week.js', 'utf8');
    expect(src).toMatch(/\(week\.vetoSavedAll \|\| \[\]\)\.length \? week\.vetoSavedAll/);
  });
});
