// Career fame: how big a deal a player is across the whole franchise.
//
// These are the rules, pinned. The weights themselves live in
// tests/fame-calibration.test.js, which measures them against the real roster —
// this file must stay green whatever the tuning does to the numbers.
import { describe, expect, it } from 'vitest';
import { starsFromScore, showRankMultiplier, seasonChronology,
  popularityFactor, seasonAwardPoints, seasonGain, PLACEMENT_BASE,
  computeFame, fameOf, recordsHeld, normaliseStatus } from '../js/fame.js';

describe('turning a score into stars', () => {
  it('places every threshold on its own step', () => {
    expect(starsFromScore(0)).toBe(0);
    expect(starsFromScore(4.9)).toBe(0);
    expect(starsFromScore(5)).toBe(0.5);
    expect(starsFromScore(12)).toBe(1);
    expect(starsFromScore(30)).toBe(2);
    expect(starsFromScore(52)).toBe(3);
    expect(starsFromScore(76)).toBe(4);
    expect(starsFromScore(86)).toBe(4.5);
    expect(starsFromScore(95)).toBe(5);
    expect(starsFromScore(1000)).toBe(5);
  });

  it('never returns a value between the steps', () => {
    for (let s = 0; s <= 120; s += 0.5) {
      const stars = starsFromScore(s);
      expect(stars * 2, `score ${s} produced ${stars}`).toBe(Math.round(stars * 2));
      expect(stars).toBeLessThanOrEqual(5);
      expect(stars).toBeGreaterThanOrEqual(0);
    }
  });

  it('never goes down as the score goes up', () => {
    let prev = 0;
    for (let s = 0; s <= 120; s += 0.25) {
      const stars = starsFromScore(s);
      expect(stars).toBeGreaterThanOrEqual(prev);
      prev = stars;
    }
  });
});

const TD_BOARD = { metadata: { format: 'total-drama' }, rankings: [
  { playerId: 'alejandro', tier: 'S+' }, { playerId: 'bridgette', tier: 'B' },
]};
const BB_BOARD = { metadata: { format: 'big-brother' }, rankings: [
  { playerId: 'alejandro', tier: 'D' }, { playerId: 'hicks', tier: 'S' },
]};

describe('per-show rankings', () => {
  it('reads the board belonging to that show', () => {
    expect(showRankMultiplier('alejandro', 'total-drama', [TD_BOARD, BB_BOARD])).toBe(1.5);
    // Same player, different show, different standing.
    expect(showRankMultiplier('alejandro', 'big-brother', [TD_BOARD, BB_BOARD])).toBe(0.75);
    expect(showRankMultiplier('hicks', 'big-brother', [TD_BOARD, BB_BOARD])).toBe(1.35);
  });

  it('treats an untagged board as Total Drama, which is what the live file is', () => {
    const untagged = { rankings: [{ playerId: 'alejandro', tier: 'S+' }] };
    expect(showRankMultiplier('alejandro', 'total-drama', untagged)).toBe(1.5);
  });

  it('falls back to neutral rather than zero', () => {
    // A show with no board at all — Big Brother, today.
    expect(showRankMultiplier('hicks', 'big-brother', TD_BOARD)).toBe(1);
    // On the board but unranked, or a tier nobody recognises.
    expect(showRankMultiplier('nobody', 'total-drama', TD_BOARD)).toBe(1);
    expect(showRankMultiplier('x', 'total-drama',
      { metadata: { format: 'total-drama' }, rankings: [{ playerId: 'x', tier: 'Unranked' }] })).toBe(1);
  });
});

describe('ordering two shows into one franchise history', () => {
  it('keeps the order the seasons database lists them in', () => {
    const db = { seasons: [
      { seasonNumber: 2, format: 'total-drama', seasonId: 'td-2' },
      { seasonNumber: 1, format: 'big-brother', seasonId: 'bb-1' },
      { seasonNumber: 3, format: 'total-drama', seasonId: 'td-3' },
    ]};
    expect(seasonChronology(db).map(s => s.seasonId)).toEqual(['td-2', 'bb-1', 'td-3']);
  });

  it('synthesises a seasonId for a record written before they existed', () => {
    const db = { seasons: [{ seasonNumber: 1 }] };   // no format, no seasonId
    expect(seasonChronology(db)).toEqual([
      expect.objectContaining({ seasonId: 'td-1', format: 'total-drama', seasonNumber: 1 }),
    ]);
  });

  it('survives an empty or missing database', () => {
    expect(seasonChronology({ seasons: [] })).toEqual([]);
    expect(seasonChronology(null)).toEqual([]);
  });
});

