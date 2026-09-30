// Keeping a persona up (Plan 3a+ Task 15). A catfish is supposed to come
// across a certain way: the sweet cowgirl, the gym bro, the pastry chef.
// How far that is from the real person decides how often the cover cracks.
// No gender axis: what cracks is style, age and smarts.
import { describe, expect, it } from 'vitest';
import { room } from './helpers/ci-room.js';
import { addScene } from '../js/ci/state.js';
import { personaStyle, coverStrain, coverParts, shownRegister } from '../js/ci/cover.js';
import { rollSlips, slipRisk } from '../js/ci/slips.js';
import { renderEntry, writeScene } from '../js/ci/script.js';
import { streamFor } from '../js/dr/rng.js';

const base = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
// A catfish at @q0: `real` is the person, `persona` what the profile shows.
function cover(real, persona, day = 3) {
  const s = room(6, 2);
  s.day = day;
  Object.assign(s.people.Q0, { age: 30, archetype: 'floater', ...real, stats: { ...base, ...(real.stats || {}) } });
  Object.assign(s.profiles['@q0'], { mode: 'catfish', gap: 1.5, personaStyle: null,
    shown: { name: 'Pat', gender: 'f', age: 27, job: 'nurse', ...persona } });
  if (persona.chatVoice) s.profiles['@q0'].personaVoice = persona.chatVoice;
  return s;
}

describe('what the persona is supposed to sound like', () => {
  it('reads it from the job and age, unless the author wrote it', () => {
    expect(personaStyle({ age: 24, job: 'personal trainer' }).register).toBe('hype');
    expect(personaStyle({ age: 46, job: 'lawyer' }).register).toBe('formal');
    expect(personaStyle({ age: 29, job: 'nurse' }).register).toBe('warm');
    expect(personaStyle({ age: 23, job: 'barrel racer', chatVoice: { register: 'flirty' } }).register).toBe('flirty');
    expect(personaStyle({ age: 46, job: 'lawyer' }).smarts).toBeGreaterThan(personaStyle({ age: 24, job: 'student' }).smarts);
  });
});

describe('how hard it is to keep up', () => {
  it('is easy for a near match and hard for a far one', () => {
    const near = cover({ age: 29, archetype: 'hero', stats: { social: 7, loyalty: 7 } }, { age: 27, job: 'nurse' });
    const far = cover({ age: 71, archetype: 'loyal-soldier', stats: { mental: 8, boldness: 2, temperament: 8 } }, { age: 26, job: 'personal trainer' });
    expect(coverStrain(near, '@q0')).toBeLessThan(coverStrain(far, '@q0') / 3);
  });

  it('costs more to play younger than to play older', () => {
    const younger = coverParts(cover({ age: 55 }, { age: 25, job: 'nurse' }), '@q0').age;
    const older = coverParts(cover({ age: 25 }, { age: 55, job: 'nurse' }), '@q0').age;
    expect(younger).toBeGreaterThan(older);
  });

  it('costs a sharp person something to play less sharp, and more to fake expertise', () => {
    const down = coverParts(cover({ stats: { mental: 9 } }, { job: 'student' }), '@q0').smarts;
    const up = coverParts(cover({ stats: { mental: 2 } }, { job: 'doctor' }), '@q0').smarts;
    expect(down).toBeGreaterThan(0);
    expect(up).toBeGreaterThan(down);
  });

  it('does not care about gender', () => {
    const a = coverStrain(cover({ gender: 'm' }, { gender: 'f' }), '@q0');
    const b = coverStrain(cover({ gender: 'f' }, { gender: 'f' }), '@q0');
    expect(a).toBe(b);
  });

  it('is eased by skill and preparation, and wears on over the season', () => {
    const who = { age: 60, stats: { social: 2, mental: 2, intuition: 2 } };
    const persona = { age: 24, job: 'personal trainer' };
    const clumsy = coverStrain(cover(who, persona), '@q0');
    const skilled = coverStrain(cover({ ...who, stats: { social: 9, mental: 9, intuition: 9 } }, persona), '@q0');
    const coached = coverStrain(cover({ ...who, prep: 1 }, persona), '@q0');
    const late = coverStrain(cover(who, persona, 12), '@q0');
    expect(skilled).toBeLessThan(clumsy);
    expect(coached).toBeLessThan(clumsy);
    expect(late).toBeGreaterThan(clumsy);
  });

  it('is nothing for an honest profile', () => {
    const s = room(3, 1);
    expect(coverStrain(s, '@q0')).toBe(0);
  });
});

