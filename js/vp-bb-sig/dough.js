// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/dough.js — "The Pit"
//
// The themed screen for js/bb-comps/classics.js → Rollin' in the Dough
// (`variant: 'dough'`).
//
// Nothing is bagged and nothing is strapped on, so the only decision in this
// competition is how much to pick up — and the instrument is that decision,
// trip by trip. Each trip is a bar whose LENGTH is the armful they went in
// with: the long ones are the greedy ones, and a spilled trip is drawn full
// length and then struck out, because they carried all of it and banked none
// of it.
//
// The vault fills down the right-hand side as the trips are read. Declines
// when the trip data is missing.
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
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PHYSICAL', accent: '#d8a76a' };
  const PALETTE = '#e0b478';                       // raw dough under work lights
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
    'A big armful is worth more and drops more, and both of those are true every trip.',
    'The pit is thigh-deep and gets deeper wherever somebody has already been.',
  ];
  const WIN_FLAV = [
    'The pit gets drained. It takes longer than the competition did.',
    'A competition won by the person who was least greedy on the third trip.',
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

  /** Every trip, drawn at the length of the armful it went in with. */
  const trips = list => `<div class="dgh-trips">
    ${list.map(t => {
    const w = Math.max(10, Math.round(((t.load || 0) / biggestLoad) * 100));
    return `<div class="dgh-trip ${t.spilled ? 'is-spilled' : ''}">
        <span class="dgh-tn">${t.trip}</span>
        <span class="dgh-bar"><b style="width:${sealed ? 30 : w}%"></b></span>
        <span class="dgh-load">${sealed ? MASK : (t.spilled ? 'SPILLED' : `+${t.load}`)}</span>
      </div>`;
  }).join('')}
  </div>`;

  /** The vault, filling as the trips land. */
  const vault = bd => {
    const best = Math.max(1, ...withTrips.map(([, v]) => v.vault || 0));
    const pct = sealed ? 0 : Math.round(((bd.vault || 0) / best) * 100);
    return `<div class="dgh-vault" title="${bd.vault ?? 0} in the vault">
      <span class="dgh-vault-fill" style="height:${pct}%"></span>
      <span class="dgh-vault-n">${sealed ? MASK : (bd.vault ?? 0)}</span>
      <span class="dgh-vault-k">VAULT</span>
    </div>`;
  };

  const strip = `<div class="dgh-strip">
    <div><span class="dgh-k">VAULTS COUNTED</span><span class="dgh-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="dgh-k">FULLEST</span><span class="dgh-v"><b>${
  sealed ? MASK : (shown.length ? shown[0].vault : '—')}</b></span></div>
    <div class="dgh-strip-r"><span class="dgh-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="dgh-v dgh-v-txt">${sealed
    ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
    : done && winner
      ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
      : shown.length ? E(shown[0].name) : 'PIT UNTOUCHED'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="dgh-side">
    <div class="dgh-side-h"><span class="dgh-k">THE VAULTS</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="dgh-side-row ${i === 0 ? 'is-lead' : ''}">
      <span class="dgh-side-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="dgh-side-n">${E(r.name)}</span>
      <span class="dgh-side-t">${E(r.vault)}</span>
    </div>`).join('') : '<p class="dgh-side-e">Nobody has crossed yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="dgh-card is-locked"><span class="dgh-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="dgh-card dgh-open">
        <header class="dgh-hd"><span class="dgh-tag">${E(s.beat.badgeText || 'THE PIT')}</span>
          <span class="dgh-sub">${fieldSize} in the dough</span></header>
        <p class="dgh-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('dgh', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still wading', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('dgh', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="dgh-card dgh-win">
        <header class="dgh-hd"><span class="dgh-tag dgh-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="dgh-sub">fullest vault</span></header>
        <div class="dgh-win-b">
          <figure class="dgh-win-av">${AV(winner, 72)}</figure>
          <div><div class="dgh-win-n">${E(winner)}</div>
            <p class="dgh-body">${E(winner)} banked ${sealed ? MASK : (w.vault ?? 0)} across ${
  sealed ? MASK : (w.trips || []).length} trips${w.spills ? `, and gave ${w.spills === 1 ? 'one armful' : `${w.spills} armfuls`} back to the pit on the way` : ' without dropping a single coin'}.</p></div>
        </div>
        <p class="dgh-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="dgh-card dgh-note">
        <header class="dgh-hd"><span class="dgh-tag dgh-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="dgh-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    return `<article class="dgh-card dgh-run ${bd.threw ? 'is-threw' : ''}">
      <header class="dgh-hd">
        <span class="dgh-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="dgh-tag ${bd.threw ? 'dgh-tag-quiet' : ''} ${(bd.spills || 0) >= 2 ? 'dgh-tag-red' : ''}">${
  sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="dgh-body">${E(s.beat.text)}</p>

      <div class="dgh-run-b">
        ${trips(bd.trips || [])}
        ${vault(bd)}
      </div>

      <div class="dgh-nums">
        <span><i>IN THE VAULT</i><b>${sealed ? MASK : (bd.vault ?? 0)}</b></span>
        <span><i>TRIPS</i><b>${sealed ? MASK : (bd.trips || []).length}</b></span>
        <span><i>SPILLED</i><b>${sealed ? MASK : (bd.spills ?? 0)}</b></span>
        <span><i>BIGGEST ARMFUL</i><b>${sealed ? MASK : (bd.bestLoad ?? 0)}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="dgh-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigdgh">
  <style>
  .sigdgh{--dg-ink:#f8efe1;--dg-dim:#a3907a;--dg-line:rgba(224,180,120,.24);
    max-width:1100px;margin:0 auto;color:var(--dg-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:radial-gradient(ellipse at 50% -16%,rgba(224,180,120,.14),transparent 58%),
      linear-gradient(180deg,#1d1811,#0c0a07 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}
  .dgh-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--dg-dim);text-align:center}
  .dgh-title{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:30px;letter-spacing:3px;
    text-align:center;color:#ffe3bd;text-shadow:0 0 20px rgba(224,180,120,.42);margin:3px 0 2px}
  .dgh-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--dg-dim);margin-bottom:13px}

  .dgh-what{border:1px solid var(--dg-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(224,180,120,.05)}
  .dgh-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .dgh-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:${PALETTE};border:1px solid var(--dg-line);border-radius:3px;padding:2px 7px}
  .dgh-what-h b{font-family:Georgia,serif;font-size:15px;letter-spacing:.6px}
  .dgh-what-d{font-size:12.5px;line-height:1.6;color:#e0cfb6;margin:0}
  .dgh-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .dgh-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--dg-dim)}
  .dgh-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(224,180,120,.16);
    text-decoration:none}
  .dgh-w s b{display:block;height:100%;border-radius:2px;background:${PALETTE}}

  .dgh-strip{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px;padding:9px 11px;margin-bottom:12px;
    border:1px solid var(--dg-line);border-radius:10px;background:rgba(11,9,6,.62)}
  .dgh-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--dg-dim)}
  .dgh-v{display:block;margin-top:3px}
  .dgh-v b{font-family:Georgia,serif;font-size:18px;color:#ffe3bd}
  .dgh-v i{font-style:normal;font-size:10px;color:var(--dg-dim);margin-left:4px}
  .dgh-v-txt{font-size:12px;color:${PALETTE};letter-spacing:1.2px}
  .dgh-strip-r{border-left:1px solid var(--dg-line);padding-left:11px}

  .dgh-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .dgh-grid-sealed{display:block}
  .dgh-side{position:sticky;top:56px;border:1px solid var(--dg-line);border-radius:10px;padding:9px;
    background:rgba(11,9,6,.74)}
  .dgh-side-h{margin-bottom:7px}
  .dgh-side-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px}
  .dgh-side-row.is-lead{background:rgba(224,180,120,.13)}
  .dgh-side-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--dg-dim)}
  .dgh-side-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dgh-side-t{font-family:Georgia,serif;color:#ffe3bd}
  .dgh-side-e{font-size:11px;color:var(--dg-dim);margin:0}

  .dgh-card{border:1px solid var(--dg-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(44,34,20,.74),rgba(10,8,5,.82));animation:dghIn .3s ease both}
  @keyframes dghIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .dgh-card.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .dgh-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--dg-dim)}
  .dgh-card.is-threw{opacity:.72;border-style:dashed}
  .dgh-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .dgh-runner{display:flex;align-items:center;gap:8px}
  .dgh-runner b{font-size:13px;letter-spacing:.6px}
  .dgh-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;color:${PALETTE};
    border:1px solid var(--dg-line);background:rgba(224,180,120,.1);padding:2px 8px;border-radius:3px}
  .dgh-tag-gold{color:#ffd970;border-color:rgba(255,217,112,.45);background:rgba(255,217,112,.1)}
  .dgh-tag-red{color:#ff8a72;border-color:rgba(230,90,70,.5);background:rgba(230,90,70,.12)}
  .dgh-tag-quiet{color:var(--dg-dim);background:none}
  .dgh-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--dg-dim)}
  .dgh-body{font-size:13.5px;line-height:1.65;margin:0}
  .dgh-flav{font-size:10.5px;color:var(--dg-dim);font-style:italic;margin:7px 0 0}

  /* trips on the left at the length of the armful, vault filling on the right */
  .dgh-run-b{display:flex;gap:12px;align-items:stretch;margin:11px 0 8px;padding:10px 12px;
    border-radius:9px;background:rgba(7,6,4,.6);border:1px solid rgba(224,180,120,.13)}
  .dgh-trips{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
  .dgh-trip{display:grid;grid-template-columns:14px 1fr 58px;gap:8px;align-items:center}
  .dgh-tn{font-family:ui-monospace,Consolas,monospace;font-size:8px;color:var(--dg-dim)}
  .dgh-bar{height:9px;border-radius:5px;background:rgba(224,180,120,.1);overflow:hidden}
  .dgh-bar b{display:block;height:100%;border-radius:5px;
    background:linear-gradient(90deg,rgba(224,180,120,.55),${PALETTE})}
  .dgh-load{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:#ffe3bd;text-align:right}
  .dgh-trip.is-spilled .dgh-bar b{background:repeating-linear-gradient(45deg,
    rgba(230,90,70,.5) 0 4px,rgba(230,90,70,.2) 4px 8px)}
  .dgh-trip.is-spilled .dgh-load{color:#ff8a72;font-size:8px;letter-spacing:1px}
  .dgh-trip.is-spilled{position:relative}
  .dgh-trip.is-spilled::after{content:'';position:absolute;left:22px;right:62px;top:50%;height:1px;
    background:rgba(230,90,70,.75)}

  .dgh-vault{position:relative;width:56px;flex:none;border-radius:7px;overflow:hidden;
    border:1px solid rgba(224,180,120,.3);background:rgba(10,8,5,.7);
    display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:6px 0 5px;
    min-height:74px}
  .dgh-vault-fill{position:absolute;left:0;right:0;bottom:0;
    background:linear-gradient(180deg,${PALETTE},rgba(224,180,120,.35));transition:height .5s ease}
  .dgh-vault-n{position:relative;font-family:Georgia,serif;font-size:16px;color:#2a1f10;font-weight:700}
  .dgh-vault-k{position:relative;font-family:ui-monospace,Consolas,monospace;font-size:7px;
    letter-spacing:1.4px;color:rgba(42,31,16,.75)}

  .dgh-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .dgh-nums span{display:flex;flex-direction:column;gap:2px}
  .dgh-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--dg-dim)}
  .dgh-nums b{font-family:Georgia,serif;font-size:15px;color:#ffe3bd}

  .dgh-win{border-color:rgba(255,217,112,.45);background:linear-gradient(180deg,rgba(62,50,16,.46),rgba(10,8,5,.86))}
  .dgh-win-b{display:flex;gap:13px;align-items:flex-start}
  .dgh-win-av .bb-av{border-radius:9px;border:2px solid rgba(255,217,112,.6)}
  .dgh-win-n{font-family:Georgia,serif;font-size:18px;letter-spacing:1.4px;color:#ffd970;margin-bottom:4px}

  .dgh-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(12,10,7,0),rgba(12,10,7,.96) 40%)}
  .dgh-count,.dgh-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--dg-dim)}
  .dgh-done{color:${PALETTE}}

  ${sealCss('dgh', PALETTE)}
  @media(max-width:860px){.dgh-grid{grid-template-columns:1fr}.dgh-side{position:static;order:-1}}
  @media(max-width:700px){
    .dgh-strip{grid-template-columns:1fr 1fr}
    .dgh-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--dg-line);padding:6px 0 0}
    .dgh-title{font-size:22px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigdgh *,.sigdgh *::before,.sigdgh *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="dgh-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="dgh-title">${E((comp.name || "ROLLIN' IN THE DOUGH").toUpperCase())}</div>
  <div class="dgh-tagline">wade &middot; carry it in your arms &middot; climb the wall anyway</div>

  <div class="dgh-what">
    <div class="dgh-what-h"><span class="dgh-what-c">${E(cat.label)}</span><b>${E(comp.name || "Rollin' in the Dough")}</b></div>
    ${comp.desc ? `<p class="dgh-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="dgh-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="dgh-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'dgh-grid-sealed' : 'dgh-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="dgh-ctrl">
    ${done ? `<span class="dgh-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE PIT IS DRAINED.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.dgh-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Into the pit' : 'Next vault'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="dgh-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
