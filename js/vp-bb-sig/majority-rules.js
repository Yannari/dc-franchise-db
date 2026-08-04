// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/majority-rules.js — "The Lock-In Board"
//
// The themed screen for js/bb-comps/majority-rules.js (`variant: 'quiz'`).
//
// The competition asks what the HOUSE thinks, so the screen is built around the
// only image that matters in it: everybody's paddle going up at once, and the
// half-second afterwards where you find out whether you live in the same house
// as everybody else. Each round is a marquee question, a wall of lock-ins, a
// split bar, and whoever was holding the wrong board.
//
// All narration comes from the competition's own beats; per-player picks come
// from breakdown[name].picks. This file invents no answers and no results, and
// declines (returns '') the moment either is missing — an old saved season with
// the previous one-roll quiz under the same variant tag falls straight through
// to the generic board instead of rendering an empty studio.
//
// Interactivity is u.reveal() only, gated on _tvState[stateKey].idx. No window
// globals, no exported handlers, and no Math.random — the reveal handler
// rebuilds the whole screen, so identical idx must produce identical html.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard } from './_sealed.js';

/**
 * @param {object} ep       week record (.num, .acts, optional ._seg)
 * @param {'hoh'|'veto'|string} actType
 * @param {object} u        { tvState, reveal, avatar, esc, cat, ordinal }
 * @returns {string} html, or '' to fall back to the generic screen
 */
