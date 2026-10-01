// ══════════════════════════════════════════════════════════════════════
// vp-ci/teaser-stage.js — the set for Previously / Coming up / Next time
// ══════════════════════════════════════════════════════════════════════
//
// The edit's own look, not an apartment and not the Circle UI: the dark, the
// ring turning slowly behind everything, a neon band saying which teaser this
// is, and each clip cutting in — the apartment camera on the left glitching
// in, the line on the right. A coming-up line is cut off before it lands
// (teasers.js cutLine); dots along the bottom count the clips.
import { esc, faceUrl, bg } from './parts.js';

const BAND = { previously: ['PREVIOUSLY ON', 'THE CIRCLE'], comingup: ['COMING UP ON', 'THE CIRCLE'], nexttime: ['NEXT TIME ON', 'THE CIRCLE'] };
const RING = '<svg viewBox="0 0 100 100" class="civ-tz-ring"><defs><linearGradient id="civTzG" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff4fb4"/><stop offset=".5" stop-color="#8b5cff"/><stop offset="1" stop-color="#3fd8ff"/></linearGradient></defs><circle cx="50" cy="50" r="40" fill="none" stroke="url(#civTzG)" stroke-width="9"/><circle cx="50" cy="10" r="5" fill="#fff"/></svg>';

export function teaserStage(row, screen, idx, fresh) {
  const kind = screen.teaser || screen.kind;
  const [pre, show] = BAND[kind] || BAND.comingup;
  const st = idx >= 0 ? screen.steps[idx] : null;
  const clips = screen.steps.filter(x => x.clip);
  const at = st?.clip ? clips.indexOf(st) : -1;
  const band = `<div class="civ-tz-band"><span>${pre}</span><b>${show}</b></div>`;
  const dots = clips.length ? `<div class="civ-tz-dots">${clips.map((_, i) => `<i class="${i === at ? 'on' : i < at ? 'done' : ''}"></i>`).join('')}</div>` : '';
  let body;
  if (!st || st.open || !st.clip) {
    // The opener: the ring, and what kind of night it is.
    body = `<div class="civ-tz-open${fresh ? ' new' : ''}">${RING}<div class="civ-tz-hook">${esc(st ? st.text : `${pre.toLowerCase()} the circle…`)}</div></div>`;
  } else {
    const c = st.clip, cam = faceUrl(c.cam);
    body = `<div class="civ-tz-clip${fresh ? ' new' : ''}" style="--glow:${c.ring}">
      <div class="civ-tz-cam"${bg(cam)}>${cam ? '' : esc((c.real || '?')[0])}<span class="rec">REC</span><span class="scan"></span></div>
      <div class="civ-tz-quote">
        <div class="civ-tz-who">${esc(c.real)}${c.as ? ` <i>as ${esc(c.as)}</i>` : ''}</div>
        <div class="civ-tz-tag">${c.aloud ? 'SAID ALOUD' : 'SENT'} · ${esc(c.where)} · DAY ${esc(c.day)}</div>
        <div class="civ-tz-line">${esc(st.text)}</div>
      </div></div>`;
  }
  return `<div class="civ-layer civ-tz ${esc(kind)}"><div class="civ-tz-bg"></div>${RING.replace('civ-tz-ring', 'civ-tz-ring big')}${band}${body}${dots}</div>`;
}

