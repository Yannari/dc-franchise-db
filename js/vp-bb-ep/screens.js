// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/screens.js — a Big Brother week as a TV programme (Phase 2)
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-01 §4.7, the Circle's pattern (js/vp-ci/screens.js): one screen
// per scene or ceremony from steps.js, one click per line, the script under
// the stage lighting up line by line, a sidebar that shows only what has
// played. The legacy screens this replaces are the week's core loop and its
// House Life; every TWIST screen the legacy builder draws is kept, placed after
// the part of the week it belongs to (spec decision D1).
//
// Switch back to the old screens: localStorage 'bb-classic-vp' = '1'.
import { bbWeekSteps, REPLACED, ANCHOR_OF } from './steps.js';
import { stageHtml, camStyle, esc, col, img, eyeSvg, SEASON_DIR } from './stage.js';
import { BBX_CSS, BBX_FONTS } from './style.js';

const reg = () => (typeof window !== 'undefined' ? (window._bbx ||= {}) : (globalThis._bbx ||= {}));
const SHELL_CSS = `
.bbx{--bbx-line:rgba(255,255,255,.12);color:#e8eefb;font-family:Archivo,system-ui,sans-serif;max-width:1180px;margin:0 auto}
.bbx .bbx-stage{position:relative;aspect-ratio:16/9;container-type:inline-size;overflow:hidden;border-radius:14px;background:#03050a;cursor:pointer;user-select:none;isolation:isolate;box-shadow:0 0 0 1px rgba(34,225,255,.18),0 30px 70px -20px rgba(0,20,60,.55)}
.bbx .bbx-ctrl{display:flex;gap:6px;align-items:center;margin:10px 0 0;flex-wrap:wrap}
.bbx .bbx-btn{border:1px solid var(--bbx-line);background:#0d1220;color:#e8eefb;border-radius:8px;padding:8px 12px;font:600 11px 'Chakra Petch',monospace;letter-spacing:1.3px;text-transform:uppercase;cursor:pointer}
.bbx .bbx-btn.main{background:#22e1ff;color:#001018;border-color:#22e1ff}
.bbx .bbx-btn.on{border-color:#22e1ff;color:#22e1ff}
.bbx .bbx-count{margin-left:auto;font:600 10.5px 'Chakra Petch',monospace;color:#7d89a3;letter-spacing:1.4px}
.bbx .bbx-under{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:12px;margin-top:12px}
@media(max-width:900px){.bbx .bbx-under{grid-template-columns:minmax(0,1fr)}}
.bbx .bbx-script{border:1px solid var(--bbx-line);background:#0d1220;border-radius:10px;padding:12px 14px;max-height:240px;overflow:auto}
.bbx .bbx-ln{display:none;grid-template-columns:110px 1fr;gap:10px;font-size:13.5px;line-height:1.5;padding:3px 0;color:#9aa6c0}
.bbx .bbx-ln.vis{display:grid}.bbx .bbx-ln.now{color:#fff}
.bbx .bbx-who{font-weight:800;text-transform:uppercase;letter-spacing:.4px;font-size:12px;color:#fff}
.bbx .bbx-who.dr{color:#f5c542}.bbx .bbx-who.bb{color:#22e1ff}.bbx .bbx-who.cc{color:#7d89a3;font:600 10px 'Chakra Petch',monospace;letter-spacing:1.4px;padding-top:3px}
.bbx .bbx-empty{font-size:12.5px;color:#7d89a3;font-style:italic}
.bbx .bbx-side{display:flex;flex-direction:column;gap:10px}
.bbx .bbx-panel{border:1px solid var(--bbx-line);background:#0d1220;border-radius:10px;padding:11px 12px}
.bbx .bbx-panel h4{margin:0 0 8px;font:600 10px 'Chakra Petch',monospace;letter-spacing:2px;color:#7d89a3;text-transform:uppercase}
.bbx .bbx-row{display:flex;align-items:center;gap:8px;padding:3px 0;font-size:13px}
.bbx .bbx-row b{font-weight:800;text-transform:uppercase;font-size:12.5px}
.bbx .bbx-tag{margin-left:auto;font:700 9px 'Chakra Petch',monospace;letter-spacing:1.2px;padding:2px 6px;border-radius:4px;text-transform:uppercase}
.bbx .bbx-tag.hoh{background:#f5c542;color:#2a1d00}.bbx .bbx-tag.nom{background:#ff3355;color:#fff}.bbx .bbx-tag.veto{border:1px solid #d9a520;color:#d9a520}.bbx .bbx-tag.out{background:#1f2533;color:#7d89a3}
.bbx .bbx-mini{width:26px;height:26px;border-radius:7px;overflow:hidden;flex:none;position:relative;background:var(--c)}
.bbx .bbx-mini img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .bbx-pend{font-size:12px;color:#7d89a3;font-style:italic}
#visual-player.bbx-tv .bbx .bbx-under{display:none}
`;

