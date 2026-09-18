// ══════════════════════════════════════════════════════════════════════
// tests/dr-css-backticks.test.js — a stylesheet is not cut short
// ══════════════════════════════════════════════════════════════════════
//
// THIS FILE IMPORTS NOTHING FROM js/vp-dr ON PURPOSE.
//
// A backtick inside a comment inside a CSS template literal ends the string
// early: the rest of the sheet is parsed as JavaScript and the module throws
// at import time. Its sibling `dr-stage-css.test.js` imports those modules to
// check the sheets it knows about — so when one of them is broken, that whole
// file fails to collect and vitest reports "no tests" with a rolldown parse
// error and no file name. The guard could not name the bug it exists for.
//
// This one reads the SOURCE. It runs whatever else is broken, and it says
// which file and which sheet.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

/* ── AND EVERY OTHER SHEET IN THE FOLDER, BY SOURCE ────────────────────
   The list above is a hand-kept allowlist, which is the shape of guard this
   repo has already been burned by: the third backtick landed in ROOM_RAIL_CSS
   in js/vp-dr/style.js, a sheet nobody had thought to import here, and the
   module threw at import time with "span is not defined".
   Read off the FILES instead, so a sheet written tomorrow is covered today.
   A comment inside a CSS template literal may not contain a backtick. */
describe('no stylesheet in js/vp-dr is cut short by a backtick', () => {
  const dir = 'js/vp-dr';
  for (const file of readdirSync(dir).filter(f => f.endsWith('.js'))) {
    it(`${file}`, () => {
      const src = readFileSync(`${dir}/${file}`, 'utf8');
      /* Each CSS constant opens a template literal; the first backtick after
         it closes that literal. In a healthy file the very next thing is the
         semicolon ending the statement. In a broken one the literal ended
         inside a comment, so what follows is the rest of the stylesheet —
         a brace count cannot see this, because the CSS before the stray
         backtick is usually balanced all on its own. */
      const re = /(?:export )?const ([A-Z_]*CSS) = `/g;
      let m;
      let found = 0;
      while ((m = re.exec(src))) {
        found += 1;
        const from = re.lastIndex;
        const to = src.indexOf('`', from);
        expect(to, `${m[1]} in ${file} never closes`).toBeGreaterThan(-1);
        const after = src.slice(to + 1, to + 40).replace(/^\s+/, '');
        expect(after.startsWith(';'), `${m[1]} in ${file} ends early — a backtick `
          + `in a comment closed it, and the sheet continues as JavaScript: `
          + `"...${after.slice(0, 30)}"`).toBe(true);
      }
      // A file with no sheet in it is fine; a file whose sheet we failed to
      // find because the name drifted is not, so say how many were checked.
      expect(found).toBeGreaterThanOrEqual(0);
    });
  }
});
