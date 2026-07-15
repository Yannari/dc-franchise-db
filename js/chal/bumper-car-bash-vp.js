// ══════════════════════════════════════════════════════════════════════
// bumper-car-bash-vp.js — VP screens for "Bumper Car Bash".
// Carnival-of-chaos neon tent (bcb- prefix): a rainbow-burst cold open with
// avatar-faced bumper cars that drive in and RAM each other, then a toned-down
// game screen so the point-by-point log stays readable. Cards react on reveal
// with an impact shake + rainbow-light flash scaled to the hit (ambush hits
// slam hardest). Live "RACE TO 20" sidebar: climbing leaderboard + neon rink
// map. DOM-only reveals + precomputed sidebar snapshots.
// ══════════════════════════════════════════════════════════════════════
import { players } from '../core.js';

function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function av(name, size = 24) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #fff;background:#241436" onerror="this.style.visibility='hidden'">`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

const HUES = ['#2de2ff', '#ff2d95', '#ffd83a', '#7dff4d', '#b06bff', '#ff8c2d'];
const CARCLS = ['cA', 'cH', 'cL', 'cJ'];

// ── shared CSS (ported from the approved mockup) ──
function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Righteous&family=Chakra+Petch:wght@400;500;600;700&display=swap');
  .bcb-wrap{--blue:#2de2ff;--pink:#ff2d95;--yellow:#ffd83a;--lime:#7dff4d;--purple:#b06bff;--orange:#ff8c2d;
    --txt:#fff4ff;--dim:#c3aee0;--panel:rgba(18,9,32,.82);
    max-width:1100px;margin:0 auto;font-family:'Chakra Petch',system-ui,sans-serif;color:var(--txt);
    position:relative;overflow:visible;min-height:520px;border-radius:10px;
    background:
      radial-gradient(90% 42% at 50% 0%,rgba(120,50,150,.4),transparent 58%),
      radial-gradient(circle at 14% 22%,rgba(255,45,149,.16),transparent 12%),
      radial-gradient(circle at 86% 30%,rgba(45,226,255,.14),transparent 12%),
      radial-gradient(circle at 22% 74%,rgba(255,216,58,.12),transparent 12%),
      radial-gradient(circle at 78% 82%,rgba(125,255,77,.11),transparent 12%),
      linear-gradient(180deg,#1d0d33,#12061f 42%,#0d0518)}
  .bcb-wrap *{box-sizing:border-box}
  .bcb-inner{padding:14px 0 130px;position:relative;z-index:3}

  .bcb-tent{position:absolute;top:0;left:0;right:0;height:26px;z-index:2;pointer-events:none;
    background:repeating-linear-gradient(90deg,#ff2d95 0 34px,#fff4ff 34px 68px);opacity:.92;
    -webkit-mask:linear-gradient(#000,#000) top/100% 12px no-repeat,radial-gradient(15px 17px at 17px 0,#000 68%,transparent 70%) 0 12px/34px 18px repeat-x;
            mask:linear-gradient(#000,#000) top/100% 12px no-repeat,radial-gradient(15px 17px at 17px 0,#000 68%,transparent 70%) 0 12px/34px 18px repeat-x}

  .bcb-bulbs2{display:flex;justify-content:center;gap:11px;margin:0 0 10px}
  .bcb-bulbs2 i{width:7px;height:7px;border-radius:50%;background:var(--yellow);box-shadow:0 0 8px var(--yellow);animation:bcbBulb 1.5s infinite}
  .bcb-bulbs2 i:nth-child(3n){background:var(--pink);box-shadow:0 0 8px var(--pink)}
  .bcb-bulbs2 i:nth-child(3n+1){background:var(--blue);box-shadow:0 0 8px var(--blue)}
  .bcb-bulbs2 i:nth-child(2n){animation-delay:.5s}
  @keyframes bcbBulb{0%,100%{opacity:1}50%{opacity:.25}}

  /* HERO — rainbow burst lives here only */
  .bcb-hero{position:relative;overflow:hidden;padding:20px 0 16px}
  .bcb-hero>*{position:relative;z-index:3}
  .bcb-hero::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
    background:radial-gradient(120% 82% at 50% 30%,transparent 38%,rgba(11,5,24,.5) 74%,rgba(11,5,24,.9))}
  .bcb-herofade{position:absolute!important;left:0;right:0;bottom:0;height:120px;z-index:2!important;pointer-events:none;
    background:linear-gradient(180deg,transparent,#0d0518)}
  .bcb-burst-bg{position:absolute!important;inset:0;z-index:0!important;overflow:hidden}
  .bcb-rays{position:absolute;left:50%;top:26%;width:1700px;height:1700px;transform:translate(-50%,-50%);
    background:conic-gradient(from 0deg,#ff2d95,#ff8c2d,#ffd83a,#7dff4d,#2de2ff,#b06bff,#ff2d95,#ff8c2d,#ffd83a,#7dff4d,#2de2ff,#b06bff,#ff2d95);
    -webkit-mask:repeating-conic-gradient(from 0deg,#000 0 5deg,transparent 5deg 10deg);mask:repeating-conic-gradient(from 0deg,#000 0 5deg,transparent 5deg 10deg);
    opacity:.9;animation:bcbSpin 40s linear infinite;filter:saturate(1.3)}
  .bcb-rays.b2{animation:bcbSpin 60s linear infinite reverse;opacity:.5;-webkit-mask:repeating-conic-gradient(from 4deg,#000 0 3deg,transparent 3deg 12deg);mask:repeating-conic-gradient(from 4deg,#000 0 3deg,transparent 3deg 12deg)}
  @keyframes bcbSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}
  .bcb-glow{position:absolute;left:50%;top:26%;width:460px;height:460px;transform:translate(-50%,-50%);border-radius:50%;
    background:radial-gradient(circle,rgba(255,255,255,.9),rgba(255,216,58,.5) 30%,transparent 66%);filter:blur(6px);animation:bcbPulse 3.2s ease-in-out infinite}
  @keyframes bcbPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.9}50%{transform:translate(-50%,-50%) scale(1.08);opacity:1}}

  .bcb-kick{font-family:'Righteous';letter-spacing:5px;font-size:11px;color:#fff;text-transform:uppercase;text-align:center;text-shadow:0 1px 0 #000,0 0 10px #b06bff}
  .bcb-big{font-family:'Bungee';font-size:clamp(32px,7vw,62px);line-height:1;letter-spacing:1px;margin:8px 0 2px;color:#fff;text-align:center;
    text-shadow:3px 3px 0 #ff2d95,6px 6px 0 #b06bff,0 0 4px #000,0 0 30px rgba(45,226,255,.7)}
  .bcb-sub{font-family:'Chakra Petch';font-weight:600;font-size:13px;color:#fff;max-width:600px;margin:6px auto 0;line-height:1.5;text-align:center;text-shadow:0 1px 3px #000}
  .bcb-sub b{color:var(--yellow)}

  /* animated arena stage */
  .bcb-stage{position:relative;height:250px;max-width:760px;margin:12px auto 2px;border-radius:16px;overflow:hidden;border:2px solid rgba(255,255,255,.25);
    background:radial-gradient(200px 90px at 50% 96%,rgba(45,226,255,.22),transparent 70%),
      repeating-linear-gradient(90deg,transparent 0 39px,rgba(255,255,255,.07) 39px 40px),
      repeating-linear-gradient(0deg,transparent 0 39px,rgba(255,255,255,.05) 39px 40px),
      linear-gradient(180deg,rgba(12,5,28,.55),rgba(8,4,18,.8));box-shadow:inset 0 0 40px rgba(0,0,0,.5)}
  .bcb-rink{position:absolute;left:5%;right:5%;top:14%;bottom:10%;border:2px dashed rgba(255,216,58,.4);border-radius:50%/42%}
  .car{position:absolute;width:104px;text-align:center;z-index:4}
  .car .pole{position:absolute;left:50%;top:-30px;width:3px;height:26px;background:linear-gradient(#cfd,#889);transform:translateX(-50%)}
  .car .spark{position:absolute;left:50%;top:-40px;transform:translateX(-50%);font-size:15px;animation:bcbSpk 1.2s infinite}
  @keyframes bcbSpk{0%,100%{opacity:.55;transform:translateX(-50%) scale(.85) rotate(-10deg)}50%{opacity:1;transform:translateX(-50%) scale(1.2) rotate(10deg)}}
  .car .face{position:relative;z-index:3;width:46px;height:46px;border-radius:50%;object-fit:cover;border:3px solid #fff;background:#241436;box-shadow:0 3px 8px rgba(0,0,0,.5);margin-bottom:-14px}
  .car .hull{position:relative;height:38px;border-radius:26px;border:5px solid;box-shadow:0 6px 12px rgba(0,0,0,.45),inset 0 -6px 10px rgba(0,0,0,.35)}
  .car .hull::after{content:"";position:absolute;left:12%;right:12%;top:6px;height:8px;border-radius:8px;background:rgba(255,255,255,.35)}
  .car .nm{font-family:'Righteous';font-size:12px;margin-top:5px;color:#fff;text-shadow:0 1px 3px #000;letter-spacing:.5px}
  .car.cA{left:8%;top:26%;animation:driveA 5s ease-in-out infinite}
  .car.cH{right:8%;top:26%;animation:driveH 5s ease-in-out infinite}
  .car.cL{left:14%;bottom:6%;animation:driveL 5s ease-in-out infinite}
  .car.cJ{right:14%;bottom:6%;animation:driveJ 5s ease-in-out infinite}
  @keyframes driveA{0%,100%{transform:translate(0,0) rotate(-4deg)}40%{transform:translate(210px,42px) rotate(6deg)}47%{transform:translate(232px,48px) rotate(9deg)}52%{transform:translate(150px,30px) rotate(-14deg)}}
  @keyframes driveH{0%,100%{transform:translate(0,0) rotate(4deg)}40%{transform:translate(-210px,42px) rotate(-6deg)}47%{transform:translate(-232px,48px) rotate(-9deg)}52%{transform:translate(-150px,30px) rotate(14deg)}}
  @keyframes driveL{0%,100%{transform:translate(0,0) rotate(3deg)}55%{transform:translate(190px,-40px) rotate(-8deg)}62%{transform:translate(206px,-48px) rotate(-12deg)}68%{transform:translate(120px,-24px) rotate(12deg)}}
  @keyframes driveJ{0%,100%{transform:translate(0,0) rotate(-3deg)}55%{transform:translate(-190px,-40px) rotate(8deg)}62%{transform:translate(-206px,-48px) rotate(12deg)}68%{transform:translate(-120px,-24px) rotate(-12deg)}}
  .bcb-crash{position:absolute;font-size:42px;pointer-events:none;z-index:5;opacity:0;filter:drop-shadow(0 0 10px #ffd83a)}
  .bcb-crash.c1{left:50%;top:34%;transform:translate(-50%,-50%);animation:crashA 5s ease-in-out infinite}
  .bcb-crash.c2{left:50%;bottom:12%;transform:translate(-50%,50%);animation:crashB 5s ease-in-out infinite}
  @keyframes crashA{0%,42%,60%,100%{opacity:0;transform:translate(-50%,-50%) scale(.4)}47%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}54%{opacity:.6;transform:translate(-50%,-50%) scale(.9)}}
  @keyframes crashB{0%,57%,75%,100%{opacity:0;transform:translate(-50%,50%) scale(.4)}62%{opacity:1;transform:translate(-50%,50%) scale(1.25)}69%{opacity:.6;transform:translate(-50%,50%) scale(.9)}}

  .bcb-host{margin:14px auto 0;display:block;width:fit-content;font-family:'Chakra Petch';font-size:12.5px;color:#fff;
    border:1px solid rgba(255,216,58,.55);border-radius:10px;padding:9px 15px;background:rgba(34,12,48,.7);max-width:680px;line-height:1.55;box-shadow:0 0 18px rgba(255,45,149,.2)}
  .bcb-host b{color:var(--yellow)}

  /* roster */
  .bcb-roster{padding:14px 18px 6px}
  .bcb-roster h3{font-family:'Bungee';font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fff;text-align:center;margin:0 0 10px;text-shadow:0 0 10px var(--pink)}
  .bcb-rgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
  .bcb-drv{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:var(--panel);box-shadow:0 4px 14px rgba(0,0,0,.4)}
  .bcb-drv .nm{flex:1;font-weight:700;font-size:13.5px}
  .bcb-drv .arc{font-size:10px;color:var(--dim);letter-spacing:.5px}
  .bcb-tag{font-family:'Chakra Petch';font-size:9.5px;font-weight:700;letter-spacing:.5px;padding:3px 9px;border-radius:20px;border:1px solid;white-space:nowrap;color:#301;border-color:var(--lime);background:var(--lime)}

  /* arena log */
  .bcb-grid{display:grid;grid-template-columns:1fr 300px;gap:16px;padding:8px 18px 16px}
  @media(max-width:820px){.bcb-grid{grid-template-columns:1fr}}
  .bcb-h2{font-family:'Bungee';font-size:24px;letter-spacing:1px;color:#fff;text-align:center;margin:2px 0 10px;text-shadow:2px 2px 0 var(--pink),0 0 16px var(--blue)}
  .bcb-amb{font-family:'Righteous';font-size:11px;color:var(--yellow);opacity:.85;text-align:center;padding:5px 0;letter-spacing:1px;font-style:italic;text-shadow:0 1px 3px #000}

  .bcb-card{border:1px solid rgba(255,255,255,.12);border-left:4px solid var(--purple);border-radius:10px;padding:10px 12px;margin:9px 0;background:var(--panel);box-shadow:0 4px 14px rgba(0,0,0,.4)}
  .bcb-card .row{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
  .bcb-card .row img{width:22px;height:22px;border-radius:50%;object-fit:cover;border:1.5px solid #fff;background:#241436}
  .bcb-b{font-family:'Chakra Petch';font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border-radius:5px;border:1px solid}
  .bcb-pts{margin-left:auto;font-family:'Bungee';font-size:13px;letter-spacing:.5px}
  .bcb-card .txt{font-size:13px;line-height:1.5;color:#eae2ff}
  .bcb-card .txt b{color:#fff}
  /* per-kind colors + reveal impact (animation restarts when display flips from none) */
  .bcb-card.rear{border-left-color:var(--blue);animation:bcbHit .4s both}
  .bcb-card.tbone{border-left-color:var(--pink);box-shadow:0 0 16px rgba(255,45,149,.2);animation:bcbSlamP .5s both}
  .bcb-card.ambush{border-left-color:var(--yellow);box-shadow:0 0 20px rgba(255,216,58,.28);animation:bcbSlamG .55s both}
  .bcb-card.deny{border-left-color:#ff3b3b;box-shadow:0 0 20px rgba(255,59,59,.3);animation:bcbSlamR .55s both}
  .bcb-card.null{border-left-color:var(--dim);animation:bcbBounce .5s both}
  .bcb-card.social{border-left-style:dashed;border-left-color:var(--pink);background:linear-gradient(180deg,rgba(42,12,40,.82),rgba(13,6,24,.86));animation:bcbRise .4s both}
  .bcb-card.help{border-left-color:var(--lime);animation:bcbRise .4s both}
  .bcb-card.spark{border-left-color:var(--pink);background:linear-gradient(180deg,rgba(48,14,44,.82),rgba(13,6,24,.86));animation:bcbRise .4s both}
  .bcb-card.trouble{border-left-color:var(--orange);animation:bcbRise .4s both}
  .bcb-b.rear{background:rgba(45,226,255,.16);color:var(--blue);border-color:#2de2ff66}
  .bcb-b.tbone{background:rgba(255,45,149,.18);color:var(--pink);border-color:#ff2d9566}
  .bcb-b.ambush{background:rgba(255,216,58,.18);color:var(--yellow);border-color:#ffd83a66}
  .bcb-b.null{background:rgba(195,174,224,.16);color:var(--dim);border-color:#c3aee066}
  .bcb-b.deny{background:rgba(255,59,59,.2);color:#ff6b6b;border-color:#ff3b3b88}
  .bcb-b.social{background:rgba(255,45,149,.14);color:var(--pink);border-color:#ff2d9555}
  .bcb-b.help{background:rgba(125,255,77,.14);color:var(--lime);border-color:#7dff4d66}
  .bcb-b.spark{background:rgba(255,45,149,.14);color:var(--pink);border-color:#ff2d9555}
  .bcb-b.trouble{background:rgba(255,140,45,.16);color:var(--orange);border-color:#ff8c2d66}
  .bcb-pts.rear{color:var(--blue)}.bcb-pts.tbone{color:var(--pink)}.bcb-pts.ambush{color:var(--yellow)}.bcb-pts.null,.bcb-pts.social,.bcb-pts.help,.bcb-pts.trouble{color:var(--dim)}.bcb-pts.deny{color:#ff6b6b}
  @keyframes bcbRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes bcbHit{0%{opacity:0;transform:translateX(10px)}60%{transform:translateX(-3px)}100%{opacity:1;transform:none}}
  @keyframes bcbSlamP{0%{opacity:0;transform:scale(.94) translateX(14px)}45%{transform:scale(1.015) translateX(-6px)}70%{transform:translateX(4px)}100%{opacity:1;transform:none}}
  @keyframes bcbSlamG{0%{opacity:0;transform:scale(.9) rotate(-1deg)}40%{transform:scale(1.03) rotate(1deg);box-shadow:0 0 40px rgba(255,216,58,.6)}70%{transform:scale(.99) rotate(-.5deg)}100%{opacity:1;transform:none}}
  @keyframes bcbSlamR{0%{opacity:0;transform:scale(.92) translateX(-16px)}45%{transform:scale(1.02) translateX(7px);box-shadow:0 0 40px rgba(255,59,59,.6)}100%{opacity:1;transform:none}}
  @keyframes bcbBounce{0%{opacity:0;transform:scale(1.06)}40%{transform:scale(.97)}70%{transform:scale(1.01)}100%{opacity:1;transform:none}}
  .bcb-winbeat{border:2px solid var(--yellow)!important;box-shadow:0 0 30px rgba(255,216,58,.4)!important}

  /* sidebar: RACE TO 20 */
  .bcb-side{position:sticky;top:12px;align-self:start;border:1px solid rgba(255,255,255,.16);border-radius:14px;overflow:hidden;
    background:linear-gradient(180deg,rgba(28,12,48,.94),rgba(12,6,24,.94));box-shadow:0 6px 20px rgba(0,0,0,.5);max-height:calc(100vh - 40px);overflow-y:auto}
  .bcb-sh{font-family:'Bungee';letter-spacing:1px;font-size:18px;color:var(--yellow);text-align:center;padding:11px 8px 5px;background:linear-gradient(180deg,rgba(255,216,58,.18),transparent);text-shadow:0 0 12px rgba(255,216,58,.6)}
  .bcb-goal{text-align:center;font-family:'Chakra Petch';font-size:10px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:8px}
  .bcb-lb{padding:2px 12px 10px}
  .bcb-lrow{margin:8px 0}
  .bcb-lhead{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:4px}
  .bcb-lhead img{width:22px;height:22px;border-radius:50%;object-fit:cover;border:1.5px solid #fff;background:#241436}
  .bcb-lhead .nm{flex:1;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .bcb-lhead .pt{font-family:'Bungee';font-size:14px;color:var(--yellow)}
  .bcb-lhead .pt small{font-size:9px;color:var(--dim)}
  .bcb-lhead .stl{font-size:8.5px;font-weight:700;color:var(--orange);letter-spacing:1px}
  .bcb-track{height:11px;border-radius:7px;background:#1a1030;border:1px solid #33224d;overflow:hidden;position:relative}
  .bcb-fill{height:100%;border-radius:7px;transition:width .5s}
  .bcb-finish{position:absolute;right:0;top:-2px;bottom:-2px;width:3px;background:repeating-linear-gradient(#fff 0 3px,#000 3px 6px)}
  .bcb-map{position:relative;height:150px;margin:4px 12px 12px;border:1px solid rgba(255,255,255,.14);border-radius:12px;overflow:hidden;
    background:radial-gradient(120px 60px at 50% 55%,rgba(255,216,58,.1),transparent 70%),
      repeating-linear-gradient(90deg,transparent 0 23px,rgba(45,226,255,.1) 23px 24px),
      repeating-linear-gradient(0deg,transparent 0 23px,rgba(255,45,149,.08) 23px 24px),#100826}
  .bcb-map .rim{position:absolute;inset:6px;border:2px solid #ffd83a55;border-radius:50%/40%;box-shadow:inset 0 0 20px rgba(255,216,58,.15)}
  .bcb-mcar{position:absolute;width:24px;height:24px;border-radius:50%;border:2.5px solid;overflow:hidden;transition:left .6s,top .6s;box-shadow:0 2px 6px rgba(0,0,0,.5);transform:translate(-50%,-50%)}
  .bcb-mcar img{width:100%;height:100%;object-fit:cover}
  .bcb-mcar.hit{animation:bcbShake .5s infinite;z-index:3}
  @keyframes bcbShake{0%,100%{margin:0}25%{margin:-2px 0 0 -3px}75%{margin:2px 0 0 3px}}
  .bcb-mburst{position:absolute;font-size:20px;animation:bcbSpk 1s infinite;pointer-events:none;transform:translate(-50%,-50%)}

  /* results */
  .bcb-res{padding:16px 18px 8px}
  .bcb-stamp{text-align:center;font-family:'Bungee';font-size:clamp(22px,5vw,38px);color:var(--yellow);letter-spacing:1px;margin:6px 0 14px;
    text-shadow:3px 3px 0 var(--pink),0 0 26px rgba(255,216,58,.6);animation:bcbPulse2 2.4s ease-in-out infinite}
  @keyframes bcbPulse2{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
  .bcb-fin{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:12px;margin:7px 0;border:1px solid rgba(255,255,255,.14);background:var(--panel)}
  .bcb-fin img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #fff;background:#241436}
  .bcb-fin.win{border-color:var(--yellow);box-shadow:0 0 22px rgba(255,216,58,.28);background:linear-gradient(90deg,rgba(255,216,58,.14),var(--panel))}
  .bcb-fin .pl{font-family:'Bungee';font-size:15px;color:var(--dim);width:28px;text-align:center}
  .bcb-fin.win .pl{color:var(--yellow)}
  .bcb-fin .nm{flex:1;font-weight:700;font-size:14px}
  .bcb-fin .tot{font-family:'Bungee';font-size:18px;color:var(--yellow)}
  .bcb-fin .tot small{font-size:10px;color:var(--dim)}
  .bcb-fin .imm{font-family:'Chakra Petch';font-size:10px;font-weight:700;color:#301;background:var(--yellow);padding:3px 9px;border-radius:20px;letter-spacing:1px}
  .bcb-close{font-family:'Chakra Petch';font-size:12.5px;color:var(--dim);text-align:center;margin-top:14px;font-style:italic;line-height:1.55}

  /* reveal controls */
  .bcb-ctrl{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:40;display:flex;gap:10px;align-items:center;
    background:#1a0b30;border:2px solid var(--pink);border-radius:30px;padding:7px 14px;box-shadow:0 6px 18px rgba(0,0,0,.6)}
  .bcb-btn{background:linear-gradient(180deg,#2de2ff,#0a90b0);color:#04121a;border:none;font-weight:700;font-family:'Righteous';padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;letter-spacing:.5px}
  .bcb-btn.ghost{background:transparent;color:#ff9cd0;border:1px solid rgba(255,45,149,.6)}
  .bcb-cnt{font-family:'Chakra Petch';font-size:12px;color:var(--dim);min-width:56px;text-align:center}
  .bcb-done{display:none;text-align:center;font-size:12px;color:var(--lime);margin-top:10px;font-family:'Chakra Petch'}
  @media(prefers-reduced-motion:reduce){.car,.bcb-crash,.bcb-rays,.bcb-glow,.bcb-bulbs2 i,.bcb-card,.bcb-mcar,.bcb-stamp{animation:none!important}}
  </style>`;
}

function _shell(inner) {
  return `${_css()}<div class="bcb-wrap"><div class="bcb-tent"></div><div class="bcb-inner">${inner}</div></div>`;
}

// reveal-stream: steps + precomputed sidebar snapshots (DOM-only reveal)
function _stream(suffix, intro, steps, sideSnaps) {
  if (!window._bcbSide) window._bcbSide = {};
  window._bcbSide[suffix] = sideSnaps;
  const total = steps.length;
  const stepHtml = steps.map((s, i) => `<div id="bcb-step-${suffix}-${i}" style="display:${i === 0 ? '' : 'none'}">${s.html}</div>`).join('');
  const main = `${intro}${stepHtml}
    <div class="bcb-done" id="bcb-done-${suffix}">— all revealed —</div>
    <div class="bcb-ctrl" id="bcb-ctrl-${suffix}">
      <button class="bcb-btn" onclick="bashRevealNext('bcb-${suffix}',${total})">Reveal ▸</button>
      <span class="bcb-cnt" id="bcb-cnt-${suffix}">1 / ${total}</span>
      <button class="bcb-btn ghost" onclick="bashRevealAll('bcb-${suffix}',${total})">Skip ⤏</button>
    </div>`;
  const side = sideSnaps.length ? `<aside class="bcb-side"><div id="bcb-side-inner-${suffix}">${sideSnaps[0] || ''}</div></aside>` : '';
  if (window._tvState && window._tvState['bcb-' + suffix]) window._tvState['bcb-' + suffix].idx = 0;
  return side ? `<div class="bcb-grid"><div>${main}</div>${side}</div>` : main;
}

function _card(beat) {
  const cls = beat.badgeClass || 'social';
  const avs = (beat.players || []).map(n => av(n, 22)).join('');
  let pts = '';
  if (beat.pts > 0 && beat.scorer) pts = `<span class="bcb-pts ${cls}">+${beat.pts} → ${esc(beat.scorer)}</span>`;
  else if (beat.kind === 'null') pts = `<span class="bcb-pts null">0 — bounce</span>`;
  else if (beat.kind === 'miss' && !beat.scorer) pts = `<span class="bcb-pts null">miss</span>`;
  const winCls = beat.winning ? ' bcb-winbeat' : '';
  return `<div class="bcb-card ${cls}${winCls}"><div class="row">${avs}<span class="bcb-b ${cls}">${esc(beat.badge)}</span>${pts}</div><div class="txt">${beat.text}</div></div>`;
}

// ── sidebar: RACE TO 20 (leaderboard + rink map) ──
function _sideArena(d, standings, hitPair) {
  const target = d.target || 20;
  const rows = standings.map((r, i) => {
    const hue = HUES[i % HUES.length];
    const pct = Math.max(3, Math.round((r.points / target) * 100));
    const stl = r.stalled ? `<span class="stl">STALL</span>` : '';
    return `<div class="bcb-lrow">
      <div class="bcb-lhead">${av(r.name, 22)}<span class="nm">${esc(r.name)}</span>${stl}<span class="pt">${r.points}<small>/${target}</small></span></div>
      <div class="bcb-track"><div class="bcb-fill" style="width:${pct}%;background:linear-gradient(90deg,${hue}66,${hue})"></div><div class="bcb-finish"></div></div>
    </div>`;
  }).join('');
  // rink map: cars arranged around the ellipse, leaders drift toward center
  const n = standings.length;
  const cars = standings.map((r, i) => {
    const ang = (i / Math.max(1, n)) * Math.PI * 2 + 0.4;
    const rad = 0.62 - (r.points / target) * 0.34;            // more points → closer to center
    const cx = 50 + Math.cos(ang) * rad * 40;
    const cy = 50 + Math.sin(ang) * rad * 36;
    const hit = hitPair && hitPair.includes(r.name);
    const hue = HUES[i % HUES.length];
    return `<div class="bcb-mcar ${hit ? 'hit' : ''}" style="left:${cx.toFixed(1)}%;top:${cy.toFixed(1)}%;border-color:${hue}">${av(r.name, 20)}</div>`;
  }).join('');
  let burst = '';
  if (hitPair && hitPair.length >= 2) {
    const idxs = hitPair.map(h => standings.findIndex(r => r.name === h)).filter(x => x >= 0);
    if (idxs.length >= 2) {
      const pos = idxs.map(i => { const ang = (i / Math.max(1, n)) * Math.PI * 2 + 0.4; const rad = 0.62 - (standings[i].points / target) * 0.34; return { x: 50 + Math.cos(ang) * rad * 40, y: 50 + Math.sin(ang) * rad * 36 }; });
      const mx = (pos[0].x + pos[1].x) / 2, my = (pos[0].y + pos[1].y) / 2;
      burst = `<div class="bcb-mburst" style="left:${mx.toFixed(1)}%;top:${my.toFixed(1)}%">💥</div>`;
    }
  }
  return `<div class="bcb-sh">RACE TO ${target}</div><div class="bcb-goal">first to ${target} · immunity</div>
    <div class="bcb-lb">${rows}</div>
    <div class="bcb-map"><div class="rim"></div>${cars}${burst}</div>`;
}

// ── ambient carnival flavor (VP-only interludes) ──
const AMBIENT = [
  '· · · the calliope kicks into a manic waltz as the sparks rain down · · ·',
  '· · · "OHHH!" goes the crowd — somebody just got sent into the boards · · ·',
  '· · · the neon ceiling grid flickers pink, then blue, then blinding white · · ·',
  '· · · rubber and ozone; a haze of tire smoke drifts over the rink · · ·',
  '· · · the scoreboard klaxon blares every time a number ticks up · · ·',
  '· · · somewhere a barker is selling popcorn nobody has time to buy · · ·',
];

// ══════════════════════════════════════════════════════════════════════
export function rpBuildBashTitleCard(ep) {
  const d = ep.bumperCarBash; if (!d) return '';
  const featured = d.results.slice(0, 4).map(r => r.name);
  const cars = featured.map((n, i) => `
    <div class="car ${CARCLS[i]}"><span class="spark">✦</span><span class="pole"></span>
      <img class="face" src="assets/avatars/${slugOf(n)}.png" alt="${esc(n)}" onerror="this.style.visibility='hidden'">
      <div class="hull" style="background:linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.6));border-color:${HUES[i % HUES.length]}"></div>
      <div class="nm">${esc(n)}</div></div>`).join('');
  const roster = d.roster.map(r => `<div class="bcb-drv">${av(r.name, 38)}<div><div class="nm">${esc(r.name)}</div><div class="arc">${esc(r.arch)}</div></div>${r.allies && r.allies.length ? `<span class="bcb-tag">+ ${esc(r.allies[0])}</span>` : ''}</div>`).join('');
  const inner = `
    <div class="bcb-hero">
      <div class="bcb-burst-bg"><div class="bcb-rays"></div><div class="bcb-rays b2"></div><div class="bcb-glow"></div></div>
      <div class="bcb-herofade"></div>
      <div class="bcb-kick">Carnival of Chaos · Post-Merge · Immunity</div>
      <div class="bcb-big">BUMPER CAR BASH</div>
      <div class="bcb-sub">First driver to <b>${d.target} points</b> takes immunity. Rear&nbsp;=&nbsp;1 · T-bone&nbsp;=&nbsp;2 · head-on ambush&nbsp;=&nbsp;3.</div>
      <div class="bcb-stage"><div class="bcb-rink"></div><div class="bcb-crash c1">💥</div><div class="bcb-crash c2">💥</div>${cars}</div>
      <div class="bcb-host">🎪 ${esc(d.hostOpen)}</div>
    </div>
    <div class="bcb-roster"><h3>On the Grid</h3><div class="bcb-rgrid">${roster}</div></div>`;
  return _shell(inner);
}

export function rpBuildBashArena(ep) {
  const d = ep.bumperCarBash; if (!d) return '';
  const steps = [], sideSnaps = [];
  const intro = `<div class="bcb-h2">THE ARENA</div>
    <div class="bcb-bulbs2"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="bcb-amb">— tires screech on the polished rink floor —</div>`;
  d.beats.forEach((b, i) => {
    let html = _card(b);
    if (i > 0 && i % 4 === 0) html = `<div class="bcb-amb">${AMBIENT[(i / 4) % AMBIENT.length | 0]}</div>` + html;
    steps.push({ html });
    const hitPair = (b.players && b.players.length >= 2) ? b.players.slice(0, 2) : null;
    sideSnaps.push(_sideArena(d, b.standings || d.results.map(r => ({ name: r.name, points: r.points })), hitPair));
  });
  return _shell(_stream('arena', intro, steps, sideSnaps));
}

export function rpBuildBashResults(ep) {
  const d = ep.bumperCarBash; if (!d) return '';
  const target = d.target || 20;
  const fins = d.results.map((r, i) => `<div class="bcb-fin ${i === 0 ? 'win' : ''}">
    <span class="pl">${i + 1}</span>${av(r.name, 34)}<span class="nm">${esc(r.name)}</span>
    ${i === 0 ? '<span class="imm">IMMUNE</span>' : ''}<span class="tot">${r.points}<small>pts</small></span></div>`).join('');
  const inner = `<div class="bcb-res">
    <div class="bcb-h2">FINAL SCORE</div>
    <div class="bcb-stamp">${esc(d.immunityWinner)} WINS IMMUNITY</div>
    ${fins}
    <div class="bcb-close">🎪 ${esc(d.hostClose)}</div>
  </div>`;
  return _shell(inner);
}

// ── reveal handlers (DOM-only) ──
function _setSide(suffix, idx) {
  const snaps = (window._bcbSide || {})[suffix]; if (!snaps) return;
  const el = document.getElementById(`bcb-side-inner-${suffix}`);
  if (el) el.innerHTML = snaps[Math.min(idx, snaps.length - 1)] || '';
}
export function bashRevealNext(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: 0 };
  const s = window._tvState[screenKey];
  const suffix = screenKey.replace('bcb-', '');
  if (s.idx >= total - 1) return;
  s.idx++;
  const el = document.getElementById(`bcb-step-${suffix}-${s.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`bcb-cnt-${suffix}`); if (cnt) cnt.textContent = `${s.idx + 1} / ${total}`;
  try { _setSide(suffix, s.idx); } catch (e) {}
  if (s.idx >= total - 1) {
    const c = document.getElementById(`bcb-ctrl-${suffix}`); if (c) c.style.display = 'none';
    const dn = document.getElementById(`bcb-done-${suffix}`); if (dn) dn.style.display = '';
  }
}
export function bashRevealAll(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: 0 };
  const s = window._tvState[screenKey];
  const suffix = screenKey.replace('bcb-', '');
  for (let i = s.idx + 1; i < total; i++) { const el = document.getElementById(`bcb-step-${suffix}-${i}`); if (el) el.style.display = ''; }
  s.idx = total - 1;
  const cnt = document.getElementById(`bcb-cnt-${suffix}`); if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`bcb-ctrl-${suffix}`); if (c) c.style.display = 'none';
  const dn = document.getElementById(`bcb-done-${suffix}`); if (dn) dn.style.display = '';
  try { _setSide(suffix, s.idx); } catch (e) {}
}
