import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { addBond } from '../js/bonds.js';
import { addCoach, coachRecord } from '../js/coaches.js';
import { offerSaveCard } from '../js/coach-episode.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats() },
    { name: 'Evie', archetype: 'goat', stats: stats() },
    { name: 'Finn', archetype: 'hero', stats: stats() },
  ]);
  setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {}, episode: 6 });
  addCoach({ name: 'Julia', tribe: 'Red' });
});

const tribe = { tribeName: 'Red', members: ['Evie', 'Finn'] };

describe('the save card', () => {
  it('needs every contestant to agree', () => {
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', -8);   // one holdout is enough
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.played).toBe(false);
  });

  it('treats an untouched bond (0) as silence, not consent', () => {
    // Julia never interacted with Finn at all — default bond is 0. Silence
    // is not agreement: unanimity requires every contestant to be POSITIVE.
    addBond('Julia', 'Evie', 9);
    // Finn's bond with Julia is left at the default 0.
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.played).toBe(false);
    expect(out.reason).toBe('holdout:Finn');
  });

  it('plays when the tribe is unanimous', () => {
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', 8);
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.played).toBe(true);
    expect(coachRecord('Julia').saveCard).toBe('used');
  });

  it('makes the coach name who dies for it', () => {
    // The tribe agrees to save him; HE chooses who goes instead. That turns
    // protection into a poisoned gift and guarantees it creates the next
    // resentment rather than resolving the current one.
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', 8);
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(tribe.members).toContain(out.replacement);
  });

  it('a coach who is not a tribe member is never selected', () => {
    addCoach({ name: 'Yul', tribe: 'Red' });
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', 8);
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.replacement).not.toBe('Yul');
  });

  it('filters out a coach even if one is wrongly seeded into tribe.members', () => {
    // Real callers never put a coach in tribe.members (coaches never enter
    // gs.activePlayers). This seeds it wrong ON PURPOSE, with Yul given the
    // WEAKEST bond of anyone in the array (but still positive, so the
    // unanimity check itself passes), so the plain lowest-bond sort would
    // name Yul first if the isCoach filter were not there. A filter with no
    // coverage is indistinguishable from a filter that does nothing.
    addCoach({ name: 'Yul', tribe: 'Red' });
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', 8);
    addBond('Julia', 'Yul', 0.5); // weakest bond in the array, but still assent
    const rigged = { tribeName: 'Red', members: ['Evie', 'Finn', 'Yul'] };
    const out = offerSaveCard({ num: 6 }, 'Julia', rigged);
    expect(out.played).toBe(true);
    expect(out.replacement).not.toBe('Yul');
    expect(['Evie', 'Finn']).toContain(out.replacement);
  });

  it('cannot be played twice', () => {
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', 8);
    offerSaveCard({ num: 6 }, 'Julia', tribe);
    const second = offerSaveCard({ num: 7 }, 'Julia', tribe);
    expect(second.played).toBe(false);
    expect(second.reason).toBe('already-used');
  });
});
