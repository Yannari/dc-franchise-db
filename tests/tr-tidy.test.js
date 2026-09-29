// tests/tr-tidy.test.js — js/vp-tr/tidy.js turns a repeated name into a
// pronoun only where English makes the pronoun unambiguous.
//
// Every expected sentence below was printed by a real season before the pass
// existed (seed 21, read end to end), except the ones marked as controls.
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { tidyNames } from '../js/vp-tr/tidy.js';

beforeAll(() => {
  setPlayers([
    { name: 'Gerry', gender: 'm' }, { name: 'Geoff', gender: 'm' },
    { name: 'Emma', gender: 'f' }, { name: 'Dawn', gender: 'f' },
    { name: 'Damien', gender: 'm' }, { name: 'Sky', gender: 'nb' },
  ]);
});

describe('a repeated name becomes a pronoun', () => {
  it('in subject position, before a verb', () => {
    expect(tidyNames('Nobody can put Gerry where Gerry says Gerry was either.'))
      .toBe('Nobody can put Gerry where he says he was either.');
    expect(tidyNames('Emma has decided to stop testing and is not sure Emma will manage it.'))
      .toBe('Emma has decided to stop testing and is not sure she will manage it.');
  });

  it('as a possessive', () => {
    expect(tidyNames('Damien keeps coming back to Damien’s own ballot.'))
      .toBe('Damien keeps coming back to his own ballot.');
    expect(tidyNames('Dawn drew the whole room in Dawn’s head.'))
      .toBe('Dawn drew the whole room in her head.');
  });

  it('a subject\'s own "their" takes the subject\'s pronoun', () => {
    expect(tidyNames('Emma changed their mind twice before the doors opened.'))
      .toBe('Emma changed her mind twice before the doors opened.');
    expect(tidyNames('Gerry was still arguing with themselves on the stairs.'))
      .toBe('Gerry was still arguing with himself on the stairs.');
  });
});

describe('and leaves it alone where a pronoun would be ambiguous', () => {
  it('another name of the same pronoun in between keeps the name', () => {
    // Control: "he" could be Geoff.
    expect(tidyNames('Gerry failed a check, and Geoff is the only one who knows Gerry failed it.'))
      .toBe('Gerry failed a check, and Geoff is the only one who knows Gerry failed it.');
  });

  it('a plural in between keeps "their"', () => {
    expect(tidyNames('Emma watched the others take their seats.'))
      .toBe('Emma watched the others take their seats.');
  });

  it('a they/them player keeps the name before a singular verb', () => {
    expect(tidyNames('Sky said Sky was fine.')).toBe('Sky said Sky was fine.');
  });

  it('never touches a sentence with the name once', () => {
    const s = 'Dawn stops at the window seat alone and stays there.';
    expect(tidyNames(s)).toBe(s);
  });
});
