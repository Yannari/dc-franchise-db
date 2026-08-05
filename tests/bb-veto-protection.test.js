// Winning the veto, or being saved by it, protects you for the WEEK.
//
// Found by playing a season in the browser rather than by any test: a
// houseguest was nominated, won the Power of Veto, used it on himself — and a
// secret Diamond Power of Veto then seated him straight back onto the block on
// eviction night and the house voted him out.
//
// Two rules broken in one ceremony. The ordinary replacement path had always
// protected both people; the secret detonation path built its own protection
// list and was missing them, and `save` inside that path means the DIAMOND's
// save, which is a different person from the veto's.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists;
}

describe('the veto protects for the week', () => {
  beforeEach(() => house());

  it('never lets any path seat the veto winner or the houseguest it saved', () => {
    // Pandora's Box is the secret-Diamond route, which is where the hole was.
    let detonations = 0;
    let vetoWeeks = 0;
    for (let seed = 1; seed <= 14; seed++) {
      house([{ episode: 2, type: 'bb-pandoras-box' }, { episode: 3, type: 'bb-pandoras-box' },
        { episode: 4, type: 'bb-pandoras-box' }, { episode: 5, type: 'bb-diamond-veto' }]);
      for (let w = 0; w < 6; w++) {
        const ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode());
        if (!ep) break;
        const week = gs.bb.weeks[gs.bb.weeks.length - 1];
        if (!week) continue;
        const final = week.finalNominees || [];
        if (week.vetoWinner) {
          vetoWeeks++;
          // The winner is never on the final block, and is never the evictee.
          expect(final, `${week.vetoWinner} won the veto and sat on the final block`)
            .not.toContain(week.vetoWinner);
          expect(week.evicted, `${week.vetoWinner} won the veto and was evicted`)
            .not.toBe(week.vetoWinner);
        }
        // And whoever the veto took off the block stays off it.
        if (week.vetoDecision?.use && week.vetoDecision.save) {
          const saved = week.vetoDecision.save;
          expect(final, `${saved} was saved by the veto and was seated again`)
            .not.toContain(saved);
          expect(week.evicted, `${saved} was saved by the veto and was evicted`)
            .not.toBe(saved);
        }
        if (week.diamondDetonation) detonations++;
      }
    }
    expect(vetoWeeks, 'no veto weeks were played at all').toBeGreaterThan(20);
    // The hole was specifically on the detonation path, so the sample has to
    // actually contain some.
    expect(detonations, 'no secret diamond ever detonated — the hole is untested')
      .toBeGreaterThan(0);
  }, 120000);
});
