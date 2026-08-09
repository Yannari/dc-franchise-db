// The Duos twist, on screen.
//
// A SEPARATE FILE FROM THE MECHANICS ON PURPOSE. The mechanics tests pass
// whether or not anything is ever drawn — and that is exactly how the Twin
// Twist shipped with ten changeovers a season and nothing visible anywhere,
// because its swap was passed to a screen that never rendered it.
//
// So this plays a real season with the twist on and asserts that the acts it
// produces reach `buildVPScreens` and come back as HTML with the right words in
// it. Every assertion is on rendered output rather than on the act.
import { beforeAll, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

let screensByLabel = new Map();
let acts = [];

beforeAll(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.jury = [];
  gs.popularity = {};
  Object.assign(seasonConfig, {
    format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbDuos: 'on', bbDuosKeyAt: 10,
  });

  withSeededRandom(5, () => {
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
  });

  acts = (gs.bb.weeks || []).flatMap(w => w.acts || []).filter(Boolean);

  // Render every episode the season produced and index the screens by label.
  for (const [i, ep] of (gs.episodeHistory || []).entries()) {
    let built = [];
    try { built = buildVPScreens(ep, i + 1) || []; } catch { built = []; }
    for (const sc of built) {
      if (!sc?.label) continue;
      if (!screensByLabel.has(sc.label)) screensByLabel.set(sc.label, []);
      screensByLabel.get(sc.label).push(sc);
    }
  }
});

const screensFor = label => screensByLabel.get(label) || [];

describe('the season produced the acts', () => {
  it('paired the house and announced it', () => {
    expect(acts.filter(a => a.type === 'duos-open').length).toBe(1);
  });

  it('handed out at least one key', () => {
    expect(acts.filter(a => a.type === 'duos-key').length).toBeGreaterThan(0);
  });
});

describe('and every one of them reached a screen', () => {
  it('draws the pairing, with the pairs on it', () => {
    const [screen] = screensFor('Duos: Announcement');
    expect(screen, 'the announcement never became a screen').toBeTruthy();
    expect(screen.html).toContain('DYNAMIC DUOS');
    // The pairs themselves, not just the heading.
    const open = acts.find(a => a.type === 'duos-open');
    for (const [a, b] of open.pairs.slice(0, 3)) {
      expect(screen.html, `the pair ${a} & ${b} is missing`).toContain(a);
      expect(screen.html).toContain(b);
    }
  });

  it('draws the key, naming the holder and the partner who went', () => {
    const list = screensFor('Duos: Golden Key');
    expect(list.length, 'a key was handed out and never drawn').toBeGreaterThan(0);
    const key = acts.find(a => a.type === 'duos-key');
    const html = list.map(s => s.html).join('');
    expect(html).toContain('GOLDEN KEY');
    expect(html).toContain(key.holder);
    expect(html).toContain(key.partner);
  });

  it('says what the key costs, not only what it gives', () => {
    // Safety is the obvious half. "Competing for nothing at all until then" is
    // the half that makes it a decision rather than a gift.
    const html = screensFor('Duos: Golden Key').map(s => s.html).join('');
    expect(html).toMatch(/competing for nothing/i);
  });
});
