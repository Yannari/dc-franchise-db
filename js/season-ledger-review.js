import { addManualEvent, editEvent, setEventReview, validateLedger } from './season-event-ledger.js';

const states = new WeakMap();
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
const slug = name => String(name || '').toLowerCase().trim().replace(/['".]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const list = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean);
const reviewStatus = event => event.review?.status || 'pending';

const TYPE_OPTIONS = [
  'vote.cast', 'elimination', 'challenge.win', 'advantage.action', 'alliance.formed', 'alliance.changed',
  'relationship.changed', 'strategy.pitch', 'strategy.target', 'narrative.beat', 'assessment.best-move',
  'assessment.biggest-risk', 'assessment.voting-bloc',
];
const PHASE_OPTIONS = ['camp', 'challenge', 'tribal', 'aftermath', 'analysis', 'episode'];

function face(name) {
  const id = slug(name);
  return `<span class="ledger-face" title="${esc(name)}"><img src="assets/avatars/${id}.png" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><b hidden>${esc(String(name || '?')[0])}</b></span><span class="ledger-person-name">${esc(name)}</span>`;
}

function people(event) {
  const actors = (event.actors || []).map(face).join('');
  const targets = (event.targets || []).map(face).join('');
  if (!actors && !targets) return '';
  return `<div class="ledger-people">${actors || '<span class="ledger-none">Outcome</span>'}${targets ? '<span class="ledger-arrow" aria-label="affects">→</span>' + targets : ''}</div>`;
}

function optionList(values, selected) {
  const options = values.includes(selected) ? values : [selected, ...values].filter(Boolean);
  return options.map(value => `<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(value)}</option>`).join('');
}

function editor(event, state) {
  return `<form class="ledger-editor" data-event-form="${esc(event.id)}">
    <div class="ledger-form-grid">
      <label>Event type<select name="type">${optionList(TYPE_OPTIONS, event.type)}</select></label>
      <label>Episode phase<select name="phase">${optionList(PHASE_OPTIONS, event.phase)}</select></label>
      <label>Actors <span>comma-separated</span><input name="actors" value="${esc((event.actors || []).join(', '))}"></label>
      <label>Targets <span>comma-separated</span><input name="targets" value="${esc((event.targets || []).join(', '))}"></label>
    </div>
    <label>Description<textarea name="description" rows="3">${esc(event.description)}</textarea></label>
    <label>Correction note <span>why the source needed correction</span><input name="note" value="${esc(event.review?.note || '')}"></label>
    <div class="ledger-editor-actions"><button class="btn btn-primary" type="button" data-action="save-edit" data-id="${esc(event.id)}" data-episode="${event.episode}">Save correction</button><button class="btn btn-ghost" type="button" data-action="cancel-edit">Cancel</button></div>
    ${state.message ? `<div class="ledger-error" role="alert">${esc(state.message)}</div>` : ''}
  </form>`;
}

function eventCard(event, state) {
  if (state.editId === event.id) return `<article class="ledger-event editing">${editor(event, state)}</article>`;
  const kind = event.provenance?.kind || 'unknown';
  const status = reviewStatus(event);
  const kindLabel = kind === 'recorded' ? 'Recorded fact' : kind === 'ai-inferred' ? 'AI assessment' : kind === 'manual' ? 'Manually verified' : kind;
  return `<article class="ledger-event ${status}" data-event-id="${esc(event.id)}">
    <div class="ledger-event-head">
      <div class="ledger-badges"><span class="ledger-kind ${esc(kind)}">${esc(kindLabel)}</span><span class="ledger-state ${esc(status)}">${esc(status)}</span><span class="ledger-type">${esc(event.type)}</span></div>
      <span class="ledger-phase">${esc(event.phase)}</span>
    </div>
    ${people(event)}
    <p class="ledger-description">${esc(event.description)}</p>
    ${event.review?.note ? `<p class="ledger-review-note"><b>Reviewer note:</b> ${esc(event.review.note)}</p>` : ''}
    <details class="ledger-source"><summary>Why this is in the ledger</summary>
      <div><b>Source:</b> ${esc(event.provenance?.source || 'unknown')} · ${esc(event.provenance?.section || 'unspecified')}</div>
      ${event.provenance?.excerpt ? `<blockquote>${esc(event.provenance.excerpt)}</blockquote>` : '<div>No source excerpt was retained.</div>'}
      <div><b>Confidence:</b> ${Math.round(Number(event.provenance?.confidence || 0) * 100)}%</div>
    </details>
    <div class="ledger-actions">
      <button type="button" class="ledger-action confirm" data-action="confirm" data-id="${esc(event.id)}" data-episode="${event.episode}"${status === 'confirmed' ? ' disabled' : ''}>Confirm</button>
      <button type="button" class="ledger-action" data-action="edit" data-id="${esc(event.id)}">Correct</button>
      <button type="button" class="ledger-action reject" data-action="reject" data-id="${esc(event.id)}" data-episode="${event.episode}"${status === 'rejected' ? ' disabled' : ''}>Reject</button>
    </div>
  </article>`;
}

function manualForm(state, currentEpisode) {
  if (!state.adding) return '';
  return `<form class="ledger-manual" id="ledgerManualForm">
    <div class="ledger-manual-title">Add a missing event <span>This becomes a confirmed manual fact.</span></div>
    <div class="ledger-form-grid">
      <label>Episode<input name="episode" type="number" min="1" value="${Number(currentEpisode) || 1}"></label>
      <label>Event type<select name="type">${optionList(TYPE_OPTIONS, 'narrative.beat')}</select></label>
      <label>Episode phase<select name="phase">${optionList(PHASE_OPTIONS, 'camp')}</select></label>
      <label>Actors <span>comma-separated</span><input name="actors"></label>
      <label>Targets <span>comma-separated</span><input name="targets"></label>
    </div>
    <label>Description<textarea name="description" rows="3" required></textarea></label>
    <label>Reviewer note<input name="note" placeholder="Where this fact came from or why it was missing"></label>
    <div class="ledger-editor-actions"><button class="btn btn-primary" type="button" data-action="save-manual">Add confirmed event</button><button class="btn btn-ghost" type="button" data-action="cancel-add">Cancel</button></div>
    ${state.message ? `<div class="ledger-error" role="alert">${esc(state.message)}</div>` : ''}
  </form>`;
}

function filteredEvents(ledger, state, currentEpisode) {
  const episodeFilter = state.episode === 'current' ? String(currentEpisode) : state.episode;
  const events = [];
  Object.values(ledger?.episodes || {}).forEach(record => (record.events || []).forEach(event => events.push(event)));
  return events.filter(event => {
    if (episodeFilter !== 'all' && String(event.episode) !== String(episodeFilter)) return false;
    if (state.kind !== 'all' && event.provenance?.kind !== state.kind) return false;
    if (state.status !== 'all' && reviewStatus(event) !== state.status) return false;
    const haystack = [event.type, event.phase, event.description, ...(event.actors || []), ...(event.targets || [])].join(' ').toLowerCase();
    return !state.search || haystack.includes(state.search.toLowerCase());
  }).sort((a, b) => {
    const priority = { pending:0, rejected:1, confirmed:2 };
    return Number(b.episode) - Number(a.episode) || priority[reviewStatus(a)] - priority[reviewStatus(b)];
  });
}

export function renderLedgerReview(container, options) {
  if (!container) return;
  const state = states.get(container) || { episode:'current', kind:'all', status:'all', search:'', editId:null, adding:false, message:'' };
  states.set(container, state);
  const ledger = options.ledger;
  const allEvents = Object.values(ledger?.episodes || {}).flatMap(record => record.events || []);
  const visible = filteredEvents(ledger, state, options.currentEpisode);
  const pending = allEvents.filter(event => reviewStatus(event) === 'pending').length;
  const confirmed = allEvents.filter(event => reviewStatus(event) === 'confirmed').length;
  const rejected = allEvents.filter(event => reviewStatus(event) === 'rejected').length;
  const episodes = Object.keys(ledger?.episodes || {}).sort((a, b) => Number(a) - Number(b));
  const validation = ledger ? validateLedger(ledger) : { valid:true, errors:[], warnings:[] };

  container.innerHTML = `<div class="ledger-review-shell">
    <header class="ledger-review-head"><div><div class="ledger-eyebrow">SEASON ${Number(ledger?.season || options.season || 1)} · EVIDENCE DESK</div><h3>Review what the analytics believes happened</h3><p>Recorded facts keep their source. AI assessments stay labelled. Corrections never erase the original extraction.</p></div><button class="btn btn-primary" type="button" data-action="add">Add missing event</button></header>
    <div class="ledger-scoreboard"><div><b>${pending}</b><span>Needs review</span></div><div><b>${confirmed}</b><span>Confirmed</span></div><div><b>${rejected}</b><span>Rejected</span></div><div class="${validation.valid ? 'valid' : 'invalid'}"><b>${validation.valid ? '✓' : validation.errors.length}</b><span>${validation.valid ? 'Ledger valid' : 'Data errors'}</span></div></div>
    ${manualForm(state, options.currentEpisode)}
    <div class="ledger-filters" aria-label="Ledger filters">
      <label>Episode<select data-filter="episode"><option value="current"${state.episode === 'current' ? ' selected' : ''}>Current episode</option><option value="all"${state.episode === 'all' ? ' selected' : ''}>All episodes</option>${episodes.map(ep => `<option value="${ep}"${state.episode === ep ? ' selected' : ''}>Episode ${ep}</option>`).join('')}</select></label>
      <label>Evidence<select data-filter="kind"><option value="all">All evidence</option><option value="recorded"${state.kind === 'recorded' ? ' selected' : ''}>Recorded facts</option><option value="ai-inferred"${state.kind === 'ai-inferred' ? ' selected' : ''}>AI assessments</option><option value="manual"${state.kind === 'manual' ? ' selected' : ''}>Manual corrections</option></select></label>
      <label>Review state<select data-filter="status"><option value="all">All states</option><option value="pending"${state.status === 'pending' ? ' selected' : ''}>Needs review</option><option value="confirmed"${state.status === 'confirmed' ? ' selected' : ''}>Confirmed</option><option value="rejected"${state.status === 'rejected' ? ' selected' : ''}>Rejected</option></select></label>
      <label class="ledger-search">Search<input data-filter="search" value="${esc(state.search)}" placeholder="player, target, event…"></label>
    </div>
    <div class="ledger-result-line"><b>${visible.length}</b> matching event${visible.length === 1 ? '' : 's'}${pending ? ` · ${pending} still need a decision` : ' · review complete'}</div>
    <div class="ledger-event-list">${visible.length ? visible.map(event => eventCard(event, state)).join('') : `<div class="ledger-empty"><b>No events match this view.</b><span>${ledger ? 'Change a filter or add the missing event manually.' : 'Generate or load episode analytics to create the ledger.'}</span></div>`}</div>
  </div>`;

  const rerender = () => renderLedgerReview(container, options);
  container.oninput = event => {
    const filter = event.target.dataset.filter;
    if (!filter) return;
    state[filter] = event.target.value;
    if (filter === 'search') rerender();
  };
  container.onchange = event => {
    const filter = event.target.dataset.filter;
    if (!filter) return;
    state[filter] = event.target.value;
    rerender();
  };
  container.onclick = async event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    state.message = '';
    if (action === 'add') { state.adding = true; state.editId = null; return rerender(); }
    if (action === 'cancel-add') { state.adding = false; return rerender(); }
    if (action === 'edit') { state.editId = button.dataset.id; state.adding = false; return rerender(); }
    if (action === 'cancel-edit') { state.editId = null; return rerender(); }
    try {
      let next = options.ledger;
      if (action === 'confirm' || action === 'reject') next = setEventReview(next, Number(button.dataset.episode), button.dataset.id, action === 'confirm' ? 'confirmed' : 'rejected');
      if (action === 'save-edit') {
        const form = container.querySelector(`[data-event-form="${CSS.escape(button.dataset.id)}"]`);
        const data = new FormData(form);
        next = editEvent(next, Number(button.dataset.episode), button.dataset.id, { type:data.get('type'), phase:data.get('phase'), actors:list(data.get('actors')), targets:list(data.get('targets')), description:data.get('description'), note:data.get('note') });
        state.editId = null;
      }
      if (action === 'save-manual') {
        const form = container.querySelector('#ledgerManualForm');
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        next = addManualEvent(next, Number(data.get('episode')), { type:data.get('type'), phase:data.get('phase'), actors:list(data.get('actors')), targets:list(data.get('targets')), description:data.get('description'), note:data.get('note') });
        state.adding = false;
      }
      if (next !== options.ledger) {
        options.ledger = await options.onChange(next);
        rerender();
      }
    } catch (error) {
      state.message = error?.message || String(error);
      rerender();
    }
  };
}
