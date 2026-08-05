// The Whacktivity is the one twist where the house is allowed to know things.
//
// Three labelled doors, walked through in front of everybody, so who wanted
// what is a FACT rather than a guess — which is the opposite of every other
// secret twist in this house. What stays hidden is whether anybody won, and
// who, and the suspect list being published in advance is what makes that
// interesting: five known names, at most one of them holding anything.
//
// So the guard is narrow and specific. The doors are fair game. The outcome
// never is.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { WHACKTIVITY_EVENTS } from '../js/bb-events/whacktivity.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = ['bb-whacktivity']) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
}

const whackBeats = ep => (ep.acts || []).flatMap(a => a.socialBeats || [])
  .filter(b => String(b.eventId || '').startsWith('whack-'));
const whackAct = ep => (ep.acts || []).find(a => a.type === 'whacktivity') || null;

const playDoors = () => {
  for (let seed = 1; seed <= 18; seed++) {
    house();
    const ep = withSeededRandom(seed * 59 + 13, () => simulateBBEpisode());
    if (whackAct(ep) && whackBeats(ep).length) return ep;
  }
  return null;
};

describe('the Whacktivity family', () => {
  beforeEach(() => house());

  it('is registered where the scheduler can reach it', () => {
    expect(WHACKTIVITY_EVENTS.length).toBeGreaterThanOrEqual(6);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of WHACKTIVITY_EVENTS) {
      expect(ids.has(e.id), `${e.id} is written but unreachable`).toBe(true);
    }
  });

  it('reacts to a night of doors', () => {
    const ep = playDoors();
    expect(ep, 'no Whacktivity week in 18 seeds produced a reaction').toBeTruthy();
    expect(whackBeats(ep).length).toBeGreaterThan(0);
  });

  it('never says anybody won anything', () => {
    let checked = 0;
    for (let seed = 1; seed <= 25; seed++) {
      house();
      const ep = withSeededRandom(seed * 59 + 13, () => simulateBBEpisode());
      const act = whackAct(ep);
      const beats = whackBeats(ep);
      if (!act || !beats.length) continue;
      const winners = (act.rooms || []).map(r => r.winner).filter(Boolean);
      checked += beats.length;
      for (const b of beats) {
        // Nothing in this family may report an outcome. The house watched
        // people go in; it did not watch anybody come out with something.
        expect(b.text, `${b.eventId} reported a win`)
          .not.toMatch(/\b(won it|has it now|came out with the|is holding the|now holds)\b/i);
        for (const w of winners) {
          for (const claim of [`${w} won`, `${w} has it`, `${w} got it`, `${w} holds`]) {
            expect(b.text, `${b.eventId} named the winner: "${claim}"`).not.toContain(claim);
          }
        }
      }
    }
    expect(checked, 'no Whacktivity beats were ever checked').toBeGreaterThan(0);
  });

  it('is allowed to name the doors, because everybody watched', () => {
    // The point of the twist, and the thing that separates it from the Den:
    // wanting is public. If the family never mentioned who walked where it
    // would be throwing away its only material.
    let named = 0;
    for (let seed = 1; seed <= 25 && !named; seed++) {
      house();
      const ep = withSeededRandom(seed * 59 + 13, () => simulateBBEpisode());
      const act = whackAct(ep);
      const beats = whackBeats(ep);
      if (!act || !beats.length) continue;
      const walkers = (act.rooms || []).flatMap(r => r.entrants || []);
      if (!walkers.length) continue;
      named = beats.filter(b => walkers.some(n => b.text.includes(n))).length;
    }
    expect(named, 'the family never once mentioned who walked through a door')
      .toBeGreaterThan(0);
  });

  it('adds no screen of its own', () => {
    house([]);
    const plain = withSeededRandom(4242, () => simulateBBEpisode());
    const plainHouse = (plain.acts || []).filter(a => a.type === 'house').length;
    let weeks = 0;
    for (let seed = 1; seed <= 18; seed++) {
      house();
      const ep = withSeededRandom(seed * 59 + 13, () => simulateBBEpisode());
      if (!whackAct(ep)) continue;
      weeks++;
      expect((ep.acts || []).filter(a => a.type === 'house').length,
        'a Whacktivity week grew an extra House Life stretch').toBeLessThanOrEqual(plainHouse);
    }
    expect(weeks, 'no Whacktivity week was produced to compare').toBeGreaterThan(0);
  });
});
