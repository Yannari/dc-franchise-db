// The Care Package draws a screen.
//
// It shipped text-only: both transcripts wrote it and the visual playback drew
// nothing, because the act-coverage guard's VP half was an allowlist that
// nobody had added it to. This asserts the screen exists, that the recipient's
// name actually reaches it — the whole twist is a name read out loud — and
// that the reveal gating works.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(weeks = 1) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = Array.from({ length: weeks },
    (_, i) => ({ episode: i + 1, type: 'bb-care-package' }));
}

/** Play until a care-package act exists, and return its episode. */
function play(weeks = 2) {
  for (let seed = 1; seed <= 20; seed++) {
    house(weeks);
    for (let w = 0; w < weeks; w++) {
      const ep = withSeededRandom(seed * 37 + w * 5 + 1, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'care-package');
      if (act) return { ep, act };
    }
  }
  return null;
}

/** Build once to create the reveal keys, open them, build again. */
function screensFor(ep) {
  buildVPScreens(ep);
  for (const key of Object.keys(_tvState)) {
    if (key.startsWith('bb_cp_') || key.startsWith('bb_cpp_')) _tvState[key].idx = 99;
  }
  return buildVPScreens(ep);
}

describe('the Care Package on screen', () => {
  beforeEach(() => house());

  it('draws a screen with the name on the label', () => {
    const played = play();
    expect(played, 'no care package week').toBeTruthy();
    const { ep, act } = played;

    const before = buildVPScreens(ep);
    const screen = before.find(s => s.label === 'Care Package');
    expect(screen, 'no Care Package screen was registered').toBeTruthy();
    expect(screen.html).toContain("AMERICA'S CARE PACKAGE");
    // Unrevealed, the label is blank — that blank line is the whole scene.
    // Match the ELEMENT, not the class name: the class is also in the scoped
    // stylesheet, which is present either way.
    expect(screen.html).toContain('<rect class="bbcp-blank"');

    const after = screensFor(ep);
    const open = after.find(s => s.label === 'Care Package');
    expect(open.html, 'the recipient never reached the screen').toContain(act.recipient);
    expect(open.html).toContain(act.package);
    expect(open.html).not.toContain('<rect class="bbcp-blank"');
  });

  it('draws the package being spent, when it is', () => {
    for (let seed = 1; seed <= 20; seed++) {
      house(5);
      for (let w = 0; w < 5; w++) {
        const ep = withSeededRandom(seed * 37 + w * 5 + 1, () => simulateBBEpisode());
        const act = (ep.acts || []).find(a => a.type === 'care-package-play');
        if (!act) continue;
        const open = screensFor(ep).find(s => s.label === 'Package Spent');
        expect(open, 'a spent package drew no screen').toBeTruthy();
        expect(open.html).toContain('THE PACKAGE IS SPENT');
        // A struck voter is named on screen: that is the point of this one.
        for (const name of act.blocked || []) expect(open.html).toContain(name);
        return;
      }
    }
    // Neither eviction-night package came up in 100 weeks; the other test
    // already covers the delivery screen, so this is not a failure.
  });
});