const mini = n => `<span class="bbx-mini" style="--c:${col(n)}">${img(n)}</span>`;

function scriptHtml(S) {
  return S.steps.map((st, i) => {
    const who = st.k === 'beat' ? '<span class="bbx-who cc">[ CC ]</span>'
      : st.k === 'bb' ? '<span class="bbx-who bb">Big Brother</span>'
        : st.k === 'dr' ? `<span class="bbx-who dr">${esc(st.by)} · DR</span>`
          : `<span class="bbx-who">${esc(st.by)}${st.k === 'host' ? ' (live)' : ''}</span>`;
    return `<div class="bbx-ln" data-s="${i}">${who}<span>${st.k === 'beat' ? `<i>${esc(st.t)}</i>` : esc(st.t)}</span></div>`;
  }).join('') || '<div class="bbx-empty">Nothing aired here.</div>';
}

function sideHtml(L, S) {
  const row = (n, tag, cls) => `<div class="bbx-row">${mini(n)}<b>${esc(n)}</b><span class="bbx-tag ${cls}">${tag}</span></div>`;
  return `<div class="bbx-panel"><h4>Week ${esc(S.week)}</h4>
      ${L.hoh ? row(L.hoh, 'HOH', 'hoh') : '<div class="bbx-pend">No Head of Household yet.</div>'}
      ${L.nom.map(n => row(n, L.out.includes(n) ? 'Evicted' : 'Nominated', L.out.includes(n) ? 'out' : 'nom')).join('')}
      ${L.veto ? row(L.veto, 'Veto', 'veto') : ''}</div>
    ${L.vetoPlay.length ? `<div class="bbx-panel"><h4>Veto players</h4>${[...new Set(L.vetoPlay)].map(n => row(n, 'Plays', '')).join('')}</div>` : ''}
    ${L.ballots.length ? `<div class="bbx-panel"><h4>The vote · the house can't see this</h4>${L.ballots.map(([v, e]) => row(v, `evict ${esc(e)}`, 'nom')).join('')}</div>` : ''}`;
}

function seasonOf(row) { return SEASON_DIR[row.themeId] || 'default'; }

/**
 * The week's VP screens. `legacy` is buildBBWeekScreens(row): its core-loop
 * and House Life screens are replaced; its twist screens are kept, after the
 * part of the week they follow.
 */
