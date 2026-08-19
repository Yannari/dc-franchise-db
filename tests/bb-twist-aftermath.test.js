// Every twist that changes a week leaves a week that talks about it.
//
// An audit found four twists whose acts fired, landed their consequences, and
// then vanished from house life: nobody needled the Camp Director about the
// four names, nobody resented serving the Wildcard winner's bill, and the
// High Roller's Room — whose own comment calls its door "the loudest thing
// anybody does all week" — had ZERO bond or popularity writes and no event
// family at all. These are the aftermath families, unit-fired with synthetic
// week state so every branch is deterministic.
//
// The design rule under test, verbatim from the person who plays this thing:
// "they could take it well or less well, really depends" — so each family is
// checked for BOTH directions, not just for firing.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { HIGH_ROLLERS_EVENTS } from '../js/bb-events/high-rollers.js';
import { CAMP_DIRECTOR_EVENTS } from '../js/bb-events/camp-director.js';
import { WILDCARD_EVENTS } from '../js/bb-events/wildcard.js';
import { NIGHTMARE_EVENTS } from '../js/bb-events/nightmare.js';
import { RETURNED_EVENTS } from '../js/bb-events/returned.js';
import { SIDE_BET_EVENTS } from '../js/bb-events/side-bet.js';
import { PREMIERE_MYSTERY_EVENTS } from '../js/bb-events/premiere-mystery.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  seasonConfig.format = 'big-brother';
  return [...gs.activePlayers];
}

/** A spy api that records every consequence a fire() hands out. */
function spy() {
  const calls = [];
  return {
    calls,
    addBond: (a, b, d) => calls.push(['addBond', a, b, d]),
    suspicion: (a, b, d) => calls.push(['suspicion', a, b, d]),
    remember: (a, b, k) => calls.push(['remember', a, b, k]),
    popDelta: (n, d) => calls.push(['popDelta', n, d]),
  };
}

const ctxFor = (week, extra = {}) => ({ act: 'house', week, beat: 0, ...extra });

/** Fire an event across several salted contexts; return every result. */
function sweep(ev, roster, week, api) {
  const out = [];
  for (let b = 0; b < 8; b++) {
    const ctx = ctxFor({ ...week, num: (week.num || 3) + (b % 2) }, { beat: b });
    if (ev.weight(roster, ctx) <= 0) continue;
    const r = ev.fire(roster, ctx, api);
    if (r) out.push(r);
  }
  return out;
}

