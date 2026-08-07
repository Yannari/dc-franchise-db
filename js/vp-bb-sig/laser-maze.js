/**
 * Laser Maze — "THE GRID"
 *
 * A dark room full of red light. The grid itself is drawn across the top of the
 * screen as a set of beams at different heights, and every run is scored
 * section by section: a section walked clean leaves its beams intact, a section
 * with a break lights the whole thing red.
 *
 * The competition's failure is a TOUCH — not fatigue, not a drop — so the
 * screen's only animation is the beams themselves, humming very slightly, and
 * the only loud thing on the page is a section that got clipped.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap');
.siglaz{--lz-void:#0a0509;--lz-beam:#ff3b57;--lz-safe:#39d0c8;--lz-ink:#f2e9ec;--lz-dim:#8a7a80;
  font-family:'Chakra Petch',system-ui,sans-serif;color:var(--lz-ink);position:relative;overflow:clip}
.siglaz .lz-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.siglaz .lz-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(70% 40% at 50% 6%,rgba(255,59,87,0.14),transparent 62%),
             linear-gradient(180deg,#140910,var(--lz-void) 70%,#050205)}
.siglaz .lz-bg::after{content:'';position:absolute;inset:0;opacity:.5;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.02) 0 2px,transparent 2px 6px)}

.siglaz .lz-head{text-align:center;padding:14px 8px 4px}
.siglaz .lz-eyebrow{font-size:9.5px;letter-spacing:5px;color:var(--lz-beam);text-transform:uppercase}
.siglaz .lz-title{font-size:38px;font-weight:700;letter-spacing:5px;margin:5px 0 2px;color:var(--lz-ink);
  text-shadow:0 0 24px rgba(255,59,87,.4)}
.siglaz .lz-sub{font-size:12.5px;color:#c9b6bc}

/* ── the grid across the top ── */
.siglaz .lz-room{position:relative;height:120px;margin:12px auto 16px;max-width:560px;border-radius:6px;
  border:1px solid rgba(255,59,87,.2);background:linear-gradient(180deg,rgba(20,9,16,.9),rgba(5,2,5,.95));
  overflow:hidden}
.siglaz .lz-beam{position:absolute;left:6%;right:6%;height:2px;border-radius:2px;background:var(--lz-beam);
  box-shadow:0 0 10px rgba(255,59,87,.8);opacity:.75;animation:lzHum 3.2s ease-in-out infinite}
