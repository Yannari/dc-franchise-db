import { describe, expect, it } from 'vitest';
import {
  applyProfileSelection, diffPublishedProfile,
  selectProfileVoice, validatePublishedProfile,
} from '../js/profile-import.js';

const stats = { physical:5,endurance:6,mental:7,social:8,strategic:9,
  loyalty:4,boldness:7,intuition:8,temperament:6 };

describe('published profile import', () => {
  it('selects blank fields but protects existing authored values', () => {
    const rows = diffPublishedProfile(
      { name:'Julia', slug:'julia', personality:'My edit', hometown:'' },
      { name:'Julia', slug:'julia', personality:'Published', hometown:'Toronto' });
    expect(rows.find(r => r.key === 'hometown').selected).toBe(true);
    expect(rows.find(r => r.key === 'personality').selected).toBe(false);
  });

  it('applies only checked fields without mutating either input', () => {
    const current = { name:'Julia', slug:'julia', personality:'Mine', hometown:'' };
    const published = { name:'Julia', slug:'julia', personality:'Theirs', hometown:'Toronto' };
    expect(applyProfileSelection(current, published, ['hometown']))
      .toEqual({ ...current, hometown:'Toronto' });
    expect(current.hometown).toBe('');
  });

  it('rejects unknown stats and malformed dates', () => {
    expect(validatePublishedProfile({ slug:'julia', stats:{ ...stats, luck:10 } }).errors)
      .toContain('Unknown stat: luck');
    expect(validatePublishedProfile({ slug:'julia', birthdate:'July 4' }).errors)
      .toContain('birthdate must use YYYY-MM-DD');
  });

  it('uses local, then roster, then legacy voice', () => {
    expect(selectProfileVoice({ localVoice:'local', rosterVoice:'roster', legacyVoice:'legacy' })).toBe('local');
    expect(selectProfileVoice({ localVoice:'', rosterVoice:'roster', legacyVoice:'legacy' })).toBe('roster');
    expect(selectProfileVoice({ localVoice:'', rosterVoice:'', legacyVoice:'legacy' })).toBe('legacy');
  });
});
