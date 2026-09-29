import { describe, expect, it } from 'vitest';
import { EMOJI, tokenize, tagWords, styleMessage, displayText, dictation } from '../js/ci/voice.js';

describe('texting voice', () => {
  it('splits a message into text, emoji and hashtags', () => {
    expect(tokenize('hey {e:heart} {t:GirlGang}')).toEqual([
      { type: 'text', v: 'hey ' }, { type: 'emoji', v: 'heart' }, { type: 'text', v: ' ' }, { type: 'tag', v: 'GirlGang' }]);
  });

  it('shows emoji and hashtags on screen', () => {
    expect(displayText('Good morning {e:sun} {t:NewDay}')).toBe(`Good morning ${EMOJI.sun[0]} #NewDay`);
  });

  it('reads hashtags as words and punctuation out loud, the way players dictate', () => {
    expect(tagWords('GotYourBack')).toBe('Got Your Back');
    expect(dictation('Hey girl! How you holding up? {e:hug} {t:GotYourBack}'))
      .toBe('Message: "Hey girl, exclamation point. How you holding up, question mark." Hug emoji. Hashtag Got Your Back. Send.');
    expect(dictation('I have to ask you something...')).toBe('Message: "I have to ask you something, dot, dot, dot." Send.');
  });

  it('keeps more emoji and hashtags for a player who uses them', () => {
    const heavy = { emoji: 1, hashtags: 1, caps: 0 }, light = { emoji: 0, hashtags: 0, caps: 0 };
    const msg = 'so happy {e:heart} {e:party} {t:CircleFam}';
    let h = 0, l = 0;
    for (let i = 0; i < 50; i++) {
      const r = (() => { let s = i * 7 + 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
      h += (styleMessage(msg, heavy, r).match(/\{[et]:/g) || []).length;
      l += (styleMessage(msg, light, r).match(/\{[et]:/g) || []).length;
    }
    expect(h).toBeGreaterThan(l);
  });

  it('never leaves a stray space or an empty message', () => {
    const out = styleMessage('{e:heart}', { emoji: 0, hashtags: 0, caps: 0 }, () => 0.99);
    expect(out.trim().length).toBeGreaterThan(0);
    expect(displayText(styleMessage('ok {e:heart}  {t:Fam}', { emoji: 0, hashtags: 0, caps: 0 }, () => 0.99))).toBe('ok');
  });
});

describe('a status update', () => {
  it('is posted, not messaged', () => {
    expect(dictation('Good morning {e:sun}', 'Status', 'Post')).toBe('Status: "Good morning." Sun emoji. Post.');
  });
});
