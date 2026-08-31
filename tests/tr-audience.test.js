// ══════════════════════════════════════════════════════════════════════
// tr-audience.test.js — who the country liked, and who it merely enjoyed
// ══════════════════════════════════════════════════════════════════════
//
// Spec §10.4, "the part most easily got wrong, and it is got wrong by writing
// code rather than by omitting it". Three separate things are guarded here and
// they fail in three different ways:
//
//   1. POPULARITY IS WRITTEN. Heroic, villainous, cowardly and selfless
//      moments move `gs.popularity`. A show that writes none of it has an
//      audience module reading a table of zeroes.
//   2. POPULARITY NEVER RANKS ANYBODY. It is accrued per round, so it answers
//      "how long did they last". Ranking by it is the -0.952 bug, and this
//      file asserts it as a RULE OVER THE SOURCE rather than by measuring a
//      consequence — a mis-ranking is invisible from outside until somebody
//      looks at a board and disagrees with it.
//   3. ENTERTAINING IS NOT ADMIRABLE. This show's audience knows who the
//      Traitors are, so a Traitor playing brilliantly generates television
//      and not affection. If the two ever became the same number, popularity
//      would have become a competence score for whichever villain the crowd
//      enjoyed most — and it would still look completely fine.
//
// Everything sampled runs on REAL SEASONS from `playTraitorsSeason` over 100
// FIXED SEEDS, so every count below is deterministic rather than probabilistic:
// a floor of 5 on a colour that fires 16 times is a floor on a number that does
// not move between runs, not a bet about a distribution.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { gs, setGs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { initTraitorsState } from '../js/tr/state.js';
import { recordAlignment } from '../js/tr/roles.js';
import { traitorsPlacements, TRAITORS_FORMAT } from '../js/tr/export.js';
import { showWords, SHOWS } from '../js/shows.js';
import { audienceStanding, audienceBoard, roundsPresent } from '../js/audience.js';
import {
  CROWD_COLOURS, TRAITOR_AFFECTION_DAMPING, crowdMoment, initCrowd, _setCrowdWatch,
} from '../js/tr/crowd.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
const SEEDS = Array.from({ length: 100 }, (_, i) => i + 1);

/** Pearson, on two equal-length series. */
function corr(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy || 1);
}
const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);

/**
 * A hundred seasons, played once and shared, with every crowd moment observed
 * AT THE DECISION POINT.
 *
 * The watch is the reason this file can assert on colours that fire sixteen
 * times in a hundred seasons: reconstructing a moment from the finished ledger
 * is impossible (the two numbers are sums) and re-deriving one from the round
 * record would be a second copy of the rule under test, which is how a guard
 * drifts away from the thing it guards and goes green. Read the value under
 * test — the record `crowdMoment` actually applied.
 */
const RUN = (() => {
  const moments = [];
  const seasons = [];
  const restore = _setCrowdWatch(m => moments.push(m));
  try {
    for (const seed of SEEDS) {
      setPlayers(ROSTER);
      const season = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
      seasons.push({
        seed,
        placements: traitorsPlacements(season),
        board: audienceBoard({}),
        popularity: { ...gs.popularity },
        notoriety: { ...gs.tr.notoriety },
        history: (gs.episodeHistory || []).map(r => ({ num: r.num, exits: [...r.exits] })),
        // Who ever wore a cloak, read off the ROLE HISTORY the engine wrote
        // rather than recomputed at season end. Alignment has eras and
        // recomputing it is this project's most expensive recurring mistake.
        everTraitor: new Set((season.roleHistory || [])
          .filter(r => r.to === 'traitor').map(r => r.name)),
      });
    }
  } finally { restore(); }
  return { moments, seasons };
})();

const momentsOf = colour => RUN.moments.filter(m => m.colour === colour);

