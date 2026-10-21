// Kristal-talKs exit interviews — what each queue-aired show's rows say.
//
// One adapter per show for js/exit-interview/aired.js: how somebody left
// (the door), the ballots the audience saw, who left beside them, and who
// finished. Ridonculous Race is not here yet.

import { gs } from '../core.js';

const exitsOf = row => (Array.isArray(row?.exits) ? row.exits : []).filter(x => x && x.name);

export const AIRED_ADAPTERS = {
  traitors: {
    show: 'traitors',
    seed: () => gs?._trSeed ?? '',
    // The round table reads every slate aloud: they know who wrote their name.
    publicVotes: true,
    ballots: row => (row?.tr?.table?.votes || []).filter(v => !v.channel || v.channel === 'banishment')
      .map(v => ({ voter: v.voter, target: v.target ?? v.voted })),
    howOf: (name, row) => exitsOf(row).find(x => x.name === name)?.channel === 'murder' ? 'murdered' : 'evicted',
    finalists: row => row?.tr?.endgame?.survivors || null,
    winners: row => row?.tr?.endgame?.takers || [],
  },
  'drag-race': {
    show: 'drag-race',
    seed: () => gs?.dr?.seed ?? gs?._drSeed ?? '',
    // No vote: the panel ranks, the host decides, and the bottom two lip sync.
    howOf: () => 'lip-sync',
    startRoom: row => row?.dr?.roomAtStart || row?.houseAtStart || [],
    finalists: row => row?.dr?.finale ? [row.dr.finale.winner, row.dr.finale.runnerUp, ...(row.dr.finale.others || [])].filter(Boolean) : null,
    winners: row => [row?.dr?.finale?.winner].filter(Boolean),
  },
  'perfect-match': {
    show: 'perfect-match',
    seed: () => gs?.pm?.seed ?? '',
    howOf: () => 'dumped',
    winners: () => gs?.pmWinners || gs?.pm?.winners || [],
  },
  'the-circle': {
    show: 'the-circle',
    seed: () => gs?.ci?.seed ?? '',
    howOf: () => 'blocked',
    winners: () => gs?.ciWinners || gs?.ci?.winners || [],
  },
  'the-challenge': {
    show: 'the-challenge',
    seed: () => gs?.ch?.seed ?? '',
    howOf: () => 'lost-elimination',
    startRoom: row => row?.ch?.house || [],
    winners: row => row?.ch?.final?.champions || [],
  },
};

/** The adapter with its seed read now (the season's seed lives on gs). */
export function airedAdapter(show) {
  const a = AIRED_ADAPTERS[show];
  return a ? { ...a, seed: typeof a.seed === 'function' ? a.seed() : a.seed } : null;
}
