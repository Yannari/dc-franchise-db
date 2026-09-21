// ══════════════════════════════════════════════════════════════════════
// coach-card-continuity.test.js — the card survives a dissolve, and stays
// in the conversation
// ══════════════════════════════════════════════════════════════════════
//
// Reported: "they dont discuss the save card yet again" — then, crucially,
// "i thought it was fixed cause in the multi tribal they did, but after the
// tribes dissolve its stop happening again". Two separate faults, and the
// second one is why the first looked intermittent.
//
// 1. A DISSOLVE COULD DESTROY A CARD NOBODY PLAYED. When a tribe folds, its
//    card travels with its staff — but the copy wrote the dead tribe's state
//    onto any destination "without one", and a tribe without an entry is
//    exactly how an UNSPENT card is stored (tribeCardState reads a missing key
//    as 'unused'). So a tribe that folded after spending its card handed
//    'used' to the camp it merged into, and that camp's staff silently lost a
//    card they had never played — no talk at camp, nothing to commit at
//    tribal, for the rest of the season.
//
// 2. THE CONVERSATION'S TRIGGER ONLY EVER FELL. It was driven by how many of
//    the camp the coach had not trained YET, and a coach works with their
//    whole camp by episode two: 0.45 in week one, zero ever after. Measured
//    over three seasons, every card conversation happened in episodes 1-2.
import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../js/core.js';
import { addCoach, reassignCoaches, tribeCardHeld, spendTribeCard } from '../js/coaches.js';
import { coachCardTalk } from '../js/coach-episode.js';
import { addBond } from '../js/bonds.js';
import { seedGs, seedPlayers } from './helpers/setup.js';

const GREEN = ['G1', 'G2', 'G3', 'G4'];
const RED = ['R1', 'R2', 'R3', 'R4'];

function twoTribes() {
  seedGs({ tribes: [{ name: 'Green', members: [...GREEN] }, { name: 'Red', members: [...RED] }],
    coaches: [], coachCards: {}, coachTraining: {} });
  seedPlayers(...[...GREEN, ...RED, 'Julia', 'Millie', 'Thom'].map(name => ({ name })));
  Object.assign(globalThis, { gs: core.gs, players: core.players, seasonConfig: core.seasonConfig });
}

beforeEach(twoTribes);

describe('a card through a dissolve', () => {
  it('does not hand a spent card to a camp that still had its own', () => {
    addCoach({ name: 'Julia', tribe: 'Green' });
    addCoach({ name: 'Millie', tribe: 'Red' });
    spendTribeCard('Green');                       // Green played theirs
    expect(tribeCardHeld('Red')).toBe(true);       // Red never did

    // Green folds; Julia moves to Red
    core.gs.tribes = [{ name: 'Red', members: [...RED, ...GREEN] }];
    reassignCoaches(core.gs.tribes);

    expect(core.gs.coaches.find(c => c.name === 'Julia').tribe).toBe('Red');
    expect(tribeCardHeld('Red'), 'Red never played its card and must still hold one').toBe(true);
  });

  it('keeps a card that travels to a camp which had already spent one', () => {
    addCoach({ name: 'Julia', tribe: 'Green' });    // Green's card is unspent
    addCoach({ name: 'Millie', tribe: 'Red' });
    spendTribeCard('Red');

    core.gs.tribes = [{ name: 'Red', members: [...RED, ...GREEN] }];
    reassignCoaches(core.gs.tribes);

    expect(tribeCardHeld('Red'), 'the staff that still held one brought it with them').toBe(true);
  });

  it('spent plus spent is still spent', () => {
    addCoach({ name: 'Julia', tribe: 'Green' });
    addCoach({ name: 'Millie', tribe: 'Red' });
    spendTribeCard('Green');
    spendTribeCard('Red');

    core.gs.tribes = [{ name: 'Red', members: [...RED, ...GREEN] }];
    reassignCoaches(core.gs.tribes);

    expect(tribeCardHeld('Red')).toBe(false);
  });
});

describe('raising the card at camp', () => {
  /** Two coaches on Red, liked by their camp, and everyone already trained. */
  function settledStaff() {
    addCoach({ name: 'Millie', tribe: 'Red' });
    addCoach({ name: 'Thom', tribe: 'Red' });
    core.gs.coachTraining = { Millie: {}, Thom: {} };
    for (const m of RED) {
      addBond('Millie', m, 5); addBond('Thom', m, 5);      // a warm, ordinary staff
      core.gs.coachTraining.Millie[m] = { mental: 1 };     // nobody left untrained
      core.gs.coachTraining.Thom[m] = { mental: 1 };
    }
    return core.gs.tribes.find(t => t.name === 'Red');
  }

  it('still comes up once the camp is trained and nobody is hostile', () => {
    // the old trigger was exactly zero in this state — week one was the only
    // week the card was ever mentioned
    const tribe = settledStaff();
    const events = coachCardTalk({ num: 5 }, tribe, () => 0.05);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('coachCardTalk');
    expect(events[0].players).toHaveLength(2);
  });

  it('comes up more readily for a coach the camp has turned on', () => {
    const tribe = settledStaff();
    for (const m of RED) addBond('Millie', m, -12);   // Millie is in real trouble
    // a roll this high only clears the threshold when vulnerability lifts it
    const events = coachCardTalk({ num: 5 }, tribe, () => 0.33);
    expect(events.some(e => e.players.includes('Millie'))).toBe(true);
  });

  it('says nothing once the card is spent', () => {
    const tribe = settledStaff();
    spendTribeCard('Red');
    expect(coachCardTalk({ num: 5 }, tribe, () => 0.01)).toEqual([]);
  });
});
