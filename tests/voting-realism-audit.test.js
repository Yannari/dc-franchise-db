import { describe, expect, it, vi } from 'vitest';
import { gs } from '../js/core.js';
import { getBond, setBond } from '../js/bonds.js';
import { resolveVotes, simulateVotes } from '../js/voting.js';
import { getShowmance, getShowmancePartner } from '../js/romance.js';
import { seedGame } from './helpers/setup.js';

function lcg(seed) {
  let state = seed >>> 0;
  return () => ((state = (1664525 * state + 1013904223) >>> 0) / 0x100000000);
}

function pct(value) { return `${(value * 100).toFixed(1)}%`; }

function runAudit(trials = 400, seed = 20260715) {
  const random = lcg(seed);
  const randomSpy = vi.spyOn(Math, 'random').mockImplementation(random);
  const priorGlobalGetBond = globalThis.getBond;
  const priorGlobalGetShowmance = globalThis.getShowmance;
  const priorGlobalGetShowmancePartner = globalThis.getShowmancePartner;
  globalThis.getBond = getBond;
  globalThis.getShowmance = getShowmance;
  globalThis.getShowmancePartner = getShowmancePartner;
  const totals = { tribals:0, ballots:0, singletonBallots:0, fragmented:0, majority:0, plurality:0, ties:0,
    predictions:0, matches:0, allianceBallots:0, alliancePlanBallots:0, pitches:0, workingPitches:0,
    leakedResponses:0, pitchCounters:0, idolSplits:0 };
  try {
    for (let trial = 0; trial < trials; trial++) {
      const names = Array.from({ length:10 }, (_, i) => `P${i + 1}`);
      const stat = () => 2 + Math.floor(random() * 9);
      seedGame(names.map(name => ({ name, stats:{ social:stat(), strategic:stat(), intuition:stat(), loyalty:stat(),
        boldness:stat(), temperament:stat(), physical:stat(), endurance:stat(), mental:stat() } })), {
        episode:9, phase:'post-merge', isMerged:true, mergeName:'Merged', episodeHistory:[],
        tribes:[{ name:'Merged', members:[...names] }], lostVotes:[], strategicMemories:{},
        playerStates:Object.fromEntries(names.map((name, i) => [name, { emotional:['comfortable','uneasy','calculating','paranoid'][i % 4], bigMoves:0 }])),
        chalRecord:Object.fromEntries(names.map(name => [name, { wins:Math.floor(random()*3), podiums:Math.floor(random()*5), bombs:Math.floor(random()*4) }])),
      });
      const rotate = offset => names[(trial + offset) % names.length];
      const alliances = [
        { type:'alliance', label:'Core', members:[...names.slice(0,5)], target:rotate(7) },
        { type:'alliance', label:'Counter', members:[...names.slice(5,9)], target:rotate(1) },
        { type:'consensus', label:'Swing', members:[names[2], names[5], names[9]], target:rotate(6) },
      ].filter(plan => !plan.members.includes(plan.target));
      gs.namedAlliances = alliances.filter(a => a.type === 'alliance').map(a => ({ name:a.label, members:[...a.members], active:true, formed:5 }));
      alliances.forEach(alliance => alliance.members.forEach((a, i) => alliance.members.slice(i + 1).forEach(b => setBond(a, b, 0.8 + random() * 2.2))));

      const result = simulateVotes(names, [], alliances, [], false);
      const ballots = result.log.filter(row => row.voter && row.voter !== 'THE GAME' && !row.sitdSacrificed && !row.isBlackVote);
      const counts = ballots.reduce((map, row) => (map[row.voted] = (map[row.voted] || 0) + 1, map), {});
      const values = Object.values(counts);
      const top = Math.max(0, ...values);
      const majority = Math.floor(ballots.length / 2) + 1;
      totals.tribals++;
      totals.ballots += ballots.length;
      totals.singletonBallots += values.filter(n => n === 1).length;
      if (values.length >= 4) totals.fragmented++;
      if (top >= majority) totals.majority++; else totals.plurality++;
      if (resolveVotes(counts).isTie) totals.ties++;
      (result.voteCommitmentDiagnostics || []).forEach(read => {
        if (!read.actualBallot) return;
        totals.predictions++;
        if (read.predictionMatched) totals.matches++;
      });
      alliances.forEach(alliance => alliance.members.forEach(member => {
        const ballot = ballots.find(row => row.voter === member);
        if (!ballot) return;
        totals.allianceBallots++;
        if (ballot.voted === alliance.target) totals.alliancePlanBallots++;
      }));
      (result.votePitches || []).forEach(pitch => {
        totals.pitches++;
        if (pitch.success) totals.workingPitches++;
        totals.leakedResponses += (pitch.responses || []).filter(response => response.leaked).length;
      });
      totals.pitchCounters += ballots.filter(row => row.lateTrigger === 'pitch-exposure-counter').length;
    }
  } finally {
    randomSpy.mockRestore();
    if (priorGlobalGetBond) globalThis.getBond = priorGlobalGetBond;
    else delete globalThis.getBond;
    if (priorGlobalGetShowmance) globalThis.getShowmance = priorGlobalGetShowmance;
    else delete globalThis.getShowmance;
    if (priorGlobalGetShowmancePartner) globalThis.getShowmancePartner = priorGlobalGetShowmancePartner;
    else delete globalThis.getShowmancePartner;
  }
  return {
    trials:totals.tribals,
    forecastAccuracy:totals.matches / Math.max(1, totals.predictions),
    allianceCohesion:totals.alliancePlanBallots / Math.max(1, totals.allianceBallots),
    fragmentedRate:totals.fragmented / totals.tribals,
    majorityRate:totals.majority / totals.tribals,
    pluralityRate:totals.plurality / totals.tribals,
    tieRate:totals.ties / totals.tribals,
    singletonTargetsPerTribal:totals.singletonBallots / totals.tribals,
    pitchesPerTribal:totals.pitches / totals.tribals,
    pitchSuccessRate:totals.workingPitches / Math.max(1, totals.pitches),
    leaksPerPitch:totals.leakedResponses / Math.max(1, totals.pitches),
    pitchCountersPerTribal:totals.pitchCounters / totals.tribals,
  };
}

