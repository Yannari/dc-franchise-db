// ══════════════════════════════════════════════════════════════════════
// say-cheese-vp.js — VP screens for "Say Cheese".
// Dawn carnival drop-tower (sc- prefix): purple-to-peach sunrise sky, a rising
// sun behind the tower, avatar-faced jumpers on bungee cords at three heights,
// camera-flash pops. Toned, readable drop-log below. LIVE, STICKY sidebar —
// "THE TOWER" — with jumpers climbing/positioned by height, per-jumper FEAR
// METERS, best-selfie badges and phone-break warnings, all rebuilt on every
// reveal from per-beat board snapshots. DOM-only reveals.
// ══════════════════════════════════════════════════════════════════════
import { players } from '../core.js';

function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function av(name, size = 24) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #fff;background:#241436" onerror="this.style.visibility='hidden'">`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

const HLABEL = ['BOTTOM', 'HALFWAY', 'TOP'];
const HTAG = ['bot', 'half', 'top'];
const SELCHIP = { perfect: ['ok', '📷 PERFECT'], blurry: ['no', '📷 TOO BLURRY'], fear: ['no', '📷 FEAR-FACE'] };
const BESTLABEL = { perfect: 'FEARLESS ✓', blurry: 'BLURRY', fear: 'FEAR-FACE', froze: 'FROZE', none: '—' };
const BESTCAP = { perfect: 'FEARLESS ✓', blurry: 'BLURRY', fear: 'FEAR-FACE', froze: 'FROZE' };

