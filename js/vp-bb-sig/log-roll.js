/**
 * Log Roll — "TWO CLOCKS"
 *
 * Water at dusk, logs turning in it, and a weight swinging on the end of a
 * string that must never touch anything.
 *
 * The screen is built around the rule that makes this competition unlike any
 * other in the library: there are TWO ways to lose and they pull against each
 * other. So every houseguest gets two bars — FEET and STRING — and the shorter
 * one is the one that ended them, drawn in the colour of the mistake they made.
 * You can see at a glance that the strongest person in the yard went out
 * because they looked down.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;500;700&family=Alegreya:ital@1&display=swap');
.siglog{--lg-dusk:#12303a;--lg-dusk2:#08191f;--lg-water:#1d5566;--lg-bark:#7a5230;--lg-rope:#e8c07d;
  --lg-feet:#57c4e5;--lg-string:#ffb454;--lg-ink:#eaf6f8;--lg-dim:#8fb3bd;
  font-family:'Alegreya Sans',system-ui,sans-serif;color:var(--lg-ink);position:relative;overflow:clip}
.siglog .lg-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.siglog .lg-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(80% 40% at 50% 0%,rgba(255,180,84,0.14),transparent 60%),
    linear-gradient(180deg,var(--lg-dusk) 0%,var(--lg-dusk2) 46%,#0b2530 47%,#061319 100%)}
/* water line ripples */
.siglog .lg-bg::after{content:'';position:absolute;left:0;right:0;top:47%;height:53%;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,0.045) 0 1px,transparent 1px 9px);
  animation:lgRipple 6s ease-in-out infinite}
@keyframes lgRipple{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}

.siglog .lg-head{text-align:center;padding:14px 8px 6px}
.siglog .lg-eyebrow{font-size:10px;letter-spacing:4px;color:var(--lg-dim);text-transform:uppercase}
.siglog .lg-title{font-size:40px;font-weight:700;letter-spacing:3px;margin:5px 0 2px;color:var(--lg-ink);
  text-shadow:0 0 26px rgba(87,196,229,.3)}