describe('what a single season is worth', () => {
  const cohort = [
    { playerId: 'a', popularity: 40 },
    { playerId: 'b', popularity: 20 },
    { playerId: 'c', popularity: 0 },
  ];

  it('spaces popularity by rank, not by raw value', () => {
    expect(popularityFactor('a', cohort)).toBeCloseTo(1.5, 5);
    expect(popularityFactor('b', cohort)).toBeCloseTo(1.0, 5);
    expect(popularityFactor('c', cohort)).toBeCloseTo(0.5, 5);
    // Raw values are unbounded and vary in scale between seasons, so a huge
    // outlier must not compress everybody else.
    const skewed = [
      { playerId: 'a', popularity: 9999 },
      { playerId: 'b', popularity: 2 },
      { playerId: 'c', popularity: 1 },
    ];
    expect(popularityFactor('b', skewed)).toBeCloseTo(1.0, 5);
  });

  it('is neutral when nobody in the season recorded popularity', () => {
    const blank = [{ playerId: 'a' }, { playerId: 'b' }];
    expect(popularityFactor('a', blank)).toBe(1);
    expect(popularityFactor('a', [{ playerId: 'a', popularity: 5 }])).toBe(1); // cast of one
  });

  it('treats a season with no spread as unrated, not unanimous', () => {
    // The export writes 0 rather than nothing for a player with no popularity,
    // so a season that never tracked it arrives as identical zeroes. Ranking
    // those would invent an audience reaction out of array order.
    const flat = [{ playerId: 'a', popularity: 0 }, { playerId: 'b', popularity: 0 },
                  { playerId: 'c', popularity: 0 }];
    expect(popularityFactor('a', flat)).toBe(1);
    expect(popularityFactor('c', flat)).toBe(1);
    // Any real spread is still read normally.
    const spread = [{ playerId: 'a', popularity: 1 }, { playerId: 'b', popularity: 0 }];
    expect(popularityFactor('a', spread)).toBeCloseTo(1.5, 5);
  });

  it('counts the three awards the seasons database stores', () => {
    const season = { awards: {
      fanFavorite: { playerSlug: 'a' },
      bestStrategic: { playerSlug: 'b' },
      mostChallengeWins: { playerSlug: 'a' },
    }};
    expect(seasonAwardPoints('a', season)).toBe(14);   // 10 + 4
    expect(seasonAwardPoints('b', season)).toBe(4);
    expect(seasonAwardPoints('c', season)).toBe(0);
    expect(seasonAwardPoints('a', { awards: {} })).toBe(0);
  });

  it('multiplies placement by reception, then by standing on that show', () => {
    const season = { format: 'total-drama', awards: {} };
    const rankings = { metadata: { format: 'total-drama' },
      rankings: [{ playerId: 'a', tier: 'S+' }] };
    // Winner 22 x 1.5 popularity x 1.5 rank
    expect(seasonGain({ playerId: 'a', detail: { status: 'Winner' },
      season, cohort, rankings })).toBeCloseTo(49.5, 5);
    // A forgettable winner earns materially less than a beloved one.
    expect(seasonGain({ playerId: 'c', detail: { status: 'Winner' },
      season, cohort, rankings })).toBeCloseTo(11, 5);   // 22 x 0.5 x 1.0
  });

  it('speaks every dialect the franchise records a placement in', () => {
    // Fifteen seasons and two shows do not agree on these strings. Matching them
    // literally scored 226 of 262 real season details at zero.
    expect(normaliseStatus('Juror')).toBe('Jury');        // players_database.json
    expect(normaliseStatus('Jury')).toBe('Jury');         // the Big Brother export
    expect(normaliseStatus('Pre-Juror')).toBe('Pre-jury');
    expect(normaliseStatus('Pre-Merge')).toBe('Pre-jury');
    expect(normaliseStatus('Pre-Jury')).toBe('Pre-jury'); // must not read as Jury
    expect(normaliseStatus('Winner')).toBe('Winner');
    expect(normaliseStatus('Finalist')).toBe('Finalist');
    expect(normaliseStatus('Runner-up')).toBe('Runner-up');
    expect(normaliseStatus('')).toBe(null);
    expect(normaliseStatus(undefined)).toBe(null);
    expect(normaliseStatus('Nonsense')).toBe(null);
  });

  it('scores the real vocabulary rather than zero', () => {
    const season = { format: 'total-drama', awards: {} };
    for (const status of ['Juror', 'Pre-Juror', 'Pre-Merge']) {
      expect(seasonGain({ playerId: 'a', detail: { status }, season,
        cohort: [], rankings: {} }), `${status} scored nothing`).toBeGreaterThan(0);
    }
  });

  it('knows every placement tier and refuses to invent one', () => {
    expect(PLACEMENT_BASE).toEqual({
      'Winner': 22, 'Runner-up': 16, 'Finalist': 13, 'Jury': 8, 'Pre-jury': 3,
    });
    expect(seasonGain({ playerId: 'a', detail: { status: 'Nonsense' },
      season: { awards: {} }, cohort: [], rankings: {} })).toBe(0);
  });
});

