import { players } from './core.js';
import { resolveAvatarSlug } from './players.js';

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

// Reveal state lives on window._tvState, not a module-local object — the
// same convention every other twist VP builder follows (see get-a-clue.js
// etc). `_textTwistChallenge` (text-backlog.js) forces every key on
// window._tvState to a fully-revealed idx via a Proxy so the text backlog
// gets the complete session log; a module-local `_tvState` here is invisible
// to that proxy, so the sidebar's reveal-gated totals never see the forced
// reveal and stay stuck at idx -1 (Banked: 0.00) even when the log above
// shows real gains.
function _ensureState(key, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[key]) window._tvState[key] = { idx: -1, total };
  window._tvState[key].total = total;
  return window._tvState[key];
}

/** DOM-safe id fragment for a tribe name. */
function _slugId(name) { return String(name).replace(/\W/g, '') || 'x'; }

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`cb-step-${suffix}-${i}`);
    if (el) el.classList.add('cb-visible');
  }
  // Open each tribe's ledger once that tribe's last session has been revealed.
  for (const g of (window._cbLedgerGates || [])) {
    if (upToIdx >= g.lastStep) {
      const led = document.getElementById(`cb-ledger-${_slugId(g.tribe)}`);
      if (led) led.classList.add('cb-visible');
    }
  }
  const counter = document.getElementById(`cb-counter-${suffix}`);
  // The noun belongs to the screen, not to the helper. Both screens share this
  // reveal code, so the board's "sessions" was being printed over the
  // Signatures' counter on every click.
  const noun = suffix === 'sigs' ? 'signatures' : suffix === 'promo' ? 'promoted' : 'sessions';
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total} ${noun}`;
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

function _fallbackSlug(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Resolve a portrait slug the same way the rest of the app does — via the
// roster record's resolveAvatarSlug() (which knows about -returnee variants),
// not a guess from the display name. Falls back to a slugified name for
// contestants/coaches that aren't in `players` (shouldn't happen, but a
// blank hole is worse than a slightly-wrong guess).
function _avatarSlug(name) {
  const p = players.find(x => x.name === name);
  if (p) {
    try {
      const slug = resolveAvatarSlug(p);
      if (slug) return slug;
    } catch { /* fall through to guess */ }
  }
  return _fallbackSlug(name);
}

// A portrait with a mandatory text fallback — a missing PNG must degrade to
// a name/initial, never a blank hole. `cls` may include size (cb-av-tiny)
// and/or a background hint (cb-av-onlight) for cork/parchment contexts.
function _avatar(name, cls = '') {
  const slug = _avatarSlug(name);
  const init = (name || '?')[0].toUpperCase();
  return `<span class="cb-av-wrap"><img class="cb-av ${cls}" src="assets/avatars/${slug}.png" alt="${name}" title="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex'"><span class="cb-av-fallback ${cls}" style="display:none">${init}</span></span>`;
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
  const st = (typeof window !== 'undefined' && window._tvState) ? window._tvState['cb-board'] : null;
  const revealIdx = st ? st.idx : -1;
  const meta = (typeof window !== 'undefined' && window._cbStepMeta) ? window._cbStepMeta : [];

  // Banked total per coach, gated to what has actually been revealed.
  const bankedByCoach = {};
  const trainedByCoach = {};
  for (let i = 0; i <= revealIdx && i < meta.length; i++) {
    const m = meta[i];
    bankedByCoach[m.coach] = (bankedByCoach[m.coach] || 0) + Number(m.gain || 0);
    if (!trainedByCoach[m.coach]) trainedByCoach[m.coach] = [];
    trainedByCoach[m.coach].push({ name: m.contestant, gain: Number(m.gain) || 0 });
  }

  let out = `<div class="cb-sb-header">THE BOARD</div>`;

  Object.entries(data).forEach(([tribeName, t]) => {
    const coaches = [...new Set([
      ...(t.sessions || []).map(s => s.coach),
      ...(t.passedOver || []).map(p => p.coach),
    ])];
    const _card = t.card ?? 'unused';
    out += `<div class="cb-sb-tribe"><div class="cb-sb-tribe-name">${tribeName}</div>
      <div class="cb-sb-card ${_card === 'unused' ? 'cb-sb-card-held' : 'cb-sb-card-spent'}">Save card: ${_card === 'unused' ? 'HELD' : 'SPENT'} · one between ${coaches.length === 1 ? 'them' : 'the ' + coaches.length}</div>`;
    coaches.forEach(coach => {
      const banked = bankedByCoach[coach] || 0;
      const trained = trainedByCoach[coach] || [];
      const passed = (t.passedOver || []).filter(p => p.coach === coach).map(p => p.contestant);
      out += `<div class="cb-sb-coach">
        <div class="cb-sb-coach-name">${_avatar(coach, 'cb-av-tiny cb-av-onlight')} ${coach}</div>
        <div class="cb-sb-banked">Banked: <span class="cb-sb-banked-num">${banked.toFixed(2)}</span></div>

        <div class="cb-sb-standing">
          ${trained.map(o => `<span class="cb-sb-tag ${o.gain < 0 ? 'cb-sb-tag-damaged' : 'cb-sb-tag-in'}">${_avatar(o.name, 'cb-av-tiny cb-av-onlight')} ${o.name}</span>`).join('')}
          ${passed.map(n => `<span class="cb-sb-tag cb-sb-tag-out" title="no session — passed over by ${coach}">${_avatar(n, 'cb-av-tiny cb-av-onlight')} ${n}</span>`).join('')}
        </div>
      </div>`;
    });
    out += `</div>`;
  });

  // The rule, said once, where it is being used. Nothing in the season ever
  // told the viewer what the card was or who gets a say in it.
  const _anyPeer = Object.values(data).some(t => (t.peerCount || 0) > 1);
  out += `<div class="cb-sb-legend">
    <div class="cb-sb-legend-title">The Save Card</div>
    <div>One card for the whole coaching staff, not one each. If the tribe votes a coach out, ${_anyPeer
      ? 'the other coaches on that team can spend it to keep them — and every one of them has to agree. A single refusal sends the coach home.'
      : 'with no other coach left on the team there is nobody to withhold a signature, so it carries on its own.'}</div>
    <div>Spent, it costs a contestant: the coach names who goes instead.</div>
  </div>`;

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
.cb-ledger-gated{display:none;}
.cb-promo-intro{font-size:12px;line-height:1.6;opacity:.85;margin:0 0 14px;padding:10px 12px;border-left:3px solid var(--cb-chalk-yellow);background:rgba(0,0,0,0.18);border-radius:0 6px 6px 0;}
.cb-promo-card{margin:10px 0;padding:12px 14px;border-radius:8px;background:rgba(0,0,0,0.22);border-left:5px solid;}
.cb-promo-strong{border-color:#3fb950;}
.cb-promo-thin{border-color:#8a8175;}
.cb-promo-head{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
.cb-promo-name{font-family:'Caveat',cursive;font-size:26px;font-weight:700;line-height:1;}
.cb-promo-role{font-size:9px;letter-spacing:2px;font-weight:800;opacity:.7;}
.cb-promo-text{font-size:12px;line-height:1.55;}
.cb-promo-proteges{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px;}
.cb-av-big{width:46px;height:46px;border-radius:6px;object-fit:cover;}
.cb-sig-block{margin:14px 0;padding:10px 12px;border:2px dashed rgba(245,242,230,0.25);border-radius:8px;}
.cb-sig-title{font-family:'Caveat',cursive;font-size:22px;font-weight:700;color:var(--cb-chalk-yellow);}
.cb-sig-sub{font-size:11px;opacity:.75;margin-bottom:8px;}
.cb-sig-card{display:flex;align-items:center;gap:10px;padding:8px 10px;margin:6px 0;border-radius:6px;background:rgba(0,0,0,0.22);border-left:4px solid;}
.cb-sig-yes{border-color:#3fb950;}
.cb-sig-no{border-color:#f85149;}
.cb-sig-head{display:flex;align-items:center;gap:6px;font-weight:700;font-size:13px;min-width:150px;}
.cb-sig-mark{font-family:'Caveat',cursive;font-size:24px;font-weight:700;letter-spacing:1px;min-width:110px;}
.cb-sig-yes .cb-sig-mark{color:#3fb950;}
.cb-sig-no .cb-sig-mark{color:#f85149;}
.cb-sig-why{font-size:11px;opacity:.8;flex:1;}
.cb-sig-outcome{margin-top:8px;padding:8px 10px;border-radius:6px;font-size:12px;font-weight:600;background:rgba(0,0,0,0.28);border-left:4px solid;}
.cb-sb-card{font-size:9px;letter-spacing:1px;font-weight:800;margin-top:2px;}
.cb-sb-card-held{color:#1f7a3d;}
.cb-sb-card-spent{color:#8a8175;text-decoration:line-through;}
.cb-sb-legend{margin-top:10px;padding:8px 9px;border-top:2px dashed rgba(43,28,14,0.3);font-size:10px;line-height:1.45;color:#3d2a15;}
.cb-sb-legend-title{font-family:'Caveat',cursive;font-weight:700;font-size:16px;color:#2b1c0e;margin-bottom:3px;}
.cb-sb-legend div+div{margin-top:4px;}
.cb-ledger-gated.cb-visible{display:block;}
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
.cb-play-gain.cb-play-loss{color:var(--cb-red);}

/* ── flavor line between sessions ── */
.cb-flavor{text-align:center;font-family:'Caveat',cursive;font-size:15px;color:rgba(245,242,230,0.4);padding:2px 0;font-style:italic;}

/* ── the ledger: passed-over contestants, NOT cards, a marked column ── */
.cb-ledger{background:var(--cb-cork);border:6px solid var(--cb-cork-dark);border-radius:6px;padding:12px 14px;margin-top:14px;box-shadow:inset 0 0 24px rgba(0,0,0,0.25);}
.cb-ledger-title{font-family:'Caveat',cursive;font-weight:700;font-size:20px;color:#2b1c0e;text-align:center;letter-spacing:1px;margin-bottom:8px;}
.cb-ledger-row{display:flex;align-items:center;gap:8px;padding:5px 6px;border-bottom:1px dotted rgba(43,28,14,0.35);}
.cb-ledger-row:last-child{border-bottom:none;}
/* skipped by EVERY coach on the tribe — the unanimous, most pointed slight */
.cb-ledger-row-total{background:rgba(226,86,79,0.14);border-radius:4px;box-shadow:inset 3px 0 0 var(--cb-red);}
.cb-ledger-row-total .cb-ledger-coach{color:#a3372f;font-weight:700;}
.cb-ledger-name{font-family:'Kalam',cursive;font-size:14px;color:#2b1c0e;position:relative;}
.cb-ledger-name::after{content:'';position:absolute;left:-2px;right:-2px;top:50%;height:2px;background:var(--cb-red);transform:rotate(-2deg);}
.cb-ledger-coach{margin-left:auto;font-size:10px;color:#5c3f1f;letter-spacing:1px;text-transform:uppercase;}
.cb-ledger-empty{text-align:center;font-size:12px;color:#5c3f1f;padding:6px 0;}

/* ── avatars — chalkboard portraits, with a text-fallback for missing PNGs ── */
.cb-av-wrap{display:inline-flex;vertical-align:middle;}
.cb-av{width:30px;height:30px;border-radius:50%;border:2px solid var(--cb-chalk);object-fit:cover;vertical-align:middle;}
.cb-av-tiny{width:16px;height:16px;border-width:1px;}
.cb-av-fallback{display:none;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;border:2px solid var(--cb-chalk);background:rgba(245,242,230,0.15);color:var(--cb-chalk);font-family:'Caveat',cursive;font-weight:700;font-size:15px;line-height:1;}
.cb-av-fallback.cb-av-tiny{width:16px;height:16px;font-size:9px;border-width:1px;}
/* on cork/parchment backgrounds (ledger, sidebar) the chalk-white border and
   fill are invisible — swap to the cork-dark palette so it reads there too. */
.cb-av.cb-av-onlight,.cb-av-fallback.cb-av-onlight{border-color:var(--cb-cork-dark);}
.cb-av-fallback.cb-av-onlight{background:rgba(125,90,52,0.18);color:#2b1c0e;}

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
.cb-sb-tag{display:inline-flex;align-items:center;gap:3px;font-size:9px;padding:1px 6px 1px 3px;border-radius:8px;letter-spacing:.5px;}
.cb-sb-tag-in{background:#dcefe0;color:#1f6b46;}
.cb-sb-tag-out{background:#f4d9d7;color:#a3372f;text-decoration:line-through;}
.cb-sb-tag-damaged{background:#f7e0b3;color:#8a4b12;}

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

// A coach below 5 in the taught stat teaches badly — the session damages the
// contestant instead of helping them. That has to read as damage: different
// wording, not just a different sign on the same sentence.
const _COACH_DRILL_TEXT_POSITIVE = [
  (s) => `${_avatar(s.coach)} <strong>${s.coach}</strong> pulls ${_avatar(s.contestant)} <strong>${s.contestant}</strong> aside and drills <span class="cb-stat">${s.stat}</span>.`,
  (s) => `${_avatar(s.coach)} <strong>${s.coach}</strong> walks ${_avatar(s.contestant)} <strong>${s.contestant}</strong> through a private <span class="cb-stat">${s.stat}</span> session.`,
  (s) => `${_avatar(s.coach)} <strong>${s.coach}</strong> spends the block breaking down <span class="cb-stat">${s.stat}</span> with ${_avatar(s.contestant)} <strong>${s.contestant}</strong>.`,
  (s) => `${_avatar(s.coach)} <strong>${s.coach}</strong> and ${_avatar(s.contestant)} <strong>${s.contestant}</strong> run drill after drill on <span class="cb-stat">${s.stat}</span> until it holds.`,
];
const _COACH_DRILL_TEXT_NEGATIVE = [
  (s) => `${_avatar(s.coach)} <strong>${s.coach}</strong> pulls ${_avatar(s.contestant)} <strong>${s.contestant}</strong> aside for a <span class="cb-stat">${s.stat}</span> session that leaves ${s.contestant} worse off than before it started.`,
  (s) => `${_avatar(s.coach)} <strong>${s.coach}</strong> tries to coach ${_avatar(s.contestant)} <strong>${s.contestant}</strong> up on <span class="cb-stat">${s.stat}</span> and mostly just confuses the fundamentals.`,
  (s) => `${_avatar(s.coach)} <strong>${s.coach}</strong> talks ${_avatar(s.contestant)} <strong>${s.contestant}</strong> through <span class="cb-stat">${s.stat}</span>, and the advice does not hold up.`,
  (s) => `${_avatar(s.coach)} <strong>${s.coach}</strong> runs a <span class="cb-stat">${s.stat}</span> drill with ${_avatar(s.contestant)} <strong>${s.contestant}</strong> that undoes more than it teaches.`,
];
function _seedIndex(str, n) {
  let h = 0;
  for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % n;
}

// A passed-over contestant got NO coaching session from a coach this
// episode, while their tribemates got pulled aside and drilled. That's the
// resentment engine this whole ledger exists for — the wording has to say
// so plainly, not read as a data gap.
//
// One row per CONTESTANT (not one row per coach who skipped them) — a
// contestant skipped by every coach on their tribe has nobody in their
// corner, which is a materially different, more pointed story than being
// skipped by one coach who trained someone else this week. Escalate the
// wording when the skip is unanimous.
function _joinCoaches(coaches) {
  if (coaches.length === 1) return `<strong>${coaches[0]}</strong>`;
  if (coaches.length === 2) return `<strong>${coaches[0]}</strong> or <strong>${coaches[1]}</strong>`;
  const head = coaches.slice(0, -1).map(c => `<strong>${c}</strong>`).join(', ');
  return `${head}, or <strong>${coaches[coaches.length - 1]}</strong>`;
}
const _PASSED_OVER_TEXT = [
  (p) => `no session from ${p.coachList} tonight`,
  (p) => `${p.coachList} never called ${p.contestant}'s name`,
  (p) => `passed over while the rest of the board got drilled by ${p.coachList}`,
  (p) => `sat out ${p.coachList}'s sessions this week`,
];
const _PASSED_OVER_ALL_TEXT = [
  (p) => `every coach on the tribe skipped ${p.contestant} tonight — nobody trained them`,
  (p) => `not one session, from anyone — ${p.contestant} is on their own`,
  (p) => `the whole coaching staff passed on ${p.contestant} this week`,
  (p) => `called on by nobody — a clean sweep of neglect`,
];
function _passedOverLine(p) {
  const unanimous = p.allCoaches && p.coaches.length > 1;
  const pool = unanimous ? _PASSED_OVER_ALL_TEXT : _PASSED_OVER_TEXT;
  return pool[_seedIndex(`${p.contestant}|${p.coaches.join(',')}|passedover`, pool.length)](p);
}

