// What the veto ceremony costs.
//
// It cost one thing: a debt recorded when somebody was saved. That was the
// entire social footprint of the most-used power in the format. Not using it
// cost nothing — a nominee sat in that chair while the one person who could
// have moved them did nothing, and their relationship did not shift by a point.
// The replacement felt nothing about being seated. A Head of Household could
// watch their target walk off the block and carry no grievance out of the room.
//
// The asymmetry was the tell: `shouldUseVeto` READ perceived bonds, obligation,
// fear of the HOH, alliance ties and the size of the replacement pool, and
// wrote back one line.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig, setGs, setPlayers } from '../js/core.js';
import { addBond, getBond } from '../js/bonds.js';
import { applyVetoFallout, planDamage, saveExpectation } from '../js/bb/veto-fallout.js';
import { throwLiteracy, throwPressure, shouldThrowVeto } from '../js/bb/strategy.js';

const H = ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay', 'gus', 'hana'];
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const flat = over => Object.fromEntries(STATS.map(k => [k, over?.[k] ?? 5]));

const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

function seat(overrides = {}) {
  setPlayers(H.map(name => ({
    name, archetype: 'floater', gender: 'f', sexuality: 'straight',
    stats: flat(overrides[name]),
  })));
  setGs({ bb: { powers: [], weeks: [], stats: {} }, activePlayers: [...H], bonds: {},
    namedAlliances: [] });
  seasonConfig.format = 'big-brother';
}

const run = over => applyVetoFallout({
  week: { num: 3 }, holder: 'ben', hoh: 'ana', house: H,
  decision: { use: false, save: null },
  priorBlock: ['cleo', 'dev'], nominees: ['cleo', 'dev'],
  plan: { target: 'cleo' }, rng: seeded(7), ...over,
});

describe('leaving somebody on the block is a decision', () => {
  beforeEach(() => seat());

  it('costs the holder their alliance-mate, and costs a stranger nothing', () => {
    // The biggest social moment of a Big Brother week, and it did nothing.
    gs.namedAlliances = [{ name: 'The Committee', members: ['ben', 'cleo'], active: true }];
    addBond('ben', 'cleo', 6);
    const before = getBond('ben', 'cleo');
    const strangerBefore = getBond('ben', 'dev');

    const out = run();
    expect(getBond('ben', 'cleo'), 'an alliance-mate left on the block felt nothing')
      .toBeLessThan(before);
    // dev is nobody to ben. Nobody resents a stranger for not spending a veto
    // on them, and a model that punishes it makes every week a grudge.
    expect(getBond('ben', 'dev')).toBe(strangerBefore);
    expect(out.resented).toContain('cleo');
    expect(out.resented).not.toContain('dev');
  });

  it('blames nobody when the rules made the decision', () => {
    // With no eligible replacement there was no choice to make. `house` here is
    // the block plus the two people who cannot be seated.
    gs.namedAlliances = [{ name: 'The Committee', members: ['ben', 'cleo'], active: true }];
    addBond('ben', 'cleo', 6);
    const before = getBond('ben', 'cleo');
    const out = run({ house: ['ana', 'ben', 'cleo', 'dev'] });
    expect(getBond('ben', 'cleo')).toBe(before);
    expect(out.resented).toEqual([]);
  });

  it('goes easier on a holder who saved themselves', () => {
    gs.namedAlliances = [{ name: 'The Committee', members: ['ben', 'cleo'], active: true }];
    const shared = { nominee: 'cleo', holder: 'ben', replacementPool: ['eli', 'fay', 'gus'] };
    const passedOver = saveExpectation({ ...shared, decision: { use: true, save: 'hana' } });
    const selfSave = saveExpectation({ ...shared, decision: { use: true, save: 'ben' } });
    expect(selfSave).toBeGreaterThan(0);
    expect(selfSave, 'saving yourself was judged as harshly as picking somebody else')
      .toBeLessThan(passedOver);
  });
});

