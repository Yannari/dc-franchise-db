/**
 * Cut and Cover — "THE BOARDS"
 *
 * The competition's own rule is that every board is public: they are set close
 * enough together that everybody can see how far everybody else has got. So the
 * screen is not a leaderboard with names on it — it is the boards themselves,
 * all of them, side by side, exactly the way the yard sees them. Watching this
 * screen should feel like standing in that row.
 *
 * Each houseguest gets a real thirty-tile board that fills in as they place.
 * Their tiles carry their own hue, so the mosaic tells you who is who at a
 * glance without reading a single name, and a teardown visibly empties a third
 * of somebody's board in one step.
 *
 * WHAT THE SCREEN DELIBERATELY DOES NOT SHOW: the forced pieces. The whole
 * point of the competition is that a piece which nearly fits looks exactly like
 * progress — to the room, to the camera and to the houseguest who placed it —
 * right up until the board jams. Drawing the bad tiles in a different colour
 * would hand the viewer information the competition is built on withholding,
 * and the teardown would stop being a surprise. The debt is in the data, it is
 * in the Debug tab, and it is not on the board.
 *
 * Everything else in this directory is a dark screen. This one is lit like a
 * daytime craft table: a dark self-healing cutting mat with its printed grid,
 * bone-white boards laid on top of it, and saturated tiles. Nothing here is
 * borrowed from another screen.
 */

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const P = 'cv';

