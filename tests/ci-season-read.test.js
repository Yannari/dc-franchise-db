// ci-season-read.test.js — bugs found by reading whole seasons (2026-10-01,
// user: "run seasons audit then fix bugs"). Each check is a class of bug a
// read turned up, measured over real-roster seasons.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { seasonText } from '../js/ci/transcript.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const runs = [11, 23, 37, 4, 9, 15].map(seed => {
  const cast = rosterCast(13, seed); setPlayers(cast); const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
});
const lines = (sc) => (sc.script?.blocks || []).flatMap(b => b.lines.map(l => ({ key: b.key, ...l })));

describe('a read of whole seasons', () => {
  it('the first ratings night claims no standing: nobody is "winning" before anyone has been rated', () => {
    const STANDING = /winning|the winner|runs this place|stays on top|than last time/i;
    for (const { state } of runs) {
      const first = state.scenes.find(s => s.kind === 'ratings' && s.aired);
      const said = lines(first).filter(l => STANDING.test(l.text || ''));
      expect(said.map(l => `${l.key}: ${l.text}`)).toEqual([]);
    }
  });
  it('a catfish walking into the finale is never told they look like their pictures', () => {
    for (const { state } of runs) for (const s of state.scenes.filter(x => x.kind === 'meet' && x.aired)) {
      for (const b of s.script.blocks.filter(x => x.key === 'meet.react')) {
        const about = b.on?.b;
        if (about && state.profiles[about]?.mode === 'catfish') {
          expect(b.lines.map(l => l.text).join(' ')).not.toMatch(/exactly like I pictured/);
        }
      }
    }
  });
  it('a nationality is never printed as a hometown', () => {
    for (const { state, rows, result } of runs) expect(seasonText(state, rows, result)).not.toMatch(/from (Swiss|British|French|German|Canadian|American|Mexican|Italian)\b/);
  });
  it('day one: no two players set up their profile with the same line', () => {
    for (const { state } of runs) {
      const prof = state.scenes.find(s => s.kind === 'profiles');
      const said = prof.script.blocks.filter(b => b.key.startsWith('profile.')).map(b => b.lines.map(l => l.text).join(' '));
      expect(said.length - new Set(said).size).toBe(0);
    }
  });
});
