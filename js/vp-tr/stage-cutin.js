// ══════════════════════════════════════════════════════════════════════
// vp-tr/stage-cutin.js — the speaker cut-in every Traitors stage shares
// ══════════════════════════════════════════════════════════════════════
//
// The user, on the stages (2026-09-30): "i need to be wow like im in the
// conclave of the castle with them like a video game… i dont feel like in
// daganronpa rn". A spoken line is a CUT-IN: the room behind falls back and
// the speaker's bust slides in on a slash of colour, speed lines turning
// behind it; a line aimed at somebody brings them in from the other side. The
// palette says whose moment it is — the breakfast room's morning gold, the
// host's candle, the conclave's blood under the hoods, the confessional's
// blue.
//
// NO WORDS IN THE MARKUP. The backlog reads screen text, so every label and
// every name here is drawn by CSS from a data attribute.
import { trsEsc as esc, trsFace as face } from './castle-stage.js';

/**
 * @param {object} o
 * @param {string} o.who       the speaker
 * @param {string} [o.slug]    portrait slug (the host)
 * @param {string} [o.tone]    'morning' | 'host' | 'blood' | 'steel' | 'cam'
 * @param {string} [o.label]   the tag over the bust ("The host", "Accuses")
 * @param {string} [o.at]      somebody the line is aimed at
 * @param {boolean} [o.fresh]  play the entrance, or draw it at rest
 * @param {boolean} [o.hood]   draw the speaker under a hood (the conclave)
 */
export function cutIn(o) {
  const bust = (n, slug, side) => `<div class="tci-bust tci-${side}${o.hood ? ' tci-hooded' : ''}">`
    + `<div class="tci-av">${face(n, slug)}${o.hood ? '<i class="tci-hood"></i>' : ''}</div>`
    + `<div class="tci-nm" data-n="${esc(n)}"></div></div>`;
  return `<div class="tci tci-${o.tone || 'morning'}${o.fresh ? ' tci-fresh' : ''}"${o.label ? ` data-l="${esc(o.label)}"` : ''}>`
    + '<div class="tci-speed"></div><div class="tci-slash"></div>'
    + bust(o.who, o.slug, 'l')
    + (o.at ? '<svg class="tci-bolt" viewBox="0 0 1000 560" preserveAspectRatio="none">'
      + '<polyline pathLength="100" points="280,263 410,240 470,291 570,251 630,296 720,274"/></svg>' + bust(o.at, null, 'r') : '')
    + '</div>';
}

