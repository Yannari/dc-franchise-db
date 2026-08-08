// Posts that talk about things that did not happen.
//
// THE ONE THAT PROVED THIS NECESSARY, spotted while reading a real feed:
//
//     "that is the widest final vote this franchise has had in a while"
//
// under Total Drama 14, whose own document reads
// `finalTribalCouncil: { votes: [], note: "No jury — winner decided by the final
// challenge." }`. Nobody voted. The line is not badly written — it is about an
// event that did not happen, which is worse, because it reads perfectly.
//
// The sampler cannot catch it: it is handed a kind and a subject, not the shape
// of the night. So the event carries HOW the season was decided, and the feed
// refuses posts that contradict it.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { archiveEpisode, crowdFromRankings } from '../js/social/archive.js';
import { contradictsEvent } from '../js/social/feed.js';

const j = p => JSON.parse(readFileSync(join(process.cwd(), p), 'utf8'));

describe('how a season was decided', () => {
  it('reads a challenge finale as one', () => {
    const d = j('data/seasons/season14-data.json');
    expect(d.finalTribalCouncil.votes, 'the premise of this test changed').toEqual([]);
    const ev = archiveEpisode(d, 'total-drama', 14, d.episodeCount)
      .events.find(e => e.kind === 'finale');
    expect(ev.decidedBy).toBe('challenge');
    expect(ev.note).toMatch(/final challenge/i);
  });

  it('reads a jury vote as one, however the tally is written', () => {
    // Big Brother 1 records it as "Wayne 4 — Priya 3 — Zee 0". A pattern
    // expecting "4-3" read that as a challenge finish — the same class of
    // mistake, inside the code meant to catch it.
    const d = j('data/seasons/bb-1-data.json');
    const ev = archiveEpisode(d, 'big-brother', 1, d.episodeCount)
      .events.find(e => e.kind === 'finale');
    expect(ev.decidedBy).toBe('jury');
    expect(ev.tally).toMatch(/\d/);
  });
});

describe('the guard', () => {
  const challenge = { kind: 'finale', decidedBy: 'challenge' };
  const jury = { kind: 'finale', decidedBy: 'jury' };

  it('rejects vote talk on a challenge finale', () => {
    expect(contradictsEvent('that is the widest final vote this franchise has had in a while', challenge)).toBe(true);
    expect(contradictsEvent('the jury voted with their feelings again', challenge)).toBe(true);
  });

  it('rejects challenge talk on a jury finale', () => {
    expect(contradictsEvent('won it in the final challenge, deservedly', jury)).toBe(true);
  });

  it('leaves everything else alone', () => {
    // Narrow on purpose. "Nobody ever wrote his name down" is about the season,
    // not the last night, and is true on a challenge finale.
    expect(contradictsEvent('nobody ever wrote his name down all season', challenge)).toBe(false);
    expect(contradictsEvent('she deserved this and i will not be taking questions', challenge)).toBe(false);
    // and an event with no recorded method is not second-guessed
    expect(contradictsEvent('the final vote was brutal', { kind: 'finale' })).toBe(false);
    expect(contradictsEvent('the final vote was brutal', { kind: 'eviction', decidedBy: 'challenge' })).toBe(false);
  });
});

describe('a real season, end to end', () => {
  it('no longer posts about a vote that never happened', () => {
    const pop = crowdFromRankings(j('rankings_database.json'));
    const d = j('data/seasons/season14-data.json');
    const { posts } = archiveEpisode(d, 'total-drama', 14, d.episodeCount, { popularity: pop });
    expect(posts.length, 'the finale produced no feed at all').toBeGreaterThan(40);
    const claiming = posts.filter(p => /final vote|jury vote/i.test(p.text));
    expect(claiming.map(p => p.text), 'still claiming a vote nobody cast').toEqual([]);
  });

  it('still has plenty to say about that finale', () => {
    // The guard must not be a mute button. Dropping every finale post would
    // "pass" this file and gut the feature.
    const d = j('data/seasons/season14-data.json');
    const { posts } = archiveEpisode(d, 'total-drama', 14, d.episodeCount);
    expect(posts.filter(p => p.kind === 'finale').length).toBeGreaterThan(15);
  });
});
