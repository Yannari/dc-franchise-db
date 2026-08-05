// ══════════════════════════════════════════════════════════════════════
// vp-bb-time-capsule.js — the archive, and the run through it
// ══════════════════════════════════════════════════════════════════════
//
// The first version of this screen was a small hatch and a stack of prose
// cards, and it deserved the word amateur: nothing on it told you what the
// houseguest was actually DOING in there, because at the time the engine did
// not know either — the capsule was one hidden dice roll.
//
// It is a real competition now (see bb/capsule-challenges.js), so the screen
// can be built out of what the comp IS: an archive of past seasons, with
// somebody alone inside it, on a clock, against a number.
//
// The layout is therefore two columns rather than a column of cards. On the
// left, the vault — shelving that recedes into the dark and a figure standing
// in the only light in it. On the right, a LOG that fills in as the run is
// revealed: which challenge came up, what it demands, the target, and the
// running total against it.
//
// That log is the point. It is the only thing on any of these screens that
// lets you do the arithmetic yourself while the reveal is still going — you
// can watch them fall two stages behind before the room finds out.
//
// Every stage card carries its own physics by grade: a clean stage snaps in
// square, a near miss arrives off-kilter and settles, a bad one drops hard.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

/**
 * The stat mixes, mirrored for the log.
 *
 * Duplicated deliberately rather than imported: the act is SERIALISED into
 * episode history, and a replayed season must draw the same chips months later
 * even if the challenge library has moved on. The act carries the id; this
 * carries what the id meant.
 */
const CAP_STATS = {
  'shelf-of-seasons': { mental: 0.44, intuition: 0.28, temperament: 0.28 },
  'the-vault-crawl': { physical: 0.42, endurance: 0.34, temperament: 0.24 },
  'the-tape-wall': { intuition: 0.40, mental: 0.32, social: 0.28 },
  'cold-storage': { endurance: 0.46, temperament: 0.30, physical: 0.24 },
  'the-ballot-box': { mental: 0.38, strategic: 0.34, intuition: 0.28 },
  'the-long-hallway': { physical: 0.40, mental: 0.32, endurance: 0.28 },
};

