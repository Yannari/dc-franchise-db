// ══════════════════════════════════════════════════════════════════════
// recap.js — Season Recap: a full-screen, scroll-driven "Story of the Season"
// ══════════════════════════════════════════════════════════════════════
// Two layers:
//   1. DATA LAYER — pure functions of gs that derive the story beats.
//      No DOM, no side effects → unit-testable.
//   2. UI LAYER  — full-screen overlay, scroll reveals, inline SVG, audio.
// Beats: winner's journey · biggest blindsides · power shifts & alliances ·
//        rivalries & showmances. Available only on a completed season.
import { gs, seasonConfig } from './core.js';
import { getBond } from './bonds.js';
import { audio } from './audio.js';

// ──────────────────────────────────────────────────────────────────────
// DATA LAYER
// ──────────────────────────────────────────────────────────────────────

// Popularity score for `name` as of episode `ep` — the most recent arc point
// at or before `ep`. Returns 0 when there is no data.
export function _scoreAtEp(g, name, ep) {
  const arc = (g?.popularityArcs && g.popularityArcs[name]) || [];
  let score = 0;
  for (const pt of arc) {
    if (pt.ep <= ep) score = pt.score;
    else break;
  }
  return score;
}

// The episode where the popularity lead last changed hands ({ep, from, to}),
// or null if there is not enough data.
export function _powerShiftEp(g) {
  const arcs = g?.popularityArcs || {};
  const names = Object.keys(arcs);
  if (names.length < 2) return null;
  const eps = [...new Set(names.flatMap(n => arcs[n].map(e => e.ep)))].sort((a, b) => a - b);
  let prevLeader = null, shift = null;
  for (const ep of eps) {
    let leader = null, best = -Infinity;
    for (const n of names) {
      const s = _scoreAtEp(g, n, ep);
      if (s > best) { best = s; leader = n; }
    }
    if (prevLeader && leader && leader !== prevLeader) shift = { ep, from: prevLeader, to: leader };
    prevLeader = leader;
  }
  return shift;
}

export function recapWinnerJourney(g = gs) {
  const winner = g?.finaleResult?.winner || null;
  if (!winner) return null;
  const rawArc = (g.popularityArcs && g.popularityArcs[winner]) || [];
  const arc = rawArc.map(e => ({ ep: e.ep, score: e.score }));
  const immunityWins = (g.episodeHistory || []).filter(h => h.immunityWinner === winner).length;
  return {
    winner,
    arc,
    immunityWins,
    juryVote: g.finaleResult?.votes || null,
    juryReasoning: g.finaleResult?.reasoning || null,
  };
}

function _blindsideReason({ booted, votesAgainst, totalVoters, heldAdvantage, bootedScore }) {
  if (heldAdvantage) return `${booted} went home with an advantage still in their pocket.`;
  if (totalVoters && votesAgainst <= Math.ceil(totalVoters / 2)) return `${booted} was blindsided — never saw the votes coming.`;
  if (bootedScore >= 5) return `A fan favorite fell: ${booted} was voted out at the peak of their game.`;
  return `${booted} was sent packing ${votesAgainst}-vote${votesAgainst === 1 ? '' : 's'} strong.`;
}

export function recapBlindsides(g = gs) {
  const hist = g?.episodeHistory || [];
  const advHolders = new Set((g?.advantages || []).map(a => a.holder));
  const out = [];
  for (const h of hist) {
    const booted = h.eliminated;
    if (!booted) continue;
    const log = (h.votingLog || []).filter(v => v.voter !== 'THE GAME');
    const votesAgainst = log.filter(v => v.voted === booted).length;
    const totalVoters = new Set(log.map(v => v.voter)).size;
    const bootedScore = _scoreAtEp(g, booted, h.num);
    const heldAdvantage = advHolders.has(booted);
    let upset = Math.max(0, bootedScore);
    if (heldAdvantage) upset += 8;
    if (totalVoters && votesAgainst <= Math.ceil(totalVoters / 2)) upset += 3;
    out.push({
      ep: h.num, booted, votesAgainst, totalVoters, heldAdvantage,
      score: upset,
      reason: _blindsideReason({ booted, votesAgainst, totalVoters, heldAdvantage, bootedScore }),
    });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, 3);
}

