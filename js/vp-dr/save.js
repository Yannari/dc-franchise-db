// ══════════════════════════════════════════════════════════════════════
// vp-dr/save.js — the season's save, staged
// ══════════════════════════════════════════════════════════════════════
//
// Three screens for the four saves in js/dr/saves.js:
//   save-intro  the twist explained (or the tank drained)
//   save-hold   the winner — or the baguette's holder — saves one of three
//   save-luck   the lip sync loser opens her bar or pulls a lever
//
// ── ONE STAGE, DRIVEN BY THE REVEAL ───────────────────────────────────
// Each screen is a full-width stage above its cards. The cards are the words;
// the stage is the moment. Every reveal step carries a STATE for the stage
// (`window._svx[suffix].steps[idx]`) and `_drRevealExtra` applies it by
// flipping data attributes — no rebuild, so transitions and keyframes play.
//
// A result lands in two beats: the ASK (the bar trembles, the levers wait)
// and the REVEAL. A reveal passes through its suspense phase first — the
// wrapper tearing, the lever going down, the spotlights sweeping — and lands
// on the answer a second later, unless the viewer jumped (Reveal all), which
// lands straight on it.
//
// Objects are SVG. Confetti, rays and spotlights are plain geometry and are
// CSS. Under prefers-reduced-motion nothing moves and the end states show.
import { _shell, _portrait } from './style.js';
import { _controls, _state } from './reveal.js';
import { SAVE_KINDS } from '../dr/saves.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

// A fixed spread for particles, so every rebuild draws the same burst.
const spread = (n, seed = 7) => {
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return Array.from({ length: n }, () => ({ a: r(), b: r(), c: r(), d: r() }));
};

