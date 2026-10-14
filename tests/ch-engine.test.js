// The Challenge's engine: the rules that hold in every season (spec §9).
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers, players } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { challengeCast } from './helpers/ch-cast.js';

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const play = seed => {
  const { cast, names, background } = challengeCast(24, seed);
  setPlayers(cast);
  return { names, ...playChallengeSeason({ cast: names, background, seed }) };
};

describe('The Challenge engine', () => {
  let seasons;
  beforeAll(() => { seasons = [1, 2, 3, 4, 5, 6].map(play); });

  it('is deterministic: the same seed plays the same season', () => {
    const again = play(3);
    expect(again.champions).toEqual(seasons[2].champions);
    expect(again.episodes.map(e => e.votedIn)).toEqual(seasons[2].episodes.map(e => e.votedIn));
  });

  it('reaches a final with both divisions in it and crowns one champion per division', () => {
    for (const s of seasons) {
      const divs = new Set(s.final.finalists.map(n => s.state.division[n]));
      expect(divs.size).toBe(2);
      expect(s.champions.length).toBe(2);
      expect(new Set(s.champions.map(n => s.state.division[n])).size).toBe(2);
    }
  });

  it('nobody votes for themselves, and every ballot names somebody eligible that week', () => {
    for (const s of seasons) for (const e of s.episodes) for (const v of e.votes) {
      for (const b of v.ballots) {
        expect(b.voter).not.toBe(b.target);
        expect(s.state.division[b.target]).toBe(e.division);
        expect(e.daily.winners).not.toContain(b.target);
      }
    }
  });

  it('a call-out stays in the division and never names an immune player', () => {
    for (const s of seasons) for (const e of s.episodes) for (const c of e.callouts) {
      expect(s.state.division[c.opponent]).toBe(s.state.division[c.by]);
      expect(e.daily.winners).not.toContain(c.opponent);
      expect(c.opponent).not.toBe(c.by);
    }
  });

  it('the Arena sends the loser home and the winner back', () => {
    for (const s of seasons) for (const e of s.episodes) for (const a of e.arena) {
      expect(s.state.gone.find(g => g.name === a.loser)?.how).toBe('arena');
      expect([a.a, a.b]).toContain(a.winner);
    }
  });

  it('nice archetypes never throw a daily or say a false yes', () => {
    const arch = n => players.find(p => p.name === n)?.archetype;
    for (const s of seasons) {
      // players is reset per season; check against the season's own cast.
      const { cast } = challengeCast(24, s.state.seed);
      const a = n => cast.find(p => p.name === n)?.archetype ?? arch(n);
      for (const sc of s.state.scenes) {
        if (sc.kind === 'throw' || sc.kind === 'throw-caught') expect(NICE.has(a(sc.kind === 'throw' ? sc.who[0] : sc.who[1]))).toBe(false);
        if (sc.kind === 'meeting') for (const [who, r] of Object.entries(sc.data.responses)) if (r === 'false-yes') expect(NICE.has(a(who))).toBe(false);
      }
    }
  });

  it('never runs more than four showmances at once', () => {
    for (const s of seasons) {
      for (let ep = 0; ep <= s.episodes.length; ep++) {
        const live = s.state.couples.filter(c => c.since <= ep && (!c.ended || c.ended > ep));
        expect(live.length).toBeLessThanOrEqual(4);
      }
    }
  });

  it('every placement is a distinct exit, and the cast is accounted for', () => {
    for (const s of seasons) {
      expect(Object.keys(s.placements).sort()).toEqual([...s.names].sort());
    }
  });
});

describe('nobody who has left takes part in a scene', () => {
  it('every scene after an exit is free of the people already gone', () => {
    for (const seed of [11, 12, 13]) {
      const { cast, names, background } = challengeCast(24, seed);
      setPlayers(cast);
      const r = playChallengeSeason({ cast: names, background, seed });
      const goneAt = Object.fromEntries(r.state.gone.map(g => [g.name, g.day]));
      for (const sc of r.state.scenes) {
        // A scene on the day of an exit may still hold the one leaving (their goodbye).
        for (const w of sc.who) if (goneAt[w] != null) expect(sc.day <= goneAt[w], `${sc.kind} on day ${sc.day} has ${w}, gone day ${goneAt[w]}`).toBe(true);
      }
    }
  });
});
