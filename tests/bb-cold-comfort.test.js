// Cold Comfort runs a night, and the night has decisions in it.
//
// The competition it replaced was one scored roll with drop lines on it, and
// the rewrite's whole claim is that the night is simulated: hours pass, people
// choose to step off, and three offers are put to a yard full of freezing
// people who can take them. Every one of those is invisible from the outside —
// a competition that quietly stopped offering anything, or offered everything
// every week, or whose end-of-night deal never once fired, would still return
// a perfectly valid ranked board and every other test in the suite would pass.
//
// The deal is here because it DID silently never fire: written as a branch
// after the hour loop, it was unreachable, because the loop always drains the
// yard to exactly one before it exits. Two hundred nights with a cast who were
// all each other's allies produced zero deals and nothing said so.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { addBond, getBond } from '../js/bonds.js';
import { seedGame } from './helpers/setup.js';
import { rpBuildBBComp, _tvState } from '../js/vp-screens.js';

const ID = 'bb-endurance-soak';
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase', 'Scary Girl', 'Nichelle',
  'Axel', 'Zee', 'Brightly', 'Hicks', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const rngFor = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const boot = () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, haveNots: [] };
  gs.popularity = {};
  seasonConfig.romance = 'off';
  NAMES.forEach(n => { gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
    timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 }; });
};

const play = (seed, opts = {}) => runBBCompetition({
  type: opts.type || 'hoh', participants: NAMES.slice(0, opts.size || 8), house: NAMES,
  library: BB_COMPETITIONS, forcedId: ID, rng: rngFor(seed),
  week: opts.week || { num: 4, houseAtStart: NAMES },
  nominees: opts.nominees || [NAMES[1], NAMES[5]], hoh: NAMES[0],
  haveNots: opts.haveNots || [],
});

