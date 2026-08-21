// Kristal-talKs — the exit-interview podcast.
//
// Episodes are DERIVED: computed from the published record and the approved
// life log, pinned to off-seasons, stored nowhere. The properties worth
// pinning are the ones that make that safe — determinism, the vocabulary rule,
// approved-only reads, and numbers that cannot depend on which page asked.
import { describe, expect, it } from 'vitest';
import { podcastFor, podcastOf, PODCAST_FOLLOWERS, RECEPTION } from '../js/kristal.js';

const SEASONS = [
  { seasonId: 'td-1', seasonNumber: 1, format: 'total-drama', airYear: 2020, airSlot: 'spring',
    title: 'Camp One', winner: { playerSlug: 'ava' } },
  { seasonId: 'bb-1', seasonNumber: 1, format: 'big-brother', airYear: 2020, airSlot: 'fall',
    title: 'House One', winner: { playerSlug: 'finn' } },
];

const career = (id, seasonId, detail = {}) => ({
  id, name: id[0].toUpperCase() + id.slice(1), wins: detail.placement === 1 ? 1 : 0,
  seasonsPlayed: 1, bestPlacement: detail.placement || 9,
  details: [{ seasonId, placement: 9, ...detail }],
});

const CAREERS = [
  career('ava', 'td-1', { placement: 1 }),
  career('ben', 'td-1', { placement: 2, rivalries: ['Cleo'] }),
  // votesReceived breaks what would otherwise be a dead heat with Ben on a
  // two-chair cast — the fixture must be decisive, not lucky.
  career('cleo', 'td-1', { placement: 5, rivalries: ['Ben'], showmance: 'Dan',
    showmanceEnded: 'broken', votesReceived: 6 }),
  career('dan', 'td-1', { placement: 7, votesReceived: 6 }),
  career('eve', 'td-1', { placement: 12 }),
  career('finn', 'bb-1', { placement: 1 }),
  career('gia', 'bb-1', { placement: 3, votesReceived: 5 }),
  career('hal', 'bb-1', { placement: 8 }),
];

const run = (extra = {}) => podcastFor({ careers: CAREERS, seasons: SEASONS, ...extra });

describe('the bookings', () => {
  it('always sits the winner down', () => {
    const eps = run();
    expect(eps.some(e => e.afterSeason === 'td-1' && e.guest === 'ava')).toBe(true);
    expect(eps.some(e => e.afterSeason === 'bb-1' && e.guest === 'finn')).toBe(true);
  });

  it('books the mess over the middle', () => {
    // Cleo has a rivalry AND a broken showmance; Eve has a quiet 12th place.
    const td = run().filter(e => e.afterSeason === 'td-1').map(e => e.guest);
    expect(td).toContain('cleo');
    expect(td).not.toContain('eve');
  });

  it('is identical on every call — the feed must never reshuffle', () => {
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });
});

describe('the vocabulary rule', () => {
  it('says voted out to a contestant and evicted to a houseguest', () => {
    const eps = run();
    const text = eps.map(e => e.exchanges.map(x => x.q).join(' ')).join(' ');
    const tdBoot = eps.filter(e => e.season.format === 'total-drama')
      .flatMap(e => e.exchanges).find(x => /got (voted out|evicted)/.test(x.q));
    const bbBoot = eps.filter(e => e.season.format === 'big-brother')
      .flatMap(e => e.exchanges).find(x => /got (voted out|evicted)/.test(x.q));
    if (tdBoot) expect(tdBoot.q).toContain('voted out');
    if (bbBoot) expect(bbBoot.q).toContain('evicted');
    expect(text).not.toContain('{exit}');
    expect(text).not.toContain('{players}');
  });
});

describe('the catch-up', () => {
  const LIFE = [
    { player: 'eve', kind: 'cancelled', afterSeason: 'bb-1', seq: 1, status: 'approved' },
  ];

  it('books whoever had the year, and asks about the year', () => {
    const eps = run({ lifeEvents: LIFE });
    const ep = eps.find(e => e.kind === 'life' && e.guest === 'eve');
    expect(ep).toBeTruthy();
    expect(ep.afterSeason).toBe('bb-1');
    // And the answer comes from the life bank, not the debrief spill —
    // "say it to my face like I said it to theirs" over a question about
    // somebody's year was in the first screenshot.
    expect(ep.exchanges[0].topic).toBe('the-life');
    expect(ep.exchanges[0].a).not.toMatch(/say it to my face/i);
  });

  it('reads approved rows only — a proposal cannot book a guest', () => {
    const proposed = LIFE.map(e => ({ ...e, status: 'proposed' }));
    expect(run({ lifeEvents: proposed }).some(e => e.kind === 'life')).toBe(false);
  });
});

describe('numbers no page can disagree about', () => {
  it('computes the same listeners and tiers with and without the roster', () => {
    // Candor shapes the prose register only. A count that changed depending on
    // which page passed archetypes is the two-clocks bug.
    const bare = run();
    const dressed = run({ archetypes: { ava: 'villain', cleo: 'hero', finn: 'chaos-agent' },
      names: { ava: 'Ava!' } });
    expect(bare.map(e => [e.id, e.listeners, e.tier]))
      .toEqual(dressed.map(e => [e.id, e.listeners, e.tier]));
  });

  it('normalises who a viral episode is about to a slug', () => {
    // Season details name people by NAME; the follower model needs slugs.
    const cleoEp = run().find(e => e.guest === 'cleo');
    expect(cleoEp.mentioned).toBe('dan');
  });

  it('exposes appearances and viral mentions for a profile', () => {
    const eps = run();
    const mine = podcastOf('ava', eps);
    expect(mine.appearances.length).toBeGreaterThan(0);
    expect(PODCAST_FOLLOWERS[mine.appearances[0].tier]).toBeGreaterThan(0);
  });

  it('keeps every tier reachable', () => {
    expect(RECEPTION.map(r => r.tier)).toEqual(['quiet', 'solid', 'viral']);
  });
});
