// The rankings builder, per show.
//
// It ran a Total Drama rubric over a Big Brother season: two competition
// columns for a game with three, an advantage lifecycle labelled for idols,
// and a legend hardcoded to "Imm +0.8 / Rew +0.3" underneath headers that had
// been relabelled to HOH and Veto. Every Block Buster in a season scored zero.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { computeScore, scoreTier, placementPct, RU_ADV, RU_ALLY, RU_SHOW }
  from '../js/rankings-update.js';
import { SHOWS } from '../js/shows.js';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(process.cwd(), 'js/rankings-update.js'), 'utf8');

describe('the rankings builder knows which show it is ranking', () => {
  it('gives Big Brother its third competition', () => {
    const bb = SRC.slice(SRC.indexOf("'big-brother': {"), SRC.indexOf('};', SRC.indexOf("'big-brother': {")));
    expect(bb, 'no third competition column for the house').toMatch(/comp3:\s*\{/);
    expect(bb).toMatch(/Arena|Block/i);
    const td = SRC.slice(SRC.indexOf("'total-drama': {"), SRC.indexOf("'big-brother': {"));
    expect(td, 'Total Drama must not gain a column it cannot fill').toMatch(/comp3:\s*null/);
  });

  it('scores that third competition instead of ignoring it', () => {
    expect(SRC, 'comp3 is declared but never scored').toMatch(/_rub\.comp3\s*\?\s*num\(p\.comp3Wins\)/);
  });

  it('reads it off the house record when a season is loaded', () => {
    // Behaviour, not source text. This used to assert the literal
    // `comp3: isHouse ? (p.bb?.blockBusterWins` — a guard that would have gone
    // quietly green the moment that ternary was replaced, which is exactly
    // what happened when a third show arrived and the ternary had to go.
    const cols = RU_SHOW['big-brother'].read(
      { bb: { hohWins: 3, vetoWins: 4, blockBusterWins: 2, timesOnBlock: 3, powersWon: 1,
        powersPlayed: 1, powersWasted: 0, powersHeld: 0 } }, { placement: 10 });
    expect(cols.comp3, 'arena wins still score nothing').toBe(2);
    expect(cols.comp1).toBe(3);
    expect(cols.comp2).toBe(4);
    // Nominated three times, kept twice: the third is the night that ended it.
    expect(cols.social).toBe(2);
  });

  it('gives every registered show a reader of its own', () => {
    // The rule, over the registry, so a fourth show cannot quietly inherit
    // Total Drama's field names and auto-fill every column with zero — which
    // is what an `isHouse ? A : B` did to Big Brother for a whole season and
    // then to The Traitors.
    for (const format of Object.keys(SHOWS)) {
      const rub = RU_SHOW[format];
      expect(rub, `${format} has no rubric — it will be ranked as Total Drama`).toBeTruthy();
      expect(typeof rub.read, `${format} declares no reader`).toBe('function');
      // An empty placement must read as zeroes and never as undefined: an
      // undefined column reaches the scorer as NaN and poisons the whole score.
      const empty = rub.read({}, { placement: 5 });
      for (const [key, value] of Object.entries(empty)) {
        expect(Number.isFinite(value), `${format}.read().${key} is not a number`).toBe(true);
      }
    }
  });

  it("does not read one show through another show's field names", () => {
    // A Traitors placement carries `tr`, a house placement carries `bb`, and a
    // camp writes its numbers at the top level. Handing each reader ANOTHER
    // show's placement must produce nothing, or the columns are being filled
    // from whatever happens to be lying around.
    const houseRow = { bb: { hohWins: 3, vetoWins: 4, blockBusterWins: 2, powersWon: 2 } };
    const castleRow = { tr: { shieldsWon: 2, missionsWon: 5, reads: 3, wanted: 4, daggersWon: 1 } };
    const campRow = { immunityWins: 3, rewardWins: 2, idolsFound: 1 };
    for (const [format, foreign] of [
      ['total-drama', houseRow], ['total-drama', castleRow],
      ['big-brother', campRow], ['big-brother', castleRow],
      ['traitors', campRow], ['traitors', houseRow],
    ]) {
      const cols = RU_SHOW[format].read(foreign, { placement: 5 });
      const scored = cols.comp1 + cols.comp2 + cols.comp3 + cols.advFound + cols.advPlayed;
      expect(scored, `${format} scored a foreign placement`).toBe(0);
    }
  });

  it('keeps the positional parser aligned with the columns', () => {
    // The row is read by index, so a new column shifts every field after it.
    // This is the failure that silently files veto wins under "advantages".
    const parser = SRC.slice(SRC.indexOf('immWins:       parseInt'), SRC.indexOf('overrideReason:'));
    const idx = [...parser.matchAll(/nums\[(\d+)\]/g)].map(m => Number(m[1]));
    const seen = [...new Set(idx)].sort((a, b) => a - b);
    expect(seen[0]).toBe(1);
    seen.forEach((n, i) => expect(n, `gap or repeat at index ${n}`).toBe(i + 1));
  });

  it('builds the legend from the rubric instead of restating it', () => {
    // The markup, not the comment explaining why the markup went away.
    expect(SRC, 'the legend can still disagree with the scorer')
      .not.toMatch(/<span>🏆 Imm \+0\.8<\/span>/);
    expect(SRC).not.toMatch(/<span>🎁 Rew \+0\.3<\/span>/);
    expect(SRC).toMatch(/function _ruRenderLegend/);
    expect(SRC).toMatch(/ru-legend-show/);
  });

  it('counts every competition toward a career total', () => {
    expect(SRC).toMatch(/row\.immWins\+row\.rewWins\+\(row\.comp3Wins\|\|0\)/);
  });
});

describe('loading the season that is open in the simulator', () => {
  // `extractSeasonTemplate()` is the TOTAL DRAMA builder and stamps
  // `format: 'total-drama'` on whatever it is handed. Pressing the button on
  // a Big Brother season therefore produced a Total Drama document: the board
  // relabelled itself back to Imm/Rew and then filled those columns from
  // immunityWins and rewardWins, which a house does not have. Every player
  // came out zero and the season ranked on placement alone.
  it('reaches for the house builder when the house is what is loaded', () => {
    expect(SRC).toMatch(/buildBigBrotherSeasonDocument/);
    const fn = SRC.slice(SRC.indexOf('function _ruUseCurrentSeason'),
      SRC.indexOf('let rankingsDB'));
    expect(fn, 'the button still always builds a Total Drama document')
      .toMatch(/houseNow[\s\S]*buildBigBrotherSeasonDocument[\s\S]*extractSeasonTemplate/);
    expect(fn, 'the house is detected from the format or the played weeks')
      .toMatch(/seasonConfig\?\.format === 'big-brother'|gs\?\.bb\?\.weeks/);
  });

  it('keeps the message the house builder gives an unfinished season', () => {
    const fn = SRC.slice(SRC.indexOf('function _ruUseCurrentSeason'),
      SRC.indexOf('let rankingsDB'));
    // 'play the finale before exporting' is actionable; swallowing it into
    // 'no season is loaded' sends somebody looking for the wrong problem.
    expect(fn).toMatch(/finale\|weeks/);
  });
});

describe('the published house document has what the board fills from', () => {
  it('carries the per-player tallies on a bb block', () => {
    const doc = JSON.parse(readFileSync(resolve(process.cwd(),
      'data/seasons/bb-1-data.json'), 'utf8'));
    expect(doc.format).toBe('big-brother');
    const p = doc.placements[0];
    for (const key of ['hohWins', 'vetoWins', 'blockBusterWins']) {
      expect(p.bb, `a placement with no ${key} fills the board with zeroes`)
        .toHaveProperty(key);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// THE CURVE.
//
// Everything above checks the wiring — that the house gets three competition
// columns and the legend quotes the scorer. None of it checked the one thing
// the board is for: whether winning things can actually move you.
//
// It could not. With `base = 30 + pct * 42`, one placement position was worth
// 2.6 points in a cast of 17 and a Head of Household was worth 0.6, so a
// season's play was a rounding error against finish order — the most decorated
// non-finalist of S1 (3 HOH, 4 vetoes, 3 arena wins, a power found and played)
// scored below three people above her who had done nothing. These lock the
// balance so it cannot quietly drift back.
// ─────────────────────────────────────────────────────────────────────────────
// THE SCORER, IMPORTED RATHER THAN EXTRACTED.
//
// This used to `cut()` four spans out of the source text and `new Function()`
// them, because the module was a page script. It is importable — the terms it
// needs are exported now — and the extraction was one more source-text guard
// that would go quietly green the day somebody renamed a marker. Everything
// below tests the scorer the site actually runs.
const S = { computeScore, scoreTier, placementPct, RU_ADV, RU_ALLY, RU_SHOW };

const CAST = 17;
/** A houseguest who did nothing but finish where they finished. */
function blank(S, place, over = {}) {
  return {
    allPcts: [S.placementPct(place, CAST)],
    wins: place === 1 ? 1 : 0, nonWinFinals: 0, numSeasons: 1, format: 'big-brother',
    immWins: 0, rewWins: 0, comp3Wins: 0,
    advFound: 0, advPlayed: 0, advWasted: 0, advHeld: 0,
    strategicScore: 0, alliances: 0, socialCol: 0,
    fanFav: false, quit: false, override: 0,
    castSize: CAST, isFinalist: place <= 3, ...over,
  };
}

describe('a season of play can move you off your finish', () => {
  it('prices one competition win at about one placement position', () => {
    // The law the rest of the formula is tuned against. It used to take more
    // than four Heads of Household to be worth finishing one spot higher.
    const perPlace = S.computeScore(blank(S, 8)) - S.computeScore(blank(S, 9));
    const veto = S.RU_SHOW['big-brother'].comp2.weight;
    expect(veto).toBeGreaterThan(perPlace * 0.75);
    expect(veto).toBeLessThan(perPlace * 1.35);
  });

  it('lets a decorated tenth out-score a passive seventh', () => {
    // Ireland against Gyselle, S1. This is the comparison the old curve got
    // backwards by two and a half points.
    const decorated = S.computeScore(blank(S, 10, {
      immWins: 3, rewWins: 4, comp3Wins: 3, advFound: 1, advPlayed: 1, alliances: 1,
    }));
    const passive = S.computeScore(blank(S, 7, { comp3Wins: 2, alliances: 4 }));
    expect(decorated).toBeGreaterThan(passive);
  });

  it('does not let it out-score the winner', () => {
    // Play has to matter, not decide. Whoever won the season stays on top.
    const decorated = S.computeScore(blank(S, 10, {
      immWins: 3, rewWins: 4, comp3Wins: 3, advFound: 1, advPlayed: 1, alliances: 1, socialCol: 2,
    }));
    const winner = S.computeScore(blank(S, 1, { immWins: 2, rewWins: 4, alliances: 3 }));
    expect(winner).toBeGreaterThan(decorated);
  });

  it('keeps a one-season winner short of the franchise ceiling', () => {
    // S+ is for careers. Doubling the competition weights must not hand it to
    // anyone who wins once with a good comp record.
    const winner = S.computeScore(blank(S, 1, { immWins: 2, rewWins: 4, alliances: 3 }));
    expect(S.scoreTier(winner)).toBe('S');
  });

  it('does not score the first boot as barely a franchise player', () => {
    // The floor was 30/100 for making the cast and going out first.
    expect(S.computeScore(blank(S, CAST))).toBeGreaterThan(38);
  });

  it('will not let four alliances outrank three competition wins', () => {
    // Felipe against Dylon, S1. Felipe's whole record was "in four alliances"
    // and he finished two spots higher; that used to be enough, by 0.3.
    const social = S.computeScore(blank(S, 9, { alliances: 4 }));
    const player = S.computeScore(blank(S, 11, {
      immWins: 2, rewWins: 1, advFound: 1, advPlayed: 1, alliances: 2,
    }));
    expect(player).toBeGreaterThan(social);
    // And the weight itself, since the pair above would survive a revert:
    // a maxed alliance count must stay worth less than one veto.
    expect(S.RU_ALLY.weight * S.RU_ALLY.cap)
      .toBeLessThan(S.RU_SHOW['big-brother'].comp2.weight);
  });

  it('reads the house social column as block survivals, not votes against', () => {
    // The same number in the same column, meaning opposite things per show.
    // Under the house rubric it can only ever help you.
    const kept = S.computeScore(blank(S, 9, { socialCol: 3 }));
    const never = S.computeScore(blank(S, 9, { socialCol: 0 }));
    expect(kept).toBeGreaterThan(never);
    expect(kept - never).toBeCloseTo(3 * S.RU_SHOW['big-brother'].social.weight, 5);
  });

  it('stops crediting a house that kept renominating the same pawn', () => {
    const cap = S.RU_SHOW['big-brother'].social.cap;
    expect(S.computeScore(blank(S, 9, { socialCol: cap + 4 })))
      .toBe(S.computeScore(blank(S, 9, { socialCol: cap })));
  });

  it('leaves Total Drama counting votes against', () => {
    // Total Drama has no block, so its column keeps the two-sided votes curve
    // and more votes must still cost you.
    const td = over => ({ ...blank(S, 9, over), format: 'total-drama' });
    expect(S.RU_SHOW['total-drama'].social.kind).toBe('votes');
    expect(S.computeScore(td({ socialCol: 12 })))
      .toBeLessThan(S.computeScore(td({ socialCol: 2 })));
  });

  it('scores strategy on a two-sided curve, so raising it cannot inflate', () => {
    // This weight was held at 0.12 -- a ceiling below one veto -- for as long as
    // the figure feeding it was `strategicRank`, the AI pass's read, which
    // tracks FINISH POSITION at -0.927. Judging strategy, it re-derived the
    // order people went out in, and weighting placement harder is not the same
    // as weighting strategy. Raising it then lifted the whole cast about two
    // points IN RANK ORDER and moved three players a tier with nothing real
    // having changed.
    //
    // The export's figure is rebuilt on rates now and measures -0.023 against
    // placement over six seasons, so the weight is up at 0.8. It is CENTRED to
    // pay for that: the median player must move nothing, or a term this size is
    // just a bonus everybody gets. See tests/bb-strategic-independence.test.js.
    const spec = S.RU_SHOW['big-brother'].strat;
    expect(spec.center, 'a term this heavy must be two-sided').toBeGreaterThan(0);

    const median = S.computeScore(blank(S, 9, { socialCol: 0 }));
    const atCentre = S.computeScore(blank(S, 9, { socialCol: 0, strategicScore: spec.center }));
    expect(atCentre, 'a player at the centre of the scale should move nothing').toBeCloseTo(median, 5);

    expect(S.computeScore(blank(S, 9, { strategicScore: spec.scale })))
      .toBeGreaterThan(S.computeScore(blank(S, 9, { strategicScore: spec.center })));
    expect(S.computeScore(blank(S, 9, { strategicScore: 1 })))
      .toBeLessThan(S.computeScore(blank(S, 9, { strategicScore: spec.center })));
  });

  it('centres strategy on the middle of the scale, not on one season', () => {
    // The centre was 4, chosen off simulated seasons of twelve to fourteen. On a
    // real seventeen-player season the median came out at 4.75 and twelve of
    // sixteen houseguests sat above it, so the two-sided curve handed the cast a
    // net sixteen points -- two-sided in shape, a bonus in practice. Half the
    // scale is the only centre that does not drift with cast size, and a
    // franchise board has to mean the same thing in season nine as season one.
    const spec = S.RU_SHOW['big-brother'].strat;
    expect(spec.center).toBe(spec.scale / 2);
  });

  it('scores an unfilled strategic column as nothing, not as a penalty', () => {
    // Every season exported before the column existed has it empty, and a
    // centred term would read empty as "worst strategist in the house" and dock
    // the entire cast 3.2 points.
    const empty = S.computeScore(blank(S, 9));
    const zero  = S.computeScore(blank(S, 9, { strategicScore: 0 }));
    const centre = S.computeScore(blank(S, 9, { strategicScore: S.RU_SHOW['big-brother'].strat.center }));
    expect(empty).toBe(centre);
    expect(zero).toBe(centre);
  });

  it('keeps the printed breakdown on the same weights as the score', () => {
    // A breakdown that does not add up to its own total is a receipt for a
    // different purchase. These were four separate copies of the same numbers.
    expect(SRC).toMatch(/row\.advFound\*RU_ADV\.found/);
    expect(SRC).toMatch(/row\.advPlayed\*RU_ADV\.played/);
    expect(SRC).toMatch(/row\.advWasted\*RU_ADV\.wasted/);
    expect(SRC).toMatch(/row\.advHeld\*RU_ADV\.held/);
    expect(SRC, 'the legend restates the weights instead of quoting them')
      .toMatch(/\$\{RU_ADV\.played\}/);
  });
});

describe('the preview prints the order it decided', () => {
  it('sorts by the score, not by the finish', () => {
    expect(SRC).toMatch(/const ranked = results\.slice\(\)\.sort/);
    expect(SRC, 'still rendering in finish order')
      .not.toMatch(/results\.slice\(\)\.sort\(\(a,b\)=>a\.placement-b\.placement\)\.map\(rowHtml\)/);
    expect(SRC).toMatch(/<tbody>'\+ranked\.map\(rowHtml\)/);
  });

  it('shows how far the score moved someone off their finish', () => {
    expect(SRC).toMatch(/function _ruPlaceCell/);
  });
});

describe('the board never prints a number its own badge contradicts', () => {
  const PAGE = readFileSync(resolve(process.cwd(), 'rankings.html'), 'utf8');

  it('floors the displayed score instead of rounding it', () => {
    // Tier gates are whole numbers, so rounding a score UP across one prints a
    // figure the badge disagrees with: 79.6 drew as "80" beside an A, which
    // reads as broken tiers rather than a rounded display. A score is in a tier
    // exactly when its FLOOR is, so flooring cannot contradict the badge.
    expect(PAGE, 'a rounded score can cross a tier gate the score has not')
      .not.toMatch(/Math\.round\(ranking\.score\)/);
    expect(PAGE).toMatch(/Math\.floor\(ranking\.score\)/);
  });

  it('keeps every tier gate a whole number, which is what makes flooring safe', () => {
    const src = SRC.slice(SRC.indexOf('function scoreTier'), SRC.indexOf('function tierColor'));
    [...src.matchAll(/s >= (\d+(?:\.\d+)?)/g)].forEach(m => {
      expect(Number(m[1]) % 1, `gate ${m[1]} is not a whole number`).toBe(0);
    });
  });
});
