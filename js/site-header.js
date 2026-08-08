// The site's header: one nav, and one show switcher that follows you around.
//
// WHY THIS EXISTS. The nav was copy-pasted into fourteen pages and had drifted
// into eight variants. The differences were not cosmetic: one slot held either
// Leaderboards OR Compare, never both, so from `seasons.html` you could not
// reach Leaderboards and from `index.html` you could not reach Compare. Two
// whole pages were unreachable from most of the site, and nothing said so.
//
// The show switcher had the same shape of problem. It was mounted separately by
// each page that filters, so your choice died the moment you navigated.
//
// HOW IT ATTACHES. Each page keeps its existing `<nav class="header-nav">` in
// the HTML and adds one script tag. This module rewrites that nav in place. So
// the static markup is the no-JS fallback — if this module never loads you get
// the nav the page shipped with, which is exactly today's behaviour, rather
// than a page you cannot navigate away from. That is also why the nav is not
// built from an empty div: an empty div degrades to nothing.
//
// The CSS already lives in styles.css (`.header-nav`, `.nav-link`), shared by
// thirteen pages. Only the markup was duplicated, so only the markup moves here.
import { SHOWS } from './shows.js';
import { mountShowSwitcher, currentShow, rememberShow, SHOW_SWITCHER_CSS } from './show-switcher.js';

/**
 * The canonical navigation, in order.
 *
 * Eleven entries — the ten every page had, plus whichever of Leaderboards and
 * Compare that page was missing. Every page gets all of them now.
 */
export const NAV_LINKS = [
  { href: 'index.html',            icon: '🏠',  label: 'Home' },
  { href: 'current-season.html',   icon: '📊',  label: 'Current Season' },
  { href: 'voting-analytics.html', icon: '🧾',  label: 'Voting Analytics' },
  { href: 'franchise.html',        icon: '🏛️', label: 'Franchise' },
  { href: 'rankings.html',         icon: '🏆',  label: 'Rankings' },
  { href: 'seasons.html',          icon: '🗂️', label: 'Seasons' },
  { href: 'devotees.html',         icon: '👥',  label: 'Players' },
  { href: 'awards.html',           icon: '🏅',  label: 'Awards' },
  { href: 'leaderboards.html',     icon: '📈',  label: 'Leaderboards' },
  { href: 'compare.html',          icon: '⚔️', label: 'Compare' },
  { href: 'timeline.html',         icon: '🗓️', label: 'Timeline' },
];

/** The page we are on, as a bare filename. Empty path means the index. */
export function currentPage(pathname = window.location.pathname) {
  const file = String(pathname).split('/').pop() || 'index.html';
  return file === '' ? 'index.html' : file;
}

/**
 * Which nav entry should read as current.
 *
 * Detail pages have no nav entry of their own, so they highlight the list they
 * belong to — a player profile is part of Players, a season page part of
 * Seasons. Without this, opening any detail page makes the whole nav look
 * inactive, as though you had left the site.
 */
const BELONGS_TO = {
  'player.html': 'devotees.html',
  'season_ref.html': 'seasons.html',
  'season-awards_ref.html': 'awards.html',
};

export function activeHref(page = currentPage()) {
  if (BELONGS_TO[page]) return BELONGS_TO[page];
  return NAV_LINKS.some(l => l.href === page) ? page : null;
}

const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The nav's inner markup, matching what the pages already ship. */
export function navHtml(active = activeHref()) {
  const items = NAV_LINKS.map(l => {
    const on = l.href === active;
    return `<li class="nav-item"><a href="${esc(l.href)}" class="nav-link${on ? ' active' : ''}"`
      + `${on ? ' aria-current="page"' : ''}>`
      + `<span class="nav-icon">${l.icon}</span><span>${esc(l.label)}</span></a></li>`;
  }).join('');
  return `<ul class="nav-list">${items}</ul>`;
}

export const SITE_HEADER_CSS = `
.site-show-switch{display:flex;justify-content:center;padding:6px 12px 10px;}
@media(max-width:640px){.site-show-switch{padding:4px 8px 8px;}}
`;

/**
 * Rewrite the page's nav and hang the show switcher off it.
 *
 * Safe to call more than once; it replaces rather than appends. Returns the
 * switcher handle, or null when there is no nav on the page (the simulator has
 * none, and that is fine — it is the app, not the site).
 */
export function renderSiteHeader() {
  const nav = document.querySelector('nav.header-nav');
  if (!nav) return null;

  nav.innerHTML = navHtml();

  // The chosen show is remembered for the tab, so it survives navigation. An
  // explicit ?show= in the URL wins over the memory and updates it — links stay
  // shareable, which is the reason the state went into the URL in the first
  // place.
  try { rememberShow(currentShow()); } catch { /* storage can be blocked */ }

  let mount = document.getElementById('site-show-switch');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'site-show-switch';
    mount.className = 'site-show-switch';
    nav.insertAdjacentElement('afterend', mount);
  }

  if (!document.getElementById('site-header-css')) {
    const style = document.createElement('style');
    style.id = 'site-header-css';
    style.textContent = SHOW_SWITCHER_CSS + SITE_HEADER_CSS;
    document.head.appendChild(style);
  }

  // Every show the franchise has, from the registry — not from whatever data
  // this particular page happened to load. A global control that offered a
  // different set of shows per page would be worse than no global control.
  return mountShowSwitcher(mount, {
    formats: Object.keys(SHOWS),
    onChange: show => {
      // Pages that filter listen for this. Pages that do not simply ignore it:
      // a career spans shows, so filtering one would hide half of it.
      window.dispatchEvent(new CustomEvent('showchange', { detail: { show } }));
    },
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSiteHeader, { once: true });
  } else {
    renderSiteHeader();
  }
}
