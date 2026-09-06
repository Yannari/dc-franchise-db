// ══════════════════════════════════════════════════════════════════════
// run-ui.js — Run tab, episode management, setup panels, twist catalog
// ══════════════════════════════════════════════════════════════════════

// The only imports in this file, and the reason they exist: main.js exposes
// module FUNCTIONS on window, not module data. `DEMOS` is an array and
// `DEMO_LABELS` an object, so reading them off window gave undefined and the
// ratings section rendered its curve above an empty grid.
import { playerAvatarUrl } from './players.js';
import { DEMOS, DEMO_LABELS } from './ratings.js';
// Same reason: ADVANTAGES is an array and ADV_SOURCE_LABELS an object, so
// reading them off window gives undefined and the coach list renders empty.
import { ADVANTAGES, ADV_SOURCE_LABELS, snapshotGs } from './core.js';
import { COACH_FINDABLE_DEFAULT, coachesOf } from './coaches.js';
import { coachCanPlay } from './advantages.js';

// The castle's two, imported rather than read off window. Everything else in
// this file reaches its engine through the globals main.js publishes, and that
// works — but a show that is unreachable from the run loop is precisely the
// bug this wiring exists to close, and an import fails loudly at load time
// where a missing global fails silently at the moment somebody presses Play.
import { isTraitorsSeason, simulateTraitorsEpisode, rerunTraitorsEpisode,
  lastTraitorsRerunRefusal } from './tr-run.js';
import { isDragSeason, simulateDragEpisode } from './dr-run.js';
import { roundExits, exitVerbs } from './shows.js';
import { seasonFormat } from './core.js';
import { TRAITORS_SCREENS } from './vp-tr/screens.js';

/**
 * A dry-run switch for the export, sitting under the button that needs it.
 *
 * Publishing commits the season document and all three databases to the repo
 * and refreshes D1, which is exactly right for a finished season and exactly
 * wrong for a first look at one. The only way to hold it back used to be
 * deleting the API token — a credential doubling as a feature flag, and one
 * you have to remember to put back.
 *
 * Checked means download the files instead. The setting sticks, so it is also
 * visible: an export that quietly stopped publishing would otherwise look
 * identical to one where the network was down.
 */
function _addPublishToggle(exportBtn) {
  if (document.getElementById('export-download-only')) return;
  const wrap = document.createElement('label');
  wrap.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:6px;'
    + 'font-size:11px;opacity:0.75;cursor:pointer;user-select:none;';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.id = 'export-download-only';
  box.style.cssText = 'cursor:pointer;margin:0;';
  try { box.checked = !!window.publishingIsOff?.(); } catch { box.checked = false; }
  const text = document.createElement('span');
  const label = () => box.checked
    ? 'Download only — nothing is committed'
    : 'Publishes to the site when you export';
  text.textContent = label();
  box.onchange = () => {
    window.setPublishMode?.(box.checked ? 'download' : 'publish');
    text.textContent = label();
  };
  wrap.appendChild(box);
  wrap.appendChild(text);
  exportBtn.parentElement.insertBefore(wrap, exportBtn.nextSibling);
}

/**
 * "Also write the wiki from the episodes" — beside the export button.
 *
 * Injected here rather than written into simulator.html because THIS is where
 * the export button lives: the Season Hub builds it, and the publish toggle
 * above is attached the same way. A checkbox added to the static Season Save
 * panel further down the sidebar is a checkbox next to a different Export
 * button, which is where this one was first put and never seen.
 *
 * Off by default and remembered. An export gets re-run for reasons that have
 * nothing to do with prose — a missing field, a re-sync — and each fill is two
 * paid calls.
 */
/**
 * "Also resolve the off-season" — beside the wiki toggle.
 *
 * ON by default, which is the opposite of the wiki fill next to it, and for a
 * reason worth stating: a fill spends two paid calls and overwrites prose
 * somebody may have written by hand, whereas this is local arithmetic that
 * produces PROPOSALS. Nothing it writes is visible to a reader until it is
 * approved on the Life page, so there is nothing to protect by making it
 * opt-in — and a forgotten off-season is a hole in every character's life.
 */

/**
 * The transcript, regenerated when the writer has learned something since.
 *
 * Big Brother transcripts are stored strings, so every prose fix used to reach
 * only weeks not yet played — the author's real season kept the old text and
 * the honest version existed only for the future. The writer stamps a version;
 * a stored transcript behind it is rebuilt from the same episode record it was
 * always derived from, and saved so it happens once per week, not per view.
 */
function _freshTranscript(epRecord) {
  try {
    // ── AND THE CASTLE, WHICH STORES NOTHING TO BE STALE ──────────────
    //
    // This was Big-Brother-only, and nothing on the castle path ever writes
    // `ep.summaryText`: a Traitors row therefore returned '' and the whole
    // transcript Plan 8 Task 6 built had no screen to appear on. It is
    // regenerated for the same reason a stale house week is — the text is
    // derived from the record, so deriving it again is always safe — and for
    // one more: a castle transcript is a rendering of the screens, so it is
    // never older than the screens it retranscribes.
    const _regen = epRecord && typeof window.generateSummaryText === 'function'
      && (_isCastleRow(epRecord)
        ? !epRecord.summaryText || (epRecord.textV || 0) < (window.TEXT_BACKLOG_V || 1)
        : false);
    if (_regen) {
      epRecord.summaryText = window.generateSummaryText(epRecord);
      epRecord.textV = window.TEXT_BACKLOG_V;
      try { window.saveGameState?.(); } catch { /* view still shows it */ }
    }
    if (epRecord && epRecord.format === 'big-brother'
      && typeof window.generateSummaryText === 'function'
      && (epRecord.textV || 0) < (window.TEXT_BACKLOG_V || 1)) {
      epRecord.summaryText = window.generateSummaryText(epRecord);
      epRecord.textV = window.TEXT_BACKLOG_V;
      try { window.saveGameState?.(); } catch { /* view still shows it */ }
    }
  } catch { /* the stored text is still an account */ }
  return epRecord?.summaryText || '';
}

function _addLifeHookToggle(exportBtn) {
  if (document.getElementById('life-hook-on-export')) return;
  const wrap = document.createElement('label');
  wrap.style.cssText = 'display:flex;align-items:flex-start;gap:6px;margin-top:4px;'
    + 'font-size:11px;opacity:0.75;cursor:pointer;user-select:none;line-height:1.4;';
  wrap.title = 'Works out what happened to everybody in the months after this season — '
    + 'relationships, jobs, fallings-out — and puts it in the Life inbox as proposals. '
    + 'Nothing reaches a wiki page until you approve it there.';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.id = 'life-hook-on-export';
  box.style.cssText = 'cursor:pointer;margin:2px 0 0;';
  try { box.checked = window.lifeHookOnExport ? !!window.lifeHookOnExport() : true; } catch { box.checked = true; }
  const text = document.createElement('span');
  const label = () => box.checked
    ? 'Also resolves the off-season into the Life inbox'
    : 'Also resolve the off-season into the Life inbox';
  text.textContent = label();
  box.onchange = () => {
    window.setLifeHookOnExport?.(box.checked);
    text.textContent = label();
  };
  wrap.appendChild(box);
  wrap.appendChild(text);
  const wiki = document.getElementById('wiki-fill-on-export');
  const after = wiki?.parentElement || exportBtn;
  after.parentElement.insertBefore(wrap, after.nextSibling);
}

function _addWikiFillToggle(exportBtn) {
  if (document.getElementById('wiki-fill-on-export')) return;
  const wrap = document.createElement('label');
  wrap.style.cssText = 'display:flex;align-items:flex-start;gap:6px;margin-top:4px;'
    + 'font-size:11px;opacity:0.75;cursor:pointer;user-select:none;line-height:1.4;';
  wrap.title = "Reads this season's episode transcripts and writes the wiki: personality, "
    + 'quotes and trivia for the whole cast, and the game history round by round. '
    + 'Needs the episodes to have been generated, and publishing to be on.';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.id = 'wiki-fill-on-export';
  box.style.cssText = 'cursor:pointer;margin:2px 0 0;';
  try { box.checked = !!window.wikiFillOnExport?.(); } catch { box.checked = false; }
  const text = document.createElement('span');
  const label = () => box.checked
    ? 'Also writes the wiki from the episodes (2 AI calls)'
    : 'Also write the wiki from the episodes (2 AI calls)';
  text.textContent = label();
  box.onchange = () => {
    window.setWikiFillOnExport?.(box.checked);
    text.textContent = label();
  };
  wrap.appendChild(box);
  wrap.appendChild(text);
  // After the publish toggle when there is one, so the two settings read as a
  // pair: where the export goes, and whether it also writes the prose.
  const publish = document.getElementById('export-download-only');
  const after = publish?.parentElement || exportBtn;
  after.parentElement.insertBefore(wrap, after.nextSibling);
}

export let _spoilerFree = false;
export function set_spoilerFree(v) { _spoilerFree = v; }

const _HUB_SETTING_META = {
  'hosted-camp': { label: 'Hosted Camp', icon: '🏕️', accent: '#f0c040' },
  'survival-island': { label: 'Survival Island', icon: '🏝️', accent: '#46c7b4' },
  carnival: { label: 'Carnival of Chaos', icon: '🎪', accent: '#ff5a7a' },
  'film-lot': { label: 'Film Lot', icon: '🎬', accent: '#cdd2df' },
  'world-tour': { label: 'World Tour', icon: '✈️', accent: '#57a6e8' },
  'bb-house': { label: 'The House', icon: '🏠', accent: '#c9343c' },
  'bb-compound': { label: 'The Compound', icon: '🏭', accent: '#8b949e' },
  'bb-resort': { label: 'The Resort', icon: '🌴', accent: '#3fb950' },
  'bb-manor': { label: 'The Manor', icon: '🕯️', accent: '#d29922' },
  // The castle has one venue and js/settings.js does not list it, because
  // nothing in js/tr/ reads a setting -- the castle layer writes its own
  // events and never asks where it is. Keyed by FORMAT below rather than by
  // `config.setting`, which on a castle still says whatever the season was
  // built as and printed "HOSTED CAMP" across the top of a Traitors hub.
  'tr-castle': { label: 'The Castle', icon: '🗡️', accent: '#b91c3c' },
};

function _hubEsc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

function _hubPortrait(name, cast = players, eliminated = false, isCoach = false) {
  const player = (cast || []).find(p => p.name === name);
  const src = playerAvatarUrl(player || name);
  // A coach is on this tribe without being one of its contestants — shown, but
  // never counted among the players still competing for the placement.
  return `<span class="hub-player${eliminated ? ' eliminated' : ''}${isCoach ? ' hub-player-coach' : ''}" title="${_hubEsc(name)}${isCoach ? ' — coach' : ''}">
    <span class="hub-player-face"><img src="${_hubEsc(src)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span>${_hubEsc(String(name)[0] || '?')}</span></span>
    <span class="hub-player-name">${_hubEsc(name)}${isCoach ? '<b style="display:block;font-size:7px;letter-spacing:1px;opacity:.75">COACH</b>' : ''}</span>
  </span>`;
}

function _hubRailFace(name, cast = players) {
  if (!name) return '<span class="hub-rail-empty">•</span>';
  const player = (cast || []).find(p => p.name === name);
  const src = playerAvatarUrl(player || name);
  return `<span class="hub-rail-face"><img src="${_hubEsc(src)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span>${_hubEsc(String(name)[0] || '?')}</span></span>`;
}

/**
 * Is this episode record a castle night?
 *
 * ONE PLACE ASKS. `isTraitorsSeason()` answers a question about the SEASON on
 * the setup screen; this answers one about the ROW, which is a different fact:
 * a history can hold a show the config has since been switched away from, and
 * the timeline, the episode card and the transcript all have to draw what the
 * row IS. Three copies of `ep.format === 'traitors'` is a show list three
 * lines long — see tests/show-list-duplication.test.js.
 */
const _isCastleRow = ep => !!ep && ep.format === 'traitors';

export function getEpisodeEliminations(ep) {
  if (!ep) return [];
  if (ep.multiTribalElims?.length) return [...new Set(ep.multiTribalElims.filter(Boolean))];
  const names = [
    ep.firstEliminated,
    ep.ambassadorData?.ambassadorEliminated,
    ep.eliminated,
    ep.tiedDestinies?.eliminatedPartner,
    ep.emissaryEliminated,
    // Big Brother's second eviction of the night. This list knew every Total
    // Drama shape for a double elimination and none of the house's, so a Split
    // House or a Double Eviction reported one name — and everything built on
    // this helper (the hub card, the season timeline, the episode trail)
    // silently lost a houseguest, which is why the count never went 16 -> 14.
    ep.alsoEliminated,
    // ── AND EVERY DOOR THE SHOW HAS ──────────────────────────────────
    //
    // `roundExits()` is the registry's own rule and it is the only reader
    // that knows a show can have more than one way out. The castle has two —
    // banished and murdered — and only the banishment is ever on
    // `eliminated`, so without this the episode timeline reported one name on
    // a night that removed two and the cast count went 20 -> 19 -> 18 while
    // four people were gone. Exactly the defect `alsoEliminated` above was
    // added for, one show later.
    //
    // UNGATED, AND THAT WAS CHECKED RATHER THAN ASSUMED. `roundExits()` falls
    // back to `evicted || eliminated` on a row with no `exits[]`, and the
    // worry was the SHAPE of the field it falls back to: `evicted` is a name
    // on a house week and a map of HOH-to-evictee under `splitHouse`, and a
    // name that came back as an object would print as [object Object] in the
    // timeline. A gate was written for it and then removed, because the
    // object is nested and the fallback never reaches it — the guard on the
    // gate came back green, which is this plan's definition of a gate worth
    // deleting. The shapes the other two shows really write, including a
    // Split House week, are pinned in tests/tr-run.test.js instead.
    ...roundExits(ep, ep.format).map(x => x.name),
    // And a triple's third. Same reason: everything downstream counts the
    // house off this list, so a name missing here is a houseguest the season
    // never notices leaving.
    ...(ep.extraEvictions || []).flatMap(r => [r && r.evicted, r && r.secondEvicted]),
    // A coach voted out never lands on ep.eliminated — applyCoachElimination
    // (coach-episode.js) deliberately nulls it, because a coach boot costs
    // the tribe its coach, not a contestant's game. Without this, every one
    // of this helper's callers (hub card, season timeline, retrospective
    // placements) reports "No elimination" on the episode where the tribe
    // voted its own coach out.
    ...(ep.coachElimination || []).map(ce => ce.coach),
    // ── AND THE ONE THE EXILE DUEL SENDS AWAY ─────────────────────────
    //
    // Reported: "episode 5, no elimination that week." Reproduced on the
    // first try with an Exile Duel pinned to episode 5 — the row came back
    // `eliminated: null, exilePlayer: P12`, so every caller of this helper
    // said nobody left on the night the tribe voted somebody out.
    //
    // It is the coach case above, one twist later and for the same reason:
    // js/episode.js nulls `eliminated` deliberately, because a player on
    // exile is not out of the game — they can win the duel and come back. But
    // "not permanently out" is not "nothing happened", and the timeline is a
    // record of what the episode DID. Rescue Island already works this way:
    // its exits set `eliminated` normally and the player returns later, so
    // crediting the exile here makes the two formats agree rather than making
    // this one an exception.
    ep.exilePlayer,
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
  if (seasonFormat(ep) === 'traitors') {
    const exits = roundExits(ep, 'traitors');
    why = exits.length
      ? exits.map(x => `${x.name} was ${x.verb}.`).join(' ')
      : 'The castle closed the night with nobody leaving.';
  } else if (ep.isRockDraw) why = `${eliminatedLabel || 'The eliminated contestant'} drew the losing rock after the vote remained deadlocked.`;
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

  // Audience pulse: how the episode was cut for the viewers (edit layer, if tracking).
  const editWatch = [];
  const _editState = typeof gs !== 'undefined' ? gs?.edit : null;
  const _editLabels = typeof EDIT_LABELS !== 'undefined' ? EDIT_LABELS : {};
  const editRec = (_editState?.episodes || []).find(rec => Number(rec.ep) === Number(ep.num));
  if (editRec) {
    const prevRec = (_editState.episodes || []).filter(rec => Number(rec.ep) < Number(ep.num)).pop();
    Object.entries(editRec.reads || {}).forEach(([name, key]) => {
      const prevKey = prevRec?.reads?.[name];
      if (prevKey && prevKey !== key) editWatch.push(`${name} shifted from ${_editLabels[prevKey] || prevKey} to ${_editLabels[key] || key}.`);
    });
    if (editRec.quotes?.[0]) editWatch.push(`"${editRec.quotes[0].text}" — ${editRec.quotes[0].name}`);
  }

  return {
    eliminated, eliminatedLabel, voteEntries, voteShape, votesNegated, decidingVoters, why,
    advantages: [...new Set(advantages)].slice(0, 3),
    allianceChanges: [...new Set(allianceChanges)].slice(0, 3),
    relationshipChanges,
    reputationChanges,
    lessons,
    editWatch: editWatch.slice(0, 3),
  };
}

export function buildSeasonHubModel(state = gs, config = seasonConfig, cast = players, viewedEpisodeNum = null) {
  const _castle = seasonFormat(config) === 'traitors';
  const setting = _castle ? _HUB_SETTING_META['tr-castle']
    : (_HUB_SETTING_META[config?.setting] || _HUB_SETTING_META['hosted-camp']);
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
    : _castle ? 'The castle continues — no scheduled twist' : 'Standard episode — no scheduled twist';
  const latestOutcome = _castle && latest
    ? roundExits(latest, 'traitors').map(x => `${x.name} was ${x.verb}`).join(' · ')
    : latest ? (getEpisodeEliminations(latest).length
      ? `${getEpisodeEliminations(latest).join(' + ')} left the game`
      : 'The game moved without a vote') : '';
  const _hubHouse = typeof isBigBrotherSeason === 'function' && isBigBrotherSeason();
  const groups = !initialized ? []
    // One castle, from the first breakfast to the last table. No tribes, no
    // merge, and therefore never "Merged Cast" — which is what it said.
    : _castle
      ? [{ name: 'The Castle', color: setting.accent, members: active }]
    // One house, from the first day to the last. There is nothing to split.
    : _hubHouse
      ? [{ name: displayState.phase === 'finale' ? 'Finalists' : 'The House', color: setting.accent, members: active }]
      : displayState.phase === 'pre-merge' && (displayState.tribes || []).length
        ? displayState.tribes.map(t => {
            // `members` is the contestant list and stays the contestant list —
            // "5 remaining" counts who can still take a placement. Coaches ride
            // alongside it so the tribe on screen matches the tribe at camp.
            const _m = (t.members || []).filter(n => active.includes(n));
            return { name: t.name, color: typeof tribeColor === 'function' ? tribeColor(t.name) : setting.accent,
              members: _m, coaches: coachesOf(t.name).map(c => c.name) };
          }).filter(t => t.members.length || t.coaches.length)
        : [{ name: displayState.phase === 'finale' ? 'Finalists' : 'Merged Cast', color: setting.accent, members: active }];
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
    active, groups, latest, history, liveEpisode: Number(liveLatest?.num || 0), isHistorical, storylines: [...new Set(storylines)].slice(0, 3), twistLabel, latestOutcome,
    // `nextEpisode`, not `state.episode + 1`. Two sources for one number, and
    // they disagreed: everything else on this screen reads the last episode in
    // the history, while the button read `gs.episode` — which the Big Brother
    // engine never advanced. So the hub sat there having just played episode
    // one and offered to play episode one.
    primaryLabel: lifecycle === 'setup' ? 'Start Season · Play Episode 1' : isHistorical ? `Return to Current · Episode ${liveLatest.num}` : lifecycle === 'complete' ? 'View Season Results' : state?.phase === 'finale' ? `Play Finale · Episode ${nextEpisode}` : `Play Episode ${nextEpisode}`,
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
  // A house has no tribes and no merge, so Total Drama's phase names describe
  // nothing about it. What it has is a number of people left.
  const _bbSeason = isBigBrotherSeason();
  // A castle has no tribes and no merge either, so Total Drama's phase names
  // describe nothing about it. What it has is a number of people left.
  const phaseLabel = (_bbSeason || isTraitorsSeason())
    ? (model.phase === 'complete' ? 'Complete' : model.remaining ? 'Final ' + model.remaining : 'Setup')
    : model.phase === 'pre-merge' ? 'Pre-Merge' : model.phase === 'post-merge' ? 'Post-Merge' : model.phase === 'finale' ? 'Finale' : model.phase === 'complete' ? 'Complete' : 'Setup';
  const primaryClick = model.primaryAction === 'results' ? "showTab('results')" : model.primaryAction === 'current' ? `viewEpisode(${model.liveEpisode})` : 'simulateNext()';
  // Season Controls default OPEN in every lifecycle; the user's manual
  // open/closed choice is remembered across renders and reloads.
  const controls = document.getElementById('season-controls-details');
  if (controls && !controls.dataset.hubInit) {
    controls.dataset.hubInit = '1';
    controls.open = localStorage.getItem('simulator_seasonControlsOpen') !== 'false';
    controls.addEventListener('toggle', () => {
      try { localStorage.setItem('simulator_seasonControlsOpen', String(controls.open)); } catch (e) {}
    });
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
    : model.groups.map(group => {
        const _co = group.coaches || [];
        const _count = `${group.members.length} remaining${_co.length ? ` · ${_co.length} coach${_co.length === 1 ? '' : 'es'}` : ''}`;
        const _faces = [...group.members.map(name => _hubPortrait(name)),
                        ..._co.map(name => _hubPortrait(name, players, false, true))].join('');
        return `<section class="hub-tribe"><header><span class="hub-tribe-dot" style="background:${_hubEsc(group.color)}"></span><strong>${_hubEsc(group.name)}</strong><small>${_count}</small></header><div class="hub-cast-row">${_faces}</div></section>`;
      }).join('');
  const latestVotes = Object.entries(model.latest?.votes || {}).sort(([,a],[,b]) => b-a).slice(0, 3).map(([name, count]) => `<span>${_hubEsc(name)} <b>${count}</b></span>`).join('');
  const headlineStatus = _spoilerFree && model.latest
    ? `Episode ${model.latest.num} is ready to watch · outcome hidden`
    : model.isHistorical ? `Reviewing Episode ${model.latest.num} · ${model.remaining} contestants remained afterward`
    : model.lifecycle === 'complete' ? (isTraitorsSeason() ? 'The castle has made its final choice.' : 'The season is complete. The jury has spoken.') : `Episode ${model.nextEpisode} is ready · ${model.remaining} of ${model.originalCount} contestants remain`;
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
      ${aftermath.editWatch?.length ? `<article class="hub-aftermath-card"><span class="hub-aftermath-index">05</span><div><label>Audience pulse</label><ul>${aftermathRows(aftermath.editWatch, 'edit')}</ul></div></article>` : ''}
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
    <header class="hub-headline"><div><div class="hub-kicker">${model.setting.icon} ${_hubEsc(model.setting.label)} · ${_hubEsc(phaseLabel)}</div><div class="hub-state-badge">${_hubEsc(stateLabel)}</div><h1>${_hubEsc(model.title)}</h1><p>${_hubEsc(headlineStatus)}</p></div><div class="hub-headline-right"><button type="button" class="hub-sf${_spoilerFree ? ' is-on' : ''}" role="switch" aria-checked="${_spoilerFree}" onclick="toggleSpoilerFree(${!_spoilerFree})" title="${_spoilerFree ? 'Results are hidden until you watch the episode' : 'Results are shown on this screen as soon as an episode is simulated'}"><span class="hub-sf-track"><span class="hub-sf-knob"></span></span><span class="hub-sf-label">Spoiler-free<small>${_spoilerFree ? 'On · outcomes hidden' : 'Off · outcomes shown'}</small></span></button><button class="hub-primary" onclick="${primaryClick}">${_hubEsc(model.primaryLabel)}<span>→</span></button></div></header>
    ${secondaryActions}
    <div class="hub-progress${_spoilerFree && model.latest ? ' hub-progress-hidden' : ''}" role="progressbar" aria-label="${_spoilerFree && model.latest ? 'Season progress hidden' : 'Season progress'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${_spoilerFree && model.latest ? 0 : model.progress}"><span style="width:${_spoilerFree && model.latest ? 100 : model.progress}%"></span></div>
    ${model.latest ? `<section class="hub-last-night"><div class="hub-last-label">Last episode</div><div class="hub-last-person">${_spoilerFree ? '<span class="hub-spoiler-mark">?</span>' : latestElim ? latestPortraits : '<span class="hub-no-boot">No elimination</span>'}</div><div class="hub-last-copy"><strong>${_spoilerFree ? 'Outcome hidden until you watch' : _hubEsc(model.latestOutcome)}</strong><span>Episode ${model.latest.num}${!_spoilerFree && model.latest.challengeLabel ? ` · ${_hubEsc(model.latest.challengeLabel)}` : ''}</span></div><div class="hub-last-votes">${_spoilerFree ? '<em>Votes hidden</em>' : latestVotes}</div><button class="hub-watch" onclick="openVisualPlayer(${Number(model.latest.num)})">▶ Watch</button></section>` : `<section class="hub-premiere-note"><strong>The premiere is next.</strong><span>Nobody has voted yet. Opening bonds and first impressions will finally become consequences.</span></section>`}
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
    if (replayBtn) replayBtn.style.display = _canReplay(_viewNum) ? 'block' : 'none';
  }
  // ── LIVE-UPDATE THE SEASON TIMELINE — ON THE ONE SHOW THAT CAN ─────
  //
  // `buildEpisodeMap` reads the REAL nights off the season's rows for a castle
  // and ONLY for a castle: a Traitors season is decided in one call, so every
  // night is already on `episodeHistory` or `_trQueue` carrying the `exits` it
  // actually made, and the timeline can report what happened instead of what
  // was projected.
  //
  // Every other format has no such branch. Total Drama and Big Brother fall
  // through to the PROJECTION — a count derived from seasonConfig before a
  // single episode has run — so redrawing it after each episode re-renders the
  // same guess, and where the guess has drifted from the season (a medevac, a
  // quit, a twist that took two) it redraws a number that is now wrong, over
  // and over, looking like a live figure. A projection presented as live is
  // worse than a projection left alone.
  //
  // So the refresh is limited to the show it works for. The other two get the
  // timeline they always had: drawn on the setup screen and on twist edits.
  if (isTraitorsSeason()) {
    try { renderTimeline(); } catch (e) { /* timeline is optional chrome */ }
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
            await window.exportSeason(s => { exportBtn.textContent = s; });
            exportBtn.textContent = 'All Done!';
            setTimeout(() => { exportBtn.textContent = 'Export & Fill Narratives'; exportBtn.disabled = false; }, 3000);
          } catch (err) {
            console.error('Export error:', err);
            exportBtn.textContent = 'Failed — check console';
            setTimeout(() => { exportBtn.textContent = 'Export & Fill Narratives'; exportBtn.disabled = false; }, 5000);
          }
        };
        btn.parentElement.insertBefore(exportBtn, btn.nextSibling);
        _addPublishToggle(exportBtn);
        _addWikiFillToggle(exportBtn);
      _addLifeHookToggle(exportBtn);
        _addLifeHookToggle(exportBtn);
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

  // Same rule as the hub: a house never splits, whatever the cast was built
  // with or what phase the state object still says.
  const _gsHouse = (typeof isBigBrotherSeason === 'function' && isBigBrotherSeason())
    || isTraitorsSeason();   // same rule, third show: a castle never splits
  if (!_gsHouse && d.phase === 'pre-merge' && d.tribes.length) {
    html += `<div style="margin-top:8px">`;
    d.tribes.forEach(t => {
      const tc = tribeColor(t.name);
      // `t.members` is the contestant list. The coaches living at this camp
      // are counted separately and named separately, so the number stays
      // honest about who can compete and the panel stays honest about who is
      // there — the tenth screen to conflate the two.
      const _gsCo = coachesOf(t.name).map(c => c.name);
      html += `<div class="gs-tribe"><div class="gs-tribe-name" style="color:${tc}">${t.name} (${t.members.length}${_gsCo.length ? ` + ${_gsCo.length} coach${_gsCo.length === 1 ? '' : 'es'}` : ''})</div><div class="gs-tribe-members">${[...t.members, ..._gsCo.map(n => `${n} (coach)`)].join(' · ')}</div></div>`;
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
          await window.exportSeason(s => { exportBtn.textContent = s; });
          exportBtn.textContent = 'All Done!';
          setTimeout(() => { exportBtn.textContent = 'Export & Fill Narratives'; exportBtn.disabled = false; }, 3000);
        } catch (err) {
          console.error('Export error:', err);
          exportBtn.textContent = 'Failed — check console';
          setTimeout(() => { exportBtn.textContent = 'Export & Fill Narratives'; exportBtn.disabled = false; }, 5000);
        }
      };
      btn.parentElement.insertBefore(exportBtn, btn.nextSibling);
      _addPublishToggle(exportBtn);
      _addWikiFillToggle(exportBtn);
      _addLifeHookToggle(exportBtn);
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
  } else if (gs.phase === 'finale'
      || (isBigBrotherSeason() && houseIsAtFinale()
        && !(gs.episodeHistory || []).some(e => e?.isFinale))) {
    // Big Brother never sets gs.phase to 'finale' — the house shrinks to its
    // finale size and the week engine simply stops having anything to run. So
    // the button kept offering "Simulate Episode 12" on a night that is the
    // finale, and the one week of the season that plays differently was the
    // one the button described as ordinary.
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
  // ── THE CASTLE'S CARD ─────────────────────────────────────────────
  //
  // Total Drama's card below asks for Immunity, Tribal and a vote breakdown.
  // A castle has none of the three, and drawn over a Traitors row it printed
  // "Immunity —", "All vote" and "0 cast" — one show's vocabulary over
  // another's night, which is the recurring bug the show registry exists to
  // stop. Every word here comes from `exitVerbs()` and every name from
  // `roundExits()`, so a registry change reaches both.
  if (_isCastleRow(epRecord)) {
    const [banishWord, murderWord] = exitVerbs('traitors');
    const exits = roundExits(epRecord, 'traitors');
    const said = ch => exits.filter(x => x.channel === ch).map(x => x.name).join(' + ') || '—';
    const tr = epRecord.tr || {};
    const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
    card.innerHTML = `<div class="ep-result">
      <div class="ep-result-header">
        <span class="ep-result-num">Episode ${epRecord.num}</span>
        <span class="ep-result-phase" style="color:#b91c3c">${
          tr.endgame ? 'THE ENDGAME' : tr.table ? 'ROUND TABLE' : 'ARRIVAL'}</span>
      </div>
      <div class="ep-facts">
        <div class="ep-fact ep-eliminated"><label>${cap(banishWord)}</label><span>${
          _spoilerFree ? '???' : said('banishment')}</span></div>
        <div class="ep-fact ep-eliminated"><label>${cap(murderWord)}</label><span>${
          _spoilerFree ? '???' : said('murder')}</span></div>
        <div class="ep-fact"><label>Still in the castle</label><span>${
          (tr.living || []).length}</span></div>
        <div class="ep-fact"><label>The pot</label><span>${
          _spoilerFree ? '???' : Number(tr.pot || 0).toLocaleString('en-GB')}</span></div>
      </div>
      ${_spoilerFree ? `<div style="margin-top:8px;font-size:11px;color:var(--muted);font-style:italic;text-align:center">Spoiler-free mode — open Visual Player to watch the episode</div>` : ''}
    </div>`;
    const _tEl = document.getElementById('ep-output-text');
    _tEl.value = _spoilerFree ? '' : _freshTranscript(epRecord);
    _tEl.style.display = '';
    return;
  }
  const tc = epRecord.isFinale ? '#f59e0b' : epRecord.isMerge ? '#10b981' : epRecord.challengeType==='tribe' ? tribeColor(epRecord.immunityWinner||'') : '#6366f1';
  const phaseTag = epRecord.isFinale ? 'FINALE' : epRecord.isMerge ? 'MERGE' : epRecord.challengeType==='tribe' ? 'Pre-merge' : 'Post-merge';
  const riTag = epRecord.riChoice === 'REDEMPTION ISLAND' ? `<span class="ep-hist-tag" style="background:rgba(249,115,22,0.15);color:#f97316">RI</span>` : epRecord.riChoice === 'WENT HOME' ? `<span class="ep-hist-tag" style="background:rgba(148,163,184,0.1);color:var(--muted)">Home</span>` : '';

  const voteEntries = Object.entries(epRecord.votes||{}).sort(([,a],[,b])=>b-a);
  const topVotes = voteEntries[0]?.[1] || 0;
  const chips = voteEntries.map(([n,v]) => `<span class="ep-vote-chip ${v===topVotes?'top':''}">${n}: ${v}</span>`).join('');

  // One source for "who left this episode", so a night that removes two never
  // has to be taught to a second hand-rolled ternary chain.
  const _sfNames = getEpisodeEliminations(epRecord);
  const _sfElim = _spoilerFree ? '???'
    : _sfNames.length ? _sfNames.join(' + ')
    : 'None';

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
  _otEl.value = _spoilerFree ? '' : _freshTranscript(epRecord);
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
  // The record of who has actually played, for anything that needs to know —
  // the Mystery Competitor's door, above all. Silent on failure: an empty pool
  // means the twist does not fire, which is the honest answer.
  fetch('players_database.json')
    .then(r => r.json())
    .then(data => { try { setAlumniDatabase(data); } catch { /* no record, no cameos */ } })
    .catch(() => {});
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
      // Anything already drawn from the roster is now out of date.
      //
      // js/cast-ui.js carries a hardcoded copy of the roster — 104 characters,
      // frozen whenever it was last pasted in — as the no-JS fallback for this
      // fetch. Open the Casting Studio in the second before the fetch lands and
      // it renders that copy and never looks again, so the 78 characters added
      // since were simply absent, with nothing on screen saying so. It reads
      // exactly like "new characters do not appear in the Studio", which is how
      // it was reported.
      try { window.renderStudio?.(); } catch { /* the roster is loaded either way */ }
    })
    .catch(() => {}); // silent fallback to localStorage / embedded copy
});
/**
 * Spoiler-free, from either of the two places that can now set it.
 *
 * It only ever lived on a checkbox in the season config, which is below the
 * episode sections and only populated once a season is running — so the one
 * setting whose whole job is "do not show me the result" could not be reached
 * until after a result existed. There is a switch in the season hub header now,
 * and it passes the value explicitly rather than reading a checkbox that may
 * not be on the page.
 *
 * @param next true/false from a control, or omitted to read the config box
 */
