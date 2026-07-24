// ══════════════════════════════════════════════════════════════════════
// run-ui.js — Run tab, episode management, setup panels, twist catalog
// ══════════════════════════════════════════════════════════════════════

export let _spoilerFree = false;
export function set_spoilerFree(v) { _spoilerFree = v; }

const _HUB_SETTING_META = {
  'hosted-camp': { label: 'Hosted Camp', icon: '🏕️', accent: '#f0c040' },
  'survival-island': { label: 'Survival Island', icon: '🏝️', accent: '#46c7b4' },
  carnival: { label: 'Carnival of Chaos', icon: '🎪', accent: '#ff5a7a' },
  'film-lot': { label: 'Film Lot', icon: '🎬', accent: '#cdd2df' },
  'world-tour': { label: 'World Tour', icon: '✈️', accent: '#57a6e8' },
};

function _hubEsc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

function _hubPortrait(name, cast = players, eliminated = false) {
  const player = (cast || []).find(p => p.name === name);
  const slug = player?.slug || String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `<span class="hub-player${eliminated ? ' eliminated' : ''}" title="${_hubEsc(name)}">
    <span class="hub-player-face"><img src="assets/avatars/${_hubEsc(slug)}.png" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span>${_hubEsc(String(name)[0] || '?')}</span></span>
    <span class="hub-player-name">${_hubEsc(name)}</span>
  </span>`;
}

function _hubRailFace(name, cast = players) {
  if (!name) return '<span class="hub-rail-empty">•</span>';
  const player = (cast || []).find(p => p.name === name);
  const slug = player?.slug || String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `<span class="hub-rail-face"><img src="assets/avatars/${_hubEsc(slug)}.png" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span>${_hubEsc(String(name)[0] || '?')}</span></span>`;
}

export function getEpisodeEliminations(ep) {
  if (!ep) return [];
  if (ep.multiTribalElims?.length) return [...new Set(ep.multiTribalElims.filter(Boolean))];
  const names = [
    ep.firstEliminated,
    ep.ambassadorData?.ambassadorEliminated,
    ep.eliminated,
    ep.tiedDestinies?.eliminatedPartner,
    ep.emissaryEliminated,
  ].filter(Boolean);
  return [...new Set(names)];
}

export function buildHubAftermath(ep) {
  if (!ep) return null;
  const eliminated = getEpisodeEliminations(ep);
  const eliminatedLabel = eliminated.join(' + ');
  const voteEntries = Object.entries(ep.votes || {}).filter(([, count]) => Number(count) > 0)
    .sort(([, a], [, b]) => Number(b) - Number(a));
  const voteShape = voteEntries.map(([name, count]) => `${name} ${count}`).join(' · ') || 'No standard vote';
  const votesNegated = (ep.idolPlays || []).reduce((sum, play) => sum + Math.max(0, Number(play.votesNegated || 0)), 0);
  const decidingVoters = [...new Set((ep.votingLog || []).filter(vote => eliminated.includes(vote.voted) && !vote.sitdSacrificed).map(vote => vote.voter))];
  let why = eliminatedLabel ? `${eliminatedLabel} received the highest valid total after the ballots were resolved.` : 'The episode ended without a standard elimination vote.';
  if (ep.isRockDraw) why = `${eliminatedLabel || 'The eliminated contestant'} drew the losing rock after the vote remained deadlocked.`;
  else if (ep.tiebreakerResult) why = `${ep.tiebreakerResult.loser || eliminatedLabel} lost the ${ep.tiebreakerResult.challengeLabel || 'tiebreaker'} to ${ep.tiebreakerResult.winner || 'the other tied player'}.`;
  else if (ep.isTie && ep.revoteLog?.length) why = `The first ballot tied. On the revote, the numbers consolidated against ${eliminatedLabel || 'the eliminated contestant'}.`;
  else if (votesNegated > 0) why = `${votesNegated} vote${votesNegated === 1 ? '' : 's'} were erased by protection, leaving ${eliminatedLabel || 'the boot'} with the highest valid total.`;
  else if (decidingVoters.length) why = `${decidingVoters.join(', ')} supplied the ballots that sent ${eliminatedLabel} out.`;

  const advantages = [];
  (ep.idolPlays || []).forEach(play => {
    const beneficiary = play.playedFor || play.player;
    if (Number(play.votesNegated || 0) > 0) advantages.push(`${play.player} protected ${beneficiary}; ${play.votesNegated} vote${Number(play.votesNegated) === 1 ? '' : 's'} did not count.`);
    else if (play.type === 'extraVote') advantages.push(`${play.player} added an Extra Vote${play.target ? ` against ${play.target}` : ''}.`);
    else if (play.type === 'voteSteal') advantages.push(`${play.player} stole ${play.stolenFrom || 'another player'}'s vote.`);
    else if (play.type === 'soleVote') advantages.push(`${play.player}'s Sole Vote became the only ballot that counted.`);
  });
  (ep.idolMisplays || []).forEach(play => advantages.push(`${play.player} left with protection unused.`));
  if (ep.shotInDark?.player) advantages.push(`${ep.shotInDark.player}'s Shot in the Dark ${ep.shotInDark.safe ? 'made them safe' : 'failed'}.`);

  const allianceChanges = [];
  (ep.allianceQuits || []).forEach(change => allianceChanges.push(`${change.player} left ${change.alliance}${change.reason ? ` — ${change.reason}` : ''}.`));
  (ep.alliances || []).forEach(alliance => {
    (alliance.betrayals || []).filter(b => Number(b.ep) === Number(ep.num)).forEach(betrayal => {
      allianceChanges.push(`${betrayal.player} broke ${alliance.name || alliance.label || 'an alliance'} by voting ${betrayal.votedFor} instead of ${betrayal.consensusWas}.`);
    });
  });

  const relationshipChanges = (ep.bondChanges || []).filter(change => Math.abs(Number(change.delta || 0)) >= 1)
    .sort((a, b) => Math.abs(Number(b.delta)) - Math.abs(Number(a.delta))).slice(0, 3)
    .map(change => `${change.a} and ${change.b} ${Number(change.delta) > 0 ? 'grew closer' : 'lost ground'} — ${String(change.reason || 'the vote changed their relationship').replace(/\s*\([^)]*\)\s*/g, '')}.`);

  const reputationChanges = (ep.reputationChanges || []).filter(change => (change.earned || []).length || (change.lost || []).length).slice(0, 2).map(change => {
    const parts = [];
    if (change.earned?.length) parts.push(`now seen as ${change.earned.join(', ')}`);
    if (change.lost?.length) parts.push(`lost the ${change.lost.join(', ')} reputation`);
    return `${change.player} is ${parts.join(' and ')}.`;
  });
  const lessons = (ep.adaptationEvents || []).slice(0, 2).map(event => event.text).filter(Boolean);

  return {
    eliminated, eliminatedLabel, voteEntries, voteShape, votesNegated, decidingVoters, why,
    advantages: [...new Set(advantages)].slice(0, 3),
    allianceChanges: [...new Set(allianceChanges)].slice(0, 3),
    relationshipChanges,
    reputationChanges,
    lessons,
  };
}

export function buildSeasonHubModel(state = gs, config = seasonConfig, cast = players, viewedEpisodeNum = null) {
  const setting = _HUB_SETTING_META[config?.setting] || _HUB_SETTING_META['hosted-camp'];
  const initialized = !!state?.initialized;
  const history = initialized ? (state.episodeHistory || []) : [];
  const liveLatest = history[history.length - 1] || null;
  const selectedEpisode = viewedEpisodeNum == null ? liveLatest : history.find(ep => Number(ep.num) === Number(viewedEpisodeNum)) || liveLatest;
  const isHistorical = !!(selectedEpisode && liveLatest && Number(selectedEpisode.num) !== Number(liveLatest.num));
  const displayState = selectedEpisode?.gsSnapshot || state || {};
  const latest = selectedEpisode;
  const complete = initialized && !isHistorical && (state.phase === 'complete' || (state.activePlayers || []).length <= 1);
  const lifecycle = !initialized ? 'setup' : complete ? 'complete' : latest ? 'aftermath' : 'ready';
  const active = initialized ? [...(displayState.activePlayers || state.activePlayers || [])] : [];
  const originalCount = Math.max((cast || []).length, active.length + (displayState.eliminated || []).length, 1);
  const remaining = active.length;
  const progress = initialized ? Math.max(0, Math.min(100, Math.round(((originalCount - remaining) / Math.max(1, originalCount - 1)) * 100))) : 0;
  const nextEpisode = initialized ? Number(latest?.num ?? displayState.episode ?? state.episode ?? 0) + 1 : 1;
  const nextScheduled = (config?.twistSchedule || []).filter(Boolean).find(t => Number(t.episode) === nextEpisode);
  const catalogEntry = nextScheduled && typeof TWIST_CATALOG !== 'undefined' ? TWIST_CATALOG.find(t => t.id === nextScheduled.type) : null;
  const twistLabel = nextScheduled
    ? nextScheduled.spoilerFree ? 'Production surprise scheduled' : (catalogEntry?.name || String(nextScheduled.type || 'Special episode').replace(/-/g, ' '))
    : 'Standard episode — no scheduled twist';
  const groups = initialized && displayState.phase === 'pre-merge' && (displayState.tribes || []).length
    ? displayState.tribes.map(t => ({ name: t.name, color: typeof tribeColor === 'function' ? tribeColor(t.name) : setting.accent, members: (t.members || []).filter(n => active.includes(n)) })).filter(t => t.members.length)
    : initialized ? [{ name: displayState.phase === 'finale' ? 'Finalists' : 'Merged Cast', color: setting.accent, members: active }] : [];
  const storylines = [];
  if (latest?.eliminated) storylines.push(`${latest.eliminated}'s exit changes the numbers going into Episode ${nextEpisode}.`);
  if (latest?.isMerge) storylines.push('The merge has redrawn every voting relationship.');
  if ((displayState.riPlayers || []).length) storylines.push(`${displayState.riPlayers.length} eliminated contestant${displayState.riPlayers.length === 1 ? '' : 's'} remain in the second-chance game.`);
  const publicStatuses = [];
  const immunityHolder = latest?.individualImmunity || latest?.immunityWinner || latest?.challengeWinner;
  if (immunityHolder && active.includes(immunityHolder)) publicStatuses.push(`${immunityHolder} is publicly safe after winning immunity.`);
  if (latest?.isMerge) publicStatuses.push('The cast is now competing as one merged group.');
  if ((displayState.riPlayers || []).length) publicStatuses.push('A public second-chance route remains active.');
  storylines.push(...publicStatuses);
  if (!storylines.length && initialized) storylines.push('The opening relationships are in place. The first loss will reveal which promises matter.');

  return {
    lifecycle, setting, title: config?.name || 'Untitled Season', seasonNumber: config?.seasonNumber || null,
    phase: displayState.phase || state?.phase || 'setup', episode: Number(latest?.num ?? displayState.episode ?? 0), nextEpisode, remaining, originalCount, progress,
    active, groups, latest, history, liveEpisode: Number(liveLatest?.num || 0), isHistorical, storylines: [...new Set(storylines)].slice(0, 3), twistLabel,
    primaryLabel: lifecycle === 'setup' ? 'Start Season · Play Episode 1' : isHistorical ? `Return to Current · Episode ${liveLatest.num}` : lifecycle === 'complete' ? 'View Season Results' : state?.phase === 'finale' ? `Play Finale · Episode ${Number(state.episode || 0) + 1}` : `Play Episode ${Number(state.episode || 0) + 1}`,
    primaryAction: isHistorical ? 'current' : lifecycle === 'complete' ? 'results' : 'simulate',
  };
}

