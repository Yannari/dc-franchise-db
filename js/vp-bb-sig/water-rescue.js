/**
 * Water Rescue — "TWO HALVES"
 *
 * Pool water, bright morning light, and a competition that changes character
 * completely halfway through.
 *
 * The screen exists to show the ONE thing that makes this competition worth
 * having: the fastest swimmer is regularly not the winner. So every run is a
 * split bar — blue for the swim, sand for the board — laid on a shared time
 * axis, and the person who led out of the water is marked. When somebody loses
 * a two-minute lead sitting down at a puzzle, the bars say so before the words
 * do.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=Nunito+Sans:wght@400;600&display=swap');
.sigwat{--wt-sky:#7fd4f5;--wt-deep:#0f5f8a;--wt-deep2:#073a56;--wt-sand:#f0c987;--wt-foam:#eaf8ff;
  --wt-ink:#052c3f;--wt-dim:#5d8fa6;font-family:'Nunito Sans',system-ui,sans-serif;color:var(--wt-foam);
  position:relative;overflow:clip}
.sigwat .wt-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigwat .wt-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:linear-gradient(180deg,#bfe9fb 0%,var(--wt-sky) 18%,var(--wt-deep) 52%,var(--wt-deep2) 100%)}
/* caustics on the water */
.sigwat .wt-bg::after{content:'';position:absolute;left:0;right:0;top:30%;bottom:0;opacity:.22;
  background:repeating-linear-gradient(115deg,rgba(255,255,255,.5) 0 2px,transparent 2px 16px),
             repeating-linear-gradient(65deg,rgba(255,255,255,.35) 0 2px,transparent 2px 22px);
  animation:wtCaustic 9s ease-in-out infinite alternate}
@keyframes wtCaustic{from{transform:translateX(-10px)}to{transform:translateX(12px)}}

.sigwat .wt-head{text-align:center;padding:14px 8px 6px}
/* Light, not ink: the top strip of the page is the app's dark background (the
   atmosphere layer starts below the nav), and dark-on-dark loses the label. */
.sigwat .wt-eyebrow{font-size:10px;letter-spacing:4px;color:#dff2fb;text-transform:uppercase;
  text-shadow:0 1px 3px rgba(0,0,0,.5)}
.sigwat .wt-title{font-family:'Baloo 2',cursive;font-size:42px;letter-spacing:1px;margin:2px 0;color:#fff;
  text-shadow:0 3px 0 rgba(5,44,63,.35)}
.sigwat .wt-sub{font-size:13px;color:#0a4560}

/* ── the lane ── */
.sigwat .wt-pool{position:relative;max-width:520px;margin:10px auto 16px;height:74px;border-radius:8px;
  background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.04));
  border:2px solid rgba(255,255,255,.35);overflow:hidden}
.sigwat .wt-lane{position:absolute;left:0;right:0;height:1px;background:rgba(255,255,255,.3)}
.sigwat .wt-dummy{position:absolute;top:50%;transform:translateY(-50%);width:16px;height:22px}
.sigwat .wt-dummy svg{width:100%;height:100%}
.sigwat .wt-deck{position:absolute;left:0;top:0;bottom:0;width:64px;
  background:linear-gradient(90deg,var(--wt-sand),rgba(240,201,135,.2))}

.sigwat .wt-grid{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:16px;align-items:start}
@media(max-width:860px){.sigwat .wt-grid{grid-template-columns:1fr}}
.sigwat .wt-run{margin-bottom:11px;padding:12px 14px;border-radius:12px;
  border:1px solid rgba(255,255,255,.22);background:linear-gradient(160deg,rgba(9,74,108,.86),rgba(5,44,63,.9));
  box-shadow:0 10px 22px rgba(3,30,44,.4);animation:wtIn .32s ease both}
