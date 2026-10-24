// Writes the Blindside Network brand into the site, from js/brand.js.
//
//   node tools/brand-pages.mjs
//
// Idempotent: run it again after changing js/brand.js and every page, the
// stylesheet and the icon files follow. What it does:
//   - assets/brand/: favicon.svg and the standalone marks (PNG icons are
//     rendered from favicon.svg by tools/brand-icons.mjs)
//   - styles.css: BRAND_CSS between the BRAND markers
//   - each page: the header's brand block becomes the lockup, the old stats
//     card becomes the Simulator link, the <title> takes the network's name,
//     and the head links the icons
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { brandLockup, simulatorLink, faviconSvg, brandMark, brandFooter, BRAND, BRAND_CSS } from '../js/brand.js';
import { navHtml, activeHref } from '../js/site-header.js';

const SUFFIX = ` · ${BRAND.name}`;

/** Page -> its tab title. A page whose script sets a better title keeps doing so. */
const TITLES = {
  'index.html': BRAND.name,
  'awards.html': 'Season Awards',
  'compare.html': 'Compare Players',
  'current-season.html': 'Season Control Room',
  'on-air.html': 'On Air',
  'devotees.html': 'Players',
  'dramagram.html': 'Dramagram',
  'franchise.html': 'Franchise',
  'kristal.html': 'Kristal-talKs',
  'leaderboards.html': 'Leaderboards',
  'life.html': 'Life',
  'player.html': 'Player',
  'rankings.html': 'Rankings',
  'season-awards_ref.html': 'Season Awards',
  'season_ref.html': 'Season',
  'seasons.html': 'Seasons',
  'social.html': 'Social',
  'timeline.html': 'Timeline',
  'rr.html': 'The Ridonculous Race',
  'simulator.html': 'Simulator',
};

const HEAD_LINKS = [
  '<link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml">',
  '<link rel="icon" href="assets/brand/favicon-32.png" sizes="32x32" type="image/png">',
  '<link rel="apple-touch-icon" href="assets/brand/apple-touch-icon.png">',
  '<link rel="manifest" href="site.webmanifest">',
  `<meta name="theme-color" content="${BRAND.ink}">`,
].join('\n  ');

const read = f => readFileSync(f, 'utf8');
const write = (f, s) => writeFileSync(f, s);

// ── icons and standalone marks ──
mkdirSync('assets/brand', { recursive: true });
write('assets/brand/favicon.svg', faviconSvg() + '\n');
write('assets/brand/favicon-square.svg', faviconSvg({ rounded: false }) + '\n');
const standalone = (color, animated) => brandMark({ id: 'm', animated })
  .replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" color="${color}"`)
  .replace('<defs>', animated ? `<style>${BRAND_CSS.replace(/@font-face[^}]*}/g, '').replace(/\.bs-brand:hover[^}]*}/g, '')}</style><defs>` : '<defs>');
write('assets/brand/mark-on-dark.svg', standalone(BRAND.paper, true) + '\n');
write('assets/brand/mark-on-light.svg', standalone(BRAND.ink, true) + '\n');
write('assets/brand/mark-static-on-light.svg', standalone(BRAND.ink, false) + '\n');
write('site.webmanifest', JSON.stringify({
  name: BRAND.name,
  short_name: BRAND.short,
  start_url: './',
  display: 'standalone',
  background_color: BRAND.ink,
  theme_color: BRAND.ink,
  icons: [
    { src: 'assets/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'assets/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}, null, 2) + '\n');

// ── stylesheet ──
{
  const START = '/* ===== BRAND: Blindside Network (written by tools/brand-pages.mjs from js/brand.js) ===== */';
  const END = '/* ===== /BRAND ===== */';
  let css = read('styles.css');
  const block = `${START}${BRAND_CSS}${END}\n`;
  const at = css.indexOf(START);
  css = at >= 0 ? css.slice(0, at) + block + css.slice(css.indexOf(END) + END.length + 1) : block + css;
  write('styles.css', css);
}

// ── pages ──
const report = [];
for (const [file, title] of Object.entries(TITLES)) {
  let s = read(file);
  const before = s;

  // The brand block, in whichever of its versions this page carries -- the old
  // one, or a lockup an earlier run wrote (so a geometry change reaches it).
  s = s.replace(/<a href="index\.html" class="(?:brand-section|bs-brand)"[\s\S]*?<\/a>/, brandLockup());
  s = s.replace(/<a href="[^"]*" class="bs-sim">[\s\S]*?<\/a>/, simulatorLink());
  // The stats card -> the way into the simulator. Pages without one get the
  // link straight after the lockup.
  if (/<div class="stats-badge">/.test(s)) {
    s = s.replace(/<div class="stats-badge">[\s\S]*?<div class="stats-sub">[\s\S]*?<\/div>\s*<\/div>/, simulatorLink());
  } else if (s.includes('class="bs-brand"') && !s.includes('class="bs-sim"')) {
    s = s.replace(/(<a href="index\.html" class="bs-brand"[\s\S]*?<\/a>)/, `$1\n      ${simulatorLink()}`);
  }
  // The nav, as js/site-header.js will draw it, so the page does not flash the
  // old one before the script replaces it.
  s = s.replace(/(<nav class="header-nav"[^>]*>)[\s\S]*?(<\/nav>)/, (_, open, close) => `${open}${navHtml(activeHref(file))}${close}`);
  // The cards' old numbers are gone; their writers must not throw on the gap.
  s = s.replace(/document\.getElementById\('(totalSeasons|totalPlayers|currentSeasonNum|iconFormat)'\)\.textContent\s*=/g,
    "(document.getElementById('$1') || {}).textContent =");

  // The footer: the old "DC Franchise Database ... Icons: name.png" strip, or
  // one an earlier run wrote.
  s = s.replace(/(?:<!-- SITE FOOTER START -->\s*)?<footer class="(?:siteFooter|bs-footer)[^"]*">[\s\S]*?<\/footer>(?:\s*<!-- SITE FOOTER END -->)?/, brandFooter());
  // The first <title>, which is the page's own (later ones live in templates).
  s = s.replace(/<title>[^<]*<\/title>/, `<title>${title === BRAND.name ? title : title + SUFFIX}</title>`);
  if (!s.includes('assets/brand/favicon.svg')) s = s.replace(/<\/title>/, `</title>\n  ${HEAD_LINKS}`);

  if (s !== before) write(file, s);
  report.push(`${file.padEnd(24)} lockup:${s.includes('class="bs-brand"') ? 'y' : '-'} sim:${s.includes('class="bs-sim"') ? 'y' : '-'} oldbrand:${/brand-section|stats-badge/.test(s) ? 'LEFT' : 'gone'}`);
}
console.log(report.join('\n'));
