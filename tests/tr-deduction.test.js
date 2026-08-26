// Alignment is the one fact nobody in this game ever observes.
//
// Every other fact type in js/knowledge.js can be witnessed: a vote is cast in
// front of people, an idol is found, an alliance meets. Alignment is different —
// the Traitors know theirs, and NOBODY else can ever do better than infer. That
// asymmetry is the whole format, and it is enforced here by credibility ceiling
// rather than by special-casing every reader.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge, believes, learn } from '../js/knowledge.js';
import {
  selectTraitors, recordAlignment, alignmentAt, truthAtLearn,
} from '../js/tr/roles.js';
import { alignmentFactId, seedTraitorKnowledge } from '../js/tr/deduction.js';

const CAST = ['Gwen', 'Duncan', 'Heather', 'Owen', 'Leshawna', 'Noah'];
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

beforeEach(() => {
  // js/core.js exports `gs` as null until a season exists, so a test that
  // reaches for gs.tr before setGs() throws on a null read rather than failing
  // its assertion. setGs replaces the live binding; the imported `gs` updates.
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  resetKnowledge();
});

describe('choosing the traitors', () => {
  it('picks the number asked for, from the living cast, without repeats', () => {
    const picked = selectTraitors(CAST, { traitorCount: 2 }, seededRng(7));
    expect(picked).toHaveLength(2);
    expect(new Set(picked).size).toBe(2);
    picked.forEach(n => expect(CAST).toContain(n));
  });

  it('is deterministic for a given seed, because a season must replay', () => {
    const a = selectTraitors(CAST, { traitorCount: 2 }, seededRng(42));
    const b = selectTraitors(CAST, { traitorCount: 2 }, seededRng(42));
    expect(a).toEqual(b);
  });

  it('does not always pick the same archetypes — a bad traitor is good television', () => {
    const seen = new Set();
    for (let s = 1; s <= 40; s++) {
      selectTraitors(CAST, { traitorCount: 2 }, seededRng(s)).forEach(n => seen.add(n));
    }
    // Over 40 seeds every member of a 6-cast should have been picked at least once.
    expect(seen.size).toBe(CAST.length);
  });
});

describe('alignment as ground truth', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
      .forEach(n => recordAlignment(n, false, 1, 'selection'));
  });

  it('answers who is what', () => {
    expect(alignmentAt('Gwen', 1)).toBe('traitor');
    expect(alignmentAt('Heather', 1)).toBe('faithful');
  });

  it('keeps eras, so a later flip does not rewrite an earlier truth', () => {
    // Heather is recruited in episode 8. She was genuinely Faithful before it.
    recordAlignment('Heather', true, 8, 'recruitment');
    expect(alignmentAt('Heather', 3)).toBe('faithful');
    expect(alignmentAt('Heather', 8)).toBe('traitor');
    expect(alignmentAt('Heather', 11)).toBe('traitor');
    // And the record says how and when, for the VP and the exit blowup.
    const flip = gs.tr.roleHistory.find(r => r.name === 'Heather' && r.via === 'recruitment');
    expect(flip).toMatchObject({ from: 'faithful', to: 'traitor', ep: 8 });
  });

  it('reports the truth as it stood when a belief was formed', () => {
    recordAlignment('Heather', true, 8, 'recruitment');
    expect(truthAtLearn('Heather', 3)).toBe(false);   // a correct read in ep 3
    expect(truthAtLearn('Heather', 9)).toBe(true);
  });
});

describe('what the traitors know, and what nobody else can', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
      .forEach(n => recordAlignment(n, false, 1, 'selection'));
    seedTraitorKnowledge(1);
  });

  it('lets each traitor know the other with certainty', () => {
    const b = believes('Gwen', alignmentFactId('Duncan'), 1);
    expect(b, 'Gwen does not know her own ally').toBeTruthy();
    expect(b.effectiveConfidence).toBeGreaterThanOrEqual(0.99);
    expect(b.valence).toBe('accurate');
  });

  it('tells the faithful nothing at all at the start', () => {
    for (const target of CAST) {
      expect(believes('Heather', alignmentFactId(target), 1),
        `Heather already has a read on ${target}`).toBeNull();
    }
  });

  it('CEILING: a faithful can never reach certainty about anyone', () => {
    // Even the strongest inference this engine can express stays a guess.
    learn('Heather', alignmentFactId('Gwen'),
      { source: 'ballots', sourceType: 'deduced', ep: 4, rng: () => 0.01 });
    const b = believes('Heather', alignmentFactId('Gwen'), 4);
    if (b) expect(b.effectiveConfidence).toBeLessThan(0.7);
  });
});
