// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-titles.js — Secret Story's opening titles and closing, live
// ══════════════════════════════════════════════════════════════════════
//
// Part 4. Big Brother opens on a Blender render (titles.js); the House of
// Secrets opens on its own sequence, drawn live with the season's cast:
//
//   the Eye opens out of the dark, in a burst of pink;
//   "Every one of them has a secret.";
//   each housemate in turn, a SECRET seal stamped across them;
//   the house front, slowly pushed in; SECRET STORY, letter by letter.
//
// The closing is the cast on the wall (the eliminated greyed) under the title.
// The show's music, when the user adds it, is assets/audio/ss/theme.mp3 and
// ending.mp3; until then the sequence plays on its own clock. Skippable.
import { img, esc } from './stage.js';
import { bbxTitleReady, bbxTitleDone, trackTitleMedia } from './titles.js';
import { ssx, SS_TYPE_CSS } from './ss-type.js';

const PROPS = 'assets/sets/bb/secret-story/props';
const FRONT = 'assets/sets/bb/resort/secret-story/front-day.webp';
// The show's music (assets/audio/ss/, git-ignored: the user's own copies): the generic, I Wanna Chat, and the
// Epilogue. The sequence keeps its own clock and the music fades out when it ends; a missing file plays it silent.
const MUSIC = true;
// the generic's length (assets/audio/ss/theme.mp3, the music ends at 52.25 s), and the closing's
const SONG = 52.6, OUTRO = 14;
const GIF = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const PAL = ['#ff3ea5', '#19d3c5', '#7c5cff', '#f5c542', '#ff7a59', '#3bb3ff', '#c8137a', '#22c55e'];
const col = n => PAL[[...String(n)].reduce((h, c) => h + c.charCodeAt(0), 0) % PAL.length];

