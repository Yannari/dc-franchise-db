// The save card is a deal between the coaches of ONE TEAM, not a poll of the
// tribe. Contestants already had their say — at the vote. Every other coach on
// that tribe has to agree, so refusing is the cheapest kill in the game: you
// never need the numbers at tribal, you need one peer who would rather not.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { addBond } from '../js/bonds.js';
import { addCoach, coachRecord } from '../js/coaches.js';
import { offerSaveCard, saveCardVerdict } from '../js/coach-episode.js';

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
    bonds: {}, namedAlliances: [], episode: 6 });
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
