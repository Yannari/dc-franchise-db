// ══════════════════════════════════════════════════════════════════════
// vp-tr/stage-cards.js — the line at the foot of a stage
// ══════════════════════════════════════════════════════════════════════
//
// Every stage after the castle day plays its page's lines (stage-lines.js)
// one at a time, and the line being said sits at the foot of the frame: the
// host's, a player's (with their face), the narration, a reaction, or the
// audience's aside in blood-red. One look and one set of motion for all of
// them, so breakfast, the turret and the missions read as one programme.
import { trsEsc as esc, trsFace as face, trsWords as words } from './castle-stage.js';

/** The card for step `st`, or ''. `host` is `{ name, slug }`. */
export function footCard(st, host, opts = {}) {
  if (!st) return '';
  const cls = 'tsc-slot' + (opts.over ? ' tsc-over' : '');
  if (st.t === 'host') {
    return `<div class="${cls}"><div class="tsc-card tsc-hostcard"><span class="tsc-f tsc-hf">${face(host.name, host.slug)}</span>`
      + `<div><div class="tsc-k">${esc(host.name)}</div><p class="tsc-type" data-q="1"></p></div></div></div>`;
  }
  // LIVE TALK: the speaker's portrait breaks out of the box and their name
  // sits on a tab, so a line said in the room reads as somebody talking
  // rather than as an intertitle (the camera does the rest, on the stage)
  if (st.t === 'say') {
    return `<div class="${cls}"><div class="tsc-card tsc-live">` + (opts.head || '')
      + `<span class="tsc-pop">${face(st.who)}</span><span class="tsc-name">${esc(st.who)}</span>`
      + '<p class="tsc-type" data-q="1"></p></div></div>';
  }
  if (st.t === 'cam') {
    return `<div class="${cls}"><div class="tsc-card${st.t === 'cam' ? ' tsc-camcard' : ''}">`
      + (opts.head || '')
      + `<div class="tsc-quote"><span class="tsc-f">${face(st.who)}</span><div><p class="tsc-type" data-q="1"></p>`
      + `<small>${esc(st.who)}${st.t === 'cam' ? ' · to camera' : ''}</small></div></div></div></div>`;
  }
  if (st.t === 'narr') {
    return `<div class="${cls}"><div class="tsc-card tsc-narr${st.aud ? ' tsc-aud' : ''}${st.murmur ? ' tsc-mur' : ''}">`
      + (st.tag ? `<span class="tsc-tag">${esc(st.tag)}</span>` : '')
      + (st.react && st.who ? `<span class="tsc-f tsc-rf">${face(st.who)}</span>` : '')
      + '<p class="tsc-type"></p></div></div>';
  }
  return '';
}

/** Types the card's line in (or sets it, on a repaint), and slides it up. */
export function playCard(el, st, S, fresh) {
  const slot = el.querySelector('.tsc-slot');
  if (!slot) return;
  requestAnimationFrame(() => slot.classList.add('tsc-in'));
  const p = slot.querySelector('.tsc-type');
  if (!p) return;
  const txt = p.dataset.q ? '“' + st.text + '”' : st.text;
  if (!fresh) { p.textContent = txt; return; }
  // the card arrives first, then its words (see `trsWords`)
  words(p, txt, 160);
}


// ── WHO TOOK THE SHIELD (2026-10-03) ─────────────────────────────────
//
// The user: "i cant really see who won the shield in the watch it played
// viewer during a mission". It was a line of text on a card; the field did
// not change. Now the relic RISES over the field with the winner's face in
// it and their name under it, and from then on the winner wears a small
// gold shield on their portrait. A layer that did not see who took it gets
// the relic with a question mark in it — the page's own gate.
const _RELIC_PATH = 'M50 4 L94 16 V52 C94 84 72 100 50 110 C28 100 6 84 6 52 V16 Z';
export function relicBadge(kind) {
  return `<i class="trs-relic-badge" data-kind="${kind === 'dagger' ? 'dagger' : 'shield'}"><svg viewBox="0 0 100 114" aria-hidden="true">`
    + (kind === 'dagger'
      ? '<path d="M50 4 L58 70 H42 Z" fill="#e6e9ee" stroke="#3a2208" stroke-width="5"/><rect x="28" y="70" width="44" height="9" rx="3" fill="#d8b46a"/><rect x="45" y="79" width="10" height="28" rx="3" fill="#5a3a18"/>'
      : `<path d="${_RELIC_PATH}" fill="#8e1526" stroke="#e8c270" stroke-width="9"/><circle cx="50" cy="52" r="12" fill="#e8c270"/>`)
    + '</svg></i>';
}
/** The relic, risen over the stage. `r` = { kind, holder (null when unseen), awarded }. */
export function relicReveal(r, fresh) {
  const kind = r.kind === 'dagger' ? 'dagger' : 'shield';
  const word = kind === 'dagger' ? 'The Dagger' : 'The Shield';
  const name = !r.awarded ? 'Nothing came back' : r.holder ? r.holder : 'You did not see who';
  return `<div class="trs-relic${fresh ? ' trs-relic-in' : ''}${r.awarded ? '' : ' trs-relic-none'}" data-kind="${kind}">`
    + `<div class="trs-relic-emblem"><svg class="trs-relic-svg" viewBox="0 0 100 114" aria-hidden="true">`
    + `<defs><clipPath id="trsRelicClip"><path d="${_RELIC_PATH}"/></clipPath></defs>`
    + `<path d="${_RELIC_PATH}" fill="${kind === 'dagger' ? '#20242c' : '#5a0c16'}"/></svg>`
    + (r.awarded && r.holder ? `<div class="trs-relic-face">${face(r.holder)}</div>`
      : `<div class="trs-relic-q">${r.awarded ? '?' : ''}</div>`)
    + `<svg class="trs-relic-rim" viewBox="0 0 100 114" aria-hidden="true"><path d="${_RELIC_PATH}" fill="none" stroke="#e8c270" stroke-width="5"/></svg></div>`
    + `<div class="trs-relic-k">${word}</div><div class="trs-relic-nm">${esc(name)}</div></div>`;
}

