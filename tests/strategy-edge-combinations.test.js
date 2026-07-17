import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultConfig, gs, setSeasonConfig } from '../js/core.js';
import { checkIdolPlays, checkNonIdolAdvantageUse } from '../js/advantages.js';
import { resolveAllianceRepair } from '../js/alliances.js';
import { checkShotInDark, resolveVotes } from '../js/voting.js';
import { getShowmance } from '../js/romance.js';
import { seedGame } from './helpers/setup.js';

const cast = ['A', 'B', 'C', 'D', 'E', 'F'];

describe('rare strategy combinations', () => {
  beforeEach(() => {
    globalThis.getShowmance = getShowmance;
    setSeasonConfig({ ...defaultConfig(), advantages: {
      ...defaultConfig().advantages,
      idol: { enabled: true, count: 2 },
      extraVote: { enabled: true, count: 1 },
    } });
  });

  it('resolves two successful idols at the same Tribal without inventing a boot', () => {
    seedGame([
      { name:'A', stats:{ intuition:10, strategic:10, boldness:10 } },
      { name:'B', stats:{ intuition:10, strategic:10, boldness:10 } },
      'C', 'D', 'E', 'F',
    ], {
      advantages:[{ holder:'A', type:'idol' }, { holder:'B', type:'idol' }],
      playerStates:{ A:{ emotional:'desperate' }, B:{ emotional:'desperate' } },
      episodeHistory:[], lostVotes:[], tribes:[],
    });
    const votes = { A:3, B:3 };
    const ep = { alliances:[], idolPlays:[], idolMisplays:[] };
    const log = [
      { voter:'A', voted:'B' }, { voter:'B', voted:'A' },
      { voter:'C', voted:'A' }, { voter:'D', voted:'A' },
      { voter:'E', voted:'B' }, { voter:'F', voted:'B' },
    ];
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    checkIdolPlays(cast, votes, ep, log);
    random.mockRestore();

    expect(ep.idolPlays.filter(p => (p.votesNegated || 0) > 0)).toHaveLength(2);
    expect(votes).toEqual({});
    expect(resolveVotes(votes)).toMatchObject({ eliminated:null, isTie:true, allVotesCancelled:true });
  });

  it('lets a forced Extra Vote reinforce the live side of an idol split', () => {
    seedGame(cast, {
      advantages:[{ holder:'E', type:'extraVote' }],
      playerStates:{ E:{ emotional:'calculating' } },
      lostVotes:[], tribes:[],
    });
    // Four primary votes on A, two backup votes on B. A's idol has already
    // cancelled the primary pile; E's assigned Extra Vote reinforces B.
    const votes = { B:2, C:2 };
    const ep = { _forceAdvantages:true, idolPlays:[{ player:'A', votesNegated:4 }] };
    const log = cast.map(voter => ({ voter, voted:voter === 'E' || voter === 'F' ? 'B' : 'A' }));
    checkNonIdolAdvantageUse(cast, votes, ep, log);

    expect(ep.idolPlays).toContainEqual(expect.objectContaining({ player:'E', type:'extraVote', target:'B' }));
    expect(votes.B).toBe(3);
    expect(resolveVotes(votes)).toMatchObject({ eliminated:'B', isTie:false });
  });

  it('Shot in the Dark sacrifices a negotiated ballot but preserves its explanation', () => {
    seedGame([
      { name:'A', stats:{ boldness:10, intuition:5 } }, 'B', 'C', 'D', 'E', 'F',
    ], {
      shotInDarkEnabledThisEp:true, shotInDarkUsed:new Set(), advantages:[],
      playerStates:{ A:{} }, lostVotes:[], tribes:[],
    });
    const reason = '[NEGOTIATED FLIP] joined C\'s pitch on B after confirming 4 votes';
    const votes = { A:4, B:2 };
    const log = [{ voter:'A', voted:'B', reason }, { voter:'B', voted:'A' }];
    const random = vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99);
    const ep = {};
    checkShotInDark(cast, votes, log, ep);
    random.mockRestore();

    expect(ep.shotInDark).toMatchObject({ player:'A', safe:false, ownVoteCancelled:'B' });
    expect(votes.B).toBe(1);
    expect(log[0]).toMatchObject({ reason, sitdSacrificed:true });
  });

  it('does not let a lost-vote holder manufacture an Extra Vote ballot', () => {
    seedGame(cast, {
      advantages:[{ holder:'E', type:'extraVote' }],
      playerStates:{ E:{ emotional:'desperate' } },
      lostVotes:['E'], tribes:[],
    });
    const votes = { A:3, B:2 };
    const ep = { _forceAdvantages:true, idolPlays:[] };
    checkNonIdolAdvantageUse(cast, votes, ep, [{ voter:'E', voted:'B' }]);
    expect(votes).toEqual({ A:3, B:2 });
    expect(ep.idolPlays).toEqual([]);
    expect(gs.advantages).toContainEqual({ holder:'E', type:'extraVote' });
  });

  it('cancels repair when the alliance dissolved or expelled the traitor first', () => {
    seedGame(cast, {
      namedAlliances:[
        { name:'Dissolved', active:false, members:['A','B','C'], betrayals:[] },
        { name:'After Expulsion', active:true, members:['B','C'], betrayals:[] },
      ],
    });
    expect(resolveAllianceRepair({ traitor:'A', alliance:'Dissolved' }, 5, () => 0)).toBeNull();
    expect(resolveAllianceRepair({ traitor:'A', alliance:'After Expulsion' }, 5, () => 0)).toBeNull();
    expect(gs.allianceRepairHistory).toBeUndefined();
  });
});
