/**
 * Caged Eggs — "THROUGH THE WIRE"
 *
 * The whole screen is seen from the wrong side of a fence. A chain-link mesh is
 * drawn across the page as a repeating CSS gradient, the cards sit behind it,
 * and every run is scored in eggs rather than in numbers.
 *
 * The furniture is a tray: six eggs per houseguest, drawn whole when they made
 * it and cracked when they did not. Six intact eggs and a fast clock is a run
 * you can read without reading anything — and a tray of yolk is a houseguest
 * who hurried, which is exactly what this competition punishes.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap');
.sigegg{--eg-wire:#8e99a4;--eg-shell:#f6efe2;--eg-yolk:#f2b134;--eg-crack:#b8503f;--eg-deck:#2f3a34;
  --eg-deck2:#1a221e;--eg-ink:#eef3ee;--eg-dim:#9aab9f;
  font-family:'Rubik',system-ui,sans-serif;color:var(--eg-ink);position:relative;overflow:clip}
.sigegg .eg-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2}
.sigegg .eg-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(70% 44% at 50% 0%,rgba(242,177,52,0.12),transparent 62%),
             linear-gradient(180deg,var(--eg-deck),var(--eg-deck2) 72%,#0e1411)}
/* the fence, over everything */
.sigegg .eg-mesh{position:absolute;inset:46px 0 0 0;z-index:3;pointer-events:none;opacity:.20;
  background:
    repeating-linear-gradient(45deg,transparent 0 15px,var(--eg-wire) 15px 16.5px),
    repeating-linear-gradient(-45deg,transparent 0 15px,var(--eg-wire) 15px 16.5px)}

.sigegg .eg-head{text-align:center;padding:14px 8px 6px}
.sigegg .eg-eyebrow{font-size:9.5px;letter-spacing:4px;color:var(--eg-dim);text-transform:uppercase}
.sigegg .eg-title{font-size:38px;font-weight:700;letter-spacing:2px;margin:5px 0 2px;color:var(--eg-shell)}
.sigegg .eg-sub{font-size:12.5px;color:#c2d2c6;max-width:430px;margin:0 auto}

.sigegg .eg-grid{display:grid;grid-template-columns:minmax(0,1fr) 236px;gap:16px;align-items:start;margin-top:14px}
@media(max-width:860px){.sigegg .eg-grid{grid-template-columns:1fr}}

.sigegg .eg-run{margin-bottom:11px;padding:12px 14px;border-radius:10px;
  border:1px solid rgba(255,255,255,.08);background:linear-gradient(160deg,rgba(47,58,52,.94),rgba(15,21,17,.95));
  box-shadow:0 10px 22px rgba(0,0,0,.42);animation:egIn .32s ease both}
@keyframes egIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.sigegg .eg-run.is-clean{border-color:rgba(242,177,52,.4)}
.sigegg .eg-run-h{display:flex;align-items:center;gap:9px;margin-bottom:9px}
.sigegg .eg-face{width:30px;height:30px;border-radius:50%;overflow:hidden;border:1px solid rgba(255,255,255,.18)}
.sigegg .eg-face img{width:100%;height:100%;object-fit:cover}
.sigegg .eg-name{font-weight:700;font-size:13.5px}
.sigegg .eg-clock{margin-left:auto;font-variant-numeric:tabular-nums;font-size:13px;color:var(--eg-yolk)}
/* the tray */
.sigegg .eg-tray{display:flex;gap:7px;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.28);
  border:1px solid rgba(255,255,255,.07);margin-bottom:9px;flex-wrap:wrap}
.sigegg .eg-egg{width:22px;height:28px;position:relative}
.sigegg .eg-egg svg{width:100%;height:100%}
.sigegg .eg-body{font-size:12.6px;line-height:1.6;color:#dbe6dd}
.sigegg .eg-locked{margin-bottom:11px;min-height:48px;border-radius:10px;border:1px dashed rgba(238,243,238,.14);
  display:grid;place-items:center;font-size:10px;letter-spacing:3px;color:rgba(238,243,238,.26)}

.sigegg .eg-side{position:sticky;top:56px;padding:13px;border-radius:10px;
  border:1px solid rgba(242,177,52,.22);background:linear-gradient(180deg,rgba(38,48,42,.96),rgba(12,17,14,.96))}
.sigegg .eg-side-h{font-size:10px;letter-spacing:2.2px;font-weight:700;color:var(--eg-yolk);margin-bottom:2px}
.sigegg .eg-side-s{font-size:11px;color:var(--eg-dim);margin-bottom:11px;line-height:1.45}
.sigegg .eg-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:7px}
.sigegg .eg-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigegg .eg-mini{display:flex;gap:2px}
.sigegg .eg-mini i{width:6px;height:8px;border-radius:3px 3px 4px 4px;background:var(--eg-shell)}
.sigegg .eg-mini i.is-broke{background:var(--eg-crack)}
.sigegg .eg-srow em{font-style:normal;font-size:10px;color:var(--eg-yolk);min-width:34px;text-align:right;
  font-variant-numeric:tabular-nums}
