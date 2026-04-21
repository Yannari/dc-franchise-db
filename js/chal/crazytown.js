// js/chal/crazytown.js — 3:10 to Crazytown Western challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

export function simulateCrazytown(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    horseDive: null,
    standoff: null,
    roundup: null,
    breakEvents1: null,
    breakEvents2: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.crazytown = result;
  ep.challengeType = 'crazytown';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  // TODO: Phase 1, 2, 3 go here

  // Winner/loser — give each tribe 1 point randomly for now so there's always a winner
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
    text: `3:10 to Crazytown: ${winnerName} wins the Western showdown. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: '3:10 TO CRAZYTOWN', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugCrazytown = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
  };
}

export function _textCrazytown(ep, ln, sec) {
  const ct = ep.crazytown;
  if (!ct) return;
  sec('3:10 to Crazytown');
  ln('The teams saddle up for a rootin\'-tootin\' Western showdown.');
}

export function rpBuildCrazytownTitleCard(ep) {
  if (!ep.crazytown) return '';
  return '<div style="padding:40px;text-align:center;color:#d4a574;font-family:serif;"><h1>🤠 3:10 TO CRAZYTOWN</h1><p>Title Card — Full VP coming soon</p></div>';
}

export function crazytownRevealNext() {}
export function crazytownRevealAll() {}
