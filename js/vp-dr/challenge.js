// ══════════════════════════════════════════════════════════════════════
// vp-dr/challenge.js — the mini, the brief, the draft, prep, and the maxi
// ══════════════════════════════════════════════════════════════════════
//
// The prose is already written (js/dr/data/challenge-beats.js,
// maxi-events.js, maxi-performance.js) and the engine has already decided
// everything. These screens RENDER; they do not compute. A screen that
// called a simulation function would show tonight's answer on a replay of
// episode four.
//
// ── ONE PANEL PER CHALLENGE TYPE, BECAUSE THE DATA IS DIFFERENT ───────
//
// Every maxi writes its own `detail` block per queen, and they share almost
// nothing:
//
//   snatch-game  { character, rounds[6] }        six answers, one per round
//   ball         { theme, looks[{label,sewn}] }  three walks, one sewn
//   roast        { slot, slotKind, bits[], roomTemp, duds }
//   makeover     { partner, resemblance, ownLook, partnerLook }
//   improv       { premise, froze }
//   acting       { script, part, dropped, needs }
//   girl-group   { verse, teamWon, teamMean }     and music-video, rusical
//
// A generic score card over all of that would throw away everything that
// makes a Snatch Game a Snatch Game. So the dispatch is on
// `row.dr.challenge.id`, and anything unrecognised falls to the generic
// card rather than to a blank — a new challenge type is playable the day
// it is written, and looks plain until somebody gives it a panel.
//
// ── AND THE BRIEF IS DRAWN IN FULL ────────────────────────────────────
//
// `desc` from the catalogue is the ONLY place the viewer is told what the
// queens are physically doing. The narration says what happened, not what
// the rules were, so a truncated desc leaves a result nobody can follow.
// That is a project rule with its own test on the Big Brother side.
import { _shell, _portrait, _icon, _note } from './style.js';
import { _controls, _seedRail } from './reveal.js';
import { maxiById } from '../dr/data/challenges.js';
import { characterById } from '../dr/data/snatch-characters.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n1 = v => (Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—');
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

export /* THE TRACK AND WHAT IT SOUNDS LIKE. The girl group's theme reached the row
   and no screen read it — the group names rendered, the song they were
   recording did not, which is the same "computed and drawn nowhere" shape as
   everything else this build has turned up. Drawn on the brief, where the
   queens are actually told what they are making. */
function _trackLine(row) {
  const d = _sceneData(row, 'group-parts');
  if (!d?.track) return '';
  /* NO "X vs Y" LINE ANY MORE. The team board under this now names both
     groups and lists who is in them, and printing the same two names again
     one line above it was the only thing the brief said about the split. */
  return `<p class="dr-track"><b class="dr-disp">&ldquo;${esc(d.track)}&rdquo;</b>`
    + `${d.sound ? ` &mdash; ${esc(d.sound)}` : ''}</p>`;
}

/** One scene's data off the row, by kind. */
function _sceneData(ep, kind) {
  return (ep?.dr?.scenes || []).find(sc => sc.kind === kind)?.data || null;
}