export function recapAlliances(g = gs) {
  const alliances = (g?.namedAlliances || []).map(a => ({
    name: a.name,
    members: [...(a.members || [])],
    formed: a.formed || 0,
    betrayals: (a.betrayals || []).map(b => ({
      player: b.player || (typeof b === 'string' ? b : '?'),
      ep: b.ep || null,
      severity: b.severity || 'moderate',
    })),
    active: !!a.active,
  }));
  const dominant = alliances.slice().sort((a, b) => b.members.length - a.members.length)[0] || null;
  return { alliances, dominant, shift: _powerShiftEp(g) };
}

export function recapRelationships(g = gs) {
  const rivalries = (g?.heroVillainRivalries || [])
    .filter(r => r && r.hero && r.villain)
    .map(r => ({ a: r.hero, b: r.villain, kind: 'hero-villain' }));
  const seen = new Set();
  const showmances = [];
  for (const s of (g?.showmances || [])) {
    if (!s.players || s.players.length !== 2) continue;
    const key = [...s.players].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    showmances.push({ players: [...s.players], broken: !!s.broken, phase: s.phase || null });
  }
  return { rivalries, showmances };
}

// Whether a recap can be shown — only once a season is complete with a winner.
export function recapAvailable(g = gs) {
  return !!(g && g.phase === 'complete' && g.finaleResult && g.finaleResult.winner);
}

export function buildSeasonRecap(g = gs) {
  if (!recapAvailable(g)) return null;
  return {
    seasonName: seasonConfig?.name || 'The Season',
    winner: recapWinnerJourney(g),
    blindsides: recapBlindsides(g),
    alliances: recapAlliances(g),
    relationships: recapRelationships(g),
  };
}

// ──────────────────────────────────────────────────────────────────────
// UI LAYER — full-screen scroll recap. "30 for 30" documentary feel.
// ──────────────────────────────────────────────────────────────────────

const _esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function _maxEp(recap) {
  let m = 1;
  (recap.winner?.arc || []).forEach(p => { if (p.ep > m) m = p.ep; });
  recap.alliances.alliances.forEach(a => a.betrayals.forEach(b => { if (b.ep > m) m = b.ep; }));
  return m;
}

// Winner popularity line chart (inline SVG). immunityEps get gold markers.
function _svgWinnerChart(arc, maxEp) {
  if (!arc.length) return '<div class="rcp-empty">No popularity arc was recorded.</div>';
  const W = 620, H = 200, padL = 34, padR = 22, padT = 22, padB = 28;
  const scores = arc.map(p => p.score);
  const minS = Math.min(0, ...scores), maxS = Math.max(1, ...scores);
  const xOf = ep => padL + ((ep - 1) / Math.max(1, maxEp - 1)) * (W - padL - padR);
  const yOf = s => H - padB - ((s - minS) / Math.max(1, maxS - minS)) * (H - padT - padB);
  const linePts = arc.map(p => `${xOf(p.ep).toFixed(1)},${yOf(p.score).toFixed(1)}`).join(' ');
  const areaPts = `${padL},${H - padB} ${linePts} ${xOf(arc[arc.length - 1].ep).toFixed(1)},${H - padB}`;
  const dots = arc.map(p =>
    `<circle cx="${xOf(p.ep).toFixed(1)}" cy="${yOf(p.score).toFixed(1)}" r="4" class="rcp-dot"/>`).join('');
  const base = yOf(0);
  return `<svg class="rcp-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Winner popularity over the season">
    <defs><linearGradient id="rcpFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(240,192,64,.34)"/><stop offset="100%" stop-color="rgba(240,192,64,0)"/>
    </linearGradient></defs>
    <line x1="${padL}" y1="${base}" x2="${W - padR}" y2="${base}" class="rcp-axis"/>
    <polygon points="${areaPts}" fill="url(#rcpFill)"/>
    <polyline points="${linePts}" class="rcp-line"/>
    ${dots}
  </svg>`;
}

