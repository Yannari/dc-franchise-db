// ══════════════════════════════════════════════════════════════════════
// vp-ci/style.js — the Circle stage's look (Plan 5; mockup circle-stage-v3)
// ══════════════════════════════════════════════════════════════════════
//
// The approved mockup's language, prefixed `civ-`: the aurora ring; the Circle
// UI (icon rail, glass message cards, ringed avatars, glowing hashtags, the
// people grid, the white input bar, the paper-plane send); ALERT! slamming in
// with a shockwave, a flash and an RGB glitch, then the building lighting up;
// apartments built from light and colour with a live cam card, a TV running
// the Circle, the SAYS ALOUD / TO THE CIRCLE box, the camera push, the send
// beam, the ping, the colour wipe. The stage is a screen: dark in both site
// themes, like the TVs in the apartments. Sizes are in cqw (the stage is a
// size container), so it scales wherever the player puts it.
export const CIV_FONTS = "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');";

export const CIV_CSS = `
.civ{--cy:#3fd8ff;--bl:#2f7bff;--vi:#8b5cff;--pk:#ff4fb4;--navy:#0a0f2e;--card:rgba(20,24,52,.8);font-family:Montserrat,system-ui,sans-serif;color:#fff}
.civ *{box-sizing:border-box}
.civ-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.civ-logo{display:flex;align-items:center;gap:8px;font-weight:800;letter-spacing:.14em;font-size:13px}
.civ-logo svg{width:26px;height:26px;animation:civSpin 14s linear infinite}
.civ-logo small{display:block;font-weight:600;letter-spacing:.06em;color:#9aa6d6;font-size:11px}
.civ-title{margin-left:auto;font-weight:700;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#cfd6ff}
.civ-stage{position:relative;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000;container-type:inline-size;
  box-shadow:0 0 0 1px #1c2350,0 30px 80px rgba(40,60,255,.25);cursor:pointer;user-select:none}
.civ-layer{position:absolute;inset:0;overflow:hidden}
/* the aurora ring */
.civ-aurora{position:absolute;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 8%,#3fd8ff 18%,#2f7bff 30%,#8b5cff 45%,#ff4fb4 58%,transparent 72%,transparent);
  -webkit-mask:radial-gradient(closest-side,transparent 88%,#000 90.5%,#000 93%,transparent 100%);mask:radial-gradient(closest-side,transparent 88%,#000 90.5%,#000 93%,transparent 100%);
  filter:blur(1.5px) drop-shadow(0 0 18px #3fd8ff);animation:civSpin 14s linear infinite;pointer-events:none}
.civ-aurora.soft{filter:blur(14px);opacity:.9}
@keyframes civSpin{to{transform:rotate(360deg)}}
.civ-uibg{position:absolute;inset:0;background:radial-gradient(ellipse at 60% 45%,#2a2a8a 0%,#16185a 35%,#0a0c30 70%,#06071c 100%)}
/* the Circle UI */
.civ-rail{position:absolute;left:0;top:6%;bottom:6%;width:7%;display:flex;flex-direction:column;justify-content:space-around;align-items:center;background:rgba(8,10,34,.55);border-right:1px solid rgba(255,255,255,.07)}
.civ-rail svg{width:42%;fill:#d8defa;opacity:.85}
.civ-rail .sel{position:relative}.civ-rail .sel:after{content:"";position:absolute;right:-60%;top:-20%;bottom:-20%;width:3px;background:var(--bl);box-shadow:0 0 10px var(--bl)}
.civ-feed{position:absolute;left:11%;right:25%;top:4%;bottom:16%;display:flex;flex-direction:column;justify-content:flex-end;gap:1.6cqw}
.civ-msg{display:flex;gap:1.6cqw;align-items:flex-start}
.civ-msg.new{animation:civMsgIn .7s cubic-bezier(.2,1.3,.4,1) both}
.civ-msg.new.late{animation-delay:1.25s}
@keyframes civMsgIn{0%{opacity:0;transform:translateX(-40px) scale(.94);filter:blur(6px)}100%{opacity:1;transform:none;filter:none}}
.civ-av{flex:none;width:4.4cqw;aspect-ratio:1;border-radius:50%;background:#1b1f45 center 25%/cover;border:.3cqw solid var(--ring,#2f7bff);box-shadow:0 0 1cqw var(--ring,#2f7bff);display:grid;place-items:center;font-weight:800;font-size:1.8cqw}
.civ-card{background:var(--card);border-radius:.5cqw;padding:1cqw 1.6cqw;flex:1;box-shadow:0 8px 24px rgba(0,0,0,.35);backdrop-filter:blur(6px)}
.civ-card .nm{font-weight:800;font-size:1.15cqw;letter-spacing:.04em;text-transform:uppercase}
.civ-card .tx{font-weight:500;font-size:1.45cqw;line-height:1.38;color:#eef1ff;margin-top:.2cqw}
.civ-card.post .tx:before{content:"POSTED \\2022  ";color:var(--cy);font-weight:800;font-size:1cqw;letter-spacing:.12em}
.civ-card.video .tx:before{content:"\\25B6  VIDEO \\2022  ";color:var(--pk);font-weight:800;font-size:1cqw;letter-spacing:.12em}
.civ-ht{color:#3aa8ff;font-weight:600;text-shadow:0 0 12px rgba(58,168,255,.6);animation:civShimmer 2.4s infinite}
@keyframes civShimmer{50%{color:#8fd8ff}}
.civ-typing{display:flex;gap:1.6cqw;align-items:center;animation:civTypingOut 1.3s both}
.civ-typing .civ-card{flex:none;width:9cqw}
@keyframes civTypingOut{0%,85%{opacity:1}100%{opacity:0;height:0;margin:0}}
.civ-dots span{display:inline-block;width:.8cqw;height:.8cqw;margin-right:.45cqw;border-radius:50%;background:#9fb0ff;animation:civBounce 1s infinite}
.civ-dots span:nth-child(2){animation-delay:.15s}.civ-dots span:nth-child(3){animation-delay:.3s}
@keyframes civBounce{40%{transform:translateY(-.5cqw);background:#fff}}
.civ-people{position:absolute;right:1.5%;top:3%;bottom:3%;width:21%;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:min-content;gap:.4cqw;align-content:start;overflow:hidden}
.civ-people .hd{grid-column:1/-1;text-align:center;font-weight:700;font-size:1.05cqw;letter-spacing:.08em;padding:.6cqw;background:rgba(20,24,60,.8);border-radius:.4cqw}
.civ-tile{background:rgba(26,30,70,.8);border-radius:.4cqw;padding:.8cqw .4cqw .6cqw;text-align:center;transition:transform .3s,background .3s,box-shadow .3s}
.civ-tile .ph{width:62%;aspect-ratio:1;margin:0 auto;border-radius:50%;background:#1b1f45 center 25%/cover;border:.2cqw solid #fff;display:grid;place-items:center;font-weight:800;font-size:1.6cqw}
.civ-tile .n{font-weight:700;font-size:.85cqw;margin-top:.5cqw;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.civ-tile.talk{background:rgba(47,123,255,.45);box-shadow:0 0 1.8cqw rgba(63,216,255,.7);transform:scale(1.06)}
.civ-tile.out{opacity:.25;filter:grayscale(1)}
.civ-inbar{position:absolute;left:11%;right:25%;bottom:4%;height:8%;display:flex;gap:1.2%}
.civ-box{flex:1;background:#eef0f7;border-radius:.4cqw;color:#1a1d3a;font-weight:500;font-size:1.3cqw;display:flex;align-items:center;padding:0 2%;overflow:hidden;white-space:nowrap}
.civ-box.caret:after{content:"|";animation:civBlink .7s infinite;color:var(--bl);margin-left:1px}
@keyframes civBlink{50%{opacity:0}}
.civ-send{width:9%;background:var(--bl);border-radius:.4cqw;display:grid;place-items:center}
.civ-send svg{width:50%;fill:#fff}
.civ-send.fire{animation:civFire .6s}
@keyframes civFire{40%{transform:scale(1.25);box-shadow:0 0 30px var(--cy)}}
/* someone speaking aloud, over the Circle: their apartment cam, picture in picture */
.civ-pip{position:absolute;left:11%;bottom:15%;display:flex;gap:1.2cqw;align-items:flex-end;z-index:5;max-width:62%}
.civ-pip .cam{flex:none;width:9cqw;aspect-ratio:1;border-radius:1cqw;background:#1b1f45 center 20%/cover;border:.25cqw solid rgba(255,255,255,.85);box-shadow:0 0 2.4cqw var(--glow,#3fd8ff);position:relative;display:grid;place-items:center;font-weight:800;font-size:3cqw}
.civ-pip .cam:before{content:"";position:absolute;right:.7cqw;top:.7cqw;width:.7cqw;height:.7cqw;border-radius:50%;background:#ff4a6a;box-shadow:0 0 8px #ff4a6a;animation:civBlink 1.2s infinite}
.civ-pip .bub{background:linear-gradient(135deg,rgba(18,20,56,.92),rgba(40,20,80,.88));border:1px solid rgba(120,160,255,.35);border-radius:1cqw;padding:1cqw 1.4cqw;font-size:1.4cqw;line-height:1.4}
.civ-pip.new{animation:civUp .5s both}
/* captions: the host, and stage directions */
.civ-cap{position:absolute;left:11%;right:25%;top:3%;z-index:6;text-align:center;font-size:1.3cqw;font-style:italic;color:#dfe6ff;background:rgba(5,6,20,.6);border-radius:.6cqw;padding:.7cqw 1cqw}
.civ-cap.host{font-style:normal;font-weight:700;background:linear-gradient(90deg,rgba(47,123,255,.55),rgba(139,92,255,.55),rgba(255,79,180,.55))}
.civ-cap.host b{letter-spacing:.14em;font-size:1cqw;margin-right:.8cqw;opacity:.85}
.civ-cap.new{animation:civUp .45s both}
@keyframes civUp{from{opacity:0;transform:translateY(1.4cqw)}to{opacity:1;transform:none}}
/* ALERT */
.civ-alertbg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,#1a1560 0%,#0a0930 45%,#000 80%)}
.civ-alertTxt{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font-weight:900;font-size:11cqw;white-space:nowrap}
.civ-alert.go .civ-alertTxt{animation:civSlam .9s cubic-bezier(.2,1.6,.3,1) both,civRgb 2.2s .9s infinite}
@keyframes civSlam{0%{transform:translate(-50%,-50%) scale(3.2);opacity:0;filter:blur(20px)}60%{opacity:1;filter:blur(0)}100%{transform:translate(-50%,-50%) scale(1)}}
@keyframes civRgb{0%,100%{text-shadow:0 0 30px rgba(120,160,255,.6)}8%{text-shadow:-6px 0 #ff2a6d,6px 0 #2ae8ff,0 0 30px rgba(120,160,255,.6);transform:translate(-50%,-50%) skewX(-4deg)}12%{text-shadow:0 0 30px rgba(120,160,255,.6);transform:translate(-50%,-50%)}}
.civ-alert.go .civ-aurora.big{animation:civDraw 1.2s cubic-bezier(.2,.9,.2,1) both,civSpin 10s 1.2s linear infinite}
@keyframes civDraw{0%{transform:scale(.3) rotate(-180deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
.civ-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
.civ-alert.go .civ-flash{animation:civFlash .6s .55s}
@keyframes civFlash{0%{opacity:.85}100%{opacity:0}}
.civ-shock{position:absolute;left:50%;top:44%;width:10px;height:10px;border-radius:50%;border:3px solid #9fd8ff;transform:translate(-50%,-50%);opacity:0}
.civ-alert.go .civ-shock{animation:civShock 1.1s .6s ease-out}
@keyframes civShock{0%{opacity:1;width:10px;height:10px}100%{opacity:0;width:140%;height:250%}}
.civ-alertSub{position:absolute;left:6%;right:6%;top:64%;text-align:center;font-weight:600;font-size:1.9cqw;line-height:1.45;color:#dfe6ff}
.civ-alertSub.new{animation:civUp .6s both}
.civ-alert.go .civ-alertSub{animation-delay:1.2s}
.civ-building{position:absolute;inset:0;display:grid;grid-template-columns:repeat(4,1fr);gap:.6cqw;padding:.6cqw;background:#02030a;opacity:0;pointer-events:none;animation:civBuilding 3.2s 2.4s both}
@keyframes civBuilding{0%{opacity:0}10%,80%{opacity:1}100%{opacity:0}}
.civ-win{position:relative;border-radius:.5cqw;overflow:hidden;opacity:.15;filter:brightness(.3);animation:civLight .5s both}
@keyframes civLight{to{opacity:1;filter:brightness(1)}}
.civ-win .tv{position:absolute;left:24%;right:24%;top:20%;height:40%;border-radius:.3cqw;background:radial-gradient(circle,#2a2a8a,#0a0c30);display:grid;place-items:center;font-weight:900;font-size:1.2cqw;box-shadow:0 0 2cqw rgba(63,216,255,.55);animation:civPulse 1s infinite}
@keyframes civPulse{50%{box-shadow:0 0 3.4cqw rgba(255,79,180,.8)}}
.civ-win .who{position:absolute;left:.5cqw;bottom:.4cqw;font-weight:700;font-size:.8cqw;letter-spacing:.1em;background:rgba(0,0,0,.55);padding:.2cqw .5cqw;border-radius:.3cqw}
/* apartments */
.civ-room{position:absolute;inset:0;transition:transform 2.6s cubic-bezier(.3,.1,.2,1);transform-origin:50% 30%}
.civ-apt.push .civ-room{transform:scale(1.1) translateY(2%)}
.civ-wall{position:absolute;inset:0 0 18% 0}
.civ-floor{position:absolute;left:0;right:0;bottom:0;height:18%;background:linear-gradient(#3a2a22,#1b120d)}
.civ-dado{position:absolute;left:0;right:0;bottom:18%;height:22%;border-top:3px solid rgba(255,255,255,.12)}
.civ-poster{position:absolute;border:.45cqw solid #c9a55a;outline:.9cqw solid #f4efe6;outline-offset:-1.35cqw;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.civ-lamp{position:absolute;border-radius:50%;filter:blur(30px);mix-blend-mode:screen;width:30%;height:40%;top:10%;opacity:.35}
.civ-tvset{position:absolute;left:30%;width:44%;top:9%;aspect-ratio:16/9;border-radius:.5cqw;border:.45cqw solid #0c0c10;background:#000;overflow:hidden;box-shadow:0 0 0 1px #222,0 0 5cqw var(--bias,#3fd8ff),0 0 12cqw var(--bias,#3fd8ff);container-type:inline-size}
.civ-tvset .civ-feed{left:10%;right:26%;gap:1.2cqw}
.civ-tvset .civ-inbar{left:10%;right:26%}
.civ-tvset .civ-people{width:22%}
.civ-bust{position:absolute;bottom:5%;width:24%;aspect-ratio:1;background:#1b1f45 center 20%/cover;border-radius:1.2cqw;border:.28cqw solid rgba(255,255,255,.85);box-shadow:0 0 0 .5cqw rgba(0,0,0,.25),0 0 3.5cqw var(--glow,#3fd8ff),0 20px 50px rgba(0,0,0,.6);z-index:7;display:grid;place-items:center;font-weight:800;font-size:6cqw}
.civ-bust:after{content:attr(data-cam);position:absolute;left:.7cqw;top:.7cqw;font-weight:800;font-size:.85cqw;letter-spacing:.14em;background:rgba(0,0,0,.6);padding:.3cqw .5cqw;border-radius:.3cqw;color:#fff}
.civ-bust:before{content:"";position:absolute;right:.9cqw;top:.9cqw;width:.7cqw;height:.7cqw;border-radius:50%;background:#ff4a6a;box-shadow:0 0 8px #ff4a6a;animation:civBlink 1.2s infinite}
.civ-bust.L{left:2.5%;transform:rotate(-2deg)}.civ-bust.R{right:2.5%;transform:rotate(2deg)}
.civ-apt.enter .civ-bust.L{animation:civInL .8s cubic-bezier(.2,1.2,.3,1) both}
.civ-apt.enter .civ-bust.R{animation:civInR .8s cubic-bezier(.2,1.2,.3,1) both}
@keyframes civInL{from{transform:translateX(-60%);opacity:0}}
@keyframes civInR{from{transform:translateX(60%);opacity:0}}
.civ-rim{position:absolute;bottom:0;width:40%;height:80%;filter:blur(40px);opacity:.55;mix-blend-mode:screen}
.civ-hud{position:absolute;top:2.5%;left:2%;right:2%;display:flex;justify-content:space-between;font-weight:700;font-size:1cqw;letter-spacing:.14em;text-transform:uppercase;z-index:9;text-shadow:0 2px 6px #000}
.civ-hud .lv{color:#ff5b7a}.civ-hud .lv:before{content:"\\25CF  ";animation:civBlink 1.2s infinite}
.civ-dlg{position:absolute;left:29%;right:3%;bottom:4%;z-index:8;background:linear-gradient(135deg,rgba(18,20,56,.9),rgba(40,20,80,.85));border:1px solid rgba(120,160,255,.35);border-radius:.9cqw;padding:2cqw 2.2cqw 1.6cqw;backdrop-filter:blur(10px);box-shadow:0 0 40px rgba(60,80,255,.3)}
.civ-apt.R .civ-dlg{left:3%;right:29%}
.civ-dlg.new{animation:civUp .5s both}
.civ-plate{position:absolute;top:-1.3cqw;left:1.5cqw;padding:.45cqw 1.1cqw;border-radius:.35cqw;font-weight:800;font-size:1cqw;letter-spacing:.12em;text-transform:uppercase;background:linear-gradient(90deg,var(--bl),var(--vi),var(--pk))}
.civ-plate i{font-style:normal;font-weight:600;opacity:.85}
.civ-line{font-size:1.45cqw;line-height:1.45;font-weight:500}
.civ-line.stage{font-style:italic;color:#cfd6ff}
.civ-chip{display:inline-block;font-weight:800;font-size:.8cqw;letter-spacing:.14em;padding:.3cqw .6cqw;border-radius:.3cqw;margin-right:.6cqw;vertical-align:.2cqw}
.civ-chip.say{background:rgba(255,255,255,.15)}.civ-chip.cmd{background:rgba(63,216,255,.2);color:var(--cy)}
.civ-cmd{color:#9fe6ff;font-weight:600}
.civ-catfish{position:absolute;z-index:9;top:9%;left:2%;font-weight:800;font-size:.9cqw;letter-spacing:.14em;padding:.45cqw .8cqw;border-radius:.35cqw;background:rgba(255,79,180,.18);color:#ff8fd0;border:1px solid rgba(255,79,180,.5)}
.civ-apt.R .civ-catfish{left:auto;right:2%}
.civ-catfish .mini{display:inline-block;width:1.6cqw;height:1.6cqw;border-radius:50%;background:#1b1f45 center/cover;vertical-align:middle;margin-right:.5cqw;border:.18cqw solid var(--pk)}
.civ-beam{position:absolute;z-index:7;top:28%;left:52%;width:14%;height:.5cqw;border-radius:.3cqw;background:linear-gradient(90deg,transparent,var(--cy),#fff);box-shadow:0 0 18px var(--cy),0 0 40px var(--vi);opacity:0}
.civ-apt.sent .civ-beam{animation:civBeam .9s 1.35s ease-in}
@keyframes civBeam{0%{opacity:1;left:52%;width:4%}100%{opacity:0;left:110%;width:30%}}
.civ-apt.sent .civ-send{animation:civFire .6s 1.2s}
.civ-ping{position:absolute;z-index:6;left:44%;top:18%;width:12%;aspect-ratio:1;border-radius:50%;border:.3cqw solid var(--cy);animation:civPing 1.2s ease-out 2}
@keyframes civPing{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(1.6)}}
.civ-wipe{position:absolute;inset:0;z-index:20;pointer-events:none;background:linear-gradient(100deg,transparent 0 30%,#8b5cff 42%,#3fd8ff 50%,#ff4fb4 58%,transparent 70%);transform:translateX(-120%)}
.civ-wipe.run{animation:civWipe .7s ease-in-out}
@keyframes civWipe{to{transform:translateX(120%)}}
/* where we are, and the chat window in the apartments */
.civ-where{position:absolute;top:2.5%;left:50%;transform:translateX(-50%);z-index:12;font-weight:800;font-size:1cqw;letter-spacing:.16em;padding:.5cqw 1.2cqw;border-radius:99px;
  background:linear-gradient(90deg,rgba(47,123,255,.85),rgba(139,92,255,.85),rgba(255,79,180,.85));box-shadow:0 0 2cqw rgba(139,92,255,.5);white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.4)}
.civ-apt .civ-hud{top:7.5%}
.civ-apt.haswin .civ-tvset{width:34%;left:29%}
.civ-apt.haswin.R .civ-tvset{left:37%!important}
.civ-chatwin{position:absolute;z-index:8;top:12%;bottom:30%;width:31%;right:2.5%;display:flex;flex-direction:column;border-radius:1cqw;overflow:hidden;
  background:linear-gradient(180deg,rgba(14,17,52,.94),rgba(10,12,40,.94));border:1px solid rgba(63,216,255,.35);box-shadow:0 0 3cqw rgba(47,123,255,.35)}
.civ-apt.R .civ-chatwin{right:auto;left:2.5%}
.civ-chatwin-hd{font-weight:800;font-size:.95cqw;letter-spacing:.12em;padding:.8cqw 1cqw;background:rgba(47,123,255,.35);border-bottom:1px solid rgba(63,216,255,.25);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.civ-chatwin-hd:before{content:"🔒  "}
.civ-chatwin-feed{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:.8cqw;padding:1cqw;overflow:hidden}
.civ-chatwin .civ-av{width:3.2cqw;font-size:1.2cqw}
.civ-chatwin .civ-card .nm{font-size:.9cqw}.civ-chatwin .civ-card .tx{font-size:1.15cqw}
.civ-chatwin .civ-card{padding:.7cqw 1cqw}
.civ-chatwin-empty{text-align:center;color:#8f96c8;font-size:1.1cqw;font-style:italic;margin:auto}
/* MEET THE PLAYERS: who walks in, their plan, the profile built on the TV */
.civ-arrtitle{position:absolute;left:0;right:0;top:40%;transform:translateY(-50%);text-align:center;font-weight:900;font-size:6.4cqw;letter-spacing:.08em;
  background:linear-gradient(90deg,#3fd8ff,#8b5cff,#ff4fb4);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 2cqw rgba(139,92,255,.55))}
.civ-arrtitle small{display:block;margin-top:1.2cqw;font-weight:600;font-size:1.5cqw;letter-spacing:.2em;color:#cfd6ff;-webkit-text-fill-color:#cfd6ff;text-transform:uppercase}
.civ-arrtitle.new{animation:civSlamIn .9s cubic-bezier(.2,1.5,.3,1) both}
@keyframes civSlamIn{0%{opacity:0;transform:translateY(-50%) scale(1.8);filter:blur(14px)}100%{opacity:1}}
.civ-arrive.rest .civ-cap{top:auto;bottom:10%}
.civ-cam,.civ-watch{position:absolute;left:3%;top:14%;width:19cqw;aspect-ratio:1;border-radius:1.2cqw;background:#1b1f45 center 20%/cover;border:.28cqw solid rgba(255,255,255,.85);
  box-shadow:0 0 0 .5cqw rgba(0,0,0,.25),0 0 3.5cqw var(--glow,#3fd8ff),0 20px 50px rgba(0,0,0,.6);z-index:7;display:grid;place-items:center;font-weight:800;font-size:7cqw;transform:rotate(-2deg)}
.civ-cam:after,.civ-watch:after{content:attr(data-cam);position:absolute;left:.7cqw;top:.7cqw;font-weight:800;font-size:.8cqw;letter-spacing:.14em;background:rgba(0,0,0,.6);padding:.3cqw .5cqw;border-radius:.3cqw;color:#fff}
.civ-cam:before,.civ-watch:before{content:"";position:absolute;right:.9cqw;top:.9cqw;width:.7cqw;height:.7cqw;border-radius:50%;background:#ff4a6a;box-shadow:0 0 8px #ff4a6a;animation:civBlink 1.2s infinite}
.civ-arrive.enter .civ-cam,.civ-arrive.enter .civ-watch{animation:civWalkIn .9s cubic-bezier(.2,1.2,.3,1) both}
@keyframes civWalkIn{from{transform:translateX(-120%) rotate(-8deg);opacity:0}}
.civ-id{position:absolute;left:3%;top:52%;width:44%;z-index:7}
.civ-arrive .civ-id{left:24.5%;top:14%;width:28%}
.civ-id .nm{font-weight:900;font-size:3cqw;line-height:1.05;letter-spacing:.02em}
.civ-id .fx{font-weight:600;font-size:1.25cqw;color:#cfd6ff;margin:.6cqw 0 .9cqw;line-height:1.4}
.civ-fame{display:inline-block;margin-bottom:.9cqw;padding:.5cqw .9cqw;border-radius:.5cqw;background:linear-gradient(90deg,rgba(255,210,63,.22),rgba(255,79,180,.18));border:1px solid rgba(255,210,63,.55)}
.civ-fame b{font-weight:900;font-size:1cqw;letter-spacing:.16em;color:#ffd23f}
.civ-fame .st{color:#ffd23f;font-size:1.2cqw;letter-spacing:.1em;text-shadow:0 0 1cqw rgba(255,210,63,.7)}
.civ-fame small{display:block;font-size:.85cqw;color:#ffe9a8;font-weight:600;margin-top:.2cqw}
.civ-planchip{display:block;width:fit-content;max-width:100%;font-weight:800;font-size:.95cqw;letter-spacing:.12em;padding:.5cqw .9cqw;border-radius:.4cqw;background:rgba(63,216,255,.16);color:#9fe6ff;border:1px solid rgba(63,216,255,.45)}
.civ-planchip.cat{background:rgba(255,79,180,.18);color:#ff9fd6;border-color:rgba(255,79,180,.55)}
.civ-planchip.edit{background:rgba(255,159,47,.16);color:#ffc27a;border-color:rgba(255,159,47,.5)}
.civ-why{font-size:1.1cqw;line-height:1.45;color:#dfe6ff;margin-top:.7cqw;font-style:italic}
.civ-watchnote{position:absolute;left:24.5%;top:16%;width:26%;font-weight:700;font-size:1cqw;letter-spacing:.14em;color:#9aa6d6;line-height:1.7}
.civ-watchnote b{display:block;color:#fff;font-size:2.6cqw;letter-spacing:.02em;line-height:1.3;margin:.3cqw 0}
.civ-tvframe{position:absolute;right:3%;top:11%;width:40%;bottom:30%;border-radius:1cqw;border:.45cqw solid #0c0c10;overflow:hidden;
  background:radial-gradient(ellipse at 50% 30%,#2a2a8a,#10124a 60%,#070820);box-shadow:0 0 0 1px #222,0 0 4cqw var(--bias,#3fd8ff);container-type:inline-size}
.civ-pcard{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:0 6% 4%;text-align:center}
.civ-pcard .hd{align-self:stretch;margin:0 -8%;padding:1.4cqw;font-weight:800;font-size:2.6cqw;letter-spacing:.16em;background:rgba(47,123,255,.35);border-bottom:1px solid rgba(63,216,255,.3)}
.civ-pcard .ph{width:30%;aspect-ratio:1;margin-top:4%;border-radius:50%;background:#1b1f45 center 25%/cover;border:.8cqw solid var(--ring,#2f7bff);box-shadow:0 0 5cqw var(--ring,#2f7bff);display:grid;place-items:center;font-weight:800;font-size:9cqw}
.civ-pcard .nm{font-weight:900;font-size:6cqw;letter-spacing:.06em;margin-top:3%}
.civ-pcard .fx{font-weight:700;font-size:3.2cqw;color:#9fe6ff;letter-spacing:.08em}
.civ-pcard .jb{font-weight:600;font-size:3cqw;color:#dfe6ff;margin-top:1%}
.civ-pcard .bio{font-weight:500;font-size:3.1cqw;line-height:1.4;color:#eef1ff;margin-top:3%;font-style:italic}
.civ-arrive.build .civ-pcard .ph{animation:civDevelop 1.2s .3s both}
@keyframes civDevelop{0%{opacity:0;filter:blur(12px) brightness(2);transform:scale(.6)}100%{opacity:1;filter:none;transform:none}}
.civ-arrive.build .civ-pcard>*:not(.ph){animation:civUp .5s both}
.civ-arrive.build .civ-pcard .hd{animation-delay:.1s}.civ-arrive.build .civ-pcard .nm{animation-delay:1.1s}
.civ-arrive.build .civ-pcard .fx{animation-delay:1.4s}.civ-arrive.build .civ-pcard .jb{animation-delay:1.65s}.civ-arrive.build .civ-pcard .bio{animation-delay:1.95s}
.civ-arrive.build .civ-id>*{animation:civUp .45s both}
.civ-arrive.build .civ-id>*:nth-child(2){animation-delay:.15s}.civ-arrive.build .civ-id>*:nth-child(3){animation-delay:.3s}.civ-arrive.build .civ-id>*:nth-child(4){animation-delay:.45s}.civ-arrive.build .civ-id>*:nth-child(5){animation-delay:.6s}
.civ-arrive .civ-dlg{left:3%;right:3%}
.civ-roll{position:absolute;left:2%;top:2.5%;z-index:12;display:flex;gap:.4cqw;align-items:center}
.civ-roll span{width:2.2cqw;aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.08) center 25%/cover;border:.16cqw dashed rgba(255,255,255,.3);display:grid;place-items:center;font-weight:800;font-size:.9cqw;transition:transform .3s}
.civ-roll span.on{border:.18cqw solid var(--ring,#2f7bff);background-color:#1b1f45;box-shadow:0 0 .8cqw var(--ring,#2f7bff)}
.civ-roll span.cur{transform:scale(1.3)}
.civ-roll b{font-weight:800;font-size:.9cqw;letter-spacing:.1em;margin-left:.5cqw;color:#cfd6ff}
/* the stage fits the window, so Next is always in reach */
.civ-stagewrap{position:relative;width:min(100%,calc((100vh - 250px) * 16 / 9));margin:0 auto}
.civ-btn.civ-nextbtn{font-size:13px;padding:10px 26px;box-shadow:0 0 18px rgba(139,92,255,.55)}
/* the controls and the script under the stage */
.civ-controls{display:flex;gap:8px;align-items:center;margin:10px 0}
.civ-btn{font-weight:700;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#cfd6ff;background:#121838;border:1px solid #2a3470;border-radius:99px;padding:8px 14px;cursor:pointer;font-family:inherit}
.civ-btn.main{background:linear-gradient(90deg,var(--bl),var(--vi));color:#fff;border-color:transparent}
.civ-btn.on{box-shadow:0 0 14px rgba(63,216,255,.6);color:#fff}
.civ-count{margin-left:auto;font-size:12px;color:#9aa6d6;font-variant-numeric:tabular-nums}
.civ-script{background:rgba(10,14,40,.6);border:1px solid rgba(63,216,255,.15);border-radius:12px;padding:10px 14px;max-height:260px;overflow:auto}
.civ-ln{margin:0 0 6px;font-size:13px;line-height:1.5;color:#dfe6ff;opacity:.28;transition:opacity .3s}
.civ-ln.vis{opacity:1}
.civ-ln b{font-weight:800;letter-spacing:.04em}
.civ-ln .k{font-size:10px;font-weight:800;letter-spacing:.12em;margin-right:6px;padding:1px 5px;border-radius:3px;background:rgba(255,255,255,.1)}
.civ-ln.send .k{background:rgba(63,216,255,.2);color:var(--cy)}
.civ-ln.stage{font-style:italic;color:#aab4e6}
@media (prefers-reduced-motion:reduce){.civ *,.civ *:before,.civ *:after{animation:none!important;transition:none!important}.civ-building{opacity:0}}
`;
