// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/bowlerina.js — "The Spin Room"
//
// The themed screen for js/bb-comps/bowlerina.js (`variant: 'precision'`).
//
// Every houseguest gets a lane: five frames drawn as pin clusters that light up
// by what the roll was worth, with a dizziness trace running underneath. The
// image the competition lives on is somebody letting go of the bars while the
// room is still turning, so the card tilts as the dizziness climbs — the later
// frames physically lean.
//
// Narration comes from the competition's beats; the frame cards come from
// breakdown[name].card. Declines when the card is missing, so a season saved
// under the old single-roll comp — same variant tag — falls through to the
// generic board.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const PIN_MAX = 8;

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigBowlerina(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withCards = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.card) && v.card.length);
  if (!withCards.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PRECISION', accent: '#26c6da' };
  // The category accent is chosen for the generic board and clashes with this
  // screen's palette; the category chip keeps it, everything else uses the cyan the spin room is lit in.
  const accent = '#26c6da';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_bowl_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 19 + salt * 7 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The barrier comes back up before anybody has finished being upright.',
    'Five frames is not many until you have to spin between all of them.',
    'The pins never move. That is the only fixed point in the entire competition.',
    'Nobody watching can tell whose lane is whose until the ball lands.',
    'The far targets pay triple and sit exactly where the room is blurriest.',
  ];
  const WIN_FLAV = [
    'Nobody wins this by being strong. It goes to whoever the room stops spinning for first.',
    'The bars get wiped down. Half the yard is still sitting on the mats.',
    'A competition decided entirely by who could stand still, won by somebody who could not.',
    'The pins get reset for nobody. It is over.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    const tag = String(b.badgeText || '').toUpperCase().trim();
    if (tag === 'THE MARGIN' || tag === 'COUNTBACK') { steps.push({ kind: 'margin', beat: b, countback: tag === 'COUNTBACK' }); return; }
    if (b.badgeClass === 'gold' || tag === 'HOH' || tag === 'VETO') { steps.push({ kind: 'win', beat: b }); return; }
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.card ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withCards.length;

  // Sealed: the card total IS the result, so totals are masked below and the
  // feed cuts partway through the field — the cards nobody saw are what keeps
  // the top score unknowable.
  if (sealed) {
    const keep = planSeal(steps, {
      countKind: 'run', cap: Math.max(2, Math.ceil(fieldSize / 2)),
      isResult: st => st.kind === 'margin' || st.kind === 'win',
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

  /** A frame drawn as its pin cluster: lit pins = what the roll was worth. */
  const frameCell = f => {
    // Sealed: the pins and the frame number are the score, frame by frame.
    const lit = sealed ? 0 : Math.round((f.value / PIN_MAX) * 6);
    const tilt = Math.min(9, Math.round((f.dizzy || 0) * 3));
    return `<div class="bwl-frame ${f.value === 0 ? 'is-gutter' : ''} ${f.value >= 5 ? 'is-big' : ''} ${f.fell ? 'is-fell' : ''}"
         style="transform:rotate(${tilt}deg)" title="Frame ${f.frame}: ${f.value} — dizziness ${f.dizzy}">
      <span class="bwl-pins">
        ${Array.from({ length: 6 }, (_, k) => `<i class="${k < lit ? 'is-lit' : ''}"></i>`).join('')}
      </span>
      <span class="bwl-frame-v">${sealed ? '?' : f.value}</span>
      <span class="bwl-frame-n">${f.frame}</span>
    </div>`;
  };

  const strip = `<div class="bwl-strip">
    <div><span class="bwl-k">CARDS IN</span><span class="bwl-v"><b>${shown.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="bwl-k">TOP SCORE</span><span class="bwl-v"><b>${sealed ? MASK : (shown.length ? shown[0].total : '—')}</b></span></div>
    <div class="bwl-strip-r"><span class="bwl-k">${sealed || done ? 'RESULT' : 'LEADER'}</span>
      <span class="bwl-v bwl-v-txt">${sealed
        ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
        : done && winner
          ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
          : shown.length ? E(shown[0].name) : 'BARS UP'}</span></div>
  </div>`;

  const boardHtml = sealed ? '' : `<aside class="bwl-board">
    <div class="bwl-board-h"><span class="bwl-k">THE CARD</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="bwl-board-row ${i === 0 ? 'is-lead' : ''}">
      <span class="bwl-board-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="bwl-board-n">${E(r.name)}</span>
      <span class="bwl-board-t">${E(r.total)}</span>
    </div>`).join('') : '<p class="bwl-board-e">Nobody has rolled yet.</p>'}
  </aside>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return `<div class="bwl-card is-locked"><span class="bwl-lock">◦ ◦ ◦</span></div>`;

    if (s.kind === 'open') {
      return `<article class="bwl-card bwl-open">
        <header class="bwl-hd"><span class="bwl-tag">${E(s.beat.badgeText || 'FRAMES')}</span>
          <span class="bwl-sub">${fieldSize} on the bars</span></header>
        <p class="bwl-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('bwl', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still to take the bars', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('bwl', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      return `<article class="bwl-card bwl-win">
        <header class="bwl-hd"><span class="bwl-tag bwl-tag-gold">${E(s.beat.badgeText || (isHoh ? 'HOH' : 'VETO'))}</span>
          <span class="bwl-sub">highest card</span></header>
        <div class="bwl-win-b">
          <figure class="bwl-win-av">${AV(winner, 72)}</figure>
          <div><div class="bwl-win-n">${E(winner)}</div><p class="bwl-body">${E(s.beat.text)}</p></div>
        </div>
        <p class="bwl-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'margin' || s.kind === 'note') {
      return `<article class="bwl-card bwl-note">
        <header class="bwl-hd"><span class="bwl-tag bwl-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="bwl-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    const card = bd.card || [];
    const peakDizzy = card.reduce((m, f) => Math.max(m, f.dizzy || 0), 0);
    return `<article class="bwl-card bwl-run ${bd.collapsed ? 'is-down' : ''} ${bd.threw ? 'is-threw' : ''}">
      <header class="bwl-hd">
        <span class="bwl-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="bwl-tag ${bd.threw ? 'bwl-tag-quiet' : ''}">${sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="bwl-body">${E(s.beat.text)}</p>

      <div class="bwl-lane">${card.map(frameCell).join('')}</div>

      <div class="bwl-dizzy">
        <span class="bwl-k">DIZZINESS</span>
        <span class="bwl-dizzy-bar">${card.map(f =>
          `<i style="height:${Math.max(3, Math.round((f.dizzy || 0) / 3 * 22))}px"></i>`).join('')}</span>
        <span class="bwl-dizzy-v">peak ${Math.round(peakDizzy * 10) / 10}</span>
      </div>

      <div class="bwl-nums">
        <span><i>TOTAL</i><b>${sealed ? MASK : E(bd.total ?? 0)}</b></span>
        <span><i>BEST FRAME</i><b>${sealed ? MASK : E(bd.best ?? 0)}</b></span>
        <span><i>GUTTERS</i><b>${E(bd.gutters ?? 0)}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="bwl-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((x, y) => y[1] - x[1]).slice(0, 4);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigbowl">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:wght@400;500;600&display=swap');
  .sigbowl{--bw-ink:#eaf7f9;--bw-dim:#84a3aa;--bw-line:rgba(38,198,218,.26);
    max-width:1100px;margin:0 auto;font-family:Rubik,system-ui,sans-serif;color:var(--bw-ink);
    background:radial-gradient(120% 85% at 50% -12%,#123a42 0%,#0a2029 52%,#040d12 100%);
    border-radius:12px;padding:18px 16px 0;position:relative;overflow:hidden}
  .sigbowl::before{content:'';position:absolute;inset:46px 0 0;pointer-events:none;
    background:conic-gradient(from 0deg at 50% 40%,transparent 0deg,rgba(38,198,218,.07) 40deg,transparent 80deg,
      rgba(38,198,218,.07) 120deg,transparent 160deg);animation:bwl-spin 22s linear infinite}
  @keyframes bwl-spin{to{transform:rotate(360deg)}}

  .bwl-eyebrow{font-family:Rubik,sans-serif;font-size:10px;letter-spacing:4px;color:var(--bw-dim);text-align:center}
  .bwl-title{font-family:Bungee,cursive;font-size:32px;letter-spacing:2px;text-align:center;color:#dffbff;
    text-shadow:0 0 24px ${accent}99;margin:3px 0}
  .bwl-tagline{text-align:center;font-size:11.5px;letter-spacing:2px;color:var(--bw-dim);margin-bottom:12px}

  .bwl-what{border:1px solid var(--bw-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:linear-gradient(180deg,rgba(18,58,66,.6),rgba(6,18,24,.6))}
  .bwl-what-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:15px;font-weight:600}
  .bwl-what-c{font-size:9px;letter-spacing:2px;border:1px solid ${cat.accent||accent}66;color:${cat.accent||accent};padding:2px 6px;border-radius:3px}
  .bwl-what-d{font-size:13px;line-height:1.55;color:var(--bw-dim);margin:6px 0 0}
  .bwl-w{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
  .bwl-w span{display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:1.2px;color:var(--bw-dim);text-transform:uppercase}
  .bwl-w s{text-decoration:none;display:inline-block;width:50px;height:4px;border-radius:2px;background:rgba(255,255,255,.1)}
  .bwl-w s b{display:block;height:100%;border-radius:2px;background:${accent}}

  .bwl-k{font-size:9px;letter-spacing:2.2px;color:var(--bw-dim)}
  .bwl-strip{position:sticky;top:46px;z-index:6;display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:8px;
    padding:8px 10px;margin-bottom:14px;border:1px solid var(--bw-line);border-radius:8px;
    background:rgba(4,14,19,.95);backdrop-filter:blur(4px)}
  .bwl-strip>div{display:flex;flex-direction:column;gap:2px;min-width:0}
  .bwl-strip-r{border-left:1px solid var(--bw-line);padding-left:10px}
  .bwl-v{font-family:Bungee,cursive;font-size:19px;display:flex;align-items:baseline;gap:5px}
  .bwl-v b{color:${accent}}.bwl-v i{font-style:normal;font-size:11px;color:var(--bw-dim);font-family:Rubik,sans-serif}
  .bwl-v-txt{font-family:Rubik,sans-serif;font-size:12.5px;letter-spacing:1.2px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  .bwl-grid{display:grid;grid-template-columns:1fr 230px;gap:12px;align-items:start}
  .bwl-board{position:sticky;top:118px;border:1px solid var(--bw-line);border-radius:10px;padding:10px;
    background:linear-gradient(180deg,rgba(16,52,60,.75),rgba(5,15,20,.8))}
  .bwl-board-h{margin-bottom:7px}
  .bwl-board-e{font-size:12px;color:var(--bw-dim);margin:0;font-style:italic}
  .bwl-board-row{display:grid;grid-template-columns:22px 24px 1fr auto;gap:6px;align-items:center;
    padding:5px 4px;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px}
  .bwl-board-row .bb-av{border-radius:50%}
  .bwl-board-p{font-size:10px;color:var(--bw-dim)}
  .bwl-board-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .bwl-board-t{font-family:Bungee,cursive;color:#e6feff}
  .bwl-board-row.is-lead{background:${accent}16;border-radius:6px}
  .bwl-board-row.is-lead .bwl-board-t{color:${accent}}

  .bwl-card{border:1px solid var(--bw-line);border-radius:10px;padding:12px 13px;margin-bottom:10px;
    background:linear-gradient(180deg,rgba(14,48,56,.72),rgba(5,15,20,.8));animation:bwl-in .32s cubic-bezier(.2,.8,.25,1) both}
  @keyframes bwl-in{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
  .bwl-card.is-locked{padding:8px;text-align:center;opacity:.13;animation:none;background:none}
  .bwl-lock{letter-spacing:5px;color:var(--bw-dim)}
  .bwl-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
  .bwl-sub{font-size:9px;letter-spacing:2px;color:var(--bw-dim)}
  .bwl-tag{font-size:10px;letter-spacing:1.8px;color:${accent};border:1px solid ${accent}55;
    background:${accent}14;padding:2px 8px;border-radius:3px}
  .bwl-tag-gold{color:#ffd970;border-color:#ffd97066;background:#ffd97018}
  .bwl-tag-quiet{color:#93a9ae;border-color:#93a9ae44;background:#93a9ae11}
  .bwl-body{font-size:14px;line-height:1.62;margin:0}
  .bwl-flav{margin:9px 0 0;padding-top:7px;border-top:1px dashed rgba(120,180,195,.18);font-size:12px;color:#7f989e;font-style:italic}
  .bwl-runner{display:flex;align-items:center;gap:8px;font-size:14px}
  .bwl-runner .bb-av{border-radius:7px;border:2px solid ${accent}66}

  /* Frames tilt with the dizziness they were rolled under. */
  .bwl-lane{display:flex;gap:9px;flex-wrap:wrap;margin:11px 0 9px;padding:10px 8px;border-radius:8px;
    background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.05)}
  .bwl-frame{position:relative;width:52px;padding:7px 4px 4px;border-radius:7px;text-align:center;
    background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);transition:transform .3s ease}
  .bwl-pins{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;justify-items:center;margin-bottom:4px}
  .bwl-pins i{display:block;width:7px;height:11px;border-radius:3px 3px 1px 1px;background:rgba(255,255,255,.13)}
  .bwl-pins i.is-lit{background:linear-gradient(180deg,#fff,${accent});box-shadow:0 0 7px ${accent}88}
  .bwl-frame-v{display:block;font-family:Bungee,cursive;font-size:15px;color:#e9feff}
  .bwl-frame-n{position:absolute;top:-6px;left:-5px;font-size:8px;background:${accent};color:#04222a;border-radius:3px;padding:0 4px}
  .bwl-frame.is-gutter{border-color:rgba(255,138,128,.4);background:rgba(255,138,128,.07)}
  .bwl-frame.is-gutter .bwl-frame-v{color:#ff9d94}
  .bwl-frame.is-big{border-color:${accent}88;box-shadow:0 0 14px ${accent}33}
  .bwl-frame.is-fell{border-style:dashed;opacity:.85}
  .bwl-frame.is-fell::after{content:'DOWN';position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);
    font-size:7px;letter-spacing:1px;background:#ff8a80;color:#2a0d0b;border-radius:2px;padding:0 3px}

  .bwl-dizzy{display:flex;align-items:center;gap:9px;margin-bottom:9px}
  .bwl-dizzy-bar{display:flex;align-items:flex-end;gap:3px;height:24px}
  .bwl-dizzy-bar i{display:block;width:10px;border-radius:2px 2px 0 0;background:linear-gradient(180deg,#ff9d4d,#a33)}
  .bwl-dizzy-v{font-size:10px;color:var(--bw-dim)}

  .bwl-nums{display:flex;gap:14px;flex-wrap:wrap}
  .bwl-nums span{display:flex;flex-direction:column;gap:1px}
  .bwl-nums i{font-style:normal;font-size:8.5px;letter-spacing:1.8px;color:var(--bw-dim)}
  .bwl-nums b{font-family:Bungee,cursive;font-size:15px;color:#e9feff}
  .bwl-run.is-down{border-color:rgba(255,157,77,.4)}
  .bwl-run.is-threw{border-style:dashed;opacity:.92}

  .bwl-win{border-color:rgba(255,217,112,.5);background:linear-gradient(180deg,rgba(66,52,16,.5),rgba(5,15,20,.85))}
  .bwl-win-b{display:flex;gap:14px;align-items:center}
  .bwl-win-av .bb-av{border-radius:10px;border:3px solid #ffd970;box-shadow:0 0 26px rgba(255,217,112,.5)}
  .bwl-win-n{font-family:Bungee,cursive;font-size:22px;color:#ffeab6;margin-bottom:4px}

  .bwl-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -16px 0;background:linear-gradient(180deg,rgba(4,13,18,0),rgba(4,13,18,.96) 40%);backdrop-filter:blur(3px)}
  .bwl-count,.bwl-done{font-size:10px;letter-spacing:2.2px;color:var(--bw-dim)}
  .bwl-done{color:${accent}}

  ${sealCss('bwl', accent)}
  @media(max-width:860px){.bwl-grid{grid-template-columns:1fr}.bwl-board{position:static;order:-1}}
  @media(max-width:700px){
    .bwl-strip{grid-template-columns:1fr 1fr}
    .bwl-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--bw-line);padding:6px 0 0}
    .bwl-title{font-size:23px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigbowl *,.sigbowl *::before,.sigbowl *::after{animation:none!important;transition:none!important}
    .bwl-frame{transform:none!important}
  }
  </style>

  <div class="bwl-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="bwl-title">${E((comp.name || 'BOWLERINA').toUpperCase())}</div>
  <div class="bwl-tagline">spin &middot; wait for the barrier &middot; roll at something you cannot see</div>

  <div class="bwl-what">
    <div class="bwl-what-h"><span class="bwl-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Bowlerina')}</b></div>
    ${comp.desc ? `<p class="bwl-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="bwl-w">${weights.map(([k, w]) =>
      `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="bwl-what-d">Sat out: ${
      (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
      isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${strip}
  <div class="${sealed ? 'bwl-grid-sealed' : 'bwl-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="bwl-ctrl">
    ${done ? `<span class="bwl-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE BARS ARE EMPTY.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}">${
        state.idx < 0 ? 'Drop the barrier' : 'Next card'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="bwl-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
