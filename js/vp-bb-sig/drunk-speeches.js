/**
 * Drunk Speeches — "THE TAPE"
 *
 * A reel-to-reel deck in a warm room. Two reels turn, a VU needle swings, a
 * mechanical counter clicks over, and the tape is running at two-thirds speed
 * because that is the entire competition.
 *
 * The question this comp asks is WHEN, not who, so the furniture is built
 * around time: a calendar strip of the season's days runs under every playback,
 * and the guess and the truth are marked on it. Getting a week out is a visible
 * distance on that strip rather than a sentence saying so.
 *
 * The stretched waveform is drawn from the beat index, so every playback looks
 * like a different recording and none of them look like a stock graphic.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Oswald:wght@300;500;600&display=swap');
.sigdrunk{--dk-wood:#3a2418;--dk-wood2:#241209;--dk-amber:#ffb648;--dk-amber2:#ff8a2b;
  --dk-steel:#b9c0c8;--dk-ink:#f3e7d4;--dk-dim:#a08b70;
  font-family:'Oswald',system-ui,sans-serif;color:var(--dk-ink);position:relative;overflow:clip}
.sigdrunk .dk-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2}
.sigdrunk .dk-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(70% 46% at 50% 2%,rgba(255,182,72,0.16),transparent 62%),
    repeating-linear-gradient(90deg,rgba(0,0,0,0.16) 0 5px,transparent 5px 13px),
    linear-gradient(180deg,var(--dk-wood),var(--dk-wood2) 68%,#140903)}

.sigdrunk .dk-head{text-align:center;padding:14px 8px 4px}
.sigdrunk .dk-eyebrow{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;color:var(--dk-amber)}
.sigdrunk .dk-title{font-size:40px;font-weight:600;letter-spacing:7px;margin:4px 0 2px;color:var(--dk-ink);
  text-shadow:0 0 24px rgba(255,182,72,.3)}
.sigdrunk .dk-sub{font-weight:300;font-size:13.5px;color:#e2ceb0}

/* ── the deck ── */
.sigdrunk .dk-deck{margin:12px auto 16px;max-width:520px;padding:14px 16px 12px;border-radius:8px;
  background:linear-gradient(170deg,#4a3122,#2a170d);border:1px solid rgba(255,182,72,.22);
  box-shadow:0 18px 40px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)}
.sigdrunk .dk-reels{display:flex;align-items:center;justify-content:space-between;gap:14px}
.sigdrunk .dk-reel{width:96px;height:96px;position:relative}
.sigdrunk .dk-reel svg{width:100%;height:100%;animation:dkSpin 3.6s linear infinite}
.sigdrunk .dk-reel.is-slow svg{animation-duration:5.4s}
@keyframes dkSpin{to{transform:rotate(360deg)}}
.sigdrunk .dk-mid{flex:1;text-align:center}
.sigdrunk .dk-counter{display:inline-flex;gap:2px;padding:4px 7px;border-radius:3px;background:#120a05;
  border:1px solid rgba(255,182,72,.3)}
.sigdrunk .dk-counter i{font-family:'Share Tech Mono',monospace;font-style:normal;font-size:17px;color:var(--dk-amber);
  background:#1d1108;padding:1px 4px;border-radius:2px}
.sigdrunk .dk-speed{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dk-dim);
  margin-top:6px}
.sigdrunk .dk-vu{margin-top:8px;height:26px;border-radius:3px;background:#160c06;border:1px solid rgba(255,182,72,.25);
  position:relative;overflow:hidden}
.sigdrunk .dk-vu i{position:absolute;bottom:0;width:3px;border-radius:1px;background:linear-gradient(180deg,var(--dk-amber),var(--dk-amber2));
  animation:dkVu 1.4s ease-in-out infinite}
@keyframes dkVu{0%,100%{opacity:.45;transform:scaleY(.5)}50%{opacity:1;transform:scaleY(1)}}

/* ── playbacks ── */
.sigdrunk .dk-grid{display:grid;grid-template-columns:minmax(0,1fr) 236px;gap:16px;align-items:start}
@media(max-width:860px){.sigdrunk .dk-grid{grid-template-columns:1fr}}
.sigdrunk .dk-play{margin-bottom:13px;padding:13px 15px;border-radius:6px;
  border:1px solid rgba(255,182,72,.2);border-left:3px solid var(--dk-amber);
  background:linear-gradient(160deg,rgba(58,36,24,.92),rgba(20,10,5,.94));
  box-shadow:0 10px 24px rgba(0,0,0,.42);animation:dkIn .38s ease both}
