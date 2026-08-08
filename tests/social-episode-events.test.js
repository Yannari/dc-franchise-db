// The alumni room went empty on an episode whose timeline was full.
//
// ChatAlumni is not built from posts. It is built from EVENTS — the moments of
// the night — and `buildChatMessages` returns nothing at all when handed an
// empty list. So an episode could have four hundred posts and no room.
//
// Two faults, both in `episodeFeed`'s published branch:
//
//   IT BUILT ITS OWN, SHORTER EVENT LIST. `extractEvents` and nothing else —
//   no tribal council, no finale — where the archive path also runs
//   `tribalEvents` and names the winner. So the same night had FEWER moments
//   once it had stored posts than it did before, which is backwards.
//
//   AND IT GAVE UP ENTIRELY when the document could not account for the night:
//   a season played but not published, a document that failed to load, a feed
//   synced ahead of the record. Posts present, events empty, room gone.
import { describe, expect, it } from 'vitest';
import { archiveEpisode, episodeFeed, eventsForEpisode, eventsFromPosts }
  from '../js/social/archive.js';
import { extractEvents } from '../js/social/events.js';
import { buildChatMessages } from '../js/social/chat.js';

/** A Total Drama season document with a real tribal council on episode 3. */
const doc = () => ({
  seasonNumber: 14,
  episodeCount: 4,
  winner: { name: 'Anastasia' },
  // Ballots the way `tribalEvents` reads them — `target`, not `vote`. Three
  // against Jade and Jade's own vote elsewhere is a blindside by its rules, and
  // Logan taking a vote and staying is a nomination.
  votingHistory: [
    {
      episode: 3, eliminated: 'Jade', immunityWinner: 'Benji',
      votes: [
        { voter: 'Logan', target: 'Jade' },
        { voter: 'Benji', target: 'Jade' },
        { voter: 'Anastasia', target: 'Jade' },
        { voter: 'Jade', target: 'Logan' },
      ],
    },
  ],
});

const hosts = () => [
  { slug: 'nadia', name: 'Nadia', expertise: ['strategy'], influence: 900, fameScore: 900 },
  { slug: 'omar', name: 'Omar', expertise: ['social'], influence: 800, fameScore: 800 },
  { slug: 'rue', name: 'Rue', expertise: ['comps'], influence: 700, fameScore: 700 },
  { slug: 'sol', name: 'Sol', expertise: ['edit'], influence: 600, fameScore: 600 },
];

const chatFor = feed => buildChatMessages(feed.events, hosts(), {
  format: 'total-drama', season: 14, episode: 3, seed: 5,
});

describe('a published episode keeps the moments it had', () => {
  it('gives the same events with stored posts as without them', () => {
    const d = doc();
    const before = archiveEpisode(d, 'total-drama', 14, 3);
    const after = episodeFeed({
      doc: d, stored: before.posts, format: 'total-drama', season: 14, episode: 3,
    });
    expect(after.source).toBe('published');
    // The posts are the stored ones, untouched — that part was always right.
    expect(after.posts).toEqual(before.posts);
    // The moments must not shrink just because somebody saved the reactions.
    expect(after.events.map(e => `${e.kind}:${e.subject}`))
      .toEqual(before.events.map(e => `${e.kind}:${e.subject}`));
  });

  it('keeps the tribal council, which the short list dropped', () => {
    const kinds = eventsForEpisode(doc(), 'total-drama', 14, 3).map(e => e.kind);
    // `extractEvents` alone gives `episode-aired`, the comp win and the boot.
    // `tribalEvents` is what reads the BALLOT, and it is the only way a Total
    // Drama night gets a second name in it — so losing it does not just thin
    // the room, it narrows the whole night down to one person.
    expect(kinds).toContain('blindside');
    expect(kinds).toContain('nomination');
    const bare = extractEvents(doc().votingHistory[0],
      { format: 'total-drama', season: 14, episode: 3 }).map(e => e.kind);
    expect(bare, 'the short list already had these, so this proves nothing')
      .not.toContain('blindside');
    expect(kinds.length).toBeGreaterThan(bare.length);
  });

  it('still fills the room', () => {
    const d = doc();
    const stored = archiveEpisode(d, 'total-drama', 14, 3).posts;
    const feed = episodeFeed({
      doc: d, stored, format: 'total-drama', season: 14, episode: 3,
    });
    expect(chatFor(feed).length).toBeGreaterThan(0);
  });
});

describe('posts without a document still have a room', () => {
  // The reported symptom: episode 3 rebuilt, timeline full, ChatAlumni empty.
  const stored = [
    { episode: 3, kind: 'eviction', subject: 'jade', at: 1000, text: 'not jade' },
    { episode: 3, kind: 'eviction', subject: 'jade', at: 2000, text: 'im heartbroken' },
    { episode: 3, kind: 'blindside', subject: 'jade', at: 3000, text: 'GET HIM ANASTASIA' },
    { episode: 3, kind: 'episode-aired', subject: null, at: 100, text: 'here we go' },
  ];

  it('reads the night back off the posts about it', () => {
    const events = eventsFromPosts(stored, { format: 'total-drama', season: 14, episode: 3 });
    expect(events.map(e => e.kind).sort())
      .toEqual(['blindside', 'episode-aired', 'eviction']);
    expect(events.find(e => e.kind === 'eviction').subject).toBe('jade');
  });

  it('says each moment once, however many people reacted to it', () => {
    // Two posts about the same eviction are two reactions, not two evictions.
    const events = eventsFromPosts(stored, { format: 'total-drama', season: 14, episode: 3 });
    expect(events.filter(e => e.kind === 'eviction')).toHaveLength(1);
  });

  it('puts them in episode order, not in post order', () => {
    // A reaction is always later than the thing it answers, so reading the
    // clock off the posts pushes every moment a few minutes past itself.
    const events = eventsFromPosts(stored, { format: 'total-drama', season: 14, episode: 3 });
    const aired = events.find(e => e.kind === 'episode-aired');
    const evict = events.find(e => e.kind === 'eviction');
    expect(aired.at).toBeLessThan(evict.at);
    expect([...events].sort((a, b) => a.at - b.at)).toEqual(events);
  });

  it('gives the room something to talk about', () => {
    const feed = episodeFeed({
      doc: null, stored, format: 'total-drama', season: 14, episode: 3,
    });
    expect(feed.posts).toHaveLength(4);
    expect(feed.events.length, 'the timeline is full and the room is empty')
      .toBeGreaterThan(0);
    expect(chatFor(feed).length).toBeGreaterThan(0);
  });

  it('does not invent a night out of nothing', () => {
    // No posts is no episode. The fallback recovers what the reactions prove
    // happened; it must not manufacture a moment when there are none.
    expect(eventsFromPosts([], { format: 'total-drama', season: 14, episode: 3 })).toEqual([]);
    expect(eventsFromPosts([{ episode: 3, text: 'no kind' }],
      { format: 'total-drama', season: 14, episode: 3 })).toEqual([]);
  });
});
