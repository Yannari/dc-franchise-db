// ══════════════════════════════════════════════════════════════════════
// vp-bb-audience-vote.js — the lines are closed and nobody in there knows
// ══════════════════════════════════════════════════════════════════════
//
// The result of a public vote is the only moment in this format where the
// people it happens to have no information at all. They cannot count it, they
// cannot campaign to it, and they find out at the same instant as everybody
// watching. That is a live-broadcast beat and it deserves to be built like one
// rather than printed like a line of admin.
//
// So the screen IS the vote board: a studio wall of bars that stay dark until
// the host reads them, filling one at a time from the lowest share upward,
// with the name that matters last. Everything is gated on the reveal counter,
// so a viewer clicking through gets the result at the speed the room got it.
//
// Written against `buildAudienceReveal` in bb/audience-reveal.js, which is
// show-agnostic and verb-agnostic on purpose — an audience voting to SAVE in
// another format is the same broadcast beat pointed the other way, and should
// reuse this screen rather than growing a second one.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const AV_CSS = `
.bbav-title{font-family:var(--font-display);font-size:26px;letter-spacing:3px;text-align:center;
  color:#fca5a5;text-shadow:0 0 22px rgba(252,165,165,.3);margin-bottom:4px}
.bbav-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}

/* THE STUDIO. Hot key light from above, everything else black. */
.bbav-studio{position:relative;max-width:660px;margin:0 auto 20px;padding:18px 16px 16px;
  border-radius:12px;overflow:hidden;
  background:radial-gradient(130% 90% at 50% -14%,rgba(239,68,68,.16),rgba(6,6,10,.985) 62%);
  border:1px solid rgba(239,68,68,.26);box-shadow:inset 0 0 80px rgba(0,0,0,.85)}

/* the LIVE strap */
.bbav-strap{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:14px}
.bbav-live{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono,ui-monospace,monospace);
  font-size:9px;letter-spacing:2px;color:#fff;background:#dc2626;padding:2px 7px;border-radius:2px}
