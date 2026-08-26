// A season is not forty incidents. It is a handful of stories that get picked
// up, escalated, and paid off — and the only reason an accusation in episode 7
// can name episode 2 is that episode 2 wrote something down.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { openThread, advanceThread, closeThread, openThreadsFor, hottest, residueFor,
  heatAt, findOpenThread, abandonThread }
  from '../js/tr/threads.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 8).map(p => p.name);
beforeEach(() => {
  setPlayers(roster.players.slice(0, 8));
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
});

describe('a thread accumulates', () => {
  it('remembers every beat, with the episode attached', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'asked for a vote and did not get it');
    advanceThread(t.id, 4, 'broke the commitment at the table');
    const thread = gs.tr.threads.find(x => x.id === t.id);
    expect(thread.beats).toHaveLength(3);
    expect(thread.beats.map(b => b.ep)).toEqual([2, 3, 4]);
    expect(thread.lastEp).toBe(4);
  });

  it('gets hotter as it is fed', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    const cold = gs.tr.threads.find(x => x.id === t.id).heat;
    advanceThread(t.id, 3, 'again');
    advanceThread(t.id, 4, 'again');
    expect(gs.tr.threads.find(x => x.id === t.id).heat).toBeGreaterThan(cold);
  });

  it('cools when nobody feeds it, so a stale story stops steering the season', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'again');
    advanceThread(t.id, 4, 'again'); // heat is now 3, lastEp 4
    const thread = gs.tr.threads.find(x => x.id === t.id);

    // Direct heatAt observation: the number itself must move with partial
    // decay, not just "found vs not found" via a `?? 0` fallback.
    const fed = heatAt(thread, 4);
    const partiallyStale = heatAt(thread, 6);
    expect(partiallyStale).toBeLessThan(fed);
    expect(partiallyStale).toBeGreaterThan(0);

    // hottest() must surface that same decayed number, not just presence.
    expect(hottest(CAST[0], 6).heat).toBeCloseTo(partiallyStale);

    // Left alone long enough, it drops out of the live pool entirely.
    expect(hottest(CAST[0], 20)).toBeNull();
  });

  it('closes with an outcome, and stops being open', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    closeThread(t.id, 7, 'banished-and-was-faithful');
    expect(openThreadsFor(CAST[0], 7)).toHaveLength(0);
    expect(gs.tr.threads.find(x => x.id === t.id).outcome).toBe('banished-and-was-faithful');
  });

  it('leaves residue a later event can cite by episode, for BOTH parties', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 4, 'broke the commitment at the table');
    const resA = residueFor(CAST[0]);
    const resB = residueFor(CAST[1]);
    // A residue write restricted to the first party passes if only CAST[0]
    // is ever checked — a thread is citable by BOTH sides or it isn't real.
    expect(resA.length).toBeGreaterThan(0);
    expect(resB.length).toBeGreaterThan(0);
    expect(resA[0]).toHaveProperty('ep');
    expect(resA[0]).toHaveProperty('note');
    expect(resB.map(r => r.note)).toContain('broke the commitment at the table');
  });

  it('is deterministic — the same season replays the same threads', () => {
    const a = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    gs.tr = initTraitorsState();
    const b = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    expect(a.id).toBe(b.id);
  });

  it('re-opening the same story returns the SAME thread — no wipe, no fragmentation', () => {
    const a = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    const again = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    expect(again.id).toBe(a.id);
    expect(gs.tr.threads.filter(x => x.kind === 'suspicion').length).toBe(1);

    // Party order must not matter — [A,B] and [B,A] are the same story.
    const reordered = openThread('suspicion', [CAST[1], CAST[0]], 2, 'eavesdrop');
    expect(reordered.id).toBe(a.id);
    expect(gs.tr.threads.filter(x => x.kind === 'suspicion').length).toBe(1);
  });

  it('a cooled thread is revived, not fragmented into an unreachable duplicate', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'first follow-up');
    // Nothing feeds it for five episodes — it goes cold, but the pair is not
    // done: someone brings it back up in episode 8.
    const revived = openThread('suspicion', [CAST[0], CAST[1]], 8, 'she never let it go');

    // This is the plan's central claim in miniature: the episode-2 beat is
    // still attached to the SAME thread an episode-8 event revived, not
    // orphaned on a thread nothing can find any more.
    expect(revived.id).toBe(t.id);
    expect(revived.beats[0]).toMatchObject({ ep: 2, note: 'eavesdrop' });
    expect(revived.lastEp).toBe(8);
    expect(openThreadsFor(CAST[0], 8).map(x => x.id)).toContain(revived.id);
    expect(gs.tr.threads.filter(x => x.kind === 'suspicion').length).toBe(1);
  });

  it('findOpenThread reaches a cold thread regardless of heat', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    // Heat has fully decayed by ep 20 (hottest() would return null here) —
    // findOpenThread must still find it, because THAT is what lets it revive.
    expect(hottest(CAST[0], 20)).toBeNull();
    expect(findOpenThread('suspicion', [CAST[0], CAST[1]])?.id).toBe(t.id);
  });

  it('an abandoned thread stops being reachable as open, but the record stays', () => {
    const t = openThread('suspicion', [CAST[2], CAST[3]], 2, 'eavesdrop');
    abandonThread(t.id, 10);
    expect(openThreadsFor(CAST[2], 10)).toHaveLength(0);
    expect(findOpenThread('suspicion', [CAST[2], CAST[3]])).toBeNull();
    expect(gs.tr.threads.find(x => x.id === t.id).state).toBe('abandoned');
  });

  it('a closed thread is a payoff, not a reopenable one — a new episode gets a NEW thread', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'confirmed at the table');
    closeThread(t.id, 5, 'banished-and-was-guilty');
    const beatsBefore = JSON.parse(JSON.stringify(t.beats));

    // Someone raises the same pair again later — this MUST NOT reopen the
    // payoff. Closure is an ending; silently reviving it erases the ending.
    const after = openThread('suspicion', [CAST[0], CAST[1]], 9, 'brought it up again');

    expect(after.id).not.toBe(t.id);
    const closed = gs.tr.threads.find(x => x.id === t.id);
    expect(closed.state).toBe('closed');
    expect(closed.outcome).toBe('banished-and-was-guilty');
    expect(closed.beats).toEqual(beatsBefore); // untouched by the later call
    expect(gs.tr.threads.filter(x => x.kind === 'suspicion').length).toBe(2);
  });

  it('a revive writes residue for the revival episode, for both parties', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'first follow-up');
    const beforeA = residueFor(CAST[0]).length;
    const beforeB = residueFor(CAST[1]).length;

    openThread('suspicion', [CAST[0], CAST[1]], 8, 'she never let it go');

    // Residue-citation is the entire payoff of a revive: it is why episode 9
    // can name episode 8. If the revive stops writing it, that link is gone.
    const afterA = residueFor(CAST[0]);
    const afterB = residueFor(CAST[1]);
    expect(afterA.length).toBe(beforeA + 1);
    expect(afterB.length).toBe(beforeB + 1);
    expect(afterA[afterA.length - 1]).toMatchObject({ ep: 8, note: 'she never let it go' });
    expect(afterB[afterB.length - 1]).toMatchObject({ ep: 8, note: 'she never let it go' });
  });

  it('a revive raises heat — a story that comes back must outrank a fresh one', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'first follow-up');
    const heatBefore = gs.tr.threads.find(x => x.id === t.id).heat;

    const revived = openThread('suspicion', [CAST[0], CAST[1]], 8, 'she never let it go');

    expect(revived.heat).toBeGreaterThan(heatBefore);
  });

  it('a redundant re-announcement adds no second beat and no second residue entry', () => {
    const a = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    const beatsBefore = a.beats.length;
    const residueBefore = residueFor(CAST[0]).length;

    // Identical (kind, parties, ep, seed) — this is the SAME beat announced
    // twice, not a second one. If the guard were disabled, both counts here
    // would grow on the second call.
    openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');

    const again = gs.tr.threads.find(x => x.id === a.id);
    expect(again.beats.length).toBe(beatsBefore);
    expect(residueFor(CAST[0]).length).toBe(residueBefore);
  });
});
