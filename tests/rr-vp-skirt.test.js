// Under a lifted shot, the ground goes on in shadow: never a mirrored copy of the plate. Found 2026-10-20 by the user
// ("whats going on in the bg why am i seeing 2 symmetric version"): when the bar stepped aside for a beat card, the
// Home City street showed again upside down beneath itself, its cars and lamps reflected.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('rr viewer: under the plate', () => {
  it('extends the plate\'s last strip of ground, darkened, and mirrors nothing', () => {
    const css = readFileSync('js/vp-rr-ep/style.js', 'utf8');
    const rule = css.match(/\.plate-skirt\{[^}]*\}/)?.[0] || '';
    expect(rule).toBeTruthy();
    expect(rule).not.toMatch(/scaleY\(-1\)|scale\(1,\s*-1\)|rotate/);
    // only the plate's bottom rows, stretched: nothing with a shape in it can repeat below
    const size = Number(rule.match(/background-size:100% (\d+)%/)?.[1]);
    expect(size).toBeGreaterThanOrEqual(2000);
    expect(rule).toMatch(/background-position:center bottom/);
  });
});
