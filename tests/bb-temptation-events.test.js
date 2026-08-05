// The Den's family has to work without ever knowing who went in.
//
// One houseguest is offered power for nothing, a houseguest drawn at random
// pays for it, and the house is told a curse landed and never told whose fault
// it was. The twist already models the blame — week.temptation.guesses is the
// room's verdict, right or wrong — so the events read that rather than forming
// a second opinion with better information than the house has.
//
// These tests hold the two things that would end the twist: naming the person
// who accepted, and naming what they took.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { BB_POWER_DEFINITIONS } from '../js/bb/powers.js';
import { TEMPTATION_EVENTS } from '../js/bb-events/temptation.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = ['bb-den-of-temptation']) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
}

const denBeats = ep => (ep.acts || []).flatMap(a => a.socialBeats || [])
  .filter(b => String(b.eventId || '').startsWith('temptation-'));
// The Den's truth lives on its act, not on the episode record — the episode
// deliberately carries no field naming the person who went in.
const denAct = ep => (ep.acts || []).find(a => a.type === 'temptation') || null;

/** Play until a Den week actually produced reactions. */
const playDen = () => {
  for (let seed = 1; seed <= 16; seed++) {
    house();
    const ep = withSeededRandom(seed * 67 + 11, () => simulateBBEpisode());
    if (denAct(ep)?.entrant && denBeats(ep).length) return ep;
  }
  return null;
};

describe('the Den family', () => {
  beforeEach(() => house());

  it('is registered where the scheduler can reach it', () => {
    expect(TEMPTATION_EVENTS.length).toBeGreaterThanOrEqual(6);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of TEMPTATION_EVENTS) {
      expect(ids.has(e.id), `${e.id} is written but unreachable`).toBe(true);
    }
  });

  it('reacts to a Den week', () => {
    const ep = playDen();
    expect(ep, 'no Den week in 16 seeds produced a reaction').toBeTruthy();
    expect(denBeats(ep).length).toBeGreaterThan(0);
  });

  it('never says who went in, or what they took', () => {
    const powerWords = Object.values(BB_POWER_DEFINITIONS).map(d => d.name);
    let checked = 0;
    for (let seed = 1; seed <= 25; seed++) {
      house();
      const ep = withSeededRandom(seed * 67 + 11, () => simulateBBEpisode());
      const entrant = denAct(ep)?.entrant;
      const beats = denBeats(ep);
      if (!entrant || !beats.length) continue;
      checked += beats.length;
      for (const b of beats) {
        // The prize is invisible to the house.
        for (const word of [...powerWords, 'Diamond', 'Coup', 'Bonus Life']) {
          expect(b.text, `${b.eventId} named the prize "${word}"`).not.toContain(word);
        }
        // And so is the identity — but only as a CLAIM. Naming the entrant is
        // fine and necessary: they live here, and the best scene in the family
        // is somebody asking them who they think took it. What may never
        // appear is the entrant as the subject of accepting.
        if (!b.text.includes(entrant)) continue;
        const claims = [
          `${entrant} took`, `${entrant} accepted`, `${entrant} said yes`,
          `${entrant} went in`, `${entrant} is the one`, `${entrant} had taken`,
          `${entrant} has taken`, `${entrant} agreed`,
        ];
        for (const claim of claims) {
          expect(b.text, `${b.eventId} states that ${entrant} accepted: "${claim}"`)
            .not.toContain(claim);
        }
      }
    }
    expect(checked, 'no Den beats were ever checked').toBeGreaterThan(0);
  });

  it('blames through the house\'s own guesses, not the truth', () => {
    // The room's verdict is allowed to be wrong; an event that quietly used
    // the real entrant would make the house right every time.
    let wrongSeen = 0;
    for (let seed = 1; seed <= 25 && !wrongSeen; seed++) {
      house();
      const ep = withSeededRandom(seed * 67 + 11, () => simulateBBEpisode());
      const t = denAct(ep);
      if (!t?.guesses?.length) continue;
      const wrong = t.guesses.find(g => !g.correct);
      if (!wrong) continue;
      const beats = denBeats(ep).filter(b => (b.players || []).includes(wrong.guess));
      if (!beats.length) continue;
      wrongSeen++;
      // Somebody innocent is carrying it, and the bond ledger says so.
      expect(Number.isFinite(getBond(wrong.who, wrong.guess))).toBe(true);
      expect(wrong.guess).not.toBe(t.entrant);
    }
    expect(wrongSeen, 'no week produced a wrongly-blamed houseguest to check')
      .toBeGreaterThan(0);
  });

  it('adds no screen of its own', () => {
    house([]);
    const plain = withSeededRandom(4242, () => simulateBBEpisode());
    const plainHouse = (plain.acts || []).filter(a => a.type === 'house').length;
    let denWeeks = 0;
    for (let seed = 1; seed <= 16; seed++) {
      house();
      const ep = withSeededRandom(seed * 67 + 11, () => simulateBBEpisode());
      if (!denAct(ep)?.entrant) continue;
      denWeeks++;
      const denHouse = (ep.acts || []).filter(a => a.type === 'house').length;
      expect(denHouse, 'a Den week grew an extra House Life stretch')
        .toBeLessThanOrEqual(plainHouse);
    }
    expect(denWeeks, 'no Den week was produced to compare').toBeGreaterThan(0);
  });
});
