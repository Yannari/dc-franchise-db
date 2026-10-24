// "Call it": a call is about the NEXT exit, and only an exit can score it.
import { describe, it, expect } from 'vitest';
import { resolveCall, callStats } from '../js/calls.js';

const x = (guest, week) => ({ guest, week });

describe('resolveCall', () => {
  it('waits while no later exit has been filed', () => {
    const entry = { open: { round: 2, pick: 'Kyle' } };
    const r = resolveCall(entry, [x('Sabrina', 1), x('Jo', 2)]);
    expect(r.resolved).toBe(null);
    expect(r.entry).toBe(entry);
  });

  it('scores against the first round after the call, not a later one', () => {
    const r = resolveCall({ open: { round: 1, pick: 'Kyle' } }, [x('Sabrina', 1), x('Ana', 2), x('Kyle', 3)], 5);
    expect(r.resolved).toMatchObject({ week: 2, out: ['Ana'], pick: 'Kyle', hit: false, at: 5 });
    expect(r.entry.open).toBe(null);
    expect(r.entry.history).toHaveLength(1);
  });

  it('counts either name when a round sends two home', () => {
    const r = resolveCall({ open: { round: 3, pick: 'Blair' } }, [x('Skye', 4), x('Blair', 4)]);
    expect(r.resolved.hit).toBe(true);
    expect(r.resolved.out).toEqual(['Skye', 'Blair']);
  });

  it('a round with no exit leaves the call open, not wrong', () => {
    // Exits filed for rounds 1 and 2; the call was made at round 2 and round 3 had no boot.
    expect(resolveCall({ open: { round: 2, pick: 'Bo' } }, [x('A', 1), x('B', 2)]).resolved).toBe(null);
  });
});

describe('callStats', () => {
  it('runs the streak across seasons in the order the calls were scored', () => {
    const store = {
      'big-brother:2': { history: [{ hit: true, at: 1 }, { hit: true, at: 4 }] },
      'perfect-match:1': { history: [{ hit: false, at: 2 }, { hit: true, at: 3 }] },
    };
    expect(callStats(store)).toEqual({ made: 4, hits: 3, streak: 2, best: 2 });
  });
  it('starts at nothing', () => {
    expect(callStats({})).toEqual({ made: 0, hits: 0, streak: 0, best: 0 });
  });
});
