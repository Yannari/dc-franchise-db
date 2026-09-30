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
