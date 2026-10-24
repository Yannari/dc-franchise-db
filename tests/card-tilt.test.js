// Trading-card tilt: the card leans toward the pointer, never past the limit.
import { describe, it, expect } from 'vitest';
import { tiltFor } from '../js/card-tilt.js';

describe('tiltFor', () => {
  it('is flat in the middle', () => {
    expect(tiltFor(0.5, 0.5)).toEqual({ rx: 0, ry: 0 });
  });
  it('leans toward the corner the pointer is in', () => {
    // Top-right: the top comes toward you (rx > 0) and the right side away (ry > 0).
    expect(tiltFor(1, 0, 10)).toEqual({ rx: 10, ry: 10 });
    expect(tiltFor(0, 1, 10)).toEqual({ rx: -10, ry: -10 });
  });
  it('never passes the limit, even with the pointer outside the card', () => {
    expect(tiltFor(3, -2, 8)).toEqual({ rx: 8, ry: 8 });
  });
});