const CHAL_CSS = `
/* THE NARRATION SPANS THE ROW. These paragraphs are injected into the
   performance card just before its closing tags, which puts them inside
   .dr-row — a three-column grid of bust / detail / score. Each paragraph
   therefore landed in the next free CELL, so a queen's performance was
   rendered eighty pixels wide, one word per line, down the score column.
   1/-1 puts them back across the whole card. */
/* ══ THE SIX ROOMS ══ ambient, behind the cards, drawn in CSS ══
   Each is a fixed layer so it does not scroll with the prose — the room
   stays still and the night moves through it. All of them are cheap: a
   gradient, a repeat, and at most one slow animation. */
/* THE ROOM IS THE SCREEN, NOT THE WINDOW. Fixed to the viewport, the
   theatre's left curtain sat underneath the navigation sidebar and its
   footlights ran along the bottom of the browser rather than the bottom of
   the stage — the set was in the wrong building. Absolute inside the
   content column makes the edges of the room the edges of the screen the
   reader is actually looking at, and the walls then run the full length of
   the night rather than one screenful of it. */
.dr-fam{position:relative;z-index:1}
.dr-room{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden;border-radius:2px}
.dr-room i{position:absolute;display:block}

/* A TELEVISION STUDIO: the tally light and the scan of a monitor.
   THE TALLY SAT AT 50% AND LANDED ON THE EPISODE HEADER — a red dot in the
   middle of the title, which reads as a fault rather than a camera. It goes
   in the corner where a tally actually is. */
.dr-room-studio{background:
  radial-gradient(120% 70% at 50% 0%,rgba(56,189,248,.16),transparent 62%),
  radial-gradient(90% 60% at 50% 110%,rgba(56,189,248,.08),transparent 70%)}
.dr-room-studio::after{content:"";position:absolute;inset:0;
  box-shadow:inset 0 0 190px 60px rgba(0,0,0,.6)}
.dr-tally{top:16px;right:20px;width:10px;height:10px;border-radius:50%;background:#FF294B;
  box-shadow:0 0 26px 7px rgba(255,41,75,.7);animation:drTally 3.4s ease-in-out infinite}
@keyframes drTally{0%,88%,100%{opacity:1}92%{opacity:.2}}
.dr-scan{inset:0;background:repeating-linear-gradient(180deg,
  rgba(255,255,255,.05) 0 1px,transparent 1px 4px)}

/* A THEATRE: two curtains and a row of footlights. */
.dr-room-stage{background:radial-gradient(120% 80% at 50% 100%,rgba(255,200,61,.18),transparent 65%)}
.dr-room-stage::after{content:"";position:absolute;inset:0;
  box-shadow:inset 0 0 200px 70px rgba(0,0,0,.62)}
.dr-curtain{top:0;bottom:0;width:13%;opacity:.85;
  background:repeating-linear-gradient(90deg,rgba(122,10,40,.5) 0 14px,rgba(60,4,20,.5) 14px 28px)}
.dr-curtain.dr-l{left:0}.dr-curtain.dr-r{right:0;transform:scaleX(-1)}
.dr-foots{left:11%;right:11%;bottom:0;height:70px;
  background:repeating-linear-gradient(90deg,rgba(255,233,168,.20) 0 6px,transparent 6px 34px);
  filter:blur(6px)}

/* A COMEDY CLUB: brick, and one hard spot on the mic. */
.dr-room-club{background:linear-gradient(180deg,rgba(10,6,8,.5),transparent 40%)}
.dr-brick{inset:0;opacity:.5;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 26px),
    repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 1px,transparent 1px 54px)}
.dr-clubspot{top:0;left:50%;width:380px;height:78%;transform:translateX(-50%);
  background:linear-gradient(180deg,rgba(255,233,168,.26),transparent 72%);
  clip-path:polygon(44% 0,56% 0,100% 100%,0 100%)}

/* AN ATELIER: a cutting mat, and bolts of fabric leaning in the corners. */
.dr-room-atelier{background:radial-gradient(100% 60% at 50% 100%,rgba(255,61,154,.09),transparent 70%)}
.dr-cutting{inset:auto 0 0 0;height:46%;opacity:.5;
  background:repeating-linear-gradient(0deg,rgba(56,189,248,.16) 0 1px,transparent 1px 30px),
    repeating-linear-gradient(90deg,rgba(56,189,248,.16) 0 1px,transparent 1px 30px)}
.dr-bolt-a,.dr-bolt-b{bottom:0;width:52px;height:44%;
  background:linear-gradient(180deg,rgba(255,61,154,.22),rgba(255,61,154,.05))}
.dr-bolt-a{left:3%;transform:rotate(7deg)}
.dr-bolt-b{right:3%;transform:rotate(-9deg);
  background:linear-gradient(180deg,rgba(56,189,248,.2),rgba(56,189,248,.04))}

/* A DANCE FLOOR: marley, and the mirror wall behind it. */
.dr-room-floor{background:linear-gradient(180deg,rgba(20,6,14,.6),transparent 45%)}
.dr-marley{inset:auto 0 0 0;height:38%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.6));
  border-top:1px solid rgba(255,255,255,.09)}
.dr-mirror{top:8%;left:8%;right:8%;height:34%;opacity:.55;
  background:linear-gradient(110deg,rgba(255,255,255,.07),transparent 45%,rgba(255,255,255,.05));
  border:1px solid rgba(255,255,255,.08)}

/* A SOUNDSTAGE: a barn-door flag and a boom shadow. */
.dr-room-set{background:radial-gradient(110% 70% at 30% 0%,rgba(255,233,168,.09),transparent 60%)}
.dr-flag{top:0;left:14%;width:26%;height:32%;background:rgba(0,0,0,.45);
  clip-path:polygon(0 0,100% 0,72% 100%,0 78%)}
.dr-boom{top:6%;right:10%;width:44%;height:8px;background:rgba(0,0,0,.5);
  transform:rotate(-8deg);filter:blur(3px)}

@media(prefers-reduced-motion:reduce){.dr-tally{animation:none}}

.dr-perf-line{grid-column:1/-1;margin:9px 0 0;color:#f4e3ed;line-height:1.6;
  max-width:74ch;text-wrap:pretty}
.dr-track{margin-top:10px;color:#FFC83D;font-size:13px;line-height:1.5}
.dr-track span{color:#C9A6BC}
.dr-brief{padding:18px 22px;margin-bottom:14px;
  background:linear-gradient(180deg,rgba(0,229,255,.10),rgba(10,2,7,.6));
  border:1px solid rgba(0,229,255,.4)}
.dr-brief h3{margin:0 0 8px;font-size:26px;text-wrap:balance}
.dr-brief p{margin:0;color:#eaf7fb;font-size:15px;line-height:1.6;text-wrap:pretty}
.dr-brief .dr-fmt{display:inline-block;font-size:9px;letter-spacing:.2em;text-transform:uppercase;
  padding:3px 10px;margin-bottom:8px;border:1px solid rgba(0,229,255,.6);color:#00E5FF}

.dr-row{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;
  padding:13px 16px 13px 20px}
.dr-row h3{margin:0;font-size:17px}
.dr-row .dr-sub{font-size:11px;letter-spacing:.1em;color:#C9A6BC}
/* THE SCORE LANDS. It is the verdict on a performance and it appeared the
   same way the paragraph did — it should arrive after the reading, hard.
   Only on a revealed card, so it fires on the click rather than on paint. */
.dr-score{font-size:22px;font-variant-numeric:tabular-nums;padding:5px 12px;
  border:1px solid currentColor;color:#00E5FF}
.dr-score.dr-hot{color:#FFC83D}
.dr-score.dr-cold{color:#FF294B}
.dr-step.dr-vis .dr-score{animation:drScore .5s cubic-bezier(.2,1.6,.35,1) both;
  animation-delay:.12s}
@keyframes drScore{from{opacity:0;transform:scale(2.1) rotate(-7deg)}
  to{opacity:1;transform:scale(1) rotate(0)}}
/* And the card itself arrives from the room rather than fading in place. */
.dr-step.dr-vis .dr-panel{animation:drCard .42s ease-out both}
@keyframes drCard{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

/* THE CARDS BELONG TO THEIR ROOM. Each family sets the accent its own left
   rail and score take, so a Snatch Game card is not a Rusical card in a
   different building. */
.dr-fam-studio{--dr-fam:#38bdf8}
.dr-fam-stage{--dr-fam:#FFC83D}
.dr-fam-club{--dr-fam:#FF7A3D}
.dr-fam-atelier{--dr-fam:#FF3D9A}
.dr-fam-floor{--dr-fam:#3BE08A}
.dr-fam-set{--dr-fam:#C4B5FD}
.dr-fam .dr-panel{border-left-color:var(--dr-fam,#7a3a5e)}
.dr-fam .dr-perf-line{border-left:0}

@media(prefers-reduced-motion:reduce){
  .dr-step.dr-vis .dr-score,.dr-step.dr-vis .dr-panel{animation:none}
}

/* A bar of per-round marks — Snatch Game's six, the Ball's three, a roast set. */
.dr-marks{display:flex;gap:5px;margin-top:9px;flex-wrap:wrap}
.dr-mark{min-width:34px;text-align:center;font-size:11px;font-weight:700;padding:4px 6px;
  font-variant-numeric:tabular-nums;background:rgba(255,255,255,.08);
  border-bottom:2px solid var(--m,#00E5FF)}
.dr-mark small{display:block;font-size:8px;letter-spacing:.08em;color:#C9A6BC;font-weight:400}

.dr-tag{display:inline-block;font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  padding:2px 8px;margin-left:6px;border:1px solid currentColor}
.dr-t-warn{color:#FF294B}.dr-t-good{color:#3BE08A}.dr-t-note{color:#FFC83D}

/* The draft board: what is still on it, and who took what. */
/* THE BOARD IS WHO TOOK WHAT. The dr-taken class used to strike the chip
   through at a third opacity, from when a chip was a character crossed OFF
   the board; it now names a queen and her pick and has to be readable.
   NO BACKTICKS: this comment is inside a template literal. */
/* The mini's result card — the last click on that screen. */
.dr-miniwin{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;
  padding:16px 20px;border-left:4px solid #FFC83D;
  background:linear-gradient(90deg,rgba(255,200,61,.16),transparent 55%),var(--dr-panel)}
.dr-miniwin b{display:block;font-size:26px;color:#FFC83D;line-height:1.05}
.dr-miniwin p{margin:4px 0 0;color:#f4e3ed}
/* THE GROUPS, on the brief. */
.dr-teams{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:12px;margin:0 0 14px}
.dr-team{padding:12px 14px;border:1px solid var(--dr-line);background:rgba(0,0,0,.26)}
.dr-team-k{margin-bottom:9px;padding-bottom:6px;font-size:15px;color:#FFC83D;
  border-bottom:1px solid rgba(255,200,61,.28);text-wrap:balance}
.dr-team-q{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;
  padding:4px 0}
.dr-team-q b{font-size:12.5px;font-weight:600;color:#f0dfe9}
.dr-team-q i{font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  font-style:normal;color:#C9A6BC}
.dr-board{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));
  gap:9px;margin-bottom:16px}
.dr-chip-lg{display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:center;
  padding:8px 11px;font-size:12px;border:1px solid var(--dr-line);
  background:rgba(0,0,0,.24)}
.dr-chip-lg .dr-por{border:1px solid rgba(255,255,255,.22)}
.dr-took{display:block;min-width:0}
.dr-took b{display:block;font-size:12px;font-weight:600;color:#f0dfe9;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dr-took i{display:block;font-style:normal;font-size:12.5px;color:#FFC83D;
  line-height:1.25;text-wrap:pretty}
.dr-took u{display:block;margin-top:2px;font-size:9.5px;letter-spacing:.1em;
  text-transform:uppercase;color:#FF294B;text-decoration:none}
/* She wanted something else and did not get it. */
.dr-chip-lg.dr-lost{border-color:rgba(255,41,75,.4)}
.dr-nm-sub{font-size:10.5px;color:#FFC83D;line-height:1.25}

/* Teams, side by side. */
.dr-teams{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.dr-team{padding:12px 14px;border:1px solid rgba(255,255,255,.16)}
.dr-team h4{margin:0 0 8px;font-size:12px;letter-spacing:.2em;color:#FFC83D}
.dr-team.dr-won{border-color:rgba(255,200,61,.7);background:rgba(255,200,61,.07)}
.dr-member{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px}
.dr-role{margin-left:auto;font-size:9px;letter-spacing:.12em;color:#C9A6BC;text-transform:uppercase}

/* The roast's room temperature, moving down the running order. */
.dr-temp{height:6px;background:rgba(255,255,255,.12);margin-top:8px;overflow:hidden}
.dr-temp i{display:block;height:100%;background:linear-gradient(90deg,#00E5FF,#FFC83D,#FF294B)}
`;

