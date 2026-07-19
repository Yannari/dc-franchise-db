import { beforeEach, describe, it, expect } from 'vitest';
import { gs } from '../js/core.js';
import { seedGame } from './helpers/setup.js';
import {
  computeEvidence, updateSocialStatus, socialRoles, hasSocialRole, socialRoleScore,
  perceivedRoles, publicRoles, resetSocialStatus, captureSocialStatusBeforeVote,
} from '../js/social-status.js';
import { applySocialStatusEffects } from '../js/relationship-events.js';
import { getRelationshipDimensions } from '../js/relationships.js';

function seed() {
  seedGame(['A', 'B', 'C', 'D', 'E', 'F'], { episode: 5 });
  gs.isMerged = true;
  resetSocialStatus();
  gs.providerHistory = {}; gs.chalRecord = {}; gs.namedAlliances = [];
  gs.knowledge = {}; gs.showmances = []; gs.intentions = {}; gs.episodeHistory = [];
  gs.relationshipDimensions = {}; gs.bonds = {};
}
beforeEach(seed);

describe('#8 social status — objective roles', () => {
  it('a camp workhorse becomes a (public) provider from sustained evidence', () => {
    gs.providerHistory = { A: 6 };
    updateSocialStatus({ num: 6 });
    expect(hasSocialRole('A', 'provider')).toBe(true);
    expect(publicRoles('A')).toContain('provider');
    expect(socialRoleScore('A', 'provider')).toBeGreaterThanOrEqual(6);
  });

  it('roles fade with decay once the behavior stops', () => {
    gs.providerHistory = { A: 8 };
    updateSocialStatus({ num: 6 });
    updateSocialStatus({ num: 7 });
    expect(hasSocialRole('A', 'provider')).toBe(true);
    gs.providerHistory = { A: 0 };
    for (let e = 8; e < 13; e++) updateSocialStatus({ num: e });
    expect(hasSocialRole('A', 'provider')).toBe(false);
  });

  it('uses a rolling provider window instead of permanent cumulative credit', () => {
    gs.episode = 5;
    gs.providerEpisodes = { A: [1, 2, 3, 4, 5] };
    updateSocialStatus({ num: 6 });
    expect(hasSocialRole('A', 'provider')).toBe(true);
    gs.episode = 12;
    for (let e = 12; e < 17; e++) updateSocialStatus({ num: e });
    expect(hasSocialRole('A', 'provider')).toBe(false);
  });

  it('requires competing reachable targets before calling someone a live swing', () => {
    gs._socialVotePlans = [
      { members:['A','B'], target:'E' },
      { members:['A','C'], target:'F' },
    ];
    const competing = computeEvidence('A')['swing-vote'];
    gs._socialVotePlans[1].target = 'E';
    const converged = computeEvidence('A')['swing-vote'];
    expect(competing).toBeGreaterThan(converged);
    expect(competing).toBeGreaterThanOrEqual(6);
  });

  it('keeps the audience snapshot pre-vote and records post-vote status separately', () => {
    gs.socialStatus = { A:{ provider:{ active:true, score:7 } } };
    gs.socialPerception = { B:{ A:{ provider:0.8 } } };
    const ep = { num:6 };
    captureSocialStatusBeforeVote(ep);
    gs.socialStatus.A.provider.score = 1;
    updateSocialStatus(ep);
    expect(ep.socialStatusSnapshot.A.provider.score).toBe(7);
    expect(ep.socialStatusPostVoteSnapshot.A.provider.score).not.toBe(7);
  });

  it('hysteresis: mid-level evidence holds an active role but will not start one', () => {
    // Build A up to an active provider, then feed steady mid-level evidence.
    gs.providerHistory = { A: 6 };
    updateSocialStatus({ num: 6 });
    gs.providerHistory = { A: 2 };                       // steady-state score lands in [EXIT, ENTER)
    for (let e = 7; e < 11; e++) updateSocialStatus({ num: e });
    const score = socialRoleScore('A', 'provider');
    expect(score).toBeGreaterThanOrEqual(4);
    expect(score).toBeLessThan(6);
    expect(hasSocialRole('A', 'provider')).toBe(true);   // held (was active)
    // B never crossed ENTER on the same evidence — so B does NOT hold the role.
    expect(hasSocialRole('B', 'provider')).toBe(false);
  });

  it('an isolated, targeted player reads as an outsider', () => {
    gs.namedAlliances = [{ name: 'core', active: true, members: ['B', 'C', 'D'], target: 'A' }];
    const ev = computeEvidence('A');
    expect(ev.outsider).toBeGreaterThanOrEqual(6);
    expect(ev['social-center']).toBeLessThan(ev.outsider);
  });
});

