// Part two of the final HOH reaches its own screen, and the screen tells the
// truth about the race.
//
// This one is outside the guard that covers every other themed competition:
// `bb-sig-screens-render` walks comps by their hoh/veto slots, and a finale set
// piece declares `types: ['final']`, so it is skipped there and always would
// be. The finale reaches a board by a different road — a `final-hoh-part` act
// is re-labelled to `hoh` and handed to rpBuildBBComp — and nothing was
// checking that road at all.
//
// The screen's claim is specific and worth pinning: it draws both runs on one
// timeline at their true widths in seconds, which is the thing neither
// houseguest was allowed to see. If the bars ever stop being proportional, the
// picture is a lie that looks exactly like a picture.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';

const ID = 'bb-final-part-two';
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase'];
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

const run = seed => runBBCompetition({
  type: 'final', participants: ['Bowie', 'Wayne'], house: NAMES,
  library: BB_COMPETITIONS, forcedId: ID, rng: rngFor(seed),
  week: { num: 9, houseAtStart: NAMES },
});

/** The finale's own act shape, so this exercises the real road to the screen. */
const finaleScreen = (comp, at = 999) => {
  const ep = {
    num: 9, format: 'big-brother', houseAtStart: NAMES,
    acts: [{
      type: 'final-hoh-part', part: 'part two', partNum: 2,
      participants: comp.participants || comp.placements,
      winner: comp.winner, competition: comp,
    }],
  };
  Object.keys(_tvState).forEach(k => delete _tvState[k]);
  buildVPScreens(ep);
  Object.keys(_tvState).filter(k => k.startsWith('bb_sig_run_')).forEach(k => { _tvState[k].idx = at; });
  const screen = buildVPScreens(ep).find(s => /final-hoh/.test(s.id));
  return screen?.html || '';
};

/** Every segment block the screen drew for a lane, in order, as widths. */
const laneWidths = (html, laneIdx) => {
  const lanes = html.split('class="fr-lane"').slice(1);
  const lane = lanes[laneIdx] || '';
  return [...lane.matchAll(/class="fr-seg[^"]*"\s*\n?\s*style="width:([\d.]+)%/g)].map(m => Number(m[1]));
};

describe('The Run gets the ghost race, through the finale', () => {
  beforeEach(boot);

  it('the finale draws the themed screen, not the generic board', () => {
    const comp = run(3);
    const html = finaleScreen(comp);
    expect(html, 'no finale screen was built').toBeTruthy();
    expect(html, 'the finale fell back to the generic competition board').not.toContain('bbc-what');
    expect(html, 'the themed screen did not draw').toContain('sigrun');
    for (const name of ['Bowie', 'Wayne']) expect(html).toContain(name);
  });

  it('both runs are drawn at their true widths in seconds', () => {
    for (const seed of [3, 44, 512]) {
      boot();
      const comp = run(seed);
      const html = finaleScreen(comp);
      const bd = comp.breakdown || comp.debug?.scoreBreakdown || {};
      const runners = comp.detail.runners;
      // The longest finished run sets the scale; every block is its share of it.
      const longest = Math.max(...runners.map(n => bd[n].splits.reduce((t, s) => t + s.seconds, 0)));

      runners.forEach((name, i) => {
        const widths = laneWidths(html, i);
        const splits = bd[name].splits;
        // One block per section, plus one extra wherever a penalty was welded on.
        const penalties = splits.filter(s => s.penalty > 0).length;
        expect(widths.length, `${name}: wrong number of blocks`).toBe(splits.length + penalties);

        let w = 0;
        for (const s of splits) {
          const clean = s.seconds - (s.penalty || 0);
          expect(widths[w], `${name}/${s.segment}: block is not its share of the clock`)
            .toBeCloseTo((clean / longest) * 100, 1);
          w++;
          if (s.penalty > 0) {
            expect(widths[w], `${name}/${s.segment}: penalty block is the wrong width`)
              .toBeCloseTo((s.penalty / longest) * 100, 1);
            w++;
          }
        }
      });
    }
  });

  it('shows each runner where the other one finished — which neither could see', () => {
    const comp = run(3);
    const html = finaleScreen(comp);
    // One ghost marker per lane, and it carries the other runner's clock.
    const ghosts = [...html.matchAll(/class="fr-ghost"/g)];
    expect(ghosts.length, 'no ghost markers drawn').toBe(2);
    expect(html).toMatch(/Bowie \d+:\d\d/);
    expect(html).toMatch(/Wayne \d+:\d\d/);
  });

  it('a race lost on the rules shows a penalty wider than the margin', () => {
    // The competition's signature outcome: the faster houseguest loses because
    // of a rules error. The screen's job is to make that visible without
    // anybody reading a word, so the red block has to out-measure the gap.
    for (let s = 1; s < 400; s++) {
      boot();
      const comp = run(s);
      const times = comp.detail.steps.find(x => x.kind === 'times');
      if (!times?.stolen) continue;
      const bd = comp.breakdown || comp.debug?.scoreBreakdown || {};
      const loser = times.other;
      const penalty = bd[loser].misread.penalty;
      expect(penalty, 'a stolen race with no penalty behind it').toBeGreaterThan(times.margin);
      const html = finaleScreen(comp);
      expect(html, 'the penalty block was not drawn').toContain('is-pen');
      expect(html).toContain(`+${penalty}s`);
      return;
    }
    throw new Error('no rules-lost race in 400 runs');
  });

  it('one step per beat, and it declines on a finale saved before the rebuild', () => {
    const comp = run(9);
    expect(comp.detail.steps.length).toBe(comp.beats.length);
    // An old save has beats and no steps; the screen must stand aside rather
    // than draw an empty rig.
    const old = { ...comp, detail: null };
    const html = finaleScreen(old);
    expect(html, 'the screen drew itself with no run data').not.toContain('sigrun');
    expect(html, 'and something still covered the slot').toBeTruthy();
  });
});