/* ── the pieces ─────────────────────────────────────────────────── */

function marks(list, labels = []) {
  if (!Array.isArray(list) || !list.length) return '';
  return `<div class="dr-marks">${list.map((v, i) => {
    const num = Number(v);
    const hue = num >= 8 ? '#3BE08A' : num >= 6 ? '#00E5FF' : num >= 4 ? '#FFC83D' : '#FF294B';
    return `<span class="dr-mark" style="--m:${hue}">${n1(num)}${
      labels[i] ? `<small>${esc(labels[i])}</small>` : ''}</span>`;
  }).join('')}</div>`;
}

const scoreClass = p => (p >= 8.5 ? 'dr-hot' : p <= 4.5 ? 'dr-cold' : '');

/**
 * The per-type body for one queen's performance.
 *
 * Returns '' for a type with no panel yet, and the caller falls back to the
 * generic card — so a challenge nobody has designed a panel for still plays
 * and still reads, it simply looks plain.
 */
function detailFor(id, perf) {
  const d = perf?.detail || {};
  switch (id) {
    case 'snatch-game':
      return `<div class="dr-sub">as <b>${esc(d.character || '—')}</b>${
        d.dying ? '<span class="dr-tag dr-t-warn">dying</span>' : ''}${
        d.doubleAct ? '<span class="dr-tag dr-t-good">double act</span>' : ''}</div>
        ${marks(d.rounds || [], (d.rounds || []).map((_, i) => `R${i + 1}`))}`;
    case 'ball':
      return `<div class="dr-sub">${esc(d.theme || 'the ball')}</div>
        ${marks((d.looks || []).map(l => l.score), (d.looks || []).map(l =>
    `${l.label}${l.sewn ? ' ✂' : ''}`))}`;
    case 'roast':
      return `<div class="dr-sub">slot ${esc(d.slot ?? '—')} · ${esc(d.slotKind || '')}${
        d.duds ? `<span class="dr-tag dr-t-warn">${esc(d.duds)} dud${d.duds === 1 ? '' : 's'}</span>` : ''}</div>
        ${marks(d.bits || [], (d.bits || []).map((_, i) => `bit ${i + 1}`))}
        ${d.roomTemp !== undefined ? `<div class="dr-temp"><i style="width:${
    Math.max(0, Math.min(100, 50 + Number(d.roomTemp) * 12))}%"></i></div>` : ''}`;
    case 'makeover':
      return `<div class="dr-sub">with <b>${esc(d.partner || '—')}</b></div>
        ${marks([d.resemblance, d.ownLook, d.partnerLook], ['likeness', 'her look', 'theirs'])}`;
    case 'improv':
      return `<div class="dr-sub">${esc(d.premise || '')}${
        d.froze ? '<span class="dr-tag dr-t-warn">froze</span>' : ''}</div>`;
    case 'acting':
      return `<div class="dr-sub"><b>${esc(d.part || '—')}</b> in ${esc(d.script || '')}${
        d.dropped ? '<span class="dr-tag dr-t-warn">dropped a line</span>' : ''}</div>`;
    case 'girl-group': case 'music-video': case 'rusical': case 'singing': case 'rumix':
      return `<div class="dr-sub">${perf.role ? `${esc(perf.role)} · ` : ''}${
        d.teamWon ? '<span class="dr-tag dr-t-good">winning team</span>' : 'team'}</div>
        ${marks([d.verse, d.teamMean], ['her verse', 'the team'])}`;

    /* ── THE NINE THAT HAD NO PANEL ──
       Ten types were rendered and nine were not, and every one of those nine
       carries real detail the engine had already computed — the product she
       was selling, the fabric she was handed, the formation she blew. Their
       cards drew a portrait, a score bar and no words at all.
       It surfaced on `stand-up` alone, and only because a late episode with
       four queens left produced a screen short enough to trip a
       text-length check: the others were padded over the threshold by the
       scenes around them. One instance of a nine-way gap. */
    case 'stand-up':
      return `<div class="dr-sub">slot ${esc(d.slot ?? '—')}${d.slotKind ? ` · ${esc(d.slotKind)}` : ''}${
        d.duds ? `<span class="dr-tag dr-t-warn">${esc(d.duds)} dud${d.duds === 1 ? '' : 's'}</span>` : ''}</div>
        ${marks(d.bits || [], (d.bits || []).map((_, i) => `bit ${i + 1}`))}`;
    case 'photoshoot':
      return `<div class="dr-sub">${esc(d.hazard || 'the shoot')}${
        d.best !== undefined ? `<span class="dr-tag dr-t-good">best ${Number(d.best).toFixed(1)}</span>` : ''}</div>
        ${marks(d.frames || [], (d.frames || []).map((_, i) => `frame ${i + 1}`))}`;
    case 'design':
      return `<div class="dr-sub">out of <b>${esc(d.material || '—')}</b>${
        d.difficulty !== undefined ? ` · difficulty ${esc(d.difficulty)}` : ''}</div>
        ${marks([d.buildQuality], ['the build'])}`;
    case 'talent-show':
      return `<div class="dr-sub"><b>${esc(d.talent || '—')}</b>${
        d.landed === false ? '<span class="dr-tag dr-t-warn">did not land</span>'
    : d.landed ? '<span class="dr-tag dr-t-good">landed it</span>' : ''}</div>`;
    case 'runway-challenge':
      return `<div class="dr-sub">${(d.cats || []).map(c => esc(c)).join(' · ') || 'three looks'}${
        d.repeated ? '<span class="dr-tag dr-t-warn">repeated a look</span>' : ''}</div>
        ${marks(d.walks || [], (d.walks || []).map((_, i) => `look ${i + 1}`))}`;
    case 'lipsync-challenge':
      return `<div class="dr-sub">${esc(d.wins ?? 0)}W &ndash; ${esc(d.losses ?? 0)}L${
        (d.wins || 0) >= 3 ? '<span class="dr-tag dr-t-good">assassin</span>' : ''}</div>`;
    case 'commercial':
      return `<div class="dr-sub">selling <b>${esc(d.product || '—')}</b>${
        d.foundAngle ? '<span class="dr-tag dr-t-good">found the angle</span>'
    : '<span class="dr-tag dr-t-warn">never found the angle</span>'}</div>`;
    case 'choreography':
      return `<div class="dr-sub">${d.solo ? 'took the solo' : 'in the line'}${
        d.blewFormation ? '<span class="dr-tag dr-t-warn">blew the formation</span>' : ''}</div>`;
    default:
      return '';
  }
}