export function toggleSpoilerFree(next) {
  _spoilerFree = typeof next === 'boolean' ? next
    : (document.getElementById('cfg-spoiler-free')?.checked || false);
  // Whichever one was clicked, both agree afterwards.
  const box = document.getElementById('cfg-spoiler-free');
  if (box) box.checked = _spoilerFree;
  try { localStorage.setItem('simulator_spoilerFree', _spoilerFree); } catch(e) {}
  // Guarded: the hub switch is reachable BEFORE a season has any episodes, and
  // both of these read the history without checking it is there.
  const history = gs?.episodeHistory || [];
  if (history.length) {
    renderEpisodeHistory();
    const epToShow = viewingEpNum ? history.find(e => e.num === viewingEpNum) : history[history.length - 1];
    if (epToShow) renderEpisodeView(epToShow);
  }
  renderSeasonHub();
}

/**
 * The castle's pills for one night of the episode timeline.
 *
 * ASKED OF `TRAITORS_SCREENS`, not of a second list of conditions. Every other
 * show's badges in this file are eighty hand-written ternaries, one per twist,
 * each repeating a flag the engine already set — and a new twist gets one by
 * somebody remembering. The castle already has exactly one list of what a
 * night contained, `js/vp-tr/screens.js`, which the visual player and the text
 * backlog both read; this is the third reader of it rather than the first copy
 * of it. Add a screen there and its pill appears here.
 *
 * The murder pill is the exception and is NOT a screen: it is a fact about the
 * row, read through `roundExits()` because this is the only show with two
 * doors and the timeline must never report a murder as a vote.
 */
function _traitorsBadges(ep) {
  const pill = (text, color) => `<span class="ep-hist-tag" `
    + `style="background:${color}22;color:${color}">${text}</span>`;
  let out = '';
  for (const scr of TRAITORS_SCREENS) {
    if (!scr.badge) continue;
    let on = false;
    try { on = !!scr.when(ep); } catch { on = false; }
    if (on) out += pill(scr.badge.text, scr.badge.color);
  }
  const [, murderWord] = exitVerbs('traitors');
  const murdered = roundExits(ep, 'traitors').filter(x => x.channel === 'murder');
  if (murdered.length) {
    out += pill(murderWord.charAt(0).toUpperCase() + murderWord.slice(1), '#f85149');
  }
  return out;
}

export function renderEpisodeHistory() {
  const grid = document.getElementById('ep-history-grid');
  const history = gs.episodeHistory;
  if (!history.length) { grid.innerHTML=''; return; }

  const currentNum = viewingEpNum || history[history.length-1].num;
  grid.innerHTML = history.map(ep => {
    // A castle night shares none of Total Drama's eighty flags, and running
    // them over it would be eighty reads of fields that do not exist on the
    // row. It gets its own card, with the show's own two doors on it.
    if (_isCastleRow(ep)) {
      const hasCp = _canReplay(ep.num);
      const gone = _spoilerFree ? '???'
        : (roundExits(ep, 'traitors').map(x => x.name).join(' + ') || '—');
      return `<div class="ep-hist-card ${ep.num === currentNum ? 'active' : ''}" onclick="viewEpisode(${ep.num})">
        <div class="ep-hist-ep">Episode ${ep.num}${hasCp
          ? `<button class="ep-hist-replay" title="Re-run this episode" onclick="event.stopPropagation();replayEpisode(${ep.num})">↺</button>` : ''}</div>
        <div class="ep-hist-elim">${gone}</div>
        <div>${_spoilerFree ? '' : _traitorsBadges(ep)}</div>
      </div>`;
    }
    const riTag = ep.riChoice==='REDEMPTION ISLAND' ? `<span class="ep-hist-tag" style="background:rgba(249,115,22,0.15);color:#f97316">RI</span>` : ep.riChoice==='WENT HOME' ? `<span class="ep-hist-tag" style="background:rgba(148,163,184,0.1);color:var(--muted)">Home</span>` : '';
    const mergeTag = ep.isMerge ? `<span class="ep-hist-tag" style="background:rgba(16,185,129,0.15);color:var(--accent)">MERGE</span>` : '';
    // Somebody walked IN on this episode, which is the one thing the timeline
    // has never had to show.
    const arrivalTag = ep.lateArrival ? `<span class="ep-hist-tag" style="background:rgba(56,189,248,0.15);color:#38bdf8">+ ${ep.lateArrival.name}</span>` : '';
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
    const coachTag = ep.isCoaches ? `<span class="ep-hist-tag" style="background:rgba(90,140,220,0.15);color:#5a8cdc">Coaches</span>` : '';
    const coachBootTag = (ep.coachElimination || []).length ? `<span class="ep-hist-tag" style="background:rgba(220,80,80,0.15);color:#dc5050">Coach Voted Out</span>` : '';
    const rtcTag = ep.isRewardOnly ? `<span class="ep-hist-tag" style="background:rgba(240,165,0,0.15);color:#f0a500">Reward</span>` : '';
    const _hasAuction = (ep.twists || []).some(t => t.type === 'auction');
    const aucTag = _hasAuction ? `<span class="ep-hist-tag" style="background:rgba(233,196,106,0.15);color:#e9c46a">Auction</span>` : '';
    const ncTag = ep.noChallenge && !_hasAuction ? `<span class="ep-hist-tag" style="background:rgba(240,163,90,0.15);color:#f0a35a">No Challenge</span>` : '';
    const hasCheckpoint = _canReplay(ep.num);
    const replayBtn = hasCheckpoint
      ? `<button class="ep-hist-replay" title="Re-run this episode" onclick="event.stopPropagation();replayEpisode(${ep.num})">↺</button>`
      : '';
    return `<div class="ep-hist-card ${ep.num===currentNum?'active':''}" onclick="viewEpisode(${ep.num})">
      <div class="ep-hist-ep">Episode ${ep.num}${replayBtn}</div>
      <div class="ep-hist-elim">${_spoilerFree ? '???'
        : ep.isInterlude ? 'Interlude'
        // One source for who left, so a night that removes two people
        // never has to be taught to a second hand-rolled chain of ternaries.
        : (getEpisodeEliminations(ep).join(' + ') || (ep.isFinale ? 'FTC' : '—'))}</div>
      <div>${riTag}${arrivalTag}${mergeTag}${finaleTag}${slasherTag}${mcTag}${mnTag}${mgrTag}${mtfTag}${dpTag}${ilTag}${tiTag}${tddTag}${suTag}${brunchTag}${bsTag}${pfTag}${cdTag}${aatTag}${evTag}${dbTag}${tsTag}${soTag}${utcTag}${tdtTag}${amgTag}${paTag}${talTag}${nocTag}${bcbTag}${scTag}${womTag}${phTag}${hkTag}${tcTag}${xtTag}${lhTag}${hsTag}${otcTag}${wwTag}${taTag}${ccTag}${ytTag}${aeTag}${bbbTag}${ctTag}${csTag}${ofTag}${modTag}${fmdTag}${ohTag}${bcTag}${smTag}${ocTag}${shTag}${hhTag}${hodTag}${ppTag}${gcTag}${rrTag}${kfTag}${swoTag}${tdTag}${weTag}${brutalerTag}${cftTag}${fcTag}${vsTag}${ssrTag}${bbTag}${azTag}${nmTag}${tosTag}${rdTag}${ttTag}${mmhTag}${gpTag}${hbTag}${hdTag}${brbTag}${gfoTag}${alsTag}${rpTag}${dhTag}${iibTag}${fcrTag}${baTag}${ptTag}${prwTag}${amhTag}${cocTag}${coachTag}${coachBootTag}${rtcTag}${aucTag}${ncTag}</div>
    </div>`;
  }).join('');
}

export function viewEpisode(num) {
  viewingEpNum = num;
  const epRecord = gs.episodeHistory.find(e=>e.num===num);
  if (epRecord) { renderEpisodeView(epRecord); renderEpisodeHistory(); renderGameState(); renderSeasonHub(); }
}

/**
 * A checkpoint before a headless show advances. Total Drama saves its own
 * checkpoint inside episode.js; Big Brother and Traitors take theirs at the
 * UI boundary. Called from both normal play and replay so a replayed episode
 * remains replayable.
 */
export function _saveEpisodeCheckpoint() {
  // Keyed by the EPISODE the checkpoint belongs to, which is the number the
  // replay button looks it up by — `gsCheckpoints[ep.num]`.
  //
  // It used to key on the week count, and those two agree only while one
  // episode is one week. A double eviction pushes TWO weeks for one episode
  // and so does a Split House, so from the first one onward every checkpoint
  // after it was written under a number no episode would ever carry: the
  // button vanished on the next episode and never came back for the rest of
  // the season. The season was not corrupt, it was mislabelled — and this is
  // the same divergence that made the episode counter jump, which is why the
  // count must come from the same place the episode number does.
  const cpNum = (gs.episodeHistory?.length || 0) + 1;
  try {
    gsCheckpoints[cpNum] = snapshotGs();
    repairGsSets(gsCheckpoints[cpNum]);
    _idbPut('cp_' + cpNum, JSON.parse(JSON.stringify(gsCheckpoints[cpNum])));
  } catch { /* a week must never fail on its own undo button */ }
}
export const _saveBBCheckpoint = _saveEpisodeCheckpoint;

