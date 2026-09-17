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
