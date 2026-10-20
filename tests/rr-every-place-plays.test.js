// Every place in the library plays when it's booked (the user, 2026-10-19: "i want u to do the challenge of the 48").
// A place carrying `draft: true` is never drawn into a season, so nothing else in the suite ever plays it: this books
// every middle place onto a leg, plays the season, and reads the aired episode. Each of the place's challenges has to be
// explained by Don on screen (its don-demo), and no line may reach the screen with a slot left unfilled.
import { describe, it, expect } from 'vitest';
import { PLACES } from '../js/rr/places.js';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const TASKS = ['allin', 'botch', 'either', 'superteam'];
const middle = Object.values(PLACES).filter(p => !p.start && !p.finale);
// twelve teams race eleven legs: legs 2 to 10 are middle legs, nine places a season
const PER_SEASON = 9;

describe('rr every place plays', () => {
  it('every place, booked, plays its challenges and airs them, with every slot filled', () => {
    const missing = [], unfilled = [];
    for (let i = 0; i < middle.length; i += PER_SEASON) {
      const batch = middle.slice(i, i + PER_SEASON);
      const seed = 100 + i;
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const pins = Object.fromEntries(batch.map((p, k) => [k + 2, p.id]));
      const res = playRaceSeason({ teams, seed, options: { pins } });
      const eps = airSeason(res);
      for (const p of batch) {
        const at = res.legs.findIndex(l => l.place === p.id);
        expect(at, `${p.id} was booked and never played`).toBeGreaterThan(-1);
        const segs = eps[at].segments;
        for (const s of p.stretches.filter(s => TASKS.includes(s.kind)))
          if (!segs.some(x => x.kind === 'don-demo' && x.stretch === s.id)) missing.push(`${p.id}/${s.id}`);
        for (const x of segs) for (const l of x.lines || [])
          if (/\{[a-z.]+\}/i.test(l.text || '')) unfilled.push(`${p.id} ${x.kind}: ${l.text}`);
      }
    }
    expect(missing, 'challenges Don never explained on screen').toEqual([]);
    expect(unfilled.slice(0, 5), 'lines with a slot left unfilled').toEqual([]);
  });
});
