/**
 * What's The Hold Up — "THE QUIET ONE"
 *
 * Nothing spins, nothing is thrown, nobody gets wet. A row of houseguests
 * standing well back from a wall, each holding a plaque against it with the far
 * end of a long flexible pole, for as long as their arms will let them.
 *
 * The screen is deliberately the calmest in the directory: pale concrete, a
 * single cool light, no ambient animation except one very slow tremor on the
 * poles. Every other competition screen shouts; this competition is silence and
 * arms, and a loud screen would be lying about it.
 *
 * The furniture is a row of poles drawn at their real lengths, with the plaque
 * still up on the ones still standing and slid to the floor on the ones that
 * are gone.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700&display=swap');
.sigheld{--hu-wall:#cfd3d6;--hu-wall2:#a9aeb3;--hu-cold:#7fa8c9;--hu-warn:#c96f5c;--hu-ink:#20262b;
  --hu-dim:#6b757e;font-family:'Archivo',system-ui,sans-serif;color:var(--hu-ink);position:relative;overflow:clip}
.sigheld .hu-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigheld .hu-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(60% 40% at 50% 0%,rgba(255,255,255,0.5),transparent 60%),
    repeating-linear-gradient(0deg,rgba(0,0,0,0.018) 0 3px,transparent 3px 6px),
    linear-gradient(180deg,var(--hu-wall),var(--hu-wall2) 78%,#8f959b)}

/* The atmosphere layer starts at 46px so it never paints over the nav bar,
   which leaves the very top of the page showing the app's own dark background.
   A pale-concrete screen with dark type has to carry its own plate up there or
   the title is charcoal on charcoal. */
.sigheld .hu-head{text-align:center;padding:14px 12px 12px;margin-top:8px;border-radius:6px;
  background:linear-gradient(180deg,rgba(255,255,255,.82),rgba(255,255,255,.5));
  border:1px solid rgba(32,38,43,.1)}
