import { beforeEach, describe, expect, it } from 'vitest';
import { seedGs } from './helpers/setup.js';
import { gs } from '../js/core.js';
import {
  memoriesAbout,
  rememberStrategy,
  strategicMemoryReason,
  strategicMemoryScore,
} from '../js/strategy-memory.js';

describe('strategic memory', () => {
  beforeEach(() => seedGs({ episode: 4, strategicMemories: {} }));

  it('records contestant-specific memories and deduplicates the same event', () => {
    rememberStrategy('Alice', 'Bob', 'voted-for-me', 4, 1.2);
    rememberStrategy('Alice', 'Bob', 'voted-for-me', 4, 1.8);

    expect(memoriesAbout('Alice', 'Bob')).toHaveLength(1);
    expect(memoriesAbout('Alice', 'Bob')[0].severity).toBe(1.8);
    expect(memoriesAbout('Bob', 'Alice')).toHaveLength(0);
  });

  it('decays old incidents instead of forgetting them immediately', () => {
    rememberStrategy('Alice', 'Bob', 'voted-for-me', 2, 2);

    // Decay scales with severity now: texture fades fast, scars stay. A
    // severity-2 vote decays at 0.89 per episode instead of the old flat
    // 0.82 — still fading, just at the pace a real grudge fades.
    expect(strategicMemoryScore('Alice', 'Bob', 3)).toBeCloseTo(2 * 0.89, 5);
    expect(strategicMemoryScore('Alice', 'Bob', 12)).toBeLessThan(1);
    // And the law itself: a light note dies faster than a deep wound.
    rememberStrategy('Alice', 'Cara', 'was-there', 2, 1);
    rememberStrategy('Alice', 'Dan', 'alliance-betrayal', 2, 3);
    const noteKeeps = strategicMemoryScore('Alice', 'Cara', 8) / 1;
    const scarKeeps = strategicMemoryScore('Alice', 'Dan', 8) / 3;
    expect(scarKeeps).toBeGreaterThan(noteKeeps);
  });

  it('turns remembered events into episode-aware vote explanations', () => {
    rememberStrategy('Alice', 'Bob', 'eliminated-ally', 3, 2.2, { ally: 'Cara' });

    expect(strategicMemoryReason('Alice', 'Bob')).toContain('Bob helped eliminate Cara in episode 3');
  });

  it('caps each contestant memory log to keep long saves compact', () => {
    for (let ep = 1; ep <= 30; ep++) rememberStrategy('Alice', `Player ${ep}`, 'voted-for-me', ep, 1);

    expect(gs.strategicMemories.Alice).toHaveLength(24);
    expect(memoriesAbout('Alice', 'Player 1')).toHaveLength(0);
    expect(memoriesAbout('Alice', 'Player 30')).toHaveLength(1);
  });
});
