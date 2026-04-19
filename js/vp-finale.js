// ══════════════════════════════════════════════════════════════════════
// vp-finale.js — Finale VP screens, jury, reunion, season stats, debug
// ══════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined' && !window._tvState) window._tvState = {};

export function rpBuildFinaleCampLife(ep) {
  // Show ALL players who entered the finale (before fire-making/koh-lanta eliminations)
  // finaleEntrants is snapshotted at the very start of simulateFinale, before any cuts
  const finalists = ep.finaleEntrants || ep.gsSnapshot?.activePlayers || ep.finaleFinalists || gs.activePlayers;
  if (!finalists.length) return null;
  const epNum = ep.num;

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Episode ${epNum} \u2014 Finale</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:4px;text-transform:uppercase">The Last Morning</div>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:24px;letter-spacing:1.5px">Day ${epNum > 1 ? (epNum - 1) * 3 : 1}. The fire is low. The game is almost over.</div>`;

  // Finalist portraits row
  html += `<div style="display:flex;justify-content:center;gap:24px;margin-bottom:24px">
    ${finalists.map(f => {
      const wins = gs.episodeHistory.filter(e => e.immunityWinner === f).length;
      const arch = vpArchLabel(f);
      return `<div style="text-align:center">
        ${rpPortrait(f, 'lg')}
        <div style="font-size:12px;font-family:var(--font-display);margin-top:6px">${f}</div>
        <div style="font-size:10px;color:var(--muted)">${arch}</div>
        <div style="font-size:10px;color:var(--muted)">${wins} win${wins !== 1 ? 's' : ''}</div>
      </div>`;
    }).join('')}
  </div>`;

  // Per-finalist confessional blocks
  finalists.forEach(f => {
    const s = pStats(f);
    const fp = pronouns(f);
    const arch = players.find(p => p.name === f)?.archetype || '';
    const wins = gs.episodeHistory.filter(e => e.immunityWinner === f).length;
    const votesAgainst = gs.episodeHistory.reduce((sum, e) => {
      const vlog = e.votingLog || [];
      return sum + vlog.filter(v => v.voted === f && v.voter !== 'THE GAME').length;
    }, 0);
    const idolsPlayed = gs.episodeHistory.reduce((sum, e) => {
      return sum + (e.idolPlays || []).filter(p => p.player === f).length;
    }, 0);
    const allianceNames = [...new Set(gs.episodeHistory.flatMap(e =>
      (e.alliances || []).filter(a => a.members?.includes(f) && a.members?.length >= 2).flatMap(a => a.members.filter(m => m !== f))
    ))].slice(0, 3);
    const rivalNames = gs.episodeHistory.reduce((rivals, e) => {
      (e.alliances || []).forEach(a => {
        if (a.target === f && a.members?.length) rivals.add(a.members[0]);
      });
      return rivals;
    }, new Set());

    // Journey confessional — archetype + stats driven
    let journey;
    if (arch === 'mastermind' || arch === 'schemer' || s.strategic >= 8)
      journey = `"I came into this game knowing exactly what I wanted to do. Control the votes. Control the relationships. Control the outcome. And I'm still here \u2014 so either I did that, or I got lucky. I don't believe in luck."`;
    else if (arch === 'challenge-beast' || s.physical >= 8)
      journey = `"People underestimated me early. They saw a physical player and thought that's all I had. But I learned. I adapted. And every time they came for me, I won the challenge that mattered."`;
    else if (arch === 'social-butterfly' || s.social >= 8)
      journey = `"I built something real out here. Every conversation, every late-night talk by the fire \u2014 those weren't moves. Those were genuine connections. And somehow, they carried me to the end."`;
    else if (arch === 'loyal-soldier' || s.loyalty >= 8)
      journey = `"I gave my word to the people I trusted, and I kept it. In a game full of liars, I tried to be someone you could count on. Maybe that's not flashy. But I'm still here."`;
    else if (arch === 'underdog')
      journey = `"Nobody picked me to make it this far. Not the other players, not the audience, probably not even myself. But here I am. I survived every vote they threw at me."`;
    else if (arch === 'hothead' || s.temperament <= 3)
      journey = `"I know I'm not easy. I know I burned some people. But I never pretended to be something I wasn't out here. Every emotion was real. Every fight was real. And I'm in the finale."`;
    else
      journey = `"If you told me on day one that I'd be sitting here on the last morning, I would have laughed. But here I am. And I earned every single day."`;

    // Relationships line
    let relLine = '';
    if (allianceNames.length >= 2)
      relLine = `${fp.Sub} built ${fp.pos} game around ${allianceNames.slice(0, 2).join(' and ')}. Some of those bonds survived. Some didn't.`;
    else if (allianceNames.length === 1)
      relLine = `${allianceNames[0]} was ${fp.pos} closest ally out here. Whether that's enough to win \u2014 that's tonight's question.`;
    if ([...rivalNames].length)
      relLine += ` ${[...rivalNames][0]} was the rival ${fp.sub} never shook.`;

    // What's at stake
    let stakeLine = '';
    if (wins >= 3) stakeLine = `${f} has dominated challenges. The jury knows it.`;
    else if (votesAgainst >= 6) stakeLine = `${f} has survived ${votesAgainst} votes against. The target was always there.`;
    else if (idolsPlayed >= 1) stakeLine = `${f} played an idol when it mattered. The jury saw that.`;
    else if (s.social >= 7) stakeLine = `${f}'s social connections could carry the jury vote \u2014 if ${fp.sub} can articulate what ${fp.sub} did.`;
    else stakeLine = `${f} made it to the end. Now ${fp.sub} ${fp.sub === 'they' ? 'have' : 'has'} to prove it wasn't by accident.`;

    html += `<div style="margin-bottom:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        ${rpPortrait(f, 'sm')}
        <div>
          <div style="font-family:var(--font-display);font-size:14px">${f}</div>
          <div style="font-size:10px;color:var(--muted)">${vpArchLabel(f)}</div>
        </div>
      </div>
      <div style="font-size:13px;color:#cdd9e5;line-height:1.7;font-style:italic;margin-bottom:8px">${journey}</div>
      ${relLine ? `<div style="font-size:12px;color:#8b949e;line-height:1.5;margin-bottom:6px">${relLine}</div>` : ''}
      <div style="font-size:12px;color:var(--accent-gold);line-height:1.5">${stakeLine}</div>
    </div>`;
  });

  // Final morning moment
  const momentTexts = [
    `The fire crackles low. Nobody adds wood. The game doesn't need it anymore.`,
    `Empty hammocks. Empty seats. The spots where the others used to sit are louder than any conversation.`,
    `Someone looks at the tribe flag one last time. It's faded now. Weathered. Just like them.`,
    `The sun comes up the way it always does. But this morning feels different. This morning, it ends.`,
  ];
  const momentIdx = (finalists.reduce((s, f) => s + f.charCodeAt(0), 0) + epNum) % momentTexts.length;
  html += `<div style="text-align:center;font-size:13px;color:#484f58;font-style:italic;margin-top:12px;line-height:1.6;padding:12px 0;border-top:1px solid rgba(255,255,255,0.04)">
    ${momentTexts[momentIdx]}
  </div>`;

  html += `</div>`;
  return html;
}

export function rpBuildFinaleChallenge(ep) {
  const stages = ep.finalChallengeStages || [];
  const winner = ep.immunityWinner;
  const finalists = ep.finaleFinalists || gs.activePlayers;
  if (!winner || !finalists.length) return '';

  let html = `<div class="rp-page tod-arena">
    <div class="rp-eyebrow">Episode ${ep.num} \u2014 Finale</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:6px;text-transform:uppercase">Final Immunity Challenge</div>
    <div style="text-align:center;font-size:11px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:20px">${ep.challengeLabel || 'Mixed'}</div>
    <div style="display:flex;justify-content:center;gap:20px;margin-bottom:20px">
      ${finalists.map(f => `<div style="text-align:center">
        ${rpPortrait(f, 'lg')}
        <div style="font-size:12px;font-family:var(--font-display);margin-top:6px">${f}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${vpArchLabel(f)}</div>
        <div style="font-size:10px;color:var(--muted)">${gs.episodeHistory.filter(e=>e.immunityWinner===f).length} prior wins</div>
      </div>`).join('')}
    </div>`;

  if (stages.length) {
    stages.forEach(stage => {
      if (stage.type === 'opening') {
        html += _renderTwistScene({ text: stage.text, players: finalists });
      } else if (stage.type === 'drop') {
        html += _renderTwistScene({ text: stage.text, players: [stage.dropper], badge: 'Steps Down', badgeClass: 'bad' });
      } else if (stage.type === 'headToHead') {
        html += _renderTwistScene({ text: stage.text, players: stage.remaining, faceOff: stage.remaining.length === 2 });
      } else if (stage.type === 'win') {
        html += _renderTwistScene({ text: stage.text, players: [stage.winner], badge: 'FINAL IMMUNITY', badgeClass: 'win' });
      }
    });
  } else {
    // Old save fallback
    html += _renderTwistScene({ text: `${winner} wins the Final Immunity Challenge \u2014 a guaranteed spot at the end.`, players: [winner], badge: 'FINAL IMMUNITY', badgeClass: 'win' });
  }

  html += `</div>`;
  return html;
}

// ── Koh-Lanta: Orienteering Race Screen ──
export function rpBuildKLOrienteering(ep) {
  if (!ep.klOrienteering) return '';
  const o = ep.klOrienteering;
  // Orienteering-specific exit quote — lost in the jungle, not voted out
  const _eS = pStats(o.eliminated);
  const _ePr = pronouns(o.eliminated);
  const _eqPick = arr => arr[([...o.eliminated].reduce((a,c)=>a+c.charCodeAt(0),0)+(ep.num||0)*3)%arr.length];
  const _eqPool = [];
  if (_eS.mental >= 7) _eqPool.push(`I knew how to read the map. I just read it too slowly. One wrong turn and the game was over. That's the cruelest way to go — not outplayed, just… lost.`);
  else if (_eS.physical >= 7) _eqPool.push(`I'm the fastest one out here. Speed doesn't matter when you're running the wrong direction. The jungle won. Not them.`);
  else if (_eS.strategic >= 7) _eqPool.push(`I controlled votes. I built alliances. I outplayed everyone. And I went home because I couldn't read a compass. There's no strategy for that.`);
  if (_eS.temperament >= 7) _eqPool.push(`I walked out of that jungle knowing it was over. No vote. No tribal. Just the jungle deciding I wasn't fast enough. I can accept that.`);
  else if (_eS.temperament <= 3) _eqPool.push(`No tribal. No chance to fight. No chance to plead my case. I just walked out of the jungle and my torch was gone. That's not how I wanted to go.`);
  _eqPool.push(`I survived every vote. Every blindside. Every twist. And I went home because I got lost. The jungle doesn't care about your game.`);
  _eqPool.push(`I was so close. I could hear the others coming back. I just couldn't find it in time. That's going to stay with me.`);
  _eqPool.push(`No one voted me out. No one outplayed me at tribal. I lost to a map and a compass. That's the hardest thing to accept.`);
  const _eq = _eqPick(_eqPool);

  let html = `<div class="rp-page tod-arena" style="background:radial-gradient(ellipse at 50% 30%, rgba(63,185,80,0.06) 0%, transparent 50%)">
    <div class="rp-eyebrow">Episode ${ep.num} — Finale</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:4px;text-transform:uppercase;color:#3fb950">The Orienteering Race</div>
    <div style="font-size:12px;color:#8b949e;text-align:center;margin-bottom:8px">Four maps. Four compasses. Three daggers. Find yours or go home.</div>
    <div style="font-size:11px;color:#484f58;text-align:center;margin-bottom:20px;max-width:480px;margin-left:auto;margin-right:auto;line-height:1.5">
      Each player is given a map and compass. Somewhere in the jungle, colored beacons mark coordinates to hidden daggers. Decode the beacon, follow the bearing, find the dagger. The first three to return are safe. The last player is eliminated immediately — no vote, no tribal council.
    </div>

    <div style="display:flex;justify-content:center;gap:16px;margin-bottom:24px;flex-wrap:wrap">
      ${o.placements.map(p => `<div style="text-align:center">
        ${rpPortrait(p, 'lg')}
        <div style="font-size:12px;font-weight:700;color:#e6edf3;margin-top:4px">${p}</div>
        <div style="font-size:10px;color:#8b949e">${vpArchLabel(p)}</div>
      </div>`).join('')}
    </div>`;

  // Staged narrative
  o.stages.forEach(stage => {
    const _stageLabels = {
      start: '🗺️ THE RACE BEGINS',
      waiting: '⏳ SILENCE',
      jungle: '🌿 IN THE JUNGLE',
      horn1: '🔔 FIRST HORN',
      pressure1: '⏳ THE WAIT RESUMES',
      horn2: '🔔 SECOND HORN',
      raceForLast: '⚡ RACE FOR LAST',
      horn3: '🔔 THIRD HORN',
    };
    const _stageColors = {
      start: 'rgba(63,185,80,0.3)',
      waiting: 'rgba(139,148,158,0.3)',
      jungle: 'rgba(139,148,158,0.3)',
      horn1: 'rgba(63,185,80,0.4)',
      pressure1: 'rgba(227,179,65,0.3)',
      horn2: 'rgba(63,185,80,0.4)',
      raceForLast: 'rgba(248,81,73,0.3)',
      horn3: stage.eliminated ? 'rgba(248,81,73,0.4)' : 'rgba(63,185,80,0.4)',
    };
    const _labelColors = {
      start: '#3fb950', waiting: '#8b949e', jungle: '#8b949e',
      horn1: '#3fb950', pressure1: '#e3b341', horn2: '#3fb950',
      raceForLast: '#f85149', horn3: stage.eliminated ? '#f85149' : '#3fb950',
    };
    const borderColor = _stageColors[stage.type] || 'rgba(63,185,80,0.3)';
    const label = _stageLabels[stage.type] || stage.type.toUpperCase();
    const labelColor = _labelColors[stage.type] || '#3fb950';
    const icon = stage.player ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">${rpPortrait(stage.player, 'sm')}${stage.eliminated ? rpPortrait(stage.eliminated, 'sm elim') : ''}</div>` : '';
    html += `<div style="padding:14px 18px;background:rgba(0,0,0,0.25);border-left:3px solid ${borderColor};margin-bottom:12px;border-radius:0 8px 8px 0">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:${labelColor};margin-bottom:6px">${label}</div>
      ${icon}
      <div style="font-size:12.5px;color:#cdd9e5;line-height:1.7">${stage.text}</div>
    </div>`;
  });

  // Elimination card
  html += `<div class="rp-elim" style="margin-top:16px">
    <div class="rp-elim-eyebrow">4th Place — Orienteering Race</div>
    ${rpPortrait(o.eliminated, 'xl elim')}
    <div class="rp-elim-name">${o.eliminated}</div>
    <div class="rp-elim-arch">${vpArchLabel(o.eliminated)}</div>
    <div class="rp-elim-quote">"${_eq}"</div>
    <div class="rp-elim-place">Eliminated — Episode ${ep.num}</div>
  </div></div>`;
  return html;
}

// ── Koh-Lanta: The Perch Screen ──
export function rpBuildKLPerch(ep) {
  if (!ep.klPerch) return '';
  const p = ep.klPerch;
  const _allPlayers = p.phases[0]?.remaining || [];
  const _wPr = pronouns(p.winner);

  let html = `<div class="rp-page tod-arena" style="background:radial-gradient(ellipse at 50% 80%, rgba(227,179,65,0.06) 0%, transparent 50%)">
    <div class="rp-eyebrow">Episode ${ep.num} — Finale</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:4px;text-transform:uppercase;color:#e3b341">The Perch</div>
    <div style="font-size:12px;color:#8b949e;text-align:center;margin-bottom:8px">Stand on the perch. Don't fall. Last one standing chooses who sits next to them at Final Tribal.</div>
    <div style="font-size:11px;color:#484f58;text-align:center;margin-bottom:20px;max-width:480px;margin-left:auto;margin-right:auto;line-height:1.5">
      Three wooden perches. Each player stands on a platform supported by removable pegs. Every few minutes, each player pulls a cord to remove a peg — shrinking their platform. The surface goes from full-size to barely a handprint. Last one standing wins final immunity and the power to choose their opponent at FTC.
    </div>

    <div style="display:flex;justify-content:center;gap:20px;margin-bottom:24px;flex-wrap:wrap">
      ${_allPlayers.map(pl => `<div style="text-align:center">
          ${rpPortrait(pl, 'lg')}
          <div style="font-size:12px;font-weight:700;color:#e6edf3;margin-top:4px">${pl}</div>
          <div style="font-size:10px;color:#8b949e">${vpArchLabel(pl)}</div>
        </div>`).join('')}
    </div>`;

  // Phase-by-phase narrative
  const _phaseIcons = ['🟢', '🟡', '🟠', '🔴'];
  p.phases.forEach(phase => {
    const hasDropped = !!phase.dropped;
    if (phase.isInterlude) {
      // Interlude: time passing, pain, heat — different styling
      html += `<div style="padding:12px 18px;background:rgba(0,0,0,0.15);border-left:3px solid rgba(139,148,158,0.2);margin-bottom:12px;border-radius:0 8px 8px 0">
        <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:6px">⏳ TIME PASSES</div>
        <div style="font-size:12px;color:#8b949e;line-height:1.7;font-style:italic">${phase.text}</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          ${phase.remaining.map(r => `<div style="display:flex;align-items:center;gap:4px">${rpPortrait(r, 'xs')}<span style="font-size:9px;color:#484f58">still up</span></div>`).join('')}
        </div>
      </div>`;
      return;
    }
    const borderColor = hasDropped ? 'rgba(248,81,73,0.4)' : phase.phase === 3 ? 'rgba(227,179,65,0.5)' : 'rgba(227,179,65,0.3)';
    const phaseIdx = Math.floor(phase.phase);
    const label = phaseIdx === 0 ? 'FULL PLATFORM' : phaseIdx === 1 ? 'FIRST PEG REMOVED' : phaseIdx === 2 ? 'SECOND PEG REMOVED' : '⚡ FINAL SHOWDOWN';
    html += `<div style="padding:14px 18px;background:rgba(0,0,0,0.25);border-left:3px solid ${borderColor};margin-bottom:12px;border-radius:0 8px 8px 0${phaseIdx === 3 ? ';box-shadow:0 0 12px rgba(227,179,65,0.15)' : ''}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:9px;font-weight:800;letter-spacing:2px;color:${hasDropped ? '#f85149' : '#e3b341'}">${_phaseIcons[Math.min(phaseIdx, 3)]} ${label}</span>
        ${phase.platform ? `<span style="font-size:9px;color:#484f58">${phase.platform}</span>` : ''}
      </div>
      <div style="font-size:12.5px;color:#cdd9e5;line-height:1.7">${phase.text}</div>
      ${hasDropped ? `<div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 12px;background:rgba(248,81,73,0.08);border-radius:6px">
        ${rpPortrait(phase.dropped, 'sm')}
        <div>
          <span style="font-size:11px;font-weight:700;color:#f85149">FALLS</span>
          <div style="font-size:10px;color:#8b949e">${phase.dropped} is out of the challenge</div>
        </div>
      </div>` : `<div style="display:flex;gap:6px;margin-top:8px">
        ${phase.remaining.map(r => `<div style="display:flex;align-items:center;gap:4px">${rpPortrait(r, 'xs')}<span style="font-size:9px;color:#8b949e">holding</span></div>`).join('')}
      </div>`}
    </div>`;
  });

  // Winner reveal
  html += `<div style="text-align:center;margin:24px 0;padding:20px;background:rgba(227,179,65,0.06);border:1px solid rgba(227,179,65,0.2);border-radius:12px">
    ${rpPortrait(p.winner, 'xl immune')}
    <div style="font-size:20px;font-weight:800;color:#e3b341;margin-top:10px;font-family:var(--font-display);letter-spacing:1px">${p.winner}</div>
    <div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#3fb950;margin-top:4px">WINS THE PERCH — FINAL IMMUNITY</div>
    <div style="font-size:11px;color:#8b949e;margin-top:8px;max-width:400px;margin-left:auto;margin-right:auto;line-height:1.5">
      ${_wPr.Sub} ${_wPr.sub==='they'?'outlasted':'outlasted'} everyone on a platform the size of a postcard. ${_wPr.Sub} now ${_wPr.sub==='they'?'choose':'chooses'} who sits next to ${_wPr.obj} at Final Tribal Council — and who goes home.
    </div>
  </div></div>`;
  return html;
}

// ── Koh-Lanta: After the Perch (lobbying scene) ──
export function rpBuildKLCampLife(ep) {
  if (!ep.klChoice || !ep.klPerch) return '';
  const winner = ep.klPerch.winner;
  const others = (ep.klPerch.phases[0]?.remaining || []).filter(p => p !== winner);
  if (!others.length) return '';
  const _pr = pronouns(winner);
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Episode ${ep.num} — Finale</div>
    <div class="rp-title">After the Perch</div>
    <div style="font-size:13px;color:#8b949e;text-align:center;margin-bottom:20px">${winner} holds immunity. Two people need something from ${_pr.obj} right now.</div>`;

  // Winner's weight
  const _wS = pStats(winner);
  html += `<div style="margin-bottom:16px;padding:14px;background:rgba(227,179,65,0.04);border:1px solid rgba(227,179,65,0.15);border-radius:10px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      ${rpPortrait(winner, 'sm')}
      <div>
        <div style="font-size:14px;font-weight:700;color:#e3b341">${winner}</div>
        <div style="font-size:10px;color:#8b949e;font-weight:700;letter-spacing:1px">PERCH WINNER</div>
      </div>
    </div>
    <div style="font-size:12px;color:#cdd9e5;line-height:1.6;font-style:italic">${_pick([
      `${winner} climbs down from the perch and the weight shifts — from ${_pr.pos} legs to ${_pr.pos} mind. Two people are about to make their case. ${_pr.Sub} already ${_pr.sub==='they'?'know':'knows'} what they'll say. The question is whether it changes anything.`,
      `The necklace is around ${_pr.posAdj} neck. ${_pr.Sub} won the Perch. Now comes the harder part: choosing who to bring and who to send home. ${_wS.strategic >= 7 ? `${_pr.Sub}'s already running the numbers.` : `${_pr.Sub}'s thinking about promises made on day one.`}`,
      `${winner} sits alone at camp, legs still trembling from the perch. Two conversations are coming. Two pitches. One choice. ${_pr.Sub} ${_pr.sub==='they'?'stare':'stares'} at the fire and ${_pr.sub==='they'?'wait':'waits'}.`,
    ])}</div>
  </div>`;

  // Each other player lobbies the winner
  others.forEach(player => {
    const bond = getBond(winner, player);
    const pS = pStats(player);
    const pPr = pronouns(player);
    const isChosen = player === ep.klChoice.chosen;
    // Hash-based pick to avoid duplicate text between players
    const _hPick = (arr, seed) => arr[([...(seed || player)].reduce((a,c)=>a+c.charCodeAt(0),0)+(ep.num||0)*7)%arr.length];
    const lobbyText = bond >= 3 ? _hPick([
      `${player} doesn't need to make a pitch. ${pPr.Sub} and ${winner} just look at each other. The understanding is already there. "You know where I stand," ${player} says quietly. The bond between them is the argument.`,
      `${player} finds ${winner} by the water. The conversation is short — they've said everything that matters over the last ${ep.num > 1 ? (ep.num - 1) * 3 : 1} days. "I trust you," ${player} says. ${winner} nods. Whether that trust is returned — that's the question.`,
      `${player} sits next to ${winner} and says nothing for a long time. Then: "We said we'd go to the end together. This is the end." ${winner} doesn't respond. But ${_pr.sub} doesn't leave either.`,
    ]) : bond >= 1 ? _hPick([
      `${player} pulls ${winner} aside. "I know you have a decision to make. I'm just asking you to think about what we've been through." ${pS.social >= 7 ? `It's a carefully measured pitch — not too desperate, not too aggressive.` : `The words come out rougher than ${pPr.sub} intended. The pressure is showing.`}`,
      `${player} makes ${pPr.posAdj} case: "Think about who the jury respects and who they don't. You want to sit next to someone you can beat." ${pS.strategic >= 7 ? `It's a smart argument. ${winner} knows it.` : `It's transparent — but not wrong.`}`,
    ]) : _hPick([
      `${player} approaches ${winner} knowing the odds aren't great. "If you send me home, that's your call. But I'll say this — I'd be easier to beat at FTC than ${others.find(o => o !== player) || 'the other one'}." It's the most honest thing ${pPr.sub}'s said all game.`,
      `${player} doesn't have a strong bond with ${winner}. ${pPr.Sub} ${pPr.sub==='they'?'know':'knows'} it. The pitch isn't about loyalty — it's pure game: "Think about the jury votes. Who are they going to respect more — me or ${others.find(o => o !== player) || 'them'}?"`,
      `${player} barely gets three sentences out before ${pPr.pos} voice cracks. This isn't strategy anymore. It's survival. "I've been out here for ${ep.num > 1 ? (ep.num - 1) * 3 : 1} days. Don't let it end like this."`,
    ]);

    html += `<div style="margin-bottom:12px;padding:12px;background:#0d1117;border:1px solid #21262d;border-radius:8px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(player, 'sm')}
        <div style="font-size:13px;font-weight:700;color:#e6edf3">${player}</div>
        <div style="font-size:10px;color:${bond >= 2 ? '#3fb950' : bond >= 0 ? '#8b949e' : '#f85149'};margin-left:auto">Bond: ${bond >= 3 ? 'Strong' : bond >= 1 ? 'Positive' : bond >= 0 ? 'Neutral' : 'Negative'}</div>
      </div>
      <div style="font-size:12px;color:#8b949e;line-height:1.6;font-style:italic">${lobbyText}</div>
    </div>`;
  });

  html += `</div>`;
  return html;
}

// ── Koh-Lanta: The Choice Screen ──
export function rpBuildKLChoice(ep) {
  if (!ep.klChoice) return '';
  const c = ep.klChoice;
  const _pr = pronouns(c.winner);
  const _ePr = pronouns(c.eliminated);
  // Choice-specific exit quote — cut by the perch winner, not voted out
  const _ceS = pStats(c.eliminated);
  const _cePick = arr => arr[([...c.eliminated].reduce((a,ch)=>a+ch.charCodeAt(0),0)+(ep.num||0)*5)%arr.length];
  const _cePool = [];
  if (c.betrayal) {
    // Ally betrayal — the cut hurts personally
    _cePool.push(`${c.winner} and I had something real out here. Or I thought we did. ${_pr.Sub} looked me in the eyes and chose someone else. That's not strategy. That's betrayal.`);
    _cePool.push(`I trusted ${c.winner}. After everything we went through together, ${_pr.sub} cut me. I'll carry that into the jury room. ${_pr.Sub} can count on it.`);
    _cePool.push(`${c.winner} picked the person ${_pr.sub} can beat over the person ${_pr.sub} ${_pr.sub==='they'?'owe':'owes'}. I get the math. I just don't respect it.`);
    if (_ceS.loyalty >= 7) _cePool.push(`I would never have done that to ${c.winner}. Never. And ${_pr.sub} ${_pr.sub==='they'?'know':'knows'} it. That's what makes this hurt the most.`);
    if (_ceS.strategic >= 7) _cePool.push(`Smart move. Cold move. I would have been harder to beat at FTC. ${c.winner} knew that. But knowing it was smart doesn't make it hurt less.`);
  } else {
    // Not close — less personal, more about the game
    _cePool.push(`I made it to the final three. One person decided that wasn't enough. That's the game — and I lost it on someone else's terms, not mine.`);
    _cePool.push(`${c.winner} had the power and ${_pr.sub} used it. I can't be mad about that. I just wish I'd won the Perch.`);
    _cePool.push(`Third place. I outlasted everyone except two people. And one of those people decided I was the bigger threat. I'll take that as a compliment.`);
    if (_ceS.boldness >= 7) _cePool.push(`If I'd won that Perch, I would've done the same thing. Cut the strongest opponent. ${c.winner} made the right call. I just wish I was on the other side of it.`);
  }
  const _eq = _cePick(_cePool);
  let reasonText;
  if (c.reason === 'strategic' && c.betrayal) {
    reasonText = `${c.winner} ran the jury math — and the numbers said to cut ${c.eliminated}. ${_pr.Sub} chose ${c.chosen} over ${_pr.pos} own ally. The bond didn't matter. The vote projection did. ${c.eliminated} trusted ${_pr.obj}. That trust just ended ${_ePr.pos} game.`;
  } else if (c.reason === 'strategic') {
    reasonText = `${c.winner} ran the jury math. ${_pr.Sub} chose ${c.chosen} — the person ${_pr.sub} ${_pr.sub==='they'?'project':'projects'} ${_pr.sub} can beat. This wasn't about friendship. It was about winning.`;
  } else {
    reasonText = `${c.winner} chose loyalty. ${c.chosen} — the person ${_pr.sub} ${_pr.sub==='they'?'trust':'trusts'} most in this game. Whatever the jury decides, they face it together.`;
  }

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num} — Finale</div>
    <div class="rp-title" style="color:#e3b341">The Choice</div>
    <div style="font-size:13px;color:#8b949e;text-align:center;margin-bottom:16px">${c.winner} must choose one opponent for Final Tribal Council. The other is eliminated.</div>
    <div style="text-align:center;margin-bottom:16px">
      ${rpPortrait(c.winner, 'xl immune')}
      <div style="font-size:14px;font-weight:800;color:#e3b341;margin-top:6px">${c.winner}</div>
      <div style="font-size:10px;color:#3fb950;font-weight:700;letter-spacing:1px">PERCH WINNER</div>
    </div>
    <div style="display:flex;justify-content:center;gap:32px;margin:20px 0;flex-wrap:wrap">
      <div style="text-align:center;padding:16px;background:rgba(63,185,80,0.06);border:2px solid rgba(63,185,80,0.3);border-radius:12px;min-width:120px">
        ${rpPortrait(c.chosen, 'xl')}
        <div style="font-size:14px;font-weight:800;color:#3fb950;margin-top:8px">FINAL TWO</div>
        <div style="font-size:12px;color:#e6edf3">${c.chosen}</div>
      </div>
      <div style="text-align:center;padding:16px;background:rgba(248,81,73,0.06);border:2px solid rgba(248,81,73,0.3);border-radius:12px;min-width:120px">
        ${rpPortrait(c.eliminated, 'xl elim')}
        <div style="font-size:14px;font-weight:800;color:#f85149;margin-top:8px">3RD PLACE</div>
        <div style="font-size:12px;color:#e6edf3">${c.eliminated}</div>
      </div>
    </div>
    <div style="font-size:13px;color:#cdd9e5;text-align:center;line-height:1.6;max-width:500px;margin:0 auto 20px;font-style:italic">${reasonText}</div>
    <div class="rp-elim" style="margin-top:16px">
      <div class="rp-elim-eyebrow">3rd Place — The Choice</div>
      ${rpPortrait(c.eliminated, 'xl elim')}
      <div class="rp-elim-name">${c.eliminated}</div>
      <div class="rp-elim-arch">${vpArchLabel(c.eliminated)}</div>
      <div class="rp-elim-quote">"${_eq}"</div>
      <div class="rp-elim-place">Eliminated — Episode ${ep.num}</div>
    </div>
  </div>`;
  return html;
}

// ── Fire-Making: Camp Life — the lobbying and weight of the decision ──
export function rpBuildFiremakingCampLife(ep) {
  if (!ep.firemakingDecision) return '';
  const d = ep.firemakingDecision;
  const winner = d.immunityWinner;
  const others = [...(d.competitors || []), d.saved].filter(Boolean);
  const _pr = pronouns(winner);
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Episode ${ep.num} — Finale</div>
    <div class="rp-title">After Immunity</div>
    <div style="font-size:13px;color:#8b949e;text-align:center;margin-bottom:20px">${winner} holds the necklace. Three people need something from ${_pr.obj} tonight.</div>`;

  // Winner's weight
  html += `<div style="margin-bottom:16px;padding:14px;background:rgba(227,179,65,0.04);border:1px solid rgba(227,179,65,0.15);border-radius:10px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      ${rpPortrait(winner, 'sm')}
      <div>
        <div style="font-size:14px;font-weight:700;color:#e3b341">${winner}</div>
        <div style="font-size:10px;color:#8b949e;font-weight:700;letter-spacing:1px">IMMUNITY HOLDER</div>
      </div>
    </div>
    <div style="font-size:12px;color:#cdd9e5;line-height:1.6;font-style:italic">${_pick([
      `${winner} sits by the fire with the necklace around ${_pr.posAdj} neck. Three people are going to walk up to ${_pr.obj} before tonight. ${_pr.Sub} already ${_pr.sub==='they'?'know':'knows'} what each of them will say. The question is what ${_pr.sub} ${_pr.sub==='they'?'say':'says'} back.`,
      `The weight of the necklace isn't physical. It's the three conversations ${winner} has to have before tribal. One person gets saved. Two people make fire. ${_pr.Sub} ${_pr.sub==='they'?'decide':'decides'} who.`,
      `${winner} hasn't spoken to anyone since winning immunity. ${_pr.Sub}'s thinking. The tribe can see it — the calculation behind the eyes. Everyone is giving ${_pr.obj} space. Nobody wants to push too hard.`,
    ])}</div>
  </div>`;

  // Each other player lobbies the winner
  others.forEach(player => {
    const bond = getBond(winner, player);
    const pS = pStats(player);
    const pPr = pronouns(player);
    const isSaved = player === d.saved;
    const lobbyText = bond >= 3 ? _pick([
      `${player} doesn't need to make a pitch. ${pPr.Sub} and ${winner} just look at each other. The understanding is already there. "You know where I stand," ${player} says quietly.`,
      `${player} finds ${winner} alone. The conversation is short — they've said everything that matters over the last 30 days. "I trust you," ${player} says. ${winner} nods.`,
    ]) : bond >= 1 ? _pick([
      `${player} pulls ${winner} aside. "I know you have a decision to make. I'm just asking you to think about what we've built out here." ${winner} listens.`,
      `${player} makes ${pPr.posAdj} case calmly. No begging. No threats. Just: "I've been loyal. That should mean something tonight."`,
    ]) : _pick([
      `${player} approaches ${winner} knowing the odds aren't great. "If you send me to fire, I'll win it. But I'd rather not have to." It's the most honest thing ${pPr.sub}'s said all game.`,
      `${player} doesn't have a strong bond with ${winner}. ${pPr.Sub} ${pPr.sub==='they'?'know':'knows'} it. The pitch is pure strategy: "Think about who you can beat at the end. It's not ${d.saved || 'them'}."`,
    ]);

    html += `<div style="margin-bottom:12px;padding:12px;background:#0d1117;border:1px solid #21262d;border-radius:8px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(player, 'sm')}
        <div style="font-size:13px;font-weight:700;color:#e6edf3">${player}</div>
        <div style="font-size:10px;color:${bond >= 2 ? '#3fb950' : bond >= 0 ? '#8b949e' : '#f85149'};margin-left:auto">Bond: ${bond >= 3 ? 'Strong' : bond >= 1 ? 'Positive' : bond >= 0 ? 'Neutral' : 'Negative'}</div>
      </div>
      <div style="font-size:12px;color:#8b949e;line-height:1.6;font-style:italic">${lobbyText}</div>
    </div>`;
  });

  html += `</div>`;
  return html;
}

