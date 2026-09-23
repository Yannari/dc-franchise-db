// Movie Night on the Season Timeline (user: "when is movie night? there's
// no indication or twist schedulable"): booked, it moves to that night.
import { describe, it, expect } from 'vitest';
import { setPlayers } from '../js/core.js';
import { buildSchedule, withBookings } from '../js/pm/schedule.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const has = e => (e.rituals || []).includes('movie-night');

describe('booking Movie Night', () => {
  it('moves it: the booked night has it, its own night does not', () => {
    const base = buildSchedule({ bombshells: 6, casa: 4 });
    const home = base.find(has);
    expect(home).toBeTruthy();
    const target = base.find(e => e.moment === 'recoupling' && e.ep > 5);
    const out = withBookings(base, { [target.ep]: { rituals: ['movie-night'] } });
    expect(out.filter(has).map(e => e.ep)).toEqual([target.ep]);
  });
  it('the booked night plays it', () => {
    const cast = makeIslanders(22, 3); setPlayers(cast);
    const names = cast.map(p => p.name);
    const plain = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed: 3 }).rows;
    const target = plain.find(r => r.moment === 'recoupling' && r.num >= 8).num;
    setPlayers(makeIslanders(22, 3));
    const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed: 3, bookings: { [target]: { rituals: ['movie-night'] } } });
    const at = rows.filter(r => r.pm.events.some(e => e.kind === 'movie-clip')).map(r => r.num);
    expect(at).toEqual([target]);
  });
});
