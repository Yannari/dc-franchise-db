import { describe, it, expect, beforeEach } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs } from '../js/core.js';
import { getRelationshipDimension, getRelationshipDimensions } from '../js/relationships.js';
import { getBond } from '../js/bonds.js';
import {
  recordBetrayal, recordChallengeDominance, recordProtection, recordIntimidation,
  recordAttractionSpark, recordLoyaltyProof, recordStrategicRespect,
  recentCauses, clearRelationshipCausesFor, decayRelationshipDimensions, applyObservedStrategicRespect,
} from '../js/relationship-events.js';

beforeEach(() => seedGame(['Alice', 'Bob', 'Carol'], { episode: 3, relationshipCauses: {} }));

describe('relationship-events: semantic dimensions', () => {
  it('a betrayal makes the victim fear the traitor, craters warmth, and guilts the traitor', () => {
    recordBetrayal('Alice', 'Bob', { severity: 1 });
    expect(getRelationshipDimension('Alice', 'Bob', 'fear')).toBeGreaterThan(0.5);
    expect(getBond('Alice', 'Bob')).toBeLessThan(0);           // warmth via bond bridge
    expect(getRelationshipDimension('Bob', 'Alice', 'obligation')).toBeGreaterThan(0); // traitor's guilt
    // directional: Bob does not fear Alice
    expect(getRelationshipDimension('Bob', 'Alice', 'fear')).toBe(0);
  });

  it('challenge dominance earns respect + fear from onlookers only', () => {
    recordChallengeDominance('Bob', ['Alice', 'Carol', 'Bob'], { margin: 1 });
    expect(getRelationshipDimension('Alice', 'Bob', 'strategicRespect')).toBeGreaterThan(0);
    expect(getRelationshipDimension('Carol', 'Bob', 'fear')).toBeGreaterThan(0);
    expect(getRelationshipDimension('Bob', 'Bob', 'fear')).toBe(0); // no self-respect entry
  });

  it('protection builds obligation and warmth toward the protector', () => {
    recordProtection('Alice', 'Bob');   // Alice saves Bob
    expect(getRelationshipDimension('Bob', 'Alice', 'obligation')).toBeGreaterThan(1);
    expect(getBond('Bob', 'Alice')).toBeGreaterThan(0);
  });

  it('can add protection meaning without double-counting warmth already applied by an event', () => {
    const before = getBond('Bob', 'Alice');
    recordProtection('Alice', 'Bob', { strength: 0.5, applyWarmth: false });
    expect(getBond('Bob', 'Alice')).toBe(before);
    expect(getRelationshipDimension('Bob', 'Alice', 'obligation')).toBeGreaterThan(0);
  });

  it('intimidation raises fear and lowers warmth', () => {
    recordIntimidation('Bob', 'Alice');
    expect(getRelationshipDimension('Alice', 'Bob', 'fear')).toBeGreaterThan(0);
    expect(getBond('Alice', 'Bob')).toBeLessThan(0);
  });

  it('can add intimidation meaning without duplicating an existing fight bond hit', () => {
    const before = getBond('Alice', 'Bob');
    recordIntimidation('Bob', 'Alice', { strength: 0.5, applyWarmth: false });
    expect(getBond('Alice', 'Bob')).toBe(before);
    expect(getRelationshipDimension('Alice', 'Bob', 'fear')).toBeGreaterThan(0);
  });

  it('a spark is mutual attraction', () => {
    recordAttractionSpark('Alice', 'Bob');
    expect(getRelationshipDimension('Alice', 'Bob', 'attraction')).toBeGreaterThan(0);
    expect(getRelationshipDimension('Bob', 'Alice', 'attraction')).toBeGreaterThan(0);
  });

  it('loyalty proof and explicit respect nudges land on the right dims', () => {
    recordLoyaltyProof('Alice', 'Bob');
    expect(getRelationshipDimension('Bob', 'Alice', 'obligation')).toBeGreaterThan(0);
    recordStrategicRespect('Carol', 'Alice', 2, 'slick idol play');
    expect(getRelationshipDimension('Carol', 'Alice', 'strategicRespect')).toBeGreaterThan(1.5);
  });

  it('visible strategic reputation creates respect without granting personal trust', () => {
    gs.episodeHistory = [1, 2, 3].map(num => ({ num, votePitches:[{
      pitcher:'Alice', success:true, confirmedCoalition:['Alice', 'Bob', 'Carol'], responses:[],
    }] }));
    const trustBefore = getRelationshipDimension('Bob', 'Alice', 'trust');
    applyObservedStrategicRespect({ num:4, tribalPlayers:['Alice', 'Bob', 'Carol'], votePitches:[] });
    expect(getRelationshipDimension('Bob', 'Alice', 'strategicRespect')).toBeGreaterThan(0.75);
    expect(getRelationshipDimension('Bob', 'Alice', 'trust')).toBe(trustBefore);
    expect(recentCauses('Bob', 'Alice', 'strategicRespect')[0].reason).toMatch(/track record/i);
  });
});

describe('relationship-events: cause history', () => {
  it('records recent causes newest-first and filters by dimension', () => {
    recordBetrayal('Alice', 'Bob');
    recordChallengeDominance('Bob', ['Alice']);
    const all = recentCauses('Alice', 'Bob');
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all[0].reason).toMatch(/challenge/i);         // newest first
    const fearOnly = recentCauses('Alice', 'Bob', 'fear');
    expect(fearOnly.every(c => c.dim === 'fear')).toBe(true);
  });

  it('clears causes for a departed contestant', () => {
    recordBetrayal('Alice', 'Bob');
    clearRelationshipCausesFor('Alice');
    expect(recentCauses('Alice', 'Bob').length).toBe(0);
  });
});

describe('relationship-events: decay', () => {
  it('fades the event-driven specific dims but leaves warmth to the bond system', () => {
    recordChallengeDominance('Bob', ['Alice'], { margin: 3 });
    recordAttractionSpark('Alice', 'Carol', { strength: 2 });
    const fear0 = getRelationshipDimension('Alice', 'Bob', 'fear');
    const attr0 = getRelationshipDimension('Alice', 'Carol', 'attraction');
    const before = getRelationshipDimensions('Alice', 'Bob');
    for (let i = 0; i < 3; i++) decayRelationshipDimensions();
    expect(getRelationshipDimension('Alice', 'Bob', 'fear')).toBeLessThan(fear0);
    expect(getRelationshipDimension('Alice', 'Carol', 'attraction')).toBeLessThan(attr0);
    // affection/trust untouched by this decay (owned by recoverBonds)
    expect(getRelationshipDimensions('Alice', 'Bob').affection).toBe(before.affection);
  });

  it('fear fades faster than strategic respect', () => {
    recordChallengeDominance('Bob', ['Alice'], { margin: 5 });
    const fear0 = getRelationshipDimension('Alice', 'Bob', 'fear');
    const resp0 = getRelationshipDimension('Alice', 'Bob', 'strategicRespect');
    for (let i = 0; i < 4; i++) decayRelationshipDimensions();
    const fearFrac = getRelationshipDimension('Alice', 'Bob', 'fear') / fear0;
    const respFrac = getRelationshipDimension('Alice', 'Bob', 'strategicRespect') / resp0;
    expect(fearFrac).toBeLessThan(respFrac);
  });
});
