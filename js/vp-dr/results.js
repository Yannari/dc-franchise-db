// ══════════════════════════════════════════════════════════════════════
// vp-dr/results.js — the call, the lip sync, the exit, the crown
// ══════════════════════════════════════════════════════════════════════
//
// The end of the night, and the four screens that decide it.
//
// ── THE CALL IS WHERE THE HOST'S DECISION FINALLY SHOWS ───────────────
//
// The critiques screen deliberately does not carry `finalRank`, because at
// that point the host has not decided. THIS screen is where she has. So it
// is the one place the two ranks appear together, and where a queen the host
// moved is marked as moved — the panel had her fourth, the call has her
// second, and that difference is the show.
//
// ── AND THE LIP SYNC IS A VERSUS ──────────────────────────────────────
//
// Two busts facing off, energy bars, beat by beat. Not a scene list with
// two names in it: the reveal is a fight and the screen is built like one.
// The loser's portrait greys out under a stamp at the end.
import { _shell, _portrait, _judgePortrait, _icon } from './style.js';
import { _controls } from './reveal.js';
import { GRID_RESULTS } from '../dr/grid.js';
import { showWords } from '../shows.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n1 = v => (Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—');
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

export const RESULTS_CSS = `
.dr-callrow{display:grid;grid-template-columns:auto 1fr auto auto;gap:14px;align-items:center;
  padding:13px 16px 13px 20px}
.dr-callrow h3{margin:0;font-size:18px}
.dr-stamp{font-size:22px;padding:7px 14px;border:3px solid currentColor;transform:rotate(-6deg);
  line-height:1;animation:drSlam .45s cubic-bezier(.2,1.6,.4,1) both}
@keyframes drSlam{from{transform:rotate(-6deg) scale(2.4);opacity:0}
  to{transform:rotate(-6deg) scale(1);opacity:1}}
.dr-moved{font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:3px 9px;
  border:1px solid #FFC83D;color:#FFC83D}

/* ── THE VERSUS ── */
.dr-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;
  padding:22px;margin-bottom:14px;border:1px solid rgba(255,41,75,.5);position:relative;
  overflow:hidden;background:radial-gradient(600px 260px at 50% 40%,rgba(255,41,75,.26),transparent 70%),
    linear-gradient(180deg,#2a0410,#120207)}
.dr-vs::before{content:"";position:absolute;inset:0;
  background:repeating-linear-gradient(115deg,transparent 0 22px,rgba(255,41,75,.09) 22px 44px);
  animation:drSlide 8s linear infinite}
@keyframes drSlide{to{transform:translateX(44px)}}
.dr-fighter{position:relative;z-index:2;text-align:center}
.dr-fighter .dr-por{margin:0 auto;border:3px solid rgba(255,240,200,.6);
  box-shadow:0 0 46px rgba(255,41,75,.6)}
.dr-fighter.dr-r .dr-por{transform:scaleX(-1)}
.dr-fighter b{display:block;margin-top:8px;font-size:20px}
.dr-energy{height:12px;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.3);
  margin-top:9px;overflow:hidden}
.dr-energy i{display:block;height:100%;background:linear-gradient(90deg,#FFC83D,#FF294B)}
.dr-bolt{position:relative;z-index:2;font-size:56px;color:#fff;
  text-shadow:0 0 22px #FF294B,0 0 60px #FF294B;animation:drPulse 1.6s ease-in-out infinite}
@keyframes drPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
.dr-song{text-align:center;font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;
  font-size:19px;color:#ffd0e8;margin-bottom:12px}

/* ── THE EXIT ── */
.dr-exit{position:relative;display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;
  padding:22px;border:1px solid rgba(255,41,75,.4);
  background:linear-gradient(180deg,#20030c,#0d0206)}
.dr-exit .dr-por{filter:grayscale(1) brightness(.5)}
.dr-bigstamp{position:absolute;right:24px;top:24px;font-size:34px;color:#FF294B;
  border:4px solid #FF294B;padding:8px 16px;transform:rotate(-11deg);
  text-shadow:0 0 26px rgba(255,41,75,.9);animation:drSlam .5s cubic-bezier(.2,1.6,.4,1) both}
.dr-mirrorline{font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;font-size:18px;
  color:#ffd0e8;border-left:3px solid #FF294B;padding-left:14px;margin:8px 0 0;text-wrap:pretty}

/* ── THE CROWN ── */
.dr-crown{text-align:center;padding:34px 22px;
  background:radial-gradient(600px 300px at 50% 20%,rgba(255,200,61,.28),transparent 70%),
    linear-gradient(180deg,#2a1d00,#0d0700)}
.dr-crown .dr-por{margin:0 auto;border:3px solid #FFC83D;
  box-shadow:0 0 70px rgba(255,200,61,.8)}
.dr-crown h2{margin:14px 0 4px;font-size:42px;text-wrap:balance}
.dr-sash{display:inline-block;margin-top:10px;padding:6px 20px;font-size:12px;
  letter-spacing:.24em;background:linear-gradient(90deg,#FFC83D,#a97400);color:#241a00}
.dr-duelrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 0;
  border-bottom:1px solid rgba(255,255,255,.1)}
.dr-duelrow .dr-win{color:#FFC83D;margin-left:auto}
@media(prefers-reduced-motion:reduce){
  .dr-stamp,.dr-bigstamp{animation:none;transform:rotate(-6deg)}
  .dr-vs::before,.dr-bolt{animation:none}}
`;

