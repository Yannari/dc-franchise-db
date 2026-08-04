// The power shelf.
//
// The architecture always separated a POWER (a rule object with a lifecycle)
// from the DISTRIBUTOR that hands it out — the Diamond Veto is the same power
// whether a competition awarded it in public or Pandora's Box slipped it to
// somebody. That separation was correct and completely untested, because the
// registry held exactly one power and three of the eight declared acquisition
// channels were ever used. Pandora's Box was a container with one thing to put
// in it.
//
// These are the three that prove the lifecycle generalises, each firing at a
// different moment of the week:
//
//   the-cloud    before the nomination ceremony  (preventative, one ceremony)
//   coup-d-etat  after the veto ceremony         (overrules the whole block)
//   bonus-life   eviction night                  (a chance to come back)
//
// Real rules, off the wiki, and two of them are not what they sound like: the
// Cloud does NOT cover the week — use it on nomination day and you are still a
// legal replacement at the veto ceremony — and Bonus Life is not immunity, it
// is a competition to come back with.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { BB_POWER_DEFINITIONS, grantPower, heldPowers } from '../js/bb/powers.js';
import { BB_TWIST_CONTRACTS, POWER_ACQUISITION_CHANNELS } from '../js/bb/twist-contract.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
}

const play = (seed = 2026) => withSeededRandom(seed, () => simulateBBEpisode());
const actOf = (ep, type) => (ep.acts || []).find(a => a.type === type);
const played = (ep, id) => (ep.acts || []).find(a => a.type === 'power-played' && a.powerId === id);

describe('the shelf has more than one thing on it', () => {
  beforeEach(() => house());

  it('holds four powers, each with its own moment in the week', () => {
    const ids = Object.keys(BB_POWER_DEFINITIONS);
    expect(ids).toEqual(expect.arrayContaining(
      ['diamond-veto', 'coup-d-etat', 'the-cloud', 'bonus-life']));
    // Different timings, or the lifecycle has not been proven to generalise —
    // it has only been proven to work for a Diamond-Veto-shaped power.
    const timings = new Set(ids.map(id => {
      const t = BB_POWER_DEFINITIONS[id].useTiming;
      return typeof t === 'string' ? t : t.public;
    }));
    expect(timings.size, 'every power fires at the same moment').toBeGreaterThan(2);
  });

  it('Pandora’s Box is a container with a real choice of cargo', () => {
    // It was never hard-wired to the Diamond Veto — the shelf simply had one
    // item on it. Anything in the registry can be the prize.
    for (const id of ['the-cloud', 'coup-d-etat', 'bonus-life']) {
      expect(BB_POWER_DEFINITIONS[id], `${id} cannot be put in the box`).toBeTruthy();
    }
  });
});

describe('The Cloud', () => {
  beforeEach(() => house());

  it('takes its holder off the nomination ceremony, and no further', () => {
    let proved = 0;
    for (const seed of [2026, 77, 4242, 31, 909]) {
      house();
      const ep = withSeededRandom(seed, () => {
        // Granted to somebody who is not about to hold the room.
        const target = NAMES[3];
        grantPower('the-cloud', target, { week: 1, visibility: 'holder-secret', source: 'test' });
        return simulateBBEpisode();
      });
      const act = played(ep, 'the-cloud');
      if (!act) continue;
      proved++;
      // Safe at the ceremony it was spent on.
      expect(ep.initialNominees, `${act.holder} spent the Cloud and was nominated anyway`)
        .not.toContain(act.holder);
      // And NOT safe afterwards: the power is spent, so nothing is protecting
      // them from the replacement chair.
      expect(heldPowers(act.holder, 'the-cloud'), 'the Cloud survived being used')
        .toHaveLength(0);
    }
    expect(proved, 'the Cloud never fired in any seeded week').toBeGreaterThan(0);
  });
});

