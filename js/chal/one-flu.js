// js/chal/one-flu.js — One Flu Over the Cuckoos medical challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

export function simulateOneFlu(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    studySleep: null,
    medicalQuiz: null,
    assembly: null,
    diseaseOutbreak: null,
    breakEvents: null,
    rewardWinner: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.oneFlu = result;
  ep.challengeType = 'one-flu';
  ep.challengeLabel = 'One Flu Over the Cuckoos';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  // TODO: Phases go here

  // Temp winner
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
    text: `One Flu Over the Cuckoos: ${winnerName} wins the medical challenge. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'ONE FLU', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugOneFlu = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
  };
}

export function _textOneFlu(ep, ln, sec) {
  const of = ep.oneFlu;
  if (!of) return;
  sec('One Flu Over the Cuckoos');
  ln('The teams face a medical-themed challenge — study, diagnose, and survive a fake disease outbreak.');
}

export function rpBuildOneFluTitleCard(ep) {
  if (!ep.oneFlu) return '';
  return '<div style="padding:40px;text-align:center;color:#60a5fa;font-family:serif;"><h1>🏥 ONE FLU OVER THE CUCKOOS</h1><p>Title Card — Full VP coming soon</p></div>';
}

export function oneFluRevealNext() {}
export function oneFluRevealAll() {}
