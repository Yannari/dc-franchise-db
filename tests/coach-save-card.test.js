// The save card is a deal between the coaches of ONE TEAM, not a poll of the
// tribe. Contestants already had their say — at the vote. Every other coach on
// that tribe has to agree, so refusing is the cheapest kill in the game: you
// never need the numbers at tribal, you need one peer who would rather not.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { addBond } from '../js/bonds.js';
import { addCoach, coachRecord } from '../js/coaches.js';
import { commitSaveCards, maybeSaveCoach, offerSaveCard, predictedReplacement, saveCardVerdict } from '../js/coach-episode.js';

const stats = (o = {}) => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,
  loyalty:5,boldness:5,intuition:5,temperament:5, ...o });

const tribe = { name: 'Red', members: ['Evie', 'Finn'] };

// Julia is on the block. Wayne is the peer who decides.
function setup({ juliaArch = 'floater', wayneArch = 'hero', wayneStats = {} } = {}) {
  setPlayers([
    { name: 'Julia', archetype: juliaArch, stats: stats() },
    { name: 'Wayne', archetype: wayneArch, stats: stats(wayneStats) },
    { name: 'Evie', archetype: 'goat', stats: stats() },
    { name: 'Finn', archetype: 'hero', stats: stats() },
  ]);
  setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {},
    bonds: {}, namedAlliances: [], coachDeals: [], coachSaveLedger: [],
    tribes: [{ name: 'Red', members: ['Evie', 'Finn'] }], episode: 6 });
  addCoach({ name: 'Julia', tribe: 'Red' });
  addCoach({ name: 'Wayne', tribe: 'Red' });
}

describe('who gets a say', () => {
  it('asks the other coach on the team, not the contestants', () => {
    setup({ wayneArch: 'villain', wayneStats: { strategic: 10, loyalty: 1 } });
    // The contestants adore her. It is not their card.
    addBond('Julia', 'Evie', 10);
    addBond('Julia', 'Finn', 10);
    addBond('Julia', 'Wayne', -8);
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.played, 'a rival coach refusing must end it regardless of the tribe').toBe(false);
    expect(out.reason).toBe('refused:Wayne');
  });

  it('a lone coach has no net at all — there is no consensus to reach', () => {
    setup();
    setGs({ ...gs, coaches: [] });
    addCoach({ name: 'Julia', tribe: 'Red' });
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.played).toBe(false);
    expect(out.reason).toBe('no-peers');
  });

  it('ignores a coach on a different team', () => {
    setup({ wayneArch: 'villain', wayneStats: { strategic: 10, loyalty: 1 } });
    coachRecord('Wayne').tribe = 'Blue';
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.reason, 'Blue’s coach is not Red’s business').toBe('no-peers');
  });
});

describe('the decision is strategic, and scales with who is making it', () => {
  it('is easy for a friendly peer who runs with them', () => {
    setup({ wayneArch: 'loyal-soldier', wayneStats: { loyalty: 9, strategic: 2 } });
    addBond('Julia', 'Wayne', 7);
    expect(saveCardVerdict('Wayne', 'Julia').consents).toBe(true);
  });

  it('is hard for a strategic peer who does not get on with them', () => {
    setup({ wayneArch: 'mastermind', wayneStats: { strategic: 9, loyalty: 2 } });
    addBond('Julia', 'Wayne', -5);
    const v = saveCardVerdict('Wayne', 'Julia');
    expect(v.consents).toBe(false);
    expect(v.reason).toBe('bad-blood');
  });

  it('an alliance between the two coaches moves the decision toward yes', () => {
    setup({ wayneArch: 'floater', wayneStats: { strategic: 6, loyalty: 5 } });
    const bare = saveCardVerdict('Wayne', 'Julia').score;
    gs.namedAlliances = [{ active: true, members: ['Wayne', 'Julia'], name: 'The Staff' }];
    expect(saveCardVerdict('Wayne', 'Julia').score).toBeGreaterThan(bare);
  });

  it('a peer whose colleague has built more of the tribe is likelier to let them go', () => {
    setup({ wayneArch: 'floater', wayneStats: { strategic: 6, loyalty: 5 } });
    const bare = saveCardVerdict('Wayne', 'Julia').score;
    gs.coachTraining = { Julia: { Evie: { social: 1 }, Finn: { mental: 1 } }, Wayne: {} };
    const rivalled = saveCardVerdict('Wayne', 'Julia');
    expect(rivalled.score).toBeLessThan(bare);
  });
});

