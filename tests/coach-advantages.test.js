import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { addCoach, coachRecord } from '../js/coaches.js';
import { coachCanPlay, giveAdvantage } from '../js/advantages.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

beforeEach(() => {
  setPlayers([{ name: 'Julia', archetype: 'schemer', stats: stats() }, { name: 'Evie', archetype: 'goat', stats: stats() }]);
  setGs({ activePlayers: ['Evie'], coaches: [], coachTraining: {}, advantages: [] });
  addCoach({ name: 'Julia', tribe: 'Red' });
});

describe('a coach’s power always targets somebody else', () => {
  it('refuses everything self-directed', () => {
    expect(coachCanPlay('idol')).toBe(false);
    expect(coachCanPlay('legacy')).toBe(false);
    expect(coachCanPlay('amulet')).toBe(false);
    expect(coachCanPlay('extra-vote')).toBe(false);
    expect(coachCanPlay('vote-steal')).toBe(false);
  });

  it('allows what acts on another player', () => {
    expect(coachCanPlay('kip')).toBe(true);
    expect(coachCanPlay('fake-idol')).toBe(true);
  });

  it('refuses vote-stopper even though it targets somebody else', () => {
    // Deliberate. "Coaches never touch the ballot" is a cleaner promise than
    // the targeting rule, and a coach reaching invisibly into a pre-merge vote
    // makes the vote unreadable in a game where reading it is the sport.
    expect(coachCanPlay('vote-stopper')).toBe(false);
  });
});

describe('handing one over', () => {
  // This used to cost the coach their save card. The two mechanics have
  // nothing to do with each other — the card is a life-or-death consensus
  // between the coaches of a tribe — and pricing an idol transfer in it made
  // the transfer never happen, because the card is usually the only thing
  // keeping its owner alive. "Coaches can arm their protégés" was dead on
  // arrival. The cost of giving an advantage away is giving it away.
  it('moves the advantage and leaves the save card alone', () => {
    gs.advantages.push({ holder: 'Julia', type: 'idol' });
    expect(giveAdvantage('Julia', 'Evie', gs.advantages[0])).toBe(true);
    expect(gs.advantages[0].holder).toBe('Evie');
    expect(coachRecord('Julia').saveCard,
      'the card is the coach’s life, not the price of a gift').toBe('unused');
  });

  it('still works for a coach who has already spent their card', () => {
    coachRecord('Julia').saveCard = 'used';
    gs.advantages.push({ holder: 'Julia', type: 'idol' });
    expect(giveAdvantage('Julia', 'Evie', gs.advantages[0]),
      'a coach with no card left can still arm somebody').toBe(true);
    expect(gs.advantages[0].holder).toBe('Evie');
  });

  it('records who it came from, so the debt is legible downstream', () => {
    gs.advantages.push({ holder: 'Julia', type: 'idol' });
    giveAdvantage('Julia', 'Evie', gs.advantages[0]);
    expect(gs.advantages[0].givenBy).toBe('Julia');
  });

  it('refuses to move something the coach does not hold', () => {
    gs.advantages.push({ holder: 'Finn', type: 'idol' });
    expect(giveAdvantage('Julia', 'Evie', gs.advantages[0])).toBe(false);
    expect(gs.advantages[0].holder).toBe('Finn');
  });
});
