// Blindside Network: the mark, the wordmark, and how they move.
//
// THE MARK ("Side Cut", chosen 2026-10-24): a heavy B with its right edge
// sliced off and knocked out of line, the cut piece lit in magenta. The letter
// getting hit from the side, mid-move -- which is what a blindside is.
//
// ONE SOURCE. The site's pages carry the header as static HTML (so it paints
// before any script runs); tools/brand-pages.mjs writes that HTML from
// brandLockup() below, and the simulator and anything built at runtime call the
// same functions. Change the geometry here and re-run the tool, never by hand.
//
// THE MOTION. On load the cut piece slides in from the side, sits flush for a
// beat, then takes the hit and lands knocked out of line. Hovering the brand
// replays it. A glint crosses the cut piece every few seconds. Nothing moves
// under prefers-reduced-motion: the mark simply rests in its final position.

/** The B, as one even-odd path: stem, two bowls, two counters. */
const B_PATH = 'M12 7h22c8 0 14 5 14 12.5 0 4.6-2.3 8.2-6 10.2 5 1.8 8 5.9 8 11.3'
  + 'C50 49.6 43.8 57 34.5 57H12Z M23 16.5v10h9.5a5 5 0 0 0 0-10Z'
  + 'M23 35v12.5h11a6.25 6.25 0 0 0 0-12.5Z';

/** Left of the cut stays put; right of it is the piece that gets knocked. */
const KEEP = '0,0 32.5,0 44.5,64 0,64';
const SLICE = '34.5,0 64,0 64,64 46.5,64';

export const BRAND = {
  name: 'Blindside Network',
  short: 'Blindside',
  ink: '#120B1C',
  paper: '#F3EEF9',
  magenta: '#FF3EA5',
  violet: '#7B5CFF',
  gold: '#FFC23D',
};

/**
 * The mark as inline SVG.
 *
 * `id` keeps the clip paths and gradient unique when a page holds more than
 * one mark. `animated` adds the classes BRAND_CSS moves; the static form is for
 * favicons and anywhere motion would be noise. The B takes `currentColor`, so
 * it follows the text colour it sits in.
 */
