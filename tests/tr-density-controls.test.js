// ══════════════════════════════════════════════════════════════════════
// tr-density-controls.test.js — the author's episode-length control, and
// whether the number it promises is the number they get
// ══════════════════════════════════════════════════════════════════════
//
// A setting that claims to change episode length has exactly two ways to be
// wrong, and both of them are invisible from reading the code:
//
//   1. IT DOES NOTHING. The budget scales, the pool has nothing eligible left
//      to fire into it, and the episodes come out the same length. This is not
//      hypothetical — it is what Extended does at the top of its range, and the
//      measurement is in js/tr-density.js's header: factor 1.75 gives 101.5
//      cards, factor 4.0 gives 103.8. More than doubling the budget bought two
//      cards.
//
//   2. IT LIES ABOUT THE NUMBER. The estimator is arithmetic and the season is
//      a simulation, and nothing forces them to agree. The first cut predicted
//      116 cards for Extended at cast 18 and delivered 101.5 — a 14% overclaim
//      shown to the author as a firm figure.
//
// So the arms below MEASURE. They play real seasons, count the reveal cards
// the visual player would actually page through (`id="xx-step-…"`, the unit a
// viewer clicks), and check the estimator against that rather than against
// itself.
//
// AND THE ONE THAT MATTERS MOST IS THE DEFAULT. The castle draws from a seeded
// rng stream, so a season is reproducible from its seed and one added or
// removed draw re-rolls every castle day after it. `scaledRange` returns its
// input untouched at factor 1 for that reason. The bit-identity arm compares an
// unset config against an explicit 'full' — if that ever diverges, every stored
// season in the project has silently changed.
//
// FILENAME: not `*-audit.test.js`, which vitest.config.js excludes from
// `npm test`.
import { describe, expect, it } from 'vitest';
import { gs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { traitorsScreens } from '../js/vp-tr/screens.js';
import { CASTLE_PHASE_BUDGETS } from '../js/tr/castle/phases.js';
import {
  TR_DENSITY_LEVELS, TR_DENSITY_IDS, TR_DENSITY_DEFAULT, densityLevel,
  densityFactor, densityEffective, scaledRange, traitorsEstimatedCards,
  traitorsDensitySummary,
} from '../js/tr-density.js';
import roster from '../franchise_roster.json';
// The real event pool. Without these the castle fires nothing and every
// density measures zero — true, and useless.
import '../js/tr/castle/trust.js';
import '../js/tr/castle/suspicion.js';
import '../js/tr/castle/grief.js';
import '../js/tr/castle/cover.js';
import '../js/tr/castle/romance.js';
import '../js/tr/castle/callback.js';
import '../js/tr/castle/testing.js';
import '../js/tr/castle/journey.js';
import '../js/tr/castle/mission-fallout.js';
import '../js/tr/castle/consequences.js';
import '../js/tr/castle/nightfall.js';

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

/** A reveal card: the thing the viewer clicks through, counted the same way
 *  js/tr-density.js's calibration counted them. */
const cards = html => (String(html).match(/id="[a-z]{2,3}-step-/g) || []).length;

/** Play a sweep at one density and return the per-episode card counts. */
function sweep(size, density) {
  const R = roster.players.slice(0, size);
  const all = [];
  const digest = [];
  for (const seed of SEEDS) {
    setPlayers(R);
    seasonConfig.trShieldSource = 'mission';
    if (density === undefined) delete seasonConfig.trDensity;
    else seasonConfig.trDensity = density;
    playTraitorsSeason({ cast: R.map(p => p.name), traitorCount: 3, seed });
    for (const row of (gs.episodeHistory || [])) {
      if (!row.tr) continue;
      let n = 0;
      for (const s of traitorsScreens(row, 'audience')) n += cards(s.html);
      all.push(n);
      // The season's own shape, for the bit-identity arm: who went, how, when.
      digest.push(`${row.num}:${(row.tr.dawn?.lastNight || [])
        .map(x => x.name + '/' + x.verb).join(',')}|${row.tr.table?.banished || '-'}`);
    }
  }
  const mean = all.reduce((a, b) => a + b, 0) / all.length;
  return { n: all.length, mean, digest: digest.join(';') };
}

// Played once and shared — a sweep is eight seasons and they are not cheap.
const AT = {
  '18:unset': sweep(18, undefined),
  '18:full': sweep(18, 'full'),
  '18:compact': sweep(18, 'compact'),
  '18:extended': sweep(18, 'extended'),
  '10:full': sweep(10, 'full'),
  '10:compact': sweep(10, 'compact'),
};

// ── the registry itself ───────────────────────────────────────────────
describe('the density registry', () => {
  it('offers three levels, shortest first, with the default among them', () => {
    expect(TR_DENSITY_IDS).toEqual(['compact', 'full', 'extended']);
    expect(TR_DENSITY_IDS).toContain(TR_DENSITY_DEFAULT);
    expect(densityFactor(TR_DENSITY_DEFAULT)).toBe(1);
    const factors = TR_DENSITY_LEVELS.map(d => d.factor);
    expect(factors, 'levels are not ordered shortest first')
      .toEqual([...factors].sort((a, b) => a - b));
  });

  it('every level has a blurb an author can act on', () => {
    for (const d of TR_DENSITY_LEVELS) {
      expect(d.blurb.length, `${d.id} has no usable blurb`).toBeGreaterThan(60);
      expect(d.label.length).toBeGreaterThan(2);
      expect(typeof d.effective, `${d.id} has no measured effect`).toBe('number');
    }
  });

  it('an unknown density falls back to the default rather than throwing', () => {
    expect(densityLevel('nonsense').id).toBe(TR_DENSITY_DEFAULT);
    expect(densityFactor(undefined)).toBe(1);
    expect(densityEffective('nonsense')).toBe(1);
  });

  it('scaledRange is EXACT at factor 1 and never budgets a phase to nothing', () => {
    for (const b of CASTLE_PHASE_BUDGETS) {
      // The identity that protects every stored season.
      expect(scaledRange(b.min, b.max, 1), `${b.id} is perturbed at factor 1`)
        .toEqual([b.min, b.max]);
      for (const f of [0.05, 0.45, 1.75, 4]) {
        const [lo, hi] = scaledRange(b.min, b.max, f);
        expect(lo, `${b.id} at x${f} budgets a phase below one scene`)
          .toBeGreaterThanOrEqual(1);
        expect(hi).toBeGreaterThanOrEqual(lo);
      }
    }
  });
});

// ── the default may not have moved ────────────────────────────────────
describe('the default season is untouched by the existence of this control', () => {
  it('an unset density plays the SAME SEASON as an explicit full', () => {
    // Not just the same length — the same exits, in the same order, on the
    // same nights. A castle scene changes bonds, and bonds decide ballots.
    expect(AT['18:unset'].digest).toBe(AT['18:full'].digest);
    expect(AT['18:unset'].n).toBe(AT['18:full'].n);
    expect(AT['18:unset'].mean).toBe(AT['18:full'].mean);
  });
});

// ── it actually does something, and in the right direction ────────────
describe('density measurably moves episode length', () => {
  it('compact is shorter than full, and full than extended', () => {
    expect(AT['18:compact'].mean).toBeLessThan(AT['18:full'].mean);
    expect(AT['18:full'].mean).toBeLessThan(AT['18:extended'].mean);
    expect(AT['10:compact'].mean).toBeLessThan(AT['10:full'].mean);
  });

  it('the movement is big enough to be worth a control', () => {
    // Compact must buy a real cut, not a rounding difference. Measured ~11%.
    const cut = 1 - AT['18:compact'].mean / AT['18:full'].mean;
    expect(cut, `compact only cuts ${(cut * 100).toFixed(1)}%`).toBeGreaterThan(0.05);
  });

  it('a bigger castle is a longer episode at every density', () => {
    expect(AT['18:full'].mean).toBeGreaterThan(AT['10:full'].mean);
    expect(AT['18:compact'].mean).toBeGreaterThan(AT['10:compact'].mean);
  });
});

// ── and the number the author is shown is the number they get ─────────
describe('the estimator is calibrated against played seasons', () => {
  it('predicts each measured sweep within 8%', () => {
    const check = (key, size, id) => {
      const est = traitorsEstimatedCards(size, id).typical;
      const got = AT[key].mean;
      const err = Math.abs(est - got) / got;
      expect(err, `${key}: estimate ${est}, measured ${got.toFixed(1)} `
        + `(${(err * 100).toFixed(1)}% out)`).toBeLessThan(0.08);
    };
    check('18:compact', 18, 'compact');
    check('18:full', 18, 'full');
    check('18:extended', 18, 'extended');
    check('10:full', 10, 'full');
    check('10:compact', 10, 'compact');
  });

  it('the estimate is ordered the way the measurements are', () => {
    const t = id => traitorsEstimatedCards(18, id).typical;
    expect(t('compact')).toBeLessThan(t('full'));
    expect(t('full')).toBeLessThan(t('extended'));
  });

  it('splits the total into the part the control moves and the part it cannot', () => {
    const e = traitorsEstimatedCards(18, 'full');
    expect(e.castle + e.fixed).toBe(e.typical);
    // The measured share is 26-30%. If a future change lets density reach the
    // spine, this is the arm that notices.
    const share = e.castle / e.typical;
    expect(share, `castle is ${(share * 100).toFixed(0)}% of an episode`)
      .toBeGreaterThan(0.2);
    expect(share).toBeLessThan(0.4);
    expect(e.low).toBeLessThan(e.typical);
    expect(e.high).toBeGreaterThan(e.typical);
  });

  it('the summary says the count AND the share it can move', () => {
    const s = traitorsDensitySummary(18, 'full');
    expect(s).toMatch(/\d+ cards/);
    expect(s).toMatch(/castle scenes/);
    // The honest half: an author must be told the control reaches only part.
    expect(s).toMatch(/the night itself/);
  });
});

// ── the record carries the density it was played at ───────────────────
describe('a replayed episode reports its own density, not the current setting', () => {
  it('every castle record carries the density and its scaled budgets', () => {
    const R = roster.players.slice(0, 14);
    setPlayers(R);
    seasonConfig.trDensity = 'compact';
    playTraitorsSeason({ cast: R.map(p => p.name), traitorCount: 3, seed: 3 });
    const rows = (gs.episodeHistory || []).filter(r => r.tr?.castle);
    expect(rows.length).toBeGreaterThan(3);
    for (const r of rows) {
      const d = r.tr.castle.density;
      expect(d, `ep ${r.num} has no density on its record`).toBeTruthy();
      expect(d.id).toBe('compact');
      expect(d.factor).toBe(densityFactor('compact'));
      expect(d.budgets.map(b => b.id)).toEqual(CASTLE_PHASE_BUDGETS.map(b => b.id));
      for (const b of d.budgets) {
        const src = CASTLE_PHASE_BUDGETS.find(x => x.id === b.id);
        expect([b.min, b.max]).toEqual(scaledRange(src.min, src.max, d.factor));
      }
    }
    // AND THE POINT OF STORING IT: changing the live setting afterwards must
    // not rewrite what those episodes say they were played at.
    seasonConfig.trDensity = 'extended';
    expect(rows[0].tr.castle.density.id).toBe('compact');
    delete seasonConfig.trDensity;
  });
});