@keyframes dkIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.sigdrunk .dk-tag{font-family:'Share Tech Mono',monospace;font-size:9.5px;letter-spacing:2px;color:var(--dk-amber);
  margin-bottom:7px}
.sigdrunk .dk-wave{height:34px;margin-bottom:9px;display:flex;align-items:center;gap:2px}
.sigdrunk .dk-wave i{flex:1;border-radius:1px;background:linear-gradient(180deg,rgba(255,182,72,.75),rgba(255,138,43,.35))}
.sigdrunk .dk-speech{font-family:'Share Tech Mono',monospace;font-size:13.5px;line-height:1.65;letter-spacing:1.2px;
  color:#ffe9c9;padding:9px 11px;border-radius:4px;background:rgba(0,0,0,.3)}
.sigdrunk .dk-said{font-weight:300;font-size:12.5px;color:#d9c3a4;margin-top:9px;line-height:1.55}
/* the day strip */
.sigdrunk .dk-days{display:flex;gap:4px;margin-top:11px;flex-wrap:wrap}
.sigdrunk .dk-day{min-width:30px;text-align:center;padding:3px 5px;border-radius:3px;font-family:'Share Tech Mono',monospace;
  font-size:10.5px;color:var(--dk-dim);border:1px solid rgba(255,255,255,.09)}
.sigdrunk .dk-day.is-truth{color:#0f0a04;background:var(--dk-amber);border-color:var(--dk-amber);font-weight:700}
.sigdrunk .dk-day.is-guess{color:#ffd7d3;border-color:#e0554f;box-shadow:0 0 0 1px rgba(224,85,79,.4) inset}
.sigdrunk .dk-locked{margin-bottom:13px;min-height:58px;border-radius:6px;border:1px dashed rgba(243,231,212,.16);
  display:grid;place-items:center;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;
  color:rgba(243,231,212,.3)}

.sigdrunk .dk-side{position:sticky;top:56px;padding:13px;border-radius:6px;
  border:1px solid rgba(255,182,72,.22);background:linear-gradient(180deg,rgba(36,20,11,.96),rgba(16,8,3,.96))}
.sigdrunk .dk-side-h{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dk-amber);
  margin-bottom:2px}
.sigdrunk .dk-side-s{font-weight:300;font-size:11.5px;color:var(--dk-dim);margin-bottom:10px;line-height:1.45}
.sigdrunk .dk-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:6px}
.sigdrunk .dk-srow i{width:14px;font-style:normal;font-size:10px;color:var(--dk-dim)}
.sigdrunk .dk-srow b{margin-left:auto;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dk-amber)}
.sigdrunk .dk-win{margin-top:11px;text-align:center;padding:11px;border-radius:6px;
  border:1px solid var(--dk-amber);background:rgba(255,182,72,.12)}
.sigdrunk .dk-win-f{width:56px;height:56px;border-radius:50%;overflow:hidden;margin:0 auto 5px;border:2px solid var(--dk-amber)}
.sigdrunk .dk-win-f img{width:100%;height:100%;object-fit:cover}
.sigdrunk .dk-win b{display:block;font-size:15px;letter-spacing:1px;color:var(--dk-ink)}
.sigdrunk .dk-win i{font-style:normal;font-weight:300;font-size:11.5px;color:var(--dk-dim)}
.sigdrunk .dk-ctl{display:flex;gap:8px;justify-content:center;align-items:center;padding:12px 0 4px}
.sigdrunk .dk-count{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dk-dim)}
@media(prefers-reduced-motion:reduce){
  .sigdrunk *,.sigdrunk *::before,.sigdrunk *::after{animation:none!important;transition:none!important}
}
</style>`;

const _REEL = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="46" fill="#1b1009" stroke="#6b7681" stroke-width="2"/>
  <circle cx="50" cy="50" r="34" fill="#2a1a0f" stroke="#4a3526"/>
  <circle cx="50" cy="50" r="10" fill="#b9c0c8"/>
  <circle cx="50" cy="50" r="4" fill="#2a1a0f"/>
  ${[0, 120, 240].map(a => `<path d="M50 50 L${50 + 30 * Math.cos(a * Math.PI / 180)} ${50 + 30 * Math.sin(a * Math.PI / 180)}"
    stroke="#b9c0c8" stroke-width="7" stroke-linecap="round" opacity=".8"/>`).join('')}
</svg>`;

