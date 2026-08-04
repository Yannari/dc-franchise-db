// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/hanoi.js — "Three Pegs"
//
// The themed screen for js/bb-comps/classics.js → Tower of Hanoi
// (`variant: 'hanoi'`).
//
// The competition's whole cruelty is the reset: one disc placed wrong and the
// board is cleared, so the punishment for a confident mistake is the entire
// run. The instrument is therefore the three pegs with the tower part-built to
// however far they actually got — and a row of reset marks scored across the
// card like tally on a wall, each one a whole run that stopped existing.
//
// Declines when the tower data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const DISCS = 5;

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigHanoi(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withTowers = Object.entries(breakdown).filter(([, v]) => Number.isFinite(v?.reached));
  if (!withTowers.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PUZZLE', accent: '#c08cf0' };
  const PALETTE = '#c48cf0';                       // lacquer purple, brass pegs
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_hanoi_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 37 + salt * 19 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The solution is longer than it looks and it is the same length for everybody.',
    'Small onto large. That is the entire rule, and it ends most of these runs.',
    'The horn for a wrong placement is louder than the horn for finishing.',
    'Nobody is slow here. People are just wrong at speed.',
    'The discs go back to the first peg by themselves, which is somehow the worst part.',
  ];
  const WIN_FLAV = [
    'The pegs get covered. Two people are still standing at theirs working it out.',
    'A competition where being confident cost more than being slow.',
    'The tower comes apart in four seconds. It went up in four minutes.',
    'Everybody knew the rule. That was never the difficulty.',
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
    || withTowers.length;
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
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  /** Three pegs, with the third built as far as they actually got. */
  const pegs = bd => {
    const built = sealed ? 0 : Math.round((bd.reached || 0) * DISCS);
    const left = DISCS - built;
    const disc = (size, cls) => `<i class="hnb-disc ${cls}" style="width:${26 + size * 11}px"></i>`;
    const stack = (count, from, cls) => Array.from({ length: count }, (_, k) =>
      disc(from - k, cls)).reverse().join('');
    return `<div class="hnb-pegs ${bd.solved && !sealed ? 'is-solved' : ''}">
      <span class="hnb-peg"><span class="hnb-stack">${stack(left, left - 1, 'is-start')}</span><b></b></span>
      <span class="hnb-peg"><span class="hnb-stack"></span><b></b></span>
      <span class="hnb-peg"><span class="hnb-stack">${stack(built, DISCS - 1, 'is-done')}</span><b></b></span>
    </div>`;
  };

  /** Reset tally — each mark is a whole run that stopped existing. */
  const tally = n => (n > 0
    ? `<span class="hnb-tally" title="${n} reset${n === 1 ? '' : 's'}">${
      Array.from({ length: Math.min(6, n) }, () => '<i></i>').join('')}<b>${n} RESET${n === 1 ? '' : 'S'}</b></span>`
    : '<span class="hnb-tally is-clean"><b>NO RESETS</b></span>');

  const strip = `<div class="hnb-strip">
    <div><span class="hnb-k">BOARDS READ</span><span class="hnb-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="hnb-k">SOLVED</span><span class="hnb-v"><b>${
  sealed ? MASK : shown.filter(r => r.solved).length}</b></span></div>
    <div class="hnb-strip-r"><span class="hnb-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="hnb-v hnb-v-txt">${sealed
    ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
    : done && winner
      ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
      : shown.length ? E(shown[0].name) : 'PEGS EMPTY'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="hnb-side">
    <div class="hnb-side-h"><span class="hnb-k">THE BOARD</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="hnb-side-row ${i === 0 ? 'is-lead' : ''}">
      <span class="hnb-side-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="hnb-side-n">${E(r.name)}</span>
      <span class="hnb-side-t">${r.solved ? `${Math.round(r.seconds)}s` : `${Math.round((r.reached || 0) * 100)}%`}</span>
    </div>`).join('') : '<p class="hnb-side-e">Nobody has touched a disc yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="hnb-card is-locked"><span class="hnb-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="hnb-card hnb-open">
        <header class="hnb-hd"><span class="hnb-tag">${E(s.beat.badgeText || 'THE TOWER')}</span>
          <span class="hnb-sub">${fieldSize} at the pegs</span></header>
        <p class="hnb-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('hnb', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still building', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('hnb', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="hnb-card hnb-win">
        <header class="hnb-hd"><span class="hnb-tag hnb-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="hnb-sub">${w.solved ? 'first finished tower' : 'furthest up the tower'}</span></header>
        <div class="hnb-win-b">
          <figure class="hnb-win-av">${AV(winner, 72)}</figure>
          <div><div class="hnb-win-n">${E(winner)}</div>
            <p class="hnb-body">${w.solved
    ? `${E(winner)} rebuilt the whole tower in ${sealed ? MASK : `${Math.round(w.seconds || 0)} seconds`}${
      w.resets ? `, having been sent back to the start ${w.resets === 1 ? 'once' : `${w.resets} times`} on the way` : ' without a single illegal placement'}.`
    : `Nobody finished it. ${E(winner)} was furthest up when time was called.`}</p></div>
        </div>
        <p class="hnb-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="hnb-card hnb-note">
        <header class="hnb-hd"><span class="hnb-tag hnb-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="hnb-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    return `<article class="hnb-card hnb-run ${bd.solved ? 'is-solved' : ''} ${bd.threw ? 'is-threw' : ''}">
      <header class="hnb-hd">
        <span class="hnb-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="hnb-tag ${bd.threw ? 'hnb-tag-quiet' : ''} ${bd.solved ? 'hnb-tag-gold' : ''}">${
  sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="hnb-body">${E(s.beat.text)}</p>

      <div class="hnb-instrument">
        ${pegs(bd)}
        ${sealed ? '' : tally(bd.resets || 0)}
      </div>

      <div class="hnb-nums">
        <span><i>UP THE TOWER</i><b>${sealed ? MASK : `${Math.round((bd.reached || 0) * 100)}%`}</b></span>
        <span><i>TIME</i><b>${sealed ? MASK : `${Math.round(bd.seconds || 0)}s`}</b></span>
        <span><i>RESETS</i><b>${sealed ? MASK : (bd.resets ?? 0)}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="hnb-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sighnb">
  <style>
  .sighnb{--hn-ink:#f0e9f8;--hn-dim:#93849f;--hn-line:rgba(196,140,240,.22);
    max-width:1100px;margin:0 auto;color:var(--hn-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:radial-gradient(ellipse at 50% -16%,rgba(196,140,240,.15),transparent 58%),
      linear-gradient(180deg,#181123,#0b070f 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}
  .hnb-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--hn-dim);text-align:center}
  .hnb-title{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:31px;letter-spacing:3px;
    text-align:center;color:#eddcff;text-shadow:0 0 20px rgba(196,140,240,.45);margin:3px 0 2px}
  .hnb-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--hn-dim);margin-bottom:13px}

  .hnb-what{border:1px solid var(--hn-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(196,140,240,.05)}
  .hnb-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .hnb-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:${PALETTE};border:1px solid var(--hn-line);border-radius:3px;padding:2px 7px}
  .hnb-what-h b{font-family:Georgia,serif;font-size:15px;letter-spacing:.6px}
  .hnb-what-d{font-size:12.5px;line-height:1.6;color:#d3c6de;margin:0}
  .hnb-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .hnb-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--hn-dim)}
  .hnb-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(196,140,240,.16);
    text-decoration:none}
  .hnb-w s b{display:block;height:100%;border-radius:2px;background:${PALETTE}}

  .hnb-strip{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px;padding:9px 11px;margin-bottom:12px;
    border:1px solid var(--hn-line);border-radius:10px;background:rgba(10,7,14,.62)}
  .hnb-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--hn-dim)}
  .hnb-v{display:block;margin-top:3px}
  .hnb-v b{font-family:Georgia,serif;font-size:18px;color:#eddcff}
  .hnb-v i{font-style:normal;font-size:10px;color:var(--hn-dim);margin-left:4px}
  .hnb-v-txt{font-size:12px;color:${PALETTE};letter-spacing:1.2px}
  .hnb-strip-r{border-left:1px solid var(--hn-line);padding-left:11px}

  .hnb-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .hnb-grid-sealed{display:block}
  .hnb-side{position:sticky;top:56px;border:1px solid var(--hn-line);border-radius:10px;padding:9px;
    background:rgba(10,7,14,.72)}
  .hnb-side-h{margin-bottom:7px}
  .hnb-side-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px}
  .hnb-side-row.is-lead{background:rgba(196,140,240,.13)}
  .hnb-side-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--hn-dim)}
  .hnb-side-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .hnb-side-t{font-family:ui-monospace,Consolas,monospace;color:#eddcff}
  .hnb-side-e{font-size:11px;color:var(--hn-dim);margin:0}

  .hnb-card{border:1px solid var(--hn-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(34,24,48,.74),rgba(9,6,12,.82));animation:hnbIn .3s ease both}
  @keyframes hnbIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .hnb-card.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .hnb-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--hn-dim)}
  .hnb-card.is-solved{border-color:rgba(255,217,112,.4)}
  .hnb-card.is-threw{opacity:.72;border-style:dashed}
  .hnb-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .hnb-runner{display:flex;align-items:center;gap:8px}
  .hnb-runner b{font-size:13px;letter-spacing:.6px}
  .hnb-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;color:${PALETTE};
    border:1px solid var(--hn-line);background:rgba(196,140,240,.1);padding:2px 8px;border-radius:3px}
  .hnb-tag-gold{color:#ffd970;border-color:rgba(255,217,112,.45);background:rgba(255,217,112,.1)}
  .hnb-tag-quiet{color:var(--hn-dim);background:none}
  .hnb-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--hn-dim)}
  .hnb-body{font-size:13.5px;line-height:1.65;margin:0}
  .hnb-flav{font-size:10.5px;color:var(--hn-dim);font-style:italic;margin:7px 0 0}

  /* three pegs, and the tally of runs that stopped existing */
  .hnb-instrument{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;
    margin:12px 0 8px;padding:12px 14px 10px;border-radius:9px;background:rgba(7,5,10,.6);
    border:1px solid rgba(196,140,240,.13)}
  .hnb-pegs{display:flex;align-items:flex-end;gap:20px;flex:1}
  .hnb-peg{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
    min-height:56px}
  .hnb-peg b{position:absolute;bottom:0;width:64px;height:3px;border-radius:2px;
    background:rgba(196,140,240,.35)}
  .hnb-peg::before{content:'';position:absolute;bottom:0;width:3px;height:50px;border-radius:2px;
    background:rgba(196,140,240,.28)}
  .hnb-stack{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;
    padding-bottom:5px;z-index:1}
  .hnb-disc{display:block;height:7px;border-radius:4px}
  .hnb-disc.is-start{background:rgba(196,140,240,.4)}
  .hnb-disc.is-done{background:#c48cf0;box-shadow:0 0 8px rgba(196,140,240,.5)}
  .hnb-pegs.is-solved .hnb-disc.is-done{background:#ffd970;box-shadow:0 0 10px rgba(255,217,112,.6)}
  .hnb-tally{display:flex;align-items:center;gap:4px;flex:none}
  .hnb-tally i{width:2px;height:17px;background:#ff8a72;transform:rotate(9deg);border-radius:1px}
  .hnb-tally b{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;
    color:#ff8a72;margin-left:5px}
  .hnb-tally.is-clean b{color:#8fe0a8}

  .hnb-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .hnb-nums span{display:flex;flex-direction:column;gap:2px}
  .hnb-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--hn-dim)}
  .hnb-nums b{font-family:Georgia,serif;font-size:15px;color:#eddcff}

  .hnb-win{border-color:rgba(255,217,112,.45);background:linear-gradient(180deg,rgba(58,46,16,.45),rgba(9,6,12,.86))}
  .hnb-win-b{display:flex;gap:13px;align-items:flex-start}
  .hnb-win-av .bb-av{border-radius:9px;border:2px solid rgba(255,217,112,.6)}
  .hnb-win-n{font-family:Georgia,serif;font-size:18px;letter-spacing:1.4px;color:#ffd970;margin-bottom:4px}

  .hnb-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(11,7,15,0),rgba(11,7,15,.96) 40%)}
  .hnb-count,.hnb-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--hn-dim)}
  .hnb-done{color:${PALETTE}}

  ${sealCss('hnb', PALETTE)}
  @media(max-width:860px){.hnb-grid{grid-template-columns:1fr}.hnb-side{position:static;order:-1}}
  @media(max-width:700px){
    .hnb-strip{grid-template-columns:1fr 1fr}
    .hnb-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--hn-line);padding:6px 0 0}
    .hnb-title{font-size:23px}
    .hnb-instrument{flex-direction:column;align-items:flex-start}
    .hnb-pegs{gap:12px}
  }
  @media(prefers-reduced-motion:reduce){
    .sighnb *,.sighnb *::before,.sighnb *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="hnb-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="hnb-title">${E((comp.name || 'TOWER OF HANOI').toUpperCase())}</div>
  <div class="hnb-tagline">one disc at a time &middot; never large onto small &middot; or start again</div>

  <div class="hnb-what">
    <div class="hnb-what-h"><span class="hnb-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Tower of Hanoi')}</b></div>
    ${comp.desc ? `<p class="hnb-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="hnb-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="hnb-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'hnb-grid-sealed' : 'hnb-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="hnb-ctrl">
    ${done ? `<span class="hnb-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE PEGS ARE COVERED.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.hnb-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Start the clock' : 'Next board'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="hnb-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
