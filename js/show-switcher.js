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
import { SHOWS, DEFAULT_FORMAT, familyOf } from './shows.js';

export const ALL = 'all';

const MEMORY_KEY = 'dc_show';

/**
 * The show chosen earlier in this tab, if any.
 *
 * sessionStorage, not localStorage, and that is the whole design of the memory:
 * a chosen show follows you across pages for as long as the tab is open, then a
 * fresh visit starts on everything again. Persisting it forever would mean
 * somebody who set it last week returns to a site with half the franchise
 * missing and no memory of hiding it.
 */
export function rememberedShow() {
  try {
    const value = window.sessionStorage.getItem(MEMORY_KEY) || '';
    return SHOWS[value] ? value : null;
  } catch { return null; }           // storage can be blocked or absent
}

/** Remember a show for the rest of this tab. `ALL` clears the memory. */
export function rememberShow(format) {
  try {
    if (SHOWS[format]) window.sessionStorage.setItem(MEMORY_KEY, format);
    else window.sessionStorage.removeItem(MEMORY_KEY);
  } catch { /* storage can be blocked */ }
  return format;
}

/**
 * Which show to show.
 *
 * The URL WINS over the memory, always. An explicit `?show=` is somebody
 * following a shared or bookmarked link, and they should see what the sender
 * saw — which is the entire reason this state went into the URL. The memory
 * only answers when the URL says nothing.
 */
export function currentShow() {
  let value = '';
  try { value = new URLSearchParams(window.location.search).get('show') || ''; } catch { return ALL; }
  if (SHOWS[value]) return value;
  // `?show=all` is an explicit "everything" and must not be overridden by the
  // memory, or you could never get back to all shows without closing the tab.
  if (value === ALL) return ALL;
  return rememberedShow() || ALL;
}

/** Default format first, everything else in the order given. */
export function orderFormats(formats) {
  const list = [...new Set(formats || [])];
  return list.sort((a, b) =>
    (a === DEFAULT_FORMAT ? -1 : 0) - (b === DEFAULT_FORMAT ? -1 : 0));
}

// A dot in the show's own accent rather than its emoji: the network's chrome is
// text and colour, and the emoji read as a prototype beside the real mark.
const labelOf = format => SHOWS[format]
  ? `<i class="show-sw-dot" style="--c:${SHOWS[format].accent || '#A898BD'}" aria-hidden="true"></i>${SHOWS[format].name}`
  : format;

/**
 * Render the control into `mountEl`.
 *
 * With fewer than two formats there is nothing to switch between, so nothing is
 * drawn — a one-show franchise should not carry a switcher.
 */
export function mountShowSwitcher(mountEl, { formats, onChange } = {}) {
  const ordered = orderFormats(formats);
  /* ── A SPIN-OFF IS A TAB UNDER ITS SHOW ──
     Drag Race All Stars is its own show (its own seasons, its own numbering),
     but on the bar it is one button with Drag Race and a second row to switch
     between them, so every spin-off does not cost the navbar another button.
     `families` is the top row: one entry per family, holding the members this
     page actually has, the flagship first. */
  const families = [];
  for (const f of ordered) {
    const fam = familyOf(f);
    let row = families.find(x => x.fam === fam);
    if (!row) families.push(row = { fam, members: [] });
    row.members.push(f);
  }
  for (const row of families) row.members.sort((a, b) => (a === row.fam ? -1 : b === row.fam ? 1 : 0));
  /* A show this page does not have (a spin-off remembered from another page)
     opens on its family's flagship here, never on an empty filter. */
  const fit = show => {
    if (show === ALL || ordered.includes(show)) return show;
    return families.find(x => x.fam === familyOf(show))?.members[0] || ALL;
  };
  const now = () => fit(currentShow());
  const fire = () => { try { onChange?.(now()); } catch (e) { console.warn(e); } };

  const draw = () => {
    if (!mountEl) return;
    if (ordered.length < 2) { mountEl.innerHTML = ''; return; }
    const cur = now();
    const curFam = cur === ALL ? null : familyOf(cur);
    const button = (value, label, on) =>
      `<button type="button" class="show-sw-btn" data-show="${value}" `
      + `aria-pressed="${on}">${label}</button>`;
    const open = families.find(x => x.fam === curFam && x.members.length > 1);
    mountEl.innerHTML = `<div class="show-sw" role="group" aria-label="Filter by show">`
      + button(ALL, 'All shows', cur === ALL)
      + families.map(x => button(x.members[0], labelOf(x.fam in SHOWS ? x.fam : x.members[0]), x.fam === curFam)).join('')
      + `</div>`
      + (open ? `<div class="show-sw-sub" role="group" aria-label="${SHOWS[open.fam]?.name || ''}">`
        + open.members.map(f => button(f, SHOWS[f]?.familyTab || SHOWS[f]?.name || f, f === cur)).join('')
        + `</div>` : '');
  };

  const onClick = e => {
    const btn = e.target.closest('[data-show]');
    if (!btn || !mountEl.contains(btn)) return;
    api.set(btn.dataset.show);
  };
  const onPop = () => { draw(); fire(); };

  const api = {
    current: now,
    set(format) {
      const next = SHOWS[format] ? format : ALL;
      const url = new URL(window.location.href);
      if (next === ALL) url.searchParams.delete('show');
      else url.searchParams.set('show', next);
      window.history.pushState({}, '', url);
      // Remembered for the rest of the tab, so the choice survives navigating to
      // another page. Choosing "all shows" clears it rather than storing "all",
      // so the memory only ever holds a deliberate narrowing.
      rememberShow(next);
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
.show-sw-btn{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;}
.show-sw-dot{width:7px;height:7px;border-radius:50%;background:var(--c);flex:none;}
.show-sw-btn[aria-pressed="true"] .show-sw-dot{box-shadow:0 0 0 1.5px rgba(18,16,26,.55);}
.show-sw-sub{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;padding:3px;width:max-content;max-width:100%;
  border-radius:9px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);}
.show-sw-sub .show-sw-btn{padding:4px 12px;font-size:12px;}
@media(prefers-reduced-motion:reduce){.show-sw-btn{transition:none;}}
`;
