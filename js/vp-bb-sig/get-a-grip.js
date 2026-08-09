/**
 * Get A Grip — "THE LAST HAND"
 *
 * Six poles in a row, drawn to scale, with a hand on each one at the height it
 * let go from. That is the entire screen and it is the entire competition:
 * nothing attacks anybody here, nothing tilts, nothing sprays — the only thing
 * that happens is that hands stop being closed, one at a time, and the height
 * marks are where each of them stopped.
 *
 * So the furniture is a CLOCK FACE rather than a scoreboard. Minutes run up the
 * poles as gradations, the hands sit at their own minute, and the winner's pole
 * is the one still lit at the top. A viewer reads the result off the shape of
 * the row before reading a single name.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');
.siggrip{--gp-steel:#b9c4cf;--gp-pole:#7d8794;--gp-lit:#ffcf5c;--gp-skin:#e7c9a6;
  --gp-floor:#141a20;--gp-floor2:#0a0e12;--gp-ink:#eef3f7;--gp-dim:#8f9dab;
  font-family:'Barlow',system-ui,sans-serif;color:var(--gp-ink);position:relative;overflow:clip}
.siggrip .gp-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.siggrip .gp-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(60% 40% at 50% 0%,rgba(255,207,92,.10),transparent 64%),
             linear-gradient(180deg,var(--gp-floor),var(--gp-floor2) 78%,#05080a)}
/* the gym ceiling grid, faint */
.siggrip .gp-grid{position:absolute;inset:46px 0 auto 0;height:120px;z-index:1;pointer-events:none;opacity:.13;
  background:repeating-linear-gradient(90deg,transparent 0 46px,var(--gp-steel) 46px 47px)}