// ── Fire-Making Decision Screen ──
export function rpBuildFiremakingDecision(ep) {
  if (!ep.firemakingDecision) return '';
  const d = ep.firemakingDecision;
  const _pr = pronouns(d.immunityWinner);
  const reasonText = d.savedReason === 'strategic'
    ? `${d.immunityWinner} ran the numbers. ${_pr.Sub} projected the jury votes and chose to save the person ${_pr.sub} can beat at Final Tribal. This wasn't about loyalty — it was about winning.`
    : `${d.immunityWinner} didn't hesitate. ${_pr.Sub} saved ${d.saved} — the person ${_pr.sub} ${_pr.sub==='they'?'trust':'trusts'} most in this game. Whatever happens next, they face it together.`;

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num} — Finale</div>
    <div class="rp-title" style="color:#e3b341">The Decision</div>
    <div style="text-align:center;margin:20px 0">
      ${rpPortrait(d.immunityWinner, 'xl immune')}
      <div style="font-size:16px;font-weight:800;color:#e6edf3;margin-top:8px">${d.immunityWinner}</div>
      <div style="font-size:11px;color:#3fb950;font-weight:700;letter-spacing:1px">IMMUNITY WINNER</div>
    </div>
    <div style="font-size:13px;color:#8b949e;text-align:center;line-height:1.6;max-width:500px;margin:0 auto 20px">${d.immunityWinner} must choose one person to take to Final Tribal. The other two will make fire. The loser goes home.</div>
    <div style="display:flex;justify-content:center;gap:24px;margin:20px 0;flex-wrap:wrap">
      <div style="text-align:center;padding:16px;background:rgba(63,185,80,0.06);border:2px solid rgba(63,185,80,0.3);border-radius:12px;min-width:120px">
        ${rpPortrait(d.saved, 'xl')}
        <div style="font-size:14px;font-weight:800;color:#3fb950;margin-top:8px">SAVED</div>
        <div style="font-size:12px;color:#e6edf3">${d.saved}</div>
      </div>
      ${d.competitors.map(c => `<div style="text-align:center;padding:16px;background:rgba(248,81,73,0.06);border:2px solid rgba(248,81,73,0.3);border-radius:12px;min-width:120px">
        ${rpPortrait(c, 'xl')}
        <div style="font-size:14px;font-weight:800;color:#f85149;margin-top:8px">FIRE</div>
        <div style="font-size:12px;color:#e6edf3">${c}</div>
      </div>`).join('')}
    </div>
    <div style="font-size:13px;color:#cdd9e5;text-align:center;line-height:1.6;max-width:500px;margin:0 auto;font-style:italic">${reasonText}</div>
  </div>`;
  return html;
}

// ── Fire-Making Duel Screen — staged suspense ──
export function rpBuildFiremakingDuel(ep) {
  if (!ep.firemakingResult) return '';
  const r = ep.firemakingResult;
  const wS = pStats(r.winner);
  const lS = pStats(r.loser);
  const _wPr = pronouns(r.winner);
  const _lPr = pronouns(r.loser);
  // Fire-making-specific exit quote — lost a duel, not voted out
  const _fmPick = arr => arr[([...r.loser].reduce((a,c)=>a+c.charCodeAt(0),0)+(ep.num||0)*3)%arr.length];
  const _fmPool = [];
  const _wasSaved = ep.firemakingDecision?.saved;
  const _immWinner = ep.firemakingDecision?.immunityWinner;
  if (r.winnerScore - r.loserScore < 1) {
    _fmPool.push(`That close. That close and I'm sitting on the jury. My fire was right there. A few more seconds and it's a completely different ending.`);
    _fmPool.push(`I lost by nothing. My rope was burning. ${r.winner}'s just burned faster. That's the kind of loss that haunts you.`);
  }
  if (lS.physical >= 7) _fmPool.push(`I'm supposed to win challenges. That's my thing. But fire doesn't care about your stats. ${r.winner} wanted it more. Or got luckier. I'll never know which.`);
  if (lS.strategic >= 7) _fmPool.push(`I controlled this game for weeks. Votes, alliances, every move — mine. And I'm going home because of a flint and some coconut husk. The game has a sick sense of humor.`);
  if (_immWinner && getBond(r.loser, _immWinner) >= 3) _fmPool.push(`${_immWinner} could have saved me. ${pronouns(_immWinner).Sub} had the necklace. ${pronouns(_immWinner).Sub} chose someone else. I understand the move. I just wish I didn't have to.`);
  if (_wasSaved && getBond(r.loser, _wasSaved) <= -1) _fmPool.push(`${_immWinner} saved ${_wasSaved} over me. I'm making fire while ${_wasSaved} sits there watching. That decision is going to follow ${_immWinner} into FTC. I'll make sure of it.`);
  _fmPool.push(`I didn't get outplayed. I didn't get blindsided. I lost a fire-making challenge. No strategy can save you from that. Just your hands and a flint.`);
  _fmPool.push(`The game came down to fire and I couldn't make it fast enough. ${r.winner} earned that spot. I hate it, but ${pronouns(r.winner).sub} earned it.`);
  _fmPool.push(`I survived every tribal council. Every single one. And I'm going home because of a duel I never asked for. That's this game.`);
  const _eq = _fmPick(_fmPool);
  const gap = r.winnerScore - r.loserScore;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Determine who had the early lead (adds to suspense if the leader changes)
  const _wBase = wS.physical * 0.4 + wS.endurance * 0.4 + wS.temperament * 0.2;
  const _lBase = lS.physical * 0.4 + lS.endurance * 0.4 + lS.temperament * 0.2;
  const earlyLeader = _wBase >= _lBase ? r.winner : r.loser;
  const comeback = earlyLeader !== r.winner;

  let html = `<div class="rp-page tod-deepnight" style="background:radial-gradient(ellipse at 50% 80%, rgba(232,135,58,0.08) 0%, transparent 50%)">
    <div class="rp-eyebrow">Episode ${ep.num} — Finale</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:4px;text-transform:uppercase;color:#e8873a">Fire-Making</div>
    <div style="font-size:12px;color:#8b949e;text-align:center;margin-bottom:20px">Make fire. Burn through the rope. Raise the flag. First one done stays in the game.</div>

    <div style="display:flex;justify-content:center;align-items:center;gap:24px;margin:16px 0 24px;flex-wrap:wrap">
      <div style="text-align:center">
        ${rpPortrait(r.winner, 'xl')}
        <div style="font-size:14px;font-weight:800;color:#e6edf3;margin-top:6px">${r.winner}</div>
        <div style="font-size:10px;color:#8b949e">PHY ${wS.physical} · END ${wS.endurance} · TMP ${wS.temperament}</div>
      </div>
      <div style="font-size:36px;color:#e8873a">🔥</div>
      <div style="text-align:center">
        ${rpPortrait(r.loser, 'xl')}
        <div style="font-size:14px;font-weight:800;color:#e6edf3;margin-top:6px">${r.loser}</div>
        <div style="font-size:10px;color:#8b949e">PHY ${lS.physical} · END ${lS.endurance} · TMP ${lS.temperament}</div>
      </div>
    </div>`;

  // ── STAGED NARRATIVE — 4 beats building tension ──
  // Stage 1: Setup
  html += `<div style="padding:12px 16px;background:rgba(232,135,58,0.03);border-left:3px solid rgba(232,135,58,0.3);margin-bottom:10px;border-radius:0 8px 8px 0">
    <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#e8873a;margin-bottom:4px">THE FIRE IS LIT</div>
    <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${_pick([
      `Both players kneel in front of their stations. Flint in one hand. Husks in the other. The jury leans forward. This is it.`,
      `The host gives the signal. ${r.winner} and ${r.loser} grab their flints. The sound of steel on stone cuts through the silence. The race is on.`,
      `Everything they've done for the past 30 days comes down to this. Two people. Two fires. One stays.`,
    ])}</div>
  </div>`;

  // Stage 2: Early progress
  html += `<div style="padding:12px 16px;background:rgba(232,135,58,0.03);border-left:3px solid rgba(232,135,58,0.4);margin-bottom:10px;border-radius:0 8px 8px 0">
    <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#e8873a;margin-bottom:4px">SPARKS</div>
    <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${earlyLeader === r.winner ? _pick([
      `${r.winner} gets sparks first. A small flame catches the coconut husk and holds. ${r.loser} is still striking — the frustration is starting to show.`,
      `${r.winner} finds a rhythm early. Spark. Smoke. Flame. ${r.loser} watches from the corner of ${_lPr.posAdj} eye and adjusts.`,
    ]) : _pick([
      `${r.loser} gets a flame going first. The jury shifts. ${r.winner} is behind — but not panicking. Not yet.`,
      `${r.loser} has fire. ${r.winner} doesn't. The gap is real. But fire-making isn't about who starts first — it's about who finishes.`,
    ])}</div>
  </div>`;

  // Stage 3: The tension
  html += `<div style="padding:12px 16px;background:rgba(232,135,58,0.03);border-left:3px solid rgba(232,135,58,0.5);margin-bottom:10px;border-radius:0 8px 8px 0">
    <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#e8873a;margin-bottom:4px">${comeback ? 'THE COMEBACK' : gap < 1 ? 'NECK AND NECK' : 'PULLING AWAY'}</div>
    <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${comeback ? _pick([
      `${r.winner}'s fire gutters. Then catches again. Then GROWS. In thirty seconds, ${_wPr.sub} ${_wPr.sub==='they'?'go':'goes'} from behind to level. The jury gasps.`,
      `${r.loser}'s flame was bigger. WAS. ${r.winner} rebuilt from nothing and now both fires are climbing. The lead is gone.`,
    ]) : gap < 1 ? _pick([
      `Both fires are climbing. Both ropes are smoking. Nobody in the jury can tell who's ahead. The host is leaning in.`,
      `It's dead even. Both flames licking the rope. Both players feeding fuel with shaking hands. This is coming down to seconds.`,
    ]) : _pick([
      `${r.winner}'s fire is roaring. The rope above it is starting to blacken. ${r.loser} is working — but the gap is widening with every second.`,
      `${r.winner} found the angle. The flame is climbing straight up the rope now. ${r.loser} can see it. Everyone can see it.`,
    ])}</div>
  </div>`;

  // Stage 4: The finish
  html += `<div style="padding:12px 16px;background:rgba(232,135,58,0.06);border-left:3px solid #e8873a;margin-bottom:16px;border-radius:0 8px 8px 0">
    <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#e8873a;margin-bottom:4px">THE FLAG DROPS</div>
    <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${gap >= 3 ? _pick([
      `${r.winner}'s rope snaps. The flag drops. It's over. ${r.loser} puts ${_lPr.posAdj} hands on ${_lPr.posAdj} knees and looks at the ground. The jury erupts.`,
      `The rope burns through and ${r.winner}'s flag drops with a finality that silences the entire tribal. ${r.loser} stops. Stares at the fire. Then nods.`,
    ]) : gap >= 1 ? _pick([
      `${r.winner}'s rope gives way first. The flag drops. ${r.loser}'s rope was seconds from breaking — but seconds are everything. The jury is on their feet.`,
      `Both ropes are burning. ${r.winner}'s gives first. The flag falls. ${r.loser} watches it happen from three feet away, knowing ${_lPr.posAdj} rope was almost there.`,
    ]) : _pick([
      `Both flags are hanging by a thread. Then ${r.winner}'s drops. A FRACTION of a second before ${r.loser}'s. The closest fire-making in the history of this game. The jury can't believe what they just saw.`,
      `It happens almost simultaneously. Both ropes snap. Both flags drop. But ${r.winner}'s hit the ground first. By a margin you couldn't see with the naked eye. ${r.loser} collapses. ${r.winner} collapses. The jury collapses.`,
    ])}</div>
  </div>`;

  // Result
  html += `<div style="display:flex;justify-content:center;gap:32px;margin:20px 0;flex-wrap:wrap">
    <div style="text-align:center">
      ${rpPortrait(r.winner, 'xl')}
      <div style="font-size:18px;font-weight:900;color:#3fb950;margin-top:8px">STAYS</div>
      <div style="font-size:12px;color:#e6edf3">${r.winner}</div>
    </div>
    <div style="text-align:center">
      ${rpPortrait(r.loser, 'xl elim')}
      <div style="font-size:18px;font-weight:900;color:#f85149;margin-top:8px">ELIMINATED</div>
      <div style="font-size:12px;color:#e6edf3">${r.loser}</div>
    </div>
  </div>`;

  // Elimination card
  html += `<div class="rp-elim" style="margin-top:16px">
    <div class="rp-elim-eyebrow">4th Place — Fire-Making</div>
    ${rpPortrait(r.loser, 'xl elim')}
    <div class="rp-elim-name">${r.loser}</div>
    <div class="rp-elim-arch">${vpArchLabel(r.loser)}</div>
    <div class="rp-elim-quote">"${_eq}"</div>
    <div class="rp-elim-place">Eliminated by Fire — Episode ${ep.num}</div>
  </div>
  </div>`;
  return html;
}

export function rpBuildFinalCut(ep) {
  if (!ep.finalCut) return '';
  const fc = ep.finalCut;
  const { winner, cut, byJury, juryCutVotes } = fc;
  // brought can be a string (F2) or array (F4 — multiple players advance)
  const broughtArr = Array.isArray(fc.brought) ? fc.brought : [fc.brought];
  const broughtLabel = broughtArr.join(' and ');

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num} \u2014 Finale</div>
    <div style="font-family:var(--font-display);font-size:26px;text-align:center;margin-bottom:20px;text-transform:uppercase;letter-spacing:2px">${byJury ? 'Jury Decides' : 'The Decision'}</div>`;

  if (byJury) {
    html += _renderTwistScene({ text: `${winner} is safe \u2014 their immunity win locks them into the finale. But the jury now holds the power. They must choose which of the remaining players earns a seat at the Final Tribal Council.`, players: [winner] });
    html += _renderTwistScene({ text: `${broughtLabel} and ${cut} stand before the jury. One advances. One goes home.`, players: [...broughtArr, cut].filter(Boolean), faceOff: broughtArr.length === 1 });
    if (juryCutVotes) {
      const sorted = Object.entries(juryCutVotes).sort(([,a],[,b]) => b-a);
      html += _renderTwistScene({ text: `Jury vote: ${sorted.map(([n,v]) => `${n} \u2014 ${v}`).join(' / ')}`, players: sorted.map(([n]) => n) });
    }
    html += _renderTwistScene({ text: `${broughtLabel} advance${broughtArr.length === 1 ? 's' : ''} to the Final Tribal Council.`, players: broughtArr, badge: 'Advances', badgeClass: 'win' });
    html += _renderTwistScene({ text: `${cut} has been eliminated by the jury.`, players: [cut], badge: 'Eliminated', badgeClass: 'bad' });
  } else {
    html += _renderTwistScene({ text: `${winner} wins final immunity and holds all the power. ${winner} must now decide who sits beside them at the Final Tribal Council \u2014 and who goes home tonight.`, players: [winner] });
    html += _renderTwistScene({ text: `${broughtLabel} and ${cut} wait. ${broughtArr.length > 1 ? 'The immunity winner must choose who to cut.' : 'One gets a chance to plead their case to the jury. The other goes home.'}`, players: [...broughtArr, cut].filter(Boolean) });

    const bond = broughtArr.length === 1 ? getBond(winner, broughtArr[0]) : 0;
    const bondCut = getBond(winner, cut);
    const cutS = pStats(cut);
    let reasonText;
    if (bondCut <= -1) reasonText = `${winner} and ${cut} were never aligned. This was never really in question. ${cut} goes home.`;
    else if (cutS.social >= 7) reasonText = `${cut} had too many friends on that jury. ${winner} could not afford to take them to the end. The decision was painful \u2014 but calculated.`;
    else if (bond >= 3) reasonText = `${winner} chooses loyalty. ${broughtLabel} has been their closest ally all game. They honor that.`;
    else reasonText = `${winner} runs the numbers. ${broughtLabel} give${broughtArr.length === 1 ? 's' : ''} them the best shot at the win. ${cut} doesn\u2019t make it to the finale.`;

    html += _renderTwistScene({ text: reasonText, players: [winner] });
    html += _renderTwistScene({ text: `${broughtLabel} advance${broughtArr.length === 1 ? 's' : ''} to the Final Tribal Council.`, players: broughtArr, badge: 'Advances', badgeClass: 'win' });

    const cutPlace = (ep.finaleFinalists?.length || broughtArr.length + 1) + 1;
    // Cut-specific exit quote — eliminated by immunity winner's choice, not voted out
    const _cutS = pStats(cut);
    const _cutPr = pronouns(cut);
    const _cutPick = arr => arr[([...cut].reduce((a,c)=>a+c.charCodeAt(0),0)+(ep.num||0)*5)%arr.length];
    const _cutPool = [];
    const _cutBondW = getBond(cut, winner);
    if (_cutBondW >= 3) {
      _cutPool.push(`${winner} and I were allies. Real allies. And ${pronouns(winner).sub} looked me in the eyes and sent me home. That's the kind of move that wins the game — or loses the jury.`);
      _cutPool.push(`I trusted ${winner}. We went through everything together. And at the very end, ${pronouns(winner).sub} chose someone else. That's going to sit with me for a long time.`);
    } else if (_cutBondW <= -1) {
      _cutPool.push(`${winner} was never going to pick me. We both knew it. I just needed to win that last challenge and I didn't. That's on me.`);
    }
    if (_cutS.strategic >= 7) _cutPool.push(`I can see the math. ${winner} picked the person ${pronouns(winner).sub} can beat. I was the bigger jury threat. Smart move. Cold, but smart.`);
    if (_cutS.social >= 7) _cutPool.push(`I had too many friends on that jury. ${winner} knew that. If I'm sitting at FTC, I probably win. That's why I'm not.`);
    _cutPool.push(`One person had the power to end my game, and ${pronouns(winner).sub} used it. No vote. No tribal. Just a decision. That's the hardest way to go out.`);
    _cutPool.push(`I made it to the final ${cutPlace > 3 ? cutPlace : 'three'}. I outlasted almost everyone. And one person's choice is the reason I'm not sitting at FTC right now.`);
    _cutPool.push(`${ordinal(cutPlace)} place. So close. I can see the finish line from here — I'm just not allowed to cross it.`);
    const _elimQ = _cutPick(_cutPool);
    html += `<hr class="rp-twist-divider"><div class="rp-elim">
      <div class="rp-elim-eyebrow">${ordinal(cutPlace)} place</div>
      ${rpPortrait(cut, 'xl elim')}
      <div class="rp-elim-name">${cut}</div>
      <div class="rp-elim-arch">${vpArchLabel(cut)}</div>
      <div class="rp-elim-quote">"${_elimQ}"</div>
      <div class="rp-elim-place">Finale \u2014 Episode ${ep.num}</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

// ── The Benches: eliminated players choose which finalist to support ──
export function rpBuildBenches(ep) {
  const benchAssignments = ep.benchAssignments;
  const benchReasons = ep.benchReasons;
  if (!benchAssignments) return null;
  const finalists = Object.keys(benchAssignments);
  if (!finalists.length) return null;
  const allSupporters = finalists.flatMap(f => (benchAssignments[f] || []).map(s => ({ supporter: s, finalist: f })));
  if (!allSupporters.length) return null;
  const epNum = ep.num;
  const stateKey = epNum + '_bench';
  const assistants = ep.assistants || null;

  let html = `<div class="rp-page tod-dusk">
    <div class="rp-eyebrow">Episode ${epNum} \u2014 Finale</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:6px;text-transform:uppercase">The Benches</div>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:20px;letter-spacing:1.5px">The eliminated players choose their side.</div>`;

  // Finalist headers with bench count
  html += `<div style="display:flex;justify-content:center;gap:32px;margin-bottom:20px">
    ${finalists.map(f => {
      const count = (benchAssignments[f] || []).length;
      return `<div style="text-align:center">
        ${rpPortrait(f, 'lg')}
        <div style="font-size:12px;font-family:var(--font-display);margin-top:6px">${f}</div>
        <div class="tv-tally-count" id="tv-tc-${stateKey}-${f.replace(/[^a-zA-Z0-9]/g,'')}" style="font-size:20px;font-family:var(--font-display);color:var(--accent-gold);margin-top:4px">0</div>
        <div style="font-size:9px;color:var(--muted)">supporters</div>
      </div>`;
    }).join(`<div style="align-self:center;font-size:18px;color:#30363d;font-weight:700">vs</div>`)}
  </div>`;

  // Card-by-card reveal — each supporter walks to a bench
  html += `<div class="tv-wrap"><div class="tv-reveal-panel" id="tv-cards-${stateKey}">`;

  // Shuffle order for drama (deterministic seed)
  const shuffled = [...allSupporters].sort((a, b) => {
    const seedA = [...a.supporter].reduce((s, c) => s + c.charCodeAt(0), 0);
    const seedB = [...b.supporter].reduce((s, c) => s + c.charCodeAt(0), 0);
    return ((seedA * 17 + epNum) % 97) - ((seedB * 17 + epNum) % 97);
  });

  shuffled.forEach(({ supporter, finalist }, idx) => {
    const reason = benchReasons?.[supporter]?.reason || '';
    const bond = benchReasons?.[supporter]?.bond ?? 0;
    // Check if this is a surprise (supporter had higher bond with a different finalist)
    const otherFinalists = finalists.filter(f => f !== finalist);
    const isSurprise = otherFinalists.some(of => getBond(supporter, of) > bond + 0.5);

    html += `<div class="tv-vote-card" data-voted="${finalist}" data-voter="${supporter}" data-index="${idx}"${isSurprise ? ' style="border-color:rgba(227,179,65,0.4);background:rgba(227,179,65,0.03)"' : ''}>
      <div class="tv-vote-voter-wrap">
        ${rpPortrait(supporter, 'sm')}
        <div class="tv-vote-voter">${supporter}</div>
      </div>
      <div class="tv-vote-arrow" style="color:var(--accent-gold)">\u2192</div>
      <div class="tv-vote-right">
        <div class="tv-vote-target">${finalist}'s Bench</div>
        <div class="tv-vote-reason">${reason}</div>
        ${isSurprise ? '<div style="font-size:9px;color:#e3b341;margin-top:3px;font-weight:700;letter-spacing:0.5px">SURPRISE PICK</div>' : ''}
      </div>
    </div>`;
  });

  html += `</div>`; // end tv-reveal-panel

  // Live tally panel
  html += `<div class="tv-tally-panel" id="tv-tally-${stateKey}">
    <div class="tv-tally-header">Bench Count</div>`;
  finalists.forEach(f => {
    const slug = f.replace(/[^a-zA-Z0-9]/g, '');
    html += `<div class="tv-tally-row" data-name="${f}" style="opacity:0;transition:opacity 0.4s">
      ${rpPortrait(f)}
      <div class="tv-tally-pname">${f}</div>
      <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${stateKey}-${slug}" style="width:0%"></div></div>
      <div class="tv-tally-count" id="tv-tc-${stateKey}-${slug}" data-count="0">\u2014</div>
    </div>`;
  });
  html += `</div></div>`; // end tally + tv-wrap

  // Reveal buttons
  html += `<div id="tv-btn-wrap-${stateKey}">
    <button class="tv-reveal-btn" id="tv-btn-${stateKey}" onclick="tvRevealNext('${stateKey}')">Next (0/${shuffled.length})</button>
    <div style="text-align:right;margin:-12px 0 14px">
      <button onclick="tvRevealAll('${stateKey}')" style="background:none;border:none;font-size:11px;color:#484f58;cursor:pointer;padding:2px 0;letter-spacing:0.3px">Skip to results \u203a</button>
    </div>
  </div>`;

  // Results section (shown after all reveals)
  html += `<div id="tv-results-${stateKey}" style="display:none">`;

  // Final bench summary
  finalists.forEach(f => {
    const supporters = benchAssignments[f] || [];
    html += `<div style="margin-bottom:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(f, 'sm')}
        <div style="font-family:var(--font-display);font-size:14px">${f}'s Bench</div>
        <span style="font-size:11px;color:var(--accent-gold);font-weight:700">${supporters.length} supporter${supporters.length !== 1 ? 's' : ''}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${supporters.map(s => `<div style="text-align:center">${rpPortrait(s)}<div style="font-size:9px;color:var(--muted)">${s}</div></div>`).join('')}
      </div>
      ${!supporters.length ? '<div style="font-size:12px;color:var(--accent-fire);font-style:italic">Empty bench. Nobody came.</div>' : ''}
    </div>`;
  });

  // Assistant selection (if applicable)
  if (assistants) {
    html += `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:16px 0">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:12px">Assistant Selection</div>`;
    finalists.forEach(f => {
      const asst = assistants[f];
      if (!asst) {
        html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:10px;background:rgba(248,81,73,0.04);border:1px solid rgba(248,81,73,0.15);border-radius:6px">
          ${rpPortrait(f, 'sm')}
          <div><div style="font-size:13px">${f}</div><div style="font-size:11px;color:var(--accent-fire)">Goes solo \u2014 nobody on their bench</div></div>
        </div>`;
        return;
      }
      const decisionText = asst.decision === 'unanimous' ? 'Easy choice \u2014 the only option that made sense.'
        : asst.decision === 'heart' ? `Followed the heart. "${asst.name} is someone I trust. That matters more than stats."`
        : asst.decision === 'brain' ? `Cold calculation. "${asst.name} gives me the best shot at winning. Simple as that."`
        : asst.decision === 'impulsive' ? `Didn't think. Just said a name. "${asst.name}. Let's go."`
        : `Agonized. "${asst.heartPick === asst.brainPick ? asst.name : `My gut says ${asst.heartPick}. My head says ${asst.brainPick}.`} I went with ${asst.name}."`;
      html += `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;padding:10px;background:rgba(227,179,65,0.04);border:1px solid rgba(227,179,65,0.15);border-radius:6px">
        ${rpPortrait(f, 'sm')}
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${f} picks ${asst.name}</div>
          <div style="font-size:11px;color:#8b949e;margin-top:2px">${decisionText}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px">Bond: ${asst.bond >= 2 ? 'Strong' : asst.bond >= 0 ? 'Neutral' : 'Risky'} \u00b7 ${asst.decision !== 'unanimous' && asst.heartPick !== asst.brainPick ? `Heart: ${asst.heartPick} \u00b7 Brain: ${asst.brainPick}` : 'Clear pick'}</div>
        </div>
        ${rpPortrait(asst.name, 'sm')}
      </div>`;
    });
  }

  html += `</div>`; // end results
  html += `</div>`; // end page
  return html;
}