const TC_CSS = `
.bbtc{--tc-ink:#e9e4ff;--tc-dim:#8b83b8;--tc-line:#3b3260;--tc-gold:#f0c674;--tc-red:#f87171;--tc-green:#4ade80}
.bbtc-title{font-family:var(--font-display);font-size:clamp(28px,5vw,46px);letter-spacing:3px;text-align:center;color:var(--tc-ink);text-shadow:0 0 26px rgba(196,181,253,.35);margin:0 0 2px;line-height:1}
.bbtc-sub{font-family:var(--font-mono);text-align:center;font-size:9.5px;letter-spacing:2.2px;color:var(--tc-dim);text-transform:uppercase;margin-bottom:16px}

.bbtc-wrap{position:relative;max-width:1000px;margin:0 auto 20px;border:1px solid var(--tc-line);border-radius:10px;overflow:hidden;background:radial-gradient(120% 90% at 50% 0%,#241d3f 0%,#14102a 55%,#0b0819 100%)}
.bbtc-wrap::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px);mix-blend-mode:overlay}
.bbtc-dust{position:absolute;inset:0;pointer-events:none;opacity:.5;background-image:radial-gradient(1.5px 1.5px at 20% 30%,rgba(240,198,116,.55),transparent),radial-gradient(1.5px 1.5px at 70% 60%,rgba(240,198,116,.4),transparent),radial-gradient(1px 1px at 45% 80%,rgba(255,255,255,.35),transparent),radial-gradient(1px 1px at 85% 25%,rgba(255,255,255,.3),transparent);animation:bbtc-drift 14s linear infinite}
@keyframes bbtc-drift{from{transform:translate3d(0,0,0)}to{transform:translate3d(-6%,-9%,0)}}

.bbtc-grid{position:relative;display:grid;grid-template-columns:1.15fr .85fr}
@media(max-width:760px){.bbtc-grid{grid-template-columns:1fr}}
.bbtc-room{position:relative;padding:16px 14px 12px}
.bbtc-vault{display:block;width:100%;height:auto}

.bbtc-log{border-left:1px solid var(--tc-line);padding:16px 16px 14px;background:linear-gradient(180deg,rgba(11,8,25,.55),rgba(11,8,25,.9))}
@media(max-width:760px){.bbtc-log{border-left:none;border-top:1px solid var(--tc-line)}}
.bbtc-logh{font-family:var(--font-mono);font-size:9px;letter-spacing:2.2px;color:var(--tc-dim);text-transform:uppercase;margin:0 0 10px;display:flex;justify-content:space-between;align-items:center}
.bbtc-chal{font-family:var(--font-display);font-size:20px;letter-spacing:1.4px;color:var(--tc-gold);line-height:1.1;margin-bottom:6px}
.bbtc-desc{font-size:11.5px;line-height:1.55;color:#c9c2e8;margin-bottom:12px}
.bbtc-mix{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:14px}
.bbtc-stat{font-family:var(--font-mono);font-size:8.5px;letter-spacing:1.1px;text-transform:uppercase;padding:2px 7px;border-radius:2px;border:1px solid var(--tc-line);color:var(--tc-dim)}

.bbtc-meter{margin-bottom:12px}
.bbtc-nums{display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:9.5px;letter-spacing:1px;color:var(--tc-dim);margin-bottom:4px}
.bbtc-nums b{color:var(--tc-ink);font-weight:400}
.bbtc-bar{position:relative;height:8px;border:1px solid var(--tc-line);border-radius:2px;background:rgba(0,0,0,.35);overflow:hidden}
.bbtc-fill{position:absolute;top:0;bottom:0;left:0;background:linear-gradient(90deg,#6d5bb0,#a78bfa);transition:width .45s cubic-bezier(.22,1,.36,1)}
.bbtc-fill.is-over{background:linear-gradient(90deg,#2f9e5f,var(--tc-green))}
.bbtc-mark{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--tc-gold);box-shadow:0 0 8px rgba(240,198,116,.8)}

.bbtc-rows{display:flex;flex-direction:column;gap:3px}
.bbtc-row{display:grid;grid-template-columns:20px 1fr auto;gap:8px;align-items:center;font-family:var(--font-mono);font-size:10px;letter-spacing:.6px;padding:4px 6px;border:1px solid transparent;border-radius:3px;color:var(--tc-dim);background:rgba(255,255,255,.02)}
.bbtc-row.is-good{color:var(--tc-green);border-color:rgba(74,222,128,.28)}
.bbtc-row.is-near{color:var(--tc-gold);border-color:rgba(240,198,116,.24)}
.bbtc-row.is-bad{color:var(--tc-red);border-color:rgba(248,113,113,.3)}
.bbtc-row.is-locked{opacity:.32}
.bbtc-row i{font-style:normal;font-size:12px;line-height:1}

.bbtc-verdict{margin-top:12px;padding:9px 10px;border-radius:4px;border:1px solid var(--tc-line);font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;text-align:center;color:var(--tc-dim)}
.bbtc-verdict.is-won{color:var(--tc-green);border-color:rgba(74,222,128,.4);background:rgba(74,222,128,.07)}
.bbtc-verdict.is-lost{color:var(--tc-red);border-color:rgba(248,113,113,.4);background:rgba(248,113,113,.07)}

.bbtc-stagecard{animation:bbtc-snap .34s cubic-bezier(.2,1.3,.4,1) both}
.bbtc-stagecard.is-near{animation:bbtc-tilt .42s cubic-bezier(.2,1.1,.4,1) both}
.bbtc-stagecard.is-bad{animation:bbtc-drop .3s cubic-bezier(.4,.1,.7,1) both}
@keyframes bbtc-snap{from{opacity:0;transform:translateY(6px) scale(.99)}to{opacity:1;transform:none}}
@keyframes bbtc-tilt{from{opacity:0;transform:translateX(-10px) rotate(-.6deg)}to{opacity:1;transform:none}}
@keyframes bbtc-drop{from{opacity:0;transform:translateY(-12px)}60%{transform:translateY(3px)}to{opacity:1;transform:none}}
.bbtc-amb{font-family:var(--font-mono);font-size:9px;letter-spacing:1.6px;color:var(--tc-dim);text-transform:uppercase;text-align:center;margin:10px 0 2px;opacity:.7}
.bbtc-run{font-family:var(--font-mono);font-size:9.5px;letter-spacing:1.3px;color:#8b83b8}
@media(prefers-reduced-motion:reduce){.bbtc-dust,.bbtc-stagecard,.bbtc-stagecard.is-near,.bbtc-stagecard.is-bad{animation:none}.bbtc-fill{transition:none}}
`;

/** Announcer lines between stages. */
const AMBIENT = [
  'ARCHIVE SEALED · NO FEED · NO COMMENT',
  'THE HOUSE CAN HEAR THE DOOR AND NOTHING ELSE',
  'CLOCK RUNNING',
  'EVERY SEASON IN HERE ENDED WITH SOMEBODY HOLDING SOMETHING',
  'NO SECOND ATTEMPT · NO SECOND VOTE',
  'THE ROOM DOES NOT CARE WHO AMERICA LIKES',
];

