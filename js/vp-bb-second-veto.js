// ══════════════════════════════════════════════════════════════════════
// vp-bb-second-veto.js — the meeting that would not stay finished
// ══════════════════════════════════════════════════════════════════════
//
// The first version of this screen was two cards and a swap arrow, and it was
// boring for a reason no amount of styling would have fixed: the act carried
// no beats, so there was nothing between the briefing and the result. The
// engine writes the middle now, and this is built around what that middle
// actually is.
//
// The scene is not "a veto gets used". It is a ceremony that had ALREADY
// ENDED, ending again. Everybody has stood up. The block is settled, the week
// has a shape, and then one person does not move — and the room has to sit
// back down and watch the whole thing happen a second time.
//
// So the screen is a MEETING ROOM that resets. The block sits in two chairs at
// the top, stamped ADJOURNED and greyed out; when the second medallion comes
// out the stamp tears off, the chairs go live again, and the seat that changes
// physically swaps while the room watches. The seal at the centre is the
// second medallion, dark until it is used and then lit — one object, held all
// week, that nobody knew was in the room.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const SV_CSS = `
.bbsv{--sv-ink:#efe9dc;--sv-dim:#8f8676;--sv-line:#403929;--sv-gold:#d8b24a;--sv-red:#c9503c;--sv-dead:#4a4437}
.bbsv-title{font-family:var(--font-display);font-size:clamp(25px,4.6vw,44px);letter-spacing:3px;text-align:center;color:var(--sv-ink);margin:0 0 2px;line-height:1}
.bbsv-sub{font-family:var(--font-mono);text-align:center;font-size:9px;letter-spacing:2.8px;color:var(--sv-dim);text-transform:uppercase;margin-bottom:16px}

/* ── the room ── */
.bbsv-room{position:relative;max-width:940px;margin:0 auto 20px;border:1px solid var(--sv-line);border-radius:3px;overflow:hidden;
  background:radial-gradient(130% 100% at 50% -10%,#2b2418 0%,#1a1610 48%,#0c0a07 100%)}
.bbsv-room::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(70% 55% at 50% 42%,transparent 0%,rgba(0,0,0,.55) 100%)}
.bbsv-band{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;border-bottom:1px solid var(--sv-line);
  background:rgba(216,178,74,.09);font-family:var(--font-mono);font-size:8.5px;letter-spacing:2.4px;color:#e8cf8d;text-transform:uppercase}
.bbsv-body{position:relative;padding:16px 14px 18px;z-index:2}

/* ── the block, before and after ── */
.bbsv-block{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:520px;margin:0 auto 14px}
@media(max-width:520px){.bbsv-block{grid-template-columns:1fr}}
.bbsv-chair{position:relative;display:flex;align-items:center;gap:9px;padding:9px 11px;border:1px solid var(--sv-line);
  background:rgba(255,255,255,.02);transition:border-color .5s ease,background .5s ease,opacity .5s ease}
.bbsv-chair .bb-av{border:1px solid rgba(239,233,220,.2);filter:grayscale(.65)}
.bbsv-chair span{font-family:var(--font-mono);font-size:10.5px;color:var(--sv-dim);letter-spacing:.6px}
.bbsv-chair em{display:block;font-style:normal;font-size:7px;letter-spacing:1.4px;color:var(--sv-dead);text-transform:uppercase;margin-top:2px}
/* Live again: the meeting reopened. */
.bbsv-room.is-live .bbsv-chair{background:rgba(255,255,255,.035);border-color:#5a4f38}
.bbsv-room.is-live .bbsv-chair span{color:var(--sv-ink)}
.bbsv-room.is-live .bbsv-chair .bb-av{filter:none}
.bbsv-chair.is-new{border-color:#7d3a2e;background:rgba(201,80,60,.1)}
.bbsv-chair.is-new span{color:#f0b6a8}
.bbsv-chair.is-gone{opacity:.28;text-decoration:line-through}

/* ── ADJOURNED, and the tearing of it ── */
.bbsv-stamp{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-9deg);
  font-family:var(--font-display);font-size:clamp(22px,5vw,42px);letter-spacing:6px;color:var(--sv-dead);
  border:4px solid currentColor;padding:3px 16px;pointer-events:none;z-index:3;white-space:nowrap}
.bbsv-room.is-live .bbsv-stamp{color:var(--sv-red);border-color:var(--sv-red);opacity:.22}
@media(prefers-reduced-motion:reduce){.bbsv-stamp{transform:translate(-50%,-50%)}}

/* ── the medallion itself ── */
.bbsv-seal{width:88px;height:88px;margin:6px auto 12px;display:block}
.bbsv-seal .rim{fill:none;stroke:var(--sv-dead);stroke-width:3}
.bbsv-seal .face{fill:#141009;stroke:var(--sv-dead);stroke-width:1.5}
.bbsv-seal .mark{stroke:var(--sv-dead);stroke-width:2.5;fill:none;stroke-linecap:round}
.bbsv-room.is-live .bbsv-seal .rim,
.bbsv-room.is-live .bbsv-seal .face{stroke:var(--sv-gold)}
.bbsv-room.is-live .bbsv-seal .mark{stroke:var(--sv-gold)}
.bbsv-room.is-live .bbsv-seal .face{fill:#2a2009}
@media(prefers-reduced-motion:no-preference){
  .bbsv-room.is-live .bbsv-seal{animation:bbsv-lit 2.8s ease-in-out infinite}
  @keyframes bbsv-lit{0%,100%{filter:drop-shadow(0 0 3px rgba(216,178,74,.35))}50%{filter:drop-shadow(0 0 12px rgba(216,178,74,.7))}}
}

.bbsv-who{text-align:center;font-family:var(--font-mono);font-size:10px;letter-spacing:1.4px;color:var(--sv-dim);text-transform:uppercase}
.bbsv-who b{color:var(--sv-gold);font-weight:400}
.bbsv-redact{display:inline-block;width:104px;height:13px;vertical-align:-2px;
  background:repeating-linear-gradient(90deg,#0f0c08 0 8px,#241d12 8px 16px);border:1px solid var(--sv-line)}
`;

const SEAL = `<svg class="bbsv-seal" viewBox="0 0 100 100" role="img" aria-label="The second medallion">
  <circle class="rim" cx="50" cy="50" r="40"></circle>
  <circle class="face" cx="50" cy="50" r="31"></circle>
  <path class="mark" d="M34 50 L45 61 L67 39"></path>
</svg>`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `second-veto` act
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBSecondVeto(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const avatar = deps.avatar;
  const stateKey = _key(ep, `sv${act.kind || ''}`);
  const state = _init(stateKey);

  const secret = !!act.anonymous;
  const beats = act.beats || [];
  const steps = [{ kind: 'adjourned' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'result' }];
  const total = steps.length;
  // The room reopens the moment the medallion comes out — one step in, not at
  // the end, so the viewer watches the meeting restart rather than being told
  // afterwards that it did.
  const live = act.used && state.idx >= 2;
  const resolved = state.idx >= total - 1;

  // The block as it stands, with the swap only once the room is live.
  const seats = (act.nominees || []).slice(0, 2);
  const chairs = seats.map(n => {
    const isNew = live && n === act.replacement;
    return `<div class="bbsv-chair ${isNew ? 'is-new' : ''}">${avatar(n, 30)}
      <span>${esc(n)}<em>${isNew ? 'put here after it ended' : 'on the block'}</em></span></div>`;
  }).join('');
  const goneChair = live && act.saved
    ? `<div class="bbsv-chair is-gone">${avatar(act.saved, 30)}
        <span>${esc(act.saved)}<em>came down</em></span></div>`
    : '';

  const holderLine = !live
    ? 'somebody in this room is not getting up'
    : (secret
      ? 'used by <span class="bbsv-redact"></span>'
      : `used by <b>${esc(act.holder || '')}</b>`);

  const STAGE = `<div class="bbsv-room ${live ? 'is-live' : ''}">
    <div class="bbsv-band">
      <span>${secret ? 'A medallion nobody competed for' : 'Two medallions, one competition'}</span>
      <span>Week ${ep.num}</span></div>
    <div class="bbsv-body">
      <div class="bbsv-block">${chairs}${goneChair}</div>
      ${SEAL}
      <div class="bbsv-who">${holderLine}</div>
      <div class="bbsv-stamp">${live ? 'REOPENED' : 'ADJOURNED'}</div>
    </div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'adjourned') {
      return _card('THE MEETING IS OVER',
        `The veto has been used or it has not, the block is what it is, and everybody in this room has
         already worked out what the week looks like from here. Chairs are being pushed back.
         <br><br>${secret
    ? 'There is a second medallion in this house. It was not won, it was found, and the only person who '
      + 'knows where it is has been sitting through this entire meeting saying nothing.'
    : 'There were two medallions in that competition. Everybody watched the second one be won. Nobody has '
      + 'watched it be used, and the meeting is adjourning.'}`,
        'grey', '', seats);
    }
    if (step.kind === 'beat') return _beatCard(step.b);
    if (!act.used) {
      return _card('IT STAYS IN THE BOX',
        `Nothing happens. The block that walked into this meeting walks out of it, and the houseguest
         holding the second medallion has just made a statement about this week without opening their
         mouth — the block is where they want it, and everybody now knows that too.`,
        'grey', 'is-final', [secret ? null : act.holder].filter(Boolean));
    }
    return _card('IT DID NOT STAY FINISHED',
      `${esc(act.saved)} is off the block. ${esc(act.replacement)} is on it, and was on the sofa when this
       meeting started.
       <br><br>${secret
    ? 'Nobody is told whose hand did it. The Head of Household built this block, watched it settle, and '
      + 'then watched somebody in that room rewrite it — and has to keep working with all of them.'
    : `The Head of Household did not choose either name sitting there now. One meeting, two medallions, `
      + 'and a week that belongs to somebody else entirely.'}`,
    'red', 'is-final', [act.saved, act.replacement].filter(Boolean));
  };

  return _shell({
    ep, stateKey, total, cls: 'bbsv', css: SV_CSS,
    title: secret ? 'THE SECOND MEDALLION' : 'THE SECOND VETO',
    sub: 'The meeting was over · somebody did not get up',
    stage: STAGE,
    cards: steps.map(card).join(''),
    firstLabel: 'Adjourn the meeting',
  });
}
