// The network's media, each with its own logo: Birdie, ChatAlumni, Dramagram
// and Kristal-talKs.
//
// Each page that hosted one drew its own wordmark (social.html, kristal.html,
// dramagram.html), and every other page that MENTIONED one wrote its name in
// plain text -- "Hear the exit interview on Kristal-talKs" in the site's body
// face, which is how a brand stops being one. This is the one place the marks
// live; a page that names a medium draws mediaLogo(key).
//
// The marks are original (see social.html's notes): a wing-and-speech-mark for
// Birdie, a stage mic for ChatAlumni, a lens for Dramagram, a talk-show mic for
// Kristal-talKs. No borrowed brand.

export const MEDIA = {
  birdie: {
    name: 'Birdie', href: 'social.html',
    tile: 'linear-gradient(135deg,#38BDF8,#2563EB)', ink: '#fff', accent: '#38BDF8',
    icon: '<path d="M3 15c4-1 6-4 7-7 1 3 4 5 8 5-1 4-5 7-9 7H4l2-3z" fill="currentColor"/>',
    word: () => '<span class="mb-w mb-birdie">birdie</span>',
  },
  chatalumni: {
    name: 'ChatAlumni', href: 'social.html?app=chatalumni',
    tile: 'linear-gradient(135deg,#1F7A50,#0E4A30)', ink: '#F5C451', accent: '#F5C451',
    icon: '<path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    word: () => '<span class="mb-w mb-chat">Chat<b>Alumni</b></span>',
  },
  dramagram: {
    name: 'Dramagram', href: 'dramagram.html',
    tile: 'linear-gradient(135deg,#FF3EA5,#FFB23D)', ink: '#fff', accent: '#FF7A6B',
    icon: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/>',
    word: () => '<span class="mb-w mb-gram">Dramagram</span>',
  },
  kristal: {
    name: 'Kristal-talKs', href: 'kristal.html',
    tile: 'linear-gradient(135deg,#E84393,#8E2DE2)', ink: '#fff', accent: '#E84393',
    icon: '<rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    word: () => '<span class="mb-w mb-kristal">Kristal-tal<b>Ks</b></span>',
  },
};

/** The tile icon alone. */
export function mediaIcon(key, size = 28) {
  const m = MEDIA[key];
  if (!m) return '';
  return `<span class="mb-tile" style="width:${size}px;height:${size}px;background:${m.tile};color:${m.ink}" aria-hidden="true">`
    + `<svg viewBox="0 0 24 24" width="${Math.round(size * 0.6)}" height="${Math.round(size * 0.6)}">${m.icon}</svg></span>`;
}

/** Icon + wordmark. `link` wraps it in a link to the medium's page. */
export function mediaLogo(key, { size = 28, link = false } = {}) {
  const m = MEDIA[key];
  if (!m) return '';
  const inner = `${mediaIcon(key, size)}${m.word()}`;
  const style = `--mb-size:${size}px`;
  return link
    ? `<a class="mb-logo" href="${m.href}" style="${style}" aria-label="${m.name}">${inner}</a>`
    : `<span class="mb-logo" style="${style}" role="img" aria-label="${m.name}">${inner}</span>`;
}

export const MEDIA_CSS = `
.mb-logo{display:inline-flex;align-items:center;gap:calc(var(--mb-size,28px)*.32);text-decoration:none;color:#F3EEF9;vertical-align:middle}
.mb-tile{display:inline-grid;place-items:center;border-radius:28%;flex:none;box-shadow:0 4px 14px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.25)}
.mb-w{font-size:calc(var(--mb-size,28px)*.72);line-height:1;white-space:nowrap}
.mb-birdie{font-family:"Instrument Sans",system-ui,sans-serif;font-weight:700;letter-spacing:-.02em}
.mb-chat{font-family:Georgia,"Times New Roman",serif;font-weight:700;letter-spacing:-.01em}
.mb-chat b{color:#F5C451}
.mb-gram{font-family:"Instrument Sans",system-ui,sans-serif;font-weight:700;letter-spacing:-.03em;
  background:linear-gradient(92deg,#FF3EA5,#FFC14D);-webkit-background-clip:text;background-clip:text;color:transparent}
.mb-kristal{font-family:"Instrument Sans",system-ui,sans-serif;font-weight:800;letter-spacing:-.02em}
.mb-kristal b{color:#E84393}
a.mb-logo:hover .mb-w{text-decoration:underline;text-underline-offset:3px}
`;

// ── the app bar ──────────────────────────────────────────────────────────
//
// The four apps share ONE tab bar, in the same place on all three pages that
// host them (social.html for Birdie and ChatAlumni, dramagram.html,
// kristal.html), so moving between apps changes the page under the bar and
// never the bar itself. It used to be three switchers -- tiles on one page,
// chips on the other two -- and every click redrew the control you had just
// pressed.
//
// The markup is written INTO each page by tools/app-tabs.mjs (no flash while a
// script loads, and the page source says which tab it is); its styles are the
// APP TABS block of styles.css, written by the same tool. tests/app-tabs.test.js
// fails if a page drifts from appTabsHtml.

