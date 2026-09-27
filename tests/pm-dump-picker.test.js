// The Season Timeline's Dumps picker (user: "should I have a possibility to
// choose if an episode has a dump … connected to the season timeline"):
// "Nobody Goes Home" and "Somebody Goes Home" on a recoupling or a vote night.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function season(seed, bookings = {}) {
  const cast = makeIslanders(22, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  return playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed, bookings }).rows;
}
const dumpedOn = r => (r.exits || []).filter(x => x.verb === 'dumped').length;

describe('the Dumps picker', () => {
  it('"Nobody Goes Home" keeps everyone on a night that would have dumped', () => {
    let checked = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const plain = season(seed);
      const night = plain.find(r => (r.moment === 'public-vote' || r.moment === 'recoupling') && !r.pm.coupled && dumpedOn(r) > 0
        && !r.pm.events.some(e => e.kind === 'final-recoupling'));
      if (!night) continue;
      const booked = season(seed, { [night.num]: { dumping: 'none' } });
      expect(dumpedOn(booked.find(r => r.num === night.num)), `s${seed} e${night.num}`).toBe(0);
      // …and the season still reaches a final.
      expect(booked.some(r => r.moment === 'final')).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThan(4);
  });
  it('"Somebody Goes Home" dumps on a vote night that would have been safe', () => {
    let checked = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const plain = season(seed);
      const night = plain.find(r => r.moment === 'public-vote' && !r.pm.coupled && dumpedOn(r) === 0 && (r.pm.couples || []).length >= 3);
      if (!night) continue;
      const booked = season(seed, { [night.num]: { dumping: 'always' } });
      expect(dumpedOn(booked.find(r => r.num === night.num)), `s${seed} e${night.num}`).toBeGreaterThan(0);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});
