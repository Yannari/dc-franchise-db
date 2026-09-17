// ══════════════════════════════════════════════════════════════════════
// vp-dr/finale-stage.js — the finale night, staged
// ══════════════════════════════════════════════════════════════════════
//
// The same idea as the weekly lip sync, the call and the save: a stage pinned
// above the cards that plays each card as it is revealed. Three of them here:
//
//   crownLipsyncStage  the lip sync for the crown, single final or bracket:
//                      a gold concert stage, the bracket filling in above it,
//                      the host's word before each round, the song's parts,
//                      meters, a tug-of-war, the big moment, a crown hanging
//                      over the stage that drops onto the queen who wins.
//   showcaseStage      the original numbers: curtains, a marquee, the
//                      performer centre stage, an applause meter that fills
//                      to what she did, and a board of who has gone.
//   interviewStage     one on one: two chairs, the question and the answer,
//                      the follow-up that turns the heat up, and the queens
//                      still waiting their turn.
//
// Each builds ONE STATE PER STEP from the screen's own step list, so nothing
// on the stage runs ahead of the card that has been revealed, and applies it
// through `_drRevealExtra[suffix]`. The markup at rest names nobody's result.
// Objects are SVG; lights, bars and particles are geometry. Reduced motion
// shows end states and moves nothing.
import { _portrait, _judgePortrait } from './style.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const trim = (t, n = 150) => {
  const s = String(t || '');
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 20)).trimEnd()}…`;
};

const spread = (n, seed) => {
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return Array.from({ length: n }, () => ({ a: r(), b: r(), c: r(), d: r() }));
};

// ── THE SHARED SHELL ──────────────────────────────────────────────────
export const FINALE_STAGE_CSS = `
.fsx{position:relative;isolation:isolate;overflow:hidden;border-radius:22px;margin:0 0 18px;padding:12px 16px 14px;color:#fff;
  --fx:#ffd66b;--fx2:#ff3d9a;
  background:radial-gradient(120% 85% at 50% 0,#3a2600 0,#150a02 52%,#070301 100%);
  box-shadow:0 30px 80px -30px #000,inset 0 0 0 1px rgba(255,214,107,.16)}
.fsx{position:sticky;top:6px;z-index:5}
/* THEMES: the same frame lit for the room it is in. */
.fsx.th-stage{--fx:#ff7bc8;--fx2:#ffd66b;background:radial-gradient(120% 85% at 50% 0,#4a0a34 0,#1a0414 52%,#08020a 100%);
  box-shadow:0 30px 80px -30px #000,inset 0 0 0 1px rgba(255,123,200,.18)}
.fsx.th-werk{--fx:#7df9ff;--fx2:#ff7bc8;background:radial-gradient(120% 85% at 50% 0,#1d1646 0,#0d0a24 52%,#05040f 100%);
  box-shadow:0 30px 80px -30px #000,inset 0 0 0 1px rgba(125,249,255,.16)}
.fsx.th-lounge{--fx:#c9a2ff;--fx2:#ffd66b;background:radial-gradient(120% 85% at 50% 0,#2d1446 0,#150a24 52%,#07040d 100%);
  box-shadow:0 30px 80px -30px #000,inset 0 0 0 1px rgba(201,162,255,.16)}
.fsx.th-stage .fsx-rays{background:repeating-conic-gradient(from 180deg at 50% -12%,rgba(255,123,200,.07) 0 4deg,transparent 4deg 11deg)}
.fsx.th-werk .fsx-rays{background:repeating-linear-gradient(90deg,rgba(125,249,255,.04) 0 1px,transparent 1px 38px),repeating-linear-gradient(0deg,rgba(125,249,255,.04) 0 1px,transparent 1px 38px);animation:none}
.fsx.th-lounge .fsx-rays{background:radial-gradient(40% 30% at 20% 30%,rgba(201,162,255,.12),transparent 70%),radial-gradient(35% 30% at 80% 20%,rgba(255,214,107,.08),transparent 70%);animation:none}
.fsx[class*=th-] .fsx-title{color:#fff}
.fsx[class*=th-] .fsx-head span{color:#1a0010;background:linear-gradient(90deg,var(--fx),#fff)}
.fsx[class*=th-] .fsx-qbody{background:rgba(14,6,20,.94);border-color:var(--fx)}
.fsx[class*=th-] .fsx-hface{box-shadow:0 0 0 2px var(--fx)}
.fsx-cards .dr-step{scroll-margin-top:520px}
.fsx-bg,.fsx-bg i{position:absolute;inset:0;pointer-events:none}
.fsx-bg{z-index:0;transition:filter .6s}
.fsx > *:not(.fsx-bg){position:relative;z-index:1}
.fsx > .fsx-banner,.fsx > .fsx-burst,.fsx > .fsx-quote,.fsx > .fsx-stars{position:absolute}
.fsx > .fsx-quote{z-index:7}.fsx > .fsx-banner{z-index:5}.fsx > .fsx-burst{z-index:4}.fsx > .fsx-stars{z-index:4}
.fsx-rays{opacity:.55;background:repeating-conic-gradient(from 180deg at 50% -12%,rgba(255,214,107,.07) 0 4deg,transparent 4deg 11deg);
  animation:fsx-rays 60s linear infinite}
@keyframes fsx-rays{to{transform:rotate(8deg)}}
.fsx-haze{background:radial-gradient(70% 40% at 50% 100%,rgba(255,61,154,.16),transparent 70%)}
.fsx-wash{opacity:0;transition:opacity .6s,background .6s}
.fsx[data-mood=gold] .fsx-wash{opacity:1;background:radial-gradient(90% 70% at 50% 55%,rgba(255,214,107,.3),transparent 70%)}
.fsx[data-mood=red] .fsx-wash{opacity:1;background:radial-gradient(90% 70% at 50% 100%,rgba(255,30,60,.34),transparent 70%)}
.fsx[data-mood=cool] .fsx-wash{opacity:1;background:radial-gradient(90% 70% at 50% 55%,rgba(150,190,255,.2),transparent 70%)}
.fsx-vig{box-shadow:inset 0 0 130px 45px rgba(0,0,0,.82);opacity:.45;transition:opacity .6s}
.fsx[data-phase=hold] .fsx-vig{opacity:1;animation:fsx-heart 1s ease-in-out infinite}
@keyframes fsx-heart{0%,100%{box-shadow:inset 0 0 130px 45px rgba(0,0,0,.85)}15%{box-shadow:inset 0 0 200px 90px rgba(40,10,0,.95)}30%{box-shadow:inset 0 0 130px 45px rgba(0,0,0,.85)}45%{box-shadow:inset 0 0 180px 70px rgba(40,10,0,.9)}}

.fsx-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.fsx-title{font:400 21px/1 'Anton','Impact',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#fff3cf}
.fsx-title small{display:block;margin-top:3px;font:600 10px/1 system-ui,sans-serif;letter-spacing:.24em;color:var(--fx)}
.fsx-host{display:flex;align-items:center;gap:8px;padding:3px 12px 3px 3px;border-radius:99px;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,214,107,.2);transition:box-shadow .4s,border-color .4s}
.fsx-host.on{box-shadow:0 0 22px rgba(255,214,107,.5);border-color:var(--fx)}
.fsx-hface{width:36px;height:36px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px var(--fx)}
.fsx-hface > *,.fsx-hface img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.fsx-hlabel{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--fx)}
.fsx-head{flex:1 1 auto;display:flex;justify-content:center;min-width:0}
.fsx-head span{padding:4px 14px;border-radius:99px;font:400 15px/1.1 'Anton','Impact',sans-serif;letter-spacing:.08em;text-transform:uppercase;
  color:#2a1a00;background:linear-gradient(90deg,#ffd66b,#fff1a8);box-shadow:0 0 18px rgba(255,214,107,.5);
  opacity:0;transform:translateY(-6px);transition:opacity .4s .9s,transform .4s .9s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.fsx-head span.on{opacity:1;transform:none}
.fsx-head span.red{color:#fff;background:linear-gradient(90deg,#ff294b,#ff6b8a);box-shadow:0 0 18px rgba(255,41,75,.55)}
.fsx-head span small{font:600 10px/1 system-ui,sans-serif;letter-spacing:.16em;margin-left:8px;opacity:.85}

.fsx-face{border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px rgba(255,255,255,.15),0 16px 34px -12px #000;transition:box-shadow .5s,filter .5s}
.fsx-face > *,.fsx-face img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}

.fsx-banner{left:0;right:0;top:40%;text-align:center;pointer-events:none;opacity:0;transform:scale(.6)}
.fsx-banner b{display:inline-block;padding:6px 26px;font:400 clamp(30px,5.6vw,60px)/1 'Anton','Impact',sans-serif;letter-spacing:.05em;
  text-transform:uppercase;color:#fff;text-shadow:0 0 30px var(--fx),0 6px 0 rgba(0,0,0,.6);background:linear-gradient(90deg,transparent,rgba(255,214,107,.32),transparent)}
.fsx-banner small{display:block;margin-top:6px;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--fx)}
.fsx-banner.red b{color:#d9d9e4;text-shadow:0 0 22px #000,0 6px 0 #3a0010;background:linear-gradient(90deg,transparent,rgba(255,41,75,.3),transparent)}
.fsx-banner.red small{color:#ff9fb0}
.fsx-banner.show{animation:fsx-banner 2.6s cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes fsx-banner{0%{opacity:0;transform:scale(.6)}15%{opacity:1;transform:scale(1.06)}25%{transform:scale(1)}75%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.92)}}

.fsx-burst{left:50%;top:42%;width:0;height:0;pointer-events:none}
.fsx-burst i{position:absolute;width:var(--w);height:calc(var(--w) * .5);background:var(--c);opacity:0;border-radius:1px}
.fsx.burst .fsx-burst i{animation:fsx-fall var(--t) cubic-bezier(.1,.7,.3,1) var(--dl) forwards}
@keyframes fsx-fall{0%{opacity:1;transform:translate(0,0) rotate(0)}85%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) rotate(var(--r))}}
.fsx-stars{left:50%;top:46%;width:0;height:0;pointer-events:none}
.fsx-stars i{position:absolute;width:var(--w);height:var(--w);opacity:0;background:var(--c);
  clip-path:polygon(50% 0,61% 38%,100% 50%,61% 62%,50% 100%,39% 62%,0 50%,39% 38%)}
.fsx.stars .fsx-stars i{animation:fsx-fall var(--t) cubic-bezier(.1,.7,.3,1) var(--dl) forwards}
.fsx.shake{animation:fsx-shake .45s linear}
@keyframes fsx-shake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}

/* A piece to camera, or a speech: the stage greys and one face talks. */
.fsx[data-phase=quote] .fsx-bg,.fsx[data-phase=quote] .fsx-body{filter:grayscale(1) brightness(.4)}
.fsx-quote{inset:0;display:flex;align-items:center;justify-content:center;gap:18px;padding:20px;opacity:0;pointer-events:none;transition:opacity .35s}
.fsx[data-phase=quote] .fsx-quote{opacity:1}
.fsx-qframe{position:relative;flex:0 0 130px;width:130px;height:130px;border-radius:18px;overflow:hidden;
  box-shadow:0 0 0 3px var(--fx),0 20px 50px rgba(0,0,0,.8);transform:rotate(-3deg)}
.fsx-qframe > *,.fsx-qframe img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.fsx-qbody{max-width:480px;padding:14px 18px;border-radius:16px;background:rgba(24,14,2,.94);border:1px solid rgba(255,214,107,.45)}
.fsx-qbody small{display:inline-block;margin-bottom:8px;padding:3px 10px;border-radius:99px;background:var(--fx);color:#2a1a00;
  font-size:10px;letter-spacing:.26em;text-transform:uppercase}
.fsx-qbody q{display:block;font-size:17px;line-height:1.45;font-style:italic;quotes:none}
.fsx[data-phase=quote] .fsx-qframe{animation:fsx-in .45s cubic-bezier(.2,1.4,.4,1)}
@keyframes fsx-in{from{transform:rotate(-10deg) translateX(-40px);opacity:0}}

/* The cards under a finale stage: who said it, and what. */
.fsx-cards{display:grid;gap:10px}
.fsx-card{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;padding:16px 18px;border-radius:14px;
  background:linear-gradient(90deg,rgba(255,214,107,.07),transparent 45%),rgba(14,8,3,.92);border:1px solid rgba(255,214,107,.16);
  border-left:4px solid rgba(255,214,107,.55)}
.fsx-card.q{border-left-color:#ff7bc8;background:linear-gradient(90deg,rgba(255,61,154,.08),transparent 45%),rgba(14,6,10,.92)}
.fsx-card.big{border-color:rgba(255,214,107,.55);box-shadow:0 0 30px -12px rgba(255,214,107,.6)}
.fsx-card.red{border-left-color:#ff294b}
.fsx-card .dr-por{border:2px solid rgba(255,240,200,.35)}
.fsx-card p{margin:0;color:#f4e3ed;font-size:15px;line-height:1.62;text-wrap:pretty}
.fsx-card.host p{font-family:Didot,'Bodoni MT',Georgia,serif;font-size:17px;color:#fff6e0}
.fsx-cards .dr-panel.fsx-cmoment{border-color:rgba(255,214,107,.55)}
.fsx-cards .fsx-ctag{display:inline-block;margin-bottom:4px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#ffd66b}

/* ══ THE FINALE OPENS ══ */
.fox-line{display:flex;justify-content:center;align-items:flex-end;gap:clamp(10px,3vw,34px);flex-wrap:wrap;margin-top:12px;padding-top:30px}
.fox-q{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;opacity:0;transform:translateY(30px);
  transition:opacity .6s,transform .7s cubic-bezier(.2,1.4,.4,1),filter .5s;transition-delay:var(--dl)}
.fsx.lit .fox-q{opacity:1;transform:none}
.fox-q::before{content:'';position:absolute;top:-30px;left:50%;width:170px;height:230px;transform:translateX(-50%);z-index:-1;
  background:linear-gradient(180deg,rgba(255,236,190,.35),transparent 80%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);opacity:.4;transition:opacity .5s}
.fox-q .fsx-face{width:96px;height:96px;box-shadow:0 0 0 3px var(--fx)}
.fox-q b{font:400 17px/1 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.fsx.any .fox-q:not(.on){filter:brightness(.55)}
.fox-q.on{transform:translateY(-8px) scale(1.06)}
.fox-q.on::before{opacity:1}
.fox-q.on .fsx-face{box-shadow:0 0 0 4px #fff1a8,0 0 50px 12px rgba(255,214,107,.55)}
.fox-shape{margin-top:10px;text-align:center;font:italic 15px/1.3 Didot,'Bodoni MT',Georgia,serif;color:#fff3cf}
@media (max-height: 999px){.fox-q .fsx-face{width:70px;height:70px}.fox-line{padding-top:16px}}

/* ══ THE CROWN LIP SYNC ══ */
.clx-bracket{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.clx-box{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:10px;font-size:11px;letter-spacing:.06em;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#b9a58a;transition:all .4s}
.clx-box em{font-style:normal;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#8a7a60}
.clx-box.now{border-color:var(--fx);color:#fff;box-shadow:0 0 16px rgba(255,214,107,.35)}
.clx-box span.w{color:var(--fx);font-weight:700}
.clx-box span.l{text-decoration:line-through;opacity:.55}
.clx-now{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:8px;padding:6px 12px;border-radius:14px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,214,107,.14)}
.clx-note{width:28px;height:28px;flex:0 0 28px}
.clx-song{display:flex;flex-direction:column;line-height:1.15;min-width:0}
.clx-song b{font:400 18px/1.1 'Anton','Impact',sans-serif;letter-spacing:.02em;text-transform:uppercase}
.clx-song small{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#ffe4a3}
.clx-eq{display:flex;align-items:flex-end;gap:3px;height:24px;margin-left:auto}
.clx-eq i{width:5px;border-radius:2px;background:linear-gradient(0deg,#ff9d2e,#fff1a8);height:30%;
  animation:clx-eq .45s ease-in-out infinite alternate;animation-delay:var(--dl)}
@keyframes clx-eq{from{height:18%}to{height:100%}}
.fsx:not([data-phase=song]) .clx-eq i{animation-play-state:paused;height:14%}
.clx-parts{display:flex;gap:6px;margin:8px 0 0;justify-content:center}
.clx-parts span{font-size:10px;letter-spacing:.2em;text-transform:uppercase;padding:3px 10px;border-radius:99px;
  background:rgba(255,255,255,.05);color:#9d8a70;transition:all .4s}
.clx-parts span.on{background:rgba(255,214,107,.2);color:#fff}
.clx-parts span.big.on{background:#ffd66b;color:#2a1a00;box-shadow:0 0 20px rgba(255,214,107,.7)}
.clx-duel{display:none;grid-template-columns:1fr auto 1fr;align-items:end;gap:10px;margin-top:4px;min-height:200px}
.clx-duel.cur{display:grid}
.clx-q{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:26px;
  transition:transform .6s cubic-bezier(.2,1.4,.4,1),filter .6s}
.clx-q::before{content:'';position:absolute;top:-26px;left:50%;width:200px;height:280px;transform:translateX(-50%);z-index:-1;
  background:linear-gradient(180deg,rgba(255,236,190,.3),rgba(255,214,107,.05) 70%,transparent);
  clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);opacity:.3;transition:opacity .6s}
.clx-q .fsx-face{width:118px;height:118px}
.clx-q b{font:400 19px/1 'Anton','Impact',sans-serif;letter-spacing:.04em;text-transform:uppercase}
.clx-meter{width:min(170px,90%);height:9px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
.clx-meter i{display:block;height:100%;width:50%;border-radius:99px;background:linear-gradient(90deg,#ff9d2e,#fff1a8);transition:width .8s cubic-bezier(.2,1.2,.4,1)}
.clx-score{font:700 14px/1 ui-monospace,Menlo,monospace;color:var(--fx);min-height:15px}
.clx-stamp{position:absolute;top:44%;left:50%;transform:translate(-50%,-50%) rotate(-10deg) scale(2.6);opacity:0;white-space:nowrap;
  padding:5px 14px;border:4px solid currentColor;border-radius:8px;font:400 26px/1 'Anton','Impact',sans-serif;letter-spacing:.08em;background:rgba(10,4,0,.65)}
.clx-q.st-win .clx-stamp{color:#ffd66b}
.clx-q.st-out .clx-stamp{color:#ff294b}
.clx-q[class*=st-] .clx-stamp{animation:clx-slam .45s cubic-bezier(.5,0,.3,1.4) .1s forwards}
@keyframes clx-slam{to{opacity:1;transform:translate(-50%,-50%) rotate(-10deg) scale(1)}}
.fsx.any .clx-q:not(.on){filter:brightness(.5) saturate(.6);transform:scale(.94)}
.clx-q.on{transform:translateY(-8px) scale(1.05)}
.clx-q.on::before{opacity:1}
.clx-q.on .fsx-face{box-shadow:0 0 0 4px var(--fx),0 0 60px 14px rgba(255,214,107,.5);animation:clx-bop .45s ease-in-out infinite alternate}
.clx-q.talk .fsx-face{animation:none;box-shadow:0 0 0 4px #fff1a8,0 0 40px 8px rgba(255,241,168,.4)}
@keyframes clx-bop{from{transform:translateY(0) rotate(-1.5deg)}to{transform:translateY(-6px) rotate(1.5deg)}}
.clx-q.good .fsx-face{box-shadow:0 0 0 4px #fff,0 0 80px 22px rgba(255,214,107,.75)}
.clx-q.bad .fsx-face{box-shadow:0 0 0 4px #7a7a8a;animation:clx-wobble .5s ease-in-out 2}
@keyframes clx-wobble{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
.fsx[data-phase=verdict] .clx-q.st-out{filter:grayscale(1) brightness(.55);transform:scale(.92)}
.fsx[data-phase=verdict] .clx-q.st-win{transform:translateY(-10px) scale(1.08)}
.fsx[data-phase=verdict] .clx-q.st-win::before{opacity:1}
.clx-mid{display:flex;flex-direction:column;align-items:center;gap:6px;padding-bottom:40px}
.clx-crown{width:70px;transition:transform .9s cubic-bezier(.3,1.5,.5,1),filter .6s;filter:drop-shadow(0 0 14px rgba(255,214,107,.6));
  animation:clx-float 2.6s ease-in-out infinite}
@keyframes clx-float{50%{transform:translateY(-6px)}}
.clx-vs{font:400 30px/1 'Anton','Impact',sans-serif;color:#fff1a8;text-shadow:0 0 24px rgba(255,214,107,.8)}
.clx-duel.to-a .clx-crown{animation:none;transform:translate(calc(-1 * var(--hop,140px)),-78px) scale(.9)}
.clx-duel.to-b .clx-crown{animation:none;transform:translate(var(--hop,140px),-78px) scale(.9)}
.clx-tug{position:relative;height:9px;margin:10px auto 0;width:min(480px,90%);border-radius:99px;
  background:linear-gradient(90deg,rgba(255,214,107,.55),rgba(255,255,255,.08) 50%,rgba(255,61,154,.55))}
.clx-tug i{position:absolute;top:50%;left:50%;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;
  background:#fff;box-shadow:0 0 16px #fff;transition:left .8s cubic-bezier(.2,1.4,.4,1)}

/* ══ THE SHOWCASE ══ */
.shx-house{position:relative;display:grid;grid-template-columns:1fr;justify-items:center;min-height:250px;margin-top:8px;
  border-radius:16px;overflow:hidden;background:radial-gradient(60% 80% at 50% 100%,rgba(255,61,154,.18),transparent 70%),#0b0503}
.shx-bulbs{position:absolute;left:0;right:0;top:0;height:14px;display:flex;justify-content:space-around;align-items:center;z-index:3}
.shx-bulbs i{width:7px;height:7px;border-radius:50%;background:#5a4420;transition:background .3s}
.fsx[data-phase=perf] .shx-bulbs i{animation:shx-bulb 1s steps(2) infinite;animation-delay:var(--dl)}
@keyframes shx-bulb{0%{background:#fff1a8;box-shadow:0 0 8px #ffd66b}100%{background:#5a4420;box-shadow:none}}
.shx-curtain{position:absolute;top:0;bottom:0;width:51%;z-index:4;transition:transform 1.1s cubic-bezier(.6,0,.3,1);
  background:repeating-linear-gradient(90deg,#7a0f2a 0 14px,#5c0a1f 14px 26px);box-shadow:inset 0 -30px 40px rgba(0,0,0,.5)}
.shx-curtain.l{left:0;transform-origin:left}.shx-curtain.r{right:0;transform-origin:right}
.fsx[data-open="1"] .shx-curtain.l{transform:translateX(-92%)}
.fsx[data-open="1"] .shx-curtain.r{transform:translateX(92%)}
.shx-perf{display:none;position:relative;flex-direction:column;align-items:center;gap:8px;padding:26px 10px 12px;z-index:2}
.shx-perf.cur{display:flex;animation:shx-rise .8s cubic-bezier(.2,1.3,.4,1)}
@keyframes shx-rise{from{transform:translateY(30px);opacity:0}}
.shx-perf::before{content:'';position:absolute;top:0;left:50%;width:260px;height:300px;transform:translateX(-50%);z-index:-1;
  background:linear-gradient(180deg,rgba(255,240,200,.35),transparent 80%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%)}
.shx-perf .fsx-face{width:120px;height:120px;box-shadow:0 0 0 4px var(--fx),0 0 50px 10px rgba(255,214,107,.45)}
.shx-perf b{font:400 22px/1 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.shx-arc{width:170px;height:92px}
.shx-arc .bg{fill:none;stroke:rgba(255,255,255,.1);stroke-width:10;stroke-linecap:round}
.shx-arc .fg{fill:none;stroke-width:10;stroke-linecap:round;transition:stroke-dashoffset 1.6s cubic-bezier(.2,1,.3,1) .4s}
.shx-arc text{fill:#fff;font:700 18px ui-monospace,Menlo,monospace}
.shx-tier{font:400 18px/1 'Anton','Impact',sans-serif;letter-spacing:.14em;text-transform:uppercase;opacity:0;transform:scale(1.6);
  transition:opacity .4s 1.4s,transform .5s 1.4s cubic-bezier(.2,1.5,.35,1)}
.shx-perf.cur .shx-tier{opacity:1;transform:none}
.shx-board{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:10px}
.shx-slot{display:flex;flex-direction:column;align-items:center;gap:4px;width:74px;opacity:.55;transition:opacity .4s}
.shx-slot .fsx-face{width:40px;height:40px}
.shx-slot b{font-size:10px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.shx-slot .bar{width:100%;height:6px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.shx-slot .bar i{display:block;height:100%;width:0;border-radius:99px;background:var(--tc,#ffd66b);transition:width .8s}
.shx-slot.done,.shx-slot.now{opacity:1}
.shx-slot.now .fsx-face{box-shadow:0 0 0 3px var(--fx),0 0 18px rgba(255,214,107,.6)}

/* ══ THE INTERVIEW ══ */
.ivx-set{position:relative;display:grid;grid-template-columns:1fr 1.3fr 1fr;align-items:end;gap:8px;min-height:220px;margin-top:8px;
  border-radius:16px;background:radial-gradient(60% 70% at 50% 100%,rgba(255,233,168,.12),transparent 70%),#0d0805;padding:14px 10px 10px}
.ivx-seat{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;transition:filter .5s,transform .5s}
.ivx-seat .fsx-face{width:104px;height:104px}
.ivx-seat b{font:400 16px/1 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.ivx-chair{width:110px;height:34px}
.ivx-seat.dim{filter:brightness(.5) saturate(.6);transform:scale(.95)}
.ivx-seat.lit .fsx-face{box-shadow:0 0 0 4px #fff1a8,0 0 44px 10px rgba(255,233,168,.45)}
.ivx-q{display:none}
.ivx-q.cur{display:flex;animation:ivx-in .6s cubic-bezier(.2,1.3,.4,1)}
@keyframes ivx-in{from{transform:translateX(40px);opacity:0}}
.ivx-mid{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;padding-bottom:28px;min-width:0}
.ivx-kind{padding:3px 12px;border-radius:99px;font:400 14px/1.1 'Anton','Impact',sans-serif;letter-spacing:.12em;text-transform:uppercase;
  background:rgba(255,255,255,.08);color:#cdbfa8;transition:all .4s}
.fsx[data-k=ask] .ivx-kind,.fsx[data-k=close] .ivx-kind{background:#fff1a8;color:#2a1a00}
.fsx[data-k=follow] .ivx-kind{background:#ff5a6e;color:#fff;box-shadow:0 0 18px rgba(255,90,110,.6)}
.fsx[data-k=answer] .ivx-kind{background:#ff7bc8;color:#2a0018}
.ivx-bubble{position:relative;max-width:100%;padding:10px 14px;border-radius:14px;background:rgba(255,248,230,.95);color:#221506;
  font-size:13px;line-height:1.4;font-style:italic;opacity:0;transform:translateY(8px) scale(.96);transition:opacity .35s,transform .35s}
.ivx-bubble.on{opacity:1;transform:none}
.ivx-bubble.l{border-bottom-left-radius:3px}.ivx-bubble.r{border-bottom-right-radius:3px;background:rgba(255,226,242,.96)}
.ivx-heat{width:min(220px,90%);height:6px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.ivx-heat i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd66b,#ff5a6e);transition:width .6s}
.ivx-line{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:10px}
.ivx-tab{display:flex;align-items:center;gap:6px;padding:3px 10px 3px 3px;border-radius:99px;background:rgba(255,255,255,.05);
  font-size:11px;opacity:.5;transition:opacity .4s,box-shadow .4s}
.ivx-tab .fsx-face{width:24px;height:24px;box-shadow:none}
.ivx-tab.now{opacity:1;box-shadow:0 0 0 1px var(--fx)}
.ivx-tab.done{opacity:.85}
.ivx-tab.done::after{content:'✓';color:var(--fx);font-weight:700}

/* ══ THE CUT ══ */
.ctx-line{position:relative;display:flex;justify-content:center;align-items:flex-end;gap:clamp(8px,2vw,22px);flex-wrap:wrap;
  min-height:200px;margin-top:10px;padding-top:30px}
.ctx-q{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;width:clamp(84px,13vw,130px);
  transition:transform .6s cubic-bezier(.2,1.4,.4,1),filter .7s,opacity .7s}
.ctx-q::before{content:'';position:absolute;top:-30px;left:50%;width:150px;height:220px;transform:translateX(-50%);z-index:-1;
  background:linear-gradient(180deg,rgba(255,236,190,.3),transparent 80%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);
  opacity:.45;transition:opacity .6s,background .6s}
.ctx-q .fsx-face{width:clamp(70px,10vw,104px);height:clamp(70px,10vw,104px)}
.ctx-q b{font:400 17px/1 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.ctx-tag{min-width:70px;padding:4px 8px;border-radius:6px;text-align:center;font:400 13px/1 'Anton','Impact',sans-serif;letter-spacing:.1em;
  text-transform:uppercase;background:rgba(255,255,255,.06);color:transparent;transform:rotateX(90deg);transition:transform .45s cubic-bezier(.2,1.4,.4,1)}
.ctx-q.out .ctx-tag{transform:none;background:#3a0a14;color:#ff8fa3}
.ctx-q.safe .ctx-tag{transform:none;background:linear-gradient(90deg,#ffd66b,#fff1a8);color:#2a1a00}
.ctx-q.out{filter:grayscale(1) brightness(.4);transform:translateY(12px) scale(.88)}
.ctx-q.out::before{opacity:0}
.ctx-q.now.out{animation:ctx-drop .7s ease-in}
@keyframes ctx-drop{0%{filter:none;transform:none}30%{filter:brightness(1.8);transform:scale(1.05)}100%{filter:grayscale(1) brightness(.4);transform:translateY(12px) scale(.88)}}
.ctx-q.safe{transform:translateY(-10px) scale(1.1)}
.ctx-q.safe::before{opacity:1;background:linear-gradient(180deg,rgba(255,230,150,.6),transparent 80%)}
.ctx-q.safe .fsx-face{box-shadow:0 0 0 4px var(--fx),0 0 50px 12px rgba(255,214,107,.55)}
.fsx.any .ctx-q:not(.now):not(.out):not(.safe){filter:brightness(.6)}
.ctx-q.now:not(.out) .fsx-face{box-shadow:0 0 0 4px #fff1a8,0 0 40px 8px rgba(255,241,168,.45)}
.ctx-spot{position:absolute;top:0;bottom:0;left:50%;width:200px;margin-left:-100px;pointer-events:none;opacity:0;z-index:0;
  background:radial-gradient(40% 30% at 50% 80%,rgba(255,255,255,.28),transparent 70%),linear-gradient(180deg,rgba(255,255,255,.2),transparent 80%);
  clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);transition:left .7s cubic-bezier(.3,1.3,.5,1),opacity .4s}
.fsx[data-phase=hold] .ctx-spot{opacity:1;animation:ctx-hunt 1.6s ease-in-out infinite alternate}
@keyframes ctx-hunt{from{transform:translateX(calc(var(--hunt,120px) * -1))}to{transform:translateX(var(--hunt,120px))}}
.ctx-count{display:flex;justify-content:center;gap:8px;margin-top:10px}
.ctx-count i{width:12px;height:12px;border-radius:50%;background:#ffd66b;box-shadow:0 0 10px rgba(255,214,107,.7);transition:all .5s}
.ctx-count i.off{background:rgba(255,255,255,.1);box-shadow:none}
.ctx-count span{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#cdbfa8;margin-left:6px}

@media (max-width:640px){
  .clx-q .fsx-face{width:78px;height:78px}.clx-q::before{width:130px}.clx-crown{width:48px}
  .clx-bracket{gap:4px;margin-top:4px}.clx-box{padding:2px 6px;font-size:10px}.clx-box em{display:none}
  .clx-parts{gap:3px}.clx-parts span{padding:2px 6px;font-size:8.5px;letter-spacing:.08em}
  .clx-duel{min-height:0}.clx-q{padding-top:10px}
  .ctx-line{min-height:0;padding-top:14px}.ctx-q{width:72px}.ctx-q .fsx-face{width:58px;height:58px}.ctx-q b{font-size:12px}.ctx-q::before{width:90px;height:120px;top:-14px}
  .shx-perf .fsx-face{width:84px;height:84px}
  .ivx-set{grid-template-columns:1fr 1fr;}.ivx-mid{grid-column:1 / -1;order:3;padding-bottom:4px}
  .ivx-seat .fsx-face{width:70px;height:70px}
  .fsx-top .fsx-hlabel{display:none}.fsx-head{order:3;flex-basis:100%}
}
@media (prefers-reduced-motion: reduce){
  .fsx,.fsx *{animation:none!important;transition:none!important}
  .fsx-banner.show{opacity:0}
  .clx-q[class*=st-] .clx-stamp{opacity:1;transform:translate(-50%,-50%) rotate(-10deg)}
}
/* Last, so it wins over the base sizes above. */
@media (max-height: 999px){
  .fsx{padding:8px 12px 10px}
  .fsx-title{font-size:16px}.fsx-hface{width:28px;height:28px}
  .clx-duel{min-height:0}.clx-q{padding-top:12px;gap:4px}.clx-q .fsx-face{width:74px;height:74px}
  .clx-q::before{width:140px;height:190px;top:-12px}.clx-q b{font-size:14px}.clx-crown{width:48px}
  .clx-mid{padding-bottom:22px}.clx-vs{font-size:22px}.clx-stamp{font-size:18px;padding:3px 9px;border-width:3px}
  .clx-now{padding:4px 10px;margin-top:5px}.clx-song b{font-size:15px}.clx-parts{margin-top:5px}
  .shx-house{min-height:0}.shx-perf{padding:18px 8px 8px;gap:5px}.shx-perf .fsx-face{width:76px;height:76px}
  .shx-arc{width:120px;height:66px}.shx-slot .fsx-face{width:30px;height:30px}.shx-board{margin-top:6px}
  .ivx-set{min-height:0;padding:10px 8px 6px}.ivx-seat .fsx-face{width:66px;height:66px}.ivx-chair{height:22px}
  .ivx-bubble{font-size:12px;padding:7px 10px}.ivx-mid{padding-bottom:14px}
  .fsx-qframe{flex-basis:80px;width:80px;height:80px}.fsx-qbody q{font-size:14px}
  .fsx-banner b{font-size:clamp(24px,4vw,40px)}
  .ctx-line{min-height:0;padding-top:16px}.ctx-q .fsx-face{width:66px;height:66px}.ctx-q::before{height:150px;top:-16px}
  .fsx-cards .dr-step{scroll-margin-top:360px}
}
`;

const CROWN_SVG = uid => `<svg class="clx-crown" viewBox="0 0 64 42" aria-hidden="true">
  <defs><linearGradient id="clxg${uid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFF3CF"/><stop offset="1" stop-color="#D8990F"/></linearGradient></defs>
  <path d="M4 34 L2 7 L18 20 L32 2 L46 20 L62 7 L60 34 Z" fill="url(#clxg${uid})" stroke="#7A4E00" stroke-width="1.2" stroke-linejoin="round"/>
  <rect x="3" y="33" width="58" height="7" rx="1.5" fill="url(#clxg${uid})" stroke="#7A4E00" stroke-width="1.2"/>
  <circle cx="32" cy="12" r="3.4" fill="#FF3D9A"/><circle cx="12" cy="18" r="2.3" fill="#38bdf8"/><circle cx="52" cy="18" r="2.3" fill="#38bdf8"/>
</svg>`;

const NOTE_SVG = `<svg class="clx-note" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#ffd66b"/>
  <path d="M13 22.5a3 3 0 11-2-2.8V9l10-2v11.5a3 3 0 11-2-2.8V10.4l-6 1.2z" fill="#2a1a00"/></svg>`;

const CHAIR_SVG = `<svg class="ivx-chair" viewBox="0 0 110 34" aria-hidden="true">
  <rect x="8" y="4" width="94" height="14" rx="7" fill="#6b1d3b"/><rect x="14" y="16" width="82" height="6" rx="3" fill="#4a1229"/>
  <rect x="20" y="22" width="5" height="12" fill="#2a0a17"/><rect x="85" y="22" width="5" height="12" fill="#2a0a17"/></svg>`;

export function confetti(n = 38, seed = 29) {
  const cols = ['#ffd66b', '#fff1a8', '#ff7bc8', '#ffffff', '#38bdf8'];
  return spread(n, seed).map((p, i) => {
    const ang = -Math.PI / 2 + (p.a - 0.5) * Math.PI * 1.7;
    const dist = 110 + p.b * 260;
    return `<i style="--x:${Math.round(Math.cos(ang) * dist)}px;--y:${Math.round(Math.sin(ang) * dist + 140 * p.d)}px;`
      + `--r:${Math.round((p.c - 0.5) * 900)}deg;--t:${(1.1 + p.d * 0.9).toFixed(2)}s;--dl:${(p.c * 0.2).toFixed(2)}s;`
      + `--w:${8 + Math.round(p.d * 8)}px;--c:${cols[i % cols.length]}"></i>`;
  }).join('');
}

export const face = (name, ep, size) => `<span class="fsx-face">${name ? _portrait(name, ep, { size }) : ''}</span>`;

/** A queen (or the host) to camera, drawn over a greyed stage. */
export function quoteHtml({ name, ep, label, text, host = null, guest = null }) {
  const pic = guest ? _portrait(guest.name, ep, { slug: guest.slug, size: 130 })
    : host ? _judgePortrait(host, { stage: true, size: 130 }) : name ? _portrait(name, ep, { size: 130 }) : '';
  return `<span class="fsx-qframe">${pic}</span>
    <div class="fsx-qbody"><small>${esc(label)}</small><q>${esc(trim(text, 210))}</q></div>`;
}

/** The frame every finale stage shares: background, header, overlays. */
export function shell({ id, title, sub, body, host = 'rupaul', hostLabel = 'The host', mood = '', theme = '', hostChip = true }) {
  return `<!--dr-chrome--><div class="fsx${theme ? ` th-${theme}` : ''}" id="${id}" data-phase="idle" data-mood="${mood}">
    <div class="fsx-bg"><i class="fsx-rays"></i><i class="fsx-haze"></i><i class="fsx-wash"></i><i class="fsx-vig"></i></div>
    <div class="fsx-top">
      <div class="fsx-title">${esc(title)}<small data-sub>${esc(sub)}</small></div>
      <div class="fsx-head"><span data-hd></span></div>
      ${hostChip ? `<div class="fsx-host" data-host><span class="fsx-hface">${_judgePortrait(host, { stage: theme !== 'werk', size: 36 })}</span><span class="fsx-hlabel">${esc(hostLabel)}</span></div>` : ''}
    </div>
    <div class="fsx-body">${body}</div>
    <div class="fsx-banner"><b data-bn></b><small data-bs></small></div>
    <div class="fsx-burst">${confetti()}</div>
    <div class="fsx-stars">${confetti(22, 41)}</div>
    <div class="fsx-quote" data-quote></div>
  </div><!--/dr-chrome-->`;
}

/**
 * The part of `apply` every stage shares. `paint(el, st, fresh)` does the
 * stage's own objects. A state may carry: phase, mood, hostOn, banner
 * {text, sub, red}, burst, stars, shake, quote (html).
 */
export function engine(id, states, paint) {
  let prev = -99;
  let timer = null;
  return idx => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (!el) return;
    const st = idx < 0 ? null : states[Math.min(idx, states.length - 1)];
    const fresh = idx === prev + 1;
    prev = idx;
    clearTimeout(timer);
    el.classList.remove('burst', 'shake', 'stars');
    const bn = el.querySelector('.fsx-banner');
    bn.classList.remove('show', 'red');
    const hd = el.querySelector('[data-hd]');
    hd.classList.remove('on', 'red');
    el.dataset.phase = st ? st.phase : 'idle';
    el.dataset.mood = st?.mood || '';
    el.querySelector('[data-host]')?.classList.toggle('on', !!st?.hostOn);
    const q = el.querySelector('[data-quote]');
    if (q) q.innerHTML = st?.quote || '';
    paint(el, st, fresh);
    if (!st) return;
    if (st.banner) {
      el.querySelector('[data-bn]').textContent = st.banner.text;
      el.querySelector('[data-bs]').textContent = st.banner.sub || '';
      bn.classList.toggle('red', !!st.banner.red);
      hd.innerHTML = `${esc(st.banner.text)}${st.banner.sub ? `<small>${esc(st.banner.sub)}</small>` : ''}`;
      hd.classList.toggle('red', !!st.banner.red);
      hd.classList.add('on');
      if (fresh) { void el.offsetWidth; bn.classList.add('show'); }
    }
    if (fresh) {
      if (st.burst) el.classList.add('burst');
      if (st.stars) el.classList.add('stars');
      if (st.shake) el.classList.add('shake');
      timer = setTimeout(() => el.classList.remove('burst', 'shake', 'stars'), 2400);
    }
  };
}

// ══════════════════════════════════════════════════════════════════════
//  THE LIP SYNC FOR THE CROWN
// ══════════════════════════════════════════════════════════════════════

const HOOK = { 'key-change': 'Key change', 'dance-break': 'Dance break', breakdown: 'The breakdown', spoken: 'Spoken word' };

/**
 * `list` is the screen's steps, in order:
 *   { t: 'setup', text }            the host names the stakes
 *   { t: 'talk', r, who, text }     the host to one queen before round r
 *   { t: 'beat', r, who, tier }     her performance
 *   { t: 'hook', r, who, tier, hook } the big moment
 *   { t: 'verdict', r }             round r is decided
 * `rounds` is `finale.rounds` (or the duels), `r` indexes it.
 */
export function crownLipsyncStage(row, list, rounds, { ep, uid = 'x' } = {}) {
  const n = rounds.length;
  const label = i => (n === 1 ? 'The final' : i === n - 1 ? 'The final' : n === 2 ? 'The semi-final' : `Semi-final ${i + 1}`);
  const hookOf = i => HOOK[list.find(s => s.t === 'hook' && s.r === i)?.hook] || null;
  const tempoOf = i => list.find(s => s.t === 'beat' && s.r === i)?.tempo || '';
  const partsOf = i => ['Verse', 'Chorus', hookOf(i) || 'Bridge', 'Ending'];
  const lastRound = n - 1;

  const shown = new Set();
  const decided = new Set();
  const heard = {};
  const states = list.map(s => {
    const r = clamp(Number.isInteger(s.r) ? s.r : 0, 0, Math.max(0, n - 1));
    const d = rounds[r] || {};
    shown.add(r);
    const st = { r, phase: 'song', on: null, talk: null, mood: null, k: 0, stamps: {}, banner: null, hostOn: false };
    heard[r] ||= {};
    if (s.t === 'setup') {
      st.phase = 'intro';
      st.hostOn = true;
      st.banner = { text: 'Lip sync for the crown', sub: n > 1 ? `${n} lip syncs tonight` : 'one song, one crown' };
    } else if (s.t === 'talk') {
      st.phase = 'talk';
      st.talk = s.who;
      st.hostOn = true;
    } else if (s.t === 'beat' || s.t === 'hook') {
      heard[r][s.who] = (heard[r][s.who] || 0) + (s.t === 'beat' ? 2 : 1);
      st.on = s.who;
      if (s.t === 'hook') {
        const good = s.tier === 'nailed';
        st.mood = good ? 'gold' : 'red';
        st.good = good;
        st.banner = { text: hookOf(r) || 'The big moment', sub: `${s.who} ${good ? 'owns it' : 'misses it'}`, red: !good };
        st.stars = good;
        st.shake = !good;
      }
    } else if (s.t === 'verdict') {
      decided.add(r);
      st.phase = 'verdict';
      st.mood = 'gold';
      const final = r === lastRound;
      st.stamps = { [d.winner]: 'win', [d.loser || (d.a === d.winner ? d.b : d.a)]: 'out' };
      st.banner = { text: d.winner || '', sub: final ? 'wins the lip sync for the crown' : 'goes through to the final' };
      st.burst = final;
      st.stars = !final;
    }
    st.k = st.phase === 'verdict' ? 4 : Math.min(4, Math.max(0, ...Object.values(heard[r]), 0));
    st.heard = { ...heard[r] };
    st.shown = [...shown];
    st.decided = [...decided];
    return st;
  });

  const eq = Array.from({ length: 12 }, (_, i) => `<i style="--dl:${(i * 0.07).toFixed(2)}s"></i>`).join('');
  const bracket = n > 1 ? `<div class="clx-bracket">${rounds.map((d, i) => `<div class="clx-box" data-box="${i}">
      <em>${esc(label(i))}</em><span data-ba>?</span><span>vs</span><span data-bb>?</span></div>`).join('')}</div>` : '';
  const fighter = q => `<div class="clx-q" data-q="${esc(q)}">
        ${face(q, ep, 118)}
        <b>${esc(q)}</b>
        <div class="clx-meter"><i data-m style="width:50%"></i></div>
        <span class="clx-score" data-s></span>
        <span class="clx-stamp" data-st></span>
      </div>`;
  const duels = rounds.map((d, i) => `<div class="clx-duel" data-r="${i}">
      ${fighter(d.a)}
      <div class="clx-mid">${CROWN_SVG(`${uid}${i}`)}<span class="clx-vs">VS</span></div>
      ${fighter(d.b)}
    </div>`).join('');
  const body = `${bracket}
    <div class="clx-now">${NOTE_SVG}
      <div class="clx-song"><small data-rl>${esc(label(0))}</small><b data-song>${esc(rounds[0]?.song || '')}</b>
        <small data-artist style="color:#c9b08a">${esc(rounds[0]?.artist || '')}</small></div>
      <div class="clx-eq">${eq}</div>
    </div>
    <div class="clx-parts" data-parts>${partsOf(0).map((p, i) => `<span class="${i === 2 && hookOf(0) ? 'big' : ''}">${esc(p)}</span>`).join('')}</div>
    ${duels}
    <div class="clx-tug"><i data-tug></i></div>`;
  const html = shell({ id: `clx-${uid}`, title: 'For the crown', sub: n > 1 ? 'the bracket' : 'the last lip sync', body });

  const apply = engine(`clx-${uid}`, states, (el, st) => {
    const r = st ? st.r : 0;
    const d = rounds[r] || {};
    el.classList.toggle('any', !!(st && (st.on || st.talk)));
    el.querySelector('[data-rl]').textContent = label(r);
    el.querySelector('[data-song]').textContent = d.song || '';
    el.querySelector('[data-artist]').textContent = d.artist || '';
    const parts = el.querySelector('[data-parts]');
    if (parts.dataset.r !== String(r)) {
      parts.dataset.r = String(r);
      parts.innerHTML = partsOf(r).map((p, i) => `<span class="${i === 2 && hookOf(r) ? 'big' : ''}">${esc(p)}</span>`).join('');
    }
    parts.querySelectorAll('span').forEach((p, i) => p.classList.toggle('on', !!st && i < st.k));
    // The bracket: a pairing is shown once its round has started, a result once it is read.
    el.querySelectorAll('[data-box]').forEach(b => {
      const i = Number(b.dataset.box);
      const rd = rounds[i];
      const open = !!st && st.shown.includes(i);
      const done = !!st && st.decided.includes(i);
      b.classList.toggle('now', !!st && i === r);
      const sa = b.querySelector('[data-ba]');
      const sb = b.querySelector('[data-bb]');
      sa.textContent = open ? rd.a : '?';
      sb.textContent = open ? rd.b : '?';
      sa.className = done ? (rd.winner === rd.a ? 'w' : 'l') : '';
      sb.className = done ? (rd.winner === rd.b ? 'w' : 'l') : '';
    });
    el.querySelectorAll('.clx-duel').forEach(du => {
      const i = Number(du.dataset.r);
      du.classList.toggle('cur', i === r);
      du.classList.remove('to-a', 'to-b');
      const rd = rounds[i];
      if (i !== r) return;
      const done = !!st && st.phase === 'verdict';
      const final = done && r === lastRound;
      if (final) du.classList.add(rd.winner === rd.a ? 'to-a' : 'to-b');
      const qs = [...du.querySelectorAll('.clx-q')];
      if (qs.length === 2) du.style.setProperty('--hop', `${Math.round((qs[1].offsetLeft - qs[0].offsetLeft) / 2) || 140}px`);
      for (const q of qs) {
        const nm = q.dataset.q;
        q.classList.toggle('on', !!st && st.on === nm);
        q.classList.toggle('talk', !!st && st.talk === nm);
        q.classList.toggle('good', !!st && st.on === nm && st.good === true);
        q.classList.toggle('bad', !!st && st.on === nm && st.good === false);
        q.classList.remove('st-win', 'st-out');
        const stamp = done ? st.stamps[nm] : null;
        if (stamp) q.classList.add(`st-${stamp}`);
        q.querySelector('[data-st]').textContent = stamp === 'win' ? (r === lastRound ? 'Winner' : 'Through') : stamp === 'out' ? (r === lastRound ? 'Runner-up' : 'Out') : '';
        const parts4 = (rd.beats?.[nm] || []).map(x => Number(x.delta) || 0);
        const k = st ? Math.min(4, st.heard[nm] || 0) : 0;
        const sum = parts4.slice(0, k).reduce((t, v) => t + v, 0);
        const score = Number(rd.scores?.[nm]) || 0;
        q.querySelector('[data-m]').style.width = `${done ? clamp(score * 10, 6, 100) : clamp(50 + (sum / 1.3) * 50, 6, 94)}%`;
        q.querySelector('[data-s]').textContent = done ? score.toFixed(1) : '';
      }
      const tug = el.querySelector('[data-tug]');
      const sa = Number(rd.scores?.[rd.a]) || 0;
      const sb = Number(rd.scores?.[rd.b]) || 0;
      const part = nm => (rd.beats?.[nm] || []).slice(0, st ? Math.min(4, st.heard[nm] || 0) : 0).reduce((t, x) => t + (Number(x.delta) || 0), 0);
      tug.style.left = `${done ? clamp(50 + (sb - sa) * 6, 6, 94) : clamp(50 + (part(rd.b) - part(rd.a)) * 34, 6, 94)}%`;
    });
  });
  return { html, apply, states };
}

// ══════════════════════════════════════════════════════════════════════
//  THE SHOWCASE
// ══════════════════════════════════════════════════════════════════════

const TIER = {
  killed: { label: 'The number of her life', color: '#ffd66b' },
  strong: { label: 'Strong', color: '#ff7bc8' },
  shaky: { label: 'Shaky', color: '#9aa0b4' },
};

/** `list`: { t: 'open', text } then { t: 'perf', who, tier, perf, text } per queen. */
export function showcaseStage(row, list, { ep, finalists = [], uid = 'x' } = {}) {
  const perfs = list.filter(s => s.t === 'perf');
  const done = [];
  const states = list.map(s => {
    if (s.t === 'open') return { phase: 'intro', hostOn: true, open: false, cur: null, done: [], banner: { text: 'The showcase', sub: 'an original number each' } };
    done.push(s.who);
    const tier = TIER[s.tier] ? s.tier : 'strong';
    return {
      phase: 'perf', open: true, cur: s.who, done: [...done],
      mood: tier === 'killed' ? 'gold' : tier === 'shaky' ? 'red' : 'cool',
      banner: tier === 'killed' ? { text: 'The number of her life', sub: s.who }
        : tier === 'shaky' ? { text: 'It wobbles', sub: s.who, red: true } : { text: 'She delivers', sub: s.who },
      burst: tier === 'killed', shake: tier === 'shaky', stars: tier === 'strong',
    };
  });
  const arc = (pct, color) => {
    const len = Math.PI * 70;
    return `<svg class="shx-arc" viewBox="0 0 170 92"><path class="bg" d="M15,85 A70,70 0 0,1 155,85"/>
      <path class="fg" d="M15,85 A70,70 0 0,1 155,85" stroke="${color}" stroke-dasharray="${len.toFixed(1)}"
        stroke-dashoffset="${len.toFixed(1)}" data-off="${(len * (1 - pct)).toFixed(1)}"/>
      <text x="85" y="82" text-anchor="middle">${(pct * 10).toFixed(1)}</text></svg>`;
  };
  const stageQueens = perfs.map(s => {
    const t = TIER[s.tier] || TIER.strong;
    const pct = clamp((Number(s.perf) || 0) / 10, 0.04, 1);
    return `<div class="shx-perf" data-q="${esc(s.who)}">
      ${face(s.who, ep, 120)}<b>${esc(s.who)}</b>${arc(pct, t.color)}
      <span class="shx-tier" style="color:${t.color}">${esc(t.label)}</span></div>`;
  }).join('');
  const board = (finalists.length ? finalists : perfs.map(s => s.who)).map(q => {
    const p = perfs.find(s => s.who === q);
    const t = TIER[p?.tier] || TIER.strong;
    return `<div class="shx-slot" data-slot="${esc(q)}" style="--tc:${t.color}">${face(q, ep, 40)}<b>${esc(q)}</b>
      <div class="bar"><i data-w="${p ? clamp((Number(p.perf) || 0) * 10, 4, 100).toFixed(0) : 0}"></i></div></div>`;
  }).join('');
  const bulbs = Array.from({ length: 22 }, (_, i) => `<i style="--dl:${(i % 2) * 0.5}s"></i>`).join('');
  const body = `<div class="shx-house"><div class="shx-bulbs">${bulbs}</div>
      <div class="shx-curtain l"></div><div class="shx-curtain r"></div>${stageQueens}</div>
    <div class="shx-board">${board}</div>`;
  const html = shell({ id: `shx-${uid}`, title: 'The showcase', sub: 'original numbers', body });
  const apply = engine(`shx-${uid}`, states, (el, st) => {
    el.dataset.open = st?.open ? '1' : '0';
    el.querySelectorAll('.shx-perf').forEach(p => {
      const cur = !!st && st.cur === p.dataset.q;
      if (cur && !p.classList.contains('cur')) {
        p.classList.add('cur');
        const fg = p.querySelector('.fg');
        if (fg) { fg.style.strokeDashoffset = fg.getAttribute('stroke-dasharray'); void fg.getBoundingClientRect(); fg.style.strokeDashoffset = fg.dataset.off; }
      } else if (!cur) p.classList.remove('cur');
    });
    el.querySelectorAll('[data-slot]').forEach(s => {
      const q = s.dataset.slot;
      const isDone = !!st && st.done.includes(q);
      s.classList.toggle('done', isDone);
      s.classList.toggle('now', !!st && st.cur === q);
      const bar = s.querySelector('[data-w]');
      bar.style.width = isDone ? `${bar.dataset.w}%` : '0';
    });
  });
  return { html, apply, states };
}

// ══════════════════════════════════════════════════════════════════════
//  THE INTERVIEW
// ══════════════════════════════════════════════════════════════════════

const KIND = { ask: 'The question', answer: 'Her answer', follow: 'The follow-up', close: 'Her last word', single: 'One on one' };

/** `list`: { t: 'ask'|'answer'|'follow'|'close'|'single', who, text }. */
export function interviewStage(row, list, { ep, finalists = [], uid = 'x' } = {}) {
  const order = [];
  for (const s of list) if (s.who && !order.includes(s.who)) order.push(s.who);
  const heat = {};
  const states = list.map((s, i) => {
    if (!order.includes(s.who)) order.push(s.who);
    heat[s.who] = (heat[s.who] || 0) + (s.t === 'follow' ? 45 : s.t === 'ask' ? 25 : s.t === 'answer' ? 10 : 0);
    const later = list.slice(i + 1).some(x => x.who === s.who);
    const hostTalks = s.t === 'ask' || s.t === 'follow';
    return {
      phase: 'talk', k: s.t, cur: s.who, hostOn: hostTalks,
      speaker: hostTalks ? 'host' : 'queen', text: trim(s.text, 150),
      heat: clamp(heat[s.who], 0, 100),
      done: order.slice(0, order.indexOf(s.who)).concat(later ? [] : [s.who]),
      mood: s.t === 'follow' ? 'red' : '',
      banner: s.t === 'follow' ? { text: 'Follow-up', sub: `the heat is on ${s.who}`, red: true }
        : !list.slice(0, i).some(x => x.who === s.who)
          ? { text: s.who, sub: 'takes the hot seat' } : null,
      shake: s.t === 'follow',
    };
  });
  const queens = (finalists.length ? finalists : order);
  const seats = queens.map(q => `<div class="ivx-seat ivx-q" data-q="${esc(q)}">${face(q, ep, 104)}<b>${esc(q)}</b>${CHAIR_SVG}</div>`).join('');
  const body = `<div class="ivx-set">
      <div class="ivx-seat" data-michelle><span class="fsx-face">${_judgePortrait('michelle', { stage: true, size: 104 })}</span><b>Michelle</b>${CHAIR_SVG}</div>
      <div class="ivx-mid"><span class="ivx-kind" data-kind>One on one</span>
        <div class="ivx-bubble" data-bubble></div>
        <div class="ivx-heat" title="pressure"><i data-heat></i></div></div>
      <div class="ivx-guest">${seats}</div>
    </div>
    <div class="ivx-line">${queens.map(q => `<span class="ivx-tab" data-tab="${esc(q)}">${face(q, ep, 24)}${esc(q)}</span>`).join('')}</div>`;
  const html = shell({ id: `ivx-${uid}`, title: 'One on one', sub: 'why should it be you', body, host: 'michelle', hostLabel: 'Michelle' });
  const apply = engine(`ivx-${uid}`, states, (el, st) => {
    el.dataset.k = st?.k || '';
    el.querySelector('[data-kind]').textContent = st ? KIND[st.k] || 'One on one' : 'One on one';
    const bub = el.querySelector('[data-bubble]');
    bub.textContent = st?.text ? `"${st.text.replace(/^"|"$/g, '')}"` : '';
    bub.className = `ivx-bubble${st?.text ? ' on' : ''} ${st?.speaker === 'host' ? 'l' : 'r'}`;
    el.querySelector('[data-heat]').style.width = `${st?.heat || 0}%`;
    const mich = el.querySelector('[data-michelle]');
    mich.classList.toggle('lit', st?.speaker === 'host');
    mich.classList.toggle('dim', !!st && st.speaker !== 'host');
    el.querySelectorAll('.ivx-q').forEach(s => {
      const cur = !!st && st.cur === s.dataset.q;
      s.classList.toggle('cur', cur);
      s.classList.toggle('lit', cur && st.speaker === 'queen');
      s.classList.toggle('dim', cur && st.speaker !== 'queen');
    });
    el.querySelectorAll('[data-tab]').forEach(t => {
      t.classList.toggle('now', !!st && st.cur === t.dataset.tab);
      t.classList.toggle('done', !!st && st.done.includes(t.dataset.tab) && st.cur !== t.dataset.tab);
    });
  });
  return { html, apply, states };
}

/** Wire a stage to a screen's reveal: the hook, and a repaint after a re-render. */
export function wireStage(suffix, stage, ep, stateOf) {
  if (typeof window === 'undefined') return;
  window._drRevealExtra = window._drRevealExtra || {};
  window._drRevealExtra[suffix] = idx => stage.apply(idx);
  setTimeout(() => {
    try { const { idx } = stateOf(ep, suffix); if (idx >= 0) stage.apply(idx); } catch { /* decoration */ }
  }, 0);
}

/** One card under a finale stage. `who` is a queen, or `host` a judge id. */
export function finaleCard({ id, ep, who = null, host = null, tag = '', text = '', cls = '' }) {
  const pic = host ? _judgePortrait(host, { stage: true, size: 44 }) : who ? _portrait(who, ep, { size: 48, station: true }) : '';
  return `<div class="dr-step" id="${id}"><div class="fsx-card ${host ? 'host' : 'q'} ${cls}">
    ${pic}<div>${tag ? `<span class="fsx-ctag">${esc(tag)}</span>` : ''}<p>${esc(text)}</p></div></div></div>`;
}

// ══════════════════════════════════════════════════════════════════════
//  THE CUT
// ══════════════════════════════════════════════════════════════════════

/**
 * `list`: { t: 'suspense'|'cut', text } from the host, then per queen cut
 * { t: 'react', who, text } and maybe { t: 'last', who, text }.
 * `cut` is who the host cuts; `line` is the finalists, alphabetical.
 */
export function cutStage(row, list, { ep, line = [], cut = [], uid = 'x' } = {}) {
  const gone = [];
  const survivors = line.filter(q => !cut.includes(q));
  const states = list.map(s => {
    const st = { phase: 'cer', now: null, hostOn: false, banner: null, quote: '', shake: false, burst: false };
    if (s.t === 'suspense') { st.phase = 'hold'; st.hostOn = true; }
    else if (s.t === 'cut') {
      st.phase = 'hold';
      st.hostOn = true;
      st.banner = { text: `Top ${survivors.length}`, sub: 'the host is about to cut', red: true };
    } else if (s.t === 'react') {
      if (!gone.includes(s.who)) gone.push(s.who);
      st.now = s.who;
      st.mood = 'red';
      st.shake = true;
      st.banner = { text: 'Cut', sub: s.who, red: true };
    } else if (s.t === 'last') {
      st.phase = 'quote';
      st.quote = quoteHtml({ name: s.who, ep, label: `${s.who} · her last words`, text: s.text });
    }
    const allGone = cut.length && cut.every(q => gone.includes(q));
    st.gone = [...gone];
    st.safe = allGone ? [...survivors] : [];
    // The last cut is also the moment the final two are known.
    if (allGone && s.t === 'react' && gone[gone.length - 1] === s.who) {
      st.banner = { text: `The final ${survivors.length === 2 ? 'two' : survivors.length}`, sub: survivors.join(' & ') };
      st.mood = 'gold';
      st.burst = true;
    }
    return st;
  });
  const plates = line.map(q => `<div class="ctx-q" data-q="${esc(q)}">${face(q, ep, 104)}<b>${esc(q)}</b>
    <span class="ctx-tag" data-t></span></div>`).join('');
  const body = `<i class="ctx-spot"></i><div class="ctx-line">${plates}</div>
    <div class="ctx-count">${line.map(() => '<i></i>').join('')}<span data-left>${esc(line.length)} still standing</span></div>`;
  const html = shell({ id: `ctx-${uid}`, title: 'The cut', sub: 'the field becomes two', body });
  const apply = engine(`ctx-${uid}`, states, (el, st) => {
    const gone = st?.gone || [];
    const safe = st?.safe || [];
    el.classList.toggle('any', !!st?.now);
    for (const q of el.querySelectorAll('.ctx-q')) {
      const nm = q.dataset.q;
      q.classList.toggle('out', gone.includes(nm));
      q.classList.toggle('safe', safe.includes(nm));
      q.classList.toggle('now', !!st && st.now === nm);
      q.querySelector('[data-t]').textContent = gone.includes(nm) ? 'Cut' : safe.includes(nm) ? 'For the crown' : '';
    }
    const left = line.length - gone.length;
    el.querySelectorAll('.ctx-count i').forEach((d, i) => d.classList.toggle('off', i >= left));
    el.querySelector('[data-left]').textContent = `${left} still standing`;
    // The spotlight hunts along the queens not yet cut.
    const standing = [...el.querySelectorAll('.ctx-q:not(.out)')];
    if (standing.length) {
      const body = el.querySelector('.ctx-line');
      const xs = standing.map(q => q.offsetLeft + q.offsetWidth / 2);
      const spot = el.querySelector('.ctx-spot');
      spot.style.left = `${body.offsetLeft + (Math.min(...xs) + Math.max(...xs)) / 2}px`;
      el.style.setProperty('--hunt', `${Math.max(20, (Math.max(...xs) - Math.min(...xs)) / 2)}px`);
    }
  });
  return { html, apply, states };
}

// ══════════════════════════════════════════════════════════════════════
//  THE FINALE OPENS
// ══════════════════════════════════════════════════════════════════════

/** `list`: { who } per card (null for the host). */
export function finaleOpenStage(row, list, { ep, finalists = [], shape = '', uid = 'x' } = {}) {
  const states = list.map((s, i) => ({
    phase: 'open', on: s.who, hostOn: !s.who,
    banner: i === 0 ? { text: 'Grand finale', sub: `${finalists.length} queens, one crown` } : null,
    burst: i === 0, mood: 'gold',
  }));
  const body = `<div class="fox-line">${finalists.map((q, j) => `<div class="fox-q" data-q="${esc(q)}" style="--dl:${(j * 0.18).toFixed(2)}s">${face(q, ep, 96)}<b>${esc(q)}</b></div>`).join(' ')}</div>
    ${shape ? `<div class="fox-shape">${esc(shape)}</div>` : ''}`;
  const html = shell({ id: `fox-${uid}`, title: 'Grand finale', sub: 'one of them is crowned tonight', body });
  const apply = engine(`fox-${uid}`, states, (el, st) => {
    el.classList.toggle('lit', !!st);
    el.classList.toggle('any', !!st?.on);
    for (const q of el.querySelectorAll('.fox-q')) q.classList.toggle('on', !!st && st.on === q.dataset.q);
  });
  return { html, apply, states };
}
