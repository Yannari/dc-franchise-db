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

  it('keeps two sentences apart when the emoji between them is dropped or read out', () => {
    const msg = "Same {e:laugh} Let's go one by one";
    expect(displayText(styleMessage(msg, { emoji: 0 }, () => 0.99))).toBe("Same. Let's go one by one");
    expect(dictation(msg)).toBe(`Message: "Same. Let's go one by one." Laughing emoji. Send.`);
    expect(displayText(styleMessage("Hi you {e:smile} I was hoping", { emoji: 1 }, () => 0))).toBe('Hi you 😊 I was hoping');
  });
  it('doubles a lone exclamation for a loud voice, but never an already doubled one', () => {
    const loud = { caps: 2 };
    expect(styleMessage('We did it! Final five', loud, () => 0)).toBe('We did it!! Final five');
    expect(styleMessage('We did it!! Final five!!', loud, () => 0)).toBe('We did it!! Final five!!');
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

describe('a register shapes how a message is typed', () => {
  const flat = { emoji: 1, hashtags: 1, caps: 0 };
  it('types lowercase and flat when dry, keeping I as I', () => {
    expect(styleMessage("Okay I'm so done with today! Who's cooking", { ...flat, register: 'dry' }, () => 0.9))
      .toBe("okay I'm so done with today. who's cooking");
  });
  it('writes it out properly when formal', () => {
    expect(styleMessage("lol I'm gonna make pasta, wanna join", { ...flat, register: 'formal' }, () => 0.9))
      .toBe("I'm going to make pasta, want to join.");
  });
  it('drops the softeners when blunt', () => {
    expect(styleMessage('Honestly, I think you lied lol', { ...flat, register: 'blunt' }, () => 0.9)).toBe('I think you lied');
  });
  it('shouts sometimes when hype', () => {
    expect(styleMessage("Let's go team {e:fire}", { ...flat, register: 'hype' }, () => 0)).toBe("LET'S GO TEAM! {e:fire}");
    expect(styleMessage("Let's go team {e:fire}", { ...flat, register: 'hype' }, () => 0.9)).toBe("Let's go team {e:fire}");
  });
  it('never breaks a hashtag or an emoji', () => {
    expect(styleMessage('Love you guys {t:CircleFam} {e:heart}', { ...flat, register: 'dry' }, () => 0.9)).toBe('love you guys {t:CircleFam} {e:heart}');
  });
});

describe('formal keeps the sentences apart', () => {
  it('drops "lol" but not the full stop after it, and spells out gotta properly', () => {
    const v = { emoji: 1, hashtags: 1, caps: 0, register: 'formal' };
    expect(styleMessage("It's different lol. I'm still figuring it out", v, () => 0.9)).toBe("It's different. I'm still figuring it out.");
    expect(styleMessage("Somebody's gotta keep it interesting", v, () => 0.9)).toBe('Somebody has to keep it interesting.');
    expect(styleMessage('I gotta go', v, () => 0.9)).toBe('I have to go.');
  });
});
