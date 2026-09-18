// ══════════════════════════════════════════════════════════════════════
// tests/dr-stage-css.test.js — the stylesheets are actually stylesheets
// ══════════════════════════════════════════════════════════════════════
//
// A stage's CSS is a template literal, and a BACKTICK IN A COMMENT inside one
// ends the string early: everything after it becomes code, the module either
// throws or exports an empty stylesheet, and the screen renders with no
// styling at all. It has happened twice — once in the lipstick wall and once
// in the critiques, both times from quoting a class name in a note — and it
// is invisible to every other test in this suite, because the markup is
// perfectly correct and simply unstyled.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { NIGHT_STAGE_CSS } from '../js/vp-dr/night-stage.js';
import { FINALE_STAGE_CSS } from '../js/vp-dr/finale-stage.js';
import { ROOM_STAGE_CSS } from '../js/vp-dr/room-stage.js';
import { CHAL_STAGE_CSS } from '../js/vp-dr/chal-stage.js';
import { LEGACY_STAGE_CSS } from '../js/vp-dr/legacy-stage.js';
import { CALL_CSS } from '../js/vp-dr/call-stage.js';

const SHEETS = {
  NIGHT_STAGE_CSS, FINALE_STAGE_CSS, ROOM_STAGE_CSS, CHAL_STAGE_CSS,
  LEGACY_STAGE_CSS, CALL_CSS,
};

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
      /* Each `export const X_CSS = ` opens a template literal; the first
         backtick after it closes it. Anything between that is a comment
         containing one would have ended it early. */
      const re = /(?:export )?const ([A-Z_]*CSS) = `/g;
      let m;
      while ((m = re.exec(src))) {
        const from = re.lastIndex;
        const to = src.indexOf('`', from);
        expect(to, `${m[1]} never closes`).toBeGreaterThan(-1);
        const body = src.slice(from, to);
        const open = (body.match(/\{/g) || []).length;
        const close = (body.match(/\}/g) || []).length;
        expect(open, `${m[1]} in ${file}: ${open} { against ${close} } `
          + '— a backtick in a comment probably ended it early').toBe(close);
      }
    });
  }
});

describe('every stage stylesheet', () => {
  for (const [name, css] of Object.entries(SHEETS)) {
    it(`${name} is not empty and not cut short`, () => {
      expect(typeof css, name).toBe('string');
      expect(css.length, `${name} is empty — a backtick ended it early`)
        .toBeGreaterThan(200);
      // Balanced braces: a truncated sheet loses its closing ones.
      const open = (css.match(/\{/g) || []).length;
      const close = (css.match(/\}/g) || []).length;
      expect(open, `${name}: ${open} { against ${close} }`).toBe(close);
      expect(css, `${name} ends mid-rule`).not.toMatch(/\{[^}]*$/);
    });
  }

  it('the critiques stage sizes the safe queens', () => {
    // The bug this file was written for: the faces are wrapped in a span for
    // their animation delay, so they need blockifying or the portrait draws
    // at its natural size and slides off the stage.
    expect(NIGHT_STAGE_CSS).toMatch(/\.crx-safe\s*>\s*span\{[^}]*display:block/);
    expect(NIGHT_STAGE_CSS).toMatch(/\.crx-safe \.fsx-face\{[^}]*display:block/);
  });
});