// ── The Grand Challenge: 3-stage finale challenge with narration ──
export function rpBuildFinaleGrandChallenge(ep) {
  const stages = ep.finaleChallengeStages;
  const scores = ep.finaleChallengeScores;
  const winner = ep.finaleChallengeWinner;
  const finalists = ep.finaleFinalists || [];
  const assistants = ep.assistants || {};
  const benchAssignments = ep.benchAssignments || {};
  const sabotageEvents = ep.finaleSabotageEvents || [];
  if (!stages?.length || !winner) return null;
  const epNum = ep.num;
  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*7)%arr.length];

  let html = `<div class="rp-page tod-arena">
    <div class="rp-eyebrow">Episode ${epNum} \u2014 Finale</div>
    <div style="font-family:var(--font-display);font-size:30px;letter-spacing:3px;text-align:center;margin-bottom:6px;text-transform:uppercase;color:var(--accent-gold);text-shadow:0 0 30px rgba(227,179,65,0.3)">The Final Challenge</div>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:6px;letter-spacing:1.5px;text-transform:uppercase">Three stages. One winner. No jury. No vote.</div>
    <div style="text-align:center;font-size:12px;color:#484f58;font-style:italic;margin-bottom:24px">The last challenge of the season will decide everything.</div>`;

  // Finalist + assistant lineup
  html += `<div style="display:flex;justify-content:center;gap:28px;margin-bottom:24px;flex-wrap:wrap">`;
  finalists.forEach(f => {
    const asst = assistants[f];
    const benchCount = (benchAssignments[f] || []).length;
    html += `<div style="text-align:center;min-width:120px">
      ${rpPortrait(f, 'lg')}
      <div style="font-family:var(--font-display);font-size:13px;margin-top:6px">${f}</div>
      <div style="font-size:10px;color:var(--muted)">${vpArchLabel(f)}</div>
      <div style="font-size:10px;color:var(--muted)">${benchCount} supporter${benchCount !== 1 ? 's' : ''}</div>
      ${asst?.name ? `<div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-top:6px">
        ${rpPortrait(asst.name)}
        <div style="font-size:9px;color:var(--accent-gold)">Assistant</div>
      </div>` : `<div style="font-size:9px;color:#484f58;margin-top:6px">Solo</div>`}
    </div>`;
  });
  html += `</div>`;

  // ═══ STAGE BY STAGE — hidden behind reveal buttons ═══
  const _gcKey = epNum + '_gc';
  const _hasRealAssistants = assistants && finalists.some(f => assistants[f]?.name);
  const _runningTotals = Object.fromEntries(finalists.map(f => [f, 0]));

  stages.forEach((stage, idx) => {
    const isLast = idx === stages.length - 1;
    const stageScores = stage.scores || {};
    const stageSorted = Object.entries(stageScores).sort(([,a],[,b]) => b - a);
    const stageWinner = stage.winner;
    const stageSabotage = sabotageEvents.filter(s => s.stage === idx);

    // Stage section — hidden until revealed
    html += `<div class="gc-stage" id="gc-stage-${_gcKey}-${idx}" style="display:none;margin-top:20px;padding-top:16px;border-top:1px solid rgba(227,179,65,0.15)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="font-family:var(--font-display);font-size:22px;color:var(--accent-gold)">${idx + 1}</span>
        <div>
          <div style="font-family:var(--font-display);font-size:16px;letter-spacing:1px;text-transform:uppercase">${stage.name}</div>
          <div style="font-size:11px;color:var(--muted)">${stage.desc}</div>
        </div>
      </div>`;

    // Pre-stage narration
    const preNarration = [];
    if (idx === 0) {
      preNarration.push(`The finalists line up. The challenge begins.${_hasRealAssistants ? ' Assistants take their positions alongside their partners.' : ''}`);
      // Bench confessional
      const loudestSupporter = finalists.reduce((best, f) => {
        const bench = benchAssignments[f] || [];
        const loudest = bench.find(s => pStats(s).boldness >= 7 || pStats(s).temperament <= 4);
        return loudest && (!best || pStats(loudest).boldness > pStats(best.supporter).boldness)
          ? { supporter: loudest, finalist: f } : best;
      }, null);
      if (loudestSupporter) {
        const sp = loudestSupporter.supporter;
        preNarration.push(`From the bench, ${sp} is already on their feet. "Come on, ${loudestSupporter.finalist}! This is yours!"`);
      }
    } else if (idx === 1) {
      preNarration.push(`Stage two. The pace changes.${_hasRealAssistants ? ' Assistants are still in it \u2014 but not for long.' : ' Pure individual effort now.'}`);
    } else {
      preNarration.push(`The final stage. No help. No safety net. This is where it ends.`);
    }

    preNarration.forEach(text => {
      html += `<div style="font-size:13px;color:#8b949e;line-height:1.6;margin-bottom:8px;font-style:italic">${text}</div>`;
    });

    // Assistant contribution — only render if real assistants exist
    if (stage.hasAssistant && _hasRealAssistants) {
      finalists.forEach(f => {
        const asst = assistants[f];
        if (!asst?.name) return;
        const isSabotage = stageSabotage.some(s => s.finalist === f);
        if (isSabotage) {
          html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:8px;background:rgba(248,81,73,0.06);border:1px solid rgba(248,81,73,0.15);border-radius:6px">
            ${rpPortrait(asst.name, 'sm')}
            <div>
              <div style="font-size:11px;color:var(--accent-fire);font-weight:700">SABOTAGE</div>
              <div style="font-size:12px;color:#c9d1d9">${asst.name} fumbles. The rope slips. The timing is off. Was it intentional? ${f} doesn't have time to wonder.</div>
            </div>
          </div>`;
        } else {
          const aS = pStats(asst.name);
          const contribution = stage.name === 'Endurance' ? aS.endurance : aS.physical;
          const quality = contribution >= 7 ? 'strong' : contribution >= 5 ? 'solid' : 'struggling';
          const contText = quality === 'strong'
            ? `${asst.name} is locked in. Every move synchronized. ${f} has a real advantage here.`
            : quality === 'solid'
            ? `${asst.name} keeps pace. Not flashy, but reliable. ${f} can focus on the challenge.`
            : `${asst.name} is trying, but the gap in ability shows. ${f} is practically carrying both of them.`;
          html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:8px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:6px">
            ${rpPortrait(asst.name, 'sm')}
            <div style="font-size:12px;color:#8b949e">${contText}</div>
          </div>`;
        }
      });
    }

    // Stage results — bars only, no exact scores (keep suspense)
    html += `<div style="margin-top:10px">`;
    stageSorted.forEach(([name], rank) => {
      const isWin = name === stageWinner;
      const score = stageScores[name] || 0;
      const barPct = Math.round((score / Math.max(...Object.values(stageScores), 1)) * 100);
      html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;${isWin ? 'background:rgba(227,179,65,0.05);border-radius:6px;padding:6px' : 'padding:6px'}">
        ${rpPortrait(name)}
        <div style="flex:1">
          <div style="font-size:12px;${isWin ? 'color:var(--accent-gold);font-weight:600' : 'color:#c9d1d9'}">${name}${isWin ? ' \u2014 Stage Winner' : ''}</div>
          <div style="height:6px;background:var(--surface2);border-radius:3px;margin-top:4px;overflow:hidden">
            <div style="height:100%;width:${barPct}%;background:${isWin ? 'var(--accent-gold)' : '#484f58'};border-radius:3px"></div>
          </div>
        </div>
      </div>`;
    });
    html += `</div>`;

    // Assistant dropoff — after stage 2 results, before suspense narration
    if (stage.assistantDropoff && _hasRealAssistants) {
      html += `<div style="text-align:center;font-size:12px;color:var(--accent-gold);font-weight:700;letter-spacing:1px;margin:12px 0;padding:8px;border:1px dashed rgba(227,179,65,0.3);border-radius:6px">
        ASSISTANTS STEP BACK \u2014 "From here, you're on your own."
      </div>`;
    }

    // Update running totals
    finalists.forEach(f => { _runningTotals[f] += stageScores[f] || 0; });
    const _totalSorted = Object.entries(_runningTotals).sort(([,a],[,b]) => b - a);
    const _leader = _totalSorted[0][0];
    const _trailer = _totalSorted[_totalSorted.length - 1][0];
    const _gap = _totalSorted[0][1] - _totalSorted[_totalSorted.length - 1][1];
    const _isClose = _gap < 3;

    // Suspense narration + bench confessionals
    if (!isLast) {
      let suspenseText;
      if (_isClose)
        suspenseText = `They're neck and neck. ${_leader} leads by a fraction \u2014 but ${_trailer} is right there. One mistake from either side changes everything.`;
      else if (_gap < 6)
        suspenseText = `${_leader} has an edge after ${idx + 1} stage${idx > 0 ? 's' : ''}. ${_trailer} is behind \u2014 but not out. Stage ${idx + 2} could flip it.`;
      else
        suspenseText = `${_leader} is pulling away. ${_trailer} needs a miracle in the next stage. The bench goes quiet.`;

      html += `<div style="text-align:center;font-size:13px;color:#484f58;font-style:italic;margin-top:12px;padding:10px;border:1px solid rgba(255,255,255,0.04);border-radius:6px;background:rgba(255,255,255,0.01)">
        ${suspenseText}
      </div>`;

      // Bench confessionals — up to 2 per side, varied dialogue
      const leadBenchAll = (benchAssignments[_leader] || []).filter(s => pStats(s).social >= 5 || pStats(s).boldness >= 6).slice(0, 2);
      const trailBenchAll = (benchAssignments[_trailer] || []).filter(s => pStats(s).boldness >= 5 || pStats(s).temperament <= 5 || pStats(s).loyalty >= 7).slice(0, 2);

      const _leadLines = [
        `"${_leader} is in the zone. I've watched ${_leader} play for weeks \u2014 this is ${_leader} at ${_leader}'s best."`,
        `"Look at ${_leader}'s face. That's not stress. That's focus. ${_leader} knows ${_leader}'s winning this."`,
        `"I knew it. I told everyone \u2014 ${_leader} was going to show up when it mattered. This is why I'm on this bench."`,
        `"Come on, come on, come on\u2026 ${_leader}, you've got this. Don't slow down."`,
        `"Every person on this bench chose ${_leader} for a reason. This is that reason. Right here."`,
        `"${_leader}'s doing what ${_leader} always does \u2014 finding a way. I'm not surprised."`,
      ];
      const _trailLines = [
        `"${_trailer} can come back. I've seen ${_trailer} do it before. This game isn't over until it's over."`,
        `"Nobody counts ${_trailer} out. Nobody. ${_trailer} fights harder from behind than anyone I've ever seen."`,
        `"${_trailer}, dig deep! You didn't come this far to lose in the last stage!"`,
        `"I'm not giving up on ${_trailer}. Not yet. The final puzzle changes everything."`,
        `"This is where ${_trailer} is at ${_trailer}'s best \u2014 when everybody thinks it's done. Watch."`,
        `"The gap isn't that big. One good run and ${_trailer}'s right back in it. I believe that."`,
      ];

      leadBenchAll.forEach((supporter, i) => {
        const line = _leadLines[([...supporter+_leader].reduce((a,c)=>a+c.charCodeAt(0),0) + idx*3 + i) % _leadLines.length];
        html += `<div style="font-size:12px;color:#484f58;font-style:italic;margin-top:${i===0?'6':'4'}px;padding:6px 10px;border-left:2px solid rgba(63,185,80,0.2)">
          ${rpPortrait(supporter)} <span style="margin-left:6px">${line}</span>
        </div>`;
      });
      trailBenchAll.filter(s => !leadBenchAll.includes(s)).forEach((supporter, i) => {
        const line = _trailLines[([...supporter+_trailer].reduce((a,c)=>a+c.charCodeAt(0),0) + idx*3 + i) % _trailLines.length];
        html += `<div style="font-size:12px;color:#484f58;font-style:italic;margin-top:4px;padding:6px 10px;border-left:2px solid rgba(248,81,73,0.2)">
          ${rpPortrait(supporter)} <span style="margin-left:6px">${line}</span>
        </div>`;
      });
    } else {
      // Final stage — cliffhanger, don't reveal who won
      let finalText;
      if (_isClose)
        finalText = `It's over. And it was close \u2014 impossibly close. Both finalists collapse. The benches erupt. But only one name will be called.`;
      else
        finalText = `It's done. The challenge is over. One of them knows it. The other suspects it. The benches hold their breath.`;
      html += `<div style="text-align:center;font-size:14px;color:var(--accent-gold);font-style:italic;margin-top:16px;padding:14px;border:1px solid rgba(227,179,65,0.2);border-radius:8px;background:rgba(227,179,65,0.04);line-height:1.6">
        ${finalText}
      </div>`;
    }

    html += `</div>`; // end stage block
  });

  // Reveal buttons
  html += `<div style="display:flex;gap:8px;justify-content:center;margin-top:20px">
    <button class="tv-reveal-btn" id="gc-btn-${_gcKey}" onclick="gcRevealNext('${_gcKey}', ${stages.length})">Reveal Stage 1</button>
    <button onclick="gcRevealAll('${_gcKey}', ${stages.length})" style="background:none;border:1px solid var(--border);border-radius:6px;padding:6px 14px;font-size:11px;color:var(--muted);cursor:pointer">Show all stages</button>
  </div>`;

  html += `</div>`;
  return html;
}

export function rpBuildFTC(ep) {
  const ftcData = ep.ftcData || {};
  const finalists = ep.finaleFinalists || gs.activePlayers;
  const jury = gs.jury || [];
  if (!finalists.length || !jury.length) return '';
  const { finalistStatements = {}, jurorQA = [] } = ftcData;
  const juryResult = ep.juryResult || {};
  const reasoning = juryResult.reasoning || [];
  const ftcSwings = ep.ftcSwings || [];
  const epNum = ep.num;
  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*7)%arr.length];

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${epNum} \u2014 Finale</div>
    <div style="font-family:var(--font-display);font-size:30px;letter-spacing:3px;text-align:center;margin-bottom:6px;text-transform:uppercase;color:var(--accent-gold);text-shadow:0 0 30px rgba(227,179,65,0.2)">Final Tribal Council</div>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:24px;letter-spacing:1.5px">The jury of ${jury.length} will decide the winner</div>`;

  // ═══ PHASE 1: THE WALK IN ═══
  html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">Phase 1 \u2014 The Walk In</div>`;

  // Atmospheric text
  html += `<div style="font-size:13px;color:#484f58;font-style:italic;text-align:center;margin-bottom:16px;line-height:1.6">
    The torches are lit. The jury files in. ${jury.length} faces \u2014 some bitter, some curious, all carrying the weight of the game they lost. The finalists take their seats. Tonight, the power belongs to the people who were voted out.
  </div>`;

  // Finalist cards with game records
  html += `<div style="display:flex;justify-content:center;gap:20px;margin-bottom:20px;flex-wrap:wrap">`;
  finalists.forEach(f => {
    const s = pStats(f);
    const wins = gs.episodeHistory.filter(e => e.immunityWinner === f).length;
    const idolsPlayed = gs.episodeHistory.reduce((sum, e) => sum + (e.idolPlays || []).filter(p => p.player === f).length, 0);
    const votesAgainst = gs.episodeHistory.reduce((sum, e) => sum + ((e.votingLog || []).filter(v => v.voted === f && v.voter !== 'THE GAME').length), 0);
    const topAlly = [...new Set(gs.episodeHistory.flatMap(e => (e.alliances || []).filter(a => a.members?.includes(f)).flatMap(a => a.members.filter(m => m !== f))))].slice(0, 1)[0];

    html += `<div style="text-align:center;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;min-width:140px">
      ${rpPortrait(f, 'lg')}
      <div style="font-family:var(--font-display);font-size:14px;margin-top:8px">${f}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:2px">${vpArchLabel(f)}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:6px;line-height:1.5">
        ${wins} immunity win${wins !== 1 ? 's' : ''}<br>
        ${idolsPlayed ? `${idolsPlayed} idol${idolsPlayed !== 1 ? 's' : ''} played \u00b7 ` : ''}${votesAgainst} vote${votesAgainst !== 1 ? 's' : ''} against<br>
        ${topAlly ? `Key ally: ${topAlly}` : 'No dominant alliance'}
      </div>
    </div>`;
  });
  html += `</div>`;

  // Jury reaction row
  html += `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin-bottom:20px">
    ${jury.map(j => {
      const bestBond = Math.max(...finalists.map(f => getBond(j, f)));
      const worstBond = Math.min(...finalists.map(f => getBond(j, f)));
      const mood = bestBond >= 3 ? 'color:#3fb950' : worstBond <= -2 ? 'color:var(--accent-fire)' : 'color:var(--muted)';
      return `<div style="text-align:center">${rpPortrait(j)}<div style="font-size:8px;${mood}">${bestBond >= 3 ? '\u2764' : worstBond <= -2 ? '\ud83d\udd25' : '\u2014'}</div></div>`;
    }).join('')}
  </div>`;

  // ═══ PHASE 2: OPENING STATEMENTS ═══
  html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin:20px 0 12px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">Phase 2 \u2014 Opening Statements</div>`;

  finalists.forEach(f => {
    const lines = finalistStatements[f] || ['"I played my game and I\'m standing here. Judge that."'];
    html += `<div style="margin-bottom:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(f, 'sm')}
        <div style="font-family:var(--font-display);font-size:13px">${f}</div>
      </div>
      ${lines.map(l => `<div style="font-size:13px;color:#c9d1d9;line-height:1.7;font-style:italic;margin-bottom:4px">${l}</div>`).join('')}
    </div>`;
  });

  // ═══ PHASE 3: JURY Q&A ═══
  html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin:20px 0 12px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">Phase 3 \u2014 Jury Questions</div>`;

  if (jurorQA.length) {
    jurorQA.forEach(qa => {
      const jS = pStats(qa.juror);
      const bond = getBond(qa.juror, qa.targetForQuestion);
      const jHistory = gs.jurorHistory?.[qa.juror];
      const votedThemOut = jHistory?.voters?.includes(qa.targetForQuestion);
      const fS = pStats(qa.targetForQuestion);

      // Classify the question type for styling
      const isBitter = bond <= -2 || (votedThemOut && bond < 1);
      const isStrategic = jS.strategic >= 7 && !isBitter;
      const isEmotional = jS.social >= 7 && jS.temperament <= 4 && !isBitter && !isStrategic;
      const isRespectful = bond >= 2 && !isBitter;

      const qType = isBitter ? 'TRAP' : isStrategic ? 'STRATEGIC' : isEmotional ? 'EMOTIONAL' : isRespectful ? 'RESPECT' : 'QUESTION';
      const qColor = isBitter ? 'var(--accent-fire)' : isStrategic ? '#6366f1' : isEmotional ? '#e3b341' : '#3fb950';
      const borderColor = isBitter ? 'rgba(248,81,73,0.25)' : isStrategic ? 'rgba(99,102,241,0.25)' : isEmotional ? 'rgba(227,179,65,0.25)' : 'rgba(63,185,80,0.15)';

      // Determine answer quality for reaction
      const answerQuality = fS.social * 0.5 + fS.strategic * 0.3 + fS.boldness * 0.2;
      const difficulty = jS.strategic * 0.4 + Math.max(0, -bond) * 0.6;
      const isGoodAnswer = answerQuality > difficulty;

      // Jury reaction
      const reactions = isGoodAnswer
        ? _pick([`The jury nods.`, `A few jurors exchange glances \u2014 that landed.`, `Even ${qa.juror} seems satisfied.`, `Respect. The jury felt that.`], qa.juror + qa.targetForQuestion + 'good')
        : _pick([`${qa.juror} doesn't look convinced.`, `A few eye rolls from the jury bench.`, `That answer didn't land. The jury knows it.`, `Silence. Not the good kind.`], qa.juror + qa.targetForQuestion + 'bad');

      html += `<div style="margin-bottom:14px;background:rgba(255,255,255,0.02);border-left:3px solid ${borderColor};padding:12px;border-radius:0 8px 8px 0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          ${rpPortrait(qa.juror, 'sm')}
          <div>
            <div style="font-size:11px;color:var(--muted)">${qa.juror} \u2192 ${qa.targetForQuestion}</div>
            <span style="font-size:8px;font-weight:700;letter-spacing:1px;color:${qColor};text-transform:uppercase">${qType}</span>
          </div>
        </div>
        <div style="font-size:13px;color:#c9d1d9;line-height:1.6;margin-bottom:6px;font-style:italic">"${qa.question}"</div>
        <div style="font-size:12px;color:#8b949e;line-height:1.5;padding-left:8px;border-left:2px solid rgba(255,255,255,0.04);margin-bottom:6px">${qa.response}</div>
        <div style="font-size:11px;color:#484f58;font-style:italic">${reactions}</div>
      </div>`;
    });
  } else {
    html += `<div style="font-size:12px;color:#484f58;font-style:italic">The jury asks their questions. The finalists answer. The room shifts.</div>`;
  }

  // ═══ PHASE 4: FIREWORKS MOMENTS ═══
  html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin:20px 0 12px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">Phase 4 \u2014 Fireworks</div>`;

  const fireworks = [];

  // Feuds: juror with bond <= -3 and a finalist
  jury.forEach(j => {
    finalists.forEach(f => {
      if (getBond(j, f) <= -3) {
        const jHistory = gs.jurorHistory?.[j];
        const votedOut = jHistory?.voters?.includes(f);
        const jp = pronouns(j);
        const fp = pronouns(f);
        const feudTexts = votedOut ? [
          `${j} stands. "You sat there and told me I was safe. Then you wrote my name. I want you to look me in the eye and tell me that was 'just a game.' Go ahead. Say it."`,
          `${j} can barely sit still. "${f}, you blindsided me. You smiled while you did it. So don't come in here pretending you played with honor. You didn't."`,
          `${j} leans forward. "I have one question for ${f}. Were you lying to me the whole time, or just at the end? Because from where I sat, it felt like the whole time."`,
        ] : [
          `${j} goes after ${f} directly. "You played this game like nobody else mattered. The way you treated people \u2014 that's not strategy. That's just who you are."`,
          `${j} doesn't hold back. "I watched you from the bench for weeks, ${f}. Every lie. Every deal you broke. The jury sees everything. We saw you."`,
        ];
        fireworks.push({ type: 'feud', players: [j, f], badgeClass: 'bad', badge: 'CONFRONTATION',
          text: _pick(feudTexts, j + f + 'feud') });
      }
    });
  });

  // Mockery: finalist projected 0 votes
  finalists.forEach(f => {
    const projVotes = juryResult.votes?.[f] || 0;
    if (projVotes === 0) {
      const mocker = jury.find(j => getBond(j, f) <= 0) || jury[0];
      fireworks.push({ type: 'mockery', players: [mocker, f], badgeClass: 'bad', badge: 'ROASTED',
        text: `${mocker} looks at ${f}. "Let me be honest with you. You're sitting here because someone chose to bring you. Not because you earned it. That's not a game. That's a ride. And I think you know that."` });
    }
  });

  // Unexpected respect: bitter juror compliments the finalist they dislike
  jury.forEach(j => {
    const worstFinalist = finalists.reduce((w, f) => getBond(j, f) < getBond(j, w) ? f : w, finalists[0]);
    if (getBond(j, worstFinalist) <= -2 && getBond(j, worstFinalist) >= -3.5) {
      const respectTexts = [
        `${j} surprises everyone. "I can't stand ${worstFinalist}. I've made that clear. But I'll say this \u2014 ${worstFinalist} played harder than anyone else up there. I hate that I respect it. But I do."`,
        `${j} pauses before speaking. "I don't like ${worstFinalist}. Probably never will. But ${worstFinalist} outplayed me. Fair and square. That's the truth, and I won't pretend otherwise."`,
      ];
      fireworks.push({ type: 'respect', players: [j, worstFinalist], badgeClass: 'gold', badge: 'UNEXPECTED RESPECT',
        text: _pick(respectTexts, j + worstFinalist + 'respect') });
    }
  });

  // Supporting moments: ally juror stands up for a finalist
  jury.forEach(j => {
    const bestFinalist = finalists.reduce((b, f) => getBond(j, f) > getBond(j, b) ? f : b, finalists[0]);
    if (getBond(j, bestFinalist) >= 3) {
      const supportTexts = [
        `${j} speaks up. "I watched ${bestFinalist} play every single day. Nobody worked harder. Nobody sacrificed more. I just want you all to know that before you vote."`,
        `${j} addresses the jury directly. "You want to know who deserves this? ${bestFinalist}. Not because we were allies \u2014 because I watched ${bestFinalist} earn every day out there. That's what this vote should be about."`,
        `${j} turns to the jury. "I know some of you are angry. I get it. But ${bestFinalist} played the game better than any of us. If you can't see that, you're voting with your feelings, not your head."`,
      ];
      fireworks.push({ type: 'support', players: [j, bestFinalist], badgeClass: 'win', badge: 'JURY SUPPORT',
        text: _pick(supportTexts, j + bestFinalist + 'support') });
    }
  });

  // Laughter: high boldness/social finalist gets a funny moment
  finalists.forEach(f => {
    const s = pStats(f);
    if (s.boldness >= 8 || (s.social >= 8 && s.boldness >= 6)) {
      const laughTexts = [
        `${f} breaks the tension with a self-aware grin. "Look, I know half of you want to throw something at me right now. But you've got to admit \u2014 I made this season entertaining." The jury laughs. Even the angry ones.`,
        `${f} catches a juror's eye and just shrugs. "What can I say? I'm standing here. You're sitting there. And somehow we all survived each other." It gets a laugh \u2014 begrudging, but real.`,
      ];
      fireworks.push({ type: 'laughter', players: [f], badgeClass: 'gold', badge: 'MOMENT',
        text: _pick(laughTexts, f + 'laugh') });
    }
  });

  // Emotional: juror who was close to a finalist gets emotional
  jury.forEach(j => {
    const bestF = finalists.reduce((b, f) => getBond(j, f) > getBond(j, b) ? f : b, finalists[0]);
    if (getBond(j, bestF) >= 2 && getBond(j, bestF) < 4) {
      const jHistory = gs.jurorHistory?.[j];
      const earlyBoot = jHistory?.eliminatedEp && jHistory.eliminatedEp <= 4;
      if (earlyBoot || pStats(j).temperament <= 4) {
        const emotTexts = [
          `${j}'s voice breaks. "I didn't make it as far as you did. But I wanted to. I just want someone up there to acknowledge that some of us gave everything and still went home." The room goes quiet.`,
          `${j} takes a moment before speaking. "This game took something from me. I'm not over it. I'm not going to pretend I am." Nobody in the jury moves.`,
          `${j} stares at the ground. "I've been sitting here for weeks thinking about what I'd say. And now that I'm here\u2026 I don't know if any of it matters." It matters. The whole room feels it.`,
        ];
        fireworks.push({ type: 'emotional', players: [j], badgeClass: 'gold', badge: 'EMOTIONAL',
          text: _pick(emotTexts, j + 'emo') });
      }
    }
  });

  // Grudge: juror with moderate negative bond reveals a specific resentment
  jury.forEach(j => {
    finalists.forEach(f => {
      const bond = getBond(j, f);
      if (bond <= -1.5 && bond > -3) {
        const grudgeTexts = [
          `${j} is calm but pointed. "I want you to know, ${f} \u2014 I remember the conversation at camp the night before I went home. You looked me in the eye and lied. I just wanted to say it out loud."`,
          `${j} turns to ${f}. "You never checked on me. Not once. When I was on the bottom, you acted like I didn't exist. That tells me everything I need to know about how you played."`,
          `${j} keeps it short. "${f}, you took credit for a move that wasn't yours. Everyone on this bench knows it. I just want the record straight."`,
        ];
        fireworks.push({ type: 'grudge', players: [j, f], badgeClass: 'bad', badge: 'GRUDGE',
          text: _pick(grudgeTexts, j + f + 'grudge') });
      }
    });
  });

  // Callout: juror addresses another juror about voting bias
  if (jury.length >= 6) {
    const biasedJuror = jury.find(j => {
      const bonds = finalists.map(f => getBond(j, f));
      return Math.max(...bonds) - Math.min(...bonds) >= 5;
    });
    const caller = biasedJuror ? jury.find(j => j !== biasedJuror && pStats(j).boldness >= 6) : null;
    if (biasedJuror && caller) {
      fireworks.push({ type: 'callout', players: [caller, biasedJuror], badgeClass: 'gold', badge: 'JURY CLASH',
        text: `${caller} turns to ${biasedJuror}. "Be honest with yourself. You made up your mind the night you got voted out. Don't pretend this is about the game when it's about your feelings." ${biasedJuror} doesn't respond. The jury shifts uncomfortably.` });
    }
  }

  // Deduplicate: max 2 per type, max 6 total fireworks
  const typeCounts = {};
  const dedupedFireworks = [];
  fireworks.forEach(fw => {
    typeCounts[fw.type] = (typeCounts[fw.type] || 0);
    if (typeCounts[fw.type] < 2 && dedupedFireworks.length < 6) {
      typeCounts[fw.type]++;
      dedupedFireworks.push(fw);
    }
  });

  if (dedupedFireworks.length) {
    dedupedFireworks.forEach(fw => {
      const badgeColors = {
        bad: 'color:var(--accent-fire);background:rgba(248,81,73,0.08);border-color:rgba(248,81,73,0.2)',
        win: 'color:#3fb950;background:rgba(63,185,80,0.08);border-color:rgba(63,185,80,0.2)',
        gold: 'color:#e3b341;background:rgba(227,179,65,0.08);border-color:rgba(227,179,65,0.2)',
      };
      const style = badgeColors[fw.badgeClass] || badgeColors.gold;
      html += `<div style="margin-bottom:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          ${fw.players.map(p => rpPortrait(p, 'sm')).join('')}
          <span style="font-size:8px;font-weight:700;letter-spacing:1px;padding:2px 8px;border-radius:4px;border:1px solid;${style}">${fw.badge}</span>
        </div>
        <div style="font-size:13px;color:#c9d1d9;line-height:1.7">${fw.text}</div>
      </div>`;
    });
  } else {
    html += `<div style="font-size:12px;color:#484f58;font-style:italic">The room settles. No eruptions tonight \u2014 just weight.</div>`;
  }

  // FTC swing vote callout
  if (ftcSwings.length) {
    html += `<div style="margin-top:12px;background:rgba(227,179,65,0.05);border:1px solid rgba(227,179,65,0.15);border-radius:8px;padding:10px">
      <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#e3b341;margin-bottom:6px">FTC CHANGED ${ftcSwings.length} VOTE${ftcSwings.length !== 1 ? 'S' : ''}</div>
      ${ftcSwings.map(sw => `<div style="font-size:12px;color:#8b949e;margin-bottom:3px">
        ${rpPortrait(sw.juror, 'sm')} ${sw.juror}: ${sw.originalVote} \u2192 <span style="color:#e3b341;font-weight:600">${sw.finalVote}</span>
      </div>`).join('')}
    </div>`;
  }

  // ═══ PHASE 5: FINAL PLEA ═══
  html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin:20px 0 12px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">Phase 5 \u2014 Final Plea</div>`;

  finalists.forEach(f => {
    const s = pStats(f);
    const wins = gs.episodeHistory.filter(e => e.immunityWinner === f).length;
    const votesAgainst = gs.episodeHistory.reduce((sum, e) => sum + ((e.votingLog || []).filter(v => v.voted === f && v.voter !== 'THE GAME').length), 0);

    let plea;
    if (s.strategic >= 8 && wins >= 2)
      plea = `"I controlled this game AND I competed. I didn't just scheme from the shadows \u2014 I won when I had to. I earned every day. Vote for the complete game."`;
    else if (s.strategic >= 8)
      plea = `"Every big move this season? I was behind it. I'm not going to apologize for playing hard. I'm asking you to reward it. Vote for the person who actually drove this game."`;
    else if (s.social >= 8)
      plea = `"I played this game with relationships. Real ones. I looked every single one of you in the eye and I meant what I said. That's what got me here. And I think that deserves your vote."`;
    else if (wins >= 3)
      plea = `"${wins} challenge wins. I fought for my life every single round. I never hid. I never coasted. I competed \u2014 and I'm asking you to reward that."`;
    else if (votesAgainst >= 6)
      plea = `"You all came for me. ${votesAgainst} votes against me this season. And I'm still here. That's not luck. That's fight. Vote for the person who refused to go home."`;
    else if (s.loyalty >= 8)
      plea = `"I kept my word. In a game where everybody lies, I tried to be someone you could count on. I'm asking you to reward loyalty \u2014 because this game needs more of it."`;
    else
      plea = `"I'm not the biggest personality. I'm not the flashiest player. But I'm standing here. I outlasted every single person on that bench. And I did it my way."`;

    html += `<div style="margin-bottom:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(f, 'sm')}
        <div style="font-family:var(--font-display);font-size:13px">${f}</div>
      </div>
      <div style="font-size:13px;color:#c9d1d9;line-height:1.7;font-style:italic">${plea}</div>
    </div>`;
  });

  // Closing atmosphere
  html += `<div style="text-align:center;font-size:13px;color:#484f58;font-style:italic;margin-top:16px;line-height:1.6;padding:12px 0;border-top:1px solid rgba(255,255,255,0.04)">
    The jury stands. One by one, they walk to the voting urn. Tonight, they vote FOR who they want to win.
  </div>`;

  html += `</div>`;
  return html;
}