.sigegg .eg-win{margin-top:11px;text-align:center;padding:11px;border-radius:10px;
  border:1px solid var(--eg-yolk);background:rgba(242,177,52,.12)}
.sigegg .eg-win-f{width:54px;height:54px;border-radius:50%;overflow:hidden;margin:0 auto 5px;border:2px solid var(--eg-yolk)}
.sigegg .eg-win-f img{width:100%;height:100%;object-fit:cover}
.sigegg .eg-win b{display:block;font-size:14px;font-weight:700}
.sigegg .eg-win i{font-style:normal;font-size:11px;color:var(--eg-dim)}
.sigegg .eg-ctl{display:flex;gap:8px;justify-content:center;align-items:center;padding:12px 0 4px;position:relative;z-index:4}
.sigegg .eg-count{font-size:10px;letter-spacing:2px;color:var(--eg-dim)}
@media(prefers-reduced-motion:reduce){
  .sigegg *,.sigegg *::before,.sigegg *::after{animation:none!important;transition:none!important}
}
</style>`;

const _WHOLE = `<svg viewBox="0 0 22 28" aria-hidden="true">
  <ellipse cx="11" cy="16" rx="9" ry="11.5" fill="#f6efe2" stroke="#cbbfa8"/>
  <ellipse cx="8" cy="11" rx="2.6" ry="3.4" fill="#fffdf7" opacity=".8"/></svg>`;
const _CRACKED = `<svg viewBox="0 0 22 28" aria-hidden="true">
  <ellipse cx="11" cy="16" rx="9" ry="11.5" fill="#e6d9c4" stroke="#b8503f"/>
  <path d="M4 15 L9 12 L7 17 L12 15 L10 20 L16 17" fill="none" stroke="#b8503f" stroke-width="1.4"/>
  <circle cx="14" cy="22" r="3.2" fill="#f2b134" opacity=".85"/></svg>`;

export function rpBuildSigCagedEggs(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_egg_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;
  const eggs = comp.detail?.eggs || 6;
  const clock = s => `${Math.floor((Number(s) || 0) / 60)}:${String((Number(s) || 0) % 60).padStart(2, '0')}`;

  let cards = '';
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="eg-locked">AT THE FENCE</div>`; return; }
    const who = (b.players || [])[0];
    const row = breakdown[who];
    if (!row || row.seconds == null) {
      cards += `<div class="eg-run is-clean"><div class="eg-body">${b.text}</div></div>`;
      return;
    }
    const tray = Array.from({ length: eggs }, (_, k) =>
      `<span class="eg-egg">${k < (row.broken || 0) ? _CRACKED : _WHOLE}</span>`).join('');
    cards += `<div class="eg-run ${row.broken === 0 ? 'is-clean' : ''}">
      <div class="eg-run-h">
        <span class="eg-face">${avatar(who, 30)}</span>
        <span class="eg-name">${esc(who)}</span>
        <span class="eg-clock">${clock(row.seconds)}</span>
      </div>
      <div class="eg-tray">${tray}</div>
      <div class="eg-body">${b.text}</div>
    </div>`;
  });

  const rows = (comp.placements || []).slice(0, 8).map(name => {
    const row = breakdown[name] || {};
    const mini = Array.from({ length: eggs }, (_, k) =>
      `<i class="${done && k < (row.broken || 0) ? 'is-broke' : ''}"></i>`).join('');
    return `<div class="eg-srow"><span>${esc(name)}</span>
      <span class="eg-mini">${mini}</span>
      <em>${done ? clock(row.seconds) : '--:--'}</em></div>`;
  }).join('');

  return `<div class="rp-page sigegg">${_STYLE}
    <div class="eg-bg"></div>
    <div class="eg-mesh"></div>
    <div class="eg-wrap">
      <div class="eg-head">
        <div class="eg-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : 'Head of Household')}</div>
        <div class="eg-title">CAGED EGGS</div>
        <div class="eg-sub">Fingers through the wire, one egg at a time. Anything you break is gone.</div>
      </div>
      <div class="eg-grid">
        <div>${cards}</div>
        <aside class="eg-side">
          <div class="eg-side-h">THE TRAYS</div>
          <div class="eg-side-s">Six each. Red is one that did not make it.</div>
          ${rows}
          ${done && winner ? `<div class="eg-win">
            <div class="eg-win-f">${avatar(winner, 54)}</div>
            <b>${esc(winner)}</b><i>${breakdown[winner]?.broken ? `${breakdown[winner].broken} broken` : 'not one broken'} · ${clock(breakdown[winner]?.seconds)}</i></div>` : ''}
        </aside>
      </div>
      <div class="eg-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Next at the fence</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Every tray</button>`}
        <span class="eg-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
