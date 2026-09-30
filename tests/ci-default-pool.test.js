// ci-default-pool.test.js — the Catfish Pool a season plays when nobody wrote
// one (Plan 4 Task 3). The faces are the author's own images, added on the
// pool panel; until then a persona has none, and a `look` line says what its
// photo should show.
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';
import { personaStyle } from '../js/ci/cover.js';

describe('the default Catfish Pool', () => {
  it('is eight personas, each whole, none sharing a handle', () => {
    expect(DEFAULT_POOL).toHaveLength(8);
    expect(new Set(DEFAULT_POOL.map(p => p.handle)).size).toBe(8);
    expect(new Set(DEFAULT_POOL.map(p => p.id)).size).toBe(8);
    for (const p of DEFAULT_POOL) {
      for (const k of ['id', 'handle', 'age', 'gender', 'jobId', 'status', 'bio', 'photo']) expect(p[k], `${p.id}.${k}`).toBeTruthy();
      expect(p.reasons.length).toBeGreaterThan(0);
      for (const r of p.reasons) expect(['strategic', 'protective', 'family', 'experimental']).toContain(r);
    }
  });

  it('carries no stock face: the author makes the catfish images', () => {
    for (const p of DEFAULT_POOL) expect(p.face, p.id).toBeNull();
    expect(existsSync('js/ci/faces.js')).toBe(false);
  });

  it('spreads across the ways people type and the ages people fake', () => {
    const registers = new Set(DEFAULT_POOL.map(p => personaStyle(p).register));
    expect(registers.size).toBeGreaterThanOrEqual(5);
    expect(DEFAULT_POOL.filter(p => p.gender === 'f').length).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_POOL.filter(p => p.gender === 'm').length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...DEFAULT_POOL.map(p => p.age))).toBeGreaterThanOrEqual(38);
    expect(Math.min(...DEFAULT_POOL.map(p => p.age))).toBeLessThanOrEqual(23);
  });
});
