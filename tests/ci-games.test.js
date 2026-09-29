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

import { setGs } from '../js/core.js';
import { newState, bump } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { streamFor } from '../js/dr/rng.js';
import { pickGame } from '../js/ci/games.js';

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
export function room(n = 8, seed = 3) {
  setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
  const s = newState(seed);
  s.day = 1;
  for (let i = 0; i < n; i++) {
    const name = `Q${i}`, handle = `@q${i}`;
    s.people[name] = { name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: 'floater', stats: { ...STATS }, age: 25 };
    s.profiles[handle] = { handle, players: [name], mode: 'honest', gap: 0,
      shown: { name: `Q${i}`, gender: i % 2 ? 'm' : 'f', age: 25 }, voice: { emoji: 0.5, hashtags: 0.5, caps: 0 } };
    s.handleOf[name] = handle; s.active.push(handle); initMind(s, handle);
  }
  return s;
}

describe('which game', () => {
  it('never repeats a game, opens with a learn game, and never plays one purpose three times running', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = room(10, seed);
      const played = [];
      for (let day = 1; day <= 12; day++) {
        s.day = day;
        played.push(pickGame(s, streamFor(seed, `game:${day}`), { days: 13 }));
      }
      expect(new Set(played.map(g => g.id)).size).toBe(played.length);
      expect(played[0].purpose).toBe('learn');
      for (let i = 2; i < played.length; i++) {
        expect(played[i].purpose === played[i - 1].purpose && played[i].purpose === played[i - 2].purpose).toBe(false);
      }
    }
  });

  it('plays no team game with fewer than six, and no flirt game without a mutual spark', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = room(5, seed);
      s.day = 5;
      const g = pickGame(s, streamFor(seed, 'x'), { days: 13 });
      expect(g.family).not.toBe('team');
      expect(g.family).not.toBe('flirt');
    }
    const s = room(8, 1);
    bump('@q0', '@q1', 'attraction', 8); bump('@q1', '@q0', 'attraction', 8);
    s.gamesPlayed = GAMES.filter(g => g.family !== 'flirt').map(g => g.id);
    s.day = 5;
    expect(pickGame(s, streamFor(1, 'x'), { days: 13 }).family).toBe('flirt');
  });
});
