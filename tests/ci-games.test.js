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

import { runGame } from '../js/ci/games.js';
import { rel } from '../js/ci/state.js';
import { mood } from '../js/ci/mind.js';

const game = id => GAMES.find(g => g.id === id);

describe('public-answer games', () => {
  it('a statement game: everyone answers every round once, the same-answer pairs warm', () => {
    const s = room(8, 2);
    const sc = runGame(s, streamFor(2, 'g'), game('ice-breaker'));
    expect(sc.kind).toBe('game');
    expect(sc.data.rounds.length).toBeGreaterThanOrEqual(4);
    for (const r of sc.data.rounds) expect(Object.keys(r.answers).sort()).toEqual([...s.active].sort());
    const [a, b] = s.active;
    const same = sc.data.rounds.filter(r => r.answers[a] === r.answers[b]).length;
    expect(rel(a, b, 'affection') > 0).toBe(same > 0);
  });

  it('a statement game: a catfish can give themselves away with an answer', () => {
    let slipped = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const s = room(8, seed);
      Object.assign(s.profiles['@q0'], { mode: 'catfish', gap: 2 });
      const sc = runGame(s, streamFor(seed, 'g'), game('ice-breaker'));
      if ((sc.data.slips || []).some(x => x.by === '@q0' && !x.misread)) slipped++;
    }
    expect(slipped).toBeGreaterThan(0);
  });

  it('a name game: the named-for-bad resent their namers, the named-for-good warm to theirs', () => {
    const s = room(8, 4);
    const sc = runGame(s, streamFor(4, 'g'), game('most-likely'));
    const g = game('most-likely');
    for (const r of sc.data.rounds) {
      const tone = g.prompts.find(p => p.id === r.promptId).tone;
      for (const [namer, named] of Object.entries(r.answers)) {
        expect(named).not.toBe(namer);
        if (tone === 'bad') expect(rel(named, namer, 'resentment')).toBeGreaterThan(0);
        if (tone === 'good') expect(rel(named, namer, 'affection')).toBeGreaterThan(0);
      }
    }
  });

  it('a gift game: every giver gives once, the receiver warms, and nobody-picked is lonely', () => {
    const s = room(8, 5);
    const before = Object.fromEntries(s.active.map(h => [h, mood(s, h, 'loneliness')]));
    const sc = runGame(s, streamFor(5, 'g'), game('democracy-day'));
    const gifts = sc.data.rounds[0].answers;
    expect(Object.keys(gifts).sort()).toEqual([...s.active].sort());
    for (const [giver, to] of Object.entries(gifts)) expect(rel(to, giver, 'affection')).toBeGreaterThanOrEqual(1);
    const unpicked = s.active.filter(h => !Object.values(gifts).includes(h));
    for (const h of unpicked) expect(mood(s, h, 'loneliness')).toBeGreaterThan(before[h]);
  });

  it('a rival game: every rival is public knowledge and resents the one who named them', () => {
    const s = room(6, 6);
    const sc = runGame(s, streamFor(6, 'g'), game('state-your-case'));
    const named = Object.entries(sc.data.rounds[0].answers);
    expect(named).toHaveLength(6);
    for (const [namer, rival] of named) {
      expect(rel(rival, namer, 'resentment')).toBeGreaterThan(0);
      const c = s.claims.find(x => x.kind === 'targeting' && x.holder === namer && x.about === rival);
      expect(c?.secrecy).toBe('public');
      for (const o of s.active) if (o !== namer) expect(s.know[o]?.[c.id]).toBeTruthy();
    }
  });

  it('runs every public family with three players', () => {
    for (const id of ['ice-breaker', 'most-likely', 'democracy-day', 'state-your-case']) {
      const s = room(3, 7);
      const sc = runGame(s, streamFor(7, id), game(id));
      for (const r of sc.data.rounds) expect(Object.keys(r.answers)).toHaveLength(3);
    }
  });
});

describe('a shared profile in a game', () => {
  it('answers once for the pair, never twice', () => {
    const s = room(6, 8);
    s.people.Q9 = { ...s.people.Q0, name: 'Q9' };
    s.profiles['@q0'].players.push('Q9'); s.profiles['@q0'].mode = 'shared'; s.handleOf.Q9 = '@q0';
    for (const id of ['ice-breaker', 'most-likely', 'democracy-day', 'state-your-case']) {
      const sc = runGame(s, streamFor(8, id), game(id));
      for (const r of sc.data.rounds) expect(Object.keys(r.answers).sort()).toEqual([...s.active].sort());
    }
  });
});

import { belief } from '../js/ci/beliefs.js';

describe('catfish tests', () => {
  it('an ask game: a suspected player is questioned in public, and a failed answer costs them with everyone', () => {
    let failures = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const s = room(6, seed);
      Object.assign(s.profiles['@q0'], { mode: 'catfish', gap: 3 });
      s.people.Q0.stats.mental = 1; s.people.Q0.stats.strategic = 1;
      for (const h of s.active) if (h !== '@q0') belief(s, h, '@q0').real = 0.3;
      const before = Object.fromEntries(s.active.map(h => [h, belief(s, h, '@q0').real]));
      const sc = runGame(s, streamFor(seed, 'ask'), game('ama'));
      const qs = sc.data.rounds[0].questions;
      expect(qs).toHaveLength(6);
      for (const qq of qs.filter(x => x.target === '@q0' && x.kind === 'catfish' && x.result === 'fail')) {
        failures++;
        for (const obs of s.active) if (obs !== qq.asker && obs !== '@q0') expect(belief(s, obs, '@q0').real).toBeLessThan(before[obs]);
      }
    }
    expect(failures).toBeGreaterThan(0);
  });

  it('an ask game: a nice player never sends a barbed question', () => {
    const s = room(6, 3);
    for (const n of Object.keys(s.people)) s.people[n].archetype = 'hero';
    for (const a of s.active) for (const b of s.active) if (a !== b) bump(a, b, 'resentment', 6);
    const sc = runGame(s, streamFor(3, 'ask'), game('ama'));
    expect(sc.data.rounds[0].questions.some(x => x.kind === 'barbed')).toBe(false);
  });

  it('a guess game: a catfish gives themselves away more than the same player honest (control arm)', () => {
    const slipsWith = gap => {
      let n = 0;
      for (let seed = 1; seed <= 150; seed++) {
        const s = room(6, seed);
        Object.assign(s.profiles['@q0'], { mode: gap ? 'catfish' : 'honest', gap });
        const sc = runGame(s, streamFor(seed, 'guess'), game('says-who'));
        n += (sc.data.slips || []).filter(x => x.by === '@q0' && !x.misread).length;
      }
      return n;
    };
    expect(slipsWith(2)).toBeGreaterThan(slipsWith(0) + 5);
  });
});
