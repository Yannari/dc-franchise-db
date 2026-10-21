// The weather a place drifts across its shots (snow, dust motes, embers, sparks) is weather: it falls outside. The
// user, 2026-10-21, on Home City's stairwell and glass elevator: "and why is it snowing inside".
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { weatherOf, INDOOR, AMBIENT } from '../js/vp-rr-ep/steps.js';

const shot = (place, f) => ({ kind: 'world', place, plate: { f } });

describe('rr viewer: weather', () => {
  it('falls on an outdoor shot of a place that has it', () => {
    expect(weatherOf(shot('home-city', 'arrive-9434588'))).toBe('mote');
    expect(weatherOf(shot('rock-north', 'present-9440796'))).toBe('snow');
  });
  it('never falls indoors: the stairwell, the elevator, the sauna, the tomb', () => {
    for (const [place, f] of [['home-city', 'task-9434855'], ['home-city', 'task-9434868'], ['home-city', 'task-9434876'],
      ['rock-north', 'task-9440800'], ['tomb-sands', 'task-22409901']]) expect(weatherOf(shot(place, f)), `${place}/${f}`).toBe(null);
  });
  it('follows the plate a shot borrows from another place', () => {
    expect(weatherOf({ kind: 'world', place: 'neon-desert', plate: { f: 'task-9434855', place: 'home-city' } })).toBe(null);
  });
  it('lists only plates that exist, at places that have weather', () => {
    for (const k of INDOOR) {
      const [place, f] = k.split('/');
      expect(AMBIENT[place], k).toBeTruthy();
      expect(existsSync(`assets/sets/rr/${place}/${f}.webp`), k).toBe(true);
    }
  });
  it('has no weather on a map, an interview or a title over nothing', () => {
    expect(weatherOf({ kind: 'map', place: 'rock-north' })).toBe(null);
    expect(weatherOf({ kind: 'iv', place: 'rock-north' })).toBe(null);
  });
});