const ICONS = {
  piece: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 4h6a2 2 0 1 1 4 0h6v6a2 2 0 1 0 0 4v6h-6a2 2 0 1 0-4 0H4v-6a2 2 0 1 1 0-4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/></svg>`,
  block: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m6.5 6.5 11 11" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  warn: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 4.5 21 19H3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 10v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1" fill="currentColor"/></svg>`,
  break: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M13 2 5 13h5l-1 9 9-12h-5Z" fill="currentColor"/></svg>`,
  buzz: `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="12" cy="13" r="6.5" fill="currentColor"/><path d="M12 3v2M4 6l1.6 1.4M20 6l-1.6 1.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
};

/** A stable hue per houseguest, so a board is recognisable without its label. */
function hueOf(name) {
  let h = 0;
  for (let i = 0; i < String(name).length; i++) h = (h * 31 + String(name).charCodeAt(i)) % 360;
  return h;
}

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Public+Sans:wght@400;500;600&display=swap');
.sigcut{--cv-mat:#16342e;--cv-mat2:#0f2622;--cv-grid:rgba(120,220,200,.16);
  --cv-board:#f2ece0;--cv-board2:#e2dac9;--cv-ink:#16211d;--cv-dim:#5d6f68;
  --cv-cut:#d4553f;--cv-go:#2f8f66;--cv-mark:#e8b23c;
  font-family:'Public Sans',system-ui,sans-serif;color:var(--cv-ink);position:relative;overflow:clip}

/* the cutting mat, with its printed grid and its measuring edge */
.sigcut .cv-mat{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    repeating-linear-gradient(0deg,var(--cv-grid) 0 1px,transparent 1px 26px),
    repeating-linear-gradient(90deg,var(--cv-grid) 0 1px,transparent 1px 26px),
    radial-gradient(70% 45% at 50% 0%,rgba(190,255,235,.10),transparent 62%),
    linear-gradient(180deg,var(--cv-mat) 0%,var(--cv-mat2) 100%)}
.sigcut .cv-ruler{position:absolute;top:46px;left:0;right:0;height:14px;z-index:1;pointer-events:none;
  background:repeating-linear-gradient(90deg,rgba(200,240,228,.32) 0 1px,transparent 1px 13px);opacity:.55}
.sigcut .cv-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:3;padding-bottom:78px}

/* ── head ── */
.sigcut .cv-head{text-align:center;padding:15px 12px 13px;margin-top:14px;border-radius:2px;
  background:linear-gradient(180deg,var(--cv-board),var(--cv-board2));
  box-shadow:0 10px 26px rgba(0,0,0,.4);border:1px solid rgba(20,32,28,.16)}
.sigcut .cv-eyebrow{font-family:'Outfit',sans-serif;font-size:11px;letter-spacing:6px;color:var(--cv-dim);text-transform:uppercase}
.sigcut .cv-title{font-family:'Outfit',sans-serif;font-size:37px;font-weight:700;letter-spacing:2px;
  margin:2px 0 8px;color:var(--cv-ink)}
.sigcut .cv-pass{display:inline-flex;align-items:center;gap:10px;padding:6px 15px;border-radius:2px;
  background:var(--cv-ink);color:var(--cv-board)}
.sigcut .cv-pass b{font-family:'Outfit',sans-serif;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}
.sigcut .cv-pass i{font-style:normal;font-size:9.5px;letter-spacing:2.6px;opacity:.75}
.sigcut .cv-rules{max-width:700px;margin:11px auto 0;padding:9px 13px;border-radius:2px;font-size:11.5px;
  line-height:1.6;color:#44534d;background:rgba(20,32,28,.06);border:1px solid rgba(20,32,28,.1)}
.sigcut .cv-weights{display:flex;gap:11px;justify-content:center;flex-wrap:wrap;margin:9px auto 0;max-width:740px}
.sigcut .cv-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--cv-dim)}
.sigcut .cv-wb{width:44px;height:4px;border-radius:2px;background:rgba(20,32,28,.14);overflow:hidden}
.sigcut .cv-wb b{display:block;height:100%;background:var(--cv-ink)}
.sigcut .cv-w.is-spread{font-style:italic;text-transform:none;letter-spacing:.4px;opacity:.75}

/* ── the row of boards ── */
.sigcut .cv-boards{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:11px;
  margin:16px auto 6px}
.sigcut .cv-bd{padding:8px 8px 6px;border-radius:2px;background:linear-gradient(180deg,var(--cv-board),var(--cv-board2));
  box-shadow:0 6px 16px rgba(0,0,0,.34);border:1px solid rgba(20,32,28,.18)}
.sigcut .cv-tiles{display:grid;grid-template-columns:repeat(6,1fr);gap:2px;margin-bottom:6px}
.sigcut .cv-tiles i{display:block;aspect-ratio:1;border-radius:1.5px;background:rgba(20,32,28,.07);
  box-shadow:inset 0 0 0 1px rgba(20,32,28,.07);transition:background .35s ease}
.sigcut .cv-tiles i.on{box-shadow:inset 0 0 0 1px rgba(255,255,255,.35),0 1px 2px rgba(0,0,0,.18)}
.sigcut .cv-bd.is-tear .cv-tiles i{animation:cvShake .4s ease both}
@keyframes cvShake{0%,100%{transform:none}30%{transform:translate(1px,-1px)}60%{transform:translate(-1px,1px)}}
.sigcut .cv-bd-n{display:flex;align-items:baseline;gap:5px;font-size:10.5px;font-weight:600;color:var(--cv-ink)}
.sigcut .cv-bd-n span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigcut .cv-bd-n em{font-style:normal;font-size:9.5px;color:var(--cv-dim);font-variant-numeric:tabular-nums}
.sigcut .cv-bd.is-done{outline:2px solid var(--cv-mark);outline-offset:1px}
.sigcut .cv-bd.is-tear{outline:2px solid var(--cv-cut);outline-offset:1px}
.sigcut .cv-flag{font-size:8.5px;letter-spacing:1.4px;text-transform:uppercase;color:var(--cv-dim);min-height:11px}
.sigcut .cv-flag.is-copy{color:var(--cv-go)}
.sigcut .cv-flag.is-block{color:var(--cv-cut)}

/* ── cards ── */
.sigcut .cv-grid{display:grid;grid-template-columns:minmax(0,1fr) 228px;gap:16px;align-items:start;margin-top:14px}
@media(max-width:880px){.sigcut .cv-grid{grid-template-columns:1fr}}
.sigcut .cv-card{margin-bottom:9px;padding:11px 13px;border-radius:2px;background:var(--cv-board);
  border-left:3px solid rgba(20,32,28,.3);box-shadow:0 4px 12px rgba(0,0,0,.28);animation:cvIn .3s ease both}
@keyframes cvIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.sigcut .cv-tag{font-family:'Outfit',sans-serif;font-size:10px;letter-spacing:2.4px;color:var(--cv-dim);
  margin-bottom:5px;display:flex;align-items:center;gap:6px;font-weight:600}
.sigcut .cv-body{font-size:12.8px;line-height:1.65;color:#28352f}
.sigcut .cv-card.k-teardown{border-left-color:var(--cv-cut);background:linear-gradient(180deg,#f6ddd6,var(--cv-board))}
.sigcut .cv-card.k-teardown .cv-tag{color:var(--cv-cut)}
.sigcut .cv-card.k-warn{border-left-color:var(--cv-go);background:linear-gradient(180deg,#dcefe4,var(--cv-board))}
.sigcut .cv-card.k-warn .cv-tag{color:var(--cv-go)}
.sigcut .cv-card.k-copy{border-left-color:var(--cv-go)}
.sigcut .cv-card.k-block,.sigcut .cv-card.k-blocked{border-left-color:var(--cv-cut)}
.sigcut .cv-card.k-forced,.sigcut .cv-card.k-panic,.sigcut .cv-card.k-struggle,.sigcut .cv-card.k-threw{
  background:rgba(242,236,224,.82)}
.sigcut .cv-card.k-forced .cv-body,.sigcut .cv-card.k-struggle .cv-body{font-style:italic;color:#4a5852}
.sigcut .cv-card.k-win,.sigcut .cv-card.k-horn{border-left-color:var(--cv-mark);
  background:linear-gradient(180deg,#f7e8c6,var(--cv-board))}
.sigcut .cv-card.k-win .cv-tag{color:#9a6f11}
.sigcut .cv-win-b{display:flex;align-items:center;gap:13px;margin-top:3px}
.sigcut .cv-win-b .bb-av,.sigcut .cv-win-b img{border-radius:2px;border:2px solid var(--cv-mark)}
.sigcut .cv-locked{margin-bottom:9px;min-height:34px;border-radius:2px;border:1px dashed rgba(200,235,222,.22);
  display:grid;place-items:center;font-family:'Outfit',sans-serif;font-size:10px;letter-spacing:4px;
  color:rgba(210,240,230,.3)}

/* ── side ── */
.sigcut .cv-side{position:sticky;top:56px;padding:12px;border-radius:2px;background:var(--cv-board);
  box-shadow:0 6px 18px rgba(0,0,0,.3)}
.sigcut .cv-side-h{font-family:'Outfit',sans-serif;font-size:11px;letter-spacing:3px;font-weight:700;color:var(--cv-ink)}
.sigcut .cv-side-s{font-size:10.5px;color:var(--cv-dim);margin:3px 0 10px;line-height:1.5}
.sigcut .cv-srow{display:flex;align-items:center;gap:7px;font-size:11.5px;margin-bottom:6px;color:#2c3a34}
.sigcut .cv-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigcut .cv-chip{width:9px;height:9px;border-radius:1.5px;flex:none}
.sigcut .cv-srow em{font-style:normal;font-size:10px;color:var(--cv-dim);min-width:36px;text-align:right;
  font-variant-numeric:tabular-nums}
.sigcut .cv-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;
  align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(8,20,17,.45),rgba(8,20,17,.9));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(120,220,200,.22)}
.sigcut .cv-count{font-family:'Outfit',sans-serif;font-size:11px;letter-spacing:2.4px;color:#9fb8b0}
${sealCss(P, '#2f8f66')}
@media(prefers-reduced-motion:reduce){
  .sigcut *,.sigcut *::before,.sigcut *::after{animation:none!important;transition:none!important}
}
</style>`;

const kindClass = step => `k-${step.kind || 'progress'}`;

export function rpBuildSigCutAndCover(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';

  const allSteps = comp.detail?.steps;
  const allBeats = (comp.beats || []).filter(b => b && b.text);
  // A season saved before the rebuild has no boards to draw.
  if (!Array.isArray(allSteps) || allSteps.length !== allBeats.length || allSteps.length < 2) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const TILES = Number(comp.detail?.tiles) || 30;

  // ── the seal ──
  //
  // Nobody is eliminated here, so there is no survivor count to cut on: the
  // result is a NUMBER, and thirty boards filling at different rates rank the
  // whole field however the text is worded. The cut lands early and every
  // count goes behind a mask, boards included.
  const sealed = isSealedHoh(act, actType);
  const limit = sealed
    ? planSeal(allSteps, {
      isResult: s => s.kind === 'win' || s.kind === 'horn',
      countKind: 'progress',
      cap: 4,
    })
    : allSteps.length;

  const steps = allSteps.slice(0, limit);
  const beats = allBeats.slice(0, limit);
  const extra = sealed ? 2 : 0;
  const total = steps.length + extra;

  const stateKey = `bb_sig_cut_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const idx = Math.min(state.idx, total - 1);
  const done = idx >= total - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;
  const roster = ((act.participants && act.participants.length ? act.participants : comp.placements) || [])
    .filter(Boolean);

  // ── replay ──
  let placed = Object.fromEntries(roster.map(n => [n, 0]));
  let pass = 0;
  let tearing = null;          // whose board just came apart, for one step
  const copiedFrom = {};
  const blocking = new Set();
  let buzzed = null;

  steps.slice(0, Math.max(0, idx + 1)).forEach((s, i) => {
    if (s.placed && Object.keys(s.placed).length) placed = { ...placed, ...s.placed };
    if (Number.isFinite(s.pass) && s.pass > 0) pass = s.pass;
    if (s.kind === 'copy') copiedFrom[s.who] = s.from;
    if (s.kind === 'block') blocking.add(s.who);
    if (s.kind === 'win') buzzed = s.who;
    tearing = s.kind === 'teardown' && i === idx ? s.who : (i === idx ? null : tearing);
  });

  // ── the boards ──
  const boards = roster.map(name => {
    const n = sealed ? Math.min(TILES, 9) : Math.max(0, Math.min(TILES, Math.round(Number(placed[name]) || 0)));
    const hue = hueOf(name);
    const tiles = Array.from({ length: TILES }, (_, i) =>
      `<i class="${i < n ? 'on' : ''}"${i < n ? ` style="background:hsl(${hue} 58% 52%)"` : ''}></i>`).join('');
    const flag = copiedFrom[name] ? `<span class="cv-flag is-copy">method: ${esc(copiedFrom[name])}</span>`
      : blocking.has(name) ? `<span class="cv-flag is-block">board covered</span>`
        : `<span class="cv-flag"></span>`;
    return `<div class="cv-bd ${buzzed === name ? 'is-done' : ''} ${tearing === name ? 'is-tear' : ''}">
      <div class="cv-tiles">${tiles}</div>
      <div class="cv-bd-n"><span>${esc(name)}</span><em>${sealed ? MASK : `${n}/${TILES}`}</em></div>
      ${flag}
    </div>`;
  }).join('');

  // ── cards ──
  let cards = '';
  beats.forEach((b, i) => {
    if (i > idx) { cards += `<div class="cv-locked">WORKING</div>`; return; }
    const s = steps[i] || {};
    const icon = s.kind === 'teardown' ? ICONS.break
      : s.kind === 'copy' || s.kind === 'panic' || s.kind === 'blocked' ? ICONS.eye
        : s.kind === 'block' ? ICONS.block
          : s.kind === 'warn' ? ICONS.warn
            : s.kind === 'win' ? ICONS.buzz
              : ICONS.piece;
    const right = s.pass ? `<span style="margin-left:auto;opacity:.6">PASS ${esc(String(s.pass))}</span>` : '';
    const isWin = s.kind === 'win' && winner;
    cards += `<article class="cv-card ${kindClass(s)}">
      <div class="cv-tag">${icon}${esc(b.badgeText || '')}${right}</div>
      ${isWin
    ? `<div class="cv-win-b">${avatar(winner, 56)}<div class="cv-body">${b.text}</div></div>`
    : `<div class="cv-body">${b.text}</div>`}
    </article>`;
  });

  if (sealed) {
    cards += idx >= steps.length
      ? sealCutCard(P, { standing: null, salt: ep.num || 0 })
      : `<div class="cv-locked">WORKING</div>`;
    cards += idx >= steps.length + 1 && winner
      ? sealIronyCard(P, { winner, avatar, esc, isHoh: true })
      : `<div class="cv-locked">WORKING</div>`;
  }

  // ── side ──
  const sideRows = roster.slice()
    .sort((a, b) => (Number(placed[b]) || 0) - (Number(placed[a]) || 0))
    .slice(0, 10)
    .map(name => `<div class="cv-srow">
      <i class="cv-chip" style="background:hsl(${hueOf(name)} 58% 52%)"></i>
      <span>${esc(name)}</span>
      <em>${idx < 0 ? '—' : sealed ? MASK : `${Math.round(Number(placed[name]) || 0)}/${TILES}`}</em></div>`).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
  const totalPlaced = sealed ? 0 : roster.reduce((n, x) => n + (Number(placed[x]) || 0), 0);

  return `<div class="rp-page sigcut">${_STYLE}
    <div class="cv-mat"></div><div class="cv-ruler"></div>
    <div class="cv-wrap">
      <div class="cv-head">
        <div class="cv-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : actType === 'arena' ? 'The Arena' : 'Head of Household')}</div>
        <div class="cv-title">CUT AND COVER</div>
        <div class="cv-pass">${ICONS.piece}<b>${idx < 0 ? 0 : pass}</b><i>PASSES IN</i>
          <b style="margin-left:8px">${sealed ? '—' : totalPlaced}</b><i>PIECES ON THE BOARDS</i></div>
        ${comp.desc ? `<div class="cv-rules">${esc(comp.desc)}</div>` : ''}
        ${weights.length ? `<div class="cv-weights">
          ${weights.map(([k, v]) => `<span class="cv-w"><i>${esc(k)}</i><span class="cv-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u style="text-decoration:none;opacity:.75">${Math.round(v * 100)}%</u></span>`).join('')}
          ${comp.spreadStat ? `<span class="cv-w is-spread"><i>± ${esc(comp.spreadStat)}</i><u style="text-decoration:none">consistency</u></span>` : ''}
          ${comp.effectStats?.label ? `<span class="cv-w is-spread"><i>${esc(comp.effectStats.label)}</i></span>` : ''}
        </div>` : ''}
      </div>

      <div class="cv-boards">${boards}</div>

      <div class="cv-grid">
        <div>${cards}</div>
        <aside class="cv-side">
          <div class="cv-side-h">ON THE BOARDS</div>
          <div class="cv-side-s">${idx < 0
    ? `${roster.length} boards, ${TILES} pieces each, and nothing to stop anybody looking at anybody.`
    : sealed
      ? 'The counts are not being reported tonight.'
      : `Pass ${pass}. Forced pieces do not show on a board — that is the competition.`}</div>
          ${sideRows}
          ${done && winner && !sealed ? `<div style="margin-top:11px;text-align:center;padding:10px;border-radius:2px;border:1px solid rgba(232,178,60,.6);background:rgba(232,178,60,.14)">
            <div style="width:50px;height:50px;border-radius:2px;overflow:hidden;margin:0 auto 6px;border:2px solid var(--cv-mark)">${avatar(winner, 50)}</div>
            <b style="display:block;font-size:13px">${esc(winner)}</b>
            <i style="font-style:normal;font-size:10.5px;color:var(--cv-dim)">${Number(breakdown[winner]?.forced) || 0} forced, ${Number(breakdown[winner]?.piecesLost) || 0} taken back out</i></div>` : ''}
        </aside>
      </div>

      <div class="cv-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}">Next piece</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Build it out</button>`}
        <span class="cv-count">${Math.min(total, Math.max(0, idx + 1))} / ${total}</span>
      </div>
    </div>
  </div>`;
}

export default rpBuildSigCutAndCover;
