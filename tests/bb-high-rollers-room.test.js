// The room. Paying is not winning, and the door only opens once per game.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { credit, balance } from '../js/bb/bb-bucks.js';
import { openRoom, hasPlayed, ROOM_GAMES } from '../js/bb/high-rollers-room.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'hero', 'schemer', 'floater', 'villain', 'goat', 'underdog', 'hothead'][i],
}));

// Deterministic rng; callers pass their own sequence.
const seq = values => { let i = 0; return () => values[i++ % values.length]; };

// A real mid-season house, not a rich one. The tiers pay 18/14/10 a week, so by
// the time the room opens a top-tier darling has saved enough for exactly one
// game and a floor houseguest has not. That spread is the whole limiter: there
// is no seat cap in this room, and there does not need to be one.
const SAVER = 160;    // ~nine weeks at the top of the vote
const BROKE = 90;     // ~nine weeks on the floor — short of the 125 price

beforeEach(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { ...(gs.bb || {}), weeks: [], bucks: {}, roomPlays: {}, seasonSalt: 7 };
  NAMES.forEach((n, i) => credit(n, i % 2 ? BROKE : SAVER));
});

const held = () => NAMES.reduce((sum, n) => sum + balance(n), 0);
const STAKED = NAMES.reduce((sum, n, i) => sum + (i % 2 ? BROKE : SAVER), 0);

// The room opens past halfway, which is when anybody can afford it.
const open = (rng = seq([0.1, 0.9, 0.4, 0.6])) => openRoom({
  week: { num: 9 }, house: NAMES, hoh: 'Bowie', nominees: ['Chase', 'Ripper'], rng,
});

describe('the price of a seat', () => {
  it('takes the money on ENTRY, not on winning', () => {
    const act = open(seq([0.01]));            // everybody keen
    const paid = act.entries.reduce((sum, e) => sum + e.price, 0);
    expect(act.entries.length).toBeGreaterThan(0);
    expect(held()).toBe(STAKED - paid);
    // and at least somebody paid without winning, or the format is a vending machine
    expect(act.entries.some(e => !e.won)).toBe(true);
  });

  it('never seats somebody who cannot afford the game', () => {
    gs.bb.bucks = Object.fromEntries(NAMES.map(n => [n, 10]));
    expect(open(seq([0.01])).entries).toHaveLength(0);
  });

  it('never lets a balance go negative', () => {
    open(seq([0.01]));
    NAMES.forEach(n => expect(balance(n)).toBeGreaterThanOrEqual(0));
  });
});

describe('one seat per game per season', () => {
  it('refuses a second entry to the same game', () => {
    const first = open(seq([0.01]));
    const played = first.entries.map(e => e.name);
    expect(played.length).toBeGreaterThan(0);
    played.forEach(n => expect(hasPlayed(n, 'chopping-block-roulette')).toBe(true));
    // Make everybody rich, so money is no longer what keeps anybody out and the
    // one-seat rule is the only thing left standing between them and the wheel.
    // Without this the second room seats nobody and the assertion below is
    // vacuous — it would pass on an engine with no such rule at all.
    NAMES.forEach(n => credit(n, 400));
    const second = open(seq([0.01]));
    expect(second.entries.length).toBeGreaterThan(0);
    second.entries.forEach(e => expect(played).not.toContain(e.name));
  });

  it('records the play even when they lost', () => {
    const act = open(seq([0.01]));
    const loser = act.entries.find(e => !e.won);
    expect(loser).toBeTruthy();
    expect(hasPlayed(loser.name, loser.gameId)).toBe(true);
  });

  it('survives a JSON round trip, because saves do', () => {
    open(seq([0.01]));
    const revived = JSON.parse(JSON.stringify(gs.bb.roomPlays));
    expect(Object.keys(revived).length).toBeGreaterThan(0);
  });
});

describe('who walks in', () => {
  it('a nominee is likelier to pay than a comfortable houseguest', () => {
    let nomEntries = 0, safeEntries = 0;
    for (let s = 0; s < 40; s++) {
      // Everybody able to afford exactly one game, so money is not what is
      // being measured here — willingness is.
      gs.bb.bucks = Object.fromEntries(NAMES.map(n => [n, SAVER]));
      gs.bb.roomPlays = {};
      const act = openRoom({ week: { num: 9 }, house: NAMES, hoh: 'Bowie',
        nominees: ['Chase', 'Ripper'], rng: seq([(s % 10) / 10, ((s * 3) % 10) / 10]) });
      for (const e of act?.entries || []) {
        if (['Chase', 'Ripper'].includes(e.name)) nomEntries++; else safeEntries++;
      }
    }
    expect(nomEntries / 2).toBeGreaterThan(safeEntries / 6);
  });

  it('the HOH does not buy a week they already own', () => {
    for (let s = 0; s < 20; s++) {
      gs.bb.roomPlays = {};
      const act = open(seq([(s % 10) / 10]));
      expect((act?.entries || []).map(e => e.name)).not.toContain('Bowie');
    }
  });

  it('returns null when nobody enters', () => {
    gs.bb.bucks = {};
    expect(open(seq([0.99]))).toBeNull();
  });
});

describe('the menu', () => {
  it('is frozen, so nothing can retune canon prices by accident', () => {
    expect(Object.isFrozen(ROOM_GAMES)).toBe(true);
    expect(ROOM_GAMES.find(g => g.id === 'chopping-block-roulette').price).toBe(125);
  });

  it('never states a balance in a beat', () => {
    credit('Zee', 4242);
    const act = open(seq([0.01]));
    expect((act.beats || []).some(b => b.text.includes('4242'))).toBe(false);
  });
});
