// The Coup is the loud one, so its family is the inverse of the others.
//
// Every other power family in this house is written around not knowing who did
// it. A Coup d'Etat is played standing up in the living room with a name
// attached — so there is nothing to conceal, and the test is not "does it keep
// the secret" but "does the house actually react to the single loudest thing
// that can happen to it".
//
// Before this, the coup moved bonds and stopped there: no strategic memory, so
// a dethroned Head of Household carried nothing into next week's targeting, and
// no event in the entire library knew a coup had happened.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { grantPower } from '../js/bb/powers.js';
import { COUP_EVENTS } from '../js/bb-events/coup.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { memoriesOf } from '../js/bb-events/_read.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [];
}

const coupBeats = ep => (ep.acts || []).flatMap(a => a.socialBeats || [])
  .filter(b => String(b.eventId || '').startsWith('coup-'));

function playCoup() {
  for (let seed = 1; seed <= 20; seed++) {
    house();
    grantPower('coup-d-etat', 'Millie', { week: 1, visibility: 'public', source: 'test' });
    const ep = withSeededRandom(seed * 31 + 5, () => simulateBBEpisode());
    const act = (ep.acts || []).find(a => a.type === 'power-played' && a.powerId === 'coup-d-etat');
    if (act && coupBeats(ep).length) return { ep, act };
  }
  return null;
}

describe('the Coup family', () => {
  beforeEach(house);

  it('is registered where the scheduler can reach it', () => {
    expect(COUP_EVENTS.length).toBeGreaterThanOrEqual(4);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of COUP_EVENTS) {
      expect(ids.has(e.id), `${e.id} is written but unreachable`).toBe(true);
    }
  });

  it('makes the house react to it at all', () => {
    const played = playCoup();
    expect(played, 'no coup in 20 seeds produced a single reaction').toBeTruthy();
    expect(coupBeats(played.ep).length).toBeGreaterThan(0);
  });

  it('names the person who did it, because everybody watched', () => {
    // The inverse of every other power family: concealing the holder here
    // would be wrong, not careful.
    const played = playCoup();
    expect(played, 'no coup to check').toBeTruthy();
    const { ep, act } = played;
    const named = coupBeats(ep).filter(b => (b.players || []).includes(act.holder));
    expect(named.length, 'not one reaction involved the person who played it')
      .toBeGreaterThan(0);
  });

  it('files it as a grievance the game can act on later', () => {
    const played = playCoup();
    expect(played, 'no coup to check').toBeTruthy();
    const { ep, act } = played;

    // The dethroned Head of Household remembers who did it.
    const hohMemories = memoriesOf(ep.hoh).filter(m => m.subject === act.holder);
    expect(hohMemories.some(m => m.type === 'coup-hijack'),
      'the HOH lost their week and filed nothing').toBe(true);

    // So does anybody seated by it.
    for (const name of act.nominees || []) {
      const mem = memoriesOf(name).filter(m => m.subject === act.holder);
      expect(mem.some(m => m.type === 'renomination'),
        `${name} was put up by ${act.holder} and filed nothing`).toBe(true);
    }
    // And the bond damage is real, not just narrated.
    expect(getBond(ep.hoh, act.holder)).toBeLessThan(0);
  });

  it('adds no screen of its own', () => {
    house();
    const plain = withSeededRandom(4242, () => simulateBBEpisode());
    const plainHouse = (plain.acts || []).filter(a => a.type === 'house').length;
    const played = playCoup();
    expect(played, 'no coup to check').toBeTruthy();
    expect((played.ep.acts || []).filter(a => a.type === 'house').length,
      'a coup week grew an extra House Life stretch').toBeLessThanOrEqual(plainHouse);
  });
});
