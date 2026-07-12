// ══════════════════════════════════════════════════════════════════════
// tusks-and-ladders-vp.js — VP screens for Tusks and Ladders.
// Circus big-top theme (tal- prefix): red/gold stripes, sawdust, an inline-SVG
// elephant with a live RAGE meter, ladder-build progress, and a cannon duel with
// arcing shots at each team's flag. Click-to-reveal (DOM-only) + live sidebar.
// ══════════════════════════════════════════════════════════════════════
import { players } from '../core.js';

function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function av(name, size = 24) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:6px;object-fit:cover;flex-shrink:0;border:1px solid rgba(0,0,0,.35)" onerror="this.style.visibility='hidden'">`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ── shared CSS ──
function _css() {
  return `<style>
  .tal-wrap{max-width:1100px;margin:0 auto;font-family:"Oswald","Segoe UI",system-ui,sans-serif;color:#3a2410;position:relative;overflow:hidden;border-radius:10px;min-height:520px;
    background:repeating-linear-gradient(100deg,#f3e6cf 0 46px,#eadbbf 46px 92px)}
  .tal-wrap *{box-sizing:border-box}
  .tal-top{background:#7a1f2b;color:#ffe9b8;padding:0;position:relative}
  .tal-canopy{height:26px;background:repeating-linear-gradient(90deg,#a12633 0 34px,#f4d06a 34px 68px);border-bottom:3px solid #5a1620}
  .tal-inner{padding:22px 20px 120px;position:relative;z-index:2}
  .tal-grid{display:grid;grid-template-columns:1fr 250px;gap:16px;align-items:start}
  @media(max-width:820px){.tal-grid{grid-template-columns:1fr}}
  .tal-marquee{text-align:center;padding:24px 10px 14px}
  .tal-title{font-family:"Rye","Bungee",Impact,fantasy;font-size:clamp(30px,6vw,56px);letter-spacing:1px;color:#a12633;line-height:1;
    text-shadow:0 2px 0 #f4d06a,0 4px 0 #7a1f2b,0 6px 12px rgba(0,0,0,.35)}
  .tal-sub{margin-top:8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#7a4a1a}
  .tal-bulbs{display:flex;justify-content:center;gap:8px;margin:8px 0}
  .tal-bulb{width:10px;height:10px;border-radius:50%;background:#ffd863;box-shadow:0 0 7px #ffbf3a;animation:talBulb 1.2s infinite}
  @keyframes talBulb{0%,100%{opacity:1}50%{opacity:.3}}
  .tal-teams{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin:16px auto 4px;max-width:820px}
  .tal-teamcol{border:2px solid var(--tc,#a12633);border-radius:12px;padding:10px 12px 6px;background:rgba(255,255,255,.5);min-width:210px}
  .tal-teamcol-hd{font-family:"Rye","Bungee",Impact,fantasy;font-size:16px;letter-spacing:1px;color:var(--tc);text-align:center;text-transform:uppercase;margin-bottom:8px}
  .tal-roster{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
  .tal-rtok{display:flex;flex-direction:column;align-items:center;gap:2px;width:52px}
  .tal-rtok img{width:38px;height:38px;border-radius:8px;object-fit:cover;border:2px solid var(--tc)}
  .tal-rtok .nm{font-size:9px;color:#3a2410;max-width:50px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tal-flag{font-size:22px}
  .tal-elewrap{display:flex;justify-content:center;margin:6px 0 4px}
  .tal-ele{width:min(420px,88%);filter:drop-shadow(0 6px 8px rgba(0,0,0,.25))}
  .tal-ele .earflap{transform-origin:120px 120px;animation:talEar 2.4s ease-in-out infinite}
  @keyframes talEar{0%,100%{transform:rotate(0)}50%{transform:rotate(-7deg)}}
  .tal-ele.rage-charge .earflap,.tal-ele.rage-rampage .earflap{animation-duration:.5s}
  .tal-ele.rage-rampage{animation:talShake .18s infinite}
  @keyframes talShake{0%,100%{transform:translate(0,0)}25%{transform:translate(-3px,1px)}75%{transform:translate(3px,-1px)}}
  .tal-h2{font-family:"Rye","Bungee",Impact,fantasy;font-size:20px;letter-spacing:1px;color:#a12633;margin:2px 0 12px;text-align:center}
  .tal-card{background:rgba(255,255,255,.72);border:1px solid rgba(122,31,43,.2);border-left:5px solid #b98a3a;border-radius:9px;padding:10px 13px;margin:9px 0;animation:talPop .3s both;box-shadow:0 2px 7px rgba(0,0,0,.12)}
  @keyframes talPop{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
  .tal-card.good{border-left-color:#3f9d4a}.tal-card.bad{border-left-color:#c23b30}.tal-card.neutral{border-left-color:#b98a3a}
  .tal-card .row{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap}
  .tal-badge{font-size:9.5px;font-weight:700;letter-spacing:.5px;padding:2px 8px;border-radius:10px;text-transform:uppercase}
  .tal-badge.good{background:rgba(63,157,74,.16);color:#2c7a35}
  .tal-badge.bad{background:rgba(194,59,48,.16);color:#a12920}
  .tal-badge.neutral{background:rgba(185,138,58,.18);color:#8a6420}
  .tal-teamtag{font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:8px;color:#fff}
  .tal-card .txt{font-size:13px;line-height:1.5;color:#4a3218}
  .tal-side{background:rgba(122,31,43,.94);color:#ffe9b8;border:2px solid #f4d06a;border-radius:12px;padding:13px;position:sticky;top:12px;max-height:calc(100vh-40px);overflow-y:auto}
  .tal-side h4{font-family:"Rye","Bungee",Impact,fantasy;font-size:14px;color:#ffd863;margin:0 0 8px;text-align:center;letter-spacing:1px}
  .tal-rage{margin:0 0 12px}
  .tal-rage .lab{display:flex;justify-content:space-between;font-size:10px;letter-spacing:1px;margin-bottom:3px}
  .tal-rtrack{height:10px;background:rgba(0,0,0,.35);border-radius:5px;overflow:hidden}
  .tal-rfill{height:100%;border-radius:5px;transition:width .4s,background .4s}
  .tal-steam{border:1px solid rgba(244,208,106,.25);border-radius:8px;padding:8px;margin:0 0 9px;background:rgba(0,0,0,.15)}
  .tal-steam .tn{font-weight:700;font-size:12px;letter-spacing:.5px;margin-bottom:5px;display:flex;align-items:center;gap:5px}
  .tal-pips{display:flex;gap:4px;flex-wrap:wrap}
  .tal-pip{width:15px;height:20px;border-radius:2px;border:1px solid rgba(244,208,106,.4);position:relative}
  .tal-pip.on{background:#ffd863;border-color:#ffd863}
  .tal-pip::after{content:"";position:absolute;left:2px;right:2px;top:5px;height:2px;background:rgba(0,0,0,.2)}
  .tal-pip.on::after{background:rgba(122,31,43,.5)}
  .tal-side-note{font-size:10px;color:#e8c98a;text-align:center;font-style:italic;margin-top:4px}
  .tal-stamp{text-align:center;font-family:"Rye","Bungee",Impact,fantasy;font-size:26px;letter-spacing:1px;padding:14px;margin:12px 0;border:3px solid #a12633;border-radius:12px;color:#a12633;
    background:rgba(244,208,106,.35);text-shadow:0 2px 0 #f4d06a;transform:rotate(-1deg)}
  .tal-cannon{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.7);border:1px solid rgba(122,31,43,.2);border-radius:9px;padding:10px 12px;margin:9px 0}
  .tal-shot{display:inline-block;min-width:26px;height:26px;line-height:26px;text-align:center;border-radius:50%;font-size:12px;font-weight:700;margin:0 3px}
  .tal-shot.miss{background:rgba(0,0,0,.1);color:#8a6420}
  .tal-shot.hit{background:#3f9d4a;color:#fff;box-shadow:0 0 10px #3f9d4a}
  .tal-ctrl{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:40;display:flex;gap:10px;align-items:center;
    background:#7a1f2b;border:2px solid #f4d06a;border-radius:30px;padding:7px 14px;box-shadow:0 6px 18px rgba(0,0,0,.5)}
  .tal-btn{background:linear-gradient(180deg,#ffd863,#e0a52a);color:#5a1620;border:none;font-weight:700;font-family:inherit;padding:8px 16px;border-radius:20px;cursor:pointer;font-size:13px}
  .tal-btn.ghost{background:transparent;color:#ffd863;border:1px solid rgba(244,208,106,.5)}
  .tal-cnt{font-size:12px;color:#ffe9b8;min-width:50px;text-align:center}
  .tal-done{display:none;text-align:center;font-size:13px;color:#2c7a35;margin-top:10px}
  @media(prefers-reduced-motion:reduce){.tal-bulb,.tal-card,.tal-ele,.tal-ele .earflap{animation:none!important}}
  </style>`;
}

