// "Call it": who goes next, called by the visitor, scored when the exit airs.
//
// One open call per airing season, kept in this browser. A call made while the
// season stands at round N is about the NEXT exit: the first exit filed for a
// round after N. A round that sends two home at once (a double eviction, a
// couple dumped together) counts the call if it named either of them. A round
// with no exit leaves the call open -- it was not wrong, nothing happened.
//
// Scored calls stay in a history, which gives the record and the streak the
// page shows back: something to come back for on the night of the next exit.

import { picksForExit } from './kristal-exit.js';

const KEY = 'bs_calls_v1';

export const seasonKey = m => `${m.format}:${m.seasonNumber}`;

/**
 * Score an open call against the exits filed since it was made.
 * Returns { entry, resolved } -- `resolved` is the history row just added, or null.
 */
export function resolveCall(entry = {}, interviews = [], now = Date.now()) {
  const open = entry.open;
  if (!open) return { entry, resolved: null };
  const later = interviews.filter(x => x && x.guest && (x.week ?? 0) > open.round);
  if (!later.length) return { entry, resolved: null };
  const week = Math.min(...later.map(x => x.week ?? 0));
  const out = later.filter(x => (x.week ?? 0) === week).map(x => x.guest);
  const row = { round: open.round, week, pick: open.pick, out, hit: out.includes(open.pick), at: now };
  return { entry: { ...entry, open: null, history: [...(entry.history || []), row] }, resolved: row };
}

/** The record across every season: calls made, hits, the current and best streaks. */
export function callStats(store = {}) {
  const rows = Object.values(store).flatMap(e => e?.history || []).sort((a, b) => (a.at || 0) - (b.at || 0));
  let streak = 0, best = 0;
  for (const r of rows) { streak = r.hit ? streak + 1 : 0; best = Math.max(best, streak); }
  return { made: rows.length, hits: rows.filter(r => r.hit).length, streak, best };
}

export function readCalls(storage = globalThis.localStorage) {
  try { return JSON.parse(storage?.getItem(KEY) || '{}') || {}; } catch { return {}; }
}
export function writeCalls(store, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, JSON.stringify(store)); } catch { /* blocked storage: calls last the visit */ }
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => String(n).split(/[\s-]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const FLAME = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z" fill="currentColor"/></svg>';

function verdictHtml(r, m) {
  const round = (m.words?.round || 'Episode').toLowerCase();
  const who = r.out.join(' and ');
  return r.hit
    ? `<div class="oa-call-verdict is-hit" role="status"><b>You called it.</b> ${esc(r.pick)} went home in ${esc(round)} ${esc(r.week)}.</div>`
    : `<div class="oa-call-verdict is-miss" role="status"><b>Not this time.</b> ${esc(who)} left in ${esc(round)} ${esc(r.week)} — you had ${esc(r.pick)}.</div>`;
}

/** The block: the record, the last verdict, and the cast to call from. */
export function callHtml(m, entry, stats, fresh) {
  const round = m.words?.round || 'Episode';
  const pool = [...(m.stillIn || []), ...(m.island || [])];
  const open = entry?.open;
  const pending = open && open.round < m.episode;
  const record = stats.made
    ? `<span class="oa-call-rec"><b>${stats.hits}</b> of ${stats.made} called${stats.streak > 1 ? ` <span class="oa-call-streak">${FLAME}${stats.streak} in a row</span>` : ''}</span>`
    : '<span class="oa-call-rec">Your first call</span>';
  // The last guest's own answer to "who goes next?", quoted from the interview.
  const next = m.latestExit ? picksForExit(m.format, m.seasonNumber, m.latestExit).next : null;
  const hint = next
    ? `<p class="oa-call-hint">${esc(m.latestExit.guest)} named <b>${esc(next)}</b> to go next on Kristal-talKs.</p>` : '';
  const state = open
    ? `<p class="oa-call-lock">${pending ? `Still waiting on your ${esc(round.toLowerCase())} ${esc(open.round + 1)} call:` : 'Locked in:'} <b>${esc(open.pick)}</b> goes next. <button type="button" class="oa-call-change">Change</button></p>`
    : `<p class="oa-call-lock">Who leaves in ${esc(round.toLowerCase())} ${esc((Number(m.episode) || 0) + 1)}? Tap a face.</p>`;
  return `<section class="oa-call" aria-labelledby="oaCallTitle-${esc(m.format)}">
    <div class="oa-head"><h2 id="oaCallTitle-${esc(m.format)}">Call it</h2>${record}</div>
    ${fresh ? verdictHtml(fresh, m) : ''}
    ${state}${hint}
    <div class="oa-call-pool${open ? ' is-locked' : ''}" role="group" aria-label="Who goes next">${pool.map(p => `
      <button type="button" class="oa-call-pick" data-pick="${esc(p.name)}" aria-pressed="${open?.pick === p.name}">
        <span class="oa-face"><img src="${esc(p.portrait)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'${esc(initials(p.name))}'}))"></span>
        <span>${esc(p.name)}</span></button>`).join('')}</div>
  </section>`;
}

/** Score, draw and wire the call for one show into `slot`. */
export function mountCall(slot, m, interviews = []) {
  if (!slot || !m?.airing) return;
  const store = readCalls();
  const k = seasonKey(m);
  const { entry, resolved } = resolveCall(store[k] || {}, interviews);
  if (resolved) { store[k] = { ...entry, fresh: resolved }; writeCalls(store); }
  const draw = (unlock = false) => {
    const now = readCalls();
    const e = now[k] || {};
    slot.innerHTML = callHtml(m, unlock ? { ...e, open: null } : e, callStats(now), e.fresh || null);
    slot.querySelector('.oa-call-change')?.addEventListener('click', () => draw(true));
    slot.querySelectorAll('.oa-call-pick').forEach(b => b.addEventListener('click', () => {
      if (slot.querySelector('.oa-call-pool.is-locked')) return;
      const s = readCalls();
      s[k] = { ...(s[k] || {}), open: { round: Number(m.episode) || 0, pick: b.dataset.pick, at: Date.now() }, fresh: null };
      writeCalls(s);
      draw();
    }));
  };
  draw();
}
