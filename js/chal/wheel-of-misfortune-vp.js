// ══════════════════════════════════════════════════════════════════════
// wheel-of-misfortune-vp.js — VP screens for "Wheel of Misfortune".
// Night-carnival midway (wm- prefix): a big rotating Ferris wheel of amber
// bulbs against a deep indigo sky, gondolas holding the riders, a lit dodge
// arena below. Phase environments shift: WHEEL (amber/red arena) → SEARCH
// (dark, a sweeping searchlight cone) → MAZE (green felt top-down board).
// LIVE, STICKY per-phase sidebars rebuilt from per-beat board snapshots.
// DOM-only reveals, one reveal-state key per phase screen.
// ══════════════════════════════════════════════════════════════════════
import { players } from '../core.js';

function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function av(name, size = 24) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #ffd98a;background:#1a1030" onerror="this.style.visibility='hidden'">`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
const ROLE = { rider: ['rider', 'WHEEL'], grounder: ['grounder', 'GROUND'] };

function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Bungee+Inline&family=Chakra+Petch:wght@400;500;600;700&display=swap');
  .wm-wrap{--amber:#ffb43c;--gold:#ffd98a;--red:#ff5347;--teal:#37d6c6;--pink:#ff5aa8;--txt:#fff3e0;--dim:#c6b0a2;--panel:rgba(28,18,44,.85);--felt:#1f7a4d;
    max-width:1100px;margin:0 auto;font-family:'Chakra Petch',system-ui,sans-serif;color:var(--txt);position:relative;overflow:visible;min-height:520px;border-radius:10px;
    background:radial-gradient(120% 80% at 50% 0%,#3a2260 0%,#241246 42%,#120a24 100%)}
  .wm-wrap *{box-sizing:border-box}
  .wm-inner{padding:0 0 130px;position:relative;z-index:3}

  /* ── HERO: rotating Ferris wheel ── */
  .wm-hero{position:relative;overflow:hidden;padding:0 0 12px;border-radius:10px 10px 0 0}
  .wm-sky{position:absolute;inset:0;z-index:0;background:radial-gradient(90% 70% at 50% 8%,#4a2c78,#221046 55%,#0e0820)}
  .wm-star{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;opacity:.7;animation:wmTwinkle 3s infinite}
  @keyframes wmTwinkle{0%,100%{opacity:.2}50%{opacity:.9}}
  .wm-heroin{position:relative;z-index:2;text-align:center;padding:20px 18px 0}
  .wm-kick{font-family:'Fredoka';letter-spacing:4px;font-size:11px;color:var(--gold);text-transform:uppercase;text-shadow:0 1px 5px #000}
  .wm-bulbs{display:flex;justify-content:center;gap:9px;margin:9px 0 2px}
  .wm-bulb{width:8px;height:8px;border-radius:50%;background:var(--amber);box-shadow:0 0 9px var(--amber);animation:wmBulb 1.2s infinite}
  .wm-bulb:nth-child(3n){background:var(--red);box-shadow:0 0 9px var(--red)}.wm-bulb:nth-child(3n+1){background:var(--teal);box-shadow:0 0 9px var(--teal)}
  @keyframes wmBulb{0%,100%{opacity:1}50%{opacity:.25}}
  .wm-big{font-family:'Bungee Inline';font-size:clamp(30px,7vw,58px);line-height:1.02;letter-spacing:1px;margin:6px 0 2px;color:#fff;text-shadow:0 0 22px rgba(255,180,60,.55),3px 3px 0 #7a2a3a}
  .wm-sub{font-family:'Chakra Petch';font-weight:600;font-size:13px;color:#fff;max-width:620px;margin:6px auto 0;line-height:1.5;text-shadow:0 1px 4px #000}
  .wm-sub b{color:var(--gold)}

  .wm-ferris{position:relative;z-index:2;width:420px;max-width:96%;height:440px;margin:8px auto 2px}
  .wm-frame{position:absolute;inset:0;z-index:1;overflow:visible;pointer-events:none}
  .wm-frame .leg{stroke:#caa14a;stroke-width:7;stroke-linecap:round;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
  .wm-frame .legdk{stroke:#8a6a24;stroke-width:7;stroke-linecap:round}
  .wm-frame .brace{stroke:#a07c2c;stroke-width:4;stroke-linecap:round}
  .wm-frame .base{stroke:#6a4420;stroke-width:9;stroke-linecap:round}
  .wm-frame .foot{fill:#5a3418}
  .wm-spin{position:absolute;left:50%;top:14px;width:340px;height:340px;margin-left:-170px;z-index:2;animation:wmRot 30s linear infinite;transform-origin:50% 50%}
  @keyframes wmRot{to{transform:rotate(360deg)}}
  .wm-rim{position:absolute;inset:0;border-radius:50%;border:7px solid var(--amber);box-shadow:0 0 34px rgba(255,180,60,.55),inset 0 0 30px rgba(255,180,60,.4)}
  .wm-rim.inner{inset:15px;border-width:3px;border-color:rgba(255,217,138,.5);box-shadow:none}
  .wm-spoke{position:absolute;left:50%;top:50%;width:3px;height:50%;background:linear-gradient(180deg,rgba(255,224,150,.95),rgba(255,180,60,.25));transform-origin:top center;transform:translate(-50%,0);border-radius:2px}
  .wm-lamp{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 9px var(--gold);animation:wmBulb 1.6s infinite;transform:translate(-50%,-50%)}
  .wm-hub{position:absolute;left:50%;top:14px;width:34px;height:34px;border-radius:50%;transform:translate(-50%,153px);background:radial-gradient(circle at 40% 35%,#fff0cc,#b8781f);box-shadow:0 0 18px rgba(255,180,60,.8);z-index:4;border:3px solid #6a4410}
  .wm-hub::after{content:"";position:absolute;inset:11px;border-radius:50%;background:#6a4410}
  .wm-gondola{position:absolute;width:48px;height:56px;margin:-28px 0 0 -24px;z-index:3;animation:wmCounter 30s linear infinite;transform-origin:50% 50%}
  @keyframes wmCounter{to{transform:rotate(-360deg)}}
  .wm-gondola .hang{position:absolute;left:50%;top:-3px;width:2px;height:11px;background:var(--gold);transform:translateX(-50%)}
  .wm-gondola .roof{position:absolute;top:6px;left:50%;width:42px;height:13px;margin-left:-21px;border-radius:21px 21px 2px 2px;background:repeating-linear-gradient(90deg,var(--red) 0 7px,#fff2e0 7px 14px);border:2px solid var(--gold);border-bottom:none;box-shadow:0 2px 5px rgba(0,0,0,.4)}
  .wm-gondola .cab{position:absolute;top:16px;left:1px;width:46px;height:38px;border-radius:6px 6px 16px 16px;background:linear-gradient(180deg,#6a2f7a,#341648);border:2px solid var(--gold);box-shadow:0 4px 10px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}
  .wm-gondola .cab img{width:30px;height:30px;border-radius:50%;object-fit:cover;border:2px solid #fff;background:#1a1030}
  .wm-topper{position:absolute;left:50%;top:-2px;transform:translateX(-50%);z-index:5;display:flex;flex-direction:column;align-items:center}
  .wm-topper .mast{width:3px;height:20px;background:var(--gold);border-radius:2px}
  .wm-topper .pennant{position:absolute;top:0;left:50%;width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:20px solid var(--red);transform-origin:left center;animation:wmWave 2.6s ease-in-out infinite}
  @keyframes wmWave{0%,100%{transform:skewY(0) scaleX(1)}50%{transform:skewY(-10deg) scaleX(.85)}}
  .wm-topper .star{position:absolute;top:-9px;left:50%;transform:translateX(-50%);width:10px;height:10px;background:var(--gold);box-shadow:0 0 10px var(--gold);clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}

  .wm-host{position:relative;z-index:2;margin:8px auto 0;display:block;width:fit-content;font-family:'Chakra Petch';font-size:12.5px;color:#fff;border:1px solid rgba(255,217,138,.55);border-radius:10px;padding:9px 15px;background:rgba(30,14,44,.75);max-width:690px;line-height:1.55;box-shadow:0 0 18px rgba(255,180,60,.22)}
  .wm-host b{color:var(--gold)}

  /* ── ROSTER: pairs with roles ── */
  .wm-roster{padding:14px 18px 6px}
  .wm-roster h3{font-family:'Fredoka';font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#fff;text-align:center;margin:0 0 4px;text-shadow:0 0 10px var(--amber)}
  .wm-note{font-family:'Chakra Petch';font-size:11px;color:var(--dim);text-align:center;max-width:580px;margin:0 auto 12px;line-height:1.5}
  .wm-pgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}
  .wm-pair{border:1px solid rgba(255,217,138,.22);border-radius:12px;padding:9px 11px;background:var(--panel);position:relative}
  .wm-pair .parch{font-family:'Fredoka';font-size:9px;letter-spacing:1px;color:var(--dim);text-transform:uppercase;text-align:center;margin-bottom:6px}
  .wm-prow{display:flex;align-items:center;gap:9px;padding:4px 0}
  .wm-prow img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #ffd98a;background:#1a1030;flex-shrink:0}
  .wm-prow .nm{flex:1;font-weight:700;font-size:13px}
  .wm-role{font-family:'Chakra Petch';font-size:8.5px;font-weight:700;letter-spacing:.5px;padding:2px 8px;border-radius:20px;border:1px solid}
  .wm-role.rider{color:#2a1200;background:var(--amber);border-color:var(--amber)}
  .wm-role.grounder{color:#00201d;background:var(--teal);border-color:var(--teal)}
  .wm-vs{text-align:center;font-family:'Fredoka';font-size:9px;color:var(--dim);margin:1px 0}

  /* ── PHASE GRID + CARDS ── */
  .wm-grid{display:grid;grid-template-columns:1fr 300px;gap:16px;padding:12px 18px}
  @media(max-width:820px){.wm-grid{grid-template-columns:1fr}}
  .wm-h2{font-family:'Bungee Inline';font-size:24px;letter-spacing:1px;color:#fff;text-align:center;margin:2px 0 4px;text-shadow:0 0 16px var(--amber)}
  .wm-amb{font-family:'Fredoka';font-size:11px;color:var(--gold);opacity:.85;text-align:center;padding:5px 0;letter-spacing:1px;font-style:italic;text-shadow:0 1px 3px #000}
  .wm-card{border:1px solid rgba(255,255,255,.14);border-left:6px solid #7a3a6a;border-radius:14px;padding:15px 18px;margin:14px 0;background:linear-gradient(180deg,rgba(40,24,60,.9),rgba(20,12,34,.92));box-shadow:0 8px 24px rgba(0,0,0,.5);position:relative;overflow:hidden;animation:wmCardIn .5s cubic-bezier(.2,.9,.25,1.2) both;transition:transform .16s ease,box-shadow .16s ease,border-color .16s}
  .wm-card::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.09),transparent);transform:skewX(-20deg);animation:wmSheen 1.1s ease-out .05s 1 both;pointer-events:none}
  .wm-card:hover{transform:translateY(-3px) scale(1.008);box-shadow:0 14px 32px rgba(0,0,0,.6)}
  .wm-card .row{display:flex;align-items:center;gap:10px;margin-bottom:9px;flex-wrap:wrap}
  .wm-card .row img{width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #ffd98a;background:#1a1030;box-shadow:0 0 10px rgba(255,180,60,.35)}
  .wm-b{font-family:'Chakra Petch';font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 11px;border-radius:7px;border:1px solid}
  .wm-card .txt{font-size:14.5px;line-height:1.58;color:#f6ecdf}.wm-card .txt b{color:#fff}
  @keyframes wmCardIn{0%{opacity:0;transform:translateY(16px) scale(.96)}100%{opacity:1;transform:none}}
  @keyframes wmSheen{0%{left:-60%}100%{left:130%}}
  .wm-card.hit{border-left-color:var(--amber);animation:wmPop .5s both}
  .wm-card.dodge{border-left-color:var(--teal)}
  .wm-card.freed{border-left-color:var(--gold);box-shadow:0 0 18px rgba(255,217,138,.25);animation:wmPop .5s both}
  .wm-card.find{border-left-color:var(--teal);animation:wmDrop .5s both}
  .wm-card.fumble{border-left-color:var(--dim)}
  .wm-card.steal{border-left-color:var(--red);box-shadow:0 0 18px rgba(255,83,71,.2);animation:wmHit .5s both}
  .wm-card.sink{border-left-color:#4bdd7a;box-shadow:0 0 16px rgba(75,221,122,.25);animation:wmPop .5s both}
  .wm-card.slip{border-left-color:var(--dim)}
  .wm-card.throw{border-left-color:var(--pink);box-shadow:0 0 20px rgba(255,90,168,.28);animation:wmShake .55s both}
  .wm-card.social{border-left-style:dashed;border-left-color:var(--pink);background:linear-gradient(180deg,rgba(46,14,44,.82),rgba(16,8,26,.86))}
  .wm-b.hit{background:rgba(255,180,60,.16);color:var(--amber);border-color:#ffb43c66}
  .wm-b.dodge{background:rgba(55,214,198,.14);color:var(--teal);border-color:#37d6c655}
  .wm-b.freed{background:rgba(255,217,138,.18);color:var(--gold);border-color:#ffd98a88}
  .wm-b.find{background:rgba(55,214,198,.16);color:var(--teal);border-color:#37d6c666}
  .wm-b.fumble{background:rgba(198,176,162,.14);color:var(--dim);border-color:#c6b0a255}
  .wm-b.steal{background:rgba(255,83,71,.18);color:var(--red);border-color:#ff534788}
  .wm-b.sink{background:rgba(75,221,122,.16);color:#6bec98;border-color:#4bdd7a66}
  .wm-b.slip{background:rgba(198,176,162,.14);color:var(--dim);border-color:#c6b0a255}
  .wm-b.throw{background:rgba(255,90,168,.16);color:var(--pink);border-color:#ff5aa888}
  .wm-b.social{background:rgba(255,90,168,.14);color:var(--pink);border-color:#ff5aa866}
  @keyframes wmPop{0%{opacity:0;transform:scale(.82) rotate(-2deg)}55%{transform:scale(1.06) rotate(1deg)}100%{opacity:1;transform:none}}
  @keyframes wmDrop{0%{opacity:0;transform:translateY(-18px) scale(.97)}60%{transform:translateY(4px)}100%{opacity:1;transform:none}}
  @keyframes wmHit{0%{opacity:0;transform:translateX(-24px) rotate(-2deg)}55%{transform:translateX(8px) rotate(1deg)}100%{opacity:1;transform:none}}
  @keyframes wmShake{0%{opacity:0}12%{opacity:1}0%,100%{transform:translateX(0)}18%{transform:translateX(-9px) rotate(-1deg)}36%{transform:translateX(9px) rotate(1deg)}54%{transform:translateX(-6px)}72%{transform:translateX(6px)}88%{transform:translateX(-3px)}}
  .wm-card.hit::before,.wm-card.sink::before,.wm-card.freed::before{content:"";position:absolute;inset:0;border-radius:14px;box-shadow:inset 0 0 0 2px rgba(255,217,138,.5);animation:wmFlash .6s ease-out both;pointer-events:none}
  @keyframes wmFlash{0%{opacity:.9}100%{opacity:0}}

  /* ── PHASE BACKDROPS: rich, animated environments ── */
  .wm-bg{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
  .wm-phase1 .wm-wrap,.wm-wrap.wm-phase1{background:radial-gradient(120% 90% at 50% -8%,#5c2233,#3a1230 46%,#160814 100%)}
  .wm-wrap.wm-phase2{background:radial-gradient(110% 85% at 50% 0%,#122048,#0a1026 52%,#04060f 100%)}
  .wm-wrap.wm-phase3{background:radial-gradient(110% 85% at 50% -5%,#1d7a52,#124e34 52%,#08281b 100%)}
  /* footlight / tent glow shared */
  .wm-glow{position:absolute;left:50%;bottom:-30%;width:120%;height:70%;transform:translateX(-50%);border-radius:50%;filter:blur(30px);opacity:.5}
  .wm-phase1 .wm-glow{background:radial-gradient(circle,rgba(255,150,60,.55),transparent 65%)}
  .wm-phase2 .wm-glow{background:radial-gradient(circle,rgba(80,150,255,.3),transparent 65%);top:-40%;bottom:auto}
  .wm-phase3 .wm-glow{background:radial-gradient(circle,rgba(120,255,180,.35),transparent 65%);top:-35%;bottom:auto}
  /* ghost ferris wheel spinning behind phase 1 */
  .wm-ghostwheel{position:absolute;right:-90px;top:-70px;width:300px;height:300px;opacity:.13;animation:wmRot 40s linear infinite}
  .wm-ghostwheel .r{position:absolute;inset:0;border-radius:50%;border:8px solid #ffb43c}
  .wm-ghostwheel .r.i{inset:26px;border-width:4px}
  .wm-ghostwheel .s{position:absolute;left:50%;top:50%;width:3px;height:50%;background:#ffb43c;transform-origin:top center}
  /* flying dodgeballs (phase 1) */
  .wm-ball{position:absolute;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff9a5a,#c8352a);box-shadow:0 0 10px rgba(255,90,50,.6),inset -3px -3px 5px rgba(0,0,0,.4);animation:wmFly linear infinite}
  .wm-ball::after{content:"";position:absolute;inset:6px 3px;border-top:2px solid rgba(255,255,255,.4);border-radius:50%}
  @keyframes wmFly{0%{transform:translateX(-8vw) translateY(0) rotate(0)}50%{transform:translateX(50vw) translateY(-40px) rotate(540deg)}100%{transform:translateX(112vw) translateY(20px) rotate(1080deg)}}
  /* sweeping spotlight (phase 1 + 2) */
  .wm-spot{position:absolute;top:-10%;width:120px;height:150%;background:linear-gradient(180deg,rgba(255,240,190,.16),transparent 70%);filter:blur(6px);transform-origin:top center}
  .wm-phase1 .wm-spot1{left:22%;animation:wmSpot 7s ease-in-out infinite}
  .wm-phase1 .wm-spot2{left:64%;animation:wmSpot 9s ease-in-out infinite reverse}
  @keyframes wmSpot{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(16deg)}}
  /* searchlight cone (phase 2) */
  .wm-searchlight{position:absolute;left:50%;top:-8%;width:200px;height:150%;margin-left:-100px;background:conic-gradient(from 180deg at 50% 0,transparent 168deg,rgba(190,220,255,.22) 180deg,transparent 192deg);filter:blur(4px);transform-origin:50% 0;animation:wmSpot 6s ease-in-out infinite}
  /* glowing scattered balls to find (phase 2) */
  .wm-gball{position:absolute;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle,#bfe0ff,#3f7fd6);box-shadow:0 0 12px rgba(120,180,255,.9);animation:wmPulse 2.4s ease-in-out infinite}
  @keyframes wmPulse{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1.1)}}
  /* drifting motes (phase 2) */
  .wm-mote{position:absolute;width:3px;height:3px;border-radius:50%;background:rgba(200,220,255,.6);animation:wmDrift linear infinite}
  @keyframes wmDrift{0%{transform:translateY(110%) translateX(0);opacity:0}10%{opacity:.7}90%{opacity:.7}100%{transform:translateY(-10%) translateX(30px);opacity:0}}
  /* maze grid + rolling ball (phase 3) */
  .wm-mazegrid{position:absolute;inset:0;background:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:44px 44px;animation:wmTilt 6s ease-in-out infinite}
  @keyframes wmTilt{0%,100%{transform:perspective(600px) rotateX(2deg) rotateY(-2deg)}50%{transform:perspective(600px) rotateX(-2deg) rotateY(2deg)}}
  .wm-rollball{position:absolute;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#8fd8b0);box-shadow:0 0 12px rgba(140,255,190,.8);animation:wmRoll 9s ease-in-out infinite}
  @keyframes wmRoll{0%{top:20%;left:-4%}25%{top:70%;left:40%}50%{top:30%;left:80%}75%{top:75%;left:30%}100%{top:20%;left:-4%}}
  .wm-confetti{position:absolute;width:7px;height:11px;opacity:.8;animation:wmFall linear infinite}
  @keyframes wmFall{0%{transform:translateY(-10%) rotate(0);opacity:0}10%{opacity:.85}100%{transform:translateY(560px) rotate(540deg);opacity:.2}}
  .wm-search-cone{position:relative;height:8px;margin:0 0 6px;border-radius:4px;background:linear-gradient(90deg,transparent,rgba(190,220,255,.55),transparent);box-shadow:0 0 14px rgba(120,180,255,.5);animation:wmSweep 4s ease-in-out infinite}
  @keyframes wmSweep{0%,100%{transform:translateX(-22%)}50%{transform:translateX(22%)}}

  /* ── SIDEBAR ── */
  .wm-side{position:sticky;top:12px;align-self:start;border:1px solid rgba(255,217,138,.24);border-radius:14px;overflow:hidden;background:linear-gradient(180deg,rgba(34,18,52,.95),rgba(14,8,26,.95));box-shadow:0 6px 20px rgba(0,0,0,.5);max-height:calc(100vh - 40px);overflow-y:auto}
  .wm-sh{font-family:'Bungee Inline';letter-spacing:1px;font-size:15px;color:var(--gold);text-align:center;padding:10px 8px 3px;background:linear-gradient(180deg,rgba(255,180,60,.16),transparent);text-shadow:0 0 12px rgba(255,180,60,.6)}
  .wm-sgoal{text-align:center;font-size:9.5px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:8px}
  .wm-srow{margin:9px 12px;padding:7px 9px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.03)}
  .wm-srow.done{border-color:rgba(255,217,138,.5);background:rgba(255,217,138,.07)}
  .wm-srow.win{border-color:#4bdd7a;background:rgba(75,221,122,.1)}
  .wm-sfaces{display:flex;align-items:center;gap:5px;margin-bottom:5px}
  .wm-sfaces img{width:22px;height:22px;border-radius:50%;object-fit:cover;border:1.5px solid #ffd98a;background:#1a1030}
  .wm-sfaces .nm{font-size:11px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .wm-sfaces .tag{margin-left:auto;font-family:'Chakra Petch';font-size:8.5px;font-weight:700;letter-spacing:.5px}
  .wm-sfaces .tag.ok{color:var(--gold)}.wm-sfaces .tag.win{color:#6bec98}.wm-sfaces .tag.no{color:var(--dim)}
  .wm-pips{display:flex;gap:5px}
  .wm-pip{flex:1;height:8px;border-radius:4px;background:#2a1840;border:1px solid #43285a}
  .wm-pip.on{background:linear-gradient(90deg,var(--amber),var(--gold));border-color:var(--gold);box-shadow:0 0 6px rgba(255,180,60,.6)}
  .wm-pip.teal.on{background:linear-gradient(90deg,#1f9e92,var(--teal));border-color:var(--teal);box-shadow:0 0 6px rgba(55,214,198,.6)}
  .wm-pip.green.on{background:linear-gradient(90deg,#2b9e57,#4bdd7a);border-color:#4bdd7a;box-shadow:0 0 6px rgba(75,221,122,.6)}

  /* ── RESULTS ── */
  .wm-res{padding:16px 18px 8px}
  .wm-stamp{text-align:center;font-family:'Bungee Inline';font-size:clamp(20px,4.6vw,34px);color:var(--gold);letter-spacing:1px;margin:6px 0 14px;text-shadow:0 0 24px rgba(255,180,60,.6)}
  .wm-fin{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:12px;margin:7px 0;border:1px solid rgba(255,255,255,.14);background:var(--panel)}
  .wm-fin .faces{display:flex}.wm-fin .faces img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #ffd98a;background:#1a1030;margin-left:-8px}.wm-fin .faces img:first-child{margin-left:0}
  .wm-fin.win{border-color:var(--gold);box-shadow:0 0 22px rgba(255,217,138,.28);background:linear-gradient(90deg,rgba(255,217,138,.14),var(--panel))}
  .wm-fin .pl{font-family:'Bungee Inline';font-size:15px;color:var(--dim);width:26px;text-align:center}.wm-fin.win .pl{color:var(--gold)}
  .wm-fin .nm{flex:1;font-weight:700;font-size:13.5px}
  .wm-fin .imm{font-family:'Chakra Petch';font-size:10px;font-weight:700;color:#2a1200;background:var(--gold);padding:3px 9px;border-radius:20px;letter-spacing:1px}
  .wm-fin .st{font-family:'Chakra Petch';font-size:11px;color:var(--dim)}
  .wm-close{font-family:'Chakra Petch';font-size:12.5px;color:var(--dim);text-align:center;margin-top:14px;font-style:italic;line-height:1.55}

  /* ── STICKY CONTROLS ── */
  .wm-ctrl{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:40;display:flex;gap:10px;align-items:center;background:#22103a;border:2px solid var(--amber);border-radius:30px;padding:7px 14px;box-shadow:0 6px 18px rgba(0,0,0,.6)}
  .wm-btn{background:linear-gradient(180deg,var(--amber),#c8842a);color:#2a1200;border:none;font-weight:700;font-family:'Fredoka';padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;letter-spacing:.5px}
  .wm-btn.ghost{background:transparent;color:var(--gold);border:1px solid rgba(255,217,138,.6)}
  .wm-cnt{font-family:'Chakra Petch';font-size:12px;color:var(--dim);min-width:56px;text-align:center}
  .wm-done{display:none;text-align:center;font-size:12px;color:#6bec98;margin-top:10px;font-family:'Chakra Petch'}
  @media(prefers-reduced-motion:reduce){.wm-spin,.wm-gondola,.wm-bulb,.wm-lamp,.wm-card,.wm-card::after,.wm-star,.wm-search-cone,.wm-stamp,.wm-topper .pennant,.wm-bg *,.wm-ghostwheel,.wm-ball,.wm-confetti,.wm-mote,.wm-gball,.wm-rollball,.wm-searchlight,.wm-spot,.wm-mazegrid,.wm-glow{animation:none!important}}
  </style>`;
}

function _shell(inner, phaseCls, bg) { return `${_css()}<div class="wm-wrap ${phaseCls || ''}">${bg || ''}<div class="wm-inner">${inner}</div></div>`; }

const _CONFETTI = ['#ffb43c', '#ff5347', '#37d6c6', '#ff5aa8', '#ffd98a', '#8bff5a'];
// rich animated backdrop per phase — persistent motion behind the reveal stream
function _phaseBg(phase) {
  const rnd = (a, b) => (a + Math.random() * (b - a));
  if (phase === 1) {
    const spokes = Array.from({ length: 8 }).map((_, i) => `<span class="s" style="transform:translate(-50%,0) rotate(${i * 45}deg)"></span>`).join('');
    const balls = Array.from({ length: 6 }).map((_, i) =>
      `<i class="wm-ball" style="top:${rnd(8, 78).toFixed(0)}%;animation-duration:${rnd(5, 9).toFixed(1)}s;animation-delay:${(-rnd(0, 8)).toFixed(1)}s"></i>`).join('');
    const conf = Array.from({ length: 10 }).map(() =>
      `<i class="wm-confetti" style="left:${rnd(2, 98).toFixed(0)}%;background:${_CONFETTI[Math.floor(Math.random() * _CONFETTI.length)]};animation-duration:${rnd(4, 8).toFixed(1)}s;animation-delay:${(-rnd(0, 6)).toFixed(1)}s"></i>`).join('');
    return `<div class="wm-bg">
      <div class="wm-ghostwheel"><span class="r"></span><span class="r i"></span>${spokes}</div>
      <div class="wm-spot wm-spot1"></div><div class="wm-spot wm-spot2"></div>
      ${balls}${conf}<div class="wm-glow"></div></div>`;
  }
  if (phase === 2) {
    const gballs = Array.from({ length: 7 }).map(() =>
      `<i class="wm-gball" style="left:${rnd(6, 92).toFixed(0)}%;top:${rnd(58, 90).toFixed(0)}%;animation-delay:${(-rnd(0, 2.4)).toFixed(1)}s"></i>`).join('');
    const motes = Array.from({ length: 16 }).map(() =>
      `<i class="wm-mote" style="left:${rnd(2, 98).toFixed(0)}%;animation-duration:${rnd(7, 14).toFixed(1)}s;animation-delay:${(-rnd(0, 10)).toFixed(1)}s"></i>`).join('');
    return `<div class="wm-bg"><div class="wm-searchlight"></div>${gballs}${motes}<div class="wm-glow"></div></div>`;
  }
  // phase 3
  const rolls = `<i class="wm-rollball"></i><i class="wm-rollball" style="animation-duration:11s;animation-delay:-4s"></i>`;
  const conf = Array.from({ length: 8 }).map(() =>
    `<i class="wm-confetti" style="left:${rnd(2, 98).toFixed(0)}%;background:${['#ffd98a', '#8bff5a', '#37d6c6'][Math.floor(Math.random() * 3)]};animation-duration:${rnd(5, 9).toFixed(1)}s;animation-delay:${(-rnd(0, 6)).toFixed(1)}s"></i>`).join('');
  return `<div class="wm-bg"><div class="wm-mazegrid"></div>${rolls}${conf}<div class="wm-glow"></div></div>`;
}

const AMBIENT = [
  '· · · the wheel groans around and the bulbs flicker in the dark · · ·',
  '· · · "DING!" — another helmet target lights up · · ·',
  '· · · somewhere a calliope wheezes out a crooked tune · · ·',
  '· · · the eliminated crowd hoots from behind the rail · · ·',
  '· · · a ball skitters off into the sawdust and nobody chases it · · ·',
];

// ── reveal-stream (per-phase suffix) ──
function _stream(suffix, intro, steps, sideSnaps, sideBuild) {
  if (!window._wmSide) window._wmSide = {};
  window._wmSide[suffix] = sideSnaps;
  const total = steps.length || 1;
  const stepHtml = (steps.length ? steps : ['']).map((s, i) => `<div id="wm-${suffix}-step-${i}" style="display:${i === 0 ? '' : 'none'}">${s}</div>`).join('');
  const main = `${intro}${stepHtml}
    <div class="wm-done" id="wm-${suffix}-done">— that's the phase —</div>
    <div class="wm-ctrl" id="wm-${suffix}-ctrl">
      <button class="wm-btn" onclick="wheelRevealNext('${suffix}',${total})">Reveal ▸</button>
      <span class="wm-cnt" id="wm-${suffix}-cnt">1 / ${total}</span>
      <button class="wm-btn ghost" onclick="wheelRevealAll('${suffix}',${total})">Skip ⤏</button>
    </div>`;
  const side = `<aside class="wm-side"><div id="wm-${suffix}-side-inner">${sideSnaps[0] || ''}</div></aside>`;
  if (window._tvState && window._tvState[`wm_${suffix}`]) window._tvState[`wm_${suffix}`].idx = 0;
  return `<div class="wm-grid"><div>${main}</div>${side}</div>`;
}

function _beatCard(b) {
  const avs = (b.players || []).map(n => av(n, 22)).join('');
  return `<div class="wm-card ${b.badgeClass}"><div class="row">${avs}<span class="wm-b ${b.badgeClass}">${esc(b.badge)}</span></div><div class="txt">${esc(b.text)}</div></div>`;
}

// ══ SIDEBARS (progressive, from per-beat board snapshots) ══
function _sideP1(roster, board) {
  const rows = (board || roster.map(r => ({ id: r.id, rider: r.rider, grounder: r.grounder, hits: 0, freed: false }))).map(q => {
    const pips = [0, 1, 2].map(i => `<span class="wm-pip ${i < q.hits ? 'on' : ''}"></span>`).join('');
    const tag = q.freed ? '<span class="tag ok">FREED ✓</span>' : `<span class="tag no">${q.hits}/3</span>`;
    return `<div class="wm-srow ${q.freed ? 'done' : ''}"><div class="wm-sfaces">${av(q.rider, 22)}${av(q.grounder, 22)}<span class="nm">${esc(q.rider)}</span>${tag}</div><div class="wm-pips">${pips}</div></div>`;
  }).join('');
  return `<div class="wm-sh">THE WHEEL</div><div class="wm-sgoal">three hits frees your partner</div>${rows}`;
}
function _sideP2(roster, board) {
  const rows = (board || roster.map(r => ({ id: r.id, rider: r.rider, grounder: r.grounder, balls: 0, done: false }))).map(q => {
    const pips = [0, 1, 2].map(i => `<span class="wm-pip teal ${i < q.balls ? 'on' : ''}"></span>`).join('');
    const tag = q.done ? '<span class="tag ok">TO MAZE ✓</span>' : `<span class="tag no">${q.balls}/3</span>`;
    return `<div class="wm-srow ${q.done ? 'done' : ''}"><div class="wm-sfaces">${av(q.grounder, 22)}${av(q.rider, 22)}<span class="nm">${esc(q.grounder)}</span>${tag}</div><div class="wm-pips">${pips}</div></div>`;
  }).join('');
  return `<div class="wm-sh">THE SEARCH</div><div class="wm-sgoal">blindfolded — find three balls</div>${rows}`;
}
function _sideP3(roster, board) {
  const rows = (board || roster.map(r => ({ id: r.id, members: [r.rider, r.grounder], sunk: 0, done: false, won: false }))).map(q => {
    const pips = [0, 1, 2].map(i => `<span class="wm-pip green ${i < q.sunk ? 'on' : ''}"></span>`).join('');
    const tag = q.won ? '<span class="tag win">IMMUNE ✓</span>' : q.done ? '<span class="tag no">done</span>' : `<span class="tag no">${q.sunk}/3</span>`;
    return `<div class="wm-srow ${q.won ? 'win' : q.done ? 'done' : ''}"><div class="wm-sfaces">${av(q.members[0], 22)}${av(q.members[1], 22)}<span class="nm">${esc(q.members[0])} & ${esc(q.members[1])}</span>${tag}</div><div class="wm-pips">${pips}</div></div>`;
  }).join('');
  return `<div class="wm-sh">THE MAZE</div><div class="wm-sgoal">sink three — winner pair BOTH safe</div>${rows}`;
}

// ══════════════════════════════════════════════════════════════════════
export function rpBuildWheelTitleCard(ep) {
  const d = ep.wheelOfMisfortune; if (!d) return '';
  const bulbs = Array.from({ length: 7 }).map(() => '<i class="wm-bulb"></i>').join('');
  const stars = [[10, 12], [26, 7], [70, 10, 1], [86, 18], [48, 5, 1.6], [60, 22, .8]].map(s =>
    `<div class="wm-star" style="left:${s[0]}%;top:${s[1]}%${s[2] ? `;animation-delay:${s[2]}s` : ''}"></div>`).join('');
  // Ferris wheel — EVERY player gets a gondola (riders + grounders + spectator),
  // one spoke per gondola, a ring of lamps, an A-frame support, hub and top pennant.
  const allNames = d.roster.flatMap(r => [r.rider, r.grounder]).concat(d.spectator ? [d.spectator] : []);
  const N = Math.max(allNames.length, 4);
  const R = 43;                              // rim radius as % of the 340px wheel
  const spokes = allNames.map((_, i) => `<div class="wm-spoke" style="transform:translate(-50%,0) rotate(${(i * 360 / N) + 90}deg)"></div>`).join('');
  const lampCount = Math.max(18, N * 2);
  const lamps = Array.from({ length: lampCount }).map((_, i) => {
    const ang = (i * (360 / lampCount) - 90) * Math.PI / 180;
    const x = 50 + Math.cos(ang) * (R + 3.5), y = 50 + Math.sin(ang) * (R + 3.5);
    return `<div class="wm-lamp" style="left:${x}%;top:${y}%;animation-delay:${(i * 0.08).toFixed(2)}s"></div>`;
  }).join('');
  const gondolas = allNames.map((n, i) => {
    const ang = (i * (360 / N) - 90) * Math.PI / 180;   // start at top, go clockwise
    const x = 50 + Math.cos(ang) * R, y = 50 + Math.sin(ang) * R;
    return `<div class="wm-gondola" style="left:${x}%;top:${y}%"><span class="hang"></span><span class="roof"></span><div class="cab">${av(n, 30)}</div></div>`;
  }).join('');
  // fixed A-frame + base drawn in a 420x440 SVG; apex meets the hub at (210,170)
  const frame = `<svg class="wm-frame" viewBox="0 0 420 440" preserveAspectRatio="xMidYMid meet">
    <line class="legdk" x1="300" y1="418" x2="210" y2="184"/>
    <line class="legdk" x1="252" y1="418" x2="210" y2="184"/>
    <line class="leg" x1="120" y1="418" x2="210" y2="184"/>
    <line class="leg" x1="168" y1="418" x2="210" y2="184"/>
    <line class="brace" x1="150" y1="330" x2="270" y2="330"/>
    <line class="brace" x1="163" y1="290" x2="257" y2="290"/>
    <line class="base" x1="96" y1="420" x2="324" y2="420"/>
    <rect class="foot" x="104" y="416" width="30" height="12" rx="3"/>
    <rect class="foot" x="286" y="416" width="30" height="12" rx="3"/>
  </svg>`;
  const topper = `<div class="wm-topper"><span class="star"></span><span class="mast"></span><span class="pennant"></span></div>`;
  const pairs = d.roster.map(r => `
    <div class="wm-pair">
      <div class="parch">${esc(r.arch.replace('_', ' vs '))}</div>
      <div class="wm-prow">${av(r.rider, 34)}<span class="nm">${esc(r.rider)}</span><span class="wm-role rider">WHEEL · THROW</span></div>
      <div class="wm-vs">— tied to —</div>
      <div class="wm-prow">${av(r.grounder, 34)}<span class="nm">${esc(r.grounder)}</span><span class="wm-role grounder">GROUND · DODGE</span></div>
    </div>`).join('');
  const specNote = d.spectator ? `<div class="wm-note">${esc(d.spectator)} draws the odd number and sits this one out — safe to watch, no immunity to win.</div>` : '';
  const inner = `
    <div class="wm-hero">
      <div class="wm-sky">${stars}</div>
      <div class="wm-heroin">
        <div class="wm-kick">Carnival of Chaos · Post-Merge · Pair Immunity</div>
        <div class="wm-bulbs">${bulbs}</div>
        <div class="wm-big">WHEEL OF MISFORTUNE</div>
        <div class="wm-sub">Ride the Ferris wheel and pelt the enemy targets — <b>three hits frees your partner</b>. Then blindfold, hunt three balls on your partner's shouted directions, and tilt a maze until three balls drop home. First pair to finish — <b>both of you</b> — wins immunity.</div>
      </div>
      <div class="wm-ferris">
        ${frame}
        <div class="wm-spin">${spokes}<div class="wm-rim"></div><div class="wm-rim inner"></div>${lamps}${gondolas}</div>
        <div class="wm-hub"></div>
        ${topper}
      </div>
      <div class="wm-host">🎡 ${esc(d.hostOpen)}</div>
    </div>
    <div class="wm-roster"><h3>The Pairings</h3><div class="wm-note">One partner rides the wheel and throws (better aim); the other stays grounded to dodge, then hunt blindfolded. Both tilt the maze together at the end.</div>${specNote}<div class="wm-pgrid">${pairs}</div></div>`;
  return _shell(inner);
}

export function rpBuildWheelPhase1(ep) {
  const d = ep.wheelOfMisfortune; if (!d) return '';
  const beats = d.phase1.beats || [];
  const intro = `<div class="wm-h2">PHASE 1 · FERRIS WHEEL DODGEBALL</div><div class="wm-amb">— riders up top, targets below, three hits to spring your partner —</div>`;
  const steps = [], sideSnaps = [];
  beats.forEach((b, i) => {
    let html = _beatCard(b);
    if (i > 0 && i % 4 === 0) html = `<div class="wm-amb">${AMBIENT[(i / 4) % AMBIENT.length | 0]}</div>` + html;
    steps.push(html);
    sideSnaps.push(_sideP1(d.roster, b.board));
  });
  if (!steps.length) { steps.push(`<div class="wm-amb">the wheel spins in silence</div>`); sideSnaps.push(_sideP1(d.roster, null)); }
  return _shell(_stream('phase1', intro, steps, sideSnaps), 'wm-phase1', _phaseBg(1));
}

export function rpBuildWheelPhase2(ep) {
  const d = ep.wheelOfMisfortune; if (!d) return '';
  const beats = d.phase2.beats || [];
  const intro = `<div class="wm-h2">PHASE 2 · BLINDFOLD SEARCH</div><div class="wm-search-cone"></div><div class="wm-amb">— blind hands, a shouting partner, and thieves in the dark —</div>`;
  const steps = [], sideSnaps = [];
  beats.forEach((b, i) => {
    let html = _beatCard(b);
    if (i > 0 && i % 4 === 0) html = `<div class="wm-amb">${AMBIENT[(i / 4) % AMBIENT.length | 0]}</div>` + html;
    steps.push(html);
    sideSnaps.push(_sideP2(d.roster, b.board));
  });
  if (!steps.length) { steps.push(`<div class="wm-amb">everyone gropes in the dark</div>`); sideSnaps.push(_sideP2(d.roster, null)); }
  return _shell(_stream('phase2', intro, steps, sideSnaps), 'wm-phase2', _phaseBg(2));
}

export function rpBuildWheelPhase3(ep) {
  const d = ep.wheelOfMisfortune; if (!d) return '';
  const beats = d.phase3.beats || [];
  const intro = `<div class="wm-h2">PHASE 3 · TILT-MAZE PUZZLE</div><div class="wm-amb">— two hands on the board, three balls, one immunity for the pair —</div>`;
  const steps = [], sideSnaps = [];
  beats.forEach((b, i) => {
    let html = _beatCard(b);
    if (i > 0 && i % 4 === 0) html = `<div class="wm-amb">${AMBIENT[(i / 4) % AMBIENT.length | 0]}</div>` + html;
    steps.push(html);
    sideSnaps.push(_sideP3(d.roster, b.board));
  });
  if (!steps.length) { steps.push(`<div class="wm-amb">the boards tilt and tilt</div>`); sideSnaps.push(_sideP3(d.roster, null)); }
  return _shell(_stream('phase3', intro, steps, sideSnaps), 'wm-phase3', _phaseBg(3));
}

export function rpBuildWheelResults(ep) {
  const d = ep.wheelOfMisfortune; if (!d) return '';
  const win = d.immunePair || [];
  const fins = (d.results || []).map((r, i) => {
    const isWin = r.won;
    const thrown = r.threwFor ? ` · threw it for ${esc(r.threwFor)}` : '';
    const st = isWin ? 'both immune' : `${r.ballsSunk}/3 sunk · to tribal${thrown}`;
    return `<div class="wm-fin ${isWin ? 'win' : ''}"><span class="pl">${i + 1}</span><div class="faces">${av(r.members[0], 34)}${av(r.members[1], 34)}</div><span class="nm">${esc(r.members[0])} & ${esc(r.members[1])}</span>${isWin ? '<span class="imm">IMMUNE</span>' : ''}<span class="st">${st}</span></div>`;
  }).join('');
  const specFin = d.spectator ? `<div class="wm-fin"><span class="pl">—</span><div class="faces">${av(d.spectator, 34)}</div><span class="nm">${esc(d.spectator)}</span><span class="st">sat out · to tribal</span></div>` : '';
  const inner = `<div class="wm-res">
    <div class="wm-h2">THE WHEEL STOPS</div>
    <div class="wm-stamp">${esc(win[0] || '')} &amp; ${esc(win[1] || '')} WIN IMMUNITY</div>
    ${fins}${specFin}
    <div class="wm-close">🎡 ${esc(d.hostClose)}</div>
  </div>`;
  return _shell(inner);
}

// ── reveal handlers (DOM-only, per-phase suffix) ──
function _setSide(suffix, idx) {
  const snaps = (window._wmSide || {})[suffix]; if (!snaps) return;
  const el = document.getElementById(`wm-${suffix}-side-inner`);
  if (el) el.innerHTML = snaps[Math.min(idx, snaps.length - 1)] || '';
}
export function wheelRevealNext(suffix, total) {
  if (!window._tvState) window._tvState = {};
  const key = `wm_${suffix}`;
  if (!window._tvState[key]) window._tvState[key] = { idx: 0 };
  const s = window._tvState[key];
  if (s.idx >= total - 1) return;
  s.idx++;
  const el = document.getElementById(`wm-${suffix}-step-${s.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`wm-${suffix}-cnt`); if (cnt) cnt.textContent = `${s.idx + 1} / ${total}`;
  try { _setSide(suffix, s.idx); } catch (e) {}
  if (s.idx >= total - 1) {
    const c = document.getElementById(`wm-${suffix}-ctrl`); if (c) c.style.display = 'none';
    const dn = document.getElementById(`wm-${suffix}-done`); if (dn) dn.style.display = '';
  }
}
export function wheelRevealAll(suffix, total) {
  if (!window._tvState) window._tvState = {};
  const key = `wm_${suffix}`;
  if (!window._tvState[key]) window._tvState[key] = { idx: 0 };
  const s = window._tvState[key];
  for (let i = s.idx + 1; i < total; i++) { const el = document.getElementById(`wm-${suffix}-step-${i}`); if (el) el.style.display = ''; }
  s.idx = total - 1;
  const cnt = document.getElementById(`wm-${suffix}-cnt`); if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`wm-${suffix}-ctrl`); if (c) c.style.display = 'none';
  const dn = document.getElementById(`wm-${suffix}-done`); if (dn) dn.style.display = '';
  try { _setSide(suffix, s.idx); } catch (e) {}
}
