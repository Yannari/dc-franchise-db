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
 * @param {string} [o.with]    the person being spoken TO, dim on the right, no bolt
 * @param {boolean} [o.quick]  a swap mid-conversation: no slash, a short slide
 * @param {string[]} [o.known] the band under the name: the seasons they are known for
 */
export function cutIn(o) {
  // THE HOOD IS THE SPEAKER'S: a Traitor proposing a name is cloaked, the
  // Faithful they propose is not (the user caught the victim in a hood)
  const hooded = side => o.hood && side === 'l';
  const bust = (n, slug, side) => `<div class="tci-bust tci-${side}${hooded(side) ? ' tci-hooded' : ''}">`
    + `<div class="tci-av">${face(n, slug)}${hooded(side) ? '<i class="tci-hood"></i>' : ''}</div>`
    + `<div class="tci-nm" data-n="${esc(n)}"></div>`
    + (side === 'l' && o.known && o.known.length ? '<div class="tci-known">' + o.known.slice(0, 4).map(k =>
      `<i data-t="${esc(k)}"></i>`).join('') + '</div>' : '')
    + '</div>';
  return `<div class="tci tci-${o.tone || 'morning'}${o.fresh ? ' tci-fresh' : ''}${o.quick ? ' tci-quick' : ''}"${o.label ? ` data-l="${esc(o.label)}"` : ''}>`
    + '<div class="tci-speed"></div><div class="tci-slash"></div>'
    + bust(o.who, o.slug, 'l')
    + (o.at ? '<svg class="tci-bolt" viewBox="0 0 1000 560" preserveAspectRatio="none">'
      + '<polyline pathLength="100" points="280,263 410,240 470,291 570,251 630,296 720,274"/></svg>' + bust(o.at, null, 'r') : '')
    + (!o.at && o.with ? bust(o.with, null, 'r tci-with') : '')
    + '</div>';
}

// ── THE LINE-UP: a whole car, introduced at once ─────────────────────
// Everybody who got out of one car, side by side on the band, each with the
// seasons they are known for. The arrival's one big introduction per car.
export function lineup(o) {
  const names = o.names || [];
  return `<div class="tci tci-morning tci-line${o.fresh ? ' tci-fresh' : ''}"${o.label ? ` data-l="${esc(o.label)}"` : ''}>`
    + `<div class="tci-speed"></div><div class="tci-slash"></div><div class="tci-lrow" style="--n:${names.length}">`
    + names.map((n, i) => `<div class="tci-lb" style="--i:${i}"><div class="tci-av">${face(n)}</div>`
      + `<div class="tci-nm" data-n="${esc(n)}"></div>`
      + ((o.known && o.known[n] && o.known[n].length) ? '<div class="tci-known">' + o.known[n].slice(0, 3).map(k => `<i data-t="${esc(k)}"></i>`).join('') + '</div>' : '')
      + '</div>').join('') + '</div></div>';
}

