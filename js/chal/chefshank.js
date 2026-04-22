// js/chal/chefshank.js — The Chefshank Redemption prison challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

export function simulateChefshank(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    prisonFood: null,
    prisonBreak: null,
    breakEvents: null,
    goldenShovel: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.chefshank = result;
  ep.challengeType = 'chefshank';
  ep.challengeLabel = 'The Chefshank Redemption';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  // TODO: Phase 1 (Prison Food) + Phase 2 (Prison Break) go here

  // Temp: random winner
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
    text: `The Chefshank Redemption: ${winnerName} breaks free. ${loserName} stays locked up — tribal council tonight.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'CHEFSHANK REDEMPTION', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugChefshank = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
  };
}

export function _textChefshank(ep, ln, sec) {
  const cs = ep.chefshank;
  if (!cs) return;
  sec('The Chefshank Redemption');
  ln('The teams face a prison-themed challenge — cook disgusting food, then dig their way to freedom.');
}

export function rpBuildChefshankTitleCard(ep) {
  if (!ep.chefshank) return '';
  return '<div style="padding:40px;text-align:center;color:#6b7280;font-family:serif;"><h1>⛓️ THE CHEFSHANK REDEMPTION</h1><p>Title Card — Full VP coming soon</p></div>';
}

export function chefshankRevealNext() {}
export function chefshankRevealAll() {}