describe('large-sample voting realism audit', () => {
  it('reports stable strategic behavior without catastrophic extremes', () => {
    const report = runAudit();
    console.table([{
      tribals:report.trials,
      'forecast accuracy':pct(report.forecastAccuracy),
      'alliance cohesion':pct(report.allianceCohesion),
      '4+ target votes':pct(report.fragmentedRate),
      'majority outcomes':pct(report.majorityRate),
      'plurality outcomes':pct(report.pluralityRate),
      ties:pct(report.tieRate),
      'singleton targets/tribal':report.singletonTargetsPerTribal.toFixed(2),
      'pitches/tribal':report.pitchesPerTribal.toFixed(2),
      'pitch success':pct(report.pitchSuccessRate),
      'leaks/pitch':report.leaksPerPitch.toFixed(2),
      'pitch counters/tribal':report.pitchCountersPerTribal.toFixed(2),
    }]);
    expect(report.forecastAccuracy).toBeGreaterThan(0.35);
    expect(report.forecastAccuracy).toBeLessThan(0.95);
    expect(report.allianceCohesion).toBeGreaterThan(0.25);
    expect(report.allianceCohesion).toBeLessThan(0.95);
    expect(report.tieRate).toBeLessThan(0.20);
    expect(report.pitchesPerTribal).toBeGreaterThan(0.02);
    expect(report.pitchesPerTribal).toBeLessThan(1.5);
    expect(report.pitchSuccessRate).toBeLessThan(0.90);
  });
});
