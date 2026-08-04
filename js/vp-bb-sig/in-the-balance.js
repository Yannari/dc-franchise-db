// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/in-the-balance.js — "The Pivot"
//
// The themed screen for js/bb-comps/classics.js → In The Balance
// (`variant: 'balance'`).
//
// One board on one pivot with a ball in a channel, and a pivot that is loosened
// at intervals whether anybody is ready or not. So the instrument is the BOARD
// ITSELF, drawn per houseguest and tilted by how far into the loosenings they
// got — the later stages lean harder, and the ball sits where their run ended:
// in the scoring zone if they were still holding it, off the end if they were
// not.
//
// The stage ladder runs down the side as six notches that light one at a time,
// which is the only clock this competition has. Declines when the stage data
// is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const STAGES = 6;

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigInTheBalance(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withStages = Object.entries(breakdown).filter(([, v]) => Number.isFinite(v?.stage));
  if (!withStages.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PRECISION', accent: '#7aa7ff' };
  const accent = '#8ab4ff';                        // cold rig light on a steel pivot
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_bal_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 31 + salt * 17 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The pivot does not care whether anybody is ready for the next loosening.',
    'Standing still is work. It only looks like the absence of work.',
    'The zone is four inches wide and the channel is the length of the board.',
    'Nobody has ever lost this quickly. Everybody loses it eventually.',
    'Correcting is the thing that ends most runs. Not correcting ends the rest.',
  ];
  const WIN_FLAV = [
    'The boards get locked off. Several people are still shaking out their calves.',
    'A competition won by not doing anything, extremely well, for a long time.',
    'The ball gets lifted out of the channel by hand. It is the only easy thing all night.',
    'Nobody out-balanced anybody by much. One person just twitched last.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    const tag = String(b.badgeText || '').toUpperCase().trim();
    if (tag === 'BY NOTHING') { steps.push({ kind: 'margin', beat: b }); return; }
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who] ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withStages.length;
  steps.push({ kind: 'win' });

  if (sealed) {
    const keep = planSeal(steps, {
      countKind: 'run', cap: Math.max(2, Math.ceil(fieldSize / 2)),
      isResult: st => st.kind === 'win' || st.kind === 'margin',
    });
    steps = steps.slice(0, keep);
    steps.push({ kind: 'cut' }, { kind: 'irony' });
  }

  const total = steps.length;
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;

  const shown = steps.slice(0, revealed).filter(s => s.kind === 'run' && breakdown[s.name])
    .map(s => ({ name: s.name, ...breakdown[s.name] }))
    .sort((a, b) => (b.seconds ?? -1) - (a.seconds ?? -1));

  /** The board itself, tilted by how far the pivot got loosened under them. */
  const boardFor = bd => {
    const stage = Math.max(0, Math.min(STAGES, bd.stage || 0));
    const tilt = sealed ? 0 : (stage >= STAGES ? 0 : 2 + stage * 2.2);
    // Where the ball finished: centred if they were still holding the zone,
    // run off the low end if the board got away from them.
    const held = stage >= 5;
    const pos = sealed ? 50 : held ? 50 : Math.min(94, 50 + stage * 7 + 12);
    return `<div class="bal-rig">
      <div class="bal-board" style="transform:rotate(${tilt}deg)">
        <span class="bal-zone"></span>
        <span class="bal-ball ${held ? 'is-held' : 'is-gone'}" style="left:${pos}%"></span>
      </div>
      <span class="bal-fulcrum" aria-hidden="true"></span>
    </div>`;
  };

  /** Six notches — the only clock this competition has. */
  const ladder = bd => `<span class="bal-ladder" aria-hidden="true">
    ${Array.from({ length: STAGES }, (_, k) =>
    `<i class="${!sealed && k < (bd.stage || 0) ? 'is-past' : ''} ${!sealed && k === (bd.stage || 0) ? 'is-here' : ''}"></i>`).join('')}
  </span>`;

  const strip = `<div class="bal-strip">
    <div><span class="bal-k">BOARDS DOWN</span><span class="bal-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="bal-k">LONGEST HOLD</span><span class="bal-v"><b>${
  sealed ? MASK : (shown.length ? `${Math.round(shown[0].seconds)}s` : '—')}</b></span></div>
    <div class="bal-strip-r"><span class="bal-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="bal-v bal-v-txt">${sealed
    ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
    : done && winner
      ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
      : shown.length ? E(shown[0].name) : 'PIVOTS LOCKED'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="bal-side">
    <div class="bal-side-h"><span class="bal-k">TIME IN THE ZONE</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="bal-side-row ${i === 0 ? 'is-lead' : ''}">
      <span class="bal-side-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="bal-side-n">${E(r.name)}</span>
      <span class="bal-side-t">${Math.round(r.seconds)}s</span>
    </div>`).join('') : '<p class="bal-side-e">Nobody has stepped on yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="bal-card is-locked"><span class="bal-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="bal-card bal-open">
        <header class="bal-hd"><span class="bal-tag">${E(s.beat.badgeText || 'THE BOARD')}</span>
          <span class="bal-sub">${fieldSize} on the pivots</span></header>
        <p class="bal-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('bal', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still on the board', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('bal', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="bal-card bal-win">
        <header class="bal-hd"><span class="bal-tag bal-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="bal-sub">last to lose the ball</span></header>
        <div class="bal-win-b">
          <figure class="bal-win-av">${AV(winner, 72)}</figure>
          <div><div class="bal-win-n">${E(winner)}</div>
            <p class="bal-body">${E(winner)} held the zone for ${sealed ? MASK : `${Math.round(w.seconds || 0)} seconds`}, through ${
  sealed ? MASK : (w.stage || 0)} of the ${STAGES} loosenings.</p></div>
        </div>
        <p class="bal-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'margin' || s.kind === 'note') {
      return `<article class="bal-card bal-note">
        <header class="bal-hd"><span class="bal-tag bal-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="bal-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    return `<article class="bal-card bal-run ${bd.threw ? 'is-threw' : ''}">
      <header class="bal-hd">
        <span class="bal-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="bal-tag ${bd.threw ? 'bal-tag-quiet' : ''}">${sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="bal-body">${E(s.beat.text)}</p>

      <div class="bal-instrument">
        ${ladder(bd)}
        ${boardFor(bd)}
      </div>

      <div class="bal-nums">
        <span><i>IN THE ZONE</i><b>${sealed ? MASK : `${Math.round(bd.seconds || 0)}s`}</b></span>
        <span><i>LOOSENINGS</i><b>${sealed ? MASK : `${bd.stage || 0}/${STAGES}`}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="bal-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigbal">
  <style>
  .sigbal{--bl-ink:#e9eef8;--bl-dim:#7d879b;--bl-line:rgba(138,180,255,.22);
    max-width:1100px;margin:0 auto;color:var(--bl-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:linear-gradient(180deg,#101520,#080a10 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}
  .bal-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--bl-dim);text-align:center}
  .bal-title{font-family:ui-monospace,Consolas,monospace;font-weight:700;font-size:28px;letter-spacing:6px;
    text-align:center;color:#d7e4ff;text-shadow:0 0 20px rgba(138,180,255,.4);margin:3px 0 2px}
  .bal-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--bl-dim);margin-bottom:13px}

  .bal-what{border:1px solid var(--bl-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(138,180,255,.05)}
  .bal-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .bal-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:${accent};border:1px solid var(--bl-line);border-radius:3px;padding:2px 7px}
  .bal-what-h b{font-size:14px;letter-spacing:1px}
  .bal-what-d{font-size:12.5px;line-height:1.6;color:#c2cbdd;margin:0}
  .bal-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .bal-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--bl-dim)}
  .bal-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(138,180,255,.16);
    text-decoration:none}
  .bal-w s b{display:block;height:100%;border-radius:2px;background:${accent}}

  .bal-strip{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px;padding:9px 11px;margin-bottom:12px;
    border:1px solid var(--bl-line);border-radius:10px;background:rgba(8,10,16,.62)}
  .bal-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--bl-dim)}
  .bal-v{display:block;margin-top:3px}
  .bal-v b{font-family:ui-monospace,Consolas,monospace;font-size:17px;color:#d7e4ff}
  .bal-v i{font-style:normal;font-size:10px;color:var(--bl-dim);margin-left:4px}
  .bal-v-txt{font-size:12px;color:${accent};letter-spacing:1.2px}
  .bal-strip-r{border-left:1px solid var(--bl-line);padding-left:11px}

  .bal-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .bal-grid-sealed{display:block}
  .bal-side{position:sticky;top:56px;border:1px solid var(--bl-line);border-radius:10px;padding:9px;
    background:rgba(8,10,16,.72)}
  .bal-side-h{margin-bottom:7px}
  .bal-side-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px}
  .bal-side-row.is-lead{background:rgba(138,180,255,.12)}
  .bal-side-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--bl-dim)}
  .bal-side-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .bal-side-t{font-family:ui-monospace,Consolas,monospace;color:#d7e4ff}
  .bal-side-e{font-size:11px;color:var(--bl-dim);margin:0}

  .bal-card{border:1px solid var(--bl-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(22,30,46,.72),rgba(7,9,14,.82));animation:balIn .3s ease both}
  @keyframes balIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .bal-card.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .bal-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--bl-dim)}
  .bal-card.is-threw{opacity:.72;border-style:dashed}
  .bal-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .bal-runner{display:flex;align-items:center;gap:8px}
  .bal-runner b{font-size:13px;letter-spacing:.6px}
  .bal-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;color:${accent};
    border:1px solid var(--bl-line);background:rgba(138,180,255,.1);padding:2px 8px;border-radius:3px}
  .bal-tag-gold{color:#ffd970;border-color:rgba(255,217,112,.45);background:rgba(255,217,112,.1)}
  .bal-tag-quiet{color:var(--bl-dim);background:none}
  .bal-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--bl-dim)}
  .bal-body{font-size:13.5px;line-height:1.65;margin:0}
  .bal-flav{font-size:10.5px;color:var(--bl-dim);font-style:italic;margin:7px 0 0}

  /* the rig: notch ladder, then the board on its pivot */
  .bal-instrument{display:flex;align-items:center;gap:14px;margin:12px 0 8px;padding:10px 12px 14px;
    border-radius:9px;background:rgba(6,8,13,.6);border:1px solid rgba(138,180,255,.13)}
  .bal-ladder{display:flex;flex-direction:column;gap:4px;flex:none}
  .bal-ladder i{width:14px;height:3px;border-radius:2px;background:rgba(138,180,255,.16);
    transition:background .3s,box-shadow .3s}
  .bal-ladder i.is-past{background:rgba(138,180,255,.6)}
  .bal-ladder i.is-here{background:#ffd970;box-shadow:0 0 9px rgba(255,217,112,.6)}
  .bal-rig{position:relative;flex:1;min-width:0;height:34px}
  .bal-board{position:absolute;left:0;right:0;top:11px;height:9px;border-radius:5px;
    background:linear-gradient(180deg,rgba(190,206,235,.8),rgba(120,138,170,.6));
    transform-origin:50% 50%;transition:transform .45s ease}
  .bal-zone{position:absolute;left:44%;width:12%;top:-3px;bottom:-3px;border-radius:4px;
    border:1px solid rgba(138,180,255,.6);background:rgba(138,180,255,.16)}
  .bal-ball{position:absolute;top:-4px;width:15px;height:15px;border-radius:50%;
    transform:translateX(-50%);transition:left .5s ease}
  .bal-ball.is-held{background:#ffd970;box-shadow:0 0 12px rgba(255,217,112,.7)}
  .bal-ball.is-gone{background:#8f9bb3}
  .bal-fulcrum{position:absolute;left:50%;top:20px;width:0;height:0;transform:translateX(-50%);
    border-left:9px solid transparent;border-right:9px solid transparent;
    border-bottom:14px solid rgba(138,180,255,.45)}

  .bal-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .bal-nums span{display:flex;flex-direction:column;gap:2px}
  .bal-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--bl-dim)}
  .bal-nums b{font-family:ui-monospace,Consolas,monospace;font-size:14px;color:#d7e4ff}

  .bal-win{border-color:rgba(255,217,112,.45);background:linear-gradient(180deg,rgba(52,46,18,.45),rgba(7,9,14,.86))}
  .bal-win-b{display:flex;gap:13px;align-items:flex-start}
  .bal-win-av .bb-av{border-radius:9px;border:2px solid rgba(255,217,112,.6)}
  .bal-win-n{font-family:ui-monospace,Consolas,monospace;font-size:16px;letter-spacing:2px;color:#ffd970;
    margin-bottom:4px}

  .bal-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(8,10,16,0),rgba(8,10,16,.96) 40%)}
  .bal-count,.bal-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--bl-dim)}
  .bal-done{color:${accent}}

  ${sealCss('bal', accent)}
  @media(max-width:860px){.bal-grid{grid-template-columns:1fr}.bal-side{position:static;order:-1}}
  @media(max-width:700px){
    .bal-strip{grid-template-columns:1fr 1fr}
    .bal-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--bl-line);padding:6px 0 0}
    .bal-title{font-size:21px;letter-spacing:4px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigbal *,.sigbal *::before,.sigbal *::after{animation:none!important;transition:none!important}
    .bal-board{transform:none!important}
  }
  </style>

  <div class="bal-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="bal-title">${E((comp.name || 'IN THE BALANCE').toUpperCase())}</div>
  <div class="bal-tagline">one board &middot; one ball &middot; a pivot that keeps loosening</div>

  <div class="bal-what">
    <div class="bal-what-h"><span class="bal-what-c">${E(cat.label)}</span><b>${E(comp.name || 'In The Balance')}</b></div>
    ${comp.desc ? `<p class="bal-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="bal-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="bal-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'bal-grid-sealed' : 'bal-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="bal-ctrl">
    ${done ? `<span class="bal-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE BOARDS ARE LOCKED OFF.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.bal-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Loosen the pivot' : 'Next board'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="bal-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
