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
 * The canonical navigation, in order: what a VISITOR to Blindside Network
 * looks for. Text only -- the emoji that stood in for icons read as a
 * prototype once the site had a real mark.
 *
 * The creator's own rooms (the season control room, the Life inbox) are not
 * here; they are under STUDIO_LINKS, one click away in the header.
 */
import { latestAired, airLabel, airKey } from './franchise-calendar.js';
export const NAV_LINKS = [
  { href: 'index.html',            label: 'Home' },
  { href: 'on-air.html',           label: 'On Air' },
  { href: 'seasons.html',          label: 'Seasons' },
  { href: 'devotees.html',         label: 'Players' },
  // ONE ENTRY FOR FIVE PAGES.
  //
  // Rankings, Leaderboards, Awards, Compare and the franchise statistics are
  // answers to one question -- who is best, and what happened -- and they took
  // a third of the bar between them. They keep their own pages; the nav offers
  // RECORDS and they link to each other through the strip below.
  { href: 'rankings.html',         label: 'Records' },
  { href: 'social.html',           label: 'Social' },
  { href: 'timeline.html',         label: 'Timeline' },
];

/**
 * The creator's rooms, under the Studio menu beside the Simulator link.
 * `badge` names a counter the menu carries; resolved after the header paints,
 * so a slow or missing count never delays it.
 */
export const STUDIO_LINKS = [
  { href: 'simulator.html',       label: 'Simulator',            note: 'Make and play seasons' },
  { href: 'current-season.html',  label: 'Season control room',  note: 'Sync, analytics, publish' },
  { href: 'life.html',            label: 'Life inbox',           note: 'Approve the off-season', badge: 'life' },
];

/**
 * Pages that sit under one nav entry, as a strip of their own.
 *
 * Keyed by the nav href they belong to, so adding a page to a section is one
 * line here rather than an edit to every document in it.
 */
export const SUB_NAV = {
  'rankings.html': [
    { href: 'rankings.html',     label: 'Rankings' },
    { href: 'leaderboards.html', label: 'Leaderboards' },
    { href: 'awards.html',       label: 'Awards' },
    { href: 'compare.html',      label: 'Compare' },
    { href: 'franchise.html',    label: 'Franchise stats' },
  ],
};

/** The page we are on, as a bare filename. Empty path means the index. */
export function currentPage(pathname = window.location.pathname) {
  const file = String(pathname).split('/').pop() || 'index.html';
  // A clean address ("/timeline") is the page of the same name.
  return file.includes('.') ? file : file + '.html';
}

// ── CLEAN ADDRESSES ──
//
// blindsidenetwork.com/timeline, not /timeline.html. The files keep their names
// (every link, test and cached copy uses them); the address bar drops the
// extension once the page is open, and the nav links without it. Only where the
// server answers the clean spelling: the Cloudflare copy (worker/site.js) and
// GitHub Pages do, a local server and a file:// page do not.

/** True where /timeline is answered with timeline.html. */
export function servesCleanUrls(loc = window.location) {
  return /^https?:$/.test(loc.protocol) && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(loc.hostname);
}

/** "timeline.html" -> "timeline", "index.html" -> "./" (an empty href is this page). */
export function cleanHref(href) {
  if (href === 'index.html') return './';
  return String(href).replace(/(^|\/)index\.html$/, '$1').replace(/\.html(?=$|[?#])/, '');
}

/** Drop .html from the address bar, keeping the query and the hash. */
export function cleanAddress(loc = window.location, hist = window.history) {
  if (!servesCleanUrls(loc) || !/\.html$/i.test(loc.pathname)) return;
  // A full path here, never "./": "/index.html" -> "/", "/timeline.html" -> "/timeline".
  const path = loc.pathname.replace(/(^|\/)index\.html$/i, '$1').replace(/\.html$/i, '');
  try { hist.replaceState(hist.state, '', path + loc.search + loc.hash); }
  catch { /* the address is cosmetic */ }
}

const linkHref = href => (typeof window !== 'undefined' && servesCleanUrls() ? cleanHref(href) : href);

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
  // Awards is no longer its own nav entry, so its detail page belongs to the
  // one that now covers it.
  'season-awards_ref.html': 'rankings.html',
  'leaderboards.html': 'rankings.html',
  'awards.html': 'rankings.html',
  'compare.html': 'rankings.html',
  'franchise.html': 'rankings.html',
  // The rest of the social family: Birdie's neighbours on the network.
  'kristal.html': 'social.html',
  'dramagram.html': 'social.html',
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
    return `<li class="nav-item"><a href="${esc(linkHref(l.href))}" class="nav-link${on ? ' active' : ''}"`
      + `${on ? ' aria-current="page"' : ''}>`
      + `<span>${esc(l.label)}</span></a></li>`;
  }).join('');
  return `<ul class="nav-list">${items}</ul>`;
}

