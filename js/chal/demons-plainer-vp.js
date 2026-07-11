// ══════════════════════════════════════════════════════════════════════
// demons-plainer-vp.js — VP screens for Demon's Plainer
// Phase A: forest/dusk shelter build.  Phase B: neon carnival flag-memory coaster.
// dp- prefix. Click-to-reveal (DOM-only) with precomputed sidebar snapshots.
// ══════════════════════════════════════════════════════════════════════
import { players } from '../core.js';

// Coaster track profile (SVG user units, viewBox 1200x560): lift hill → steep drop → vertical loop → rolling hills.
const SPINE = "M -30,362 L 95,362 C 165,362 178,150 250,150 C 312,150 326,258 362,332 C 306,150 476,150 428,342 Q 522,246 622,336 T 822,336 T 1022,336 T 1250,336";

function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function av(name, size = 26) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:6px;object-fit:cover;flex-shrink:0;border:1px solid rgba(0,0,0,.3)" onerror="this.style.visibility='hidden'">`;
}
const FLAG_HEX = { RED: '#e0342b', BLUE: '#2f7bd6', GREEN: '#3fb950', YELLOW: '#f5c518', PURPLE: '#9b59b6', ORANGE: '#e08b2f', PINK: '#e879a8', TEAL: '#2bb0a0' };
function flagChip(c, big) {
  const h = FLAG_HEX[c] || '#888';
  const s = big ? 34 : 22;
  return `<span class="dp-flag" style="--fc:${h};width:${s}px;height:${Math.round(s * 0.72)}px" title="${c}"></span>`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ── shared CSS ──
function _dpCSS() {
  return `<style>
  .dp-wrap{max-width:1100px;margin:0 auto;font-family:"Oswald","Segoe UI",system-ui,sans-serif;color:#f4ecd8;position:relative;overflow:hidden;border-radius:10px;min-height:540px}
  .dp-wrap *{box-sizing:border-box}
  .dp-forest{background:linear-gradient(180deg,#1a2438 0%,#243447 45%,#3a3126 100%)}
  .dp-midway{background:radial-gradient(120% 90% at 50% -10%,#3a1d5e 0%,#1a1030 55%,#0c0820 100%)}
  .dp-title-bg{background:radial-gradient(130% 100% at 50% 0%,#4a2170 0%,#1a1030 60%,#0a0618 100%)}
  .dp-inner{padding:26px 22px 120px;position:relative;z-index:2}
  .dp-grid{display:grid;grid-template-columns:1fr 260px;gap:18px;align-items:start}
  @media(max-width:820px){.dp-grid{grid-template-columns:1fr}}
  .dp-marquee{text-align:center;padding:30px 10px 18px}
  .dp-mtitle{font-family:"Rye","Bungee",Impact,fantasy;font-size:clamp(34px,6vw,62px);letter-spacing:2px;color:#ffd94a;
    text-shadow:0 0 8px #ff8a00,0 0 22px #ff5e00,0 3px 0 #7a3b00,0 6px 14px rgba(0,0,0,.6);line-height:1}
  .dp-bulbs{display:flex;justify-content:center;gap:9px;margin:12px 0 4px}
  .dp-bulb{width:11px;height:11px;border-radius:50%;background:#ffe08a;box-shadow:0 0 8px #ffcf4a,0 0 14px #ff9a00;animation:dpBulb 1.1s infinite}
  @keyframes dpBulb{0%,100%{opacity:1}50%{opacity:.25}}
  .dp-sub{margin-top:10px;font-size:15px;letter-spacing:3px;text-transform:uppercase;color:#ffb3d1}
  .dp-modebadge{display:inline-block;margin-top:14px;padding:6px 16px;border:2px solid #ffd94a;border-radius:20px;font-weight:700;letter-spacing:1px;color:#ffd94a;background:rgba(0,0,0,.25)}
  .dp-roster{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:22px auto 6px;max-width:760px}
  .dp-rtok{display:flex;flex-direction:column;align-items:center;gap:3px;width:58px;animation:dpRise .5s both}
  .dp-rtok img{width:42px;height:42px;border-radius:8px;object-fit:cover;border:2px solid #ffd94a;box-shadow:0 0 10px rgba(255,217,74,.35)}
  .dp-rtok .nm{font-size:9px;text-align:center;color:#f4ecd8;max-width:56px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  @keyframes dpRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  .dp-teamrows{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin:22px auto 6px;max-width:900px}
  .dp-teamcol{border:1px solid rgba(255,255,255,.1);border-top:3px solid var(--tc,#ffd94a);border-radius:10px;padding:10px 12px 6px;background:rgba(0,0,0,.22)}
  .dp-teamcol-hd{font-family:"Rye","Bungee",Impact,fantasy;font-size:14px;letter-spacing:1px;color:var(--tc,#ffd94a);text-align:center;text-transform:uppercase;margin-bottom:8px}
  .dp-teamcol .dp-roster{margin:0;max-width:none}
  .dp-teamcol .dp-rtok img{border-color:var(--tc,#ffd94a)}
  .dp-scene{position:absolute;left:0;top:0;right:0;bottom:0;z-index:0;pointer-events:none;overflow:hidden}
  .dp-scene svg{position:absolute;left:0;top:0;width:100%;height:100%}
  .dp-scene.forest{opacity:.34}
  .dp-scene.midway{opacity:.6}
  .dp-bulbmini{animation:dpBlink 1.5s infinite}
  @keyframes dpBlink{0%,100%{opacity:1}50%{opacity:.22}}
  .dp-ferris{transform-box:fill-box;transform-origin:center;animation:dpFerris 34s linear infinite}
  @keyframes dpFerris{to{transform:rotate(360deg)}}
  .dp-train{offset-path:path("${SPINE}");offset-rotate:auto;offset-distance:0%;animation:dpRide 13s linear infinite}
  @keyframes dpRide{from{offset-distance:0%}to{offset-distance:100%}}
  @media(prefers-reduced-motion:reduce){.dp-bulbmini,.dp-ferris{animation:none}.dp-train{animation:none;offset-distance:15%}}
  .dp-h2{font-family:"Rye","Bungee",Impact,fantasy;font-size:22px;letter-spacing:1px;color:#ffd94a;margin:4px 0 12px;text-shadow:0 2px 6px rgba(0,0,0,.6)}
  .dp-flagbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:12px 14px;background:rgba(0,0,0,.32);border:1px solid rgba(255,217,74,.3);border-radius:10px;margin-bottom:14px}
  .dp-flagbar .lbl{font-size:11px;letter-spacing:2px;color:#ffb3d1;margin-right:6px;text-transform:uppercase}
  .dp-flag{display:inline-block;background:var(--fc);border:2px solid rgba(255,255,255,.5);border-radius:2px;box-shadow:0 2px 5px rgba(0,0,0,.5);position:relative}
  .dp-flag::after{content:"";position:absolute;left:-2px;top:-2px;bottom:-2px;width:2px;background:#3a2a10}
  .dp-card{background:rgba(20,16,34,.72);border:1px solid rgba(255,217,74,.18);border-left:4px solid #888;border-radius:9px;padding:11px 14px;margin:9px 0;animation:dpPop .34s both;box-shadow:0 3px 10px rgba(0,0,0,.4)}
  @keyframes dpPop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
  .dp-card.good{border-left-color:#3fb950}
  .dp-card.bad{border-left-color:#e0342b}
  .dp-card.neutral{border-left-color:#e0a94a}
  .dp-card .row{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .dp-badge{font-size:9.5px;font-weight:700;letter-spacing:1px;padding:2px 8px;border-radius:10px;text-transform:uppercase}
  .dp-badge.good{background:rgba(63,185,80,.2);color:#7ee08a}
  .dp-badge.bad{background:rgba(224,52,43,.22);color:#ff8f88}
  .dp-badge.neutral{background:rgba(224,169,74,.2);color:#f0cf8a}
  .dp-card .txt{font-size:13.5px;line-height:1.5;color:#e8ddc4}
  .dp-tribehdr{display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(0,0,0,.3);border-radius:9px;margin:16px 0 4px;border:1px solid rgba(255,217,74,.25)}
  .dp-tribehdr .tn{font-family:"Rye","Bungee",Impact,fantasy;font-size:19px;color:#ffd94a}
  .dp-capchip{font-size:11px;padding:3px 9px;border-radius:12px;background:rgba(255,217,74,.14);color:#ffe08a;border:1px solid rgba(255,217,74,.3)}
  .dp-meter{margin:7px 0}
  .dp-meter .ml{display:flex;justify-content:space-between;font-size:11px;color:#cbb98e;margin-bottom:3px}
  .dp-mtrack{height:9px;background:rgba(0,0,0,.4);border-radius:5px;overflow:hidden}
  .dp-mfill{height:100%;border-radius:5px;transition:width .5s}
  .dp-stamp{text-align:center;font-family:"Rye","Bungee",Impact,fantasy;font-size:30px;letter-spacing:2px;padding:16px;margin:14px 0;border:3px solid #ffd94a;border-radius:12px;color:#ffd94a;
    background:rgba(255,217,74,.08);text-shadow:0 0 12px #ff8a00;transform:rotate(-1.5deg);box-shadow:0 0 22px rgba(255,138,0,.3)}
  .dp-stamp.storm{border-color:#5a7fb0;color:#a9c8ee;text-shadow:0 0 12px #2f4d80}
  .dp-side{background:rgba(10,7,20,.78);border:1px solid rgba(255,217,74,.22);border-radius:11px;padding:14px;position:sticky;top:56px;max-height:calc(100vh - 80px);overflow-y:auto}
  .dp-side h4{font-family:"Rye","Bungee",Impact,fantasy;font-size:14px;color:#ffd94a;margin:2px 0 8px;letter-spacing:1px;text-align:center}
  .dp-srow{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px dashed rgba(255,217,74,.12);font-size:12px}
  .dp-srow .sc{margin-left:auto;font-weight:700;color:#ffe08a}
  .dp-srow.win{color:#7ee08a}
  .dp-side-flags{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin:0 0 12px}
  .dp-team{border:1px solid rgba(255,255,255,.08);border-left:4px solid var(--tc,#ffd94a);border-radius:8px;padding:7px 9px;margin:0 0 10px;background:rgba(255,255,255,.03);transition:box-shadow .3s,border-color .3s}
  .dp-team.hot{box-shadow:0 0 0 1px var(--tc),0 0 14px -2px var(--tc);background:rgba(255,255,255,.06)}
  .dp-team.won{border-color:#7ee08a}
  .dp-team-hd{display:flex;align-items:center;gap:6px;margin-bottom:5px}
  .dp-team-hd .tn{font-family:"Rye","Bungee",Impact,fantasy;font-size:13px;color:var(--tc,#ffd94a);letter-spacing:.5px;text-transform:uppercase}
  .dp-team-hd .hr{margin-left:auto;font-size:11px;font-weight:700;color:#ffe08a;display:flex;align-items:center;gap:4px}
  .dp-mrow{display:flex;align-items:center;gap:7px;padding:2.5px 0;font-size:11.5px;color:#dcd0b4}
  .dp-mrow .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dp-mrow .cap{font-size:9px;color:#3a1d00;background:var(--tc,#ffd94a);border-radius:8px;padding:1px 5px;font-weight:700;letter-spacing:.3px}
  .dp-mrow .st{margin-left:auto;font-size:12px;min-width:16px;text-align:right}
  .dp-mrow.dim{opacity:.5}
  .dp-side-note{font-size:10.5px;color:#8a7c5a;text-align:center;margin-top:4px;font-style:italic}
  .dp-ctrl{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:40;display:flex;gap:10px;align-items:center;
    background:rgba(12,8,26,.94);border:1px solid rgba(255,217,74,.35);border-radius:30px;padding:8px 14px;box-shadow:0 6px 20px rgba(0,0,0,.55)}
  .dp-btn{background:linear-gradient(180deg,#ffd94a,#f0a020);color:#3a1d00;border:none;font-weight:700;font-family:inherit;
    padding:8px 16px;border-radius:20px;cursor:pointer;letter-spacing:.5px;font-size:13px}
  .dp-btn.ghost{background:transparent;color:#ffd94a;border:1px solid rgba(255,217,74,.4)}
  .dp-cnt{font-size:12px;color:#ffb3d1;min-width:52px;text-align:center}
  .dp-done{display:none;text-align:center;font-size:13px;color:#7ee08a;margin-top:10px;letter-spacing:1px}
  @media(prefers-reduced-motion:reduce){.dp-bulb,.dp-cart,.dp-card,.dp-rtok{animation:none!important}}
  </style>`;
}

// ── carnival scene: coaster (track + pylons + riding train), Ferris wheel, string lights ──
function _dpScene(variant) {
  const midway = variant === 'midway';
  const rail = midway ? '#ffd94a' : '#c9b072';
  const structure = midway ? '#8a5416' : '#4f3c22';
  const trainCol = midway ? '#ff4d6d' : '#b46a4a';
  const ferrisCol = midway ? '#b98cff' : '#9aa6c4';
  const lightCol = midway ? '#ffe08a' : '#e8dcc0';
  const GROUND = 470;

  // string lights: scalloped swags + blinking bulbs
  let wire = '', bulbs = '';
  for (let s = -20; s <= 1200; s += 300) wire += `<path d="M${s},34 Q${s + 150},84 ${s + 300},34" fill="none" stroke="rgba(255,240,200,.28)" stroke-width="1.4"/>`;
  for (let x = 8; x <= 1192; x += 36) { const t = ((x + 20) % 300) / 300; const y = (34 + 50 * Math.sin(Math.PI * t)).toFixed(1); bulbs += `<circle class="dp-bulbmini" cx="${x}" cy="${y}" r="4" fill="${lightCol}" style="animation-delay:${(((x / 36) % 7) * 0.18).toFixed(2)}s"/>`; }

  // support pylons under the track (x, trackY) with X cross-bracing
  const pylonPts = [[95, 360], [362, 332], [522, 300], [722, 322], [922, 335], [1122, 335]];
  let pylons = '';
  for (const [x, ty] of pylonPts) {
    pylons += `<g stroke="${structure}" stroke-width="3" fill="none" opacity=".85">
      <line x1="${x - 18}" y1="${GROUND}" x2="${x - 5}" y2="${ty}"/>
      <line x1="${x + 18}" y1="${GROUND}" x2="${x + 5}" y2="${ty}"/>
      <line x1="${x - 13}" y1="${ty + (GROUND - ty) * 0.35}" x2="${x + 13}" y2="${ty + (GROUND - ty) * 0.65}"/>
      <line x1="${x + 13}" y1="${ty + (GROUND - ty) * 0.35}" x2="${x - 13}" y2="${ty + (GROUND - ty) * 0.65}"/>
      <line x1="${x - 15}" y1="${ty + (GROUND - ty) * 0.5}" x2="${x + 15}" y2="${ty + (GROUND - ty) * 0.5}" stroke-width="2"/>
    </g>`;
  }

  // Ferris wheel (right side)
  const fx = 1055, fy = 180, fr = 92;
  let spokes = '', cabins = '';
  for (let a = 0; a < 12; a++) { const ang = a * Math.PI / 6; const ex = (fx + fr * Math.cos(ang)).toFixed(1); const ey = (fy + fr * Math.sin(ang)).toFixed(1); spokes += `<line x1="${fx}" y1="${fy}" x2="${ex}" y2="${ey}" stroke="${ferrisCol}" stroke-width="1.5"/>`; cabins += `<path d="M${ex},${ey} l-6,0 l0,9 l12,0 l0,-9 z" fill="none" stroke="${ferrisCol}" stroke-width="1.8"/>`; }

  // the riding train (drawn around origin; offset-path carries it along SPINE, offset-rotate flips it through the loop)
  let cars = '';
  for (let i = -1; i <= 1; i++) {
    const cx = i * 38;
    cars += `<g>
      <rect x="${cx - 16}" y="${-20}" width="32" height="15" rx="5" fill="${trainCol}" stroke="rgba(0,0,0,.5)" stroke-width="1.5"/>
      <rect x="${cx - 11}" y="${-17}" width="22" height="6" rx="3" fill="rgba(255,255,255,.55)"/>
      <circle cx="${cx - 8}" cy="-24" r="3.2" fill="#3a2a20"/><circle cx="${cx + 8}" cy="-24" r="3.2" fill="#3a2a20"/>
      <circle cx="${cx - 9}" cy="-2" r="3.4" fill="#222" stroke="${rail}" stroke-width="1"/>
      <circle cx="${cx + 9}" cy="-2" r="3.4" fill="#222" stroke="${rail}" stroke-width="1"/>
    </g>`;
  }
  const train = `<g class="dp-train"><line x1="-58" y1="-10" x2="58" y2="-10" stroke="#2a2a2a" stroke-width="2.5"/>${cars}<path d="M54,-20 l14,7 l-14,7 z" fill="${trainCol}" stroke="rgba(0,0,0,.5)" stroke-width="1"/></g>`;

  return `<div class="dp-scene ${variant}"><svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice">
    ${wire}${bulbs}
    <line x1="1000" y1="${GROUND}" x2="${fx}" y2="${fy}" stroke="${structure}" stroke-width="3.5"/>
    <line x1="1110" y1="${GROUND}" x2="${fx}" y2="${fy}" stroke="${structure}" stroke-width="3.5"/>
    <g class="dp-ferris"><circle cx="${fx}" cy="${fy}" r="${fr}" fill="none" stroke="${ferrisCol}" stroke-width="2.5"/>${spokes}${cabins}<circle cx="${fx}" cy="${fy}" r="7" fill="${ferrisCol}"/></g>
    ${pylons}
    <path d="${SPINE}" fill="none" stroke="${structure}" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 9" opacity=".8"/>
    <path d="${SPINE}" fill="none" stroke="${structure}" stroke-width="6" stroke-linecap="round" opacity=".55"/>
    <path d="${SPINE}" fill="none" stroke="${rail}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="${SPINE}" fill="none" stroke="${rail}" stroke-width="2.6" stroke-linecap="round" transform="translate(0,6)" opacity=".8"/>
    ${train}
  </svg></div>`;
}

function _shell(inner, phaseCls) {
  const variant = phaseCls === 'dp-forest' ? 'forest' : 'midway';
  return `${_dpCSS()}<div class="dp-wrap ${phaseCls}">
    ${_dpScene(variant)}
    <div class="dp-inner">${inner}</div>
  </div>`;
}

// ── reveal-stream builder ──
// steps: [{html}], sideSnaps: [html per idx]. suffix identifies the screen.
function _stream(suffix, intro, steps, sideSnaps) {
  if (!window._dpSide) window._dpSide = {};
  window._dpSide[suffix] = sideSnaps;
  const total = steps.length;
  const stepHtml = steps.map((s, i) =>
    `<div class="dp-stepwrap" id="dp-step-${suffix}-${i}" style="display:${i === 0 ? '' : 'none'}">${s.html}</div>`).join('');
  const startIdx = 0;
  const main = `${intro}${stepHtml}
    <div class="dp-done" id="dp-done-${suffix}">— all revealed —</div>
    <div class="dp-ctrl" id="dp-ctrl-${suffix}">
      <button class="dp-btn" onclick="demonsPlainerRevealNext('dp-${suffix}',${total})">Reveal ▸</button>
      <span class="dp-cnt" id="dp-cnt-${suffix}">1 / ${total}</span>
      <button class="dp-btn ghost" onclick="demonsPlainerRevealAll('dp-${suffix}',${total})">Skip ⤏</button>
    </div>`;
  const side = `<aside class="dp-side" id="dp-side-${suffix}"><div id="dp-side-inner-${suffix}">${sideSnaps[startIdx] || ''}</div></aside>`;
  // ensure state starts at 0
  if (window._tvState && window._tvState['dp-' + suffix]) window._tvState['dp-' + suffix].idx = 0;
  return `<div class="dp-grid"><div>${main}</div>${side}</div>`;
}

function _card(kind, badge, txt, avatars) {
  return `<div class="dp-card ${kind}"><div class="row">${avatars || ''}<span class="dp-badge ${kind}">${esc(badge)}</span></div><div class="txt">${txt}</div></div>`;
}

// Sidebar team roster block: colored header, captain chip, avatar rows + per-member status.
// opts: { captain, capLabel, statusMap:{name:icon}, headerRight, highlight, won, dimUnset }
function _sideTeam(name, color, members, opts = {}) {
  const rows = (members || []).map(n => {
    const cap = opts.captain === n ? `<span class="cap">${opts.capLabel || 'CAP'}</span>` : '';
    const st = (opts.statusMap && opts.statusMap[n]) || '';
    const dim = opts.dimUnset && !(opts.statusMap && opts.statusMap[n]) ? ' dim' : '';
    return `<div class="dp-mrow${dim}">${av(n, 20)}<span class="nm">${esc(n)}</span>${cap}<span class="st">${st}</span></div>`;
  }).join('');
  return `<div class="dp-team${opts.highlight ? ' hot' : ''}${opts.won ? ' won' : ''}" style="--tc:${color || '#ffd94a'}">
    <div class="dp-team-hd"><span class="tn">${esc(name)}</span>${opts.headerRight ? `<span class="hr">${opts.headerRight}</span>` : ''}</div>${rows}</div>`;
}

// Derive tribe groups for a screen from whatever data exists (shelter tribeData / coaster tribeResults / flat merge).
function _groupsFor(dp) {
  const co = dp.coaster;
  if (co && co.tribeResults && co.tribeResults.length) {
    return co.tribeResults.map(t => ({ name: t.name, color: t.color, members: t.members, lead: t.arranger }));
  }
  if (dp.shelter && dp.shelter.tribeData) {
    return dp.shelter.tribeData.map(t => ({ name: t.name, color: t.color, members: t.members, lead: t.captain }));
  }
  // post-merge / flat
  const names = (dp.leaderboard || []).map(x => x.name);
  return [{ name: 'The Merge', color: '#b98cff', members: names, lead: null }];
}

// ══════════════════════════════════════════════════════════════════════
// TITLE CARD
// ══════════════════════════════════════════════════════════════════════
export function rpBuildDemonsPlainerTitle(ep) {
  const dp = ep.demonsPlainer; if (!dp) return '';
  const roster = (dp.leaderboard || []).map(x => x.name);
  const subByMode = {
    ep1: 'Season Opener · Shelter Scramble + The Coaster',
    premerge: 'Team Flag-Memory · Winner Takes the Bags',
    postmerge: 'Individual Immunity · Ride, Remember, Rebuild',
  };
  const modeBadge = dp.mode === 'postmerge' ? 'IMMUNITY ON THE LINE'
    : dp.mode === 'ep1' ? 'DAY ONE — SURVIVAL BEGINS' : 'TEAM CHALLENGE';
  const bulbs = Array.from({ length: 13 }).map((_, i) => `<span class="dp-bulb" style="animation-delay:${(i * 0.08).toFixed(2)}s"></span>`).join('');
  const tok = (n, i) => `<div class="dp-rtok" style="animation-delay:${(i * 0.04).toFixed(2)}s">${av(n, 42)}<span class="nm">${esc(n)}</span></div>`;
  // group the roster by team so the teams are obvious from the very first screen (pre-merge only)
  const groups = _groupsFor(dp);
  let rosterHtml;
  if (dp.mode !== 'postmerge' && groups.length > 1) {
    rosterHtml = `<div class="dp-teamrows">` + groups.map(g =>
      `<div class="dp-teamcol" style="--tc:${g.color || '#ffd94a'}"><div class="dp-teamcol-hd">${esc(g.name)}</div><div class="dp-roster">${g.members.map((n, i) => tok(n, i)).join('')}</div></div>`).join('') + `</div>`;
  } else {
    rosterHtml = `<div class="dp-roster">${roster.map((n, i) => tok(n, i)).join('')}</div>`;
  }
  const inner = `
    <div class="dp-marquee">
      <div class="dp-bulbs">${bulbs}</div>
      <div class="dp-mtitle">DEMON'S PLAINER</div>
      <div class="dp-bulbs">${bulbs}</div>
      <div class="dp-sub">${subByMode[dp.mode] || ''}</div>
      <div class="dp-modebadge">${modeBadge}</div>
    </div>
    ${rosterHtml}
    <div class="dp-card neutral" style="margin-top:18px"><div class="txt" style="font-style:italic">"${esc(dp.chrisOpener)}"</div></div>`;
  return _shell(inner, 'dp-title-bg');
}

// ══════════════════════════════════════════════════════════════════════
// SHELTER SCRAMBLE  (ep1 only)
// ══════════════════════════════════════════════════════════════════════
export function rpBuildDemonsPlainerShelter(ep) {
  const dp = ep.demonsPlainer; const sh = dp && dp.shelter; if (!sh) return '';
  const steps = [];
  const sideSnaps = [];
  // running sidebar: both team rosters always shown; current team highlighted; scores + tarp fill in as judged
  const judged = new Map();
  let currentTribe = null;
  const renderSide = () => {
    const teams = sh.tribeData.map(t => {
      const j = judged.get(t.name);
      const hr = j ? `${(t.sturdiness + t.themeScore).toFixed(1)}${t.wonTarp ? ' 🏕★' : ''}` : (currentTribe === t.name ? 'building…' : '');
      return _sideTeam(t.name, t.color, t.members, { captain: t.captain, capLabel: 'CAPTAIN', headerRight: hr, highlight: currentTribe === t.name && !j, won: t.wonTarp && j });
    }).join('');
    const done = judged.size >= sh.tribeData.length;
    return `<h4>THE TEAMS</h4>${teams}<div class="dp-side-note">${done ? '🏕 Tarp → ' + esc(sh.winner) : 'Building shelters — best sturdiness + theme wins the tarp'}</div>`;
  };

  const pushStep = (html) => { steps.push({ html }); sideSnaps.push(renderSide()); };

  for (const t of sh.tribeData) {
    currentTribe = t.name;
    pushStep(`<div class="dp-tribehdr"><span class="tn" style="color:${t.color || '#ffd94a'}">${esc(t.name)}</span><span class="dp-capchip">CAPTAIN: ${esc(t.captain)} · ${t.style}</span></div>`);
    for (const e of t.events) {
      const avs = [e.actor, e.target].filter(Boolean).map(n => av(n, 24)).join('');
      pushStep(_card(e.badgeClass || 'neutral', e.badgeText || 'EVENT', esc(e.text), avs));
    }
    // judged meter card
    judged.set(t.name, t);
    const stFill = Math.round((t.sturdiness / 20) * 100), thFill = Math.round((t.themeScore / 20) * 100);
    steps.push({ html: `<div class="dp-card ${t.wonTarp ? 'good' : 'neutral'}">
      <div class="row"><span class="dp-badge ${t.wonTarp ? 'good' : 'neutral'}">JUDGED — ${esc(t.name)}</span></div>
      <div class="dp-meter"><div class="ml"><span>STURDINESS</span><span>${t.sturdiness}</span></div><div class="dp-mtrack"><div class="dp-mfill" style="width:${stFill}%;background:#3fb950"></div></div></div>
      <div class="dp-meter"><div class="ml"><span>THEME</span><span>${t.themeScore}</span></div><div class="dp-mtrack"><div class="dp-mfill" style="width:${thFill}%;background:#e879a8"></div></div></div>
      ${t.wonTarp ? '<div class="txt" style="color:#7ee08a;font-weight:700;margin-top:6px">★ Best shelter — WINS THE TARP</div>' : ''}
    </div>` });
    sideSnaps.push(renderSide());
  }
  // outcome stamp
  steps.push({ html: `<div class="dp-stamp">${esc(sh.winner)} TAKES THE TARP</div>` });
  sideSnaps.push(renderSide());
  // nightfall
  for (const ne of sh.nightEvents) {
    steps.push({ html: _card(ne.kind === 'storm' ? 'bad' : 'good', ne.kind === 'storm' ? '⛈ STORM NIGHT' : '☂ DRY NIGHT', esc(ne.text)) });
    sideSnaps.push(renderSide());
  }
  steps.push({ html: `<div class="dp-stamp storm">SHELTER PHASE COMPLETE</div>` });
  sideSnaps.push(renderSide());

  const intro = `<div class="dp-h2">🏕 Shelter Scramble</div><div class="dp-card neutral"><div class="txt">${esc(sh.introText || 'Find your camp and build a shelter from whatever you can scavenge. The judge scores sturdiness and theme — winner sleeps dry under the tarp; the rest face the storm.')}</div></div>`;
  return _shell(_stream('shelter', intro, steps, sideSnaps), 'dp-forest');
}

// ══════════════════════════════════════════════════════════════════════
// THE COASTER  (always)
// ══════════════════════════════════════════════════════════════════════
export function rpBuildDemonsPlainerCoaster(ep) {
  const dp = ep.demonsPlainer; const co = dp && dp.coaster; if (!co) return '';
  const steps = [], sideSnaps = [];
  const groups = _groupsFor(dp);
  const ridSet = new Map(); // name -> status icon
  const renderSide = () => {
    const flags = dp.flagOrder.map(c => flagChip(c, false)).join('');
    const teams = groups.map(g => _sideTeam(g.name, g.color, g.members, {
      captain: g.lead, capLabel: 'SORTS', statusMap: Object.fromEntries(ridSet), dimUnset: true,
      headerRight: `${g.members.filter(m => ridSet.has(m)).length}/${g.members.length}`,
    })).join('');
    return `<h4>MEMORIZE THIS ORDER</h4><div class="dp-side-flags">${flags}</div><h4>ON THE RIDE</h4>${teams}<div class="dp-side-note">👁 sharp · ✓ rode · 🤢 sick — the "SORTS" camper rebuilds the order</div>`;
  };
  const pushStep = (html) => { steps.push({ html }); sideSnaps.push(renderSide()); };

  // flag banner reveal
  pushStep(`<div class="dp-flagbar"><span class="lbl">Memorize:</span>${dp.flagOrder.map(c => flagChip(c, true)).join('')}</div>`);

  // varied "steady rider" lines so identical cards don't stack up
  const STEADY = [
    n => `${n} rides it clean, tracking every flag without drama.`,
    n => `${n} keeps a cool head on the drops and reels the colors off one by one.`,
    n => `${n} grips the bar tight but never looks away from the flags.`,
    n => `${n} treats it like a commute — calm, focused, every color logged.`,
    n => `${n} gets thrown around but holds the flag order together through the loop.`,
    n => `${n} rides steady, lips moving, memorizing the colors in order.`,
  ];
  let steadyIdx = 0;
  const riderCards = (r) => {
    ridSet.set(r.name, r.puked ? '🤢' : (r.memory >= 12 ? '👁' : '✓'));
    if (r.beats.length) {
      for (const b of r.beats) pushStep(_card(b.badgeClass || 'neutral', b.badgeText || 'RIDE', esc(b.text), av(r.name, 24) + (r.splashed ? av(r.splashed, 24) : '')));
    } else {
      pushStep(_card('neutral', 'STEADY', esc(STEADY[(steadyIdx++) % STEADY.length](r.name)), av(r.name, 24)));
    }
  };

  const isTribe = co.tribeResults && co.tribeResults.length;
  if (isTribe) {
    for (const g of groups) {
      pushStep(`<div class="dp-tribehdr"><span class="tn" style="color:${g.color || '#ffd94a'}">${esc(g.name)}</span><span class="dp-capchip">SORTS: ${esc(g.lead)}</span></div>`);
      for (const r of co.riders.filter(x => g.members.includes(x.name))) riderCards(r);
    }
  } else {
    for (const r of co.riders) riderCards(r);
  }

  for (const d of (co.downtime || [])) {
    pushStep(_card('good', '💛 DOWNTIME', esc(d.text), av(d.a, 24) + av(d.b, 24)));
  }
  steps.push({ html: `<div class="dp-stamp">EVERYONE'S OFF THE RIDE</div>` });
  sideSnaps.push(renderSide());

  const intro = `<div class="dp-h2">🎢 The Demon's Plainer</div><div class="dp-card neutral"><div class="txt">"${esc(dp.coasterOpener)}"</div></div>`;
  return _shell(_stream('coaster', intro, steps, sideSnaps), 'dp-midway');
}

// ══════════════════════════════════════════════════════════════════════
// RESULTS — THE SORT
// ══════════════════════════════════════════════════════════════════════
export function rpBuildDemonsPlainerResults(ep) {
  const dp = ep.demonsPlainer; const co = dp && dp.coaster; if (!co) return '';
  const steps = [], sideSnaps = [];
  const groups = _groupsFor(dp);
  const tribeMode = co.sortMode === 'tribe';
  const sortResult = new Map(); // tribeName -> {solveTime,gotIt,retries}
  const board = []; // individual mode
  const renderSide = () => {
    if (tribeMode) {
      const teams = groups.map(g => {
        const r = sortResult.get(g.name);
        const isWin = r && g.name === co.winnerTribeName;
        const hr = r ? (r.gotIt ? `${r.solveTime}s${r.retries ? ` · ${r.retries}✗` : ''}` : 'DNF') + (isWin ? ' 🛏★' : '') : 'sorting…';
        return _sideTeam(g.name, g.color, g.members, { captain: g.lead, capLabel: 'SORTS', headerRight: hr, highlight: false, won: isWin });
      }).join('');
      const done = sortResult.size >= groups.length;
      return `<h4>THE SORT</h4>${teams}<div class="dp-side-note">${done ? '🛏 Sleeping bags → ' + esc(co.winnerTribeName) : 'Fastest correct tribe wins immunity'}</div>`;
    }
    const rows = board.map((r, i) => `<div class="dp-srow ${i === 0 ? 'win' : ''}">${av(r.name, 20)}<span class="nm" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i + 1}. ${esc(r.name)}</span><span class="sc">${r.val}</span></div>`).join('')
      || `<div class="dp-side-note">The sort is on…</div>`;
    return `<h4>IMMUNITY BOARD</h4>${rows}<div class="dp-side-note">fewest errors, fastest time wins</div>`;
  };
  const pushStep = (html) => { steps.push({ html }); sideSnaps.push(renderSide()); };

  if (tribeMode) {
    pushStep(`<div class="dp-card neutral"><div class="txt">Each tribe's sharpest mind rebuilds the flag order. Get it wrong and two riders go back up the coaster. Fastest correct tribe wins the sleeping bags.</div></div>`);
    for (const tr of (co.tribeResults || [])) {
      sortResult.set(tr.name, { solveTime: tr.solveTime, gotIt: tr.gotIt, retries: tr.retries });
      const retryTxt = tr.retries > 0
        ? `${esc(tr.arranger)} sets the order… <b style="color:#ff8f88">WRONG.</b> Two ${esc(tr.name)} riders trudge back up — ${tr.retries} time${tr.retries > 1 ? 's' : ''} total.`
        : `${esc(tr.arranger)} sets the order… <b style="color:#7ee08a">CORRECT, first try.</b>`;
      const kind = tr.gotIt ? (tr.retries === 0 ? 'good' : 'neutral') : 'bad';
      steps.push({ html: _card(kind, `${esc(tr.name)} · ${tr.gotIt ? tr.solveTime + 's' : 'DID NOT SOLVE'}`, `${retryTxt} ${tr.gotIt ? 'Order locked in.' : 'Time called before they cracked it.'}`, av(tr.arranger, 24)) });
      sideSnaps.push(renderSide());
    }
    steps.push({ html: `<div class="dp-stamp">${esc(co.winnerTribeName)} WINS · SLEEPING BAGS</div>` });
    sideSnaps.push(renderSide());
    steps.push({ html: _card('bad', 'TRIBAL COUNCIL', `${esc(co.loserTribeName)} couldn't beat the clock — they're headed to tribal.`) });
    sideSnaps.push(renderSide());
  } else {
    pushStep(`<div class="dp-card neutral"><div class="txt">One board each. Rebuild the flag order from memory — fewest errors, fastest time. The sharpest set of eyes wins individual immunity.</div></div>`);
    for (const at of (co.attempts || [])) {
      board.push({ name: at.name, val: `${at.solveTime}s`, done: true });
      const kind = at.errors === 0 ? 'good' : at.errors >= 2 ? 'bad' : 'neutral';
      steps.push({ html: _card(kind, `${esc(at.name)} · ${at.errors} error${at.errors === 1 ? '' : 's'}`, `${esc(at.name)} rebuilds the order with <b>${at.errors}</b> mistake${at.errors === 1 ? '' : 's'}, clocking <b>${at.solveTime}s</b>.`, av(at.name, 24)) });
      sideSnaps.push(renderSide());
    }
    steps.push({ html: `<div class="dp-stamp">${esc(dp.immunityWinner)} WINS IMMUNITY</div>` });
    sideSnaps.push(renderSide());
  }
  steps.push({ html: `<div class="dp-card neutral"><div class="txt" style="font-style:italic">"${esc(dp.chrisCloser)}"</div></div>` });
  sideSnaps.push(renderSide());

  const intro = `<div class="dp-h2">🏁 The Sort</div>`;
  return _shell(_stream('results', intro, steps, sideSnaps), 'dp-midway');
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL HANDLERS (DOM-only)
// ══════════════════════════════════════════════════════════════════════
function _dpSetSide(suffix, idx) {
  const snaps = (window._dpSide || {})[suffix];
  if (!snaps) return;
  const el = document.getElementById(`dp-side-inner-${suffix}`);
  if (el) el.innerHTML = snaps[Math.min(idx, snaps.length - 1)] || '';
}
export function demonsPlainerRevealNext(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: 0 };
  const s = window._tvState[screenKey];
  const suffix = screenKey.replace('dp-', '');
  if (s.idx >= total - 1) return;
  s.idx++;
  const el = document.getElementById(`dp-step-${suffix}-${s.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`dp-cnt-${suffix}`); if (cnt) cnt.textContent = `${s.idx + 1} / ${total}`;
  try { _dpSetSide(suffix, s.idx); } catch (e) {}
  if (s.idx >= total - 1) {
    const c = document.getElementById(`dp-ctrl-${suffix}`); if (c) c.style.display = 'none';
    const d = document.getElementById(`dp-done-${suffix}`); if (d) d.style.display = '';
  }
}
export function demonsPlainerRevealAll(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: 0 };
  const s = window._tvState[screenKey];
  const suffix = screenKey.replace('dp-', '');
  for (let i = s.idx + 1; i < total; i++) { const el = document.getElementById(`dp-step-${suffix}-${i}`); if (el) el.style.display = ''; }
  s.idx = total - 1;
  const cnt = document.getElementById(`dp-cnt-${suffix}`); if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`dp-ctrl-${suffix}`); if (c) c.style.display = 'none';
  const d = document.getElementById(`dp-done-${suffix}`); if (d) d.style.display = '';
  try { _dpSetSide(suffix, s.idx); } catch (e) {}
}

// re-apply visibility after screen switch (rebuilds DOM state from _tvState)
export function _dpReapply() {
  ['shelter', 'coaster', 'results', 'title'].forEach(suffix => {
    const st = window._tvState && window._tvState['dp-' + suffix];
    if (!st) return;
    for (let i = 0; i <= st.idx; i++) { const el = document.getElementById(`dp-step-${suffix}-${i}`); if (el) el.style.display = ''; }
    try { _dpSetSide(suffix, st.idx); } catch (e) {}
  });
}
