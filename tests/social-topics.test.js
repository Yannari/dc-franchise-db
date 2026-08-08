// tests/social-topics.test.js
// What a fandom actually talks about.
//
// A feed that only discusses strategy is a podcast. The taxonomy here is taken
// from observed discourse: fans defended Taylor Hale against her EDIT in Big
// Brother 24, and raised alarm over a Big Brother 27 showmance that read as
// love-bombing rather than romance — so "showmance concern" is its own topic,
// distinct from "showmance hate". Neither would have been invented from a chair.
import { describe, expect, it } from 'vitest';
import { TOPICS, EVENT_KINDS, topicsFor } from '../js/social/topics.js';
import { PHRASINGS } from '../js/social/phrasings.js';

describe('the taxonomy', () => {
  it('covers social ground, not just gameplay', () => {
    const ids = TOPICS.map(t => t.id);
    for (const needed of [
      'strategy-critique', 'steamroll-fatigue', 'blindside-reaction',
      'harassment-defence', 'edit-critique', 'kindness-noticed',
      'shipping', 'thirst', 'showmance-hate', 'showmance-concern',
      'love-them-hate-their-game', 'hate-them-rate-their-game',
      'production-critique', 'pile-on', 'fandom-infighting',
    ]) {
      expect(ids, `the taxonomy is missing ${needed}`).toContain(needed);
    }
  });

  it('describes every topic completely', () => {
    for (const t of TOPICS) {
      expect(typeof t.id).toBe('string');
      expect(['timeline', 'chat', 'both'], `${t.id} posts nowhere real`).toContain(t.stream);
      expect(t.reads.length, `${t.id} reads no simulator data`).toBeGreaterThan(0);
      expect(t.shapes.length, `${t.id} has no post shapes`).toBeGreaterThan(0);
      for (const kind of t.triggers) {
        expect(EVENT_KINDS, `${t.id} triggers on unknown event "${kind}"`).toContain(kind);
      }
    }
  });

  it('gives every topic a way to fire', () => {
    // A topic with no trigger reads as breadth in the file and appears nowhere on
    // screen. This repo has shipped that three times: an export path with no
    // caller, a viewer announcement that never fired, a STEAL_LIMIT that lived
    // only in comments.
    for (const t of TOPICS) {
      expect(t.triggers.length, `${t.id} can never fire`).toBeGreaterThan(0);
    }
  });

  it('gives every topic words to say, in every room it claims', () => {
    // `triggers.length > 0` above says a topic COULD fire. It does not say the
    // topic can produce a post, and those are different claims: the shapes a
    // topic declares are looked up in PHRASINGS, per stream, and a missing pool
    // is not an error the composer can see coming.
    //
    // The failure this catches is quiet and specific. A topic declaring
    // `stream: 'both'` with only timeline phrasings falls through poolFor's
    // `byStream[stream] || byStream.timeline` and posts lowercase stadium
    // fragments into the hosted alumni room — right register, wrong room,
    // nothing thrown, nothing red. No topic does that today, which is luck
    // rather than a guard, and Codex is about to add topics.
    const gaps = [];
    for (const t of TOPICS) {
      const streams = t.stream === 'both' ? ['timeline', 'chat'] : [t.stream];
      for (const stream of streams) {
        for (const shape of t.shapes) {
          const pool = ((PHRASINGS[t.id] || {})[shape] || {})[stream];
          if (!Array.isArray(pool) || pool.length === 0) {
            gaps.push(`${t.id}/${shape} has no ${stream} phrasings`);
          }
        }
      }
    }
    expect(gaps, 'a topic would post in the wrong register, or not at all').toEqual([]);
  });

  it('gives every event kind at least one topic', () => {
    // The other direction: an event nothing reacts to is silence where the feed
    // should be loudest.
    for (const kind of EVENT_KINDS) {
      expect(TOPICS.some(t => t.triggers.includes(kind)),
        `nothing reacts to a "${kind}" event`).toBe(true);
    }
  });

  it('finds the topics for an event, filtered by stream', () => {
    const timeline = topicsFor('blindside', 'timeline');
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline.every(t => t.stream === 'timeline' || t.stream === 'both')).toBe(true);

    const chat = topicsFor('blindside', 'chat');
    expect(chat.every(t => t.stream === 'chat' || t.stream === 'both')).toBe(true);

    expect(topicsFor('not-an-event', 'timeline')).toEqual([]);
  });
});
