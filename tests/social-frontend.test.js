// The rules behind the two social apps.
//
// The page is a renderer; every judgement it draws is made here — what a show
// calls things, who is allowed to hold a microphone, what a finished season's
// records actually say happened. Tested against the REAL databases, because a
// host list that works on a fixture and returns nobody on players_database.json
// is the shape of failure this project keeps shipping.
import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { words, eventLabel, contextLabel, pollQuestions, seasonDataFile } from '../js/social/adapter.js';
import { eligibleHosts, seasonPanel, episodeSpeakers, fameTerm } from '../js/social/hosts.js';
import { buildChatMessages } from '../js/social/chat.js';
import { episodesOf, archiveEpisode, trendsFrom, audiencePulse, crowdFromRankings }
  from '../js/social/archive.js';

const j = p => JSON.parse(readFileSync(join(process.cwd(), p), 'utf8'));
let db, td14, bb1;

beforeAll(() => {
  db = {
    players: j('players_database.json'),
    seasons: j('seasons_database.json'),
    rankings: j('rankings_database.json'),
    voices: j('voice-profiles.json').profiles,
  };
  td14 = j('data/seasons/season14-data.json');
  bb1 = j('data/seasons/bb-1-data.json');
});

describe('what each show calls things', () => {
  it('uses the vocabulary the show actually uses', () => {
    expect(words('big-brother').Episode).toBe('Week');
    expect(words('big-brother').eliminated).toBe('evicted');
    expect(words('total-drama').Episode).toBe('Episode');
    expect(eventLabel('eviction', 'big-brother')).toBe('Eviction');
    expect(eventLabel('eviction', 'total-drama')).toBe('Elimination');
  });

  it('renders a show nobody has written an adapter for, rather than crashing', () => {
    // A future format must degrade to generic labels. A thrown error here is a
    // blank page for a season somebody just published.
    expect(() => words('the-mole')).not.toThrow();
    expect(words('the-mole').Episode).toBe('Episode');
    expect(eventLabel('some-new-kind', 'the-mole')).toBe('Some new kind');
    expect(contextLabel('the-mole', 3, 2)).toBe('SHOW 3 · Episode 2');
  });

  it('only asks poll questions the show can answer', () => {
    // A veto poll in a season with no veto is a fabricated game event wearing a
    // question mark.
    const bbPre = pollQuestions('big-brother', { preseason: true }).map(q => q.id);
    expect(bbPre).not.toContain('veto');
    expect(bbPre).toContain('winner');
    expect(pollQuestions('big-brother').map(q => q.id)).toContain('veto');
    expect(pollQuestions('total-drama').map(q => q.id)).toContain('boot');
  });

  it('points at the filenames the publish path actually writes', () => {
    expect(seasonDataFile('total-drama', 14)).toBe('season14-data.json');
    expect(seasonDataFile('big-brother', 1)).toBe('bb-1-data.json');
  });
});