// ── inline-SVG elephant (rage-reactive) ──
function _elephant(stageCls, size) {
  return `<svg class="tal-ele ${stageCls}" viewBox="0 0 300 200" width="${size || ''}" aria-label="elephant">
    <ellipse cx="150" cy="185" rx="95" ry="12" fill="rgba(0,0,0,.12)"/>
    <!-- body -->
    <path d="M70,150 Q60,90 120,80 Q160,72 200,88 Q240,102 236,150 L228,150 L228,175 L210,175 L210,150 L150,150 L150,175 L132,175 L132,150 Z" fill="#8a8f99" stroke="#5f636b" stroke-width="2"/>
    <!-- head -->
    <circle cx="112" cy="118" r="46" fill="#969ba6" stroke="#5f636b" stroke-width="2"/>
    <!-- ear -->
    <path class="earflap" d="M118,90 Q80,80 78,130 Q100,140 128,120 Z" fill="#7f848f" stroke="#5f636b" stroke-width="2"/>
    <!-- eye -->
    <circle cx="96" cy="110" r="5.5" fill="#2a2d33"/>
    <circle cx="94.5" cy="108.5" r="1.6" fill="#fff"/>
    <!-- trunk -->
    <path d="M74,124 Q46,132 44,164 Q44,182 58,182 Q66,182 64,170 Q62,150 82,142" fill="none" stroke="#8a8f99" stroke-width="15" stroke-linecap="round"/>
    <!-- tusks -->
    <path d="M86,140 Q70,154 64,168" fill="none" stroke="#f4ead0" stroke-width="6" stroke-linecap="round"/>
    <path d="M98,144 Q88,158 84,172" fill="none" stroke="#f4ead0" stroke-width="6" stroke-linecap="round"/>
    <!-- ladder pieces strapped on -->
    <rect x="168" y="70" width="10" height="30" rx="2" fill="#b98a3a" stroke="#5a1620" stroke-width="1" transform="rotate(12 173 85)"/>
    <rect x="196" y="96" width="10" height="26" rx="2" fill="#b98a3a" stroke="#5a1620" stroke-width="1" transform="rotate(-8 201 109)"/>
  </svg>`;
}

