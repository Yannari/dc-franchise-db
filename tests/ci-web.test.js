// ci-web.test.js — the Circle web (the episode summed up as a network) and Debug.
// User (2026-10-01): "a web tab at the end of each episode ... the alliances ...
// movement compared to last episode ... include romance/crush"; "fill Debug";
// "make sure we have popularity and it works".
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { tiesOf } from '../js/ci/web-data.js';
import { circleVpScreens } from '../js/vp-ci/screens.js';
import { episodeText } from '../js/ci/transcript.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const cast = rosterCast(12, 4); setPlayers(cast);
const names = cast.map(p => p.name);
const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: 4 });

describe('the snapshot at the end of every episode', () => {
  it('keeps the room: relationships, feelings, beliefs, popularity, alliances', () => {
    for (const r of rows) {
      const e = r.ci.end;
      expect(e.people).toEqual(r.ci.active);
      for (const h of e.people) { expect(e.mind[h]).toBeTruthy(); expect(e.public[h]).toHaveProperty('approval'); }
      expect(JSON.parse(JSON.stringify(e))).toEqual(e);
    }
  });
  it('popularity moves: the audience does not like everyone the same', () => {
    const last = rows.at(-2).ci.end.public;
    const ap = Object.values(last).map(p => p.approval);
    expect(Math.max(...ap) - Math.min(...ap)).toBeGreaterThan(5);
  });
});

describe('the web', () => {
  it('reads a room the way a person does: one crush each at most, a few close ties, a few grudges', () => {
    for (const r of rows) {
      const t = tiesOf(r.ci.end);
      const crushes = t.filter(x => x.kind === 'crush');
      expect(new Set(crushes.map(x => x.a)).size).toBe(crushes.length);
      expect(t.length).toBeLessThan(r.ci.end.people.length * 4);
    }
  });
  it('is the last screen before Debug, each click one change, and the backlog says the same changes', () => {
    rows.forEach((r, i) => {
      const screens = circleVpScreens(r, { prev: rows[i - 1] || null, next: rows[i + 1] || null, debug: true });
      expect(screens.at(-1).id).toBe('debug');
      expect(screens.at(-2).id).toMatch(/^ci-web-/);
      const text = episodeText(r);
      expect(text).toContain('── The Circle web');
      for (const c of r.ci.end.changes) expect(text).toContain(c.text);
    });
  });
  it('says who left, and what happened to the alliances, before the crushes', () => {
    const all = rows.flatMap(r => r.ci.end.changes);
    expect(all.some(c => c.kind === 'blocked')).toBe(true);
    expect(all.some(c => c.kind === 'formed')).toBe(true);
    for (const r of rows) {
      const ch = r.ci.end.changes, firstCrush = ch.findIndex(c => c.kind === 'crush');
      if (firstCrush > 0) expect(ch.slice(firstCrush).some(c => ['blocked', 'formed', 'broken'].includes(c.kind))).toBe(false);
      expect(ch.filter(c => c.kind === 'crush').length).toBeLessThanOrEqual(2);
    }
  });
});
