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
.civ-set{position:absolute;max-width:none;object-fit:cover}
.civ-set.full{inset:0;width:100%;height:100%}
/* the Hangout, earlier: the same room, faded warm and soft */
.civ-set.fbk{filter:sepia(.55) saturate(.7) brightness(.75) blur(.15cqw)}
.civ-room{position:absolute;inset:0;transition:transform 2.6s cubic-bezier(.3,.1,.2,1);transform-origin:50% 30%}
.civ-apt.push .civ-room{transform:scale(1.1) translateY(2%)}
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
/* ── the big moments (js/vp-ci/moments.js) ── */
.civ-mcam{position:relative;aspect-ratio:1;border-radius:1.1cqw;background:#1b1f45 center 20%/cover;border:.26cqw solid rgba(255,255,255,.85);display:grid;place-items:center;font-weight:800;font-size:5cqw;
  box-shadow:0 0 0 .4cqw rgba(0,0,0,.25),0 0 3cqw var(--glow,#3fd8ff),0 16px 40px rgba(0,0,0,.55)}
.civ-mcam:after{content:attr(data-cam);position:absolute;left:.6cqw;top:.6cqw;font-weight:800;font-size:.75cqw;letter-spacing:.14em;background:rgba(0,0,0,.6);padding:.25cqw .45cqw;border-radius:.3cqw;color:#fff;white-space:nowrap}
.civ-mcam:before{content:"";position:absolute;right:.8cqw;top:.8cqw;width:.6cqw;height:.6cqw;border-radius:50%;background:#ff4a6a;box-shadow:0 0 8px #ff4a6a;animation:civBlink 1.2s infinite}
.civ-mcam.side{position:absolute;left:3%;bottom:6%;width:17cqw;z-index:7;transform:rotate(-2deg)}
.civ-mcam.side.in{animation:civWalkIn .6s cubic-bezier(.2,1.2,.3,1) both}
.civ-mcam.center{position:absolute;left:50%;top:14%;width:22cqw;margin-left:-11cqw;z-index:7}
.civ-dlg.right{left:23%;right:3%}
.civ-mtile{position:relative;display:flex;align-items:center;gap:.8cqw;background:rgba(26,30,70,.85);border-radius:.6cqw;padding:.5cqw .7cqw;transition:all .35s}
.civ-mtile .ph{flex:none;width:3cqw;aspect-ratio:1;border-radius:50%;background:#1b1f45 center 25%/cover;border:.18cqw solid var(--ring,#2f7bff);display:grid;place-items:center;font-weight:800;font-size:1.2cqw}
.civ-mtile .n{font-weight:800;font-size:1.05cqw;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.civ-mtile.hidden{opacity:.45}.civ-mtile.hidden .ph{border-style:dashed;border-color:rgba(255,255,255,.35)}
.civ-mtile.talk{background:rgba(47,123,255,.5);box-shadow:0 0 1.6cqw rgba(63,216,255,.7);transform:scale(1.05)}
.civ-badge{margin-left:auto;font-weight:900;font-size:.7cqw;letter-spacing:.14em;padding:.2cqw .45cqw;border-radius:.25cqw;background:linear-gradient(90deg,#ffd23f,#ff9f2f);color:#2a1a00}
.civ-badge.red{background:#ff2a4a;color:#fff}
/* the Ratings */
.civ-board{position:absolute;right:3%;top:11%;bottom:24%;width:40%;display:flex;flex-direction:column;gap:.45cqw;padding:1cqw;border-radius:1cqw;background:rgba(10,12,40,.82);border:1px solid rgba(139,92,255,.45);box-shadow:0 0 3cqw rgba(139,92,255,.35);z-index:5}
.civ-board.two{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:min-content;align-content:start}
.civ-board .hd{grid-column:1/-1;text-align:center;font-weight:900;font-size:1.2cqw;letter-spacing:.2em;padding:.4cqw 0 .6cqw;background:linear-gradient(90deg,#3fd8ff,#8b5cff,#ff4fb4);-webkit-background-clip:text;background-clip:text;color:transparent}
.civ-rate.reveal .civ-board{left:50%;right:auto;width:52%;margin-left:-26%;bottom:auto;max-height:66%}
.civ-slot{display:flex;align-items:center;gap:.7cqw}
.civ-slot>b{flex:none;width:2.2cqw;text-align:center;font-weight:900;font-size:1.3cqw;color:#9aa6d6}
.civ-slot .civ-mtile{flex:1}
.civ-slot.now .civ-mtile{box-shadow:0 0 1.8cqw rgba(63,216,255,.8);background:rgba(47,123,255,.5)}
.civ-slot.land .civ-mtile{animation:civLand .7s cubic-bezier(.2,1.4,.4,1) both}
@keyframes civLand{0%{opacity:0;transform:translateX(30%) scale(1.3);filter:blur(4px)}100%{opacity:1;transform:none;filter:none}}
.civ-slot.crown .civ-mtile{background:linear-gradient(90deg,rgba(255,210,63,.35),rgba(255,79,180,.3));box-shadow:0 0 2cqw rgba(255,210,63,.6)}
.civ-slot.crown>b{color:#ffd23f}.civ-slot.crown>b:after{content:" \\265B"}
.civ-boardnote{margin:auto;text-align:center;font-size:1.3cqw;color:#cfd6ff;font-style:italic;padding:0 8%}
.civ-stamp{position:absolute;right:6%;bottom:6%;font-weight:900;font-size:2.4cqw;letter-spacing:.2em;color:#3fd88f;border:.3cqw solid #3fd88f;padding:.2cqw 1cqw;border-radius:.5cqw;transform:rotate(-12deg);animation:civSlamIn .5s both}
.civ-confetti{position:absolute;inset:0;z-index:15;pointer-events:none;background-image:radial-gradient(circle,#ffd23f 0 .3cqw,transparent .35cqw),radial-gradient(circle,#ff4fb4 0 .3cqw,transparent .35cqw),radial-gradient(circle,#3fd8ff 0 .25cqw,transparent .3cqw);
  background-size:13cqw 17cqw,17cqw 13cqw,11cqw 15cqw;animation:civConfetti 2.6s linear both}
@keyframes civConfetti{0%{background-position:0 -60cqw,3cqw -70cqw,5cqw -50cqw;opacity:1}90%{opacity:1}100%{background-position:2cqw 60cqw,-2cqw 70cqw,6cqw 65cqw;opacity:0}}
/* the Hangout */
.civ-hcam{position:absolute;top:13%;width:21cqw;z-index:6;transition:transform .4s}
.civ-hcam.L{left:3%;transform:perspective(60cqw) rotateY(14deg)}.civ-hcam.R{right:3%;transform:perspective(60cqw) rotateY(-14deg)}.civ-hcam.M{left:50%;margin-left:-8cqw;width:16cqw;top:3%}
.civ-hcam.talk .civ-mcam{box-shadow:0 0 0 .4cqw rgba(255,210,63,.6),0 0 4cqw var(--glow,#3fd8ff)}
.civ-atrisk{position:absolute;left:28%;right:28%;top:15%;bottom:28%;z-index:5;display:flex;flex-direction:column;gap:.6cqw}
/* on the Hangout's LED wall (assets/sets/circle/hangout.webp; the screen measured from the camera) */
.civ-hwall{position:absolute;left:32.9%;top:15.5%;width:34.2%;height:38.2%;z-index:5;border-radius:.4cqw;overflow:hidden}
.civ-hangout .civ-atrisk{inset:0;padding:1cqw;justify-content:center;gap:.6cqw}
.civ-atrisk.back{animation:civHBack .5s ease-out both}
@keyframes civHBack{from{opacity:0;transform:scale(.94);filter:blur(5px)}}
.civ-htile{position:relative;display:flex;align-items:center;gap:.5cqw;background:rgba(26,30,70,.88);border-radius:.5cqw;padding:.4cqw .5cqw;border:.12cqw solid transparent;transition:all .4s}
.civ-htile .ph{flex:none;width:2.4cqw;aspect-ratio:1;border-radius:50%;background:#1b1f45 center 25%/cover;border:.16cqw solid var(--ring,#2f7bff);display:grid;place-items:center;font-weight:800;font-size:1cqw}
.civ-htile .tx{display:flex;flex-direction:column;gap:.2cqw;min-width:0}
.civ-htile .n{font-weight:800;font-size:.85cqw;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.civ-htile .mk{align-self:flex-start;font-weight:900;font-size:.52cqw;letter-spacing:.08em;padding:.1cqw .35cqw;border-radius:.25cqw}
.civ-htile.safe{opacity:.55}.civ-htile.safe .mk{background:rgba(63,216,143,.18);color:#3fd88f;border:1px solid #3fd88f}
.civ-htile.cut{background:rgba(120,10,30,.55);border-color:#ff2a4a;box-shadow:0 0 1.2cqw rgba(255,42,74,.55);animation:civHPulse 1.6s ease-in-out infinite}
.civ-htile.cut .mk{background:#ff2a4a;color:#fff}
.civ-htile.land{animation:civHLand .7s .25s cubic-bezier(.2,1.3,.3,1) both}
@keyframes civHLand{0%{transform:scale(1.35);filter:brightness(2)}100%{transform:none}}
@keyframes civHPulse{50%{box-shadow:0 0 .4cqw rgba(255,42,74,.3)}}
/* a profile open on the wall */
.civ-hfocus{position:absolute;inset:0;display:grid;grid-template-columns:auto 1fr;grid-template-rows:1fr auto;gap:.6cqw 1.2cqw;padding:1.2cqw 1.4cqw 1cqw;
  background:radial-gradient(120% 90% at 20% 30%,rgba(139,92,255,.35),transparent 60%),linear-gradient(160deg,#120d2c,#1c1240)}
.civ-hfocus:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 2px,transparent 2px 4px);pointer-events:none}
.civ-hfocus.opening{animation:civHOpen .55s cubic-bezier(.2,.9,.25,1) both}
@keyframes civHOpen{from{opacity:0;transform:scale(.4)}}
.civ-hfocus .fph{width:12.5cqw;aspect-ratio:1;border-radius:1cqw;background:#1b1f45 center 22%/cover;border:.3cqw solid var(--ring);box-shadow:0 0 2.5cqw var(--ring);display:grid;place-items:center;font-weight:900;font-size:5cqw;transition:filter .4s,box-shadow .4s}
.civ-hfocus .finfo{display:flex;flex-direction:column;justify-content:center;gap:.45cqw;min-width:0}
.civ-hfocus .pill{align-self:flex-start;display:flex;align-items:center;gap:.45cqw;font-weight:800;font-size:.7cqw;letter-spacing:.2em;color:#ffd8ef;background:rgba(255,79,180,.18);border:1px solid rgba(255,79,180,.6);padding:.3cqw .7cqw;border-radius:99px}
.civ-hfocus .pill i{width:.55cqw;height:.55cqw;border-radius:50%;background:#ff4fb4;box-shadow:0 0 .8cqw #ff4fb4;animation:civBlink 1s infinite}
.civ-hfocus .fname{font-weight:900;font-size:2.6cqw;line-height:1;letter-spacing:.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.civ-hfocus .ffacts{font-weight:700;font-size:.95cqw;color:#c9bfff;letter-spacing:.06em}
.civ-hfocus .fjob{font-weight:600;font-size:.95cqw}
.civ-hfocus .fbio{font-style:italic;font-size:.85cqw;line-height:1.35;color:#e6e0ff;opacity:.85;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.civ-hfocus .strip{grid-column:1/-1;display:flex;gap:.45cqw;justify-content:center}
.civ-hfocus .strip span{width:1.9cqw;aspect-ratio:1;border-radius:50%;background:#1b1f45 center 25%/cover;border:.14cqw solid rgba(255,255,255,.5);opacity:.55;display:grid;place-items:center;font-size:.7cqw;font-weight:800}
.civ-hfocus .strip span.on{opacity:1;border-color:#ff4fb4;box-shadow:0 0 .9cqw #ff4fb4;transform:scale(1.2)}
.civ-hfocus .strip span.safe{border-color:#3fd88f}.civ-hfocus .strip span.cut{border-color:#ff2a4a;opacity:.9}
.civ-hfocus .stamp{position:absolute;left:50%;top:46%;z-index:3;transform:translate(-50%,-50%) rotate(-9deg);font-weight:900;font-size:3.1cqw;line-height:1;letter-spacing:.06em;
  padding:.7cqw 1.6cqw;border:.4cqw double currentColor;border-radius:.6cqw;white-space:nowrap;pointer-events:none;text-shadow:0 0 1.5cqw currentColor}
.civ-hfocus .stamp.ok{color:#3fd88f;background:rgba(10,40,25,.55)}.civ-hfocus .stamp.no{color:#ff4a62;background:rgba(50,5,12,.6)}
.civ-hfocus.ok .fph{box-shadow:0 0 3cqw #3fd88f;border-color:#3fd88f}
.civ-hfocus.no .fph{filter:saturate(.6) brightness(.8);box-shadow:0 0 3cqw #ff2a4a;border-color:#ff2a4a}
.civ-hfocus.slam .stamp{animation:civHSlam .55s cubic-bezier(.2,1.4,.3,1) both}
@keyframes civHSlam{0%{opacity:0;transform:translate(-50%,-50%) rotate(-20deg) scale(2.6)}60%{opacity:1}100%{opacity:1;transform:translate(-50%,-50%) rotate(-9deg) scale(1)}}
.civ-hwall:has(.civ-hfocus.slam){animation:civHShake .35s .2s}
@keyframes civHShake{25%{transform:translate(.4cqw,.2cqw)}50%{transform:translate(-.4cqw,-.1cqw)}75%{transform:translate(.2cqw,-.2cqw)}}
.civ-hfocus .flash{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;animation:civHFlash .5s .18s}
@keyframes civHFlash{0%{opacity:.7}100%{opacity:0}}
.civ-hfocus .flash.ok{background:radial-gradient(circle,rgba(63,216,143,.6),transparent 70%)}.civ-hfocus .flash.no{background:radial-gradient(circle,rgba(255,42,74,.65),transparent 70%)}
/* seven or more at risk: three narrow columns, so twelve still fit the wall */
.civ-atrisk.dense{gap:.4cqw}
.civ-atrisk.dense .grid{grid-template-columns:1fr 1fr 1fr;gap:.4cqw}
.civ-atrisk.dense .civ-htile{gap:.45cqw;padding:.35cqw .45cqw;border-radius:.45cqw}
.civ-atrisk.dense .civ-htile .ph{width:2.2cqw;font-size:.9cqw}
.civ-atrisk.dense .civ-htile .n{font-size:.78cqw;letter-spacing:.03em}
@media (prefers-reduced-motion: reduce){.civ-hfocus,.civ-hfocus .stamp,.civ-hwall,.civ-htile,.civ-atrisk.back,.civ-hfocus .flash{animation:none!important}}
.civ-atrisk .hd{text-align:center;font-weight:900;font-size:1.1cqw;letter-spacing:.22em;color:#ff8fb0}
.civ-atrisk .grid{display:grid;grid-template-columns:1fr 1fr;gap:.6cqw}
/* the blocking */
.civ-redwash{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,transparent 40%,rgba(120,0,30,.45));opacity:.3;transition:opacity 1s}
.civ-blocked.done .civ-redwash{opacity:1}
.civ-bgrid{position:absolute;left:24%;right:3%;top:12%;display:grid;grid-template-columns:repeat(4,1fr);gap:.6cqw;z-index:4}
.civ-mtile.out{filter:grayscale(1) brightness(.45);background:rgba(60,0,10,.7);box-shadow:inset 0 0 0 .2cqw #ff2a4a}
.civ-mtile.out .civ-badge{filter:none}
.civ-msgbox{position:absolute;left:30%;right:9%;top:52%;z-index:6;min-height:7cqw;padding:1.2cqw 1.6cqw;border-radius:.8cqw;background:rgba(238,240,247,.96);color:#1a1d3a;font-weight:600;font-size:1.5cqw;line-height:1.4;box-shadow:0 0 3cqw rgba(47,123,255,.4)}
.civ-msgbox .from{font-weight:900;font-size:.85cqw;letter-spacing:.16em;color:#2f7bff;margin-bottom:.3cqw}
.civ-msgbox.idle{background:rgba(20,24,60,.85);color:#dfe6ff;font-style:italic;text-align:center;display:grid;place-items:center}
.civ-msgbox .civ-dots span{background:#2f7bff}
.civ-msgbox.sent{animation:civUp .5s both}
.civ-slam{position:absolute;inset:0;z-index:16;display:grid;place-content:center;text-align:center;pointer-events:none;animation:civSlamOut 2.4s both}
.civ-slam span{font-weight:900;font-size:13cqw;letter-spacing:.06em;color:#ff2a4a;text-shadow:0 0 4cqw rgba(255,42,74,.8),-.5cqw 0 #2ae8ff;animation:civPop .8s cubic-bezier(.2,1.6,.3,1) both}
@keyframes civPop{0%{opacity:0;transform:scale(2.6);filter:blur(16px)}100%{opacity:1;transform:none;filter:none}}
.civ-slam small{font-weight:800;font-size:2.4cqw;letter-spacing:.3em}
@keyframes civSlamOut{0%,70%{opacity:1;background:rgba(20,0,6,.93)}100%{opacity:0;background:transparent}}
.civ-flash.red{background:#ff2a4a;animation:civFlash .5s .35s}
/* a real room: the finale meet */
.civ-room2{background:#120d0a}
.civ-two{position:absolute;left:8%;right:8%;top:11%;display:flex;justify-content:center;gap:5cqw;z-index:6}
.civ-two.many{gap:1.6cqw;left:3%;right:3%}
/* the finalists sit on the lounge's long sofa (assets/sets/circle/lounge.webp) */
.civ-room2.lounge .civ-two{top:22%}
.civ-person{display:flex;flex-direction:column;align-items:center;gap:.6cqw;width:24cqw;transition:transform .35s}
.civ-two.many .civ-person{width:15cqw}
.civ-person .civ-mcam{width:100%}
.civ-person.talk{transform:translateY(-.8cqw)}.civ-person.talk .civ-mcam{box-shadow:0 0 0 .4cqw rgba(255,210,63,.6),0 0 4cqw var(--glow,#3fd8ff)}
.civ-person.enter{animation:civWalkIn .9s cubic-bezier(.2,1.2,.3,1) both}
.civ-was,.civ-wasnt{font-weight:700;font-size:1cqw;letter-spacing:.08em;padding:.3cqw .7cqw;border-radius:.3cqw;background:rgba(0,0,0,.45)}
.civ-wasnt{color:#ff9fd6;border:1px solid rgba(255,79,180,.5)}
/* the goodbye video */
.civ-bigtv{position:absolute;left:24%;right:4%;top:10%;bottom:26%;border-radius:1cqw;border:.5cqw solid #0c0c10;background:#05060f;overflow:hidden;box-shadow:0 0 0 1px #222,0 0 4cqw rgba(63,216,255,.4);z-index:5}
.civ-video:not(.after) .civ-bigtv{left:12%;right:12%}
.civ-vid{position:absolute;inset:0;background-color:#161a4a;background-position:center;background-size:contain;background-repeat:no-repeat;display:grid;place-items:center;font-weight:900;font-size:12cqw;filter:saturate(.9)}
.civ-vid:after{content:"\\25CF  REC";position:absolute;left:1.4cqw;top:1.2cqw;font-weight:800;font-size:1cqw;letter-spacing:.16em;color:#ff4a6a;animation:civBlink 1.2s infinite}
.civ-vid.play{animation:civVidIn .8s both}
@keyframes civVidIn{from{filter:brightness(3) blur(10px)}}
.civ-vidname{position:absolute;left:1.4cqw;top:3.2cqw;font-weight:900;font-size:1.6cqw;letter-spacing:.08em;text-shadow:0 2px 8px #000}
.civ-vidname i{font-style:normal;font-weight:600;font-size:1.1cqw;color:#ff9fd6}
.civ-sub{position:absolute;left:8%;right:8%;bottom:5.5cqw;text-align:center;font-weight:600;font-size:1.6cqw;line-height:1.35;background:rgba(0,0,0,.6);padding:.6cqw 1cqw;border-radius:.5cqw;animation:civUp .4s both}
.civ-bar{position:absolute;left:1.4cqw;right:1.4cqw;bottom:1.4cqw;height:.4cqw;background:rgba(255,255,255,.2);border-radius:.2cqw}
.civ-bar i{display:block;height:100%;background:#ff4a6a;border-radius:.2cqw;transition:width 1.4s linear}
.civ-vidcard{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.2cqw;text-align:center;font-weight:700;font-size:1.3cqw;letter-spacing:.16em;color:#cfd6ff;background:radial-gradient(ellipse,#1a1c5a,#05060f)}
.civ-vidcard b{font-size:2.6cqw;color:#fff;letter-spacing:.06em}
.civ-vidcard .ph{width:10cqw;aspect-ratio:1;border-radius:50%;background:#1b1f45 center 25%/cover;border:.3cqw solid #fff;display:grid;place-items:center;font-weight:900;font-size:4cqw}
.civ-play{width:5cqw;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font-size:2cqw;background:linear-gradient(135deg,var(--bl),var(--pk));box-shadow:0 0 3cqw rgba(255,79,180,.6);animation:civPulse 1.4s infinite}
/* the finale studio */
.civ-board.studio{left:50%;right:auto;width:44%;margin-left:-22%;top:9%;bottom:auto}
.civ-aka{font-weight:700;font-size:.85cqw;color:#ff9fd6;white-space:nowrap}
.civ-couch{position:absolute;left:3%;right:3%;bottom:23%;display:flex;justify-content:center;gap:1.4cqw;z-index:6}
/* finale night: the pause before a name, the last two, the speech (moments.js studioStage) */
.civ-slot.drum .civ-mtile{animation:civDrum .55s ease-in-out infinite;box-shadow:0 0 1.6cqw rgba(255,210,63,.55);border:1px solid rgba(255,210,63,.6)}
@keyframes civDrum{50%{transform:scale(1.03);box-shadow:0 0 3cqw rgba(255,210,63,.9)}}
.civ-seat{position:relative;transition:transform .45s,filter .45s,opacity .45s}
.civ-seat.tense{animation:civTense .9s ease-in-out infinite}
@keyframes civTense{50%{transform:translateY(-.25cqw)}}
.civ-studio.final2 .civ-seat.dim{opacity:.35;filter:grayscale(.6)}
.civ-seat.stand{transform:translateY(-2.2cqw) scale(1.15);z-index:3}
.civ-seat.stand .civ-mcam{box-shadow:0 0 0 .35cqw #ffd23f,0 0 4cqw rgba(255,210,63,.8)}
.civ-seat.spot .civ-mcam{box-shadow:0 0 0 .4cqw #ffd23f,0 0 6cqw rgba(255,210,63,.9)}
.civ-spot{position:absolute;inset:0;z-index:5;pointer-events:none;background:radial-gradient(ellipse 30% 45% at 50% 78%,transparent 40%,rgba(0,0,0,.45) 100%);animation:civFade .6s reverse both}
.civ-seatplace{position:absolute;left:50%;bottom:-1.6cqw;transform:translateX(-50%);font-weight:900;font-size:.85cqw;letter-spacing:.12em;padding:.2cqw .6cqw;border-radius:99px;background:#1b1f45;border:1px solid rgba(255,255,255,.35);white-space:nowrap;animation:civUp .4s both}
.civ-seatplace.gold{background:#ffd23f;color:#2a1d00;border-color:#ffd23f}
.civ-seatfan{position:absolute;left:50%;top:-1.6cqw;transform:translateX(-50%);font-weight:900;font-size:.7cqw;letter-spacing:.12em;padding:.2cqw .6cqw;border-radius:99px;background:#ff4fb4;white-space:nowrap;animation:civUp .5s both}
.civ-guests{position:absolute;left:4%;right:4%;top:11%;z-index:6;text-align:center}
.civ-guests .hd{font-weight:800;font-size:.85cqw;letter-spacing:.2em;color:#c9bfff;margin-bottom:1.4cqw}
.civ-guests .row{display:flex;justify-content:center;flex-wrap:wrap;gap:1cqw}
.civ-guests .civ-seat{width:6.6cqw}
.civ-guests .civ-seat.talk .civ-mcam,.civ-studio .civ-couch .civ-seat.talk .civ-mcam{box-shadow:0 0 0 .3cqw #3fd8ff,0 0 3cqw rgba(63,216,255,.8)}
.civ-crowd{position:absolute;left:3%;top:9%;z-index:6;display:flex;flex-wrap:wrap;gap:.45cqw;max-width:22%;align-items:center}
.civ-crowd .hd{width:100%;font-weight:800;font-size:.75cqw;letter-spacing:.2em;color:#c9bfff}
.civ-crowd span:not(.hd){width:2.6cqw;aspect-ratio:1;border-radius:50%;background:#1b1f45 center 25%/cover;border:.15cqw solid rgba(255,255,255,.4);opacity:.7;display:grid;place-items:center;font-size:.9cqw;font-weight:800;transition:all .3s}
.civ-crowd span.talk{opacity:1;transform:scale(1.35);border-color:#ffd23f;box-shadow:0 0 1.2cqw #ffd23f}
.civ-crowd span.fan{opacity:1;border-color:#ff4fb4;box-shadow:0 0 1.2cqw #ff4fb4}
.civ-mtile.secret{opacity:.9;border:1px dashed rgba(255,210,63,.7)}.civ-mtile.secret .ph{border-color:#ffd23f;color:#ffd23f}.civ-mtile.secret .n{color:#ffd23f;letter-spacing:.12em}
@media (prefers-reduced-motion: reduce){.civ-slot.drum .civ-mtile,.civ-seat.tense{animation:none}}
.civ-seat{width:8.5cqw;transition:transform .35s}.civ-seat .civ-mcam{width:100%;font-size:3.5cqw}
.civ-seat.talk{transform:translateY(-1cqw)}
.civ-seat.win .civ-mcam{box-shadow:0 0 0 .5cqw #ffd23f,0 0 5cqw #ffd23f}
.civ-winner{position:absolute;left:0;right:0;top:40%;text-align:center;z-index:16;font-weight:900;font-size:9cqw;letter-spacing:.14em;color:#ffd23f;text-shadow:0 0 4cqw rgba(255,210,63,.8);animation:civSlamIn 1s both,civFade 1s 2.6s both}
@keyframes civFade{to{opacity:0}}
/* the party: the Circle UI with the lights down */
.civ-party:before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;mix-blend-mode:screen;opacity:.55;
  background:radial-gradient(circle at 20% 30%,rgba(255,79,180,.6),transparent 25%),radial-gradient(circle at 80% 20%,rgba(63,216,255,.6),transparent 25%),radial-gradient(circle at 60% 80%,rgba(255,210,63,.5),transparent 25%);animation:civDisco 3s linear infinite alternate}
@keyframes civDisco{to{filter:hue-rotate(160deg);transform:scale(1.1)}}
.civ-partybar{position:absolute;left:11%;right:25%;top:2.5%;z-index:9;display:flex;gap:.6cqw;align-items:center;justify-content:center;flex-wrap:wrap}
.civ-partybar b{font-weight:900;font-size:1.2cqw;letter-spacing:.16em;background:linear-gradient(90deg,#ff4fb4,#ffd23f);-webkit-background-clip:text;background-clip:text;color:transparent}
.civ-partybar span{font-weight:700;font-size:.8cqw;letter-spacing:.1em;padding:.2cqw .5cqw;border-radius:99px;background:rgba(255,255,255,.12)}
.civ-party .civ-where{display:none}
/* ── the game boards (js/vp-ci/boards.js) ── */
.civ-gtitle{position:absolute;left:3%;top:9%;width:19%;z-index:8;display:flex;flex-direction:column;gap:.5cqw}
.civ-gtitle b{font-weight:900;font-size:2.1cqw;line-height:1.05;letter-spacing:.04em;background:linear-gradient(90deg,#ffd23f,#ff4fb4,#8b5cff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 1cqw rgba(255,79,180,.45))}
.civ-gtitle span{width:fit-content;font-weight:800;font-size:.72cqw;letter-spacing:.14em;padding:.3cqw .6cqw;border-radius:.3cqw;background:rgba(255,210,63,.18);color:#ffd23f;border:1px solid rgba(255,210,63,.45)}
.civ-gboard{position:absolute;left:24%;right:3%;top:10%;bottom:25%;z-index:5;padding:1.2cqw;border-radius:1cqw;overflow:hidden;display:flex;flex-direction:column;gap:.7cqw;
  background:rgba(10,12,40,.84);border:1px solid rgba(63,216,255,.35);box-shadow:0 0 3cqw rgba(47,123,255,.3)}
.civ-gboard .land,.civ-gboard .civ-mtile.land{animation:civLand .7s cubic-bezier(.2,1.4,.4,1) both}
.civ-gcard{padding:1cqw 1.4cqw;border-radius:.8cqw;background:linear-gradient(135deg,rgba(47,123,255,.35),rgba(139,92,255,.3));border:1px solid rgba(139,92,255,.5);font-weight:700;font-size:1.55cqw;line-height:1.35}
.civ-gcard small{display:block;font-weight:900;font-size:.75cqw;letter-spacing:.18em;color:#9fe6ff;margin-bottom:.3cqw}
.civ-gcard.rules{font-weight:500;font-size:1.35cqw}
.civ-gcard.bad{background:linear-gradient(135deg,rgba(255,42,74,.35),rgba(139,92,255,.25));border-color:rgba(255,42,74,.55)}
.civ-gcard.funny{background:linear-gradient(135deg,rgba(255,159,47,.3),rgba(255,79,180,.28))}
.civ-gcard.fact{background:linear-gradient(135deg,rgba(63,216,136,.25),rgba(47,123,255,.3));border-color:rgba(63,216,136,.5)}
.civ-gcols{display:grid;grid-template-columns:1fr 1fr;gap:1cqw;flex:1}
.civ-gcols>div{display:flex;flex-direction:column;gap:.45cqw;padding:.6cqw;border-radius:.6cqw;background:rgba(255,255,255,.04)}
.civ-gcols h4{margin:0 0 .3cqw;text-align:center;font-weight:900;font-size:1.1cqw;letter-spacing:.2em}
.civ-gcols h4.yes{color:#3fd88f}.civ-gcols h4.no{color:#ff5b7a}
.civ-mtile.lone{box-shadow:0 0 0 .2cqw #ffd23f,0 0 2cqw rgba(255,210,63,.6)}
.civ-gnote{text-align:center;font-weight:800;font-size:1.1cqw;letter-spacing:.14em;color:#ffd23f;padding:.4cqw}
.civ-gnote.right{color:#3fd88f}.civ-gnote.wrong{color:#ff5b7a}
.civ-grow{display:flex;align-items:center;gap:.8cqw;padding:.3cqw .5cqw;border-radius:.6cqw;font-size:1.1cqw}
.civ-grow .civ-mtile{flex:0 0 38%}
.civ-grow>b{margin-left:auto;font-weight:900;font-size:1.5cqw}
.civ-grow>b.right{color:#3fd88f}.civ-grow>b.wrong{color:#ff5b7a}
.civ-grow.won{background:rgba(255,210,63,.18);box-shadow:0 0 2cqw rgba(255,210,63,.35)}.civ-grow.won.bad{background:rgba(255,42,74,.22);box-shadow:0 0 2cqw rgba(255,42,74,.4)}
.civ-grow em{margin-left:auto;font-style:normal;font-weight:900;font-size:.75cqw;letter-spacing:.14em;padding:.2cqw .5cqw;border-radius:.3cqw;background:rgba(255,255,255,.12)}
.civ-grow em.proud{color:#3fd88f}.civ-grow em.disaster{color:#ff5b7a}
.civ-gvotes{display:flex;gap:.25cqw;flex-wrap:wrap}
.civ-grest{display:flex;flex-wrap:wrap;gap:.35cqw;margin-top:.2cqw}
.civ-grest.land .civ-gchip{animation:civUp .45s both}
.civ-grest.land .civ-gchip:nth-child(2){animation-delay:.06s}.civ-grest.land .civ-gchip:nth-child(3){animation-delay:.12s}.civ-grest.land .civ-gchip:nth-child(4){animation-delay:.18s}.civ-grest.land .civ-gchip:nth-child(n+5){animation-delay:.24s}
.civ-gchip{display:inline-flex;align-items:center;gap:.35cqw;padding:.15cqw .55cqw .15cqw .15cqw;border-radius:2cqw;background:rgba(255,255,255,.07);font-size:.85cqw;font-weight:800;letter-spacing:.04em;color:#e8ecff}
.civ-gchip i{font-style:normal}
.civ-gchip.lone{background:rgba(255,210,63,.18);box-shadow:0 0 0 .12cqw #ffd23f}
.civ-gcount{display:inline-block;margin-left:.4cqw;padding:0 .45cqw;border-radius:1cqw;background:rgba(255,255,255,.12);color:#fff;font-size:.85cqw;letter-spacing:0}
.civ-gmini{display:inline-grid;place-items:center;width:2.3cqw;height:2.3cqw;border-radius:50%;background:#1b1f45 center 25%/cover;border:.16cqw solid var(--ring,#2f7bff);font-weight:800;font-size:.9cqw;vertical-align:middle}
.civ-gmini.big{width:6cqw;height:6cqw;font-size:2.4cqw;flex:none}
.civ-gaward{margin-top:auto;text-align:center;font-weight:900;font-size:2.4cqw;letter-spacing:.1em;color:#ffd23f;text-shadow:0 0 2cqw rgba(255,210,63,.7);animation:civSlamIn .6s both}
.civ-gaward:before{content:"\\1F3C6  "}
.civ-gaward.bad{color:#ff5b7a;text-shadow:0 0 2cqw rgba(255,42,74,.7)}
.civ-gask{padding:1.2cqw 1.4cqw;border-radius:.8cqw;background:rgba(238,240,247,.96);color:#1a1d3a}
.civ-gask small{font-weight:900;font-size:.75cqw;letter-spacing:.18em;color:#2f7bff}
.civ-gask.barbed small{color:#ff2a4a}.civ-gask.barbed{box-shadow:0 0 2cqw rgba(255,42,74,.45)}
.civ-gq{font-size:1.3cqw;margin:.3cqw 0}.civ-gq span{color:#6a6f99}.civ-gq b.anon{letter-spacing:.14em;color:#8b5cff}
.civ-gqtext{font-size:1.5cqw;font-weight:600;line-height:1.4}
.civ-gboard>.civ-gqtext{color:#eef1ff;text-align:center;font-style:italic}
.civ-mtile.hot{align-self:center;min-width:40%;background:rgba(255,79,180,.3);box-shadow:0 0 2cqw rgba(255,79,180,.5)}
.civ-gowner{display:flex;justify-content:center}.civ-gowner .civ-mtile{min-width:50%}
.civ-mtile.won{background:rgba(255,210,63,.3);box-shadow:0 0 2cqw rgba(255,210,63,.6)}
.civ-gplans{display:flex;flex-direction:column;gap:.35cqw}
.civ-gwall,.civ-gfeed{display:grid;grid-template-columns:repeat(auto-fill,minmax(10.5cqw,1fr));gap:.7cqw;align-content:start}
.civ-gframe{position:relative;padding:.5cqw;border-radius:.4cqw;background:#f4efe6;color:#1a1d3a;border:.3cqw solid #c9a55a;box-shadow:0 6px 18px rgba(0,0,0,.45)}
.civ-gframe .art{aspect-ratio:1;background:#2a2d6a center 25%/cover;display:grid;place-items:center;font-weight:900;font-size:3cqw;color:#fff}
.civ-gframe.proud .art{filter:saturate(1.4) contrast(1.1)}
.civ-gframe.ok .art{filter:sepia(.35) saturate(.9)}
.civ-gframe.disaster .art{filter:grayscale(.6) contrast(1.6) blur(.6px) hue-rotate(40deg)}
.civ-gframe .cap{font-weight:900;font-size:.8cqw;letter-spacing:.1em;margin-top:.3cqw}
.civ-gframe .line{font-size:.72cqw;line-height:1.3;font-style:italic;color:#4a4f7a;max-height:2.9cqw;overflow:hidden}
.civ-gframe .meta{font-size:.72cqw;font-weight:700;color:#8a5a2a}.civ-gframe .meta b.win{color:#c0392b;letter-spacing:.06em}
.civ-gframe.won{border-color:#ffd23f;box-shadow:0 0 2.4cqw rgba(255,210,63,.8)}.civ-gframe.won:after{content:"\\265B";position:absolute;top:-1.4cqw;left:50%;transform:translateX(-50%);color:#ffd23f;font-size:2cqw}
.civ-gframe.last{opacity:.55}
.civ-gpost{padding:.5cqw;border-radius:.5cqw;background:rgba(26,30,70,.9);border:1px solid rgba(255,255,255,.1)}
.civ-gpost .ph{aspect-ratio:1;border-radius:.3cqw;background:#2a2d6a center 25%/cover;display:grid;place-items:center;font-weight:900;font-size:3cqw}
.civ-gpost .by{font-weight:900;font-size:.78cqw;letter-spacing:.08em;margin-top:.3cqw;display:flex}.civ-gpost .by em{margin-left:auto;font-style:normal;color:#ff4fb4}
.civ-gpost .cap{font-size:.75cqw;line-height:1.3;color:#cfd6ff;max-height:2cqw;overflow:hidden}
.civ-gpost .tags{display:flex;flex-wrap:wrap;gap:.2cqw;margin-top:.2cqw}.civ-gpost .tags span{font-size:.7cqw;padding:.1cqw .35cqw;border-radius:99px;background:rgba(58,168,255,.2)}
.civ-gpost.won{box-shadow:0 0 2.4cqw rgba(255,210,63,.7);border-color:#ffd23f}
.civ-gscore{display:flex;align-items:center;justify-content:center;gap:1.4cqw}
.civ-gscore>div{display:flex;align-items:center;gap:.3cqw}.civ-gscore b{font-weight:900;font-size:3.4cqw;margin:0 .8cqw;color:#ffd23f}
.civ-gscore i{font-style:normal;font-weight:900;color:#9aa6d6;letter-spacing:.2em}
.civ-gteams{display:grid;grid-template-columns:1fr 1fr;gap:1cqw}
.civ-gteams>div{display:flex;flex-direction:column;gap:.35cqw}
.civ-gteams h4{margin:0;text-align:center;font-weight:900;font-size:.9cqw;letter-spacing:.16em;color:#9fe6ff}
.civ-gpiles{display:flex;flex-direction:column;gap:.5cqw}
.civ-gpile{display:flex;align-items:center;gap:.8cqw}.civ-gpile .civ-mtile{flex:0 0 36%}
.civ-gpile .boxes{display:flex;flex-wrap:wrap;gap:.2cqw;font-size:1.6cqw}.civ-gpile>b{margin-left:auto;font-weight:900;font-size:1.5cqw}
.civ-gflirt{display:flex;align-items:center;gap:1.2cqw;margin:auto 0}
.civ-gflirt .bub{flex:1;padding:1.2cqw 1.4cqw;border-radius:1cqw;background:linear-gradient(135deg,rgba(255,79,180,.35),rgba(139,92,255,.3));font-size:1.55cqw;font-weight:600;line-height:1.4}
.civ-gflirt .bub small{display:block;font-size:.8cqw;font-weight:800;letter-spacing:.12em;color:#ffb3dc;margin-top:.4cqw}
.civ-gseat{display:flex;justify-content:center}.civ-gseat .civ-mtile{min-width:46%}
.civ-gring{display:flex;flex-wrap:wrap;justify-content:center;gap:.6cqw}
.civ-gring span{display:flex;align-items:center;gap:.2cqw;padding:.25cqw .45cqw;border-radius:99px;background:rgba(255,255,255,.06);opacity:.6}
.civ-gring span.now{opacity:1;background:rgba(255,42,74,.3);box-shadow:0 0 1.4cqw rgba(255,42,74,.5)}
.civ-gring span.mutual{border:1px solid #ffd23f}.civ-gring i{font-style:normal;color:#ff8fa0}
/* the live sidebar, beside the script under the stage */
.civ-under{display:grid;grid-template-columns:1fr 290px;gap:12px;align-items:start}
@media (max-width:760px){.civ-under{grid-template-columns:1fr}}
.civ-side{background:rgba(10,14,40,.75);border:1px solid rgba(139,92,255,.3);border-radius:12px;padding:10px 12px;max-height:420px;overflow:auto;font-size:12px}
.civ-sidehd{font-weight:900;letter-spacing:.16em;font-size:12px;margin-bottom:8px;background:linear-gradient(90deg,#3fd8ff,#ff4fb4);-webkit-background-clip:text;background-clip:text;color:transparent}
.civ-sidehd small{letter-spacing:.08em;font-weight:600;color:#9aa6d6;-webkit-text-fill-color:#9aa6d6;margin-left:6px}
.civ-splist{display:flex;flex-direction:column;gap:5px}
.civ-sp{display:flex;gap:8px;align-items:center;transition:opacity .4s,filter .4s}
.civ-sp .ph{flex:none;width:30px;height:30px;border-radius:50%;background:#1b1f45 center 25%/cover;border:2px solid var(--ring,#2f7bff);display:grid;place-items:center;font-weight:800;font-size:12px}
.civ-sp .t{min-width:0;line-height:1.25}.civ-sp b{font-weight:800}
.civ-sp small{display:block;color:#9aa6d6;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.civ-sp small i{color:#ff9fd6;font-style:normal;font-weight:700}
.civ-sp.out{opacity:.4;filter:grayscale(1)}
.civ-crown{color:#ffd23f;margin-left:5px}
.civ-x{margin-left:6px;font-size:9px;font-weight:900;letter-spacing:.12em;color:#fff;background:#ff2a4a;padding:1px 4px;border-radius:3px}
.civ-sidesec{margin-top:10px;font-weight:900;font-size:10px;letter-spacing:.16em;color:#9aa6d6}
.civ-sidesec ul{list-style:none;margin:4px 0 0;padding:0;font-weight:500;font-size:12px;letter-spacing:0;color:#dfe6ff}
.civ-sidesec li{margin:3px 0}
.civ-meter{display:inline-block;width:44px;height:5px;border-radius:3px;background:rgba(255,255,255,.15);vertical-align:middle;margin-left:4px}
.civ-meter i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#ff2a4a,#ffd23f)}
.civ-heart{color:#ff4fb4}.civ-bolt{color:#ffd23f}
.civ-sidenote{margin-top:10px;font-size:10.5px;color:#7f88b8;font-style:italic}
/* the stage fits the window, so Next is always in reach */
.civ-stagewrap{position:relative;width:min(100%,calc((100vh - 250px) * 16 / 9));margin:0 auto}
.civ-btn.civ-nextbtn{font-size:13px;padding:10px 26px;box-shadow:0 0 18px rgba(139,92,255,.55)}
/* the controls and the script under the stage */
.civ-controls{display:flex;gap:8px;align-items:center;margin:10px 0}
.civ-btn{font-weight:700;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#cfd6ff;background:#121838;border:1px solid #2a3470;border-radius:99px;padding:8px 14px;cursor:pointer;font-family:inherit}
.civ-btn.main{background:linear-gradient(90deg,var(--bl),var(--vi));color:#fff;border-color:transparent}
.civ-btn.on{box-shadow:0 0 14px rgba(63,216,255,.6);color:#fff}
.civ-count{margin-left:auto;font-size:12px;color:#9aa6d6;font-variant-numeric:tabular-nums}
.civ-tvbtn{margin-left:auto}.civ-tvbtn .civ-tvOff{display:none}.ci-tv .civ-tvbtn .civ-tvOn{display:none}.ci-tv .civ-tvbtn .civ-tvOff{display:inline}.ci-tv .civ .civ-under{display:none}.ci-tv .civ .civ-stagewrap{width:min(100%,calc((100vh - 210px) * 16 / 9))}.ci-tv .civ .civ-stage{cursor:pointer}#visual-player.ci-tv:has(.civ) #vp-sidebar{display:none}#visual-player.ci-tv:has(.civ):fullscreen{overflow:auto;background:#05061a}#visual-player.ci-tv:has(.civ):fullscreen .civ .civ-stagewrap{width:min(100%,calc((100vh - 185px) * 16 / 9))}.civ-feed,.civ-chatwin-feed{overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(139,92,255,.5) transparent;justify-content:flex-start!important}.civ-thread{margin-top:auto;display:flex;flex-direction:column;gap:inherit;padding-bottom:.4cqw}.civ-msg .civ-card{flex:0 1 auto;max-width:84%}.civ-msg.mine{flex-direction:row-reverse}.civ-msg.mine .civ-card{background:linear-gradient(135deg,rgba(47,123,255,.55),rgba(139,92,255,.5));text-align:left}.civ-msg.mine .civ-card .nm{text-align:right}.civ-tick{font-size:.8cqw;font-weight:700;letter-spacing:.06em;color:#9fb4ff;text-align:right;margin-top:.3cqw}.civ-chatwin .civ-tick{font-size:.75cqw}.civ-pip{left:auto!important;right:1.5%;bottom:13%;max-width:40%;flex-direction:row-reverse}.civ-cap{top:9%}.civ-cap.foot{top:auto;bottom:5%;left:6%;right:6%;font-size:1.55cqw;line-height:1.45;padding:1.3cqw 1.8cqw;border-radius:.9cqw}.civ-cap.foot b{font-size:1.05cqw}.civ-hangout .civ-hcam{top:17%}.civ-hangout .civ-hcam.M{top:9%}.civ-bstack{position:absolute;left:6%;right:6%;top:10%;bottom:27%;z-index:5;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2.2cqw}.civ-bstack .civ-bgrid{position:relative;left:auto;right:auto;top:auto;width:100%}.civ-bstack .civ-msgbox{position:relative;left:auto;right:auto;top:auto;width:62%;box-sizing:border-box}.civ-fhd{position:absolute;left:6%;top:9%;font-weight:900;font-size:2.2cqw;letter-spacing:.06em;z-index:5}.civ-fhd small{display:block;font-size:.9cqw;letter-spacing:.18em;color:#8fd8ff;font-weight:800;margin-top:.2cqw}.civ-fgrid{position:absolute;left:6%;right:6%;top:21%;bottom:27%;z-index:5;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(0,1fr);gap:.8cqw;align-content:center}.civ-fpost{display:flex;align-items:center;gap:1cqw;background:rgba(18,22,64,.85);border:1px solid rgba(255,255,255,.08);border-radius:.8cqw;padding:.6cqw .9cqw;min-height:0;transition:all .4s}.civ-fpost .ph{flex:none;width:3.6cqw;aspect-ratio:1;border-radius:50%;border:.25cqw solid var(--ring);background:#1b1f45 center 25%/cover;display:grid;place-items:center;font-weight:800}.civ-fpost .bd{flex:1;min-width:0}.civ-fpost .nm{font-weight:800;font-size:.95cqw;letter-spacing:.06em;display:flex;gap:.6cqw;align-items:center}.civ-fpost .tx{font-size:1.05cqw;color:#cfd6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.civ-fpost .lk{flex:none;display:flex;align-items:center;gap:.35cqw;font-size:1.5cqw;font-weight:900;min-width:4.5cqw;justify-content:flex-end}.civ-fpost .hrt{color:#ff4fb4;text-shadow:0 0 1cqw rgba(255,79,180,.7)}.civ-fpost .lk.count b{animation:civCount .6s calc(var(--i) * 70ms) both}@keyframes civCount{from{opacity:0;transform:scale(2)}}.civ-fpost.top{background:linear-gradient(90deg,rgba(255,79,180,.35),rgba(139,92,255,.35));border-color:rgba(255,210,63,.7);box-shadow:0 0 2cqw rgba(255,79,180,.4)}.civ-fpost.zero{opacity:.55}.civ-fpost.zero .hrt{color:#6b7099;text-shadow:none}.civ-fpost.talk{outline:.25cqw solid rgba(255,210,63,.8)}.civ-fcrown{font-size:.75cqw;letter-spacing:.12em;color:#1a1020;background:#ffd23f;padding:.1cqw .5cqw;border-radius:.3cqw}.civ-bstack .civ-msgbox.piece{min-height:0;padding:.8cqw 1.4cqw;font-size:1.3cqw}.civ-bstack{gap:1.2cqw}.civ-fbk{background:#120f22;overflow:hidden}.civ-fbk-bg{position:absolute;inset:0;background:radial-gradient(80% 90% at 50% 30%,#4a3a5e,#141022 75%);filter:sepia(.35) saturate(.8)}.civ-fbk-grain{position:absolute;inset:0;z-index:4;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 2px,transparent 2px 4px);animation:civGrain .5s steps(3) infinite}@keyframes civGrain{50%{transform:translateY(1px)}}.civ-fbk-vig{position:absolute;inset:0;z-index:5;pointer-events:none;box-shadow:inset 0 0 12cqw rgba(0,0,0,.85)}.civ-fbk-band{position:absolute;left:4%;top:7%;z-index:6;font-weight:900;letter-spacing:.3em;font-size:1.1cqw;color:#ffe2b0}.civ-fbk-band b{display:block;font-size:2.6cqw;letter-spacing:.08em;color:#fff2da}.civ-fbcam{position:absolute;top:19%;width:19cqw;z-index:3;filter:sepia(.55) saturate(.7) contrast(.95);transition:filter .4s}.civ-fbcam.L{left:7%}.civ-fbcam.R{right:7%}.civ-fbcam.M{left:50%;margin-left:-7cqw;width:14cqw;top:52%}.civ-fbcam .civ-mcam{position:relative;width:100%;aspect-ratio:4/5}.civ-fbcam.talk{filter:sepia(.3) saturate(.9)}.civ-fbcam.talk .civ-mcam{box-shadow:0 0 0 .4cqw rgba(255,210,150,.7),0 0 4cqw rgba(255,190,120,.6)}.civ-fbk-mid{position:absolute;left:31%;right:31%;top:26%;z-index:6;text-align:center}.civ-fbk-mid .lbl{font-weight:800;font-size:1cqw;letter-spacing:.2em;color:#ffcfa0}.civ-fbk-mid .nm{font-weight:900;font-size:2.6cqw;margin-top:.4cqw;color:#fff2da}.civ-fbk-mid .why{display:inline-block;margin-top:.8cqw;font-weight:800;font-size:.95cqw;letter-spacing:.14em;color:#1a1020;background:#ffd9a0;padding:.3cqw .8cqw;border-radius:.3cqw}.civ-fbk .civ-dlg.fb{filter:sepia(.25)}.civ-fbk-flash{position:absolute;inset:0;z-index:20;background:#fff6e0;pointer-events:none;animation:civFbFlash .7s ease-out both}@keyframes civFbFlash{from{opacity:.9}to{opacity:0}}.civ-fbk.open .civ-fbk-band,.civ-fbk.open .civ-fbk-mid{animation:civUp .6s .2s both}.civ-script{background:rgba(10,14,40,.6);border:1px solid rgba(63,216,255,.15);border-radius:12px;padding:10px 14px;max-height:260px;overflow:auto}
.civ-ln{margin:0 0 6px;font-size:13px;line-height:1.5;color:#dfe6ff;opacity:.28;transition:opacity .3s}
.civ-ln.vis{opacity:1}
.civ-ln b{font-weight:800;letter-spacing:.04em}
.civ-ln .k{font-size:10px;font-weight:800;letter-spacing:.12em;margin-right:6px;padding:1px 5px;border-radius:3px;background:rgba(255,255,255,.1)}
.civ-ln.send .k{background:rgba(63,216,255,.2);color:var(--cy)}
.civ-ln.stage{font-style:italic;color:#aab4e6}
@media (prefers-reduced-motion:reduce){.civ *,.civ *:before,.civ *:after{animation:none!important;transition:none!important}.civ-building{opacity:0}}
`;
