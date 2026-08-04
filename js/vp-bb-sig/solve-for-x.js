// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/solve-for-x.js — "The Podiums"
//
// The themed screen for js/bb-comps/classics.js → Solve For X
// (`variant: 'solveforx'`).
//
// Ten questions, every quantity in them something that happened in front of
// these people, and no credit at all for being close. So the instrument is the
// ANSWER STRIP: ten lit segments per houseguest, one per question, and the
// only three states a segment can be in — got it, missed it, or got it when
// almost nobody else did.
//
// That third state is the one worth drawing. Being the only person on the
// board with an answer says something about a houseguest that a total does
// not, so a solo correct burns gold and is counted separately. Declines when
// the answer data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigSolveForX(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withAnswers = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.answers) && v.answers.length);
  if (!withAnswers.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'QUIZ', accent: '#7de08a' };
  const PALETTE = '#86e89a';                       // podium readout, phosphor green
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_solvex_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 61 + salt * 43 + pool.length) % pool.length];

  const RUN_FLAV = [
    'Every number in every question happened in front of all ten of them.',
    'Being one out is worth exactly as much as being nowhere near.',
    'Nothing may be looked up. There is nothing in the house to look anything up in.',
    'The podium lights before the answer is locked, which is its own kind of pressure.',
    'Somebody always counts votes on their fingers under the desk.',
  ];
  const WIN_FLAV = [
    'The podiums go dark one at a time. Somebody is still doing the last one out loud.',
    'A competition that measures who has been paying attention, and says so publicly.',
    'The answers get read back. Two of them nobody got at all.',
    'Being the person who remembers everything is a reputation, and reputations get people nominated.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.answers ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withAnswers.length;
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
    .sort((a, b) => (b.correct ?? -1) - (a.correct ?? -1) || (b.solo ?? 0) - (a.solo ?? 0));

  const QUESTIONS = Math.max(1, ...withAnswers.map(([, v]) => (v.answers || []).length));

  /** Ten segments, one per question: got it, missed it, or got it alone. */
  const stripFor = answers => `<div class="sfx-answers">
    ${answers.map(a => `<span class="sfx-seg ${sealed ? 'is-sealed' : a.solo ? 'is-solo' : a.correct ? 'is-right' : 'is-wrong'}"
        title="Question ${a.q}${sealed ? '' : a.solo ? ' — the only one who had it' : a.correct ? ' — correct' : ' — wrong'}">
      <b>${a.q}</b></span>`).join('')}
  </div>`;

  const strip = `<div class="sfx-strip">
    <div><span class="sfx-k">PODIUMS READ</span><span class="sfx-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="sfx-k">BEST SCORE</span><span class="sfx-v"><b>${
  sealed ? MASK : (shown.length ? `${shown[0].correct}/${QUESTIONS}` : '—')}</b></span></div>
    <div class="sfx-strip-r"><span class="sfx-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="sfx-v sfx-v-txt">${sealed
    ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
    : done && winner
      ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
      : shown.length ? E(shown[0].name) : 'PODIUMS DARK'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="sfx-side">
    <div class="sfx-side-h"><span class="sfx-k">THE BOARD</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="sfx-side-row ${i === 0 ? 'is-lead' : ''}">
      <span class="sfx-side-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="sfx-side-n">${E(r.name)}</span>
      <span class="sfx-side-t">${E(r.correct)}${r.solo ? `<i>+${r.solo}</i>` : ''}</span>
    </div>`).join('') : '<p class="sfx-side-e">No answers locked in yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="sfx-card is-locked"><span class="sfx-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="sfx-card sfx-open">
        <header class="sfx-hd"><span class="sfx-tag">${E(s.beat.badgeText || 'TEN QUESTIONS')}</span>
          <span class="sfx-sub">${fieldSize} at the podiums</span></header>
        <p class="sfx-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('sfx', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still at their podium', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('sfx', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="sfx-card sfx-win">
        <header class="sfx-hd"><span class="sfx-tag sfx-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="sfx-sub">most correct</span></header>
        <div class="sfx-win-b">
          <figure class="sfx-win-av">${AV(winner, 72)}</figure>
          <div><div class="sfx-win-n">${E(winner)}</div>
            <p class="sfx-body">${E(winner)} finishes on ${sealed ? MASK : `${w.correct ?? 0} of ${QUESTIONS}`}${
  w.solo ? `, and had ${w.solo === 1 ? 'one answer' : `${w.solo} answers`} nobody else on the board had` : ''}.</p></div>
        </div>
        <p class="sfx-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="sfx-card sfx-note">
        <header class="sfx-hd"><span class="sfx-tag sfx-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="sfx-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    return `<article class="sfx-card sfx-run ${bd.solo >= 2 ? 'is-sharp' : ''} ${bd.threw ? 'is-threw' : ''}">
      <header class="sfx-hd">
        <span class="sfx-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="sfx-tag ${bd.threw ? 'sfx-tag-quiet' : ''} ${bd.solo >= 2 ? 'sfx-tag-gold' : ''}">${
  sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="sfx-body">${E(s.beat.text)}</p>

      <div class="sfx-podium">
        <span class="sfx-readout">${sealed ? MASK : `${bd.correct ?? 0}`}<i>/${QUESTIONS}</i></span>
        ${stripFor(bd.answers || [])}
      </div>

      <div class="sfx-nums">
        <span><i>CORRECT</i><b>${sealed ? MASK : (bd.correct ?? 0)}</b></span>
        <span><i>HAD IT ALONE</i><b>${sealed ? MASK : (bd.solo ?? 0)}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="sfx-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigsfx">
  <style>
  .sigsfx{--sx-ink:#e8f6ea;--sx-dim:#7f9584;--sx-line:rgba(134,232,154,.22);
    max-width:1100px;margin:0 auto;color:var(--sx-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:radial-gradient(ellipse at 50% -18%,rgba(134,232,154,.12),transparent 58%),
      linear-gradient(180deg,#0b1610,#05100a 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}
  .sfx-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--sx-dim);text-align:center}
  .sfx-title{font-family:ui-monospace,Consolas,monospace;font-weight:700;font-size:29px;letter-spacing:6px;
    text-align:center;color:#c4f5cf;text-shadow:0 0 20px rgba(134,232,154,.42);margin:3px 0 2px}
  .sfx-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--sx-dim);margin-bottom:13px}

  .sfx-what{border:1px solid var(--sx-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(134,232,154,.05)}
  .sfx-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .sfx-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:${PALETTE};border:1px solid var(--sx-line);border-radius:3px;padding:2px 7px}
  .sfx-what-h b{font-size:14px;letter-spacing:1px}
  .sfx-what-d{font-size:12.5px;line-height:1.6;color:#c3d8c8;margin:0}
  .sfx-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .sfx-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--sx-dim)}
  .sfx-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(134,232,154,.16);
    text-decoration:none}
  .sfx-w s b{display:block;height:100%;border-radius:2px;background:${PALETTE}}

  .sfx-strip{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px;padding:9px 11px;margin-bottom:12px;
    border:1px solid var(--sx-line);border-radius:10px;background:rgba(5,14,9,.62)}
  .sfx-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--sx-dim)}
  .sfx-v{display:block;margin-top:3px}
  .sfx-v b{font-family:ui-monospace,Consolas,monospace;font-size:17px;color:#c4f5cf}
  .sfx-v i{font-style:normal;font-size:10px;color:var(--sx-dim);margin-left:4px}
  .sfx-v-txt{font-size:12px;color:${PALETTE};letter-spacing:1.2px}
  .sfx-strip-r{border-left:1px solid var(--sx-line);padding-left:11px}

  .sfx-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .sfx-grid-sealed{display:block}
  .sfx-side{position:sticky;top:56px;border:1px solid var(--sx-line);border-radius:10px;padding:9px;
    background:rgba(5,14,9,.74)}
  .sfx-side-h{margin-bottom:7px}
  .sfx-side-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px}
  .sfx-side-row.is-lead{background:rgba(134,232,154,.13)}
  .sfx-side-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--sx-dim)}
  .sfx-side-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sfx-side-t{font-family:ui-monospace,Consolas,monospace;color:#c4f5cf}
  .sfx-side-t i{font-style:normal;font-size:9px;color:#ffd970;margin-left:2px}
  .sfx-side-e{font-size:11px;color:var(--sx-dim);margin:0}

  .sfx-card{border:1px solid var(--sx-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(14,34,22,.74),rgba(4,10,7,.82));animation:sfxIn .3s ease both}
  @keyframes sfxIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .sfx-card.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .sfx-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--sx-dim)}
  .sfx-card.is-sharp{border-color:rgba(255,217,112,.4)}
  .sfx-card.is-threw{opacity:.72;border-style:dashed}
  .sfx-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .sfx-runner{display:flex;align-items:center;gap:8px}
  .sfx-runner b{font-size:13px;letter-spacing:.6px}
  .sfx-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;color:${PALETTE};
    border:1px solid var(--sx-line);background:rgba(134,232,154,.1);padding:2px 8px;border-radius:3px}
  .sfx-tag-gold{color:#ffd970;border-color:rgba(255,217,112,.45);background:rgba(255,217,112,.1)}
  .sfx-tag-quiet{color:var(--sx-dim);background:none}
  .sfx-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--sx-dim)}
  .sfx-body{font-size:13.5px;line-height:1.65;margin:0}
  .sfx-flav{font-size:10.5px;color:var(--sx-dim);font-style:italic;margin:7px 0 0}

  /* the podium: a readout and ten answer segments */
  .sfx-podium{display:flex;align-items:center;gap:12px;margin:11px 0 8px;padding:9px 12px;
    border-radius:9px;background:rgba(4,11,7,.62);border:1px solid rgba(134,232,154,.14)}
  .sfx-readout{flex:none;font-family:ui-monospace,Consolas,monospace;font-size:22px;color:#c4f5cf;
    text-shadow:0 0 12px rgba(134,232,154,.55)}
  .sfx-readout i{font-style:normal;font-size:11px;color:var(--sx-dim)}
  .sfx-answers{display:flex;gap:4px;flex-wrap:wrap;flex:1}
  .sfx-seg{width:20px;height:24px;border-radius:3px;display:flex;align-items:center;justify-content:center;
    box-sizing:border-box;border:1px solid rgba(134,232,154,.2)}
  .sfx-seg b{font-family:ui-monospace,Consolas,monospace;font-size:8px}
  .sfx-seg.is-right{background:rgba(134,232,154,.42);border-color:${PALETTE}}
  .sfx-seg.is-right b{color:#06170d}
  .sfx-seg.is-wrong{background:transparent;border-style:dashed}
  .sfx-seg.is-wrong b{color:rgba(127,149,132,.7)}
  .sfx-seg.is-solo{background:#ffd970;border-color:#ffd970;box-shadow:0 0 11px rgba(255,217,112,.6)}
  .sfx-seg.is-solo b{color:#241d06}
  .sfx-seg.is-sealed{background:rgba(134,232,154,.1);border-style:dotted}
  .sfx-seg.is-sealed b{color:var(--sx-dim)}

  .sfx-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .sfx-nums span{display:flex;flex-direction:column;gap:2px}
  .sfx-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--sx-dim)}
  .sfx-nums b{font-family:ui-monospace,Consolas,monospace;font-size:14px;color:#c4f5cf}

  .sfx-win{border-color:rgba(255,217,112,.45);background:linear-gradient(180deg,rgba(52,48,16,.42),rgba(4,10,7,.86))}
  .sfx-win-b{display:flex;gap:13px;align-items:flex-start}
  .sfx-win-av .bb-av{border-radius:9px;border:2px solid rgba(255,217,112,.6)}
  .sfx-win-n{font-family:ui-monospace,Consolas,monospace;font-size:16px;letter-spacing:2px;color:#ffd970;
    margin-bottom:4px}

  .sfx-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(5,16,10,0),rgba(5,16,10,.96) 40%)}
  .sfx-count,.sfx-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--sx-dim)}
  .sfx-done{color:${PALETTE}}

  ${sealCss('sfx', PALETTE)}
  @media(max-width:860px){.sfx-grid{grid-template-columns:1fr}.sfx-side{position:static;order:-1}}
  @media(max-width:700px){
    .sfx-strip{grid-template-columns:1fr 1fr}
    .sfx-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--sx-line);padding:6px 0 0}
    .sfx-title{font-size:21px;letter-spacing:4px}
    .sfx-podium{flex-direction:column;align-items:flex-start}
  }
  @media(prefers-reduced-motion:reduce){
    .sigsfx *,.sigsfx *::before,.sigsfx *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="sfx-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="sfx-title">${E((comp.name || 'SOLVE FOR X').toUpperCase())}</div>
  <div class="sfx-tagline">the house, as arithmetic &middot; no credit for close</div>

  <div class="sfx-what">
    <div class="sfx-what-h"><span class="sfx-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Solve For X')}</b></div>
    ${comp.desc ? `<p class="sfx-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="sfx-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="sfx-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'sfx-grid-sealed' : 'sfx-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="sfx-ctrl">
    ${done ? `<span class="sfx-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE PODIUMS ARE DARK.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.sfx-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'First question' : 'Next podium'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="sfx-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
