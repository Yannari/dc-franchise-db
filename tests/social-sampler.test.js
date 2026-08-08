// tests/social-sampler.test.js
// Reading the voices.
//
// A data file with no consumer is dead code, and this repo has shipped that three
// times in a week. The sampler is how the library gets judged: feed it an event,
// read fifty posts, and see whether the fandom sounds like a fandom.
import { describe, expect, it } from 'vitest';
import { samplePosts, composePost, renderSample } from '../js/social/sampler.js';
import { PHRASINGS } from '../js/social/phrasings.js';
import { PERSONAS } from '../js/social/personas.js';
import { TOPICS } from '../js/social/topics.js';
import { PLATFORMS } from '../js/social/platforms.js';

/** Deterministic rng, so a failure is reproducible rather than a mood. */
function seeded(seed = 7) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const BLINDSIDE = {
  kind: 'blindside', subject: 'heather', actor: 'alejandro',
  season: 15, episode: 7, format: 'total-drama',
};

describe('composing one post', () => {
  it('produces something a person could have typed', () => {
    const post = composePost({
      persona: PERSONAS[0],
      topic: TOPICS.find(t => t.id === 'blindside-reaction'),
      platform: PLATFORMS.timeline,
      event: BLINDSIDE,
      rng: seeded(1),
    });
    expect(post.handle).toBe(PERSONAS[0].handle);
    expect(post.text.length).toBeGreaterThan(0);
    expect(post.text.length).toBeLessThanOrEqual(PLATFORMS.timeline.maxLength);
    expect(post.topic).toBe('blindside-reaction');
  });

  it('never leaves an unfilled slot in the output', () => {
    // A template that leaks {subject} is worse than no post: it tells the reader
    // this is generated.
    for (let i = 0; i < 60; i++) {
      const posts = samplePosts(BLINDSIDE, { count: 5, stream: 'timeline', rng: seeded(i) });
      for (const p of posts) {
        expect(p.text, 'a template slot leaked into the output').not.toMatch(/[{}]/);
        expect(p.text).not.toMatch(/undefined|NaN|null/);
      }
    }
  });

  it('never leaves an unfilled slot in the hosted room either', () => {
    // The chat was the untested room, which is exactly where a fault hides.
    for (let i = 0; i < 60; i++) {
      for (const p of samplePosts(BLINDSIDE, { count: 5, stream: 'chat', rng: seeded(i) })) {
        expect(p.text, 'a template slot leaked into the chat').not.toMatch(/[{}]/);
        expect(p.text).not.toMatch(/undefined|NaN|null/);
      }
    }
  });

  it('refuses a phrasing whose slot it does not recognise', () => {
    // Blanking an unknown slot closes the seam invisibly: "{subjcet} was robbed"
    // renders as "was robbed", which is grammatical, plausible and wrong, and
    // the leaked-slot test above cannot see it. A typo in a thousand-line
    // phrasing library has to fail at the first sample instead.
    const bogus = {
      id: 'bogus-topic', stream: 'timeline', weight: 1,
      triggers: ['blindside'], reads: [], shapes: ['dunk'],
    };
    PHRASINGS['bogus-topic'] = { dunk: { timeline: ['{subjcet} was robbed'] } };
    try {
      expect(() => composePost({
        persona: PERSONAS[0], topic: bogus, platform: PLATFORMS.timeline,
        event: BLINDSIDE, rng: seeded(1),
      })).toThrow(/unknown slot/);
    } finally {
      delete PHRASINGS['bogus-topic'];
    }
  });
});

describe('the feed sounds like a crowd', () => {
  const posts = samplePosts(BLINDSIDE, { count: 50, stream: 'timeline', rng: seeded(3) });

  it('does not repeat itself', () => {
    const unique = new Set(posts.map(p => p.text));
    expect(unique.size / posts.length,
      'the same post keeps coming back').toBeGreaterThan(0.8);
  });

  it('is more than one kind of person', () => {
    const archetypes = new Set(posts.map(p =>
      PERSONAS.find(x => x.handle === p.handle)?.archetype));
    expect(archetypes.size, 'the whole crowd is one archetype').toBeGreaterThanOrEqual(3);
  });

  it('talks about more than one thing', () => {
    expect(new Set(posts.map(p => p.topic)).size,
      'fifty posts and one topic').toBeGreaterThanOrEqual(3);
  });

  it('does not repeat itself in the hosted room either', () => {
    // The chat was held to no variety bar at all, so it quietly sat below the
    // one the timeline passes. A thin room is still a room people read.
    const chat = samplePosts(BLINDSIDE, { count: 50, stream: 'chat', rng: seeded(3) });
    expect(new Set(chat.map(p => p.text)).size / chat.length,
      'the chat keeps saying the same thing').toBeGreaterThan(0.8);
  });

  it('holds its variety across many seeds, in both rooms', () => {
    // One passing seed is a coincidence. The bar has to hold on the worst one.
    for (const stream of ['timeline', 'chat']) {
      let worst = 1;
      for (let s = 0; s < 60; s++) {
        const ps = samplePosts(BLINDSIDE, { count: 50, stream, rng: seeded(s) });
        worst = Math.min(worst, new Set(ps.map(p => p.text)).size / ps.length);
      }
      expect(worst, `${stream} repeats itself on its worst seed`).toBeGreaterThan(0.8);
    }
  });
});

