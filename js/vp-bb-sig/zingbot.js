/**
 * Zingbot Competition — "THE ROAST"
 *
 * A late-night comedy club that has been built in a back yard. Brick, a
 * spotlight cone, a mic stand nobody is using, and a chrome robot at the podium
 * working the room.
 *
 * The screen is organised around the thing that makes this competition
 * different from every other one in the library: the zings have CONSEQUENCES.
 * So the sidebar is not a leaderboard, it is THE ROOM — every houseguest with a
 * composure bar, and the bar drops when their zing lands. The viewer watches
 * the house get taken apart one joke at a time, and only then does the quiz
 * half start scoring.
 *
 * Nothing here is shared with another screen. The bulb marquee, the speech
 * bubble with its tail, the ZING starburst and the composure rail exist in this
 * file only.
 */

const _AMBIENT = [
  'Somewhere off camera a laugh track that nobody asked for starts up.',
  'The spotlight finds the wrong person for a second, which gets its own laugh.',
  'One of the bulbs on the marquee has gone and nobody has been sent to fix it.',
  'The robot pauses for timing. It has been programmed for timing and it is using all of it.',
  'A houseguest at the back has stopped laughing and is doing arithmetic instead.',
];

/** The robot, drawn rather than emoji'd. */
const _BOT = `<svg class="zgb-bot-svg" viewBox="0 0 120 140" width="112" height="130" aria-hidden="true">
  <defs>
    <linearGradient id="zgbChrome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2f5f8"/><stop offset="0.45" stop-color="#aeb8c4"/>
      <stop offset="0.55" stop-color="#7d8894"/><stop offset="1" stop-color="#cdd6df"/>
    </linearGradient>
    <radialGradient id="zgbEye"><stop offset="0" stop-color="#fff"/><stop offset="0.4" stop-color="#ff4d4d"/>
      <stop offset="1" stop-color="#7a0d0d"/></radialGradient>
  </defs>
  <line x1="60" y1="16" x2="60" y2="30" stroke="#8c98a6" stroke-width="3"/>
  <circle class="zgb-antenna" cx="60" cy="12" r="6" fill="#ffd24a"/>
  <rect x="26" y="30" width="68" height="52" rx="12" fill="url(#zgbChrome)" stroke="#5c6673" stroke-width="2"/>
  <rect x="36" y="44" width="48" height="22" rx="6" fill="#0b0e12" stroke="#39424e"/>
  <circle class="zgb-eye" cx="49" cy="55" r="6" fill="url(#zgbEye)"/>
  <circle class="zgb-eye zgb-eye-b" cx="71" cy="55" r="6" fill="url(#zgbEye)"/>
  <rect x="44" y="72" width="32" height="4" rx="2" fill="#39424e"/>
  <rect x="6" y="46" width="16" height="30" rx="7" fill="url(#zgbChrome)" stroke="#5c6673"/>
  <rect x="98" y="46" width="16" height="30" rx="7" fill="url(#zgbChrome)" stroke="#5c6673"/>
  <rect x="30" y="84" width="60" height="34" rx="8" fill="url(#zgbChrome)" stroke="#5c6673" stroke-width="2"/>
  <circle cx="60" cy="100" r="8" fill="#0b0e12" stroke="#ffd24a" stroke-width="2"/>
  <circle class="zgb-core" cx="60" cy="100" r="3.4" fill="#ffd24a"/>
  <rect x="22" y="120" width="76" height="8" rx="4" fill="#5c6673"/>
</svg>`;

