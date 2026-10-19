// The Ridonculous Race: the finale airs as a finale — the winners are crowned, the bleachers watch them
// come in, and the team cut at the midpoint says goodbye when it goes (read loop, season 2).
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { MUST } from '../js/rr/story/director.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr finale on air', () => {
  let res, last, st;
  beforeAll(() => {
    const { cast, teams } = raceCast(8, 2);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 2 });
    st = res.state;
    last = airSeason(res).at(-1);
  });
  const fin = () => res.legs.at(-1);

  it('the winners are crowned and the runners-up told, not checked in', () => {
    const n = fin().n;
    const crowns = st.scenes.filter(s => s.leg === n && s.kind === 'don-crown');
    expect(crowns.map(s => s.data.ending)).toEqual(['winner', 'runner-up']);
    expect(crowns[0].data.team).toBe(fin().winner ?? fin().order[0]);
    expect(st.scenes.filter(s => s.leg === n && s.kind === 'don-place' && !s.data.midmat)).toEqual([]);
    expect(MUST.has('don-crown')).toBe(true);
    expect(last.segments.some(s => s.kind === 'don-crown' && s.ending === 'winner')).toBe(true);
  });

  it('the bleachers speak before the winners arrive', () => {
    const win = last.segments.findIndex(s => s.kind === 'don-crown' && s.ending === 'winner');
    last.segments.forEach((s, i) => { if (s.kind === 'int-bleachers') expect(i).toBeLessThan(win); });
  });

  it('the team cut at the midpoint says goodbye right after it is cut', () => {
    const elim = last.segments.findIndex(s => s.kind === 'don-elim');
    const exit = last.segments.findIndex(s => s.kind === 'int-exit');
    expect(elim).toBeGreaterThanOrEqual(0);
    expect(exit).toBeGreaterThan(elim);
    expect(last.segments.slice(elim + 1, exit).filter(s => s.kind === 'don-place' || s.kind === 'don-crown')).toEqual([]);
  });
});