// ══════════════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════════════
export const SAVE_CSS = `
@property --svx-spin{syntax:'<angle>';inherits:false;initial-value:0deg}
.svx{position:sticky;top:6px;z-index:5;isolation:isolate;overflow:hidden;border-radius:22px;margin:0 0 18px;
  min-height:440px;padding:18px 22px 16px;color:#fff;
  background:radial-gradient(120% 90% at 50% 110%,#2a0d22 0,#12040e 55%,#07020a 100%);
  box-shadow:0 30px 80px -30px rgba(0,0,0,.9),inset 0 0 0 1px rgba(255,255,255,.07)}
.svx-bg,.svx-bg i{position:absolute;inset:0;pointer-events:none}
.svx-bg{z-index:0;transition:filter 1s}
.svx-spot{background:radial-gradient(38% 62% at 50% 46%,rgba(255,236,200,.30),rgba(255,120,190,.08) 55%,transparent 72%);
  transition:opacity .8s ease,transform .8s ease;transform-origin:50% 46%}
.svx-cone{background:conic-gradient(from 180deg at 50% -8%,transparent 160deg,rgba(255,240,220,.14) 172deg,rgba(255,240,220,.22) 180deg,rgba(255,240,220,.14) 188deg,transparent 200deg);
  mix-blend-mode:screen;transition:opacity .8s}
.svx-rays{opacity:0;background:repeating-conic-gradient(from var(--svx-spin) at 50% 50%,rgba(255,214,90,.34) 0 7deg,transparent 7deg 20deg);
  -webkit-mask:radial-gradient(circle at 50% 50%,#000 0,#000 16%,transparent 62%);
  mask:radial-gradient(circle at 50% 50%,#000 0,#000 16%,transparent 62%);transition:opacity .6s}
.svx-flash{opacity:0;background:radial-gradient(circle at 50% 46%,#fff,rgba(255,236,160,.8) 25%,transparent 70%)}
.svx-vig{box-shadow:inset 0 0 120px 40px rgba(0,0,0,.85);opacity:.6;transition:opacity .6s}
.svx-grain{opacity:.06;background-image:repeating-radial-gradient(circle at 17% 32%,#fff 0 1px,transparent 1px 3px);mix-blend-mode:overlay}
.svx > *:not(.svx-bg){position:relative;z-index:1}
.svx-bg{position:absolute!important}
.svx.svx-static{position:relative;top:auto}

.svx-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
.svx-kicker{display:block;font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;color:#ffb3dc}
.svx-title{display:block;font:400 clamp(28px,4.4vw,48px)/1 'Anton','Oswald','Impact',sans-serif;letter-spacing:.01em;text-transform:uppercase;
  background:linear-gradient(180deg,#fff 20%,#ffc7e5 60%,#ff5fae);-webkit-background-clip:text;background-clip:text;color:transparent}
.svx-count{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#d9c1cf;align-self:center;
  padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.06);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1)}
.svx-count b{font:800 20px/1 ui-monospace,'SF Mono',Menlo,monospace;color:#ffd66b;margin-right:6px;display:inline-block}
.svx-count b.svx-tick{animation:svx-tick .5s cubic-bezier(.3,1.6,.5,1)}
@keyframes svx-tick{0%{transform:scale(1.9);color:#fff}100%{transform:scale(1)}}

.svx-center{height:340px;display:grid;place-items:center;perspective:900px}
.svx-center > *{grid-area:1/1}
.svx-caption{min-height:50px;text-align:center;font-size:17px;line-height:1.45;max-width:660px;margin:0 auto;
  color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.8)}
.svx-caption small{display:block;font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;color:#ffb3dc;margin-bottom:3px}

/* the queen, glowing behind whatever she is holding */
.svx-halo{width:170px;height:170px;border-radius:50%;overflow:hidden;opacity:0;transform:translate(-210px,-10px) scale(.9);
  box-shadow:0 0 0 3px rgba(255,255,255,.14),0 0 60px 10px rgba(255,61,154,.35);transition:opacity .6s,transform .8s cubic-bezier(.2,.8,.2,1),filter .8s,box-shadow .6s}
.svx-halo > *,.svx-halo img{width:100%!important;height:100%!important;object-fit:cover;border-radius:50%;margin:0!important}
@media (max-width:640px){.svx-halo{transform:translate(0,-120px) scale(.5)!important}}

/* ── THE BAR ─────────────────────────────────────────────────────────── */
.svx-bar{position:relative;width:250px;height:176px;transform-style:preserve-3d;
  transform:rotateX(14deg) rotateY(-18deg);animation:svx-float 5s ease-in-out infinite;
  filter:drop-shadow(0 26px 30px rgba(0,0,0,.7));transition:opacity .8s}
@keyframes svx-float{50%{transform:rotateX(8deg) rotateY(-8deg) translateY(-10px)}}
.svx-bar > *{position:absolute;inset:0}
.svx-bar svg{width:100%;height:100%;display:block;overflow:visible}
.svx-inner{opacity:0;transition:opacity .35s}
.svx-wrap{transition:transform .95s cubic-bezier(.55,-0.2,.3,1),opacity .6s ease .35s}
.svx-foil{background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.55) 45%,rgba(160,230,255,.35) 50%,rgba(255,170,230,.35) 55%,transparent 70%);
  background-size:260% 100%;mix-blend-mode:screen;border-radius:12px;animation:svx-sheen 3.4s linear infinite;pointer-events:none;transition:opacity .3s}
@keyframes svx-sheen{from{background-position:130% 0}to{background-position:-130% 0}}

.svx[data-phase=hold] .svx-halo,.svx[data-phase=tear] .svx-halo,.svx[data-phase=pull] .svx-halo{opacity:1;transform:translate(-210px,-10px) scale(1)}
.svx[data-phase=hold] .svx-bar{animation:svx-tremble .11s linear infinite}
@keyframes svx-tremble{0%{transform:rotateX(12deg) rotateY(-14deg) translate(0,0)}25%{transform:rotateX(12deg) rotateY(-14deg) translate(-2px,1px) rotateZ(-.8deg)}
  50%{transform:rotateX(12deg) rotateY(-14deg) translate(2px,-1px)}75%{transform:rotateX(12deg) rotateY(-14deg) translate(-1px,-2px) rotateZ(.8deg)}}
.svx[data-phase=hold] .svx-vig{opacity:1;animation:svx-heart 1.05s ease-in-out infinite}
@keyframes svx-heart{0%,100%{box-shadow:inset 0 0 120px 40px rgba(0,0,0,.85)}14%{box-shadow:inset 0 0 170px 80px rgba(70,0,24,.95)}28%{box-shadow:inset 0 0 120px 40px rgba(0,0,0,.85)}42%{box-shadow:inset 0 0 150px 60px rgba(70,0,24,.9)}}
.svx[data-phase=hold] .svx-spot{transform:scale(.78)}

.svx[data-phase=tear] .svx-bar{animation:svx-yank .5s cubic-bezier(.3,1.5,.5,1)}
@keyframes svx-yank{40%{transform:rotateX(4deg) rotateY(0) scale(1.1)}}
.svx[data-phase=tear] .svx-wrap-l,.svx.svx-open .svx-wrap-l{transform:translate3d(-200px,-130px,140px) rotateZ(-48deg) rotateY(70deg);opacity:0}
.svx[data-phase=tear] .svx-wrap-r,.svx.svx-open .svx-wrap-r{transform:translate3d(210px,-100px,160px) rotateZ(52deg) rotateY(-80deg);opacity:0}
.svx[data-phase=tear] .svx-foil,.svx.svx-open .svx-foil{opacity:0}
.svx[data-phase=tear] .svx-flash{background:radial-gradient(circle at 50% 46%,rgba(255,255,255,.5),transparent 45%);animation:svx-flash .5s ease-out}

/* GOLD */
.svx.svx-open[data-result=gold] .svx-inner-gold,.svx.svx-open[data-result=plain] .svx-inner-plain{opacity:1}
.svx[data-phase=gold] .svx-rays{opacity:1;animation:svx-spin 9s linear infinite}
@keyframes svx-spin{to{--svx-spin:360deg}}
.svx[data-phase=gold] .svx-flash{animation:svx-flash 1.2s ease-out}
@keyframes svx-flash{0%{opacity:0}8%{opacity:1}100%{opacity:0}}
.svx[data-phase=gold] .svx-bar{animation:svx-rise 1.2s cubic-bezier(.2,1.4,.4,1) forwards;filter:drop-shadow(0 0 40px rgba(255,200,60,.9))}
@keyframes svx-rise{0%{transform:rotateX(14deg) rotateY(-18deg) scale(1)}60%{transform:rotateX(0) rotateY(0) scale(1.14) translateY(-66px)}100%{transform:rotateX(0) rotateY(0) scale(1) translateY(-58px)}}
.svx[data-phase=gold] .svx-halo{opacity:1;transform:translate(-230px,-20px) scale(1.06);box-shadow:0 0 0 4px #ffd66b,0 0 80px 24px rgba(255,200,60,.65)}
.svx[data-phase=gold] .svx-title{background:linear-gradient(180deg,#fff 10%,#ffe9a3 45%,#e6a91a);-webkit-background-clip:text;background-clip:text}
.svx-confetti,.svx-crumbs,.svx-drops{width:0;height:0;overflow:visible;position:relative}
.svx-confetti i{position:absolute;left:0;top:0;width:var(--w);height:var(--h);border-radius:2px;opacity:0;background:var(--c)}
.svx[data-phase=gold] .svx-confetti i{animation:svx-burst var(--t) cubic-bezier(.1,.7,.3,1) var(--dl) forwards}
@keyframes svx-burst{0%{opacity:1;transform:translate(0,0) rotate(0)}70%{opacity:1}
  100%{opacity:0;transform:translate(var(--x),var(--y)) rotate(var(--r))}}

/* PLAIN */
.svx[data-phase=plain] .svx-bg,.svx[data-phase=bye] .svx-bg,.svx[data-phase=miss] .svx-bg{filter:grayscale(1) brightness(.65)}
.svx[data-phase=plain] .svx-spot,.svx[data-phase=bye] .svx-spot,.svx[data-phase=miss] .svx-spot{transform:scale(.45);opacity:.6}
.svx[data-phase=plain] .svx-cone,.svx[data-phase=bye] .svx-cone{opacity:.25}
.svx[data-phase=plain] .svx-bar{animation:svx-thud .7s cubic-bezier(.5,0,.8,.4) forwards}
@keyframes svx-thud{0%{transform:rotateX(14deg) rotateY(-18deg)}70%{transform:rotateX(55deg) translateY(40px)}85%{transform:rotateX(48deg) translateY(32px)}100%{transform:rotateX(55deg) translateY(40px)}}
.svx[data-phase=plain] .svx-halo,.svx[data-phase=bye] .svx-halo,.svx[data-phase=miss] .svx-halo{opacity:.85;filter:grayscale(1);transform:translate(-210px,-10px) scale(.95)}
.svx-stamp{opacity:0;padding:8px 18px;border:4px solid #ff4d6d;border-radius:8px;color:#ff4d6d;white-space:nowrap;
  font:400 32px/1 'Anton','Impact',sans-serif;letter-spacing:.08em;transform:rotate(-11deg) scale(3);background:rgba(20,0,6,.6)}
.svx[data-phase=plain] .svx-stamp{animation:svx-slam .45s cubic-bezier(.5,0,.3,1.4) .45s forwards}
.svx[data-phase=miss] .svx-stamp{animation:svx-slam .45s cubic-bezier(.5,0,.3,1.4) .5s forwards}
.svx[data-phase=bye] .svx-stamp{opacity:.45;transform:rotate(-11deg) scale(1)}
@keyframes svx-slam{0%{opacity:0;transform:rotate(-11deg) scale(3)}100%{opacity:1;transform:rotate(-11deg) scale(1)}}
.svx-crumbs i{position:absolute;left:var(--x0);top:10px;width:var(--w);height:var(--w);border-radius:40% 55% 45% 60%;background:#6b3a20;opacity:0}
.svx[data-phase=plain] .svx-crumbs i{animation:svx-fall var(--t) cubic-bezier(.4,0,1,1) var(--dl) forwards}
@keyframes svx-fall{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--x),170px) rotate(200deg)}}
.svx[data-phase=bye] .svx-bar{opacity:.3;transform:rotateX(55deg) translateY(40px);animation:none}
.svx[data-phase=bye] .svx-halo{transform:translate(-210px,50px) scale(.75);opacity:0}

/* the golden ticket */
.svx-ticket{opacity:0;width:300px;transform:translateY(60px) rotateX(80deg) scale(.6);transition:opacity .6s .5s,transform .9s cubic-bezier(.2,1.5,.4,1) .5s}
.svx-ticket svg{width:100%;display:block;filter:drop-shadow(0 12px 30px rgba(255,190,40,.6))}
.svx[data-phase=gold] .svx-ticket{opacity:1;transform:translateY(118px) rotateX(0) scale(.92)}

/* the tray of bars still in the room */
.svx-tray{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:6px;min-height:14px}
.svx-tray i{width:22px;height:14px;border-radius:3px;background:linear-gradient(135deg,#ff7cc2,#b8237a);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);transition:all .5s}
.svx-tray i.gone{background:#2a1623;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);transform:scale(.8)}
.svx-tray i.gold{background:linear-gradient(135deg,#fff1a8,#d99a14);box-shadow:0 0 12px rgba(255,200,60,.9)}

/* ── THE TANK ────────────────────────────────────────────────────────── */
.svx-tank{width:min(430px,100%);transition:filter .8s}
.svx-tank svg{width:100%;display:block;overflow:visible}
.svx-water{animation:svx-wave 3.2s ease-in-out infinite}
@keyframes svx-wave{50%{transform:translateX(-24px)}}
.svx-water2{animation:svx-wave 2.4s ease-in-out infinite reverse;opacity:.6}
.svx-caustic{animation:svx-caus 6s linear infinite;opacity:.25}
@keyframes svx-caus{to{transform:translateX(-120px)}}
.svx-judge{transition:transform .55s cubic-bezier(.6,0,.9,.5)}
.svx-arm{transition:transform .45s cubic-bezier(.3,1.6,.5,1);transform-box:fill-box;transform-origin:50% 100%}
.svx-knob{transition:fill .3s}
.svx-lv{transition:opacity .5s}
.svx-lv.gone{opacity:.13}
.svx-xmark{opacity:0;transition:opacity .3s .9s}
.svx-lv.x .svx-xmark{opacity:1}
.svx[data-phase=hold] .svx-lv:not(.gone) .svx-knob{animation:svx-scan 1.6s ease-in-out infinite;animation-delay:calc(var(--i) * .22s)}
@keyframes svx-scan{0%,100%{fill:#7b2ff7}40%{fill:#ffd66b}}
.svx-lv.chosen .svx-knob{fill:#ff294b}
.svx[data-phase=pull] .svx-lv.chosen .svx-arm,.svx[data-phase=hit] .svx-lv.chosen .svx-arm,
.svx[data-phase=miss] .svx-lv.chosen .svx-arm,.svx[data-phase=bye] .svx-lv.chosen .svx-arm{transform:rotate(-42deg)}
.svx[data-phase=pull] .svx-tank{animation:svx-rumble .09s linear infinite}
@keyframes svx-rumble{50%{transform:translate(1px,-1px)}}
.svx[data-phase=pull] .svx-vig{opacity:1;animation:svx-heart .8s ease-in-out infinite}
.svx[data-phase=hit] .svx-judge{transform:translateY(125px)}
.svx[data-phase=hit] .svx-flash{background:radial-gradient(circle at 50% 40%,#e0f7ff,rgba(120,210,255,.7) 25%,transparent 70%);animation:svx-flash 1.1s ease-out .45s}
.svx[data-phase=hit] .svx-surge{animation:svx-surge 1.2s ease-out .45s}
@keyframes svx-surge{30%{transform:translateY(-30px)}}
.svx-drops i{position:absolute;left:0;top:-70px;width:var(--w);height:calc(var(--w) * 1.35);border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
  background:radial-gradient(circle at 35% 30%,#fff,#7dd3fc 60%,#0284c7);opacity:0}
.svx[data-phase=hit] .svx-drops i{animation:svx-burst var(--t) cubic-bezier(.1,.7,.3,1) calc(var(--dl) + .5s) forwards}
.svx[data-phase=hit] .svx-halo{opacity:1;box-shadow:0 0 0 4px #7dd3fc,0 0 80px 24px rgba(56,189,248,.6)}
.svx-splash{opacity:0;font:400 72px/1 'Anton','Impact',sans-serif;letter-spacing:.04em;color:#e0f7ff;
  text-shadow:0 0 30px #38bdf8,0 6px 0 #0369a1;transform:scale(.3) rotate(-6deg)}
.svx[data-phase=hit] .svx-splash{animation:svx-pop .7s cubic-bezier(.3,1.7,.5,1) .6s forwards}
@keyframes svx-pop{to{opacity:1;transform:translateY(-80px) scale(1) rotate(-6deg)}}
.svx[data-kind=tank] .svx-halo{width:130px;height:130px;transform:translate(-250px,-40px) scale(.9)}
.svx[data-kind=tank][data-phase=hold] .svx-halo,.svx[data-kind=tank][data-phase=pull] .svx-halo,
.svx[data-kind=tank][data-phase=hit] .svx-halo,.svx[data-kind=tank][data-phase=miss] .svx-halo{transform:translate(-250px,-40px)}
.svx[data-kind=tank][data-phase=bye] .svx-halo{transform:translate(-250px,10px) scale(.7);opacity:0}
.svx[data-phase=miss] .svx-tank,.svx[data-phase=bye] .svx-tank{filter:grayscale(.8) brightness(.8)}
.svx[data-phase=drained] .svx-waterg{transform:translateY(150px);transition:transform 2.6s cubic-bezier(.5,0,.5,1)}

/* ── THE HOLDER ──────────────────────────────────────────────────────── */
.svx-trio{display:flex;gap:clamp(12px,4vw,50px);align-items:flex-end;justify-content:center;width:100%;align-self:end;padding-bottom:6px}
.svx-pod{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;
  transition:transform .7s cubic-bezier(.2,1.4,.4,1),filter .6s,opacity .6s}
.svx-face{width:112px;height:112px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px rgba(255,255,255,.15),0 20px 40px -10px #000;transition:box-shadow .6s}
.svx-face > *,.svx-face img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.svx-pod b{font-size:13px;letter-spacing:.12em;text-transform:uppercase}
.svx-beam{position:absolute;bottom:22px;left:50%;width:180px;height:330px;transform:translateX(-50%);
  background:linear-gradient(0deg,rgba(255,230,200,.22),transparent 90%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);
  opacity:.4;transition:opacity .6s,background .6s;z-index:-1}
.svx-plinth{width:130px;height:16px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.22),transparent)}
.svx[data-phase=deciding] .svx-beam{animation:svx-sweep 1.2s ease-in-out infinite;animation-delay:calc(var(--i) * .4s)}
@keyframes svx-sweep{0%,100%{opacity:.08}30%{opacity:1;background:linear-gradient(0deg,rgba(255,240,200,.5),transparent 90%)}}
.svx[data-phase=deciding] .svx-pod{animation:svx-breathe 1.2s ease-in-out infinite;animation-delay:calc(var(--i) * .4s)}
@keyframes svx-breathe{30%{transform:translateY(-6px)}}
.svx.svx-chosen .svx-pod.kept{transform:translateY(-34px) scale(1.14)}
.svx.svx-chosen .svx-pod.kept .svx-face{box-shadow:0 0 0 4px #ffed00,0 0 70px 18px rgba(255,220,60,.6)}
.svx.svx-chosen .svx-pod.kept .svx-beam{opacity:1;background:linear-gradient(0deg,rgba(255,230,90,.6),transparent 90%)}
.svx.svx-chosen .svx-pod:not(.kept){filter:saturate(.6);transform:scale(.94)}
.svx.svx-chosen .svx-pod:not(.kept) .svx-beam{opacity:.8;background:linear-gradient(0deg,rgba(255,41,75,.5),transparent 90%)}
.svx[data-phase=saved] .svx-rays{opacity:.55;animation:svx-spin 12s linear infinite}
.svx[data-phase=saved] .svx-flash{animation:svx-flash 1s ease-out}
.svx-tag{opacity:0;font-size:10px;letter-spacing:.24em;text-transform:uppercase;padding:3px 10px;border-radius:99px;transition:opacity .4s .4s;min-height:18px}
.svx-tag span{display:none}
.svx.svx-chosen .svx-pod.kept .svx-tag{opacity:1;background:#ffed00;color:#1a1400}
.svx.svx-chosen .svx-pod.kept .svx-tag .k{display:inline}
.svx[data-phase=left] .svx-pod:not(.kept) .svx-tag{opacity:1;background:#ff294b;color:#fff}
.svx[data-phase=left] .svx-pod:not(.kept) .svx-tag .l{display:inline}
.svx[data-phase=left] .svx-pod.kept{opacity:.35;transform:translateY(-10px) scale(.85)}
.svx[data-phase=left] .svx-pod:not(.kept){filter:none;transform:scale(1.04)}
.svx-token{align-self:start;width:96px;margin-top:-6px;filter:drop-shadow(0 0 22px rgba(255,200,60,.7));animation:svx-bob 3s ease-in-out infinite}
@keyframes svx-bob{50%{transform:translateY(-8px) rotate(-4deg)}}
.svx-token svg{width:100%;display:block}
.svx[data-phase=handoff] .svx-token{animation:svx-toss 1.1s cubic-bezier(.3,1.3,.4,1)}
@keyframes svx-toss{0%{transform:translateX(-160px) rotate(-30deg)}60%{transform:translateX(20px) translateY(-30px) rotate(20deg)}100%{transform:none}}
.svx-holder{display:flex;align-items:center;gap:8px;padding:5px 14px 5px 5px;align-self:center;
  border-radius:99px;background:rgba(255,255,255,.07);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);font-size:12px}
.svx-mini{width:34px;height:34px;border-radius:50%;overflow:hidden;flex:0 0 34px}
.svx-mini > *,.svx-mini img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.svx-holder em{font-style:normal;color:#ffd66b;font-weight:700}
.svx[data-phase=handoff] .svx-holder{animation:svx-glow 1.2s ease}
@keyframes svx-glow{30%{box-shadow:0 0 0 3px #ffd66b,0 0 40px rgba(255,200,60,.6)}}

/* ── THE CAMPAIGN (Untucked) ─────────────────────────────────────────── */
.svx.svx-camp{background:radial-gradient(120% 90% at 50% 110%,#2b0f3f 0,#140623 55%,#08030f 100%)}
.svx-lounge{align-self:end;width:min(640px,100%);opacity:.3;margin-bottom:-6px}
.svx-lounge svg{width:100%;display:block}
.svx-lounge-neon{filter:drop-shadow(0 0 8px #b07aff)}
.svx.svx-camp .svx-spot{background:radial-gradient(40% 60% at 50% 40%,rgba(176,122,255,.24),transparent 70%)}
.svx-row{display:flex;gap:clamp(10px,3vw,34px);justify-content:center;align-items:flex-end;width:100%;align-self:center;padding-bottom:30px}
.svx-row .svx-pod{background:rgba(12,4,20,.55);border-radius:16px;padding:10px 10px 8px;backdrop-filter:blur(4px)}
.svx-row .svx-pod{transition:transform .5s cubic-bezier(.2,1.4,.4,1),filter .5s,opacity .5s}
.svx-row.svx-anytalk .svx-pod:not(.talk):not(.about):not(.power){filter:brightness(.55) saturate(.6)}
.svx-row .svx-pod.talk{transform:translateY(-16px) scale(1.08)}
.svx-row .svx-pod.talk .svx-face{box-shadow:0 0 0 4px #b07aff,0 0 50px 12px rgba(176,122,255,.55)}
.svx-row .svx-pod.about .svx-face{box-shadow:0 0 0 4px #ff294b,0 0 40px 8px rgba(255,41,75,.45)}
.svx-row .svx-face{width:96px;height:96px}
.svx-meter{display:block;width:100px;height:8px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;position:relative}
.svx-meter i{position:absolute;top:0;bottom:0;left:50%;width:0;background:linear-gradient(90deg,#b07aff,#ffd66b);
  transition:width .7s cubic-bezier(.2,1.2,.4,1),left .7s cubic-bezier(.2,1.2,.4,1)}
.svx-meter i.neg{background:linear-gradient(90deg,#ff294b,#b0204a)}
.svx-meter::after{content:'';position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.4)}
.svx-role{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:#ffd66b}
.svx-row .svx-pod.power .svx-face{box-shadow:0 0 0 4px #ffd66b,0 0 40px 10px rgba(255,214,107,.45)}
.svx-bubble{position:absolute;top:-30px;left:50%;transform:translate(-50%,6px) scale(.8);opacity:0;white-space:nowrap;
  font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:4px 10px;border-radius:99px;background:#b07aff;color:#12051f;
  transition:opacity .3s,transform .4s cubic-bezier(.3,1.6,.5,1)}
.svx-row .svx-pod.talk .svx-bubble{opacity:1;transform:translate(-50%,0) scale(1)}
.svx-row .svx-pod.talk.x-throw .svx-bubble,.svx-row .svx-pod.talk.x-cold .svx-bubble{background:#ff294b;color:#fff}
.svx[data-phase=campaign-open] .svx-row .svx-pod.power{animation:svx-bob 1.4s ease-in-out infinite}

/* ── THE CEREMONY ────────────────────────────────────────────────────── */
.svx-trio.svx-anytalk .svx-pod:not(.talk){filter:brightness(.55) saturate(.6)}
.svx-trio .svx-pod.talk{transform:translateY(-12px) scale(1.06)}
.svx-trio .svx-pod.talk .svx-face{box-shadow:0 0 0 4px #fff,0 0 50px 12px rgba(255,255,255,.35)}
.svx-trio .svx-pod.talk.x-hurt .svx-face,.svx-trio .svx-pod.talk.x-bitter .svx-face,
.svx-trio .svx-pod.talk.x-hopeBroken .svx-face{box-shadow:0 0 0 4px #ff294b,0 0 50px 12px rgba(255,41,75,.45)}
.svx-trio .svx-pod.talk.x-saved .svx-face{box-shadow:0 0 0 4px #ffed00,0 0 60px 16px rgba(255,220,60,.6)}
.svx-trio .svx-pod .svx-bubble{top:-4px}
.svx-trio .svx-pod.talk .svx-bubble{opacity:1;transform:translate(-50%,0) scale(1)}
.svx-trio .svx-pod.talk.x-saved .svx-bubble{background:#ffed00;color:#1a1400}
.svx-trio .svx-pod.talk.x-hurt .svx-bubble,.svx-trio .svx-pod.talk.x-bitter .svx-bubble,
.svx-trio .svx-pod.talk.x-hopeBroken .svx-bubble{background:#ff294b;color:#fff}
.svx[data-phase=invoke] .svx-token{animation:svx-invoke 1.2s ease-in-out infinite}
@keyframes svx-invoke{50%{transform:scale(1.18);filter:drop-shadow(0 0 40px rgba(255,220,60,1))}}
.svx[data-phase=invoke] .svx-rays{opacity:.5;animation:svx-spin 10s linear infinite}
.svx[data-phase=deciding] .svx-vig{opacity:1;animation:svx-heart 1s ease-in-out infinite}
.svx-reveal{align-self:start;justify-self:center;z-index:4;margin-top:4px;padding:10px 26px 12px;border-radius:14px;text-align:center;
  background:linear-gradient(135deg,#fff6c8,#ffd24d 45%,#d99a14);color:#2a1a00;box-shadow:0 18px 50px -10px rgba(255,190,40,.8);
  opacity:0;transform:perspective(600px) rotateX(90deg) scale(.7);transition:opacity .3s,transform .3s}
.svx-reveal small{display:block;font-size:10px;letter-spacing:.3em;text-transform:uppercase;opacity:.75}
.svx-reveal b{display:block;font:400 clamp(28px,4vw,44px)/1.05 'Anton','Impact',sans-serif;letter-spacing:.03em;text-transform:uppercase}
.svx[data-phase=saved] .svx-reveal{animation:svx-flipin .9s cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes svx-flipin{0%{opacity:0;transform:perspective(600px) rotateX(90deg) scale(.7)}
  60%{opacity:1;transform:perspective(600px) rotateX(-12deg) scale(1.12)}100%{opacity:1;transform:perspective(600px) rotateX(0) scale(1)}}
.svx[data-phase=saved] .svx-flash{animation:svx-flash 1s ease-out}
.svx > .svx-confess{position:absolute!important}
.svx-confess{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;gap:18px;padding:30px;
  background:radial-gradient(80% 80% at 50% 50%,rgba(10,4,16,.92),rgba(10,4,16,.98));opacity:0;pointer-events:none;transition:opacity .45s}
.svx[data-phase=confess] .svx-confess{opacity:1}
.svx[data-phase=confess] .svx-caption{opacity:0}
.svx-confess .svx-cface{flex:0 0 120px;width:120px;height:120px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px #b07aff,0 0 50px rgba(176,122,255,.5)}
.svx-confess .svx-cface > *,.svx-confess .svx-cface img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.svx-confess q{display:block;max-width:440px;font-size:19px;line-height:1.45;font-style:italic;quotes:none}
.svx-confess small{display:block;margin-top:8px;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#cbb3ff}
.svx-cards .svx-card.svx-card-reveal{border-color:#ffed00;background:linear-gradient(135deg,rgba(255,237,0,.18),rgba(255,255,255,.03))}
.dr-step.dr-vis .svx-card.svx-card-reveal{animation:svx-cardpop .8s cubic-bezier(.2,1.5,.4,1)}
@keyframes svx-cardpop{0%{transform:scale(.9)}60%{transform:scale(1.04)}100%{transform:none}}
.svx-cards .svx-card.svx-card-confess{border-color:rgba(176,122,255,.5);font-style:italic}

/* ── INTRO ───────────────────────────────────────────────────────────── */
.svx-hero{width:240px;animation:svx-bob 4s ease-in-out infinite;filter:drop-shadow(0 20px 40px rgba(0,0,0,.7)) drop-shadow(0 0 30px rgba(255,200,60,.35))}
.svx-hero svg{width:100%;display:block;overflow:visible}
.svx-rules{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:4px 0 6px}
.svx-rules span{font-size:12.5px;line-height:1.4;max-width:230px;padding:10px 12px;border-radius:14px;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(8px);
  opacity:.2;transform:translateY(10px);transition:opacity .6s,transform .6s}
.svx[data-phase=rules] .svx-rules span{opacity:1;transform:none}
.svx[data-phase=rules] .svx-rules span:nth-child(2){transition-delay:.15s}
.svx[data-phase=rules] .svx-rules span:nth-child(3){transition-delay:.3s}
.svx[data-phase=rules] .svx-rules span:nth-child(4){transition-delay:.45s}
.svx[data-phase=rules] .svx-rays{opacity:.35;animation:svx-spin 14s linear infinite}

/* the word cards under the stage */
.svx-cards{display:grid;gap:10px}
/* The stage is sticky: a revealed card is scrolled to sit BELOW it, not behind it. */
.svx-cards .dr-step{scroll-margin-top:560px}
.svx-card{display:flex;gap:14px;align-items:flex-start;padding:12px 16px;border-radius:14px;
  background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.09)}
.svx-cp{flex:0 0 44px;width:44px;height:44px;border-radius:50%;overflow:hidden}
.svx-cp > *,.svx-cp img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.svx-card small{display:block;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--svc,#ffb3dc);margin-bottom:2px}
.svx-card p{margin:0;font-size:15px;line-height:1.5}
.sv-rail-row{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px}
.sv-rail-row b{color:var(--dr-gold,#FFC83D)}
.sv-levers{display:flex;gap:6px;margin:6px 0}
.sv-levers i{width:14px;height:26px;border-radius:4px;background:var(--dr-cyan,#00E5FF)}
.sv-levers i.sv-gone{background:#3a2233;opacity:.5}

@media (prefers-reduced-motion: reduce){
  .svx,.svx *{animation:none!important;transition:none!important}
  .svx[data-phase=gold] .svx-ticket{opacity:1;transform:translateY(118px) scale(.92)}
  .svx[data-phase=plain] .svx-stamp,.svx[data-phase=miss] .svx-stamp{opacity:1;transform:rotate(-11deg)}
  .svx[data-phase=hit] .svx-splash{opacity:1;transform:translateY(-80px) rotate(-6deg)}
}
`;