// ── VP BUILDER ──────────────────────────────────────────────────────
export function rpBuildCoachBoard(ep) {
  const data = ep && ep.coachData;
  if (!data || typeof data !== 'object' || !Object.keys(data).length) return '';

  const stKey = 'cb-board';
  if (typeof window !== 'undefined') window._cbLastEp = ep;

  let steps = [];
  let stepMeta = [];
  const ledgerGates = [];

  const tribeBlocks = Object.entries(data).map(([tribeName, t]) => {
    const sessions = Array.isArray(t?.sessions) ? t.sessions : [];
    const passedOver = Array.isArray(t?.passedOver) ? t.passedOver : [];

    const _tribeFirstStep = steps.length;
    const sessionHtml = sessions.map(s => {
      const idx = steps.length;
      const gainNum = Number(s.gain) || 0;
      const isDamaging = gainNum < 0;
      const drillPool = isDamaging ? _COACH_DRILL_TEXT_NEGATIVE : _COACH_DRILL_TEXT_POSITIVE;
      const drillText = drillPool[_seedIndex(`${s.coach}|${s.contestant}|${s.stat}`, drillPool.length)](s);
      const sign = gainNum < 0 ? '' : '+';
      const gainLabel = isDamaging ? `${sign}${gainNum.toFixed(2)} ${s.stat}, cost` : `${sign}${gainNum.toFixed(2)} ${s.stat}, banked`;
      const stepHtml = `<div id="cb-step-board-${idx}" class="cb-step">
        <div class="cb-play-card">
          <div class="cb-play-header">${_icon('clipboard')}${_avatar(s.coach, 'cb-av-tiny')}<span class="cb-play-label">${s.coach} — private session</span></div>
          <div class="cb-play-diagram">${_icon('play')}</div>
          <div class="cb-play-text">${drillText}</div>
          <div class="cb-play-gain${isDamaging ? ' cb-play-loss' : ''}">${_icon('star')} ${gainLabel}</div>
        </div>
      </div>`;
      steps.push(stepHtml);
      stepMeta.push({ tribe: tribeName, coach: s.coach, contestant: s.contestant, stat: s.stat, gain: gainNum });
      return stepHtml;
    }).join('');

    // The visual gap between name and reason is CSS (`flex; gap:8px`), which
    // doesn't survive `_textStripHtml`'s tag-stripping in the text backlog —
    // that left every line reading "P2left off by Coach_Ravu_1" with zero
    // space. A literal space between the two spans fixes both renderings:
    // CSS still owns the visual gap, and stripped text now separates them.
    //
    // "left off by X" reads as missing data, not as the slight it is: this
    // contestant got no coaching session from X tonight while their
    // tribemates were pulled aside and trained. Spell that out, and rotate
    // the phrasing so the ledger doesn't repeat itself episode to episode.
    // Group by CONTESTANT, not by coach — a contestant skipped by both
    // coaches on their tribe belongs on one row naming both, not two
    // separate rows that hide how total the neglect was.
    const tribeCoaches = [...new Set([
      ...sessions.map(s => s.coach),
      ...passedOver.map(p => p.coach),
    ])];
    const skippedBy = {};
    passedOver.forEach(p => {
      if (!skippedBy[p.contestant]) skippedBy[p.contestant] = [];
      if (!skippedBy[p.contestant].includes(p.coach)) skippedBy[p.contestant].push(p.coach);
    });
    const skippedNames = Object.keys(skippedBy);
    const ledgerRows = skippedNames.length
      ? skippedNames.map(contestant => {
          const coaches = skippedBy[contestant];
          const allCoaches = tribeCoaches.length > 1 && coaches.length >= tribeCoaches.length;
          const line = _passedOverLine({ contestant, coaches, coachList: _joinCoaches(coaches), allCoaches });
          return `<div class="cb-ledger-row${allCoaches ? ' cb-ledger-row-total' : ''}">${_icon('chalkmark')}${_avatar(contestant, 'cb-av-tiny cb-av-onlight')}<span class="cb-ledger-name">${contestant}</span> <span class="cb-ledger-coach">${line}</span></div>`;
        }).join('')
      : `<div class="cb-ledger-empty">Everyone got a session this week.</div>`;

    // The ledger waits for this tribe's last session. It is the ANSWER to the
    // cards above it — who was left out only means anything once you have seen
    // who was called on — and while it rendered immediately it also sat under
    // every hidden card, so each reveal pushed it down and read as cards
    // arriving at the top of the board.
    const _tribeLastStep = steps.length - 1;
    ledgerGates.push({ tribe: tribeName, lastStep: _tribeLastStep });
    const _ledgerOpen = _tribeLastStep < _tribeFirstStep;  // no sessions: nothing to wait for
    return `<div class="cb-tribe-block">
      <div class="cb-tribe-name">${tribeName}</div>
      ${sessionHtml || '<div class="cb-flavor">No sessions ran this week.</div>'}
      <div id="cb-ledger-${_slugId(tribeName)}" class="cb-ledger cb-ledger-gated${_ledgerOpen ? ' cb-visible' : ''}" data-laststep="${_tribeLastStep}">
        <div class="cb-ledger-title">Passed Over Tonight</div>
        ${ledgerRows}
      </div>
    </div>`;
  }).join('');

  if (typeof window !== 'undefined') {
    window._cbStepMeta = stepMeta;
    window._cbLedgerGates = ledgerGates;
  }

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
        <span id="cb-counter-board" class="cb-counter">${Math.max(0, st.idx + 1)} / ${total} sessions</span>
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
    // A re-render (screen switch, replay) must reopen the ledgers the viewer
    // had already earned, or they snap shut on every repaint.
    for (const g of ledgerGates) {
      if (st.idx >= g.lastStep) {
        html = html.replace(`id="cb-ledger-${_slugId(g.tribe)}" class="cb-ledger cb-ledger-gated"`,
          `id="cb-ledger-${_slugId(g.tribe)}" class="cb-ledger cb-ledger-gated cb-visible"`);
      }
    }
  }
  return html;
}