describe('#8 social status — relationship consequences', () => {
  it('provider status creates a standing debt (obligation) through an explicit event', () => {
    gs.providerHistory = { A: 8 };
    gs.currentProviders = ['A'];
    updateSocialStatus({ num: 6 });
    expect(hasSocialRole('A', 'provider')).toBe(true);
    const before = getRelationshipDimensions('B', 'A').obligation || 0;
    applySocialStatusEffects({ num: 7 });
    const after = getRelationshipDimensions('B', 'A').obligation || 0;
    expect(after).toBeGreaterThan(before);
    // recorded with a cause, not a raw delta
    const causes = gs.relationshipCauses?.['B→A'] || [];
    expect(causes.some(c => c.dim === 'obligation' && /camp work/.test(c.reason))).toBe(true);
  });

  it('an outsider builds resentment toward the bloc excluding them', () => {
    gs.namedAlliances = [{ name: 'core', active: true, members: ['B', 'C', 'D'], target: 'A' }];
    updateSocialStatus({ num: 6 });
    expect(hasSocialRole('A', 'outsider')).toBe(true);
    applySocialStatusEffects({ num: 7, alliances:[{ label:'core', members:['B','C','D'], target:'A' }] });
    expect((getRelationshipDimensions('A', 'B').resentment || 0)).toBeGreaterThan(0);
  });

  it('does not spread pre-merge status or relationship effects across tribes', () => {
    gs.isMerged = false;
    gs.tribes = [{name:'One',members:['A','B','C']},{name:'Two',members:['D','E','F']}];
    gs.providerHistory = { A:8 }; gs.currentProviders=['A'];
    updateSocialStatus({num:6});
    applySocialStatusEffects({num:7});
    expect((getRelationshipDimensions('B','A').obligation||0)).toBeGreaterThan(0);
    expect(getRelationshipDimensions('D','A').obligation||0).toBe(0);
    expect(perceivedRoles('D','A')).not.toContain('provider');
  });

  it('only gives lieutenant credit after following the plan, in the leader-to-lieutenant direction', () => {
    gs.socialStatus = { A:{'trusted-lieutenant':{active:true,score:7}} };
    const before = getRelationshipDimensions('B','A').strategicRespect||0;
    applySocialStatusEffects({num:7,alliances:[{members:['A','B'],target:'C'}],votingLog:[{voter:'A',voted:'C'}]});
    expect(getRelationshipDimensions('B','A').strategicRespect||0).toBeGreaterThan(before);
    expect(getRelationshipDimensions('A','B').strategicRespect||0).toBe(0);
  });
});

describe('#8 social status — knowledge-gated perception', () => {
  it('a public role spreads to observers; a hidden role stays gated to allies', () => {
    // A is a provider (public) AND an information broker (hidden), allied only with C.
    gs.providerHistory = { A: 8 };
    gs.knowledge = {};
    for (let i = 0; i < 6; i++) gs.knowledge['f' + i] = { type: 'target', subject: 'X' + i, beliefs: { A: { confidence: 0.85, source: 'A' } } };
    gs.namedAlliances = [{ name: 'pair', active: true, members: ['A', 'C'] }];
    for (let e = 6; e < 9; e++) updateSocialStatus({ num: e });

    expect(hasSocialRole('A', 'provider')).toBe(true);
    expect(hasSocialRole('A', 'information-broker')).toBe(true);
    // Everyone reads the public provider role.
    expect(perceivedRoles('B', 'A')).toContain('provider');
    expect(perceivedRoles('C', 'A')).toContain('provider');
    // The hidden broker role: the ally (C) sees it, an unaffiliated observer (B) does not.
    expect(perceivedRoles('C', 'A')).toContain('information-broker');
    expect(perceivedRoles('B', 'A')).not.toContain('information-broker');
  });
});
