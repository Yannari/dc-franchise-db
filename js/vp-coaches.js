// js/vp-coaches.js — The Coaches' Board: a chalkboard + playbook VP screen for
// the coaching twist. Reads ep.coachData, shaped:
//   ep.coachData = { [tribeName]: { sessions: [{coach,contestant,stat,gain}],
//                                    passedOver: [{coach,contestant}] } }
//
// Visual identity: a coach's playbook and chalkboard — drawn plays,
// hand-marked stat columns, chalk dust. Own class prefix (cb-), own fonts,
// own palette. No emoji — every icon is CSS-drawn via _icon().
//
// The storytelling rule this screen exists to serve: a contestant a coach
// never called on must NOT look like a card that simply didn't run. It has
// to read as a mark against them — a name left off the board — because that
// visible neglect is what later makes a contestant vote their coach out.

const _tvState = {};

function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  _tvState[key].total = total;
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`cb-step-${suffix}-${i}`);
    if (el) el.classList.add('cb-visible');
  }
  const counter = document.getElementById(`cb-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`cb-controls-${suffix}`);
    if (controls) {
      const btns = controls.querySelectorAll('.cb-btn');
      btns.forEach(b => { b.style.opacity = '0.4'; });
    }
  }
}

export function coachRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('cb-', '');
  _reapplyVisibility(suffix, st.idx, st.total);
  const el = document.getElementById(`cb-step-${suffix}-${st.idx}`);
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _updateSidebar(screenKey);
}

export function coachRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('cb-', '');
  _reapplyVisibility(suffix, st.idx, st.total);
  _updateSidebar(screenKey);
}

// ── CSS icon helper — no emoji, ever ──────────────────────────────────
function _icon(type) {
  const map = {
    clipboard: `<div class="cb-icon icon-clipboard"><div class="cb-clip-clip"></div></div>`,
    whistle: `<div class="cb-icon icon-whistle"></div>`,
    play: `<div class="cb-icon icon-play"><div class="cb-play-x"></div><div class="cb-play-x2"></div><div class="cb-play-o"></div><div class="cb-play-arrow"></div></div>`,
    chalkmark: `<div class="cb-icon icon-chalkmark"></div>`,
    star: `<div class="cb-icon icon-star"></div>`,
    pin: `<div class="cb-icon icon-pin"></div>`,
  };
  return map[type] || '';
}

function _slug(name) { return String(name || '').toLowerCase().replace(/\s+/g, '-'); }

function _avatar(name, cls = '') {
  const slug = _slug(name);
  return `<img class="cb-av ${cls}" src="assets/avatars/${slug}.png" alt="${name}" title="${name}">`;
}

// ── Sidebar ─────────────────────────────────────────────────────────
function _buildSidebar(ep) {
  return `<div class="cb-sidebar"><div id="cb-sidebar-inner" class="cb-clipboard-panel">
    ${_buildSidebarContent(ep)}
  </div></div>`;
}

function _buildSidebarContent(ep) {
  const data = ep.coachData;
  if (!data) return '';
  const st = _tvState['cb-board'];
  const revealIdx = st ? st.idx : -1;
  const meta = (typeof window !== 'undefined' && window._cbStepMeta) ? window._cbStepMeta : [];

  // Banked total per coach, gated to what has actually been revealed.
  const bankedByCoach = {};
  const trainedByCoach = {};
  for (let i = 0; i <= revealIdx && i < meta.length; i++) {
    const m = meta[i];
    bankedByCoach[m.coach] = (bankedByCoach[m.coach] || 0) + Number(m.gain || 0);
    if (!trainedByCoach[m.coach]) trainedByCoach[m.coach] = [];
    trainedByCoach[m.coach].push(m.contestant);
  }

  let out = `<div class="cb-sb-header">THE BOARD</div>`;

  Object.entries(data).forEach(([tribeName, t]) => {
    const coaches = [...new Set([
      ...(t.sessions || []).map(s => s.coach),
      ...(t.passedOver || []).map(p => p.coach),
    ])];
    out += `<div class="cb-sb-tribe"><div class="cb-sb-tribe-name">${tribeName}</div>`;
    coaches.forEach(coach => {
      const banked = bankedByCoach[coach] || 0;
      const trained = trainedByCoach[coach] || [];
      const passed = (t.passedOver || []).filter(p => p.coach === coach).map(p => p.contestant);
      out += `<div class="cb-sb-coach">
        <div class="cb-sb-coach-name">${_avatar(coach, 'cb-av-tiny')} ${coach}</div>
        <div class="cb-sb-banked">Banked: <span class="cb-sb-banked-num">${banked.toFixed(2)}</span></div>
        <div class="cb-sb-standing">
          ${trained.map(n => `<span class="cb-sb-tag cb-sb-tag-in">${n}</span>`).join('')}
          ${passed.map(n => `<span class="cb-sb-tag cb-sb-tag-out">${n}</span>`).join('')}
        </div>
      </div>`;
    });
    out += `</div>`;
  });

  return out;
}

function _updateSidebar(screenKey) {
  const sideEl = document.getElementById('cb-sidebar-inner');
  if (!sideEl) return;
  const epIdx = (typeof window !== 'undefined') ? window.vpEpNum : null;
  const epRecord = (typeof window !== 'undefined' && epIdx) ? window.gs?.episodeHistory?.[epIdx - 1] : null;
  const ep = (epRecord && epRecord.coachData) ? epRecord : (typeof window !== 'undefined' ? window._cbLastEp : null);
  if (!ep) return;
  sideEl.innerHTML = _buildSidebarContent(ep);
}

// ── Shell — chalkboard + clipboard playbook world ─────────────────────
function _shell(content, ep) {
  return `
<div class="cb-shell" data-phase="board">
<style>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Kalam:wght@400;700&display=swap');

.cb-shell{--cb-board:#173829;--cb-board-dark:#0d2318;--cb-chalk:#f5f2e6;--cb-chalk-yellow:#f0d878;--cb-chalk-pink:#ff9ab3;--cb-chalk-blue:#9ad9e8;--cb-cork:#b0824f;--cb-cork-dark:#7d5a34;--cb-red:#e2564f;--cb-green:#63b892;max-width:1100px;margin:0 auto;font-family:'Kalam',cursive;color:var(--cb-chalk);position:relative;display:grid;grid-template-columns:1fr 260px;gap:16px;}
.cb-shell *{box-sizing:border-box;}

/* ── ambient chalk dust — fixed, sits below the nav bar ── */
.cb-atmo{position:fixed;top:46px;left:0;right:0;bottom:0;z-index:-1;pointer-events:none;overflow:hidden;background:var(--cb-board-dark);}
.cb-dust{position:absolute;width:3px;height:3px;border-radius:50%;background:var(--cb-chalk);opacity:.25;animation:cb-drift 9s linear infinite;}
.cb-dust:nth-child(1){top:10%;left:8%;animation-duration:8s;}
.cb-dust:nth-child(2){top:30%;left:70%;animation-duration:11s;animation-delay:1s;}
.cb-dust:nth-child(3){top:55%;left:22%;animation-duration:7s;animation-delay:2s;}
.cb-dust:nth-child(4){top:75%;left:85%;animation-duration:10s;animation-delay:.5s;}
.cb-dust:nth-child(5){top:20%;left:45%;animation-duration:9s;animation-delay:3s;}
@keyframes cb-drift{0%{transform:translateY(0) translateX(0);opacity:.05;}30%{opacity:.3;}100%{transform:translateY(-60px) translateX(12px);opacity:0;}}

/* ── board header ── */
.cb-board-bg{background:var(--cb-board);border:10px solid #4a3524;border-radius:6px;box-shadow:inset 0 0 60px rgba(0,0,0,0.45),0 6px 18px rgba(0,0,0,0.4);position:relative;padding:0;overflow:hidden;}
.cb-board-bg::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.02) 1px,transparent 1px);background-size:6px 6px;pointer-events:none;}
.cb-board-head{text-align:center;padding:26px 20px 14px;position:relative;}
.cb-board-title{font-family:'Caveat',cursive;font-weight:700;font-size:44px;letter-spacing:1px;color:var(--cb-chalk);text-shadow:0 0 3px rgba(255,255,255,0.15);transform:rotate(-1deg);display:inline-block;}
.cb-board-sub{font-family:'Kalam',cursive;font-size:12px;color:var(--cb-chalk-yellow);letter-spacing:3px;text-transform:uppercase;margin-top:2px;}
.cb-board-underline{width:220px;height:3px;background:var(--cb-chalk);opacity:.6;margin:6px auto 0;border-radius:2px;}