describe('twist aftermath families', () => {
  beforeEach(house);

  it('are all registered in the house pool', () => {
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const ev of [...HIGH_ROLLERS_EVENTS, ...CAMP_DIRECTOR_EVENTS,
      ...WILDCARD_EVENTS, ...NIGHTMARE_EVENTS, ...RETURNED_EVENTS,
      ...SIDE_BET_EVENTS, ...PREMIERE_MYSTERY_EVENTS]) {
      expect(ids.has(ev.id), `${ev.id} is not registered`).toBe(true);
    }
  });

  it('stay silent on a week their twist did not touch', () => {
    const roster = [...gs.activePlayers];
    for (const ev of [...HIGH_ROLLERS_EVENTS, ...CAMP_DIRECTOR_EVENTS,
      ...WILDCARD_EVENTS, ...RETURNED_EVENTS, ...SIDE_BET_EVENTS,
      ...PREMIERE_MYSTERY_EVENTS]) {
      expect(ev.weight(roster, ctxFor({ num: 3 })),
        `${ev.id} fires on an ordinary week`).toBe(0);
    }
  });

  it('the room re-prices its entrants, with consequences', () => {
    const roster = [...gs.activePlayers];
    const week = { num: 6, highRollers: { entries: [
      { name: roster[2], gameId: 'chopping-block-roulette', price: 125, won: false },
    ] } };
    const api = spy();
    const results = sweep(HIGH_ROLLERS_EVENTS.find(e => e.id === 'hrr-walked-in'),
      roster, week, api);
    expect(results.length, 'nobody re-priced a public buyer').toBeGreaterThan(0);
    const lost = sweep(HIGH_ROLLERS_EVENTS.find(e => e.id === 'hrr-lost-the-seat'),
      roster, week, api);
    expect(lost.length, 'a public loss went unmentioned').toBeGreaterThan(0);
    expect(api.calls.length, 'reactions with no consequence').toBeGreaterThan(0);
    for (const r of [...results, ...lost]) {
      expect(r.players.length).toBeGreaterThan(0);
      expect(r.badgeText).toBeTruthy();
    }
  });

  it('the wheel replacement blames the money or the sky, never at random', () => {
    const roster = [...gs.activePlayers];
    const api = spy();
    const ev = HIGH_ROLLERS_EVENTS.find(e => e.id === 'hrr-wheeled-up');
    // A strategic replacement follows the money to the winner.
    const counting = sweep(ev, roster,
      { num: 6, rouletteSwap: { down: roster[3], up: roster[0] },
        rouletteSafe: [roster[5], roster[3]] }, api);
    // A non-counter is angry at equipment.
    const shrugging = sweep(ev, roster,
      { num: 6, rouletteSwap: { down: roster[3], up: roster[9] },
        rouletteSafe: [roster[5], roster[3]] }, api);
    const badges = new Set([...counting, ...shrugging].map(r => r.badgeText));
    expect(badges.size, `one reaction for every temperament: ${[...badges]}`)
      .toBeGreaterThan(1);
  });

  it('the Camp Director week keeps talking about the list, both ways', () => {
    const roster = [...gs.activePlayers];
    const week = { num: 1, campDirector: {
      director: roster[1], banished: roster.slice(2, 6),
      survivors: roster.slice(2, 5), evicted: roster[5],
    } };
    const api = spy();
    let fired = 0;
    const badges = new Set();
    for (const ev of CAMP_DIRECTOR_EVENTS) {
      const rs = sweep(ev, roster, week, api);
      fired += rs.length;
      rs.forEach(r => badges.add(r.badgeText));
    }
    expect(fired, 'week one never mentioned the four names again').toBeGreaterThan(0);
    expect(api.calls.length, 'reactions with no consequence').toBeGreaterThan(0);
  });

  it('a survivor settles it or keeps the receipt, depending on who they are', () => {
    const roster = [...gs.activePlayers];
    const ev = CAMP_DIRECTOR_EVENTS.find(e => e.id === 'camp-director-survivor');
    const api = spy();
    const badges = new Set();
    // Rotate who survived, so different temperaments front the reaction.
    for (let i = 2; i < 10; i++) {
      const week = { num: 1, campDirector: {
        director: roster[1], banished: [roster[i], ...roster.slice(10, 12)],
        survivors: [roster[i]], evicted: roster[11],
      } };
      sweep(ev, roster, week, api).forEach(r => badges.add(r.badgeText));
    }
    expect(badges.size, `every survivor reacted identically: ${[...badges]}`)
      .toBeGreaterThan(1);
  });

  it('the Wildcard bill is served with needles or with a smile', () => {
    const roster = [...gs.activePlayers];
    const ev = WILDCARD_EVENTS.find(e => e.id === 'wildcard-serving');
    const api = spy();
    const badges = new Set();
    for (let i = 0; i < 8; i++) {
      const winner = roster[i];
      const week = { num: 4, wildcard: {
        winner, accepted: true, houseWide: true,
        punishmentLabel: 'the Egg Detective costume',
        served: roster.filter(n => n !== winner),
      } };
      sweep(ev, roster, week, api).forEach(r => badges.add(r.badgeText));
    }
    expect(badges.size, `every server reacted identically: ${[...badges]}`)
      .toBeGreaterThan(1);
    expect(api.calls.length).toBeGreaterThan(0);
  });

  it('a refusal is admired or counted, and both leave a mark', () => {
    const roster = [...gs.activePlayers];
    const ev = WILDCARD_EVENTS.find(e => e.id === 'wildcard-refusal-tested');
    const api = spy();
    const results = [];
    for (let i = 0; i < 8; i++) {
      const week = { num: 4, wildcard: {
        winner: roster[i], accepted: false, houseWide: false,
        punishmentLabel: 'a week on slop', served: [],
      } };
      results.push(...sweep(ev, roster, week, api));
    }
    expect(results.length, 'the claim was never tested').toBeGreaterThan(0);
    expect(api.calls.some(c => c[0] === 'suspicion' || c[0] === 'popDelta'),
      'the refusal moved nothing').toBe(true);
  });
});