describe('Cold Comfort runs a night', () => {
  beforeEach(boot);

  it('takes hours, and narrates one card per thing that happened', () => {
    for (const seed of [11, 402, 7788]) {
      boot();
      const r = play(seed);
      expect(r.detail.hours, `seed ${seed}: resolved without a night`).toBeGreaterThan(2);
      // The screen walks beats and steps as pairs; if they ever drift apart it
      // draws the wrong clock over the wrong card.
      expect(r.detail.steps.length).toBe(r.beats.length);
      expect(r.detail.steps.some(s => s.kind === 'hour')).toBe(true);
      expect(r.placements).toHaveLength(8);
    }
  });

  it('does not run the same three offers every single week', () => {
    const seen = new Set();
    for (let s = 0; s < 60; s++) {
      boot();
      seen.add((play(s * 13 + 1).detail.offers || []).join(','));
    }
    // A fixture is not a temptation. If every night carries an identical set,
    // the house learns the schedule and the offers stop being events.
    expect(seen.size, `every night ran the same offers: ${[...seen]}`).toBeGreaterThan(1);
  });

  it('offers get taken, and taking one costs something real', () => {
    let takes = 0;
    for (let s = 0; s < 120 && takes < 1; s++) {
      boot();
      const before = { ...gs.popularity };
      const r = play(s * 29 + 5, { haveNots: [NAMES[3], NAMES[7]] });
      const take = (r.detail.steps || []).find(st => st.kind === 'take');
      if (!take) continue;
      takes++;
      // Whoever took it is off the yard and placed accordingly, and the house
      // registered it — an offer nothing downstream reads is a caption.
      expect(r.winner).not.toBe(take.who);
      expect(gs.popularity[take.who] ?? 0).not.toBe(before[take.who] ?? 0);
      const memories = gs.bb.competitionMemories?.[take.who] || [];
      expect(memories.map(m => m.type).some(t => t.startsWith('cold-'))).toBe(true);
    }
    expect(takes, 'no offer was taken in 120 nights').toBe(1);
  });

  it('feeding the house really ends the slop week', () => {
    for (let s = 0; s < 200; s++) {
      boot();
      const week = { num: 4, houseAtStart: NAMES, haveNots: [NAMES[3], NAMES[7]] };
      const r = play(s * 17 + 9, { type: 'veto', week, haveNots: [NAMES[3], NAMES[7]] });
      if (!(r.detail.steps || []).some(st => st.kind === 'fed')) continue;
      // Both lists, because later competitions read the week's own copy and
      // house events read the global one. Clearing only one is worse than
      // clearing neither: half the engine would still think they are on slop.
      expect(week.haveNots, 'the week still thinks the house is on slop').toEqual([]);
      expect(gs.bb.haveNots, 'gs still thinks the house is on slop').toEqual([]);
      return;
    }
    throw new Error('the house was never fed in 200 slop weeks');
  });

  it('the last two settle it themselves when they are allies', () => {
    let deals = 0;
    for (let s = 0; s < 120; s++) {
      boot();
      NAMES.forEach((a, i) => NAMES.slice(i + 1).forEach(b => addBond(a, b, 7)));
      const r = play(s * 41 + 3);
      if (r.detail.finished !== 'deal') continue;
      deals++;
      const deal = r.detail.steps.find(st => st.kind === 'deal');
      expect(deal.ally).toBe(r.winner);
      expect(getBond(deal.who, deal.ally)).toBeGreaterThan(0);
      const stepped = gs.bb.competitionMemories?.[deal.who] || [];
      expect(stepped.some(m => m.type === 'stepped-down-for-ally')).toBe(true);
    }
    expect(deals, 'an all-allies cast never once talked it out').toBeGreaterThan(0);
  });

  it('an Invisible HOH night airs the competition and not the result', () => {
    boot();
    const r = play(4242, { size: 10 });
    const act = { type: 'hoh', secret: true, winner: r.winner, participants: r.participants,
      results: r.placements.map(n => ({ name: n, score: r.scores[n] })), competition: r };
    const ep = { num: 4, acts: [act] };
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    rpBuildBBComp(ep, 'hoh');
    Object.keys(_tvState).filter(k => k.startsWith('bb_sig_')).forEach(k => { _tvState[k].idx = 999; });
    const html = rpBuildBBComp(ep, 'hoh') || '';

    expect(html, 'sealed night fell back to the generic board').not.toContain('bbc-what');
    expect(html).toContain('ONLY YOU KNOW');

    // Everybody's name is on the platform row and that is not a leak. What
    // WOULD leak is subtraction: an elimination format names its winner the
    // moment one platform is left lit. So the cut has to land while several
    // people are still standing, and no number may be printed anywhere — the
    // core readings rank the field however they are styled.
    const before = html.slice(0, html.indexOf('ONLY YOU KNOW'));
    const out = (before.match(/cc-hg is-out/g) || []).length;
    expect(r.participants.length - out,
      'the feed cut late enough to name the winner by subtraction').toBeGreaterThanOrEqual(3);
    // Not just the labels: the column FILL is the core temperature, so a live
    // bar publishes the ranking in CSS while the text says nothing.
    expect(before, 'a sealed board printed a core reading').not.toMatch(/class="cc-t[^"]*">\s*\d+%/);
    expect(before, 'a sealed board printed an hour count').not.toMatch(/<em>\d+h<\/em>/);
    const fills = [...before.matchAll(/cc-col"><b style="height:(\d+)%/g)]
      .map(m => Number(m[1])).filter(h => h > 0);
    expect(new Set(fills).size, 'the columns ranked the field by height').toBeLessThanOrEqual(1);
  });

  it('nobody is dragged off when the yard is too small to afford it', () => {
    // The ugly offer removes TWO people at once. On a short field that does not
    // complicate the competition, it decides it.
    for (let s = 0; s < 80; s++) {
      boot();
      const r = play(s * 23 + 2, { size: 4, nominees: [NAMES[1]] });
      expect((r.detail.steps || []).some(st => st.kind === 'dragged'),
        `seed ${s}: somebody was dragged off a four-person yard`).toBe(false);
    }
  });
});
