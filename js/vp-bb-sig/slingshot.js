// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/slingshot.js — "The Long Yard"
//
// The themed screen for js/bb-comps/classics.js → Slingshot Aim
// (`variant: 'slingshot'`).
//
// The image the competition lives on is a person holding a heavy band at full
// draw with a row of obstacles between them and a board they have to arc over.
// So the card is that sightline, drawn from behind the shooter: a rack of six
// balls that empties as the shots go, the obstacles hanging in the middle, and
// the ring board at the far end lighting up ring by ring as each shot lands.
//
// Narration comes from the competition's beats; the shot rack comes from
// breakdown[name].shots. Declines when the shots are missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigSlingshot(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withShots = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.shots) && v.shots.length);
  if (!withShots.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PRECISION', accent: '#8bd450' };
  const accent = '#9ede5a';                       // cut grass under floodlight
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_sling_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 23 + salt * 11 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The obstacles do not move all night. Everybody keeps aiming at them anyway.',
    'Six balls is not many when two of them are gone before the hand settles.',
    'The centre ring is the size of a dinner plate and looks smaller from the draw.',
    'Nobody gets a practice shot. The first one is a shot.',
    'The band is heavier than it looks, and it gets heavier every time it is drawn.',
  ];
  const WIN_FLAV = [
    'The crates get collected. Most of them still have balls in them.',
    'A competition of six decisions, won by whoever made the fewest of them badly.',
    'The board gets wheeled off with the centre ring still lit.',
    'Nobody out-shot anybody by much. That is the whole story of the night.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    const tag = String(b.badgeText || '').toUpperCase().trim();
    if (b.badgeClass === 'gold' && tag === 'WINS') { steps.push({ kind: 'win', beat: b }); return; }
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.shots ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withShots.length;

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

  /** The ring board, lit to whatever the best shot of the run was worth. */
  const ringBoard = best => {
    const RINGS = [2, 4, 6, 10];
    const lit = sealed ? -1 : RINGS.findIndex(v => v === best);
    return `<span class="sls-rings" aria-hidden="true">
      ${RINGS.map((v, k) => `<i class="sls-r${k} ${lit >= 0 && k <= lit ? 'is-lit' : ''}"></i>`).join('')}
    </span>`;
  };

  /** Six balls in a crate, spent left to right, coloured by what they bought. */
  const rack = shots => `<div class="sls-rack">
    ${shots.map(sh => `<span class="sls-ball ${sh.value === 0 ? 'is-miss' : sh.value >= 10 ? 'is-centre' : sh.value >= 6 ? 'is-good' : 'is-thin'}"
        title="Shot ${sh.shot}: ${sh.value}">${sealed ? '' : `<b>${sh.value || ''}</b>`}</span>`).join('')}
  </div>`;

  const strip = `<div class="sls-strip">
    <div><span class="sls-k">CRATES SPENT</span><span class="sls-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="sls-k">BEST TOTAL</span><span class="sls-v"><b>${sealed ? MASK : (shown.length ? shown[0].total : '—')}</b></span></div>
    <div class="sls-strip-r"><span class="sls-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="sls-v sls-v-txt">${sealed
    ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
    : done && winner
      ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
      : shown.length ? E(shown[0].name) : 'BANDS SLACK'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="sls-board">
    <div class="sls-board-h"><span class="sls-k">THE CARD</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="sls-board-row ${i === 0 ? 'is-lead' : ''}">
      <span class="sls-board-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="sls-board-n">${E(r.name)}</span>
      <span class="sls-board-t">${E(r.total)}</span>
    </div>`).join('') : '<p class="sls-board-e">Nobody has drawn yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="sls-card is-locked"><span class="sls-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="sls-card sls-open">
        <header class="sls-hd"><span class="sls-tag">${E(s.beat.badgeText || 'SHOTS')}</span>
          <span class="sls-sub">${fieldSize} on the line</span></header>
        <p class="sls-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('sls', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still to shoot', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('sls', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      return `<article class="sls-card sls-win">
        <header class="sls-hd"><span class="sls-tag sls-tag-gold">${E(s.beat.badgeText || (isHoh ? 'HOH' : 'VETO'))}</span>
          <span class="sls-sub">highest total</span></header>
        <div class="sls-win-b">
          <figure class="sls-win-av">${AV(winner, 72)}</figure>
          <div><div class="sls-win-n">${E(winner)}</div><p class="sls-body">${E(s.beat.text)}</p></div>
        </div>
        <p class="sls-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="sls-card sls-note">
        <header class="sls-hd"><span class="sls-tag sls-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="sls-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    const shots = bd.shots || [];
    return `<article class="sls-card sls-run ${bd.threw ? 'is-threw' : ''}">
      <header class="sls-hd">
        <span class="sls-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="sls-tag ${bd.threw ? 'sls-tag-quiet' : ''}">${sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="sls-body">${E(s.beat.text)}</p>

      <div class="sls-sightline">
        ${rack(shots)}
        <span class="sls-obstacles" aria-hidden="true">${
  Array.from({ length: 4 }, (_, k) => `<i style="animation-delay:${(k * 0.4).toFixed(1)}s"></i>`).join('')}</span>
        ${ringBoard(bd.best)}
      </div>

      <div class="sls-nums">
        <span><i>TOTAL</i><b>${sealed ? MASK : E(bd.total ?? 0)}</b></span>
        <span><i>BEST SHOT</i><b>${sealed ? MASK : E(bd.best ?? 0)}</b></span>
        <span><i>MISSED</i><b>${E(bd.misses ?? 0)}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="sls-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigsling">
  <style>
  .sigsling{--sl-ink:#eef6e6;--sl-dim:#8a9a7c;--sl-line:rgba(158,222,90,.22);
    max-width:1100px;margin:0 auto;color:var(--sl-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:radial-gradient(ellipse at 50% -18%,rgba(158,222,90,.14),transparent 60%),
      linear-gradient(180deg,#131a10,#0a0d08 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}
  .sls-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--sl-dim);text-align:center}
  .sls-title{font-family:ui-monospace,Consolas,monospace;font-weight:700;font-size:29px;letter-spacing:5px;
    text-align:center;color:#dff5c4;text-shadow:0 0 22px rgba(158,222,90,.45);margin:3px 0 2px}
  .sls-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--sl-dim);margin-bottom:13px}

  .sls-what{border:1px solid var(--sl-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(158,222,90,.05)}
  .sls-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .sls-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:${accent};border:1px solid var(--sl-line);border-radius:3px;padding:2px 7px}
  .sls-what-h b{font-size:14px;letter-spacing:1px}
  .sls-what-d{font-size:12.5px;line-height:1.6;color:#c9d8bb;margin:0}
  .sls-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .sls-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--sl-dim)}
  .sls-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(158,222,90,.16);
    text-decoration:none}
  .sls-w s b{display:block;height:100%;border-radius:2px;background:${accent}}

  .sls-strip{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px;padding:9px 11px;margin-bottom:12px;
    border:1px solid var(--sl-line);border-radius:10px;background:rgba(10,14,8,.6)}
  .sls-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--sl-dim)}
  .sls-v{display:block;margin-top:3px}
  .sls-v b{font-family:ui-monospace,Consolas,monospace;font-size:17px;color:#dff5c4}
  .sls-v i{font-style:normal;font-size:10px;color:var(--sl-dim);margin-left:4px}
  .sls-v-txt{font-size:12px;color:${accent};letter-spacing:1.2px}
  .sls-strip-r{border-left:1px solid var(--sl-line);padding-left:11px}

  .sls-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .sls-grid-sealed{display:block}
  .sls-board{position:sticky;top:56px;border:1px solid var(--sl-line);border-radius:10px;padding:9px;
    background:rgba(10,14,8,.7)}
  .sls-board-h{margin-bottom:7px}
  .sls-board-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px}
  .sls-board-row.is-lead{background:rgba(158,222,90,.12)}
  .sls-board-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--sl-dim)}
  .sls-board-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sls-board-t{font-family:ui-monospace,Consolas,monospace;color:#dff5c4}
  .sls-board-e{font-size:11px;color:var(--sl-dim);margin:0}

  .sls-card{border:1px solid var(--sl-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(24,34,18,.72),rgba(9,12,7,.8));animation:slsIn .3s ease both}
  @keyframes slsIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .sls-card.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .sls-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--sl-dim)}
  .sls-card.is-threw{opacity:.72;border-style:dashed}
  .sls-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .sls-runner{display:flex;align-items:center;gap:8px}
  .sls-runner b{font-size:13px;letter-spacing:.6px}
  .sls-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;color:${accent};
    border:1px solid var(--sl-line);background:rgba(158,222,90,.1);padding:2px 8px;border-radius:3px}
  .sls-tag-gold{color:#ffd970;border-color:rgba(255,217,112,.45);background:rgba(255,217,112,.1)}
  .sls-tag-quiet{color:var(--sl-dim);background:none}
  .sls-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--sl-dim)}
  .sls-body{font-size:13.5px;line-height:1.65;margin:0}
  .sls-flav{font-size:10.5px;color:var(--sl-dim);font-style:italic;margin:7px 0 0}

  /* the sightline: crate, obstacles, board */
  .sls-sightline{display:flex;align-items:center;gap:12px;margin:10px 0 8px;padding:8px 10px;
    border-radius:9px;background:rgba(8,12,6,.55);border:1px solid rgba(158,222,90,.14)}
  .sls-rack{display:flex;gap:4px}
  .sls-ball{width:17px;height:17px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-family:ui-monospace,Consolas,monospace;font-size:8px;color:#0c1207;
    background:rgba(158,222,90,.16);border:1px solid rgba(158,222,90,.3)}
  .sls-ball.is-miss{background:transparent;border-style:dashed;color:var(--sl-dim)}
  .sls-ball.is-thin{background:rgba(158,222,90,.42)}
  .sls-ball.is-good{background:rgba(158,222,90,.8)}
  .sls-ball.is-centre{background:#ffd970;border-color:#ffd970;box-shadow:0 0 10px rgba(255,217,112,.6)}
  .sls-obstacles{flex:1;display:flex;justify-content:space-around;align-items:flex-start;height:26px}
  .sls-obstacles i{width:2px;height:16px;border-radius:1px;background:rgba(200,214,186,.35);
    transform-origin:top center;animation:slsSway 3.4s ease-in-out infinite}
  @keyframes slsSway{50%{transform:rotate(6deg)}}
  .sls-rings{position:relative;width:38px;height:38px;flex:none}
  .sls-rings i{position:absolute;border-radius:50%;box-sizing:border-box;
    border:1px solid rgba(158,222,90,.28);transition:background .3s,box-shadow .3s}
  .sls-r0{inset:0}
  .sls-r1{inset:5px}
  .sls-r2{inset:10px}
  .sls-r3{inset:15px}
  .sls-rings i.is-lit{background:rgba(158,222,90,.25);border-color:${accent}}
  .sls-r3.is-lit{background:#ffd970;box-shadow:0 0 12px rgba(255,217,112,.75)}

  .sls-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .sls-nums span{display:flex;flex-direction:column;gap:2px}
  .sls-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--sl-dim)}
  .sls-nums b{font-family:ui-monospace,Consolas,monospace;font-size:14px;color:#dff5c4}

  .sls-win{border-color:rgba(255,217,112,.45);background:linear-gradient(180deg,rgba(60,50,16,.5),rgba(9,12,7,.85))}
  .sls-win-b{display:flex;gap:13px;align-items:flex-start}
  .sls-win-av .bb-av{border-radius:9px;border:2px solid rgba(255,217,112,.6)}
  .sls-win-n{font-family:ui-monospace,Consolas,monospace;font-size:16px;letter-spacing:2px;color:#ffd970;
    margin-bottom:4px}

  .sls-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(10,13,8,0),rgba(10,13,8,.96) 40%)}
  .sls-count,.sls-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--sl-dim)}
  .sls-done{color:${accent}}

  ${sealCss('sls', accent)}
  @media(max-width:860px){.sls-grid{grid-template-columns:1fr}.sls-board{position:static;order:-1}}
  @media(max-width:700px){
    .sls-strip{grid-template-columns:1fr 1fr}
    .sls-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--sl-line);padding:6px 0 0}
    .sls-title{font-size:22px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigsling *,.sigsling *::before,.sigsling *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="sls-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="sls-title">${E((comp.name || 'SLINGSHOT AIM').toUpperCase())}</div>
  <div class="sls-tagline">draw &middot; arc it over &middot; six balls and no more</div>

  <div class="sls-what">
    <div class="sls-what-h"><span class="sls-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Slingshot Aim')}</b></div>
    ${comp.desc ? `<p class="sls-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="sls-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="sls-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'sls-grid-sealed' : 'sls-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="sls-ctrl">
    ${done ? `<span class="sls-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE CRATES ARE EMPTY.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.sls-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Take the line' : 'Next card'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="sls-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
