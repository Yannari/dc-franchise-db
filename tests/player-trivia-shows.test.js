// Computed trivia speaks each show's own words and counts its own competitions.
// Drag Race had no entry and printed Total Drama's: "contestant", "immunity
// wins", "idols" and "win without a single vote cast against them" — on a show
// with no vote.
import { describe, it, expect } from 'vitest';
import { careersIn } from '../js/records.js';
import { allPlayerTrivia } from '../js/player-trivia.js';

const field = (format, block, n = 8) => ({
  players: Array.from({ length: n }, (_, i) => ({
    id: `p${i}`, name: `P${i}`,
    seasonDetails: [{
      format, season: (i % 4) + 1, placement: i < 4 ? 1 : 2 + (i % 5),
      challengeWins: i, votesReceived: 0, immunityWins: 0,
      [block.key]: block.make(i),
    }],
  })),
});
const lines = (doc, format) => Object.values(allPlayerTrivia(careersIn(doc, format), format)).flat();

describe('Drag Race trivia', () => {
  const out = lines(field('drag-race', { key: 'dr', make: i => ({ wins: i, lipsyncWins: i % 3, bottoms: i % 2 }) }), 'drag-race');

  it('says queen and counts maxi challenges and lip syncs', () => {
    expect(out.some(t => /most maxi challenge wins of any queen/.test(t))).toBe(true);
    expect(out.some(t => /lip syncs won/.test(t))).toBe(true);
    expect(out.some(t => /the first queen to take the crown/.test(t))).toBe(true);
  });

  it('borrows no other show\'s words, and never mentions a vote', () => {
    for (const t of out) expect(t).not.toMatch(/contestant|immunity|idol|\bvotes?\b|game/i);
  });
});

describe('The Challenge trivia', () => {
  const out = lines(field('the-challenge', { key: 'ch', make: i => ({ dailyWins: i, arenaWins: i % 3, timesVotedIn: i % 2 }) }), 'the-challenge');
  it('counts dailies and Arena wins', () => {
    expect(out.some(t => /most dailies won of any player/.test(t))).toBe(true);
    expect(out.some(t => /Arena wins/.test(t))).toBe(true);
    for (const t of out) expect(t).not.toMatch(/immunity|idol|contestant/i);
  });
});

describe('The Circle trivia', () => {
  const out = lines(field('the-circle', { key: 'ci', make: i => ({ influencerTimes: i, firstPlaces: i % 3, blocksMade: i % 2 }) }), 'the-circle');
  it('counts Influencer turns and first-place ratings', () => {
    expect(out.some(t => /times as Influencer/.test(t))).toBe(true);
    for (const t of out) expect(t).not.toMatch(/immunity|idol|contestant|challenge/i);
  });
});