export function rpBuildSigMajorityRules(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  // A sealed Head of Household still gets its screen — it just stops before the
  // result. See _sealed.js for the three rules that keeps honest.
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  // Per-player lock-ins. Without them this is the old quiz under a new skin, so
  // it is the hard requirement for taking the screen at all.
  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const hasPicks = Object.values(breakdown).some(b => Array.isArray(b?.picks) && b.picks.length);
  if (!hasPicks) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'QUIZ', accent: '#e0b13a' };
  // The category accent is the quiz green, which fights the studio-marquee look
  // this screen is built on. The chip keeps the category colour; everything
  // else is the gold of a lit game-show board.
  const accent = '#e0b13a';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_major_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  // Deterministic flavour — same idx, same words, every rebuild.
  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 29 + salt * 13 + pool.length) % pool.length];

  const ASK_LINES = [
    'Nobody is allowed to think about whether it is true. Only about whether everybody else thinks it is true.',
    'Twelve seconds on the clock and no way to check your answer against anybody.',
    'This is the part where being liked and being informed turn out to be different things.',
    'Two names on the board. Neither of them gets a say in it.',
    'The studio goes quiet in the way it only does when everybody is doing the same arithmetic.',
  ];
  const OUT_FLAV = [
    'The board comes down and does not go back up.',
    'One wrong read of a room they have lived in for weeks.',
    'They will replay this answer to themselves for the rest of the night.',
    'It is not a hard question if you have been listening. That is the whole cruelty of it.',
  ];
  const WIN_FLAV = [
    'Knowing what the house thinks is the most dangerous skill in the building, and everybody just watched a demonstration.',
    'Nobody claps for very long. Everybody is doing the same sum about what it means.',
    'The board clears. The read stays on the record.',
    'The house just learned exactly who understands it.',
  ];

  // ── parse the beats into rounds ──────────────────────────────────────
  const QRE = /^Round (\d+)\.\s*(.*)$/;
  let steps = [];
  let cur = null;
  beats.forEach((b, i) => {
    const tag = String(b.badgeText || '').toUpperCase().trim();
    if (b.badgeClass === 'gold' || tag === 'HOH' || tag === 'VETO') { steps.push({ kind: 'win', beat: b }); cur = null; return; }
    if (tag === 'TIEBREAKER') { cur = { kind: 'tie', beat: b, guesses: [] }; steps.push(cur); return; }
    if (tag === 'CLOSEST' || /^OFF BY/.test(tag)) {
      if (cur?.kind === 'tie') { cur.guesses.push({ beat: b, closest: tag === 'CLOSEST' }); return; }
      steps.push({ kind: 'note', beat: b }); return;
    }
    const m = QRE.exec(b.text || '');
    if (m) { cur = { kind: 'round', q: Number(m[1]), ask: m[2], beat: b, outs: [], verdict: null }; steps.push(cur); return; }
    if (tag === 'MINORITY') { if (cur?.kind === 'round') cur.outs.push(b); else steps.push({ kind: 'note', beat: b }); return; }
    if (tag === 'DEAD EVEN' || tag === 'ALL SAFE') {
      if (cur?.kind === 'round') cur.verdict = { beat: b, tie: tag === 'DEAD EVEN' };
      else steps.push({ kind: 'note', beat: b });
      return;
    }
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    steps.push({ kind: 'note', beat: b });
  });
  if (!steps.length) return '';

  const roster = (act.participants && act.participants.length
    ? act.participants
    : (act.results || []).map(r => r.name)).filter(Boolean);
  const fieldSize = roster.length;
  const winner = act.winner || (act.results || [])[0]?.name || '';
  const rounds = steps.filter(s => s.kind === 'round');
  const totalRounds = rounds.length;

  // Who each question was ABOUT, and everybody's lock-in for it.
  //
  // The pair comes off the answer record, then off the question sentence, and
  // only then off the answers themselves. That order matters: a unanimous
  // round contains exactly ONE distinct answer, so deriving the pair from the
  // answers drew the question as "Wayne or Wayne" with both sides flagged as
  // the majority. Seasons saved before the pair was recorded fall through to
  // parsing the sentence, which still has both names in it.
  const ASKED = /—\s*(.+?)\s+or\s+(.+?)\s*\?/;
  rounds.forEach(r => {
    const picks = roster.map(n => ({ name: n, pick: (breakdown[n]?.picks || []).find(p => p.q === r.q) }))
      .filter(x => x.pick);
    r.picks = picks;
    r.majority = picks.find(x => x.pick.majority)?.pick.majority || null;

    const recorded = picks.find(x => Array.isArray(x.pick.pair) && x.pick.pair.filter(Boolean).length === 2);
    const asked = ASKED.exec(r.beat.text || '');
    const names = [...new Set(picks.map(x => x.pick.pick))];
    r.pair = recorded ? [...recorded.pick.pair]
      : asked ? [asked[1].trim(), asked[2].trim()]
        : r.majority ? [r.majority, names.find(n => n !== r.majority)].filter(Boolean)
          : names.slice(0, 2);
    r.forMaj = picks.filter(x => x.pick.right === true).length;
    r.forMin = picks.filter(x => x.pick.right === false).length;
    // Still in at the top of this round: nobody eliminated in an earlier one.
    r.standing = roster.filter(n => {
      const o = breakdown[n]?.outRound;
      return o == null || o >= r.q;
    }).length;
  });

  // ── sealing ──
  //
  // This is an elimination format, so the survivor is derivable the moment the
  // field is small enough. The broadcast stops while four are still holding a
  // board, which is one more than the twist needs and reads as a cut rather
  // than a censor.
  let live = steps;
  if (sealed) {
    const keep = planSeal(steps, {
      floor: 4,
      survivorsAfter: s => (s.kind === 'round' && s.picks && s.picks.length)
        ? s.standing - s.outs.length : null,
      isResult: s => s.kind === 'win' || s.kind === 'tie',
    });
    live = steps.slice(0, keep);
    live.push({ kind: 'cut' }, { kind: 'irony' });
  }
  steps = live;

  const total = steps.length;
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;

  const shownRounds = steps.slice(0, revealed).filter(s => s.kind === 'round');
  const lastRound = shownRounds[shownRounds.length - 1];
  const outSoFar = new Set();
  steps.slice(0, revealed).forEach(s => {
    if (s.kind === 'round') s.outs.forEach(b => (b.players || []).forEach(n => outSoFar.add(n)));
  });
  const standingNow = Math.max(1, fieldSize - outSoFar.size);

  // ── the field strip: who is still holding a board ────────────────────
  const field = `<div class="mjr-field">
    ${roster.map((n, i) => {
      const isOut = outSoFar.has(n);
      const isWin = !sealed && done && n === winner;
      return `<div class="mjr-hg ${isOut ? 'is-out' : ''} ${isWin ? 'is-win' : ''}" style="animation-delay:${(i % 8) * 45}ms" title="${E(n)}">
        <span class="mjr-hg-av">${AV(n, 34)}</span>
        <span class="mjr-hg-n">${E(String(n).split(' ')[0])}</span>
      </div>`;
    }).join('')}
  </div>`;

  const strip = `<div class="mjr-strip">
    <div><span class="mjr-k">STILL HOLDING A BOARD</span><span class="mjr-v"><b>${standingNow}</b><i>/ ${fieldSize}</i></span></div>
    <div><span class="mjr-k">QUESTION</span><span class="mjr-v"><b>${shownRounds.length}</b><i>/ ${totalRounds}</i></span></div>
    <div class="mjr-strip-r"><span class="mjr-k">${sealed ? 'RESULT' : done ? 'RESULT' : 'STATUS'}</span>
      <span class="mjr-v mjr-v-txt">${sealed
        ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
        : done && winner
          ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
          : lastRound ? `ROUND ${lastRound.q} LOCKED` : 'BOARDS DOWN'}</span></div>
  </div>`;

  // ── cards ────────────────────────────────────────────────────────────
  const cards = steps.map((s, i) => {
    if (i > state.idx) return `<div class="mjr-card is-locked"><span class="mjr-lock">· · ·</span></div>`;

    if (s.kind === 'open') {
      return `<article class="mjr-card mjr-open">
        <header class="mjr-hd"><span class="mjr-tag">${E(s.beat.badgeText || 'MAJORITY RULES')}</span>
          <span class="mjr-sub">${fieldSize} playing</span></header>
        <p class="mjr-body">${E(s.beat.text)}</p>
      </article>`;
    }

    if (s.kind === 'cut') {
      const stillIn = shownRounds.length
        ? shownRounds[shownRounds.length - 1].standing - shownRounds[shownRounds.length - 1].outs.length
        : fieldSize;
      return sealCutCard('mjr', { standing: stillIn, unit: 'still holding a board', salt: Number(ep.num) || 0 });
    }

    if (s.kind === 'irony') {
      return sealIronyCard('mjr', { winner, avatar: AV, esc: E, isHoh });
    }

    if (s.kind === 'win') {
      return `<article class="mjr-card mjr-win">
        <header class="mjr-hd"><span class="mjr-tag mjr-tag-gold">${E(s.beat.badgeText || (isHoh ? 'HOH' : 'VETO'))}</span>
          <span class="mjr-sub">last board standing</span></header>
        <div class="mjr-win-b">
          <figure class="mjr-win-av">${AV(winner, 74)}</figure>
          <div><div class="mjr-win-n">${E(winner)}</div><p class="mjr-body">${E(s.beat.text)}</p></div>
        </div>
        <p class="mjr-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }

    if (s.kind === 'tie') {
      return `<article class="mjr-card mjr-tie">
        <header class="mjr-hd"><span class="mjr-tag mjr-tag-tie">TIEBREAKER</span>
          <span class="mjr-sub">closest answer takes it</span></header>
        <p class="mjr-body">${E(s.beat.text)}</p>
        <div class="mjr-guesses">
          ${s.guesses.map(g => {
            const who = (g.beat.players || [])[0] || '';
            const num = /says (\d+)/.exec(g.beat.text || '')?.[1] ?? '—';
            return `<div class="mjr-guess ${g.closest ? 'is-closest' : ''}">
              <span class="mjr-guess-av">${AV(who, 34)}</span>
              <span class="mjr-guess-n">${E(who)}</span>
              <span class="mjr-guess-num">${E(num)}</span>
              <span class="mjr-guess-tag">${E(g.beat.badgeText || '')}</span>
            </div>`;
          }).join('')}
        </div>
      </article>`;
    }

    if (s.kind === 'note') {
      return `<article class="mjr-card mjr-note">
        <header class="mjr-hd"><span class="mjr-tag mjr-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="mjr-body">${E(s.beat.text)}</p>
      </article>`;
    }

    // ── a round ──
    const [a, b] = s.pair || [];
    const majTotal = Math.max(1, s.forMaj + s.forMin);
    const majPct = Math.round((s.forMaj / majTotal) * 100);
    const tie = !!s.verdict?.tie;
    return `<article class="mjr-card mjr-round ${tie ? 'is-tie' : ''}">
      <header class="mjr-hd">
        <span class="mjr-tag">${E(s.beat.badgeText || `ROUND ${s.q}`)}</span>
        <span class="mjr-sub">${s.standing} still in</span>
      </header>

      <div class="mjr-ask">
        <span class="mjr-ask-k">WHO DOES THE HOUSE THINK IS</span>
        <p class="mjr-ask-t">${E(s.ask.replace(/^Who does the house think is\s*/i, '').replace(/\s*—.*$/, ''))}</p>
      </div>

      <div class="mjr-pair">
        <figure class="mjr-nom ${s.majority && a === s.majority ? 'is-maj' : ''}">
          ${AV(a, 56)}<figcaption>${E(a || '')}</figcaption>
          ${s.majority === a ? '<span class="mjr-nom-flag">THE MAJORITY</span>' : ''}
        </figure>
        <span class="mjr-or">or</span>
        <figure class="mjr-nom ${s.majority && b === s.majority ? 'is-maj' : ''}">
          ${AV(b, 56)}<figcaption>${E(b || '')}</figcaption>
          ${s.majority === b ? '<span class="mjr-nom-flag">THE MAJORITY</span>' : ''}
        </figure>
      </div>

      ${tie ? '' : `<div class="mjr-split">
        <span class="mjr-split-bar"><b style="width:${majPct}%"></b></span>
        <span class="mjr-split-l"><b>${s.forMaj}</b> with the majority &middot; <i>${s.forMin}</i> in the minority</span>
      </div>`}

      <div class="mjr-boards">
        ${(s.picks || []).map(x => {
          const right = x.pick.right;
          return `<div class="mjr-board ${right === true ? 'is-right' : right === false ? 'is-wrong' : 'is-void'}">
            <span class="mjr-board-av">${AV(x.name, 28)}</span>
            <span class="mjr-board-n">${E(String(x.name).split(' ')[0])}</span>
            <span class="mjr-board-p">${E(x.pick.pick)}</span>
          </div>`;
        }).join('')}
      </div>

      ${s.verdict ? `<p class="mjr-verdict ${tie ? 'is-tie' : ''}">${E(s.verdict.beat.text)}</p>` : ''}

      ${s.outs.length ? `<div class="mjr-outs">
        ${s.outs.map(o => `<div class="mjr-out">
          <span class="mjr-out-av">${AV((o.players || [])[0], 32)}</span>
          <div><span class="mjr-out-tag">${E(o.badgeText || 'MINORITY')}</span><p>${E(o.text)}</p></div>
        </div>`).join('')}
        <p class="mjr-flav">${E(flav(OUT_FLAV, i))}</p>
      </div>` : ''}

      <p class="mjr-flav mjr-flav-ask">${E(flav(ASK_LINES, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((x, y) => y[1] - x[1]).slice(0, 4);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigmajor">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Antonio:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
  .sigmajor{--mj-ink:#f2ece0;--mj-dim:#a39683;--mj-line:rgba(201,162,39,.26);--mj-acc:${accent};
    max-width:1100px;margin:0 auto;font-family:Inter,system-ui,sans-serif;color:var(--mj-ink);
    background:radial-gradient(120% 90% at 50% -20%,#2b2418 0%,#171208 55%,#0b0905 100%);
    border-radius:12px;padding:18px 16px 0;position:relative;overflow:clip}
  .sigmajor::before{content:'';position:absolute;inset:46px 0 0;pointer-events:none;
    background:repeating-linear-gradient(90deg,rgba(255,214,120,.05) 0 2px,transparent 2px 46px);
    animation:mjr-glow 7s ease-in-out infinite alternate}
  @keyframes mjr-glow{from{opacity:.4}to{opacity:.95}}

  .mjr-eyebrow{font-family:Antonio,sans-serif;font-size:11px;letter-spacing:5px;color:var(--mj-dim);text-align:center}
  .mjr-title{font-family:Antonio,sans-serif;font-weight:700;font-size:38px;letter-spacing:7px;text-align:center;
    color:#fff6de;text-shadow:0 0 26px ${accent}88;margin:2px 0;animation:mjr-t 5s ease-in-out infinite alternate}
  @keyframes mjr-t{from{text-shadow:0 0 12px ${accent}55}to{text-shadow:0 0 34px ${accent}aa}}
  .mjr-tagline{text-align:center;font-size:12.5px;letter-spacing:2px;color:var(--mj-dim);margin-bottom:12px}

  .mjr-what{border:1px solid var(--mj-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:linear-gradient(180deg,rgba(48,38,18,.6),rgba(18,14,8,.6))}
  .mjr-what-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:Antonio,sans-serif;font-size:16px;letter-spacing:2px}
  .mjr-what-c{font-size:9px;letter-spacing:2px;border:1px solid ${cat.accent||accent}66;color:${cat.accent||accent};padding:2px 6px;border-radius:3px}
  .mjr-what-d{font-size:13px;line-height:1.55;color:var(--mj-dim);margin:6px 0 0}
  .mjr-w{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
  .mjr-w span{display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:1.4px;color:var(--mj-dim);text-transform:uppercase}
  .mjr-w s{text-decoration:none;display:inline-block;width:50px;height:4px;border-radius:2px;background:rgba(255,255,255,.1)}
  .mjr-w s b{display:block;height:100%;border-radius:2px;background:${accent}}

  .mjr-field{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;padding:11px 8px;margin-bottom:10px;
    border:1px solid var(--mj-line);border-radius:10px;background:rgba(10,8,4,.6)}
  .mjr-hg{display:flex;flex-direction:column;align-items:center;gap:3px;width:52px;
    animation:mjr-in .3s ease both}
  .mjr-hg .bb-av{border-radius:6px;border:2px solid ${accent}77}
  .mjr-hg-n{font-family:Antonio,sans-serif;font-size:9px;letter-spacing:1px;color:#e6dcc6}
  .mjr-hg.is-out{opacity:.32;filter:grayscale(.85)}
  .mjr-hg.is-out .bb-av{border-color:#5b5346}
  .mjr-hg.is-win .bb-av{border-color:#ffd970;box-shadow:0 0 18px rgba(255,217,112,.6)}

  .mjr-strip{position:sticky;top:46px;z-index:6;display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:8px;
    padding:8px 10px;margin-bottom:14px;border:1px solid var(--mj-line);border-radius:8px;
    background:rgba(12,9,5,.95);backdrop-filter:blur(4px)}
  .mjr-strip>div{display:flex;flex-direction:column;gap:2px;min-width:0}
  .mjr-strip-r{border-left:1px solid var(--mj-line);padding-left:10px}
  .mjr-k{font-family:Antonio,sans-serif;font-size:9px;letter-spacing:2.4px;color:var(--mj-dim)}
  .mjr-v{font-family:Antonio,sans-serif;font-size:21px;letter-spacing:1px;display:flex;align-items:baseline;gap:5px}
  .mjr-v b{color:${accent}}.mjr-v i{font-style:normal;font-size:11px;color:var(--mj-dim)}
  .mjr-v-txt{font-size:13px;letter-spacing:1.6px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  .mjr-card{border:1px solid var(--mj-line);border-radius:10px;padding:13px;margin-bottom:10px;position:relative;
    background:linear-gradient(180deg,rgba(38,30,15,.72),rgba(14,11,6,.8));animation:mjr-in .32s cubic-bezier(.2,.8,.25,1) both}
  @keyframes mjr-in{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
  .mjr-card.is-locked{padding:8px;text-align:center;opacity:.14;animation:none;background:none}
  .mjr-lock{font-family:Antonio,sans-serif;letter-spacing:6px;color:var(--mj-dim)}
  .mjr-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
  .mjr-sub{font-family:Antonio,sans-serif;font-size:9px;letter-spacing:2px;color:var(--mj-dim)}
  .mjr-tag{font-family:Antonio,sans-serif;font-size:11px;letter-spacing:2.4px;color:${accent};
    border:1px solid ${accent}55;background:${accent}14;padding:2px 9px;border-radius:3px}
  .mjr-tag-gold{color:#ffd970;border-color:#ffd97066;background:#ffd97018}
  .mjr-tag-tie{color:#8fd0ff;border-color:#8fd0ff66;background:#8fd0ff14}
  .mjr-tag-quiet{color:#9d9384;border-color:#9d938444;background:#9d938411}
  .mjr-body{font-size:14px;line-height:1.62;margin:0}
  .mjr-flav{margin:9px 0 0;padding-top:7px;border-top:1px dashed rgba(200,170,110,.18);
    font-size:12px;color:#9b8f7c;font-style:italic}

  .mjr-ask{text-align:center;margin:2px 0 10px}
  .mjr-ask-k{font-family:Antonio,sans-serif;font-size:9px;letter-spacing:3.4px;color:var(--mj-dim)}
  .mjr-ask-t{font-family:Antonio,sans-serif;font-size:23px;letter-spacing:1.6px;line-height:1.25;
    color:#fff4dc;margin:4px 0 0;text-shadow:0 0 18px ${accent}44}

  .mjr-pair{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin-bottom:10px}
  .mjr-nom{margin:0;text-align:center;padding:8px 6px;border-radius:9px;border:1px solid rgba(255,255,255,.08);position:relative}
  .mjr-nom .bb-av{border-radius:8px;border:2px solid rgba(255,255,255,.14)}
  .mjr-nom figcaption{font-family:Antonio,sans-serif;font-size:14px;letter-spacing:1.6px;margin-top:5px;color:#f0e6d2}
  .mjr-nom.is-maj{border-color:${accent}88;background:${accent}12}
  .mjr-nom.is-maj .bb-av{border-color:${accent};box-shadow:0 0 16px ${accent}55}
  .mjr-nom-flag{position:absolute;top:-8px;left:50%;transform:translateX(-50%);white-space:nowrap;
    font-family:Antonio,sans-serif;font-size:8px;letter-spacing:2px;color:#1b1508;background:${accent};padding:2px 7px;border-radius:3px}
  .mjr-or{font-family:Antonio,sans-serif;font-size:12px;letter-spacing:2px;color:var(--mj-dim)}

  .mjr-split{margin-bottom:10px}
  .mjr-split-bar{display:block;height:7px;border-radius:4px;background:rgba(255,120,110,.32);overflow:hidden}
  .mjr-split-bar b{display:block;height:100%;background:linear-gradient(90deg,${accent},#ffd970);
    animation:mjr-fill .6s cubic-bezier(.2,.8,.25,1) both}
  @keyframes mjr-fill{from{width:0!important}}
  .mjr-split-l{display:block;margin-top:4px;font-size:10.5px;letter-spacing:1.2px;color:var(--mj-dim)}
  .mjr-split-l b{color:${accent}}.mjr-split-l i{font-style:normal;color:#ff8a80}

  .mjr-boards{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}
  .mjr-board{display:flex;align-items:center;gap:6px;padding:4px 8px 4px 4px;border-radius:20px;
    border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:11px}
  .mjr-board .bb-av{border-radius:50%}
  .mjr-board-n{font-family:Antonio,sans-serif;letter-spacing:1px;color:#e8dec8}
  .mjr-board-p{font-size:10px;letter-spacing:.6px;padding:1px 6px;border-radius:10px;
    background:rgba(255,255,255,.08);color:#cfc4ab}
  .mjr-board.is-right{border-color:${accent}66;background:${accent}12}
  .mjr-board.is-right .mjr-board-p{background:${accent}2a;color:#ffe9b8}
  .mjr-board.is-wrong{border-color:rgba(255,138,128,.5);background:rgba(255,138,128,.08);opacity:.92}
  .mjr-board.is-wrong .mjr-board-p{background:rgba(255,138,128,.2);color:#ffcdc8}
  .mjr-board.is-void{opacity:.6;border-style:dashed}

  .mjr-verdict{margin:0 0 9px;padding:8px 10px;border-radius:7px;font-size:13px;line-height:1.55;
    background:rgba(255,255,255,.04);border-left:3px solid ${accent}}
  .mjr-verdict.is-tie{border-left-color:#8fd0ff;color:#dbeeff}
  .mjr-round.is-tie{border-color:rgba(143,208,255,.34)}

  .mjr-outs{display:flex;flex-direction:column;gap:7px}
  .mjr-out{display:flex;gap:9px;align-items:flex-start;padding:8px 9px;border-radius:7px;
    border-left:3px solid rgba(255,138,128,.7);background:rgba(255,138,128,.07)}
  .mjr-out .bb-av{border-radius:6px;filter:grayscale(.5)}
  .mjr-out-tag{font-family:Antonio,sans-serif;font-size:8.5px;letter-spacing:2px;color:#ff9d94;display:block;margin-bottom:3px}
  .mjr-out p{margin:0;font-size:13px;line-height:1.55}

  .mjr-guesses{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px}
  .mjr-guess{display:flex;align-items:center;gap:7px;padding:6px 10px 6px 6px;border-radius:9px;
    border:1px solid rgba(143,208,255,.28);background:rgba(143,208,255,.06)}
  .mjr-guess.is-closest{border-color:${accent}88;background:${accent}16}
  .mjr-guess .bb-av{border-radius:50%}
  .mjr-guess-n{font-family:Antonio,sans-serif;font-size:12px;letter-spacing:1.2px}
  .mjr-guess-num{font-family:Antonio,sans-serif;font-size:22px;letter-spacing:1px;color:#fff2d6}
  .mjr-guess-tag{font-size:8.5px;letter-spacing:1.6px;color:var(--mj-dim)}

  .mjr-win{border-color:rgba(255,217,112,.5);background:linear-gradient(180deg,rgba(72,55,16,.6),rgba(14,11,6,.85))}
  .mjr-win-b{display:flex;gap:14px;align-items:center}
  .mjr-win-av .bb-av{border-radius:10px;border:3px solid #ffd970;box-shadow:0 0 26px rgba(255,217,112,.5)}
  .mjr-win-n{font-family:Antonio,sans-serif;font-size:25px;letter-spacing:3px;color:#ffeab6;margin-bottom:4px}

  .mjr-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -16px 0;background:linear-gradient(180deg,rgba(11,9,5,0),rgba(11,9,5,.96) 40%);backdrop-filter:blur(3px)}
  .mjr-count{font-family:Antonio,sans-serif;font-size:10px;letter-spacing:2.4px;color:var(--mj-dim)}
  .mjr-done{font-family:Antonio,sans-serif;font-size:10px;letter-spacing:2.4px;color:${accent}}

  ${sealCss('mjr', accent)}
  @media(max-width:700px){
    .mjr-strip{grid-template-columns:1fr 1fr}
    .mjr-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--mj-line);padding:6px 0 0}
    .mjr-title{font-size:28px;letter-spacing:4px}
    .mjr-ask-t{font-size:18px}
    .mjr-pair{grid-template-columns:1fr;gap:6px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigmajor *,.sigmajor *::before,.sigmajor *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="mjr-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="mjr-title">${E((comp.name || 'MAJORITY RULES').toUpperCase())}</div>
  <div class="mjr-tagline">${sealed ? 'not what you think &middot; and nobody sees who wins' : 'not what you think &middot; what the house thinks'}</div>

  <div class="mjr-what">
    <div class="mjr-what-h"><span class="mjr-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Majority Rules')}</b></div>
    ${comp.desc ? `<p class="mjr-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="mjr-w">${weights.map(([k, w]) =>
      `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="mjr-what-d">Sat out: ${
      (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
      isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${field}
  ${strip}
  <div>${cards}</div>

  <div class="mjr-ctrl">
    ${done ? `<span class="mjr-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'EVERY BOARD IS DOWN.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.mjr-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
        state.idx < 0 ? 'Read the first question' : 'Next question'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="mjr-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
