import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { setRelationshipDimension } from '../js/relationships.js';
import { streamFor } from '../js/dr/rng.js';
import { romance, shown, believed, setMask, revealTruth, schemeEligible, updateBeliefs,
  decideMasks, relationshipLabel, growLove } from '../js/pm/feelings.js';

const P = (name, gender, archetype, stats = {}) => ({ name, gender, sexuality: 'straight', archetype,
  stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5,
    intuition: 5, temperament: 5, ...stats } });
let state;
beforeEach(() => {
  const cast = [P('Heather', 'f', 'villain', { strategic: 8, loyalty: 3 }), P('Mike', 'm', 'underdog'),
    P('Gwen', 'f', 'loyal-soldier', { intuition: 9 }), P('Duncan', 'm', 'hothead')];
  setPlayers(cast);
  setGs({ bonds: {}, relationshipDimensions: {} });
  state = { villa: cast.map(p => p.name), profiles: Object.fromEntries(cast.map(p => [p.name, p])),
    couples: [['Heather', 'Mike'], ['Gwen', 'Duncan']], shows: {}, believes: {}, secrets: [] };
});
const feel = (a, b, att, aff = 0, love = 0) => {
  setRelationshipDimension(a, b, 'attraction', att); setRelationshipDimension(a, b, 'affection', aff);
  setRelationshipDimension(a, b, 'love', love);
};

describe('three layers, one direction at a time', () => {
  it('romance is not bilateral', () => {
    feel('Mike', 'Gwen', 9, 5); feel('Gwen', 'Mike', 0, 5);
    expect(romance('Mike', 'Gwen')).toBeGreaterThan(4);
    expect(romance('Gwen', 'Mike')).toBe(0);
  });
  it('shown is honest until masked; belief follows what is shown', () => {
    feel('Heather', 'Mike', 2, 1);
    expect(shown(state, 'Heather', 'Mike')).toBeCloseTo(romance('Heather', 'Mike'), 5);
    setMask(state, 'Heather', 'Mike', 8);
    for (let i = 0; i < 6; i++) updateBeliefs(state);
    expect(believed(state, 'Mike', 'Heather')).toBeGreaterThan(romance('Heather', 'Mike') + 2);
    revealTruth(state, 'Mike', 'Heather');
    expect(believed(state, 'Mike', 'Heather')).toBeCloseTo(romance('Heather', 'Mike'), 5);
  });
  it('an intuitive islander sees through more of a mask', () => {
    feel('Duncan', 'Gwen', 2, 5); setMask(state, 'Duncan', 'Gwen', 8);
    feel('Heather', 'Mike', 2, 1); setMask(state, 'Heather', 'Mike', 8);
    for (let i = 0; i < 6; i++) updateBeliefs(state);
    expect(believed(state, 'Gwen', 'Duncan')).toBeLessThan(believed(state, 'Mike', 'Heather'));
  });
});

describe('who may do what', () => {
  it('only scheme-eligible islanders ever fake; anybody may hide', () => {
    expect(schemeEligible(state.profiles.Heather)).toBe(true);
    expect(schemeEligible(state.profiles.Gwen)).toBe(false);
    feel('Gwen', 'Duncan', 1, 4); feel('Heather', 'Mike', 1, 1);
    feel('Gwen', 'Mike', 9, 3);          // a crush on somebody else's partner
    for (let s = 0; s < 20; s++) decideMasks(state, streamFor(s * 7919 + 13, 'mask'));
    expect(shown(state, 'Gwen', 'Duncan')).toBeLessThanOrEqual(romance('Gwen', 'Duncan') + 0.01);
    expect(shown(state, 'Gwen', 'Mike')).toBeLessThan(romance('Gwen', 'Mike'));
    expect(shown(state, 'Heather', 'Mike')).toBeGreaterThan(romance('Heather', 'Mike'));
  });
});

describe('labels', () => {
  it('reads the shapes the spec names', () => {
    feel('Heather', 'Mike', 1, 1); setMask(state, 'Heather', 'Mike', 8);
    expect(relationshipLabel(state, 'Heather', 'Mike')[1]).toBe('Faking it');
    feel('Mike', 'Gwen', 9, 5); setMask(state, 'Mike', 'Gwen', 1);
    expect(relationshipLabel(state, 'Mike', 'Gwen')[1]).toBe('Hidden crush');
    feel('Gwen', 'Mike', 0, 7);
    expect(relationshipLabel(state, 'Gwen', 'Mike')[1]).toBe('Friend-zoning');
    feel('Duncan', 'Heather', 9, -4);
    expect(relationshipLabel(state, 'Duncan', 'Heather')[1]).toBe("Fancies, can't stand");
  });
  it('love grows only where there is attraction to grow from', () => {
    feel('Gwen', 'Duncan', 8, 6); feel('Duncan', 'Gwen', 0, 6);
    for (let i = 0; i < 5; i++) growLove(state, state.couples);
    expect(romance('Gwen', 'Duncan')).toBeGreaterThan(romance('Duncan', 'Gwen'));
  });
});
