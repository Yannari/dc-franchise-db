// The race starts on screen (the user, 2026-10-21: "a screen at the first leg where don start the race and we see in a
// wide shot all the teams playing and when he said idk GO or whatever they all start running"). Leg one's opener at
// the start line had only some of the teams, drawn small behind Don, and they ran off only if the opener's last line
// happened to say go. Now it is the start line: every team racing, in a wide shot the whole way, Don's last line is the
// go, and on it they all sprint off; nobody else in the leg runs off on a go.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens, facesAt, overlapOf, OVERLAP_OK, padOf } from '../js/vp-rr-ep/steps.js';

const firsts = [];
beforeAll(() => {
  for (const [n, seed] of [[12, 8], [12, 3], [8, 21], [6, 5], [10, 44]]) {
    const { cast, teams } = raceCast(n, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const eps = airSeason(res);
    firsts.push({ seed, n, res, ep: episodeScreens(res, eps, 0) });
  }
}, 600000);

describe('rr viewer: the start line', () => {
  it('stands every team at the start line, and on Don\'s go they all run', () => {
    for (const { seed, res, ep } of firsts) {
      const go = ep.screens.filter(s => s.startLine);
      expect(go.length, `seed ${seed}`).toBe(1);
      const s = go[0];
      expect([...s.teams].sort(), `seed ${seed}`).toEqual([...res.legs[0].order].sort());
      expect(s.crowd || [], `seed ${seed}: nobody behind, everybody in it`).toEqual([]);
      const last = s.steps.length - 1;
      expect(s.steps[last].by, `seed ${seed}`).toBe('Don');
      expect(s.steps[last].text, `seed ${seed}`).toMatch(/\bgo\b/i);
      expect(s.exitAt, `seed ${seed}`).toBe(last);
      for (const st of s.steps) expect(st.cam.shot, `seed ${seed}`).toBe('wide');
      for (const id of s.teams) expect(s.marks[id], `seed ${seed} ${id}`).toBeTruthy();
    }
  });

  it('holds them all whole in the picture, nobody on anybody', () => {
    for (const { seed, ep } of firsts) {
      const s = ep.screens.find(x => x.startLine);
      const f = facesAt(s, 0);
      for (const x of f) { const b = padOf(x, x.z); expect(b[0] >= 0 && b[2] <= 100 && b[1] >= 0, `seed ${seed} ${x.key} in frame`).toBe(true); }
      for (let a = 0; a < f.length; a++) for (let b = a + 1; b < f.length; b++) {
        if (f[a].key !== f[b].key) expect(overlapOf(f[a].box, f[b].box), `seed ${seed} ${f[a].key}/${f[b].key}`).toBeLessThanOrEqual(OVERLAP_OK);
      }
    }
  });

  it('runs them off once: no other screen of the leg ends on a sprint', () => {
    for (const { seed, ep } of firsts) expect(ep.screens.filter(s => s.exitAt != null).length, `seed ${seed}`).toBe(1);
  });
});
