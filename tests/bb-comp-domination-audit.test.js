// Does the same houseguest win everything?
//
// tests/bb-comp-upsets.test.js already proves that no SINGLE competition is a
// foregone conclusion — run one game forty times and four different people win
// it. That is a per-game property, and it can be perfectly healthy while the
// season it adds up to is not: if forty different games all key off the same
// two stats, the same houseguest wins forty different competitions and every
// one of them looked winnable in isolation.
//
// This measures the season instead. It plays whole headless seasons and asks
// what share of the competitions the best competitor took, how many distinct
// winners a season produced, and — the diagnostic that says WHY — how much of
// the library's total stat weight sits on each of the nine stats.
//
// Run it, read the tables: npm run audit:bb-comps
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

// The real roster, not a synthetic ladder.
//
// A generated cast can be argued with — "your stat spread is wider than a real
// one, of course somebody dominates it". So this plays the houseguests the
// simulator actually casts, sixteen of them taken at a fixed stride through the
// file so the sample spans the whole range of ability rather than the top of
// it.
const ROSTER = JSON.parse(readFileSync(resolve(process.cwd(), 'franchise_roster.json'), 'utf8'));
const POOL = (Array.isArray(ROSTER) ? ROSTER : ROSTER.players || Object.values(ROSTER)[0])
  .filter(p => p?.stats && p.name);
const CAST = Array.from({ length: 16 }, (_, i) => POOL[(i * 11 + 3) % POOL.length])
  .map(p => ({ name: p.name, archetype: p.archetype || 'floater', gender: p.gender || 'm',
    sexuality: p.sexuality || 'straight', stats: { ...p.stats } }));
const NAMES = CAST.map(p => p.name);

const seededRng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {};
  gs.showmances = [];
  gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
}

const SEEDS = [11, 23, 37, 44, 58, 63, 71, 88, 94, 101, 117, 129];
const pct = n => `${(n * 100).toFixed(1)}%`;

/** Every competition a season actually played, winner and field. */
function compsOf(weeks) {
  const out = [];
  for (const week of weeks) {
    for (const act of week.acts || []) {
      const comp = act.competition;
      if (!comp || !comp.winner || !Array.isArray(comp.participants)) continue;
      if (comp.participants.length < 3) continue;   // a final-two tiebreak is not a field
      out.push(comp);
    }
  }
  return out;
}

