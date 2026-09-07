// ══════════════════════════════════════════════════════════════════════
// vp-dr/stage.js — the main stage, the runway, the critiques, Untucked
// ══════════════════════════════════════════════════════════════════════
//
// The four screens the episode turns on, and the one place the show's own
// ORDER matters more than anything on the page:
//
//   THE PANEL RANKS.        Then the host decides. Those are two different
//                           moments and the critiques screen only knows the
//                           first one. `finalRank` is not on it — not
//                           hidden, ABSENT — because at that point in the
//                           night the host has not decided, and putting the
//                           answer on the screen where the question is asked
//                           is the whole spoiler.
//
// ── AND THE PANEL DISAGREES ───────────────────────────────────────────
//
// Measured at 24.7% of critiqued queens. Tone comes from each judge's own
// view rather than from the call, so a MIXED plate beside a PRAISE plate is
// a real disagreement and not decoration. The rail carries the panel's
// running ranking, which is what the viewer is actually watching.
import { _shell, _portrait, _judgePortrait, _icon } from './style.js';
import { _controls, _seedRail } from './reveal.js';
import { JUDGES } from '../dr/data/judges.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n1 = v => (Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—');
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });
const judgeName = id => (JUDGES.find(j => j.id === id)?.name || id);

export const STAGE_CSS = `
/* ── UNTUCKED: THE THREE PARTS OF THE NIGHT ── */
.dr-band{display:flex;align-items:baseline;gap:12px;margin:26px 0 12px;
  padding-bottom:7px;border-bottom:1px solid rgba(255,255,255,.1)}
.dr-band b{font-size:15px;letter-spacing:.13em;text-transform:uppercase;color:#ffd0e8}
.dr-band span{font-size:12px;color:#b892a8;font-style:italic}
.dr-step:first-child .dr-band{margin-top:0}
.dr-utk{padding:14px 16px 14px 20px;display:grid;grid-template-columns:auto 1fr;gap:14px}
.dr-utk .dr-utk-who{display:flex;gap:7px}
.dr-utk p{margin:5px 0 0;color:#f4e3ed;line-height:1.6;text-wrap:pretty}
/* WHAT THE SCENE DID TO THEM. Warm: they ended closer. Cold: they did not. */
.dr-panel.dr-u-warm{border-left:3px solid #FFC83D;
  background:linear-gradient(90deg,rgba(255,200,61,.11),transparent 38%),var(--dr-panel)}
.dr-panel.dr-u-cold{border-left:3px solid #FF294B;
  background:linear-gradient(90deg,rgba(255,41,75,.13),transparent 38%),var(--dr-panel)}
/* ── THE PANEL, taking its seats ── */
.dr-panelrow{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;
  padding:16px 18px;margin-bottom:14px;
  background:linear-gradient(180deg,rgba(255,61,154,.14),rgba(10,2,7,.6));
  border:1px solid rgba(255,61,154,.4)}
.dr-seat{text-align:center;font-size:11px;letter-spacing:.1em;color:#ffd0e8}
.dr-seat b{display:block;margin-top:5px;font-size:12px;color:#fff}

/* ── THE RUNWAY ── one walk, one meter ── */
/* ── THE WALK CARD ──
   The prose used to live in the middle cell of a three-column grid, between the
   portrait and the score, which is the narrowest place on the card: a 178px
   ribbon of text inside a 358px card. The header row keeps that shape — face,
   name, bar, score — and the paragraph runs the FULL width underneath it,
   where a paragraph belongs. */
.dr-walk-line{grid-column:1/-1;margin:12px 0 0;color:#f4e3ed;font-size:15px;
  line-height:1.6;max-width:74ch;text-wrap:pretty}
.dr-walk-fit{grid-column:1/-1;margin:7px 0 0;color:#C9A6BC;font-size:13.5px;
  line-height:1.55;max-width:74ch;text-wrap:pretty}
.dr-walk{display:grid;grid-template-columns:auto 1fr auto;gap:15px;align-items:center;
  padding:14px 16px 14px 20px}
.dr-walk h3{margin:0;font-size:18px}
.dr-look{font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;color:#ffd0e8;
  margin:4px 0 0;text-wrap:pretty}
/* ── THE CATEGORY, AS A MARQUEE ──
   It was a plain rectangle with centred text. A category announcement is the
   one piece of signage this show puts on screen every week, so it gets the
   thing signage has: a lit border, bulbs, and a name big enough to read from
   the back. */
.dr-marquee{position:relative;text-align:center;padding:26px 24px 28px;
  border:1px solid rgba(255,200,61,.42);border-radius:2px;
  background:radial-gradient(120% 140% at 50% 0%,rgba(255,200,61,.13),transparent 62%),
    linear-gradient(180deg,#2A1020,#180A14);
  box-shadow:inset 0 1px 0 rgba(255,214,240,.18),0 22px 50px -18px rgba(0,0,0,.85)}
.dr-marquee::before,.dr-marquee::after{content:"";position:absolute;left:14px;right:14px;
  height:7px;background:radial-gradient(circle at 50% 50%,#FFE9A8 0 2.1px,rgba(255,200,61,.28) 2.6px,transparent 3px) 0 0/17px 7px repeat-x}
.dr-marquee::before{top:7px}
.dr-marquee::after{bottom:7px}
.dr-marquee .dr-cat-k{font-size:9.5px;letter-spacing:.34em;color:#FFC83D}
.dr-marquee .dr-cat-v{font-size:34px;line-height:1.1;margin-top:8px;
  text-shadow:0 0 26px rgba(255,123,200,.45);text-wrap:balance}

/* The runway strip the cards stand on. */
.dr-floor{height:3px;margin:16px 0 4px;border-radius:2px;
  background:linear-gradient(90deg,transparent,rgba(255,200,61,.55),transparent)}

.dr-bar{height:10px;background:rgba(255,255,255,.12);margin-top:9px;overflow:hidden}
.dr-bar i{display:block;height:100%;background:linear-gradient(90deg,#00E5FF,#FF3D9A);
  box-shadow:0 0 14px rgba(255,61,154,.7)}
.dr-runscore{font-size:23px;font-variant-numeric:tabular-nums;padding:9px 14px;
  border-radius:3px;background:linear-gradient(180deg,#31142A,#1C0A18);
  box-shadow:inset 0 1px 0 rgba(255,214,240,.2),0 8px 18px -6px rgba(0,0,0,.8);
  border:1px solid currentColor;color:#FF7BC8}

/* ── VISUAL-NOVEL CRITIQUE ── the bust breaks OUT of the box ── */
.dr-vn{position:relative;margin:26px 0 14px;padding:15px 17px 15px 118px;min-height:104px}
.dr-vn .dr-bust{position:absolute;left:-14px;bottom:0}
.dr-vn .dr-por{border:2px solid rgba(255,255,255,.35)}
.dr-plate{position:absolute;left:-14px;top:-16px;padding:4px 13px;font-size:12px;
  letter-spacing:.14em;color:#1a0a02;z-index:2;background:var(--dr-tone,#FFC83D);
  clip-path:polygon(0 0,100% 0,calc(100% - 9px) 100%,0 100%)}
.dr-vn q{display:block;font-size:19px;line-height:1.3;margin-bottom:5px;text-wrap:balance}
.dr-vn p{margin:0;color:#f0dfe9;font-size:14px;text-wrap:pretty}
.dr-vn::before{background:var(--dr-tone,#FFC83D);box-shadow:0 0 14px var(--dr-tone,#FFC83D)}
.dr-tone-praise{--dr-tone:#3BE08A}
.dr-tone-mixed{--dr-tone:#FFC83D}
.dr-tone-pan{--dr-tone:#FF294B}
.dr-tonetag{position:absolute;right:12px;top:12px;font-size:9px;letter-spacing:.16em;
  padding:3px 8px;border:1px solid var(--dr-tone,#FFC83D);color:var(--dr-tone,#FFC83D)}
.dr-reasons{margin-top:8px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#C9A6BC}
.dr-split{display:inline-block;margin-left:8px;font-size:9px;letter-spacing:.14em;
  padding:2px 8px;border:1px solid #FF7BC8;color:#FF7BC8}

/* Her reaction, under the panel's words. */
.dr-react{margin-top:12px;padding:10px 14px;border-left:3px solid #7B2FF7;
  background:rgba(123,47,247,.10);font-size:13.5px;color:#e5d5f2}

/* ── UNTUCKED ── a room, not a stage. It can also shake. ── */
.dr-shake{animation:drShake .5s ease}
@keyframes drShake{10%,90%{transform:translateX(-4px)}30%,70%{transform:translateX(6px)}
  50%{transform:translateX(-6px)}}
.dr-act{margin:20px 0 10px;font-size:11px;letter-spacing:.24em;text-transform:uppercase;
  color:#C9A6BC;border-bottom:1px solid rgba(255,255,255,.14);padding-bottom:6px}
@media(prefers-reduced-motion:reduce){.dr-shake{animation:none}}
`;