.siglog .lg-sub{font-family:'Alegreya',Georgia,serif;font-style:italic;font-size:14px;color:#c6e2e9}

/* the log, drawn once at the top */
.siglog .lg-scene{display:flex;justify-content:center;margin:8px 0 14px}
.siglog .lg-scene svg{max-width:420px;width:86%}
.siglog .lg-weight{animation:lgSwing 3.2s ease-in-out infinite;transform-origin:96px 26px}
@keyframes lgSwing{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}

.siglog .lg-grid{display:grid;grid-template-columns:minmax(0,1fr) 244px;gap:16px;align-items:start}
@media(max-width:860px){.siglog .lg-grid{grid-template-columns:1fr}}

/* ── an exit ── */
.siglog .lg-card{margin-bottom:11px;padding:12px 14px;border-radius:8px;
  border:1px solid rgba(255,255,255,.08);border-left:4px solid var(--lg-feet);
  background:linear-gradient(160deg,rgba(18,48,58,.92),rgba(6,19,25,.94));
  box-shadow:0 10px 22px rgba(0,0,0,.4);animation:lgIn .34s ease both}
@keyframes lgIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
.siglog .lg-card.is-string{border-left-color:var(--lg-string)}
.siglog .lg-card.is-win{border-left-color:var(--lg-rope);background:linear-gradient(160deg,rgba(90,66,26,.7),rgba(6,19,25,.94))}
.siglog .lg-tag{font-size:9.5px;letter-spacing:2.2px;font-weight:700;color:var(--lg-feet);margin-bottom:6px}
.siglog .lg-card.is-string .lg-tag{color:var(--lg-string)}
.siglog .lg-card.is-win .lg-tag{color:var(--lg-rope)}
.siglog .lg-body{font-size:13px;line-height:1.6;color:#dbeef2}
.siglog .lg-locked{margin-bottom:11px;min-height:46px;border-radius:8px;border:1px dashed rgba(234,246,248,.14);
  display:grid;place-items:center;font-size:10px;letter-spacing:3px;color:rgba(234,246,248,.24)}

/* ── two clocks ── */
.siglog .lg-side{position:sticky;top:56px;padding:13px;border-radius:8px;
  border:1px solid rgba(87,196,229,.2);background:linear-gradient(180deg,rgba(12,38,47,.96),rgba(4,14,18,.96))}
.siglog .lg-side-h{font-size:10.5px;letter-spacing:2px;font-weight:700;color:var(--lg-feet);margin-bottom:2px}
.siglog .lg-side-s{font-size:11.5px;color:var(--lg-dim);margin-bottom:11px;line-height:1.45}
.siglog .lg-two{margin-bottom:9px}
.siglog .lg-two-n{display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px}
.siglog .lg-two-n em{font-style:normal;font-size:10px;color:var(--lg-dim)}
.siglog .lg-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden;margin-bottom:2px}
.siglog .lg-bar b{display:block;height:100%;border-radius:3px}
.siglog .lg-bar.is-feet b{background:linear-gradient(90deg,var(--lg-feet),#9fe8f7)}
.siglog .lg-bar.is-string b{background:linear-gradient(90deg,var(--lg-string),#ffd9a0)}
.siglog .lg-legend{display:flex;gap:10px;font-size:9.5px;color:var(--lg-dim);margin-bottom:10px}
.siglog .lg-legend i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px}
.siglog .lg-win{margin-top:11px;text-align:center;padding:11px;border-radius:8px;
  border:1px solid var(--lg-rope);background:rgba(232,192,125,.12)}
.siglog .lg-win-f{width:56px;height:56px;border-radius:50%;overflow:hidden;margin:0 auto 5px;border:2px solid var(--lg-rope)}
.siglog .lg-win-f img{width:100%;height:100%;object-fit:cover}
.siglog .lg-win b{display:block;font-size:15px;font-weight:700}
.siglog .lg-win i{font-style:normal;font-size:11.5px;color:var(--lg-dim)}
.siglog .lg-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.siglog .lg-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.siglog .lg-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px auto 2px;max-width:720px}
.siglog .lg-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.siglog .lg-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.siglog .lg-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.siglog .lg-w u{text-decoration:none;opacity:.75}
.siglog .lg-w.is-spread{opacity:.7;font-style:italic}
.siglog .lg-w.is-beh{opacity:.75;text-transform:none;letter-spacing:0;font-size:10px}
.siglog .lg-count{font-size:10px;letter-spacing:2px;color:var(--lg-dim)}
@media(prefers-reduced-motion:reduce){
  .siglog *,.siglog *::before,.siglog *::after{animation:none!important;transition:none!important}
}
</style>`;

const _SCENE = `<svg viewBox="0 0 200 70" aria-hidden="true">
  <ellipse cx="100" cy="60" rx="86" ry="7" fill="#0d3540" opacity=".7"/>
  <rect x="34" y="50" width="132" height="13" rx="6.5" fill="#7a5230" stroke="#5b3c22"/>
  <line x1="52" y1="50" x2="52" y2="63" stroke="#5b3c22"/><line x1="86" y1="50" x2="86" y2="63" stroke="#5b3c22"/>
  <line x1="120" y1="50" x2="120" y2="63" stroke="#5b3c22"/><line x1="150" y1="50" x2="150" y2="63" stroke="#5b3c22"/>
  <circle cx="96" cy="34" r="8" fill="#2b6c80" stroke="#9fe8f7"/>
  <rect x="92" y="42" width="8" height="9" rx="3" fill="#2b6c80"/>
  <g class="lg-weight">
    <line x1="96" y1="26" x2="140" y2="14" stroke="#e8c07d" stroke-width="1.4"/>
    <circle cx="142" cy="14" r="4.5" fill="#ffb454" stroke="#a8712a"/>
  </g>
</svg>`;

export function rpBuildSigLogRoll(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_log_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;
  const longest = Math.max(1, ...Object.values(breakdown).map(r => Math.max(r.feetClock || 0, r.stringClock || 0)));

  let cards = '';
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="lg-locked">STILL UP</div>`; return; }
    const isString = (b.badgeText || '') === 'STRING DOWN';
    const isWin = (b.badgeText || '') === 'WINS IT';
    cards += `<div class="lg-card ${isString ? 'is-string' : isWin ? 'is-win' : ''}">
      <div class="lg-tag">${esc(b.badgeText || '')}</div>
      <div class="lg-body">${b.text}</div>
    </div>`;
  });

  // The two clocks per houseguest — the whole reason this screen exists.
  const two = (comp.placements || []).slice(0, 8).map(name => {
    const row = breakdown[name] || {};
    const feet = Number(row.feetClock) || 0;
    const str = Number(row.stringClock) || 0;
    const ended = row.endedBy;
    return `<div class="lg-two">
      <div class="lg-two-n"><span>${esc(name)}</span>
        <em>${done ? `${(row.minutes || 0).toFixed(1)}m · ${ended === 'fell' ? 'fell' : 'string'}` : '—'}</em></div>
      <div class="lg-bar is-feet"><b style="width:${done ? Math.round((feet / longest) * 100) : 0}%"></b></div>
      <div class="lg-bar is-string"><b style="width:${done ? Math.round((str / longest) * 100) : 0}%"></b></div>
    </div>`;
  }).join('');

  return `<div class="rp-page siglog">${_STYLE}
    <div class="lg-bg"></div>
    <div class="lg-wrap">
      <div class="lg-head">
        <div class="lg-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : 'Head of Household')}</div>
        <div class="lg-title">LOG ROLL</div>
        <div class="lg-sub">Two ways to lose it, and they pull in opposite directions.</div>
        ${comp.desc ? `<div class="lg-rules">${esc(comp.desc)}</div>` : ''}
        ${(() => {
          // What the competition actually reads. `spreadStat` is drawn apart from
          // the weights on purpose: a stat that widens the SPREAD does not make a
          // houseguest better, it makes them less predictable, and putting it in
          // the same bar would say the opposite.
          const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
          if (!w.length) return '';
          const bars = w.map(([k, v]) => `<span class="lg-w"><i>${esc(k)}</i><span class="lg-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('');
          const spread = comp.spreadStat
            ? `<span class="lg-w is-spread" title="Widens the spread rather than raising the score"><i>± ${esc(comp.spreadStat)}</i><u>consistency</u></span>` : '';
          const beh = (comp.behaviour || []).map(b => `<span class="lg-w is-beh"><i>${esc(b.label)}</i><u>${Math.round(b.weight * 100)}%</u></span>`).join('');
          return `<div class="lg-weights">${bars}${spread}${beh}</div>`;
        })()}
      </div>
      <div class="lg-scene">${_SCENE}</div>
      <div class="lg-grid">
        <div>${cards}</div>
        <aside class="lg-side">
          <div class="lg-side-h">TWO CLOCKS</div>
          <div class="lg-side-s">The shorter bar is the one that ended them.</div>
          <div class="lg-legend">
            <span><i style="background:var(--lg-feet)"></i>feet</span>
            <span><i style="background:var(--lg-string)"></i>string</span>
          </div>
          ${two}
          ${done && winner ? `<div class="lg-win">
            <div class="lg-win-f">${avatar(winner, 56)}</div>
            <b>${esc(winner)}</b><i>${(breakdown[winner]?.minutes || 0).toFixed(1)} minutes, both clocks alive</i></div>` : ''}
        </aside>
      </div>
      <div class="lg-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Next one in</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">To the last log</button>`}
        <span class="lg-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