export function renderSeasonHub() {
  const host = document.getElementById('season-hub');
  if (!host) return;
  const model = buildSeasonHubModel(gs, seasonConfig, players, viewingEpNum);
  const railHost = document.getElementById('season-episode-rail');
  host.style.setProperty('--hub-accent', model.setting.accent);
  if (railHost) railHost.style.setProperty('--hub-accent', model.setting.accent);
  const phaseLabel = model.phase === 'pre-merge' ? 'Pre-Merge' : model.phase === 'post-merge' ? 'Post-Merge' : model.phase === 'finale' ? 'Finale' : model.phase === 'complete' ? 'Complete' : 'Setup';
  const primaryClick = model.primaryAction === 'results' ? "showTab('results')" : model.primaryAction === 'current' ? `viewEpisode(${model.liveEpisode})` : 'simulateNext()';
  const controls = document.getElementById('season-controls-details');
  if (controls) {
    const previousLifecycle = controls.dataset.hubLifecycle;
    if (!previousLifecycle) controls.open = model.lifecycle === 'setup';
    else if (previousLifecycle === 'setup' && model.lifecycle !== 'setup') controls.open = false;
    controls.dataset.hubLifecycle = model.lifecycle;
  }
  if (model.lifecycle === 'setup') {
    if (railHost) railHost.innerHTML = '';
    host.innerHTML = `<section class="hub-welcome"><div class="hub-kicker">Season control room</div><h1>Build the cast. Set the rules. Then let the game begin.</h1><p>Your cast and settings stay intact. Initialize when you are ready to create the opening tribes, relationships, and game state.</p><button class="hub-primary" onclick="${primaryClick}">${model.primaryLabel}<span>→</span></button></section>`;
    return;
  }
  if (railHost) {
    railHost.innerHTML = `<nav class="hub-episode-rail" aria-label="Episode history">
      <div class="hub-rail-title"><span>Season tape</span><small>Select an episode</small></div>
      <div class="hub-rail-track">
        ${model.history.map(ep => {
          const active = Number(ep.num) === Number(model.latest?.num);
          const eliminatedNames = getEpisodeEliminations(ep);
          const eliminatedLabel = eliminatedNames.join(' + ');
          const outcome = _spoilerFree
            ? '<span class="hub-rail-locked">?</span>'
            : eliminatedNames.length
              ? `<span class="hub-rail-faces">${eliminatedNames.slice(0, 2).map(name => _hubRailFace(name)).join('')}${eliminatedNames.length > 2 ? `<b>+${eliminatedNames.length - 2}</b>` : ''}</span>`
              : _hubRailFace(null);
          const label = _spoilerFree ? `Episode ${ep.num}` : `Episode ${ep.num}${eliminatedLabel ? ` — ${eliminatedLabel} eliminated` : ''}`;
          return `<button class="hub-rail-episode${active ? ' active' : ''}" type="button" aria-current="${active ? 'true' : 'false'}" aria-label="${_hubEsc(label)}" title="${_hubEsc(label)}" onclick="viewEpisode(${Number(ep.num)})"><span class="hub-rail-num">EP ${String(ep.num).padStart(2, '0')}</span>${outcome}</button>`;
        }).join('')}
      </div>
      <div class="hub-rail-position">${model.isHistorical ? `Reviewing ${model.latest.num} / ${model.liveEpisode}` : `Current · ${model.liveEpisode}`}</div>
    </nav>`;
    requestAnimationFrame(() => {
      const track = railHost.querySelector('.hub-rail-track');
      const selected = railHost.querySelector('.hub-rail-episode.active');
      if (track && selected) track.scrollLeft = selected.offsetLeft - (track.clientWidth - selected.offsetWidth) / 2;
    });
  }
  const latestElims = getEpisodeEliminations(model.latest);
  const latestElim = latestElims.join(' + ');
  const latestPortraits = latestElims.map(name => _hubPortrait(name, players, true)).join('');
  const castHtml = _spoilerFree
    ? '<div class="hub-spoiler-lock"><span>◉</span><div><strong>Updated cast hidden</strong><small>Watch in the Visual Player without spoiling this screen, or turn off Spoiler-free to reveal the current state.</small></div></div>'
    : model.groups.map(group => `<section class="hub-tribe"><header><span class="hub-tribe-dot" style="background:${_hubEsc(group.color)}"></span><strong>${_hubEsc(group.name)}</strong><small>${group.members.length} remaining</small></header><div class="hub-cast-row">${group.members.map(name => _hubPortrait(name)).join('')}</div></section>`).join('');
  const latestVotes = Object.entries(model.latest?.votes || {}).sort(([,a],[,b]) => b-a).slice(0, 3).map(([name, count]) => `<span>${_hubEsc(name)} <b>${count}</b></span>`).join('');
  const headlineStatus = _spoilerFree && model.latest
    ? `Episode ${model.latest.num} is ready to watch · outcome hidden`
    : model.isHistorical ? `Reviewing Episode ${model.latest.num} · ${model.remaining} contestants remained afterward`
    : model.lifecycle === 'complete' ? 'The season is complete. The jury has spoken.' : `Episode ${model.nextEpisode} is ready · ${model.remaining} of ${model.originalCount} contestants remain`;
  const publicStorylines = _spoilerFree && model.latest
    ? ['The game state will update here after you reveal the episode outcome.']
    : model.storylines;
  const aftermath = buildHubAftermath(model.latest);
  const stateLabel = model.isHistorical ? `Historical review · Episode ${model.latest.num}`
    : model.lifecycle === 'complete' ? 'Finale complete'
      : model.latest ? `Episode ${model.latest.num} aftermath` : `Before Episode ${model.nextEpisode}`;
  const aftermathRows = (items, tone = '') => items.map(item => `<li class="${tone}">${_hubEsc(item)}</li>`).join('');
  const aftermathHtml = !_spoilerFree && aftermath ? `<section class="hub-aftermath">
    <header class="hub-aftermath-head"><div><span>Episode consequence report</span><strong>What changed tonight</strong></div><div class="hub-vote-shape"><small>Final vote shape</small><b>${_hubEsc(aftermath.voteShape)}</b></div></header>
    <div class="hub-aftermath-grid">
      <article class="hub-aftermath-card hub-aftermath-why"><span class="hub-aftermath-index">01</span><div><label>Why the result happened</label><p>${_hubEsc(aftermath.why)}</p>${aftermath.decidingVoters.length ? `<small>Deciding ballots: ${_hubEsc(aftermath.decidingVoters.join(', '))}</small>` : ''}</div></article>
      ${aftermath.advantages.length ? `<article class="hub-aftermath-card"><span class="hub-aftermath-index">02</span><div><label>Advantage impact</label><ul>${aftermathRows(aftermath.advantages, 'advantage')}</ul></div></article>` : ''}
      ${aftermath.allianceChanges.length || aftermath.relationshipChanges.length ? `<article class="hub-aftermath-card"><span class="hub-aftermath-index">03</span><div><label>Alliance & relationship fallout</label><ul>${aftermathRows([...aftermath.allianceChanges, ...aftermath.relationshipChanges].slice(0, 4), 'fallout')}</ul></div></article>` : ''}
      ${aftermath.reputationChanges.length || aftermath.lessons.length ? `<article class="hub-aftermath-card"><span class="hub-aftermath-index">04</span><div><label>What lingers</label><ul>${aftermathRows([...aftermath.reputationChanges, ...aftermath.lessons].slice(0, 4), 'lesson')}</ul></div></article>` : ''}
    </div>
    <footer><span>Public consequence summary</span><button type="button" onclick="openVisualPlayer(${Number(model.latest.num)})">Open the full episode breakdown →</button></footer>
  </section>` : '';
  const canBatch = !model.isHistorical && model.lifecycle !== 'complete' && model.phase !== 'finale';
  const canReplay = !!(model.latest && typeof gsCheckpoints !== 'undefined' && gsCheckpoints[model.latest.num]);
  const secondaryActions = model.lifecycle === 'setup' ? '' : `<nav class="hub-secondary-actions" aria-label="Secondary season actions">
    <button type="button" onclick="openVisualPlayer(${Number(model.latest?.num || model.liveEpisode)})" ${model.latest ? '' : 'disabled'}>Watch latest</button>
    <button type="button" onclick="simulateMultipleEpisodes(5)" ${canBatch ? '' : 'disabled'}>Sim 5</button>
    <button type="button" onclick="simulateMultipleEpisodes()" ${canBatch ? '' : 'disabled'}>Sim to finale</button>
    <button type="button" onclick="replayEpisode(${Number(model.latest?.num || 0)})" ${canReplay ? '' : 'disabled'}>Replay viewed</button>
    <button type="button" onclick="saveSeasonToStorage()">Save</button>
    <button type="button" onclick="exportSeason()">Export</button>
  </nav>`;
  host.innerHTML = `<section class="hub-shell hub-${model.lifecycle}">
    <header class="hub-headline"><div><div class="hub-kicker">${model.setting.icon} ${_hubEsc(model.setting.label)} · ${_hubEsc(phaseLabel)}</div><div class="hub-state-badge">${_hubEsc(stateLabel)}</div><h1>${_hubEsc(model.title)}</h1><p>${_hubEsc(headlineStatus)}</p></div><button class="hub-primary" onclick="${primaryClick}">${_hubEsc(model.primaryLabel)}<span>→</span></button></header>
    ${secondaryActions}
    <div class="hub-progress${_spoilerFree && model.latest ? ' hub-progress-hidden' : ''}" role="progressbar" aria-label="${_spoilerFree && model.latest ? 'Season progress hidden' : 'Season progress'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${_spoilerFree && model.latest ? 0 : model.progress}"><span style="width:${_spoilerFree && model.latest ? 100 : model.progress}%"></span></div>
    ${model.latest ? `<section class="hub-last-night"><div class="hub-last-label">Last episode</div><div class="hub-last-person">${_spoilerFree ? '<span class="hub-spoiler-mark">?</span>' : latestElim ? latestPortraits : '<span class="hub-no-boot">No elimination</span>'}</div><div class="hub-last-copy"><strong>${_spoilerFree ? 'Outcome hidden until you watch' : latestElim ? `${_hubEsc(latestElim)} left the game` : 'The game moved without a vote'}</strong><span>Episode ${model.latest.num}${!_spoilerFree && model.latest.challengeLabel ? ` · ${_hubEsc(model.latest.challengeLabel)}` : ''}</span></div><div class="hub-last-votes">${_spoilerFree ? '<em>Votes hidden</em>' : latestVotes}</div><button class="hub-watch" onclick="openVisualPlayer(${Number(model.latest.num)})">▶ Watch</button></section>` : `<section class="hub-premiere-note"><strong>The premiere is next.</strong><span>Nobody has voted yet. Opening bonds and first impressions will finally become consequences.</span></section>`}
    ${aftermathHtml}
    <div class="hub-grid"><div class="hub-main-column"><div class="hub-section-title"><span>${_spoilerFree && model.latest ? 'Cast after the episode' : 'Cast still in the game'}</span><small>${_spoilerFree && model.latest ? 'Hidden' : `${model.remaining} remaining`}</small></div><div class="hub-tribes">${castHtml}</div></div><aside class="hub-briefing"><div class="hub-section-title"><span>Going forward</span><small>Public context</small></div><div class="hub-next-card"><label>Next episode</label><strong>${_spoilerFree && model.latest ? 'Available after revealing the outcome' : _hubEsc(model.twistLabel)}</strong></div><div class="hub-story-list">${publicStorylines.map((line, index) => `<div><b>${String(index + 1).padStart(2, '0')}</b><span>${_hubEsc(line)}</span></div>`).join('')}</div></aside></div>
  </section>`;
}

// Sudden Death is a format modifier that may co-fire with ONE scoring twist
// challenge (it eliminates that challenge's last-place finisher). The runtime
// allows that pairing, so the scheduler UI shouldn't flag it as incompatible.
// (SD stays incompatible with the other auto-elimination formats.)
function _sdChalPair(a, b) {
  const isScoringChal = id => {
    if (id === 'sudden-death' || id === 'slasher-night' || id === 'triple-dog-dare') return false;
    return (TWIST_CATALOG.find(c => c.id === id) || {}).category === 'challenge';
  };
  return (a === 'sudden-death' && isScoringChal(b)) || (b === 'sudden-death' && isScoringChal(a));
}

export function initRunTab() {
  if (!gs) {
    if (players.length > 0) initGameState();
  }
  renderRunTab();
}

