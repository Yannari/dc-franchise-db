// ══════════════════════════════════════════════════════════════════════
// pm/schedule.js — sixteen episodes: fifteen in the villa and the reunion
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3. Arrivals are drawn from the season's queues in cast order; an
// empty queue skips the arrival, which is how a 20-islander cast plays the
// same template with one bombshell fewer. `rituals` are the villa's set
// pieces (spec §6.9), run by villa-day.js on the night they belong to.
export const SEASON_TEMPLATE = [
  { ep: 1, days: [1, 2], moment: 'first-coupling', arrivals: { bombshell: 1 } },
  { ep: 2, days: [3, 5], moment: 'recoupling' },
  { ep: 3, days: [6, 8], moment: 'bombshell', arrivals: { bombshell: 1 }, rituals: ['heart-rate'] },
  { ep: 4, days: [9, 11], moment: 'recoupling' },
  { ep: 5, days: [12, 14], moment: 'public-vote', dumpFormat: 'cross-gender', bottom: 2 },
  { ep: 6, days: [15, 17], moment: 'bombshell', arrivals: { bombshell: 2 } },
  { ep: 7, days: [18, 20], moment: 'recoupling', rituals: ['snog-marry-pie'] },
  { ep: 8, days: [21, 23], moment: 'casa-open' },
  { ep: 9, days: [24, 26], moment: 'casa-nights' },
  { ep: 10, days: [27, 28], moment: 'stick-or-twist' },
  { ep: 11, days: [29, 31], moment: 'photos', arrivals: { bombshell: 1 }, rituals: ['movie-night'] },
  { ep: 12, days: [32, 34], moment: 'public-vote', dumpFormat: 'safe-pick-couple', bottom: 3 },
  { ep: 13, days: [35, 37], moment: 'recoupling', arrivals: { bombshell: 1 }, rituals: ['notes'], keepSingles: true },
  { ep: 14, days: [38, 40], moment: 'semi-final', rituals: ['families'] },
  { ep: 15, days: [41, 43], moment: 'final' },
  { ep: 16, days: null, moment: 'reunion' },
];
export const FINAL_COUPLES = 4;
