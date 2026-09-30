// ══════════════════════════════════════════════════════════════════════
// vp-ci/screens.js — a Circle episode on screen (Plan 5)
// ══════════════════════════════════════════════════════════════════════
//
// One screen per aired scene (vp-ci/steps.js): the stage (vp-ci/stage.js),
// the controls, and the script under it lighting up a line at a time — the
// same lines the text backlog prints (js/ci/transcript.js), so the screen and
// the backlog never say different things.
//
// ONE CLICK IS ONE LINE (spec 18.3): Next, a click on the stage, or Auto,
// which plays the screen on its own at a reading pace and rolls on to the
// next screen at its end, the way a programme cuts to its next segment.
//
// THE REVEAL PATCHES THE SCREEN IT IS ON. `renderVPScreen` rebuilds the page
// on every navigation; a screen the page has just drawn is at rest (no
// `data-idx` yet), whatever it was last time.
import { circleScreens } from './steps.js';
import { stageInner, paintStage } from './stage.js';
import { CIV_CSS, CIV_FONTS } from './style.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const reg = () => (typeof window !== 'undefined' ? (window._civ ||= {}) : {});
const LOGO = '<svg viewBox="0 0 58 58"><defs><linearGradient id="civLg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff4fb4"/><stop offset=".5" stop-color="#8b5cff"/><stop offset="1" stop-color="#3fd8ff"/></linearGradient></defs><circle cx="29" cy="29" r="23" fill="none" stroke="url(#civLg)" stroke-width="7"/><circle cx="29" cy="6" r="3.2" fill="#fff"/></svg>';
const PART = { say: 'ALOUD', react: 'REACTS', send: 'SENT', post: 'POSTED', video: 'VIDEO', host: 'THE CIRCLE', stage: '' };

function scriptHtml(row, screen) {
  const nameOf = h => row.ci.profiles?.[h]?.name || String(h || '').replace(/^@/, '');
  return screen.steps.map((st, i) => {
    const k = st.host ? 'THE CIRCLE' : PART[st.part] || '';
    const who = st.who ? `<b>${esc(nameOf(st.who))}</b> ` : '';
    return `<p class="civ-ln ${esc(st.part)}" data-s="${i}" data-text="${esc(st.text)}">${k ? `<span class="k">${k}</span>` : ''}${who}${esc(st.text)}</p>`;
  }).join('');
}

export function circleVpScreens(row) {
  const screens = circleScreens(row);
  if (!screens.length) {
    return [{ id: 'ci-empty', label: 'The day', html: `<style>${CIV_FONTS}${CIV_CSS}</style><div class="civ"><div class="civ-top"><div class="civ-logo">${LOGO}<div>THE CIRCLE<small>Episode ${esc(row.num)} · Day ${esc(row.day)}</small></div></div></div><p class="civ-ln vis">A quiet day in The Circle.</p></div>` }];
  }
  return screens.map((screen, si) => {
    const uid = `ci${esc(row.num)}-${si}`;
    reg()[uid] = { row, screen, idx: -1, auto: false };
    return {
      id: `ci-${screen.id}`,
      label: screen.title,
      html: `<style>${CIV_FONTS}${CIV_CSS}</style>
<div class="civ" data-uid="${uid}">
  <div class="civ-top"><div class="civ-logo">${LOGO}<div>THE CIRCLE<small>Episode ${esc(row.num)} · Day ${esc(row.day)}</small></div></div>
    <div class="civ-title">${esc(screen.title)}</div></div>
  <div class="civ-stage" id="civ-st-${uid}" onclick="civNext('${uid}')" title="Click for the next line">${stageInner(row, screen, -1)}</div>
  <div class="civ-controls">
    <button type="button" class="civ-btn" onclick="civReset('${uid}')">Restart</button>
    <button type="button" class="civ-btn main" onclick="civNext('${uid}')">Next</button>
    <button type="button" class="civ-btn" id="civ-auto-${uid}" onclick="civAuto('${uid}')">Auto</button>
    <button type="button" class="civ-btn" onclick="civAll('${uid}')">Reveal all</button>
    <span class="civ-count" id="civ-count-${uid}">0 / ${screen.steps.length}</span>
  </div>
  <div class="civ-script" id="civ-script-${uid}">${scriptHtml(row, screen)}</div>
</div>`,
    };
  });
}

// ── the reveal ─────────────────────────────────────────────────────────
function sync(uid) {
  const S = reg()[uid];
  const root = typeof document !== 'undefined' ? document.querySelector(`.civ[data-uid="${uid}"]`) : null;
  if (S && root && root.dataset.idx == null) { S.idx = -1; stopAuto(S); }
  return S;
}
function paint(uid, fresh) {
  const S = reg()[uid];
  if (!S || typeof document === 'undefined') return;
  const root = document.querySelector(`.civ[data-uid="${uid}"]`);
  if (root) root.dataset.idx = String(S.idx);
  paintStage(document.getElementById(`civ-st-${uid}`), S.row, S.screen, S.idx, fresh);
  const script = document.getElementById(`civ-script-${uid}`);
  script?.querySelectorAll('[data-s]').forEach(el => el.classList.toggle('vis', Number(el.dataset.s) <= S.idx));
  const count = document.getElementById(`civ-count-${uid}`);
  if (count) count.textContent = `${Math.max(0, S.idx + 1)} / ${S.screen.steps.length}`;
  if (fresh) { try { script?.querySelector(`[data-s="${S.idx}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch { /* jsdom */ } }
}
export function civNext(uid) {
  const S = sync(uid);
  if (!S) return;
  if (S.idx >= S.screen.steps.length - 1) {
    const wasAuto = S.auto;
    stopAuto(S);
    if (typeof window !== 'undefined' && typeof window.vpNext === 'function') {
      window.vpNext();
      // Auto carries on into the next screen once the player has drawn it.
      if (wasAuto) setTimeout(() => { const next = document.querySelector('.civ[data-uid]'); if (next && next.dataset.uid !== uid) civAuto(next.dataset.uid); }, 700);
    }
    return;
  }
  S.idx++;
  paint(uid, true);
}
export function civAll(uid) { const S = sync(uid); if (!S) return; stopAuto(S); S.idx = S.screen.steps.length - 1; paint(uid, false); }
export function civReset(uid) { const S = sync(uid); if (!S) return; stopAuto(S); S.idx = -1; paint(uid, false); }

// ── Auto: the screen plays itself at a reading pace ──────────────────
// A line holds long enough to read; a sent message longer, for the dictation
// to type and fire.
export const holdFor = st => Math.min(9000, 1500 + String(st?.text || '').length * 42 + (st?.part === 'send' ? 1600 : 0));
function stopAuto(S) {
  if (S?.timer) clearTimeout(S.timer);
  if (S) { S.timer = null; S.auto = false; }
  const b = typeof document !== 'undefined' ? document.getElementById(`civ-auto-${Object.keys(reg()).find(k => reg()[k] === S)}`) : null;
  b?.classList.remove('on');
}
export function civAuto(uid) {
  const S = sync(uid);
  if (!S) return;
  if (S.auto) { stopAuto(S); return; }
  S.auto = true;
  document.getElementById(`civ-auto-${uid}`)?.classList.add('on');
  const tick = () => {
    if (!S.auto || !document.querySelector(`.civ[data-uid="${uid}"]`)) return;
    civNext(uid);
    if (S.auto) S.timer = setTimeout(tick, holdFor(S.screen.steps[S.idx]));
  };
  tick();
}

if (typeof window !== 'undefined') Object.assign(window, { civNext, civAll, civReset, civAuto });