.siggrip .gp-head{text-align:center;padding:14px 8px 4px;position:relative;z-index:2}
.siggrip .gp-eyebrow{font-size:9.5px;letter-spacing:4px;color:var(--gp-dim);text-transform:uppercase}
.siggrip .gp-title{font-family:'Barlow Condensed',sans-serif;font-size:44px;font-weight:700;
  letter-spacing:3px;margin:2px 0 2px;color:#fff;text-transform:uppercase}
.siggrip .gp-sub{font-size:12.5px;color:#b9c9d6;max-width:460px;margin:0 auto}

/* ── the row of poles ── */
.siggrip .gp-yard{display:flex;gap:7px 6px;justify-content:center;align-items:flex-end;
  margin:16px auto 6px;padding:0 6px;flex-wrap:wrap;max-width:1040px}
.siggrip .gp-lane{width:68px;display:flex;flex-direction:column;align-items:center}
.siggrip .gp-srow.is-waiting{opacity:.42}
.siggrip .gp-srow.is-waiting em{color:var(--gp-dim);font-size:9.5px;letter-spacing:.6px}
.siggrip .gp-srow u{text-decoration:none;font-size:9px;letter-spacing:1px;color:#ff9d7a;opacity:.9}
.siggrip .gp-pole{position:relative;width:100%;height:186px;border-radius:8px;
  background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(0,0,0,.25));
  border:1px solid rgba(255,255,255,.07);overflow:hidden}
/* the pole itself */
.siggrip .gp-bar{position:absolute;left:50%;top:8px;bottom:8px;width:9px;transform:translateX(-50%);
  border-radius:5px;background:linear-gradient(90deg,#5d6773,var(--gp-pole) 40%,#cfd8e2 52%,var(--gp-pole) 66%,#4d5661)}
/* minute gradations */
.siggrip .gp-ticks{position:absolute;inset:8px 0;z-index:1;pointer-events:none;opacity:.30;
  background:repeating-linear-gradient(0deg,transparent 0 24px,var(--gp-steel) 24px 25px)}
/* the hand, at the height it let go */
.siggrip .gp-hand{position:absolute;left:50%;transform:translate(-50%,50%);z-index:3;
  width:34px;height:24px;transition:bottom .5s cubic-bezier(.3,1,.4,1)}
.siggrip .gp-hand svg{width:100%;height:100%;display:block}
.siggrip .gp-lane.is-win .gp-bar{background:linear-gradient(90deg,#7a6120,var(--gp-lit) 44%,#fff3cf 52%,var(--gp-lit) 62%,#6d5518);
  box-shadow:0 0 18px rgba(255,207,92,.45)}
.siggrip .gp-lane.is-thrown .gp-hand{opacity:.4}
.siggrip .gp-lane.is-hidden .gp-bar{opacity:.25}
.siggrip .gp-lane.is-hidden .gp-hand{display:none}
.siggrip .gp-mat{width:100%;height:9px;border-radius:0 0 8px 8px;background:linear-gradient(180deg,#2a333d,#171d23)}
.siggrip .gp-tag{margin-top:7px;text-align:center;width:100%}
.siggrip .gp-face{width:28px;height:28px;border-radius:50%;overflow:hidden;margin:0 auto 3px;
  border:1px solid rgba(255,255,255,.2)}
.siggrip .gp-face img{width:100%;height:100%;object-fit:cover}
.siggrip .gp-name{font-size:10.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.siggrip .gp-min{font-family:'Barlow Condensed',sans-serif;font-size:13px;color:var(--gp-lit);
  font-variant-numeric:tabular-nums;letter-spacing:.5px}
.siggrip .gp-lane.is-hidden .gp-min,.siggrip .gp-lane.is-hidden .gp-name{opacity:.25}
.siggrip .gp-lane.is-hidden .gp-face{filter:grayscale(1);opacity:.3}

/* ── the log ── */
.siggrip .gp-grid2{display:grid;grid-template-columns:minmax(0,1fr) 232px;gap:16px;
  align-items:start;margin-top:16px}
@media(max-width:860px){.siggrip .gp-grid2{grid-template-columns:1fr}}
.siggrip .gp-card{margin-bottom:10px;padding:11px 13px;border-radius:9px;
  border:1px solid rgba(255,255,255,.08);background:linear-gradient(160deg,rgba(24,31,38,.95),rgba(10,14,18,.96));
  animation:gpIn .3s ease both}
@keyframes gpIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.siggrip .gp-card-h{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.siggrip .gp-badge{margin-left:auto;font-size:8.5px;letter-spacing:2px;font-weight:700;padding:3px 8px;
  border-radius:999px;background:rgba(255,255,255,.09);color:var(--gp-dim)}
.siggrip .gp-badge.is-gold{background:rgba(255,207,92,.18);color:var(--gp-lit)}
.siggrip .gp-badge.is-red{background:rgba(224,90,74,.18);color:#ffb3a6}
.siggrip .gp-body{font-size:12.6px;line-height:1.62;color:#d5e0e8}
.siggrip .gp-locked{margin-bottom:10px;min-height:44px;border-radius:9px;
  border:1px dashed rgba(238,243,247,.13);display:grid;place-items:center;
  font-size:10px;letter-spacing:3px;color:rgba(238,243,247,.24)}

.siggrip .gp-side{position:sticky;top:56px;padding:12px;border-radius:9px;
  border:1px solid rgba(255,207,92,.2);background:linear-gradient(180deg,rgba(22,28,35,.96),rgba(8,11,15,.97))}
.siggrip .gp-side-h{font-size:10px;letter-spacing:2.2px;font-weight:700;color:var(--gp-lit)}
.siggrip .gp-side-s{font-size:10.5px;color:var(--gp-dim);margin:2px 0 10px;line-height:1.45}
.siggrip .gp-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:6px}
.siggrip .gp-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.siggrip .gp-srow em{font-style:normal;font-size:10.5px;color:var(--gp-lit);min-width:40px;text-align:right;
  font-variant-numeric:tabular-nums}
.siggrip .gp-srow.is-out{opacity:.45}
.siggrip .gp-win{margin-top:10px;text-align:center;padding:10px;border-radius:9px;
  border:1px solid var(--gp-lit);background:rgba(255,207,92,.1)}
.siggrip .gp-win-f{width:50px;height:50px;border-radius:50%;overflow:hidden;margin:0 auto 4px;
  border:2px solid var(--gp-lit)}
.siggrip .gp-win-f img{width:100%;height:100%;object-fit:cover}
.siggrip .gp-win b{display:block;font-size:13.5px}
.siggrip .gp-win i{font-style:normal;font-size:10.5px;color:var(--gp-dim)}
.siggrip .gp-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;
  justify-content:center;align-items:center;padding:10px 12px;
  background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.74));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.siggrip .gp-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;
  line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.siggrip .gp-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:9px auto 2px;max-width:720px}
.siggrip .gp-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.siggrip .gp-w i{font-style:normal}
.siggrip .gp-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.siggrip .gp-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.siggrip .gp-w u{text-decoration:none;opacity:.75}
.siggrip .gp-w.is-spread{opacity:.7;font-style:italic}
/* The shared avatar helper returns its own sized element, so the circle only
   has to clip it — sizing it twice is what left the poles with empty faces. */
.siggrip .gp-face .bb-av,.siggrip .gp-win-f .bb-av{width:100%!important;height:100%!important}
.siggrip .gp-face .bb-av img,.siggrip .gp-win-f .bb-av img{width:100%;height:100%;object-fit:cover}
@media(prefers-reduced-motion:reduce){.siggrip *{animation:none!important;transition:none!important}}
</style>`;

/** A hand closed round a pole, seen from the side. */
const HAND = `<svg viewBox="0 0 34 24" aria-hidden="true">
  <path d="M4 12c0-4 3-7 7-7h9c4 0 7 2.6 7 6s-3 6-7 6h-9c-4 0-7-1.6-7-5z" fill="#e7c9a6"/>
  <path d="M11 5.4h9c3.6 0 6.4 2.3 6.4 5.3H11z" fill="#d8b58c"/>
  <path d="M9 10.5h17M9 14h17" stroke="#c39d74" stroke-width="1" opacity=".7"/>
</svg>`;

const esc0 = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * The dispatcher hands every signature screen the EPISODE and the act type, not
 * the competition — see `_BB_SIG_BUILDERS` in vp-screens.js — so the comp is
 * looked up here and a secret competition draws nothing at all.
 */
export function rpBuildSigGetAGrip(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const runs = comp?.detail?.runs;
  // DECLINES RATHER THAN DRAWS AN EMPTY YARD. A season saved before the detail
  // existed still resolves to this variant, and a screen with no minutes on it
  // is worse than the generic board.
  if (!Array.isArray(runs) || !runs.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const reveal = typeof u.reveal === 'function' ? u.reveal : null;
  const tv = u.tvState || {};
  const key = `bb_sig_grip_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tv[key]) tv[key] = { idx: -1 };
  const at = Number.isFinite(tv[key].idx) ? tv[key].idx : -1;

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';
  const total = beats.length;
  const done = at >= total - 1;
  const longest = Math.max(...runs.map(r => Number(r.minutes) || 0), 1);

  /* EVERY HOUSEGUEST GETS A POLE.
     Eight lanes was the wrong fix for a row that was too wide — a competition
     seventeen people played that draws eight of them is not a picture of it.
     The poles are narrower and the row wraps instead, so a full house fits and
     the shape of the yard emptying is still the thing you see first. */
  // Poles are drawn in the order they came DOWN — first out on the left — so
  // the row reads left to right as the competition actually emptied.
  const lanes = [...runs].reverse().map((r) => {
    // Resolved by the card that put them on the mat, not by the end of the log,
    // so the yard empties in front of the viewer one hand at a time.
    const shown = at >= (Number(r.revealAt) ?? 0);
    const pct = Math.max(6, Math.min(96, ((Number(r.minutes) || 0) / longest) * 92));
    const isWin = r.name === runs[0].name && shown;
    return `<div class="gp-lane ${isWin && shown ? 'is-win' : ''} ${r.threw ? 'is-thrown' : ''} ${shown ? '' : 'is-hidden'}">
      <div class="gp-pole">
        <div class="gp-bar"></div><div class="gp-ticks"></div>
        <div class="gp-hand" style="bottom:${pct}%">${HAND}</div>
      </div>
      <div class="gp-mat"></div>
      <div class="gp-tag">
        <div class="gp-face">${avatar(r.name, 28)}</div>
        <div class="gp-name">${esc(r.name)}</div>
        <div class="gp-min">${shown ? `${Number(r.minutes).toFixed(0)}m` : '—'}</div>
      </div>
    </div>`;
  }).join('');

  const cards = beats.map((b, i) => i > at
    ? `<div class="gp-locked">STILL HANGING</div>`
    : `<div class="gp-card">
        <div class="gp-card-h">${(b.players || []).slice(0, 2).map(n => avatar(n, 26)).join('')}
          <span class="gp-badge ${b.badgeClass === 'gold' ? 'is-gold' : b.badgeClass === 'red' ? 'is-red' : ''}">${esc(b.badgeText || '')}</span></div>
        <div class="gp-body">${esc(b.text)}</div>
      </div>`).join('');

  /* THE BOARD WAS PRINTING THE WHOLE RESULT BEFORE A SINGLE CARD TURNED.
     Eighteen names in finishing order with their minutes beside them, sitting
     next to a log that still said STILL HANGING — the competition was over on
     arrival and the reveal was decoration. The order is the answer here, so
     until the log is finished this shows the field alphabetically with no
     times against it, and only then becomes the result. */
  /* THE BOARD FILLS AS THE YARD EMPTIES.
     It printed the whole finishing order at once, which spoiled the reveal;
     then it printed nothing until the end, which meant it never moved. Both
     were wrong. Each houseguest's line resolves on the card that resolves
     them, so the board is a live record of who is already down rather than
     either a spoiler or a wall of dashes.
     `spend` is the interesting number and the only place it is visible: a
     houseguest under about 0.9 stepped down with real time still in the arm. */
  const board = runs.map((r, i) => {
    const shown = at >= (Number(r.revealAt) ?? 0);
    if (!shown) {
      return `<div class="gp-srow is-waiting"><span>${esc(r.name)}</span><em>on the pole</em></div>`;
    }
    const soft = Number(r.spend) > 0 && Number(r.spend) < 0.9;
    return `<div class="gp-srow ${r.threw ? 'is-out' : ''}">
      <span>${i + 1}. ${esc(r.name)}${soft ? ' <u>had more</u>' : ''}</span>
      <em>${Number(r.minutes).toFixed(0)}m</em>
    </div>`;
  }).join('');
  const downCount = runs.filter(r => at >= (Number(r.revealAt) ?? 0)).length;

  const winner = runs[0];
  return `${_STYLE}<div class="rp-page siggrip">
    <div class="gp-bg"></div><div class="gp-grid"></div>
    <div class="gp-wrap">
      <div class="gp-head">
        <div class="gp-eyebrow">Week ${esc(ep?.num || '')} &middot; ${actType === 'hoh' ? 'Head of Household' : 'Power of Veto'}</div>
        <div class="gp-title">Get A Grip</div>
        <div class="gp-sub">Poles, hands, and nothing at all happening to any of them. The last hand
          still closed takes it.</div>
        ${comp.desc ? `<div class="gp-rules">${esc(comp.desc)}</div>` : ''}
        ${(() => {
          /* THE FORMULA, ON THE PAGE.
             Every other signature screen prints what the competition actually
             reads and this one did not, so there was no way to look at a result
             and check it against the profile behind it. `swingBy` is drawn
             apart from the weights on purpose: a stat that widens the SPREAD
             does not make a houseguest better at this, it makes them less
             predictable, and putting it in the same bar would say the
             opposite. */
          const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
          if (!w.length) return '';
          const bars = w.map(([k, v]) =>
            `<span class="gp-w"><i>${esc(k)}</i><span class="gp-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('');
          const swing = Object.keys(comp.roles?.steadiness || comp.roles?.nerve || {})[0];
          const spread = swing
            ? `<span class="gp-w is-spread" title="Widens the spread rather than raising the score"><i>&plusmn; ${esc(swing)}</i><u>consistency</u></span>`
            : '';
          return `<div class="gp-weights">${bars}${spread}</div>`;
        })()}
      </div>

      <div class="gp-yard">${lanes}</div>

      <div class="gp-grid2">
        <div>${cards}</div>
        <div class="gp-side">
          <div class="gp-side-h">${done ? 'TIME OFF THE FLOOR' : 'THE YARD'}</div>
          <div class="gp-side-s">${done
    ? 'Nobody was knocked down. Every one of these is a hand that opened.'
    : `${downCount} of ${runs.length} down. Nobody is being knocked off — they are letting go.`}</div>
          ${board}
          ${done ? `<div class="gp-win">
            <div class="gp-win-f">${avatar(winner.name, 50)}</div>
            <b>${esc(winner.name)}</b>
            <i>${Number(winner.minutes).toFixed(0)} minutes, last hand closed</i>
          </div>` : ''}
        </div>
      </div>

    </div>
    ${reveal ? `<div class="gp-ctl">
      ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, key, at + 1)}">Next to drop</button>`}
      ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, key, total - 1)}">Reveal all</button>`}
      <span style="font-size:10px;letter-spacing:1px;color:#8f9dab">${Math.min(total, at + 1)} / ${total}</span>
    </div>` : ''}
  </div>`;
}
