// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/rollerball.js — "The Ramp"
//
// The themed screen for js/bb-comps/classics.js → Rollerball
// (`variant: 'rollerball'`).
//
// This competition is not about the rolling. It is about the question after
// every roll: is that enough? So the card is a LEDGER rather than a scoreboard
// — each roll posted in sequence with the running total climbing beside it,
// and either a bank stamp at the end or the whole column struck through in red
// when the ball came back down the ramp and took the lot.
//
// The instrument is the pocket bank: the deep pockets sit at the top, the
// cheap ones at the bottom, and the pocket each roll found lights as the
// ledger is read. Narration comes from the competition's beats; the ledger
// comes from breakdown[name].rolls. Declines when the rolls are missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const POCKETS = [9, 6, 4, 2, 1];

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigRollerball(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withRolls = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.rolls) && v.rolls.length);
  if (!withRolls.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PRECISION', accent: '#e8913c' };
  const accent = '#f0a03c';                        // brass rail under a hot lamp
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_roll_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 29 + salt * 13 + pool.length) % pool.length];

  const RUN_FLAV = [
    'Nothing on this ramp is worth anything until somebody decides to stop.',
    'The deep pocket pays nine. The ramp back down pays nothing at all.',
    'Everybody watching knows exactly when they would have banked. None of them are on the ramp.',
    'The ball does not have to go in a pocket. It only has to get far enough to have a choice.',
    'A running total is not a score. It is a bet nobody has settled yet.',
  ];
  const WIN_FLAV = [
    'The ramp gets swept. Several people are still explaining why they went again.',
    'A competition won by the person who was least interested in the deep pocket.',
    'Nobody rolled better than anybody. Somebody stopped better.',
    'The pockets get covered over. The arguments do not.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.rolls ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withRolls.length;
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
    .sort((a, b) => (b.banked ?? -1) - (a.banked ?? -1));

  /** The pocket bank — deep at the top, and the pockets this run found lit. */
  const bank = rolls => {
    const found = new Set(sealed ? [] : rolls.filter(r => !r.bust).map(r => r.value));
    return `<span class="rbl-bank" aria-hidden="true">
      ${POCKETS.map(v => `<i class="${found.has(v) ? 'is-found' : ''} ${v >= 9 ? 'is-deep' : ''}"><b>${v}</b></i>`).join('')}
    </span>`;
  };

  /** The ledger: one line per roll, the running total climbing beside it. */
  const ledger = (rolls, busted) => {
    let running = 0;
    return `<div class="rbl-ledger ${busted ? 'is-void' : ''}">
      ${rolls.map(r => {
    if (r.bust) {
      return `<div class="rbl-line is-bust"><span class="rbl-n">${r.roll}</span>
            <span class="rbl-val">BACK DOWN THE RAMP</span><span class="rbl-run">0</span></div>`;
    }
    running += r.value;
    return `<div class="rbl-line"><span class="rbl-n">${r.roll}</span>
          <span class="rbl-val">${sealed ? MASK : `+${r.value}`}</span>
          <span class="rbl-run">${sealed ? MASK : running}</span></div>`;
  }).join('')}
      ${busted
    ? '<div class="rbl-stamp is-bust">LOST THE LOT</div>'
    : `<div class="rbl-stamp">BANKED ${sealed ? MASK : running}</div>`}
    </div>`;
  };

  const strip = `<div class="rbl-strip">
    <div><span class="rbl-k">LEDGERS IN</span><span class="rbl-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="rbl-k">BEST BANKED</span><span class="rbl-v"><b>${sealed ? MASK : (shown.length ? shown[0].banked : '—')}</b></span></div>
    <div class="rbl-strip-r"><span class="rbl-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="rbl-v rbl-v-txt">${sealed
    ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
    : done && winner
      ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
      : shown.length ? E(shown[0].name) : 'RAMP CLEAR'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="rbl-board">
    <div class="rbl-board-h"><span class="rbl-k">THE BOOK</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="rbl-board-row ${i === 0 ? 'is-lead' : ''} ${r.busted ? 'is-bust' : ''}">
      <span class="rbl-board-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="rbl-board-n">${E(r.name)}</span>
      <span class="rbl-board-t">${r.busted ? '—' : E(r.banked)}</span>
    </div>`).join('') : '<p class="rbl-board-e">Nothing banked yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="rbl-card is-locked"><span class="rbl-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="rbl-card rbl-open">
        <header class="rbl-hd"><span class="rbl-tag">${E(s.beat.badgeText || 'ROLL OR BANK')}</span>
          <span class="rbl-sub">${fieldSize} at the ramp</span></header>
        <p class="rbl-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('rbl', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still to roll', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('rbl', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="rbl-card rbl-win">
        <header class="rbl-hd"><span class="rbl-tag rbl-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="rbl-sub">highest banked</span></header>
        <div class="rbl-win-b">
          <figure class="rbl-win-av">${AV(winner, 72)}</figure>
          <div><div class="rbl-win-n">${E(winner)}</div>
            <p class="rbl-body">${E(winner)} banked ${sealed ? MASK : E(w.banked ?? 0)}${
  w.pushes ? ` after going back to the ramp ${w.pushes === 1 ? 'once' : `${w.pushes} times`} when stopping was available` : ' without ever reaching for the deep pocket'}.</p></div>
        </div>
        <p class="rbl-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="rbl-card rbl-note">
        <header class="rbl-hd"><span class="rbl-tag rbl-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="rbl-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    const rolls = bd.rolls || [];
    return `<article class="rbl-card rbl-run ${bd.busted ? 'is-bust' : ''} ${bd.threw ? 'is-threw' : ''}">
      <header class="rbl-hd">
        <span class="rbl-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="rbl-tag ${bd.busted ? 'rbl-tag-red' : ''} ${bd.threw ? 'rbl-tag-quiet' : ''}">${
  sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="rbl-body">${E(s.beat.text)}</p>

      <div class="rbl-desk">
        ${bank(rolls)}
        ${ledger(rolls, !!bd.busted)}
      </div>

      <div class="rbl-nums">
        <span><i>BANKED</i><b>${sealed ? MASK : E(bd.banked ?? 0)}</b></span>
        <span><i>HELD AT MOST</i><b>${sealed ? MASK : E(bd.running ?? 0)}</b></span>
        <span><i>WENT AGAIN</i><b>${E(bd.pushes ?? 0)}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="rbl-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigroll">
  <style>
  .sigroll{--rb-ink:#f6ece0;--rb-dim:#9c8871;--rb-line:rgba(240,160,60,.24);
    max-width:1100px;margin:0 auto;color:var(--rb-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:radial-gradient(ellipse at 26% -16%,rgba(240,160,60,.16),transparent 58%),
      linear-gradient(180deg,#1c1510,#0d0a07 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}
  .rbl-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--rb-dim);text-align:center}
  .rbl-title{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:31px;letter-spacing:4px;
    text-align:center;color:#ffd9a3;text-shadow:0 0 20px rgba(240,160,60,.45);margin:3px 0 2px}
  .rbl-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--rb-dim);margin-bottom:13px}

  .rbl-what{border:1px solid var(--rb-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(240,160,60,.05)}
  .rbl-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .rbl-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:${accent};border:1px solid var(--rb-line);border-radius:3px;padding:2px 7px}
  .rbl-what-h b{font-family:Georgia,serif;font-size:15px;letter-spacing:.6px}
  .rbl-what-d{font-size:12.5px;line-height:1.6;color:#dbc9b4;margin:0}
  .rbl-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .rbl-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--rb-dim)}
  .rbl-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(240,160,60,.16);
    text-decoration:none}
  .rbl-w s b{display:block;height:100%;border-radius:2px;background:${accent}}

  .rbl-strip{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px;padding:9px 11px;margin-bottom:12px;
    border:1px solid var(--rb-line);border-radius:10px;background:rgba(12,9,6,.6)}
  .rbl-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--rb-dim)}
  .rbl-v{display:block;margin-top:3px}
  .rbl-v b{font-family:Georgia,serif;font-size:18px;color:#ffd9a3}
  .rbl-v i{font-style:normal;font-size:10px;color:var(--rb-dim);margin-left:4px}
  .rbl-v-txt{font-size:12px;color:${accent};letter-spacing:1.2px}
  .rbl-strip-r{border-left:1px solid var(--rb-line);padding-left:11px}

  .rbl-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .rbl-grid-sealed{display:block}
  .rbl-board{position:sticky;top:56px;border:1px solid var(--rb-line);border-radius:10px;padding:9px;
    background:rgba(12,9,6,.72)}
  .rbl-board-h{margin-bottom:7px}
  .rbl-board-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px}
  .rbl-board-row.is-lead{background:rgba(240,160,60,.13)}
  .rbl-board-row.is-bust{opacity:.55;text-decoration:line-through}
  .rbl-board-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--rb-dim)}
  .rbl-board-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .rbl-board-t{font-family:Georgia,serif;color:#ffd9a3}
  .rbl-board-e{font-size:11px;color:var(--rb-dim);margin:0}

  .rbl-card{border:1px solid var(--rb-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(38,27,17,.75),rgba(11,8,5,.82));animation:rblIn .3s ease both}
  @keyframes rblIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .rbl-card.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .rbl-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--rb-dim)}
  .rbl-card.is-bust{border-color:rgba(230,90,70,.42)}
  .rbl-card.is-threw{opacity:.72;border-style:dashed}
  .rbl-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .rbl-runner{display:flex;align-items:center;gap:8px}
  .rbl-runner b{font-size:13px;letter-spacing:.6px}
  .rbl-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;color:${accent};
    border:1px solid var(--rb-line);background:rgba(240,160,60,.1);padding:2px 8px;border-radius:3px}
  .rbl-tag-gold{color:#ffd970;border-color:rgba(255,217,112,.45);background:rgba(255,217,112,.1)}
  .rbl-tag-red{color:#ff8a72;border-color:rgba(230,90,70,.5);background:rgba(230,90,70,.12)}
  .rbl-tag-quiet{color:var(--rb-dim);background:none}
  .rbl-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--rb-dim)}
  .rbl-body{font-size:13.5px;line-height:1.65;margin:0}
  .rbl-flav{font-size:10.5px;color:var(--rb-dim);font-style:italic;margin:7px 0 0}

  /* the desk: pocket bank on the left, ledger on the right */
  .rbl-desk{display:flex;gap:12px;align-items:flex-start;margin:10px 0 8px}
  .rbl-bank{display:flex;flex-direction:column;gap:3px;flex:none}
  .rbl-bank i{width:34px;height:15px;border-radius:0 0 14px 14px;box-sizing:border-box;
    border:1px solid rgba(240,160,60,.28);display:flex;align-items:center;justify-content:center;
    transition:background .3s,box-shadow .3s}
  .rbl-bank i b{font-family:ui-monospace,Consolas,monospace;font-size:8px;color:var(--rb-dim)}
  .rbl-bank i.is-found{background:rgba(240,160,60,.32)}
  .rbl-bank i.is-found b{color:#ffd9a3}
  .rbl-bank i.is-deep.is-found{background:#ffd970;box-shadow:0 0 12px rgba(255,217,112,.6)}
  .rbl-bank i.is-deep.is-found b{color:#241a08}

  .rbl-ledger{flex:1;min-width:0;border-left:1px solid var(--rb-line);padding-left:11px}
  .rbl-line{display:grid;grid-template-columns:18px 1fr auto;gap:8px;align-items:baseline;
    padding:2px 0;font-family:ui-monospace,Consolas,monospace;font-size:11px}
  .rbl-n{color:var(--rb-dim);font-size:8px}
  .rbl-val{color:#dbc9b4}
  .rbl-run{color:#ffd9a3;font-size:12px}
  .rbl-line.is-bust .rbl-val{color:#ff8a72;letter-spacing:1.4px;font-size:9px}
  .rbl-line.is-bust .rbl-run{color:#ff8a72}
  .rbl-ledger.is-void .rbl-line:not(.is-bust){opacity:.42;text-decoration:line-through}
  .rbl-stamp{margin-top:6px;display:inline-block;font-family:ui-monospace,Consolas,monospace;font-size:9px;
    letter-spacing:2.4px;color:#ffd9a3;border:1px solid rgba(240,160,60,.5);border-radius:3px;
    padding:3px 9px;transform:rotate(-2deg)}
  .rbl-stamp.is-bust{color:#ff8a72;border-color:rgba(230,90,70,.6);background:rgba(230,90,70,.1)}

  .rbl-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .rbl-nums span{display:flex;flex-direction:column;gap:2px}
  .rbl-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--rb-dim)}
  .rbl-nums b{font-family:Georgia,serif;font-size:15px;color:#ffd9a3}

  .rbl-win{border-color:rgba(255,217,112,.45);background:linear-gradient(180deg,rgba(62,48,14,.5),rgba(11,8,5,.86))}
  .rbl-win-b{display:flex;gap:13px;align-items:flex-start}
  .rbl-win-av .bb-av{border-radius:9px;border:2px solid rgba(255,217,112,.6)}
  .rbl-win-n{font-family:Georgia,serif;font-size:18px;letter-spacing:1.6px;color:#ffd970;margin-bottom:4px}

  .rbl-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(13,10,7,0),rgba(13,10,7,.96) 40%)}
  .rbl-count,.rbl-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--rb-dim)}
  .rbl-done{color:${accent}}

  ${sealCss('rbl', accent)}
  @media(max-width:860px){.rbl-grid{grid-template-columns:1fr}.rbl-board{position:static;order:-1}}
  @media(max-width:700px){
    .rbl-strip{grid-template-columns:1fr 1fr}
    .rbl-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--rb-line);padding:6px 0 0}
    .rbl-title{font-size:23px}
    .rbl-desk{flex-direction:column}
    .rbl-bank{flex-direction:row}
    .rbl-bank i{width:26px}
    .rbl-ledger{border-left:0;padding-left:0}
  }
  @media(prefers-reduced-motion:reduce){
    .sigroll *,.sigroll *::before,.sigroll *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="rbl-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="rbl-title">${E((comp.name || 'ROLLERBALL').toUpperCase())}</div>
  <div class="rbl-tagline">roll &middot; hold &middot; is that enough</div>

  <div class="rbl-what">
    <div class="rbl-what-h"><span class="rbl-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Rollerball')}</b></div>
    ${comp.desc ? `<p class="rbl-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="rbl-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="rbl-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'rbl-grid-sealed' : 'rbl-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="rbl-ctrl">
    ${done ? `<span class="rbl-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE BOOK IS CLOSED.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.rbl-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Open the book' : 'Next ledger'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="rbl-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