/** The mic the robot is not using, because it does not need one. */
const _MIC = `<svg viewBox="0 0 40 120" width="30" height="90" aria-hidden="true">
  <rect x="17" y="112" width="6" height="6" fill="#2b2f36"/>
  <ellipse cx="20" cy="118" rx="14" ry="3.5" fill="#22262c"/>
  <line x1="20" y1="34" x2="20" y2="112" stroke="#3b424b" stroke-width="3"/>
  <rect x="12" y="8" width="16" height="26" rx="8" fill="#8a939e" stroke="#5c6673"/>
  <line x1="14" y1="14" x2="26" y2="14" stroke="#5c6673"/><line x1="14" y1="20" x2="26" y2="20" stroke="#5c6673"/>
  <line x1="14" y1="26" x2="26" y2="26" stroke="#5c6673"/>
</svg>`;

/** The comic burst behind a zing that landed. */
const _BURST = `<svg class="zgb-burst" viewBox="0 0 120 120" aria-hidden="true">
  <polygon points="60,2 71,34 104,22 84,52 118,60 84,68 104,98 71,86 60,118 49,86 16,98 36,68 2,60 36,52 16,22 49,34"
    fill="#ffd24a" stroke="#b8121a" stroke-width="3"/>
</svg>`;

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Bungee&family=Barlow+Condensed:wght@400;600;700&display=swap');
.sigzing{--zg-brick:#2b1a17;--zg-brick2:#1a0f0d;--zg-gold:#ffd24a;--zg-red:#e0332f;--zg-cream:#f6e7c8;
  --zg-dim:#a08f7a;font-family:'Barlow Condensed',system-ui,sans-serif;color:var(--zg-cream);
  position:relative;overflow:clip}
.sigzing .zgb-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigzing .zgb-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(120% 60% at 50% -6%,rgba(255,210,74,0.22),transparent 60%),
    repeating-linear-gradient(0deg,rgba(0,0,0,0.34) 0 26px,transparent 26px 28px),
    repeating-linear-gradient(90deg,rgba(255,255,255,0.03) 0 62px,transparent 62px 64px),
    linear-gradient(180deg,var(--zg-brick) 0%,var(--zg-brick2) 70%,#0d0807 100%)}
/* the spotlight cone the robot stands in */
.sigzing .zgb-bg::after{content:'';position:absolute;left:50%;top:0;width:78%;height:62%;
  transform:translateX(-50%);pointer-events:none;
  background:linear-gradient(180deg,rgba(255,232,170,0.20),rgba(255,232,170,0.03) 60%,transparent 78%);
  clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);animation:zgbFlick 5.5s ease-in-out infinite}
@keyframes zgbFlick{0%,100%{opacity:.85}47%{opacity:1}52%{opacity:.72}}

/* ── marquee ── */
.sigzing .zgb-marquee{display:flex;justify-content:center;gap:9px;padding:10px 0 2px}
.sigzing .zgb-bulb{width:9px;height:9px;border-radius:50%;background:var(--zg-gold);
  box-shadow:0 0 10px rgba(255,210,74,.9);animation:zgbBulb 1.5s ease-in-out infinite}
