// A season is not forty incidents. It is a handful of stories that get picked
// up, escalated, and paid off — and the only reason an accusation in episode 7
// can name episode 2 is that episode 2 wrote something down.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { openThread, advanceThread, closeThread, openThreadsFor, hottest, residueFor }
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
    const atOpen = hottest(CAST[0], 2)?.heat ?? 0;
    const stale = hottest(CAST[0], 9)?.heat ?? 0;
    expect(stale).toBeLessThan(atOpen);
  });

  it('closes with an outcome, and stops being open', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    closeThread(t.id, 7, 'banished-and-was-faithful');
    expect(openThreadsFor(CAST[0], 7)).toHaveLength(0);
    expect(gs.tr.threads.find(x => x.id === t.id).outcome).toBe('banished-and-was-faithful');
  });

  it('leaves residue a later event can cite by episode', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 4, 'broke the commitment at the table');
    const res = residueFor(CAST[0]);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0]).toHaveProperty('ep');
    expect(res[0]).toHaveProperty('note');
  });

  it('is deterministic — the same season replays the same threads', () => {
    const a = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    gs.tr = initTraitorsState();
    const b = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    expect(a.id).toBe(b.id);
  });
});
