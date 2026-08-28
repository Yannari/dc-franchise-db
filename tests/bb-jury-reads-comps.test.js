// The jury can see what a Big Brother finalist won.
//
// It could not, for as long as Big Brother has existed in this simulator. The
// vote is Total Drama's — deliberately, because its model reads the right
// things — but two of its résumé terms were written against Total Drama's data
// shape and a Big Brother season writes neither of them:
//
//   · competition dominance read `e.immunityWinner` where
//     `e.challengeType === 'individual'`. Big Brother never sets a
//     challengeType, so every finalist scored zero competitions.
//   · the survival résumé read `playerStates[x].votesReceived`, which Big
//     Brother never writes either.
//
// Nothing failed. The vote returned a perfectly good winner every time, and
// the only symptom was that the house's best competitor kept losing — which
// reads as a bitter jury and was actually a blank page. Twenty-six seasons on
// fixed seeds had the finalist with FEWER competition wins taking it sixteen
// times against six.
//
// So: the reads are checked here, and so is the balance they were tuned to.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, addBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateJuryVote } from '../js/finale.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Ace', 'Bea', 'Cal', 'Dot', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivy'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: 'floater' }));

function house(format) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format, jurySize: 7, finaleSize: 2 });
  gs.jury = NAMES.slice(2, 9);
  gs.jurorHistory = {};
  gs.episodeHistory = [];
  gs.playerStates = {};
  gs.bb = { stats: {}, weeks: [] };
  NAMES.forEach(n => { gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
    timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 }; });
}

/** Ace and Bea, identical in every way the vote can see except comps. */
function twinsWithComps(aceComps) {
  gs.bb.stats.Ace.hohWins = aceComps;
  gs.playerStates.Ace = { bigMoves: 0 };
  gs.playerStates.Bea = { bigMoves: 0 };
}

const tally = (runs = 60) => {
  let ace = 0;
  for (let i = 0; i < runs; i++) {
    withSeededRandom(500 + i, () => {
      const v = simulateJuryVote(['Ace', 'Bea']).votes || {};
      if ((v.Ace || 0) > (v.Bea || 0)) ace++;
    });
  }
  return ace / runs;
};

