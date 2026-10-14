// The voiced line as Inworld TTS-2 reads it (js/vp-td-ep/direct.js): the director's extras put into the line, and the
// director of last resort. The user, 2026-10-14: "sometimes the emotion isnt really there". Every line voiced while
// the director was down went with no direction at all.
import { describe, it, expect } from 'vitest';
import { voiceText, localDirection, sentences } from '../js/vp-td-ep/direct.js';

describe('voiceText', () => {
  it('splits sentences with their punctuation', () => {
    expect(sentences('Okay, I tried. Remember that I tried.')).toEqual(['Okay, I tried. ', 'Remember that I tried.']);
    expect(sentences('Wait. Me? It\'s me?!')).toHaveLength(3);
  });
  it('puts a sound where the director placed it', () => {
    expect(voiceText('...Fine. I\'m going.', { nv: 'sigh', nvAt: 'start' })).toBe('[sigh] ...Fine. I\'m going.');
    expect(voiceText('Nice try. Not happening.', { nv: 'laugh', nvAt: 'mid' })).toBe('Nice try. [laugh] Not happening.');
    expect(voiceText('Then talk with me.', { nv: 'laugh', nvAt: 'end' })).toBe('Then talk with me. [laugh]');
    expect(voiceText('Hi.', { nv: 'scream' })).toBe('Hi.');   // not a TTS-2 sound
  });
  it('turns the delivery where the feeling turns', () => {
    expect(voiceText('Okay, I tried. Remember that I tried.', { shift: { at: 2, d: 'bitter, low' } }))
      .toBe('Okay, I tried. [bitter, low] Remember that I tried.');
    expect(voiceText('One sentence only.', { shift: { at: 2, d: 'x' } })).toBe('One sentence only.');
  });
  it('stresses one word, and none when the line already shouts', () => {
    expect(voiceText("I'm not even close to fine.", { stress: 'close' })).toBe("I'm not even CLOSE to fine.");
    expect(voiceText('Noah, THIS is my answer!', { stress: 'answer' })).toBe('Noah, THIS is my answer!');
    expect(voiceText('I am fine.', { stress: 'I' })).toBe('I am fine.');   // too short to be a word worth hitting
  });
});

describe('localDirection', () => {
  const tender = /\b(softly|gently|tenderly|warmly|intimately|sensual)/i;
  it('names a feeling the line plainly has', () => {
    expect(localDirection({ by: 'Noah', text: 'Wait. Me? It\'s me?', k: 'say' }, ['dry']).d).toMatch(/stunned/);
    expect(localDirection({ by: 'Courtney', text: 'You lied to me. Liar!', k: 'say' }, []).d).toMatch(/angry|furious/);
    expect(localDirection({ by: 'Cody', text: 'Okay.', k: 'say', beat: 'Cody storms off.' }, []).d).toMatch(/angry/);
  });
  it('reads a stage direction only for the person it names', () => {
    expect(localDirection({ by: 'Sierra', text: 'Hey.', k: 'say', beat: 'Geoff is sitting on Noah\'s empty seat.' }, ['warm']).d).not.toMatch(/hurt/);
  });
  it('always gives a delivery, and never a tender one in a confessional', () => {
    for (const tags of [[], ['warm'], ['dry'], ['loud', 'schemer']]) {
      const d = localDirection({ by: 'Gwen', text: 'I miss my friends. It is weird here.', k: 'conf' }, tags).d;
      expect(d).toMatch(/to camera$/);
      expect(d).not.toMatch(tender);
    }
    expect(localDirection({ by: 'Chris', text: 'Who goes tonight? Stay tuned!' }, [], true).d).toMatch(/TV host/);
  });
});
