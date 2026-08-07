/**
 * The Black Box — "IN THE DARK"
 *
 * The screen is almost entirely black, and that is the design rather than a
 * shortage of one. This competition removes sight; a brightly lit board would
 * be describing the opposite of what is happening.
 *
 * Every run is a card lit by one soft pool of light, as if a camera with
 * night-vision found somebody mid-reach. The objects they placed are drawn as
 * CHALK OUTLINES on the pegboard — the shape of a thing you identified by hand
 * and never saw — and the ones they missed stay as empty rings.
 *
 * The only bright element on the page is the clock, because in a competition
 * settled on time the clock is the one thing everybody in that box would give
 * anything to see.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;600&display=swap');
.sigbox{--bx-void:#04050a;--bx-glow:#9fe8ff;--bx-chalk:#e8eef2;--bx-warm:#ffb02e;--bx-dim:#4d5a66;
  font-family:'Inter',system-ui,sans-serif;color:var(--bx-chalk);position:relative;overflow:clip}
.sigbox .bx-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigbox .bx-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(60% 40% at 50% 6%,rgba(159,232,255,0.08),transparent 60%),
             linear-gradient(180deg,#06070d,#020308 70%,#000)}
/* a very slow drifting pool of light, as if somebody is moving a torch */
.sigbox .bx-bg::after{content:'';position:absolute;inset:0;
  background:radial-gradient(220px 180px at 30% 40%,rgba(159,232,255,0.06),transparent 70%);
  animation:bxDrift 17s ease-in-out infinite alternate}
@keyframes bxDrift{0%{transform:translate(0,0)}100%{transform:translate(46%,26%)}}

.sigbox .bx-head{text-align:center;padding:16px 8px 8px}
.sigbox .bx-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:4px;color:var(--bx-dim)}
.sigbox .bx-title{font-family:'IBM Plex Mono',monospace;font-size:34px;font-weight:600;letter-spacing:8px;
  margin:8px 0 4px;color:var(--bx-chalk);text-shadow:0 0 30px rgba(159,232,255,.35)}
.sigbox .bx-sub{font-size:12.5px;color:#8fa0ad;max-width:440px;margin:0 auto}
.sigbox .bx-door{margin:14px auto 16px;width:min(320px,80%);height:52px;border-radius:3px;
  border:1px solid rgba(159,232,255,.2);background:linear-gradient(180deg,#0a0d14,#04060b);
  display:grid;place-items:center;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:5px;
  color:var(--bx-dim);position:relative;overflow:hidden}
.sigbox .bx-door::after{content:'';position:absolute;left:0;right:0;top:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(159,232,255,.7),transparent);animation:bxScan 4.5s linear infinite}
@keyframes bxScan{0%{transform:translateY(0)}100%{transform:translateY(52px)}}

.sigbox .bx-grid{display:grid;grid-template-columns:minmax(0,1fr) 234px;gap:16px;align-items:start}
@media(max-width:860px){.sigbox .bx-grid{grid-template-columns:1fr}}

/* ── a run in the dark ── */
.sigbox .bx-run{position:relative;margin-bottom:12px;padding:14px 15px;border-radius:6px;
  border:1px solid rgba(159,232,255,.12);
  background:radial-gradient(340px 150px at 18% 0%,rgba(159,232,255,0.07),transparent 70%),
             linear-gradient(160deg,rgba(10,13,20,.95),rgba(2,3,6,.97));
  box-shadow:0 14px 30px rgba(0,0,0,.6);animation:bxIn .5s ease both}
@keyframes bxIn{from{opacity:0}to{opacity:1}}
.sigbox .bx-run-h{display:flex;align-items:center;gap:9px;margin-bottom:10px}
.sigbox .bx-face{width:30px;height:30px;border-radius:50%;overflow:hidden;filter:grayscale(.7) brightness(.75);
  border:1px solid rgba(159,232,255,.25)}
.sigbox .bx-face img{width:100%;height:100%;object-fit:cover}
.sigbox .bx-run-n{font-family:'IBM Plex Mono',monospace;font-size:13.5px;letter-spacing:1.5px}
.sigbox .bx-clock{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:15px;color:var(--bx-warm);
  text-shadow:0 0 14px rgba(255,176,46,.5)}
/* the pegboard: five markers, chalk outlines for the ones that got there */
.sigbox .bx-pegs{display:flex;gap:10px;margin-bottom:10px}
.sigbox .bx-peg{width:44px;height:44px;border-radius:4px;border:1px dashed rgba(159,232,255,.25);
  display:grid;place-items:center;background:rgba(255,255,255,.015)}
.sigbox .bx-peg.is-set{border-style:solid;border-color:rgba(232,238,242,.5);
  box-shadow:0 0 14px rgba(159,232,255,.14) inset}
.sigbox .bx-peg svg{width:26px;height:26px;opacity:.9}
.sigbox .bx-body{font-size:12.6px;line-height:1.65;color:#b9c6d1}
.sigbox .bx-locked{margin-bottom:12px;min-height:56px;border-radius:6px;border:1px dashed rgba(159,232,255,.1);
  display:grid;place-items:center;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:4px;
  color:rgba(159,232,255,.18)}

.sigbox .bx-side{position:sticky;top:56px;padding:13px;border-radius:6px;
  border:1px solid rgba(159,232,255,.16);background:linear-gradient(180deg,rgba(8,11,17,.97),rgba(2,3,6,.97))}
.sigbox .bx-side-h{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--bx-glow);margin-bottom:2px}
.sigbox .bx-side-s{font-size:11px;color:#7c8b98;margin-bottom:11px;line-height:1.45}
.sigbox .bx-srow{display:flex;align-items:center;gap:6px;margin-bottom:7px;font-size:11.5px}
.sigbox .bx-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigbox .bx-dots{display:flex;gap:3px}
.sigbox .bx-dot{width:7px;height:7px;border-radius:50%;border:1px solid rgba(159,232,255,.3)}
.sigbox .bx-dot.is-on{background:var(--bx-chalk);border-color:var(--bx-chalk);box-shadow:0 0 7px rgba(232,238,242,.6)}
.sigbox .bx-srow em{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--bx-warm);min-width:34px;text-align:right}
.sigbox .bx-win{margin-top:12px;text-align:center;padding:12px;border-radius:6px;
  border:1px solid rgba(159,232,255,.3);background:rgba(159,232,255,.07)}
.sigbox .bx-win-f{width:58px;height:58px;border-radius:50%;overflow:hidden;margin:0 auto 6px;
  border:1px solid rgba(159,232,255,.5)}
.sigbox .bx-win-f img{width:100%;height:100%;object-fit:cover}
.sigbox .bx-win b{display:block;font-family:'IBM Plex Mono',monospace;font-size:14px;letter-spacing:1px}
.sigbox .bx-win i{font-style:normal;font-size:11px;color:#8fa0ad}
.sigbox .bx-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.sigbox .bx-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.sigbox .bx-count{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--bx-dim)}
@media(prefers-reduced-motion:reduce){
  .sigbox *,.sigbox *::before,.sigbox *::after{animation:none!important;transition:none!important}
}
</style>`;

/** Chalk outlines — the shape of a thing identified by hand. */
const _OUTLINES = [
  `<svg viewBox="0 0 24 24" fill="none" stroke="#e8eef2" stroke-width="1.3"><path d="M4 15c0-3 3-5 6-5 3 0 4-1 5-3 2 1 3 3 3 5 0 4-3 7-7 7-4 0-7-2-7-4z"/><circle cx="15" cy="9" r=".9" fill="#e8eef2"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#e8eef2" stroke-width="1.3"><circle cx="9" cy="9" r="4.5"/><path d="M12 12l7 7M17 17l2-2M19 19l1.5-1.5"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#e8eef2" stroke-width="1.3"><path d="M7 6h10l-1.4 12.5a2 2 0 0 1-2 1.5h-3.2a2 2 0 0 1-2-1.5z"/><path d="M17 8c2 0 3 1 3 2.6 0 1.7-1.3 2.4-3 2.4"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#e8eef2" stroke-width="1.3"><rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M7 8h10M7 12h6"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="#e8eef2" stroke-width="1.3"><circle cx="12" cy="13" r="7"/><path d="M12 9v4l2.6 1.8M8 4l2 2M16 4l-2 2"/></svg>`,
];