.sigzing .zgb-bulb:nth-child(2n){animation-delay:.25s}
.sigzing .zgb-bulb:nth-child(3n){animation-delay:.5s}
.sigzing .zgb-bulb.is-dead{background:#4a3c24;box-shadow:none;animation:none}
@keyframes zgbBulb{0%,100%{opacity:1}50%{opacity:.35}}

/* ── header ── */
.sigzing .zgb-head{text-align:center;padding:2px 8px 8px}
.sigzing .zgb-eyebrow{font-size:10px;letter-spacing:4px;color:var(--zg-dim);text-transform:uppercase}
.sigzing .zgb-title{font-family:'Bungee',cursive;font-size:46px;line-height:1;letter-spacing:2px;margin:4px 0;
  color:var(--zg-gold);text-shadow:0 4px 0 #7a1410,0 0 30px rgba(255,210,74,.35)}
.sigzing .zgb-sub{font-size:13px;font-style:italic;color:#d9c4a0}
.sigzing .zgb-stage{display:flex;align-items:flex-end;justify-content:center;gap:22px;margin:4px 0 10px}
.sigzing .zgb-plinth{width:150px;height:14px;border-radius:50%/60%;background:rgba(255,210,74,.15);
  filter:blur(2px);margin-top:-8px}
@keyframes zgbEye{0%,100%{opacity:1}50%{opacity:.45}}
.sigzing .zgb-eye{animation:zgbEye 2.4s ease-in-out infinite}
.sigzing .zgb-eye-b{animation-delay:.3s}
@keyframes zgbAnt{0%,100%{opacity:.4}50%{opacity:1}}
.sigzing .zgb-antenna{animation:zgbAnt 1.6s ease-in-out infinite}
@keyframes zgbCore{0%,100%{r:3.4;opacity:.8}50%{r:4.6;opacity:1}}
.sigzing .zgb-core{animation:zgbCore 2.8s ease-in-out infinite}

/* ── layout ── */
.sigzing .zgb-grid{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:16px;align-items:start;padding-bottom:6px}
@media(max-width:820px){.sigzing .zgb-grid{grid-template-columns:1fr}}

/* ── the speech bubble a zing arrives in ── */
.sigzing .zgb-zing{position:relative;margin:0 0 16px 34px;padding:14px 16px 13px;border-radius:14px;
  background:linear-gradient(165deg,#fffaf0,#f0dcb6);color:#241a10;border:3px solid #1a1210;
  box-shadow:6px 7px 0 rgba(0,0,0,.55);animation:zgbPop .34s cubic-bezier(.2,1.4,.4,1) both}
@keyframes zgbPop{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:none}}
.sigzing .zgb-zing::before{content:'';position:absolute;left:-16px;top:26px;width:0;height:0;
  border:12px solid transparent;border-right-color:#1a1210}
.sigzing .zgb-zing::after{content:'';position:absolute;left:-10px;top:28px;width:0;height:0;
  border:9px solid transparent;border-right-color:#fffaf0}
.sigzing .zgb-zing.is-landed{background:linear-gradient(165deg,#ffe9e6,#f6c9c2)}
.sigzing .zgb-zing.is-landed::after{border-right-color:#ffe9e6}
.sigzing .zgb-who{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.sigzing .zgb-who b{font-family:'Bungee',cursive;font-size:15px;letter-spacing:.5px;color:#1a1210}
.sigzing .zgb-body{font-size:14px;line-height:1.55;font-weight:600}
.sigzing .zgb-react{margin-top:9px;padding-top:8px;border-top:2px dashed rgba(26,18,16,.25);
  font-size:12.5px;line-height:1.5;color:#4a382a;font-style:italic}
.sigzing .zgb-burst{position:absolute;right:-16px;top:-18px;width:64px;height:64px;
  animation:zgbSpin 9s linear infinite}
@keyframes zgbSpin{to{transform:rotate(360deg)}}
.sigzing .zgb-burst-l{position:absolute;right:-16px;top:-18px;width:64px;height:64px;display:grid;
  place-items:center;font-family:'Bungee',cursive;font-size:13px;color:#b8121a;transform:rotate(-12deg)}

/* ── the quiz half ── */
.sigzing .zgb-quiz{margin:0 0 12px;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,210,74,.28);
  background:linear-gradient(160deg,rgba(43,26,23,.92),rgba(13,8,7,.92));animation:zgbPop .3s ease both}
.sigzing .zgb-quiz-l{font-family:'Bungee',cursive;font-size:10px;letter-spacing:2px;color:var(--zg-gold);margin-bottom:6px}
.sigzing .zgb-quiz-b{font-size:13px;line-height:1.6;color:var(--zg-cream)}
.sigzing .zgb-redacted{font-size:13px;line-height:1.7;color:#f7e6c4;padding:10px 12px;border-radius:6px;
  background:rgba(0,0,0,.35);border:1px dashed rgba(255,210,74,.28);margin-bottom:9px}
.sigzing .zgb-redact{display:inline-block;border-radius:2px;background:#0a0705;color:#0a0705;
  box-shadow:0 0 0 1px rgba(255,210,74,.3) inset;padding:0 2px;letter-spacing:-1px;user-select:none}
.sigzing .zgb-field{margin-top:10px;padding:8px 10px;border-radius:6px;background:rgba(0,0,0,.28);
  border:1px dashed rgba(255,210,74,.24)}
.sigzing .zgb-field-h{font-size:10.5px;color:#b9a68c;margin-bottom:6px}
.sigzing .zgb-field-h b{color:var(--zg-gold)}
.sigzing .zgb-chips{display:flex;flex-wrap:wrap;gap:5px}
.sigzing .zgb-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:11px;
  font-size:10.5px;background:rgba(255,255,255,.05);border:1px solid rgba(255,210,74,.2);color:#f0e0bf}
.sigzing .zgb-chip i{width:6px;height:6px;border-radius:50%;flex:0 0 auto;background:#7bd88f}
.sigzing .zgb-chip.is-no i{background:var(--zg-red)}
.sigzing .zgb-chip.is-no{background:rgba(224,51,47,.1);border-color:rgba(224,51,47,.35)}
.sigzing .zgb-chip em{font-style:normal;font-size:9.5px;color:#b9a68c}
.sigzing .zgb-opts{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px}
.sigzing .zgb-opt{font-family:'Bungee',cursive;font-size:10px;letter-spacing:.6px;padding:4px 9px;border-radius:3px;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,210,74,.22);color:#e8d5ae}
.sigzing .zgb-opt.is-truth{background:var(--zg-gold);color:#231703;border-color:var(--zg-gold)}
.sigzing .zgb-locked{margin:0 0 14px 34px;min-height:54px;border-radius:14px;border:3px dashed rgba(246,231,200,.16);
  display:grid;place-items:center;color:rgba(246,231,200,.3);font-family:'Bungee',cursive;font-size:11px;letter-spacing:3px}
.sigzing .zgb-amb{margin:0 0 12px 34px;font-size:12px;color:#b9a68c;font-style:italic}

/* ── the room ── */
.sigzing .zgb-side{position:sticky;top:56px;border-radius:12px;padding:12px;
  border:1px solid rgba(255,210,74,.22);background:linear-gradient(180deg,rgba(26,15,13,.96),rgba(9,6,5,.96))}
.sigzing .zgb-side-h{font-family:'Bungee',cursive;font-size:11px;letter-spacing:2px;color:var(--zg-gold);
  margin-bottom:3px}
.sigzing .zgb-side-s{font-size:11px;color:var(--zg-dim);margin-bottom:10px;line-height:1.4}
.sigzing .zgb-row{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.sigzing .zgb-row-n{flex:1;min-width:0;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.sigzing .zgb-meter{width:62px;height:7px;border-radius:4px;background:rgba(255,255,255,.09);overflow:hidden}
.sigzing .zgb-meter b{display:block;height:100%;border-radius:4px;
  background:linear-gradient(90deg,#7bd88f,#ffd24a);transition:width .5s ease}
.sigzing .zgb-meter.is-hit b{background:linear-gradient(90deg,#e0332f,#ff8a5c)}
.sigzing .zgb-face{width:26px;height:26px;border-radius:50%;overflow:hidden;flex:0 0 auto;
  border:1px solid rgba(255,210,74,.35);display:grid;place-items:center}
.sigzing .zgb-face img{width:100%;height:100%;object-fit:cover}
.sigzing .zgb-score{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,210,74,.18)}
.sigzing .zgb-srow{display:flex;align-items:center;gap:7px;font-size:11.5px;margin-bottom:4px}
.sigzing .zgb-srow i{width:15px;font-style:normal;color:var(--zg-dim);font-size:10px}
.sigzing .zgb-srow b{margin-left:auto;color:var(--zg-gold);font-family:'Bungee',cursive;font-size:11px}
.sigzing .zgb-win{margin-top:12px;padding:12px;border-radius:12px;text-align:center;
  border:2px solid var(--zg-gold);background:rgba(255,210,74,.12)}
.sigzing .zgb-win-f{width:64px;height:64px;border-radius:50%;overflow:hidden;margin:0 auto 6px;
  border:2px solid var(--zg-gold)}
.sigzing .zgb-win-f img{width:100%;height:100%;object-fit:cover}
.sigzing .zgb-win b{display:block;font-family:'Bungee',cursive;font-size:16px;color:var(--zg-gold)}
.sigzing .zgb-win span{font-size:11.5px;color:#e6d5b6}
.sigzing .zgb-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.sigzing .zgb-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.sigzing .zgb-count{font-family:'Bungee',cursive;font-size:11px;letter-spacing:2px;color:var(--zg-dim)}
@media(prefers-reduced-motion:reduce){
  .sigzing *,.sigzing *::before,.sigzing *::after{animation:none!important;transition:none!important}
}
</style>`;

export function rpBuildSigZingbot(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_zing_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const detail = comp.detail || {};
  const zings = detail.zings || [];
  const winner = act.winner || comp.winner || null;
  const roster = (act.participants && act.participants.length
    ? act.participants
    : (comp.placements || [])).filter(Boolean);

  // ── the room's composure, revealed only as far as the viewer has watched ──
  const seenZings = new Set();
  beats.slice(0, state.idx + 1).forEach(b => {
    const z = zings.find(x => b.text.includes(x.text));
    if (z) seenZings.add(z.target);
  });

  const roomRows = zings.map(z => {
    const shown = seenZings.has(z.target);
    const pct = !shown ? 100 : z.tookItWell ? 84 : 38;
    return `<div class="zgb-row">
      <span class="zgb-face">${avatar(z.target, 26)}</span>
      <span class="zgb-row-n">${esc(z.target)}</span>
      <span class="zgb-meter ${shown && !z.tookItWell ? 'is-hit' : ''}"><b style="width:${pct}%"></b></span>
    </div>`;
  }).join('');

  // ── cards ──
  let cards = '';
  beats.forEach((b, i) => {
    if (i > state.idx) {
      cards += `<div class="zgb-locked">• • •</div>`;
      return;
    }
    const zing = zings.find(z => b.text.includes(z.text));
    if (zing) {
      const reaction = b.text.replace(zing.text, '').trim();
      cards += `<div class="zgb-zing ${zing.tookItWell ? '' : 'is-landed'}">
        ${zing.tookItWell ? '' : `${_BURST}<span class="zgb-burst-l">ZING</span>`}
        <div class="zgb-who"><span class="zgb-face">${avatar(zing.target, 26)}</span><b>${esc(zing.target)}</b></div>
        <div class="zgb-body">${zing.text}</div>
        ${reaction ? `<div class="zgb-react">${reaction}</div>` : ''}
      </div>`;
    } else {
      // The quiz half is the roast played back with the name cut out, so the
      // card shows exactly that: the zing REDACTED, the three names on the
      // board, and only then what the houseguest wrote. Rendering it as a
      // paragraph threw away the one visual the format hands you for free.
      const qn = Number(String(b.badgeText || '').match(/ZING (\d+)/)?.[1] || 0);
      const round = (detail.rounds || [])[qn - 1];
      // The blank has to READ as a blank.
      //
      // An empty span left the sentence starting with nothing — `" and Caleb.
      // Nothing says..."` — because every zing opens on the target's name.
      // A filled bar keeps the shape of the sentence and survives being copied
      // out of the page as text.
      const redacted = round
        ? round.zing.split(round.target).join('<span class="zgb-redact">█████</span>')
        : null;
      cards += `<div class="zgb-quiz">
        <div class="zgb-quiz-l">${esc(b.badgeText || 'THE ROAST')}</div>
        ${redacted ? `<div class="zgb-redacted">${redacted}</div>
          <div class="zgb-opts">${round.options.map(o => `<span class="zgb-opt ${
    o === round.target ? 'is-truth' : ''}">${esc(o)}</span>`).join('')}</div>` : ''}
        <div class="zgb-quiz-b">${b.text}</div>
        ${round?.answers ? `<div class="zgb-field">
          <div class="zgb-field-h"><b>${round.correct}</b> of <b>${round.field}</b> matched it · a point each</div>
          <div class="zgb-chips">${Object.entries(round.answers).map(([who, a]) => `
            <span class="zgb-chip ${a.right ? 'is-ok' : 'is-no'}"><i></i>${esc(who)}<em>${esc(round.options[a.given] || '—')}</em></span>`).join('')}</div>
        </div>` : ''}
      </div>`;
      if (i % 3 === 2 && i < beats.length - 1) {
        cards += `<div class="zgb-amb">${esc(_AMBIENT[i % _AMBIENT.length])}</div>`;
      }
    }
  });

  // Counted from the questions the viewer has actually watched, so the panel is
  // useful during the competition instead of only after it.
  const seenQs = [];
  beats.slice(0, state.idx + 1).forEach(b => {
    const qn = Number(String(b.badgeText || '').match(/ZING (\d+)/)?.[1] || 0);
    const round = (detail.rounds || [])[qn - 1];
    if (round) seenQs.push(round);
  });
  const running = {};
  (act.participants || comp.placements || []).forEach(n => { running[n] = 0; });
  seenQs.forEach(q => Object.entries(q.answers || {}).forEach(([n, a]) => {
    if (a.right) running[n] = (running[n] || 0) + 1;
  }));
  const scoreRows = Object.keys(running)
    .sort((a, b) => running[b] - running[a]).slice(0, 8)
    .map((n, i) => `<div class="zgb-srow"><i>${i + 1}</i><span>${esc(n)}${
  breakdown[n]?.wonTiebreak ? ' ⧗' : ''}</span>
      <b>${seenQs.length ? `${running[n] || 0}/${seenQs.length}` : '—'}</b></div>`).join('');

  const bulbs = Array.from({ length: 19 }, (_, i) =>
    `<span class="zgb-bulb${i === 12 ? ' is-dead' : ''}"></span>`).join('');

  return `<div class="rp-page sigzing">${_STYLE}
    <div class="zgb-bg"></div>
    <div class="zgb-wrap">
      <div class="zgb-marquee">${bulbs}</div>
      <div class="zgb-head">
        <div class="zgb-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : 'Head of Household')} · the roast</div>
        <div class="zgb-title">ZINGBOT</div>
        <div class="zgb-sub">It has come a very long way to be rude to everybody.</div>
        ${comp.desc ? `<div class="zgb-rules">${esc(comp.desc)}</div>` : ''}
      </div>
      <div class="zgb-stage">${_MIC}<div>${_BOT}<div class="zgb-plinth"></div></div></div>
      <div class="zgb-grid">
        <div>${cards}</div>
        <aside class="zgb-side">
          <div class="zgb-side-h">THE ROOM</div>
          <div class="zgb-side-s">Composure, and what a joke did to it.</div>
          ${roomRows || '<div class="zgb-side-s">Nobody has been zinged yet.</div>'}
          ${seenQs.length ? `<div class="zgb-score"><div class="zgb-side-h" style="margin-bottom:6px">ZINGS MATCHED</div>${scoreRows}</div>` : ''}
          ${done && winner ? `<div class="zgb-win">
            <div class="zgb-win-f">${avatar(winner, 64)}</div>
            <b>${esc(winner)}</b><span>knew whose was whose</span></div>` : ''}
        </aside>
      </div>
      <div class="zgb-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Next zing</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Whole set</button>`}
        <span class="zgb-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