/** The panel takes its seats — the host in drag, because this is the stage. */
export function rpBuildMainStage(row) {
  const ep = epOf(row);
  const ids = row?.dr?.judges || [];
  if (!ids.length) return '';
  const guest = row?.dr?.guest;
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'main-stage' && s.text);

  const seats = `<div class="dr-panelrow">${ids.map(id => `<span class="dr-seat">
      ${_judgePortrait(id, { stage: true, size: 62 })}<b>${esc(judgeName(id))}</b></span>`).join('')}
    ${guest ? `<span class="dr-seat">${_portrait(guest.name || guest, ep, { size: 62 })}
      <b>${esc(guest.name || guest)}</b>${guest.credit
    ? `<div style="font-size:9px;opacity:.7">${esc(guest.credit)}</div>` : ''}</span>` : ''}
  </div>`;

  const steps = scenes.map((sc, i) => `<div class="dr-step" id="dr-step-mainstage-${i}">
    <div class="dr-panel dr-a-score" style="padding:14px 16px 14px 20px">
      <p style="margin:0;color:#f4e3ed">${esc(sc.text)}</p></div></div>`).join('');

  return `<style>${STAGE_CSS}</style>${_shell(seats + steps, ep, {
    phase: 'stage', title: 'The Main Stage', subtitle: 'the panel takes its seats',
  })}${_controls('mainstage', Math.max(1, scenes.length), ep.num)}`;
}

