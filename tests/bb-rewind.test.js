// The Rewind.
//
// BB16: a gold button with nothing written on it, a timer nobody understood,
// and then the eviction stopping mid-vote and the whole week being taken back.
//
// The thing that makes it a different power from the Halting Hex — which also
// cancels an eviction — is the REIGN. The Hex stops the night and leaves the
// week standing. This erases the week, so the Head of Household who built that
// block starts the next one from the same line as the people they nominated.
// If that is not true, this is a Hex with a bigger name.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig, setGs, setPlayers } from '../js/core.js';
import { addBond, getBond } from '../js/bonds.js';
import { grantPower, BB_POWER_DEFINITIONS } from '../js/bb/powers.js';
import { resolveRewind, rewindPull, selfExposure } from '../js/bb/rewind.js';

const H = ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay', 'gus', 'hana'];
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const flat = over => Object.fromEntries(STAT_KEYS.map(k => [k, over?.[k] ?? 5]));

const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

function house() {
  setPlayers(H.map(name => ({ name, archetype: 'floater', gender: 'f', sexuality: 'straight',
    stats: flat({ boldness: 8 }) })));
  setGs({ bb: { powers: [], weeks: [], stats: {}, outgoingHoh: 'ana' },
    activePlayers: [...H], bonds: {}, namedAlliances: [] });
  seasonConfig.format = 'big-brother';
  seasonConfig.jurySize = 3;
}

const grant = (who = 'ben', week = 2) =>
  grantPower('rewind-button', who, { week, visibility: 'secret', source: 'test' });

const run = over => resolveRewind({
  week: { num: 2 }, evicted: 'cleo', nominees: ['cleo', 'dev'], hoh: 'ana', house: H,
  ballots: [{ voter: 'eli', voted: 'cleo' }, { voter: 'fay', voted: 'cleo' }],
  rng: () => 0, ...over,
});

describe('it takes the week, not just the night', () => {
  beforeEach(() => house());

  it('is on the shelf with an eviction-night timing', () => {
    const def = BB_POWER_DEFINITIONS['rewind-button'];
    expect(def, 'the Rewind is not on the power shelf').toBeTruthy();
    expect(def.useTiming).toBe('eviction-night');
    expect(def.rules.rewindWeek).toBe(true);
    // The catch is the point of the power and belongs on the screen.
    expect(def.catch).toMatch(/read/i);
  });

  it('stops the eviction and empties the block', () => {
    grant();
    const out = run();
    expect(out, 'it did not fire at all').toBeTruthy();
    expect(out.spared).toBe('cleo');
    expect(out.deposed).toBe('ana');
    expect(out.beats.length).toBeGreaterThan(2);
  });

  it('declines when nobody is leaving, rather than spending itself', () => {
    // The Halting Hex resolves first at the same seam. A Rewind spent on an
    // eviction that is not happening is the "do not waste the power" fault this
    // shelf has been fixed for twice already.
    grant();
    expect(run({ evicted: null })).toBeNull();
    expect(gs.bb.powers[0].used).toBeFalsy();
  });

  it('publishes every ballot, which is the price', () => {
    // Reading the votes is not theatre. The people named are still in the house
    // and are about to be eligible for Head of Household.
    house();
    gs.namedAlliances = [{ name: 'The Committee', members: ['eli', 'cleo'], active: true }];
    addBond('eli', 'cleo', 7);
    grant();
    const before = getBond('cleo', 'eli');
    const out = run();
    expect(out.exposed.map(e => e.voter)).toContain('eli');
    expect(getBond('cleo', 'eli'), 'an ally voted them out in public and it cost nothing')
      .toBeLessThan(before);
  });

  it('leaves a stranger’s vote alone', () => {
    // Everybody's ballot becomes KNOWN; only a betrayal costs anything. A model
    // that punishes every vote turns one twist into eight grudges.
    house();
    grant();
    const before = getBond('cleo', 'fay');
    run();
    expect(getBond('cleo', 'fay')).toBe(before);
  });

  it('does not want it when the holder is the Head of Household', () => {
    // Rewinding your own week throws away your own crown. Both holders are
    // sworn to the person leaving — otherwise there is no need to reduce and
    // both answers floor out at the same number, which measures nothing.
    house();
    gs.namedAlliances = [{ name: 'The Committee', members: ['ana', 'ben', 'cleo'], active: true }];
    const asHoh = rewindPull({ holder: 'ana', evicted: 'cleo', hoh: 'ana', weeksLeft: 2,
      ballots: [] });
    const asAnyone = rewindPull({ holder: 'ben', evicted: 'cleo', hoh: 'ana', weeksLeft: 2,
      ballots: [] });
    expect(asAnyone, 'an ally on the way out is not worth a rewind at all').toBeGreaterThan(0.2);
    expect(asHoh).toBeLessThan(asAnyone);
  });

  it('saves its own holder without hesitating', () => {
    house();
    expect(rewindPull({ holder: 'ben', evicted: 'ben', hoh: 'ana', weeksLeft: 2, ballots: [] }))
      .toBeGreaterThan(0.9);
  });

  it('weighs the holder’s own ballot against using it', () => {
    // The decision nothing else on the shelf makes: reading the votes publishes
    // the holder too, so a houseguest who flipped this week is buying a rewind
    // with their own reputation.
    house();
    // ben is sworn to BOTH: to dev, who is leaving and worth saving, and to
    // cleo, whom he voted against this week. Saving one publishes the other.
    gs.namedAlliances = [{ name: 'The Committee', members: ['ben', 'cleo', 'dev'], active: true }];
    addBond('ben', 'cleo', 8);
    addBond('ben', 'dev', 8);
    const flipped = [{ voter: 'ben', voted: 'cleo' }];
    expect(selfExposure('ben', flipped)).toBeGreaterThan(0.3);
    const exposedPull = rewindPull({ holder: 'ben', evicted: 'dev', hoh: 'ana', weeksLeft: 2, ballots: flipped });
    const cleanPull = rewindPull({ holder: 'ben', evicted: 'dev', hoh: 'ana', weeksLeft: 2, ballots: [] });
    expect(cleanPull, 'nothing to reduce, so this measures nothing').toBeGreaterThan(0.2);
    expect(exposedPull).toBeLessThan(cleanPull);
    // But never enough to make somebody accept their own eviction.
    expect(rewindPull({ holder: 'ben', evicted: 'ben', hoh: 'ana', weeksLeft: 2, ballots: flipped }))
      .toBeGreaterThan(0.9);
  });
});
