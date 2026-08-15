/**
 * Hold the Line — "THE MACHINE"
 *
 * Every other endurance screen in this directory is vertical, because every
 * other endurance competition is about falling: off a wall, off a platform, off
 * a pole. This one is horizontal, because nobody falls in it. They get dragged
 * sideways by a winch, an inch at a time, and the whole competition is the
 * distance between a person's heels and a chalk mark.
 *
 * So the instrument is a TRACK, one lane per houseguest, read left to right:
 *
 *   · the chalk mark, fixed, near the left of every lane
 *   · the houseguest, sitting on it at the start and sliding right as the
 *     machine takes ground off them — and sliding BACK LEFT when they haul,
 *     which no other screen here can show because no other competition in the
 *     library has a resource that moves both ways
 *   · the red line at the right, which is the end of their night
 *   · the rope, drawn taut from their marker out to the drum
 *
 * The winch sits in its own column on the right, turning, with the load on a
 * gauge. It speeds up as the notches climb. It is the only thing on screen that
 * is not a person, and it is the thing that beats all of them.
 *
 * Warm where the ice screen is cold and where The Wall is blue: sodium
 * worklight, rust, chalk, hazard chevrons, and a concrete floor with dust in
 * the light. Nothing here is borrowed from another screen in this directory.
 */

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const P = 'hl';

const ICONS = {
  drum: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 6v12M17 6v12M10.5 12h3"/></g></svg>`,
  rope: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M2 16c3 0 3-8 6-8s3 8 6 8 3-8 6-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  chalk: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 20h16M8 4v13M16 4v13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12V5.2a1.3 1.3 0 0 1 2.6 0V11m0-1.4a1.3 1.3 0 0 1 2.6 0V11m0-.8a1.3 1.3 0 0 1 2.6 0v5.2c0 2.7-1.9 4.4-4.8 4.4-2.5 0-3.8-1-4.9-2.7L5.2 14a1.4 1.4 0 0 1 2.3-1.7L9 14"/></g></svg>`,
  ear: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 20c0-3-4-4-4-9a8 8 0 0 1 16 0c0 3-2 4-4 4s-2 5-4 5Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 9a3 3 0 0 1 5 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  crown: `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M3 18h18l-1.4-9-4.3 3.4L12 6l-3.3 6.4L4.4 9Z" fill="currentColor"/></svg>`,
};

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
.sigline{--hl-amber:#f0a832;--hl-amber2:#c47a14;--hl-rust:#a4502a;--hl-chalk:#e8e2d4;
  --hl-ink:#e5ded1;--hl-dim:#96897a;--hl-red:#d94f3d;--hl-go:#6fb98a;
  --hl-line:rgba(210,180,140,.18);
  font-family:'IBM Plex Sans',system-ui,sans-serif;color:var(--hl-ink);position:relative;overflow:clip}

