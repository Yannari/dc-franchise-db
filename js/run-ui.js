// ══════════════════════════════════════════════════════════════════════
// run-ui.js — Run tab, episode management, setup panels, twist catalog
// ══════════════════════════════════════════════════════════════════════

export let _spoilerFree = false;
export function set_spoilerFree(v) { _spoilerFree = v; }

export function initRunTab() {
  if (!gs) {
    if (players.length > 0) initGameState();
  }
  renderRunTab();
}

export function renderRunTab() {
  renderGameState();
  const empty   = document.getElementById('run-empty');
  const content = document.getElementById('run-content');

  if (!gs || !gs.initialized) {
    empty.style.display = 'flex'; content.style.display = 'none'; return;
  }
  empty.style.display = 'none'; content.style.display = 'flex'; content.style.flexDirection = 'column';

  // Show episode or placeholder
  const replayBtn = document.getElementById('replay-btn');
  if (!gs.episodeHistory.length) {
    document.getElementById('ep-result-card').innerHTML = '';
    document.getElementById('ep-output-text').value = '';
    document.getElementById('ep-history-wrap').style.display = 'none';
    if (replayBtn) replayBtn.style.display = 'none';
  } else {
    const epToShow = viewingEpNum ? gs.episodeHistory.find(e=>e.num===viewingEpNum) : gs.episodeHistory[gs.episodeHistory.length-1];
    if (epToShow) renderEpisodeView(epToShow);
    renderEpisodeHistory();
    document.getElementById('ep-history-wrap').style.display = 'flex';
    // Show replay button only when a checkpoint exists for the viewed episode
    const _viewNum = viewingEpNum || gs.episodeHistory[gs.episodeHistory.length-1]?.num;
    if (replayBtn) replayBtn.style.display = gsCheckpoints[_viewNum] ? 'block' : 'none';
  }
}

export function renderGameState() {
  const el = document.getElementById('gs-summary');
  const btn = document.getElementById('sim-btn');
  if (!gs || !gs.initialized) {
    el.innerHTML = `<div style="font-size:12px;color:var(--muted);line-height:1.6">Add players in Cast Builder and configure the season in Season Setup first.</div>`;
    btn.textContent = 'Initialize Season'; btn.disabled = false; return;
  }

  // Use episode snapshot when viewing history, live state when on latest
  const viewedEp = viewingEpNum ? gs.episodeHistory.find(e => e.num === viewingEpNum) : null;
  const d = viewedEp?.gsSnapshot || gs;
  const isHistorical = !!(viewedEp?.gsSnapshot);

  const phaseLabel = d.phase==='pre-merge'?'Pre-Merge':d.phase==='post-merge'?'Post-Merge':d.phase==='complete'?'Complete':'Finale';
  let html = `<div class="gs-stats">
    <div class="gs-stat"><label>Episode</label><strong>${d.episode}</strong></div>
    <div class="gs-stat"><label>Phase</label><strong>${phaseLabel}</strong></div>
    <div class="gs-stat"><label>Active</label><strong>${d.activePlayers.length}</strong></div>
    <div class="gs-stat"><label>On RI</label><strong style="color:${d.riPlayers.length?'#f97316':'var(--muted)'}">${d.riPlayers.length}</strong></div>
  </div>`;

  if (_spoilerFree) {
    html += `<div style="margin-top:12px;font-size:11px;color:var(--muted);font-style:italic;text-align:center">Spoiler-free mode — open Visual Player to watch the episode</div>`;
    el.innerHTML = html;
    btn.textContent = d.phase === 'complete' ? 'Season Complete' : 'Simulate Next Episode';
    btn.disabled = d.phase === 'complete';
    const _sf5 = document.getElementById('sim-5-btn');
    const _sfAll = document.getElementById('sim-all-btn');
    const _sfShow = d.phase !== 'complete' && d.phase !== 'finale';
    if (_sf5) _sf5.style.display = _sfShow ? '' : 'none';
    if (_sfAll) _sfAll.style.display = _sfShow ? '' : 'none';
    return;
  }

  if (d.phase === 'pre-merge' && d.tribes.length) {
    html += `<div style="margin-top:8px">`;
    d.tribes.forEach(t => {
      const tc = tribeColor(t.name);
      html += `<div class="gs-tribe"><div class="gs-tribe-name" style="color:${tc}">${t.name} (${t.members.length})</div><div class="gs-tribe-members">${t.members.join(' \u00b7 ')}</div></div>`;
    });
    html += `</div>`;
  } else {
    html += `<div class="gs-tribe" style="margin-top:8px"><div class="gs-tribe-name" style="color:var(--accent)">Active (${d.activePlayers.length})</div><div class="gs-tribe-members">${d.activePlayers.join(' \u00b7 ')}</div></div>`;
  }

  if (d.riPlayers.length) {
    html += `<div class="gs-section"><label>On RI</label><div class="gs-ri-list">${d.riPlayers.join(', ')}</div></div>`;
  }

  // Persistent strategic alliances — always shown for all tribes
  const realAlliances = (d.namedAlliances || []).filter(a =>
    a.active && a.members.filter(m => d.activePlayers.includes(m)).length >= 2
  );
  if (realAlliances.length) {
    html += `<div class="gs-section"><label>Alliances</label>`;
    realAlliances.forEach(a => {
      const live = a.members.filter(m => d.activePlayers.includes(m));
      // In pre-merge, check if alliance is split across tribes
      const isSplit = d.phase === 'pre-merge' && d.tribes.length &&
        new Set(live.map(m => d.tribes.find(t => t.members.includes(m))?.name).filter(Boolean)).size > 1;
      const memberLabels = live.map(m => {
        if (isSplit && d.tribes.length) {
          const tribe = d.tribes.find(t => t.members.includes(m));
          return tribe ? `${m} <span style="opacity:0.5;font-size:9px">(${tribe.name})</span>` : m;
        }
        return m;
      });
      const betrayalNote = a.betrayals?.length ? ` · ${a.betrayals.length} betrayal${a.betrayals.length > 1 ? 's' : ''}` : '';
      const quitNote = a.quits?.length ? ` · ${a.quits.length} quit${a.quits.length > 1 ? 's' : ''}` : '';
      const splitNote = isSplit ? ` · <span style="color:#f97316;font-size:9px">SPLIT</span>` : '';
      html += `<div class="gs-alliance"><span class="gs-alliance-label">${a.name}${betrayalNote}${quitNote}${splitNote}</span><span class="gs-alliance-members">${memberLabels.join(', ')}</span></div>`;
    });
    html += `</div>`;
  }
  // Episode consensus — shown for the viewed episode's tribal vote
  const episodeConsensus = (viewedEp?.alliances || []).filter(a => a.type === 'consensus' && a.members.length >= 2 && a.target);
  if (episodeConsensus.length) {
    html += `<div class="gs-section"><label>This Vote (Ep.${viewedEp.num})</label>`;
    episodeConsensus.forEach(a => {
      html += `<div class="gs-alliance"><span class="gs-alliance-label">${a.label}</span><span class="gs-alliance-members">${a.members.join(', ')}</span>${a.target ? `<span class="gs-alliance-target">\u2192 ${a.target}</span>` : ''}</div>`;
    });
    html += `</div>`;
  }

  if (d.eliminated.length) {
    html += `<div class="gs-section"><label>Eliminated</label><div class="gs-elim-list">${d.eliminated.join(', ')}</div></div>`;
  }

  el.innerHTML = html;

  // Update button
  const sim5Btn = document.getElementById('sim-5-btn');
  const simAllBtn = document.getElementById('sim-all-btn');
  if (gs.phase === 'complete' || gs.activePlayers.length <= 1) {
    btn.textContent = 'Season Complete'; btn.disabled = true;
    if (sim5Btn) sim5Btn.style.display = 'none';
    if (simAllBtn) simAllBtn.style.display = 'none';
  } else if (gs.phase === 'finale') {
    btn.textContent = `Simulate Finale (Ep. ${gs.episode+1})`; btn.disabled = false;
    if (sim5Btn) sim5Btn.style.display = 'none';
    if (simAllBtn) simAllBtn.style.display = 'none';
  } else {
    btn.textContent = `Simulate Episode ${gs.episode+1}`; btn.disabled = false;
    if (sim5Btn) sim5Btn.style.display = '';
    if (simAllBtn) simAllBtn.style.display = '';
  }
}

