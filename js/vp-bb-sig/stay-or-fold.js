// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/stay-or-fold.js — "The Table"
//
// The themed screen for js/bb-comps/classics.js → Stay or Fold
// (`variant: 'stayfold'`).
//
// Rebuilt as the game it is. The old version was the house style — a column of
// phosphor-green cards with a number in a box — which is the correct shape for
// a quiz and the wrong one for a card table, where the whole drama is that
// everybody is sitting in a ring watching each other declare.
//
// So the instrument is the TABLE, and the unit of reveal is the ROUND, not the
// houseguest. One click deals a card face down to every seat; the declarations
// stamp around the ring in turn; the cards turn over together; and the lowest
// card still standing is struck and slides off the felt with everything it was
// worth. Chip stacks under each seat carry the running total, so the leader
// changes in front of you rather than in a results list at the end.
//
// Green baize, mahogany rail, brass lamp, real card faces with pips and a
// patterned back. Declines when the round data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const SUITS = [
  { id: 'S', glyph: '&#9824;', red: false },
  { id: 'H', glyph: '&#9829;', red: true },
  { id: 'C', glyph: '&#9827;', red: false },
  { id: 'D', glyph: '&#9830;', red: true },
];
const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

/** A stable suit per houseguest per round — the deal has to look like a deal. */
function suitFor(name, round) {
  const key = `${name}|${round}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return SUITS[h % 4];
}

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigStayOrFold(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withRounds = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.rounds) && v.rounds.length);
  if (!withRounds.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = n => (typeof u.ordinal === 'function' ? u.ordinal(n) : String(n));
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'LUCK', accent: '#d8b25c' };
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_fold_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 43 + salt * 29 + pool.length) % pool.length];

  const ROUND_FLAV = [
    'Nobody is shown the deck. Everybody is shown each other.',
    'The card is luck. Saying what you will do about it, out loud, in turn, is not.',
    'A good card declared badly is worth nothing at all.',
    'Folding is never wrong at the time. It is only ever wrong afterwards.',
    'Somebody at this table is being read while they are reading.',
  ];
  const WIN_FLAV = [
    'The table gets cleared. Two people are still explaining a fold nobody asked about.',
    'A competition of pure luck, won by whoever managed the luck best.',
    'The cards go back in the shoe. What the house learned about each other does not.',
    'Nobody was dealt better than anybody. Somebody just declared better.',
  ];

  // ── the table, rebuilt round by round ────────────────────────────────
  const players = withRounds.map(([name, v]) => ({ name, ...v }));
  const ROUNDS = players.reduce((m, p) => Math.max(m, p.rounds.length), 0);
  const seatOf = players.map(p => p.name);
  const rowFor = (name, n) => (players.find(p => p.name === name)?.rounds || [])
    .find(r => r.round === n) || null;

  /** Points banked by everybody after `n` rounds — the chip stacks. */
  const totalsAfter = n => players.map(p => {
    let t = 0;
    for (const r of p.rounds) {
      if (r.round > n) break;
      if (r.folded) t += 2;
      else if (!r.wiped) t += r.card;
    }
    return { name: p.name, total: t, threw: p.threw };
  }).sort((a, b) => b.total - a.total);

  // Beats that are about the table rather than about one run get their own
  // card between rounds; the per-houseguest summaries are held for the end,
  // where they read as a post-mortem instead of interrupting the deal.
  const readBeats = beats.filter(b => ['CALLED', 'BLUFFED', 'TALKED OVER THE LINE']
    .includes(String(b.badgeText || '').toUpperCase().trim()));
  const openBeat = beats[0];
  const runBeats = beats.filter(b => b !== openBeat && !readBeats.includes(b));

  let steps = [{ kind: 'open' }];
  for (let n = 1; n <= ROUNDS; n++) {
    steps.push({ kind: 'round', n });
    const rb = readBeats[n - 1];
    if (rb) steps.push({ kind: 'read', beat: rb });
  }
  readBeats.slice(ROUNDS).forEach(b => steps.push({ kind: 'read', beat: b }));
  runBeats.forEach(b => steps.push({ kind: 'run', beat: b, name: (b.players || [])[0] }));

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = seatOf.length;
  steps.push({ kind: 'win' });

  if (sealed) {
    const keep = planSeal(steps, {
      countKind: 'round', cap: Math.max(2, Math.ceil(ROUNDS / 2)),
      isResult: st => st.kind === 'win',
    });
    steps = steps.slice(0, keep);
    steps.push({ kind: 'cut' }, { kind: 'irony' });
  }

  const total = steps.length;
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;
  const roundsDealt = steps.slice(0, revealed).filter(s => s.kind === 'round').length;
  const standings = totalsAfter(roundsDealt);

  // ── the felt ─────────────────────────────────────────────────────────
  //
  // Seats sit on an ellipse rather than in a list, because the thing being
  // dramatised is a ring of people watching each other.
  const seats = seatOf.map((name, i) => {
    const angle = (-90 + (360 / fieldSize) * i) * (Math.PI / 180);
    const x = 50 + Math.cos(angle) * 39;
    const y = 50 + Math.sin(angle) * 34;
    const row = roundsDealt ? rowFor(name, roundsDealt) : null;
    const t = standings.find(s => s.name === name)?.total ?? 0;
    const stateCls = !row ? 'is-waiting' : row.folded ? 'is-folded' : row.wiped ? 'is-wiped' : 'is-kept';
    const chips = Math.max(0, Math.min(6, Math.round(t / 6)));
    return `<div class="tbl-seat ${stateCls}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--d:${i * 0.06}s">
      <span class="tbl-av">${AV(name, 34)}</span>
      <span class="tbl-name">${E(String(name).split(' ')[0])}</span>
      <span class="tbl-chips">${Array.from({ length: chips }, (_, k) =>
    `<i style="--k:${k}"></i>`).join('')}</span>
      <span class="tbl-stack">${sealed ? MASK : t}</span>
      ${row ? `<span class="tbl-call">${row.folded ? 'FOLD' : row.wiped ? 'WIPED' : 'STAY'}</span>` : ''}
    </div>`;
  }).join('');

  const felt = `<div class="tbl-wrap">
    <svg class="tbl-felt" viewBox="0 0 600 380" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="fldLamp" cx="50%" cy="34%" r="62%">
          <stop offset="0%" stop-color="#2f7d55"/><stop offset="58%" stop-color="#1c5638"/>
          <stop offset="100%" stop-color="#0f3323"/>
        </radialGradient>
        <linearGradient id="fldRail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6b4526"/><stop offset="45%" stop-color="#432a16"/>
          <stop offset="100%" stop-color="#241408"/>
        </linearGradient>
      </defs>
      <ellipse cx="300" cy="190" rx="292" ry="182" fill="url(#fldRail)"/>
      <ellipse cx="300" cy="190" rx="272" ry="164" fill="#0c2618"/>
      <ellipse cx="300" cy="190" rx="264" ry="157" fill="url(#fldLamp)"/>
      <ellipse cx="300" cy="190" rx="264" ry="157" fill="none"
        stroke="rgba(216,178,92,.34)" stroke-width="1.4" stroke-dasharray="5 7"/>
      <ellipse cx="300" cy="190" rx="150" ry="88" fill="none"
        stroke="rgba(216,178,92,.16)" stroke-width="1"/>
    </svg>
    <div class="tbl-lamp" aria-hidden="true"></div>
    <div class="tbl-pot">
      <span class="tbl-pot-k">${roundsDealt ? 'ROUND' : 'THE SHOE'}</span>
      <span class="tbl-pot-v">${roundsDealt ? `${roundsDealt} / ${ROUNDS}` : '&#9670;'}</span>
      <span class="tbl-pot-s">${roundsDealt
    ? (standings[0] ? `${sealed ? MASK : E(standings[0].name)} leads` : '')
    : 'cards face down'}</span>
    </div>
    ${seats}
  </div>`;

  /** One card face, drawn rather than boxed. */
  const cardFace = (name, n, row) => {
    if (!row) return '';
    const suit = suitFor(name, n);
    const rank = sealed ? '?' : (RANKS[row.card] || row.card);
    if (row.folded) {
      return `<span class="pc pc-back ${row.pushed ? 'is-pushed' : ''}" title="folded">
        <i></i><em>FOLD</em></span>`;
    }
    return `<span class="pc ${suit.red ? 'is-red' : ''} ${row.wiped ? 'is-wiped' : 'is-kept'} ${row.pushed ? 'is-pushed' : ''}">
      <b class="pc-tl">${rank}<s>${suit.glyph}</s></b>
      <s class="pc-mid">${suit.glyph}</s>
      <b class="pc-br">${rank}<s>${suit.glyph}</s></b>
      ${row.wiped ? '<em class="pc-stamp">WIPED</em>' : ''}
    </span>`;
  };

  const roundCard = (n, i) => {
    const rows = seatOf.map(name => ({ name, row: rowFor(name, n) })).filter(r => r.row);
    const stayed = rows.filter(r => !r.row.folded);
    const wiped = rows.find(r => r.row.wiped);
    const folded = rows.filter(r => r.row.folded);
    const best = [...stayed].sort((a, b) => b.row.card - a.row.card)[0];
    return `<article class="fld-card-w fld-round" data-round="${n}">
      <header class="fld-hd">
        <span class="fld-tag fld-tag-gold">ROUND ${n}</span>
        <span class="fld-sub">${folded.length} fold &middot; ${stayed.length} stay${
  wiped ? ' &middot; one wiped' : ''}</span>
      </header>
      <div class="pc-deal">
        ${rows.map((r, k) => `<figure class="pc-slot" style="--d:${(k * 0.07).toFixed(2)}s">
          ${cardFace(r.name, n, r.row)}
          <figcaption>${E(String(r.name).split(' ')[0])}</figcaption>
        </figure>`).join('')}
      </div>
      <p class="fld-body">${sealed ? 'The declarations are made and the cards turn over. Nothing about this round leaves the room.'
    : `${folded.length ? `${folded.map(r => E(String(r.name).split(' ')[0])).join(', ')} ${folded.length === 1 ? 'takes' : 'take'} the two and ${folded.length === 1 ? 'sits' : 'sit'} it out. ` : 'Nobody folds. '}`
      + `${wiped ? `${E(wiped.name)} is the lowest card still standing on ${RANKS[wiped.row.card] || wiped.row.card} — struck, and everything it was worth goes with it.`
        : best ? `${E(best.name)} takes the round on ${RANKS[best.row.card] || best.row.card}.` : ''}`}</p>
      <p class="fld-flav">${E(flav(ROUND_FLAV, i))}</p>
    </article>`;
  };

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="fld-card-w is-locked"><span class="fld-lock">&#9679; &#9679; &#9679;</span></div>';

    if (s.kind === 'open') {
      return `<article class="fld-card-w fld-open">
        <header class="fld-hd"><span class="fld-tag">${E(openBeat.badgeText || `${ROUNDS} ROUNDS`)}</span>
          <span class="fld-sub">${fieldSize} at the table</span></header>
        <p class="fld-body">${E(openBeat.text)}</p>
      </article>`;
    }
    if (s.kind === 'round') return roundCard(s.n, i);
    if (s.kind === 'cut') {
      return sealCutCard('fld', { standing: Math.max(0, ROUNDS - roundsDealt),
        unit: 'rounds never shown', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('fld', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'read') {
      const tag = String(s.beat.badgeText || '').toUpperCase().trim();
      const pair = (s.beat.players || []).slice(0, 2);
      const kind = tag === 'CALLED' ? 'is-called' : tag === 'BLUFFED' ? 'is-bluff' : 'is-push';
      return `<article class="fld-card-w fld-read ${kind}">
        <header class="fld-hd"><span class="fld-tag ${tag === 'BLUFFED' ? 'fld-tag-red' : 'fld-tag-gold'}">${
  E(s.beat.badgeText || 'READ')}</span><span class="fld-sub">in front of everybody</span></header>
        <div class="fld-face-off">
          ${pair.map(n => `<figure>${AV(n, 42)}<figcaption>${E(n)}</figcaption></figure>`).join(
    '<span class="fld-vs">vs</span>')}
        </div>
        <p class="fld-body">${E(s.beat.text)}</p>
      </article>`;
    }

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="fld-card-w fld-win">
        <header class="fld-hd"><span class="fld-tag fld-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="fld-sub">highest total</span></header>
        <div class="fld-win-b">
          <figure class="fld-win-av">${AV(winner, 72)}</figure>
          <div><div class="fld-win-n">${E(winner)}</div>
            <p class="fld-body">${E(winner)} finishes on ${sealed ? MASK : (w.total ?? 0)} — folding ${
  sealed ? MASK : (w.folds ?? 0)} of the ${ROUNDS} and losing ${sealed ? MASK : (w.wiped ?? 0)} to the table.</p>
            ${!sealed && (w.read != null) ? `<div class="fld-roles">
              <span><i>READ</i><b>${Number(w.read).toFixed(1)}</b></span>
              <span><i>NERVE</i><b>${Number(w.nerve).toFixed(1)}</b></span>
              <span><i>TABLE</i><b>${Number(w.table).toFixed(1)}</b></span>
              ${w.pushed ? `<span><i>TALKED INTO</i><b>${w.pushed}</b></span>` : ''}
            </div>` : ''}</div>
        </div>
        <p class="fld-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }

    // A houseguest's night, in one line, after the deal is done.
    const bd = breakdown[s.name] || {};
    return `<article class="fld-card-w fld-run ${bd.threw ? 'is-threw' : ''}">
      <header class="fld-hd">
        <span class="fld-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="fld-tag ${bd.threw ? 'fld-tag-quiet' : ''}">${sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="fld-body">${E(s.beat.text)}</p>
      ${!sealed && bd.rounds ? `<div class="pc-deal pc-deal-sm">
        ${bd.rounds.map((r, k) => `<figure class="pc-slot" style="--d:${(k * 0.05).toFixed(2)}s">
          ${cardFace(s.name, r.round, r)}<figcaption>R${r.round}</figcaption></figure>`).join('')}
      </div>` : ''}
      <div class="fld-nums">
        <span><i>TOTAL</i><b>${sealed ? MASK : (bd.total ?? 0)}</b></span>
        <span><i>FOLDED</i><b>${sealed ? MASK : (bd.folds ?? 0)}</b></span>
        <span><i>WIPED</i><b>${sealed ? MASK : (bd.wiped ?? 0)}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
    </article>`;
  }).join('');

  const boardHtml = sealed ? '' : `<aside class="fld-side">
    <div class="fld-side-h"><span class="fld-k">CHIP COUNT</span>
      <span class="fld-side-r">${roundsDealt ? `after ${ORD(roundsDealt)}` : 'no cards dealt'}</span></div>
    ${standings.map((r, i) => `<div class="fld-side-row ${i === 0 && roundsDealt ? 'is-lead' : ''}">
      <span class="fld-side-p">${ORD(i + 1)}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="fld-side-n">${E(r.name)}</span>
      <span class="fld-side-t">${r.total}</span>
    </div>`).join('')}
  </aside>`;

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigfld">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600&display=swap');
  .sigfld{--fd-ink:#f6ecd8;--fd-dim:#a3906d;--fd-gold:#d8b25c;--fd-felt:#1c5638;
    --fd-line:rgba(216,178,92,.24);
    max-width:1100px;margin:0 auto;color:var(--fd-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:radial-gradient(ellipse at 50% -10%,rgba(216,178,92,.14),transparent 55%),
      linear-gradient(180deg,#22160c,#0d0805 82%);
    border-radius:12px;padding:16px 14px 0;position:relative;overflow:clip}

  .fld-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:var(--fd-dim);text-align:center}
  .fld-title{font-family:'Playfair Display',Georgia,serif;font-weight:900;font-size:38px;letter-spacing:2px;
    text-align:center;color:#ffeec4;text-shadow:0 0 26px rgba(216,178,92,.5);margin:2px 0}
  .fld-tagline{text-align:center;font-size:11px;letter-spacing:2px;color:var(--fd-gold);margin-bottom:13px}

  /* ── the felt ── */
  .tbl-wrap{position:relative;aspect-ratio:600/380;margin:0 auto 14px;max-width:640px}
  .tbl-felt{position:absolute;inset:0;width:100%;height:100%;
    filter:drop-shadow(0 18px 40px rgba(0,0,0,.65))}
  .tbl-lamp{position:absolute;left:50%;top:-6%;width:52%;height:52%;transform:translateX(-50%);
    background:radial-gradient(ellipse at 50% 0%,rgba(255,226,160,.30),transparent 68%);
    pointer-events:none;animation:tblLamp 6s ease-in-out infinite}
  @keyframes tblLamp{0%,100%{opacity:.75}50%{opacity:1}}
  .tbl-pot{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;
    padding:9px 16px;border:1px solid rgba(216,178,92,.32);border-radius:9px;
    background:rgba(8,26,17,.62);backdrop-filter:blur(2px)}
  .tbl-pot-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;
    letter-spacing:2.4px;color:var(--fd-dim)}
  .tbl-pot-v{display:block;font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#ffeec4;
    line-height:1.1}
  .tbl-pot-s{display:block;font-size:9.5px;letter-spacing:1px;color:var(--fd-gold)}

  .tbl-seat{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;
    align-items:center;gap:2px;width:74px;animation:tblSeat .5s ease both;animation-delay:var(--d)}
  @keyframes tblSeat{from{opacity:0;transform:translate(-50%,-42%) scale(.9)}
    to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
  .tbl-seat .bb-av{border-radius:50%;border:2px solid rgba(216,178,92,.4);
    box-shadow:0 3px 10px rgba(0,0,0,.5)}
  .tbl-name{font-size:9.5px;letter-spacing:.4px;color:#e9dcc0;text-shadow:0 1px 3px rgba(0,0,0,.8)}
  .tbl-stack{font-family:'Playfair Display',Georgia,serif;font-size:13px;color:#ffeec4}
  .tbl-chips{display:flex;gap:1px;height:7px;align-items:flex-end}
  .tbl-chips i{display:block;width:9px;height:3px;border-radius:2px;background:var(--fd-gold);
    opacity:.85;animation:tblChip .3s ease both;animation-delay:calc(var(--k) * .05s)}
  @keyframes tblChip{from{opacity:0;transform:translateY(-4px)}to{opacity:.85;transform:none}}
  .tbl-call{font-family:ui-monospace,Consolas,monospace;font-size:7px;letter-spacing:1.4px;
    padding:1px 5px;border-radius:3px}
  .tbl-seat.is-kept .tbl-call{color:#0f2c1c;background:var(--fd-gold)}
  .tbl-seat.is-folded{opacity:.62}
  .tbl-seat.is-folded .tbl-call{color:var(--fd-dim);border:1px solid rgba(163,144,109,.4)}
  .tbl-seat.is-wiped .bb-av{border-color:#e2503c}
  .tbl-seat.is-wiped .tbl-call{color:#fff;background:#c9342a}

  /* ── the cards ── */
  .pc-deal{display:flex;flex-wrap:wrap;gap:9px;justify-content:center;
    margin:11px 0 8px;padding:12px 10px;border-radius:10px;
    background:radial-gradient(ellipse at 50% 0%,rgba(47,125,85,.5),rgba(12,38,24,.85));
    border:1px solid rgba(216,178,92,.18)}
  .pc-deal-sm{padding:8px;gap:6px}
  .pc-slot{margin:0;display:flex;flex-direction:column;align-items:center;gap:4px;
    animation:pcDeal .42s cubic-bezier(.2,1.1,.4,1) both;animation-delay:var(--d)}
  @keyframes pcDeal{from{opacity:0;transform:translate(-40px,-26px) rotate(-14deg) scale(.86)}
    to{opacity:1;transform:none}}
  .pc-slot figcaption{font-family:ui-monospace,Consolas,monospace;font-size:7.5px;letter-spacing:1px;
    color:#cbbb96}
  .pc{position:relative;width:40px;height:56px;border-radius:5px;display:block;
    background:linear-gradient(160deg,#fffdf6,#e8e2d2);color:#16212c;
    box-shadow:0 3px 8px rgba(0,0,0,.55),inset 0 0 0 1px rgba(0,0,0,.12);
    animation:pcFlip .5s ease both;animation-delay:calc(var(--d) + .12s);transform-origin:50% 50%}
  @keyframes pcFlip{0%{transform:rotateY(90deg) scale(.94)}60%{transform:rotateY(-8deg) scale(1.02)}
    100%{transform:none}}
  .pc.is-red{color:#c02a1e}
  .pc b{position:absolute;font-family:'Playfair Display',Georgia,serif;font-size:11px;line-height:1;
    font-weight:700;display:flex;flex-direction:column;align-items:center;gap:1px}
  .pc b s{text-decoration:none;font-size:8px}
  .pc-tl{top:4px;left:4px}
  .pc-br{bottom:4px;right:4px;transform:rotate(180deg)}
  .pc-mid{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    font-size:22px;text-decoration:none;opacity:.92}
  .pc.is-wiped{filter:saturate(.35) brightness(.82)}
  .pc-stamp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-18deg);
    font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.6px;color:#fff;
    background:rgba(201,52,42,.92);padding:2px 6px;border-radius:2px;font-style:normal;
    animation:pcStamp .34s cubic-bezier(.2,1.4,.4,1) both;animation-delay:calc(var(--d) + .42s)}
  @keyframes pcStamp{from{opacity:0;transform:translate(-50%,-50%) rotate(-18deg) scale(2.4)}
    to{opacity:1;transform:translate(-50%,-50%) rotate(-18deg) scale(1)}}
  .pc-back{background:linear-gradient(160deg,#3c2a56,#241a38);box-shadow:0 3px 8px rgba(0,0,0,.55)}
  .pc-back i{position:absolute;inset:4px;border-radius:3px;border:1px solid rgba(216,178,92,.4);
    background:repeating-linear-gradient(45deg,rgba(216,178,92,.22) 0 4px,transparent 4px 8px)}
  .pc-back em{position:absolute;left:50%;bottom:5px;transform:translateX(-50%);font-style:normal;
    font-family:ui-monospace,Consolas,monospace;font-size:7px;letter-spacing:1.2px;color:#d8b25c}
  .pc.is-pushed{outline:2px solid rgba(216,178,92,.75);outline-offset:2px}

  /* ── cards of prose ── */
  .fld-what{border:1px solid var(--fd-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:rgba(216,178,92,.05)}
  .fld-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .fld-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:var(--fd-gold);border:1px solid var(--fd-line);border-radius:3px;padding:2px 7px}
  .fld-what-h b{font-family:'Playfair Display',Georgia,serif;font-size:16px;letter-spacing:.6px}
  .fld-what-d{font-size:12.5px;line-height:1.6;color:#ddd0b4;margin:0}
  .fld-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .fld-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--fd-dim)}
  .fld-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(216,178,92,.16);
    text-decoration:none}
  .fld-w s b{display:block;height:100%;border-radius:2px;background:var(--fd-gold)}

  .fld-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .fld-grid-sealed{display:block}
  .fld-side{position:sticky;top:56px;border:1px solid var(--fd-line);border-radius:10px;padding:9px;
    background:rgba(20,13,7,.8)}
  .fld-side-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px}
  .fld-side-r{font-family:ui-monospace,Consolas,monospace;font-size:8px;color:var(--fd-dim)}
  .fld-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--fd-dim)}
  .fld-side-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:6px;font-size:11.5px;transition:background .3s}
  .fld-side-row.is-lead{background:rgba(216,178,92,.16)}
  .fld-side-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--fd-dim)}
  .fld-side-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fld-side-t{font-family:'Playfair Display',Georgia,serif;color:#ffeec4}

  .fld-card-w{border:1px solid var(--fd-line);border-radius:10px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(46,32,16,.72),rgba(10,7,4,.85));animation:fldIn .3s ease both}
  @keyframes fldIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .fld-card-w.is-locked{opacity:.12;text-align:center;padding:7px;animation:none;background:none}
  .fld-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:5px;color:var(--fd-dim)}
  .fld-card-w.is-threw{opacity:.72;border-style:dashed}
  .fld-round{border-color:rgba(216,178,92,.4)}
  .fld-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .fld-runner{display:flex;align-items:center;gap:8px}
  .fld-runner b{font-size:13px;letter-spacing:.6px}
  .fld-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--fd-gold);border:1px solid var(--fd-line);background:rgba(216,178,92,.1);
    padding:2px 8px;border-radius:3px}
  .fld-tag-gold{color:#241408;background:var(--fd-gold);border-color:var(--fd-gold)}
  .fld-tag-red{color:#ffd9d1;border-color:rgba(230,90,70,.5);background:rgba(230,90,70,.18)}
  .fld-tag-quiet{color:var(--fd-dim);background:none}
  .fld-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--fd-dim)}
  .fld-body{font-size:13.5px;line-height:1.65;margin:0}
  .fld-flav{font-size:10.5px;color:var(--fd-dim);font-style:italic;margin:7px 0 0}

  .fld-read{border-color:rgba(216,178,92,.45)}
  .fld-read.is-bluff{border-color:rgba(230,90,70,.45)}
  .fld-read.is-push{border-color:rgba(126,231,255,.4)}
  .fld-face-off{display:flex;align-items:center;justify-content:center;gap:14px;margin:8px 0}
  .fld-face-off figure{margin:0;text-align:center}
  .fld-face-off .bb-av{border-radius:50%;border:2px solid rgba(216,178,92,.45)}
  .fld-face-off figcaption{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:1px;
    margin-top:4px;color:#ddd0b4}
  .fld-vs{font-family:'Playfair Display',Georgia,serif;font-size:13px;color:var(--fd-dim)}

  .fld-nums,.fld-roles{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .fld-nums span,.fld-roles span{display:flex;flex-direction:column;gap:2px}
  .fld-nums i,.fld-roles i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--fd-dim)}
  .fld-nums b,.fld-roles b{font-family:'Playfair Display',Georgia,serif;font-size:15px;color:#ffeec4}

  .fld-win{border-color:rgba(216,178,92,.6);
    background:linear-gradient(180deg,rgba(86,64,18,.5),rgba(10,7,4,.88))}
  .fld-win-b{display:flex;gap:13px;align-items:flex-start}
  .fld-win-av .bb-av{border-radius:50%;border:2px solid var(--fd-gold);
    box-shadow:0 0 24px rgba(216,178,92,.4)}
  .fld-win-n{font-family:'Playfair Display',Georgia,serif;font-size:22px;letter-spacing:1px;
    color:#ffeec4;margin-bottom:4px}

  .fld-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -14px 0;background:linear-gradient(180deg,rgba(13,8,5,0),rgba(13,8,5,.96) 40%)}
  .fld-count,.fld-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--fd-dim)}
  .fld-done{color:var(--fd-gold)}

  ${sealCss('fld', '#d8b25c')}
  @media(max-width:860px){.fld-grid{grid-template-columns:1fr}.fld-side{position:static;order:-1}}
  @media(max-width:700px){
    .fld-title{font-size:26px}
    .tbl-seat{width:56px}.tbl-seat .bb-av{width:26px!important;height:26px!important}
    .pc{width:32px;height:45px}.pc-mid{font-size:17px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigfld *,.sigfld *::before,.sigfld *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="fld-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="fld-title">${E((comp.name || 'STAY OR FOLD').toUpperCase())}</div>
  <div class="fld-tagline">declare out loud &middot; in turn &middot; lowest card standing loses it all</div>

  ${felt}

  <div class="fld-what">
    <div class="fld-what-h"><span class="fld-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Stay or Fold')}</b></div>
    ${comp.desc ? `<p class="fld-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="fld-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="fld-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  <div class="${sealed ? 'fld-grid-sealed' : 'fld-grid'}">
    <div>${cards}</div>
    ${boardHtml}
  </div>

  <div class="fld-ctrl">
    ${done ? `<span class="fld-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE TABLE IS CLEARED.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.fld-card-w:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Deal them in' : state.idx < ROUNDS ? 'Next round' : 'Next'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="fld-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