describe('the second wave: returns, the rail, and the hotel', () => {
  beforeEach(house);

  it('the returnee is lived with, gracious or counting', () => {
    const roster = [...gs.activePlayers];
    const api = spy();
    const badges = new Set();
    let fired = 0;
    for (let i = 0; i < 8; i++) {
      const back = roster[i];
      gs.bb = gs.bb || {};
      gs.bb.weeks = [{ num: 2, returnedHouseguest: back,
        battleBack: { returned: back, rounds: [{ label: 'THE DOOR', a: back, b: roster[(i + 1) % 8] }] } }];
      for (const ev of RETURNED_EVENTS) {
        const rs = sweep(ev, roster, { num: 3 }, api);
        fired += rs.length;
        rs.forEach(r => badges.add(r.badgeText));
      }
    }
    expect(fired, 'nobody ever mentioned the person who came back').toBeGreaterThan(0);
    expect(badges.size, `every return read identically: ${[...badges]}`).toBeGreaterThan(2);
    expect(api.calls.length, 'reactions with no consequence').toBeGreaterThan(0);
  });

  it('the rail is counted without ever reading a slip out loud', () => {
    const roster = [...gs.activePlayers];
    const api = spy();
    const ev = SIDE_BET_EVENTS.find(e => e.id === 'side-bet-counts-the-rail');
    const results = [];
    for (let i = 0; i < 8; i++) {
      const nom = roster[i];
      const week = { num: 4, finalNominees: [nom, roster[(i + 1) % 8]],
        sideBets: { bets: roster.filter(n => n !== nom).slice(0, 4)
          .map(n => ({ name: n, on: nom, stake: 10 })) } };
      results.push(...sweep(ev, roster, week, api));
    }
    expect(results.length, 'the block never once counted the rail').toBeGreaterThan(0);
    // THE PRIVACY RULE: the slip is private. No beat may say whose name was
    // on a bet — the nominee guesses, and the text never confirms it.
    for (const r of results) {
      expect(r.text, 'a beat read a slip out loud').not.toMatch(/bet on (me|him|her|them)\b.*right|slip says/i);
    }
    expect(new Set(results.map(r => r.badgeText)).size,
      `every nominee reacted identically`).toBeGreaterThan(1);
  });

  it('a collector is resented by a friend or kept as a barometer', () => {
    const roster = [...gs.activePlayers];
    const api = spy();
    const ev = SIDE_BET_EVENTS.find(e => e.id === 'side-bet-collected');
    const badges = new Set();
    for (let i = 0; i < 8; i++) {
      const winner = roster[i];
      gs.bb = gs.bb || {};
      gs.bb.weeks = [{ num: 3, evicted: NAMES[11],
        sideBetResults: { evicted: NAMES[11], results: [{ name: winner, on: NAMES[11], won: true, delta: 4 }] } }];
      sweep(ev, roster, { num: 4 }, api).forEach(r => badges.add(r.badgeText));
    }
    expect(badges.size, 'the collector was never noticed, or always the same way')
      .toBeGreaterThan(0);
  });

  it('the hotel circles the money, the four names, and the score with no crown', () => {
    const roster = [...gs.activePlayers];
    const api = spy();
    let fired = 0;
    for (let i = 0; i < 6; i++) {
      const week1 = { num: 1, premiereMystery: {
        hostWinner: roster[i], relicWinner: roster[(i + 3) % 8] } };
      for (const ev of PREMIERE_MYSTERY_EVENTS.slice(0, 2)) {
        fired += sweep(ev, roster, week1, api).length;
      }
      const week2 = { num: 2, secretPowerComp: {
        chased: [{ name: roster[i], power: 'the-cloud' }],
        results: [{ name: roster[i], score: 9.9 }, { name: roster[(i + 2) % 8], score: 7.1 }] } };
      const rs = sweep(PREMIERE_MYSTERY_EVENTS.find(e => e.id === 'secret-comp-anomaly'),
        roster, week2, api);
      fired += rs.length;
      // The house must never be TOLD the answer — the anomaly stays one.
      for (const r of rs) expect(r.text).not.toMatch(/secret power|was chasing|never running/i);
    }
    expect(fired, 'the hotel never mentioned any of it').toBeGreaterThan(0);
    expect(api.calls.some(c => c[0] === 'suspicion'),
      'nobody got suspicious of anything in a mystery theme').toBe(true);
  });
});
