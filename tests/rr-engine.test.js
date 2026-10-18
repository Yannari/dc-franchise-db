// The Ridonculous Race: the finale and a whole season, headless (engine plan, Task 19).
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers, players } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { SCENES } from '../js/rr/scenes.js';

const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
const SABOTAGE = ['push', 'ram', 'steal', 'kidnap-pet', 'course-sabotage', 'fake-shortcut', 'mind-game', 'admin-sabotage', 'free-ride', 'revenge', 'alliance-betrayal', 'deal-broken', 'shove', 'lie', 'secret-used'];
const play = (n, seed) => { const { cast, teams } = raceCast(n, seed); setPlayers(cast); return playRaceSeason({ teams, seed }); };

describe('rr engine', () => {
  let seasons;
  beforeAll(() => { seasons = [1, 2, 3, 4].map(s => play(12, s)); });

  it('is deterministic', () => { expect(play(12, 3).placements).toEqual(seasons[2].placements); });

  it('ends with three teams in the final, one winner, a placement for every team', () => {
    for (const s of seasons) {
      expect(s.final.order.length + 1).toBe(3);
      expect(s.final.midOut).toBeTruthy();
      expect(s.legs.at(-1).kind).toBe('final');
      for (const l of s.legs) expect(['elim', 'non', 'final']).toContain(l.kind);
      expect(Object.keys(s.placements)).toHaveLength(12);
      expect(new Set(Object.values(s.placements)).size).toBe(12);
      expect(s.placements[s.winner]).toBe(1);
      expect(s.placements[s.final.midOut]).toBe(3);
      expect(s.final.bleachers.length).toBe(12 - 2);      // everyone but the two finalists, the midpoint team too
    }
  });

  it('one elimination per elimination leg, none on a non-elimination leg (medevacs and quits aside)', () => {
    for (const s of seasons) {
      for (const leg of s.legs.slice(0, -1)) {
        if (leg.kind === 'elim') expect(leg.eliminated, `leg ${leg.n}`).toHaveLength(1);
        else expect(leg.eliminated, `leg ${leg.n}`).toHaveLength(0);
      }
      const left = s.legs.flatMap(l => l.eliminated).length + (s.state.medevacs || []).filter(m => !m.returned).length
        + Object.keys(s.state.quitting || {}).length - (s.state.medevacs || []).filter(m => m.returned).length;
      expect(left).toBe(12 - 3 + 1);     // nine before the final, and the midpoint team
    }
  });

  it('nice archetypes never sabotage; the mat always holds both partners', () => {
    for (const s of seasons) {
      const arch = n => players.find(p => p.name === n)?.archetype;
      for (const sc of s.state.scenes.filter(x => SABOTAGE.includes(x.kind))) {
        expect(NICE, `${sc.kind} by ${sc.who[0]} (${arch(sc.who[0])})`).not.toContain(arch(sc.who[0]));
      }
      for (const sc of s.state.scenes.filter(x => x.kind === 'don-place')) {
        const t = s.state.teams[sc.data.team];
        expect(sc.who.sort()).toEqual([t.a, t.b].sort());
      }
    }
  });

  it('every scene records what it changed, and a catalogue kind always has its ending', () => {
    for (const s of seasons) for (const sc of s.state.scenes) {
      expect(sc.data.effects?.length, `#${sc.id} ${sc.kind}`).toBeGreaterThan(0);
      if (SCENES[sc.kind]) expect(SCENES[sc.kind].endings, `#${sc.id} ${sc.kind}`).toContain(sc.data.ending);
    }
  });

  it('6 and 18 teams both reach a three-team final', () => {
    for (const n of [6, 18]) {
      const s = play(n, 9);
      expect(s.final.order.length + 1).toBe(3);
      expect(Object.keys(s.placements)).toHaveLength(n);
    }
  });
});
