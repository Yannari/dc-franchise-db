// The reveal controls have to stay on screen.
//
// Every themed competition screen pins its Next/Reveal-all buttons to the
// bottom with `position:sticky`, so a long card list can be read without
// scrolling back up to advance it. That is silently defeated by `overflow`
// anything-but-visible on an ANCESTOR: an overflow-hidden wrapper becomes a
// scroll container, and sticky then sticks to that container rather than the
// viewport. Nothing errors. The buttons simply scroll away, and the only way
// to find out is to play a week and get annoyed.
//
// It has now happened twice — most recently in Pressure Cooker, whose shell
// wrapped the controls in `overflow:hidden` while every other screen had been
// moved to `overflow:clip` (which clips identically and does NOT create a
// scroll container). This catches the third time.
//
// Heuristic, deliberately: it checks the SHELL selectors — the ones carrying
// the screens' shared `max-width:1100px` — rather than parsing CSS. Every
// screen's root is written that way, and the inner elements that legitimately
// use overflow:hidden (progress bars, clipped art panels, rounded map frames)
// never are.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'js', 'vp-bb-sig');

describe('themed screens keep their reveal controls pinned', () => {
  const files = readdirSync(DIR).filter(f => f.endsWith('.js') && !f.startsWith('_'));

  it('finds the screens', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  for (const file of files) {
    it(`${file} does not trap its sticky controls in a scroll container`, () => {
      const src = readFileSync(join(DIR, file), 'utf8');
      if (!src.includes('position:sticky')) return;   // nothing to pin

      // Each shell declaration, from its selector to the closing brace.
      const shells = [];
      const re = /max-width:1100px/g;
      let m;
      while ((m = re.exec(src))) {
        const open = src.lastIndexOf('{', m.index);
        const close = src.indexOf('}', m.index);
        if (open < 0 || close < 0) continue;
        shells.push(src.slice(open, close));
      }
      expect(shells.length, `${file}: no shell found — has the root pattern changed?`)
        .toBeGreaterThan(0);

      const trapped = shells.filter(block => /overflow\s*:\s*hidden/.test(block));
      expect(trapped, `${file}: a shell uses overflow:hidden, which kills the sticky controls inside it — use overflow:clip`)
        .toEqual([]);
    });
  }
});
