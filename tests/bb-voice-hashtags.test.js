// Big Brother reads a voice's hashtags the way the other shows do (bb/story/register.js).
//
// The user, 2026-10-22: "fix bb so it read the hashtags properly like the other shows ... read perfect
// match, its a better example". Big Brother took the first of nine registers in a fixed order that
// matched anywhere in the voice, hashtags or not: "#warm #dry" always spoke dry, a second hashtag was
// never heard, "#-warm" did nothing, and "means every word" read as mean.
import { describe, expect, it, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { voiceMix, registerOf } from '../js/bb/story/register.js';

const regs = v => voiceMix(v).map(([r]) => r);

describe('the hashtags, in the order written', () => {
  it('leads with the first hashtag, whatever order the registers are listed in', () => {
    expect(regs('Speaks plainly. #warm #dry')[0]).toBe('sweet');
    expect(regs('Speaks plainly. #dry #warm')[0]).toBe('sarcastic');
  });

  it('reads hashtags written run together', () => {
    // Fiore's voice in the roster ends "...never admits fault.#blunt#cruel#schemer"
    expect(regs('Never admits fault.#blunt#cruel#schemer')).toEqual(['tough', 'mean', 'smooth']);
  });

  it('weighs them as Perfect Match does: 4, 2.5, 1.5, then 1', () => {
    expect(voiceMix('Speaks plainly. #warm #dry #anxious #theatrical')).toEqual([['sweet', 4], ['sarcastic', 2.5], ['anxious', 1.5], ['theatrical', 1]]);
    expect(Object.fromEntries(voiceMix('Speaks plainly. #warm #dry:3'))).toEqual({ sweet: 4, sarcastic: 3 });
  });

  it('takes a tag away with #-tag, however it got there', () => {
    expect(regs('A warm, kind soul. #-warm')).not.toContain('sweet');
    expect(regs('Speaks plainly. #dry #-dry')).not.toContain('sarcastic');
  });

  it('reads a tag by the tags beside it', () => {
    expect(regs('Speaks plainly. #loud #blunt')[0]).toBe('tough');
    expect(regs('Speaks plainly. #loud #goofy')[0]).toBe('bubbly');
    expect(regs('Speaks plainly. #proud')[0]).toBe('smooth');
    expect(regs('Speaks plainly. #proud #blunt')[0]).toBe('tough');
    expect(regs('Speaks plainly. #calm #warm')[0]).toBe('sweet');
  });

  it('takes a Big Brother register named outright', () => {
    expect(regs('Speaks plainly. #bubbly')[0]).toBe('bubbly');
  });
});

describe('the words, whole words only', () => {
  it('does not read a register inside another word', () => {
    // each of these was a register before: means → mean, kind of → sweet, quiet → terse, intimidating → timid
    for (const v of ['Overwhelming energy, means well.', 'Kind of lost without his girlfriend.',
      'Then quietly reveals she is three moves ahead.', 'Gruff, intimidating, three words max.'])
      expect(regs(v).filter(r => ['mean', 'sweet', 'terse', 'anxious'].includes(r)), v).toEqual([]);
  });

  it('does not read a word the voice says somebody is NOT', () => {
    expect(regs('Lies compulsively, not cruelly.')).not.toContain('mean');
    expect(regs('Morally uncomfortable with mean play.')).not.toContain('mean');
    expect(regs('Slow to notice cruelty aimed at her.')).not.toContain('mean');
  });

  it('comes after the hashtags, in the order the words come', () => {
    expect(regs('Nervous and sarcastic. #warm')).toEqual(['sweet', 'anxious', 'sarcastic']);
  });
});

describe('one register per speaker per scene', () => {
  beforeAll(() => {
    globalThis.FRANCHISE_ROSTER = [
      { name: 'Zz Mix', archetype: 'floater', voice: 'Speaks plainly. #warm #dry' },
      { name: 'Zz Plain', archetype: 'villain', voice: 'Speaks plainly.' },
    ];
  });

  it('hears the second hashtag about as often as its weight says', () => {
    const n = 2000, got = { sweet: 0, sarcastic: 0 };
    for (let i = 0; i < n; i++) got[registerOf('Zz Mix', `scene-${i}`).reg]++;
    expect(got.sweet + got.sarcastic).toBe(n);
    // 2.5 of 6.5: about 38%
    expect(got.sarcastic / n).toBeGreaterThan(0.3);
    expect(got.sarcastic / n).toBeLessThan(0.46);
  });

  it('is the same all through one scene, and the strongest with no scene', () => {
    expect(registerOf('Zz Mix', 'scene-7').reg).toBe(registerOf('Zz Mix', 'scene-7').reg);
    expect(registerOf('Zz Mix').reg).toBe('sweet');
  });

  it('falls back on the archetype when the voice names none', () => {
    expect(registerOf('Zz Plain').reg).toBe('mean');
    expect(registerOf('Zz Plain', 'scene-1').reg).toBe('mean');
  });

  it('every caller passes the scene, so a scene keeps one voice', () => {
    const src = f => fs.readFileSync(path.join(process.cwd(), f), 'utf8');
    const story = src('js/bb/story/write.js');
    expect(story).toMatch(/pickTone\(pools\[k\], who, regKey\(ctx\)\)/);
    expect(story).toMatch(/variantOf\(t, by, regKey\(ctx\)\)/);
    expect(story).toMatch(/\.join\(' '\) \}, regKey\(ctx\)\)\)/);
    expect(src('js/bb/script/write.js')).toMatch(/variantOf\(t, by, `\$\{entry\.id\}/);
    expect(src('js/vp-bb-ep/steps.js')).toMatch(/voiceLine\(l0, 'script', null, null, scene\)/);
  });
});