@keyframes wtIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
.sigwat .wt-run.is-lead{border-color:rgba(240,201,135,.6)}
.sigwat .wt-run-h{display:flex;align-items:center;gap:9px;margin-bottom:9px}
.sigwat .wt-face{width:30px;height:30px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,.4)}
.sigwat .wt-face img{width:100%;height:100%;object-fit:cover}
.sigwat .wt-name{font-family:'Baloo 2',cursive;font-size:15px}
.sigwat .wt-total{margin-left:auto;font-variant-numeric:tabular-nums;font-size:13px;color:var(--wt-sand)}
/* the split bar */
.sigwat .wt-split{display:flex;height:14px;border-radius:7px;overflow:hidden;background:rgba(0,0,0,.25);margin-bottom:4px}
.sigwat .wt-split b{display:block;height:100%}
.sigwat .wt-split .wt-swim{background:linear-gradient(90deg,#39a9d8,#7fd4f5)}
.sigwat .wt-split .wt-puz{background:linear-gradient(90deg,#e0a95c,var(--wt-sand))}
.sigwat .wt-slabel{display:flex;justify-content:space-between;font-size:9.5px;color:#bfe4f4;margin-bottom:8px}
.sigwat .wt-body{font-size:12.6px;line-height:1.6;color:#e6f6ff}
.sigwat .wt-locked{margin-bottom:11px;min-height:48px;border-radius:12px;border:1px dashed rgba(234,248,255,.25);
  display:grid;place-items:center;font-family:'Baloo 2',cursive;font-size:11px;letter-spacing:2px;color:rgba(234,248,255,.4)}

.sigwat .wt-side{position:sticky;top:56px;padding:13px;border-radius:12px;
  border:1px solid rgba(255,255,255,.28);background:linear-gradient(180deg,rgba(7,58,86,.92),rgba(4,34,50,.94))}
.sigwat .wt-side-h{font-family:'Baloo 2',cursive;font-size:12px;letter-spacing:1px;color:var(--wt-sand);margin-bottom:2px}
.sigwat .wt-side-s{font-size:11px;color:#a8d5e8;margin-bottom:11px;line-height:1.45}
.sigwat .wt-srow{margin-bottom:8px}
.sigwat .wt-srow-n{display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px}
.sigwat .wt-srow-n em{font-style:normal;color:var(--wt-sand);font-variant-numeric:tabular-nums}
.sigwat .wt-legend{display:flex;gap:12px;font-size:9.5px;color:#a8d5e8;margin-bottom:10px}
.sigwat .wt-legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px}
.sigwat .wt-win{margin-top:11px;text-align:center;padding:12px;border-radius:12px;
  border:2px solid var(--wt-sand);background:rgba(240,201,135,.14)}
.sigwat .wt-win-f{width:58px;height:58px;border-radius:50%;overflow:hidden;margin:0 auto 6px;border:2px solid var(--wt-sand)}
.sigwat .wt-win-f img{width:100%;height:100%;object-fit:cover}
.sigwat .wt-win b{display:block;font-family:'Baloo 2',cursive;font-size:16px}
.sigwat .wt-win i{font-style:normal;font-size:11.5px;color:#bfe4f4}
.sigwat .wt-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.sigwat .wt-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.sigwat .wt-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px auto 2px;max-width:720px}
.sigwat .wt-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.sigwat .wt-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigwat .wt-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigwat .wt-w u{text-decoration:none;opacity:.75}
.sigwat .wt-w.is-spread{opacity:.7;font-style:italic}
.sigwat .wt-w.is-beh{opacity:.75;text-transform:none;letter-spacing:0;font-size:10px}
.sigwat .wt-count{font-family:'Baloo 2',cursive;font-size:11px;letter-spacing:2px;color:#bfe4f4}
@media(prefers-reduced-motion:reduce){
  .sigwat *,.sigwat *::before,.sigwat *::after{animation:none!important;transition:none!important}
}
</style>`;

const _DUMMY = `<svg viewBox="0 0 16 22" aria-hidden="true">
  <circle cx="8" cy="5" r="4" fill="#ff8b5e" stroke="#b8532c"/>
  <path d="M3 11h10l-1.5 9h-7z" fill="#ff8b5e" stroke="#b8532c"/></svg>`;

export function rpBuildSigWaterRescue(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_wat_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;
  const outFirst = comp.detail?.outFirst || null;
  const slowest = Math.max(1, ...Object.values(breakdown).map(r => r.seconds || 0));
  const clock = s => `${Math.floor((Number(s) || 0) / 60)}:${String((Number(s) || 0) % 60).padStart(2, '0')}`;

  const dummies = Array.from({ length: 6 }, (_, i) =>
    `<span class="wt-dummy" style="left:${28 + i * 11}%">${_DUMMY}</span>`).join('');

  let cards = '';
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="wt-locked">IN THE WATER</div>`; return; }
    const who = (b.players || [])[0];
    const row = breakdown[who];
    if (!row || row.seconds == null) {
      cards += `<div class="wt-run"><div class="wt-body">${b.text}</div></div>`;
      return;
    }
    const swimPct = Math.round((row.swimSeconds / slowest) * 100);
    const puzPct = Math.round((row.puzzleSeconds / slowest) * 100);
    cards += `<div class="wt-run ${who === outFirst ? 'is-lead' : ''}">
      <div class="wt-run-h">
        <span class="wt-face">${avatar(who, 30)}</span>
        <span class="wt-name">${esc(who)}</span>
        <span class="wt-total">${clock(row.seconds)}</span>
      </div>
      <div class="wt-split"><b class="wt-swim" style="width:${swimPct}%"></b><b class="wt-puz" style="width:${puzPct}%"></b></div>
      <div class="wt-slabel"><span>swim ${clock(row.swimSeconds)}</span><span>board ${clock(row.puzzleSeconds)}</span></div>
      <div class="wt-body">${b.text}</div>
    </div>`;
  });

  const rows = (comp.placements || []).slice(0, 8).map(name => {
    const row = breakdown[name] || {};
    const swimPct = done ? Math.round(((row.swimSeconds || 0) / slowest) * 100) : 0;
    const puzPct = done ? Math.round(((row.puzzleSeconds || 0) / slowest) * 100) : 0;
    return `<div class="wt-srow">
      <div class="wt-srow-n"><span>${esc(name)}${name === outFirst ? ' ◂ led out' : ''}</span>
        <em>${done ? clock(row.seconds) : '--:--'}</em></div>
      <div class="wt-split"><b class="wt-swim" style="width:${swimPct}%"></b><b class="wt-puz" style="width:${puzPct}%"></b></div>
    </div>`;
  }).join('');

  return `<div class="rp-page sigwat">${_STYLE}
    <div class="wt-bg"></div>
    <div class="wt-wrap">
      <div class="wt-head">
        <div class="wt-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : 'Head of Household')}</div>
        <div class="wt-title">WATER RESCUE</div>
        <div class="wt-sub">Get them all out of the water. Then sit down and build a surfboard.</div>
        ${comp.desc ? `<div class="wt-rules">${esc(comp.desc)}</div>` : ''}
        ${(() => {
          // What the competition actually reads. `spreadStat` is drawn apart from
          // the weights on purpose: a stat that widens the SPREAD does not make a
          // houseguest better, it makes them less predictable, and putting it in
          // the same bar would say the opposite.
          const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
          if (!w.length) return '';
          const bars = w.map(([k, v]) => `<span class="wt-w"><i>${esc(k)}</i><span class="wt-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('');
          const spread = comp.spreadStat
            ? `<span class="wt-w is-spread" title="Widens the spread rather than raising the score"><i>± ${esc(comp.spreadStat)}</i><u>consistency</u></span>` : '';
          const beh = (comp.behaviour || []).map(b => `<span class="wt-w is-beh"><i>${esc(b.label)}</i><u>${Math.round(b.weight * 100)}%</u></span>`).join('');
          return `<div class="wt-weights">${bars}${spread}${beh}</div>`;
        })()}
      </div>
      <div class="wt-pool">
        <div class="wt-lane" style="top:33%"></div><div class="wt-lane" style="top:66%"></div>
        <div class="wt-deck"></div>${dummies}
      </div>
      <div class="wt-grid">
        <div>${cards}</div>
        <aside class="wt-side">
          <div class="wt-side-h">TWO HALVES</div>
          <div class="wt-side-s">Where each of them actually spent the time.</div>
          <div class="wt-legend">
            <span><i style="background:#39a9d8"></i>swim</span>
            <span><i style="background:var(--wt-sand)"></i>board</span>
          </div>
          ${rows}
          ${done && winner ? `<div class="wt-win">
            <div class="wt-win-f">${avatar(winner, 58)}</div>
            <b>${esc(winner)}</b>
            <i>${winner === outFirst ? 'led it out and kept it' : 'won it on the board'}</i></div>` : ''}
        </aside>
      </div>
      <div class="wt-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Next in the water</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Every run</button>`}
        <span class="wt-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
