// ch-voice-filters.test.js — a voice is a different thing to say, not the same sentence in another tone (the user,
// 2026-10-18), and four lines a Pairs read caught saying what was not true (2026-10-19).
import { describe, expect, it } from 'vitest';
import { POOLS, PRUNED, isFilter } from '../js/ch/script/lines/index.js';
import { humanize } from '../js/ch/script/write.js';

const entry = id => Object.values(POOLS).flat().find(e => e.id === id);

describe('voices are different things to say', () => {
  it('the gate takes out a variant that is its line again (capitals, "I think", a quip on the end)', () => {
    expect(isFilter('Who do you beat? Picture it. Picture winning.', 'Who do you beat?')).toBe(true);
    expect(isFilter('Okay! I think it\'s {target}! Is ANYBODY going to fight me on that?', 'Okay. I think it\'s {target}. Is anybody going to fight me on that?')).toBe(true);
    expect(isFilter('{a}. Really. A sock rope. Very mature.', '{a}!')).toBe(false);
    expect(PRUNED.filter).toBeGreaterThan(1000);
  });
  it('no variant left in any pool is its own line again', () => {
    const bad = [];
    for (const list of Object.values(POOLS)) for (const e of list) for (const t of e.turns) {
      for (const v of Object.values(t.v || {}).flat()) if (isFilter(v, t.say || t.conf || '')) bad.push(`${e.id}: ${v}`);
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

describe('lines that said what was not true', () => {
  it('"TJ\'s list" keeps its capitals at the start of a sentence', () => {
    expect(humanize("TJ's list doesn't vote.")).toBe("TJ's list doesn't vote.");
    expect(humanize("It's TJ'S LIST!")).toBe("It's TJ's list!");
    expect(humanize("I DON'T care.")).toBe("I don't care.");
  });
  it('"I saw where the votes were going" is said only by a changed ballot that went with the room', () => {
    for (const id of ['bc.1', 'bc.3']) expect(entry(id).when?.majority).toBe(true);
    expect(POOLS['ballot.changed'].filter(e => e.when?.majority === false).length).toBeGreaterThan(0);
  });
  it('"your first Arena is the worst" is for a rookie who has never been in one', () => {
    expect(entry('vm.2').when?.neverIn).toBe(true);
  });
  it('TJ never tells the women they are not voting on a women\'s week', () => {
    for (const e of POOLS['cer-open.f']) expect(e.turns[0].say).not.toMatch(/fellas, you're voting/i);
  });
  it('a goodbye that blames somebody says what they did', () => {
    const t = entry('gb.f7').turns.find(x => x.by === 'a' && x.say);
    expect(t.say).toMatch(/\{target\} did this/);
    for (const v of Object.values(t.v || {}).flat()) expect(v).not.toMatch(/^(Please listen|Listen)[^.]*\. It was \{target\}\./);
  });
});