export const CARD_CSS = `
.trs-relic{position:absolute;left:50%;top:9%;z-index:2200;transform:translateX(-50%);text-align:center;pointer-events:none;
  filter:drop-shadow(0 18px 30px rgba(0,0,0,.85))}
.trs-relic.trs-relic-in{animation:trsRelicIn 1.3s cubic-bezier(.2,1.2,.3,1) both}
@keyframes trsRelicIn{0%{opacity:0;transform:translateX(-50%) translateY(60px) scale(.4)}60%{opacity:1}100%{opacity:1;transform:translateX(-50%)}}
.trs-relic-emblem{position:relative;width:clamp(110px,13vw,170px);aspect-ratio:100/114;margin:0 auto}
.trs-relic-emblem::before{content:"";position:absolute;inset:-30%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,206,120,.55),transparent);
  animation:trsRelicGlow 2.4s ease-in-out infinite}
@keyframes trsRelicGlow{50%{opacity:.45;transform:scale(.9)}}
.trs-relic-svg,.trs-relic-rim{position:absolute;inset:0;width:100%;height:100%}
.trs-relic-rim{z-index:3}
.trs-relic-face{position:absolute;inset:0;z-index:2;clip-path:path('M50 4 L94 16 V52 C94 84 72 100 50 110 C28 100 6 84 6 52 V16 Z');overflow:hidden}
.trs-relic-face img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 16%}
.trs-relic-q{position:absolute;inset:0;z-index:2;display:grid;place-items:center;font-family:var(--v-display);font-weight:900;font-size:clamp(40px,5vw,70px);color:#e8c270}
.trs-relic-k{margin-top:10px;font-family:var(--v-display);font-weight:700;font-size:12px;letter-spacing:.42em;text-transform:uppercase;color:#e8c270}
.trs-relic-nm{display:inline-block;margin-top:5px;padding:4px 14px;font-family:var(--v-display);font-weight:900;font-size:clamp(14px,1.6vw,22px);letter-spacing:.14em;
  text-transform:uppercase;color:#241b11;background:linear-gradient(180deg,#f7e2a6,#c99a48)}
.trs-relic.trs-relic-none{opacity:.75}
.trs-relic.trs-relic-none .trs-relic-nm{background:rgba(20,16,12,.85);color:#ded6c4}
.trs-relic-badge{position:absolute;right:-18%;top:-14%;z-index:8;width:55%;max-width:44px;min-width:22px;filter:drop-shadow(0 0 8px rgba(255,206,120,.85)) drop-shadow(0 3px 4px rgba(0,0,0,.8));
  animation:trsBadge 2.4s ease-in-out infinite}
.trs-relic-badge svg{display:block;width:100%}
@keyframes trsBadge{50%{filter:drop-shadow(0 0 14px rgba(255,206,120,1)) drop-shadow(0 3px 4px rgba(0,0,0,.8))}}
.trs-relic-holder{z-index:40!important;filter:none!important;opacity:1!important}
.trs-relic-holder [class$="-av"]{box-shadow:0 0 0 3px #e8c270,0 0 26px rgba(232,194,112,.75)!important}
@media (prefers-reduced-motion:reduce){.trs-relic,.trs-relic-badge,.trs-relic-emblem::before{animation:none!important}}
.tsc-slot{position:absolute;left:50%;bottom:3.5%;width:min(64%,780px);transform:translate(-50%,12px);opacity:0;z-index:3200;transition:.4s}
.tsc-slot.tsc-in{opacity:1;transform:translate(-50%,0)}
.tsc-slot.tsc-over{z-index:3400}
.tsc-card{padding:13px 18px 12px;background:linear-gradient(160deg,rgba(26,14,7,.97),rgba(10,6,4,.98));border:1px solid rgba(222,214,196,.17);box-shadow:0 18px 40px rgba(0,0,0,.75)}
.tsc-k{font-family:var(--v-display);font-size:9.5px;font-weight:700;letter-spacing:.32em;color:rgba(222,214,196,.62);text-transform:uppercase}
.tsc-f{position:relative;display:block;flex:none;width:40px;height:44px;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922}
.tsc-f img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.tsc-f .trs-ini{font-size:12px}
.tsc-hf{width:52px;height:58px}
.tsc-quote{display:flex;gap:12px;align-items:flex-start;padding:9px 12px;border-left:2px solid rgba(222,214,196,.17);background:rgba(255,243,210,.03)}
.tsc-quote p,.tsc-hostcard p{margin:0;font-family:var(--v-hand);font-size:clamp(16px,1.45vw,20px);line-height:1.38;color:#ded6c4;min-height:1.4em}
.tsc-quote small{display:block;margin-top:4px;font-family:var(--v-display);font-size:9.5px;font-weight:700;letter-spacing:.28em;color:rgba(222,214,196,.62);text-transform:uppercase}
.tsc-hostcard{display:flex;gap:14px;align-items:center;background:radial-gradient(80% 140% at 50% 50%,rgba(74,40,16,.98),rgba(10,6,4,.98))}
.tsc-hostcard p{font-style:italic;color:#fff3d2}
.tsc-live{position:relative;padding:18px 22px 14px 132px;min-height:74px;background:linear-gradient(160deg,rgba(34,18,8,.97),rgba(10,6,4,.98));border-color:rgba(255,219,149,.35)}
.tsc-live p{margin:0;font-family:var(--v-hand);font-size:clamp(17px,1.55vw,21px);line-height:1.4;color:#f6efdf;min-height:1.4em}
.tsc-pop{position:absolute;left:16px;bottom:10px;width:100px;height:112px;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922;
  box-shadow:0 0 0 3px #ffdb95,0 0 24px rgba(255,219,149,.45),0 12px 24px rgba(0,0,0,.8)}
.tsc-pop img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.tsc-name{position:absolute;left:124px;top:-13px;padding:3px 13px;font-family:var(--v-display);font-weight:900;font-size:11.5px;letter-spacing:.2em;
  text-transform:uppercase;color:#241b11;background:linear-gradient(180deg,#f7e2a6,#c99a48);transform:skewX(-10deg);box-shadow:0 4px 10px rgba(0,0,0,.6)}
/* EACH KIND OF CARD ARRIVES ITS OWN WAY, from an edge or a depth, never out of the middle */
.tsc-slot.tsc-in .tsc-narr{animation:tscRise .55s cubic-bezier(.2,.7,.2,1) both}
.tsc-slot.tsc-in .tsc-hostcard{animation:tscWipe .5s cubic-bezier(.3,.7,.2,1) both}
.tsc-slot.tsc-in .tsc-camcard{animation:tscSettle .6s cubic-bezier(.2,.7,.2,1) both}
.tsc-slot.tsc-in .tsc-live{animation:tscSlide .4s cubic-bezier(.2,.8,.2,1) both}
@keyframes tscRise{from{opacity:0;transform:translateY(16px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
@keyframes tscWipe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes tscSettle{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:none}}
@keyframes tscSlide{from{opacity:0;transform:translateX(-22px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.tsc-slot.tsc-in .tsc-card{animation:none}}
.tsc-slot.tsc-in .tsc-pop{animation:tscPop .45s cubic-bezier(.2,1.5,.4,1) both}
.tsc-slot.tsc-in .tsc-name{animation:tscTab .35s ease-out .1s both}
@keyframes tscPop{from{transform:translateY(24px) scale(.7);opacity:0}to{transform:none;opacity:1}}
@keyframes tscTab{from{transform:skewX(-10deg) translateX(-14px);opacity:0}to{transform:skewX(-10deg);opacity:1}}
.tsc-camcard{background:linear-gradient(170deg,#1a2230,#0f141d);border-color:rgba(143,166,194,.4)}
.tsc-camcard .tsc-quote p{color:#dfe7f2}.tsc-camcard small{color:#8fa6c2}
.tsc-narr{display:flex;flex-direction:column;align-items:center;gap:6px}
.tsc-narr p{margin:0;font-family:var(--v-body);font-style:italic;font-size:clamp(16px,1.5vw,21px);line-height:1.38;color:#f1e6cc;text-align:center}
.tsc-rf{width:34px;height:38px;box-shadow:0 0 0 2px rgba(224,160,73,.5)}
.tsc-tag{display:block;text-align:center;font-family:var(--v-display);font-style:normal;font-size:9.5px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:var(--v-lantern)}
.tsc-aud{border-color:rgba(201,40,60,.45);background:linear-gradient(160deg,rgba(58,10,18,.97),rgba(20,5,8,.98))}
.tsc-aud .tsc-tag{color:#e87a82}
.tsc-mur .tsc-tag{color:rgba(222,214,196,.62)}
@media (max-width:700px){.tsc-slot{width:92%}}
`;