function perfCard(name, perf, i, suffix, ep, id) {
  const body = detailFor(id, perf);
  return `<div class="dr-step" id="dr-step-${suffix}-${i}">
    <div class="dr-panel dr-a-score dr-row">
      ${_portrait(name, ep, { size: 54, station: true })}
      <div><h3 class="dr-disp">${esc(name)}${
    perf?.moment ? '<span class="dr-tag dr-t-note">moment</span>' : ''}</h3>${body}</div>
      <span class="dr-score dr-disp ${scoreClass(perf?.perf)}">${n1(perf?.perf)}</span>
    </div></div>`;
}

/* ── the screens ────────────────────────────────────────────────── */

/** The mini: who won it and what the win buys. */
export function rpBuildMini(row) {
  const ep = epOf(row);
  const m = row?.dr?.mini;
  if (!m) return '';
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'mini' && s.text);
  const BUYS = {
    'first-pick': 'first pick of the draft',
    captain: 'she picks the teams',
    immunity: 'immunity from tonight',
    advantage: 'an advantage in the maxi',
  };
  /* THE LEAD SAYS WHAT IS AT STAKE, NOT WHO WON IT. It read "Priya takes it
     — and with it, pick-order" above eleven unrevealed beats: the screen
     announced the winner before the challenge it is a recording of had been
     watched. The rail did the same at every index. The prize is the right
     thing to open with; the winner is the thing the last click is for. */
  const prize = esc(BUYS[m.buys] || m.buys || 'the bragging rights');
  const lead = `<div class="dr-brief">
    <span class="dr-fmt">Mini challenge</span>
    <h3 class="dr-disp">${esc(m.name)}</h3>
    <p>Whoever takes it takes ${prize}.</p>
  </div>`;
  const steps = scenes.map((sc, i) => {
    const who = (sc.data?.players || [])[0];
    return `<div class="dr-step" id="dr-step-mini-${i}">
      <div class="dr-panel dr-a-score dr-row">
        ${who ? _portrait(who, ep, { size: 46 }) : '<span></span>'}
        <div>${who ? `<h3 class="dr-disp">${esc(who)}</h3>` : ''}
          <p style="margin:4px 0 0;color:#f4e3ed;line-height:1.6">${esc(sc.text)}</p></div>
        <span></span>
      </div></div>`;
  }).join('');

  // The result, as the last card rather than as the headline.
  const winStep = m.winner ? `<div class="dr-step" id="dr-step-mini-${scenes.length}">
    <div class="dr-panel dr-miniwin">
      ${_portrait(m.winner, ep, { size: 64, station: true })}
      <div><span class="dr-fmt">Wins the mini</span>
        <b class="dr-disp">${esc(m.winner)}</b>
        <p>She takes ${prize}.</p></div>
    </div></div>` : '';
  const total = scenes.length + (m.winner ? 1 : 0);

  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar.mini = Array.from({ length: total }, (_, i) =>
      `<h4 class="dr-disp">The mini</h4><p style="font-size:13px">${esc(m.name)}<br>
       <span style="color:#C9A6BC">Worth ${prize}.</span>${
  m.winner && i >= total - 1 ? `<br><br>Won by <b>${esc(m.winner)}</b>` : ''}</p>`);
  }
  return `<style>${CHAL_CSS}</style>${_shell(lead + steps + winStep, ep, {
    phase: 'werk', title: 'The Mini Challenge', subtitle: esc(m.name),
    sidebar: `<h4 class="dr-disp">The mini</h4><p style="font-size:13px">${esc(m.name)}<br>
      <span style="color:#C9A6BC">Worth ${prize}.</span></p>`,
  })}${_controls('mini', Math.max(1, total), ep.num)}`;
}

