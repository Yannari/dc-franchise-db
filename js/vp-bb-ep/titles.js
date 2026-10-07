// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/titles.js — the opening titles and the closing, as screens
// ══════════════════════════════════════════════════════════════════════
//
// Rendered in Blender with the season's own cast (tools/bb-intro: intro.py
// builds the studio, the eye and the wall of portraits; render.py renders a
// season's pair). Every episode of the stepped viewer opens on the titles and
// closes on the closing, and both can be skipped.
//
//   assets/bb/intro/<season>-intro.mp4    e.g. bb-1-intro.mp4, the theme under it
//   assets/bb/intro/<season>-outro.mp4    the ending music; never shows a result
//   assets/bb/intro/generic-*.mp4         the logo-only pair, for a season with
//                                         no render of its own
//
// The video carries its own music, so the screen asks for no bed
// (data-ambient="none" stops the one that was playing). The player follows
// the site's volume and mute.
import { img, eyeSvg, esc } from './stage.js';
import { TITLE_CASTS } from './title-casts.js';

// The rendered titles show the cast they were rendered with. A season playing a different cast
// (every season simulated here, which all used to fall back to bb-1's) gets LIVE titles instead:
// the eye, then each of its own houseguests, one at a time, onto the wall, under the theme (the
// user, 2026-10-06: "the opening titles don't update with the actual houseguests in the game").
const INTRO_SECONDS = 39.6;
const OUTRO_SECONDS = 26;
const LIVE_CSS = `
.bbt.live{container-type:inline-size;background:radial-gradient(ellipse at 50% 40%,#0b2a52 0%,#050a18 55%,#02040a 100%)}
.bbt.live .grid{position:absolute;inset:5% 4% 24%;display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:1.4cqw;opacity:.5}
.bbt.live .wt{width:var(--tw);aspect-ratio:4/5;border-radius:10%;overflow:hidden;background:var(--c);opacity:0;box-shadow:0 0 0 2px rgba(34,225,255,.35)}
.bbt.live .wt img,.bbt.live .hero img{width:100%;height:100%;object-fit:cover;object-position:50% 14%;display:block}
.bbt.live .wt.out img,.bbt.live .hero.out img{filter:grayscale(1) brightness(.75)}
.bbt.live .wt.out{box-shadow:0 0 0 2px rgba(255,255,255,.18)}
.bbt.live.go .wt{animation:bbti-wall .5s ease-out both;animation-delay:var(--d)}
@keyframes bbti-wall{from{opacity:0;scale:1.3}to{opacity:1;scale:1}}
.bbt.live .hero{position:absolute;left:39%;top:12%;width:22%;aspect-ratio:4/5;z-index:3;border-radius:10%;overflow:hidden;background:var(--c);opacity:0;
  box-shadow:0 0 0 3px #fff,0 0 60px var(--c),0 30px 60px rgba(0,0,0,.6)}
.bbt.live.go .hero{animation:bbti-hero var(--slot) cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d)}
@keyframes bbti-hero{0%{opacity:0;scale:1.35;rotate:-4deg;filter:brightness(2.5)}12%{opacity:1;scale:1;rotate:0deg;filter:none}80%{opacity:1;scale:1.04}100%{opacity:0;scale:.5}}
.bbt.live .nm{position:absolute;z-index:4;left:50%;top:76%;translate:-50% 0;font:900 clamp(18px,4.2cqw,46px)/1 Archivo,system-ui,sans-serif;font-stretch:78%;letter-spacing:.08em;text-transform:uppercase;color:#fff;opacity:0;white-space:nowrap;text-shadow:0 0 24px rgba(34,225,255,.8)}
.bbt.live.go .nm{animation:bbti-name var(--slot) ease-out both;animation-delay:var(--d)}
@keyframes bbti-name{0%{opacity:0;letter-spacing:.6em}15%{opacity:1;letter-spacing:.08em}80%{opacity:1}100%{opacity:0}}
.bbt.live .logo{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2%;opacity:0;pointer-events:none}
.bbt.live .logo svg{width:22%}
.bbt.live .logo b{font:900 clamp(24px,6cqw,72px)/1 Archivo,system-ui,sans-serif;font-stretch:78%;letter-spacing:.18em;color:#fff;text-shadow:0 0 30px rgba(34,225,255,.9)}
.bbt.live .logo i{font:700 clamp(12px,1.6cqw,20px)/1 'Chakra Petch',system-ui,sans-serif;letter-spacing:.4em;color:#22e1ff;font-style:normal;text-transform:uppercase}
.bbt.live.go .logo.open{animation:bbti-open 4.2s ease-out both}
.bbt.live.go .logo.close{animation:bbti-close 5.5s ease-out both;animation-delay:var(--d)}
.bbt.live.go .logo.close.brief{animation:bbti-brief 5s ease-in-out both;animation-delay:var(--d)}
@keyframes bbti-brief{0%{opacity:0;scale:1.2}18%{opacity:1;scale:1}70%{opacity:1}100%{opacity:0;scale:.96}}
@keyframes bbti-open{0%{opacity:0;scale:2.2;filter:blur(12px)}25%{opacity:1;scale:1;filter:none}80%{opacity:1}100%{opacity:0;scale:.9}}
@keyframes bbti-close{0%{opacity:0;scale:1.2}25%{opacity:1;scale:1}100%{opacity:1}}
.bbt.live.go .grid.fin{animation:bbti-finw 5.5s ease-out both;animation-delay:var(--d)}
@keyframes bbti-finw{to{opacity:.95}}
.bbt.live .scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 4px);pointer-events:none}
@media (prefers-reduced-motion:reduce){.bbt.live *{animation-duration:.01s!important}}
`;
const TITLE_CSS = `
.bbt{position:relative;aspect-ratio:16/9;max-width:1200px;margin:0 auto;background:#02040a;border-radius:14px;overflow:hidden}
.bbt video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#02040a}
.bbt .bbt-skip{position:absolute;right:18px;bottom:18px;z-index:2;padding:10px 18px;border-radius:999px;border:1px solid rgba(34,225,255,.6);
  background:rgba(2,6,12,.72);color:#e9fbff;font:700 13px/1 'Chakra Petch',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;
  backdrop-filter:blur(6px);transition:background .2s}
.bbt .bbt-skip:hover{background:rgba(34,225,255,.22)}
.bbt .bbt-play{position:absolute;inset:0;z-index:1;display:none;align-items:center;justify-content:center;border:0;background:rgba(2,4,10,.55);color:#fff;
  font:800 18px 'Chakra Petch',system-ui,sans-serif;letter-spacing:.14em;cursor:pointer}
.bbt.blocked .bbt-play{display:flex}
`;