describe('the Head of Household only minds when it actually cost them', () => {
  beforeEach(() => seat());

  // The distinction the whole thing turns on. A veto being used is not the same
  // as a plan being wrecked: if the person who came down was a pawn and the
  // target is still sitting there, the week ends where it was always going to
  // end and the HOH does not care.
  it('reads the target walking off the block as the whole of the damage', () => {
    expect(planDamage({
      decision: { use: true, save: 'cleo' }, priorBlock: ['cleo', 'dev'],
      nominees: ['dev', 'eli'], plan: { target: 'cleo' }, hoh: 'ana', holder: 'ben',
    })).toBe(1);
  });

  it('barely registers a pawn swapped for a pawn', () => {
    const damage = planDamage({
      decision: { use: true, save: 'dev' }, priorBlock: ['cleo', 'dev'],
      nominees: ['cleo', 'eli'], plan: { target: 'cleo' }, hoh: 'ana', holder: 'ben',
    });
    expect(damage, 'the HOH raged over a week that landed exactly where they wanted')
      .toBeLessThan(0.2);
  });

  it('moves the bond on the week it was wrecked and not on the week it was not', () => {
    seat();
    const wrecked = getBond('ana', 'ben');
    run({ decision: { use: true, save: 'cleo' }, nominees: ['dev', 'eli'],
      replacement: 'eli', plan: { target: 'cleo' } });
    const afterWreck = getBond('ana', 'ben');
    expect(afterWreck).toBeLessThan(wrecked);

    seat();
    const quiet = getBond('ana', 'ben');
    run({ decision: { use: true, save: 'dev' }, nominees: ['cleo', 'eli'],
      replacement: 'eli', plan: { target: 'cleo' } });
    expect(getBond('ana', 'ben'), 'the HOH held a grudge over a swapped pawn').toBe(quiet);
  });

  it('says out loud that it did not matter, rather than saying nothing', () => {
    // "The veto was used and the Head of Household did not mind" is a real
    // outcome; with no card for it the screen reads like an omission.
    const out = run({ decision: { use: true, save: 'dev' }, nominees: ['cleo', 'eli'],
      replacement: 'eli', plan: { target: 'cleo' } });
    expect(out.beats.map(b => b.badgeText)).toContain('NO REAL DAMAGE');
  });
});

describe('the chair nobody volunteered for', () => {
  beforeEach(() => seat());

  it('is held against the person who named them', () => {
    const before = getBond('eli', 'ana');
    const out = run({ decision: { use: true, save: 'cleo' }, nominees: ['dev', 'eli'],
      replacement: 'eli' });
    expect(getBond('eli', 'ana'), 'being seated as a replacement cost nobody anything')
      .toBeLessThan(before);
    expect(out.beats.map(b => b.badgeText)).toContain('AND ONE MORE');
  });

  it('is held against the person whose rescue emptied it, but less', () => {
    const hohBefore = getBond('eli', 'ana');
    const savedBefore = getBond('eli', 'cleo');
    run({ decision: { use: true, save: 'cleo' }, nominees: ['dev', 'eli'], replacement: 'eli' });
    const atHoh = hohBefore - getBond('eli', 'ana');
    const atSaved = savedBefore - getBond('eli', 'cleo');
    expect(atSaved).toBeGreaterThan(0);
    expect(atSaved, 'the replacement blamed the rescued more than the one who seated them')
      .toBeLessThan(atHoh);
  });
});

describe('you have to be able to see the reason to throw', () => {
  it('never lets a clueless challenge beast sandbag a competition', () => {
    seat({ gus: { strategic: 2, mental: 2, intuition: 3, physical: 10, endurance: 10 },
      hana: { strategic: 9, mental: 8, intuition: 8 } });
    const clueless = throwLiteracy('gus');
    const reader = throwLiteracy('hana');
    expect(clueless, 'a player who cannot read the game was throwing comps like a veteran')
      .toBeLessThan(0.12);
    expect(reader).toBeGreaterThan(0.6);
    expect(reader / Math.max(clueless, 0.001)).toBeGreaterThan(5);
  });

  it('goes quiet as the house tightens', () => {
    // Nobody puts their game in jeopardy when it is not necessary, and the
    // later it gets the less necessary it ever is. At final five every
    // competition is survival.
    expect(throwPressure(new Array(12).fill('x'))).toBe(1);
    expect(throwPressure(new Array(8).fill('x'))).toBeLessThan(1);
    expect(throwPressure(new Array(6).fill('x'))).toBeLessThan(0.2);
    expect(throwPressure(new Array(5).fill('x'))).toBe(0);
  });

  it('applies both brakes to the veto, which nobody on the block ever throws', () => {
    seat({ gus: { strategic: 2, mental: 2, intuition: 3 },
      hana: { strategic: 9, mental: 8, intuition: 8, boldness: 2 } });
    const ctx = { nominees: ['cleo', 'dev'], hoh: 'ana', house: H };
    expect(shouldThrowVeto('cleo', ctx).throwChance, 'a nominee threw the one thing that saves them')
      .toBe(0);
    expect(shouldThrowVeto('gus', ctx).throwChance)
      .toBeLessThan(shouldThrowVeto('hana', ctx).throwChance);
    // And the same reader, at final five, does not do it at all.
    const late = ['ana', 'cleo', 'dev', 'gus', 'hana'];
    expect(shouldThrowVeto('hana', { ...ctx, house: late }).throwChance).toBe(0);
  });
});