// ── Fan Vote Finale: After Immunity (lobbying before the cut) ──
export function rpBuildFanVoteCampLife(ep) {
  if (!ep.finalCut || !ep.immunityWinner) return '';
  const winner = ep.immunityWinner;
  const others = (ep.finaleEntrants || []).filter(p => p !== winner);
  if (!others.length) return '';
  const _pr = pronouns(winner);
  const _wS = pStats(winner);
  const _pick = arr => arr[([...winner].reduce((a,c)=>a+c.charCodeAt(0),0)+ep.num*7)%arr.length];

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Episode ${ep.num} — Finale</div>
    <div class="rp-title">After Immunity</div>
    <div style="font-size:13px;color:#8b949e;text-align:center;margin-bottom:20px">${winner} holds the necklace. ${_pr.Sub} ${_pr.sub==='they'?'decide':'decides'} who goes to the Fan Vote — and who goes home.</div>`;

  // Winner's internal monologue
  html += `<div style="margin-bottom:16px;padding:14px;background:rgba(227,179,65,0.04);border:1px solid rgba(227,179,65,0.15);border-radius:10px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      ${rpPortrait(winner, 'sm')}
      <div>
        <div style="font-size:14px;font-weight:700;color:#e3b341">${winner}</div>
        <div style="font-size:10px;color:#8b949e;font-weight:700;letter-spacing:1px">IMMUNITY HOLDER</div>
      </div>
    </div>
    <div style="font-size:12px;color:#cdd9e5;line-height:1.6;font-style:italic">${_pick([
      `${winner} sits by the fire with the necklace. Tonight isn't about the jury — the fans decide. But first, ${_pr.sub} ${_pr.sub==='they'?'have':'has'} to choose who stands beside ${_pr.obj} when the votes come in. ${_wS.strategic >= 7 ? `${_pr.Sub}'s already thinking about who the fans like less.` : `${_pr.Sub}'s thinking about who ${_pr.sub} ${_pr.sub==='they'?'want':'wants'} beside ${_pr.obj} at the end.`}`,
      `The necklace is around ${_pr.posAdj} neck, but the real power is the decision that comes next. In a fan vote, popularity is everything — and ${winner} gets to choose who ${_pr.sub} ${_pr.sub==='they'?'face':'faces'} in front of a million viewers. ${_wS.strategic >= 7 ? `${_pr.Sub} ${_pr.sub==='they'?'know':'knows'} exactly who ${_pr.sub} can beat.` : `${_pr.Sub} ${_pr.sub==='they'?'wish':'wishes'} ${_pr.sub} knew what the fans were thinking.`}`,
      `${winner} hasn't spoken to anyone since winning immunity. The tribe can feel it — the calculation happening behind those eyes. This isn't a regular vote. The fans are watching. Everyone at camp is wondering the same thing: who does ${winner} want to face when a million people cast their vote?`,
    ])}</div>
  </div>`;

  // Each other player lobbies the winner — fan-vote specific pitches
  others.forEach(player => {
    const bond = getBond(winner, player);
    const pS = pStats(player);
    const pPr = pronouns(player);
    const pop = gs.popularity?.[player] || 0;
    const winnerPop = gs.popularity?.[winner] || 0;
    const isMorePopular = pop > winnerPop;

    const lobbyText = bond >= 3 ? _pick([
      `${player} doesn't need to make a pitch. ${pPr.Sub} and ${winner} just look at each other. "We said the end. This is it." The bond is the argument. But in a fan vote, bonds don't matter — popularity does. And they both know it.`,
      `${player} sits next to ${winner}. "I know it's a fan vote. I know the fans love you. Take me — I won't beat you. The fans will crown you either way." ${pPr.Sub} ${pPr.sub==='they'?'mean':'means'} it. Whether ${winner} believes it is another question.`,
      `${player} finds ${winner} by the water. "We've been through everything together. Don't cut me now. Not like this. Let the fans decide between us — we earned that." ${winner} stares at the water and says nothing.`,
    ]) : bond >= 1 ? _pick([
      `${player} pulls ${winner} aside. "Think about it — who do the fans like less? Me or ${others.find(o => o !== player) || 'them'}? You want to sit next to someone the audience doesn't care about. That's me." ${pS.social >= 7 ? `It's calculated self-deprecation. Brilliant, actually.` : `The desperation shows through the strategy.`}`,
      `${player} makes ${pPr.posAdj} case: "The fan vote isn't about gameplay. It's about who people want to win. You need someone sitting next to you that the fans like LESS than you." ${pS.strategic >= 7 ? `It's the right argument in a fan-vote finale.` : `${pPr.Sub} ${pPr.sub==='they'?'hope':'hopes'} ${winner} is thinking the same way.`}`,
      `"I know the fans aren't voting for me," ${player} says. "I've seen the looks at tribal — I'm not the favorite. But that's exactly why you should take me. ${isMorePopular ? `Okay, maybe I'm wrong. But I think you beat me.` : `You're the fan favorite. I'm the easy win.`}"`,
    ]) : _pick([
      `${player} approaches ${winner} knowing the odds aren't great. "I'm not going to pretend we're close. But this is a fan vote — the fans haven't seen our relationship up close. They've seen the confessionals. Take me and you win. Easy." It's brutally honest.`,
      `${player} doesn't have a strong bond with ${winner}. ${pPr.Sub} ${pPr.sub==='they'?'know':'knows'} it. The pitch isn't about loyalty — it's pure math: "The fans don't know me. They don't care about me. That means you win. Take the easy path."`,
      `${player} barely gets three sentences out before the emotion hits. This isn't strategy. It's ${ep.num > 1 ? (ep.num - 1) * 3 : 1} days on an island, and it's about to end. "Just give me a chance to stand up there. Let the fans see who I really am."`,
    ]);

    html += `<div style="margin-bottom:12px;padding:12px;background:#0d1117;border:1px solid #21262d;border-radius:8px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(player, 'sm')}
        <div style="font-size:13px;font-weight:700;color:#e6edf3">${player}</div>
        <div style="font-size:10px;color:${bond >= 2 ? '#3fb950' : bond >= 0 ? '#8b949e' : '#f85149'};margin-left:auto">Bond: ${bond >= 3 ? 'Strong' : bond >= 1 ? 'Positive' : bond >= 0 ? 'Neutral' : 'Negative'}</div>
      </div>
      <div style="font-size:12px;color:#8b949e;line-height:1.6;font-style:italic">${lobbyText}</div>
    </div>`;
  });

  html += `</div>`;
  return html;
}

export function rpBuildFanCampaign(ep) {
  const fc = ep.fanCampaign;
  if (!fc?.phases?.length) return null;
  const epNum = ep.num || 0;
  const stateKey = `fan-campaign-${epNum}`;
  const totalPhases = fc.phases.length * 3; // per finalist: spotlight, speech+pulse, jury reaction
  const jury = ep.gsSnapshot?.jury || gs.jury || [];

  let html = `<div class="rp-page tod-golden" style="overflow:hidden" id="${stateKey}" data-step="0" data-total="${totalPhases}">
    <div class="rp-eyebrow">Episode ${epNum} — Finale</div>
    <div style="text-align:center;margin-bottom:4px">
      <div style="font-size:10px;letter-spacing:3px;color:#e3b341;font-weight:700">LIVE FROM TRIBAL COUNCIL</div>
      <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;color:#f0f6fc;margin-top:4px;text-shadow:0 0 20px rgba(227,179,65,0.15)">THE FAN CAMPAIGN</div>
      <div style="width:60px;height:2px;background:#e3b341;margin:8px auto"></div>
      <div style="font-size:11px;color:#8b949e;margin-top:4px">The jury watches. The fans decide.</div>
    </div>`;

  // Jury bench — always visible
  html += `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin:16px 0 20px;padding:10px;background:rgba(139,148,158,0.04);border-radius:8px;border:1px solid rgba(139,148,158,0.08)">
    <div style="width:100%;font-size:9px;letter-spacing:2px;color:#8b949e;font-weight:700;text-align:center;margin-bottom:6px">THE JURY</div>`;
  jury.forEach(j => { html += rpPortrait(j, 'sm'); });
  html += `</div>`;

  // Phase containers — all hidden initially, revealed by clicks
  fc.phases.forEach((phase, pIdx) => {
    const baseId = `${stateKey}-p${pIdx}`;
    const fPr = pronouns(phase.finalist);

    // Sub-phase A: Spotlight (portrait + name + badge)
    html += `<div id="${baseId}-spotlight" style="display:none;opacity:0;transition:opacity 0.5s;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:16px;padding:16px;border:1px solid rgba(227,179,65,0.2);border-radius:12px;background:rgba(227,179,65,0.04)">
        <div>${rpPortrait(phase.finalist, 'xl')}</div>
        <div>
          <div style="font-family:var(--font-display);font-size:18px;color:#e3b341;letter-spacing:1px">${phase.finalist}</div>
          <div style="font-size:10px;letter-spacing:2px;color:#8b949e;font-weight:700;margin-top:4px">THE PITCH</div>
          <div style="font-size:11px;color:#58a6ff;margin-top:6px">${vpArchLabel(phase.finalist)}</div>
        </div>
      </div>
    </div>`;

    // Sub-phase B: Speech + Pulse + Fan reactions
    const pulseHeights = phase.pulseReaction === 'surging' ? [60,75,85,70,90,95,100]
      : phase.pulseReaction === 'steady' ? [50,55,60,65,55,60,65]
      : phase.pulseReaction === 'mixed' ? [40,60,35,55,30,50,45]
      : [55,45,35,40,30,25,20]; // cooling

    html += `<div id="${baseId}-speech" style="display:none;opacity:0;transition:opacity 0.5s;margin-bottom:16px">
      <div style="padding:14px;border-radius:10px;background:rgba(139,148,158,0.04);border:1px solid rgba(139,148,158,0.08)">
        <div style="font-size:13px;color:#c9d1d9;font-style:italic;line-height:1.7;margin-bottom:14px">${phase.speech}</div>
        <div style="margin-bottom:10px">
          <div style="font-size:9px;letter-spacing:2px;color:#8b949e;font-weight:700;margin-bottom:6px">AUDIENCE PULSE</div>
          <div style="display:flex;gap:3px;align-items:flex-end;height:40px">`;
    pulseHeights.forEach((h, i) => {
      const color = phase.pulseReaction === 'surging' ? '#e3b341' : phase.pulseReaction === 'cooling' ? '#da3633' : '#58a6ff';
      html += `<div id="${baseId}-bar-${i}" style="flex:1;border-radius:2px;height:0%;background:${color};transition:height 0.6s ease ${i * 0.1}s" data-target-height="${h}%"></div>`;
    });
    html += `</div>
          <div style="font-size:10px;color:${phase.pulseReaction === 'surging' ? '#e3b341' : phase.pulseReaction === 'cooling' ? '#da3633' : '#8b949e'};margin-top:4px;text-align:center">Audience response: <strong>${phase.pulseReaction.toUpperCase()}</strong></div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">`;
    phase.fanReactions.forEach((r, i) => {
      const bgColor = r.sentiment === 'positive' ? 'rgba(227,179,65,0.1)' : 'rgba(139,148,158,0.1)';
      const borderColor = r.sentiment === 'positive' ? 'rgba(227,179,65,0.2)' : 'rgba(139,148,158,0.2)';
      const textColor = r.sentiment === 'positive' ? '#e3b341' : '#8b949e';
      const emoji = r.sentiment === 'positive' ? '\u{1F525}' : '\u{1F624}';
      html += `<div id="${baseId}-pill-${i}" style="opacity:0;transition:opacity 0.4s ease ${0.3 + i * 0.2}s;background:${bgColor};border:1px solid ${borderColor};border-radius:20px;padding:4px 10px;font-size:10px;color:${textColor}">${emoji} "${r.text}"</div>`;
    });
    html += `</div>
      </div>
    </div>`;

    // Sub-phase C: Jury reaction
    if (phase.juryReactions?.length) {
      html += `<div id="${baseId}-jury" style="display:none;opacity:0;transition:opacity 0.5s;margin-bottom:20px">
        <div style="background:rgba(139,148,158,0.06);border-radius:8px;padding:12px">
          <div style="font-size:9px;letter-spacing:2px;color:#8b949e;font-weight:700;margin-bottom:8px">JURY REACTS TO ${phase.finalist.toUpperCase()}</div>`;
      phase.juryReactions.forEach(jr => {
        const bondColor = jr.bond >= 3 ? '#3fb950' : jr.bond <= -2 ? '#f85149' : '#8b949e';
        html += `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px">
          ${rpPortrait(jr.juror, 'sm')}
          <div>
            <div style="font-size:11px;font-weight:600;color:${bondColor}">${jr.juror}</div>
            <div style="font-size:12px;color:#c9d1d9;font-style:italic;line-height:1.5;margin-top:2px">${jr.text}</div>
          </div>
        </div>`;
      });
      html += `</div></div>`;
    }
  });

  // Control buttons
  html += `<div style="display:flex;gap:12px;margin-top:16px;align-items:center" id="${stateKey}-controls">
    <button onclick="fanCampaignAdvance('${stateKey}', ${totalPhases})" id="${stateKey}-btn" style="padding:8px 20px;background:var(--accent-gold);border:none;border-radius:6px;color:#0d1117;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer;font-weight:700">BEGIN BROADCAST</button>
    <button onclick="fanCampaignRevealAll('${stateKey}', ${totalPhases})" style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer">See all</button>
  </div>`;

  html += `</div>`;
  return html;
}

export function rpBuildFanVoteReveal(ep) {
  const fvr = ep.fanVoteResult;
  if (!fvr) return null;
  const epNum = ep.num || 0;
  const stateKey = `fan-vote-${epNum}`;
  const finalists = fvr.rankings;
  const isF2 = finalists.length === 2;
  const totalSteps = 10; // 10 reveal clicks to fill to 100%

  let html = `<div class="rp-page tod-golden" style="overflow:hidden">
    <div class="rp-eyebrow">Episode ${epNum} — Finale</div>
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:10px;letter-spacing:3px;color:#e3b341;font-weight:700">THE MOMENT OF TRUTH</div>
      <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;color:#f0f6fc;margin-top:4px;text-shadow:0 0 20px rgba(227,179,65,0.15)">THE FAN VOTE</div>
      <div style="width:60px;height:2px;background:#e3b341;margin:8px auto"></div>
      <div style="font-size:11px;color:#8b949e;margin-top:4px">${isF2 ? 'Head to head. One winner.' : 'Three finalists. One winner. The fans decide.'}</div>
    </div>`;

  if (isF2) {
    // F2: Head-to-head layout
    const [a, b] = finalists;
    const aPct = fvr.percentages[a] || 50;
    const bPct = fvr.percentages[b] || 50;

    html += `<div id="${stateKey}" data-step="0" data-total="${totalSteps}" data-pcts="${aPct},${bPct}" data-names="${a},${b}" data-winner="${fvr.winner}" data-margin="${fvr.margin}">`;

    // Portraits facing each other
    html += `<div style="display:flex;justify-content:center;align-items:center;gap:32px;margin-bottom:24px">
      <div style="text-align:center" id="${stateKey}-left">
        ${rpPortrait(a, 'xl')}
        <div style="font-family:var(--font-display);font-size:16px;color:#f0f6fc;margin-top:8px">${a}</div>
        <div style="font-size:11px;color:#8b949e">${vpArchLabel(a)}</div>
      </div>
      <div style="font-family:var(--font-display);font-size:20px;color:#8b949e;letter-spacing:2px">VS</div>
      <div style="text-align:center" id="${stateKey}-right">
        ${rpPortrait(b, 'xl')}
        <div style="font-family:var(--font-display);font-size:16px;color:#f0f6fc;margin-top:8px">${b}</div>
        <div style="font-size:11px;color:#8b949e">${vpArchLabel(b)}</div>
      </div>
    </div>`;

    // Central percentage display
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <div id="${stateKey}-pct-a" style="font-family:var(--font-mono);font-size:28px;color:#e3b341;font-weight:700;text-align:right;flex:1;transition:all 0.4s">\u2014</div>
      <div style="font-size:12px;color:#8b949e">|</div>
      <div id="${stateKey}-pct-b" style="font-family:var(--font-mono);font-size:28px;color:#58a6ff;font-weight:700;text-align:left;flex:1;transition:all 0.4s">\u2014</div>
    </div>`;

    // Dual bar
    html += `<div style="display:flex;height:24px;border-radius:12px;overflow:hidden;background:rgba(139,148,158,0.1);margin-bottom:20px">
      <div id="${stateKey}-bar-a" style="height:100%;background:linear-gradient(90deg,#e3b341,#d29922);width:0%;transition:width 0.6s ease;border-radius:12px 0 0 12px"></div>
      <div id="${stateKey}-bar-b" style="height:100%;background:linear-gradient(90deg,#3b82f6,#58a6ff);width:0%;transition:width 0.6s ease;border-radius:0 12px 12px 0;margin-left:auto"></div>
    </div>`;

    html += `</div>`;

  } else {
    // F3: Vertical bars layout
    html += `<div id="${stateKey}" data-step="0" data-total="${totalSteps}" data-pcts="${finalists.map(f => fvr.percentages[f] || 0).join(',')}" data-names="${finalists.join(',')}" data-winner="${fvr.winner}" data-margin="${fvr.margin}">`;

    html += `<div style="display:flex;justify-content:center;gap:24px;margin-bottom:20px;align-items:flex-end">`;
    finalists.forEach((name, i) => {
      const colors = ['#e3b341', '#58a6ff', '#a78bfa'];
      html += `<div style="text-align:center;flex:1;max-width:160px">
        <div style="height:160px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:8px">
          <div id="${stateKey}-vbar-${i}" style="width:48px;border-radius:6px 6px 0 0;background:${colors[i]};height:0%;transition:height 0.6s ease"></div>
        </div>
        ${rpPortrait(name, 'lg')}
        <div style="font-family:var(--font-display);font-size:14px;color:#f0f6fc;margin-top:6px">${name}</div>
        <div style="font-size:10px;color:#8b949e">${vpArchLabel(name)}</div>
        <div id="${stateKey}-vpct-${i}" style="font-family:var(--font-mono);font-size:20px;color:${colors[i]};font-weight:700;margin-top:6px;transition:all 0.4s">\u2014</div>
      </div>`;
    });
    html += `</div>`;

    html += `</div>`;
  }

  // Winner section — hidden until fully revealed
  html += `<div id="${stateKey}-winner" style="display:none;text-align:center;margin-top:20px;padding:20px;border:2px solid rgba(227,179,65,0.4);border-radius:12px;background:rgba(227,179,65,0.06);box-shadow:0 0 30px rgba(227,179,65,0.1)">
    <div style="font-size:10px;letter-spacing:3px;color:#e3b341;font-weight:700;margin-bottom:12px">THE FANS HAVE SPOKEN</div>
    ${rpPortrait(fvr.winner, 'xl')}
    <div style="font-family:var(--font-display);font-size:24px;color:#e3b341;margin-top:12px;text-shadow:0 0 20px rgba(227,179,65,0.3)">${fvr.winner}</div>
    <div style="font-size:13px;color:#8b949e;margin-top:8px">${fvr.percentages[fvr.winner]}% of the fan vote</div>
    <span class="rp-brant-badge gold" style="margin-top:8px;display:inline-block">${fvr.margin === 'landslide' ? 'LANDSLIDE' : fvr.margin === 'razor-thin' ? 'RAZOR-THIN' : 'COMFORTABLE'}</span>
    <div style="margin-top:16px;font-size:11px;color:#8b949e">
      ${fvr.breakdown.map(b => `${b.name}: ${b.pct}% (popularity: ${b.popularity})`).join(' &nbsp;|&nbsp; ')}
    </div>
  </div>`;

  // Control buttons
  html += `<div style="display:flex;gap:12px;margin-top:16px;align-items:center">
    <button onclick="fanVoteRevealNext('${stateKey}')" id="${stateKey}-btn" style="padding:8px 20px;background:var(--accent-gold);border:none;border-radius:6px;color:#0d1117;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer;font-weight:700">REVEAL (0/${totalSteps})</button>
    <button onclick="fanVoteRevealAll('${stateKey}')" style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer">See all results</button>
  </div>`;

  html += `</div>`;
  return html;
}

export function rpBuildJuryVoteReveal(ep) {
  const juryResult = ep.juryResult;
  const finalists = ep.finaleFinalists || gs.activePlayers;
  const winner = ep.winner;
  if (!winner || !juryResult?.votes) return '';

  const jury = gs.jury || [];
  const reasoning = juryResult.reasoning || [];
  const votes = juryResult.votes;
  const epNum = ep.num;
  const sorted = Object.entries(votes).sort(([,a],[,b]) => b-a);

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${epNum} \u2014 Finale</div>
    <div style="font-family:var(--font-display);font-size:24px;letter-spacing:2px;text-align:center;margin-bottom:20px;text-transform:uppercase">The Votes Are Read</div>
    <div style="display:flex;justify-content:center;gap:28px;margin-bottom:20px">
      ${finalists.map(f => `<div style="text-align:center">
        ${rpPortrait(f, 'lg')}
        <div style="font-size:11px;font-family:var(--font-display);margin-top:6px">${f}</div>
        <div id="ftc-cnt-${epNum}-${f.replace(/\s+/g,'_')}" style="font-size:28px;font-family:var(--font-display);color:#8b949e;margin-top:4px;min-width:40px" data-finalist="${f}" data-winner="${winner}">0</div>
      </div>`).join('')}
    </div>
    <div id="ftc-cards-${epNum}" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">`;

  reasoning.forEach((r, i) => {
    const isWin = r.votedFor === winner;
    html += `<div class="tv-vote-card ftc-card" data-voted="${r.votedFor}" data-voter="${r.juror}" data-index="${i}" data-epnum="${epNum}" data-is-winner-vote="${isWin}" style="display:none;border-color:rgba(139,148,158,0.3);background:rgba(139,148,158,0.03)">
      <div class="tv-vote-voter-wrap">
        ${rpPortrait(r.juror, 'sm')}
        <div class="tv-vote-voter">${r.juror}</div>
      </div>
      <div class="tv-vote-arrow">\u2192</div>
      <div class="tv-vote-right">
        <div class="tv-vote-target">${r.votedFor}</div>
        ${r.reason ? `<div class="tv-vote-reason" style="font-size:11px;margin-top:3px">${r.reason}</div>` : ''}
      </div>
    </div>`;
  });

  html += `</div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
      <button class="rp-btn" id="ftc-btn-next-${epNum}" onclick="ftcRevealNext(${epNum}, ${reasoning.length})">Reveal Next Vote</button>
      <button class="rp-btn" onclick="ftcRevealAll(${epNum}, ${reasoning.length})">Reveal All</button>
    </div>
    <div id="ftc-final-${epNum}" style="display:none;text-align:center;padding:16px;background:rgba(227,179,65,0.05);border:1px solid rgba(227,179,65,0.2);border-radius:8px;margin-top:8px">
      <div style="font-size:11px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Final Tally</div>
      <div style="font-size:18px;font-family:var(--font-display);color:#e3b341">${sorted.map(([n,v])=>`${n}: ${v}`).join(' \u2014 ')}</div>
      ${ep.juryTiebreak ? (() => {
        const tb = ep.juryTiebreak;
        const isDouble = tb.method === 'double-crowning';
        const rv = tb.revote;
        let tbHtml = `<div style="margin-top:16px;padding-top:16px;border-top:2px solid rgba(210,153,34,0.4)">
          <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#d29922;text-transform:uppercase;margin-bottom:8px;text-align:center">
            \u26A1 DEADLOCKED \u2014 ${isDouble ? 'DOUBLE CROWNING' : tb.method === 'finalist-tiebreaker' ? 'DECIDING VOTE' : 'JURY REVOTE'}
          </div>
          <div style="font-size:13px;color:#c9d1d9;text-align:center;margin-bottom:14px;line-height:1.6">
            ${isDouble ? `The vote is tied. ${tb.tied.join(' and ')} agree to share the title.${tb.bond ? ` Their bond (${tb.bond}) made this possible.` : ''}`
            : tb.method === 'finalist-tiebreaker' ? `The vote is tied. The jury revoted — still deadlocked. ${tb.tiebreaker} casts the deciding vote.`
            : `The vote is tied. The jury must vote again.`}
          </div>`;
        // Show revote cards
        if (rv?.reasoning?.length) {
          // Show finalists with revote tallies
          const rvSorted = Object.entries(rv.votes || {}).sort(([,a],[,b]) => b-a);
          tbHtml += `<div style="display:flex;justify-content:center;gap:20px;margin-bottom:12px">
            ${rvSorted.map(([n,v]) => `<div style="text-align:center">
              ${rpPortrait(n)}
              <div style="font-size:20px;font-family:var(--font-display);color:#e3b341;margin-top:4px">${v}</div>
            </div>`).join('<div style="font-size:18px;color:#484f58;align-self:center">\u2014</div>')}
          </div>`;
          // Individual revote cards
          rv.reasoning.forEach(r => {
            // Did they change their vote from the original?
            const origVote = reasoning.find(o => o.juror === r.juror)?.votedFor;
            const changed = origVote && origVote !== r.votedFor;
            const changeNote = changed ? `<span style="font-size:9px;color:#f97316;font-weight:700;margin-left:6px">CHANGED</span>` : `<span style="font-size:9px;color:#484f58;margin-left:6px">held</span>`;
            tbHtml += `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;margin-bottom:3px;background:rgba(210,153,34,0.04);border-radius:6px;border:1px solid rgba(210,153,34,0.1)">
              ${rpPortrait(r.juror, 'xs')}
              <span style="font-size:11px;color:#8b949e;width:80px">${r.juror}</span>
              <span style="font-size:11px;color:#e3b341">\u2192 ${r.votedFor}</span>
              ${changeNote}
            </div>`;
          });
        }
        // Finalist tiebreaker card
        if (tb.method === 'finalist-tiebreaker' && tb.tiebreaker) {
          tbHtml += `<div style="margin-top:12px;padding:10px;background:rgba(227,179,65,0.06);border:1px solid rgba(227,179,65,0.2);border-radius:8px;text-align:center">
            <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#e3b341;margin-bottom:6px">THE DECIDING VOTE</div>
            ${rpPortrait(tb.tiebreaker, 'sm')}
            <div style="font-size:13px;color:#e6edf3;margin-top:4px"><strong>${tb.tiebreaker}</strong> \u2192 <strong>${tb.winner}</strong></div>
            <div style="font-size:11px;color:#8b949e;margin-top:4px;font-style:italic">${tb.tiebreakerReason || ''}</div>
          </div>`;
        }
        tbHtml += `<div style="font-size:14px;color:#e3b341;text-align:center;margin-top:14px;font-family:var(--font-display);letter-spacing:1px">
          ${isDouble
            ? `Still deadlocked. <strong>${tb.tied.join(' and ')}</strong> agree to share the title and are both crowned Sole Survivors.`
            : tb.method === 'finalist-tiebreaker'
            ? `<strong>${tb.winner}</strong> wins — decided by ${tb.tiebreaker}'s vote.`
            : `<strong>${tb.winner}</strong> breaks through on the revote and wins the game.`}
        </div></div>`;
        return tbHtml;
      })() : ''}
    </div>
  </div>`;
  return html;
}

// ── Winner Ceremony: confetti, trophy, celebration ──
export function rpBuildWinnerCeremony(ep) {
  const winner = ep.winner;
  if (!winner) return null;
  const finalists = ep.finaleFinalists || [];
  const epNum = ep.num;
  const juryResult = ep.juryResult;
  const isFinalChallenge = !juryResult;
  const isDoubleCrowning = !!ep.juryTiebreak?.method?.includes('double');
  const doubleCrowningWinners = isDoubleCrowning ? (ep.juryTiebreak.winners || ep.juryTiebreak.tied || winner.split(' & ')) : null;
  // For double crowning, use first winner's stats for the confessional etc.
  const _primaryWinner = isDoubleCrowning ? doubleCrowningWinners[0] : winner;
  const ws = pStats(_primaryWinner);
  const wp = pronouns(_primaryWinner);

  // Winner vote count
  const winVotes = juryResult?.votes?.[_primaryWinner] || 0;
  const totalJury = (gs.jury || []).length;
  const voteStr = juryResult ? Object.entries(juryResult.votes).sort(([,a],[,b]) => b-a).map(([n,v]) => v).join('-') : null;

  // Generate confetti pieces (CSS-only, no JS animation needed)
  const confettiColors = ['#e3b341', '#3fb950', '#f85149', '#6366f1', '#58a6ff', '#d2a8ff'];
  let confettiHtml = `<div class="confetti-container" style="height:200px;margin:-16px -16px 0 -16px;position:relative;overflow:visible">`;
  for (let i = 0; i < 50; i++) {
    const color = confettiColors[i % confettiColors.length];
    const left = 10 + Math.round((i * 17 + 3) % 80); // 10-90% spread
    const top = Math.round((i * 7) % 40); // stagger starting positions
    const delay = (i * 0.08).toFixed(2); // faster stagger
    const duration = (2.5 + (i % 5) * 0.6).toFixed(1);
    const size = 6 + (i % 5) * 3;
    const rotation = (i * 37) % 360;
    const shapes = ['border-radius:2px', 'border-radius:50%', 'border-radius:0;transform:rotate(45deg)'];
    const shape = shapes[i % 3];
    confettiHtml += `<div class="confetti-piece" style="left:${left}%;top:${top}px;width:${size}px;height:${size}px;background:${color};animation-delay:${delay}s;animation-duration:${duration}s;${shape}"></div>`;
  }
  confettiHtml += `</div>`;

  let html = `<div class="rp-page tod-golden" style="overflow:hidden">
    <div class="rp-eyebrow">Episode ${epNum} \u2014 Finale</div>`;

  // Confetti burst
  html += confettiHtml;

  // Pause beat
  html += `<div style="text-align:center;font-size:14px;color:#8b949e;letter-spacing:1px;margin-bottom:8px">The winner of ${seasonConfig.name || 'this season'}\u2026</div>`;

  // Winner announcement
  if (isDoubleCrowning && doubleCrowningWinners?.length >= 2) {
    html += `<div style="text-align:center;font-family:var(--font-display);font-size:16px;letter-spacing:2px;color:#d29922;margin-bottom:12px">DOUBLE CROWNING</div>`;
    html += `<div style="display:flex;justify-content:center;gap:24px;margin-bottom:20px">`;
    doubleCrowningWinners.forEach(w => {
      const _wVotes = juryResult?.votes?.[w] || 0;
      html += `<div style="text-align:center;border:3px solid var(--accent-gold);border-radius:16px;padding:20px 24px;background:rgba(227,179,65,0.06);box-shadow:0 0 40px rgba(227,179,65,0.15)">
        <div style="display:flex;justify-content:center">${rpPortrait(w, 'xl')}</div>
        <div style="font-family:var(--font-display);font-size:22px;letter-spacing:3px;color:var(--accent-gold);margin-top:12px">${w}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">${vpArchLabel(w)}</div>
        <div style="font-size:13px;color:var(--accent-gold);font-family:var(--font-mono);margin-top:8px">${_wVotes} jury vote${_wVotes !== 1 ? 's' : ''}</div>
      </div>`;
    });
    html += `</div>`;
    html += `<div style="text-align:center;font-size:13px;color:#8b949e;margin-bottom:20px;line-height:1.6">The jury was deadlocked. After a revote, the tie held. Both players are crowned Sole Survivors.</div>`;
  } else {
    html += `<div style="display:flex;justify-content:center;margin-bottom:20px">
      <div style="text-align:center;border:3px solid var(--accent-gold);border-radius:16px;padding:20px 32px;background:rgba(227,179,65,0.06);box-shadow:0 0 40px rgba(227,179,65,0.15)">
        <div style="display:flex;justify-content:center">${rpPortrait(winner, 'xl')}</div>
        <div style="font-family:var(--font-display);font-size:28px;letter-spacing:3px;color:var(--accent-gold);margin-top:12px;text-shadow:0 0 20px rgba(227,179,65,0.3)">${winner}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">${vpArchLabel(winner)}</div>
        ${ep.fanVoteResult ? `<div style="font-size:13px;color:var(--accent-gold);font-family:var(--font-mono);margin-top:8px">${ep.fanVoteResult.percentages[winner] || 0}% Fan Vote</div>`
        : voteStr ? `<div style="font-size:13px;color:var(--accent-gold);font-family:var(--font-mono);margin-top:8px">${voteStr} jury vote</div>`
        : `<div style="font-size:13px;color:var(--accent-gold);font-family:var(--font-mono);margin-top:8px">Final Challenge Winner</div>`}
      </div>
    </div>`;
  }

  // Trophy moment
  html += `<div style="text-align:center;font-size:15px;color:#c9d1d9;line-height:1.6;margin-bottom:20px">
    ${isDoubleCrowning
      ? `The tribe has spoken. ${doubleCrowningWinners.join(' and ')} are the Sole Survivors. ${voteStr || '?'} jury vote — deadlocked.`
      : ep.fanVoteResult
      ? `The fans have spoken. ${winner} wins the season with ${ep.fanVoteResult.percentages[winner] || 0}% of the fan vote. ${ep.fanVoteResult.margin === 'landslide' ? 'A dominant performance.' : ep.fanVoteResult.margin === 'razor-thin' ? 'By the slimmest of margins.' : 'A decisive victory.'}`
      : isFinalChallenge
      ? `${winner} wins the Final Challenge and takes the season. No jury. No vote. ${wp.Sub} earned it on the field.`
      : `The tribe has spoken. ${winner} is the Sole Survivor. ${winVotes} out of ${totalJury} jury votes.`}
  </div>`;

  // Final Challenge scores breakdown (final-challenge format only)
  if (isFinalChallenge && ep.finaleChallengeScores && ep.finaleChallengeStages) {
    const chalScores = ep.finaleChallengeScores;
    const chalStages = ep.finaleChallengeStages;
    const chalSorted = Object.entries(chalScores).sort(([,a],[,b]) => b - a);
    const maxScore = chalSorted[0]?.[1] || 1;

    html += `<div style="margin-bottom:20px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:10px">Challenge Scores</div>`;

    chalSorted.forEach(([name, total], rank) => {
      const isWin = name === winner;
      const barPct = Math.round((total / maxScore) * 100);
      const stageWins = chalStages.filter(s => s.winner === name).length;
      html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(name, isWin ? 'md' : 'sm')}
        <div style="flex:1">
          <div style="font-size:13px;${isWin ? 'color:var(--accent-gold);font-weight:600' : 'color:#c9d1d9'}">${name}${isWin ? ' \u2014 Winner' : ''}</div>
          <div style="height:6px;background:var(--surface2);border-radius:3px;margin-top:4px;overflow:hidden">
            <div style="height:100%;width:${barPct}%;background:${isWin ? 'var(--accent-gold)' : '#484f58'};border-radius:3px"></div>
          </div>
        </div>
        <div style="text-align:right;min-width:60px">
          <div style="font-family:var(--font-mono);font-size:13px;color:${isWin ? 'var(--accent-gold)' : 'var(--muted)'}">${total.toFixed(1)}</div>
          <div style="font-size:9px;color:var(--muted)">${stageWins} stage${stageWins !== 1 ? 's' : ''} won</div>
        </div>
      </div>`;
    });

    html += `</div>`;
  }

  // Winner's final confessional — generated from full game arc
  const wins = gs.episodeHistory.filter(e => e.immunityWinner === winner).length;
  const votesAgainst = gs.episodeHistory.reduce((s, e) => s + ((e.votingLog||[]).filter(v => v.voted === winner && v.voter !== 'THE GAME').length), 0);
  const idolsPlayed = gs.episodeHistory.reduce((s, e) => s + ((e.idolPlays||[]).filter(p => p.player === winner).length), 0);
  const daysPlayed = epNum > 1 ? (epNum - 1) * 3 : 1;

  let confessional;
  // Fan-vote specific confessional
  if (ep.fanVoteResult) {
    const fvMargin = ep.fanVoteResult.margin;
    if (fvMargin === 'landslide')
      confessional = `"The fans saw everything. Every move, every conversation, every confessional. And they chose me. That's not luck — that's validation. I played a game worth watching."`;
    else if (fvMargin === 'razor-thin')
      confessional = `"I almost lost. I know how close it was. But almost doesn't count. The fans saw something in me — by the thinnest margin — and I'll take it. A win is a win."`;
    else
      confessional = `"The jury doesn't decide tonight. The fans do. And they picked me. That means more than any jury vote. A million people watched and said — that's the one. I can't believe it."`;
  } else if (ws.strategic >= 8 && ws.social >= 7)
    confessional = `"I played every angle. Strategy, relationships, competition. I wasn't going to leave anything to chance. And here I am \u2014 holding the trophy. This is what I came here to do."`;
  else if (ws.strategic >= 8)
    confessional = `"Every move I made was calculated. Every alliance, every betrayal, every vote. People will call me cold. I call it winning. And I'd do it all again."`;
  else if (ws.social >= 8)
    confessional = `"I won this game with relationships. Real ones. Every person on that jury \u2014 I looked them in the eye and I meant what I said. That's what this game should be about."`;
  else if (wins >= 3 || ws.physical >= 8)
    confessional = `"${wins} challenge wins. ${daysPlayed} days. I never stopped fighting. People tried to vote me out \u2014 I won my way through. That's not luck. That's will."`;
  else if (ws.loyalty >= 8)
    confessional = `"I kept my word. In a game full of liars, I stayed true to the people who mattered. And the jury saw that. Loyalty wins."`;
  else if (votesAgainst >= 6)
    confessional = `"${votesAgainst} votes against me this season. ${votesAgainst}. And I'm still here. I survived everything they threw at me. That's my game."`;
  else
    confessional = `"If you told me on day one I'd be standing here with the trophy, I would have laughed. But I outlasted every single person. And I did it my way."`;

  if (isDoubleCrowning && doubleCrowningWinners?.length >= 2) {
    // Both winners get confessionals
    doubleCrowningWinners.forEach(w => {
      const _wConf = `"We both fought for this. Sharing it doesn't make it less real. If anything, it means the jury couldn't decide — and that says something about both of us."`;
      html += `<div style="background:rgba(227,179,65,0.05);border:1px solid rgba(227,179,65,0.15);border-radius:10px;padding:14px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          ${rpPortrait(w, 'sm')}
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--accent-gold)">CO-WINNER'S CONFESSIONAL</div>
        </div>
        <div style="font-size:13px;color:#c9d1d9;line-height:1.7;font-style:italic">${_wConf}</div>
      </div>`;
    });
    // No runners-up in a double crowning — both finalists won
  } else {
    html += `<div style="background:rgba(227,179,65,0.05);border:1px solid rgba(227,179,65,0.15);border-radius:10px;padding:14px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(winner, 'sm')}
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--accent-gold)">WINNER'S CONFESSIONAL</div>
      </div>
      <div style="font-size:13px;color:#c9d1d9;line-height:1.7;font-style:italic">${confessional}</div>
    </div>`;

    // Runner-up reactions
    const runnersUp = finalists.filter(f => f !== winner);
    if (runnersUp.length) {
      html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:10px">Runner${runnersUp.length > 1 ? 's' : ''}-Up</div>`;
      runnersUp.forEach(ru => {
        const bond = getBond(ru, winner);
        const ruVotes = juryResult?.votes?.[ru] || 0;
        let reaction;
        if (bond >= 3) reaction = `${ru} smiles. It hurts \u2014 but if anyone was going to beat ${ru}, ${ru} is glad it was ${winner}. "You earned it. I mean that."`;
        else if (bond >= 0) reaction = `${ru} nods. Gracious on the surface. "Congrats, ${winner}." But the eyes tell a different story.`;
        else reaction = `${ru} doesn't clap. Doesn't speak. Just sits there, processing. This game took something from ${ru} that won't come back easily.`;

        html += `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px">
          ${rpPortrait(ru, 'sm')}
          <div>
            <div style="font-size:12px;color:#c9d1d9">${ru} ${ruVotes ? `\u00b7 ${ruVotes} vote${ruVotes !== 1 ? 's' : ''}` : ''}</div>
            <div style="font-size:12px;color:#8b949e;font-style:italic;margin-top:3px">${reaction}</div>
          </div>
        </div>`;
      });
    }
  }

  // Bench eruption (final challenge format)
  if (isFinalChallenge && ep.benchAssignments) {
    const winBench = ep.benchAssignments[winner] || [];
    const loseBench = finalists.filter(f => f !== winner).flatMap(f => ep.benchAssignments[f] || []);
    if (winBench.length) {
      html += `<div style="margin-top:12px;padding:10px;background:rgba(63,185,80,0.05);border:1px solid rgba(63,185,80,0.15);border-radius:8px">
        <div style="font-size:10px;font-weight:700;color:#3fb950;letter-spacing:1px;margin-bottom:6px">${winner.toUpperCase()}'S BENCH ERUPTS</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">
          ${winBench.map(s => rpPortrait(s)).join('')}
        </div>
        <div style="font-size:12px;color:#8b949e;font-style:italic">They chose right. And they know it.</div>
      </div>`;
    }
  }

  // Assistant callout
  if (ep.assistants?.[winner]?.name) {
    const asst = ep.assistants[winner];
    html += `<div style="display:flex;align-items:center;gap:10px;margin-top:12px;padding:10px;background:rgba(227,179,65,0.04);border:1px solid rgba(227,179,65,0.12);border-radius:6px">
      ${rpPortrait(asst.name, 'sm')}
      <div style="font-size:12px;color:#8b949e">${asst.name} helped ${winner} when it mattered most. ${asst.bond >= 2 ? 'A bond forged in the game, honored at the finish.' : 'An unlikely partnership that paid off.'}</div>
    </div>`;
  }

  // FTC swing callout
  if (ep.ftcSwings?.length) {
    html += `<div style="margin-top:12px;font-size:11px;color:#484f58;font-style:italic;text-align:center">
      FTC changed ${ep.ftcSwings.length} vote${ep.ftcSwings.length !== 1 ? 's' : ''} tonight.
      ${ep.ftcSwings.some(s => s.finalVote === winner) ? `At least one swing went to ${winner} \u2014 performance at tribal mattered.` : ''}
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildWinner(ep) {
  const winner = ep.winner;
  if (!winner) return '';
  const isFinalChallenge = !!ep.finaleChallengeWinner && !ep.juryResult;
  const votes = ep.juryResult?.votes || {};
  const sorted = Object.entries(votes).sort(([,a],[,b]) => b-a);
  const winVotes = votes[winner] || 0;
  const totalJury = (gs.jury || []).length;
  const ws = pStats(winner);
  const wins = gs.episodeHistory.filter(e => e.immunityWinner === winner).length;

  let winLine = isFinalChallenge
    ? `${winner} wins the season by winning the Final Challenge!`
    : `${winner} wins the season ${winVotes}\u2013${totalJury - winVotes}${sorted.length > 2 ? `\u2013${sorted[2]?.[1]||0}` : ''}!`;

  let subLine;
  if (ws.strategic >= 8 && ws.social >= 7) subLine = `A complete game. Strategy, social play, execution. The jury recognized all of it.`;
  else if (ws.strategic >= 8) subLine = `Controlled the vote from start to finish. Not everyone loved the moves \u2014 but nobody could argue with them.`;
  else if (ws.social >= 8) subLine = `Won the jury through relationships. In the end, they voted for someone they actually liked.`;
  else if (wins >= 3 || ws.physical >= 8) subLine = `Won immunity when it counted. A champion who earned every single day.`;
  else subLine = `Outlasted, outplayed, and outwitted everyone. A win built entirely on resilience.`;

  let html = `<div class="rp-page tod-deepnight" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:400px">
    <div class="rp-eyebrow" style="margin-bottom:32px">Episode ${ep.num} \u2014 ${seasonConfig.name || 'Season Finale'}</div>
    <div style="font-family:var(--font-display);font-size:11px;letter-spacing:3px;color:#e3b341;text-transform:uppercase;margin-bottom:16px">Sole Survivor</div>
    ${rpPortrait(winner, 'xl')}
    <div style="font-family:var(--font-display);font-size:38px;color:#e3b341;margin:16px 0 4px;text-shadow:0 0 40px rgba(227,179,65,0.35)">${winner}</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:20px">${vpArchLabel(winner)}</div>
    <div style="font-size:15px;color:#c9d1d9;max-width:340px;line-height:1.6;margin-bottom:6px">${winLine}</div>
    <div style="font-size:12px;color:var(--muted);max-width:300px;line-height:1.5;margin-bottom:24px">${subLine}</div>
    <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;font-size:11px;color:var(--muted)">
      <span>${wins} immunity win${wins!==1?'s':''}</span>
      ${!isFinalChallenge ? `<span>${winVotes}/${totalJury} jury votes</span>` : ''}
      <span>${vpArchLabel(winner)}</span>
    </div>
    ${sorted.length >= 2 && !isFinalChallenge ? `<div style="margin-top:20px;font-size:11px;color:var(--muted)">Runner-up: ${sorted[1][0]} \u00b7 ${sorted[1][1]} vote${sorted[1][1]!==1?'s':''}</div>` : ''}
  </div>`;
  return html;
}

// ── Reunion Show: interactive awards reveal, season recap, drama ──
export let _reunionRevealed = {};
export function reunionRevealNext(epNum) {
  const key = epNum + '_reunion';
  if (!_reunionRevealed[key]) _reunionRevealed[key] = 0;
  const sections = document.querySelectorAll(`#reunion-${epNum} .reunion-section`);
  if (_reunionRevealed[key] < sections.length) {
    sections[_reunionRevealed[key]].style.display = 'block';
    sections[_reunionRevealed[key]].scrollIntoView({ behavior: 'smooth', block: 'start' });
    _reunionRevealed[key]++;
  }
  const btn = document.getElementById(`reunion-btn-${epNum}`);
  if (btn) {
    if (_reunionRevealed[key] >= sections.length) btn.style.display = 'none';
    else btn.textContent = `Next (${_reunionRevealed[key]}/${sections.length})`;
  }
}
export function reunionRevealAll(epNum) {
  const sections = document.querySelectorAll(`#reunion-${epNum} .reunion-section`);
  sections.forEach(s => s.style.display = 'block');
  _reunionRevealed[epNum + '_reunion'] = sections.length;
  const btn = document.getElementById(`reunion-btn-${epNum}`);
  if (btn) btn.style.display = 'none';
}