function _shell(inner) {
  return `${_css()}<div class="tal-wrap"><div class="tal-canopy"></div><div class="tal-inner">${inner}</div></div>`;
}

// reveal-stream: steps + precomputed sidebar snapshots
function _stream(suffix, intro, steps, sideSnaps) {
  if (!window._talSide) window._talSide = {};
  window._talSide[suffix] = sideSnaps;
  const total = steps.length;
  const stepHtml = steps.map((s, i) => `<div id="tal-step-${suffix}-${i}" style="display:${i === 0 ? '' : 'none'}">${s.html}</div>`).join('');
  const main = `${intro}${stepHtml}
    <div class="tal-done" id="tal-done-${suffix}">— all revealed —</div>
    <div class="tal-ctrl" id="tal-ctrl-${suffix}">
      <button class="tal-btn" onclick="tusksRevealNext('tal-${suffix}',${total})">Reveal ▸</button>
      <span class="tal-cnt" id="tal-cnt-${suffix}">1 / ${total}</span>
      <button class="tal-btn ghost" onclick="tusksRevealAll('tal-${suffix}',${total})">Skip ⤏</button>
    </div>`;
  const side = `<aside class="tal-side"><div id="tal-side-inner-${suffix}">${sideSnaps[0] || ''}</div></aside>`;
  if (window._tvState && window._tvState['tal-' + suffix]) window._tvState['tal-' + suffix].idx = 0;
  return `<div class="tal-grid"><div>${main}</div>${side}</div>`;
}

function _card(kind, badge, txt, avatars, teamName, teamColor) {
  const tt = teamName ? `<span class="tal-teamtag" style="background:${teamColor || '#7a1f2b'}">${esc(teamName)}</span>` : '';
  return `<div class="tal-card ${kind}"><div class="row">${avatars || ''}${tt}<span class="tal-badge ${kind}">${esc(badge)}</span></div><div class="txt">${txt}</div></div>`;
}

