// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/tumblin-dice.js — "The Rake"
//
// The themed screen for js/bb-comps/classics.js → Tumblin' Dice
// (`variant: 'dice'`).
//
// This is the crapshoot of the library and the screen says so rather than
// hiding it. Every throw is drawn as the two dice that came up MULTIPLIED by
// the lane they finished in — so a nine-pip throw in the front lane sits there
// next to a four-pip throw in the back lane worth three times as much, which
// is the entire injustice of the competition rendered as arithmetic.
//
// The lane bank runs across the top of each card: three bands, back narrow and
// worth most, front wide and worth almost nothing. A throw that came off the
// table gets no dice at all, just the rail. Declines when the throw data is
// missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

/** Pips drawn as pips — the one place a die may not be a number. */
const PIP_LAYOUT = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
const die = n => `<span class="tdc-die">${
  Array.from({ length: 9 }, (_, k) => `<i class="${(PIP_LAYOUT[n] || []).includes(k) ? 'is-on' : ''}"></i>`).join('')}</span>`;

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigTumblinDice(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withThrows = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.throws) && v.throws.length);
  if (!withThrows.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'LUCK', accent: '#ff5f6d' };
  const PALETTE = '#ff6b7a';                       // felt red, chrome rail
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_dice_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 47 + salt * 31 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The best throw of the night can be worth nothing. That is not a flaw in the competition.',
    'Three throws. No practice, no restock, no second bounce to appeal to.',
    'The back lane is a hand span wide and pays triple.',
    'Nobody here is better at this than anybody else. Everybody thinks they are.',
    'A die against the rail scores zero, however good the throw that put it there was.',
  ];
  const WIN_FLAV = [
    'The table gets wiped down. Nobody learned anything about anybody.',
    'A competition decided by a bounce, which the winner will describe as a strategy all week.',
    'The dice go back in the box. Two people are still measuring lanes with their hands.',
    'Somebody had to win it. That is genuinely the whole explanation.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.throws ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withThrows.length;
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

  /** The lane bank: back narrow and worth triple, front wide and worth one. */
  const lanes = throwList => {
    const hit = new Set(sealed ? [] : throwList.filter(t => !t.off).map(t => t.lane));
    return `<div class="tdc-lanes" aria-hidden="true">
      ${[3, 2, 1].map(l => `<span class="tdc-lane tdc-l${l} ${hit.has(l) ? 'is-hit' : ''}"><b>&times;${l}</b></span>`).join('')}
    </div>`;
  };

  /** Three throws, each the dice AND the lane they finished in. */
  const throwRow = throwList => `<div class="tdc-throws">
    ${throwList.map(t => {
    if (t.off) {
      return `<div class="tdc-throw is-off">
          <span class="tdc-dice"><span class="tdc-die is-off"></span><span class="tdc-die is-off"></span></span>
          <span class="tdc-calc">OFF THE TABLE</span>
          <span class="tdc-val">0</span></div>`;
    }
    if (sealed) {
      return `<div class="tdc-throw">
          <span class="tdc-dice"><span class="tdc-die is-off"></span><span class="tdc-die is-off"></span></span>
          <span class="tdc-calc">${MASK}</span><span class="tdc-val">${MASK}</span></div>`;
    }
    // The pips are split across two dice; they only have to sum to the throw.
    const a = Math.max(1, Math.min(6, Math.round(t.pips / 2)));
    const b = Math.max(1, Math.min(6, t.pips - a));
    return `<div class="tdc-throw ${t.lane === 3 ? 'is-deep' : ''}">
        <span class="tdc-dice">${die(a)}${die(b)}</span>
        <span class="tdc-calc">${t.pips} &times; ${t.lane}</span>
        <span class="tdc-val">${t.value}</span>
      </div>`;
  }).join('')}
  </div>`;

  const strip = `<div class="tdc-strip">
    <div><span class="tdc-k">TABLES DONE</span><span class="tdc-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="tdc-k">HIGH TOTAL</span><span class="tdc-v"><b>${
  sealed ? MASK : (shown.length ? shown[0].total : '—')}</b></span></div>
    <div class="tdc-strip-r"><span class="tdc-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="tdc-v tdc-v-txt">${sealed
    ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
    : done && winner
      ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
      : shown.length ? E(shown[0].name) : 'DICE IN THE BOX'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="tdc-side">
    <div class="tdc-side-h"><span class="tdc-k">THE TABLE</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="tdc-side-row ${i === 0 ? 'is-lead' : ''}">
      <span class="tdc-side-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="tdc-side-n">${E(r.name)}</span>
      <span class="tdc-side-t">${E(r.total)}</span>
    </div>`).join('') : '<p class="tdc-side-e">Nobody has thrown yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="tdc-card is-locked"><span class="tdc-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="tdc-card tdc-open">
        <header class="tdc-hd"><span class="tdc-tag">${E(s.beat.badgeText || 'THREE THROWS')}</span>
          <span class="tdc-sub">${fieldSize} at the rake</span></header>
        <p class="tdc-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('tdc', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still to throw', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('tdc', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="tdc-card tdc-win">
        <header class="tdc-hd"><span class="tdc-tag tdc-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="tdc-sub">highest total</span></header>
        <div class="tdc-win-b">
          <figure class="tdc-win-av">${AV(winner, 72)}</figure>
          <div><div class="tdc-win-n">${E(winner)}</div>
            <p class="tdc-body">${E(winner)} finishes on ${sealed ? MASK : (w.total ?? 0)}${
  w.zeros ? `, with ${w.zeros === 1 ? 'one throw' : `${w.zeros} throws`} that never counted` : ''}. The rake does not explain itself.</p></div>
        </div>
        <p class="tdc-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="tdc-card tdc-note">
        <header class="tdc-hd"><span class="tdc-tag tdc-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="tdc-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    const throwList = bd.throws || [];
    return `<article class="tdc-card tdc-run ${bd.threw ? 'is-threw' : ''}">
      <header class="tdc-hd">
        <span class="tdc-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="tdc-tag ${bd.threw ? 'tdc-tag-quiet' : ''}">${sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="tdc-body">${E(s.beat.text)}</p>

      <div class="tdc-table">
        ${lanes(throwList)}
        ${throwRow(throwList)}
      </div>

      <div class="tdc-nums">
        <span><i>TOTAL</i><b>${sealed ? MASK : (bd.total ?? 0)}</b></span>
        <span><i>OFF THE TABLE</i><b>${sealed ? MASK : (bd.zeros ?? 0)}</b></span>
        <span><i>BEST LINE</i><b>${sealed ? MASK : (bd.bestLine ?? 0)}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="tdc-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigtdc">
  <style>
  .sigtdc{--td-ink:#fdeaea;--td-dim:#a58186;--td-line:rgba(255,107,122,.24);
    max-width:1100px;margin:0 auto;color:var(--td-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:radial-gradient(ellipse at 50% -18%,rgba(255,107,122,.15),transparent 58%),
      linear-gradient(180deg,#1e0f12,#0d0709 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}
  .tdc-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--td-dim);text-align:center}
  .tdc-title{font-family:ui-monospace,Consolas,monospace;font-weight:700;font-size:29px;letter-spacing:5px;
    text-align:center;color:#ffd3d6;text-shadow:0 0 20px rgba(255,107,122,.45);margin:3px 0 2px}
  .tdc-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--td-dim);margin-bottom:13px}

  .tdc-what{border:1px solid var(--td-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(255,107,122,.05)}
  .tdc-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .tdc-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:${PALETTE};border:1px solid var(--td-line);border-radius:3px;padding:2px 7px}
  .tdc-what-h b{font-size:14px;letter-spacing:1px}
  .tdc-what-d{font-size:12.5px;line-height:1.6;color:#e2c8ca;margin:0}
  .tdc-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .tdc-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--td-dim)}
  .tdc-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(255,107,122,.16);
    text-decoration:none}
  .tdc-w s b{display:block;height:100%;border-radius:2px;background:${PALETTE}}

  .tdc-strip{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px;padding:9px 11px;margin-bottom:12px;
    border:1px solid var(--td-line);border-radius:10px;background:rgba(11,6,8,.62)}
  .tdc-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--td-dim)}
  .tdc-v{display:block;margin-top:3px}
  .tdc-v b{font-family:ui-monospace,Consolas,monospace;font-size:17px;color:#ffd3d6}
  .tdc-v i{font-style:normal;font-size:10px;color:var(--td-dim);margin-left:4px}
  .tdc-v-txt{font-size:12px;color:${PALETTE};letter-spacing:1.2px}
  .tdc-strip-r{border-left:1px solid var(--td-line);padding-left:11px}

  .tdc-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .tdc-grid-sealed{display:block}
  .tdc-side{position:sticky;top:56px;border:1px solid var(--td-line);border-radius:10px;padding:9px;
    background:rgba(11,6,8,.74)}
  .tdc-side-h{margin-bottom:7px}
  .tdc-side-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px}
  .tdc-side-row.is-lead{background:rgba(255,107,122,.13)}
  .tdc-side-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--td-dim)}
  .tdc-side-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tdc-side-t{font-family:ui-monospace,Consolas,monospace;color:#ffd3d6}
  .tdc-side-e{font-size:11px;color:var(--td-dim);margin:0}

  .tdc-card{border:1px solid var(--td-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(44,20,24,.74),rgba(10,6,7,.82));animation:tdcIn .3s ease both}
  @keyframes tdcIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .tdc-card.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .tdc-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--td-dim)}
  .tdc-card.is-threw{opacity:.72;border-style:dashed}
  .tdc-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .tdc-runner{display:flex;align-items:center;gap:8px}
  .tdc-runner b{font-size:13px;letter-spacing:.6px}
  .tdc-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;color:${PALETTE};
    border:1px solid var(--td-line);background:rgba(255,107,122,.1);padding:2px 8px;border-radius:3px}
  .tdc-tag-gold{color:#ffd970;border-color:rgba(255,217,112,.45);background:rgba(255,217,112,.1)}
  .tdc-tag-quiet{color:var(--td-dim);background:none}
  .tdc-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--td-dim)}
  .tdc-body{font-size:13.5px;line-height:1.65;margin:0}
  .tdc-flav{font-size:10.5px;color:var(--td-dim);font-style:italic;margin:7px 0 0}

  /* the raked table: lane bank, then the three throws as arithmetic */
  .tdc-table{margin:11px 0 8px;padding:10px 12px;border-radius:9px;
    background:linear-gradient(180deg,rgba(70,16,22,.5),rgba(8,5,6,.7));
    border:1px solid rgba(255,107,122,.15)}
  .tdc-lanes{display:flex;flex-direction:column;gap:2px;margin-bottom:9px}
  .tdc-lane{position:relative;height:11px;border-radius:2px;background:rgba(255,107,122,.1);
    border:1px solid rgba(255,107,122,.18);transition:background .3s,box-shadow .3s}
  .tdc-lane b{position:absolute;right:6px;top:-1px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;color:var(--td-dim)}
  .tdc-l3{width:34%}
  .tdc-l2{width:62%}
  .tdc-l1{width:100%}
  .tdc-lane.is-hit{background:rgba(255,107,122,.4)}
  .tdc-l3.is-hit{background:#ffd970;box-shadow:0 0 12px rgba(255,217,112,.55)}
  .tdc-l3.is-hit b{color:#2a1d06}
  .tdc-throws{display:flex;gap:10px;flex-wrap:wrap}
  .tdc-throw{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 9px;
    border-radius:7px;background:rgba(10,6,7,.55);border:1px solid rgba(255,107,122,.14)}
  .tdc-throw.is-deep{border-color:rgba(255,217,112,.45)}
  .tdc-throw.is-off{opacity:.55;border-style:dashed}
  .tdc-dice{display:flex;gap:4px}
  .tdc-die{display:grid;grid-template-columns:repeat(3,4px);grid-template-rows:repeat(3,4px);gap:1px;
    padding:3px;border-radius:3px;background:#f7eaea;box-shadow:0 1px 0 rgba(0,0,0,.4)}
  .tdc-die i{border-radius:50%;background:transparent}
  .tdc-die i.is-on{background:#2a1013}
  .tdc-die.is-off{background:rgba(247,234,234,.18);box-shadow:none}
  .tdc-calc{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.2px;
    color:var(--td-dim)}
  .tdc-val{font-family:ui-monospace,Consolas,monospace;font-size:15px;color:#ffd3d6}
  .tdc-throw.is-deep .tdc-val{color:#ffd970}

  .tdc-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .tdc-nums span{display:flex;flex-direction:column;gap:2px}
  .tdc-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--td-dim)}
  .tdc-nums b{font-family:ui-monospace,Consolas,monospace;font-size:14px;color:#ffd3d6}

  .tdc-win{border-color:rgba(255,217,112,.45);background:linear-gradient(180deg,rgba(64,48,16,.44),rgba(10,6,7,.86))}
  .tdc-win-b{display:flex;gap:13px;align-items:flex-start}
  .tdc-win-av .bb-av{border-radius:9px;border:2px solid rgba(255,217,112,.6)}
  .tdc-win-n{font-family:ui-monospace,Consolas,monospace;font-size:16px;letter-spacing:2px;color:#ffd970;
    margin-bottom:4px}

  .tdc-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(13,7,9,0),rgba(13,7,9,.96) 40%)}
  .tdc-count,.tdc-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--td-dim)}
  .tdc-done{color:${PALETTE}}

  ${sealCss('tdc', PALETTE)}
  @media(max-width:860px){.tdc-grid{grid-template-columns:1fr}.tdc-side{position:static;order:-1}}
  @media(max-width:700px){
    .tdc-strip{grid-template-columns:1fr 1fr}
    .tdc-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--td-line);padding:6px 0 0}
    .tdc-title{font-size:22px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigtdc *,.sigtdc *::before,.sigtdc *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="tdc-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="tdc-title">${E((comp.name || "TUMBLIN' DICE").toUpperCase())}</div>
  <div class="tdc-tagline">three throws &middot; pips times lane &middot; the rail pays nothing</div>

  <div class="tdc-what">
    <div class="tdc-what-h"><span class="tdc-what-c">${E(cat.label)}</span><b>${E(comp.name || "Tumblin' Dice")}</b></div>
    ${comp.desc ? `<p class="tdc-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="tdc-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="tdc-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'tdc-grid-sealed' : 'tdc-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="tdc-ctrl">
    ${done ? `<span class="tdc-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE DICE ARE IN THE BOX.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.tdc-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Throw first' : 'Next table'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="tdc-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
