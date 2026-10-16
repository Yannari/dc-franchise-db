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

// Pole Truth once let the last player on the poles lunge for the food after everybody else had stepped
// down, and the heat was won by nobody: TJ said "{who} is the last one standing!" (2% of small heats).
describe('every played daily names a real player in every beat', () => {
  it('small casts, every mode, both divisions on and off', async () => {
    const { SIMS, DAILIES, makePairs, makeTeams } = await import('../js/ch/dailies.js');
    const { names, state } = play(3);
    const rngOf = a => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for (const [id, fn] of Object.entries(SIMS)) {
      for (const mode of DAILIES.find(d => d.id === id)?.modes || ['solo']) for (const gendered of [false, true]) {
        for (let s = 1; s <= 120; s++) {
          const rng = rngOf(s * 7919 + 13);
          const k = (mode === 'teams' ? 6 : 2) + (s % 14);
          const mix = [...names].sort(() => rng() - 0.5);
          state.active = gendered ? [...mix.filter(n => state.division[n] === 'm').slice(0, Math.ceil(k / 2)), ...mix.filter(n => state.division[n] === 'f').slice(0, Math.floor(k / 2) || 1)] : mix.slice(0, k);
          state.options.gendered = gendered;
          const units = mode === 'pairs' ? makePairs(state, rng) : mode === 'teams' ? makeTeams(state, rng) : state.active.map(n => [n]);
          const power = Object.fromEntries(state.active.map(n => [n, 3 + rng() * 6]));
          const res = fn(state, rng, { units, power, mode });
          const nul = res.beats.find(b => (b.who || []).some(x => x == null));
          expect(nul, `${id} ${mode} ${gendered ? 'gendered' : 'open'} run ${s}: ${nul?.kind}`).toBeUndefined();
          for (const w of res.winners || []) expect(w, `${id} ${mode} run ${s}: a winner`).toBeTruthy();
        }
      }
    }
  }, 300000);
});