describe('a cover that cracks', () => {
  it('slips more, and more of it on voice, the harder the cover', () => {
    const rate = s => {
      const sc = addScene(s, 'chat', ['@q0', '@q1'], {});
      let n = 0, voice = 0;
      for (let i = 0; i < 2000; i++) {
        for (const sl of rollSlips(s, streamFor(i, 'c'), '@q0', ['@q1'], { attention: 0.5 }, sc)) {
          if (sl.misread) continue;
          n++; if (sl.kind === 'voice') voice++;
        }
      }
      return { n, voice };
    };
    const near = rate(cover({ age: 29, archetype: 'hero', stats: { social: 7, loyalty: 7 } }, { age: 27, job: 'nurse' }));
    const far = rate(cover({ age: 71, archetype: 'loyal-soldier', stats: { mental: 8, boldness: 2, temperament: 8 } }, { age: 26, job: 'personal trainer' }));
    expect(far.n).toBeGreaterThan(near.n * 1.5);
    expect(far.voice / far.n).toBeGreaterThan(near.voice / Math.max(1, near.n));
  });

  it('a good cover slips less than before this model existed (same gap, no strain)', () => {
    const s = cover({ age: 28, archetype: 'hero', stats: { social: 8, loyalty: 7, mental: 7, intuition: 7 } }, { age: 27, job: 'nurse' });
    const withStrain = slipRisk(s, '@q0', {});
    s.profiles['@q0'].mode = 'edited';   // same gap, no cover to keep
    expect(withStrain).toBeLessThan(slipRisk(s, '@q0', {}));
  });

  it('types in the persona\'s voice, and in the real person\'s own when the cover cracks', () => {
    const s = cover({ age: 60, archetype: 'mastermind', chatVoice: { register: 'formal' } }, { age: 24, job: 'personal trainer' });
    s.profiles['@q0'].voice = { emoji: 1, hashtags: 1, caps: 0 };
    const entry = { id: 'x.1', turns: [{ by: 'a', send: "gonna crush leg day lol" }] };
    const held = addScene(s, 'chat', ['@q0', '@q1'], { slips: [] });
    const cracked = addScene(s, 'chat', ['@q0', '@q1'], { slips: [{ by: '@q0', kind: 'voice', noticedBy: [] }] });
    expect(shownRegister(s, '@q0', held)).toBe('hype');
    expect(shownRegister(s, '@q0', cracked)).toBe('formal');
    const text = sc => renderEntry(s, entry, { a: '@q0', b: '@q1' }, () => 0.9, { scene: sc }).lines[0].text;
    expect(text(cracked)).toBe('Going to crush leg day.');
  });

  it('uses the persona\'s own phrases while the cover holds, not the person\'s', () => {
    const s = cover({ chatVoice: { register: 'formal', openers: ['Per my last message,'] } },
      { age: 23, job: 'barrel racer', chatVoice: { register: 'warm', fillers: ["y'all"], rate: 1 } });
    s.profiles['@q0'].voice = { emoji: 1, hashtags: 1, caps: 0 };
    const held = addScene(s, 'chat', ['@q0', '@q1'], { slips: [] });
    const entry = { id: 'x.1', turns: [{ by: 'a', send: 'See you tomorrow' }] };
    expect(renderEntry(s, entry, { a: '@q0', b: '@q1' }, () => 0, { scene: held }).lines[0].text).toBe("See you tomorrow, y'all");
  });
});

describe('who catches it', () => {
  it('somebody near the persona\'s age hears a fake young voice sooner', () => {
    const count = readerAge => {
      const s = cover({ age: 60 }, { age: 23, job: 'student' });
      s.people.Q1.age = readerAge;
      const sc = addScene(s, 'chat', ['@q0', '@q1'], {});
      let caught = 0;
      for (let i = 0; i < 3000; i++) {
        for (const sl of rollSlips(s, streamFor(i, 'r'), '@q0', ['@q1'], { attention: 0.5 }, sc)) {
          if (sl.kind === 'voice' && sl.noticedBy.length) caught++;
        }
      }
      return caught;
    };
    expect(count(24)).toBeGreaterThan(count(58) * 1.15);
  });
});

import { crackOf } from '../js/ci/cover.js';
describe('which way a cover cracks', () => {
  it('is the direction the real voice pulls the persona', () => {
    expect(crackOf(cover({ chatVoice: { register: 'formal' } }, { age: 24, job: 'personal trainer' }), '@q0')).toBe('stiff');
    expect(crackOf(cover({ chatVoice: { register: 'hype' } }, { age: 46, job: 'lawyer' }), '@q0')).toBe('loud');
    expect(crackOf(cover({ chatVoice: { register: 'dry' } }, { age: 24, job: 'model' }), '@q0')).toBe('flat');
    expect(crackOf(cover({ age: 60, chatVoice: { register: 'warm' } }, { age: 27, job: 'nurse' }), '@q0')).toBe('dated');
    expect(crackOf(cover({ age: 22, chatVoice: { register: 'warm' } }, { age: 50, job: 'nurse' }), '@q0')).toBe('young');
  });
  it('picks a line that matches it', () => {
    const s = cover({ chatVoice: { register: 'hype' } }, { age: 46, job: 'lawyer' });
    const sc = addScene(s, 'chat', ['@q0', '@q1'], { intent: 'bond', ending: 'warm', claims: [],
      slips: [{ by: '@q0', kind: 'voice', noticedBy: ['@q1'] }] });
    const keys = writeScene(s, sc).blocks.flatMap(b => b.lines.map(l => l.text)).join(' ');
    expect(keys).not.toMatch(/at that age|rewind tapes|trying way too hard to sound young/);
  });
});
