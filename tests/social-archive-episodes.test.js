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
import fs from 'node:fs';
import { episodesOf, eventsForEpisode } from '../js/social/archive.js';
import { buildEpisodeFeed } from '../js/social/feed.js';

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

  it('gives a season that recorded NOTHING but a split its one night', () => {
    // Seasons 1 to 5 record no individual episode, so they get the finale and
    // only the finale — and that was gated on `winner`, which is SINGULAR.
    // A season several people won leaves it null, so the one night it was
    // allowed to have was the one night it did not get.
    const doc = { episodeCount: 9, winner: null,
      winners: [{ name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'E' }] };
    const eps = episodesOf(doc, 'total-drama');
    expect(eps.map(e => e.episode)).toEqual([9]);
    expect(eps[0].record.isFinale).toBe(true);
    // ...and it still refuses to name one of the four.
    expect(eps[0].record.winner).toBeFalsy();
    expect(eps[0].record.winners.map(w => w.name)).toEqual(['B', 'C', 'D', 'E']);
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

// ── `subjects[]` is only a fix if something reads it ────────────────────────
//
// A field nothing reads is not a fix. The co-winner work stopped `archive.js`
// inventing a single champion for a split season -- correct -- and moved the
// names onto `subjects[]`, which had NO reader anywhere in the tree. On the
// live season 8 document that turned every finale post that named Alejandro
// into one that named nobody.
//
// This reads the FEED, not the event, because the event was never the thing
// that broke: the posts were. Deleting the `finEv.subjects` assignment in
// `archive.js`, or `subjectLabel`'s `subjects` arm in `sampler.js`, is RED here.
describe('a co-winner finale still names its champions', () => {
  const doc = JSON.parse(fs.readFileSync('data/seasons/season8-data.json', 'utf8'));

  it('carries both names into the posts of the live split season', () => {
    const eps = episodesOf(doc, 'total-drama');
    const last = eps[eps.length - 1];
    const evs = eventsForEpisode(doc, 'total-drama', 8, last.episode);
    const fin = evs.find(e => e.kind === 'finale');
    // Season 8 is the co-winner fixture. If that stops being true this guard
    // is measuring nothing, so say so here rather than pass vacuously.
    expect(fin, 'season 8 lost its finale event').toBeTruthy();
    expect(fin.subject, 'a split season named one of its two champions').toBeFalsy();
    expect((fin.subjects || []).sort()).toEqual(['alejandro', 'cameron']);

    const posts = buildEpisodeFeed(evs, { seed: 8 }).filter(p => p.kind === 'finale');
    expect(posts.length, 'no finale posts to read at all').toBeGreaterThan(10);
    const naming = posts.filter(p => /Alejandro/.test(p.text) && /Cameron/i.test(p.text));
    // Measured at 17 of 27 with the reader in place and 0 of 27 without it.
    expect(naming.length,
      'the finale posts name neither champion — `subjects[]` has lost its reader')
      .toBeGreaterThan(5);
  });

  it('still names the sole champion of an ordinary season', () => {
    // Or the arm above could be satisfied by a sampler that names everybody.
    const solo = JSON.parse(fs.readFileSync('data/seasons/season7-data.json', 'utf8'));
    const eps = episodesOf(solo, 'total-drama');
    const last = eps[eps.length - 1];
    const fin = eventsForEpisode(solo, 'total-drama', 7, last.episode)
      .find(e => e.kind === 'finale');
    expect(String(fin?.subject || '').length).toBeGreaterThan(0);
  });
});
