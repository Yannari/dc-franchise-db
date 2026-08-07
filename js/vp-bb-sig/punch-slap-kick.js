/**
 * Punch, Slap, Kick — "THE MACHINE"
 *
 * Hazard stripes, rivets, and a rig with three articulated arms hanging over a
 * padded stall. One houseguest at a time steps in and the machine starts
 * counting.
 *
 * The screen's job is to make a NUMBER feel like a beating. Every run draws the
 * sequence it survived as a row of actual hit glyphs — fist, palm, boot — that
 * light up one by one and then stop dead where the houseguest lost it, with the
 * remaining slots left dark. Six runs side by side is a bar chart made of
 * punches, and the one that ends nine glyphs along is visibly the winner before
 * any number is read.
 *
 * A failed run shakes. That is the only animation on the card, and it fires
 * once, because a screen that shakes constantly stops meaning anything.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Barlow:wght@400;600;800&display=swap');
.sigpsk{--pk-steel:#2b3038;--pk-steel2:#171a1f;--pk-haz:#f5c518;--pk-red:#e0332f;--pk-ink:#e9edf2;
  --pk-dim:#8d97a3;font-family:'Barlow',system-ui,sans-serif;color:var(--pk-ink);position:relative;overflow:clip}
.sigpsk .pk-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigpsk .pk-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(80% 50% at 50% 0%,rgba(245,197,24,0.12),transparent 60%),
    repeating-linear-gradient(0deg,rgba(255,255,255,0.02) 0 1px,transparent 1px 4px),
    linear-gradient(180deg,var(--pk-steel),var(--pk-steel2) 65%,#0c0e11)}
/* rivet rows down both edges */
.sigpsk .pk-bg::after{content:'';position:absolute;inset:0;
  background:
    radial-gradient(circle at 10px 22px,rgba(255,255,255,.16) 0 2px,transparent 2px),
    radial-gradient(circle at calc(100% - 10px) 22px,rgba(255,255,255,.16) 0 2px,transparent 2px);
  background-size:100% 46px}

.sigpsk .pk-haz{height:12px;background:repeating-linear-gradient(45deg,var(--pk-haz) 0 14px,#141518 14px 28px);
  opacity:.85;border-radius:2px}
.sigpsk .pk-head{text-align:center;padding:12px 8px 6px}
.sigpsk .pk-eyebrow{font-size:10px;letter-spacing:4px;color:var(--pk-haz);font-weight:800}
.sigpsk .pk-title{font-family:'Black Ops One',cursive;font-size:38px;letter-spacing:2px;margin:5px 0 2px;
  color:var(--pk-ink);text-shadow:0 3px 0 #000,0 0 26px rgba(245,197,24,.28)}
.sigpsk .pk-sub{font-size:13px;color:#c4ccd6}

/* ── the rig ── */
.sigpsk .pk-rig{display:flex;align-items:flex-end;justify-content:center;gap:26px;margin:6px 0 14px}
.sigpsk .pk-arm{text-align:center}
.sigpsk .pk-arm svg{display:block}
.sigpsk .pk-arm-l{font-family:'Black Ops One',cursive;font-size:9px;letter-spacing:2px;color:var(--pk-dim);margin-top:4px}
.sigpsk .pk-arm.is-live svg{animation:pkSwing 1.9s ease-in-out infinite}
@keyframes pkSwing{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(9deg)}}

.sigpsk .pk-grid{display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:16px;align-items:start}
@media(max-width:860px){.sigpsk .pk-grid{grid-template-columns:1fr}}

/* ── a run ── */
.sigpsk .pk-run{margin-bottom:11px;padding:12px 14px;border-radius:4px;
  border:1px solid rgba(255,255,255,.09);border-left:4px solid var(--pk-dim);
  background:linear-gradient(160deg,rgba(43,48,56,.94),rgba(15,17,20,.94));
  box-shadow:0 10px 22px rgba(0,0,0,.45);animation:pkIn .34s ease both}
@keyframes pkIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
.sigpsk .pk-run.is-far{border-left-color:var(--pk-haz)}
.sigpsk .pk-run.is-out{border-left-color:var(--pk-red);animation:pkIn .34s ease both,pkShake .5s ease .34s 1}
@keyframes pkShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(3px)}
  30%,50%,70%{transform:translateX(-5px)}40%,60%{transform:translateX(5px)}}
.sigpsk .pk-run-h{display:flex;align-items:center;gap:9px;margin-bottom:8px}
.sigpsk .pk-face{width:30px;height:30px;border-radius:3px;overflow:hidden;border:1px solid rgba(255,255,255,.16)}
.sigpsk .pk-face img{width:100%;height:100%;object-fit:cover}
.sigpsk .pk-run-n{font-family:'Black Ops One',cursive;font-size:14px;letter-spacing:.6px}
.sigpsk .pk-badge{margin-left:auto;font-family:'Black Ops One',cursive;font-size:9.5px;letter-spacing:1.6px;
  padding:3px 8px;border-radius:2px;background:rgba(255,255,255,.08);color:var(--pk-dim)}
