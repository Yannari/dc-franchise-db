// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/slippery-slope.js — "The Lanes"
//
// The themed screen for js/bb-comps/slippery-slope.js (`variant: 'knockout'`).
//
// The competition's picture is a row of containers slowly filling while people
// fall over, so the screen leads with exactly that: one tube per houseguest,
// filled to their level, with the ping-pong ball riding on top of the liquid.
// The tubes fill as the reveal advances, and anybody who peels off for the
// small container is drawn stopping where they stopped.
//
// Narration comes from the beats; levels and trip logs come from
// breakdown[name]. Declines when the log is missing, so a season saved under
// the old comp — same variant tag — falls through to the generic board.
// ══════════════════════════════════════════════════════════════════════

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigSlipperySlope(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withLogs = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.log) && v.log.length);
  if (!withLogs.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PHYSICAL', accent: '#4ade80' };
  // The category accent is chosen for the generic board and clashes with this
  // screen's palette; the category chip keeps it, everything else uses the green of the liquid these lanes are actually full of.
  const accent = '#4ade80';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_slope_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 17 + salt * 5 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The lane does not get less greased as the competition goes on. It gets more.',
    'Everything anybody spills runs straight back down the slope at them.',
    'The scoop holds about twice what anybody manages to deliver with it.',
    'Nobody has been dry since the horn.',
    'The ball sits there bobbing, a couple of centimetres out of reach, for a very long time.',
  ];
  const PRIZE_FLAV = [
    'The whole yard watches somebody decide they are not going to win this.',
    'It is a completely rational decision and it will be mentioned every day for a week.',
    'Certain and small beats uncertain and large, right up until the vote.',
    'Nobody says anything. Everybody files it.',
  ];
  const WIN_FLAV = [
    'The ball comes out of the container and the competition stops immediately.',
    'Somebody is going to have to hose the yard down.',
    'The last two lanes were still filling when it ended.',
    'A week of safety, delivered by a plastic scoop.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  const steps = [];
  beats.forEach((b, i) => {
    const tag = String(b.badgeText || '').toUpperCase().trim();
    if (tag === 'TOOK THE PRIZE') { steps.push({ kind: 'prize', beat: b, name: (b.players || [])[0] }); return; }
    if (tag === 'ON THE LEVELS') { steps.push({ kind: 'levels', beat: b }); return; }
    if (b.badgeClass === 'gold' || tag === 'HOH' || tag === 'VETO') { steps.push({ kind: 'win', beat: b }); return; }
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.log ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const total = steps.length;
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;
  const winner = act.winner || (act.results || [])[0]?.name || '';
  const roster = (act.participants && act.participants.length
    ? act.participants
    : (act.results || []).map(r => r.name)).filter(Boolean);

  // A lane only fills once its houseguest's card has been turned over — the
  // tubes are the scoreboard, so they must not run ahead of the reveal.
  const shownNames = new Set(steps.slice(0, revealed)
    .filter(s => (s.kind === 'run' || s.kind === 'prize') && s.name).map(s => s.name));
  if (done) roster.forEach(n => shownNames.add(n));

  const lanes = `<div class="slp-lanes">
    ${roster.map((n, i) => {
      const bd = breakdown[n] || {};
      const shown = shownNames.has(n);
      const fill = shown ? Math.max(0, Math.min(100, Number(bd.fill) || 0)) : 0;
      const quit = shown && bd.tookPrize;
      const won = done && n === winner;
      return `<div class="slp-lane ${quit ? 'is-quit' : ''} ${won ? 'is-won' : ''}" style="animation-delay:${(i % 8) * 50}ms">
        <span class="slp-tube" title="${E(n)} — ${shown ? `${fill}%` : 'still running'}">
          <span class="slp-liq" style="height:${fill}%"></span>
          <span class="slp-ball" style="bottom:calc(${fill}% - 5px)"></span>
          ${quit ? '<span class="slp-x">✕</span>' : ''}
        </span>
        <span class="slp-lane-av">${AV(n, 28)}</span>
        <span class="slp-lane-n">${E(String(n).split(' ')[0])}</span>
        <span class="slp-lane-v">${shown ? `${fill}%` : '—'}</span>
      </div>`;
    }).join('')}
  </div>`;

  const lead = roster.map(n => ({ n, f: shownNames.has(n) ? (Number(breakdown[n]?.fill) || 0) : 0 }))
    .sort((a, b) => b.f - a.f)[0];
  const quitters = roster.filter(n => shownNames.has(n) && breakdown[n]?.tookPrize).length;

  const strip = `<div class="slp-strip">
    <div><span class="slp-k">LANES READ</span><span class="slp-v"><b>${shownNames.size}</b><i>/ ${roster.length}</i></span></div>
    <div><span class="slp-k">WALKED OFF</span><span class="slp-v"><b>${quitters}</b></span></div>
    <div class="slp-strip-r"><span class="slp-k">${done ? 'RESULT' : 'FULLEST'}</span>
      <span class="slp-v slp-v-txt">${done && winner
        ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
        : lead && lead.f ? `${E(lead.n)} · ${lead.f}%` : 'BARRELS FULL'}</span></div>
  </div>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return `<div class="slp-card is-locked"><span class="slp-lock">~ ~ ~</span></div>`;

    if (s.kind === 'open') {
      return `<article class="slp-card slp-open">
        <header class="slp-hd"><span class="slp-tag">${E(s.beat.badgeText || 'THE LANES')}</span>
          <span class="slp-sub">${roster.length} lanes</span></header>
        <p class="slp-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'win') {
      return `<article class="slp-card slp-win">
        <header class="slp-hd"><span class="slp-tag slp-tag-gold">${E(s.beat.badgeText || (isHoh ? 'HOH' : 'VETO'))}</span>
          <span class="slp-sub">ball out</span></header>
        <div class="slp-win-b">
          <figure class="slp-win-av">${AV(winner, 72)}</figure>
          <div><div class="slp-win-n">${E(winner)}</div><p class="slp-body">${E(s.beat.text)}</p></div>
        </div>
        <p class="slp-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'prize') {
      const bd = breakdown[s.name] || {};
      return `<article class="slp-card slp-prize">
        <header class="slp-hd"><span class="slp-tag slp-tag-prize">${E(s.beat.badgeText || 'TOOK THE PRIZE')}</span>
          <span class="slp-sub">out of the competition</span></header>
        <div class="slp-prize-b">
          <figure class="slp-prize-av">${AV(s.name, 52)}</figure>
          <div>
            <p class="slp-body">${E(s.beat.text)}</p>
            <div class="slp-prize-n">
              <span><i>STOPPED AT</i><b>${E(bd.fill ?? 0)}%</b></span>
              <span><i>ON TRIP</i><b>${E(bd.prizeTrip ?? '—')}</b></span>
              <span><i>TOOK</i><b>${E(String(bd.prize || 'the small box').toUpperCase())}</b></span>
            </div>
          </div>
        </div>
        <p class="slp-flav">${E(flav(PRIZE_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'levels' || s.kind === 'note') {
      return `<article class="slp-card slp-note">
        <header class="slp-hd"><span class="slp-tag slp-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="slp-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    const log = bd.log || [];
    const bestTrip = log.reduce((m, t) => (!m || t.got > m.got ? t : m), null);
    return `<article class="slp-card slp-run ${bd.threw ? 'is-threw' : ''}">
      <header class="slp-hd">
        <span class="slp-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="slp-tag ${bd.threw ? 'slp-tag-quiet' : ''}">${E(s.beat.badgeText || '')}</span>
      </header>
      <p class="slp-body">${E(s.beat.text)}</p>

      <div class="slp-trips">
        ${log.map(t => `<span class="slp-trip ${t.slipped ? 'is-slip' : ''}" title="Trip ${t.trip}: ${t.got} delivered${t.slipped ? ' (fell)' : ''}">
          <i style="height:${Math.max(4, Math.round((t.got || 0) * 1.7))}px"></i>
          <u>${t.trip}</u>
        </span>`).join('')}
      </div>

      <div class="slp-nums">
        <span><i>CONTAINER</i><b>${E(bd.fill ?? 0)}%</b></span>
        <span><i>TRIPS</i><b>${E(bd.trips ?? log.length)}</b></span>
        <span><i>FALLS</i><b>${E(bd.spills ?? 0)}</b></span>
        <span><i>BEST TRIP</i><b>${bestTrip ? E(bestTrip.got) : '—'}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="slp-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((x, y) => y[1] - x[1]).slice(0, 4);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigslope">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600&display=swap');
  .sigslope{--sl-ink:#e9fbef;--sl-dim:#84a894;--sl-line:rgba(74,222,128,.24);
    max-width:1100px;margin:0 auto;font-family:Archivo,system-ui,sans-serif;color:var(--sl-ink);
    background:radial-gradient(120% 85% at 50% -12%,#123d29 0%,#0a2118 52%,#040e0a 100%);
    border-radius:12px;padding:18px 16px 0;position:relative;overflow:hidden}
  .sigslope::before{content:'';position:absolute;inset:46px 0 0;pointer-events:none;
    background:repeating-linear-gradient(114deg,rgba(150,255,200,.05) 0 3px,transparent 3px 22px);
    animation:slp-sheen 6s ease-in-out infinite alternate}
  @keyframes slp-sheen{from{opacity:.35}to{opacity:.9}}

  .slp-eyebrow{font-size:10px;letter-spacing:4px;color:var(--sl-dim);text-align:center}
  .slp-title{font-family:'Archivo Black',sans-serif;font-size:33px;letter-spacing:1px;text-align:center;
    color:#e8fff2;text-shadow:0 0 24px ${accent}88;margin:3px 0}
  .slp-tagline{text-align:center;font-size:11.5px;letter-spacing:2px;color:var(--sl-dim);margin-bottom:12px}

  .slp-what{border:1px solid var(--sl-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:linear-gradient(180deg,rgba(18,61,41,.6),rgba(6,20,14,.6))}
  .slp-what-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:15px;font-weight:600}
  .slp-what-c{font-size:9px;letter-spacing:2px;border:1px solid ${cat.accent||accent}66;color:${cat.accent||accent};padding:2px 6px;border-radius:3px}
  .slp-what-d{font-size:13px;line-height:1.55;color:var(--sl-dim);margin:6px 0 0}
  .slp-w{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
  .slp-w span{display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:1.2px;color:var(--sl-dim);text-transform:uppercase}
  .slp-w s{text-decoration:none;display:inline-block;width:50px;height:4px;border-radius:2px;background:rgba(255,255,255,.1)}
  .slp-w s b{display:block;height:100%;border-radius:2px;background:${accent}}

  /* One tube per lane, the ball riding on the liquid. */
  .slp-lanes{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;padding:14px 10px 10px;
    margin-bottom:10px;border:1px solid var(--sl-line);border-radius:10px;background:rgba(4,14,10,.6)}
  .slp-lane{display:flex;flex-direction:column;align-items:center;gap:4px;width:56px;animation:slp-in .3s ease both}
  .slp-tube{position:relative;display:block;width:26px;height:96px;border-radius:5px 5px 3px 3px;
    background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
    border:1px solid rgba(255,255,255,.16);overflow:hidden}
  .slp-liq{position:absolute;left:0;right:0;bottom:0;border-radius:0 0 2px 2px;
    background:linear-gradient(180deg,${accent},#1c8f52);transition:height .5s cubic-bezier(.2,.8,.25,1);
    box-shadow:0 0 12px ${accent}55}
  .slp-liq::after{content:'';position:absolute;top:-3px;left:0;right:0;height:5px;border-radius:50%;
    background:rgba(220,255,235,.5);animation:slp-slosh 2.6s ease-in-out infinite alternate}
  @keyframes slp-slosh{from{transform:translateX(-2px)}to{transform:translateX(2px)}}
  .slp-ball{position:absolute;left:50%;transform:translateX(-50%);width:11px;height:11px;border-radius:50%;
    background:radial-gradient(circle at 35% 30%,#fff,#c9d6cd);transition:bottom .5s cubic-bezier(.2,.8,.25,1);
    box-shadow:0 1px 4px rgba(0,0,0,.5)}
  .slp-x{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    font-size:20px;color:#ff8a80;text-shadow:0 0 8px #000}
  .slp-lane.is-quit .slp-tube{border-color:rgba(255,138,128,.5);filter:grayscale(.5)}
  .slp-lane.is-won .slp-tube{border-color:#ffd970;box-shadow:0 0 18px rgba(255,217,112,.5)}
  .slp-lane .bb-av{border-radius:50%;border:1px solid rgba(255,255,255,.2)}
  .slp-lane-n{font-size:9px;letter-spacing:.6px;color:#cfe8da}
  .slp-lane-v{font-size:10px;font-weight:600;color:${accent}}
  .slp-lane.is-quit .slp-lane-v{color:#ff9d94}

  .slp-k{font-size:9px;letter-spacing:2.2px;color:var(--sl-dim)}
  .slp-strip{position:sticky;top:46px;z-index:6;display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:8px;
    padding:8px 10px;margin-bottom:14px;border:1px solid var(--sl-line);border-radius:8px;
    background:rgba(4,14,10,.95);backdrop-filter:blur(4px)}
  .slp-strip>div{display:flex;flex-direction:column;gap:2px;min-width:0}
  .slp-strip-r{border-left:1px solid var(--sl-line);padding-left:10px}
  .slp-v{font-family:'Archivo Black',sans-serif;font-size:18px;display:flex;align-items:baseline;gap:5px}
  .slp-v b{color:${accent}}.slp-v i{font-style:normal;font-size:11px;color:var(--sl-dim);font-family:Archivo,sans-serif;font-weight:400}
  .slp-v-txt{font-family:Archivo,sans-serif;font-size:12.5px;font-weight:600;letter-spacing:1px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  .slp-card{border:1px solid var(--sl-line);border-radius:10px;padding:12px 13px;margin-bottom:10px;
    background:linear-gradient(180deg,rgba(16,50,34,.72),rgba(5,16,11,.8));animation:slp-in .32s cubic-bezier(.2,.8,.25,1) both}
  @keyframes slp-in{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
  .slp-card.is-locked{padding:8px;text-align:center;opacity:.13;animation:none;background:none}
  .slp-lock{letter-spacing:5px;color:var(--sl-dim)}
  .slp-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
  .slp-sub{font-size:9px;letter-spacing:2px;color:var(--sl-dim)}
  .slp-tag{font-size:10px;letter-spacing:1.8px;color:${accent};border:1px solid ${accent}55;
    background:${accent}14;padding:2px 8px;border-radius:3px}
  .slp-tag-gold{color:#ffd970;border-color:#ffd97066;background:#ffd97018}
  .slp-tag-prize{color:#ffb057;border-color:#ffb05766;background:#ffb05716}
  .slp-tag-quiet{color:#93aea0;border-color:#93aea044;background:#93aea011}
  .slp-body{font-size:14px;line-height:1.62;margin:0}
  .slp-flav{margin:9px 0 0;padding-top:7px;border-top:1px dashed rgba(130,200,165,.18);font-size:12px;color:#7f9b8b;font-style:italic}
  .slp-runner{display:flex;align-items:center;gap:8px;font-size:14px}
  .slp-runner .bb-av{border-radius:7px;border:2px solid ${accent}66}

  .slp-trips{display:flex;align-items:flex-end;gap:4px;margin:11px 0 9px;padding:8px 6px 4px;
    border-radius:7px;background:rgba(0,0,0,.28)}
  .slp-trip{display:flex;flex-direction:column;align-items:center;gap:3px}
  .slp-trip i{display:block;width:12px;border-radius:2px 2px 0 0;background:linear-gradient(180deg,${accent},#1c8f52)}
  .slp-trip u{text-decoration:none;font-size:8px;color:var(--sl-dim)}
  .slp-trip.is-slip i{background:linear-gradient(180deg,#ff8a80,#8a2f2a)}

  .slp-nums{display:flex;gap:14px;flex-wrap:wrap}
  .slp-nums span{display:flex;flex-direction:column;gap:1px}
  .slp-nums i{font-style:normal;font-size:8.5px;letter-spacing:1.8px;color:var(--sl-dim)}
  .slp-nums b{font-family:'Archivo Black',sans-serif;font-size:14px;color:#e9fbef}

  .slp-prize{border-color:rgba(255,176,87,.45);background:linear-gradient(180deg,rgba(62,44,16,.6),rgba(5,16,11,.8))}
  .slp-prize-b{display:flex;gap:12px;align-items:flex-start}
  .slp-prize-av .bb-av{border-radius:9px;border:2px solid #ffb057}
  .slp-prize-n{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px}
  .slp-prize-n span{display:flex;flex-direction:column;gap:1px}
  .slp-prize-n i{font-style:normal;font-size:8.5px;letter-spacing:1.8px;color:#c99a63}
  .slp-prize-n b{font-family:'Archivo Black',sans-serif;font-size:13px;color:#ffd9a8}
  .slp-run.is-threw{border-style:dashed;opacity:.92}

  .slp-win{border-color:rgba(255,217,112,.5);background:linear-gradient(180deg,rgba(66,54,16,.5),rgba(5,16,11,.85))}
  .slp-win-b{display:flex;gap:14px;align-items:center}
  .slp-win-av .bb-av{border-radius:10px;border:3px solid #ffd970;box-shadow:0 0 26px rgba(255,217,112,.5)}
  .slp-win-n{font-family:'Archivo Black',sans-serif;font-size:22px;color:#ffeab6;margin-bottom:4px}

  .slp-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -16px 0;background:linear-gradient(180deg,rgba(4,14,10,0),rgba(4,14,10,.96) 40%);backdrop-filter:blur(3px)}
  .slp-count,.slp-done{font-size:10px;letter-spacing:2.2px;color:var(--sl-dim)}
  .slp-done{color:${accent}}

  @media(max-width:700px){
    .slp-strip{grid-template-columns:1fr 1fr}
    .slp-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--sl-line);padding:6px 0 0}
    .slp-title{font-size:24px}
    .slp-lane{width:46px}.slp-tube{width:22px;height:80px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigslope *,.sigslope *::before,.sigslope *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="slp-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="slp-title">${E((comp.name || 'SLIPPERY SLOPE').toUpperCase())}</div>
  <div class="slp-tagline">scoop &middot; fall &middot; pour &middot; and the small box is right there</div>

  <div class="slp-what">
    <div class="slp-what-h"><span class="slp-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Slippery Slope')}</b></div>
    ${comp.desc ? `<p class="slp-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="slp-w">${weights.map(([k, w]) =>
      `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="slp-what-d">Sat out: ${
      (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
      isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${lanes}
  ${strip}
  <div>${cards}</div>

  <div class="slp-ctrl">
    ${done ? '<span class="slp-done">THE LANES ARE EMPTY.</span>' : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}">${
        state.idx < 0 ? 'Sound the horn' : 'Next lane'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="slp-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
