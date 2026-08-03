// A sealed Head of Household competition must not name its winner.
//
// The Invisible HOH twist airs the competition and withholds the result. The
// themed competition screens used to decline outright on `act.secret`, which
// was safe and meant a season running the twist had a plain HOH night every
// week. They now render a sealed variant instead — the competition plays and
// the broadcast cuts away before it resolves.
//
// That is only correct if the screen genuinely gives nothing away, so this
// treats it as a leak test rather than a rendering test:
//
//   * the winner's name may appear as a COMPETITOR (they are in the field, and
//     hiding them from the roster would itself be a tell), but never inside a
//     result surface — no rail highlight, no leaderboard, no gold card;
//   * the one place the name is allowed is the dramatic-irony card, which is
//     for the viewer and not for the house;
//   * elimination formats must stop while enough houseguests are standing that
//     the survivor cannot be worked out by subtraction;
//   * timed and scored formats must not print the numbers, because the numbers
//     are the result.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';
import { rpBuildBBComp, _tvState } from '../js/vp-screens.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
// Names that cannot collide with ordinary prose, so a substring hit is a real hit.
const NAMES = ['Zorbix', 'Quenyra', 'Vandreth', 'Ixolite', 'Marrowyn', 'Pellucid',
  'Thistlebane', 'Kaldorin', 'Ovrenna', 'Sablewick', 'Yarrowfen', 'Drenholm'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const seededRng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// Every competition that now has a themed screen and can fill the HOH slot.
const SEALABLE = ['bb-mental-quiz', 'bb-mental-memory', 'bb-physical-precision',
  'bb-physical-slide', 'bb-mental-knockout'];

/** Open every reveal, so the test sees the whole screen and not locked cards. */
function fullyRevealed(ep, slot) {
  rpBuildBBComp(ep, slot);                       // creates the reveal key
  const keys = Object.keys(_tvState).filter(k => k.startsWith('bb_sig_'));
  // If this ever finds nothing, every card below is still locked and the whole
  // test would pass by seeing nothing at all — which is how the first draft
  // "passed" while mutating a _tvState that was not the module's.
  if (!keys.length) throw new Error(`${slot}: the screen registered no reveal key`);
  keys.forEach(k => { _tvState[k].idx = 999; });
  return rpBuildBBComp(ep, slot) || '';
}

/**
 * The markup only.
 *
 * Every screen ships its stylesheet inline, and the sealed helper always
 * defines `.x-irony` and `.x-hg.is-win` rules whether or not anything uses
 * them. Searching the raw string for those tokens finds the CSS and reports a
 * leak that is not there — the first draft of this test failed three ways on
 * exactly that.
 */
const markup = html => html.replace(/<style>[\s\S]*?<\/style>/g, '');

describe('sealed competition screens', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {};
    seasonConfig.romance = 'off';
    NAMES.forEach(n => {
      gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
        timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 };
    });
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
  });

  for (const id of SEALABLE) {
    it(`${id}: renders sealed, and the result never escapes the irony card`, () => {
      for (const size of [6, 8, 12]) {
        for (const seed of [4, 19]) {
          const comp = runBBCompetition({
            type: 'hoh', participants: NAMES.slice(0, size), house: NAMES,
            library: BB_COMPETITIONS, forcedId: id, rng: seededRng(seed * 31 + size),
            week: { num: 3, houseAtStart: NAMES },
          });
          const act = {
            type: 'hoh', winner: comp.winner, secret: true,      // ← the twist
            results: comp.placements.map(n => ({ name: n, score: comp.scores[n] })),
            competition: comp,
          };
          const ep = { num: 3, acts: [act] };
          const where = `${id}/${size}/${seed}`;

          const html = fullyRevealed(ep, 'hoh');
          const body = markup(html);
          // It must be the themed screen, not the generic fallback.
          expect(html.includes('bbc-what'), `${where}: fell back to generic`).toBe(false);
          expect(body, `${where}: no irony card`).toMatch(/-card [a-z]+-irony/);
          expect(body, `${where}: no feed-cut card`).toMatch(/-card [a-z]+-cut"/);

          // The winner may appear as a competitor, never in a result surface.
          const withoutIrony = body.replace(/<article class="[a-z]+-card [a-z]+-irony">[\s\S]*?<\/article>/g, '');
          expect(withoutIrony, `${where}: winner named in a result surface`)
            .not.toMatch(new RegExp(`(HEAD OF HOUSEHOLD|RESULT|LEADER|winner)[^<]{0,40}${comp.winner}`, 'i'));
          expect(withoutIrony, `${where}: winner marked on the rail`).not.toMatch(/is-win/);
          // And the sealed strip must say so.
          expect(body, `${where}: strip does not report the seal`).toMatch(/SEALED|RESULT SEALED/);
        }
      }
    });
  }

  it('an elimination format stops while the survivor is still ambiguous', () => {
    for (const id of ['bb-mental-quiz', 'bb-mental-knockout']) {
      const comp = runBBCompetition({
        type: 'hoh', participants: NAMES.slice(0, 12), house: NAMES,
        library: BB_COMPETITIONS, forcedId: id, rng: seededRng(77),
        week: { num: 3, houseAtStart: NAMES },
      });
      const act = { type: 'hoh', winner: comp.winner, secret: true,
        results: comp.placements.map(n => ({ name: n, score: comp.scores[n] })),
        competition: comp };
      const html = markup(fullyRevealed({ num: 3, acts: [act] }, 'hoh'));

      // How far the broadcast got, read off the screen's own round/duel labels.
      // Counting names near the word "out" was the first attempt and it lied:
      // the rail marks eliminated houseguests with an `is-out` class, so every
      // chip sits within a few characters of the substring and effectively
      // every name matched.
      const reached = Math.max(0, ...[...html.matchAll(/(?:ROUND|DUEL) (\d+)</g)].map(m => Number(m[1])));
      expect(reached, `${id}: the screen showed no rounds at all`).toBeGreaterThan(0);

      const bd = comp.debug.scoreBreakdown;
      const accountedFor = NAMES.slice(0, 12).filter(n => {
        const out = bd[n]?.outRound ?? bd[n]?.outDuel;
        return out != null && out <= reached;
      }).length;
      const unknown = 12 - accountedFor;
      expect(unknown, `${id}: stopped at ${reached} with only ${unknown} unaccounted for`)
        .toBeGreaterThanOrEqual(3);
    }
  });

  it('a veto is never sealed, so it still renders in full', () => {
    const comp = runBBCompetition({
      type: 'veto', participants: NAMES.slice(0, 6), house: NAMES,
      library: BB_COMPETITIONS, forcedId: 'bb-mental-quiz', rng: seededRng(12),
      week: { num: 3, houseAtStart: NAMES },
    });
    // `secret` on a veto act would be meaningless; the screen must ignore it.
    const act = { type: 'veto', winner: comp.winner, secret: true,
      participants: comp.participants,
      results: comp.placements.map(n => ({ name: n, score: comp.scores[n] })),
      competition: comp };
    const html = fullyRevealed({ num: 3, acts: [act] }, 'veto');
    const body = markup(html);
    expect(body.includes('bbc-what')).toBe(false);
    expect(body, 'a veto rendered an irony card').not.toMatch(/-card [a-z]+-irony/);
    expect(body).toContain(comp.winner);
  });
});
