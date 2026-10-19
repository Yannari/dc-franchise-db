// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/style.js — the Ridonculous Race viewer's look (the approved leg mockup's)
// ══════════════════════════════════════════════════════════════════════
//
// mockup/mockup-rr-leg.html is the look the user approved: the plates full bleed, the
// teams as avatar pairs with an idle sway and a talk bounce, the visual-novel box, the
// confessional in front of the dark teal map with its compass rose and green name bar,
// the logo-style title card and slams. Sizes are in cqw so the full-screen player is the
// same picture, larger.
export const RR_CSS = `
:root{--ink:#0f1424;--paper:#fff8e6;--gold:#f7c948;--red:#e8433a;--hud:rgba(10,14,28,.78);--line:rgba(255,255,255,.14);--bg:#05070d}
.rr-app *{box-sizing:border-box}
body.rr-body{margin:0;background:var(--bg);color:#fff;font-family:Rubik,system-ui,sans-serif}
.rr-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 16px;background:#0a0f1d;border-bottom:1px solid var(--line)}
.rr-bar .brand{font-family:Bungee;font-size:18px;color:#ffc21f;letter-spacing:.04em;margin-right:8px;text-shadow:0 2px 0 #6a2200}
.rr-bar label{font-size:12px;color:#9fb3d9;display:flex;align-items:center;gap:6px}
.rr-bar input,.rr-bar select{font:600 14px Rubik;background:#141b31;color:#fff;border:1px solid #2a3354;border-radius:8px;padding:6px 8px}
.rr-bar input{width:72px}
.rr-bar select.ep{min-width:220px}
.rr-bar button,.rr-ctrl button{font:800 14px Rubik;padding:8px 14px;border-radius:10px;border:0;background:#1d2747;color:#fff;cursor:pointer}
.rr-bar button.go,.rr-ctrl button.go{background:var(--gold);color:var(--ink)}
.rr-bar .status{font-size:12px;color:#8b95b3;margin-left:auto}
.rr-wrap{max-width:1640px;margin:0 auto;padding:14px 16px;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px}
@media (max-width:1000px){.rr-wrap{grid-template-columns:minmax(0,1fr)}}
.rr-ctrl{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}
.rr-ctrl .stepn{font-size:12px;color:#8b95b3;margin-left:auto}
.rr-ctrl .hint{font-size:12px;color:#6c779a}

.stage{position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:14px;background:#000;cursor:pointer;
  box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 0 1px var(--line);container-type:inline-size;user-select:none}
.plate{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity .7s ease;will-change:opacity,transform}
.plate.on{opacity:1}
.plate.kb-in{animation:kbIn 18s ease-out forwards} .plate.kb-pan{animation:kbPan 18s ease-in-out forwards} .plate.kb-out{animation:kbOut 18s ease-out forwards}
@keyframes kbIn{from{transform:scale(1.02)}to{transform:scale(1.1)}}
@keyframes kbPan{from{transform:scale(1.08) translateX(1.6%)}to{transform:scale(1.08) translateX(-1.6%)}}
@keyframes kbOut{from{transform:scale(1.1)}to{transform:scale(1.02)}}
.layer{position:absolute;inset:0}
#rr-cam{position:absolute;inset:0;transform-origin:0 0;transition:transform 1.1s cubic-bezier(.45,.05,.2,1);will-change:transform}
#rr-ui{z-index:40;pointer-events:none}
.vignette{position:absolute;inset:0;pointer-events:none;z-index:30;background:radial-gradient(120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.42))}

/* HUD */
.hud-leg{position:absolute;left:2cqw;top:1.8cqw;display:flex;align-items:center;gap:1cqw;z-index:44}
.hud-leg .num{font-family:Bungee;font-size:1.7cqw;background:#08080e;color:#ffc21f;padding:.3cqw .9cqw;border-radius:.6cqw;transform:rotate(-3deg);box-shadow:0 0 0 .2cqw #5cc8ff,0 0 1cqw rgba(60,170,255,.7);text-shadow:0 .15cqw 0 #6a2200}
.hud-leg .name{font-family:Bungee;font-size:1.3cqw;letter-spacing:.06em;text-shadow:0 .25cqw 0 rgba(0,0,0,.7)}
.hud-task{position:absolute;right:2cqw;top:1.8cqw;display:flex;gap:.6cqw;z-index:44;opacity:0;transform:translateY(-1cqw);transition:all .4s}
.hud-task.on{opacity:1;transform:none}
.hud-task span{font-family:Bungee;font-size:1.1cqw;padding:.4cqw 1cqw;border-radius:99px;background:var(--hud);border:2px solid #8fb4ff;white-space:nowrap}
.hud-task .clk{border-color:#ffcf3f;color:#ffcf3f}
.timecard{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);z-index:46;font-family:Bungee;font-size:4.4cqw;color:#fff;
  background:#08080e;padding:.6cqw 2.2cqw;border-radius:1cqw;box-shadow:0 0 0 .3cqw #0c0c14,0 0 0 .55cqw #ffcf3f,0 1cqw 3cqw rgba(0,0,0,.6);
  animation:tcIn 2.2s cubic-bezier(.2,1.2,.4,1) forwards;pointer-events:none;white-space:nowrap}
@keyframes tcIn{0%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}14%{opacity:1;transform:translate(-50%,-50%) scale(1)}78%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-160%) scale(.5)}}

/* the dialogue box: one line per click */
.rr-frame{container-type:inline-size;position:relative;width:100%}
.stage-holder:fullscreen{display:flex;align-items:center;justify-content:center;background:#000}
.stage-holder:fullscreen .rr-frame{width:min(100vw,150vh)}
.vn{position:relative;margin-top:1cqw;min-height:9.6cqw;z-index:50;opacity:.45;cursor:pointer;
  background:linear-gradient(180deg,rgba(14,19,38,.93),rgba(8,11,24,.97));border:2px solid var(--line);border-radius:1.4cqw;box-shadow:0 1.2cqw 3cqw rgba(0,0,0,.55)}
.vn.on{opacity:1}
.vn.fresh{animation:vnIn .25s ease-out}
.vn::before{content:"";position:absolute;left:0;top:0;bottom:0;width:.6cqw;border-radius:1.4cqw 0 0 1.4cqw;background:var(--c,var(--gold))}
.vn .av{position:absolute;bottom:1cqw;width:10.5cqw;height:10.5cqw;border-radius:50%;object-fit:cover;border:.55cqw solid var(--c,var(--gold));
  background:#222;box-shadow:0 0 0 .3cqw #0b0f1e,0 1cqw 2cqw rgba(0,0,0,.5);animation:breathe 3.2s ease-in-out infinite}
.vn.left .av{left:1.6cqw} .vn.right .av{right:1.6cqw}
.vn .av.pop{animation:avPop .3s cubic-bezier(.2,1.6,.4,1)}
.vn .tx{padding:1.1cqw 2.5cqw 1.3cqw}
.vn.left .tx{padding-left:14cqw} .vn.right .tx{padding-right:14cqw}
.vn:not(.on) .av,.vn:not(.on) .more,.vn:not(.on) .nm{display:none}
.vn .nm{display:inline-block;font-family:Bungee;font-size:1.2cqw;letter-spacing:.04em;color:#0b0f1e;background:var(--c,var(--gold));padding:.15cqw .8cqw;border-radius:.5cqw}
.vn .tm{font:800 .85cqw Rubik;color:#9fb3d9;margin-left:.7cqw;letter-spacing:.1em;text-transform:uppercase}
.vn .ln{font-size:1.7cqw;line-height:1.36;margin-top:.5cqw}
.vn.beat .ln{font-style:italic;color:#cfe0ff;font-size:1.55cqw}
.vn.beat::before{background:#8fb4ff}
.vn.pause .ln{font-family:Bungee;font-size:3cqw;letter-spacing:.3em;color:var(--gold)}
.vn .more{position:absolute;right:1.4cqw;bottom:.7cqw;font-size:1.1cqw;color:var(--gold);animation:blink 1s infinite}
@keyframes vnIn{from{opacity:0;transform:translateY(1cqw)}to{opacity:1;transform:none}}
@keyframes avPop{from{transform:scale(.7)}to{transform:none}}
@keyframes blink{50%{opacity:.2}}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}

/* the teams: avatar pairs on the plate */
.tok{position:absolute;transform:translate(-50%,-100%);z-index:10;text-align:center;width:calc(var(--sz)*1.55);pointer-events:none}
.tok .pair{position:relative;height:var(--sz);filter:drop-shadow(0 .4cqw .3cqw rgba(0,0,0,.5))}
.tok .pair img{position:absolute;top:0;width:var(--sz);height:var(--sz);border-radius:50%;border:calc(var(--sz)*.06) solid var(--c);background:#222;object-fit:cover;
  animation:idle 2.6s ease-in-out infinite;animation-delay:var(--d,0s)}
.tok .pair img:first-child{left:0} .tok .pair img:nth-child(2){left:calc(var(--sz)*.55);animation-delay:calc(var(--d,0s) - 1.1s)}
.tok .pair img.speaking{animation:talk .55s ease-in-out infinite;z-index:2}
.tok .lab{display:inline-block;margin-top:.25cqw;font:800 calc(var(--sz)*.16) Rubik;background:var(--c);color:#0b0b14;padding:.05cqw .55cqw;border-radius:99px;white-space:nowrap}
.tok .shadow{position:absolute;left:50%;bottom:calc(var(--sz)*-.12);width:calc(var(--sz)*1.1);height:calc(var(--sz)*.18);transform:translateX(-50%);background:radial-gradient(rgba(0,0,0,.45),transparent 70%)}
.tok.out .pair img{filter:grayscale(1) brightness(.7)} .tok.out .lab{background:#777}
.tok.dim{opacity:.72}
.tok .rank{position:absolute;right:-.6cqw;top:-1cqw;font-family:Bungee;font-size:calc(var(--sz)*.2);background:var(--paper);color:var(--red);border:.22cqw solid var(--red);
  border-radius:.5cqw;padding:0 .4cqw;transform:rotate(10deg);z-index:3}
.tok .rank.fresh{animation:thumpR .4s cubic-bezier(.2,1.8,.4,1) both}
.tok .rank.gold{color:#9a6400;border-color:#c98b00}
.tok .rank.out{color:#fff;background:#333;border-color:#999}
.tok .veh{position:absolute;left:50%;bottom:calc(var(--sz)*-.25);width:calc(var(--sz)*2.6);transform:translateX(-50%);z-index:-1;filter:drop-shadow(0 .4cqw .3cqw rgba(0,0,0,.4))}
.tok.ride .pair{transform:translateY(calc(var(--sz)*-.2))}
.tok.ride .veh{animation:rideBob .5s ease-in-out infinite}
.tok.ride.camel .veh,.tok.ride.emu .veh{width:calc(var(--sz)*2.2)}
.tok.zip .veh{bottom:auto;top:calc(var(--sz)*-.9);width:calc(var(--sz)*1.6)}
.tok.para .veh{bottom:auto;top:calc(var(--sz)*-2.1);width:calc(var(--sz)*3)}
.tok.climb .pair img{animation:climb .9s ease-in-out infinite}
.tok .bubble{position:absolute;left:50%;top:-2.6cqw;transform:translateX(-50%);background:#fff;color:var(--ink);font:800 1cqw Rubik;padding:.15cqw .6cqw;border-radius:1cqw;white-space:nowrap;animation:pop .35s cubic-bezier(.3,1.6,.5,1)}
@keyframes idle{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-.25cqw) rotate(-2deg)}65%{transform:translateY(.1cqw) rotate(1.5deg)}}
@keyframes talk{0%,100%{transform:translateY(0) rotate(0) scale(1.04)}50%{transform:translateY(-.55cqw) rotate(-3deg) scale(1.06)}}
@keyframes climb{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-.4cqw) rotate(5deg)}}
@keyframes rideBob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-.3cqw)}}
@keyframes thumpR{from{transform:rotate(10deg) scale(3);opacity:0}to{transform:rotate(10deg);opacity:1}}
@keyframes pop{from{transform:translateX(-50%) scale(0)}to{transform:translateX(-50%) scale(1)}}

/* swimmers: a head in the water, bobbing, splashing */
.swim{position:absolute;transform:translate(-50%,-50%);z-index:10;text-align:center;pointer-events:none}
.swim img{width:var(--sz);height:var(--sz);border-radius:50%;border:calc(var(--sz)*.07) solid var(--c);animation:bob .7s ease-in-out infinite;object-fit:cover;background:#222}
.swim img.speaking{animation:talk .55s ease-in-out infinite}
.swim .lab{display:block;font:800 calc(var(--sz)*.18) Rubik;background:var(--c);color:#0b0b14;border-radius:99px;padding:0 .4cqw;margin-top:.1cqw;white-space:nowrap}
.swim .ripple{position:absolute;left:50%;top:70%;width:calc(var(--sz)*1.8);height:calc(var(--sz)*.45);transform:translate(-50%,-50%);border-radius:50%;border:.18cqw solid rgba(255,255,255,.7);animation:ripple 1.4s ease-out infinite}
.swim.dive img{border-style:dashed}
@keyframes bob{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-.45cqw) rotate(6deg)}}
@keyframes ripple{from{opacity:.9;transform:translate(-50%,-50%) scale(.6)}to{opacity:0;transform:translate(-50%,-50%) scale(1.4)}}

/* Don, locals, props */
.don{position:absolute;transform:translate(-50%,-100%);z-index:9;text-align:center;pointer-events:none}
.don img,.don svg{display:block;width:var(--sz);height:var(--sz);border-radius:50%;border:calc(var(--sz)*.06) solid var(--gold);object-fit:cover;background:#1a2340;
  box-shadow:0 .6cqw 1cqw rgba(0,0,0,.4);animation:idleDon 3s ease-in-out infinite}
.don.speaking img,.don.speaking svg{animation:talk .55s ease-in-out infinite}
.don .lab{display:inline-block;margin-top:.25cqw;font:800 calc(var(--sz)*.16) Rubik;background:var(--gold);color:#0b0b14;padding:.05cqw .55cqw;border-radius:99px;white-space:nowrap}
.don.local img,.don.local svg{border-color:#d9d9d9} .don.local .lab{background:#d9d9d9}
@keyframes idleDon{0%,100%{transform:translateY(0)}50%{transform:translateY(-.3cqw) rotate(-2deg)}}
.prop{position:absolute;transform:translate(-50%,-100%);z-index:8;filter:drop-shadow(0 .6cqw .5cqw rgba(0,0,0,.45));pointer-events:none}
.matimg{position:absolute;transform:translate(-50%,-50%);z-index:3;filter:drop-shadow(0 .4cqw .3cqw rgba(0,0,0,.35))}
.matimg.bronze{filter:sepia(1) saturate(2.4) hue-rotate(-18deg) brightness(.8) drop-shadow(0 .4cqw .3cqw rgba(0,0,0,.35))}

/* cards: the tip, slams, the title */
.tipcard{position:absolute;left:50%;top:3.5cqw;transform:translateX(-50%);z-index:40;display:flex;align-items:center;animation:cardIn .7s cubic-bezier(.2,.9,.3,1.25) both}
.tipcard.still{animation:none}
.tipcard .card{height:27cqw;filter:drop-shadow(0 1.5cqw 2cqw rgba(0,0,0,.55));transform:rotate(-6deg);z-index:2}
.tipcard .in{width:44cqw;margin-left:-2cqw;background:#eef4ff;color:var(--ink);border-radius:1cqw;padding:1.3cqw 1.6cqw 1.3cqw 3cqw;
  box-shadow:0 1.5cqw 3cqw rgba(0,0,0,.5);border:.3cqw solid #0f1424;display:flex;flex-direction:column;gap:.6cqw}
.tipcard .k{font-family:Bungee;font-size:2.1cqw;line-height:1.05;color:#2c4a9a}
.tipcard .lb{font:800 1.3cqw Rubik;color:#0f1424}
.tipcard .b{font:500 1.12cqw/1.42 Rubik}
.tipcard .os{display:flex;gap:.6cqw}
.tipcard .o{flex:1;font-family:Bungee;font-size:1.3cqw;background:#c9d9ff;border-radius:.6cqw;padding:.4cqw .8cqw;text-align:center}
@keyframes cardIn{from{transform:translateX(-50%) translateY(40cqw) rotate(-14deg) scale(.4);opacity:0}to{opacity:1}}
.slam{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);z-index:45;text-align:center;pointer-events:none}
.slam .band{display:inline-block;background:#08080e;border-radius:1.4cqw;padding:.5cqw 2.6cqw .9cqw;
  box-shadow:0 0 0 .3cqw #0c0c14,0 0 0 .55cqw #5cc8ff,0 0 2.4cqw .6cqw rgba(60,170,255,.75)}
.slam.red .band{box-shadow:0 0 0 .3cqw #0c0c14,0 0 0 .55cqw #ff5a4a,0 0 2.4cqw .6cqw rgba(255,70,50,.75)}
.slam.gold .band{box-shadow:0 0 0 .3cqw #0c0c14,0 0 0 .55cqw #ffd34a,0 0 2.4cqw .6cqw rgba(255,200,40,.75)}
.slam .big{font-family:Bungee;font-size:5.4cqw;line-height:1;background:linear-gradient(#fff36a 10%,#ffc21f 45%,#ff7a0a 85%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:.14cqw #4a1300;filter:drop-shadow(0 .35cqw 0 #3a0e00);white-space:nowrap}
.slam.red .big{background:linear-gradient(#ffd0c8 5%,#ff5a4a 50%,#b3120a 90%);-webkit-background-clip:text;background-clip:text}
.slam img{width:30cqw;filter:drop-shadow(0 1.4cqw 2cqw rgba(0,0,0,.55));margin-top:1cqw}
.slam.fresh{animation:slam .7s cubic-bezier(.2,1.6,.4,1) both}
.slam.boom.fresh img{animation:boomIn .8s cubic-bezier(.2,1.4,.4,1) both}
@keyframes slam{from{transform:translate(-50%,-50%) scale(2.6) rotate(-6deg);opacity:0}to{transform:translate(-50%,-50%);opacity:1}}
@keyframes boomIn{from{transform:rotate(-540deg) scale(.1);opacity:0}to{opacity:1}}
.title{position:absolute;left:0;right:0;top:12%;text-align:center;z-index:25;pointer-events:none}
.title .globe{position:absolute;left:50%;top:-1cqw;width:22cqw;opacity:.92;transform:translateX(-50%);filter:drop-shadow(0 0 1.2cqw #49b8ff)}
.title.fresh .globe{animation:globeIn .8s cubic-bezier(.2,1.3,.4,1) both}
.title .stack{position:relative;padding-top:9cqw}
.title .pre{position:relative;z-index:2;display:inline-block;box-shadow:0 .3cqw 1cqw rgba(0,0,0,.5);background:#f4f8ff;color:#1b5fd6;font:800 1.45cqw Rubik;letter-spacing:.06em;padding:.25cqw 1.2cqw;border-radius:.5cqw}
.title .band{position:relative;display:inline-block;margin-top:.8cqw;background:#08080e;border-radius:1.4cqw;padding:.5cqw 2.6cqw .9cqw;max-width:92cqw;
  box-shadow:0 0 0 .3cqw #0c0c14,0 0 0 .55cqw #5cc8ff,0 0 2.4cqw .6cqw rgba(60,170,255,.75)}
.title.fresh .band{animation:slamT .7s cubic-bezier(.2,1.6,.4,1) both}
.title .big{font-family:Bungee;font-size:5.4cqw;line-height:1.05;background:linear-gradient(#fff36a 10%,#ffc21f 45%,#ff7a0a 85%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:.14cqw #4a1300;filter:drop-shadow(0 .35cqw 0 #3a0e00)}
.title .sub{position:relative;display:table;margin-left:auto;margin-right:auto;background:rgba(6,10,22,.72);padding:.4cqw 1.4cqw;border-radius:99px;font:800 1.3cqw Rubik;letter-spacing:.3em;text-transform:uppercase;margin-top:1.3cqw;text-shadow:0 .2cqw .6cqw #000,0 0 1cqw #000}
.title .logo{width:46cqw;filter:drop-shadow(0 1cqw 2cqw rgba(0,0,0,.5))}
.title.fresh .logo{animation:slamT .8s cubic-bezier(.2,1.5,.4,1) both}
@keyframes slamT{from{transform:scale(2.6) rotate(-6deg);opacity:0}to{transform:none;opacity:1}}
@keyframes globeIn{from{transform:translateX(-50%) scale(.3) rotate(-90deg);opacity:0}to{opacity:1}}
.stamp{position:absolute;font-family:Bungee;color:var(--red);border:.4cqw solid var(--red);border-radius:.8cqw;padding:.2cqw 1cqw;font-size:2.2cqw;
  transform:translate(-50%,-50%) rotate(-12deg);z-index:35;background:rgba(255,248,230,.94);animation:thump .45s cubic-bezier(.2,1.8,.4,1) both;pointer-events:none;white-space:nowrap}
.stamp.gold{color:#9a6400;border-color:#c98b00}
@keyframes thump{from{transform:translate(-50%,-50%) rotate(-12deg) scale(3);opacity:0}to{opacity:1}}

/* fx */
.fxp{position:absolute;z-index:27;pointer-events:none;border-radius:50%}
.fxp.ember{width:.7cqw;height:.7cqw;background:#ffb02e;box-shadow:0 0 1cqw #ff6a00}
.fxp.drop{width:.6cqw;height:.8cqw;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#e9fbff;box-shadow:0 0 .4cqw #fff}
.fxp.steam{width:2.4cqw;height:2.4cqw;background:radial-gradient(rgba(255,255,255,.75),transparent 70%)}
.fxp.dust{width:2cqw;height:2cqw;background:radial-gradient(rgba(230,200,150,.7),transparent 70%)}
.fxp.spark{width:.8cqw;height:.8cqw;background:#fff6a0;box-shadow:0 0 1cqw #ffe36b}
.fxp.bubble{width:1cqw;height:1cqw;border:.15cqw solid rgba(220,250,255,.85);background:transparent}
.fxp.note{width:auto;height:auto;border-radius:0;font:800 2cqw Rubik;color:#ffe36b;text-shadow:0 0 .6cqw #ff3fd0}
.fxp.wool{width:1.6cqw;height:1.2cqw;background:#f5f2ea;box-shadow:0 0 .3cqw #fff}
.fxp.log{width:3cqw;height:.9cqw;border-radius:.45cqw;background:linear-gradient(#7a4b2a,#4a2b16)}
.fxp.snow{width:.5cqw;height:.5cqw;background:#fff;opacity:.85}
.fxp.mote{width:.4cqw;height:.4cqw;background:#ffe7b0;opacity:.5}
.flash{position:absolute;inset:0;z-index:28;pointer-events:none;background:radial-gradient(circle at var(--x) var(--y),#fff,rgba(255,255,255,.6) 20%,transparent 55%);animation:flash .7s ease-out forwards}
@keyframes flash{0%{opacity:0}12%{opacity:1}100%{opacity:0}}
.wake{position:absolute;height:1.2cqw;border-radius:50%;border:.18cqw solid rgba(255,255,255,.75);z-index:9;transform:translate(-50%,-50%);pointer-events:none}
.inset{position:absolute;left:2cqw;top:7.5cqw;min-width:12cqw;z-index:30;background:rgba(10,14,28,.84);border:2px solid var(--line);border-radius:1.2cqw;padding:1.2cqw 1cqw .7cqw;display:flex;gap:1cqw;align-items:flex-end}
.inset h4{position:absolute;left:1cqw;top:-1.1cqw;margin:0;white-space:nowrap;font-family:Bungee;font-weight:400;font-size:.9cqw;background:#0f1424;color:#9fd8ff;padding:.1cqw .6cqw;border-radius:.4cqw}
.inset .ppl{text-align:center}
.inset .ppl img{display:block;width:5.4cqw;height:5.4cqw;border-radius:50%;border:.32cqw solid var(--c);object-fit:cover;background:#222;animation:idle 2.8s ease-in-out infinite}
.inset .ppl img.speaking{animation:talk .55s ease-in-out infinite}
.inset .ppl span{display:inline-block;margin-top:.2cqw;font:800 .8cqw Rubik;background:var(--c);color:#0b0b14;padding:0 .5cqw;border-radius:99px}

/* the interview room, as the show shoots it */
.iv{position:absolute;inset:0;z-index:2;background:#06101f center/cover no-repeat;overflow:hidden}
.iv.fresh{animation:ivIn .35s ease-out both}
.iv .compass{position:absolute;left:3.5cqw;bottom:14cqw;width:10cqw;opacity:.75}
.iv .cf{position:absolute;top:6cqw;width:23cqw;height:23cqw;transform:translateX(-50%)}
.iv.fresh .cf{animation:ivSit .5s cubic-bezier(.2,1.3,.4,1) both}
.iv .cf img{width:100%;height:100%;border-radius:50%;object-fit:cover;border:.55cqw solid var(--c);background:#0d1a2c;
  box-shadow:0 0 0 .35cqw #07101d,0 2cqw 4cqw rgba(0,0,0,.55);animation:idle 3.2s ease-in-out infinite;animation-delay:var(--d,0s)}
.iv .cf img.speaking{animation:talk .55s ease-in-out infinite}
.iv .cf img:not(.speaking){filter:brightness(.9)}
.iv .cf.L{left:31%} .iv .cf.R{left:67%} .iv .cf.solo{left:50%}
.iv .lower{position:absolute;left:0;top:29.5cqw;width:60%;height:6.6cqw;background:linear-gradient(90deg,rgba(120,200,110,.18),rgba(120,200,110,.42));
  border-radius:0 .7cqw .7cqw 0;text-align:right;padding:.7cqw 1.6cqw 0 0}
.iv .lower.fresh{animation:lowerIn .5s .35s cubic-bezier(.2,1,.3,1) both}
.iv .lower .nm{font:600 1.75cqw Rubik;color:#c9dbe0;letter-spacing:.02em;line-height:1.1}
.iv .lower .tm{font-family:Bungee;font-size:2.4cqw;line-height:1.05;color:#d7dde2;-webkit-text-stroke:.08cqw #6f8a90}
@keyframes ivIn{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:none}}
@keyframes ivSit{from{transform:translateX(-50%) translateY(6cqw);opacity:0}to{transform:translateX(-50%);opacity:1}}
@keyframes lowerIn{from{transform:translateX(-100%)}to{transform:none}}

/* the travel map */
.mapwrap{position:absolute;inset:0;transform-origin:50% 45%}
.mapwrap.fresh{animation:mapZoom 14s ease-out forwards}
.mapbg{position:absolute;inset:0;background:center/cover}
.mapwrap .plane{position:absolute;width:2.8cqw;transform:translate(-50%,-50%);z-index:5;filter:drop-shadow(0 0 .5cqw #ffe36b)}
.pin{position:absolute;width:1.1cqw;height:1.1cqw;border-radius:50%;background:#ffe36b;box-shadow:0 0 1cqw #ffe36b;transform:translate(-50%,-50%);z-index:4}
.pin.to{animation:pinPulse 1.2s ease-in-out infinite}
.pinlab{position:absolute;transform:translate(1.3cqw,-50%);font-family:Bungee;font-size:1.05cqw;color:#fff;text-shadow:0 .15cqw 0 #000,0 0 .6cqw #000;white-space:nowrap;z-index:4}
@keyframes mapZoom{from{transform:scale(1)}to{transform:scale(1.1)}}
@keyframes pinPulse{50%{box-shadow:0 0 2.4cqw #ffe36b;transform:translate(-50%,-50%) scale(1.3)}}

/* the side panel: Intel, only what has aired */
.rr-side{background:#0c1120;border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0}
.rr-side h3{margin:0;font-family:Bungee;font-weight:400;font-size:15px;letter-spacing:.05em;color:var(--gold)}
.rr-side .sub{font-size:12px;color:#8b95b3}
.rr-side .board{position:relative}
.rr-side .row{position:absolute;left:0;right:0;height:54px;display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:10px;
  background:#141b31;border:1px solid var(--line);transition:top .7s cubic-bezier(.3,1.3,.5,1),opacity .4s,filter .4s}
.rr-side .row .rk{font-family:Bungee;font-size:16px;width:30px;text-align:center;color:#c9d2ef;flex:none}
.rr-side .row .pp{position:relative;width:50px;height:32px;flex:none}
.rr-side .row .pp img{position:absolute;top:0;width:32px;height:32px;border-radius:50%;border:3px solid var(--c);object-fit:cover;background:#222}
.rr-side .row .pp img:last-child{left:18px}
.rr-side .row .tx{min-width:0}
.rr-side .row .nm{font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rr-side .row .st{font-size:11px;color:#8fa0c8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rr-side .row.out{filter:grayscale(1);opacity:.5} .rr-side .row.lead{background:linear-gradient(90deg,rgba(247,201,72,.2),#141b31)}
.rr-side .row.safe .rk{color:#4fd18b}
.rr-side .row.speaking{border-color:var(--c)}
.rr-side .feed{display:flex;flex-direction:column;gap:5px}
.rr-side .feed div{font-size:12px;color:#cfd8f3;background:#121a30;border-radius:8px;padding:5px 8px;border-left:3px solid #5cc8ff}
.rr-side .season{font-size:12px;color:#9fb3d9;line-height:1.5}
.rr-side .season b{color:#dfe6ff}
.rr-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:60;background:rgba(5,7,13,.85);font-family:Bungee;font-size:28px;color:var(--gold)}
`;
