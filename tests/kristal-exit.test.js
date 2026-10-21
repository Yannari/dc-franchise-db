// Kristal-talKs in-season exit interviews, on the site.
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
import { describe, expect, it } from 'vitest';
import { podcastFor, PODCAST_FOLLOWERS, exitFollowerDelta } from '../js/kristal.js';
import { decideExitInterview } from '../js/exit-interview/core.js';
import { seededRandom } from './helpers/rng.js';

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
const CAST = ['Ava', 'Ben', 'Cleo', 'Dax', 'Eli', 'Fay', 'Gus', 'Hal'];
const slug = n => n.toLowerCase();

function facts(guest, week, over = {}) {
  const gone = CAST.slice(0, CAST.indexOf(guest) + 1);
  const stillIn = CAST.filter(n => !gone.includes(n));
  return {
    show: 'big-brother', week, guest, with: null, how: 'evicted', placement: CAST.length - week + 1,
    juror: week > 3, firstBoot: week === 1, again: false, blindside: week === 2,
    votesAgainst: 4, votesTotal: 6, backdoor: false, flippers: week === 2 ? [stillIn[0]] : [],
    suspected: week === 2 ? [] : [stillIn[1]], partner: null, partnerStillIn: false,
    allies: [stillIn[2]].filter(Boolean), rivals: [stillIn[0]], stillIn,
    outNow: gone.filter(n => n !== guest), heardAboutMe: [],
    profile: { archetype: week % 2 ? 'hothead' : 'hero', stats: { ...STATS, temperament: week % 2 ? 2 : 8 } },
    predictFrom: stillIn.map((n, i) => [n, i + 1]), ...over,
  };
}

function season() {
  const earlier = [];
  for (const [i, g] of CAST.slice(0, 5).entries()) {
    earlier.push(decideExitInterview(facts(g, i + 1), { rng: seededRandom(i + 7), earlier }));
  }
  return earlier;
}

function inputs(records) {
  const row = { seasonId: 'bb-9', seasonNumber: 9, format: 'big-brother', title: 'Big Brother 9',
    airYear: 2027, airSlot: 'summer', episodeCount: 8, castSize: 8,
    winner: { name: 'Hal', playerSlug: 'hal' }, exitInterviews: records };
  const careers = CAST.map((n, i) => ({ id: slug(n), name: n, details: [{ seasonId: 'bb-9', format: 'big-brother',
    placement: CAST.length - i, ...(n === 'Cleo' ? { rivalries: ['Dax', 'Eli', 'Fay'], showmance: 'Gus',
      showmanceEnded: 'broken', votesReceived: 12, keyMoments: ['Week 3: blindsided by Dax'] } : {}) }] }));
  const profiles = Object.fromEntries(CAST.map((n, i) => [slug(n), { archetype: 'floater', stats: STATS, gender: i % 2 ? 'f' : 'm' }]));
  return { careers, seasons: [row], lifeEvents: [], profiles, names: Object.fromEntries(CAST.map(n => [slug(n), n])) };
}

describe('the in-season episodes', () => {
  const records = season();
  const eps = podcastFor(inputs(records));
  const exits = eps.filter(e => e.kind === 'exit');

  it('one per record, in the order they left, before the debrief, in their own period', () => {
    expect(exits.length).toBe(records.length);
    expect(exits.map(e => e.record.week)).toEqual([1, 2, 3, 4, 5]);
    const firstDebrief = eps.findIndex(e => e.kind === 'debrief');
    expect(firstDebrief).toBeGreaterThan(eps.indexOf(exits[exits.length - 1]));
    for (const e of exits) expect(e.period).toBe('bb-9:live');
  });

  it('writes whole transcripts with nothing unfilled', () => {
    for (const e of exits) {
      const text = [e.coldOpen, e.outro, ...e.exchanges.flatMap(x => [x.q, x.a, x.reply]), ...e.rapid.flatMap(r => [r.q, r.a])]
        .filter(Boolean).join('\n');
      expect(text).not.toMatch(/undefined|null|\{|\}/);
      expect(e.exchanges.length).toBeGreaterThanOrEqual(3);
      expect(e.title).toBeTruthy();
    }
  });

  it('only ever says a person is still in the game if they were', () => {
    for (const e of exits) {
      for (const x of e.exchanges.filter(x => ['rank-them', 'message-in', 'who-next', 'the-prediction'].includes(x.topic))) {
        expect(e.record.stillIn).toContain(x.who);
      }
    }
  });

  it('the numbers do not move when the words are remixed', () => {
    const again = podcastFor({ ...inputs(records), proseSalts: { 'bb-9:live': 3 } }).filter(e => e.kind === 'exit');
    expect(again.map(e => [e.listeners, e.tier, e.reception, e.followers]))
      .toEqual(exits.map(e => [e.listeners, e.tier, e.reception, e.followers]));
  });

  it('an exit interview pays less than a debrief and a cold one costs', () => {
    for (const tier of ['quiet', 'solid', 'viral']) {
      expect(exitFollowerDelta({ tier, reception: 'warm' })).toBeLessThan(PODCAST_FOLLOWERS[tier]);
      expect(exitFollowerDelta({ tier, reception: 'warm' })).toBeGreaterThan(0);
      expect(exitFollowerDelta({ tier, reception: 'cold' })).toBeLessThan(0);
    }
  });

  it('a juror is told they go dark until the finale', () => {
    const juror = exits.find(e => e.record.juror);
    expect(juror.coldOpen).toMatch(/jury/i);
  });

  it('uses the guest’s own pronouns, never "they" for a man or a woman', () => {
    for (const e of exits) {
      if (e.pronouns.sub === 'they') continue;
      const text = [e.coldOpen, e.outro].join(' ');
      expect(text).not.toMatch(new RegExp(`\\b${e.guestName}\\b[^.]*\\btheir\\b`));
    }
  });
});

describe('answering back, and the debrief remembering', () => {
  it('plays the guest the line actually said about them', () => {
    const r1 = decideExitInterview(facts('Ava', 1, { rivals: ['Ben'], allies: [], suspected: [], stillIn: ['Ben', 'Cleo', 'Dax'],
      profile: { archetype: 'villain', stats: { ...STATS, temperament: 1 } } }), { rng: seededRandom(3) });
    r1.heardBy = { Ben: 2 };
    const r2 = decideExitInterview(facts('Ben', 2, { heardAboutMe: [{ id: r1.id, from: 'Ava', stance: r1.named.find(n => n.who === 'Ben').stance }] }),
      { rng: seededRandom(4), earlier: [r1] });
    const eps = podcastFor(inputs([r1, r2])).filter(e => e.kind === 'exit');
    const said = eps[0].exchanges.find(x => x.who === 'Ben')?.a;
    expect(said).toBeTruthy();
    const back = eps[1].exchanges.find(x => x.topic === 'the-response');
    expect(back.q).toContain(said);
  });

  it('a debrief guest hears the winner they picked during the season', () => {
    const records = season();
    const cleo = records.find(r => r.guest === 'Cleo');
    cleo.prediction = 'Fay';
    const eps = podcastFor(inputs(records));
    const debrief = eps.find(e => e.kind === 'debrief' && e.guest === 'cleo');
    expect(debrief).toBeTruthy();
    const pb = debrief.exchanges.find(x => x.topic === 'the-prediction');
    expect(pb.q).toMatch(/Fay/);
    expect(pb.q).toMatch(/Hal/);
    expect(debrief.visit).toBe(2);
  });
});