// Horizontal alliance timeline (inline SVG): a bar per alliance, betrayal X's.
function _svgAllianceTimeline(alliances, maxEp) {
  if (!alliances.length) return '<div class="rcp-empty">No named alliances formed this season.</div>';
  const rowH = 34, padL = 8, padR = 18, padT = 8, W = 620;
  const H = padT * 2 + alliances.length * rowH;
  const xOf = ep => padL + ((Math.max(1, ep) - 1) / Math.max(1, maxEp - 1)) * (W - padL - padR);
  const rows = alliances.map((a, i) => {
    const y = padT + i * rowH + rowH / 2;
    const x0 = xOf(a.formed || 1), x1 = xOf(maxEp);
    const bar = `<line x1="${x0.toFixed(1)}" y1="${y}" x2="${x1.toFixed(1)}" y2="${y}" class="rcp-allbar ${a.active ? 'on' : 'off'}"/>`;
    const label = `<text x="${x0.toFixed(1)}" y="${y - 8}" class="rcp-alllabel">${_esc(a.name)} · ${a.members.length}</text>`;
    const marks = a.betrayals.filter(b => b.ep).map(b =>
      `<text x="${xOf(b.ep).toFixed(1)}" y="${y + 4}" class="rcp-betray ${_esc(b.severity)}" text-anchor="middle">✕</text>`).join('');
    return bar + label + marks;
  }).join('');
  return `<svg class="rcp-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Alliance timeline">${rows}</svg>`;
}

function rpBuildRecapTitle(recap) {
  const w = recap.winner;
  return `<section class="rcp-sec rcp-title" data-sfx="tension-drum">
    <div class="rcp-kicker">THE STORY OF</div>
    <h1 class="rcp-bigtitle">${_esc(recap.seasonName)}</h1>
    <div class="rcp-subtitle">${(recap.blindsides.length)} shocking exits · ${recap.alliances.alliances.length} alliances · one champion</div>
    <div class="rcp-scrollcue">scroll ↓</div>
  </section>`;
}

function rpBuildRecapWinner(recap) {
  const w = recap.winner;
  if (!w) return '';
  const chart = _svgWinnerChart(w.arc, _maxEp(recap));
  const jury = w.juryVote
    ? Object.entries(w.juryVote).sort(([, a], [, b]) => b - a).map(([n, v]) =>
        `<span class="rcp-chip ${n === w.winner ? 'win' : ''}">${_esc(n)} ${v}</span>`).join('')
    : '';
  return `<section class="rcp-sec" data-sfx="win-fanfare">
    <div class="rcp-eyebrow">THE CHAMPION</div>
    <h2 class="rcp-h2">${_esc(w.winner)}'s Journey</h2>
    <div class="rcp-stats">
      <div class="rcp-stat"><b>${w.immunityWins}</b><span>immunity win${w.immunityWins === 1 ? '' : 's'}</span></div>
      ${w.juryVote ? `<div class="rcp-stat"><b>${(w.juryVote[w.winner] || 0)}</b><span>jury votes</span></div>` : ''}
    </div>
    ${chart}
    ${jury ? `<div class="rcp-chiprow">${jury}</div>` : ''}
  </section>`;
}

function rpBuildRecapBlindsides(recap) {
  if (!recap.blindsides.length) return '';
  const cards = recap.blindsides.map((b, i) => `
    <div class="rcp-card blindside">
      <div class="rcp-card-rank">#${i + 1}</div>
      <div class="rcp-card-body">
        <div class="rcp-card-ep">EPISODE ${b.ep}</div>
        <div class="rcp-card-name">${_esc(b.booted)}</div>
        <div class="rcp-card-reason">${_esc(b.reason)}</div>
        ${b.totalVoters ? `<div class="rcp-card-tally">${b.votesAgainst} of ${b.totalVoters} votes${b.heldAdvantage ? ' · held an advantage' : ''}</div>` : ''}
      </div>
    </div>`).join('');
  return `<section class="rcp-sec" data-sfx="elimination-gong">
    <div class="rcp-eyebrow">NEVER SAW IT COMING</div>
    <h2 class="rcp-h2">Biggest Blindsides</h2>
    <div class="rcp-cards">${cards}</div>
  </section>`;
}