// ── THE CONFESSIONAL: a SCENE SWITCH, not an overlay ─────────────────
//
// The user (2026-09-30): "we don't really see the difference between when
// they talk in confessional and when it's reality… we need an actual scene
// switch for confessional, and if they're talking live just zoom in the
// conversation". So a confessional cuts AWAY: the castle is gone, and the
// person is sitting in the confessional chair in the red room, letterboxed,
// talking to camera. The line itself stays in the stage's foot card.
const CONF_SET = (() => {
  let s = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%"><defs>'
    + '<radialGradient id="tcfLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="tcfWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a060e"/><stop offset=".7" stop-color="#4a0e18"/><stop offset="1" stop-color="#1a0408"/></linearGradient>'
    + '<linearGradient id="tcfChair" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a0a12"/><stop offset=".45" stop-color="#7a1626"/><stop offset="1" stop-color="#2a060c"/></linearGradient>'
    + '</defs><rect width="1600" height="900" fill="url(#tcfWall)"/>';
  // panelling
  for (let i = 0; i < 9; i++) s += `<rect x="${i * 180 + 20}" y="80" width="140" height="520" rx="6" fill="none" stroke="#12030a" stroke-width="6" opacity=".6"/>`
    + `<rect x="${i * 180 + 30}" y="90" width="120" height="500" rx="4" fill="#fff" opacity=".02"/>`;
  s += '<rect y="600" width="1600" height="300" fill="#140306"/><rect y="600" width="1600" height="10" fill="#6a3a18" opacity=".7"/>';
  // the lamp, and its light on the wall
  s += '<circle cx="1260" cy="330" r="420" fill="url(#tcfLamp)"/><path d="M1260 780 V360" stroke="#8a6428" stroke-width="6"/>'
    + '<path d="M1210 360 h100 l-22 -70 h-56Z" fill="#e0b070"/><path d="M1230 780 h60 l-10 -20 h-40Z" fill="#5a3a18"/>';
  // the wing chair the person sits in
  s += '<path d="M600 820 V360 Q600 220 800 210 Q1000 220 1000 360 V820Z" fill="url(#tcfChair)"/>'
    + '<path d="M560 820 V520 Q560 470 610 470 V820Z M1040 820 V520 Q1040 470 990 470 V820Z" fill="#5a0e1a"/>'
    + '<path d="M600 360 Q600 220 800 210 Q1000 220 1000 360" fill="none" stroke="#c9a24a" stroke-width="4" opacity=".7"/>';
  for (let x = 640; x <= 960; x += 64) for (let y = 300; y <= 560; y += 64) s += `<circle cx="${x}" cy="${y}" r="4" fill="#c9a24a" opacity=".55"/>`;
  s += '<rect width="1600" height="900" fill="url(#vignette)"/></svg>';
  return s;
})();

/** The cut to the confessional chair. */
export function confessional(o) {
  return `<div class="tcf${o.fresh ? ' tcf-fresh' : ''}">` + CONF_SET
    + `<div class="tcf-bust"><div class="tcf-av">${face(o.who, o.slug)}</div></div>`
    + `<div class="tcf-lt" data-n="${esc(o.who)}"></div>`
    + '<i class="tcf-bar tcf-top"></i><i class="tcf-bar tcf-bot"></i><i class="tcf-flash"></i></div>';
}