/* ── CSS icon system (no emoji) ── */
.cb-icon{width:24px;height:24px;position:relative;flex-shrink:0;display:inline-block;}
.cb-icon.icon-clipboard{background:var(--cb-chalk-yellow);border-radius:2px;}
.cb-clip-clip{position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:10px;height:6px;background:#8a6a2f;border-radius:2px;}
.cb-icon.icon-whistle{border:2px solid var(--cb-chalk);border-radius:50% 50% 50% 4px;}
.cb-icon.icon-play{border:2px solid var(--cb-chalk);border-radius:50%;}
.cb-play-x,.cb-play-x2{position:absolute;width:2px;height:8px;background:var(--cb-chalk);top:6px;left:7px;}
.cb-play-x{transform:rotate(45deg);}
.cb-play-x2{transform:rotate(-45deg);}
.cb-play-o{position:absolute;width:6px;height:6px;border:2px solid var(--cb-chalk-yellow);border-radius:50%;top:5px;right:4px;}
.cb-play-arrow{position:absolute;bottom:2px;left:3px;width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:7px solid var(--cb-chalk-blue);}
.cb-icon.icon-chalkmark{width:20px;height:20px;}
.cb-icon.icon-chalkmark::before,.cb-icon.icon-chalkmark::after{content:'';position:absolute;top:9px;left:1px;width:18px;height:2px;background:var(--cb-red);}
.cb-icon.icon-chalkmark::before{transform:rotate(30deg);}
.cb-icon.icon-chalkmark::after{transform:rotate(-30deg);}
.cb-icon.icon-star{width:16px;height:16px;background:var(--cb-chalk-yellow);clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);}
.cb-icon.icon-pin{width:10px;height:10px;border-radius:50%;background:var(--cb-red);box-shadow:0 2px 2px rgba(0,0,0,0.4);}

