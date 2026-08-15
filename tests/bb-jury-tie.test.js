// A tied jury has a rule, and every surface says what it was.
//
// It did not have one. The winner fell out of this, in bb-finale.js:
//
//     finalTwo.slice().sort((a, b) => (votes[b] || 0) - (votes[a] || 0))[0]
//
// On a tie the comparator returns nought, Array.sort has been stable since
// ES2019, and `finalTwo` is built as `[finalHoh, keep]` — so every deadlocked
// jury in this format quietly crowned the final Head of Household, with
// nothing on the vote screen or in either transcript saying that had happened.
// Eighteen finales on a four-person jury produced six 2–2 ties and the final
// HOH took all six, which is not a bad outcome and was never a decision.
//
// Now: juries seat odd so it should not arise, and when a season cannot seat
// an odd panel the rule is stated rather than inherited from an array index.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { seatedJury } from '../js/finale.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { rpBuildBBJuryVote, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Ace', 'Bea', 'Cal', 'Dot', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivy', 'Jo'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f',
  sexuality: 'straight', archetype: 'floater' }));

const boot = (format = 'big-brother') => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format, jurySize: 9, finaleSize: 2 });
  gs.bb = { stats: {}, weeks: [] };
};

describe('a deadlocked jury', () => {
  beforeEach(() => boot());

  it('cannot normally happen, because a Big Brother jury seats odd', () => {
    for (const size of [2, 4, 6, 8]) {
      boot();
      gs.jury = NAMES.slice(0, size);
      const seated = seatedJury();
      expect(seated.length % 2, `${size} jurors seated as ${seated.length}`).toBe(1);
      // The earliest evictee loses the seat, matching the direction the size
      // clamp already truncates in.
      expect(seated).toEqual(NAMES.slice(1, size));
    }
  });

  it('leaves an odd jury alone, and leaves Total Drama alone entirely', () => {
    for (const size of [3, 5, 7, 9]) {
      boot();
      gs.jury = NAMES.slice(0, size);
      expect(seatedJury().length).toBe(size);
    }
    // Total Drama runs its own tiebreak ladder — a revote, a shared title, a
    // casting vote from the finalist who was cut — and can seat three
    // finalists, so ties are reachable there and the ladder is load-bearing.
    boot('total-drama');
    gs.jury = NAMES.slice(0, 8);
    expect(seatedJury().length, 'Total Drama had a juror taken off it').toBe(8);
  });

  it('still resolves, by a stated rule, if a season seats an even jury', () => {
    // Built directly: the point is the RULE, not how rare the deadlock is.
    const act = {
      type: 'jury-vote', jury: NAMES.slice(0, 4),
      votes: { Ace: 2, Bea: 2 }, reasoning: [], winner: 'Ace', runnerUp: 'Bea',
      tiebreak: { rule: 'final-hoh', winner: 'Ace', count: 2,
        line: 'The jury splits 2–2 and cannot separate them. It goes to Ace, who won the final Head of Household and chose this chair.' },
    };
    // isFinale routes to the finale writer; without it the weekly one runs
    // and never reaches a jury-vote act at all.
    const ep = { num: 12, isFinale: true, format: 'big-brother', houseAtStart: NAMES, acts: [act] };

    // The transcript says what happened rather than printing a split and then
    // a winner with nothing joining them.
    const text = generateBBSummaryText(ep);
    expect(text).toContain('Ace: 2 votes');
    expect(text).toContain('Bea: 2 votes');
    expect(text, 'the transcript never explains the tie').toContain('cannot separate them');
    expect(text).toContain('Ace wins the season.');

    // And so does the screen — which must not announce "BY A VOTE OF 2–2" and
    // then crown somebody with no reason given.
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    rpBuildBBJuryVote(ep);
    _tvState[`bb_jury_${ep.num}`].idx = 99;
    const html = rpBuildBBJuryVote(ep);
    expect(html).toContain('A TIED JURY');
    expect(html, 'the screen never explains the tie').toContain('cannot separate them');
  });

  it('an ordinary vote says nothing about tiebreaks', () => {
    const act = {
      type: 'jury-vote', jury: NAMES.slice(0, 5),
      votes: { Ace: 3, Bea: 2 }, reasoning: [], winner: 'Ace', runnerUp: 'Bea', tiebreak: null,
    };
    // isFinale routes to the finale writer; without it the weekly one runs
    // and never reaches a jury-vote act at all.
    const ep = { num: 12, isFinale: true, format: 'big-brother', houseAtStart: NAMES, acts: [act] };
    expect(generateBBSummaryText(ep)).not.toContain('cannot separate them');
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    rpBuildBBJuryVote(ep);
    _tvState[`bb_jury_${ep.num}`].idx = 99;
    const html = rpBuildBBJuryVote(ep);
    expect(html).toContain('BY A VOTE OF');
    expect(html).not.toContain('A TIED JURY');
  });
});
