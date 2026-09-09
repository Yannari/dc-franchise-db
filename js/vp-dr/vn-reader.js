// ══════════════════════════════════════════════════════════════════════
// vp-dr/vn-reader.js — optional VN reader mode for werk/prep/untucked
// ══════════════════════════════════════════════════════════════════════
//
// A presentation layer, not a replacement. The reveal system still runs
// underneath — VN mode changes HOW steps look, not WHICH steps exist.
// When on, only the current step is visible and it fills the stage as a
// full-width dialogue card with a large portrait, animated glow border,
// and typewriter text. Toggle is per-viewer, stored in localStorage.
//
// Screens that support it: prep, untucked, and the four werk-room
// sections (cold-open, werk-morning, elim-day, arrivals). The main
// stage already has its own VN treatment (dr-vn-ms).

const VN_SCREENS = new Set([
  'prep', 'untucked', 'cold-open', 'werk-morning', 'elim-day', 'arrivals',
]);

let vnEnabled = false;
try { vnEnabled = localStorage.getItem('dr-vn-mode') === '1'; } catch { /* ok */ }

export function isVnMode() { return vnEnabled; }

export function toggleVnMode() {
  vnEnabled = !vnEnabled;
  try { localStorage.setItem('dr-vn-mode', vnEnabled ? '1' : '0'); } catch { /* ok */ }
  const wrap = document.querySelector('.dr-wrap');
  if (wrap) wrap.classList.toggle('dr-vn-on', vnEnabled);
  const btn = document.getElementById('dr-vn-toggle');
  if (btn) btn.classList.toggle('dr-vn-active', vnEnabled);
  reapplyVn();
}

/** Whether this screen suffix supports VN mode. */
export function vnSupported(suffix) {
  return VN_SCREENS.has(suffix);
}

/** The toggle button HTML, inserted into the controls bar. */
export function vnToggleBtn() {
  return `<button type="button" class="dr-btn dr-ghost dr-vn-btn${vnEnabled ? ' dr-vn-active' : ''}"
    id="dr-vn-toggle" onclick="drToggleVn()" title="Visual Novel mode">VN</button>`;
}

/** Called after a reveal to apply VN presentation to the current state. */
export function applyVnMode(suffix, currentIdx, total) {
  if (!vnEnabled || !vnSupported(suffix)) return;
  const wrap = document.querySelector('.dr-wrap');
  if (wrap) wrap.classList.add('dr-vn-on');

  for (let i = 0; i < total; i++) {
    const el = document.getElementById(`dr-step-${suffix}-${i}`);
    if (!el) continue;
    if (i === currentIdx) {
      el.classList.add('dr-vn-focus');
      el.classList.remove('dr-vn-prev', 'dr-vn-hide');
      animateVnCard(el);
    } else if (i === currentIdx - 1) {
      el.classList.add('dr-vn-prev');
      el.classList.remove('dr-vn-focus', 'dr-vn-hide');
    } else {
      el.classList.add('dr-vn-hide');
      el.classList.remove('dr-vn-focus', 'dr-vn-prev');
    }
  }

  screenFlash(suffix, currentIdx);
}

function animateVnCard(el) {
  const portraits = el.querySelectorAll('.dr-bust, .dr-mirror');
  portraits.forEach((p, i) => {
    p.style.setProperty('--vn-delay', `${i * 0.1 + 0.15}s`);
    p.classList.remove('dr-vn-pop');
    void p.offsetWidth;
    p.classList.add('dr-vn-pop');
  });

  const textEl = el.querySelector('p');
  if (textEl && !textEl.dataset.vnDone) {
    const full = textEl.textContent;
    textEl.dataset.vnFull = full;
    textEl.textContent = '';
    textEl.classList.add('dr-vn-typing');
    typewrite(textEl, full, 0);
  }
}

let _typeTimer = null;
function typewrite(el, text, i) {
  clearTimeout(_typeTimer);
  if (i >= text.length) {
    el.classList.remove('dr-vn-typing');
    el.dataset.vnDone = '1';
    return;
  }
  el.textContent = text.slice(0, i + 1);
  const ch = text[i];
  const delay = ch === '.' || ch === '—' ? 50
    : ch === ',' ? 28
    : ch === '"' || ch === '“' || ch === '”' ? 18
    : 8;
  _typeTimer = setTimeout(() => typewrite(el, text, i + 1), delay);
}