/** The vault, drawn deep so the run has somewhere to happen. */
function _vault(favourite, phase, esc) {
  const glow = phase === 'won' ? '#4ade80' : phase === 'lost' ? '#f87171'
    : phase === 'running' ? '#f0c674' : '#6d5bb0';
  const boxes = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      const lit = (row * 7 + col) % 5 === 0;
      boxes.push(`<rect x="${26 + col * 32}" y="${30 + row * 21}" width="26" height="17" rx="2"
        fill="${lit ? 'rgba(240,198,116,.13)' : 'rgba(255,255,255,.03)'}"
        stroke="#3b3260" stroke-width=".9"/>`);
    }
  }
  return `<svg class="bbtc-vault" viewBox="0 0 300 210" role="img"
      aria-label="The capsule archive, with ${esc(favourite)} inside it">
    <defs>
      <linearGradient id="bbtcFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1b1636"/><stop offset="1" stop-color="#0b0819"/>
      </linearGradient>
      <radialGradient id="bbtcGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="${glow}" stop-opacity=".45"/>
        <stop offset="1" stop-color="${glow}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="300" height="210" fill="url(#bbtcFloor)"/>
    ${boxes.join('')}
    <path d="M8 126 L292 126 L266 202 L34 202z" fill="rgba(255,255,255,.025)" stroke="#3b3260" stroke-width="1"/>
    <path d="M80 126 L64 202 M150 126 L150 202 M220 126 L236 202" stroke="#3b3260" stroke-width=".8" opacity=".55"/>
    <ellipse cx="150" cy="174" rx="64" ry="19" fill="url(#bbtcGlow)"/>
    <g transform="translate(150 150)">
      <circle cx="0" cy="-18" r="7.5" fill="#0b0819" stroke="${glow}" stroke-width="1.6"/>
      <path d="M-9 -8 q9 -5 18 0 l3 26 h-24z" fill="#0b0819" stroke="${glow}" stroke-width="1.6"/>
    </g>
    <text x="150" y="196" text-anchor="middle"
      style="font-family:var(--font-mono);font-size:9px;letter-spacing:2px;fill:${glow}">${esc(favourite)}</text>
    <rect x="6" y="6" width="288" height="198" rx="6" fill="none" stroke="#3b3260" stroke-width="1.6"/>
    <circle cx="20" cy="19" r="4" fill="${glow}"/>
  </svg>`;
}

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `time-capsule` act
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBTimeCapsule(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'tc');
  const state = _init(stateKey);

  const chal = act.challenge || null;
  const stages = act.stages || [];
  // The engine's beats minus the two the screen now tells better: the briefing
  // (the log's job) and the per-stage lines (the stage cards themselves).
  const beats = (act.beats || []).filter(b =>
    b.badgeText !== 'WHAT IS IN THE ROOM' && !/^STAGE \d+ OF/.test(b.badgeText || ''));

  const steps = [{ kind: 'brief' }, ...stages.map(st => ({ kind: 'stage', st })),
    ...beats.map(b => ({ kind: 'beat', b })), { kind: 'cost' }];
  const total = steps.length;

  // How many stages the viewer has been shown, which gates the whole log.
  const shown = steps.slice(0, Math.max(0, state.idx + 1)).filter(s => s.kind === 'stage').length;
  const running = stages.slice(0, shown).reduce((sum, st) => sum + st.score, 0);
  const finished = stages.length > 0 && shown >= stages.length;
  const phase = state.idx < 0 ? 'sealed' : finished ? (act.won ? 'won' : 'lost') : 'running';

  const target = act.target || chal?.target || 1;
  // The target sits at 78% of the bar so a run that beats it has somewhere to
  // go — the difference between a meter and a countdown.
  const pct = Math.max(0, Math.min(100, (running / target) * 78));

  const mix = chal ? CAP_STATS[chal.id] : null;
  const statChips = mix
    ? Object.entries(mix).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `<span class="bbtc-stat">${esc(k)} ${Math.round(v * 100)}%</span>`).join('')
    : '';

  const rows = stages.map((st, i) => {
    const locked = i >= shown;
    const mark = locked ? '·' : st.grade === 'good' ? '&#10003;' : st.grade === 'near' ? '~' : '&#10007;';
    return `<div class="bbtc-row ${locked ? 'is-locked' : `is-${st.grade}`}">
      <i>${mark}</i>
      <span>${locked ? 'SEALED' : `STAGE ${st.index}`}</span>
      <span>${locked ? '&mdash;' : st.score.toFixed(1)}</span>
    </div>`;
  }).join('');

  const verdict = !finished
    ? `<div class="bbtc-verdict">${shown ? `${shown} of ${stages.length} logged` : 'Run not started'}</div>`
    : `<div class="bbtc-verdict ${act.won ? 'is-won' : 'is-lost'}">${
      act.won ? `Beaten by ${Math.abs(act.margin || 0).toFixed(1)}`
        : `Short by ${Math.abs(act.margin || 0).toFixed(1)}`}</div>`;

  const LOG = `<div class="bbtc-log">
    <div class="bbtc-logh"><span>Capsule log</span><span>WK ${ep.num}</span></div>
    ${chal ? `<div class="bbtc-chal">${esc(chal.name)}</div>` : ''}
    ${chal && state.idx >= 0 ? `<div class="bbtc-desc">${esc(chal.desc)}</div>` : ''}
    ${state.idx >= 0 && statChips ? `<div class="bbtc-mix">${statChips}</div>` : ''}
    <div class="bbtc-meter">
      <div class="bbtc-nums"><span>Total <b>${running.toFixed(1)}</b></span><span>Target <b>${Number(target).toFixed(1)}</b></span></div>
      <div class="bbtc-bar">
        <div class="bbtc-fill ${running >= target ? 'is-over' : ''}" style="width:${pct}%"></div>
        <div class="bbtc-mark" style="left:78%"></div>
      </div>
    </div>
    <div class="bbtc-rows">${rows}</div>
    ${verdict}
  </div>`;

  const STAGE = `<div class="bbtc-wrap">
    <div class="bbtc-dust"></div>
    <div class="bbtc-grid">
      <div class="bbtc-room">${_vault(act.favourite || '', phase, esc)}</div>
      ${LOG}
    </div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'brief') {
      return _card('THE VOTE IS NOT A GIFT',
        `The audience votes one houseguest in, and that is where the generosity stops. Whoever they choose
         goes through that door alone, and the room decides what they come back out with.
         ${chal ? `<br><br>Tonight it is <b>${esc(chal.name)}</b>, and the rules are on the log.` : ''}`,
        'gold', '', [act.favourite]);
    }
    if (step.kind === 'stage') {
      const st = step.st;
      const amb = AMBIENT[(st.index + (ep.num || 0)) % AMBIENT.length];
      const run = stages.slice(0, st.index).reduce((s, x) => s + x.score, 0);
      return `${st.index > 1 ? `<div class="bbtc-amb">${amb}</div>` : ''}
        <div class="bbtc-stagecard is-${st.grade}">${_card(
    `STAGE ${st.index} OF ${chal ? chal.stages : stages.length}`,
    `${esc(st.text)}<br><span class="bbtc-run">+ ${st.score.toFixed(1)} &nbsp;·&nbsp; RUNNING ${
      run.toFixed(1)} OF ${Number(target).toFixed(1)}</span>`,
    st.grade === 'good' ? 'gold' : st.grade === 'near' ? 'blue' : 'red')}</div>`;
    }
    if (step.kind === 'beat') return _beatCard(step.b);
    if (act.won) {
      return _card('WHAT THE HOUSE KNOWS',
        `${esc(act.favourite)} beat it, and is holding ${esc(act.power || 'something')}.
         <br><br>You know that. The house does not. All they were told is that somebody the country likes
         went into a room and came out of it better off, which is enough to start counting — and not
         nearly enough to act on.`, 'gold', 'is-final', [act.favourite]);
    }
    return _card('WHAT IT ACTUALLY COSTS',
      `${esc(act.favourite)} is ${esc(act.punishmentVerb || 'wearing')} ${esc(act.punishment || 'a costume')} for the week.
       <br><br>This is not scenery. It comes off every pitch they make until it comes off them — every
       attempt to recruit a vote, every campaign from the block — so the week the country picked them as
       its favourite is also the week they are least able to play.
       ${act.tetheredTo ? `<br><br>${esc(act.tetheredTo)} is attached to them throughout, and never did
         anything to deserve it.` : ''}`,
      'red', 'is-final', [act.favourite, act.tetheredTo]);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbtc', css: TC_CSS,
    title: 'THE BB TIME CAPSULE',
    sub: 'America picks who goes in · the room decides what comes out',
    stage: STAGE,
    cards: steps.map(card).join(''),
    firstLabel: 'Open the capsule',
  });
}