export const CUTIN_CSS = `
.tcf{position:absolute;inset:0;z-index:1950;overflow:hidden;pointer-events:none;background:#1a0408}
.tcf svg defs+rect{}
.tcf-bust{position:absolute;left:50%;top:21%;width:min(30%,300px);transform:translateX(-50%)}
.tcf-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 10% 10%/42% 42% 8% 8%;background:#141922;
  box-shadow:0 0 0 3px rgba(255,219,149,.35),0 0 60px rgba(255,190,110,.25),0 30px 60px rgba(0,0,0,.85);animation:tciIdle 4s ease-in-out infinite}
.tcf-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.tcf-av .trs-ini{font-size:40px}
.tcf-lt{position:absolute;left:6%;top:14%}
.tcf-lt::before{content:"Confessional";display:block;margin-bottom:6px;font-family:var(--v-display);font-weight:700;font-size:10px;letter-spacing:.42em;text-transform:uppercase;color:#8fa6c2}
.tcf-lt::after{content:attr(data-n);display:block;font-family:var(--v-display);font-weight:900;font-size:clamp(18px,2.2vw,30px);letter-spacing:.12em;text-transform:uppercase;color:#fff3d2}
.tcf-bar{position:absolute;left:0;right:0;height:9%;background:#000;z-index:3}
.tcf-top{top:0}.tcf-bot{bottom:0}
.tcf-flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:4}
.tcf.tcf-fresh{animation:tcfCut .5s steps(1) both}
@keyframes tcfCut{0%{clip-path:inset(0 0 0 100%)}20%{clip-path:inset(0 0 0 60%)}40%{clip-path:inset(0 0 0 20%)}60%{clip-path:inset(0)}}
.tcf.tcf-fresh .tcf-flash{animation:tcfFlash .35s ease-out .15s}
@keyframes tcfFlash{from{opacity:.35}to{opacity:0}}
.tcf.tcf-fresh .tcf-bust{animation:tcfIn .6s ease-out .2s both}
@keyframes tcfIn{from{opacity:0;transform:translateX(-50%) scale(1.06)}to{opacity:1;transform:translateX(-50%)}}
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
.tci-nm::before{content:attr(data-n);display:inline-block;padding:4px 14px;white-space:nowrap;font-family:var(--v-display);font-weight:900;font-size:clamp(14px,1.6vw,22px);
  letter-spacing:.18em;text-transform:uppercase;color:#fff3d2;background:rgba(6,4,3,.85);border:1px solid var(--glow);transform:skewX(-10deg)}
/* the hood: the conclave's speakers are cloaked */
.tci-hood{position:absolute;inset:-6% -14% 30% -14%;z-index:2;border-radius:50% 50% 30% 30%/62% 62% 18% 18%;pointer-events:none;
  background:radial-gradient(58% 70% at 50% 66%,transparent 50%,#2a0508 54%,#0e0205 100%)}
.tci-hooded .tci-av{border-radius:46% 46% 10% 10%/52% 52% 8% 8%}
.tci-bolt{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.tci-bolt polyline{fill:none;stroke:var(--rim);stroke-width:6;stroke-linejoin:bevel;filter:drop-shadow(0 0 8px var(--glow));stroke-dasharray:100}
.tci.tci-fresh .tci-bolt polyline{stroke-dashoffset:100;animation:tciBolt .38s cubic-bezier(.5,0,.9,.4) .7s forwards}
@keyframes tciBolt{to{stroke-dashoffset:0}}
/* the line-up */
.tci-lrow{position:absolute;left:4%;right:4%;top:24%;display:flex;justify-content:center;gap:4%}
.tci-lb{width:min(20%,210px,calc(88% / var(--n,4)));text-align:center}
.tci-lb .tci-av{aspect-ratio:1/1.12;height:auto}
.tci-lb .tci-known{width:130%;margin-left:-15%}
.tci.tci-fresh .tci-lb{animation:tciInL .5s cubic-bezier(.2,1.1,.3,1) both;animation-delay:calc(.1s + var(--i) * .18s)}
/* the band: what they are known for */
.tci-known{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin-top:8px;width:170%;margin-left:-35%}
.tci-known i::before{content:attr(data-t);display:inline-block;padding:3px 9px;white-space:nowrap;font-style:normal;font-family:var(--v-display);font-weight:700;
  font-size:clamp(9px,.85vw,11.5px);letter-spacing:.14em;text-transform:uppercase;color:#241b11;background:linear-gradient(180deg,#f7e2a6,#c99a48);
  box-shadow:0 4px 10px rgba(0,0,0,.6);transform:skewX(-10deg)}
.tci.tci-fresh .tci-known i{animation:tciTag .35s cubic-bezier(.2,1.3,.4,1) both}
.tci.tci-fresh .tci-known i:nth-child(1){animation-delay:.5s}.tci.tci-fresh .tci-known i:nth-child(2){animation-delay:.62s}
.tci.tci-fresh .tci-known i:nth-child(3){animation-delay:.74s}.tci.tci-fresh .tci-known i:nth-child(4){animation-delay:.86s}
@keyframes tciTag{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
/* the listener, and a swap mid-conversation */
.tci-with{opacity:.55;filter:saturate(.7) brightness(.8)}
.tci-with .tci-av{box-shadow:0 0 0 2px rgba(222,214,196,.4),0 24px 50px rgba(0,0,0,.9);animation:none}
.tci.tci-quick .tci-slash,.tci.tci-quick .tci-speed{animation:none}
.tci.tci-fresh.tci-quick .tci-l{animation:tciSwap .28s ease-out both}
.tci.tci-fresh.tci-quick .tci-r{animation:none}
@keyframes tciSwap{from{transform:translateX(-18%);opacity:0}to{transform:none;opacity:1}}
@media (max-width:700px){.tci-bust{height:28%}}
@media (prefers-reduced-motion:reduce){.tci *{animation:none!important}}
`;
