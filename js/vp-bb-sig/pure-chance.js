/**
 * Pure Chance — "THE BOARD"
 *
 * The one competition with nothing to be good at, so there is nothing to
 * instrument: no meter can rise, no resource can drain, and any HUD would be
 * measuring a thing that does not exist. What it has instead is a board, and
 * the board is the screen.
 *
 * Eight rows of pegs and nine slots, drawn at their real proportions. Each
 * revealed drop traces the ball's ACTUAL path — the same string of lefts and
 * rights the simulation rolled — and leaves its chip resting in the slot it
 * finished in. By the last card the board holds every chip in the competition,
 * stacked where they fell, which is a physical histogram of the night and the
 * only honest summary a crapshoot can have.
 *
 * The number to beat sits above it in lights and changes hands as the drops go
 * in, because the standing score is the entire drama of this format: everybody
 * after the first is dropping AT something, and the last houseguest to the mark
 * knows exactly what they need and can do absolutely nothing about it.
 *
 * Bright where the rest of the directory is not. A lit bone-white board on a
 * dark studio floor, hot pink and amber, the look of a game show that knows
 * it is one.
 */

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const P = 'pc';

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Manrope:wght@400;500;600&display=swap');
.sigdrop{--pc-ink:#141019;--pc-board:#f6f1e8;--pc-board2:#e4dbcb;--pc-hot:#e8398b;
  --pc-amber:#f5b229;--pc-cyan:#3fc9d6;--pc-dim:#8a8296;--pc-paper:#efe9f2;
  font-family:'Manrope',system-ui,sans-serif;color:var(--pc-paper);position:relative;overflow:clip}
