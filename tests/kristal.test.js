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
import { styleOf, voiceOf, composeEpisode, episodeComments, podcastAftermath, STYLES, parseMoment } from '../js/kristal-voice.js';
import { BEATS, MOMENT_BEATS } from '../js/kristal-lines.js';

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

describe('layered contestant voices', () => {
  const archetypes = ['mastermind', 'schemer', 'hothead', 'challenge-beast',
    'social-butterfly', 'loyal-soldier', 'wildcard', 'chaos-agent', 'floater',
    'underdog', 'hero', 'villain', 'goat', 'perceptive-player', 'showmancer'];
  const episode = voice => composeEpisode({
    id: `layer-${voice.archetype}-${voice.traits.join('-')}`, kind: 'debrief',
    voice, guestName: 'X', tier: 'solid', season: { format: 'big-brother', title: 'S' },
    facts: { season: 'S', placement: '5th', votes: '6', rival: 'R', rivalName: 'R' },
    topics: [{ id: 'the-boot' }, { id: 'the-rivalry', about: 'R' }, { id: 'behind-the-scenes' }],
  }, { words: { player: 'houseguest', players: 'houseguests', exit: 'evicted' } });

  it('recognises every canonical archetype instead of reducing the profile to a bucket', () => {
    for (const archetype of archetypes) {
      const voice = voiceOf({ archetype, stats: {} });
      expect(voice.archetype).toBe(archetype);
      expect(voice.cadence).toBeTruthy();
      expect(episode(voice).exchanges[0].a).toBeTruthy();
    }
  });

  it('keeps exact archetypes audible when their fallback cadence is identical', () => {
    // Same cadence, different worldview: the advice for the next cast is the archetype's own.
    const hero = voiceOf({ archetype: 'hero', stats: { loyalty: 7 } });
    const soldier = voiceOf({ archetype: 'loyal-soldier', stats: { loyalty: 7 } });
    expect(hero.cadence).toBe(soldier.cadence);
    const advice = v => episode(v).exchanges.find(x => x.topic === 'the-advice')?.a;
    expect(advice(hero)).toBeTruthy();
    expect(advice(hero)).not.toBe(advice(soldier));
  });

  it('uses high and low values across all nine stats as voice traits', () => {
    const high = voiceOf({ archetype: 'floater', stats: {
      physical: 9, endurance: 9, mental: 9, social: 9, strategic: 9,
      loyalty: 9, boldness: 9, intuition: 9, temperament: 9,
    } });
    const low = voiceOf({ archetype: 'floater', stats: {
      physical: 2, endurance: 2, mental: 2, social: 2, strategic: 2,
      loyalty: 2, boldness: 2, intuition: 2, temperament: 2,
    } });
    expect(high.traits).toHaveLength(9);
    expect(low.traits).toHaveLength(9);
    // Stats move the cadence (mental 2 rambles, strategic 9 audits): the whole hour reads differently.
    expect(JSON.stringify(episode(high).exchanges)).not.toBe(JSON.stringify(episode(low).exchanges));
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
      story: { life: [{ kind: 'cancelled', line: 'X was widely condemned online.' }] },
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

  it('builds a cast thread under a consequential episode', () => {
    const ep = { id: 'thread-probe', tier: 'viral', guest: 'a', guestName: 'A',
      mentioned: 'r', mentionedName: 'R', exchanges: [] };
    const out = episodeComments(ep, { names: { a: 'A', r: 'R', b: 'B', c: 'C' },
      ties: [{ slug: 'b', weight: 5 }, { slug: 'c', weight: -4 }] });
    expect(out.length).toBeGreaterThanOrEqual(3);
    expect(out.some(c => (c.replies || []).some(r => r.slug === 'a'))).toBe(true);
  });
});

// ── v3: the record, read into beats (the user, 2026-10-21: "they barely respond to the host's
// question, never naming names, it's just boring and repetitive") ──

const VOICES = ['bomb', 'analyst', 'hothead', 'charmer', 'earnest', 'deadpan', 'chaos', 'rambler'];
const storyEp = (id, story, extra = {}) => ({
  id, kind: 'debrief', tier: 'viral', style: 'analyst', guestName: story.guest,
  season: { format: 'total-drama', title: 'Camp' },
  story: { season: 'Camp', format: 'total-drama', place: '5th', placement: 5, castNames: [], allies: [], rivals: [],
    rivalOf: [], betrayed: [], betrayedBy: [], moments: [], aboutYou: [], stats: [], life: [], ...story },
  ...extra,
});

describe('every question is answered by an answer written for it', () => {
  // The first v3 draft pooled a beat's answers, and "When did you find out?" was answered "I'd answer, and
  // I'd ask about Misha's mother first" — the answer to "If they called you tonight". So each angle carries
  // its own answers, and its own press with its own cracks, in every voice.
  const angles = [...Object.entries(BEATS), ...Object.entries(MOMENT_BEATS).map(([k, v]) => [`moment:${k}`, v])];
  it('answers every angle in all eight voices', () => {
    for (const [beat, list] of angles) for (const g of list) {
      for (const v of VOICES) {
        const bank = g.byRel ? Object.values(g.byRel).map(b => b[v]) : [g.a[v]];
        for (const b of bank) expect(b?.length, `${beat}/${g.k} has no ${v} answer`).toBeGreaterThan(0);
      }
      for (const p of g.press || []) for (const v of VOICES) {
        expect(p.c[v]?.length, `${beat}/${g.k} press "${p.p}" has no ${v} crack`).toBeGreaterThan(0);
      }
    }
  });
  it('never asks a question about somebody the angle cannot name', () => {
    for (const [beat, list] of angles) for (const g of list) {
      const usesX = g.q.some(q => q.includes('{x}'));
      if (g.need !== 'x') expect(usesX, `${beat}/${g.k} asks about {x} without needing one`).toBe(false);
    }
  });
});

describe('reading who did what to whom', () => {
  const cast = ['Sami', 'Spencer', 'Julia', 'Misha', 'Joel', 'Oliwia', 'Aiden', 'Logan', 'Aubrey', 'Bowie', 'Jane'];
  it('puts every name after "blindsided by" on the doing side', () => {
    const m = parseMoment('Episode 16: Blindsided by Sami, Spencer and Julia.', cast);
    expect(m.cls).toBe('by');
    expect(m.doers).toEqual(['Sami', 'Spencer', 'Julia']);
    expect(m.ep).toBe('Episode 16');
  });
  it('reads "after Aiden flips onto him" as Aiden doing it', () => {
    const m = parseMoment('Episode 7: Is voted out 5-1 after Aiden flips onto him.', cast);
    expect(m.cls).toBe('by');
    expect(m.x).toBe('Aiden');
  });
  it('does not read a kindness or a warning as a betrayal', () => {
    expect(parseMoment('Finale: Chosen by Misha over Joel, then lost 5-4.', cast).cls).not.toBe('by');
    expect(parseMoment("Episode 19: Played her idol after Logan's warning, nullifying votes.", cast).cls).not.toBe('by');
  });
  it('gives an exit to the person who left, not the one who stayed', () => {
    expect(parseMoment('Episode 18: Survived cross-pressure while Oliwia went home.', cast).cls).not.toBe('exit');
  });
  it('reads a betrayal by its subject', () => {
    const m = parseMoment('Broke the Aubrey final-three pact to protect Bowie.', cast);
    expect(m.cls).toBe('betrayal');
    expect(m.x).toBe('Aubrey');
  });
});

describe('the interview reads the record', () => {
  it('reads the betrayal out and asks about the person in it, by name', () => {
    const m = parseMoment('Episode 3: Broke the Aubrey final-three pact to protect Bowie.', ['Aubrey', 'Bowie']);
    const out = composeEpisode(storyEp('kt-betrayal', { guest: 'Spencer', betrayed: ['Aubrey'], why: { Aubrey: m },
      moments: [m], castNames: ['Aubrey', 'Bowie'] }), { words: {} });
    const x = out.exchanges.find(e => e.topic === 'the-betrayal');
    expect(x.q).toContain('Broke the Aubrey final-three pact');
    expect(x.q).toContain('Aubrey');
    expect(x.a).toContain('Aubrey');
  });
  it('asks what was said in a fight, and the answer says who said it', () => {
    const m = parseMoment("Episode 1: Clashed with Marissa immediately, setting up one of the season's earliest hero-villain dynamics.", ['Marissa']);
    expect(m.cls).toBe('fight');
    for (const style of VOICES) {
      const out = composeEpisode(storyEp(`kt-fight-${style}`, { guest: 'Isabel', moments: [m], castNames: ['Marissa'] }, { style }), { words: {} });
      const x = out.exchanges.find(e => e.topic === 'the-moment');
      expect(x.q).toContain('Clashed with Marissa');
      expect(x.a, style).toContain('Marissa');
    }
  });
  it('does not read a summary line out as a moment', () => {
    const m = parseMoment('Winner - 7 jury votes (7-1-0)', []);
    const out = composeEpisode(storyEp('kt-summary', { guest: 'Jacques', moments: [m] }), { words: {} });
    expect(out.exchanges.some(e => e.q.includes('7-1-0'))).toBe(false);
  });
  it('asks a finalist what cost them the end, never about the night they were voted out', () => {
    const out = composeEpisode(storyEp('kt-final', { guest: 'Riya', placement: 2, place: '2nd', finalist: true, winner: 'James' }), { words: {} });
    expect(out.exchanges.some(e => e.topic === 'the-loss')).toBe(true);
    expect(out.exchanges.some(e => e.topic === 'the-boot')).toBe(false);
  });
  it('names the person in nearly every answer when the record has people in it', () => {
    const out = composeEpisode(storyEp('kt-names', { guest: 'Ara', winner: 'Julia', rivals: ['Bowie'], betrayedBy: ['Spencer'],
      allies: ['Gabby'], partner: 'Ernesto', partnerOver: true, castNames: ['Julia', 'Bowie', 'Spencer', 'Gabby', 'Ernesto'] }), { words: {} });
    const said = out.exchanges.filter(e => /Julia|Bowie|Spencer|Gabby|Ernesto/.test(e.a + (e.crack || '')));
    expect(said.length / out.exchanges.length).toBeGreaterThan(0.6);
    expect(out.rapid.every(r => /Julia|Bowie|Spencer|Gabby|Ernesto|Me\b/.test(r.q + r.a))).toBe(true);
  });
  it('presses with a follow-up and answers that follow-up', () => {
    const out = composeEpisode(storyEp('kt-press', { guest: 'Ara', rivals: ['Bowie'], betrayedBy: ['Spencer'] }), { words: {} });
    const pressed = out.exchanges.filter(e => e.press);
    expect(pressed.length).toBeGreaterThan(0);
    for (const e of pressed) {
      const g = BEATS[e.topic].find(a => (a.press || []).some(p => p.p.replace('{x}', 'Bowie') === e.press || p.p.replace('{x}', 'Spencer') === e.press));
      expect(g, `${e.press} is not one of ${e.topic}'s presses`).toBeTruthy();
    }
  });
  it('scales the interview with the importance of the episode', () => {
    const story = { guest: 'Ara', winner: 'Julia', rivals: ['Bowie'], betrayedBy: ['Spencer'], betrayed: ['Oliwia'],
      allies: ['Gabby'], partner: 'Ernesto', rivalOf: ['Lake'], castNames: ['Julia', 'Bowie', 'Spencer', 'Oliwia', 'Gabby', 'Ernesto', 'Lake'] };
    const viral = composeEpisode(storyEp('kt-scale', story), { words: {} });
    const quiet = composeEpisode(storyEp('kt-scale', story, { tier: 'quiet' }), { words: {} });
    expect(viral.exchanges.length).toBeGreaterThan(quiet.exchanges.length);
  });
  it('derives fallout without mutating the season record', () => {
    const ep = storyEp('kt-fallout', { guest: 'Ara', rivals: ['Bowie'] }, { mentioned: 'bowie' });
    const story = JSON.stringify(ep.story);
    Object.assign(ep, composeEpisode(ep, { words: {} }));
    ep.aftermath = podcastAftermath(ep);
    expect(ep.aftermath.controversy).toBeGreaterThan(0);
    expect(ep.aftermath.relationship?.with).toBe('bowie');
    expect(JSON.stringify(ep.story)).toBe(story);
  });
  it('plays a clip only when it says the guest’s name', () => {
    const earlier = [{ guest: 'b', guestName: 'Bowie', exchanges: [{ a: 'Gabby was my emotional support.' }] }];
    const none = composeEpisode(storyEp('kt-clip-0', { guest: 'Ara' }, { guest: 'a' }), { words: {}, earlier });
    expect(none.exchanges.some(e => e.topic === 'the-response')).toBe(false);
    earlier[0].exchanges.push({ a: 'Ara lied to me on day two.' });
    const some = composeEpisode(storyEp('kt-clip-1', { guest: 'Ara' }, { guest: 'a' }), { words: {}, earlier });
    const rx = some.exchanges.find(e => e.topic === 'the-response');
    expect(rx.q).toContain('Ara lied to me on day two.');
    expect(rx.q).toContain('Bowie');
  });
});

describe('the catch-up asks about the year as itself', () => {
  it('quotes the headline and answers in its mood, then presses on how they really are', () => {
    const ep = storyEp('kt-life', { guest: 'Kelly', life: [{ kind: 'rehab', line: 'Kelly went into treatment.' }], winner: 'Wayne' },
      { kind: 'life', tier: 'solid', style: 'bomb' });
    const out = composeEpisode(ep, { words: {} });
    expect(out.exchanges[0].topic).toBe('the-life');
    expect(out.exchanges[0].q).toContain('Kelly went into treatment.');
    expect(out.exchanges[0].crack).not.toMatch(/votes/i);
  });
  it('skips a headline with no mood of its own', () => {
    const ep = storyEp('kt-life-2', { guest: 'Kelly', life: [{ kind: 'promoted', line: 'Kelly was promoted.' }], rivals: ['Gerry'] },
      { kind: 'life', tier: 'solid' });
    expect(composeEpisode(ep, { words: {} }).exchanges.some(e => /promoted/.test(e.q))).toBe(false);
  });
});

describe('rapid fire, after the heartbeat bug', () => {
  // "Best liar you ever shared a room with?" was answered "In a heartbeat." — twice in one episode.
  const probe = style => composeEpisode(storyEp('rf-' + style, { guest: 'X', rivals: ['Rana'], winner: 'Wes',
    partner: 'Pat', allies: ['Al'], castNames: ['Rana', 'Wes', 'Pat', 'Al'] }, { style }), { words: {} }).rapid;

  it('never repeats an answer inside one episode', () => {
    for (const style of VOICES) {
      const answers = probe(style).map(r => r.a);
      expect(new Set(answers).size, style).toBe(answers.length);
    }
  });
  it('fills every slot', () => {
    for (const style of VOICES) for (const r of probe(style)) expect(r.q + r.a).not.toMatch(/\{|undefined/);
  });
  it('gives somebody with a showmance at least one question about it', () => {
    const out = composeEpisode(storyEp('rf-messy', { guest: 'Jules', partner: 'Stella', rivals: ['Misha'],
      castNames: ['Stella', 'Misha'] }, { style: 'charmer' }), { words: {} });
    expect(out.rapid.some(r => /Stella|love|cameras/i.test(r.q))).toBe(true);
  });
});

describe('the remix', () => {
  it('re-rolls the words and cannot touch a number', () => {
    // The only re-roll the parity rule permits: the follower model never
    // hears about the salt, so nothing it reads may change under one.
    const plain = run();
    const remixed = run({ proseSalts: { 'td-1': 3, 'bb-1': 1 } });
    expect(remixed.map(e => [e.id, e.guest, e.listeners, e.tier, e.minutes]))
      .toEqual(plain.map(e => [e.id, e.guest, e.listeners, e.tier, e.minutes]));
    // And the words actually moved somewhere — same facts, different cut.
    const changed = remixed.some((e, i) =>
      e.coldOpen !== plain[i].coldOpen || e.title !== plain[i].title
      || JSON.stringify(e.rapid) !== JSON.stringify(plain[i].rapid));
    expect(changed).toBe(true);
  });

  it('only remixes the salted period', () => {
    const plain = run();
    const remixed = run({ proseSalts: { 'bb-1': 2 } });
    for (let i = 0; i < plain.length; i++) {
      if (plain[i].afterSeason === 'td-1') {
        expect(remixed[i].coldOpen).toBe(plain[i].coldOpen);
        expect(remixed[i].title).toBe(plain[i].title);
      }
    }
  });
});
