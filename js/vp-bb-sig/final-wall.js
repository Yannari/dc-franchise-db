/**
 * Talk Them Down — "THE TRIANGLE"
 *
 * Part one of the final Head of Household. Three houseguests hang on a wall
 * for hours and cannot get away from each other, and the competition's own
 * file says it plainly: the wall is a negotiation. The apparatus is the part it
 * shares with a competition that already exists — so the apparatus is not the
 * screen. What passes BETWEEN the three of them is.
 *
 * So the instrument is a relationship triangle, which nothing else in this
 * directory draws. Three portraits at three corners, and the three edges
 * between them accumulate as the night runs:
 *
 *   · a green edge is solidarity — the two of them getting each other through
 *     a bad hour, which the simulation pays for in bond
 *   · a red edge is mind games — the strongest working on somebody, which
 *     costs the talker as well as the target
 *   · a gold arrow is an offer, pointing at the houseguest being asked to come
 *     down, and it goes solid when the offer is taken and stays dashed when it
 *     is refused
 *
 * By the end the triangle is the shape of the last night of the season: who
 * spent six hours helping, who spent them working, and which edge the game
 * actually turned on. A houseguest who comes off the wall dims, and their edges
 * go with them, because whatever they had going is over.
 *
 * Warm, close and low-lit — one sodium lamp on three exhausted people at four
 * in the morning, and a serif, because every other screen in this directory
 * shouts in sans and this one is a conversation.
 */

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const P = 'tw';

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Figtree:wght@400;500;600&display=swap');
.sigtalk{--tw-ink:#f0e3dc;--tw-dim:#9d8279;--tw-line:rgba(224,133,95,.2);
  --tw-warm:#e0855f;--tw-good:#7fae8b;--tw-bad:#c05a5a;--tw-gold:#e3b768;
  font-family:'Figtree',system-ui,sans-serif;color:var(--tw-ink);position:relative;overflow:clip}
