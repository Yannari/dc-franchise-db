// Every speaker's face sits on the same side of the dialogue box (the user, 2026-10-21: "why some avatar are in the
// wrong side of the chat card most are on the left side why some are on the right it doesnt read really well"): the
// box flipped its avatar to the right for every other speaker, the visual novel's way, and read badly.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('rr viewer: the dialogue box', () => {
  it('puts every speaker\'s avatar on the left, never the right', () => {
    const src = readFileSync('js/vp-rr-ep/stage.js', 'utf8');
    expect(src).not.toMatch(/side = [^;\n]*'right'/);
    expect(src).not.toMatch(/\$\{[^}]*\bside\b[^}]*\}/);
    expect(src).toMatch(/box\.className = `vn on \$\{iv \|\| beat \? '' : 'left'\}/);
  });
});
