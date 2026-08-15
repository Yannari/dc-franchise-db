// Pure Chance has to STAY pure.
//
// This competition's whole job is to be the week nobody can plan, and it has
// already been broken once in exactly the way that is hardest to notice: it
// carried a stat profile described in its own comment as "almost inert", and
// it was not inert. A well-suited houseguest genuinely won it more often while
// the screen printed weight bars under a description promising that nobody
// could be better at it. Both could not be true.
//
// A ranked board looks identical either way, so the only thing that catches a
// relapse is measuring it: a cast split into four houseguests on the floor of
// every stat and four on the ceiling must win this competition equally often.
// Anything that creeps in — an aptitude term, a nerve check, a re-drop
// decision, a have-not drag — shows up here and nowhere else.
//
// The rest guards the structure the rebuild added: the drops are sequential
// against a standing number, which is the only drama a crapshoot has.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';
import { rpBuildBBComp, _tvState } from '../js/vp-screens.js';

const ID = 'bb-luck-draw';
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const flat = v => Object.fromEntries(STAT_KEYS.map(k => [k, v]));
const NAMES = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
// Four houseguests on the floor of every stat, four on the ceiling.
const SPLIT = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: flat(i < 4 ? 1 : 10) }));
const MAXED = new Set(NAMES.slice(4));
const rngFor = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const boot = (cast = SPLIT) => {
  seedGame(cast, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, haveNots: [] };
  gs.popularity = {};
  seasonConfig.romance = 'off';
  NAMES.forEach(n => { gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
    timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 }; });
};

const play = (seed, opts = {}) => runBBCompetition({
  type: opts.type || 'hoh', participants: NAMES.slice(0, opts.size || 8), house: NAMES,
  library: BB_COMPETITIONS, forcedId: ID, rng: rngFor(seed),
  week: { num: 4, houseAtStart: NAMES },
  nominees: opts.nominees || [NAMES[1]], hoh: NAMES[0],
  haveNots: opts.haveNots || [],
});

describe('Pure Chance', () => {
  beforeEach(() => boot());

  it('declares nothing to be good at, and means it', () => {
    const comp = BB_COMPETITIONS.find(c => c.id === ID);
    expect(comp.pureChance, 'the have-not contract reads this flag').toBe(true);
    // Not "small weights" — none. A profile here is the bug, not a tuning knob.
    expect(comp.stats == null || Object.keys(comp.stats).length === 0,
      `Pure Chance has grown a stat profile: ${JSON.stringify(comp.stats)}`).toBe(true);
    expect(comp.spreadStat, 'a spread stat is still a stat').toBeFalsy();
  });

  it('the best houseguests in the house win it exactly as often as the worst', () => {
    const N = 600;
    let maxedWins = 0;
    for (let s = 0; s < N; s++) {
      boot();
      // Slop on one of each half, so a leaked have-not drag would also show.
      const r = play(s * 31 + 7, { haveNots: [NAMES[2], NAMES[6]] });
      if (MAXED.has(r.winner)) maxedWins++;
    }
    const share = maxedWins / N;
    // Four of eight. Three sigma on 600 draws is about ±6 points; anything
    // outside this band is a skill term, not a run of luck.
    expect(share, `the maxed-out half won ${(share * 100).toFixed(1)}% — something is rewarding stats`)
      .toBeGreaterThan(0.44);
    expect(share, `the maxed-out half won ${(share * 100).toFixed(1)}% — something is rewarding stats`)
      .toBeLessThan(0.56);
  });

  it('charges nothing for slop and reports nobody as throwing it', () => {
    for (let s = 0; s < 30; s++) {
      boot();
      const r = play(s * 13 + 5, { haveNots: [NAMES[0], NAMES[3], NAMES[7]] });
      const bd = r.breakdown || r.debug?.scoreBreakdown || {};
      for (const [name, row] of Object.entries(bd)) {
        expect(row.haveNotPenalty || 0, `${name} was charged for slop`).toBe(0);
        expect(row.threw, `${name} was reported as throwing a ball they cannot steer`).toBe(false);
        expect(row.base, `${name} was credited with aptitude`).toBe(0);
      }
    }
  });

  it('drops one at a time, in the drawn order, against a standing number', () => {
    for (const seed of [11, 404, 9001]) {
      boot();
      const r = play(seed);
      expect(r.detail.steps.length).toBe(r.beats.length);
      const drops = r.detail.steps.filter(s => s.kind === 'drop');
      expect(drops.length, 'not everybody dropped exactly once').toBe(8);
      // In the drawn order, and the order is the one the screen is shown.
      expect(drops.map(d => d.who)).toEqual(r.detail.order);
      // The standing number only ever goes up.
      const leads = drops.map(d => d.leadValue);
      expect(leads, 'the number to beat went backwards').toEqual([...leads].sort((a, b) => a - b));
      // And it is somebody's actual ball, never an invented figure.
      const bd = r.breakdown || r.debug?.scoreBreakdown || {};
      for (const d of drops) expect(d.value).toBe(bd[d.who].score);
    }
  });

  it('settles a tie with a drop-off rather than a countback', () => {
    for (let s = 0; s < 200; s++) {
      boot();
      const r = play(s * 17 + 3);
      if (!r.detail.dropOffs) continue;
      const tie = r.detail.steps.find(st => st.kind === 'tie');
      expect(tie.who.length, 'a drop-off with nobody in it').toBeGreaterThan(1);
      // Everybody tied drops again, and exactly one person comes out of it.
      const again = r.detail.steps.filter(st => st.kind === 'tie-drop' && st.round === 1);
      expect(again.length).toBe(tie.who.length);
      // The winner is one of the tied, and their RECORDED score is still the
      // ball they landed — a tiebreak decides a tie, it does not award points.
      expect(tie.who).toContain(r.winner);
      const bd = r.breakdown || r.debug?.scoreBreakdown || {};
      expect(bd[r.winner].score).toBe(tie.at);
      return;
    }
    throw new Error('no tie in 200 competitions — the board may have stopped colliding');
  });

  it('an Invisible HOH night airs the board and not the slots', () => {
    boot();
    const r = play(4242);
    const act = { type: 'hoh', secret: true, winner: r.winner, participants: r.participants,
      results: r.placements.map(n => ({ name: n, score: r.scores[n] })), competition: r };
    const ep = { num: 4, acts: [act] };
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    rpBuildBBComp(ep, 'hoh');
    Object.keys(_tvState).filter(k => k.startsWith('bb_sig_')).forEach(k => { _tvState[k].idx = 999; });
    const html = rpBuildBBComp(ep, 'hoh') || '';
    expect(html, 'fell back to the generic board').not.toContain('bbc-what');
    expect(html).toContain('ONLY YOU KNOW');
    const before = html.slice(0, html.indexOf('ONLY YOU KNOW'));
    // The slot values ARE the scoreboard, and a chip on the board is a score.
    for (const v of r.detail.board) {
      expect(before, `a sealed board printed the ${v} slot`).not.toContain(`>${v}<`);
    }
    expect(before.match(/circle cx="[\d.]+" cy="[\d.]+" r="5"/g) || [],
      'a sealed board left chips in the slots').toEqual([]);
  });

  it('survives a short field', () => {
    for (const size of [2, 3]) {
      boot();
      const r = play(size * 61, { size });
      expect(r.placements).toHaveLength(size);
      expect(r.detail.steps.length).toBe(r.beats.length);
      expect(r.winner).toBeTruthy();
    }
  });
});
