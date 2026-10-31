// The prime is live (the user, 2026-10-28: "there's no confessional during the prime unless they're talking with
// Josh from the house"). On a live screen, a confessional line is a live call that Josh opens, or a launch-night
// portrait; only the magnetos (recorded packages) and house life after the prime keep plain confessionals.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { ssPartOf } from '../js/vp-bb-ep/ss-episode.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Duncan', 'Gwen'];
// (a tape before a prime moment is recorded too: vp-bb-ep/ss-context-tapes.js)
const RECORDED = /^bb-ss-prime-(mag-|package|tape-)|^bb-hl|^bb-ss-(previously|tonight)/;
describe('the live prime', () => {
  it('has no plain confessional: Josh calls each one live, and the launch portraits say what they are', () => {
    const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 4, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSecretRoom: undefined, ssSignature: undefined });
    withSeededRandom(701, () => { for (let i = 0; i < 3; i++) simulateBBEpisode(); });
    let live = 0;
    for (const r of gs.episodeHistory) for (const sc of bbWeekSteps(r, { host: 'Josh' })) {
      if (ssPartOf(sc) === 'daily' || RECORDED.test(String(sc.id))) continue;
      sc.steps.forEach((st, i) => {
        if (st.k !== 'dr') return;
        expect(st.live || st.clip, `${sc.id}: ${st.by}: ${st.t}`).toBeTruthy();
        if (st.live) {
          live++;
          // the call is opened by Josh, just before this answer or the same housemate's earlier answer
          const prev = sc.steps.slice(0, i).reverse().find(x => x.k !== 'dr' || x.by !== st.by);
          expect(prev?.k, `${sc.id}: nobody called ${st.by}`).toBe('host');
        }
      });
    }
    expect(live).toBeGreaterThan(0);
  });
});
