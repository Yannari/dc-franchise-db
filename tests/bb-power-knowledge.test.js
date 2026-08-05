// Knowing somebody holds a power is leverage, and it never used to be.
//
// Before this, `gs.bb.powers` was read by exactly nobody outside the twists
// that granted and fired them. The threat model, the nomination plans, the
// knowledge layer and the whole event catalogue were blind to it — so a
// houseguest openly holding a game-changer was rated exactly as dangerous as
// one holding nothing, including on PUBLIC grants where the house had been
// told outright who had it.
//
// The rule the fix has to respect: only what is genuinely known may count. A
// secret power must move nothing, or the house is acting on information it was
// never given.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { bbThreat, bbThreatProfile, knownPowerWeight } from '../js/bb/shared-strategy.js';
import { grantPower, usePower } from '../js/bb/powers.js';
import { POWER_KNOWLEDGE_EVENTS } from '../js/bb-events/power-knowledge.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';

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
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
  gs.bb ||= {};
  gs.bb.powers = [];
}

describe('power knowledge as leverage', () => {
  beforeEach(house);

  it('makes a publicly held power raise the holder as a threat', () => {
    const before = bbThreat('Bowie');
    grantPower('coup-d-etat', 'Bowie', { week: 1, visibility: 'public', source: 'test' });
    const after = bbThreat('Bowie');
    expect(after, 'a power everybody can see changed nothing').toBeGreaterThan(before);
    // And it lands in the OBSERVED half — this is something the house saw,
    // not something it intuited about a stranger.
    expect(knownPowerWeight('Bowie', 1)).toBeGreaterThan(0);
    expect(bbThreatProfile('Bowie').total).toBeGreaterThan(before);
  });

  it('leaves a secret power completely invisible', () => {
    const before = bbThreat('Chase');
    grantPower('coup-d-etat', 'Chase', { week: 1, visibility: 'secret', source: 'test' });
    expect(knownPowerWeight('Chase', 1), 'a secret power leaked into the threat model').toBe(0);
    expect(bbThreat('Chase')).toBeCloseTo(before, 6);

    // Holder-secret is the same for this purpose: the house knows a power
    // exists but not whose pocket it is in, so it cannot aim at anybody.
    grantPower('the-cloud', 'Ripper', { week: 1, visibility: 'holder-secret', source: 'test' });
    expect(knownPowerWeight('Ripper', 1)).toBe(0);
  });

  it('remembers that somebody once fired one, after it is gone', () => {
    const inst = grantPower('the-cloud', 'Scary', { week: 1, visibility: 'secret', source: 'test' });
    expect(knownPowerWeight('Scary', 1), 'unfired secret should be invisible').toBe(0);
    usePower(inst, 1);
    // Firing it happened in front of everybody, whatever it was beforehand.
    expect(knownPowerWeight('Scary', 2), 'a spent power taught the house nothing')
      .toBeGreaterThan(0);
  });

  it('does not let one houseguest become infinitely frightening', () => {
    for (const id of ['coup-d-etat', 'the-cloud', 'diamond-veto', 'halting-hex', 'bonus-life']) {
      grantPower(id, 'Axel', { week: 1, visibility: 'public', source: 'test' });
    }
    // Five live public powers is a cap case, not a licence to run away with the
    // threat model — the house can only be so frightened of one person.
    expect(knownPowerWeight('Axel', 1)).toBeLessThanOrEqual(3.2);
  });

  it('gives the house something to actually do about it', () => {
    expect(POWER_KNOWLEDGE_EVENTS.length).toBeGreaterThanOrEqual(4);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of POWER_KNOWLEDGE_EVENTS) {
      expect(ids.has(e.id), `${e.id} unreachable`).toBe(true);
    }

    const room = [...NAMES];
    const ctx = { act: 'house', week: { num: 1 }, beat: 0 };
    // Nothing to know yet: the whole family stays silent.
    for (const e of POWER_KNOWLEDGE_EVENTS) {
      expect(e.weight(room, ctx), `${e.id} fired with no known power`).toBe(0);
    }

    // A public power turns them on.
    grantPower('coup-d-etat', 'Bowie', { week: 1, visibility: 'public', source: 'test' });
    const live = POWER_KNOWLEDGE_EVENTS.filter(e => e.weight(room, ctx) > 0);
    expect(live.length, 'a known power woke nothing up').toBeGreaterThan(0);

    // Everything that claims it will fire must actually produce a beat — the
    // house event contract, which throws at runtime when broken.
    const api = { suspicion() {}, addBond() {}, popDelta() {}, setTarget() {}, remember() {} };
    for (const e of live) {
      const out = e.fire(room, ctx, api);
      expect(out?.text, `${e.id} promised a beat and returned nothing`).toBeTruthy();
      expect(out.text).not.toContain('${');
    }
  });
});
