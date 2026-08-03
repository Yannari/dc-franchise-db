// ══════════════════════════════════════════════════════════════════════
// vp-bb-battle-back.js — "The Door"
//
// The themed Viewer's Pass screen for the Battle Back twist in
// js/bb/battle-back.js. It renders the act, and only the act.
//
// The whole screen is one location: a floodlit outdoor lot at night, chain
// link on three sides, wet asphalt, sodium lamps that make everybody the same
// colour — and one warm lit doorway at the far end, the only warm thing on
// screen, belonging to a house that already voted every person out here away.
// Nothing in this file is warm except that door and whoever the house sends to
// stand in front of it.
//
// Two shapes, drawn differently:
//   gauntlet   a vertical ladder. The first evictee stands at the bottom and
//              has to climb through everybody who followed them out. Rungs
//              light as the rounds reveal.
//   showdown   a heat row, a head-to-head, and then a confrontation panel
//              against the house's elected CHAMPION — who is rendered in the
//              doorway's warm colour, because they came from inside.
//
// Every result sentence on this screen is the engine's own beats[].text. The
// only prose authored here is connective atmosphere, picked DETERMINISTICALLY
// from ep.num plus a step index — the reveal handler rebuilds the entire
// screen on every click, so two builds at the same idx must be byte-identical
// or the viewer watches the narration reshuffle itself.
//
// Interactivity is u.reveal() and nothing else. No imports, no window globals,
// no exported handlers. Everything is gated on _tvState[stateKey].idx, so a
// screen at idx -1 shows a dark door, a full field, and no way to read the
// ending off the DOM.
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {object} ep  episode / week record (needs .num, .acts, optional ._seg)
 * @param {object} u   { tvState, reveal, avatar, esc }
 * @returns {string} html, or '' when this episode has no battle back
 */