.sigdrop .pc-floor{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(52% 34% at 50% -4%,rgba(232,57,139,.28),transparent 66%),
    radial-gradient(40% 30% at 12% 96%,rgba(63,201,214,.14),transparent 70%),
    radial-gradient(40% 30% at 88% 96%,rgba(245,178,41,.12),transparent 70%),
    linear-gradient(180deg,#120d18 0%,#1b1424 52%,#0d0912 100%)}
/* studio bloom */
.sigdrop .pc-bloom{position:absolute;inset:46px 0 auto 0;height:200px;z-index:1;pointer-events:none;
  background:radial-gradient(60% 100% at 50% 0%,rgba(255,255,255,.14),transparent 70%)}
.sigdrop .pc-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:3;padding-bottom:78px}

.sigdrop .pc-head{text-align:center;padding:15px 12px 13px;margin-top:10px;border-radius:3px;
  background:linear-gradient(180deg,rgba(38,26,48,.9),rgba(16,11,22,.8));border:1px solid rgba(232,57,139,.28)}
.sigdrop .pc-eyebrow{font-family:'Sora',sans-serif;font-size:10.5px;letter-spacing:6px;color:var(--pc-dim);text-transform:uppercase}
.sigdrop .pc-title{font-family:'Sora',sans-serif;font-size:38px;font-weight:700;letter-spacing:3px;
  margin:2px 0 9px;color:#fff;text-shadow:0 0 28px rgba(232,57,139,.6)}
.sigdrop .pc-beat{display:inline-flex;align-items:center;gap:12px;padding:7px 18px;border-radius:2px;
  border:1px solid rgba(245,178,41,.5);background:rgba(40,26,10,.75)}
.sigdrop .pc-beat b{font-family:'Sora',sans-serif;font-size:28px;font-weight:700;color:var(--pc-amber);
  font-variant-numeric:tabular-nums;text-shadow:0 0 18px rgba(245,178,41,.5)}
.sigdrop .pc-beat i{font-style:normal;font-size:9.5px;letter-spacing:2.6px;color:var(--pc-dim)}
.sigdrop .pc-rules{max-width:700px;margin:11px auto 0;padding:9px 13px;border-radius:3px;font-size:11.5px;
  line-height:1.6;color:#c3b8cc;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.09)}
.sigdrop .pc-noskill{margin:9px auto 0;font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:var(--pc-dim)}

/* ── the board ── */
.sigdrop .pc-rig{display:grid;grid-template-columns:minmax(0,1fr) 214px;gap:14px;margin:15px auto 0;align-items:start}
@media(max-width:880px){.sigdrop .pc-rig{grid-template-columns:1fr}}
.sigdrop .pc-boardwrap{padding:12px;border-radius:3px;background:linear-gradient(180deg,var(--pc-board),var(--pc-board2));
  box-shadow:0 14px 40px rgba(0,0,0,.55);border:1px solid rgba(20,16,25,.25)}
.sigdrop .pc-board{display:block;width:100%;height:auto}
.sigdrop .pc-queue{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
.sigdrop .pc-q{font-size:9.5px;letter-spacing:.6px;padding:3px 7px;border-radius:2px;
  background:rgba(20,16,25,.1);color:#4a4152;border:1px solid rgba(20,16,25,.14)}
.sigdrop .pc-q.done{background:rgba(20,16,25,.72);color:var(--pc-board);border-color:transparent}
.sigdrop .pc-q.now{background:var(--pc-hot);color:#fff;border-color:transparent;font-weight:700}

/* ── cards ── */
.sigdrop .pc-card{margin-bottom:9px;padding:11px 13px;border-radius:2px;background:rgba(30,21,38,.82);
  border:1px solid rgba(255,255,255,.08);border-left:3px solid var(--pc-hot);animation:pcIn .3s ease both}
@keyframes pcIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.sigdrop .pc-tag{font-family:'Sora',sans-serif;font-size:10px;letter-spacing:2.4px;color:var(--pc-dim);
  margin-bottom:5px;display:flex;align-items:center;gap:6px;font-weight:600}
.sigdrop .pc-body{font-size:12.8px;line-height:1.65;color:#d6cbdd}
.sigdrop .pc-card.k-order{border-left-color:var(--pc-cyan)}
.sigdrop .pc-card.k-drop{border-left-color:rgba(255,255,255,.22)}
.sigdrop .pc-card.k-last-up{border-left-color:var(--pc-cyan);background:rgba(14,40,44,.6)}
.sigdrop .pc-card.k-tie,.sigdrop .pc-card.k-tie-drop{border-left-color:var(--pc-amber);background:rgba(46,32,8,.55)}
.sigdrop .pc-card.k-win{border:1px solid rgba(245,178,41,.55);border-left:3px solid var(--pc-amber);
  background:linear-gradient(180deg,rgba(62,42,10,.75),rgba(18,12,22,.85))}
.sigdrop .pc-card.k-win .pc-tag{color:var(--pc-amber)}
.sigdrop .pc-card.k-unlucky{border-left-color:#6b6376;background:rgba(20,16,25,.6)}
.sigdrop .pc-card.k-unlucky .pc-body{font-style:italic;color:#a99fb2}
.sigdrop .pc-win-b{display:flex;align-items:center;gap:13px;margin-top:3px}
.sigdrop .pc-win-b .bb-av,.sigdrop .pc-win-b img{border-radius:3px;border:2px solid var(--pc-amber)}
.sigdrop .pc-locked{margin-bottom:9px;min-height:34px;border-radius:2px;border:1px dashed rgba(255,255,255,.13);
  display:grid;place-items:center;font-family:'Sora',sans-serif;font-size:10px;letter-spacing:4px;color:rgba(255,255,255,.2)}
.sigdrop .pc-cards{margin-top:14px}

/* ── side ── */
.sigdrop .pc-side{position:sticky;top:56px;padding:12px;border-radius:3px;background:rgba(26,18,34,.9);
  border:1px solid rgba(255,255,255,.1)}
.sigdrop .pc-side-h{font-family:'Sora',sans-serif;font-size:10.5px;letter-spacing:3px;font-weight:700;color:#fff}
.sigdrop .pc-side-s{font-size:10.5px;color:var(--pc-dim);margin:3px 0 10px;line-height:1.5}

/* Faces. The helper only sets width/height inline, so each screen carries the
   rest — otherwise a portrait renders as an unstyled box wherever the host
   page's global rule is not in scope. */
.sigdrop .bb-av{display:inline-grid;place-items:center;overflow:hidden;border-radius:3px;
  background:rgba(0,0,0,.25);flex:none;position:relative}
.sigdrop .bb-av img{width:100%;height:100%;object-fit:cover;display:block}
.sigdrop .bb-av i{position:absolute;inset:0;display:none;align-items:center;justify-content:center;
  font-style:normal;font-weight:700;font-size:11px;opacity:.75}

.sigdrop .pc-srow{display:flex;align-items:center;gap:7px;font-size:11.5px;margin-bottom:6px;color:#cfc4d6}
.sigdrop .pc-srow .bb-av{border:1px solid rgba(255,255,255,.2)}
.sigdrop .pc-q .bb-av{vertical-align:-3px;margin-right:3px;border-radius:2px}
.sigdrop .pc-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigdrop .pc-srow em{font-style:normal;font-size:11px;color:#fff;font-variant-numeric:tabular-nums;font-weight:600}
.sigdrop .pc-srow.is-lead em{color:var(--pc-amber)}
.sigdrop .pc-srow.is-big em{color:var(--pc-hot)}
.sigdrop .pc-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;
  align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(10,6,14,.42),rgba(10,6,14,.9));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(232,57,139,.3)}
.sigdrop .pc-count{font-family:'Sora',sans-serif;font-size:11px;letter-spacing:2.4px;color:var(--pc-dim)}
${sealCss(P, '#e8398b')}
@media(prefers-reduced-motion:reduce){
  .sigdrop *,.sigdrop *::before,.sigdrop *::after{animation:none!important;transition:none!important}
}
</style>`;

/** A stable colour per houseguest so a chip is readable without a label. */
function hueOf(name) {
  let h = 0;
  for (let i = 0; i < String(name).length; i++) h = (h * 31 + String(name).charCodeAt(i)) % 360;
  return h;
}

/**
 * The board, drawn at its real proportions, with the pegs the ball actually
 * hit and the chips already in their slots.
 */
function boardSvg({ rows, values, chips, activePath, activeName, sealed, esc }) {
  const slots = values.length;
  const W = 640;
  const H = 248;
  const padX = 26;
  const lane = (W - padX * 2) / slots;
  const topY = 26;
  const rowGap = 20;
  const floorY = topY + rows * rowGap + 14;

  // Pegs: staggered, one fewer on alternate rows, the standard arrangement.
  let pegs = '';
  for (let r = 0; r < rows; r++) {
    const n = slots - (r % 2 === 0 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const x = padX + lane * (i + (r % 2 === 0 ? 1 : 0.5));
      pegs += `<circle cx="${x.toFixed(1)}" cy="${topY + r * rowGap}" r="2.6" fill="#231b2c" opacity=".72"/>`;
    }
  }

  // The ball's real route: it starts centred and steps half a lane each row.
  let trace = '';
  if (activePath && !sealed) {
    let x = padX + lane * (slots / 2);
    const pts = [`${x.toFixed(1)},${(topY - 16).toFixed(1)}`];
    for (let r = 0; r < activePath.length; r++) {
      x += (activePath[r] === 'R' ? 1 : -1) * (lane / 2);
      pts.push(`${x.toFixed(1)},${(topY + r * rowGap + 6).toFixed(1)}`);
    }
    pts.push(`${x.toFixed(1)},${(floorY - 6).toFixed(1)}`);
    trace = `<polyline points="${pts.join(' ')}" fill="none" stroke="#e8398b" stroke-width="2.4"
        stroke-linejoin="round" stroke-linecap="round" opacity=".95"/>
      <circle cx="${x.toFixed(1)}" cy="${(floorY - 6).toFixed(1)}" r="6" fill="#e8398b" stroke="#fff" stroke-width="1.6"/>`;
  }

  // Slots, their values, and whatever has landed in them.
  let bins = '';
  for (let i = 0; i < slots; i++) {
    const x = padX + lane * i;
    const big = values[i] >= 400;
    const fill = big ? '#f5b229' : i === Math.floor(slots / 2) ? '#cfc6bb' : '#ded4c6';
    bins += `<rect x="${(x + 1.5).toFixed(1)}" y="${floorY}" width="${(lane - 3).toFixed(1)}" height="34"
        rx="2" fill="${fill}" opacity="${big ? '.95' : '.55'}"/>
      <text x="${(x + lane / 2).toFixed(1)}" y="${floorY + 22}" text-anchor="middle"
        font-family="Sora,sans-serif" font-size="13" font-weight="700"
        fill="${big ? '#4a2f00' : '#3b3242'}">${sealed ? '?' : values[i]}</text>`;

    // Chips stack upward out of the slot they fell into.
    const inSlot = (chips || []).filter(c => c.slot === i);
    inSlot.forEach((c, k) => {
      const cy = floorY - 9 - k * 11;
      bins += `<circle cx="${(x + lane / 2).toFixed(1)}" cy="${cy}" r="5"
        fill="hsl(${hueOf(c.name)} 68% 52%)" stroke="#231b2c" stroke-width="1.2"/>`;
    });
  }

  return `<svg class="pc-board" viewBox="0 0 ${W} ${H}" role="img"
      aria-label="${esc(activeName ? `${activeName}'s ball on the board` : 'the peg board')}">
    <rect x="0" y="0" width="${W}" height="${H}" fill="none"/>
    ${pegs}${trace}${bins}
  </svg>`;
}

export function rpBuildSigPureChance(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';

  const allSteps = comp.detail?.steps;
  const allBeats = (comp.beats || []).filter(b => b && b.text);
  // A season saved before the board was simulated has no drops to draw.
  if (!Array.isArray(allSteps) || allSteps.length !== allBeats.length || allSteps.length < 2) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const values = comp.detail?.board || [];
  const rows = Number(comp.detail?.rows) || 8;
  if (!values.length) return '';

  // ── the seal ──
  //
  // Every chip on the board is a score, so a sealed night cannot show the
  // board filling: it cuts after a couple of drops and masks the slot values
  // as well, because the values ARE the scoreboard.
  const sealed = isSealedHoh(act, actType);
  const limit = sealed
    ? planSeal(allSteps, { isResult: s => s.kind === 'win', countKind: 'drop', cap: 2 })
    : allSteps.length;

  const steps = allSteps.slice(0, limit);
  const beats = allBeats.slice(0, limit);
  const extra = sealed ? 2 : 0;
  const total = steps.length + extra;

  const stateKey = `bb_sig_drop_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const idx = Math.min(state.idx, total - 1);
  const done = idx >= total - 1;

  const winner = act.winner || comp.winner || null;
  const order = comp.detail?.order || [];

  // ── replay ──
  const chips = [];
  const scored = {};
  let lead = null;
  let activePath = null;
  let activeName = null;
  let dropped = 0;

  steps.slice(0, Math.max(0, idx + 1)).forEach((s, i) => {
    if (s.kind === 'drop') {
      chips.push({ name: s.who, slot: s.slot });
      scored[s.who] = s.value;
      dropped++;
      if (!lead || s.value > lead.value) lead = { name: s.who, value: s.value };
    }
    if ((s.kind === 'drop' || s.kind === 'tie-drop') && i === idx) {
      activePath = s.path || null;
      activeName = s.who || null;
    }
  });

  const nextUp = order[dropped] || null;

  // ── cards ──
  let cards = '';
  beats.forEach((b, i) => {
    if (i > idx) { cards += `<div class="pc-locked">TO DROP</div>`; return; }
    const s = steps[i] || {};
    const isWin = s.kind === 'win' && winner;
    cards += `<article class="pc-card k-${esc(s.kind || 'drop')}">
      <div class="pc-tag">${esc(b.badgeText || '')}</div>
      ${isWin
    ? `<div class="pc-win-b">${avatar(winner, 56)}<div class="pc-body">${b.text}</div></div>`
    : `<div class="pc-body">${b.text}</div>`}
    </article>`;
  });

  if (sealed) {
    cards += idx >= steps.length
      ? sealCutCard(P, { standing: null, salt: ep.num || 0 })
      : `<div class="pc-locked">TO DROP</div>`;
    cards += idx >= steps.length + 1 && winner
      ? sealIronyCard(P, { winner, avatar, esc, isHoh: true })
      : `<div class="pc-locked">TO DROP</div>`;
  }

  const queue = order.map((name, i) => {
    const cls = i < dropped ? 'done' : (name === nextUp && !done ? 'now' : '');
    return `<span class="pc-q ${cls}">${avatar(name, 14)}${esc(name)}${i < dropped && !sealed ? ` · ${scored[name] ?? ''}` : ''}</span>`;
  }).join('');

  const sideRows = Object.entries(scored)
    .sort((a, b) => b[1] - a[1])
    .map(([name, v]) => `<div class="pc-srow ${lead && name === lead.name ? 'is-lead' : ''} ${v >= 400 ? 'is-big' : ''}">
      ${avatar(name, 18)}
      <i style="width:9px;height:9px;border-radius:50%;flex:none;background:hsl(${hueOf(name)} 68% 52%)"></i>
      <span>${esc(name)}</span><em>${sealed ? MASK : v}</em></div>`).join('');

  return `<div class="rp-page sigdrop">${_STYLE}
    <div class="pc-floor"></div><div class="pc-bloom"></div>
    <div class="pc-wrap">
      <div class="pc-head">
        <div class="pc-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : actType === 'arena' ? 'The Arena' : 'Head of Household')}</div>
        <div class="pc-title">PURE CHANCE</div>
        <div class="pc-beat"><i>${idx < 0 || !lead ? 'NOTHING ON THE BOARD' : 'TO BEAT'}</i>
          <b>${idx < 0 || !lead ? '—' : sealed ? MASK : lead.value}</b>
          <i>${idx < 0 ? `${order.length} TO DROP` : sealed ? '' : `${dropped} OF ${order.length} DROPPED`}</i></div>
        ${comp.desc ? `<div class="pc-rules">${esc(comp.desc)}</div>` : ''}
        <div class="pc-noskill">No stats tested · nothing to throw · slop costs nothing here</div>
      </div>

      <div class="pc-rig">
        <div class="pc-boardwrap">
          ${boardSvg({ rows, values, chips: sealed ? [] : chips, activePath, activeName, sealed, esc })}
          <div class="pc-queue">${queue}</div>
        </div>
        <aside class="pc-side">
          <div class="pc-side-h">ON THE BOARD</div>
          <div class="pc-side-s">${idx < 0
    ? 'Nobody has dropped yet. There is nothing to know and nothing to work out.'
    : sealed
      ? 'The scores are not being reported tonight.'
      : lead ? `${lead.name} leads on ${lead.value}${nextUp ? `, ${nextUp} up next` : ''}.` : ''}</div>
          ${sideRows || '<div class="pc-side-s">—</div>'}
        </aside>
      </div>

      <div class="pc-cards">${cards}</div>

      <div class="pc-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}">Next drop</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Drop them all</button>`}
        <span class="pc-count">${Math.min(total, Math.max(0, idx + 1))} / ${total}</span>
      </div>
    </div>
  </div>`;
}

export default rpBuildSigPureChance;
