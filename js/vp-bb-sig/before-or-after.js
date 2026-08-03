/**
 * Before or After — "The Season Timeline"
 *
 * A memory-lane game-show set. The centrepiece is a filmstrip of the season's
 * weeks running across the top; every question in this competition compares two
 * things that already happened in this house, so the two events light up on the
 * strip and a connector draws the chronological order between them.
 *
 * The screen is built entirely from the competition's own beats, in the order
 * the competition produced them. Consecutive beats that belong to the same
 * question number are drawn as one question card — the format asks one question
 * and can take two people out with it, and that is one moment, not two.
 *
 * Nothing is imported. Everything the screen needs arrives either on the episode
 * or through `u` (the Big Brother VP helper bundle), and the only interactivity
 * is the shared reveal handler.
 */

// ── helpers ───────────────────────────────────────────────────────────

const _QPREFIX = /^Question\s+(\d+)\s*:\s*/;

/** Deterministic pick — the week number and the step index, never a die roll. */
const _pick = (arr, seed) => arr[Math.abs(Math.round(seed)) % arr.length];

/** Studio lines between questions. Four or more of everything, always. */
const _HOST = [
  'Boards up. Nobody is allowed to look at anybody else\'s.',
  'Markers down, boards flipped, and the studio goes quiet enough to hear a cap click.',
  'The lock-in horn is coming whether the house is ready for it or not.',
  'Two things that happened in this house. One of them happened first.',
  'The question goes up on the screen and half the room mouths it back.',
  'Somebody down the line is counting weeks on their fingers again.',
];

const _STRIKE_STAMP = ['LOCKED OUT', 'BOARD DOWN', 'OUT OF IT', 'STRUCK', 'ANSWER WRONG'];
const _THREW_STAMP = ['MISSED IT ON PURPOSE', 'A CHOSEN WRONG ANSWER', 'DID NOT WANT IT', 'LOST IT DELIBERATELY'];

const _OPEN_SUB = [
  'The season, replayed as a quiz nobody was told to revise for.',
  'Everything on the strip already happened. The only question is what order.',
  'A memory game, in a house built to make people forget.',
  'The whole season, in the wrong order, on purpose.',
];

const _WIN_WASH = [
  'The last board still up.',
  'One board left lit on the whole floor.',
  'Everybody else is holding a blank. This one is not.',
  'The strip runs out of weeks before this one runs out of answers.',
];

/** The kind of season event a question is pointing at, for the strip markers. */
function _kindOf(text) {
  const t = String(text || '').toLowerCase();
  if (t.includes('eviction') || t.includes('sent out the door') || t.includes('voted')) return 'evict';
  if (t.includes('head of household') || t.includes('hoh')) return 'hoh';
  if (t.includes('veto')) return 'veto';
  if (t.includes('nomination') || t.includes('block')) return 'noms';
  return 'other';
}

const _KIND_LABEL = { evict: 'EVICTION', hoh: 'HOH', veto: 'VETO', noms: 'NOMS', other: 'HOUSE' };
const _KIND_COLOR = { evict: '#d9534f', hoh: '#e0a127', veto: '#2f9e9b', noms: '#b07c3a', other: '#8a7a63' };

/** Tiny pictorial markers — a door, a key, a shield, a card. */
function _marker(kind, size = 12) {
  const c = _KIND_COLOR[kind] || _KIND_COLOR.other;
  const open = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">`;
  if (kind === 'evict') {
    return `${open}<path d="M4 3h9v18H4z" fill="none" stroke="${c}" stroke-width="2"/>
      <circle cx="10.5" cy="12" r="1.2" fill="${c}"/>
      <path d="M15 12h6m-3-3 3 3-3 3" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (kind === 'hoh') {
    return `${open}<circle cx="8" cy="12" r="4.2" fill="none" stroke="${c}" stroke-width="2"/>
      <path d="M12 12h9m-2 0v3.5m-3-3.5v2.5" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`;
  }
  if (kind === 'veto') {
    return `${open}<path d="M12 3l7 3v6c0 4.2-3 7.6-7 9-4-1.4-7-4.8-7-9V6z" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M8.5 12.5 11 15l4.5-5" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (kind === 'noms') {
    return `${open}<rect x="4" y="5" width="7" height="14" rx="1" fill="none" stroke="${c}" stroke-width="2"/>
      <rect x="13" y="5" width="7" height="14" rx="1" fill="none" stroke="${c}" stroke-width="2"/></svg>`;
  }
  return `${open}<circle cx="12" cy="12" r="6" fill="none" stroke="${c}" stroke-width="2"/></svg>`;
}

