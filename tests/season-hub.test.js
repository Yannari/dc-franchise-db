import { describe, expect, it } from 'vitest';
import { buildHubAftermath, buildSeasonHubModel, buildSeasonOverviewModel, buildSeasonRetrospectiveModel, getEpisodeEliminations } from '../js/run-ui.js';

const cast = [
  { name: 'Bowie', slug: 'bowie' },
  { name: 'Julia', slug: 'julia' },
  { name: 'MK', slug: 'mk' },
  { name: 'Priya', slug: 'priya' },
];

function state(overrides = {}) {
  return {
    initialized: true,
    phase: 'pre-merge',
    episode: 0,
    activePlayers: cast.map(p => p.name),
    eliminated: [],
    episodeHistory: [],
    tribes: [
      { name: 'Bass', members: ['Bowie', 'Julia'] },
      { name: 'Gophers', members: ['MK', 'Priya'] },
    ],
    namedAlliances: [],
    riPlayers: [],
    ...overrides,
  };
}

const config = {
  name: 'Chaos Island',
  setting: 'survival-island',
  twistSchedule: [{ episode: 2, type: 'double-elimination', spoilerFree: true }],
};

describe('Season Hub view model', () => {
  it('normalizes double-elimination records for shared Hub text and portraits', () => {
    expect(getEpisodeEliminations({ multiTribalElims: ['Julia', 'MK'], eliminated: 'MK' })).toEqual(['Julia', 'MK']);
    expect(getEpisodeEliminations({ firstEliminated: 'Julia', eliminated: 'MK' })).toEqual(['Julia', 'MK']);
    expect(getEpisodeEliminations({ eliminated: 'Julia', tiedDestinies: { eliminatedPartner: 'MK' } })).toEqual(['Julia', 'MK']);
  });

  it('builds an accurate public aftermath from vote and advantage records', () => {
    const aftermath = buildHubAftermath({
      num: 6,
      eliminated: 'Julia',
      votes: { Julia: 3, Bowie: 2 },
      votingLog: [
        { voter: 'MK', voted: 'Julia' },
        { voter: 'Priya', voted: 'Julia' },
        { voter: 'Bowie', voted: 'Julia' },
      ],
      idolPlays: [{ player: 'MK', playedFor: 'Bowie', votesNegated: 2 }],
      allianceQuits: [{ player: 'Priya', alliance: 'The Web', reason: 'strategic pivot' }],
      bondChanges: [{ a: 'Priya', b: 'Julia', delta: -2, reason: 'betrayal (voted out ally)' }],
      reputationChanges: [{ player: 'MK', earned: ['Persuasive'], lost: [] }],
      adaptationEvents: [{ player: 'Bowie', text: 'Bowie will verify the numbers more carefully.' }],
    });

    expect(aftermath.voteShape).toBe('Julia 3 · Bowie 2');
    expect(aftermath.why).toContain('2 votes were erased');
    expect(aftermath.advantages[0]).toContain('MK protected Bowie');
    expect(aftermath.allianceChanges[0]).toContain('Priya left The Web');
    expect(aftermath.relationshipChanges[0]).toContain('Priya and Julia lost ground');
    expect(aftermath.reputationChanges[0]).toContain('Persuasive');
    expect(aftermath.lessons[0]).toContain('verify the numbers');
  });

  it('explains deadlocks without pretending the eliminated player received the deciding ballots', () => {
    const aftermath = buildHubAftermath({
      num: 9,
      eliminated: 'MK',
      votes: { Julia: 3, Bowie: 3 },
      isRockDraw: true,
      votingLog: [{ voter: 'MK', voted: 'Julia' }],
    });

    expect(aftermath.why).toContain('losing rock');
    expect(aftermath.why).toContain('deadlocked');
  });

  it('builds objective midseason totals while keeping power ranking interpretive', () => {
    const overview = buildSeasonOverviewModel({
      episode: 2,
      phase: 'post-merge',
      activePlayers: ['Bowie', 'Priya', 'MK'],
      eliminated: ['Julia'],
      jury: ['Julia'],
      riPlayers: [],
      chalRecord: { Bowie: { wins: 1 }, Priya: { wins: 0 }, MK: { wins: 0 } },
      popularity: { Bowie: 4, Priya: 2, MK: 1 },
      namedAlliances: [{ name: 'The Web', active: true, formed: 1, members: ['Bowie', 'MK'], betrayals: [] }],
      socialStatus: {
        Bowie: { provider: { active: true, score: 7 } },
        MK: { 'swing-vote': { active: true, score: 9 } },
      },
      strategicReputations: {},
      episodeHistory: [
        {
          num: 1, eliminated: 'Julia', votes: { Julia: 2, Bowie: 1 },
          tribesAtStart: [{ name: 'Bass', members: ['Bowie', 'Julia'] }, { name: 'Gophers', members: ['MK', 'Priya'] }],
          votingLog: [{ voter: 'Bowie', voted: 'Julia' }, { voter: 'Priya', voted: 'Julia' }, { voter: 'MK', voted: 'Bowie' }],
          alliances: [{ target: 'Julia', members: ['Bowie', 'Priya'] }],
          bondChanges: [{ a: 'Bowie', b: 'MK', delta: -2, reason: 'A broken promise damaged trust.' }],
          popularitySnapshot: { Bowie: 2, Priya: 2, MK: 1 },
        },
        {
          num: 2, eliminated: null, votes: {},
          tribesAtStart: [{ name: 'Merged', members: ['Bowie', 'Priya', 'MK'] }],
          votingLog: [], alliances: [], popularitySnapshot: { Bowie: 4, Priya: 2, MK: 1 },
        },
      ],
    }, cast);

    const bowie = overview.metrics.find(metric => metric.name === 'Bowie');
    expect(bowie.challengeWins).toBe(1);
    expect(bowie.voteAccuracy).toBe(1);
    expect(bowie.influence).toBe(1);
    expect(bowie.momentum).toBe(2);
    expect(overview.timeline).toHaveLength(2);
    expect(overview.alliances[0].name).toBe('The Web');
    expect(overview.powerRanking[0].name).toBe('Bowie');
    expect(overview.tribeHistory).toHaveLength(2);
    expect(overview.relationshipMovement[0]).toMatchObject({ a: 'Bowie', b: 'MK', delta: -2, episode: 1 });
    expect(overview.socialRoles).toEqual([{ name: 'Bowie', role: 'provider', label: 'Camp provider', score: 7 }]);
    expect(overview.storyThreads.join(' ')).toContain('Bowie leads the current game-read pulse');
  });

  it('builds the completed retrospective from recorded finale and season outcomes', () => {
    const retrospective = buildSeasonRetrospectiveModel({
      episode: 3,
      phase: 'complete',
      activePlayers: ['Bowie', 'Priya'],
      eliminated: ['Julia', 'MK'],
      jury: ['Julia', 'MK'],
      riPlayers: [],
      finaleResult: {
        winner: 'Bowie', finalists: ['Bowie', 'Priya'], votes: { Bowie: 2, Priya: 0 },
        reasoning: [{ juror: 'Julia', votedFor: 'Bowie' }, { juror: 'MK', votedFor: 'Bowie' }],
      },
      chalRecord: { Bowie: { wins: 1 }, Priya: { wins: 0 }, Julia: { wins: 0 }, MK: { wins: 0 } },
      popularity: {},
      namedAlliances: [{ name: 'The Web', active: false, members: ['Bowie', 'MK'], betrayals: [{ player: 'Bowie' }] }],
      episodeHistory: [
        {
          num: 1, eliminated: 'Julia', votes: { Julia: 2 }, alliances: [{ target: 'Julia', spearhead: 'Bowie', members: ['Bowie', 'Priya'] }],
          votingLog: [{ voter: 'Bowie', voted: 'Julia' }, { voter: 'Priya', voted: 'Julia' }],
          bondChanges: [{ a: 'Bowie', b: 'MK', delta: -2, reason: 'A broken promise.' }],
        },
        {
          num: 2, eliminated: 'MK', votes: { MK: 2 }, alliances: [],
          votingLog: [{ voter: 'Bowie', voted: 'MK' }, { voter: 'Priya', voted: 'MK' }],
          idolPlays: [{ player: 'Bowie', playedFor: 'Bowie', votesNegated: 1 }],
          bondChanges: [{ a: 'Bowie', b: 'MK', delta: -1, reason: 'The vote deepened it.' }],
        },
        { num: 3, isFinale: true, winner: 'Bowie', finaleFinalists: ['Bowie', 'Priya'], juryResult: { votes: { Bowie: 2, Priya: 0 } }, votes: {}, votingLog: [], alliances: [] },
      ],
    }, cast);

    expect(retrospective.winner).toBe('Bowie');
    expect(retrospective.placements.slice(0, 4).map(row => row.name)).toEqual(['Bowie', 'Priya', 'MK', 'Julia']);
    expect(retrospective.finalistPaths[0].moves.join(' ')).toContain('protection play');
    expect(retrospective.allianceOutcomes[0]).toMatchObject({ name: 'The Web', active: false, betrayals: 1 });
    expect(retrospective.relationshipOutcomes[0]).toMatchObject({ a: 'Bowie', b: 'MK', delta: -3 });
    expect(retrospective.voteTotal).toBe(2);
  });

  it('supports a completed challenge finale without inventing jury votes', () => {
    const retrospective = buildSeasonRetrospectiveModel({
      phase: 'complete', activePlayers: ['MK', 'Priya'], eliminated: [], jury: [], riPlayers: [],
      finaleResult: { winner: 'MK', finalists: ['MK', 'Priya'], votes: null, finalChallenge: true },
      namedAlliances: [], episodeHistory: [{ num: 1, isFinale: true, winner: 'MK', finaleFinalists: ['MK', 'Priya'], votes: {}, votingLog: [], alliances: [] }],
      chalRecord: {}, popularity: {},
    }, cast);

    expect(retrospective.winner).toBe('MK');
    expect(retrospective.voteTotal).toBe(0);
    expect(retrospective.juryReasoning).toEqual([]);
  });

  it('offers a clear premiere action before game state exists', () => {
    const model = buildSeasonHubModel(null, config, cast);

    expect(model.lifecycle).toBe('setup');
    expect(model.primaryLabel).toBe('Start Season · Play Episode 1');
    expect(model.remaining).toBe(0);
  });

  it('shows tribes and a premiere briefing after initialization', () => {
    const model = buildSeasonHubModel(state(), config, cast);

    expect(model.lifecycle).toBe('ready');
    expect(model.groups.map(group => group.name)).toEqual(['Bass', 'Gophers']);
    expect(model.groups.flatMap(group => group.members)).toEqual(expect.arrayContaining(cast.map(p => p.name)));
    expect(model.primaryLabel).toBe('Play Episode 1');
  });

  it('derives the aftermath and next scheduled public context from season state', () => {
    const ep = { num: 1, eliminated: 'Julia', votes: { Julia: 3, Bowie: 1 } };
    const model = buildSeasonHubModel(state({
      episode: 1,
      activePlayers: ['Bowie', 'MK', 'Priya'],
      eliminated: ['Julia'],
      episodeHistory: [ep],
      namedAlliances: [{ name: 'The Web', active: true, members: ['Bowie', 'MK'] }],
    }), config, cast);

    expect(model.lifecycle).toBe('aftermath');
    expect(model.progress).toBe(33);
    expect(model.twistLabel).toBe('Production surprise scheduled');
    expect(model.storylines.join(' ')).toContain("Julia's exit");
    expect(model.storylines.join(' ')).toContain('1 active alliance');
  });

  it('turns the primary action into results when the season is complete', () => {
    const model = buildSeasonHubModel(state({
      phase: 'complete',
      episode: 12,
      activePlayers: ['Priya'],
      eliminated: ['Bowie', 'Julia', 'MK'],
      episodeHistory: [{ num: 12, eliminated: 'MK', votes: {} }],
    }), config, cast);

    expect(model.lifecycle).toBe('complete');
    expect(model.primaryAction).toBe('results');
    expect(model.primaryLabel).toBe('View Season Results');
    expect(model.progress).toBe(100);
  });

  it('uses the selected episode and its snapshot when reviewing history', () => {
    const ep1 = {
      num: 1,
      eliminated: 'Julia',
      votes: { Julia: 3 },
      gsSnapshot: {
        phase: 'pre-merge',
        episode: 1,
        activePlayers: ['Bowie', 'MK', 'Priya'],
        eliminated: ['Julia'],
        tribes: [{ name: 'Bass', members: ['Bowie'] }, { name: 'Gophers', members: ['MK', 'Priya'] }],
        namedAlliances: [],
        riPlayers: [],
      },
    };
    const ep4 = { num: 4, eliminated: 'MK', votes: { MK: 2 } };
    const model = buildSeasonHubModel(state({
      episode: 4,
      activePlayers: ['Bowie', 'Priya'],
      eliminated: ['Julia', 'MK'],
      episodeHistory: [ep1, ep4],
    }), config, cast, 1);

    expect(model.latest).toBe(ep1);
    expect(model.isHistorical).toBe(true);
    expect(model.remaining).toBe(3);
    expect(model.groups.flatMap(group => group.members)).toEqual(['Bowie', 'MK', 'Priya']);
    expect(model.primaryAction).toBe('current');
    expect(model.primaryLabel).toBe('Return to Current · Episode 4');
  });
});