/* one lamp, four in the morning */
.sigtalk .tw-room{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(46% 30% at 50% 2%,rgba(224,133,95,.24),transparent 68%),
    radial-gradient(70% 50% at 50% 100%,rgba(40,14,20,.6),transparent 72%),
    linear-gradient(180deg,#1a0f14 0%,#241419 48%,#140a0e 100%)}
.sigtalk .tw-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:3;padding-bottom:78px}

.sigtalk .tw-head{text-align:center;padding:15px 12px 13px;margin-top:10px;border-radius:2px;
  background:linear-gradient(180deg,rgba(45,25,29,.9),rgba(20,11,14,.8));border:1px solid var(--tw-line)}
.sigtalk .tw-eyebrow{font-size:10.5px;letter-spacing:5px;color:var(--tw-dim);text-transform:uppercase}
.sigtalk .tw-title{font-family:'Newsreader',Georgia,serif;font-size:40px;font-weight:500;letter-spacing:1px;
  margin:3px 0 6px;color:#fff}
.sigtalk .tw-hours{display:inline-flex;align-items:baseline;gap:10px;padding:5px 16px;border-radius:2px;
  border:1px solid rgba(224,133,95,.35);background:rgba(30,16,20,.7)}
.sigtalk .tw-hours b{font-family:'Newsreader',Georgia,serif;font-size:26px;font-weight:600;color:var(--tw-warm)}
.sigtalk .tw-hours i{font-style:normal;font-size:9.5px;letter-spacing:2.4px;color:var(--tw-dim)}
.sigtalk .tw-cond{margin-top:8px;font-size:11px;letter-spacing:3.4px;color:#c9aa9e;text-transform:uppercase}
.sigtalk .tw-rules{max-width:700px;margin:11px auto 0;padding:9px 13px;border-radius:2px;font-size:11.5px;
  line-height:1.6;color:#c4a99f;background:rgba(0,0,0,.26);border:1px solid var(--tw-line)}

/* ── the triangle ── */
.sigtalk .tw-rig{display:grid;grid-template-columns:minmax(0,320px) minmax(0,1fr);gap:16px;
  margin:15px auto 0;align-items:start}
@media(max-width:880px){.sigtalk .tw-rig{grid-template-columns:1fr}}
.sigtalk .tw-tri{position:relative;height:300px;border-radius:2px;background:rgba(16,9,12,.6);
  border:1px solid var(--tw-line);overflow:hidden}
.sigtalk .tw-tri svg{position:absolute;inset:0;width:100%;height:100%}
.sigtalk .tw-node{position:absolute;transform:translate(-50%,-50%);text-align:center;width:96px}
.sigtalk .tw-node .bb-av{display:inline-grid;place-items:center;overflow:hidden;border-radius:50%;
  width:52px;height:52px;position:relative;background:#2a171c;border:2px solid var(--tw-warm);
  box-shadow:0 0 18px rgba(224,133,95,.35)}
.sigtalk .tw-node .bb-av img{width:100%;height:100%;object-fit:cover;display:block}
.sigtalk .tw-node .bb-av i{position:absolute;inset:0;display:none;align-items:center;justify-content:center;
  font-style:normal;font-weight:700;font-size:17px;color:#c9aa9e}
.sigtalk .tw-node b{display:block;font-size:11px;margin-top:5px;color:#f0e3dc;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis}
.sigtalk .tw-node em{display:block;font-style:normal;font-size:9px;letter-spacing:1.4px;color:var(--tw-dim);
  text-transform:uppercase;text-shadow:0 1px 4px #1a0f14,0 0 8px #1a0f14}
.sigtalk .tw-node b{text-shadow:0 1px 4px #1a0f14,0 0 8px #1a0f14}
.sigtalk .tw-node.is-out .bb-av{border-color:#6a5259;box-shadow:none;filter:grayscale(.7);opacity:.5}
.sigtalk .tw-node.is-out b{color:#8d757c;text-decoration:line-through}
.sigtalk .tw-node.is-deal em{color:var(--tw-gold)}
.sigtalk .tw-node.is-win .bb-av{border-color:var(--tw-gold);box-shadow:0 0 24px rgba(227,183,104,.6)}
.sigtalk .tw-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:9px;font-size:9.5px;color:var(--tw-dim)}
.sigtalk .tw-legend span{display:flex;align-items:center;gap:5px}
.sigtalk .tw-legend i{width:14px;height:3px;border-radius:2px;display:block}

/* ── cards ── */
.sigtalk .tw-card{margin-bottom:9px;padding:11px 13px;border-radius:2px;background:rgba(32,18,22,.82);
  border:1px solid var(--tw-line);border-left:3px solid rgba(224,133,95,.45);animation:twIn .3s ease both}
@keyframes twIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.sigtalk .tw-tag{font-size:9.5px;letter-spacing:2.4px;color:var(--tw-dim);margin-bottom:5px;
  display:flex;align-items:center;gap:6px;font-weight:600;text-transform:uppercase}
.sigtalk .tw-body{font-size:13px;line-height:1.7;color:#e2cec6;font-family:'Newsreader',Georgia,serif}
.sigtalk .tw-card.k-solidarity{border-left-color:var(--tw-good);background:rgba(20,34,26,.55)}
.sigtalk .tw-card.k-solidarity .tw-tag{color:var(--tw-good)}
.sigtalk .tw-card.k-taunt{border-left-color:var(--tw-bad);background:rgba(46,18,20,.6)}
.sigtalk .tw-card.k-taunt .tw-tag{color:var(--tw-bad)}
.sigtalk .tw-card.k-deal,.sigtalk .tw-card.k-refused{border:1px solid rgba(227,183,104,.45);
  border-left:3px solid var(--tw-gold);background:linear-gradient(180deg,rgba(56,40,12,.6),rgba(22,13,16,.85))}
.sigtalk .tw-card.k-deal .tw-tag,.sigtalk .tw-card.k-refused .tw-tag{color:var(--tw-gold)}
.sigtalk .tw-card.k-fall{border-left-color:#8d757c}
.sigtalk .tw-card.k-win{border:1px solid rgba(227,183,104,.6);border-left:3px solid var(--tw-gold);
  background:linear-gradient(180deg,rgba(62,44,12,.7),rgba(20,12,15,.85))}
.sigtalk .tw-card.k-win .tw-tag{color:var(--tw-gold)}
.sigtalk .tw-win-b{display:flex;align-items:center;gap:13px;margin-top:3px}
.sigtalk .tw-win-b .bb-av{display:inline-grid;place-items:center;overflow:hidden;border-radius:3px;
  position:relative;background:#2a171c;border:2px solid var(--tw-gold);flex:none}
.sigtalk .tw-win-b .bb-av img{width:100%;height:100%;object-fit:cover;display:block}
.sigtalk .tw-win-b .bb-av i{position:absolute;inset:0;display:none;align-items:center;justify-content:center;
  font-style:normal;font-weight:700;color:#c9aa9e}
.sigtalk .tw-locked{margin-bottom:9px;min-height:34px;border-radius:2px;border:1px dashed rgba(224,133,95,.18);
  display:grid;place-items:center;font-size:9.5px;letter-spacing:4px;color:rgba(224,133,95,.28)}
.sigtalk .tw-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;
  align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(12,6,8,.42),rgba(12,6,8,.9));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid var(--tw-line)}
.sigtalk .tw-count{font-size:10.5px;letter-spacing:2.4px;color:var(--tw-dim)}
${sealCss(P, '#e0855f')}
@media(prefers-reduced-motion:reduce){
  .sigtalk *,.sigtalk *::before,.sigtalk *::after{animation:none!important;transition:none!important}
}
</style>`;

/** Where the three of them stand, as a proportion of the panel. */
const CORNERS = [{ x: 50, y: 20 }, { x: 20, y: 78 }, { x: 80, y: 78 }];
const pairKey = (a, b) => [a, b].sort().join('|');

/**
 * Stop a line short of the two faces it runs between.
 *
 * Drawn corner to corner, every edge ran underneath both portraits and the
 * offer line planted its end in the middle of the face it pointed at, covering
 * the name written under it. `head` is trimmed harder because that end carries
 * the marker dot and needs the clearance.
 */
function trim(A, B, tail = 0.17, head = 0.23) {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  return {
    x1: A.x + dx * tail, y1: A.y + dy * tail,
    x2: B.x - dx * head, y2: B.y - dy * head,
  };
}

export function rpBuildSigFinalWall(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';

  const allSteps = comp.detail?.steps;
  const allBeats = (comp.beats || []).filter(b => b && b.text);
  // A finale saved before the exchanges were indexed has no triangle to draw.
  if (!Array.isArray(allSteps) || allSteps.length !== allBeats.length || allSteps.length < 2) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';

  const cast = (comp.detail?.cast || act.participants || comp.placements || []).filter(Boolean);
  // The triangle is a triangle. A wall with a different number of people on it
  // is a competition this screen was not built for, and it says so by standing
  // aside rather than drawing three corners around two names.
  if (cast.length !== 3) return '';

  const sealed = isSealedHoh(act, actType);
  const limit = sealed
    ? planSeal(allSteps, {
      survivorsAfter: s => (Array.isArray(s.standing) ? s.standing.length : null),
      floor: 3, isResult: s => s.kind === 'win',
    })
    : allSteps.length;

  const steps = allSteps.slice(0, limit);
  const beats = allBeats.slice(0, limit);
  const extra = sealed ? 2 : 0;
  const total = steps.length + extra;

  const stateKey = `bb_sig_wall1_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const idx = Math.min(state.idx, total - 1);
  const done = idx >= total - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;

  // ── replay ──
  const edges = {};                 // pairKey -> { good, bad, offer, took, from, to }
  const outAt = {};                 // name -> { hours, via }
  let hours = 0;
  let cond = '';
  let standing = [...cast];
  let live = null;                  // the edge lit by the current card

  const edgeOf = (a, b) => (edges[pairKey(a, b)] ||= { good: 0, bad: 0, offer: 0, took: false, from: null, to: null });

  steps.slice(0, Math.max(0, idx + 1)).forEach((s, i) => {
    if (Number.isFinite(s.hours)) hours = s.hours;
    if (Array.isArray(s.standing)) standing = [...s.standing];
    if (s.hazard) cond = s.hazard;
    const cur = i === idx;
    if (s.kind === 'solidarity') { edgeOf(s.from, s.to).good++; if (cur) live = pairKey(s.from, s.to); }
    if (s.kind === 'taunt') { edgeOf(s.from, s.to).bad++; if (cur) live = pairKey(s.from, s.to); }
    if (s.kind === 'refused' || s.kind === 'deal') {
      const e = edgeOf(s.from, s.to);
      e.offer++; e.from = s.from; e.to = s.to;
      if (s.kind === 'deal') e.took = true;
      if (cur) live = pairKey(s.from, s.to);
    }
    if (s.kind === 'deal') outAt[s.to] = { hours: s.hours, via: 'deal' };
    if (s.kind === 'fall') outAt[s.who] = { hours: s.hours, via: 'fall' };
  });

  const pos = Object.fromEntries(cast.map((n, i) => [n, CORNERS[i]]));

  // ── the edges, drawn behind the faces ──
  let lines = '';
  for (let i = 0; i < cast.length; i++) {
    for (let j = i + 1; j < cast.length; j++) {
      const a = cast[i]; const b = cast[j];
      const key = pairKey(a, b);
      const e = edges[key];
      const A = pos[a]; const B = pos[b];
      const dead = outAt[a] || outAt[b];
      const t = trim(A, B, 0.17, 0.17);
      if (!e || (!e.good && !e.bad && !e.offer)) {
        lines += `<line x1="${t.x1}%" y1="${t.y1}%" x2="${t.x2}%" y2="${t.y2}%"
          stroke="rgba(224,133,95,.14)" stroke-width="1" stroke-dasharray="3 5"/>`;
        continue;
      }
      // One line, coloured by which way the pair actually went, thickened by
      // how much passed between them.
      const net = e.good - e.bad;
      const stroke = net > 0 ? '#7fae8b' : net < 0 ? '#c05a5a' : 'rgba(224,133,95,.5)';
      const w = Math.min(7, 1.4 + (e.good + e.bad) * 0.9);
      lines += `<line x1="${t.x1}%" y1="${t.y1}%" x2="${t.x2}%" y2="${t.y2}%"
        stroke="${stroke}" stroke-width="${w.toFixed(1)}" stroke-linecap="round"
        opacity="${dead ? 0.25 : key === live ? 1 : 0.75}"/>`;
      // The offer sits on top of whatever else the pair had going, pointing at
      // the houseguest who was asked to come down.
      if (e.offer && e.from && e.to) {
        // A dot at the asked-of end rather than an arrowhead: the panel is
        // stretched to whatever width its column gets, which distorts a marker
        // into a smear. A circle survives the same stretch legibly.
        const o = trim(pos[e.from], pos[e.to], 0.19, 0.33);
        lines += `<line x1="${o.x1}%" y1="${o.y1}%" x2="${o.x2}%" y2="${o.y2}%"
          stroke="#e3b768" stroke-width="2.2" stroke-linecap="round"
          ${e.took ? '' : 'stroke-dasharray="6 5"'} opacity="${dead && !e.took ? 0.35 : 0.95}"/>
          <circle cx="${o.x2}%" cy="${o.y2}%" r="${e.took ? 3.2 : 2.4}"
            fill="${e.took ? '#e3b768' : 'none'}" stroke="#e3b768" stroke-width="1.6"
            opacity="${dead && !e.took ? 0.35 : 0.95}"/>`;
      }
    }
  }

  const nodes = cast.map(name => {
    const p = pos[name];
    const out = outAt[name];
    const isWin = done && winner === name && !sealed;
    const held = Number(breakdown[name]?.hoursHeld);
    const label = sealed ? MASK
      : out ? (out.via === 'deal' ? 'came down on a promise' : `off at ${out.hours}h`)
        : isWin ? 'holds it' : `${Number.isFinite(held) && done ? held : hours}h up`;
    return `<div class="tw-node ${out ? 'is-out' : ''} ${out?.via === 'deal' ? 'is-deal' : ''} ${isWin ? 'is-win' : ''}"
        style="left:${p.x}%;top:${p.y}%">
      ${avatar(name, 52)}<b>${esc(name)}</b><em>${esc(label)}</em>
    </div>`;
  }).join('');

  // ── cards ──
  let cards = '';
  beats.forEach((b, i) => {
    if (i > idx) { cards += `<div class="tw-locked">STILL UP THERE</div>`; return; }
    const s = steps[i] || {};
    const right = s.hours ? `<span style="margin-left:auto;opacity:.62">${s.hours}h</span>` : '';
    const isWin = s.kind === 'win' && winner;
    cards += `<article class="tw-card k-${esc(s.kind || 'hold')}">
      <div class="tw-tag">${esc(b.badgeText || '')}${right}</div>
      ${isWin
    ? `<div class="tw-win-b">${avatar(winner, 54)}<div class="tw-body">${b.text}</div></div>`
    : `<div class="tw-body">${b.text}</div>`}
    </article>`;
  });

  if (sealed) {
    cards += idx >= steps.length
      ? sealCutCard(P, { standing: standing.length, unit: 'still on the wall', salt: ep.num || 0 })
      : `<div class="tw-locked">STILL UP THERE</div>`;
    cards += idx >= steps.length + 1 && winner
      ? sealIronyCard(P, { winner, avatar, esc, isHoh: true })
      : `<div class="tw-locked">STILL UP THERE</div>`;
  }

  const talk = Object.values(edges).reduce((n, e) => n + e.good + e.bad, 0);

  return `<div class="rp-page sigtalk">${_STYLE}
    <div class="tw-room"></div>
    <div class="tw-wrap">
      <div class="tw-head">
        <div class="tw-eyebrow">Final Head of Household · Part One</div>
        <div class="tw-title">Talk Them Down</div>
        <div class="tw-hours"><b>${idx < 0 ? 0 : hours}</b><i>HOURS ON THE WALL</i></div>
        <div class="tw-cond">${esc(idx < 0 ? 'three of them, and nowhere to go' : cond || 'the wall holds')}</div>
        ${comp.desc ? `<div class="tw-rules">${esc(comp.desc)}</div>` : ''}
      </div>

      <div class="tw-rig">
        <div>
          <div class="tw-tri">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
            ${nodes}
          </div>
          <div class="tw-legend">
            <span><i style="background:#7fae8b"></i>getting each other through it</span>
            <span><i style="background:#c05a5a"></i>working on each other</span>
            <span><i style="background:#e3b768"></i>an offer to come down</span>
          </div>
        </div>

        <div>
          <div style="font-size:11px;letter-spacing:2.6px;color:var(--tw-dim);text-transform:uppercase;margin-bottom:9px">
            ${idx < 0 ? 'nothing said yet'
    : sealed ? `${standing.length} still up when the feed cut`
      : `${standing.length} still up · ${talk} thing${talk === 1 ? '' : 's'} said`}
          </div>
          ${cards}
        </div>
      </div>

      <div class="tw-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}">Next hour</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Let it run</button>`}
        <span class="tw-count">${Math.min(total, Math.max(0, idx + 1))} / ${total}</span>
      </div>
    </div>
  </div>`;
}

export default rpBuildSigFinalWall;