// ══════════════════════════════════════════════════════════════════════
// THE OBJECTS
// ══════════════════════════════════════════════════════════════════════

const GOLD = id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fff6c8"/><stop offset=".35" stop-color="#ffd24d"/>
  <stop offset=".65" stop-color="#d99a14"/><stop offset="1" stop-color="#8a5a06"/></linearGradient>`;

function barInner(gold) {
  const sq = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      sq.push(`<rect x="${14 + c * 57}" y="${16 + r * 50}" width="51" height="44" rx="6"
        fill="${gold ? 'url(#svx-g-bar)' : '#5b2e18'}" stroke="${gold ? '#fff3b0' : '#2f160a'}" stroke-width="2"/>
        <path d="M${20 + c * 57} ${21 + r * 50}h39" stroke="${gold ? '#fffbe0' : '#7a4428'}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`);
    }
  }
  return `<svg viewBox="0 0 250 176" aria-hidden="true"><defs>${gold ? GOLD('svx-g-bar') : ''}</defs>
    <rect x="4" y="6" width="242" height="166" rx="12" fill="${gold ? '#9a6a0e' : '#2a130b'}"/>${sq.join('')}</svg>`;
}

// The wrapper is two halves so it can tear down the middle.
function wrapHalf(side, uid) {
  const clip = side === 'l' ? 'M0 0H128L118 30L132 60L116 92L130 124L120 152L128 176H0Z'
    : 'M128 0H250V176H128L120 152L130 124L116 92L132 60L118 30Z';
  const id = `svx-${uid}-${side}`;
  return `<svg viewBox="0 0 250 176" aria-hidden="true"><defs>
      <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff8cc9"/><stop offset=".5" stop-color="#ff2f8e"/><stop offset="1" stop-color="#9a0f56"/></linearGradient>
      <clipPath id="${id}-c"><path d="${clip}"/></clipPath></defs>
    <g clip-path="url(#${id}-c)">
      <rect x="0" y="0" width="250" height="176" rx="14" fill="url(#${id}-g)"/>
      <path d="M0 0h250v26H0zM0 150h250v26H0z" fill="#f1dcff" opacity=".6"/>
      <path d="M0 26h250M0 150h250" stroke="#fff" stroke-width="1.5" opacity=".5"/>
      <circle cx="125" cy="86" r="38" fill="#fff0f7"/>
      <path d="M106 94c8 16 30 16 38 0M112 80a4 4 0 108 0M130 80a4 4 0 108 0M114 62l11-14 11 14" stroke="#ff2f8e" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="125" y="143" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="15" fill="#fff" letter-spacing="4">CHOCOLATE</text>
      <text x="125" y="18" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="10" fill="#7a1048" letter-spacing="3">ONE OF THEM IS GOLDEN</text>
    </g></svg>`;
}

