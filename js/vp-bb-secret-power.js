// ══════════════════════════════════════════════════════════════════════
// vp-bb-secret-power.js — the competition that was secretly three
// ══════════════════════════════════════════════════════════════════════
//
// Built to mockup-secret-power.html, which is the visual target and stays in
// the repo for exactly that reason.
//
// THE IDEA. The yard is not what it looks like. Three of the things out there
// are not the Head of Household, and every houseguest already decided in
// private which one they were playing for. So this is a SURVEILLANCE BOARD and
// not a scoreboard:
//
//   left    the result the house watched, looking completely ordinary — with a
//           line struck through every name that was never running for the
//           crown. That strike is the twist in one visual: the best afternoon
//           in the yard, and not the Head of Household.
//   right   what was actually on the line, as filed routing slips, each
//           stamped VOID WHEN THE JURY OPENS — because that expiry is the
//           reason the powers are allowed to be this strong.
//   under   who knows, who only suspects, and how thin the difference is.
//
// Nothing is borrowed from the Whacktivity screen. That one is three lit rooms
// somebody walks into; this is one competition wearing a disguise, so its
// language is paperwork, punch holes and closed doors.
//
// Deliberately lighter than the first mockup: the paper carries the reveal and
// a board this dark buried it.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const SP_CSS = `
.bbsp-title{font-family:var(--font-display);font-size:clamp(23px,4.2vw,36px);letter-spacing:2px;text-align:center;color:#f0e9dc;text-shadow:0 0 20px rgba(212,165,55,.28);margin:0 0 3px;line-height:1.05}
.bbsp-sub{font-family:var(--font-mono);text-align:center;font-size:9.5px;letter-spacing:2.2px;color:#a3946f;text-transform:uppercase;margin-bottom:16px}

/* The board is being watched. One scan line, and it is the only motion here —
   the rest of the screen is paper, which does not move. */
.bbsp-stage{position:relative;max-width:940px;margin:0 auto 20px;border:1px solid rgba(240,233,220,.16);border-radius:4px;overflow:hidden;
  background:repeating-linear-gradient(90deg,rgba(255,255,255,.022) 0 2px,transparent 2px 5px),radial-gradient(120% 140% at 50% -20%,#241f18 0%,#141210 72%)}
.bbsp-stage::after{content:'';position:absolute;left:0;right:0;height:2px;top:0;background:linear-gradient(90deg,transparent,rgba(212,165,55,.5),transparent);animation:bbspScan 6s linear infinite}
@keyframes bbspScan{0%{top:0}100%{top:100%}}
@media(prefers-reduced-motion:reduce){.bbsp-stage::after{animation:none}}

.bbsp-split{display:grid;grid-template-columns:1fr 1fr;gap:0}
@media(max-width:760px){.bbsp-split{grid-template-columns:1fr}}
.bbsp-col{padding:14px 16px 16px}
.bbsp-col + .bbsp-col{border-left:1px solid rgba(240,233,220,.13)}
@media(max-width:760px){.bbsp-col + .bbsp-col{border-left:0;border-top:1px solid rgba(240,233,220,.13)}}
.bbsp-h{font-family:var(--font-mono);font-size:9px;letter-spacing:2.4px;text-transform:uppercase;color:#8b8271;margin-bottom:10px}

/* ── the public board ── */
.bbsp-row{display:grid;grid-template-columns:22px 22px minmax(0,1fr) 46px;gap:9px;align-items:center;padding:7px 0;border-bottom:1px dashed rgba(240,233,220,.1)}
.bbsp-row:last-child{border-bottom:0}
.bbsp-pos{font-family:var(--font-mono);font-size:11px;color:#8b8271;text-align:right}
.bbsp-who{font-size:14.5px;color:#f0e9dc;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.bbsp-score{font-family:var(--font-mono);font-size:11.5px;color:#8b8271;text-align:right}
.bbsp-row.is-crown .bbsp-who,.bbsp-row.is-crown .bbsp-pos{color:#e8b866}
/* Never running for it. The strike IS the twist — but it belongs on the NAME
   and not on the row: put on the flex container it also struck the tag, the
   score and the badge, which reads as a rendering fault rather than as a point
   being made. */
.bbsp-row.is-elsewhere .bbsp-nm{color:#8b8271;text-decoration:line-through;text-decoration-thickness:1px}
.bbsp-nm{white-space:nowrap;margin-right:2px}
.bbsp-tag{font-family:var(--font-mono);font-size:8px;letter-spacing:1.4px;text-transform:uppercase;border:1px solid currentColor;border-radius:2px;padding:2px 5px}
.bbsp-tag.gold{color:#e8b866}.bbsp-tag.red{color:#d4705c}.bbsp-tag.blue{color:#7fb0cc}

/* ── the doors, as filed documents ── */
.bbsp-doors{display:grid;gap:11px}
.bbsp-door{position:relative;background:#ece5d6;color:#2a2620;border-radius:2px;padding:12px 14px 13px 26px;box-shadow:0 9px 22px rgba(0,0,0,.42);transform:rotate(-.3deg)}
.bbsp-door:nth-child(2){transform:rotate(.32deg)}
.bbsp-door:nth-child(3){transform:rotate(-.12deg)}
/* Punch holes: a filed document, not a playing card. */
.bbsp-door::before{content:'';position:absolute;left:8px;top:13px;bottom:13px;width:7px;
  background:radial-gradient(circle at 50% 9px,#141210 3px,transparent 3.4px),radial-gradient(circle at 50% calc(100% - 9px),#141210 3px,transparent 3.4px)}
.bbsp-no{font-family:var(--font-mono);font-size:8.5px;letter-spacing:2.4px;text-transform:uppercase;color:#7a7263}
.bbsp-dname{font-size:17px;margin:4px 0 6px;letter-spacing:-.01em;font-weight:600}
.bbsp-took{font-size:13px;line-height:1.45}
.bbsp-took b{font-weight:700}
.bbsp-entered{margin-top:6px;font-size:11.5px;color:#7a7263;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.bbsp-door.is-sealed{background:rgba(240,233,220,.03);color:#6d6559;box-shadow:none;border:1px dashed rgba(240,233,220,.16);padding-left:14px;min-height:44px}
.bbsp-door.is-sealed::before{background:none}
.bbsp-door.is-sealed .bbsp-dname{color:#6d6559;font-size:14px;margin:2px 0 0}
.bbsp-door.is-unclaimed{background:rgba(240,233,220,.045);color:#8b8271;box-shadow:none;border:1px dashed rgba(240,233,220,.2);padding-left:14px}
.bbsp-door.is-unclaimed::before{background:none}
.bbsp-door.is-unclaimed .bbsp-dname{color:#8b8271}
/* Every power here dies when the jury opens. It belongs ON the document. */
.bbsp-stamp{position:absolute;right:10px;bottom:9px;transform:rotate(-9deg);border:2px solid rgba(196,86,64,.6);color:rgba(160,64,46,.85);border-radius:2px;font-family:var(--font-mono);font-size:7.5px;line-height:1.15;letter-spacing:1px;text-transform:uppercase;padding:3px 6px;text-align:center}

/* ── who knows ── */
.bbsp-knows{padding:12px 16px 15px;border-top:1px solid rgba(240,233,220,.13)}
.bbsp-kgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:7px}
.bbsp-hg{border:1px solid rgba(240,233,220,.14);border-radius:2px;padding:6px 9px;display:flex;align-items:center;gap:7px;font-size:12.5px;color:#c9c1b2}
.bbsp-dot{width:7px;height:7px;border-radius:50%;background:#4a4238;flex:none}
.bbsp-hg.is-holder{color:#e8b866;border-color:rgba(232,184,102,.42)}
.bbsp-hg.is-holder .bbsp-dot{background:#e8b866;box-shadow:0 0 0 3px rgba(232,184,102,.15)}
.bbsp-hg.is-suspect{color:#7fb0cc}
.bbsp-hg.is-suspect .bbsp-dot{background:#7fb0cc}
.bbsp-hg small{margin-left:auto;font-family:var(--font-mono);font-size:7.5px;letter-spacing:1.2px;text-transform:uppercase;opacity:.8}
/* Faces, small, because the board is a document and they are the filing. */
.bbsp-face img,.bbsp-face .rp-face{width:22px;height:22px;border-radius:50%}
`;

/**
 * The screen.
 *
 * Revealed in three steps and in this order on purpose: the board first, so
 * the result looks ordinary; then the beats, which say what people did; then
 * the doors and the knowledge, which explain what the board was hiding. Doing
 * the doors before the beats told the audience the answer and then narrated
 * towards it.
 */
export function rpBuildBBSecretPowerComp(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'spc');
  const state = _init(stateKey);
  const beats = act.beats || [];
  const steps = [{ kind: 'board' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'doors' }];
  const total = steps.length;
  const opened = state.idx >= total - 1;

  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');
  const face = n => `<span class="bbsp-face">${AV(n, 22)}</span>`;

  // ── which doors are open YET ──
  //
  // The whole right-hand column used to appear at once, on the last card, so
  // there was nothing to watch: reveal, reveal, reveal, and then the answer
  // arrives in one block. Each door beat carries the door it belongs to, so a
  // door opens on its own card and the board fills in as you go.
  const openDoors = new Set();
  for (let i = 0; i <= state.idx && i < steps.length; i++) {
    const st = steps[i];
    if (st.kind === 'beat' && st.b?.door) openDoors.add(st.b.door);
  }

  const chasing = new Map((act.chased || []).map(c => [c.name, c.power]));
  const holders = new Set((act.granted || []).map(g => g.name));
  const results = act.results || [];

  // ── the board the house watched ──
  //
  // Only drawn once the first step is revealed, so the screen opens on a
  // competition rather than on its answer.
  const board = (state.idx < 0 ? '' : results.map((r, i) => {
    const name = r?.name || r;
    const elsewhere = chasing.has(name);
    const crown = name === act.winner;
    // The strike is only honest AFTER the doors open — before that, the
    // audience is looking at what the house looked at.
    // A name is struck the moment the door it walked to has opened — so the
    // left column answers the right one card at a time instead of both
    // resolving together at the end.
    const shown = elsewhere ? openDoors.has(chasing.get(name)) : opened;
    const cls = !shown ? '' : crown ? 'is-crown' : elsewhere ? 'is-elsewhere' : '';
    const tag = !shown ? ''
      : crown ? '<span class="bbsp-tag gold">HOH</span>'
        : name === act.outgoingHoh ? '<span class="bbsp-tag blue">barred</span>'
          : elsewhere ? '<span class="bbsp-tag red">not running</span>' : '';
    return `<div class="bbsp-row ${cls}">
      ${face(name)}
      <span class="bbsp-pos">${i + 1}</span>
      <span class="bbsp-who"><span class="bbsp-nm">${esc(name)}</span>${tag}</span>
      <span class="bbsp-score">${r?.score != null ? esc(String(Math.round(r.score))) : ''}</span>
    </div>`;
  }).join('')) || '<div class="bbsp-h">The yard has not run yet.</div>';

  // ── what was actually on the line ──
  const doors = (act.rooms || []).map((room, i) => {
    const no = ['Door One', 'Door Two', 'Door Three'][i] || `Door ${i + 1}`;
    if (!openDoors.has(room.power)) {
      return `<div class="bbsp-door is-sealed">
        <div class="bbsp-no">${esc(no)}</div>
        <div class="bbsp-dname">Sealed</div>
      </div>`;
    }
    return (() => {
      if (!room.winner) {
        return `<div class="bbsp-door is-unclaimed">
          <div class="bbsp-no">${esc(no)}</div>
          <div class="bbsp-dname">${esc(room.name)}</div>
          <div class="bbsp-took">Nobody went for it. It goes back in the box, and this house
            will finish the season without ever knowing it was out there.</div>
        </div>`;
      }
      const others = (room.entrants || []).filter(n => n !== room.winner);
      // Three doors on one night, so one sentence printed three times with the
      // name swapped. Varied by position, and the second line carries the fact
      // that actually differs: who else was standing there.
      const took = [
        `<b>${esc(room.winner)}</b> has it, and nobody watched them get it.`,
        `Opened by <b>${esc(room.winner)}</b>, alone, and closed again.`,
        `<b>${esc(room.winner)}</b> walks out with it and says nothing to anybody.`,
      ][i % 3];
      return `<div class="bbsp-door">
        <div class="bbsp-no">${esc(no)}</div>
        <div class="bbsp-dname">${esc(room.name)}</div>
        <div class="bbsp-took">${took}</div>
        <div class="bbsp-entered">${face(room.winner)}${
  others.length ? `${others.map(face).join('')} beaten here by ${esc(others.join(', '))}`
    : 'Nobody else chose this one.'}</div>
        <div class="bbsp-stamp">Void when<br>the jury opens</div>
      </div>`;
    })();
  }).join('');

  // ── who knows ──
  //
  // The holders, then anybody who saw which door somebody walked to. Seeing is
  // not knowing, and the copy has to keep saying so — a suspicion spreads,
  // decays and can be wrong, which is what makes the secret worth holding.
  const suspects = new Map();
  for (const [name, power] of chasing) {
    if (holders.has(name)) continue;
    suspects.set(name, power);
  }
  const knows = !opened ? '' : `<div class="bbsp-knows">
    <div class="bbsp-h">Who knows</div>
    <div class="bbsp-kgrid">
      ${(act.house || []).map(n => {
    const holder = holders.has(n);
    const saw = !holder && suspects.has(n);
    return `<div class="bbsp-hg ${holder ? 'is-holder' : saw ? 'is-suspect' : ''}">
        <span class="bbsp-dot"></span>${esc(n)}${
  holder ? '<small>Holds</small>' : saw ? '<small>Walked a door</small>' : ''}</div>`;
  }).join('')}
    </div>
  </div>`;

  const stage = `<div class="bbsp-stage">
    <div class="bbsp-split">
      <div class="bbsp-col"><div class="bbsp-h">What the house watched</div>${board}</div>
      <div class="bbsp-col"><div class="bbsp-h">What was actually on the line</div>
        <div class="bbsp-doors">${doors}</div></div>
    </div>
    ${knows}
  </div>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return _hidden();
    if (s.kind === 'beat') return _beatCard(s.b);
    if (s.kind === 'board') {
      return _card('THE YARD', 'Three of the things out here are not the Head of Household, and '
        + 'every houseguest has already decided in private which one they are actually playing for.',
      'gold', '', (act.house || []).slice(0, 4));
    }
    return _card('AND NOBODY IS TOLD', 'Every power won tonight was won in private and expires the '
      + 'moment the jury opens. The house is told that competitions happened and nothing else.',
    'blue', '', (act.granted || []).map(g => g.name));
  }).join('');

  return _shell({
    ep, stateKey, total, cls: 'bbsp', css: SP_CSS,
    title: 'The Secret Power Competition',
    sub: 'One competition · three of them playing for something else',
    stage, cards, firstLabel: 'Open the yard',
  });
}
