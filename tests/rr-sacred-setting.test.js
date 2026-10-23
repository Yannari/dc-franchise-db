// A church, a temple, a sacred place is named only where the leg has one (the user, 2026-10-23, at the zipline: "why are
// they taking picture of a regilious school in home city?"). Two general lines aired back to back: directions "right at
// the church" that ended at "a very religious-looking school", and a local's "No photos inside. It is sacred." Read across
// every place: the photo aired at the harbour statue, an outback airport, a fjord; the church on an ice yacht. The places
// with a sacred site say so (`sacred: true`); the Church Choir is a team, not a building.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { PLACES } from '../js/rr/places.js';

const SAYS = /\b(sacred|holy|shrines?|temples?|church|churches|chapels?|monastery|cathedral|religious-looking)\b/i;
const NOT = /church choir|religious experience/i;
const hits = [];
let legs = 0;
beforeAll(() => {
  const ids = Object.keys(PLACES);
  for (let k = 0, round = 0; k < ids.length * 2; k += 10, round++) {
    const pins = {};
    for (let j = 0; j < 10; j++) pins[2 + j] = ids[(k + j) % ids.length];
    const seed = 100 + round;
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { pins } });
    airSeason(res).forEach((ep, i) => {
      const place = res.legs[i].place;
      legs++;
      if (PLACES[place]?.sacred) return;
      for (const sg of ep.segments) for (const x of sg.lines || []) {
        const t = String(x.text || '');
        // (a wedding chapel where the place has wedding chapels, Great Falls and the neon strip, is that place's own)
        const m = t.replace(NOT, '').match(SAYS);
        if (m && !JSON.stringify(PLACES[place] || {}).toLowerCase().includes(m[1].toLowerCase().replace(/s$/, ''))) hits.push(`${place}/${sg.stretch} ${sg.lineId}: ${t}`);
      }
    });
  }
}, 1800000);

describe('rr: a sacred place is named only where there is one', () => {
  it('no church, temple or sacred site in a leg without one', () => {
    expect(legs).toBeGreaterThan(40);
    expect(PLACES['home-city'].sacred).toBeFalsy();
    expect([...new Set(hits)].slice(0, 20)).toEqual([]);
  });
});