/** Does the rendered sequence for this season show this cast? */
function renderedFor(seasonKey, cast) {
  const made = TITLE_CASTS[seasonKey];
  if (!made || !cast?.length) return !cast?.length;
  const a = [...made].sort().join('|'), b = [...cast].sort().join('|');
  return a === b;
}

/** The live titles: the eye, each houseguest in turn, the wall. */
function liveTitles(kind, cast, title, gone = []) {
  const out = new Set(gone || []);
  const total = kind === 'intro' ? INTRO_SECONDS : OUTRO_SECONDS;
  const people = [...cast].sort((a, b) => a.localeCompare(b));   // never by placement: the order says nothing
  const open = kind === 'intro' ? 4 : 2;
  const close = 5.5;
  const slot = Math.max(1.1, (total - open - close) / Math.max(1, people.length));
  const cols = Math.min(9, Math.max(4, Math.ceil(Math.sqrt(people.length * 2.2))));
  const rows = Math.ceil(people.length / cols);
  // a tile as wide as the row allows, and no taller than the rows allow (16:9: the height is 56.25cqw)
  const tw = Math.min(86 / cols - 1.4, (56.25 * 0.68 / rows - 1.4) * 0.8).toFixed(2);
  const PAL = ['#ec4899', '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6', '#a855f7', '#84cc16', '#06b6d4', '#f43f5e', '#8b5cf6'];
  const col = n => PAL[[...String(n)].reduce((h, ch) => h + ch.charCodeAt(0), 0) % PAL.length];
  const wall = people.map((n, i) => `<div class="wt ${out.has(n) ? 'out' : ''}" style="--c:${col(n)};--d:${(open + (i + 1) * slot - 0.3).toFixed(2)}s">${img(n)}</div>`).join('');
  const heroes = kind === 'intro' ? people.map((n, i) => `<div class="hero ${out.has(n) ? 'out' : ''}" style="--c:${col(n)};--d:${(open + i * slot).toFixed(2)}s;--slot:${slot.toFixed(2)}s">${img(n)}</div><div class="nm" style="--d:${(open + i * slot).toFixed(2)}s;--slot:${slot.toFixed(2)}s">${esc(n)}</div>`).join('') : '';
  const finAt = kind === 'intro' ? (total - close).toFixed(2) : '0.6';
  const audio = kind === 'intro' ? 'assets/audio/bb/theme.mp3' : 'assets/audio/bb/ending.mp3';
  return `<div class="bbt live" data-ambient="none" style="--cols:${cols};--tw:${tw}cqw"><style>${TITLE_CSS}${LIVE_CSS}</style>
  <div class="grid ${kind === 'intro' ? '' : 'fin'}" style="--d:${finAt}s">${kind === 'intro' ? wall : people.map(n => `<div class="wt ${out.has(n) ? 'out' : ''}" style="--c:${col(n)};--d:.3s">${img(n)}</div>`).join('')}</div>
  ${kind === 'intro' ? `<div class="logo open">${eyeSvg('bbti-eye')}<b>BIG BROTHER</b></div>` : ''}
  ${heroes}
  <div class="logo close ${kind === 'intro' ? '' : 'brief'}" style="--d:${finAt}s">${eyeSvg('bbti-eye2')}<b>BIG BROTHER</b>${title ? `<i>${esc(title)}</i>` : ''}</div>
  <div class="scan"></div>
  <audio src="${audio}" preload="auto" oncanplay="bbxTitleReady(this)" onplay="this.closest('.bbt').classList.add('go');this.closest('.bbt').classList.remove('blocked')" onerror="bbxTitleLiveSilent(this)" onended="bbxTitleDone(this)"></audio>
  <button type="button" class="bbt-play" onclick="bbxTitlePlay(this)">▶ PLAY</button>
  <button type="button" class="bbt-skip" onclick="bbxTitleDone(this)">Skip ${kind === 'intro' ? 'intro' : 'closing'} ▶</button>
</div>`;
}