// Grand Challenge stage-by-stage reveal
export let _gcRevealed = {};
export function gcRevealNext(key, totalStages) {
  // Reset if DOM was rebuilt (first stage is hidden = fresh render)
  const firstStage = document.getElementById(`gc-stage-${key}-0`);
  if (firstStage && firstStage.style.display === 'none' && (_gcRevealed[key] || 0) > 0) {
    _gcRevealed[key] = 0;
  }
  if (!_gcRevealed[key]) _gcRevealed[key] = 0;
  if (_gcRevealed[key] < totalStages) {
    const el = document.getElementById(`gc-stage-${key}-${_gcRevealed[key]}`);
    if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    _gcRevealed[key]++;
  }
  const btn = document.getElementById(`gc-btn-${key}`);
  if (btn) {
    if (_gcRevealed[key] >= totalStages) btn.style.display = 'none';
    else btn.textContent = `Reveal Stage ${_gcRevealed[key] + 1}`;
  }
}
export function gcRevealAll(key, totalStages) {
  for (let i = 0; i < totalStages; i++) {
    const el = document.getElementById(`gc-stage-${key}-${i}`);
    if (el) el.style.display = 'block';
  }
  _gcRevealed[key] = totalStages;
  const btn = document.getElementById(`gc-btn-${key}`);
  if (btn) btn.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════════════
// REJECTED OLYMPIC RELAY — VP SCREENS
// ══════════════════════════════════════════════════════════════════════

const RELAY_STYLES = `<style>
.relay-arena{--relay-gold:#e3b341;--relay-red:#f85149;--relay-blue:#388bfd;--relay-green:#3fb950;--relay-muted:#8b949e;color:#c9d1d9;font-family:var(--font-body,system-ui);padding:24px 16px 40px;position:relative;min-height:100vh}
.relay-arena.phase-pitch{background:linear-gradient(180deg,#0d1117 0%,#161b22 40%,#1a1e2a 100%)}
.relay-arena.phase-flagpole{background:linear-gradient(180deg,#0d1117 0%,#141820 30%,#1a2030 100%)}
.relay-arena.phase-beam{background:linear-gradient(180deg,#0a0e18 0%,#0d1520 40%,#0a1a2a 100%)}
.relay-arena.phase-sprint{background:linear-gradient(180deg,#1a1810 0%,#1e2010 30%,#1a2518 100%)}
.relay-arena.phase-finish{background:linear-gradient(180deg,#1a1508 0%,#201a0a 40%,#1a1508 100%)}
.relay-eyebrow{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--relay-gold);text-align:center;margin-bottom:6px}
.relay-title{font-size:24px;text-align:center;letter-spacing:2px;margin-bottom:4px;font-family:var(--font-display,Georgia,serif);text-transform:uppercase}
.relay-title.gold{color:var(--relay-gold);text-shadow:0 0 20px rgba(227,179,65,0.2)}
.relay-title.blue{color:var(--relay-blue);text-shadow:0 0 20px rgba(56,139,253,0.15)}
.relay-title.green{color:var(--relay-green);text-shadow:0 0 20px rgba(63,185,80,0.15)}
.relay-sub{font-size:11px;color:var(--relay-muted);text-align:center;margin-bottom:20px;font-style:italic}
.relay-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-left:4px solid rgba(255,255,255,0.1);padding:12px 14px;margin-bottom:10px;border-radius:2px 8px 8px 2px;display:flex;gap:10px;align-items:flex-start;animation:relay-in 0.3s ease-out;position:relative}
.relay-card.sabotage{border-left-color:var(--relay-red);background:rgba(248,81,73,0.04)}
.relay-card.victory{border-left-color:var(--relay-gold);background:rgba(227,179,65,0.04)}
.relay-card.comedy{border-left-color:#d29922;background:rgba(210,153,34,0.03)}
.relay-card.romance{border-left-color:#db7093;background:rgba(219,112,147,0.04)}
.relay-card.chris{border-left-color:#a371f7;background:rgba(163,113,247,0.03);border-left-style:dashed}
.relay-card.bench{border-left-color:var(--relay-muted);background:rgba(139,148,158,0.03)}
.relay-card.danger{border-left-color:#f0883e;background:rgba(240,136,62,0.03)}
.relay-card .card-portrait{flex-shrink:0;display:flex;gap:4px}
.relay-card .card-body{flex:1;min-width:0}
@keyframes relay-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.relay-badge{display:inline-block;font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:2px 7px;border-radius:3px;margin-bottom:6px}
.relay-badge.gold{background:rgba(227,179,65,0.15);color:var(--relay-gold)}
.relay-badge.red{background:rgba(248,81,73,0.12);color:var(--relay-red)}
.relay-badge.green{background:rgba(63,185,80,0.12);color:var(--relay-green)}
.relay-badge.blue{background:rgba(56,139,253,0.12);color:var(--relay-blue)}
.relay-badge.yellow{background:rgba(210,153,34,0.12);color:#d29922}
.relay-badge.grey{background:rgba(139,148,158,0.08);color:var(--relay-muted)}
.relay-badge.pink{background:rgba(219,112,147,0.12);color:#db7093}
.relay-badge.purple{background:rgba(163,113,247,0.12);color:#a371f7}
.relay-bench{display:flex;gap:12px;justify-content:center;margin:16px 0;flex-wrap:wrap}
.relay-bench-side{text-align:center;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;min-width:160px;flex:1;max-width:280px}
.relay-bench-label{font-size:10px;font-weight:700;letter-spacing:2px;color:var(--relay-gold);margin-bottom:8px}
.relay-bench-portraits{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}
.relay-vs{display:flex;justify-content:center;align-items:center;gap:24px;margin:20px 0}
.relay-vs-player{text-align:center}
.relay-vs-divider{font-size:20px;font-weight:900;color:var(--relay-gold);letter-spacing:2px;font-family:var(--font-display,Georgia,serif)}
.relay-score-bar{display:flex;align-items:center;gap:8px;margin:4px 0}
.relay-score-fill{height:6px;border-radius:3px;transition:width 0.5s}
.relay-score-track{flex:1;height:6px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden}
.relay-reveal-btn{display:inline-block;padding:8px 24px;background:rgba(227,179,65,0.12);color:var(--relay-gold);border:1px solid rgba(227,179,65,0.3);border-radius:6px;cursor:pointer;font-size:12px;letter-spacing:1px;transition:background 0.2s}
.relay-reveal-btn:hover{background:rgba(227,179,65,0.2)}
.relay-reveal-all{display:inline-block;padding:4px 14px;background:rgba(255,255,255,0.03);color:var(--relay-muted);border:1px solid rgba(255,255,255,0.06);border-radius:4px;cursor:pointer;font-size:10px;margin-top:6px;transition:color 0.2s}
.relay-reveal-all:hover{color:#c9d1d9}
.relay-sticky-btns{text-align:center;padding:16px 0 8px;position:relative;z-index:10}
.relay-winner-splash{text-align:center;padding:24px;background:linear-gradient(135deg,rgba(227,179,65,0.12) 0%,rgba(227,179,65,0.03) 100%);border:2px solid rgba(227,179,65,0.4);border-radius:16px;max-width:340px;margin:20px auto;box-shadow:0 0 40px rgba(227,179,65,0.08)}
.relay-winner-name{font-size:28px;font-weight:700;color:var(--relay-gold);margin-top:10px;font-family:var(--font-display,Georgia,serif);letter-spacing:2px}
.relay-confessional{border-left-color:#a371f7;background:rgba(163,113,247,0.04);font-style:italic}
.relay-flip{border-left-color:var(--relay-red);animation:relay-in 0.3s ease-out,relay-shake 0.4s 0.1s ease-out}
@keyframes relay-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
</style>`;

function _relayStyles() { return RELAY_STYLES; }

function _relayRevealFn(stateKey, idx, epNum) {
  return `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${idx};const ep=gs.episodeHistory.find(e=>e.num===${epNum});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;
}
function _relayRevealAllFn(stateKey, total, epNum) {
  return `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${total-1};const ep=gs.episodeHistory.find(e=>e.num===${epNum});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;
}
function _relayBtns(stateKey, nextIdx, total, epNum) {
  if (nextIdx >= total) return '';
  return `<div class="relay-sticky-btns">
    <div class="relay-reveal-btn" onclick="${_relayRevealFn(stateKey, nextIdx, epNum)}">Next ▸ <span style="font-size:9px;opacity:0.6;margin-left:4px">${nextIdx+1}/${total}</span></div>
    <div class="relay-reveal-all" onclick="${_relayRevealAllFn(stateKey, total, epNum)}" style="margin-top:6px">Show all ▸▸</div>
  </div>`;
}

function _relayCardClass(evt) {
  if (evt.type?.includes('sabotage') || evt.type?.includes('Sabotage') || evt.type === 'laxativeFires' || evt.type === 'laxativeMisfire' || evt.type === 'flagpoleSabotage') return 'sabotage';
  if (evt.type?.includes('Win') || evt.type === 'flagpoleWin' || evt.type === 'beamCross' || evt.type === 'relayWinner' || evt.type === 'finishLineLunge') return 'victory';
  if (evt.type === 'brownieTemptation' || evt.type === 'hatAssign' || evt.type === 'fanBackfire' || evt.type === 'falseFinish') return 'comedy';
  if (evt.type?.includes('showmance') || evt.type === 'boulderGesture') return 'romance';
  if (evt.type?.includes('chris') || evt.type === 'chrisCommentary' || evt.type === 'chrisIntro') return 'chris';
  if (evt.type?.includes('bench') || evt.type?.includes('Bench') || evt.type === 'crowdStorm') return 'bench';
  if (evt.type === 'beamFall' || evt.type === 'beamWobble' || evt.type === 'eagleAttack' || evt.type === 'eagleNest' || evt.type === 'sharkReaction') return 'danger';
  return '';
}

function _relayEventCard(evt, stateKey, i, epNum, revealed) {
  if (!revealed) return '';
  const cls = _relayCardClass(evt);
  const portraits = (evt.players || []).map(p => rpPortrait(p, 'sm')).join('');
  const badge = evt.badgeText ? `<div class="relay-badge ${evt.badgeClass || 'grey'}">${evt.badgeText}</div>` : '';
  return `<div class="relay-card ${cls}">
    ${portraits ? `<div class="card-portrait">${portraits}</div>` : ''}
    <div class="card-body">
      ${badge}
      <div style="font-size:12px;line-height:1.6">${evt.text}</div>
    </div>
  </div>`;
}

// Legacy exports for backward compat
export let _relayRevealed = {};
export function relayRevealNext() {}
export function relayRevealAll() {}

// ── Screen 1: Pre-Race Pitches + Confessionals ──
export function rpBuildRelayPitch(ep) {
  const rd = ep.relayData;
  const preRace = ep.relayPreRace;
  if (!rd || !preRace) return null;
  const finalists = ep.finaleFinalists || [];
  const epNum = ep.num;
  const bench = ep.benchAssignments || {};

  const stateKey = `relay_pitch_${epNum}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const items = [];

  // Chris intro event (if exists in timeline)
  const chrisIntro = rd.timeline?.find(e => e.type === 'chrisIntro');
  if (chrisIntro) items.push(chrisIntro);

  // Pitches as events
  if (preRace.pitches) {
    Object.entries(preRace.pitches).forEach(([f, p]) => {
      items.push({ type: 'pitch', player: f, players: [f], text: p.text, badgeText: p.type?.toUpperCase() || 'PITCH', badgeClass: 'gold' });
    });
  }

  // Bench flips
  (preRace.benchFlips || []).forEach(flip => {
    items.push({ type: 'benchFlip', player: flip.supporter, players: [flip.supporter, flip.from, flip.to],
      text: `${flip.supporter} stands up from ${flip.from}'s bench. Walks across. Sits down on ${flip.to}'s side. The crowd murmurs.`,
      badgeText: 'BENCH FLIP', badgeClass: 'red' });
  });

  // Confessionals
  (preRace.confessionals || []).forEach(conf => {
    items.push({ type: 'confessional', player: conf.player, players: conf.player === 'Chef' ? [] : [conf.player],
      text: conf.text, badgeText: conf.player === 'Chef' ? 'CHEF HATCHET' : 'CONFESSIONAL', badgeClass: 'purple' });
  });

  // Sabotage plants
  if (rd.plantedSabotage) {
    items.push({ type: 'sabotagePlant', player: rd.plantedSabotage.planter, players: [rd.plantedSabotage.planter],
      text: `${rd.plantedSabotage.planter} slips something onto ${rd.plantedSabotage.targetFinalist}'s side. A cupcake. With a note: "Congratulations!" It's not congratulations.`,
      badgeText: 'SABOTAGE PLANTED', badgeClass: 'red' });
  }
  if (rd.plantedSabotage2) {
    items.push({ type: 'sabotagePlant', player: rd.plantedSabotage2.planter, players: [rd.plantedSabotage2.planter],
      text: `${rd.plantedSabotage2.planter} sneaks up to the flagpole. A bucket of grease. Quick hands. Gone before anyone notices.`,
      badgeText: 'GREASE JOB', badgeClass: 'red' });
  }

  const revealed = items.map((evt, i) => _relayEventCard(evt, stateKey, i, epNum, i <= state.idx)).join('');
  const btns = _relayBtns(stateKey, state.idx + 1, items.length, epNum);

  // Bleacher display
  const benchHtml = finalists.map(f => {
    const members = bench[f] || [];
    return `<div class="relay-bench-side">
      <div class="relay-bench-label">TEAM ${f.toUpperCase()}</div>
      <div style="margin-bottom:6px">${rpPortrait(f, 'lg')}</div>
      <div style="font-size:11px;color:#c9d1d9;margin-bottom:6px">${f}</div>
      <div class="relay-bench-portraits">${members.map(s => rpPortrait(s, 'sm')).join('')}</div>
      <div style="font-size:10px;color:var(--relay-muted);margin-top:4px">${members.length} supporter${members.length !== 1 ? 's' : ''}</div>
    </div>`;
  }).join(`<div style="display:flex;align-items:center;font-size:18px;font-weight:900;color:var(--relay-gold);letter-spacing:2px">VS</div>`);

  return _relayStyles() + `<div class="rp-page relay-arena phase-pitch">
    <div class="relay-eyebrow">Episode ${epNum} — Finale</div>
    <div class="relay-title gold">The Rejected Olympic Relay</div>
    <div class="relay-sub">The eliminated campers pick sides. The finalists make their case. Then the race begins.</div>
    <div class="relay-bench">${benchHtml}</div>
    ${revealed}${btns}
  </div>`;
}

// ── Screen 2: Flagpole Phase ──
export function rpBuildRelayFlagpole(ep) {
  const rd = ep.relayData;
  const stages = ep.finaleChallengeStages;
  if (!rd || !stages?.length) return null;
  const flagStage = stages.find(s => s.phase === 0);
  if (!flagStage) return null;
  const finalists = ep.finaleFinalists || [];
  const epNum = ep.num;

  const stateKey = `relay_flag_${epNum}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const events = rd.timeline.filter(ev => ev.phase === 0);

  // VS header — show score bars only after all revealed
  const allRevealed = state.idx >= events.length - 1;
  const maxScore = Math.max(...Object.values(flagStage.scores), 1);
  const vsHtml = `<div class="relay-vs">
    ${finalists.map(f => {
      const score = flagStage.scores[f] || 0;
      const pct = Math.round((score / maxScore) * 100);
      const isWin = f === flagStage.winner;
      return `<div class="relay-vs-player">
        ${rpPortrait(f, 'lg')}
        <div style="font-size:13px;margin-top:6px;${isWin && allRevealed ? 'color:var(--relay-gold);font-weight:700' : ''}">${f}</div>
        ${allRevealed ? `<div class="relay-score-bar" style="width:120px;margin-top:4px">
          <div class="relay-score-track"><div class="relay-score-fill" style="width:${pct}%;background:${isWin ? 'var(--relay-gold)' : '#484f58'}"></div></div>
        </div>
        <div style="font-size:10px;color:${isWin ? 'var(--relay-gold)' : 'var(--relay-muted)'};margin-top:2px">${isWin ? 'FIRST TO THE FLAG' : ''}</div>` : ''}
      </div>`;
    }).join('<div class="relay-vs-divider">VS</div>')}
  </div>`;

  const revealed = events.map((evt, i) => _relayEventCard(evt, stateKey, i, epNum, i <= state.idx)).join('');
  const btns = _relayBtns(stateKey, state.idx + 1, events.length, epNum);

  return _relayStyles() + `<div class="rp-page relay-arena phase-flagpole">
    <div class="relay-eyebrow">Episode ${epNum} — Phase 1</div>
    <div class="relay-title blue">The Flagpole</div>
    <div class="relay-sub">${flagStage.desc}</div>
    ${vsHtml}
    ${revealed}${btns}
  </div>`;
}

// ── Screen 3: Balance Beam (The Gorge) ──
export function rpBuildRelayBeam(ep) {
  const rd = ep.relayData;
  const stages = ep.finaleChallengeStages;
  if (!rd || !stages?.length) return null;
  const beamStage = stages.find(s => s.phase === 1);
  if (!beamStage) return null;
  const finalists = ep.finaleFinalists || [];
  const epNum = ep.num;

  const stateKey = `relay_beam_${epNum}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const events = rd.timeline.filter(ev => ev.phase === 1);
  const allRevealed = state.idx >= events.length - 1;
  const maxScore = Math.max(...Object.values(beamStage.scores), 1);

  // Gorge scene — shark silhouettes as atmosphere
  const gorgeScene = `<div style="position:relative;text-align:center;margin:12px 0;padding:16px 0">
    <div style="height:4px;background:linear-gradient(90deg,transparent 0%,rgba(56,139,253,0.3) 20%,rgba(56,139,253,0.3) 80%,transparent 100%);margin:0 40px;border-radius:2px"></div>
    <div style="font-size:9px;letter-spacing:3px;color:rgba(56,139,253,0.3);margin-top:4px">BALANCE BEAM — 300 METERS</div>
    <div style="margin-top:8px;font-size:20px;letter-spacing:12px;opacity:0.15;filter:blur(0.5px)">🦈 🦈 🦈</div>
  </div>`;

  const vsHtml = `<div class="relay-vs">
    ${finalists.map(f => {
      const score = beamStage.scores[f] || 0;
      const pct = Math.round((score / maxScore) * 100);
      const isWin = f === beamStage.winner;
      return `<div class="relay-vs-player">
        ${rpPortrait(f, 'lg')}
        <div style="font-size:13px;margin-top:6px;${isWin && allRevealed ? 'color:var(--relay-blue);font-weight:700' : ''}">${f}</div>
        ${allRevealed ? `<div class="relay-score-bar" style="width:120px;margin-top:4px">
          <div class="relay-score-track"><div class="relay-score-fill" style="width:${pct}%;background:${isWin ? 'var(--relay-blue)' : '#484f58'}"></div></div>
        </div>
        <div style="font-size:10px;color:${isWin ? 'var(--relay-blue)' : 'var(--relay-muted)'};margin-top:2px">${isWin ? 'CROSSED FIRST' : ''}</div>` : ''}
      </div>`;
    }).join('<div class="relay-vs-divider">VS</div>')}
  </div>`;

  const revealed = events.map((evt, i) => _relayEventCard(evt, stateKey, i, epNum, i <= state.idx)).join('');
  const btns = _relayBtns(stateKey, state.idx + 1, events.length, epNum);

  return _relayStyles() + `<div class="rp-page relay-arena phase-beam">
    <div class="relay-eyebrow">Episode ${epNum} — Phase 2</div>
    <div class="relay-title blue">The Gorge</div>
    <div class="relay-sub">${beamStage.desc}</div>
    ${gorgeScene}
    ${vsHtml}
    ${revealed}${btns}
  </div>`;
}

// ── Screen 4: The Sprint ──
export function rpBuildRelaySprint(ep) {
  const rd = ep.relayData;
  const stages = ep.finaleChallengeStages;
  if (!rd || !stages?.length) return null;
  const sprintStage = stages.find(s => s.phase === 2);
  if (!sprintStage) return null;
  const finalists = ep.finaleFinalists || [];
  const epNum = ep.num;

  const stateKey = `relay_sprint_${epNum}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Sprint gets ALL remaining timeline events (phase 2 + finish events like relayWinner, winnerReaction, etc.)
  const events = rd.timeline.filter(ev => ev.phase === 2);
  const allRevealed = state.idx >= events.length - 1;

  // Race progress bar — shows relative position, no raw numbers
  const totalScores = ep.finaleChallengeScores || {};
  const maxTotal = Math.max(...Object.values(totalScores), 1);
  const raceBar = `<div style="position:relative;margin:16px 0;padding:0 20px">
    <div style="height:3px;background:rgba(63,185,80,0.15);border-radius:2px;position:relative">
      <div style="position:absolute;right:0;top:-8px;font-size:10px;color:var(--relay-muted)">FINISH</div>
    </div>
    ${finalists.map((f, fi) => {
      const pct = allRevealed ? Math.min(98, Math.round((totalScores[f] / maxTotal) * 95)) : 30 + fi * 5;
      const color = fi === 0 ? 'var(--relay-gold)' : 'var(--relay-blue)';
      return `<div style="display:flex;align-items:center;gap:6px;margin-top:8px">
        <div style="width:60px;font-size:10px;color:${color};font-weight:700">${f}</div>
        <div style="flex:1;height:8px;background:rgba(255,255,255,0.04);border-radius:4px;overflow:hidden;position:relative">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 0.5s"></div>
        </div>
      </div>`;
    }).join('')}
  </div>`;

  const revealed = events.map((evt, i) => _relayEventCard(evt, stateKey, i, epNum, i <= state.idx)).join('');
  const btns = _relayBtns(stateKey, state.idx + 1, events.length, epNum);

  return _relayStyles() + `<div class="rp-page relay-arena phase-sprint">
    <div class="relay-eyebrow">Episode ${epNum} — Phase 3</div>
    <div class="relay-title green">The Sprint</div>
    <div class="relay-sub">${sprintStage.desc}</div>
    ${raceBar}
    ${revealed}${btns}
  </div>`;
}

// ── Screen 5: The Finish Line ──
export function rpBuildRelayFinish(ep) {
  const rd = ep.relayData;
  if (!rd) return null;
  const winner = ep.finaleChallengeWinner || ep.winner;
  const loser = (ep.finaleFinalists || []).find(f => f !== winner) || '';
  const finalists = ep.finaleFinalists || [];
  const totalScores = ep.finaleChallengeScores || {};
  const sabotageEvents = ep.finaleSabotageEvents || [];
  const epNum = ep.num;
  const bench = ep.benchAssignments || {};

  const stateKey = `relay_finish_${epNum}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Build finish beats for click-to-reveal
  const beats = [];

  // Beat 0: The finish line moment
  const finishEvt = rd.timeline.find(ev => ev.type === 'finishLineLunge' || ev.type === 'relayWinner');
  if (finishEvt) beats.push(finishEvt);

  // Beat 1: Winner reaction
  const winReact = rd.timeline.find(ev => ev.type === 'winnerReaction');
  if (winReact) beats.push(winReact);

  // Beat 2: Loser reaction
  const loseReact = rd.timeline.find(ev => ev.type === 'loserReaction');
  if (loseReact) beats.push(loseReact);

  // Beat 3: Crowd storm
  const crowd = rd.timeline.filter(ev => ev.type === 'crowdStorm');
  crowd.forEach(c => beats.push(c));

  // Beat 4: Winner splash (synthetic)
  beats.push({ type: '_winnerSplash', player: winner, players: [winner], text: '', badgeText: 'WINNER', badgeClass: 'gold' });

  // Beat 5: Sabotage recap (if any)
  if (sabotageEvents.length > 0) {
    beats.push({ type: '_sabotageRecap', players: sabotageEvents.map(s => s.planter), text: '', badgeText: 'SABOTAGE REPORT', badgeClass: 'red' });
  }

  let beatHtml = '';
  beats.forEach((beat, i) => {
    if (i > state.idx) return;

    if (beat.type === '_winnerSplash') {
      const maxTotal = Math.max(...Object.values(totalScores), 1);
      const sorted = Object.entries(totalScores).sort(([,a],[,b]) => b - a);
      beatHtml += `<div style="animation:relay-in 0.4s ease-out">
        <div class="relay-winner-splash">
          ${rpPortrait(winner, 'xl')}
          <div class="relay-winner-name">${winner}</div>
          <div style="font-size:12px;color:var(--relay-muted);margin-top:4px">wins the Rejected Olympic Relay</div>
        </div>
        <div style="max-width:360px;margin:16px auto">
          ${sorted.map(([name, score]) => {
            const pct = Math.round((score / maxTotal) * 100);
            const isW = name === winner;
            return `<div style="display:flex;align-items:center;gap:8px;margin:6px 0">
              ${rpPortrait(name, 'sm')}
              <div style="flex:1">
                <div style="font-size:11px;${isW ? 'color:var(--relay-gold);font-weight:700' : ''}">${name}</div>
                <div class="relay-score-bar"><div class="relay-score-track"><div class="relay-score-fill" style="width:${pct}%;background:${isW ? 'var(--relay-gold)' : '#484f58'}"></div></div></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    } else if (beat.type === '_sabotageRecap') {
      beatHtml += `<div style="max-width:400px;margin:16px auto;padding:12px;background:rgba(248,81,73,0.04);border:1px solid rgba(248,81,73,0.15);border-radius:8px;animation:relay-in 0.3s ease-out">
        <div class="relay-badge red" style="margin-bottom:8px">SABOTAGE REPORT</div>
        ${sabotageEvents.map(sab => `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
          ${rpPortrait(sab.planter, 'sm')}
          <div style="font-size:12px">${sab.planter} used <strong>${sab.type}</strong> on ${sab.target} (Phase ${sab.phase + 1})</div>
        </div>`).join('')}
      </div>`;
    } else {
      beatHtml += _relayEventCard(beat, stateKey, i, epNum, true);
    }
  });

  const btns = _relayBtns(stateKey, state.idx + 1, beats.length, epNum);

  // Winner's bench celebration header
  const winBench = bench[winner] || [];
  const loseBench = bench[loser] || [];
  const benchHeader = state.idx >= 0 ? `<div style="display:flex;justify-content:center;gap:20px;margin:16px 0;flex-wrap:wrap">
    <div style="text-align:center">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--relay-gold);margin-bottom:6px">WINNER'S BENCH</div>
      <div style="display:flex;gap:3px;justify-content:center;flex-wrap:wrap">${winBench.map(s => rpPortrait(s, 'sm')).join('')}</div>
    </div>
    <div style="text-align:center;opacity:0.5">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--relay-muted);margin-bottom:6px">CONSOLATION</div>
      <div style="display:flex;gap:3px;justify-content:center;flex-wrap:wrap">${loseBench.map(s => rpPortrait(s, 'sm')).join('')}</div>
    </div>
  </div>` : '';

  return _relayStyles() + `<div class="rp-page relay-arena phase-finish">
    <div class="relay-eyebrow">Episode ${epNum} — Finale</div>
    <div class="relay-title gold">The Finish Line</div>
    <div class="relay-sub">One winner. One check. It all ends here.</div>
    ${benchHeader}
    ${beatHtml}${btns}
  </div>`;
}

export function rpBuildReunion(ep) {
  const epNum = ep.num;
  const winner = ep.winner;
  const finalists = ep.finaleFinalists || [];
  const allPlayers = players.map(p => p.name);
  const history = gs.episodeHistory || [];
  _reunionRevealed[epNum + '_reunion'] = 0;

  let html = `<div class="rp-page" style="background:linear-gradient(180deg,#0d1117 0%,#161b22 100%)">
    <div class="rp-eyebrow">Season Finale</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:3px;text-align:center;margin-bottom:6px;text-transform:uppercase">Reunion Show</div>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:16px">The season in review</div>
    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:20px">
      <button class="tv-reveal-btn" id="reunion-btn-${epNum}" onclick="reunionRevealNext(${epNum})">Next (0/6)</button>
      <button onclick="reunionRevealAll(${epNum})" style="background:none;border:1px solid var(--border);border-radius:6px;padding:6px 14px;font-size:11px;color:var(--muted);cursor:pointer">Skip to results</button>
    </div>
    <div id="reunion-${epNum}">`;

  // ═══ SECTION 1: SEASON IN NUMBERS ═══
  const totalVotesCast = history.reduce((s, e) => s + ((e.votingLog||[]).filter(v => v.voter !== 'THE GAME').length), 0);
  const totalIdols = history.reduce((s, e) => s + ((e.idolPlays||[]).length), 0);
  const totalBlindsides = history.filter(e => {
    const elim = e.eliminated;
    if (!elim) return false;
    return (e.votingLog||[]).some(v => v.voter === elim && v.voted !== elim);
  }).length;
  const totalTies = history.filter(e => e.isTie).length;

  html += `<div class="reunion-section" style="display:none;margin-bottom:20px">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:10px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">Season in Numbers</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
      ${[
        { label: 'Episodes', val: history.length },
        { label: 'Votes Cast', val: totalVotesCast },
        { label: 'Idol Plays', val: totalIdols },
        { label: 'Blindsides', val: totalBlindsides },
        { label: 'Tied Votes', val: totalTies },
        { label: 'Players', val: allPlayers.length },
      ].map(s => `<div style="text-align:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 16px;min-width:80px">
        <div style="font-family:var(--font-display);font-size:20px;color:var(--accent-gold)">${s.val}</div>
        <div style="font-size:9px;color:var(--muted);letter-spacing:0.5px">${s.label}</div>
      </div>`).join('')}
    </div>
  </div>`;

  // ═══ SECTION 2: THE SEASON STORY ═══
  const storyMoments = [];
  // Biggest blindside: high-strategic player eliminated earliest
  const blindsideEps = history.filter(e => e.eliminated && (e.votingLog||[]).some(v => v.voter === e.eliminated && v.voted !== e.eliminated));
  if (blindsideEps.length) {
    const best = blindsideEps.sort((a,b) => pStats(a.eliminated).strategic - pStats(b.eliminated).strategic).slice(-1)[0];
    storyMoments.push({ ep: best.num, players: [best.eliminated], text: `Episode ${best.num}: ${best.eliminated} blindsided. ${best.eliminated} voted for someone else \u2014 never saw it coming.` });
  }
  // Closest vote
  const closeVotes = history.filter(e => e.votes && Object.keys(e.votes).length >= 2).map(e => {
    const sorted = Object.entries(e.votes).sort(([,a],[,b]) => b-a);
    return { ep: e.num, margin: (sorted[0]?.[1]||0) - (sorted[1]?.[1]||0), elim: e.eliminated };
  }).filter(v => v.margin <= 1 && v.elim);
  if (closeVotes.length) {
    const closest = closeVotes[0];
    storyMoments.push({ ep: closest.ep, players: [closest.elim], text: `Episode ${closest.ep}: ${closest.elim} eliminated by a single vote. The margin couldn't have been thinner.` });
  }
  // Biggest idol play
  const idolEps = history.filter(e => (e.idolPlays||[]).some(p => p.votesNegated > 0));
  if (idolEps.length) {
    const best = idolEps.sort((a,b) => Math.max(...(b.idolPlays||[]).map(p=>p.votesNegated||0)) - Math.max(...(a.idolPlays||[]).map(p=>p.votesNegated||0)))[0];
    const play = (best.idolPlays||[]).sort((a,b)=>(b.votesNegated||0)-(a.votesNegated||0))[0];
    storyMoments.push({ ep: best.num, players: [play.player], text: `Episode ${best.num}: ${play.player} plays an idol, negating ${play.votesNegated} vote${play.votesNegated!==1?'s':''}. The biggest idol play of the season.` });
  }

  html += `<div class="reunion-section" style="display:none;margin-bottom:20px">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:10px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">The Season Story</div>
    ${storyMoments.length ? storyMoments.map(m => `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px">
      ${m.players.map(p => rpPortrait(p, 'sm')).join('')}
      <div style="font-size:12px;color:#c9d1d9;line-height:1.5">${m.text}</div>
    </div>`).join('') : '<div style="font-size:12px;color:#484f58">A season without standout moments? Unlikely. But here we are.</div>'}
  </div>`;

  // ═══ SECTION 3: AWARDS ═══
  const awards = [];

  // Best Strategic — full ranking
  const stratRank = allPlayers.map(n => {
    const s = pStats(n);
    const placement = history.findIndex(e => e.eliminated === n || e.firstEliminated === n);
    const survivalBonus = placement === -1 ? allPlayers.length : (allPlayers.length - placement);
    const advCount = history.reduce((sum, e) => sum + ((e.idolPlays||[]).filter(p => p.player === n).length), 0);
    return { name: n, score: s.strategic * 2 + survivalBonus * 0.5 + advCount * 1.5 };
  }).sort((a,b) => b.score - a.score);
  awards.push({ label: 'Best Strategic', icon: '\ud83e\udde0', winner: stratRank[0].name, detail: `Full ranking: ${stratRank.slice(0,5).map((r,i) => `${i+1}. ${r.name}`).join(', ')}${stratRank.length > 5 ? `, ... (${stratRank.length} total)` : ''}` });

  // Best Physical
  const physRank = allPlayers.map(n => ({ name: n, wins: gs.chalRecord?.[n]?.wins || 0 })).sort((a,b) => b.wins - a.wins);
  if (physRank[0]?.wins > 0)
    awards.push({ label: 'Best Physical', icon: '\ud83d\udcaa', winner: physRank[0].name, detail: `${physRank[0].wins} challenge wins. ${physRank.filter(p=>p.wins>0).slice(0,4).map(p=>`${p.name} (${p.wins})`).join(', ')}` });

  // Best Social
  const socialRank = allPlayers.map(n => {
    const elimEp = history.find(e => e.eliminated === n || e.firstEliminated === n);
    const snap = elimEp?.gsSnapshot;
    const others = snap?.activePlayers || allPlayers.filter(p => p !== n);
    const avgBond = others.length ? others.reduce((s, p) => s + getBond(n, p), 0) / others.length : 0;
    return { name: n, avgBond };
  }).sort((a,b) => b.avgBond - a.avgBond);
  awards.push({ label: 'Best Social', icon: '\u2764\ufe0f', winner: socialRank[0].name, detail: `Highest average bond: ${socialRank[0].avgBond.toFixed(1)}` });

  // Biggest Villain
  const villainRank = allPlayers.map(n => {
    const s = pStats(n);
    const avgBond = allPlayers.filter(p=>p!==n).reduce((sum,p) => sum + getBond(n,p), 0) / Math.max(1, allPlayers.length-1);
    return { name: n, score: -avgBond + s.boldness * 0.2 };
  }).sort((a,b) => b.score - a.score);
  awards.push({ label: 'Biggest Villain', icon: '\ud83d\ude08', winner: villainRank[0].name, detail: `Lowest average bond + boldness` });

  // Most Chaotic
  const chaosRank = allPlayers.map(n => {
    const s = pStats(n);
    return { name: n, score: s.boldness + s.temperament <= 3 ? 3 : 0 };
  }).sort((a,b) => b.score - a.score);
  awards.push({ label: 'Most Chaotic', icon: '\ud83c\udf2a\ufe0f', winner: chaosRank[0].name, detail: `Boldness: ${pStats(chaosRank[0].name).boldness}` });

  // Fan Favorite
  if (seasonConfig.popularityEnabled !== false && gs.popularity) {
    const fanRank = allPlayers.map(n => ({ name: n, pop: gs.popularity[n] || 0 })).sort((a,b) => b.pop - a.pop);
    if (fanRank[0]?.pop > 0)
      awards.push({ label: 'Fan Favorite', icon: '\u2b50', winner: fanRank[0].name, detail: `Popularity: ${fanRank[0].pop}` });
  }

  // Best Duo
  let bestDuo = null, bestDuoBond = -Infinity;
  for (let i = 0; i < allPlayers.length; i++) {
    for (let j = i+1; j < allPlayers.length; j++) {
      const b = getBond(allPlayers[i], allPlayers[j]);
      if (b > bestDuoBond) { bestDuoBond = b; bestDuo = [allPlayers[i], allPlayers[j]]; }
    }
  }
  if (bestDuo && bestDuoBond > 0)
    awards.push({ label: 'Best Duo', icon: '\ud83e\udd1d', winner: bestDuo.join(' & '), detail: `Bond: ${bestDuoBond.toFixed(1)}`, players: bestDuo });

  html += `<div class="reunion-section" style="display:none;margin-bottom:20px">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:10px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">Awards Ceremony</div>
    ${awards.map(aw => {
      const pls = aw.players || [aw.winner];
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px;background:rgba(227,179,65,0.04);border:1px solid rgba(227,179,65,0.12);border-radius:8px">
        <div style="font-size:24px">${aw.icon}</div>
        ${pls.map(p => rpPortrait(p, 'sm')).join('')}
        <div style="flex:1">
          <div style="font-size:12px;font-weight:700;color:var(--accent-gold)">${aw.label}</div>
          <div style="font-size:13px;color:#c9d1d9">${aw.winner}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">${aw.detail}</div>
        </div>
      </div>`;
    }).join('')}
  </div>`;

  // ═══ SECTION 4: DRAMA HIGHLIGHTS ═══
  const dramas = [];
  history.forEach(e => {
    if (e.tribalBlowup) dramas.push({ ep: e.num, text: `Episode ${e.num}: Tribal blowup \u2014 ${e.tribalBlowup.player} lost it at tribal council.`, player: e.tribalBlowup.player });
    (e.socialBombs||[]).forEach(sb => dramas.push({ ep: e.num, text: `Episode ${e.num}: ${sb.player} dropped a social bomb at camp. Bridges burned.`, player: sb.player }));
    (e.idolMisplays||[]).forEach(im => dramas.push({ ep: e.num, text: `Episode ${e.num}: ${im.player} misplayed an idol. Wasted protection.`, player: im.player }));
  });

  html += `<div class="reunion-section" style="display:none;margin-bottom:20px">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:10px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">Drama Highlights</div>
    ${dramas.length ? dramas.slice(0,6).map(d => `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;padding:6px;background:rgba(248,81,73,0.03);border-radius:6px">
      ${d.player ? rpPortrait(d.player, 'sm') : ''}
      <div style="font-size:12px;color:#c9d1d9">${d.text}</div>
    </div>`).join('') : '<div style="font-size:12px;color:#484f58">A clean season. No drama. (Somehow.)</div>'}
  </div>`;

  // ═══ SECTION 5: SUPERLATIVES ═══
  const superlatives = [];
  // Most likely to return
  const returnRank = allPlayers.filter(n => n !== winner).map(n => {
    const s = pStats(n);
    return { name: n, score: s.strategic + s.social + s.boldness };
  }).sort((a,b) => b.score - a.score);
  if (returnRank.length) superlatives.push({ label: 'Most Likely to Return', name: returnRank[0].name });

  // Most robbed
  const robbedRank = allPlayers.filter(n => n !== winner).map(n => {
    const elimEp = history.find(e => e.eliminated === n);
    const ts = threatScore(n);
    return { name: n, score: ts, elimEp: elimEp?.num || 999 };
  }).sort((a,b) => b.score - a.score);
  if (robbedRank.length) superlatives.push({ label: 'Most Robbed', name: robbedRank[0].name });

  // Quietest game
  const quietRank = allPlayers.map(n => {
    const totalVotes = history.reduce((s,e) => s + ((e.votingLog||[]).filter(v=>v.voted===n&&v.voter!=='THE GAME').length), 0);
    return { name: n, score: totalVotes };
  }).sort((a,b) => a.score - b.score);
  if (quietRank.length) superlatives.push({ label: 'Quietest Game', name: quietRank[0].name });

  html += `<div class="reunion-section" style="display:none;margin-bottom:20px">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:10px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">Superlatives</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${superlatives.map(s => `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;flex:1;min-width:200px">
        ${rpPortrait(s.name, 'sm')}
        <div>
          <div style="font-size:9px;color:var(--muted);letter-spacing:0.5px">${s.label}</div>
          <div style="font-size:13px;color:#c9d1d9">${s.name}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>`;

  // ═══ SECTION 6: FINAL STANDINGS ═══
  const placements = [];
  if (winner) placements.push({ name: winner, place: 1, note: 'Winner' });
  finalists.filter(f => f !== winner).forEach((f, i) => {
    const votes = ep.juryResult?.votes?.[f] || 0;
    placements.push({ name: f, place: 2 + i, note: votes ? `${votes} jury vote${votes !== 1 ? 's' : ''}` : 'Finalist' });
  });
  // Add eliminated players in reverse order
  [...history].reverse().forEach(e => {
    if (e.eliminated && !placements.some(p => p.name === e.eliminated)) {
      placements.push({ name: e.eliminated, place: placements.length + 1, note: `Ep ${e.num}` });
    }
    if (e.firstEliminated && !placements.some(p => p.name === e.firstEliminated)) {
      placements.push({ name: e.firstEliminated, place: placements.length + 1, note: `Ep ${e.num}` });
    }
  });

  html += `<div class="reunion-section" style="display:none;margin-bottom:20px">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:10px;border-bottom:1px solid rgba(227,179,65,0.15);padding-bottom:6px">Final Standings</div>
    ${placements.map(p => {
      const isWin = p.place === 1;
      return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;padding:6px;${isWin ? 'background:rgba(227,179,65,0.06);border-radius:6px' : ''}">
        <span style="font-family:var(--font-mono);font-size:11px;color:${isWin ? 'var(--accent-gold)' : 'var(--muted)'};width:20px">${p.place}</span>
        ${rpPortrait(p.name)}
        <div style="flex:1;font-size:12px;${isWin ? 'color:var(--accent-gold);font-weight:600' : 'color:#c9d1d9'}">${p.name}</div>
        <div style="font-size:10px;color:var(--muted)">${p.note}</div>
      </div>`;
    }).join('')}
  </div>`;

  html += `</div></div>`;
  return html;
}

// ── Season Statistics: full stats page + Copy JSON ──
export function rpBuildSeasonStats(ep) {
  const epNum = ep.num;
  const winner = ep.winner;
  const finalists = ep.finaleFinalists || [];
  const allPlayers = players.map(p => p.name);
  const history = gs.episodeHistory || [];
  const jury = gs.jury || [];
  const juryResult = ep.juryResult;

  let html = `<div class="rp-page" style="background:#0d1117">
    <div class="rp-eyebrow">Season Statistics</div>
    <div style="font-family:var(--font-display);font-size:24px;letter-spacing:2px;text-align:center;margin-bottom:16px;text-transform:uppercase">${seasonConfig.name || 'Season'} \u2014 Statistics</div>`;

  // ═══ 1. SEASON METADATA ═══
  const voteStr = juryResult ? Object.entries(juryResult.votes).sort(([,a],[,b]) => b-a).map(([,v]) => v).join('-') : 'N/A';
  const fanFav = ep.fanFavorite || gs.fanFavorite || null;
  html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;justify-content:center">
    ${[
      { l: 'Winner', v: winner || '?' },
      { l: 'Final Vote', v: juryResult ? voteStr : 'Challenge' },
      { l: 'Fan Favorite', v: fanFav || 'N/A' },
      { l: 'Cast Size', v: allPlayers.length },
      { l: 'Episodes', v: history.length },
      { l: 'Jury Size', v: jury.length },
    ].map(m => `<div style="text-align:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px 14px;min-width:70px">
      <div style="font-size:14px;color:var(--accent-gold);font-family:var(--font-display)">${m.v}</div>
      <div style="font-size:9px;color:var(--muted)">${m.l}</div>
    </div>`).join('')}
  </div>`;

  // ═══ 2. PLACEMENT TABLE ═══
  const placements = [];
  if (winner) placements.push(winner);
  finalists.filter(f => f !== winner).forEach(f => placements.push(f));
  [...history].reverse().forEach(e => {
    if (e.eliminated && !placements.includes(e.eliminated)) placements.push(e.eliminated);
    if (e.firstEliminated && !placements.includes(e.firstEliminated)) placements.push(e.firstEliminated);
  });
  // Add anyone still missing
  allPlayers.forEach(n => { if (!placements.includes(n)) placements.push(n); });

  html += `<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:8px">Placements</div>`;
  html += `<div style="margin-bottom:20px">`;
  placements.forEach((name, idx) => {
    const place = idx + 1;
    const isWinner = name === winner;
    const isFinalist = finalists.includes(name);
    const isJuror = jury.includes(name);
    const phase = isWinner ? 'Winner' : isFinalist ? 'Finalist' : isJuror ? 'Juror' : 'Pre-Juror';
    const elimEp = history.find(e => e.eliminated === name || e.firstEliminated === name);
    const votesAtElim = elimEp ? Object.entries(elimEp.votes || {}).filter(([n]) => n === name).map(([,v]) => v)[0] : null;
    const totalVotesAgainst = history.reduce((s,e) => s + ((e.votingLog||[]).filter(v=>v.voted===name&&v.voter!=='THE GAME').length), 0);

    let note = '';
    if (isWinner && juryResult) note = `${voteStr} jury vote`;
    else if (isWinner) note = 'Final Challenge Winner';
    else if (isFinalist) note = `${juryResult?.votes?.[name] || 0} jury votes`;
    else if (elimEp) note = `Ep ${elimEp.num}`;

    html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;${isWinner ? 'background:rgba(227,179,65,0.06);border-radius:4px' : ''};${idx % 2 === 0 ? '' : 'background:rgba(255,255,255,0.015);border-radius:4px'}">
      <span style="font-family:var(--font-mono);font-size:11px;color:${isWinner?'var(--accent-gold)':'var(--muted)'};width:22px;text-align:right">${place}</span>
      ${rpPortrait(name)}
      <div style="flex:1;font-size:12px;${isWinner?'color:var(--accent-gold);font-weight:600':'color:#c9d1d9'}">${name}</div>
      <div style="font-size:10px;color:${phase==='Winner'?'var(--accent-gold)':phase==='Finalist'?'#3fb950':phase==='Juror'?'#58a6ff':'var(--muted)'};min-width:55px">${phase}</div>
      <div style="font-size:10px;color:var(--muted);min-width:60px;text-align:right">${note}</div>
    </div>`;
  });
  html += `</div>`;

  // ═══ 3. CHALLENGE PERFORMANCE ═══
  const chalData = allPlayers.map(n => ({
    name: n,
    immunity: history.filter(e => e.immunityWinner === n && !e.isFinale).length,
    total: gs.chalRecord?.[n]?.wins || 0,
  })).filter(c => c.total > 0 || c.immunity > 0).sort((a,b) => b.total - a.total || b.immunity - a.immunity);

  if (chalData.length) {
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:8px">Challenge Performance</div>`;
    html += `<div style="margin-bottom:20px">`;
    chalData.forEach(c => {
      html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        ${rpPortrait(c.name)}
        <div style="flex:1;font-size:12px;color:#c9d1d9">${c.name}</div>
        <div style="font-size:10px;color:var(--muted)">${c.immunity} immunity \u00b7 ${c.total} total</div>
      </div>`;
    });
    html += `</div>`;
  }

  // ═══ 4. VOTES RECEIVED ═══
  const votesReceived = allPlayers.map(n => ({
    name: n,
    votes: history.reduce((s,e) => s + ((e.votingLog||[]).filter(v=>v.voted===n&&v.voter!=='THE GAME').length), 0),
  })).sort((a,b) => b.votes - a.votes);

  html += `<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:8px">Votes Received Against</div>`;
  html += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:20px">`;
  votesReceived.forEach(v => {
    const pct = v.votes > 0 ? Math.round((v.votes / Math.max(...votesReceived.map(x=>x.votes), 1)) * 100) : 0;
    html += `<div style="display:flex;align-items:center;gap:6px;width:calc(50% - 4px);padding:3px 6px;font-size:11px">
      ${rpPortrait(v.name)}
      <div style="flex:1;color:#c9d1d9">${v.name}</div>
      <div style="width:50px;height:4px;background:var(--surface2);border-radius:2px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--accent-fire);border-radius:2px"></div></div>
      <div style="color:var(--muted);min-width:16px;text-align:right">${v.votes}</div>
    </div>`;
  });
  html += `</div>`;

  // ═══ 5. ADVANTAGES & IDOLS ═══
  const idolFinds = history.flatMap(e => (e.idolFinds || []).map(f => ({ ep: e.num, ...f })));
  const idolPlays = history.flatMap(e => (e.idolPlays || []).map(p => ({ ep: e.num, ...p })));
  if (idolFinds.length || idolPlays.length) {
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:8px">Advantages & Idols</div>`;
    html += `<div style="margin-bottom:20px">`;
    if (idolFinds.length) {
      html += `<div style="font-size:10px;color:var(--muted);margin-bottom:4px">Found:</div>`;
      idolFinds.forEach(f => {
        html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:11px">
          ${rpPortrait(f.finder)} <span style="color:#c9d1d9">${f.finder}</span> <span style="color:var(--muted)">\u00b7 Ep ${f.ep}</span>
        </div>`;
      });
    }
    if (idolPlays.length) {
      html += `<div style="font-size:10px;color:var(--muted);margin:6px 0 4px">Played:</div>`;
      idolPlays.forEach(p => {
        html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:11px">
          ${rpPortrait(p.player)} <span style="color:#c9d1d9">${p.player}${p.playedFor ? ` for ${p.playedFor}` : ''}</span>
          <span style="color:var(--muted)">\u00b7 Ep ${p.ep}${p.votesNegated ? ` \u00b7 ${p.votesNegated} negated` : ''}</span>
        </div>`;
      });
    }
    html += `</div>`;
  }

  // ═══ 6. STRATEGIC RANKINGS ═══
  const stratRank = allPlayers.map(n => {
    const s = pStats(n);
    const placementIdx = placements.indexOf(n);
    const survivalBonus = allPlayers.length - placementIdx;
    const advCount = history.reduce((sum, e) => sum + ((e.idolPlays||[]).filter(p => p.player === n).length), 0);
    return { name: n, score: s.strategic * 2 + survivalBonus * 0.5 + advCount * 1.5 };
  }).sort((a,b) => b.score - a.score);

  html += `<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:8px">Strategic Rankings (Full)</div>`;
  html += `<div style="margin-bottom:20px">`;
  stratRank.forEach((r, i) => {
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;padding:3px 6px">
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--muted);width:18px">${i+1}</span>
      ${rpPortrait(r.name)}
      <div style="flex:1;font-size:11px;color:#c9d1d9">${r.name}</div>
      <div style="font-size:10px;color:var(--muted)">${r.score.toFixed(1)}</div>
    </div>`;
  });
  html += `</div>`;

  // ═══ 7. COPY JSON BUTTON ═══
  html += `<div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
    <button onclick="copySeasonJSON()" style="padding:10px 24px;background:var(--accent-gold);border:none;border-radius:8px;color:#0d1117;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer;font-weight:700">Copy Season JSON</button>
    <div id="json-copy-status" style="font-size:11px;color:var(--muted);margin-top:6px"></div>
  </div>`;

  html += `</div>`;
  return html;
}

// Generate and copy season JSON to clipboard
export function copySeasonJSON() {
  const history = gs.episodeHistory || [];
  const allPlayers = players.map(p => p.name);
  const winner = gs.finaleResult?.winner;
  const finaleEp = history.find(e => e.isFinale);
  const juryResult = finaleEp?.juryResult;
  const finalists = finaleEp?.finaleFinalists || [];
  const jury = gs.jury || [];

  // Build placement order
  const placementOrder = [];
  if (winner) placementOrder.push(winner);
  finalists.filter(f => f !== winner).forEach(f => placementOrder.push(f));
  [...history].reverse().forEach(e => {
    if (e.eliminated && !placementOrder.includes(e.eliminated)) placementOrder.push(e.eliminated);
    if (e.firstEliminated && !placementOrder.includes(e.firstEliminated)) placementOrder.push(e.firstEliminated);
  });
  allPlayers.forEach(n => { if (!placementOrder.includes(n)) placementOrder.push(n); });

  const voteStr = juryResult ? Object.entries(juryResult.votes).sort(([,a],[,b]) => b-a).map(([,v]) => v).join('-') : 'Challenge';

  const json = {
    seasonNumber: 0,
    title: seasonConfig.name || 'Untitled Season',
    subtitle: '',
    castSize: allPlayers.length,
    episodeCount: history.length,
    jurySize: jury.length,
    winner: {
      name: winner,
      playerSlug: players.find(p => p.name === winner)?.slug || winner?.toLowerCase().replace(/\s+/g, '-'),
      vote: voteStr,
      runnerUp: finalists.filter(f => f !== winner).join(' & '),
      keyStats: '',
      strategy: '',
      legacy: '',
    },
    finalists: finalists.map((f, i) => ({
      name: f,
      playerSlug: players.find(p => p.name === f)?.slug || f.toLowerCase().replace(/\s+/g, '-'),
      placement: placementOrder.indexOf(f) + 1,
      votes: juryResult?.votes?.[f] || 0,
    })),
    placements: placementOrder.map((name, idx) => {
      const place = idx + 1;
      const isWinner = name === winner;
      const isFinalist = finalists.includes(name);
      const isJuror = jury.includes(name);
      const phase = isWinner ? 'Winner' : isFinalist ? 'Finalist' : isJuror ? 'Juror' : 'Pre-Juror';
      const elimEp = history.find(e => e.eliminated === name || e.firstEliminated === name);
      const immunityWins = history.filter(e => e.immunityWinner === name && !e.isFinale).length;
      const challengeWins = gs.chalRecord?.[name]?.wins || 0;
      const votesReceived = history.reduce((s,e) => s + ((e.votingLog||[]).filter(v=>v.voted===name&&v.voter!=='THE GAME').length), 0);
      const idolsFound = history.reduce((s,e) => s + ((e.idolFinds||[]).filter(f=>f.finder===name).length), 0);

      // Key moments from episode history
      const keyMoments = [];
      history.forEach(e => {
        if (e.immunityWinner === name) keyMoments.push(`Wins immunity (Ep${e.num})`);
        (e.idolPlays||[]).forEach(p => { if (p.player === name) keyMoments.push(`Plays idol${p.playedFor ? ` for ${p.playedFor}` : ''} (Ep${e.num})`); });
        if (e.eliminated === name) keyMoments.push(`Eliminated (Ep${e.num})`);
      });

      // Alliances
      const allianceSet = new Set();
      history.forEach(e => (e.alliances||[]).forEach(a => {
        if (a.members?.includes(name)) a.members.forEach(m => { if (m !== name) allianceSet.add(m); });
      }));

      // Strategic rank
      const s = pStats(name);
      const survivalBonus = allPlayers.length - idx;
      const advCount = history.reduce((sum, e) => sum + ((e.idolPlays||[]).filter(p => p.player === name).length), 0);
      const strategicRank = Math.round(s.strategic * 2 + survivalBonus * 0.5 + advCount * 1.5);

      return {
        placement: place,
        name,
        playerSlug: players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'),
        phase,
        notes: isWinner ? `${voteStr} jury vote` : elimEp ? `Ep ${elimEp.num}` : '',
        strategicRank,
        story: '',
        gameplayStyle: players.find(p => p.name === name)?.archetype || '',
        keyMoments: keyMoments.slice(0, 8),
        immunityWins,
        rewardWins: 0,
        challengeWins,
        idolsFound,
        votesReceived,
        alliances: [...allianceSet].slice(0, 6),
        rivalries: [],
      };
    }),
  };

  navigator.clipboard.writeText(JSON.stringify(json, null, 2)).then(() => {
    const status = document.getElementById('json-copy-status');
    if (status) { status.textContent = 'Copied to clipboard!'; status.style.color = '#3fb950'; }
  }).catch(() => {
    const status = document.getElementById('json-copy-status');
    if (status) { status.textContent = 'Copy failed \u2014 check browser permissions'; status.style.color = 'var(--accent-fire)'; }
  });
}

// ── Jury Life: resort/jury house dynamics — grudges, friendships, processing elimination ──
export function rpBuildJuryLife(ep) {
  const tw = (ep.twists||[]).find(t => t.type === 'jury-elimination');
  if (!tw) return null;
  const jurors = [...new Set((tw.elimLog || []).map(e => e.juror))];
  if (jurors.length < 2) return null;
  const activePlayers = ep.gsSnapshot?.activePlayers || gs.activePlayers;
  const epNum = ep.num;
  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*7)%arr.length];
  const _pick2 = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*13+3)%arr.length];
  const _usedPairs = new Set(); // prevent duplicate multi-person events

  const events = [];

  // ── Helper: look up juror's elimination details ──
  const getElimInfo = (juror) => {
    const elimEp = (gs.episodeHistory||[]).find(h => h.eliminated === juror || h.firstEliminated === juror);
    const elimEpNum = elimEp?.num || 0;
    const epsSinceElim = epNum - elimEpNum;
    const voters = (elimEp?.votingLog||[]).filter(v => v.voted === juror && v.voter !== 'THE GAME').map(v => v.voter);
    const voteCount = voters.length;
    const totalVoters = (elimEp?.votingLog||[]).filter(v => v.voter !== 'THE GAME').length;
    const wasBlindside = elimEp?.votingLog?.some(v => v.voter === juror && v.voted !== juror); // juror voted for someone else
    const wasUnanimous = voteCount === totalVoters;
    const topVoter = voters.find(v => activePlayers.includes(v));
    const allVotersStillIn = voters.filter(v => activePlayers.includes(v));
    // Were they idoled out?
    const wasIdoled = (elimEp?.idolPlays||[]).some(p => p.votesNegated > 0);
    // Were they in an alliance that turned on them?
    const allianceAtElim = (elimEp?.alliances||[]).find(a => a.members?.includes(juror));
    const betrayedBy = allianceAtElim ? allianceAtElim.members.filter(m => voters.includes(m)) : [];
    return { elimEp, elimEpNum, epsSinceElim, voters, voteCount, totalVoters, wasBlindside, wasUnanimous, topVoter, allVotersStillIn, wasIdoled, betrayedBy, allianceAtElim };
  };

  // ═══ PHASE 1: Each juror gets exactly ONE event (best pick by priority) ═══

  jurors.forEach(juror => {
    const jStats = pStats(juror);
    const jp = pronouns(juror);
    const arch = players.find(x => x.name === juror)?.archetype || '';
    const info = getElimInfo(juror);

    const friendInGame = activePlayers.map(p => ({ name: p, bond: getBond(juror, p) })).sort((a,b) => b.bond - a.bond)[0];
    const enemyInGame = activePlayers.map(p => ({ name: p, bond: getBond(juror, p) })).sort((a,b) => a.bond - b.bond)[0];

    // Priority-ordered candidates — first match wins
    let picked = null;

    // P1: NEW ARRIVAL — just got eliminated (1-2 eps ago)
    if (!picked && info.epsSinceElim <= 2) {
      const pool = [
        `${juror} just arrived at the jury house. ${jp.Sub} ${jp.sub==='they'?'haven\'t':'hasn\'t'} unpacked yet. "I keep replaying it. What could I have done differently? I don't have an answer."`,
        `${juror} is quiet. The other jurors try to include ${jp.obj}, but ${jp.sub} ${jp.sub==='they'?'aren\'t':'isn\'t'} ready. "I need a few days before I can talk about it."`,
        `The newest arrival at the jury house, ${juror} sits apart from the group. "I thought I had more game left in me. Turns out I didn't."`,
      ];
      if (info.wasBlindside)
        pool.push(`${juror} walked into the jury house in shock. "I didn't even know it was me. I voted for someone else. I had no idea." The other jurors have seen it before \u2014 but it never gets easier to watch.`);
      if (info.wasUnanimous)
        pool.push(`${juror} arrived knowing it was unanimous. Every single person wrote ${jp.pos} name. "Not one person tried to save me. Not one. That tells you everything about where I stood."`);
      if (info.wasIdoled)
        pool.push(`${juror} is still processing the idol play. "I wasn't even the target. The idol flipped everything and suddenly I'm here. I did nothing wrong and I'm still out."`);
      if (info.betrayedBy.length)
        pool.push(`${juror} arrived at the jury house and immediately asked who else was there. When ${jp.sub} saw ${info.betrayedBy[0]}'s face, everything clicked. "My own alliance. Nice."`);
      picked = { type: 'processing', badge: 'NEW ARRIVAL', badgeClass: '', text: _pick(pool, juror + 'new'), players: [juror] };
    }

    // P2: BITTER — betrayed by someone still in the game
    if (!picked && info.topVoter && getBond(juror, info.topVoter) <= -1) {
      const pool = [
        `${juror} hasn't stopped talking about ${info.topVoter} since ${jp.sub} got here. "${info.topVoter} smiled at me while writing my name down. You don't forget that."`,
        `${juror} is still fuming. "I trusted ${info.topVoter}. And ${info.topVoter} looked me dead in the eye and voted me out. If ${info.topVoter} makes the finale, I'm voting for literally anyone else."`,
        `Every time ${info.topVoter}'s name comes up at dinner, ${juror} puts down ${jp.pos} fork. "Don't. Just don't. I have nothing good to say about ${info.topVoter} and I won't pretend I do."`,
        `${juror} cornered one of the newer jurors and walked them through exactly how ${info.topVoter} operates. "Let me tell you what ${info.topVoter} did to me. And then you tell me if that person deserves to win."`,
      ];
      if (info.betrayedBy.includes(info.topVoter))
        pool.push(`${juror} keeps coming back to the alliance betrayal. "We had a deal. ${info.topVoter} and I shook hands on it. And then ${info.topVoter} organized the vote against me. That's not gameplay \u2014 that's just lying."`);
      if (info.voteCount <= 2)
        pool.push(`"I went home on ${info.voteCount} votes," ${juror} tells anyone who'll listen. "${info.topVoter} didn't even need a majority. ${info.topVoter} just needed enough people to be scared. And that's exactly what happened."`);
      addBond(juror, info.topVoter, -0.8); // bitterness deepens each episode on the bench
      picked = { type: 'bitter', badge: 'GRUDGE', badgeClass: 'bad', text: _pick(pool, juror + info.topVoter), players: [juror] };
    }

    // P3: ROOTING FOR — strong bond with active player
    if (!picked && friendInGame && friendInGame.bond >= 2) {
      const pool = [
        `${juror} watches every challenge from the jury bench like ${jp.pos} life depends on it. "I need ${friendInGame.name} to win. That's the only ending to this season that makes sense to me."`,
        `"${friendInGame.name} is my person," ${juror} says. "We played together, we trusted each other, and the fact that ${friendInGame.name} is still in it when I'm not \u2014 that means something."`,
        `${juror} has been coaching ${friendInGame.name} from the jury bench \u2014 eye contact, subtle nods during challenges. The other jurors notice. "I don't care if it's obvious."`,
      ];
      if (friendInGame.bond >= 4)
        pool.push(`${juror} spends most of ${jp.pos} time at the jury house thinking about ${friendInGame.name}'s game. "If ${friendInGame.name} can just survive this next vote, I think ${friendInGame.name} wins the whole thing. I know it."`);
      if (info.allVotersStillIn.length && !info.allVotersStillIn.includes(friendInGame.name))
        pool.push(`${juror} has a clear agenda: "${friendInGame.name} wins, and ${info.allVotersStillIn[0]} goes home. That's my dream finale. One of those people had my back. The other wrote my name down."`);
      addBond(juror, friendInGame.name, 0.5); // rooting strengthens the bond — matters for jury vote
      picked = { type: 'rooting', badge: 'ROOTING FOR', badgeClass: 'win', text: _pick(pool, juror + friendInGame.name), players: [juror] };
    }

    // P4: RESENTMENT — doesn't want someone to win
    if (!picked && enemyInGame && enemyInGame.bond <= -1) {
      const _ep = pronouns(enemyInGame.name);
      const pool = [
        `${juror} keeps bringing up ${enemyInGame.name} at dinner. "I don't want ${enemyInGame.name} to win. That's all I know for sure. Everything else, I'm flexible on."`,
        `Whenever the remaining players come up, ${juror} has one rule: "Anyone but ${enemyInGame.name}. I don't care who holds the trophy as long as it's not ${enemyInGame.name}."`,
        `"${enemyInGame.name} played ugly," ${juror} says. "Not bold, not strategic \u2014 ugly. And if the jury rewards that, what are we even doing here?"`,
        `${juror} watches the game from the bench with one eye on ${enemyInGame.name}. "Every time ${_ep.sub} survive${_ep.sub==='they'?'':'s'} another vote, I die a little inside."`,
        `"If ${enemyInGame.name} wins this game, it means the jury failed," ${juror} says. "I refuse to let that happen."`,
        `${juror} has been lobbying the other jurors. "${enemyInGame.name} doesn't deserve this. I'll vote for literally anyone else at Final Tribal and I want you all to know that now."`,
        `${juror} flinches every time ${enemyInGame.name}'s name is mentioned at the jury house. "I don't want to talk about ${_ep.obj}. I don't want to think about ${_ep.obj}. I just want ${_ep.obj} gone."`,
      ];
      addBond(juror, enemyInGame.name, -0.5); // resentment festers — affects jury elimination vote and FTC
      picked = { type: 'resentment', badge: 'NOT OVER IT', badgeClass: 'bad', text: _pick(pool, juror + enemyInGame.name), players: [juror] };
    }

    // P5: ARCHETYPE-DRIVEN
    if (!picked) {
      if (arch === 'mastermind' || arch === 'schemer') {
        const pool = [
          `${juror} treats the jury house like a war room. Whiteboards, timelines, alliance charts \u2014 all for a game ${jp.sub} ${jp.sub==='they'?'are':'is'} no longer in. "Just because I'm out doesn't mean I stopped thinking."`,
          `${juror} has been mapping every possible endgame scenario. "I know exactly who wins against who at Final Tribal. The question is whether the right people get eliminated before then."`,
          `The other jurors caught ${juror} ranking them by "jury vote likelihood" on a napkin at breakfast. "What? It's interesting. I'm not allowed to think anymore?"`,
        ];
        picked = { type: 'scheming', badge: 'STILL SCHEMING', badgeClass: 'gold', text: _pick(pool, juror + 'scheme'), players: [juror] };
      } else if (arch === 'hothead' || jStats.temperament <= 3) {
        const pool = [
          `${juror} has been difficult at the jury house. Two arguments this week alone. The other jurors are walking on eggshells. "I'm not angry. I'm just\u2026 yeah, I'm angry."`,
          `${juror} broke a glass at dinner last night. Nobody said anything. "This game took something from me and I don't know how to get it back yet. Give me time."`,
          `${juror} goes on long walks alone around the resort. The others have learned not to follow. "I need space. I need to stop thinking about how I got here or I'm going to lose it."`,
        ];
        picked = { type: 'volatile', badge: 'VOLATILE', badgeClass: 'bad', text: _pick(pool, juror + 'hot'), players: [juror] };
      } else if (arch === 'social-butterfly' || jStats.social >= 8) {
        const pool = [
          `${juror} has turned the jury house into a social event. Movie nights, group dinners, beach bonfires. "We're all stuck here. We might as well make it fun."`,
          `${juror} knows everyone's story now \u2014 why they came on the show, what they're going home to, what they regret. "The game strips all that away. Here, you actually get to know people."`,
          `${juror} mediates every argument at the jury house. Nobody asked ${jp.obj} to. "Somebody has to keep the peace. Might as well be me."`,
          `${juror} organized a group dinner where nobody was allowed to talk about the game. "It lasted 12 minutes. Then Tribal came up. But those 12 minutes were nice."`,
          `${juror} has become the person every new juror talks to first. "I just listen. Everyone needs that when they arrive."`,
        ];
        picked = { type: 'social', badge: 'HOST', badgeClass: 'gold', text: _pick(pool, juror + 'soc'), players: [juror] };
      } else if ((arch === 'challenge-beast' || jStats.physical >= 7) && jStats.endurance >= 6) {
        const pool = [
          `${juror} has turned the jury house into a training camp. Push-ups at dawn, swimming laps, challenging anyone to anything. "I lost the game. I'm not losing at everything else too."`,
          `${juror} runs the beach every morning before anyone else wakes up. "My body still thinks I'm in the game. I'm not going to fight that."`,
          `${juror} challenged three other jurors to a swimming race. Won all three. "Doesn't count for anything. But it felt good."`,
          `${juror} is the first one up and the last one to sleep at the jury house. "I can't just sit here and wait. I need to move."`,
        ];
        picked = { type: 'competing', badge: 'STILL COMPETING', badgeClass: '', text: _pick(pool, juror + 'beast'), players: [juror] };
      } else if (arch === 'underdog') {
        const pool = [
          `${juror} has been writing in a journal every night since arriving. "I came into this game with nothing and I almost made it. Almost. I want to remember what that felt like before it fades."`,
          `${juror} watches challenges from the bench and mouths the answers to puzzles. "I could've won that one. I know I could've."`,
          `${juror} is the quietest person at the jury house. But when ${jp.sub} ${jp.sub==='they'?'speak':'speaks'}, everyone listens. "I earned my spot here. Nobody handed it to me."`,
          `${juror} has started helping other jurors process their exits. "I know what it's like to feel like you didn't belong. You did. You made it to the jury. That's not nothing."`,
        ];
        picked = { type: 'reflective', badge: 'REFLECTIVE', badgeClass: '', text: _pick(pool, juror + 'under'), players: [juror] };
      } else if (arch === 'wildcard' || arch === 'chaos-agent') {
        const pool = [
          `${juror} is the wildcard of the jury house. One day ${jp.sub} ${jp.sub==='they'?'are':'is'} cooking for everyone, the next ${jp.sub} ${jp.sub==='they'?'are':'is'} starting arguments for fun. "I'm bored. Sue me."`,
          `${juror} tried to organize a prank on the next arriving juror. Half the house was in. The other half locked their doors. "It keeps things interesting."`,
          `${juror} switches between loving the jury house and wanting to burn it down. "This is worse than the game. At least out there I could DO something."`,
        ];
        picked = { type: 'chaotic', badge: 'CHAOS', badgeClass: 'gold', text: _pick(pool, juror + 'chaos'), players: [juror] };
      } else if (arch === 'goat') {
        const pool = [
          `${juror} has been surprisingly insightful at the jury house. Away from the pressure of the game, ${jp.sub} ${jp.sub==='they'?'see':'sees'} things clearly for the first time. "I know people thought I was carried. I know."`,
          `${juror} has gotten more respect at the jury house than ${jp.sub} ever got in the game. "Turns out people like me fine when I'm not a vote."`,
        ];
        picked = { type: 'redeemed', badge: 'FINDING PEACE', badgeClass: '', text: _pick(pool, juror + 'goat'), players: [juror] };
      }
    }

    // P6: AT PEACE — settled in, long-term juror
    if (!picked && info.epsSinceElim >= 3) {
      const pool = [
        `${juror} has settled into jury life. Good food, no strategy, no votes. "I played my game. It wasn't enough. But this resort isn't bad."`,
        `While others plot and rant, ${juror} is by the pool. "I said everything I needed to say in the game. Now I just want to watch how it ends."`,
        `${juror} has started a workout routine at the jury house. Up early, running laps, eating clean. "I lost the game but I'm not losing myself. This is my reset."`,
        `${juror} has become the unofficial therapist of the jury house. Every new arrival sits with ${jp.obj} first. "I listen. I don't judge. Everyone processes this differently."`,
        `${juror} spends most of ${jp.pos} time reading by the pool. Detached, calm, unbothered. The other jurors aren't sure if ${jp.sub} ${jp.sub==='they'?'have':'has'} made peace with it or just shut down.`,
      ];
      picked = { type: 'peace', badge: 'AT PEACE', badgeClass: '', text: _pick(pool, juror + 'peace'), players: [juror] };
    }

    // P7: FALLBACK — watching, observing
    if (!picked) {
      const pool = [
        `${juror} has been quiet at the jury house. Not bitter, not loud \u2014 just watching. Taking it all in. "I'll have my say when it counts."`,
        `${juror} doesn't talk much about the game anymore. "I'm done thinking about what I could've done. Now I just want to see who earns it."`,
        `${juror} sits in the back during jury bench sessions. Observing. Thinking. The other jurors can't read ${jp.obj}. "Good. That's the point."`,
        `${juror} spends the days at the jury house keeping to ${jp.ref}. "I'm not here to make friends. I'm here because I got voted out. Let me process that in peace."`,
      ];
      picked = { type: 'observing', badge: 'WATCHING', badgeClass: '', text: _pick(pool, juror + 'watch'), players: [juror] };
    }

    if (picked) events.push({ juror, ...picked });
  });

  // ═══ PHASE 2: Multi-person events (group dynamics, confrontations, unlikely bonds) ═══

  // ── Jury feuds — pairs with low bond (up to 2) ──
  let _feudCount = 0;
  const _feudPairs = [];
  for (let i = 0; i < jurors.length && _feudCount < 2; i++) {
    for (let j = i + 1; j < jurors.length && _feudCount < 2; j++) {
      const a = jurors[i], b = jurors[j];
      const bond = getBond(a, b);
      const pairKey = [a,b].sort().join('|');
      if (bond <= -1 && !_usedPairs.has(pairKey)) {
        _usedPairs.add(pairKey);
        _feudPairs.push({ a, b, bond });
      }
    }
  }
  _feudPairs.sort((x,y) => x.bond - y.bond).slice(0, 2).forEach(({ a, b, bond }) => {
    const aInfo = getElimInfo(a), bInfo = getElimInfo(b);
    const aVotedBOut = bInfo.voters.includes(a);
    const bVotedAOut = aInfo.voters.includes(b);
    const pool = [
      `${a} and ${b} are barely speaking. They were on opposite sides in the game and being eliminated together hasn't fixed anything. Meals are tense. Silences are loud.`,
      `${b} made a comment about ${a}'s game at dinner. ${a} didn't let it go. The argument lasted twenty minutes. Nobody else ate.`,
      `${a} and ${b} avoid each other at the jury house. When they're forced into the same room, the temperature drops. Everyone else feels it.`,
    ];
    if (aVotedBOut)
      pool.push(`${a} voted ${b} out during the game. Now they live together at the jury house. ${b} hasn't brought it up directly \u2014 but every conversation feels like it's circling back to that night. "I don't need to say it. ${a} knows what ${a} did."`);
    if (bVotedAOut)
      pool.push(`${b} was part of the vote that eliminated ${a}. At the jury house, ${a} found out. The confrontation was ugly. "${b} told me I was safe. Looked me in the eye and said 'you're good.' I'm done talking to ${b}."`);
    if (bond <= -3)
      pool.push(`It boiled over last night. ${a} and ${b} got into a full shouting match by the pool. The other jurors had to separate them. "This isn't about the game anymore," one of them said. "This is personal."`);
    addBond(a, b, -0.6); // jury feuds deepen hostility
    events.push({ type: 'feud', badge: 'JURY FEUD', badgeClass: 'bad',
      text: _pick(pool, a + b + 'feud'), players: [a, b] });
    _feudCount++;
  });

  // ── Jury bonding — pairs who became close (up to 2) ──
  const _bondPairs = [];
  for (let i = 0; i < jurors.length; i++) {
    for (let j = i + 1; j < jurors.length; j++) {
      const a = jurors[i], b = jurors[j];
      const bond = getBond(a, b);
      const pairKey = [a,b].sort().join('|');
      if (bond >= 1 && !_usedPairs.has(pairKey)) {
        _bondPairs.push({ a, b, bond, pairKey });
      }
    }
  }
  _bondPairs.sort((x,y) => y.bond - x.bond).slice(0, 2).forEach(({ a, b, bond, pairKey }) => {
    _usedPairs.add(pairKey);
    const wereAllied = (gs.episodeHistory||[]).some(h => (h.alliances||[]).some(al => al.members?.includes(a) && al.members?.includes(b)));
    const wereRivals = (gs.episodeHistory||[]).some(h => {
      const aAlliance = (h.alliances||[]).find(al => al.members?.includes(a));
      const bAlliance = (h.alliances||[]).find(al => al.members?.includes(b));
      return aAlliance && bAlliance && aAlliance !== bAlliance && (aAlliance.target === b || bAlliance.target === a);
    });
    const pool = [
      `${a} and ${b} have become inseparable at the jury house. They spend every evening comparing notes on what went wrong and what they'd do differently.`,
      `${a} and ${b} stay up late dissecting every move the remaining players make. "We see the game better from out here than we ever did inside it."`,
      `The jury house has its own alliances now. ${a} and ${b} eat together, watch challenges together, and agree on almost everything about who deserves to win.`,
    ];
    if (wereAllied)
      pool.push(`${a} and ${b} were allied during the game, and the bond survived elimination. They've been inseparable at the jury house. "We couldn't save each other in the game. But we can still decide who wins. And we're voting the same way."`);
    if (wereRivals)
      pool.push(`${a} and ${b} were enemies in the game \u2014 different alliances, different targets. But the jury house changed everything. "Funny how getting voted out puts things in perspective. ${a} is actually pretty cool when ${a}'s not trying to eliminate you."`);
    if (bond >= 4)
      pool.push(`${a} and ${b} have the closest friendship in the jury house. Late-night talks, inside jokes, finishing each other's sentences. The other jurors call them "the married couple." Neither of them corrects it.`);
    addBond(a, b, 0.8); // jury house bonding — these two will likely vote the same way at FTC
    events.push({ type: 'bonding', badge: 'JURY BOND', badgeClass: 'gold',
      text: _pick(pool, a + b + 'bond'), players: [a, b] });
  });

  // ── Group dynamics: who deserves to win? (3+ jurors) ──
  if (jurors.length >= 3) {
    const topPick = activePlayers.map(p => ({
      name: p,
      supporters: jurors.filter(j => getBond(j, p) >= 1).length,
      haters: jurors.filter(j => getBond(j, p) <= -1).length,
    }));
    const bySupporters = [...topPick].sort((a,b) => b.supporters - a.supporters);
    const byHaters = [...topPick].sort((a,b) => b.haters - a.haters);
    const favorite = bySupporters[0];
    const controversial = topPick.find(p => p.supporters >= 2 && p.haters >= 2);
    const hated = byHaters[0];

    if (controversial) {
      const supporters = jurors.filter(j => getBond(j, controversial.name) >= 1).slice(0, 3);
      const opposers = jurors.filter(j => getBond(j, controversial.name) <= -1).slice(0, 3);
      events.push({ type: 'debate', badge: 'DIVIDED', badgeClass: 'gold',
        text: `The jury house is split on ${controversial.name}. ${supporters.join(' and ')} think ${controversial.name} deserves to be there. ${opposers.join(' and ')} can't stand the idea of ${controversial.name} winning. Dinner conversations keep circling back to the same argument \u2014 and nobody's changing their mind.`,
        players: [...supporters, ...opposers] });
    }

    if (favorite && favorite.supporters >= 2 && (!controversial || controversial.name !== favorite.name)) {
      const fans = jurors.filter(j => getBond(j, favorite.name) >= 1).slice(0, 4);
      events.push({ type: 'consensus', badge: 'JURY FAVORITE', badgeClass: 'win',
        text: `The jury house has an unofficial favorite: ${favorite.name}. ${fans.join(', ')} all agree \u2014 if ${favorite.name} makes it to the end, ${favorite.name} wins. "It's not even close," ${fans[0]} says. "Nobody else has played a game the jury respects like that."`,
        players: fans });
    }

    if (hated && hated.haters >= 2 && (!controversial || controversial.name !== hated.name)) {
      const haters = jurors.filter(j => getBond(j, hated.name) <= -1).slice(0, 4);
      events.push({ type: 'consensus-neg', badge: 'JURY VILLAIN', badgeClass: 'bad',
        text: `If there's one thing the jury agrees on, it's ${hated.name}. ${haters.join(', ')} \u2014 none of them want to see ${hated.name} hold the trophy. "I'd vote for an empty chair before I'd vote for ${hated.name}," ${haters[0]} says. The others nod.`,
        players: haters });
    }
  }

  // ── Confrontation replay: juror confronts the person who eliminated them (also a juror now) ──
  jurors.forEach(juror => {
    const info = getElimInfo(juror);
    const eliminatorOnJury = info.voters.find(v => jurors.includes(v) && v !== juror);
    if (eliminatorOnJury) {
      const pairKey = [juror, eliminatorOnJury].sort().join('|') + '_confront';
      if (!_usedPairs.has(pairKey)) {
        _usedPairs.add(pairKey);
        const bond = getBond(juror, eliminatorOnJury);
        const pool = [];
        if (bond <= -2) {
          addBond(juror, eliminatorOnJury, -0.5); // confrontation made it worse
          pool.push(`${juror} finally confronted ${eliminatorOnJury} at the jury house. "You voted me out. I want to know why. Not the game reason \u2014 the real reason." The conversation went late into the night. It didn't end well.`);
          pool.push(`${eliminatorOnJury} tried to apologize to ${juror} over breakfast. ${juror} listened, then stood up and left. "Apology not accepted. Not yet. Maybe not ever."`);
        } else if (bond >= 1) {
          addBond(juror, eliminatorOnJury, 0.5); // honest conversation healed something
          pool.push(`${juror} and ${eliminatorOnJury} had the conversation everyone was waiting for. "${eliminatorOnJury} voted me out and I needed to hear why. And honestly? The explanation made sense. I hate that it made sense. But it did."`,);
          pool.push(`${eliminatorOnJury} sat down with ${juror} the first night and laid it all out. Why the vote happened. What the alternative was. By the end, ${juror} was nodding. "I would've done the same thing. I hate it, but I would've done the same thing."`,);
        } else {
          pool.push(`${juror} asked ${eliminatorOnJury} point-blank: "Was it personal?" The answer took ten minutes. By the end, neither of them felt better about it. But at least they talked.`);
        }
        events.push({ type: 'confrontation', badge: 'CONFRONTATION', badgeClass: 'bad',
          text: _pick(pool, juror + eliminatorOnJury + 'confront'), players: [juror, eliminatorOnJury] });
      }
    }
  });

  // ── Shared elimination story: two jurors eliminated by the same person ──
  const elimByMap = {};
  jurors.forEach(juror => {
    const info = getElimInfo(juror);
    info.allVotersStillIn.forEach(v => {
      if (!elimByMap[v]) elimByMap[v] = [];
      elimByMap[v].push(juror);
    });
  });
  Object.entries(elimByMap).forEach(([voter, victims]) => {
    if (victims.length >= 2) {
      const [a, b] = victims.slice(0, 2);
      const pairKey = [a,b].sort().join('|') + '_shared';
      if (!_usedPairs.has(pairKey)) {
        _usedPairs.add(pairKey);
        events.push({ type: 'shared-story', badge: 'COMMON ENEMY', badgeClass: 'bad',
          text: `${a} and ${b} discovered something at the jury house: ${voter} voted both of them out. Different episodes, different alliances, same result. "We were both collateral damage for ${voter}'s game," ${a} says. ${b} nods. "And ${voter} is still out there playing. That doesn't sit right with either of us."`,
          players: [a, b] });
      }
    }
  });

  // ── Mind changed: juror reconsiders their feelings about a player ──
  jurors.forEach(juror => {
    const jp = pronouns(juror);
    const info = getElimInfo(juror);
    // Juror who was bitter but bond has improved (e.g. through rekindle events)
    if (info.topVoter && getBond(juror, info.topVoter) >= 0 && info.epsSinceElim >= 3) {
      const pairKey = juror + info.topVoter + '_mindchange';
      if (!_usedPairs.has(pairKey) && Math.random() < 0.30) {
        _usedPairs.add(pairKey);
        // Real consequence: juror's bitterness softens — bond improves toward their eliminator
        addBond(juror, info.topVoter, 1.5);
        const pool = [
          `${juror} surprised everyone at dinner. "I've been thinking about ${info.topVoter}. And I think... I think ${info.topVoter} made the right call voting me out. I'm not happy about it. But I get it now."`,
          `Something shifted for ${juror} this week. "I came in here wanting ${info.topVoter} gone. But watching the game from the outside... ${info.topVoter} is playing. I can't be mad at someone for playing."`,
          `${juror} pulls a newer juror aside. "When I got here I was furious at ${info.topVoter}. I'm not anymore. Time does that. The game looks different from this side."`,
        ];
        events.push({ type: 'mind-changed', badge: 'CHANGED MIND', badgeClass: 'gold',
          text: _pick(pool, juror + 'mc'), players: [juror] });
      }
    }
  });

  // ── Gameplay reflection: juror reflects on their own mistakes ──
  jurors.forEach(juror => {
    const jp = pronouns(juror);
    const jStats = pStats(juror);
    const info = getElimInfo(juror);
    if (info.epsSinceElim >= 2 && Math.random() < 0.20) {
      const pairKey = juror + '_reflect' + epNum;
      if (!_usedPairs.has(pairKey)) {
        _usedPairs.add(pairKey);
        const pool = [
          `${juror} to the group: "I know where I went wrong. I trusted the wrong person at the wrong time. One conversation. That's all it took."`,
          `${juror} has been replaying ${jp.pos} game in ${jp.pos} head. "I should've made a move at the final seven. I had the numbers. I was too scared. That's on me."`,
          `"If I could go back," ${juror} says, "I'd play messier. I played safe and I still went home. At least a big move would've been fun."`,
          `${juror} admits it at the jury house: "My social game was bad. I thought strategy was enough. It's not. You need people to actually like you."`,
          `${juror} stares at the ceiling at night running scenarios. "What if I'd played my idol that night? Everything changes. EVERYTHING. I held it one round too long."`,
        ];
        events.push({ type: 'reflection', badge: 'LOOKING BACK', badgeClass: '',
          text: _pick(pool, juror + 'refl'), players: [juror] });
      }
    }
  });

  // ── Outsider finding community: two jurors who never connected in the game bond at jury house ──
  for (let i = 0; i < jurors.length && events.length < 15; i++) {
    for (let j = i + 1; j < jurors.length; j++) {
      const a = jurors[i], b = jurors[j];
      const bond = getBond(a, b);
      const pairKey = [a,b].sort().join('|') + '_newbond';
      if (bond >= -0.5 && bond <= 0.5 && !_usedPairs.has(pairKey) && Math.random() < 0.15) {
        _usedPairs.add(pairKey);
        const pool = [
          `${a} and ${b} never spoke during the game. Different tribes, different alliances, different worlds. At the jury house? They haven't stopped talking. "We should've been allies. We just never had the chance."`,
          `${a} and ${b} bonded over the one thing they have in common: neither of them saw their elimination coming. "We're both blindside survivors. That's a club nobody wants to join — but the membership is real."`,
          `${a} and ${b} were strangers in the game. At the jury house, they discovered they agree on almost everything. "If we'd been on the same tribe from day one, we'd have run this game."`,
        ];
        addBond(a, b, 1.0); // strangers bonding — fresh connection formed on the bench
        events.push({ type: 'new-connection', badge: 'UNLIKELY BOND', badgeClass: 'gold',
          text: _pick(pool, a + b + 'newbond'), players: [a, b] });
        break;
      }
    }
  }

  if (!events.length) return null;

  // Sort: vote-opinion events get a slight priority boost, then interleave solo/multi for pacing
  const _voteTypes = new Set(['rooting','bitter','resentment','debate','consensus','consensus-neg']);
  const soloVote = events.filter(e => (e.players||[]).length <= 1 && _voteTypes.has(e.type));
  const soloOther = events.filter(e => (e.players||[]).length <= 1 && !_voteTypes.has(e.type));
  const multiVote = events.filter(e => (e.players||[]).length >= 2 && _voteTypes.has(e.type));
  const multiOther = events.filter(e => (e.players||[]).length >= 2 && !_voteTypes.has(e.type));
  // Weave: vote-opinion solo, then other solo, with multi events sprinkled in
  const interleaved = [];
  let sv = 0, so = 0, mv = 0, mo = 0;
  while (sv < soloVote.length || so < soloOther.length || mv < multiVote.length || mo < multiOther.length) {
    if (sv < soloVote.length) interleaved.push(soloVote[sv++]);
    if (so < soloOther.length) interleaved.push(soloOther[so++]);
    if (mv < multiVote.length) interleaved.push(multiVote[mv++]);
    if (sv < soloVote.length) interleaved.push(soloVote[sv++]);
    if (so < soloOther.length) interleaved.push(soloOther[so++]);
    if (mo < multiOther.length) interleaved.push(multiOther[mo++]);
  }
  const capped = interleaved.slice(0, 18);

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Episode ${epNum}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:4px;text-transform:uppercase">Jury Life</div>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:20px;letter-spacing:1.5px;text-transform:uppercase">Meanwhile, at the jury house\u2026</div>`;

  // Jury portraits row
  html += `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:20px">
    ${jurors.map(j => `<div style="text-align:center">${rpPortrait(j)}<div style="font-size:9px;color:var(--muted);margin-top:2px">${j}</div></div>`).join('')}
  </div>`;

  capped.forEach(evt => {
    const badgeColors = {
      bad: 'color:var(--accent-fire);background:rgba(248,81,73,0.1);border-color:rgba(248,81,73,0.25)',
      win: 'color:#3fb950;background:rgba(63,185,80,0.1);border-color:rgba(63,185,80,0.25)',
      gold: 'color:#e3b341;background:rgba(227,179,65,0.1);border-color:rgba(227,179,65,0.25)',
      '': 'color:var(--muted);background:var(--surface2);border-color:var(--border)',
    };
    const badgeStyle = badgeColors[evt.badgeClass] || badgeColors[''];
    html += `<div style="margin-bottom:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${evt.players.map(p => rpPortrait(p, 'sm')).join('')}
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;padding:2px 8px;border-radius:4px;border:1px solid;${badgeStyle}">${evt.badge}</span>
      </div>
      <div style="font-size:13px;color:#cdd9e5;line-height:1.6">${evt.text}</div>
    </div>`;
  });

  // ── JURY ROUNDTABLE section ──
  const rt = ep.juryRoundtable;
  if (rt && rt.discussions?.length) {
    html += `<div style="margin-top:32px;border-top:1px solid rgba(255,255,255,0.1);padding-top:24px">
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;text-align:center;margin-bottom:4px;text-transform:uppercase">Jury Roundtable</div>
      <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:20px;letter-spacing:1.5px;text-transform:uppercase">The jury debates the remaining players</div>`;

    rt.discussions.forEach(disc => {
      // Active player header
      html += `<div style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06)">
          ${rpPortrait(disc.player)}
          <div>
            <div style="font-size:15px;font-weight:700;color:#cdd9e5">${disc.player}</div>
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Under Discussion</div>
          </div>
        </div>`;

      disc.events.forEach(evt => {
        const badgeColors = {
          bad: 'color:var(--accent-fire);background:rgba(248,81,73,0.1);border-color:rgba(248,81,73,0.25)',
          win: 'color:#3fb950;background:rgba(63,185,80,0.1);border-color:rgba(63,185,80,0.25)',
          gold: 'color:#e3b341;background:rgba(227,179,65,0.1);border-color:rgba(227,179,65,0.25)',
          '': 'color:var(--muted);background:var(--surface2);border-color:var(--border)',
        };
        const badgeStyle = badgeColors[evt.badgeClass] || badgeColors[''];
        html += `<div style="margin-bottom:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
            <span style="font-size:9px;font-weight:700;letter-spacing:1px;padding:2px 8px;border-radius:4px;border:1px solid;${badgeStyle}">${evt.badge}</span>
          </div>
          <div style="font-size:13px;color:#cdd9e5;line-height:1.6">${evt.text}</div>
        </div>`;
      });

      html += `</div>`; // close player discussion block
    });

    // Closing summary: The Verdict
    const netShifts = {};
    (rt.shifts || []).forEach(s => {
      netShifts[s.finalist] = (netShifts[s.finalist] || 0) + (s.direction === 'for' ? 1 : -1);
    });
    const verdictLines = Object.entries(netShifts)
      .filter(([, v]) => v !== 0)
      .map(([name, v]) => v > 0 ? `${name} gained ${v} supporter${v > 1 ? 's' : ''}` : `${name} lost ${Math.abs(v)} supporter${Math.abs(v) > 1 ? 's' : ''}`)
      .join('. ');
    if (verdictLines) {
      html += `<div style="margin-top:16px;text-align:center;font-size:12px;color:var(--muted);font-style:italic;letter-spacing:0.5px">
        The Verdict: ${verdictLines}.
      </div>`;
    }

    html += `</div>`; // close roundtable container
  }

  html += `</div>`;
  return html;
}

// ── Jury Convenes: announcement screen showing jury + vulnerable players ──
export function rpBuildJuryConvenes(ep) {
  const tw = (ep.twists||[]).find(t => t.type === 'jury-elimination' && t.juryBooted);
  if (!tw) return null;
  const immune = ep.immunityWinner;
  const candidates = Object.keys(tw.elimVotes || {});
  const jurors = [...new Set((tw.elimLog || []).map(e => e.juror))];

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:6px;text-transform:uppercase;color:var(--accent-gold);text-shadow:0 0 30px rgba(227,179,65,0.3)">The Jury Has Power</div>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:20px;letter-spacing:1.5px;text-transform:uppercase">Tonight, the eliminated players decide who goes home</div>`;

  html += `<div class="vp-section-header gold">The Jury</div>`;
  html += `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:16px">
    ${jurors.map(j => `<div style="text-align:center">${rpPortrait(j)}<div style="font-size:10px;color:var(--muted);margin-top:2px">${j}</div></div>`).join('')}
  </div>`;

  if (immune) {
    html += `<div class="vp-card gold" style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      ${rpPortrait(immune)}
      <div><div style="font-size:13px;font-weight:600">${immune}</div><div style="font-size:11px;color:#e3b341">Immune \u2014 cannot be targeted</div></div>
    </div>`;
  }

  html += `<div class="vp-section-header fire">Vulnerable</div>`;
  candidates.forEach(c => {
    const avgBondWithJury = jurors.length
      ? jurors.reduce((s, j) => s + getBond(j, c), 0) / jurors.length : 0;
    const dangerLevel = avgBondWithJury <= -1 ? 'high' : avgBondWithJury <= 1 ? 'medium' : 'low';
    const dangerLabel = dangerLevel === 'high' ? 'Burned bridges with the jury'
                      : dangerLevel === 'medium' ? 'Mixed relationships with jury'
                      : 'Well-liked by the jury';
    html += `<div class="vp-card" style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      ${rpPortrait(c)}
      <div><div style="font-size:13px">${c}</div><div style="font-size:10px;color:${dangerLevel==='high'?'var(--accent-fire)':dangerLevel==='medium'?'#e3b341':'var(--muted)'}">${dangerLabel}</div></div>
    </div>`;
  });

  html += `<div style="text-align:center;font-size:13px;color:#8b949e;margin-top:20px;line-height:1.6">
    The eliminated players have voted. One active player will be removed from the game.<br>No tribal council tonight.
  </div>`;

  html += `</div>`;
  return html;
}

// ── Jury Votes: interactive card-by-card reveal reusing tv-vote-card pattern ──
export function rpBuildJuryVotes(ep) {
  const tw = (ep.twists||[]).find(t => t.type === 'jury-elimination' && t.juryBooted);
  if (!tw) return null;
  const jBooted = tw.juryBooted;
  const jLog = tw.elimLog || [];
  const jVotes = tw.elimVotes || {};
  const epNum = ep.num;
  const stateKey = epNum + '_je';

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${epNum} \u2014 Jury Elimination</div>
    <div class="rp-title">The Jury Votes</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:16px;text-align:center">Tonight, the jury votes to <strong style="color:var(--accent-fire)">eliminate</strong> one active player.</div>`;

  // Two-panel layout: cards left, tally right
  html += `<div class="tv-wrap">
    <div class="tv-reveal-panel" id="tv-cards-${stateKey}">`;

  jLog.forEach(({ juror, votedOut }, idx) => {
    const bond = getBond(juror, votedOut);
    const _pick = arr => arr[([...juror+votedOut].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*11)%arr.length];
    const jS = pStats(juror); const tS = pStats(votedOut);
    const tp = pronouns(votedOut);

    // Did votedOut vote juror out? Check episode history for betrayal context
    const jurorElimEp = (gs.episodeHistory||[]).find(h => h.eliminated === juror || h.firstEliminated === juror);
    const votedOutVotedJurorOut = jurorElimEp?.votingLog?.some(v => v.voter === votedOut && v.voted === juror);
    const wereAllied = (gs.episodeHistory||[]).some(h =>
      (h.alliances||[]).some(a => a.members?.includes(juror) && a.members?.includes(votedOut))
    );

    let reason;
    // Tier 1: bitter betrayal — votedOut voted juror out AND bond is very low
    // Only triggers for genuinely burned jurors (bond <= -3), not mild dislikes
    if (votedOutVotedJurorOut && bond <= -3) reason = _pick([
      `${votedOut} wrote my name down. I\u2019ve been waiting for this moment since I hit the jury bench.`,
      `I sat on that bench replaying the night ${votedOut} ended my game. Tonight I return the favor.`,
      `${votedOut} ended my game. Now I end ${tp.pos}.`,
      `Every night on that bench I thought about this moment. ${votedOut}\u2019s name. My handwriting. Done.`,
      `${votedOut} smiled at me on the way out. I\u2019ve been holding onto that smile for weeks. Tonight I hand it back.`,
      `This isn\u2019t strategy. This is personal. ${votedOut} knows exactly why.`,
      `The jury gave me a pen and a parchment. I already know what I\u2019m writing. I\u2019ve known since the night ${tp.sub} voted me out.`,
      `I don\u2019t need to explain this one. ${votedOut} knows what ${tp.sub} did.`,
    ]);
    // Tier 2: voted out by target, processed — using power to eliminate
    else if (votedOutVotedJurorOut) reason = _pick([
      `${votedOut} put me on this bench. Tonight I\u2019m sending ${tp.obj} home. That\u2019s the whole speech.`,
      `${votedOut} voted me out. I\u2019ve been waiting for this. My vote tonight: ${votedOut}. Gone.`,
      `${votedOut} took my spot in this game. The jury just gave me the power to take ${tp.pos}. I\u2019m using it.`,
      `I\u2019m writing ${votedOut}\u2019s name down tonight. ${tp.Sub} ended my game \u2014 now I\u2019m ending ${tp.pos}.`,
      `${votedOut} is going home tonight because of my vote. ${tp.Sub} sent me to the bench. I\u2019m sending ${tp.obj} out the door.`,
      `${votedOut} made a game move on me. I respected it. Now I\u2019m making mine. Bye.`,
      `The jury just handed me the most powerful vote in this game. I\u2019m spending it on ${votedOut}. ${tp.Sub} earned this.`,
      `I\u2019ve had weeks to cool off. I\u2019m cool. And I\u2019m still writing ${votedOut}\u2019s name.`,
    ]);
    // Tier 3: former allies with broken trust
    else if (wereAllied && bond <= -2) reason = _pick([
      `We were in an alliance. ${votedOut} let it fall apart. I\u2019ve had weeks to think about how that went. This is where I land.`,
      `${votedOut} and I were supposed to go deep together. ${tp.Sub} chose differently. Doesn\u2019t mean I won\u2019t vote accordingly.`,
      `I trusted ${votedOut}. That was my mistake. But tonight I get to make ${tp.pos}.`,
      `We had a deal. ${votedOut} broke it. The jury bench gives you clarity \u2014 and my clarity says ${tp.sub} ${tp.sub==='they'?'go':'goes'} home.`,
      `I carried ${votedOut} when ${tp.sub} needed me. ${tp.Sub} dropped me when I needed ${tp.obj}. This vote writes itself.`,
      `${votedOut} and I built something out here. ${tp.Sub} burned it down. Now I get to vote on the ashes.`,
      `Former ally. Current target. The game changes people. It changed what ${votedOut} meant to me.`,
      `The alliance was real. The betrayal was real. This vote is real too.`,
    ]);
    // Tier 4: genuine grudge — very low bond, no direct betrayal
    else if (bond <= -3) reason = _pick([
      `${votedOut} burned every bridge in this game. The people on the other side of those bridges finally get a say.`,
      `I\u2019ve watched ${votedOut} from the jury bench for weeks. ${tp.Sub} played selfish and it caught up to ${tp.obj}.`,
      `${votedOut} treated people like numbers. Tonight those numbers vote back.`,
      `I never liked ${votedOut}\u2019s game. I never liked ${votedOut}. This is the most honest vote I\u2019ll ever cast.`,
      `The jury bench shows you who people really are. And what I see in ${votedOut} doesn\u2019t deserve to stay.`,
      `${votedOut} made enemies on the way up. We\u2019re all sitting on this bench now. ${tp.Sub} should\u2019ve been nicer.`,
      `Some people play the game and earn respect. ${votedOut} played the game and earned this vote.`,
      `I\u2019ve been waiting patiently. ${votedOut}\u2019s name is the first thing I\u2019m writing tonight.`,
    ]);
    // Tier 5: mild negative / neutral — biggest pool since most jurors land here
    else if (bond <= 0) {
      const _jeFriend = (ep.gsSnapshot?.activePlayers || gs.activePlayers)
        .filter(p => p !== votedOut && getBond(juror, p) >= 1)
        .sort((a,b) => getBond(juror, b) - getBond(juror, a))[0];
      const pool5 = [];
      // Friend-based reasons
      if (_jeFriend) {
        pool5.push(`I still have someone in this game I\u2019m rooting for. ${_jeFriend} deserves a shot \u2014 and ${votedOut} is the one standing in the way.`);
        pool5.push(`${_jeFriend} is still out there fighting. If I can do one thing from this bench, it\u2019s give ${_jeFriend} a clearer path. That means ${votedOut} goes.`);
        pool5.push(`I want ${_jeFriend} to win this game. Simple as that. And I think ${votedOut} beats ${_jeFriend} at the end. So this is an easy vote for me.`);
        pool5.push(`My heart is with ${_jeFriend}. And the best thing I can do for ${_jeFriend} right now is take out the person who beats ${_jeFriend} at Final Tribal. That\u2019s ${votedOut}.`);
      }
      // Personal dislike reasons
      pool5.push(`I don\u2019t want ${votedOut} to win this game. That\u2019s honest. I\u2019ve been watching from the bench and I don\u2019t like what I\u2019ve seen.`);
      pool5.push(`${votedOut} never built anything real out here. ${tp.Sub} played for ${tp.ref} and nobody else. The jury noticed.`);
      pool5.push(`I\u2019ve been watching ${votedOut} coast while other people fought to stay. I don\u2019t think ${tp.sub} ${tp.sub==='they'?'deserve':'deserves'} to still be here.`);
      pool5.push(`${votedOut} is still in this game because other people kept ${tp.obj} around as a number. Not because ${tp.sub} earned it. The jury sees that.`);
      // Analytical reasons
      pool5.push(`From out here, ${votedOut}\u2019s game doesn\u2019t hold up. Inside, it looked fine. From the bench? It\u2019s smoke and mirrors.`);
      pool5.push(`I\u2019ve had weeks to think about this game. And every time I run the scenarios, ${votedOut} is the one who doesn\u2019t deserve to make it further.`);
      pool5.push(`This isn\u2019t personal. I just think ${votedOut} has had the easiest ride to this point and I want to see what happens when that changes.`);
      pool5.push(`The jury bench strips away the noise. And what I see clearly is that ${votedOut} shouldn\u2019t be the one holding the trophy at the end of this.`);
      // Archetype-flavored
      if (jS.strategic >= 7)
        pool5.push(`I ran the numbers from the bench. ${votedOut} is the right elimination if you want a competitive finale. This is a math vote.`);
      if (jS.social >= 7)
        pool5.push(`I\u2019ve talked to every juror here. Most of us agree \u2014 ${votedOut} hasn\u2019t earned the relationships to win this thing. So why let ${tp.obj} stay?`);
      if (jS.boldness >= 7)
        pool5.push(`${votedOut} played safe the entire game. Never took a risk, never made a move. And now the jury gets to make a move for ${tp.obj}. Ironic.`);
      reason = _pick(pool5);
    }
    // Tier 6: positive bond, high — painful, voting to help another friend or out of respect
    else if (bond >= 3) {
      const _jeFriend6 = (ep.gsSnapshot?.activePlayers || gs.activePlayers)
        .filter(p => p !== votedOut && getBond(juror, p) >= 1)
        .sort((a,b) => getBond(juror, b) - getBond(juror, a))[0];
      const pool6 = [];
      if (_jeFriend6) {
        pool6.push(`I care about ${votedOut}. But I care about ${_jeFriend6} too, and ${_jeFriend6} can\u2019t win with ${votedOut} still in the game. I\u2019m sorry.`);
        pool6.push(`${votedOut} and I were close. But ${_jeFriend6} is still fighting out there and I want to give ${_jeFriend6} a real chance. This is the only way.`);
        pool6.push(`If ${votedOut} and ${_jeFriend6} both make the end, ${votedOut} wins. I can\u2019t let that happen to ${_jeFriend6}. So I\u2019m voting for the person I like more. That\u2019s how messed up this game is.`);
      }
      pool6.push(`This one hurts. ${votedOut} and I were close out there. But I\u2019ve had time to think, and I don\u2019t want to see ${tp.obj} win over people who had to fight harder.`);
      pool6.push(`I respect ${votedOut} so much. That\u2019s what makes this hard. But from the bench, I can see how this game ends if ${tp.sub} ${tp.sub==='they'?'stay':'stays'}. I\u2019m sorry.`);
      pool6.push(`${votedOut}, I hope you understand. You played a beautiful game. But the jury deserves a finale that isn\u2019t already decided. And with you in it \u2014 it is.`);
      pool6.push(`I never thought I\u2019d vote against ${votedOut}. But the jury bench changes you. I can see things I couldn\u2019t see when I was playing. And what I see is that ${votedOut} can\u2019t stay.`);
      pool6.push(`${votedOut} was my closest ally in this game. Writing ${tp.pos} name down is the hardest thing I\u2019ve done out here \u2014 harder than getting voted out. But it\u2019s the right call.`);
      reason = _pick(pool6);
    }
    // Tier 7: mild positive — measured, reflective
    else {
      const _jeFriend7 = (ep.gsSnapshot?.activePlayers || gs.activePlayers)
        .filter(p => p !== votedOut && getBond(juror, p) >= 1)
        .sort((a,b) => getBond(juror, b) - getBond(juror, a))[0];
      const pool7 = [];
      if (_jeFriend7) {
        pool7.push(`I\u2019m rooting for ${_jeFriend7}. That\u2019s the honest answer. And ${votedOut} is the one I think beats ${_jeFriend7} at the end. So here we are.`);
        pool7.push(`I want to see ${_jeFriend7} get to the finale. ${votedOut} makes that harder. This vote is about giving my person a real shot.`);
        pool7.push(`Between ${votedOut} and the other people left \u2014 I\u2019d rather see ${_jeFriend7} have a chance. That\u2019s what this vote comes down to.`);
      }
      pool7.push(`I\u2019ve had time to think on that jury bench. ${votedOut} is the right call. Not emotional \u2014 just clear.`);
      pool7.push(`The jury bench changes how you see people. ${votedOut} looked different from inside the game than ${tp.sub} ${tp.sub==='they'?'do':'does'} from out here.`);
      pool7.push(`I\u2019ve been thinking about this since I got eliminated. ${votedOut} is the one I keep landing on.`);
      pool7.push(`Honestly? I don\u2019t have a strong feeling either way. But if I have to pick someone, ${votedOut} is the name that makes the most sense to me right now.`);
      pool7.push(`${votedOut} is a good player. That\u2019s exactly why I\u2019m writing ${tp.pos} name. Good players don\u2019t get to coast to the end on the jury\u2019s watch.`);
      pool7.push(`I\u2019ve gone back and forth on this. But at the end of the day, I think the game is better without ${votedOut} in it. And that\u2019s enough for me.`);
      if (jS.strategic >= 6)
        pool7.push(`I\u2019ve been running scenarios from the bench. In most of them, ${votedOut} wins the game if ${tp.sub} ${tp.sub==='they'?'make':'makes'} it to the end. I\u2019d rather shake things up.`);
      if (jS.social >= 6)
        pool7.push(`I\u2019ve been talking to the other jurors. ${votedOut}\u2019s name keeps coming up. I think this is where the room is leaning, and I\u2019m okay with it.`);
      reason = _pick(pool7);
    }

    html += `<div class="tv-vote-card" data-voted="${votedOut}" data-voter="${juror}" data-index="${idx}">
      <div class="tv-vote-voter-wrap">
        ${rpPortrait(juror, 'sm')}
        <div class="tv-vote-voter">${juror}</div>
      </div>
      <div class="tv-vote-arrow" style="color:var(--accent-fire)">\u2192</div>
      <div class="tv-vote-right">
        <div class="tv-vote-target">${votedOut}</div>
        <div class="tv-vote-reason">${reason}</div>
      </div>
    </div>`;
  });

  html += `</div>`; // end tv-reveal-panel

  // Live tally panel
  const tallyNames = Object.entries(jVotes).sort(([,a],[,b]) => b-a).map(([n]) => n);
  html += `<div class="tv-tally-panel" id="tv-tally-${stateKey}">
    <div class="tv-tally-header">Jury Tally</div>`;
  tallyNames.forEach(name => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    html += `<div class="tv-tally-row" data-name="${name}" style="opacity:0;transition:opacity 0.4s">
      ${rpPortrait(name)}
      <div class="tv-tally-pname">${name}</div>
      <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${stateKey}-${slug}" style="width:0%"></div></div>
      <div class="tv-tally-count" id="tv-tc-${stateKey}-${slug}" data-count="0">\u2014</div>
    </div>`;
  });
  html += `</div></div>`; // end tally panel + tv-wrap

  // Reveal buttons
  html += `<div id="tv-btn-wrap-${stateKey}">
    <button class="tv-reveal-btn" id="tv-btn-${stateKey}" onclick="tvRevealNext('${stateKey}')">Read the Vote (0/${jLog.length})</button>
    <div style="text-align:right;margin:-12px 0 14px">
      <button onclick="tvRevealAll('${stateKey}')" style="background:none;border:none;font-size:11px;color:#484f58;cursor:pointer;padding:2px 0;letter-spacing:0.3px">Skip to results \u203a</button>
    </div>
  </div>`;

  // Results section (hidden until all votes revealed)
  html += `<div id="tv-results-${stateKey}" style="display:none">`;

  // Tie card — if the jury vote tied, show the deliberation tiebreaker
  if (tw.juryTie && tw.juryTiedPlayers?.length > 1) {
    const tiedNames = tw.juryTiedPlayers;
    const tiedVoteCount = jVotes[tiedNames[0]] || 0;
    html += `<div class="rp-elim" style="background:radial-gradient(ellipse at 50% 30%,rgba(210,153,34,0.08) 0%,transparent 60%);border-color:rgba(210,153,34,0.2)">
      <div class="rp-elim-eyebrow" style="color:#d29922">Jury Deadlock \u2014 ${tiedVoteCount}-${tiedVoteCount} Tie</div>
      <div style="font-size:13px;color:#8b949e;text-align:center;margin-bottom:16px;line-height:1.5">
        The jury vote tied between ${tiedNames.join(' and ')}. ${tiedVoteCount} votes each.
      </div>
      <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:16px">
        ${tiedNames.map(n => `<div style="text-align:center">
          ${rpPortrait(n, 'lg')}
          <div style="font-size:11px;margin-top:4px">${n}</div>
          <div style="font-size:10px;color:#d29922">${jVotes[n]} votes</div>
        </div>`).join(`<div style="align-self:center;font-size:20px;color:#30363d;font-weight:700">vs</div>`)}
      </div>
      <div style="font-size:13px;color:#cdd9e5;text-align:center;line-height:1.6;margin-bottom:8px">
        The jury reconvened. After further deliberation \u2014 old grudges, broken alliances, unfinished business \u2014 the room shifted.
      </div>
      <div style="font-size:13px;color:var(--accent-fire);text-align:center;font-weight:600">
        The jury has made their decision: ${jBooted}.
      </div>
    </div>`;
  }

  // Elimination card
  const _jPlace = (ep.gsSnapshot?.activePlayers ?? gs.activePlayers).length + 1;
  const _jQ = vpGenerateQuote(jBooted, ep, 'juryEliminated');
  html += `<div class="rp-elim">
    <div class="rp-elim-eyebrow">Jury eliminated \u2014 ${ordinal(_jPlace)} place</div>
    ${rpPortrait(jBooted, 'xl elim')}
    <div class="rp-elim-name">${jBooted}</div>
    <div class="rp-elim-arch">${vpArchLabel(jBooted)}</div>
    <div class="rp-elim-quote">"${_jQ}"</div>
    <div class="rp-elim-place">Episode ${ep.num} \u2014 Eliminated by the Jury</div>
  </div>`;

  html += `</div>`; // end results
  html += `</div>`; // end page
  return html;
}

export function rpBuildFanFavorite(ep) {
  const name = ep.fanFavorite || gs.fanFavorite;
  if (!name) return null;
  const score = ep.fanFavoriteScore ?? gs.popularity?.[name] ?? 0;
  const isWinner = ep.fanFavoriteIsWinner || (ep.winner === name);
  const arc = gs.popularityArcs?.[name] || [];
  const elimEp = gs.eliminated?.includes(name)
    ? (gs.episodeHistory || []).find(h => h.eliminated === name)?.num || null
    : null;

  // Find the biggest single-episode delta moment
  const biggestMoment = (gs.episodeHistory || []).reduce((best, h) => {
    const deltas = h.popularityDeltas?.[name];
    if (!deltas?.length) return best;
    const total = deltas.reduce((s, d) => s + d.delta, 0);
    return total > (best.total || 0) ? { ep: h.num, total, reason: deltas[0]?.reason || '' } : best;
  }, {});

  const reasonLabel = r => r.replace(/([A-Z])/g, ' $1').trim()
    .replace('bigMove Voted', 'Big Move — followed through')
    .replace('tribal Blowup', 'Tribal blowup')
    .replace('idol Play', 'Idol play')
    .replace('survived Top Votes', 'Survived being the top target')
    .replace('came Back From Bottom', 'Came back from the bottom')
    .replace('survived Idol Play', 'Survived an idol play')
    .replace('underdog Moment', 'Underdog moment')
    .replace('social Boost', 'Social lift')
    .replace('hard Work', 'Work ethic');

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Season Finale</div>
    <div class="rp-title">${isWinner ? 'Winner &amp; Fan Favorite' : 'Fan Favorite'}</div>
    <div style="text-align:center;margin:20px 0">
      ${rpPortrait(name, 'xl', '')}
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;margin-top:12px">${name}</div>
      <div style="font-size:13px;color:#e3b341;font-family:var(--font-mono);margin-top:6px;font-weight:700">POPULARITY SCORE: ${score}</div>
      ${elimEp ? `<div style="font-size:11px;color:var(--muted);margin-top:4px">Eliminated Episode ${elimEp} — but never forgotten.</div>` : ''}
    </div>`;

  if (arc.length) {
    html += `<div class="vp-section-header gold" style="margin-bottom:8px">Season Arc</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;align-items:center">
        ${arc.map(a => {
          const col = a.delta > 0 ? '#e3b341' : 'var(--accent-fire)';
          const sign = a.delta > 0 ? '+' : '';
          return `<span style="font-size:10px;color:${col};font-family:var(--font-mono)">Ep${a.ep}:${sign}${a.delta}</span>`;
        }).join('<span style="color:var(--border);padding:0 1px">·</span>')}
      </div>`;
  }

  if (biggestMoment.ep) {
    html += `<div class="vp-card gold" style="margin-top:4px">
      <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--muted);margin-bottom:4px">DEFINING MOMENT</div>
      <div style="font-size:12px;color:#e6edf3">Episode ${biggestMoment.ep} — ${reasonLabel(biggestMoment.reason)}</div>
      <div style="font-size:11px;color:#e3b341;font-family:var(--font-mono);margin-top:4px">+${biggestMoment.total} this episode</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

// ══════════════════════════════════════════════════════════════════════
// AWAKE-A-THON VP SCREEN  (Overdrive: Campfire Under the Stars)
// ══════════════════════════════════════════════════════════════════════






// ══════════════════════════════════════════════════════════════════════════════
// VP: PAINTBALL DEER HUNTER
// ══════════════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════════════
// VP: WHO CAN YOU TRUST?
// ══════════════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════
// DODGEBRAWL VP SCREEN  (Overdrive: Broadcast Court)
// ══════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════
// CLIFF DIVE VP SCREEN  (Overdrive: Vertigo + Confessional)
// ══════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════
// X-TREME TORTURE VP SCREEN  (Overdrive: Three Events · Click-to-Reveal)
// ══════════════════════════════════════════════════════════════════════


// PHOBIA FACTOR VP SCREENS
// ══════════════════════════════════════════════════════════════════════






// ══════════════════════════════════════════════════════════════════════
// LUCKY HUNT VP SCREEN
// ══════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
// BASIC STRAINING VP SCREEN
// ══════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════
// VP: BRUNCH OF DISGUSTINGNESS
// ══════════════════════════════════════════════════════════════════════





// ══════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
// SAY UNCLE VP SCREENS
// ══════════════════════════════════════════════════════════════════════

// ── Say Uncle VP helpers ──




// TRIPLE DOG DARE VP SCREENS
// ══════════════════════════════════════════════════════════════════════




// ══════════════════════════════════════════════════════════════════════
// SLASHER NIGHT VP SCREENS
// ══════════════════════════════════════════════════════════════════════









// ── CONTROLLER ──
