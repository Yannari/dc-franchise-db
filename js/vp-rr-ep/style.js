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
.rr-wrap.intel-closed{grid-template-columns:minmax(0,1fr) 36px}
@media (max-width:1000px){.rr-wrap,.rr-wrap.intel-closed{grid-template-columns:minmax(0,1fr)}}
.rr-sidecol{position:relative;min-width:0}
.rr-tab{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border:1px solid var(--line);background:#0c1120;color:var(--gold);
  font:400 13px Bungee;letter-spacing:.08em;cursor:pointer;border-radius:12px;padding:8px 0}
.rr-tab:hover{background:#141b31}
.intel-closed .rr-tab{writing-mode:vertical-rl;height:220px;padding:12px 0}
.intel-closed .rr-side{display:none}
.rr-wrap:not(.intel-closed) .rr-tab{margin-bottom:8px}
@media (max-width:1000px){.intel-closed .rr-tab{writing-mode:horizontal-tb;height:auto}}
.rr-ctrl{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}
.rr-ctrl .stepn{font-size:12px;color:#8b95b3;margin-left:auto}
.rr-ctrl .hint{font-size:12px;color:#6c779a}

/* the picture and its bar fit the window's height too (a short window, or the simulator's frame) */
.stage-holder{width:100%;max-width:max(560px,calc((100vh - 330px) * 16 / 9));margin:0 auto}
.stage{position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:14px;background:#000;cursor:pointer;
  box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 0 1px var(--line);container-type:inline-size;user-select:none}
.plate{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity .7s ease}
.plate.on{opacity:1}
#rr-gl{z-index:1;pointer-events:none}
.plate-skirt{position:absolute;left:0;right:0;top:100%;height:34%;background-size:100% 294%;background-position:center bottom;transform:scaleY(-1);filter:brightness(.5) saturate(.8) blur(1.5px);pointer-events:none}
#rr-gl .rr-life{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .6s}
#rr-gl .rr-life.on{opacity:1}
#rr-under,#rr-toks,#rr-fx{z-index:2}
#rr-lift{position:absolute;inset:0}
#rr-world{position:absolute;inset:0;transform-origin:50% 60%}
/* the camera breathes: a slow drift that never stops and never jumps (a cut starts the next one), the whole world
   with it so feet stay on their ground. Never a shake: only a slam pushes in (stage.js camera). */
#rr-world.kb-in{animation:kbIn 38s ease-in-out infinite alternate} #rr-world.kb-pan{animation:kbPan 44s ease-in-out infinite alternate}
#rr-world.kb-out{animation:kbOut 41s ease-in-out infinite alternate}
@keyframes kbIn{from{transform:scale(1.025) translate(.35%,.15%)}to{transform:scale(1.045) translate(-.35%,-.2%)}}
@keyframes kbPan{from{transform:scale(1.035) translate(.7%,0)}to{transform:scale(1.035) translate(-.7%,-.15%)}}
@keyframes kbOut{from{transform:scale(1.045) translate(-.3%,-.15%)}to{transform:scale(1.025) translate(.3%,.1%)}}
.layer{position:absolute;inset:0}
#rr-cam{position:absolute;inset:0;transform-origin:0 0;transition:transform 1.1s cubic-bezier(.45,.05,.2,1)}
#rr-ui{z-index:40;pointer-events:none}
.vignette{position:absolute;inset:0;pointer-events:none;z-index:30;background:radial-gradient(120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.42))}

/* a replay of last time: letterboxed, a little faded, the rewind badge */
.rr-replay{display:none;position:absolute;inset:0;z-index:43;pointer-events:none}
.stage.replay .rr-replay{display:block}
.stage.replay .rr-replay::before,.stage.replay .rr-replay::after{content:"";position:absolute;left:0;right:0;background:#000}
.stage.replay .rr-replay::before{top:0;height:6.5%} .stage.replay .rr-replay::after{bottom:0;height:2.5%}
.stage.replay .rr-replay span{position:absolute;left:2cqw;top:8.5%;font-family:Bungee;font-size:1.3cqw;color:#fff;background:rgba(200,30,30,.85);padding:.2cqw .8cqw;border-radius:.4cqw;animation:blink 1.4s infinite}
.stage.replay #rr-world{filter:saturate(.55) sepia(.18) contrast(1.05)}
.stage.replay .hud-leg{opacity:0}
/* HUD */
.hud-leg{position:absolute;left:2cqw;top:1.8cqw;display:flex;align-items:center;gap:1cqw;z-index:44}
.hud-leg .num{font-family:Bungee;font-size:1.7cqw;background:#08080e;color:#ffc21f;padding:.3cqw .9cqw;border-radius:.6cqw;transform:rotate(-3deg);box-shadow:0 0 0 .2cqw #5cc8ff,0 0 1cqw rgba(60,170,255,.7);text-shadow:0 .15cqw 0 #6a2200}
.hud-leg .name{font-family:Bungee;font-size:max(8px,1.3cqw);letter-spacing:.06em;text-shadow:0 .25cqw 0 rgba(0,0,0,.7)}
.hud-task{position:absolute;right:2cqw;top:1.8cqw;display:flex;gap:.6cqw;z-index:44;opacity:0;transform:translateY(-1cqw);transition:all .4s}
.hud-task.on{opacity:1;transform:none}
.hud-task span{font-family:Bungee;font-size:max(8px,1.1cqw);padding:.4cqw 1cqw;border-radius:99px;background:var(--hud);border:2px solid #8fb4ff;white-space:nowrap}
.hud-task .clk{border-color:#ffcf3f;color:#ffcf3f}
.timecard{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);z-index:46;font-family:Bungee;font-size:4.4cqw;color:#fff;
  background:#08080e;padding:.6cqw 2.2cqw;border-radius:1cqw;box-shadow:0 0 0 .3cqw #0c0c14,0 0 0 .55cqw #ffcf3f,0 1cqw 3cqw rgba(0,0,0,.6);
  animation:tcIn 2.2s cubic-bezier(.2,1.2,.4,1) forwards;pointer-events:none;white-space:nowrap}
@keyframes tcIn{0%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}14%{opacity:1;transform:translate(-50%,-50%) scale(1)}78%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-160%) scale(.5)}}

/* the dialogue box: one line per click */
.rr-frame{container-type:inline-size;position:relative;width:100%}
.stage-holder:fullscreen{display:flex;align-items:center;justify-content:center;background:#000}
.stage-holder:fullscreen .rr-frame{width:min(100vw,150vh)}
/* the bar sits over the bottom of the picture (the shot is lifted clear of it: steps.js BAR); in a narrow window it moves under it */
.vn{position:absolute;left:1.6cqw;right:1.6cqw;bottom:1.2cqw;height:8.3cqw;overflow:hidden;z-index:50;opacity:0;pointer-events:none;cursor:pointer;
  background:linear-gradient(180deg,rgba(14,19,38,.93),rgba(8,11,24,.97));border:2px solid var(--line);border-radius:1.4cqw;box-shadow:0 1.2cqw 3cqw rgba(0,0,0,.55)}
.vn.on{opacity:1;pointer-events:auto}
@container (max-width: 760px){.vn{position:relative;left:auto;right:auto;bottom:auto;height:auto;min-height:max(60px,9.6cqw);margin-top:1cqw;opacity:.45}.vn.on{opacity:1}}
.vn.fresh{animation:vnIn .25s ease-out}
.vn::before{content:"";position:absolute;left:0;top:0;bottom:0;width:.6cqw;border-radius:1.4cqw 0 0 1.4cqw;background:var(--c,var(--gold))}
.vn .av{position:absolute;bottom:max(6px,.8cqw);width:max(46px,6.7cqw);height:max(46px,6.7cqw);border-radius:50%;object-fit:cover;border:.55cqw solid var(--c,var(--gold));
  background:#222;box-shadow:0 0 0 .3cqw #0b0f1e,0 1cqw 2cqw rgba(0,0,0,.5);animation:breathe 3.2s ease-in-out infinite}
.vn.left .av{left:1.6cqw} .vn.right .av{right:1.6cqw}
.vn .av.pop{animation:avPop .3s cubic-bezier(.2,1.6,.4,1)}
.vn .tx{padding:.9cqw 2.5cqw 1cqw}
.vn.left .tx{padding-left:max(62px,9.5cqw)} .vn.right .tx{padding-right:max(62px,9.5cqw)}
.vn:not(.on) .av,.vn:not(.on) .more,.vn:not(.on) .nm{display:none}
.vn .nm{display:inline-block;font-family:Bungee;font-size:max(10px,1.2cqw);letter-spacing:.04em;color:#0b0f1e;background:var(--c,var(--gold));padding:.15cqw .8cqw;border-radius:.5cqw}
.vn .tm{font:800 max(8px,.85cqw) Rubik;color:#9fb3d9;margin-left:.7cqw;letter-spacing:.1em;text-transform:uppercase}
.vn .ln{font-size:max(13px,1.6cqw);line-height:1.34;margin-top:.4cqw}
.vn.long .ln{font-size:max(12px,1.38cqw)}
.vn.beat .ln{font-style:italic;color:#cfe0ff;font-size:max(12.5px,1.55cqw)}
/* a stage direction (no speaker) is a caption card in the middle of the picture, not the speaker's bar */
.beatcard{position:absolute;left:50%;top:37%;transform:translate(-50%,-50%) rotate(-1.4deg) scale(var(--k,1));z-index:48;max-width:56cqw;min-width:26cqw;
  padding:1.7cqw 2.6cqw 1.5cqw;text-align:center;color:#1b2033;display:none;pointer-events:none;
  background:radial-gradient(circle at 1px 1px,rgba(15,20,36,.07) 1px,transparent 1.2px) 0 0/.55cqw .55cqw,linear-gradient(175deg,#fffdf4,#fff1cf);
  border:max(2px,.32cqw) solid #0f1424;border-radius:.5cqw;box-shadow:.65cqw .75cqw 0 #0f1424,0 1.6cqw 3.2cqw rgba(0,0,0,.4);
  font:600 max(13px,1.6cqw)/1.42 Rubik;letter-spacing:.005em}
/* gold tape holding the card to the picture */
.beatcard::before,.beatcard::after{content:'';position:absolute;top:-1cqw;width:6cqw;height:1.9cqw;background:rgba(247,201,72,.82);
  box-shadow:0 .2cqw .4cqw rgba(0,0,0,.25);border-left:1px dashed rgba(120,80,0,.35);border-right:1px dashed rgba(120,80,0,.35)}
.beatcard::before{left:-1.6cqw;transform:rotate(-24deg)}
.beatcard::after{right:-1.6cqw;transform:rotate(22deg)}
.beatcard.on{display:block}
.beatcard.fresh{animation:beatIn .42s cubic-bezier(.2,1.4,.4,1)}
@keyframes beatIn{0%{opacity:0;transform:translate(-50%,-90%) rotate(-7deg) scale(.92)}60%{opacity:1;transform:translate(-50%,-46%) rotate(.6deg) scale(1.01)}100%{opacity:1;transform:translate(-50%,-50%) rotate(-1.4deg) scale(var(--k,1))}}
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
.tok .rank{position:absolute;left:50%;bottom:calc(100% + .35cqw);font-family:Bungee;font-size:calc(var(--sz)*.2);background:var(--paper);color:var(--red);border:.22cqw solid var(--red);
  border-radius:.5cqw;padding:0 .4cqw;transform:translateX(-50%) rotate(-4deg);z-index:3;white-space:nowrap}
.tok .rank.fresh{animation:thumpR .4s cubic-bezier(.2,1.8,.4,1) both}
.tok .rank.gold{color:#9a6400;border-color:#c98b00}
.tok .rank.out{color:#fff;background:#333;border-color:#999}
.tok .veh{position:absolute;left:50%;bottom:calc(var(--sz)*-.25);width:calc(var(--sz)*2.6);transform:translateX(-50%);z-index:-1;filter:drop-shadow(0 .4cqw .3cqw rgba(0,0,0,.4))}
.tok.ride .pair{transform:translateY(calc(var(--sz)*-.2))}
.tok.ride .veh{animation:rideBob .5s ease-in-out infinite}
.tok.ride.camel .veh,.tok.ride.emu .veh{width:calc(var(--sz)*2.2)}
.tok.zip .veh{bottom:auto;top:calc(var(--sz)*-.9);width:calc(var(--sz)*1.6)}
/* the rickshaw: the pair runs in front of it, pulling; a raft is carried over their heads */
.tok.ride.rickshaw .veh{left:-35%;width:calc(var(--sz)*2.3);animation:rideBob .32s ease-in-out infinite}
.tok.ride.rickshaw .pair{transform:translateX(calc(var(--sz)*.45))}
.tok .veh.carry{bottom:auto;top:calc(var(--sz)*-.55);width:calc(var(--sz)*2.2);z-index:3;animation:carryBob .5s ease-in-out infinite}
@keyframes carryBob{0%,100%{transform:translateX(-50%) translateY(0) rotate(-2deg)}50%{transform:translateX(-50%) translateY(-.35cqw) rotate(2deg)}}
.tok.para .veh{bottom:auto;top:calc(var(--sz)*-2.1);width:calc(var(--sz)*3)}
.tok.climb .pair img{animation:climb .9s ease-in-out infinite}
.tok .bubble{position:absolute;left:50%;top:-2.6cqw;transform:translateX(-50%);background:#fff;color:var(--ink);font:800 1cqw Rubik;padding:.15cqw .6cqw;border-radius:1cqw;white-space:nowrap;animation:pop .35s cubic-bezier(.3,1.6,.5,1)}
@keyframes idle{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-.3cqw) rotate(-3deg)}65%{transform:translateY(.12cqw) rotate(2.5deg)}}
@keyframes talk{0%,100%{transform:translateY(0) rotate(0) scale(1.06)}25%{transform:translateY(-.95cqw) rotate(-4deg) scale(1.1)}50%{transform:translateY(-.2cqw) rotate(2deg) scale(1.07)}75%{transform:translateY(-.7cqw) rotate(-2deg) scale(1.09)}}
/* the rest of the race, behind: smaller, a little dimmer, under the team the shot is about */
.tok.crowd{z-index:6;filter:saturate(.82) brightness(.93)}
.tok.crowd .lab{font-size:calc(var(--sz)*.19);opacity:.9}
.tok.crowd .pair{filter:drop-shadow(0 .3cqw .25cqw rgba(0,0,0,.45))}
.swim.crowd{z-index:6;filter:saturate(.82) brightness(.93)}
.tok.st-fail .pair{filter:drop-shadow(0 0 .6cqw rgba(255,80,60,.8))}
.tok.st-done .pair{filter:drop-shadow(0 0 .7cqw rgba(255,220,90,.9))}
.tok.st-quit .pair img{filter:grayscale(.6)}
/* running: a quick bouncing gait, leaning into the run */
.tok.running .pair{animation:wRun .32s ease-in-out infinite}
.tok.running.rtl .pair{animation-name:wRunL}
.tok.running .shadow{animation:wRunShadow .32s ease-in-out infinite}
@keyframes wRun{0%,100%{transform:translateY(0) rotate(6deg)}50%{transform:translateY(-.9cqw) rotate(10deg)}}
@keyframes wRunL{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-.9cqw) rotate(-10deg)}}
@keyframes wRunShadow{0%,100%{transform:translateX(-50%) scaleX(1)}50%{transform:translateX(-50%) scaleX(.7)}}
/* a runner keeps going between clicks */
.tok.crowd.running.ltr{animation:driftR 5s linear forwards} .tok.crowd.running.rtl{animation:driftL 5s linear forwards}
@keyframes driftR{to{margin-left:4cqw}} @keyframes driftL{to{margin-left:-4cqw}}
/* the work of each task, on the pair: dig, eat (and pull a face), draw, sweat, rock out, take a photo, bob, chase,
   build, shear, wait at the edge, chill, watch */
.tok.w-search .pair{animation:wDig 1.05s ease-in-out infinite}
.tok.w-eat .pair{animation:wEat 2.6s ease-in-out infinite}
.tok.w-eat .pair img:first-child{animation:wCringe 2.6s ease-in-out infinite}
.tok.w-draw .pair{animation:wScribble .38s linear infinite}
.tok.w-sweat .pair{animation:wSway 2.8s ease-in-out infinite}
.tok.w-sweat .pair img{filter:sepia(.35) saturate(1.6) hue-rotate(-12deg)}
.tok.w-guitar .pair{animation:wHeadbang .46s ease-in-out infinite}
.tok.w-photo .pair{animation:wLean 2.2s ease-in-out infinite}
.tok.w-bob .pair{animation:wDunk 2.2s ease-in-out infinite}
.tok.w-chase .pair{animation:wChase 2.4s ease-in-out infinite}
.tok.w-build .pair{animation:wHammer .62s ease-in-out infinite}
.tok.w-shear .pair{animation:wShear .26s linear infinite}
.tok.w-bungee .pair{animation:wTeeter 1.6s ease-in-out infinite}
.tok.w-chill .pair{animation:wChill 4.2s ease-in-out infinite}
.tok.w-watch .pair{animation:wWatch 3.4s ease-in-out infinite}
.tok.w-wait .pair{animation:wWait 1.3s ease-in-out infinite;animation-delay:var(--d,0s)}
/* batch 1 of the 46 places: pat a sand palace into shape, chip at ice, a hand in a mitten of ants (still, then a flinch),
   sew a costume, the beam and the vault */
.tok.w-sculpt .pair{animation:wPat .7s ease-in-out infinite}
.tok.w-chip .pair{animation:wHammer .5s ease-in-out infinite}
.tok.w-mitten .pair{animation:wFlinch 2.2s ease-in-out infinite}
.tok.w-mitten .pair img:first-child{animation:wCringe 2.2s ease-in-out infinite}
.tok.w-sew .pair{animation:wScribble .3s linear infinite}
.tok.w-beam .pair{animation:wBeam 2.4s ease-in-out infinite}
@keyframes wPat{0%,100%{transform:translateY(0)}45%{transform:translateY(.55cqw) scaleY(.95)}60%{transform:translateY(0)}}
@keyframes wFlinch{0%,62%,100%{transform:none}66%{transform:translate(-.7cqw,-.3cqw) rotate(-11deg)}70%{transform:translate(.5cqw,0) rotate(9deg)}74%{transform:translate(-.3cqw,-.2cqw) rotate(-5deg)}80%{transform:none}}
@keyframes wBeam{0%,100%{transform:rotate(0)}20%{transform:rotate(-7deg)}40%{transform:rotate(6deg)}62%{transform:translateY(0)}72%{transform:translateY(-1.6cqw) rotate(-180deg)}82%{transform:translateY(-1.1cqw) rotate(-360deg)}90%{transform:translateY(0) rotate(-360deg) scaleY(.9)}}
/* the rides of batch 1: a vehicle drawn facing left turned round; the horse a little smaller; swinging from a vine;
   pushing a coffin in front */
.tok.flipveh .veh{transform:translateX(-50%) scaleX(-1)}
.tok.ride.horse .veh{width:calc(var(--sz)*2.3)}
.tok.ride.bus .veh{width:calc(var(--sz)*3.6)} .tok.ride.heli .veh{width:calc(var(--sz)*3.4)} .tok.ride.boat .veh{width:calc(var(--sz)*3.2)}
.tok.swing .veh{bottom:auto;top:calc(var(--sz)*-2.7);width:calc(var(--sz)*.9);z-index:1}
.tok.swing .pair{transform-origin:50% -40%;animation:wSwing 1.5s ease-in-out infinite}
@keyframes wSwing{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
.tok.push .veh{left:auto;right:calc(var(--sz)*-1.5);bottom:calc(var(--sz)*-.15);width:calc(var(--sz)*1.5);transform:none;z-index:1}
.tok.push .pair{animation:wPush .5s ease-in-out infinite}
@keyframes wPush{0%,100%{transform:translateX(0) rotate(4deg)}50%{transform:translateX(.3cqw) rotate(8deg)}}
.prop.passer{z-index:9;transform:translate(-50%,-50%)}
.fxp.ant{width:.45cqw;height:.3cqw;background:#1b0d06;border-radius:40%}
/* the faces sit at the same height above the feet in every window: the token's box is fixed (the name under it may
   overflow); in a narrow window the browser's smallest font made the name taller and lifted the faces off steps.js's
   FACE shapes, so a stamp or a slam placed off a face could land on it */
.tok{height:calc(var(--sz)*1.29)} .don{height:calc(var(--sz)*1.277)} .swim:not(.crowd){height:calc(var(--sz)*1.35)} .swim.crowd{height:calc(var(--sz)*1.147)}
/* batch 2: a squeegee wiped across the glass, a tennis serve, a spoon scraping at a wall; over the hot coals in grass
   skirts (the costume worn under the faces, quick hot-footed hops) */
.tok.w-squeegee .pair{animation:wWipe 1.1s ease-in-out infinite}
.tok.w-serve .pair{animation:wServe 1.4s ease-in-out infinite}
.tok.w-spoon .pair{animation:wDig .55s ease-in-out infinite}
@keyframes wWipe{0%,100%{transform:translateX(-.6cqw) rotate(-4deg)}50%{transform:translateX(.6cqw) rotate(4deg)}}
@keyframes wServe{0%,55%,100%{transform:none}65%{transform:translateY(-.8cqw) rotate(-14deg)}75%{transform:translateY(0) rotate(12deg)}85%{transform:rotate(0)}}
.tok.coals .veh{bottom:calc(var(--sz)*-.2);width:calc(var(--sz)*1.25);z-index:-1}
.tok.coals .pair{animation:wHot .34s ease-in-out infinite}
@keyframes wHot{0%,100%{transform:translateY(0)}50%{transform:translateY(-.9cqw)}}
@keyframes wWait{0%,100%{transform:translateY(0)}20%{transform:translateY(-.45cqw)}40%{transform:translateY(0)}60%{transform:translateY(-.25cqw) rotate(-3deg)}}
@keyframes wDig{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(.7cqw) rotate(10deg)}50%{transform:translateY(-.25cqw) rotate(-5deg)}75%{transform:translateY(.55cqw) rotate(8deg)}}
@keyframes wEat{0%,40%,100%{transform:scaleY(1)}10%,30%{transform:scaleY(.94) translateY(.2cqw)}20%{transform:scaleY(1.03)}60%{transform:translateX(-.4cqw) rotate(-6deg) scaleY(.92)}66%{transform:translateX(.4cqw) rotate(6deg) scaleY(.92)}72%{transform:translateX(-.3cqw) rotate(-4deg)}}
@keyframes wCringe{0%,55%,85%,100%{filter:none}62%,78%{filter:hue-rotate(45deg) saturate(1.3) brightness(.92)}}
@keyframes wScribble{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(.35cqw) rotate(2deg)}75%{transform:translateX(-.35cqw) rotate(-2deg)}}
@keyframes wSway{0%,100%{transform:translateX(0) rotate(-3deg)}50%{transform:translateX(.3cqw) translateY(.3cqw) rotate(3deg) scaleY(.96)}}
@keyframes wHeadbang{0%,100%{transform:rotate(-4deg) translateY(0)}50%{transform:rotate(16deg) translateY(.5cqw)}}
@keyframes wLean{0%,100%{transform:translateX(0) rotate(0)}40%,60%{transform:translateX(.8cqw) rotate(7deg)}}
@keyframes wDunk{0%,30%,100%{transform:translateY(0)}45%,62%{transform:translateY(1.6cqw) scaleY(.9)}70%{transform:translateY(-.4cqw)}}
@keyframes wChase{0%,100%{transform:translateX(0) scaleX(1)}45%{transform:translateX(3cqw) scaleX(1)}50%{transform:translateX(3cqw) scaleX(-1)}95%{transform:translateX(0) scaleX(-1)}}
@keyframes wHammer{0%,100%{transform:translateY(0) rotate(0)}40%{transform:translateY(-.6cqw) rotate(-8deg)}60%{transform:translateY(.25cqw) rotate(5deg)}}
@keyframes wShear{0%,100%{transform:translateX(0)}50%{transform:translateX(.3cqw) rotate(2deg)}}
@keyframes wTeeter{0%,100%{transform:rotate(0)}30%{transform:rotate(-7deg) translateY(-.2cqw)}70%{transform:rotate(6deg)}}
@keyframes wChill{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg) translateY(.2cqw)}}
@keyframes wWatch{0%,100%{transform:translateX(0)}50%{transform:translateX(.25cqw) rotate(2deg)}}
/* the sound: mute, volume, music on or off */
.rr-snd{display:inline-flex;align-items:center;gap:6px}
.rr-snd button{font:800 14px Rubik,system-ui;padding:7px 10px;border-radius:10px;border:0;background:#1d2747;color:#fff;cursor:pointer;line-height:1}
.rr-snd .snd-vol{width:86px;accent-color:#f7c948;cursor:pointer}
.rr-snd .snd-music.off{opacity:.45;text-decoration:line-through}
@keyframes climb{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-.4cqw) rotate(5deg)}}
@keyframes rideBob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-.3cqw)}}
@keyframes thumpR{from{transform:translateX(-50%) rotate(-4deg) scale(3);opacity:0}to{transform:translateX(-50%) rotate(-4deg);opacity:1}}
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
.don>img,.don>svg{display:block;width:var(--sz);height:var(--sz);border-radius:50%;border:calc(var(--sz)*.06) solid var(--gold);object-fit:cover;background:#1a2340;
  box-shadow:0 .6cqw 1cqw rgba(0,0,0,.4);animation:idleDon 3s ease-in-out infinite}
.don.speaking>img,.don.speaking>svg{animation:talk .55s ease-in-out infinite}
.don .lab{display:inline-block;margin-top:.25cqw;font:800 calc(var(--sz)*.16) Rubik;background:var(--gold);color:#0b0b14;padding:.05cqw .55cqw;border-radius:99px;white-space:nowrap}
.don.local>img,.don.local>svg{border-color:#d9d9d9} .don.local .lab{background:#d9d9d9}
@keyframes idleDon{0%,100%{transform:translateY(0)}50%{transform:translateY(-.3cqw) rotate(-2deg)}}
.prop{position:absolute;transform:translate(-50%,-100%);z-index:8;filter:drop-shadow(0 .6cqw .5cqw rgba(0,0,0,.45));pointer-events:none}
.matimg{position:absolute;transform:translate(-50%,-50%);z-index:3;filter:drop-shadow(0 .4cqw .3cqw rgba(0,0,0,.35))}
.matimg.bronze{filter:sepia(1) saturate(2.4) hue-rotate(-18deg) brightness(.8) drop-shadow(0 .4cqw .3cqw rgba(0,0,0,.35))}

/* cards: the tip, slams, the title */
/* placed (and shrunk if need be) off every face by stage.js: steps.js tipSpot */
.tipcard{position:absolute;left:50%;top:3.5cqw;transform:translateX(-50%) scale(var(--k,1));transform-origin:50% 0;z-index:40;display:flex;align-items:center;animation:cardIn .7s cubic-bezier(.2,.9,.3,1.25) both}
.tipcard.still{animation:none}
.tipcard .card{height:27cqw;width:10.19cqw;filter:drop-shadow(0 1.5cqw 2cqw rgba(0,0,0,.55));transform:rotate(-6deg);z-index:2}
.tipcard .in{width:44cqw;margin-left:-2cqw;background:#eef4ff;color:var(--ink);border-radius:1cqw;padding:1.3cqw 1.6cqw 1.3cqw 3cqw;
  box-shadow:0 1.5cqw 3cqw rgba(0,0,0,.5);border:.3cqw solid #0f1424;display:flex;flex-direction:column;gap:.6cqw}
.tipcard .k{font-family:Bungee;font-size:2.1cqw;line-height:1.05;color:#2c4a9a}
.tipcard .lb{font:800 1.3cqw Rubik;color:#0f1424}
.tipcard .b{font:500 1.12cqw/1.42 Rubik}
.tipcard .os{display:flex;gap:.6cqw}
.tipcard .o{flex:1;font-family:Bungee;font-size:1.3cqw;background:#c9d9ff;border-radius:.6cqw;padding:.4cqw .8cqw;text-align:center}
@keyframes cardIn{from{transform:translateX(-50%) translateY(40cqw) rotate(-14deg) scale(.4);opacity:0}to{opacity:1}}
.slam{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%) scale(var(--k,1));z-index:45;text-align:center;pointer-events:none}
.slam .band{display:inline-block;background:#08080e;border-radius:1.4cqw;padding:.5cqw 2.6cqw .9cqw;
  box-shadow:0 0 0 .3cqw #0c0c14,0 0 0 .55cqw #5cc8ff,0 0 2.4cqw .6cqw rgba(60,170,255,.75)}
.slam.red .band{box-shadow:0 0 0 .3cqw #0c0c14,0 0 0 .55cqw #ff5a4a,0 0 2.4cqw .6cqw rgba(255,70,50,.75)}
.slam.gold .band{box-shadow:0 0 0 .3cqw #0c0c14,0 0 0 .55cqw #ffd34a,0 0 2.4cqw .6cqw rgba(255,200,40,.75)}
.slam .big{font-family:Bungee;font-size:5.4cqw;line-height:1;background:linear-gradient(#fff36a 10%,#ffc21f 45%,#ff7a0a 85%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:.14cqw #4a1300;filter:drop-shadow(0 .35cqw 0 #3a0e00);white-space:nowrap}
.slam.red .big{background:linear-gradient(#ffd0c8 5%,#ff5a4a 50%,#b3120a 90%);-webkit-background-clip:text;background-clip:text}
.slam img{width:30cqw;filter:drop-shadow(0 1.4cqw 2cqw rgba(0,0,0,.55));margin-top:1cqw}
.slam.fresh{animation:slam .7s cubic-bezier(.2,1.6,.4,1) both}
.slam.boom.fresh img{animation:boomIn .8s cubic-bezier(.2,1.4,.4,1) both}
@keyframes slam{from{transform:translate(-50%,-50%) scale(2.6) rotate(-6deg);opacity:0}to{transform:translate(-50%,-50%) scale(var(--k,1));opacity:1}}
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
.stamp.still{animation:none}
/* out of the shot (steps.js planHide): whoever a close-up would cut fades out while it is in */
#rr-stage .offcam{opacity:0}
@keyframes thump{from{transform:translate(-50%,-50%) rotate(-12deg) scale(3);opacity:0}to{opacity:1}}
.stamp{transform:translate(-50%,-50%) rotate(-12deg) scale(var(--k,1))}

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

/* the interview room, as the show shoots it: the map behind, soft; the team lit in front of it; the camera easing in
   on whoever talks (a two-shot pushes toward the speaker); the listener a touch darker, reacting */
.iv{position:absolute;inset:0;z-index:2;background:#06101f;overflow:hidden}
.iv.fresh{animation:ivIn .35s ease-out both}
.iv-cam{position:absolute;inset:0;transform-origin:50% 40%;transition:transform 1s cubic-bezier(.45,.05,.2,1)}
.iv-cam.on-L{transform:scale(1.07) translateX(4%)} .iv-cam.on-R{transform:scale(1.07) translateX(-4%)} .iv-cam.on-solo{transform:scale(1.04)}
.iv-bg{position:absolute;inset:-4%;background:center/cover no-repeat;filter:blur(1.2px) brightness(.82) saturate(.9);animation:ivDrift 30s ease-in-out infinite alternate}
@keyframes ivDrift{from{transform:translate(-1%,0) scale(1.02)}to{transform:translate(1%,-.8%) scale(1.05)}}
.iv .compass{position:absolute;left:3.5cqw;bottom:14cqw;width:10cqw;opacity:.75}
.iv .cf{position:absolute;top:10.5cqw;width:23cqw;height:23cqw;transform:translateX(-50%)}
.iv.fresh .cf{animation:ivSit .5s cubic-bezier(.2,1.3,.4,1) both}
.iv .cf .key{position:absolute;inset:-22%;border-radius:50%;background:radial-gradient(circle,rgba(255,236,190,.34),rgba(255,236,190,0) 62%);opacity:.55;transition:opacity .5s}
.iv .cf.talking .key{opacity:1}
.iv .cf img{position:relative;width:100%;height:100%;border-radius:50%;object-fit:cover;border:.55cqw solid var(--c);background:#0d1a2c;
  box-shadow:0 0 0 .35cqw #07101d,0 2cqw 4cqw rgba(0,0,0,.55);animation:idle 3.2s ease-in-out infinite;animation-delay:var(--d,0s);transition:filter .4s}
.iv .cf img.speaking{animation:talk .55s ease-in-out infinite}
.iv .cf:not(.talking) img{filter:brightness(.82) saturate(.9)}
.iv .cf .sw{width:7.5cqw!important;height:11cqw!important;top:6cqw!important}
.iv .cf.L{left:31%} .iv .cf.R{left:67%} .iv .cf.solo{left:50%}
.iv .lower{position:absolute;left:0;top:34cqw;width:60%;height:6.6cqw;background:linear-gradient(90deg,rgba(120,200,110,.18),rgba(120,200,110,.42));
  border-radius:0 .7cqw .7cqw 0;text-align:right;padding:.7cqw 1.6cqw 0 0}
.iv .lower.fresh{animation:lowerIn .5s .35s cubic-bezier(.2,1,.3,1) both}
.iv .lower .nm{font:600 1.75cqw Rubik;color:#c9dbe0;letter-spacing:.02em;line-height:1.1}
.iv .lower .tm{font-family:Bungee;font-size:2.4cqw;line-height:1.05;color:#d7dde2;-webkit-text-stroke:.08cqw #6f8a90}
@keyframes ivIn{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:none}}
@keyframes ivSit{from{transform:translateX(-50%) translateY(6cqw);opacity:0}to{transform:translateX(-50%);opacity:1}}
@keyframes lowerIn{from{transform:translateX(-100%)}to{transform:none}}
/* the sound coming off whoever talks (stage.js speaking) */
.sw{position:absolute;pointer-events:none;z-index:4;display:block}
.sw svg{width:100%;height:100%;overflow:visible;display:block}
.sw path{fill:none;stroke:#fff;stroke-width:2.6;stroke-linecap:round;opacity:0;animation:swPulse 1.1s ease-out infinite;filter:drop-shadow(0 0 1.5px rgba(0,0,0,.7))}
.sw path:nth-child(2){animation-delay:.16s} .sw path:nth-child(3){animation-delay:.32s}
.sw.flip{transform:scaleX(-1)}
@keyframes swPulse{0%{opacity:0;transform:translateX(-8%)}30%{opacity:.95}100%{opacity:0;transform:translateX(10%)}}

/* a clip from last time, over the map */
.clip{position:absolute;right:8cqw;top:9cqw;width:20cqw;padding:1cqw;background:#f2ead6;border-radius:.6cqw;transform:rotate(3deg);box-shadow:0 1.4cqw 3cqw rgba(0,0,0,.55);text-align:center;z-index:42}
.clip.fresh{animation:clipIn .5s cubic-bezier(.2,1.4,.4,1) both}
.clip .cl-h{font-family:Bungee;font-size:1.1cqw;color:#7a5a20;letter-spacing:.12em;margin-bottom:.6cqw}
.clip img{width:15cqw;height:15cqw;border-radius:50%;object-fit:cover;border:.5cqw solid var(--c);background:#222;filter:sepia(.25);animation:talk .55s ease-in-out infinite}
.clip .cl-n{font:800 1.1cqw Rubik;color:#2a2010;margin-top:.5cqw}
@keyframes clipIn{from{transform:rotate(-12deg) scale(.4);opacity:0}to{transform:rotate(3deg);opacity:1}}
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
