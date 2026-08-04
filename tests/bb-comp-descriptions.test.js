// Every competition explains itself.
//
// `desc` is not flavour text. It is drawn on the competition screen and it is
// the only place the viewer is ever told what the houseguests are actually
// doing — the narration describes what happened, not what the rules were. A
// one-line desc leaves the screen showing a result to a competition nobody
// understood, which is what "Houseguests build an unstable stack while
// balancing on a narrow platform" was doing.
//
// The standard is the one the arena competitions already meet: the SET-UP, the
// MECHANIC, what goes WRONG, and how somebody WINS. Bowlerina is the worked
// example — spin the bar, the barrier drops, roll while dizzy, the barrier
// rises, far targets pay most, highest total after five frames wins.
import { describe, expect, it } from 'vitest';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { GENERIC_BB_COMPS } from '../js/bb/comps.js';

const ALL = [...BB_COMPETITIONS, ...GENERIC_BB_COMPS];

// Long enough to have said the four things. The shortest competition that
// genuinely meets the standard sits a little over 200 characters.
const MIN_CHARS = 200;

// How somebody wins has to be stated outright.
const WIN_CONDITION = /\bwins?\b|\bwinning\b|\btakes the power\b/i;

describe('competition descriptions', () => {
  it('every competition says what the houseguests are doing', () => {
    const thin = [];
    for (const comp of ALL) {
      const d = String(comp.desc || '');
      if (d.length < MIN_CHARS) thin.push(`${comp.id}: ${d.length} chars`);
    }
    expect(thin).toEqual([]);
  });

  it('every competition states how it is won', () => {
    const unclear = ALL.filter(c => !WIN_CONDITION.test(String(c.desc || ''))).map(c => c.id);
    expect(unclear).toEqual([]);
  });

  it('every competition describes more than one step', () => {
    // A single sentence can only ever be a summary. Two or more means the
    // description had room to walk through the thing.
    const oneLiners = ALL
      .filter(c => String(c.desc || '').split(/\.\s/).filter(Boolean).length < 2)
      .map(c => c.id);
    expect(oneLiners).toEqual([]);
  });

  it('no description promises a prize the competition may not be playing for', () => {
    // A comp that serves both slots cannot name one in static text — see the
    // dual-slot fix in bb-comps-signature.
    const bothSlots = ALL.filter(c =>
      c.types.includes('hoh') && c.types.includes('veto'));
    const naming = bothSlots
      .filter(c => /the Power of Veto|Head of Household/.test(String(c.desc || '')))
      .map(c => c.id);
    expect(naming).toEqual([]);
  });
});
