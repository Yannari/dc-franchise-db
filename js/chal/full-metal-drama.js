// js/chal/full-metal-drama.js — Full Metal Drama war challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

export function simulateFullMetalDrama(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    planeJump: null,
    paintBomb: null,
    captureFlag: null,
    breakEvents: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.fullMetalDrama = result;
  ep.challengeType = 'full-metal-drama';
  ep.challengeLabel = 'Full Metal Drama';

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
    text: `Full Metal Drama: ${winnerName} wins the war. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'FULL METAL DRAMA', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugFullMetalDrama = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
  };
}

export function _textFullMetalDrama(ep, ln, sec) {
  const fm = ep.fullMetalDrama;
  if (!fm) return;
  sec('Full Metal Drama');
  ln('The teams go to war — plane jump, paint bomb explosions, and capture the flag.');
}

export function rpBuildFullMetalDramaTitleCard(ep) {
  if (!ep.fullMetalDrama) return '';
  return '<div style="padding:40px;text-align:center;color:#84cc16;font-family:serif;"><h1>⚔️ FULL METAL DRAMA</h1><p>Title Card — Full VP coming soon</p></div>';
}

export function fullMetalDramaRevealNext() {}
export function fullMetalDramaRevealAll() {}
