// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/ready-set-woah.js — "The Line"
//
// The themed screen for js/bb-comps/classics.js → Ready, Set, Woah
// (`variant: 'readyset'`).
//
// Seven calls, and the last word is either the one you want or the one that
// sends you back to the start. So the instrument is the CALL SHEET: seven
// cells read left to right, each stamped GO or WOAH, and under each one what
// that call did to this houseguest. A false start is the only cell drawn in
// red, and everything left of it is greyed — because ground made before a
// false start stopped existing the moment they moved.
//
// The track underneath shows how far down the course they actually finished.
// Declines when the call data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigReadySetWoah(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withCalls = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.calls) && v.calls.length);
  if (!withCalls.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PHYSICAL', accent: '#5ce1e6' };
  const PALETTE = '#63e6e0';                       // starter's lamp, cold track
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_rsw_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 59 + salt * 41 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The two calls are identical until the last syllable. That is the entire competition.',
    'Being fast is worth nothing here. Being late is worth everything.',
    'Ground made before a false start does not exist afterwards.',
    'Nobody is allowed to watch anybody else. Everybody does anyway.',
    'The voice does not vary its tone. It has been told not to.',
  ];
  const WIN_FLAV = [
    'The line gets swept. Two people are still standing on it arguing about a syllable.',
    'A race won by the person who moved last, every single time.',
    'The fastest houseguest in the yard finished fourth. That is the format working.',
    'Seven calls, and the only skill measured was not moving.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.calls ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withCalls.length;
  steps.push({ kind: 'win' });

  if (sealed) {
    const keep = planSeal(steps, {
      countKind: 'run', cap: Math.max(2, Math.ceil(fieldSize / 2)),
      isResult: st => st.kind === 'win',
    });
    steps = steps.slice(0, keep);
    steps.push({ kind: 'cut' }, { kind: 'irony' });
  }

  const total = steps.length;
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;

  const shown = steps.slice(0, revealed).filter(s => s.kind === 'run' && breakdown[s.name])
    .map(s => ({ name: s.name, ...breakdown[s.name] }))
    .sort((a, b) => (b.ground ?? -1) - (a.ground ?? -1));

  const furthest = Math.max(1, ...withCalls.map(([, v]) => v.ground || 0));

  /** The call sheet: seven cells, and everything before a false start greyed. */
  const sheet = calls => {
    const lastFalse = calls.reduce((m, c, k) => (c.falseStart ? k : m), -1);
    return `<div class="rsw-sheet">
      ${calls.map((c, k) => {
    const cls = c.falseStart ? 'is-false' : c.held ? 'is-held' : 'is-go';
    const dead = k < lastFalse;
    return `<div class="rsw-cell ${cls} ${dead ? 'is-dead' : ''}">
          <span class="rsw-word">${sealed ? MASK : c.word}</span>
          <span class="rsw-what">${sealed ? '' : c.falseStart ? 'BACK TO THE LINE'
    : c.held ? 'HELD' : `+${Math.round(c.gained || 0)}`}</span>
          <span class="rsw-cn">${c.call}</span>
        </div>`;
  }).join('')}
    </div>`;
  };

  /** How far down the course they actually finished. */
  const track = bd => {
    const pct = sealed ? 0 : Math.round(((bd.ground || 0) / furthest) * 100);
    return `<div class="rsw-track">
      <span class="rsw-start">LINE</span>
      <span class="rsw-rail"><b style="width:${pct}%"></b>
        <i class="rsw-runner-dot" style="left:${pct}%"></i></span>
      <span class="rsw-finish">${sealed ? MASK : Math.round(bd.ground || 0)}m</span>
    </div>`;
  };

  const strip = `<div class="rsw-strip">
    <div><span class="rsw-k">SHEETS READ</span><span class="rsw-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="rsw-k">FURTHEST</span><span class="rsw-v"><b>${
  sealed ? MASK : (shown.length ? `${Math.round(shown[0].ground)}m` : '—')}</b></span></div>
    <div class="rsw-strip-r"><span class="rsw-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="rsw-v rsw-v-txt">${sealed
    ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
    : done && winner
      ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
      : shown.length ? E(shown[0].name) : 'ON THE LINE'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="rsw-side">
    <div class="rsw-side-h"><span class="rsw-k">DOWN THE COURSE</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="rsw-side-row ${i === 0 ? 'is-lead' : ''}">
      <span class="rsw-side-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="rsw-side-n">${E(r.name)}</span>
      <span class="rsw-side-t">${Math.round(r.ground)}m</span>
    </div>`).join('') : '<p class="rsw-side-e">Nobody has been called forward yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="rsw-card is-locked"><span class="rsw-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="rsw-card rsw-open">
        <header class="rsw-hd"><span class="rsw-tag">${E(s.beat.badgeText || 'SEVEN CALLS')}</span>
          <span class="rsw-sub">${fieldSize} on the line</span></header>
        <p class="rsw-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('rsw', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still on the course', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('rsw', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="rsw-card rsw-win">
        <header class="rsw-hd"><span class="rsw-tag rsw-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="rsw-sub">furthest down the course</span></header>
        <div class="rsw-win-b">
          <figure class="rsw-win-av">${AV(winner, 72)}</figure>
          <div><div class="rsw-win-n">${E(winner)}</div>
            <p class="rsw-body">${E(winner)} finishes ${sealed ? MASK : `${Math.round(w.ground || 0)} down the course`}${
  w.falseStarts ? `, having been sent back ${w.falseStarts === 1 ? 'once' : `${w.falseStarts} times`} on the way` : ' without once moving on a WOAH'}.</p></div>
        </div>
        <p class="rsw-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="rsw-card rsw-note">
        <header class="rsw-hd"><span class="rsw-tag rsw-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="rsw-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    return `<article class="rsw-card rsw-run ${(bd.falseStarts || 0) >= 2 ? 'is-burned' : ''} ${bd.threw ? 'is-threw' : ''}">
      <header class="rsw-hd">
        <span class="rsw-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="rsw-tag ${bd.threw ? 'rsw-tag-quiet' : ''} ${(bd.falseStarts || 0) >= 2 ? 'rsw-tag-red' : ''}">${
  sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="rsw-body">${E(s.beat.text)}</p>

      ${sheet(bd.calls || [])}
      ${track(bd)}

      <div class="rsw-nums">
        <span><i>GROUND</i><b>${sealed ? MASK : `${Math.round(bd.ground || 0)}m`}</b></span>
        <span><i>FALSE STARTS</i><b>${sealed ? MASK : (bd.falseStarts ?? 0)}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="rsw-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigrsw">
  <style>
  .sigrsw{--rs-ink:#e6f7f7;--rs-dim:#7d9799;--rs-line:rgba(99,230,224,.22);
    max-width:1100px;margin:0 auto;color:var(--rs-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:radial-gradient(ellipse at 50% -18%,rgba(99,230,224,.13),transparent 58%),
      linear-gradient(180deg,#0c1719,#060d0e 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}
  .rsw-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--rs-dim);text-align:center}
  .rsw-title{font-family:ui-monospace,Consolas,monospace;font-weight:700;font-size:28px;letter-spacing:5px;
    text-align:center;color:#c2f5f2;text-shadow:0 0 20px rgba(99,230,224,.42);margin:3px 0 2px}
  .rsw-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--rs-dim);margin-bottom:13px}

  .rsw-what{border:1px solid var(--rs-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(99,230,224,.05)}
  .rsw-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .rsw-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:${PALETTE};border:1px solid var(--rs-line);border-radius:3px;padding:2px 7px}
  .rsw-what-h b{font-size:14px;letter-spacing:1px}
  .rsw-what-d{font-size:12.5px;line-height:1.6;color:#c2d6d7;margin:0}
  .rsw-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .rsw-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--rs-dim)}
  .rsw-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(99,230,224,.16);
    text-decoration:none}
  .rsw-w s b{display:block;height:100%;border-radius:2px;background:${PALETTE}}

  .rsw-strip{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px;padding:9px 11px;margin-bottom:12px;
    border:1px solid var(--rs-line);border-radius:10px;background:rgba(5,11,12,.62)}
  .rsw-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--rs-dim)}
  .rsw-v{display:block;margin-top:3px}
  .rsw-v b{font-family:ui-monospace,Consolas,monospace;font-size:17px;color:#c2f5f2}
  .rsw-v i{font-style:normal;font-size:10px;color:var(--rs-dim);margin-left:4px}
  .rsw-v-txt{font-size:12px;color:${PALETTE};letter-spacing:1.2px}
  .rsw-strip-r{border-left:1px solid var(--rs-line);padding-left:11px}

  .rsw-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .rsw-grid-sealed{display:block}
  .rsw-side{position:sticky;top:56px;border:1px solid var(--rs-line);border-radius:10px;padding:9px;
    background:rgba(5,11,12,.74)}
  .rsw-side-h{margin-bottom:7px}
  .rsw-side-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px}
  .rsw-side-row.is-lead{background:rgba(99,230,224,.13)}
  .rsw-side-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--rs-dim)}
  .rsw-side-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .rsw-side-t{font-family:ui-monospace,Consolas,monospace;color:#c2f5f2}
  .rsw-side-e{font-size:11px;color:var(--rs-dim);margin:0}

  .rsw-card{border:1px solid var(--rs-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(16,34,36,.74),rgba(5,10,11,.82));animation:rswIn .3s ease both}
  @keyframes rswIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .rsw-card.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .rsw-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--rs-dim)}
  .rsw-card.is-burned{border-color:rgba(230,90,70,.4)}
  .rsw-card.is-threw{opacity:.72;border-style:dashed}
  .rsw-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .rsw-runner{display:flex;align-items:center;gap:8px}
  .rsw-runner b{font-size:13px;letter-spacing:.6px}
  .rsw-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;color:${PALETTE};
    border:1px solid var(--rs-line);background:rgba(99,230,224,.1);padding:2px 8px;border-radius:3px}
  .rsw-tag-gold{color:#ffd970;border-color:rgba(255,217,112,.45);background:rgba(255,217,112,.1)}
  .rsw-tag-red{color:#ff8a72;border-color:rgba(230,90,70,.5);background:rgba(230,90,70,.12)}
  .rsw-tag-quiet{color:var(--rs-dim);background:none}
  .rsw-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--rs-dim)}
  .rsw-body{font-size:13.5px;line-height:1.65;margin:0}
  .rsw-flav{font-size:10.5px;color:var(--rs-dim);font-style:italic;margin:7px 0 0}

  /* the call sheet */
  .rsw-sheet{display:flex;gap:5px;margin:11px 0 8px;flex-wrap:wrap}
  .rsw-cell{flex:1;min-width:62px;display:flex;flex-direction:column;align-items:center;gap:2px;
    padding:6px 4px;border-radius:7px;border:1px solid rgba(99,230,224,.16);background:rgba(5,11,12,.6)}
  .rsw-cell.is-go{border-color:rgba(99,230,224,.4)}
  .rsw-cell.is-held{border-style:dashed}
  .rsw-cell.is-false{border-color:rgba(230,90,70,.6);background:rgba(230,90,70,.13)}
  .rsw-cell.is-dead{opacity:.34}
  .rsw-word{font-family:ui-monospace,Consolas,monospace;font-size:11px;letter-spacing:2px;color:#c2f5f2}
  .rsw-cell.is-false .rsw-word{color:#ff8a72}
  .rsw-cell.is-held .rsw-word{color:var(--rs-dim)}
  .rsw-what{font-family:ui-monospace,Consolas,monospace;font-size:7px;letter-spacing:1px;color:var(--rs-dim);
    text-align:center}
  .rsw-cell.is-false .rsw-what{color:#ff8a72}
  .rsw-cn{font-family:ui-monospace,Consolas,monospace;font-size:7px;color:rgba(125,151,153,.6)}

  /* how far they actually finished */
  .rsw-track{display:flex;align-items:center;gap:9px;margin-bottom:4px}
  .rsw-start,.rsw-finish{font-family:ui-monospace,Consolas,monospace;font-size:7.5px;letter-spacing:1.4px;
    color:var(--rs-dim);flex:none}
  .rsw-finish{color:#c2f5f2;min-width:38px;text-align:right}
  .rsw-rail{position:relative;flex:1;height:5px;border-radius:3px;background:rgba(99,230,224,.12)}
  .rsw-rail b{display:block;height:100%;border-radius:3px;background:${PALETTE};transition:width .5s ease}
  .rsw-runner-dot{position:absolute;top:-4px;width:13px;height:13px;border-radius:50%;
    transform:translateX(-50%);background:#c2f5f2;box-shadow:0 0 10px rgba(99,230,224,.7);
    transition:left .5s ease}

  .rsw-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .rsw-nums span{display:flex;flex-direction:column;gap:2px}
  .rsw-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--rs-dim)}
  .rsw-nums b{font-family:ui-monospace,Consolas,monospace;font-size:14px;color:#c2f5f2}

  .rsw-win{border-color:rgba(255,217,112,.45);background:linear-gradient(180deg,rgba(52,48,16,.42),rgba(5,10,11,.86))}
  .rsw-win-b{display:flex;gap:13px;align-items:flex-start}
  .rsw-win-av .bb-av{border-radius:9px;border:2px solid rgba(255,217,112,.6)}
  .rsw-win-n{font-family:ui-monospace,Consolas,monospace;font-size:16px;letter-spacing:2px;color:#ffd970;
    margin-bottom:4px}

  .rsw-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(6,13,14,0),rgba(6,13,14,.96) 40%)}
  .rsw-count,.rsw-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--rs-dim)}
  .rsw-done{color:${PALETTE}}

  ${sealCss('rsw', PALETTE)}
  @media(max-width:860px){.rsw-grid{grid-template-columns:1fr}.rsw-side{position:static;order:-1}}
  @media(max-width:700px){
    .rsw-strip{grid-template-columns:1fr 1fr}
    .rsw-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--rs-line);padding:6px 0 0}
    .rsw-title{font-size:20px;letter-spacing:3px}
    .rsw-cell{min-width:48px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigrsw *,.sigrsw *::before,.sigrsw *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="rsw-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="rsw-title">${E((comp.name || 'READY, SET, WOAH').toUpperCase())}</div>
  <div class="rsw-tagline">ready &middot; set &middot; and then whichever word it is</div>

  <div class="rsw-what">
    <div class="rsw-what-h"><span class="rsw-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Ready, Set, Woah')}</b></div>
    ${comp.desc ? `<p class="rsw-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="rsw-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="rsw-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'rsw-grid-sealed' : 'rsw-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="rsw-ctrl">
    ${done ? `<span class="rsw-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE LINE IS SWEPT.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.rsw-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Take your marks' : 'Next sheet'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="rsw-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