// ══════════════════════════════════════════════════════════════════════
describe('popularity is written', () => {
  it('produces every colour in the table, over a hundred seasons', () => {
    // ANTI-VACUITY FIRST. A colour declared and never reachable is content you
    // believe is in the game and is not — the BB Hacker lesson, applied to a
    // ledger instead of an event pool.
    for (const colour of Object.keys(CROWD_COLOURS)) {
      expect(momentsOf(colour).length, `colour "${colour}" never fired`)
        .toBeGreaterThanOrEqual(5);
    }
    // And the season is not scoring three things a week. Measured 89.1 moments
    // per season at the shipped constants.
    expect(RUN.moments.length / SEEDS.length).toBeGreaterThan(30);
  });

  it('moves popularity in the direction the colour means, every single time', () => {
    // ── WHAT EACH WORD MEANS, WRITTEN DOWN ────────────────────────────
    //
    // Stated as literals rather than read out of the table, because the loop
    // below takes its expected direction FROM the table and would therefore
    // agree with any table at all. Flipping `cowardly` to +2.5 was a mutation
    // that came back green until this block existed: the ledger was still
    // "consistent", it just now paid people for losing their nerve. A test
    // must read the value under test — and the value under test here is the
    // sign of the word, not the sign of the number beside it.
    const MEANS_LIKED = ['heroic', 'selfless', 'kind', 'wronged', 'exposed', 'masterful'];
    const MEANS_DISLIKED = ['cowardly', 'cruel', 'selfish'];
    for (const c of MEANS_LIKED) {
      expect(CROWD_COLOURS[c], `${c} is not in the colour table`).toBeTruthy();
      expect(CROWD_COLOURS[c].affection, `${c} should not cost affection`).toBeGreaterThan(0);
    }
    for (const c of MEANS_DISLIKED) {
      expect(CROWD_COLOURS[c], `${c} is not in the colour table`).toBeTruthy();
      expect(CROWD_COLOURS[c].affection, `${c} should not earn affection`).toBeLessThan(0);
    }
    // Every colour is covered by exactly one of the two lists, so a new one
    // cannot be added without a decision about what it means.
    expect([...MEANS_LIKED, ...MEANS_DISLIKED].sort())
      .toEqual(Object.keys(CROWD_COLOURS).sort());
    let up = 0, down = 0;
    for (const m of RUN.moments) {
      const spec = CROWD_COLOURS[m.colour];
      if (spec.affection > 0) { expect(m.affection).toBeGreaterThan(0); up++; }
      if (spec.affection < 0) { expect(m.affection).toBeLessThan(0); down++; }
      // Spectacle is never negative and never damped: watching somebody is not
      // a thing they can do badly.
      expect(m.spectacle).toBeGreaterThanOrEqual(0);
    }
    // Both directions have to be in the sample or the loop above proved one
    // arm and asserted nothing about the other.
    expect(up).toBeGreaterThan(500);
    expect(down).toBeGreaterThan(100);
  });

  it('reaches most of the cast, not just the people who lasted', () => {
    // A ledger that only ever pays the finalists IS the accrual bug, no matter
    // what the colours are called. Measured: 19.7 of 20 on average, 17 at worst.
    for (const s of RUN.seasons) {
      const touched = Object.values(s.popularity).filter(v => v !== 0).length;
      expect(touched, `seed ${s.seed} scored only ${touched} of the cast`)
        .toBeGreaterThanOrEqual(15);
    }
  });

  it('has a row for every player, including the ones nothing happened to', () => {
    // ADDED AFTER A MUTATION CAME BACK GREEN. Deleting `initCrowd`'s seeding
    // loop changed nothing, because `audienceBoard()` unions the ledger's keys
    // with `gs.eliminated` and `gs.activePlayers` and so reconstructs the cast
    // anyway. The seeding is not redundant, it is just not what the BOARD
    // needed: `gs.popularity` is itself a record that gets read and exported,
    // and a player it has no key for reads as somebody who was not in the
    // season rather than somebody the country never warmed to. Zero has to be
    // representable, so it is asserted on the ledger and not on the board.
    for (const s of RUN.seasons.slice(0, 20)) {
      for (const name of CAST) {
        expect(Object.prototype.hasOwnProperty.call(s.popularity, name),
          `seed ${s.seed}: ${name} has no row in the popularity ledger`).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(s.notoriety, name),
          `seed ${s.seed}: ${name} has no row in the notoriety ledger`).toBe(true);
      }
    }
    // NOT VACUOUS: some seasons really do leave somebody on exactly zero, which
    // is the case the seeding exists for. Measured 5 seasons in the first 20.
    const zeroed = RUN.seasons.slice(0, 20)
      .filter(s => CAST.some(n => s.popularity[n] === 0));
    expect(zeroed.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('entertaining is not admirable', () => {
  it('pays a Traitor a fraction of a heroic act for a masterful one', () => {
    // THE CENTRAL CLAIM OF THIS TASK, stated as two measured means.
    const masterful = momentsOf('masterful');
    const heroic = momentsOf('heroic').filter(m => !m.traitor);
    expect(masterful.length).toBeGreaterThan(500);
    expect(heroic.length).toBeGreaterThan(500);

    const mAff = mean(masterful.map(m => m.affection));
    const hAff = mean(heroic.map(m => m.affection));
    // Measured 0.093 against 2.528 — a factor of 27. The floor is 10, which is
    // far enough below the measurement to survive a retune of the colour table
    // and far enough above 1 that "the same number twice" cannot reach it.
    expect(hAff / mAff, `heroic ${hAff.toFixed(3)} vs masterful ${mAff.toFixed(3)}`)
      .toBeGreaterThan(10);

    // AND THE OTHER LEDGER GOES THE OTHER WAY, which is what makes this a
    // separation rather than a suppression. If masterful merely paid less of
    // everything, the format's best television would be invisible.
    const mSpec = mean(masterful.map(m => m.spectacle));
    const hSpec = mean(heroic.map(m => m.spectacle));
    expect(mSpec / hSpec).toBeGreaterThan(2);
  });

  it('pays a Traitor less than a Faithful for the identical act', () => {
    // A DIRECT ASSERTION ON THE RULE, not on a season. The population arms
    // above cannot isolate the damping: a Traitor and a Faithful never do the
    // same things, so a difference in their means is confounded with the
    // difference in what they do. Here both do the same thing at the same
    // episode and only the cloak differs.
    setPlayers(ROSTER);
    setGs({ bonds: {}, activePlayers: ['Traitor One', 'Faithful One'] });
    gs.tr = initTraitorsState();
    recordAlignment('Traitor One', true, 1, 'selection');
    recordAlignment('Faithful One', false, 1, 'selection');
    initCrowd(['Traitor One', 'Faithful One']);

    const t = crowdMoment('Traitor One', 'heroic', 1);
    const f = crowdMoment('Faithful One', 'heroic', 1);
    expect(t.affection).toBeCloseTo(f.affection * TRAITOR_AFFECTION_DAMPING, 10);
    expect(t.affection).toBeLessThan(f.affection);
    // Spectacle is NOT damped. The country enjoys a Traitor doing anything.
    expect(t.spectacle).toBeCloseTo(f.spectacle, 10);
    // And the damping is on the upside ONLY: a Traitor's cowardice costs them
    // exactly what anybody's does. Without this arm, "damping" could be
    // implemented as a blanket scale and nothing here would notice.
    const tBad = crowdMoment('Traitor One', 'cowardly', 1);
    const fBad = crowdMoment('Faithful One', 'cowardly', 1);
    expect(tBad.affection).toBeCloseTo(fBad.affection, 10);
    // The ledgers really were written, and separately.
    expect(gs.popularity['Faithful One']).toBeGreaterThan(gs.popularity['Traitor One']);
    expect(gs.tr.notoriety['Traitor One']).toBeGreaterThan(0);
  });

  it('never crowns the same person for both, in a hundred seasons', () => {
    // The observable that says the two ledgers are not one ledger with two
    // names. Measured 100/100.
    let differ = 0;
    for (const s of RUN.seasons) {
      const loudest = Object.entries(s.notoriety).sort((a, b) => b[1] - a[1])[0][0];
      if (loudest !== s.board[0].name) differ++;
    }
    expect(differ).toBeGreaterThanOrEqual(90);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('nothing under js/tr ranks by popularity, and nothing reimplements audience.js', () => {
  const TR_DIR = path.join(process.cwd(), 'js', 'tr');
  const files = (function walk(dir) {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...walk(p));
      else if (e.name.endsWith('.js')) out.push(p);
    }
    return out;
  })(TR_DIR);
  const read = p => fs.readFileSync(p, 'utf8');

  it('scans a real tree, and the pattern still matches its own source', () => {
    // TWO ANTI-VACUITY ARMS, because both failures have happened in this repo.
    // A source-text guard that stops matching its own source goes quietly
    // green (Task 3 found one), and a rule that scans nothing passes forever.
    expect(files.length, 'the js/tr sweep found almost no files').toBeGreaterThan(20);
    const crowd = files.find(p => p.endsWith('crowd.js'));
    expect(crowd, 'js/tr/crowd.js is gone or renamed').toBeTruthy();
    expect(/popularity/.test(read(crowd)), 'the pattern no longer matches the one file that must match it').toBe(true);
    expect(/notoriety/.test(read(crowd))).toBe(true);
  });

  it('names either ledger in exactly one file', () => {
    // THE RULE, and it is deliberately stronger than "does not sort by it".
    // Popularity here is written from GROUND TRUTH — the audience has known
    // since night one — so any read of it inside the engine is alignment
    // reaching the castle through a channel the belief gate does not watch.
    // One file writes them; nothing else may so much as mention them.
    const offenders = files
      .filter(p => !p.endsWith('crowd.js'))
      .filter(p => /popularity|notoriety/.test(read(p)))
      .map(p => path.relative(process.cwd(), p));
    expect(offenders, 'only js/tr/crowd.js may name the audience ledgers').toEqual([]);
  });

  it('defines no audience reading of its own', () => {
    // js/audience.js is show-agnostic on purpose and Traitors gets it for
    // free. A second copy would not be a duplicate so much as a fork: the
    // prior of 2 and the 0.6 sharpness were measured, and a re-guessed pair
    // sitting in js/tr would silently disagree with every other show.
    const OWNED = ['audienceStanding', 'audienceBoard', 'runAudienceVote', 'roundsPresent',
      'AUDIENCE_PRIOR', 'VOTE_SHARPNESS'];
    for (const p of files) {
      const src = read(p);
      for (const name of OWNED) {
        expect(new RegExp(`(function|const|let|class)\\s+${name}\\b`).test(src),
          `${path.relative(process.cwd(), p)} defines its own ${name}`).toBe(false);
      }
    }
    // And the names it must NOT redefine are really the ones audience.js has,
    // so this cannot rot into a list of words nothing exports.
    const aud = read(path.join(process.cwd(), 'js', 'audience.js'));
    for (const name of OWNED) {
      expect(new RegExp(`export (function|const)\\s+${name}\\b`).test(aud),
        `js/audience.js no longer exports ${name}`).toBe(true);
    }
  });

  it('runs no audience award, because the format has none', () => {
    // §10.4: "If Traitors has no such award, leave the field out and call
    // nothing — that is a supported answer, not a gap." Both halves asserted,
    // because the field being absent proves nothing on its own if a vote is
    // being run anyway under some other name.
    expect(showWords(TRAITORS_FORMAT).audienceAward).toBeUndefined();
    for (const p of files) {
      expect(/runAudienceVote/.test(read(p)),
        `${path.relative(process.cwd(), p)} runs an award this format does not have`).toBe(false);
    }
    // NOT VACUOUS: the other two formats do have one, so "undefined" here is a
    // decision and not the shape of every registry entry.
    const withAward = Object.keys(SHOWS)
      .filter(f => f !== TRAITORS_FORMAT && showWords(f).audienceAward);
    expect(withAward.length).toBeGreaterThanOrEqual(2);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('the audience read, on played seasons', () => {
  it('counts a murdered player out of the round they died in', () => {
    // js/audience.js reads rounds off `episodeHistory`, and this show has TWO
    // doors out of it. `eliminated` is the banishment alone — every existing
    // reader of that field means the vote — so the murdered ride on `exits[]`,
    // the shape docs/ADDING-A-SHOW.md §5 defines. Without that channel every
    // murdered player's `roundsPresent` falls back to the whole season and
    // their standing is divided by a number they never played, which is the
    // accrual bug restored under a different name.
    let checked = 0;
    for (const s of RUN.seasons.slice(0, 20)) {
      for (const row of s.history) {
        for (const x of row.exits) {
          const board = s.board.find(b => b.name === x.name);
          expect(board?.rounds, `${x.name} left in ${row.num} and is credited ${board?.rounds}`)
            .toBe(row.num);
          checked++;
        }
      }
    }
    // Coverage floor: a guard over exits that saw no exits is unfalsifiable.
    expect(checked).toBeGreaterThan(200);
  });

  it('returns the whole cast, best regarded first', () => {
    for (const s of RUN.seasons.slice(0, 20)) {
      expect(s.board.length).toBe(CAST.length);
      expect(new Set(s.board.map(b => b.name))).toEqual(new Set(CAST));
      for (let i = 1; i < s.board.length; i++) {
        expect(s.board[i - 1].standing).toBeGreaterThanOrEqual(s.board[i].standing);
      }
      // And it agrees with the single-name reading, which is the one every
      // consumer will actually call.
      const top = s.board[0];
      expect(top.standing).toBeCloseTo(top.popularity / (top.rounds + 2), 10);
    }
  });

  it('lets a beloved early exit outrank a finalist', () => {
    // THE WHOLE REASON THE STANDING EXISTS. Measured 70 seasons in 100 put
    // somebody from the bottom half of the placements into the board's top
    // three; the floor is 40, which no ordering derived from placement could
    // ever reach.
    let seasons = 0;
    for (const s of RUN.seasons) {
      const half = s.placements.length / 2;
      const late = new Set(s.placements.filter(p => p.placement > half).map(p => p.name));
      if (s.board.slice(0, 3).some(b => late.has(b.name))) seasons++;
    }
    expect(seasons).toBeGreaterThanOrEqual(40);
  });
});

// ══════════════════════════════════════════════════════════════════════
describe('the measurement §10.4 exists for', () => {
  it('separates the accrued total from the standing, against final placement', () => {
    const P = [], S = [], PL = [];
    const FP = [], FS = [], FPL = [];
    for (const s of RUN.seasons) {
      for (const p of s.placements) {
        P.push(s.popularity[p.name] || 0);
        /* ── READ THE STANDING, DO NOT RE-DERIVE IT ────────────────────
           This computed `popularity / (rounds + 2)` itself — the formula
           copied out of js/audience.js — so it was a measurement of the
           FORMULA, not of the function. Deleting the round normalisation
           inside `audienceStanding` left this whole block green: the number
           it exists to defend was never once asked for. It reads the board's
           own `standing` now, which is what `audienceStanding` produced. */
        const row = s.board.find(b => b.name === p.name);
        S.push(row.standing);
        PL.push(p.placement);
        if (!s.everTraitor.has(p.name)) {
          FP.push(P[P.length - 1]); FS.push(S[S.length - 1]); FPL.push(p.placement);
        }
      }
    }
    const rPop = corr(P, PL), rStand = corr(S, PL);
    const rPopF = corr(FP, FPL), rStandF = corr(FS, FPL);

    // ── WITHIN A FACTION, THE ACCRUED TOTAL IS THE PLACEMENT ORDER ──
    //
    // This is the arm that matters and the pooled figure is not it. Pooled,
    // popularity reads a mild -0.299 on this show, because the people who go
    // furthest are disproportionately the ones whose affection is damped to a
    // quarter — two accrual curves of opposite slope, averaging to something
    // that looks harmless. Among Faithfuls alone it is -0.538 against the
    // standing's -0.160, a ratio of 3.4. At n=1,608 the standard error of a
    // correlation is about 0.025, so that gap is roughly fifteen standard
    // errors and not a coin flip.
    //
    // A reader who measured only the pooled number would conclude popularity
    // is safe to rank by here. It is not, and this is where that shows.
    expect(FP.length).toBeGreaterThan(1000);
    expect(Math.abs(rPopF), `Faithful-only popularity corr ${rPopF.toFixed(3)}`)
      .toBeGreaterThan(0.4);
    expect(Math.abs(rStandF), `Faithful-only standing corr ${rStandF.toFixed(3)}`)
      .toBeLessThan(Math.abs(rPopF) * 0.55);

    // Pooled, the standing is very nearly independent of placement (-0.013).
    expect(Math.abs(rStand)).toBeLessThan(Math.abs(rPop) * 0.5);
    expect(Math.abs(rStand)).toBeLessThan(0.1);
  });
});
