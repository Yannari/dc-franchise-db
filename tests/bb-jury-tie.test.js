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
// The rule is stated now rather than inherited from an array index. Note the
// fix is ONLY the rule: an earlier attempt also trimmed even juries down to
// odd so a tie could not occur, which took a vote away from somebody the house
// had evicted onto that jury and left the finale announcing more jurors than
// it counted. Everybody seated votes; the tie has an answer.
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

  it('every juror the season seated gets to vote, odd panel or even', () => {
    // An even panel was briefly trimmed to an odd one here so a tie could not
    // happen. It disenfranchised somebody the house had already evicted onto
    // that jury, and — because the finale shows the jury off the act rather
    // than off this function — a real season announced eight jurors, read
    // eight names, printed "8 OF 8 READ" and tallied seven. The missing one
    // rendered as "Brightly casts a vote" with no vote underneath it.
    for (const format of ['big-brother', 'total-drama']) {
      for (const size of [2, 3, 4, 5, 6, 7, 8, 9]) {
        boot(format);
        gs.jury = NAMES.slice(0, size);
        const seated = seatedJury();
        expect(seated.length, `${format}: ${size} seated became ${seated.length}`).toBe(size);
        expect(seated).toEqual(NAMES.slice(0, size));
      }
    }
  });

  it('still clamps a jury bigger than the configured size', () => {
    boot();
    seasonConfig.jurySize = 5;
    gs.jury = [...NAMES];
    // The most recent evictees keep their seats, which is the long-standing
    // behaviour and is not what the odd-panel trim was doing.
    expect(seatedJury()).toEqual(NAMES.slice(-5));
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
