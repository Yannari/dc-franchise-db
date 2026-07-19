import { beforeEach, describe, expect, it } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { getAdaptation, updateAdaptationFromEpisode, lieChanceModifier, verificationModifier, idolSuspicionModifier } from '../js/adaptation.js';
import { evaluatePitchResponse } from '../js/voting.js';
import { _textAdaptation } from '../js/text-backlog.js';

describe('persistent adaptation and learning', () => {
  beforeEach(() => seedGame([
    { name:'A', stats:{ strategic:8, intuition:8, social:7, boldness:7, loyalty:3 } },
    { name:'B', stats:{ strategic:5, intuition:5 } },
    { name:'C', stats:{ strategic:5, intuition:5 } },
  ], { adaptationProfiles:{}, _adaptationProcessedEpisodes:[], namedAlliances:[{ name:'Bloc', members:['A','B'], active:true }] }));

  it('learns from a missed deciding vote exactly once', () => {
    const ep={ num:1, eliminated:'C', votingLog:[{voter:'A',voted:'B'},{voter:'B',voted:'C'}] };
    updateAdaptationFromEpisode(ep);
    const first={...getAdaptation('A')};
    updateAdaptationFromEpisode(ep);
    expect(first.blindsides).toBe(1);
    expect(first.verification).toBeGreaterThan(0);
    expect(getAdaptation('A').verification).toBe(first.verification);
  });

  it('makes a caught bluff less likely and reinforces the listener verification habit', () => {
    const ep={ num:2, eliminated:'C', votingLog:[{voter:'A',voted:'C'},{voter:'B',voted:'C'}], votePitches:[{
      pitcher:'A', pitchTarget:'C', success:false, responses:[{ voter:'B', catchesExaggeration:true }]
    }] };
    updateAdaptationFromEpisode(ep);
    expect(lieChanceModifier('A')).toBeLessThan(0);
    expect(verificationModifier('B')).toBeGreaterThan(0);
  });

  it('remembers a successful idol split without bypassing base safety rules', () => {
    const ep={ num:3, eliminated:'C', votingLog:[{voter:'A',voted:'C'},{voter:'B',voted:'C'}],
      splitVotePlans:[{alliance:'Bloc',primary:'B',secondary:'C',primaryVoters:['A'],secondaryVoters:['B']}],
      idolPlays:[{player:'B',votesNegated:2}] };
    updateAdaptationFromEpisode(ep);
    expect(getAdaptation('A').splitPreference).toBeGreaterThan(0);
    expect(idolSuspicionModifier('A')).toBeGreaterThan(0);
  });

  it('applies learned verification to exaggerated pitch reads', () => {
    const result=evaluatePitchResponse({ liar:true, claimedSupport:5, confirmedSupport:1,
      eligibleVoters:6, strategic:5, intuition:5, verificationMod:.35 }, () => 0.1);
    expect(result.catchesExaggeration).toBe(true);
    expect(result.reason).toBe('caught-exaggeration');
  });

  it('does not call an intentional protective ballot a blindside', () => {
    updateAdaptationFromEpisode({ num:4, eliminated:'C', votes:{C:3,B:2}, votingLog:[
      {voter:'A',voted:'B',lateTrigger:'protect-ally',reason:'moved to B to protect an ally'},
      {voter:'B',voted:'C'}
    ], voteCommitmentDiagnostics:[{voter:'A',predictedBallot:'C'}] });
    expect(getAdaptation('A').blindsides).toBe(0);
    expect(getAdaptation('A').confidence).toBeGreaterThanOrEqual(0);
  });

  it('treats a credible rejected pitch as experience instead of lost skill', () => {
    updateAdaptationFromEpisode({ num:5, eliminated:'C', votingLog:[{voter:'A',voted:'C'},{voter:'B',voted:'C'}], votePitches:[{
      pitcher:'A', pitchTarget:'B', attemptedContacts:1, success:false,
      responses:[{voter:'B',accepted:false,reason:'protecting-target',acceptChance:.3}]
    }] });
    expect(getAdaptation('A').negotiation).toBeGreaterThan(0);
    expect(getAdaptation('A').rejectionStreak).toBe(0);
  });

  it('pulls confidence toward a stat-based equilibrium instead of permanent negative drift', () => {
    getAdaptation('A').confidence=-0.5;
    for(let ep=10;ep<18;ep++) updateAdaptationFromEpisode({ num:ep, eliminated:'C', votes:{C:2}, votingLog:[{voter:'A',voted:'C'},{voter:'B',voted:'C'}] });
    expect(getAdaptation('A').confidence).toBeGreaterThan(-0.1);
  });

  it('renders learning and the room as story material instead of internal-stat prose', () => {
    const lines=[];
    _textAdaptation({ tribalPlayers:['A','B','C'], voteCommitmentDiagnostics:[
      {voter:'A',predictedBallot:'C'},{voter:'B',predictedBallot:'C'},{voter:'C',predictedBallot:'A'}
    ], eliminated:'C', votePitches:[{pitcher:'B',pitchTarget:'A',responses:[{reason:'protecting-target'}]}], adaptationEvents:[
      {player:'A',type:'blindside'},{player:'B',type:'credible-pitch'}
    ] }, text=>lines.push(text), title=>lines.push(`=== ${title} ===`));
    const copy=lines.join('\n');
    expect(copy).toContain('THE ROOM — AND WHAT LINGERS');
    expect(copy).toMatch(/C's exit|final parchment|decisive movement/);
    expect(copy).toContain('A');
    expect(copy).toMatch(/resistance lived|clearer map|fingerprints/);
    expect(copy).not.toContain('gradual behavioral adjustments');
    expect(copy).not.toContain('contestant-specific baseline');
  });
});