export function rpBuildBBBattleBack(ep, u) {
  const act = (ep?.acts || []).find(a => a.type === 'battle-back');
  if (!act) return '';

  const E = v => u.esc(v == null ? '' : String(v));
  const AV = (n, px) => (n ? u.avatar(n, px) : '');

  const stateKey = `bb_battleback_${ep.num}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const isShowdown = act.style === 'showdown';
  const contenders = (act.contenders || []).filter(Boolean);
  const rounds = (act.rounds || []).filter(Boolean);
  const weeksOut = act.weeksOut || {};
  const returned = act.returned || null;
  const champion = act.champion || null;

  // ── deterministic flavour ──────────────────────────────────────────────
  // No Math.random in this file, ever. Salt is the step index.
  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 29 + salt * 13 + pool.length) % pool.length];

  const OPEN_LINES = [
    'The lot smells of rain and generator diesel. Somebody has swept the standing water off the mat and it is already coming back.',
    'Nobody out here has slept in a bed with a microphone over it for a while, and every one of them can see the door from where they are standing.',
    'Chain link on three sides, one wall on the fourth, and a light on in it. That is the whole geography of the night.',
    'The crew does not talk to them. They stopped being houseguests the second the vote landed, and the lot is very clear about that.',
    'Cold lamps, wet asphalt, and a group of people who all know exactly which week they left in.',
  ];
  const ROUND_LINES = [
    'The lamps buzz through it. Nobody in the lot says a word until it is decided.',
    'Two people who were on the same side of a vote once, being asked to end each other in a car park.',
    'Somewhere behind that wall the house is watching this on a screen and saying nothing useful about it.',
    'The mat is soaked by now. Neither of them mentions it.',
    'It is quieter out here than any competition inside ever is. That makes it worse.',
  ];
  const HEAT_LINES = [
    'Everybody runs it at once, which means everybody watches everybody else fail in real time.',
    'One heat, one shot, and no second look at the leaderboard afterwards.',
    'The whole field on the mat together for the last time tonight.',
    'No brackets, no seeding, no mercy for whoever left first — the clock does not care how long you have been out here.',
  ];
  const VOTE_LINES = [
    'The house does not get to vote on much twice. It gets to vote on this.',
    'Somebody inside is about to be handed a job they did not ask for and cannot refuse in front of everybody.',
    'The room picks the person it thinks can win, which is never quite the person it likes most.',
    'A vote taken indoors, in the warm, about who has to come outside.',
  ];
  const CHAMP_LINES = [
    'The champion comes out of the door and stands in front of it, which is the entire point of the image.',
    'One of them has been sleeping inside. The other has been on the outside long enough to have learned the flight home.',
    'The lot has never seen somebody arrive from that direction before.',
    'For one round only, the house has a body in the fight.',
  ];
  const DOOR_OPEN_LINES = [
    'The door opens and the light off it is the first warm thing anybody out here has stood in for weeks.',
    'It swings in, not out, which somehow makes it worse for everybody watching from the sofas.',
    'The lamps in the lot look grey the moment the doorway is lit, and they were grey the whole time.',
    'One person walks toward the light and the rest of the lot stands in the dark watching them do it.',
  ];
  const DOOR_SHUT_LINES = [
    'The door stays shut. The lot lights go off one bank at a time and nobody inside has to explain anything.',
    'Nothing opens. The house gets to keep the exact season it voted for.',
    'It ends with a closed door and a very long drive to an airport.',
    'The wall stays a wall. Somewhere inside, everybody exhales at once.',
  ];

  // ── beat lookup ────────────────────────────────────────────────────────
  // Beats are matched by their own badge, never by position, so an engine that
  // grows a beat in the middle degrades into an unused beat rather than a card
  // captioned with the wrong sentence.
  const beats = (act.beats || []).filter(b => b && b.text);
  const tag = b => String(b?.badgeText || '').toUpperCase().trim();
  const findTag = t => beats.find(b => tag(b) === t) || null;

  const openBeat = findTag('BATTLE BACK') || beats[0] || null;
  const topTwoBeat = findTag('TOP TWO');
  const champBeat = findTag('THE CHAMPION');
  const heldBeat = findTag('DOOR HELD');
  const returnBeat = findTag('BACK IN THE HOUSE');
  const outBeats = beats.filter(b => tag(b) === 'ELIMINATED');
  const outFor = n => outBeats.find(b => (b.players || [])[0] === n) || null;

  // Duel narration: the two-hander that is not the champion walk-out and not
  // the door-held card. Consumed as it is matched so a repeated pairing in a
  // long gauntlet cannot borrow an earlier round's sentence.
  const usedDuel = new Set();
  const duelBeat = (a, b2) => {
    const hit = beats.find((x, i) => {
      if (usedDuel.has(i)) return false;
      const t = tag(x);
      if (t === 'THE CHAMPION' || t === 'DOOR HELD' || t === 'ELIMINATED' || t === 'BATTLE BACK' || t === 'TOP TWO') return false;
      const p = x.players || [];
      return p.length === 2 && p.includes(a) && p.includes(b2);
    });
    if (!hit) return null;
    usedDuel.add(beats.indexOf(hit));
    return hit;
  };

  // ── steps ──────────────────────────────────────────────────────────────
  const heatRound = rounds.find(r => r.kind === 'heat') || null;
  const duelRounds = rounds.filter(r => r.kind === 'duel');
  // In a showdown WITH a champion the last duel is the door itself. With no
  // champion — an empty house — the engine never runs that duel and the winner
  // of the head-to-head simply walks, so the door step carries no round. In a
  // gauntlet the door is always the aftermath of the last duel.
  const doorRound = isShowdown && champion
    ? (duelRounds.find(r => String(r.label || '').toUpperCase() === 'THE DOOR') || duelRounds[duelRounds.length - 1] || null)
    : null;
  const ladderRounds = isShowdown ? duelRounds.filter(r => r !== doorRound) : duelRounds;

  const steps = [];
  if (openBeat) steps.push({ kind: 'open', beat: openBeat, out: [] });

  if (isShowdown && heatRound) {
    const res = (heatRound.results || []).filter(Boolean);
    const knocked = res.slice(2).map(r => r.name).filter(Boolean);
    steps.push({ kind: 'heat', round: heatRound, beat: topTwoBeat, out: knocked });
  }

  ladderRounds.forEach((r, i) => {
    const loser = r.winner === r.a ? r.b : r.a;
    steps.push({ kind: 'duel', round: r, beat: duelBeat(r.a, r.b), out: [loser], no: i + 1 });
  });

  if (isShowdown && champion) steps.push({ kind: 'vote', beat: champBeat, out: [] });

  // The closer. Either the door opens for somebody or the champion holds it.
  const doorLoser = doorRound && doorRound.winner ? (doorRound.winner === doorRound.a ? doorRound.b : doorRound.a) : null;
  steps.push({
    kind: 'door', round: doorRound,
    beat: returned ? returnBeat : (heldBeat || null),
    out: returned ? [] : (doorLoser ? [doorLoser] : []),
  });

  const total = steps.length;
  // Clamped both ways: a stale idx from a longer act must not run off the end.
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;

  // Who is gone, resolved only from revealed steps — so the standing count and
  // every struck-through name are gated for free.
  const goneNow = new Set();
  steps.slice(0, revealed).forEach(s => (s.out || []).forEach(n => goneNow.add(n)));
  const standing = Math.max(0, contenders.length - goneNow.size);

  const doorRevealed = revealed >= total && total > 0;
  const doorOpen = doorRevealed && !!returned;

  // ── small parts ────────────────────────────────────────────────────────
  const days = n => {
    const w = Math.max(0, Number(weeksOut[n]) || 0);
    return w <= 0 ? 'OUT TONIGHT' : `${w * 7} DAYS OUTSIDE`;
  };
  const score = (r, n) => {
    const v = r?.scores?.[n];
    return typeof v === 'number' && isFinite(v) ? v.toFixed(2) : '--';
  };
  const chip = (n, cls = '') => `<span class="bbbb-chip ${cls}">${AV(n, 24)}<b>${E(n)}</b></span>`;

  // ── the lot ────────────────────────────────────────────────────────────
  const lot = `<figure class="bbbb-lot ${doorOpen ? 'is-open' : ''}">
    <svg class="bbbb-lot-svg" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="bbbb-g-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0b1119"/><stop offset="1" stop-color="#182430"/>
        </linearGradient>
        <linearGradient id="bbbb-g-tar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1a222c"/><stop offset="1" stop-color="#080c12"/>
        </linearGradient>
        <linearGradient id="bbbb-g-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffb45c" stop-opacity="0.26"/><stop offset="1" stop-color="#ffb45c" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="bbbb-g-door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe1a3"/><stop offset="1" stop-color="#ff9f2e"/>
        </linearGradient>
        <linearGradient id="bbbb-g-spill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffcb6b" stop-opacity="0.5"/><stop offset="1" stop-color="#ffcb6b" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1000" height="196" fill="url(#bbbb-g-sky)"/>
      <rect x="0" y="196" width="1000" height="104" fill="url(#bbbb-g-tar)"/>
      <polygon class="bbbb-cone" points="118,26 172,26 250,196 40,196" fill="url(#bbbb-g-cone)"/>
      <polygon class="bbbb-cone bbbb-cone-b" points="828,26 882,26 960,196 750,196" fill="url(#bbbb-g-cone)"/>
      <rect x="316" y="58" width="368" height="138" fill="#111823" stroke="#33465c" stroke-width="2"/>
      <rect x="316" y="58" width="368" height="9" fill="#1b2735"/>
      <polygon class="bbbb-spill" points="452,196 548,196 660,300 340,300" fill="url(#bbbb-g-spill)"/>
      <rect class="bbbb-doorway" x="452" y="98" width="96" height="98" fill="url(#bbbb-g-door)"/>
      <rect class="bbbb-doorshut" x="452" y="98" width="96" height="98" fill="#0d131b" stroke="#3a4f66" stroke-width="2"/>
      <g stroke="#3c4f64" stroke-width="5" stroke-linecap="round">
        <line x1="145" y1="196" x2="145" y2="30"/><line x1="855" y1="196" x2="855" y2="30"/>
        <line x1="145" y1="34" x2="176" y2="26"/><line x1="855" y1="34" x2="824" y2="26"/>
      </g>
      <g class="bbbb-lamp" fill="#ffcf8a">
        <ellipse cx="183" cy="25" rx="20" ry="8"/><ellipse cx="817" cy="25" rx="20" ry="8"/>
      </g>
      <g class="bbbb-wet" fill="#8fb6d8" fill-opacity="0.14">
        <ellipse cx="230" cy="262" rx="96" ry="11"/><ellipse cx="770" cy="248" rx="78" ry="9"/>
        <ellipse cx="500" cy="284" rx="150" ry="13"/>
      </g>
    </svg>
    <div class="bbbb-mesh" aria-hidden="true"></div>
    <div class="bbbb-glow" aria-hidden="true"></div>
    ${doorOpen ? `<div class="bbbb-walker"><span class="bbbb-walker-av">${AV(returned, 46)}</span><span class="bbbb-walker-n">${E(returned)}</span></div>` : ''}
    <figcaption class="bbbb-lot-cap">${doorOpen ? 'THE DOOR IS OPEN' : doorRevealed ? 'THE DOOR STAYED SHUT' : 'THE LOT'}</figcaption>
  </figure>`;

  // ── the strip ──────────────────────────────────────────────────────────
  const strip = `<div class="bbbb-strip">
    <div class="bbbb-strip-l">
      <span class="bbbb-k">STILL FIGHTING</span>
      <span class="bbbb-v"><b>${standing}</b><i>/ ${contenders.length}</i></span>
    </div>
    <div class="bbbb-strip-m">
      <span class="bbbb-k">ROUNDS</span>
      <span class="bbbb-v"><b>${Math.min(rounds.length, steps.slice(0, revealed).filter(s => s.kind === 'heat' || s.kind === 'duel' || (s.kind === 'door' && s.round)).length)}</b><i>/ ${rounds.length}</i></span>
    </div>
    <div class="bbbb-strip-r">
      <span class="bbbb-k">${doorRevealed ? 'RESULT' : 'IN THE LOT'}</span>
      ${doorRevealed
        ? `<span class="bbbb-v bbbb-v-txt ${returned ? 'is-warm' : 'is-cold'}">${returned ? `${E(returned)} IS BACK IN` : 'NOBODY RE-ENTERS'}</span>`
        : `<span class="bbbb-live">${contenders.filter(n => !goneNow.has(n)).map(n => chip(n)).join('')}${
            contenders.filter(n => goneNow.has(n)).map(n => chip(n, 'is-out')).join('')}</span>`}
    </div>
  </div>`;

  // ── set piece ──────────────────────────────────────────────────────────
  let piece = '';
  if (!isShowdown) {
    // The ladder. Bottom rung is the first person evicted this season, because
    // they are the one who has to climb through everybody who followed them.
    const rowsHtml = [];
    for (let i = contenders.length - 1; i >= 0; i--) {
      const n = contenders[i];
      const isGone = goneNow.has(n);
      const isBack = doorOpen && returned === n;
      rowsHtml.push(`<div class="bbbb-rung ${isGone ? 'is-gone' : ''} ${isBack ? 'is-back' : ''}">
        <span class="bbbb-rung-no">${i === 0 ? 'FIRST OUT' : `#${i + 1}`}</span>
        <span class="bbbb-rung-av">${AV(n, 34)}</span>
        <span class="bbbb-rung-n">${E(n)}</span>
        <span class="bbbb-stamp">${E(days(n))}</span>
      </div>`);
      if (i > 0) {
        const r = ladderRounds[i - 1];
        const stepIdx = steps.findIndex(s => s.kind === 'duel' && s.round === r);
        const lit = stepIdx >= 0 && stepIdx < revealed;
        rowsHtml.push(`<div class="bbbb-step ${lit ? 'is-lit' : ''}">
          <span class="bbbb-step-l">${E(r?.label || `ROUND ${i}`)}</span>
          <span class="bbbb-step-w">${lit && r?.winner ? `${E(r.winner)} climbs` : 'not yet fought'}</span>
        </div>`);
      }
    }
    piece = `<section class="bbbb-piece bbbb-ladder">
      <header class="bbbb-piece-h"><span class="bbbb-piece-t">THE GAUNTLET</span>
        <span class="bbbb-piece-s">climb it in eviction order &middot; ${contenders.length} in the lot</span></header>
      <div class="bbbb-ladder-b"><div class="bbbb-rail" aria-hidden="true"></div>${rowsHtml.join('')}</div>
    </section>`;
  } else {
    const heatRes = (heatRound?.results || []).filter(Boolean);
    const heatStepIdx = steps.findIndex(s => s.kind === 'heat');
    const heatLit = heatStepIdx >= 0 && heatStepIdx < revealed;
    const finalRound = ladderRounds[ladderRounds.length - 1] || null;
    const finalStepIdx = steps.findIndex(s => s.kind === 'duel' && s.round === finalRound);
    const finalLit = finalStepIdx >= 0 && finalStepIdx < revealed;
    const voteStepIdx = steps.findIndex(s => s.kind === 'vote');
    const voteLit = voteStepIdx >= 0 && voteStepIdx < revealed;

    const heatCells = (heatLit ? heatRes.map(r => r.name) : contenders).map((n, i) => {
      const gone = goneNow.has(n);
      return `<div class="bbbb-heat-c ${gone ? 'is-gone' : ''} ${heatLit && i < 2 ? 'is-adv' : ''}">
        <span class="bbbb-pos">${heatLit ? `${i + 1}` : '--'}</span>
        ${AV(n, 32)}
        <span class="bbbb-heat-n">${E(n)}</span>
        <span class="bbbb-stamp">${E(days(n))}</span>
      </div>`;
    }).join('');

    const fa = finalRound?.a, fb = finalRound?.b;
    const h2h = `<div class="bbbb-h2h">
      <div class="bbbb-slot ${finalLit && finalRound.winner === fa ? 'is-win' : finalLit ? 'is-gone' : ''}">
        ${heatLit ? `${AV(fa, 40)}<b>${E(fa)}</b>` : '<span class="bbbb-tbd">TBD</span>'}
      </div>
      <span class="bbbb-vs">VS</span>
      <div class="bbbb-slot ${finalLit && finalRound.winner === fb ? 'is-win' : finalLit ? 'is-gone' : ''}">
        ${heatLit ? `${AV(fb, 40)}<b>${E(fb)}</b>` : '<span class="bbbb-tbd">TBD</span>'}
      </div>
    </div>`;

    const survivor = doorRound ? doorRound.a : (finalRound?.winner || null);
    const champName = champion?.name || null;
    const lotSide = `<div class="bbbb-conf-side is-cold">
      <span class="bbbb-conf-k">FROM THE LOT</span>
      ${finalLit && survivor ? `${AV(survivor, 44)}<b>${E(survivor)}</b>` : '<span class="bbbb-tbd">TBD</span>'}
      ${doorRevealed && returned ? '<span class="bbbb-conf-r is-warm">WALKS IN</span>'
        : doorRevealed ? '<span class="bbbb-conf-r">BEATEN AT THE DOOR</span>' : ''}
    </div>`;
    // No champion means the house never got a body in the fight, so there is
    // nothing warm to draw opposite — just an unguarded door.
    const conf = `<div class="bbbb-conf ${doorRevealed ? 'is-done' : ''} ${champName ? '' : 'is-solo'}">
      ${lotSide}
      <div class="bbbb-conf-door" aria-hidden="true"><span></span></div>
      <div class="bbbb-conf-side is-warm">
        <span class="bbbb-conf-k">${champName ? 'FROM THE HOUSE' : 'THE HOUSE'}</span>
        ${champName
          ? (voteLit ? `${AV(champName, 44)}<b>${E(champName)}</b>` : '<span class="bbbb-tbd">ELECTED LATER</span>')
          : '<span class="bbbb-tbd">NOBODY DEFENDS</span>'}
        ${champName && doorRevealed ? `<span class="bbbb-conf-r ${returned ? '' : 'is-warm'}">${
          returned ? 'DOOR LOST' : 'HELD THE DOOR'}</span>` : ''}
      </div>
    </div>`;

    piece = `<section class="bbbb-piece bbbb-board">
      <header class="bbbb-piece-h"><span class="bbbb-piece-t">THE SHOWDOWN</span>
        <span class="bbbb-piece-s">one heat &middot; a head-to-head &middot; then the house's champion</span></header>
      <div class="bbbb-lane"><span class="bbbb-lane-k">HEAT</span><div class="bbbb-heat">${heatCells}</div></div>
      <div class="bbbb-lane"><span class="bbbb-lane-k">HEAD TO HEAD</span>${h2h}</div>
      <div class="bbbb-lane"><span class="bbbb-lane-k">THE DOOR</span>${conf}</div>
    </section>`;
  }

  // ── cards ──────────────────────────────────────────────────────────────
  const outCard = n => {
    const b = outFor(n);
    return `<div class="bbbb-out">${AV(n, 30)}<div><span class="bbbb-out-k">ELIMINATED FOR GOOD</span>
      <p>${b ? E(b.text) : `${E(n)} is finished — evicted once, and now beaten for the right to argue about it.`}</p></div></div>`;
  };

  const cards = steps.map((s, i) => {
    if (i > state.idx) return `<div class="bbbb-card is-locked"><span class="bbbb-lock">&mdash;</span></div>`;

    if (s.kind === 'open') {
      return `<article class="bbbb-card bbbb-open">
        <header class="bbbb-hd"><span class="bbbb-tag">${E(s.beat.badgeText || 'BATTLE BACK')}</span>
          <span class="bbbb-hd-s">${contenders.length} in the lot</span></header>
        <p class="bbbb-body">${E(s.beat.text)}</p>
        <div class="bbbb-chips">${contenders.map(n =>
          `<span class="bbbb-chip is-big">${AV(n, 28)}<b>${E(n)}</b><i>${E(days(n))}</i></span>`).join('')}</div>
        <p class="bbbb-flav">${E(flav(OPEN_LINES, i))}</p>
      </article>`;
    }

    if (s.kind === 'heat') {
      const res = (s.round.results || []).filter(Boolean);
      const top = res[0]?.score;
      return `<article class="bbbb-card bbbb-heatcard">
        <header class="bbbb-hd"><span class="bbbb-tag">${E(s.beat?.badgeText || s.round.label || 'HEAT')}</span>
          <span class="bbbb-hd-s">everybody at once &middot; top two survive</span></header>
        <div class="bbbb-table">
          ${res.map((r, k) => {
            const w = typeof r.score === 'number' && typeof top === 'number' && top > 0
              ? Math.max(4, Math.round((r.score / top) * 100)) : 4;
            return `<div class="bbbb-row ${k < 2 ? 'is-adv' : 'is-gone'}">
              <span class="bbbb-pos">${k + 1}</span>${AV(r.name, 28)}
              <span class="bbbb-row-n">${E(r.name)}</span>
              <span class="bbbb-bar"><b style="width:${w}%"></b></span>
              <span class="bbbb-num">${typeof r.score === 'number' && isFinite(r.score) ? r.score.toFixed(2) : '--'}</span>
            </div>`;
          }).join('')}
        </div>
        ${s.beat ? `<p class="bbbb-body">${E(s.beat.text)}</p>` : ''}
        ${(s.out || []).map(outCard).join('')}
        <p class="bbbb-flav">${E(flav(HEAT_LINES, i))}</p>
      </article>`;
    }

    if (s.kind === 'duel') {
      const r = s.round;
      const loser = r.winner === r.a ? r.b : r.a;
      const side = n => `<figure class="bbbb-duel-p ${n === r.winner ? 'is-win' : 'is-lose'}">
        ${AV(n, 56)}<figcaption>${E(n)}</figcaption>
        <span class="bbbb-num">${score(r, n)}</span>
        <span class="bbbb-stamp">${E(days(n))}</span></figure>`;
      return `<article class="bbbb-card bbbb-duelcard">
        <header class="bbbb-hd"><span class="bbbb-tag">${E(r.label || `ROUND ${s.no}`)}</span>
          <span class="bbbb-hd-s">winner stays in the lot</span></header>
        <div class="bbbb-duel">${side(r.a)}<span class="bbbb-vs">VS</span>${side(r.b)}</div>
        ${s.beat ? `<p class="bbbb-body">${E(s.beat.text)}</p>` : ''}
        ${outCard(loser)}
        <p class="bbbb-flav">${E(flav(ROUND_LINES, i))}</p>
      </article>`;
    }

    if (s.kind === 'vote') {
      const tally = champion?.tally && typeof champion.tally === 'object' ? champion.tally : {};
      const ranked = Object.entries(tally).filter(([, v]) => typeof v === 'number').sort((a, b) => b[1] - a[1]);
      const cast = ranked.reduce((t, [, v]) => t + v, 0);
      const topV = ranked.length ? ranked[0][1] : 1;
      return `<article class="bbbb-card bbbb-votecard">
        <header class="bbbb-hd"><span class="bbbb-tag is-warm">${E(s.beat?.badgeText || 'THE CHAMPION')}</span>
          <span class="bbbb-hd-s">${champion?.votes || 0}${cast ? ` of ${cast}` : ''} &middot; elected indoors</span></header>
        <div class="bbbb-champ">
          <figure class="bbbb-champ-av">${AV(champion?.name, 62)}<figcaption>${E(champion?.name)}</figcaption></figure>
          <div class="bbbb-tally">
            ${ranked.map(([n, v]) => `<div class="bbbb-tl ${n === champion?.name ? 'is-top' : ''}">
              <span class="bbbb-tl-n">${E(n)}</span>
              <span class="bbbb-bar"><b style="width:${Math.max(6, Math.round((v / (topV || 1)) * 100))}%"></b></span>
              <span class="bbbb-num">${v}</span></div>`).join('') || '<div class="bbbb-tl"><span class="bbbb-tl-n">no ballots recorded</span></div>'}
          </div>
        </div>
        ${s.beat ? `<p class="bbbb-body">${E(s.beat.text)}</p>` : ''}
        <p class="bbbb-flav">${E(flav(VOTE_LINES, i))} ${E(flav(CHAMP_LINES, i + 1))}</p>
      </article>`;
    }

    // ── the door ──
    const r = s.round;
    const grudges = (act.grudges || []).filter(Boolean);
    const allies = (act.allies || []).filter(Boolean);
    return `<article class="bbbb-card bbbb-doorcard ${returned ? 'is-open' : 'is-shut'}">
      <div class="bbbb-doorglow" aria-hidden="true"></div>
      <header class="bbbb-hd"><span class="bbbb-tag ${returned ? 'is-warm' : 'is-red'}">${
        E(s.beat?.badgeText || (returned ? 'BACK IN THE HOUSE' : 'DOOR HELD'))}</span>
        <span class="bbbb-hd-s">${r ? `${E(r.label || 'THE DOOR')} &middot; ${E(r.a)} ${score(r, r.a)} &mdash; ${score(r, r.b)} ${E(r.b)}` : 'the last one standing'}</span></header>
      <div class="bbbb-door-b">
        <figure class="bbbb-door-av ${returned ? 'is-warm' : ''}">${AV(returned || champion?.name || (r ? r.winner : null), 76)}</figure>
        <div>
          <div class="bbbb-door-n">${E(returned || champion?.name || (r ? r.winner : '') || '')}</div>
          ${s.beat ? `<p class="bbbb-body">${E(s.beat.text)}</p>` : `<p class="bbbb-body">${returned
            ? `${E(returned)} walks back into the house with no immunity and no head start.`
            : 'Nobody re-enters this house tonight.'}</p>`}
        </div>
      </div>
      ${returned && grudges.length ? `<div class="bbbb-know">
        <span class="bbbb-know-k">THEY KNOW &mdash; VOTED TO EVICT ${E(String(returned).toUpperCase())}</span>
        <div class="bbbb-chips">${grudges.map(n => chip(n, 'is-grudge')).join('')}</div>
      </div>` : ''}
      ${returned && allies.length ? `<div class="bbbb-know is-soft">
        <span class="bbbb-know-k">KEPT THEM</span>
        <div class="bbbb-chips">${allies.map(n => chip(n, 'is-ally')).join('')}</div>
      </div>` : ''}
      ${(s.out || []).map(outCard).join('')}
      <p class="bbbb-flav">${E(flav(returned ? DOOR_OPEN_LINES : DOOR_SHUT_LINES, i))}</p>
    </article>`;
  }).join('');

  const compName = act.competition?.name || '';

  // ── shell ──────────────────────────────────────────────────────────────
  return `<div class="rp-page bb-room bb-block bbbb">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Public+Sans:ital,wght@0,400;0,600;1,400&display=swap');
  .bbbb{--bbbb-ink:#cddced;--bbbb-dim:#7c8ea6;--bbbb-line:rgba(130,160,195,.20);
    --bbbb-amber:#ffa63d;--bbbb-warm:#ffcb6b;--bbbb-cold:#7fa0c4;
    max-width:1100px;margin:0 auto;padding:18px 16px 0;border-radius:12px;position:relative;overflow:hidden;
    font-family:'Public Sans',system-ui,sans-serif;color:var(--bbbb-ink);
    background:radial-gradient(130% 90% at 50% 108%,#1d2a38 0%,#111a25 45%,#070b11 100%)}
  .bbbb::before{content:'';position:absolute;inset:46px 0 0;pointer-events:none;
    background:radial-gradient(50% 30% at 18% 4%,rgba(255,178,90,.10),transparent 70%),
               radial-gradient(50% 30% at 82% 4%,rgba(255,178,90,.09),transparent 70%);
    animation:bbbb-buzz 5.5s ease-in-out infinite alternate}
  @keyframes bbbb-buzz{from{opacity:.5}to{opacity:1}}

  .bbbb-eyebrow{font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:4px;color:var(--bbbb-dim);text-align:center}
  .bbbb-title{font-family:'Oswald',sans-serif;font-weight:600;font-size:34px;letter-spacing:9px;text-align:center;
    color:#e9f1fa;margin:2px 0 0;text-shadow:0 0 26px rgba(255,166,61,.28);
    animation:bbbb-sodium 7s ease-in-out infinite alternate}
  @keyframes bbbb-sodium{from{text-shadow:0 0 12px rgba(255,166,61,.18)}to{text-shadow:0 0 34px rgba(255,166,61,.46)}}
  .bbbb-sub{text-align:center;font-size:12.5px;letter-spacing:1.6px;color:var(--bbbb-dim);margin:4px 0 14px}
  .bbbb-sub em{font-style:normal;color:var(--bbbb-warm)}

  .bbbb-lot{position:relative;margin:0 0 12px;height:250px;border-radius:10px;overflow:hidden;
    border:1px solid var(--bbbb-line);background:#070b11}
  .bbbb-lot-svg{position:absolute;inset:0;width:100%;height:100%}
  .bbbb-cone{animation:bbbb-cone 6.5s ease-in-out infinite alternate}
  .bbbb-cone-b{animation-duration:8.5s;animation-delay:-3s}
  @keyframes bbbb-cone{from{opacity:.5}to{opacity:1}}
  .bbbb-lamp{animation:bbbb-lamp 4.2s ease-in-out infinite alternate}
  @keyframes bbbb-lamp{from{opacity:.65;filter:drop-shadow(0 0 4px #ffb45c)}to{opacity:1;filter:drop-shadow(0 0 16px #ffb45c)}}
  .bbbb-wet{animation:bbbb-cone 5s ease-in-out infinite alternate}
  .bbbb-doorway{opacity:0}
  .bbbb-spill{opacity:0}
  .bbbb-lot.is-open .bbbb-doorshut{opacity:0}
  .bbbb-lot.is-open .bbbb-doorway{opacity:1;animation:bbbb-doorlight 1s ease-out both,bbbb-doorpulse 5s ease-in-out 1s infinite alternate}
  .bbbb-lot.is-open .bbbb-spill{opacity:1;animation:bbbb-doorlight 1.1s ease-out both}
  @keyframes bbbb-doorlight{from{opacity:0}to{opacity:1}}
  @keyframes bbbb-doorpulse{from{filter:drop-shadow(0 0 6px rgba(255,190,100,.5))}to{filter:drop-shadow(0 0 26px rgba(255,190,100,.85))}}
  .bbbb-mesh{position:absolute;inset:0;pointer-events:none;opacity:.5;
    background-image:repeating-linear-gradient(46deg,rgba(158,186,214,.14) 0 1px,transparent 1px 15px),
                     repeating-linear-gradient(-46deg,rgba(158,186,214,.14) 0 1px,transparent 1px 15px)}
  .bbbb-glow{position:absolute;inset:0;pointer-events:none;opacity:0;
    background:radial-gradient(38% 46% at 50% 62%,rgba(255,190,110,.30),transparent 72%)}
  .bbbb-lot.is-open .bbbb-glow{opacity:1;animation:bbbb-buzz 4.5s ease-in-out infinite alternate}
  .bbbb-walker{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);text-align:center;
    animation:bbbb-walk 1.05s cubic-bezier(.2,.75,.3,1) both}
  @keyframes bbbb-walk{from{transform:translate(-50%,10%) scale(.7);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
  .bbbb-walker-av .bb-av{border-radius:50%;border:2px solid #ffe1a3;box-shadow:0 0 26px rgba(255,203,107,.8)}
  .bbbb-walker-n{display:block;font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:2.4px;
    color:#ffe6bb;margin-top:4px;text-shadow:0 1px 4px #000}
  .bbbb-lot-cap{position:absolute;left:10px;bottom:7px;font-family:'Oswald',sans-serif;
    font-size:9px;letter-spacing:3.4px;color:rgba(160,190,220,.6)}
  .bbbb-lot.is-open .bbbb-lot-cap{color:rgba(255,214,150,.85)}

  .bbbb-strip{position:sticky;top:46px;z-index:6;display:grid;grid-template-columns:.8fr .8fr 2fr;gap:10px;
    padding:8px 11px;margin-bottom:14px;border:1px solid var(--bbbb-line);border-radius:8px;
    background:rgba(9,14,21,.94);backdrop-filter:blur(4px)}
  .bbbb-strip>div{display:flex;flex-direction:column;gap:3px;min-width:0}
  .bbbb-k{font-family:'Oswald',sans-serif;font-size:8.5px;letter-spacing:2.6px;color:var(--bbbb-dim)}
  .bbbb-v{font-family:'Oswald',sans-serif;font-size:20px;letter-spacing:1px;color:#e9f1fa;display:flex;align-items:baseline;gap:5px}
  .bbbb-v i{font-style:normal;font-size:11px;color:var(--bbbb-dim)}
  .bbbb-v b{color:var(--bbbb-amber)}
  .bbbb-v-txt{font-size:14px;letter-spacing:2.2px}
  .bbbb-v-txt.is-warm{color:var(--bbbb-warm)}
  .bbbb-v-txt.is-cold{color:#8fa6bf}
  .bbbb-strip-r{border-left:1px solid var(--bbbb-line);padding-left:11px}
  .bbbb-live{display:flex;gap:5px;flex-wrap:wrap}

  .bbbb-chip{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;letter-spacing:.5px;color:#c2d4e8;
    border:1px solid var(--bbbb-line);border-radius:20px;padding:2px 9px 2px 2px}
  .bbbb-chip .bb-av{border-radius:50%}
  .bbbb-chip.is-out{opacity:.4}
  .bbbb-chip.is-out b{text-decoration:line-through}
  .bbbb-chip.is-big{padding:3px 11px 3px 3px;font-size:12.5px}
  .bbbb-chip.is-big i{font-style:normal;font-family:'Oswald',sans-serif;font-size:8.5px;letter-spacing:1.6px;color:var(--bbbb-dim)}
  .bbbb-chip.is-grudge{border-color:rgba(248,81,73,.55);color:#ffb3ae;background:rgba(248,81,73,.09)}
  .bbbb-chip.is-ally{border-color:rgba(127,200,160,.4);color:#a9dcc2;background:rgba(127,200,160,.07)}

  .bbbb-piece{border:1px solid var(--bbbb-line);border-radius:10px;padding:12px;margin-bottom:14px;
    background:linear-gradient(180deg,rgba(22,32,45,.72),rgba(9,14,21,.72))}
  .bbbb-piece-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}
  .bbbb-piece-t{font-family:'Oswald',sans-serif;font-size:15px;letter-spacing:5px;color:#e3edf8}
  .bbbb-piece-s{font-size:11.5px;letter-spacing:.6px;color:var(--bbbb-dim)}
  .bbbb-stamp{font-family:'Oswald',sans-serif;font-size:8px;letter-spacing:2px;color:#8fa3ba;
    border:1px dashed rgba(150,180,210,.35);border-radius:3px;padding:1px 5px;white-space:nowrap}

  .bbbb-ladder-b{position:relative;padding-left:26px}
  .bbbb-rail{position:absolute;left:11px;top:6px;bottom:6px;width:2px;background:linear-gradient(180deg,rgba(255,166,61,.5),rgba(120,150,185,.18))}
  .bbbb-rung{display:flex;align-items:center;gap:9px;padding:6px 9px;border:1px solid var(--bbbb-line);
    border-radius:7px;background:rgba(255,255,255,.03);position:relative}
  .bbbb-rung::before{content:'';position:absolute;left:-15px;top:50%;width:15px;height:2px;background:rgba(140,170,205,.4)}
  .bbbb-rung .bb-av{border-radius:50%;border:1px solid rgba(150,180,210,.5)}
  .bbbb-rung-no{font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:2px;color:var(--bbbb-amber);min-width:56px}
  .bbbb-rung-n{font-size:14px;letter-spacing:.4px;flex:1 1 auto;min-width:0}
  .bbbb-rung.is-gone{opacity:.42}
  .bbbb-rung.is-gone .bbbb-rung-n{text-decoration:line-through}
  .bbbb-rung.is-gone .bb-av{filter:grayscale(.85)}
  .bbbb-rung.is-back{border-color:rgba(255,203,107,.6);background:rgba(255,203,107,.10)}
  .bbbb-rung.is-back .bbbb-rung-n{color:#ffe1a3}
  .bbbb-rung.is-back .bb-av{border-color:#ffcb6b;box-shadow:0 0 16px rgba(255,203,107,.5)}
  .bbbb-step{display:flex;align-items:center;justify-content:space-between;gap:10px;
    margin:4px 0 4px 4px;padding:3px 10px;border-left:2px solid rgba(140,170,205,.22);opacity:.45}
  .bbbb-step.is-lit{opacity:1;border-left-color:var(--bbbb-amber)}
  .bbbb-step-l{font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:2.6px;color:var(--bbbb-dim)}
  .bbbb-step.is-lit .bbbb-step-l{color:var(--bbbb-amber)}
  .bbbb-step-w{font-size:11.5px;color:var(--bbbb-dim);font-style:italic}

  .bbbb-lane{margin-bottom:10px}
  .bbbb-lane-k{display:block;font-family:'Oswald',sans-serif;font-size:8.5px;letter-spacing:3px;color:var(--bbbb-dim);margin-bottom:5px}
  .bbbb-heat{display:flex;gap:7px;flex-wrap:wrap}
  .bbbb-heat-c{display:flex;align-items:center;gap:6px;padding:4px 9px 4px 4px;border-radius:22px;
    border:1px solid var(--bbbb-line);background:rgba(255,255,255,.03)}
  .bbbb-heat-c .bb-av{border-radius:50%}
  .bbbb-heat-n{font-size:12.5px}
  .bbbb-heat-c.is-adv{border-color:rgba(255,166,61,.55);background:rgba(255,166,61,.09)}
  .bbbb-heat-c.is-gone{opacity:.4}
  .bbbb-heat-c.is-gone .bbbb-heat-n{text-decoration:line-through}
  .bbbb-pos{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:1px;color:var(--bbbb-amber);min-width:18px;text-align:center}

  .bbbb-h2h{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .bbbb-slot{display:flex;align-items:center;gap:8px;min-width:170px;padding:7px 12px;border-radius:8px;
    border:1px solid var(--bbbb-line);background:rgba(255,255,255,.03)}
  .bbbb-slot .bb-av{border-radius:50%}
  .bbbb-slot b{font-weight:600;font-size:13.5px}
  .bbbb-slot.is-win{border-color:rgba(255,166,61,.6);background:rgba(255,166,61,.10)}
  .bbbb-slot.is-gone{opacity:.42}
  .bbbb-slot.is-gone b{text-decoration:line-through}
  .bbbb-tbd{font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:3px;color:var(--bbbb-dim)}
  .bbbb-vs{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:3px;color:var(--bbbb-dim)}

  .bbbb-conf{display:grid;grid-template-columns:1fr auto 1fr;align-items:stretch;gap:10px}
  .bbbb-conf-side{display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px;
    border:1px solid var(--bbbb-line);border-radius:9px;background:rgba(255,255,255,.03)}
  .bbbb-conf-side b{font-weight:600;font-size:13.5px}
  .bbbb-conf-side .bb-av{border-radius:50%;border:2px solid rgba(150,180,210,.45)}
  .bbbb-conf-side.is-warm{border-color:rgba(255,203,107,.42);background:rgba(255,203,107,.07)}
  .bbbb-conf-side.is-warm .bb-av{border-color:#ffcb6b;box-shadow:0 0 16px rgba(255,203,107,.35)}
  .bbbb-conf-side.is-warm b{color:#ffe1a3}
  .bbbb-conf-k{font-family:'Oswald',sans-serif;font-size:8px;letter-spacing:2.6px;color:var(--bbbb-dim)}
  .bbbb-conf-r{font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:2.2px;color:#93a8c0}
  .bbbb-conf-r.is-warm{color:var(--bbbb-warm)}
  .bbbb-conf-door{align-self:center;width:34px;height:60px;border-radius:3px;border:2px solid #3a4f66;background:#0d131b;
    display:flex;align-items:center;justify-content:flex-end;padding-right:4px}
  .bbbb-conf-door span{width:4px;height:4px;border-radius:50%;background:#5f7590}
  .bbbb-conf.is-done .bbbb-conf-door{border-color:#ffcb6b;background:linear-gradient(180deg,#ffe1a3,#ff9f2e);
    animation:bbbb-doorpulse 5s ease-in-out infinite alternate}
  .bbbb-conf.is-done .bbbb-conf-door span{background:#5a3b10}
  .bbbb-conf.is-solo .bbbb-conf-side.is-warm{opacity:.55;border-style:dashed}

  .bbbb-card{border:1px solid var(--bbbb-line);border-radius:10px;padding:12px 13px;margin-bottom:10px;position:relative;
    background:linear-gradient(180deg,rgba(23,33,46,.78),rgba(9,14,21,.78));
    animation:bbbb-in .32s cubic-bezier(.2,.8,.25,1) both}
  @keyframes bbbb-in{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
  .bbbb-card.is-locked{padding:9px;text-align:center;opacity:.15;animation:none;background:none}
  .bbbb-lock{font-family:'Oswald',sans-serif;letter-spacing:6px;font-size:12px;color:var(--bbbb-dim)}
  .bbbb-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
  .bbbb-hd-s{font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:2px;color:var(--bbbb-dim)}
  .bbbb-tag{font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:3px;color:var(--bbbb-amber);
    border:1px solid rgba(255,166,61,.5);background:rgba(255,166,61,.12);padding:2px 9px;border-radius:3px}
  .bbbb-tag.is-warm{color:#ffe1a3;border-color:rgba(255,203,107,.6);background:rgba(255,203,107,.14)}
  .bbbb-tag.is-red{color:#ff9b95;border-color:rgba(248,81,73,.55);background:rgba(248,81,73,.12)}
  .bbbb-body{font-size:14px;line-height:1.62;color:var(--bbbb-ink);margin:0}
  .bbbb-flav{margin:9px 0 0;padding-top:7px;border-top:1px dashed rgba(140,170,205,.18);
    font-size:12px;color:#7d90a8;font-style:italic}
  .bbbb-chips{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 2px}

  .bbbb-table{display:flex;flex-direction:column;gap:5px;margin-bottom:9px}
  .bbbb-row{display:flex;align-items:center;gap:9px;padding:5px 8px;border-radius:7px;
    border-left:3px solid rgba(140,170,205,.3);background:rgba(255,255,255,.03)}
  .bbbb-row .bb-av{border-radius:50%}
  .bbbb-row-n{font-size:13px;min-width:96px}
  .bbbb-row.is-adv{border-left-color:var(--bbbb-amber);background:rgba(255,166,61,.08)}
  .bbbb-row.is-gone{opacity:.5}
  .bbbb-row.is-gone .bbbb-row-n{text-decoration:line-through}
  .bbbb-bar{flex:1 1 60px;height:5px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;min-width:50px}
  .bbbb-bar b{display:block;height:100%;background:linear-gradient(90deg,#5c7fa6,var(--bbbb-amber))}
  .bbbb-num{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:1px;color:#dce8f5;min-width:44px;text-align:right}

  .bbbb-duel{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin-bottom:9px}
  .bbbb-duel-p{margin:0;display:flex;flex-direction:column;align-items:center;gap:4px}
  .bbbb-duel-p figcaption{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:1.6px;color:#e6eff9}
  .bbbb-duel-p .bb-av{border-radius:50%;border:2px solid rgba(150,180,210,.45)}
  .bbbb-duel-p.is-win .bb-av{border-color:var(--bbbb-amber);box-shadow:0 0 20px rgba(255,166,61,.4)}
  .bbbb-duel-p.is-win figcaption{color:#ffd79a}
  .bbbb-duel-p.is-lose{opacity:.5}
  .bbbb-duel-p.is-lose figcaption{text-decoration:line-through}
  .bbbb-duel-p.is-lose .bb-av{filter:grayscale(.85)}
  .bbbb-duel-p .bbbb-num{min-width:0}

  .bbbb-out{display:flex;gap:10px;align-items:flex-start;margin-top:9px;padding:8px 9px;border-radius:7px;
    border-left:3px solid #6b7a8c;background:rgba(255,255,255,.03);opacity:.86}
  .bbbb-out .bb-av{border-radius:50%;filter:grayscale(.85)}
  .bbbb-out-k{display:block;font-family:'Oswald',sans-serif;font-size:8.5px;letter-spacing:2.4px;color:#8d9db1;margin-bottom:3px}
  .bbbb-out p{margin:0;font-size:13px;line-height:1.55;color:#a9b9cc}

  .bbbb-champ{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:9px}
  .bbbb-champ-av{margin:0;text-align:center}
  .bbbb-champ-av figcaption{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:1.8px;color:#ffe1a3;margin-top:5px}
  .bbbb-champ-av .bb-av{border-radius:50%;border:2px solid #ffcb6b;box-shadow:0 0 24px rgba(255,203,107,.45)}
  .bbbb-tally{flex:1 1 220px;display:flex;flex-direction:column;gap:4px;min-width:200px}
  .bbbb-tl{display:flex;align-items:center;gap:8px}
  .bbbb-tl-n{font-size:12.5px;min-width:100px;color:#b8c8db}
  .bbbb-tl.is-top .bbbb-tl-n{color:#ffe1a3}
  .bbbb-tl.is-top .bbbb-bar b{background:linear-gradient(90deg,#c9924a,#ffcb6b)}
  .bbbb-votecard{border-color:rgba(255,203,107,.34)}

  .bbbb-doorcard{overflow:hidden}
  .bbbb-doorcard.is-open{border-color:rgba(255,203,107,.55);
    background:linear-gradient(180deg,rgba(66,48,18,.55),rgba(9,14,21,.86))}
  .bbbb-doorcard.is-shut{border-color:rgba(248,81,73,.35)}
  .bbbb-doorglow{position:absolute;inset:0;pointer-events:none;opacity:0}
  .bbbb-doorcard.is-open .bbbb-doorglow{opacity:1;
    background:radial-gradient(58% 92% at 20% 0%,rgba(255,214,150,.22),transparent 72%);
    animation:bbbb-buzz 4.6s ease-in-out infinite alternate}
  .bbbb-door-b{display:flex;gap:14px;align-items:center;position:relative;flex-wrap:wrap}
  .bbbb-door-av .bb-av{border-radius:50%;border:3px solid rgba(150,180,210,.5)}
  .bbbb-door-av.is-warm .bb-av{border-color:#ffcb6b;box-shadow:0 0 30px rgba(255,203,107,.6)}
  .bbbb-door-n{font-family:'Oswald',sans-serif;font-size:22px;letter-spacing:3px;color:#f0f6fd;margin-bottom:4px}
  .bbbb-doorcard.is-open .bbbb-door-n{color:#ffe6bb}
  .bbbb-know{margin-top:10px;padding:8px 10px;border-radius:8px;border:1px dashed rgba(248,81,73,.35);
    background:rgba(248,81,73,.05);position:relative}
  .bbbb-know.is-soft{border-color:rgba(127,200,160,.28);background:rgba(127,200,160,.04)}
  .bbbb-know-k{font-family:'Oswald',sans-serif;font-size:8.5px;letter-spacing:2.6px;color:#ff9b95}
  .bbbb-know.is-soft .bbbb-know-k{color:#8fcbaa}

  .bbbb-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -16px 0;backdrop-filter:blur(3px);
    background:linear-gradient(180deg,rgba(7,11,17,0),rgba(7,11,17,.96) 40%)}
  .bbbb-count{font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:2.6px;color:var(--bbbb-dim)}
  .bbbb-done{font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:2.6px;color:var(--bbbb-warm)}

  @media(max-width:700px){
    .bbbb-strip{grid-template-columns:1fr 1fr}
    .bbbb-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--bbbb-line);padding:6px 0 0}
    .bbbb-lot{height:190px}
    .bbbb-conf,.bbbb-duel{grid-template-columns:1fr}
    .bbbb-conf-door{justify-self:center}
    .bbbb-title{font-size:26px;letter-spacing:5px}
  }
  @media(prefers-reduced-motion:reduce){
    .bbbb *,.bbbb *::before,.bbbb *::after{animation:none!important;transition:none!important}
    .bbbb-lot.is-open .bbbb-doorway,.bbbb-lot.is-open .bbbb-spill{opacity:1}
    .bbbb-walker{transform:translate(-50%,-50%);opacity:1}
  }
  </style>

  <div class="bbbb-eyebrow">WEEK ${E(act.week || ep.num)} &middot; THE LOT &middot; AFTER THE VOTE</div>
  <div class="bbbb-title">BATTLE BACK</div>
  <div class="bbbb-sub">${isShowdown ? 'Showdown' : 'Gauntlet'}${compName ? ` &middot; ${E(compName)}` : ''} &middot; <em>one way back in, and no immunity waiting</em></div>

  ${lot}
  ${strip}
  ${piece}
  <div class="bbbb-cards">${cards}</div>

  <div class="bbbb-ctrl">
    ${done
      ? `<span class="bbbb-done">${returned ? 'THE DOOR CLOSES BEHIND THEM.' : 'THE LOT GOES DARK.'}</span>`
      : `<button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}">${
          state.idx < 0 ? 'Turn the lights on' : 'Next round'}</button>
        <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="bbbb-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
