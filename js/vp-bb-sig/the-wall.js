// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/the-wall.js — "Night Sky Endurance"
//
// The themed Viewer's Pass screen for the signature endurance competition in
// js/bb-comps/signature.js (`variant: 'the-wall'`). It replaces the generic
// rpBuildBBComp scoreboard for this one competition and nothing else.
//
// The generic screen counts UP from last place, which is the right shape for a
// timed comp and the wrong shape for this one: the wall is not a ranking, it is
// a night that gets worse. So this screen plays it forward — the field goes up,
// the hazards come in waves, fatigue ratchets, pegs fall off the face into the
// water below, and eventually two people are alone up there in the dark having
// a conversation nobody else can hear.
//
// Every word of narration comes from the competition's own beats array. This
// file invents no results, no drops and no outcomes; it groups the beats it is
// given into waves and draws them. The only text authored here is connective
// atmosphere (floodlight chatter, ground-crew asides), which is picked
// DETERMINISTICALLY from ep.num + step index so that the reveal handler — which
// rebuilds the entire screen on every click — renders identically every time.
//
// Interactivity is u.reveal() and nothing else: no window globals, no exported
// handlers, no imports. Everything is gated on _tvState[stateKey].idx, so a
// screen at idx -1 shows an empty wall with the whole field still on it and no
// way to read the ending off the DOM.
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {object} ep      episode / week record (needs .num, .acts, optional ._seg)
 * @param {'hoh'|'veto'|string} actType
 * @param {object} u       { tvState, reveal, avatar, esc, cat, ordinal }
 * @returns {string} html, or '' to fall back to the generic competition screen
 */
