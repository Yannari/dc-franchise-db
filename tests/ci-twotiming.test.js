// ci-twotiming.test.js — playing more than one person, and getting caught
// (user, 2026-10-02: "is it possible to catch someone having romance with many
// people ... playing 2 or more people / cheating? are they limited in
// romance"). ci/twotiming.js, lines/twotiming.js.
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, bump, rel } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { focusDamp, caught, gameTwoTimer, flingsOf } from '../js/ci/twotiming.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(over = {}, status = {}) {
  const s = newState(1); s.day = 4;
  const g = { P: 'm', B: 'f', C: 'f', D: 'f' };
  for (const n of ['P', 'B', 'C', 'D']) {
    s.people[n] = { name: n, gender: g[n], sexuality: 'straight', archetype: 'floater', stats: { ...STATS, ...(over[n] || {}) }, age: 25, status: status[n] || 'Single' };
    const h = `@${n.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [n], mode: 'honest', gap: 0, tells: [], shown: { name: n, gender: g[n], age: 25, status: status[n] || 'Single' } };
    s.active.push(h); initMind(s, h);
  }
  return s;
}
/** P has a romance going with B (and maybe C): flirts that landed, felt back. */
function romance(s, ...to) {
  for (const t of to) {
    ((s.flings ||= {})['@p'] ||= {})[t] = { day: s.day, scene: null };
    bump(t, '@p', 'attraction', 6); bump('@p', t, 'attraction', 6);
  }
}

describe('who can keep more than one romance going', () => {
  beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
  it('a loyal player with a romance going leans away from a second; a disloyal one does not', () => {
    const loyal = room({ P: { loyalty: 9 } }); romance(loyal, '@b');
    setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
    const player = room({ P: { loyalty: 1 } }); romance(player, '@b');
    expect(focusDamp(loyal, '@p', '@c')).toBeLessThan(focusDamp(player, '@p', '@c'));
    expect(focusDamp(player, '@p', '@c')).toBeGreaterThan(0.85);
  });
  it('someone really in a relationship holds back, as much as they are loyal', () => {
    const single = room({ P: { loyalty: 8 } });
    const taken = room({ P: { loyalty: 8 } }, { P: 'In a relationship' });
    expect(focusDamp(taken, '@p', '@c')).toBeLessThan(focusDamp(single, '@p', '@c'));
  });
});

describe('getting caught', () => {
  beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
  it('the two who find out trust and want the player less, and the three of them end up in a group chat', () => {
    const s = room(); romance(s, '@b', '@c');
    const before = [rel('@b', '@p', 'trust'), rel('@b', '@p', 'attraction')];
    const r = caught(s, streamFor(1, 'x'), '@p', ['@b', '@c'], { how: 'notes' });
    expect(rel('@b', '@p', 'trust')).toBeLessThan(before[0]);
    expect(rel('@b', '@p', 'attraction')).toBeLessThan(before[1]);
    expect(r.notes.data.intent).toBe('notes');
    expect(r.busted.data.event).toBe('busted');
    expect(['charm', 'confess', 'deny']).toContain(r.busted.data.response);
    // word gets round: it is a claim, and the two of them hold it
    expect(s.claims.some(c => c.kind === 'playing' && c.holder === '@p' && s.know['@b']?.[c.id])).toBe(true);
  });
  it('a relationship on the profile makes it cost more', () => {
    setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
    const a = room({ P: { social: 1, boldness: 1, loyalty: 1, strategic: 1 } }); romance(a, '@b', '@c');
    caught(a, () => 0.99, '@p', ['@b', '@c'], { how: 'notes' });
    const plain = rel('@b', '@p', 'trust');
    setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
    const b = room({ P: { social: 1, boldness: 1, loyalty: 1, strategic: 1 } }, { P: 'In a relationship' }); romance(b, '@b', '@c');
    caught(b, () => 0.99, '@p', ['@b', '@c'], { how: 'notes' });
    expect(rel('@b', '@p', 'trust')).toBeLessThan(plain);
  });
  it('the flirting game: picking one crush while the other one watches gives it away', () => {
    const s = room(); romance(s, '@b', '@c');
    const sc = { id: 'g1', data: { rounds: [{ answers: { '@p': '@b' } }] } };
    s.scenes.push(sc);
    const t = gameTwoTimer(s, streamFor(2, 'g'), sc);
    expect(t).toMatchObject({ by: '@p', watcher: '@c' });
    expect(flingsOf(s, '@p').length).toBeLessThan(2);
  });
});

describe('in played seasons', () => {
  it('players get caught in most seasons, every confrontation plays out, and a copied message is word for word', () => {
    let seasons = 0, withCatch = 0, busted = 0, copies = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const cast = rosterCast(13, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows, state } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
      seasons++;
      let caughtHere = false;
      for (const row of rows) for (const s of row.ci.aired || []) {
        const ks = (s.script?.blocks || []).map(b => b.key);
        if (ks.some(k => /^notes\.find/.test(k)) || ks.includes('party.twotime') || ks.includes('game.twotime')) caughtHere = true;
        if (s.kind === 'group-chat' && ks.includes('busted.open')) {
          busted++;
          expect(ks.some(k => /^busted\.accuse/.test(k))).toBe(true);
          expect(ks.some(k => /^busted\.(charm|confess|deny)/.test(k))).toBe(true);
          expect(ks.some(k => /^busted\.end\./.test(k))).toBe(true);
        }
        if (ks.includes('notes.find.copy') && state) {
          copies++;
          // the quote is the message the player actually sent
          const quoted = s.script.blocks[ks.indexOf('notes.find.copy')].lines.map(l => l.text).join(' ');
          const sent = Object.values(state.copiedTexts || {});
          expect(sent.some(t => quoted.includes(t))).toBe(true);
        }
      }
      if (caughtHere) withCatch++;
    }
    expect(withCatch / seasons).toBeGreaterThan(0.3);
    expect(withCatch / seasons).toBeLessThan(0.95);
    expect(busted).toBeGreaterThan(5);
  });
});