export function renderEpisodeView(epRecord) {
  const card = document.getElementById('ep-result-card');
  const tc = epRecord.isFinale ? '#f59e0b' : epRecord.isMerge ? '#10b981' : epRecord.challengeType==='tribe' ? tribeColor(epRecord.immunityWinner||'') : '#6366f1';
  const phaseTag = epRecord.isFinale ? 'FINALE' : epRecord.isMerge ? 'MERGE' : epRecord.challengeType==='tribe' ? 'Pre-merge' : 'Post-merge';
  const riTag = epRecord.riChoice === 'REDEMPTION ISLAND' ? `<span class="ep-hist-tag" style="background:rgba(249,115,22,0.15);color:#f97316">RI</span>` : epRecord.riChoice === 'WENT HOME' ? `<span class="ep-hist-tag" style="background:rgba(148,163,184,0.1);color:var(--muted)">Home</span>` : '';

  const voteEntries = Object.entries(epRecord.votes||{}).sort(([,a],[,b])=>b-a);
  const topVotes = voteEntries[0]?.[1] || 0;
  const chips = voteEntries.map(([n,v]) => `<span class="ep-vote-chip ${v===topVotes?'top':''}">${n}: ${v}</span>`).join('');

  const _sfElim = _spoilerFree ? '???'
    : epRecord.multiTribalElims?.length >= 2 ? epRecord.multiTribalElims.join(' + ')
    : epRecord.firstEliminated ? `${epRecord.firstEliminated} + ${epRecord.eliminated||'?'}`
    : (epRecord.eliminated||'None');

  card.innerHTML = `<div class="ep-result">
    <div class="ep-result-header">
      <span class="ep-result-num">Episode ${epRecord.num}</span>
      <span class="ep-result-phase" style="color:${tc}">${phaseTag}</span>
      ${epRecord.isMerge?`<span class="ep-result-phase" style="color:#10b981;font-weight:700">MERGE!</span>`:''}
    </div>
    <div class="ep-facts">
      <div class="ep-fact"><label>Immunity</label><span>${epRecord.immunityWinner||'—'}</span></div>
      <div class="ep-fact"><label>Tribal</label><span>${epRecord.challengeType==='tribe'?(epRecord.immunityWinner?epRecord.immunityWinner+' wins':(voteEntries.length?'Vote follows':'—')):'All vote'}</span></div>
      <div class="ep-fact ep-eliminated"><label>Eliminated</label><span>${_sfElim} ${_spoilerFree ? '' : riTag}</span></div>
      ${_spoilerFree ? '' : `<div class="ep-fact"><label>Votes</label><span>${Object.values(epRecord.votes||{}).reduce((a,b)=>a+b,0)} cast</span></div>`}
    </div>
    ${_spoilerFree ? `<div style="margin-top:8px;font-size:11px;color:var(--muted);font-style:italic;text-align:center">Spoiler-free mode — open Visual Player to watch the episode</div>` : `<div style="margin-top:4px;margin-bottom:0"><div style="font-size:10px;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px">Vote breakdown</div><div class="ep-vote-list">${chips}</div></div>`}
  </div>`;

  document.getElementById('ep-output-text').value = _spoilerFree ? '' : (epRecord.summaryText || '');
}


// Sync on page load — restore from localStorage
window.addEventListener('DOMContentLoaded', () => {
  const _sfSaved = localStorage.getItem('simulator_spoilerFree') === 'true';
  const _sfCb = document.getElementById('cfg-spoiler-free');
  if (_sfCb) { _sfCb.checked = _sfSaved; }
  _spoilerFree = _sfSaved;
  // Load roster: localStorage edits > fetched JSON > embedded fallback
  const _savedRoster = localStorage.getItem('simulator_franchise_roster');
  if (_savedRoster) {
    try {
      const _parsed = JSON.parse(_savedRoster);
      if (Array.isArray(_parsed) && _parsed.length) {
        FRANCHISE_ROSTER = _parsed;
        console.log(`Roster loaded from localStorage: ${_parsed.length} players`);
      }
    } catch(e) {}
  }
  // Also try fetching the JSON (GitHub Pages) — but localStorage edits take priority
  if (!_savedRoster) {
    fetch('franchise_roster.json')
      .then(r => r.json())
      .then(data => {
        if (data?.players?.length) {
          FRANCHISE_ROSTER = data.players;
          console.log(`Roster loaded from JSON: ${data.players.length} players`);
        }
      })
      .catch(() => {}); // silent fallback to embedded copy
  }
});
export function toggleSpoilerFree() {
  _spoilerFree = document.getElementById('cfg-spoiler-free')?.checked || false;
  try { localStorage.setItem('simulator_spoilerFree', _spoilerFree); } catch(e) {}
  renderEpisodeHistory();
  const epToShow = viewingEpNum ? gs.episodeHistory.find(e => e.num === viewingEpNum) : gs.episodeHistory[gs.episodeHistory.length - 1];
  if (epToShow) renderEpisodeView(epToShow);
}