describe('the two rooms sound different', () => {
  it('is measurably not the same voice', () => {
    // If a chat post reads like a timeline post, having two platforms bought
    // nothing.
    const timeline = samplePosts(BLINDSIDE, { count: 30, stream: 'timeline', rng: seeded(5) });
    const chat = samplePosts(BLINDSIDE, { count: 30, stream: 'chat', rng: seeded(5) });
    const avg = xs => xs.reduce((n, p) => n + p.text.length, 0) / xs.length;
    expect(avg(chat), 'the chat is not more considered than the timeline')
      .toBeGreaterThan(avg(timeline));
    // Ratios are a timeline phenomenon; the chat has no tomatoes at all.
    expect(chat.every(p => p.tomatoes === 0)).toBe(true);
    expect(timeline.some(p => p.tomatoes > 0)).toBe(true);
  });
});

describe('both feelings axes reach the page', () => {
  it('can love somebody and hate their game, and the reverse', () => {
    // If neither shape ever appears, the two-axis model is costing complexity and
    // buying nothing.
    const ids = new Set();
    for (let s = 0; s < 40; s++) {
      for (const p of samplePosts(BLINDSIDE, { count: 20, stream: 'timeline', rng: seeded(s) })) {
        ids.add(p.topic);
      }
    }
    expect(ids, 'nobody ever loves a player and hates their game')
      .toContain('love-them-hate-their-game');
    expect(ids, 'nobody ever hates a player and rates their game')
      .toContain('hate-them-rate-their-game');
  });
});

describe('engagement is only as deep as the feelings behind it', () => {
  // THIS TEST PINS A LIMITATION, NOT A FEATURE. It asserts what is TRUE TODAY so
  // that the gap is visible in the suite instead of hiding behind a green tick.
  //
  // `crowdAffection` averages the personas who already hold a feeling about the
  // player a post is aimed at. The cast between them holds feelings about exactly
  // seven slugs (heather, alejandro, beth, scott, gwen, duncan, courtney). For
  // every other player in a 152-strong roster the crowd reads 0, so `agreement`
  // is 0, so tomatoes are always 0 and likes carry no signal about how the
  // audience feels — engagement flattens completely.
  //
  // The existing fixture uses heather/alejandro, which is why nothing noticed.
  //
  // PROJECT 2 FIXES THIS by swapping `crowdAffection` for the real
  // `gs.popularity`, which the simulator has been writing every episode since it
  // shipped and showing to nobody. That is the entire premise of the feature.
  // When that lands, this test SHOULD fail and should be rewritten to assert that
  // an unopinionated player still draws real engagement.

  // A real roster slug (players_database.json) that no persona has a feeling
  // about. If a future persona adopts Bridgette, the second assertion here fails
  // loudly rather than drifting — pick another unopinionated slug then.
  const UNOPINIONED = 'bridgette';

  const UNKNOWN_PLAYER = {
    kind: 'blindside', subject: UNOPINIONED, actor: 'owen',
    season: 15, episode: 7, format: 'total-drama',
  };

  it('nobody in the cast holds a feeling about the slug this test relies on', () => {
    const opinions = PERSONAS.filter(p => (p.feelings || {})[UNOPINIONED]);
    expect(opinions.map(p => p.handle),
      `a persona now has feelings about ${UNOPINIONED}; this test needs a different slug`)
      .toEqual([]);
  });

  it('flattens engagement for a player the crowd has no opinion about', () => {
    const posts = samplePosts(UNKNOWN_PLAYER, { count: 60, stream: 'timeline', rng: seeded(4) });
    expect(posts.length).toBeGreaterThan(0);

    // No crowd feeling means no disagreement to be ratioed over. Not one tomato
    // in sixty posts, including outright dunks that ought to be divisive.
    expect(posts.every(p => p.tomatoes === 0),
      'engagement is no longer inert — has project 2 landed? rewrite this test')
      .toBe(true);

    // And the same slate about heather, whom the crowd DOES hold opinions about,
    // does produce them. Same event kind, same room, same seed: the only
    // difference is whether anybody has a feeling on file.
    const known = samplePosts({ ...UNKNOWN_PLAYER, subject: 'heather', actor: 'alejandro' },
      { count: 60, stream: 'timeline', rng: seeded(4) });
    expect(known.some(p => p.tomatoes > 0),
      'the opinionated fixture stopped producing ratios too — something else broke')
      .toBe(true);
  });
});

describe('reading it', () => {
  it('renders a sample somebody can actually read', () => {
    const text = renderSample(samplePosts(BLINDSIDE, { count: 5, stream: 'timeline', rng: seeded(9) }));
    expect(text.split('\n').length).toBeGreaterThanOrEqual(5);
    expect(text).toContain('@');
  });
});