/** The runway: the category, then one walk at a time. */
export function rpBuildRunway(row) {
  const ep = epOf(row);
  const rw = row?.dr?.runway;
  if (!rw?.category) return '';
  const order = (row.dr.assignment?.order || []).filter(n => rw[n]);
  const walkers = order.length ? order : Object.keys(rw).filter(k => rw[k]?.score !== undefined);
  if (!walkers.length) return '';

  const lead = `<div class="dr-marquee">
      <div class="dr-cat-k dr-disp">Tonight&rsquo;s category is</div>
      <div class="dr-cat-v dr-fash">${esc(rw.category)}</div>
    </div><div class="dr-floor"></div>`;

  /* THE WALK ITSELF, WHICH THIS SCREEN WAS THROWING AWAY.
     Every queen has a written walk on the row — `stage:walk`, and often a
     `stage:walk-fit` line about whether the look answered the category — and
     this drew a portrait, a bar and a number and none of the words. Nine
     descriptions on the row, a hundred and ten characters on the screen. The
     runway is the one thing a viewer sees every single episode and it was the
     emptiest thing in the reader. */
  const lineFor = (kind, name) => (row.dr.scenes || []).find(sc =>
    sc.kind === kind && (sc.data?.players || [])[0] === name)?.text || '';

  const steps = walkers.map((name, i) => {
    const w = rw[name] || {};
    const score = Number(w.score) || 0;
    const walk = lineFor('stage:walk', name);
    const fit = lineFor('stage:walk-fit', name);
    return `<div class="dr-step" id="dr-step-runway-${i}">
      <div class="dr-panel dr-a-score dr-walk">
        ${_portrait(name, ep, { size: 58, station: true })}
        <div><h3 class="dr-disp">${esc(name)}</h3>
          ${(w.walks || []).length > 1
    ? `<p class="dr-look">${w.walks.length} looks tonight</p>` : ''}
          <div class="dr-bar"><i style="width:${Math.max(4, Math.min(100, score * 10))}%"></i></div>
        </div>
        <span class="dr-runscore dr-disp">${n1(score)}</span>
        ${walk ? `<p class="dr-walk-line">${esc(walk)}</p>` : ''}
        ${fit ? `<p class="dr-walk-fit">${esc(fit)}</p>` : ''}
      </div></div>`;
  }).join('');

  /* THE LEADERBOARD, GATED. Only the queens who have already walked — a
     board carrying a score the viewer has not been shown is the spoiler. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar.runway = walkers.map((_, i) => `<h4 class="dr-disp">The runway</h4>${
      walkers.slice(0, i + 1)
        .map(n => ({ n, s: Number(rw[n]?.score) || 0 }))
        .sort((a, b) => b.s - a.s)
        .map(({ n, s }) => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
          <div><div class="dr-nm">${esc(n)}</div></div>
          <span class="dr-chip ${s >= 8 ? 'dr-c-win' : s >= 6 ? 'dr-c-high' : 'dr-c-safe'}">${n1(s)}</span>
        </div>`).join('')}`);
  }

  return `<style>${STAGE_CSS}</style>${_shell(lead + steps, ep, {
    phase: 'stage', title: 'The Runway', subtitle: esc(rw.category),
    sidebar: _seedRail('runway', '<h4 class="dr-disp">The runway</h4>'),
  })}${_controls('runway', walkers.length, ep.num)}`;
}

/**
 * The critiques — one queen at a time, every judge who spoke about her.
 *
 * THE FINAL RANK IS NOT ON THIS SCREEN. The panel ranks and then the host
 * decides; those are two moments, and at this one the host has not decided.
 * The rail carries the PANEL's running ranking only.
 */
export function rpBuildCritiques(row) {
  const ep = epOf(row);
  const lines = row?.dr?.critiques || [];
  if (!lines.length) return '';
  const reactions = row?.dr?.reactions || {};
  const split = row?.dr?.panel?.split;

  /* THE WORDS ARE ON THE SCENES, NOT ON `dr.critiques`.
     `critiques` carries the judgement — judge, tone, reasons, rank, gap —
     and the LINE she actually said is a `stage:critique` scene. Reading only
     the first gave a screen of "RuPaul praise challenge · risk" with no
     critique on it: every judge accounted for and not one of them speaking.
     Matched on queen and judge, which both records carry. */
  const said = new Map();
  for (const sc of row.dr.scenes || []) {
    if (sc.kind !== 'stage:critique' || !sc.text) continue;
    const q = (sc.data?.players || [])[0];
    said.set(`${q}|${sc.data?.judge}`, sc);
  }

  const byQueen = new Map();
  for (const c of lines) {
    if (!byQueen.has(c.queen)) byQueen.set(c.queen, []);
    const spoken = said.get(`${c.queen}|${c.judgeName || judgeName(c.judge)}`);
    byQueen.get(c.queen).push({ ...c, text: c.text || spoken?.text || '', note: spoken?.data?.note });
  }
  const queens = [...byQueen.keys()];

  const steps = queens.map((name, i) => {
    const hers = byQueen.get(name);
    const tones = new Set(hers.map(c => c.tone));
    const disagreed = tones.size > 1;
    const cards = hers.map(c => `<div class="dr-panel dr-vn dr-tone-${esc(c.tone)}">
        <span class="dr-plate dr-disp">${esc(c.judgeName || judgeName(c.judge))}</span>
        <span class="dr-tonetag dr-disp">${esc(c.tone)}</span>
        ${_judgePortrait(c.judge, { stage: true, size: 118 })}
        <q class="dr-disp">${esc(c.text || c.line || '')}</q>
        ${c.note ? `<p>${esc(c.note)}</p>` : ''}
        ${(c.reasons || []).length
    ? `<div class="dr-reasons">${c.reasons.map(esc).join(' · ')}</div>` : ''}
      </div>`).join('');
    return `<div class="dr-step" id="dr-step-critiques-${i}">
      <div class="dr-panel dr-a-score" style="padding:14px 16px 14px 20px">
        ${_portrait(name, ep, { size: 54, station: true })}
        <b class="dr-disp" style="font-size:19px;margin-left:10px">${esc(name)}</b>
        ${disagreed ? '<span class="dr-split dr-disp">the panel is split</span>' : ''}
      </div>
      ${cards}
      ${reactions[name]
    ? `<div class="dr-react">She takes it: <b>${esc(reactions[name])}</b>.</div>` : ''}
    </div>`;
  }).join('');

  /* THE PANEL'S RUNNING RANKING — the screen's whole point. Gated to the
     queens critiqued so far, and it is the PANEL's order, never the host's. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    const rankOf = n => (byQueen.get(n) || []).reduce((m, c) => Math.min(m, c.rank ?? 99), 99);
    window._drSidebar.critiques = queens.map((_, i) => `<h4 class="dr-disp">The panel, so far</h4>${
      queens.slice(0, i + 1).sort((a, b) => rankOf(a) - rankOf(b))
        .map(n => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
          <div><div class="dr-nm">${esc(n)}</div></div>
          <span class="dr-chip dr-c-safe">${rankOf(n) === 99 ? '—' : rankOf(n)}</span></div>`).join('')}
      <p style="margin:10px 0 0;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#C9A6BC">
        The panel's order. The host has not decided yet.</p>`);
  }

  return `<style>${STAGE_CSS}</style>${_shell(steps, ep, {
    phase: 'stage', title: 'The Critiques',
    subtitle: split ? 'the panel is split tonight' : 'the panel speaks',
    sidebar: _seedRail('critiques', '<h4 class="dr-disp">The panel, so far</h4>'),
  })}${_controls('critiques', queens.length, ep.num)}`;
}

/** Untucked: a room, not a stage — and it can get loud. */
export function rpBuildUntucked(row) {
  const ep = epOf(row);
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'untucked' && s.text);
  if (!scenes.length) return '';
  /* THE ROOM HAS AN ARC AND THE SCREEN NOW SHOWS IT. Untucked runs
     arrival → middle → late — off the stage still in the look, the long
     wait where the fights happen, then being called back — and every event
     carries which one it is. Nine identical lozenges threw that away; the
     column now breaks into the three parts of the night.
     And each card takes its colour from what the scene DID: the bond
     delta is already on the scene, so a moment that pulled two queens
     together and one that pushed them apart no longer look the same. */
  const BAND = {
    arrival: ['Off the stage', 'still in the look, still shaking'],
    middle: ['The long wait', 'nobody knows the verdict yet'],
    late: ['Called back', 'the door opens again'],
  };
  let band = null;
  const steps = scenes.map((sc, i) => {
    const players = sc.data?.players || [];
    // The fight escalating: the shell shakes on the beat that escalates it.
    const loud = /blow-up|walks-out|say-it-to-my-face|told-to-stop/.test(sc.kind || '');
    const d = Number(sc.effects?.bond) || 0;
    const heat = d > 0.15 ? ' dr-u-warm' : d < -0.15 ? ' dr-u-cold' : '';
    const ph = sc.data?.phase;
    let head = '';
    if (ph && ph !== band && BAND[ph]) {
      band = ph;
      head = `<div class="dr-band"><b class="dr-disp">${esc(BAND[ph][0])}</b>
        <span>${esc(BAND[ph][1])}</span></div>`;
    }
    /* THE HEADER LIVES INSIDE THE STEP, so it arrives with the first card of
       its band rather than sitting there before anything is revealed
       announcing that a third act exists. */
    return `<div class="dr-step" id="dr-step-untucked-${i}">${head}
      <div class="dr-panel ${players.length > 1 ? 'dr-a-bond' : 'dr-a-room'}${loud ? ' dr-shake' : ''}${heat} dr-utk">
        <span class="dr-utk-who">${players.slice(0, 2)
    .map(n => _portrait(n, ep, { size: 46 })).join('')}</span>
        <div>${players.length ? `<b class="dr-disp">${esc(players.join(' & '))}</b>` : ''}
          <p>${esc(sc.text)}</p></div>
      </div></div>`;
  }).join('');
  return `<style>${STAGE_CSS}</style>${_shell(steps, ep, {
    phase: 'untucked', title: 'Untucked', subtitle: 'Illusions Lounge',
  })}${_controls('untucked', scenes.length, ep.num)}`;
}
