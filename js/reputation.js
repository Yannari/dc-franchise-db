// Long-term strategic reputations earned from visible behavior across episodes.
import { gs } from './core.js';

const clamp = n => Math.max(0, Math.min(1, n));

export function strategicReputation(name, currentEp = null) {
  const history = [...(gs.episodeHistory || []), ...(currentEp ? [currentEp] : [])];
  const pitches = history.flatMap(ep => ep.votePitches || []);
  const ownPitches = pitches.filter(p => p.pitcher === name);
  const pitchResponses = pitches.flatMap(p => p.responses || []).filter(r => r.voter === name);
  const successfulPitches = ownPitches.filter(p => p.success).length;
  const coalitionBallots = ownPitches.reduce((n, p) => n + Math.max(0, (p.confirmedCoalition || []).length - 1), 0);
  const leaks = pitchResponses.filter(r => r.leaked).length;
  const lies = ownPitches.filter(p => p.liedAboutNumbers).length;
  const secretFlips = history.flatMap(ep => ep._secretBetrayals || []).filter(b => b.player === name).length;
  const betrayals = (gs.namedAlliances || []).flatMap(a => a.betrayals || []).filter(b => b.player === name);
  const repairs = (gs.allianceRepairHistory || []).filter(r => r.player === name);
  const forgiven = repairs.filter(r => r.outcome === 'forgiven').length;
  const failedRepairs = repairs.filter(r => r.outcome === 'fracture' || r.outcome === 'rejected').length;
  const sharedIdols = history.flatMap(ep => ep.idolShares || []).filter(s => s.from === name).length;
  const bigMoves = gs.playerStates?.[name]?.bigMoves || 0;

  const loyaltyEvidence = Math.max(3, history.filter(ep => (ep.votingLog || []).some(v => v.voter === name)).length);
  const reliability = clamp(0.58 + (forgiven * 0.08 + sharedIdols * 0.05
    - betrayals.filter(b => b.severity !== 'minor').length * 0.16 - failedRepairs * 0.10) / Math.sqrt(loyaltyEvidence));
  const persuasionEvidence = ownPitches.length;
  const persuasion = persuasionEvidence
    ? clamp(0.24 + successfulPitches / persuasionEvidence * 0.48 + Math.min(0.22, coalitionBallots * 0.035))
    : 0.42;
  const discretionEvidence = pitchResponses.length;
  const discretion = discretionEvidence ? clamp(0.82 - leaks / discretionEvidence * 0.72) : 0.58;
  const control = clamp(0.28 + Math.min(0.38, ownPitches.length * 0.075)
    + Math.min(0.28, bigMoves * 0.055) + Math.min(0.12, coalitionBallots * 0.02));
  const deceptionEvidence = ownPitches.length + secretFlips + failedRepairs;
  const deception = deceptionEvidence
    ? clamp(0.12 + (lies + secretFlips + failedRepairs * 0.7) / Math.max(2, deceptionEvidence) * 0.72)
    : 0.18;
  const evidence = { loyalty:loyaltyEvidence, persuasion:persuasionEvidence, discretion:discretionEvidence,
    deception:deceptionEvidence, pitches:ownPitches.length, leaks, betrayals:betrayals.length };
  const labels = [];
  if (loyaltyEvidence >= 3 && reliability >= 0.72) labels.push('Dependable');
  if (betrayals.length >= 2 && reliability <= 0.40) labels.push('Unreliable');
  if (persuasionEvidence >= 2 && persuasion >= 0.66) labels.push('Persuasive');
  if (discretionEvidence >= 2 && discretion <= 0.35) labels.push('Leaky');
  if (discretionEvidence >= 3 && discretion >= 0.76) labels.push('Discreet');
  if (ownPitches.length >= 2 && control >= 0.68) labels.push('Controlling');
  if (deceptionEvidence >= 2 && deception >= 0.62) labels.push('Deceptive');
  return { name, reliability, persuasion, discretion, control, deception, evidence, labels:labels.slice(0, 3) };
}

export function reputationModifier(name, context, currentEp = null) {
  const r = strategicReputation(name, currentEp);
  const persuasion = r.evidence.persuasion ? r.persuasion - 0.5 : 0;
  const discretion = r.evidence.discretion ? r.discretion - 0.5 : 0;
  const deception = r.evidence.deception ? r.deception - 0.5 : 0;
  const reliability = r.evidence.betrayals || (gs.allianceRepairHistory || []).some(x => x.player === name)
    ? r.reliability - 0.5 : 0;
  const control = r.evidence.pitches >= 2 || (gs.playerStates?.[name]?.bigMoves || 0) >= 2 ? r.control - 0.5 : 0;
  if (context === 'pitch-trust') return persuasion * 0.32 + reliability * 0.20 - deception * 0.26;
  if (context === 'recruitment') return reliability * 0.36 + discretion * 0.16 - deception * 0.18;
  if (context === 'idol-trust') return reliability * 0.42 + discretion * 0.24
    - deception * 0.28 - (r.labels.includes('Unreliable') ? 0.16 : 0);
  if (context === 'jury') return persuasion * 0.34 + reliability * 0.24
    + control * 0.20 - Math.max(0, deception - 0.15) * 0.18;
  if (context === 'leak') return r.evidence.discretion ? -discretion * 0.34 : 0;
  return 0;
}

export function updateStrategicReputations(ep) {
  gs.strategicReputations = gs.strategicReputations || {};
  const changes = [];
  (gs.activePlayers || []).forEach(name => {
    const previous = gs.strategicReputations[name] || { labels:[] };
    const next = strategicReputation(name, ep);
    const earned = next.labels.filter(label => !previous.labels?.includes(label));
    const lost = (previous.labels || []).filter(label => !next.labels.includes(label));
    gs.strategicReputations[name] = next;
    if (earned.length || lost.length) changes.push({ player:name, earned, lost, reputation:next });
  });
  ep.strategicReputations = Object.fromEntries((gs.activePlayers || []).map(name => [name, gs.strategicReputations[name]]));
  ep.reputationChanges = changes;
  return changes;
}
