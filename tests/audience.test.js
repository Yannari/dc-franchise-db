// The audience measure, and the bug it exists to undo.
//
// `gs.popularity` is a running total incremented from 381 places, so it is
// dominated by how many rounds somebody was in: on Big Brother 1 it correlates
// with FINAL PLACEMENT at -0.952. Every consumer that asked "was this player
// liked" was reading "how long did they last" — the fan favourite award on both
// shows, the heroes board, the audience pulse, the social feed's crowd.
//
// Asserted on the property rather than on a constant, because the constants are
// tuning and the property is the point.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { audienceBoard, audienceStanding, roundsPresent, runAudienceVote, AUDIENCE_PRIOR }
  from '../js/audience.js';

/** A season where the beloved one leaves early and the dull one goes far. */
function season() {
  setGs({
    episodeHistory: Array.from({ length: 10 }, (_, i) => ({
      num: i + 1,
      // Loved goes in round 3; Grinder is never eliminated.
      eliminated: i + 1 === 3 ? 'Loved' : (i + 1 === 8 ? 'Middle' : null),
    })),
    // Loved earned 30 across 3 rounds; Grinder earned 60 across all 10.
    popularity: { Loved: 30, Grinder: 60, Middle: 24, Dull: 5 },
    eliminated: ['Loved', 'Middle'],
    activePlayers: ['Grinder', 'Dull'],
  });
}

beforeEach(season);

describe('rounds present', () => {
  it('counts to the round somebody left, and to the end for somebody who did not', () => {
    expect(roundsPresent('Loved')).toBe(3);
    expect(roundsPresent('Middle')).toBe(8);
    expect(roundsPresent('Grinder')).toBe(10);
  });

  it('credits a returnee to their LAST exit, not their first', () => {
    // Coming back and going out again means MORE rounds on screen, not fewer.
    gs.episodeHistory[2].eliminated = 'Loved';
    gs.episodeHistory[6].eliminated = 'Loved';
    expect(roundsPresent('Loved')).toBe(7);
  });

  it('never divides by zero on a season with no history yet', () => {
    setGs({ episodeHistory: [], popularity: { A: 4 }, eliminated: [], activePlayers: ['A'] });
    expect(roundsPresent('A')).toBe(1);
    expect(Number.isFinite(audienceStanding('A'))).toBe(true);
  });
});

describe('the standing', () => {
  it('rates the beloved early exit above the long dull run', () => {
    // The whole bug in one assertion: Grinder has TWICE the raw popularity and
    // is the lesser-liked player.
    expect(gs.popularity.Grinder).toBeGreaterThan(gs.popularity.Loved);
    expect(audienceStanding('Loved')).toBeGreaterThan(audienceStanding('Grinder'));
    expect(audienceBoard()[0].name).toBe('Loved');
  });

  it('keeps the raw total available, because it still means something', () => {
    const row = audienceBoard().find(r => r.name === 'Grinder');
    expect(row.popularity).toBe(60);          // what they generated across a season
    expect(row.rounds).toBe(10);
    expect(row.standing).toBeCloseTo(60 / (10 + AUDIENCE_PRIOR), 5);
  });

  it('does not let one good round in a two-round career top the board', () => {
    // Without a prior this is the failure mode: 12/1 beats everybody alive.
    setGs({
      episodeHistory: [{ num: 1, eliminated: 'Flash' }, { num: 2 }, { num: 3 }],
      popularity: { Flash: 12, Steady: 30 }, eliminated: ['Flash'], activePlayers: ['Steady'],
    });
    expect(audienceBoard()[0].name).toBe('Steady');
  });
});

describe('the audience vote', () => {
  const seeded = seed => () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 0x100000000);

  it('usually returns the favourite, and can be lost', () => {
    const wins = {};
    for (let s = 1; s <= 300; s++) {
      const r = runAudienceVote({ rng: seeded(s) });
      wins[r.winner] = (wins[r.winner] || 0) + 1;
    }
    expect(wins.Loved / 300).toBeGreaterThan(0.4);
    // Not a coronation: the prize is a vote and somebody else can take it.
    expect(Object.keys(wins).length).toBeGreaterThan(1);
  });

  it('sharpens as more of the country votes', () => {
    const rate = blocks => {
      let w = 0;
      for (let s = 1; s <= 200; s++) if (runAudienceVote({ rng: seeded(s), blocks }).winner === 'Loved') w++;
      return w / 200;
    };
    expect(rate(2000)).toBeGreaterThan(rate(30));
  });

  it('publishes a tally that adds up to the result it announces', () => {
    // The graphic and the winner have to be the same event — drawing one and
    // printing the other is how a screen shows somebody on top and crowns
    // somebody else underneath.
    const r = runAudienceVote({ rng: seeded(11) });
    expect(r.tally[0].name).toBe(r.winner);
    expect(r.tally.reduce((s, t) => s + t.share, 0)).toBeLessThanOrEqual(100.01);
  });

  it('is show-agnostic: nothing here knows what a round is called', async () => {
    const src = await import('node:fs').then(fs => fs.readFileSync('js/audience.js', 'utf8'));
    for (const word of ['houseguest', 'week', 'tribe', 'episode', 'big-brother', 'total-drama']) {
      expect(src.split('*/').pop().toLowerCase(), `"${word}" in the code below the comments`)
        .not.toContain(word);
    }
  });
});