const CSS = `
@font-face{font-family:'SSNunito';src:url('assets/fonts/Nunito.woff2') format('woff2');font-weight:200 1000}
.sst{position:relative;aspect-ratio:16/9;max-width:1200px;margin:0 auto;border-radius:14px;overflow:hidden;container-type:inline-size;
  background:radial-gradient(ellipse at 50% 45%,#5b0d4f 0%,#2b0d3f 45%,#0d0414 100%);color:#fff;font-family:'SSNunito',sans-serif}
.sst *{box-sizing:border-box}
.sst .burst{position:absolute;inset:-20%;background:repeating-conic-gradient(from 0deg,rgba(255,62,165,.22) 0 8deg,transparent 8deg 18deg);opacity:0}
.sst.go .burst{animation:sst-burst 4s ease-out both,sst-spin 40s linear infinite}
.sst .eye{position:absolute;left:50%;top:44%;width:26cqw;translate:-50% -50%;opacity:0;filter:drop-shadow(0 0 4cqw rgba(255,62,165,.8))}
.sst.go .eye{animation:sst-eye 4.6s cubic-bezier(.2,.9,.2,1) both}
.sst .line{position:absolute;left:4%;right:4%;top:46%;text-align:center;font:700 4cqw 'SSAachen',sans-serif;opacity:0}
.sst.go .line{animation:sst-line 3.4s ease both;animation-delay:var(--d)}
.sst .line.sm{font-size:3cqw}
.sst .line.top{top:14%;z-index:3}
.sst .who{position:absolute;inset:0;opacity:0}
.sst.go .who{animation:sst-who var(--slot) ease both;animation-delay:var(--d)}
.sst .who .stripe{position:absolute;inset:0;background:repeating-linear-gradient(110deg,var(--c) 0 6cqw,color-mix(in srgb,var(--c) 70%,#fff) 6cqw 12cqw)}
.sst.go .who .stripe{animation:sst-slide var(--slot) linear both;animation-delay:var(--d)}
.sst .who .face{position:absolute;left:50%;top:44%;width:24cqw;aspect-ratio:4/5;translate:-50% -50%;border-radius:2cqw;overflow:hidden;background:var(--c);
  box-shadow:0 0 0 .6cqw #fff,0 2cqw 5cqw rgba(0,0,0,.5)}
.sst .who .face img{width:100%;height:100%;object-fit:cover;object-position:50% 14%;display:block}
.sst.go .who .face{animation:sst-face var(--slot) cubic-bezier(.2,1.2,.3,1) both;animation-delay:var(--d)}
.sst .who .seal{position:absolute;left:50%;top:46%;translate:-50% -50%;font:700 4.2cqw 'SSAachen',sans-serif;letter-spacing:.2em;color:#fff;background:#e11d48;
  padding:.6cqw 2.4cqw;border:.5cqw solid #fff;border-radius:1cqw;rotate:-12deg;opacity:0;box-shadow:0 1cqw 2cqw rgba(0,0,0,.4)}
.sst.go .who .seal{animation:sst-seal var(--slot) cubic-bezier(.2,1.6,.4,1) both;animation-delay:var(--d)}
.sst .who .nm{position:absolute;left:0;right:0;top:78%;text-align:center;font:700 5.2cqw 'SSAachen',sans-serif;opacity:0}
.sst.go .who .nm{animation:sst-name var(--slot) ease both;animation-delay:var(--d)}
.sst .who.out .face img{filter:grayscale(1) brightness(.75)}
.sst .house{position:absolute;inset:0;background:url('${FRONT}') center/cover;opacity:0}
.sst.go .house{animation:sst-house var(--fin) ease-out both;animation-delay:var(--d)}
.sst .logo{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1cqw;opacity:0}
.sst.go .logo{animation:sst-logo var(--fin) ease both;animation-delay:var(--d)}
.sst .logo img{width:13cqw;filter:drop-shadow(0 1cqw 2cqw rgba(0,0,0,.5))}
.sst .logo b{font:700 9cqw/1 'SSAachen',sans-serif;letter-spacing:.03em;display:flex}
.sst .logo b .lt{display:inline-block;opacity:0}
.sst.go .logo b .lt{animation:sst-letter .5s cubic-bezier(.2,1.6,.4,1) both;animation-delay:calc(var(--d) + var(--k) * .07s + .5s)}
.sst .logo{background:radial-gradient(ellipse 60% 40% at 50% 55%,rgba(43,13,63,.55),transparent 75%)}
.sst .logo i{font:700 1.9cqw 'SSAachen',sans-serif;letter-spacing:.3em;font-style:normal;color:#fff;text-transform:uppercase;background:rgba(43,13,63,.82);padding:.6cqw 1.6cqw;border-radius:3cqw;box-shadow:0 0 0 .2cqw #19d3c5}
.sst .wall{position:absolute;inset:6% 5% 30%;display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:1.2cqw}
.sst .wall .wt{width:var(--tw);aspect-ratio:4/5;border-radius:1cqw;overflow:hidden;background:var(--c);box-shadow:0 0 0 .3cqw #fff;opacity:0}
.sst .wall .wt img{width:100%;height:100%;object-fit:cover;object-position:50% 14%;display:block}
.sst .wall .wt.out img{filter:grayscale(1) brightness(.7)}
.sst.go .wall .wt{animation:sst-wall .5s cubic-bezier(.2,1.4,.4,1) both;animation-delay:var(--d)}
.sst .skip{position:absolute;right:18px;bottom:18px;z-index:5;padding:10px 18px;border-radius:999px;border:2px solid #fff;background:#ff3ea5;color:#fff;
  font:700 13px/1 'SSAachen',sans-serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;box-shadow:0 0 18px rgba(255,62,165,.7)}
.sst .play{position:absolute;inset:0;z-index:4;display:none;align-items:center;justify-content:center;border:0;background:rgba(13,4,20,.55);color:#fff;font:700 22px 'SSAachen',sans-serif;cursor:pointer}
.sst.blocked .play{display:flex}
@keyframes sst-burst{0%{opacity:0}30%{opacity:1}100%{opacity:.35}}
@keyframes sst-spin{to{rotate:360deg}}
@keyframes sst-eye{0%{opacity:0;scale:.2 .02}25%{opacity:1;scale:1 .04}45%{scale:1.06 1.06}55%{scale:1}85%{opacity:1}100%{opacity:0;scale:1.4}}
@keyframes sst-line{0%{opacity:0;translate:0 2cqw;letter-spacing:.3em}20%{opacity:1;translate:0;letter-spacing:.02em}80%{opacity:1}100%{opacity:0}}
@keyframes sst-who{0%{opacity:0}8%{opacity:1}88%{opacity:1}100%{opacity:0}}
@keyframes sst-slide{from{background-position:0 0}to{background-position:24cqw 0}}
@keyframes sst-face{0%{scale:.3;rotate:-10deg}18%{scale:1;rotate:0}85%{scale:1.04}100%{scale:1.1}}
@keyframes sst-seal{0%,30%{opacity:0;scale:3}42%{opacity:1;scale:1}88%{opacity:1}100%{opacity:0}}
@keyframes sst-name{0%,10%{opacity:0;translate:0 2cqw}25%{opacity:1;translate:0}90%{opacity:1}100%{opacity:0}}
@keyframes sst-house{0%{opacity:0;scale:1.25}20%{opacity:1}100%{opacity:1;scale:1}}
@keyframes sst-logo{0%{opacity:0}10%{opacity:1}100%{opacity:1}}
@keyframes sst-letter{from{opacity:0;translate:0 -5cqw;rotate:-20deg}to{opacity:1}}
@keyframes sst-wall{from{opacity:0;scale:1.4}to{opacity:1;scale:1}}
@media (prefers-reduced-motion:reduce){.sst *{animation-duration:.01s!important;animation-delay:0s!important}}
`;

