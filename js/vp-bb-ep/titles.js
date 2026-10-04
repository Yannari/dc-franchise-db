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

/** The opening titles or the closing, for a season ('bb-1'). */
export function titleScreen(kind, seasonKey) {
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

const videoOf = el => (el?.tagName === 'VIDEO' ? el : el?.closest?.('.bbt')?.querySelector('video'));
const engine = () => (typeof window !== 'undefined' ? window.audio : null);

/** Follow the site's volume and mute, then play. A browser that blocks it gets a play button. */
export function bbxTitleReady(v) {
  if (!v || v.dataset.started) return;
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
  if (typeof window !== 'undefined' && typeof window.vpNext === 'function') window.vpNext();
}

if (typeof window !== 'undefined') Object.assign(window, { bbxTitleReady, bbxTitlePlay, bbxTitleFallback, bbxTitleDone });