export function renderRunTab() {
  renderGameState();
  renderSeasonHub();
  const empty   = document.getElementById('run-empty');
  const content = document.getElementById('run-content');

  if (!gs || !gs.initialized) {
    empty.style.display = 'none'; content.style.display = 'none'; return;
  }
  empty.style.display = 'none'; content.style.display = 'flex'; content.style.flexDirection = 'column';

  // Show episode or placeholder
  const replayBtn = document.getElementById('replay-btn');
  if (!gs.episodeHistory.length) {
    const review = document.getElementById('episode-review');
    if (review) review.style.display = 'none';
    document.getElementById('ep-result-card').innerHTML = '';
    document.getElementById('ep-output-text').value = '';
    document.getElementById('ep-history-wrap').style.display = 'none';
    if (replayBtn) replayBtn.style.display = 'none';
  } else {
    const review = document.getElementById('episode-review');
    if (review) review.style.display = 'flex';
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
    if (d.phase === 'complete') {
      let exportBtn = document.getElementById('export-season-btn');
      if (!exportBtn) {
        exportBtn = document.createElement('button');
        exportBtn.id = 'export-season-btn';
        exportBtn.className = 'btn';
        exportBtn.style.cssText = 'margin-top:8px;background:linear-gradient(135deg,#9b6dff,#4cffb3);color:#fff;width:100%;padding:8px 12px;border-radius:6px;cursor:pointer;font-weight:600;border:none;';
        exportBtn.textContent = 'Export & Fill Narratives';
        exportBtn.onclick = async () => {
          exportBtn.disabled = true;
          try {
            await window.exportAndFillNarratives(s => { exportBtn.textContent = s; });
            exportBtn.textContent = 'All Done!';
            setTimeout(() => { exportBtn.textContent = 'Export & Fill Narratives'; exportBtn.disabled = false; }, 3000);
          } catch (err) {
            console.error('Export error:', err);
            exportBtn.textContent = 'Failed — check console';
            setTimeout(() => { exportBtn.textContent = 'Export & Fill Narratives'; exportBtn.disabled = false; }, 5000);
          }
        };
        btn.parentElement.insertBefore(exportBtn, btn.nextSibling);
      }
      let narrBtn = document.getElementById('rankings-narration-btn');
      if (!narrBtn) {
        narrBtn = document.createElement('button');
        narrBtn.id = 'rankings-narration-btn';
        narrBtn.className = 'btn';
        narrBtn.style.cssText = 'margin-top:6px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;width:100%;padding:8px 12px;border-radius:6px;cursor:pointer;font-weight:600;border:none;';
        narrBtn.textContent = 'Rankings Narration';
        narrBtn.onclick = async () => {
          narrBtn.disabled = true;
          try {
            await window.generateRankingsNarration(s => { narrBtn.textContent = s; });
            narrBtn.textContent = 'Done!';
            setTimeout(() => { narrBtn.textContent = 'Rankings Narration'; narrBtn.disabled = false; }, 3000);
          } catch (err) {
            console.error('Narration error:', err);
            narrBtn.textContent = 'Failed — check console';
            setTimeout(() => { narrBtn.textContent = 'Rankings Narration'; narrBtn.disabled = false; }, 5000);
          }
        };
        const anchor = document.getElementById('export-season-btn');
        if (anchor) anchor.parentElement.insertBefore(narrBtn, anchor.nextSibling);
      }
    }
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
    let exportBtn = document.getElementById('export-season-btn');
    if (!exportBtn) {
      exportBtn = document.createElement('button');
      exportBtn.id = 'export-season-btn';
      exportBtn.className = 'btn';
      exportBtn.style.cssText = 'margin-top:8px;background:linear-gradient(135deg,#9b6dff,#4cffb3);color:#fff;width:100%;padding:8px 12px;border-radius:6px;cursor:pointer;font-weight:600;border:none;';
      exportBtn.textContent = 'Export & Fill Narratives';
      exportBtn.onclick = async () => {
        exportBtn.disabled = true;
        try {
          await window.exportAndFillNarratives(s => { exportBtn.textContent = s; });
          exportBtn.textContent = 'All Done!';
          setTimeout(() => { exportBtn.textContent = 'Export & Fill Narratives'; exportBtn.disabled = false; }, 3000);
        } catch (err) {
          console.error('Export error:', err);
          exportBtn.textContent = 'Failed — check console';
          setTimeout(() => { exportBtn.textContent = 'Export & Fill Narratives'; exportBtn.disabled = false; }, 5000);
        }
      };
      btn.parentElement.insertBefore(exportBtn, btn.nextSibling);
    }
    let narrBtn = document.getElementById('rankings-narration-btn');
    if (!narrBtn) {
      narrBtn = document.createElement('button');
      narrBtn.id = 'rankings-narration-btn';
      narrBtn.className = 'btn';
      narrBtn.style.cssText = 'margin-top:6px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;width:100%;padding:8px 12px;border-radius:6px;cursor:pointer;font-weight:600;border:none;';
      narrBtn.textContent = 'Rankings Narration';
      narrBtn.onclick = async () => {
        narrBtn.disabled = true;
        try {
          await window.generateRankingsNarration(s => { narrBtn.textContent = s; });
          narrBtn.textContent = 'Done!';
          setTimeout(() => { narrBtn.textContent = 'Rankings Narration'; narrBtn.disabled = false; }, 3000);
        } catch (err) {
          console.error('Narration error:', err);
          narrBtn.textContent = 'Failed — check console';
          setTimeout(() => { narrBtn.textContent = 'Rankings Narration'; narrBtn.disabled = false; }, 5000);
        }
      };
      const anchor = document.getElementById('export-season-btn');
      if (anchor) anchor.parentElement.insertBefore(narrBtn, anchor.nextSibling);
    }
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
      <div class="ep-fact"><label>Immunity</label><span>${_spoilerFree ? '???' : (epRecord.immunityWinner||'—')}</span></div>
      <div class="ep-fact"><label>Tribal</label><span>${_spoilerFree ? '???' : (epRecord.challengeType==='tribe'?(epRecord.immunityWinner?epRecord.immunityWinner+' wins':(voteEntries.length?'Vote follows':'—')):'All vote')}</span></div>
      <div class="ep-fact ep-eliminated"><label>Eliminated</label><span>${_sfElim} ${_spoilerFree ? '' : riTag}</span></div>
      ${_spoilerFree ? '' : `<div class="ep-fact"><label>Votes</label><span>${Object.values(epRecord.votes||{}).reduce((a,b)=>a+b,0)} cast</span></div>`}
    </div>
    ${_spoilerFree ? `<div style="margin-top:8px;font-size:11px;color:var(--muted);font-style:italic;text-align:center">Spoiler-free mode — open Visual Player to watch the episode</div>` : `<div style="margin-top:4px;margin-bottom:0"><div style="font-size:10px;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px">Vote breakdown</div><div class="ep-vote-list">${chips}</div></div>`}
  </div>`;

  const _otEl = document.getElementById('ep-output-text');
  _otEl.value = _spoilerFree ? '' : (epRecord.summaryText || '');
  _otEl.style.display = '';

  // AI context is useful after every episode; final reports remain finale-only.
  let pdfWrap = document.getElementById('pdf-export-wrap');
  const mkPdfBtn = (id, label, gradient, fn, compact = false) => {
    const b = document.createElement('button');
    b.id = id;
    b.className = 'btn';
    b.style.cssText = `${compact ? 'flex:0 0 auto;min-width:0' : 'flex:1;min-width:180px'};padding:${compact ? '5px 10px' : '8px 12px'};background:linear-gradient(135deg,${gradient});color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:${compact ? '10px' : '12px'};`;
    b.textContent = label;
    b.onclick = async () => {
      b.disabled = true;
      try {
        await fn(s => { b.textContent = s; });
        b.textContent = 'Done!';
        setTimeout(() => { b.textContent = label; b.disabled = false; }, 3000);
      } catch (err) {
        console.error(err);
        b.textContent = 'Failed';
        setTimeout(() => { b.textContent = label; b.disabled = false; }, 4000);
      }
    };
    return b;
  };
  if (gs.episodeHistory?.length) {
    if (!pdfWrap) {
      pdfWrap = document.createElement('div');
      pdfWrap.id = 'pdf-export-wrap';
      pdfWrap.style.cssText = 'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;';

      _otEl.parentElement.appendChild(pdfWrap);
    }

    const seasonComplete = gs.phase === 'complete' || gs.activePlayers?.length <= 1;
    const hasFinalButtons = !!document.getElementById('pdf-summary-btn');
    const hasContextButton = !!document.getElementById('pdf-ai-context-btn');
    if (seasonComplete && !hasFinalButtons) {
      pdfWrap.replaceChildren(
        mkPdfBtn('pdf-summary-btn', 'Export Final Summary PDF', '#e44d26,#f16529', window.exportSummaryPDF),
        mkPdfBtn('pdf-stats-btn', 'Export Final Statistics PDF', '#2563eb,#3b82f6', window.exportStatisticsPDF),
      );
    } else if (!seasonComplete && !hasContextButton) {
      pdfWrap.replaceChildren(
        mkPdfBtn('pdf-ai-context-btn', 'Export AI Context PDF', '#7c3aed,#8b5cf6', window.exportAIContextPDF, true),
      );
    }
  } else if (pdfWrap) {
    pdfWrap.remove();
  }
}


// Sync on page load — restore from localStorage
window.addEventListener('DOMContentLoaded', () => {
  const _sfSaved = localStorage.getItem('simulator_spoilerFree') === 'true';
  const _sfCb = document.getElementById('cfg-spoiler-free');
  if (_sfCb) { _sfCb.checked = _sfSaved; }
  _spoilerFree = _sfSaved;
  // Load roster: fetch the canonical JSON, then layer any localStorage edits on top BY NAME.
  // (Previously a saved localStorage roster fully shadowed the JSON, so players added to the
  //  JSON later — e.g. Ally, Aiden — never appeared for anyone with a stale cache.)
  let _lsRoster = null;
  const _savedRoster = localStorage.getItem('simulator_franchise_roster');
  if (_savedRoster) {
    try { const p = JSON.parse(_savedRoster); if (Array.isArray(p) && p.length) _lsRoster = p; } catch(e) {}
  }
  if (_lsRoster) FRANCHISE_ROSTER = _lsRoster;   // show cached edits immediately while the fetch resolves
  fetch('franchise_roster.json')
    .then(r => r.json())
    .then(data => {
      const base = data?.players?.length ? data.players : null;
      if (!base) return;
      if (_lsRoster) {
        // JSON is the base so new players always appear; user's local edits override by name.
        const byName = new Map(base.map(p => [p.name, p]));
        _lsRoster.forEach(p => { if (p && p.name) byName.set(p.name, p); });
        FRANCHISE_ROSTER = [...byName.values()];
        console.log(`Roster merged: ${base.length} JSON + ${_lsRoster.length} local = ${FRANCHISE_ROSTER.length}`);
      } else {
        FRANCHISE_ROSTER = base;
        console.log(`Roster loaded from JSON: ${base.length} players`);
      }
    })
    .catch(() => {}); // silent fallback to localStorage / embedded copy
});
export function toggleSpoilerFree() {
  _spoilerFree = document.getElementById('cfg-spoiler-free')?.checked || false;
  try { localStorage.setItem('simulator_spoilerFree', _spoilerFree); } catch(e) {}
  renderEpisodeHistory();
  const epToShow = viewingEpNum ? gs.episodeHistory.find(e => e.num === viewingEpNum) : gs.episodeHistory[gs.episodeHistory.length - 1];
  if (epToShow) renderEpisodeView(epToShow);
  renderSeasonHub();
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
    const mcTag = ep.isMonsterCash ? `<span class="ep-hist-tag" style="background:rgba(76,175,80,0.15);color:#4caf50">Monster Cash</span>` : '';
    const mnTag = ep.isMineOverMatter ? `<span class="ep-hist-tag" style="background:rgba(240,168,48,0.15);color:#f0a830">Mine Over Matter</span>` : '';
    const mgrTag = ep.isMerryGoRound ? `<span class="ep-hist-tag" style="background:rgba(255,211,90,0.15);color:#ffd35a">🎠 Carousel</span>` : '';
    const mtfTag = ep.isMazeOfTheFallen ? `<span class="ep-hist-tag" style="background:rgba(255,207,106,0.15);color:#ffcf6a">🌽 Maze</span>` : '';
    const dpTag = ep.isDemonsPlainer ? `<span class="ep-hist-tag" style="background:rgba(255,217,74,0.15);color:#ffd94a">🎢 Demon's Plainer</span>` : '';
    const ilTag = ep.isInterlude ? `<span class="ep-hist-tag" style="background:rgba(227,179,65,0.15);color:#e3b341">${ep.interludeMode === 'jury-house' ? '🏛️ Jury House' : '🏝️ Rescue Island'}</span>` : '';
    const tiTag = ep.isTreasureIsland ? `<span class="ep-hist-tag" style="background:rgba(231,181,60,0.15);color:#e7b53c">Treasure Island</span>` : '';
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
    const tdtTag = ep.isTruthOrDareTrain ? `<span class="ep-hist-tag" style="background:rgba(224,169,74,0.15);color:#e0a94a">🚂 Truth or Dare Train</span>` : '';
    const amgTag = ep.isAMazeInGrip ? `<span class="ep-hist-tag" style="background:rgba(232,185,68,0.15);color:#e8b944">🌽 A-Maze-ing Grip</span>` : '';
    const paTag = ep.isPolesApart ? `<span class="ep-hist-tag" style="background:rgba(74,134,224,0.15);color:#4a86e0">🏖️ Poles Apart</span>` : '';
    const talTag = ep.isTusksLadders ? `<span class="ep-hist-tag" style="background:rgba(161,38,51,0.15);color:#c23b4a">🐘 Tusks &amp; Ladders</span>` : '';
    const nocTag = ep.isKillerClown ? `<span class="ep-hist-tag" style="background:rgba(200,16,46,0.15);color:#ff5a6a">🤡 Killer Clown</span>` : '';
    const bcbTag = ep.isBumperCarBash ? `<span class="ep-hist-tag" style="background:rgba(255,45,149,0.15);color:#ff5ab0">🎡 Bumper Car Bash</span>` : '';
    const scTag = ep.isSayCheese ? `<span class="ep-hist-tag" style="background:rgba(255,146,67,0.15);color:#ff9243">📸 Say Cheese</span>` : '';
    const womTag = ep.isWheelOfMisfortune ? `<span class="ep-hist-tag" style="background:rgba(255,180,60,0.15);color:#ffb43c">🎡 Wheel of Misfortune</span>` : '';
    const phTag = ep.isPaintballHunt ? `<span class="ep-hist-tag" style="background:rgba(63,185,80,0.15);color:#3fb950">Paintball Hunt</span>` : '';
    const hkTag = ep.isHellsKitchen ? `<span class="ep-hist-tag" style="background:rgba(249,115,22,0.15);color:#f97316">Hell's Kitchen</span>` : '';
    const tcTag = ep.isTrustChallenge ? `<span class="ep-hist-tag" style="background:rgba(56,189,248,0.15);color:#38bdf8">Trust Challenge</span>` : '';
    const xtTag = ep.isXtremeTorture ? `<span class="ep-hist-tag" style="background:rgba(239,68,68,0.15);color:#ef4444">X-Treme Torture</span>` : '';
    const lhTag = ep.isLuckyHunt ? `<span class="ep-hist-tag" style="background:rgba(180,130,70,0.15);color:#d4a853">Lucky Hunt</span>` : '';
    const hsTag = ep.isHideAndBeSneaky ? `<span class="ep-hist-tag" style="background:rgba(0,255,65,0.12);color:#00ff41">Hide&Seek</span>` : '';
    const otcTag = ep.isOffTheChain ? `<span class="ep-hist-tag" style="background:rgba(255,107,0,0.15);color:#ff6b00">Off Chain</span>` : '';
    const wwTag = ep.isWawanakwaGoneWild ? `<span class="ep-hist-tag" style="background:rgba(212,160,23,0.15);color:#d4a017">Gone Wild!</span>` : '';
    const taTag = ep.isTriArmedTriathlon ? `<span class="ep-hist-tag" style="background:rgba(200,100,30,0.12);color:#c8641e">Tri-Armed</span>` : '';
    const ccTag = ep.isCampCastaways ? `<span class="ep-hist-tag" style="background:rgba(0,255,65,0.10);color:#00ff41">Camp Castaways</span>` : '';
    const ytTag = ep.isAreWeThereYeti ? `<span class="ep-hist-tag" style="background:rgba(212,133,10,0.10);color:#d4850a">Are We There Yeti?</span>` : '';
    const aeTag = ep.isAlienEgg ? `<span class="ep-hist-tag" style="background:rgba(57,255,20,0.12);color:#39ff14">Alien Egg</span>` : '';
    const bbbTag = ep.isBeachBlanketBogus ? `<span class="ep-hist-tag" style="background:rgba(56,189,248,0.15);color:#38bdf8">Beach Bogus</span>` : '';
    const ctTag = ep.isCrazytown ? `<span class="ep-hist-tag" style="background:rgba(218,165,32,0.15);color:#daa520">Crazytown</span>` : '';
    const csTag = ep.isChefshank ? `<span class="ep-hist-tag" style="background:rgba(107,114,128,0.15);color:#6b7280">Chefshank</span>` : '';
    const ofTag = ep.isOneFlu ? `<span class="ep-hist-tag" style="background:rgba(96,165,250,0.15);color:#60a5fa">One Flu</span>` : '';
    const modTag = ep.isMastersOfDisasters ? `<span class="ep-hist-tag" style="background:rgba(249,115,22,0.15);color:#f97316">Disasters</span>` : '';
    const fmdTag = ep.isFullMetalDrama ? `<span class="ep-hist-tag" style="background:rgba(132,204,22,0.15);color:#84cc16">War</span>` : '';
    const ohTag = ep.isOceansHeist ? `<span class="ep-hist-tag" style="background:rgba(34,211,238,0.15);color:#22d3ee">Heist</span>` : '';
    const bcTag = ep.isMillionBucksBC ? `<span class="ep-hist-tag" style="background:rgba(217,119,6,0.15);color:#d97706">B.C.</span>` : '';
    const smTag = ep.isSportsMarathon ? `<span class="ep-hist-tag" style="background:rgba(22,163,74,0.15);color:#16a34a">Sports</span>` : '';
    const ocTag = ep.isOperationClassified ? `<span class="ep-hist-tag" style="background:rgba(255,45,45,0.15);color:#ff2d2d">Spy</span>` : '';
    const shTag = ep.isSuperHerold ? `<span class="ep-hist-tag" style="background:rgba(239,68,68,0.15);color:#ef4444">Hero</span>` : '';
    const hhTag = ep.isHauntedHouse ? `<span class="ep-hist-tag" style="background:rgba(139,214,106,0.15);color:#8bd66a">🏚️ Haunted</span>` : '';
    const hodTag = ep.isHungOut ? `<span class="ep-hist-tag" style="background:rgba(34,224,230,0.15);color:#22e0e6">🪢 Lie Detector</span>` : '';
    const ppTag = ep.isPrincessPride ? `<span class="ep-hist-tag" style="background:rgba(236,72,153,0.15);color:#ec4899">Princess</span>` : '';
    const gcTag = ep.isGetAClue ? `<span class="ep-hist-tag" style="background:rgba(196,149,106,0.15);color:#c4956a">Mystery</span>` : '';
    const rrTag = ep.isRockNRule ? `<span class="ep-hist-tag" style="background:rgba(139,92,246,0.15);color:#8b5cf6">Rock</span>` : '';
    const kfTag = ep.isCrouchingCourtney ? `<span class="ep-hist-tag" style="background:rgba(192,57,43,0.15);color:#c0392b">Warrior</span>` : '';
    const swoTag = ep.isHouston ? `<span class="ep-hist-tag" style="background:rgba(0,229,255,0.15);color:#00e5ff">Space</span>` : '';
    const tdTag = ep.isTopDog ? `<span class="ep-hist-tag" style="background:rgba(212,160,23,0.15);color:#d4a017">Top Dog</span>` : '';
    const weTag = ep.isWalkEgypt ? `<span class="ep-hist-tag" style="background:rgba(194,166,69,0.15);color:#C2A645">Egypt</span>` : '';
    const brutalerTag = ep.isBiggerBadderBrutaler ? `<span class="ep-hist-tag" style="background:rgba(232,65,65,0.15);color:#E84141">Brutal-er</span>` : '';
    const cftTag = ep.isCrazyFunTime ? `<span class="ep-hist-tag" style="background:rgba(255,0,128,0.15);color:#ff0080">Game Show</span>` : '';
    const fcTag = ep.isFrozenCrossing ? `<span class="ep-hist-tag" style="background:rgba(168,216,234,0.15);color:#a8d8ea">Frozen</span>` : '';
    const vsTag = ep.isVikingSour ? `<span class="ep-hist-tag" style="background:rgba(200,160,64,0.15);color:#c8a040">Viking</span>` : '';
    const brbTag = ep.isBridalBrawls ? `<span class="ep-hist-tag" style="background:rgba(232,48,112,0.15);color:#e83070">Bridal</span>` : '';
    const gfoTag = ep.isGreatFakeOut ? `<span class="ep-hist-tag" style="background:rgba(194,54,22,0.15);color:#c23616">Fake-Out</span>` : '';
    const alsTag = ep.isAfricanLyingSafari ? `<span class="ep-hist-tag" style="background:rgba(196,163,90,0.15);color:#C4A35A">Safari</span>` : '';
    const rpTag = ep.isRapaPhooey ? `<span class="ep-hist-tag" style="background:rgba(232,118,84,0.15);color:#e87654">Rapa Phooey</span>` : '';
    const dhTag = ep.isDrumheller ? `<span class="ep-hist-tag" style="background:rgba(214,138,58,0.15);color:#d68a3a">Drumheller</span>` : '';
    const iibTag = ep.isIceIceBaby ? `<span class="ep-hist-tag" style="background:rgba(90,216,255,0.15);color:#5ad8ff">Ice Ice Baby</span>` : '';
    const fcrTag = ep.isFindersCreepers ? `<span class="ep-hist-tag" style="background:rgba(226,59,59,0.15);color:#e23b3b">Finders Creepers</span>` : '';
    const baTag = ep.isBackstabbersAhoy ? `<span class="ep-hist-tag" style="background:rgba(202,164,90,0.15);color:#caa45a">Backstabbers Ahoy</span>` : '';
    const ptTag = ep.isPlanesTrains ? `<span class="ep-hist-tag" style="background:rgba(56,189,248,0.15);color:#38bdf8">Planes Trains</span>` : '';
    const prwTag = ep.isProjectRunaway ? `<span class="ep-hist-tag" style="background:rgba(233,30,122,0.15);color:#e91e7a">Runaway</span>` : '';
    const ssrTag = ep.isSlapRevolution ? `<span class="ep-hist-tag" style="background:rgba(124,58,237,0.15);color:#7c3aed">Slap Rev</span>` : '';
    const bbTag = ep.isBroadwayBaby ? `<span class="ep-hist-tag" style="background:rgba(240,165,0,0.15);color:#f0a500">Broadway</span>` : '';
    const azTag = ep.isAmazonRace ? `<span class="ep-hist-tag" style="background:rgba(46,204,64,0.15);color:#2ecc40">AHZon</span>` : '';
    const nmTag = ep.isNightAtMuseum ? `<span class="ep-hist-tag" style="background:rgba(218,165,32,0.15);color:#daa520">Museum</span>` : '';
    const tosTag = ep.isTruthOrShark ? `<span class="ep-hist-tag" style="background:rgba(0,229,255,0.15);color:#00e5ff">Shark</span>` : '';
    const rdTag = ep.isRockTheDock ? `<span class="ep-hist-tag" style="background:rgba(61,106,132,0.15);color:#4d7a94">Dock</span>` : '';
    const ttTag = ep.isTropicalTakedown ? `<span class="ep-hist-tag" style="background:rgba(0,200,150,0.15);color:#00c896">Tropical</span>` : '';
    const mmhTag = ep.isMidnightManhunt ? `<span class="ep-hist-tag" style="background:rgba(139,90,43,0.15);color:#8b5a2b">Manhunt</span>` : '';
    const gpTag = ep.isGreecesPieces ? `<span class="ep-hist-tag" style="background:rgba(212,168,68,0.15);color:#d4a844">Olympics</span>` : '';
    const hbTag = ep.isHangarBlack ? `<span class="ep-hist-tag" style="background:rgba(146,255,179,0.15);color:#92ffb3">Hangar</span>` : '';
    const hdTag = ep.isPicnicHangingDork ? `<span class="ep-hist-tag" style="background:rgba(140,46,10,0.15);color:#e8a04a">Outback</span>` : '';
    const amhTag = ep.isAftermayhem ? `<span class="ep-hist-tag" style="background:rgba(255,209,60,0.15);color:#ffd13c">Aftermayhem</span>` : '';
    const cocTag = ep.isChainOfCommand ? `<span class="ep-hist-tag" style="background:rgba(74,80,40,0.25);color:#b8860b">Chain</span>` : '';
    const rtcTag = ep.isRewardOnly ? `<span class="ep-hist-tag" style="background:rgba(240,165,0,0.15);color:#f0a500">Reward</span>` : '';
    const _hasAuction = (ep.twists || []).some(t => t.type === 'auction');
    const aucTag = _hasAuction ? `<span class="ep-hist-tag" style="background:rgba(233,196,106,0.15);color:#e9c46a">Auction</span>` : '';
    const ncTag = ep.noChallenge && !_hasAuction ? `<span class="ep-hist-tag" style="background:rgba(240,163,90,0.15);color:#f0a35a">No Challenge</span>` : '';
    const hasCheckpoint = !!gsCheckpoints[ep.num];
    const replayBtn = hasCheckpoint
      ? `<button class="ep-hist-replay" title="Re-run this episode" onclick="event.stopPropagation();replayEpisode(${ep.num})">↺</button>`
      : '';
    return `<div class="ep-hist-card ${ep.num===currentNum?'active':''}" onclick="viewEpisode(${ep.num})">
      <div class="ep-hist-ep">Episode ${ep.num}${replayBtn}</div>
      <div class="ep-hist-elim">${_spoilerFree ? '???' : ep.multiTribalElims?.length >= 2 ? ep.multiTribalElims.join(' + ') : ep.ambassadorData?.ambassadorEliminated ? `${ep.ambassadorData.ambassadorEliminated} + ${ep.eliminated||'?'}` : ep.tiedDestinies?.eliminatedPartner ? `${ep.eliminated||'?'} + ${ep.tiedDestinies.eliminatedPartner}` : ep.emissaryEliminated ? `${ep.eliminated||'?'} + ${ep.emissaryEliminated}` : ep.firstEliminated ? `${ep.firstEliminated} + ${ep.eliminated||'?'}` : ep.isInterlude ? 'Interlude' : (ep.eliminated || (ep.isFinale ? 'FTC' : '\u2014'))}</div>
      <div>${riTag}${mergeTag}${finaleTag}${slasherTag}${mcTag}${mnTag}${mgrTag}${mtfTag}${dpTag}${ilTag}${tiTag}${tddTag}${suTag}${brunchTag}${bsTag}${pfTag}${cdTag}${aatTag}${evTag}${dbTag}${tsTag}${soTag}${utcTag}${tdtTag}${amgTag}${paTag}${talTag}${nocTag}${bcbTag}${scTag}${womTag}${phTag}${hkTag}${tcTag}${xtTag}${lhTag}${hsTag}${otcTag}${wwTag}${taTag}${ccTag}${ytTag}${aeTag}${bbbTag}${ctTag}${csTag}${ofTag}${modTag}${fmdTag}${ohTag}${bcTag}${smTag}${ocTag}${shTag}${hhTag}${hodTag}${ppTag}${gcTag}${rrTag}${kfTag}${swoTag}${tdTag}${weTag}${brutalerTag}${cftTag}${fcTag}${vsTag}${ssrTag}${bbTag}${azTag}${nmTag}${tosTag}${rdTag}${ttTag}${mmhTag}${gpTag}${hbTag}${hdTag}${brbTag}${gfoTag}${alsTag}${rpTag}${dhTag}${iibTag}${fcrTag}${baTag}${ptTag}${prwTag}${amhTag}${cocTag}${rtcTag}${aucTag}${ncTag}</div>
    </div>`;
  }).join('');
}

