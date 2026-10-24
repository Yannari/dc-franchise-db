// Page to page, the network moves instead of blinking.
//
// The slide itself is CSS: `@view-transition { navigation: auto }` in
// styles.css opts every network page into cross-document view transitions,
// and styles.css is loaded by the network and never by the simulator, so the
// two apps do not animate into each other. This file does the one thing the
// stylesheet cannot: when the link you clicked goes to a player, it names the
// portrait you clicked, so that face flies into the player page's hero
// (#pp-hero-portrait carries the same name there).
//
// Browsers without view transitions never fire `pageswap`; they navigate the
// way they always did.

export const PORTRAIT_VT = 'bs-portrait';

/** The player a URL opens, or null: `player.html?player=x` and the clean `/player?player=x`. */
export function playerOf(url, base = 'https://blindsidenetwork.com/') {
  try {
    const u = new URL(url, base);
    return /(^|\/)player(\.html)?$/.test(u.pathname) ? u.searchParams.get('player') : null;
  } catch { return null; }
}

const onScreen = el => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
};

export function installPageTransitions(win = window) {
  win.addEventListener('pageswap', e => {
    const to = e.activation?.entry?.url;
    if (!e.viewTransition || !to) return;
    const id = playerOf(to, win.location.href);
    if (!id) return;
    const img = [...win.document.querySelectorAll('a[href*="player="]')]
      .filter(a => playerOf(a.href, win.location.href) === id)
      .map(a => a.querySelector('img'))
      .find(el => el && onScreen(el));
    if (!img) return;
    img.style.viewTransitionName = PORTRAIT_VT;
    // Coming back through the history cache, the old page must not still hold
    // the name, or two elements claim it and the browser skips the transition.
    e.viewTransition.finished.finally(() => { img.style.viewTransitionName = ''; });
  });
}

if (typeof window !== 'undefined' && 'onpageswap' in window) installPageTransitions(window);
