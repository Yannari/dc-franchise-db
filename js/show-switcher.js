// js/show-switcher.js
// Which show you are looking at.
//
// This module holds NO list of shows. The formats come from whatever data the
// calling page loaded, and the labels come from the registry in js/shows.js, so
// a third show appears in the control without a line changing here. That is the
// whole point: the format-to-prefix map was already duplicated three times
// across this codebase, and one of those copies decided season filenames.
//
// The state lives in the URL so a view is shareable, back and forward work, and
// a filtered page can be tested by loading a link rather than by driving clicks.
import { SHOWS, DEFAULT_FORMAT } from './shows.js';

export const ALL = 'all';

/** The show the URL is asking for. Anything unrecognised means everything. */
export function currentShow() {
  let value = '';
  try { value = new URLSearchParams(window.location.search).get('show') || ''; } catch { return ALL; }
  return SHOWS[value] ? value : ALL;
}

/** Default format first, everything else in the order given. */
export function orderFormats(formats) {
  const list = [...new Set(formats || [])];
  return list.sort((a, b) =>
    (a === DEFAULT_FORMAT ? -1 : 0) - (b === DEFAULT_FORMAT ? -1 : 0));
}

const labelOf = format => SHOWS[format]
  ? `${SHOWS[format].emoji} ${SHOWS[format].name}`
  : format;

/**
 * Render the control into `mountEl`.
 *
 * With fewer than two formats there is nothing to switch between, so nothing is
 * drawn — a one-show franchise should not carry a switcher.
 */
export function mountShowSwitcher(mountEl, { formats, onChange } = {}) {
  const ordered = orderFormats(formats);
  const fire = () => { try { onChange?.(currentShow()); } catch (e) { console.warn(e); } };

  const draw = () => {
    if (!mountEl) return;
    if (ordered.length < 2) { mountEl.innerHTML = ''; return; }
    const now = currentShow();
    const button = (value, label) =>
      `<button type="button" class="show-sw-btn" data-show="${value}" `
      + `aria-pressed="${value === now}">${label}</button>`;
    mountEl.innerHTML = `<div class="show-sw" role="group" aria-label="Filter by show">`
      + button(ALL, 'All shows')
      + ordered.map(f => button(f, labelOf(f))).join('')
      + `</div>`;
  };

  const onClick = e => {
    const btn = e.target.closest('[data-show]');
    if (!btn || !mountEl.contains(btn)) return;
    api.set(btn.dataset.show);
  };
  const onPop = () => { draw(); fire(); };

  const api = {
    current: currentShow,
    set(format) {
      const next = SHOWS[format] ? format : ALL;
      const url = new URL(window.location.href);
      if (next === ALL) url.searchParams.delete('show');
      else url.searchParams.set('show', next);
      window.history.pushState({}, '', url);
      draw();
      fire();
    },
    destroy() {
      mountEl?.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
    },
  };

  mountEl?.addEventListener('click', onClick);
  window.addEventListener('popstate', onPop);
  draw();
  return api;
}

/** Styles, injected by whichever page mounts the switcher. */
export const SHOW_SWITCHER_CSS = `
.show-sw{display:inline-flex;gap:4px;padding:4px;border-radius:10px;
  background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);}
.show-sw-btn{appearance:none;border:0;cursor:pointer;padding:6px 14px;border-radius:7px;
  font:inherit;font-size:13px;font-weight:600;color:rgba(255,255,255,0.62);background:transparent;
  transition:background .15s ease,color .15s ease;}
.show-sw-btn:hover{color:#fff;background:rgba(255,255,255,0.07);}
.show-sw-btn[aria-pressed="true"]{color:#12101a;background:linear-gradient(135deg,#ffd76a,#ffa726);}
@media(prefers-reduced-motion:reduce){.show-sw-btn{transition:none;}}
`;