export function rpBuildSigTheWall(ep, actType, u) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  const results = Array.isArray(act?.results) ? act.results.filter(Boolean) : [];

  // The Invisible HOH seals the result. That is a different screen's job — this
  // one is built entirely around showing who is still up there, which is the
  // exact thing a sealed competition is not allowed to say.
  if (!act || !comp || !results.length || act.secret) return '';

  const E = v => u.esc(v);
  const AV = (n, px) => u.avatar(n, px);
  const cat = u.cat(comp.category) || { label: 'ENDURANCE', accent: '#58a6ff', blurb: '' };
  const accent = cat.accent || '#58a6ff';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_wall_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  // ── deterministic flavour ────────────────────────────────────────────
  // No Math.random anywhere in this file. Every rebuild at the same idx must
  // produce byte-identical html or the reveal flickers new text at the viewer.
  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 31 + salt * 17 + pool.length) % pool.length];

  const OPEN_LINES = [
    'Floodlights up. The field goes on the face in the dark and the clock does not start anywhere anybody can see it.',
    'Cold night, hard light, and a wall that has never once let a whole cast walk off it.',
    'The crew clears the pad. From here it is hands, feet and however long somebody is willing to be miserable.',
    'Nobody has said anything for a while. That is normal. That lasts about an hour.',
    'The rig hums, the lights swing over, and every houseguest on that face does the same silent maths.',
  ];
  const WAVE_LINES = [
    'The horn goes twice. Everybody on the face knows what two means.',
    'Down on the pad the crew stops talking, which is always the tell.',
    'The lights swing across the wall and hold there, so nobody gets to fall in the dark.',
    'Somewhere behind the rig a valve opens. Nothing good has ever followed that sound.',
    'The face groans once before it does anything, which is the only warning anybody gets.',
    'Whatever hour it is now, it is later than anybody up there thinks it is.',
  ];
  const GRIND_LINES = [
    'Nothing is happening, which on this wall is the loudest thing that happens.',
    'The cameras stay on one face because there is nothing else left to shoot.',
    'This is the part of the night that does not make the episode and decides it anyway.',
    'No hazard, no horn, no talking. Just weight, going in one direction.',
  ];
  const DEAL_LINES = [
    'Two people, one wall, and a conversation the microphones can only half hear.',
    'This is the negotiation the whole season gets replayed against.',
    'Whatever gets said here is worth more than the comp was.',
    'Both of them know exactly what this costs. One of them says it out loud.',
  ];
  const WIN_LINES = [
    'The lights come up full and the last one up there does not immediately let go.',
    'Somebody has to go up and physically take them off the wall.',
    'It ends the way this comp always ends: quietly, badly, and to one person.',
    'The horn finally sounds for the right reason.',
  ];

  // ── steps, built from the competition's own beats ─────────────────────
  //
  // The Wall emits, in order: one opening atmosphere beat, then per wave a
  // hazard header (badged with the hazard's own label) followed by one beat per
  // faller (DROPS / FIRST DOWN / THREW IT), with occasional STILL UP grinder
  // beats between waves, then the last-two negotiation (DEAL STRUCK / NO DEAL)
  // and finally the gold winner beat. Classification is by badge, so an unknown
  // badge degrades into a new wave header rather than being silently dropped.
  const beats = (comp.beats || []).filter(b => b && b.text);
  // STEPS DOWN is the voluntary exit, and it has to be in this set: an exit
  // tag the classifier does not know degrades into a new wave header, so the
  // houseguest never leaves the face and the wave count inflates.
  const DROP_TAGS = new Set(['DROPS', 'FIRST DOWN', 'THREW IT', 'STEPS DOWN']);
  const STEP_TAGS = new Set(['STEPS DOWN']);
  const steps = [];
  let cur = null;
  let waveNo = 0;

  beats.forEach((b, i) => {
    const tag = String(b.badgeText || '').toUpperCase().trim();
    if (b.badgeClass === 'gold' || tag === 'HOH' || tag === 'VETO') {
      steps.push({ kind: 'win', beat: b }); cur = null; return;
    }
    if (tag === 'DEAL STRUCK' || tag === 'NO DEAL') {
      steps.push({ kind: 'deal', beat: b, struck: tag === 'DEAL STRUCK' }); cur = null; return;
    }
    if (tag === 'STILL UP') { steps.push({ kind: 'grind', beat: b }); return; }
    if (DROP_TAGS.has(tag)) {
      if (!cur) { cur = { kind: 'wave', wave: ++waveNo, head: null, drops: [] }; steps.push(cur); }
      cur.drops.push(b); return;
    }
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    cur = { kind: 'wave', wave: ++waveNo, head: b, drops: [] };
    steps.push(cur);
  });

  if (!steps.length) return '';
  const totalWaves = Math.max(1, waveNo);

  // Who is on the face, in a stable order that does not leak the finish.
  const roster = ((act.participants || []).filter(Boolean).length
    ? act.participants.filter(Boolean)
    : results.map(r => r.name)).slice();
  const fieldSize = roster.length || results.length;
  const runnerUp = results[1]?.name || null;
  const winner = act.winner || results[0]?.name || null;

  // Standing count and the fallen set, resolved per step so both are gated by
  // idx for free — an unrevealed step contributes nobody to the splash zone.
  let stand = fieldSize;
  steps.forEach(s => {
    s.fell = [];
    s.stepped = [];
    if (s.kind === 'wave') {
      s.fell = s.drops.map(d => (d.players || [])[0]).filter(Boolean);
      // Which of them chose it. Coming off a wall on your own legs looks
      // nothing like being thrown off one, and the set-piece should say so.
      s.stepped = s.drops.filter(d => STEP_TAGS.has(String(d.badgeText || '').toUpperCase().trim()))
        .map(d => (d.players || [])[0]).filter(Boolean);
      stand -= s.drops.length;
    } else if (s.kind === 'deal') {
      // Either an ally steps down on a promise or the second one runs out of
      // hands. Both leave exactly one houseguest on the wall.
      if (runnerUp) s.fell = [runnerUp];
      stand = 1;
    } else if (s.kind === 'win') {
      stand = 1;
    }
    s.standing = Math.max(1, stand);
  });

  const total = steps.length;
  // Clamped both ways: a stale _tvState from a longer competition must not
  // index past the end of this one's steps.
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;

  const fallenNow = new Set();
  const steppedNow = new Set();
  steps.slice(0, revealed).forEach(s => {
    s.fell.forEach(n => fallenNow.add(n));
    (s.stepped || []).forEach(n => steppedNow.add(n));
  });
  const standingNow = revealed ? steps[revealed - 1].standing : fieldSize;

  // ── the wall set-piece ───────────────────────────────────────────────
  const ROWS = 3;
  const per = Math.max(1, Math.ceil(roster.length / ROWS));
  // Spaced by rank within their own zone rather than by a hash of the roster
  // index: a modulo scatter collides as soon as two houseguests land on the
  // same remainder, and five people on the pad stacked into two blobs.
  const walkedList = roster.filter(n => steppedNow.has(n));
  const fellList = roster.filter(n => fallenNow.has(n) && !steppedNow.has(n));
  const spread = (list, name, from, to) => {
    const k = list.indexOf(name);
    if (list.length <= 1) return (from + to) / 2;
    return from + (k * ((to - from) / (list.length - 1)));
  };
  const pegs = roster.map((name, i) => {
    const row = Math.min(ROWS - 1, Math.floor(i / per));
    const col = i % per;
    const left = 11 + ((col + 0.5) * (78 / per));
    // The face leans, so the ledges are not level — pegs ride the slope.
    const ledgeY = 17 + row * 21 + (left - 50) * 0.075;
    const isDown = fallenNow.has(name);
    const walked = steppedNow.has(name);
    // Deterministic lateral scatter in the water, so pegs do not stack.
    // The water is the left half; the pad is the right end. Keeping the two
    // zones apart is the whole point of drawing them differently.
    const splashX = spread(fellList, name, 7, 50);
    // The two exits end up in different places. Anybody thrown off the face
    // lands in the water; anybody who climbed down is standing on the pad at
    // the foot of the rig, dry, watching — which is the whole difference the
    // competition now models.
    // Kept to the right-hand end, under its own label and clear of the water.
    const padX = spread(walkedList, name, 60, 94);
    return { name, isDown, walked,
      left: walked ? padX : isDown ? splashX : left,
      // Sat just above the pad caption so the label stays readable behind them.
      top: walked ? 87 : isDown ? 84 : ledgeY, i };
  });

  const wallSvg = `<svg class="sgw-face" viewBox="0 0 1000 340" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="sgw-g-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1b2b4d"/><stop offset="0.65" stop-color="#101b33"/><stop offset="1" stop-color="#0a1224"/>
      </linearGradient>
      <linearGradient id="sgw-g-beam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cfe6ff" stop-opacity="0.34"/><stop offset="1" stop-color="#cfe6ff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="sgw-g-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#12304f"/><stop offset="1" stop-color="#071324"/>
      </linearGradient>
    </defs>
    <polygon class="sgw-beam" points="120,-40 260,-40 400,300 40,300" fill="url(#sgw-g-beam)"/>
    <polygon class="sgw-beam sgw-beam-b" points="740,-40 880,-40 980,300 600,300" fill="url(#sgw-g-beam)"/>
    <polygon points="0,272 1000,254 1000,340 0,340" fill="url(#sgw-g-water)"/>
    <polygon class="sgw-wallface" points="88,14 912,44 858,262 142,246" fill="url(#sgw-g-wall)" stroke="${accent}" stroke-opacity="0.45" stroke-width="2"/>
    <line x1="112" y1="82" x2="888" y2="110" stroke="${accent}" stroke-opacity="0.22" stroke-width="6" stroke-linecap="round"/>
    <line x1="124" y1="152" x2="876" y2="178" stroke="${accent}" stroke-opacity="0.22" stroke-width="6" stroke-linecap="round"/>
    <line x1="134" y1="222" x2="866" y2="244" stroke="${accent}" stroke-opacity="0.22" stroke-width="6" stroke-linecap="round"/>
    <g stroke="#7fb2ff" stroke-opacity="0.13" stroke-width="1">
      ${Array.from({ length: 11 }, (_, k) => {
        const x = 100 + k * 80;
        return `<line x1="${x}" y1="18" x2="${x + 6}" y2="256"/>`;
      }).join('')}
    </g>
    <g class="sgw-surface" stroke="#8fd0ff" stroke-opacity="0.3" stroke-width="2" stroke-linecap="round">
      <line x1="40" y1="292" x2="200" y2="290"/><line x1="250" y1="304" x2="430" y2="301"/>
      <line x1="490" y1="290" x2="660" y2="288"/><line x1="700" y1="308" x2="900" y2="304"/>
      <line x1="150" y1="320" x2="330" y2="318"/><line x1="620" y1="322" x2="820" y2="319"/>
    </g>
    <g class="sgw-rig" stroke="#4d6488" stroke-width="4" stroke-linecap="round">
      <line x1="88" y1="14" x2="60" y2="270"/><line x1="912" y1="44" x2="944" y2="266"/>
      <line x1="60" y1="120" x2="88" y2="118"/><line x1="944" y1="140" x2="912" y2="140"/>
    </g>
    <g class="sgw-lamp" fill="#dcecff">
      <ellipse cx="190" cy="-6" rx="26" ry="10"/><ellipse cx="810" cy="-6" rx="26" ry="10"/>
    </g>
  </svg>`;

  const wall = `<figure class="sgw-stage">
    ${wallSvg}
    <div class="sgw-rain" aria-hidden="true"></div>
    <div class="sgw-pegs">
      ${pegs.map(p => `<div class="sgw-peg ${p.walked ? 'is-walked' : p.isDown ? 'is-down' : 'is-up'}"
            style="left:${p.left.toFixed(2)}%;top:${p.top.toFixed(2)}%;animation-delay:${(p.i % 7) * 40}ms"
            title="${E(p.name)}${p.walked ? ' — climbed down' : p.isDown ? ' — off the wall' : ' — still up'}">
        <span class="sgw-peg-av">${AV(p.name, 26)}</span>
        <span class="sgw-peg-n">${E(String(p.name).split(' ')[0])}</span>
      </div>`).join('')}
    </div>
    <figcaption class="sgw-splash-label">SPLASH ZONE</figcaption>
    ${steppedNow.size ? '<figcaption class="sgw-pad-label">THE PAD &middot; CAME DOWN</figcaption>' : ''}
  </figure>`;

  // ── the live strip ───────────────────────────────────────────────────
  const strip = `<div class="sgw-strip">
    <div class="sgw-strip-l">
      <span class="sgw-strip-k">STILL ON THE WALL</span>
      <span class="sgw-strip-v"><b>${standingNow}</b><i>/ ${fieldSize}</i></span>
    </div>
    <div class="sgw-strip-m">
      <span class="sgw-strip-k">HAZARD WAVES</span>
      <span class="sgw-strip-v"><b>${Math.min(totalWaves, steps.slice(0, revealed).filter(s => s.kind === 'wave').length)}</b><i>/ ${totalWaves}</i></span>
    </div>
    <div class="sgw-strip-r">
      <span class="sgw-strip-k">${done ? 'RESULT' : 'STATUS'}</span>
      <span class="sgw-strip-v sgw-strip-txt">${done && winner
        ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
        : revealed ? 'NIGHT IN PROGRESS' : 'FIELD ON THE FACE'}</span>
    </div>
  </div>`;

  // ── hazard identity ──────────────────────────────────────────────────
  const hazKind = label => {
    const s = String(label || '').toUpperCase();
    if (/WATER|RAIN|SPRAY|SOAK/.test(s)) return 'water';
    if (/WIND|GALE|FAN|STORM/.test(s)) return 'wind';
    if (/SLIME|GOO|SYRUP|FOAM/.test(s)) return 'slime';
    return 'tilt';
  };
  const hazIcon = kind => {
    if (kind === 'water') return `<svg viewBox="0 0 24 24" class="sgw-hi"><path d="M12 2.5c3.4 4.4 6.2 8 6.2 11.2A6.2 6.2 0 0 1 12 20a6.2 6.2 0 0 1-6.2-6.3C5.8 10.5 8.6 6.9 12 2.5Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9.2 14.2a2.9 2.9 0 0 0 2.4 2.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    if (kind === 'wind') return `<svg viewBox="0 0 24 24" class="sgw-hi"><path d="M3 8h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 18h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
    if (kind === 'slime') return `<svg viewBox="0 0 24 24" class="sgw-hi"><path d="M3 5h18v3.4c-2.6 0-2.6 3.6-5.2 3.6S13.2 8.4 10.6 8.4 8 12 5.4 12 3 8.4 3 8.4Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 14.5v2.8M12.6 14v4.4M17 15v2.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 24 24" class="sgw-hi"><path d="M5 20 8 4l12 2.2L17.2 20Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M6.4 12.6l11.6 1.8" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;
  };

  const dropTone = tag => {
    const t = String(tag || '').toUpperCase();
    if (t === 'THREW IT') return 'is-threw';
    if (t === 'STEPS DOWN') return 'is-walked';
    if (t === 'FIRST DOWN') return 'is-first';
    return '';
  };

  // ── cards ────────────────────────────────────────────────────────────
  const faces = names => (names || []).filter(Boolean).slice(0, 6)
    .map(n => `<span class="sgw-face-chip">${AV(n, 24)}<b>${E(n)}</b></span>`).join('');

  const cards = steps.map((s, i) => {
    if (i > state.idx) {
      return `<div class="sgw-card is-locked"><span class="sgw-lock">—</span></div>`;
    }
    const grade = Math.round((s.standing / Math.max(1, fieldSize)) * 100);

    if (s.kind === 'open') {
      return `<article class="sgw-card sgw-open">
        <header class="sgw-hd"><span class="sgw-tag">${E(s.beat.badgeText || 'THE WALL')}</span>
          <span class="sgw-hd-sub">${fieldSize} on the face</span></header>
        <p class="sgw-body">${E(s.beat.text)}</p>
        ${(s.beat.players || []).length ? `<div class="sgw-faces">${faces(s.beat.players)}</div>` : ''}
        <p class="sgw-flav">${E(flav(OPEN_LINES, i))}</p>
      </article>`;
    }

    if (s.kind === 'grind') {
      return `<article class="sgw-card sgw-grind">
        <header class="sgw-hd"><span class="sgw-tag sgw-tag-quiet">${E(s.beat.badgeText || 'STILL UP')}</span></header>
        <div class="sgw-grind-b">${faces(s.beat.players)}<p class="sgw-body">${E(s.beat.text)}</p></div>
        <p class="sgw-flav">${E(flav(GRIND_LINES, i))}</p>
      </article>`;
    }

    if (s.kind === 'deal') {
      const a = winner, b = runnerUp;
      return `<article class="sgw-card sgw-deal ${s.struck ? 'is-struck' : 'is-nodeal'}">
        <header class="sgw-hd"><span class="sgw-tag sgw-tag-deal">${E(s.beat.badgeText || (s.struck ? 'DEAL STRUCK' : 'NO DEAL'))}</span>
          <span class="sgw-hd-sub">two left on the face</span></header>
        <div class="sgw-parley">
          <figure class="sgw-parley-p">${AV(a, 54)}<figcaption>${E(a)}</figcaption></figure>
          <div class="sgw-parley-mid">
            ${s.struck
              ? `<svg viewBox="0 0 64 40" class="sgw-shake" aria-hidden="true">
                   <path d="M4 22l12-8 9 6 9-6 12 8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
                   <path d="M25 20l6 4 6-4-6-4Z" fill="currentColor" fill-opacity="0.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                   <path d="M12 30h40" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.4" stroke-linecap="round"/>
                 </svg>`
              : `<svg viewBox="0 0 64 40" class="sgw-shake is-broken" aria-hidden="true">
                   <path d="M4 22l12-8 8 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                   <path d="M60 22l-12-8-8 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                   <path d="M30 8l4 8-6 4 5 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                 </svg>`}
            <span class="sgw-parley-k">${s.struck ? 'TERMS AGREED' : 'NO TERMS'}</span>
          </div>
          <figure class="sgw-parley-p">${b ? AV(b, 54) : ''}<figcaption>${E(b || '')}</figcaption></figure>
        </div>
        <blockquote class="sgw-quote">${E(s.beat.text)}</blockquote>
        <p class="sgw-flav">${E(flav(DEAL_LINES, i))}</p>
      </article>`;
    }

    if (s.kind === 'win') {
      return `<article class="sgw-card sgw-win">
        <div class="sgw-win-glow" aria-hidden="true"></div>
        <header class="sgw-hd"><span class="sgw-tag sgw-tag-gold">${E(s.beat.badgeText || (isHoh ? 'HOH' : 'VETO'))}</span>
          <span class="sgw-hd-sub">last one standing</span></header>
        <div class="sgw-win-b">
          <figure class="sgw-win-av">${AV(winner, 76)}</figure>
          <div>
            <div class="sgw-win-n">${E(winner)}</div>
            <p class="sgw-body">${E(s.beat.text)}</p>
          </div>
        </div>
        <p class="sgw-flav">${E(flav(WIN_LINES, i))}</p>
      </article>`;
    }

    // ── a hazard wave ──
    const label = s.head?.badgeText || `WAVE ${s.wave}`;
    const kind = hazKind(label);
    const fatigue = Math.round((s.wave / totalWaves) * 100);
    return `<article class="sgw-card sgw-wave is-${kind}">
      <header class="sgw-hd">
        <span class="sgw-haz sgw-haz-${kind}">${hazIcon(kind)}<b>${E(label)}</b></span>
        <span class="sgw-hd-sub">WAVE ${s.wave} / ${totalWaves}</span>
      </header>
      ${s.head ? `<p class="sgw-body sgw-haz-line">${E(s.head.text)}</p>` : ''}
      <div class="sgw-meters">
        <span class="sgw-meter"><i>FATIGUE</i><span class="sgw-bar"><b style="width:${fatigue}%"></b></span><u>${fatigue}%</u></span>
        <span class="sgw-meter"><i>STILL UP</i><span class="sgw-bar is-alt"><b style="width:${grade}%"></b></span><u>${s.standing}</u></span>
      </div>
      <div class="sgw-drops">
        ${s.drops.map(d => `<div class="sgw-drop ${dropTone(d.badgeText)}">
          <span class="sgw-drop-av">${AV((d.players || [])[0], 34)}</span>
          <div class="sgw-drop-t">
            <span class="sgw-drop-tag">${E(d.badgeText || 'DROPS')}</span>
            <p>${E(d.text)}</p>
          </div>
        </div>`).join('')}
      </div>
      <p class="sgw-flav">${E(flav(WAVE_LINES, i))}</p>
    </article>`;
  }).join('');

  // ── shell ────────────────────────────────────────────────────────────
  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigwall">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Barlow+Condensed:wght@400;500;600;700&display=swap');
  .sigwall{--sgw-ink:#dbe7f7;--sgw-dim:#8fa3c2;--sgw-line:rgba(120,160,220,.24);--sgw-acc:${accent};
    max-width:1100px;margin:0 auto;font-family:'Barlow Condensed',system-ui,sans-serif;
    background:radial-gradient(120% 80% at 50% -10%,#16264a 0%,#0a1226 45%,#050a16 100%);
    border-radius:12px;padding:18px 16px 0;color:var(--sgw-ink);position:relative;overflow:clip}
  .sigwall::before{content:'';position:absolute;inset:46px 0 0;pointer-events:none;
    background:radial-gradient(60% 40% at 20% 0%,rgba(190,220,255,.10),transparent 70%),
               radial-gradient(60% 40% at 80% 0%,rgba(190,220,255,.08),transparent 70%);
    animation:sgw-flood 9s ease-in-out infinite alternate}
  @keyframes sgw-flood{from{opacity:.55}to{opacity:1}}

  .sgw-eyebrow{font-family:'Chakra Petch',monospace;font-size:10px;letter-spacing:3px;color:var(--sgw-dim);text-align:center}
  .sgw-title{font-family:'Chakra Petch',monospace;font-weight:700;font-size:30px;letter-spacing:5px;text-align:center;
    color:#eaf3ff;text-shadow:0 0 26px ${accent}66,0 0 4px #fff3;margin:4px 0 2px;animation:sgw-title 6s ease-in-out infinite alternate}
  @keyframes sgw-title{from{text-shadow:0 0 14px ${accent}44,0 0 3px #fff2}to{text-shadow:0 0 34px ${accent}88,0 0 6px #fff4}}
  .sgw-sub{text-align:center;font-size:13px;letter-spacing:1.4px;color:var(--sgw-dim);margin-bottom:12px}

  .sgw-what{border:1px solid var(--sgw-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:linear-gradient(180deg,rgba(20,36,68,.7),rgba(10,18,38,.7))}
  .sgw-what-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:'Chakra Petch',monospace;font-size:14px;letter-spacing:1px}
  .sgw-what-c{font-size:9px;letter-spacing:2px;border:1px solid ${accent}66;color:${accent};padding:2px 6px;border-radius:3px}
  .sgw-what-d{font-size:13px;line-height:1.5;color:var(--sgw-dim);margin:6px 0 0}
  .sgw-w{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
  .sgw-w span{display:flex;align-items:center;gap:6px;font-size:11px;letter-spacing:1px;color:var(--sgw-dim)}
  .sgw-w em{font-style:normal;text-transform:uppercase}
  .sgw-w s{text-decoration:none;display:inline-block;width:54px;height:4px;border-radius:2px;background:rgba(255,255,255,.1)}
  .sgw-w s b{display:block;height:100%;border-radius:2px;background:${accent}}

  .sgw-stage{position:relative;margin:0 0 10px;height:290px;border-radius:10px;overflow:hidden;
    border:1px solid var(--sgw-line);background:#050a16}
  .sgw-face{position:absolute;inset:0;width:100%;height:100%}
  .sgw-beam{animation:sgw-beam 7s ease-in-out infinite alternate}
  .sgw-beam-b{animation-duration:9s;animation-delay:-3s}
  @keyframes sgw-beam{from{opacity:.4}to{opacity:1}}
  .sgw-lamp{animation:sgw-lamp 4s ease-in-out infinite alternate}
  @keyframes sgw-lamp{from{opacity:.6;filter:drop-shadow(0 0 4px #cfe6ff)}to{opacity:1;filter:drop-shadow(0 0 16px #cfe6ff)}}
  .sgw-surface{animation:sgw-surf 5s ease-in-out infinite alternate}
  @keyframes sgw-surf{from{opacity:.35}to{opacity:1}}
  .sgw-wallface{animation:sgw-wf 8s ease-in-out infinite alternate}
  @keyframes sgw-wf{from{filter:drop-shadow(0 0 0 transparent)}to{filter:drop-shadow(0 0 18px ${accent}44)}}
  .sgw-rain{position:absolute;inset:0;pointer-events:none;
    background-image:repeating-linear-gradient(102deg,rgba(180,215,255,.16) 0 1px,transparent 1px 9px);
    animation:sgw-rain 3.2s ease-in-out infinite alternate}
  @keyframes sgw-rain{from{opacity:.18}to{opacity:.5}}
  .sgw-splash-label{position:absolute;left:10px;bottom:6px;font-family:'Chakra Petch',monospace;
    font-size:9px;letter-spacing:3px;color:rgba(150,200,255,.55)}

  .sgw-pegs{position:absolute;inset:0}
  .sgw-peg{position:absolute;transform:translate(-50%,-50%);text-align:center;width:52px}
  .sgw-peg .bb-av{border-radius:50%;border:2px solid ${accent};box-shadow:0 0 10px ${accent}55}
  .sgw-peg-n{display:block;font-family:'Chakra Petch',monospace;font-size:8.5px;letter-spacing:.6px;
    color:#cfe0f7;margin-top:2px;text-shadow:0 1px 3px #000}
  .sgw-peg.is-up{animation:sgw-hold 4.5s ease-in-out infinite alternate}
  @keyframes sgw-hold{from{filter:brightness(.9)}to{filter:brightness(1.15)}}
  .sgw-peg.is-down{opacity:.62;animation:sgw-splash .5s ease-out both}
  .sgw-peg.is-down .bb-av{border-color:#4c6b90;box-shadow:none;filter:grayscale(.7)}
  .sgw-peg.is-down .sgw-peg-n{color:#7f9ab8}
  @keyframes sgw-splash{from{transform:translate(-50%,-160%);opacity:0}to{transform:translate(-50%,-50%);opacity:.62}}
  /* Climbed down: dry, on the pad, and lit warm rather than drowned blue —
     the difference between losing the wall and deciding you are finished. */
  .sgw-peg.is-walked{opacity:.85;animation:sgw-climb .62s cubic-bezier(.3,.9,.4,1) both}
  .sgw-peg.is-walked .bb-av{border-color:#ffb861;box-shadow:0 0 12px rgba(255,184,97,.35);filter:none}
  .sgw-peg.is-walked .sgw-peg-n{color:#ffd9a8}
  @keyframes sgw-climb{from{transform:translate(-50%,-210%);opacity:0}
    to{transform:translate(-50%,-50%);opacity:.85}}
  .sgw-pad-label{position:absolute;right:10px;bottom:6px;font-family:'Chakra Petch',monospace;
    font-size:9px;letter-spacing:3px;color:rgba(255,184,97,.62)}
  /* A voluntary exit reads warm on the card too, so the two kinds of leaving
     are never the same colour anywhere on the screen. */
  .sgw-drop.is-walked{border-left-color:#ffb861}
  .sgw-drop.is-walked .sgw-drop-tag{color:#241608;background:#ffb861;border-color:#ffb861}

  .sgw-strip{position:sticky;top:46px;z-index:6;display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:8px;
    padding:8px 10px;margin-bottom:14px;border:1px solid var(--sgw-line);border-radius:8px;
    background:rgba(8,14,30,.94);backdrop-filter:blur(4px)}
  .sgw-strip>div{display:flex;flex-direction:column;gap:2px;min-width:0}
  .sgw-strip-k{font-family:'Chakra Petch',monospace;font-size:8.5px;letter-spacing:2.4px;color:var(--sgw-dim)}
  .sgw-strip-v{font-family:'Chakra Petch',monospace;font-size:20px;letter-spacing:1px;color:#eaf3ff;display:flex;align-items:baseline;gap:5px}
  .sgw-strip-v i{font-style:normal;font-size:11px;color:var(--sgw-dim)}
  .sgw-strip-v b{color:${accent}}
  .sgw-strip-txt{font-size:12.5px;letter-spacing:1.5px;color:#eaf3ff;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sgw-strip-r{border-left:1px solid var(--sgw-line);padding-left:10px}

  .sgw-card{border:1px solid var(--sgw-line);border-radius:10px;padding:12px 13px;margin-bottom:10px;position:relative;
    background:linear-gradient(180deg,rgba(18,32,60,.78),rgba(9,16,34,.78));
    animation:sgw-in .34s cubic-bezier(.2,.8,.25,1) both}
  @keyframes sgw-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .sgw-card.is-locked{padding:9px;text-align:center;opacity:.16;animation:none;background:none}
  .sgw-lock{font-family:'Chakra Petch',monospace;letter-spacing:5px;font-size:12px;color:var(--sgw-dim)}
  .sgw-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:7px}
  .sgw-hd-sub{font-family:'Chakra Petch',monospace;font-size:9px;letter-spacing:2px;color:var(--sgw-dim)}
  .sgw-tag{font-family:'Chakra Petch',monospace;font-size:10px;letter-spacing:2.4px;color:${accent};
    border:1px solid ${accent}55;background:${accent}14;padding:2px 8px;border-radius:3px}
  .sgw-tag-quiet{color:#9db4d4;border-color:#9db4d444;background:#9db4d411}
  .sgw-tag-gold{color:#f0c05a;border-color:#f0c05a66;background:#f0c05a18}
  .sgw-tag-deal{color:#7ee0a8;border-color:#7ee0a866;background:#7ee0a814}
  .sgw-body{font-size:14px;line-height:1.62;color:var(--sgw-ink);margin:0}
  .sgw-flav{margin:9px 0 0;padding-top:7px;border-top:1px dashed rgba(140,175,225,.18);
    font-size:12px;letter-spacing:.4px;color:#7f96b8;font-style:italic}
  .sgw-faces{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
  .sgw-face-chip{display:flex;align-items:center;gap:5px;font-size:11.5px;letter-spacing:.6px;color:#c7d8f0;
    border:1px solid var(--sgw-line);border-radius:20px;padding:2px 9px 2px 2px}

  .sgw-haz{display:flex;align-items:center;gap:7px;font-family:'Chakra Petch',monospace;font-size:13px;
    letter-spacing:3px;padding:3px 10px;border-radius:4px;border:1px solid currentColor}
  .sgw-hi{width:17px;height:17px;flex:0 0 auto}
  .sgw-haz-water{color:#6fc9ff;background:rgba(111,201,255,.10)}
  .sgw-haz-wind{color:#b9d4ff;background:rgba(185,212,255,.09)}
  .sgw-haz-slime{color:#8fdc5a;background:rgba(143,220,90,.10)}
  .sgw-haz-tilt{color:#ffb057;background:rgba(255,176,87,.10)}
  .sgw-wave.is-water{border-color:rgba(111,201,255,.4);background:linear-gradient(180deg,rgba(14,44,74,.8),rgba(9,16,34,.8))}
  .sgw-wave.is-wind{border-color:rgba(185,212,255,.34);background:linear-gradient(100deg,rgba(24,40,72,.85),rgba(9,16,34,.75))}
  .sgw-wave.is-slime{border-color:rgba(143,220,90,.34);background:linear-gradient(180deg,rgba(24,50,28,.7),rgba(9,16,34,.8))}
  .sgw-wave.is-water::after,.sgw-wave.is-wind::after{content:'';position:absolute;inset:0;border-radius:10px;pointer-events:none}
  .sgw-wave.is-water::after{background:repeating-linear-gradient(96deg,rgba(150,215,255,.13) 0 1px,transparent 1px 8px);
    animation:sgw-rain 2.6s ease-in-out infinite alternate}
  .sgw-wave.is-wind::after{background:repeating-linear-gradient(178deg,rgba(200,225,255,.10) 0 1px,transparent 1px 14px);
    animation:sgw-rain 3.4s ease-in-out infinite alternate}
  .sgw-haz-line{color:#e6f0ff}

  .sgw-meters{display:flex;gap:14px;flex-wrap:wrap;margin:9px 0 4px}
  .sgw-meter{display:flex;align-items:center;gap:6px;font-family:'Chakra Petch',monospace;font-size:9px;letter-spacing:2px;color:var(--sgw-dim)}
  .sgw-meter i{font-style:normal}
  .sgw-meter u{text-decoration:none;color:#eaf3ff}
  .sgw-bar{display:inline-block;width:110px;height:5px;border-radius:3px;background:rgba(255,255,255,.09);overflow:hidden}
  .sgw-bar b{display:block;height:100%;background:linear-gradient(90deg,#ff9d4d,#ff5f5f)}
  .sgw-bar.is-alt b{background:linear-gradient(90deg,${accent},#8fd0ff)}

  .sgw-drops{display:flex;flex-direction:column;gap:7px;margin-top:8px}
  .sgw-drop{display:flex;gap:10px;align-items:flex-start;padding:8px 9px;border-radius:7px;
    border-left:3px solid ${accent};background:rgba(255,255,255,.035)}
  .sgw-drop.is-first{border-left-color:#ff8f5a;background:rgba(255,143,90,.07)}
  .sgw-drop.is-threw{border-left-color:#8b9bb2;background:rgba(139,155,178,.06);opacity:.9}
  .sgw-drop-tag{font-family:'Chakra Petch',monospace;font-size:8.5px;letter-spacing:2px;color:var(--sgw-dim);display:block;margin-bottom:3px}
  .sgw-drop-t p{margin:0;font-size:13.5px;line-height:1.55}

  .sgw-grind-b{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .sgw-grind{border-style:dashed}

  .sgw-deal{border-color:rgba(126,224,168,.4)}
  .sgw-deal.is-nodeal{border-color:rgba(255,120,110,.42)}
  .sgw-deal.is-nodeal .sgw-tag-deal{color:#ff8a80;border-color:#ff8a8066;background:#ff8a8014}
  .sgw-parley{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin:6px 0 10px}
  .sgw-parley-p{margin:0;text-align:center}
  .sgw-parley-p figcaption{font-family:'Chakra Petch',monospace;font-size:11px;letter-spacing:1.4px;color:#eaf3ff;margin-top:5px}
  .sgw-parley-p .bb-av{border-radius:50%;border:2px solid rgba(126,224,168,.6)}
  .sgw-deal.is-nodeal .sgw-parley-p .bb-av{border-color:rgba(255,138,128,.6)}
  .sgw-parley-mid{text-align:center;color:#7ee0a8}
  .sgw-deal.is-nodeal .sgw-parley-mid{color:#ff8a80}
  .sgw-shake{width:74px;height:46px;display:block;margin:0 auto;animation:sgw-shine 3.4s ease-in-out infinite alternate}
  @keyframes sgw-shine{from{filter:drop-shadow(0 0 2px currentColor);opacity:.75}to{filter:drop-shadow(0 0 12px currentColor);opacity:1}}
  .sgw-parley-k{font-family:'Chakra Petch',monospace;font-size:9px;letter-spacing:2.6px}
  .sgw-quote{margin:0;padding:10px 12px;border-left:3px solid currentColor;color:#e6f0ff;
    background:rgba(255,255,255,.04);font-size:14px;line-height:1.6;border-radius:0 7px 7px 0}

  .sgw-win{border-color:rgba(240,192,90,.5);overflow:hidden;
    background:linear-gradient(180deg,rgba(58,45,18,.55),rgba(10,16,34,.85))}
  .sgw-win-glow{position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(60% 90% at 22% 0%,rgba(255,225,160,.20),transparent 70%);
    animation:sgw-flood 4.5s ease-in-out infinite alternate}
  .sgw-win-b{display:flex;gap:14px;align-items:center;position:relative}
  .sgw-win-av .bb-av{border-radius:50%;border:3px solid #f0c05a;box-shadow:0 0 26px rgba(240,192,90,.55)}
  .sgw-win-n{font-family:'Chakra Petch',monospace;font-size:23px;letter-spacing:3px;color:#ffe9b0;margin-bottom:4px}

  .sgw-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -16px 0;background:linear-gradient(180deg,rgba(5,10,22,0),rgba(5,10,22,.96) 40%);
    backdrop-filter:blur(3px)}
  .sgw-count{font-family:'Chakra Petch',monospace;font-size:10px;letter-spacing:2.4px;color:var(--sgw-dim)}
  .sgw-done{font-family:'Chakra Petch',monospace;font-size:10px;letter-spacing:2.4px;color:${accent}}

  @media(max-width:700px){
    .sgw-strip{grid-template-columns:1fr 1fr}
    .sgw-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--sgw-line);padding:6px 0 0}
    .sgw-stage{height:230px}
    .sgw-peg{width:42px}
    .sgw-parley{grid-template-columns:1fr;gap:6px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigwall *,.sigwall *::before,.sigwall *::after{animation:none!important;transition:none!important}
    .sgw-peg.is-down{opacity:.62}
  }
  </style>

  <div class="sgw-eyebrow">WEEK ${E(ep.num)} &middot; NIGHT</div>
  <div class="sgw-title">${E(comp.name || 'THE WALL').toUpperCase()}</div>
  <div class="sgw-sub">${isHoh ? 'Head of Household' : 'Power of Veto'} &middot; last one still on the face takes it</div>

  <div class="sgw-what">
    <div class="sgw-what-h"><span class="sgw-what-c">${E(cat.label)}</span><b>${E(comp.name || 'The Wall')}</b></div>
    ${comp.desc ? `<p class="sgw-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="sgw-w">${weights.map(([k, w]) =>
      `<span><em>${E(k)}</em><s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="sgw-what-d">Sat out: ${
      (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
      isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${wall}
  ${strip}
  <div class="sgw-cards">${cards}</div>

  <div class="sgw-ctrl">
    ${done ? '<span class="sgw-done">EVERYBODY IS OFF THE WALL.</span>' : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}">${
        state.idx < 0 ? 'Start the night' : 'Next wave'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="sgw-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