/**
 * The brief. The catalogue's `desc` IN FULL — it is the only place the
 * viewer learns what the queens are physically doing.
 */
/**
 * The groups, with the queens actually in them.
 *
 * A team challenge said "2 teams." and then printed the two band names on
 * one line — every roster the engine had built was on `assignment.teams`,
 * indexed against `teamNames`, and drawn nowhere. Who is in a group with
 * whom is the thing a team challenge IS, and the brief was the last screen
 * before the room split up.
 *
 * Roles come off the picks, so a lead reads as a lead here rather than
 * being something you work out later from a score.
 */
function _teamBoard(a, ep) {
  const teams = a?.teams || [];
  if (teams.length < 2) return '';
  const names = a.teamNames || a.theme?.names || [];
  return `<div class="dr-teams">${teams.map((members, i) => `
    <div class="dr-team">
      <div class="dr-team-k dr-disp">${esc(names[i] || `Group ${i + 1}`)}</div>
      ${(members || []).map(n => `<div class="dr-team-q">
        ${_portrait(n, ep, { size: 34 })}
        <b>${esc(n)}</b>
        ${a.picks?.[n]?.role ? `<i>${esc(a.picks[n].role)}</i>` : ''}
      </div>`).join('')}
    </div>`).join('')}</div>`;
}

