// The show-blind core of Kristal-talKs' in-season exit interviews.
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
import { describe, expect, it } from 'vitest';
import { decideExitInterview, applyRecording, deliverInterviews, heardAbout,
  EXIT_KINDS, MOODS, SEGMENTS, STANCES } from '../js/exit-interview/core.js';
import { seededRandom } from './helpers/rng.js';

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };

function facts(over = {}) {
  return {
    show: 'big-brother', week: 4, guest: 'Ava', with: null, how: 'evicted',
    placement: 9, juror: false, firstBoot: false, again: false, blindside: false,
    votesAgainst: 5, votesTotal: 7, backdoor: false,
    flippers: [], suspected: ['Ben'], partner: null, partnerStillIn: false,
    allies: ['Cleo'], rivals: ['Dax'], stillIn: ['Ben', 'Cleo', 'Dax', 'Eli', 'Fay'],
    outNow: [], heardAboutMe: [],
    profile: { archetype: 'floater', stats: { ...STATS } },
    predictFrom: [['Ben', 3], ['Cleo', 1], ['Dax', 2]],
    ...over,
  };
}
const decide = (f, seed = 1, earlier = []) => decideExitInterview(f, { rng: seededRandom(seed), earlier });

describe('what kind of exit interview it is', () => {
  it('reads the kind off how and why they left', () => {
    expect(decide(facts({ how: 'walked' })).kind).toBe('walked');
    expect(decide(facts({ how: 'medical' })).kind).toBe('medical');
    expect(decide(facts({ how: 'finalist', placement: 1, stillIn: [] })).kind).toBe('finalist');
    expect(decide(facts({ again: true })).kind).toBe('again');
    expect(decide(facts({ firstBoot: true })).kind).toBe('first-boot');
    expect(decide(facts({ blindside: true, suspected: [] })).kind).toBe('blindside');
    expect(decide(facts({ backdoor: true })).kind).toBe('backdoor');
    expect(decide(facts({ partner: 'Eli', partnerStillIn: true })).kind).toBe('showmance');
    expect(decide(facts({ with: 'Zed' })).kind).toBe('double');
    expect(decide(facts()).kind).toBe('seen-it-coming');
    for (const k of ['walked', 'first-boot', 'blindside']) expect(EXIT_KINDS).toContain(k);
  });

  it('asks nobody who flipped on a night with no vote', () => {
    const r = decide(facts({ how: 'walked', votesAgainst: 0, votesTotal: 0, flippers: [], suspected: [] }));
    expect(r.truth).toBeNull();
    expect(r.segments).not.toContain('the-tape');
  });

  it('plays the tape when somebody they trusted voted them out', () => {
    const r = decide(facts({ blindside: true, suspected: [], flippers: ['Cleo'] }));
    expect(r.truth).toEqual({ flippers: ['Cleo'], suspected: [], right: false });
    expect(r.segments).toContain('the-tape');
  });
});

describe('the guest', () => {
  const moods = (profile, n = 200) => {
    const out = {};
    for (let i = 0; i < n; i++) {
      const m = decide(facts({ profile }), i + 1).mood;
      out[m] = (out[m] || 0) + 1;
    }
    return out;
  };

  it('a short fuse leaves bitter far more often than a calm hero', () => {
    const hot = moods({ archetype: 'hothead', stats: { ...STATS, temperament: 1 } });
    const calm = moods({ archetype: 'hero', stats: { ...STATS, temperament: 9 } });
    expect(hot.bitter || 0).toBeGreaterThan((calm.bitter || 0) * 2);
    expect(calm.gracious || 0).toBeGreaterThan(hot.gracious || 0);
    for (const m of Object.keys({ ...hot, ...calm })) expect(MOODS).toContain(m);
  });

  it('a nice archetype never drags anybody', () => {
    for (let s = 1; s <= 60; s++) {
      const r = decide(facts({ profile: { archetype: 'hero', stats: { ...STATS, temperament: 1 } } }), s);
      expect(r.named.some(n => n.stance === 'drag')).toBe(false);
    }
  });

  it('never names themselves, and names each person once', () => {
    for (let s = 1; s <= 40; s++) {
      const r = decide(facts({ suspected: ['Ben', 'Ava'], rivals: ['Ben'] }), s);
      expect(r.named.some(n => n.who === 'Ava')).toBe(false);
      const who = r.named.map(n => n.who);
      expect(new Set(who).size).toBe(who.length);
      for (const n of r.named) expect(STANCES).toContain(n.stance);
    }
  });

  it('predicts a winner who is still in the game, or nobody', () => {
    for (let s = 1; s <= 40; s++) {
      const r = decide(facts(), s);
      expect(['Ben', 'Cleo', 'Dax', 'Eli', 'Fay']).toContain(r.prediction);
    }
    expect(decide(facts({ stillIn: [], predictFrom: [] })).prediction).toBeNull();
  });
});