/**
 * THE SIGNATURES — the sealed half of the save card, read like a vote.
 *
 * The peers signed or refused at the moment the card was committed, before a
 * single ballot was read, and the coach it was played for did not know which.
 * Reading them one at a time is not decoration: it is the only moment in the
 * season where the coach-vs-coach relationship is settled in public, and a
 * refusal read out is a season-long grudge starting on camera.
 */
export function rpBuildCoachSignatures(ep) {
  const commits = ep.coachCardCommits || [];
  if (!commits.length) return '';
  const stKey = 'cb-sigs';
  const total = commits.reduce((n, c) => n + (c.votes || []).length, 0);
  const st = _ensureState(stKey, total);

  const WHY = {
    'costs-my-protege': 'it would have cost them their own protégé',
    'returning-the-favour': 'they were refused once, and remember it',
    'pact-already-broken': 'the pact between them was already broken',
    'bad-blood': 'there was never going to be a favour here',
    'rival-outbuilding': 'the coach they were asked to save has built more of this tribe',
    'strategic': 'the arithmetic did not come out in their favour',
    'unconvinced': 'they were not convinced',
    'debt': 'they owed this one, and paid it',
    'pact': 'a pact between them is still standing',
    'allied': 'they run together',
    'friendship': 'they are friends, and it was never in doubt',
    'decency': 'no reason beyond the plain one',
  };

  let idx = 0;
  const blocks = commits.map(cm => {
    const rows = (cm.votes || []).map(v => {
      const i = idx++;
      return `<div id="cb-step-sigs-${i}" class="cb-step">
        <div class="cb-sig-card ${v.consents ? 'cb-sig-yes' : 'cb-sig-no'}">
          <div class="cb-sig-head">${_avatar(v.coach, 'cb-av-tiny')}<span>${v.coach}</span></div>
          <div class="cb-sig-mark">${v.consents ? 'SIGNED' : 'REFUSED'}</div>
          <div class="cb-sig-why">${WHY[v.reason] || 'no reason given'}</div>
        </div>
      </div>`;
    }).join('');
    const outcome = cm.signed
      ? `<div class="cb-sig-outcome cb-sig-yes">Unanimous. The card is live for ${cm.coach} — if the votes come for ${cm.coach} tonight, ${cm.coach} stays.</div>`
      : `<div class="cb-sig-outcome cb-sig-no">Not unanimous. ${cm.refusedBy
          ? `${cm.refusedBy} would not sign, so it does not carry tonight — and ${cm.coach} has nothing to hide behind when the votes are read.`
          : 'It does not carry tonight.'} The card itself is not spent: it was never played, only refused, and it is still there for whoever is left to ask again.</div>`;
    return `<div class="cb-sig-block">
      <div class="cb-sig-title">${cm.coach} played the save card</div>
      <div class="cb-sig-sub">Sealed before a single vote was read. ${cm.coach} does not know what is in these.</div>
      ${rows}
      <div id="cb-step-sigs-${idx++}" class="cb-step">${outcome}</div>
    </div>`;
  }).join('');

  const realTotal = idx;
  _ensureState(stKey, realTotal).total = realTotal;

  let html = _shell(`<div class="cb-board-bg">
    <div class="cb-board-head">
      <div class="cb-board-title">The Signatures</div>
      <div class="cb-board-underline"></div>
      <div class="cb-board-sub">Episode ${ep.num || ''} — the card only works if every coach signs</div>
    </div>
    ${blocks}
    <div id="cb-controls-sigs" class="cb-controls">
      <button class="cb-btn cb-btn-primary" onclick="coachRevealNext('cb-sigs',${realTotal})">Read Next</button>
      <span id="cb-counter-sigs" class="cb-counter">${Math.max(0, st.idx + 1)} / ${realTotal} signatures</span>
      <button class="cb-btn" onclick="coachRevealAll('cb-sigs',${realTotal})">Read All</button>
    </div>
  </div>`, ep);

  if (st.idx >= 0) {
    for (let i = 0; i <= st.idx; i++) {
      html = html.replace(`id="cb-step-sigs-${i}" class="cb-step"`, `id="cb-step-sigs-${i}" class="cb-step cb-visible"`);
    }
  }
  return html;
}