function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Righteous&family=Chakra+Petch:wght@400;500;600;700&display=swap');
  .sc-wrap{--pink:#ff5aa8;--cyan:#3fd7ff;--yellow:#ffd36b;--lime:#8bff5a;--red:#ff4d5e;--orange:#ff9243;--txt:#fff2fb;--dim:#c8aed8;--panel:rgba(26,14,40,.82);
    max-width:1100px;margin:0 auto;font-family:'Chakra Petch',system-ui,sans-serif;color:var(--txt);position:relative;overflow:visible;min-height:520px;border-radius:10px;
    background:linear-gradient(180deg,#1a0f30,#2a1a4a 30%,#140a24)}
  .sc-wrap *{box-sizing:border-box}
  .sc-inner{padding:0 0 130px;position:relative;z-index:3}

  .sc-hero{position:relative;overflow:hidden;padding:0 0 14px;border-radius:10px 10px 0 0}
  .sc-sky{position:absolute;inset:0;z-index:0;background:linear-gradient(180deg,#241452 0%,#5a2470 34%,#b8507e 62%,#f0a86a 88%,#ffd0a0 100%)}
  .sc-sun{position:absolute;left:50%;bottom:6%;width:180px;height:180px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,225,150,.95),rgba(255,180,120,.5) 45%,transparent 70%);filter:blur(2px);animation:scPulse 5s ease-in-out infinite}
  @keyframes scPulse{0%,100%{opacity:.85;transform:translateX(-50%) scale(1)}50%{opacity:1;transform:translateX(-50%) scale(1.05)}}
  .sc-star{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;opacity:.7;animation:scTwinkle 3s infinite}
  @keyframes scTwinkle{0%,100%{opacity:.2}50%{opacity:.9}}
  .sc-cloud{position:absolute;height:22px;border-radius:20px;background:rgba(255,200,220,.25);filter:blur(3px)}
  .sc-heroin{position:relative;z-index:2;text-align:center;padding:22px 18px 0}
  .sc-kick{font-family:'Righteous';letter-spacing:4px;font-size:11px;color:#ffe0c0;text-transform:uppercase;text-shadow:0 1px 4px #000}
  .sc-bulbs{display:flex;justify-content:center;gap:9px;margin:10px 0 4px}
  .sc-bulb{width:8px;height:8px;border-radius:50%;background:var(--pink);box-shadow:0 0 9px var(--pink);animation:scBulb 1.2s infinite}
  .sc-bulb:nth-child(3n){background:var(--yellow);box-shadow:0 0 9px var(--yellow)}.sc-bulb:nth-child(3n+1){background:var(--cyan);box-shadow:0 0 9px var(--cyan)}
  @keyframes scBulb{0%,100%{opacity:1}50%{opacity:.25}}
  .sc-big{font-family:'Bungee';font-size:clamp(34px,7.4vw,64px);line-height:1;letter-spacing:1px;margin:6px 0 2px;color:#fff;text-shadow:3px 3px 0 var(--pink),6px 6px 0 #7a2a6a,0 0 26px rgba(255,90,168,.6)}
  .sc-sub{font-family:'Chakra Petch';font-weight:600;font-size:13px;color:#fff;max-width:600px;margin:6px auto 0;line-height:1.5;text-shadow:0 1px 4px #000}
  .sc-sub b{color:var(--yellow)}
  .sc-stage{position:relative;z-index:2;height:280px;max-width:720px;margin:14px auto 4px}
  .sc-jumper{position:absolute;width:96px;text-align:center;animation:scBob 3s ease-in-out infinite}
  .sc-jumper .cord{position:absolute;left:50%;top:-70px;width:2px;height:70px;background:linear-gradient(#ff5aa8,#3fd7ff);transform:translateX(-50%)}
  .sc-jumper .who{display:inline-block;position:relative}
  .sc-jumper .face{width:46px;height:46px;border-radius:50%;object-fit:cover;border:3px solid #fff;background:#241436;box-shadow:0 4px 10px rgba(0,0,0,.5)}
  .sc-jumper .phone{position:absolute;right:-16px;top:6px;width:13px;height:20px;border-radius:3px;background:#111;border:1.5px solid #ffd36b;box-shadow:0 0 8px rgba(255,211,107,.7)}
  .sc-jumper .phone::after{content:"";position:absolute;inset:2px;border-radius:1px;background:radial-gradient(circle at 50% 30%,#fff,#3fd7ff)}
  .sc-jumper .nm{font-family:'Righteous';font-size:12px;margin-top:5px;color:#fff;text-shadow:0 1px 4px #000;letter-spacing:.5px}
  .sc-jumper .tg{font-family:'Chakra Petch';font-size:8.5px;font-weight:700;letter-spacing:.5px;padding:1px 6px;border-radius:10px;display:inline-block;margin-top:2px}
  @keyframes scBob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(14px) rotate(3deg)}}
  .sc-platform{position:absolute;left:36%;width:28%;height:8px;border-radius:3px;background:linear-gradient(90deg,#3a2450,#7a3a6a);box-shadow:0 2px 6px rgba(0,0,0,.5)}
  .sc-flash{position:absolute;font-size:20px;animation:scFlash 2.4s infinite;pointer-events:none}
  @keyframes scFlash{0%,80%,100%{opacity:0;transform:scale(.5)}88%{opacity:1;transform:scale(1.3)}}
  .tg.top{color:#301;background:var(--red)}.tg.half{color:#201;background:var(--orange)}.tg.bot{color:#012;background:var(--cyan)}

  .sc-host{position:relative;z-index:2;margin:8px auto 0;display:block;width:fit-content;font-family:'Chakra Petch';font-size:12.5px;color:#fff;border:1px solid rgba(255,211,107,.6);border-radius:10px;padding:9px 15px;background:rgba(40,16,52,.72);max-width:680px;line-height:1.55;box-shadow:0 0 18px rgba(255,90,168,.25)}
  .sc-host b{color:var(--yellow)}
  .sc-roster{padding:14px 18px 6px}
  .sc-roster h3{font-family:'Bungee';font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fff;text-align:center;margin:0 0 6px;text-shadow:0 0 10px var(--pink)}
  .sc-note{font-family:'Chakra Petch';font-size:11px;color:var(--dim);text-align:center;max-width:560px;margin:0 auto 12px;line-height:1.5}
  .sc-rgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}
  .sc-drv{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:var(--panel)}
  .sc-drv img{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #fff;background:#241436;flex-shrink:0}
  .sc-drv .nm{flex:1;font-weight:700;font-size:13.5px}.sc-drv .arc{font-size:10px;color:var(--dim)}
  .sc-h{font-family:'Chakra Petch';font-size:9.5px;font-weight:700;letter-spacing:.5px;padding:3px 9px;border-radius:20px;border:1px solid;white-space:nowrap}
  .sc-h.top{color:#301;background:var(--red);border-color:var(--red)}.sc-h.half{color:#201;background:var(--orange);border-color:var(--orange)}.sc-h.bot{color:#012;background:var(--cyan);border-color:var(--cyan)}

  .sc-grid{display:grid;grid-template-columns:1fr 300px;gap:16px;padding:12px 18px}
  @media(max-width:820px){.sc-grid{grid-template-columns:1fr}}
  .sc-h2{font-family:'Bungee';font-size:24px;letter-spacing:1px;color:#fff;text-align:center;margin:2px 0 6px;text-shadow:2px 2px 0 var(--pink),0 0 16px var(--cyan)}
  .sc-amb{font-family:'Righteous';font-size:11px;color:var(--yellow);opacity:.85;text-align:center;padding:5px 0;letter-spacing:1px;font-style:italic;text-shadow:0 1px 3px #000}
  .sc-card{border:1px solid rgba(255,255,255,.12);border-left:4px solid #7a3a6a;border-radius:10px;padding:10px 12px;margin:9px 0;background:var(--panel);box-shadow:0 4px 14px rgba(0,0,0,.4)}
  .sc-card .row{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
  .sc-card .row img{width:22px;height:22px;border-radius:50%;object-fit:cover;border:1.5px solid #fff;background:#241436}
  .sc-b{font-family:'Chakra Petch';font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border-radius:5px;border:1px solid}
  .sc-card .txt{font-size:13px;line-height:1.5;color:#f0e2ef}.sc-card .txt b{color:#fff}
  .sc-card.jump{border-left-color:var(--cyan);animation:scDrop .5s both}
  .sc-card.fear{border-left-color:var(--orange);animation:scShiver .5s both}
  .sc-card.sabo{border-left-color:var(--red);box-shadow:0 0 18px rgba(255,77,94,.2);animation:scHit .5s both}
  .sc-card.perfect{border-left-color:var(--yellow);box-shadow:0 0 20px rgba(255,211,107,.28);animation:scPop .55s both}
  .sc-card.fail{border-left-color:var(--dim)}
  .sc-card.climb{border-left-style:dotted;border-left-color:#9ec5ff;background:linear-gradient(180deg,rgba(20,24,54,.72),rgba(12,8,26,.86));animation:scLift .5s both}
  .sc-card.social{border-left-style:dashed;border-left-color:var(--pink);background:linear-gradient(180deg,rgba(46,14,44,.82),rgba(16,8,26,.86))}
  .sc-card.warn{border-left-color:var(--red);background:linear-gradient(180deg,rgba(60,10,20,.5),rgba(20,8,20,.86))}
  .sc-b.jump{background:rgba(63,215,255,.15);color:var(--cyan);border-color:#3fd7ff66}
  .sc-b.fear{background:rgba(255,146,67,.16);color:var(--orange);border-color:#ff924366}
  .sc-b.sabo{background:rgba(255,77,94,.18);color:var(--red);border-color:#ff4d5e88}
  .sc-b.perfect{background:rgba(255,211,107,.18);color:var(--yellow);border-color:#ffd36b88}
  .sc-b.fail{background:rgba(200,174,216,.14);color:var(--dim);border-color:#c8aed855}
  .sc-b.social{background:rgba(255,90,168,.14);color:var(--pink);border-color:#ff5aa866}
  .sc-b.warn{background:rgba(255,77,94,.2);color:#ff8090;border-color:#ff4d5e}
  .sc-b.climb{background:rgba(158,197,255,.14);color:#9ec5ff;border-color:#9ec5ff55}
  .sc-selfie{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:700;padding:2px 7px;border-radius:5px;letter-spacing:.5px;margin-left:auto}
  .sc-selfie.ok{background:var(--yellow);color:#301}.sc-selfie.no{background:rgba(200,174,216,.2);color:var(--dim);border:1px solid #c8aed855}
  @keyframes scDrop{0%{opacity:0;transform:translateY(-12px)}70%{transform:translateY(3px)}100%{opacity:1;transform:none}}
  @keyframes scShiver{0%{opacity:0}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}100%{opacity:1;transform:none}}
  @keyframes scHit{0%{opacity:0;transform:scale(.95) translateX(-10px)}50%{transform:scale(1.02) translateX(5px)}100%{opacity:1;transform:none}}
  @keyframes scPop{0%{opacity:0;transform:scale(.9)}45%{transform:scale(1.03);box-shadow:0 0 40px rgba(255,211,107,.6)}100%{opacity:1;transform:none}}
  @keyframes scLift{0%{opacity:0;transform:translateY(14px)}100%{opacity:1;transform:none}}
  @media(prefers-reduced-motion:reduce){.sc-card.climb{animation:none}}

  .sc-side{position:sticky;top:12px;align-self:start;border:1px solid rgba(255,255,255,.16);border-radius:14px;overflow:hidden;background:linear-gradient(180deg,rgba(30,16,50,.95),rgba(14,8,26,.95));box-shadow:0 6px 20px rgba(0,0,0,.5);max-height:calc(100vh - 40px);overflow-y:auto}
  .sc-sh{font-family:'Bungee';letter-spacing:1px;font-size:16px;color:var(--yellow);text-align:center;padding:10px 8px 4px;background:linear-gradient(180deg,rgba(255,211,107,.16),transparent);text-shadow:0 0 12px rgba(255,211,107,.6)}
  .sc-sgoal{text-align:center;font-size:9.5px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:8px}
  .sc-mtower{position:relative;height:170px;margin:2px 12px 8px;border:1px solid rgba(255,255,255,.12);border-radius:10px;overflow:hidden;background:linear-gradient(180deg,#241452,#5a2470 55%,#b8507e)}
  .sc-level{position:absolute;left:0;right:0;height:1px;background:rgba(255,255,255,.18)}
  .sc-level .lb{position:absolute;left:6px;top:-8px;font-size:8px;color:#fff;font-family:'Chakra Petch';letter-spacing:1px;opacity:.8}
  .sc-mj{position:absolute;width:20px;height:20px;border-radius:50%;border:2px solid #fff;overflow:hidden;transition:top .6s,left .6s;box-shadow:0 2px 6px rgba(0,0,0,.5)}
  .sc-mj img{width:100%;height:100%;object-fit:cover}
  .sc-mj.won{border-color:var(--yellow);box-shadow:0 0 10px var(--yellow)}
  .sc-mj.dq{filter:grayscale(1);opacity:.5}
  .sc-mj .cord{position:absolute;left:50%;top:-40px;width:1.5px;height:40px;background:linear-gradient(#ff5aa8,transparent);transform:translateX(-50%)}
  .sc-fm{padding:2px 12px 12px}
  .sc-fmrow{margin:8px 0}
  .sc-fmhead{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:3px}
  .sc-fmhead img{width:20px;height:20px;border-radius:50%;object-fit:cover;border:1.5px solid #fff;background:#241436}
  .sc-fmhead .nm{flex:1;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sc-fmhead .best{font-family:'Chakra Petch';font-size:9px;font-weight:700}
  .sc-fmhead .best.ok{color:var(--yellow)}.sc-fmhead .best.no{color:var(--dim)}.sc-fmhead .best.dq{color:var(--red)}
  .sc-fmbar{height:10px;border-radius:6px;background:#2a1840;border:1px solid #43285a;overflow:hidden}
  .sc-fmfill{height:100%;border-radius:6px;background:linear-gradient(90deg,#8bff5a,#ffd36b 55%,#ff4d5e);transition:width .5s}
  .sc-warn{margin:4px 12px 12px;font-size:10px;color:#ff8090;text-align:center;font-family:'Chakra Petch';letter-spacing:.5px;border:1px dashed #ff4d5e55;border-radius:8px;padding:5px}

  .sc-res{padding:16px 18px 8px}
  .sc-stamp{text-align:center;font-family:'Bungee';font-size:clamp(22px,5vw,38px);color:var(--yellow);letter-spacing:1px;margin:6px 0 14px;text-shadow:3px 3px 0 var(--pink),0 0 26px rgba(255,211,107,.6);animation:scPulse2 2.4s ease-in-out infinite}
  @keyframes scPulse2{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
  .sc-gallery{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:6px 0 14px}
  .sc-polaroid{width:130px;background:#f4eee6;border-radius:4px;padding:8px 8px 26px;transform:rotate(-3deg);box-shadow:0 8px 18px rgba(0,0,0,.5);position:relative}
  .sc-polaroid:nth-child(2n){transform:rotate(2deg)}
  .sc-polaroid img{width:100%;height:110px;object-fit:cover;border-radius:2px;background:#241436}
  .sc-polaroid.win{transform:rotate(0);box-shadow:0 8px 26px rgba(255,211,107,.5);outline:3px solid var(--yellow)}
  .sc-polaroid.fail img{filter:blur(1.4px) grayscale(.4)}
  .sc-cap{position:absolute;bottom:6px;left:0;right:0;text-align:center;font-family:'Righteous';font-size:11px;color:#301}.sc-cap.bad{color:#a33}
  .sc-fin{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:12px;margin:7px 0;border:1px solid rgba(255,255,255,.14);background:var(--panel)}
  .sc-fin img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #fff;background:#241436}
  .sc-fin.win{border-color:var(--yellow);box-shadow:0 0 22px rgba(255,211,107,.28);background:linear-gradient(90deg,rgba(255,211,107,.14),var(--panel))}
  .sc-fin .pl{font-family:'Bungee';font-size:15px;color:var(--dim);width:28px;text-align:center}.sc-fin.win .pl{color:var(--yellow)}
  .sc-fin .nm{flex:1;font-weight:700;font-size:14px}
  .sc-fin .imm{font-family:'Chakra Petch';font-size:10px;font-weight:700;color:#301;background:var(--yellow);padding:3px 9px;border-radius:20px;letter-spacing:1px}
  .sc-fin .st{font-family:'Chakra Petch';font-size:11px;color:var(--dim)}
  .sc-close{font-family:'Chakra Petch';font-size:12.5px;color:var(--dim);text-align:center;margin-top:14px;font-style:italic;line-height:1.55}

  .sc-ctrl{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:40;display:flex;gap:10px;align-items:center;background:#1e0f36;border:2px solid var(--pink);border-radius:30px;padding:7px 14px;box-shadow:0 6px 18px rgba(0,0,0,.6)}
  .sc-btn{background:linear-gradient(180deg,var(--cyan),#0a90b0);color:#04121a;border:none;font-weight:700;font-family:'Righteous';padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;letter-spacing:.5px}
  .sc-btn.ghost{background:transparent;color:#ff9cd0;border:1px solid rgba(255,90,168,.6)}
  .sc-cnt{font-family:'Chakra Petch';font-size:12px;color:var(--dim);min-width:56px;text-align:center}
  .sc-done{display:none;text-align:center;font-size:12px;color:var(--lime);margin-top:10px;font-family:'Chakra Petch'}
  @media(prefers-reduced-motion:reduce){.sc-jumper,.sc-sun,.sc-bulb,.sc-card,.sc-flash,.sc-star,.sc-mj,.sc-stamp{animation:none!important}}
  </style>`;
}

function _shell(inner) { return `${_css()}<div class="sc-wrap"><div class="sc-inner">${inner}</div></div>`; }

// reveal-stream with live sidebar snapshots
function _stream(intro, steps, sideSnaps) {
  if (!window._scSide) window._scSide = {};
  window._scSide.drop = sideSnaps;
  const total = steps.length;
  const stepHtml = steps.map((s, i) => `<div id="sc-step-${i}" style="display:${i === 0 ? '' : 'none'}">${s}</div>`).join('');
  const main = `${intro}${stepHtml}
    <div class="sc-done" id="sc-done">— that's a wrap —</div>
    <div class="sc-ctrl" id="sc-ctrl">
      <button class="sc-btn" onclick="cheeseRevealNext(${total})">Reveal ▸</button>
      <span class="sc-cnt" id="sc-cnt">1 / ${total}</span>
      <button class="sc-btn ghost" onclick="cheeseRevealAll(${total})">Skip ⤏</button>
    </div>`;
  const side = `<aside class="sc-side"><div id="sc-side-inner">${sideSnaps[0] || ''}</div></aside>`;
  if (window._tvState && window._tvState['sc']) window._tvState['sc'].idx = 0;
  return `<div class="sc-grid"><div>${main}</div>${side}</div>`;
}

// ── LIVE sidebar: the tower + fear meters + phone warnings ──
function _sideTower(d, board, warnings) {
  const lvY = [14, 46, 78];  // top, halfway, bottom
  const jumpers = board.map((b, i) => {
    const y = lvY[b.height];
    const x = 16 + (i % 3) * 30 + (Math.floor(i / 3) * 10);
    return `<div class="sc-mj ${b.won ? 'won' : ''} ${b.dq ? 'dq' : ''}" style="left:${x}%;top:${y}%"><span class="cord"></span>${av(b.name, 18)}</div>`;
  }).join('');
  const tower = `<div class="sc-mtower">
    <div class="sc-level" style="top:16%"><span class="lb">TOP</span></div>
    <div class="sc-level" style="top:48%"><span class="lb">HALFWAY</span></div>
    <div class="sc-level" style="top:80%"><span class="lb">BOTTOM</span></div>
    ${jumpers}</div>`;
  const rows = board.slice().sort((a, b) => (b.best === 'perfect') - (a.best === 'perfect') || a.fearPct - b.fearPct).map(b => {
    const bl = b.dq ? ['dq', 'OUT'] : b.best === 'perfect' ? ['ok', 'PERFECT ✓'] : b.best === 'none' ? ['no', '—'] : ['no', `best: ${BESTLABEL[b.best] || b.best}`];
    return `<div class="sc-fmrow"><div class="sc-fmhead">${av(b.name, 20)}<span class="nm">${esc(b.name)}</span><span class="best ${bl[0]}">${bl[1]}</span></div>
      <div class="sc-fmbar"><div class="sc-fmfill" style="width:${Math.round(b.fearPct)}%"></div></div></div>`;
  }).join('');
  const warnLine = warnings > 0 ? `<div class="sc-warn">⚠ ${warnings} phone warning${warnings > 1 ? 's' : ''} · next break = OUT</div>` : '';
  return `<div class="sc-sh">THE TOWER</div><div class="sc-sgoal">first perfect selfie wins</div>${tower}<div class="sc-fm">${rows}</div>${warnLine}`;
}

const AMBIENT = [
  '· · · the cords twang and the whole tower hums in the dawn wind · · ·',
  '· · · the sun climbs higher over the empty midway · · ·',
  '· · · "WHO screwed me?!" echoes up from the base of the tower · · ·',
  '· · · a camera flash pops, then a groan — another one rejected · · ·',
  '· · · far below, the safety mat looks very small and very far away · · ·',
];

// ══════════════════════════════════════════════════════════════════════
export function rpBuildCheeseTitleCard(ep) {
  const d = ep.sayCheese; if (!d) return '';
  const bulbs = Array.from({ length: 7 }).map(() => '<i class="sc-bulb"></i>').join('');
  const stars = [[12, 14], [28, 8], [64, 12, 1], [82, 20], [46, 6, 1.6]].map(s =>
    `<div class="sc-star" style="left:${s[0]}%;top:${s[1]}%${s[2] ? `;animation-delay:${s[2]}s` : ''}"></div>`).join('');
  // hero tower: up to 4 featured jumpers positioned by height
  const featured = d.roster.slice().sort((a, b) => b.height - a.height).slice(0, 4);
  const posY = [64, 36, 8]; const spreadX = ['6%', '44%', '78%', '26%'];
  const jumpers = featured.map((r, i) => {
    const tag = r.disadvantaged ? `<span class="tg top">TOP · DISADVANTAGE</span>` : `<span class="tg ${HTAG[r.height]}">${HLABEL[r.height]}</span>`;
    return `<div class="sc-jumper" style="left:${spreadX[i]};top:${posY[r.height]}%;animation-delay:${(i * 0.5).toFixed(1)}s"><span class="cord"></span><span class="who"><img class="face" src="assets/avatars/${slugOf(r.name)}.png" alt="${esc(r.name)}" onerror="this.style.visibility='hidden'"><span class="phone"></span></span><div class="nm">${esc(r.name)}</div>${tag}</div>`;
  }).join('');
  const platforms = [8, 36, 64].map(t => `<div class="sc-platform" style="top:${t}%"></div>`).join('');
  const roster = d.roster.map(r => `<div class="sc-drv">${av(r.name, 40)}<div><div class="nm">${esc(r.name)}</div><div class="arc">${esc(r.arch)}</div></div><span class="sc-h ${HTAG[r.height]}">${HLABEL[r.height]}</span></div>`).join('');
  const inner = `
    <div class="sc-hero">
      <div class="sc-sky">${stars}<div class="sc-cloud" style="left:8%;top:30%;width:120px"></div><div class="sc-cloud" style="right:10%;top:24%;width:90px"></div><div class="sc-sun"></div></div>
      <div class="sc-heroin">
        <div class="sc-kick">Carnival of Chaos · Post-Merge · Immunity</div>
        <div class="sc-bulbs">${bulbs}</div>
        <div class="sc-big">SAY CHEESE</div>
        <div class="sc-sub">Bungee off the drop tower and take a selfie with <b>zero fear on your face</b>. Platforms are drawn blind from a hat — draw high for more airtime to nail the shot, but it's a longer, scarier climb that's much harder to smile through. First perfect shot wins immunity — the rest face the jury.</div>
      </div>
      <div class="sc-stage">${platforms}${jumpers}<div class="sc-flash" style="left:50%;top:36%">📸</div><div class="sc-flash" style="left:12%;top:10%;animation-delay:1.2s">📸</div></div>
      <div class="sc-host">📸 ${esc(d.hostOpen)}</div>
    </div>
    <div class="sc-roster"><h3>On the Tower</h3><div class="sc-note">Heights drawn blind from a hat — a trade-off either way. Higher cord = more airtime to compose the shot, but a longer, scarier climb that's harder to keep fearless (and easier to freeze). A Disadvantage target is forced up top with all the fear and none of the airtime.</div><div class="sc-rgrid">${roster}</div></div>`;
  return _shell(inner);
}

export function rpBuildCheeseDrop(ep) {
  const d = ep.sayCheese; if (!d) return '';
  const steps = [], sideSnaps = [];
  const intro = `<div class="sc-h2">THE DROP</div><div class="sc-amb">— three cords, three phones, and a very long way down —</div>`;
  d.beats.forEach((b, i) => {
    const avs = (b.players || []).map(n => av(n, 22)).join('');
    const chip = b.selfie && SELCHIP[b.selfie] ? `<span class="sc-selfie ${SELCHIP[b.selfie][0]}">${SELCHIP[b.selfie][1]}</span>` : '';
    let html = `<div class="sc-card ${b.badgeClass}"><div class="row">${avs}<span class="sc-b ${b.badgeClass}">${esc(b.badge)}</span>${chip}</div><div class="txt">${esc(b.text)}</div></div>`;
    if (i > 0 && i % 4 === 0) html = `<div class="sc-amb">${AMBIENT[(i / 4) % AMBIENT.length | 0]}</div>` + html;
    steps.push(html);
    sideSnaps.push(_sideTower(d, b.board || [], b.warnings || 0));
  });
  return _shell(_stream(intro, steps, sideSnaps));
}

export function rpBuildCheeseResults(ep) {
  const d = ep.sayCheese; if (!d) return '';
  const gallery = d.results.map(r => {
    const win = r.name === d.immunityWinner;
    const cap = win ? 'FEARLESS ✓' : r.dq ? 'DISQUALIFIED' : (BESTCAP[r.best] || 'NO GOOD');
    return `<div class="sc-polaroid ${win ? 'win' : 'fail'}"><img src="assets/avatars/${slugOf(r.name)}.png" alt="${esc(r.name)}" onerror="this.style.visibility='hidden'"><div class="sc-cap ${win ? '' : 'bad'}">${cap}</div></div>`;
  }).join('');
  const fins = d.results.map((r, i) => {
    const win = r.name === d.immunityWinner;
    const st = win ? 'perfect selfie' : r.dq ? 'disqualified · to jury' : `best: ${BESTCAP[r.best] || '—'} · to jury`;
    return `<div class="sc-fin ${win ? 'win' : ''}"><span class="pl">${i + 1}</span>${av(r.name, 34)}<span class="nm">${esc(r.name)}</span>${win ? '<span class="imm">SAFE</span>' : ''}<span class="st">${st}</span></div>`;
  }).join('');
  const inner = `<div class="sc-res">
    <div class="sc-h2">DEVELOPED</div>
    <div class="sc-stamp">${esc(d.immunityWinner)} WINS IMMUNITY</div>
    <div class="sc-gallery">${gallery}</div>
    ${fins}
    <div class="sc-close">📸 ${esc(d.hostClose)}</div>
  </div>`;
  return _shell(inner);
}

// ── reveal handlers (DOM-only) ──
function _setSide(idx) {
  const snaps = (window._scSide || {}).drop; if (!snaps) return;
  const el = document.getElementById('sc-side-inner');
  if (el) el.innerHTML = snaps[Math.min(idx, snaps.length - 1)] || '';
}
export function cheeseRevealNext(total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState['sc']) window._tvState['sc'] = { idx: 0 };
  const s = window._tvState['sc'];
  if (s.idx >= total - 1) return;
  s.idx++;
  const el = document.getElementById(`sc-step-${s.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById('sc-cnt'); if (cnt) cnt.textContent = `${s.idx + 1} / ${total}`;
  try { _setSide(s.idx); } catch (e) {}
  if (s.idx >= total - 1) {
    const c = document.getElementById('sc-ctrl'); if (c) c.style.display = 'none';
    const dn = document.getElementById('sc-done'); if (dn) dn.style.display = '';
  }
}
export function cheeseRevealAll(total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState['sc']) window._tvState['sc'] = { idx: 0 };
  const s = window._tvState['sc'];
  for (let i = s.idx + 1; i < total; i++) { const el = document.getElementById(`sc-step-${i}`); if (el) el.style.display = ''; }
  s.idx = total - 1;
  const cnt = document.getElementById('sc-cnt'); if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById('sc-ctrl'); if (c) c.style.display = 'none';
  const dn = document.getElementById('sc-done'); if (dn) dn.style.display = '';
  try { _setSide(s.idx); } catch (e) {}
}