export const APP_ORDER = ['birdie', 'chatalumni', 'dramagram', 'kristal'];
export const APP_LINES = {
  birdie: 'The timeline, post by post',
  chatalumni: 'Alumni host the watch party',
  dramagram: 'Life after the show, in photos',
  kristal: 'Every exit interview',
};
// Ids the pages already address: social-page.js wires #pick-birdie/#pick-chat,
// and the Dramagram page's own tab is #dg-here.
const TAB_ID = { birdie: 'pick-birdie', chatalumni: 'pick-chat', dramagram: 'pick-gram', kristal: 'pick-kristal' };
const PAGE_OF = { birdie: 'social', chatalumni: 'social', dramagram: 'dramagram', kristal: 'kristal' };
const HREF = { birdie: 'social.html?app=birdie', chatalumni: 'social.html?app=chatalumni', dramagram: 'dramagram.html', kristal: 'kristal.html' };

/**
 * The bar for one page. On social.html Birdie and ChatAlumni switch in place
 * (buttons, aria-pressed, Birdie pressed until the page says otherwise); every
 * other tab is a link, and the page's own app is marked aria-current.
 */
export function appTabsHtml(page) {
  const tabs = APP_ORDER.map(key => {
    const inner = `${mediaIcon(key, 44)}<span class="app-tab-copy">${MEDIA[key].word()}<small>${APP_LINES[key]}</small></span>`;
    const style = `--acc:${MEDIA[key].accent}`;
    if (page === 'social' && PAGE_OF[key] === 'social') {
      return `<button type="button" class="app-tab" id="${TAB_ID[key]}" style="${style}" aria-pressed="${key === 'birdie'}">${inner}</button>`;
    }
    const here = PAGE_OF[key] === page;
    const id = here && key === 'dramagram' ? 'dg-here' : TAB_ID[key];
    return `<a class="app-tab" id="${id}" style="${style}"${here ? ' aria-current="page"' : ''} href="${HREF[key]}">${inner}</a>`;
  });
  return `<nav class="app-tabs" aria-label="Apps">${tabs.join('')}</nav>`;
}

export const APP_TABS_CSS = `
html{scrollbar-gutter:stable}
.app-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;max-width:1180px;margin:18px auto 0;padding:0 16px;box-sizing:content-box}
.app-tab{--acc:#fff;position:relative;display:flex;align-items:center;gap:14px;min-height:76px;padding:14px 16px;border-radius:18px;
  cursor:pointer;text-decoration:none;text-align:left;font:inherit;color:#F3EEF9;background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.12);transition:transform .18s ease}
.app-tab:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--acc) 55%,transparent)}
.app-tab[aria-pressed="true"],.app-tab[aria-current="page"]{border-color:var(--acc);
  background:color-mix(in srgb,var(--acc) 12%,#1a1424);
  box-shadow:0 10px 30px -12px color-mix(in srgb,var(--acc) 70%,transparent),inset 0 0 0 1px color-mix(in srgb,var(--acc) 40%,transparent)}
.app-tab[aria-pressed="true"]::after,.app-tab[aria-current="page"]::after{content:"";position:absolute;left:18px;right:18px;bottom:-1px;
  height:3px;border-radius:3px;background:var(--acc)}
.app-tab:focus-visible{outline:3px solid var(--acc);outline-offset:3px}
.app-tab .mb-tile{border-radius:13px}
.app-tab-copy{display:flex;flex-direction:column;gap:4px;min-width:0}
.app-tab-copy .mb-w{font-size:20px}
.app-tab-copy small{font-size:12.5px;color:#B9AEC8;line-height:1.3}
@media(max-width:900px){.app-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:520px){
  .app-tab{min-height:64px;padding:10px 12px;gap:10px}
  .app-tab .mb-tile{width:36px!important;height:36px!important}
  .app-tab-copy{overflow:hidden}
  .app-tab-copy .mb-w{font-size:15px}
  .app-tab-copy small{display:none}
}
@media(prefers-reduced-motion:reduce){.app-tab{transition:none}}
`;

/**
 * Every element marked `data-media-icon="birdie"` (or any MEDIA key) gets that
 * medium's tile in front of its text -- for pages whose links are static HTML.
 */
export function paintMediaIcons(root = document, size = 22) {
  ensureMediaCss(root.ownerDocument || root);
  for (const el of root.querySelectorAll('[data-media-icon]')) {
    if (el.querySelector(':scope > .mb-tile')) continue;
    el.insertAdjacentHTML('afterbegin', mediaIcon(el.dataset.mediaIcon, Number(el.dataset.mediaSize) || size));
  }
}

/** Add MEDIA_CSS to the page once. */
export function ensureMediaCss(doc = document) {
  if (doc.getElementById('media-brands-css')) return;
  const s = doc.createElement('style');
  s.id = 'media-brands-css';
  s.textContent = MEDIA_CSS;
  doc.head.appendChild(s);
}