const CHIP = {
  WIN: 'dr-c-win', HIGH: 'dr-c-high', SAFE: 'dr-c-safe', LOW: 'dr-c-low',
  BTM: 'dr-c-btm', BTM2: 'dr-c-btm2', ELIM: 'dr-c-elim',
};

/**
 * The call — and the one screen where the panel's rank and the host's sit
 * side by side, because this is the moment she has decided.
 */
export function rpBuildResults(row) {
  const ep = epOf(row);
  const call = row?.dr?.call;
  if (!call) return '';
  const bend = new Map((row.dr.bend || []).map(b => [b.name, b]));
  const groups = [
    ['WIN', call.win || []], ['HIGH', call.high || []], ['SAFE', call.safe || []],
    ['LOW', call.low || []], ['BTM', call.atRisk || []], ['BTM2', call.bottom || []],
  ];
  const named = groups.flatMap(([r, list]) => list.map(n => [r, n]));
  if (!named.length) return '';

  const steps = named.map(([result, name], i) => {
    const b = bend.get(name);
    const moved = b && b.panelRank !== b.finalRank;
    const meta = GRID_RESULTS[result] || {};
    return `<div class="dr-step" id="dr-step-results-${i}">
      <div class="dr-panel dr-a-score dr-callrow">
        ${_portrait(name, ep, { size: 52, station: true })}
        <div><h3 class="dr-disp">${esc(name)}</h3>
          ${b ? `<span style="font-size:11px;color:#C9A6BC">panel ${b.panelRank} → ${b.finalRank}</span>` : ''}
        </div>
        ${moved ? `<span class="dr-moved dr-disp">the host moved her</span>` : '<span></span>'}
        <span class="dr-stamp dr-disp" style="color:${meta.color || '#fff'}">${esc(meta.label || result)}</span>
      </div></div>`;
  }).join('');

  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar.results = named.map((_, i) => `<h4 class="dr-disp">The call</h4>${
      named.slice(0, i + 1).map(([r, n]) => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
        <div><div class="dr-nm">${esc(n)}</div></div>
        <span class="dr-chip ${CHIP[r] || 'dr-c-safe'}">${esc(GRID_RESULTS[r]?.label || r)}</span>
      </div>`).join('')}`);
  }

  return `<style>${RESULTS_CSS}</style>${_shell(steps, ep, {
    phase: 'stage', title: 'The Call', subtitle: 'who is safe',
    sidebar: '<h4 class="dr-disp">The call</h4>',
  })}${_controls('results', named.length, ep.num)}`;
}

/** The lip sync, built as a fight. */
export function rpBuildLipSync(row) {
  const ep = epOf(row);
  const ls = row?.dr?.lipsync;
  if (!ls || !(ls.queens || []).length) return '';
  const [a, b] = ls.queens;
  const beats = (row.dr.scenes || []).filter(s => s.step === 'lipsync' && s.text);
  const scoreOf = nm => Number(ls.scores?.[nm] ?? ls[nm]?.score) || 0;

  const vs = `<div class="dr-song">${esc(ls.song || '')}${
    ls.artist ? ` — ${esc(ls.artist)}` : ''}</div>
    <div class="dr-vs">
      <div class="dr-fighter">${_portrait(a, ep, { size: 140 })}
        <b class="dr-disp">${esc(a)}</b>
        <div class="dr-energy"><i style="width:${Math.max(6, Math.min(100, scoreOf(a) * 10))}%"></i></div>
      </div>
      <div class="dr-bolt dr-disp">VS</div>
      ${b ? `<div class="dr-fighter dr-r">${_portrait(b, ep, { size: 140 })}
        <b class="dr-disp">${esc(b)}</b>
        <div class="dr-energy"><i style="width:${Math.max(6, Math.min(100, scoreOf(b) * 10))}%"></i></div>
      </div>` : '<div></div>'}
    </div>`;

  const steps = beats.map((sc, i) => `<div class="dr-step" id="dr-step-lipsync-${i}">
    <div class="dr-panel dr-a-lip" style="padding:14px 16px 14px 20px">
      <p style="margin:0;color:#f4e3ed">${esc(sc.text)}</p></div></div>`).join('');

  return `<style>${RESULTS_CSS}</style>${_shell(vs + steps, ep, {
    phase: 'lipsync', title: 'Lip Sync For Your Life',
    subtitle: ls.call === 'double-shantay' ? 'both of them stay' : 'two queens, one song',
  })}${_controls('lipsync', Math.max(1, beats.length), ep.num)}`;
}

/**
 * The exit, the Miss Congeniality announcement, and the crown.
 *
 * All three live on one screen because they are one moment of television —
 * and because a queen leaving and a queen being crowned never happen on the
 * same night, so only one of them ever draws.
 */
export function rpBuildExit(row) {
  const ep = epOf(row);
  const w = showWords('drag-race');
  const fin = row?.dr?.finale;
  const exits = row?.exits || [];
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'exit' && s.text);
  if (!fin && !exits.length && !scenes.length) return '';

  let lead = '';

  if (fin) {
    /* THE FINALE. The bracket and the finishing order are structured data on
       `dr.finale` and sit on no scene at all — built from scenes alone this
       screen would lose the entire result of the season. */
    const duels = (fin.rounds || []).map(r => `<div class="dr-duelrow">
        ${_portrait(r.a, ep, { size: 38 })}<b class="dr-disp">${esc(r.a)}</b>
        <span style="color:#FF294B">vs</span>
        <b class="dr-disp">${esc(r.b)}</b>${_portrait(r.b, ep, { size: 38 })}
        <span class="dr-win dr-disp">${esc(r.winner)} takes it</span>
      </div>`).join('');

    /* MISS CONGENIALITY, ANNOUNCED. Plan 6 computes the award; without this
       it was a number nothing ever said out loud. Skipped entirely when the
       season did not name one — a blank sash is worse than no sash. The
       word comes from the registry, never a hardcoded string. */
    const cong = row.dr.congeniality;
    const congBlock = cong ? `<div class="dr-panel dr-a-room"
        style="padding:18px 20px;margin:14px 0;text-align:center">
        ${_portrait(cong, ep, { size: 76, station: true })}
        <div class="dr-sash dr-disp">${esc(w.audienceAward)}</div>
        <h3 class="dr-disp" style="margin:8px 0 0;font-size:24px">${esc(cong)}</h3>
      </div>` : '';

    const champ = fin.winner || (fin.placements || [])[0];
    /* AND THE FINISHING ORDER. Task 3's `finaleBlock` drew this and taking
       over its screen without it would drop the whole result of the season
       for the second time — the transcript has a test that catches exactly
       that, which is how this was noticed. */
    const places = (fin.placements || []).map((n, i) => `<div class="dr-duelrow">
        <span class="dr-disp" style="color:#C9A6BC;min-width:24px">${i + 1}</span>
        ${_portrait(n, ep, { size: 34 })}<b class="dr-disp">${esc(n)}</b>
        ${i === 0 ? _icon('crown') : ''}</div>`).join('');

    lead = `<div class="dr-panel dr-a-lip" style="padding:16px 18px 16px 22px">
        <h3 class="dr-disp" style="margin:0 0 10px">The finale — ${esc(fin.type || '')}</h3>
        ${duels}
        <h4 class="dr-disp" style="margin:16px 0 6px">Placements</h4>
        ${places}</div>
      ${congBlock}
      <div class="dr-crown">
        ${_portrait(champ, ep, { size: 150 })}
        <div class="dr-sash dr-disp">${esc(w.compWon ? 'The Winner' : 'Winner')}</div>
        <h2 class="dr-disp">${esc(champ)}</h2>
        ${_icon('crown')}
      </div>`;
  } else if (exits.length) {
    const gone = exits[0];
    const msg = (row.dr.scenes || []).find(s => /mirror-message/.test(s.kind || ''));
    lead = `<div class="dr-exit">
      <span class="dr-bigstamp dr-disp">${esc(gone.verb || w.exit)}</span>
      ${_portrait(gone.name, ep, { size: 128 })}
      <div><h3 class="dr-disp" style="margin:0;font-size:26px">${esc(gone.name)}</h3>
        ${msg ? `<p class="dr-mirrorline">${esc(msg.text)}</p>` : ''}</div>
    </div>`;
  }

  const steps = scenes.map((sc, i) => `<div class="dr-step" id="dr-step-exit-${i}">
    <div class="dr-panel dr-a-lip" style="padding:14px 16px 14px 20px">
      <p style="margin:0;color:#f4e3ed">${esc(sc.text)}</p></div></div>`).join('');

  return `<style>${RESULTS_CSS}</style>${_shell(lead + steps, ep, {
    phase: 'lipsync',
    title: fin ? 'The Crowning' : 'Sashay Away',
    subtitle: fin ? 'the last queen standing' : 'the mirror message',
  })}${_controls('exit', Math.max(1, scenes.length), ep.num)}`;
}