export function bbStepScreens(row, legacy = [], { host = 'Valeria', priorEvicted = [] } = {}) {
  const steps = bbWeekSteps(row, { host, priorEvicted });
  if (!steps.length) return legacy;
  const o = { season: seasonOf(row), host };
  // twist screens, by the anchor they followed in the old running order
  const after = { start: [], hoh: [], noms: [], veto: [], cer: [], evict: [] };
  let anchor = 'start';
  for (const L of legacy) {
    const a = ANCHOR_OF(L.id);
    if (a) { anchor = a; continue; }
    if (REPLACED.test(L.id)) continue;
    after[anchor].push(L);
  }
  const out = [...after.start];
  const placed = new Set(['start']);
  steps.forEach((S, si) => {
    const uid = `bbx${esc(row.num)}-${si}`;
    reg()[uid] = { screens: steps, si, idx: -1, o, auto: false, timer: null };
    out.push({
      id: S.id === 'bb-house-v' ? `bb-house-v${si}` : (S.kind === 'scene' ? S.id : `${S.id}${si}`),
      label: S.title,
      html: `<div class="bbx" data-uid="${uid}"><style>${BBX_FONTS}${BBX_CSS}${SHELL_CSS}</style>
  <div class="bbx-stage stage" id="bbx-st-${uid}" onclick="bbxNext('${uid}')" title="Click for the next line">${stageHtml(steps, si, -1, false, o).html}</div>
  <div class="bbx-ctrl">
    <button type="button" class="bbx-btn" onclick="bbxBack('${uid}')">◀ Back</button>
    <button type="button" class="bbx-btn main" onclick="bbxNext('${uid}')">Next ▶</button>
    <button type="button" class="bbx-btn" onclick="bbxAll('${uid}')">Reveal all</button>
    <button type="button" class="bbx-btn" onclick="bbxReset('${uid}')">Restart</button>
    <button type="button" class="bbx-btn" id="bbx-auto-${uid}" onclick="bbxAuto('${uid}')">Auto</button>
    <button type="button" class="bbx-btn" onclick="bbxTv()">TV mode</button>
    <button type="button" class="bbx-btn" onclick="bbxSwitchViewer('classic')" title="Back to the classic screens">Classic</button>
    <span class="bbx-count" id="bbx-count-${uid}">0 / ${S.steps.length}</span>
  </div>
  <div class="bbx-under"><div class="bbx-script" id="bbx-script-${uid}">${scriptHtml(S)}</div>
    <aside class="bbx-side" id="bbx-side-${uid}">${sideHtml({ hoh: null, nom: [], veto: null, out: [], vetoPlay: [], ballots: [] }, S)}</aside></div>
</div>`,
    });
    // the twist screens that followed this part of the week, once its last screen has aired
    const nextAnchor = steps[si + 1]?.anchor ?? steps[si + 1]?.kind;
    const myAnchor = S.kind === 'scene' ? S.anchor : S.anchor;
    if (myAnchor && !placed.has(myAnchor) && steps.slice(si + 1).every(x => x.anchor !== myAnchor)) {
      out.push(...(after[myAnchor] || [])); placed.add(myAnchor);
    }
    void nextAnchor;
  });
  for (const k of Object.keys(after)) if (!placed.has(k)) out.push(...after[k]);
  return out;
}

