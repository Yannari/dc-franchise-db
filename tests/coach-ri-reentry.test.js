// ══════════════════════════════════════════════════════════════════════
// coach-ri-reentry.test.js — the return counts the coaches
// ══════════════════════════════════════════════════════════════════════
//
// Reported: "redemption island re-enters doesn't count the coaches".
//
// This is the merge bug again, one threshold over. `gs.activePlayers` means
// "competes and votes", and a coach does neither — but a coach is a person
// still in the game who becomes a full player the moment the merge fires, so
// the merge check adds `activeCoaches().length` and says so in a comment. The
// Rescue Island re-entry, written the same shape, never did: with four coaches
// a riReentryAt of 12 fired at a camp of sixteen.
//
// SEEDED, and that is not decoration. The first version of this test ran an
// unseeded season and PASSED against the bug — the return fires on the first
// night the count is low enough AND somebody is waiting on the island, and how
// those two line up moves with the dice. A fixed seed makes the failure real:
// checked by putting the old threshold back, and it fails.
import { describe, expect, it } from 'vitest';
import { runHeadlessSeason } from './helpers/coach-season.js';
import { seededRandom } from './helpers/rng.js';

const RE_AT = 12, COACHES_PER_TRIBE = 2, SEED = 20260920;

describe('Rescue Island re-entry with coaches on the season', () => {
  it('fires when contestants AND coaches reach the threshold, not contestants alone', async () => {
    const real = Math.random;
    Math.random = seededRandom(SEED);
    let season;
    try {
      season = await runHeadlessSeason({
        twist: 'coaches', coachesPerTribe: COACHES_PER_TRIBE, castSize: 18, mergeAt: 8,
        config: { ri: true, riFormat: 'rescue', riReentryAt: RE_AT, riReturnPoints: 1, riReturnPerEvent: 1 },
      });
    } finally { Math.random = real; }
    const { episodes, coachNames } = season;
    expect(coachNames.length).toBe(COACHES_PER_TRIBE * 2);

    const back = episodes.filter(e => e.isRIReentry);
    expect(back.length, 'nobody came back at all').toBeGreaterThan(0);

    // the night it fired had a FIELD of twelve or fewer — coaches included.
    // Counting contestants alone it fired while the coaches were still at camp,
    // so the field was twelve PLUS however many coaches the season has.
    expect(back[0].fieldAtStart).toBeLessThanOrEqual(RE_AT);
    // and not a moment early: the night before still had more than twelve in the game
    const prior = episodes[episodes.indexOf(back[0]) - 1];
    expect(prior?.fieldAtStart).toBeGreaterThan(RE_AT);
  }, 120000);
});
