import { describe, expect, it } from 'vitest';
import { streamFor } from '../js/dr/rng.js';
import { resolveIslander, derivePersona, isMug, vibeScore, ickScore, INTENTS,
  INTERESTS, LOOK_TAGS } from '../js/pm/profile.js';

const PRIYA = { name: 'Priya', gender: 'f', sexuality: 'straight', archetype: 'perceptive-player',
  stats: { strategic: 8, mental: 8, boldness: 7, loyalty: 7, social: 6, intuition: 6,
    temperament: 3, physical: 5, endurance: 5 } };
const THEO = { name: 'Theo', gender: 'm', sexuality: 'straight', archetype: 'wildcard',
  stats: { boldness: 8, social: 7, physical: 7, endurance: 7, temperament: 7, mental: 4,
    strategic: 3, loyalty: 2, intuition: 2 } };

describe('persona', () => {
  it('reads the spec worked examples off their stats', () => {
    expect(derivePersona(PRIYA.stats, { late: false })).toBe('checklist');
    expect(derivePersona(THEO.stats, { late: false })).toBe('fuckboy');
    expect(isMug(THEO.stats)).toBe(true);
    expect(isMug(PRIYA.stats)).toBe(false);
  });
});

describe('vibes and icks are proportional to stats', () => {
  it('a bolder islander reads more confident', () => {
    expect(vibeScore('confident', { boldness: 9 })).toBeGreaterThan(vibeScore('confident', { boldness: 3 }));
    expect(ickScore('nonchalant', { boldness: 2, social: 2 }))
      .toBeGreaterThan(ickScore('nonchalant', { boldness: 8, social: 8 }));
  });
});

describe('resolveIslander', () => {
  it('keeps what the author set and rolls the rest', () => {
    const p = resolveIslander(THEO, { intent: 'fun', interests: ['animals', 'outdoors'],
      bonusInterest: 'animals', role: 'starter' }, streamFor(1, 'profile:Theo'));
    expect(p.intent).toBe('fun');
    expect(p.interests).toEqual(['animals', 'outdoors']);
    expect(p.bonusInterest).toBe('animals');
    expect(p.persona).toBe('fuckboy');
    expect(p.type.vibes.length).toBeGreaterThanOrEqual(1);
    expect(p.type.looks.every(t => LOOK_TAGS.includes(t))).toBe(true);
  });

  it('drops values that are not on the lists', () => {
    const p = resolveIslander(THEO, { intent: 'revenge', interests: ['knitting'] },
      streamFor(1, 'profile:Theo'));
    expect(INTENTS).toContain(p.intent);
    expect(p.interests.every(i => INTERESTS.includes(i))).toBe(true);
    expect(p.interests.length).toBeGreaterThanOrEqual(2);
  });

  it('rolls the same islander the same way off the same stream', () => {
    const a = resolveIslander(PRIYA, {}, streamFor(9, 'profile:Priya'));
    const b = resolveIslander(PRIYA, {}, streamFor(9, 'profile:Priya'));
    expect(a).toEqual(b);
  });

  it('authoring one field never shifts the other rolls', () => {
    const plain = resolveIslander(PRIYA, {}, streamFor(9, 'profile:Priya'));
    const set = resolveIslander(PRIYA, { intent: 'settle-down' }, streamFor(9, 'profile:Priya'));
    expect(set.intent).toBe('settle-down');
    expect(set.icks).toEqual(plain.icks);
    expect(set.interests).toEqual(plain.interests);
  });

  it('an author persona wins over the derived one', () => {
    const p = resolveIslander(PRIYA, { persona: 'villa-clown' }, streamFor(1, 'profile:Priya'));
    expect(p.persona).toBe('villa-clown');
  });
});