function rpBuildRecapAlliances(recap) {
  const a = recap.alliances;
  if (!a.alliances.length) return '';
  const timeline = _svgAllianceTimeline(a.alliances, _maxEp(recap));
  const shift = a.shift
    ? `<div class="rcp-shift">⚡ The power shifted in Episode ${a.shift.ep} — the lead passed from <b>${_esc(a.shift.from)}</b> to <b>${_esc(a.shift.to)}</b>.</div>`
    : '';
  const dom = a.dominant
    ? `<div class="rcp-dominant">Dominant bloc: <b>${_esc(a.dominant.name)}</b> (${a.dominant.members.map(_esc).join(', ')})</div>`
    : '';
  return `<section class="rcp-sec" data-sfx="idol-sting">
    <div class="rcp-eyebrow">THE GAME WITHIN THE GAME</div>
    <h2 class="rcp-h2">Power Shifts &amp; Alliances</h2>
    ${dom}${shift}
    ${timeline}
    <div class="rcp-legend"><span class="rcp-betray major">✕</span> major betrayal · <span class="rcp-betray moderate">✕</span> moderate</div>
  </section>`;
}

function rpBuildRecapRelationships(recap) {
  const r = recap.relationships;
  if (!r.rivalries.length && !r.showmances.length) return '';
  const rivals = r.rivalries.map(v =>
    `<div class="rcp-card rivalry"><div class="rcp-pair">${_esc(v.a)} <span>vs</span> ${_esc(v.b)}</div><div class="rcp-tag">RIVALRY</div></div>`).join('');
  const shows = r.showmances.map(s =>
    `<div class="rcp-card showmance"><div class="rcp-pair">${_esc(s.players[0])} <span>♥</span> ${_esc(s.players[1])}</div><div class="rcp-tag ${s.broken ? 'broke' : 'last'}">${s.broken ? 'BROKE UP' : 'LASTED'}</div></div>`).join('');
  return `<section class="rcp-sec" data-sfx="reveal-whoosh">
    <div class="rcp-eyebrow">THE HUMAN DRAMA</div>
    <h2 class="rcp-h2">Rivalries &amp; Showmances</h2>
    <div class="rcp-cards">${rivals}${shows}</div>
  </section>`;
}

function rpBuildRecapClosing(recap) {
  const w = recap.winner;
  return `<section class="rcp-sec rcp-closing" data-sfx="win-fanfare">
    <div class="rcp-eyebrow">AND IN THE END</div>
    <h2 class="rcp-crown">👑</h2>
    <div class="rcp-bigtitle">${_esc(w ? w.winner : 'Champion')}</div>
    <div class="rcp-subtitle">Champion of ${_esc(recap.seasonName)}</div>
    <button class="rcp-close-btn" onclick="closeSeasonRecap()">Close Recap</button>
  </section>`;
}