/* ── tribe section on the board ── */
.cb-tribe-block{padding:6px 22px 22px;}
.cb-tribe-name{font-family:'Caveat',cursive;font-weight:700;font-size:26px;color:var(--cb-chalk-blue);border-bottom:2px dashed rgba(154,217,232,0.35);padding-bottom:4px;margin-bottom:10px;transform:rotate(-.4deg);}

/* ── step visibility ── */
.cb-step{display:none;}
.cb-step.cb-visible{display:block;}

/* ── play card (one coaching session) ── */
.cb-play-card{background:rgba(0,0,0,0.18);border:2px dashed rgba(245,242,230,0.35);border-radius:8px;padding:12px 14px;margin:8px 0;position:relative;animation:cb-chalk-write .45s ease-out forwards;}
@keyframes cb-chalk-write{0%{opacity:0;transform:translateY(6px) scale(.98);}100%{opacity:1;transform:translateY(0) scale(1);}}
.cb-play-header{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.cb-play-label{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--cb-chalk-yellow);}
.cb-play-diagram{display:inline-block;margin:2px 0 6px;}
.cb-play-text{font-size:15px;line-height:1.5;color:var(--cb-chalk);}
.cb-play-text strong{color:var(--cb-chalk-yellow);}
.cb-stat{color:var(--cb-chalk-blue);text-transform:uppercase;letter-spacing:1px;font-size:12px;}
.cb-play-gain{margin-top:6px;font-family:'Caveat',cursive;font-weight:700;font-size:20px;color:var(--cb-green);}

/* ── flavor line between sessions ── */
.cb-flavor{text-align:center;font-family:'Caveat',cursive;font-size:15px;color:rgba(245,242,230,0.4);padding:2px 0;font-style:italic;}

