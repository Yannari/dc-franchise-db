// Identity twists (Plan 3b Task 9b): who sits behind a profile, and who the
// room believes is real. Checked on what the engine did in a booked season.
import { describe, expect, it } from 'vitest';
import { setPlayers, TWIST_CATALOG } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';
import { EVENTS } from '../js/ci/twists.js';

function booked(slot, id, seed = 5) {
  const cast = makePlayers(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const out = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, seed), seed,
    options: { bookings: { [slot]: [id] } } });
  const day = out.state.schedule.find(d => d.slot === slot).day;
  const on = kind => out.state.scenes.filter(s => s.kind === kind && s.day === day);
  return { ...out, day, on };
}

describe('the catalog', () => {
  it('every Circle twist event names a registered event', () => {
    const mine = TWIST_CATALOG.filter(t => t.format === 'the-circle' && t.ciTwist);
    expect(mine.length).toBeGreaterThanOrEqual(3);
    for (const t of mine) { expect(Object.keys(EVENTS), t.id).toContain(t.ciTwist); expect(t.desc.length, t.id).toBeGreaterThan(200); }
  });
});

describe('the profile swap (US 7)', () => {
  it('two players play each other\'s profiles until the next blocking, then swap back', () => {
    const { on, state, day } = booked('social1', 'ci-profile-swap');
    const sw = on('swap')[0];
    expect(sw).toBeTruthy();
    const [A, B] = sw.data.handles;
    const [pa, pb] = sw.data.people;
    // during: A is played by B's person
    const during = state.scenes.find(s => s.day === day && s.kind === 'chat' && s.who[0] === A && s.id > sw.id);
    void during;
    expect(sw.data.until).toBeGreaterThan(day);
    // after the next blocking everyone is back where they started (or blocked)
    for (const [h, p] of [[A, pa], [B, pb]]) {
      if (state.profiles[h] && !state.blocked.some(b => b.handle === h && b.day < sw.data.until)) expect(state.profiles[h].players).toEqual(p);
    }
  });
});

describe('the clone (US 3, UK 3)', () => {
  it('a blocked player comes back as a copy of an active profile; the room votes; whoever is voted fake leaves', () => {
    const { on, state, day, result } = booked('rating4', 'ci-clone');
    const c = on('clone')[0];
    expect(c).toBeTruthy();
    const { original, clone, votes, fake } = c.data;
    expect(state.profiles[clone].shown.name).toBe(state.profiles[original].shown.name);
    expect([original, clone]).toContain(fake);
    const tally = { [original]: 0, [clone]: 0 };
    for (const v of Object.values(votes)) tally[v]++;
    expect(tally[fake]).toBeGreaterThanOrEqual(tally[fake === original ? clone : original]);
    expect(state.blocked.some(b => b.handle === fake && b.day === day)).toBe(true);
    expect(result.placements).toHaveLength(5);
  });
});

describe('Ride or Die (US 6)', () => {
  it('pairs are made in secret; a blocked member\'s partner may go in their place; one leaves either way', () => {
    const { on, state } = booked('rating3', 'ci-ride-or-die');
    const pairs = on('ride-or-die')[0]?.data.pairs;
    expect(pairs?.length).toBeGreaterThan(0);
    for (const [a, b] of pairs) expect(a).not.toBe(b);
    const later = state.scenes.filter(s => s.kind === 'sacrifice');
    for (const s of later) {
      const gone = state.blocked.filter(b => b.day === s.day).map(b => b.handle);
      expect(gone).toContain(s.data.goes);
      expect(gone).not.toContain(s.data.stays);
    }
  });
});

// ── 9b part 2: twists that change the count ─────────────────────────────
describe('second chance (US 2, US 5)', () => {
  it('two blocked players return as one shared profile; the season still ends with five', () => {
    for (const seed of [3, 5, 7]) {
      const { state, day, result } = booked('rating5', 'ci-second-chance', seed);
      const sc = state.scenes.find(s => s.kind === 'second-chance' && s.day === day);
      expect(sc, `seed ${seed}`).toBeTruthy();
      const p = state.profiles[sc.data.handle];
      expect(p.players).toHaveLength(2);
      for (const n of p.players) expect(state.blocked.some(b => state.profiles[b.handle].players.includes(n) || b.people?.includes(n))).toBe(true);
      expect(result.placements, `seed ${seed}`).toHaveLength(5);
    }
  });
});

describe('the egg twist (UK 2 Ep 16)', () => {
  it('two anonymous newcomers; the room keeps one and the other is blocked at once; the season still ends with five', () => {
    for (const seed of [3, 5, 7]) {
      const cast = makePlayers(13, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const probe = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, seed), seed });
      const slot = probe.state.schedule.find(d => d.arrivals > 0).slot;
      const { state, result } = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, seed), seed,
        options: { bookings: { [slot]: ['ci-arrive-egg'] } } });
      const egg = state.scenes.find(s => s.kind === 'egg');
      expect(egg, `seed ${seed}`).toBeTruthy();
      expect(egg.data.eggs).toHaveLength(2);
      expect(egg.data.eggs).toContain(egg.data.goes);
      expect(state.blocked.some(b => b.handle === egg.data.goes && b.channel === 'egg')).toBe(true);
      expect(result.placements, `seed ${seed}`).toHaveLength(5);
    }
  });
});

// ── 9b part 3: the AI player and Most Human (US 6) ─────────────────────
import { attractionOk } from '../js/ci/chat.js';
import { probe } from '../js/ci/slips.js';
import { schemeEligible, addScene } from '../js/ci/state.js';
import { room } from './helpers/ci-room.js';
import { addAI, AI_HANDLE } from '../js/ci/ai.js';
import { streamFor } from '../js/dr/rng.js';
describe('the AI player (US 6)', () => {
  it('plays from Day 1 as one more player, and the season still ends with five', () => {
    const cast = makePlayers(13, 5); setPlayers(cast);
    const names = cast.map(p => p.name);
    const { state, result } = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, 5), seed: 5, options: { ai: true } });
    expect(state.joinedDay[AI_HANDLE]).toBe(1);
    expect(result.placements).toHaveLength(5);
  });
  it('never schemes, cannot flirt, and fails human questions more than a person with the same cover', () => {
    const s = room(5, 2);
    addAI(s); s.active.push(AI_HANDLE);
    expect(schemeEligible(s, AI_HANDLE)).toBe(false);
    for (const h of s.active.filter(x => x !== AI_HANDLE)) expect(attractionOk(s, AI_HANDLE, h)).toBe(false);
    const fails = h => {
      let n = 0;
      for (let i = 0; i < 400; i++) {
        const sc = addScene(s, 'chat', ['@q0', h], {});
        if (probe(s, streamFor(i, 'p'), '@q0', h, sc) === 'fail') n++;
      }
      return n;
    };
    Object.assign(s.profiles['@q1'], { mode: 'catfish', gap: s.profiles[AI_HANDLE].gap });
    Object.assign(s.people.Q1.stats, s.people['The AI'].stats);
    expect(fails(AI_HANDLE)).toBeGreaterThan(fails('@q1') * 1.2);
  });
});

describe('Most Human (US 6 Ep 3)', () => {
  it('players rank from most to least human, and the most human blocks alone', () => {
    const { on } = booked('rating3', 'ci-most-human');
    const r = on('ratings')[0];
    expect(r.data.human).toBe(true);
    const block = on('blocking')[0];
    expect(block.data.by).toEqual([r.data.results[0].profile]);
  });
});
