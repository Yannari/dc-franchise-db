// ══════════════════════════════════════════════════════════════════════
// vp-bb-rewind.js — the night that gets taken back
// ══════════════════════════════════════════════════════════════════════
//
// The screen has one job the beats cannot do on their own: show the week being
// UNDONE. So it draws the week as it stood — the crown, the block, the count —
// and then strikes all of it through, live, on the reveal that fires the
// button. The tape-scrub motif is the whole visual: a gold seek bar that runs
// forward through the week and then jumps back to zero.
//
// The count stays on screen afterwards on purpose. That is the twist: the votes
// were read, they decide nothing, and every name in them is still in the house.

export function rpBuildBBRewind(ep, act, deps = {}) {
  const esc = deps.esc || (x => String(x ?? ''));
  const avatar = deps.avatar || (() => '');
  const _tvState = deps.tvState || {};
  const reveal = deps.reveal || (() => '');

  const key = `bb_rewind_${ep?.num || 0}`;
  if (!_tvState[key]) _tvState[key] = { idx: -1 };
  const state = _tvState[key];

  const beats = act?.beats || [];
  const steps = [{ kind: 'week' }, ...beats.map(b => ({ kind: 'beat', b }))];
  const total = steps.length;
  // The strike-through lands with the first beat — the moment the night stops.
  const undone = state.idx >= 1;
  const done = state.idx >= total - 1;

  const noms = (act?.nominees || []).filter(Boolean);
  const exposed = act?.exposed || [];

  const chip = (label, who, cls = '') => `<div class="bbrw-chip ${cls}">
    ${who ? avatar(who, 30) : ''}
    <div><i>${esc(label)}</i><b>${esc(who || '—')}</b></div></div>`;

  const card = (step, i) => {
    if (i > state.idx) return `<div class="bbrw-card is-hidden"><span>?</span></div>`;
    if (step.kind === 'week') {
      return `<div class="bbrw-card is-week">
        <div class="bbrw-card-h"><span class="bbrw-pill">THE WEEK AS IT STOOD</span></div>
        <div class="bbrw-grid">
          ${chip('Head of Household', act?.deposed, 'is-crown')}
          ${noms.map(n => chip('On the block', n, 'is-nom')).join('')}
          ${chip('Voted out', act?.spared, 'is-out')}
        </div></div>`;
    }
    const b = step.b || {};
    return `<div class="bbrw-card">
      <div class="bbrw-card-h">${(b.players || []).slice(0, 3).map(n => avatar(n, 26)).join('')}
        <span class="bbrw-pill ${b.badgeClass === 'red' ? 'red' : b.badgeClass === 'blue' ? 'blue' : ''}">${esc(b.badgeText || '')}</span></div>
      <div class="bbrw-card-b">${esc(b.text || '')}</div></div>`;
  };

  return `<style>
  .bbrw{max-width:1100px;margin:0 auto;font-family:var(--font-body)}
  .bbrw-tape{position:relative;height:8px;border-radius:99px;background:rgba(255,255,255,.08);margin:14px 0 18px;overflow:hidden}
  .bbrw-tape span{position:absolute;inset:0 auto 0 0;width:${undone ? 0 : 100}%;background:linear-gradient(90deg,#c9a227,#ffd76b);
    transition:width .9s cubic-bezier(.2,.9,.2,1)}
  .bbrw-title{font-family:var(--font-display);font-size:26px;letter-spacing:3px;text-align:center;color:#ffd76b;text-shadow:0 0 26px rgba(255,215,107,.25)}
  .bbrw-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:6px}
  .bbrw-grid{display:flex;flex-wrap:wrap;gap:9px}
  .bbrw-chip{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:8px;
    border:1px solid rgba(255,255,255,.1);background:rgba(9,11,15,.7);position:relative;transition:opacity .5s}
  .bbrw-chip i{display:block;font-style:normal;font-size:8.5px;letter-spacing:1.6px;color:#7d8898}
  .bbrw-chip b{display:block;font-size:12.5px;color:#e6edf3}
  .bbrw-chip.is-crown{border-left:3px solid #ffd76b}
  .bbrw-chip.is-nom{border-left:3px solid #c9737f}
  .bbrw-chip.is-out{border-left:3px solid #ff6b6b}
  /* struck through, not removed — the week happened, it just does not count */
  .bbrw.undone .bbrw-chip{opacity:.42}
  .bbrw.undone .bbrw-chip::after{content:'';position:absolute;left:6px;right:6px;top:50%;height:2px;
    background:#ffd76b;transform:scaleX(0);transform-origin:left;animation:bbrwStrike .55s .1s forwards}
  @keyframes bbrwStrike{to{transform:scaleX(1)}}
  .bbrw-card{border:1px solid rgba(255,255,255,.09);border-left:3px solid #ffd76b;border-radius:8px;
    padding:11px 13px;background:rgba(9,11,15,.72);margin-bottom:9px}
  .bbrw-card.is-hidden{opacity:.25;text-align:center;border-left-color:rgba(255,255,255,.1)}
  .bbrw-card-h{display:flex;align-items:center;gap:8px;margin-bottom:7px}
  .bbrw-pill{font-size:8.5px;letter-spacing:1.8px;color:#ffd76b}
  .bbrw-pill.red{color:#ff8f8f} .bbrw-pill.blue{color:#7ee7ff}
  .bbrw-card-b{font-size:12.5px;line-height:1.6;color:#c8d2de}
  .bbrw-count{margin-top:14px;border:1px dashed rgba(255,143,143,.35);border-radius:9px;padding:11px 13px;background:rgba(60,12,12,.18)}
  .bbrw-count h4{margin:0 0 7px;font-size:9px;letter-spacing:2px;color:#ff8f8f}
  .bbrw-count div{font-size:12px;color:#d8c9c9;line-height:1.7}
  @media(prefers-reduced-motion:reduce){.bbrw-tape span,.bbrw.undone .bbrw-chip::after{transition:none;animation:none;transform:scaleX(1)}}
  </style>
  <div class="rp-page bb-room bbrw ${undone ? 'undone' : ''}">
    <div class="rp-eyebrow">Week ${ep?.num ?? ''}</div>
    <div class="bbrw-title">${undone ? 'REWIND' : 'EVICTION NIGHT'}</div>
    <div class="bbrw-sub">${undone
    ? 'This week did not happen. Everything in it did.'
    : 'The votes have been read.'}</div>
    <div class="bbrw-tape"><span></span></div>
    ${steps.map((st, i) => card(st, i)).join('')}
    ${undone && exposed.length ? `<div class="bbrw-count">
      <h4>THE COUNT, WHICH DECIDES NOTHING AND IS STILL TRUE</h4>
      ${exposed.slice(0, 8).map(e => `<div>${esc(e.voter)} voted to evict <b>${esc(e.voted)}</b>.</div>`).join('')}
    </div>` : ''}
    <div class="bbns-controls">
      ${done ? '<span class="bbns-done">The house starts the week again.</span>' : `
        <button class="rp-btn" onclick="${reveal(ep, key, Math.min(state.idx + 1, total - 1))}">${state.idx < 0 ? 'Read the count' : 'Next'}</button>
        <button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, key, total - 1)}">Reveal all</button>`}
      <span class="bbns-count">${Math.min(total, state.idx + 1)} / ${total}</span>
    </div>
  </div>`;
}
