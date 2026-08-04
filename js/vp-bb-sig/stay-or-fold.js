// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/stay-or-fold.js — "The Table"
//
// The themed screen for js/bb-comps/classics.js → Stay or Fold
// (`variant: 'stayfold'`).
//
// The cards are luck and the declaration is the game, so the instrument is the
// TABLE — four rounds laid out left to right as the hand each houseguest was
// dealt, with what they did about it stamped underneath. A folded card stays
// face-down and takes its small guaranteed score. A card that stayed in is
// turned over. The lowest card left standing is struck through, because
// everything it was worth went with it.
//
// Reading somebody at a table happens in front of the whole house, so the
// call-and-bluff beats get their own card rather than being folded into a
// run. Declines when the round data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigStayOrFold(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withRounds = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.rounds) && v.rounds.length);
  if (!withRounds.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'LUCK', accent: '#4fc98a' };
  const PALETTE = '#5ad39a';                       // baize green under a low lamp
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_fold_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 43 + salt * 29 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The card is luck. Saying what you are going to do about it, out loud, in turn, is not.',
    'Everybody at this table is being read while they are reading.',
    'A good card declared badly is worth nothing at all.',
    'Folding is never wrong at the time. It is only ever wrong afterwards.',
    'The lowest card still standing loses everything it was worth. Everybody knows that going in.',
  ];
  const WIN_FLAV = [
    'The table gets cleared. Two people are still explaining a fold nobody asked about.',
    'A competition of pure luck, won by the person who managed the luck best.',
    'The cards go back in the shoe. What the house learned about each other does not.',
    'Nobody was dealt better than anybody. Somebody just declared better.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    const tag = String(b.badgeText || '').toUpperCase().trim();
    if (tag === 'CALLED' || tag === 'BLUFFED') { steps.push({ kind: 'read', beat: b, called: tag === 'CALLED' }); return; }
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.rounds ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withRounds.length;
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
    .sort((a, b) => (b.total ?? -1) - (a.total ?? -1));

  /** Four rounds, dealt left to right, with the declaration stamped under. */
  const hand = rounds => `<div class="fld-hand">
    ${rounds.map(r => {
    const state2 = r.folded ? 'is-folded' : r.wiped ? 'is-wiped' : 'is-kept';
    const face = sealed ? '?' : (r.folded ? '' : r.card);
    return `<div class="fld-seat">
        <span class="fld-card ${state2} ${sealed ? 'is-sealed' : ''}">
          ${r.folded && !sealed ? '<i class="fld-back"></i>' : `<b>${face}</b>`}
        </span>
        <span class="fld-call ${state2}">${
  r.folded ? 'FOLD' : r.wiped ? 'WIPED' : 'STAY'}</span>
        <span class="fld-rn">${r.round}</span>
      </div>`;
  }).join('')}
  </div>`;

  const strip = `<div class="fld-strip">
    <div><span class="fld-k">HANDS SHOWN</span><span class="fld-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="fld-k">HIGH TOTAL</span><span class="fld-v"><b>${
  sealed ? MASK : (shown.length ? shown[0].total : '—')}</b></span></div>
    <div class="fld-strip-r"><span class="fld-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="fld-v fld-v-txt">${sealed
    ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
    : done && winner
      ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
      : shown.length ? E(shown[0].name) : 'CARDS FACE DOWN'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="fld-side">
    <div class="fld-side-h"><span class="fld-k">THE TABLE</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="fld-side-row ${i === 0 ? 'is-lead' : ''}">
      <span class="fld-side-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="fld-side-n">${E(r.name)}</span>
      <span class="fld-side-t">${E(r.total)}</span>
    </div>`).join('') : '<p class="fld-side-e">No hands turned over yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="fld-card-w is-locked"><span class="fld-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="fld-card-w fld-open">
        <header class="fld-hd"><span class="fld-tag">${E(s.beat.badgeText || 'FOUR ROUNDS')}</span>
          <span class="fld-sub">${fieldSize} at the table</span></header>
        <p class="fld-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('fld', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still holding cards', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('fld', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'read') {
      const pair = (s.beat.players || []).slice(0, 2);
      return `<article class="fld-card-w fld-read ${s.called ? 'is-called' : 'is-bluff'}">
        <header class="fld-hd"><span class="fld-tag ${s.called ? 'fld-tag-gold' : 'fld-tag-red'}">${
  E(s.beat.badgeText || 'READ')}</span><span class="fld-sub">in front of everybody</span></header>
        <div class="fld-face-off">
          ${pair.map(n => `<figure>${AV(n, 40)}<figcaption>${E(n)}</figcaption></figure>`).join(
    '<span class="fld-vs">vs</span>')}
        </div>
        <p class="fld-body">${E(s.beat.text)}</p>
      </article>`;
    }

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="fld-card-w fld-win">
        <header class="fld-hd"><span class="fld-tag fld-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="fld-sub">highest total</span></header>
        <div class="fld-win-b">
          <figure class="fld-win-av">${AV(winner, 72)}</figure>
          <div><div class="fld-win-n">${E(winner)}</div>
            <p class="fld-body">${E(winner)} finished on ${sealed ? MASK : (w.total ?? 0)}, folding ${
  sealed ? MASK : (w.folds ?? 0)} of the four and losing ${sealed ? MASK : (w.wiped ?? 0)} to the table.</p></div>
        </div>
        <p class="fld-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="fld-card-w fld-note">
        <header class="fld-hd"><span class="fld-tag fld-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="fld-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    return `<article class="fld-card-w fld-run ${bd.threw ? 'is-threw' : ''}">
      <header class="fld-hd">
        <span class="fld-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="fld-tag ${bd.threw ? 'fld-tag-quiet' : ''}">${sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="fld-body">${E(s.beat.text)}</p>

      ${hand(bd.rounds || [])}

      <div class="fld-nums">
        <span><i>TOTAL</i><b>${sealed ? MASK : (bd.total ?? 0)}</b></span>
        <span><i>FOLDED</i><b>${sealed ? MASK : (bd.folds ?? 0)}</b></span>
        <span><i>WIPED</i><b>${sealed ? MASK : (bd.wiped ?? 0)}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="fld-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigfld">
  <style>
  .sigfld{--fd-ink:#e9f6ee;--fd-dim:#7f9a8b;--fd-line:rgba(90,211,154,.22);
    max-width:1100px;margin:0 auto;color:var(--fd-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:radial-gradient(ellipse at 50% -22%,rgba(90,211,154,.13),transparent 58%),
      linear-gradient(180deg,#0e1a14,#06100b 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}
  .fld-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--fd-dim);text-align:center}
  .fld-title{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:30px;letter-spacing:4px;
    text-align:center;color:#c6f2da;text-shadow:0 0 20px rgba(90,211,154,.4);margin:3px 0 2px}
  .fld-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--fd-dim);margin-bottom:13px}

  .fld-what{border:1px solid var(--fd-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(90,211,154,.05)}
  .fld-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .fld-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:${PALETTE};border:1px solid var(--fd-line);border-radius:3px;padding:2px 7px}
  .fld-what-h b{font-family:Georgia,serif;font-size:15px;letter-spacing:.6px}
  .fld-what-d{font-size:12.5px;line-height:1.6;color:#c3d8cc;margin:0}
  .fld-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .fld-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--fd-dim)}
  .fld-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(90,211,154,.16);
    text-decoration:none}
  .fld-w s b{display:block;height:100%;border-radius:2px;background:${PALETTE}}

  .fld-strip{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px;padding:9px 11px;margin-bottom:12px;
    border:1px solid var(--fd-line);border-radius:10px;background:rgba(6,14,10,.62)}
  .fld-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--fd-dim)}
  .fld-v{display:block;margin-top:3px}
  .fld-v b{font-family:Georgia,serif;font-size:18px;color:#c6f2da}
  .fld-v i{font-style:normal;font-size:10px;color:var(--fd-dim);margin-left:4px}
  .fld-v-txt{font-size:12px;color:${PALETTE};letter-spacing:1.2px}
  .fld-strip-r{border-left:1px solid var(--fd-line);padding-left:11px}

  .fld-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .fld-grid-sealed{display:block}
  .fld-side{position:sticky;top:56px;border:1px solid var(--fd-line);border-radius:10px;padding:9px;
    background:rgba(6,14,10,.74)}
  .fld-side-h{margin-bottom:7px}
  .fld-side-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px}
  .fld-side-row.is-lead{background:rgba(90,211,154,.13)}
  .fld-side-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--fd-dim)}
  .fld-side-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fld-side-t{font-family:Georgia,serif;color:#c6f2da}
  .fld-side-e{font-size:11px;color:var(--fd-dim);margin:0}

  .fld-card-w{border:1px solid var(--fd-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(18,38,28,.74),rgba(5,11,8,.82));animation:fldIn .3s ease both}
  @keyframes fldIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .fld-card-w.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .fld-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--fd-dim)}
  .fld-card-w.is-threw{opacity:.72;border-style:dashed}
  .fld-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .fld-runner{display:flex;align-items:center;gap:8px}
  .fld-runner b{font-size:13px;letter-spacing:.6px}
  .fld-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;color:${PALETTE};
    border:1px solid var(--fd-line);background:rgba(90,211,154,.1);padding:2px 8px;border-radius:3px}
  .fld-tag-gold{color:#ffd970;border-color:rgba(255,217,112,.45);background:rgba(255,217,112,.1)}
  .fld-tag-red{color:#ff8a72;border-color:rgba(230,90,70,.5);background:rgba(230,90,70,.12)}
  .fld-tag-quiet{color:var(--fd-dim);background:none}
  .fld-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--fd-dim)}
  .fld-body{font-size:13.5px;line-height:1.65;margin:0}
  .fld-flav{font-size:10.5px;color:var(--fd-dim);font-style:italic;margin:7px 0 0}

  /* the hand: four seats, dealt left to right */
  .fld-hand{display:flex;gap:10px;margin:11px 0 8px;padding:10px 12px;border-radius:9px;
    background:radial-gradient(ellipse at 50% 0%,rgba(90,211,154,.1),transparent 70%),rgba(5,12,9,.6);
    border:1px solid rgba(90,211,154,.14);flex-wrap:wrap}
  .fld-seat{display:flex;flex-direction:column;align-items:center;gap:4px}
  .fld-card{width:30px;height:42px;border-radius:4px;display:flex;align-items:center;justify-content:center;
    box-sizing:border-box}
  .fld-card b{font-family:Georgia,serif;font-size:17px}
  .fld-card.is-kept{background:#f2f8f4;color:#0d1b13;box-shadow:0 1px 0 rgba(0,0,0,.4)}
  .fld-card.is-wiped{background:#f2f8f4;color:#8a1f18;box-shadow:0 1px 0 rgba(0,0,0,.4);position:relative}
  .fld-card.is-wiped::after{content:'';position:absolute;left:2px;right:2px;top:50%;height:2px;
    background:#c9342a;transform:rotate(-24deg)}
  .fld-card.is-folded{background:rgba(90,211,154,.12);border:1px solid rgba(90,211,154,.3)}
  .fld-card.is-sealed{background:rgba(90,211,154,.1);border:1px dashed rgba(90,211,154,.35);color:var(--fd-dim)}
  .fld-back{display:block;width:18px;height:28px;border-radius:2px;
    background:repeating-linear-gradient(45deg,rgba(90,211,154,.4) 0 3px,transparent 3px 6px)}
  .fld-call{font-family:ui-monospace,Consolas,monospace;font-size:7.5px;letter-spacing:1.4px;
    color:var(--fd-dim)}
  .fld-call.is-kept{color:${PALETTE}}
  .fld-call.is-wiped{color:#ff8a72}
  .fld-rn{font-family:ui-monospace,Consolas,monospace;font-size:7px;color:rgba(127,154,139,.7)}

  .fld-read{border-color:rgba(90,211,154,.4)}
  .fld-read.is-bluff{border-color:rgba(230,90,70,.42)}
  .fld-face-off{display:flex;align-items:center;justify-content:center;gap:14px;margin:8px 0}
  .fld-face-off figure{margin:0;text-align:center}
  .fld-face-off .bb-av{border-radius:8px;border:1px solid rgba(255,255,255,.2)}
  .fld-face-off figcaption{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:1px;
    margin-top:4px;color:#c3d8cc}
  .fld-vs{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;color:var(--fd-dim)}

  .fld-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .fld-nums span{display:flex;flex-direction:column;gap:2px}
  .fld-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--fd-dim)}
  .fld-nums b{font-family:Georgia,serif;font-size:15px;color:#c6f2da}

  .fld-win{border-color:rgba(255,217,112,.45);background:linear-gradient(180deg,rgba(56,50,18,.42),rgba(5,11,8,.86))}
  .fld-win-b{display:flex;gap:13px;align-items:flex-start}
  .fld-win-av .bb-av{border-radius:9px;border:2px solid rgba(255,217,112,.6)}
  .fld-win-n{font-family:Georgia,serif;font-size:18px;letter-spacing:1.4px;color:#ffd970;margin-bottom:4px}

  .fld-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(6,16,11,0),rgba(6,16,11,.96) 40%)}
  .fld-count,.fld-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--fd-dim)}
  .fld-done{color:${PALETTE}}

  ${sealCss('fld', PALETTE)}
  @media(max-width:860px){.fld-grid{grid-template-columns:1fr}.fld-side{position:static;order:-1}}
  @media(max-width:700px){
    .fld-strip{grid-template-columns:1fr 1fr}
    .fld-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--fd-line);padding:6px 0 0}
    .fld-title{font-size:22px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigfld *,.sigfld *::before,.sigfld *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="fld-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="fld-title">${E((comp.name || 'STAY OR FOLD').toUpperCase())}</div>
  <div class="fld-tagline">declare out loud &middot; in turn &middot; lowest card standing loses it all</div>

  <div class="fld-what">
    <div class="fld-what-h"><span class="fld-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Stay or Fold')}</b></div>
    ${comp.desc ? `<p class="fld-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="fld-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="fld-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'fld-grid-sealed' : 'fld-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="fld-ctrl">
    ${done ? `<span class="fld-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE TABLE IS CLEARED.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.fld-card-w:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Deal them in' : 'Next hand'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="fld-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