// (each letter lettered on its own, so each can drop in on its own)
const letters = s => [...s].map((c, k) => `<span class="lt" style="--k:${k}">${c === ' ' ? '&nbsp;&nbsp;' : ssx(c)}</span>`).join('');

/** Secret Story's opening titles ('intro') or closing ('outro'), live with this season's cast. */
export function ssTitleScreen(kind, cast = [], title = '', gone = []) {
  const out = new Set(gone || []);
  const people = [...cast].sort((a, b) => a.localeCompare(b));   // never in placement order: it says nothing
  let body, secs;
  if (kind === 'intro') {
    // the Voice's slogan, as the real generic says it over the theme (S14 dailies: "Ils ont tous un secret…")
    const open = 4.4, said = 3.2 * 3;
    const t0 = open + said;
    // The whole sequence is the song (the user, 2026-10-29: the generic "I Wanna Chat", "manage to always place every
    // players in it and end it with the same"): every housemate gets an equal share of what the slogan leaves, and the
    // house and the logo land on the song's last bars, however big the cast.
    const n = Math.max(1, people.length);
    const slot = Math.max(0.6, Math.min(3, (SONG - t0 - 6) / n));
    const fin = Math.max(4, SONG - t0 - n * slot);
    secs = t0 + n * slot + fin;
    body = `<div class="burst"></div><img class="eye" src="${PROPS}/eye.webp" alt="">
      <div class="line" style="--d:${open - 0.2}s">${ssx('They all have a secret.', 'w')}</div>
      <div class="line sm" style="--d:${open + 3}s">${ssx('Their mission: keep it, whatever it costs.', 'w')}</div>
      <div class="line sm" style="--d:${open + 6.2}s">${ssx('But will they manage without being unmasked?', 'w')}</div>
      ${people.map((n, i) => `<div class="who ${out.has(n) ? 'out' : ''}" style="--c:${PAL[i % PAL.length]};--d:${(t0 + i * slot).toFixed(2)}s;--slot:${slot.toFixed(2)}s">
        <div class="stripe"></div><div class="face">${img(n)}</div><div class="seal">SECRET</div><div class="nm">${ssx(n)}</div></div>`).join('')}
      <div class="house" style="--d:${(secs - fin).toFixed(2)}s;--fin:${fin}s"></div>
      <div class="line sm top" style="--d:${(secs - fin - 0.4).toFixed(2)}s">${ssx('And above all, never forget: beware of appearances.', 'w')}</div>
      <div class="logo" style="--d:${(secs - fin + 0.6).toFixed(2)}s;--fin:${fin - 0.6}s"><b>${letters('SECRET STORY')}</b>${title ? `<i>${esc(title)}</i>` : '<i>The House of Secrets</i>'}</div>`;
  } else {
    secs = OUTRO;
    const cols = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(people.length * 2))));
    const rows = Math.ceil(people.length / cols);
    const tw = Math.min(84 / cols - 1.2, (56.25 * 0.62 / Math.max(1, rows) - 1.2) * 0.8).toFixed(2);
    body = `<div class="burst"></div><div class="wall" style="--tw:${tw}cqw">${people.map((n, i) => `<div class="wt ${out.has(n) ? 'out' : ''}" style="--c:${col(n)};--d:${(0.3 + i * 0.12).toFixed(2)}s">${img(n)}</div>`).join('')}</div>
      <div class="logo" style="--d:${(0.6 + people.length * 0.12).toFixed(2)}s;--fin:6s;justify-content:flex-end;padding-bottom:5%"><b style="font-size:6cqw">${letters('SECRET STORY')}</b><i>Keep your secrets</i></div>`;
  }
  // (the closing plays the same song's last bars, so it ends where the song does)
  const audio = kind === 'intro' ? 'assets/audio/ss/theme.mp3' : `assets/audio/ss/theme.mp3#t=${(SONG - OUTRO).toFixed(1)}`;
  return {
    id: `bb-${kind === 'intro' ? 'titles' : 'closing'}`,
    label: kind === 'intro' ? 'Opening Titles' : 'Closing',
    html: `<div class="sst bbt" data-ambient="none" data-secs="${secs.toFixed(1)}"><style>${SS_TYPE_CSS}${CSS}</style>${body}
  ${MUSIC ? `<audio src="${audio}" preload="auto" oncanplay="bbxTitleReady(this)" onplay="ssTitleClock(this)" onerror="ssTitleSilent(this)" onended="bbxTitleDone(this)"></audio>`
    : `<img src="${GIF}" alt="" style="display:none" onload="ssTitleSilent(this)">`}
  <button type="button" class="play" onclick="const a=this.closest('.sst').querySelector('audio');if(a)a.play().catch(()=>ssTitleSilent(this));else ssTitleSilent(this)">▶ PLAY</button>
  <button type="button" class="skip" onclick="bbxTitleDone(this)">Skip ${kind === 'intro' ? 'intro' : 'closing'} ▶</button>
</div>`,
  };
}

