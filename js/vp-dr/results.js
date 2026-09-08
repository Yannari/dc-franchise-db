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
import { _controls, _seedRail } from './reveal.js';
import { GRID_RESULTS } from '../dr/grid.js';
import { showWords } from '../shows.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n1 = v => (Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—');
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

export const RESULTS_CSS = `
.dr-said{margin:8px 0 0;color:#f4e3ed;line-height:1.55;text-wrap:pretty}
/* THE CARD TAKES THE COLOUR OF THE VERDICT. Every row on the call was the
   same pink lozenge and only the rubber stamp differed, so a screen whose
   whole job is sorting eight queens into six outcomes read as one block of
   text. The verdict already has a colour in GRID_RESULTS; the row now wears
   it — rail, wash and border — and the shape of the week is legible before
   a word is read. */
.dr-callrow{display:grid;grid-template-columns:auto 1fr auto auto;gap:14px;align-items:center;
  padding:13px 16px 13px 20px}
/* .dr-panel FIRST: the shell's accent class sets the same left border, and a
   bare .dr-callrow ties with it on specificity — the tint applied to the
   heading and to nothing else. */
.dr-panel.dr-callrow{border:1px solid color-mix(in srgb,var(--v,#7a3a5e) 30%,var(--dr-line));
  border-left:4px solid var(--v,#7a3a5e);
  background:linear-gradient(90deg,color-mix(in srgb,var(--v,#7a3a5e) 22%,transparent),
    transparent 44%),var(--dr-panel)}
/* SAFE IS THE ABSENCE OF A RESULT and should recede rather than glow. */
.dr-panel.dr-callrow.dr-quiet{opacity:.8}
/* ══ THE LIP SYNC FLOOR ══ two spots on a black stage ══ */
.dr-lsroom{position:relative}
.dr-lsfloor{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden;background:linear-gradient(180deg,rgba(30,2,10,.6),transparent 42%)}
.dr-lsfloor i{position:absolute;display:block}
.dr-ls-a,.dr-ls-b{top:0;width:250px;height:60%;
  background:linear-gradient(180deg,rgba(255,41,75,.24),transparent 74%);
  clip-path:polygon(36% 0,64% 0,100% 100%,0 100%)}
.dr-ls-a{left:14%}.dr-ls-b{right:14%}
/* The speakers, under everything. */
.dr-ls-thud{left:0;right:0;bottom:0;height:30%;
  background:radial-gradient(70% 100% at 50% 100%,rgba(255,41,75,.20),transparent 72%);
  animation:drThud 1.9s ease-in-out infinite}
@keyframes drThud{0%,100%{opacity:.55}50%{opacity:1}}

/* ══ THE WAY OUT ══ a lit door at the end of a dark corridor ══ */
.dr-exitroom{position:relative}
.dr-exitway{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden;background:linear-gradient(180deg,rgba(10,2,6,.55),transparent 50%)}
.dr-exitway i{position:absolute;display:block}
.dr-ex-door{top:14%;left:50%;width:120px;height:210px;transform:translateX(-50%);
  background:linear-gradient(180deg,rgba(255,233,168,.22),rgba(255,233,168,.05));
  box-shadow:0 0 90px 26px rgba(255,200,61,.13)}
.dr-ex-dark{inset:0;box-shadow:inset 0 0 200px 80px rgba(0,0,0,.7)}

@media(prefers-reduced-motion:reduce){.dr-ls-thud{animation:none}}

/* ══ THE LINE ══ the queens the panel kept back, standing for the call ══ */
.dr-lineup-stage{position:sticky;top:0;z-index:6;display:flex;justify-content:center;
  gap:14px;flex-wrap:wrap;padding:16px 18px;margin:0 0 18px;
  background:radial-gradient(120% 110% at 50% 0%,rgba(56,189,248,.14),transparent 62%),
    linear-gradient(180deg,#12071C,#0a0410 78%,rgba(6,2,8,.96));
  border-bottom:1px solid rgba(255,255,255,.12);
  box-shadow:0 18px 38px -22px rgba(0,0,0,.95)}
.dr-standing{width:104px;text-align:center;opacity:.5;filter:grayscale(.55);
  transition:opacity .35s,filter .35s,transform .35s}
.dr-standing.called{opacity:1;filter:none;transform:translateY(-3px)}
.dr-standing .dr-por{margin:0 auto;border:2px solid rgba(255,255,255,.18)}
.dr-standing b{display:block;margin-top:6px;font-size:12px;color:#f0dfe9;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dr-standing-tag{display:block;min-height:13px;margin-top:3px;font-size:9.5px;
  letter-spacing:.16em}
/* Her stamp's colour is the chart's, so the line and the record agree. */
.dr-r-WIN .dr-standing-tag{color:#38bdf8}
.dr-r-WIN .dr-por{border-color:#38bdf8}
.dr-r-HIGH .dr-standing-tag{color:#7dd3fc}
.dr-r-HIGH .dr-por{border-color:#7dd3fc}
.dr-r-LOW .dr-standing-tag{color:#fb923c}
.dr-r-LOW .dr-por{border-color:#fb923c}
.dr-r-BTM .dr-standing-tag{color:#fca5a5}
.dr-r-BTM .dr-por{border-color:#fca5a5}
.dr-r-BTM2 .dr-standing-tag{color:#f87171}
.dr-r-BTM2 .dr-por{border-color:#f87171}
.dr-step{scroll-margin-top:200px}
@media(max-width:760px){.dr-lineup-stage{position:static}.dr-standing{width:78px}}
@media(prefers-reduced-motion:reduce){.dr-standing{transition:none}}

/* The safe queens, on one card, because they share one sentence. */
.dr-safefaces{display:flex;flex-wrap:wrap;gap:5px;max-width:190px}
.dr-safegroup h3{margin-bottom:2px}
.dr-callrow h3{color:color-mix(in srgb,var(--v,#fff) 42%,#fff)}
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
/* THE BEAT CARDS UNDER THE VERSUS. */
.dr-beat{display:grid;grid-template-columns:1fr;gap:13px;align-items:start;
  padding:14px 16px 14px 20px}
.dr-beat p{margin:0;color:#f4e3ed;line-height:1.6;text-wrap:pretty}
.dr-beat .dr-por{border:2px solid rgba(255,240,200,.45)}
.dr-beat-a,.dr-beat-b{grid-template-columns:auto 1fr}
/* .dr-panel FIRST, deliberately. The shell's accent classes set the same
   left border, so a bare .dr-beat-a ties on specificity and loses to
   whichever stylesheet was injected last — both sides came out the same red
   and the whole point of the two colours went with it. */
.dr-panel.dr-beat-a{border-left:3px solid #FFC83D;
  background:linear-gradient(90deg,rgba(255,200,61,.13),transparent 40%),var(--dr-panel)}
/* The second queen's beats mirror: her portrait sits on the right, the way
   she does on the stage above. */
.dr-panel.dr-beat-b{direction:rtl;border-left:0;border-right:3px solid #FF294B;
  background:linear-gradient(270deg,rgba(255,41,75,.15),transparent 40%),var(--dr-panel)}
.dr-beat-b > *{direction:ltr}
.dr-beat-b .dr-por{transform:scaleX(-1)}
.dr-song{text-align:center;font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;
  font-size:19px;color:#ffd0e8;margin-bottom:12px}

/* ── THE EXIT ── */
/* THREE COLUMNS, and the stamp lives in the third. It was absolutely
   positioned at right:24px over a two-column card, so SASHAYED AWAY was
   printed straight across the middle of the mirror message and neither was
   readable. The rotation is a transform and costs no layout, so the stamp
   still reads as slammed on. */
.dr-exit{position:relative;display:grid;grid-template-columns:auto 1fr auto;gap:20px;
  align-items:center;padding:22px;border:1px solid rgba(255,41,75,.4);
  background:linear-gradient(180deg,#20030c,#0d0206)}
@media(max-width:760px){.dr-exit{grid-template-columns:auto 1fr}}
.dr-exit .dr-por{filter:grayscale(1) brightness(.5)}
.dr-bigstamp{align-self:start;justify-self:end;font-size:34px;color:#FF294B;
  white-space:nowrap;
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
  /* THE SAFE QUEENS ARE DISMISSED AS A GROUP AND GO FIRST. That is the
     order the host calls it in — they leave the stage and the night narrows
     to the people it is about — and it is also the only honest way to draw
     them: they share ONE line between them, so giving each of them a row
     produced a column of portraits with a rank arrow, a rubber stamp and no
     words. Eight of thirteen rows silent on the screenshot that found this.
     They get one card with all their faces on it instead. */
  const safe = call.safe || [];
  const groups = [
    ['WIN', call.win || []], ['HIGH', call.high || []],
    ['LOW', call.low || []], ['BTM', call.atRisk || []], ['BTM2', call.bottom || []],
  ];
  const named = groups.flatMap(([r, list]) => list.map(n => [r, n]));
  if (!named.length && !safe.length) return '';

  /* WHAT THE HOST ACTUALLY SAID. The row carries a written line for every
     call — `stage:result-win`, `-safe`, `-bottom` — and this screen drew a
     portrait, a rank arrow and a stamp and none of the words. Four written
     lines on the row, a hundred and seventy-seven characters on the screen.
     "Condragulations, you are the winner of this week's maxi challenge" is
     the single most quotable sentence the show has and it was on the floor. */
  /* ONE KIND PER CALL. This mapped HIGH onto the winner's line and LOW onto
     the safe group's, which is how a queen told she was LOW read the words
     said to the people being sent to the back. Each call has its own beat
     now — js/dr/data/stage-beats.js grew result-high, result-low and
     result-btm, which had never existed. */
  const RESULT_SCENE = { WIN: 'stage:result-win', HIGH: 'stage:result-high',
    LOW: 'stage:result-low', BTM: 'stage:result-btm',
    BTM2: 'stage:result-bottom' };
  const spoken = new Set();
  const lineFor = (result, name) => {
    const kind = RESULT_SCENE[result];
    const sc = (row.dr.scenes || []).find(x => x.kind === kind
      && ((x.data?.players || []).includes(name) || !(x.data?.players || []).length)
      && !spoken.has(x));
    if (sc) spoken.add(sc);
    return sc?.text || '';
  };

  /* THE SAFE QUEENS ARE NOT ON THIS SCREEN. They are dismissed BEFORE the
     critiques — the host names them, they leave the main stage and go
     straight to Untucked, and the panel then critiques only the queens left
     standing. So the safe card lives at the top of the critiques screen,
     which is the moment it happens in, and this screen carries only the
     queens the panel actually placed.
     It was here for one commit, which was already an improvement on giving
     each safe queen her own silent row, but it put the dismissal after the
     critiques of people who were dismissed before them. */
  const steps = named.map(([result, name], i) => {
    const b = bend.get(name);
    const moved = b && b.panelRank !== b.finalRank;
    const meta = GRID_RESULTS[result] || {};
    const said = lineFor(result, name);
    return `<div class="dr-step" id="dr-step-results-${i}">
      <div class="dr-panel dr-a-score dr-callrow${
  result === 'SAFE' ? ' dr-quiet' : ''}" style="--v:${meta.color || '#7a3a5e'}">
        ${_portrait(name, ep, { size: 52, station: true })}
        <div><h3 class="dr-disp">${esc(name)}</h3>
          ${b ? `<span style="font-size:11px;color:#C9A6BC">panel ${b.panelRank} → ${b.finalRank}</span>` : ''}
          ${said ? `<p class="dr-said">${esc(said)}</p>` : ''}
        </div>
        ${moved ? '<span class="dr-moved dr-disp">the host moved her</span>' : '<span></span>'}
        <span class="dr-stamp dr-disp" style="color:${meta.color || '#fff'}">${esc(meta.label || result)}</span>
      </div></div>`;
  }).join('');

  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    /* The safe queens stay in the rail as CONTEXT — they were dismissed on
       the critiques screen and are not steps here, but a reader wants to
       know the room is smaller than the cast. */
    const panelFor = k => `<h4 class="dr-disp">The call</h4>${
      (safe.length ? `<div class="dr-slot dr-waiting"><span></span>
        <div><div class="dr-nm">${esc(safe.length)} already safe</div></div>
        <span class="dr-chip dr-c-safe">SAFE</span></div>` : '')}${
      named.slice(0, k).map(([r, n]) => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
        <div><div class="dr-nm">${esc(n)}</div></div>
        <span class="dr-chip ${CHIP[r] || 'dr-c-safe'}">${esc(GRID_RESULTS[r]?.label || r)}</span>
      </div>`).join('')}`;
    window._drSidebar.results = named.map((_, i) => panelFor(i + 1));
  }

  /* ── THE LINE, STILL STANDING ──
     The call is the last thing that happens on the main stage and it drew
     as a list: the queens were never on the screen, only their verdicts
     were. This is the line they are standing in — the ones the panel kept
     back after the safe were dismissed — and it stays at the top while the
     calls are read, taking each queen's stamp as it lands.
     Placement order would print the answer along the top of the screen, so
     it is drawn in the order the panel ranked them, which the critiques
     screen has already shown. */
  const line = named.map(([, n]) => n);
  const stand = line.length ? `<div class="dr-lineup-stage" id="dr-call-line">
    ${line.map(n => `<div class="dr-standing" data-queen="${esc(n)}">
      ${_portrait(n, ep, { size: 54, station: true })}
      <b class="dr-disp">${esc(n)}</b>
      <span class="dr-standing-tag dr-disp"></span>
    </div>`).join('')}
  </div>` : '';

  /* Each step says what the line looks like after it — the stamp lands on
     the queen it belongs to and the ones already called stay marked. */
  if (typeof window !== 'undefined') {
    const called = [];
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.results = (idx) => {
      const upto = named.slice(0, idx + 1);
      const map = new Map(upto);
      const byName = new Map(upto.map(([r, n]) => [n, r]));
      for (const el of document.querySelectorAll('.dr-standing')) {
        const n = el.getAttribute('data-queen');
        const r = byName.get(n);
        el.classList.toggle('called', !!r);
        for (const c of ['WIN', 'HIGH', 'LOW', 'BTM', 'BTM2']) {
          el.classList.toggle(`dr-r-${c}`, r === c);
        }
        const tag = el.querySelector('.dr-standing-tag');
        if (tag) tag.textContent = r ? (GRID_RESULTS[r]?.label || r) : '';
      }
      void map;
    };
  }

  return `<style>${RESULTS_CSS}</style>${_shell(stand + steps, ep, {
    phase: 'stage', title: 'The Call', subtitle: 'who the panel kept back',
    sidebar: _seedRail('results', '<h4 class="dr-disp">The call</h4>'),
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

  /* WHOSE BEAT IS THIS. The duel is two queens and the beats below it were
     eight identical paragraphs — you could not see, without reading, that
     the fight went one way and then the other. Each beat now carries the
     face of the queen it is about and leans to her side of the stage, so the
     column reads as a rally. A beat about both of them, or about the room,
     stays centred and unattributed, which is also information. */
  const sideOf = sc => {
    const who = (sc.data?.players || []).filter(n => n === a || n === b);
    return who.length === 1 ? who[0] : null;
  };
  const steps = beats.map((sc, i) => {
    const who = sideOf(sc);
    const right = who && who === b;
    return `<div class="dr-step" id="dr-step-lipsync-${i}">
    <div class="dr-panel dr-a-lip dr-beat${who ? (right ? ' dr-beat-b' : ' dr-beat-a') : ''}">
      ${who ? _portrait(who, ep, { size: 42 }) : ''}
      <p>${esc(sc.text)}</p></div></div>`;
  }).join('');

  /* THE FLOOR THEY FIGHT ON. Two hard spots on a black stage, and a low
     throb from the speakers under everything. The VS panel already had its
     own stripes; the room around it was the same purple as the werk room. */
  const floor = `<div class="dr-lsfloor" aria-hidden="true">
      <i class="dr-ls-a"></i><i class="dr-ls-b"></i><i class="dr-ls-thud"></i>
    </div>`;
  return `<style>${RESULTS_CSS}</style>${_shell(
    `<div class="dr-lsroom">${floor}${vs}${steps}</div>`, ep, {
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
  /* THE CROWNING'S OWN PROSE, which this screen was dropping on the floor.
     The filter was `step === 'exit'` alone, and the finale keeps its sash,
     its runner-up, the crowning, the winner's speech and "prance, my queens"
     on `finale-award` and `finale-crown`. All of it was written, stored on the
     row, and rendered nowhere — the same shape as every other bug this build
     has turned up, and the one that would have hurt most: the last thing the
     host says in a season, missing from the screen that says it. */
  const CROWN_STEPS = new Set(['exit', 'finale-award', 'finale-crown']);
  const scenes = (row.dr.scenes || []).filter(s => CROWN_STEPS.has(s.step) && s.text);
  if (!fin && !exits.length && !scenes.length) return '';

  let lead = '';
  /* Held out here so the steps below can skip whatever the lead already
     showed: the mirror message was drawn as the featured line on the card
     AND again as an ordinary paragraph two cards down, word for word. */
  let msg = null;
  /* The finale's structured blocks, held back to run AFTER the prose. An
     ARRAY, not a marked-up string: the first version concatenated them with
     a sentinel div and split on it, which needs matching nested </div>s to
     come out right and would fail silently the first time a block grew one. */
  const finaleBlocks = [];

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

    /* NOT A LEAD. THESE ARE THE LAST CLICKS OF THE SEASON.
       All of this used to be drawn above the prose, ungated: the bracket
       with every winner, the full finishing order, the crown and Miss
       Congeniality, all legible at 0 / 5 on the screen whose entire job is
       to withhold them. A viewer opening the finale was told who won before
       reading a word of it — the worst instance of a bug class this build
       has now hit on five screens.
       They are steps now, in the order the night runs them, and the crown
       is the last one. `finaleSteps` is appended after the prose below. */
    finaleBlocks.push(`<div class="dr-panel dr-a-lip" style="padding:16px 18px 16px 22px">
      <h3 class="dr-disp" style="margin:0 0 10px">The finale — ${esc(fin.type || '')}</h3>
      ${duels}</div>`);
    if (congBlock) finaleBlocks.push(congBlock);
    finaleBlocks.push(`<div class="dr-panel dr-a-lip" style="padding:16px 18px 16px 22px">
      <h4 class="dr-disp" style="margin:0 0 6px">Placements</h4>
      ${places}</div>`);
    finaleBlocks.push(`<div class="dr-crown">
      ${_portrait(champ, ep, { size: 150 })}
      <div class="dr-sash dr-disp">${esc(w.compWon ? 'The Winner' : 'Winner')}</div>
      <h2 class="dr-disp">${esc(champ)}</h2>
      ${_icon('crown')}
    </div>`);
  } else if (exits.length) {
    const gone = exits[0];
    msg = (row.dr.scenes || []).find(s => /mirror-message/.test(s.kind || ''));
    // Portrait, words, stamp — in that order, because they are grid cells now.
    lead = `<div class="dr-exit">
      ${_portrait(gone.name, ep, { size: 128 })}
      <div><h3 class="dr-disp" style="margin:0;font-size:26px">${esc(gone.name)}</h3>
        ${msg ? `<p class="dr-mirrorline">${esc(msg.text)}</p>` : ''}</div>
      <span class="dr-bigstamp dr-disp">${esc(gone.verb || w.exit)}</span>
    </div>`;
  }

  const rest = scenes.filter(sc => sc !== msg);
  let n = 0;
  const wrap = inner => `<div class="dr-step" id="dr-step-exit-${n++}">${inner}</div>`;
  const steps = rest.map(sc => wrap(
    `<div class="dr-panel dr-a-lip" style="padding:14px 16px 14px 20px">
      <p style="margin:0;color:#f4e3ed;line-height:1.6;text-wrap:pretty">${esc(sc.text)}</p>
    </div>`)).join('');
  /* The held-back finale blocks become steps here, numbered on from the
     prose so `_reapplyVisibility` walks one continuous run. */
  const tail = finaleBlocks.map(wrap).join('');
  const total = Math.max(1, n);

  /* THE WAY OUT. A lit door at the back of a dark corridor, which is what
     the last shot of an episode actually is. Not drawn on the crowning,
     which is the same builder for a very different night. */
  const corridor = fin ? '' : `<div class="dr-exitway" aria-hidden="true">
      <i class="dr-ex-door"></i><i class="dr-ex-dark"></i></div>`;
  return `<style>${RESULTS_CSS}</style>${_shell(
    `<div class="dr-exitroom">${corridor}${lead}${steps}${tail}</div>`, ep, {
      phase: 'lipsync',
      title: fin ? 'The Crowning' : 'Sashay Away',
      subtitle: fin ? 'the last queen standing' : 'the mirror message',
    })}${_controls('exit', total, ep.num)}`;
}


/**
 * The Grand Finale title card.
 *
 * `finale-open` is a MARKER — it carries no prose, only the finalists — so the
 * generic scene renderer drew this screen with nothing on it at all: claimed,
 * and empty, on every finale. Found by rendering a hundred seasons and
 * measuring how much text each screen produced.
 */
export function rpBuildFinaleOpen(row) {
  const ep = row;
  const fin = row?.dr?.finale;
  const open = (row?.dr?.scenes || []).find(sc => sc.kind === 'finale-open');
  const finalists = open?.data?.finalists || fin?.placements || row?.dr?.living || [];
  if (!finalists.length) return '';

  const SHAPE = {
    top4: 'Four queens. Two lip syncs, then one more.',
    top3: 'Three queens. One lip sync, then the crown.',
    top2: 'Two queens. One song.',
    'perform-then-lipsync': 'They perform, the host cuts it to two, and those two lip sync.',
  };

  const cards = finalists.map(n => `<div class="dr-fin-card">
      ${_portrait(n, ep, { size: 96, station: true })}
      <b class="dr-disp">${esc(n)}</b>
    </div>`).join('');

  /* AND THE WRITTEN OPENING, WHICH THIS SCREEN WAS STEPPING OVER.
     There are two things called finale-open. `finale-open` is the marker this
     builder reads — finalists and a type, no words — and `finale:finale-open`
     and `finale:finale-open-queen` are the AUTHORED prose in
     js/dr/data/finale-beats.js: the host's opening and one card per finalist.
     Reading the marker and ignoring the prose meant a written scene per
     finalist fired on the biggest night of the season and reached no screen.
     The near-identical kind is exactly why it went unnoticed. */
  const said = (row?.dr?.scenes || []).filter(sc =>
    /^finale:finale-open/.test(sc.kind || '') && sc.text);
  const spoken = said.map(sc => {
    const who = (sc.data?.players || [])[0];
    return `<div class="dr-panel dr-a-room" style="padding:14px 16px;display:grid;
      grid-template-columns:${who ? 'auto 1fr' : '1fr'};gap:14px;align-items:center;
      text-align:left;margin-top:12px">
      ${who ? _portrait(who, ep, { size: 48, station: true }) : ''}
      <p style="margin:0;color:#f4e3ed;line-height:1.6">${esc(sc.text)}</p>
    </div>`;
  }).join('');

  const body = `<div class="dr-panel dr-a-score" style="padding:24px 20px;text-align:center">
      <div class="dr-sash dr-disp">Grand Finale</div>
      <h2 class="dr-disp" style="margin:10px 0 4px;font-size:30px">
        One of them is crowned tonight</h2>
      <p style="color:#C9A6BC;margin:0 0 18px">
        ${esc(SHAPE[fin?.type] || 'The last night of the season.')}</p>
      <div class="dr-fin-grid">${cards}</div>
    </div>${spoken}`;

  return `<style>${RESULTS_CSS}
.dr-fin-grid{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-top:6px}
.dr-fin-card{display:flex;flex-direction:column;align-items:center;gap:8px}
</style>${_shell(body, ep, {
    phase: 'stage', title: 'Grand Finale', subtitle: "America's Next Drag Superstar",
  })}`;
}
