// The rankings builder, per show.
//
// It ran a Total Drama rubric over a Big Brother season: two competition
// columns for a game with three, an advantage lifecycle labelled for idols,
// and a legend hardcoded to "Imm +0.8 / Rew +0.3" underneath headers that had
// been relabelled to HOH and Veto. Every Block Buster in a season scored zero.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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
    expect(SRC).toMatch(/comp3:\s*isHouse\s*\?\s*\(p\.bb\?\.blockBusterWins/);
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
function loadScorer() {
  const cut = (a, b) => SRC.slice(SRC.indexOf(a), SRC.indexOf(b, SRC.indexOf(a)));
  const src = [
    cut('const RU_ADV = {', 'const RU_SHOW = {'),
    cut('const RU_SHOW = {', 'function _ruRelabelColumns'),
    cut('function _ruRubric(format)', '// ── Scoring formula'),
    cut('function placementPct(', 'function tierColor('),
    'return { computeScore, scoreTier, placementPct, RU_ADV, RU_ALLY, RU_SHOW };',
  ].join(String.fromCharCode(10)).replace('RU_SHOW[format || _ruShowFormat()]', 'RU_SHOW[format]');
  return new Function(src)();
}

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
  const S = loadScorer();

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

  it('holds the strategic term under one competition win', () => {
    // NOT because strategy matters less than a veto. Because the figure the
    // column is fed is not yet worth more.
    //
    // `strategicRank` -- the AI pass's read of how somebody played -- tracks
    // FINISH POSITION at -0.927 on S1. Asked to judge strategy it re-derives
    // the order people went out in, which makes it placement measured a third
    // time, the same fault `votesAgainst` was deleted for. Raising this weight
    // to 0.35 lifted the entire cast by ~2 points IN RANK ORDER and moved three
    // players a tier with no comparison between them having changed.
    //
    // The ceiling is not the problem, the measure is: anything CUMULATIVE grows
    // with weeks survived and restates the finish (correct-vote count sits at
    // -0.827 against placement), while the same thing as a RATE sits at -0.186
    // and is close to independent. Rebuild the figure on rates and this can be
    // raised to answer a comp run. If you are here because this test failed,
    // that is the work it is waiting for.
    const bb = S.RU_SHOW['big-brother'];
    expect(bb.strat.weight * bb.strat.scale).toBeLessThan(bb.comp2.weight);
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
