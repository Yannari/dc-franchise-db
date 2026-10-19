// The Ridonculous Race: once Don has told a team its race is over, the episode doesn't go back to them racing (their
// exit interview is the last we see of them), and nothing airs without words. Found reading seed 8 (2026-10-19): the
// Vloggers, sent home on the road at 18:27, were begging for money at 21:14, and one of those scenes had no lines.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const EXIT = new Set(['don-elim', 'don-arrives', 'don-fakeout']);
const AFTER_OK = new Set(['int-exit', 'console', 'goodbye', 'goodbye-kiss', 'mat-montage', 'don-narrate']);

describe('rr after the exit', () => {
  const seasons = [];
  beforeAll(() => {
    for (const [n, seed] of [[18, 8], [12, 11], [14, 21]]) {
      const { cast, teams } = raceCast(n, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      seasons.push({ res, eps: airSeason(res) });
    }
  });

  it('no scene of a team racing airs after Don has sent it home', () => {
    const bad = [];
    for (const { res, eps } of seasons) for (const [i, ep] of eps.entries()) {
      // (the finale's cut and its bleachers are their own sequence)
      for (const out of res.legs[i].kind === 'final' ? [] : res.legs[i].eliminated || []) {
        const k = ep.segments.findIndex(s => EXIT.has(s.kind) && s.teams.includes(out));
        if (k < 0) continue;
        for (const s of ep.segments.slice(k + 1)) {
          if (s.teams.includes(out) && !AFTER_OK.has(s.kind) && !s.kind.startsWith('int-')) bad.push(`seed ${res.state.seed} leg ${ep.n}: ${s.kind} after ${out}'s exit`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('no "one teams": a wait for the next flight is narrated only when there are teams waiting for it', () => {
    for (const { eps } of seasons) for (const ep of eps) for (const s of ep.segments) for (const l of s.lines || []) {
      expect(l.text, `leg ${ep.n}`).not.toMatch(/\bone teams\b/i);
    }
  });

  it('nothing airs without words', () => {
    const bad = [];
    for (const { res, eps } of seasons) for (const ep of eps) for (const s of ep.segments) {
      if (!s.lines?.length) bad.push(`seed ${res.state.seed} leg ${ep.n}: ${s.kind}/${s.ending}`);
    }
    expect(bad).toEqual([]);
  });
});