export function renderEpisodeHistory() {
  const grid = document.getElementById('ep-history-grid');
  const history = gs.episodeHistory;
  if (!history.length) { grid.innerHTML=''; return; }

  const currentNum = viewingEpNum || history[history.length-1].num;
  grid.innerHTML = history.map(ep => {
    const riTag = ep.riChoice==='REDEMPTION ISLAND' ? `<span class="ep-hist-tag" style="background:rgba(249,115,22,0.15);color:#f97316">RI</span>` : ep.riChoice==='WENT HOME' ? `<span class="ep-hist-tag" style="background:rgba(148,163,184,0.1);color:var(--muted)">Home</span>` : '';
    const mergeTag = ep.isMerge ? `<span class="ep-hist-tag" style="background:rgba(16,185,129,0.15);color:var(--accent)">MERGE</span>` : '';
    const finaleTag = ep.isFinale ? `<span class="ep-hist-tag" style="background:rgba(245,158,11,0.15);color:#f59e0b">FINALE</span>` : '';
    const slasherTag = ep.isSlasherNight ? `<span class="ep-hist-tag" style="background:rgba(218,54,51,0.15);color:#da3633">Slasher Night</span>` : '';
    const tddTag = ep.isTripleDogDare ? `<span class="ep-hist-tag" style="background:rgba(245,158,11,0.15);color:#f59e0b">Triple Dog Dare</span>` : '';
    const suTag = ep.isSayUncle ? `<span class="ep-hist-tag" style="background:rgba(245,158,11,0.15);color:#f59e0b">Say Uncle</span>` : '';
    const brunchTag = ep.isBrunchOfDisgustingness ? `<span class="ep-hist-tag" style="background:rgba(74,222,128,0.15);color:#4ade80">Brunch</span>` : '';
    const bsTag = ep.isBasicStraining ? `<span class="ep-hist-tag" style="background:rgba(76,81,41,0.25);color:#c4a43c">Basic Straining</span>` : '';
    const pfTag = ep.isPhobiaFactor ? `<span class="ep-hist-tag" style="background:rgba(139,92,246,0.15);color:#8957e5">Phobia Factor</span>` : '';
    const cdTag = ep.isCliffDive ? `<span class="ep-hist-tag" style="background:rgba(244,112,103,0.15);color:#f47067">Cliff Dive</span>` : '';
    const aatTag = ep.isAwakeAThon ? `<span class="ep-hist-tag" style="background:rgba(139,92,246,0.15);color:#8b5cf6">Awake-A-Thon</span>` : '';
    const evTag = ep.emissaryEliminated ? `<span class="ep-hist-tag" style="background:rgba(240,165,0,0.15);color:#f0a500">Emissary Vote</span>` : '';
    const dbTag = ep.isDodgebrawl ? `<span class="ep-hist-tag" style="background:rgba(224,96,48,0.15);color:#e06030">Dodgebrawl</span>` : '';
    const tsTag = ep.isTalentShow ? `<span class="ep-hist-tag" style="background:rgba(139,92,246,0.15);color:#8b5cf6">Talent Show</span>` : '';
    const soTag = ep.isSuckyOutdoors ? `<span class="ep-hist-tag" style="background:rgba(63,185,80,0.15);color:#3fb950">Sucky Outdoors</span>` : '';
    const utcTag = ep.isUpTheCreek ? `<span class="ep-hist-tag" style="background:rgba(88,166,255,0.15);color:#58a6ff">Up the Creek</span>` : '';
    const phTag = ep.isPaintballHunt ? `<span class="ep-hist-tag" style="background:rgba(63,185,80,0.15);color:#3fb950">Paintball Hunt</span>` : '';
    const hkTag = ep.isHellsKitchen ? `<span class="ep-hist-tag" style="background:rgba(249,115,22,0.15);color:#f97316">Hell's Kitchen</span>` : '';
    const tcTag = ep.isTrustChallenge ? `<span class="ep-hist-tag" style="background:rgba(56,189,248,0.15);color:#38bdf8">Trust Challenge</span>` : '';
    const xtTag = ep.isXtremeTorture ? `<span class="ep-hist-tag" style="background:rgba(239,68,68,0.15);color:#ef4444">X-Treme Torture</span>` : '';
    const lhTag = ep.isLuckyHunt ? `<span class="ep-hist-tag" style="background:rgba(180,130,70,0.15);color:#d4a853">Lucky Hunt</span>` : '';
    const hsTag = ep.isHideAndBeSneaky ? `<span class="ep-hist-tag" style="background:rgba(0,255,65,0.12);color:#00ff41">Hide&Seek</span>` : '';
    const otcTag = ep.isOffTheChain ? `<span class="ep-hist-tag" style="background:rgba(255,107,0,0.15);color:#ff6b00">Off Chain</span>` : '';
    const wwTag = ep.isWawanakwaGoneWild ? `<span class="ep-hist-tag" style="background:rgba(212,160,23,0.15);color:#d4a017">Gone Wild!</span>` : '';
    const taTag = ep.isTriArmedTriathlon ? `<span class="ep-hist-tag" style="background:rgba(200,100,30,0.12);color:#c8641e">Tri-Armed</span>` : '';
    const hasCheckpoint = !!gsCheckpoints[ep.num];
    const replayBtn = hasCheckpoint
      ? `<button class="ep-hist-replay" title="Re-run this episode" onclick="event.stopPropagation();replayEpisode(${ep.num})">↺</button>`
      : '';
    return `<div class="ep-hist-card ${ep.num===currentNum?'active':''}" onclick="viewEpisode(${ep.num})">
      <div class="ep-hist-ep">Episode ${ep.num}${replayBtn}</div>
      <div class="ep-hist-elim">${_spoilerFree ? '???' : ep.multiTribalElims?.length >= 2 ? ep.multiTribalElims.join(' + ') : ep.ambassadorData?.ambassadorEliminated ? `${ep.ambassadorData.ambassadorEliminated} + ${ep.eliminated||'?'}` : ep.tiedDestinies?.eliminatedPartner ? `${ep.eliminated||'?'} + ${ep.tiedDestinies.eliminatedPartner}` : ep.emissaryEliminated ? `${ep.eliminated||'?'} + ${ep.emissaryEliminated}` : ep.firstEliminated ? `${ep.firstEliminated} + ${ep.eliminated||'?'}` : (ep.eliminated || (ep.isFinale ? 'FTC' : '\u2014'))}</div>
      <div>${riTag}${mergeTag}${finaleTag}${slasherTag}${tddTag}${suTag}${brunchTag}${bsTag}${pfTag}${cdTag}${aatTag}${evTag}${dbTag}${tsTag}${soTag}${utcTag}${phTag}${hkTag}${tcTag}${xtTag}${lhTag}${hsTag}${otcTag}${wwTag}${taTag}</div>
    </div>`;
  }).join('');
}

