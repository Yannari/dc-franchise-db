// ══════════════════════════════════════════════════════════════════════
// coach-card-replacement.test.js — the card cannot name somebody it
// cannot send home
// ══════════════════════════════════════════════════════════════════════
//
// Reported from a played episode 11, Green council. Ara played a Safety
// Without Power: she left Tribal Council before a vote was read, immune and
// unable to vote. The votes went 3-2 on Thom, a coach; Thom's staff played the
// save card and Thom named Ara to go instead — so the screen announced Ara as
// the 7th player voted out, from a tribal she was not at.
//
// The replacement was chosen off the tribe's entire member list with nothing
// removed: not immunity, not the idol played five minutes earlier, not even
// attendance. The card names somebody to leave in the coach's place, so the
// pool has to be the people this council could actually send home.
import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../js/core.js';
import { maybeSaveCoach } from '../js/coach-episode.js';
import { addCoach } from '../js/coaches.js';
import { addBond } from '../js/bonds.js';
import { seedGs, seedPlayers } from './helpers/setup.js';

const CAMP = ['Ara', 'Ren', 'Natalia', 'Dunia', 'Oliwia', 'Grett'];

/** Green, with Thom coaching, and a card already signed and sealed for the staff. */
function council({ attendees = CAMP, immune = [], idolPlays = [] } = {}) {
  seedGs({ tribes: [{ name: 'Green', members: [...CAMP] }], coaches: [], coachCards: {}, coachTraining: {} });
  seedPlayers(...[...CAMP, 'Thom'].map(name => ({ name })));
  Object.assign(globalThis, { gs: core.gs, players: core.players, seasonConfig: core.seasonConfig });
  addCoach({ name: 'Thom', tribe: 'Green' });
  // Thom would name the person he is least close to; Ara is bottom of that list
  for (const [name, bond] of [['Ara', -6], ['Ren', -2], ['Natalia', 1], ['Dunia', 2], ['Oliwia', 3], ['Grett', 4]]) {
    addBond('Thom', name, bond);
  }
  return {
    num: 11, idolPlays,
    coachCardCommits: [{ tribe: 'Green', calledBy: 'Thom', coach: 'Thom', covers: ['Thom'],
      votes: [], signed: true, refusedBy: null }],
    _councilPool: { attendees: [...attendees], immune: [...immune] },
  };
}

const votedOut = coach => ({ eliminated: coach, votes: { [coach]: 3 }, log: [] });

let ep, result;
beforeEach(() => { ep = council(); result = votedOut('Thom'); });

describe('the name the save card gives', () => {
  it('is the coach\'s weakest bond when everyone is there and fair game', () => {
    expect(maybeSaveCoach(ep, result)).toBe(true);
    expect(ep.coachSaves[0].replacement).toBe('Ara');
    expect(result.eliminated).toBe('Ara');
  });

  it('is never somebody who left the council on a power', () => {
    // Ara's Safety Without Power: out of the room, immune, cannot be voted for
    ep = council({ attendees: CAMP.filter(n => n !== 'Ara'), immune: ['Ara'] });
    expect(maybeSaveCoach(ep, result)).toBe(true);
    expect(ep.coachSaves[0].replacement, 'named somebody who was not at the council').not.toBe('Ara');
    expect(ep.coachSaves[0].replacement).toBe('Ren');
  });

  it('is never somebody holding immunity', () => {
    ep = council({ immune: ['Ara', 'Ren'] });
    expect(maybeSaveCoach(ep, result)).toBe(true);
    expect(ep.coachSaves[0].replacement).toBe('Natalia');
  });

  it('is never somebody an idol covered tonight', () => {
    ep = council({ idolPlays: [{ player: 'Ara', votesNegated: 3 }, { player: 'Grett', playedFor: 'Ren', votesNegated: 2 }] });
    const named = (maybeSaveCoach(ep, result), ep.coachSaves[0].replacement);
    expect(named).not.toBe('Ara');
    expect(named, 'an idol played for Ren protects Ren, not the holder').not.toBe('Ren');
    expect(named).toBe('Natalia');
  });

  it('cannot be played at all when there is nobody left to name', () => {
    ep = council({ immune: [...CAMP] });
    expect(maybeSaveCoach(ep, result)).toBe(false);
    expect(result.eliminated, 'the coach still goes').toBe('Thom');
    expect(ep.coachCardNotPlayed[0]).toMatchObject({ coach: 'Thom', noReplacement: true });
  });
});
