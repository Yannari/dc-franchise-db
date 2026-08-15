/**
 * Cold Comfort — "THE LONG NIGHT"
 *
 * A row of people standing on platforms in the dark getting steadily colder is
 * the least visual competition in the library, and the screen leans all the way
 * into that instead of dressing it up. There is no course, no target and no
 * apparatus. There are two instruments and they are the whole screen:
 *
 *   THE CLOCK. One enormous readout at the top that only ever moves forward.
 *   Every reveal advances the night — 11:41 PM, 12:34, 1:19 — and the hour's
 *   condition is named under it. It is the suspense device: nothing on this
 *   screen tells you how much longer this goes, only how long it has been.
 *
 *   THE ROW. One core-temperature column per houseguest, draining live. The
 *   colour goes the wrong way on purpose — a healthy column is deep cold-blue
 *   and a dying one goes WHITE, because that is what going numb looks like from
 *   the outside and a red-for-danger bar would be lying about the subject.
 *   When somebody steps off, their column stops and their platform frosts over
 *   and goes dark, and it stays on the row for the rest of the night with the
 *   hour they quit written under it.
 *
 * Frost creeps in from the edges of the page as the night runs — bound to the
 * reveal index, so the screen itself gets colder while you read it. Sleet falls
 * behind everything at two speeds. Nothing here is borrowed from another screen
 * in this directory: no lane, no rack, no leaderboard, no podium.
 *
 * The three offers get their own furniture, because they are the competition's
 * actual mechanic. An offer is a brass plate. Taking the bed is grey, feeding
 * the house is green, and taking somebody off with you is red and shakes the
 * card it is written on.
 */

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const P = 'cc';

/* ── the instruments, as SVG ── */
const ICONS = {
  flake: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M12 5.6 9.8 3.4M12 5.6l2.2-2.2M12 18.4l-2.2 2.2M12 18.4l2.2 2.2"/><path d="m6.2 9.2-3-.5m3 .5.6-3m11 8.6 3 .5m-3-.5-.6 3m-10.4.5-3 .5m3-.5-.6-3m11.6-2.6 3-.5m-3 .5.6 3"/></g></svg>`,
  drop: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 3c4 5.2 6 8.4 6 11a6 6 0 0 1-12 0c0-2.6 2-5.8 6-11Z" fill="currentColor" opacity=".85"/></svg>`,
  fan: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><g fill="currentColor" opacity=".9"><path d="M12 11a3 3 0 0 1-2-5.2C11 4.6 13 3.4 15 4c1.6.5 2 2.4 1 4-.8 1.4-2.4 2.6-4 3Z"/><path d="M13 13a3 3 0 0 1 5.2-2c1.2 1 2.4 3 1.8 5-.5 1.6-2.4 2-4 1-1.4-.8-2.6-2.4-3-4Z"/><path d="M11 13a3 3 0 0 1-3 4.8c-1.5.4-3.7 0-4.6-1.7-.8-1.5.3-3 2-3.6 1.5-.5 3.5-.4 5 .5Z"/><circle cx="12" cy="12" r="1.7"/></g></svg>`,
  bed: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 18v-8m0 4h18v4M3 14v-1a2 2 0 0 1 2-2h6v3"/><circle cx="7" cy="9" r="1.6"/></g></svg>`,
  bowl: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 12h18a9 9 0 0 1-18 0Z"/><path d="M8 7c0-1.2 1-1.6 1-2.8M12 6.4c0-1.2 1-1.6 1-2.8M16 7c0-1.2 1-1.6 1-2.8"/></g></svg>`,
  hand: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V4.8a1.4 1.4 0 0 1 2.8 0V10m0-1.2a1.4 1.4 0 0 1 2.8 0V11m0-1a1.4 1.4 0 0 1 2.8 0v5.4c0 2.8-2 4.6-5 4.6-2.6 0-4-1-5.2-2.8L5 14.2a1.5 1.5 0 0 1 2.4-1.8L9 14.2"/></g></svg>`,
  crown: `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M3 18h18l-1.4-9-4.3 3.4L12 6l-3.3 6.4L4.4 9Z" fill="currentColor"/></svg>`,
};