export function viewEpisode(num) {
  viewingEpNum = num;
  const epRecord = gs.episodeHistory.find(e=>e.num===num);
  if (epRecord) { renderEpisodeView(epRecord); renderEpisodeHistory(); renderGameState(); }
}

export function simulateNext() {
  if (!gs) { if (!initGameState()) { alert('Add players to Cast Builder first.'); return; } }
  // Fire-making / Koh-Lanta override: force F4 finale
  const _needsF4Finale = seasonConfig.firemaking || seasonConfig.finaleFormat === 'fire-making' || seasonConfig.finaleFormat === 'koh-lanta';
  if (_needsF4Finale) {
    if (seasonConfig.finaleSize < 4) seasonConfig.finaleSize = 4;
    if (gs.phase === 'finale' && gs.activePlayers.length > 4) {
      gs.phase = 'post-merge';
    }
  }
  const ep = gs.phase === 'finale' ? simulateFinale() : simulateEpisode();
  if (!ep) return;
  // Aftermath Reunion: generate for finale since simulateFinale doesn't call patchEpisodeHistory
  if (ep.winner && !ep.aftermath && seasonConfig.aftermath === 'enabled') {
    generateAftermathShow(ep);
    if (ep.aftermath) {
      const h = gs.episodeHistory[gs.episodeHistory.length - 1];
      if (h) h.aftermath = ep.aftermath;
    }
  }
  if (seasonConfig.popularityEnabled !== false) { updatePopularity(ep); saveGameState(); }
  viewingEpNum = ep.num;
  renderRunTab();
  document.getElementById('run-main').scrollTop = 0;
}

export function simulateMultipleEpisodes(count) {
  if (!gs || !gs.initialized) { alert('Start a season first.'); return; }
  const max = count || 999;
  let ran = 0;
  const runOne = () => {
    if (ran >= max || gs.phase === 'complete' || gs.activePlayers.length <= 1) {
      renderRunTab();
      document.getElementById('run-main').scrollTop = 0;
      return;
    }
    simulateNext();
    ran++;
    if (gs.phase !== 'complete' && gs.activePlayers.length > 1 && ran < max) {
      setTimeout(runOne, 0);
    } else {
      // already rendered by simulateNext on last call
    }
  };
  runOne();
}

export function replayEpisode(epNum) {
  const checkpoint = gsCheckpoints[epNum];
  if (!checkpoint) { alert(`No checkpoint saved for Episode ${epNum}. Only episodes run in this session can be replayed.`); return; }
  const laterEps = gs.episodeHistory.filter(e => e.num > epNum);
  const warnMsg = laterEps.length
    ? `Re-run Episode ${epNum}?\n\nEpisodes ${epNum}–${epNum + laterEps.length} will be replaced with new results.`
    : `Re-run Episode ${epNum}?`;
  if (!confirm(warnMsg)) return;
  // Restore gs to state before this episode ran
  gs = JSON.parse(JSON.stringify(checkpoint));
  repairGsSets(gs);
  // Drop checkpoints for this ep and later (they'll be re-created on next run)
  Object.keys(gsCheckpoints).forEach(k => {
    if (Number(k) >= epNum) {
      delete gsCheckpoints[k];
      try { localStorage.removeItem('simulator_cp_' + k); } catch(e) {}
    }
  });
  // Re-run this episode — check if we're replaying the finale
  const _isFinaleReplay = gs.phase === 'finale';
  const ep = _isFinaleReplay ? simulateFinale() : simulateEpisode();
  if (!ep) return;
  if (seasonConfig.popularityEnabled !== false) { updatePopularity(ep); saveGameState(); }
  viewingEpNum = ep.num;
  renderRunTab();
  document.getElementById('run-main').scrollTop = 0;
}

export function copyOutput() {
  const ta = document.getElementById('ep-output-text');
  ta.select(); document.execCommand('copy');
  const btn = event.target; btn.textContent = 'Copied!'; setTimeout(()=>btn.textContent='Copy', 1500);
}

export function exportToEpisodePipeline() {
  // Save to localStorage so current-season.html can pick it up as a cached summary
  const epRecord = viewingEpNum ? gs.episodeHistory.find(e=>e.num===viewingEpNum) : gs.episodeHistory[gs.episodeHistory.length-1];
  if (!epRecord) return;
  const key = `AI_SUMMARY_s${prompt('Which season number are you using in current-season.html?','10')}_e${epRecord.num}`;
  if (!key.includes('null')) {
    localStorage.setItem(key, epRecord.summaryText);
    alert(`Saved! In current-season.html: select season + episode ${epRecord.num}, leave BrantSteele field empty, click Generate Episode.`);
  }
}

// ══════════════════════════════════════════════════════════════════════
// SETUP PANEL NAVIGATION
// ══════════════════════════════════════════════════════════════════════

