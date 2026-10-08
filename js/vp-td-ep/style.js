// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/style.js — the look: a game HUD over a live painted set (mockup v2, 2026-10-07)
// ══════════════════════════════════════════════════════════════════════
// Scoped under .tdx. Sizes in container units of the stage (cqw), so the HUD reads the
// same in the Viewing Party window, TV mode and on a phone.
export const TDX_FONTS = `@import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@600;700;800;900&family=Caveat:wght@700&family=Permanent+Marker&family=Special+Elite&family=Indie+Flower&family=Shadows+Into+Light&family=Gochi+Hand&family=Rock+Salt&family=Reenie+Beanie&family=Nothing+You+Could+Do&family=Homemade+Apple&family=Kalam:wght@700&family=Gloria+Hallelujah&family=Covered+By+Your+Grace&family=Just+Another+Hand&display=swap');`;

export const TDX_CSS = `
.tdx{--or:#ff8a1f;--am:#ffc23a;--te:#2ec4c4;--gr:#4fb84a;--rd:#d8433f;--cf:#8a5ad8;--glass:rgba(14,16,26,.86);--glass2:rgba(22,25,38,.94);--ht:#f4f1ea;--hd:#a9adbd;
  max-width:1200px;margin:0 auto;font-family:Nunito,system-ui,sans-serif;color:#e9ebf1}
.tdx .tdx-stage{position:relative;aspect-ratio:16/9;container-type:inline-size;overflow:hidden;border-radius:10px;background:#0a0b10;isolation:isolate;cursor:pointer;user-select:none;
  box-shadow:0 18px 50px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.05)}
.tdx .tdx-world{position:absolute;inset:0;z-index:1;transform-origin:50% 60%;animation:tdxDrift 26s ease-in-out infinite alternate;transition:transform 1s cubic-bezier(.3,.7,.2,1)}
.tdx .tdx-stage.push .tdx-world{animation:none;transform-origin:0 0;transition:transform .9s cubic-bezier(.25,.75,.2,1)}
.tdx .tdx-tok.offshot{filter:blur(1.6px) saturate(.6) brightness(.62)}
@keyframes tdxDrift{from{transform:scale(1.035) translate(-.6%,.2%)}to{transform:scale(1.06) translate(.6%,-.4%)}}
.tdx .tdx-plate{position:absolute;inset:0;background-size:100% 100%;animation:tdxFade .5s ease-out}
.tdx .tdx-noplate{background:linear-gradient(#26304f,#3d4a72)}
.tdx .tdx-plate.hd{opacity:0;transition:opacity .5s;animation:none}
.tdx .tdx-stage.push .tdx-plate.hd{opacity:1}
.tdx .tdx-gl{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .4s}
.tdx .tdx-gl.on{opacity:1}
.tdx .tdx-water{position:absolute;inset:0;-webkit-mask-size:100% 100%;mask-size:100% 100%}
.tdx .tdx-sky::before{content:'';position:absolute;inset:0;opacity:0}
.tdx .tdx-sky.g-night::before{opacity:1;background:radial-gradient(1.5px 1.5px at 12% 18%,#fff 60%,transparent),radial-gradient(1px 1px at 33% 8%,#fff 60%,transparent),radial-gradient(1.5px 1.5px at 51% 26%,#fff 60%,transparent),radial-gradient(1px 1px at 68% 12%,#fff 60%,transparent),radial-gradient(1px 1px at 84% 30%,#fff 60%,transparent),radial-gradient(1.5px 1.5px at 93% 6%,#fff 60%,transparent),radial-gradient(1px 1px at 24% 38%,#dfe6ff 60%,transparent),radial-gradient(1px 1px at 44% 44%,#dfe6ff 60%,transparent),linear-gradient(#060c22,#14204a 45%,#29356a 75%,#3a4478);background-size:31% 41%,27% 37%,33% 43%,29% 39%,35% 47%,41% 33%,23% 49%,37% 51%,100% 100%}
.tdx .tdx-sky.g-night .tdx-cloud{filter:brightness(.3) saturate(.5)}
.tdx .tdx-sky.g-storm::before{opacity:.95;background:linear-gradient(#22262e,#3c424c 55%,#545a62)}
.tdx .tdx-sky.g-storm .tdx-cloud{filter:brightness(.42) saturate(.15)}
.tdx .tdx-sky.g-rain::before{opacity:.9;background:linear-gradient(#4e555e,#6e757e 60%,#80868c)}
.tdx .tdx-sky.g-rain .tdx-cloud{filter:brightness(.66) saturate(.25)}
.tdx .tdx-sky.g-overcast::before{opacity:.82;background:linear-gradient(#8a929c,#a9afb6 60%,#b8bdc2)}
.tdx .tdx-sky.g-overcast .tdx-cloud{filter:brightness(.9) saturate(.3)}
.tdx .tdx-sky.g-fog::before{opacity:.78;background:linear-gradient(#bcc2c8,#d8dcdf 60%,#e6e8ea)}
.tdx .tdx-sky.g-fog .tdx-cloud{opacity:.55;filter:saturate(.3)}
.tdx .tdx-sky.g-dusk::before{opacity:.72;background:linear-gradient(#5a4a8a,#e8786a 40%,#ffb06a 70%,#ffd88a)}
.tdx .tdx-sky.g-dusk .tdx-cloud{filter:sepia(.55) saturate(1.6) hue-rotate(-18deg) brightness(.95)}
.tdx .tdx-sky.g-morning::before{opacity:.35;background:linear-gradient(#a8d8ff,#fff0d6)}
.tdx .tdx-sky.g-hot::before{opacity:.45;background:linear-gradient(#fffbe0,#fff3b0 40%,transparent 80%)}
.tdx .tdx-moon{position:absolute;left:80%;top:8%;width:3.6%;aspect-ratio:1;border-radius:50%;box-shadow:inset -11px 5px 0 0 #f6eed2;filter:drop-shadow(0 0 14px rgba(255,240,200,.55))}
.tdx .tdx-lightning{position:absolute;inset:0;background:#dfe6ff;mix-blend-mode:screen;opacity:0;pointer-events:none;animation:tdxSkyFlash 11s linear infinite}
@keyframes tdxSkyFlash{0%,86%{opacity:0}87%{opacity:.6}88%{opacity:.05}89.5%{opacity:.4}92%,100%{opacity:0}}
@keyframes tdxFade{from{opacity:.25}to{opacity:1}}
.tdx .tdx-live,.tdx .tdx-sky,.tdx .tdx-cast,.tdx .tdx-fx{position:absolute;inset:0;pointer-events:none}
.tdx .tdx-wash{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 75%,transparent 40%,rgba(8,10,30,.33))}
.tdx .tdx-cloud{position:absolute;transform:translate(-50%,-50%);animation:tdxCloud var(--d,70s) ease-in-out infinite alternate}
.tdx .tdx-cloud.flow{animation:tdxFlow var(--d) linear var(--dl,0s) infinite}
@keyframes tdxFlow{from{transform:translate(-50%,-50%) translateX(-30cqw)}to{transform:translate(-50%,-50%) translateX(110cqw)}}
.tdx .tdx-cloud img{width:100%;display:block}
@keyframes tdxCloud{from{margin-left:calc(var(--dx,4%)*-1)}to{margin-left:var(--dx,4%)}}
.tdx .tdx-flame{position:absolute;transform:translate(-50%,-100%)}
.tdx .tdx-flame img{position:absolute;inset:0;width:100%;height:100%;transform-origin:50% 100%}
.tdx .tdx-flame img:nth-child(1){animation:tdxF1 .9s ease-in-out infinite}
.tdx .tdx-flame img:nth-child(2){animation:tdxF2 1.3s ease-in-out infinite;opacity:.75}
@keyframes tdxF1{0%,100%{transform:scale(1,1) skewX(0)}25%{transform:scale(.94,1.08) skewX(-4deg)}50%{transform:scale(1.05,.93) skewX(2deg)}75%{transform:scale(.97,1.04) skewX(4deg)}}
@keyframes tdxF2{0%,100%{transform:scaleX(-1) scale(.9,.95)}40%{transform:scaleX(-1) scale(1,1.12) skewX(5deg)}70%{transform:scaleX(-1) scale(.92,.9) skewX(-3deg)}}
.tdx .tdx-glow{position:absolute;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;mix-blend-mode:screen;animation:tdxGlow 1.6s ease-in-out infinite alternate;background:radial-gradient(circle,rgba(255,170,80,.55),rgba(255,120,40,.18) 45%,transparent 70%)}
@keyframes tdxGlow{from{opacity:.7;transform:translate(-50%,-50%) scale(.94)}to{opacity:1;transform:translate(-50%,-50%) scale(1.06)}}
.tdx .tdx-ember{position:absolute;width:.35%;aspect-ratio:1;border-radius:50%;background:#ffc86a;box-shadow:0 0 6px #ff9a3a;opacity:0;animation:tdxEmber var(--d) linear var(--dl) infinite}
@keyframes tdxEmber{0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(var(--ex),-12cqw);opacity:0}}
.tdx .tdx-puff{position:absolute;aspect-ratio:1;border-radius:50%;opacity:0;background:radial-gradient(circle,rgba(230,230,240,.5),transparent 70%);animation:tdxPuff var(--d) ease-out var(--dl) infinite}
@keyframes tdxPuff{0%{transform:translate(-50%,0) scale(.4);opacity:0}15%{opacity:.6}100%{transform:translate(calc(-50% + var(--ex)),-15cqw) scale(2.4);opacity:0}}
.tdx .tdx-bulb{position:absolute;width:1.6%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,var(--c),transparent 70%);animation:tdxTw var(--d) ease-in-out var(--dl) infinite alternate}
@keyframes tdxTw{from{opacity:.45}to{opacity:1}}
.tdx .tdx-fall{position:absolute;overflow:hidden;opacity:.55;mix-blend-mode:screen;background:repeating-linear-gradient(90deg,transparent 0 9%,rgba(255,255,255,.55) 9% 11%,transparent 11% 23%,rgba(220,250,255,.35) 23% 24%,transparent 24% 37%);-webkit-mask-image:repeating-linear-gradient(180deg,#000 0 18%,transparent 18% 30%);mask-image:repeating-linear-gradient(180deg,#000 0 18%,transparent 18% 30%);-webkit-mask-size:100% 40%;mask-size:100% 40%;animation:tdxFall var(--d,1.6s) linear infinite}
@keyframes tdxFall{from{-webkit-mask-position:0 0;mask-position:0 0}to{-webkit-mask-position:0 100%;mask-position:0 100%}}
.tdx .tdx-fish{position:absolute;width:1.4%;aspect-ratio:2.2;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#e8843a;opacity:0;animation:tdxFish var(--d) ease-in-out var(--dl) infinite}
@keyframes tdxFish{0%,82%{opacity:0;transform:translate(0,0) rotate(-40deg)}86%{opacity:1;transform:translate(14px,-26px) rotate(0deg)}92%{opacity:1;transform:translate(28px,-6px) rotate(40deg)}95%,100%{opacity:0;transform:translate(32px,6px) rotate(60deg)}}
.tdx .tdx-mist.band{left:-60%;width:220%;height:10%;opacity:.5}
.tdx .tdx-tok.carry .body::after{content:'';position:absolute;right:-22%;top:-38%;width:42%;height:55%;background:no-repeat center/contain url(assets/sets/td/sprites/flame.webp);filter:drop-shadow(0 0 12px #ffb040);animation:tdxFlick .25s ease-in-out infinite alternate}
@keyframes tdxFlick{from{transform:scale(1,1)}to{transform:scale(.92,1.08)}}
.tdx .tdx-critter{position:absolute;width:2.2%;display:block;animation:tdxCrWalk var(--d) ease-in-out var(--dl) infinite}
.tdx .tdx-critter svg{width:100%;display:block;animation:tdxCrStep .32s ease-in-out infinite alternate}
.tdx .tdx-critter.frog svg{animation:tdxCrHop 1.6s ease-in-out infinite}
.tdx .tdx-critter.fly{width:2.6%;animation:tdxCrFly var(--d) linear var(--dl) infinite}
.tdx .tdx-critter.fly svg{animation:tdxFlap .35s ease-in-out infinite alternate}
@keyframes tdxCrWalk{0%{transform:translateX(0) scaleX(1)}46%{transform:translateX(calc(var(--w) * 10))  scaleX(1)}50%{transform:translateX(calc(var(--w) * 10)) scaleX(-1)}96%{transform:translateX(0) scaleX(-1)}100%{transform:translateX(0) scaleX(1)}}
@keyframes tdxCrFly{from{transform:translate(-20cqw,0)}50%{transform:translate(calc(var(--w) * 5),-3cqw)}to{transform:translate(120cqw,1cqw)}}
@keyframes tdxCrStep{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-8%) rotate(3deg)}}
@keyframes tdxCrHop{0%,60%,100%{transform:translateY(0)}75%{transform:translateY(-60%)}}
.tdx .tdx-butterfly{position:absolute;width:1.1%;aspect-ratio:1.4;animation:tdxBfly var(--d) ease-in-out var(--dl) infinite alternate}
.tdx .tdx-butterfly::before,.tdx .tdx-butterfly::after{content:'';position:absolute;top:0;width:50%;height:100%;background:var(--c);border-radius:60% 60% 40% 40%;animation:tdxWingB .22s ease-in-out infinite alternate}
.tdx .tdx-butterfly::before{left:0;transform-origin:100% 50%}.tdx .tdx-butterfly::after{right:0;transform-origin:0 50%}
@keyframes tdxWingB{from{transform:scaleX(1)}to{transform:scaleX(.25)}}
@keyframes tdxBfly{0%{transform:translate(0,0)}25%{transform:translate(40px,-22px)}50%{transform:translate(90px,8px)}75%{transform:translate(50px,30px)}100%{transform:translate(-20px,10px)}}
.tdx .tdx-shimmer{position:absolute;height:.25%;border-radius:4px;background:rgba(230,250,255,.55);opacity:0;animation:tdxSh var(--d) ease-in-out var(--dl) infinite}
.tdx .tdx-shimmer.night{background:rgba(170,200,225,.2);filter:blur(.6px)}
@keyframes tdxSh{0%{transform:translateX(0) scaleX(.3);opacity:0}40%{opacity:.9}100%{transform:translateX(var(--ex)) scaleX(1);opacity:0}}
.tdx .tdx-bird{position:absolute;left:0;width:1.6%;animation:tdxBird var(--d) linear var(--dl) infinite}
.tdx .tdx-bird svg{width:100%;animation:tdxFlap .5s ease-in-out infinite alternate}
@keyframes tdxBird{from{transform:translate(-10cqw,0)}to{transform:translate(110cqw,-3cqw)}}
@keyframes tdxFlap{from{transform:scaleY(1)}to{transform:scaleY(.45)}}
.tdx .tdx-leaf{position:absolute;width:.9%;aspect-ratio:1.6;border-radius:50% 0;background:var(--c);opacity:0;animation:tdxLeaf var(--d) linear var(--dl) infinite}
@keyframes tdxLeaf{0%{transform:translate(0,0) rotate(0);opacity:0}10%{opacity:.95}100%{transform:translate(var(--ex),30cqw) rotate(540deg);opacity:0}}
.tdx .tdx-fly{position:absolute;width:.45%;aspect-ratio:1;border-radius:50%;background:#e8ff8a;box-shadow:0 0 8px 2px rgba(220,255,120,.8);animation:tdxWander var(--d) ease-in-out var(--dl) infinite alternate,tdxBlink 2.2s ease-in-out infinite}
@keyframes tdxWander{0%{transform:translate(0,0)}33%{transform:translate(3cqw,-2cqw)}66%{transform:translate(-2cqw,-4cqw)}100%{transform:translate(1.5cqw,1cqw)}}
@keyframes tdxBlink{0%,100%{opacity:.15}50%{opacity:1}}
.tdx .tdx-mote{position:absolute;width:.3%;aspect-ratio:1;border-radius:50%;background:rgba(255,240,200,.7);animation:tdxWander var(--d) ease-in-out infinite alternate}
.tdx .tdx-gnat{position:absolute;width:1.4%;aspect-ratio:1.3;border-radius:50%;background:#141414;z-index:5;animation:tdxGnat var(--gd) linear var(--dl) infinite}
.tdx .tdx-gnat::before,.tdx .tdx-gnat::after{content:'';position:absolute;top:-55%;width:75%;height:90%;border-radius:50%;background:rgba(220,235,255,.75);animation:tdxWing .06s linear infinite alternate}
.tdx .tdx-gnat::before{left:-35%}.tdx .tdx-gnat::after{right:-35%}
@keyframes tdxWing{from{transform:rotate(-25deg) scaleY(.6)}to{transform:rotate(20deg) scaleY(1)}}
@keyframes tdxGnat{0%{transform:translate(0,0)}25%{transform:translate(4cqw,-2.5cqw)}50%{transform:translate(1cqw,3cqw)}75%{transform:translate(-3.5cqw,-.5cqw)}100%{transform:translate(0,0)}}

/* people */
.tdx .tdx-tok{position:absolute;transform:translate(-50%,-100%);transition:left .8s cubic-bezier(.3,.8,.25,1.05),top .8s cubic-bezier(.3,.8,.25,1.05),filter .4s,opacity .4s}
.tdx .tdx-tok .body{position:absolute;inset:0;transform-origin:50% 100%;animation:tdxBreathe 3.4s ease-in-out infinite}
@keyframes tdxBreathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.018)}}
.tdx .tdx-tok .face{position:absolute;inset:0;border-radius:14% 14% 10% 10%;overflow:hidden;border:2px solid rgba(20,16,24,.85);background:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.85) inset,0 6px 14px rgba(0,0,0,.35)}
.tdx .tdx-tok .face img{width:100%;height:100%;object-fit:cover;display:block}
.tdx .tdx-tok .shadow{position:absolute;left:10%;right:10%;bottom:-6%;height:12%;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.45),transparent 70%)}
.tdx .tdx-tok .tag{position:absolute;left:50%;bottom:-16%;transform:translateX(-50%);white-space:nowrap;font:400 1.05cqw/1 'Lilita One',sans-serif;letter-spacing:.04em;color:#fff;background:rgba(14,16,26,.82);padding:.3em .6em .2em;clip-path:polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)}
.tdx .tdx-tok.dim{filter:saturate(.7) brightness(.72)}
.tdx .tdx-tok.bg{filter:saturate(.8) brightness(.86)}
.tdx .tdx-tok.speak .face{box-shadow:0 0 0 2px rgba(255,255,255,.9) inset,0 0 0 3px var(--am),0 10px 22px rgba(0,0,0,.45)}
.tdx .tdx-tok.speak .tag{background:var(--or);color:#1a0e02}
.tdx .tdx-tok.host .tag{background:var(--am);color:#1a0e02}
.tdx .tdx-tok.out .face{box-shadow:0 0 0 3px var(--rd),0 0 30px rgba(216,67,63,.6)}
.tdx .tdx-tok.pop .body{animation:tdxTalk .5s cubic-bezier(.3,1.6,.5,1),tdxBreathe 3.4s ease-in-out .5s infinite}
@keyframes tdxTalk{0%{transform:scale(.88,1.1)}50%{transform:scale(1.06,.95)}100%{transform:scale(1)}}
.tdx .tdx-tok.laugh .body{animation:tdxLaugh .55s ease-in-out 3}
@keyframes tdxLaugh{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-7%) rotate(-4deg)}75%{transform:translateY(-5%) rotate(4deg)}}
.tdx .tdx-tok.shake .body{animation:tdxShake .45s linear}
@keyframes tdxShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7%) rotate(-5deg)}45%{transform:translateX(7%) rotate(5deg)}70%{transform:translateX(-4%)}}
.tdx .tdx-tok.leanL .face{transform:rotate(-7deg) translateX(-8%)}.tdx .tdx-tok.leanR .face{transform:rotate(7deg) translateX(8%)}
.tdx .tdx-tok.storm{animation:tdxStorm 1s cubic-bezier(.6,-.3,.8,.4) forwards}
@keyframes tdxStorm{0%{margin-left:0}25%{margin-left:-2%}100%{margin-left:70%;opacity:0}}
.tdx .tdx-tok.walk{animation:tdxWalk 3s ease-in forwards}
@keyframes tdxWalk{to{top:42%;height:3%;width:2%;opacity:0}}
.tdx .tdx-tok.walk .body{animation:tdxStep .4s ease-in-out infinite alternate}
@keyframes tdxStep{from{transform:rotate(-4deg)}to{transform:rotate(4deg) translateY(-4%)}}
.tdx .tdx-tok.act-fish .body{animation:tdxSway 4s ease-in-out infinite}
.tdx .tdx-tok.act-read .body,.tdx .tdx-tok.act-whittle .body{animation:tdxNod 5s ease-in-out infinite}
.tdx .tdx-tok.act-eat .body{animation:tdxChew 1.1s ease-in-out infinite}
.tdx .tdx-tok.act-stretch .body,.tdx .tdx-tok.act-sweep .body{animation:tdxStretch 3s ease-in-out infinite}
.tdx .tdx-tok.act-nap .body{animation:tdxNap 6s ease-in-out infinite}
.tdx .tdx-tok.act-fetch .body{animation:tdxSway 3s ease-in-out infinite}
@keyframes tdxSway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@keyframes tdxNod{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(3deg) translateY(2%)}}
@keyframes tdxChew{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.96) translateY(2%)}}
@keyframes tdxStretch{0%,100%{transform:rotate(-8deg) scaleY(1.02)}50%{transform:rotate(8deg) scaleY(1.04)}}
@keyframes tdxNap{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(-12deg) translateY(2%)}}
.tdx .tdx-busy{position:absolute;left:82%;top:-18%;width:42%;aspect-ratio:1;border-radius:50%;background:rgba(14,16,26,.85);border:2px solid rgba(255,255,255,.9);display:grid;place-items:center;animation:tdxBob 2.2s ease-in-out infinite}
.tdx .tdx-busy svg{width:62%;height:62%}
@keyframes tdxBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-12%)}}
.tdx .tdx-rod{position:absolute;left:70%;top:30%;width:120%;height:4px;background:#6a4a2a;transform-origin:0 50%;transform:rotate(-28deg)}
.tdx .tdx-rod i{position:absolute;left:100%;top:0;width:12%;aspect-ratio:1;border-radius:50%;background:linear-gradient(#e8433f 50%,#fff 50%);animation:tdxBob 2.4s ease-in-out infinite}
.tdx .tdx-zzz{position:absolute;left:70%;top:-20%;font:400 1.4cqw 'Lilita One';color:#fff;text-shadow:0 1px 2px #000;animation:tdxZ 2.6s ease-out infinite}
@keyframes tdxZ{from{transform:translate(0,0) scale(.6);opacity:1}to{transform:translate(40%,-120%) scale(1.2);opacity:0}}
.tdx .tdx-got{position:absolute;right:-8%;top:-8%;width:30%;aspect-ratio:1.1;border-radius:30%;background:#fffaf0;box-shadow:0 0 0 2px #1a1420;animation:tdxGot .5s cubic-bezier(.3,1.6,.5,1)}
@keyframes tdxGot{from{transform:scale(0)}to{transform:scale(1)}}

/* reactions */
.tdx .tdx-ring{position:absolute;aspect-ratio:1;border:3px solid var(--am);border-radius:50%;transform:translate(-50%,-50%);animation:tdxRing .9s ease-out forwards}
@keyframes tdxRing{from{width:6%;opacity:1}to{width:34%;opacity:0}}
.tdx .tdx-world.jolt{animation:tdxJolt .5s cubic-bezier(.3,1.6,.5,1)}
@keyframes tdxJolt{0%{transform:scale(1)}18%{transform:scale(1.045) translate(-.6%,.3%)}36%{transform:scale(1.03) translate(.7%,-.4%)}60%{transform:scale(1.015) translate(-.3%,.2%)}100%{transform:scale(1)}}
.tdx .tdx-pop.shock{color:#ff5a4f;font-size:4.2cqw}
.tdx .tdx-pop{position:absolute;transform:translate(-50%,-50%);font:400 3cqw/1 'Lilita One';color:var(--am);-webkit-text-stroke:1.5px #1a0e02;paint-order:stroke fill;text-shadow:0 3px 0 #1a0e02;animation:tdxPopW 1.1s cubic-bezier(.3,1.7,.5,1) forwards;white-space:nowrap}
@keyframes tdxPopW{0%{transform:translate(-50%,-50%) scale(0) rotate(-20deg)}30%{transform:translate(-50%,-50%) scale(1.2) rotate(-6deg)}80%{opacity:1}100%{transform:translate(-50%,-90%) scale(1) rotate(-6deg);opacity:0}}
.tdx .tdx-excl{position:absolute;transform:translate(-50%,-50%);width:2.4cqw;aspect-ratio:1;border-radius:50%;background:var(--rd);color:#fff;display:grid;place-items:center;font:400 1.6cqw/1 'Lilita One';box-shadow:0 0 0 2px #fff;animation:tdxExcl .9s cubic-bezier(.3,1.8,.5,1) forwards}
@keyframes tdxExcl{0%{transform:translate(-50%,-20%) scale(0)}40%{transform:translate(-50%,-60%) scale(1.15)}85%{opacity:1}100%{transform:translate(-50%,-70%);opacity:0}}
.tdx .tdx-heart{position:absolute;width:3cqw;transform:translate(-50%,-50%);animation:tdxHeart 1.3s ease-out forwards}
@keyframes tdxHeart{0%{transform:translate(-50%,-20%) scale(0)}30%{transform:translate(-50%,-60%) scale(1.2)}100%{transform:translate(-50%,-180%) scale(.9);opacity:0}}
.tdx .tdx-toss{position:absolute;width:2.2%;aspect-ratio:1.1;border-radius:30%;background:#fffaf0;box-shadow:0 0 0 1px rgba(0,0,0,.4),0 0 12px rgba(255,240,200,.8)}
.tdx .tdx-voteslip{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%) rotate(-3deg);background:#f6f0dc;color:#1a1420;padding:.6em 1.6em;font:400 3.2cqw/1 'Permanent Marker','Lilita One',cursive;box-shadow:0 10px 30px rgba(0,0,0,.5);animation:tdxSlip .45s cubic-bezier(.3,1.5,.5,1)}
.tdx .tdx-voteslip.dead{text-decoration:line-through;color:#8a2a2a}
@keyframes tdxSlip{from{transform:translate(-50%,10%) rotate(10deg) scale(.6);opacity:0}to{transform:translate(-50%,-50%) rotate(-3deg) scale(1);opacity:1}}

/* HUD */
.tdx .tdx-hud{position:absolute;inset:0;pointer-events:none;z-index:10}
.tdx .tdx-loc{position:absolute;left:2.2%;top:4%;display:flex;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))}
.tdx .tdx-loc .ic{width:4.2cqw;background:var(--or);color:#1a0e02;clip-path:polygon(0 0,100% 0,82% 100%,0 100%);display:grid;place-items:center;padding-right:12%}
.tdx .tdx-loc .ic svg{width:58%}
.tdx .tdx-loc .txt{background:var(--glass);color:var(--ht);padding:.45em 1.6em .45em 1.1em;margin-left:-6px;clip-path:polygon(8% 0,100% 0,92% 100%,0 100%)}
.tdx .tdx-loc .place{font:400 1.9cqw/1 'Lilita One';letter-spacing:.04em;text-transform:uppercase}
.tdx .tdx-loc .when{font:800 .95cqw/1.2 Nunito;color:var(--hd);letter-spacing:.1em;text-transform:uppercase;margin-top:3px}
.tdx .tdx-loc .when b{color:var(--am)}
.tdx .tdx-loc.fresh{animation:tdxLocIn .6s cubic-bezier(.2,.9,.3,1.1)}
@keyframes tdxLocIn{from{transform:translateX(-120%)}to{transform:none}}
.tdx .tdx-team{position:absolute;left:2.2%;top:calc(4% + 5.2cqw);font:900 .85cqw/1 Nunito;letter-spacing:.12em;text-transform:uppercase;color:#0c1a0a;background:var(--tc);padding:4px 9px;clip-path:polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)}
.tdx .tdx-plateh{position:absolute;right:2%;top:4%;display:flex;gap:5px;align-items:center;background:var(--glass);padding:7px 10px;border-radius:8px;color:var(--ht);font:900 .9cqw/1 Nunito;letter-spacing:.1em;text-transform:uppercase}
.tdx .tdx-plateh i{width:1.2cqw;aspect-ratio:1.1;border-radius:30%;background:#fffaf0;box-shadow:0 0 0 1px rgba(0,0,0,.4)}
.tdx .tdx-plateh i.gone{opacity:.18}
.tdx .tdx-tally{position:absolute;right:2%;top:4%;display:flex;flex-direction:column;gap:4px;background:var(--glass);padding:8px 10px;border-radius:8px;color:var(--ht);font:800 1cqw/1 Nunito;min-width:14cqw}
.tdx .tdx-tally span{display:flex;align-items:center;gap:6px}
.tdx .tdx-tally img{width:1.8cqw;height:1.8cqw;border-radius:4px;object-fit:cover}
.tdx .tdx-tally b{margin-left:auto;color:var(--rd);font:400 1.4cqw 'Lilita One'}
.tdx .tdx-tally .void{color:var(--hd);font-style:italic}
.tdx .tdx-chop{position:absolute;left:50%;top:13%;transform:translateX(-50%);font:400 1.6cqw/1 'Lilita One';letter-spacing:.12em;color:#fff;text-transform:uppercase;background:var(--rd);padding:.45em 1.2em .35em;clip-path:polygon(4% 0,100% 0,96% 100%,0 100%);animation:tdxChop 1.4s ease-in-out infinite}
@keyframes tdxChop{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.04)}}
.tdx .tdx-stage.tense .tdx-world{animation:tdxTense 1.6s ease-in-out infinite}
@keyframes tdxTense{0%,100%{transform:scale(1.08)}50%{transform:scale(1.1)}}
.tdx .tdx-cvig{position:absolute;inset:0;background:radial-gradient(ellipse 65% 72% at 50% 50%,transparent 55%,rgba(0,0,0,.55))}
.tdx .tdx-grain{position:absolute;inset:-40%;opacity:.1;mix-blend-mode:overlay;animation:tdxGrain .5s steps(4) infinite;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
@keyframes tdxGrain{0%{transform:translate(0,0)}25%{transform:translate(-5%,3%)}50%{transform:translate(4%,-2%)}75%{transform:translate(-2%,-5%)}100%{transform:translate(0,0)}}
.tdx .tdx-rec{position:absolute;right:2.5%;top:4%;font:400 1.4cqw 'Lilita One';letter-spacing:.12em;color:#fff;background:var(--cf);padding:.4em 1em .3em;clip-path:polygon(6% 0,100% 0,94% 100%,0 100%);text-transform:uppercase}
.tdx .tdx-static{position:absolute;inset:-20%;z-index:30;pointer-events:none;opacity:0;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.tdx .tdx-static.burst{animation:tdxBurst .45s steps(5) forwards}
@keyframes tdxBurst{0%{opacity:1;transform:translate(0,0)}25%{transform:translate(-5%,3%)}50%{opacity:1;transform:translate(4%,-2%)}75%{transform:translate(-2%,-4%)}100%{opacity:0}}
.tdx .tdx-ballot{position:absolute;inset:0;z-index:15;display:grid;place-items:center;pointer-events:none;overflow:hidden;background:radial-gradient(ellipse at 50% 45%,rgba(10,8,20,.25),rgba(6,6,14,.82))}
.tdx .tdx-ballot .glow{position:absolute;width:70%;aspect-ratio:2;border-radius:50%;background:radial-gradient(rgba(255,214,120,.35),transparent 65%);filter:blur(10px)}
.tdx .tdx-ballot .card{position:relative;width:54%;aspect-ratio:2.2;overflow:hidden;padding:2.2% 3%;box-sizing:border-box;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.55);transform:rotate(-3deg)}
.tdx .tdx-ballot.fresh .card{animation:tdxBalIn .55s cubic-bezier(.2,1.4,.4,1) both,tdxBalDrop .6s cubic-bezier(.6,0,.9,.5) 2.55s forwards}
.tdx .tdx-ballot .hd{font:900 1.05cqw/1 Nunito;letter-spacing:.18em;text-transform:uppercase;opacity:.75}
.tdx .tdx-ballot .ink{width:100%;height:62%;display:block;overflow:visible}
.tdx .tdx-ballot .ink text{font-family:Caveat,cursive;font-weight:700;fill:var(--ink);stroke:var(--ink);stroke-width:2.5;paint-order:stroke}
.tdx .tdx-ballot.fresh .ink text{fill:transparent;stroke-dasharray:3000;stroke-dashoffset:3000;animation:tdxWrite 1.7s cubic-bezier(.4,.1,.5,1) .55s forwards,tdxInkFill .35s ease-out 2.05s forwards}
.tdx .tdx-ballot .ul{fill:none;stroke:var(--ink);stroke-width:6;stroke-linecap:round}
.tdx .tdx-ballot.fresh .ul{stroke-dasharray:900;stroke-dashoffset:900;animation:tdxWrite .35s ease-out 2.2s forwards}
.tdx .tdx-ballot .by{position:absolute;right:3%;bottom:7%;display:flex;align-items:center;gap:.6cqw;font:800 1.15cqw/1 Nunito;opacity:.85}
.tdx .tdx-ballot .by img{width:2.6cqw;height:2.6cqw;border-radius:30%;object-fit:cover;border:2px solid currentColor}
.tdx .tdx-ballot .urn{position:absolute;bottom:2%;width:16%;opacity:0}
.tdx .tdx-ballot.fresh .urn{animation:tdxUrnIn .4s ease-out 2.3s forwards,tdxUrnBump .35s ease-out 3.05s}
.tdx .tdx-ballot:not(.fresh) .urn{opacity:1}
.tdx .tdx-ballot .stampx{position:absolute;right:6%;top:22%;padding:.3cqw 1.2cqw;border:.35cqw solid #c8282c;border-radius:8px;color:#c8282c;font:900 3.2cqw/1 'Special Elite',monospace;letter-spacing:.12em;transform:rotate(14deg);opacity:.85}
.tdx .tdx-ballot.fresh .stampx{opacity:0;animation:tdxStamp .3s cubic-bezier(.2,1.6,.4,1) 1.1s forwards}
.tdx .tdx-ballot.passport.fresh .card{animation:tdxBalIn .55s cubic-bezier(.2,1.4,.4,1) both,tdxStampShake .3s ease-out 1.15s}
.tdx .tdx-ballot .pp{display:flex;gap:2.5%;margin-top:3%;height:62%}
.tdx .tdx-ballot .pp img{width:24%;aspect-ratio:.8;height:auto;object-fit:cover;border:.25cqw solid #1d3a6b;border-radius:4px;filter:sepia(.25)}
.tdx .tdx-ballot .pf{display:flex;flex-direction:column;justify-content:center;gap:.3cqw}
.tdx .tdx-ballot .pf span{font:700 .85cqw/1 Nunito;text-transform:uppercase;letter-spacing:.12em;opacity:.6}
.tdx .tdx-ballot .pf b{font:400 2.6cqw/1.1 'Special Elite',monospace;margin-bottom:.6cqw}
.tdx .tdx-ballot .stampx small{display:block;font-size:.55em;text-align:center;letter-spacing:.4em}
@keyframes tdxBalIn{from{transform:translateY(-140%) rotate(-14deg);opacity:0}to{transform:translateY(0) rotate(-3deg);opacity:1}}
@keyframes tdxBalDrop{0%{transform:rotate(-3deg)}35%{transform:translateY(-4%) rotate(1deg) scale(1.03)}100%{transform:translateY(70%) rotate(10deg) scale(.6);opacity:0}}
@keyframes tdxStampShake{0%,100%{transform:rotate(-3deg)}30%{transform:translate(-1%,1%) rotate(-4deg)}60%{transform:translate(1%,-1%) rotate(-2deg)}}
@keyframes tdxWrite{to{stroke-dashoffset:0}}
@keyframes tdxInkFill{to{fill:var(--ink)}}
@keyframes tdxUrnIn{from{opacity:0;transform:translateY(60%)}to{opacity:1;transform:none}}
@keyframes tdxUrnBump{0%,100%{transform:scale(1)}40%{transform:scale(1.12,.9)}70%{transform:scale(.96,1.05)}}
@keyframes tdxStamp{from{opacity:0;transform:rotate(14deg) scale(2.6)}to{opacity:.9;transform:rotate(14deg) scale(1)}}
.tdx .tdx-ballot.camp .card{--ink:#2b2f52;color:#3b3550;background:repeating-linear-gradient(#fdf8e4 0 2.3cqw,#b8d0ea 2.3cqw calc(2.3cqw + 2px)),#fdf8e4;border-left:.5cqw solid #e48a8a}
.tdx .tdx-ballot.slate .card{--ink:#f4f1e8;color:#f4f1e8;background:#1d1f24;border-top:2.2cqw solid #fff;border-image:repeating-linear-gradient(-45deg,#fff 0 1.6cqw,#111 1.6cqw 3.2cqw) 1}
.tdx .tdx-ballot.passport .card{--ink:#1d3a6b;color:#1d3a6b;background:radial-gradient(circle at 80% 30%,rgba(200,40,44,.08),transparent 40%),repeating-linear-gradient(45deg,#e9f1e6 0 6px,#e1ebdd 6px 12px);border:2px solid #9bb59a}
.tdx .tdx-ballot.bamboo .card{--ink:#2a1a0e;color:#4a2e14;background:repeating-linear-gradient(90deg,#d9b56e 0 18%,#c9a25a 18% 19%,#d9b56e 19% 37%),#d9b56e;border-radius:18px}
.tdx .tdx-ballot.ticket .card{--ink:#b3121b;color:#7a1016;background:#f6e7c8;border-radius:4px;outline:.25cqw dashed rgba(122,16,22,.45);outline-offset:-1cqw}
.tdx .tdx-intro{position:absolute;inset:0;z-index:15;pointer-events:none;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:3%;background:linear-gradient(100deg,rgba(8,10,20,.0) 0%,rgba(8,10,20,.72) 30%,rgba(8,10,20,.72) 70%,rgba(8,10,20,0) 100%)}
.tdx .tdx-intro .sweep{position:absolute;left:-10%;right:-10%;top:28%;height:44%;background:linear-gradient(90deg,var(--or),#ffd23a);transform:skewY(-6deg);box-shadow:0 0 0 .4cqw #111,0 0 40px rgba(255,170,40,.5)}
.tdx .tdx-intro .streaks{position:absolute;inset:0;background:repeating-linear-gradient(-6deg,transparent 0 3cqw,rgba(255,255,255,.07) 3cqw 3.3cqw)}
.tdx .tdx-intro .port{position:relative;width:24%;aspect-ratio:1;border-radius:14%;overflow:hidden;border:.45cqw solid #111;box-shadow:0 0 0 .3cqw #fff,0 14px 40px rgba(0,0,0,.6);background:#fff;transform:rotate(-4deg)}
.tdx .tdx-intro .port img{width:100%;height:100%;object-fit:cover}
.tdx .tdx-intro .info{position:relative;color:#fff;max-width:44%;text-shadow:0 3px 0 #111}
.tdx .tdx-intro .num{font:900 1.05cqw/1 Nunito;letter-spacing:.3em;text-transform:uppercase;color:#111;text-shadow:none;margin-bottom:.6cqw}
.tdx .tdx-intro .nm{font:400 6.4cqw/1 'Lilita One';letter-spacing:.02em;-webkit-text-stroke:.25cqw #111;paint-order:stroke}
.tdx .tdx-intro .tag{display:inline-block;margin-top:.6cqw;padding:.35cqw 1.1cqw;background:#111;color:#ffd23a;font:400 1.7cqw/1 'Lilita One';letter-spacing:.06em;transform:skewX(-8deg);text-shadow:none}
.tdx .tdx-intro .facts{display:flex;gap:.6cqw;margin-top:.8cqw;flex-wrap:wrap}
.tdx .tdx-intro .facts span{padding:.3cqw .8cqw;background:rgba(255,255,255,.92);color:#111;font:800 1.05cqw/1 Nunito;text-transform:uppercase;letter-spacing:.08em;border-radius:3px;text-shadow:none}
.tdx .tdx-intro .stats{margin-top:1cqw;display:grid;gap:.45cqw;width:24cqw}
.tdx .tdx-intro .st{display:grid;grid-template-columns:7cqw 1fr;align-items:center;gap:.6cqw;font:900 .95cqw/1 Nunito;text-transform:uppercase;letter-spacing:.1em;color:#111;text-shadow:none}
.tdx .tdx-intro .st i{height:1cqw;background:rgba(0,0,0,.35);border-radius:9px;overflow:hidden;border:2px solid #111}
.tdx .tdx-intro .st b{display:block;height:100%;background:linear-gradient(90deg,#fff,#7af0ff)}
.tdx .tdx-intro.fresh .sweep{animation:tdxSweep .45s cubic-bezier(.2,1,.3,1) both}
.tdx .tdx-intro.fresh .port{animation:tdxPortIn .55s cubic-bezier(.2,1.5,.4,1) .1s both}
.tdx .tdx-intro.fresh .info>*{animation:tdxInfoIn .45s cubic-bezier(.2,1.3,.4,1) both}
.tdx .tdx-intro.fresh .nm{animation-delay:.25s}.tdx .tdx-intro.fresh .tag{animation-delay:.4s}.tdx .tdx-intro.fresh .facts{animation-delay:.5s}.tdx .tdx-intro.fresh .stats{animation-delay:.6s}
.tdx .tdx-intro.fresh .st b{animation:tdxBar .7s cubic-bezier(.2,1,.3,1) calc(.7s + var(--i) * .12s) both}
.tdx .tdx-intro.fresh .streaks{animation:tdxStreak .6s linear infinite}
@keyframes tdxSweep{from{transform:skewY(-6deg) translateX(-110%)}to{transform:skewY(-6deg) translateX(0)}}
@keyframes tdxPortIn{from{transform:translateX(-60cqw) rotate(-30deg) scale(.6)}to{transform:rotate(-4deg)}}
@keyframes tdxInfoIn{from{opacity:0;transform:translateX(18cqw)}to{opacity:1;transform:none}}
@keyframes tdxBar{from{width:0}}
@keyframes tdxStreak{to{background-position:9cqw 0}}
.tdx .tdx-ride{position:absolute;width:16%;transform:translate(-50%,-70%);animation:tdxRide 2.6s cubic-bezier(.3,.7,.4,1) forwards;pointer-events:none;z-index:3}
.tdx .tdx-ride svg{width:100%;display:block}
.tdx .tdx-ride.boat svg,.tdx .tdx-ride.canoe svg{animation:tdxRideBob 1s ease-in-out infinite alternate}
.tdx .tdx-ride.bus{width:20%;animation-name:tdxBus}
@keyframes tdxRide{0%{margin-left:-70cqw;opacity:1}38%{margin-left:0}62%{margin-left:0;opacity:1}100%{margin-left:70cqw;opacity:0}}
@keyframes tdxBus{0%{margin-left:80cqw}40%{margin-left:0}64%{margin-left:0;opacity:1}100%{margin-left:-80cqw;opacity:0}}
@keyframes tdxRideBob{from{transform:translateY(0) rotate(-1.5deg)}to{transform:translateY(-6%) rotate(1.5deg)}}
.tdx .tdx-ride.big{width:34%;z-index:4}
.tdx .tdx-ride.big.helicopter{width:26%;animation:tdxHeli 4.2s cubic-bezier(.3,.7,.4,1) forwards}
.tdx .tdx-ride.big.helicopter .rot{transform-origin:120px 11px;animation:tdxRotor .12s linear infinite}
.tdx .tdx-ride.big.jet{width:52%;animation:tdxTaxi 4.2s cubic-bezier(.25,.8,.35,1) forwards}
.tdx .tdx-ride.big.bus,.tdx .tdx-ride.big.tram{animation:tdxBus 4.2s cubic-bezier(.3,.7,.4,1) forwards}
.tdx .tdx-ride.big.boat{animation:tdxRide 4.2s cubic-bezier(.3,.7,.4,1) forwards}
@keyframes tdxHeli{0%{margin-left:70cqw;margin-top:-30cqw;transform:translate(-50%,-70%) rotate(-12deg)}40%{margin-left:0;margin-top:0;transform:translate(-50%,-70%) rotate(-4deg)}50%,70%{margin-top:3cqw;transform:translate(-50%,-70%) rotate(0)}100%{margin-left:-80cqw;margin-top:-34cqw;transform:translate(-50%,-70%) rotate(10deg)}}
@keyframes tdxRotor{from{transform:scaleX(1)}50%{transform:scaleX(.15)}to{transform:scaleX(1)}}
@keyframes tdxTaxi{0%{margin-left:80cqw}55%{margin-left:6cqw}100%{margin-left:0}}
.tdx .tdx-ride .veh{position:relative;width:100%}
.tdx .tdx-ride .veh>img:first-child{width:100%;display:block;filter:drop-shadow(0 1cqw 1.2cqw rgba(0,0,0,.35))}
.tdx .tdx-ride .rider{position:absolute;width:9%;aspect-ratio:1;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#fff;border:.18cqw solid #111;transform:translate(-50%,-100%);animation:tdxWave .7s ease-in-out calc(var(--i) * .15s) infinite alternate}
@keyframes tdxWave{from{transform:translate(-50%,-100%) rotate(-6deg)}to{transform:translate(-50%,-112%) rotate(6deg)}}
.tdx .tdx-ride.boat .veh,.tdx .tdx-ride.yacht .veh{animation:tdxRideBob 1.3s ease-in-out infinite alternate}
.tdx .tdx-ride.bus .veh,.tdx .tdx-ride.tram svg{animation:tdxIdle .11s linear infinite alternate}
@keyframes tdxIdle{from{transform:translateY(0)}to{transform:translateY(.6%)}}
.tdx .tdx-ride.helicopter .veh{animation:tdxHover 1.1s ease-in-out infinite alternate}
@keyframes tdxHover{from{transform:translateY(0) rotate(-1deg)}to{transform:translateY(-4%) rotate(1deg)}}
.tdx .tdx-ride .rotor{position:absolute;left:3%;top:1.5%;width:63%;height:8%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(190,230,255,0) 0 18%,rgba(140,200,240,.55) 45%,rgba(140,200,240,0) 72%);animation:tdxBlade .09s linear infinite}
.tdx .tdx-ride .rotor.tail{left:21%;top:4%;width:12%;height:28%;animation-duration:.06s}
@keyframes tdxBlade{0%{transform:scaleX(1);opacity:.9}50%{transform:scaleX(.35);opacity:.5}100%{transform:scaleX(1);opacity:.9}}
.tdx .tdx-ride.yacht{width:22%}
.tdx .tdx-ride.big.yacht{width:44%;animation:tdxDriveL 4.6s cubic-bezier(.3,.7,.4,1) forwards}
.tdx .tdx-ride.big.boat{width:36%;animation:tdxDriveR 4.6s cubic-bezier(.3,.7,.4,1) forwards}
.tdx .tdx-ride.big.bus{width:46%;animation:tdxDriveR 4.6s cubic-bezier(.3,.7,.4,1) forwards}
.tdx .tdx-ride.big.helicopter{width:34%;animation:tdxHeliR 4.6s cubic-bezier(.3,.7,.4,1) forwards}
.tdx .tdx-ride.boat{animation-name:tdxRide}.tdx .tdx-ride.yacht:not(.big){animation-name:tdxBus}
@keyframes tdxDriveR{0%{margin-left:-85cqw}42%{margin-left:0}66%{margin-left:0;opacity:1}100%{margin-left:85cqw;opacity:1}}
@keyframes tdxDriveL{0%{margin-left:85cqw}42%{margin-left:0}66%{margin-left:0;opacity:1}100%{margin-left:-85cqw;opacity:1}}
@keyframes tdxHeliR{0%{margin-left:-75cqw;margin-top:-34cqw;transform:translate(-50%,-70%) rotate(9deg)}40%{margin-left:0;margin-top:0;transform:translate(-50%,-70%) rotate(3deg)}48%,70%{margin-top:4cqw;transform:translate(-50%,-70%) rotate(0)}100%{margin-left:80cqw;margin-top:-36cqw;transform:translate(-50%,-70%) rotate(12deg)}}
.tdx .tdx-tok.stepoff{animation:tdxStepOff .7s cubic-bezier(.3,1.4,.5,1) both}
@keyframes tdxStepOff{from{transform:translate(-50%,-100%) translateY(-7%) scale(.94);filter:brightness(.6)}to{}}
.tdx .tdx-tok.board{transition:left 2.6s ease-in,opacity 2.6s ease-in;left:118%!important;opacity:0}
.tdx .tdx-tok.board .body{animation:tdxStep .4s ease-in-out infinite alternate}
.tdx .tdx-tok.jump{animation:tdxJump 1.1s cubic-bezier(.5,0,.8,.6) forwards}
@keyframes tdxJump{0%{}30%{transform:translate(-50%,-100%) translateY(4%) scale(1.02,.94)}55%{transform:translate(-50%,-100%) translate(-30%,-30%) rotate(-14deg) scale(.8)}100%{transform:translate(-50%,-100%) translate(-80%,-20%) rotate(-40deg) scale(.25);opacity:0}}
.tdx .tdx-tok.chute{animation:tdxChute 6s ease-out forwards}
.tdx .tdx-tok.chute::before{content:'';position:absolute;left:50%;bottom:92%;width:150%;aspect-ratio:2;transform:translateX(-50%);background:no-repeat center/contain url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 130'%3E%3Cpath d='M10 60Q100-40 190 60Q172 50 155 60Q138 50 118 60Q100 50 82 60Q62 50 45 60Q28 50 10 60z' fill='%23e8433f' stroke='%23111' stroke-width='5'/%3E%3Cpath d='M82 60Q100 0 118 60' fill='%23fff' stroke='%23111' stroke-width='4'/%3E%3Cpath d='M12 60L92 128M188 60L108 128M82 60L96 128M118 60L104 128' stroke='%23111' stroke-width='2.5' fill='none'/%3E%3C/svg%3E");animation:tdxChuteOpen .5s cubic-bezier(.2,1.6,.4,1) .5s both}
@keyframes tdxChute{0%{margin-top:-30cqw}12%{margin-top:-6cqw}100%{margin-top:18cqw}}
@keyframes tdxChuteOpen{from{transform:translateX(-50%) scale(.1,.1)}to{transform:translateX(-50%)}}
.tdx .tdx-tok.chute .body{animation:tdxSwing 1.6s ease-in-out infinite alternate;transform-origin:50% -40%}
@keyframes tdxSwing{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
.tdx .tdx-park{position:absolute;pointer-events:none}
.tdx .tdx-park img{width:100%;display:block}
.tdx .tdx-park.limo img{animation:tdxIdle .11s linear infinite alternate}
.tdx .tdx-park.clownboat img{animation:tdxRideBob 1.6s ease-in-out infinite alternate}
.tdx .tdx-park.inL{animation:tdxParkL 3.4s cubic-bezier(.2,.7,.3,1) both}.tdx .tdx-park.inR{animation:tdxParkR 4s cubic-bezier(.2,.7,.3,1) both}
.tdx .tdx-park.out{animation:tdxLeave 4.2s cubic-bezier(.55,0,.8,.5) .4s forwards}
@keyframes tdxParkL{from{transform:translateX(-130cqw)}to{transform:none}}
@keyframes tdxParkR{from{transform:translateX(110cqw)}to{transform:none}}
@keyframes tdxLeave{to{transform:translateX(140cqw)}}
.tdx .tdx-puff{position:absolute;width:3.2%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(205,205,215,.8),rgba(150,150,165,0) 70%);transform:translate(-50%,-50%);animation:tdxPuff 1.8s ease-out forwards;pointer-events:none}
@keyframes tdxPuff{from{transform:translate(-50%,-50%) scale(.4);opacity:.9}to{transform:translate(-170%,-150%) scale(2.8);opacity:0}}
.tdx .tdx-tok.going .body{animation:tdxStep .4s ease-in-out infinite alternate}
.tdx .tdx-tok.aboard{translate:var(--bx,0) var(--by,0)}
.tdx .tdx-tok.walkin{animation:tdxWalkIn 1.2s cubic-bezier(.3,.8,.3,1) both}
@keyframes tdxWalkIn{from{margin-left:-40cqw;opacity:0}to{margin-left:0;opacity:1}}
.tdx .tdx-title{position:absolute;inset:0;z-index:15;display:grid;place-items:center;overflow:hidden;background:rgba(8,10,18,.4)}
.tdx .tdx-title .band{position:absolute;left:-10%;right:-10%;top:30%;height:40%;background:var(--or);transform:rotate(-6deg);box-shadow:0 0 0 6px #12141c,0 0 0 9px var(--am)}
.tdx .tdx-title.tdx-ballots .band{background:var(--cf)}
.tdx .tdx-title .inner{position:relative;text-align:center;transform:rotate(-6deg)}
.tdx .tdx-title .kicker{font:900 1.3cqw Nunito;letter-spacing:.3em;text-transform:uppercase;color:#1a0e02}
.tdx .tdx-title.tdx-ballots .kicker{color:#fff}
.tdx .tdx-title .big{font:400 6.5cqw/1 'Lilita One';color:#fff;-webkit-text-stroke:2px #1a0e02;paint-order:stroke fill;text-shadow:0 5px 0 #1a0e02;text-transform:uppercase}
.tdx .tdx-title.tdx-ballots .big{font-size:4cqw}
.tdx .tdx-title .faces{position:absolute;display:flex;gap:1.2cqw;bottom:7%;left:50%;transform:translateX(-50%)}
.tdx .tdx-title .faces img{width:10cqw;aspect-ratio:1;object-fit:cover;border-radius:10px;border:3px solid #fff;box-shadow:0 8px 20px rgba(0,0,0,.5)}
.tdx .tdx-title.tdx-ballots .faces img{width:6.5cqw}
.tdx .tdx-title.tdx-ballots .faces span{position:relative}
.tdx .tdx-title.tdx-ballots .faces b{position:absolute;right:-6%;bottom:-6%;width:2.2cqw;aspect-ratio:1;border-radius:50%;background:var(--gr);color:#fff;display:grid;place-items:center;font:900 1.2cqw Nunito;animation:tdxGot .4s cubic-bezier(.3,1.6,.5,1) calc(var(--i)*.12s) backwards}
.tdx .tdx-title.fresh .band{animation:tdxBand .5s cubic-bezier(.2,.9,.3,1)}
@keyframes tdxBand{from{transform:rotate(-6deg) translateX(-110%)}to{transform:rotate(-6deg)}}
.tdx .tdx-title.fresh .big{animation:tdxSlam .55s .15s cubic-bezier(.3,1.6,.5,1) backwards}
@keyframes tdxSlam{from{transform:scale(2.4);opacity:0}to{transform:none;opacity:1}}
.tdx .tdx-title.fresh .faces img{animation:tdxRise .45s cubic-bezier(.3,1.6,.5,1) .3s backwards}
@keyframes tdxRise{from{transform:translateY(60%);opacity:0}to{transform:none;opacity:1}}
.tdx .tdx-idol{position:absolute;inset:0;z-index:15;display:grid;place-items:center;background:rgba(10,8,4,.55);overflow:hidden}
.tdx .tdx-idol .rays{position:absolute;left:50%;top:45%;width:160%;aspect-ratio:1;transform:translate(-50%,-50%);background:repeating-conic-gradient(rgba(255,200,90,.28) 0 8deg,transparent 8deg 18deg);animation:tdxSpin 18s linear infinite;border-radius:50%}
@keyframes tdxSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}
.tdx .tdx-idol .totem{position:absolute;left:50%;top:38%;width:9cqw;transform:translate(-50%,-50%);filter:drop-shadow(0 0 20px rgba(255,200,90,.9))}
.tdx .tdx-idol .lbl{position:absolute;left:50%;top:64%;transform:translateX(-50%);font:400 3cqw/1 'Lilita One';color:var(--am);-webkit-text-stroke:1.5px #1a0e02;paint-order:stroke fill;text-transform:uppercase;white-space:nowrap}
.tdx .tdx-idol .for{position:absolute;left:50%;top:73%;transform:translateX(-50%);display:flex;gap:1cqw;align-items:center;color:#fff;font:400 3cqw 'Lilita One'}
.tdx .tdx-idol .for img{width:7cqw;aspect-ratio:1;object-fit:cover;border-radius:10px;border:3px solid var(--am)}
.tdx .tdx-idol.fresh .totem{animation:tdxRaise .8s cubic-bezier(.3,1.5,.5,1)}
@keyframes tdxRaise{from{transform:translate(-50%,40%) scale(.4);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
.tdx .tdx-outcard{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);z-index:14;text-align:center;color:#fff;font:400 2.6cqw 'Lilita One'}
.tdx .tdx-outcard img{width:13cqw;aspect-ratio:1;object-fit:cover;border-radius:12px;border:4px solid var(--rd);box-shadow:0 0 50px rgba(216,67,63,.6);filter:grayscale(.3)}
.tdx .tdx-outcard span{display:inline-block;margin-top:.4em;background:var(--rd);padding:.3em 1em .2em;letter-spacing:.1em;text-transform:uppercase;font-size:1.6cqw}
.tdx .tdx-outcard.fresh{animation:tdxOut .7s cubic-bezier(.3,1.5,.5,1)}
@keyframes tdxOut{from{transform:translate(-50%,-50%) scale(1.6);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}

/* the dialogue panel */
.tdx .tdx-dlg{position:absolute;left:2.2%;right:2.2%;bottom:3.2%;min-height:21%;z-index:12;pointer-events:none}
.tdx .tdx-dlg.hidden{display:none}
.tdx .tdx-dlg .panel{position:absolute;inset:0;background:var(--glass);clip-path:polygon(1.4% 0,100% 0,98.6% 100%,0 100%);border-top:3px solid var(--or);box-shadow:0 8px 30px rgba(0,0,0,.45)}
.tdx .tdx-dlg.conf .panel{border-top-color:var(--cf)}
.tdx .tdx-dlg .sub{position:absolute;left:calc(var(--cut,0%) + 3%);top:-5.2cqw;display:none;gap:.5em;align-items:center;font:900 .95cqw/1 Nunito;letter-spacing:.14em;text-transform:uppercase;color:#fff}
.tdx .tdx-dlg .sub.on{display:flex}
.tdx .tdx-dlg .sub b{padding:.35em .8em;background:var(--stc,#555);clip-path:polygon(0 0,100% 0,94% 100%,0 100%);color:#0c0c12}
.tdx .tdx-dlg .sub span{padding:.35em .7em;background:rgba(12,12,20,.82);border-radius:3px}
.tdx .tdx-dlg .name{position:absolute;left:calc(var(--cut,0%) + 3%);top:-1.3em;font:400 1.8cqw/1 'Lilita One';letter-spacing:.06em;color:#0c1a0a;padding:.32em 1.2em .26em .9em;background:var(--tc,var(--gr));clip-path:polygon(0 0,100% 0,90% 100%,0 100%);text-transform:uppercase}
.tdx .tdx-dlg .name.host{background:var(--am);color:#1a0e02}
.tdx .tdx-dlg .name.conf{background:var(--cf);color:#fff}
.tdx .tdx-dlg .name:empty{display:none}
.tdx .tdx-dlg .say{position:relative;padding:1.15em 3.4em 1em calc(var(--cut,0%) + 3%);color:var(--ht);font:800 1.75cqw/1.42 Nunito}
.tdx .tdx-dlg .say.dir{font:700 italic 1.55cqw/1.45 Nunito;color:#c9cdd9}
.tdx .tdx-dlg .say.quote{font:800 italic 1.8cqw/1.4 Nunito}
.tdx .tdx-dlg .say .hn{color:var(--am)}.tdx .tdx-dlg .say .hg{color:var(--te)}
.tdx .tdx-dlg .say.punch{animation:tdxPunch .3s cubic-bezier(.3,1.7,.5,1);transform-origin:0 50%}
@keyframes tdxPunch{from{transform:scale(.85);opacity:0}to{transform:none;opacity:1}}
.tdx .tdx-dlg .badge{display:inline-block;margin-right:.6em;font:900 .9cqw/1 Nunito;letter-spacing:.12em;text-transform:uppercase;color:#1a0e02;background:var(--te);padding:.35em .6em;border-radius:4px;font-style:normal;vertical-align:.2em}
.tdx .tdx-dlg .nx{position:absolute;right:2.4%;bottom:14%;width:1.4cqw;aspect-ratio:1;background:var(--am);clip-path:polygon(0 0,100% 50%,0 100%);animation:tdxNx .8s ease-in-out infinite alternate}
@keyframes tdxNx{from{transform:translateX(0)}to{transform:translateX(5px)}}
.tdx .tdx-dlg .caret{display:inline-block;width:.45em;height:1em;background:var(--am);vertical-align:-2px;margin-left:2px;animation:tdxCaret .7s steps(2) infinite}
@keyframes tdxCaret{50%{opacity:0}}
.tdx .tdx-dlg.loud .panel{animation:tdxDShake .35s linear}
@keyframes tdxDShake{0%,100%{transform:none}25%{transform:translateX(-6px)}50%{transform:translateX(5px)}75%{transform:translateX(-3px)}}
.tdx .tdx-cut{position:absolute;left:0;bottom:0;width:15%;aspect-ratio:.82;clip-path:polygon(10% 0,100% 0,88% 100%,0 100%);overflow:hidden;background:#222}
.tdx .tdx-cut img{width:100%;height:100%;object-fit:cover;object-position:50% 20%}
.tdx .tdx-cut.fresh{animation:tdxCutIn .45s cubic-bezier(.2,.9,.3,1.1)}
@keyframes tdxCutIn{from{transform:translateX(-60%);opacity:0}to{transform:none;opacity:1}}

/* the Intel drawer */
.tdx .tdx-ibtn{position:absolute;right:2%;bottom:27%;z-index:13;pointer-events:auto;border:0;background:var(--glass);color:var(--ht);font:900 .9cqw Nunito;letter-spacing:.12em;text-transform:uppercase;padding:.8em 1.1em;border-radius:8px;cursor:pointer;display:flex;gap:6px;align-items:center}
.tdx .tdx-ibtn i{width:7px;height:7px;border-radius:50%;background:var(--rd);display:none}
.tdx .tdx-ibtn.new i{display:inline-block}
.tdx .tdx-intel{position:absolute;top:0;right:0;bottom:0;width:min(34%,340px);background:var(--glass2);z-index:16;transform:translateX(100%);transition:transform .35s cubic-bezier(.3,.8,.3,1);color:var(--ht);padding:14px 14px 0;display:flex;flex-direction:column;border-left:2px solid var(--or);cursor:default}
.tdx .tdx-stage.intel-open .tdx-intel{transform:none}
.tdx .tdx-ihead{position:relative}
.tdx .tdx-ic.why .vrow{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.tdx .tdx-ic.why .vrow img{width:22px;height:22px;border-radius:50%;object-fit:cover;object-position:50% 15%;border:1px solid rgba(255,255,255,.25)}
.tdx .tdx-ic .chips{display:flex;gap:4px;flex-wrap:wrap;margin:5px 0 3px}
.tdx .tdx-ic .chip{font:800 10px/1 Nunito;letter-spacing:.04em;padding:3px 7px;border-radius:9px;background:rgba(255,255,255,.08);color:#cfd6e4}
.tdx .tdx-ic .chip.ally{background:rgba(122,200,255,.16);color:#9fd8ff}
.tdx .tdx-ic .chip.tag{background:rgba(255,190,80,.14);color:#ffcf7a;text-transform:uppercase}
.tdx .tdx-ic.betray{border-left:3px solid #f85149}
.tdx .tdx-ic .bet{font:800 11px/1.35 Nunito;color:#ff8a80;margin:4px 0}
.tdx .tdx-iclose{position:absolute;top:-2px;right:-2px;width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font:700 20px/1 Nunito;cursor:pointer;display:grid;place-items:center}
.tdx .tdx-iclose:hover,.tdx .tdx-iclose:focus-visible{background:var(--or);border-color:var(--or);outline:none}
.tdx .tdx-ihead b{display:block;font:400 18px 'Lilita One';letter-spacing:.05em;text-transform:uppercase}
.tdx .tdx-ihead span{font:700 11px Nunito;color:var(--hd)}
.tdx .tdx-itabs{display:flex;gap:4px;margin:10px 0;flex-wrap:wrap}
.tdx .tdx-itabs button{border:0;background:rgba(255,255,255,.07);color:var(--hd);border-radius:6px;padding:6px 8px;cursor:pointer;font:800 11px Nunito;position:relative}
.tdx .tdx-itabs button.on{background:var(--or);color:#1a0e02}
.tdx .tdx-itabs button i{position:absolute;top:2px;right:2px;width:6px;height:6px;border-radius:50%;background:var(--rd)}
.tdx .tdx-ilist{overflow:auto;flex:1;padding-bottom:12px}
.tdx .tdx-ic{background:rgba(255,255,255,.05);border-radius:8px;padding:8px 10px;margin-bottom:7px;font:700 12px/1.35 Nunito;color:#d8dbe6;border-left:3px solid var(--te)}
.tdx .tdx-ic b{color:#fff}.tdx .tdx-ic .k{color:var(--am)}.tdx .tdx-ic small{color:var(--hd);font-size:11px}
.tdx .tdx-ic.fresh{animation:tdxInR .5s ease-out}
@keyframes tdxInR{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}
.tdx .tdx-ic .minis{display:flex;gap:3px;margin-top:5px}.tdx .tdx-ic .minis img{width:24px;height:24px;border-radius:5px;object-fit:cover}
.tdx .tdx-ic.tally{display:flex;gap:8px;align-items:center;border-left-color:var(--rd)}
.tdx .tdx-ic.tally img{width:30px;height:30px;border-radius:6px;object-fit:cover}
.tdx .tdx-ic.tally span{margin-left:auto;font:400 18px 'Lilita One';color:var(--rd)}
.tdx .tdx-iempty{font:700 12px Nunito;color:var(--hd)}

/* under the stage */
.tdx .tdx-ctrl{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:10px}
.tdx .tdx-btn{border:1px solid rgba(255,255,255,.12);background:#171a24;color:#e9ebf1;border-radius:9px;padding:8px 12px;cursor:pointer;font:800 12px Nunito;display:inline-flex;gap:6px;align-items:center}
.tdx .tdx-btn.go{background:var(--or);color:#1a0e02;border-color:var(--or);padding:8px 20px}
.tdx .tdx-btn.on{background:var(--te);color:#04201f;border-color:var(--te)}
.tdx .tdx-btn kbd{font:900 10px Nunito;padding:1px 5px;border-radius:4px;background:rgba(0,0,0,.2)}
.tdx .tdx-chap{flex:1;min-width:140px;display:flex;gap:3px;position:relative;padding:9px 0;cursor:pointer;touch-action:none;user-select:none}
.tdx .tdx-chap i{flex:1;height:6px;border-radius:3px;background:#2a2f3e;position:relative;overflow:hidden;transition:height .15s}
.tdx .tdx-chap:hover i{height:10px}.tdx .tdx-chap i:hover{background:#3a4156}
.tdx .tdx-chap .head{position:absolute;top:50%;left:0;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid var(--or);transform:translate(-50%,-50%);box-shadow:0 1px 4px rgba(0,0,0,.5);pointer-events:none;transition:left .3s}
.tdx .tdx-chap i b{position:absolute;inset:0;width:0;background:var(--or);transition:width .3s}
.tdx .tdx-count{font:800 11px Nunito;color:#8d93a6;letter-spacing:.08em}
.tdx details.tdx-script{margin-top:10px;background:#141720;border-radius:10px;border:1px solid rgba(255,255,255,.08)}
.tdx details.tdx-script summary{cursor:pointer;padding:9px 14px;font:800 11px Nunito;letter-spacing:.14em;text-transform:uppercase;color:#8d93a6}
.tdx .tdx-lines{max-height:240px;overflow:auto;padding:0 14px 12px}
.tdx .tdx-ln{display:none;padding:3px 8px;border-radius:6px;cursor:pointer;font:700 13px/1.45 Nunito;color:#b9bfce}
/* the islands (twists.js) */
.tdx .tdx-tok.arrive{animation:tdxArrive 1.6s cubic-bezier(.25,.8,.3,1) backwards}
@keyframes tdxArrive{from{margin-left:-40%;opacity:0}30%{opacity:1}to{margin-left:0}}
.tdx .tdx-tok.arrive .body{animation:tdxStep .35s ease-in-out 4 alternate}
.tdx .tdx-tok.train .body{animation:tdxTrain .38s ease-in-out 6 alternate}
@keyframes tdxTrain{from{transform:translateY(0) scale(1,1)}to{transform:translateY(-10%) scale(.96,1.05)}}
.tdx .tdx-tok.sad .body{animation:tdxSad 1.2s ease-out forwards}
@keyframes tdxSad{to{transform:translateY(6%) rotate(-5deg) scaleY(.94)}}
.tdx .tdx-tok.sad .face{filter:saturate(.5) brightness(.8)}
.tdx .tdx-tear{position:absolute;width:.5cqw;height:.8cqw;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#9ad8ff;box-shadow:0 0 6px #9ad8ff;animation:tdxTear 1.4s ease-in forwards}
@keyframes tdxTear{from{transform:translate(-50%,0);opacity:1}to{transform:translate(-50%,6cqw);opacity:0}}
.tdx .tdx-tok.fired .face{box-shadow:0 0 0 3px var(--or),0 0 34px rgba(255,138,31,.85)}
.tdx .tdx-aura{position:absolute;width:12cqw;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,170,60,.55),rgba(255,90,20,.15) 55%,transparent 70%);animation:tdxAura 2.4s ease-out forwards;mix-blend-mode:screen}
@keyframes tdxAura{0%{transform:translate(-50%,-50%) scale(.2);opacity:0}25%{opacity:1}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}
.tdx .tdx-tok.search{animation:tdxSearch 2.8s ease-in-out}
@keyframes tdxSearch{0%,100%{margin-left:0}25%{margin-left:-22%}55%{margin-left:18%}80%{margin-left:-8%}}
.tdx .tdx-tok.search .body{animation:tdxDig .3s ease-in-out 9 alternate}
@keyframes tdxDig{from{transform:rotate(0)}to{transform:rotate(14deg) translateY(6%)}}
.tdx .tdx-dust{position:absolute;width:3cqw;aspect-ratio:2;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(ellipse,rgba(230,210,160,.8),transparent 70%);animation:tdxDust .9s ease-out forwards}
@keyframes tdxDust{from{transform:translate(-50%,-50%) scale(.3);opacity:1}to{transform:translate(-50%,-90%) scale(1.8);opacity:0}}
.tdx .tdx-tok.pathR{animation:tdxPathR 3.2s ease-in forwards}.tdx .tdx-tok.pathL{animation:tdxPathL 3.2s ease-in forwards}
@keyframes tdxPathR{to{left:62%;top:56%;height:6%;width:3.4%;opacity:0}}
@keyframes tdxPathL{to{left:36%;top:56%;height:6%;width:3.4%;opacity:0}}
.tdx .tdx-tok.pathR .body,.tdx .tdx-tok.pathL .body{animation:tdxStep .4s ease-in-out infinite alternate}
.tdx .tdx-gain{position:absolute;transform:translate(-50%,-50%);font:900 1.5cqw/1 Nunito;letter-spacing:.08em;text-transform:uppercase;color:#1a0e02;background:var(--gr);padding:.35em .7em;border-radius:99px;box-shadow:0 0 0 2px #fff,0 6px 14px rgba(0,0,0,.4);animation:tdxGain 2.2s ease-out forwards;white-space:nowrap}
.tdx .tdx-gain.down{background:var(--rd);color:#fff}
@keyframes tdxGain{0%{transform:translate(-50%,0) scale(.3);opacity:0}15%{transform:translate(-50%,-60%) scale(1.1);opacity:1}80%{opacity:1}100%{transform:translate(-50%,-160%) scale(1);opacity:0}}
.tdx .tdx-rain{position:absolute;top:-10%;width:1px;height:7%;background:linear-gradient(transparent,rgba(200,215,255,.8));transform:rotate(12deg);animation:tdxRain var(--d) linear var(--dl) infinite}
@keyframes tdxRain{to{transform:translate(-14cqw,62cqw) rotate(12deg)}}
.tdx .tdx-flash{position:absolute;inset:0;background:#dfe6ff;opacity:0;mix-blend-mode:screen;animation:tdxFlash 14s linear infinite}
@keyframes tdxFlash{0%,90.5%,92%,93.5%,100%{opacity:0}91%{opacity:.5}93%{opacity:.3}}
.tdx .tdx-rays{position:absolute;inset:-30% -10% 10% -30%;pointer-events:none;mix-blend-mode:screen;opacity:.85;
  background:repeating-conic-gradient(from 200deg at 12% 0%,rgba(255,236,170,.0) 0deg 6deg,rgba(255,236,170,.55) 8deg 12deg,rgba(255,236,170,0) 14deg 21deg),radial-gradient(ellipse at 12% 0%,rgba(255,214,120,.55),rgba(255,214,120,0) 55%);
  -webkit-mask:radial-gradient(ellipse at 12% 0%,#000 30%,transparent 80%);mask:radial-gradient(ellipse at 12% 0%,#000 30%,transparent 80%);animation:tdxRays 18s ease-in-out infinite alternate}
.tdx .tdx-rays.hot{opacity:.8;filter:sepia(.4) saturate(1.6)}
@keyframes tdxRays{from{transform:rotate(-2deg)}to{transform:rotate(3deg)}}
.tdx .tdx-haze{position:absolute;left:0;right:0;top:45%;height:22%;pointer-events:none;background:linear-gradient(transparent,rgba(255,200,120,.16),transparent);animation:tdxHaze 3.2s ease-in-out infinite alternate}
@keyframes tdxHaze{from{transform:scaleY(1) translateY(0)}to{transform:scaleY(1.15) translateY(-1.5%)}}
.tdx .tdx-grey{position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(70,80,100,.42),rgba(60,66,80,.22));mix-blend-mode:multiply;-webkit-backdrop-filter:saturate(.6);backdrop-filter:saturate(.6)}
.tdx .tdx-grey.storm{background:linear-gradient(rgba(36,40,60,.62),rgba(40,44,60,.4))}
.tdx .tdx-grey.night{background:linear-gradient(rgba(20,24,40,.35),rgba(20,24,40,.2))}
.tdx .tdx-grey.indoor{background:rgba(40,46,62,.28)}
.tdx .tdx-rain.hard{width:1.5px;height:10%;transform:rotate(22deg);animation-name:tdxRainHard}
@keyframes tdxRainHard{to{transform:translate(-26cqw,62cqw) rotate(22deg)}}
.tdx .tdx-splash{position:absolute;width:1.2%;height:.5%;border:1px solid rgba(220,230,255,.7);border-radius:50%;opacity:0;animation:tdxSplash 1.2s ease-out var(--dl) infinite}
@keyframes tdxSplash{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.8);opacity:0}}
.tdx .tdx-flash.soft{animation-duration:19s;opacity:0;background:#cfd8ff}
.tdx .tdx-mist{position:absolute;left:-40%;width:180%;height:16%;pointer-events:none;border-radius:50%;
  background:radial-gradient(ellipse at center,rgba(235,240,245,.55),rgba(235,240,245,0) 70%);filter:blur(6px);animation:tdxMist var(--d) ease-in-out var(--dl) infinite alternate}
@keyframes tdxMist{from{transform:translateX(-8%)}to{transform:translateX(12%)}}
.tdx .tdx-leaf.gust{animation-timing-function:cubic-bezier(.3,.2,.6,1)}
.tdx .tdx-wx{position:absolute;right:1.6cqw;top:1.6cqw;display:flex;align-items:center;gap:.5cqw;font:400 1.15cqw/1 'Lilita One',sans-serif;letter-spacing:.04em;color:#fff;
  background:rgba(14,16,26,.82);padding:.55cqw .9cqw .5cqw .7cqw;border-radius:99px}
.tdx .tdx-wx svg{width:1.6cqw;height:1.6cqw}
@media (prefers-reduced-motion:reduce){.tdx .tdx-rays,.tdx .tdx-haze,.tdx .tdx-mist,.tdx .tdx-rain,.tdx .tdx-splash,.tdx .tdx-flash{animation:none}}
.tdx .tdx-bolt{position:absolute;inset:0;background:#e8eeff;mix-blend-mode:screen;animation:tdxBolt .9s ease-out forwards;pointer-events:none}
@keyframes tdxBolt{0%{opacity:0}8%{opacity:.85}20%{opacity:.1}30%{opacity:.6}100%{opacity:0}}
.tdx .tdx-title.out .band{background:var(--rd)}.tdx .tdx-title.out .kicker{color:#fff}
.tdx .tdx-title.fire .band{background:linear-gradient(90deg,var(--or),var(--am))}
.tdx .tdx-title.vs .band{background:#1a1420;box-shadow:0 0 0 6px var(--or),0 0 0 9px #1a1420}.tdx .tdx-title.vs .kicker{color:var(--am)}
.tdx .tdx-title .faces .vsx{align-self:center;font:400 4cqw/1 'Lilita One';color:var(--am);-webkit-text-stroke:1.5px #1a0e02;paint-order:stroke fill;text-shadow:0 4px 0 #1a0e02}
.tdx .tdx-title.vs.fresh .faces .vsx{animation:tdxSlam .5s .5s cubic-bezier(.3,1.6,.5,1) backwards}
.tdx .tdx-found .totem{top:30%}.tdx .tdx-found .lbl{top:52%}.tdx .tdx-found .for{top:58%}
.tdx .tdx-found .for img{width:5.5cqw}
.tdx .tdx-found.amulet .rays{background:repeating-conic-gradient(rgba(120,240,220,.26) 0 8deg,transparent 8deg 18deg)}.tdx .tdx-found.amulet .totem{filter:drop-shadow(0 0 20px rgba(120,240,220,.9))}
.tdx .tdx-found.none{background:rgba(8,10,16,.6)}.tdx .tdx-found.none .totem{filter:none;opacity:.8}.tdx .tdx-found.none .lbl{color:#c8ccd8}
.tdx .tdx-found.fresh .totem{animation:tdxDigUp 1.1s cubic-bezier(.3,1.4,.5,1)}
@keyframes tdxDigUp{0%{transform:translate(-50%,60%) scale(.3) rotate(-30deg);opacity:0}60%{transform:translate(-50%,-60%) scale(1.15) rotate(6deg);opacity:1}100%{transform:translate(-50%,-50%) scale(1) rotate(0)}}
.tdx .tdx-found.fresh .lbl{animation:tdxSlam .5s .5s cubic-bezier(.3,1.6,.5,1) backwards}

.tdx .tdx-ln.vis{display:block}.tdx .tdx-ln.now{background:rgba(255,138,31,.16);color:#fff}
.tdx .tdx-ln b{color:#fff}.tdx .tdx-ln.sc{font:900 11px Nunito;letter-spacing:.12em;text-transform:uppercase;color:var(--or);margin-top:6px}
.tdx .tdx-ln.d{font-style:italic;color:#8d93a6}
#visual-player.tdx-tv .tdx .tdx-script{display:none}
#visual-player.tdx-tv{position:fixed!important;inset:0;z-index:9999;background:#000;display:flex!important;align-items:center;justify-content:center;overflow:hidden;padding:0;margin:0}
#visual-player.tdx-tv .rp-sidebar,#visual-player.tdx-tv .rp-nav,#visual-player.tdx-tv .rp-main>*:not(:has(.tdx)){display:none!important}
#visual-player.tdx-tv .rp-main{width:100%;height:100%;max-width:none;margin:0;padding:0;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden}
#visual-player.tdx-tv .rp-main *:has(>.tdx),#visual-player.tdx-tv .rp-main *:has(.tdx){max-width:none!important;width:100%;margin:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important}
#visual-player.tdx-tv .tdx{width:min(100vw,calc((100vh - 52px) * 16 / 9));max-width:none;margin:0 auto}
#visual-player.tdx-tv .tdx .tdx-stage{border-radius:0}
`;