export function rpBuildSigDrunkSpeeches(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_drunk_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const rounds = comp.detail?.rounds || [];
  const winner = act.winner || comp.winner || null;
  const asked = Math.max(1, rounds.length);
  const allDays = [...new Set(rounds.flatMap(r => r.options || []))].sort((a, b) => a - b);

  // A different waveform per playback, from the index rather than from a die.
  const wave = seed => Array.from({ length: 46 }, (_, i) => {
    const h = 6 + Math.abs(Math.sin((i + seed * 7) * 0.7) * 26);
    return `<i style="height:${h.toFixed(1)}px"></i>`;
  }).join('');

  let cards = '';
  let qi = 0;
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="dk-locked">TAPE NOT CUED</div>`; return; }
    // Matched on the recording, not on a counter — see who-said-it.js.
    const speech = (b.text.match(/"([^"]+)"/) || [])[1];
    const round = speech ? rounds.find(r => b.text.includes(r.speech)) : null;
    if (!speech || !round) {
      cards += `<div class="dk-play"><div class="dk-tag">${esc(b.badgeText || 'PLAYBACK')}</div>
        <div class="dk-said">${b.text}</div></div>`;
      return;
    }
    qi++;
    const rest = b.text.replace(`"${speech}"`, '').trim();
    const truth = round.options[round.truthIndex];
    const guess = (rest.match(/day (\d+)/i) || [])[1];
    const strip = allDays.map(d => `<span class="dk-day ${
      String(d) === String(truth) ? 'is-truth' : ''} ${
      guess && String(d) === String(guess) && String(d) !== String(truth) ? 'is-guess' : ''}">D${d}</span>`).join('');
    cards += `<div class="dk-play">
      <div class="dk-tag">PLAYBACK ${qi} / ${asked} · 0.66× · ${esc(round.kind || 'speech').toUpperCase()}</div>
      <div class="dk-wave">${wave(qi)}</div>
      <div class="dk-speech">${esc(speech)}</div>
      <div class="dk-said">${rest}</div>
      <div class="dk-days">${strip}</div>
    </div>`;
  });

  const rows = (comp.placements || []).slice(0, 7).map((n, i) => {
    const row = breakdown[n] || {};
    return `<div class="dk-srow"><i>${i + 1}</i><span>${esc(n)}</span>
      <b>${done ? `${row.correct || 0}/${asked}` : '—'}</b></div>`;
  }).join('');

  const vu = Array.from({ length: 26 }, (_, i) =>
    `<i style="left:${4 + i * 3.6}%;height:${30 + (i % 5) * 12}%;animation-delay:${(i * 0.06).toFixed(2)}s"></i>`).join('');

  return `<div class="rp-page sigdrunk">${_STYLE}
    <div class="dk-bg"></div>
    <div class="dk-wrap">
      <div class="dk-head">
        <div class="dk-eyebrow">${esc(actType === 'veto' ? 'POWER OF VETO' : 'HEAD OF HOUSEHOLD')}</div>
        <div class="dk-title">DRUNK SPEECHES</div>
        <div class="dk-sub">Slowed until nobody sounds like themselves. Name the day.</div>
      </div>
      <div class="dk-deck">
        <div class="dk-reels">
          <div class="dk-reel">${_REEL}</div>
          <div class="dk-mid">
            <div class="dk-counter"><i>0</i><i>${Math.min(9, Math.max(0, state.idx + 1))}</i><i>${(state.idx + 1) % 10}</i></div>
            <div class="dk-speed">PLAYBACK 0.66× · REEL B</div>
            <div class="dk-vu">${vu}</div>
          </div>
          <div class="dk-reel is-slow">${_REEL}</div>
        </div>
      </div>
      <div class="dk-grid">
        <div>${cards}</div>
        <aside class="dk-side">
          <div class="dk-side-h">THE LOG</div>
          <div class="dk-side-s">Days correctly identified, once the tape runs out.</div>
          ${rows}
          ${done && winner ? `<div class="dk-win">
            <div class="dk-win-f">${avatar(winner, 56)}</div>
            <b>${esc(winner)}</b><i>knew the week</i></div>` : ''}
        </aside>
      </div>
      <div class="dk-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Play the next one</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Run the tape</button>`}
        <span class="dk-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
