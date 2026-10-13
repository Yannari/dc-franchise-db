// @vitest-environment jsdom
// A scene proposed is not a scene aired (js/td/story/commit.js; the director's pacing plan, stage 2).
//
// Measured 2026-10-13 on five played seasons: 66 story proposals were never accepted (a challenge moment whose
// scene repeated one already on the list, an engine moment written out and then cut). Before, each of them had
// already spent what it was about: a setup marked paid off, a kit line used, an arc moved a step, a line counted
// as said. These pin the rule: a proposal changes nothing until it is accepted, and then changes it once.
import { describe, it, expect, beforeEach } from 'vitest';
import * as core from '../js/core.js';
import { onCommit, adopt, commit, discard, pending } from '../js/td/story/commit.js';
import { turnScene } from '../js/td/story/turns.js';
import { writeStory } from '../js/td/story/write.js';

const stubWrite = id => () => ({ lines: [{ kind: 'say', by: 'Ann', text: `line ${id}` }], text: `line ${id}`, lineId: id, spot: null });

beforeEach(() => {
  core.setGs({ episode: 2, activePlayers: ['Ann', 'Bea', 'Cal'], bonds: {}, episodeHistory: [], tdStory: {} });
});

describe('commit.js', () => {
  it('runs a candidate\'s changes on acceptance, once, and never for a discarded one', () => {
    let n = 0;
    const a = onCommit({}, () => n++), b = onCommit({}, () => n++);
    expect(pending(a)).toBe(true);
    discard(b);
    commit(a); commit(a);
    expect(n).toBe(1);
    expect(pending(a) || pending(b)).toBe(false);
  });

  it('hands what waits on the writer\'s result to the scene built from it', () => {
    let n = 0;
    const w = onCommit({ lines: [] }, () => n++);
    const item = adopt({ kind: 'x' }, w);
    expect(pending(w)).toBe(false);
    commit(item);
    expect(n).toBe(1);
  });

  it('keeps nothing on the scene itself, so a saved episode is exactly what aired', () => {
    const item = onCommit({ kind: 'x', lines: [] }, () => {});
    expect(JSON.parse(JSON.stringify(item))).toEqual({ kind: 'x', lines: [] });
  });
});

describe('a turn (turns.js) is paid off when it airs', () => {
  const setup = () => {
    core.gs.tdStory.turns = [{ kind: 'helped', by: 'Ann', to: 'Bea', remark: 'Thanks.', id: 's1', ep: 1, camp: 'Bass', done: false }];
    return { num: 2, campEvents: { Bass: { pre: [{ type: 'comfort', players: ['Bea', 'Ann'] }], post: [] } } };
  };
  it('leaves the setup open when the scene is proposed and not taken', () => {
    const ep = setup();
    const t = turnScene(ep, 'Bass', ['Ann', 'Bea', 'Cal'], null, () => 1, () => ({}), 'post', new Set(), stubWrite('t1'));
    expect(t?.item?.step).toBe('helpback');
    discard(t.item);
    expect(core.gs.tdStory.turns[0].done).toBe(false);
    // ...so it can still be told another day
    expect(turnScene(ep, 'Bass', ['Ann', 'Bea', 'Cal'], null, () => 2, () => ({}), 'post', new Set(), stubWrite('t2'))).toBeTruthy();
  });
  it('closes it when the scene is accepted, and a competing proposal for it then has nothing to tell', () => {
    const ep = setup();
    const first = turnScene(ep, 'Bass', ['Ann', 'Bea', 'Cal'], null, () => 1, () => ({}), 'post', new Set(), stubWrite('t1'));
    const rival = turnScene(ep, 'Bass', ['Ann', 'Bea', 'Cal'], null, () => 2, () => ({}), 'post', new Set(), stubWrite('t2'));
    expect(rival).toBeTruthy();
    commit(first.item);
    expect(core.gs.tdStory.turns[0].done).toBe(true);
    discard(rival.item);
    expect(turnScene(ep, 'Bass', ['Ann', 'Bea', 'Cal'], null, () => 3, () => ({}), 'post', new Set(), stubWrite('t3'))).toBeNull();
  });
});

describe('the writer in draft (write.js ctx.draft)', () => {
  const write = draft => writeStory('chm.banter', 'any', { a: 'Ann', b: 'Bea' }, { chal: 'the swim' },
    { venue: 'hosted-camp', pair: true }, { ep: 2, camp: 'Bass', phase: 'post', n: 1, place: 'aside', unique: 'soft', ...(draft ? { draft: true } : {}) });
  const used = () => core.gs.tdStory.epUsed?.ids || [];
  it('spends a proposal\'s scene only when it is accepted', () => {
    const w = write(true);
    expect(w).toBeTruthy();
    expect(used()).not.toContain(w.lineId);
    commit(w.lines);
    expect(used()).toContain(w.lineId);
  });
  it('spends it at once when the caller is not proposing', () => {
    const w = write(false);
    expect(used()).toContain(w.lineId);
    expect(pending(w.lines)).toBe(false);
  });
});