export const SITE_HEADER_CSS = `
.site-show-switch{display:flex;justify-content:center;padding:6px 12px 10px;}
@media(max-width:640px){.site-show-switch{padding:4px 8px 8px;}}
/* WHAT YEAR IT IS IN THERE.
   The franchise has a calendar and nothing ever said so out loud: you could
   infer the year from a wiki infobox or a group header on the Life page, and
   latestAired() was exported and called by nothing. Quiet, beside the show
   switcher, on every page. */
.site-now{display:flex;justify-content:center;padding:0 12px 8px;}
.site-now span{font-size:12px;letter-spacing:.06em;text-transform:uppercase;
  color:rgba(255,255,255,.45);border:1px solid rgba(255,255,255,.10);
  border-radius:999px;padding:4px 12px;}
.site-now b{color:rgba(255,255,255,.78);font-weight:700;letter-spacing:.04em;}
/* THE COUNT OF THINGS WAITING, the way a phone does it.
   Hidden until there is a number: an empty badge is a permanent dot that stops
   meaning anything, which is the opposite of what a badge is for.

   Built from the brand gradient rather than a flat alert red. A stop-sign
   circle bolted onto a purple-and-gold header reads as a browser artefact — it
   has to look like it was always part of the bar, while still being the one
   thing on it that pulls the eye. The glow does that job instead of the hue. */
.nav-badge{display:inline-flex;align-items:center;justify-content:center;
  min-width:17px;height:17px;padding:0 5px;margin-left:7px;border-radius:999px;
  background:linear-gradient(135deg,#FF4CE6 0%,#7D4CFF 100%);
  color:#fff;font-size:10.5px;font-weight:800;line-height:1;letter-spacing:.02em;
  vertical-align:middle;translate:0 -1px;
  box-shadow:0 0 0 1px rgba(255,255,255,.14) inset,
             0 2px 8px rgba(255,76,230,.45);}
.nav-link.active .nav-badge{box-shadow:0 0 0 1px rgba(255,255,255,.22) inset,
  0 2px 10px rgba(255,76,230,.6);}
.nav-badge[hidden]{display:none;}
@media(prefers-reduced-motion:no-preference){
  /* One pulse on arrival, not a loop: it should catch your eye when the page
     loads and then stop asking for attention. */
  .nav-badge{animation:nav-badge-in .45s ease-out;}
  @keyframes nav-badge-in{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
}
/* The strip that ties the four records pages together. Quieter than the main
   nav on purpose: it is where you are WITHIN a section, not which section. */
.site-subnav{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;padding:0 12px 10px;}
.site-subnav a{display:block;padding:6px 13px;border-radius:999px;text-decoration:none;
  font-size:13.5px;font-weight:600;color:rgba(255,255,255,.62);
  border:1px solid transparent;}
.site-subnav a:hover{color:#fff;background:rgba(255,255,255,.06);}
.site-subnav a.is-on{color:#fff;background:rgba(125,76,255,.20);
  border-color:rgba(125,76,255,.55);}
`;

/**
 * The Studio menu: the creator's rooms, beside the Simulator link.
 *
 * A <details> so it opens without script and closes on a second click; the
 * life badge sits on the summary, because the inbox is inside the menu.
 */
