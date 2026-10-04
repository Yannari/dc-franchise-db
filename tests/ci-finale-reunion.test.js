// ci-finale-reunion.test.js — the reunion before the results and the last
// words to the Circle (ci/finale.js). User, 2026-10-04: "it's missing some
// more closure, maybe have a reunion before the final results; also final
// words of the Circle are necessary; try to avoid repetitions".
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const seasons = [4, 7, 11, 19].map(seed => {
  const cast = rosterCast(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
});
const last = r => r.rows.at(-1).ci.aired;

describe('the reunion', () => {
  it('airs before the results, with the blocked players settling things with the people in them', () => {
    for (const r of seasons) {
      const aired = last(r);
      const ri = aired.findIndex(s => s.kind === 'reunion'), vi = aired.findIndex(s => s.kind === 'reveal');
      expect(ri).toBeGreaterThan(-1);
      expect(ri).toBeLessThan(vi);
      const talks = r.state.scenes.find(s => s.kind === 'reunion').data.talks;
      expect(talks.length).toBeGreaterThan(2);
      const blocked = new Set(r.state.blocked.map(b => b.handle));
      for (const t of talks) expect(blocked.has(t.a) || blocked.has(t.b)).toBe(true);
      // never a night of one kind; one "who blocked me" per blocked player
      const kinds = talks.map(t => t.kind);
      for (const k of new Set(kinds)) expect(kinds.filter(x => x === k).length).toBeLessThanOrEqual(2);
      const blockers = talks.filter(t => t.kind === 'blocker').map(t => t.a);
      expect(new Set(blockers).size).toBe(blockers.length);
      // the host has welcomed everyone already: the results go straight to the board
      expect(aired[vi].script.blocks[0].key).toBe('reveal.board');
    }
  });
  it('every talk is asked by the host and answered', () => {
    for (const r of seasons) {
      const keys = last(r).find(s => s.kind === 'reunion').script.blocks.map(b => b.key);
      expect(keys.filter(k => k.startsWith('reunion.ask.')).length).toBe(keys.filter(k => k.startsWith('reunion.talk.')).length);
    }
  });
});

describe('last words to the Circle', () => {
  it('every finalist sends one before leaving, and the Circle signs off', () => {
    for (const r of seasons) {
      const s = last(r).find(x => x.kind === 'farewell');
      const keys = s.script.blocks.map(b => b.key);
      expect(keys[keys.length - 1]).toBe('farewell.close');
      expect(keys.filter(k => k.startsWith('farewell.word.')).length).toBe(r.state.active.length);
    }
  });
});