/** The opening titles or the closing, for a season ('bb-1'), with the cast actually in it. */
export function titleScreen(kind, seasonKey, cast = [], title = '', gone = []) {
  const label0 = kind === 'intro' ? 'Opening Titles' : 'Closing';
  if (!renderedFor(seasonKey, cast)) return { id: `bb-${kind === 'intro' ? 'titles' : 'closing'}`, label: label0, html: liveTitles(kind, cast, title, gone) };
  const src = `assets/bb/intro/${seasonKey}-${kind}.mp4`;
  const generic = `assets/bb/intro/generic-${kind}.mp4`;
  const label = kind === 'intro' ? 'Opening Titles' : 'Closing';
  return {
    id: `bb-${kind === 'intro' ? 'titles' : 'closing'}`,
    label,
    html: `<div class="bbt" data-ambient="none"><style>${TITLE_CSS}</style>
  <video src="${src}" playsinline preload="auto" data-fallback="${generic}"
    oncanplay="bbxTitleReady(this)" onplay="this.closest('.bbt').classList.remove('blocked')" onerror="bbxTitleFallback(this)" onended="bbxTitleDone(this)"></video>
  <button type="button" class="bbt-play" onclick="bbxTitlePlay(this)">▶ PLAY</button>
  <button type="button" class="bbt-skip" onclick="bbxTitleDone(this)">Skip ${kind === 'intro' ? 'intro' : 'closing'} ▶</button>
</div>`,
  };
}

const videoOf = el => (el?.tagName === 'VIDEO' || el?.tagName === 'AUDIO' ? el : el?.closest?.('.bbt')?.querySelector('video,audio'));
/** The live titles with no music (the file failed): play the pictures anyway, then move on. */
export function bbxTitleLiveSilent(a) {
  const box = a?.closest?.('.bbt');
  if (!box || box.dataset.silent) return;
  box.dataset.silent = '1';
  box.classList.add('go');
  const secs = box.querySelector('.hero') ? INTRO_SECONDS : OUTRO_SECONDS;
  setTimeout(() => { if (box.isConnected) bbxTitleDone(box); }, secs * 1000);
}
const engine = () => (typeof window !== 'undefined' ? window.audio : null);

/** Follow the site's volume and mute, then play. A browser that blocks it gets a play button. */
export function bbxTitleReady(v) {
  if (!v || v.dataset.started || !viewerOpen()) return;
  v.dataset.started = '1';
  try { const a = engine(); if (a) { v.volume = Math.max(0, Math.min(1, a.getVolume?.() ?? 0.7)); v.muted = !!a.isMuted?.(); } } catch { /* defaults */ }
  const p = v.play?.();
  if (p && typeof p.catch === 'function') p.catch(() => v.closest('.bbt')?.classList.add('blocked'));
}
export function bbxTitlePlay(btn) {
  const v = videoOf(btn);
  btn.closest('.bbt')?.classList.remove('blocked');
  v?.play?.().catch?.(() => {});
}
/** The season's own render is missing: play the generic pair; if that is missing too, move on. */
export function bbxTitleFallback(v) {
  if (!v) return;
  if (!v.dataset.fellBack && v.dataset.fallback) { v.dataset.fellBack = '1'; v.dataset.started = ''; v.src = v.dataset.fallback; v.load?.(); return; }
  bbxTitleDone(v);
}
/** Finished, or skipped: stop the video and go to the next screen. */
export function bbxTitleDone(el) {
  const v = videoOf(el);
  try { v?.pause?.(); } catch { /* fine */ }
  if (!viewerOpen()) return;
  if (typeof window !== 'undefined' && typeof window.vpNext === 'function') window.vpNext();
}

/** Is the Viewing Party actually on screen? Closing it only hides it. */
export function viewerOpen() {
  const vp = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  return !!vp && vp.style.display !== 'none';
}
/** Silence every title video (closing the viewer hides it, and a hidden video keeps playing). */
export function stopTitles() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.bbt video, .bbt audio').forEach(v => { try { v.pause(); v.dataset.started = ''; } catch { /* fine */ } });
}

if (typeof window !== 'undefined') Object.assign(window, { bbxTitleReady, bbxTitlePlay, bbxTitleFallback, bbxTitleDone, bbxTitleLiveSilent });
if (typeof document !== 'undefined') {
  document.addEventListener('vp:close', stopTitles);
  // the browser tab goes to the background: no titles playing to nobody
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopTitles(); });
}
