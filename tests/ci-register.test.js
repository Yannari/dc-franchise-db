// How a player types (Plan 3a+ Task 14, layer 1). Every player has a
// register, derived from archetype, stats and age unless the author wrote one.
import { describe, expect, it } from 'vitest';
import { room } from './helpers/ci-room.js';
import { makePlayers } from './helpers/ci-cast.js';
import { REGISTERS, registerOf, registerOfPerson } from '../js/ci/register.js';
import { factsFor, pickEntry, renderEntry } from '../js/ci/script.js';
import { POOLS } from '../js/ci/lines/index.js';
import { streamFor } from '../js/dr/rng.js';

const base = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
const person = (archetype, stats, age = 27, extra = {}) => ({ name: 'X', archetype, age, stats: { ...base, ...stats }, ...extra });

describe('a register for everyone', () => {
  it('reads the obvious ones the obvious way', () => {
    expect(registerOfPerson(person('showmancer', { social: 8, boldness: 7 }))).toBe('flirty');
    expect(registerOfPerson(person('hothead', { temperament: 1, boldness: 8 }))).toBe('blunt');
    expect(registerOfPerson(person('floater', { mental: 9, temperament: 8, boldness: 2, social: 4 }, 52))).toBe('formal');
    expect(registerOfPerson(person('social-butterfly', { social: 9, loyalty: 8, temperament: 7, boldness: 4 }))).toBe('warm');
    expect(registerOfPerson(person('chaos-agent', { boldness: 10, social: 7, temperament: 3 }, 23))).toBe('hype');
    expect(registerOfPerson(person('perceptive-player', { intuition: 9, social: 3, boldness: 3 }))).toBe('dry');
  });

  it('lets the author decide', () => {
    expect(registerOfPerson(person('showmancer', { social: 9 }, 27, { chatVoice: { register: 'formal' } }))).toBe('formal');
  });

  it('spreads a cast across every register, none taking over', () => {
    const n = {};
    let total = 0;
    for (let seed = 1; seed <= 30; seed++) {
      for (const p of makePlayers(13, seed)) { n[registerOfPerson(p)] = (n[registerOfPerson(p)] || 0) + 1; total++; }
    }
    for (const r of REGISTERS) {
      expect(n[r] / total, `${r}: ${JSON.stringify(n)}`).toBeGreaterThan(0.08);
      expect(n[r] / total, `${r}: ${JSON.stringify(n)}`).toBeLessThan(0.3);
    }
  });

  it('gives a shared profile the voice of whoever is typing', () => {
    const s = room(6, 1);
    s.people.Mateo = person('showmancer', { social: 8, boldness: 8 }, 26, { name: 'Mateo' });
    s.people.Luis = person('loyal-soldier', { mental: 8, strategic: 8, boldness: 2, temperament: 7 }, 41, { name: 'Luis' });
    Object.assign(s.profiles['@q0'], { players: ['Mateo', 'Luis'], mode: 'shared' });
    expect(registerOf(s, '@q0', 'Mateo')).toBe('flirty');
    expect(registerOf(s, '@q0', 'Luis')).toBe('formal');
  });
});

describe('the register reaches the screen', () => {
  it('is a fact about the speaker, and a line written for it wins most of the time', () => {
    const s = room(4, 1);
    s.people.Q0.chatVoice = { register: 'dry' };
    expect(factsFor(s, { data: {} }, { a: '@q0', b: '@q1' }).register).toBe('dry');
    POOLS['test.reg'] = [
      { id: 'test.reg.1', turns: [{ by: 'a', say: 'generic one' }] },
      { id: 'test.reg.2', turns: [{ by: 'a', say: 'generic two' }] },
      { id: 'test.reg.3', turns: [{ by: 'a', say: 'generic three' }] },
      { id: 'test.reg.4', when: { register: 'dry' }, turns: [{ by: 'a', say: 'sure. great.' }] },
    ];
    let dry = 0;
    for (let i = 0; i < 300; i++) {
      s.usedLines = { uses: {}, pairs: {}, day: {} };
      if (pickEntry(s, 'test.reg', { register: 'dry' }, 'p', streamFor(i, 'r')).id === 'test.reg.4') dry++;
    }
    delete POOLS['test.reg'];
    expect(dry / 300).toBeGreaterThan(0.45);
  });

  it('types a shared profile in the voice of whoever is at the keyboard', () => {
    const s = room(4, 1);
    s.people.Mateo = { name: 'Mateo', gender: 'm', archetype: 'showmancer', age: 26, stats: { ...base }, chatVoice: { register: 'hype' } };
    s.people.Luis = { name: 'Luis', gender: 'm', archetype: 'loyal-soldier', age: 31, stats: { ...base }, chatVoice: { register: 'dry' } };
    Object.assign(s.profiles['@q0'], { players: ['Mateo', 'Luis'], mode: 'shared', roles: { face: 'Mateo', brain: 'Luis' },
      voice: { emoji: 1, hashtags: 1, caps: 0 } });
    const entry = { id: 'x.1', turns: [{ by: 'a', send: 'Okay who is cooking tonight! Not me' }] };
    const luis = renderEntry(s, entry, { a: '@q0', b: '@q1', personA: 'Luis' }, () => 0.9).lines[0].text;
    expect(luis).toBe('okay who is cooking tonight. not me');
  });
});
