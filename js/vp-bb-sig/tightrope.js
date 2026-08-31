/**
 * Tightrope — "THE FAR PLATFORM"
 *
 * One rope, drawn across the screen, with every houseguest strung along it at
 * the point they stopped. The wiki rule is "reach one end of a tightrope to
 * another without falling" — one crossing, not a lap count — so the screen is a
 * MAP rather than a scoreboard: two platforms, twelve metres of rope between
 * them, and a row of faces frozen wherever the net caught them.
 *
 * The net is drawn underneath and it is the only busy thing on the page,
 * because falling is the whole competition. Every houseguest carries their fall
 * count as a tally under their marker, and the one who is across is the only
 * one standing on the far platform.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&family=Karla:wght@400;500;700&display=swap');
.sigrope{--tr-sky:#101a26;--tr-sky2:#070c12;--tr-rope:#d8c9a8;--tr-net:#4a5a6b;
  --tr-lit:#63d2ff;--tr-warn:#ff7a6b;--tr-ink:#eaf2f8;--tr-dim:#8ba0b3;
  font-family:'Karla',system-ui,sans-serif;color:var(--tr-ink);position:relative;overflow:clip}
.sigrope .tr-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigrope .tr-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(80% 50% at 50% 0%,rgba(99,210,255,.10),transparent 66%),
             linear-gradient(180deg,var(--tr-sky),var(--tr-sky2) 74%,#04070a)}
.sigrope .tr-head{text-align:center;padding:14px 8px 4px}
.sigrope .tr-eyebrow{font-size:9.5px;letter-spacing:4px;color:var(--tr-dim);text-transform:uppercase}
.sigrope .tr-title{font-family:'Oswald',sans-serif;font-size:42px;font-weight:600;letter-spacing:4px;
  margin:2px 0;text-transform:uppercase;color:#fff}
.sigrope .tr-sub{font-size:12.5px;color:#a9c2d4;max-width:470px;margin:0 auto}

/* ── the span ── */
.sigrope .tr-span{position:relative;margin:22px 10px 6px;height:210px}
.sigrope .tr-plat{position:absolute;bottom:56px;width:56px;height:14px;border-radius:3px;
  background:linear-gradient(180deg,#5b6a78,#2b353f);border:1px solid rgba(255,255,255,.14)}
.sigrope .tr-plat.is-start{left:0}
.sigrope .tr-plat.is-end{right:0}
.sigrope .tr-plat b{position:absolute;left:50%;transform:translateX(-50%);bottom:-17px;
  font-size:8.5px;letter-spacing:2px;color:var(--tr-dim);white-space:nowrap}
/* the rope itself */
.sigrope .tr-line{position:absolute;left:52px;right:52px;bottom:63px;height:3px;border-radius:2px;
  background:linear-gradient(90deg,#8d7c58,var(--tr-rope) 12%,var(--tr-rope) 88%,#8d7c58);
  box-shadow:0 0 12px rgba(216,201,168,.25)}
/* the net below, which is where most of this competition happens */
.sigrope .tr-net{position:absolute;left:44px;right:44px;bottom:6px;height:44px;opacity:.5;
  border:1px solid rgba(74,90,107,.5);border-radius:4px;
  background:repeating-linear-gradient(45deg,transparent 0 9px,var(--tr-net) 9px 10px),
             repeating-linear-gradient(-45deg,transparent 0 9px,var(--tr-net) 9px 10px)}
/* a houseguest, where they stopped */
.sigrope .tr-peg{position:absolute;bottom:70px;transform:translateX(-50%);text-align:center;width:52px;
  transition:left .55s cubic-bezier(.3,1,.4,1)}
.sigrope .tr-peg .tr-face{width:32px;height:32px;border-radius:50%;overflow:hidden;margin:0 auto;
  border:2px solid rgba(255,255,255,.22);background:#0b1118}
.sigrope .tr-peg .tr-face img{width:100%;height:100%;object-fit:cover}
.sigrope .tr-peg b{display:block;font-size:10px;font-weight:700;margin-top:3px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigrope .tr-peg i{display:block;font-style:normal;font-size:9px;color:var(--tr-warn);letter-spacing:.4px}
.sigrope .tr-peg.is-across .tr-face{border-color:var(--tr-lit);box-shadow:0 0 16px rgba(99,210,255,.5)}
.sigrope .tr-peg.is-across i{color:var(--tr-lit)}
.sigrope .tr-peg.is-hidden{opacity:.22}
.sigrope .tr-peg.is-hidden i{visibility:hidden}

/* ── log + side ── */
.sigrope .tr-grid{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:16px;
  align-items:start;margin-top:16px}
@media(max-width:860px){.sigrope .tr-grid{grid-template-columns:1fr}}
.sigrope .tr-card{margin-bottom:10px;padding:11px 13px;border-radius:9px;
  border:1px solid rgba(255,255,255,.08);background:linear-gradient(160deg,rgba(18,27,37,.95),rgba(7,11,16,.96));
  animation:trIn .3s ease both}
@keyframes trIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.sigrope .tr-card-h{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.sigrope .tr-mini{width:26px;height:26px;border-radius:50%;overflow:hidden;border:1px solid rgba(255,255,255,.18)}
.sigrope .tr-mini img{width:100%;height:100%;object-fit:cover}
.sigrope .tr-badge{margin-left:auto;font-size:8.5px;letter-spacing:2px;font-weight:700;padding:3px 8px;
  border-radius:999px;background:rgba(255,255,255,.09);color:var(--tr-dim)}
.sigrope .tr-badge.is-gold{background:rgba(99,210,255,.18);color:var(--tr-lit)}
.sigrope .tr-badge.is-red{background:rgba(255,122,107,.18);color:var(--tr-warn)}
.sigrope .tr-body{font-size:12.6px;line-height:1.62;color:#cfdfea}
.sigrope .tr-locked{margin-bottom:10px;min-height:44px;border-radius:9px;
  border:1px dashed rgba(234,242,248,.13);display:grid;place-items:center;
  font-size:10px;letter-spacing:3px;color:rgba(234,242,248,.24)}
.sigrope .tr-side{position:sticky;top:56px;padding:12px;border-radius:9px;
  border:1px solid rgba(99,210,255,.2);background:linear-gradient(180deg,rgba(16,25,35,.96),rgba(6,9,13,.97))}
.sigrope .tr-side-h{font-size:10px;letter-spacing:2.2px;font-weight:700;color:var(--tr-lit)}
.sigrope .tr-side-s{font-size:10.5px;color:var(--tr-dim);margin:2px 0 10px;line-height:1.45}
.sigrope .tr-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:6px}
.sigrope .tr-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigrope .tr-srow em{font-style:normal;font-size:10.5px;color:var(--tr-dim);min-width:52px;text-align:right;
  font-variant-numeric:tabular-nums}
.sigrope .tr-srow.is-across em{color:var(--tr-lit)}
.sigrope .tr-win{margin-top:10px;text-align:center;padding:10px;border-radius:9px;
  border:1px solid var(--tr-lit);background:rgba(99,210,255,.1)}
.sigrope .tr-win-f{width:50px;height:50px;border-radius:50%;overflow:hidden;margin:0 auto 4px;
  border:2px solid var(--tr-lit)}
.sigrope .tr-win-f img{width:100%;height:100%;object-fit:cover}
.sigrope .tr-win b{display:block;font-size:13.5px}
.sigrope .tr-win i{font-style:normal;font-size:10.5px;color:var(--tr-dim)}
.sigrope .tr-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;
  justify-content:center;align-items:center;padding:10px 12px;
  background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.74));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.sigrope .tr-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;
  line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.sigrope .tr-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:9px auto 2px;max-width:720px}
.sigrope .tr-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.sigrope .tr-w i{font-style:normal}
.sigrope .tr-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigrope .tr-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigrope .tr-w u{text-decoration:none;opacity:.75}
.sigrope .tr-w.is-spread{opacity:.7;font-style:italic}
/* The shared avatar sizes itself; the circle only clips it. */
.sigrope .tr-face .bb-av,.sigrope .tr-win-f .bb-av{width:100%!important;height:100%!important}
.sigrope .tr-face .bb-av img,.sigrope .tr-win-f .bb-av img{width:100%;height:100%;object-fit:cover}
@media(prefers-reduced-motion:reduce){.sigrope *{animation:none!important;transition:none!important}}
</style>`;

const esc0 = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function rpBuildSigTightrope(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const runs = comp?.detail?.runs;
  // Declines rather than drawing an empty span — a season saved before the
  // detail existed still resolves to this variant.
  if (!Array.isArray(runs) || !runs.length) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const reveal = typeof u.reveal === 'function' ? u.reveal : null;
  const tv = u.tvState || {};
  const key = `bb_sig_rope_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tv[key]) tv[key] = { idx: -1 };
  const at = Number.isFinite(tv[key].idx) ? tv[key].idx : -1;
  const total = beats.length;
  const done = at >= total - 1;

  const length = comp.detail?.length || 12;
  const satOut = (comp.excluded || []).filter(Boolean);
  const satOutLine = satOut.length
    ? `<div class="tr-sub">Sat out: ${satOut.map(esc).join(', ')}${
        actType === 'hoh' && act.outgoingHoh
          ? ` &middot; ${esc(act.outgoingHoh)} cannot defend the room`
          : ''}</div>`
    : '';
  // Pegs are stacked slightly so two houseguests who stopped at the same metre
  // are both readable — the map is useless if markers sit on top of each other.
  // Eight markers, not eighteen: a rope with a full house on it is a row of
  // overlapping thumbnails and the map stops being readable.
  const pegs = runs.slice(0, 8).map((r, i) => {
    const pct = 4 + (Math.min(length, Number(r.metres) || 0) / length) * 88;
    const lift = (i % 3) * 26;
    const shown = done;
    return `<div class="tr-peg ${r.across ? 'is-across' : ''} ${shown ? '' : 'is-hidden'}"
      style="left:${pct}%;bottom:${70 + lift}px">
      <div class="tr-face">${avatar(r.name, 32)}</div>
      <b>${esc(r.name)}</b>
      <i>${!done ? '' : r.across ? 'ACROSS' : `${r.falls} ${r.falls === 1 ? 'fall' : 'falls'}`}</i>
    </div>`;
  }).join('');

  const cards = beats.map((b, i) => i > at
    ? '<div class="tr-locked">STILL ON THE ROPE</div>'
    : `<div class="tr-card">
        <div class="tr-card-h">${(b.players || []).slice(0, 2).map(n => avatar(n, 26)).join('')}
          <span class="tr-badge ${b.badgeClass === 'gold' ? 'is-gold' : b.badgeClass === 'red' ? 'is-red' : ''}">${esc(b.badgeText || '')}</span></div>
        <div class="tr-body">${esc(b.text)}</div>
      </div>`).join('');

  /* Gated the same way the log is. Printing every distance and fall count
     beside a log that has not started tells the viewer the result and then
     asks them to click through it. */
  const board = (done
    ? runs.slice(0, 10).map(r => `<div class="tr-srow ${r.across ? 'is-across' : ''}">
        <span>${esc(r.name)}</span>
        <em>${r.across ? 'across' : `${r.metres}m · ${r.falls}f`}</em>
      </div>`)
    : [...runs].map(r => r.name).sort().slice(0, 10).map(n =>
      `<div class="tr-srow"><span>${esc(n)}</span><em>&mdash;</em></div>`)
  ).join('');

  const winner = runs.find(r => r.across) || runs[0];
  return `${_STYLE}<div class="rp-page sigrope">
    <div class="tr-bg"></div>
    <div class="tr-wrap">
      <div class="tr-head">
        <div class="tr-eyebrow">Week ${esc(ep?.num || '')} &middot; ${actType === 'hoh' ? 'Head of Household' : 'Competition'}</div>
        <div class="tr-title">Tightrope</div>
         <div class="tr-sub">One rope, one crossing, and a net that sends you back to the beginning.</div>
         ${satOutLine}
        ${(() => {
    // What the competition reads, on the page, so a result can be checked
    // against the profile behind it. The swing stat is drawn apart: it widens
    // the spread rather than raising anybody's score.
    const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
    if (!w.length) return '';
    const bars = w.map(([k, v]) =>
      `<span class="tr-w"><i>${esc(k)}</i><span class="tr-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('');
    const swing = Object.keys(comp.roles?.nerve || {})[0];
    const spread = swing
      ? `<span class="tr-w is-spread" title="Widens the spread rather than raising the score"><i>&plusmn; ${esc(swing)}</i><u>consistency</u></span>` : '';
    return `<div class="tr-weights">${bars}${spread}</div>`;
  })()}
      </div>

      <div class="tr-span">
        <div class="tr-plat is-start"><b>START</b></div>
        <div class="tr-plat is-end"><b>FAR PLATFORM</b></div>
        <div class="tr-line"></div>
        <div class="tr-net"></div>
        ${pegs}
      </div>

      <div class="tr-grid">
        <div>${cards}</div>
        <div class="tr-side">
          <div class="tr-side-h">${done ? 'HOW FAR THEY GOT' : 'ON THE ROPE'}</div>
          <div class="tr-side-s">${done
    ? 'Distance on the best attempt, and the number of times the net caught them getting there.'
    : 'Nobody is across yet. Everybody out there is somewhere between the two platforms.'}</div>
          ${board}
          ${done ? `<div class="tr-win">
            <div class="tr-win-f">${avatar(winner.name, 50)}</div>
            <b>${esc(winner.name)}</b>
            <i>${winner.falls ? `across, after ${winner.falls} ${winner.falls === 1 ? 'fall' : 'falls'}` : 'across, without falling once'}</i>
          </div>` : ''}
        </div>
      </div>

      <div class="tr-rules">${esc(comp.desc || '')}</div>
    </div>
    ${reveal ? `<div class="tr-ctl">
      ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, key, at + 1)}">Next attempt</button>`}
      ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, key, total - 1)}">Reveal all</button>`}
      <span style="font-size:10px;letter-spacing:1px;color:#8ba0b3">${Math.min(total, at + 1)} / ${total}</span>
    </div>` : ''}
  </div>`;
}