export function studioHtml(page = currentPage()) {
  const items = STUDIO_LINKS.map(l => `<a href="${esc(linkHref(l.href))}"${l.href === page ? ' aria-current="page"' : ''}>`
    + `<b>${esc(l.label)}</b><span>${esc(l.note)}</span></a>`).join('');
  const badge = STUDIO_LINKS.find(l => l.badge)?.badge;
  return `<details class="bs-studio"><summary>Studio`
    + (badge ? `<span class="nav-badge" data-badge="${esc(badge)}" hidden></span>` : '')
    + `</summary><div class="bs-studio-panel">${items}</div></details>`;
}

const STUDIO_CSS = `
.header-top{gap:16px}
.bs-actions{display:flex;align-items:center;gap:10px;margin-left:auto}
.bs-studio{position:relative}
.bs-studio summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;
  font:600 13px/1 "Instrument Sans",system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;
  color:rgba(243,238,249,.78);padding:9px 12px;border-radius:999px}
.bs-studio summary::-webkit-details-marker{display:none}
.bs-studio summary::after{content:"";width:6px;height:6px;border:solid currentColor;border-width:0 1.5px 1.5px 0;
  transform:translateY(-2px) rotate(45deg);margin-left:2px}
.bs-studio summary:hover,.bs-studio[open] summary{color:#fff;background:rgba(255,255,255,.07)}
.bs-studio summary:focus-visible{outline:2px solid #FFC23D;outline-offset:2px}
.bs-studio-panel{position:absolute;right:0;top:calc(100% + 8px);z-index:1100;width:260px;display:grid;padding:6px;
  background:#170e24;border:1px solid rgba(255,255,255,.12);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.55)}
.bs-studio-panel a{display:grid;gap:2px;padding:10px 12px;border-radius:10px;text-decoration:none;color:#F3EEF9}
.bs-studio-panel a:hover,.bs-studio-panel a:focus-visible{background:rgba(255,62,165,.12)}
.bs-studio-panel a[aria-current]{background:rgba(123,92,255,.18)}
.bs-studio-panel b{font-weight:600;font-size:14px}
.bs-studio-panel span{font-size:12px;color:#A898BD}
@media (max-width:640px){.bs-studio summary{padding:8px 8px;font-size:12px}}
@media (max-width:440px){.header-top{gap:8px}.bs-actions{gap:4px}.bs-studio summary{padding:6px 6px;font-size:11px;letter-spacing:.06em}}
/* The show switcher is wider than a phone: let it scroll inside its own row. */
@media (max-width:760px){.site-show-switch{justify-content:flex-start;overflow-x:auto;scrollbar-width:none}.site-show-switch::-webkit-scrollbar{display:none}}
`;

