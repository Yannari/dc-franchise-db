// Which nights a finished season is considered to have had.
//
// The archive feed is built in the browser from a published season document, so
// this list IS the episode selector on the social page. Both sources it can read
// are PARTIAL:
//
//   votingHistory  one entry per tribal council — a reward night, a
//                  non-elimination week or an episode whose record never
//                  carried a boot is simply not in it
//   episodes       only trustworthy where it says what HAPPENED; season 9
//                  publishes one whose entries are the prose prompts the
//                  episode writer was given
//
// Reading either one as THE list left holes in a numbered selector, which reads
// as the feature failing rather than as a source that only ever recorded votes.
import { describe, expect, it } from 'vitest';
import { episodesOf } from '../js/social/archive.js';

const votes = eps => eps.map(e => ({ episode: e, eliminated: `boot${e}`,
  votes: [{ voter: 'a', target: `boot${e}` }, { voter: 'b', target: `boot${e}` }] }));

describe('every night the season aired', () => {
  it('fills the gaps between tribal councils', () => {
    // Episodes 3, 4, 6 and 7 had no vote. They still happened.
    const doc = { episodeCount: 8, votingHistory: votes([1, 2, 5, 8]) };
    const eps = episodesOf(doc, 'total-drama');
    expect(eps.map(e => e.episode)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // The ones that had a vote keep everything the vote recorded.
    expect(eps.find(e => e.episode === 5).record.eliminated).toBe('boot5');
    // The ones that did not still carry their number, which is all
    // `extractEvents` needs to emit `episode-aired`.
    expect(eps.find(e => e.episode === 4).record.episode).toBe(4);
  });

  it('merges what the two sources each know', () => {
    const doc = {
      episodeCount: 6,
      votingHistory: [{ episode: 2, eliminated: 'kit' }],
      episodes: [{ episode: 4, immunityWinner: 'gus' }, { episode: 5, note: 'prose only' }],
    };
    const eps = episodesOf(doc, 'total-drama');
    expect(eps.map(e => e.episode)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(eps[1].record.eliminated).toBe('kit');
    expect(eps[3].record.immunityWinner).toBe('gus');
    // A prose-only entry is not thrown away, it is just not treated as a boot.
    expect(eps[4].record.note).toBe('prose only');
    // And the scratch flag never leaks into a record the writer will read.
    for (const e of eps) expect(e.record).not.toHaveProperty('_useful');
  });

  it('prefers the record that says something', () => {
    const doc = {
      episodeCount: 3,
      episodes: [{ episode: 2, note: 'prose only' }],
      votingHistory: [{ episode: 2, eliminated: 'kit' }],
    };
    const eps = episodesOf(doc, 'total-drama');
    expect(eps[1].record.eliminated).toBe('kit');
  });

  it('runs to the count even when nothing late was recorded', () => {
    // Season 14: twenty-six episodes, last vote at twenty-four.
    const doc = { episodeCount: 26, winner: 'Bowie', votingHistory: votes([20, 22, 24]) };
    const eps = episodesOf(doc, 'total-drama');
    expect(eps.length).toBe(26);
    expect(eps[eps.length - 1].episode).toBe(26);
  });

  it('does not lose an episode numbered past the published count', () => {
    const doc = { episodeCount: 4, votingHistory: votes([1, 6]) };
    expect(episodesOf(doc, 'total-drama').map(e => e.episode))
      .toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('the finale', () => {
  it('is the last night, and is marked as one', () => {
    // A Total Drama finale is decided by a challenge or a jury rather than a
    // ballot, so it is never the last thing in votingHistory.
    const doc = { episodeCount: 26, winner: 'Bowie', votingHistory: votes([22, 24]) };
    const eps = episodesOf(doc, 'total-drama');
    const last = eps[eps.length - 1];
    expect(last.episode).toBe(26);
    expect(last.record.isFinale).toBe(true);
    expect(last.record.winner).toBe('Bowie');
    // And it is not duplicated — the finale used to be pushed as an extra entry.
    expect(eps.filter(e => e.episode === 26).length).toBe(1);
  });

  it('marks nothing when the season never named a winner', () => {
    const doc = { episodeCount: 5, votingHistory: votes([2, 4]) };
    expect(episodesOf(doc, 'total-drama').some(e => e.record.isFinale)).toBeFalsy();
  });

  it('does not overwrite a winner the record already carried', () => {
    const doc = { episodeCount: 3, winner: 'Bowie',
      episodes: [{ episode: 3, immunityWinner: 'Kit', winner: 'Kit' }] };
    expect(episodesOf(doc, 'total-drama')[2].record.winner).toBe('Kit');
  });
});

describe('the other show is untouched', () => {
  it('reads Big Brother weeks exactly as before', () => {
    const doc = { weeks: [{ week: 1, hoh: 'a' }, { week: 2, hoh: 'b' }] };
    const eps = episodesOf(doc, 'big-brother');
    expect(eps.map(e => e.episode)).toEqual([1, 2]);
    expect(eps[0].record.hoh).toBe('a');
  });

  it('says nothing about a season it was handed nothing for', () => {
    expect(episodesOf(null, 'total-drama')).toEqual([]);
    expect(episodesOf({}, 'total-drama')).toEqual([]);
  });
});
