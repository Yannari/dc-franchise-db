// ══════════════════════════════════════════════════════════════════════
// vp-pm/style.js — the villa's viewing party, both themes (Plan 5)
// ══════════════════════════════════════════════════════════════════════
//
// Ported from mockup/mockup-pm-vp-v2.html (approved), with every class and
// every keyframe prefixed `pmv-`: the viewing-party page already has its own
// .card, .stage and @keyframes pop, and an unprefixed port restyles them.
// The theme is the screen's own attribute (data-pmtheme), following the site
// until the viewer picks one. Light only, no drawn scenery (the user's
// verdict on mockup v1): sky, bloom, bokeh, embers, beams, and the neon.
export const PMV_FONTS = "@import url('https://fonts.googleapis.com/css2?family=Yellowtail&family=Outfit:wght@300;400;600;800&family=Bebas+Neue&display=swap');";
export const PMV_CSS = `/* ══════════════════════════════════════════════════════════════════════
   PERFECT MATCH — viewing party, v2 (visual-novel stage)
   The stage plays like the dating game it is: busts that slide in, a
   dialogue box that types, a camera that pushes in on whoever is talking
   with everyone else out of focus, heart-iris wipes between rooms, pops
   for every feeling that moved, toasts for the big moments.
   Scenery is LIGHT, not drawings: sky, bloom, haze, bokeh, leaf shadow,
   embers, beams. Neon script is the only "object".
   ══════════════════════════════════════════════════════════════════════ */
.pmv{
  --pink:#ff2e88; --hot:#ff4fa0; --coral:#ff7a59; --sun:#ffc15e; --lav:#a78bfa; --teal:#14c8bb;
  --bg:#fff4f8; --bg2:#ffe7f1; --card:#ffffff; --card2:#fff9fb; --ink:#2b1026; --muted:#8a6b80; --line:#f4d6e4;
  --glass:rgba(255,255,255,.78); --glassInk:#2b1026; --glassLine:rgba(255,255,255,.9); --shadow:0 18px 40px rgba(160,40,100,.18);
}
.pmv[data-pmtheme="dark"]{
  --bg:#12081a; --bg2:#1b0d25; --card:#1f1029; --card2:#261433; --ink:#fbe8f3; --muted:#b596ab; --line:#3a2244;
  --glass:rgba(24,10,34,.72); --glassInk:#fbe8f3; --glassLine:rgba(255,120,190,.35); --shadow:0 18px 40px rgba(0,0,0,.5);
}
@media (prefers-color-scheme: dark){
  .pmv:not([data-pmtheme="light"]){
    --bg:#12081a; --bg2:#1b0d25; --card:#1f1029; --card2:#261433; --ink:#fbe8f3; --muted:#b596ab; --line:#3a2244;
    --glass:rgba(24,10,34,.72); --glassInk:#fbe8f3; --glassLine:rgba(255,120,190,.35); --shadow:0 18px 40px rgba(0,0,0,.5);
  }
}
.pmv-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start}
@media (max-width:960px){.pmv-layout{grid-template-columns:minmax(0,1fr)}}

/* ── STAGE ─────────────────────────────────────────────────────────── */
.pmv-stage{position:sticky;top:8px;z-index:5;contain:inline-size;min-width:0;max-width:100%;aspect-ratio:16/9.2;width:min(100%, calc(42vh * 16 / 9.2));margin:0 auto;
  border-radius:24px;overflow:hidden;isolation:isolate;box-shadow:var(--shadow),0 0 0 1px #ffffff22 inset;background:#000;user-select:none}
.pmv-cam{position:absolute;inset:0;transition:transform 1.1s cubic-bezier(.2,.8,.2,1);transform-origin:var(--ox,50%) 70%}
.pmv-cam.pmv-close{transform:scale(1.14)}
.pmv-scene{position:absolute;inset:-4%;transition:opacity .6s}

/* scenes are light, not drawings */
.pmv-sc-day{background:
  radial-gradient(40% 55% at 72% 34%,#fff8dccc,#ffd89a66 40%,#0000 70%),
  linear-gradient(180deg,#ff9fb0 0%,#ffb99a 32%,#ffd6a8 52%,#9fe6ee 53%,#56c4df 70%,#2c8fc4 100%)}
.pmv-sc-terrace{background:
  radial-gradient(60% 50% at 30% 20%,#ffb3d966,#0000 70%),
  linear-gradient(180deg,#4d1d66 0%,#b1407e 45%,#ff8a7a 75%,#ffc39a 100%)}
.pmv-sc-night{background:
  radial-gradient(55% 45% at 50% 100%,#ff7a3a99,#ff2e8833 45%,#0000 70%),
  linear-gradient(180deg,#0c0620 0%,#26103f 50%,#4a1747 100%)}
.pmv-sc-hut{background:
  radial-gradient(45% 60% at 50% 40%,#ffe6b8,#e0a45c 45%,#6a3a15 100%)}
.pmv-sc-casa{background:
  radial-gradient(50% 60% at 75% 30%,#14c8bb55,#0000 70%),radial-gradient(40% 50% at 20% 70%,#a78bfa55,#0000 70%),
  linear-gradient(180deg,#07142c,#132a52 60%,#1b0f3a)}
.pmv-sc-final{background:
  radial-gradient(60% 60% at 50% 110%,#ff2e8899,#0000 70%),linear-gradient(180deg,#1a0624,#4b0f45 60%,#8a1e5c)}
.pmv-stage .pmv-sun{position:absolute;left:66%;top:18%;width:16%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fffbe9,#ffe2a1 45%,#ffc86b00 70%);filter:blur(2px);animation:pmv-bloom 6s ease-in-out infinite}
@keyframes pmv-bloom{50%{transform:scale(1.08);opacity:.85}}
.pmv-stage .pmv-shimmer{position:absolute;left:0;right:0;top:53%;bottom:0;background:repeating-linear-gradient(180deg,#ffffff00 0 9px,#ffffff33 9px 10px);
  mask:linear-gradient(180deg,#000,#0000);animation:pmv-shim 5s linear infinite;opacity:.6}
@keyframes pmv-shim{to{background-position:0 40px}}
.pmv-stage .pmv-gobo{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;opacity:.32;filter:blur(6px);
  background:
   radial-gradient(18% 5% at 12% 18%,#2b1026 60%,#0000 61%),radial-gradient(22% 5% at 20% 10%,#2b1026 60%,#0000 61%),
   radial-gradient(16% 4% at 6% 30%,#2b1026 60%,#0000 61%),radial-gradient(20% 5% at 90% 12%,#2b1026 60%,#0000 61%),
   radial-gradient(15% 4% at 96% 26%,#2b1026 60%,#0000 61%);
  transform-origin:10% 0;animation:pmv-sway 7s ease-in-out infinite}
@keyframes pmv-sway{50%{transform:rotate(2.2deg) translateX(1%)}}
.pmv-stage .pmv-bokeh{position:absolute;inset:0;pointer-events:none}
.pmv-stage .pmv-bokeh i{position:absolute;border-radius:50%;background:radial-gradient(circle,#fff,#fff0 70%);opacity:.0;filter:blur(1px);animation:pmv-bok var(--t) ease-in-out infinite;animation-delay:var(--d)}
@keyframes pmv-bok{0%,100%{opacity:0;transform:translateY(8px)}50%{opacity:var(--o);transform:translateY(-8px)}}
.pmv-stage .pmv-string i{background:radial-gradient(circle,#fff1c9,#ffcf7a55 45%,#fff0 70%)}
.pmv-stage .pmv-embers i{border-radius:50%;background:#ffb35c;box-shadow:0 0 8px #ff7a3a;opacity:0;animation:pmv-ember var(--t) linear infinite;animation-delay:var(--d)}
@keyframes pmv-ember{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--x),-260px)}}
.pmv-stage .pmv-glow{position:absolute;left:50%;bottom:-18%;width:60%;aspect-ratio:2;transform:translateX(-50%);border-radius:50%;
  background:radial-gradient(closest-side,#ffb35ccc,#ff5c3a66 45%,#0000);animation:pmv-flick 1.3s ease-in-out infinite}
@keyframes pmv-flick{0%,100%{opacity:.85;transform:translateX(-50%) scale(1)}40%{opacity:1;transform:translateX(-50%) scale(1.05)}70%{opacity:.75}}
.pmv-stage .pmv-beams{position:absolute;inset:0;background:
  conic-gradient(from 200deg at 20% -10%,#0000 0 8deg,#ffffff22 10deg 14deg,#0000 16deg 360deg),
  conic-gradient(from 150deg at 80% -10%,#0000 0 8deg,#ffffff22 10deg 14deg,#0000 16deg 360deg);animation:pmv-beam 6s ease-in-out infinite alternate}
@keyframes pmv-beam{to{filter:hue-rotate(40deg);transform:translateX(2%)}}
.pmv-stage .pmv-weave{position:absolute;inset:0;opacity:.35;mix-blend-mode:multiply;background:
  repeating-linear-gradient(45deg,#8a4b1a 0 3px,#0000 3px 9px),repeating-linear-gradient(-45deg,#8a4b1a 0 3px,#0000 3px 9px)}
.pmv-stage .pmv-vign{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 45%,#0000 55%,#0008)}
.pmv[data-pmtheme="light"] .pmv-stage .pmv-vign{background:radial-gradient(120% 90% at 50% 45%,#0000 60%,#6a1d4a55)}

/* raw, unaired */
.pmv-stage.pmv-raw .pmv-cam{filter:grayscale(.9) contrast(1.15) brightness(.85)}
.pmv-stage .pmv-grain{position:absolute;inset:0;pointer-events:none;opacity:0;mix-blend-mode:overlay;background:repeating-radial-gradient(circle at 20% 30%,#fff4 0 1px,#0000 1px 3px)}
.pmv-stage.pmv-raw .pmv-grain{opacity:.8;animation:pmv-grain .25s steps(3) infinite}
@keyframes pmv-grain{to{transform:translate(3px,-2px)}}

/* busts */
.pmv-bust{position:absolute;bottom:37%;width:19%;aspect-ratio:4/5;transform:translate(-50%,6%);transition:left .9s cubic-bezier(.2,1.2,.3,1),transform .7s cubic-bezier(.2,1.3,.3,1),filter .5s,opacity .5s;z-index:3}
.pmv-bust .pmv-frame{position:absolute;inset:0;border-radius:26px;overflow:hidden;
  box-shadow:0 0 0 3px #ffffffcc,0 20px 40px #0007;background:linear-gradient(160deg,var(--c1,#ffd1e6),var(--c2,#c4a6ff))}
.pmv-bust img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%}
.pmv-bust .pmv-ini{position:absolute;inset:0;display:grid;place-items:center;font:800 clamp(24px,5vw,60px) Outfit;color:#fff9}
.pmv-bust .pmv-frame::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,#0000 55%,#0006)}
.pmv-bust .pmv-rim{position:absolute;inset:-3px;border-radius:28px;pointer-events:none;opacity:0;transition:opacity .4s;
  box-shadow:0 0 0 3px var(--rim,#ffc15e),0 0 38px 10px var(--rim,#ffc15e)}
.pmv-bust.pmv-speak{z-index:4;filter:none;transform:translate(-50%,0) scale(1.04);animation:pmv-breathe 3.2s ease-in-out infinite}
.pmv-bust.pmv-speak .pmv-rim{opacity:.9}
.pmv-bust.pmv-back{filter:blur(2.5px) brightness(.62) saturate(.8);transform:translate(-50%,10%) scale(.94)}
.pmv-bust.pmv-hurt{--rim:#ef4444}.pmv-bust.pmv-hurt .pmv-rim{opacity:.9}
.pmv-bust.pmv-hurt.pmv-speak{animation:none}
.pmv-bust.pmv-off{opacity:0}
.pmv-bust.pmv-offL{left:-20%!important}.pmv-bust.pmv-offR{left:120%!important}
@keyframes pmv-breathe{50%{transform:translate(-50%,-1%) scale(1.045)}}

/* dialogue box */
.pmv-dlg{position:absolute;left:4%;right:4%;bottom:4%;z-index:8;min-height:25%;border-radius:20px;padding:2.6% 3% 2.2%;
  background:var(--glass);color:var(--glassInk);backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);
  border:1.5px solid var(--glassLine);box-shadow:0 14px 34px #0005;transition:transform .45s cubic-bezier(.2,1.3,.3,1),opacity .3s}
.pmv-dlg.pmv-hide{transform:translateY(130%);opacity:0}
.pmv-dlg .pmv-plate{position:absolute;left:3%;top:0;transform:translateY(-58%);padding:5px 16px;border-radius:12px;
  font:700 clamp(12px,1.5vw,17px) Outfit;color:#fff;background:linear-gradient(135deg,var(--pc1,#ff7a59),var(--pc2,#ff2e88));box-shadow:0 6px 14px #0004;letter-spacing:.02em}
.pmv-dlg .pmv-plate em{font-style:normal;font:clamp(10px,1.1vw,12px) 'Bebas Neue';letter-spacing:.18em;opacity:.85;margin-left:8px}
.pmv-dlg .pmv-txt{font:500 clamp(13px,1.75vw,20px)/1.4 Outfit;min-height:2.8em}
.pmv-dlg .pmv-txt.pmv-narr{font-style:italic;color:inherit}
.pmv-dlg .pmv-nxt{position:absolute;right:2.4%;bottom:12%;width:14px;height:14px;animation:pmv-nudge 1s ease-in-out infinite;opacity:.8}
@keyframes pmv-nudge{50%{transform:translateX(4px)}}
.pmv-dlg.pmv-hut{background:linear-gradient(135deg,#fff7ea,#ffe9cc);color:#3a200c;border-color:#e8b77a}
.pmv-dlg.pmv-dior .pmv-plate{--pc1:#ff8cc6;--pc2:#ff2e88;box-shadow:0 0 0 2px #fff,0 0 22px #ff4fa0aa}
.pmv-dlg.pmv-narrator .pmv-plate{--pc1:#2b2b2b;--pc2:#111;color:var(--sun)}

/* HUD */
.pmv-hud{position:absolute;left:3%;top:4%;z-index:9;display:flex;gap:8px;align-items:center}
.pmv-hud .pmv-pill{background:#0009;color:#fff;border-radius:999px;padding:5px 12px;font:clamp(11px,1.3vw,15px) 'Bebas Neue';letter-spacing:.14em;backdrop-filter:blur(6px)}
.pmv-hud .pmv-air{display:flex;align-items:center;gap:6px}
.pmv-hud .pmv-air::before{content:'';width:9px;height:9px;border-radius:50%;background:#ff3b3b;box-shadow:0 0 8px #f33;animation:pmv-blink 1.2s infinite}
.pmv-stage.pmv-raw .pmv-hud .pmv-air::before{background:#aaa;box-shadow:none;animation:none}
@keyframes pmv-blink{50%{opacity:.25}}
.pmv-hud .pmv-scissors{display:none}
.pmv-stage.pmv-raw .pmv-hud .pmv-scissors{display:inline-flex}
.pmv-headline{position:absolute;right:3%;top:4%;z-index:9;max-width:46%;background:var(--glass);color:var(--glassInk);backdrop-filter:blur(8px);
  border-radius:999px;padding:6px 14px;font:700 clamp(11px,1.25vw,14px) Outfit;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;opacity:0;transition:opacity .3s}
.pmv-headline.pmv-on{opacity:1}

/* neon */
.pmv-neon{position:absolute;left:50%;top:22%;z-index:7;transform:translate(-50%,-50%);font:clamp(28px,6.4vw,78px)/1 Yellowtail,cursive;white-space:nowrap;pointer-events:none;color:#fff2;-webkit-text-stroke:1px #fff4}
.pmv-neon i{font-style:normal}
.pmv-neon.pmv-on i{color:#fff;-webkit-text-stroke:0;text-shadow:0 0 4px #fff,0 0 14px var(--glow),0 0 30px var(--glow),0 0 60px var(--glow);animation:pmv-buzz 3s infinite}
.pmv-neon.pmv-on.pmv-fresh i{animation:pmv-strike .55s both,pmv-buzz 3s .7s infinite;animation-delay:calc(var(--k)*65ms),calc(.7s + var(--k)*65ms)}
.pmv-neon.pmv-dying i{animation:pmv-die .4s forwards;animation-delay:calc(var(--k)*150ms)}
.pmv-neon.pmv-off{opacity:0}
@keyframes pmv-strike{0%,30%,50%{opacity:.15}40%,60%,100%{opacity:1}}
@keyframes pmv-buzz{0%,92%,100%{opacity:1}94%{opacity:.6}97%{opacity:.8}}
@keyframes pmv-die{0%{opacity:1}30%{opacity:.15}45%{opacity:1}100%{opacity:.06;text-shadow:none;color:#fff3}}

/* pops */
.pmv-pops{position:absolute;inset:0;z-index:9;pointer-events:none}
.pmv-pop{position:absolute;transform:translate(-50%,0);display:flex;align-items:center;gap:6px;padding:5px 11px 5px 7px;border-radius:999px;
  font:700 clamp(10px,1.2vw,14px) Outfit;color:#fff;background:linear-gradient(135deg,#ff7a59,#ff2e88);box-shadow:0 8px 18px #0005;white-space:nowrap;
  animation:pmv-rise 2.4s cubic-bezier(.2,1,.3,1) forwards;animation-delay:var(--d,0s);opacity:0}
.pmv-pop svg{width:1.3em;height:1.3em}
.pmv-pop.pmv-down{background:linear-gradient(135deg,#6b7280,#374151)}
.pmv-pop.pmv-red{background:linear-gradient(135deg,#f87171,#b91c1c)}
.pmv-pop.pmv-gold{background:linear-gradient(135deg,#ffc15e,#ff7a59);color:#3a1600}
.pmv-pop.pmv-teal{background:linear-gradient(135deg,#2dd4bf,#0e7490)}
@keyframes pmv-rise{0%{opacity:0;transform:translate(-50%,20px) scale(.7)}15%{opacity:1;transform:translate(-50%,0) scale(1.08)}25%{transform:translate(-50%,-4px) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-50px)}}
.pmv-stage:not(.pmv-fresh) .pmv-pop{display:none}

/* toast */
.pmv-toast{position:absolute;left:50%;top:40%;z-index:10;transform:translate(-50%,-50%) skewX(-8deg);padding:10px 34px;opacity:0;pointer-events:none;
  font:clamp(20px,3.6vw,44px)/1 'Bebas Neue';letter-spacing:.12em;color:#fff;background:linear-gradient(90deg,#ff2e88,#ff7a59);box-shadow:0 14px 34px #0007;overflow:hidden}
.pmv-toast::after{content:'';position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(90deg,#fff0,#fff9,#fff0);transform:skewX(-20deg)}
.pmv-toast.pmv-go{animation:pmv-toast 2.3s cubic-bezier(.2,1,.3,1) forwards}
.pmv-toast.pmv-go::after{animation:pmv-sheen 1s .35s}
.pmv-toast small{display:block;font:600 clamp(9px,1vw,12px) Outfit;letter-spacing:.3em;opacity:.9;text-align:center}
@keyframes pmv-toast{0%{opacity:0;transform:translate(-160%,-50%) skewX(-8deg)}14%{opacity:1;transform:translate(-50%,-50%) skewX(-8deg)}80%{opacity:1;transform:translate(-50%,-50%) skewX(-8deg)}100%{opacity:0;transform:translate(60%,-50%) skewX(-8deg)}}
@keyframes pmv-sheen{to{left:130%}}

/* heart iris wipe */
.pmv-wipe{position:absolute;inset:0;z-index:11;pointer-events:none;display:grid;place-items:center;opacity:0}
.pmv-wipe svg{width:12%;fill:#ff2e88;filter:drop-shadow(0 0 30px #ff2e88)}
.pmv-wipe.pmv-go{animation:pmv-wipeFade 1s ease forwards}
.pmv-wipe.pmv-go svg{animation:pmv-wipeGrow 1s cubic-bezier(.6,0,.4,1) forwards}
@keyframes pmv-wipeFade{0%,55%{opacity:1}100%{opacity:0}}
@keyframes pmv-wipeGrow{0%{transform:scale(.1)}55%{transform:scale(22)}100%{transform:scale(22)}}
/* the intro tape: a studio, recorded before the villa */
.pmv-sc-vt{background:
  radial-gradient(55% 70% at 50% 45%,#fff3,#0000 70%),
  linear-gradient(120deg,#ff2e88 0%,#ff5f7a 45%,#ff9a5a 75%,#ffc15e 100%)}
.pmv-stage .pmv-vt-stripes{position:absolute;inset:-20%;opacity:.22;
  background:repeating-linear-gradient(115deg,#fff0 0 60px,#fff 60px 64px,#fff0 64px 140px);animation:pmv-vtSlide 9s linear infinite}
@keyframes pmv-vtSlide{to{transform:translateX(140px)}}
.pmv-stage .pmv-vt-heart{position:absolute;left:50%;top:44%;width:62%;transform:translate(-50%,-50%);fill:none;stroke:#fff;stroke-width:.9;opacity:.5;
  filter:drop-shadow(0 0 12px #fff8);animation:pmv-vtBeat 2.4s ease-in-out infinite}
@keyframes pmv-vtBeat{50%{transform:translate(-50%,-50%) scale(1.05);opacity:.7}}
.pmv-stage.pmv-vt .pmv-bust{width:27%;bottom:30%}
.pmv-stage.pmv-vt .pmv-bust .pmv-frame{border-radius:14px;box-shadow:0 0 0 4px #fff,0 18px 40px #7a103c66}
.pmv-stage.pmv-vt .pmv-hud .pmv-air::before{background:#fff;box-shadow:0 0 6px #fff;animation:none;border-radius:2px}
.pmv-stage.pmv-vt .pmv-vign{background:radial-gradient(120% 90% at 50% 45%,#0000 62%,#5a0a2e66)}
.pmv-stage.pmv-vt .pmv-grain{opacity:.5}
/* the name caption on the tape */
.pmv-l3{position:absolute;left:4%;bottom:40%;z-index:8;display:flex;flex-direction:column;align-items:flex-start;gap:2px;
  opacity:0;transform:translateX(-30px);transition:opacity .45s,transform .6s cubic-bezier(.2,1.2,.3,1);pointer-events:none}
.pmv-l3.pmv-on{opacity:1;transform:none}
.pmv-l3 small{font:800 11px/1 Outfit;letter-spacing:.18em;text-transform:uppercase;background:#fff;color:#ff2e88;padding:5px 9px;border-radius:6px 6px 6px 0}
.pmv-l3 b{font:400 clamp(26px,4.4vw,52px)/1 'Bebas Neue',Outfit;letter-spacing:.04em;color:#fff;background:#1a0624d9;padding:6px 14px 4px;border-radius:0 8px 8px 8px;
  box-shadow:0 8px 24px #0005}
/* the channel switch between the tape and the villa */
.pmv-switch{position:absolute;inset:0;z-index:12;pointer-events:none;opacity:0;display:grid;place-items:center;overflow:hidden}
.pmv-switch i{position:absolute;inset:-50%;background:
  repeating-linear-gradient(0deg,#0000 0 2px,#0007 2px 4px),
  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 1'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E"),#333;
  background-size:100% 4px,160px 160px;filter:contrast(2.2) grayscale(1)}
.pmv-switch span{position:relative;font:400 clamp(22px,4vw,46px) 'Bebas Neue',Outfit;letter-spacing:.08em;color:#fff;background:#ff2e88;
  padding:6px 18px 3px;border-radius:8px;box-shadow:0 0 30px #ff2e88;opacity:0}
.pmv-switch.pmv-go{animation:pmv-swFade 1.05s ease forwards}
.pmv-switch.pmv-go i{animation:pmv-swStatic .12s steps(3) infinite}
.pmv-switch.pmv-go span{animation:pmv-swLabel 1.05s ease forwards}
@keyframes pmv-swFade{0%{opacity:1;transform:scaleY(1)}35%{opacity:1;transform:scaleY(1)}48%{opacity:1;transform:scaleY(.02)}62%{opacity:0;transform:scaleY(.02)}100%{opacity:0}}
@keyframes pmv-swStatic{to{transform:translate(9px,-7px)}}
@keyframes pmv-swLabel{0%,10%{opacity:0;transform:scale(.8)}20%,38%{opacity:1;transform:none}48%,100%{opacity:0}}

/* phone */
.pmv-phone{position:absolute;right:6%;bottom:9%;width:21%;aspect-ratio:9/17;z-index:9;border-radius:26px;background:linear-gradient(145deg,#2a2a2e,#0c0c0e);padding:2.2% 1.6%;
  box-shadow:0 30px 50px #0009,inset 0 0 0 2px #444;transform:translateY(260%) rotate(8deg);visibility:hidden;transition:transform .7s cubic-bezier(.2,1.3,.3,1),visibility 0s .7s}
.pmv-phone.pmv-up{transform:translateY(0) rotate(-4deg);visibility:visible;transition:transform .7s cubic-bezier(.2,1.3,.3,1)}
.pmv-phone.pmv-buzz{animation:pmv-vib .08s 10}
@keyframes pmv-vib{50%{margin-left:4px}}
.pmv-phone .pmv-scr{height:100%;border-radius:18px;background:linear-gradient(180deg,#ff4fa0,#ff7a59);padding:12% 8%;color:#fff;display:flex;flex-direction:column;gap:7%}
.pmv-phone h4{margin:0;font:clamp(14px,2.2vw,26px)/1 'Bebas Neue';letter-spacing:.06em}
.pmv-phone p{margin:0;background:#fff;color:#2b1026;border-radius:12px 12px 12px 3px;padding:8%;font:600 clamp(8px,1.05vw,13px)/1.35 Outfit;box-shadow:0 6px 12px #0003}
.pmv-phone .pmv-tag{font:600 clamp(7px,.9vw,11px) Outfit;opacity:.92}

/* heart rate */
.pmv-ecg{position:absolute;left:0;right:0;top:34%;height:22%;z-index:6;opacity:0;pointer-events:none}
.pmv-ecg.pmv-on{opacity:1}
.pmv-ecg polyline{fill:none;stroke:#7dffb0;stroke-width:3;filter:drop-shadow(0 0 6px #7dffb0);stroke-dasharray:1600;stroke-dashoffset:1600}
.pmv-stage.pmv-fresh .pmv-ecg.pmv-on polyline{animation:pmv-draw 1.8s linear forwards}
.pmv-stage:not(.pmv-fresh) .pmv-ecg.pmv-on polyline{stroke-dashoffset:0}
.pmv-bpm{position:absolute;right:4%;top:30%;z-index:7;font:clamp(16px,2.6vw,32px) 'Bebas Neue';color:#7dffb0;text-shadow:0 0 10px #7dffb0;opacity:0}
.pmv-bpm.pmv-on{opacity:1}
@keyframes pmv-draw{to{stroke-dashoffset:0}}

/* game cards: ballots, stick/twist */
.pmv-deal{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);z-index:9;display:flex;gap:2%;width:72%;justify-content:center;pointer-events:none}
.pmv-gc{width:24%;aspect-ratio:5/7;perspective:700px}
.pmv-gc>div{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.3,1.3,.4,1)}
.pmv-gc.pmv-flip>div{transform:rotateY(180deg)}
.pmv-gc .pmv-f,.pmv-gc .pmv-b{position:absolute;inset:0;border-radius:16px;backface-visibility:hidden;box-shadow:0 16px 30px #0007;display:grid;place-items:center;overflow:hidden}
.pmv-gc .pmv-f{background:linear-gradient(135deg,#ff4fa0,#a855f7);border:3px solid #fff}
.pmv-gc .pmv-f::before{content:'';position:absolute;inset:8%;border:2px solid #fff8;border-radius:10px}
.pmv-gc .pmv-f svg{width:42%;fill:#fff;filter:drop-shadow(0 4px 8px #0004)}
.pmv-gc .pmv-b{transform:rotateY(180deg);background:linear-gradient(180deg,#fff,#ffeef6);border:3px solid #fff;color:#2b1026;text-align:center;padding:8%}
.pmv-gc .pmv-b .pmv-who{font:700 clamp(9px,1.2vw,14px) Outfit;color:#8a6b80}
.pmv-gc .pmv-b .pmv-what{font:clamp(18px,3vw,38px)/1 'Bebas Neue';letter-spacing:.04em;color:var(--pink);margin-top:6%}
.pmv-gc .pmv-b .pmv-what.pmv-stick{color:#10a36b}.pmv-gc .pmv-b .pmv-what.pmv-twist{color:#ff2e88}
.pmv-gc .pmv-b .pmv-face{width:52%;aspect-ratio:1;border-radius:50%;overflow:hidden;margin:0 auto 6%;border:3px solid #ffd1e6;background:#ffd1e6}
.pmv-gc .pmv-b .pmv-face img{width:100%;height:100%;object-fit:cover}
.pmv-gc.pmv-in{animation:pmv-dealIn .6s cubic-bezier(.2,1.3,.3,1) both;animation-delay:var(--dl)}
@keyframes pmv-dealIn{from{opacity:0;transform:translateY(-60%) rotate(-12deg)}}

/* vote board */
.pmv-board{position:absolute;right:5%;top:15%;width:38%;z-index:8;background:var(--glass);color:var(--glassInk);backdrop-filter:blur(14px);border:1.5px solid var(--glassLine);border-radius:18px;padding:2% 2.6%;box-shadow:0 20px 40px #0006}
.pmv-board h5{margin:0 0 2.4%;font:clamp(13px,1.8vw,22px)/1 'Bebas Neue';letter-spacing:.1em;color:var(--pink)}
.pmv-board .pmv-row{display:grid;grid-template-columns:1fr auto;gap:2px 8px;margin-bottom:2.2%;font:700 clamp(9px,1.1vw,13px) Outfit}
.pmv-board .pmv-bar{grid-column:1/-1;height:clamp(8px,1.2vw,14px);border-radius:99px;background:#ff2e8822;overflow:hidden}
.pmv-board .pmv-bar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#ff7a59,#ff2e88);transition:width 1.3s cubic-bezier(.2,1.2,.3,1)}
.pmv-board .pmv-row .pmv-pc{opacity:0;transition:opacity .4s .7s}
.pmv-board .pmv-row.pmv-shown .pmv-pc{opacity:1}
.pmv-board .pmv-row.pmv-win .pmv-bar i{background:linear-gradient(90deg,#ffc15e,#ff2e88);box-shadow:0 0 14px #ffc15e}
.pmv-board.pmv-hide{display:none}
.pmv-petals{position:absolute;inset:0;z-index:10;pointer-events:none}
.pmv-petals i{position:absolute;left:50%;top:40%;width:2.4%;aspect-ratio:1;opacity:0}
.pmv-petals i svg{width:100%;fill:var(--pk,#ff4fa0)}
.pmv-stage.pmv-fresh .pmv-petals.pmv-go i{animation:pmv-petal 2.8s cubic-bezier(.2,.8,.3,1) forwards;animation-delay:var(--dl)}
@keyframes pmv-petal{0%{opacity:1;transform:translate(0,0) rotate(0) scale(.5)}100%{opacity:0;transform:translate(var(--x),var(--y)) rotate(var(--r)) scale(1.1)}}

/* the envelope */
.pmv-env{position:absolute;left:50%;top:44%;width:26%;z-index:9;transform:translate(-50%,-50%) scale(.5);opacity:0;transition:all .7s cubic-bezier(.2,1.3,.3,1)}
.pmv-env.pmv-on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.pmv-env .pmv-flap{transform-origin:50% 0;transform-box:fill-box;transition:transform .7s .4s}
.pmv-env.pmv-open .pmv-flap{transform:scaleY(-1)}
.pmv-env .pmv-envcard{transform-box:fill-box;transition:transform .9s .9s}
.pmv-env.pmv-open .pmv-envcard{transform:translateY(-52px)}

/* shake */
.pmv-stage.pmv-shake .pmv-cam{animation:pmv-shake .5s}
@keyframes pmv-shake{15%,85%{transform:translateX(-4px)}35%,65%{transform:translateX(6px)}50%{transform:translateX(-6px)}}

/* ── transcript cards ─────────────────────────────────────────────── */
.pmv-rail{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
.pmv-rail span{flex:1;min-width:92px;text-align:center;font:13px 'Bebas Neue';letter-spacing:.14em;padding:7px;border-radius:12px;background:var(--card);border:1.5px solid var(--line);color:var(--muted)}
.pmv-rail span.pmv-on{border-color:var(--pink);color:#fff;background:linear-gradient(135deg,var(--coral),var(--pink))}
.pmv-rail span.pmv-done{color:var(--ink)}
.pmv-cards{display:flex;flex-direction:column;gap:10px;margin-top:14px}
.pmv-card{scroll-margin-top:calc(42vh + 24px);background:var(--card);border:1.5px solid var(--line);border-radius:18px;padding:12px 14px;display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;position:relative;
  animation:pmv-pop .45s cubic-bezier(.2,1.4,.3,1);box-shadow:0 4px 14px #a0286410}
@keyframes pmv-pop{from{opacity:0;transform:translateY(12px) scale(.98)}}
.pmv-card .pmv-fx{display:flex}
.pmv-mini{width:38px;height:38px;border-radius:50%;border:2px solid var(--card);margin-right:-10px;overflow:hidden;background:linear-gradient(135deg,#ffd1e6,#c4a6ff);display:grid;place-items:center;font:800 13px Outfit;color:#5b1f45;flex:none}
.pmv-mini img{width:100%;height:100%;object-fit:cover}
.pmv-card .pmv-k{font:12px 'Bebas Neue';letter-spacing:.16em;color:var(--pink)}
.pmv-card p{margin:2px 0 0}
.pmv-card .pmv-who{font-weight:700}
.pmv-card.pmv-big{border-width:2px;border-color:var(--pink);box-shadow:0 8px 24px #ff2e8826}
.pmv-card.pmv-unaired{border-style:dashed;opacity:.8}
.pmv-card.pmv-narr p{font-style:italic}
.pmv-card.pmv-hutc{background:linear-gradient(135deg,var(--card),#ffe9cc33)}
.pmv-tape{position:absolute;right:10px;top:-9px;transform:rotate(3deg);background:#efe3bf;color:#5a4a1e;font:12px 'Bebas Neue';letter-spacing:.14em;padding:3px 12px;box-shadow:0 2px 4px #0003}
.pmv-tape.pmv-revealed{background:#ffd1e6;color:#9b1458}

/* ── sidebar: the heart map + a closed debug drawer ───────────────── */
.pmv-aside{display:flex;flex-direction:column;gap:14px;position:sticky;top:8px;max-height:calc(100vh - 16px);overflow:auto;scrollbar-width:thin;padding-bottom:70px}
@media (max-width:960px){.pmv-aside{position:static;max-height:none;overflow:visible}}
.pmv-panel{background:var(--card);border:1.5px solid var(--line);border-radius:20px;padding:14px;box-shadow:0 6px 18px #a0286412}
.pmv-panel h3{margin:0;font:28px/1 Yellowtail,cursive;color:var(--pink)}
.pmv-panel .pmv-note{margin:4px 0 8px;font-size:12px;color:var(--muted)}
svg.pmv-map{width:100%;height:auto;display:block;overflow:visible}
.pmv-map .pmv-edge{fill:none;transition:all .6s}
.pmv-map .pmv-couple{stroke:url(#gCouple);stroke-width:4.5}
.pmv-map .pmv-crush{stroke:#ff4fa0;stroke-width:var(--w,1.6);opacity:.85}
.pmv-map .pmv-flirt{stroke:#a855f7;stroke-width:2;stroke-dasharray:4 4;animation:pmv-dash 1s linear infinite}
.pmv-map .pmv-rival{stroke:#ef4444;stroke-width:2.2;stroke-dasharray:1 5;stroke-linecap:round}
.pmv-map .pmv-strained{stroke:#f59e0b;stroke-width:3;stroke-dasharray:10 4}
.pmv-map .pmv-new{animation:pmv-mapIn .8s ease}
@keyframes pmv-mapIn{from{opacity:0;stroke-width:9}}
@keyframes pmv-dash{to{stroke-dashoffset:-8}}
.pmv-map .pmv-node circle.pmv-ring{fill:none;stroke:var(--card);stroke-width:3}
.pmv-map .pmv-node text{font:600 9.5px Outfit;fill:var(--ink);text-anchor:middle}
.pmv-map .pmv-node.pmv-gone{opacity:.28}
.pmv-map .pmv-node.pmv-hot circle.pmv-ring{stroke:#ffc15e;stroke-width:3.5}
.pmv-legend{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin-top:8px;font-size:11px;color:var(--muted)}
.pmv-legend span{display:flex;align-items:center;gap:6px}
.pmv-legend i{width:20px;height:0;border-top:3px solid;display:inline-block}
.pmv-who-likes{margin-top:10px;display:flex;flex-direction:column;gap:5px;max-height:190px;overflow:auto}
.pmv-who-likes div{display:flex;align-items:center;gap:6px;font-size:12px}
.pmv-who-likes .pmv-mini{width:22px;height:22px;margin:0;font-size:9px}
.pmv-who-likes b{font-weight:700}
.pmv-who-likes .pmv-hearts{margin-left:auto;display:flex;gap:1px}
.pmv-who-likes .pmv-hearts svg{width:11px;fill:#ff4fa0}
.pmv-who-likes .pmv-hearts svg.pmv-e{fill:#ff4fa033}
details.pmv-debug{background:var(--card);border:1.5px dashed var(--line);border-radius:18px;padding:10px 14px}
details.pmv-debug summary{cursor:pointer;font:13px 'Bebas Neue';letter-spacing:.2em;color:var(--muted);list-style:none;display:flex;align-items:center;gap:8px}
details.pmv-debug summary::before{content:'';width:8px;height:8px;border-right:2px solid;border-bottom:2px solid;transform:rotate(-45deg);transition:transform .2s}
details.pmv-debug[open] summary::before{transform:rotate(45deg)}
.pmv-dtabs{display:flex;gap:4px;margin:10px 0 8px}
.pmv-dtabs button{flex:1;border:1.5px solid var(--line);background:var(--card2);color:var(--ink);border-radius:10px;padding:5px;font:600 11px Outfit;cursor:pointer}
.pmv-dtabs button.pmv-on{border-color:var(--pink);color:var(--pink)}
.pmv-mrow{display:grid;grid-template-columns:24px 1fr;gap:8px;align-items:center;margin-bottom:7px}
.pmv-mrow .pmv-mini{width:24px;height:24px;margin:0;font-size:9px}
.pmv-mrow .pmv-nm{display:flex;justify-content:space-between;font:600 11.5px Outfit}
.pmv-lab{font:10px 'Bebas Neue';letter-spacing:.12em;padding:1px 7px;border-radius:99px;color:#fff}
.pmv-lab.pmv-ff{background:linear-gradient(90deg,#ffc15e,#ff2e88)}.pmv-lab.pmv-loved{background:#ff4fa0}.pmv-lab.pmv-liked{background:#fb7fb8}
.pmv-lab.pmv-invisible{background:#a893a1}.pmv-lab.pmv-divisive{background:#a855f7}.pmv-lab.pmv-disliked{background:#f87171}.pmv-lab.pmv-villain{background:#7f1d1d}
.pmv-gauge{position:relative;height:6px;border-radius:99px;background:var(--line)}
.pmv-gauge::after{content:'';position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;background:var(--muted);opacity:.4}
.pmv-gauge i{position:absolute;top:0;bottom:0;border-radius:99px;transition:all .8s}
.pmv-mrow.pmv-gone{opacity:.35}
.pmv-matrix{font:11px Outfit;border-collapse:collapse;width:100%}
.pmv-matrix td,.pmv-matrix th{padding:2px 3px;text-align:center;border-bottom:1px solid var(--line)}

/* relationship viewer */
.pmv-picker{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.pmv-picker button{border:0;padding:0;background:none;cursor:pointer;border-radius:50%;position:relative}
.pmv-picker .pmv-mini{width:30px;height:30px;margin:0;border:2px solid var(--card);transition:transform .15s}
.pmv-picker button.pmv-on .pmv-mini{box-shadow:0 0 0 2.5px var(--pink);transform:scale(1.12)}
.pmv-picker button.pmv-gone{opacity:.35}
.pmv-relhead{display:flex;align-items:center;gap:10px;margin:4px 0 10px}
.pmv-relhead .pmv-mini{width:44px;height:44px;margin:0}
.pmv-relhead b{font:800 18px Outfit}
.pmv-relhead span{display:block;font-size:12px;color:var(--muted)}
.pmv-rrow{border:1.5px solid var(--line);border-radius:14px;padding:8px 10px;margin-bottom:8px;background:var(--card2)}
.pmv-rrow .pmv-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pmv-rrow .pmv-top .pmv-mini{width:26px;height:26px;margin:0;font-size:9px}
.pmv-rrow .pmv-top b{font:700 13px Outfit}
.pmv-tagx{font:10px 'Bebas Neue';letter-spacing:.1em;padding:2px 8px;border-radius:99px;color:#fff;background:#b8a6b1;white-space:nowrap}
.pmv-tagx.pmv-love{background:linear-gradient(90deg,#ff7a59,#ff2e88)}.pmv-tagx.pmv-crush{background:#ff4fa0}.pmv-tagx.pmv-hidden{background:#a855f7}
.pmv-tagx.pmv-fake{background:#111;color:#ffc15e}.pmv-tagx.pmv-friend{background:#14b8a6}.pmv-tagx.pmv-zone{background:#0ea5e9}.pmv-tagx.pmv-rival{background:#dc2626}
.pmv-tagx.pmv-mixed{background:#f59e0b}.pmv-tagx.pmv-surv{background:#64748b}.pmv-tagx.pmv-alone{background:#db2777}
.pmv-dir{display:grid;grid-template-columns:62px 1fr 1fr;gap:4px 8px;align-items:center;margin-top:6px;font-size:10.5px;color:var(--muted)}
.pmv-dir .pmv-lbl{font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pmv-bar2{position:relative;height:7px;border-radius:99px;background:var(--line);overflow:hidden}
.pmv-bar2 i{position:absolute;top:0;bottom:0;border-radius:99px}
.pmv-bar2.pmv-rom i{left:0;background:linear-gradient(90deg,#ff7a59,#ff2e88)}
.pmv-bar2.pmv-fr::after{content:'';position:absolute;left:50%;top:0;bottom:0;width:1.5px;background:var(--muted);opacity:.5}
.pmv-bar2 .pmv-ghost{position:absolute;top:-2px;bottom:-2px;width:2.5px;background:#a855f7;border-radius:2px}
.pmv-dirh{display:grid;grid-template-columns:62px 1fr 1fr;gap:8px;font:10px 'Bebas Neue';letter-spacing:.14em;color:var(--muted);margin-top:6px}
.pmv-belief{margin-top:6px;font-size:11.5px;display:flex;gap:6px;align-items:flex-start;color:var(--ink)}
.pmv-belief svg{flex:none;width:14px;height:14px;margin-top:1px}
.pmv-belief.pmv-shows svg{color:#a855f7}.pmv-belief.pmv-thinks svg{color:#f59e0b}
.pmv-rest{font-size:12px;color:var(--muted);margin-top:4px}
.pmv-map .pmv-node{cursor:pointer}
.pmv-map .pmv-edge.pmv-faded{opacity:.1}
.pmv-map .pmv-node.pmv-sel circle.pmv-ring{stroke:var(--pink);stroke-width:4}

/* the debug screen */
.pmv-debugScreen{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pmv-debugScreen .pmv-panel h3{font:20px/1 'Bebas Neue';letter-spacing:.14em;color:var(--pink)}
.pmv-debugScreen .pmv-wide{grid-column:1/-1}
@media (max-width:760px){.pmv-debugScreen{grid-template-columns:1fr}}
.pmv-heat{border-collapse:collapse;font:10.5px Outfit;width:100%}
.pmv-heat th{font-weight:700;padding:3px;color:var(--muted)}
.pmv-heat th.pmv-rot{height:70px;vertical-align:bottom}
.pmv-heat th.pmv-rot span{display:inline-block;transform:rotate(-55deg);transform-origin:left bottom;white-space:nowrap;width:14px}
.pmv-heat td{width:30px;height:26px;text-align:center;border:1px solid var(--card);font-weight:700;color:#fff;text-shadow:0 1px 2px #0006}
.pmv-heat td.pmv-self{background:var(--line)}

/* controls */
.pmv-controls{position:fixed;left:0;right:0;bottom:0;z-index:20;display:flex;gap:10px;justify-content:center;align-items:center;padding:12px;
  background:linear-gradient(0deg,var(--bg) 40%,#0000)}
.pmv-controls button{border:0;border-radius:999px;padding:12px 24px;font:800 14px Outfit;cursor:pointer}
.pmv-controls .pmv-next{background:linear-gradient(135deg,var(--coral),var(--pink));color:#fff;box-shadow:0 8px 20px #ff2e8866;min-width:120px}
.pmv-controls .pmv-next:active{transform:scale(.96)}
.pmv-controls .pmv-ghost{background:var(--card);color:var(--ink);border:1.5px solid var(--line)}
.pmv-controls .pmv-count{font:600 13px Outfit;color:var(--muted)}


/* ── the viewing party's own frame (not in the mockup: the mockup was a page) ── */
.pmv{background:radial-gradient(1200px 600px at 80% -10%,var(--bg2),var(--bg));color:var(--ink);
  font:15px/1.45 Outfit,system-ui,sans-serif;padding:12px 14px 0;border-radius:18px;min-width:0}
.pmv *{box-sizing:border-box}
.pmv [hidden]{display:none!important}
.pmv-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.pmv-logo{font:34px/1 Yellowtail,cursive;color:var(--pink);text-shadow:0 0 18px #ff2e8855}
.pmv-logo small{display:block;font:600 11px Outfit;letter-spacing:.28em;color:var(--muted);text-transform:uppercase;margin-top:2px}
.pmv-themeBtn{margin-left:auto;border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;
  padding:6px 13px;font:600 12px Outfit;cursor:pointer;display:flex;align-items:center;gap:6px}
.pmv-themeBtn svg{width:15px;height:15px}
/* the stage's caption: the scene's staging, over the top of the picture */
.pmv-caption{position:absolute;left:50%;top:14%;z-index:9;transform:translateX(-50%);width:min(78%,640px);text-align:center;
  background:var(--glass);color:var(--glassInk);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:14px;
  padding:6px 14px;font:italic 500 clamp(11px,1.3vw,15px)/1.35 Outfit;opacity:0;transition:opacity .35s;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.pmv-caption.pmv-on{opacity:1}
.pmv-dlg .pmv-beat{font:italic 500 clamp(11px,1.3vw,15px)/1.35 Outfit;opacity:.8;margin-top:.4em;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pmv-dlg.pmv-stagev .pmv-plate{display:none}
.pmv-dlg.pmv-stagev .pmv-txt{font-style:italic}
.pmv-dlg .pmv-txt{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
/* the cards fill in a line at a time */
.pmv-card{display:none}
.pmv-card.pmv-vis{display:grid}
.pmv-ln{display:none;margin:3px 0 0}
.pmv-ln.pmv-vis{display:block}
.pmv-ln.pmv-cap,.pmv-ln.pmv-bt{font-style:italic;color:var(--muted)}
.pmv-ln.pmv-hutl{background:linear-gradient(135deg,#fff7ea,#ffe9cc);color:#3a200c;border-radius:10px;padding:5px 10px;margin-top:6px}
.pmv[data-pmtheme="dark"] .pmv-ln.pmv-hutl{background:#3a2a17;color:#ffe9cc}
.pmv-ln.pmv-narl{font-style:italic;color:var(--pink)}
.pmv-ln .pmv-hutk{display:block;font:10px 'Bebas Neue';letter-spacing:.16em;opacity:.75}
.pmv-card .pmv-body{min-width:0}
.pmv-card .pmv-fx{align-self:start}
.pmv-rail{margin-top:10px}
/* the controls: sticky at the bottom of the screen, not the window */
.pmv-controls{position:sticky;left:auto;right:auto;bottom:0;margin:16px -14px 0;border-radius:0 0 18px 18px}
.pmv-empty{padding:30px;text-align:center;color:var(--muted)}
/* the Debug screen */
.pmv-debug .pmv-panel h3{font:20px/1 'Bebas Neue';letter-spacing:.14em;color:var(--pink)}
.pmv-emo{display:grid;grid-template-columns:repeat(6,1fr);gap:3px;font-size:10.5px}
.pmv-attach{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:4px 8px;align-items:center;font-size:10.5px;color:var(--muted)}
.pmv-emo span{text-align:center}
@media (max-width:640px){
  .pmv-stage{aspect-ratio:4/5;width:min(100%, calc(44vh * 4 / 5))}
  .pmv-bust{width:36%;bottom:30%} .pmv-dlg{left:3%;right:3%;min-height:24%} .pmv-phone{width:38%;bottom:30%} .pmv-headline{display:none}
  .pmv-board{width:88%;right:6%;top:12%} .pmv-gc{width:30%} .pmv-deal{width:94%;top:36%} .pmv-neon{top:14%}
  .pmv-ecg{top:30%} .pmv-env{width:52%;top:40%}
}
@media (prefers-reduced-motion: reduce){ *,*::before,*::after{animation:none!important;transition:none!important} }

/* ── THE IDENT: a screen opens like a segment of the show ── */
.pmv-ident{position:absolute;inset:0;z-index:40;pointer-events:none;display:grid;place-items:center;
  background:radial-gradient(circle at 50% 45%,#ff2e88,#7a0b44 60%,#1a0612);animation:pmv-identOut 1.9s cubic-bezier(.7,0,.3,1) forwards}
.pmv-identLogo{display:flex;flex-direction:column;align-items:center;gap:.4em;color:#fff;animation:pmv-identLogo 1.9s cubic-bezier(.22,1,.36,1) forwards}
.pmv-identLogo svg{width:clamp(40px,6vw,96px);fill:#fff;filter:drop-shadow(0 0 18px #fff8);animation:pmv-identBeat .6s ease-in-out 2}
.pmv-identLogo b{font:clamp(26px,5.4vw,64px)/1 'Bebas Neue',sans-serif;letter-spacing:.14em;text-shadow:0 0 24px #ff8cc6}
.pmv-identWhere{position:absolute;left:4%;bottom:9%;display:flex;flex-direction:column;gap:2px;color:#fff;
  padding:.5em 1.1em;border-left:4px solid #ffc15e;background:#0006;backdrop-filter:blur(6px);animation:pmv-identWhere 1.9s cubic-bezier(.22,1,.36,1) forwards}
.pmv-identWhere span{font:clamp(16px,2.4vw,28px)/1 'Bebas Neue',sans-serif;letter-spacing:.12em}
.pmv-identWhere small{font-size:clamp(10px,1.1vw,13px);opacity:.8;letter-spacing:.06em}
@keyframes pmv-identOut{0%,62%{opacity:1;clip-path:circle(150% at 50% 50%)}100%{opacity:1;clip-path:circle(0% at 50% 50%)}}
@keyframes pmv-identLogo{0%{opacity:0;transform:scale(.6)}18%{opacity:1;transform:scale(1.04)}30%{transform:scale(1)}62%{opacity:1}75%{opacity:0;transform:scale(1.2)}100%{opacity:0}}
@keyframes pmv-identWhere{0%,20%{opacity:0;transform:translateX(-30px)}34%{opacity:1;transform:none}62%{opacity:1}72%,100%{opacity:0}}
@keyframes pmv-identBeat{50%{transform:scale(1.18)}}
/* the break's own ident: a hard slam, not the logo */
.pmv-identBreak{background:#0b0508}
.pmv-identBreak b{font:clamp(34px,7vw,90px)/1 'Bebas Neue',sans-serif;letter-spacing:.2em;color:#fff;text-shadow:0 0 30px #ff2e88,0 0 60px #ff2e8888;
  animation:pmv-slam 1.9s cubic-bezier(.22,1,.36,1) forwards}
@keyframes pmv-slam{0%{opacity:0;transform:scale(2.4)}14%{opacity:1;transform:scale(.96)}22%{transform:scale(1)}62%{opacity:1}74%,100%{opacity:0}}
/* ── MOVIE NIGHT: an outdoor cinema on the lawn ── */
.pmv-sc-cinema{background:
  radial-gradient(70% 30% at 50% 100%,#1b0b2a,#0000 70%),
  linear-gradient(180deg,#04030b 0%,#0d0820 45%,#1a0d2c 75%,#0b0612 100%)}
.pmv-stage .pmv-beam{position:absolute;left:50%;bottom:-10%;width:120%;height:95%;transform:translateX(-50%);pointer-events:none;
  background:conic-gradient(from 180deg at 50% 100%,#0000 0deg 158deg,#bfd4ff22 172deg,#fff5 180deg,#bfd4ff22 188deg,#0000 202deg 360deg);
  filter:blur(6px);mix-blend-mode:screen;animation:pmv-beamflick 3.2s steps(12) infinite}
@keyframes pmv-beamflick{0%,100%{opacity:.85}40%{opacity:.7}60%{opacity:.95}}
.pmv-stage .pmv-beanbags{position:absolute;left:0;right:0;bottom:-2%;height:22%;display:flex;justify-content:space-around;align-items:flex-end}
.pmv-stage .pmv-beanbags i{width:15%;height:62%;border-radius:50% 50% 38% 38%;background:radial-gradient(60% 50% at 50% 30%,#3a2350,#130a1e 70%);filter:blur(1px);opacity:.9}
.pmv-bigscreen{position:absolute;left:20%;right:20%;top:15%;height:46%;z-index:2;border-radius:6px;overflow:hidden;
  background:radial-gradient(90% 90% at 50% 40%,#2b2f55,#0a0b1a);box-shadow:0 0 0 3px #1c1330,0 0 60px #9fb6ff55,0 0 140px #9fb6ff33}
.pmv-bigscreen::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(180deg,#fff1 0 1px,#0000 1px 3px),radial-gradient(120% 90% at 50% 50%,#0000 60%,#000a);mix-blend-mode:overlay}
.pmv-bs-in{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:4%}
.pmv-bs-in b{font:clamp(18px,3.6vw,46px)/1 'Bebas Neue',sans-serif;letter-spacing:.2em;color:#fff;text-shadow:0 0 22px #9fb6ff}
.pmv-bs-face{position:relative;height:66%;aspect-ratio:4/5;border-radius:10px;overflow:hidden;background:#222;filter:grayscale(.35) brightness(.7);transition:filter .4s,transform .4s}
.pmv-bs-face img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%}
.pmv-bs-face i{position:absolute;inset:0;display:grid;place-items:center;font:800 clamp(14px,2.4vw,30px) Outfit;color:#fff9;font-style:normal}
.pmv-bs-face.pmv-on{filter:none;transform:scale(1.08);box-shadow:0 0 0 2px #fff8,0 0 24px #9fb6ff}
.pmv-bs-rec{position:absolute;left:3%;top:5%;font:600 clamp(9px,1vw,12px)/1 ui-monospace,monospace;letter-spacing:.12em;color:#ff4d4d}
.pmv-stage.pmv-playing .pmv-bs-rec::before{content:'';display:inline-block;width:.7em;height:.7em;border-radius:50%;background:#ff4d4d;margin-right:.5em;animation:pmv-blink 1s steps(2) infinite}
.pmv-bs-sub{position:absolute;left:6%;right:6%;bottom:6%;text-align:center;font:600 clamp(10px,1.35vw,16px)/1.3 Outfit,sans-serif;color:#fff;
  text-shadow:0 1px 2px #000,0 0 8px #000}
.pmv-stage.pmv-playing .pmv-bigscreen{animation:pmv-screenflick .18s steps(2) infinite}
@keyframes pmv-screenflick{50%{filter:brightness(1.07)}}
/* the audience, seated on the beanbags in front of the screen */
.pmv-bust.pmv-seated{bottom:18%;width:15%;transform:translate(-50%,10%) scale(.9)}
.pmv-bust.pmv-seated.pmv-back{filter:brightness(.55) saturate(.7)}
/* the marquee: NOW SHOWING, lights chasing round the title */
.pmv-poster{position:absolute;left:50%;top:18%;z-index:12;transform:translate(-50%,0) scale(.6);opacity:0;pointer-events:none;text-align:center;
  padding:.9em 2.2em;border-radius:10px;background:#12060f;color:#ffe6a8;
  box-shadow:0 0 0 4px #7a1e46,0 0 40px #ff2e8866;border:3px dotted #ffd36b}
.pmv-poster small{display:block;font:clamp(10px,1.2vw,14px)/1 'Bebas Neue';letter-spacing:.34em;color:#ff8cc6}
.pmv-poster b{display:block;font:clamp(22px,4.4vw,56px)/1.05 'Bebas Neue',sans-serif;letter-spacing:.08em;text-shadow:0 0 18px #ffd36b}
.pmv-poster.pmv-go{animation:pmv-marquee 2.2s cubic-bezier(.22,1,.36,1) forwards}
@keyframes pmv-marquee{0%{opacity:0;transform:translate(-50%,0) scale(.6)}14%{opacity:1;transform:translate(-50%,0) scale(1.05)}22%{transform:translate(-50%,0) scale(1)}
  78%{opacity:1}100%{opacity:0;transform:translate(-50%,-10%) scale(.96)}}
.pmv-poster.pmv-go{animation-name:pmv-marquee}
.pmv-poster.pmv-go::after{content:'';position:absolute;inset:-7px;border-radius:14px;border:3px dotted #fff3b0;animation:pmv-chase .35s linear infinite}
@keyframes pmv-chase{50%{border-color:#ff8cc6}}

/* ── A BREAKDOWN: the stage goes cold and still; warmth when someone comes ── */
.pmv-stage.pmv-tears .pmv-scene{filter:saturate(.35) brightness(.72) hue-rotate(-12deg);transition:filter 1.4s}
.pmv-stage.pmv-tears .pmv-vign{background:radial-gradient(90% 75% at 50% 45%,#0000 35%,#0a1030dd)}
.pmv-stage.pmv-tears .pmv-cam{transform:scale(1.1);transition:transform 6s ease-out}
.pmv-stage.pmv-tears::after{content:'';position:absolute;inset:0;z-index:6;pointer-events:none;opacity:.55;
  background-image:radial-gradient(1.5px 5px at 12% 10%,#cfe2ffcc,#0000),radial-gradient(1.5px 5px at 32% 30%,#cfe2ffaa,#0000),
  radial-gradient(1.5px 5px at 58% 5%,#cfe2ffcc,#0000),radial-gradient(1.5px 5px at 78% 22%,#cfe2ffaa,#0000),radial-gradient(1.5px 5px at 90% 45%,#cfe2ff99,#0000);
  background-size:100% 100%;animation:pmv-drift 5s linear infinite}
@keyframes pmv-drift{from{background-position:0 -40%}to{background-position:0 140%}}
.pmv-stage.pmv-warmth .pmv-scene{filter:saturate(.7) brightness(.9);transition:filter 1.4s}
.pmv-stage.pmv-warmth .pmv-vign{background:radial-gradient(90% 75% at 50% 55%,#ffb35c33 0%,#0000 45%,#1a0a20bb)}

/* ── A LOVE TRIANGLE: three faces, the pull to each, the rivals' line ── */
.pmv-tri{position:absolute;left:50%;top:6%;width:42%;height:auto;aspect-ratio:300/226;z-index:11;transform:translateX(-50%);pointer-events:none;display:none;overflow:visible}
.pmv-tri.pmv-on{display:block}
.pmv-tri .pmv-tri-pull{stroke:#ff4fa0;stroke-linecap:round;filter:drop-shadow(0 0 6px #ff4fa0)}
.pmv-tri .pmv-tri-rival{stroke:#ef4444;stroke-dasharray:6 7;stroke-linecap:round;opacity:.85}
.pmv-tri.pmv-draw line{stroke-dasharray:400;stroke-dashoffset:400;animation:pmv-tridraw 1.2s ease-out forwards}
.pmv-tri.pmv-draw .pmv-tri-rival{animation:pmv-tridraw 1.2s ease-out .5s forwards}
@keyframes pmv-tridraw{to{stroke-dashoffset:0}}
.pmv-tri .pmv-tri-ring{fill:#1b1020;stroke:#fff;stroke-width:2.5}
.pmv-tri .pmv-tri-won{fill:#1b1020;stroke:#ffc15e;stroke-width:4;filter:drop-shadow(0 0 10px #ffc15e)}
.pmv-tri .pmv-tri-name{font:700 11px Outfit,sans-serif;fill:#fff;paint-order:stroke;stroke:#000a;stroke-width:3px}
.pmv-tri .pmv-tri-ini{font:800 16px Outfit,sans-serif;fill:#fff9}
.pmv-tri .pmv-tri-team{font:12px 'Bebas Neue',sans-serif;letter-spacing:.12em;fill:#ffe6a8;paint-order:stroke;stroke:#000a;stroke-width:3px}
.pmv-stage:has(.pmv-tri.pmv-on) .pmv-busts{opacity:.25}

/* ── A BLOW-UP: the tug of war, and the crack down the middle ── */
.pmv-crack{position:absolute;left:50%;top:0;bottom:0;width:3px;z-index:4;pointer-events:none;opacity:0;transform:translateX(-50%);
  background:linear-gradient(180deg,#0000,#ff3b3b 20%,#ff3b3b 80%,#0000);box-shadow:0 0 18px #ff3b3b,0 0 40px #ff3b3b88;
  clip-path:polygon(0 0,100% 0,100% 18%,0 26%,100% 40%,0 55%,100% 68%,0 82%,100% 100%,0 100%)}
.pmv-stage.pmv-divided .pmv-crack{opacity:1;animation:pmv-crack .5s ease-out}
@keyframes pmv-crack{0%{transform:translateX(-50%) scaleY(0)}100%{transform:translateX(-50%) scaleY(1)}}
.pmv-stage.pmv-divided .pmv-scene{filter:saturate(.8) contrast(1.1)}
.pmv-stage.pmv-divided .pmv-vign{background:radial-gradient(120% 90% at 50% 45%,#0000 50%,#5a0000aa)}
.pmv-tug{position:absolute;left:50%;top:36%;width:74%;z-index:12;transform:translateX(-50%);display:none;align-items:center;gap:1.4%;pointer-events:none}
.pmv-tug.pmv-on{display:flex}
.pmv-tug-a,.pmv-tug-b{flex:1;display:flex;gap:3px;flex-wrap:wrap}
.pmv-tug-a{justify-content:flex-end}.pmv-tug-b{justify-content:flex-start}
.pmv-tug .pmv-mini{width:clamp(18px,2.6vw,30px);height:clamp(18px,2.6vw,30px);box-shadow:0 0 0 2px #fff,0 4px 10px #0008}
.pmv-tug-a .pmv-mini{box-shadow:0 0 0 2px #ff7a59,0 4px 10px #0008}.pmv-tug-b .pmv-mini{box-shadow:0 0 0 2px #7aa2ff,0 4px 10px #0008}
.pmv-tug-bar{position:relative;flex:0 0 24%;height:10px;border-radius:99px;background:linear-gradient(90deg,#ff7a59,#ff3b3b 50%,#7aa2ff);box-shadow:0 0 14px #ff3b3b88}
.pmv-tug-bar i{position:absolute;top:50%;width:16px;height:16px;border-radius:50%;background:#fff;transform:translate(-50%,-50%);box-shadow:0 0 12px #fff;transition:left .8s cubic-bezier(.2,1.4,.3,1)}
.pmv-tug.pmv-pulse .pmv-tug-bar{animation:pmv-tugpulse .6s ease-out}
@keyframes pmv-tugpulse{30%{transform:scaleY(1.9);filter:brightness(1.5)}}

/* ── THE CASA PHOTOS: a Polaroid of the real moment, developing ── */
.pmv-polaroid{position:absolute;left:50%;top:4%;width:25%;z-index:11;opacity:0;pointer-events:none;
  background:#fbfaf6;padding:3% 3% 9%;border-radius:4px;box-shadow:0 18px 50px #000a,0 0 0 1px #0001;transform:translate(-50%,0) rotate(-4deg)}
.pmv-polaroid.pmv-on{opacity:1}
.pmv-polaroid.pmv-develop{animation:pmv-poldrop 1.1s cubic-bezier(.2,1.3,.3,1) both}
@keyframes pmv-poldrop{0%{opacity:0;transform:translate(-50%,-70%) rotate(18deg) scale(1.2)}60%{opacity:1}100%{opacity:1;transform:translate(-50%,0) rotate(-4deg)}}
.pmv-pol-photo{position:relative;aspect-ratio:1;display:flex;overflow:hidden;background:#1d1a1f}
.pmv-pol-photo span{position:relative;flex:1;overflow:hidden}
.pmv-pol-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%;filter:saturate(1.1) contrast(1.05) sepia(.18)}
.pmv-pol-photo i{position:absolute;inset:0;display:grid;place-items:center;font:800 clamp(16px,3vw,40px) Outfit;color:#fff8;font-style:normal;
  background:linear-gradient(160deg,#6d3a5c,#1f2d4f)}
.pmv-pol-photo::after{content:'';position:absolute;inset:0;background:#fbfaf6;opacity:0;pointer-events:none}
.pmv-polaroid.pmv-develop .pmv-pol-photo::after{animation:pmv-develop 2.6s ease-out .5s both}
@keyframes pmv-develop{0%{opacity:1;background:#fbfaf6}40%{opacity:.85;background:#d9c8b0}100%{opacity:0;background:#2a1f24}}
.pmv-pol-cap{position:absolute;left:0;right:0;bottom:2.2%;text-align:center;font:clamp(12px,1.9vw,24px)/1 'Yellowtail',cursive;color:#2b1d24}

/* ── THE BOMBSHELL: a silhouette on the steps, a spotlight, the lights up ── */
.pmv-stage.pmv-revealing::before{content:'';position:absolute;inset:0;z-index:4;pointer-events:none;
  background:radial-gradient(ellipse 22% 60% at var(--ox,50%) 45%,#fff5 0%,#fff0 70%),linear-gradient(#000c,#0006);animation:pmv-spot 2.6s ease forwards}
.pmv-stage.pmv-revealing .pmv-bust .pmv-frame{animation:pmv-silhouette 2.6s ease forwards}
.pmv-stage.pmv-revealing .pmv-bust{transition-duration:1.6s!important}
@keyframes pmv-spot{0%,45%{opacity:1}100%{opacity:0}}
@keyframes pmv-silhouette{0%,35%{filter:brightness(0) drop-shadow(0 0 18px #ff7a59)}70%{filter:brightness(1.4) drop-shadow(0 0 30px #ffc15e)}100%{filter:none}}

/* ── THE TEASER: quick cuts ── */
.pmv-stage.pmv-teaser::after{content:attr(data-bug);position:absolute;left:3%;top:15%;z-index:12;font:clamp(12px,1.6vw,18px)/1 'Bebas Neue',sans-serif;
  letter-spacing:.18em;color:#fff;background:#ff2e88;padding:.35em .7em;border-radius:4px;box-shadow:0 0 18px #ff2e8899;animation:pmv-blink 1.2s steps(2) infinite}
.pmv-stage.pmv-teaser .pmv-cam{filter:saturate(1.25) contrast(1.08)}
.pmv-stage.pmv-flash::before{content:'';position:absolute;inset:0;z-index:13;background:#fff;pointer-events:none;animation:pmv-flashCut .45s ease-out forwards}
@keyframes pmv-flashCut{0%{opacity:.9}100%{opacity:0}}
/* ── TV MODE: no cards, no Heart Map, the stage as big as the window ──
   Keyed on the PLAYER (#visual-player.pm-tv), which survives every screen:
   the screens' HTML is built once, before anyone toggles anything. */
.pm-tv .pmv .pmv-cards,.pm-tv .pmv .pmv-aside,.pm-tv .pmv .pmv-rail{display:none}
.pm-tv .pmv .pmv-layout{grid-template-columns:minmax(0,1fr)}
.pm-tv .pmv .pmv-stage{position:relative;top:auto;aspect-ratio:16/9;width:min(100%, calc((100vh - 230px) * 16 / 9));cursor:pointer}
.pm-tv .pmv .pmv-top{margin-bottom:6px}
.pm-tv .pmv .pmv-dlg{font-size:1.18em}
#visual-player.pm-tv:has(.pmv) #vp-sidebar{display:none}
#visual-player:fullscreen{overflow:auto;background:#0b0508}
#visual-player:fullscreen .pmv .pmv-stage{width:min(100%, calc((100vh - 170px) * 16 / 9))}
.pmv-tvBtn{margin-left:auto}
.pmv-tvBtn + .pmv-themeBtn{margin-left:0}
.pmv-tvBtn .pmv-tvOff{display:none}
.pm-tv .pmv-tvBtn .pmv-tvOn{display:none}.pm-tv .pmv-tvBtn .pmv-tvOff{display:inline}
@media (max-width:640px){ .pm-tv .pmv .pmv-stage{aspect-ratio:4/5;width:min(100%, calc((100vh - 150px) * 4 / 5))} }

/* COMPACT, LAST (ADDING-A-SHOW §6.5 rule 1): a short window gets a shorter stage. */
@media (max-height: 820px) and (min-width: 641px){
  .pmv .pmv-stage{aspect-ratio:16/7}
  .pm-tv .pmv .pmv-stage{aspect-ratio:16/9}
  .pmv-card{scroll-margin-top:calc(36vh + 24px)}
  .pmv-dlg{min-height:22%}
}
`;