function _recapStyle() {
  return `<style id="rcp-style">
  #season-recap-overlay{position:fixed;inset:0;z-index:10000;background:#06070b;color:#ece6d8;
    font-family:'DM Sans',system-ui,sans-serif;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch}
  #season-recap-overlay::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;
    background:radial-gradient(ellipse at 50% 0%,rgba(240,192,64,.08),transparent 60%);}
  .rcp-topbar{position:fixed;top:0;left:0;right:0;height:46px;display:flex;align-items:center;justify-content:flex-end;
    padding:0 16px;z-index:20;background:linear-gradient(180deg,rgba(6,7,11,.9),transparent)}
  .rcp-x{background:none;border:1px solid rgba(236,230,216,.25);color:#ece6d8;border-radius:6px;
    padding:5px 12px;font-size:12px;cursor:pointer;letter-spacing:1px}
  .rcp-x:hover{background:rgba(236,230,216,.1)}
  .rcp-flow{max-width:760px;margin:0 auto;padding:46px 22px 80px}
  .rcp-sec{min-height:62vh;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;
    padding:42px 0;opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
  .rcp-sec.rcp-in{opacity:1;transform:none}
  .rcp-sec.rcp-title,.rcp-sec.rcp-closing{align-items:center;text-align:center;min-height:84vh;justify-content:center}
  .rcp-kicker,.rcp-eyebrow{font-size:12px;letter-spacing:5px;color:#f0c040;text-transform:uppercase;font-weight:700;margin-bottom:10px}
  .rcp-bigtitle{font-family:'Anton',sans-serif;font-size:clamp(40px,9vw,84px);line-height:.96;letter-spacing:1px;
    text-transform:uppercase;background:linear-gradient(180deg,#fff,#cdb676);-webkit-background-clip:text;background-clip:text;color:transparent}
  .rcp-subtitle{margin-top:14px;font-size:15px;color:#9a958a;letter-spacing:1px}
  .rcp-scrollcue{margin-top:36px;font-size:12px;color:#777;letter-spacing:3px;animation:rcpbob 1.8s ease-in-out infinite}
  @keyframes rcpbob{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
  .rcp-h2{font-family:'Anton',sans-serif;font-size:clamp(28px,5vw,46px);text-transform:uppercase;letter-spacing:.5px;margin:2px 0 16px}
  .rcp-stats{display:flex;gap:26px;margin:6px 0 18px}
  .rcp-stat{display:flex;flex-direction:column}.rcp-stat b{font-family:'Anton',sans-serif;font-size:34px;color:#f0c040;line-height:1}
  .rcp-stat span{font-size:11px;color:#9a958a;letter-spacing:1px;text-transform:uppercase;margin-top:3px}
  .rcp-chart{width:100%;height:auto;margin:8px 0;background:rgba(255,255,255,.02);border:1px solid rgba(236,230,216,.08);border-radius:10px;padding:6px}
  .rcp-line{fill:none;stroke:#f0c040;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}
  .rcp-dot{fill:#fff;stroke:#f0c040;stroke-width:2}
  .rcp-axis{stroke:rgba(236,230,216,.16);stroke-width:1;stroke-dasharray:3 4}
  .rcp-allbar{stroke-width:5;stroke-linecap:round}.rcp-allbar.on{stroke:#4db8c4}.rcp-allbar.off{stroke:#5a5650}
  .rcp-alllabel{fill:#cfc9bd;font-size:11px;font-family:'DM Sans',sans-serif}
  .rcp-betray{font-size:15px;font-weight:700}.rcp-betray.major{fill:#e8503a}.rcp-betray.moderate{fill:#e8873a}.rcp-betray.minor{fill:#9a958a}
  .rcp-chiprow{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
  .rcp-chip{font-size:12px;padding:4px 10px;border-radius:20px;background:rgba(236,230,216,.08);border:1px solid rgba(236,230,216,.14)}
  .rcp-chip.win{background:rgba(240,192,64,.18);border-color:#f0c040;color:#f0c040;font-weight:700}
  .rcp-cards{display:flex;flex-direction:column;gap:12px;width:100%}
  .rcp-card{display:flex;gap:14px;align-items:center;background:rgba(255,255,255,.03);border:1px solid rgba(236,230,216,.1);
    border-radius:12px;padding:14px 16px}
  .rcp-card.blindside{border-left:3px solid #e8503a}
  .rcp-card-rank{font-family:'Anton',sans-serif;font-size:30px;color:#e8503a;min-width:46px}
  .rcp-card-ep{font-size:10px;letter-spacing:2px;color:#9a958a}
  .rcp-card-name{font-family:'Anton',sans-serif;font-size:22px;letter-spacing:.5px}
  .rcp-card-reason{font-size:13px;color:#cfc9bd;margin-top:3px}
  .rcp-card-tally{font-size:11px;color:#8a857b;margin-top:5px;letter-spacing:.5px}
  .rcp-pair{font-family:'Anton',sans-serif;font-size:20px}.rcp-pair span{color:#9a958a;font-size:13px;margin:0 6px}
  .rcp-tag{margin-left:auto;font-size:10px;letter-spacing:2px;padding:3px 8px;border-radius:5px;background:rgba(236,230,216,.1)}
  .rcp-tag.broke{background:rgba(232,80,58,.16);color:#e8503a}.rcp-tag.last{background:rgba(77,184,196,.16);color:#4db8c4}
  .rcp-card.rivalry{border-left:3px solid #e8873a}.rcp-card.showmance{border-left:3px solid #d96aa0}
  .rcp-dominant,.rcp-shift{font-size:14px;color:#cfc9bd;margin-bottom:8px}.rcp-shift{color:#f0c040}
  .rcp-legend{font-size:11px;color:#8a857b;margin-top:8px}.rcp-legend .rcp-betray{font-size:13px}
  .rcp-crown{font-size:64px;margin:0}
  .rcp-close-btn{margin-top:26px;background:#f0c040;color:#1a1a1a;border:none;border-radius:8px;padding:12px 28px;
    font-size:14px;font-weight:700;letter-spacing:1px;cursor:pointer}
  .rcp-close-btn:hover{filter:brightness(1.08)}
  .rcp-empty{font-size:13px;color:#8a857b;font-style:italic;padding:10px 0}
  @media(prefers-reduced-motion:reduce){.rcp-sec{transition:none;opacity:1;transform:none}.rcp-scrollcue{animation:none}}
  </style>`;
}