/** Fifteen Total Drama seasons then one Big Brother, like the real franchise. */
function franchiseOf(n = 15) {
  const seasons = [];
  for (let i = 1; i <= n; i++) {
    seasons.push({ seasonNumber: i, format: 'total-drama', seasonId: `td-${i}`, awards: {} });
  }
  seasons.push({ seasonNumber: 1, format: 'big-brother', seasonId: 'bb-1', awards: {} });
  return { seasons };
}
const player = (id, details) => ({ id, name: id, seasonDetails: details });
const td = (n, status) => ({ season: n, format: 'total-drama', seasonId: `td-${n}`, status });
const bb = (n, status) => ({ season: n, format: 'big-brother', seasonId: `bb-${n}`, status });

describe('walking a career', () => {
  it('cannot reach five stars on one season, however good it was', () => {
    const seasons = { seasons: [{ seasonNumber: 1, format: 'total-drama', seasonId: 'td-1',
      awards: { fanFavorite: { playerSlug: 'solo' }, bestStrategic: { playerSlug: 'solo' } } }] };
    const r = fameOf('solo', {
      players: { players: [player('solo', [td(1, 'Winner')])] },
      rankings: { metadata: { format: 'total-drama' }, rankings: [{ playerId: 'solo', tier: 'S+' }] },
      seasons,
    });
    expect(r.seasonsPlayed).toBe(1);
    expect(r.stars, 'a single season reached five stars').toBeLessThanOrEqual(4.5);
    expect(r.locked).toBe(false);
  });

  it('fades a player who never comes back', () => {
    const dbs = { players: { players: [
      player('early', [td(1, 'Jury'), td(2, 'Jury')]),
      player('late', [td(14, 'Jury'), td(15, 'Jury')]),
    ]}, rankings: {}, seasons: franchiseOf() };
    const all = computeFame(dbs);
    expect(all.get('early').score).toBeLessThan(all.get('late').score);
    expect(all.get('early').timeline.some(t => t.event === 'missed')).toBe(true);
  });

  it('fades without ever going negative, however long the absence', () => {
    // Decay is proportional, so it approaches zero rather than punching through
    // it. This used to assert exactly 0, which was really testing the clamp on
    // the old flat subtraction — and that flat charge is what erased small
    // careers outright while barely touching big ones.
    const dbs = { players: { players: [player('faded', [td(1, 'Pre-jury')])] },
      rankings: {}, seasons: franchiseOf(60) };
    const r = computeFame(dbs).get('faded');
    expect(r.score).toBeGreaterThanOrEqual(0);
    // Sixty seasons away has to cost something real.
    const fresh = computeFame({ players: { players: [player('faded', [td(1, 'Pre-jury')])] },
      rankings: {}, seasons: { seasons: [{ seasonNumber: 1, format: 'total-drama', seasonId: 'td-1' }] } });
    expect(r.score).toBeLessThan(fresh.get('faded').score * 0.7);
    // Every decay step moves down, never up.
    const missed = r.timeline.filter(t => t.event === 'missed');
    expect(missed.length).toBeGreaterThan(0);
    expect(missed.every(t => t.delta < 0)).toBe(true);
  });

  it('locks at five and stops decaying forever', () => {
    const seasons = { seasons: [
      { seasonNumber: 1, format: 'total-drama', seasonId: 'td-1',
        awards: { fanFavorite: { playerSlug: 'legend' } } },
      { seasonNumber: 2, format: 'total-drama', seasonId: 'td-2',
        awards: { fanFavorite: { playerSlug: 'legend' } } },
      { seasonNumber: 1, format: 'big-brother', seasonId: 'bb-1',
        awards: { fanFavorite: { playerSlug: 'legend' } } },
    ]};
    for (let i = 3; i <= 40; i++) {
      seasons.seasons.push({ seasonNumber: i, format: 'total-drama', seasonId: `td-${i}`, awards: {} });
    }
    const r = fameOf('legend', {
      players: { players: [player('legend',
        [td(1, 'Winner'), td(2, 'Winner'), bb(1, 'Winner')])] },
      rankings: [{ metadata: { format: 'total-drama' }, rankings: [{ playerId: 'legend', tier: 'S+' }] },
                 { metadata: { format: 'big-brother' }, rankings: [{ playerId: 'legend', tier: 'S+' }] }],
      seasons,
    });
    expect(r.stars, 'a three-time winner across two shows is not famous').toBe(5);
    expect(r.locked).toBe(true);
    expect(r.timeline.filter(t => t.event === 'missed')).toHaveLength(0);
  });

  it('pays the multi-show bonus once per extra show, at the right season', () => {
    const dbs = { players: { players: [player('cross', [td(1, 'Jury'), bb(1, 'Jury')])] },
      rankings: {}, seasons: franchiseOf() };
    const r = computeFame(dbs).get('cross');
    const bonus = r.timeline.filter(t => t.event === 'multi-show');
    expect(bonus).toHaveLength(1);
    expect(bonus[0].delta).toBe(8);
    expect(bonus[0].seasonId).toBe('bb-1');
    expect(r.shows.sort()).toEqual(['big-brother', 'total-drama']);
  });

  it('counts records once each and caps them', () => {
    const franchise = { records: { challengeRecords: { overall: {
      mostChallengeWins: { playerSlug: 'rec' }, mostImmunityWins: { playerSlug: 'rec' },
      mostRewardWins: { playerSlug: 'rec' } } },
      votingRecords: { overall: { mostVotes: { playerSlug: 'rec' } } } } };
    expect(recordsHeld('rec', franchise)).toBe(4);
    expect(recordsHeld('nobody', franchise)).toBe(0);
    const r = fameOf('rec', { players: { players: [player('rec', [td(1, 'Jury')])] },
      rankings: {}, seasons: franchiseOf(1), franchise });
    const rec = r.timeline.filter(t => t.event === 'records');
    expect(rec).toHaveLength(1);
    expect(rec[0].delta, 'the records cap did not hold').toBe(12);
  });

  it('works with no franchise database at all', () => {
    expect(() => computeFame({ players: { players: [player('x', [td(1, 'Jury')])] },
      rankings: {}, seasons: franchiseOf(1) })).not.toThrow();
  });

  it('gives the same answer every time', () => {
    const dbs = { players: { players: [player('d', [td(1, 'Winner'), bb(1, 'Jury')])] },
      rankings: {}, seasons: franchiseOf() };
    const a = computeFame(dbs).get('d');
    const b = computeFame(dbs).get('d');
    expect(a.score).toBe(b.score);
    expect(a.timeline).toEqual(b.timeline);
  });

  it('gives a player with no popularity and no ranking a real score, not zero', () => {
    const r = fameOf('bare', { players: { players: [player('bare', [td(1, 'Winner')])] },
      rankings: {}, seasons: franchiseOf(1) });
    expect(r.score, 'the neutral fallbacks produced nothing').toBeGreaterThan(0);
    expect(r.stars).toBeGreaterThan(0);
  });
});
