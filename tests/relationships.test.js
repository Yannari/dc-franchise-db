import { beforeEach, describe, expect, it } from 'vitest';
import { addBond, setBond } from '../js/bonds.js';
import { addMutualRelationshipDimension, addRelationshipDimension,
  getRelationshipDimension, getRelationshipDimensions, relationshipDecisionProfile,
  relationshipKey, removeRelationshipDimensionsFor, setRelationshipDimension } from '../js/relationships.js';
import { pitchTrust, tacticalCooperation, targetProtection } from '../js/relationships.js';
import { seedGame } from './helpers/setup.js';
import { gs } from '../js/core.js';

describe('multidimensional relationships', () => {
  beforeEach(() => seedGame(['Alice', 'Bob', 'Carol']));
  it('stores directional feelings independently', () => {
    setRelationshipDimension('Alice', 'Bob', 'trust', 7);
    setRelationshipDimension('Bob', 'Alice', 'trust', 2);
    expect(getRelationshipDimension('Alice', 'Bob', 'trust')).toBe(7);
    expect(getRelationshipDimension('Bob', 'Alice', 'trust')).toBe(2);
  });
  it('supports liking someone while distrusting them', () => {
    setRelationshipDimension('Alice', 'Bob', 'affection', 8);
    setRelationshipDimension('Alice', 'Bob', 'trust', -4);
    const p = relationshipDecisionProfile('Alice', 'Bob');
    expect(p.warmth).toBeGreaterThan(0);
    expect(p.safety).toBeLessThan(0);
  });
  it('clamps signed and non-negative dimensions', () => {
    expect(setRelationshipDimension('Alice', 'Bob', 'trust', -20)).toBe(-10);
    expect(setRelationshipDimension('Alice', 'Bob', 'fear', -4)).toBe(0);
    expect(setRelationshipDimension('Alice', 'Bob', 'resentment', 40)).toBe(10);
  });
  it('supports directional and mutual events', () => {
    addRelationshipDimension('Alice', 'Bob', 'obligation', 3);
    expect(getRelationshipDimension('Bob', 'Alice', 'obligation')).toBe(0);
    addMutualRelationshipDimension('Alice', 'Bob', 'strategicRespect', 2);
    expect(getRelationshipDimension('Bob', 'Alice', 'strategicRespect')).toBe(2);
  });
  it('seeds dimensions from an explicitly set legacy bond', () => {
    setBond('Alice', 'Bob', -5);
    expect(getRelationshipDimensions('Alice', 'Bob')).toMatchObject({
      affection: -5, trust: -5, resentment: 5,
    });
  });
  it('translates positive legacy interactions into affection and trust', () => {
    addBond('Alice', 'Bob', 2);
    const r = getRelationshipDimensions('Alice', 'Bob');
    expect(r.affection).toBeGreaterThan(0);
    expect(r.trust).toBeGreaterThan(0);
    expect(getRelationshipDimensions('Bob', 'Alice')).toEqual(r);
  });
  it('translates negative legacy interactions into distrust and resentment', () => {
    addBond('Alice', 'Bob', -2);
    const r = getRelationshipDimensions('Alice', 'Bob');
    expect(r.trust).toBeLessThan(0);
    expect(r.resentment).toBeGreaterThan(0);
  });
  it('cleans every directional record involving a contestant', () => {
    addRelationshipDimension('Alice', 'Bob', 'fear', 2);
    addRelationshipDimension('Carol', 'Alice', 'trust', 2);
    removeRelationshipDimensionsFor('Alice');
    expect(gs.relationshipDimensions[relationshipKey('Alice', 'Bob')]).toBeUndefined();
    expect(gs.relationshipDimensions[relationshipKey('Carol', 'Alice')]).toBeUndefined();
  });
  it('rejects unknown dimensions', () => {
    expect(() => setRelationshipDimension('Alice', 'Bob', 'chemistry', 4)).toThrow(/Unknown/);
  });
  it('separates trust in a pitcher from affection for a target', () => {
    setRelationshipDimension('Alice', 'Bob', 'affection', -2);
    setRelationshipDimension('Alice', 'Bob', 'trust', 7);
    setRelationshipDimension('Alice', 'Carol', 'affection', 8);
    setRelationshipDimension('Alice', 'Carol', 'trust', -3);
    expect(pitchTrust('Alice', 'Bob')).toBeGreaterThan(4);
    expect(targetProtection('Alice', 'Carol')).toBeGreaterThan(3);
  });
  it('lets earned game respect outweigh moderate distrust for one tactical move', () => {
    setRelationshipDimension('Alice', 'Bob', 'trust', -3);
    setRelationshipDimension('Alice', 'Bob', 'resentment', 1);
    setRelationshipDimension('Alice', 'Bob', 'strategicRespect', 3);
    expect(pitchTrust('Alice', 'Bob')).toBeLessThan(0);
    expect(tacticalCooperation('Alice', 'Bob')).toBeGreaterThan(2);
    expect(getRelationshipDimension('Alice', 'Bob', 'trust')).toBe(-3);
  });
});
