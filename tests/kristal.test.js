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

// ── v2: the full episode ──────────────────────────────────────────────
//
// "dont u think the episode will be repetitive ... its shallow" — v2's answer
// is styles, presses, continuity and fact slots, and these hold each down.
import { styleOf, composeEpisode, episodeComments, STYLES } from '../js/kristal-voice.js';

describe('the voice styles', () => {
  it('lets stats override the archetype — a villain with no temper control is a hothead first', () => {
    expect(styleOf({ archetype: 'villain', stats: { temperament: 1 } })).toBe('hothead');
    expect(styleOf({ archetype: 'villain', stats: { temperament: 6 } })).toBe('bomb');
    expect(styleOf({ archetype: 'hero', stats: { mental: 2 } })).toBe('rambler');
    expect(styleOf({ archetype: 'mastermind', stats: {} })).toBe('analyst');
  });

  it('gives every style a usable set of banks', () => {
    // Each style must produce a full episode without a single empty line.
    for (const style of STYLES) {
      const ep = { id: 'probe-' + style, kind: 'debrief', style, guestName: 'X',
        tier: 'viral', season: { format: 'total-drama', title: 'S' },
        facts: { season: 'S', placement: '5th', votes: '6', rival: 'R', rivalName: 'R', partner: 'P' },
        topics: [{ id: 'the-boot' }, { id: 'the-rivalry', about: 'R' }, { id: 'behind-the-scenes' }] };
      const t = composeEpisode(ep, { words: { player: 'contestant', players: 'contestants', exit: 'voted out' } });
      expect(t.coldOpen.length, style + ' cold open').toBeGreaterThan(0);
      expect(t.exchanges.length, style + ' exchanges').toBeGreaterThan(1);
      expect(t.rapid.length, style + ' rapid fire').toBe(4);
      for (const x of t.exchanges) {
        expect(x.a, style + ' answer empty').toBeTruthy();
        expect(x.a).not.toMatch(/\{|undefined/);
      }
    }
  });
});

describe('the press', () => {
  it('presses the juiciest topic and lands a crack', () => {
    const ep = { id: 'press-probe', kind: 'debrief', style: 'bomb', guestName: 'X',
      tier: 'solid', season: { format: 'total-drama', title: 'S' },
      facts: { season: 'S', placement: '5th', votes: '6', rival: 'R', rivalName: 'R' },
      topics: [{ id: 'the-boot' }, { id: 'the-rivalry', about: 'R' }] };
    const t = composeEpisode(ep, { words: {} });
    const pressed = t.exchanges.filter(x => x.press);
    expect(pressed).toHaveLength(1);
    expect(pressed[0].topic).toBe('the-rivalry');   // juicier than the boot
    expect(pressed[0].crack).toBeTruthy();
  });

  it('cracks about the year on a catch-up, never about vote counts', () => {
    // The first live read had a guest asked about her YEAR confessing about
    // votes nobody mentioned.
    const ep = { id: 'life-probe', kind: 'life', style: 'bomb', guestName: 'X',
      tier: 'solid', season: { format: 'big-brother', title: 'S' },
      facts: { season: 'S', votes: '8' },
      topics: [{ id: 'the-life', line: 'X was cancelled.' }, { id: 'behind-the-scenes' }] };
    const t = composeEpisode(ep, { words: {} });
    const pressed = t.exchanges.find(x => x.crack);
    expect(pressed.topic).toBe('the-life');
    expect(pressed.crack).not.toMatch(/votes/i);
  });
});

describe('continuity', () => {
  it('opens with the rival\'s actual clip when they sat down earlier in the gap', () => {
    // Cleo's episode is about Ben (rivalry); Ben was booked first. Kristal
    // plays Ben's crack at Cleo, and Cleo answers it.
    const eps = run();
    const withResponse = eps.filter(e => e.exchanges.some(x => x.topic === 'the-response'));
    for (const e of withResponse) {
      const prior = eps.find(p => p.afterSeason === e.afterSeason && p.guest === e.mentioned);
      expect(prior, 'a response with nobody to respond to').toBeTruthy();
      expect(eps.indexOf(prior)).toBeLessThan(eps.indexOf(e));
      const rx = e.exchanges.find(x => x.topic === 'the-response');
      expect(rx.q).toContain(prior.guestName);
    }
  });

  it('greets a returning guest by their visit number', () => {
    const eps = run();
    const again = eps.find(e => e.visit > 1);
    if (again) expect(again.coldOpen).toMatch(/again|number|Back in the chair|remembers/i);
  });
});

describe('the room under an episode', () => {
  it('always seats the subject of a viral episode in the comments', () => {
    const ep = { id: 'c-probe', tier: 'viral', guest: 'a', mentioned: 'r', mentionedName: 'R' };
    const out = episodeComments(ep, { ties: [], names: {} });
    expect(out[0].relation).toBe('subject');
    expect(out[0].slug).toBe('r');
  });

  it('never lets the guest comment under their own episode', () => {
    const ep = { id: 'c-probe2', tier: 'solid', guest: 'a', mentioned: null };
    const out = episodeComments(ep, { ties: [{ slug: 'a', weight: 9 }, { slug: 'b', weight: 4 }], names: {} });
    expect(out.every(c => c.slug !== 'a')).toBe(true);
  });
});