export function simulateNext() {
  if (!gs) { if (!initGameState()) { alert('Add players to Cast Builder first.'); return; } }

  // ── PRE-GAME ALLIANCES, EVERY TIME, NOT ONLY WHEN THE FORM IS TOUCHED ──
  //
  // `applyPreAlliances` was called from the Relationships form and nowhere
  // else, so an alliance created before that hook existed — or created, then
  // left alone while the page reloaded — sat in local storage and never reached
  // the game. Nothing on screen said so, and the first sign was a houseguest
  // voting as though a group they were in did not exist.
  //
  // Idempotent, and it refuses on its own terms: nothing is applied to a season
  // where the members have all been in the house since night one, because that
  // would be back-dating.
  try { window.applyPreAlliances?.(); } catch { /* the week plays without it */ }
  // Fire-making / Koh-Lanta override: force F4 finale
  const _needsF4Finale = seasonConfig.firemaking || seasonConfig.finaleFormat === 'fire-making' || seasonConfig.finaleFormat === 'koh-lanta';
  if (_needsF4Finale) {
    if (seasonConfig.finaleSize < 4) seasonConfig.finaleSize = 4;
    if (gs.phase === 'finale' && gs.activePlayers.length > 4) {
      gs.phase = 'post-merge';
    }
  }
  // A Big Brother season is a different game, so it takes a different engine.
  // episode.js is not involved: no tribes, no merge, no Tribal Council.
  //
  // The branch turns on the FORMAT alone, never on how far the season has got.
  // An earlier version fell through to the Total Drama side once the house
  // reached its final few, and since gs.phase is never 'finale' in a Big
  // Brother season, that meant running simulateEpisode — tribes, a challenge,
  // Tribal Council — on three houseguests.
  // ── THE CASTLE ────────────────────────────────────────────────────
  //
  // Third engine, third branch, and it turns on the FORMAT alone for the
  // reason the house's does: falling through to episode.js at the final few
  // would run tribes and a Tribal Council over a castle.
  //
  // The whole season is played on the first press and the rows are queued —
  // see js/tr-run.js for why an engine with no per-night entry point cannot
  // be asked for one. Everything after the call is what the house does:
  // checkpoint, feed, spoiler reveal, render.
  // ── THE MAIN STAGE ────────────────────────────────────────────────
  //
  // Fourth engine, fourth branch, and it turns on the FORMAT alone for the
  // same reason the castle's does: falling through to episode.js at the final
  // few would run tribes and a Tribal Council over a runway.
  //
  // The whole season is played on the first press and the rows are queued —
  // see js/dr-run.js for why an engine whose finale depends on the whole run
  // cannot be asked for one night at a time.
  if (isDragSeason()) {
    _saveEpisodeCheckpoint();
    const drEp = simulateDragEpisode();
    if (!drEp) {
      alert(gs.activePlayers && gs.activePlayers.length
        ? 'This season is already complete.'
        : 'Add queens to Cast Builder first.');
      return;
    }
    // POPULARITY IS NOT UPDATED HERE, AND THE OMISSION IS DELIBERATE.
    // `updatePopularity` reads a Total Drama episode — challenges, idols, a
    // tribal — and this show has none of them. js/dr-run.js writes the ledger
    // from the season's own events instead.
    _refreshFeed();
    _autoRevealSpoiler(drEp.num);
    viewingEpNum = drEp.num;
    renderRunTab();
    document.getElementById('run-main').scrollTop = 0;
    return;
  }
  if (isTraitorsSeason()) {
    _saveEpisodeCheckpoint();
    const trEp = simulateTraitorsEpisode();
    if (!trEp) {
      alert(gs.activePlayers && gs.activePlayers.length
        ? 'This castle season is already complete.'
        : 'Add players to Cast Builder first.');
      return;
    }
    // POPULARITY IS NOT UPDATED HERE, AND THE OMISSION IS THE POINT.
    // `updatePopularity` reads a Total Drama episode — challenges, idols, a
    // tribal — and this show has none of them. The castle keeps its own two
    // ledgers in js/tr/crowd.js and the engine has already written them.
    _refreshFeed();
    _autoRevealSpoiler(trEp.num);
    viewingEpNum = trEp.num;
    renderRunTab();
    document.getElementById('run-main').scrollTop = 0;
    return;
  }

  if (isBigBrotherSeason()) {
    // A checkpoint before the week runs, exactly like a Total Drama episode
    // takes one before it runs. episode.js saves TD's inside the simulator;
    // the house's engine stays headless, so its checkpoint is taken here at
    // the same moment — which is what makes Re-run This Episode exist for a
    // house at all. Keyed by the number the coming episode will carry.
    _saveEpisodeCheckpoint();
    // At the final few the week engine has nothing left to run, so the last
    // night takes over: the three-part Head of Household, the cut, and the jury.
    const bbEp = simulateBBEpisode() || runBBFinale();
    if (!bbEp) {
      alert('This Big Brother season is already complete.');
      return;
    }
    if (seasonConfig.popularityEnabled !== false) { updatePopularity(bbEp); saveGameState(); }
    // The audience reacts AFTER popularity is updated — that is the number the
    // feed reads to decide who gets defended and who gets ratioed.
    _refreshFeed();
    _autoRevealSpoiler(bbEp.num);
    viewingEpNum = bbEp.num;
    renderRunTab();
    document.getElementById('run-main').scrollTop = 0;
    return;
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
  _refreshFeed();
  _autoRevealSpoiler(ep.num);
  viewingEpNum = ep.num;
  renderRunTab();
  document.getElementById('run-main').scrollTop = 0;
}

/**
 * Let the audience react to the episode that just aired.
 *
 * Optional by design: the feed reconciles the whole season every time it runs,
 * so a night it misses is picked up by the next call or by the sync button. It
 * must never be able to break "next episode" — hence the guard and the catch.
 */
function _refreshFeed(opts) {
  try {
    // The generated feed lands first and synchronously, so the screen is never
    // waiting on somebody else's uptime between "next episode" and the result.
    window.refreshSocialFeed?.(opts);
    // Then, only if the season asked for it, the words are improved in the
    // background. Nothing awaits this: it writes onto the stored posts in
    // place, so a viewer who opens the feed before it lands sees the generated
    // version and a viewer who opens it after sees the written one.
    if (window.socialWriterOn?.()) {
      Promise.resolve(window.refreshSocialFeedWritten?.(opts))
        .catch(() => { /* the templates already ran */ });
    }
  } catch { /* the episode is what matters */ }
}

export function simulateMultipleEpisodes(count) {
  if (!gs || !gs.initialized) { alert('Start a season first.'); return; }
  const max = count || 999;
  let ran = 0;
  const runOne = () => {
    // ── STOP WHEN THE SEASON IS OVER, NOT WHEN THE HOUSE IS SMALL ──
    //
    // This stopped the moment the house reached finale size, which is the week
    // BEFORE the finale — so Sim All ran a whole season and then quietly
    // declined to play the last night, leaving the winner undecided with no
    // message saying why.
    //
    // The runaway it was written to prevent is real but is guarded elsewhere:
    // simulateNext falls through to runBBFinale at finale size, and the finale
    // sets gs.phase to 'complete', which the condition below already stops on.
    // What is needed is one more pass, not none — so this now only bites if a
    // finale has somehow already been played and the house is still sitting at
    // finale size, which would be the genuine loop.
    const bbFinalePlayed = (gs.episodeHistory || []).some(e => e?.isFinale);
    const bbDone = isBigBrotherSeason() && houseIsAtFinale() && bbFinalePlayed;
    // A castle ends when its queue is empty and not when the room is small:
    // the endgame runs on three people and can force several more tables, so
    // `activePlayers.length <= 1` would stop Sim All several nights early and
    // leave the money undecided. `gs.phase` is set to 'complete' by
    // simulateTraitorsEpisode on the last row, which the condition already
    // stops on — so the castle only needs the small-room test disarmed.
    const castleRunning = isTraitorsSeason() && gs.phase !== 'complete';
    if (ran >= max || bbDone || gs.phase === 'complete'
      || (!castleRunning && gs.activePlayers.length <= 1)) {
      renderRunTab();
      document.getElementById('run-main').scrollTop = 0;
      return;
    }
    simulateNext();
    ran++;
    if (gs.phase !== 'complete'
      && (isTraitorsSeason() || gs.activePlayers.length > 1) && ran < max) {
      setTimeout(runOne, 0);
    } else {
      // already rendered by simulateNext on last call
    }
  };
  runOne();
}

/**
 * Can this episode be re-run? A castle re-runs off its persisted base seed, so
 * every aired episode is replayable — including after a reload, unlike the
 * in-memory checkpoints the other shows use.
 */
function _canReplay(epNum) {
  if (isTraitorsSeason()) return !!(gs && gs._trSeed);
  return !!gsCheckpoints[epNum];
}

export function replayEpisode(epNum) {
  // The castle re-runs FOR REAL and off its base seed — no checkpoint needed,
  // so it works after a reload too, and every earlier episode reproduces
  // exactly while this night onward is a genuinely different season.
  if (isTraitorsSeason()) { _replayTraitorsEpisode(epNum); return; }
  const checkpoint = gsCheckpoints[epNum];
  if (!checkpoint) { alert(`No checkpoint saved for Episode ${epNum}. Only episodes run in this session can be replayed.`); return; }
  const laterEps = gs.episodeHistory.filter(e => e.num > epNum);
  const warnMsg = laterEps.length
    ? `Re-run Episode ${epNum}?\n\nEpisodes ${epNum}–${epNum + laterEps.length} will be replaced with new results.`
    : `Re-run Episode ${epNum}?`;
  if (!confirm(warnMsg)) return;

  // NOTHING is thrown away until the new episode exists.
  //
  // This used to roll gs back, delete every checkpoint from here on, and only
  // then simulate — with a bare `if (!ep) return`. So a re-run that came back
  // empty, or threw anywhere inside the engine, left the season already
  // truncated: the episode you asked to re-run was gone, its checkpoints were
  // gone with it, and the screen dropped you on the previous episode with no
  // way forward. "It deleted the episode instead of re-running it" is exactly
  // that path.
  //
  // Now the rollback is reversible until the replacement is in hand.
  const before = snapshotGs();
  const droppedKeys = Object.keys(gsCheckpoints).filter(k => Number(k) >= epNum);
  const droppedCps = droppedKeys.map(k => [k, gsCheckpoints[k]]);

  let ep = null;
  let failure = null;
  try {
    gs = JSON.parse(JSON.stringify(checkpoint));
    repairGsSets(gs);
    // Re-run this episode — the format decides the engine, exactly as
    // simulateNext does. The replay path only knew Total Drama's two engines,
    // so a house had checkpoints it could never spend.
    if (isBigBrotherSeason() || isTraitorsSeason() || isDragSeason()) _saveEpisodeCheckpoint();
    // The castle re-airs rather than re-plays: the checkpoint carries the
    // queue AND the seed, so shifting the next row off it hands back the same
    // night. That is the correct behaviour and not a limitation — the season
    // was decided in one call and re-deciding it from episode 3 would rewrite
    // the ending, which is the thing the endgame's placement already warns
    // about.
    ep = isDragSeason()
      ? simulateDragEpisode()
      : isTraitorsSeason()
        ? simulateTraitorsEpisode()
        : isBigBrotherSeason()
          ? (simulateBBEpisode() || runBBFinale())
          : (gs.phase === 'finale' ? simulateFinale() : simulateEpisode());
  } catch (e) {
    failure = e;
  }

  if (!ep) {
    // Put the season back exactly as it was and say so, rather than leaving a
    // hole where an episode used to be.
    gs = before;
    repairGsSets(gs);
    for (const [k, cp] of droppedCps) gsCheckpoints[k] = cp;
    // The restore is the important half; a repaint that throws must not leave
    // the caller believing the season was lost.
    try { renderRunTab(); } catch { /* the state is already back */ }
    alert(`Episode ${epNum} could not be re-run, so nothing was changed.${
      failure ? `\n\n${failure.message || failure}` : ''}`);
    return;
  }

  // It worked. Only now are the old checkpoints past this point unreachable.
  for (const k of droppedKeys) {
    if (Number(k) > ep.num) { delete gsCheckpoints[k]; _idbDelete('cp_' + k); }
  }
  // Same rule as simulateNext: the castle has no Total Drama episode for
  // `updatePopularity` to read, and keeps its own ledgers.
  if (seasonConfig.popularityEnabled !== false && !isTraitorsSeason()) {
    updatePopularity(ep); saveGameState();
  }
  // A replayed episode kept its number but is a different night, so its feed is
  // rewritten rather than left alone — and the episodes it replaced lose theirs.
  _refreshFeed({ rebuild: true });
  _autoRevealSpoiler(ep.num);
  viewingEpNum = ep.num;
  renderRunTab();
  document.getElementById('run-main').scrollTop = 0;
}

/**
 * The castle's own re-run. Re-simulates episode `epNum` onward off the base
 * seed with a fresh divergence, keeping every earlier episode exactly as it
 * aired, then airs the new night. No in-memory checkpoint — it reads the seed
 * off `gs`, so it survives a reload — and the whole gs is snapshotted first so
 * a re-run that fails changes nothing.
 */
function _replayTraitorsEpisode(epNum) {
  if (!gs || !gs._trSeed) {
    alert(`Episode ${epNum} cannot be re-run — this castle was not started in this browser, so there is no season to re-roll.`);
    return;
  }
  const laterEps = (gs.episodeHistory || []).filter(e => e.num > epNum);
  const msg = laterEps.length
    ? `Re-run Episode ${epNum}?\n\nEpisode ${epNum} will be re-simulated into a different night, and Episodes ${epNum + 1}–${epNum + laterEps.length} will be cleared — simulate them again from there. Every earlier episode stays exactly as it is.`
    : `Re-run Episode ${epNum} into a different night?`;
  if (!confirm(msg)) return;

  const before = snapshotGs();
  let ep = null, failure = null, refused = null;
  try {
    if (rerunTraitorsEpisode(epNum)) {
      // AIR ONLY THE RE-RUN EPISODE, then stop. Re-running Episode N clears
      // N+1 onward (rerunTraitorsEpisode leaves the re-rolled future on the
      // queue but unaired); the viewer simulates forward themselves from here,
      // exactly as the other simulators behave. An earlier version aired the
      // whole tail through to the finale so Export stayed enabled, but that made
      // re-running Episode 2 of an eight-night season silently replay all eight
      // — the opposite of "re-run this one episode." If N was the finale the
      // queue is now empty and simulating it lands on `complete` regardless, so
      // Export still works for the case that actually needed it.
      ep = simulateTraitorsEpisode();
      // THE REPLAY WORKED AND PRODUCED NOTHING. A re-rolled season can be
      // SHORTER than the one it replaces — the endgame ends when the room
      // agrees to stop, and a different seed can have it agree a night earlier
      // — so asking for an episode past the new ending leaves an empty queue.
      // That is a real answer and it needs saying: "nothing changed" with no
      // reason attached reads as a broken button.
      if (!ep) {
        refused = `the re-rolled season ends before episode ${epNum}. A different `
          + 'seed can finish the castle a night earlier, so there is no episode '
          + 'there to play. Re-run an earlier one.';
      }
    } else {
      refused = lastTraitorsRerunRefusal();
    }
  } catch (e) { failure = e; }

  if (!ep) {
    gs = before;
    repairGsSets(gs);
    try { renderRunTab(); } catch { /* state is already back */ }
    // WHY, not just THAT. Five separate refusals used to arrive as one
    // sentence with no next step in it — and every one of them knows exactly
    // what is wrong. A refusal is not a failure: nothing is broken and the
    // season is untouched, so what the reader needs is a reason, not a stack.
    const why = failure ? (failure.message || String(failure)) : refused;
    alert(`Episode ${epNum} could not be re-run, so nothing was changed.${
      why ? `\n\n${why}` : ''}`);
    return;
  }
  // A re-run rewrites this episode and everything after it, so the checkpoints
  // for those episodes no longer describe a night that happened.
  for (const k of Object.keys(gsCheckpoints)) {
    if (Number(k) >= epNum) { delete gsCheckpoints[k]; _idbDelete('cp_' + k); }
  }
  _refreshFeed({ rebuild: true });
  _autoRevealSpoiler(ep.num);
  viewingEpNum = ep.num;
  renderRunTab();
  const rm = document.getElementById('run-main'); if (rm) rm.scrollTop = 0;
}

export function copyOutput() {
  const ta = document.getElementById('ep-output-text');
  const epRecord = viewingEpNum ? gs.episodeHistory.find(e=>e.num===viewingEpNum) : gs.episodeHistory[gs.episodeHistory.length-1];
  const text = (epRecord && _freshTranscript(epRecord)) || ta.value;
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
  if (name === 'jury') _updateJuryLabel(el);
}

/**
 * The same slider, in each show's own words.
 *
 * Total Drama sends you to a Council; the house sends you to a jury, and the
 * number means something extra there. A house has no merge and no swap, so the
 * jury opening is the one structural date in the season — the night the person
 * evicted stops going home and starts picking the winner — and it is derived
 * from this slider rather than set anywhere. Showing it here is the difference
 * between choosing a number and choosing a season shape.
 *
 * The arithmetic matches houseStructure() in bb-run.js: the jury is the last
 * `jurySize` people out and the houseguest cut at the final three is one of
 * them, so it opens with jurySize + 2 still in the house.
 */
function _updateJuryLabel(el) {
  const label = document.getElementById('jury-label');
  const note  = document.getElementById('jury-note');
  const isHouse = (typeof seasonFormat !== 'undefined'
    ? seasonFormat(seasonConfig) : seasonConfig.format) === 'big-brother';
  if (label) label.textContent = isHouse ? 'Jury Size' : 'Council Size';
  if (!note) return;
  const size = Number(el?.value) || Number(seasonConfig.jurySize) || 0;
  const cast = players.length;
  if (!isHouse || size <= 0) { note.textContent = ''; return; }
  // Say so when the season cannot seat the jury it is asking for, rather than
  // letting the blueprint be the only place that mentions it.
  note.textContent = cast && size > cast - 2
    ? ` — needs ${size + 2} houseguests, ${cast} cast`
    : ` — jury opens at ${size + 2} left`;
  note.classList.toggle('bad', !!cast && size > cast - 2);
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
        const slugAv = playerAvatarUrl(p.name);
        const init = (p.name || '?')[0].toUpperCase();
        return `<div data-member="${p.name}" data-selected="${sel}" onclick="toggleMolePlayer('${p.name.replace(/'/g,"\\'")}')" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;width:48px">
          <div style="width:36px;height:36px;border-radius:50%;border:3px solid ${sel ? '#f85149' : 'transparent'};overflow:hidden;position:relative;background:var(--surface2);transition:border-color 0.15s">
            <img src="${slugAv}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;${sel ? '' : 'filter:grayscale(0.5);opacity:0.6;'}transition:filter 0.15s,opacity 0.15s" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
            <span style="display:none;font-size:14px;font-weight:700;color:var(--muted);align-items:center;justify-content:center;width:100%;height:100%;position:absolute;top:0;left:0">${init}</span>
          </div>
          <span style="font-size:9px;color:${sel ? '#f85149' : 'var(--muted)'};text-align:center;line-height:1.1;max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color 0.15s">${p.name}</span>
        </div>`;
      }).join('');
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// The season twists, built from their own contracts
// ══════════════════════════════════════════════════════════════════════
//
// Two of them shipped as two near-identical hand-written blocks — a slab of
// HTML each, three seasonConfig keys, three lines in the save path, three in
// the load path and a bespoke player picker — and every new one was going to be
// another copy. A twist that describes its own options in
// js/bb/twist-contract.js gets all of this for free, which is also the only way
// the panel can warn that a twist has nothing to work with before the season
// starts.

