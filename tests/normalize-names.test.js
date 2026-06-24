import { describe, it, expect, beforeEach } from 'vitest';
import { setPlayers, setGs, normalizeAccentedNames, players, gs } from '../js/core.js';

describe('normalizeAccentedNames self-heal', () => {
  beforeEach(() => {
    setPlayers([{ name: 'Rosa-María', slug: 'rosa-maria' }, { name: 'Connor', slug: 'connor' }]);
    setGs({
      activePlayers: ['Rosa-María', 'Connor'],
      popularity: { 'Rosa-María': 5, 'Connor': 2 },         // name as object KEY
      bonds: { 'Connor|Rosa-María': 7 },                     // name inside a compound key
      episodeHistory: [{ summaryText: 'Rosa-María won immunity.' }], // name in saved text
    });
  });

  it('fixes names in cast values', () => {
    normalizeAccentedNames();
    expect(players[0].name).toBe('Rosa-Maria');
  });
  it('fixes names used as gs values and array entries', () => {
    normalizeAccentedNames();
    expect(gs.activePlayers).toContain('Rosa-Maria');
    expect(gs.activePlayers).not.toContain('Rosa-María');
    expect(gs.episodeHistory[0].summaryText).toBe('Rosa-Maria won immunity.');
  });
  it('fixes names used as object KEYS (popularity, bonds)', () => {
    normalizeAccentedNames();
    expect(gs.popularity['Rosa-Maria']).toBe(5);
    expect(gs.popularity['Rosa-María']).toBeUndefined();
    expect(gs.bonds['Connor|Rosa-Maria']).toBe(7);
  });
  it('is a no-op when no accented names exist', () => {
    setPlayers([{ name: 'Connor' }]);
    setGs({ activePlayers: ['Connor'] });
    normalizeAccentedNames();
    expect(players[0].name).toBe('Connor');
  });
});