function ticketSvg() {
  return `<svg viewBox="0 0 300 120" aria-hidden="true"><defs>${GOLD('svx-g-tk')}</defs>
    <path d="M10 10h280v34a16 16 0 000 32v34H10V76a16 16 0 000-32z" fill="url(#svx-g-tk)" stroke="#fff3b0" stroke-width="2"/>
    <path d="M24 22h252v76H24z" fill="none" stroke="#8a5a06" stroke-width="1.5" stroke-dasharray="4 4"/>
    <text x="150" y="60" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="32" fill="#4a2e00" letter-spacing="3">GOLDEN TICKET</text>
    <text x="150" y="88" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="14" fill="#6b4500" letter-spacing="5">SHANTAY, YOU STAY</text>
  </svg>`;
}

function beaverSvg(uid) {
  const g = `svx-g-bv-${uid}`;
  return `<svg viewBox="0 0 200 160" aria-hidden="true"><defs>${GOLD(g)}</defs>
    <ellipse cx="150" cy="118" rx="40" ry="16" transform="rotate(-18 150 118)" fill="#b07d12"/>
    <path d="M122 110l52-16M126 120l52-16M132 102l18 28M150 96l18 28" stroke="#6b4a0e" stroke-width="2"/>
    <ellipse cx="96" cy="100" rx="50" ry="40" fill="url(#${g})"/>
    <circle cx="64" cy="64" r="30" fill="url(#${g})"/>
    <circle cx="46" cy="40" r="8" fill="#d9a441"/><circle cx="80" cy="38" r="8" fill="#d9a441"/>
    <circle cx="54" cy="60" r="4" fill="#241a00"/><circle cx="74" cy="60" r="4" fill="#241a00"/>
    <ellipse cx="64" cy="72" rx="7" ry="5" fill="#5a3b08"/>
    <rect x="58" y="78" width="12" height="11" rx="2" fill="#fff8dc" stroke="#8f6212"/><path d="M64 78v11" stroke="#8f6212"/>
    <path d="M70 130q-8 12 4 12M110 134q-4 10 8 10" stroke="#8f6212" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M110 76q24 4 34 22" stroke="#fffbe0" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>
  </svg>`;
}

