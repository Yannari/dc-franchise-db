// @vitest-environment jsdom
// One budget for the day (js/td/story/director.js selectScenes; the director's pacing plan, stage 3).
//
// Measured 2026-10-12 (docs/verification/2026-10-12-td-pacing-baseline.md): about fifteen systems each filled the day
// by a private rule, and a tribal night ran 19 scenes at the median, a quarter of them vote talk. These pin the shared
// rule: the vote's information always airs; a payoff that is due may take the day past its target, never past the
// ceiling; colour fills to the target and stops; nothing airs twice; and a proposal that does not air gives back
// what it claimed.
import { describe, it, expect } from 'vitest';
import { selectScenes } from '../js/td/story/director.js';
import { onCommit, onDiscard, commit, discard, pending } from '../js/td/story/commit.js';
import { parseDirectorRow } from '../js/td/story/director-debug.js';

let id = 0;
const scene = (src, tier, extra = {}) => ({ at: id, src, tier, extra: !!extra.extra,
  item: { story: true, kind: extra.kind || `${src}.x`, players: extra.players || [`P${id}`, `Q${id}`], lineId: extra.lineId || `L${id++}`,
    lines: Array.from({ length: extra.turns ?? 4 }, (_, i) => ({ kind: 'say', by: 'A', text: String(i) })) } });
const BIG = { turnTarget: 1e9, turnCeiling: 1e9 };

describe('selectScenes', () => {
  it('airs every must, even past the ceiling', () => {
    const list = Array.from({ length: 6 }, () => scene('vote', 'must'));
    const sel = selectScenes(list, [], { scenes: 20, turns: 0 }, { target: 18, ceiling: 22 }, BIG);
    expect(sel.keep.length).toBe(6);
    expect(sel.scenes).toBe(26);
  });

  it('fills colour to the target and no further, and lets a due payoff take the day to the ceiling', () => {
    const list = [...Array.from({ length: 6 }, () => scene('kit', 'colour')), ...Array.from({ length: 6 }, () => scene('follow-up', 'due'))];
    const sel = selectScenes(list, [], { scenes: 14, turns: 0 }, { target: 18, ceiling: 22 }, BIG);
    // the due payoffs rank first: 14 + 6 = 20 is past the target, so no colour airs
    expect(sel.keep.filter(e => e.tier === 'due').length).toBe(6);
    expect(sel.keep.filter(e => e.tier === 'colour').length).toBe(0);
    const sel2 = selectScenes(list.filter(e => e.tier === 'colour'), [], { scenes: 14, turns: 0 }, { target: 18, ceiling: 22 }, BIG);
    expect(sel2.keep.length).toBe(4);
    expect(sel2.drop.every((e, i) => sel2.log.some(r => parseDirectorRow(r).reason === 'budget'))).toBe(true);
  });

  it('defers a due payoff only at the ceiling, and says so', () => {
    const list = Array.from({ length: 4 }, () => scene('turn', 'due'));
    const sel = selectScenes(list, [], { scenes: 20, turns: 0 }, { target: 18, ceiling: 22 }, BIG);
    expect(sel.keep.length).toBe(2);
    expect(sel.log.filter(r => parseDirectorRow(r).reason === 'deferred').length).toBe(2);
  });

  it('puts the storyline before the colour, and the extras last', () => {
    const list = [scene('kit', 'colour'), scene('storyline', 'story', { extra: true }), scene('storyline', 'story'), scene('cut', 'colour', { extra: true })];
    const sel = selectScenes(list, [], { scenes: 16, turns: 0 }, { target: 18, ceiling: 22 }, BIG);
    expect(sel.keep.map(e => e.src)).toEqual(['kit', 'storyline']);
    // ...and keeps the day in the order things were proposed
    expect(sel.keep[0]).toBe(list[0]);
  });

  it('never airs the same written scene twice, one bit a person, one payoff a pair', () => {
    const a = scene('storyline', 'story', { lineId: 'same' }), b = scene('cut', 'colour', { lineId: 'same' });
    const k1 = scene('kit', 'colour', { kind: 'kit.bit', players: ['Ann', 'Bea'] }); k1.item.scene = { who: { a: 'Ann' } };
    const k2 = scene('kit', 'colour', { kind: 'kit.solo', players: ['Ann'] }); k2.item.scene = { who: { a: 'Ann' } };
    const f = scene('follow-up', 'due', { players: ['Cal', 'Dee'] }), t = scene('turn', 'due', { players: ['Dee', 'Cal'] });
    const sel = selectScenes([a, b, k1, k2, f, t], [], { scenes: 0, turns: 0 }, { target: 18, ceiling: 22 }, BIG);
    expect(sel.keep).toEqual([a, k1, f]);
    const why = sel.log.map(parseDirectorRow).filter(r => !r.aired).map(r => r.reason);
    expect(why).toEqual(['same-scene', 'claimed', 'claimed']);
  });

  it('keeps a talky day from running over: colour stops at the dialogue target, the story at the ceiling', () => {
    // 60 said already: two 30-turn storylines reach 120 (under the 130 ceiling), a third would pass it; the kit would
    // take the day past the 100-turn target colour stops at
    const list = [scene('storyline', 'story', { turns: 30 }), scene('kit', 'colour', { turns: 30 }), scene('storyline', 'story', { turns: 30 }), scene('storyline', 'story', { turns: 30 })];
    const sel = selectScenes(list, [], { scenes: 0, turns: 60 }, { target: 18, ceiling: 22 }, { turnTarget: 100, turnCeiling: 130 });
    expect(sel.keep.map(e => e.src)).toEqual(['storyline', 'storyline']);
    expect(sel.log.map(parseDirectorRow).filter(r => !r.aired).map(r => r.reason)).toEqual(['dialogue-budget', 'dialogue-budget']);
  });

  it('logs every proposal, aired or not, in a form the Debug screen reads back', () => {
    const list = [scene('vote', 'must', { players: ['Gwen', 'Trent'] }), scene('kit', 'colour')];
    const sel = selectScenes(list, [], { scenes: 18, turns: 0 }, { target: 18, ceiling: 22 }, BIG);
    const rows = sel.log.map(parseDirectorRow);
    expect(rows[0]).toMatchObject({ aired: true, reason: 'must', src: 'vote', tier: 'must', who: ['Gwen', 'Trent'], turns: 4 });
    expect(rows[1]).toMatchObject({ aired: false, reason: 'budget', src: 'kit', tier: 'colour' });
  });
});

describe('a dropped proposal gives back what it claimed', () => {
  it('restores an engine moment it claimed, and spends nothing', () => {
    const ev = { aired: undefined };
    let spent = 0;
    const item = onDiscard(onCommit({ ref: 3 }, () => spent++), () => { ev.aired = undefined; });
    ev.aired = true;
    expect(pending(item)).toBe(true);
    discard(item);
    expect(ev.aired).toBe(undefined);
    expect(spent).toBe(0);
    expect(pending(item)).toBe(false);
  });

  it('keeps the claim once it airs (a later discard changes nothing)', () => {
    const ev = { aired: true };
    const item = onDiscard({ ref: 1 }, () => { ev.aired = null; });
    commit(item);
    discard(item);
    expect(ev.aired).toBe(true);
  });
});