describe('who gets the microphone', () => {
  it('finds the fifty-plus alumni the room is supposed to hold', () => {
    const hosts = eligibleHosts({ ...db, format: 'total-drama' });
    expect(hosts.length, 'the alumni bench is smaller than the spec requires')
      .toBeGreaterThanOrEqual(50);
  });

  it('never seats somebody who is still playing', () => {
    const cast = (td14.placements || []).map(p => p.playerSlug);
    const hosts = eligibleHosts({ ...db, format: 'total-drama', airingCast: cast });
    for (const h of hosts) {
      expect(cast, `${h.name} is hosting a season they are competing in`).not.toContain(h.slug);
    }
  });

  it('requires a voice, because a host with none has nothing to say', () => {
    const hosts = eligibleHosts({ ...db, voices: {}, format: 'total-drama' });
    expect(hosts).toEqual([]);
  });

  it('ranks by fame rather than by a list somebody maintains', () => {
    const hosts = eligibleHosts({ ...db, format: 'total-drama' });
    const scores = hosts.map(h => h.fameScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(hosts[0].stars).toBeGreaterThan(0);
    expect(fameTerm(5)).toBe('Icon');
    expect(fameTerm(0)).toBe('Alumnus');
  });

  it('marks a host covering a show they have never played', () => {
    // Cross-format hosts stay eligible — a new format opens to an empty green
    // room otherwise — but they are labelled rather than passed off as alumni of
    // a show they have not been on.
    const hosts = eligibleHosts({ ...db, format: 'big-brother' });
    expect(hosts.some(h => !h.native), 'no visiting hosts for a young show').toBe(true);
    for (const h of hosts.filter(x => x.native)) {
      expect(h.shows).toContain('big-brother');
    }
  });

  it('keeps a season panel to a readable size', () => {
    const panel = seasonPanel(eligibleHosts({ ...db, format: 'total-drama' }), { format: 'total-drama' });
    expect(panel.length).toBeLessThanOrEqual(14);
    expect(panel.length).toBeGreaterThanOrEqual(8);
  });

  it('caps the people talking on one night, and picks them for the night', () => {
    const panel = seasonPanel(eligibleHosts({ ...db, format: 'big-brother' }), { format: 'big-brother' });
    const events = archiveEpisode(bb1, 'big-brother', 1, episodesOf(bb1, 'big-brother')[2].episode).events;
    const speakers = episodeSpeakers(panel, events, { players: db.players });
    expect(speakers.length).toBeLessThanOrEqual(7);
    expect(speakers.length).toBeGreaterThanOrEqual(4);
    // Relevance beats raw fame, so the order can differ from the panel's.
    expect(speakers.every(s => Number.isFinite(s.relevance))).toBe(true);
  });
});

describe('the hosted room', () => {
  let messages;
  beforeAll(() => {
    const eps = episodesOf(bb1, 'big-brother');
    const { events } = archiveEpisode(bb1, 'big-brother', 1, eps[3].episode);
    const panel = seasonPanel(eligibleHosts({ ...db, format: 'big-brother' }), { format: 'big-brother' });
    const speakers = episodeSpeakers(panel, events, { players: db.players });
    messages = buildChatMessages(events, speakers, { format: 'big-brother', season: 1, episode: 4, seed: 5 });
  });

  it('is written entirely by hosts', () => {
    // The room's one rule, enforced where the messages are made rather than
    // where they are drawn, so no path exists that puts a fan on the main stage.
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.every(m => m.authorType === 'host')).toBe(true);
  });

  it('has no tomatoes and no ratio', () => {
    // A pile-on belongs on Birdie. This room is people who know each other.
    expect(messages.every(m => m.tomatoes === undefined)).toBe(true);
    expect(messages.every(m => m.replyTo === undefined)).toBe(true);
  });

  it('does not have two hosts say the same sentence', () => {
    // The single most obvious tell that a room is generated. It happened on the
    // first render: two hosts opened with the same line about different people.
    const bodies = messages.map(m => m.text.replace(/[A-Z][a-z]+/g, 'X'));
    for (let i = 1; i < bodies.length; i++) {
      expect(bodies[i], 'a host repeated the previous line').not.toBe(bodies[i - 1]);
    }
  });

  it('shows two comments and the real count', () => {
    for (const m of messages) {
      expect(m.comments.length).toBeLessThanOrEqual(2);
      expect(m.commentCount).toBeGreaterThanOrEqual(m.comments.length);
    }
  });

  it('reads the same on every visit', () => {
    const events = archiveEpisode(bb1, 'big-brother', 1, episodesOf(bb1, 'big-brother')[3].episode).events;
    const panel = seasonPanel(eligibleHosts({ ...db, format: 'big-brother' }), { format: 'big-brother' });
    const speakers = episodeSpeakers(panel, events, { players: db.players });
    const again = buildChatMessages(events, speakers, { format: 'big-brother', season: 1, episode: 4, seed: 5 });
    expect(again.map(m => m.text)).toEqual(messages.map(m => m.text));
  });

  it('says nothing at all rather than inventing a panel', () => {
    expect(buildChatMessages([], [], {})).toEqual([]);
    expect(buildChatMessages([{ kind: 'eviction', at: 0 }], [], {})).toEqual([]);
  });
});

