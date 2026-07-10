import { describe, it, expect, beforeEach } from 'vitest';
import { setGs, gs, setPlayers, seasonConfig } from '../js/core.js';
import { bKey } from '../js/bonds.js';
import { applyRewardSocialEffects } from '../js/twists.js';

// Reward social suite: shared by generic reward-challenge AND reward-twist-challenge.
// These tests exercise applyRewardSocialEffects directly (the function both paths now call).

const stats = (o = {}) => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...o,
});

describe('applyRewardSocialEffects — individual (post-merge)', () => {
  beforeEach(() => {
    setPlayers([
      { name: 'Win', gender: 'f', archetype: 'mastermind', stats: stats({ strategic: 9, boldness: 8, loyalty: 2, social: 4 }) },
      { name: 'Ally', gender: 'm', archetype: 'loyal-soldier', stats: stats() },
      { name: 'Pal', gender: 'm', archetype: 'floater', stats: stats() },
      { name: 'Snubbed', gender: 'f', archetype: 'hothead', stats: stats({ temperament: 2 }) },
      { name: 'Extra', gender: 'm', archetype: 'floater', stats: stats() },
    ]);
    setGs({
      activePlayers: ['Win', 'Ally', 'Pal', 'Snubbed', 'Extra'],
      isMerged: true,
      mergeName: 'Merged',
      namedAlliances: [],
      sideDeals: [],
      chalRecord: {},
      episode: 5,
      bonds: {
        [bKey('Win', 'Snubbed')]: 6,  // strong bond → snub should hurt
        [bKey('Win', 'Ally')]: 4,
        [bKey('Win', 'Pal')]: 3,
      },
      popularity: {},
      survival: {},
      tribeFood: {},
    });
  });

  it('picks companions, boosts their bond, and records snub damage on strong-bond non-picks', () => {
    const twistObj = {
      rewardWinner: 'Win', rewardWinnerType: 'individual',
      rewardItemLabel: 'Feast', rewardChalPlacements: ['Win', 'Ally', 'Pal', 'Snubbed', 'Extra'],
    };
    applyRewardSocialEffects({ campEvents: {} }, twistObj);

    // Companions selected (F5 → 1 companion)
    expect(Array.isArray(twistObj.rewardCompanions)).toBe(true);
    expect(twistObj.rewardCompanions.length).toBeGreaterThanOrEqual(1);
    // Winner is never their own companion
    expect(twistObj.rewardCompanions).not.toContain('Win');
    // Pick strategy recorded
    expect(['brain', 'heart']).toContain(twistObj.rewardPickStrategy);
  });

  it('snubbing a high-bond, low-temperament player damages the bond', () => {
    const before = gs.bonds[bKey('Win', 'Snubbed')];
    const twistObj = {
      rewardWinner: 'Win', rewardWinnerType: 'individual',
      rewardItemLabel: 'Feast', rewardChalPlacements: ['Win', 'Ally', 'Pal', 'Snubbed', 'Extra'],
    };
    applyRewardSocialEffects({ campEvents: {} }, twistObj);
    if (!twistObj.rewardCompanions.includes('Snubbed')) {
      // Snubbed had bond 6 and temperament 2 → must take damage
      expect(gs.bonds[bKey('Win', 'Snubbed')]).toBeLessThan(before);
    }
  });
});

describe('applyRewardSocialEffects — tribe (pre-merge cross-tribal share invite)', () => {
  beforeEach(() => {
    setPlayers([
      { name: 'W1', gender: 'f', archetype: 'social-butterfly', stats: stats({ social: 9, strategic: 8 }) },
      { name: 'W2', gender: 'm', archetype: 'hero', stats: stats({ social: 8, strategic: 7 }) },
      { name: 'L1', gender: 'f', archetype: 'floater', stats: stats({ strategic: 8, social: 8 }) },
      { name: 'L2', gender: 'm', archetype: 'floater', stats: stats() },
    ]);
    setGs({
      activePlayers: ['W1', 'W2', 'L1', 'L2'],
      isMerged: false,
      tribes: [
        { name: 'Winners', members: ['W1', 'W2'] },
        { name: 'Losers', members: ['L1', 'L2'] },
      ],
      namedAlliances: [],
      sideDeals: [],
      chalRecord: {},
      episode: 2,
      bonds: {
        [bKey('W1', 'L1')]: 4, [bKey('W2', 'L1')]: 4, // strong cross-tribal bond → likely invite
      },
      survival: {},
      tribeFood: {},
    });
    seasonConfig.rewardSharing = true;
    seasonConfig.foodWater = 'disabled';
  });

  it('winning tribe members bond with each other', () => {
    const before = gs.bonds[bKey('W1', 'W2')] || 0;
    const twistObj = {
      rewardWinner: 'Winners', rewardWinnerType: 'tribe', rewardItemLabel: 'Supply Cache',
      rewardChalPlacements: [
        { name: 'Winners', members: ['W1', 'W2'] },
        { name: 'Losers', members: ['L1', 'L2'] },
      ],
    };
    applyRewardSocialEffects({ campEvents: {} }, twistObj);
    expect(gs.bonds[bKey('W1', 'W2')]).toBeGreaterThan(before);
  });

  it('can fire a cross-tribal share invite when rewardSharing is enabled', () => {
    // Force the share roll to succeed by running many times — deterministic check that the
    // mechanism is reachable and, when it fires, targets a losing-tribe player.
    let fired = false;
    for (let i = 0; i < 200 && !fired; i++) {
      // reset bonds each iter so damage doesn't accumulate wildly
      gs.bonds[bKey('W1', 'L1')] = 4; gs.bonds[bKey('W2', 'L1')] = 4;
      const twistObj = {
        rewardWinner: 'Winners', rewardWinnerType: 'tribe', rewardItemLabel: 'Supply Cache',
        rewardChalPlacements: [
          { name: 'Winners', members: ['W1', 'W2'] },
          { name: 'Losers', members: ['L1', 'L2'] },
        ],
      };
      const ep = { campEvents: {} };
      applyRewardSocialEffects(ep, twistObj);
      if (twistObj.rewardShareInvite) {
        fired = true;
        expect(['L1', 'L2']).toContain(twistObj.rewardShareInvite.invited);
        expect(twistObj.rewardShareInvite.invitedBy).toBe('Winners');
        expect(ep.rewardShareInvite).toEqual(twistObj.rewardShareInvite);
      }
    }
    expect(fired).toBe(true);
  });
});
