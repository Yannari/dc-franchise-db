import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { setRelationshipDimension, getRelationshipDimension } from '../js/relationships.js';
import { syncLadder, setStep } from '../js/pm/ladder.js';
import { confidantOf, verdict, judgement, girlCode, peerPressure } from '../js/pm/circle.js';

const P = (name, gender, stats = {}) => ({ name, gender, sexuality: 'straight', archetype: 'floater', intent: 'love',
  stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...stats } });
let state;
const fr = (a, b, v) => { setRelationshipDimension(a, b, 'affection', v); setRelationshipDimension(a, b, 'trust', v); };
beforeEach(() => {
  const cast = [P('Gwen', 'f'), P('Bridgette', 'f'), P('Courtney', 'f'), P('Duncan', 'm'), P('Geoff', 'm'), P('Theo', 'm', { loyalty: 2 })];
  setPlayers(cast);
  setGs({ bonds: {}, relationshipDimensions: {} });
  state = { day: 9, villa: cast.map(p => p.name), profiles: Object.fromEntries(cast.map(p => [p.name, p])),
    couples: [['Bridgette', 'Geoff'], ['Gwen', 'Duncan']], shows: {}, believes: {} };
  syncLadder(state);
});

describe('friends', () => {
  it('a confidant is the closest trusted friend who is not the partner', () => {
    fr('Gwen', 'Bridgette', 8); fr('Gwen', 'Courtney', 3); fr('Gwen', 'Duncan', 9);
    expect(confidantOf(state, 'Gwen')).toBe('Bridgette');
  });
  it('a friend is judged more softly than a rival — the double standard', () => {
    fr('Gwen', 'Bridgette', 8); fr('Gwen', 'Theo', -6);
    expect(judgement(state, 'Gwen', 'Bridgette')).toBeLessThan(judgement(state, 'Gwen', 'Theo'));
    expect(verdict(state, 'Gwen', 'Theo')).toBeLessThan(0);
  });
  it("grafting on a friend's official couple costs friendship across her circle", () => {
    fr('Courtney', 'Bridgette', 8); fr('Gwen', 'Bridgette', 7);
    setStep(state, 'Bridgette', 'Geoff', 'official'); setStep(state, 'Geoff', 'Bridgette', 'official');
    const before = getRelationshipDimension('Courtney', 'Theo', 'affection');
    const turned = girlCode(state, 'Theo', ['Bridgette', 'Geoff']);
    expect(turned).toContain('Courtney');
    expect(getRelationshipDimension('Courtney', 'Theo', 'affection')).toBeLessThan(before);
  });
  it('friends who twisted push a disloyal islander toward twisting', () => {
    fr('Theo', 'Geoff', 8); fr('Theo', 'Duncan', 8);
    const p = peerPressure(state, 'Theo', [{ name: 'Geoff', choice: 'twist' }, { name: 'Duncan', choice: 'twist' }]);
    expect(p).toBeGreaterThan(0);
    expect(peerPressure(state, 'Theo', [{ name: 'Geoff', choice: 'stick' }, { name: 'Duncan', choice: 'stick' }])).toBeLessThan(0);
  });
});
