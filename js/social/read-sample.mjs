// js/social/read-sample.mjs
// Read the feed.
//
//   node js/social/read-sample.mjs [count] [seed]
//
// The premise of this library is that the output has to be READABLE — the two
// register leaks found in review were found by a human reading posts, not by an
// assertion. That read was unrepeatable by anybody else until this file existed.
// No build step, no test runner, no imports outside this folder.
//
// Prints `count` posts from each room for one sample event, side by side in
// sequence, so the timeline and the hosted chat can be compared directly. If the
// chat slice reads like the timeline slice, the library has failed and you can
// see it in about ten seconds.

import { samplePosts, renderSample } from './sampler.js';

/** Deterministic, so "the third post is wrong" means something to the next person. */
function seeded(seed = 7) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const count = Number(process.argv[2]) || 12;
const seed = Number(process.argv[3]) || 7;

/**
 * Two events, not one. A single event only exercises the topics it triggers, and
 * the register leaks live in the topics you did not think to look at.
 */
const EVENTS = [
  { label: 'a blindside',
    event: { kind: 'blindside', subject: 'heather', actor: 'alejandro',
      season: 15, episode: 7, format: 'total-drama' } },
  { label: 'a showmance forming',
    event: { kind: 'showmance-formed', subject: 'gwen', actor: 'duncan',
      season: 15, episode: 4, format: 'total-drama' } },
];

const rule = label => `\n${'─'.repeat(76)}\n${label}\n${'─'.repeat(76)}\n`;

for (const { label, event } of EVENTS) {
  console.log(rule(`${label.toUpperCase()} — season ${event.season}, episode ${event.episode}`));
  for (const stream of ['timeline', 'chat']) {
    const posts = samplePosts(event, { count, stream, rng: seeded(seed) });
    console.log(`\n### ${stream === 'chat' ? 'THE GROUP CHAT (hosted)' : 'THE TIMELINE (public)'} — ${posts.length} posts\n`);
    console.log(posts.length ? renderSample(posts) : '  (no topic fires on this event in this room)');
    console.log('');
  }
}
