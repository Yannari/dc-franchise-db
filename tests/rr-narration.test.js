// The Ridonculous Race: Don narrates the episode, the way the real show does (episode 3, the user's goal
// transcript): the departure order ("Yesterday's Chill Zone is today's starting line..."), the flights ("This just
// in: flight number two has landed"), the bridges between groups of teams, and the bottom of the leg ("the last
// four teams are battling towards the carpet of completion").
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr narration', () => {
  let res, eps;
  beforeAll(() => {
    const { cast, teams } = raceCast(12, 1);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 1 });
    eps = airSeason(res);
  });
  const narr = (ep, ending) => ep.segments.filter(s => s.kind === 'don-narrate' && s.ending === ending);

  it("every leg after the first opens on the departure, naming last leg's winners, before Don's opener", () => {
    eps.slice(1).forEach((ep, j) => {
      const d = narr(ep, 'depart');
      expect(d.length, `leg ${ep.n}`).toBe(1);
      const prev = res.state.teams[res.legs[j].order[0]];
      const text = d[0].lines.map(l => l.text).join(' ');
      expect(text, `leg ${ep.n}`).toContain(prev.a);
      expect(ep.segments.indexOf(d[0]), `leg ${ep.n}`).toBeLessThan(ep.segments.findIndex(s => s.kind === 'don-opener'));
    });
    expect(narr(eps[0], 'depart')).toEqual([]);
  });

  it('the flights are narrated: who is waiting, and each landing', () => {
    let legs = 0;
    eps.forEach((ep, i) => {
      const flights = res.state.scenes.filter(s => s.leg === ep.n && s.kind === 'same-flight');
      if (flights.length < 2) return;
      legs++;
      expect(narr(ep, 'flight-wait').length, `leg ${ep.n}`).toBe(1);
      expect(narr(ep, 'first-landed').length + narr(ep, 'flight-landed').length, `leg ${ep.n}`).toBe(flights.length);
    });
    expect(legs).toBeGreaterThan(0);
  });

  it('the leaders moving on while others are still behind is bridged, and the bottom of an elimination leg is called', () => {
    let bridges = 0;
    eps.forEach((ep, i) => {
      bridges += narr(ep, 'bridge').length;
      if (res.legs[i].kind === 'elim' && res.legs[i].order.length >= 5) expect(narr(ep, 'last-stretch').length, `leg ${ep.n}`).toBe(1);
    });
    expect(bridges).toBeGreaterThan(3);
  });

  it('every narration is Don (a stage direction at most), with every slot filled', () => {
    let n = 0;
    for (const ep of eps) for (const s of ep.segments.filter(s => s.kind === 'don-narrate')) {
      expect(s.lines?.length, `leg ${ep.n} ${s.ending}`).toBeGreaterThan(0);
      // Don speaks every word; the Chill Zone intro may set the scene around him first
      for (const l of s.lines) { if (l.kind !== 'beat') expect(l.by).toBe('Don'); expect(l.text).not.toMatch(/[{}]|undefined|null/); }
      expect(s.lines.some(l => l.by === 'Don')).toBe(true);
      n++;
    }
    expect(n).toBeGreaterThan(20);
  });
});