.sigpsk .pk-run.is-far .pk-badge{background:var(--pk-haz);color:#141518}
.sigpsk .pk-run.is-out .pk-badge{background:var(--pk-red);color:#fff}
/* the sequence, drawn as hits */
.sigpsk .pk-seq{display:flex;gap:4px;margin-bottom:9px;flex-wrap:wrap}
.sigpsk .pk-hit{width:26px;height:26px;border-radius:3px;display:grid;place-items:center;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09)}
.sigpsk .pk-hit.is-on{background:rgba(245,197,24,.16);border-color:rgba(245,197,24,.5)}
.sigpsk .pk-hit.is-break{background:rgba(224,51,47,.18);border-color:rgba(224,51,47,.55)}
.sigpsk .pk-hit svg{width:15px;height:15px;opacity:.9}
.sigpsk .pk-body{font-size:12.8px;line-height:1.6;color:#d5dce4}
.sigpsk .pk-locked{margin-bottom:11px;min-height:52px;border-radius:4px;border:1px dashed rgba(233,237,242,.14);
  display:grid;place-items:center;font-family:'Black Ops One',cursive;font-size:10px;letter-spacing:3px;
  color:rgba(233,237,242,.28)}

/* ── the ladder ── */
.sigpsk .pk-side{position:sticky;top:56px;padding:12px;border-radius:4px;
  border:1px solid rgba(245,197,24,.2);background:linear-gradient(180deg,rgba(28,31,36,.96),rgba(12,14,17,.96))}
.sigpsk .pk-side-h{font-family:'Black Ops One',cursive;font-size:10.5px;letter-spacing:2px;color:var(--pk-haz);margin-bottom:2px}
.sigpsk .pk-side-s{font-size:11px;color:var(--pk-dim);margin-bottom:10px;line-height:1.45}
.sigpsk .pk-lrow{display:flex;align-items:center;gap:7px;margin-bottom:7px;font-size:12px}
.sigpsk .pk-lrow span{min-width:52px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigpsk .pk-track{flex:1;height:9px;border-radius:2px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 9px,transparent 9px 10px)}
.sigpsk .pk-track b{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,var(--pk-haz),#fff0b0);
  transition:width .5s ease}
.sigpsk .pk-lrow em{font-style:normal;font-family:'Black Ops One',cursive;font-size:10px;color:var(--pk-haz);min-width:16px;text-align:right}
.sigpsk .pk-win{margin-top:11px;text-align:center;padding:11px;border-radius:4px;
  border:1px solid var(--pk-haz);background:rgba(245,197,24,.12)}
.sigpsk .pk-win-f{width:56px;height:56px;border-radius:3px;overflow:hidden;margin:0 auto 5px;border:2px solid var(--pk-haz)}
.sigpsk .pk-win-f img{width:100%;height:100%;object-fit:cover}
.sigpsk .pk-win b{display:block;font-family:'Black Ops One',cursive;font-size:14px;color:var(--pk-ink)}
.sigpsk .pk-win i{font-style:normal;font-size:11.5px;color:var(--pk-dim)}
.sigpsk .pk-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.sigpsk .pk-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.sigpsk .pk-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px auto 2px;max-width:720px}
.sigpsk .pk-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.sigpsk .pk-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigpsk .pk-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigpsk .pk-w u{text-decoration:none;opacity:.75}
.sigpsk .pk-w.is-spread{opacity:.7;font-style:italic}
.sigpsk .pk-w.is-beh{opacity:.75;text-transform:none;letter-spacing:0;font-size:10px}
.sigpsk .pk-count{font-family:'Black Ops One',cursive;font-size:10px;letter-spacing:2px;color:var(--pk-dim)}
@media(prefers-reduced-motion:reduce){
  .sigpsk *,.sigpsk *::before,.sigpsk *::after{animation:none!important;transition:none!important}
}
</style>`;

const _FIST = `<svg viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="1.8" stroke-linejoin="round">
  <path d="M6 11V8a2 2 0 0 1 4 0v3M10 11V7a2 2 0 0 1 4 0v4M14 11V8a2 2 0 0 1 4 0v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-3a2 2 0 0 1 4 0"/></svg>`;
const _PALM = `<svg viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="1.8" stroke-linecap="round">
  <path d="M7 13V5a1.6 1.6 0 0 1 3.2 0v6M10.2 11V4a1.6 1.6 0 0 1 3.2 0v7M13.4 11V6a1.6 1.6 0 0 1 3.2 0v8a6 6 0 0 1-6 6 6 6 0 0 1-6-6v-2"/></svg>`;
const _BOOT = `<svg viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="1.8" stroke-linejoin="round">
  <path d="M8 3v9l-3 4v3h14v-3c0-2-2-3-4-3h-3V3z"/></svg>`;
const _GLYPHS = [_FIST, _PALM, _BOOT];

/** One of the three arms hanging off the rig. */
const _arm = (glyph, label, live) => `<div class="pk-arm ${live ? 'is-live' : ''}">
  <svg viewBox="0 0 60 90" width="52" height="78" aria-hidden="true">
    <rect x="26" y="0" width="8" height="34" fill="#5a636e"/>
    <circle cx="30" cy="36" r="6" fill="#8d97a3"/>
    <rect x="26" y="40" width="8" height="26" fill="#5a636e"/>
    <rect x="18" y="64" width="24" height="18" rx="4" fill="#2b3038" stroke="#8d97a3"/>
  </svg>
  <div class="pk-arm-l">${label}</div>
</div>`;

export function rpBuildSigPunchSlapKick(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_psk_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const runs = comp.detail?.runs || [];
  const winner = act.winner || comp.winner || null;
  const longest = Math.max(1, ...runs.map(r => r.sequence || 0));

  const seqOf = n => {
    const cells = [];
    for (let k = 0; k < 9; k++) {
      const on = k < n;
      const brk = k === n;
      cells.push(`<div class="pk-hit ${on ? 'is-on' : brk ? 'is-break' : ''}">${on || brk ? _GLYPHS[k % 3] : ''}</div>`);
    }
    return cells.join('');
  };

  let cards = '';
  let ri = 0;
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="pk-locked">STALL EMPTY</div>`; return; }
    const who = (b.players || [])[0];
    const run = runs.find(r => r.name === who);
    if (!run) {
      cards += `<div class="pk-run is-far"><div class="pk-run-h">
        <div class="pk-run-n">${esc(b.badgeText || 'THE MACHINE')}</div></div>
        <div class="pk-body">${b.text}</div></div>`;
      return;
    }
    ri++;
    const n = run.sequence || 0;
    cards += `<div class="pk-run ${n >= 4 ? 'is-far' : n === 0 ? 'is-out' : ''}">
      <div class="pk-run-h">
        <span class="pk-face">${avatar(who, 30)}</span>
        <span class="pk-run-n">${esc(who)}</span>
        <span class="pk-badge">${esc(b.badgeText || '')}</span>
      </div>
      <div class="pk-seq">${seqOf(n)}</div>
      <div class="pk-body">${b.text}</div>
    </div>`;
  });

  const ladder = (comp.placements || []).slice(0, 8).map(name => {
    const row = breakdown[name] || {};
    const n = row.sequence || 0;
    return `<div class="pk-lrow"><span>${esc(name)}</span>
      <span class="pk-track"><b style="width:${done ? Math.round((n / Math.max(1, longest)) * 100) : 0}%"></b></span>
      <em>${done ? n : '—'}</em></div>`;
  }).join('');

  return `<div class="rp-page sigpsk">${_STYLE}
    <div class="pk-bg"></div>
    <div class="pk-wrap">
      <div class="pk-haz"></div>
      <div class="pk-head">
        <div class="pk-eyebrow">${esc(actType === 'veto' ? 'POWER OF VETO' : 'HEAD OF HOUSEHOLD')}</div>
        <div class="pk-title">PUNCH, SLAP, KICK</div>
        <div class="pk-sub">Remember the order. While it is happening to you.</div>
        ${comp.desc ? `<div class="pk-rules">${esc(comp.desc)}</div>` : ''}
        ${(() => {
          // What the competition actually reads. `spreadStat` is drawn apart from
          // the weights on purpose: a stat that widens the SPREAD does not make a
          // houseguest better, it makes them less predictable, and putting it in
          // the same bar would say the opposite.
          const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
          if (!w.length) return '';
          const bars = w.map(([k, v]) => `<span class="pk-w"><i>${esc(k)}</i><span class="pk-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('');
          const spread = comp.spreadStat
            ? `<span class="pk-w is-spread" title="Widens the spread rather than raising the score"><i>± ${esc(comp.spreadStat)}</i><u>consistency</u></span>` : '';
          const beh = (comp.behaviour || []).map(b => `<span class="pk-w is-beh"><i>${esc(b.label)}</i><u>${Math.round(b.weight * 100)}%</u></span>`).join('');
          return `<div class="pk-weights">${bars}${spread}${beh}</div>`;
        })()}
      </div>
      <div class="pk-rig">
        ${_arm(_FIST, 'PUNCH', true)}${_arm(_PALM, 'SLAP', false)}${_arm(_BOOT, 'KICK', true)}
      </div>
      <div class="pk-grid">
        <div>${cards}</div>
        <aside class="pk-side">
          <div class="pk-side-h">SEQUENCE LADDER</div>
          <div class="pk-side-s">How far each of them got before the order fell apart.</div>
          ${ladder}
          ${done && winner ? `<div class="pk-win">
            <div class="pk-win-f">${avatar(winner, 56)}</div>
            <b>${esc(winner)}</b><i>${breakdown[winner]?.sequence || 0} hits, in order</i></div>` : ''}
        </aside>
      </div>
      <div class="pk-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Next in the stall</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Run them all</button>`}
        <span class="pk-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
      <div class="pk-haz" style="margin-top:8px"></div>
    </div>
  </div>`;
}