// ── the reveal ─────────────────────────────────────────────────────────
function sync(uid) {
  const S = reg()[uid];
  const root = typeof document !== 'undefined' ? document.querySelector(`.bbx[data-uid="${uid}"]`) : null;
  if (S && root && root.dataset.idx == null) { S.idx = -1; stopAuto(S); }
  return S;
}
function paint(uid, fresh) {
  const R = reg()[uid];
  if (!R || typeof document === 'undefined') return;
  const root = document.querySelector(`.bbx[data-uid="${uid}"]`);
  if (root) root.dataset.idx = String(R.idx);
  const el = document.getElementById(`bbx-st-${uid}`);
  if (!el) return;
  clearInterval(R.typing);
  const out = stageHtml(R.screens, R.si, R.idx, fresh, R.o);
  el.innerHTML = out.html;
  el.className = `bbx-stage ${out.cls}`;
  const cam = el.querySelector('.cam');
  if (cam && fresh) requestAnimationFrame(() => requestAnimationFrame(() => cam.setAttribute('style', camStyle(out.cam))));
  const S = R.screens[R.si];
  const script = document.getElementById(`bbx-script-${uid}`);
  script?.querySelectorAll('[data-s]').forEach(ln => {
    const i = Number(ln.dataset.s);
    ln.classList.toggle('vis', i <= R.idx); ln.classList.toggle('now', i === R.idx);
  });
  if (fresh && script) { const ln = script.querySelector(`[data-s="${R.idx}"]`); if (ln) script.scrollTop = ln.offsetTop - script.offsetTop - 40; }
  const side = document.getElementById(`bbx-side-${uid}`);
  if (side) side.innerHTML = sideHtml(out.ledger, S);
  const count = document.getElementById(`bbx-count-${uid}`);
  if (count) count.textContent = `${Math.max(0, R.idx + 1)} / ${S.steps.length}`;
  // the line types itself out on a fresh step
  const tx = el.querySelector('.tx[data-full]');
  if (fresh && tx && !tx.textContent) {
    const full = tx.dataset.full.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    let n = 0;
    R.typing = setInterval(() => { n += 2; tx.textContent = full.slice(0, n); if (n >= full.length) clearInterval(R.typing); }, 15);
  }
}
export function bbxNext(uid) {
  const R = sync(uid); if (!R) return;
  const S = R.screens[R.si];
  if (R.idx >= S.steps.length - 1) {
    const wasAuto = R.auto; stopAuto(R);
    if (typeof window !== 'undefined' && typeof window.vpNext === 'function') {
      window.vpNext();
      if (wasAuto) setTimeout(() => { const nx = document.querySelector('.bbx[data-uid]'); if (nx && nx.dataset.uid !== uid) bbxAuto(nx.dataset.uid); }, 700);
    }
    return;
  }
  R.idx++; paint(uid, true);
}
export function bbxBack(uid) { const R = sync(uid); if (!R || R.idx < 0) return; stopAuto(R); R.idx--; paint(uid, false); }
export function bbxAll(uid) { const R = sync(uid); if (!R) return; stopAuto(R); R.idx = R.screens[R.si].steps.length - 1; paint(uid, false); }
export function bbxReset(uid) { const R = sync(uid); if (!R) return; stopAuto(R); R.idx = -1; paint(uid, false); }
const holdFor = st => Math.min(9000, 1600 + String(st?.t || '').length * 40);
function stopAuto(R) { R.auto = false; clearTimeout(R.timer); }
export function bbxAuto(uid) {
  const R = sync(uid); if (!R) return;
  R.auto = !R.auto;
  document.getElementById(`bbx-auto-${uid}`)?.classList.toggle('on', R.auto);
  const tick = () => {
    if (!R.auto) return;
    bbxNext(uid);
    const st = R.screens[R.si].steps[R.idx];
    if (R.auto) R.timer = setTimeout(tick, holdFor(st));
  };
  if (R.auto) R.timer = setTimeout(tick, 400); else clearTimeout(R.timer);
}
export function bbxTv() {
  const p = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  if (!p) return;
  const on = p.classList.toggle('bbx-tv');
  try {
    if (on && p.requestFullscreen && !document.fullscreenElement) p.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch { /* fullscreen refused: the bigger stage still applies */ }
}
/** Switch between the stepped viewer and the classic screens, and redraw this week. */
export function bbxSwitchViewer(which) {
  try { localStorage.setItem('bb-vp', which === 'stepped' ? 'stepped' : 'classic'); } catch { /* per-viewer convenience */ }
  try {
    const ep = window.vpEpNum ?? window._vpEpNum;
    if (typeof window.openVisualPlayer === 'function' && ep != null) window.openVisualPlayer(ep);
    else location.reload();
  } catch { location.reload(); }
}
if (typeof window !== 'undefined') Object.assign(window, { bbxNext, bbxBack, bbxAll, bbxReset, bbxAuto, bbxTv, bbxSwitchViewer });
void eyeSvg;
