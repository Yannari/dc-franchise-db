// ══════════════════════════════════════════════════════════════════════
// vp-dr/host-card.js — the host speaks: one card, every lip sync
// ══════════════════════════════════════════════════════════════════════
//
// The weekly lip sync and the lip sync for the crown both put the host's
// words on a card of her own: the portrait large and gold-ringed, her name
// under it, her words bright and big, the queen she is addressing beside
// the line. The mood colours it (shantay green, sashay red, a win gold, the
// pauses hushed) and the three words of the speech slam in full width.
import { _portrait, _judgePortrait } from './style.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export const HOST_CARD_CSS = `
/* THE HOST'S CARD. */
.dr-step:has(> .dr-host){container-type:inline-size}
.dr-panel.dr-host{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;padding:18px 24px;position:relative;overflow:hidden;
  --dr-accent:#FFD66B;
  background:radial-gradient(120% 160% at 0% 50%,rgba(255,214,107,.18),transparent 55%),linear-gradient(135deg,#2c1226,#150914)}
.dr-host::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.09) 50%,transparent 65%);transform:translateX(-120%)}
.dr-step.dr-vis .dr-host{animation:drHostIn .55s cubic-bezier(.2,1.2,.3,1) both}
.dr-step.dr-vis .dr-host::after{animation:drHostSheen 1.1s .15s ease-out both}
@keyframes drHostIn{0%{opacity:0;transform:translateY(16px) scale(.98)}100%{opacity:1;transform:none}}
@keyframes drHostSheen{to{transform:translateX(120%)}}
.dr-host-por{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px}
.dr-host-por .dr-por{display:block;border-radius:50%;object-fit:cover;border:0;box-shadow:0 0 0 3px #FFD66B,0 0 26px rgba(255,214,107,.45)}
.dr-step.dr-vis .dr-host-por .dr-por{animation:drHostRing 1.6s ease-out both}
@keyframes drHostRing{0%{box-shadow:0 0 0 3px #FFD66B,0 0 0 0 rgba(255,214,107,.7)}100%{box-shadow:0 0 0 3px #FFD66B,0 0 0 18px rgba(255,214,107,0)}}
.dr-host-tag{font:700 10px/1 system-ui,sans-serif;letter-spacing:.28em;text-transform:uppercase;color:#FFD66B}
.dr-host-body{display:flex;flex-direction:column;gap:8px;min-width:0}
.dr-host-to{display:inline-flex;align-items:center;gap:8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#f7c9dd}
.dr-host-to .dr-por{border:2px solid rgba(255,255,255,.35)}
.dr-host-line{margin:0;font-size:17px;line-height:1.55;color:#cfb3c2;text-wrap:pretty}
.dr-host-said{color:#fff;font-size:20px;font-weight:600}
.dr-host-line em{font-style:normal;color:#FF3D9A;text-shadow:0 0 18px rgba(255,61,154,.55)}
/* the pauses: hushed */
.dr-panel.dr-host-hush{--dr-accent:#9b7cc0;background:radial-gradient(120% 160% at 0% 50%,rgba(160,120,200,.14),transparent 55%),linear-gradient(135deg,#1c1022,#0e0810)}
.dr-host-hush .dr-host-said{font-style:italic;letter-spacing:.04em}
/* the three words: full width, slammed */
.dr-host-big .dr-host-line{font:400 clamp(30px,4.2vw,52px)/1.05 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.dr-host-big .dr-host-said{font:inherit;color:#fff}
.dr-host-big .dr-host-line em{color:#FF3D9A}
.dr-step.dr-vis .dr-host-big .dr-host-line{animation:drSlam .75s cubic-bezier(.2,1.5,.4,1) both}
@keyframes drSlam{0%{opacity:0;transform:scale(2.1);filter:blur(6px)}60%{opacity:1;transform:scale(.96);filter:blur(0)}100%{transform:scale(1)}}
/* the verdict */
.dr-panel.dr-host-shantay{--dr-accent:#3DDC97;background:radial-gradient(120% 160% at 0% 50%,rgba(61,220,151,.2),transparent 55%),linear-gradient(135deg,#12261d,#0a140f)}
.dr-host-shantay .dr-host-said{color:#d9ffe9}
.dr-panel.dr-host-sashay{--dr-accent:#FF294B;background:radial-gradient(120% 160% at 0% 50%,rgba(255,41,75,.2),transparent 55%),linear-gradient(135deg,#2a0e14,#14070a)}
.dr-panel.dr-host-win{--dr-accent:#FFD66B;background:radial-gradient(120% 160% at 0% 50%,rgba(255,214,107,.28),transparent 55%),linear-gradient(135deg,#2c2210,#140f07)}
/* A NARROW COLUMN (the finale's cards sit beside the bracket rail): the
   portrait and her name on a row above the words, and the words smaller. */
@container (max-width:560px){
  .dr-panel.dr-host{grid-template-columns:1fr;gap:10px;padding:14px 16px}
  .dr-host-por{flex-direction:row;gap:10px}
  .dr-host-por .dr-por{width:52px!important;height:52px!important}
  .dr-host-said{font-size:17px}.dr-host-line{font-size:15px}
  .dr-host-big .dr-host-line{font-size:30px}
}
@media (max-width:620px){.dr-host{grid-template-columns:1fr;justify-items:start;gap:12px;padding:16px}
  .dr-host-por{flex-direction:row}.dr-host-said{font-size:18px}}
@media (prefers-reduced-motion:reduce){.dr-step.dr-vis .dr-host,.dr-step.dr-vis .dr-host::after,.dr-step.dr-vis .dr-host-big .dr-host-line,.dr-step.dr-vis .dr-host-por .dr-por{animation:none}}
`;

/**
 * One host card. `tone`: plain | hush | big | shantay | sashay | win.
 * Her quoted words are set bright and big, the staging around them softer,
 * and the speech's key words ("elimination", "FOR. THE. CROWN!") lit.
 */
export function hostCard({ id, ep, text, who = null, tone = 'plain' }) {
  const line = esc(text).replace(/&quot;([^]*?)&quot;/g, '<span class="dr-host-said">&quot;$1&quot;</span>')
    .replace(/\b(elimination|FOR\. YOUR\. LIFE!|FOR\. THE\. WIN!|FOR\. YOUR\. LEGACY!|FOR\. THE\. CROWN!)/g, '<em>$1</em>');
  const to = who ? `<span class="dr-host-to">${_portrait(who, ep, { size: 34 })}<b>${esc(who)}</b></span>` : '';
  return `<div class="dr-step" id="${id}">
    <div class="dr-panel dr-a-lip dr-host dr-host-${tone}">
      <div class="dr-host-por">${_judgePortrait('rupaul', { stage: true, size: 84 })}<span class="dr-host-tag">RuPaul</span></div>
      <div class="dr-host-body">${to}<p class="dr-host-line">${line}</p></div>
    </div></div>`;
}