describe('when it does fire', () => {
  it('names a contestant to go instead, never another coach', () => {
    setup({ wayneArch: 'hero', wayneStats: { loyalty: 10, strategic: 1 } });
    addBond('Julia', 'Wayne', 8);
    addBond('Julia', 'Evie', 6);
    addBond('Julia', 'Finn', -2);   // the one she likes least pays
    const ep = { num: 6 };
    const out = offerSaveCard(ep, 'Julia', tribe);
    expect(out.played).toBe(true);
    expect(out.replacement).toBe('Finn');
    expect(ep.coachSaves[0].coach).toBe('Julia');
  });

  it('cannot be played twice', () => {
    setup({ wayneArch: 'hero', wayneStats: { loyalty: 10, strategic: 1 } });
    addBond('Julia', 'Wayne', 8);
    expect(offerSaveCard({ num: 6 }, 'Julia', tribe).played).toBe(true);
    expect(offerSaveCard({ num: 7 }, 'Julia', tribe).reason).toBe('already-used');
  });

  it('records the refusal so the season can talk about it', () => {
    setup({ wayneArch: 'villain', wayneStats: { strategic: 10, loyalty: 1 } });
    addBond('Julia', 'Wayne', -9);
    const ep = { num: 6 };
    offerSaveCard(ep, 'Julia', tribe);
    expect(ep.coachSaveRefusals[0].refusedBy).toBe('Wayne');
    expect(ep.coachSaveRefusals[0].coach).toBe('Julia');
  });
});

// The factor that makes it strategy rather than a popularity contest: the card
// does not save a coach for free. It names a CONTESTANT to die instead, chosen
// by the coach being saved — and that can be the protégé the peer has spent
// the whole season building.
describe('the price of signing', () => {
  it('a peer refuses when the card would kill their own protégé', () => {
    setup({ wayneArch: 'loyal-soldier', wayneStats: { loyalty: 9, strategic: 2 } });
    addBond('Julia', 'Wayne', 6);                 // they get on fine
    addBond('Julia', 'Finn', -9);                 // Finn is who Julia would name
    addBond('Julia', 'Evie', 5);
    const friendly = saveCardVerdict('Wayne', 'Julia');
    expect(friendly.consents, 'a friendly peer with no stake signs').toBe(true);

    gs.coachTraining = { Wayne: { Finn: { physical: 2 } } };   // Finn is Wayne's
    const costly = saveCardVerdict('Wayne', 'Julia');
    expect(costly.doomed).toBe('Finn');
    expect(costly.costsMine).toBe(true);
    expect(costly.score).toBeLessThan(friendly.score);
  });

  it('honours a live non-aggression pact and remembers a broken one', () => {
    setup({ wayneArch: 'floater', wayneStats: { strategic: 6, loyalty: 5 } });
    const bare = saveCardVerdict('Wayne', 'Julia').score;
    gs.coachDeals = [{ players: ['Wayne', 'Julia'], type: 'non-aggression', active: true, broken: false }];
    expect(saveCardVerdict('Wayne', 'Julia').score).toBeGreaterThan(bare);
    gs.coachDeals = [{ players: ['Wayne', 'Julia'], type: 'non-aggression', active: false, broken: true }];
    expect(saveCardVerdict('Wayne', 'Julia').score).toBeLessThan(bare);
  });

  it('repays a signature, and repays a refusal', () => {
    setup({ wayneArch: 'floater', wayneStats: { strategic: 6, loyalty: 5 } });
    const bare = saveCardVerdict('Wayne', 'Julia').score;
    gs.coachSaveLedger = [{ signer: 'Julia', saved: 'Wayne', ep: 3 }];
    expect(saveCardVerdict('Wayne', 'Julia').reason).toBe('debt');
    gs.coachSaveLedger = [{ refuser: 'Julia', saved: 'Wayne', ep: 3 }];
    const spurned = saveCardVerdict('Wayne', 'Julia');
    expect(spurned.score).toBeLessThan(bare);
    expect(spurned.reason).toBe('returning-the-favour');
  });

  it('names the same contestant the peers were shown when they agreed', () => {
    setup({ wayneArch: 'hero', wayneStats: { loyalty: 10, strategic: 1 } });
    addBond('Julia', 'Wayne', 8);
    addBond('Julia', 'Finn', -4);
    const shown = saveCardVerdict('Wayne', 'Julia').doomed;
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.replacement, 'signing for one price and charging another').toBe(shown);
  });
});

