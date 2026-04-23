// js/chal/masters-of-disasters.js — Masters of Disasters disaster challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

export function simulateMastersOfDisasters(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    earthquake: null,
    submarine: null,
    breakEvents: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.mastersOfDisasters = result;
  ep.challengeType = 'masters-of-disasters';
  ep.challengeLabel = 'Masters of Disasters';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  // TODO: Phases go here

  const tNames = Object.keys(result.tribeScores);
  result.tribeScores[tNames[Math.random() < 0.5 ? 0 : 1]] += 1;

  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.tribalPlayers = [...ep.loser.members];
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);

  updateChalRecord(ep);

  ep.campEvents[campKey].post.push({
    text: `Masters of Disasters: ${winnerName} survives the disasters. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'MASTERS OF DISASTERS', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugMastersOfDisasters = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
  };
}

export function _textMastersOfDisasters(ep, ln, sec) {
  const md = ep.mastersOfDisasters;
  if (!md) return;
  sec('Masters of Disasters');
  ln('The teams face disaster-themed challenges — survive an earthquake marathon, then escape a sinking submarine.');
}

export function rpBuildMastersOfDisastersTitleCard(ep) {
  if (!ep.mastersOfDisasters) return '';
  return '<div style="padding:40px;text-align:center;color:#f97316;font-family:serif;"><h1>🌋 MASTERS OF DISASTERS</h1><p>Title Card — Full VP coming soon</p></div>';
}

export function mastersOfDisastersRevealNext() {}
export function mastersOfDisastersRevealAll() {}