.siglaz .lz-beam:nth-child(2n){animation-delay:.7s}
.siglaz .lz-beam:nth-child(3n){animation-delay:1.5s;left:12%;right:12%}
@keyframes lzHum{0%,100%{opacity:.55}50%{opacity:.95}}
.siglaz .lz-plinth{position:absolute;right:5%;bottom:8px;width:44px;height:16px;border-radius:3px;
  background:linear-gradient(180deg,#39d0c8,#166a67);box-shadow:0 0 14px rgba(57,208,200,.5)}
.siglaz .lz-start{position:absolute;left:5%;bottom:8px;width:44px;height:16px;border-radius:3px;
  background:rgba(255,255,255,.14)}

.siglaz .lz-grid{display:grid;grid-template-columns:minmax(0,1fr) 234px;gap:16px;align-items:start}
@media(max-width:860px){.siglaz .lz-grid{grid-template-columns:1fr}}
.siglaz .lz-run{margin-bottom:11px;padding:12px 14px;border-radius:4px;
  border:1px solid rgba(255,255,255,.08);border-left:3px solid var(--lz-safe);
  background:linear-gradient(160deg,rgba(24,11,18,.94),rgba(6,3,6,.96));
  box-shadow:0 10px 22px rgba(0,0,0,.5);animation:lzIn .3s ease both}
@keyframes lzIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.siglaz .lz-run.is-hit{border-left-color:var(--lz-beam)}
.siglaz .lz-run-h{display:flex;align-items:center;gap:9px;margin-bottom:9px}
.siglaz .lz-face{width:30px;height:30px;border-radius:3px;overflow:hidden;border:1px solid rgba(255,255,255,.16)}
.siglaz .lz-face img{width:100%;height:100%;object-fit:cover}
.siglaz .lz-name{font-weight:700;font-size:13.5px;letter-spacing:.6px}
.siglaz .lz-clock{margin-left:auto;font-variant-numeric:tabular-nums;font-size:13px;color:var(--lz-safe)}
.siglaz .lz-run.is-hit .lz-clock{color:var(--lz-beam)}
/* per-section strip */
.siglaz .lz-secs{display:flex;gap:5px;margin-bottom:9px}
.siglaz .lz-sec{flex:1;height:22px;border-radius:3px;border:1px solid rgba(57,208,200,.3);
  background:rgba(57,208,200,.08);display:grid;place-items:center;font-size:9px;letter-spacing:1px;color:#a9e9e5}
.siglaz .lz-sec.is-hit{border-color:rgba(255,59,87,.55);background:rgba(255,59,87,.14);color:#ffc0c8;
  box-shadow:0 0 12px rgba(255,59,87,.2) inset}
.siglaz .lz-body{font-size:12.6px;line-height:1.6;color:#dccdd2}
.siglaz .lz-locked{margin-bottom:11px;min-height:46px;border-radius:4px;border:1px dashed rgba(242,233,236,.14);
  display:grid;place-items:center;font-size:9.5px;letter-spacing:4px;color:rgba(242,233,236,.24)}

.siglaz .lz-side{position:sticky;top:56px;padding:13px;border-radius:4px;
  border:1px solid rgba(255,59,87,.2);background:linear-gradient(180deg,rgba(18,8,14,.96),rgba(4,2,4,.96))}
.siglaz .lz-side-h{font-size:10px;letter-spacing:2.4px;font-weight:700;color:var(--lz-beam);margin-bottom:2px}
.siglaz .lz-side-s{font-size:11px;color:var(--lz-dim);margin-bottom:11px;line-height:1.45}
.siglaz .lz-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:7px}
.siglaz .lz-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.siglaz .lz-dots{display:flex;gap:3px}
.siglaz .lz-dot{width:7px;height:7px;border-radius:1px;background:rgba(57,208,200,.55)}
.siglaz .lz-dot.is-hit{background:var(--lz-beam)}
.siglaz .lz-srow em{font-style:normal;font-size:10px;color:var(--lz-safe);min-width:34px;text-align:right;
  font-variant-numeric:tabular-nums}
.siglaz .lz-win{margin-top:11px;text-align:center;padding:11px;border-radius:4px;
  border:1px solid var(--lz-safe);background:rgba(57,208,200,.1)}
.siglaz .lz-win-f{width:54px;height:54px;border-radius:3px;overflow:hidden;margin:0 auto 5px;border:2px solid var(--lz-safe)}
.siglaz .lz-win-f img{width:100%;height:100%;object-fit:cover}
.siglaz .lz-win b{display:block;font-size:14px;font-weight:700;letter-spacing:1px}
.siglaz .lz-win i{font-style:normal;font-size:11px;color:var(--lz-dim)}
.siglaz .lz-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.siglaz .lz-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.siglaz .lz-count{font-size:10px;letter-spacing:2px;color:var(--lz-dim)}
@media(prefers-reduced-motion:reduce){
  .siglaz *,.siglaz *::before,.siglaz *::after{animation:none!important;transition:none!important}
}
</style>`;

export function rpBuildSigLaserMaze(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_laz_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;
  const sections = comp.detail?.sections || 4;
  const clock = s => `${Math.floor((Number(s) || 0) / 60)}:${String((Number(s) || 0) % 60).padStart(2, '0')}`;

  const beamRows = Array.from({ length: 7 }, (_, i) =>
    `<div class="lz-beam" style="top:${10 + i * 14}%"></div>`).join('');

  let cards = '';
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="lz-locked">GRID ARMED</div>`; return; }
    const who = (b.players || [])[0];
    const row = breakdown[who];
    if (!row || row.seconds == null) {
      cards += `<div class="lz-run"><div class="lz-body">${b.text}</div></div>`;
      return;
    }
    const broke = row.beamsBroken || 0;
    const strip = Array.from({ length: sections }, (_, k) =>
      `<div class="lz-sec ${k < broke ? 'is-hit' : ''}">${k < broke ? 'BEAM' : 'CLEAN'}</div>`).join('');
    cards += `<div class="lz-run ${broke ? 'is-hit' : ''}">
      <div class="lz-run-h">
        <span class="lz-face">${avatar(who, 30)}</span>
        <span class="lz-name">${esc(who)}</span>
        <span class="lz-clock">${clock(row.seconds)}</span>
      </div>
      <div class="lz-secs">${strip}</div>
      <div class="lz-body">${b.text}</div>
    </div>`;
  });

  const rows = (comp.placements || []).slice(0, 8).map(name => {
    const row = breakdown[name] || {};
    const dots = Array.from({ length: sections }, (_, k) =>
      `<i class="lz-dot ${done && k < (row.beamsBroken || 0) ? 'is-hit' : ''}"></i>`).join('');
    return `<div class="lz-srow"><span>${esc(name)}</span>
      <span class="lz-dots">${dots}</span>
      <em>${done ? clock(row.seconds) : '--:--'}</em></div>`;
  }).join('');

  return `<div class="rp-page siglaz">${_STYLE}
    <div class="lz-bg"></div>
    <div class="lz-wrap">
      <div class="lz-head">
        <div class="lz-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : 'Head of Household')}</div>
        <div class="lz-title">LASER MAZE</div>
        <div class="lz-sub">Carry the case through. The case counts as you.</div>
        ${comp.desc ? `<div class="lz-rules">${esc(comp.desc)}</div>` : ''}
      </div>
      <div class="lz-room">${beamRows}<div class="lz-start"></div><div class="lz-plinth"></div></div>
      <div class="lz-grid">
        <div>${cards}</div>
        <aside class="lz-side">
          <div class="lz-side-h">SECTIONS · CLOCK</div>
          <div class="lz-side-s">Four sections. A red one is a beam somebody clipped.</div>
          ${rows}
          ${done && winner ? `<div class="lz-win">
            <div class="lz-win-f">${avatar(winner, 54)}</div>
            <b>${esc(winner)}</b><i>${breakdown[winner]?.beamsBroken ? `${breakdown[winner].beamsBroken} beams` : 'clean run'} · ${clock(breakdown[winner]?.seconds)}</i></div>` : ''}
        </aside>
      </div>
      <div class="lz-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Send the next one</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Every run</button>`}
        <span class="lz-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