export function openSeasonRecap() {
  const recap = buildSeasonRecap(gs);
  if (!recap) { alert('The season recap unlocks once a season is complete.'); return; }
  closeSeasonRecap(); // ensure no duplicate
  const ov = document.createElement('div');
  ov.id = 'season-recap-overlay';
  ov.innerHTML = _recapStyle() + `
    <div class="rcp-topbar"><button class="rcp-x" onclick="closeSeasonRecap()">✕ CLOSE</button></div>
    <div class="rcp-flow">
      ${rpBuildRecapTitle(recap)}
      ${rpBuildRecapWinner(recap)}
      ${rpBuildRecapBlindsides(recap)}
      ${rpBuildRecapAlliances(recap)}
      ${rpBuildRecapRelationships(recap)}
      ${rpBuildRecapClosing(recap)}
    </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';

  // Scroll-driven reveals + audio stings (one sting per section, first time it enters).
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const secs = ov.querySelectorAll('.rcp-sec');
  if (reduce || !('IntersectionObserver' in window)) {
    secs.forEach(s => s.classList.add('rcp-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('rcp-in');
        if (!e.target.dataset.played) {
          e.target.dataset.played = '1';
          const cue = e.target.getAttribute('data-sfx');
          if (cue && window.audio) window.audio.sfx(cue);
        }
        io.unobserve(e.target);
      }
    }, { threshold: 0.35, root: ov });
    secs.forEach(s => io.observe(s));
    // First section is already in view — reveal + sting immediately.
    if (secs[0]) { secs[0].classList.add('rcp-in'); secs[0].dataset.played = '1'; const c0 = secs[0].getAttribute('data-sfx'); if (c0 && window.audio) window.audio.sfx(c0); }
  }
  // Esc closes
  ov._escHandler = (ev) => { if (ev.key === 'Escape') closeSeasonRecap(); };
  document.addEventListener('keydown', ov._escHandler);
}

export function closeSeasonRecap() {
  const ov = document.getElementById('season-recap-overlay');
  if (!ov) return;
  if (ov._escHandler) document.removeEventListener('keydown', ov._escHandler);
  ov.remove();
  document.body.style.overflow = '';
}