const _twists = () => (typeof BB_SEASON_TWISTS !== 'undefined' ? BB_SEASON_TWISTS : []);
const _q = s => String(s ?? '').replace(/'/g, "\\'");

/** Whichever declared kinships an option wants marked in its picker. */
function _markedNames(mark) {
  const out = new Set();
  if (!mark?.kinship) return out;
  for (const r of (typeof relationships !== 'undefined' ? relationships : []) || []) {
    if (r?.kin === mark.kinship) { out.add(r.a); out.add(r.b); }
  }
  return out;
}

/**
 * Whether a twist has the cast it needs.
 *
 * The whole reason the options live on the contract: a dropdown cannot tell you
 * that Rivals has no declared rivalries to build from, so it runs, quietly
 * seats nothing, and looks like a bug. This says so on the panel, next to the
 * switch, before the season starts.
 */
export function seasonTwistWarning(contract) {
  const need = contract?.season?.requires;
  if (!need?.kinship) return null;
  const kinds = [].concat(need.kinship);
  let found = 0;
  for (const r of (typeof relationships !== 'undefined' ? relationships : []) || []) {
    if (r?.kin && kinds.includes(r.kin)) found++;
  }
  if (found >= (need.count || 1)) return null;
  return need.hint || `Needs ${need.count || 1} declared in Relationships; found ${found}.`;
}

/** The whole Format Designer panel for every season twist, in one pass. */
export function renderSeasonTwists() {
  const host = document.getElementById('bb-season-twists');
  if (!host) return;
  host.innerHTML = _twists().map(c => {
    const s = c.season;
    const rgb = s.accent || '163,113,247';
    const subs = (s.options || []).map(opt => {
      const hint = opt.hint ? `<div class="hint hint-tight">${opt.hint}</div>` : '';
      if (opt.type === 'houseguest') {
        return `<div class="form-group" id="grp-${opt.key}" style="display:none">
          <label class="form-label">${opt.label}</label>
          <div id="pick-${opt.key}" style="display:flex;flex-wrap:wrap;gap:4px;max-height:160px;overflow-y:auto"></div>
          ${hint}</div>`;
      }
      // A twist option that is a CHOICE rather than a number. Everything here
      // fell through to a number input, so a contract could declare a select
      // and the page would draw a spinner for it — which is how a season
      // setting can exist in the contract, be read by the engine, and be
      // unreachable from the only screen that sets it.
      if (opt.type === 'select') {
        return `<div class="form-group" style="margin-bottom:0">
          <label class="form-label">${opt.label}</label>
          <select id="cfg-${opt.key}" class="form-input" onchange="saveConfig()">
            ${(opt.choices || []).map(ch =>
    `<option value="${_q(ch.value)}">${ch.label}</option>`).join('')}
          </select>
          ${hint}</div>`;
      }
      return `<div class="form-group" style="margin-bottom:0">
        <label class="form-label">${opt.label}</label>
        <input type="number" id="cfg-${opt.key}" class="form-input" min="${opt.min ?? 1}"
          max="${opt.max ?? 20}" value="${opt.default ?? 1}" onchange="saveConfig()">
        ${hint}</div>`;
    }).join('');
    return `<div class="form-group">
        <label class="form-label">${s.label}</label>
        <select id="cfg-${s.key}" onchange="updateSeasonTwistUI('${_q(c.id)}');saveConfig()" class="form-input">
          ${(s.modes || []).map(m => `<option value="${m.value}">${m.label}</option>`).join('')}
        </select>
        <div class="hint hint-tight">${s.hint || ''}</div>
        <div id="warn-${s.key}" class="hint hint-tight" style="display:none;color:#e3b341"></div>
      </div>
      <div id="sub-${s.key}" style="display:none;margin:-4px 0 14px 0;padding:10px 12px;
        border-left:2px solid rgba(${rgb},.45);background:rgba(${rgb},.05);border-radius:0 6px 6px 0">
        ${subs}
      </div>`;
  }).join('');
  for (const c of _twists()) updateSeasonTwistUI(c.id);
}

/**
 * Show the sub-options belonging to one twist, and paint its pickers.
 *
 * Called on every mode change and after a config load. Safe to call for a twist
 * whose controls are not on the page yet.
 */
export function updateSeasonTwistUI(id) {
  const c = _twists().find(x => x.id === id);
  if (!c) return;
  const s = c.season;
  const mode = document.getElementById(`cfg-${s.key}`)?.value || 'off';
  const sub = document.getElementById(`sub-${s.key}`);
  if (sub) sub.style.display = mode === 'off' ? 'none' : 'block';

  const warnEl = document.getElementById(`warn-${s.key}`);
  if (warnEl) {
    const warn = mode === 'off' ? null : seasonTwistWarning(c);
    warnEl.style.display = warn ? 'block' : 'none';
    warnEl.textContent = warn || '';
  }
  if (mode === 'off') return;

  for (const opt of s.options || []) {
    if (opt.type !== 'houseguest') continue;
    const group = document.getElementById(`grp-${opt.key}`);
    // `when` gates an option on the mode — a picker only means anything when
    // the user asked to choose.
    const shown = !opt.when || opt.when === mode;
    if (group) group.style.display = shown ? 'block' : 'none';
    if (!shown) continue;
    const host = document.getElementById(`pick-${opt.key}`);
    if (!host || typeof players === 'undefined' || !players.length) continue;
    const chosen = seasonConfig[opt.key] || '';
    const marked = _markedNames(opt.mark);
    const accent = `rgb(${s.accent || '163,113,247'})`;
    host.innerHTML = players.map(p => {
      const sel = chosen === p.name;
      const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const slugAv = playerAvatarUrl(p.name);
      const init = (p.name || '?')[0].toUpperCase();
      return `<div onclick="pickSeasonTwistPlayer('${_q(opt.key)}','${_q(c.id)}','${_q(p.name)}')"
        style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;width:48px">
        <div style="width:36px;height:36px;border-radius:50%;border:3px solid ${sel ? accent : 'transparent'};overflow:hidden;position:relative;background:var(--surface2);transition:border-color .15s">
          <img src="${slugAv}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;${sel ? '' : 'filter:grayscale(0.5);opacity:0.6;'}transition:filter .15s,opacity .15s" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
          <span style="display:none;font-size:14px;font-weight:700;color:var(--muted);align-items:center;justify-content:center;width:100%;height:100%;position:absolute;top:0;left:0">${init}</span>
        </div>
        <span style="font-size:9px;color:${sel ? accent : 'var(--muted)'};text-align:center;line-height:1.1;max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}${
        marked.has(p.name) ? ` <b style="color:${accent}" title="${opt.mark?.title || ''}">&#9679;</b>` : ''}</span>
      </div>`;
    }).join('');
  }
}

/** One holder per twist, so picking a second replaces the first. */
export function pickSeasonTwistPlayer(key, id, name) {
  seasonConfig[key] = seasonConfig[key] === name ? '' : name;
  updateSeasonTwistUI(id);
  if (typeof saveConfig === 'function') saveConfig();
}

/**
 * Coaches — a season-long system configured the same way as the Mole
 * (seasonConfig.coaches: disabled|manual|auto). 'manual' reuses the Cast
 * Builder's existing per-player Coach checkbox, so there is no picker grid
 * here to populate — only the per-tribe count control needs to show/hide.
 */
/**
 * Which advantages a coach may find, and from where.
 *
 * Mirrors the contestant advantage list deliberately — same row shape, same
 * source pills — because it is answering the same question about a different
 * kind of person. The note on each row is the half that differs: finding a
 * thing and being allowed to use it are separate permissions for a coach.
 */
export function buildCoachAdvantageList() {
  const host = document.getElementById('coach-adv-list');
  if (!host) return;
  const cfg = seasonConfig.coachAdvantages || {};
  host.innerHTML = ADVANTAGES.map(a => {
    const entry = Object.prototype.hasOwnProperty.call(cfg, a.key)
      ? cfg[a.key] : COACH_FINDABLE_DEFAULT[a.key];
    const on = !!entry?.enabled;
    const sources = entry?.sources || ['camp'];
    const selfPlay = coachCanPlay(a.key);
    return `<div class="adv-row" style="align-items:flex-start">
      <input type="checkbox" id="coach-adv-${a.key}" class="adv-check" ${on ? 'checked' : ''} onchange="updateCoachesUI();saveConfig()">
      <div style="flex:1">
        <span style="font-size:13px;color:#e2e8f0;cursor:pointer" onclick="document.getElementById('coach-adv-${a.key}').click()">${a.label}</span>
        <div style="font-size:10px;color:var(--muted);margin-top:1px">${selfPlay
          ? 'A coach can play this on themselves.'
          : 'A coach can hold this but never use it on themselves. It is only worth anything in somebody else’s hands, so a coach who finds one decides which contestant to arm with it.'}</div>
        <div id="coach-adv-sources-${a.key}" style="display:${on ? 'flex' : 'none'};gap:4px;margin-top:3px;flex-wrap:wrap">
          ${Object.entries(ADV_SOURCE_LABELS).map(([src, lbl]) => `<label style="font-size:10px;color:var(--muted);display:flex;align-items:center;gap:2px;cursor:pointer;padding:1px 5px;border-radius:3px;border:1px solid var(--border);background:var(--surface2)${src === 'camp' ? '' : ';opacity:.5'}" title="${src === 'camp' ? '' : 'A coach has no journey, auction or exile leg — camp is the only place they can search.'}">
            <input type="checkbox" id="coach-adv-src-${a.key}-${src}" style="width:11px;height:11px" ${sources.includes(src) ? 'checked' : ''} ${src === 'camp' ? '' : 'disabled'} onchange="saveConfig()">
            <span>${lbl}</span>
          </label>`).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}

export function updateCoachesUI() {
  const mode = document.getElementById('cfg-coaches')?.value || 'disabled';
  const perTribeGrp = document.getElementById('coaches-per-tribe-group');
  const manualHint  = document.getElementById('coaches-manual-hint');
  const desc        = document.getElementById('coaches-desc');
  const advGrp      = document.getElementById('coaches-adv-group');
  if (perTribeGrp) perTribeGrp.style.display = mode === 'auto' ? 'block' : 'none';
  if (manualHint) manualHint.style.display = mode === 'manual' ? 'block' : 'none';
  if (advGrp) {
    advGrp.style.display = mode === 'disabled' ? 'none' : 'block';
    if (mode !== 'disabled') buildCoachAdvantageList();
  }
  if (desc) {
    const text = {
      'disabled': 'Disabled: No Coaches twist this season.',
      'manual':   'You choose who coaches by checking "Coach" on a player in the Cast Builder. A coach trains their tribe every pre-merge episode but never competes or votes, and is promoted to a full player at the merge.',
      'auto':     'Coaches are selected automatically, one to three per tribe — franchise winners and finalists (proxied by Returning Player status until real career fame is wired in).',
    };
    desc.textContent = text[mode] || '';
  }
}

/**
 * The castle's pact, chosen by hand.
 *
 * A mirror of the Mole picker: a portrait grid on the setup screen, capped at
 * the season's Traitor count. Selected names go on `seasonConfig.trChosenTraitors`
 * and tr-run.js hands them to the engine when the mode is 'choose'; leaving the
 * mode on 'random' ignores the list entirely and the castle draws its own.
 */
// Names from a PREVIOUS cast linger on the pact after the cast is changed: they
// have no chip left to unselect, so they silently eat pact slots and block
// picking anyone new (the reported bug — "can't select a third in a 3-Traitor
// season because a ghost from the old cast holds the slot"). Drop anybody who is
// not in the current cast. Returns whether anything changed.
function _pruneChosenTraitorsToCast() {
  if (!Array.isArray(seasonConfig.trChosenTraitors)) return false;
  if (typeof players === 'undefined' || !players.length) return false;
  const castNames = new Set(players.map(p => p.name));
  const before = seasonConfig.trChosenTraitors.length;
  seasonConfig.trChosenTraitors = seasonConfig.trChosenTraitors.filter(n => castNames.has(n));
  return seasonConfig.trChosenTraitors.length !== before;
}

export function toggleTraitorPlayer(name) {
  if (!seasonConfig.trChosenTraitors) seasonConfig.trChosenTraitors = [];
  // Clear stale names FIRST, before the cap check — otherwise a ghost from the
  // old cast keeps the pact at its cap and the click to add a new face no-ops.
  _pruneChosenTraitorsToCast();
  const cap = Math.max(2, Math.min(5,
    parseInt(document.getElementById('cfg-tr-traitor-count')?.value)
    || seasonConfig.traitorCount || 3));
  const idx = seasonConfig.trChosenTraitors.indexOf(name);
  if (idx >= 0) seasonConfig.trChosenTraitors.splice(idx, 1);
  else if (seasonConfig.trChosenTraitors.length < cap) seasonConfig.trChosenTraitors.push(name);
  updateTraitorPickerUI();
  saveConfig();
}

export function updateTraitorPickerUI() {
  const mode = document.getElementById('cfg-tr-traitor-mode')?.value || 'random';
  const grp  = document.getElementById('tr-traitor-choose-group');
  const desc = document.getElementById('tr-traitor-mode-desc');
  if (grp) grp.style.display = mode === 'choose' ? 'block' : 'none';
  // Drop any pact members left behind by a cast change, so the grid, the cap
  // and the description all reflect only names that still have a chip.
  _pruneChosenTraitorsToCast();
  const cap = Math.max(2, Math.min(5,
    parseInt(document.getElementById('cfg-tr-traitor-count')?.value)
    || seasonConfig.traitorCount || 3));
  // A count dropped below the pact trims the pact, not the other way round.
  if (Array.isArray(seasonConfig.trChosenTraitors) && seasonConfig.trChosenTraitors.length > cap) {
    seasonConfig.trChosenTraitors = seasonConfig.trChosenTraitors.slice(0, cap);
  }
  if (desc) {
    desc.textContent = mode === 'choose'
      ? `Tap up to ${cap} of the cast to make them Traitors. Any slots you leave, the castle fills in secret.`
      : 'The castle picks its own Traitors in secret.';
  }
  if (mode !== 'choose') return;
  const container = document.getElementById('tr-traitor-select');
  if (!container || typeof players === 'undefined' || !players.length) return;
  const selected = (seasonConfig.trChosenTraitors || []);
  container.innerHTML = players.map(p => {
    const sel = selected.includes(p.name);
    const slug = p.slug || p.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    const slugAv = playerAvatarUrl(p.name);
    const init = (p.name || '?')[0].toUpperCase();
    return `<div data-member="${p.name}" data-selected="${sel}" onclick="toggleTraitorPlayer('${p.name.replace(/'/g,"\\'")}')" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;width:48px">
      <div style="width:36px;height:36px;border-radius:50%;border:3px solid ${sel ? '#8f1a26' : 'transparent'};overflow:hidden;position:relative;background:var(--surface2);transition:border-color 0.15s">
        <img src="${slugAv}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;${sel ? '' : 'filter:grayscale(0.5);opacity:0.6;'}transition:filter 0.15s,opacity 0.15s" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
        <span style="display:none;font-size:14px;font-weight:700;color:var(--muted);align-items:center;justify-content:center;width:100%;height:100%;position:absolute;top:0;left:0">${init}</span>
      </div>
      <span style="font-size:9px;color:${sel ? '#c0392b' : 'var(--muted)'};text-align:center;line-height:1.1;max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color 0.15s">${p.name}</span>
    </div>`;
  }).join('');
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
  // ── SOMEBODY WHO IS NOT THERE YET IS NOT IN THE COUNT ──
  //
  // A late arrival is cast normally and held out of the roster until the
  // episode they walk in on, so the season genuinely starts one player
  // shorter. Counting them from episode one made the projection run a whole
  // episode long and every "N left" on the way down was one too many.
  //
  // They come back as a `return` on their own episode below, which is what
  // makes the arrival read the way it does on the schedule: fifteen left
  // before the vote and fifteen left after it, because one walked out of the
  // door and one walked in.
  const _lateArrivals = (seasonConfig.twistSchedule || [])
    .filter(t => t && t.type === 'late-arrival').length;
  const cast    = Math.max(2, (players.length || 18) - _lateArrivals);
  // A house ALWAYS ends at three, whatever the slider says.
  //
  // `houseFinaleSize()` returns 3 unconditionally because the last night is a
  // three-part Head of Household played from three and the week engine cannot
  // run a house of fewer than four — a configured final two is refused there.
  // This projection read the slider instead, so a season carrying finaleSize 2
  // drew one week too many, ending on a phantom eviction from three and a
  // finale starting from two. The engine would have stopped a week earlier; the
  // timeline was the thing that was wrong.
  const _isHouse = (typeof seasonFormat === 'function'
    ? seasonFormat(seasonConfig) : seasonConfig.format) === 'big-brother';
  const finale  = _isHouse ? 3 : (seasonConfig.finaleSize || 3);
  const mergeAt = seasonConfig.mergeAt || 12;
  // ── Total Drama's returns are Total Drama's ──
  //
  // The fan vote, the Aftermayhem winner and Rescue Island are camp mechanics.
  // No Big Brother module implements any of them — the house returns people
  // through the Battle Back and Camp Comeback and nothing else. But this
  // projection read them straight off `seasonConfig`, and those keys SURVIVE a
  // format change, so a house season inherited whatever the last camp season
  // was set to and projected returns that will never happen. A run with a fan
  // vote and an Aftermayhem carried over showed two houseguests walking back in
  // on the same night, out of nowhere, and the count was wrong from there on.
  const _isBB = (typeof seasonFormat === 'function'
    ? seasonFormat(seasonConfig.format) : seasonConfig.format) === 'big-brother';
  const riActive = seasonConfig.ri && !_isBB;

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

  // ── The Traitors: two leave a night, not one ──────────────────────────
  //
  // A castle has no tribes, no merge and no returns, so none of the Total
  // Drama / Big Brother machinery below applies to it — and its cadence is its
  // own. From the SECOND episode every night takes TWO: a banishment at the
  // Round Table and a murder in the dark. Episode one has no Round Table yet,
  // so it takes only the murder. A scheduled Double Murder takes a third body
  // while the castle is still big enough to support it (the same 8-alive gate
  // pickVariant reads in js/tr/murder-variants.js). The generic projection
  // counts one a night and would draw a castle nearly twice its real length,
  // every "N left" wrong from episode two down — which is what the scheduler
  // was showing. The season ends when the room is down to the endgame.
  const _fmt = (typeof seasonFormat === 'function' ? seasonFormat(seasonConfig) : seasonConfig.format);
  if (_fmt === 'traitors') {
    // ── ONCE PLAYED, READ THE REAL NIGHT, NOT A GUESS ───────────────────
    //
    // A castle is decided in one call and its rows are queued, so after the
    // season has run the true count is ON the rows: each carries `exits`, the
    // people it actually removed. A random Double took three, a Recruitment
    // took one, a Shield blocked a murder — the projection below cannot see any
    // of those because they are rolled, not scheduled, and that is exactly the
    // "N left doesn't update with the twist" gap. So if the season exists, the
    // timeline reports what happened; the projection is only for the setup
    // screen, before a single night has been decided.
    const _trRows = [...(gs && gs.episodeHistory || []), ...(gs && gs._trQueue || [])]
      .filter(r => r && r.num != null && r.format === 'traitors')
      .sort((a, b) => a.num - b.num);
    if (_trRows.length) {
      const trEps = [];
      let live = cast;
      for (const r of _trRows) {
        trEps.push({ ep: r.num, active: live, phase: 'pre-merge',
          engineType: twistMap[r.num] || null });
        live = Math.max(0, live - ((r.exits || []).length));
      }
      trEps.push({ ep: (_trRows[_trRows.length - 1].num || 0) + 1,
        active: live, phase: 'finale', engineType: null });
      return trEps;
    }

    // ── WHY A BUDGET AND NOT A FLAT TWO A NIGHT ─────────────────────────
    //
    // A banishment happens EVERY episode from the second (episode one has no
    // Round Table). A murder happens most nights but not all: the Traitors
    // sometimes recruit instead of kill, a Shield can block one, and the
    // endgame is banishment-only. Measured over 20 seeds at five cast sizes,
    // the murders that land in episodes 2+ come to almost exactly `cast/2 - 3`,
    // and they cluster EARLY — the banishment-only nights are the endgame tail.
    // A flat two-a-night drew the season a episode or two short of its real
    // median every time; this spends a murder budget down the early rounds and
    // lets the tail run on banishments alone, which lands on the measured
    // median (episodes ~= cast/2 - endgame + 3) for casts of 14 to 22.
    //
    // No projection can be exact — an individual castle runs anywhere from
    // `cast/2 - 2` to `cast - endgame` episodes depending on how many murders
    // land — so this targets the typical season. A twist scheduled on an
    // episode a short season never reaches simply never fires; pickVariant only
    // ever reads the episodes that happen.
    const trEps = [];
    const endgame = Math.max(2, seasonConfig.finaleSize || 3);
    let murderBudget = Math.max(0, Math.round(cast / 2) - 3); // murders in ep >= 2
    let trActive = cast;
    let trEp = 1;
    while (trActive > endgame && trEp <= 100) {
      const isDouble = (seasonConfig.twistSchedule || [])
        .some(t => t && Number(t.episode) === trEp && t.type === 'tr-double-murder');
      // A pinned Recruitment night makes no body — the pact recruits instead of
      // kills — so that night removes only the banished (one elimination, not
      // two). Episode one is always a murder (recruitment cannot run before a
      // Traitor has been banished), so it is exempt.
      const isRecruit = trEp !== 1 && (seasonConfig.twistSchedule || [])
        .some(t => t && Number(t.episode) === trEp && t.type === 'tr-recruitment');
      trEps.push({ ep: trEp, active: trActive, phase: 'pre-merge',
        engineType: twistMap[trEp] || null });
      // Episode one: the murder, no banishment. Every later night banishes.
      let toll = trEp === 1 ? 0 : 1;
      // A murder on top, while budget and room remain (kept clear of the
      // endgame so the tail stays banishment-only, as the real seasons do) —
      // unless a Recruitment is pinned here, in which case nobody is murdered.
      const canMurder = trEp === 1
        || (!isRecruit && murderBudget > 0 && trActive - toll - 1 >= endgame);
      if (canMurder) {
        toll += 1;
        if (trEp !== 1) murderBudget -= 1;
        // The Double's second body, when the castle is still big enough for the
        // shape to run at all (murder-variants' 8-alive gate) and it does not
        // spend the room past the endgame.
        if (isDouble && trActive >= 8 && trActive - toll - 1 >= endgame) toll += 1;
      }
      trActive = Math.max(endgame, trActive - toll);
      trEp++;
    }
    trEps.push({ ep: trEp, active: endgame, phase: 'finale', engineType: null });
    return trEps;
  }

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
  // Camp Comeback fills by evictions, not by weeks. See the returns block.
  let _campStartElims = null;
  let _campStartEp = 0;
  let _campReturnUsed = false;

  // What the episode just pushed actually removed — see the extra-night note.
  let _lastElims = 1;
  while (active > finale && ep <= 100) {
    // EPISODE 4 IS EPISODE 4. The schedule is keyed by episode number and
    // nothing shifts it: whatever the author put on a night is what that night
    // runs, however the ones before it turned out.
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
    // ── Big Brother ──
    //
    // Every twist above is a Total Drama one, so this projection assumed a
    // house evicts exactly one person a week no matter what was scheduled: a
    // Split House week showed 16 left going to 15 when two houseguests walk
    // out the same night, and every episode after it was off by one for the
    // rest of the season. The season-shape panel in bb-run.js already counts
    // both of these; the timeline never learned.
    //
    // Both really do take two. A double eviction runs a second cycle in all
    // three of its styles, and a Split House evicts one houseguest from each
    // side on the same night.
    // Nobody leaves. Declared here as well as in the contract because this
    // projection reads twist IDs rather than resolved rules — the same reason
    // the double eviction and the Split House are both listed by name.
    if (_allTypes.includes('bb-no-eviction')) elims = 0;
    if (_allTypes.includes('bb-double-eviction')) elims = Math.max(elims, 2);
    if (_allTypes.includes('bb-triple-eviction')) elims = Math.max(elims, 3);
    // The Camp Director takes TWO on night one, and this projection was
    // counting one. Hit The Road evicts the slowest of the four banished
    // before a Head of Household has even been crowned, and then the week
    // runs its ordinary nomination, veto and vote on top of that. On a cast of
    // nineteen the timeline said eighteen were left at episode two when the
    // engine really had seventeen, and every house-size projection below it
    // inherited the error.
    //
    // The guard mirrors the engine exactly: runCampDirector stands down
    // under eight (four banished out of a house that still has a season to
    // play), and the dispatch in week.js is week one only.
    if (_allTypes.includes('bb-camp-director') && ep === 1 && active >= 8) {
      elims = Math.max(elims, 2);
    }
    // You Go, They Go takes two as well — one voted out and one chained to
    // them. The guard mirrors the engine's: four nominees, a Head of Household
    // and a room left to vote need eight houseguests, and below that the week
    // stands down to an ordinary one rather than running badly.
    if (_allTypes.includes('bb-duo-week') && active >= 8) elims = Math.max(elims, 2);
    // The Split House stands down rather than running badly, and the projection
    // has to stand down with it or it is wrong in the other direction — the
    // guard here mirrors `splitPossible` in bb-run.js exactly: ten houseguests
    // (two sides of five, each needing an HOH, two nominees and somebody left
    // to vote), no second cycle already scheduled, and no three-nominee mode.
    if (_allTypes.includes('bb-split-house')
        && active >= 10
        && !_allTypes.includes('bb-double-eviction')
        && !_allTypes.includes('bb-triple-eviction')
        && !_allTypes.includes('bb-instant-eviction')
        && !(seasonConfig.bbSafetyMode && seasonConfig.bbSafetyMode !== 'off')) {
      elims = Math.max(elims, 2);
    }
    // Exile Duel: person goes to exile (0 elims this ep) — duel happens next episode (1 elim)
    if (_allTypes.includes('exile-duel')) elims = 0;
    _totalElimsToHere += elims;
    let returns = _allTypes.includes('second-chance') ? 1 : 0;
    // The one who was held back walks in on this episode. Counted as a return
    // because that is exactly what it is to the numbers.
    if (_allTypes.includes('late-arrival')) returns += 1;

    // ── Big Brother sends people back too ──
    //
    // The BB block above only ever ADDS evictions, so both of the twists whose
    // whole point is a returning houseguest were invisible to the projection.
    // A Battle Back week showed 12 left going to 11 when the eviction and the
    // re-entry cancel out, and every week after it was off by one for the rest
    // of the season — the same fault the Split House had, in the other
    // direction.
    //
    // Battle Back: the eviction still happens and then one evictee walks back
    // in at the close of the same week. Net zero.
    if (_allTypes.includes('bb-battle-back')) returns += 1;

    // Camp Comeback: the campers are the NEXT FOUR evicted, counted from this
    // week inclusive, and the return runs on the night the fourth arrives —
    // not on the week the twist was scheduled. So it is counted in evictions
    // rather than in weeks, which is what makes it survive a double eviction
    // filling the camp early.
    if (_allTypes.includes('bb-camp-comeback') && _campStartElims === null) {
      _campStartElims = _totalElimsToHere - elims;
      _campStartEp = ep;
    }
    if (_campStartElims !== null && !_campReturnUsed
        && _totalElimsToHere - _campStartElims >= 4
        // The twist runs for four weeks. A camp that never fills inside its
        // window returns nobody, and projecting a return anyway would be wrong
        // in exactly the way this is fixing.
        && ep <= _campStartEp + 3) {
      returns += 1;
      _campReturnUsed = true;
    }
    const _rpTwist = (seasonConfig.twistSchedule||[]).filter(t => t && Number(t.episode) === ep).find(t => t.type === 'returning-player');
    if (_rpTwist) returns += (_rpTwist.returnCount || 1);
    // Fan vote return: pending return from live game adds +1 this episode
    if (!_isBB && gs?.pendingFanVoteReturn && gs.eliminated?.includes(gs.pendingFanVoteReturn) && !_fvReturnApplied) {
      returns++; _fvReturnApplied = true;
    }
    // Fan vote prediction: ONCE after X total eliminations, someone comes back NEXT episode
    const _fvThresholdCfg = _isBB ? 0 : (parseInt(seasonConfig.fanVoteFrequency) || 0);
    if (_fvThresholdCfg && !_lastFVReturn && _totalElimsToHere >= _fvThresholdCfg) {
      _lastFVReturn = _totalElimsToHere;
    }
    // Apply the return on the episode AFTER the fan vote fired
    if (_lastFVReturn && _lastFVReturn !== _totalElimsToHere && !_fvReturnApplied) {
      returns++; _fvReturnApplied = true;
    }
    // Aftermayhem prediction: ONCE after X total eliminations, winner comes back NEXT episode
    const _amThresholdCfg = _isBB ? 0 : (parseInt(seasonConfig.aftermayhemReturn) || 0);
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
    _lastElims = elims;
    ep++;

    // ── THE EXTRA NIGHT, COUNTED ONCE ────────────────────────────────
    //
    // A cancelled elimination means the season needs one more night to reach
    // the finale. There are two ways that becomes visible here and they used
    // to BOTH fire for a scheduled Elimination Swap: `elims = 0` above already
    // makes the loop take an extra turn, and then this pushed another episode
    // on top. Before simulating, only the first applied and the timeline was
    // right; afterwards both did, and an empty episode appeared with every
    // later twist pushed down a slot. That is the reported "episode 4 acts as
    // empty and episode 5 acts with episode 4's twists".
    //
    // So this is for the case it was written for and named after: a Team Swap
    // ADVANTAGE, which is played rather than scheduled. Nothing on the plan
    // predicted it, `elims` was 1, and this is the only thing that can model
    // the night it cost. When the schedule already said nobody would leave,
    // the turn above has counted it.
    if (_lastElims > 0 && gs?.skippedEliminationEps?.includes(ep - 1) && active > finale) {
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

// ── Big Brother: pinning a competition to a week ──────────────────────
//
// The library picks weighted-at-random, which is the right default for a
// season you want to be surprised by and the wrong one for a season you are
// booking. These two dropdowns sit on every Big Brother week in the timeline
// and write `seasonConfig.bbCompSchedule`, which bb-run hands to the engine as
// `forcedCompetitions`.
//
// HOH and veto are separate pickers on purpose. They are not interchangeable
// slots — OTEV and Hide and Go Veto are veto-only, the Wall and the Pressure
// Cooker cannot run as a veto — so each list is filtered to what can legally
// serve that slot and an illegal week is simply not authorable.

/** The pinned entry for a week, or undefined. */
function _bbCompEntry(ep) {
  return (seasonConfig.bbCompSchedule || []).find(c => c && Number(c.episode) === Number(ep));
}

export function _setBBComp(ep, slot, compId) {
  if (!seasonConfig.bbCompSchedule) seasonConfig.bbCompSchedule = [];
  let entry = _bbCompEntry(ep);
  if (!entry) {
    entry = { episode: Number(ep) };
    seasonConfig.bbCompSchedule.push(entry);
  }
  if (compId) entry[slot] = compId;
  else delete entry[slot];
  // A week with nothing pinned carries no entry, so a cleared picker leaves no
  // residue in the saved config.
  if (!entry.hoh && !entry.veto) {
    seasonConfig.bbCompSchedule = seasonConfig.bbCompSchedule.filter(c => c !== entry);
  }
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

/**
 * The finale's two pickers.
 *
 * Stored on their own config key rather than in `bbCompSchedule`, which is
 * keyed by episode number: the finale's number moves whenever the cast size or
 * the eviction schedule changes, so a pin filed against it would quietly become
 * a pin on an ordinary week. There is only ever one finale, so it does not need
 * an index.
 *
 * Part three takes no picker. It is the jury quiz every season — that is the
 * format, not a default.
 */
export function _setBBFinalComp(role, compId) {
  seasonConfig.bbFinalComps = { ...(seasonConfig.bbFinalComps || {}) };
  if (compId) seasonConfig.bbFinalComps[role] = compId;
  else delete seasonConfig.bbFinalComps[role];
  if (!seasonConfig.bbFinalComps.one && !seasonConfig.bbFinalComps.two) {
    delete seasonConfig.bbFinalComps;
  }
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

function _bbFinalCompPicker(role, slot, label) {
  const list = (typeof bbCompetitionsForSlot !== 'undefined' ? bbCompetitionsForSlot(slot) : []) || [];
  if (!list.length) return '';
  const chosen = (seasonConfig.bbFinalComps || {})[role] || '';
  const pinned = !!chosen;
  // Reads the WEEKS as well as the other finale part. Staging Part Two with the
  // competition week six already ran is the clash most worth catching, and it
  // was the one nothing could see.
  const used = _bbPinnedIndex({ skipRole: role });
  const clash = pinned && used.has(chosen);
  let h = `<label style="display:flex;align-items:center;gap:4px;flex:1 1 100%;min-width:0;font-size:9.5px;letter-spacing:.5px;color:${
    pinned ? '#a5b4fc' : 'var(--muted,#7d8590)'}" title="${
    clash ? `Also pinned to ${used.get(chosen).join(', ')}`
    : pinned ? 'Pinned — the finale runs exactly this competition' : 'Auto — the library picks, weighted'}"><span style="flex:0 0 auto">${label}${clash ? ' <span style="color:#f59e0b">&#8226;</span>' : ''}</span>`;
  h += `<select onchange="event.stopPropagation();_setBBFinalComp('${role}',this.value)" onclick="event.stopPropagation()" style="font-size:10px;background:#1e1e2e;color:${
    clash ? '#f7c873' : pinned ? '#cdd6f4' : '#8b949e'};border:1px solid ${
    clash ? 'rgba(245,158,11,0.7)' : `rgba(99,102,241,${pinned ? '0.55' : '0.22'})`};border-radius:3px;padding:1px 2px;flex:1 1 auto;min-width:0;max-width:100%">`;
  h += `<option value="" ${!chosen ? 'selected' : ''}>Auto</option>`;
  // Two "The Wall"s exist — the recurring endurance comp and the set piece
  // written for finale night — and a dropdown with the same word twice in it is
  // a dropdown you cannot use. The category disambiguates every collision the
  // library can produce without renaming anything.
  const seen = {};
  list.forEach(c => { seen[c.name] = (seen[c.name] || 0) + 1; });
  const opt = c => `<option value="${c.id}" ${c.id === chosen ? 'selected' : ''}>${
    c.name}${seen[c.name] > 1 ? ` · ${c.finalRole ? 'finale set piece' : c.category}` : ''}${_bbUsedTag(used, c.id, chosen)}</option>`;
  const usual = list.filter(c => !c.generic);
  const rest = list.filter(c => c.generic);
  if (usual.length) {
    h += `<optgroup label="${role === 'one' ? 'Usually Part One' : 'Usually Part Two'}">`;
    usual.forEach(c => { h += opt(c); });
    h += `</optgroup>`;
  }
  if (rest.length) {
    h += `<optgroup label="Anything else the night can run">`;
    rest.forEach(c => { h += opt(c); });
    h += `</optgroup>`;
  }
  return h + `</select></label>`;
}

/**
 * The stat family a competition asks for most.
 *
 * Categories describe the prop (a puzzle can still be physical); this reads
 * the declared scoring weights instead, so the picker answers the question a
 * season planner actually has: who is this competition built to favour?
 */
export function _bbCompFocus(comp) {
  const stats = comp?.stats || {};
  const ranked = Object.entries(stats)
    .map(([stat, weight]) => [stat, Number(weight) || 0])
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1]);
  const [first, second] = ranked;
  if (!first || first[1] <= 0) return 'specialty';
  // No family clearly owns the result: show it as balanced instead of making
  // a 0.01 difference look like a meaningful design decision.
  if (first[1] < 0.28 || first[1] - (second?.[1] || 0) < 0.04) return 'balanced';
  return _BB_FOCUS_META[first[0]] ? first[0] : 'specialty';
}

const _BB_FOCUS_META = {
  balanced: { label: 'Balanced', short: 'BAL' },
  endurance: { label: 'Endurance focus', short: 'END' },
  temperament: { label: 'Temperament focus', short: 'TMP' },
  physical: { label: 'Physical focus', short: 'PHY' },
  boldness: { label: 'Boldness focus', short: 'BLD' },
  mental: { label: 'Mental focus', short: 'MEN' },
  intuition: { label: 'Intuition focus', short: 'INT' },
  social: { label: 'Social focus', short: 'SOC' },
  strategic: { label: 'Strategic focus', short: 'STR' },
  specialty: { label: 'Specialty / chance', short: 'SPC' },
};

/** One slot's dropdown, listing only what can serve it. */
/**
 * Everywhere a competition is already pinned this season.
 *
 * Two pickers write two different places — `bbCompSchedule` for the weeks,
 * `bbFinalComps` for finale night — and neither has ever read the other, or
 * even itself. So there was no way to tell that the competition you were about
 * to pin to week nine is the one already running in week four, short of opening
 * every dropdown in the timeline and remembering what you saw.
 *
 * Returns compId -> ['wk 4 HOH', 'Finale P2'], with the slot you are currently
 * editing left out — otherwise every pinned picker reports itself as a clash.
 */
export function _bbPinnedIndex({ skipEp = null, skipSlot = null, skipRole = null } = {}) {
  const used = new Map();
  const add = (id, where) => {
    if (!id) return;
    if (!used.has(id)) used.set(id, []);
    used.get(id).push(where);
  };
  for (const entry of seasonConfig.bbCompSchedule || []) {
    const ep = Number(entry?.episode);
    for (const slot of ['hoh', 'veto']) {
      if (skipEp === ep && skipSlot === slot) continue;
      add(entry?.[slot], `wk ${ep} ${slot.toUpperCase()}`);
    }
  }
  const fin = seasonConfig.bbFinalComps || {};
  for (const role of ['one', 'two']) {
    if (skipRole === role) continue;
    add(fin[role], `Finale P${role === 'one' ? '1' : '2'}`);
  }
  return used;
}

/**
 * " · in wk 4 HOH", or nothing.
 *
 * NEVER on the option that is currently selected. A `<select>` renders its
 * chosen option's text in the closed control, so tagging that one put "Get A
 * Grip · END — already wk 15 HOH" inside a 205px box and the timeline filled up
 * with truncated amber sentences. The closed control says which competition is
 * pinned; the amber border and the dot on the label say it clashes; the tooltip
 * says where. The suffix belongs in the OPEN list, where you are choosing.
 */
export const _bbUsedTag = (used, id, chosen = null) => {
  if (!id || id === chosen) return '';
  const at = used.get(id);
  if (!at?.length) return '';
  return ` · in ${at.slice(0, 2).join(', ')}${at.length > 2 ? ` +${at.length - 2}` : ''}`;
};

// ── The castle's mission, pinned to an episode ────────────────────────
//
// A castle runs one mission an afternoon, so unlike a Big Brother competition
// (which is one slot of several) this is a single dropdown, shown on every
// castle episode. 'Auto' lets the estate draw its own; pinning one forces it
// when it is eligible that day (js/tr/missions.js runMission), and an
// ineligible pin quietly falls back to a random afternoon.
function _trMissionEntry(ep) {
  return (seasonConfig.trMissionSchedule || []).find(t => t && Number(t.episode) === Number(ep));
}

function _trMissionPicker(ep) {
  const cat = (typeof TR_MISSION_CATALOG !== 'undefined' ? TR_MISSION_CATALOG : []) || [];
  if (!cat.length) return '';
  const chosen = _trMissionEntry(ep)?.missionId || '';
  const pinned = !!chosen;
  let h = `<label style="display:flex;align-items:center;gap:4px;flex:1 1 100%;min-width:0;font-size:9.5px;letter-spacing:.5px;color:${
    pinned ? '#d4b45f' : 'var(--muted,#7d8590)'}" title="${
    pinned ? 'Pinned — this afternoon runs exactly this mission' : 'Auto — the castle draws its own mission'
  }"><span style="flex:0 0 auto">Mission</span>`;
  h += `<select onchange="event.stopPropagation();_setTrMission(${ep},this.value)" onclick="event.stopPropagation()" style="font-size:10px;background:#1e1e2e;color:${
    pinned ? '#e8d5a8' : '#8b949e'};border:1px solid rgba(201,162,74,${pinned ? '0.55' : '0.22'});border-radius:3px;padding:1px 2px;flex:1 1 auto;min-width:0;max-width:100%">`;
  h += `<option value="" ${!chosen ? 'selected' : ''}>Auto</option>`;
  const bespoke = cat.filter(m => m.kind === 'bespoke');
  const generic = cat.filter(m => m.kind !== 'bespoke');
  if (bespoke.length) {
    h += `<optgroup label="Bespoke &middot; ${bespoke.length}">`;
    bespoke.forEach(m => { h += `<option value="${m.id}" ${m.id === chosen ? 'selected' : ''}>${m.name}</option>`; });
    h += `</optgroup>`;
  }
  if (generic.length) {
    h += `<optgroup label="Classic &middot; ${generic.length}">`;
    generic.forEach(m => { h += `<option value="${m.id}" ${m.id === chosen ? 'selected' : ''}>${m.name}</option>`; });
    h += `</optgroup>`;
  }
  h += `</select></label>`;
  return h;
}

/**
 * "Shield" on this afternoon — the mission route, per episode.
 *
 * The Armoury is a TWIST (pin it from the twist catalogue like any other); a
 * mission-won Shield is not a twist, it is a property of that day's mission, so
 * it lives here beside the mission dropdown as a tickbox. Ticked, that
 * afternoon runs a mission that carries a Shield and somebody is seen taking
 * it — which is the whole difference from the Armoury, where the room only
 * learns who walked in.
 */
function _trShieldTicked(ep) {
  return (seasonConfig.trShieldEpisodes || []).some(e => Number(e) === Number(ep));
}

function _trShieldTick(ep) {
  const on = _trShieldTicked(ep);
  return `<label style="display:flex;align-items:center;gap:4px;flex:0 0 auto;font-size:9.5px;letter-spacing:.5px;cursor:pointer;color:${
    on ? '#d4b45f' : 'var(--muted,#7d8590)'}" title="${
    on ? 'This afternoon’s mission carries a shield — the winner is seen taking it'
      : 'Tick to put a shield in this afternoon’s mission'
  }" onclick="event.stopPropagation()">`
    + `<input type="checkbox" ${on ? 'checked' : ''} style="width:11px;height:11px;margin:0;accent-color:#c9a24a"`
    + ` onchange="event.stopPropagation();_setTrShield(${ep},this.checked)">`
    + `<span>Shield</span></label>`;
}

export function _setTrShield(ep, on) {
  if (!Array.isArray(seasonConfig.trShieldEpisodes)) seasonConfig.trShieldEpisodes = [];
  const n = Number(ep);
  seasonConfig.trShieldEpisodes = seasonConfig.trShieldEpisodes.filter(e => Number(e) !== n);
  if (on) seasonConfig.trShieldEpisodes.push(n);
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

export function _setTrMission(ep, missionId) {
  if (!seasonConfig.trMissionSchedule) seasonConfig.trMissionSchedule = [];
  let entry = _trMissionEntry(ep);
  if (!entry) { entry = { episode: Number(ep) }; seasonConfig.trMissionSchedule.push(entry); }
  if (missionId) entry.missionId = missionId;
  else seasonConfig.trMissionSchedule = seasonConfig.trMissionSchedule.filter(c => c !== entry);
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

function _bbCompPicker(ep, slot, label) {
  const list = (typeof bbCompetitionsForSlot !== 'undefined' ? bbCompetitionsForSlot(slot) : []) || [];
  if (!list.length) return '';
  const chosen = _bbCompEntry(ep)?.[slot] || '';
  const pinned = !!chosen;
  const used = _bbPinnedIndex({ skipEp: Number(ep), skipSlot: slot });
  // Pinned to something another week is already running. Not blocked — a
  // deliberate repeat is a legitimate thing to want — but never silent.
  const clash = pinned && used.has(chosen);
  // `flex:1 1 100%` and `min-width:0`, or it does not fit the card it lives in.
  // The select carried a fixed 205px max-width inside a column narrower than
  // that, and a flex child will not shrink below its content without an
  // explicit `min-width:0` — so a pinned row simply hung over the right-hand
  // edge of the episode. Invisible while the border was dim; obvious the moment
  // a clash painted it amber, which is how it got noticed.
  let h = `<label style="display:flex;align-items:center;gap:4px;flex:1 1 100%;min-width:0;font-size:9.5px;letter-spacing:.5px;color:${
    pinned ? '#a5b4fc' : 'var(--muted,#7d8590)'}" title="${
    clash ? `Also pinned to ${used.get(chosen).join(', ')}`
    : pinned ? 'Pinned — this week runs exactly this competition' : 'Auto — the library picks, weighted'}"><span style="flex:0 0 auto">${label}${clash ? ' <span style="color:#f59e0b">&#8226;</span>' : ''}</span>`;
  h += `<select onchange="event.stopPropagation();_setBBComp(${ep},'${slot}',this.value)" onclick="event.stopPropagation()" style="font-size:10px;background:#1e1e2e;color:${
    clash ? '#f7c873' : pinned ? '#cdd6f4' : '#8b949e'};border:1px solid ${
    clash ? 'rgba(245,158,11,0.7)' : `rgba(99,102,241,${pinned ? '0.55' : '0.22'})`};border-radius:3px;padding:1px 2px;flex:1 1 auto;min-width:0;max-width:100%">`;
  h += `<option value="" ${!chosen ? 'selected' : ''}>Auto</option>`;
  const written = list.filter(c => !c.generic);
  const generic = list.filter(c => c.generic);
  const order = ['balanced', 'endurance', 'temperament', 'physical', 'boldness',
    'mental', 'intuition', 'social', 'strategic', 'specialty'];
  const grouped = Object.fromEntries(order.map(f => [f, []]));
  written.forEach(c => grouped[_bbCompFocus(c)].push(c));
  for (const focus of order) {
    const comps = grouped[focus];
    if (!comps.length) continue;
    const meta = _BB_FOCUS_META[focus];
    h += `<optgroup label="${meta.label} · ${comps.length}">`;
    comps.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
      h += `<option value="${c.id}" ${c.id === chosen ? 'selected' : ''}>${c.name} · ${meta.short}${_bbUsedTag(used, c.id, chosen)}</option>`;
    });
    h += `</optgroup>`;
  }
  if (generic.length) {
    // Suffixed, not just grouped. One generic fallback shares a name with a
    // written comp ("Before or After"), and an optgroup only disambiguates
    // while the list is OPEN — closed, both read identically and you cannot
    // tell which one the week is pinned to.
    h += `<optgroup label="Generic fallbacks">`;
    generic.forEach(c => { h += `<option value="${c.id}" ${c.id === chosen ? 'selected' : ''}>${c.name} (generic)${_bbUsedTag(used, c.id, chosen)}</option>`; });
    h += `</optgroup>`;
  }
  return h + `</select></label>`;
}

export function renderTimeline() {
  const container = document.getElementById('fd-timeline');
  if (!container) return;
  // A theme that was picked but never stamped gets stamped here.
  //
  // Stamping used to happen ONLY on the picker's change event, which quietly
  // meant it never happened at all for the two cases that matter most: a season
  // whose theme was saved before stamping existed, and any config restored on
  // page load. The theme was set, the arc was nowhere, and the timeline showed
  // an empty season with no way to tell why.
  //
  // Only ever fills a gap — never re-stamps. Once the cards are down they are
  // the user's, and "reset to the theme's own schedule" is the way back.
  try {
    if (typeof currentTheme === 'function' && currentTheme()
        && !themeArcIsStamped()
        && (typeof players !== 'undefined' && players.length)) {
      stampThemeArc(players.length);
      localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
    }
  } catch (e) { /* an unthemed season draws as it always did */ }
  const epMap   = buildEpisodeMap();
  const schedule = (seasonConfig.twistSchedule || []).filter(Boolean);
  const isHouse = (typeof seasonFormat !== 'undefined' ? seasonFormat(seasonConfig) : seasonConfig.format) === 'big-brother';

  if (!epMap.length) {
    container.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:13px">Add players in Cast Builder to generate timeline.</div>';
    return;
  }

  // Where the house's season turns.
  //
  // A Big Brother season has no merge — there are no tribes to dissolve — so
  // the timeline was stamping MERGE on a week that means nothing, purely
  // because the episode map is shared with Total Drama and hands every season a
  // pre/post split. What the house actually turns on is the jury opening: the
  // night the person evicted stops going home and starts deciding the winner.
  //
  // `houseStructure()` puts that at jurySize + 2 remaining — the jury is the
  // last `jurySize` people out and the houseguest cut at the final three is one
  // of them, so the rest come from the weekly evictions. Same arithmetic here,
  // and it stays null when the season is playing without a jury.
  const juryOpensAt = isHouse && Number(seasonConfig.jurySize) > 0
    ? Number(seasonConfig.jurySize) + 2
    : null;

  let html = '';
  epMap.forEach(({ ep, active, phase }) => {
    const isFinale   = phase === 'finale';
    const isMergeEp  = !isHouse && phase === 'post-merge'
      && epMap.find(e => e.ep === ep - 1)?.phase === 'pre-merge';
    const isJuryEp   = juryOpensAt !== null && active === juryOpensAt && !isFinale;
    const isSelected = selectedEpisodes.has(ep);
    const twists     = schedule.filter(t => Number(t.episode) === ep);
    const twistTags  = twists.map(t => {
      const cat = TWIST_CATALOG.find(c => c.id === t.type);
      if (t.type === 'returning-player') {
        const rc = t.returnCount || 1;
        const reasons = t.returnReasons || ['random'];
        const reasonOpts = ['random','unfinished-business','entertainment','strategic-threat','underdog'];
        const reasonLabels = { 'random':'Random', 'unfinished-business':'Unfinished Business', 'entertainment':'Entertainment', 'strategic-threat':'Strategic Threat', 'underdog':'Underdog' };
        let configHtml = `<select onchange="event.stopPropagation();updateTwist('${t.id}','returnCount',+this.value)" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%">`;
        for (let n = 1; n <= 3; n++) configHtml += `<option value="${n}" ${n===rc?'selected':''}>${n}</option>`;
        configHtml += `</select>`;
        for (let s = 0; s < rc; s++) {
          configHtml += `<select onchange="event.stopPropagation();_updateReturnReason('${t.id}',${s},this.value)" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:2px;min-width:0;max-width:100%" title="Slot ${s+1} reason">`;
          reasonOpts.forEach(r => configHtml += `<option value="${r}" ${reasons[s]===r?'selected':''}>${reasonLabels[r]}</option>`);
          configHtml += `</select>`;
        }
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${configHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      // The chain's own two questions, offered wherever a chain can be booked:
      // on its own, or as the back half of a double or a triple.
      const _chainSelects = (t2) => {
        const starts = { 'safety-comp': 'Safety Comp starts it', hoh: 'HOH starts it' };
        const ends = { canada: 'Canada — house votes', quebec: 'Québec — duel decides' };
        const sel = (key, opts, cur, title) => {
          let h = `<select onchange="event.stopPropagation();updateTwist('${t2.id}','${key}',this.value)" onclick="event.stopPropagation()" title="${title}" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%">`;
          Object.entries(opts).forEach(([k, label]) => { h += `<option value="${k}" ${k === cur ? 'selected' : ''}>${label}</option>`; });
          return h + '</select>';
        };
        return sel('chainStart', starts, t2.chainStart || 'safety-comp', 'Who holds the first link')
          + sel('chainStyle', ends, t2.chainStyle || 'canada', 'How the chain ends');
      };
      // WHO walks in, and WHICH camp. Both authored on the scheduled entry,
      // because a late arrival with neither chosen is a twist that quietly
      // picks somebody for you.
      if (t.type === 'late-arrival') {
        const roster = (players || []).map(p2 => p2.name);
        const tribes = (gs?.tribes || []).map(x => x.name).filter(Boolean);
        const who = t.arrival && roster.includes(t.arrival) ? t.arrival : '';
        const camps = { smallest: 'Smallest tribe', other: 'The tribe they were not cast on', own: 'Their own tribe' };
        tribes.forEach(n => { camps[n] = n; });
        const cur = t.arrivalTribe || 'smallest';
        const box = (key, opts, sel, title, blank) => {
          let h = `<select onchange="event.stopPropagation();updateTwist('${t.id}','${key}',this.value)" onclick="event.stopPropagation()" title="${title}" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%">`;
          if (blank) h += `<option value="" ${sel ? '' : 'selected'}>${blank}</option>`;
          for (const [k, label] of Object.entries(opts)) {
            h += `<option value="${k}" ${k === sel ? 'selected' : ''}>${label}</option>`;
          }
          return h + '</select>';
        };
        const cfg = box('arrival', Object.fromEntries(roster.map(n => [n, n])), who,
          'Who is held back and walks in later', 'Pick a player')
          + box('arrivalTribe', camps, cur, 'Which camp they walk into');
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${cfg} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'bb-double-eviction') {
        const styles = {
          'fast-forward': 'Fast-Forward (live hour)',
          'double-vote': 'Double Vote (one vote, two leave)',
          'week-in-one': 'Two Weeks in One',
          // How Big Brother Canada actually ran its Chain of Safety: as the
          // second half of a double eviction night.
          'chain': 'Chain of Safety (second cycle)',
        };
        const cur = t.deStyle || 'fast-forward';
        let styleHtml = `<select onchange="event.stopPropagation();updateTwist('${t.id}','deStyle',this.value)" onclick="event.stopPropagation()" title="How the double eviction runs" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%">`;
        Object.entries(styles).forEach(([k, label]) => { styleHtml += `<option value="${k}" ${k===cur?'selected':''}>${label}</option>`; });
        styleHtml += `</select>`;
        // Same for a double whose second cycle IS a chain.
        if (cur === 'chain') styleHtml += _chainSelects(t);
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${styleHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      // Same control as the double's, because a triple is a shape of night
      // rather than a bigger number: two fast-forwards is BB22, one live cycle
      // that takes two is Big Brother Canada's.
      // Who starts the chain, and how it ends — two different questions, two
      // documented answers each.
      if (t.type === 'bb-chain-of-safety') {
        const cfg = _chainSelects(t);
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${cfg} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'bb-triple-eviction') {
        const tStyles = {
          'fast-forward': 'Two Fast-Forwards (BB22)',
          'double-vote': 'One Vote, Two Leave (Canada)',
          'chain': 'Last Cycle is a Chain',
        };
        const tCur = t.teStyle || 'fast-forward';
        let tHtml = `<select onchange="event.stopPropagation();updateTwist('${t.id}','teStyle',this.value)" onclick="event.stopPropagation()" title="How the triple eviction runs" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%">`;
        Object.entries(tStyles).forEach(([k, label]) => { tHtml += `<option value="${k}" ${k === tCur ? 'selected' : ''}>${label}</option>`; });
        tHtml += `</select>`;
        // A night that ENDS on a chain gets the chain's own two questions too,
        // or there is no way to ask for the Québec ending from in here.
        if (tCur === 'chain') tHtml += _chainSelects(t);
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${tHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'bb-battle-back') {
        // Two aired shapes plus the competition it is fought on. The comp list
        // is deliberately wider than an HOH or veto picker — see
        // bbCompetitionsForSlot('battle-back').
        // ── STACKED, NOT STRUNG ALONG ONE LINE ──
        //
        // Emoji, name, two dropdowns and a close button on a single inline row
        // inside a column this narrow could only ever overflow, and the widest
        // option text set the width of a control that had nowhere to go. The
        // name and the × keep the header row; the dropdowns get a row each and
        // fill it.
        //
        // The parentheses move to the tooltip. "Gauntlet (first out fights
        // everyone)" is the label doing the job of a title attribute that was
        // already there and already said it.
        const styles = { gauntlet: 'Gauntlet', showdown: 'Showdown' };
        const curStyle = t.bbStyle || 'gauntlet';
        const SEL = 'font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);'
          + 'border-radius:3px;padding:1px 2px;flex:1 1 auto;min-width:0;max-width:100%';
        let h = `<select onchange="event.stopPropagation();updateTwist('${t.id}','bbStyle',this.value)" onclick="event.stopPropagation()" title="Gauntlet — the first evictee fights everyone in turn. Showdown — the house elects one champion to face them." style="${SEL}">`;
        Object.entries(styles).forEach(([k, label]) => { h += `<option value="${k}" ${k === curStyle ? 'selected' : ''}>${label}</option>`; });
        h += `</select>`;
        const comps = (typeof bbCompetitionsForSlot !== 'undefined' ? bbCompetitionsForSlot('battle-back') : []) || [];
        if (comps.length) {
          const chosen = t.bbComp || '';
          h += `<select onchange="event.stopPropagation();updateTwist('${t.id}','bbComp',this.value)" onclick="event.stopPropagation()" title="Which competition they fight on" style="font-size:10px;background:#1e1e2e;color:${chosen ? '#cdd6f4' : '#8b949e'};border:1px solid rgba(99,102,241,${chosen ? '0.55' : '0.22'});border-radius:3px;padding:1px 2px;flex:1 1 auto;min-width:0;max-width:100%">`;
          h += `<option value="" ${!chosen ? 'selected' : ''}>Auto</option>`;
          const written = comps.filter(c => !c.generic), generic = comps.filter(c => c.generic);
          if (written.length) {
            h += `<optgroup label="Written">`;
            written.forEach(c => { h += `<option value="${c.id}" ${c.id === chosen ? 'selected' : ''}>${c.name}</option>`; });
            h += `</optgroup>`;
          }
          if (generic.length) {
            h += `<optgroup label="Generic">`;
            generic.forEach(c => { h += `<option value="${c.id}" ${c.id === chosen ? 'selected' : ''}>${c.name} (generic)</option>`; });
            h += `</optgroup>`;
          }
          h += `</select>`;
        }
        return `<span class="fd-ep-twist-tag" style="display:flex;flex-direction:column;align-items:stretch;gap:3px;max-width:100%;min-width:0">
          <span style="display:flex;align-items:center;gap:4px;min-width:0">
            <span style="flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cat.emoji} ${cat.name}</span>
            <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;flex:0 0 auto">×</span>
          </span>${h}</span>`;
      }
      // WHICH GAME THE FLOOR SELLS THAT NIGHT.
      //
      // Left alone the room runs its own order — the cheap table the first time
      // it opens, the wheel every time after — which is what the theme's own
      // three nights want. This is for hand-authored weeks, where "the room
      // opens" was not enough to say what you meant.
      if (t.type === 'bb-high-rollers-room') {
        const games = (typeof ROOM_GAMES !== 'undefined' && ROOM_GAMES) || [];
        const chosen = t.game || '';
        let gameHtml = `<select onchange="event.stopPropagation();updateTwist('${t.id}','game',this.value)" onclick="event.stopPropagation()" title="Which game the room sells this night" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%">`;
        // "Auto (Derby, then the wheel)" assumed you already knew that "the
        // wheel" is the Roulette and that "then" meant later ROOM NIGHTS rather
        // than later the same evening. Name both games and both prices, and put
        // the reason for the order in the tooltip.
        gameHtml += `<option value="" ${chosen === '' ? 'selected' : ''} title="The room sells one game a night. Auto sells the cheap one first, because almost nobody can afford 125 on the room's first night.">Auto — 1st night Derby (50), then Roulette (125)</option>`;
        games.forEach(g => {
          gameHtml += `<option value="${g.id}" ${g.id === chosen ? 'selected' : ''}>${g.name} — ${g.price}</option>`;
        });
        gameHtml += `</select>`;
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${gameHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'bb-pandoras-box') {
        // What goes IN the box — drawn from the power inventory, so every
        // power added there becomes cargo here with no new UI.
        const defs = (typeof BB_POWER_DEFINITIONS !== 'undefined' && BB_POWER_DEFINITIONS)
          || { 'diamond-veto': { id: 'diamond-veto', name: 'The Diamond Power of Veto' } };
        const chosen = t.prize || 'diamond-veto';
        let prizeHtml = `<select onchange="event.stopPropagation();updateTwist('${t.id}','prize',this.value)" onclick="event.stopPropagation()" title="What the box holds" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%">`;
        Object.values(defs).forEach(d => { prizeHtml += `<option value="${d.id}" ${d.id===chosen?'selected':''}>${d.name}</option>`; });
        prizeHtml += `</select>`;
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${prizeHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      // Two channels, one door control. The Whacktivity's three rooms and the
      // secret power competition's three hiding places are the same authoring
      // question — which powers are on offer — and giving the second one its
      // own slightly different dropdown is how two channels drift apart.
      if (t.type === 'bb-whacktivity' || t.type === 'bb-secret-power-comp') {
        // One dropdown per door. The previous control listed every distinct
        // TRIO as a single option, which is four choices at four powers and
        // four hundred and fifty-five at fifteen — the registry is meant to
        // grow, so the UI cannot be combinatorial in it.
        //
        // A door left empty simply does not open, so two-door and one-door
        // weeks are authorable instead of being a shape nobody can express.
        const defs = (typeof BB_POWER_DEFINITIONS !== 'undefined' && BB_POWER_DEFINITIONS) || {};
        const ids = Object.keys(defs);
        // Its own three by default, because they were written for it and
        // expire with it; the Whacktivity keeps taking the head of the shelf.
        const stock = t.type === 'bb-secret-power-comp'
          ? ['hoh-interrogation', 'mystery-competitor', 'mystery-veto'].filter(id => defs[id])
          : ids.slice(0, 3);
        const doors = Array.isArray(t.doors) && t.doors.length
          ? [...t.doors, '', '', ''].slice(0, 3)
          : stock;
        const style = "font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:3px;min-width:0;max-width:100%";
        let h = '';
        doors.forEach((chosen, idx) => {
          h += `<select onchange="event.stopPropagation();_updateWhackDoor('${t.id}',${idx},this.value)" onclick="event.stopPropagation()" title="Door ${idx + 1}" style="${style}">`;
          h += `<option value="" ${!chosen ? 'selected' : ''}>Door ${idx + 1}: closed</option>`;
          ids.forEach(id => {
            // A power already standing behind another door is shown but
            // marked, so the author can see why it is not available twice.
            const taken = doors.some((d, i) => i !== idx && d === id);
            h += `<option value="${id}" ${id === chosen ? 'selected' : ''} ${taken ? 'disabled' : ''}>${defs[id].name.replace(/^The /, '')}${taken ? ' (in use)' : ''}</option>`;
          });
          h += `</select>`;
        });
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${h} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'bb-care-package') {
        // A distributor, so the shelf is authorable. 'auto' runs the show's
        // rotation; anything else books that package onto this week — which
        // matters most for the Never-Not Pass, since it is first in the
        // rotation and does nothing at all on a season without Have-Nots.
        const style = "font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%";
        const cpStyle = t.cpStyle || 'time-capsule';
        // Which shape the audience channel runs. The capsule makes the
        // favourite earn it; the package just hands it over.
        let h = `<select onchange="event.stopPropagation();updateTwist('${t.id}','cpStyle',this.value)" onclick="event.stopPropagation()" title="What the audience vote does" style="${style}">`;
        h += `<option value="time-capsule" ${cpStyle === 'time-capsule' ? 'selected' : ''}>Time Capsule: they play for it</option>`;
        h += `<option value="care-package" ${cpStyle === 'care-package' ? 'selected' : ''}>Care Package: handed over</option>`;
        h += `</select>`;
        // Only the package shape has a shelf to stock — the capsule pays out of
        // the power inventory and the punishment rack.
        if (cpStyle === 'care-package') {
          const pkgs = (typeof CARE_PACKAGES !== 'undefined' && CARE_PACKAGES) || [];
          const chosen = t.package || 'auto';
          const haveNots = seasonConfig.bbHaveNots && seasonConfig.bbHaveNots !== 'off';
          h += `<select onchange="event.stopPropagation();updateTwist('${t.id}','package',this.value)" onclick="event.stopPropagation()" title="Which package the audience votes over" style="${style}">`;
          h += `<option value="auto" ${chosen === 'auto' ? 'selected' : ''}>Next in the rotation</option>`;
          pkgs.forEach(p => {
            // Said out loud rather than hidden: a Never-Not Pass on a season
            // with no Have-Nots is an empty envelope, and the engine skips it.
            const dead = p.effect === 'never-not' && !haveNots;
            h += `<option value="${p.id}" ${p.id === chosen ? 'selected' : ''} ${dead ? 'disabled' : ''}>${p.name}${dead ? ' (no Have-Nots this season)' : ''}</option>`;
          });
          h += `</select>`;
        }
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${h} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'bb-americas-nominee') {
        // Two shapes, and they are genuinely different twists. Direct: the
        // audience names the third nominee and there is nobody in the building
        // to catch, so every accusation lands on an innocent. MVP: a real
        // houseguest was voted Most Valuable Player and named them in secret,
        // so there IS a culprit sitting in that room being no more suspicious
        // than anybody else.
        const chosen = t.anStyle === 'mvp' ? 'mvp' : 'direct';
        let h = `<select onchange="event.stopPropagation();updateTwist('${t.id}','anStyle',this.value)" onclick="event.stopPropagation()" title="Who actually names the third nominee" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%">`;
        h += `<option value="direct" ${chosen === 'direct' ? 'selected' : ''}>Named by the audience</option>`;
        h += `<option value="mvp" ${chosen === 'mvp' ? 'selected' : ''}>Named by a secret MVP</option>`;
        h += `</select>`;
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${h} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'bb-den-of-temptation') {
        // What is on the table in the Den. Same source as the box and the
        // shelf; 'random' lets the season surprise itself.
        const defs = (typeof BB_POWER_DEFINITIONS !== 'undefined' && BB_POWER_DEFINITIONS) || {};
        const chosen = t.offer || 'random';
        let offerHtml = `<select onchange="event.stopPropagation();updateTwist('${t.id}','offer',this.value)" onclick="event.stopPropagation()" title="What the Den offers" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%">`;
        offerHtml += `<option value="random" ${chosen === 'random' ? 'selected' : ''}>A random temptation</option>`;
        Object.values(defs).forEach(d => {
          offerHtml += `<option value="${d.id}" ${d.id === chosen ? 'selected' : ''}>${d.name}</option>`;
        });
        offerHtml += `</select>`;
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${offerHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'bb-app-store') {
        // What goes ON the shelf. Same source as the box's cargo, so a power
        // added to the inventory appears in both with no new UI — and the
        // default stocks everything, which is the BB20 shape.
        const defs = (typeof BB_POWER_DEFINITIONS !== 'undefined' && BB_POWER_DEFINITIONS) || {};
        const chosen = t.shelf || 'all';
        let shelfHtml = `<select onchange="event.stopPropagation();updateTwist('${t.id}','shelf',this.value)" onclick="event.stopPropagation()" title="What is on the shelf this week" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px;min-width:0;max-width:100%">`;
        shelfHtml += `<option value="all" ${chosen === 'all' ? 'selected' : ''}>Everything on the shelf</option>`;
        Object.values(defs).forEach(d => {
          shelfHtml += `<option value="${d.id}" ${d.id === chosen ? 'selected' : ''}>${d.name} only</option>`;
        });
        shelfHtml += `</select>`;
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${shelfHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
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
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} Reward: ${_rtcHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
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
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${cfg} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.type === 'auction') {
        const _mode = t.auctionImmunity === 'reward' ? 'reward' : 'immunity';
        let _aSel = `<select onchange="event.stopPropagation();updateTwist('${t.id}','auctionImmunity',this.value)" onclick="event.stopPropagation()" title="Immunity: auction is the only source of immunity (no challenge). Reward: auction is a reward alongside a normal immunity challenge." style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 3px;margin-left:2px">`;
        _aSel += `<option value="immunity" ${_mode==='immunity'?'selected':''}>Immunity</option>`;
        _aSel += `<option value="reward" ${_mode==='reward'?'selected':''}>Reward</option>`;
        _aSel += `</select>`;
        return `<span class="fd-ep-twist-tag" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;max-width:100%;min-width:0">${cat.emoji} ${cat.name} ${_aSel} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      if (t.spoilerFree) {
        const phaseTag = cat?.phase === 'pre-merge' ? 'Pre-merge challenge' : cat?.phase === 'post-merge' ? 'Post-merge challenge' : 'Challenge';
        return `<span class="fd-ep-twist-tag" style="font-style:italic;opacity:0.7" onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')">🔒 ${phaseTag} ×</span>`;
      }
      return `<span class="fd-ep-twist-tag" onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')">${cat ? cat.emoji : '🔀'} ${cat ? cat.name : t.type} ×</span>`;
    }).map((html, k) => _fdThemeMark(twists[k], html)).join('');

    const markerClass = isFinale ? 'fd-ep-marker finale'
      : isJuryEp ? 'fd-ep-marker jury'
        : isMergeEp ? 'fd-ep-marker merge' : 'fd-ep-marker';
    const markerText  = isFinale ? 'FINALE'
      : isJuryEp ? `JURY · ${active} left`
        : isMergeEp ? `MERGE · ${active} left` : `${active} left`;
    // A castle has no tribes and no merge, so it has no PRE/POST to stamp — the
    // episode map hands every season a pre/post split it shares with Total
    // Drama, and left alone it would print a meaningless PRE on every night.
    const phaseLabel  = isTraitorsSeason() ? ''
      : phase === 'ri-duel' ? 'RI DUEL' : phase === 'finale' ? '' : phase === 'pre-merge' ? 'PRE' : 'POST';

    // Competition pinning: every Big Brother week has an HOH and a veto, so
    // the pickers are always there rather than something you add.
    //
    // The finale gets its own two. Parts one and two DRAW — from every
    // endurance competition in the library for part one, and every physical,
    // precision or puzzle one for part two, with the set pieces written for
    // finale night sitting in those pools — so they are pinnable exactly like a
    // week is. Part three has no picker because it is not a choice: it is the
    // jury quiz, every season.
    const compRow = isHouse
      ? (isFinale
        // Full opacity inside a row the designer dims: the rest of the finale
        // card is greyed because nothing can be booked onto it, but these two
        // are live controls and a dimmed control reads as a disabled one.
        ? `<div class="fd-ep-comps" style="display:flex;gap:4px;flex-wrap:wrap;min-width:0;margin-top:5px;padding-top:5px;border-top:1px solid rgba(245,158,11,0.18);opacity:1">
            ${_bbFinalCompPicker('one', 'final-1', 'PART 1')}${_bbFinalCompPicker('two', 'final-2', 'PART 2')}
            <span style="font-size:9.5px;letter-spacing:.5px;color:var(--muted,#7d8590);align-self:center" title="Part three is the jury quiz every season">PART 3 · Jury Statements</span>
          </div>`
        : `<div class="fd-ep-comps" style="display:flex;gap:4px;flex-wrap:wrap;min-width:0;margin-top:5px;padding-top:5px;border-top:1px solid rgba(99,102,241,0.12)">
            ${_bbCompPicker(ep, 'hoh', 'HOH')}${_bbCompPicker(ep, 'veto', 'VETO')}
          </div>`)
      : '';

    // The castle's afternoon mission — one dropdown per episode, always shown
    // (a castle runs a mission every day), pinning which one runs.
    const missionRow = (isTraitorsSeason() && !isFinale)
      ? `<div class="fd-ep-comps" style="display:flex;gap:4px;flex-wrap:wrap;min-width:0;margin-top:5px;padding-top:5px;border-top:1px solid rgba(201,162,74,0.14)">
            ${_trMissionPicker(ep)}${_trShieldTick(ep)}
          </div>`
      : '';

    html += `<div class="fd-episode ${isSelected ? 'selected' : ''} ${isFinale ? 'finale' : ''} ${phase === 'ri-duel' ? 'ri-ep' : ''}" onclick="${isFinale ? '' : `toggleEpisode(${ep})`}" ${isFinale ? 'style="opacity:.6;cursor:default"' : ''}>
      <div class="fd-ep-header">
        <span class="fd-ep-num">Ep. ${ep} <span class="fd-ep-phase-label">${phaseLabel}</span></span>
        <span class="${markerClass}">${markerText}</span>
      </div>
      ${twistTags ? `<div class="fd-ep-twists">${twistTags}</div>` : ''}
      ${compRow}${missionRow}
    </div>`;
  });

  container.innerHTML = html;
  // The theme's twists and the season's modes can disagree; say so where the
  // theme is chosen, and refresh it whenever the timeline is redrawn.
  try { renderThemeModeWarning(); } catch (e) {}
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

  // Only ever show twists belonging to the show being designed. A Tribe Swap
  // means nothing in a house and an HOH means nothing on a beach, so the
  // catalogue is scoped to the format rather than filtered by the reader.
  const catalog = (typeof twistsForFormat === 'function' && typeof seasonConfig !== 'undefined')
    ? twistsForFormat(seasonConfig) : TWIST_CATALOG;

  // ── the filter bar, built from what this format actually has ──
  //
  // The buttons used to be hard-coded in the page, which meant a house was
  // offered Team Dynamics and Immunity — filters that could only ever return
  // nothing — while its own twists sat under headings that did not exist. Only
  // categories with something in them get a button.
  const bar = document.getElementById('fd-filters');
  if (bar) {
    const present = TWIST_CATEGORIES.filter(c => catalog.some(t => t.category === c.id));
    // A filter the format no longer offers must not stay selected.
    if (currentTwistFilter !== 'all' && !present.some(c => c.id === currentTwistFilter)) {
      currentTwistFilter = 'all';
    }
    bar.innerHTML = [{ id: 'all', label: 'All' }, ...present].map(c => {
      const n = c.id === 'all' ? catalog.length : catalog.filter(t => t.category === c.id).length;
      return `<button class="fd-filter-btn ${currentTwistFilter === c.id ? 'active' : ''}"
        data-filter="${c.id}" onclick="setTwistFilter('${c.id}')">${c.label} <span>${n}</span></button>`;
    }).join('');
  }

  let filtered = catalog.slice();
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
      const allSeries = [...new Set(catalog.filter(c => c.category === 'challenge' && c.chalSeries).map(c => c.chalSeries))];
      const chalTwists = catalog.filter(c => c.category === 'challenge');
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
    // Distinguish "your search found nothing" from "this show has none of these",
    // which are the same empty box but completely different problems.
    const show = typeof formatName === 'function' ? formatName(seasonConfig) : 'this show';
    container.innerHTML = `<div style="padding:16px;color:var(--muted);font-size:13px">${
      catalog.length ? 'No twists match your search.'
        : `No ${show} twists are built yet. The format runs its standard week.`}</div>`;
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
    // A twist can also clash with a season MODE rather than another card —
    // see SEASON_MODES. Generic on purpose: declaring incompatibleModes on the
    // catalog entry is the whole of the work for any future one.
    const modeClashes = canAssign ? twistModeClashes(t, seasonConfig) : [];
    const modeBlocked = modeClashes.length > 0;
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
    const blocked = phaseBlocked || incompBlocked || modeBlocked || tribeBlocked || riBlocked || popBlocked || exileBlocked || _tdEvenBlocked || _taOddBlocked || _ccEvenBlocked || _bbEvenBlocked || _womEvenBlocked || _rilBlocked;
    const blockReason = phaseBlocked ? ' ⚠️ wrong phase' : incompBlocked ? ' ⚠️ conflicts with existing twist'
      : modeBlocked ? ` ⚠️ cannot run alongside ${modeClashes.join(' and ')}` : tribeBlocked ? ` ⚠️ needs ${t.minTribes}+ tribes` : riBlocked ? ' ⚠️ incompatible with 2nd Chance Isle' : exileBlocked ? ' ⚠️ incompatible with Exile Format' : popBlocked ? ' ⚠️ requires Popularity enabled' : _rilBlocked ? ' ⚠️ requires Rescue Island enabled' : _tdEvenBlocked ? ' ⚠️ needs even player count' : _taOddBlocked ? ' ⚠️ needs even player count' : _ccEvenBlocked ? ' ⚠️ needs even player count for pairs' : _bbEvenBlocked ? ' ⚠️ needs even player count for pairs' : _womEvenBlocked ? ' ⚠️ needs even player count for pairs' : '';
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
  // Refuse outright: this clash is with the season itself, so no episode is a
  // legal home for it and blocking per-episode below would say nothing useful.
  const seasonClashes = twistModeClashes(twist, seasonConfig);
  if (seasonClashes.length) {
    alert(`${twist.name} cannot run in a season with ${seasonClashes.join(' and ')} — the two need the same block.`);
    return;
  }
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
    if (twistId === 'bb-pandoras-box') entry.prize = 'diamond-veto';
    if (twistId === 'bb-app-store') entry.shelf = 'all';
    if (twistId === 'bb-den-of-temptation') entry.offer = 'random';
    if (twistId === 'bb-whacktivity' || twistId === 'bb-secret-power-comp') entry.doors = 'auto';
    if (twistId === 'bb-americas-nominee') entry.anStyle = 'direct';
    if (twistId === 'bb-double-eviction') entry.deStyle = 'fast-forward';
    if (twistId === 'bb-triple-eviction') entry.teStyle = 'fast-forward';
    if (twistId === 'bb-chain-of-safety') { entry.chainStart = 'safety-comp'; entry.chainStyle = 'canada'; }
    if (twistId === 'late-arrival') { entry.arrival = ''; entry.arrivalTribe = 'smallest'; }
    if (twistId === 'bb-battle-back') { entry.bbStyle = 'gauntlet'; entry.bbComp = ''; }
    seasonConfig.twistSchedule.push(entry);
  });

  if (blocked.length) {
    const phaseName = twist?.phase === 'pre-merge' ? 'pre-merge' : 'post-merge';
    alert(`"${twist?.name}" is a ${phaseName}-only twist.\nBlocked on episode${blocked.length > 1 ? 's' : ''}: ${blocked.join(', ')}.`);
  }

  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

/**
 * Mark a card the season's theme put there.
 *
 * Theme cards are ordinary schedule entries — that is the whole point of
 * stamping them at authoring time — so the same renderer draws them and the
 * same controls edit them. Without a mark there is no way to tell what you
 * booked from what the theme booked for you, which matters most at the moment
 * you are deciding what to change.
 */
function _fdThemeMark(t, html) {
  if (!t || typeof html !== 'string') return html;
  let badges = '';
  if (t.source === 'theme') {
    badges += '<span title="Placed by the theme &mdash; edit or delete it like any other card"'
      + ' style="font-size:8px;letter-spacing:.08em;text-transform:uppercase;opacity:.65;'
      + 'border:1px solid currentColor;border-radius:2px;padding:0 3px;margin-right:3px">theme</span>';
  }
  // A card the season's own settings will refuse.
  //
  // The engine drops these at `bbTwistsForWeek`, silently and correctly: the
  // Den of Temptation seats a third nominee and so does the Block Buster, so
  // they cannot both own the block. But the card sits on the timeline looking
  // exactly like one that will run, and a theme that stamps three of them
  // leaves you reading a schedule where half the season never happens.
  let clash = [];
  try {
    const cat = (typeof TWIST_CATALOG !== 'undefined' ? TWIST_CATALOG : [])
      .find(c => c.id === t.type);
    if (cat && typeof twistModeClashes === 'function') {
      clash = twistModeClashes(cat, seasonConfig) || [];
    }
  } catch (e) { clash = []; }
  if (clash.length) {
    badges += '<span title="This will not run &mdash; ' + clash.join(', ')
      + ' owns the same part of the week"'
      + ' style="font-size:8px;letter-spacing:.08em;text-transform:uppercase;'
      + 'background:#f85149;color:#2a0a08;border-radius:2px;padding:0 3px;margin-right:3px;'
      + 'font-weight:800">will not run</span>';
  }
  if (!badges) return html;
  const out = html.replace(/^(<span[^>]*>)/, '$1' + badges);
  return clash.length
    ? out.replace(/^<span /, '<span data-dead="1" ')
    : out;
}

/**
 * Pick a theme, and its arc lands on the schedule to be edited.
 *
 * Stamped here rather than on the way into episode one, which is what makes an
 * arc visible and editable at all. Switching themes sweeps the previous one's
 * cards; switching to "No theme" sweeps them and leaves the rest of your
 * schedule alone.
 */
export function onThemeChange() {
  saveConfig();
  try {
    stampThemeArc((typeof players !== 'undefined' && players.length) || 0);
    localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  } catch (e) { /* a themeless season carries on */ }
  renderTimeline();
}

/**
 * Say so when the season's own settings will refuse the theme's twists.
 *
 * The engine drops them correctly and silently, which is the problem: you pick
 * Summer of Temptation with the Block Buster on, three Den of Temptation cards
 * appear on the timeline, and none of them will ever run.
 */
export function renderThemeModeWarning() {
  const el = document.getElementById('theme-mode-warning');
  if (!el) return;
  let conflict = { modes: [], cards: [] };
  try {
    if (typeof themeModeConflicts === 'function') conflict = themeModeConflicts(seasonConfig);
  } catch (e) { conflict = { modes: [], cards: [] }; }
  if (!conflict.modes.length) { el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = '';
  el.innerHTML = `<strong>${conflict.cards.join(', ')}</strong> cannot run while `
    + `${conflict.modes.join(' and ')} is on — they own the same part of the week. `
    + 'Those weeks will play as ordinary ones. Turn it off, or expect a thinner season.';
}

/** Throw the edits away and lay the theme's own arc down again. */
export function resetThemeSchedule() {
  seasonConfig.themeArcStamped = '';
  try {
    stampThemeArc((typeof players !== 'undefined' && players.length) || 0);
    localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  } catch (e) { /* nothing to reset */ }
  renderTimeline();
  renderThemeModeWarning();
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

/**
 * One door of a Whacktivity, set independently of the other two.
 *
 * The control used to be a single dropdown listing every distinct TRIO, which
 * works at four powers (four combinations) and falls apart the moment the
 * registry grows — ten powers is a hundred and twenty options, fifteen is four
 * hundred and fifty-five. Three selects is one option per power per door,
 * forever, and lets the author actually author the room.
 *
 * A door set to '' is a door that does not open, so a two-door or one-door
 * week is authorable rather than a special case.
 */
export function _updateWhackDoor(twistId, doorIdx, powerId) {
  const t = (seasonConfig.twistSchedule || []).find(x => x.id === twistId);
  if (!t) return;
  const defs = (typeof BB_POWER_DEFINITIONS !== 'undefined' && BB_POWER_DEFINITIONS) || {};
  const current = Array.isArray(t.doors) ? [...t.doors] : Object.keys(defs).slice(0, 3);
  while (current.length < 3) current.push('');
  current[doorIdx] = powerId;
  // The same power cannot stand behind two doors: picking it for one clears it
  // from the other rather than silently collapsing two rooms into one.
  for (let i = 0; i < current.length; i++) {
    if (i !== doorIdx && powerId && current[i] === powerId) current[i] = '';
  }
  t.doors = current;
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

/**
 * Fill a Big Brother season's competition pickers.
 *
 * The Randomize button opened the Total Drama panel on any season — series
 * checkboxes for Island, Action and World Tour over a house that has none of
 * them — and `randomizeChallenges` schedules TWIST_CATALOG challenge twists,
 * which a Big Brother week has no slot for. Pressing it on a house season was
 * offering to fill in something that does not exist while the two dropdowns
 * that DO exist on every week sat on Auto.
 *
 * Those are the pickers this fills: the HOH and the veto, week by week. Auto
 * already picks at run time and picks well — this is for when you want to see
 * the season's shape before playing it, and to decide what kind of season it
 * is rather than finding out afterwards.
 *
 * The mix is the same rule the engine uses at run time (BB_COMP_MIXES): a
 * `balanced` season favours whatever stat has been idle, a lean tilts toward
 * one without excluding the rest. Doing it here and there with one rule means
 * the plan and the play agree.
 */
export function randomizeBBComps(opts = {}) {
  const { mix = 'balanced', clearExisting = true } = opts;
  const epMap = buildEpisodeMap();
  if (!epMap.length) return 0;
  if (typeof bbCompetitionsForSlot === 'undefined') return 0;

  if (clearExisting) seasonConfig.bbCompSchedule = [];

  // What the season has asked for so far, in stat weight. The same measure the
  // engine's balanced rule uses, kept here rather than imported because run-ui
  // reads everything as a bare global.
  const spent = {};
  const spend = comp => {
    for (const [stat, weight] of Object.entries(comp.stats || {})) {
      spent[stat] = (spent[stat] || 0) + (Number(weight) || 0);
    }
  };
  const LEANS = {
    physical: ['physical', 'endurance'], mental: ['mental', 'intuition'],
    endurance: ['endurance', 'temperament'], social: ['social', 'strategic'],
  };
  const lean = LEANS[mix] || null;

  const weightOf = comp => {
    const stats = comp.stats || {};
    if (lean) {
      const share = lean.reduce((n, s) => n + (Number(stats[s]) || 0), 0);
      return 0.5 + share * 2.2;
    }
    const total = Object.values(spent).reduce((a, b) => a + b, 0);
    if (total <= 0) return 1;
    const average = total / Math.max(1, Object.keys(spent).length);
    let score = 0;
    for (const [stat, weight] of Object.entries(stats)) {
      const w = Number(weight) || 0;
      if (!w) continue;
      score += w * (average > 0 ? (average - (spent[stat] || 0)) / average : 0);
    }
    return Math.max(0.35, Math.min(2.6, 1 + score * 1.4));
  };

  // A season should not run the same competition twice while its siblings sit
  // unaired — the same rule the engine applies, and the reason a plan drawn
  // here does not simply repeat the library's three favourites.
  const used = new Set();
  const pickFor = slot => {
    const list = (bbCompetitionsForSlot(slot) || []).filter(c => c && c.id);
    if (!list.length) return '';
    const pool = list.filter(c => !used.has(c.id));
    const from = pool.length ? pool : list;
    const weights = from.map(c => Math.max(0.01, weightOf(c)));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let pick = from[from.length - 1];
    for (const [i, comp] of from.entries()) {
      roll -= weights[i];
      if (roll <= 0) { pick = comp; break; }
    }
    used.add(pick.id);
    spend(pick);
    return pick.id;
  };

  let filled = 0;
  for (const info of epMap) {
    // The finale runs its own two-part Head of Household and never a weekly
    // competition, so pinning one there would be scheduling a night that does
    // not happen.
    if (info.phase === 'finale') continue;
    for (const slot of ['hoh', 'veto']) {
      const id = pickFor(slot);
      if (!id) continue;
      _setBBComp(info.ep, slot, id);
      filled += 1;
    }
  }
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
  return filled;
}

/** The house's own randomiser panel. */
function _bbRandomizerPanel() {
  const mixes = [
    ['balanced', 'Balanced — every stat gets a night'],
    ['physical', 'More physical'],
    ['mental', 'More mental'],
    ['endurance', 'More endurance'],
    ['social', 'More social'],
  ];
  const current = seasonConfig.bbCompMix || 'balanced';
  return `
      <div style="display:flex;flex-direction:column;gap:6px">
        <span style="font-size:12px;color:var(--muted,#7d8590)">Fills every week's Head of Household
          and veto. Auto already picks well at run time — this is for seeing the season's shape
          before you play it.</span>
        <select id="bb-rand-mix" style="background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:6px;padding:6px 8px;font-size:12.5px">
          ${mixes.map(([id, label]) =>
    `<option value="${id}" ${id === current ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="_runBBRandomizer()" style="background:#6366f1;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-weight:500">Randomize</button>
        <button onclick="_clearBBComps()" style="background:transparent;color:var(--text);border:1px solid rgba(99,102,241,0.3);border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer">Back to Auto</button>
      </div>`;
}

export function _runBBRandomizer() {
  const mix = document.getElementById('bb-rand-mix')?.value || 'balanced';
  // The picker doubles as the season's setting, so what was planned is also
  // what any un-pinned week runs.
  seasonConfig.bbCompMix = mix;
  const n = randomizeBBComps({ mix });
  const note = document.getElementById('bb-rand-note');
  if (note) note.textContent = n ? `Filled ${n} competitions.` : 'Nothing to fill.';
}

export function _clearBBComps() {
  seasonConfig.bbCompSchedule = [];
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
  const note = document.getElementById('bb-rand-note');
  if (note) note.textContent = 'Every week back to Auto.';
}

export function showRandomizerPanel() {
  const existing = document.getElementById('randomizer-panel');
  if (existing) { existing.remove(); return; }

  // A house has no Island, no Action and no World Tour, and no slot for a
  // TWIST_CATALOG challenge twist. Offering the Total Drama panel here was
  // offering to fill in something that does not exist, while the two pickers
  // that DO exist on every week sat on Auto.
  const isBB = (typeof seasonFormat === 'function' ? seasonFormat(seasonConfig.format) : seasonConfig.format) === 'big-brother';

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
        <span style="font-weight:600;color:var(--text);font-size:14px">🎲 ${
  isBB ? 'Competition Randomizer' : 'Challenge Randomizer'}</span>
        <span onclick="showRandomizerPanel()" style="cursor:pointer;color:var(--muted);font-size:18px">×</span>
      </div>
      ${isBB ? _bbRandomizerPanel() : `
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
      </div>`}
      <span id="${isBB ? 'bb-rand-note' : 'rand-result'}" style="font-size:12px;color:var(--muted)"></span>
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

/**
 * A player's season, broken into the things a season is actually made of.
 *
 * ── WHY THIS IS NOT ONE NUMBER ──
 *
 * It used to be: `challengeWins * 2 + accuracy * 3 + influence * 1.5 + ...`,
 * one figure with no way to see what was in it. On Big Brother that figure was
 * also mostly WRONG, because the only Big Brother facts it read were the three
 * competition counters. `gs.bb.stats` also records timesNominated, timesSaved
 * and timesOnTheBlock, and `gs.bb.powers` records who is holding what and who
 * has spent it — so surviving four blocks, or sitting on a secret veto for a
 * month, counted for precisely nothing.
 *
 * Surviving the block is not a footnote in that game. It is frequently the
 * whole story of a winner.
 *
 * Each section scores separately and says what it is made of, so a ranking can
 * be argued with rather than just read.
 */
function _rankingSections(name, ctx) {
  const { state, isBB, metric } = ctx;
  const out = [];
  const add = (key, label, points, detail) => {
    if (points || detail) out.push({ key, label, points: Math.round(points * 10) / 10, detail });
  };

  // ── social, which is the same shape on both shows ──
  const alliances = metric.alliances.length;
  const showmance = (state?.showmances || [])
    .filter(sh => !sh.broken && sh.phase !== 'broken-up' && (sh.players || []).includes(name)).length;
  // Reach: how many people in this house this player is genuinely close to.
  // Read off the bond table rather than the alliance list, because the useful
  // relationships are frequently the ones with no name on them.
  let close = 0;
  const bonds = state?.bonds || {};
  for (const [key, val] of Object.entries(bonds)) {
    if (Number(val) < 4) continue;
    const pair = String(key).split('||');
    if (pair.includes(name)) close++;
  }

  if (isBB) {
    const rec = state?.bb?.stats?.[name] || {};
    const hoh = Number(rec.hohWins || 0);
    const veto = Number(rec.vetoWins || 0);
    const arena = Number(rec.blockBusterWins || 0);
    // A Head of Household week is a week you chose the block; a veto is a week
    // you changed one. Both beat an arena win, which is a week you survived a
    // twist somebody else set up.
    add('comp', 'Competitions', hoh * 3 + veto * 2.2 + arena * 1.4,
      [hoh ? `${hoh} HOH` : null, veto ? `${veto} veto` : null,
        arena ? `${arena} arena` : null].filter(Boolean).join(' · ') || 'no wins');

    const onBlock = Number(rec.timesOnTheBlock || 0);
    const saved = Number(rec.timesSaved || 0);
    const noms = Number(rec.timesNominated || 0);
    // THE THREE COUNTERS MEAN DIFFERENT THINGS, and reading them wrong printed
    // a line that contradicted itself: '2 nominated, 0 survived the vote, 1
    // pulled down'. `timesNominated` is every time you were named to the block.
    // `timesOnTheBlock` is the times you were still on it when the house voted
    // — the veto has already removed anybody it saved — so subtracting the
    // saves from it counts them twice.
    //
    // Everybody still in the house survived every vote they faced. Somebody
    // already gone survived all but the last one.
    const survived = metric.active ? onBlock : Math.max(0, onBlock - 1);
    // Being voted to stay beats being pulled down: one is the house choosing
    // you, the other is somebody else's veto choosing for you.
    add('block', 'On the block', survived * 1.8 + saved * 1.0,
      (noms || onBlock || saved)
        ? `${noms || onBlock + saved} nominated · ${survived} survived the vote`
          + (saved ? ` · ${saved} pulled down` : '')
        : 'never nominated');

    const powers = (state?.bb?.powers || []).filter(x => x?.holder === name);
    const spent = powers.filter(x => x.used).length;
    add('power', 'Powers', powers.length * 1.2 + spent * 1.6,
      powers.length ? `${powers.length} held${spent ? ` · ${spent} played` : ' · none played'}` : 'none');
  } else {
    add('comp', 'Challenges', metric.challengeWins * 2,
      metric.challengeWins ? `${metric.challengeWins} win${metric.challengeWins === 1 ? '' : 's'}` : 'no wins');
    const held = (state?.advantages || []).filter(a => a?.holder === name);
    add('power', 'Advantages', held.length * 1.5,
      held.length ? `${held.length} held` : 'none');
  }

  // ── the vote, which is the game both shows are actually playing ──
  add('vote', 'The vote', metric.voteAccuracy * 4 + metric.influence * 2,
    `${Math.round(metric.voteAccuracy * 100)}% with the house`
    + (metric.influence ? ` · ${metric.influence} vote${metric.influence === 1 ? '' : 's'} steered` : ''));

  add('social', 'Social', alliances * 1.2 + close * 0.5 + showmance * 0.8,
    [alliances ? `${alliances} alliance${alliances === 1 ? '' : 's'}` : null,
      close ? `${close} close` : null, showmance ? 'showmance' : null]
      .filter(Boolean).join(' · ') || 'no ties');

  // ── and the pressure they are under, which subtracts ──
  add('heat', 'Pressure', -(metric.votesReceived * 0.25),
    metric.votesReceived ? `${metric.votesReceived} vote${metric.votesReceived === 1 ? '' : 's'} against`
      : 'nothing against them');

  return out;
}

export function buildSeasonOverviewModel(state = gs, cast = players) {
  const history = state?.episodeHistory || [];
  // A house season measures power in different units: wins are HOH, veto and
  // Block Buster records rather than challenge wins, and agenda control is a
  // vote operation delivered rather than an alliance spearhead. Same screen,
  // same pulse — the inputs speak the format's own language.
  const isBB = history.some(e => e?.format === 'big-brother')
    || (typeof isBigBrotherSeason === 'function' && isBigBrotherSeason());
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
      const steered = isBB
        ? (ep.voteOperation?.plans || []).some(plan => boots.includes(plan.target)
          && plan.organizer === name && plan.expected >= plan.majority)
        : [...(ep.alliances || []), ...(ep.alliances2 || [])].some(alliance => boots.includes(alliance.target)
          && (alliance.spearhead === name || alliance.members?.[0] === name));
      if (steered) influence++;
    });
    const rec = isBB ? (state?.bb?.stats?.[name] || {}) : null;
    const hohWins = Number(rec?.hohWins || 0);
    const vetoWins = Number(rec?.vetoWins || 0);
    const arenaWins = Number(rec?.blockBusterWins || 0);
    const challengeWins = isBB
      ? hohWins + vetoWins + arenaWins
      : Number(state?.chalRecord?.[name]?.wins || 0);
    const voteAccuracy = ballots ? correctBallots / ballots : 0;
    const alliances = (state?.namedAlliances || []).filter(alliance => alliance.active !== false && alliance.members?.includes(name)).map(alliance => alliance.name);
    const reputation = state?.strategicReputations?.[name]?.labels || [];
    const popularity = Number(lastPop[name] || 0);
    const momentum = popularity - Number(prevPop[name] || 0);
    const base = { name, active: active.includes(name), challengeWins, hohWins, vetoWins,
      arenaWins, ballots, correctBallots, voteAccuracy, votesReceived, influence,
      alliances, reputation, popularity, momentum };
    // The pulse is now the SUM OF THE SECTIONS, so the number and its
    // breakdown cannot disagree — which they would the first time one was
    // edited without the other.
    const sections = _rankingSections(name, { state, isBB, metric: base });
    const pulse = sections.reduce((sum, sec) => sum + sec.points, 0) + momentum * 0.08;
    return { ...base, sections, pulse: Math.round(pulse * 10) / 10 };
  });
  const activeMetrics = metrics.filter(metric => metric.active);
  const by = (key, min = 0) => [...activeMetrics].filter(metric => metric[key] >= min).sort((a, b) => b[key] - a[key]);
  const leaders = [
    { label: isBB ? 'Competition leader' : 'Challenge leader', metric: 'wins', player: by('challengeWins', 1)[0],
      value: leader => isBB
        ? [leader.hohWins ? `${leader.hohWins} HOH` : '', leader.vetoWins ? `${leader.vetoWins} veto` : '', leader.arenaWins ? `${leader.arenaWins} arena` : ''].filter(Boolean).join(' · ') || `${leader.challengeWins} wins`
        : `${leader.challengeWins} win${leader.challengeWins === 1 ? '' : 's'}` },
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
    'social-center':'Social hub', provider: isBB ? 'Kitchen provider' : 'Camp provider',
    'challenge-leader': isBB ? 'Comp threat' : 'Challenge threat',
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
  // THE RATINGS. How the season is going down with the country, which is a
  // different question from how it is being cut (the edit, below) and a
  // different question again from who is winning it.
  //
  // Derived from the episode history when the season has no stored ratings,
  // so every season played before the feature existed shows a tier the first
  // time it is opened rather than an empty panel.
  const ratings = _overviewRatings(state);

  // Audience pulse (edit layer): how the season is being CUT, distinct from how it is going.
  const edit = state?.edit || null;
  const editLabels = typeof EDIT_LABELS !== 'undefined' ? EDIT_LABELS : {};
  const editTotalUnits = edit ? Object.values(edit.totals || {}).reduce((sum, t) => sum + Number(t?.units || 0), 0) : 0;
  const audiencePulse = edit && edit.episodes?.length ? {
    players: active.map(name => {
      const readKey = edit.reads?.[name]?.key || 'steady';
      const arc = [];
      (edit.episodes || []).forEach(rec => { const k = rec.reads?.[name]; if (k && arc[arc.length - 1] !== k) arc.push(k); });
      return {
        name, readKey,
        read: edit.reads?.[name]?.label || editLabels[readKey] || 'Steady presence',
        share: editTotalUnits ? Number(edit.totals?.[name]?.units || 0) / editTotalUnits : 0,
        confessionals: Number(edit.totals?.[name]?.conf || 0),
        arc: arc.map(k => editLabels[k] || k),
      };
    }).sort((a, b) => b.share - a.share),
    quotes: edit.episodes[edit.episodes.length - 1]?.quotes || [],
    final: edit.final || null,
  } : null;

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
    isBB,
    ratings,
    audiencePulse,
    jury: [...(state?.jury || [])],
  };
}

/**
 * The season's ratings, ready to draw.
 *
 * Reads the stored series when there is one and derives it from the episode
 * history when there is not — the whole system is a reader, so a season
 * finished long before it existed rates exactly the same as a live one.
 */
function _overviewRatings(state) {
  const history = state?.episodeHistory || [];
  if (!history.length) return null;
  // Guarded the way this file guards EDIT_LABELS: `seasonConfig` arrives
  // through window, and the season-hub tests build a model without it.
  const cfg = typeof seasonConfig !== 'undefined' ? seasonConfig : null;
  const fmt = state?.format || cfg?.format || 'total-drama';
  let series = state?.ratings?.weeks?.length ? state.ratings : null;
  if (!series && typeof ratingsForSeason === 'function') {
    try { series = ratingsForSeason(history, { format: fmt }); } catch { series = null; }
  }
  if (!series?.weeks?.length) return null;
  const weeks = series.weeks;
  const score = typeof seasonScore === 'function' ? seasonScore(weeks) : 0;
  const tier = typeof tierFor === 'function' ? tierFor(score) : { key: 'average', label: 'Average' };
  const latest = weeks[weeks.length - 1];
  const before = weeks.length > 1 ? weeks[weeks.length - 2] : null;
  const demos = (typeof DEMOS !== 'undefined' ? DEMOS : []).map(key => {
    const value = latest.demos?.[key] ?? 0;
    const was = before?.demos?.[key];
    let note = null;
    if (typeof demoNote === 'function') {
      try { note = demoNote(key, latest, before, fmt); } catch { note = null; }
    }
    return {
      key,
      label: (typeof DEMO_LABELS !== 'undefined' && DEMO_LABELS[key]) || key,
      value,
      delta: was === undefined ? 0 : value - was,
      note: note?.text || null,
      noteGood: !!note?.good,
    };
  }).sort((a, b) => b.value - a.value);
  return { score, tier, weeks, demos, latest, format: fmt,
    trend: before ? latest.overall - before.overall : 0,
    live: state?.phase !== 'complete' };
}

/**
 * Every episode, every column, and what moved each one.
 *
 * The curve says the shape and the four cards say where it ended up; neither
 * answers "what did the older audience make of episode nine", which is the
 * question somebody looking at a finished season actually has. So the whole
 * series is written out, one row per episode, with the driving note per
 * column — the same sentence the episode card showed on the night.
 */
function _ratingsTable(ratings) {
  const weeks = ratings?.weeks || [];
  if (!weeks.length) return '';
  const fmt = ratings.format || 'total-drama';
  const cell = (w, prev, key) => {
    const v = w.demos?.[key] ?? 0;
    const was = prev?.demos?.[key];
    const d = was === undefined ? 0 : v - was;
    const cls = d > 0.05 ? 'up' : d < -0.05 ? 'down' : '';
    let note = null;
    if (typeof demoNote === 'function') {
      try { note = demoNote(key, w, prev, fmt); } catch { note = null; }
    }
    return `<td class="ov-rt-cell ${cls}"><b>${Math.round(v)}</b>`
      + `<i>${d === 0 ? '' : `${d > 0 ? '▲' : '▼'}${Math.abs(d).toFixed(1)}`}</i>`
      + `<span>${note ? _hubEsc(note.text) : '&mdash;'}</span></td>`;
  };
  const rows = weeks.map((w, i) => {
    const prev = i > 0 ? weeks[i - 1] : null;
    const move = prev ? w.overall - prev.overall : 0;
    return `<tr>`
      + `<th scope="row"><b>EP ${String(w.ep).padStart(2, '0')}</b>`
      + `${w.twist ? '<i class="ov-rt-tw" title="A twist ran this episode">TWIST</i>' : ''}</th>`
      + `<td class="ov-rt-overall"><b>${w.overall}</b>`
      + `<i class="${move > 0.05 ? 'up' : move < -0.05 ? 'down' : ''}">`
      + `${prev ? `${move > 0 ? '▲' : move < 0 ? '▼' : '—'} ${Math.abs(move).toFixed(1)}` : 'first'}</i></td>`
      + DEMOS.map(k => cell(w, prev, k)).join('')
      + `</tr>`;
  }).join('');
  return `<details class="ov-rt-detail"><summary>Episode by episode &middot; every audience</summary>
    <div class="ov-rt-scroll"><table class="ov-rt-table">
      <thead><tr><th scope="col">Episode</th><th scope="col">Overall</th>
      ${DEMOS.map(k => `<th scope="col">${_hubEsc(DEMO_LABELS[k] || k)}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div></details>`;
}

/**
 * The trajectory, as an SVG line.
 *
 * SVG rather than a row of CSS bars: this is a curve with a shape, and the
 * shape is the whole point of showing it week by week instead of printing one
 * number. Twist weeks are marked, because a spike next to a twist is the most
 * common thing anybody will want to explain.
 */
function _ratingsCurve(weeks) {
  const W = 640, H = 132, padX = 26, padY = 14;
  const n = weeks.length;
  const x = i => padX + (n < 2 ? (W - padX * 2) / 2 : (i / (n - 1)) * (W - padX * 2));
  const y = v => H - padY - (Math.max(0, Math.min(100, v)) / 100) * (H - padY * 2);
  const pts = weeks.map((w, i) => [x(i), y(w.overall)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${(H - padY).toFixed(1)}`
    + ` L${pts[0][0].toFixed(1)},${(H - padY).toFixed(1)} Z`;
  // The tier boundaries the curve is being read against, so a line at 61 is
  // visibly a different thing from a line at 59.
  const bands = (typeof TIERS !== 'undefined' ? TIERS : []).filter(t => t.min > 0 && t.min < 100)
    .map(t => `<line class="ov-rt-band" x1="${padX}" x2="${W - padX}" y1="${y(t.min).toFixed(1)}" y2="${y(t.min).toFixed(1)}"/>`).join('');
  const marks = weeks.map((w, i) => (w.twist
    ? `<line class="ov-rt-twist" x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${padY}" y2="${H - padY}"/>` : '')).join('');
  const dots = weeks.map((w, i) => `<circle class="ov-rt-dot" cx="${x(i).toFixed(1)}" cy="${y(w.overall).toFixed(1)}" r="3">`
    + `<title>Episode ${w.ep}: ${w.overall}${w.twist ? ' (twist)' : ''}</title></circle>`).join('');
  return `<svg class="ov-rt-curve" viewBox="0 0 ${W} ${H}" role="img"`
    + ` aria-label="Ratings across ${n} episode${n === 1 ? '' : 's'}">`
    + `${bands}${marks}<path class="ov-rt-area" d="${area}"/>`
    + `<path class="ov-rt-line" d="${line}"/>${dots}</svg>`;
}

function _overviewPortrait(name, extraClass = '') {
  const player = players.find(candidate => candidate.name === name);
  const src = playerAvatarUrl(player || name);
  return `<span class="overview-face ${extraClass}" title="${_hubEsc(name)}"><img src="${_hubEsc(src)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span>${_hubEsc(String(name)[0] || '?')}</span></span>`;
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
      <section class="overview-section overview-ranking"><header><div><span>Game read</span><h2>Season pulse</h2></div><small>Interpretive ranking</small></header>
        <p class="overview-disclaimer">Every section scores separately and shows its working, so the ranking can be argued with rather than just read. ${model.isBB ? 'Competitions weight a Head of Household above a veto above an arena win; surviving the block counts for more when the house voted you through than when a veto pulled you down.' : 'Challenge wins, advantages, the vote, and who this player is actually close to.'} It is not a winner prediction.</p>
        <ol class="rank-list">${model.powerRanking.map((metric, index) => `<li class="rank-row">
          <b class="rank-pos">${index + 1}</b>${_overviewPortrait(metric.name)}
          <div class="rank-main"><strong>${_hubEsc(metric.name)}</strong>
            <div class="rank-sections">${(metric.sections || []).map(sec => `<span class="rank-sec ${sec.points < 0 ? 'neg' : sec.points > 0 ? 'pos' : ''}" title="${_hubEsc(sec.label)}: ${sec.points > 0 ? '+' : ''}${sec.points}"><i>${_hubEsc(sec.label)}</i><b>${sec.points > 0 ? '+' : ''}${sec.points}</b><em>${_hubEsc(sec.detail || '')}</em></span>`).join('')}</div>
          </div>
          <div class="rank-score"><b>${metric.pulse}</b><em class="${metric.momentum > 0 ? 'up' : metric.momentum < 0 ? 'down' : ''}">${metric.momentum > 0 ? '▲' : metric.momentum < 0 ? '▼' : '—'} ${Math.abs(metric.momentum).toFixed(1)}</em></div>
        </li>`).join('')}</ol></section>
      <section class="overview-section"><header><div><span>Recorded</span><h2>Alliance timeline</h2></div><small>${model.alliances.filter(alliance => alliance.active).length} active</small></header><div class="overview-alliance-list">${allianceHtml}</div></section>
    </div>
    <div class="overview-columns overview-history-grid">
      <section class="overview-section"><header><div><span>Recorded</span><h2>How the tribes changed</h2></div><small>${model.tribeHistory.length} era${model.tribeHistory.length === 1 ? '' : 's'}</small></header><div class="overview-tribe-history">${tribeHistoryHtml}</div></section>
      <section class="overview-section"><header><div><span>Public status</span><h2>Camp hierarchy</h2></div><small>Visible roles only</small></header><p class="overview-disclaimer">Roles reflect behavior the cast can observe. Hidden leverage and private intentions are deliberately excluded.</p><div class="overview-status-list">${statusHtml}</div></section>
    </div>
    ${model.ratings ? `<section class="overview-section overview-ratings"><header><div><span>Audience pulse</span><h2>The ratings</h2></div><small>${model.ratings.live ? `Through episode ${model.ratings.latest.ep}` : 'Final'}</small></header>
      <p class="overview-disclaimer">How the season is going down with the country. Four audiences watch the same show and want different things from it, so they rarely agree — the tier is the back-weighted verdict across every episode, not the latest one.</p>
      <div class="ov-rt-head"><div class="ov-rt-tier tier-${_hubEsc(model.ratings.tier.key)}"><label>${model.ratings.live ? 'Rating so far' : 'Season rating'}</label><strong>${_hubEsc(model.ratings.tier.label)}</strong><em>${model.ratings.score}</em></div>
        <div class="ov-rt-now"><label>Latest episode</label><strong>${model.ratings.latest.overall}</strong><span class="${model.ratings.trend > 0 ? 'up' : model.ratings.trend < 0 ? 'down' : ''}">${model.ratings.trend > 0 ? '▲' : model.ratings.trend < 0 ? '▼' : '—'} ${Math.abs(model.ratings.trend).toFixed(1)}</span></div></div>
      ${_ratingsCurve(model.ratings.weeks)}
      <div class="ov-rt-demos">${model.ratings.demos.map(d => `<div class="ov-rt-demo"><div class="ov-rt-demo-top"><strong>${_hubEsc(d.label)}</strong><em>${Math.round(d.value)}<i class="${d.delta > 0.05 ? 'up' : d.delta < -0.05 ? 'down' : ''}">${Math.abs(d.delta) < 0.05 ? '' : `${d.delta > 0 ? '▲' : '▼'}${Math.abs(d.delta).toFixed(1)}`}</i></em></div>
        <div class="ov-rt-demo-bar"><i style="width:${Math.round(Math.max(0, Math.min(100, d.value)))}%"></i></div>
        <span class="ov-rt-demo-note ${d.note ? (d.noteGood ? 'good' : 'bad') : ''}">${d.note ? _hubEsc(d.note) : 'nothing moved them this week'}</span></div>`).join('')}</div>
      ${_ratingsTable(model.ratings)}
    </section>` : ''}
    ${model.audiencePulse ? `<section class="overview-section overview-audience"><header><div><span>Audience pulse</span><h2>The edit so far</h2></div><small>Viewer perception · not game truth</small></header>
      <p class="overview-disclaimer">How the season is being cut for the audience: screen time, confessionals, and each player's running edit read. The edit can drift from what is really happening — that is the point.</p>
      <div class="overview-edit-list">${(maxShare => model.audiencePulse.players.map(row => `<div class="overview-edit-row">${_overviewPortrait(row.name)}<div class="overview-edit-info"><strong>${_hubEsc(row.name)}</strong><span class="overview-edit-arc">${_hubEsc(row.arc.length > 1 ? row.arc.join(' → ') : row.read)}</span></div><span class="overview-edit-chip edit-${_hubEsc(row.readKey)}">${_hubEsc(row.read)}</span><div class="overview-edit-share"><div class="overview-edit-share-fill" style="width:${Math.round(row.share / maxShare * 100)}%"></div></div><em title="Share of the season's total screen time">${Math.round(row.share * 100)}% screen time</em></div>`).join(''))(Math.max(...model.audiencePulse.players.map(row => row.share), 0.01))}</div>
      ${model.audiencePulse.quotes.length ? `<div class="overview-edit-quotes">${model.audiencePulse.quotes.map(quote => `<blockquote class="overview-edit-quote">${_overviewPortrait(quote.name)}<p>“${_hubEsc(quote.text)}”<cite>— ${_hubEsc(quote.name)}, confessional</cite></p></blockquote>`).join('')}</div>` : ''}
      ${model.audiencePulse.final ? `<div class="overview-edit-awards">${Object.entries({ editWinner: 'Winner edit', decoyFavorite: 'Decoy favorite', biggestVillain: 'Villain of the season', mastermind: 'Mastermind of the season', comicRelief: 'Comic relief', growthArc: 'Growth arc', loveStory: 'Love story', underdogStory: 'Underdog story', mostInvisible: 'Most invisible' }).filter(([key]) => model.audiencePulse.final[key]).map(([key, label]) => `<div class="overview-edit-award">${_overviewPortrait(model.audiencePulse.final[key])}<div><label>${label}</label><strong>${_hubEsc(model.audiencePulse.final[key])}</strong></div></div>`).join('')}</div>` : ''}
    </section>` : ''}
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
    // The Overview becomes the Retrospective on the final episode, and the
    // ratings went with it — the one screen where a whole season's audience
    // story is worth reading was the one screen that dropped it.
    ratings: overview.ratings || null,
    audiencePulse: overview.audiencePulse || null,
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
    ${model.ratings ? `<section class="overview-section overview-ratings"><header><div><span>Audience pulse</span><h2>The ratings, end to end</h2></div><small>Final &middot; ${model.ratings.weeks.length} episodes</small></header>
      <p class="overview-disclaimer">How the season went down with the country, episode by episode. Four audiences watched the same show and wanted different things from it &mdash; the tier is the back-weighted verdict across every episode, not the finale.</p>
      <div class="ov-rt-head"><div class="ov-rt-tier tier-${_hubEsc(model.ratings.tier.key)}"><label>Season rating</label><strong>${_hubEsc(model.ratings.tier.label)}</strong><em>${model.ratings.score}</em></div>
        <div class="ov-rt-now"><label>Final episode</label><strong>${model.ratings.latest.overall}</strong><span class="${model.ratings.trend > 0 ? 'up' : model.ratings.trend < 0 ? 'down' : ''}">${model.ratings.trend > 0 ? '▲' : model.ratings.trend < 0 ? '▼' : '—'} ${Math.abs(model.ratings.trend).toFixed(1)}</span></div></div>
      ${_ratingsCurve(model.ratings.weeks)}
      <div class="ov-rt-demos">${model.ratings.demos.map(d => `<div class="ov-rt-demo"><div class="ov-rt-demo-top"><strong>${_hubEsc(d.label)}</strong><em>${Math.round(d.value)}<i class="${d.delta > 0.05 ? 'up' : d.delta < -0.05 ? 'down' : ''}">${Math.abs(d.delta) < 0.05 ? '' : `${d.delta > 0 ? '▲' : '▼'}${Math.abs(d.delta).toFixed(1)}`}</i></em></div>
        <div class="ov-rt-demo-bar"><i style="width:${Math.round(Math.max(0, Math.min(100, d.value)))}%"></i></div>
        <span class="ov-rt-demo-note ${d.note ? (d.noteGood ? 'good' : 'bad') : ''}">${d.note ? _hubEsc(d.note) : 'nothing moved them at the end'}</span></div>`).join('')}</div>
      ${_ratingsTable(model.ratings)}
    </section>` : ''}
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
  if (resultsTab) resultsTab.textContent = isComplete ? 'Retrospective' : 'Overview';
  if (!isComplete) {
    renderMidseasonOverview();
    return;
  }
  renderSeasonRetrospective();
}


/**
 * What the writer did, said in a way that can be acted on.
 *
 * `written: 0` and "the writer never ran" printed the identical line — just the
 * post count — so a run where the switch was off and a run where the worker
 * refused every post were indistinguishable, from the outside and from the
 * inside. There was nothing to do with that message except ask somebody.
 *
 * Three states, three sentences: not asked, asked and answered, asked and got
 * nothing. The last one is the only one worth investigating, and now it says so
 * rather than looking like success.
 */
function _writerNote(wasOn, res) {
  if (!wasOn) return ' — the AI writer is off, so these are the generated ones';
  const n = Number(res?.written) || 0;
  if (n > 0) {
    // `rejected` is the list of what was thrown out, not a count — reading it as
    // a number gave NaN, which falls to 0, which quietly never mentions any of
    // them. The rejections are the interesting half: they are the posts that
    // named somebody who was not there.
    const no = Array.isArray(res?.rejected) ? res.rejected.length : Number(res?.rejected) || 0;
    return `, ${n} written by the model${no ? ` (${no} rejected as invented)` : ''}`;
  }
  // Four different situations wore one sentence, and it blamed the network for
  // all of them — which sent somebody to check a worker that was answering
  // fine, twice. The reason comes from the place that knows.
  const why = {
    'no-facts': 'nothing in this episode carried a fact worth writing from, so '
      + 'no call was made. Advantages, alliances and key moments are what it '
      + 'writes from; a night that only has a vote has nothing to add',
    'nothing-to-write': 'there was nothing to send',
    'no-endpoint': 'no writer URL is set, so nothing was asked. Set the social '
      + 'writer worker URL, or turn the writer off and the built-in templates '
      + 'will write the season instead',
    'no-answer': 'the worker did not answer. Check it is deployed and reachable',
    'all-rejected': 'every post the model returned was rejected — it named '
      + 'somebody or something that did not happen',
  }[res?.reason] || 'the writer returned nothing usable';
  return ` — ${why}. The generated posts were kept`;
}

/**
 * Redo one episode's audience, and only that one.
 *
 * `refreshSocialFeed` deliberately never rewrites a night that already has a
 * feed — what the audience said about an episode somebody watched is not a
 * thing to re-roll on every refresh. This is the hatch for when you do want it:
 * name the episode, and every other night is left exactly as it is.
 */
export async function redoEpisodeSocial() {
  const note = document.getElementById('redo-social-note');
  const say = msg => { if (note) note.textContent = msg; };
  if (!gs || !gs.initialized) { alert('Load a season first.'); return; }

  const highest = Math.max(
    (gs.episodeHistory || []).length,
    ...(gs.bb?.weeks || []).map(w => Number(w?.num) || 0), 0);
  const asked = prompt(`Which episode's social should be made again? (1–${highest})`,
    String(highest));
  if (!asked) return;
  const ep = Number(asked);
  if (!Number.isFinite(ep) || ep < 1 || ep > highest) { say(`No episode ${asked}.`); return; }

  const written = window.socialWriterOn?.() === true;
  say(written ? `Writing episode ${ep}…` : `Rebuilding episode ${ep}…`);
  try {
    const res = await window.rebuildEpisodeFeed?.(ep);
    const posts = (gs.social?.posts || []).filter(p => Number(p.episode) === ep).length;
    say(`Episode ${ep}: ${posts} posts${_writerNote(written, res)}. Publish to site.`);
  } catch (err) {
    say(`Episode ${ep} could not be rebuilt — ${err?.message || err}`);
  }
}

/**
 * Redo the whole season's audience.
 *
 * For when the generator itself changed rather than one night going wrong —
 * new phrasings, a new sampler, a rota that spreads a season differently. Doing
 * that one episode at a time through the prompt is twenty-six prompts, and
 * nobody does it, so the improvement never reaches the season it was written
 * for.
 *
 * ── what this touches, and what it cannot ──
 *
 * Only the TIMELINE. Birdie's posts are stored — generated once and kept, so
 * engagement can accumulate and the feed you saw is the feed that exists — and
 * stored is exactly why they do not pick up a change to the generator on their
 * own. The alumni room is not stored at all; it is rebuilt from the episode's
 * events every time somebody opens it, so it already reflects every change, on
 * every season, with no button at all.
 *
 * It ASKS, because there is no undo: every post this season holds is thrown
 * away, engagement included, and what comes back is new text with new counts.
 */
export async function rebuildSeasonSocial() {
  const note = document.getElementById('redo-social-note');
  const say = msg => { if (note) note.textContent = msg; };
  if (!gs || !gs.initialized) { alert('Load a season first.'); return; }

  const had = (gs.social?.posts || []).length;
  const eps = (gs.social?.builtEpisodes || []).length;
  const written = window.socialWriterOn?.() === true;
  const ok = confirm(
    `Rebuild the whole season's timeline?\n\n`
    + `${had} posts across ${eps} episode${eps === 1 ? '' : 's'} will be thrown away and `
    + `made again, engagement counts included. There is no undo.\n\n`
    + (written
      ? `The AI writer is on, so this will also re-ask it for every episode.\n\n`
      : '')
    + `The alumni room is not affected — it is rebuilt from the episodes every `
    + `time it is opened, so it is already up to date.`);
  if (!ok) return;

  say(written ? `Writing ${eps} episodes…` : `Rebuilding ${eps} episodes…`);
  try {
    // `rebuild` with no `only` is the whole season — the same call the per-night
    // hatch makes, minus the narrowing.
    const res = written
      ? await window.refreshSocialFeedWritten?.({ rebuild: true })
      : window.refreshSocialFeed?.({ rebuild: true });
    const now = (gs.social?.posts || []).length;
    const builtCount = (res?.built || []).length;
    // A zero says which zero it is. There are two of them and they send you to
    // completely different places: no episodes to read at all, or episodes that
    // yielded nothing worth posting about.
    if (!builtCount) {
      const found = Number(res?.found) || 0;
      const fmt = res?.format === 'big-brother' ? 'Big Brother' : 'Total Drama';
      say(found
        ? `Rebuilt nothing: ${found} episode${found === 1 ? '' : 's'} were read as ${fmt} `
          + `and none of them carried an event worth writing about. If this is the wrong `
          + `show, the season's format is what decides it.`
        : `Rebuilt nothing: no episodes found for ${fmt}. `
          + (res?.format === 'big-brother'
            ? 'The house keeps its weeks in gs.bb.weeks — an empty one means the season has no simulated weeks in this save.'
            : 'The season has no episode history in this save.'));
      saveGameState();
      return;
    }
    say(`Rebuilt ${builtCount} episode${builtCount === 1 ? '' : 's'}: `
      + `${now} posts${_writerNote(written, res)}. Publish to site.`);
    saveGameState();
  } catch (err) {
    say(`The season could not be rebuilt — ${err?.message || err}`);
  }
}
