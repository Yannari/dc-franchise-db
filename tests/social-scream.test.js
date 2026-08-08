// The register the feed did not have.
//
// Timeline length targets were 70 / 120 / 190 characters, so there was no way
// for the system to produce "GET HIM ANASTASIA" — everything came out as a
// SENTENCE, which is why a feed of individually decent posts read like
// commentary rather than a fandom. A real timeline is mostly short, partisan,
// personal, barely punctuated, and about a person rather than about a game.
//
// It is its own topic rather than short lines inside the existing ones because
// the length preference draws twice and keeps whichever sits closer to how long
// this fan writes: a fifteen-character line in a pool of seventy-character ones
// loses every time. A pool where everything is short cannot lose.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setRelationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { extractEvents } from '../js/social/events.js';
import { episodeRecords, ensureFeeds } from '../js/social/live.js';
import { postsForEpisode } from '../js/social/store.js';
import { samplePosts } from '../js/social/sampler.js';
import { TOPICS } from '../js/social/topics.js';
import { PHRASINGS } from '../js/social/phrasings.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((n * 7 + i * 3) % 10)]));
const NAMES = ['Logan', 'Anastasia', 'Jade', 'Spencer', 'Benji', 'Wayne',
  'Iris', 'Kit', 'Millie', 'Caleb', 'Axel', 'Zee'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

function house(rels = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled' });
  seasonConfig.twistSchedule = [];
  gs.bb = { weeks: [], stats: {} };
  gs.bondLean = {}; gs.sideDeals = [];
  setRelationships(rels.map(r => ({ ...r })));
  globalThis.relationships = relationships;
}

const blindside = () => ({ kind: 'blindside', subject: 'spencer', actor: 'anastasia',
  season: 1, episode: 4, at: 0 });

beforeEach(() => house());

describe('a scream is not a sentence', () => {
  it('is short, and every single line of it is', () => {
    const pools = PHRASINGS.scream;
    expect(pools, 'no scream phrasings').toBeTruthy();
    let lines = 0;
    for (const shape of Object.values(pools)) {
      for (const stream of Object.values(shape)) {
        for (const t of stream) {
          lines++;
          // The whole point. One long line in the pool and the length
          // preference starts reaching for it.
          expect(t.length, `not a scream: "${t}"`).toBeLessThan(45);
        }
      }
    }
    expect(lines).toBeGreaterThan(25);
  });

  it('is a timeline thing — a hosted room does not do this', () => {
    const topic = TOPICS.find(t => t.id === 'scream');
    expect(topic).toBeTruthy();
    expect(topic.stream).toBe('timeline');
    expect(topic.bare).toBe(true);
    for (const shape of Object.values(PHRASINGS.scream)) {
      expect(shape.chat, 'a scream leaked into the hosted room').toBeFalsy();
    }
    const chat = samplePosts(blindside(), { count: 30, stream: 'chat', rng: Math.random });
    expect(chat.every(p => p.topic !== 'scream')).toBe(true);
  });

  it('is not decorated, because that is what makes it a scream', () => {
    // Gluing "hold on." to the front of GET HIM ANASTASIA turns it back into a
    // remark, which is the register the scream exists to escape.
    const posts = samplePosts(blindside(), { count: 60, stream: 'timeline', rng: Math.random })
      .filter(p => p.topic === 'scream');
    expect(posts.length, 'the scream never fired').toBeGreaterThan(3);
    for (const p of posts) {
      expect(p.text, `decorated: ${p.text}`).not.toMatch(/^(hold on|listen|i'm sorry but|nah|wait|okay)\b/i);
      expect(p.text).not.toMatch(/\{|\}|undefined|NaN/);
      // Emoji are allowed — people do that — so measure the words.
      const words = p.text.replace(/[^\w\s'*]/g, '').trim();
      expect(words.length, `too long for a scream: ${p.text}`).toBeLessThan(50);
    }
  });

  it('shouts all of it or none of it', () => {
    // `shout` capitalises a run of one to three words, which is right for a
    // sentence somebody got worked up in the middle of and wrong for four
    // words: it produced "i AM on the FLOOR".
    const posts = samplePosts(blindside(), { count: 120, stream: 'timeline', rng: Math.random })
      .filter(p => p.topic === 'scream');
    for (const p of posts) {
      const words = p.text.replace(/[^\w\s']/g, '').trim().split(/\s+/).filter(Boolean);
      const shouted = words.filter(w => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w));
      const quiet = words.filter(w => w.length > 1 && w === w.toLowerCase() && /[a-z]/.test(w));
      // Names are capitalised, not shouted, so a mixed post is only wrong when
      // whole words are in caps AND whole words are in lower case.
      if (shouted.length && quiet.length) {
        expect(shouted.length, `half-shouted: ${p.text}`).toBeLessThan(2);
      }
    }
  });
});

describe('it names a person, not a move', () => {
  it('puts somebody in most of them', () => {
    const posts = samplePosts(blindside(), { count: 80, stream: 'timeline', rng: Math.random })
      .filter(p => p.topic === 'scream');
    const named = posts.filter(p => /spencer|anastasia/i.test(p.text));
    expect(named.length / posts.length, 'screaming about nobody in particular')
      .toBeGreaterThan(0.4);
  });
});

describe('the loud events carry their history too', () => {
  it('hangs receipts on evictions and blindsides, not just nominations', () => {
    gs.bb.weeks = [{
      num: 1, hoh: 'Anastasia', initialNominees: ['Logan', 'Kit'], finalNominees: ['Logan', 'Kit'],
      ballots: [{ voter: 'Logan', evict: 'Kit' }], evicted: 'Logan', voteChanges: 3,
    }];
    const evs = extractEvents(gs.bb.weeks[0], { format: 'big-brother', season: 1, episode: 2 });
    for (const kind of ['nomination', 'eviction', 'blindside']) {
      const e = evs.find(x => x.kind === kind);
      expect(e, `no ${kind} event`).toBeTruthy();
      expect(Array.isArray(e.receipts), `${kind} carries no receipts`).toBe(true);
    }
    // An eviction now names the Head of Household, without which it cannot draw
    // a single phrasing that mentions two people.
    expect(evs.find(x => x.kind === 'eviction').actor).toBe('anastasia');
  });
});

describe('a whole season reads like a fandom', () => {
  it('is mostly people, and a minority of it is analysis', () => {
    house([
      { id: 'r1', a: 'Logan', b: 'Jade', type: 'ally', bond: 6, kin: 'old-friends' },
      { id: 'r2', a: 'Spencer', b: 'Benji', type: 'rival', bond: -4, kin: 'exes', leanA: 8 },
    ]);
    for (let w = 0; w < 6; w++) if (!simulateBBEpisode()) break;
    ensureFeeds(gs, { format: 'big-brother', season: 1 });

    const timeline = episodeRecords(gs, 'big-brother')
      .flatMap(r => postsForEpisode(gs, r.episode))
      .filter(p => p.stream === 'timeline');
    expect(timeline.length).toBeGreaterThan(100);

    const screams = timeline.filter(p => p.topic === 'scream');
    const share = screams.length / timeline.length;
    // Enough to change the texture of the feed, not so much that it is noise.
    expect(share, `screams are ${Math.round(share * 100)}% of the timeline`).toBeGreaterThan(0.05);
    expect(share, `screams are ${Math.round(share * 100)}% of the timeline`).toBeLessThan(0.4);
    // And they are actually short in practice, not just in the pool.
    const avg = screams.reduce((s, p) => s + p.text.length, 0) / screams.length;
    expect(avg).toBeLessThan(45);
    for (const p of timeline) expect(p.text).not.toMatch(/\{\w+\}|undefined/);
  }, 200000);
});
