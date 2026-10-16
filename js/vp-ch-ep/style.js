// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/style.js — The Challenge's stage, its own look
// ══════════════════════════════════════════════════════════════════════
//
// The approved mockup's styles (mockup/mockup-ch-viewer.html v2), scoped under
// .chx so nothing leaks into the rest of the simulator. MTV-2000s extreme
// sports: charcoal, fire orange, caution yellow, duct tape, spray paint, rivets.
// Everything is sized in container units (cqw/cqh) off the 16:9 frame, so the
// stage looks the same at any width and in TV mode.

export const CHX_FONTS = 'https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:ital,wght@0,500;0,600;0,700;0,800;1,600&family=Black+Ops+One&family=Permanent+Marker&display=swap';

export function ensureChxStyle() {
  if (typeof document === 'undefined' || document.getElementById('chx-style')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = CHX_FONTS; link.id = 'chx-fonts';
  document.head.appendChild(link);
  const st = document.createElement('style');
  st.id = 'chx-style'; st.textContent = CHX_CSS;
  document.head.appendChild(st);
  const grunge = "url(\"data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='300' height='120'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.7'/></filter><rect width='300' height='120' filter='url(#g)'/></svg>") + "\")";
  document.documentElement.style.setProperty('--chx-grunge', grunge);
  if (!document.getElementById('chx-svgdefs')) {
    const d = document.createElement('div');
    d.id = 'chx-svgdefs'; d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = "<svg width='0' height='0' aria-hidden='true'><defs><filter id='chx-spr' x='-10%' y='-20%' width='120%' height='140%'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='3' result='n'/><feDisplacementMap in='SourceGraphic' in2='n' scale='5'/></filter></defs></svg>";
    document.body.appendChild(d);
  }
}

