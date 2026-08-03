// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/morph-o-matic.js — "The Face Machine"
//
// The themed screen for js/bb-comps/morph-o-matic.js (`variant: 'memory'`).
//
// The competition's whole image is a face that is two people, so the screen
// builds those faces for real: each morph is the two houseguests' own portraits
// stacked and blended, which means the board is populated by the season's
// actual cast — including the ones who are not in the house any more. The rack
// down the side fills with completed times as each run is revealed.
//
// Narration comes from the competition's beats; the board and the per-player
// runs come from breakdown[name].morphs. Declines (returns '') when those are
// missing, so a season saved under the old one-roll memory comp — same variant
// tag — drops to the generic board instead of drawing an empty machine.
//
// u.reveal() only, gated on _tvState[stateKey].idx, no Math.random: the reveal
// handler rebuilds everything, so the same idx must produce the same html.
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {object} ep       week record (.num, .acts, optional ._seg)
 * @param {'hoh'|'veto'|string} actType
 * @param {object} u        { tvState, reveal, avatar, esc, cat, ordinal }
 * @returns {string} html, or '' to fall back to the generic screen
 */
export function rpBuildSigMorphOMatic(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  // The per-face board is the screen. Without it there is nothing to draw.
  const withMorphs = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.morphs) && v.morphs.length);
  if (!withMorphs.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'MEMORY', accent: '#8b5cf6' };
  const accent = cat.accent || '#8b5cf6';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_morph_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 23 + salt * 11 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The machine does not tell you how close you were. It only tells you no.',
    'Every wrong answer sends the same face back up, unchanged, waiting.',
    'The clock is on a screen behind them that they are not allowed to turn around and look at.',
    'A face you know perfectly well, wearing somebody else\'s jaw.',
    'There is no partial credit in here and there is no clue anywhere in the room.',
  ];
  const WIN_FLAV = [
    'Recognising people you have lived with should not be a talent. In this house it is worth a week.',
    'The board goes dark. The faces stay up behind everybody\'s eyes for a while longer.',
    'Fastest through a wall of people, half of whom are gone.',
    'The machine gets switched off, which is the only mercy it has ever shown anybody.',
  ];

  // ── the board ────────────────────────────────────────────────────────
  //
  // Every run walks the same faces in the same order, so the board is read off
  // whichever record is complete.
  const template = withMorphs.map(([, v]) => v.morphs).sort((a, b) => b.length - a.length)[0] || [];
  const board = template.map(m => (m.pair || []).filter(Boolean));

  // ── steps ────────────────────────────────────────────────────────────
  const steps = [];
  beats.forEach((b, i) => {
    const tag = String(b.badgeText || '').toUpperCase().trim();
    if (tag === 'THE MARGIN') { steps.push({ kind: 'margin', beat: b }); return; }
    if (b.badgeClass === 'gold' || tag === 'HOH' || tag === 'VETO') { steps.push({ kind: 'win', beat: b }); return; }
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    // Everything else is one houseguest's run at the machine.
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who] ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const total = steps.length;
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;
  const winner = act.winner || (act.results || [])[0]?.name || '';

  // The rack: completed runs only, fastest first — so it fills as you reveal.
  const rack = steps.slice(0, revealed).filter(s => s.kind === 'run' && breakdown[s.name])
    .map(s => ({ name: s.name, ...breakdown[s.name] }))
    .sort((a, b) => (a.time ?? 1e9) - (b.time ?? 1e9));
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withMorphs.length;

  /** One morphed face: two portraits stacked, the top one dissolved into the bottom. */
  const morphFace = (pair, px, label) => `<figure class="mom-face">
    <span class="mom-face-stack" style="width:${px}px;height:${px}px">
      <span class="mom-face-a">${AV(pair[0], px)}</span>
      <span class="mom-face-b">${AV(pair[1], px)}</span>
      <span class="mom-face-scan" aria-hidden="true"></span>
    </span>
    ${label ? `<figcaption>${E(pair[0] || '?')} <i>+</i> ${E(pair[1] || '?')}</figcaption>` : ''}
  </figure>`;

  const boardStrip = `<div class="mom-board">
    <div class="mom-board-h"><span class="mom-k">THE BOARD</span><span class="mom-k">${board.length} FACES</span></div>
    <div class="mom-board-row">
      ${board.map((pair, i) => `<div class="mom-slot" style="animation-delay:${(i % 8) * 60}ms">
        ${morphFace(pair, 46, false)}
        <span class="mom-slot-n">${i + 1}</span>
      </div>`).join('')}
    </div>
  </div>`;

  const strip = `<div class="mom-strip">
    <div><span class="mom-k">RUNS COMPLETE</span><span class="mom-v"><b>${rack.length}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="mom-k">FASTEST BOARD</span><span class="mom-v"><b>${rack.length ? `${rack[0].time}s` : '—'}</b></span></div>
    <div class="mom-strip-r"><span class="mom-k">${done ? 'RESULT' : 'LEADER'}</span>
      <span class="mom-v mom-v-txt">${done && winner
        ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
        : rack.length ? E(rack[0].name) : 'MACHINE WARM'}</span></div>
  </div>`;

  const rackHtml = `<aside class="mom-rack">
    <div class="mom-rack-h"><span class="mom-k">THE CLOCK</span></div>
    ${rack.length ? rack.map((r, i) => `<div class="mom-rack-row ${i === 0 ? 'is-lead' : ''}">
      <span class="mom-rack-p">${ORD(i + 1)}</span>
      <span class="mom-rack-av">${AV(r.name, 26)}</span>
      <span class="mom-rack-n">${E(r.name)}</span>
      <span class="mom-rack-t">${E(r.time)}s</span>
      <span class="mom-rack-w">${r.wrong ? `${r.wrong}✕` : 'clean'}</span>
    </div>`).join('') : '<p class="mom-rack-e">Nobody has cleared the board yet.</p>'}
  </aside>`;

  // ── cards ────────────────────────────────────────────────────────────
  const cards = steps.map((s, i) => {
    if (i > state.idx) return `<div class="mom-card is-locked"><span class="mom-lock">▓▓▓</span></div>`;

    if (s.kind === 'open') {
      return `<article class="mom-card mom-open">
        <header class="mom-hd"><span class="mom-tag">${E(s.beat.badgeText || 'THE BOARD')}</span>
          <span class="mom-sub">${fieldSize} to run it</span></header>
        <p class="mom-body">${E(s.beat.text)}</p>
      </article>`;
    }

    if (s.kind === 'win') {
      return `<article class="mom-card mom-win">
        <header class="mom-hd"><span class="mom-tag mom-tag-gold">${E(s.beat.badgeText || (isHoh ? 'HOH' : 'VETO'))}</span>
          <span class="mom-sub">fastest board</span></header>
        <div class="mom-win-b">
          <figure class="mom-win-av">${AV(winner, 74)}</figure>
          <div><div class="mom-win-n">${E(winner)}</div><p class="mom-body">${E(s.beat.text)}</p></div>
        </div>
        <p class="mom-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }

    if (s.kind === 'margin') {
      return `<article class="mom-card mom-margin">
        <header class="mom-hd"><span class="mom-tag mom-tag-quiet">${E(s.beat.badgeText || 'THE MARGIN')}</span></header>
        <p class="mom-body">${E(s.beat.text)}</p>
      </article>`;
    }

    if (s.kind === 'note') {
      return `<article class="mom-card mom-note">
        <header class="mom-hd"><span class="mom-tag mom-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="mom-body">${E(s.beat.text)}</p>
      </article>`;
    }

    // ── a run ──
    const bd = breakdown[s.name] || {};
    const morphs = bd.morphs || [];
    const slowest = morphs.reduce((a, b) => (a && a.secs > b.secs ? a : b), morphs[0]);
    const threw = !!bd.threw;
    const haunted = bd.hauntedBy;
    return `<article class="mom-card mom-run ${threw ? 'is-threw' : ''} ${haunted ? 'is-haunted' : ''}">
      <header class="mom-hd">
        <span class="mom-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="mom-tag ${threw ? 'mom-tag-quiet' : ''}">${E(s.beat.badgeText || '')}</span>
      </header>
      <p class="mom-body">${E(s.beat.text)}</p>

      <div class="mom-tape">
        ${morphs.map((m, k) => `<span class="mom-tick ${m.wrong ? 'is-miss' : ''} ${m.haunted ? 'is-ghost' : ''}"
             title="${E((m.pair || []).join(' + '))} — ${E(m.secs)}s${m.wrong ? `, ${m.wrong} wrong` : ''}">
          <i style="height:${Math.max(8, Math.min(46, Math.round(m.secs * 1.5)))}px"></i>
          <u>${k + 1}</u>
        </span>`).join('')}
      </div>

      <div class="mom-nums">
        <span><i>TOTAL</i><b>${E(bd.time)}s</b></span>
        <span><i>WRONG</i><b>${E(bd.wrong ?? 0)}</b></span>
        <span><i>SLOWEST FACE</i><b>${slowest ? `${E(slowest.secs)}s` : '—'}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>

      ${slowest && (slowest.pair || []).length ? `<div class="mom-worst">
        ${morphFace(slowest.pair, 52, true)}
        <p>${haunted
          ? `${E(s.name)} stopped in front of this one.`
          : `The face that cost ${E(s.name)} the most time.`}</p>
      </div>` : ''}

      <p class="mom-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((x, y) => y[1] - x[1]).slice(0, 4);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigmorph">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  .sigmorph{--mo-ink:#e6e1f5;--mo-dim:#8f88ab;--mo-line:rgba(139,92,246,.26);
    max-width:1100px;margin:0 auto;font-family:'Space Grotesk',system-ui,sans-serif;color:var(--mo-ink);
    background:radial-gradient(115% 85% at 50% -10%,#241a3d 0%,#140f24 50%,#08060f 100%);
    border-radius:12px;padding:18px 16px 0;position:relative;overflow:hidden}
  .sigmorph::before{content:'';position:absolute;inset:46px 0 0;pointer-events:none;
    background:repeating-linear-gradient(0deg,rgba(190,160,255,.06) 0 1px,transparent 1px 4px);
    animation:mom-crt 5s ease-in-out infinite alternate}
  @keyframes mom-crt{from{opacity:.35}to{opacity:.9}}

  .mom-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:4px;color:var(--mo-dim);text-align:center}
  .mom-title{font-weight:700;font-size:33px;letter-spacing:4px;text-align:center;color:#f3edff;
    text-shadow:0 0 24px ${accent}88;margin:3px 0;animation:mom-t 6s ease-in-out infinite alternate}
  @keyframes mom-t{from{text-shadow:0 0 12px ${accent}55}to{text-shadow:0 0 32px ${accent}bb}}
  .mom-tagline{text-align:center;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--mo-dim);margin-bottom:12px}

  .mom-what{border:1px solid var(--mo-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:linear-gradient(180deg,rgba(40,28,68,.62),rgba(14,10,24,.62))}
  .mom-what-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:15px;font-weight:600;letter-spacing:1px}
  .mom-what-c{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;border:1px solid ${accent}66;color:${accent};padding:2px 6px;border-radius:3px}
  .mom-what-d{font-size:13px;line-height:1.55;color:var(--mo-dim);margin:6px 0 0}
  .mom-w{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
  .mom-w span{display:flex;align-items:center;gap:6px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.2px;color:var(--mo-dim);text-transform:uppercase}
  .mom-w s{text-decoration:none;display:inline-block;width:50px;height:4px;border-radius:2px;background:rgba(255,255,255,.1)}
  .mom-w s b{display:block;height:100%;border-radius:2px;background:${accent}}

  /* The morph itself: two portraits in one frame, the top one dissolved. */
  .mom-face{margin:0;text-align:center}
  .mom-face-stack{position:relative;display:inline-block;border-radius:8px;overflow:hidden;
    border:1px solid ${accent}55;background:#0d0918;box-shadow:0 0 14px ${accent}33}
  .mom-face-a,.mom-face-b{position:absolute;inset:0;display:block}
  .mom-face-a .bb-av,.mom-face-b .bb-av{width:100%!important;height:100%!important;border-radius:0;display:block}
  .mom-face-b{opacity:.52;mix-blend-mode:screen;filter:contrast(1.15) saturate(.8);
    animation:mom-morph 5.5s ease-in-out infinite alternate}
  @keyframes mom-morph{from{opacity:.34}to{opacity:.68}}
  .mom-face-scan{position:absolute;left:0;right:0;height:22%;
    background:linear-gradient(180deg,transparent,${accent}44,transparent);animation:mom-scan 3.6s linear infinite}
  @keyframes mom-scan{from{top:-25%}to{top:105%}}
  .mom-face figcaption{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.8px;color:var(--mo-dim);margin-top:5px}
  .mom-face figcaption i{color:${accent};font-style:normal}

  .mom-board{border:1px solid var(--mo-line);border-radius:10px;padding:10px;margin-bottom:10px;background:rgba(10,7,18,.6)}
  .mom-board-h{display:flex;justify-content:space-between;margin-bottom:8px}
  .mom-board-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
  .mom-slot{position:relative;animation:mom-in .32s ease both}
  .mom-slot-n{position:absolute;top:-5px;left:-5px;font-family:'IBM Plex Mono',monospace;font-size:9px;
    background:${accent};color:#120c22;border-radius:3px;padding:0 4px}

  .mom-k{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2.2px;color:var(--mo-dim)}
  .mom-strip{position:sticky;top:46px;z-index:6;display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:8px;
    padding:8px 10px;margin-bottom:14px;border:1px solid var(--mo-line);border-radius:8px;
    background:rgba(9,6,16,.95);backdrop-filter:blur(4px)}
  .mom-strip>div{display:flex;flex-direction:column;gap:2px;min-width:0}
  .mom-strip-r{border-left:1px solid var(--mo-line);padding-left:10px}
  .mom-v{font-family:'IBM Plex Mono',monospace;font-size:19px;display:flex;align-items:baseline;gap:5px}
  .mom-v b{color:${accent}}.mom-v i{font-style:normal;font-size:11px;color:var(--mo-dim)}
  .mom-v-txt{font-size:12.5px;letter-spacing:1.4px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  .mom-grid{display:grid;grid-template-columns:1fr 250px;gap:12px;align-items:start}
  .mom-rack{position:sticky;top:118px;border:1px solid var(--mo-line);border-radius:10px;padding:10px;
    background:linear-gradient(180deg,rgba(34,24,58,.75),rgba(12,9,20,.8))}
  .mom-rack-h{margin-bottom:7px}
  .mom-rack-e{font-size:12px;color:var(--mo-dim);margin:0;font-style:italic}
  .mom-rack-row{display:grid;grid-template-columns:22px 26px 1fr auto;gap:6px;align-items:center;
    padding:5px 4px;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px}
  .mom-rack-row .bb-av{border-radius:50%}
  .mom-rack-p{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mo-dim)}
  .mom-rack-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .mom-rack-t{font-family:'IBM Plex Mono',monospace;color:#efe9ff}
  .mom-rack-w{grid-column:3/-1;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--mo-dim)}
  .mom-rack-row.is-lead{background:${accent}14;border-radius:6px}
  .mom-rack-row.is-lead .mom-rack-t{color:${accent}}

  .mom-card{border:1px solid var(--mo-line);border-radius:10px;padding:12px 13px;margin-bottom:10px;
    background:linear-gradient(180deg,rgba(32,22,54,.72),rgba(11,8,19,.8));animation:mom-in .32s cubic-bezier(.2,.8,.25,1) both}
  @keyframes mom-in{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
  .mom-card.is-locked{padding:8px;text-align:center;opacity:.13;animation:none;background:none}
  .mom-lock{font-family:'IBM Plex Mono',monospace;letter-spacing:4px;color:var(--mo-dim)}
  .mom-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
  .mom-sub{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--mo-dim)}
  .mom-tag{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.8px;color:${accent};
    border:1px solid ${accent}55;background:${accent}14;padding:2px 8px;border-radius:3px}
  .mom-tag-gold{color:#ffd970;border-color:#ffd97066;background:#ffd97018}
  .mom-tag-quiet{color:#9d95b4;border-color:#9d95b444;background:#9d95b411}
  .mom-body{font-size:14px;line-height:1.62;margin:0}
  .mom-flav{margin:9px 0 0;padding-top:7px;border-top:1px dashed rgba(160,140,220,.18);
    font-size:12px;color:#8d85a6;font-style:italic}
  .mom-runner{display:flex;align-items:center;gap:8px;font-size:14px;letter-spacing:.6px}
  .mom-runner .bb-av{border-radius:7px;border:2px solid ${accent}66}

  .mom-tape{display:flex;align-items:flex-end;gap:5px;margin:11px 0 8px;padding:8px 6px 4px;
    border-radius:7px;background:rgba(0,0,0,.28)}
  .mom-tick{display:flex;flex-direction:column;align-items:center;gap:3px}
  .mom-tick i{display:block;width:13px;border-radius:2px 2px 0 0;background:linear-gradient(180deg,${accent},#4c2f8a)}
  .mom-tick u{text-decoration:none;font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--mo-dim)}
  .mom-tick.is-miss i{background:linear-gradient(180deg,#ff8a80,#8a2f2a)}
  .mom-tick.is-ghost i{background:linear-gradient(180deg,#7fe0c8,#256b5c)}

  .mom-nums{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:9px}
  .mom-nums span{display:flex;flex-direction:column;gap:1px}
  .mom-nums i{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:1.8px;color:var(--mo-dim)}
  .mom-nums b{font-family:'IBM Plex Mono',monospace;font-size:15px;color:#efe9ff}

  .mom-worst{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:8px;
    background:rgba(255,255,255,.035);border-left:3px solid ${accent}}
  .mom-worst p{margin:0;font-size:12.5px;color:#c9c1e0}
  .mom-run.is-haunted{border-color:rgba(127,224,200,.4)}
  .mom-run.is-haunted .mom-worst{border-left-color:#7fe0c8}
  .mom-run.is-threw{opacity:.92;border-style:dashed}

  .mom-win{border-color:rgba(255,217,112,.5);background:linear-gradient(180deg,rgba(70,54,18,.5),rgba(11,8,19,.85))}
  .mom-win-b{display:flex;gap:14px;align-items:center}
  .mom-win-av .bb-av{border-radius:10px;border:3px solid #ffd970;box-shadow:0 0 26px rgba(255,217,112,.5)}
  .mom-win-n{font-size:24px;font-weight:700;letter-spacing:2px;color:#ffeab6;margin-bottom:4px}

  .mom-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -16px 0;background:linear-gradient(180deg,rgba(8,6,15,0),rgba(8,6,15,.96) 40%);backdrop-filter:blur(3px)}
  .mom-count{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:2.2px;color:var(--mo-dim)}
  .mom-done{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:2.2px;color:${accent}}

  @media(max-width:860px){
    .mom-grid{grid-template-columns:1fr}
    .mom-rack{position:static;order:-1}
  }
  @media(max-width:700px){
    .mom-strip{grid-template-columns:1fr 1fr}
    .mom-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--mo-line);padding:6px 0 0}
    .mom-title{font-size:25px;letter-spacing:2px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigmorph *,.sigmorph *::before,.sigmorph *::after{animation:none!important;transition:none!important}
    .mom-face-scan{display:none}
  }
  </style>

  <div class="mom-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="mom-title">${E((comp.name || "MORPH 'O' MATIC").toUpperCase())}</div>
  <div class="mom-tagline">two people &middot; one face &middot; no partial credit</div>

  <div class="mom-what">
    <div class="mom-what-h"><span class="mom-what-c">${E(cat.label)}</span><b>${E(comp.name || "Morph 'O' Matic")}</b></div>
    ${comp.desc ? `<p class="mom-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="mom-w">${weights.map(([k, w]) =>
      `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="mom-what-d">Sat out: ${
      (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
      isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${boardStrip}
  ${strip}
  <div class="mom-grid">
    <div>${cards}</div>
    ${rackHtml}
  </div>

  <div class="mom-ctrl">
    ${done ? '<span class="mom-done">THE MACHINE IS OFF.</span>' : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}">${
        state.idx < 0 ? 'Start the board' : 'Next run'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="mom-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
