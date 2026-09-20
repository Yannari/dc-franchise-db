// ══════════════════════════════════════════════════════════════════════
// coach-save-card-odds.test.js — when a coach actually reaches for the card
// ══════════════════════════════════════════════════════════════════════
//
// Reported: "the coach even alone never used their save card".
//
// Measured over five seasons with one coach per tribe: thirty blocs aimed at a
// coach, THREE cards played, and nine coaches voted out with a live card in
// the staff's pocket. Two reasons, both in commitSaveCards:
//
//   1. Danger counted BLOCS, not people — `blocsAiming * 0.45`. One schemer
//      read exactly as dangerous as a seven-strong majority, and a small tribe
//      almost always has exactly one bloc aiming, so the reading sat pinned at
//      0.45 whether the coach was mildly disliked or already dead.
//   2. A coach with no peers was rolling the same odds as one with insurance
//      to protect. The unanimity rule exists because spending the card leaves
//      the OTHER coach exposed — with one coach on the tribe there is no other
//      coach, and a card held is a card that dies with them.
//
// The roll is injectable, so these are exact thresholds rather than a
// distribution: each assertion picks a roll that lands on the far side of the
// old odds from the new ones.
import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../js/core.js';
import { commitSaveCards } from '../js/coach-episode.js';
import { addCoach } from '../js/coaches.js';
import { seedGs } from './helpers/setup.js';

const CONTESTANTS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];
const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };

/** One tribe, `coachCount` coaches on it, everybody average. */
function camp(coachCount) {
  const coaches = ['CoachA', 'CoachB'].slice(0, coachCount);
  seedGs({ tribes: [{ name: 'Bass', members: [...CONTESTANTS] }], coaches: [], coachCards: {} });
  core.setPlayers([...CONTESTANTS, ...coaches].map(name => ({
    name, slug: name.toLowerCase(), gender: 'f', sexuality: 'straight', archetype: 'floater', stats: { ...STATS },
  })));
  for (const name of coaches) addCoach({ name, tribe: 'Bass' });
  return coaches;
}

/** The whole tribe, or just `n` of them, in one bloc aiming at the coach. */
const blocAt = (target, n = CONTESTANTS.length) => [{ members: CONTESTANTS.slice(0, n), target, tribe: 'Bass' }];

beforeEach(() => { camp(1); });

describe('reaching for the save card', () => {
  it('plays it when the whole tribe is aiming at a lone coach', () => {
    const ep = {};
    // old odds on this exact board: 0.234, so a roll of 0.5 refused a card
    // against a unanimous tribe. New odds cap at 0.95.
    const commits = commitSaveCards(ep, 'Bass', blocAt('CoachA'), () => 0.5);
    expect(commits.length).toBe(1);
    expect(commits[0].signed, 'a coach with no peers needs nobody else to sign').toBe(true);
    expect(ep.coachCardCommits?.length).toBe(1);
  });

  it('does not spend it on one schemer', () => {
    // one person out of seven. The old reading called this 0.45 dangerous —
    // identical to the whole tribe — and a roll of 0.2 played the card.
    const commits = commitSaveCards({}, 'Bass', blocAt('CoachA', 1), () => 0.2);
    expect(commits).toEqual([]);
  });

  it('reads a majority as more dangerous than a single vote', () => {
    const roll = () => 0.5;
    expect(commitSaveCards({}, 'Bass', blocAt('CoachA', 2), roll).length).toBe(0);
    expect(commitSaveCards({}, 'Bass', blocAt('CoachA', 6), roll).length).toBe(1);
  });

  it('holds longer when there is a peer the card also covers', () => {
    // same danger, same stats: the difference is that spending it here leaves
    // CoachB exposed, so the nerve to spend has to be higher
    camp(2);
    expect(commitSaveCards({}, 'Bass', blocAt('CoachA'), () => 0.8).length).toBe(0);
    camp(1);
    expect(commitSaveCards({}, 'Bass', blocAt('CoachA'), () => 0.8).length).toBe(1);
  });

  it('does nothing when nobody is aiming at the staff', () => {
    expect(commitSaveCards({}, 'Bass', blocAt('P3'), () => 0.01)).toEqual([]);
  });

  it('does nothing once the tribe has spent its card', () => {
    commitSaveCards({}, 'Bass', blocAt('CoachA'), () => 0.1);
    expect(core.gs.coachCards.Bass).toBe('used');
    expect(commitSaveCards({}, 'Bass', blocAt('CoachA'), () => 0.1)).toEqual([]);
  });
});