export const CUTIN_CSS = `
.tci{position:absolute;inset:0;z-index:2000;pointer-events:none;overflow:hidden;
  --c1:rgba(255,219,149,.55);--c2:rgba(120,70,20,.3);--rim:#fff3d2;--glow:rgba(255,219,149,.45);--tag:#ffdb95;--tagc:#241b11}
.tci-host{--c1:rgba(255,226,160,.55);--c2:rgba(80,50,20,.35)}
.tci-blood{--c1:rgba(201,40,60,.6);--c2:rgba(60,5,12,.5);--rim:#ff6a74;--glow:rgba(201,40,60,.55);--tag:#c9283c;--tagc:#fff}
.tci-steel{--c1:rgba(143,166,194,.5);--c2:rgba(30,40,60,.4);--rim:#cfdcee;--glow:rgba(143,166,194,.5);--tag:#b8c8de;--tagc:#0b1018}
.tci-cam{--c1:rgba(110,150,210,.5);--c2:rgba(15,25,45,.5);--rim:#bcd2f0;--glow:rgba(110,150,210,.5);--tag:#8fa6c2;--tagc:#0b1018}
.tci-speed{position:absolute;left:-50%;top:-50%;width:200%;height:200%;opacity:.12;
  background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(255,243,210,.9) 0deg .7deg,transparent .7deg 6deg);
  -webkit-mask:radial-gradient(circle at 50% 50%,transparent 18%,#000 55%);mask:radial-gradient(circle at 50% 50%,transparent 18%,#000 55%);
  animation:tciSpin 40s linear infinite}
@keyframes tciSpin{to{transform:rotate(360deg)}}
.tci-slash{position:absolute;left:-10%;right:-10%;top:28%;height:34%;transform:skewY(-6deg);
  background:linear-gradient(90deg,transparent,var(--c1) 20%,var(--c2) 62%,transparent);box-shadow:0 0 0 2px var(--glow),0 0 60px var(--glow)}
.tci.tci-fresh .tci-slash{animation:tciSlash .45s cubic-bezier(.2,.9,.2,1) both}
@keyframes tciSlash{from{transform:skewY(-6deg) translateX(-110%)}to{transform:skewY(-6deg)}}
.tci::before{content:attr(data-l);position:absolute;left:9%;top:19%;z-index:3;padding:3px 12px;font-family:var(--v-display);font-weight:900;font-size:11px;
  letter-spacing:.42em;text-transform:uppercase;transform:skewX(-10deg);color:var(--tagc);background:var(--tag)}
.tci:not([data-l])::before{display:none}
.tci-bust{position:absolute;bottom:34%;height:38%;aspect-ratio:1/1.12;text-align:center}
.tci-l{left:9%}
.tci-r{right:9%;height:31%;bottom:37%}
.tci-av{position:relative;width:100%;height:100%;overflow:hidden;border-radius:50% 50% 10% 10%/42% 42% 8% 8%;background:linear-gradient(162deg,#252b37,#080b11);
  box-shadow:0 0 0 3px var(--rim),0 0 50px var(--glow),0 24px 50px rgba(0,0,0,.9);animation:tciIdle 3.2s ease-in-out infinite}
.tci-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.tci-av .trs-ini{font-size:34px}
@keyframes tciIdle{50%{transform:translateY(-5px) scale(1.01)}}
.tci.tci-fresh .tci-l{animation:tciInL .55s cubic-bezier(.2,1.1,.3,1) .08s both}
@keyframes tciInL{from{transform:translateX(-160%) skewX(-12deg);opacity:0}to{transform:none;opacity:1}}
.tci.tci-fresh .tci-r{animation:tciInR .5s cubic-bezier(.2,1.1,.3,1) .35s both}
@keyframes tciInR{from{transform:translateX(170%) skewX(12deg);opacity:0}to{transform:none;opacity:1}}
.tci-r .tci-av{filter:saturate(.85)}
.tci-nm{margin-top:10px}
.tci-nm::before{content:attr(data-n);display:inline-block;padding:4px 14px;font-family:var(--v-display);font-weight:900;font-size:clamp(14px,1.6vw,22px);
  letter-spacing:.18em;text-transform:uppercase;color:#fff3d2;background:rgba(6,4,3,.85);border:1px solid var(--glow);transform:skewX(-10deg)}
/* the hood: the conclave's speakers are cloaked */
.tci-hood{position:absolute;inset:-6% -14% 30% -14%;z-index:2;border-radius:50% 50% 30% 30%/62% 62% 18% 18%;pointer-events:none;
  background:radial-gradient(58% 70% at 50% 66%,transparent 50%,#2a0508 54%,#0e0205 100%)}
.tci-hooded .tci-av{border-radius:46% 46% 10% 10%/52% 52% 8% 8%}
.tci-bolt{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.tci-bolt polyline{fill:none;stroke:var(--rim);stroke-width:6;stroke-linejoin:bevel;filter:drop-shadow(0 0 8px var(--glow));stroke-dasharray:100}
.tci.tci-fresh .tci-bolt polyline{stroke-dashoffset:100;animation:tciBolt .38s cubic-bezier(.5,0,.9,.4) .7s forwards}
@keyframes tciBolt{to{stroke-dashoffset:0}}
@media (max-width:700px){.tci-bust{height:28%}}
@media (prefers-reduced-motion:reduce){.tci *{animation:none!important}}
`;