/** Skip the typewriter and show full text immediately. Returns true if it skipped. */
export function skipTypewriter() {
  const typing = document.querySelector('.dr-vn-typing');
  if (!typing) return false;
  clearTimeout(_typeTimer);
  typing.textContent = typing.dataset.vnFull || typing.textContent;
  typing.classList.remove('dr-vn-typing');
  typing.dataset.vnDone = '1';
  return true;
}

function screenFlash(suffix, idx) {
  if (idx === 0) {
    let flash = document.getElementById('dr-vn-flash');
    if (!flash) {
      flash = document.createElement('div');
      flash.id = 'dr-vn-flash';
      flash.className = 'dr-vn-flash';
      document.querySelector('.dr-wrap')?.appendChild(flash);
    }
    flash.classList.remove('dr-vn-fire');
    void flash.offsetWidth;
    flash.classList.add('dr-vn-fire');
  }
}

/** Re-apply VN classes after a screen repaint (tab switch). */
function reapplyVn() {
  const wrap = document.querySelector('.dr-wrap');
  if (!wrap) return;
  wrap.classList.toggle('dr-vn-on', vnEnabled);
}

/** Reset typewriter state when leaving a step (so re-visiting replays). */
export function resetVnStep(suffix, idx) {
  const el = document.getElementById(`dr-step-${suffix}-${idx}`);
  if (!el) return;
  const p = el.querySelector('p');
  if (p) { delete p.dataset.vnDone; delete p.dataset.vnFull; }
}

// ══════════════════════════════════════════════════════════════════════
// THE CSS
// ══════════════════════════════════════════════════════════════════════

