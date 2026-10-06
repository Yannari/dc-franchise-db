// The opening titles and the closing (js/vp-bb-ep/titles.js, rendered by tools/bb-intro):
// every episode of the stepped viewer opens on the season's titles and closes on its
// closing, both carry their own music (so the screen asks for no bed), both can be skipped,
// a season with no render falls back to the generic pair, and every file is really there.
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbStepScreens } from '../js/vp-bb-ep/screens.js';
import { titleScreen } from '../js/vp-bb-ep/titles.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

describe('the opening titles and the closing', () => {
  it('open and close every episode, for this season', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
    const ep = JSON.parse(JSON.stringify(withSeededRandom(4242, () => simulateBBEpisode())));
    const out = bbStepScreens(ep, [], { host: 'Valeria' });
    expect(out[0].id).toBe('bb-titles');
    expect(out.at(-1).id).toBe('bb-closing');
    // this cast is not the one bb-1's render shows, so the titles are live, with these people
    // in them (the user, 2026-10-06: "the opening titles don't update with the houseguests")
    expect(out[0].html).toContain('class="bbt live"');
    for (const p of CAST) expect(out[0].html, p.name).toContain(p.name.replace(/&/g, '&amp;'));
    expect(out[0].html).not.toContain('bb-1-intro.mp4');
  });

  it('play the rendered titles only for the cast they were rendered with', () => {
    const made = ['Aaron', 'Amberly', 'Dylon', 'Felipe', 'Gyselle', 'Harriett', 'Hasan', 'Ireland', 'Jane', 'Joel', 'Jules', 'Misha', 'Natasha', 'Nico', 'Stella', 'Tobias', 'Zella'];
    expect(titleScreen('intro', 'bb-1', made).html).toContain('assets/bb/intro/bb-1-intro.mp4');
    expect(titleScreen('outro', 'bb-1', made).html).toContain('assets/bb/intro/bb-1-outro.mp4');
    expect(titleScreen('intro', 'bb-1', made.slice(1)).html).toContain('class="bbt live"');
  });

  it('stop the music bed, offer a skip, and fall back to the generic pair', () => {
    for (const kind of ['intro', 'outro']) {
      const { html } = titleScreen(kind, 'bb-99');
      expect(html).toContain('data-ambient="none"');
      expect(html).toMatch(/class="bbt-skip"[^>]*onclick="bbxTitleDone/);
      expect(html).toContain(`data-fallback="assets/bb/intro/generic-${kind}.mp4"`);
    }
  });

  it('have every file they point at', () => {
    for (const f of ['bb-1-intro', 'bb-1-outro', 'generic-intro', 'generic-outro']) {
      expect(fs.existsSync(`assets/bb/intro/${f}.mp4`), f).toBe(true);
    }
  });
});