describe("The Coup d'Etat", () => {
  beforeEach(() => house());

  it('overrules the block, and cannot touch the two who earned their safety', () => {
    let proved = 0;
    for (const seed of [2026, 77, 4242, 31, 909, 1301, 58]) {
      house();
      const ep = withSeededRandom(seed, () => {
        grantPower('coup-d-etat', NAMES[5], { week: 1, visibility: 'secret', source: 'test' });
        return simulateBBEpisode();
      });
      const act = played(ep, 'coup-d-etat');
      if (!act) continue;
      proved++;
      const veto = actOf(ep, 'veto');
      // The two names it may never put up.
      expect(act.nominees, 'the coup nominated the Head of Household').not.toContain(ep.hoh);
      if (veto?.winner) {
        expect(act.nominees, 'the coup nominated the veto holder').not.toContain(veto.winner);
      }
      // Two up, two down, and the block afterwards is the coup's block.
      expect(act.nominees).toHaveLength(2);
      expect([...ep.finalNominees].sort()).toEqual([...act.nominees].sort());
      expect(act.holder).not.toBe(ep.hoh);
    }
    expect(proved, "the Coup never fired in any seeded week").toBeGreaterThan(0);
  });

  it('costs the Head of Household something for being overruled in public', () => {
    for (const seed of [2026, 77, 4242, 31, 909, 1301, 58]) {
      house();
      const ep = withSeededRandom(seed, () => {
        grantPower('coup-d-etat', NAMES[5], { week: 1, visibility: 'secret', source: 'test' });
        return simulateBBEpisode();
      });
      const act = played(ep, 'coup-d-etat');
      if (!act) continue;
      // The people taken off the block and the people put on it do not feel
      // the same way about the person who did it.
      const saved = act.removed?.[0];
      const named = act.nominees?.[0];
      if (!saved || !named) continue;
      expect(getBond(saved, act.holder), 'being saved by the coup cost the saver nothing')
        .toBeGreaterThan(getBond(named, act.holder));
      return;
    }
    throw new Error('no seeded week produced a coup to check');
  });
});

describe('The App Store', () => {
  beforeEach(() => house(['bb-app-store']));

  it('is a distributor on a channel nothing had ever used', () => {
    expect(BB_TWIST_CONTRACTS['bb-app-store']).toBeTruthy();
    expect(BB_TWIST_CONTRACTS['bb-app-store'].acquisition.channel).toBe('audience');
    expect(POWER_ACQUISITION_CHANNELS).toContain('audience');
    // A distributor changes who holds what, not how the week is played.
    expect(Object.keys(BB_TWIST_CONTRACTS['bb-app-store'].rules)).toHaveLength(0);
  });

  it('hands out powers nobody competed for, in secret', () => {
    const ep = play();
    const act = actOf(ep, 'app-store');
    expect(act, 'the app store never opened').toBeTruthy();
    expect(act.secret).toBe(true);
    expect(act.winners.length, 'nothing came off the shelf').toBeGreaterThan(0);

    for (const w of act.winners) {
      expect(ep.houseAtStart).toContain(w.name);
      expect(BB_POWER_DEFINITIONS[w.powerId], `${w.powerId} is not a real power`).toBeTruthy();
    }
    // Nobody gets two.
    const names = act.winners.map(w => w.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('the audience votes for who it has been watching', () => {
    // Screen time is the only currency here, and that is the point of the
    // twist: the powers land on the most WATCHED houseguests rather than the
    // best ones. Loaded heavily so this reads the weighting, not the noise.
    let favouredWins = 0, runs = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      house(['bb-app-store']);
      const ep = withSeededRandom(seed, () => {
        gs.popularity = { [NAMES[7]]: 60 };
        return simulateBBEpisode();
      });
      const act = actOf(ep, 'app-store');
      if (!act) continue;
      runs++;
      if (act.winners.some(w => w.name === NAMES[7])) favouredWins++;
    }
    expect(runs, 'the app store never ran').toBeGreaterThan(0);
    expect(favouredWins / runs, 'screen time did not move the vote at all')
      .toBeGreaterThan(0.5);
  });
});