export function rpBuildSigBlackBox(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_box_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const runs = comp.detail?.runs || [];
  const winner = act.winner || comp.winner || null;
  const clock = s => `${Math.floor((Number(s) || 0) / 60)}:${String((Number(s) || 0) % 60).padStart(2, '0')}`;

  let cards = '';
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="bx-locked">DOOR SEALED</div>`; return; }
    const who = (b.players || [])[0];
    const run = runs.find(r => r.name === who);
    if (!run) {
      cards += `<div class="bx-run"><div class="bx-body">${b.text}</div></div>`;
      return;
    }
    const pegs = Array.from({ length: 5 }, (_, k) =>
      `<div class="bx-peg ${k < run.placed ? 'is-set' : ''}">${k < run.placed ? _OUTLINES[k % _OUTLINES.length] : ''}</div>`).join('');
    cards += `<div class="bx-run">
      <div class="bx-run-h">
        <span class="bx-face">${avatar(who, 30)}</span>
        <span class="bx-run-n">${esc(who)}</span>
        <span class="bx-clock">${clock(run.seconds)}</span>
      </div>
      <div class="bx-pegs">${pegs}</div>
      <div class="bx-body">${b.text}</div>
    </div>`;
  });

  const rows = (comp.placements || []).slice(0, 8).map(name => {
    const row = breakdown[name] || {};
    const dots = Array.from({ length: 5 }, (_, k) =>
      `<i class="bx-dot ${done && k < (row.placed || 0) ? 'is-on' : ''}"></i>`).join('');
    return `<div class="bx-srow"><span>${esc(name)}</span>
      <span class="bx-dots">${dots}</span>
      <em>${done ? clock(row.seconds) : '--:--'}</em></div>`;
  }).join('');

  return `<div class="rp-page sigbox">${_STYLE}
    <div class="bx-bg"></div>
    <div class="bx-wrap">
      <div class="bx-head">
        <div class="bx-eyebrow">${esc(actType === 'veto' ? 'POWER OF VETO' : 'HEAD OF HOUSEHOLD')}</div>
        <div class="bx-title">THE BLACK BOX</div>
        <div class="bx-sub">No light at all. Find it by hand, put it where it goes, or do not find it.</div>
        ${comp.desc ? `<div class="bx-rules">${esc(comp.desc)}</div>` : ''}
      </div>
      <div class="bx-door">SEALED · NO LIGHT INSIDE</div>
      <div class="bx-grid">
        <div>${cards}</div>
        <aside class="bx-side">
          <div class="bx-side-h">MARKERS · CLOCK</div>
          <div class="bx-side-s">Five objects each. A tie on objects goes to the faster clock.</div>
          ${rows}
          ${done && winner ? `<div class="bx-win">
            <div class="bx-win-f">${avatar(winner, 58)}</div>
            <b>${esc(winner)}</b><i>${breakdown[winner]?.placed ?? 0} of 5 · ${clock(breakdown[winner]?.seconds)}</i></div>` : ''}
        </aside>
      </div>
      <div class="bx-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Open the door</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Every run</button>`}
        <span class="bx-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