/** Which instrument belongs to which hour, read off the condition's name. */
const hourIcon = name => (
  /WIND/.test(name || '') ? ICONS.fan
    : /WAVE|MISTER|WATER/.test(name || '') ? ICONS.drop
      : ICONS.flake);

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
.sigcold{--cc-ink:#dceaf6;--cc-dim:#7e95ab;--cc-ice:#6fc6f5;--cc-deep:#2b7fb8;--cc-white:#eaf6ff;
  --cc-gold:#e0b95f;--cc-warn:#d4635a;--cc-good:#6bbb8a;--cc-line:rgba(140,190,225,.20);
  font-family:'Inter',system-ui,sans-serif;color:var(--cc-ink);position:relative;overflow:clip}

/* the yard, and the one floodlight in it */
.sigcold .cc-sky{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(70% 42% at 50% -6%,rgba(150,205,240,.20),transparent 62%),
    radial-gradient(120% 80% at 50% 120%,rgba(20,52,80,.55),transparent 70%),
    linear-gradient(180deg,#04070f 0%,#071626 42%,#0a2032 100%)}
/* sleet, two layers, different speeds */
.sigcold .cc-sleet,.sigcold .cc-sleet2{position:absolute;inset:46px -40px 0 -40px;z-index:1;pointer-events:none;opacity:.5;
  background-image:repeating-linear-gradient(74deg,rgba(210,238,255,.55) 0 1px,transparent 1px 7px);
  background-size:auto 130px;animation:ccFall 1.05s linear infinite}
.sigcold .cc-sleet2{opacity:.22;background-image:repeating-linear-gradient(70deg,rgba(255,255,255,.6) 0 2px,transparent 2px 15px);
  background-size:auto 210px;animation-duration:2.1s}
@keyframes ccFall{from{background-position:0 0}to{background-position:-60px 210px}}
/* Frost creeping in from the edges — bound to how far into the night you are.
   Masked to the rim: unmasked, the two crystal layers threw long rays clean
   across the middle of the page and read as scratches on the lens rather than
   ice on the glass. Frost grows from the edge inward or it is not frost. */
.sigcold .cc-frost{position:absolute;inset:46px 0 0 0;z-index:2;pointer-events:none;
  opacity:var(--cc-f,0);transition:opacity .5s ease;
  background:
    radial-gradient(120% 90% at 50% 50%,transparent 42%,rgba(196,231,255,.30) 88%,rgba(226,244,255,.5) 100%),
    repeating-conic-gradient(from 12deg at 6% 12%,rgba(255,255,255,.10) 0 3deg,transparent 3deg 26deg),
    repeating-conic-gradient(from 40deg at 96% 88%,rgba(255,255,255,.10) 0 3deg,transparent 3deg 26deg);
  -webkit-mask-image:radial-gradient(115% 88% at 50% 50%,transparent 40%,#000 92%);
  mask-image:radial-gradient(115% 88% at 50% 50%,transparent 40%,#000 92%);
  mix-blend-mode:screen}

.sigcold .cc-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:3;padding-bottom:78px}

/* ── the clock ── */
.sigcold .cc-head{text-align:center;padding:16px 12px 13px;margin-top:8px;border-radius:4px;
  background:linear-gradient(180deg,rgba(8,22,36,.86),rgba(6,14,24,.7));border:1px solid var(--cc-line)}
.sigcold .cc-eyebrow{font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:6px;color:var(--cc-dim);text-transform:uppercase}
.sigcold .cc-title{font-family:'Barlow Condensed',sans-serif;font-size:40px;font-weight:700;letter-spacing:7px;
  margin:2px 0 6px;color:var(--cc-white);text-shadow:0 0 26px rgba(111,198,245,.35)}
.sigcold .cc-clock{display:inline-flex;align-items:baseline;gap:11px;padding:6px 18px;border-radius:3px;
  border:1px solid rgba(111,198,245,.34);background:rgba(6,26,42,.7);box-shadow:inset 0 0 22px rgba(111,198,245,.10)}
.sigcold .cc-clock b{font-family:'Barlow Condensed',sans-serif;font-size:31px;font-weight:600;letter-spacing:3px;
  color:var(--cc-ice);font-variant-numeric:tabular-nums;text-shadow:0 0 16px rgba(111,198,245,.55)}
.sigcold .cc-clock i{font-style:normal;font-size:10px;letter-spacing:2.6px;color:var(--cc-dim)}
.sigcold .cc-cond{margin-top:8px;font-family:'Barlow Condensed',sans-serif;font-size:14px;letter-spacing:4.4px;
  color:var(--cc-white);display:flex;align-items:center;justify-content:center;gap:8px}
.sigcold .cc-cond svg{color:var(--cc-ice)}
.sigcold .cc-sev{display:flex;gap:3px;justify-content:center;margin-top:7px}
.sigcold .cc-sev i{width:20px;height:3px;border-radius:2px;background:rgba(140,190,225,.18)}
.sigcold .cc-sev i.on{background:linear-gradient(90deg,var(--cc-deep),var(--cc-ice))}
.sigcold .cc-rules{max-width:680px;margin:11px auto 0;padding:9px 13px;border-radius:4px;font-size:11.5px;
  line-height:1.6;color:#a9c1d4;background:rgba(4,12,20,.5);border:1px solid var(--cc-line)}
.sigcold .cc-weights{display:flex;gap:11px;justify-content:center;flex-wrap:wrap;margin:9px auto 0;max-width:740px}
.sigcold .cc-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--cc-dim)}
.sigcold .cc-wb{width:44px;height:4px;border-radius:3px;background:rgba(140,190,225,.16);overflow:hidden}
.sigcold .cc-wb b{display:block;height:100%;background:linear-gradient(90deg,var(--cc-deep),var(--cc-ice))}
.sigcold .cc-w.is-spread{font-style:italic;text-transform:none;letter-spacing:.4px;opacity:.8}

/* ── the row of platforms ── */
.sigcold .cc-row{display:flex;align-items:flex-end;justify-content:center;flex-wrap:wrap;gap:9px;
  margin:15px auto 16px;padding:15px 12px 11px;border-radius:4px;background:rgba(5,16,27,.55);
  border:1px solid var(--cc-line)}
.sigcold .cc-hg{width:60px;text-align:center}
.sigcold .cc-col{position:relative;height:104px;width:15px;margin:0 auto 7px;border-radius:8px;
  background:linear-gradient(180deg,rgba(10,28,44,.9),rgba(6,16,26,.9));
  border:1px solid rgba(140,190,225,.26);overflow:hidden}
.sigcold .cc-col b{position:absolute;left:0;right:0;bottom:0;display:block;border-radius:0 0 7px 7px;
  background:linear-gradient(180deg,var(--cc-ice),var(--cc-deep));transition:height .45s ease,background .45s ease}
.sigcold .cc-hg.is-numb .cc-col b{background:linear-gradient(180deg,#ffffff,#bfe4f7)}
/* An empty column is somebody who is not out there any more.
   It used to freeze at whatever their core read when they quit, which put a
   tall bar over everybody who went home early and a two-inch stub over the one
   person who stood there all night — the row said the winner was the worst in
   the yard. The number was honest and the picture was a lie. The hours under
   the name carry how far they got; the column only ever answers one question,
   which is whether they are still on the platform. */
.sigcold .cc-hg.is-out .cc-col{border-color:rgba(120,140,160,.28);
  background:repeating-linear-gradient(120deg,rgba(200,230,250,.13) 0 3px,transparent 3px 8px),rgba(6,14,22,.92)}
.sigcold .cc-hg.is-out .cc-col b{display:none}
.sigcold .cc-hg:not(.is-out) .cc-col::after{content:'';position:absolute;inset:0;border-radius:8px;
  box-shadow:0 0 14px rgba(111,198,245,.4);animation:ccBreathe 3.6s ease-in-out infinite}
.sigcold .cc-hg:nth-child(3n) .cc-col::after{animation-delay:1.2s}
.sigcold .cc-hg:nth-child(4n) .cc-col::after{animation-delay:2.3s}
@keyframes ccBreathe{0%,100%{opacity:.35}50%{opacity:.9}}
/* The platform. Lit while somebody is on it, and it has to READ as lit — the
   first pass painted a navy disc on a navy yard and the row lost the one thing
   that makes it a row of people rather than a bar chart. */
.sigcold .cc-pad{position:relative;width:42px;height:12px;margin:0 auto;border-radius:50%;
  background:radial-gradient(65% 70% at 50% 26%,#a9dcf6,#3d87b8 58%,#123a56);
  border:1px solid rgba(190,230,250,.55);
  box-shadow:0 0 20px rgba(111,198,245,.55),0 0 42px rgba(111,198,245,.22),inset 0 1px 0 rgba(240,252,255,.75)}
.sigcold .cc-hg.is-out .cc-pad{background:radial-gradient(65% 70% at 50% 26%,#5b6771,#1b232b 70%,#0c1116);
  border-color:rgba(200,228,245,.28);box-shadow:none}
/* frozen over: the rime that forms on an abandoned platform */
.sigcold .cc-hg.is-out .cc-pad::after{content:'';position:absolute;inset:-2px;border-radius:50%;
  background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(224,246,255,.30) 0 4deg,transparent 4deg 30deg);
  opacity:.65}
.sigcold .cc-n{font-size:9.5px;margin-top:6px;color:#c3d7e7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigcold .cc-hg.is-out .cc-n{color:#6d7f8e;text-decoration:line-through}
.sigcold .cc-t{font-family:'Barlow Condensed',sans-serif;font-size:9.5px;letter-spacing:1.2px;color:var(--cc-dim);min-height:12px}
.sigcold .cc-t.is-bed{color:#9aa7b3}.sigcold .cc-t.is-feed{color:var(--cc-good)}
.sigcold .cc-t.is-drag,.sigcold .cc-t.is-dragged{color:var(--cc-warn)}
.sigcold .cc-t.is-win{color:var(--cc-gold)}

/* ── cards ── */
.sigcold .cc-grid{display:grid;grid-template-columns:minmax(0,1fr) 236px;gap:16px;align-items:start}
@media(max-width:880px){.sigcold .cc-grid{grid-template-columns:1fr}}
.sigcold .cc-card{margin-bottom:9px;padding:12px 14px;border-radius:3px;background:rgba(7,20,33,.78);
  border:1px solid var(--cc-line);border-left:3px solid var(--cc-deep);animation:ccIn .34s ease both}
@keyframes ccIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.sigcold .cc-tag{font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:2.6px;color:var(--cc-dim);
  margin-bottom:5px;display:flex;align-items:center;gap:6px}
.sigcold .cc-body{font-size:12.8px;line-height:1.65;color:#cbdcea}
.sigcold .cc-card.k-hour{border-left-color:var(--cc-ice);background:linear-gradient(90deg,rgba(16,48,74,.82),rgba(7,20,33,.7))}
.sigcold .cc-card.k-hour .cc-tag{color:var(--cc-ice);font-size:12px;letter-spacing:4px}
.sigcold .cc-card.k-hold,.sigcold .cc-card.k-numb{border-left-color:rgba(140,190,225,.3);background:rgba(6,16,27,.6)}
.sigcold .cc-card.k-hold .cc-body,.sigcold .cc-card.k-numb .cc-body{font-style:italic;color:#a7bccd}
.sigcold .cc-card.k-step,.sigcold .cc-card.k-threw{border-left-color:#7b8894}
.sigcold .cc-card.k-offer{border:1px solid rgba(224,185,95,.5);border-left:3px solid var(--cc-gold);
  background:linear-gradient(180deg,rgba(48,37,12,.6),rgba(12,16,22,.8))}
.sigcold .cc-card.k-offer .cc-tag{color:var(--cc-gold)}
.sigcold .cc-card.k-refuse{border-left-color:var(--cc-good)}
.sigcold .cc-card.k-fed,.sigcold .cc-card.k-take-feed{border-left-color:var(--cc-good);background:rgba(12,34,26,.6)}
.sigcold .cc-card.k-take-drag,.sigcold .cc-card.k-dragged{border-left-color:var(--cc-warn);
  background:linear-gradient(180deg,rgba(56,18,16,.62),rgba(12,14,20,.8));animation:ccShake .5s ease both}
@keyframes ccShake{0%,100%{transform:none}18%{transform:translateX(-6px)}38%{transform:translateX(5px)}62%{transform:translateX(-3px)}82%{transform:translateX(2px)}}
.sigcold .cc-card.k-deal{border-left-color:var(--cc-good)}
.sigcold .cc-card.k-win,.sigcold .cc-card.k-count{border:1px solid rgba(224,185,95,.55);border-left:3px solid var(--cc-gold);
  background:linear-gradient(180deg,rgba(46,36,12,.7),rgba(8,16,26,.85))}
.sigcold .cc-card.k-win .cc-tag{color:var(--cc-gold)}
.sigcold .cc-win-b{display:flex;align-items:center;gap:13px;margin-top:3px}
.sigcold .cc-win-b .bb-av,.sigcold .cc-win-b img{border-radius:4px;border:2px solid var(--cc-gold)}
.sigcold .cc-locked{margin-bottom:9px;min-height:38px;border-radius:3px;border:1px dashed rgba(140,190,225,.2);
  display:grid;place-items:center;font-family:'Barlow Condensed',sans-serif;font-size:10px;letter-spacing:4px;color:rgba(160,200,230,.28)}

/* ── the side instrument ── */
.sigcold .cc-side{position:sticky;top:56px;padding:13px;border-radius:3px;background:rgba(6,18,30,.85);
  border:1px solid var(--cc-line)}
.sigcold .cc-side-h{font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:3.2px;color:var(--cc-white)}
.sigcold .cc-side-s{font-size:10.5px;color:var(--cc-dim);margin:3px 0 11px;line-height:1.5}
.sigcold .cc-srow{display:flex;align-items:center;gap:7px;font-size:11.5px;margin-bottom:7px;color:#bed2e2}
.sigcold .cc-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigcold .cc-srow.is-out span{color:#69798a;text-decoration:line-through}
.sigcold .cc-mini{width:52px;height:5px;border-radius:3px;background:rgba(140,190,225,.14);overflow:hidden}
.sigcold .cc-mini b{display:block;height:100%;background:linear-gradient(90deg,var(--cc-deep),var(--cc-ice))}
.sigcold .cc-srow.is-numb .cc-mini b{background:linear-gradient(90deg,#bfe4f7,#ffffff)}
.sigcold .cc-srow em{font-style:normal;font-size:9.5px;color:var(--cc-dim);min-width:30px;text-align:right;
  font-variant-numeric:tabular-nums}
.sigcold .cc-offers{margin-top:11px;padding-top:10px;border-top:1px solid var(--cc-line)}
.sigcold .cc-off{display:flex;align-items:center;gap:7px;font-size:10.5px;color:var(--cc-dim);margin-bottom:5px}
.sigcold .cc-off.on{color:var(--cc-gold)}
.sigcold .cc-off.taken{color:var(--cc-warn)}

.sigcold .cc-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;
  align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(2,8,14,.4),rgba(2,8,14,.85));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(140,190,225,.2)}
.sigcold .cc-count{font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:2.4px;color:var(--cc-dim)}
${sealCss(P, '#6fc6f5')}
@media(prefers-reduced-motion:reduce){
  .sigcold *,.sigcold *::before,.sigcold *::after{animation:none!important;transition:none!important}
}
</style>`;

/** Which card style a step gets. `take` splits by which offer was taken. */
const kindClass = step => (step.kind === 'take' ? `k-take-${step.offer || 'bed'}` : `k-${step.kind || 'step'}`);

const OFFER_ICON = { bed: ICONS.bed, feed: ICONS.bowl, drag: ICONS.hand };
const OFFER_NAME = { bed: 'A BED', feed: 'THE HOUSE EATS', drag: 'TAKE SOMEBODY WITH YOU' };
/** What goes under a platform once its owner is off it. */
const OUT_TAG = {
  bed: 'TOOK THE BED', feed: 'FED THE HOUSE', drag: 'WALKED',
  dragged: 'TAKEN OFF', threw: 'THREW IT', deal: 'STOOD DOWN', count: 'ON THE COUNT',
};

export function rpBuildSigColdComfort(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';

  // The rewrite's own data. A season saved before it drops to the generic
  // board rather than drawing an empty yard.
  const allSteps = comp.detail?.steps;
  const allBeats = (comp.beats || []).filter(b => b && b.text);
  if (!Array.isArray(allSteps) || allSteps.length !== allBeats.length || allSteps.length < 2) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';

  // ── the seal ──
  //
  // This competition names its winner by subtraction the moment the row is
  // down to one, and the clock and the columns give the shape of it away well
  // before that. So a sealed night stops while there are still three people on
  // platforms, and every number on the screen goes behind a mask.
  const sealed = isSealedHoh(act, actType);
  const limit = sealed
    ? planSeal(allSteps, {
      survivorsAfter: s => (Number.isFinite(s.standing) ? s.standing : null),
      floor: 3,
      isResult: s => s.kind === 'win' || s.kind === 'count' || s.kind === 'deal',
    })
    : allSteps.length;

  const steps = allSteps.slice(0, limit);
  const beats = allBeats.slice(0, limit);
  // Two extra cards on a sealed night: where the broadcast stopped, and the one
  // thing the viewer is allowed to know that the house is not.
  const extra = sealed ? 2 : 0;
  const total = steps.length + extra;

  const stateKey = `bb_sig_cold_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const idx = Math.min(state.idx, total - 1);
  const done = idx >= total - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;
  const roster = ((act.participants && act.participants.length ? act.participants : comp.placements) || [])
    .filter(Boolean);

  // ── replay the night up to the current card ──
  //
  // Everything on this screen is derived from the revealed steps and nothing
  // from the finished result, which is what stops the row spoiling the cards.
  const outAt = {};                       // name -> { hour, via }
  const numbed = new Set();
  const offerState = { bed: null, feed: null, drag: null };
  let heats = Object.fromEntries(roster.map(n => [n, 100]));
  let nowClock = steps[0]?.clock || '11:41 PM';
  let nowHour = 0;
  let nowCond = 'THE FIRST HOUR';
  let nowSev = 0.5;

  const markOut = (name, hour, via) => {
    if (!name || outAt[name]) return;
    outAt[name] = { hour: hour || 0, via };
  };

  steps.slice(0, Math.max(0, idx + 1)).forEach(s => {
    if (s.heats && Object.keys(s.heats).length) heats = { ...heats, ...s.heats };
    if (s.clock) nowClock = s.clock;
    if (Number.isFinite(s.hour) && s.hour > 0) nowHour = s.hour;
    if (s.kind === 'hour') { nowCond = s.condition || nowCond; nowSev = Number(s.sev) || nowSev; }
    if (s.kind === 'numb' && s.who) numbed.add(s.who);
    if (s.kind === 'offer' && s.offer) offerState[s.offer] = 'offered';
    if (s.kind === 'refuse' && s.offer) offerState[s.offer] = 'refused';
    if (s.kind === 'take' && s.offer) { offerState[s.offer] = 'taken'; markOut(s.who, s.hour, s.offer); }
    if (s.kind === 'step' || s.kind === 'threw') markOut(s.who, s.hour, s.kind === 'threw' ? 'threw' : 'stepped');
    if (s.kind === 'dragged') markOut(s.who, s.hour, 'dragged');
    if (s.kind === 'deal') markOut(s.who, s.hour, 'deal');
    if (s.kind === 'count') roster.forEach(n => { if (n !== s.who) markOut(n, s.hour, 'count'); });
    if (s.kind === 'win') roster.forEach(n => { if (n !== s.who) markOut(n, s.hour, 'count'); });
  });

  const standing = roster.filter(n => !outAt[n]);
  const hide = v => (sealed ? MASK : v);

  // ── the row ──
  const row = roster.map(name => {
    const out = outAt[name];
    const heat = Math.max(0, Math.min(100, Math.round(Number(heats[name]) || 0)));
    const isNumb = numbed.has(name) && !out;
    const tag = out
      ? (OUT_TAG[out.via] || (out.hour ? `${out.hour}H` : 'DOWN'))
      : (idx < 0 ? '' : `${heat}%`);
    const tagCls = out ? `is-${out.via === 'feed' ? 'feed' : out.via === 'bed' ? 'bed' : out.via}` : '';
    // On a sealed night every standing column reads the same. The fill height
    // IS the core temperature, so leaving it live published the whole ranking
    // as a row of CSS percentages while the text above it was busy saying
    // nothing — masking the label and not the bar masks nothing at all.
    const fill = out ? 0 : sealed ? 62 : heat;
    return `<div class="cc-hg ${out ? 'is-out' : ''} ${isNumb && !sealed ? 'is-numb' : ''}">
      <div class="cc-col"><b style="height:${fill}%"></b></div>
      <div class="cc-pad"></div>
      <div class="cc-n">${esc(name)}</div>
      <div class="cc-t ${tagCls}">${out || !sealed ? esc(tag) : MASK}</div>
    </div>`;
  }).join('');

  // ── the cards ──
  let cards = '';
  beats.forEach((b, i) => {
    if (i > idx) { cards += `<div class="cc-locked">STANDING</div>`; return; }
    const s = steps[i] || {};
    const icon = s.kind === 'hour' ? hourIcon(s.condition)
      : s.kind === 'offer' || s.kind === 'take' ? (OFFER_ICON[s.offer] || '')
        : s.kind === 'win' ? ICONS.crown : '';
    const clock = s.clock ? `<span style="margin-left:auto;font-variant-numeric:tabular-nums;opacity:.7">${esc(s.clock)}</span>` : '';
    const isWin = s.kind === 'win' && winner;
    cards += `<article class="cc-card ${kindClass(s)}">
      <div class="cc-tag">${icon}${esc(b.badgeText || '')}${clock}</div>
      ${isWin
    ? `<div class="cc-win-b">${avatar(winner, 56)}<div class="cc-body">${b.text}</div></div>`
    : `<div class="cc-body">${b.text}</div>`}
    </article>`;
  });

  if (sealed) {
    cards += idx >= steps.length
      ? sealCutCard(P, { standing: standing.length, unit: 'still on a platform', salt: ep.num || 0 })
      : `<div class="cc-locked">STANDING</div>`;
    cards += idx >= steps.length + 1 && winner
      ? sealIronyCard(P, { winner, avatar, esc, isHoh: true })
      : `<div class="cc-locked">STANDING</div>`;
  }

  // ── the side instrument ──
  const sideRows = roster.slice()
    .sort((a, bN) => (outAt[a] ? 1 : 0) - (outAt[bN] ? 1 : 0) || (Number(heats[bN]) || 0) - (Number(heats[a]) || 0))
    .slice(0, 10)
    .map(name => {
      const out = outAt[name];
      const heat = Math.max(0, Math.min(100, Math.round(Number(heats[name]) || 0)));
      const hoursOut = out ? out.hour : nowHour;
      // Same rule as the row: a core reading is only meaningful for somebody
      // who still has to survive the next hour. Once they are off, the datum
      // is how long they lasted.
      return `<div class="cc-srow ${out ? 'is-out' : ''} ${numbed.has(name) && !out ? 'is-numb' : ''}">
        <span>${esc(name)}</span>
        <span class="cc-mini"><b style="width:${sealed || out ? 0 : heat}%"></b></span>
        <em>${idx < 0 ? '—' : sealed ? MASK : `${hoursOut || 0}h`}</em></div>`;
    }).join('');

  const offerRows = ['bed', 'feed', 'drag'].map(k => {
    const st = offerState[k];
    if (!st) return '';
    return `<div class="cc-off ${st === 'taken' ? 'taken' : 'on'}">${OFFER_ICON[k]}
      <span>${OFFER_NAME[k]}</span>
      <span style="margin-left:auto;font-size:9px;letter-spacing:1.6px">${st === 'taken' ? 'TAKEN' : st === 'refused' ? 'REFUSED' : 'ON THE TABLE'}</span></div>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
  const sevPips = Array.from({ length: 6 }, (_, i) =>
    `<i class="${idx >= 0 && nowSev >= 0.45 + i * 0.28 ? 'on' : ''}"></i>`).join('');
  // How far into the night the page itself is. The frost is the progress bar.
  const frost = total > 1 ? Math.min(0.85, Math.max(0, (idx + 1) / total) * 0.85) : 0;

  return `<div class="rp-page sigcold" style="--cc-f:${frost.toFixed(3)}">${_STYLE}
    <div class="cc-sky"></div><div class="cc-sleet"></div><div class="cc-sleet2"></div><div class="cc-frost"></div>
    <div class="cc-wrap">
      <div class="cc-head">
        <div class="cc-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : actType === 'arena' ? 'The Arena' : 'Head of Household')}</div>
        <div class="cc-title">COLD COMFORT</div>
        <div class="cc-clock"><b>${esc(nowClock)}</b><i>HOUR ${nowHour || 0}</i></div>
        <div class="cc-cond">${hourIcon(nowCond)}${esc(idx < 0 ? 'THEY WALK OUT IN THE DARK' : nowCond)}</div>
        <div class="cc-sev" title="How hard the yard is running">${sevPips}</div>
        ${comp.desc ? `<div class="cc-rules">${esc(comp.desc)}</div>` : ''}
        ${weights.length ? `<div class="cc-weights">
          ${weights.map(([k, v]) => `<span class="cc-w"><i>${esc(k)}</i><span class="cc-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u style="text-decoration:none;opacity:.75">${Math.round(v * 100)}%</u></span>`).join('')}
          ${comp.spreadStat ? `<span class="cc-w is-spread" title="Widens the spread rather than raising the score"><i>± ${esc(comp.spreadStat)}</i><u style="text-decoration:none">consistency</u></span>` : ''}
        </div>` : ''}
      </div>

      <div class="cc-row">${row}</div>

      <div class="cc-grid">
        <div>${cards}</div>
        <aside class="cc-side">
          <div class="cc-side-h">STILL ON A PLATFORM</div>
          <div class="cc-side-s">${idx < 0
    ? `${roster.length} out there, none of them cold yet.`
    : sealed
      ? `${standing.length} still up when the feed cut. Nothing else about this night is being reported.`
      : `${standing.length} of ${roster.length} left, ${nowHour || 0} hour${nowHour === 1 ? '' : 's'} in.`}</div>
          ${sideRows}
          ${offerRows ? `<div class="cc-offers">${offerRows}</div>` : ''}
          ${done && winner && !sealed ? `<div style="margin-top:11px;text-align:center;padding:11px;border-radius:3px;border:1px solid rgba(224,185,95,.5);background:rgba(224,185,95,.08)">
            <div style="width:52px;height:52px;border-radius:4px;overflow:hidden;margin:0 auto 6px;border:2px solid var(--cc-gold)">${avatar(winner, 52)}</div>
            <b style="display:block;font-size:13.5px;color:var(--cc-white)">${esc(winner)}</b>
            <i style="font-style:normal;font-size:10.5px;color:var(--cc-dim)">${Number(breakdown[winner]?.hours) || nowHour || 0} hours on a platform</i></div>` : ''}
        </aside>
      </div>

      <div class="cc-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}">Next hour</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Sit through the night</button>`}
        <span class="cc-count">${Math.min(total, Math.max(0, idx + 1))} / ${total}</span>
      </div>
    </div>
  </div>`;
}

export default rpBuildSigColdComfort;