describe('the segments', () => {
  it('runs one to three, and only the ones the facts can carry', () => {
    for (let s = 1; s <= 80; s++) {
      const r = decide(facts(), s);
      expect(r.segments.length).toBeGreaterThanOrEqual(1);
      expect(r.segments.length).toBeLessThanOrEqual(3);
      expect(r.segments).not.toContain('caller');
      expect(r.segments).not.toContain('answer-back');
      for (const g of r.segments) expect(SEGMENTS).toContain(g);
    }
  });

  it('answers back when they have heard what somebody said about them', () => {
    const r = decide(facts({ heardAboutMe: [{ id: 'x1', from: 'Gus', stance: 'drag' }], outNow: ['Gus'] }));
    expect(r.segments).toContain('answer-back');
    expect(r.answerBack[0]).toMatchObject({ id: 'x1', who: 'Gus' });
    expect(r.named.some(n => n.who === 'Gus')).toBe(true);
  });

  it('takes a caller only from people already out', () => {
    let saw = false;
    for (let s = 1; s <= 80; s++) {
      const r = decide(facts({ outNow: ['Gus'] }), s);
      if (r.segments.includes('caller')) { saw = true; expect(r.caller).toBe('Gus'); }
    }
    expect(saw).toBe(true);
  });

  it('never runs the same rotation three interviews in a row', () => {
    const earlier = [];
    for (let s = 1; s <= 30; s++) {
      const r = decide(facts({ outNow: ['Gus'] }), s, earlier);
      const key = r.segments.join('+');
      if (earlier.length >= 2) {
        const [a, b] = earlier.slice(-2).map(e => e.segments.join('+'));
        expect(a === key && b === key).toBe(false);
      }
      earlier.push(r);
    }
  });
});

describe('effects', () => {
  function world() {
    const bonds = {}, pop = {}, stats = {};
    const k = (a, b) => [a, b].sort().join('|');
    return {
      bonds, pop, stats,
      bond: (a, b) => bonds[k(a, b)] || 0,
      ops: {
        addBond: (a, b, d) => { bonds[k(a, b)] = (bonds[k(a, b)] || 0) + d; },
        addPopularity: (n, d) => { pop[n] = (pop[n] || 0) + d; },
        popularityOf: n => pop[n] || 0,
        statsOf: n => stats[n] || STATS,
      },
    };
  }
  const rec = (named, over = {}) => ({ id: 'r1', guest: 'Ava', mood: 'bitter', reception: 'cold',
    named, truth: null, heardBy: {}, effects: { popularity: {}, bonds: [] }, profile: { stats: STATS }, ...over });

  it('a drag lowers the bond only once the person hears it, and only once', () => {
    const w = world();
    const r = rec([{ who: 'Ben', stance: 'drag', still: true, heat: 1 }]);
    deliverInterviews([r], { at: 4, canHear: () => false, ops: w.ops });
    expect(w.bond('Ava', 'Ben')).toBe(0);
    deliverInterviews([r], { at: 6, canHear: n => n === 'Ben', ops: w.ops });
    const after = w.bond('Ava', 'Ben');
    expect(after).toBeLessThan(0);
    expect(r.heardBy.Ben).toBe(6);
    deliverInterviews([r], { at: 7, canHear: () => true, ops: w.ops });
    expect(w.bond('Ava', 'Ben')).toBe(after);
  });

  it('praise warms, and a short fuse feels a drag harder than a calm one', () => {
    const w = world();
    w.stats.Hot = { ...STATS, temperament: 2 };
    w.stats.Cool = { ...STATS, temperament: 8 };
    deliverInterviews([rec([{ who: 'Hot', stance: 'drag', still: false, heat: 1 },
      { who: 'Cool', stance: 'drag', still: false, heat: 1 }, { who: 'Pal', stance: 'praise', still: false, heat: 1 }])],
    { at: 3, canHear: () => true, ops: w.ops });
    expect(w.bond('Ava', 'Hot')).toBeLessThan(w.bond('Ava', 'Cool'));
    expect(w.bond('Ava', 'Pal')).toBeGreaterThan(0);
  });

  it('recording moves the guest and the people named who are still in', () => {
    const w = world();
    w.pop.Ava = 2;
    const r = rec([{ who: 'Ben', stance: 'drag', still: true, heat: 1 },
      { who: 'Cleo', stance: 'praise', still: true, heat: 1 }], { reception: 'warm', mood: 'gracious' });
    applyRecording(r, w.ops);
    expect(w.pop.Ava).toBeGreaterThan(2);
    expect(w.pop.Ben).toBeLessThan(0);
    expect(w.pop.Cleo).toBeGreaterThan(0);
    expect(r.effects.popularity.Ben).toBe(w.pop.Ben);
  });

  it('the tape costs only the flippers the guest never suspected', () => {
    const w = world();
    applyRecording(rec([], { truth: { flippers: ['Cleo', 'Ben'], suspected: ['Ben'], right: true } }), w.ops);
    expect(w.bond('Ava', 'Cleo')).toBeLessThan(0);
    expect(w.bond('Ava', 'Ben')).toBe(0);
  });

  it('heardAbout lists only what reached them', () => {
    const r = rec([{ who: 'Ben', stance: 'drag', still: false, heat: 1 }]);
    expect(heardAbout([r], 'Ben')).toEqual([]);
    r.heardBy.Ben = 5;
    expect(heardAbout([r], 'Ben')).toEqual([{ id: 'r1', from: 'Ava', stance: 'drag' }]);
  });
});