/* the yard: concrete under sodium worklight */
.sigline .hl-floor{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(58% 34% at 50% 2%,rgba(240,168,50,.20),transparent 64%),
    radial-gradient(40% 26% at 12% 84%,rgba(240,168,50,.09),transparent 70%),
    repeating-linear-gradient(90deg,rgba(0,0,0,.13) 0 2px,transparent 2px 5px),
    linear-gradient(180deg,#0a0906 0%,#15110b 46%,#1c1610 100%)}
/* dust turning over in the light */
.sigline .hl-dust{position:absolute;inset:46px 0 0 0;z-index:1;pointer-events:none;opacity:.5;
  background-image:radial-gradient(1.6px 1.6px at 18% 30%,rgba(255,226,180,.7),transparent),
    radial-gradient(1.4px 1.4px at 62% 18%,rgba(255,226,180,.55),transparent),
    radial-gradient(1.8px 1.8px at 81% 62%,rgba(255,226,180,.5),transparent),
    radial-gradient(1.3px 1.3px at 34% 74%,rgba(255,226,180,.6),transparent);
  background-size:340px 300px;animation:hlDrift 19s linear infinite}
@keyframes hlDrift{from{background-position:0 0}to{background-position:-160px -300px}}
.sigline .hl-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:3;padding-bottom:78px}

/* ── head ── */
.sigline .hl-head{text-align:center;padding:15px 12px 12px;margin-top:8px;border-radius:3px;
  background:linear-gradient(180deg,rgba(28,22,14,.88),rgba(14,11,7,.72));border:1px solid var(--hl-line);
  border-top:3px solid var(--hl-amber2)}
.sigline .hl-eyebrow{font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:6px;color:var(--hl-dim);text-transform:uppercase}
.sigline .hl-title{font-family:'Oswald',sans-serif;font-size:38px;font-weight:600;letter-spacing:6px;
  margin:2px 0 8px;color:var(--hl-chalk);text-shadow:0 0 24px rgba(240,168,50,.3)}
.sigline .hl-gauge{display:inline-flex;align-items:center;gap:12px;padding:7px 16px;border-radius:2px;
  border:1px solid rgba(240,168,50,.4);background:rgba(30,20,8,.8)}
.sigline .hl-gauge b{font-family:'Oswald',sans-serif;font-size:27px;font-weight:500;letter-spacing:2px;
  color:var(--hl-amber);font-variant-numeric:tabular-nums}
.sigline .hl-gauge i{font-style:normal;font-size:9.5px;letter-spacing:2.4px;color:var(--hl-dim)}
.sigline .hl-gauge svg{color:var(--hl-amber)}
.sigline .hl-notch{margin-top:8px;font-family:'Oswald',sans-serif;font-size:14px;letter-spacing:4.5px;color:var(--hl-chalk)}
.sigline .hl-rules{max-width:690px;margin:11px auto 0;padding:9px 13px;border-radius:3px;font-size:11.5px;
  line-height:1.6;color:#c0b3a2;background:rgba(0,0,0,.34);border:1px solid var(--hl-line)}
.sigline .hl-weights{display:flex;gap:11px;justify-content:center;flex-wrap:wrap;margin:9px auto 0;max-width:740px}
.sigline .hl-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--hl-dim)}
.sigline .hl-wb{width:44px;height:4px;border-radius:2px;background:rgba(210,180,140,.16);overflow:hidden}
.sigline .hl-wb b{display:block;height:100%;background:linear-gradient(90deg,var(--hl-amber2),var(--hl-amber))}
.sigline .hl-w.is-spread{font-style:italic;text-transform:none;letter-spacing:.4px;opacity:.8}

/* ── the track ── */
.sigline .hl-rig{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:10px;align-items:stretch;
  margin:15px auto 16px;padding:13px 12px;border-radius:3px;background:rgba(12,9,5,.6);
  border:1px solid var(--hl-line)}
.sigline .hl-lanes{display:flex;flex-direction:column;gap:6px;min-width:0}
.sigline .hl-lane{position:relative;height:26px;border-radius:2px;background:linear-gradient(180deg,rgba(38,30,20,.7),rgba(20,15,9,.7));
  border:1px solid rgba(210,180,140,.12);overflow:hidden}
/* the chalk mark, and the red line at the end of the night */
.sigline .hl-lane::before{content:'';position:absolute;left:20%;top:3px;bottom:3px;width:2px;
  background:repeating-linear-gradient(180deg,var(--hl-chalk) 0 3px,transparent 3px 6px);opacity:.85}
.sigline .hl-lane::after{content:'';position:absolute;right:5%;top:0;bottom:0;width:2px;
  background:var(--hl-red);box-shadow:0 0 9px rgba(217,79,61,.75)}
/* the rope, running from the houseguest out to the drum */
.sigline .hl-rope{position:absolute;top:50%;right:5%;height:2px;transform:translateY(-50%);
  background:repeating-linear-gradient(90deg,rgba(196,122,20,.9) 0 5px,rgba(120,72,14,.9) 5px 10px);
  animation:hlHum .19s linear infinite}