/** Put the Studio menu beside the Simulator link (once). */
export function mountStudio(root = document) {
  const sim = root.querySelector('.header-top .bs-sim');
  if (!sim || root.querySelector('.bs-studio')) return;
  const actions = document.createElement('div');
  actions.className = 'bs-actions';
  sim.replaceWith(actions);
  actions.innerHTML = studioHtml();
  actions.appendChild(sim);
  // Close on a click elsewhere, or Escape: a menu that stays open over the page
  // after you have moved on reads as broken.
  const menu = actions.querySelector('.bs-studio');
  document.addEventListener('click', e => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
}

/** The sub-strip for the section this page is in, or '' when it has none. */
export function subNavHtml(page = currentPage()) {
  const links = SUB_NAV[activeHref(page)];
  if (!links) return '';
  return `<nav class="site-subnav" aria-label="Section">${links.map(l =>
    `<a href="${esc(linkHref(l.href))}"${l.href === page ? ' class="is-on" aria-current="page"' : ''}>${
      esc(l.label)}</a>`).join('')}</nav>`;
}

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
  mountStudio();

  // The chosen show is remembered for the tab, so it survives navigation. An
  // explicit ?show= in the URL wins over the memory and updates it — links stay
  // shareable, which is the reason the state went into the URL in the first
  // place.
  try { rememberShow(currentShow()); } catch { /* storage can be blocked */ }

  // The section strip, directly under the main nav, on the pages that have one.
  const sub = subNavHtml();
  let subMount = document.getElementById('site-subnav');
  if (sub) {
    if (!subMount) {
      subMount = document.createElement('div');
      subMount.id = 'site-subnav';
      nav.insertAdjacentElement('afterend', subMount);
    }
    subMount.innerHTML = sub;
  } else if (subMount) {
    subMount.remove();
  }

  // ── what year it is in there ──
  stampNow(nav);

  // ── the counters ──
  //
  // Filled after the nav is on screen and never awaited: the header must not
  // wait on a fetch, and a franchise with no life events simply has no badge.
  paintBadges(nav);

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
    style.textContent = SHOW_SWITCHER_CSS + SITE_HEADER_CSS + STUDIO_CSS;
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

/**
 * The franchise's in-world date: the end of the most recent season aired.
 *
 * Derived, never stored — a saved "current year" is a second clock and two
 * clocks disagree. Silent when no season has been placed on the calendar, which
 * is the correct answer for a franchise that has not been dated.
 */
export async function stampNow(nav) {
  if (!nav || document.getElementById('site-now')) return;
  try {
    const doc = await fetch('seasons_database.json').then(r => (r.ok ? r.json() : null));
    const latest = latestAired(doc?.seasons || []);
    const label = airLabel(latest || {});
    if (!label) return;
    const el = document.createElement('div');
    el.id = 'site-now';
    el.className = 'site-now';
    el.innerHTML = `<span title="${esc(latest.title || latest.seasonId || '')}">`
      + `Now &nbsp;<b>${esc(label)}</b></span>`;
    (document.getElementById('site-show-switch') || nav).insertAdjacentElement('afterend', el);
    // A season ON THE AIR is later than every finished one. Without this the
    // pill said "Spring 2027" while On Air showed a Summer 2027 season airing.
    // Drawn from the database first, moved forward when the live feeds answer.
    const airing = await airingWindow();
    if (airing && airKey(airing) > (airKey(latest) ?? -Infinity)) {
      el.innerHTML = `<span title="${esc(airing.title || '')} is on air">Now &nbsp;<b>${esc(airLabel(airing))}</b></span>`;
    }
  } catch { /* the date is a nicety; the header is not */ }
}

/** The airing season's air window, from the live feeds, or null. Never throws. */
async function airingWindow() {
  try {
    let base = 'https://dc-studio.yannari19.workers.dev';
    try { base = (localStorage.getItem('studio_api_base') || base).replace(/\/+$/, ''); } catch {}
    const get = u => fetch(u).then(r => (r.ok ? r.json() : null)).catch(() => null);
    const [live, exits] = await Promise.all([get(base + '/api/live-season'), get(base + '/api/live-exits')]);
    if (!live?.airing) return null;
    const same = (exits?.seasons || []).filter(x => Number(x.seasonNumber) === Number(live.seasonNumber));
    const hit = same.find(x => x.updatedAt === live.updatedAt) || same[0];
    return hit?.airYear && hit?.airSlot ? hit : null;
  } catch { return null; }
}

/**
 * How many life events are waiting for a decision.
 *
 * UNDECIDED, not "what your policy would hold" — the same number the inbox's
 * own bar shows, because a badge that disagrees with the page it points at is
 * worse than no badge. Counted from the log rather than stored, so approving
 * something in one tab and reloading another is enough to clear it.
 */
export async function lifeBadgeCount() {
  try {
    const doc = await fetch('life_events.json').then(r => (r.ok ? r.json() : null));
    return (doc?.events || []).filter(e => e?.status === 'proposed').length;
  } catch {
    return 0;
  }
}

/** Fill any badge the nav declared. Failure is silent and leaves it hidden. */
export async function paintBadges(root = document) {
  // The counter sits on the Studio menu, in the header around the nav.
  const scope = root.closest?.('header') || root;
  const el = scope.querySelector?.('[data-badge="life"]');
  if (!el) return;
  const n = await lifeBadgeCount();
  if (!n) { el.hidden = true; return; }
  el.textContent = n > 99 ? '99+' : String(n);
  el.hidden = false;
  el.setAttribute('aria-label', `${n} waiting for review`);
}

if (typeof document !== 'undefined') {
  cleanAddress();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSiteHeader, { once: true });
  } else {
    renderSiteHeader();
  }
}