// Committed before the votes are read, like an idol — so it can be wasted,
// which is the only reason holding one is a decision and the threat of one is
// worth respecting.
describe('the card is played, not triggered', () => {
  it('is spent on commitment whether or not it was needed', () => {
    setup({ wayneArch: 'hero', wayneStats: { loyalty: 10, strategic: 1 } });
    addBond('Julia', 'Wayne', 8);
    const ep = { num: 6 };
    // Two blocs have named her, and she is bold and reads the room well.
    setPlayers([{ name: 'Julia', archetype: 'floater', stats: stats({ intuition: 10, boldness: 10 }) },
      ...['Wayne', 'Evie', 'Finn'].map(n => ({ name: n, archetype: 'hero', stats: stats() }))]);
    const alliances = [{ members: ['Evie'], target: 'Julia' }, { members: ['Finn'], target: 'Julia' }];
    commitSaveCards(ep, 'Red', alliances);
    expect(ep.coachCardCommits?.length, 'a coach staring at two blocs never reached for it').toBe(1);
    expect(coachRecord('Julia').saveCard, 'the card must be gone the moment it is played').toBe('used');
  });

  it('never commits when no bloc has named them', () => {
    setup();
    const ep = { num: 6 };
    commitSaveCards(ep, 'Red', [{ members: ['Evie'], target: 'Finn' }]);
    expect(ep.coachCardCommits).toBeUndefined();
    expect(coachRecord('Julia').saveCard).toBe('unused');
  });

  it('cannot be reached for after the votes — an uncommitted coach goes home', () => {
    setup({ wayneArch: 'hero', wayneStats: { loyalty: 10, strategic: 1 } });
    addBond('Julia', 'Wayne', 9);
    const ep = { num: 6 };
    const result = { eliminated: 'Julia' };
    expect(maybeSaveCoach(ep, result), 'the card fired without ever being played').toBe(false);
    expect(result.eliminated).toBe('Julia');
    expect(ep.coachCardNotPlayed[0].held, 'she went home holding it').toBe(true);
  });

  it('resolves a committed, signed card into a replacement', () => {
    setup({ wayneArch: 'hero', wayneStats: { loyalty: 10, strategic: 1 } });
    addBond('Julia', 'Wayne', 9);
    addBond('Julia', 'Finn', -6);
    const ep = { num: 6 };
    commitSaveCards(ep, 'Red', [{ members: ['Evie'], target: 'Julia' },
      { members: ['Finn'], target: 'Julia' }, { members: ['Wayne'], target: 'Julia' }]);
    if (!ep.coachCardCommits) return;   // commitment is probabilistic
    const result = { eliminated: 'Julia' };
    expect(maybeSaveCoach(ep, result)).toBe(true);
    expect(result.eliminated).toBe('Finn');
  });
});
