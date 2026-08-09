/**
 * Ship Til You Drop — "THE DECK"
 *
 * Every other hold in the library is a constant load and the screen for it is a
 * height: how far up the pole, how long on the wall. This one GROWS, so the
 * screen is a stack — cardboard drawn box by box, standing on a deck line, and
 * the row reads as a skyline of what each body was willing to take.
 *
 * The mark that belongs to this competition is the LEAN. A stack lost to
 * balance is drawn tipping; one lost to the arms is drawn straight and simply
 * short. Both end on the deck and they are not the same failure, and the
 * competition knows which one it was — it is whichever of that houseguest's two
 * numbers was the weaker.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;700&family=Saira:wght@400;500&display=swap');
.sigship{--sh-card:#c9a06a;--sh-card2:#8d6a3f;--sh-deck:#1d2430;--sh-deck2:#0c1017;
  --sh-lit:#ffd08a;--sh-tip:#e2795f;--sh-ink:#eef2f7;--sh-dim:#8d9aab;
  font-family:'Saira',system-ui,sans-serif;color:var(--sh-ink);position:relative;overflow:clip}
.sigship .sh-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigship .sh-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(62% 40% at 50% 0%,rgba(255,208,138,.11),transparent 62%),
             linear-gradient(180deg,var(--sh-deck),var(--sh-deck2) 74%,#06090d)}
/* deck planking, faint */
.sigship .sh-planks{position:absolute;left:0;right:0;bottom:0;height:220px;z-index:1;pointer-events:none;opacity:.10;
  background:repeating-linear-gradient(90deg,transparent 0 54px,#fff 54px 55px)}

.sigship .sh-head{text-align:center;padding:14px 8px 4px;position:relative;z-index:2}
.sigship .sh-eyebrow{font-size:9.5px;letter-spacing:4px;color:var(--sh-dim);text-transform:uppercase}
.sigship .sh-title{font-family:'Saira Condensed',sans-serif;font-size:44px;font-weight:700;
  letter-spacing:3px;margin:2px 0;text-transform:uppercase;color:#fff}
.sigship .sh-sub{font-size:12.5px;color:#b6c3d3;max-width:480px;margin:0 auto}
.sigship .sh-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;
  line-height:1.55;opacity:.86;background:rgba(0,0,0,.26);border:1px solid rgba(255,255,255,.1)}
.sigship .sh-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:9px auto 2px;max-width:720px}
.sigship .sh-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.sigship .sh-w i{font-style:normal}
.sigship .sh-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigship .sh-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigship .sh-w u{text-decoration:none;opacity:.75}

/* ── the skyline ── */
.sigship .sh-deck{display:flex;gap:6px;justify-content:center;align-items:flex-end;flex-wrap:wrap;
  margin:16px auto 6px;max-width:1040px;padding:0 6px}
.sigship .sh-col{width:56px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.sigship .sh-stack{display:flex;flex-direction:column-reverse;gap:2px;min-height:150px;justify-content:flex-start;
  width:100%;align-items:center}
.sigship .sh-box{width:34px;height:9px;border-radius:2px;flex:0 0 auto;
  background:linear-gradient(180deg,var(--sh-card),var(--sh-card2));
  border:1px solid rgba(0,0,0,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.18);
  transition:transform .3s ease}
.sigship .sh-col.is-tip .sh-box:nth-child(n+4){transform:rotate(-4deg) translateX(-2px)}
.sigship .sh-col.is-tip .sh-box:nth-child(n+7){transform:rotate(-7deg) translateX(-4px)}
.sigship .sh-col.is-win .sh-box{background:linear-gradient(180deg,var(--sh-lit),#c9973f)}
.sigship .sh-line{width:100%;height:4px;border-radius:1px;background:#39445a;margin-top:3px}
.sigship .sh-tag{margin-top:6px;text-align:center;width:100%}
.sigship .sh-av{width:26px;height:26px;border-radius:50%;overflow:hidden;margin:0 auto 3px;
  border:1px solid rgba(255,255,255,.2)}
.sigship .sh-av .bb-av{width:100%!important;height:100%!important}
.sigship .sh-av .bb-av img{width:100%;height:100%;object-fit:cover}
.sigship .sh-name{font-size:10px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigship .sh-n{font-family:'Saira Condensed',sans-serif;font-size:13px;color:var(--sh-lit);
  font-variant-numeric:tabular-nums}
.sigship .sh-how{font-size:8px;letter-spacing:.8px;color:var(--sh-tip);text-transform:uppercase;min-height:10px}
.sigship .sh-col.is-waiting{opacity:.34}
.sigship .sh-col.is-waiting .sh-n,.sigship .sh-col.is-waiting .sh-how{visibility:hidden}

/* ── log + side ── */
.sigship .sh-grid{display:grid;grid-template-columns:minmax(0,1fr) 228px;gap:16px;align-items:start;margin-top:14px}
@media(max-width:860px){.sigship .sh-grid{grid-template-columns:1fr}}
.sigship .sh-card{margin-bottom:10px;padding:11px 13px;border-radius:9px;
  border:1px solid rgba(255,255,255,.08);background:linear-gradient(160deg,rgba(27,34,46,.95),rgba(9,13,19,.96));
  animation:shIn .3s ease both}
@keyframes shIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.sigship .sh-card-h{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.sigship .sh-badge{margin-left:auto;font-size:8.5px;letter-spacing:2px;font-weight:700;padding:3px 8px;
  border-radius:999px;background:rgba(255,255,255,.09);color:var(--sh-dim)}
.sigship .sh-badge.is-gold{background:rgba(255,208,138,.18);color:var(--sh-lit)}
.sigship .sh-badge.is-red{background:rgba(226,121,95,.18);color:#ffb7a3}
.sigship .sh-body{font-size:12.6px;line-height:1.62;color:#d3dded}
.sigship .sh-locked{margin-bottom:10px;min-height:44px;border-radius:9px;
  border:1px dashed rgba(238,242,247,.13);display:grid;place-items:center;
  font-size:10px;letter-spacing:3px;color:rgba(238,242,247,.24)}
.sigship .sh-side{position:sticky;top:56px;padding:12px;border-radius:9px;
  border:1px solid rgba(255,208,138,.2);background:linear-gradient(180deg,rgba(24,31,42,.96),rgba(7,10,15,.97))}
.sigship .sh-side-h{font-size:10px;letter-spacing:2.2px;font-weight:700;color:var(--sh-lit)}
.sigship .sh-side-s{font-size:10.5px;color:var(--sh-dim);margin:2px 0 10px;line-height:1.45}
.sigship .sh-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:6px}
.sigship .sh-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigship .sh-srow em{font-style:normal;font-size:10.5px;color:var(--sh-lit);min-width:52px;text-align:right;
  font-variant-numeric:tabular-nums}
.sigship .sh-srow.is-waiting{opacity:.42}
.sigship .sh-srow.is-waiting em{color:var(--sh-dim);font-size:9.5px;letter-spacing:.5px}
.sigship .sh-srow u{text-decoration:none;font-size:9px;letter-spacing:1px;color:var(--sh-tip)}
.sigship .sh-win{margin-top:10px;text-align:center;padding:10px;border-radius:9px;
  border:1px solid var(--sh-lit);background:rgba(255,208,138,.1)}
.sigship .sh-win-f{width:50px;height:50px;border-radius:50%;overflow:hidden;margin:0 auto 4px;
  border:2px solid var(--sh-lit)}
.sigship .sh-win-f .bb-av{width:100%!important;height:100%!important}
.sigship .sh-win-f .bb-av img{width:100%;height:100%;object-fit:cover}
.sigship .sh-win b{display:block;font-size:13.5px}
.sigship .sh-win i{font-style:normal;font-size:10.5px;color:var(--sh-dim)}
.sigship .sh-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;
  justify-content:center;align-items:center;padding:10px 12px;
  background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.74));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
@media(prefers-reduced-motion:reduce){.sigship *{animation:none!important;transition:none!important}}
</style>`;

const esc0 = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function rpBuildSigShipTilYouDrop(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const runs = comp?.detail?.runs;
  if (!Array.isArray(runs) || !runs.length) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const reveal = typeof u.reveal === 'function' ? u.reveal : null;
  const tv = u.tvState || {};
  const key = `bb_sig_ship_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tv[key]) tv[key] = { idx: -1 };
  const at = Number.isFinite(tv[key].idx) ? tv[key].idx : -1;
  const total = beats.length;
  const done = at >= total - 1;
  const tallest = Math.max(comp.detail?.tallest || 1, 1);

  const isDone = r => at >= (Number(r.revealAt) ?? 0);

  // Stacks are drawn in the order they went down — first to drop on the left —
  // so the deck empties left to right as the log runs.
  const deck = [...runs].reverse().map(r => {
    const shown = isDone(r);
    const boxes = shown ? Math.max(0, Number(r.boxes) || 0) : 0;
    // Capped for drawing only; the number beside it carries the truth.
    const drawn = Math.min(boxes, 14);
    const isWin = r.name === runs[0].name && shown;
    const tipped = shown && r.lostBy === 'balance' && !isWin;
    return `<div class="sh-col ${isWin ? 'is-win' : ''} ${tipped ? 'is-tip' : ''} ${shown ? '' : 'is-waiting'}">
      <div class="sh-stack">${Array.from({ length: drawn }, () => '<span class="sh-box"></span>').join('')}</div>
      <div class="sh-line"></div>
      <div class="sh-tag">
        <div class="sh-av">${avatar(r.name, 26)}</div>
        <div class="sh-name">${esc(r.name)}</div>
        <div class="sh-n">${shown ? boxes : '&mdash;'}</div>
        <div class="sh-how">${shown && !isWin ? (r.lostBy === 'balance' ? 'stack' : 'arms') : ''}</div>
      </div>
    </div>`;
  }).join('');

  const cards = beats.map((b, i) => i > at
    ? '<div class="sh-locked">STILL HOLDING</div>'
    : `<div class="sh-card">
        <div class="sh-card-h">${(b.players || []).slice(0, 2).map(n => avatar(n, 26)).join('')}
          <span class="sh-badge ${b.badgeClass === 'gold' ? 'is-gold' : b.badgeClass === 'red' ? 'is-red' : ''}">${esc(b.badgeText || '')}</span></div>
        <div class="sh-body">${esc(b.text)}</div>
      </div>`).join('');

  const rankOf = new Map(runs.map((r, i) => [r.name, i + 1]));
  const downList = runs.filter(isDone)
    .sort((a, b) => (a.revealAt ?? 0) - (b.revealAt ?? 0) || rankOf.get(b.name) - rankOf.get(a.name));
  const upList = runs.filter(r => !isDone(r)).sort((a, b) => a.name.localeCompare(b.name));

  const board = [
    ...downList.map(r => `<div class="sh-srow">
      <span>${done ? `${rankOf.get(r.name)}. ` : ''}${esc(r.name)}${
  r.name !== runs[0].name && r.lostBy === 'balance' ? ' <u>tipped</u>' : ''}</span>
      <em>${r.boxes} ${r.boxes === 1 ? 'box' : 'boxes'}</em>
    </div>`),
    ...upList.map(r => `<div class="sh-srow is-waiting"><span>${esc(r.name)}</span><em>holding</em></div>`),
  ].join('');

  const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
  const weights = w.length ? `<div class="sh-weights">${w.map(([k, v]) =>
    `<span class="sh-w"><i>${esc(k)}</i><span class="sh-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('')}</div>` : '';

  const winner = runs[0];
  return `${_STYLE}<div class="rp-page sigship">
    <div class="sh-bg"></div><div class="sh-planks"></div>
    <div class="sh-wrap">
      <div class="sh-head">
        <div class="sh-eyebrow">Week ${esc(ep?.num || '')} &middot; ${actType === 'veto' ? 'Power of Veto' : 'Head of Household'}</div>
        <div class="sh-title">Ship Til You Drop</div>
        <div class="sh-sub">The only hold in this house that gets heavier. It is built to beat every
          single person out there — the question is how far each of them gets first.</div>
        ${comp.desc ? `<div class="sh-rules">${esc(comp.desc)}</div>` : ''}
        ${weights}
      </div>

      <div class="sh-deck">${deck}</div>

      <div class="sh-grid">
        <div>${cards}</div>
        <div class="sh-side">
          <div class="sh-side-h">${done ? 'BOXES CARRIED' : 'ON THE DECK'}</div>
          <div class="sh-side-s">${done
    ? 'What each body took before it stopped, and whether it was the arms that went or the stack.'
    : `${downList.length} of ${runs.length} down. Another box goes on every stack whether anybody is ready for it or not.`}</div>
          ${board}
          ${done ? `<div class="sh-win">
            <div class="sh-win-f">${avatar(winner.name, 50)}</div>
            <b>${esc(winner.name)}</b>
            <i>${winner.boxes} boxes, and the last stack standing</i>
          </div>` : ''}
        </div>
      </div>
    </div>
    ${reveal ? `<div class="sh-ctl">
      ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, key, at + 1)}">Next to drop</button>`}
      ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, key, total - 1)}">Reveal all</button>`}
      <span style="font-size:10px;letter-spacing:1px;color:#8d9aab">${Math.min(total, at + 1)} / ${total}</span>
    </div>` : ''}
  </div>`;
}