function baguetteSvg(uid) {
  const g = `svx-g-bg-${uid}`;
  return `<svg viewBox="0 0 200 160" aria-hidden="true"><defs>${GOLD(g)}</defs>
    <path d="M20 120C40 70 150 20 184 34c12 6 4 24-10 34C130 100 50 150 26 140c-8-4-9-12-6-20z" fill="url(#${g})" stroke="#8a5a12" stroke-width="2"/>
    <path d="M52 112l22-26M82 96l22-28M112 78l22-28M142 60l18-22" stroke="#fff3c4" stroke-width="6" stroke-linecap="round"/>
    <path d="M30 128c30-6 90-50 140-86" stroke="#fff8dc" stroke-width="2" opacity=".5" fill="none"/>
    <path d="M160 14l6 12M180 12l-3 13M192 26l-12 6" stroke="#ffe066" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

function tankSvg({ total = 4, uid = 't' } = {}) {
  const gap = Math.min(64, 360 / Math.max(1, total));
  const x0 = 280 - ((total - 1) * gap) / 2;
  const levers = Array.from({ length: total }, (_, i) => {
    const x = x0 + i * gap;
    return `<g class="svx-lv" data-lever="${i + 1}" style="--i:${i}">
      <g class="svx-arm"><rect x="${x - 4}" y="300" width="8" height="46" rx="3" fill="#e2d4ea"/>
        <circle class="svx-knob" cx="${x}" cy="298" r="13" fill="#7b2ff7" stroke="#fff" stroke-width="2"/></g>
      <rect x="${x - 18}" y="344" width="36" height="12" rx="4" fill="#3a2233"/>
      <text x="${x}" y="380" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="16" fill="#fff">${i + 1}</text>
      <path class="svx-xmark" d="M${x - 14} 284l28 28M${x + 14} 284l-28 28" stroke="#ff294b" stroke-width="5" stroke-linecap="round"/>
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 560 392" aria-hidden="true">
    <defs><linearGradient id="svx-w-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7dd3fc" stop-opacity=".85"/><stop offset="1" stop-color="#0c4a6e" stop-opacity=".95"/></linearGradient>
      <clipPath id="svx-c-${uid}"><path d="M130 30H430V246a14 14 0 01-14 14H144a14 14 0 01-14-14Z"/></clipPath></defs>
    <path d="M150 70V24h260v46" stroke="#c9a6bc" stroke-width="5" fill="none"/>
    <path d="M150 24h260" stroke="#ff3d9a" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
    <g clip-path="url(#svx-c-${uid})">
      <rect x="130" y="70" width="300" height="190" fill="rgba(56,189,248,.08)"/>
      <g class="svx-waterg"><g class="svx-surge">
        <path class="svx-water" d="M100 132q25-14 50 0t50 0t50 0t50 0t50 0t50 0t50 0V270H100z" fill="url(#svx-w-${uid})"/>
        <path class="svx-water2" d="M100 142q25-10 50 0t50 0t50 0t50 0t50 0t50 0t50 0V270H100z" fill="#38bdf8"/>
        <g class="svx-caustic" stroke="#e0f7ff" stroke-width="2" fill="none">
          <path d="M140 190q20-10 40 0t40 0M260 220q20-10 40 0t40 0M380 180q20-10 40 0t40 0M200 240q20-10 40 0M500 200q20-10 40 0"/></g>
      </g></g>
      <g class="svx-judge">
        <rect x="236" y="104" width="88" height="10" rx="4" fill="#ffd66b"/>
        <circle cx="280" cy="62" r="16" fill="#ffe4f1"/>
        <path d="M262 104c0-22 8-30 18-30s18 8 18 30z" fill="#ff7bc8"/>
        <path d="M264 58q16-24 32 0" stroke="#fff" stroke-width="5" fill="none"/>
      </g>
    </g>
    <rect x="130" y="70" width="300" height="190" rx="14" fill="none" stroke="#7dd3fc" stroke-width="5"/>
    <path d="M146 84v160" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>
    <text x="280" y="16" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="14" fill="#ffb3dc" letter-spacing="5">BADONKA DUNK TANK</text>
    <rect x="${x0 - 36}" y="352" width="${(total - 1) * gap + 72}" height="8" rx="4" fill="#2a1623"/>
    ${levers}
  </svg>`;
}

function confetti(n = 48) {
  const cols = ['#ffd24d', '#fff1a8', '#ff5fae', '#ffffff', '#e6a91a', '#ffb3dc'];
  return spread(n, 11).map((p, i) => {
    const ang = p.a * Math.PI * 2;
    const dist = 150 + p.b * 260;
    return `<i style="--x:${Math.round(Math.cos(ang) * dist)}px;--y:${Math.round(Math.sin(ang) * dist * 0.75 + 60)}px;`
      + `--r:${Math.round(p.c * 900 - 450)}deg;--t:${(1.3 + p.d * 1.1).toFixed(2)}s;--dl:${(0.05 + p.c * 0.25).toFixed(2)}s;`
      + `--w:${6 + Math.round(p.d * 8)}px;--h:${4 + Math.round(p.a * 10)}px;--c:${cols[i % cols.length]}"></i>`;
  }).join('');
}
function crumbs(n = 16) {
  return spread(n, 23).map(p => `<i style="--x0:${Math.round(p.a * 200 - 100)}px;--x:${Math.round(p.b * 60 - 30)}px;`
    + `--t:${(0.8 + p.c * 0.7).toFixed(2)}s;--dl:${(0.3 + p.d * 0.4).toFixed(2)}s;--w:${4 + Math.round(p.c * 6)}px"></i>`).join('');
}
function drops(n = 36) {
  return spread(n, 5).map(p => {
    const ang = -Math.PI * (0.08 + p.a * 0.84);
    const dist = 120 + p.b * 240;
    return `<i style="--x:${Math.round(Math.cos(ang) * dist)}px;--y:${Math.round(Math.sin(ang) * dist + 60)}px;--r:0deg;`
      + `--t:${(0.9 + p.c * 0.8).toFixed(2)}s;--dl:${(p.d * 0.2).toFixed(2)}s;--w:${6 + Math.round(p.c * 9)}px"></i>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════════════
// THE STAGE ENGINE
// ══════════════════════════════════════════════════════════════════════

/**
 * Apply step `idx`'s state to a stage. The NEXT step plays its suspense
 * phase first; a jump (or a repaint) lands on the answer.
 */
export function applyStage(suffix, idx) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(`svx-${suffix}`);
  const states = (window._svx || {})[suffix];
  if (!el || !states) return;
  const T = (window._svxT ||= {});
  const P = (window._svxP ||= {});
  clearTimeout(T[suffix]);
  const prev = P[suffix] ?? -1;
  P[suffix] = idx;
  const st = idx < 0 ? states.idle : states.steps[Math.min(idx, states.steps.length - 1)];
  if (!st) return;

  const set = (k, v) => {
    const f = el.querySelector(`[data-f="${k}"]`);
    if (f && v != null && f.innerHTML !== v) f.innerHTML = v;
  };
  const content = c => {
    set('halo', c.portrait);
    set('caption', c.caption);
    set('tray', c.tray);
    set('holder', c.holder);
    set('reveal', c.reveal);
    set('confess', c.confess);
    if (c.count != null) {
      const n = el.querySelector('[data-f="count"]');
      if (n && n.textContent !== String(c.count)) {
        n.textContent = String(c.count);
        n.classList.remove('svx-tick'); void n.offsetWidth; n.classList.add('svx-tick');
      }
    }
    if (c.levers) {
      for (const lv of el.querySelectorAll('.svx-lv')) {
        const k = Number(lv.dataset.lever);
        lv.classList.toggle('gone', !c.levers.live.includes(k));
        lv.classList.toggle('chosen', k === c.levers.chosen);
        lv.classList.toggle('x', k === c.levers.chosen && !!c.levers.missed);
      }
    }
    if (c.talk !== undefined) {
      for (const box of el.querySelectorAll('.svx-row, .svx-trio')) box.classList.toggle('svx-anytalk', !!c.talk);
      for (const pod of el.querySelectorAll('.svx-row .svx-pod, .svx-trio .svx-pod')) {
        const me = pod.dataset.q === c.talk;
        pod.classList.toggle('talk', me);
        pod.classList.toggle('about', !!c.about && pod.dataset.q === c.about);
        pod.classList.remove('x-throw', 'x-cold', 'x-saved', 'x-hurt', 'x-bitter', 'x-hopeBroken', 'x-stoic');
        if (me && c.tone) pod.classList.add(`x-${c.tone}`);
        const bub = pod.querySelector('.svx-bubble');
        if (bub && me) bub.textContent = c.bubble || '';
      }
    }
    if (c.meters) {
      for (const m of el.querySelectorAll('.svx-meter[data-q] i')) {
        const v = Math.max(-2, Math.min(3, c.meters[m.parentNode.dataset.q] || 0));
        const pct = (Math.abs(v) / 3) * 50;
        m.classList.toggle('neg', v < 0);
        m.style.width = `${pct}%`;
        m.style.left = v < 0 ? `${50 - pct}%` : '50%';
      }
    }
    if (c.kept !== undefined) {
      const keep = [].concat(c.kept || []);
      for (const pod of el.querySelectorAll('.svx-pod')) pod.classList.toggle('kept', keep.includes(pod.dataset.q));
    }
  };
  const finish = () => {
    content(st);
    el.dataset.result = st.result || '';
    el.classList.toggle('svx-open', !!st.open);
    el.classList.toggle('svx-chosen', !!st.chosen);
    el.dataset.phase = st.phase;
  };

  if (st.lead && idx === prev + 1) {
    /* THE SUSPENSE SECOND. Nothing that knows the answer is on the page yet:
       the caption is the step's label, the lever carries no cross, nobody is
       kept, and the counter and tray still show the room as it was. The
       rail is held back by the step table itself (see the builders). */
    content({
      portrait: st.portrait, caption: st.leadCaption, holder: st.holder, talk: st.talk !== undefined ? null : undefined,
      levers: st.levers ? { ...st.levers, missed: false } : null,
      kept: st.kept !== undefined ? (st.leadKept || null) : undefined,
    });
    el.dataset.result = st.result || '';
    el.classList.toggle('svx-open', false);
    el.classList.toggle('svx-chosen', false);
    el.dataset.phase = 'idle';
    void el.offsetWidth;   // restart the lead phase even if it is showing
    el.dataset.phase = st.lead;
    T[suffix] = setTimeout(finish, st.leadMs || 1000);
  } else {
    finish();
  }
}

function register(suffix, states) {
  if (typeof window === 'undefined') return;
  window._svx = window._svx || {};
  window._svx[suffix] = states;
  window._drRevealExtra = window._drRevealExtra || {};
  window._drRevealExtra[suffix] = idx => applyStage(suffix, idx);
  // A rebuilt screen shows where the viewer left it, with no replay.
  window._svxP = window._svxP || {};
  window._svxP[suffix] = -99;
}

function stageShell(suffix, kind, {
  title, count = '', countLabel = '', center, caption = '', tray = '', extra = '', below = '', cls = '',
}) {
  return `<!--dr-chrome--><div class="svx${suffix === 'saveintro' ? ' svx-static' : ''}${cls ? ` ${cls}` : ''}" id="svx-${suffix}" data-kind="${kind}" data-phase="idle">
    <div class="svx-bg"><i class="svx-cone"></i><i class="svx-spot"></i><i class="svx-rays"></i><i class="svx-flash"></i><i class="svx-vig"></i></div>
    <div class="svx-head"><div><span class="svx-kicker">${esc(SAVE_KINDS[kind]?.name || 'The save')}</span>
      <b class="svx-title">${esc(title)}</b></div>
      ${extra}${countLabel ? `<span class="svx-count"><b data-f="count">${esc(count)}</b>${esc(countLabel)}</span>` : ''}</div>
    <div class="svx-center">${center}</div>
    <div class="svx-caption" data-f="caption">${caption}</div>
    ${below}
    <div class="svx-tray" data-f="tray">${tray}</div>
  </div><!--/dr-chrome-->`;
}

function card(suffix, i, sc, ep, tag, color) {
  const who = (sc.data?.players || [])[0];
  return `<div class="dr-step" id="dr-step-${suffix}-${i}">
    <div class="svx-card" style="--svc:${color}">
      ${who ? `<!--dr-chrome--><span class="svx-cp">${_portrait(who, ep, { size: 44 })}</span><!--/dr-chrome-->` : ''}
      <div><small>${esc(tag)}</small><p>${esc(sc.text)}</p></div>
    </div></div>`;
}

function page(row, suffix, { phase, title, subtitle, stage, cards, rail, count }) {
  const ep = epOf(row);
  const html = `<style>${SAVE_CSS}</style>${_shell(`${stage}<div class="svx-cards">${cards.join('')}</div>`, ep, {
    phase, title, subtitle, sidebar: rail,
  })}${_controls(suffix, count, ep.num)}`;
  // Once the DOM exists, put the stage where the viewer left it.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    setTimeout(() => {
      try {
        const { idx } = _state(ep, suffix);
        if (idx >= 0) applyStage(suffix, idx);
      } catch { /* a decoration, not the reveal */ }
    }, 0);
  }
  return html;
}

function publishRail(suffix, perStep) {
  if (typeof window === 'undefined') return;
  window._drSidebar = window._drSidebar || {};
  window._drSidebar[suffix] = perStep;
}

const face = (n, ep, size = 170) => (n ? _portrait(n, ep, { size }) : '');
const cap = (label, text) => `<small>${esc(label)}</small>${esc(text)}`;

/** What the save looked like BEFORE tonight, from the snapshot after it. */
function savesBefore(row) {
  const after = row?.dr?.savesState;
  if (!after) return null;
  const s = JSON.parse(JSON.stringify(after));
  for (const t of row?.dr?.save?.tries || []) {
    if (t.kind === 'chocolate') {
      s.opened = (s.opened || []).filter(n => n !== t.queen);
      if (t.saved) s.found = false;
    }
  }
  return s;
}

// ══════════════════════════════════════════════════════════════════════
// SAVE-INTRO
// ══════════════════════════════════════════════════════════════════════

export function rpBuildSaveIntro(row, scenes = []) {
  const ep = epOf(row);
  const list = scenes.filter(sc => /^save:/.test(sc.kind) && sc.text);
  if (!list.length) return '';
  const kind = row?.dr?.save?.kind || list[0].data?.save;
  const meta = SAVE_KINDS[kind] || {};
  const retire = list.some(sc => sc.kind === 'save:retire');
  const total = row?.dr?.save?.levers?.total || list[0].data?.levers || 4;
  const uid = `i${ep.num}`;
  const hero = kind === 'tank'
    ? `<div class="svx-tank">${tankSvg({ total, uid })}</div>`
    : kind === 'chocolate'
      ? `<div class="svx-bar"><div class="svx-wrap">${wrapHalf('l', uid)}</div><div class="svx-wrap">${wrapHalf('r', uid)}</div><div class="svx-foil"></div></div>`
      : `<div class="svx-hero">${kind === 'beaver' ? beaverSvg(uid) : baguetteSvg(uid)}</div>`;
  const rules = retire ? '' : String(meta.desc || '').split(/(?<=\.)\s+/).filter(Boolean).slice(0, 4)
    .map(t => `<span>${esc(t)}</span>`).join('');
  const handed = list.find(sc => sc.data?.handedTo)?.data?.handedTo || [];
  const tray = kind === 'chocolate' ? handed.map(() => '<i></i>').join('') : '';
  const allLevers = Array.from({ length: total }, (_, k) => k + 1);
  const idle = { phase: 'idle', caption: '', tray, levers: kind === 'tank' ? { live: allLevers } : null };
  const steps = list.map(sc => ({
    phase: sc.kind === 'save:retire' ? 'drained' : 'rules',
    caption: cap(sc.kind === 'save:retire' ? 'Retired' : 'How it works', sc.text),
    tray, levers: idle.levers,
  }));
  register('saveintro', { idle, steps });
  const stage = stageShell('saveintro', kind, {
    title: retire ? 'The tank is drained' : 'A new twist', center: hero, tray,
    countLabel: kind === 'chocolate' ? ' bars handed out' : kind === 'tank' ? ' levers' : '',
    count: kind === 'chocolate' ? handed.length : kind === 'tank' ? total : '',
    below: rules ? `<div class="svx-rules">${rules}</div>` : '',
  });
  const cards = list.map((sc, i) => card('saveintro', i, sc, ep, retire ? 'Retired' : meta.short, meta.color));
  const rail = `<h4 class="dr-disp">${esc(meta.short || 'The save')}</h4>
    <div class="sv-rail-row">${esc(meta.mode === 'holder' ? 'Held by the maxi winner, every week' : 'Used by a queen who lost the lip sync')}</div>`;
  publishRail('saveintro', list.map(() => rail));
  return page(row, 'saveintro', {
    phase: 'werk', title: meta.name || 'The Save', subtitle: retire ? 'no more levers' : 'how it works',
    stage, cards, rail, count: list.length,
  });
}

// ══════════════════════════════════════════════════════════════════════
// SAVE-CAMPAIGN (Untucked)
// ══════════════════════════════════════════════════════════════════════

function loungeSvg() {
  return `<svg viewBox="0 0 640 120" aria-hidden="true">
    <path class="svx-lounge-neon" d="M40 20h560" stroke="#b07aff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    <rect x="60" y="54" width="520" height="46" rx="18" fill="#3a1d52"/>
    <rect x="44" y="40" width="44" height="64" rx="16" fill="#4a2468"/>
    <rect x="552" y="40" width="44" height="64" rx="16" fill="#4a2468"/>
    <path d="M80 54h480" stroke="#6b3b94" stroke-width="3"/>
    <rect x="270" y="100" width="100" height="10" rx="4" fill="#2a1240"/>
    <circle cx="300" cy="92" r="7" fill="#ffd66b" opacity=".8"/><circle cx="334" cy="94" r="5" fill="#ff7bc8" opacity=".8"/>
  </svg>`;
}

const BUBBLE = {
  'honest-plea': 'pleading', promise: 'a deal', 'debt-called': 'you owe me', 'cold-shoulder': 'not begging',
  breakdown: 'in tears', 'throw-under': 'not her', vouch: 'vouching', torn: 'torn', backfired: 'not impressed',
  'pitch-friend': 'we are friends', 'pitch-no-threat': 'no threat', 'pitch-deserve': 'I did better',
  'pitch-record': 'my record', 'pitch-lipsync-mercy': 'I cannot win that song', 'pitch-noble': 'give me the song',
  'rebut-threat': 'she is a threat', 'rebut-deserve': 'you were not better', 'expose-deal': 'she is making deals',
  'rebut-record': 'that is why not', 'rebut-friend': 'fake friend', counter: 'I did more', 'clap-back': 'say it to my face',
  'shouting-match': 'shouting', stir: 'stirring', 'stir-caught': 'caught', 'holder-stall': 'undecided',
  'holder-hope': "don't worry", 'holder-snap': 'enough', 'holder-question': 'why you?',
};
const TONE = {
  'throw-under': 'throw', 'cold-shoulder': 'cold', backfired: 'cold', 'rebut-threat': 'throw', 'rebut-deserve': 'throw',
  'expose-deal': 'throw', 'rebut-record': 'throw', 'rebut-friend': 'throw', counter: 'throw', 'clap-back': 'throw',
  'shouting-match': 'throw', stir: 'throw', 'holder-snap': 'cold',
};
const upper = t => (t ? t[0].toUpperCase() + t.slice(1) : t);

/**
 * The campaign's stage, for the top of the Untucked screen. `scenes` are the
 * screen's own steps, so every Untucked beat has a stage state: a campaign
 * move lights the queen making it, anything else leaves the board as it was.
 * Returns '' on a night with no save to campaign for.
 */
export function campaignStage(row, scenes = []) {
  const ep = epOf(row);
  const hold = row?.dr?.save?.hold;
  if (!hold || !scenes.some(sc => sc.data?.campaign)) return '';
  const kind = hold.kind;
  const targets = hold.targets || [hold.holder];
  const moves = hold.campaign || [];
  const cast = [...new Set([...targets, ...hold.pool])];
  const pods = cast.map((n, i) => {
    const power = targets.includes(n);
    return `<div class="svx-pod${power ? ' power' : ''}" data-q="${esc(n)}" style="--i:${i}">
      <span class="svx-bubble"></span>
      <div class="svx-face">${face(n, ep, 96)}</div><b>${esc(n)}</b>
      ${power ? `<span class="svx-role">${kind === 'baguette' ? 'the favourite' : 'has the beaver'}</span>`
    : `<span class="svx-meter" data-q="${esc(n)}"><i></i></span>`}
    </div>`;
  }).join('');
  const center = `<div class="svx-lounge">${loungeSvg()}</div><div class="svx-row">${pods}</div>`;
  const meters = {};
  const idle = { phase: 'idle', talk: null, meters: {}, caption: cap('Untucked', 'The bottom is named. Now it is a campaign.') };
  let mi = 0;
  let last = idle;
  const steps = scenes.map(sc => {
    if (!sc.data?.campaign) return { ...last, caption: undefined, talk: null };
    if (sc.kind === 'save:campaign-open') {
      last = { phase: 'campaign-open', talk: null, meters: { ...meters }, caption: cap('Untucked', sc.text) };
      return last;
    }
    const id = sc.data?.move || sc.kind.replace('save:campaign:', '');
    if (id !== 'backfired') {
      const mv = moves[mi++] || {};
      for (const [, q, d] of mv.plea || []) meters[q] = (meters[q] || 0) + d;
    }
    last = {
      phase: 'campaign', talk: (sc.data?.players || [])[0] || null, about: sc.data?.about || null,
      tone: TONE[id] || null, bubble: BUBBLE[id] || '', meters: { ...meters },
      caption: cap(upper(BUBBLE[id]) || 'Untucked', sc.text),
    };
    return last;
  });
  register('untucked', { idle, steps });
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    setTimeout(() => {
      try { const { idx } = _state(ep, 'untucked'); if (idx >= 0) applyStage('untucked', idx); } catch { /* decoration */ }
    }, 0);
  }
  return `<style>${SAVE_CSS}</style>` + stageShell('untucked', kind, {
    title: kind === 'baguette' ? 'Courting the favourite' : 'Working the room',
    center, caption: idle.caption, cls: 'svx-camp',
  });
}

// ══════════════════════════════════════════════════════════════════════
// SAVE-HOLD
// ══════════════════════════════════════════════════════════════════════

export function rpBuildSaveHold(row, scenes = []) {
  const ep = epOf(row);
  const hold = row?.dr?.save?.hold;
  const list = scenes.filter(sc => /^save:/.test(sc.kind) && sc.text);
  if (!hold || !list.length) return '';
  const kind = hold.kind;
  const meta = SAVE_KINDS[kind] || {};
  const uid = `h${ep.num}`;
  const picks = hold.picks || [{ holder: hold.holder, saved: hold.saved }];
  const token = kind === 'beaver' ? beaverSvg(uid) : baguetteSvg(uid);
  const pods = hold.pool.map((n, i) => `<div class="svx-pod" data-q="${esc(n)}" style="--i:${i}">
      <i class="svx-beam"></i><span class="svx-bubble"></span>
      <span class="svx-tag"><span class="k">saved</span><span class="l">lip sync</span></span>
      <div class="svx-face">${face(n, ep, 112)}</div><b>${esc(n)}</b><i class="svx-plinth"></i></div>`).join('');
  const chip = (n, label) => `<span class="svx-mini">${_portrait(n, ep, { size: 34 })}</span>
    <span>${esc(label)} <em>${esc(n)}</em></span>`;
  const noun = kind === 'baguette' ? 'Baguette' : 'Beaver';
  const opening = kind === 'baguette'
    ? chip(hold.giver, 'Baguette from')
    : chip(hold.winners?.length > 1 ? hold.winners.join(' & ') : hold.winner, `${noun}${hold.winners?.length > 1 ? 's' : ''} held by`);
  const center = `<div class="svx-token">${token}</div>
    <div class="svx-reveal" data-f="reveal"></div>
    <div class="svx-trio">${pods}</div>`;
  const extra = `<div class="svx-holder" data-f="holder">${opening}</div>`;
  const confessBox = `<div class="svx-confess" data-f="confess"></div>`;
  const named = `The bottom ${hold.pool.length === 4 ? 'four' : 'three'}`;
  const MOOD = { saved: 'saved', hurt: 'hurt', bitter: 'of course', hopeBroken: 'you promised', stoic: 'ready to fight' };

  const idle = { phase: 'idle', kept: null, talk: null, caption: cap(named, hold.pool.join(' · ')), holder: opening, reveal: '', confess: '' };
  const kept = [];
  let holderNow = opening;
  let pickAt = 0;
  let base = { kept: [], chosen: false };
  const steps = list.map(sc => {
    const who = sc.data?.who || (sc.data?.players || [])[0];
    const common = { holder: holderNow, confess: '', talk: null };
    switch (sc.kind) {
      case 'save:handoff':
        holderNow = chip(hold.holder, `${noun} held by`);
        return { ...common, holder: holderNow, phase: 'handoff', kept: null, caption: cap('The hand-off', sc.text) };
      case 'save:invoke': {
        const h = sc.data?.holder;
        holderNow = chip(h, `${noun} held by`);
        return { ...common, holder: holderNow, phase: 'invoke', kept: [...kept], chosen: kept.length > 0, reveal: '', caption: cap('The host', sc.text) };
      }
      case 'save:speech':
        return { ...common, phase: 'speech', talk: sc.data?.to, bubble: 'listening', kept: [...kept], chosen: kept.length > 0,
          caption: cap(`${sc.data?.holder} speaks`, sc.text) };
      case 'save:suspense':
        return { ...common, phase: 'deciding', kept: [...kept], chosen: kept.length > 0, caption: cap('The wait', sc.text) };
      case 'save:saved': {
        const pk = picks[pickAt++] || picks[0];
        const beforeKept = [...kept];
        kept.push(pk.saved);
        base = { kept: [...kept], chosen: true };
        return {
          ...common, lead: 'deciding', leadMs: 1600, leadCaption: cap(`${pk.holder} decides`, '…'), leadKept: beforeKept,
          phase: 'saved', ...base, reveal: `<small>${esc(noun)} saves</small><b>${esc(pk.saved)}</b>`,
          caption: cap(`${pk.holder} decides`, sc.text),
        };
      }
      case 'save:host-react':
      case 'save:reaction':
        return { ...common, phase: 'saved', ...base, reveal: `<small>${esc(noun)} saves</small><b>${esc(kept[kept.length - 1] || '')}</b>`,
          talk: sc.kind === 'save:reaction' ? who : (sc.data?.saved || who),
          tone: sc.data?.mood || 'saved', bubble: MOOD[sc.data?.mood] || 'safe',
          caption: cap(sc.kind === 'save:reaction' ? 'Reaction' : 'The host', sc.text) };
      case 'save:confessional':
        return { ...common, phase: 'confess', ...base,
          confess: `<span class="svx-cface">${face(who, ep, 120)}</span><div><q>${esc(sc.text)}</q><small>Confessional · ${esc(who)}</small></div>`,
          caption: cap(`Confessional · ${who}`, sc.text) };
      case 'save:left':
        return { ...common, phase: 'left', ...base, reveal: '', caption: cap('Lip sync for your life', sc.text) };
      default:   // repaid, promise-kept/broken, grudge
        return { ...common, phase: 'saved', ...base, talk: (sc.data?.players || [])[1] || null, tone: 'saved', bubble: '',
          caption: cap('What it settled', sc.text) };
    }
  });
  register('savehold', { idle, steps });

  const stage = stageShell('savehold', kind, {
    title: `${hold.pool.length === 4 ? 'Two of four' : 'One of three'} saved`, center, extra, caption: idle.caption,
  }).replace('<div class="svx-caption"', `${confessBox}<div class="svx-caption"`);
  const tagOf = sc => ({
    'save:handoff': 'The hand-off', 'save:invoke': 'The host', 'save:speech': `${sc.data?.holder || ''} speaks`,
    'save:suspense': 'The wait', 'save:saved': `${sc.data?.holder || hold.holder} decides`, 'save:host-react': 'The host',
    'save:reaction': 'Reaction', 'save:confessional': `Confessional · ${sc.data?.who || ''}`, 'save:left': 'Lip sync for your life',
  }[sc.kind] || 'What it settled');
  const cards = list.map((sc, i) => card('savehold', i, sc, ep, tagOf(sc), meta.color)
    .replace('class="svx-card"', `class="svx-card${sc.kind === 'save:saved' ? ' svx-card-reveal' : sc.kind === 'save:confessional' ? ' svx-card-confess' : ''}"`));

  const head = handed => `<h4 class="dr-disp">${esc(meta.short)}</h4>
    ${kind === 'baguette'
    ? `<div class="sv-rail-row">From <b>${esc(hold.giver)}</b>, out last week</div>
       <div class="sv-rail-row">Held by <b>${esc(handed ? hold.holder : '…')}</b></div>`
    : `<div class="sv-rail-row">Winner${(hold.winners || []).length > 1 ? 's' : ''} <b>${esc((hold.winners || [hold.winner]).join(' & '))}</b></div>`}
    <h4 class="dr-disp">${esc(named)}</h4>`;
  const railAt = (handed, savedSoFar, done) => `${head(handed)}
    ${hold.pool.map(n => `<div class="sv-rail-row">${_portrait(n, ep, { size: 26 })} ${esc(n)} ${
      savedSoFar.includes(n) ? '<b>SAVED</b>' : done ? 'lip syncs' : ''}</div>`).join('')}`;
  // The rail names her one step late, so it cannot answer the wait.
  let handed = false;
  const shown = [];
  const perStep = list.map(sc => {
    if (sc.kind === 'save:handoff') handed = true;
    const out = railAt(handed, [...shown], sc.kind === 'save:left');
    if (sc.kind === 'save:saved') shown.push(picks[shown.length]?.saved);
    return out;
  });
  publishRail('savehold', perStep);
  return page(row, 'savehold', {
    phase: 'stage', title: meta.name,
    subtitle: kind === 'baguette' ? 'the queen who went home chooses who holds it' : 'the winner saves one',
    stage, cards, rail: railAt(false, [], false), count: list.length,
  });
}

// ══════════════════════════════════════════════════════════════════════
// SAVE-LUCK
// ══════════════════════════════════════════════════════════════════════

export function rpBuildSaveLuck(row, scenes = []) {
  const ep = epOf(row);
  const sv = row?.dr?.save;
  const tries = sv?.tries || [];
  const list = scenes.filter(sc => sc.text);
  if (!sv || !tries.length || !list.length) return '';
  const kind = sv.kind;
  const meta = SAVE_KINDS[kind] || {};
  const before = savesBefore(row) || {};
  const total = sv.levers?.total || before.levers || 4;
  const uid = `l${ep.num}`;
  const tryOf = n => tries.find(t => t.queen === n) || null;
  const goldQueen = tries.find(t => t.saved)?.queen || null;

  // ── the running state, step by step ──
  const handed = before.handed || [];
  const opened = new Set(before.opened || []);
  let goldFound = false;
  const sealed = () => handed.filter(n => !opened.has(n)).length;
  const trayNow = () => handed.map(n => `<i class="${goldFound && n === goldQueen ? 'gold'
    : opened.has(n) ? 'gone' : ''}"></i>`).join('');
  let live = tries[0]?.levers ? [...tries[0].levers] : Array.from({ length: total }, (_, k) => k + 1);
  let dunks = Math.max(0, (before.dunks || 0) - tries.filter(t => t.saved).length);
  const railNow = () => (kind === 'tank'
    ? `<h4 class="dr-disp">${esc(meta.short)}</h4>
      <div class="sv-rail-row">Levers in play <b>${live.length}</b></div>
      <div class="sv-levers">${Array.from({ length: total }, (_, k) => `<i class="${live.includes(k + 1) ? '' : 'sv-gone'}"></i>`).join('')}</div>
      <div class="sv-rail-row">Dunks so far <b>${dunks}</b></div>`
    : `<h4 class="dr-disp">${esc(meta.short)}</h4>
      <div class="sv-rail-row">Bars still sealed <b>${sealed()}</b></div>
      <div class="sv-rail-row">${goldFound ? '<b>The golden bar has been found</b>' : 'The golden bar is still out there'}</div>`);
  const restRail = railNow();

  const idle = kind === 'tank'
    ? { phase: 'idle', caption: '', portrait: '', levers: { live: [...live] }, count: live.length }
    : { phase: 'idle', caption: '', portrait: '', tray: trayNow(), count: sealed() };
  const steps = [];
  const railRows = [];
  let railLate = null;
  let last = null;
  for (const sc of list) {
    const q = (sc.data?.players || [])[0];
    const t = tryOf(q);
    if (sc.kind === 'save:ask') {
      last = { q, t };
      steps.push(kind === 'tank'
        ? { phase: 'hold', portrait: face(q, ep), caption: cap('Last chance', sc.text), levers: { live: [...live] }, count: live.length }
        : { phase: 'hold', portrait: face(q, ep), caption: cap('Last chance', sc.text), tray: trayNow(), count: sealed() });
    } else if (sc.kind === 'save:open') {
      opened.add(q);
      railLate = railNow();
      if (t?.saved) goldFound = true;
      steps.push({
        lead: 'tear', leadMs: 1000, leadCaption: cap('The bar', '…'), open: true, result: t?.saved ? 'gold' : 'plain',
        phase: t?.saved ? 'gold' : 'plain', portrait: face(q, ep),
        caption: cap(t?.saved ? 'Golden!' : 'The bar', sc.text), tray: trayNow(), count: sealed(),
      });
    } else if (sc.kind === 'save:pull') {
      const chosen = t?.lever;
      const was = [...live];
      railLate = railNow();
      if (t?.saved) { dunks += 1; live = Array.from({ length: total }, (_, k) => k + 1); } else live = live.filter(x => x !== chosen);
      steps.push({
        lead: 'pull', leadMs: 1200, leadCaption: cap('The lever', `Lever ${chosen}…`), phase: t?.saved ? 'hit' : 'miss', portrait: face(q, ep),
        caption: cap(t?.saved ? 'Splash!' : 'The lever', sc.text),
        levers: { live: was, chosen, missed: !t?.saved }, count: live.length,
      });
    } else if (sc.kind === 'save:aftermath') {
      steps.push(kind === 'tank'
        ? { phase: 'hit', portrait: face(q, ep), caption: cap('Nobody goes home', sc.text),
          levers: { live: [...live] }, count: live.length }
        : { phase: 'gold', open: true, result: 'gold', portrait: face(q, ep),
          caption: cap('Nobody goes home', sc.text), tray: trayNow(), count: sealed() });
    } else {
      // Her goodbye, after the bar or the lever.
      const who = last?.q || q;
      steps.push(kind === 'tank'
        ? { phase: 'bye', portrait: face(who, ep), caption: cap('Sashay away', sc.text),
          levers: { live: [...live, last?.t?.lever].filter(Boolean), chosen: last?.t?.lever, missed: true }, count: live.length }
        : { phase: 'bye', open: true, result: 'plain', portrait: face(who, ep), caption: cap('Sashay away', sc.text),
          tray: trayNow(), count: sealed() });
    }
    railRows.push(railLate ?? railNow());
    railLate = null;
  }
  register('saveluck', { idle, steps });

  const center = kind === 'tank'
    ? `<div class="svx-tank">${tankSvg({ total, uid })}</div>
       <div class="svx-halo" data-f="halo"></div>
       <div class="svx-drops">${drops()}</div>
       <div class="svx-splash">SPLASH!</div>
       <div class="svx-stamp">DRY</div>`
    : `<div class="svx-halo" data-f="halo"></div>
       <div class="svx-bar">
         <div class="svx-inner svx-inner-plain">${barInner(false)}</div>
         <div class="svx-inner svx-inner-gold">${barInner(true)}</div>
         <div class="svx-wrap svx-wrap-l">${wrapHalf('l', uid)}</div>
         <div class="svx-wrap svx-wrap-r">${wrapHalf('r', uid)}</div>
         <div class="svx-foil"></div>
       </div>
       <div class="svx-ticket">${ticketSvg()}</div>
       <div class="svx-confetti">${confetti()}</div>
       <div class="svx-crumbs">${crumbs()}</div>
       <div class="svx-stamp">JUST CHOCOLATE</div>`;
  let stage = stageShell('saveluck', kind, {
    title: kind === 'tank' ? 'Pick a lever' : 'Open your bar', center,
    tray: idle.tray || '', count: idle.count,
    countLabel: kind === 'tank' ? ' levers in play' : ' bars still sealed',
  });
  // Levers already pulled before tonight are gone in the markup itself.
  if (kind === 'tank') {
    stage = stage.replace(/<g class="svx-lv" data-lever="(\d+)"/g, (m, n) =>
      (live.length && !idle.levers.live.includes(Number(n)) ? `<g class="svx-lv gone" data-lever="${n}"` : m));
  }

  const tagOf = sc => ({ 'save:ask': 'Last chance', 'save:open': 'The bar', 'save:pull': 'The lever',
    'save:aftermath': 'Nobody goes home' }[sc.kind] || 'Sashay away');
  const cards = list.map((sc, i) => card('saveluck', i, sc, ep, tagOf(sc), meta.color));
  publishRail('saveluck', railRows);
  return page(row, 'saveluck', {
    phase: 'lipsync', title: 'Last Chance',
    subtitle: kind === 'tank' ? 'the levers' : 'the chocolate bar',
    stage, cards, rail: restRail, count: list.length,
  });
}
