// Writes the four-app tab bar into the pages that host the apps, and its styles
// into styles.css. One bar, one place, every app page (see js/media-brands.js).
//
//   node tools/app-tabs.mjs
//
// Each page carries the bar between <!-- APP TABS --> markers placed straight
// after its site header; the first run puts the markers there. styles.css gets
// an APP TABS block holding the media marks' CSS and the bar's.
import fs from 'node:fs';
import { appTabsHtml, APP_TABS_CSS, MEDIA_CSS } from '../js/media-brands.js';

export const PAGES = { 'social.html': 'social', 'dramagram.html': 'dramagram', 'kristal.html': 'kristal' };

const OPEN = '<!-- APP TABS: written by tools/app-tabs.mjs -->';
const CLOSE = '<!-- /APP TABS -->';
const CSS_OPEN = '/* ===== APP TABS (written by tools/app-tabs.mjs from js/media-brands.js) ===== */';
const CSS_CLOSE = '/* ===== /APP TABS ===== */';

export function withTabs(src, page) {
  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  const block = `${OPEN}${nl}${appTabsHtml(page)}${nl}${CLOSE}`;
  if (src.includes(OPEN)) {
    const a = src.indexOf(OPEN), b = src.indexOf(CLOSE, a) + CLOSE.length;
    return src.slice(0, a) + block + src.slice(b);
  }
  const at = src.indexOf('</header>');
  if (at < 0) throw new Error(`${page}: no </header> to put the app bar after`);
  const end = at + '</header>'.length;
  return src.slice(0, end) + nl + nl + block + src.slice(end);
}

export function withCss(css) {
  const nl = css.includes('\r\n') ? '\r\n' : '\n';
  const block = `${CSS_OPEN}${(MEDIA_CSS + APP_TABS_CSS).replace(/\n/g, nl)}${CSS_CLOSE}`;
  if (css.includes(CSS_OPEN)) {
    const a = css.indexOf(CSS_OPEN), b = css.indexOf(CSS_CLOSE, a) + CSS_CLOSE.length;
    return css.slice(0, a) + block + css.slice(b);
  }
  return css.replace(/\s*$/, '') + nl + nl + block + nl;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('app-tabs.mjs')) {
  for (const [file, page] of Object.entries(PAGES)) {
    fs.writeFileSync(file, withTabs(fs.readFileSync(file, 'utf8'), page));
    console.log(`app bar -> ${file}`);
  }
  fs.writeFileSync('styles.css', withCss(fs.readFileSync('styles.css', 'utf8')));
  console.log('app bar css -> styles.css');
}
