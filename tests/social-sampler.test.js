// tests/social-sampler.test.js
// Reading the voices.
//
// A data file with no consumer is dead code, and this repo has shipped that three
// times in a week. The sampler is how the library gets judged: feed it an event,
// read fifty posts, and see whether the fandom sounds like a fandom.
import { describe, expect, it } from 'vitest';
import { samplePosts, composePost, renderSample } from '../js/social/sampler.js';
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

describe('reading it', () => {
  it('renders a sample somebody can actually read', () => {
    const text = renderSample(samplePosts(BLINDSIDE, { count: 5, stream: 'timeline', rng: seeded(9) }));
    expect(text.split('\n').length).toBeGreaterThanOrEqual(5);
    expect(text).toContain('@');
  });
});
