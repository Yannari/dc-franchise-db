// ══════════════════════════════════════════════════════════════════════
// vp-tr/stage-cards.js — the line at the foot of a stage
// ══════════════════════════════════════════════════════════════════════
//
// Every stage after the castle day plays its page's lines (stage-lines.js)
// one at a time, and the line being said sits at the foot of the frame: the
// host's, a player's (with their face), the narration, a reaction, or the
// audience's aside in blood-red. One look and one set of motion for all of
// them, so breakfast, the turret and the missions read as one programme.
import { trsEsc as esc, trsFace as face } from './castle-stage.js';

/** The card for step `st`, or ''. `host` is `{ name, slug }`. */
export function footCard(st, host, opts = {}) {
  if (!st) return '';
  const cls = 'tsc-slot' + (opts.over ? ' tsc-over' : '');
  if (st.t === 'host') {
    return `<div class="${cls}"><div class="tsc-card tsc-hostcard"><span class="tsc-f tsc-hf">${face(host.name, host.slug)}</span>`
      + `<div><div class="tsc-k">${esc(host.name)}</div><p class="tsc-type" data-q="1"></p></div></div></div>`;
  }
  if (st.t === 'say' || st.t === 'cam') {
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
  p.textContent = '';
  let k = 0;
  const t = setInterval(() => { p.textContent = txt.slice(0, ++k); if (k >= txt.length) clearInterval(t); },
    p.dataset.q ? 16 : 12);
  S.timers.push(t);
}


export const CARD_CSS = `
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
