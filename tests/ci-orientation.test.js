// ci-orientation.test.js — a persona's orientation (user, 2026-09-30: "do we
// get to decide sexual orientation of the catfish"). A profile shows an
// orientation (a persona's, or the player's own); who a person is drawn to
// stays with the REAL person. A profile that does not look like it would be
// into you draws less of a chase. A catfish flirts AS the persona: in
// character with those the persona would want, even when the person behind it
// does not (Seaburn as "Rebecca", US 1), and that performance strains the
// cover; and does not flirt against the persona's orientation.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { bump } from '../js/ci/state.js';
import { utilities, wouldReturn, personaInto } from '../js/ci/chat.js';
import { runChat } from '../js/ci/conversation.js';
import { playCircleSeason } from '../js/ci/season.js';
import { streamFor } from '../js/dr/rng.js';
import { room } from './helpers/ci-room.js';
import { makePlayers, circleSetup } from './helpers/ci-cast.js';

// Q0 f, Q1 m, Q2 f, Q3 m … all straight, all honest.
function catfish(s, h, shown) {
  Object.assign(s.profiles[h], { mode: 'catfish', gap: 3, shown: { ...s.profiles[h].shown, ...shown } });
}

describe('the profile shows an orientation', () => {
  it('a catfish shows the persona\'s; an honest player shows their own', () => {
    const cast = makePlayers(13, 4); setPlayers(cast);
    const names = cast.map(p => p.name);
    const setup = circleSetup(names);
    Object.assign(setup[names[0]], { catfish: 'always' });
    const pool = [{ id: 'p1', handle: 'Kim', age: 24, gender: 'f', sexuality: 'gay', jobId: 'bartender', status: 'Single', reasons: ['strategic'], details: [], fits: {} }];
    const { state } = playCircleSeason({ cast: names, setup, pool, seed: 4 });
    const h = state.handleOf[names[0]];
    if (state.profiles[h].mode === 'catfish') expect(state.profiles[h].shown.sexuality).toBe('gay');
    const honest = Object.values(state.profiles).find(p => p.mode !== 'catfish' && p.players.length === 1);
    expect(honest.shown.sexuality).toBe(state.people[honest.players[0]].sexuality || 'straight');
  });
});

describe('who looks like they would be into you', () => {
  it('a man sees a woman whose profile says she is gay as not into him, and flirts with her much less', () => {
    const s = room(4);
    bump('@q1', '@q0', 'attraction', 8); bump('@q1', '@q2', 'attraction', 8);
    s.profiles['@q2'].shown.sexuality = 'gay';
    expect(wouldReturn(s, '@q1', '@q0')).toBe(true);
    expect(wouldReturn(s, '@q1', '@q2')).toBe(false);
    expect(utilities(s, '@q1', '@q2').flirt).toBeLessThan(utilities(s, '@q1', '@q0').flirt * 0.5);
  });
});

describe('a catfish flirts as the persona', () => {
  it('a straight man playing a straight woman flirts, in character, with a man who likes the persona', () => {
    const s = room(4);
    catfish(s, '@q1', { gender: 'f', sexuality: 'straight' });   // Q1 is a man; the profile is a woman into men
    bump('@q3', '@q1', 'attraction', 8);                            // Q3 (a man) likes the persona
    expect(personaInto(s, '@q1', '@q3')).toBe(true);
    expect(utilities(s, '@q1', '@q3').flirt).toBeGreaterThan(0);  // no real attraction, still a flirt
  });
  it('the same catfish does not flirt with a woman, however drawn to her: the persona is not into women', () => {
    const s = room(4);
    catfish(s, '@q1', { gender: 'f', sexuality: 'straight' });
    bump('@q1', '@q0', 'attraction', 9);
    const honest = room(4); bump('@q1', '@q0', 'attraction', 9);
    expect(utilities(s, '@q1', '@q0').flirt).toBeLessThan(utilities(honest, '@q1', '@q0').flirt * 0.4);
  });
  it('a performed flirt is marked, and slips more than a real one', () => {
    let performedSlips = 0, realSlips = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const s = room(4, seed);
      catfish(s, '@q1', { gender: 'f', sexuality: 'straight' });
      bump('@q3', '@q1', 'attraction', 8);
      const sc = runChat(s, streamFor(seed, 'c'), { from: '@q1', to: '@q3', intent: 'flirt' });
      expect(sc.data.performed).toBe(true);
      performedSlips += (sc.data.slips || []).filter(x => x.by === '@q1' && !x.misread).length;
      const r = room(4, seed);
      catfish(r, '@q1', { gender: 'm', sexuality: 'straight' });   // a catfish flirting for real: same gap
      bump('@q1', '@q0', 'attraction', 8);
      const sc2 = runChat(r, streamFor(seed, 'c'), { from: '@q1', to: '@q0', intent: 'flirt' });
      expect(sc2.data.performed).toBeFalsy();
      realSlips += (sc2.data.slips || []).filter(x => x.by === '@q1' && !x.misread).length;
    }
    expect(performedSlips).toBeGreaterThan(realSlips);
  });
});

describe('a performed flirt sounds like one', () => {
  it('its lines come from chat.flirt.act, and a real flirt never does', async () => {
    const { writeScene } = await import('../js/ci/script.js');
    for (let seed = 1; seed <= 20; seed++) {
      const s = room(4, seed);
      catfish(s, '@q1', { gender: 'f', sexuality: 'straight' });
      bump('@q3', '@q1', 'attraction', 8);
      const sc = runChat(s, streamFor(seed, 'c'), { from: '@q1', to: '@q3', intent: 'flirt' });
      writeScene(s, sc);
      expect(sc.script.blocks[0].key).toMatch(/^chat\.flirt\.act\./);
    }
  });
});