/* ── the ledger: passed-over contestants, NOT cards, a marked column ── */
.cb-ledger{background:var(--cb-cork);border:6px solid var(--cb-cork-dark);border-radius:6px;padding:12px 14px;margin-top:14px;box-shadow:inset 0 0 24px rgba(0,0,0,0.25);}
.cb-ledger-title{font-family:'Caveat',cursive;font-weight:700;font-size:20px;color:#2b1c0e;text-align:center;letter-spacing:1px;margin-bottom:8px;}
.cb-ledger-row{display:flex;align-items:center;gap:8px;padding:5px 6px;border-bottom:1px dotted rgba(43,28,14,0.35);}
.cb-ledger-row:last-child{border-bottom:none;}
.cb-ledger-name{font-family:'Kalam',cursive;font-size:14px;color:#2b1c0e;position:relative;}
.cb-ledger-name::after{content:'';position:absolute;left:-2px;right:-2px;top:50%;height:2px;background:var(--cb-red);transform:rotate(-2deg);}
.cb-ledger-coach{margin-left:auto;font-size:10px;color:#5c3f1f;letter-spacing:1px;text-transform:uppercase;}
.cb-ledger-empty{text-align:center;font-size:12px;color:#5c3f1f;padding:6px 0;}

/* ── avatars ── */
.cb-av{width:30px;height:30px;border-radius:50%;border:2px solid var(--cb-chalk);object-fit:cover;vertical-align:middle;}
.cb-av-tiny{width:16px;height:16px;border:1px solid var(--cb-chalk);}

/* ── sticky reveal controls ── */
.cb-controls{position:sticky;bottom:0;z-index:100;display:flex;justify-content:center;align-items:center;gap:14px;padding:8px 20px;background:rgba(13,35,24,0.95);border-top:2px dashed var(--cb-chalk-yellow);border-radius:0 0 6px 6px;}
.cb-btn{padding:7px 18px;border:2px solid var(--cb-chalk-yellow);border-radius:6px;background:transparent;color:var(--cb-chalk-yellow);font-family:'Kalam',cursive;font-size:12px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
.cb-btn:hover{background:var(--cb-chalk-yellow);color:#2b1c0e;}
.cb-btn-primary{background:var(--cb-chalk-yellow);color:#2b1c0e;}
.cb-counter{font-size:11px;color:var(--cb-chalk);letter-spacing:1px;}

/* ── sidebar / clipboard panel ── */
.cb-sidebar{position:sticky;top:16px;align-self:start;}
.cb-clipboard-panel{background:linear-gradient(180deg,#e9dfc4,#d9caa0);border:4px solid #a9784f;border-radius:8px;overflow:hidden;color:#2b1c0e;}
.cb-sb-header{background:var(--cb-cork-dark);color:var(--cb-chalk);font-family:'Caveat',cursive;font-weight:700;font-size:20px;letter-spacing:2px;text-align:center;padding:8px;}
.cb-sb-tribe{padding:10px 12px;border-bottom:1px dashed rgba(43,28,14,0.25);}
.cb-sb-tribe-name{font-family:'Caveat',cursive;font-weight:700;font-size:17px;color:#4a3524;margin-bottom:4px;}
.cb-sb-coach{padding:6px 0;}
.cb-sb-coach-name{font-size:12px;font-weight:700;display:flex;align-items:center;gap:5px;}
.cb-sb-banked{font-size:10px;color:#5c3f1f;margin:2px 0;}
.cb-sb-banked-num{color:#1f6b46;font-weight:700;}
.cb-sb-standing{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;}
.cb-sb-tag{font-size:9px;padding:1px 6px;border-radius:8px;letter-spacing:.5px;}
.cb-sb-tag-in{background:#dcefe0;color:#1f6b46;}
.cb-sb-tag-out{background:#f4d9d7;color:#a3372f;text-decoration:line-through;}

@media(prefers-reduced-motion:reduce){.cb-shell *,.cb-shell *::before,.cb-shell *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}}
@media(max-width:800px){.cb-shell{grid-template-columns:1fr;}.cb-sidebar{position:static;}}
</style>
<div class="cb-atmo"><div class="cb-dust"></div><div class="cb-dust"></div><div class="cb-dust"></div><div class="cb-dust"></div><div class="cb-dust"></div></div>
<div class="cb-main">
${content}
</div>
${_buildSidebar(ep)}
</div>`;
}

// ── VP BUILDER ──────────────────────────────────────────────────────
export function rpBuildCoachBoard(ep) {
  const data = ep && ep.coachData;
  if (!data || typeof data !== 'object' || !Object.keys(data).length) return '';

  const stKey = 'cb-board';
  if (typeof window !== 'undefined') window._cbLastEp = ep;

  let steps = [];
  let stepMeta = [];

  const tribeBlocks = Object.entries(data).map(([tribeName, t]) => {
    const sessions = Array.isArray(t?.sessions) ? t.sessions : [];
    const passedOver = Array.isArray(t?.passedOver) ? t.passedOver : [];

    const sessionHtml = sessions.map(s => {
      const idx = steps.length;
      const gainNum = Number(s.gain) || 0;
      const stepHtml = `<div id="cb-step-board-${idx}" class="cb-step">
        <div class="cb-play-card">
          <div class="cb-play-header">${_icon('clipboard')}<span class="cb-play-label">${s.coach} — private session</span></div>
          <div class="cb-play-diagram">${_icon('play')}</div>
          <div class="cb-play-text">${_avatar(s.coach)} <strong>${s.coach}</strong> pulls ${_avatar(s.contestant)} <strong>${s.contestant}</strong> aside and drills <span class="cb-stat">${s.stat}</span>.</div>
          <div class="cb-play-gain">${_icon('star')} +${gainNum.toFixed(2)} ${s.stat}, banked</div>
        </div>
      </div>`;
      steps.push(stepHtml);
      stepMeta.push({ tribe: tribeName, coach: s.coach, contestant: s.contestant, stat: s.stat, gain: gainNum });
      return stepHtml;
    }).join('');

    const ledgerRows = passedOver.length
      ? passedOver.map(p => `<div class="cb-ledger-row">${_icon('chalkmark')}<span class="cb-ledger-name">${p.contestant}</span><span class="cb-ledger-coach">left off by ${p.coach}</span></div>`).join('')
      : `<div class="cb-ledger-empty">Everyone got a session this week.</div>`;

    return `<div class="cb-tribe-block">
      <div class="cb-tribe-name">${tribeName}</div>
      ${sessionHtml || '<div class="cb-flavor">No sessions ran this week.</div>'}
      <div class="cb-ledger">
        <div class="cb-ledger-title">Left Off the Board</div>
        ${ledgerRows}
      </div>
    </div>`;
  }).join('');

  if (typeof window !== 'undefined') window._cbStepMeta = stepMeta;

  const st = _ensureState(stKey, steps.length);
  // Re-derive visibility classes into the already-built HTML so a re-render
  // reflects the current reveal position (steps.length may be 0).
  const total = steps.length;

  const content = `
    <div class="cb-board-bg">
      <div class="cb-board-head">
        <div class="cb-board-title">The Coaches' Board</div>
        <div class="cb-board-underline"></div>
        <div class="cb-board-sub">Episode ${ep.num || ''} — Who Got Called On</div>
      </div>
      ${tribeBlocks}
      <div id="cb-controls-board" class="cb-controls">
        <button class="cb-btn cb-btn-primary" onclick="coachRevealNext('cb-board',${total})">Reveal Next</button>
        <span id="cb-counter-board" class="cb-counter">${Math.max(0, st.idx + 1)} / ${total}</span>
        <button class="cb-btn" onclick="coachRevealAll('cb-board',${total})">Reveal All</button>
      </div>
    </div>
  `;

  let html = _shell(content, ep);
  // Apply current reveal state to the freshly built markup (mirrors the
  // pattern used on first paint elsewhere: steps already carry cb-visible
  // via st.idx comparisons baked in above would be ideal, but since we build
  // the strings before knowing st, patch visibility here for idx >= 0).
  if (st.idx >= 0) {
    for (let i = 0; i <= st.idx; i++) {
      html = html.replace(`id="cb-step-board-${i}" class="cb-step"`, `id="cb-step-board-${i}" class="cb-step cb-visible"`);
    }
  }
  return html;
}
