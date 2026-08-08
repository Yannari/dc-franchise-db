// An episode's worth of feed.
//
// The piece that makes gs.popularity visible for the first time. Everything
// before this could be judged on whether it read well; this is judged on whether
// the audience reacts to the RIGHT people, in the right order, at the right
// volume.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildEpisodeFeed, crowdFromPopularity } from '../js/social/feed.js';
import { extractEvents, EPISODE_MS } from '../js/social/events.js';

const season = JSON.parse(
  readFileSync(join(process.cwd(), 'data/seasons/bb-1-data.json'), 'utf8'));

/** A real week from the season that actually shipped, not a fixture. */
const weekEvents = (i = 0) => extractEvents(season.weeks[i], {
  format: 'big-brother', season: 1, episode: season.weeks[i].week,
});

describe('normalising the crowd', () => {
  it('reads popularity relative to this cast, not an absolute scale', () => {
    // Being the most-liked player in a hated cast still reads as popular. An
    // absolute threshold would call the whole cast unpopular and flatten every
    // reaction in the feed.
    const grumpy = crowdFromPopularity({ ann: -40, bo: -50, cal: -60 });
    expect(grumpy('ann')).toBeCloseTo(1, 5);
    expect(grumpy('cal')).toBeCloseTo(-1, 5);

    const sunny = crowdFromPopularity({ ann: 90, bo: 80, cal: 70 });
    expect(sunny('ann')).toBeCloseTo(1, 5);
    expect(sunny('cal')).toBeCloseTo(-1, 5);
  });

  it('says nothing when there is nothing to compare', () => {
    expect(crowdFromPopularity({ ann: 5 })('ann')).toBe(0);
    expect(crowdFromPopularity({ ann: 5, bo: 5 })('ann')).toBe(0);   // no spread
    expect(crowdFromPopularity(null)('ann')).toBe(0);
    expect(crowdFromPopularity({ ann: 1, bo: 2 })('nobody')).toBe(0);
  });
});

describe('building an episode', () => {
  const events = weekEvents(0);
  const posts = buildEpisodeFeed(events, { seed: 7 });

  it('produces a flood, not a highlights reel', () => {
    // The feeling asked for was messages that keep coming in. A dozen posts an
    // episode reads as a summary of the audience, not an audience.
    expect(posts.length).toBeGreaterThan(50);
  });

  it('uses both rooms', () => {
    const streams = new Set(posts.map(p => p.stream));
    expect(streams.has('timeline')).toBe(true);
    expect(streams.has('chat')).toBe(true);
    // and the public room is the louder of the two, as it is in life
    expect(posts.filter(p => p.stream === 'timeline').length)
      .toBeGreaterThan(posts.filter(p => p.stream === 'chat').length);
  });

  it('stamps every post inside the episode, in order', () => {
    expect(posts.every(p => p.at >= 0 && p.at <= EPISODE_MS)).toBe(true);
    const times = posts.map(p => p.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('gives every post a unique, sortable id', () => {
    const ids = posts.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toMatch(/^p-1-\d+-\d{4}$/);
  });

  it('reacts loudest to the loudest moment', () => {
    // A feed that answers a nomination as fiercely as a blindside reads as
    // machinery. Compare like for like: an eviction week against its own quiet
    // events.
    const byKind = {};
    for (const p of posts) byKind[p.kind] = (byKind[p.kind] || 0) + 1;
    if (byKind.eviction && byKind['alliance-formed']) {
      expect(byKind.eviction).toBeGreaterThan(byKind['alliance-formed']);
    }
    expect(byKind.eviction || byKind['comp-win']).toBeGreaterThan(0);
  });

  it('is reproducible from its seed', () => {
    const again = buildEpisodeFeed(events, { seed: 7 });
    expect(again.map(p => p.id + p.text)).toEqual(posts.map(p => p.id + p.text));
    const different = buildEpisodeFeed(events, { seed: 8 });
    expect(different.map(p => p.text).join()).not.toBe(posts.map(p => p.text).join());
  });

  it('returns nothing for nothing, rather than throwing', () => {
    expect(buildEpisodeFeed([])).toEqual([]);
    expect(buildEpisodeFeed(null)).toEqual([]);
  });
});

describe('replies', () => {
  const posts = buildEpisodeFeed(weekEvents(0), { seed: 3 });
  const replies = posts.filter(p => p.replyTo);

  it('answers earlier posts, so a ratio is legible', () => {
    // A pile-on is visible because forty people answer the SAME post, not
    // because forty posts exist.
    expect(replies.length).toBeGreaterThan(0);
    const byId = new Map(posts.map(p => [p.id, p]));
    for (const r of replies) {
      const parent = byId.get(r.replyTo);
      expect(parent, `${r.id} answers a post that does not exist`).toBeTruthy();
      expect(r.at, 'a reply arrived before what it answers').toBeGreaterThan(parent.at);
      expect(r.subject).toBe(parent.subject);
      expect(r.stream).toBe('timeline');
    }
  });

  it('keeps the hosted room free of ratio culture', () => {
    // ChatBCC is a room, not a stadium: no replies-as-dogpile, no tomatoes.
    const chat = posts.filter(p => p.stream === 'chat');
    expect(chat.length).toBeGreaterThan(0);
    expect(chat.every(p => p.tomatoes === 0)).toBe(true);
  });
});

describe('real popularity reaching the page', () => {
  const events = weekEvents(0);
  const subject = events.find(e => e.subject)?.subject;

  it('turns a hated player into tomatoes and a loved one into likes', () => {
    // THE POINT OF THE WHOLE FEATURE. gs.popularity has been written every
    // episode since this simulator existed and shown to nobody.
    expect(subject).toBeTruthy();
    const others = { someone: 0, another: 5 };

    const loved = buildEpisodeFeed(events, { seed: 11, popularity: { ...others, [subject]: 100 } })
      .filter(p => p.subject === subject);
    const hated = buildEpisodeFeed(events, { seed: 11, popularity: { ...others, [subject]: -100 } })
      .filter(p => p.subject === subject);

    const sum = (xs, k) => xs.reduce((n, p) => n + p[k], 0);
    expect(loved.length).toBeGreaterThan(0);
    expect(sum(hated, 'tomatoes'), 'hating a player produced no tomatoes')
      .toBeGreaterThan(sum(loved, 'tomatoes'));
  });

  it('changes the feed when the audience changes its mind', () => {
    const a = buildEpisodeFeed(events, { seed: 11, popularity: { [subject]: 100, x: 0 } });
    const b = buildEpisodeFeed(events, { seed: 11, popularity: { [subject]: -100, x: 0 } });
    const eng = xs => xs.reduce((n, p) => n + p.likes + p.tomatoes, 0);
    expect(eng(a)).not.toBe(eng(b));
  });
});

describe('a whole real season', () => {
  it('builds a feed for every week that shipped', () => {
    let total = 0;
    for (const [i, w] of season.weeks.entries()) {
      const posts = buildEpisodeFeed(weekEvents(i), { seed: 100 + i });
      expect(posts.length, `week ${w.week} produced no feed`).toBeGreaterThan(20);
      total += posts.length;
    }
    // A season of a live audience, not a highlights reel.
    expect(total).toBeGreaterThan(1000);
  });
});
