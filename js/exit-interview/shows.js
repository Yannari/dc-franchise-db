// Kristal-talKs exit interviews — what each queue-aired show's rows say.
//
// One adapter per show for js/exit-interview/aired.js: how somebody left
// (the door), the ballots the audience saw, who left beside them, and who
// finished.

import { gs } from '../core.js';
import { pmStory } from './pm-story.js';
import { rrStory } from './rr-story.js';

// how a race team went out (rr-run.js VERB), as an interview's kind (core.js NO_VOTE)
const RR_DOOR = { last: 'raced-last', boomerang: 'raced-last', 'on-location': 'found-on-the-road', medevac: 'medical', quit: 'walked', mid: 'cut-at-halfway', midpoint: 'cut-at-halfway' };
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
    // A finalist's place is their COUPLE's, from the final's shares: numbered one islander at a time, the
    // runners-up came "3rd" and "4th" and nobody was ever second.
    placeOf: (name, row) => {
      // The final's row: the interviews may be recorded on the reunion's.
      const sh = [row, ...[...(gs?.episodeHistory || [])].reverse()].find(r => Array.isArray(r?.pm?.shares))?.pm.shares;
      if (!Array.isArray(sh)) return null;
      const i = [...sh].sort((a, b) => (b.share || 0) - (a.share || 0)).findIndex(x => (x.couple || []).includes(name));
      return i >= 0 ? i + 1 : null;
    },
    // Their couple, their ex, their fight, their friend, their drama (pm-story.js).
    story: (name, row) => pmStory(name, row, gs?.episodeHistory || []),
  },
  'the-circle': {
    show: 'the-circle',
    seed: () => gs?.ci?.seed ?? '',
    howOf: () => 'blocked',
    winners: () => gs?.ciWinners || gs?.ci?.winners || [],
  },
  // A race has no vote: a team goes out last on the mat, found by Don on the road, on a medevac, by quitting, or cut at
  // the final's halfway mat. Both of a team leave the same night, through the same door (the user, 2026-11-03).
  'ridonculous-race': {
    show: 'ridonculous-race',
    seed: () => gs?.rr?.seed ?? '',
    howOf: (name, row) => RR_DOOR[exitsOf(row).find(x => x.name === name)?.channel] || 'raced-last',
    pairOf: (name, row) => { const x = exitsOf(row).find(e => e.name === name); return (x?.members || []).find(n => n !== name) || null; },
    startRoom: row => (row?.rr?.order || []).flatMap(o => [o.a, o.b]).filter(Boolean),
    finalists: row => (row?.rr?.final ? (row.rr.order || []).filter(o => !(row.rr.eliminated || []).includes(o.team)).flatMap(o => [o.a, o.b]).filter(Boolean) : null),
    winners: row => row?.rr?.final?.winners || [],
    // a finalist's place is their team's: the winners first, then the order they crossed the line
    placeOf: (name, row) => {
      const teams = (row?.rr?.order || []).filter(o => !(row.rr.eliminated || []).includes(o.team));
      const i = teams.findIndex(o => o.a === name || o.b === name);
      return i >= 0 ? i + 1 : null;
    },
    // their partner, their legs, their rival team, the Boomerang, the fear, how it ended (rr-story.js)
    story: (name, row) => rrStory(name, row, gs?.episodeHistory || [], gs?.rr?.teams || []),
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
