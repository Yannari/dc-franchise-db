// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/in-the-balance.js — "The Rig"
//
// The themed screen for js/bb-comps/classics.js → In The Balance
// (`variant: 'balance'`).
//
// A scaffold in the yard: a long board on a steel fulcrum, a heavy ball in a
// channel running its length, and a crew loosening the pivot on a schedule
// whether anybody is ready or not.
//
// Every run is a BAY of that scaffold, drawn as a side elevation — upright
// posts, a bolted cross-brace, the board tipped by however far into the
// loosenings they got, and the ball sitting where their run ended: in the
// scoring zone if they still had it, run off the low end if they did not. The
// loosening schedule is a column of collars down the upright, stamped off one
// at a time, so a run's height on the post IS its time.
//
// Steel grey and hazard yellow, with a scaffold-tape header. Nothing soft, no
// cards, no serif — the whole screen is site equipment.
//
// Declines when the stage data is missing.
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
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PRECISION', accent: '#ffc531' };
  const HAZARD = '#ffc531';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_bal_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 31 + salt * 17 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The crew loosens the pivot whether anybody is ready for it or not.',
    'Standing still is work. It only looks like the absence of work.',
    'The zone is four inches wide and the channel is the length of the board.',
    'Nobody has ever lost this quickly. Everybody loses it eventually.',
    'Correcting ends most runs. Not correcting ends the rest.',
  ];
  const WIN_FLAV = [
    'The boards get bolted off. Several people are still shaking out their calves.',
    'Won by not doing anything, extremely well, for a long time.',
    'The ball gets lifted out of the channel by hand — the only easy thing all night.',
    'Nobody out-balanced anybody by much. One person twitched last.',
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

  /** A bay of the scaffold: posts, brace, tipped board, ball where it ended. */
  const bay = bd => {
    const stage = Math.max(0, Math.min(STAGES, bd.stage || 0));
    const held = stage >= 5;
    const tilt = sealed ? 0 : (held ? 0 : 2.4 + stage * 2.3);
    const pos = sealed ? 50 : held ? 50 : Math.min(95, 52 + stage * 7 + 10);
    return `<div class="bal-bay">
      <span class="bal-post" aria-hidden="true">
        ${Array.from({ length: STAGES }, (_, k) =>
    `<i class="${!sealed && k < stage ? 'is-off' : ''}"></i>`).join('')}
      </span>
      <span class="bal-deck" aria-hidden="true">
        <span class="bal-beam" style="transform:rotate(${tilt}deg)">
          <em class="bal-zone"></em>
          <em class="bal-ball ${held ? 'is-held' : 'is-lost'}" style="left:${pos}%"></em>
        </span>
        <span class="bal-fulcrum"></span>
        <span class="bal-brace"></span>
      </span>
    </div>`;
  };

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="bal-slot is-shut"><span class="bal-shut">BAY CLOSED</span></div>';

    if (s.kind === 'open') {
      return `<article class="bal-slot bal-notice">
        <span class="bal-noticek">${E(s.beat.badgeText || 'THE BOARD')}</span>
        <p class="bal-body">${E(s.beat.text)}</p>
        <span class="bal-crew">${fieldSize} ON THE PIVOTS</span>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('bal', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still on the board', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('bal', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="bal-slot bal-won">
        <div class="bal-id">${AV(winner, 50)}<span><b>${E(winner)}</b>
          <em>${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</em></span></div>
        <p class="bal-body">${E(winner)} held the zone for ${sealed ? MASK : `${Math.round(w.seconds || 0)} seconds`},
          through ${sealed ? MASK : (w.stage || 0)} of the ${STAGES} loosenings.</p>
        <p class="bal-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'margin' || s.kind === 'note') {
      return `<article class="bal-slot bal-notice">
        <span class="bal-noticek">${E(s.beat.badgeText || '')}</span>
        <p class="bal-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    return `<article class="bal-slot bal-run ${bd.threw ? 'is-threw' : ''}">
      <div class="bal-id">${AV(s.name, 38)}<span><b>${E(s.name)}</b>
        <em>${sealed ? MASK : E(s.beat.badgeText || '')}</em></span></div>
      ${bay(bd)}
      <div class="bal-read">
        <span class="bal-clock">${sealed ? MASK : `${Math.round(bd.seconds || 0)}s`}</span>
        <span class="bal-stage">${sealed ? MASK : `${bd.stage || 0}/${STAGES}`} LOOSENINGS</span>
        ${bd.haveNot ? '<span class="bal-hn">HAVE-NOT</span>' : ''}
      </div>
      <p class="bal-body">${E(s.beat.text)}</p>
      <p class="bal-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigrig">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500&display=swap');
  .sigrig{--rg2-steel:#8f9aa4;--rg2-dark:#4a545c;--rg2-haz:${HAZARD};--rg2-dim:#6d7880;
    max-width:1100px;margin:0 auto;color:#dfe6ec;font-family:Inter,system-ui,sans-serif;
    background:linear-gradient(180deg,#20262b,#12171a 84%);
    padding:0;position:relative;overflow:clip}

  /* scaffold tape across the top */
  .rig-tape{height:14px;background:repeating-linear-gradient(45deg,
    var(--rg2-haz) 0 14px,#20262b 14px 28px)}
  .rig-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;
    padding:13px 16px 11px;border-bottom:2px solid var(--rg2-dark)}
  .rig-week{font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:2.8px;color:var(--rg2-dim)}
  .rig-name{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:37px;line-height:1;
    letter-spacing:1.4px;text-transform:uppercase;color:#eef4f8;margin:1px 0 0}
  .rig-plate{font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:2px;
    color:#1b2024;background:var(--rg2-haz);padding:4px 10px;text-align:right}
  .rig-sealed{margin-top:8px;display:inline-block;font-family:'Barlow Condensed',sans-serif;font-size:11px;
    letter-spacing:2.4px;color:#1b2024;background:var(--rg2-haz);padding:2px 11px}

  .rig-body{padding:12px 16px 0}
  .bal-spec{border:1px solid var(--rg2-dark);border-left:4px solid var(--rg2-haz);padding:9px 12px;
    margin-bottom:12px;background:rgba(143,154,164,.07)}
  .bal-spec b{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:16px;letter-spacing:1px;
    text-transform:uppercase;color:#eef4f8}
  .bal-spec-c{font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:2px;
    color:var(--rg2-haz);margin-right:8px}
  .bal-spec-d{font-size:12.5px;line-height:1.6;color:#b9c4cc;margin:5px 0 0}
  .bal-w{display:flex;flex-wrap:wrap;gap:11px;margin-top:8px}
  .bal-w span{font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:1px;
    color:var(--rg2-dim);display:flex;align-items:center;gap:5px}
  .bal-w s{display:block;width:38px;height:6px;background:rgba(143,154,164,.18);text-decoration:none}
  .bal-w s b{display:block;height:100%;background:var(--rg2-haz)}

  /* each run is a bay of the scaffold */
  .bal-slot{position:relative;padding:11px 13px;margin-bottom:10px;
    border:1px solid var(--rg2-dark);background:rgba(143,154,164,.05);
    animation:rigSet .28s ease both}
  @keyframes rigSet{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .bal-slot.is-shut{border-style:dashed;opacity:.2;text-align:center;animation:none}
  .bal-shut{font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:3px;color:var(--rg2-dim)}
  .bal-slot.is-threw{opacity:.68}
  .bal-id{display:flex;align-items:center;gap:9px;margin-bottom:9px}
  .bal-id .bb-av{border-radius:0;border:2px solid var(--rg2-steel)}
  .bal-id b{display:block;font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:16px;
    letter-spacing:.6px;color:#eef4f8}
  .bal-id em{font-style:normal;font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:1.8px;
    color:var(--rg2-haz)}
  .bal-body{font-size:13.5px;line-height:1.62;margin:0;color:#dbe4ea}
  .bal-flav{font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:.5px;
    color:var(--rg2-dim);margin:7px 0 0}
  .bal-notice{border-left:4px solid var(--rg2-steel)}
  .bal-noticek{display:inline-block;font-family:'Barlow Condensed',sans-serif;font-size:10px;
    letter-spacing:2.2px;color:var(--rg2-haz);margin-bottom:5px}
  .bal-crew{display:block;margin-top:6px;font-family:'Barlow Condensed',sans-serif;font-size:10px;
    letter-spacing:2px;color:var(--rg2-dim)}

  /* the bay: loosening post beside a tipped board on a fulcrum */
  .bal-bay{display:flex;align-items:stretch;gap:12px;margin:4px 0 9px;padding:10px 12px 16px;
    background:repeating-linear-gradient(90deg,rgba(143,154,164,.05) 0 3px,transparent 3px 9px),
      rgba(18,23,26,.6);border:1px solid rgba(143,154,164,.18)}
  .bal-post{flex:none;width:16px;display:flex;flex-direction:column-reverse;justify-content:flex-start;
    gap:4px;padding:2px;background:linear-gradient(90deg,var(--rg2-dark),#39424a)}
  .bal-post i{height:6px;background:var(--rg2-steel);transition:background .35s}
  .bal-post i.is-off{background:var(--rg2-haz);box-shadow:0 0 8px rgba(255,197,49,.55)}
  .bal-deck{position:relative;flex:1;min-height:52px}
  .bal-beam{position:absolute;left:0;right:0;top:16px;height:10px;
    background:linear-gradient(180deg,var(--rg2-steel),var(--rg2-dark));
    transform-origin:50% 50%;transition:transform .45s ease}
  .bal-zone{position:absolute;left:45%;width:10%;top:-3px;bottom:-3px;
    border:1px solid var(--rg2-haz);background:rgba(255,197,49,.18)}
  .bal-ball{position:absolute;top:-5px;width:16px;height:16px;border-radius:50%;
    transform:translateX(-50%);transition:left .5s ease}
  .bal-ball.is-held{background:var(--rg2-haz);box-shadow:0 0 13px rgba(255,197,49,.7)}
  .bal-ball.is-lost{background:#5d666e;box-shadow:none}
  .bal-fulcrum{position:absolute;left:50%;top:26px;width:0;height:0;transform:translateX(-50%);
    border-left:11px solid transparent;border-right:11px solid transparent;
    border-bottom:17px solid var(--rg2-steel)}
  .bal-brace{position:absolute;left:6%;right:6%;bottom:0;height:3px;background:var(--rg2-dark)}

  .bal-read{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px}
  .bal-clock{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:26px;color:var(--rg2-haz)}
  .bal-stage,.bal-hn{font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:1.8px;
    color:var(--rg2-dim)}
  .bal-hn{color:#1b2024;background:var(--rg2-steel);padding:1px 7px}
  .bal-won{border-left:4px solid var(--rg2-haz);background:rgba(255,197,49,.09)}

  .bal-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:9px;justify-content:center;align-items:center;
    padding:11px;background:linear-gradient(180deg,rgba(18,23,26,0),rgba(18,23,26,.97) 45%);
    border-top:2px solid var(--rg2-dark)}
  .bal-count,.bal-done{font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:2px;
    color:var(--rg2-dim)}
  .bal-done{color:var(--rg2-haz)}

  ${sealCss('bal', HAZARD)}
  @media(max-width:700px){.rig-name{font-size:26px}}
  @media(prefers-reduced-motion:reduce){
    .sigrig *,.sigrig *::before,.sigrig *::after{animation:none!important;transition:none!important}
    .bal-beam{transform:none!important}
  }
  </style>

  <div class="rig-tape" aria-hidden="true"></div>
  <div class="rig-head">
    <div>
      <div class="rig-week">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
      <div class="rig-name">${E((comp.name || 'IN THE BALANCE').toUpperCase())}</div>
      ${sealed ? `<div class="rig-sealed">RESULT SEALED${done ? ' — THE HOUSE NEVER FINDS OUT' : ''}</div>` : ''}
    </div>
    <div class="rig-plate">ONE BOARD &middot; ONE BALL<br>PIVOT LOOSENED &times;${STAGES}</div>
  </div>

  <div class="rig-body">
    <div class="bal-spec">
      <span class="bal-spec-c">${E(cat.label)}</span><b>${E(comp.name || 'In The Balance')}</b>
      ${comp.desc ? `<p class="bal-spec-d">${E(comp.desc)}</p>` : ''}
      ${weights.length ? `<div class="bal-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
      ${(comp.excluded || []).filter(Boolean).length ? `<p class="bal-spec-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
    </div>
    ${cards}
  </div>

  <div class="bal-ctrl">
    ${done ? `<span class="bal-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE BOARDS ARE BOLTED OFF.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.bal-slot:not(.is-shut)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Loosen the pivot' : 'Open the next bay'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="bal-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
