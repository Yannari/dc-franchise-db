// Quits and expulsions, in both shows.
//
// seasonConfig.qem — "Quits, Expulsions & Medical Evacuations" — sat on the
// setup page being read by nothing at all. The medevacs that did happen came
// from the survival system, not from that switch. The mechanic was written for
// the house first; this is the shared version, and these cover that the
// checkbox now does something in Total Drama without disturbing a season that
// leaves it off.
import { describe, expect, it } from 'vitest';
import { players, seasonConfig } from '../js/core.js';
import { rollDeparture, departureText } from '../js/departures.js';
import { setBond } from '../js/bonds.js';
import { seedGame } from './helpers/setup.js';
import { seededRandom } from './helpers/rng.js';

const CAST = ['A','B','C','D','E','F','G','H','I','J']
  .map((name, i) => ({
    name, gender: 'm', sexuality: 'straight',
    archetype: ['mastermind','hothead','floater','villain','hero','goat'][i % 6],
  }));

const seed = () => seedGame(CAST, { episode: 4, eliminated: [], namedAlliances: [] });

describe('the departure roll', () => {
  it('never fires when the season has it off', () => {
    seed();
    const rng = seededRandom(1);
    for (let i = 0; i < 500; i++) {
      expect(rollDeparture(CAST.map(c => c.name), { mode: 'off', rng })).toBeNull();
    }
  });

  it('never fires in a cast too small to lose anybody', () => {
    seed();
    const rng = seededRandom(2);
    for (let i = 0; i < 500; i++) {
      expect(rollDeparture(['A', 'B', 'C', 'D'], { mode: 'often', rng })).toBeNull();
    }
  });

  it('fires at a rate that rises with the setting', () => {
    const rate = mode => {
      seed();
      const rng = seededRandom(7);
      let hits = 0;
      for (let i = 0; i < 4000; i++) {
        if (rollDeparture(CAST.map(c => c.name), { mode, rng, round: 5 })) hits++;
      }
      return hits / 4000;
    };
    const rare = rate('rare'), occasional = rate('occasional'), often = rate('often');
    expect(rare).toBeGreaterThan(0);
    expect(occasional).toBeGreaterThan(rare);
    expect(often).toBeGreaterThan(occasional);
    // Still rare enough that a season is not a series of walkouts.
    expect(often).toBeLessThan(0.2);
  });

  it('walks the person actually under pressure, not a random name', () => {
    seed();
    // B is a hothead with the worst temperament in the cast; put them on slop
    // and on the block and they should be the one who breaks.
    players.forEach(p => { p.stats.temperament = 8; p.stats.boldness = 8; });
    players.find(p => p.name === 'B').stats.temperament = 1;
    players.find(p => p.name === 'B').stats.boldness = 1;
    const rng = seededRandom(3);
    const names = new Set();
    for (let i = 0; i < 300; i++) {
      const d = rollDeparture(CAST.map(c => c.name), {
        mode: 'often', rng, round: 9, atRisk: ['B'], deprived: ['B'],
      });
      if (d?.kind === 'walkout') names.add(d.name);
    }
    expect([...names]).toEqual(['B']);
  });

  it('only expels somebody who has a real enemy', () => {
    seed();
    // Everybody neutral: nobody has anyone to swing at, so no expulsions.
    const rng = seededRandom(4);
    let expulsions = 0;
    for (let i = 0; i < 2000; i++) {
      if (rollDeparture(CAST.map(c => c.name), { mode: 'often', rng })?.kind === 'expulsion') expulsions++;
    }
    expect(expulsions).toBe(0);

    // Give two of them genuine bad blood and it becomes possible.
    setBond('B', 'D', -10);
    const rng2 = seededRandom(4);
    let withEnemy = 0;
    for (let i = 0; i < 2000; i++) {
      const d = rollDeparture(CAST.map(c => c.name), { mode: 'often', rng: rng2 });
      if (d?.kind === 'expulsion') {
        withEnemy++;
        expect(['B', 'D']).toContain(d.name);
        expect(d.other).toBeTruthy();
      }
    }
    expect(withEnemy).toBeGreaterThan(0);
  });

  it('writes a line that says which of the two it was', () => {
    expect(departureText({ name: 'A', kind: 'walkout' })).toContain('walks');
    expect(departureText({ name: 'A', kind: 'expulsion', other: 'B' })).toContain('removed');
    expect(departureText({ name: 'A', kind: 'expulsion', other: 'B' })).toContain('B');
    for (const kind of ['walkout', 'expulsion']) {
      expect(departureText({ name: 'A', kind, other: 'B' })).toContain('no vote tonight');
    }
  });
});

describe('the Total Drama switch', () => {
  it('defaults to off, so existing seasons are unchanged', () => {
    expect(seasonConfig.qem === true).toBe(false);
  });
});
