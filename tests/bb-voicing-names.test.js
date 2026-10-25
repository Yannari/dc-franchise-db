// Big Brother's own voices are voiced like everybody else's (the user, 2026-10-25: "cant find how to voice the big
// brother and the mastermind"): the house as "Big Brother", a season's voice (The Mastermind, AINSLEY...) by its
// name; and the voice is found by the name the user gave it in Inworld, exactly or near enough.
import { describe, expect, it } from 'vitest';
import { voiceName, resolveVoices } from '../js/vp-bb-ep/voicing.js';

describe('who speaks, as a voice', () => {
  it('names the house and a season\'s own voice, and keeps the stage directions silent', () => {
    expect(voiceName({ k: 'bb', t: 'Houseguests, please gather in the living room.' })).toBe('Big Brother');
    expect(voiceName({ k: 'voice', by: 'The Mastermind', t: 'Good evening.' })).toBe('The Mastermind');
    expect(voiceName({ k: 'say', by: 'Bowie', t: 'Hi.' })).toBe('Bowie');
    expect(voiceName({ k: 'beat', t: 'The lights go out.' })).toBeNull();
  });
});

describe('finding the voice', () => {
  const account = { 'Big Brother': 'ws__bb', 'The-Mastermind': 'ws__mm', bowie: 'ws__bowie', Chase: 'ws__chase' };
  it('takes the exact name first, then the same name typed differently', () => {
    expect(resolveVoices(['Big Brother', 'The Mastermind', 'Bowie', 'Chase', 'Zee'], account))
      .toEqual({ 'Big Brother': 'ws__bb', 'The Mastermind': 'ws__mm', Bowie: 'ws__bowie', Chase: 'ws__chase' });
  });
  it('never gives one speaker somebody else\'s voice', () => {
    expect(resolveVoices(['Big Brother'], { 'Big Brother 2': 'x', Brother: 'y' })).toEqual({});
  });
});
