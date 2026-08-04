// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/spelling-search.js — "The Dig"
//
// The themed screen for js/bb-comps/classics.js → Spelling Search
// (`variant: 'spelling'`).
//
// Two things happen in this competition and only one of them is the running.
// A houseguest can dig up more tiles than anybody and still score nothing,
// because tiles are not a word — so the instrument is split down the middle:
// on the left the haul, drawn as a row of blank tile backs pulled out of the
// sand, and on the right the board, where only the tiles that made the word
// are face-up. The gap between the two numbers IS the competition.
//
// A board that does not spell anything gets the whole haul greyed out under a
// stamp, because that is exactly what it was worth. Declines when the tile
// data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigSpellingSearch(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withTiles = Object.entries(breakdown).filter(([, v]) => Number.isFinite(v?.tiles));
  if (!withTiles.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PUZZLE', accent: '#e0b45c' };
  const PALETTE = '#e8bd64';                       // wet sand under floodlight
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_spell_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 41 + salt * 23 + pool.length) % pool.length];

  const RUN_FLAV = [
    'One tile at a time. That rule is the entire reason this takes an hour.',
    'Nobody knows which letters are still out there. That is the point of burying them.',
    'The sand gives up a Q eventually. It always gives up a Q.',
    'A board full of tiles that is not a word is worth exactly as much as an empty one.',
    'The clock does not care that somebody nearly had a longer word.',
  ];
  const WIN_FLAV = [
    'The yard gets raked flat. Several tiles are still in it.',
    'A competition won by the person who stopped digging soonest.',
    'The boards get read out one at a time. Two of them are not words.',
    'Everybody had the letters for something. Not everybody had a word.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who] ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withTiles.length;
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
    .sort((a, b) => (b.letters ?? -1) - (a.letters ?? -1));

  /**
   * The haul and the board.
   *
   * Left: every tile dug up, backs out. Right: only the ones that made the
   * word, face up. A letter is picked off the name so the same houseguest
   * always spells with the same letters — it is decoration, never a result.
   */
  const bench = (name, bd) => {
    const tiles = Math.max(0, bd.tiles || 0);
    const word = sealed ? 0 : Math.max(0, bd.letters || 0);
    const spare = Math.max(0, tiles - word);
    let h = 0;
    for (let i = 0; i < String(name).length; i++) h = (h * 31 + String(name).charCodeAt(i)) >>> 0;
    const letter = k => String.fromCharCode(65 + ((h + k * 7) % 26));
    return `<div class="spg-bench ${!sealed && !bd.valid ? 'is-void' : ''}">
      <div class="spg-half">
        <span class="spg-k">DUG UP</span>
        <span class="spg-tiles">${Array.from({ length: Math.min(14, tiles) }, () =>
    '<i class="spg-tile is-back"></i>').join('')}${tiles > 14 ? `<b class="spg-more">+${tiles - 14}</b>` : ''}</span>
      </div>
      <span class="spg-div" aria-hidden="true"></span>
      <div class="spg-half">
        <span class="spg-k">ON THE BOARD</span>
        <span class="spg-tiles">${word
    ? Array.from({ length: Math.min(12, word) }, (_, k) =>
      `<i class="spg-tile is-face">${letter(k)}</i>`).join('')
    : `<i class="spg-tile is-empty"></i><i class="spg-tile is-empty"></i><i class="spg-tile is-empty"></i>`}</span>
      </div>
      ${!sealed && !bd.valid
    ? '<span class="spg-stamp">NOT A WORD</span>'
    : (!sealed && spare > 0 ? `<span class="spg-spare">${spare} unused</span>` : '')}
    </div>`;
  };

  const strip = `<div class="spg-strip">
    <div><span class="spg-k">BOARDS READ</span><span class="spg-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="spg-k">LONGEST WORD</span><span class="spg-v"><b>${
  sealed ? MASK : (shown.length ? shown[0].letters : '—')}</b></span></div>
    <div class="spg-strip-r"><span class="spg-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="spg-v spg-v-txt">${sealed
    ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
    : done && winner
      ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
      : shown.length ? E(shown[0].name) : 'SAND UNDISTURBED'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="spg-side">
    <div class="spg-side-h"><span class="spg-k">THE BOARDS</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="spg-side-row ${i === 0 ? 'is-lead' : ''} ${r.valid ? '' : 'is-void'}">
      <span class="spg-side-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="spg-side-n">${E(r.name)}</span>
      <span class="spg-side-t">${r.valid ? r.letters : '—'}</span>
    </div>`).join('') : '<p class="spg-side-e">Nobody has come back with a tile yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="spg-card is-locked"><span class="spg-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="spg-card spg-open">
        <header class="spg-hd"><span class="spg-tag">${E(s.beat.badgeText || 'DIG AND SPELL')}</span>
          <span class="spg-sub">${fieldSize} in the sand</span></header>
        <p class="spg-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('spg', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still digging', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('spg', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="spg-card spg-win">
        <header class="spg-hd"><span class="spg-tag spg-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="spg-sub">longest valid word</span></header>
        <div class="spg-win-b">
          <figure class="spg-win-av">${AV(winner, 72)}</figure>
          <div><div class="spg-win-n">${E(winner)}</div>
            <p class="spg-body">${E(winner)} came back with ${sealed ? MASK : (w.tiles ?? 0)} tiles and turned ${
  sealed ? MASK : (w.letters ?? 0)} of them into a word, which is the only number the horn counts.</p></div>
        </div>
        <p class="spg-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="spg-card spg-note">
        <header class="spg-hd"><span class="spg-tag spg-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="spg-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    return `<article class="spg-card spg-run ${!sealed && !bd.valid ? 'is-void' : ''} ${bd.threw ? 'is-threw' : ''}">
      <header class="spg-hd">
        <span class="spg-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="spg-tag ${bd.threw ? 'spg-tag-quiet' : ''} ${!sealed && !bd.valid ? 'spg-tag-red' : ''}">${
  sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="spg-body">${E(s.beat.text)}</p>

      ${bench(s.name, bd)}

      <div class="spg-nums">
        <span><i>WORD</i><b>${sealed ? MASK : (bd.valid ? bd.letters : '0')}</b></span>
        <span><i>TILES DUG</i><b>${sealed ? MASK : (bd.tiles ?? 0)}</b></span>
        <span><i>WASTED</i><b>${sealed ? MASK : Math.max(0, (bd.tiles || 0) - (bd.letters || 0))}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="spg-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigspg">
  <style>
  .sigspg{--sp-ink:#f7efdd;--sp-dim:#a1917a;--sp-line:rgba(232,189,100,.22);
    max-width:1100px;margin:0 auto;color:var(--sp-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:radial-gradient(ellipse at 50% -20%,rgba(232,189,100,.15),transparent 60%),
      linear-gradient(180deg,#1c1710,#0c0a07 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}
  .spg-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--sp-dim);text-align:center}
  .spg-title{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:30px;letter-spacing:4px;
    text-align:center;color:#ffe7b0;text-shadow:0 0 20px rgba(232,189,100,.42);margin:3px 0 2px}
  .spg-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--sp-dim);margin-bottom:13px}

  .spg-what{border:1px solid var(--sp-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(232,189,100,.05)}
  .spg-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .spg-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:${PALETTE};border:1px solid var(--sp-line);border-radius:3px;padding:2px 7px}
  .spg-what-h b{font-family:Georgia,serif;font-size:15px;letter-spacing:.6px}
  .spg-what-d{font-size:12.5px;line-height:1.6;color:#ded0b6;margin:0}
  .spg-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .spg-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--sp-dim)}
  .spg-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(232,189,100,.16);
    text-decoration:none}
  .spg-w s b{display:block;height:100%;border-radius:2px;background:${PALETTE}}

  .spg-strip{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px;padding:9px 11px;margin-bottom:12px;
    border:1px solid var(--sp-line);border-radius:10px;background:rgba(11,9,6,.62)}
  .spg-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--sp-dim)}
  .spg-v{display:block;margin-top:3px}
  .spg-v b{font-family:Georgia,serif;font-size:18px;color:#ffe7b0}
  .spg-v i{font-style:normal;font-size:10px;color:var(--sp-dim);margin-left:4px}
  .spg-v-txt{font-size:12px;color:${PALETTE};letter-spacing:1.2px}
  .spg-strip-r{border-left:1px solid var(--sp-line);padding-left:11px}

  .spg-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .spg-grid-sealed{display:block}
  .spg-side{position:sticky;top:56px;border:1px solid var(--sp-line);border-radius:10px;padding:9px;
    background:rgba(11,9,6,.72)}
  .spg-side-h{margin-bottom:7px}
  .spg-side-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px}
  .spg-side-row.is-lead{background:rgba(232,189,100,.13)}
  .spg-side-row.is-void{opacity:.5}
  .spg-side-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--sp-dim)}
  .spg-side-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .spg-side-t{font-family:Georgia,serif;color:#ffe7b0}
  .spg-side-e{font-size:11px;color:var(--sp-dim);margin:0}

  .spg-card{border:1px solid var(--sp-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(40,32,18,.72),rgba(10,8,5,.82));animation:spgIn .3s ease both}
  @keyframes spgIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .spg-card.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .spg-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--sp-dim)}
  .spg-card.is-void{border-color:rgba(230,90,70,.4)}
  .spg-card.is-threw{opacity:.72;border-style:dashed}
  .spg-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .spg-runner{display:flex;align-items:center;gap:8px}
  .spg-runner b{font-size:13px;letter-spacing:.6px}
  .spg-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;color:${PALETTE};
    border:1px solid var(--sp-line);background:rgba(232,189,100,.1);padding:2px 8px;border-radius:3px}
  .spg-tag-gold{color:#ffd970;border-color:rgba(255,217,112,.45);background:rgba(255,217,112,.1)}
  .spg-tag-red{color:#ff8a72;border-color:rgba(230,90,70,.5);background:rgba(230,90,70,.12)}
  .spg-tag-quiet{color:var(--sp-dim);background:none}
  .spg-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--sp-dim)}
  .spg-body{font-size:13.5px;line-height:1.65;margin:0}
  .spg-flav{font-size:10.5px;color:var(--sp-dim);font-style:italic;margin:7px 0 0}

  /* the haul, the divide, and the board */
  .spg-bench{position:relative;display:flex;align-items:flex-start;gap:12px;margin:11px 0 8px;
    padding:10px 12px;border-radius:9px;background:rgba(7,6,4,.6);
    border:1px solid rgba(232,189,100,.13)}
  .spg-half{flex:1;min-width:0}
  .spg-div{width:1px;align-self:stretch;background:repeating-linear-gradient(180deg,
    rgba(232,189,100,.3) 0 4px,transparent 4px 9px)}
  .spg-tiles{display:flex;flex-wrap:wrap;gap:3px;margin-top:5px;align-items:center}
  .spg-tile{width:17px;height:20px;border-radius:2px;display:flex;align-items:center;justify-content:center;
    font-family:Georgia,serif;font-size:11px;font-style:normal}
  .spg-tile.is-back{background:rgba(232,189,100,.18);border:1px solid rgba(232,189,100,.28)}
  .spg-tile.is-face{background:#ffe7b0;color:#241d0c;box-shadow:0 1px 0 rgba(0,0,0,.35)}
  .spg-tile.is-empty{background:transparent;border:1px dashed rgba(232,189,100,.28)}
  .spg-more{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--sp-dim);margin-left:3px}
  .spg-bench.is-void .spg-tile.is-back{opacity:.4}
  .spg-stamp{position:absolute;right:10px;bottom:8px;font-family:ui-monospace,Consolas,monospace;
    font-size:9px;letter-spacing:2.4px;color:#ff8a72;border:1px solid rgba(230,90,70,.6);
    background:rgba(230,90,70,.12);border-radius:3px;padding:3px 9px;transform:rotate(-3deg)}
  .spg-spare{position:absolute;right:10px;bottom:8px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.4px;color:var(--sp-dim)}

  .spg-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .spg-nums span{display:flex;flex-direction:column;gap:2px}
  .spg-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--sp-dim)}
  .spg-nums b{font-family:Georgia,serif;font-size:15px;color:#ffe7b0}

  .spg-win{border-color:rgba(255,217,112,.45);background:linear-gradient(180deg,rgba(62,50,16,.48),rgba(10,8,5,.86))}
  .spg-win-b{display:flex;gap:13px;align-items:flex-start}
  .spg-win-av .bb-av{border-radius:9px;border:2px solid rgba(255,217,112,.6)}
  .spg-win-n{font-family:Georgia,serif;font-size:18px;letter-spacing:1.4px;color:#ffd970;margin-bottom:4px}

  .spg-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(12,10,7,0),rgba(12,10,7,.96) 40%)}
  .spg-count,.spg-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--sp-dim)}
  .spg-done{color:${PALETTE}}

  ${sealCss('spg', PALETTE)}
  @media(max-width:860px){.spg-grid{grid-template-columns:1fr}.spg-side{position:static;order:-1}}
  @media(max-width:700px){
    .spg-strip{grid-template-columns:1fr 1fr}
    .spg-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--sp-line);padding:6px 0 0}
    .spg-title{font-size:22px}
    .spg-bench{flex-direction:column}
    .spg-div{width:100%;height:1px;background:repeating-linear-gradient(90deg,
      rgba(232,189,100,.3) 0 4px,transparent 4px 9px)}
  }
  @media(prefers-reduced-motion:reduce){
    .sigspg *,.sigspg *::before,.sigspg *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="spg-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="spg-title">${E((comp.name || 'SPELLING SEARCH').toUpperCase())}</div>
  <div class="spg-tagline">dig &middot; carry one &middot; a board is not a word</div>

  <div class="spg-what">
    <div class="spg-what-h"><span class="spg-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Spelling Search')}</b></div>
    ${comp.desc ? `<p class="spg-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="spg-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="spg-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'spg-grid-sealed' : 'spg-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="spg-ctrl">
    ${done ? `<span class="spg-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE SAND IS RAKED FLAT.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.spg-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Start digging' : 'Next board'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="spg-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
