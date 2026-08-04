// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/rollerball.js — "The Cabinet"
//
// The themed screen for js/bb-comps/classics.js → Rollerball
// (`variant: 'rollerball'`).
//
// An arcade cabinet, not a scoreboard. Rollerball is a skee-ball lane with a
// nerve problem attached: the ball goes up, a pocket pays, and then somebody
// has to decide whether to stop. So the screen is built out of the two objects
// that game actually produces — a lane standing on its end, and a paper ticket
// with your run printed down it.
//
// Deliberately shares nothing with the other screens. The lane runs VERTICALLY
// up the left of every stub (nothing else in the set has a vertical
// instrument), the runs are ticket stubs on a wood cabinet rather than cards in
// a column, each one torn along a perforated edge and hung at its own slight
// angle, and the standings run along a ticket rail across the top instead of a
// sidebar down the right. Oxblood, brass and cream paper — no other screen is
// lit like this.
//
// Declines when the roll data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

// Pocket values, deep at the top of the lane. The ball has to get all the way
// up there, which is why the deep pocket is the one that ends runs.
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
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PRECISION', accent: '#d9a441' };
  const BRASS = '#d9a441';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_roll_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 29 + salt * 13 + pool.length) % pool.length];

  const RUN_FLAV = [
    'Nothing on this lane is worth anything until somebody decides to stop.',
    'The deep pocket pays nine. The ramp back down pays nothing at all.',
    'Everybody watching knows exactly when they would have banked. None of them are on the lane.',
    'The ball does not have to score. It only has to get far enough to be a choice.',
    'A running total is not a score. It is a bet nobody has settled yet.',
  ];
  const WIN_FLAV = [
    'The lane gets swept. Several people are still explaining why they went again.',
    'Won by the houseguest least interested in the deep pocket.',
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

  /**
   * The lane, standing on its end.
   *
   * Deep pockets at the top because that is the reach — the ball has to climb
   * past every cheap pocket to get there, and the height IS the risk.
   */
  const lane = (rolls, busted) => {
    const found = new Set(sealed ? [] : rolls.filter(r => !r.bust).map(r => r.value));
    const reach = sealed ? 0 : rolls.filter(r => !r.bust).length;
    return `<div class="rbl-lane ${busted ? 'is-dead' : ''}">
      <span class="rbl-pockets" aria-hidden="true">
        ${POCKETS.map(v => `<i class="${found.has(v) ? 'is-found' : ''} ${v >= 9 ? 'is-deep' : ''}"><b>${v}</b></i>`).join('')}
      </span>
      <span class="rbl-rail" aria-hidden="true">
        <s style="height:${Math.min(100, reach * 14)}%"></s>
        ${busted ? '<em class="rbl-fall"></em>' : ''}
      </span>
    </div>`;
  };

  /** The stub: one line per roll, printed down the ticket. */
  const stub = (rolls, busted) => {
    let running = 0;
    return `<div class="rbl-print ${busted ? 'is-void' : ''}">
      ${rolls.map(r => {
    if (r.bust) {
      return `<span class="rbl-row is-bust"><i>${r.roll}</i><em>BACK DOWN THE RAMP</em><b>0</b></span>`;
    }
    running += r.value;
    return `<span class="rbl-row"><i>${r.roll}</i><em>${sealed ? MASK : `pocket ${r.value}`}</em><b>${
      sealed ? MASK : running}</b></span>`;
  }).join('')}
      <span class="rbl-tear" aria-hidden="true"></span>
      <span class="rbl-total ${busted ? 'is-bust' : ''}">${
  busted ? 'VOID' : `${sealed ? MASK : running} BANKED`}</span>
    </div>`;
  };

  // The ticket rail: standings across the top, filling left to right.
  const rail = sealed ? '' : `<div class="rbl-railtop">
    <span class="rbl-railk">TICKETS IN</span>
    ${shown.length ? shown.map((r, i) => `<span class="rbl-tick ${i === 0 ? 'is-top' : ''} ${r.busted ? 'is-void' : ''}">
      ${AV(r.name, 20)}<b>${E(String(r.name).split(' ')[0])}</b><i>${r.busted ? 'VOID' : E(r.banked)}</i>
    </span>`).join('') : '<span class="rbl-railempty">nothing banked yet</span>'}
  </div>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="rbl-stub is-locked"><span class="rbl-lock">&#10063; &#10063; &#10063;</span></div>';

    if (s.kind === 'open') {
      return `<article class="rbl-stub rbl-open">
        <div class="rbl-stubbody">
          <header class="rbl-hd"><span class="rbl-tag">${E(s.beat.badgeText || 'ROLL OR BANK')}</span>
            <span class="rbl-sub">${fieldSize} on the lane</span></header>
          <p class="rbl-body">${E(s.beat.text)}</p>
        </div>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('rbl', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still to roll', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('rbl', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="rbl-stub rbl-win">
        <div class="rbl-stubbody">
          <header class="rbl-hd"><span class="rbl-tag rbl-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
            <span class="rbl-sub">highest banked</span></header>
          <div class="rbl-winb">
            <figure>${AV(winner, 66)}</figure>
            <div><div class="rbl-winn">${E(winner)}</div>
              <p class="rbl-body">${E(winner)} banked ${sealed ? MASK : E(w.banked ?? 0)}${
  w.pushes ? ` after going back to the lane ${w.pushes === 1 ? 'once' : `${w.pushes} times`} when stopping was available` : ' without ever reaching for the deep pocket'}.</p></div>
          </div>
          <p class="rbl-flav">${E(flav(WIN_FLAV, i))}</p>
        </div>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="rbl-stub rbl-note">
        <div class="rbl-stubbody">
          <header class="rbl-hd"><span class="rbl-tag rbl-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
          <p class="rbl-body">${E(s.beat.text)}</p>
        </div>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    const rolls = bd.rolls || [];
    // Every stub hangs at its own angle. Stable per name, so a replay of the
    // same week hangs them the same way.
    let h = 0;
    for (let k = 0; k < String(s.name).length; k++) h = (h * 31 + String(s.name).charCodeAt(k)) >>> 0;
    const tilt = ((h % 5) - 2) * 0.34;
    return `<article class="rbl-stub rbl-run ${bd.busted ? 'is-bust' : ''} ${bd.threw ? 'is-threw' : ''}"
        style="transform:rotate(${tilt}deg)">
      ${lane(rolls, !!bd.busted)}
      <div class="rbl-stubbody">
        <header class="rbl-hd">
          <span class="rbl-who">${AV(s.name, 30)}<b>${E(s.name)}</b></span>
          <span class="rbl-tag ${bd.busted ? 'rbl-tag-red' : ''} ${bd.threw ? 'rbl-tag-quiet' : ''}">${
  sealed ? MASK : E(s.beat.badgeText || '')}</span>
        </header>
        <p class="rbl-body">${E(s.beat.text)}</p>
        ${stub(rolls, !!bd.busted)}
        <div class="rbl-foot">
          <span>held at most <b>${sealed ? MASK : E(bd.running ?? 0)}</b></span>
          <span>went again <b>${E(bd.pushes ?? 0)}</b></span>
          ${bd.haveNot ? '<span>have-not <b>yes</b></span>' : ''}
        </div>
        <p class="rbl-flav">${E(flav(RUN_FLAV, i))}</p>
      </div>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigcab">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Cutive+Mono&family=Barlow:wght@400;500;600&display=swap');
  .sigcab{--cb-paper:#f3e6cd;--cb-ink:#2a1a12;--cb-wood:#241713;--cb-ox:#6b1f24;
    --cb-brass:${BRASS};--cb-dim:#a08a6a;
    max-width:1100px;margin:0 auto;color:var(--cb-paper);font-family:Barlow,system-ui,sans-serif;
    background:
      repeating-linear-gradient(90deg,rgba(0,0,0,.16) 0 2px,transparent 2px 7px),
      radial-gradient(ellipse at 50% 0%,#3a2018 0%,#241713 55%,#160d0a 100%);
    border-radius:12px;padding:0 0 0;position:relative;overflow:clip}

  /* the cabinet head: marquee, not a page title */
  .cb-marquee{position:relative;padding:16px 16px 13px;text-align:center;
    background:linear-gradient(180deg,var(--cb-ox),#3d1013);
    border-bottom:4px solid var(--cb-brass);
    box-shadow:inset 0 -18px 30px rgba(0,0,0,.45)}
  .cb-marquee::after{content:'';position:absolute;inset:0;pointer-events:none;
    background:repeating-linear-gradient(180deg,rgba(255,255,255,.05) 0 1px,transparent 1px 3px)}
  .cb-week{font-family:'Cutive Mono',monospace;font-size:9px;letter-spacing:3px;color:#e8b98c}
  .cb-name{font-family:'Alfa Slab One',Georgia,serif;font-size:34px;line-height:1;letter-spacing:1px;
    color:var(--cb-paper);text-shadow:0 3px 0 #3d1013,0 0 26px rgba(217,164,65,.55);margin:5px 0 4px}
  .cb-sub{font-family:'Cutive Mono',monospace;font-size:9.5px;letter-spacing:2.4px;color:#f0c98a}
  .cb-bulbs{display:flex;justify-content:center;gap:9px;margin-top:9px}
  .cb-bulbs i{width:7px;height:7px;border-radius:50%;background:var(--cb-brass);
    box-shadow:0 0 9px rgba(217,164,65,.8);animation:cbBulb 1.6s ease-in-out infinite}
  .cb-bulbs i:nth-child(2n){animation-delay:.4s}
  .cb-bulbs i:nth-child(3n){animation-delay:.8s}
  @keyframes cbBulb{50%{opacity:.25;box-shadow:none}}

  .cb-sealed{margin-top:10px;display:inline-block;font-family:'Cutive Mono',monospace;font-size:9px;
    letter-spacing:2.6px;color:#241713;background:var(--cb-brass);padding:4px 12px;border-radius:2px}
  .cb-body{padding:14px 16px 0}
  .rbl-what{border:2px solid rgba(217,164,65,.3);border-radius:4px;padding:10px 12px;margin-bottom:12px;
    background:rgba(0,0,0,.3)}
  .rbl-what b{font-family:'Alfa Slab One',Georgia,serif;font-size:14px;letter-spacing:.4px;color:var(--cb-brass)}
  .rbl-what-c{font-family:'Cutive Mono',monospace;font-size:8px;letter-spacing:2px;color:#e8b98c;
    border:1px solid rgba(217,164,65,.4);padding:2px 6px;margin-right:8px}
  .rbl-what-d{font-size:12.5px;line-height:1.6;color:#dcc9a8;margin:6px 0 0}
  .rbl-w{display:flex;flex-wrap:wrap;gap:10px;margin-top:9px}
  .rbl-w span{font-family:'Cutive Mono',monospace;font-size:8px;letter-spacing:1px;color:var(--cb-dim);
    display:flex;align-items:center;gap:5px}
  .rbl-w s{display:block;width:40px;height:6px;background:rgba(217,164,65,.16);text-decoration:none;
    border:1px solid rgba(217,164,65,.3)}
  .rbl-w s b{display:block;height:100%;background:var(--cb-brass)}

  /* standings ride a rail across the top — no sidebar anywhere on this screen */
  .rbl-railtop{display:flex;align-items:center;gap:8px;overflow-x:auto;padding:8px 10px;margin-bottom:13px;
    border-top:2px solid rgba(217,164,65,.35);border-bottom:2px solid rgba(217,164,65,.35);
    background:linear-gradient(180deg,rgba(107,31,36,.5),rgba(0,0,0,.4))}
  .rbl-railk{font-family:'Cutive Mono',monospace;font-size:8px;letter-spacing:2px;color:#e8b98c;flex:none}
  .rbl-tick{display:flex;align-items:center;gap:5px;flex:none;padding:3px 8px;border-radius:2px;
    background:var(--cb-paper);color:var(--cb-ink)}
  .rbl-tick .bb-av{border-radius:2px}
  .rbl-tick b{font-family:Barlow,sans-serif;font-size:10.5px;font-weight:600}
  .rbl-tick i{font-family:'Cutive Mono',monospace;font-style:normal;font-size:11px;color:var(--cb-ox)}
  .rbl-tick.is-top{background:var(--cb-brass);box-shadow:0 0 14px rgba(217,164,65,.6)}
  .rbl-tick.is-void{opacity:.5;text-decoration:line-through}
  .rbl-railempty{font-family:'Cutive Mono',monospace;font-size:9px;color:var(--cb-dim)}

  /* the run is a paper stub torn off the machine */
  .rbl-stub{display:flex;gap:0;margin:0 auto 13px;max-width:none;
    background:var(--cb-paper);color:var(--cb-ink);border-radius:2px;
    box-shadow:0 8px 18px rgba(0,0,0,.5);animation:cbDrop .32s ease both;
    transform-origin:50% 0%}
  @keyframes cbDrop{from{opacity:0;transform:translateY(-9px)}to{opacity:1}}
  .rbl-stub.is-locked{background:none;box-shadow:none;justify-content:center;padding:9px;opacity:.2;
    animation:none}
  .rbl-lock{font-family:'Cutive Mono',monospace;letter-spacing:6px;color:var(--cb-brass)}
  .rbl-stubbody{flex:1;min-width:0;padding:11px 13px}
  .rbl-stub.is-bust{background:#e8d5b8}
  .rbl-stub.is-threw{opacity:.75}

  /* the lane: vertical, up the left edge of the stub */
  .rbl-lane{flex:none;width:56px;display:flex;gap:5px;padding:9px 7px;
    background:linear-gradient(180deg,#2f1c14,#191009);
    border-right:3px dashed rgba(42,26,18,.35)}
  .rbl-pockets{display:flex;flex-direction:column;gap:3px;justify-content:flex-start}
  .rbl-pockets i{width:26px;height:15px;border-radius:13px 13px 0 0;box-sizing:border-box;
    border:1px solid rgba(217,164,65,.45);display:flex;align-items:center;justify-content:center;
    transition:background .3s,box-shadow .3s}
  .rbl-pockets i b{font-family:'Cutive Mono',monospace;font-size:8px;color:#a08a6a}
  .rbl-pockets i.is-found{background:rgba(217,164,65,.4)}
  .rbl-pockets i.is-found b{color:var(--cb-paper)}
  .rbl-pockets i.is-deep.is-found{background:var(--cb-brass);box-shadow:0 0 12px rgba(217,164,65,.8)}
  .rbl-pockets i.is-deep.is-found b{color:#241713}
  .rbl-rail{position:relative;flex:1;border-radius:3px;background:rgba(217,164,65,.1);overflow:hidden}
  .rbl-rail s{position:absolute;left:0;right:0;bottom:0;display:block;text-decoration:none;
    background:linear-gradient(180deg,var(--cb-brass),rgba(217,164,65,.25));transition:height .5s ease}
  .rbl-fall{position:absolute;left:0;right:0;top:0;bottom:0;
    background:repeating-linear-gradient(45deg,rgba(160,30,30,.55) 0 4px,transparent 4px 9px)}
  .rbl-lane.is-dead .rbl-rail s{background:rgba(160,30,30,.5)}

  .rbl-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .rbl-who{display:flex;align-items:center;gap:8px}
  .rbl-who .bb-av{border-radius:2px;border:1px solid rgba(42,26,18,.3)}
  .rbl-who b{font-family:'Alfa Slab One',Georgia,serif;font-size:13px;color:var(--cb-ox)}
  .rbl-tag{font-family:'Cutive Mono',monospace;font-size:8px;letter-spacing:1.6px;color:var(--cb-paper);
    background:var(--cb-ox);padding:3px 8px;border-radius:2px}
  .rbl-tag-gold{background:var(--cb-brass);color:#241713}
  .rbl-tag-red{background:#8c2018}
  .rbl-tag-quiet{background:rgba(42,26,18,.28);color:#5c4636}
  .rbl-sub{font-family:'Cutive Mono',monospace;font-size:8px;letter-spacing:1.4px;color:#7a6350}
  .rbl-body{font-size:13.5px;line-height:1.62;margin:0;color:#33231a}
  .rbl-flav{font-family:'Cutive Mono',monospace;font-size:10px;color:#7a6350;margin:8px 0 0}

  /* the printed run, in receipt type */
  .rbl-print{margin:10px 0 8px;padding:8px 0 0;border-top:1px dashed rgba(42,26,18,.3);
    font-family:'Cutive Mono',monospace}
  .rbl-row{display:grid;grid-template-columns:16px 1fr auto;gap:8px;align-items:baseline;
    font-size:11px;padding:1px 0;color:#3d2b20}
  .rbl-row i{font-style:normal;color:#8a7259}
  .rbl-row em{font-style:normal}
  .rbl-row b{font-size:12.5px;color:var(--cb-ox)}
  .rbl-row.is-bust em{color:#8c2018;letter-spacing:1.2px;font-size:9.5px}
  .rbl-row.is-bust b{color:#8c2018}
  .rbl-print.is-void .rbl-row:not(.is-bust){opacity:.4;text-decoration:line-through}
  .rbl-tear{display:block;height:7px;margin:7px -13px 0;
    background:radial-gradient(circle at 5px 0,transparent 0 4px,var(--cb-paper) 4px) repeat-x;
    background-size:10px 7px}
  .rbl-total{display:inline-block;margin-top:6px;font-family:'Alfa Slab One',Georgia,serif;font-size:15px;
    letter-spacing:.5px;color:var(--cb-ox)}
  .rbl-total.is-bust{color:#8c2018}

  .rbl-foot{display:flex;flex-wrap:wrap;gap:14px;margin-top:6px;font-family:'Cutive Mono',monospace;
    font-size:9px;letter-spacing:1px;color:#7a6350}
  .rbl-foot b{color:var(--cb-ox);font-size:11px}

  .rbl-win{background:linear-gradient(180deg,#fff3d8,var(--cb-paper))}
  .rbl-winb{display:flex;gap:12px;align-items:flex-start;margin:6px 0}
  .rbl-winb .bb-av{border-radius:2px;border:2px solid var(--cb-brass)}
  .rbl-winn{font-family:'Alfa Slab One',Georgia,serif;font-size:19px;color:var(--cb-ox);margin-bottom:3px}

  .rbl-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:9px;justify-content:center;align-items:center;
    padding:11px;margin-top:4px;
    background:linear-gradient(180deg,rgba(22,13,10,0),rgba(22,13,10,.97) 45%);
    border-top:2px solid rgba(217,164,65,.25)}
  .rbl-count,.rbl-done{font-family:'Cutive Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--cb-dim)}
  .rbl-done{color:var(--cb-brass)}

  ${sealCss('rbl', BRASS)}
  @media(max-width:700px){
    .cb-name{font-size:25px}
    .rbl-lane{width:44px}
    .rbl-pockets i{width:20px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigcab *,.sigcab *::before,.sigcab *::after{animation:none!important;transition:none!important}
    .rbl-stub{transform:none!important}
  }
  </style>

  <div class="cb-marquee">
    <div class="cb-week">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
    <div class="cb-name">${E((comp.name || 'ROLLERBALL').toUpperCase())}</div>
    <div class="cb-sub">ROLL &middot; HOLD &middot; IS THAT ENOUGH</div>
    <div class="cb-bulbs" aria-hidden="true">${Array.from({ length: 9 }, () => '<i></i>').join('')}</div>
    ${sealed ? `<div class="cb-sealed">RESULT SEALED${done ? ' — THE HOUSE NEVER FINDS OUT' : ''}</div>` : ''}
  </div>

  <div class="cb-body">
    <div class="rbl-what">
      <span class="rbl-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Rollerball')}</b>
      ${comp.desc ? `<p class="rbl-what-d">${E(comp.desc)}</p>` : ''}
      ${weights.length ? `<div class="rbl-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
      ${(comp.excluded || []).filter(Boolean).length ? `<p class="rbl-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
    </div>

    ${rail}
    ${cards}
  </div>

  <div class="rbl-ctrl">
    ${done ? `<span class="rbl-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE LANE IS SWEPT.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.rbl-stub:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Feed the machine' : 'Tear the next stub'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="rbl-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