export function viewEpisode(num) {
  viewingEpNum = num;
  const epRecord = gs.episodeHistory.find(e=>e.num===num);
  if (epRecord) { renderEpisodeView(epRecord); renderEpisodeHistory(); renderGameState(); renderSeasonHub(); }
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
  _autoRevealSpoiler(ep.num);
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
      _idbDelete('cp_' + k);
    }
  });
  // Re-run this episode — check if we're replaying the finale
  const _isFinaleReplay = gs.phase === 'finale';
  const ep = _isFinaleReplay ? simulateFinale() : simulateEpisode();
  if (!ep) return;
  if (seasonConfig.popularityEnabled !== false) { updatePopularity(ep); saveGameState(); }
  _autoRevealSpoiler(ep.num);
  viewingEpNum = ep.num;
  renderRunTab();
  document.getElementById('run-main').scrollTop = 0;
}

export function copyOutput() {
  const ta = document.getElementById('ep-output-text');
  const epRecord = viewingEpNum ? gs.episodeHistory.find(e=>e.num===viewingEpNum) : gs.episodeHistory[gs.episodeHistory.length-1];
  const text = epRecord?.summaryText || ta.value;
  const btn = event.target;
  if (!text) { btn.textContent = 'Nothing to copy'; setTimeout(()=>btn.textContent='Copy', 1500); return; }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied!'; setTimeout(()=>btn.textContent='Copy', 1500);
    });
  } else {
    ta.value = text;
    ta.select(); document.execCommand('copy');
    if (_spoilerFree) ta.value = '';
    btn.textContent = 'Copied!'; setTimeout(()=>btn.textContent='Copy', 1500);
  }
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
    if (!t) return;
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
  let _lastAMReturn = 0;
  let _amReturnApplied = false;

  while (active > finale && ep <= 100) {
    const etype = twistMap[ep] || null;
    const _allTypes = twistMapAll[ep] || [];

    // How many players leave/return this episode?
    // Check ALL twists on this episode (not just the last one)
    let elims = 1;
    if (_allTypes.includes('no-tribal')) elims = 0;
    if (_allTypes.includes('reward-twist-challenge')) elims = 0;
    if (_allTypes.includes('elimination-swap')) elims = 0;
    // Interlude episodes (Rescue Island Life / Jury House) are non-elimination — nobody leaves
    if (_allTypes.includes('rescue-island-life')) elims = 0;
    if (_allTypes.includes('jury-house')) elims = 0;
    // Account for Team Swap advantages that cancelled eliminations mid-season
    if (gs?.skippedEliminationEps?.includes(ep)) elims = 0;
    if (_allTypes.includes('double-elim')) elims = Math.max(elims, 2);
    if (_allTypes.includes('multi-tribal') && !merged) elims = Math.max(elims, Math.max(2, (seasonConfig.teams || 2) - 1));
    if (_allTypes.includes('slasher-night')) elims = Math.max(elims, 1);
    if (_allTypes.includes('monster-cash')) elims = Math.max(elims, 1);
    if (_allTypes.includes('mine-over-matter')) elims = Math.max(elims, 1);
    if (_allTypes.includes('treasure-island')) elims = Math.max(elims, 1);
    if (_allTypes.includes('sudden-death')) elims = Math.max(elims, 1);
    if (_allTypes.includes('ambassadors')) elims = Math.max(elims, 2);
    if (_allTypes.includes('tied-destinies')) elims = Math.max(elims, 2);
    if (_allTypes.includes('emissary-vote')) elims = Math.max(elims, 2);
    // Exile Duel: person goes to exile (0 elims this ep) — duel happens next episode (1 elim)
    if (_allTypes.includes('exile-duel')) elims = 0;
    _totalElimsToHere += elims;
    let returns = _allTypes.includes('second-chance') ? 1 : 0;
    const _rpTwist = (seasonConfig.twistSchedule||[]).filter(t => t && Number(t.episode) === ep).find(t => t.type === 'returning-player');
    if (_rpTwist) returns += (_rpTwist.returnCount || 1);
    // Fan vote return: pending return from live game adds +1 this episode
    if (gs?.pendingFanVoteReturn && gs.eliminated?.includes(gs.pendingFanVoteReturn) && !_fvReturnApplied) {
      returns++; _fvReturnApplied = true;
    }
    // Fan vote prediction: ONCE after X total eliminations, someone comes back NEXT episode
    const _fvThresholdCfg = parseInt(seasonConfig.fanVoteFrequency) || 0;
    if (_fvThresholdCfg && !_lastFVReturn && _totalElimsToHere >= _fvThresholdCfg) {
      _lastFVReturn = _totalElimsToHere;
    }
    // Apply the return on the episode AFTER the fan vote fired
    if (_lastFVReturn && _lastFVReturn !== _totalElimsToHere && !_fvReturnApplied) {
      returns++; _fvReturnApplied = true;
    }
    // Aftermayhem prediction: ONCE after X total eliminations, winner comes back NEXT episode
    const _amThresholdCfg = parseInt(seasonConfig.aftermayhemReturn) || 0;
    if (_amThresholdCfg && !_lastAMReturn && _totalElimsToHere >= _amThresholdCfg) {
      _lastAMReturn = _totalElimsToHere;
    }
    if (_lastAMReturn && _lastAMReturn !== _totalElimsToHere && !_amReturnApplied) {
      returns++; _amReturnApplied = true;
    }

    // RI return: fires when the episode STARTS with <= riReentryAt players.
    // Each return event brings back cfg.riReturnPerEvent people (rescue format only —
    // duel/redemption formats always return exactly the 1 winner). Matches engine
    // episode.js _perEvent logic so the projected "X LEFT" count is accurate.
    const _riReentryAt = seasonConfig.riReentryAt || seasonConfig.mergeAt || mergeAt;
    const _riPerEvent = (seasonConfig.riFormat === 'rescue') ? Math.max(1, seasonConfig.riReturnPerEvent || 1) : 1;
    let riReturn = 0;
    if (riActive && !_riReturn1Used && active <= _riReentryAt) {
      riReturn = _riPerEvent;
      _riReturn1Used = true;
    } else if (riActive && _riReturn1Used && !_riReturn2Used && (seasonConfig.riReturnPoints || 1) >= 2 && active <= (seasonConfig.riSecondReturnAt || 5)) {
      riReturn += _riPerEvent;
      _riReturn2Used = true;
    }

    // Merge fires when pre-return count <= mergeAt (matches engine: _preReturnActive subtracts returns)
    if (!merged && active <= mergeAt) merged = true;

    const activeWithReturns = active + returns + riReturn;
    eps.push({ ep, active: activeWithReturns, phase: merged ? 'post-merge' : 'pre-merge', engineType: etype });
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
  const schedule = (seasonConfig.twistSchedule || []).filter(Boolean);

  if (!epMap.length) {
    container.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:13px">Add players in Cast Builder to generate timeline.</div>';
    return;
  }

  let html = '';
  epMap.forEach(({ ep, active, phase }) => {
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
      if (t.type === 'reward-twist-challenge') {
        const _rtcChallenges = TWIST_CATALOG.filter(c => c.category === 'challenge');
        const _rtcSelected = t.rewardEngine || '';
        const _rtcLabel = _rtcSelected ? (_rtcChallenges.find(c => c.id === _rtcSelected)?.name || _rtcSelected) : 'Generic';
        let _rtcHtml = `<div style="display:inline-flex;align-items:center;gap:4px;position:relative">`;
        _rtcHtml += `<input type="text" id="rtc-search-${t.id}" placeholder="Search challenges..." value="${_rtcLabel}" onfocus="this.value='';_showRtcDropdown('${t.id}')" onblur="setTimeout(()=>_hideRtcDropdown('${t.id}'),200)" oninput="_filterRtcDropdown('${t.id}',this.value)" onclick="event.stopPropagation()" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:2px 4px;width:140px">`;
        _rtcHtml += `<div id="rtc-dropdown-${t.id}" style="display:none;position:absolute;top:100%;left:0;z-index:999;background:#1e1e2e;border:1px solid rgba(99,102,241,0.4);border-radius:4px;max-height:200px;overflow-y:auto;width:220px;box-shadow:0 4px 12px rgba(0,0,0,0.5)">`;
        _rtcHtml += `<div class="rtc-option" onmousedown="event.preventDefault();_selectRtcEngine('${t.id}','')" style="padding:4px 8px;font-size:10px;color:#cdd6f4;cursor:pointer;border-bottom:1px solid rgba(99,102,241,0.15)" onmouseover="this.style.background='rgba(99,102,241,0.2)'" onmouseout="this.style.background=''">Generic (random)</div>`;
        _rtcChallenges.forEach(c => {
          const _seriesTag = c.chalSeries ? ` · ${c.chalSeries}` : '';
          const _phaseTag = c.phase === 'pre-merge' ? ' [PRE]' : c.phase === 'post-merge' ? ' [POST]' : '';
          _rtcHtml += `<div class="rtc-option" data-name="${c.name.toLowerCase()}" onmousedown="event.preventDefault();_selectRtcEngine('${t.id}','${c.id}')" style="padding:4px 8px;font-size:10px;color:#cdd6f4;cursor:pointer;border-bottom:1px solid rgba(99,102,241,0.08)" onmouseover="this.style.background='rgba(99,102,241,0.2)'" onmouseout="this.style.background=''">${c.emoji} ${c.name}${_seriesTag}${_phaseTag}</div>`;
        });
        _rtcHtml += `</div></div>`;
        return `<span class="fd-ep-twist-tag" style="display:inline-flex;align-items:center;gap:2px;flex-wrap:wrap">${cat.emoji} Reward: ${_rtcHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'producer-swap') {
        const tribeNames = (seasonConfig.tribes || []).map(tr => tr.name).filter(Boolean);
        const allNames = (players || []).map(p => p.name);
        const _ps = (field, val, opts, placeholder) => {
          let h = `<select onchange="event.stopPropagation();updateTwist('${t.id}','${field}',this.value)" onclick="event.stopPropagation()" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 3px;margin-left:2px" title="${placeholder}">`;
          h += `<option value="" ${!val ? 'selected' : ''}>${placeholder}</option>`;
          opts.forEach(o => h += `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`);
          return h + `</select>`;
        };
        let cfg = _ps('swapPlayer', t.swapPlayer || '', allNames, 'move player');
        cfg += ` <span style="color:#a5b4fc">→</span> ` + _ps('swapToTribe', t.swapToTribe || '', tribeNames, 'to tribe');
        cfg += ` <span style="opacity:.45">swap back:</span>` + _ps('swapPlayer2', t.swapPlayer2 || '', allNames, 'none');
        return `<span class="fd-ep-twist-tag" style="display:inline-flex;align-items:center;gap:2px;flex-wrap:wrap">${cat.emoji} ${cat.name} ${cfg} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'auction') {
        const _mode = t.auctionImmunity === 'reward' ? 'reward' : 'immunity';
        let _aSel = `<select onchange="event.stopPropagation();updateTwist('${t.id}','auctionImmunity',this.value)" onclick="event.stopPropagation()" title="Immunity: auction is the only source of immunity (no challenge). Reward: auction is a reward alongside a normal immunity challenge." style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 3px;margin-left:2px">`;
        _aSel += `<option value="immunity" ${_mode==='immunity'?'selected':''}>Immunity</option>`;
        _aSel += `<option value="reward" ${_mode==='reward'?'selected':''}>Reward</option>`;
        _aSel += `</select>`;
        return `<span class="fd-ep-twist-tag" style="display:inline-flex;align-items:center;gap:2px;flex-wrap:wrap">${cat.emoji} ${cat.name} ${_aSel} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.spoilerFree) {
        const phaseTag = cat?.phase === 'pre-merge' ? 'Pre-merge challenge' : cat?.phase === 'post-merge' ? 'Post-merge challenge' : 'Challenge';
        return `<span class="fd-ep-twist-tag" style="font-style:italic;opacity:0.7" onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')">🔒 ${phaseTag} ×</span>`;
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
  if (filter !== 'challenge') currentChalSeries = 'all';
  document.querySelectorAll('.fd-filter-btn[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
  renderTwistCatalog();
}

export function setChalSeries(series) {
  currentChalSeries = series;
  document.querySelectorAll('.fd-filter-btn[data-chal-series]').forEach(b => b.classList.toggle('active', b.dataset.chalSeries === series));
  renderTwistCatalog();
}

export function renderTwistCatalog() {
  const container = document.getElementById('fd-catalog');
  if (!container) return;
  const search = (document.getElementById('fd-search')?.value || '').toLowerCase();
  const cats   = ['team','immunity','elim','returns','advantages','social','challenge'];

  // Update category counts
  cats.forEach(cat => {
    const el = document.getElementById('fd-count-' + cat);
    if (el) el.textContent = TWIST_CATALOG.filter(t => t.category === cat).length;
  });
  const allEl = document.getElementById('fd-count-all');
  if (allEl) allEl.textContent = TWIST_CATALOG.length;

  let filtered = TWIST_CATALOG.slice();
  if (currentTwistFilter !== 'all') filtered = filtered.filter(t => t.category === currentTwistFilter);
  if (currentTwistFilter === 'challenge' && currentChalSeries !== 'all') {
    filtered = filtered.filter(t => t.chalSeries === currentChalSeries);
  }
  if (search) filtered = filtered.filter(t => t.name.toLowerCase().includes(search) || t.desc.toLowerCase().includes(search));

  // Series sub-filter row for challenges
  const seriesRow = document.getElementById('fd-chal-series-row');
  if (seriesRow) {
    if (currentTwistFilter === 'challenge') {
      const seriesLabels = {
        'island':'Island','action':'Action','world-tour':'World Tour',
        'revenge':'Revenge','all-stars':'All-Stars','pahkitew':'Pahkitew',
        'ridonculous':'Ridonculous Race',
        'dc1':'DC S1','dc2':'DC S2','dc3':'DC S3','dc4':'DC S4','dc5':'DC S5'
      };
      const allSeries = [...new Set(TWIST_CATALOG.filter(c => c.category === 'challenge' && c.chalSeries).map(c => c.chalSeries))];
      const chalTwists = TWIST_CATALOG.filter(c => c.category === 'challenge');
      seriesRow.innerHTML = `<button class="fd-filter-btn ${currentChalSeries === 'all' ? 'active' : ''}" data-chal-series="all" onclick="setChalSeries('all')">All Series ${chalTwists.length}</button>` +
        allSeries.map(s => {
          const cnt = chalTwists.filter(c => c.chalSeries === s).length;
          return `<button class="fd-filter-btn ${currentChalSeries === s ? 'active' : ''}" data-chal-series="${s}" onclick="setChalSeries('${s}')">${seriesLabels[s] || s} ${cnt}</button>`;
        }).join('');
      seriesRow.style.display = 'flex';
    } else {
      seriesRow.style.display = 'none';
    }
  }

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
      if (!tw) return;
      if (selectedEpisodes.has(Number(tw.episode))) _existingOnSelected.add(tw.type);
    });
  }
  container.innerHTML = filtered.map(t => {
    const phaseBlocked = canAssign && t.phase !== 'any' &&
      [...selPhases].every(ph => ph !== t.phase);
    const incompBlocked = canAssign && (t.incompatible || []).some(ic => _existingOnSelected.has(ic) && !_sdChalPair(t.id, ic));
    const tribeBlocked = canAssign && t.minTribes && (seasonConfig.teams || 2) < t.minTribes;
    const riBlocked = canAssign && (t.id === 'second-chance') && seasonConfig.ri;
    const popBlocked = canAssign && t.id === 'second-chance' && !seasonConfig.popularityEnabled;
    const exileBlocked = canAssign && t.id === 'exile-island' && seasonConfig.exile;
    // Tied Destinies: requires even number of active players
    const _selEpNums = [...selectedEpisodes];
    const _tdEvenBlocked = canAssign && t.id === 'tied-destinies' && _selEpNums.some(epN => {
      const epInfo = epMap.find(e => e.ep === epN);
      return epInfo && epInfo.active % 2 !== 0;
    });
    const _taOddBlocked = canAssign && t.id === 'tri-armed-triathlon' && _selEpNums.some(epN => {
      const epInfo = epMap.find(e => e.ep === epN);
      return epInfo && epInfo.active % 2 !== 0;
    });
    const _ccEvenBlocked = canAssign && t.id === 'crouching-courtney' && _selEpNums.some(epN => {
      const epInfo = epMap.find(e => e.ep === epN);
      return epInfo && epInfo.active % 2 !== 0;
    });
    const _bbEvenBlocked = canAssign && t.id === 'bridal-brawls' && _selEpNums.some(epN => {
      const epInfo = epMap.find(e => e.ep === epN);
      return epInfo && epInfo.active % 2 !== 0;
    });
    const _womEvenBlocked = canAssign && t.id === 'wheel-of-misfortune' && _selEpNums.some(epN => {
      const epInfo = epMap.find(e => e.ep === epN);
      return epInfo && epInfo.active % 2 !== 0;
    });
    // Rescue Island Life interlude requires Rescue Island to be enabled
    const _rilBlocked = canAssign && t.id === 'rescue-island-life' && !seasonConfig.ri;
    const blocked = phaseBlocked || incompBlocked || tribeBlocked || riBlocked || popBlocked || exileBlocked || _tdEvenBlocked || _taOddBlocked || _ccEvenBlocked || _bbEvenBlocked || _womEvenBlocked || _rilBlocked;
    const blockReason = phaseBlocked ? ' ⚠️ wrong phase' : incompBlocked ? ' ⚠️ conflicts with existing twist' : tribeBlocked ? ` ⚠️ needs ${t.minTribes}+ tribes` : riBlocked ? ' ⚠️ incompatible with 2nd Chance Isle' : exileBlocked ? ' ⚠️ incompatible with Exile Format' : popBlocked ? ' ⚠️ requires Popularity enabled' : _rilBlocked ? ' ⚠️ requires Rescue Island enabled' : _tdEvenBlocked ? ' ⚠️ needs even player count' : _taOddBlocked ? ' ⚠️ needs even player count' : _ccEvenBlocked ? ' ⚠️ needs even player count for pairs' : _bbEvenBlocked ? ' ⚠️ needs even player count for pairs' : _womEvenBlocked ? ' ⚠️ needs even player count for pairs' : '';
    return `
    <div class="twist-card ${canAssign && !blocked ? 'assignable' : ''} ${blocked ? 'phase-blocked' : ''}" onclick="${blocked ? '' : `assignTwist('${t.id}')`}">
      <div class="twist-card-top">
        <span class="twist-card-emoji">${t.emoji}</span>
        <div class="twist-card-info">
          <span class="twist-card-name">${t.name}</span>
          <span class="twist-phase">${t.phase}${t.chalSeries ? ` · ${t.chalSeries === 'island' ? '🏝️ Island' : t.chalSeries === 'action' ? '🎬 Action' : t.chalSeries === 'world-tour' ? '✈️ World Tour' : t.chalSeries === 'revenge' ? '☢️ Revenge' : t.chalSeries}` : ''}${blockReason}</span>
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
      if (existingOnEp.some(t => twist.incompatible.includes(t.type) && !_sdChalPair(twistId, t.type))) {
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

// ── Reward Twist Challenge: searchable dropdown helpers ──

export function _showRtcDropdown(twistId) {
  const dd = document.getElementById('rtc-dropdown-' + twistId);
  if (dd) { dd.style.display = 'block'; _filterRtcDropdown(twistId, ''); }
}

export function _hideRtcDropdown(twistId) {
  const dd = document.getElementById('rtc-dropdown-' + twistId);
  if (dd) dd.style.display = 'none';
  // Restore display label
  const input = document.getElementById('rtc-search-' + twistId);
  if (input) {
    const t = (seasonConfig.twistSchedule||[]).find(t => t.id === twistId);
    const eng = t?.rewardEngine || '';
    input.value = eng ? (TWIST_CATALOG.find(c => c.id === eng)?.name || eng) : 'Generic';
  }
}

export function _filterRtcDropdown(twistId, query) {
  const dd = document.getElementById('rtc-dropdown-' + twistId);
  if (!dd) return;
  const q = (query || '').toLowerCase();
  dd.querySelectorAll('.rtc-option').forEach(opt => {
    const name = opt.dataset.name || 'generic';
    opt.style.display = (!q || name.includes(q) || opt.textContent.toLowerCase().includes(q)) ? '' : 'none';
  });
}

export function _selectRtcEngine(twistId, engineId) {
  const t = (seasonConfig.twistSchedule||[]).find(t => t.id === twistId);
  if (!t) return;
  t.rewardEngine = engineId || null;
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  _hideRtcDropdown(twistId);
  renderTimeline();
}

// ══════════════════════════════════════════════════════════════════════
// CHALLENGE RANDOMIZER
// ══════════════════════════════════════════════════════════════════════

export function randomizeChallenges(opts = {}) {
  const {
    seriesFilter = ['island', 'action', 'revenge', 'dc1', 'dc2', 'dc3', 'dc4', 'dc5'],
    spoilerFree = false,
    clearExisting = true
  } = opts;

  const epMap = buildEpisodeMap();
  if (!epMap.length) return;

  if (!seasonConfig.twistSchedule) seasonConfig.twistSchedule = [];

  if (clearExisting) {
    seasonConfig.twistSchedule = seasonConfig.twistSchedule.filter(t => {
      const cat = TWIST_CATALOG.find(c => c.id === t.type);
      return !cat || cat.category !== 'challenge';
    });
  }

  const allChallenges = TWIST_CATALOG.filter(c => c.category === 'challenge');
  const eligible = allChallenges.filter(c => {
    if (!c.chalSeries) return true;
    return seriesFilter.includes(c.chalSeries);
  });

  const nonFinaleEps = epMap.filter(e => e.phase !== 'finale');
  const existingChalEps = new Set(
    seasonConfig.twistSchedule
      .filter(t => { const cat = TWIST_CATALOG.find(c => c.id === t.type); return cat?.category === 'challenge'; })
      .map(t => Number(t.episode))
  );

  const targetEps = nonFinaleEps.filter(e => !existingChalEps.has(e.ep));
  if (!targetEps.length) return;

  const teams = seasonConfig.teams || 2;

  const prePool = _shuffle(eligible.filter(c =>
    c.phase === 'pre-merge' || c.phase === 'any'
  ));
  const postPool = _shuffle(eligible.filter(c =>
    c.phase === 'post-merge' || c.phase === 'any'
  ));

  const used = new Set();
  const assignments = [];

  const mergeEp = targetEps.find(e =>
    e.phase === 'post-merge' && epMap.find(p => p.ep === e.ep - 1)?.phase === 'pre-merge'
  );
  const preferMerge = eligible.filter(c => c.preferMergeEp && !used.has(c.id));
  if (mergeEp && preferMerge.length) {
    const pick = preferMerge[0];
    if (_canPlace(pick, mergeEp, teams)) {
      assignments.push({ ep: mergeEp.ep, challenge: pick });
      used.add(pick.id);
    }
  }

  for (const epInfo of targetEps) {
    if (assignments.some(a => a.ep === epInfo.ep)) continue;

    const pool = epInfo.phase === 'pre-merge' ? prePool : postPool;
    const prevStyle = _getPrevStyle(assignments, epInfo.ep, epMap);

    let placed = false;
    for (let i = 0; i < pool.length; i++) {
      const chal = pool[i];
      if (used.has(chal.id)) continue;
      if (!_canPlace(chal, epInfo, teams)) continue;
      if (chal.chalStyle && chal.chalStyle === prevStyle) continue;

      assignments.push({ ep: epInfo.ep, challenge: chal });
      used.add(chal.id);
      placed = true;
      break;
    }

    if (!placed) {
      for (let i = 0; i < pool.length; i++) {
        const chal = pool[i];
        if (used.has(chal.id)) continue;
        if (!_canPlace(chal, epInfo, teams)) continue;

        assignments.push({ ep: epInfo.ep, challenge: chal });
        used.add(chal.id);
        placed = true;
        break;
      }
    }
  }

  for (const a of assignments) {
    const entry = {
      id: 'tw-rand-' + Date.now() + '-' + a.ep,
      episode: a.ep,
      type: a.challenge.id
    };
    if (spoilerFree) entry.spoilerFree = true;
    seasonConfig.twistSchedule.push(entry);
  }

  if (spoilerFree) _spoilerFree = true;

  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
  renderTwistCatalog();
  return assignments.length;
}

function _shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const _EVEN_PLAYER_IDS = new Set(['tied-destinies','tri-armed-triathlon','crouching-courtney','bridal-brawls','wheel-of-misfortune']);
function _canPlace(chal, epInfo, teams) {
  if (chal.minTribes && teams < chal.minTribes) return false;
  if (chal.minPlayers && epInfo.active < chal.minPlayers) return false;
  if (chal.phase === 'pre-merge' && epInfo.phase !== 'pre-merge') return false;
  if (chal.phase === 'post-merge' && epInfo.phase !== 'post-merge') return false;
  if (_EVEN_PLAYER_IDS.has(chal.id) && epInfo.active % 2 !== 0) return false;
  return true;
}

function _getPrevStyle(assignments, currentEp, epMap) {
  const sorted = assignments.filter(a => a.ep < currentEp).sort((a, b) => b.ep - a.ep);
  return sorted.length ? sorted[0].challenge.chalStyle : null;
}

function _autoRevealSpoiler(epNum) {
  const twists = (seasonConfig.twistSchedule || []).filter(t => t && Number(t.episode) === epNum && t.spoilerFree);
  if (!twists.length) return;
  twists.forEach(t => { delete t.spoilerFree; });
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
}

export function revealSpoiler(ep) {
  const twists = (seasonConfig.twistSchedule || []).filter(t => t && Number(t.episode) === ep);
  twists.forEach(t => { delete t.spoilerFree; });
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

export function revealAllSpoilers() {
  (seasonConfig.twistSchedule || []).forEach(t => { if (t) delete t.spoilerFree; });
  _spoilerFree = false;
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

export function showRandomizerPanel() {
  const existing = document.getElementById('randomizer-panel');
  if (existing) { existing.remove(); return; }

  const allSeries = [...new Set(TWIST_CATALOG.filter(c => c.category === 'challenge' && c.chalSeries).map(c => c.chalSeries))];
  const seriesLabels = {
    'island': 'Island', 'action': 'Action', 'world-tour': 'World Tour',
    'revenge': 'Revenge', 'all-stars': 'All-Stars', 'pahkitew': 'Pahkitew',
    'ridonculous': 'Ridonculous Race',
    'dc1': 'DC S1', 'dc2': 'DC S2', 'dc3': 'DC S3', 'dc4': 'DC S4', 'dc5': 'DC S5'
  };
  const defaultOn = ['island', 'action', 'revenge', 'dc1', 'dc2', 'dc3', 'dc4', 'dc5'];

  let checkboxes = allSeries.map(s =>
    `<label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--text);cursor:pointer">
      <input type="checkbox" class="rand-series-cb" value="${s}" ${defaultOn.includes(s) ? 'checked' : ''} style="accent-color:#6366f1"> ${seriesLabels[s] || s}
    </label>`
  ).join('');

  const panel = document.createElement('div');
  panel.id = 'randomizer-panel';
  panel.innerHTML = `
    <div style="background:var(--surface);border:1px solid rgba(99,102,241,0.3);border-radius:8px;padding:16px;margin:12px 0;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:600;color:var(--text);font-size:14px">🎲 Challenge Randomizer</span>
        <span onclick="showRandomizerPanel()" style="cursor:pointer;color:var(--muted);font-size:18px">×</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px 16px">
        ${checkboxes}
      </div>
      <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--text);cursor:pointer">
        <input type="checkbox" id="rand-spoiler-free" style="accent-color:#6366f1"> Spoiler-free mode
        <span style="color:var(--muted);font-size:11px">(hides challenge names until episode plays)</span>
      </label>
      <div style="display:flex;gap:8px;align-items:center">
        <button onclick="_runRandomizer()" style="background:#6366f1;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-weight:500">Randomize</button>
        <button onclick="revealAllSpoilers()" style="background:transparent;border:1px solid rgba(99,102,241,0.3);color:var(--text);border-radius:6px;padding:8px 12px;font-size:12px;cursor:pointer">Reveal All</button>
        <span id="rand-result" style="font-size:12px;color:var(--muted)"></span>
      </div>
    </div>`;

  const timeline = document.getElementById('fd-timeline');
  if (timeline) timeline.parentNode.insertBefore(panel, timeline);
}

export function _runRandomizer() {
  const cbs = document.querySelectorAll('.rand-series-cb:checked');
  const seriesFilter = [...cbs].map(cb => cb.value);
  if (!seriesFilter.length) {
    const el = document.getElementById('rand-result');
    if (el) el.textContent = 'Select at least one series.';
    return;
  }
  const spoilerFree = document.getElementById('rand-spoiler-free')?.checked || false;
  const count = randomizeChallenges({ seriesFilter, spoilerFree });
  const el = document.getElementById('rand-result');
  if (el) el.textContent = count ? `${count} challenge${count > 1 ? 's' : ''} assigned.` : 'No episodes available.';
}

// ══════════════════════════════════════════════════════════════════════
// RESULTS TAB
// ══════════════════════════════════════════════════════════════════════

export function buildSeasonOverviewModel(state = gs, cast = players) {
  const history = state?.episodeHistory || [];
  const active = [...(state?.activePlayers || [])];
  const eliminated = [...(state?.eliminated || [])];
  const names = [...new Set([...(cast || []).map(player => player.name), ...active, ...eliminated])];
  const lastPop = history[history.length - 1]?.popularitySnapshot || state?.popularity || {};
  const prevPop = history.slice(0, -1).reverse().find(ep => ep.popularitySnapshot)?.popularitySnapshot || {};
  const metrics = names.map(name => {
    let ballots = 0, correctBallots = 0, votesReceived = 0, influence = 0;
    history.forEach(ep => {
      const boots = getEpisodeEliminations(ep);
      const episodeLogs = ep.multiTribalResults?.length
        ? ep.multiTribalResults.flatMap(result => result.log || [])
        : [...(ep.votingLog || []), ...(ep.votingLog2 || [])];
      const ownVotes = episodeLogs.filter(vote => vote.voter === name && !vote.isExtraVote && !vote.sitdSacrificed);
      ballots += ownVotes.length;
      correctBallots += ownVotes.filter(vote => boots.includes(vote.voted)).length;
      votesReceived += episodeLogs.filter(vote => vote.voted === name && !vote.sitdSacrificed).length;
      const steered = [...(ep.alliances || []), ...(ep.alliances2 || [])].some(alliance => boots.includes(alliance.target)
        && (alliance.spearhead === name || alliance.members?.[0] === name));
      if (steered) influence++;
    });
    const challengeWins = Number(state?.chalRecord?.[name]?.wins || 0);
    const voteAccuracy = ballots ? correctBallots / ballots : 0;
    const alliances = (state?.namedAlliances || []).filter(alliance => alliance.active !== false && alliance.members?.includes(name)).map(alliance => alliance.name);
    const reputation = state?.strategicReputations?.[name]?.labels || [];
    const popularity = Number(lastPop[name] || 0);
    const momentum = popularity - Number(prevPop[name] || 0);
    const pulse = challengeWins * 2 + voteAccuracy * 3 + influence * 1.5 + alliances.length * .6 + momentum * .08 - votesReceived * .08;
    return { name, active: active.includes(name), challengeWins, ballots, correctBallots, voteAccuracy, votesReceived, influence, alliances, reputation, popularity, momentum, pulse };
  });
  const activeMetrics = metrics.filter(metric => metric.active);
  const by = (key, min = 0) => [...activeMetrics].filter(metric => metric[key] >= min).sort((a, b) => b[key] - a[key]);
  const leaders = [
    { label: 'Challenge leader', metric: 'wins', player: by('challengeWins', 1)[0], value: leader => `${leader.challengeWins} win${leader.challengeWins === 1 ? '' : 's'}` },
    { label: 'Vote accuracy', metric: 'ballots', player: [...activeMetrics].filter(metric => metric.ballots >= 2).sort((a, b) => b.voteAccuracy - a.voteAccuracy || b.ballots - a.ballots)[0], value: leader => `${Math.round(leader.voteAccuracy * 100)}% · ${leader.ballots} ballots` },
    { label: 'Agenda control', metric: 'votes', player: by('influence', 1)[0], value: leader => `${leader.influence} vote${leader.influence === 1 ? '' : 's'} steered` },
    { label: 'Under pressure', metric: 'votes', player: by('votesReceived', 1)[0], value: leader => `${leader.votesReceived} votes received` },
  ].filter(entry => entry.player).map(entry => ({ label: entry.label, metric: entry.metric, player: entry.player.name, value: entry.value(entry.player) }));
  const timeline = history.map(ep => ({
    episode: ep.num,
    eliminated: getEpisodeEliminations(ep),
    immunity: ep.immunityWinner || ep.winner?.name || null,
    merge: !!ep.isMerge,
    voteShape: Object.entries(ep.votes || {}).filter(([, count]) => Number(count) > 0).sort(([, a], [, b]) => b - a).map(([name, count]) => `${name} ${count}`).join(' · '),
  }));
  const alliances = (state?.namedAlliances || []).map(alliance => ({
    name: alliance.name,
    formed: alliance.formed || null,
    members: (alliance.members || []).filter(name => active.includes(name)),
    originalSize: (alliance.members || []).length,
    active: alliance.active !== false,
    betrayals: (alliance.betrayals || []).length,
  })).sort((a, b) => Number(b.active) - Number(a.active) || b.members.length - a.members.length);
  const tribeHistory = [];
  let previousSignature = '';
  history.forEach(ep => {
    const tribes = ep.tribesAtStart || [];
    const signature = tribes.map(tribe => `${tribe.name}:${(tribe.members || []).slice().sort().join(',')}`).sort().join('|');
    if (tribes.length && signature !== previousSignature) {
      tribeHistory.push({ episode: ep.num, tribes: tribes.map(tribe => ({ name: tribe.name, members: [...(tribe.members || [])] })) });
      previousSignature = signature;
    }
  });
  const relationshipMovement = history.flatMap(ep => (ep.bondChanges || []).map(change => ({ ...change, episode: ep.num })))
    .filter(change => Math.abs(Number(change.delta || 0)) >= 1)
    .sort((a, b) => Number(b.episode) - Number(a.episode) || Math.abs(Number(b.delta)) - Math.abs(Number(a.delta))).slice(0, 6);
  const publicRoleLabels = {
    'social-center':'Social hub', provider:'Camp provider', 'challenge-leader':'Challenge threat',
    outsider:'On the outs', 'irritating-but-useful':'Abrasive but useful', 'power-couple':'Power pair',
  };
  const socialRoles = active.flatMap(name => Object.entries(state?.socialStatus?.[name] || {})
    .filter(([role, data]) => publicRoleLabels[role] && data?.active)
    .map(([role, data]) => ({ name, role, label: publicRoleLabels[role], score: Number(data.score || 0) })))
    .sort((a, b) => b.score - a.score);
  const powerRanking = [...activeMetrics].sort((a, b) => b.pulse - a.pulse);
  const storyThreads = [];
  if (alliances.find(alliance => alliance.active && alliance.members.length >= 3)) {
    const bloc = alliances.find(alliance => alliance.active && alliance.members.length >= 3);
    storyThreads.push(`${bloc.name} is the largest intact named bloc with ${bloc.members.length} active members.`);
  }
  if (powerRanking[0]) storyThreads.push(`${powerRanking[0].name} leads the current game-read pulse, an interpretation rather than a prediction.`);
  if (activeMetrics.some(metric => metric.momentum > 0)) {
    const rising = [...activeMetrics].sort((a, b) => b.momentum - a.momentum)[0];
    storyThreads.push(`${rising.name} has the strongest positive audience movement since the previous recorded episode.`);
  }
  if (relationshipMovement[0]) {
    const shift = relationshipMovement[0];
    storyThreads.push(`${shift.a} and ${shift.b} had the latest notable relationship ${Number(shift.delta) > 0 ? 'gain' : 'fracture'}.`);
  }
  return {
    episode: Number(state?.episode || history.length),
    phase: state?.phase || 'setup',
    active,
    eliminated,
    metrics,
    activeMetrics,
    leaders,
    timeline,
    alliances,
    tribeHistory,
    relationshipMovement,
    socialRoles,
    storyThreads,
    powerRanking,
    jury: [...(state?.jury || [])],
  };
}

function _overviewPortrait(name, extraClass = '') {
  const player = players.find(candidate => candidate.name === name);
  const slug = player?.slug || String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `<span class="overview-face ${extraClass}" title="${_hubEsc(name)}"><img src="assets/avatars/${_hubEsc(slug)}.png" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span>${_hubEsc(String(name)[0] || '?')}</span></span>`;
}

function renderMidseasonOverview() {
  const model = buildSeasonOverviewModel();
  const content = document.getElementById('results-content');
  if (_spoilerFree) {
    content.innerHTML = `<section class="overview-spoiler"><span>?</span><h2>Season Overview hidden</h2><p>This screen summarizes eliminations, alliances, and season leaders. Turn off Spoiler-free in Season Hub when you are ready to reveal it.</p><button class="btn btn-secondary" onclick="showTab('run')">Return to Season Hub</button></section>`;
    return;
  }
  const phaseLabel = model.phase === 'pre-merge' ? 'Pre-Merge' : model.phase === 'post-merge' ? 'Post-Merge' : model.phase === 'finale' ? 'Finale' : model.phase;
  const placementRows = [
    ...model.activeMetrics.sort((a, b) => b.pulse - a.pulse).map((metric, index) => ({ ...metric, place: index + 1, status: 'In game' })),
    ...[...model.eliminated].reverse().map((name, index) => ({ name, place: model.active.length + index + 1, status: model.jury.includes(name) ? 'Jury' : 'Out' })),
  ];
  const allianceHtml = model.alliances.length ? model.alliances.slice(0, 8).map(alliance => `<div class="overview-alliance ${alliance.active ? 'active' : 'inactive'}"><div><strong>${_hubEsc(alliance.name)}</strong><small>${alliance.formed ? `Formed Episode ${alliance.formed}` : 'Formation episode unknown'} · ${alliance.betrayals} betrayal${alliance.betrayals === 1 ? '' : 's'}</small></div><span>${alliance.active ? `${alliance.members.length} active` : 'Dissolved'}</span><div class="overview-alliance-faces">${alliance.members.slice(0, 6).map(name => _overviewPortrait(name)).join('')}</div></div>`).join('') : '<div class="overview-none">No named alliance has stabilized yet.</div>';
  const tribeHistoryHtml = model.tribeHistory.length ? model.tribeHistory.map(era => `<article class="overview-tribe-era"><b>EP ${String(era.episode).padStart(2, '0')}</b><div>${era.tribes.map(tribe => `<section><strong>${_hubEsc(tribe.name)}</strong><span>${tribe.members.map(name => _overviewPortrait(name)).join('')}</span><small>${_hubEsc(tribe.members.join(', '))}</small></section>`).join('')}</div></article>`).join('') : '<div class="overview-none">Tribe history will appear after the first episode is recorded.</div>';
  const statusHtml = model.socialRoles.length ? model.socialRoles.slice(0, 8).map(role => `<div class="overview-status-row">${_overviewPortrait(role.name)}<div><strong>${_hubEsc(role.name)}</strong><span>${_hubEsc(role.label)}</span></div><em>${Math.round(role.score)}</em></div>`).join('') : '<div class="overview-none">No clear public camp roles have emerged yet.</div>';
  const movementHtml = model.relationshipMovement.length ? model.relationshipMovement.map(change => `<div class="overview-relationship-row ${Number(change.delta) > 0 ? 'gain' : 'loss'}"><div class="overview-pair">${_overviewPortrait(change.a)}${_overviewPortrait(change.b)}</div><div><strong>${_hubEsc(change.a)} &amp; ${_hubEsc(change.b)}</strong><span>${_hubEsc(change.reason || (Number(change.delta) > 0 ? 'Their bond strengthened.' : 'Their relationship lost ground.'))}</span></div><em>${Number(change.delta) > 0 ? '▲' : '▼'} ${Math.abs(Number(change.delta))} · EP ${change.episode}</em></div>`).join('') : '<div class="overview-none">No notable relationship change has been recorded yet.</div>';
  const threadsHtml = model.storyThreads.length ? model.storyThreads.map((thread, index) => `<li><b>${String(index + 1).padStart(2, '0')}</b><span>${_hubEsc(thread)}</span></li>`).join('') : '<li class="overview-none">The season needs more evidence before a larger story can be read.</li>';
  content.innerHTML = `<section class="overview-shell">
    <header class="overview-hero"><div><span class="overview-eyebrow">Season ledger · through Episode ${model.episode}</span><h1>Season Overview</h1><p>${_hubEsc(phaseLabel)} · ${model.active.length} players remain · ${model.timeline.length} episodes recorded</p></div><button class="hub-primary" onclick="showTab('run')">Return to Season Hub <span>→</span></button></header>
    <div class="overview-truth-legend"><div><b>Recorded</b><span>Objective events and totals</span></div><div><b>Game read</b><span>Simulator interpretation—not certainty</span></div><div><b>Audience pulse</b><span>Public/edit perception, when available</span></div></div>
    <section class="overview-section"><header><div><span>Recorded</span><h2>Players still writing the season</h2></div><small>${model.active.length} active</small></header><div class="overview-active-cast">${model.active.map(name => `<div>${_overviewPortrait(name)}<span>${_hubEsc(name)}</span></div>`).join('')}</div></section>
    <section class="overview-leaders">${model.leaders.map(leader => `<article><label>${_hubEsc(leader.label)}</label>${_overviewPortrait(leader.player)}<div><strong>${_hubEsc(leader.player)}</strong><span>${_hubEsc(leader.value)}</span></div></article>`).join('') || '<div class="overview-none">Leaders need more episodes to emerge.</div>'}</section>
    <div class="overview-columns">
      <section class="overview-section overview-ranking"><header><div><span>Game read</span><h2>Season pulse</h2></div><small>Interpretive ranking</small></header><p class="overview-disclaimer">Combines visible challenge wins, voting accuracy, agenda control, alliance reach, pressure, and audience movement. It is not a winner prediction.</p><ol>${model.powerRanking.map((metric, index) => `<li><b>${index + 1}</b>${_overviewPortrait(metric.name)}<div><strong>${_hubEsc(metric.name)}</strong><span>${metric.challengeWins} wins · ${Math.round(metric.voteAccuracy * 100)}% vote accuracy · ${metric.alliances.length} alliances</span></div><em class="${metric.momentum > 0 ? 'up' : metric.momentum < 0 ? 'down' : ''}">${metric.momentum > 0 ? '▲' : metric.momentum < 0 ? '▼' : '—'} ${Math.abs(metric.momentum)}</em></li>`).join('')}</ol></section>
      <section class="overview-section"><header><div><span>Recorded</span><h2>Alliance timeline</h2></div><small>${model.alliances.filter(alliance => alliance.active).length} active</small></header><div class="overview-alliance-list">${allianceHtml}</div></section>
    </div>
    <div class="overview-columns overview-history-grid">
      <section class="overview-section"><header><div><span>Recorded</span><h2>How the tribes changed</h2></div><small>${model.tribeHistory.length} era${model.tribeHistory.length === 1 ? '' : 's'}</small></header><div class="overview-tribe-history">${tribeHistoryHtml}</div></section>
      <section class="overview-section"><header><div><span>Public status</span><h2>Camp hierarchy</h2></div><small>Visible roles only</small></header><p class="overview-disclaimer">Roles reflect behavior the cast can observe. Hidden leverage and private intentions are deliberately excluded.</p><div class="overview-status-list">${statusHtml}</div></section>
    </div>
    <div class="overview-columns overview-movement-grid">
      <section class="overview-section"><header><div><span>Game read</span><h2>Stories taking shape</h2></div><small>Not promised outcomes</small></header><p class="overview-disclaimer">A concise interpretation of the season-to-date record. Future episodes can reverse any of these threads.</p><ol class="overview-thread-list">${threadsHtml}</ol></section>
      <section class="overview-section"><header><div><span>Recorded</span><h2>Relationship movement</h2></div><small>Largest recent shifts</small></header><div class="overview-relationship-list">${movementHtml}</div></section>
    </div>
    <section class="overview-section"><header><div><span>Recorded</span><h2>Episode trail</h2></div><small>Click to review</small></header><div class="overview-timeline">${model.timeline.map(item => `<button onclick="showTab('run');viewEpisode(${item.episode})"><b>EP ${String(item.episode).padStart(2, '0')}</b><span class="overview-timeline-faces">${item.eliminated.length ? item.eliminated.slice(0, 2).map(name => _overviewPortrait(name)).join('') : '<i>—</i>'}</span><strong>${item.eliminated.length ? _hubEsc(item.eliminated.join(' + ')) : 'No elimination'}</strong><small>${item.merge ? 'MERGE · ' : ''}${_hubEsc(item.voteShape || 'No standard vote')}</small></button>`).join('')}</div></section>
    <section class="overview-section"><header><div><span>Recorded</span><h2>Player ledger</h2></div><small>Season-to-date totals</small></header><div class="overview-table"><div class="overview-table-head"><span>Player</span><span>Wins</span><span>Ballots</span><span>Accuracy</span><span>Votes received</span><span>Votes steered</span></div>${placementRows.map(row => {
      const metric = model.metrics.find(item => item.name === row.name);
      return `<div class="overview-table-row ${metric?.active ? '' : 'eliminated'}"><span>${_overviewPortrait(row.name)}<b>${_hubEsc(row.name)}</b><i>${_hubEsc(row.status)}</i></span><span>${metric?.challengeWins ?? '—'}</span><span>${metric?.ballots ?? '—'}</span><span>${metric?.ballots ? `${Math.round(metric.voteAccuracy * 100)}%` : '—'}</span><span>${metric?.votesReceived ?? '—'}</span><span>${metric?.influence ?? '—'}</span></div>`;
    }).join('')}</div></section>
  </section>`;
}

export function buildSeasonRetrospectiveModel(state = gs, cast = players) {
  const history = state?.episodeHistory || [];
  const finaleEp = [...history].reverse().find(ep => ep.isFinale) || history[history.length - 1] || {};
  const result = state?.finaleResult || {};
  const winner = typeof result.winner === 'object' ? result.winner?.name : result.winner;
  const finalistsRaw = result.finalists || finaleEp.finaleFinalists || state?.activePlayers || [];
  const finalists = [...new Set(finalistsRaw.map(entry => typeof entry === 'object' ? entry?.name : entry).filter(Boolean))];
  if (winner && !finalists.includes(winner)) finalists.unshift(winner);
  const juryVotes = result.votes && typeof result.votes === 'object' ? result.votes : (finaleEp.juryResult?.votes || {});
  const juryReasoning = Array.isArray(result.reasoning) ? result.reasoning : (finaleEp.juryResult?.reasoning || []);
  const overview = buildSeasonOverviewModel(state, cast);
  const finalistOrder = [...finalists].sort((a, b) => {
    if (a === winner) return -1;
    if (b === winner) return 1;
    return Number(juryVotes[b] || 0) - Number(juryVotes[a] || 0);
  });
  const eliminatedOrder = [];
  [...history].reverse().forEach(ep => getEpisodeEliminations(ep).forEach(name => {
    if (!finalistOrder.includes(name) && !eliminatedOrder.includes(name)) eliminatedOrder.push(name);
  }));
  [...(state?.eliminated || [])].reverse().forEach(name => {
    if (!finalistOrder.includes(name) && !eliminatedOrder.includes(name)) eliminatedOrder.push(name);
  });
  const placements = [...finalistOrder, ...eliminatedOrder].map((name, index) => {
    const elimEp = [...history].reverse().find(ep => getEpisodeEliminations(ep).includes(name));
    return { name, place: index + 1, winner: name === winner, finalist: finalists.includes(name), jury: (state?.jury || []).includes(name), episode: elimEp?.num || null };
  });
  const finalistPaths = finalistOrder.map(name => {
    const metric = overview.metrics.find(entry => entry.name === name) || { challengeWins:0, ballots:0, correctBallots:0, votesReceived:0, influence:0, alliances:[] };
    const effectiveIdols = history.flatMap(ep => ep.idolPlays || []).filter(play => play.player === name && Number(play.votesNegated || 0) > 0).length;
    const wastedIdols = history.flatMap(ep => ep.idolPlays || []).filter(play => play.player === name && !play.fake && Number(play.votesNegated || 0) === 0 && (!play.type || play.type === 'legacy')).length;
    const authoredBetrayals = history.reduce((count, ep) => count + (ep.defections || []).filter(defection => defection.player === name).length, 0);
    const moves = [];
    if (metric.challengeWins) moves.push(`${metric.challengeWins} individual challenge win${metric.challengeWins === 1 ? '' : 's'}`);
    if (metric.influence) moves.push(`helped set the target on ${metric.influence} eventual boot${metric.influence === 1 ? '' : 's'}`);
    if (effectiveIdols) moves.push(`${effectiveIdols} protection play${effectiveIdols === 1 ? '' : 's'} erased votes`);
    if (authoredBetrayals) moves.push(`${authoredBetrayals} recorded break${authoredBetrayals === 1 ? '' : 's'} from a voting plan`);
    if (!moves.length && metric.correctBallots) moves.push(`voted with ${metric.correctBallots} eventual elimination${metric.correctBallots === 1 ? '' : 's'}`);
    const vulnerabilities = [];
    const missed = Math.max(0, metric.ballots - metric.correctBallots);
    if (missed) vulnerabilities.push(`missed the eventual boot on ${missed} ballot${missed === 1 ? '' : 's'}`);
    if (metric.votesReceived) vulnerabilities.push(`absorbed ${metric.votesReceived} vote${metric.votesReceived === 1 ? '' : 's'} during the season`);
    if (wastedIdols) vulnerabilities.push(`${wastedIdols} protection play${wastedIdols === 1 ? '' : 's'} erased no votes`);
    if (!vulnerabilities.length) vulnerabilities.push('no major recorded vulnerability in the available season ledger');
    return { name, winner: name === winner, juryVotes: Number(juryVotes[name] || 0), metric, moves, vulnerabilities };
  });
  const allianceOutcomes = (state?.namedAlliances || []).map(alliance => {
    const members = alliance.members || [];
    const best = placements.filter(row => members.includes(row.name)).sort((a, b) => a.place - b.place)[0];
    return { name: alliance.name, members, active: alliance.active !== false, betrayals: (alliance.betrayals || []).length, bestFinish: best || null };
  }).sort((a, b) => (a.bestFinish?.place || 999) - (b.bestFinish?.place || 999)).slice(0, 8);
  const relationshipMap = new Map();
  history.forEach(ep => (ep.bondChanges || []).forEach(change => {
    if (!change.a || !change.b) return;
    const key = [change.a, change.b].sort().join('||');
    const current = relationshipMap.get(key) || { a:change.a, b:change.b, delta:0, causes:[] };
    current.delta += Number(change.delta || 0);
    if (change.reason && !current.causes.includes(change.reason)) current.causes.push(change.reason);
    relationshipMap.set(key, current);
  }));
  const relationshipOutcomes = [...relationshipMap.values()].filter(item => Math.abs(item.delta) >= 1)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 8);
  const timeline = overview.timeline.map(item => ({ ...item, label: item.eliminated.length ? `${item.eliminated.join(' + ')} left` : (item.episode === finaleEp.num ? `${winner || 'A winner'} was crowned` : 'No elimination') }));
  const voteTotal = Object.values(juryVotes).reduce((sum, value) => sum + Number(value || 0), 0);
  return {
    winner,
    finalists: finalistOrder,
    juryVotes,
    juryReasoning,
    voteTotal,
    fanFavorite: finaleEp.fanFavorite || state?.fanFavorite || null,
    episodeCount: history.length,
    castSize: (cast || []).length,
    placements,
    finalistPaths,
    allianceOutcomes,
    relationshipOutcomes,
    timeline,
  };
}

export async function recordRetrospectiveInFranchise() {
  const seasonNumber = gs?.seasonNumber || seasonConfig?.seasonNumber;
  if (!seasonNumber) { alert('Set a season number before recording this season in Franchise.'); return false; }
  if (!confirm(`Record or update Season ${seasonNumber} in the active franchise?`)) return false;
  const recorded = typeof recordSeasonToLedger === 'function' && recordSeasonToLedger(null, 'manual');
  if (!recorded) { alert('The season could not be recorded. The active franchise may be locked.'); return false; }
  if (typeof persistFranchiseLedger === 'function') await persistFranchiseLedger();
  if (typeof renderFranchiseTab === 'function') renderFranchiseTab();
  renderResultsTab();
  return true;
}

export function startNewSeasonFromRetrospective() {
  if (typeof resetSeason !== 'function') return;
  resetSeason();
  if (!gs && typeof showTab === 'function') showTab('cast');
}

export function openWinnerCareerFromRetrospective(name = null) {
  const winner = name || (typeof gs?.finaleResult?.winner === 'object' ? gs.finaleResult.winner?.name : gs?.finaleResult?.winner);
  if (typeof showTab === 'function') showTab('franchise');
  if (typeof renderFranchiseTab === 'function') renderFranchiseTab();
  if (winner && typeof frOpenCareer === 'function') setTimeout(() => frOpenCareer(winner), 0);
}

function renderSeasonRetrospective() {
  const model = buildSeasonRetrospectiveModel();
  const content = document.getElementById('results-content');
  if (_spoilerFree) {
    content.innerHTML = `<section class="overview-spoiler"><span>?</span><h2>Season Retrospective hidden</h2><p>The winner, jury result, placements, and season outcomes are hidden while Spoiler-free is active.</p><button class="btn btn-secondary" onclick="showTab('run')">Return to Season Hub</button></section>`;
    return;
  }
  let recorded = false;
  try { recorded = !!activeSeasons?.()?.[String(gs?.seasonNumber || seasonConfig?.seasonNumber)]; } catch {}
  const tally = Object.entries(model.juryVotes).sort(([,a],[,b]) => Number(b)-Number(a));
  const finalistHtml = model.finalistPaths.map((path, index) => `<article class="retro-finalist ${path.winner ? 'winner' : ''}"><div class="retro-finalist-rank">${path.winner ? 'WINNER' : ordinal(index + 1)}</div>${_overviewPortrait(path.name, 'retro-big-face')}<div class="retro-finalist-main"><h3>${_hubEsc(path.name)}</h3><p>${path.juryVotes} jury vote${path.juryVotes === 1 ? '' : 's'} · ${path.metric.challengeWins} challenge win${path.metric.challengeWins === 1 ? '' : 's'} · ${Math.round(path.metric.voteAccuracy * 100)}% voting accuracy</p><div class="retro-path-columns"><section><b>Defining record</b>${path.moves.map(move => `<span>+ ${_hubEsc(move)}</span>`).join('') || '<span>No headline move was recorded.</span>'}</section><section><b>Pressure points</b>${path.vulnerabilities.map(item => `<span>− ${_hubEsc(item)}</span>`).join('')}</section></div></div></article>`).join('');
  const juryHtml = model.juryReasoning.length ? model.juryReasoning.map(vote => `<div class="retro-jury-row">${_overviewPortrait(vote.juror)}<strong>${_hubEsc(vote.juror)}</strong><span>voted for</span>${_overviewPortrait(vote.votedFor)}<b>${_hubEsc(vote.votedFor)}</b>${vote.reason ? `<small>${_hubEsc(vote.reason)}</small>` : ''}</div>`).join('') : '<div class="overview-none">This finale format did not use a jury vote.</div>';
  const allianceHtml = model.allianceOutcomes.length ? model.allianceOutcomes.map(alliance => `<div class="retro-outcome-row"><div><strong>${_hubEsc(alliance.name)}</strong><span>${alliance.active ? 'Finished intact' : 'Dissolved'} · ${alliance.betrayals} recorded betrayal${alliance.betrayals === 1 ? '' : 's'}</span></div><b>${alliance.bestFinish ? `${ordinal(alliance.bestFinish.place)} · ${_hubEsc(alliance.bestFinish.name)}` : 'No finisher'}</b><div>${alliance.members.slice(0, 6).map(name => _overviewPortrait(name)).join('')}</div></div>`).join('') : '<div class="overview-none">No named alliance outcome was recorded.</div>';
  const relationshipHtml = model.relationshipOutcomes.length ? model.relationshipOutcomes.map(outcome => `<div class="retro-relationship ${outcome.delta > 0 ? 'gain' : 'loss'}"><div>${_overviewPortrait(outcome.a)}${_overviewPortrait(outcome.b)}</div><section><strong>${_hubEsc(outcome.a)} &amp; ${_hubEsc(outcome.b)}</strong><span>${outcome.delta > 0 ? 'Finished closer than they started' : 'Finished more fractured than they started'}${outcome.causes[0] ? ` · ${_hubEsc(outcome.causes[0])}` : ''}</span></section><b>${outcome.delta > 0 ? '+' : ''}${outcome.delta.toFixed(1)}</b></div>`).join('') : '<div class="overview-none">No season-long relationship movement was preserved in this save.</div>';
  content.innerHTML = `<section class="retro-shell">
    <header class="retro-hero"><div class="retro-crown">★</div>${model.winner ? _overviewPortrait(model.winner, 'retro-winner-face') : ''}<div><span>Season complete · ${model.episodeCount} episodes</span><h1>${_hubEsc(model.winner || 'Season complete')}</h1><p>${model.winner ? 'wins the season' : 'The finale has concluded'}${tally.length ? ` · ${tally.map(([name,votes]) => `${_hubEsc(name)} ${votes}`).join(' — ')}` : ' · final challenge decision'}${model.fanFavorite ? ` · Fan favorite: ${_hubEsc(model.fanFavorite)}` : ''}</p></div><button class="hub-primary" onclick="openSeasonRecap()" ${typeof recapAvailable === 'function' && recapAvailable(gs) ? '' : 'disabled'}>Watch season recap <span>▶</span></button></header>
    <nav class="retro-actions" aria-label="Season retrospective actions"><button onclick="exportSummaryPDF()">Summary PDF</button><button onclick="exportStatisticsPDF()">Statistics PDF</button><button class="${recorded ? 'done' : ''}" onclick="recordRetrospectiveInFranchise()">${recorded ? '✓ Recorded in Franchise' : 'Record in Franchise'}</button><button onclick="showTab('franchise')">View Franchise</button></nav>
    <section class="retro-finalists"><header><span>Final paths</span><h2>How the finalists reached the end</h2><p>Recorded accomplishments and exposure—not an automatic grade of decision quality.</p></header>${finalistHtml}</section>
    <div class="retro-two-column"><section class="overview-section"><header><div><span>Final decision</span><h2>Jury breakdown</h2></div><small>${model.voteTotal ? `${model.voteTotal} votes` : 'Challenge finale'}</small></header><div class="retro-jury">${juryHtml}</div></section><section class="overview-section"><header><div><span>Recorded</span><h2>Alliance outcomes</h2></div><small>End state</small></header><div class="retro-outcomes">${allianceHtml}</div></section></div>
    <section class="overview-section"><header><div><span>Recorded movement</span><h2>Relationships at the finish</h2></div><small>Season-long change</small></header><div class="retro-relationships">${relationshipHtml}</div></section>
    <section class="overview-section"><header><div><span>The complete trail</span><h2>Season story timeline</h2></div><small>${model.timeline.length} episodes</small></header><div class="retro-timeline">${model.timeline.map(item => `<button onclick="showTab('run');viewEpisode(${item.episode})"><b>EP ${String(item.episode).padStart(2,'0')}</b><span>${item.eliminated.map(name => _overviewPortrait(name)).join('') || (item.episode === model.timeline.at(-1)?.episode && model.winner ? _overviewPortrait(model.winner) : '')}</span><strong>${_hubEsc(item.label)}</strong><small>${item.merge ? 'MERGE · ' : ''}${_hubEsc(item.voteShape || (item.episode === model.timeline.at(-1)?.episode ? 'Finale' : 'No standard vote'))}</small></button>`).join('')}</div></section>
    <section class="overview-section"><header><div><span>Final placements</span><h2>Every journey</h2></div><small>${model.castSize} players</small></header><div class="retro-placement-list">${model.placements.map(row => `<div class="retro-placement ${row.winner ? 'winner' : ''}"><b>${ordinal(row.place)}</b>${_overviewPortrait(row.name)}<strong>${_hubEsc(row.name)}</strong><span>${row.winner ? 'Season winner' : row.finalist ? `${Number(model.juryVotes[row.name] || 0)} jury votes` : row.jury ? `Jury · Episode ${row.episode || '—'}` : `Out · Episode ${row.episode || '—'}`}</span></div>`).join('')}</div></section>
    <footer class="retro-next"><div><span>Season archived</span><h2>What do you want to do next?</h2></div><button onclick="startNewSeasonFromRetrospective()">Start New Season</button><button onclick="showTab('franchise')">Open All-Stars Scout</button><button onclick="openWinnerCareerFromRetrospective()">Open Winner Career</button><button onclick="showTab('franchise')">View Franchise</button></footer>
  </section>`;
}

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
  const resultsTab = document.getElementById('results-tab-btn');
  if (resultsTab) resultsTab.textContent = isComplete ? 'Season Retrospective' : 'Season Overview';
  if (!isComplete) {
    renderMidseasonOverview();
    return;
  }
  renderSeasonRetrospective();
}