export function rpBuildMaxiAnnounce(row) {
  const ep = epOf(row);
  const ch = row?.dr?.challenge;
  if (!ch) return '';
  const cat = maxiById(ch.id) || {};
  const a = row?.dr?.assignment || {};
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'maxi-announce' && s.text);

  const lead = `<div class="dr-brief">
    <span class="dr-fmt">${esc(cat.format || ch.format || 'maxi challenge')}</span>
    <h3 class="dr-disp">${esc(ch.name)}</h3>
    <p>${esc(cat.desc || 'The brief is on the table.')}</p>
    ${_trackLine(row)}
  </div>
  ${_teamBoard(a, ep)}`;
  const steps = scenes.map((sc, i) => `<div class="dr-step" id="dr-step-announce-${i}">
    <div class="dr-panel dr-a-room" style="padding:14px 16px 14px 20px">
      <p style="margin:0;color:#f4e3ed">${esc(sc.text)}</p></div></div>`).join('');
  return `<style>${CHAL_CSS}</style>${_shell(lead + steps, ep, {
    phase: 'werk', title: 'The Maxi Challenge', subtitle: 'the brief',
  })}${_controls('announce', Math.max(1, scenes.length), ep.num)}`;
}

/**
 * What a queen actually took, as words.
 *
 * The draft board read `p.name || p.role || who` — and `p.name` is the
 * QUEEN'S name, which every pick carries, so the condition never fell
 * through and the board drew nine chips each labelled with the name of the
 * queen standing next to it. What she picked is on `p.choice`, and was
 * being read by nothing.
 *
 * Snatch Game's pool has authored names; every other challenge's choices are
 * slugs, so a slug is title-cased rather than printed raw.
 */
function _choiceLabel(p) {
  const id = p?.choice || p?.pick || p?.part || '';
  if (!id) return '';
  return characterById(id)?.name
    || String(id).replace(/-/g, ' ').replace(/[a-z]/g, c => c.toUpperCase());
}

/** The draft: pick order, what came off the board, and the collisions. */
export function rpBuildChoice(row) {
  const ep = epOf(row);
  const a = row?.dr?.assignment || {};
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'choice' && s.text);
  const picks = Object.entries(a.picks || {});
  if (!picks.length && !scenes.length) return '';

  const board = picks.length ? `<div class="dr-board">${picks.map(([who, p]) => {
    const took = _choiceLabel(p);
    return `<span class="dr-chip-lg dr-taken${p?.lostTo ? ' dr-lost' : ''}">
      ${_portrait(who, ep, { size: 28 })}
      <span class="dr-took"><b>${esc(who)}</b>
        <i>${took ? esc(took) : 'no pick'}</i>
        ${p?.lostTo ? `<u>lost hers to ${esc(p.lostTo)}</u>` : ''}</span>
    </span>`;
  }).join('')}</div>` : '';

  const steps = scenes.map((sc, i) => {
    const who = (sc.data?.players || [])[0];
    return `<div class="dr-step" id="dr-step-choice-${i}">
      <div class="dr-panel dr-a-bond dr-row">
        ${who ? _portrait(who, ep, { size: 46 }) : '<span></span>'}
        <div>${who ? `<h3 class="dr-disp">${esc(who)}</h3>` : ''}
          <p style="margin:4px 0 0;color:#f4e3ed">${esc(sc.text)}</p></div>
        <span></span>
      </div></div>`;
  }).join('');
  return `<style>${CHAL_CSS}</style>${_shell(board + steps, ep, {
    phase: 'werk', title: 'The Draft', subtitle: 'who takes what',
  })}${_controls('choice', Math.max(1, scenes.length), ep.num)}`;
}