const CHX_CSS = `
.chx{--fire:#ff6a1a;--fire2:#ff9a2a;--red:#e3262d;--caution:#ffd21a;--neon:#2de2ff;--tape:#c9c4bd;--rivet:#7d756e;--hud:#f5efe8;--hud-dim:#b7ab9f;
  --cbg:#0f0d0c;--cpanel:#1a1716;--cline:#34302c;--ctext:#f2ece6;--cmuted:#9c9188;
  display:grid;gap:10px;font:600 15px/1.35 'Barlow Condensed',system-ui,sans-serif;color:var(--ctext);
  width:100%;max-width:min(1180px,calc((100vh - 230px) * 16 / 9));margin:0 auto}
.chx *{box-sizing:border-box}
.chx button{font:inherit;color:inherit}
.chx .chx-top{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.chx .chx-logo{font:400 24px/.9 'Anton',sans-serif;text-transform:uppercase;color:var(--fire);transform:skewX(-9deg);text-shadow:2px 2px 0 #000,-1px -1px 0 var(--caution)}
.chx .chx-logo small{display:block;font:400 10px 'Black Ops One';letter-spacing:.34em;color:var(--caution);text-shadow:1px 1px 0 #000}
.chx .chx-eps{font:700 13px 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase;color:var(--cmuted)}
.chx .chx-eps b{color:var(--ctext)}
.chx .chx-spacer{flex:1}
.chx .chx-ibtn{border:1px solid var(--cline);background:var(--cpanel);padding:6px 12px;cursor:pointer;font:700 13px 'Barlow Condensed';letter-spacing:.06em;text-transform:uppercase;clip-path:polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)}
/* the stage */
.chx .chx-frame{position:relative;aspect-ratio:16/9;overflow:hidden;background:#000;container-type:size;isolation:isolate;cursor:pointer;user-select:none;box-shadow:0 0 0 2px #000,0 0 0 4px #2b2622,0 24px 60px rgba(0,0,0,.55)}
.chx .chx-world{position:absolute;inset:0;transform-origin:50% 50%;transition:transform 1.25s cubic-bezier(.3,.7,.2,1);will-change:transform}
.chx .chx-drift{position:absolute;inset:0;animation:chxDrift 30s ease-in-out infinite alternate}
@keyframes chxDrift{from{transform:scale(1.015) translate(-.4%,.2%)}to{transform:scale(1.04) translate(.5%,-.3%)}}
.chx .chx-plate,.chx .chx-glc{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.chx canvas.tdx-gl{opacity:0;transition:opacity .4s}
.chx canvas.tdx-gl.on{opacity:1}
.chx .chx-live,.chx .chx-cast,.chx .chx-wfx{position:absolute;inset:0;pointer-events:none}
.chx .chx-cast{z-index:3}.chx .chx-wfx{z-index:5}
.chx .chx-props{position:absolute;inset:0;pointer-events:none;z-index:2}
.chx .chx-props.chx-fore{z-index:4}
/* a fight: the brawl cloud, the two inside it, caution tape for an expulsion */
.chx .brawlfx{position:absolute;width:20cqw;translate:-50% -55%;z-index:6;pointer-events:none;animation:chxBrawl .16s steps(2) infinite alternate}
.chx .brawlfx svg{width:100%;height:auto;display:block;overflow:visible;filter:drop-shadow(0 .6cqh .8cqh rgba(0,0,0,.5))}
.chx .brawlfx .fist{animation:chxFist .22s ease-in-out infinite alternate;transform-origin:center}
.chx .brawlfx .f2{animation-delay:-.11s}
.chx .brawlfx .stars{animation:chxStars .5s linear infinite}
.chx .tok.inbrawl{opacity:.35;filter:blur(.15cqw);animation:chxDshake .12s linear infinite}
@keyframes chxBrawl{from{rotate:-4deg;scale:1}to{rotate:4deg;scale:1.06}}
@keyframes chxFist{from{transform:translate(0,0)}to{transform:translate(-10px,8px)}}
@keyframes chxStars{to{opacity:.3}}
.chx .tapes{position:absolute;inset:0;z-index:21;pointer-events:none;overflow:hidden}
.chx .tape{position:absolute;left:-10%;right:-10%;height:7cqh;display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(135deg,#ffd21a 0 3cqw,#141110 3cqw 6cqw);box-shadow:0 .4cqh 1cqh rgba(0,0,0,.6);animation:chxTape .45s cubic-bezier(.2,.9,.3,1.1) both}
.chx .tape span{background:#ffd21a;color:#141110;font:400 3.4cqw/1 'Black Ops One';letter-spacing:.12em;padding:.3cqh 1.4cqw;border:.25cqw solid #141110}
.chx .tape.t1{top:30%;rotate:-7deg}.chx .tape.t2{top:58%;rotate:5deg;animation-delay:.18s}
.chx .tapes.still .tape{animation:none}
@keyframes chxTape{from{transform:translateX(-110%)}to{transform:none}}
/* the big screen on the club deck (Who Said It) */
.chx .prop.bigscreen{transform:none;transition:none;display:flex;flex-direction:column;justify-content:center;gap:1.2cqh;padding:2cqh 2.4cqw;box-sizing:border-box;font:400 1.5cqw/1.1 'Anton',sans-serif;color:#fff;letter-spacing:.03em;text-transform:uppercase;text-shadow:0 0 .8cqw rgba(80,200,255,.7)}
.chx .bigscreen .q{text-align:center;color:#ffd23f;font-size:1.7cqw;margin-bottom:.6cqh;animation:chxChip .45s cubic-bezier(.3,1.7,.5,1)}
.chx .bigscreen .r{display:grid;grid-template-columns:4.2cqh 9cqw 1fr 2.4cqw;align-items:center;gap:.8cqw;animation:chxChip .45s cubic-bezier(.3,1.7,.5,1) both}
.chx .bigscreen .r:nth-child(3){animation-delay:.12s}.chx .bigscreen .r:nth-child(4){animation-delay:.24s}.chx .bigscreen .r:nth-child(5){animation-delay:.36s}
.chx .bigscreen .r img{width:4.2cqh;height:4.2cqh;object-fit:cover;border:.2cqw solid #fff;background:#222}
.chx .bigscreen .r b{font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chx .bigscreen .r i{display:block;height:2.2cqh;background:linear-gradient(90deg,#ff5a1f,#ffd23f);box-shadow:0 0 .8cqw rgba(255,120,40,.7)}
.chx .bigscreen .r span{text-align:right}
.chx .bigscreen .r.top b,.chx .bigscreen .r.top span{color:#ffd23f}
.chx .prop{position:absolute;transform:translate(-50%,-100%);transition:left .9s,top .9s}
.chx .prop svg{width:100%;height:auto;display:block;overflow:visible;filter:drop-shadow(0 .4cqh .5cqh rgba(0,0,0,.45))}
.chx .prop.bob svg,.chx .prop.bob img{animation:chxBuoy 2.4s ease-in-out infinite alternate}
@keyframes chxBuoy{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-6%) rotate(3deg)}}
.chx .prop.pop-in{animation:chxChip .45s cubic-bezier(.3,1.7,.5,1)}
.chx .prop.fallen svg,.chx .prop.fallen img{animation:chxFallen .6s ease-out}
@keyframes chxFallen{from{transform:translateY(-40%) rotate(-25deg);opacity:.2}}
.chx .tok.swim .face::after{content:"";position:absolute;left:0;right:0;bottom:0;height:46%;background:linear-gradient(180deg,rgba(120,235,240,.55),rgba(30,140,180,.92));border-top:.2cqw solid rgba(230,255,255,.85)}
.chx .tok.swim .body{animation:chxBob 1.6s ease-in-out infinite;animation-delay:var(--bd,0s)}
.chx .tok.mud .face::after{content:"";position:absolute;left:0;right:0;bottom:0;height:40%;background:linear-gradient(180deg,rgba(150,100,55,.75),rgba(92,58,28,.95));border-top:.25cqw solid rgba(70,42,20,.9)}
.chx .tok.mud .body{animation:chxStrain .3s linear infinite}
.chx .tok.mud .tag{display:none}
.chx .tok.ice .face::after{content:"";position:absolute;left:0;right:0;bottom:0;height:44%;background:linear-gradient(180deg,rgba(220,245,255,.7),rgba(120,190,230,.92));border-top:.25cqw solid rgba(255,255,255,.95)}
.chx .tok.ice .body{animation:chxStrain .22s linear infinite}
.chx .tok.ice .tag{display:none}
.chx .tok.swim .tag{display:none}
.chx .tok.climb .body{animation:chxClimb .7s ease-in-out infinite alternate}
@keyframes chxClimb{from{transform:translateY(0) rotate(-4deg)}to{transform:translateY(-8%) rotate(4deg)}}
.chx .tok.pull .body{animation:chxPull .9s ease-in-out infinite alternate;transform-origin:50% 100%}
@keyframes chxPull{from{transform:rotate(-8deg) translateX(-2%)}to{transform:rotate(-14deg) translateX(-5%)}}
.chx .chx-frame.shake .chx-drift{animation:chxShake .5s linear,chxDrift 30s ease-in-out infinite alternate}
@keyframes chxShake{0%,100%{translate:0 0}15%{translate:-1.4cqw .6cqh}35%{translate:1.2cqw -.8cqh}55%{translate:-.8cqw .4cqh}75%{translate:.5cqw 0}}
.chx .ember{position:absolute;width:.32cqw;aspect-ratio:1;border-radius:50%;background:#ffd08a;box-shadow:0 0 .5cqw .15cqw #ff8a2a;opacity:0;animation:chxEmber var(--d,2.6s) linear infinite;animation-delay:var(--dl,0s)}
@keyframes chxEmber{0%{transform:translate(0,0);opacity:0}12%{opacity:1}100%{transform:translate(var(--dx,1cqw),-14cqh);opacity:0}}
.chx .glow{position:absolute;border-radius:50%;transform:translate(-50%,-50%);mix-blend-mode:screen;pointer-events:none;background:radial-gradient(circle,rgba(255,170,70,.55),rgba(255,120,30,.18) 40%,transparent 70%);animation:chxGlow 1.4s ease-in-out infinite alternate}
@keyframes chxGlow{from{opacity:.7;scale:.94}to{opacity:1;scale:1.06}}
.chx .fly{position:absolute;width:.35cqw;aspect-ratio:1;border-radius:50%;background:#e8ff9a;box-shadow:0 0 .7cqw .25cqw rgba(220,255,140,.75);animation:chxFly var(--d,7s) ease-in-out infinite alternate,chxBlinkf 2.4s ease-in-out infinite;animation-delay:var(--dl,0s)}
@keyframes chxFly{from{transform:translate(0,0)}to{transform:translate(var(--dx,4cqw),var(--dy,-3cqh))}}
@keyframes chxBlinkf{0%,100%{opacity:.15}50%{opacity:1}}
.chx .mote{position:absolute;width:.22cqw;aspect-ratio:1;border-radius:50%;background:rgba(255,245,220,.75);animation:chxFly var(--d,12s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}
.chx .laser{position:absolute;width:.25cqw;height:70cqh;transform-origin:50% 0;mix-blend-mode:screen;opacity:.5;background:linear-gradient(var(--c,#ff3df2),transparent);animation:chxLaser var(--d,3s) ease-in-out infinite alternate}
@keyframes chxLaser{from{rotate:-28deg}to{rotate:28deg}}
/* people */
.chx .tok{position:absolute;width:var(--sz);height:var(--sz);transform:translate(-50%,-100%);transform-origin:50% 100%;transition:left .9s cubic-bezier(.3,.8,.25,1.04),top .9s cubic-bezier(.3,.8,.25,1.04),width .9s,height .9s,opacity .45s,filter .45s,scale .45s}
.chx .tok .body{position:absolute;inset:0;transform-origin:50% 100%;animation:chxBreathe 3.6s ease-in-out infinite;animation-delay:var(--bd,0s)}
@keyframes chxBreathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.02)}}
.chx .tok .face{position:absolute;inset:0;overflow:hidden;background:#222;border:max(2px,.22cqw) solid #0c0a0a;clip-path:polygon(0 5%,5% 0,100% 0,100% 95%,95% 100%,0 100%);box-shadow:0 .8cqh 1.6cqh rgba(0,0,0,.5)}
.chx .tok .face img{width:100%;height:100%;object-fit:cover;display:block}
.chx .tok .shadow{position:absolute;left:6%;right:6%;bottom:-5%;height:12%;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.55),transparent 70%);z-index:-1}
.chx .tok .tag{position:absolute;left:50%;bottom:-.95em;transform:translateX(-50%) rotate(-2deg);white-space:nowrap;z-index:2;font:400 clamp(7px,1.05cqw,16px)/1 'Anton',sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#141110;background:var(--tape);padding:.28em .55em .22em;box-shadow:0 1px 2px rgba(0,0,0,.6);clip-path:polygon(0 10%,4% 0,9% 12%,15% 0,100% 0,97% 50%,100% 100%,8% 100%,3% 86%,0 100%)}
.chx .tok.small .tag{display:none}
.chx .tok.bg{filter:saturate(.75) brightness(.72);scale:.93}
.chx .tok.bg .tag{opacity:.7}
.chx .tok.speak{z-index:60!important;scale:1.06}
.chx .tok.speak .face{border-color:var(--caution);box-shadow:0 0 0 .2cqw var(--caution),0 0 2.6cqw rgba(255,210,26,.5)}
.chx .tok.speak .tag{background:var(--caution)}
.chx .tok.host .tag{background:var(--fire)}
.chx .tok.gone{opacity:0;scale:.6}
.chx .tok.out .face{filter:grayscale(.8) brightness(.6)}
.chx .tok.safe .face::after{content:"SAFE";position:absolute;right:-2%;top:4%;font:400 clamp(7px,1cqw,15px)/1 'Black Ops One';color:#111;background:var(--caution);padding:.25em .45em;rotate:12deg;box-shadow:0 0 0 .12cqw #111}
.chx .tok .chip{position:absolute;left:50%;top:-1.7em;translate:-50% 0;font:400 clamp(8px,1.1cqw,16px)/1 'Anton';background:var(--red);color:#fff;letter-spacing:.06em;padding:.25em .5em;white-space:nowrap;z-index:3;animation:chxChip .35s cubic-bezier(.3,1.7,.5,1)}
@keyframes chxChip{from{scale:0}}
.chx .tok.talkpop .body{animation:chxTalk .5s cubic-bezier(.3,1.6,.5,1),chxBreathe 3.6s ease-in-out .5s infinite}
@keyframes chxTalk{0%{transform:scale(.88,1.1)}50%{transform:scale(1.06,.95)}100%{transform:scale(1)}}
.chx .tok.shout .body{animation:chxShout .45s ease-out 2}
@keyframes chxShout{30%{transform:translateY(-5%) scale(1.07)}65%{transform:translateX(-2%) rotate(-2deg)}}
.chx .tok.laugh .body{animation:chxLaugh .5s ease-in-out 3}
@keyframes chxLaugh{25%{transform:translateY(-6%) rotate(-4deg)}75%{transform:translateY(-4%) rotate(4deg)}}
.chx .tok.flinch .body{animation:chxFlinch .5s ease-out}
.chx .tok.strain .body{animation:chxStrain .16s linear 9}
@keyframes chxStrain{50%{transform:translateX(1.6%) rotate(1.2deg)}}
.chx .tok.strain .face::before{content:'';position:absolute;right:8%;top:6%;width:13%;height:19%;background:radial-gradient(circle at 50% 70%,#c8efff 0 52%,#5fb8e6 56%,transparent 62%);border-radius:50% 50% 50% 50%/62% 62% 38% 38%;animation:chxSweat 1.1s ease-in 2;z-index:3;opacity:0}
@keyframes chxSweat{0%{opacity:0;transform:translateY(-30%)}20%{opacity:1}100%{opacity:0;transform:translateY(170%)}}
@keyframes chxFlinch{30%{transform:translateX(var(--away,-6%)) rotate(-5deg) scale(.96)}}
.chx .tok.lean .body{animation:chxLean 1.8s ease-in-out}
@keyframes chxLean{50%{transform:translateX(var(--to,8%)) rotate(var(--rot,5deg))}}
.chx .tok.slump .body{animation:chxSlump .9s ease-out forwards}
@keyframes chxSlump{to{transform:translateY(6%) rotate(-3deg) scaleY(.94)}}
.chx .tok.cheer .body{animation:chxCheer .42s ease-in-out 4}
@keyframes chxCheer{50%{transform:translateY(-11%)}}
.chx .tok.dance .body{animation:chxDance .6s ease-in-out infinite alternate;animation-delay:var(--bd,0s)}
@keyframes chxDance{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-6%) rotate(3deg)}}
.chx .tok.sip .body{animation:chxSip 4.5s ease-in-out infinite;animation-delay:var(--bd,0s)}
@keyframes chxSip{0%,70%,100%{transform:none}78%{transform:rotate(-4deg) translateY(-2%)}90%{transform:rotate(-1deg)}}
.chx .tok.look .body{animation:chxLook 6s ease-in-out infinite;animation-delay:var(--bd,0s)}
@keyframes chxLook{0%,40%,100%{transform:none}50%{transform:rotate(-3deg)}65%{transform:rotate(3deg)}}
.chx .tok.walkin .body{animation:chxStep .32s ease-in-out 3 alternate}
@keyframes chxStep{from{transform:rotate(-4deg)}to{transform:rotate(4deg) translateY(-4%)}}
.chx .tok.hang .body{animation:chxHang 2.6s ease-in-out infinite alternate;animation-delay:var(--bd,0s);transform-origin:50% -40%}
@keyframes chxHang{from{transform:rotate(-3.5deg)}to{transform:rotate(3.5deg)}}
.chx .tok.hang .body::before{content:"";position:absolute;left:22%;right:22%;bottom:100%;height:var(--rope,3cqh);border-left:.2cqw solid #2a1d12;border-right:.2cqw solid #2a1d12}
.chx .tok.fall{transition:top .5s cubic-bezier(.5,0,.9,.5),scale .4s;scale:.85}
.chx .tok.fall .body{animation:chxBob 2.2s ease-in-out infinite;animation-delay:var(--bd,0s)}
.chx .tok.fall .face::after{content:"";position:absolute;left:0;right:0;bottom:0;height:42%;background:linear-gradient(180deg,rgba(120,235,240,.6),rgba(30,160,190,.9));border-top:.2cqw solid rgba(230,255,255,.85)}
.chx .tok.fall.mud .face::after{background:linear-gradient(180deg,rgba(120,85,50,.75),rgba(70,45,25,.95));border-top-color:rgba(160,120,80,.9)}
@keyframes chxBob{50%{transform:translateY(5%) rotate(2deg)}}
.chx .tok.dig .body{animation:chxDig .5s ease-in-out infinite alternate}
@keyframes chxDig{from{transform:rotate(-6deg) translateY(2%)}to{transform:rotate(6deg) translateY(-3%)}}
.chx .tok.run .body{animation:chxRun .34s ease-in-out infinite alternate}
@keyframes chxRun{from{transform:rotate(-5deg) translateY(0)}to{transform:rotate(5deg) translateY(-6%)}}
.chx .tok.cry .face::before{content:"";position:absolute;left:30%;top:42%;width:6%;height:14%;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#bfeaff;box-shadow:12cqh 0 0 #bfeaff;animation:chxTear 1.4s ease-in infinite;z-index:2}
@keyframes chxTear{from{transform:translateY(0);opacity:1}to{transform:translateY(160%);opacity:0}}
/* world effects */
.chx .ring{position:absolute;border:.3cqw solid var(--caution);border-radius:50%;translate:-50% -50%;animation:chxRing .9s ease-out forwards}
@keyframes chxRing{from{width:2cqw;height:2cqw;opacity:1}to{width:22cqw;height:22cqw;opacity:0}}
.chx .pop{position:absolute;translate:-50% -50%;font:400 clamp(14px,3cqw,46px)/1 'Anton';color:var(--caution);text-transform:uppercase;-webkit-text-stroke:.12cqw #120c08;paint-order:stroke fill;text-shadow:0 .35cqw 0 #120c08;animation:chxPop 1.2s cubic-bezier(.3,1.7,.5,1) forwards;white-space:nowrap}
@keyframes chxPop{0%{transform:scale(0) rotate(-18deg)}30%{transform:scale(1.2) rotate(-6deg)}80%{opacity:1}100%{transform:translateY(-60%) rotate(-6deg);opacity:0}}
.chx .excl{position:absolute;translate:-50% -50%;width:2.4cqw;aspect-ratio:1;display:grid;place-items:center;font:400 1.8cqw/1 'Anton';color:#fff;background:var(--red);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);animation:chxExcl 1s cubic-bezier(.3,1.8,.5,1) forwards}
@keyframes chxExcl{0%{transform:translateY(40%) scale(0)}40%{transform:translateY(-30%) scale(1.15)}85%{opacity:1}100%{transform:translateY(-50%);opacity:0}}
.chx .heart{position:absolute;translate:-50% -50%;width:3cqw;animation:chxHeart 1.6s cubic-bezier(.3,1.5,.5,1) forwards}
@keyframes chxHeart{0%{transform:scale(0)}30%{transform:scale(1.25)}70%{opacity:1}100%{transform:translateY(-120%) scale(.9);opacity:0}}
.chx .drop{position:absolute;width:.5cqw;aspect-ratio:.7;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#dff8ff;box-shadow:0 0 .3cqw #fff;animation:chxDrop .9s cubic-bezier(.2,.7,.4,1) forwards}
@keyframes chxDrop{0%{transform:translate(0,0);opacity:1}50%{transform:translate(calc(var(--dx) * .6),-7cqh)}100%{transform:translate(var(--dx),2cqh);opacity:0}}
.chx .splashring{position:absolute;translate:-50% -50%;border:.25cqw solid rgba(230,250,255,.9);border-radius:50%;animation:chxSplr 1.1s ease-out forwards}
@keyframes chxSplr{from{width:1cqw;height:.4cqw;opacity:1}to{width:12cqw;height:2.6cqw;opacity:0}}
.chx .puff{position:absolute;translate:-50% -50%;width:4cqw;aspect-ratio:1.6;border-radius:50%;background:radial-gradient(ellipse,rgba(230,180,120,.75),transparent 70%);animation:chxPuff 1s ease-out forwards}
@keyframes chxPuff{from{scale:.3;opacity:1}to{scale:2.4;opacity:0;translate:-50% -110%}}
/* HUD */
.chx .chx-hud{position:absolute;inset:0;pointer-events:none;z-index:10}
.chx .loc{position:absolute;left:2%;top:3.6%;display:flex;align-items:stretch;filter:drop-shadow(0 .5cqh 1cqh rgba(0,0,0,.45))}
.chx .loc .ic{width:4.2cqw;background:var(--fire);display:grid;place-items:center;clip-path:polygon(0 0,100% 0,84% 100%,0 100%);padding-right:.5cqw}
.chx .loc .ic svg{width:56%}
.chx .loc .txt{background:rgba(14,12,11,.88);color:var(--hud);padding:.55cqh 2.2cqw .6cqh 1.4cqw;margin-left:-.5cqw;clip-path:polygon(6% 0,100% 0,94% 100%,0 100%);border-bottom:.3cqh solid var(--caution)}
.chx .loc .place{font:400 2.2cqw/1 'Anton';letter-spacing:.04em;text-transform:uppercase}
.chx .loc .when{font:700 1cqw/1.2 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase;color:var(--hud-dim);margin-top:.35cqh}
.chx .loc .when b{color:var(--caution)}
.chx .loc.fresh{animation:chxLocin .6s cubic-bezier(.2,.9,.3,1.1)}
@keyframes chxLocin{from{transform:translateX(-120%)}}
.chx .power{position:absolute;left:2%;top:calc(3.6% + 7.4cqh);display:flex;align-items:center;gap:.5cqw;background:rgba(14,12,11,.85);padding:.4cqh .7cqw .4cqh .5cqw;border-left:.35cqw solid var(--caution)}
.chx .power b{font:400 .95cqw/1 'Black Ops One';color:var(--caution);letter-spacing:.12em;margin-right:.2cqw}
.chx .power img{width:2.6cqw;height:2.6cqw;object-fit:cover;border:.15cqw solid var(--caution)}
.chx .mini{position:absolute;right:2%;top:3.6%;width:15cqw;pointer-events:auto;cursor:zoom-in;background:rgba(14,12,11,.88);padding:.45cqw;border-bottom:.3cqh solid var(--fire)}
.chx .mini .lbl{display:flex;justify-content:space-between;font:700 .85cqw/1 'Barlow Condensed';letter-spacing:.14em;color:var(--hud-dim);text-transform:uppercase;margin:.1cqw .1cqw .35cqw}
.chx .mini .lbl b{color:var(--fire)}
.chx .mini .m{position:relative;aspect-ratio:16/9;background-size:cover}
.chx .mini .pin{position:absolute;width:1.2cqw;height:1.2cqw;translate:-50% -50%;border-radius:50%;background:var(--fire);box-shadow:0 0 0 .2cqw #fff;animation:chxPin 1.2s ease-in-out infinite}
@keyframes chxPin{50%{scale:1.5}}
.chx .ibtn2-unused{position:absolute;right:2%;top:calc(3.6% + 10.6cqw);pointer-events:auto;border:0;background:rgba(14,12,11,.88);color:var(--hud);cursor:pointer;font:400 1cqw/1 'Black Ops One';letter-spacing:.18em;padding:.7cqh .9cqw;display:flex;gap:.5cqw;align-items:center}
.chx .ibtn2 i{width:.8cqw;height:.8cqw;border-radius:50%;background:var(--fire);display:none}
.chx .ibtn2.new i{display:block;animation:chxPin 1s ease-in-out infinite}
.chx .board{position:absolute;right:2%;top:calc(3.6% + 13.4cqw);width:17cqw;background:rgba(14,12,11,.9);padding:.8cqw;border-top:.35cqh solid var(--red);max-height:calc(100% - 3.6% - 13.4cqw - 22%);overflow:hidden}
.chx .board h5{margin:0 0 .5cqw;font:400 1.05cqw/1 'Black Ops One';color:var(--red);letter-spacing:.16em}
.chx .board .row{display:grid;grid-template-columns:2.8cqw 1fr auto;gap:.6cqw;align-items:center;margin-bottom:.5cqw}
.chx .board .row img{width:2.8cqw;height:2.8cqw;object-fit:cover;border:.15cqw solid #000}
.chx .board .nm{font:400 1.25cqw/1 'Anton';text-transform:uppercase;color:var(--hud)}
.chx .board .ticks{font:400 1.2cqw/1 'Permanent Marker';color:var(--caution);margin-top:.2cqw;min-height:1.2cqw;word-break:break-all}
.chx .board .ct{font:400 2.4cqw/1 'Anton';color:var(--caution)}
.chx .board .row.hit{animation:chxHit .5s}
@keyframes chxHit{30%{transform:translateX(-4%);background:rgba(227,38,45,.35)}}
.chx .board .left{font:700 .95cqw/1.2 'Barlow Condensed';color:var(--hud-dim);letter-spacing:.08em;text-transform:uppercase;margin-top:.4cqw}
.chx .race{position:absolute;left:50%;top:3.6%;translate:-50% 0;display:grid;gap:.5cqh}
.chx .race .r{display:grid;grid-template-columns:auto 22cqw 2.6cqw;gap:.7cqw;align-items:center;background:rgba(14,12,11,.88);padding:.4cqh .7cqw;border-left:.35cqw solid var(--fire)}
.chx .race .r.win{border-left-color:var(--caution);background:rgba(60,48,8,.9)}
.chx .race .fs{display:flex}
.chx .race .fs img{width:2.6cqw;height:2.6cqw;object-fit:cover;border:.15cqw solid #000;margin-left:-.6cqw}
.chx .race .fs img:first-child{margin-left:0}
.chx .race .bar{height:1.1cqw;background:#3a3532;position:relative;overflow:hidden;clip-path:polygon(0 0,100% 0,98% 100%,0 100%)}
.chx .race .bar b{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--fire),var(--caution));transition:width .9s cubic-bezier(.3,.8,.3,1)}
.chx .race .n{font:400 1.4cqw/1 'Anton';color:var(--caution);text-align:right;white-space:nowrap}
.chx .race.tally .th{font:400 1cqw/1 'Black Ops One';color:var(--caution);letter-spacing:.2em;text-align:center;background:rgba(14,12,11,.88);padding:.45cqh 0}
.chx .race.tally .r{grid-template-columns:auto 16cqw 7cqw}
.chx .race.tally .r.bad{border-left-color:var(--red)}
.chx .race.tally .r.bad .n{color:#ff7a6e}
.chx .duelhud{position:absolute;left:50%;top:3.6%;translate:-50% 0;display:grid;gap:.6cqh}
.chx .duelhud .r{display:grid;grid-template-columns:3.4cqw auto 2.4cqw;gap:.7cqw;align-items:center;background:rgba(14,12,11,.88);padding:.5cqh .7cqw;border-left:.35cqw solid var(--fire)}
.chx .duelhud .r.ahead{border-left-color:var(--caution)}
.chx .duelhud img{width:3.4cqw;height:3.4cqw;object-fit:cover;border:.15cqw solid #000}
.chx .duelhud .slots{display:flex;gap:.3cqw}
.chx .duelhud .slots i{width:1.8cqw;height:1.8cqw;background:#3a3532;clip-path:polygon(20% 0,80% 0,100% 35%,80% 100%,20% 100%,0 35%);transition:background .3s}
.chx .duelhud .slots i.on{background:var(--caution)}
.chx .duelhud .slots i.lock{background:var(--fire)}
.chx .duelhud .n{font:400 1.8cqw/1 'Anton';color:var(--caution);text-align:right}
.chx .left-hud{position:absolute;left:50%;top:3.6%;translate:-50% 0;display:flex;flex-wrap:wrap;max-width:60cqw;justify-content:center;gap:.3cqw;background:rgba(14,12,11,.88);padding:.5cqw .7cqw;border-bottom:.3cqh solid var(--neon);align-items:center}
.chx .left-hud b{font:400 1cqw/1 'Black Ops One';color:var(--neon);letter-spacing:.14em;margin-right:.4cqw}
.chx .left-hud img{width:2.2cqw;height:2.2cqw;object-fit:cover;border:.12cqw solid #000;transition:opacity .3s,filter .3s}
.chx .left-hud img.out{opacity:.25;filter:grayscale(1)}
.chx .left-hud .lt{font:400 2.2cqw/1 'Black Ops One';color:var(--caution);background:#2a201a;border:.15cqw solid #000;padding:.2cqw .6cqw;margin:0 .15cqw}
.chx .prop.sprite img{width:100%;height:auto;display:block;filter:drop-shadow(0 .4cqh .5cqh rgba(0,0,0,.45))}
.chx .rules{position:absolute;left:50%;top:42%;width:58cqw;translate:-50% -50%;padding:2.2cqh 2.4cqw 2cqh;color:var(--hud);background:linear-gradient(180deg,#3d3936,#1d1a19);border:.25cqw solid #000;box-shadow:0 0 0 .25cqw #5a534d inset,0 2.4cqh 5cqh rgba(0,0,0,.65);animation:chxRulesin .45s cubic-bezier(.2,1.3,.4,1) both}
.chx .rules::before,.chx .rules::after{content:"";position:absolute;width:.8cqw;height:.8cqw;border-radius:50%;background:var(--rivet);top:.8cqw;box-shadow:inset 0 -.1cqw .1cqw #000}
.chx .rules::before{left:.8cqw}.chx .rules::after{right:.8cqw}
@keyframes chxRulesin{from{scale:.6;opacity:0;rotate:-4deg}}
.chx .rules .k{font:400 1.25cqw 'Black Ops One';color:var(--fire);letter-spacing:.26em}
.chx .rules .n{font:400 4.4cqw/1 'Anton';color:var(--caution);text-transform:uppercase;margin:.6cqh 0 1cqh;transform:skewX(-7deg)}
.chx .rules ol{margin:0;padding-left:1.4em;font:600 1.4cqw/1.28 'Barlow Condensed';color:#e6ddd4}
.chx .rules li{margin-bottom:.45cqh}
.chx .rules li b{color:var(--caution)}
.chx .rules .f{margin-top:1.1cqh;font:700 1.25cqw 'Barlow Condensed';color:var(--fire);text-transform:uppercase;letter-spacing:.14em}
.chx .roster{position:absolute;left:2%;right:2%;bottom:23%;display:flex;justify-content:center;gap:1cqw;animation:chxLowin .5s cubic-bezier(.2,.9,.3,1.1) both}
.chx .roster .rc{display:flex;align-items:center;gap:.7cqw;background:rgba(14,12,11,.92);padding:.5cqw .9cqw .5cqw .5cqw;border-left:.4cqw solid var(--fire);transform:skewX(-6deg)}
.chx .roster .rc img{width:3.8cqw;height:3.8cqw;object-fit:cover;border:.15cqw solid #000}
.chx .roster .rn{font:400 1.6cqw/1 'Anton';text-transform:uppercase;color:#fff}
.chx .roster .rs{font:700 .95cqw/1.2 'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;color:var(--hud-dim)}
.chx .roster span{font:400 .85cqw/1 'Black Ops One';padding:.35em .6em;letter-spacing:.12em}
.chx .roster .vt{background:var(--caution);color:#111}.chx .roster .rk{background:var(--neon);color:#111}
/* dialogue, inside the stage */
.chx .dlg{position:absolute;left:1.8%;right:1.8%;bottom:2%;height:15%;z-index:12;pointer-events:none}
/* see-through enough that the people standing behind it still show (the user, 2026-10-16: the text bar hides people) */
.chx .dlg .panel{position:absolute;inset:0;background:linear-gradient(180deg,rgba(26,23,21,.62),rgba(14,12,11,.86));backdrop-filter:blur(1.5px);clip-path:polygon(1.2% 0,100% 0,98.8% 100%,0 100%);box-shadow:0 1cqh 3cqh rgba(0,0,0,.5)}
.chx .dlg .panel::before{content:"";position:absolute;left:0;right:0;top:0;height:.9cqh;background:repeating-linear-gradient(-45deg,var(--caution) 0 1.2cqw,#111 1.2cqw 2.4cqw)}
.chx .dlg .panel::after{content:"";position:absolute;right:1.6%;bottom:12%;width:.7cqw;height:.7cqw;border-radius:50%;background:var(--rivet)}
.chx .dlg.host .panel::before{background:repeating-linear-gradient(-45deg,var(--fire) 0 1.2cqw,#111 1.2cqw 2.4cqw)}
.chx .dlg.conf .panel::before{background:linear-gradient(90deg,var(--red),var(--fire))}
.chx .cutin{position:absolute;left:1.2%;bottom:0;width:13.5%;aspect-ratio:.86;overflow:hidden;background:#222;z-index:2;clip-path:polygon(0 0,100% 4%,92% 100%,0 100%)}
.chx .cutin img{width:100%;height:100%;object-fit:cover;object-position:50% 18%}
.chx .cutin.fresh{animation:chxCutin .45s cubic-bezier(.2,.9,.3,1.1)}
@keyframes chxCutin{from{transform:translateX(-50%);opacity:0}}
.chx .dlg .name{position:absolute;left:calc(var(--cut,0%) + 2.6%);top:-2.6cqh;z-index:3;font:400 2.1cqw/1 'Anton';letter-spacing:.05em;text-transform:uppercase;color:#141110;background:var(--tape);padding:.35em 1.1em .3em .8em;rotate:-1.5deg;box-shadow:0 .3cqh .6cqh rgba(0,0,0,.5);clip-path:polygon(0 8%,3% 0,7% 9%,11% 0,100% 0,97% 45%,100% 100%,6% 100%,2% 86%,0 100%)}
.chx .dlg .name small{font:700 .95cqw 'Barlow Condensed';letter-spacing:.14em;margin-left:.7em;opacity:.75}
.chx .dlg.host .name{background:var(--fire)}
.chx .dlg.conf .name{background:var(--red);color:#fff}
.chx .dlg.dir .name{display:none}
.chx .dlg .say{position:absolute;left:calc(var(--cut,0%) + 2.6%);right:5%;top:12%;bottom:6%;color:var(--hud);display:flex;align-items:center;font:600 2.05cqw/1.28 'Barlow Condensed';text-shadow:0 .15cqw .4cqw rgba(0,0,0,.95)}
.chx .dlg.dir .say{font:600 italic 1.95cqw/1.35 'Barlow Condensed';color:#d9cfc5}
.chx .dlg .say span.hn{color:var(--caution)}
.chx .dlg .say span.hg{color:var(--fire2)}
.chx .dlg .say.punch{animation:chxPunch .3s cubic-bezier(.3,1.7,.5,1);transform-origin:0 50%}
@keyframes chxPunch{from{transform:scale(.86);opacity:0}}
.chx .dlg .next{position:absolute;right:2.2%;bottom:14%;width:1.4cqw;aspect-ratio:1;background:var(--caution);clip-path:polygon(0 0,100% 50%,0 100%);animation:chxNx .8s ease-in-out infinite alternate}
@keyframes chxNx{to{transform:translateX(.5cqw)}}
.chx .dlg.loud .panel{animation:chxDshake .35s linear}
@keyframes chxDshake{25%{transform:translateX(-.6cqw)}50%{transform:translateX(.5cqw)}75%{transform:translateX(-.3cqw)}}
.chx .caret{display:inline-block;width:.45em;height:1em;background:var(--caution);vertical-align:-.12em;margin-left:.1em;animation:chxBlink .7s steps(2) infinite}
@keyframes chxBlink{50%{opacity:0}}
/* the confessional */
.chx .confcut{position:absolute;inset:0;z-index:8;overflow:hidden}
.chx .confcut>.chx-plate{animation:chxCpush 9s ease-out forwards}
@keyframes chxCpush{from{transform:scale(1.02)}to{transform:scale(1.09)}}
.chx .confcut .who{position:absolute;top:70%;width:30cqw;aspect-ratio:1;translate:-50% -100%;animation:chxCpush2 9s ease-out forwards}
@keyframes chxCpush2{from{scale:1}to{scale:1.05}}
.chx .confcut .who .face{position:absolute;inset:0;overflow:hidden;border:.4cqw solid #0c0a0a;clip-path:polygon(0 4%,4% 0,100% 0,100% 96%,96% 100%,0 100%);box-shadow:0 2cqh 4cqh rgba(0,0,0,.6)}
.chx .confcut .who img{width:100%;height:100%;object-fit:cover}
.chx .confcut .lower{position:absolute;left:4%;top:8%;display:grid;gap:.5cqh;animation:chxLowin .5s .15s cubic-bezier(.2,.9,.3,1.1) both}
@keyframes chxLowin{from{transform:translateX(-120%)}}
.chx .confcut .lower .n{font:400 4cqw/1 'Anton';text-transform:uppercase;color:#fff;background:#111;padding:.2em .45em .12em;border-left:.6cqw solid var(--fire);transform:skewX(-7deg)}
.chx .confcut .lower .s{justify-self:start;font:400 1.2cqw/1 'Black Ops One';color:#111;background:var(--caution);padding:.45em .7em;letter-spacing:.14em;transform:skewX(-7deg)}
.chx .confcut .rec{position:absolute;right:3%;top:6%;display:flex;gap:.6cqw;align-items:center;font:400 1.3cqw/1 'Black Ops One';color:#fff;letter-spacing:.16em}
.chx .confcut .rec i{width:1cqw;height:1cqw;border-radius:50%;background:var(--red);animation:chxBlink 1s steps(2) infinite}
.chx .vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 70% 75% at 50% 45%,transparent 55%,rgba(0,0,0,.6))}
.chx .grain{position:absolute;inset:-40%;pointer-events:none;opacity:.12;mix-blend-mode:overlay;animation:chxGrain .5s steps(4) infinite;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
@keyframes chxGrain{25%{transform:translate(-5%,3%)}50%{transform:translate(4%,-2%)}75%{transform:translate(-2%,-5%)}}
.chx .static{position:absolute;inset:-20%;z-index:30;pointer-events:none;opacity:0;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.3' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.chx .static.burst{animation:chxBurst .42s steps(5) forwards}
@keyframes chxBurst{0%{opacity:1}25%{transform:translate(-5%,3%)}50%{opacity:.9;transform:translate(4%,-2%)}100%{opacity:0}}
/* overlays */
.chx .over{position:absolute;inset:0;z-index:20;pointer-events:none;overflow:hidden}
.chx .seg{position:absolute;inset:0;display:grid;place-items:center;background:rgba(8,6,6,.35)}
.chx .seg .band{position:absolute;left:-10%;right:-10%;top:33%;height:28%;background:#111;rotate:-5deg;box-shadow:0 0 0 .5cqw var(--caution),0 0 0 1cqw #111;animation:chxBand .45s cubic-bezier(.2,.9,.3,1) both}
.chx .seg .band::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 4cqw,rgba(255,255,255,.04) 4cqw 8cqw)}
@keyframes chxBand{from{translate:-110% 0}}
.chx .seg .in{position:relative;text-align:center;rotate:-5deg;margin-top:-8cqh}
.chx .seg .k{font:400 1.6cqw 'Black Ops One';color:var(--caution);letter-spacing:.4em;animation:chxFadeup .4s .3s both}
.chx .seg .big{font:400 8cqw/1 'Anton';text-transform:uppercase;color:#fff;-webkit-text-stroke:.2cqw #000;paint-order:stroke fill;text-shadow:.5cqw .5cqw 0 var(--fire);animation:chxSlam .5s .15s cubic-bezier(.3,1.6,.5,1) both;white-space:nowrap}
@keyframes chxSlam{from{scale:2.6;opacity:0}}
@keyframes chxFadeup{from{opacity:0;translate:0 40%}}
.chx .wipe{position:absolute;inset:0;z-index:25}
.chx .wipe i{position:absolute;left:-30%;width:160%;height:26%;background:var(--caution);rotate:-8deg;border-block:1.2cqh solid;border-image:repeating-linear-gradient(-45deg,#111 0 1.3cqh,var(--caution) 1.3cqh 2.6cqh) 1;animation:chxWipe .9s cubic-bezier(.6,0,.4,1) both}
.chx .wipe i:nth-child(1){top:-6%}.chx .wipe i:nth-child(2){top:18%;animation-delay:.05s}.chx .wipe i:nth-child(3){top:42%;animation-delay:.1s}
.chx .wipe i:nth-child(4){top:66%;animation-delay:.15s}.chx .wipe i:nth-child(5){top:90%;animation-delay:.2s}
@keyframes chxWipe{0%{translate:-110% 0}45%,55%{translate:0 0}100%{translate:110% 0}}
.chx .spray{position:absolute;left:50%;top:40%;width:66cqw;translate:-50% -50%;rotate:-5deg}
.chx .spray svg{width:100%;overflow:visible}
.chx .spray .paint{clip-path:inset(0 100% 0 0);animation:chxSprayon .7s .05s steps(14) forwards}
@keyframes chxSprayon{to{clip-path:inset(0 0 0 0)}}
.chx .spray.still .paint{animation:none;clip-path:none}
.chx .spray .drip{transform-box:fill-box;transform-origin:top;animation:chxDrip 1.6s .7s ease-in both}
@keyframes chxDrip{from{transform:scaleY(0)}}
.chx .stamp{position:absolute;left:50%;top:40%;translate:-50% -50%;rotate:-11deg;padding:1.2cqh 2.6cqw .8cqh;font:400 7.4cqw/1 'Black Ops One';color:var(--red);border:.8cqw solid var(--red);letter-spacing:.04em;background:rgba(30,0,0,.25);animation:chxStamp .28s cubic-bezier(.3,1.6,.5,1) both;-webkit-mask:var(--chx-grunge);mask:var(--chx-grunge)}
@keyframes chxStamp{from{scale:2.6;opacity:0}to{opacity:.95}}
.chx .winner{position:absolute;left:50%;top:24%;translate:-50% -50%;rotate:-3deg;font:400 6cqw/1 'Anton';color:var(--caution);text-transform:uppercase;white-space:nowrap;-webkit-text-stroke:.18cqw #000;paint-order:stroke fill;text-shadow:.4cqw .4cqw 0 #000,0 0 4cqw rgba(255,106,26,.85);animation:chxSlam .45s cubic-bezier(.3,1.6,.5,1) both}
.chx .spark{position:absolute;width:.5cqw;height:1.6cqw;background:var(--caution);border-radius:.2cqw;animation:chxSpark 1.1s cubic-bezier(.2,.8,.3,1) forwards}
@keyframes chxSpark{from{transform:translate(0,0) rotate(var(--r));opacity:1}to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}
.chx .confetti{position:absolute;width:.7cqw;height:1.1cqw;top:-4%;animation:chxConf var(--d,3s) linear forwards;animation-delay:var(--dl,0s)}
@keyframes chxConf{to{transform:translate(var(--dx),110cqh) rotate(var(--r))}}
.chx .open{position:absolute;inset:0;background:#070505;overflow:hidden}
.chx .open .flash{position:absolute;inset:0;opacity:0;animation:chxOflash .26s steps(1) both;background:#070505}
@keyframes chxOflash{0%{opacity:1}100%{opacity:0}}
.chx .open .flash img{position:absolute;left:50%;top:50%;width:52cqw;height:52cqw;translate:-50% -50%;object-fit:cover;filter:contrast(1.15) saturate(1.3)}
.chx .open .flash img+img{translate:calc(-50% + 1.2cqw) -50%;mix-blend-mode:screen;filter:hue-rotate(160deg) saturate(2.5);opacity:.55}
.chx .open .flash b{position:absolute;bottom:12%;left:6%;font:400 9cqw/1 'Anton';color:#fff;text-transform:uppercase;-webkit-text-stroke:.2cqw #000;paint-order:stroke fill;text-shadow:.5cqw .5cqw 0 var(--fire);transform:skewX(-8deg)}
.chx .open .grid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(2,1fr);gap:.3cqw;padding:.3cqw;animation:chxGridin .4s both}
.chx .open .grid img{width:100%;height:100%;object-fit:cover;filter:grayscale(.4) brightness(.5);animation:chxGpop .3s both}
@keyframes chxGridin{from{opacity:0}}
@keyframes chxGpop{from{scale:0}}
.chx .open .logo2{position:absolute;left:50%;top:50%;translate:-50% -50%;text-align:center;animation:chxSlam .5s cubic-bezier(.3,1.6,.5,1) both;white-space:nowrap}
.chx .open .logo2 .a{font:400 2.6cqw/1 'Black Ops One';color:var(--caution);letter-spacing:.4em;text-shadow:.3cqw .3cqw 0 #000}
.chx .open .logo2 .b{font:400 14cqw/.9 'Anton';color:var(--fire);text-transform:uppercase;transform:skewX(-10deg);-webkit-text-stroke:.3cqw #000;paint-order:stroke fill;text-shadow:.6cqw .6cqw 0 #000,0 0 6cqw rgba(255,106,26,.6)}
.chx .open .logo2 .c{margin-top:1.4cqh;display:inline-block;font:400 2.2cqw/1 'Black Ops One';color:#111;background:var(--caution);padding:.4em 1em;letter-spacing:.3em}
.chx .open .scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 2px,transparent 2px 4px);pointer-events:none}
/* a player's introduction */
.chx .intro{position:absolute;left:3%;top:5%;width:64%;height:70%;z-index:9;overflow:hidden;background:#070505;box-shadow:0 0 0 .35cqw #000,0 0 0 .7cqw var(--fire),0 2cqh 5cqh rgba(0,0,0,.6);clip-path:polygon(0 0,100% 0,97% 100%,0 100%);animation:chxIcard .45s cubic-bezier(.2,.9,.3,1.1) both}
@keyframes chxIcard{from{transform:translateX(-40%);opacity:0}}
.chx .intro.still{animation:none}
.chx .chx-frame.introing .chx-hud .loc,.chx .chx-frame.introing .chx-hud .roster{display:none}
.chx .intro .ibg{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;filter:saturate(1.25) contrast(1.05);animation:chxIbg 9s ease-out both}
.chx .intro.multi .ibg{opacity:0;animation:chxIbgCycle calc(var(--n) * 2.2s) linear infinite,chxIbg 9s ease-out both}
@keyframes chxIbg{from{transform:scale(1.12) translateX(2%)}to{transform:scale(1) translateX(-1%)}}
@keyframes chxIbgCycle{0%{opacity:0}6%{opacity:1}30%{opacity:1}38%{opacity:0}100%{opacity:0}}
.chx .intro .igrade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,6,6,.15) 0%,rgba(8,6,6,.55) 45%,rgba(14,8,4,.92) 70%),linear-gradient(0deg,rgba(255,106,26,.28),transparent 40%);mix-blend-mode:normal}
.chx .intro .iscan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 2px,transparent 2px 4px);pointer-events:none}
.chx .intro .iface{position:absolute;left:3%;bottom:0;width:25cqw;aspect-ratio:1;overflow:hidden;clip-path:polygon(0 0,92% 0,100% 100%,0 100%);box-shadow:0 0 0 .4cqw #000;animation:chxIface .6s cubic-bezier(.2,.9,.3,1.1) both;border-right:.6cqw solid var(--fire)}
.chx .intro .iface img{width:100%;height:100%;object-fit:cover;object-position:50% 20%}
@keyframes chxIface{from{transform:translateX(-70%);opacity:0}}
.chx .intro .itext{position:absolute;left:44%;right:5%;top:7%;bottom:6%;display:flex;flex-direction:column;gap:1.2cqh;justify-content:center}
.chx .intro .ikick{font:400 1.1cqw/1 'Black Ops One';letter-spacing:.3em;color:var(--caution);animation:chxFadeup .4s .2s both}
.chx .intro .iname{font:400 5.2cqw/.9 'Anton';text-transform:uppercase;color:#fff;-webkit-text-stroke:.2cqw #000;paint-order:stroke fill;text-shadow:.5cqw .5cqw 0 var(--fire);transform:skewX(-8deg);animation:chxSlam .5s .25s cubic-bezier(.3,1.6,.5,1) both;line-height:.9;word-break:break-word}
.chx .intro .ifacts{display:flex;gap:.6cqw;flex-wrap:wrap;animation:chxFadeup .4s .55s both}
.chx .intro .ifacts span{font:700 1cqw/1 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase;color:#111;background:var(--tape);padding:.45em .8em;clip-path:polygon(0 8%,4% 0,100% 0,96% 100%,0 100%)}
.chx .intro .iseasons{display:grid;gap:.6cqh;margin-top:.6cqh}
.chx .intro .iseason{display:flex;justify-content:space-between;gap:1cqw;background:rgba(14,12,11,.85);border-left:.4cqw solid var(--fire);padding:.6cqh 1cqw;animation:chxLowin .45s cubic-bezier(.2,.9,.3,1.1) both}
.chx .intro .iseason b{font:400 1.15cqw/1 'Anton';text-transform:uppercase;color:#fff}
.chx .intro .iseason span{font:700 1.05cqw/1 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--hud-dim)}
.chx .intro .iseason.won{border-left-color:var(--caution);background:rgba(60,48,8,.9)}
.chx .intro .iseason.won span{color:var(--caution)}
.chx .intro .ibadges{display:flex;gap:.6cqw;flex-wrap:wrap}
.chx .intro .ibadges span{font:400 1.1cqw/1 'Black Ops One';letter-spacing:.14em;color:#111;background:var(--caution);padding:.5em .8em;animation:chxChip .4s cubic-bezier(.3,1.7,.5,1) both}
.chx .intro .irival{display:flex;align-items:center;gap:.8cqw;animation:chxFadeup .4s 1.9s both}
.chx .intro .irival img{width:4.4cqw;height:4.4cqw;object-fit:cover;border:.2cqw solid var(--red)}
.chx .intro .irival span{font:400 1cqw/1 'Black Ops One';letter-spacing:.2em;color:var(--red)}
.chx .intro .irival b{font:400 2cqw/1 'Anton';text-transform:uppercase;color:#fff}
.chx .intro .istory{font:600 italic 1.3cqw/1.35 'Barlow Condensed';color:#efe6dc;border-left:.35cqw solid var(--caution);padding-left:1cqw;animation:chxFadeup .5s .8s both;max-width:46cqw}
.chx .intro .itag{font:400 1.7cqw/1.1 'Permanent Marker';color:var(--caution);transform:rotate(-2deg);animation:chxFadeup .5s .8s both}
.chx .intro.still *{animation-duration:0s!important;animation-delay:0s!important}
.chx .intro.still.multi .ibg{opacity:0}.chx .intro.still.multi .ibg:first-child{opacity:1}
/* the villa map */
.chx .mpin{position:absolute;translate:-50% -100%;display:grid;justify-items:center;gap:.35cqh;z-index:4;pointer-events:auto}
.chx .mpin .faces{display:flex}
.chx .mpin .faces img{width:3cqw;height:3cqw;border-radius:50%;object-fit:cover;border:.18cqw solid #111;margin-left:-.9cqw;background:#333;box-shadow:0 .2cqh .4cqh rgba(0,0,0,.5)}
.chx .mpin .faces img:first-child{margin-left:0}
.chx .bub{position:relative;font:400 1.05cqw/1.2 'Black Ops One';letter-spacing:.03em;text-transform:uppercase;background:#f5efe8;color:#140c08;padding:.45em .8em;border-radius:.8em;border:.15cqw solid #111;max-width:17cqw;text-align:center;cursor:pointer;animation:chxChip .4s both;box-shadow:0 .3cqh .6cqh rgba(0,0,0,.45)}
.chx .bub::after{content:"";position:absolute;left:50%;bottom:-.6em;border:.35em solid transparent;border-top-color:#111;translate:-50% 0}
.chx .mpin .bubs{display:grid;gap:.3cqw;justify-items:center}
.chx .mpin .mlbl{font:400 .8cqw/1 'Black Ops One';letter-spacing:.1em;text-transform:uppercase;color:#fff;background:rgba(14,12,11,.85);padding:.25cqw .5cqw;border-bottom:.15cqw solid var(--fire);white-space:nowrap}
.chx .mpin .bub{max-width:13cqw;font-size:.95cqw}
.chx .dlg{transition:opacity .25s,transform .25s}
.chx .prop.bigclock-w{transform:none;transition:none}.chx .bigclock-w svg{width:100%;height:100%;display:block;filter:none}.chx .bigclock-w .on{fill:#ff2a14}.chx .bigclock-w .off{fill:#3a0705}
.chx .bigclock-unused{position:absolute;left:55.4%;top:9.6%;width:38.8%;height:32%;display:flex;align-items:center;justify-content:center;background:#140303;border-radius:.4cqw;font:400 9.6cqw/1 'Black Ops One',monospace;letter-spacing:.06em;color:#ff2a18;text-shadow:0 0 1.2cqw rgba(255,40,20,.9),0 0 .3cqw #ff6040;z-index:2;pointer-events:none}
.chx .mtabs-unused{position:absolute;left:2%;top:3.6%;z-index:7;display:flex;pointer-events:auto}
.chx .mtabs button{border:0;background:rgba(14,12,11,.88);color:var(--hud-dim);font:400 1cqw/1 'Black Ops One';letter-spacing:.08em;text-transform:uppercase;padding:.6cqw 1cqw;cursor:pointer}
.chx .mtabs button.on{background:var(--fire);color:#140c08}
.chx .mview{position:absolute;inset:0;pointer-events:none}
.chx .mview .mpin{pointer-events:auto;cursor:pointer}
.chx .mview.isle{display:block;background:#000 center/cover no-repeat;z-index:3}
.chx .mview.villa{display:none}
.chx.mview-villa .mview.isle{display:none}
.chx.mview-villa .mview.villa{display:block}
.chx.on-map .dlg{display:none}
.chx .mpin.quiet .mlbl{opacity:0;transition:opacity .2s}
.chx .mpin.quiet:hover .mlbl{opacity:1}
.chx .mpin .mdot{width:1.1cqw;height:1.1cqw;border-radius:50%;background:rgba(255,255,255,.75);box-shadow:0 0 0 .2cqw rgba(14,12,11,.6);display:block}
.chx .mpin.quiet:hover .mdot{background:var(--fire)}
.chx .mpin.live:hover .faces img{transform:translateY(-.3cqh)}
.chx .bub.enter{background:var(--fire);color:#140c08}
.chx .bub.more{background:#2a2420;color:var(--hud)}
.chx .villa-pin .faces img{width:2.6cqw;height:2.6cqw}
.chx .mback{position:absolute;left:2%;top:3.6%;z-index:7;pointer-events:auto;border:0;background:var(--fire);color:#140c08;font:400 1.05cqw/1 'Black Ops One';letter-spacing:.08em;text-transform:uppercase;padding:.6cqw 1cqw;cursor:pointer}
.chx .mhint{position:absolute;left:50%;bottom:4%;translate:-50% 0;z-index:8;pointer-events:none;background:rgba(14,12,11,.88);color:var(--hud);font:600 1.15cqw 'Barlow Condensed';letter-spacing:.04em;padding:.5cqw 1.2cqw;border-left:.3cqw solid var(--fire);animation:chxHint 4.5s ease both}
.chx .mhint.again{animation:chxHint 3s ease both}
@keyframes chxHint{0%{opacity:0;translate:-50% 30%}10%,75%{opacity:1;translate:-50% 0}100%{opacity:0}}
.chx.mzoom .chx-world,.chx.mzoom .mview{transform-origin:var(--zx,50%) var(--zy,50%);scale:2.8;filter:brightness(1.15) saturate(1.1);transition:scale .5s cubic-bezier(.65,0,.25,1),filter .5s}
.chx.mzoom .chx-hud > :not(.mview){opacity:0;transition:opacity .2s}
.chx.mzoom .mpin,.chx.mzoom .mhint,.chx.mzoom .mback{opacity:0;transition:opacity .2s}
.chx.marrive .chx-world,.chx.marrive .mview{animation:chxArrive .55s cubic-bezier(.2,.8,.2,1)}
@keyframes chxArrive{from{scale:1.25;filter:blur(.35cqw) brightness(1.25);opacity:.25}to{scale:1;filter:none;opacity:1}}
.chx.mleave .mview.isle{animation:chxLeave .55s cubic-bezier(.2,.8,.2,1)}
@keyframes chxLeave{from{scale:2.4;filter:blur(.3cqw);opacity:.3}to{scale:1;filter:none;opacity:1}}
.chx.flashback .chx-world{filter:sepia(.5) saturate(.7) contrast(1.05) brightness(.95)}
.chx.flashback .chx-frame::after{content:'';position:absolute;inset:0;z-index:9;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0 2px,transparent 2px 4px),radial-gradient(ellipse at center,transparent 55%,rgba(30,15,0,.55));animation:chxFlick .18s steps(2) infinite}
@keyframes chxFlick{0%{opacity:.85}100%{opacity:1}}
.chx .tcard{position:absolute;inset:0;z-index:22;display:grid;place-items:center;text-align:center;background:radial-gradient(ellipse at 50% 45%,rgba(20,12,8,.55),rgba(5,3,2,.94) 75%);backdrop-filter:blur(3px) saturate(.8);animation:chxCardIn .45s cubic-bezier(.2,.9,.3,1) both}
.chx .tcard .ttape{position:absolute;left:-5%;right:-5%;height:4.2%;background:repeating-linear-gradient(-45deg,#ffd21a 0 2.2cqw,#141010 2.2cqw 4.4cqw);box-shadow:0 .4cqh 1cqh rgba(0,0,0,.6)}
.chx .tcard .t1{top:7%;rotate:-2deg;animation:chxTape .6s .1s both}
.chx .tcard .t2{bottom:9%;rotate:1.5deg;animation:chxTapeR .6s .2s both}
.chx .tcard .tin{display:grid;justify-items:center;gap:.6cqw;max-width:80%}
.chx .tcard .tk{font:400 1.5cqw/1 'Black Ops One';letter-spacing:.35em;color:var(--fire);text-transform:uppercase;animation:chxChip .4s .1s both}
.chx .tcard .tt{font:400 7.2cqw/.95 'Anton';text-transform:uppercase;color:#fff;letter-spacing:.01em;text-shadow:0 .4cqw 0 #000,0 0 3cqw rgba(255,106,26,.55);animation:chxSlamIn .5s .15s cubic-bezier(.2,1.6,.4,1) both}
.chx .tcard .ts{font:600 1.9cqw/1.2 'Barlow Condensed';color:var(--hud);letter-spacing:.04em;animation:chxChip .4s .3s both}
.chx .tcard .tl{font:400 1cqw/1 'Black Ops One';letter-spacing:.3em;color:#7ad97a;margin-top:.8cqw}
.chx .tcard .tfaces{display:flex;gap:1.2cqw;align-items:center;margin-top:.6cqw}
.chx .tcard .tf{display:grid;justify-items:center;gap:.3cqw;animation:chxChip .45s both}
.chx .tcard .tf img{width:6.4cqw;height:6.4cqw;object-fit:cover;border:.3cqw solid #111;box-shadow:0 0 0 .2cqw var(--fire),0 .6cqh 1.4cqh rgba(0,0,0,.6);background:#2a2420;clip-path:polygon(6% 0,100% 0,94% 100%,0 100%)}
.chx .tcard .tf b{font:400 1.1cqw/1 'Anton';letter-spacing:.06em;color:#fff;text-transform:uppercase}
.chx .tcard.isvs .tf img{width:11cqw;height:11cqw}
.chx .tcard.isvs .tf b{font-size:1.8cqw}
.chx .tcard .tvs{font:400 5cqw/1 'Anton';color:var(--caution);text-shadow:0 .3cqw 0 #000;animation:chxSlamIn .5s .5s cubic-bezier(.2,1.6,.4,1) both}
.chx .tcard .tgo{margin-top:1.4cqw;font:400 1cqw/1 'Black Ops One';letter-spacing:.3em;color:#140c08;background:var(--fire);padding:.6cqw 1.4cqw;clip-path:polygon(6% 0,100% 0,94% 100%,0 100%);animation:chxBlinkGo 1.6s 1s ease-in-out infinite}
@keyframes chxCardIn{from{opacity:0}to{opacity:1}}
@keyframes chxTape{from{translate:-110% 0}to{translate:0 0}}
@keyframes chxTapeR{from{translate:110% 0}to{translate:0 0}}
@keyframes chxSlamIn{0%{opacity:0;scale:2.2}60%{opacity:1;scale:.94}100%{scale:1}}
@keyframes chxBlinkGo{0%,100%{opacity:1}50%{opacity:.55}}
.chx .bub.star{background:var(--caution)}
.chx .bub.seen{background:#3a3430;color:#cfc4ba;border-color:#000}
.chx .bub.seen::before{content:"\\2713  ";color:#7ad97a}
.chx .tomap{position:absolute;left:2%;top:calc(3.6% + 6.4cqw);z-index:11;pointer-events:auto;border:0;background:rgba(14,12,11,.9);color:var(--hud);font:400 1.05cqw/1 'Black Ops One';letter-spacing:.08em;padding:.6cqw 1cqw;cursor:pointer;border-left:.3cqw solid var(--fire)}
.chx .tomap:hover{color:var(--fire)}
.chx .mcount{position:absolute;left:50%;top:calc(3.6% + 3.2cqw);translate:-50% 0;font:400 1cqw/1 'Black Ops One';letter-spacing:.1em;color:var(--hud);background:rgba(14,12,11,.85);padding:.45cqw .9cqw;z-index:6}
.chx .isle{position:absolute;inset:0;z-index:25;background:#000 center/cover no-repeat;display:none;cursor:default}
.chx .isle.open{display:block;animation:chxChip .35s both}
.chx .isle .ipin{position:absolute;translate:-50% -.8cqw;display:grid;justify-items:center;gap:.3cqw}
.chx .isle .ipin .chips{display:grid;gap:.2cqw;justify-items:center}
.chx .isle .ipin i{width:1.6cqw;height:1.6cqw;border-radius:50%;background:var(--fire);box-shadow:0 0 0 .25cqw #fff,0 .3cqh .8cqh rgba(0,0,0,.6)}
.chx .isle .ipin.here i{animation:chxPin 1.2s ease-in-out infinite;background:var(--caution)}
.chx .isle .ipin span{cursor:pointer;font:400 1.15cqw/1.1 'Black Ops One';letter-spacing:.06em;color:#fff;background:rgba(14,12,11,.9);padding:.4cqw .7cqw;text-transform:uppercase;white-space:nowrap;border-bottom:.25cqh solid var(--fire)}
.chx .isle .ipin span:hover,.chx .isle .ipin span.cur{color:var(--caution)}
.chx .isle .ihead{position:absolute;left:2%;top:3.6%;font:400 2cqw/1 'Anton';color:#fff;text-transform:uppercase;letter-spacing:.04em;background:rgba(14,12,11,.88);padding:.6cqw 1.2cqw;border-left:.4cqw solid var(--fire)}
.chx .isle .ihead small{display:block;font:700 .95cqw 'Barlow Condensed';letter-spacing:.14em;color:var(--hud-dim)}
.chx .isle .iclose{position:absolute;right:2%;top:3.6%;border:0;background:rgba(14,12,11,.9);color:#fff;font:400 1.2cqw/1 'Black Ops One';padding:.6cqw 1cqw;cursor:pointer}
.chx .bub.star::before{content:"\\2605  ";color:var(--red)}
/* watched: greyed, and the tick wins over the star (the user, 2026-10-16: "the conversations don't show
   they've been read") */
.chx .bub.seen,.chx .bub.star.seen{background:#2b2724;color:#9d948b;border-color:#000;opacity:.82}
.chx .bub.seen::before,.chx .bub.star.seen::before{content:"\\2713  ";color:#5fe06a;font-size:1.15em}
.chx .bub.enter.done{background:#2b2724;color:#5fe06a}
.chx .bub:hover{scale:1.06}
.chx .bub em{font-style:normal;opacity:.6;margin-left:.3em}
.chx .later{position:absolute;left:50%;bottom:24%;translate:-50% 0;display:flex;gap:1cqw;pointer-events:auto}
.chx .clock{position:absolute;left:50%;top:3.6%;translate:-50% 0;display:flex;gap:.4cqw;z-index:6}
.chx .clock span{font:400 1.15cqw/1 'Anton';text-transform:uppercase;padding:.55em 1.1em;background:rgba(14,12,11,.88);color:var(--hud-dim);clip-path:polygon(6% 0,100% 0,94% 100%,0 100%)}
.chx .clock span.done{color:var(--hud)}
.chx .clock span.now{background:var(--fire);color:#111}
.chx .clock span.lock{color:#6d655f}
/* intel */
.chx .intel{position:absolute;top:0;right:0;bottom:0;width:min(32%,380px);z-index:28;pointer-events:auto;transform:translateX(100%);transition:transform .35s cubic-bezier(.3,.8,.3,1);background:rgba(16,14,13,.95);border-left:.35cqw solid var(--caution);padding:2.4cqh 1.4cqw;display:flex;flex-direction:column;color:var(--hud);cursor:default}
.chx .intel.open{transform:none}
.chx .intel h4{margin:0;font:400 1.5cqw/1 'Black Ops One';color:var(--caution);letter-spacing:.1em;display:flex;justify-content:space-between}
.chx .intel h4 button{border:0;background:none;color:var(--hud-dim);cursor:pointer;font:400 1.4cqw 'Anton'}
.chx .intel .sub{font:600 1cqw 'Barlow Condensed';color:var(--hud-dim);margin:.5cqh 0 1.2cqh}
.chx .intel .list{overflow:auto;flex:1}
.chx .pbtn.intelbtn{width:auto;padding:0 12px;font:400 13px/1 'Black Ops One';letter-spacing:.12em;position:relative}
.chx .pbtn.intelbtn.on{background:var(--caution);color:#111}
.chx .pbtn.intelbtn i{position:absolute;top:5px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--fire);display:none}
.chx .pbtn.intelbtn.new i{display:block;animation:chxPin 1s ease-in-out infinite}
.chx .intel .itabs{display:flex;flex-wrap:wrap;gap:.3cqw;margin:0 0 1cqh}
.chx .intel .itabs button{border:1px solid #3a332e;background:#1d1917;color:var(--hud-dim);font:600 .95cqw 'Barlow Condensed';letter-spacing:.06em;text-transform:uppercase;padding:.3cqw .6cqw;cursor:pointer}
.chx .intel .itabs button.on{background:var(--fire);color:#140c08;border-color:var(--fire)}
.chx .intel .if{width:2.2cqw;height:2.2cqw;border-radius:50%;object-fit:cover;background:#2a2420;vertical-align:middle;flex:none;border:.12cqw solid #111}
.chx .intel .ipick{display:flex;flex-wrap:wrap;gap:.25cqw;margin-bottom:.6cqh}
.chx .intel .ipick button{border:.15cqw solid transparent;border-radius:50%;padding:0;background:none;cursor:pointer;opacity:.7}
.chx .intel .ipick button.on{border-color:var(--caution);opacity:1}
.chx .intel .isub{font:400 .95cqw 'Black Ops One';letter-spacing:.14em;color:var(--hud-dim);text-transform:uppercase;margin:1cqh 0 .5cqh}
.chx .intel .irow{display:flex;align-items:center;gap:.5cqw;padding:.35cqh 0;font:600 1.1cqw 'Barlow Condensed';color:var(--hud)}
.chx .intel .irow b{flex:1}
.chx .intel .ibond{font:400 .85cqw 'Anton';letter-spacing:.06em;text-transform:uppercase;padding:.15cqw .5cqw;background:#2a2420;color:var(--hud-dim)}
.chx .intel .ibond.close{background:#173a22;color:#7fe07f}.chx .intel .ibond.friend{background:#17323a;color:#6fd8ff}
.chx .intel .ibond.tense{background:#3a2d12;color:#ffc94a}.chx .intel .ibond.enemy{background:#3a1215;color:#ff7a6e}
.chx .intel .ilove{font:600 .85cqw 'Barlow Condensed';color:#ff8fc7}
.chx .intel .ial{border:1px solid #3a332e;background:rgba(255,255,255,.04);padding:.6cqw;margin-bottom:.8cqh}
.chx .intel .ialn{font:400 1.2cqw 'Anton';color:var(--caution);letter-spacing:.05em;margin-bottom:.4cqh}
.chx .intel .ialm{display:flex;flex-wrap:wrap;gap:.4cqw .8cqw;font:600 1.05cqw 'Barlow Condensed';color:var(--hud)}
.chx .intel .ialm span{display:inline-flex;align-items:center;gap:.3cqw}
.chx .intel .ialm em{font-style:normal;color:var(--fire);font-size:.85cqw}
.chx .intel .igone{font:600 1cqw 'Barlow Condensed';color:var(--hud-dim);text-decoration:line-through}
.chx .intel .irec{display:grid;grid-template-columns:2.4cqw 1fr repeat(4,3.2cqw) 4cqw;align-items:center;gap:.3cqw;padding:.25cqh 0;font:600 1.05cqw 'Barlow Condensed';color:var(--hud)}
.chx .intel .irec i{font-style:normal;text-align:center;color:var(--caution)}
.chx .intel .irec.ihead{font:400 .8cqw 'Black Ops One';color:var(--hud-dim);letter-spacing:.06em;text-transform:uppercase}
.chx .intel .irec.ihead i{color:var(--hud-dim)}
.chx .intel .inone{color:var(--hud-dim);font:600 1.1cqw 'Barlow Condensed';padding:.6cqh 0}
.chx .intel .inote{color:#6d655f;font:600 .85cqw 'Barlow Condensed';margin-top:1cqh}
.chx .icard{background:rgba(255,255,255,.05);padding:.9cqh .8cqw;margin-bottom:.8cqh;border-left:.3cqw solid var(--fire);font:600 1.2cqw/1.35 'Barlow Condensed'}
.chx .icard h6{margin:0 0 .3cqh;font:400 1.05cqw 'Anton';letter-spacing:.08em;text-transform:uppercase;color:var(--fire)}
.chx .icard.fresh{animation:chxIfresh 1.2s ease-out}
@keyframes chxIfresh{from{background:rgba(255,210,26,.25)}}
.chx .icard .b{display:flex;justify-content:space-between}
.chx .icard .up{color:#7fe07f}.chx .icard .dn{color:#ff7a6e}
/* controls */
.chx .chx-ctl{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.chx .cbtn{border:1px solid var(--cline);background:var(--cpanel);padding:9px 14px;cursor:pointer;display:inline-flex;gap:8px;align-items:center;font:700 15px 'Barlow Condensed';letter-spacing:.06em;text-transform:uppercase;clip-path:polygon(7px 0,100% 0,calc(100% - 7px) 100%,0 100%)}
.chx .cbtn.go{background:var(--fire);color:#140c08;border-color:var(--fire)}
.chx .cbtn.on{background:var(--caution);color:#111}
.chx .key{font:700 11px 'Barlow Condensed';padding:1px 6px;background:rgba(0,0,0,.18)}
.chx .pbtn{border:1px solid var(--cline);background:var(--cpanel);width:44px;height:40px;display:grid;place-items:center;cursor:pointer;padding:0;clip-path:polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)}
.chx .pbtn svg{width:18px;height:18px;fill:currentColor}
.chx .pbtn:hover{background:#26211e;color:var(--fire)}
.chx .pbtn.big{width:60px;background:var(--fire);color:#140c08;border-color:var(--fire)}
.chx .pbtn.big svg{width:22px;height:22px}
.chx .pbtn .i-pause{display:none}
.chx .pbtn.big.on .i-play{display:none}
.chx .pbtn.big.on .i-pause{display:block}
.chx .pbtn.speed{font:400 16px/1 'Anton';letter-spacing:.04em}
.chx .pbar{flex:1;min-width:200px;display:grid;gap:5px;padding:4px 0}
.chx .pbar .segs{display:flex;gap:3px;position:relative;padding:6px 0;cursor:pointer}
.chx .pbar .segs i{flex:1;height:8px;border-radius:4px;background:var(--cline);position:relative;overflow:hidden;transition:height .15s,background .15s}
.chx .pbar .segs:hover i{height:11px}
.chx .pbar .segs i:hover{background:#4a433d}
.chx .pbar .segs i.seen{background:#3d5a3a}
.chx .pbar .segs i b{position:absolute;inset:0 auto 0 0;width:0;background:var(--fire);transition:width .25s}
.chx .pbar .segs i.on b{background:var(--caution)}
.chx .pbar .segs .head{position:absolute;top:50%;left:0;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid var(--fire);transform:translate(-50%,-50%);box-shadow:0 1px 4px rgba(0,0,0,.5);pointer-events:none;transition:left .25s}
.chx .pbar .pt{font:700 12px 'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;color:var(--cmuted)}
.chx .chx-chapmenu{position:relative}
.chx .chx-chapmenu .chapters{display:none;position:absolute;left:0;top:calc(100% + 6px);z-index:40;width:260px;flex-direction:column;gap:2px;background:var(--cpanel);border:1px solid var(--cline);padding:8px;box-shadow:0 12px 30px rgba(0,0,0,.55)}
.chx .chx-chapmenu.open .chapters{display:flex}
.chx .chx-chapmenu .chap{padding:5px 6px}
.chx .chx-chapmenu .chap:hover{background:#26211e}
.chx .chap{flex:1;cursor:pointer;display:grid;gap:4px;min-width:0}
.chx .chap span{font:700 12px 'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;color:var(--cmuted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chx .chap.on span{color:var(--fire)}
.chx .chap i{display:block;height:6px;background:var(--cline);position:relative;overflow:hidden}
.chx .chap i b{position:absolute;inset:0 auto 0 0;background:var(--fire)}
.chx details.script{background:var(--cpanel);border:1px solid var(--cline)}
.chx details.script summary{cursor:pointer;padding:10px 14px;font:700 13px 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase;color:var(--cmuted)}
.chx .lines{max-height:260px;overflow:auto;padding:0 14px 12px;font-size:16px}
.chx .ln{padding:3px 8px;cursor:pointer}
.chx .ln.cur{background:rgba(255,106,26,.18)}
.chx .ln .n{font-weight:800;color:var(--fire)}
.chx .ln.d{font-style:italic;color:var(--cmuted)}
.chx .ln.sc{font:400 13px 'Black Ops One';letter-spacing:.1em;color:var(--cmuted);margin-top:8px}
#visual-player.tdx-tv .chx{max-width:calc(100vh * 16 / 9)}
#visual-player.tdx-tv .chx .chx-frame{max-height:100vh}
@media (max-width:760px){.chx .pbar{order:9;flex-basis:100%}}
@media (prefers-reduced-motion:reduce){.chx .chx-drift,.chx .tok .body,.chx .fly,.chx .mote,.chx .ember{animation:none!important}}
`;
