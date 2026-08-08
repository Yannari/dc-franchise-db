// Reading a real episode into the vocabulary the feed speaks.
//
// Until this existed, the sampler ate hand-written fixtures — events I invented
// to exercise it. That is exactly the shape of dead feature this repo keeps
// shipping: a library that works perfectly against input nothing produces.
//
// So these tests use the REAL field names the simulator writes (`voteChanges`,
// `initialNominees`, `campEvents` keyed by camp with pre/post arrays), because
// an extractor tested against invented shapes would pass and then read nothing.
import { describe, expect, it } from 'vitest';
import { extractEvents, EPISODE_MS } from '../js/social/events.js';
import { EVENT_KINDS } from '../js/social/topics.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const bbWeek = (over = {}) => ({
  week: 3, hoh: 'Wayne', initialNominees: ['Heather', 'Beth'],
  vetoWinner: 'Scott', finalNominees: ['Heather', 'Beth'],
  votes: {}, evicted: 'Beth', ...over,
});

const meta = { format: 'big-brother', season: 15, episode: 3 };

describe('reading a Big Brother week', () => {
  it('finds the competitions, the block and the vote', () => {
    const kinds = extractEvents(bbWeek(), meta).map(e => e.kind);
    expect(kinds).toContain('comp-win');
    expect(kinds).toContain('nomination');
    expect(kinds).toContain('eviction');
    expect(kinds).toContain('episode-aired');
  });

  it('names people by slug, never by display name', () => {
    // players_database.json keys on slug. A subject carrying "Anne Maria" would
    // never match a persona's feelings and the history would silently not fire.
    const ev = extractEvents(bbWeek({ hoh: 'Anne Maria' }), meta).find(e => e.kind === 'comp-win');
    expect(ev.subject).toBe('anne-maria');
  });

  it('only calls it a blindside when the votes actually turned', () => {
    // Every eviction being a blindside would make the feed's loudest reaction
    // its most common one.
    const quiet = extractEvents(bbWeek(), meta).map(e => e.kind);
    expect(quiet).not.toContain('blindside');

    // The shape the PUBLISHED seasons actually carry is a COUNT, not a list.
    // The first version of this test invented `[{voter:'Scott'}]`, which passed
    // while blindside never fired on a single real week ever played.
    const turned = extractEvents(bbWeek({ voteChanges: 4 }), meta);
    expect(turned.map(e => e.kind)).toContain('blindside');
    // The other shapes are accepted too, since older records may carry them.
    expect(extractEvents(bbWeek({ voteChanges: [{ voter: 'Scott' }] }), meta)
      .map(e => e.kind)).toContain('blindside');
    expect(extractEvents(bbWeek({ voteChanges: 0 }), meta)
      .map(e => e.kind)).not.toContain('blindside');
    // And it still reads as an eviction — a blindside is a kind of eviction.
    expect(turned.map(e => e.kind)).toContain('eviction');
  });

  it('only calls the veto used when the block actually changed', () => {
    const unused = extractEvents(bbWeek(), meta).map(e => e.kind);
    expect(unused).not.toContain('veto-used');

    const used = extractEvents(bbWeek({ finalNominees: ['Heather', 'Owen'] }), meta);
    expect(used.map(e => e.kind)).toContain('veto-used');
  });
});

describe('reading a Total Drama episode', () => {
  it('finds the challenge winner and the boot', () => {
    const kinds = extractEvents(
      { immunityWinner: 'Gwen', eliminated: 'Duncan' },
      { format: 'total-drama', season: 4, episode: 6 },
    ).map(e => e.kind);
    expect(kinds).toContain('comp-win');
    expect(kinds).toContain('eviction');
  });

  it('reads a broken showmance as one', () => {
    const ev = extractEvents(
      { showmanceBreakup: ['Gwen', 'Duncan'] },
      { format: 'total-drama', season: 4, episode: 6 },
    ).find(e => e.kind === 'showmance-broken');
    expect(ev.subject).toBe('gwen');
    expect(ev.actor).toBe('duncan');
  });
});