describe('an archive of a finished season', () => {
  it('reads Total Drama out of its voting history', () => {
    // THE BUG THIS CATCHES: a reader that expected `doc.episodes` found nothing
    // in fourteen seasons and produced an empty archive indistinguishable from a
    // working one. Total Drama publishes votingHistory and no episode array.
    const eps = episodesOf(td14, 'total-drama');
    expect(eps.length, 'no episodes found in a published Total Drama season')
      .toBeGreaterThan(5);
    expect(td14.episodes, 'the premise of this test changed').toBe(undefined);
  });

  it('gives every season that recorded its episodes an audience', () => {
    // Seasons 1-5 predate votingHistory and record nothing per episode, so they
    // legitimately have no feed. Every season that DID record its nights must
    // have one — asserted per season so a regression names the season.
    const pop = crowdFromRankings(db.rankings);
    for (let n = 6; n <= 14; n++) {
      const doc = j(`data/seasons/season${n}-data.json`);
      const eps = episodesOf(doc, 'total-drama');
      expect(eps.length, `season ${n} lost its episodes`).toBeGreaterThan(5);
      const { posts } = archiveEpisode(doc, 'total-drama', n, eps[1].episode, { popularity: pop });
      expect(posts.length, `season ${n} produced no feed`).toBeGreaterThan(20);
    }
  });

  it('ignores an episodes array that records prose instead of results', () => {
    // Season 9 ships BOTH: a votingHistory that says who went home, and an
    // `episodes` array whose entries are the prompts its episode writer was
    // given. Preferring the latter because it exists cost that season every
    // eviction, leaving a feed of "episode aired" and nothing else.
    const s9 = j('data/seasons/season9-data.json');
    expect(s9.episodes?.length, 'the premise of this test changed').toBeGreaterThan(0);
    expect(s9.episodes.some(e => e.eliminated), 'season 9 gained structured episodes').toBe(false);

    const eps = episodesOf(s9, 'total-drama');
    const kinds = archiveEpisode(s9, 'total-drama', 9, eps[2].episode).events.map(e => e.kind);
    expect(kinds, 'season 9 read the prose array and lost its eviction').toContain('eviction');
  });

  it('has nothing to say about a season that recorded nothing', () => {
    // Honest silence. These five seasons are published and real; their documents
    // simply do not say what happened in any given episode.
    const s3 = j('data/seasons/season3-data.json');
    expect(episodesOf(s3, 'total-drama')).toEqual([]);
    expect(archiveEpisode(s3, 'total-drama', 3, 1).posts).toEqual([]);
  });

  it('only calls it a blindside when the ballots say so', () => {
    // Every eviction being a blindside would make the loudest reaction the most
    // common one. The rule is strict: everyone but the boot wrote their name,
    // and the boot wrote somebody else.
    let blindsides = 0, evictions = 0;
    for (let n = 1; n <= 14; n++) {
      const doc = j(`data/seasons/season${n}-data.json`);
      for (const e of episodesOf(doc, 'total-drama')) {
        const kinds = archiveEpisode(doc, 'total-drama', n, e.episode).events.map(x => x.kind);
        blindsides += kinds.filter(k => k === 'blindside').length;
        evictions += kinds.filter(k => k === 'eviction').length;
      }
    }
    expect(blindsides, 'no blindside in fourteen seasons').toBeGreaterThan(0);
    expect(blindsides / evictions, 'blindside fires too often to mean anything')
      .toBeLessThan(0.35);
  });

  it('is identical every time it is built', () => {
    // A viewer reloading must not find the audience said different things about
    // a night they already read.
    const a = archiveEpisode(td14, 'total-drama', 14, 4).posts.map(p => p.text);
    const b = archiveEpisode(td14, 'total-drama', 14, 4).posts.map(p => p.text);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('prefers what was actually published over what it can reconstruct', async () => {
    const { episodeFeed } = await import('../js/social/archive.js');
    const stored = [{ id: 'real-1', episode: 4, text: 'from the season as it aired', likes: 5, tomatoes: 0 }];
    const out = episodeFeed({ doc: td14, stored, format: 'total-drama', season: 14, episode: 4 });
    expect(out.source).toBe('published');
    expect(out.posts).toHaveLength(1);
    // and it still knows what happened that night, for the rail
    expect(out.events.length).toBeGreaterThan(0);
  });

  it('summarises the feed it is under, not something else', () => {
    const pop = crowdFromRankings(db.rankings);
    const { posts } = archiveEpisode(td14, 'total-drama', 14, 4, { popularity: pop });
    const trends = trendsFrom(posts);
    const pulse = audiencePulse(posts);
    for (const t of trends) {
      expect(posts.some(p => p.subject === t.subject && p.kind === t.kind)).toBe(true);
    }
    expect(posts.some(p => p.subject === pulse.rising.subject)).toBe(true);
  });

  it('says nothing about a season that does not exist', () => {
    expect(episodesOf(null, 'total-drama')).toEqual([]);
    expect(archiveEpisode(td14, 'total-drama', 14, 999).posts).toEqual([]);
    expect(audiencePulse([]).rising).toBe(null);
  });
});
