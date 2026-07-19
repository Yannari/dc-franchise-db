import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { seedGame } from './helpers/setup.js';
import { seatedJury } from '../js/finale.js';
import { resetKnowledge } from '../js/knowledge.js';
import { recordVoteArchitect, juryArchitectCredit, juryBelievesBooter, reconcileJuryPerception, ftcCorrectBelief } from '../js/knowledge-integration.js';

// Merged game: jury of two, a pitch organizer takes out the boot.
// Ripper is sharp (sees through lies); Axel is not.
function seed() {
  seedGame([
    { name: 'Caleb' }, { name: 'Wayne' }, { name: 'Millie' },
    { name: 'Axel', stats: { intuition: 1, strategic: 1 } },
    { name: 'Ripper', stats: { intuition: 10, strategic: 9 } },
  ], { episode: 8 });
  gs.isMerged = true;
  gs.jury = ['Ripper', 'Axel'];        // already out
  resetKnowledge();
  gs.stolenCredit = null;
}
beforeEach(seed);

function bootByPitch(pitcher, booted) {
  return { num: 9, eliminated: booted,
    votePitches: [{ pitcher, pitchTarget: booted, confirmedCoalition: [pitcher, 'Wayne', 'Millie'] }],
    votingLog: [{ voter: pitcher, voted: booted }, { voter: 'Wayne', voted: booted }, { voter: 'Millie', voted: booted }] };
}

describe('#5 jury perception — vote-architect beliefs', () => {
  it('the jury credits the real organizer when the move was visible', () => {
    const res = recordVoteArchitect(bootByPitch('Caleb', 'Millie'), 9);
    expect(res.credited).toBe('Caleb');
    expect(res.stolen).toBe(false);
    // Sitting jurors believe Caleb ran it; the booted player believes Caleb took them out.
    expect(juryArchitectCredit('Ripper', 'Caleb')).toBeGreaterThan(0);
    expect(juryBelievesBooter('Millie', 'Caleb')).toBeGreaterThan(0.4);
    // Nobody credits an uninvolved player.
    expect(juryArchitectCredit('Ripper', 'Axel')).toBe(0);
  });

  it('stolen credit makes the jury believe the WRONG person', () => {
    gs.stolenCredit = { architect: 'Caleb', stealer: 'Wayne', ep: 8, confronted: false };
    const res = recordVoteArchitect(bootByPitch('Caleb', 'Millie'), 9);
    expect(res.credited).toBe('Wayne');   // the thief
    expect(res.stolen).toBe(true);
    expect(juryArchitectCredit('Ripper', 'Wayne')).toBeGreaterThan(0);  // false belief
    expect(juryArchitectCredit('Ripper', 'Caleb')).toBe(0);             // real mover gets nothing
  });

  it('does nothing pre-merge (no jury to perceive anything)', () => {
    gs.isMerged = false;
    expect(recordVoteArchitect(bootByPitch('Caleb', 'Millie'), 9)).toBeNull();
  });

  it('credit accumulates across multiple boots but is capped', () => {
    recordVoteArchitect(bootByPitch('Caleb', 'Millie'), 9);
    gs.jury.push('Millie');
    recordVoteArchitect(bootByPitch('Caleb', 'Wayne'), 10);
    const credit = juryArchitectCredit('Ripper', 'Caleb');
    expect(credit).toBeGreaterThan(0);
    expect(credit).toBeLessThanOrEqual(3);   // capped
  });

  it('Ponderosa: a sharp juror sees through stolen credit and reattributes it', () => {
    gs.stolenCredit = { architect: 'Caleb', stealer: 'Wayne', ep: 8, confronted: false };
    recordVoteArchitect(bootByPitch('Caleb', 'Millie'), 9);
    expect(juryArchitectCredit('Ripper', 'Wayne')).toBeGreaterThan(0); // false belief first
    const fixes = reconcileJuryPerception(['Ripper', 'Axel'], 9, () => 0); // force see-through roll
    expect(fixes.some(f => f.juror === 'Ripper' && f.kind === 'corrected' && f.to === 'Caleb')).toBe(true);
    expect(juryArchitectCredit('Ripper', 'Caleb')).toBeGreaterThan(0);   // now credits the real mover
  });

  it('seats only the configured number of jurors (most recent eliminees)', () => {
    seasonConfig.jurySize = 7;
    gs.jury = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10']; // 10 post-merge eliminees
    const seated = seatedJury();
    expect(seated.length).toBe(7);
    expect(seated).toEqual(['E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10']); // the last 7
    // A smaller jury than the cap is left untouched.
    gs.jury = ['E1', 'E2', 'E3'];
    expect(seatedJury()).toEqual(['E1', 'E2', 'E3']);
  });

  it('FTC correction: a finalist reclaims a move a juror mis-credited', () => {
    gs.stolenCredit = { architect: 'Caleb', stealer: 'Wayne', ep: 8, confronted: false };
    recordVoteArchitect(bootByPitch('Caleb', 'Millie'), 9);
    expect(juryArchitectCredit('Ripper', 'Wayne')).toBeGreaterThan(0);
    const fixed = ftcCorrectBelief('Caleb', 'Ripper', 1, 9, () => 0); // persuasion 1 → certain
    expect(fixed?.stolenFrom).toBe('Wayne');
    expect(juryArchitectCredit('Ripper', 'Caleb')).toBeGreaterThan(0);
    // A finalist who did NOT do the move cannot steal the credit back.
    expect(ftcCorrectBelief('Axel', 'Ripper', 1, 9, () => 0)).toBeNull();
  });
});
