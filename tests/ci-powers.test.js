// Powers handed over at a visit (Plan 3b Task 8, spec 11.1 and 14): checked
// on what the engine did in a booked season.
import { describe, expect, it } from 'vitest';
import { setPlayers, TWIST_CATALOG } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rel } from '../js/ci/state.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';
import { POWERS } from '../js/ci/powers.js';

function booked(slot, id, seed = 5) {
  const cast = makePlayers(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const out = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, seed), seed,
    options: { bookings: { [slot]: [id] } } });
  // The power is handed over at the visit, which opens the next day.
  const day = out.state.schedule.find(d => d.slot === slot).day + 1;
  const power = out.state.powers.find(p => p.day === day);
  return { ...out, day, power };
}

describe('the catalog', () => {
  it('every Circle power names a registered power', () => {
    const mine = TWIST_CATALOG.filter(t => t.format === 'the-circle' && t.category === 'power');
    expect(mine.length).toBeGreaterThanOrEqual(4);
    for (const t of mine) { expect(Object.keys(POWERS), t.id).toContain(t.ciPower); expect(t.desc.length, t.id).toBeGreaterThan(200); }
  });
});

describe('a power is handed over at the visit', () => {
  it('the blocked player visits someone they trust to give it, and it lands on an active player', () => {
    const { power, state, day } = booked('rating3', 'ci-power-immunity');
    expect(power).toBeTruthy();
    const visit = state.scenes.find(s => s.kind === 'visit' && s.day === day);
    expect(visit.data.motive).toBe('power');
    expect(power.holder).toBe(visit.who[1]);
    expect(power.from).toBe(visit.who[0]);
    expect(rel(power.from, power.holder, 'affection')).toBeGreaterThanOrEqual(0);
  });
});

describe('immunity to give away (UK 2)', () => {
  it('the holder cannot be blocked at the next blocking, and the room is told', () => {
    const { power, state, day } = booked('rating3', 'ci-power-immunity');
    const next = state.scenes.find(s => s.kind === 'blocking' && s.day > day);
    expect(next.data.target).not.toBe(power.holder);
    expect(state.scenes.some(s => s.kind === 'power-reveal' && s.data.kind === 'immunity')).toBe(true);
  });
});

describe('the Hacker (US 5)', () => {
  it('speaks as someone else in one chat; the listener trusts that person less; the room learns there was a Hacker', () => {
    for (const seed of [5, 7, 9]) {
      const { power, state } = booked('rating3', 'ci-power-hacker', seed);
      const hack = state.scenes.find(s => s.kind === 'hack');
      if (!hack) continue;
      expect(hack.data.hacker).toBe(power.holder);
      expect(hack.data.as).not.toBe(power.holder);
      expect(hack.seenBy).not.toContain(hack.data.as);
      expect(state.scenes.some(s => s.kind === 'power-reveal' && s.data.kind === 'hacker')).toBe(true);
      return;
    }
    throw new Error('no hack played in three seeds');
  });
});

describe('the Joker (US 2)', () => {
  it('names one of the next Influencers', () => {
    for (const seed of [5, 7, 9, 11]) {
      const { power, state, day } = booked('rating3', 'ci-power-joker', seed);
      // the first ordinary ratings after the visit (it can be the same day's, back to back)
      const next = state.ratings.find(r => r.day >= day && !r.final && !r.hidden && r.influencers.length === 2);
      if (!next || !state.active.concat(state.blocked.map(b => b.handle)).includes(power.holder)) continue;
      const pick = state.scenes.find(s => s.kind === 'joker-pick');
      if (!pick) continue;
      expect(next.influencers).toContain(pick.data.pick);
      return;
    }
    throw new Error('no Joker pick played in four seeds');
  });
});

describe('the burner profile (US 3)', () => {
  it('casts a second ballot for its holder until it is exposed: one or the other, never neither', () => {
    for (const seed of [5, 7, 9]) {
      const { power, state, day } = booked('rating3', 'ci-power-burner', seed);
      if (!power || !state.active.concat(state.blocked.filter(x => x.day > day + 1).map(x => x.handle)).includes(power.holder)) continue;
      const next = state.ratings.find(r => r.day >= day && !r.final);
      const ballots = next.ballots.filter(x => x.burner);
      const exposed = state.scenes.some(s => s.kind === 'burner-exposed' && s.day === next.day);
      expect(ballots.length + (exposed ? 1 : 0), `seed ${seed}`).toBe(1);
      if (ballots.length) expect(ballots[0].voter).toBe(power.holder);
    }
  });
});