/**
 * PROMOTION — the only thing a coach was ever playing for.
 *
 * They train people who can beat them, hold advantages they are not allowed to
 * use, sit at a tribal they cannot vote at, and do all of it to reach one
 * moment. That moment resolved as a line in `ep.coachPromotions` and nothing
 * drew it: the twist's entire payoff happened off-screen.
 *
 * What each of them brings is the season they just had. A coach who trained
 * people who are still standing arrives sharper (the stake), and a coach who
 * trained nobody, or trained people who are already gone, arrives with the
 * weakness the design intends: a whole pre-merge spent making other people
 * better and nothing banked on themselves.
 */
export function rpBuildCoachPromotion(ep) {
  const promos = ep.coachPromotions || [];
  if (!promos.length) return '';
  const stKey = 'cb-promo';
  const st = _ensureState(stKey, promos.length);

  const cards = promos.map((p, i) => {
    const surviving = p.surviving || [];
    const stake = Number(p.stake) || 0;
    const line = stake > 0
      ? `${surviving.length} of ${p.name}'s protégé${surviving.length === 1 ? '' : 's'} made it here too. ${p.name} arrives with +${stake.toFixed(2)} strategic for it — the only training ${p.name} has ever banked on themselves.`
      : `${p.name} arrives with nothing banked. Every session went into somebody else, and none of those people are still here.`;
    return `<div id="cb-step-promo-${i}" class="cb-step">
      <div class="cb-promo-card ${stake > 0 ? 'cb-promo-strong' : 'cb-promo-thin'}">
        <div class="cb-promo-head">${_avatar(p.name, 'cb-av-big')}<div>
          <div class="cb-promo-name">${p.name}</div>
          <div class="cb-promo-role">Coach → Player</div>
        </div></div>
        <div class="cb-promo-text">${line}</div>
        ${surviving.length ? `<div class="cb-promo-proteges">${surviving.map(n => `<span class="cb-sb-tag cb-sb-tag-in">${_avatar(n, 'cb-av-tiny cb-av-onlight')} ${n}</span>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  let html = _shell(`<div class="cb-board-bg">
    <div class="cb-board-head">
      <div class="cb-board-title">The Staff Joins the Game</div>
      <div class="cb-board-underline"></div>
      <div class="cb-board-sub">Episode ${ep.num || ''} &mdash; ${promos.length === 1 ? 'a coach' : `${promos.length} coaches`} reached the merge</div>
    </div>
    <div class="cb-promo-intro">They have not competed for a single thing. No challenge, no immunity, no vote. Everything they know about this cast, they learned teaching it to the people they now have to beat &mdash; and every advantage they found went into somebody else's hands.<br><br>From tonight they are players.</div>
    ${cards}
    <div id="cb-controls-promo" class="cb-controls">
      <button class="cb-btn cb-btn-primary" onclick="coachRevealNext('cb-promo',${promos.length})">Call Them Up</button>
      <span id="cb-counter-promo" class="cb-counter">${Math.max(0, st.idx + 1)} / ${promos.length} promoted</span>
      <button class="cb-btn" onclick="coachRevealAll('cb-promo',${promos.length})">Call Them All</button>
    </div>
  </div>`, ep);

  if (st.idx >= 0) {
    for (let i = 0; i <= st.idx; i++) {
      html = html.replace(`id="cb-step-promo-${i}" class="cb-step"`, `id="cb-step-promo-${i}" class="cb-step cb-visible"`);
    }
  }
  return html;
}