.bbav-dot{width:5px;height:5px;border-radius:50%;background:#fff;animation:bbav-pulse 1.4s infinite}
@keyframes bbav-pulse{0%,100%{opacity:1}50%{opacity:.25}}
.bbav-lines{font-family:var(--font-mono,monospace);font-size:9px;letter-spacing:1.6px;color:#94a3b8}

/* THE BOARD. One row per name; the bar is the whole story. */
.bbav-board{display:flex;flex-direction:column;gap:9px;position:relative;z-index:1}
.bbav-row{display:grid;grid-template-columns:38px 1fr 62px;align-items:center;gap:10px}
.bbav-face{width:38px;height:38px;border-radius:4px;overflow:hidden;border:1px solid rgba(148,163,184,.4);
  background:#0b0e14;filter:grayscale(.7)}
.bbav-face img,.bbav-face .bb-av,.bbav-face .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbav-row.is-in .bbav-face{filter:none;border-color:rgba(252,165,165,.7)}
.bbav-track{position:relative;height:26px;border-radius:3px;background:rgba(148,163,184,.10);
  border:1px solid rgba(148,163,184,.16);overflow:hidden}
.bbav-fill{position:absolute;inset:0 auto 0 0;width:0;border-radius:2px;
  background:linear-gradient(90deg,rgba(239,68,68,.55),rgba(248,113,113,.95));
  transition:width 1.1s cubic-bezier(.16,.8,.3,1)}
.bbav-row.is-in .bbav-fill{width:var(--w)}
.bbav-nm{position:absolute;left:9px;top:50%;transform:translateY(-50%);font-size:11.5px;
  color:#e6edf3;font-weight:600;letter-spacing:.4px;text-shadow:0 1px 3px rgba(0,0,0,.8);z-index:1}
.bbav-pct{font-family:var(--font-mono,ui-monospace,monospace);font-size:13px;text-align:right;
  color:#64748b;letter-spacing:.5px}
.bbav-row.is-in .bbav-pct{color:#fca5a5}
.bbav-row.is-top.is-in .bbav-track{box-shadow:0 0 24px -4px rgba(239,68,68,.95)}
.bbav-row.is-top.is-in .bbav-pct{color:#fff;font-size:15px}

/* the shape of the night, stated once the numbers are all out */
.bbav-shape{text-align:center;font-family:var(--font-mono,monospace);font-size:9px;
  letter-spacing:2.2px;color:#f87171;margin-top:14px;min-height:12px}
.bbav-weight{text-align:center;font-size:9px;letter-spacing:1.4px;color:#64748b;margin-top:6px}
@media(prefers-reduced-motion:reduce){.bbav-dot{animation:none}.bbav-fill{transition:none}}
`;

const SHAPE_LABEL = {
  landslide: 'A LANDSLIDE',
  clear: 'A CLEAR RESULT',
  close: 'CLOSER THAN ANYBODY WANTED',
  'knife-edge': 'DECIDED BY ALMOST NOTHING',
  unopposed: 'UNOPPOSED',
};

/**
 * @param {object} ep   the episode view
 * @param {object} act  an act carrying a buildAudienceReveal board
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 * @param {object} [opts] {title, sub, question}
 */
export function rpBuildBBAudienceVote(ep, act, deps, opts = {}) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'avote');
  const state = _init(stateKey);
  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');

  const reveal = act.reveal || [...(act.tally || [])].sort((a, b) => a.share - b.share);
  // ── A TWO-HORSE RACE IS NOT REVEALED IN ORDER ──
  //
  // With three or more names, going upward is the whole trick: the total
  // closes and the room still does not know. With exactly two it is the
  // opposite — the first number IS the answer, because the other one is a
  // hundred minus it. So a two-way vote holds both bars back and drops them
  // together on the name, which is how it is actually staged.
  const twoWay = reveal.length <= 2;
  const barSteps = twoWay ? [] : reveal.slice(0, -1).map(r => ({ kind: 'bar', r }));
  const steps = [
    { kind: 'closed' },
    { kind: 'address' },
    { kind: 'tease' },
    ...barSteps,
    { kind: 'name' },
    { kind: 'result' },
  ];
  const total = steps.length;
  const barsAt = 3;
  // The losing bars fill as they are read; the winner's lands on the name.
  const named = state.idx >= barsAt + barSteps.length;
  const shown = named ? reveal.length
    : Math.max(0, Math.min(reveal.length - 1, state.idx - barsAt + 1));
  const allOut = named;

  const BOARD = `<div class="bbav-studio">
    <div class="bbav-strap">
      <span class="bbav-live"><span class="bbav-dot"></span>LIVE</span>
      <span class="bbav-lines">${state.idx < 0 ? 'VOTING OPEN' : 'LINES CLOSED'}</span>
    </div>
    <div class="bbav-board">${reveal.map((r, i) => {
    const isIn = i < shown;
    const isTop = r.name === act.target;
    return `<div class="bbav-row ${isIn ? 'is-in' : ''} ${isTop ? 'is-top' : ''}"
        style="--w:${Math.max(3, Math.min(100, r.share || 0))}%">
        <div class="bbav-face">${isIn ? AV(r.name, 38) : ''}</div>
        <div class="bbav-track">
          <span class="bbav-nm">${isIn ? esc(r.name) : '&nbsp;'}</span>
          <span class="bbav-fill"></span>
        </div>
        <div class="bbav-pct">${isIn ? `${r.share}%` : '—'}</div>
      </div>`;
  }).join('')}</div>
    <div class="bbav-shape">${allOut ? (SHAPE_LABEL[act.shape] || '') : ''}</div>
    ${allOut && act.weight > 1
    ? `<div class="bbav-weight">THIS VOTE IS WORTH ${act.weight} BALLOTS IN THE TALLY</div>` : ''}
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'closed') {
      return _card('LINES CLOSED', esc(act.closing || 'The lines are now closed.'), 'red');
    }
    if (step.kind === 'address') {
      return _card('WHAT THEY WERE ASKED',
        `${esc(act.address || '')}<br><br>Nobody in that room has been able to campaign for a single
         one of these votes. They cannot count them, they cannot talk anybody round, and they find
         out at the same moment you do.`, 'gold');
    }
    if (step.kind === 'tease') {
      return _card('BEFORE I READ IT', esc(act.tease || ''), 'grey');
    }
    if (step.kind === 'bar') {
      return _card('THE VOTE', `${esc(step.r.name)} — ${step.r.share}%.`,
        'grey', '', [step.r.name]);
    }
    if (step.kind === 'name') {
      const hit = reveal.find(r => r.name === act.target);
      return _card('AND THE NAME',
        esc(act.resultLine || `${act.target} — ${hit ? hit.share : 0}%.`),
        'red', 'is-final', [act.target]);
    }
    return _card('IN THE TALLY',
      `${esc(act.target)}'s name goes in with the houseguests' ballots${act.weight > 1
        ? `, and it goes in ${act.weight} times` : ''}.
       <br><br>Not one person in that house had a say in it, and not one of them can do anything
       about it now.`, 'red', 'is-final', [act.target]);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbav', css: AV_CSS,
    title: opts.title || 'THE PUBLIC VOTE',
    sub: opts.sub || 'Cast by people the house cannot campaign to.',
    stage: BOARD,
    cards: steps.map(card).join(''),
    firstLabel: 'Close the lines',
  });
}
