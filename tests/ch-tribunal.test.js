// The Tribunal format (js/ch/format.js tribunal, vote.js tribunalDecide): the daily's winners judge, the house
// nominates three, the Tribunal sends one in.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { challengeCast } from './helpers/ch-cast.js';

describe('the Tribunal', () => {
  const seasons = [21, 9].map(seed => {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed, options: { format: 'tribunal' } });
    airSeason(r.state);
    return { r, rows: challengeRows(r) };
  });
  it('sends in one of the nominees, never a judge, and the judges do not vote', () => {
    let weeks = 0;
    for (const { r } of seasons) for (const e of r.state.episodes) for (const v of e.votes || []) {
      if (!v.tribunal) continue;
      weeks++;
      const t = v.tribunal;
      expect(t.nominees).toContain(t.chosen);
      expect(t.tribunal).not.toContain(t.chosen);
      for (const b of v.ballots) expect(t.tribunal, `ep ${e.ep}: a judge voted`).not.toContain(b.voter);
      expect(v.votedIn).toBe(t.chosen);
    }
    expect(weeks).toBeGreaterThan(10);
  });
  it('airs the nominations, then the pitches, the room and the verdict, in that order', () => {
    for (const { rows } of seasons) for (const row of rows) {
      if (!row.ch.tribunal) continue;
      const kinds = (row.ch.aired || []).map(a => a.kind);
      const cer = kinds.indexOf('ceremony'), verdict = kinds.indexOf('tribunal-verdict');
      expect(cer, `ep ${row.num}`).toBeGreaterThanOrEqual(0);
      expect(verdict, `ep ${row.num}`).toBeGreaterThan(cer);
      const pitch = kinds.indexOf('tribunal-pitch');
      if (pitch >= 0) expect(pitch).toBeGreaterThan(cer);
    }
  });
});
