// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/hanoi.js — "The Drawing Office"
//
// The themed screen for js/bb-comps/classics.js → Tower of Hanoi
// (`variant: 'hanoi'`).
//
// The competition is a rule, applied without exception, until a tower exists.
// That is not a game — it is a specification. So the screen is a drawing
// office: every run is a technical DRAWING SHEET on blueprint paper, the three
// pegs rendered as a dimensioned elevation with the built discs inked solid
// and the ones still on the first peg left as dashed outline, and each reset
// stamped across the sheet in red like a rejected revision.
//
// Nothing here is shared with the rest of the set: white line-work on navy
// graph paper, a title block ruled along the bottom of every sheet the way a
// real drawing carries one, and the standings kept in a revision register down
// the side of the page rather than a leaderboard. No card has a rounded corner
// anywhere on this screen.
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
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PUZZLE', accent: '#8fd0ff' };
  const INK = '#a8d8ff';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_hanoi_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 37 + salt * 19 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The solution is longer than it looks and it is the same length for everybody.',
    'Small onto large. That is the whole specification, and it ends most of these.',
    'The horn for a wrong placement is louder than the horn for finishing.',
    'Nobody here is slow. People are wrong at speed.',
    'The discs go back to the first peg by themselves, which is the worst part.',
  ];
  const WIN_FLAV = [
    'The pegs get covered. Two people are still at theirs, working it out.',
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

  /** The elevation: three pegs, built discs inked, the rest left as outline. */
  const elevation = bd => {
    const built = sealed ? 0 : Math.round((bd.reached || 0) * DISCS);
    const left = DISCS - built;
    const disc = (size, cls) => `<i class="hnb-d ${cls}" style="width:${24 + size * 12}px"></i>`;
    const stack = (count, from, cls) => Array.from({ length: count }, (_, k) =>
      disc(from - k, cls)).reverse().join('');
    return `<div class="hnb-elev ${bd.solved && !sealed ? 'is-signed' : ''}">
      <span class="hnb-peg"><span>${stack(left, left - 1, 'is-outline')}</span></span>
      <span class="hnb-peg"><span></span></span>
      <span class="hnb-peg"><span>${stack(built, DISCS - 1, 'is-inked')}</span></span>
      <span class="hnb-dim" aria-hidden="true"><em></em><b>${sealed ? MASK : `${Math.round((bd.reached || 0) * 100)}%`}</b><em></em></span>
    </div>`;
  };

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="hnb-sheet is-blank"><span class="hnb-blank">SHEET WITHHELD</span></div>';

    if (s.kind === 'open') {
      return `<article class="hnb-sheet hnb-brief">
        <p class="hnb-body">${E(s.beat.text)}</p>
        <div class="hnb-title"><span>SPEC</span><b>${E(s.beat.badgeText || 'THE TOWER')}</b>
          <span>${fieldSize} AT THE PEGS</span></div>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('hnb', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still building', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('hnb', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="hnb-sheet hnb-approved">
        <div class="hnb-stampbig">${w.solved ? 'APPROVED' : 'BEST SUBMISSION'}</div>
        <p class="hnb-body">${w.solved
    ? `${E(winner)} rebuilt the whole tower in ${sealed ? MASK : `${Math.round(w.seconds || 0)} seconds`}${
      w.resets ? `, sent back to the start ${w.resets === 1 ? 'once' : `${w.resets} times`} on the way` : ' without a single illegal placement'}.`
    : `Nobody finished it. ${E(winner)} was furthest up when time was called.`}</p>
        <p class="hnb-flav">${E(flav(WIN_FLAV, i))}</p>
        <div class="hnb-title"><span>${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <b>${E(winner)}</b><span>SIGNED OFF</span></div>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="hnb-sheet hnb-brief">
        <p class="hnb-body">${E(s.beat.text)}</p>
        <div class="hnb-title"><span>NOTE</span><b>${E(s.beat.badgeText || '')}</b><span></span></div>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    const resets = bd.resets || 0;
    return `<article class="hnb-sheet hnb-run ${bd.solved ? 'is-solved' : ''} ${bd.threw ? 'is-threw' : ''}">
      ${!sealed && resets ? `<div class="hnb-revs">${Array.from({ length: Math.min(4, resets) },
    (_, k) => `<span class="hnb-rev" style="transform:rotate(${-7 + k * 4}deg)">REV ${k + 1} &mdash; REJECTED</span>`).join('')}</div>` : ''}
      <p class="hnb-body">${E(s.beat.text)}</p>
      ${elevation(bd)}
      <div class="hnb-schedule">
        <span>TIME<b>${sealed ? MASK : `${Math.round(bd.seconds || 0)}s`}</b></span>
        <span>RESETS<b>${sealed ? MASK : resets}</b></span>
        <span>BUILT<b>${sealed ? MASK : `${Math.round((bd.reached || 0) * 100)}%`}</b></span>
        ${bd.haveNot ? '<span>HAVE-NOT<b>YES</b></span>' : ''}
      </div>
      <p class="hnb-flav">${E(flav(RUN_FLAV, i))}</p>
      <div class="hnb-title">
        <span>DRAWN BY</span>
        <b>${AV(s.name, 22)}${E(s.name)}</b>
        <span>${sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </div>
    </article>`;
  }).join('');

  // A revision register, not a leaderboard.
  const register = sealed ? '' : `<aside class="hnb-reg">
    <div class="hnb-regh">REGISTER</div>
    ${shown.length ? shown.map((r, i) => `<div class="hnb-regrow">
      <span>${String(i + 1).padStart(2, '0')}</span><b>${E(r.name)}</b>
      <i>${r.solved ? `${Math.round(r.seconds)}s` : `${Math.round((r.reached || 0) * 100)}%`}</i>
    </div>`).join('') : '<div class="hnb-regempty">NO SHEETS FILED</div>'}
  </aside>`;

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigdraw">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
  .sigdraw{--dw-paper:#0d2a44;--dw-ink:${INK};--dw-dim:#5f88ab;--dw-red:#ff6b5c;
    max-width:1100px;margin:0 auto;color:var(--dw-ink);font-family:'Space Mono',ui-monospace,monospace;
    background:
      repeating-linear-gradient(0deg,rgba(168,216,255,.07) 0 1px,transparent 1px 22px),
      repeating-linear-gradient(90deg,rgba(168,216,255,.07) 0 1px,transparent 1px 22px),
      linear-gradient(180deg,#0e2c47,#081a2b 85%);
    padding:0;position:relative;overflow:clip}

  .dw-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;
    padding:14px 16px 11px;border-bottom:2px solid var(--dw-ink)}
  .dw-t{font-weight:700;font-size:25px;letter-spacing:5px;text-transform:uppercase;color:#e6f4ff}
  .dw-w{font-size:9px;letter-spacing:2.4px;color:var(--dw-dim)}
  .dw-scale{font-size:8.5px;letter-spacing:1.8px;color:var(--dw-dim);text-align:right}
  .dw-sealed{margin-top:7px;display:inline-block;font-size:9px;letter-spacing:2.4px;color:#081a2b;
    background:var(--dw-ink);padding:3px 11px}

  .dw-body{display:grid;grid-template-columns:1fr 176px;gap:14px;padding:13px 16px 0;align-items:start}
  .hnb-spec{border:1px solid rgba(168,216,255,.3);padding:9px 11px;margin-bottom:12px}
  .hnb-spec b{font-weight:700;font-size:13px;letter-spacing:1.4px;text-transform:uppercase;color:#e6f4ff}
  .hnb-spec-c{font-size:8px;letter-spacing:2px;color:var(--dw-dim);margin-right:8px}
  .hnb-spec-d{font-size:11.5px;line-height:1.62;color:#bcd9f0;margin:6px 0 0;font-family:Inter,system-ui,sans-serif}
  .hnb-w{display:flex;flex-wrap:wrap;gap:11px;margin-top:8px}
  .hnb-w span{font-size:8px;letter-spacing:1px;color:var(--dw-dim);display:flex;align-items:center;gap:5px}
  .hnb-w s{display:block;width:38px;height:5px;text-decoration:none;border:1px solid rgba(168,216,255,.4)}
  .hnb-w s b{display:block;height:100%;background:var(--dw-ink)}

  /* every run is a drawing sheet — square corners, ruled title block */
  .hnb-sheet{position:relative;border:1px solid rgba(168,216,255,.4);padding:11px 12px 0;margin-bottom:11px;
    background:rgba(6,20,34,.55);animation:dwInk .3s ease both}
  @keyframes dwInk{from{opacity:0}to{opacity:1}}
  .hnb-sheet.is-blank{border-style:dashed;opacity:.2;text-align:center;padding:12px;animation:none}
  .hnb-blank{font-size:9px;letter-spacing:3px;color:var(--dw-dim)}
  .hnb-sheet.is-solved{border-color:var(--dw-ink);box-shadow:0 0 0 1px rgba(168,216,255,.25)}
  .hnb-sheet.is-threw{opacity:.66}
  .hnb-body{font-family:Inter,system-ui,sans-serif;font-size:13.5px;line-height:1.62;margin:0;color:#dcecfa}
  .hnb-flav{font-size:9.5px;color:var(--dw-dim);margin:8px 0 0}

  /* rejected revisions, stamped across the sheet */
  .hnb-revs{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:3px;align-items:flex-end;
    pointer-events:none}
  .hnb-rev{font-size:8px;letter-spacing:1.6px;color:var(--dw-red);border:1px solid var(--dw-red);
    padding:2px 6px;opacity:.85}

  /* the elevation */
  .hnb-elev{position:relative;display:flex;align-items:flex-end;gap:26px;margin:13px 0 9px;
    padding:0 6px 16px;border-bottom:1px solid rgba(168,216,255,.4)}
  .hnb-peg{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:62px}
  .hnb-peg::before{content:'';position:absolute;bottom:0;left:50%;width:1px;height:56px;
    background:rgba(168,216,255,.55)}
  .hnb-peg > span{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px}
  .hnb-d{display:block;height:8px}
  .hnb-d.is-outline{border:1px dashed rgba(168,216,255,.5)}
  .hnb-d.is-inked{background:var(--dw-ink)}
  .hnb-elev.is-signed .hnb-d.is-inked{background:#e6f4ff;box-shadow:0 0 9px rgba(230,244,255,.5)}
  .hnb-dim{position:absolute;left:6px;right:6px;bottom:0;display:flex;align-items:center;gap:6px}
  .hnb-dim em{flex:1;height:1px;background:rgba(168,216,255,.45)}
  .hnb-dim b{font-size:9px;letter-spacing:1.4px;color:var(--dw-dim)}

  .hnb-schedule{display:flex;flex-wrap:wrap;gap:16px;font-size:8px;letter-spacing:1.4px;color:var(--dw-dim)}
  .hnb-schedule b{display:block;font-size:13px;color:#e6f4ff;letter-spacing:0}

  /* the ruled title block every drawing carries */
  .hnb-title{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;
    margin:11px -12px 0;padding:7px 12px;border-top:1px solid rgba(168,216,255,.4);
    font-size:8px;letter-spacing:1.8px;color:var(--dw-dim);background:rgba(168,216,255,.05)}
  .hnb-title b{display:flex;align-items:center;gap:7px;font-size:12px;letter-spacing:1px;color:#e6f4ff}
  .hnb-title .bb-av{border-radius:0;border:1px solid rgba(168,216,255,.5)}
  .hnb-approved .hnb-title{background:rgba(168,216,255,.12)}
  .hnb-stampbig{display:inline-block;font-weight:700;font-size:11px;letter-spacing:3px;color:#081a2b;
    background:var(--dw-ink);padding:3px 10px;margin-bottom:8px}

  /* revision register, not a leaderboard */
  .hnb-reg{position:sticky;top:56px;border:1px solid rgba(168,216,255,.4);background:rgba(6,20,34,.7)}
  .hnb-regh{font-size:8px;letter-spacing:2.6px;color:var(--dw-dim);padding:6px 9px;
    border-bottom:1px solid rgba(168,216,255,.3)}
  .hnb-regrow{display:grid;grid-template-columns:20px 1fr auto;gap:7px;align-items:baseline;
    padding:4px 9px;font-size:10.5px;border-bottom:1px dotted rgba(168,216,255,.18)}
  .hnb-regrow span{color:var(--dw-dim);font-size:8px}
  .hnb-regrow b{color:#dcecfa;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .hnb-regrow i{font-style:normal;color:var(--dw-ink)}
  .hnb-regempty{padding:8px 9px;font-size:9px;color:var(--dw-dim)}

  .hnb-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:9px;justify-content:center;align-items:center;
    padding:11px;margin-top:12px;border-top:2px solid var(--dw-ink);
    background:linear-gradient(180deg,rgba(8,26,43,0),rgba(8,26,43,.97) 45%)}
  .hnb-count,.hnb-done{font-size:9px;letter-spacing:2px;color:var(--dw-dim)}
  .hnb-done{color:var(--dw-ink)}

  ${sealCss('hnb', INK)}
  @media(max-width:860px){.dw-body{grid-template-columns:1fr}.hnb-reg{position:static;order:-1}}
  @media(max-width:700px){.dw-t{font-size:19px;letter-spacing:3px}.hnb-elev{gap:14px}}
  @media(prefers-reduced-motion:reduce){
    .sigdraw *,.sigdraw *::before,.sigdraw *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="dw-head">
    <div>
      <div class="dw-w">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
      <div class="dw-t">${E((comp.name || 'TOWER OF HANOI').toUpperCase())}</div>
      ${sealed ? `<div class="dw-sealed">RESULT SEALED${done ? ' — THE HOUSE NEVER FINDS OUT' : ''}</div>` : ''}
    </div>
    <div class="dw-scale">ONE DISC AT A TIME<br>NEVER LARGE ONTO SMALL<br>OR START AGAIN</div>
  </div>

  <div class="dw-body">
    <div>
      <div class="hnb-spec">
        <span class="hnb-spec-c">${E(cat.label)}</span><b>${E(comp.name || 'Tower of Hanoi')}</b>
        ${comp.desc ? `<p class="hnb-spec-d">${E(comp.desc)}</p>` : ''}
        ${weights.length ? `<div class="hnb-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
        ${(comp.excluded || []).filter(Boolean).length ? `<p class="hnb-spec-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
      </div>
      ${cards}
    </div>
    ${register}
  </div>

  <div class="hnb-ctrl">
    ${done ? `<span class="hnb-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE PEGS ARE COVERED.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.hnb-sheet:not(.is-blank)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Issue the spec' : 'File the next sheet'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="hnb-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