@keyframes hlHum{0%,100%{transform:translateY(-50%)}50%{transform:translateY(calc(-50% + .8px))}}
.sigline .hl-mk{position:absolute;top:50%;transform:translate(-50%,-50%);width:19px;height:19px;border-radius:50%;
  background:radial-gradient(60% 60% at 40% 30%,#ffd28a,var(--hl-amber2));border:1px solid #ffe0aa;
  box-shadow:0 0 12px rgba(240,168,50,.6);transition:left .55s cubic-bezier(.4,0,.2,1);z-index:2}
.sigline .hl-mk span{position:absolute;inset:0;display:grid;place-items:center;font-size:8.5px;font-weight:600;color:#2a1a06}
.sigline .hl-name{position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:10px;color:#cbbda9;
  z-index:3;text-shadow:0 1px 3px #000;pointer-events:none;max-width:16%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.sigline .hl-in{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:9px;
  font-variant-numeric:tabular-nums;color:var(--hl-dim);z-index:3}
.sigline .hl-lane.is-out{opacity:.42;filter:saturate(.25)}
/* An out marker parks on the red line at the far right, which is exactly where
   the status label lives — so the two drew on top of each other. The label
   steps back inside the lane and reads to the left of the marker. */
.sigline .hl-lane.is-out .hl-in{right:11%}
.sigline .hl-lane.is-out .hl-rope{animation:none;background:repeating-linear-gradient(90deg,rgba(120,110,96,.5) 0 5px,transparent 5px 10px)}
.sigline .hl-lane.is-out .hl-mk{background:#5d564c;border-color:#7a7266;box-shadow:none}
.sigline .hl-lane.is-hauling .hl-mk{box-shadow:0 0 18px rgba(111,185,138,.95);background:radial-gradient(60% 60% at 40% 30%,#c6f0d6,#4e9c72)}

/* the machine */
.sigline .hl-winch{border-radius:2px;border:1px solid rgba(240,168,50,.28);background:rgba(24,17,9,.85);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:8px 4px}
.sigline .hl-drum{width:52px;height:52px;border-radius:50%;border:3px solid var(--hl-amber2);
  background:conic-gradient(from 0deg,#2a1d0c 0 25%,#57391a 25% 50%,#2a1d0c 50% 75%,#57391a 75%);
  animation:hlSpin var(--hl-spin,3s) linear infinite;box-shadow:inset 0 0 12px rgba(0,0,0,.8)}
@keyframes hlSpin{to{transform:rotate(360deg)}}
.sigline .hl-winch b{font-family:'Oswald',sans-serif;font-size:15px;color:var(--hl-amber);font-variant-numeric:tabular-nums}
.sigline .hl-winch i{font-style:normal;font-size:8px;letter-spacing:1.6px;color:var(--hl-dim);text-align:center}
.sigline .hl-chev{height:7px;margin-top:9px;border-radius:2px;
  background:repeating-linear-gradient(115deg,rgba(240,168,50,.55) 0 9px,rgba(20,15,9,.9) 9px 18px)}

/* ── cards ── */
.sigline .hl-grid{display:grid;grid-template-columns:minmax(0,1fr) 232px;gap:16px;align-items:start}
@media(max-width:880px){.sigline .hl-grid{grid-template-columns:1fr}}
.sigline .hl-card{margin-bottom:9px;padding:12px 14px;border-radius:2px;background:rgba(22,17,10,.82);
  border:1px solid var(--hl-line);border-left:3px solid var(--hl-rust);animation:hlIn .3s ease both}
@keyframes hlIn{from{opacity:0;transform:translateX(-5px)}to{opacity:1;transform:none}}
.sigline .hl-tag{font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:2.6px;color:var(--hl-dim);
  margin-bottom:5px;display:flex;align-items:center;gap:6px}
.sigline .hl-body{font-size:12.8px;line-height:1.65;color:#cfc2af}
.sigline .hl-card.k-notch{border-left-color:var(--hl-amber);background:linear-gradient(90deg,rgba(62,42,12,.85),rgba(22,17,10,.7))}
.sigline .hl-card.k-notch .hl-tag{color:var(--hl-amber);font-size:12px;letter-spacing:4px}
.sigline .hl-card.k-slack{border-left-color:var(--hl-go);background:linear-gradient(90deg,rgba(20,46,32,.7),rgba(14,20,15,.75))}
.sigline .hl-card.k-slack .hl-tag{color:var(--hl-go);font-size:11.5px;letter-spacing:4px}
.sigline .hl-card.k-haul{border-left-color:var(--hl-go);background:rgba(18,40,28,.6)}
.sigline .hl-card.k-haul .hl-tag{color:var(--hl-go)}
.sigline .hl-card.k-rest,.sigline .hl-card.k-hold,.sigline .hl-card.k-crew{border-left-color:rgba(180,160,130,.3);background:rgba(16,12,7,.6)}
.sigline .hl-card.k-hold .hl-body,.sigline .hl-card.k-crew .hl-body,.sigline .hl-card.k-rest .hl-body{font-style:italic;color:#b3a695}
.sigline .hl-card.k-burn,.sigline .hl-card.k-burned{border-left-color:var(--hl-red);
  background:linear-gradient(180deg,rgba(58,20,14,.66),rgba(18,12,8,.8))}
.sigline .hl-card.k-burn .hl-tag,.sigline .hl-card.k-burned .hl-tag{color:var(--hl-red)}
.sigline .hl-card.k-burned{animation:hlJolt .45s ease both}
@keyframes hlJolt{0%,100%{transform:none}20%{transform:translateX(-7px)}45%{transform:translateX(6px)}70%{transform:translateX(-3px)}}
.sigline .hl-card.k-call{border-left-color:var(--hl-go)}
.sigline .hl-card.k-call.is-lie{border-left-color:var(--hl-red);background:linear-gradient(180deg,rgba(58,20,14,.6),rgba(18,12,8,.8))}
.sigline .hl-card.k-call.is-lie .hl-tag{color:var(--hl-red)}
.sigline .hl-card.k-out,.sigline .hl-card.k-threw{border-left-color:#7d7466}
.sigline .hl-card.k-win,.sigline .hl-card.k-measured{border:1px solid rgba(240,168,50,.55);
  border-left:3px solid var(--hl-amber);background:linear-gradient(180deg,rgba(70,48,12,.7),rgba(16,12,7,.85))}
.sigline .hl-card.k-win .hl-tag{color:var(--hl-amber)}
.sigline .hl-win-b{display:flex;align-items:center;gap:13px;margin-top:3px}
.sigline .hl-win-b .bb-av,.sigline .hl-win-b img{border-radius:3px;border:2px solid var(--hl-amber)}
.sigline .hl-locked{margin-bottom:9px;min-height:36px;border-radius:2px;border:1px dashed rgba(210,180,140,.16);
  display:grid;place-items:center;font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:4px;color:rgba(210,180,140,.26)}

/* ── side ── */
.sigline .hl-side{position:sticky;top:56px;padding:13px;border-radius:2px;background:rgba(18,13,8,.88);
  border:1px solid var(--hl-line)}
.sigline .hl-side-h{font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:3.2px;color:var(--hl-chalk)}
.sigline .hl-side-s{font-size:10.5px;color:var(--hl-dim);margin:3px 0 11px;line-height:1.5}
.sigline .hl-srow{display:flex;align-items:center;gap:7px;font-size:11.5px;margin-bottom:7px;color:#c6b8a5}
.sigline .hl-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigline .hl-srow.is-out span{color:#7d7367;text-decoration:line-through}
.sigline .hl-bar{width:56px;height:5px;border-radius:2px;background:rgba(210,180,140,.14);overflow:hidden;position:relative}
.sigline .hl-bar b{display:block;height:100%;background:linear-gradient(90deg,var(--hl-amber2),var(--hl-red))}
.sigline .hl-srow em{font-style:normal;font-size:9.5px;color:var(--hl-dim);min-width:34px;text-align:right;
  font-variant-numeric:tabular-nums}
.sigline .hl-srow.on-mark em{color:var(--hl-go)}
.sigline .hl-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;
  align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(8,6,3,.4),rgba(8,6,3,.86));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(240,168,50,.24)}
.sigline .hl-count{font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:2.4px;color:var(--hl-dim)}
${sealCss(P, '#f0a832')}
@media(prefers-reduced-motion:reduce){
  .sigline *,.sigline *::before,.sigline *::after{animation:none!important;transition:none!important}
}
</style>`;

/** Where a marker sits in its lane. 20% is the chalk mark, 95% is the red line. */
const MARK_X = 20;
const LINE_X = 95;
// A houseguest still in it never draws ON the red line, however deep they are.
// The winch takes everybody past their mark by the end, so the last one holding
// can be over the limit and still be the winner — and a marker sitting exactly
// on the line reads as eliminated no matter what the card underneath it says.
const STILL_IN_X = 91;
const posFor = (ground, limit) =>
  Math.min(STILL_IN_X, MARK_X + Math.max(0, Math.min(1, ground / limit)) * (LINE_X - MARK_X));

const kindClass = step => `k-${step.kind || 'notch'}`;
const OUT_TAG = { over: 'OVER', threw: 'THREW', measured: 'MEASURED' };

export function rpBuildSigHoldTheLine(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';

  const allSteps = comp.detail?.steps;
  const allBeats = (comp.beats || []).filter(b => b && b.text);
  // The rewrite's own data. A season saved when this was a tilting wall has no
  // track to draw, and drops to the generic board rather than an empty rig.
  if (!Array.isArray(allSteps) || allSteps.length !== allBeats.length || allSteps.length < 2) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const LIMIT = Number(comp.detail?.limit) || 60;

  const sealed = isSealedHoh(act, actType);
  const limit = sealed
    ? planSeal(allSteps, {
      survivorsAfter: s => (Number.isFinite(s.standing) ? s.standing : null),
      floor: 3,
      isResult: s => s.kind === 'win' || s.kind === 'measured',
    })
    : allSteps.length;

  const steps = allSteps.slice(0, limit);
  const beats = allBeats.slice(0, limit);
  const extra = sealed ? 2 : 0;
  const total = steps.length + extra;

  const stateKey = `bb_sig_line_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const idx = Math.min(state.idx, total - 1);
  const done = idx >= total - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;
  const roster = ((act.participants && act.participants.length ? act.participants : comp.placements) || [])
    .filter(Boolean);

  // ── replay up to the current card ──
  const outAt = {};
  const hauling = new Set();
  let ground = Object.fromEntries(roster.map(n => [n, 0]));
  let pull = 0;
  let notchLabel = '';
  let notchNo = 0;
  let hauls = 0;
  let lies = 0;

  const markOut = (name, at, via) => { if (name && !outAt[name]) outAt[name] = { at: at || 0, via }; };

  steps.slice(0, Math.max(0, idx + 1)).forEach((s, i) => {
    if (s.ground && Object.keys(s.ground).length) ground = { ...ground, ...s.ground };
    if (Number.isFinite(s.pull) && s.pull > 0) pull = s.pull;
    if (s.kind === 'notch') { notchLabel = s.notch || notchLabel; notchNo = s.round || notchNo; }
    if (s.kind === 'out') markOut(s.who, s.round, 'over');
    if (s.kind === 'threw') markOut(s.who, s.round, 'threw');
    if (s.kind === 'measured') roster.forEach(n => { if (n !== s.who) markOut(n, s.round, 'measured'); });
    if (s.kind === 'win') roster.forEach(n => { if (n !== s.who) markOut(n, s.round, 'measured'); });
    if (s.kind === 'haul') { hauls++; if (i === idx) hauling.add(s.who); }
    if (s.kind === 'call' && s.honest === false) lies++;
  });

  const standing = roster.filter(n => !outAt[n]);

  // ── the rig ──
  const lanes = roster.map(name => {
    const out = outAt[name];
    const g = Math.max(0, Math.round(Number(ground[name]) || 0));
    // A sealed board parks every live marker in the same place. The marker's
    // x-position IS the standing, so a live track ranks the field in CSS no
    // matter how carefully the text avoids saying anything.
    const x = out ? LINE_X : sealed ? MARK_X + 18 : posFor(g, LIMIT);
    const label = out
      ? (OUT_TAG[out.via] || 'OUT')
      : sealed ? '' : g === 0 ? 'ON MARK' : `${g}"`;
    return `<div class="hl-lane ${out ? 'is-out' : ''} ${hauling.has(name) ? 'is-hauling' : ''}">
      <span class="hl-name">${esc(name)}</span>
      <i class="hl-rope" style="width:${Math.max(0, LINE_X - x)}%"></i>
      <i class="hl-mk" style="left:${x}%"></i>
      <span class="hl-in">${esc(label)}</span>
    </div>`;
  }).join('');

  // The drum turns faster the harder it is pulling.
  const spin = pull > 0 ? Math.max(0.5, 3.4 - pull * 0.12).toFixed(2) : '3.4';

  // ── cards ──
  let cards = '';
  beats.forEach((b, i) => {
    if (i > idx) { cards += `<div class="hl-locked">HOLDING</div>`; return; }
    const s = steps[i] || {};
    const icon = s.kind === 'notch' ? ICONS.drum
      : s.kind === 'slack' ? ICONS.rope
        : s.kind === 'call' ? ICONS.ear
          : s.kind === 'burn' || s.kind === 'burned' ? ICONS.hand
            : s.kind === 'haul' ? ICONS.chalk
              : s.kind === 'win' ? ICONS.crown : '';
    const right = s.kind === 'notch' && s.pull
      ? `<span style="margin-left:auto;font-variant-numeric:tabular-nums;opacity:.75">LOAD ${esc(String(s.pull))}</span>`
      : s.round ? `<span style="margin-left:auto;opacity:.6">NOTCH ${esc(String(s.round))}</span>` : '';
    const isWin = s.kind === 'win' && winner;
    cards += `<article class="hl-card ${kindClass(s)} ${s.kind === 'call' && s.honest === false ? 'is-lie' : ''}">
      <div class="hl-tag">${icon}${esc(b.badgeText || '')}${right}</div>
      ${isWin
    ? `<div class="hl-win-b">${avatar(winner, 56)}<div class="hl-body">${b.text}</div></div>`
    : `<div class="hl-body">${b.text}</div>`}
    </article>`;
  });

  if (sealed) {
    cards += idx >= steps.length
      ? sealCutCard(P, { standing: standing.length, unit: 'still on their line', salt: ep.num || 0 })
      : `<div class="hl-locked">HOLDING</div>`;
    cards += idx >= steps.length + 1 && winner
      ? sealIronyCard(P, { winner, avatar, esc, isHoh: true })
      : `<div class="hl-locked">HOLDING</div>`;
  }

  // ── side ──
  const sideRows = roster.slice()
    .sort((a, b) => (outAt[a] ? 1 : 0) - (outAt[b] ? 1 : 0)
      || (Number(ground[a]) || 0) - (Number(ground[b]) || 0))
    .slice(0, 10)
    .map(name => {
      const out = outAt[name];
      const g = Math.max(0, Math.round(Number(ground[name]) || 0));
      const pct = Math.min(100, Math.round((g / LIMIT) * 100));
      return `<div class="hl-srow ${out ? 'is-out' : ''} ${!out && g === 0 ? 'on-mark' : ''}">
        <span>${esc(name)}</span>
        <span class="hl-bar"><b style="width:${sealed ? 0 : out ? 100 : pct}%"></b></span>
        <em>${idx < 0 ? '—' : sealed ? MASK : out ? `n${out.at}` : g === 0 ? 'ON' : `${g}"`}</em></div>`;
    }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page sigline">${_STYLE}
    <div class="hl-floor"></div><div class="hl-dust"></div>
    <div class="hl-wrap">
      <div class="hl-head">
        <div class="hl-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : 'Head of Household')}</div>
        <div class="hl-title">HOLD THE LINE</div>
        <div class="hl-gauge">${ICONS.drum}<b>${idx < 0 ? '0.0' : esc(String(pull || 0))}</b><i>LOAD ON THE ROPE</i></div>
        <div class="hl-notch">${esc(idx < 0 ? 'THEY TAKE THE ROPES' : notchLabel || 'STANDING BY')}</div>
        ${comp.desc ? `<div class="hl-rules">${esc(comp.desc)}</div>` : ''}
        ${weights.length ? `<div class="hl-weights">
          ${weights.map(([k, v]) => `<span class="hl-w"><i>${esc(k)}</i><span class="hl-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u style="text-decoration:none;opacity:.75">${Math.round(v * 100)}%</u></span>`).join('')}
          ${comp.spreadStat ? `<span class="hl-w is-spread" title="Widens the spread rather than raising the score"><i>± ${esc(comp.spreadStat)}</i><u style="text-decoration:none">consistency</u></span>` : ''}
        </div>` : ''}
      </div>

      <div class="hl-rig">
        <div class="hl-lanes">${lanes}</div>
        <div class="hl-winch">
          <div class="hl-drum" style="--hl-spin:${spin}s"></div>
          <b>${idx < 0 ? '—' : esc(String(pull || 0))}</b>
          <i>WINCH<br>NOTCH ${idx < 0 ? 0 : notchNo}</i>
        </div>
      </div>
      <div class="hl-chev" aria-hidden="true"></div>

      <div class="hl-grid" style="margin-top:15px">
        <div>${cards}</div>
        <aside class="hl-side">
          <div class="hl-side-h">GROUND OFF THE MARK</div>
          <div class="hl-side-s">${idx < 0
    ? `${roster.length} on the ropes, every one of them standing on their own chalk.`
    : sealed
      ? `${standing.length} still on their line when the feed cut. No distances are being reported.`
      : `${standing.length} of ${roster.length} left${hauls ? `, ${hauls} haul${hauls === 1 ? '' : 's'} back so far` : ''}.`}</div>
          ${sideRows}
          ${!sealed && lies ? `<div style="margin-top:10px;padding-top:9px;border-top:1px solid var(--hl-line);font-size:10.5px;color:var(--hl-red)">
            ${lies === 1 ? 'A slack was called that never came.' : `${lies} slacks were called that never came.`}</div>` : ''}
          ${done && winner && !sealed ? `<div style="margin-top:11px;text-align:center;padding:11px;border-radius:2px;border:1px solid rgba(240,168,50,.5);background:rgba(240,168,50,.08)">
            <div style="width:52px;height:52px;border-radius:3px;overflow:hidden;margin:0 auto 6px;border:2px solid var(--hl-amber)">${avatar(winner, 52)}</div>
            <b style="display:block;font-size:13.5px;color:var(--hl-chalk)">${esc(winner)}</b>
            <i style="font-style:normal;font-size:10.5px;color:var(--hl-dim)">${Number(breakdown[winner]?.rounds) || notchNo || 0} notches, ${Number(breakdown[winner]?.hauls) || 0} haul${Number(breakdown[winner]?.hauls) === 1 ? '' : 's'} back</i></div>` : ''}
        </aside>
      </div>

      <div class="hl-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}">Next notch</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Let it run</button>`}
        <span class="hl-count">${Math.min(total, Math.max(0, idx + 1))} / ${total}</span>
      </div>
    </div>
  </div>`;
}

export default rpBuildSigHoldTheLine;