export const VN_CSS = `
/* ── VN MODE: one card at a time, full stage ── */
.dr-vn-on .dr-step.dr-vn-hide{display:none}

.dr-vn-on .dr-step.dr-vn-prev{
  opacity:.15;transform:translateY(-30px) scale(.94);
  filter:blur(3px);pointer-events:none;
  position:absolute;top:0;left:0;right:0;z-index:0;
  transition:all .5s cubic-bezier(.4,0,.2,1)}

.dr-vn-on .dr-step.dr-vn-focus{
  opacity:1;transform:none;z-index:2;position:relative;
  transition:all .45s cubic-bezier(.16,1,.3,1)}

/* THE FOCUSED CARD GOES BIG */
.dr-vn-on .dr-step.dr-vn-focus>.dr-panel,
.dr-vn-on .dr-step.dr-vn-focus>.dr-card{
  min-height:200px;padding:24px 28px 24px 140px;position:relative}

.dr-vn-on .dr-step.dr-vn-focus .dr-bust,
.dr-vn-on .dr-step.dr-vn-focus .dr-mirror{
  position:absolute;left:16px;top:50%;transform:translateY(-50%);z-index:2}
.dr-vn-on .dr-step.dr-vn-focus .dr-por,
.dr-vn-on .dr-step.dr-vn-focus .dr-initials{
  width:96px!important;height:96px!important;font-size:34px!important;
  border-radius:50%;border:3px solid var(--dr-role,#7B2FF7);
  box-shadow:0 0 28px -6px var(--dr-role-glow,rgba(123,47,247,.35))}

/* Pulse ring on portrait */
.dr-vn-on .dr-step.dr-vn-focus .dr-bust::after,
.dr-vn-on .dr-step.dr-vn-focus .dr-mirror::after{
  content:'';position:absolute;inset:-6px;border-radius:50%;
  border:2px solid var(--dr-role,#7B2FF7);opacity:0;
  animation:drVnPulse 2s ease-out .5s infinite}
@keyframes drVnPulse{
  0%{transform:scale(1);opacity:.45}
  100%{transform:scale(1.4);opacity:0}}

/* Portrait pop-in */
.dr-vn-pop{opacity:0;transform:scale(.7) translateX(-16px);
  animation:drVnPopIn .45s cubic-bezier(.16,1,.3,1) var(--vn-delay,.15s) forwards}
@keyframes drVnPopIn{to{opacity:1;transform:scale(1) translateX(0)}}

/* Spinning glow border on the focused panel */
@property --dr-vn-angle{syntax:'<angle>';initial-value:0deg;inherits:false}
.dr-vn-on .dr-step.dr-vn-focus>.dr-panel::before,
.dr-vn-on .dr-step.dr-vn-focus>.dr-card::before{
  content:'';position:absolute;inset:-1px;border-radius:inherit;padding:2px;
  background:conic-gradient(
    from var(--dr-vn-angle,0deg),
    transparent 0%,var(--dr-role,#7B2FF7) 12%,transparent 28%,
    transparent 72%,var(--dr-role,#7B2FF7) 88%,transparent 100%);
  -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
  mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  animation:drVnGlow 4s linear infinite;opacity:.5;pointer-events:none;z-index:1}
@keyframes drVnGlow{to{--dr-vn-angle:360deg}}

/* Larger text in VN mode */
.dr-vn-on .dr-step.dr-vn-focus p{
  font-size:18px;line-height:1.7;color:#f4e3ed;text-wrap:pretty}
.dr-vn-on .dr-step.dr-vn-focus h3{
  font-size:15px;letter-spacing:.08em;text-transform:uppercase}

/* Typewriter cursor */
.dr-vn-typing::after{content:'▍';animation:drVnBlink .7s step-end infinite;
  color:var(--dr-role,#7B2FF7);margin-left:2px;font-weight:300}
@keyframes drVnBlink{50%{opacity:0}}

/* Screen flash */
.dr-vn-flash{position:fixed;inset:0;pointer-events:none;z-index:200;opacity:0}
.dr-vn-flash.dr-vn-fire{animation:drVnFlash .5s ease-out forwards;
  background:var(--dr-role,rgba(123,47,247,.15))}
@keyframes drVnFlash{0%{opacity:.12}100%{opacity:0}}

/* The toggle button */
.dr-vn-btn{font-size:12px!important;padding:8px 14px!important;
  letter-spacing:.12em;clip-path:none!important}
.dr-vn-btn.dr-vn-active{
  background:linear-gradient(90deg,rgba(123,47,247,.2),rgba(255,61,154,.2))!important;
  border-color:#7B2FF7!important;color:#d4b8ff!important;
  box-shadow:0 0 14px -4px rgba(123,47,247,.4)}

/* PAIR cards in VN: override two-column pair layout to stack */
.dr-vn-on .dr-step.dr-vn-focus .dr-pairtop{
  flex-direction:column;gap:6px;margin-bottom:10px}
.dr-vn-on .dr-step.dr-vn-focus .dr-two{
  position:absolute;left:16px;top:50%;transform:translateY(-50%);
  display:flex;flex-direction:column;gap:6px}
.dr-vn-on .dr-step.dr-vn-focus .dr-two .dr-por,
.dr-vn-on .dr-step.dr-vn-focus .dr-two .dr-initials{
  width:58px!important;height:58px!important;font-size:20px!important}
.dr-vn-on .dr-step.dr-vn-focus .dr-two .dr-bust::after{inset:-4px}

/* Walkthrough cards in VN: make them breathe */
.dr-vn-on .dr-step.dr-vn-focus .dr-walkcard{
  padding-left:24px;min-height:auto}
.dr-vn-on .dr-step.dr-vn-focus .dr-walkcard .dr-bust{
  position:relative;left:auto;top:auto;transform:none}

/* Untucked band headers in VN */
.dr-vn-on .dr-step.dr-vn-focus .dr-band{
  text-align:center;padding:8px 0;margin-bottom:12px}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .dr-vn-pop{animation:none;opacity:1;transform:none}
  .dr-vn-on .dr-step.dr-vn-focus>.dr-panel::before,
  .dr-vn-on .dr-step.dr-vn-focus>.dr-card::before{animation:none}
  .dr-vn-on .dr-step.dr-vn-focus .dr-bust::after,
  .dr-vn-on .dr-step.dr-vn-focus .dr-mirror::after{animation:none;display:none}
  .dr-vn-typing::after{animation:none}
  .dr-vn-flash{display:none}
}

/* Mobile */
@media(max-width:600px){
  .dr-vn-on .dr-step.dr-vn-focus>.dr-panel,
  .dr-vn-on .dr-step.dr-vn-focus>.dr-card{
    padding:20px 18px 20px 110px;min-height:180px}
  .dr-vn-on .dr-step.dr-vn-focus .dr-por,
  .dr-vn-on .dr-step.dr-vn-focus .dr-initials{
    width:72px!important;height:72px!important;font-size:26px!important}
  .dr-vn-on .dr-step.dr-vn-focus p{font-size:16px}
}
`;