/** The lockout X that drops over a struck board. */
const _LOCKOUT = `<svg class="sgb-x" viewBox="0 0 40 40" aria-hidden="true">
  <path d="M7 7 33 33M33 7 7 33" fill="none" stroke="#d9534f" stroke-width="4" stroke-linecap="round"/>
</svg>`;

/** A lit bulb ring for the podium marquee — light only, no layout movement. */
function _bulbs(n = 18) {
  let out = '';
  for (let i = 0; i < n; i++) out += `<i style="animation-delay:${(i * 0.11).toFixed(2)}s"></i>`;
  return `<div class="sgb-bulbs" aria-hidden="true">${out}</div>`;
}

// ── the screen ────────────────────────────────────────────────────────

export function rpBuildSigBeforeOrAfter(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const ordinal = typeof u.ordinal === 'function' ? u.ordinal : n => String(n);
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat)
    || { label: 'QUIZ', accent: '#3fb950' };

  const stateKey = `bb_sig_boa_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];

  const isHoh = actType === 'hoh';
  // Normalised results file per-player numbers under debug.scoreBreakdown; a
  // raw engine result carries them at the top level. Read both or every
  // correct-answer count on the podium renders as nothing.
  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const results = (act.results || []).filter(r => r && r.name);
  const winner = act.winner || results[0]?.name || null;
  const roster = (act.participants && act.participants.length ? act.participants : results.map(r => r.name))
    .filter(Boolean);

  // ── steps, straight off the beats ──
  //
  // Elimination beats for the same question arrive one per houseguest and carry
  // the identical question text, so they collapse into one card. Nothing is
  // dropped: every beat lands in exactly one step.
  const steps = [];
  let cur = null;
  beats.forEach(b => {
    if (b.badgeClass === 'gold') { steps.push({ type: 'win', rows: [{ beat: b, line: b.text }] }); cur = null; return; }
    const m = _QPREFIX.exec(b.text);
    if (!m) { steps.push({ type: 'open', rows: [{ beat: b, line: b.text }] }); cur = null; return; }
    const rest = b.text.slice(m[0].length);
    const qi = rest.indexOf('?');
    const ask = qi >= 0 ? rest.slice(0, qi + 1).trim() : rest.trim();
    const line = qi >= 0 ? rest.slice(qi + 1).trim() : '';
    if (cur && cur.q === Number(m[1]) && cur.ask === ask) { cur.rows.push({ beat: b, line }); return; }
    cur = { type: 'q', q: Number(m[1]), ask, rows: [{ beat: b, line }] };
    steps.push(cur);
  });
  if (!steps.length) return '';

  // ── the two events in every question, and where they sit in the season ──
  const parseAsk = ask => {
    const parts = String(ask).split(/\s*BEFORE or AFTER\s*/i);
    let a = (parts[0] || '').replace(/^Did\s+/i, '').replace(/\s+come$/i, '').trim();
    let b = (parts[1] || '').replace(/\?\s*$/, '').trim();
    const wk = s => { const m = /week\s+(\d+)/i.exec(s || ''); return m ? Number(m[1]) : null; };
    return { a, b, wa: wk(a), wb: wk(b), ka: _kindOf(a), kb: _kindOf(b) };
  };
  steps.forEach(s => { if (s.type === 'q') s.ev = parseAsk(s.ask); });

  // The strip runs as far as the season has run. Week numbers quoted in the
  // questions can only ever be weeks that already happened, so the wider of the
  // two is the honest length.
  let weeks = Math.max(1, Number(ep.num) || 1);
  steps.forEach(s => {
    if (!s.ev) return;
    weeks = Math.max(weeks, s.ev.wa || 0, s.ev.wb || 0);
  });
  weeks = Math.min(weeks, 20);

  // Faint markers for every week a question ever points at — season history,
  // not competition results, so it does not spoil anything.
  const marks = {};
  steps.forEach(s => {
    if (!s.ev) return;
    if (s.ev.wa) (marks[s.ev.wa] = marks[s.ev.wa] || new Set()).add(s.ev.ka);
    if (s.ev.wb) (marks[s.ev.wb] = marks[s.ev.wb] || new Set()).add(s.ev.kb);
  });

  const total = steps.length;
  const revealed = Math.max(0, state.idx + 1);
  const done = state.idx >= total - 1;

  // ── who is struck, and when ──
  const struckAt = {};   // name -> step index they went out on
  const struckTag = {};  // name -> the badge the competition gave them
  steps.forEach((s, i) => {
    if (s.type !== 'q') return;
    s.rows.forEach(r => {
      const tag = r.beat.badgeText || '';
      if (tag === 'CORRECT') return;
      (r.beat.players || []).filter(Boolean).forEach(n => {
        if (struckAt[n] === undefined) { struckAt[n] = i; struckTag[n] = tag; }
      });
    });
  });
  const winStep = steps.findIndex(s => s.type === 'win');

  // The live question — the last question step actually revealed.
  let live = null;
  for (let i = Math.min(state.idx, total - 1); i >= 0; i--) {
    if (steps[i] && steps[i].type === 'q') { live = steps[i]; break; }
  }

  // ── the filmstrip ──
  const cellPct = 100 / weeks;
  const centre = w => (w - 0.5) * cellPct;
  const litA = live?.ev?.wa || null;
  const litB = live?.ev?.wb || null;
  let connector = '';
  if (litA && litB && litA !== litB) {
    const x1 = centre(litA), x2 = centre(litB);
    const from = Math.min(x1, x2), to = Math.max(x1, x2);
    const mid = (from + to) / 2;
    connector = `<svg class="sgb-conn" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      <path d="M${from} 20 Q${mid} 2 ${to} 20" fill="none" stroke="#e0a127" stroke-width="1.6"
            stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <circle cx="${from}" cy="20" r="1.4" fill="#e0a127" vector-effect="non-scaling-stroke"/>
      <circle cx="${to}" cy="20" r="2.2" fill="#2f9e9b" vector-effect="non-scaling-stroke"/>
    </svg>`;
  } else if (litA && litB) {
    connector = `<svg class="sgb-conn" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      <path d="M${centre(litA)} 20 v-14" fill="none" stroke="#e0a127" stroke-width="1.6"
            stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/></svg>`;
  }

  let cells = '';
  for (let w = 1; w <= weeks; w++) {
    const kinds = marks[w] ? Array.from(marks[w]) : [];
    const lit = (w === litA || w === litB);
    cells += `<div class="sgb-week ${lit ? 'is-lit' : ''}" style="width:${cellPct}%">
      <span class="sgb-wk-n">${w}</span>
      <span class="sgb-wk-m">${kinds.length ? kinds.map(k => _marker(k, lit ? 13 : 11)).join('') : '<i class="sgb-dot"></i>'}</span>
    </div>`;
  }

  const strip = `<section class="sgb-strip" aria-label="Season timeline">
    <div class="sgb-strip-h"><b>THE SEASON SO FAR</b><span>${weeks} week${weeks === 1 ? '' : 's'} on tape</span></div>
    <div class="sgb-tape">
      <div class="sgb-sprock is-top"></div>
      <div class="sgb-weeks">${cells}${connector}</div>
      <div class="sgb-sprock is-bot"></div>
    </div>
    ${live ? `<div class="sgb-compare">
      <span class="sgb-chip ${litA ? 'is-lit' : ''}">${_marker(live.ev.ka, 12)}<b>${esc(live.ev.a)}</b>${litA ? `<u>WK ${litA}</u>` : ''}</span>
      <span class="sgb-vs">
        <svg viewBox="0 0 40 12" width="40" height="12" aria-hidden="true">
          <path d="M2 6h32m-5-4 5 4-5 4" fill="none" stroke="#8a7a63" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="sgb-chip ${litB ? 'is-lit' : ''}">${_marker(live.ev.kb, 12)}<b>${esc(live.ev.b)}</b>${litB ? `<u>WK ${litB}</u>` : ''}</span>
      ${litA && litB && litA !== litB
        ? `<span class="sgb-answer">${litA < litB ? 'BEFORE' : 'AFTER'}</span>`
        : (litA && litB ? '<span class="sgb-answer is-tight">SAME WEEK</span>' : '')}
    </div>` : `<div class="sgb-compare is-empty">Two things off this tape. One of them happened first.</div>`}
  </section>`;

  // ── the podium row ──
  const podium = roster.length ? `<section class="sgb-podium">
    ${_bulbs(Math.min(24, Math.max(10, roster.length * 2)))}
    <div class="sgb-boards">
      ${roster.map(n => {
        const outAt = struckAt[n];
        const isOut = outAt !== undefined && outAt <= state.idx;
        const isWin = winner === n && winStep >= 0 && state.idx >= winStep;
        const bd = breakdown[n] || {};
        const threw = struckTag[n] === 'THREW IT' || bd.threw;
        return `<figure class="sgb-board ${isOut ? 'is-out' : ''} ${isWin ? 'is-win' : ''} ${isOut && threw ? 'is-threw' : ''}">
          <span class="sgb-face">${avatar(n, 34)}${isOut ? _LOCKOUT : ''}</span>
          <figcaption>${esc(n)}</figcaption>
          <span class="sgb-state">${isWin ? 'LAST STANDING'
            : isOut ? (threw ? 'THREW IT' : (struckTag[n] || 'OUT'))
            : 'LIT'}</span>
          ${isOut && bd.questionsCorrect !== undefined
            ? `<span class="sgb-mini">${bd.questionsCorrect} right${bd.strikes ? ` &middot; ${bd.strikes} strike${bd.strikes === 1 ? '' : 's'}` : ''}</span>`
            : ''}
        </figure>`;
      }).join('')}
    </div>
  </section>` : '';

  // ── the question cards ──
  const cards = steps.map((s, i) => {
    if (i > state.idx) return `<article class="sgb-card is-hidden" aria-hidden="true"><span>?</span></article>`;
    if (s.type === 'open') {
      return `<article class="sgb-card is-open">
        <header><span class="sgb-tag">ON YOUR BOARDS</span></header>
        <p>${esc(s.rows[0].line)}</p>
        <div class="sgb-faces">${(s.rows[0].beat.players || []).filter(Boolean).map(n => avatar(n, 26)).join('')}</div>
      </article>`;
    }
    if (s.type === 'win') {
      const b = s.rows[0].beat;
      return `<article class="sgb-card is-winner">
        <header><span class="sgb-tag is-gold">${esc(b.badgeText || (isHoh ? 'HOH' : 'VETO'))}</span></header>
        <div class="sgb-win-b">
          <span class="sgb-win-face">${avatar(winner || (b.players || [])[0] || '', 56)}</span>
          <p>${esc(b.text)}</p>
        </div>
        <div class="sgb-win-wash">${esc(_pick(_WIN_WASH, (Number(ep.num) || 0) + i))}</div>
      </article>`;
    }
    const outs = s.rows.filter(r => (r.beat.badgeText || '') !== 'CORRECT');
    const rights = s.rows.filter(r => (r.beat.badgeText || '') === 'CORRECT');
    return `<article class="sgb-card is-q">
      <header>
        <span class="sgb-tag">QUESTION ${s.q}</span>
        <span class="sgb-host">${esc(_pick(_HOST, (Number(ep.num) || 0) + i))}</span>
      </header>
      <p class="sgb-ask">${esc(s.ask)}</p>
      ${rights.map(r => `<div class="sgb-row is-right">
        <span class="sgb-row-face">${(r.beat.players || []).filter(Boolean).map(n => avatar(n, 30)).join('')}</span>
        <div><span class="sgb-row-tag is-green">${esc(r.beat.badgeText || 'CORRECT')}</span>
          <p>${esc(r.line)}</p></div>
      </div>`).join('')}
      ${outs.map((r, j) => {
        const threw = (r.beat.badgeText || '') === 'THREW IT';
        return `<div class="sgb-row is-out ${threw ? 'is-threw' : ''}">
          <span class="sgb-row-face">${(r.beat.players || []).filter(Boolean).map(n => avatar(n, 30)).join('')}${_LOCKOUT}</span>
          <div>
            <span class="sgb-row-tag ${threw ? 'is-grey' : 'is-red'}">${esc(r.beat.badgeText || 'ELIMINATED')}</span>
            <span class="sgb-stamp">${esc(_pick(threw ? _THREW_STAMP : _STRIKE_STAMP, (Number(ep.num) || 0) + i + j))}</span>
            <p>${esc(r.line)}</p>
          </div>
        </div>`;
      }).join('')}
    </article>`;
  }).join('');

  // ── standings footer, only once it is all in ──
  const board = done && results.length ? `<section class="sgb-final">
    <div class="sgb-final-h">FINAL BOARD</div>
    ${results.map((r, i) => {
      const bd = breakdown[r.name] || {};
      return `<div class="sgb-final-row ${i === 0 ? 'is-first' : ''}">
        <span class="sgb-fp">${i === 0 ? (isHoh ? 'HOH' : 'VETO') : esc(ordinal(i + 1))}</span>
        <span class="sgb-ff">${avatar(r.name, 24)}</span>
        <span class="sgb-fn">${esc(r.name)}</span>
        <span class="sgb-fs">${bd.questionsCorrect !== undefined ? `${bd.questionsCorrect} correct` : ''}</span>
        ${r.threw || bd.threw ? '<span class="sgb-fthrew">THREW</span>' : '<span class="sgb-fthrew"></span>'}
      </div>`;
    }).join('')}
  </section>` : '';

  const nextLabel = state.idx < 0 ? 'Start the quiz'
    : (steps[state.idx + 1] && steps[state.idx + 1].type === 'win') ? 'Last board standing'
    : 'Next question';

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigboa">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Bungee&family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');
  .sigboa{--amber:#e0a127;--sepia:#f3e3c3;--ink:#241c12;--teal:#2f9e9b;--deep:#12100d;--rust:#d9534f;
    max-width:1100px;margin:0 auto;font-family:'DM Sans',system-ui,sans-serif;color:var(--sepia);
    background:radial-gradient(120% 80% at 50% 0%,#241d14 0%,#15120d 55%,#0d0b08 100%);
    padding:18px 16px 96px;border-radius:10px;position:relative;overflow:hidden}
  .sigboa:before{content:'';position:absolute;inset:46px 0 0;pointer-events:none;
    background:repeating-linear-gradient(0deg,rgba(255,255,255,0.018) 0 2px,transparent 2px 4px);opacity:.7}
  .sigboa .sgb-hd{text-align:center;position:relative;z-index:2}
  .sigboa .sgb-k{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:4px;color:#9b8869}
  .sigboa h2.sgb-t{font-family:'Bungee',cursive;font-size:clamp(26px,5vw,44px);letter-spacing:2px;margin:6px 0 4px;
    color:var(--amber);text-shadow:0 0 18px rgba(224,161,39,.35),0 2px 0 #6b4a12}
  .sigboa .sgb-s{font-size:12.5px;color:#b9a687;margin-bottom:14px}
  .sigboa .sgb-catpill{display:inline-block;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;
    border:1px solid;border-radius:3px;padding:2px 7px;margin-bottom:6px}

  /* filmstrip */
  .sgb-strip{position:relative;z-index:2;margin:6px 0 16px;background:rgba(30,25,18,.72);
    border:1px solid rgba(224,161,39,.22);border-radius:8px;padding:10px 12px 12px}
  .sgb-strip-h{display:flex;justify-content:space-between;align-items:baseline;
    font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:2px;color:#9b8869;margin-bottom:8px}
  .sgb-strip-h b{color:var(--amber)}
  .sgb-tape{position:relative;background:linear-gradient(180deg,#1b1610,#141009);border-radius:4px;padding:12px 0}
  .sgb-sprock{position:absolute;left:0;right:0;height:8px;
    background:repeating-linear-gradient(90deg,rgba(243,227,195,.22) 0 6px,transparent 6px 16px)}
  .sgb-sprock.is-top{top:2px}.sgb-sprock.is-bot{bottom:2px}
  .sgb-weeks{position:relative;display:flex;align-items:flex-end;padding:10px 0 6px}
  .sgb-week{text-align:center;border-left:1px solid rgba(243,227,195,.10);padding:2px 0 0}
  .sgb-week:first-child{border-left:none}
  .sgb-wk-n{display:block;font-family:'Space Mono',monospace;font-size:10px;color:#7d6f58}
  .sgb-wk-m{display:flex;gap:2px;justify-content:center;align-items:center;min-height:15px;opacity:.45}
  .sgb-week.is-lit{background:linear-gradient(180deg,rgba(224,161,39,.16),transparent);border-radius:4px}
  .sgb-week.is-lit .sgb-wk-n{color:var(--amber);font-weight:700}
  .sgb-week.is-lit .sgb-wk-m{opacity:1;filter:drop-shadow(0 0 5px rgba(224,161,39,.55))}
  .sgb-dot{display:inline-block;width:3px;height:3px;border-radius:50%;background:#4a4033}
  .sgb-conn{position:absolute;left:0;right:0;bottom:24px;height:26px;pointer-events:none;
    filter:drop-shadow(0 0 5px rgba(224,161,39,.4))}
  .sgb-compare{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;
    font-size:11.5px;color:#c8b795}
  .sgb-compare.is-empty{font-style:italic;color:#7d6f58;font-size:11px}
  .sgb-chip{display:inline-flex;align-items:center;gap:6px;border:1px dashed rgba(243,227,195,.2);
    border-radius:20px;padding:4px 10px;background:rgba(0,0,0,.25)}
  .sgb-chip.is-lit{border-style:solid;border-color:rgba(224,161,39,.55);background:rgba(224,161,39,.10)}
  .sgb-chip b{font-weight:500;font-size:11.5px}
  .sgb-chip u{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--teal);text-decoration:none}
  .sgb-vs{display:inline-flex;align-items:center;opacity:.8}
  .sgb-answer{font-family:'Bungee',cursive;font-size:12px;letter-spacing:2px;color:var(--deep);
    background:var(--amber);border-radius:4px;padding:3px 10px}
  .sgb-answer.is-tight{background:#6b5a3c;color:var(--sepia)}

  /* podium */
  .sgb-podium{position:relative;z-index:2;border:1px solid rgba(47,158,155,.25);border-radius:8px;
    background:linear-gradient(180deg,rgba(47,158,155,.07),rgba(0,0,0,.28));padding:16px 12px 12px;margin-bottom:16px}
  .sgb-bulbs{position:absolute;top:5px;left:10px;right:10px;display:flex;justify-content:space-between}
  .sgb-bulbs i{width:5px;height:5px;border-radius:50%;background:rgba(224,161,39,.35);
    box-shadow:0 0 6px rgba(224,161,39,.35);animation:sgbBulb 2.4s ease-in-out infinite}
  @keyframes sgbBulb{0%,100%{opacity:.25;box-shadow:0 0 3px rgba(224,161,39,.2)}
    50%{opacity:1;box-shadow:0 0 9px rgba(224,161,39,.75)}}
  .sgb-boards{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
  .sgb-board{width:82px;margin:0;text-align:center;padding:8px 4px 6px;border-radius:6px;
    background:rgba(243,227,195,.06);border:1px solid rgba(243,227,195,.12);transition:opacity .3s,filter .3s}
  .sgb-board figcaption{font-size:10.5px;margin-top:5px;color:var(--sepia);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sgb-face{position:relative;display:inline-block}
  .sgb-x{position:absolute;inset:-3px;width:calc(100% + 6px);height:calc(100% + 6px);opacity:.9}
  .sgb-state{display:block;font-family:'Space Mono',monospace;font-size:8px;letter-spacing:1px;
    color:var(--teal);margin-top:3px}
  .sgb-mini{display:block;font-family:'Space Mono',monospace;font-size:8px;color:#7d6f58}
  .sgb-board.is-out{opacity:.42;filter:grayscale(1)}
  .sgb-board.is-out .sgb-state{color:var(--rust)}
  .sgb-board.is-threw .sgb-state{color:#8a8a8a}
  .sgb-board.is-win{opacity:1;filter:none;border-color:rgba(224,161,39,.6);
    background:radial-gradient(80% 80% at 50% 0%,rgba(224,161,39,.28),rgba(224,161,39,.06));
    box-shadow:0 0 22px rgba(224,161,39,.25)}
  .sgb-board.is-win .sgb-state{color:var(--amber)}

  /* cards */
  .sgb-card{position:relative;z-index:2;border-radius:8px;padding:12px 14px;margin-bottom:10px;
    background:rgba(243,227,195,.05);border:1px solid rgba(243,227,195,.13)}
  .sgb-card.is-hidden{opacity:.10;text-align:center;font-family:'Space Mono',monospace;padding:8px}
  .sgb-card header{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px}
  .sgb-tag{font-family:'Bungee',cursive;font-size:11px;letter-spacing:2px;color:var(--deep);
    background:var(--sepia);border-radius:3px;padding:2px 8px}
  .sgb-tag.is-gold{background:var(--amber)}
  .sgb-card .sgb-host{font-size:11px;color:#907f63;font-style:italic}
  .sgb-ask{font-family:'Space Mono',monospace;font-size:13px;line-height:1.55;color:var(--amber);
    background:rgba(0,0,0,.3);border-left:3px solid var(--amber);border-radius:0 5px 5px 0;padding:9px 11px;margin:4px 0 10px}
  .sgb-row{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-top:1px dashed rgba(243,227,195,.12)}
  .sgb-row:first-of-type{border-top:none}
  .sgb-row-face{position:relative;display:inline-flex;flex:0 0 auto}
  .sgb-row p{margin:4px 0 0;font-size:12.5px;line-height:1.6;color:#e6dcc6}
  .sgb-row-tag{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1.5px;padding:2px 6px;border-radius:3px}
  .sgb-row-tag.is-red{color:var(--rust);background:rgba(217,83,79,.14)}
  .sgb-row-tag.is-grey{color:#a9a9a9;background:rgba(160,160,160,.12)}
  .sgb-row-tag.is-green{color:#69c07d;background:rgba(105,192,125,.13)}
  .sgb-stamp{font-family:'Bungee',cursive;font-size:9px;letter-spacing:1px;color:rgba(217,83,79,.75);
    margin-left:8px;display:inline-block;transform:rotate(-3deg)}
  .sgb-row.is-threw .sgb-stamp{color:rgba(180,180,180,.7)}
  .sgb-row.is-out .sgb-row-face{filter:grayscale(1);opacity:.7}
  .sgb-faces{display:flex;gap:6px;margin-top:8px}
  .sgb-card.is-open p{margin:0;font-size:12.5px;line-height:1.6}
  .sgb-card.is-winner{border-color:rgba(224,161,39,.55);
    background:radial-gradient(120% 100% at 50% 0%,rgba(224,161,39,.22),rgba(224,161,39,.04));
    box-shadow:0 0 30px rgba(224,161,39,.18)}
  .sgb-win-b{display:flex;gap:14px;align-items:center}
  .sgb-win-b p{margin:0;font-size:13px;line-height:1.65}
  .sgb-win-face{flex:0 0 auto;border-radius:50%;box-shadow:0 0 22px rgba(224,161,39,.5)}
  .sgb-win-wash{margin-top:8px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;
    color:var(--amber);text-align:right}

  /* final board */
  .sgb-final{position:relative;z-index:2;margin-top:14px;border:1px solid rgba(243,227,195,.14);border-radius:8px;padding:10px 12px}
  .sgb-final-h{font-family:'Bungee',cursive;font-size:11px;letter-spacing:3px;color:#b9a687;margin-bottom:8px}
  .sgb-final-row{display:grid;grid-template-columns:52px 26px 1fr auto 56px;gap:8px;align-items:center;
    padding:4px 0;border-top:1px solid rgba(243,227,195,.07);font-size:11.5px}
  .sgb-fp{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;color:#8b7b60}
  .sgb-final-row.is-first .sgb-fp,.sgb-final-row.is-first .sgb-fn{color:var(--amber);font-weight:700}
  .sgb-fs{font-family:'Space Mono',monospace;font-size:9.5px;color:#7d6f58}
  .sgb-fthrew{font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:1px;color:#8a8a8a;text-align:right}

  /* controls */
  .sgb-ctrl{position:sticky;bottom:0;z-index:5;display:flex;gap:8px;justify-content:center;align-items:center;
    margin-top:14px;padding:10px;background:linear-gradient(180deg,rgba(13,11,8,0),rgba(13,11,8,.92) 40%);
    backdrop-filter:blur(3px)}
  .sgb-btn{font-family:'Bungee',cursive;font-size:11px;letter-spacing:1.5px;cursor:pointer;padding:9px 18px;
    border-radius:5px;border:1px solid var(--amber);background:rgba(224,161,39,.14);color:var(--amber)}
  .sgb-btn.is-ghost{border-color:rgba(243,227,195,.3);background:transparent;color:#b9a687}
  .sgb-cnt{font-family:'Space Mono',monospace;font-size:10.5px;color:#8b7b60;letter-spacing:1px}
  .sgb-done{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:2px;color:var(--teal)}
  @media (max-width:640px){
    .sgb-board{width:70px}
    .sgb-final-row{grid-template-columns:44px 24px 1fr auto;}
    .sgb-fthrew{display:none}
  }
  @media (prefers-reduced-motion:reduce){
    .sgb-bulbs i{animation:none;opacity:.6}
    .sigboa *{transition:none!important}
  }
  </style>

  <div class="sgb-hd">
    <div class="sgb-k">WEEK ${esc(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
    <h2 class="sgb-t">${esc(comp.name || 'Before or After')}</h2>
    <div class="sgb-catpill" style="color:${cat.accent};border-color:${cat.accent}66">${esc(cat.label || 'QUIZ')}</div>
    <div class="sgb-s">${esc(comp.desc || _pick(_OPEN_SUB, Number(ep.num) || 0))}</div>
    ${(comp.excluded || []).filter(Boolean).length ? `<div class="sgb-s">Sat out: ${
      (comp.excluded || []).filter(Boolean).map(esc).join(', ')}${
      isHoh && act.outgoingHoh ? ` · ${esc(act.outgoingHoh)} cannot defend the room` : ''}</div>` : ''}
  </div>

  ${strip}
  ${podium}
  ${cards}
  ${board}

  <div class="sgb-ctrl">
    ${done ? `<span class="sgb-done">EVERY BOARD IS DOWN BUT ONE</span>` : `
      <button class="sgb-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}">${nextLabel}</button>
      <button class="sgb-btn is-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="sgb-cnt">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}

export default rpBuildSigBeforeOrAfter;
