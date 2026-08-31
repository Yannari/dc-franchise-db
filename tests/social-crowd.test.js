// The other several hundred people watching.
//
// Twenty personas across a hundred-and-thirty-post night meant every account
// posting six or seven times — a group chat wearing a timeline's clothes, and
// the first thing anybody notices. These tests are mostly about VOLUME and
// DISTINCTNESS, because that is what makes a feed read as public.
//
// The load-bearing one is last: reach must not decide the ratio. Getting that
// backwards silently broke the feature's whole promise.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assignCrowd, oneOffAccount, followersOfPersona, reachFactor, formatFollowers }
  from '../js/social/crowd.js';
import { PERSONAS } from '../js/social/personas.js';
import { buildEpisodeFeed } from '../js/social/feed.js';
import { extractEvents } from '../js/social/events.js';

const season = JSON.parse(
  readFileSync(join(process.cwd(), 'data/seasons/bb-1-data.json'), 'utf8'));

const weekEvents = (i = 0) => extractEvents(season.weeks[i], {
  format: 'big-brother', season: 1, episode: season.weeks[i].week,
});

const seeded = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('a night in a public timeline', () => {
  const posts = buildEpisodeFeed(weekEvents(3), { seed: 9 });
  const timeline = posts.filter(p => p.stream === 'timeline');

  it('is written by hundreds of people, not by twenty', () => {
    const accounts = new Set(timeline.map(p => p.handle));
    expect(accounts.size, 'the feed is still a group chat').toBeGreaterThan(60);
    // The number that gave the game away: posts per account.
    expect(timeline.length / accounts.size).toBeLessThan(2);
  });

  it('keeps a recognisable few among the strangers', () => {
    // A feed of nothing but one-off accounts is just as wrong: there would be
    // nobody to recognise, and following would mean nothing.
    const recurring = timeline.filter(p => p.recurring);
    expect(recurring.length).toBeGreaterThan(3);
    expect(recurring.length).toBeLessThan(timeline.length * 0.5);
    for (const p of recurring) {
      expect(PERSONAS.some(x => x.handle === p.handle),
        `${p.handle} is marked recurring but is not one of the cast`).toBe(true);
    }
  });

  it('gives strangers a small following and the cast a real one', () => {
    const known = timeline.find(p => p.recurring);
    const stranger = timeline.find(p => !p.recurring);
    expect(known.followers).toBeGreaterThan(5000);
    expect(stranger.followers).toBeLessThan(known.followers);
    expect(timeline.every(p => Number.isFinite(p.followers))).toBe(true);
  });

  it('leaves the hosted room alone', () => {
    // ChatAlumni has a guest list. A passer-by on its main stage would break the
    // one rule that room has.
    const chat = posts.filter(p => p.stream === 'chat');
    expect(chat.length).toBeGreaterThan(0);
    expect(chat.every(p => p.recurring)).toBe(true);
  });

  it('produces the same crowd on every visit', () => {
    const again = buildEpisodeFeed(weekEvents(3), { seed: 9 })
      .filter(p => p.stream === 'timeline');
    expect(again.map(p => p.handle)).toEqual(timeline.map(p => p.handle));
    expect(again.map(p => p.followers)).toEqual(timeline.map(p => p.followers));
  });

  it('stays chronological — the crowd must not reorder the night', () => {
    const times = posts.map(p => p.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('can be switched off, leaving the personas alone', () => {
    const plain = buildEpisodeFeed(weekEvents(3), { seed: 9, crowd: false })
      .filter(p => p.stream === 'timeline');
    expect(plain.every(p => PERSONAS.some(x => x.handle === p.handle))).toBe(true);
  });
});

describe('making up an account', () => {
  it('does not repeat itself across a night', () => {
    const rng = seeded(4);
    const made = Array.from({ length: 300 }, () => oneOffAccount(rng).handle);
    const unique = new Set(made);
    // Some collision is realistic at 300 draws; a lot means the grammar is thin.
    expect(unique.size).toBeGreaterThan(250);
  });

  it('keeps the voice it inherited', () => {
    // A one-off speaks a persona's written words, so it must not be labelled as
    // a different kind of fan than the one who wrote them.
    const rng = seeded(7);
    expect(oneOffAccount(rng, 'stan').archetype).toBe('stan');
  });

  it('looks like a fandom account rather than a person', () => {
    const rng = seeded(11);
    for (let i = 0; i < 40; i++) {
      const a = oneOffAccount(rng);
      expect(a.handle).toMatch(/^@[a-z0-9]+$/);
      expect(a.followers).toBeGreaterThan(0);
      expect(a.recurring).toBe(false);
    }
  });
});

describe('followers', () => {
  it('rewards having been here a long time', () => {
    const old = followersOfPersona({ handle: '@a', since: 2, volatility: 0.5 }, { currentSeason: 14 });
    const recent = followersOfPersona({ handle: '@a', since: 13, volatility: 0.5 }, { currentSeason: 14 });
    expect(old).toBeGreaterThan(recent);
  });

  it('is the same number every time it is asked', () => {
    const p = { handle: '@vetokween', since: 4, volatility: 0.7 };
    expect(followersOfPersona(p)).toBe(followersOfPersona(p));
  });

  it('reads the way an account displays one', () => {
    expect(formatFollowers(412)).toBe('412');
    expect(formatFollowers(1500)).toBe('1.5k');
    expect(formatFollowers(58000)).toBe('58k');
    expect(formatFollowers(1_200_000)).toBe('1.2M');
  });
});

describe('what reach may and may not do', () => {
  it('compresses hard, so the feed is not one account and some silence', () => {
    const small = reachFactor(50);
    const huge = reachFactor(400_000);
    expect(huge).toBeGreaterThan(small);
    // A hundred times the followers is nowhere near a hundred times the reaction.
    expect(huge / small).toBeLessThan(3);
  });

  it('does not decide who is in the room — THE ONE THAT BROKE', () => {
    // The first version handed the recurring cast whichever posts had drawn the
    // most reaction. That sounds right and is backwards: a post is loud because
    // somebody with reach made it, not the reverse. It also made the author
    // depend on gs.popularity — so the same night, with its subject beloved and
    // then despised, put its big accounts on different posts and moved the
    // engagement totals for a reason that has nothing to do with the crowd.
    //
    // The author is therefore chosen from the seed alone, and reach only
    // multiplies what a post already drew.
    const events = weekEvents(3);
    const subject = events.find(e => e.subject).subject;

    const hated = buildEpisodeFeed(events, { seed: 11, popularity: { [subject]: -100, other: 0 } });
    const loved = buildEpisodeFeed(events, { seed: 11, popularity: { [subject]: 100, other: 0 } });

    // Same seed, same people, whatever the crowd thinks of them.
    expect(hated.map(p => p.handle)).toEqual(loved.map(p => p.handle));
    expect(hated.map(p => p.followers)).toEqual(loved.map(p => p.followers));
    // What the crowd thinks still moves the engagement.
    const eng = xs => xs.reduce((n, p) => n + p.likes + p.tomatoes, 0);
    expect(eng(hated)).not.toBe(eng(loved));
  });

  it('still lets a following count for something', () => {
    // If reach did nothing, there would be no reason to model it. Two identical
    // posts, one from a big account: the big one draws more.
    const rng = seeded(3);
    const base = { stream: 'timeline', likes: 100, tomatoes: 20, replyTo: null };
    const [big, small] = assignCrowd(
      [{ ...base, id: 'a', handle: PERSONAS[0].handle }, { ...base, id: 'b', handle: PERSONAS[0].handle }],
      { rng, personas: PERSONAS },
    );
    const bigger = big.followers > small.followers ? big : small;
    const smaller = bigger === big ? small : big;
    if (bigger.followers !== smaller.followers) {
      expect(bigger.likes).toBeGreaterThan(smaller.likes);
    }
  });

  it('does nothing at all when handed nothing', () => {
    expect(assignCrowd([], { rng: seeded(1) })).toEqual([]);
    expect(assignCrowd(null, { rng: seeded(1) })).toEqual([]);
    // and without an rng it must not silently half-assign
    expect(assignCrowd([{ id: 'a', stream: 'timeline' }], {})).toEqual([{ id: 'a', stream: 'timeline' }]);
  });
});

// ══ a fan of THIS show ════════════════════════════════════════════════
//
// The middle of an invented handle is the one part that names a show, and the
// word bank it came from was fixed and held two shows' jargon in one array. On
// a Traitors night that signed 470 of 1,426 posts `@campfireapologist`,
// `@bigjury`, `@antitribal32`, and of 698 distinct handles NOT ONE contained a
// word from the show being watched.
describe('the long tail sounds like it watches this show', () => {
  const seeded = seed => {
    let s = (seed >>> 0) || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  };

  /** 400 handles for one format, so a rate is a rate and not one sample. */
  const handlesFor = format => {
    const rng = seeded(11);
    return Array.from({ length: 400 }, () => oneOffAccount(rng, 'lurker', format).handle);
  };

  const WORDS = {
    traitors: /traitor|faithful|banishment|murder|castle|conclave|roundtable|shield|dagger|mission|turret/,
    'big-brother': /veto|nomination|eviction|houseguest|block|hoh|jury|feeds|slop|havenot/,
    'total-drama': /tribal|idol|merge|campfire|marshmallow|immunity|challenge|tribe|postmerge/,
  };

  for (const [format, mine] of Object.entries(WORDS)) {
    it(`${format} handles are built from ${format}'s own nouns`, () => {
      const handles = handlesFor(format);
      const ours = handles.filter(h => mine.test(h)).length;
      // Roughly half of a handle's shapes take a show noun, so a third of the
      // pool is a comfortable floor and zero is the measured bug.
      expect(ours / handles.length,
        `${format} viewers are posting under another show's vocabulary`)
        .toBeGreaterThan(0.2);

      for (const [other, theirs] of Object.entries(WORDS)) {
        if (other === format) continue;
        const strays = handles.filter(h => theirs.test(h) && !mine.test(h));
        expect(strays.slice(0, 5),
          `${format} handles carrying ${other}'s words`).toEqual([]);
      }
    });
  }

  it('hands a post the vocabulary of the show that post is about', () => {
    // The account is chosen inside assignCrowd, which is handed posts and not
    // a format — so the format has to travel ON the post. It did not, and the
    // registry lookup above would have been correct and never reached.
    const posts = Array.from({ length: 60 }, (_, i) => ({
      id: `p${i}`, stream: 'timeline', format: 'traitors', handle: '@x', subject: 'a',
      likes: 1, tomatoes: 0,
    }));
    const out = assignCrowd(posts, { rng: seeded(3), personas: PERSONAS, currentSeason: 1 });
    const invented = out.filter(p => !p.recurring).map(p => p.handle);
    expect(invented.length, 'every post went to a recurring account').toBeGreaterThan(10);
    expect(invented.some(h => WORDS.traitors.test(h)),
      'not one invented account on a Traitors night sounds like it watches it')
      .toBe(true);
  });
});
