// The format-neutral kernel behind both Big Brother's house beats and The
// Traitors' castle scenes: fresh-first weighted selection, a repeat cap, and
// an optional screen-time boost for underfeatured participants. See
// js/event-scheduler.js for why this exists and what deliberately did NOT
// move here (rooms, cooldown scopes, threads — those need format vocabulary).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scheduleWeightedEvents, weightedPick } from '../js/event-scheduler.js';

// A cycling rng driven off a fixed script, so a test can spell out exactly
// which draw lands where instead of trusting an arbitrary seed to produce a
// particular outcome. Cycles rather than throwing once exhausted — a
// scheduler this call makes N+1 draws is not a bug in the fixture.
function sequenceRng(values) {
  let i = 0;
  return () => { const v = values[i % values.length]; i++; return v; };
}

function countIds(out) {
  const counts = new Map();
  for (const entry of out) counts.set(entry.id, (counts.get(entry.id) || 0) + 1);
  return counts;
}

const ctx = {};

const EVENTS = [
  // Already heavily featured (participantCounts.A = 12) — the screen-time
  // boost gives it none, so its large base weight has to carry it.
  { id: 'popular-a', weight: () => 12, fire: () => ({ ok: true }), participants: ['A'] },
  // Barely featured (participantCounts.B = 0) — small base weight, but the
  // underfeatured boost has to give it a real path onto screen.
  { id: 'quiet-b', weight: () => 1, fire: () => ({ ok: true }), participants: ['B'] },
  // Ineligible outright (weight 0) despite also being under-featured — proves
  // the boost multiplies a real weight rather than manufacturing one from
  // nothing.
  { id: 'inert-c', weight: () => 0, fire: () => ({ ok: true }), participants: ['C'] },
];

describe('scheduleWeightedEvents contract', () => {
  it('penalizes repeats and gives underfeatured players a path onto screen', () => {
    const out = scheduleWeightedEvents(EVENTS, ctx, {
      rng: sequenceRng([0.01, 0.01, 0.75]), min:3, max:3,
      participantCounts:{ A:12, B:0, C:1 },
    });
    expect(out).toHaveLength(3);
    expect(out.some(x => x.participants.includes('B'))).toBe(true);
    expect(Math.max(...countIds(out).values())).toBeLessThanOrEqual(2);
  });

  it('never falls back to Math.random — rng is required', () => {
    expect(() => scheduleWeightedEvents(EVENTS, ctx, { min:1, max:1 })).toThrow(/rng/i);
  });

  it('does not itself call Math.random anywhere in its source (R4)', () => {
    const src = readFileSync(join(process.cwd(), 'js/event-scheduler.js'), 'utf8');
    // Strip comments before checking — the module's docs discuss Math.random
    // by name (explaining why it is banned), which must not itself trip the
    // guard. Only executable code may not reference it.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/Math\.random/);
  });

  it('respects a configurable maxUses instead of the default cap of 2', () => {
    const solo = [{ id: 'only', weight: () => 5, fire: () => ({ ok: true }) }];
    const out = scheduleWeightedEvents(solo, ctx, {
      rng: sequenceRng([0, 0, 0, 0]), min:4, max:4, maxUses: 1,
    });
    // Only one usable event exists and maxUses is 1: after its single airing
    // nothing remains eligible, so the run must stop short of the requested 4.
    expect(out).toHaveLength(1);
  });

  it('returns [] for an empty event list without consuming any rng', () => {
    let calls = 0;
    const rng = () => { calls++; return 0.5; };
    expect(scheduleWeightedEvents([], ctx, { rng, min:1, max:3 })).toEqual([]);
    expect(calls).toBe(0);
  });

  it('fires the winner immediately and records its result', () => {
    let fired = false;
    const events = [{ id: 'watched', weight: () => 5, fire: () => { fired = true; return { text: 'it happened' }; } }];
    const out = scheduleWeightedEvents(events, ctx, { rng: sequenceRng([0, 0]), min:1, max:1 });
    expect(fired).toBe(true);
    expect(out[0].result).toEqual({ text: 'it happened' });
  });

  it('lets a caller adapt weight() and fire() to a different call shape via scoreEvent/fireEvent', () => {
    const house = ['A', 'B'];
    const events = [{ id: 'custom-shape',
      weight: (h, beatCtx) => h.length + beatCtx.beat,
      fire: (h, beatCtx, api) => { api.touch(); return { players: h }; } }];
    const seen = [];
    const api = { touch: () => seen.push('touched') };
    const out = scheduleWeightedEvents(events, ctx, {
      rng: sequenceRng([0, 0]), min:1, max:1,
      scoreEvent: (ev, _c, meta) => ev.weight(house, { beat: meta.index }),
      fireEvent: (ev, _c, meta, rng) => ev.fire(house, { beat: meta.index }, api, rng),
    });
    expect(out[0].result).toEqual({ players: house });
    expect(seen).toEqual(['touched']);
  });

  it('interleaves scoring and firing beat-by-beat — a later beat sees what an earlier one just changed', () => {
    // The correctness property the module doc's opening paragraph exists for:
    // scoring every beat up front against a frozen snapshot, then firing them
    // all afterwards, would let beat 2's weight() claim eligibility that beat
    // 2's own fire() can no longer see once beat 1 has already mutated the
    // shared counter. Interleaved, beat 2 is scored AFTER beat 1 fires, so it
    // sees the counter's real value and is excluded correctly.
    let counter = 0;
    const events = [
      { id: 'raises-it', weight: () => (counter === 0 ? 5 : 0), fire: () => { counter = 1; return { ok: true }; } },
      { id: 'only-while-zero', weight: () => (counter === 0 ? 5 : 0), fire: () => ({ ok: true }) },
    ];
    // desired = min(2, 2 + floor(rng()*(2-2+1))) = 2 with min=max=2.
    const out = scheduleWeightedEvents(events, ctx, { rng: sequenceRng([0, 0.01, 0.99]), min:2, max:2 });
    // Beat 0: both events eligible (counter===0); low roll favours 'raises-it'.
    // It fires and sets counter to 1. Beat 1: 'only-while-zero' now scores 0
    // and 'raises-it' is capped at maxUses default... but maxUses is 2, so
    // 'raises-it' could fire again — the point being proven is that
    // 'only-while-zero' is NOT selected once counter is 1, which only an
    // interleaved (not frozen-snapshot) scoring pass can produce.
    expect(out.map(p => p.id)).not.toContain('only-while-zero');
  });
});

describe('weightedPick — the shared primitive both formats draw a scene from', () => {
  it('picks proportional to weight, consuming exactly one rng call', () => {
    let calls = 0;
    const rng = () => { calls++; return 0.99; };
    const entries = [{ weight: 1 }, { weight: 9 }];
    const picked = weightedPick(entries, rng);
    expect(picked).toBe(entries[1]);
    expect(calls).toBe(1);
  });

  it('supports a custom weight accessor, as Traitors keys on .score not .weight', () => {
    const entries = [{ score: 1 }, { score: 99 }];
    const picked = weightedPick(entries, () => 0.5, e => e.score);
    expect(picked).toBe(entries[1]);
  });

  it('returns null for an empty list', () => {
    expect(weightedPick([], () => 0.5)).toBeNull();
  });
});