.sigheld .hu-eyebrow{font-size:9.5px;letter-spacing:5px;color:var(--hu-dim);text-transform:uppercase}
.sigheld .hu-title{font-size:34px;font-weight:700;letter-spacing:4px;margin:6px 0 3px;color:var(--hu-ink)}
.sigheld .hu-sub{font-size:12.5px;color:#4d565e;max-width:460px;margin:0 auto}

/* ── the line of poles ── */
.sigheld .hu-line{display:flex;align-items:flex-end;justify-content:center;gap:10px;flex-wrap:wrap;
  margin:16px auto 18px;padding:14px 10px 8px;border-radius:4px;background:rgba(255,255,255,.35);
  border:1px solid rgba(32,38,43,.1)}
.sigheld .hu-stand{width:56px;text-align:center}
.sigheld .hu-pole{position:relative;height:84px;display:flex;align-items:flex-start;justify-content:center}
.sigheld .hu-pole i{position:absolute;bottom:0;width:2.5px;height:78px;border-radius:2px;
  background:linear-gradient(180deg,#5c6870,#2a3238);transform-origin:50% 100%;
  animation:huTremor 5.5s ease-in-out infinite}
.sigheld .hu-stand:nth-child(2n) .hu-pole i{animation-delay:1.4s}
.sigheld .hu-stand:nth-child(3n) .hu-pole i{animation-delay:2.7s}
@keyframes huTremor{0%,100%{transform:rotate(-1.1deg)}50%{transform:rotate(1.4deg)}}
.sigheld .hu-plaque{position:absolute;top:0;width:26px;height:18px;border-radius:2px;
  background:linear-gradient(160deg,#8f6b3a,#5f4623);border:1px solid #3f2f18;
  box-shadow:0 2px 5px rgba(0,0,0,.25)}
.sigheld .hu-stand.is-down .hu-pole i{animation:none;transform:rotate(38deg);opacity:.5}
.sigheld .hu-stand.is-down .hu-plaque{top:auto;bottom:0;background:#6c6c6c;border-color:#4a4a4a;opacity:.6}
.sigheld .hu-n{font-size:9.5px;margin-top:5px;color:#3c454c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigheld .hu-stand.is-down .hu-n{color:#8a939a;text-decoration:line-through}
.sigheld .hu-t{font-size:9px;color:var(--hu-dim)}

.sigheld .hu-grid{display:grid;grid-template-columns:minmax(0,1fr) 232px;gap:16px;align-items:start}
@media(max-width:860px){.sigheld .hu-grid{grid-template-columns:1fr}}
.sigheld .hu-card{margin-bottom:9px;padding:11px 13px;border-radius:3px;background:rgba(255,255,255,.72);
  border:1px solid rgba(32,38,43,.12);border-left:3px solid var(--hu-cold);
  box-shadow:0 4px 12px rgba(0,0,0,.1);animation:huIn .3s ease both}
@keyframes huIn{from{opacity:0}to{opacity:1}}
.sigheld .hu-card.is-down{border-left-color:var(--hu-warn)}
.sigheld .hu-card.is-win{border-left-color:#3f7d52;background:rgba(232,245,235,.85)}
.sigheld .hu-tag{font-size:9px;letter-spacing:2.2px;font-weight:700;color:var(--hu-dim);margin-bottom:5px}
.sigheld .hu-body{font-size:12.6px;line-height:1.6;color:#2b333a}
.sigheld .hu-locked{margin-bottom:9px;min-height:40px;border-radius:3px;border:1px dashed rgba(32,38,43,.18);
  display:grid;place-items:center;font-size:9.5px;letter-spacing:3px;color:rgba(32,38,43,.3)}

.sigheld .hu-side{position:sticky;top:56px;padding:13px;border-radius:3px;background:rgba(255,255,255,.8);
  border:1px solid rgba(32,38,43,.14)}
.sigheld .hu-side-h{font-size:10px;letter-spacing:2.4px;font-weight:700;color:var(--hu-ink);margin-bottom:2px}
.sigheld .hu-side-s{font-size:11px;color:var(--hu-dim);margin-bottom:11px;line-height:1.45}
.sigheld .hu-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:7px}
.sigheld .hu-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigheld .hu-mini{width:56px;height:5px;border-radius:3px;background:rgba(32,38,43,.1);overflow:hidden}
.sigheld .hu-mini b{display:block;height:100%;background:linear-gradient(90deg,var(--hu-cold),#b9d6ea)}
.sigheld .hu-srow em{font-style:normal;font-size:10px;color:var(--hu-dim);min-width:34px;text-align:right}
.sigheld .hu-win{margin-top:11px;text-align:center;padding:11px;border-radius:3px;
  border:1px solid #3f7d52;background:rgba(63,125,82,.1)}
.sigheld .hu-win-f{width:54px;height:54px;border-radius:50%;overflow:hidden;margin:0 auto 5px;border:2px solid #3f7d52}
.sigheld .hu-win-f img{width:100%;height:100%;object-fit:cover}
.sigheld .hu-win b{display:block;font-size:14px;font-weight:700}
.sigheld .hu-win i{font-style:normal;font-size:11px;color:var(--hu-dim)}
.sigheld .hu-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.sigheld .hu-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.sigheld .hu-count{font-size:10px;letter-spacing:2px;color:var(--hu-dim)}
@media(prefers-reduced-motion:reduce){
  .sigheld *,.sigheld *::before,.sigheld *::after{animation:none!important;transition:none!important}
}
</style>`;

export function rpBuildSigHoldUp(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_held_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;
  const roster = (act.participants && act.participants.length
    ? act.participants : (comp.placements || [])).filter(Boolean);
  const longest = Math.max(1, ...Object.values(breakdown).map(r => r.minutes || 0));

  const down = new Set();
  beats.slice(0, state.idx + 1).forEach(b => {
    if (/PLAQUE DOWN|RUNNER-UP/.test(b.badgeText || '')) (b.players || []).forEach(n => down.add(n));
  });

  const line = roster.map(name => {
    const row = breakdown[name] || {};
    return `<div class="hu-stand ${down.has(name) ? 'is-down' : ''}">
      <div class="hu-pole"><i></i><div class="hu-plaque"></div></div>
      <div class="hu-n">${esc(name)}</div>
      <div class="hu-t">${down.has(name) && row.minutes != null ? `${row.minutes.toFixed(1)}m` : ''}</div>
    </div>`;
  }).join('');

  let cards = '';
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="hu-locked">HOLDING</div>`; return; }
    const isDown = /PLAQUE DOWN|RUNNER-UP/.test(b.badgeText || '');
    const isWin = (b.badgeText || '') === 'WINS IT';
    cards += `<div class="hu-card ${isDown ? 'is-down' : isWin ? 'is-win' : ''}">
      <div class="hu-tag">${esc(b.badgeText || '')}</div>
      <div class="hu-body">${b.text}</div>
    </div>`;
  });

  const rows = (comp.placements || []).slice(0, 8).map(name => {
    const row = breakdown[name] || {};
    return `<div class="hu-srow"><span>${esc(name)}</span>
      <span class="hu-mini"><b style="width:${done ? Math.round(((row.minutes || 0) / longest) * 100) : 0}%"></b></span>
      <em>${done && row.minutes != null ? `${row.minutes.toFixed(1)}m` : '—'}</em></div>`;
  }).join('');

  return `<div class="rp-page sigheld">${_STYLE}
    <div class="hu-bg"></div>
    <div class="hu-wrap">
      <div class="hu-head">
        <div class="hu-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : 'Head of Household')}</div>
        <div class="hu-title">WHAT'S THE HOLD UP</div>
        <div class="hu-sub">Nothing is thrown and nothing spins. It is the weight of your own arms, at the end of a pole that magnifies every tremor.</div>
        ${comp.desc ? `<div class="hu-rules">${esc(comp.desc)}</div>` : ''}
      </div>
      <div class="hu-line">${line}</div>
      <div class="hu-grid">
        <div>${cards}</div>
        <aside class="hu-side">
          <div class="hu-side-h">TIME ON THE WALL</div>
          <div class="hu-side-s">${roster.length - down.size} plaque${roster.length - down.size === 1 ? '' : 's'} still up.</div>
          ${rows}
          ${done && winner ? `<div class="hu-win">
            <div class="hu-win-f">${avatar(winner, 54)}</div>
            <b>${esc(winner)}</b><i>${(breakdown[winner]?.minutes || 0).toFixed(1)} minutes, arms out</i></div>` : ''}
        </aside>
      </div>
      <div class="hu-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Next to go</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Wait it out</button>`}
        <span class="hu-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