export function showSetupPanel(name) {
  document.querySelectorAll('.setup-panel').forEach(p => p.classList.remove('active-panel'));
  document.querySelectorAll('.setup-subnav-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('setup-panel-' + name);
  const btn   = document.getElementById('subnav-' + name);
  if (panel) panel.classList.add('active-panel');
  if (btn)   btn.classList.add('active');
  if (name === 'format') { renderTimeline(); renderTwistCatalog(); }
}

export function toggleAccordion(id) {
  const body    = document.getElementById('acc-body-' + id);
  const chevron = document.getElementById('acc-chevron-' + id);
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display    = open ? 'none' : 'block';
  if (chevron) chevron.textContent = open ? '▼' : '▲';
}

export function updateSlider(name) {
  const el  = document.getElementById('cfg-' + name);
  const disp = document.getElementById(name + '-display');
  if (el && disp) disp.textContent = el.value;
}

export function updateCastSizeDisplay() {
  const count = players.length;
  const disp  = document.getElementById('cast-size-display');
  const fill  = document.getElementById('cast-size-fill');
  if (disp) disp.textContent = count;
  if (fill) fill.style.width = Math.min(count / 24 * 100, 100) + '%';
}

export function setGameMode(mode) {
  seasonConfig.gameMode = mode;
  document.querySelectorAll('.game-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
}

export function saveAdvantage(key) {
  const en = document.getElementById('adv-' + key + '-enabled');
  const ct = document.getElementById('adv-' + key + '-count');
  if (!en || !ct) return;
  if (!seasonConfig.advantages) seasonConfig.advantages = {};
  seasonConfig.advantages[key] = { enabled: en.checked, count: parseInt(ct.value) || 0 };
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
}

export function updateSurvivalDesc() {
  const mode = document.getElementById('cfg-food-water')?.value || 'disabled';
  const group = document.getElementById('survival-difficulty-group');
  const desc  = document.getElementById('survival-desc');
  if (group) group.style.display = mode === 'disabled' ? 'none' : 'block';
  // Show/hide auto-reward checkbox
  const _arRow2 = document.getElementById('auto-reward-row');
  const _arDesc2 = document.getElementById('auto-reward-desc');
  if (_arRow2) _arRow2.style.display = mode === 'enabled' ? '' : 'none';
  if (_arDesc2) _arDesc2.style.display = mode === 'enabled' ? '' : 'none';
  // Show/hide replacement + reward sharing checkboxes
  const _repRow2 = document.getElementById('replacement-row');
  const _repDesc2 = document.getElementById('replacement-desc');
  if (_repRow2) _repRow2.style.display = mode === 'enabled' ? '' : 'none';
  if (_repDesc2) _repDesc2.style.display = mode === 'enabled' ? '' : 'none';
  const _rsRow2 = document.getElementById('reward-sharing-row');
  const _rsDesc2 = document.getElementById('reward-sharing-desc');
  if (_rsRow2) _rsRow2.style.display = mode === 'enabled' ? '' : 'none';
  if (_rsDesc2) _rsDesc2.style.display = mode === 'enabled' ? '' : 'none';
  if (desc) {
    const text = {
      disabled: 'Disabled: No food or water tracking. Players have unlimited resources.',
      enabled:  'Enabled: Players must manage food and water. Affects morale and performance.',
    };
    desc.textContent = text[mode] || '';
  }
}

export function updateMoleUI() {
  const mode = document.getElementById('cfg-mole')?.value || 'disabled';
  const chooseGrp = document.getElementById('mole-choose-group');
  const coordGrp  = document.getElementById('mole-coordination-group');
  const desc      = document.getElementById('mole-desc');
  if (chooseGrp) chooseGrp.style.display = mode === 'choose' ? 'block' : 'none';
  if (coordGrp) coordGrp.style.display = (mode === '2-random' || mode === 'choose') ? 'block' : 'none';
  if (desc) {
    const text = {
      'disabled':  'Disabled: No Mole twist this season.',
      '1-random':  '1 random player is secretly assigned as The Mole. They sabotage challenges, leak info, and stir conflict — all while trying to stay hidden.',
      '2-random':  '2 random players are secretly assigned as Moles. They can operate independently or as a coordinated team.',
      'choose':    'You choose who becomes The Mole (up to 2 players).',
    };
    desc.textContent = text[mode] || '';
  }
  // Populate player select when in choose mode — portrait grid like alliance picker
  if (mode === 'choose') {
    const container = document.getElementById('mole-player-select');
    if (container && typeof players !== 'undefined' && players.length) {
      const selected = (seasonConfig.molePlayers || []);
      container.innerHTML = players.map(p => {
        const sel = selected.includes(p.name);
        const slug = p.slug || p.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
        const init = (p.name || '?')[0].toUpperCase();
        return `<div data-member="${p.name}" data-selected="${sel}" onclick="toggleMolePlayer('${p.name.replace(/'/g,"\\'")}')" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;width:48px">
          <div style="width:36px;height:36px;border-radius:50%;border:3px solid ${sel ? '#f85149' : 'transparent'};overflow:hidden;position:relative;background:var(--surface2);transition:border-color 0.15s">
            <img src="assets/avatars/${slug}.png" style="width:100%;height:100%;object-fit:cover;border-radius:50%;${sel ? '' : 'filter:grayscale(0.5);opacity:0.6;'}transition:filter 0.15s,opacity 0.15s" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
            <span style="display:none;font-size:14px;font-weight:700;color:var(--muted);align-items:center;justify-content:center;width:100%;height:100%;position:absolute;top:0;left:0">${init}</span>
          </div>
          <span style="font-size:9px;color:${sel ? '#f85149' : 'var(--muted)'};text-align:center;line-height:1.1;max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color 0.15s">${p.name}</span>
        </div>`;
      }).join('');
    }
  }
}

export function toggleMolePlayer(name) {
  if (!seasonConfig.molePlayers) seasonConfig.molePlayers = [];
  const idx = seasonConfig.molePlayers.indexOf(name);
  if (idx >= 0) {
    seasonConfig.molePlayers.splice(idx, 1);
  } else if (seasonConfig.molePlayers.length < 2) {
    seasonConfig.molePlayers.push(name);
  }
  // Re-render grid to update highlight states
  updateMoleUI();
  saveConfig();
}


export function runFanVote() {
  const outcomes = [
    { field:'teams', options:[2,3], label:'teams' },
    { field:'mergeAt', options:[10,11,12,13], label:'merge at' },
    { field:'jurySize', options:[7,9,11], label:'jury members' },
  ];
  let changed = false;
  outcomes.forEach(o => {
    if (Math.random() < 0.5) {
      const pick = o.options[Math.floor(Math.random() * o.options.length)];
      seasonConfig[o.field] = pick;
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
    renderConfig();
    alert('Fan vote complete! Check the sliders — fans have spoken.');
  } else {
    alert('Fan vote: fans were satisfied with current settings.');
  }
}

// ══════════════════════════════════════════════════════════════════════
// EPISODE FORMAT DESIGNER
// ══════════════════════════════════════════════════════════════════════

// Returns an array of { ep, active, phase, engineType } for every episode in the season
export function buildEpisodeMap() {
  const cast    = players.length || 18;
  const finale  = seasonConfig.finaleSize || 3;
  const mergeAt = seasonConfig.mergeAt || 12;
  const riActive = seasonConfig.ri;

  // Build ep→engineTypes lookup from the twist schedule (ALL twists per episode)
  const twistMap = {};
  const twistMapAll = {}; // all engine types on this episode
  (seasonConfig.twistSchedule || []).forEach(t => {
    const cat = TWIST_CATALOG.find(c => c.id === t.type);
    const et = cat?.engineType || t.type;
    twistMap[Number(t.episode)] = et;
    if (!twistMapAll[Number(t.episode)]) twistMapAll[Number(t.episode)] = [];
    twistMapAll[Number(t.episode)].push(et);
  });

  const eps = [];
  let active  = cast;
  let ep      = 1;
  let merged  = false;
  let _riReturn1Used = false;
  let _riReturn2Used = false;
  let _totalElimsToHere = 0;
  let _lastFVReturn = 0;
  let _fvReturnApplied = false;

  while (active > finale && ep <= 100) {
    const etype = twistMap[ep] || null;
    const _allTypes = twistMapAll[ep] || [];

    // How many players leave/return this episode?
    // Check ALL twists on this episode (not just the last one)
    let elims = 1;
    if (_allTypes.includes('no-tribal')) elims = 0;
    if (_allTypes.includes('elimination-swap')) elims = 0;
    // Account for Team Swap advantages that cancelled eliminations mid-season
    if (gs?.skippedEliminationEps?.includes(ep)) elims = 0;
    if (_allTypes.includes('double-elim')) elims = Math.max(elims, 2);
    if (_allTypes.includes('multi-tribal') && !merged) elims = Math.max(elims, Math.max(2, (seasonConfig.teams || 2) - 1));
    if (_allTypes.includes('slasher-night')) elims = Math.max(elims, 1);
    if (_allTypes.includes('sudden-death')) elims = Math.max(elims, 1);
    if (_allTypes.includes('ambassadors')) elims = Math.max(elims, 2);
    if (_allTypes.includes('tied-destinies')) elims = Math.max(elims, 2);
    if (_allTypes.includes('emissary-vote')) elims = Math.max(elims, 2);
    // Exile Duel: person goes to exile (0 elims this ep) — duel happens next episode (1 elim)
    if (_allTypes.includes('exile-duel')) elims = 0;
    _totalElimsToHere += elims;
    let returns = _allTypes.includes('second-chance') ? 1 : 0;
    const _rpTwist = (seasonConfig.twistSchedule||[]).filter(t => Number(t.episode) === ep).find(t => t.type === 'returning-player');
    if (_rpTwist) returns += (_rpTwist.returnCount || 1);
    // Fan vote return: pending return from live game adds +1 this episode
    if (gs?.pendingFanVoteReturn && gs.eliminated?.includes(gs.pendingFanVoteReturn) && !_fvReturnApplied) {
      returns++; _fvReturnApplied = true;
    }
    // Fan vote prediction: ONCE after X total eliminations, someone comes back NEXT episode
    const _fvThresholdCfg = parseInt(seasonConfig.fanVoteFrequency) || 0;
    if (_fvThresholdCfg && !_lastFVReturn && _totalElimsToHere >= _fvThresholdCfg) {
      _lastFVReturn = _totalElimsToHere; // mark it — return applies next iteration
    }
    // Apply the return on the episode AFTER the fan vote fired
    if (_lastFVReturn && _lastFVReturn !== _totalElimsToHere && !_fvReturnApplied) {
      returns++; _fvReturnApplied = true;
    }

    // RI return: fires when the episode STARTS with <= riReentryAt players.
    const _riReentryAt = seasonConfig.riReentryAt || seasonConfig.mergeAt || mergeAt;
    let riReturn = 0;
    if (riActive && !_riReturn1Used && active <= _riReentryAt) {
      riReturn = 1;
      _riReturn1Used = true;
    }
    if (riActive && _riReturn1Used && !_riReturn2Used && (seasonConfig.riReturnPoints || 1) >= 2 && active <= (seasonConfig.riSecondReturnAt || 5)) {
      riReturn++;
      _riReturn2Used = true;
    }

    // Merge fires when pre-return count <= mergeAt (matches engine: _preReturnActive subtracts returns)
    if (!merged && active <= mergeAt) merged = true;

    const activeWithReturns = active + returns + riReturn;
    const _hasFVReturn = _fvReturnApplied && returns > 0 && !eps.some(e => e.fanVoteReturn);
    eps.push({ ep, active, phase: merged ? 'post-merge' : 'pre-merge', engineType: etype, fanVoteReturn: _hasFVReturn || false });
    active = Math.max(finale, activeWithReturns - elims);
    ep++;

    // Team Swap advantage: insert blank episode right after (no elimination happened, season extends by 1)
    if (gs?.skippedEliminationEps?.includes(ep - 1) && active > finale) {
      if (!merged && active <= mergeAt) merged = true;
      eps.push({ ep, active, phase: merged ? 'post-merge' : 'pre-merge', engineType: null });
      active = Math.max(finale, active - 1);
      ep++;
    }

    // Exile Duel: insert extra episode for the duel resolution (1 elim, no twist)
    if (_allTypes.includes('exile-duel') && active > finale) {
      if (!merged && active <= mergeAt) merged = true;
      eps.push({ ep, active, phase: merged ? 'post-merge' : 'pre-merge', engineType: null });
      active = Math.max(finale, active - 1); // duel resolves — 1 person eliminated
      ep++;
    }
  }

  eps.push({ ep, active: finale, phase: 'finale', engineType: null });
  return eps;
}

export function renderTimeline() {
  const container = document.getElementById('fd-timeline');
  if (!container) return;
  const epMap   = buildEpisodeMap();
  const schedule = seasonConfig.twistSchedule || [];

  if (!epMap.length) {
    container.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:13px">Add players in Cast Builder to generate timeline.</div>';
    return;
  }

  let html = '';
  epMap.forEach(({ ep, active, phase, fanVoteReturn }) => {
    const isFinale   = phase === 'finale';
    const isMergeEp  = phase === 'post-merge' && epMap.find(e => e.ep === ep - 1)?.phase === 'pre-merge';
    const isSelected = selectedEpisodes.has(ep);
    const twists     = schedule.filter(t => Number(t.episode) === ep);
    const twistTags  = twists.map(t => {
      const cat = TWIST_CATALOG.find(c => c.id === t.type);
      if (t.type === 'returning-player') {
        const rc = t.returnCount || 1;
        const reasons = t.returnReasons || ['random'];
        const reasonOpts = ['random','unfinished-business','entertainment','strategic-threat','underdog'];
        const reasonLabels = { 'random':'Random', 'unfinished-business':'Unfinished Business', 'entertainment':'Entertainment', 'strategic-threat':'Strategic Threat', 'underdog':'Underdog' };
        let configHtml = `<select onchange="event.stopPropagation();updateTwist('${t.id}','returnCount',+this.value)" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px">`;
        for (let n = 1; n <= 3; n++) configHtml += `<option value="${n}" ${n===rc?'selected':''}>${n}</option>`;
        configHtml += `</select>`;
        for (let s = 0; s < rc; s++) {
          configHtml += `<select onchange="event.stopPropagation();_updateReturnReason('${t.id}',${s},this.value)" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:2px" title="Slot ${s+1} reason">`;
          reasonOpts.forEach(r => configHtml += `<option value="${r}" ${reasons[s]===r?'selected':''}>${reasonLabels[r]}</option>`);
          configHtml += `</select>`;
        }
        return `<span class="fd-ep-twist-tag" style="display:inline-flex;align-items:center;gap:2px;flex-wrap:wrap">${cat.emoji} ${cat.name} ${configHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      return `<span class="fd-ep-twist-tag" onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')">${cat ? cat.emoji : '🔀'} ${cat ? cat.name : t.type} ×</span>`;
    }).join('');

    const markerClass = isFinale ? 'fd-ep-marker finale' : isMergeEp ? 'fd-ep-marker merge' : 'fd-ep-marker';
    const markerText  = isFinale ? 'FINALE' : isMergeEp ? `MERGE · ${active} left` : `${active} left`;
    const phaseLabel  = phase === 'ri-duel' ? 'RI DUEL' : phase === 'finale' ? '' : phase === 'pre-merge' ? 'PRE' : 'POST';

    html += `<div class="fd-episode ${isSelected ? 'selected' : ''} ${isFinale ? 'finale' : ''} ${phase === 'ri-duel' ? 'ri-ep' : ''}" onclick="${isFinale ? '' : `toggleEpisode(${ep})`}" ${isFinale ? 'style="opacity:.6;cursor:default"' : ''}>
      <div class="fd-ep-header">
        <span class="fd-ep-num">Ep. ${ep} <span class="fd-ep-phase-label">${phaseLabel}</span></span>
        <span class="${markerClass}">${markerText}</span>
      </div>
      ${twistTags ? `<div class="fd-ep-twists">${twistTags}</div>` : ''}
    </div>`;
  });

  container.innerHTML = html;
  updateSelectedCount();
}

export function toggleEpisode(ep) {
  if (selectedEpisodes.has(ep)) selectedEpisodes.delete(ep);
  else selectedEpisodes.add(ep);
  renderTimeline();
  renderTwistCatalog();
}

export function clearEpisodeSelection() {
  // If twists are scheduled, ask if they want to clear those too
  if (seasonConfig.twistSchedule?.length) {
    if (confirm('Clear all scheduled twists from the timeline?')) {
      seasonConfig.twistSchedule = [];
      localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
    }
  }
  selectedEpisodes.clear();
  renderTimeline();
  renderTwistCatalog();
}

export function updateSelectedCount() {
  const el = document.getElementById('fd-selected-count');
  if (el) {
    el.textContent = selectedEpisodes.size;
    el.style.display = selectedEpisodes.size ? 'inline-block' : 'none';
  }
  const instr = document.getElementById('fd-instructions');
  if (instr) {
    instr.textContent = selectedEpisodes.size
      ? `${selectedEpisodes.size} episode${selectedEpisodes.size > 1 ? 's' : ''} selected — click a twist below to assign it.`
      : 'Click episodes to select them, then choose twists to apply.';
  }
}

export function setTwistFilter(filter) {
  currentTwistFilter = filter;
  document.querySelectorAll('.fd-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
  renderTwistCatalog();
}

export function renderTwistCatalog() {
  const container = document.getElementById('fd-catalog');
  if (!container) return;
  const search = (document.getElementById('fd-search')?.value || '').toLowerCase();
  const cats   = ['team','immunity','challenge','elim','returns','advantages','social'];

  // Update counts
  cats.forEach(cat => {
    const el = document.getElementById('fd-count-' + cat);
    if (el) el.textContent = TWIST_CATALOG.filter(t => t.category === cat).length;
  });
  const allEl = document.getElementById('fd-count-all');
  if (allEl) allEl.textContent = TWIST_CATALOG.length;

  let filtered = TWIST_CATALOG;
  if (currentTwistFilter !== 'all') filtered = filtered.filter(t => t.category === currentTwistFilter);
  if (search) filtered = filtered.filter(t => t.name.toLowerCase().includes(search) || t.desc.toLowerCase().includes(search));

  if (!filtered.length) {
    container.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:13px">No twists match your search.</div>';
    return;
  }

  // Work out which phases are represented in selected episodes
  const epMap    = buildEpisodeMap();
  const epLookup = Object.fromEntries(epMap.map(e => [e.ep, e.phase]));
  const selPhases = new Set([...selectedEpisodes].map(ep => epLookup[ep] || 'pre-merge'));

  const canAssign = selectedEpisodes.size > 0;
  // Check which twist types already exist on selected episodes (for incompatibility)
  const _existingOnSelected = new Set();
  if (canAssign) {
    (seasonConfig.twistSchedule || []).forEach(tw => {
      if (selectedEpisodes.has(Number(tw.episode))) _existingOnSelected.add(tw.type);
    });
  }
  container.innerHTML = filtered.map(t => {
    const phaseBlocked = canAssign && t.phase !== 'any' &&
      [...selPhases].every(ph => ph !== t.phase);
    const incompBlocked = canAssign && (t.incompatible || []).some(ic => _existingOnSelected.has(ic));
    const tribeBlocked = canAssign && t.minTribes && (seasonConfig.teams || 2) < t.minTribes;
    const riBlocked = canAssign && (t.id === 'exile-duel' || t.id === 'second-chance') && seasonConfig.ri;
    const popBlocked = canAssign && t.id === 'second-chance' && !seasonConfig.popularityEnabled;
    const exileBlocked = canAssign && t.id === 'exile-island' && seasonConfig.exile;
    // Tied Destinies: requires even number of active players
    const _selEpNums = [...selectedEpisodes];
    const _tdEvenBlocked = canAssign && t.id === 'tied-destinies' && _selEpNums.some(epN => {
      const epInfo = epMap.find(e => e.ep === epN);
      return epInfo && epInfo.active % 2 !== 0;
    });
    const blocked = phaseBlocked || incompBlocked || tribeBlocked || riBlocked || popBlocked || exileBlocked || _tdEvenBlocked;
    const blockReason = phaseBlocked ? ' ⚠️ wrong phase' : incompBlocked ? ' ⚠️ conflicts with existing twist' : tribeBlocked ? ` ⚠️ needs ${t.minTribes}+ tribes` : riBlocked ? ' ⚠️ incompatible with 2nd Chance Isle' : exileBlocked ? ' ⚠️ incompatible with Exile Format' : popBlocked ? ' ⚠️ requires Popularity enabled' : _tdEvenBlocked ? ' ⚠️ needs even player count' : '';
    return `
    <div class="twist-card ${canAssign && !blocked ? 'assignable' : ''} ${blocked ? 'phase-blocked' : ''}" onclick="${blocked ? '' : `assignTwist('${t.id}')`}">
      <div class="twist-card-top">
        <span class="twist-card-emoji">${t.emoji}</span>
        <div class="twist-card-info">
          <span class="twist-card-name">${t.name}</span>
          <span class="twist-phase">${t.phase}${blockReason}</span>
        </div>
        <button class="twist-add-btn" ${canAssign && !blocked ? '' : 'disabled'} onclick="event.stopPropagation();${blocked ? '' : `assignTwist('${t.id}')`}">+</button>
      </div>
      <p class="twist-card-desc">${t.desc}</p>
    </div>`;
  }).join('');
}

export function assignTwist(twistId) {
  if (!selectedEpisodes.size) {
    const tl = document.getElementById('fd-timeline');
    if (tl) { tl.style.outline = '2px solid #6366f1'; setTimeout(() => tl.style.outline = '', 800); }
    return;
  }
  const twist    = TWIST_CATALOG.find(t => t.id === twistId);
  const epMap    = buildEpisodeMap();
  const epLookup = Object.fromEntries(epMap.map(e => [e.ep, e.phase]));

  if (!seasonConfig.twistSchedule) seasonConfig.twistSchedule = [];
  const blocked = [];

  selectedEpisodes.forEach(ep => {
    const epPhase = epLookup[ep] || 'pre-merge';
    // Phase check
    if (twist?.phase === 'pre-merge' && epPhase !== 'pre-merge') {
      blocked.push(ep); return;
    }
    if (twist?.phase === 'post-merge' && epPhase !== 'post-merge') {
      blocked.push(ep); return;
    }
    // Duplicate check: same twist type already on this episode — skip
    const existingOnEp = seasonConfig.twistSchedule.filter(t => Number(t.episode) === ep);
    if (existingOnEp.some(t => t.type === twistId)) return;
    // Incompatibility check: silently skip conflicting episodes
    if (twist?.incompatible?.length) {
      if (existingOnEp.some(t => twist.incompatible.includes(t.type))) {
        blocked.push(ep); return;
      }
    }
    const entry = { id: 'tw-' + Date.now() + '-' + ep, episode: ep, type: twistId };
    if (twistId === 'returning-player') { entry.returnCount = 1; entry.returnReasons = ['random']; }
    seasonConfig.twistSchedule.push(entry);
  });

  if (blocked.length) {
    const phaseName = twist?.phase === 'pre-merge' ? 'pre-merge' : 'post-merge';
    alert(`"${twist?.name}" is a ${phaseName}-only twist.\nBlocked on episode${blocked.length > 1 ? 's' : ''}: ${blocked.join(', ')}.`);
  }

  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

export function removeTwistFromEpisode(ep, twistEntryId) {
  seasonConfig.twistSchedule = (seasonConfig.twistSchedule || []).filter(t => t.id !== twistEntryId);
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

// Legacy compat stubs (engine may call these)
export function renderTwistList() { renderTimeline(); }
export function addTwist() { /* handled by format designer */ }
export function removeTwist(id) { removeTwistFromEpisode(null, id); }
export function updateTwist(id, field, value) {
  const t = (seasonConfig.twistSchedule||[]).find(t => t.id === id);
  if (!t) return;
  t[field] = value;
  if (field === 'returnCount' && t.type === 'returning-player') {
    const reasons = t.returnReasons || ['random'];
    while (reasons.length < value) reasons.push('random');
    t.returnReasons = reasons.slice(0, value);
  }
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

export function _updateReturnReason(twistId, slotIdx, reason) {
  const t = (seasonConfig.twistSchedule||[]).find(t => t.id === twistId);
  if (!t) return;
  if (!t.returnReasons) t.returnReasons = ['random'];
  t.returnReasons[slotIdx] = reason;
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

// ══════════════════════════════════════════════════════════════════════
// RESULTS TAB
// ══════════════════════════════════════════════════════════════════════


export function renderResultsTab() {
  const empty   = document.getElementById('results-empty');
  const content = document.getElementById('results-content');
  if (!gs || !gs.episodeHistory.length) {
    empty.style.display = 'flex'; content.style.display = 'none'; return;
  }
  empty.style.display = 'none';
  content.style.display = 'flex'; content.style.flexDirection = 'column';

  const finalists = [...gs.activePlayers];
  const isComplete = gs.phase === 'complete';
  const finaleResult = gs.finaleResult || null;
  // Only project winner if merge has happened and not yet in finale; show actual if complete
  const juryResult = finaleResult || ((gs.isMerged && !isComplete && finalists.length)
    ? simulateJuryVote(finalists) : null);
  const isProjected = !finaleResult && juryResult;

  let html = '';

  // Winner block
  if (juryResult && Object.values(juryResult.votes).some(v => v > 0)) {
    const sorted = Object.entries(juryResult.votes).sort(([,a],[,b]) => b-a);
    const winner = finaleResult?.winner || sorted[0][0];
    const tally = sorted.map(([n,v]) => `<span class="results-jury-chip">${n}: ${v}</span>`).join('');
    html += `<div class="results-winner-card">
      <div class="results-crown">&#127942;</div>
      <div>
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${isProjected ? 'Projected Winner' : 'Season Winner'}</div>
        <div class="results-winner-name">${winner}</div>
        <div class="results-jury-tally">${tally}</div>
      </div></div>`;
    html += `<div style="font-size:13px;font-weight:600;color:var(--muted);margin-top:4px">${isProjected ? 'Projected Jury Vote' : 'Final Jury Vote'}</div>`;
    html += `<div class="jury-breakdown">
      <div class="jury-breakdown-header"><span class="jb-juror">Juror</span><span class="jb-voted">Votes For</span></div>
      ${juryResult.reasoning.map(r => `<div class="jury-breakdown-row"><span class="jb-juror">${r.juror}</span><span class="jb-voted">${r.votedFor}</span></div>`).join('')}
    </div>`;
  }

  // Placement list
  html += `<div style="font-size:13px;font-weight:600;color:var(--muted);margin-top:4px">Boot Order</div>`;
  html += `<div class="placement-table">`;

  // Finalists (top placements)
  finalists.forEach((name, i) => {
    html += `<div class="placement-row">
      <span class="placement-rank">${ordinal(i+1)}</span>
      <span class="placement-name">${name}</span>
      <span class="placement-badge" style="background:rgba(16,185,129,0.15);color:#10b981">${gs.phase==='finale'?'Finalist':'Active'}</span>
    </div>`;
  });

  // Eliminated (most recent = highest placement)
  const juryList = [...(gs.jury||[])].reverse();
  const nonJury  = gs.eliminated.filter(p => !(gs.jury||[]).includes(p));
  const allElim  = [...juryList, ...(gs.riPlayers.length ? gs.riPlayers : []), ...[...nonJury].reverse()];

  allElim.forEach((name, i) => {
    const place = finalists.length + i + 1;
    const epRec = gs.episodeHistory.slice().reverse().find(e => e.eliminated === name);
    const epLabel = epRec ? `Ep. ${epRec.num}` : '';
    const isJury = (gs.jury||[]).includes(name);
    const isRI   = gs.riPlayers.includes(name);
    html += `<div class="placement-row">
      <span class="placement-rank">${ordinal(place)}</span>
      <span class="placement-name">${name}</span>
      <span class="placement-ep-label">${epLabel}</span>
      ${isRI   ? '<span class="placement-badge" style="background:rgba(249,115,22,0.15);color:#f97316">On RI</span>' : ''}
      ${isJury ? '<span class="placement-badge" style="background:rgba(99,102,241,0.15);color:#6366f1">Jury</span>' : ''}
    </div>`;
  });

  html += `</div>`;
  content.innerHTML = html;
}