describe('camp events, through the edit layer', () => {
  it('reads tone rather than growing a second taxonomy', () => {
    // classifyEventTone already sorts aired events; its own comment says
    // "one taxonomy, two consumers". This is the third consumer, not a fourth
    // taxonomy.
    const ep = { campEvents: { beach: {
      pre: [{ type: 'alliancePitch', players: ['Gwen', 'Heather'], badgeText: 'ALLIANCE FORMED', badgeClass: 'gold' }],
      post: [{ type: 'showmanceSpark', players: ['Duncan', 'Courtney'], badgeText: 'A SPARK', badgeClass: 'pink' }],
    }}};
    const kinds = extractEvents(ep, { format: 'total-drama', season: 4, episode: 6 }).map(e => e.kind);
    expect(kinds).toContain('alliance-formed');
    expect(kinds).toContain('romantic-spark');
  });

  it('stays quiet about things the audience does not argue over', () => {
    // A prank is funny, not contentious. Manufacturing an event for every comic
    // beat would drown the feed in noise it has no opinion about.
    const ep = { campEvents: { beach: {
      pre: [{ type: 'prank', players: ['Owen'], badgeText: 'A SILLY PRANK', badgeClass: 'blue' }],
      post: [],
    }}};
    const kinds = extractEvents(ep, { format: 'total-drama', season: 4, episode: 6 }).map(e => e.kind);
    expect(kinds).toEqual(['episode-aired']);
  });
});

describe('what the feed can always do', () => {
  it('never returns nothing, however little parsed', () => {
    // An empty feed reads as a broken feature. The topics that trigger on
    // episode-aired — thirst, edit critique, favourite declarations — are
    // exactly the ones that need no big moment.
    expect(extractEvents({}, meta).map(e => e.kind)).toEqual(['episode-aired']);
    expect(extractEvents(null, meta)).toEqual([]);
  });

  it('only emits kinds the topics can actually react to', () => {
    // An event nothing subscribes to is silence with extra steps.
    for (const ev of extractEvents(bbWeek({ voteChanges: [{ voter: 'x' }] }), meta)) {
      expect(EVENT_KINDS, `nothing reacts to "${ev.kind}"`).toContain(ev.kind);
    }
  });

  it('orders the episode so a reaction never precedes its cause', () => {
    // Project 3 replays in timestamp order, so a blindside reaction arriving
    // before the vote would read as a leak.
    const evs = extractEvents(bbWeek({ voteChanges: [{ voter: 'x' }] }), meta);
    const at = k => evs.find(e => e.kind === k)?.at;
    expect(at('comp-win')).toBeLessThan(at('nomination'));
    expect(at('nomination')).toBeLessThan(at('eviction'));
    expect(at('eviction')).toBeLessThanOrEqual(at('blindside'));
    expect(evs.every(e => e.at >= 0 && e.at <= EPISODE_MS)).toBe(true);
    // and the array itself is sorted, not merely stampable
    expect(evs.map(e => e.at)).toEqual([...evs.map(e => e.at)].sort((a, b) => a - b));
  });
});

describe('against the season that actually shipped', () => {
  // The guard that would have caught the bug above. A reader tested only on
  // fixtures is a reader tested on my imagination; this one opens the real file
  // the publish path wrote and asserts the feed has something to say about it.
  const season = JSON.parse(
    readFileSync(join(process.cwd(), 'data/seasons/bb-1-data.json'), 'utf8'));

  it('reads every week of the published Big Brother season', () => {
    let total = 0;
    for (const w of season.weeks) {
      const evs = extractEvents(w, { format: 'big-brother', season: 1, episode: w.week });
      expect(evs.length, `week ${w.week} produced nothing`).toBeGreaterThan(1);
      total += evs.length;
    }
    expect(total).toBeGreaterThan(50);
  });

  it('finds real blindsides in it', () => {
    // voteChanges is a COUNT in this file. If a future export changes that shape,
    // this fails loudly instead of the feed quietly losing its loudest reaction.
    const kinds = season.weeks.flatMap(w =>
      extractEvents(w, { format: 'big-brother', season: 1, episode: w.week }).map(e => e.kind));
    expect(kinds, 'no week in a real season was a blindside').toContain('blindside');
  });

  it('emits only kinds the topics react to, on real data too', () => {
    for (const w of season.weeks) {
      for (const ev of extractEvents(w, { format: 'big-brother', season: 1, episode: w.week })) {
        expect(EVENT_KINDS, `nothing reacts to "${ev.kind}"`).toContain(ev.kind);
      }
    }
  });
});