export function brandMark({ id = 'bs', animated = true, label = '', attrs = null } = {}) {
  const a = animated ? ' class="bs-mark is-animated"' : ' class="bs-mark"';
  const role = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
  return `<svg${attrs ?? `${a} viewBox="0 0 64 64"${role} focusable="false"`}>`
    + `<defs>`
    + `<linearGradient id="${id}-hit" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="${BRAND.magenta}"/><stop offset="1" stop-color="${BRAND.violet}"/></linearGradient>`
    + `<linearGradient id="${id}-glint" x1="0" y1="0" x2="1" y2="0">`
    + `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/>`
    + `<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
    + `<clipPath id="${id}-keep"><polygon points="${KEEP}"/></clipPath>`
    + `<clipPath id="${id}-slice"><polygon points="${SLICE}"/></clipPath>`
    + `<clipPath id="${id}-b"><path d="${B_PATH}" clip-rule="evenodd"/></clipPath>`
    + `</defs>`
    + `<g class="bs-body" clip-path="url(#${id}-keep)"><path d="${B_PATH}" fill="currentColor" fill-rule="evenodd"/></g>`
    + `<g class="bs-slice" clip-path="url(#${id}-slice)"${animated ? '' : ' transform="translate(3.5 4.5)"'}>`
    + `<path d="${B_PATH}" fill="url(#${id}-hit)" fill-rule="evenodd"/>`
    + (animated ? `<g clip-path="url(#${id}-b)"><rect class="bs-glint" x="-14" y="0" width="14" height="64" fill="url(#${id}-glint)"/></g>` : '')
    + `</g></svg>`;
}

/** Mark + BLINDSIDE / NETWORK, linking home. */
export function brandLockup({ href = 'index.html', id = 'bs' } = {}) {
  return `<a href="${href}" class="bs-brand" aria-label="${BRAND.name} home">`
    + brandMark({ id })
    + `<span class="bs-word"><span class="bs-name">BLINDSIDE</span><span class="bs-net">NETWORK</span></span>`
    + `</a>`;
}

/** The way into the simulator from the network. */
export function simulatorLink({ href = 'simulator.html' } = {}) {
  return `<a href="${href}" class="bs-sim">Simulator</a>`;
}

/** The network's footer: the mark, where to go next, and what this is. */
export function brandFooter() {
  const links = [['on-air.html', 'On Air'], ['seasons.html', 'Seasons'], ['devotees.html', 'Players'],
    ['rankings.html', 'Records'], ['social.html', 'Social'], ['timeline.html', 'Timeline'], ['simulator.html', 'Simulator']];
  return `<footer class="bs-footer"><div class="bs-footer-inner">`
    + `<a href="index.html" class="bs-footer-brand" aria-label="${BRAND.name} home">${brandMark({ id: 'bsf', animated: false })}`
    + `<span>${BRAND.name}</span></a>`
    + `<nav aria-label="Footer">${links.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</nav>`
    + `<p>blindsidenetwork.com · A fictional network. Every show, season and player here is simulated. · <a href="index.html?ident">Play the ident</a></p>`
    + `</div></footer>`;
}

/**
 * The ident's gate, inlined into each page's <head> (js/ident.js plays it).
 *
 * Runs before the body paints: on the first visit of the day (or with ?ident
 * in the address) it hides the page so the ident opens ONTO it rather than the
 * page flashing up first. It unhides after four seconds whatever happens, so a
 * failed module can never leave a blank site.
 */
// It also loads js/ident.js ITSELF, straight away: through the header's module
// graph a cold first visit took longer than the four-second safety, so the
// page sat dark and then no ident played. (No backslashes in here: this is a
// template literal, and `\b` in one is a backspace character.)
export const IDENT_BOOT = `<script>/* Blindside ident gate: js/ident.js */(function(){try{`
  + `var q=/[?&]ident([=&]|$)/.test(location.search),d=new Date().toDateString(),r=matchMedia('(prefers-reduced-motion: reduce)').matches;`
  + `if(q||(!r&&localStorage.getItem('bs_ident_day')!==d)){var h=document.documentElement;h.classList.add('bs-ident-on');`
  + `var s=document.createElement('script');s.type='module';s.src=(h.getAttribute('data-root')||'.')+'/js/ident.js';document.head.appendChild(s);`
  + `setTimeout(function(){h.classList.remove('bs-ident-on')},4000)}}catch(e){}})();</script>`
  + `<style>.bs-ident-on body>*:not(.bs-ident){visibility:hidden}.bs-ident-on body{background:#0b0613}</style>`;

/**
 * The favicon: the static mark on a plum tile, so it reads on light and dark
 * tab strips alike. `rounded` false gives the full-bleed square that iOS and
 * Android round themselves.
 */
export function faviconSvg({ rounded = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`
    + `<rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="${BRAND.ink}"/>`
    + `<g transform="translate(4.5 3.3) scale(.82)" color="${BRAND.paper}">`
    + brandMark({ id: 'fav', animated: false, attrs: ' viewBox="0 0 64 64" width="64" height="64"' })
    + `</g></svg>`;
}

/**
 * Styles for the lockup and the motion. Also copied into styles.css by
 * tools/brand-pages.mjs, so a static page has them before any script loads.
 */
export const BRAND_CSS = `
@font-face{font-family:"Big Shoulders Display";src:url("assets/fonts/BigShouldersDisplay.woff2") format("woff2");font-weight:100 900;font-display:swap}
@font-face{font-family:"Instrument Sans";src:url("assets/fonts/InstrumentSans.woff2") format("woff2");font-weight:400 700;font-display:swap}
.bs-brand{display:inline-flex;align-items:center;gap:12px;text-decoration:none;color:#F3EEF9;min-width:0}
.bs-mark{width:46px;height:46px;flex:none;overflow:visible}
.bs-word{display:grid;line-height:.84}
.bs-name{font-family:"Big Shoulders Display","Arial Narrow",Impact,sans-serif;font-weight:900;font-size:31px;letter-spacing:.035em}
.bs-net{font-family:"Instrument Sans",system-ui,sans-serif;font-weight:600;font-size:10.5px;letter-spacing:.56em;color:#A898BD;margin-top:5px}
.bs-sim{display:inline-flex;align-items:center;gap:6px;font-family:"Instrument Sans",system-ui,sans-serif;font-weight:600;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#F3EEF9;text-decoration:none;border:1px solid rgba(255,62,165,.7);border-radius:999px;padding:8px 16px;transition:background .2s,border-color .2s}
.bs-sim:hover,.bs-sim:focus-visible{background:rgba(255,62,165,.14);border-color:#FF3EA5}
.bs-brand:focus-visible,.bs-sim:focus-visible{outline:2px solid #FFC23D;outline-offset:4px;border-radius:10px}
.bs-mark .bs-slice{transform:translate(3.5px,4.5px)}
.bs-footer{margin-top:48px;border-top:1px solid rgba(255,255,255,.08);background:rgba(10,6,16,.55)}
.bs-footer-inner{max-width:1280px;margin:0 auto;padding:28px clamp(16px,3vw,32px) 34px;display:grid;gap:14px;
  grid-template-columns:auto 1fr;align-items:center}
.bs-footer-brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:#F3EEF9;
  font-family:"Big Shoulders Display","Arial Narrow",Impact,sans-serif;font-weight:900;font-size:20px;letter-spacing:.04em;text-transform:uppercase}
.bs-footer-brand .bs-mark{width:30px;height:30px}
.bs-footer nav{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px 18px}
.bs-footer nav a{color:#A898BD;text-decoration:none;font-size:14px}
.bs-footer nav a:hover{color:#F3EEF9}
.bs-footer p{grid-column:1/-1;margin:0;color:#7E6F93;font-size:12.5px}
.bs-footer p a{color:#A898BD;text-decoration:none}.bs-footer p a:hover{color:#F3EEF9;text-decoration:underline}
@media (max-width:640px){.bs-footer-inner{grid-template-columns:1fr}.bs-footer nav{justify-content:flex-start}}
@media (prefers-reduced-motion:no-preference){
  .bs-mark.is-animated .bs-slice{animation:bs-hit 1.15s .25s cubic-bezier(.2,.8,.2,1) both}
  .bs-mark.is-animated .bs-body{animation:bs-recoil 1.15s .25s ease-out both}
  .bs-brand:hover .bs-mark.is-animated .bs-slice{animation-name:bs-hit-again}
  .bs-brand:hover .bs-mark.is-animated .bs-body{animation-name:bs-recoil-again}
  .bs-mark.is-animated .bs-glint{animation:bs-glint 7s 2.2s ease-in-out infinite}
}
@keyframes bs-hit{0%{transform:translate(24px,-3px);opacity:0}38%{transform:translate(0,0);opacity:1}58%{transform:translate(0,0)}70%{transform:translate(6px,7.5px)}84%{transform:translate(3px,4px)}100%{transform:translate(3.5px,4.5px)}}
@keyframes bs-hit-again{0%{transform:translate(3.5px,4.5px)}30%{transform:translate(0,0)}52%{transform:translate(0,0)}66%{transform:translate(6px,7.5px)}82%{transform:translate(3px,4px)}100%{transform:translate(3.5px,4.5px)}}
@keyframes bs-recoil{0%,58%{transform:none}68%{transform:translate(-1.6px,0)}100%{transform:none}}
@keyframes bs-recoil-again{0%,52%{transform:none}63%{transform:translate(-1.6px,0)}100%{transform:none}}
@keyframes bs-glint{0%,82%{transform:translateX(0)}100%{transform:translateX(70px)}}
@media (max-width:640px){.bs-mark{width:38px;height:38px}.bs-name{font-size:25px}.bs-net{font-size:9px}.bs-sim{padding:7px 12px;font-size:12px}}
@media (max-width:440px){.bs-brand{gap:8px}.bs-mark{width:32px;height:32px}.bs-name{font-size:21px}.bs-net{font-size:7.5px;letter-spacing:.5em}.bs-sim{padding:6px 10px;font-size:11px;letter-spacing:.06em}}
`;
