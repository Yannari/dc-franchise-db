// ci-games.test.js — the game library and the games (Plan 3a).
import { describe, expect, it } from 'vitest';
import { GAMES, FAMILIES, PURPOSES, PRIZES, PARTY_THEMES } from '../js/ci/games-data.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

const VALID_STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];

describe('the game library', () => {
  it('has the real games, each with a family, a purpose, a prize, a source and the Circle\'s rules', () => {
    expect(GAMES.length).toBeGreaterThanOrEqual(40);
    const ids = GAMES.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GAMES) {
      expect(FAMILIES, g.id).toContain(g.family);
      expect(PURPOSES, g.id).toContain(g.purpose);
      expect(PRIZES, g.id).toContain(g.prize);
      expect(g.source, g.id).toMatch(/^(US|UK) \d/);
      expect(g.rules.length, g.id).toBeGreaterThan(0);
    }
    for (const f of FAMILIES) expect(GAMES.some(g => g.family === f), f).toBe(true);
  });

  it('gives the families that need prompts enough of them, on real stats', () => {
    for (const g of GAMES) {
      if (['statement', 'name', 'guess', 'team', 'make'].includes(g.family)) {
        expect(g.prompts?.length, g.id).toBeGreaterThanOrEqual(g.family === 'make' ? 1 : 4);
      }
      const pids = (g.prompts || []).map(p => p.id);
      expect(new Set(pids).size, g.id).toBe(pids.length);
      for (const p of g.prompts || []) {
        if (p.stat) expect(VALID_STATS, `${g.id}/${p.id}`).toContain(p.stat);
        for (const s of p.stats || []) expect(VALID_STATS, `${g.id}/${p.id}`).toContain(s);
        if (g.family === 'statement') expect([1, -1], `${g.id}/${p.id}`).toContain(p.lean);
        if (g.family === 'name') expect(['good', 'bad', 'funny'], `${g.id}/${p.id}`).toContain(p.tone);
      }
    }
  });

  it('writes in US English, names nobody real, and borrows no other show\'s words', () => {
    const texts = GAMES.flatMap(g => [g.name, ...g.rules, ...(g.prompts || []).map(p => p.text)]);
    const UK = /\b(colour|favourite|mum|realise|whilst|apologise|organise|mate|bloody|fancy)\b/i;
    for (const t of texts) {
      expect(t).not.toMatch(UK);
      expect(t).not.toMatch(/[{}]/);
      expect(foreignWordsIn(t, 'the-circle')).toEqual([]);
    }
    expect(PARTY_THEMES.length).toBeGreaterThanOrEqual(8);
    for (const th of PARTY_THEMES) expect(th.props.length, th.id).toBeGreaterThanOrEqual(3);
  });
});
