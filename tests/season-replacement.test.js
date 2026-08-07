// Re-exporting a season has to CORRECT it, not layer over it.
//
// Three things used to survive a replacement, all of them found by asking the
// plain question "if I publish a test season now, can I replace it with the real
// one later?" — and the honest answer was "mostly":
//
//   1. Anybody dropped from the cast kept the appearance forever, because the
//      merge only ever visited players in the NEW season document.
//   2. The winner's badge was only ever added, never removed, so a player who
//      lost a re-exported season kept wearing it.
//   3. Both shows wrote `S1 Winner`, so Big Brother 1's winner and Total Drama
//      1's winner carried the same badge.
//
// All three are silent: nothing errors, the numbers just stay wrong.
import { describe, expect, it } from 'vitest';
import { mergeBigBrotherSeason } from '../js/stats-export.js';

/** A minimal Big Brother season document, cast given as [name, status]. */
function bbSeason(seasonNumber, cast) {
  return {
    format: 'big-brother',
    seasonNumber,
    placements: cast.map(([name, status], i) => ({
      name, playerSlug: name.toLowerCase(), placement: i + 1, status,
      votesReceived: 2, juryVotes: status === 'Winner' ? 5 : 0,
      bb: { hohWins: 1, vetoWins: 1, timesNominated: 1, timesOnBlock: 1, timesSaved: 0 },
    })),
  };
}

const detailsFor = (db, name, format = 'big-brother') =>
  (db.players.find(p => p.name === name)?.seasonDetails || [])
    .filter(d => (d.format || 'total-drama') === format);

describe('replacing a season that was already published', () => {
  it('takes the appearance off anybody dropped from the cast', () => {
    // The test-season problem: publish one cast, then publish the real season
    // with a different cast over the top of it.
    const first = mergeBigBrotherSeason({ franchise: {}, players: [] },
      bbSeason(1, [['Ann', 'Winner'], ['Bo', 'Runner-up'], ['Cal', 'Jury']]));
    expect(detailsFor(first, 'Cal')).toHaveLength(1);

    const second = mergeBigBrotherSeason(first,
      bbSeason(1, [['Ann', 'Winner'], ['Bo', 'Runner-up'], ['Dee', 'Jury']]));

    // Cal was not in the real season and must not be recorded as having played it.
    expect(detailsFor(second, 'Cal'), 'Cal kept a season he was never in').toHaveLength(0);
    expect(detailsFor(second, 'Dee')).toHaveLength(1);
    const cal = second.players.find(p => p.name === 'Cal');
    expect(cal.totalSeasons, "Cal's season count still counts the removed season").toBe(0);
    expect(cal.totalChallengeWins).toBe(0);
    expect(cal.totalVotesAgainst).toBe(0);
    expect(cal.byShow['big-brother'], 'a per-show record survived the removal').toBeUndefined();
  });

  it('takes the winner badge off somebody who no longer wins it', () => {
    const first = mergeBigBrotherSeason({ franchise: {}, players: [] },
      bbSeason(1, [['Ann', 'Winner'], ['Bo', 'Runner-up']]));
    expect(first.players.find(p => p.name === 'Ann').badges).toContain('BB1 Winner');
    expect(first.players.find(p => p.name === 'Ann').wins).toBe(1);

    // The real season 1: Bo wins instead.
    const second = mergeBigBrotherSeason(first,
      bbSeason(1, [['Bo', 'Winner'], ['Ann', 'Runner-up']]));

    const ann = second.players.find(p => p.name === 'Ann');
    const bo = second.players.find(p => p.name === 'Bo');
    expect(ann.badges, 'Ann is still wearing a badge she no longer holds').not.toContain('BB1 Winner');
    expect(ann.wins).toBe(0);
    expect(bo.badges).toContain('BB1 Winner');
    expect(bo.wins).toBe(1);
  });

  it('does not give a Big Brother winner Total Drama\'s badge', () => {
    // Both merges wrote `S${n} Winner`, so BB1's winner and TD1's winner ended
    // up with the same badge on the same career page.
    const db = mergeBigBrotherSeason({ franchise: {}, players: [{
      id: 'ann', name: 'Ann', seasons: [1], totalSeasons: 1, wins: 1,
      badges: ['S1 Winner'],
      seasonDetails: [{ season: 1, format: 'total-drama', seasonId: 'td-1',
        placement: 1, status: 'Winner', challengeWins: 3 }],
    }] }, bbSeason(1, [['Ann', 'Winner'], ['Bo', 'Runner-up']]));

    const ann = db.players.find(p => p.name === 'Ann');
    expect(ann.badges, 'the Total Drama badge was disturbed').toContain('S1 Winner');
    expect(ann.badges, 'the Big Brother badge is indistinguishable').toContain('BB1 Winner');
    expect(ann.wins, 'two different shows, two wins').toBe(2);
    expect(ann.totalSeasons).toBe(2);
  });

  it('leaves the other show completely alone', () => {
    const withTd = { franchise: {}, players: [{
      id: 'cal', name: 'Cal', seasons: [1], totalSeasons: 1, wins: 1,
      totalChallengeWins: 5, totalImmunityWins: 3, badges: ['S1 Winner'],
      // Real records carry this — it is rebuilt whenever a player is touched.
      byShow: { 'total-drama': { seasons: 1, totalChallengeWins: 5, totalImmunityWins: 3 } },
      seasonDetails: [{ season: 1, format: 'total-drama', seasonId: 'td-1',
        placement: 1, status: 'Winner', challengeWins: 5, immunityWins: 3 }],
    }] };
    // Cal is not in the Big Brother cast at all, and is stripped-then-not-readded.
    const db = mergeBigBrotherSeason(withTd, bbSeason(1, [['Ann', 'Winner'], ['Bo', 'Jury']]));
    const cal = db.players.find(p => p.name === 'Cal');
    expect(cal.seasonDetails).toHaveLength(1);
    expect(cal.wins).toBe(1);
    expect(cal.badges).toContain('S1 Winner');
    expect(cal.byShow['total-drama'].totalChallengeWins).toBe(5);
  });

  it('still does not double-count an unchanged re-export', () => {
    // The behaviour that already worked, kept honest while the strip moved.
    const doc = bbSeason(1, [['Ann', 'Winner'], ['Bo', 'Jury']]);
    const once = mergeBigBrotherSeason({ franchise: {}, players: [] }, doc);
    const twice = mergeBigBrotherSeason(once, doc);
    for (const p of twice.players) {
      const was = once.players.find(q => q.name === p.name);
      expect(p.seasonDetails).toHaveLength(1);
      expect(p.totalSeasons).toBe(was.totalSeasons);
      expect(p.wins).toBe(was.wins);
      expect(p.totalChallengeWins).toBe(was.totalChallengeWins);
      expect(p.badges).toEqual(was.badges);
    }
  });
});
