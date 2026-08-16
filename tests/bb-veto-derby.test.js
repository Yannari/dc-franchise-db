// The Derby. A slot bought on Sunday, spent on Tuesday, paid out by somebody
// else's competition.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { runDerby, placeDerbyBets, resolveDerbyBets, derbySlotHolders,
  DERBY_SLOTS } from '../js/bb/veto-derby.js';
import { ROOM_GAMES } from '../js/bb/high-rollers-room.js';
import { stableRng } from '../js/bb/knowledge.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'hero', 'schemer', 'floater', 'villain', 'goat', 'underdog',
    'hothead', 'wildcard', 'social-butterfly'][i],
}));

const seq = values => { let i = 0; return () => values[i++ % values.length]; };

beforeEach(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  gs.bb = { ...(gs.bb || {}), weeks: [], bucks: {}, roomPlays: {}, seasonSalt: 5 };
  gs.activePlayers = [...NAMES];
});

describe('the board', () => {
  it('is priced at fifty, and the room sells it', () => {
    const game = ROOM_GAMES.find(g => g.id === 'veto-derby');
    expect(game, 'the room does not sell the Derby').toBeTruthy();
    expect(game.price).toBe(50);
  });

  it('resolves the whole field at once, not one entrant at a time', () => {
    // Up to six can win, which cannot be decided per entrant — the same reason
    // the Roulette is a field game, for the opposite reason.
    expect(runDerby.resolvesField).toBe(true);
  });

  it('pays at most six slots however many paid', () => {
    const out = runDerby({ entrants: NAMES, rng: seq([0.3, 0.7, 0.1, 0.9, 0.5]) });
    const slots = Object.values(out.results).filter(r => r.won).length;
    expect(slots).toBeLessThanOrEqual(DERBY_SLOTS);
    expect(slots).toBeGreaterThan(0);
  });

  it('cannot pay more slots than there were entrants', () => {
    const three = NAMES.slice(0, 3);
    const out = runDerby({ entrants: three, rng: seq([0.4, 0.6]) });
    expect(Object.keys(out.results)).toHaveLength(3);
    expect(Object.values(out.results).filter(r => r.won).length).toBeLessThanOrEqual(3);
  });

  it('reports every entrant exactly once', () => {
    const out = runDerby({ entrants: NAMES, rng: seq([0.2, 0.8]) });
    expect(Object.keys(out.results).sort()).toEqual([...NAMES].sort());
  });

  // The wiki's rule is TWO ways to buy nothing: score zero, or miss the cut.
  it('never gives a slot to a score of zero', () => {
    for (let s = 0; s < 60; s++) {
      const out = runDerby({ entrants: NAMES, rng: seq([(s % 11) / 11, ((s * 3) % 7) / 7]) });
      for (const [name, r] of Object.entries(out.results)) {
        if (r.score === 0) expect(r.won, `${name} took a slot on nothing`).toBe(false);
      }
    }
  });

  it('lets a zero happen at all, or the rule is decoration', () => {
    // Driven by the REAL seeded generator, not by `seq`. The fake one cycles a
    // few mid-range values, so the guess never strays far enough from the
    // target to score nothing and this passed against an engine where a zero
    // was arithmetically impossible — which is exactly what it was written to
    // catch, and did, once it could see the whole 0..1 range.
    let zeros = 0;
    for (let s = 0; s < 120; s++) {
      const out = runDerby({ entrants: NAMES, rng: stableRng('derby-test', s) });
      zeros += Object.values(out.results).filter(r => r.score === 0).length;
    }
    expect(zeros, 'nobody ever scored zero across 120 boards').toBeGreaterThan(0);
  });
});

describe('the slot holders', () => {
  it('are read off the room\'s own act, not a second copy', () => {
    const week = { highRollers: { entries: [
      { name: 'Bowie', gameId: 'veto-derby', won: true },
      { name: 'Chase', gameId: 'veto-derby', won: false },
      { name: 'Ripper', gameId: 'chopping-block-roulette', won: true },
    ] } };
    expect(derbySlotHolders(week)).toEqual(['Bowie']);
  });

  it('are nobody when the room never opened', () => {
    expect(derbySlotHolders({})).toEqual([]);
  });
});

describe('backing one of the six', () => {
  const SIX = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel'];

  it('backs a player who is actually in the draw', () => {
    const act = placeDerbyBets({ week: { num: 6 }, slots: ['Zee', 'Brightly'],
      vetoPlayers: SIX, rng: seq([0.3, 0.7]) });
    expect(act).toBeTruthy();
    for (const b of act.bets) expect(SIX).toContain(b.on);
  });

  it('gives every slot holder exactly one slip', () => {
    const act = placeDerbyBets({ week: { num: 6 }, slots: ['Zee', 'Brightly', 'Hicks'],
      vetoPlayers: SIX, rng: seq([0.2, 0.8, 0.5]) });
    expect(act.bets).toHaveLength(3);
    expect(new Set(act.bets.map(b => b.name)).size).toBe(3);
  });

  it('does nothing at all when nobody holds a slot', () => {
    expect(placeDerbyBets({ week: { num: 6 }, slots: [], vetoPlayers: SIX,
      rng: seq([0.5]) })).toBeNull();
  });

  // The spoiler rule the side bet had to learn: a screen drawn before the
  // competition must not carry the competition's result.
  it('carries no result until the veto is won', () => {
    const act = placeDerbyBets({ week: { num: 6 }, slots: ['Zee'], vetoPlayers: SIX,
      rng: seq([0.4]) });
    expect(act.settled).toBe(false);
    expect(act.results).toBeUndefined();
    for (const b of act.bets) expect(b.won).toBeUndefined();
  });
});

describe('settling the slips', () => {
  const SIX = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel'];
  const placed = () => placeDerbyBets({ week: { num: 6 }, slots: ['Zee', 'Brightly', 'Hicks'],
    vetoPlayers: SIX, rng: seq([0.15, 0.55, 0.85]) });

  it('hands a veto to whoever backed the winner, and nothing to anybody else', () => {
    const act = placed();
    const winner = act.bets[0].on;
    const settled = resolveDerbyBets(act, winner, { rng: seq([0.5]) });
    expect(settled.type).toBe('derby-bet-settled');
    for (const r of settled.results) expect(r.won).toBe(r.on === winner);
    expect(settled.holders).toEqual(settled.results.filter(r => r.won).map(r => r.name));
  });

  it('hands out nothing when the veto goes to somebody nobody backed', () => {
    const act = placed();
    const backed = new Set(act.bets.map(b => b.on));
    const unbacked = SIX.find(p => !backed.has(p));
    if (!unbacked) return;                     // everybody was backed; nothing to prove
    const settled = resolveDerbyBets(act, unbacked, { rng: seq([0.5]) });
    expect(settled.holders).toHaveLength(0);
  });

  it('is its own act, so a pre-competition screen cannot show it', () => {
    const act = placed();
    const settled = resolveDerbyBets(act, act.bets[0].on, { rng: seq([0.5]) });
    expect(settled).not.toBe(act);
    expect(act.results).toBeUndefined();
  });

  it('cannot be settled twice', () => {
    const act = placed();
    expect(resolveDerbyBets(act, act.bets[0].on, { rng: seq([0.5]) })).toBeTruthy();
    expect(resolveDerbyBets(act, act.bets[0].on, { rng: seq([0.5]) })).toBeNull();
  });
});