/** No music yet (or it failed): the sequence plays on its own clock, then the episode goes on. */
export function ssTitleSilent(el) {
  const box = el?.closest?.('.sst');
  if (!box || box.dataset.silent) return;
  box.dataset.silent = '1';
  box.classList.remove('blocked');
  box.classList.add('go');
  const secs = Number(box.dataset.secs) || 20;
  setTimeout(() => { if (box.isConnected) bbxTitleDone(box); }, secs * 1000);
}
/** The music started: the sequence runs on its clock, and the music fades out as it ends. */
export function ssTitleClock(el) {
  const box = el?.closest?.('.sst');
  if (!box || box.dataset.clock) return;
  box.dataset.clock = '1';
  box.classList.remove('blocked');
  box.classList.add('go');
  const secs = Number(box.dataset.secs) || 20;
  const v = /** @type {HTMLAudioElement} */ (el);
  trackTitleMedia(v);
  // (a sequence as long as its song ends with it: the song's own end closes it, `onended`)
  if (secs >= SONG - 0.5 || /#t=/.test(v.getAttribute('src') || '')) return;
  setTimeout(() => {
    if (!box.isConnected) return;
    const v0 = v.volume;
    let k = 0;
    const t = setInterval(() => { k++; v.volume = Math.max(0, v0 * (1 - k / 12)); if (k >= 12) { clearInterval(t); if (box.isConnected) bbxTitleDone(v); } }, 100);
  }, Math.max(0, secs - 1.2) * 1000);
}
if (typeof window !== 'undefined') Object.assign(window, { ssTitleSilent, ssTitleClock });
// (bbxTitleReady stays the music's way in, as Big Brother's live titles use it)
void bbxTitleReady;
