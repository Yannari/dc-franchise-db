// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/dough.js — "The Counting Room"
//
// The themed screen for js/bb-comps/classics.js → Rollin' in the Dough
// (`variant: 'dough'`).
//
// The pit is warm and filthy; the room the coins get counted in is neither.
// That contrast is the screen: cold stainless and mint under strip lighting,
// with the only warm thing in it being the coins themselves.
//
// Structurally it shares nothing with the other screens. There are no cards in
// a column and no sidebar: each houseguest is a full-width LEDGER ROW, read
// left to right the way a counting-room sheet is — who, then the trips laid
// out as a conveyor of armfuls, then the vault tube at the far right filling
// to what they actually banked. Each trip is drawn at the WIDTH of the armful
// they went in with, so the greedy trips are visibly the long ones, and a
// spilled trip is drawn full length and then struck through: they carried all
// of it and banked none of it.
//
// Declines when the trip data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigDough(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withTrips = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.trips) && v.trips.length);
  if (!withTrips.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PHYSICAL', accent: '#5fd6bb' };
  const MINT = '#63dcc0';
  const COIN = '#f0c04a';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_dough_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 53 + salt * 37 + pool.length) % pool.length];

  const RUN_FLAV = [
    'Nothing is bagged. Everything is carried in the arms, which is the whole competition.',
    'The wall is the slow part. Almost nobody works that out in time.',
    'Coins that go into the dough are not coming back out of it tonight.',
    'A big armful is worth more and drops more, and both are true every trip.',
    'The pit is thigh-deep and gets deeper wherever somebody has already been.',
  ];
  const WIN_FLAV = [
    'The pit gets drained. It takes longer than the competition did.',
    'Won by whoever was least greedy on the third trip.',
    'The vaults get counted out loud. One of them is nearly empty.',
    'Everybody is the same colour by the end. The totals are not.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.trips ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withTrips.length;
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
    .sort((a, b) => (b.vault ?? -1) - (a.vault ?? -1));

  const biggestLoad = Math.max(6, ...withTrips.flatMap(([, v]) => (v.trips || []).map(t => t.load || 0)));
  const bestVault = Math.max(1, ...withTrips.map(([, v]) => v.vault || 0));

  /** The conveyor: each trip at the width of the armful it went in with. */
  const conveyor = list => `<div class="dgh-belt">
    ${list.map(t => {
    const w = Math.max(9, Math.round(((t.load || 0) / biggestLoad) * 100));
    const coins = Math.max(1, Math.min(7, Math.round((t.load || 0) / 3)));
    return `<span class="dgh-trip ${t.spilled ? 'is-spilled' : ''}" style="flex:0 0 ${sealed ? 34 : w}%"
        title="Trip ${t.trip}: ${t.spilled ? 'spilled' : `${t.load} coins`}">
        <span class="dgh-stack">${Array.from({ length: sealed ? 2 : coins }, () => '<i></i>').join('')}</span>
        <span class="dgh-tlab">${sealed ? MASK : (t.spilled ? 'SPILLED' : `+${t.load}`)}</span>
      </span>`;
  }).join('')}
  </div>`;

  /** The vault tube at the end of the row, filling to what they banked. */
  const tube = bd => {
    const pct = sealed ? 0 : Math.round(((bd.vault || 0) / bestVault) * 100);
    return `<div class="dgh-tube" title="${bd.vault ?? 0} banked">
      <span class="dgh-fill" style="height:${pct}%"></span>
      <b>${sealed ? MASK : (bd.vault ?? 0)}</b>
    </div>`;
  };

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="dgh-row is-locked"><span class="dgh-lock">&#9635;&#9635;&#9635;</span></div>';

    if (s.kind === 'open') {
      return `<article class="dgh-row dgh-open">
        <div class="dgh-text"><span class="dgh-chip">${E(s.beat.badgeText || 'THE PIT')}</span>
          <p class="dgh-body">${E(s.beat.text)}</p></div>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('dgh', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still wading', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('dgh', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="dgh-row dgh-win">
        <div class="dgh-who"><figure>${AV(winner, 46)}</figure>
          <b>${E(winner)}</b><em>${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</em></div>
        <div class="dgh-text">
          <p class="dgh-body">${E(winner)} banked ${sealed ? MASK : (w.vault ?? 0)} across ${
  sealed ? MASK : (w.trips || []).length} trips${w.spills ? `, and gave ${w.spills === 1 ? 'one armful' : `${w.spills} armfuls`} back to the pit on the way` : ' without dropping a single coin'}.</p>
          <p class="dgh-flav">${E(flav(WIN_FLAV, i))}</p>
        </div>
        ${tube(w)}
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="dgh-row dgh-note">
        <div class="dgh-text"><span class="dgh-chip is-quiet">${E(s.beat.badgeText || '')}</span>
          <p class="dgh-body">${E(s.beat.text)}</p></div>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    return `<article class="dgh-row dgh-run ${(bd.spills || 0) >= 2 ? 'is-messy' : ''} ${bd.threw ? 'is-threw' : ''}">
      <div class="dgh-who">
        <figure>${AV(s.name, 40)}</figure>
        <b>${E(s.name)}</b>
        <em>${sealed ? MASK : E(s.beat.badgeText || '')}</em>
      </div>
      <div class="dgh-text">
        <p class="dgh-body">${E(s.beat.text)}</p>
        ${conveyor(bd.trips || [])}
        <div class="dgh-meta">
          <span>trips <b>${sealed ? MASK : (bd.trips || []).length}</b></span>
          <span>spilled <b>${sealed ? MASK : (bd.spills ?? 0)}</b></span>
          <span>biggest armful <b>${sealed ? MASK : (bd.bestLoad ?? 0)}</b></span>
          ${bd.haveNot ? '<span>have-not <b>yes</b></span>' : ''}
        </div>
        <p class="dgh-flav">${E(flav(RUN_FLAV, i))}</p>
      </div>
      ${tube(bd)}
    </article>`;
  }).join('');

  // The tally is a strip along the BOTTOM, above the controls — a counting
  // room reads its totals off the bench, not off a column at the side.
  const tally = sealed ? '' : `<div class="dgh-bench">
    <span class="dgh-benchk">COUNTED</span>
    ${shown.length ? shown.map((r, i) => `<span class="dgh-slot ${i === 0 ? 'is-top' : ''}">
      <i>${E(String(r.name).split(' ')[0])}</i><b>${E(r.vault)}</b></span>`).join('')
    : '<span class="dgh-benche">nothing counted yet</span>'}
  </div>`;

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigcount">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  .sigcount{--ct-steel:#c8d4d6;--ct-dim:#6f8386;--ct-line:rgba(99,220,192,.2);--ct-mint:${MINT};
    --ct-coin:${COIN};
    max-width:1100px;margin:0 auto;color:var(--ct-steel);font-family:'IBM Plex Mono',ui-monospace,monospace;
    background:
      repeating-linear-gradient(180deg,rgba(255,255,255,.022) 0 1px,transparent 1px 4px),
      linear-gradient(180deg,#16211f,#0a1211 78%);
    border-radius:12px;padding:0;position:relative;overflow:clip}

  /* strip lighting across the top of the room */
  .ct-head{position:relative;padding:15px 16px 12px;border-bottom:1px solid var(--ct-line);
    background:linear-gradient(180deg,rgba(99,220,192,.1),transparent)}
  .ct-head::before{content:'';position:absolute;left:8%;right:8%;top:0;height:2px;background:var(--ct-mint);
    box-shadow:0 0 22px 3px rgba(99,220,192,.55)}
  .ct-week{font-size:9px;letter-spacing:3px;color:var(--ct-dim)}
  .ct-name{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:35px;line-height:1;
    letter-spacing:2px;text-transform:uppercase;color:#e9f7f4;margin:3px 0 3px}
  .ct-sub{font-size:9px;letter-spacing:2.6px;color:var(--ct-mint)}

  .ct-sealed{margin-top:9px;display:inline-block;font-size:9px;letter-spacing:2.6px;color:#0a1211;
    background:var(--ct-mint);padding:4px 12px;border-radius:2px}
  .ct-body{padding:13px 16px 0}
  .dgh-what{border-left:3px solid var(--ct-mint);padding:8px 0 8px 11px;margin-bottom:13px}
  .dgh-what b{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:16px;letter-spacing:1px;
    text-transform:uppercase;color:#e9f7f4}
  .dgh-what-c{font-size:8px;letter-spacing:2px;color:var(--ct-mint);margin-right:8px}
  .dgh-what-d{font-size:12px;line-height:1.62;color:#a9bcbd;margin:5px 0 0;font-family:Inter,system-ui,sans-serif}
  .dgh-w{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}
  .dgh-w span{font-size:8px;letter-spacing:1px;color:var(--ct-dim);display:flex;align-items:center;gap:5px}
  .dgh-w s{display:block;width:40px;height:2px;background:rgba(99,220,192,.18);text-decoration:none}
  .dgh-w s b{display:block;height:100%;background:var(--ct-mint)}

  /* every run is a full-width ledger row: who | conveyor | vault tube */
  .dgh-row{display:grid;grid-template-columns:132px 1fr 46px;gap:13px;align-items:stretch;
    padding:11px 12px;margin-bottom:8px;border:1px solid var(--ct-line);border-radius:3px;
    background:linear-gradient(90deg,rgba(99,220,192,.06),rgba(10,18,17,.5) 40%);
    animation:ctSlide .3s ease both}
  @keyframes ctSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
  .dgh-row.is-locked{grid-template-columns:1fr;justify-items:center;opacity:.16;animation:none;
    background:none;border-style:dashed}
  .dgh-lock{letter-spacing:5px;color:var(--ct-dim)}
  .dgh-row.is-messy{border-color:rgba(240,120,90,.4)}
  .dgh-row.is-threw{opacity:.72}
  .dgh-open,.dgh-note{grid-template-columns:1fr}

  .dgh-who{display:flex;flex-direction:column;gap:4px;justify-content:center;
    border-right:1px solid var(--ct-line);padding-right:11px}
  .dgh-who .bb-av{border-radius:3px;border:1px solid rgba(99,220,192,.3)}
  .dgh-who b{font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:15px;letter-spacing:.6px;
    color:#e9f7f4}
  .dgh-who em{font-style:normal;font-size:7.5px;letter-spacing:1.6px;color:var(--ct-mint)}
  .dgh-text{min-width:0}
  .dgh-chip{display:inline-block;font-size:8px;letter-spacing:2px;color:var(--ct-mint);
    border:1px solid var(--ct-line);padding:2px 7px;margin-bottom:6px}
  .dgh-chip.is-quiet{color:var(--ct-dim)}
  .dgh-body{font-family:Inter,system-ui,sans-serif;font-size:13.5px;line-height:1.62;margin:0;color:#dae9e8}
  .dgh-flav{font-size:9.5px;color:var(--ct-dim);margin:7px 0 0}

  /* the conveyor of armfuls */
  .dgh-belt{display:flex;gap:4px;margin:9px 0 7px;padding:7px 8px;border-radius:3px;
    background:repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0 8px,transparent 8px 16px),
      rgba(6,12,11,.55);border:1px solid rgba(99,220,192,.12)}
  .dgh-trip{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;
    padding:5px 2px;border-radius:2px;background:rgba(99,220,192,.07);min-width:0}
  .dgh-stack{display:flex;gap:1px;align-items:flex-end;height:14px}
  .dgh-stack i{width:5px;height:5px;border-radius:50%;background:var(--ct-coin);
    box-shadow:0 0 5px rgba(240,192,74,.5)}
  .dgh-tlab{font-size:8px;letter-spacing:.6px;color:#cfe0df;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;max-width:100%}
  .dgh-trip.is-spilled{background:rgba(240,120,90,.12)}
  .dgh-trip.is-spilled .dgh-stack i{background:#6f5a3a;box-shadow:none}
  .dgh-trip.is-spilled .dgh-tlab{color:#ff9b7f}
  .dgh-trip.is-spilled::after{content:'';position:absolute;left:4px;right:4px;top:50%;height:1px;
    background:#ff7b5c}

  .dgh-meta{display:flex;flex-wrap:wrap;gap:13px;font-size:8.5px;letter-spacing:1px;color:var(--ct-dim)}
  .dgh-meta b{color:#e9f7f4;font-size:11px}

  /* the vault tube at the end of the row */
  .dgh-tube{position:relative;border-radius:3px;overflow:hidden;border:1px solid rgba(240,192,74,.35);
    background:rgba(6,12,11,.7);display:flex;align-items:flex-end;justify-content:center;min-height:64px}
  .dgh-fill{position:absolute;left:0;right:0;bottom:0;transition:height .55s ease;
    background:linear-gradient(180deg,var(--ct-coin),rgba(240,192,74,.35))}
  .dgh-tube b{position:relative;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;
    color:#241c07;padding-bottom:3px}

  .dgh-win{border-color:rgba(240,192,74,.5);
    background:linear-gradient(90deg,rgba(240,192,74,.12),rgba(10,18,17,.55) 45%)}
  .dgh-win .dgh-who em{color:var(--ct-coin)}

  /* totals along the bench, not down a sidebar */
  .dgh-bench{display:flex;align-items:center;gap:7px;overflow-x:auto;margin:12px 0 0;padding:8px 10px;
    border-top:1px solid var(--ct-line);background:rgba(99,220,192,.05)}
  .dgh-benchk{font-size:8px;letter-spacing:2px;color:var(--ct-dim);flex:none}
  .dgh-slot{flex:none;display:flex;flex-direction:column;align-items:center;gap:1px;padding:3px 9px;
    border-radius:2px;background:rgba(6,12,11,.6);border:1px solid var(--ct-line)}
  .dgh-slot i{font-style:normal;font-size:8px;color:var(--ct-dim)}
  .dgh-slot b{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;color:#e9f7f4}
  .dgh-slot.is-top{border-color:var(--ct-coin)}
  .dgh-slot.is-top b{color:var(--ct-coin)}
  .dgh-benche{font-size:9px;color:var(--ct-dim)}

  .dgh-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:9px;justify-content:center;align-items:center;
    padding:11px;background:linear-gradient(180deg,rgba(10,18,17,0),rgba(10,18,17,.97) 45%)}
  .dgh-count,.dgh-done{font-size:9px;letter-spacing:2px;color:var(--ct-dim)}
  .dgh-done{color:var(--ct-mint)}

  ${sealCss('dgh', MINT)}
  @media(max-width:700px){
    .ct-name{font-size:25px}
    .dgh-row{grid-template-columns:1fr;gap:9px}
    .dgh-who{flex-direction:row;align-items:center;border-right:0;padding-right:0;
      border-bottom:1px solid var(--ct-line);padding-bottom:7px}
    .dgh-tube{min-height:34px;flex-direction:row}
  }
  @media(prefers-reduced-motion:reduce){
    .sigcount *,.sigcount *::before,.sigcount *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="ct-head">
    <div class="ct-week">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
    <div class="ct-name">${E(comp.name || "Rollin' in the Dough")}</div>
    <div class="ct-sub">WADE &middot; CARRY IT IN YOUR ARMS &middot; CLIMB THE WALL ANYWAY</div>
    ${sealed ? `<div class="ct-sealed">RESULT SEALED${done ? ' — THE HOUSE NEVER FINDS OUT' : ''}</div>` : ''}
  </div>

  <div class="ct-body">
    <div class="dgh-what">
      <span class="dgh-what-c">${E(cat.label)}</span><b>${E(comp.name || "Rollin' in the Dough")}</b>
      ${comp.desc ? `<p class="dgh-what-d">${E(comp.desc)}</p>` : ''}
      ${weights.length ? `<div class="dgh-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
      ${(comp.excluded || []).filter(Boolean).length ? `<p class="dgh-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
    </div>

    ${cards}
    ${tally}
  </div>

  <div class="dgh-ctrl">
    ${done ? `<span class="dgh-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE PIT IS DRAINED.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.dgh-row:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Open the room' : 'Count the next'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="dgh-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
