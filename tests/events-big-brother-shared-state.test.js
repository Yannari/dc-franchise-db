// Big Brother reads the SAME strategic substrate Total Drama does.
//
// The spec's rule: gs.bb owns format facts only — weeks, nominees, ballots, comp
// records. Relationships, memory, intentions and reputation have one canonical
// home each, shared across both shows, so a character is the same person in a
// house that they are on the island.
//
// These tests exist because the cheap mistake is to rebuild that substrate under
// gs.bb and end up with two shallower simulators whose contestants differ for
// accidental reasons.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { addBond } from '../js/bonds.js';
import { rememberStrategy } from '../js/strategy-memory.js';
import { recordBetrayal, recordProtection } from '../js/relationship-events.js';
import { getRelationshipDimensions } from '../js/relationships.js';
import {
  grudge, remembers, worstMemory, trustOf, resentmentOf, obligationOf,
  respectOf, dangerOf, profile, bond, threat, targetOf,
} from '../js/bb-events/_read.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  ['A', 'mastermind'], ['B', 'social-butterfly'], ['C', 'challenge-beast'],
  ['D', 'schemer'], ['E', 'hero'], ['F', 'floater'],
].map(([name, archetype]) => ({ name, archetype }));

function reset() {
  seedGame(CAST, { episode: 1, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.strategicMemories = {};
  gs.relationshipDimensions = {};
  gs.intentions = {};
}

describe('Big Brother reads the shared strategic substrate', () => {
  beforeEach(reset);

  it('reads memories written to the canonical store, not only the BB receipt', () => {
    expect(grudge('A', 'B')).toBe(0);
    // Written the way Total Drama writes it — no Big Brother involved.
    rememberStrategy('A', 'B', 'betrayal', 1, 3, { note: 'wrote my name down' });
    expect(grudge('A', 'B')).toBeGreaterThan(0);
    expect(remembers('A', 'B', 'betrayal')).toBe(true);
    expect(worstMemory('A', 'B')).toBeTruthy();
  });

  it('reads the relationship dimensions rather than collapsing them to one bond', () => {
    // A betrayal recorded through the shared semantic recorder.
    recordBetrayal('A', 'B', { severity: 2, ep: 1 });
    const after = profile('A', 'B');
    expect(after).toBeTruthy();
    // Betrayal is resentment and lost trust — not merely "bond went down".
    expect(resentmentOf('A', 'B')).toBeGreaterThan(0);
    expect(getRelationshipDimensions('A', 'B')).toBeTruthy();
  });

  it('tells apart trust, obligation and danger — the distinctions a bond hides', () => {
    recordProtection('C', 'D', { strength: 2, ep: 1 });   // C saved D
    // Being saved creates a debt, which is not the same as liking someone.
    expect(obligationOf('D', 'C')).toBeGreaterThan(0);
    // And it is a different axis from how dangerous D finds C.
    expect(typeof dangerOf('D', 'C')).toBe('number');
    expect(typeof respectOf('D', 'C')).toBe('number');
    expect(typeof trustOf('D', 'C')).toBe('number');
  });

  it('keeps no second strategic store under gs.bb', () => {
    rememberStrategy('A', 'B', 'betrayal', 1, 2);
    // The canonical store has it; gs.bb must not be a parallel truth.
    expect(Object.keys(gs.strategicMemories).length).toBeGreaterThan(0);
    const bbKeys = Object.keys(gs.bb || {});
    for (const forbidden of ['strategicMemories', 'relationshipDimensions', 'intentions', 'knowledge', 'showmances', 'reputations']) {
      expect(bbKeys, `gs.bb must not own ${forbidden}`).not.toContain(forbidden);
    }
  });

  it('still reads bonds from the one shared place', () => {
    addBond('A', 'C', 4);
    expect(bond('A', 'C')).toBe(4);
  });

  it('scores threat from Big Brother evidence without Total Drama globals', () => {
    gs.bb.stats = { A: { hohWins: 2, vetoWins: 1 }, B: { hohWins: 0, vetoWins: 0 } };
    // Must not throw reaching for browser globals or a challenge record a house
    // never fills in — that is why this does not call players.threatScore.
    expect(() => threat('A')).not.toThrow();
    expect(threat('A')).toBeGreaterThan(threat('B'));
  });

  it('never invents an intention just by asking who someone is targeting', () => {
    // formIntentions is still Total Drama-shaped, so reading must not create.
    expect(targetOf('A')).toBeNull();
    expect(Object.keys(gs.intentions || {})).toHaveLength(0);
  });
});
