// tools/dr-finale-audit.mjs — does the crown read the season?
// The question is NOT "does the best résumé win" (that would be a chart with
// a lip sync stapled on) but "does it help, and can it still be beaten".
const { JSDOM } = await import('jsdom');
const d = new JSDOM('<!doctype html><html></html>', { url: 'http://localhost/' });
for (const k of ['window', 'document', 'localStorage', 'navigator']) {
  if (!globalThis[k]) globalThis[k] = d.window[k];
}
const { playDragSeason, recordStrength } = await import('../js/dr/season.js');
const { rngFor } = await import('../js/dr/rng.js');
const RUNS = Number(process.argv[2]) || 60;
const S = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const A = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer'];
const mk = seed => { const g = rngFor(seed); const r = () => 1 + Math.floor(g() * 10);
  return Array.from({ length: 12 }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: A[i % A.length], age: 21 + i, stats: Object.fromEntries(S.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } })); };

for (const type of ['top4', 'top3', 'top2', 'perform-then-lipsync']) {
  let zeroWins = 0, bestResume = 0, bestShowcase = 0, n = 0, fieldSize = 0;
  /* ── AND WHETHER SHE EVEN GOT TO SING ──
     This audit asked whether the CROWN reads the season and never asked
     whether the CUT does, and the cut was where it failed: on
     perform-then-lipsync the field was narrowed on the showcase alone, so
     the queen with the best season was sent to the back before the résumé
     term in the crown duel could ever apply to her. A number for "does the
     best résumé win" cannot see that, because by then she is not in the
     duel. Chance here is the share of the field that gets cut. */
  let cutBest = 0, cutFields = 0, cutSize = 0;
  const winnerWins = [];
  for (let s = 0; s < RUNS; s++) {
    const out = playDragSeason({ cast: mk(400 + s), seed: s, config: { drFinale: type } });
    const f = out.rows[out.rows.length - 1].dr;
    const field = f.finale.placements.slice(0, f.living.length);
    const rec = out.state.record;
    const wins = nm => (rec[nm] || []).filter(r => r === 'WIN').length;
    winnerWins.push(wins(out.winner));
    if (wins(out.winner) === 0) zeroWins++;
    const top = [...field].sort((x, y) => recordStrength(rec[y] || []) - recordStrength(rec[x] || []))[0];
    if (top === out.winner) bestResume++;
    const sh = out.state.finalePerformance || {};
    const bs = [...field].sort((x, y) => (sh[y] || 0) - (sh[x] || 0))[0];
    if (bs === out.winner) bestShowcase++;
    // Everybody below the last duel's two never sang.
    const cut = f.finale.cut || field.slice(2);
    if (cut.length && field.length > cut.length) {
      cutFields++;
      cutSize += cut.length / field.length;
      if (cut.includes(top)) cutBest++;
    }
    fieldSize += field.length;
    n++;
  }
  const mean = winnerWins.reduce((a, b) => a + b, 0) / n;
  // THE CONTROL ARM. "Best resume wins 31%" means nothing without the number
  // it would be if the crown were a coin toss between the finalists.
  const chance = 100 / (fieldSize / n);
  const pct = x => `${(x / n * 100).toFixed(0)}%`;
  const lead = x => { const v = x / n * 100 - chance; return `${v >= 0 ? '+' : ''}${v.toFixed(0)}pp`; };
  console.log(`${type.padEnd(21)} maxi wins ${mean.toFixed(2)} | zero-win ${pct(zeroWins)}`
    + ` | chance ${chance.toFixed(0)}% | resume ${pct(bestResume)} (${lead(bestResume)})`
    + ` | showcase ${pct(bestShowcase)} (${lead(bestShowcase)})`);
  if (cutFields) {
    // Below the cut-chance line is the whole point: it means the season is
    // protecting her from the cut rather than the cut ignoring the season.
    const cutChance = 100 * (cutSize / cutFields);
    const got = 100 * cutBest / cutFields;
    console.log(`${''.padEnd(21)} best résumé CUT before the song ${got.toFixed(0)}%`
      + ` (chance ${cutChance.toFixed(0)}%, ${(got - cutChance >= 0 ? '+' : '')}`
      + `${(got - cutChance).toFixed(0)}pp)`);
  }
}
