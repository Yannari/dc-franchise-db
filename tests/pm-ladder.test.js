import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { setRelationshipDimension } from '../js/relationships.js';
import { streamFor } from '../js/dr/rng.js';
import { STEPS, stepOf, setStep, believeStep, syncLadder, closedness, betrayalWeight,
  coupleStrength, situationship, decideLadder, readiness } from '../js/pm/ladder.js';

const P = (name, gender, archetype, stats = {}, intent = 'love') => ({ name, gender, sexuality: 'straight', archetype, intent,
  stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...stats } });
let state;
const feel = (a, b, att, love = 0, trust = 0) => {
  setRelationshipDimension(a, b, 'attraction', att); setRelationshipDimension(a, b, 'love', love);
  setRelationshipDimension(a, b, 'trust', trust);
};
beforeEach(() => {
  const cast = [P('Bridgette', 'f', 'hero', { loyalty: 9 }), P('Geoff', 'm', 'loyal-soldier', { loyalty: 9 }),
    P('Theo', 'm', 'wildcard', { loyalty: 2 }, 'fun'), P('Zoey', 'f', 'underdog'), P('Duncan', 'm', 'hothead')];
  setPlayers(cast);
  setGs({ bonds: {}, relationshipDimensions: {} });
  state = { day: 1, villa: cast.map(p => p.name), profiles: Object.fromEntries(cast.map(p => [p.name, p])),
    couples: [['Bridgette', 'Geoff'], ['Zoey', 'Theo']], shows: {}, believes: {} };
  syncLadder(state);
});

describe('the ladder is one-way', () => {
  it('a couple starts on `coupled`, each side separately', () => {
    expect(stepOf(state, 'Bridgette', 'Geoff')).toBe('coupled');
    setStep(state, 'Bridgette', 'Geoff', 'closed-off');
    expect(stepOf(state, 'Geoff', 'Bridgette')).toBe('coupled');
    expect(closedness(state, 'Bridgette', 'Geoff')).toBeGreaterThan(closedness(state, 'Geoff', 'Bridgette'));
  });
  it('jealousy weight follows the rung you BELIEVE they are on', () => {
    believeStep(state, 'Zoey', 'Theo', 'open');
    const open = betrayalWeight(state, 'Zoey', 'Theo');
    believeStep(state, 'Zoey', 'Theo', 'exclusive');
    expect(betrayalWeight(state, 'Zoey', 'Theo')).toBeGreaterThan(open);
  });
  it('a situationship is one side believing a rung the other never climbed', () => {
    setStep(state, 'Theo', 'Zoey', 'open');
    believeStep(state, 'Zoey', 'Theo', 'exclusive');
    expect(situationship(state, 'Theo', 'Zoey')).toBe(true);
    expect(situationship(state, 'Zoey', 'Theo')).toBe(false);
  });
  it('uncoupling clears the ladder', () => {
    state.couples = [['Zoey', 'Theo']];
    syncLadder(state);
    expect(stepOf(state, 'Bridgette', 'Geoff')).toBeNull();
  });
});

describe('climbing, declining, stepping back', () => {
  it('a loyal couple in love climbs to exclusive or official over a season of days', () => {
    feel('Bridgette', 'Geoff', 9, 8, 8); feel('Geoff', 'Bridgette', 9, 8, 8);
    let top = 0;
    for (let d = 1; d <= 30; d++) { state.day = d; decideLadder(state, streamFor(d, 'l')); top = Math.max(top, STEPS.indexOf(stepOf(state, 'Bridgette', 'Geoff'))); }
    expect(top).toBeGreaterThanOrEqual(STEPS.indexOf('exclusive'));
  });
  it('a `fun` islander with no love climbs far less', () => {
    feel('Theo', 'Zoey', 6, 0, 0); feel('Zoey', 'Theo', 8, 5, 5);
    expect(readiness(state, 'Theo', 'Zoey')).toBeLessThan(readiness(state, 'Zoey', 'Theo'));
  });
  it('a turned head steps back down to open', () => {
    feel('Bridgette', 'Geoff', 4, 2, 5); setStep(state, 'Bridgette', 'Geoff', 'closed-off');
    feel('Bridgette', 'Duncan', 10, 0, 0);
    let back = false;
    for (let d = 1; d <= 20 && !back; d++) back = decideLadder(state, streamFor(d * 7919 + 13, 'l')).some(x => x.kind === 'open-back-up' && x.from === 'Bridgette');
    expect(back).toBe(true);
    expect(stepOf(state, 'Bridgette', 'Geoff')).toBe('open');
  });
  it('the villa sees a strong couple as the lower of the two steps', () => {
    setStep(state, 'Bridgette', 'Geoff', 'official'); setStep(state, 'Geoff', 'Bridgette', 'exclusive');
    expect(coupleStrength(state, 'Bridgette', 'Geoff')).toBeCloseTo(STEPS.indexOf('exclusive') / 5, 5);
  });
});