/** Prep: the room at work, and the host's walkthrough. */
export function rpBuildPrep(row) {
  const ep = epOf(row);
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'prep' && s.text);
  if (!scenes.length) return '';
  const steps = scenes.map((sc, i) => {
    const players = sc.data?.players || [];
    const host = /walkthrough|host/.test(sc.kind || '');
    return `<div class="dr-step" id="dr-step-prep-${i}">
      <div class="dr-panel ${host ? 'dr-a-score' : 'dr-a-room'} dr-row">
        ${players.length ? _portrait(players[0], ep, { size: 46, station: !host }) : _icon('sewing')}
        <div>${players.length ? `<h3 class="dr-disp">${esc(players.join(' & '))}</h3>` : ''}
          ${host ? '<span class="dr-sub">the walkthrough</span>' : ''}
          ${_note(sc) ? `<span class="dr-sub">${esc(_note(sc))}</span>` : ''}
          <p style="margin:4px 0 0;color:#f4e3ed;line-height:1.6">${esc(sc.text)}</p></div>
        <span></span>
      </div></div>`;
  }).join('');

  /* THE RAIL IS WHAT EVERYBODY IS MAKING. Prep drew two cards and half a
     page of nothing, on the one night the room is full of people building
     different things — and the draft has already told us what each of them
     took, so this is not a spoiler, it is the thing you want beside the
     prose while you read it. */
  const picks = Object.entries(row?.dr?.assignment?.picks || {});
  const rail = picks.length
    ? `<h4 class="dr-disp">On the table</h4>${picks.map(([who, p]) => {
      const took = _choiceLabel(p);
      return `<div class="dr-slot">${_portrait(who, ep, { size: 32 })}
        <div><div class="dr-nm">${esc(who)}</div>
        ${took ? `<div class="dr-nm-sub">${esc(took)}</div>` : ''}</div><span></span></div>`;
    }).join('')}`
    : '';

  return `<style>${CHAL_CSS}</style>${_shell(steps, ep, {
    phase: 'werk', title: 'The Work Room', subtitle: 'building it',
    sidebar: rail,
  })}${_controls('prep', scenes.length, ep.num)}`;
}

/** The performance itself, with the panel this challenge type deserves. */
/* ══════════════════════════════════════════════════════════════════════
   THE SIX WORLDS A MAXI CHALLENGE HAPPENS IN
   ══════════════════════════════════════════════════════════════════════

   One builder serves nineteen challenges, so it drew all nineteen the same
   way: a portrait, a score, a paragraph, nineteen times over. A Snatch Game
   and a Ball and a stand-up set are three different rooms with three
   different lights in them and the screen said nothing about which one you
   were in.

   It cannot have nineteen identities. It CAN have the rooms they happen in,
   which is six — and a family is a real property of the challenge, not a
   decoration: a queen doing comedy at a mic and a queen sewing at a station
   are being judged on different things, and the screen should not pretend
   otherwise.

   `format` on the challenge is solo/teams/cast/pairs — that is the team
   shape, not the subject — so the mapping is by hand and lives here.

   Each world sets its own accent and its own ambient layer. The ambient is
   CSS, not an image: a tally light and scanlines for a studio, footlights
   and a curtain for a stage, a brick wall and a lit mic for a club. */
const FAMILY = {
  'snatch-game': 'studio', commercial: 'studio', 'music-video': 'studio',
  photoshoot: 'studio',
  rusical: 'stage', 'talent-show': 'stage', singing: 'stage', rumix: 'stage',
  'lipsync-challenge': 'stage',
  roast: 'club', 'stand-up': 'club', improv: 'club',
  design: 'atelier', ball: 'atelier', makeover: 'atelier',
  'runway-challenge': 'atelier',
  choreography: 'floor', 'girl-group': 'floor',
  acting: 'set',
};
const familyOf = id => FAMILY[id] || 'stage';

/** The room, drawn in CSS. No images, no emoji. */
const ambientFor = fam => {
  const inner = {
    studio: '<i class="dr-tally"></i><i class="dr-scan"></i>',
    stage: '<i class="dr-curtain dr-l"></i><i class="dr-curtain dr-r"></i><i class="dr-foots"></i>',
    club: '<i class="dr-brick"></i><i class="dr-clubspot"></i>',
    atelier: '<i class="dr-cutting"></i><i class="dr-bolt-a"></i><i class="dr-bolt-b"></i>',
    floor: '<i class="dr-marley"></i><i class="dr-mirror"></i>',
    set: '<i class="dr-flag"></i><i class="dr-boom"></i>',
  }[fam] || '';
  return `<div class="dr-room dr-room-${fam}">${inner}</div>`;
};

