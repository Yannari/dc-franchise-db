// ci-vp-tv.test.js: the Circle player never scrolls the page, and has TV mode.
// User (2026-09-30): "the screen always scrolls down when I click ... or better
// do a fullscreen button like Perfect Match". Measured in a browser: with
// scrollIntoView the page went 89 -> 107 -> 132 -> 157 over twelve clicks;
// scrolling the script box alone, it stayed at 89.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const src = readFileSync('js/vp-ci/screens.js', 'utf8');
const css = readFileSync('js/vp-ci/style.js', 'utf8');

describe('a click never moves the page', () => {
  it('no scrollIntoView anywhere in the Circle player (it scrolls every ancestor, the page included)', () => {
    expect(src.replace(/\/\/.*$/gm, '')).not.toMatch(/scrollIntoView\(/);
  });
  it('the new line is brought into view inside the script box', () => {
    expect(src).toMatch(/script\.scrollTop = /);
  });
});

describe('TV mode, like Perfect Match', () => {
  it('a button on every screen, a window function, and real fullscreen on the player', () => {
    expect(src).toMatch(/onclick="civTv\(\)"/);
    expect(src).toMatch(/civNext, civAll, civReset, civAuto, civTv/);
    expect(src).toMatch(/player\?\.requestFullscreen/);
    expect(src).toMatch(/fullscreenchange/);       // Esc leaves TV mode too
  });
  it('hides the script and sidebars and sizes the stage to the window', () => {
    expect(css).toMatch(/\.ci-tv \.civ \.civ-under\{display:none\}/);
    expect(css).toMatch(/#visual-player\.ci-tv:has\(\.civ\) #vp-sidebar\{display:none\}/);
    expect(css).toMatch(/\.ci-tv \.civ \.civ-stagewrap\{width:min\(100%,calc\(\(100vh - \d+px\) \* 16 \/ 9\)\)\}/);
  });
});
