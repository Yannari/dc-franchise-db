// js/chal/beach-blanket-bogus.js
import { gs, players } from '../core.js';
import { pStats, pronouns, romanticCompat, updateChalRecord } from '../players.js';
import { getBond, addBond } from '../bonds.js';

export function simulateBeachBlanketBogus(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    chrisOpener: 'Chris stands on a fake beach set. Behind him: a pool full of sharks, a pile of sand, and a disco ball. "Welcome to Beach Blanket Bogus!"',
    chrisCloser: '"And that\'s a wrap on Beach Blanket Bogus! One tribe is safe. The other... not so much."',
    phases: [],
    tribeScores: {},
    surfData: null,
    sandcastleData: null,
    halftimeEvents: null,
    danceOff: null,
  };

  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.beachBlanketBogus = result;
  ep.challengeType = 'beach-blanket-bogus';

  // Placeholder winner/loser (phases will be added in subsequent tasks)
  const sortedTribes = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sortedTribes[0][0];
  const loserName = sortedTribes[sortedTribes.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.challengePlacements = sortedTribes.map(([name]) => {
    const t = tribes.find(tr => tr.name === name);
    return { name, members: [...(t?.members || [])] };
  });
  ep.tribalPlayers = [...(ep.loser?.members || [])];

  const chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(name => { chalMemberScores[name] = 0; });
  ep.chalMemberScores = chalMemberScores;
  updateChalRecord(ep);

  if (!gs.popularity) gs.popularity = {};
}

export function _textBeachBlanketBogus(ep, ln, sec) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return;
  ln('Chris announces the Beach Blanket Bogus challenge — three beach-themed events on the film lot.');
  sec();
}

export function rpBuildBeachBlanketBogusTitleCard(ep) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return '';
  return _bbbShell(`
    <div style="text-align:center;padding:40px 20px;">
      <div style="font-size:32px;font-weight:900;letter-spacing:3px;color:#fff;text-shadow:3px 3px 0 #c4421a;">BEACH BLANKET BOGUS</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:8px;">${bbb.chrisOpener}</div>
    </div>
  `, ep);
}

function _bbbShell(content, ep) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Bowlby+One+SC&family=Inter:wght@400;600;700;900&display=swap');
.bbb-shell{font-family:'Inter',sans-serif;color:#1b2838;background:linear-gradient(180deg,#ff6b35 0%,#f7931e 15%,#ffd700 30%,#87CEEB 50%,#0d6986 75%,#0a3d5c 100%);padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px}
.bbb-header{background:rgba(0,0,0,0.3);backdrop-filter:blur(8px);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid rgba(255,255,255,0.15)}
.bbb-title{font-family:'Bowlby One SC',sans-serif;font-size:18px;color:#fff;text-shadow:2px 2px 0 #c4421a;letter-spacing:2px}
.bbb-subtitle{font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:3px;text-transform:uppercase}
</style>
<div class="bbb-shell">
  <div class="bbb-header">
    <div>
      <div class="bbb-title">BEACH BLANKET BOGUS</div>
      <div class="bbb-subtitle">Surf · Build · Dance</div>
    </div>
    <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;">EPISODE ${ep.num || '?'}</div>
  </div>
  ${content}
</div>`;
}

export function beachBogusRevealNext(stateKey, totalSteps) {}
export function beachBogusRevealAll(stateKey, totalSteps) {}
