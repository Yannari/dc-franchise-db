// ══════════════════════════════════════════════════════════════════════
// killer-clown-vp.js — VP screens for "Night of the Killer Clown".
// Moonlit blood-carnival theme (noc- prefix): near-black night forest, drifting
// fog, a bulb marquee gone sickly, and a looming inline-SVG animatronic clown
// with a live "THE STALK" proximity meter, a river/mountain fork-map with live
// player markers, and a dart-gun armed-status board. Click-to-reveal (DOM-only)
// + precomputed live sidebar snapshots. Distinct from Hide-and-Be-Sneaky's
// green night-vision — this is slasher-poster red/gold on black.
// ══════════════════════════════════════════════════════════════════════
import { players } from '../core.js';

function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function av(name, size = 24) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(0,0,0,.5)" onerror="this.style.visibility='hidden'">`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ── shared CSS ──
function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Creepster&family=Special+Elite&family=Oswald:wght@300;400;600;700&display=swap');
  .noc-wrap{--ink:#07060a;--panel:#140d1c;--fog:#1b1424;--blood:#c8102e;--blood2:#7a0a1c;--gold:#e8b53a;
    --moon:#cfe3ff;--moon2:#8fa8cc;--grease:#e7ddcf;--stalk:#ff2d3f;--safe:#39d98a;
    max-width:1100px;margin:0 auto;font-family:'Oswald',"Segoe UI",system-ui,sans-serif;color:var(--grease);
    position:relative;overflow:hidden;border-radius:10px;min-height:520px;
    background:radial-gradient(120px 120px at 82% 12%,rgba(207,227,255,.28),rgba(207,227,255,0) 70%),
      radial-gradient(900px 520px at 50% -12%,#241636 0%,#0d0916 55%,#07060a 100%);}
  .noc-wrap *{box-sizing:border-box}
  .noc-inner{padding:0 0 130px;position:relative;z-index:2}
  .noc-moon{position:absolute;top:22px;right:96px;width:70px;height:70px;border-radius:50%;
    background:radial-gradient(circle at 38% 34%,#fff,#cfe3ff 45%,#6f86ab 100%);
    box-shadow:0 0 56px 16px rgba(160,190,240,.32);z-index:0}
  .noc-fog{position:absolute;left:-20%;width:140%;height:120px;pointer-events:none;z-index:1;
    background:radial-gradient(60% 100% at 50% 100%,rgba(120,110,150,.20),rgba(120,110,150,0) 70%);filter:blur(4px);animation:nocDrift 24s linear infinite}
  .noc-fog.f1{bottom:-10px}.noc-fog.f2{bottom:120px;opacity:.55;animation-duration:34s;animation-direction:reverse}
  @keyframes nocDrift{0%{transform:translateX(-6%)}50%{transform:translateX(6%)}100%{transform:translateX(-6%)}}

  /* title / cold open */
  .noc-title{position:relative;padding:34px 18px 22px;text-align:center;z-index:2}
  .noc-kicker{font-family:'Special Elite',monospace;letter-spacing:6px;font-size:11px;color:var(--moon2);text-transform:uppercase}
  .noc-bulbs{display:flex;justify-content:center;gap:9px;margin:10px 0 4px}
  .noc-bulb{width:9px;height:9px;border-radius:50%;background:#ff5a6a;box-shadow:0 0 8px #ff2d3f;animation:nocBulb 1.3s infinite}
  .noc-bulb:nth-child(3n){background:#ffd863;box-shadow:0 0 8px #e8b53a}
  .noc-bulb:nth-child(3n+1){background:#7fd6ff;box-shadow:0 0 8px #4bb8ff}
  @keyframes nocBulb{0%,100%{opacity:1}50%{opacity:.22}}
  .noc-clownwrap{position:relative;width:210px;height:236px;margin:2px auto 0;filter:drop-shadow(0 0 26px rgba(200,16,46,.42))}
  .noc-clownwrap svg{width:100%;height:100%}
  .noc-sway{transform-origin:50% 92%;animation:nocSway 4.8s ease-in-out infinite}
  @keyframes nocSway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
  .noc-arm{transform-origin:150px 120px;animation:nocReach 3.2s ease-in-out infinite}
  @keyframes nocReach{0%,100%{transform:rotate(0)}55%{transform:rotate(-13deg)}}
  .noc-big{font-family:'Creepster',cursive;font-size:clamp(38px,7.5vw,74px);line-height:.92;color:var(--grease);letter-spacing:2px;margin:4px 0;
    text-shadow:0 0 2px #000,3px 3px 0 var(--blood2),0 0 30px rgba(200,16,46,.4)}
  .noc-big .red{color:var(--blood)}
  .noc-tsub{font-family:'Special Elite',monospace;font-size:13px;color:var(--moon);opacity:.85;max-width:600px;margin:8px auto 0;line-height:1.5}
  .noc-host{margin-top:16px;display:inline-block;font-family:'Special Elite',monospace;font-size:12.5px;color:var(--gold);
    border:1px dashed rgba(232,181,58,.5);border-radius:6px;padding:8px 14px;background:rgba(232,181,58,.05);max-width:680px;line-height:1.5}

  /* loadout roster */
  .noc-roster{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:8px 18px 22px;position:relative;z-index:2}
  @media(max-width:720px){.noc-roster{grid-template-columns:1fr}}
  .noc-rcol{background:linear-gradient(180deg,rgba(20,13,28,.85),rgba(10,7,16,.9));border:1px solid #2a1830;border-radius:10px;padding:12px 13px}
  .noc-rcol h3{font-family:'Special Elite',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;display:flex;align-items:center;gap:7px}
  .noc-rcol.river h3{color:#6fd3ff}.noc-rcol.mtn h3{color:#f0a15a}
  .noc-rcol h3 .hint{margin-left:auto;font-size:9px;color:var(--moon2);letter-spacing:1px}
  .noc-pl{display:flex;align-items:center;gap:9px;padding:6px 7px;border-radius:8px;border:1px solid #241830;margin-bottom:6px;background:rgba(0,0,0,.25)}
  .noc-pl .nm{flex:1;font-weight:600;font-size:13px;color:var(--grease)}
  .noc-ammo{font-family:'Special Elite',monospace;font-size:10px;letter-spacing:1px;padding:2px 7px;border-radius:20px;border:1px solid;white-space:nowrap}
  .noc-ammo.gun{color:#8fb2ff;border-color:#3a4d7a;background:rgba(60,90,160,.15)}
  .noc-ammo.dart{color:var(--gold);border-color:#5a4620;background:rgba(232,181,58,.12)}
  .noc-ammo.loaded{color:#062;background:var(--safe);border-color:var(--safe);font-weight:700}

  /* stalk layout */
  .noc-grid{display:grid;grid-template-columns:1fr 292px;gap:16px;padding:16px 18px;position:relative;z-index:2}
  @media(max-width:820px){.noc-grid{grid-template-columns:1fr}}
  .noc-h2{font-family:'Creepster',cursive;font-size:26px;letter-spacing:1px;color:var(--stalk);text-align:center;margin:2px 0 12px;text-shadow:0 0 14px rgba(255,45,63,.4)}
  .noc-amb{font-family:'Special Elite',monospace;font-size:11px;color:var(--moon2);opacity:.72;text-align:center;padding:4px 0;letter-spacing:1px;font-style:italic}
  .noc-card{border:1px solid #241830;border-left:3px solid #3a2850;border-radius:8px;padding:10px 12px;margin:9px 0;
    background:linear-gradient(180deg,rgba(20,13,28,.82),rgba(9,7,15,.86));animation:nocRise .38s both}
  @keyframes nocRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .noc-card.good{border-left-color:var(--safe)}
  .noc-card.bad{border-left-color:var(--stalk);box-shadow:0 0 18px rgba(255,45,63,.14)}
  .noc-card.neutral{border-left-color:#b98a3a}
  .noc-card.route.river{border-left-color:#6fd3ff;background:linear-gradient(180deg,rgba(16,26,42,.82),rgba(9,7,15,.86))}
  .noc-card.route.mtn{border-left-color:#f0a15a;background:linear-gradient(180deg,rgba(38,24,14,.82),rgba(9,7,15,.86))}
  .noc-badge.route-river{background:rgba(111,211,255,.13);color:#6fd3ff;border-color:rgba(111,211,255,.4)}
  .noc-badge.route-mtn{background:rgba(240,161,90,.13);color:#f0a15a;border-color:rgba(240,161,90,.4)}
  .noc-card .row{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap}
  .noc-badge{font-family:'Special Elite',monospace;font-size:9.5px;letter-spacing:1px;text-transform:uppercase;padding:2px 7px;border-radius:4px;border:1px solid}
  .noc-badge.good{background:rgba(57,217,138,.14);color:var(--safe);border-color:rgba(57,217,138,.4)}
  .noc-badge.bad{background:rgba(255,45,63,.16);color:var(--stalk);border-color:rgba(255,45,63,.45)}
  .noc-badge.neutral{background:rgba(232,181,58,.13);color:var(--gold);border-color:rgba(232,181,58,.4)}
  .noc-time{margin-left:auto;font-family:'Special Elite',monospace;font-size:11px;color:var(--moon2)}
  .noc-card .txt{font-size:13px;line-height:1.5;color:#d8cfc2}
  .noc-card .txt b{color:var(--grease)}
  .noc-grab-stamp{text-align:center;font-family:'Creepster',cursive;font-size:24px;letter-spacing:1px;color:var(--stalk);
    padding:8px;margin:8px 0;border:2px solid var(--blood2);border-radius:10px;background:rgba(200,16,46,.1);text-shadow:0 0 12px rgba(255,45,63,.5)}

  /* sidebar: THE STALK */
  .noc-side{position:sticky;top:12px;align-self:start;border:1px solid #2a1830;border-radius:12px;overflow:hidden;
    background:linear-gradient(180deg,#160c1e,#0b0712);max-height:calc(100vh - 40px);overflow-y:auto}
  .noc-sh{font-family:'Creepster',cursive;letter-spacing:2px;font-size:22px;color:var(--stalk);text-align:center;
    padding:10px;background:linear-gradient(180deg,rgba(200,16,46,.18),transparent);text-shadow:0 0 12px rgba(255,45,63,.5)}
  .noc-prox{padding:11px 13px 5px}
  .noc-prox .lab{font-family:'Special Elite',monospace;font-size:9.5px;letter-spacing:1.5px;color:var(--moon2);text-transform:uppercase;margin-bottom:6px;display:flex;justify-content:space-between}
  .noc-proxbar{height:15px;border-radius:8px;background:#241019;border:1px solid #3a1420;overflow:hidden}
  .noc-proxfill{height:100%;background:linear-gradient(90deg,#7a0a1c,#ff2d3f);box-shadow:0 0 14px rgba(255,45,63,.6);transition:width .5s}
  .noc-proxstate{text-align:center;font-family:'Creepster',cursive;font-size:17px;letter-spacing:1px;color:var(--stalk);margin-top:5px}
  .noc-map{position:relative;height:130px;margin:9px 13px;border:1px solid #241830;border-radius:8px;
    background:radial-gradient(220px 90px at 20% 92%,rgba(60,120,200,.2),transparent 70%),
      radial-gradient(220px 90px at 80% 92%,rgba(200,120,60,.18),transparent 70%),
      linear-gradient(180deg,#120a1c,#0d0916)}
  .noc-map .flag-line{position:absolute;top:8px;left:8px;right:8px;font-family:'Special Elite',monospace;font-size:9px;color:var(--gold);text-align:center;letter-spacing:2px}
  .noc-map .fork{position:absolute;left:50%;top:22px;bottom:16px;width:1px;background:repeating-linear-gradient(#3a2850 0 4px,transparent 4px 8px);transform:translateX(-50%)}
  .noc-map .lane{position:absolute;bottom:16px;font-family:'Special Elite',monospace;font-size:9px;letter-spacing:1px}
  .noc-map .lane.river{left:8px;color:#6fd3ff}.noc-map .lane.mtn{right:8px;color:#f0a15a}
  .noc-map .camp{position:absolute;left:50%;bottom:2px;transform:translateX(-50%);font-size:9px;color:var(--gold);font-family:'Special Elite',monospace}
  .noc-dot{position:absolute;width:9px;height:9px;border-radius:50%;border:1px solid #000;transition:left .5s,top .5s}
  .noc-dot .tag{position:absolute;left:11px;top:-4px;font-size:8.5px;color:#cfe3ff;white-space:nowrap;font-family:'Special Elite',monospace}
  .noc-dot.grab{background:var(--stalk)!important;box-shadow:0 0 8px rgba(255,45,63,.8)}
  .noc-clowndot{position:absolute;width:14px;height:14px;border-radius:50%;
    background:radial-gradient(circle at 40% 35%,#fff,#ff2d3f 60%,#7a0a1c);box-shadow:0 0 12px rgba(255,45,63,.85);transition:top .5s,left .5s}
  .noc-arms{padding:5px 13px 13px}
  .noc-arms .arow{display:flex;align-items:center;gap:7px;font-size:12px;padding:3px 0;border-bottom:1px dashed #241830}
  .noc-arms .arow:last-child{border:none}
  .noc-arms .nm{flex:1;color:var(--grease);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .noc-arms .st{font-family:'Special Elite',monospace;font-size:9px;letter-spacing:1px;padding:1px 6px;border-radius:10px}
  .noc-arms .st.loaded{background:var(--safe);color:#062;font-weight:700}
  .noc-arms .st.gun{background:rgba(60,90,160,.2);color:#8fb2ff}
  .noc-arms .st.dart{background:rgba(232,181,58,.15);color:var(--gold)}
  .noc-arms .st.grabbed{background:rgba(255,45,63,.2);color:var(--stalk)}

  /* the run leaderboard */
  .noc-run{padding:16px 18px;position:relative;z-index:2}
  .noc-track{border:1px solid #2a1830;border-radius:10px;background:linear-gradient(90deg,#0c0814,#160c1e);padding:12px 14px}
  .noc-lane{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed #241830}
  .noc-lane:last-child{border:none}
  .noc-rank{font-family:'Creepster',cursive;font-size:22px;width:30px;text-align:center;color:var(--moon2)}
  .noc-lane.win .noc-rank{color:var(--gold);text-shadow:0 0 12px rgba(232,181,58,.6)}
  .noc-lane .who{width:120px;display:flex;align-items:center;gap:7px;font-weight:600;font-size:13px}
  .noc-lane .who .rt{font-family:'Special Elite',monospace;font-size:8.5px;padding:1px 5px;border-radius:8px}
  .noc-lane .who .rt.river{background:rgba(60,120,200,.2);color:#6fd3ff}
  .noc-lane .who .rt.mountain{background:rgba(200,120,60,.2);color:#f0a15a}
  .noc-prog{flex:1;height:13px;border-radius:8px;background:#160e1e;border:1px solid #2a1830;position:relative;overflow:hidden}
  .noc-prog i{position:absolute;left:0;top:0;height:100%;border-radius:8px;background:linear-gradient(90deg,#3a2850,#c8102e)}
  .noc-lane.win .noc-prog i{background:linear-gradient(90deg,#7a5a10,var(--gold))}
  .noc-lt{font-family:'Special Elite',monospace;font-size:11px;color:var(--moon2);width:76px;text-align:right}
  .noc-stamp{margin:16px auto 0;max-width:360px;text-align:center;font-family:'Creepster',cursive;font-size:30px;letter-spacing:1px;
    color:#07060a;background:linear-gradient(180deg,var(--gold),#b3841f);border-radius:10px;padding:10px;transform:rotate(-2deg);
    box-shadow:0 6px 0 rgba(0,0,0,.4),0 0 30px rgba(232,181,58,.4)}
  .noc-close{font-family:'Special Elite',monospace;font-size:12.5px;color:var(--moon);text-align:center;margin-top:16px;font-style:italic;opacity:.9;line-height:1.5}

  /* reveal controls */
  .noc-ctrl{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:40;display:flex;gap:10px;align-items:center;
    background:#120a1c;border:2px solid var(--blood);border-radius:30px;padding:7px 14px;box-shadow:0 6px 18px rgba(0,0,0,.6)}
  .noc-btn{background:linear-gradient(180deg,#e0344b,#8f0f21);color:#fff;border:none;font-weight:700;font-family:inherit;padding:8px 16px;border-radius:20px;cursor:pointer;font-size:13px}
  .noc-btn.ghost{background:transparent;color:#ff9ba7;border:1px solid rgba(255,45,63,.5)}
  .noc-cnt{font-family:'Special Elite',monospace;font-size:12px;color:var(--moon2);min-width:52px;text-align:center}
  .noc-done{display:none;text-align:center;font-size:12px;color:var(--safe);margin-top:10px;font-family:'Special Elite',monospace}
  @media(prefers-reduced-motion:reduce){.noc-bulb,.noc-fog,.noc-sway,.noc-arm,.noc-card{animation:none!important}}
  </style>`;
}

// ── menacing inline-SVG animatronic clown ──
function _clownSVG() {
  return `<svg viewBox="0 0 210 236" aria-label="animatronic killer clown"><g class="noc-sway">
    <!-- elongated body -->
    <path d="M62 236 q-10 -84 43 -96 q53 12 43 96 Z" fill="#120e1a" stroke="#2a1830" stroke-width="2"/>
    <!-- pom-poms down the front -->
    <circle cx="88" cy="182" r="6" fill="#c8102e"/><circle cx="120" cy="200" r="6" fill="#e8b53a"/><circle cx="98" cy="214" r="5" fill="#7fd6ff"/>
    <!-- reaching clawed arm -->
    <g class="noc-arm"><path d="M148 128 q40 6 58 -18" fill="none" stroke="#120e1a" stroke-width="13" stroke-linecap="round"/>
      <path d="M206 108 l7 -8 M206 108 l9 -2 M206 108 l6 6" stroke="#efe6d8" stroke-width="3" stroke-linecap="round" fill="none"/>
      <circle cx="205" cy="109" r="7" fill="#efe6d8"/></g>
    <!-- tattered ruff -->
    <path d="M66 150 q39 26 78 0 q-9 22 -39 25 q-30 -3 -39 -25Z" fill="#7a0a1c" stroke="#c8102e" stroke-width="2"/>
    <!-- head -->
    <circle cx="105" cy="106" r="48" fill="#efe6d8"/>
    <!-- wild hair tufts -->
    <path d="M58 98 q-20 -12 -8 -36 q13 15 26 12Z" fill="#c8102e"/>
    <path d="M152 98 q20 -12 8 -36 q-13 15 -26 12Z" fill="#c8102e"/>
    <path d="M62 74 q-13 -22 8 -36 q3 17 18 20Z" fill="#a80d24"/>
    <path d="M148 74 q13 -22 -8 -36 q-3 17 -18 20Z" fill="#a80d24"/>
    <!-- sunken glowing eyes -->
    <path d="M76 92 l22 12 l-22 8Z" fill="#0b0712"/>
    <path d="M134 92 l-22 12 l22 8Z" fill="#0b0712"/>
    <circle cx="86" cy="99" r="3.4" fill="#ff2d3f"><animate attributeName="opacity" values="1;.4;1" dur="2.6s" repeatCount="indefinite"/></circle>
    <circle cx="124" cy="99" r="3.4" fill="#ff2d3f"><animate attributeName="opacity" values="1;.4;1" dur="2.6s" repeatCount="indefinite"/></circle>
    <!-- black eye streaks -->
    <path d="M86 104 q-3 14 -8 22" stroke="#0b0712" stroke-width="2.5" fill="none"/>
    <path d="M124 104 q3 14 8 22" stroke="#0b0712" stroke-width="2.5" fill="none"/>
    <!-- red nose -->
    <circle cx="105" cy="112" r="9" fill="#c8102e" stroke="#7a0a1c" stroke-width="1.5"/>
    <!-- jagged toothy grin -->
    <path d="M74 122 q31 30 62 0 q-31 22 -62 0Z" fill="#0b0712"/>
    <path d="M76 124 l6 8 l6 -7 l6 8 l6 -7 l6 8 l6 -7 l6 8 l6 -7 l6 8 l4 -6" fill="none" stroke="#efe6d8" stroke-width="2.4"/>
    <!-- pointed hat -->
    <path d="M68 64 q37 -44 74 0 q-37 -16 -74 0Z" fill="#12101a" stroke="#c8102e" stroke-width="2"/>
    <circle cx="105" cy="34" r="6" fill="#e8b53a"><animate attributeName="fill" values="#e8b53a;#c8102e;#e8b53a" dur="1.8s" repeatCount="indefinite"/></circle>
  </g></svg>`;
}

function _shell(inner) {
  return `${_css()}<div class="noc-wrap"><div class="noc-moon"></div><div class="noc-fog f1"></div><div class="noc-fog f2"></div><div class="noc-inner">${inner}</div></div>`;
}

// reveal-stream: steps + precomputed sidebar snapshots (DOM-only reveal)
function _stream(suffix, intro, steps, sideSnaps) {
  if (!window._nocSide) window._nocSide = {};
  window._nocSide[suffix] = sideSnaps;
  const total = steps.length;
  const stepHtml = steps.map((s, i) => `<div id="noc-step-${suffix}-${i}" style="display:${i === 0 ? '' : 'none'}">${s.html}</div>`).join('');
  const main = `${intro}${stepHtml}
    <div class="noc-done" id="noc-done-${suffix}">— all revealed —</div>
    <div class="noc-ctrl" id="noc-ctrl-${suffix}">
      <button class="noc-btn" onclick="clownRevealNext('noc-${suffix}',${total})">Reveal ▸</button>
      <span class="noc-cnt" id="noc-cnt-${suffix}">1 / ${total}</span>
      <button class="noc-btn ghost" onclick="clownRevealAll('noc-${suffix}',${total})">Skip ⤏</button>
    </div>`;
  const side = sideSnaps.length ? `<aside class="noc-side"><div id="noc-side-inner-${suffix}">${sideSnaps[0] || ''}</div></aside>` : '';
  if (window._tvState && window._tvState['noc-' + suffix]) window._tvState['noc-' + suffix].idx = 0;
  return side ? `<div class="noc-grid"><div>${main}</div>${side}</div>` : main;
}

function _card(kind, badge, txt, avatars, time) {
  const tm = time ? `<span class="noc-time">${esc(time)}</span>` : '';
  return `<div class="noc-card ${kind}"><div class="row">${avatars || ''}<span class="noc-badge ${kind}">${esc(badge)}</span>${tm}</div><div class="txt">${txt}</div></div>`;
}

// ── sidebar renderer (THE STALK) ──
function _proxState(p) { return p >= 88 ? 'RAMPAGE' : p >= 65 ? 'CHARGING' : p >= 35 ? 'CIRCLING' : 'LURKING'; }
function _sideStalk(d, prox, arms, pos) {
  const stateN = _proxState(prox);
  // fork-map dots: x by route, y by progress (bottom=camp, top=flags)
  const routeOf = {}; d.loadout.forEach(l => routeOf[l.name] = l.route);
  const dots = Object.keys(arms || {}).map((n, i) => {
    const p = (pos && pos[n] != null) ? pos[n] : 0;
    const river = routeOf[n] === 'river';
    const baseX = river ? 14 : 62;      // % lane offset
    const jitter = ((i * 37) % 22);      // spread dots within a lane
    const x = baseX + jitter;
    const y = 88 - p * 0.72;             // higher progress = higher up
    const grab = arms[n] === 'grabbed';
    const col = grab ? '#ff2d3f' : river ? '#6fd3ff' : '#f0a15a';
    return `<div class="noc-dot ${grab ? 'grab' : ''}" style="left:${x}%;top:${y}%;background:${col}"><span class="tag">${esc(n.slice(0, 5))}</span></div>`;
  }).join('');
  const clownY = 78 - prox * 0.6;        // clown descends toward camp as it charges
  const map = `<div class="noc-map">
    <div class="flag-line">🚩 FLAGS 🚩</div>
    <div class="fork"></div>
    <span class="lane river">RIVER</span><span class="lane mtn">MOUNTAIN</span>
    <span class="camp">▲ CAMP</span>
    <div class="noc-clowndot" style="left:47%;top:${clownY}%"></div>
    ${dots}
  </div>`;
  const order = { loaded: 0, dart: 1, gun: 2, grabbed: 3 };
  const rows = Object.entries(arms || {})
    .sort((a, b) => (order[a[1]] ?? 5) - (order[b[1]] ?? 5))
    .map(([n, st]) => `<div class="arow"><span class="nm">${esc(n)}</span><span class="st ${st}">${st === 'loaded' ? 'LOADED' : st === 'grabbed' ? 'GRABBED' : st === 'gun' ? 'EMPTY' : 'DARTS'}</span></div>`).join('');
  return `<div class="noc-sh">THE STALK</div>
    <div class="noc-prox"><div class="lab"><span>Clown proximity</span><span>${prox >= 65 ? 'RISING' : 'NEAR'}</span></div>
      <div class="noc-proxbar"><div class="noc-proxfill" style="width:${Math.round(prox)}%"></div></div>
      <div class="noc-proxstate">${stateN}</div></div>
    ${map}
    <div class="noc-arms">${rows}</div>`;
}

// ── ambient spooky-carnival flavor (VP-only interludes) ──
const AMBIENT = [
  '· · · a music box winds itself, three notes, somewhere in the trees · · ·',
  '· · · something is dragging its feet through the dead leaves · · ·',
  '· · · a calliope wheezes to life far off, then chokes silent · · ·',
  '· · · big painted footprints in the mud, already filling with rain · · ·',
  '· · · a balloon bobs past at head height. nobody let go of a balloon · · ·',
  '· · · the flashlight beams keep finding a grin that isn\'t there when you look twice · · ·',
  '· · · a distant carousel starts turning with no one on it · · ·',
  '· · · every owl in the forest has gone very, very quiet · · ·',
];

// ══════════════════════════════════════════════════════════════════════
export function rpBuildClownTitleCard(ep) {
  const d = ep.killerClown; if (!d) return '';
  const bulbs = Array.from({ length: 13 }).map((_, i) => `<span class="noc-bulb" style="animation-delay:${(i * 0.08).toFixed(2)}s"></span>`).join('');
  const ammoPill = (l) => l.startLoaded
    ? `<span class="noc-ammo loaded">✦ LOADED</span>`
    : l.item === 'gun' ? `<span class="noc-ammo gun">▭ EMPTY GUN</span>` : `<span class="noc-ammo dart">◈ DARTS</span>`;
  const col = (names, cls, label, hint) => `<div class="noc-rcol ${cls}"><h3>${label}<span class="hint">${hint}</span></h3>${
    names.map(n => { const l = d.loadout.find(x => x.name === n) || { name: n, item: 'gun' }; return `<div class="noc-pl">${av(n, 30)}<span class="nm">${esc(n)}</span>${ammoPill(l)}</div>`; }).join('') || '<div class="noc-amb">— empty route —</div>'
  }</div>`;
  const inner = `
    <div class="noc-title">
      <div class="noc-kicker">Post-Merge · Individual Immunity · Night 1</div>
      <div class="noc-bulbs">${bulbs}</div>
      <div class="noc-clownwrap">${_clownSVG()}</div>
      <div class="noc-big">NIGHT OF THE<br><span class="red">KILLER CLOWN</span></div>
      <div class="noc-tsub">Grab a flag from the dark and bring it home. But half of you hold empty guns, half of you hold the darts — and something is already awake in the trees.</div>
      <div class="noc-host">${esc(d.hostOpen)}</div>
    </div>
    <div class="noc-roster">
      ${col(d.routes.river, 'river', '🌊 River Route', 'raft · nerve')}
      ${col(d.routes.mountain, 'mtn', '⛰ Mountain Route', 'climb · bridge')}
    </div>`;
  return _shell(inner);
}

export function rpBuildClownStalk(ep) {
  const d = ep.killerClown; if (!d) return '';
  const steps = [], sideSnaps = [];
  const stalkBeats = d.beats.filter(b => b.phase === 'stalk');
  const intro = `<div class="noc-h2">🤡 The Stalk</div>
    <div class="noc-card neutral"><div class="txt">Backpacks on, maps out, routes chosen. Half-armed and hunted, the merge scatters into the dark — and the clown starts to move.</div></div>`;

  stalkBeats.forEach((b, i) => {
    const avs = (b.players || []).map(n => av(n, 24)).join('');
    let html;
    if (b.type === 'grab') {
      html = `<div class="noc-grab-stamp">🤡 ${esc(b.badge)}</div>${_card('bad', b.badge, esc(b.text), avs, b.t)}`;
    } else if (b.type === 'route') {
      const rc = b.route === 'river' ? 'river' : 'mtn';
      const bc = b.route === 'river' ? 'route-river' : 'route-mtn';
      html = `<div class="noc-card route ${rc}"><div class="row">${avs}<span class="noc-badge ${bc}">${esc(b.badge)}</span><span class="noc-time">${esc(b.t)}</span></div><div class="txt">${esc(b.text)}</div></div>`;
    } else {
      html = _card(b.badgeClass || 'neutral', b.badge, esc(b.text), avs, b.t);
    }
    // ambient interlude every ~3 beats (VP-only atmosphere)
    if (i > 0 && i % 3 === 0) html = `<div class="noc-amb">${AMBIENT[(i / 3) % AMBIENT.length | 0]}</div>` + html;
    steps.push({ html });
    sideSnaps.push(_sideStalk(d, b.prox != null ? b.prox : 0, b.arms || {}, b.pos || {}));
  });
  // closing step
  steps.push({ html: `<div class="noc-grab-stamp" style="border-color:var(--gold);color:var(--gold)">🚩 FLAGS IN HAND — RUN FOR CAMP</div>` });
  sideSnaps.push(sideSnaps[sideSnaps.length - 1] || _sideStalk(d, 0, {}, {}));

  return _shell(_stream('stalk', intro, steps, sideSnaps));
}

export function rpBuildClownRun(ep) {
  const d = ep.killerClown; if (!d) return '';
  const routeOf = {}; d.loadout.forEach(l => routeOf[l.name] = l.route);
  const winBeat = d.beats.find(b => b.type === 'win');
  const trapBeat = d.beats.find(b => b.type === 'sabotage' && b.phase === 'run');
  const worst = d.worstTime || (d.results[d.results.length - 1]?.returnTime || 1);
  const best = d.bestTime || (d.results[0]?.returnTime || 1);
  const lanes = d.results.map((r, i) => {
    const pct = Math.max(8, Math.round(100 - ((r.returnTime - best) / Math.max(1, worst - best)) * 78));
    const statusLbl = r.status === 'flag' ? '🚩' : r.status === 'clown' ? 'CLOWN' : r.status === 'trapped' ? 'TRAPPED' : `+${r.delta}s`;
    return `<div class="noc-lane ${i === 0 ? 'win' : ''}">
      <span class="noc-rank">${i + 1}</span>
      <span class="who">${av(r.name, 24)}<span>${esc(r.name)}</span><span class="rt ${r.route}">${r.route === 'river' ? 'RVR' : 'MTN'}</span></span>
      <span class="noc-prog"><i style="width:${pct}%"></i></span>
      <span class="noc-lt">${i === 0 ? (r.returnTime + 's ') : ''}${statusLbl}</span>
    </div>`;
  }).join('');
  const trapHtml = trapBeat ? `<div class="noc-amb" style="margin-top:12px">${esc((trapBeat.players || []).join(' vs '))}</div>${_card('bad', trapBeat.badge, esc(trapBeat.text), (trapBeat.players || []).map(n => av(n, 24)).join(''), trapBeat.t)}` : '';
  const inner = `<div class="noc-run">
    <div class="noc-h2">🏁 The Run</div>
    <div class="noc-amb" style="margin-bottom:8px">· · · the finish is a ring of flashlights, and the clown is between them and it · · ·</div>
    ${trapHtml}
    <div class="noc-track">${lanes}</div>
    ${winBeat ? `<div style="margin-top:12px">${_card('good', winBeat.badge, esc(winBeat.text), (winBeat.players || []).map(n => av(n, 24)).join(''), winBeat.t)}</div>` : ''}
    <div class="noc-stamp">${esc(d.immunityWinner)} WINS IMMUNITY</div>
    <div class="noc-close">"${esc(d.hostClose)}"</div>
  </div>`;
  return _shell(inner);
}

// ── reveal handlers (DOM-only) ──
function _setSide(suffix, idx) {
  const snaps = (window._nocSide || {})[suffix]; if (!snaps) return;
  const el = document.getElementById(`noc-side-inner-${suffix}`);
  if (el) el.innerHTML = snaps[Math.min(idx, snaps.length - 1)] || '';
}
export function clownRevealNext(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: 0 };
  const s = window._tvState[screenKey];
  const suffix = screenKey.replace('noc-', '');
  if (s.idx >= total - 1) return;
  s.idx++;
  const el = document.getElementById(`noc-step-${suffix}-${s.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`noc-cnt-${suffix}`); if (cnt) cnt.textContent = `${s.idx + 1} / ${total}`;
  try { _setSide(suffix, s.idx); } catch (e) {}
  if (s.idx >= total - 1) {
    const c = document.getElementById(`noc-ctrl-${suffix}`); if (c) c.style.display = 'none';
    const dn = document.getElementById(`noc-done-${suffix}`); if (dn) dn.style.display = '';
  }
}
export function clownRevealAll(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: 0 };
  const s = window._tvState[screenKey];
  const suffix = screenKey.replace('noc-', '');
  for (let i = s.idx + 1; i < total; i++) { const el = document.getElementById(`noc-step-${suffix}-${i}`); if (el) el.style.display = ''; }
  s.idx = total - 1;
  const cnt = document.getElementById(`noc-cnt-${suffix}`); if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`noc-ctrl-${suffix}`); if (c) c.style.display = 'none';
  const dn = document.getElementById(`noc-done-${suffix}`); if (dn) dn.style.display = '';
  try { _setSide(suffix, s.idx); } catch (e) {}
}