function _rageFill(r) {
  const stage = r >= 85 ? { n: 'RAMPAGE', c: '#c23b30' } : r >= 60 ? { n: 'CHARGING', c: '#e07b2a' } : r >= 30 ? { n: 'AGITATED', c: '#e0b52a' } : { n: 'CALM', c: '#3f9d4a' };
  return { pct: Math.round(r), stage };
}
function _rageWidget(r) {
  const { pct, stage } = _rageFill(r);
  return `<div class="tal-rage"><div class="lab"><span>ELEPHANT</span><span style="color:${stage.c}">${stage.n}</span></div>
    <div class="tal-rtrack"><div class="tal-rfill" style="width:${pct}%;background:${stage.c}"></div></div></div>`;
}
function _teamPips(t, pieces) {
  const pips = Array.from({ length: pieces }).map((_, i) => `<span class="tal-pip ${i < t.got ? 'on' : ''}"></span>`).join('');
  return `<div class="tal-steam"><div class="tn"><span class="tal-flag">🚩</span>${esc(t.name)} <span style="margin-left:auto;font-size:10px">${t.got}/${pieces}</span></div><div class="tal-pips">${pips}</div></div>`;
}

// ══════════════════════════════════════════════════════════════════════
export function rpBuildTusksTitleCard(ep) {
  const d = ep.tusksLadders; if (!d) return '';
  const bulbs = Array.from({ length: 11 }).map((_, i) => `<span class="tal-bulb" style="animation-delay:${(i * 0.09).toFixed(2)}s"></span>`).join('');
  const teams = d.teams.map(t => `<div class="tal-teamcol" style="--tc:${t.color || '#a12633'}">
    <div class="tal-teamcol-hd">${esc(t.name)} <span class="tal-flag">🚩</span></div>
    <div class="tal-roster">${t.members.map(m => `<div class="tal-rtok" style="--tc:${t.color || '#a12633'}">${av(m, 38)}<span class="nm">${esc(m)}</span></div>`).join('')}</div>
  </div>`).join('');
  const inner = `
    <div class="tal-marquee">
      <div class="tal-bulbs">${bulbs}</div>
      <div class="tal-title">TUSKS &amp; LADDERS</div>
      <div class="tal-bulbs">${bulbs}</div>
      <div class="tal-sub">Grab · Build · Fire — First Flag Down Wins</div>
    </div>
    <div class="tal-elewrap">${_elephant('rage-calm', 340)}</div>
    <div class="tal-teams">${teams}</div>
    <div class="tal-card neutral" style="margin-top:14px"><div class="txt" style="font-style:italic">"${esc(d.opener)}"</div></div>`;
  return _shell(inner);
}

export function rpBuildTusksHunt(ep) {
  const d = ep.tusksLadders; if (!d) return '';
  const steps = [], sideSnaps = [];
  // live sidebar state: rage + per-team pieces (reconstructed from beats)
  const got = {}; d.teams.forEach(t => { got[t.name] = 0; });
  const renderSide = (rage) => {
    const teams = d.teams.map(t => _teamPips({ name: t.name, got: got[t.name] }, d.pieces)).join('');
    return `<h4>THE RING</h4>${_rageWidget(rage)}${teams}<div class="tal-side-note">Pull all ${d.pieces} pieces off the elephant to start building.</div>`;
  };
  const pushStep = (html, rage) => { steps.push({ html }); sideSnaps.push(renderSide(rage)); };

  const intro = `<div class="tal-h2">🐘 The Hunt</div><div class="tal-card neutral"><div class="txt">Every ladder piece is strapped to one furious elephant. Grab them off its trunk, tail, and back — and try not to get flattened.</div></div>`;
  d.beats.forEach((b, i) => {
    if (b.type === 'grab') got[b.team] = Math.min(d.pieces, (got[b.team] || 0) + 1);
    const rage = d.rageAt[i] != null ? d.rageAt[i] : 0;
    const avs = (b.players || []).map(n => av(n, 24)).join('');
    if (b.type === 'tranq') {
      pushStep(`<div class="tal-stamp" style="border-color:#3f9d4a;color:#2c7a35">${esc(b.badge)}</div><div class="tal-card good"><div class="txt">${esc(b.text)}</div></div>`, rage);
    } else {
      pushStep(_card(b.badgeClass || 'neutral', b.badge, esc(b.text), avs, b.team, b.color), rage);
    }
  });
  steps.push({ html: `<div class="tal-stamp">PIECES COLLECTED — TO THE LADDERS!</div>` });
  sideSnaps.push(renderSide(0));
  return _shell(_stream('hunt', intro, steps, sideSnaps));
}

