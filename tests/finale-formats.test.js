// Regression coverage for every finale format's summary-text path.
// The Hawaiian Punch / no-jury formats are where rendering bugs have hit
// (blank sections, null-votes crash). These tests assert each format produces
// a non-empty summary containing the winner, and never throws.
import { describe, it, expect, beforeEach } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { setSeasonConfig, seasonConfig } from '../js/core.js';
import { generateFinaleSummaryText } from '../js/finale.js';

const FINALISTS = ['Alice', 'Bob', 'Carl'];

function baseEp(over = {}) {
  return {
    num: 13,
    finaleFinalists: [...FINALISTS],
    winner: 'Alice',
    immunityWinner: 'Alice',
    challengeLabel: 'Final Immunity',
    campEvents: { merge: { pre: [], post: [{ text: 'The fire burns low.' }] } },
    ...over,
  };
}

function setup(finaleFormat, gsOver = {}) {
  seedGame(
    [
      { name: 'Alice', gender: 'f', archetype: 'mastermind' },
      { name: 'Bob', gender: 'm', archetype: 'challenge-beast' },
      { name: 'Carl', gender: 'm', archetype: 'social-butterfly' },
      { name: 'Dana', gender: 'f', archetype: 'hero' },
      { name: 'Eve', gender: 'f', archetype: 'villain' },
      { name: 'Frank', gender: 'm', archetype: 'floater' },
    ],
    {
      phase: 'complete', isMerged: true,
      activePlayers: [...FINALISTS],
      jury: ['Dana', 'Eve', 'Frank'],
      eliminated: ['Dana', 'Eve', 'Frank'],
      episodeHistory: [
        { num: 11, immunityWinner: 'Bob', eliminated: 'Frank', votes: { Frank: 4 } },
        { num: 12, immunityWinner: 'Alice', eliminated: 'Eve', votes: { Eve: 3 } },
      ],
      mergeName: 'merge',
      ...gsOver,
    }
  );
  setSeasonConfig({ ...seasonConfig, name: 'Test Island', finaleFormat });
}

function assertGoodSummary(text) {
  expect(typeof text).toBe('string');
  expect(text.length).toBeGreaterThan(50);
  expect(text).toContain('=== META ===');
  expect(text).toContain('Alice'); // the winner appears
}

describe('finale summary text — all formats render without throwing', () => {
  it('jury vote (traditional)', () => {
    setup('council');
    const ep = baseEp({
      juryResult: {
        votes: { Alice: 2, Bob: 1 },
        reasoning: [
          { juror: 'Dana', votedFor: 'Alice' },
          { juror: 'Eve', votedFor: 'Bob' },
          { juror: 'Frank', votedFor: 'Alice' },
        ],
      },
    });
    let text;
    expect(() => { text = generateFinaleSummaryText(ep); }).not.toThrow();
    assertGoodSummary(text);
    expect(text).toContain('JURY VOTE');
  });

  it('hawaiian-punch (no jury, null votes on gs.finaleResult)', () => {
    setup('hawaiian-punch', { finaleResult: { winner: 'Alice', votes: null, reasoning: null, hawaiianPunch: true } });
    const ep = baseEp({
      juryResult: null,
      hpRaceData: {
        finalists: ['Alice', 'Bob'], winner: 'Alice', feralCameo: null,
        phaseResults: [
          { phase: 1, name: 'Build the Dummy', scoreA: 8.1, scoreB: 7.2, winner: 'Alice' },
          { phase: 4, name: 'Summit Showdown', leader: 'Alice', trailer: 'Bob', mindGameResult: null, winner: 'Alice' },
        ],
      },
    });
    let text;
    expect(() => { text = generateFinaleSummaryText(ep); }).not.toThrow();
    assertGoodSummary(text);
    expect(text).toContain('VOLCANO RACE');
  });

  it('fan-vote (no jury)', () => {
    setup('fan-vote');
    const ep = baseEp({
      juryResult: null,
      fanCampaign: { phases: [{ finalist: 'Alice', style: 'heartfelt', pulseReaction: 'roaring', juryReactions: [] }] },
      fanVoteResult: {
        breakdown: [{ name: 'Alice', pct: 58, popularity: 10, campaignBoost: 3 }, { name: 'Bob', pct: 42, popularity: 6, campaignBoost: 1 }],
        percentages: { Alice: 58, Bob: 42 },
        margin: 'comfortable',
        rankings: ['Alice', 'Bob'],
      },
    });
    let text;
    expect(() => { text = generateFinaleSummaryText(ep); }).not.toThrow();
    assertGoodSummary(text);
    expect(text).toContain('FAN VOTE');
  });

  it('final-challenge (no jury)', () => {
    setup('final-challenge');
    const ep = baseEp({
      juryResult: null,
      finaleChallengeWinner: 'Alice',
      finaleChallengeScores: { Alice: 18.5, Bob: 14.2, Carl: 11.0 },
      finaleChallengeStages: [{ name: 'Endurance', phase: 1, winner: 'Alice', scores: { Alice: 9, Bob: 7 } }],
      finaleSabotageEvents: [],
    });
    let text;
    expect(() => { text = generateFinaleSummaryText(ep); }).not.toThrow();
    assertGoodSummary(text);
    expect(text).toContain('FINAL CHALLENGE');
  });

  it('final-challenge does not crash when gs.episodeHistory is missing', () => {
    setup('final-challenge', { episodeHistory: undefined });
    const ep = baseEp({ juryResult: null, finaleChallengeWinner: 'Alice', finaleChallengeScores: { Alice: 18 } });
    expect(() => generateFinaleSummaryText(ep)).not.toThrow();
  });

  it('olympic-relay (no jury)', () => {
    setup('olympic-relay');
    const ep = baseEp({
      juryResult: null,
      finaleChallengeWinner: 'Alice',
      finaleChallengeScores: { Alice: 20, Bob: 15, Carl: 12 },
      relayData: { timeline: [{ phase: 1, type: 'sprint', text: 'Alice pulls ahead', players: ['Alice'] }], confessionals: [] },
    });
    let text;
    expect(() => { text = generateFinaleSummaryText(ep); }).not.toThrow();
    assertGoodSummary(text);
    expect(text).toContain('OLYMPIC RELAY');
  });
});