const FAMILY_SUB = {
  studio: 'tape rolls', stage: 'places, please', club: 'the room goes quiet',
  atelier: 'the machines are running', floor: 'from the top',
  set: 'quiet on set',
};

export function rpBuildMaxi(row) {
  const ep = epOf(row);
  const ch = row?.dr?.challenge;
  const perfs = row?.dr?.performances || {};
  const names = Object.keys(perfs);
  if (!ch || !names.length) return '';
  const a = row?.dr?.assignment || {};
  const order = (a.order || []).filter(n => perfs[n]);
  const running = order.length ? order : names;

  /* THE GROUP'S OWN NAME. These read "Team 1" and "Team 2" — the girl group
     challenge had no theme at all, so the track was nameless and two identical
     groups performed the same nothing every time it came up. The theme now
     names the night's sound and each group falls out of it. Falls back to the
     number for any challenge that genuinely has unnamed teams. */
  const teamNames = a.teamNames || _sceneData(ep, 'group-parts')?.teamNames || [];
  const teams = (a.teams || []).length > 1 ? `<div class="dr-teams">${
    a.teams.map((team, ti) => {
      const won = team.some(n => perfs[n]?.detail?.teamWon);
      const label = teamNames[ti] || `Team ${ti + 1}`;
      return `<div class="dr-team ${won ? 'dr-won' : ''}">
        <h4 class="dr-disp">${esc(label)}${won ? ' — took it' : ''}</h4>
        ${team.map(n => `<div class="dr-member">${_portrait(n, ep, { size: 30 })}
          ${esc(n)}<span class="dr-role">${esc(perfs[n]?.role || '')}</span></div>`).join('')}
      </div>`;
    }).join('')}</div>` : '';

  /* AND THE NIGHT AS IT WAS WRITTEN. This drew a card per queen — portrait,
     score bar, a detail panel — and dropped every word of the challenge:
     9,452 characters of narration on the row against 657 on the screen. The
     maxi is the longest part of an episode and it was the emptiest.
     Her own lines sit with her card; anything about the room rather than one
     queen (the taping, a bit stolen, the whole cast reacting) runs between
     the cards in the order it happened. */
  const maxiScenes = (row.dr.scenes || []).filter(sc => sc.text
    && /^(perform:|maxi:|chal:performance)/.test(sc.kind || ''));
  const usedScene = new Set();
  const linesFor = name => maxiScenes.filter(sc => {
    if (usedScene.has(sc)) return false;
    const players = sc.data?.players || [];
    if (players[0] !== name) return false;
    usedScene.add(sc);
    return true;
  });

  const steps = running.map((name, i) => {
    const said = linesFor(name)
      .map(sc => `<p class="dr-perf-line">${esc(sc.text)}</p>`).join('');
    const card = perfCard(name, perfs[name], i, 'maxi', ep, ch.id);
    return said
      ? card.replace(/<\/div><\/div>$/, `${said}</div></div>`)
      : card;
  }).join('');

  // Whatever was about the room rather than one queen, after the cards.
  const room = maxiScenes.filter(sc => !usedScene.has(sc))
    .map((sc, i) => `<div class="dr-step" id="dr-step-maxi-room-${i}">
      <div class="dr-panel dr-a-room dr-scene">
        ${(sc.data?.players || []).length
    ? `<span class="dr-who">${(sc.data.players || []).slice(0, 2)
      .map(n => _portrait(n, ep, { size: 42 })).join('')}</span>` : ''}
        <div class="dr-scene-body">${esc(sc.text)}</div>
      </div></div>`).join('');

  /* THE RUNNING ORDER, GATED. The rail shows the queens up to the step the
     viewer has reached and nobody after — a panel carrying a score she has
     not been shown is the spoiler this screen exists to avoid. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar.maxi = running.map((_, i) => `<h4 class="dr-disp">So far</h4>${
      running.slice(0, i + 1)
        .map(n => ({ n, p: Number(perfs[n]?.perf) || 0 }))
        .sort((x, y) => y.p - x.p)
        .map(({ n, p }) => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
          <div><div class="dr-nm">${esc(n)}</div></div>
          <span class="dr-chip ${p >= 8 ? 'dr-c-win' : p >= 6 ? 'dr-c-high' : p >= 4 ? 'dr-c-safe' : 'dr-c-low'}">${n1(p)}</span>
        </div>`).join('')}`);
  }

  const fam = familyOf(ch.id);
  return `<style>${CHAL_CSS}</style>${_shell(
    `<div class="dr-fam dr-fam-${fam}">${ambientFor(fam)}${teams}${steps}${room}</div>`, ep, {
      phase: 'stage', title: ch.name, subtitle: FAMILY_SUB[fam] || 'tape rolls',
      sidebar: _seedRail('maxi', '<h4 class="dr-disp">So far</h4>'),
    })}${_controls('maxi', running.length, ep.num)}`;
}