describe('Big Brother competition domination audit', () => {
  it('reports how concentrated competition wins are across a season', () => {
    const rows = [];
    const perCompWinnerStats = [];       // { statName -> winner's value } per comp
    const allSeasonShares = [];

    for (const seed of SEEDS) {
      reset();
      const { weeks } = simulateBBSeason({
        rng: seededRng(seed), finaleSize: 3,
        houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS,
      });
      const comps = compsOf(weeks);
      if (!comps.length) continue;

      const wins = new Map();
      const expected = new Map();       // fair-share expectation: sum of 1/field
      for (const comp of comps) {
        wins.set(comp.winner, (wins.get(comp.winner) || 0) + 1);
        for (const name of comp.participants) {
          expected.set(name, (expected.get(name) || 0) + 1 / comp.participants.length);
        }
        const stats = CAST.find(p => p.name === comp.winner)?.stats;
        if (stats) perCompWinnerStats.push({ id: comp.id, winner: comp.winner, stats,
          field: comp.participants.map(n => CAST.find(p => p.name === n)?.stats) });
      }

      const top = [...wins.entries()].sort((a, b) => b[1] - a[1]);
      const topShare = top[0][1] / comps.length;
      allSeasonShares.push(topShare);
      // How far the biggest winner beat the fair share they were entitled to.
      const over = top[0][1] / (expected.get(top[0][0]) || 1);
      rows.push({
        seed, comps: comps.length, winners: wins.size,
        top: `${top[0][0]} ${top[0][1]}`, topShare: pct(topShare),
        vsFair: `${over.toFixed(2)}x`,
        top3: pct(top.slice(0, 3).reduce((s, e) => s + e[1], 0) / comps.length),
      });
    }

    // eslint-disable-next-line no-console
    console.log('\n── per-season concentration ──');
    console.table(rows);
    const mean = allSeasonShares.reduce((a, b) => a + b, 0) / allSeasonShares.length;
    // eslint-disable-next-line no-console
    console.log(`mean top-winner share: ${pct(mean)}  (fair share for a 16-cast season is roughly 10-14%)`);

    // ── why: what the library actually asks of the cast ──
    const weightByStat = Object.fromEntries(STAT_KEYS.map(k => [k, 0]));
    let totalWeight = 0;
    for (const comp of BB_COMPETITIONS) {
      for (const [stat, w] of Object.entries(comp.stats || {})) {
        if (!(stat in weightByStat)) continue;
        weightByStat[stat] += w; totalWeight += w;
      }
    }
    // eslint-disable-next-line no-console
    console.log('\n── library stat weight (declared profiles) ──');
    console.table(STAT_KEYS.map(k => ({
      stat: k, weight: weightByStat[k].toFixed(2), share: pct(weightByStat[k] / totalWeight),
      comps: BB_COMPETITIONS.filter(c => c.stats?.[k]).length,
    })));

    // ── and: was the winner the field's best at the thing being played? ──
    //
    // Not "best at physical" — best at THIS competition's declared profile.
    // A library where every game keys off a different stat can still be
    // deterministic if, inside each game, aptitude decides it. 0.50 would mean
    // the profile predicts nothing; 1/field would mean the best always wins.
    let aptSum = 0, aptN = 0, favWins = 0;
    const byComp = new Map();
    for (const entry of perCompWinnerStats) {
      const profile = BB_COMPETITIONS.find(c => c.id === entry.id)?.stats;
      if (!profile) continue;
      const apt = s => Object.entries(profile).reduce((t, [k, w]) => t + (s[k] || 0) * w, 0);
      const field = entry.field.filter(Boolean);
      if (field.length < 3) continue;
      const mine = apt(entry.stats);
      const better = field.filter(s => apt(s) > mine).length;
      const pctile = (better + 1) / field.length;
      aptSum += pctile; aptN++;
      if (better === 0) favWins++;
      const row = byComp.get(entry.id) || { sum: 0, n: 0 };
      row.sum += pctile; row.n++; byComp.set(entry.id, row);
    }
    // eslint-disable-next-line no-console
    console.log(`\n── winner's aptitude percentile on the competition's OWN profile ──`);
    // eslint-disable-next-line no-console
    console.log(`mean ${(aptSum / aptN).toFixed(3)} (0.50 = profile predicts nothing) | `
      + `pre-game favourite won ${pct(favWins / aptN)} of competitions (chance in a field of 8 = 12.5%)`);

    // The dozen games that most reliably hand it to the favourite.
    const worst = [...byComp.entries()].filter(([, r]) => r.n >= 4)
      .sort((a, b) => (a[1].sum / a[1].n) - (b[1].sum / b[1].n)).slice(0, 15);
    // eslint-disable-next-line no-console
    console.log('\n── most deterministic competitions (lower = favourite always wins) ──');
    console.table(worst.map(([id, r]) => ({ id, played: r.n, winnerPercentile: (r.sum / r.n).toFixed(3) })));

    // ── who, across every season, and what does their stat line look like ──
    const totals = new Map(NAMES.map(n => [n, 0]));
    for (const entry of perCompWinnerStats) totals.set(entry.winner, totals.get(entry.winner) + 1);
    // eslint-disable-next-line no-console
    console.log('\n── career comp wins across all seasons, against the stat line ──');
    console.table([...totals.entries()].sort((a, b) => b[1] - a[1]).map(([name, w]) => {
      const s = CAST.find(p => p.name === name).stats;
      return { name, wins: w, meanStat: (STAT_KEYS.reduce((t, k) => t + s[k], 0) / 9).toFixed(1),
        phys: s.physical, endu: s.endurance, ment: s.mental, intu: s.intuition, temp: s.temperament };
    }));
  }, 300000);
});