export function rpBuildTusksFinish(ep) {
  const d = ep.tusksLadders; if (!d) return '';
  const steps = [], sideSnaps = [];
  const board = []; // {name,color,status}
  const renderSide = () => {
    const rows = board.map(r => `<div class="tal-steam" style="border-color:${r.color}"><div class="tn"><span class="tal-flag">🚩</span>${esc(r.name)}<span style="margin-left:auto;font-size:10px">${r.status}</span></div></div>`).join('')
      || `<div class="tal-side-note">Building ladders…</div>`;
    return `<h4>THE CANNON DUEL</h4>${rows}`;
  };
  const pushStep = (html) => { steps.push({ html }); sideSnaps.push(renderSide()); };

  const intro = `<div class="tal-h2">🪜 Build &amp; Fire</div>`;
  // assembly + climb per team (finish order = build readiness)
  const byReady = d.finish.slice().sort((a, b) => a.readyTime - b.readyTime);
  byReady.forEach(f => {
    board.push({ name: f.team, color: f.color, status: `ready ${f.readyTime}s` });
    const clAvs = f.climbers.map(c => av(c, 24)).join('');
    pushStep(_card('neutral', 'LADDER UP', `${esc(f.team)} lash their pieces together (${f.assembleTime}s) and send <b>${f.climbers.map(esc).join(' &amp; ')}</b> scrambling up to the cannon (${f.climbTime}s). Ready to fire.`, clAvs, f.team, f.color));
  });
  // the duel — interleave volleys by shot time
  const shots = [];
  d.finish.forEach(f => f.volleys.forEach(v => shots.push({ team: f.team, color: f.color, ...v })));
  shots.sort((a, b) => a.at - b.at);
  shots.forEach(s => {
    const icon = s.hit ? `<span class="tal-shot hit">🎯</span>` : `<span class="tal-shot miss">✕</span>`;
    const txt = s.hit
      ? `<b>BOOM.</b> ${esc(s.team)}'s cannonball arcs across the tent and slams the rival flag dead center. Direct hit!`
      : `${esc(s.team)} fires cannonball #${s.n}… it sails wide and thumps into the sawdust. So close.`;
    pushStep(`<div class="tal-cannon" style="border-left:5px solid ${s.color}">${icon}<div class="txt">${txt}</div></div>`);
  });
  // winner
  steps.push({ html: `<div class="tal-stamp">${esc(d.winner)} WINS IMMUNITY</div>` });
  sideSnaps.push(renderSide());
  steps.push({ html: _card('bad', 'TRIBAL COUNCIL', `${esc(d.loser)} takes the loss and heads to tribal.`) });
  sideSnaps.push(renderSide());
  steps.push({ html: `<div class="tal-card neutral"><div class="txt" style="font-style:italic">"${esc(d.closer)}"</div></div>` });
  sideSnaps.push(renderSide());
  return _shell(_stream('finish', intro, steps, sideSnaps));
}

// ── reveal handlers (DOM-only) ──
function _setSide(suffix, idx) {
  const snaps = (window._talSide || {})[suffix]; if (!snaps) return;
  const el = document.getElementById(`tal-side-inner-${suffix}`);
  if (el) el.innerHTML = snaps[Math.min(idx, snaps.length - 1)] || '';
}
export function tusksRevealNext(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: 0 };
  const s = window._tvState[screenKey];
  const suffix = screenKey.replace('tal-', '');
  if (s.idx >= total - 1) return;
  s.idx++;
  const el = document.getElementById(`tal-step-${suffix}-${s.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`tal-cnt-${suffix}`); if (cnt) cnt.textContent = `${s.idx + 1} / ${total}`;
  try { _setSide(suffix, s.idx); } catch (e) {}
  if (s.idx >= total - 1) {
    const c = document.getElementById(`tal-ctrl-${suffix}`); if (c) c.style.display = 'none';
    const dn = document.getElementById(`tal-done-${suffix}`); if (dn) dn.style.display = '';
  }
}
export function tusksRevealAll(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: 0 };
  const s = window._tvState[screenKey];
  const suffix = screenKey.replace('tal-', '');
  for (let i = s.idx + 1; i < total; i++) { const el = document.getElementById(`tal-step-${suffix}-${i}`); if (el) el.style.display = ''; }
  s.idx = total - 1;
  const cnt = document.getElementById(`tal-cnt-${suffix}`); if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`tal-ctrl-${suffix}`); if (c) c.style.display = 'none';
  const dn = document.getElementById(`tal-done-${suffix}`); if (dn) dn.style.display = '';
  try { _setSide(suffix, s.idx); } catch (e) {}
}
