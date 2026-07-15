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

    expect(strategicMemoryScore('Alice', 'Bob', 3)).toBeCloseTo(1.64, 5);
    expect(strategicMemoryScore('Alice', 'Bob', 7)).toBeLessThan(1);
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