// ── the fast lane ──
//
// The season audit above says the house has a problem; this says which games
// have it. Every competition is forced against random eight-person fields cut
// from the same cast, and the number reported is how often the field's best
// aptitude on that competition's OWN profile actually wins it. In a field of
// eight, pure chance is 12.5% and a total lock is 100%. A competition should
// reward the specialist — somewhere around a quarter to a third — without
// being a coronation.
describe('which competitions are locks', () => {
  const RUNS = 120;
  const FIELD = 8;

  it('reports the favourite\'s win rate for every competition', () => {
    reset();
    // How much signal each profile carries at all. `luck: 3` means one thing
    // against a profile whose weights sum to 0.6 and something else entirely
    // against one summing to 2.0 — so this number has to be read next to the
    // favourite rates below.
    const sums = BB_COMPETITIONS.filter(c => Object.keys(c.stats || {}).length)
      .map(c => Object.values(c.stats).reduce((a, b) => a + b, 0)).sort((a, b) => a - b);
    // eslint-disable-next-line no-console
    console.log(`profile weight sums: min ${sums[0].toFixed(2)} | median `
      + `${sums[Math.floor(sums.length / 2)].toFixed(2)} | max ${sums[sums.length - 1].toFixed(2)}`);
    const rows = [];
    for (const comp of BB_COMPETITIONS) {
      const slot = comp.types.includes('hoh') ? 'hoh'
        : comp.types.includes('veto') ? 'veto'
          : comp.types.includes('arena') ? 'arena' : comp.types[0];
      if (slot === 'pair' || slot === 'final') continue;   // need a seating the yard cannot give
      const profile = comp.stats || {};
      // A crapshoot declares no profile, so it has no favourite to measure and
      // would report a meaningless 100%. Pure chance is a real Big Brother
      // competition type, not a balance failure.
      if (!Object.keys(profile).length) continue;
      const apt = name => {
        const s = CAST.find(p => p.name === name).stats;
        return Object.entries(profile).reduce((t, [k, w]) => t + (s[k] || 0) * w, 0);
      };
      let favWins = 0, pctSum = 0, ok = 0;
      const winners = new Set();
      for (let i = 0; i < RUNS; i++) {
        const r = seededRng(i * 7919 + 13);
        const field = [...NAMES].sort(() => r() - 0.5).slice(0, FIELD);
        let result;
        try {
          result = runBBCompetition({
            type: slot, participants: field, house: NAMES, library: BB_COMPETITIONS,
            forcedId: comp.id, rng: seededRng(i * 401 + 9),
            week: { num: 5, houseAtStart: NAMES },
            nominees: field.slice(-2), hoh: field[0],
          });
        } catch { continue; }
        ok++;
        winners.add(result.winner);
        const better = field.filter(n => apt(n) > apt(result.winner)).length;
        pctSum += (better + 1) / FIELD;
        if (better === 0) favWins++;
      }
      if (!ok) continue;
      rows.push({ id: comp.id, slot, favRate: favWins / ok, pctile: pctSum / ok, winners: winners.size });
    }
    rows.sort((a, b) => b.favRate - a.favRate);
    const mean = rows.reduce((t, r) => t + r.favRate, 0) / rows.length;
    // eslint-disable-next-line no-console
    console.log(`\n${rows.length} competitions | mean favourite win rate ${pct(mean)} `
      + `| chance in a field of eight is 12.5%`);
    // eslint-disable-next-line no-console
    console.log(`over 40%: ${rows.filter(r => r.favRate > 0.4).length} | `
      + `over 30%: ${rows.filter(r => r.favRate > 0.3).length} | `
      + `under 20%: ${rows.filter(r => r.favRate < 0.2).length}`);
    // eslint-disable-next-line no-console
    console.table(rows.map(r => ({ id: r.id, slot: r.slot, favRate: pct(r.favRate),
      winnerPctile: r.pctile.toFixed(3), distinctWinners: r.winners })));
  }, 300000);
});
