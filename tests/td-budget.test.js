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

// Stage 4: who gets the last places. Measured on the stage-3 matrix (2026-10-13): the top speaker of a three-episode
// window talked 1.54x an equal share at the median and 2.6x at the worst, and a third of a cast sat under half their
// share in the worst window, because within the colour the first system to propose took the room.
describe('who gets the last places (airtime)', () => {
  const look = (ratios = {}, pairs = {}) => ({ ratio: p => ratios[p] ?? 1, pair: k => pairs[k] || { seen: true, recent: 0 } });
  const one = { target: 1, ceiling: 3 };

  it('gives the last place to somebody the last episodes barely heard from', () => {
    const loud = scene('kit', 'colour', { players: ['Bruno', 'Millie'] }), quiet = scene('cut', 'colour', { players: ['Lake', 'Yul'] });
    const sel = selectScenes([loud, quiet], [], { scenes: 0, turns: 0 }, one, BIG, look({ Bruno: 2.5, Millie: 1.8, Lake: 0.4, Yul: 0.5 }));
    expect(sel.keep).toEqual([quiet]);
    // ...and without the books, the first proposal wins, as before
    expect(selectScenes([loud, quiet], [], { scenes: 0, turns: 0 }, one, BIG).keep).toEqual([loud]);
  });

  it('prefers a pair that has never had a scene of their own, and never the same pair twice in a day', () => {
    const old = scene('kit', 'colour', { players: ['Ann', 'Bea'] }), fresh = scene('kit', 'colour', { players: ['Cal', 'Dee'] });
    const sel = selectScenes([old, fresh], [], { scenes: 0, turns: 0 }, one, BIG, look({}, { 'Ann|Bea': { seen: true, recent: 2 }, 'Cal|Dee': { seen: false, recent: 0 } }));
    expect(sel.keep).toEqual([fresh]);
    const again = scene('banter', 'colour', { players: ['Bea', 'Ann'] }), other = scene('banter', 'colour', { players: ['Eve', 'Fay'] });
    const sel2 = selectScenes([again, other], [], { scenes: 0, turns: 0, people: { Ann: 1, Bea: 1 }, pairs: { 'Ann|Bea': 1 } }, one, BIG, look());
    expect(sel2.keep).toEqual([other]);
  });

  it('keeps a third scene in one day for somebody only when nothing else wants the place', () => {
    const third = scene('kit', 'colour', { players: ['Gwen'] }), first = scene('psyche', 'colour', { players: ['Owen'] });
    const sel = selectScenes([third, first], [], { scenes: 0, turns: 0, people: { Gwen: 2 } }, one, BIG, look());
    expect(sel.keep).toEqual([first]);
  });

  it('leaves the vote and the payoffs in their order: they are continuity, not airtime', () => {
    const v = scene('vote', 'must', { players: ['Bruno', 'Millie'] }), d1 = scene('follow-up', 'due', { players: ['Bruno', 'Gwen'] }), d2 = scene('turn', 'due', { players: ['Lake', 'Yul'] });
    const sel = selectScenes([v, d1, d2], [], { scenes: 0, turns: 0 }, { target: 1, ceiling: 2 }, BIG, look({ Bruno: 3, Lake: 0.2, Yul: 0.2 }));
    expect(sel.keep).toEqual([v, d1]);
  });

  it('lets a scene about somebody barely heard compete with the story of the day, not wait behind it', () => {
    const plot = scene('storyline', 'story', { players: ['Heather', 'Gwen'] }), life = scene('kit', 'colour', { players: ['Lindsay', 'Gabby'] });
    const sel = selectScenes([plot, life], [], { scenes: 0, turns: 0 }, one, BIG, look({ Lindsay: 0.2, Gabby: 0.8, Heather: 1.6, Gwen: 1.4 }));
    expect(sel.keep).toEqual([life]);
    expect(parseDirectorRow(sel.log[1])).toMatchObject({ aired: true, reason: 'underheard' });
    // ...but somebody heard about as much as anyone stays colour
    expect(selectScenes([plot, life], [], { scenes: 0, turns: 0 }, one, BIG, look({ Lindsay: 0.9, Gabby: 0.9 })).keep).toEqual([plot]);
  });

  it('still prefers the system\'s own order between two equal candidates', () => {
    const a = scene('storyline', 'story', { players: ['Ann', 'Bea'] }), b = scene('storyline', 'story', { players: ['Cal', 'Dee'] });
    expect(selectScenes([a, b], [], { scenes: 0, turns: 0 }, one, BIG, look()).keep).toEqual([a]);
  });
});