export const TEASER_CSS = `
.civ-tz{background:#04051a;overflow:hidden}
.civ-tz-bg{position:absolute;inset:0;background:radial-gradient(60% 70% at 70% 40%,rgba(139,92,255,.28),transparent 70%),radial-gradient(50% 60% at 15% 80%,rgba(255,79,180,.18),transparent 70%),repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 2px,transparent 2px 4px)}
.civ-tz.comingup .civ-tz-bg{background:radial-gradient(60% 70% at 70% 40%,rgba(255,79,180,.3),transparent 70%),radial-gradient(50% 60% at 15% 80%,rgba(139,92,255,.2),transparent 70%),repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 2px,transparent 2px 4px)}
.civ-tz.nexttime .civ-tz-bg{background:radial-gradient(60% 70% at 70% 40%,rgba(63,216,255,.26),transparent 70%),radial-gradient(50% 60% at 15% 80%,rgba(139,92,255,.22),transparent 70%),repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 2px,transparent 2px 4px)}
.civ-tz-ring.big{position:absolute;right:-12%;top:-22%;width:62%;opacity:.16;animation:civTzSpin 40s linear infinite}
@keyframes civTzSpin{to{transform:rotate(360deg)}}
.civ-tz-band{position:absolute;left:4%;top:6%;display:flex;flex-direction:column;line-height:1;z-index:2}
.civ-tz-band span{font-weight:800;font-size:1.5cqw;letter-spacing:.32em;color:#c9d2ff}
.civ-tz-band b{font-weight:900;font-size:3.6cqw;letter-spacing:.08em;background:linear-gradient(90deg,#ff4fb4,#8b5cff,#3fd8ff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 1.2cqw rgba(139,92,255,.6))}
.civ-tz-open{position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:2.4cqw;z-index:2}
.civ-tz-open .civ-tz-ring{width:16cqw;filter:drop-shadow(0 0 2cqw rgba(139,92,255,.8));animation:civTzPulse 2.4s ease-in-out infinite}
@keyframes civTzPulse{50%{transform:scale(1.06)}}
.civ-tz-hook{max-width:70%;text-align:center;font-weight:700;font-size:2.4cqw;line-height:1.35;color:#eef1ff}
.civ-tz-open.new{animation:civTzIn .7s ease-out both}
@keyframes civTzIn{from{opacity:0;transform:scale(.96)}}
.civ-tz-clip{position:absolute;left:4%;right:4%;top:24%;bottom:16%;display:grid;grid-template-columns:34% 1fr;gap:3.5%;align-items:center;z-index:2}
.civ-tz-cam{position:relative;aspect-ratio:4/5;border-radius:1cqw;background:#13163d center 20%/cover;border:.3cqw solid rgba(255,255,255,.85);box-shadow:0 0 3cqw var(--glow,#8b5cff);display:grid;place-items:center;font-weight:900;font-size:6cqw;overflow:hidden}
.civ-tz-cam .rec{position:absolute;left:.8cqw;top:.7cqw;font-size:.9cqw;font-weight:800;letter-spacing:.14em;color:#fff;background:rgba(0,0,0,.5);padding:.2cqw .6cqw;border-radius:.3cqw}
.civ-tz-cam .rec:before{content:"";display:inline-block;width:.6cqw;height:.6cqw;border-radius:50%;background:#ff4a6a;margin-right:.4cqw;box-shadow:0 0 6px #ff4a6a;animation:civBlink 1.2s infinite}
.civ-tz-cam .scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 2px,transparent 2px 4px);pointer-events:none}
.civ-tz-who{font-weight:900;font-size:2.4cqw;letter-spacing:.04em;text-transform:uppercase;color:#fff}
.civ-tz-who i{font-weight:700;font-style:normal;font-size:1.4cqw;color:#ff9ad4;text-transform:none}
.civ-tz-tag{margin:.6cqw 0 1.4cqw;font-weight:800;font-size:1cqw;letter-spacing:.16em;color:#8fd8ff}
.civ-tz-line{font-weight:600;font-size:2.6cqw;line-height:1.35;color:#eef1ff;border-left:.4cqw solid var(--glow,#8b5cff);padding-left:1.6cqw}
.civ-tz-clip.new .civ-tz-cam{animation:civTzGlitch .55s steps(5) both}
.civ-tz-clip.new .civ-tz-quote{animation:civTzSlide .6s .15s cubic-bezier(.2,1,.3,1) both}
@keyframes civTzGlitch{0%{opacity:0;clip-path:inset(40% 0 45% 0);transform:translateX(-4%)}30%{opacity:1;clip-path:inset(10% 0 70% 0);transform:translateX(3%)}60%{clip-path:inset(60% 0 5% 0);transform:translateX(-2%)}100%{clip-path:inset(0);transform:none}}
@keyframes civTzSlide{from{opacity:0;transform:translateX(4%)}}
.civ-tz-dots{position:absolute;left:0;right:0;bottom:6%;display:flex;justify-content:center;gap:1cqw;z-index:2}
.civ-tz-dots i{width:2.4cqw;height:.45cqw;border-radius:1cqw;background:rgba(255,255,255,.18)}
.civ-tz-dots i.done{background:rgba(139,92,255,.6)}.civ-tz-dots i.on{background:linear-gradient(90deg,#ff4fb4,#3fd8ff);box-shadow:0 0 1cqw rgba(139,92,255,.8)}
@media (prefers-reduced-motion: reduce){.civ-tz-ring.big,.civ-tz-open .civ-tz-ring{animation:none}.civ-tz-clip.new .civ-tz-cam,.civ-tz-clip.new .civ-tz-quote{animation:none}}
`;