describe('a Big Brother jury can see a competition record', () => {
  beforeEach(() => house('big-brother'));

  it('counts Heads of Household, vetoes and arena wins', () => {
    // Two finalists alike in everything the vote reads, one with a season
    // behind them. If the record is invisible this sits at a coin flip.
    twinsWithComps(0);
    const blind = tally();
    house('big-brother');
    twinsWithComps(7);
    const seeing = tally();
    expect(blind, 'identical finalists should be a coin flip').toBeGreaterThan(0.3);
    expect(blind).toBeLessThan(0.7);
    expect(seeing, `seven competitions moved the vote from ${(blind * 100).toFixed(0)}% to ${(seeing * 100).toFixed(0)}%`)
      .toBeGreaterThan(0.85);
  });

  it('counts every slot the house competes in, not only the HOH', () => {
    for (const slot of ['hohWins', 'vetoWins', 'blockBusterWins']) {
      house('big-brother');
      twinsWithComps(0);
      gs.bb.stats.Ace[slot] = 7;
      expect(tally(), `${slot} does not reach the jury`).toBeGreaterThan(0.8);
    }
  });

  it('reads nights survived on the block as a survival résumé', () => {
    house('big-brother');
    twinsWithComps(0);
    const flat = tally();
    house('big-brother');
    twinsWithComps(0);
    gs.bb.stats.Ace.timesOnTheBlock = 12;
    expect(tally(), 'surviving the block twelve times counts for nothing')
      .toBeGreaterThan(flat);
  });

  it('a better jury game still beats a competition record', () => {
    // The whole point of the calibration: a comp beast does not buy the night.
    // Bea wins nothing all season and is simply liked, which is a game.
    house('big-brother');
    twinsWithComps(8);
    for (const juror of gs.jury) addBond('Bea', juror, 6);
    const ace = tally();
    expect(ace, `eight competitions beat a jury that liked the other one (${(ace * 100).toFixed(0)}% of the time)`)
      .toBeLessThan(0.35);
  });

  it('speaks Big Brother, not Total Drama', () => {
    // The finale writes about what a finalist WON, and Big Brother has no
    // challenges, no immunity, no tribe and no merge. A juror was calling a
    // houseguest a "challenge beast" with "three individual immunities" about
    // their Heads of Household — and the branch only became reachable in this
    // format when the comp record was fixed to be readable at all.
    const BAD = /immunit|challenge|tribe|pre-merge|\bmerge\b|\bcamp\b|fishing|foraging|tribal/i;
    const said = [];
    for (let i = 0; i < 40; i++) {
      house('big-brother');
      gs.bb.stats.Ace.hohWins = 4;
      gs.bb.stats.Ace.vetoWins = 2;
      gs.bb.stats.Bea.hohWins = 1;
      withSeededRandom(900 + i, () => {
        (simulateJuryVote(['Ace', 'Bea']).reasoning || []).forEach(r => said.push(String(r.reason || '')));
      });
    }
    expect(said.length, 'no reasons were generated at all').toBeGreaterThan(50);
    const wrong = said.filter(r => BAD.test(r));
    expect(wrong, `Total Drama vocabulary in a Big Brother finale: ${wrong[0] || ''}`).toEqual([]);
  });

  it('never reads an internal ledger label out loud', () => {
    // `respectReason` and `grievanceReason` are written for a dimension ledger,
    // third person and machine-shaped — "Bowie dominated a challenge",
    // "blindsided/crossed by Emmah". They were being capitalised and spliced
    // into a juror's quote, which is how a slash ended up in somebody's speech.
    const said = [];
    for (let i = 0; i < 40; i++) {
      house('big-brother');
      gs.bb.stats.Ace.hohWins = 3;
      withSeededRandom(1300 + i, () => {
        (simulateJuryVote(['Ace', 'Bea']).reasoning || []).forEach(r => said.push(String(r.reason || '')));
      });
    }
    for (const line of said) {
      expect(line, `a ledger label reached the screen: ${line}`).not.toMatch(/\w\/\w/);
      // Every reason is a sentence somebody says, not a summary fragment.
      expect(line[0], `a reason starts lowercase, so it is a label: ${line}`)
        .toBe(line[0].toUpperCase());
    }
  });

  it('nine jurors do not say the same sentence twice', () => {
    // The picker hashes juror + finalist, so two jurors could land on one
    // template — and did, for OPPOSITE finalists, both insisting the other was
    // "still the strongest game up there".
    let repeats = 0;
    for (let i = 0; i < 40; i++) {
      house('big-brother');
      gs.jury = NAMES.slice(2, 9);
      // A jury of seven identical strangers is not a jury — every one of them
      // lands in the same branch and drains its pool, which is exhaustion
      // rather than the collision this is about. A real panel is a spread of
      // feeling, so this one is too.
      gs.jury.forEach((juror, k) => {
        addBond(juror, 'Ace', [6, -3, 2, 0, 5, -1, 3][k % 7]);
        addBond(juror, 'Bea', [-2, 4, 0, 3, -4, 2, 1][k % 7]);
        gs.jurorHistory[juror] = {
          voters: k % 2 ? ['Ace'] : ['Bea'],
          finalBonds: { Ace: [4, -2, 1, 0, 3, -1, 2][k % 7], Bea: [-1, 3, 0, 2, -3, 1, 0][k % 7] },
        };
      });
      withSeededRandom(1700 + i, () => {
        const reasons = (simulateJuryVote(['Ace', 'Bea']).reasoning || [])
          .map(r => String(r.reason || '').split('Ace').join('~').split('Bea').join('~'));
        const seen = new Set();
        reasons.forEach(r => { if (r && seen.has(r)) repeats++; seen.add(r); });
      });
    }
    expect(repeats, `${repeats} jurors repeated another juror's line word for word`).toBe(0);
  });

  it('Total Drama is untouched — five wins are worth less there than here', () => {
    // The vote is shared code, so the claim has to be made as a COMPARISON at
    // the same raw count rather than against an absolute number: these two
    // finalists are not twins (seedGame gives them their own stats), so the
    // baseline is not a coin flip and an absolute threshold would only be
    // measuring that asymmetry.
    house('total-drama');
    gs.playerStates = { Ace: { bigMoves: 0 }, Bea: { bigMoves: 0 } };
    const base = tally();

    house('total-drama');
    gs.playerStates = { Ace: { bigMoves: 0 }, Bea: { bigMoves: 0 } };
    gs.episodeHistory = Array.from({ length: 5 }, () => ({
      immunityWinner: 'Ace', challengeType: 'individual',
    }));
    const td = tally();

    house('big-brother');
    twinsWithComps(5);
    const bb = tally();

    // Five immunities still count in Total Drama, exactly as they always have.
    expect(td, 'Total Drama stopped counting immunity wins').toBeGreaterThan(base);
    // And five competitions are worth more in a house that runs thirty of them
    // — which is the whole reason the curve is per show.
    expect(bb, `five wins moved Total Drama to ${(td * 100).toFixed(0)}% and Big Brother to ${(bb * 100).toFixed(0)}%`)
      .toBeGreaterThan(td);
  });
});
