/**
 * Memory Dip — "EIGHT FACES, IN ORDER"
 *
 * The screen is the BOARD rather than the tank. Every houseguest gets a strip
 * of eight slots beside their name, and the slots fill left to right as they
 * lay tiles — so the yard reads as a row of half-finished orders, which is what
 * this competition actually looks like from the deck.
 *
 * The number that matters is the one nobody else in the library has: DIVES
 * SPENT against TILES PLACED. Two houseguests can both have five tiles down and
 * one of them has been in the water nine times to do it, and that gap is the
 * whole competition — a strong swimmer surfacing with the wrong face, over and
 * over. It is drawn as a second, dimmer bar under the board, so the cost of
 * every board is visible beside the board itself.
 *
 * Water is the only thing on the page that moves: a caustic wash behind the
 * boards, slow enough to read over.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=Archivo+Narrow:wght@600&display=swap');
.sigdip{--dp-water:#1b4d5a;--dp-water2:#0a1e26;--dp-aqua:#5fd8d0;--dp-tile:#e8f4f2;
  --dp-miss:#e2795f;--dp-ink:#eaf6f5;--dp-dim:#84a3a6;
  font-family:'Archivo',system-ui,sans-serif;color:var(--dp-ink);position:relative;overflow:clip}
.sigdip .dp-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigdip .dp-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(70% 44% at 50% 0%,rgba(95,216,208,.13),transparent 62%),
             linear-gradient(180deg,var(--dp-water),var(--dp-water2) 70%,#040d11)}
/* caustics: two slow diagonal washes, the only motion on the page */
.sigdip .dp-caustic{position:absolute;inset:46px 0 0 0;z-index:1;pointer-events:none;opacity:.10;
  background:repeating-linear-gradient(64deg,transparent 0 22px,var(--dp-aqua) 22px 24px),
             repeating-linear-gradient(-58deg,transparent 0 30px,var(--dp-aqua) 30px 32px);
  animation:dpDrift 15s linear infinite}
@keyframes dpDrift{from{background-position:0 0,0 0}to{background-position:120px 60px,-90px 70px}}

.sigdip .dp-head{text-align:center;padding:14px 8px 4px;position:relative;z-index:2}
.sigdip .dp-eyebrow{font-size:9.5px;letter-spacing:4px;color:var(--dp-dim);text-transform:uppercase}
.sigdip .dp-title{font-family:'Archivo Narrow',sans-serif;font-size:42px;font-weight:600;
  letter-spacing:3px;margin:2px 0;text-transform:uppercase;color:#fff}
.sigdip .dp-sub{font-size:12.5px;color:#b3d0d2;max-width:490px;margin:0 auto}
.sigdip .dp-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;
  line-height:1.55;opacity:.86;background:rgba(0,0,0,.26);border:1px solid rgba(255,255,255,.1)}
.sigdip .dp-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:9px auto 2px;max-width:720px}
.sigdip .dp-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.sigdip .dp-w i{font-style:normal}
.sigdip .dp-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigdip .dp-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigdip .dp-w u{text-decoration:none;opacity:.75}

/* ── the boards ── */
.sigdip .dp-deck{display:grid;grid-template-columns:repeat(auto-fill,minmax(316px,1fr));
  gap:7px 14px;margin:16px auto 4px;max-width:1040px}
.sigdip .dp-row{display:flex;align-items:center;gap:9px;padding:6px 9px;border-radius:8px;
  border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02)}
.sigdip .dp-row.is-win{border-color:rgba(95,216,208,.5);background:rgba(95,216,208,.09)}
.sigdip .dp-row.is-waiting{opacity:.42}
.sigdip .dp-av{width:26px;height:26px;border-radius:50%;overflow:hidden;flex:0 0 auto;
  border:1px solid rgba(255,255,255,.18)}
.sigdip .dp-av .bb-av{width:100%!important;height:100%!important}
.sigdip .dp-av .bb-av img{width:100%;height:100%;object-fit:cover}
.sigdip .dp-who{width:64px;flex:0 0 auto;font-size:11px;font-weight:600;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigdip .dp-stack{flex:1;min-width:0}
/* the board: eight slots, filling in order */
.sigdip .dp-board{display:flex;gap:3px}
.sigdip .dp-slot{flex:1;height:15px;border-radius:2px;border:1px solid rgba(255,255,255,.14);
  background:rgba(0,0,0,.25);position:relative;overflow:hidden}
.sigdip .dp-slot.is-set{background:linear-gradient(180deg,var(--dp-tile),#b9d2cf);border-color:transparent}
.sigdip .dp-slot.is-set::after{content:'';position:absolute;inset:3px 4px;border-radius:1px;
  background:rgba(10,30,38,.30)}
/* dives spent, underneath, dimmer — the cost of the board above it */
.sigdip .dp-air{display:flex;gap:2px;margin-top:3px;height:4px}
.sigdip .dp-air i{flex:0 0 6px;height:100%;border-radius:2px;background:rgba(95,216,208,.42)}
.sigdip .dp-air i.is-waste{background:var(--dp-miss)}
.sigdip .dp-n{width:56px;flex:0 0 auto;text-align:right;font-size:10.5px;
  font-variant-numeric:tabular-nums;color:var(--dp-dim);line-height:1.25}
.sigdip .dp-n b{display:block;font-size:11.5px;color:var(--dp-ink);font-weight:600}
.sigdip .dp-row.is-win .dp-n b{color:var(--dp-aqua)}

/* ── log + side ── */
.sigdip .dp-grid{display:grid;grid-template-columns:minmax(0,1fr) 228px;gap:16px;
  align-items:start;margin-top:14px}
@media(max-width:860px){.sigdip .dp-grid{grid-template-columns:1fr}}
.sigdip .dp-card{margin-bottom:10px;padding:11px 13px;border-radius:9px;
  border:1px solid rgba(255,255,255,.08);background:linear-gradient(160deg,rgba(20,45,52,.95),rgba(6,18,23,.96));
  animation:dpIn .3s ease both}
@keyframes dpIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.sigdip .dp-card-h{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.sigdip .dp-badge{margin-left:auto;font-size:8.5px;letter-spacing:2px;font-weight:700;padding:3px 8px;
  border-radius:999px;background:rgba(255,255,255,.09);color:var(--dp-dim)}
.sigdip .dp-badge.is-gold{background:rgba(95,216,208,.18);color:var(--dp-aqua)}
.sigdip .dp-badge.is-red{background:rgba(226,121,95,.18);color:#ffb7a3}
.sigdip .dp-body{font-size:12.6px;line-height:1.62;color:#d3e6e5}
.sigdip .dp-locked{margin-bottom:10px;min-height:44px;border-radius:9px;
  border:1px dashed rgba(234,246,245,.13);display:grid;place-items:center;
  font-size:10px;letter-spacing:3px;color:rgba(234,246,245,.24)}
.sigdip .dp-side{position:sticky;top:56px;padding:12px;border-radius:9px;
  border:1px solid rgba(95,216,208,.22);background:linear-gradient(180deg,rgba(18,42,49,.96),rgba(5,14,18,.97))}
.sigdip .dp-side-h{font-size:10px;letter-spacing:2.2px;font-weight:700;color:var(--dp-aqua)}
.sigdip .dp-side-s{font-size:10.5px;color:var(--dp-dim);margin:2px 0 10px;line-height:1.45}
.sigdip .dp-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:6px}
.sigdip .dp-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigdip .dp-srow em{font-style:normal;font-size:10.5px;color:var(--dp-aqua);min-width:56px;text-align:right;
  font-variant-numeric:tabular-nums}
.sigdip .dp-srow.is-waiting{opacity:.42}
.sigdip .dp-srow.is-waiting em{color:var(--dp-dim);font-size:9.5px;letter-spacing:.5px}
.sigdip .dp-srow u{text-decoration:none;font-size:9px;letter-spacing:1px;color:var(--dp-miss)}
.sigdip .dp-win{margin-top:10px;text-align:center;padding:10px;border-radius:9px;
  border:1px solid var(--dp-aqua);background:rgba(95,216,208,.1)}
.sigdip .dp-win-f{width:50px;height:50px;border-radius:50%;overflow:hidden;margin:0 auto 4px;
  border:2px solid var(--dp-aqua)}
.sigdip .dp-win-f .bb-av{width:100%!important;height:100%!important}
.sigdip .dp-win-f .bb-av img{width:100%;height:100%;object-fit:cover}
.sigdip .dp-win b{display:block;font-size:13.5px}
.sigdip .dp-win i{font-style:normal;font-size:10.5px;color:var(--dp-dim)}
.sigdip .dp-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;
  justify-content:center;align-items:center;padding:10px 12px;
  background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.74));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
@media(prefers-reduced-motion:reduce){.sigdip *{animation:none!important;transition:none!important}}
</style>`;

const esc0 = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function rpBuildSigMemoryDip(ep, actType, u = {}) {
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
  const key = `bb_sig_dip_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tv[key]) tv[key] = { idx: -1 };
  const at = Number.isFinite(tv[key].idx) ? tv[key].idx : -1;
  const total = beats.length;
  const done = at >= total - 1;
  const TILES = comp.detail?.tiles || 8;

  const isDone = r => at >= (Number(r.revealAt) ?? 0);

  // Every houseguest gets a board, and it fills on the card that resolves them.
  const deck = runs.map((r, i) => {
    const shown = isDone(r);
    const placed = shown ? Math.max(0, Number(r.placed) || 0) : 0;
    const wrong = shown ? Math.max(0, Number(r.wrong) || 0) : 0;
    const dives = shown ? Math.max(placed, Number(r.dives) || 0) : 0;
    const slots = Array.from({ length: TILES }, (_, k) =>
      `<span class="dp-slot ${k < placed ? 'is-set' : ''}"></span>`).join('');
    // One mark per dive; the wasted ones sit at the end in the miss colour.
    const air = Array.from({ length: Math.min(dives, 16) }, (_, k) =>
      `<i class="${k >= dives - wrong ? 'is-waste' : ''}"></i>`).join('');
    return `<div class="dp-row ${shown && i === 0 ? 'is-win' : ''} ${shown ? '' : 'is-waiting'}">
      <span class="dp-av">${avatar(r.name, 26)}</span>
      <span class="dp-who">${esc(r.name)}</span>
      <span class="dp-stack">
        <span class="dp-board">${slots}</span>
        <span class="dp-air">${air}</span>
      </span>
      <span class="dp-n">${shown ? `<b>${placed}/${TILES}</b>${dives} ${dives === 1 ? 'dive' : 'dives'}` : '&mdash;'}</span>
    </div>`;
  }).join('');

  const cards = beats.map((b, i) => i > at
    ? '<div class="dp-locked">STILL UNDER</div>'
    : `<div class="dp-card">
        <div class="dp-card-h">${(b.players || []).slice(0, 2).map(n => avatar(n, 26)).join('')}
          <span class="dp-badge ${b.badgeClass === 'gold' ? 'is-gold' : b.badgeClass === 'red' ? 'is-red' : ''}">${esc(b.badgeText || '')}</span></div>
        <div class="dp-body">${esc(b.text)}</div>
      </div>`).join('');

  /* Same two-list board as the poles and the ropes: order is a spoiler on its
     own, so only what has already happened is ordered by result. */
  const rankOf = new Map(runs.map((r, i) => [r.name, i + 1]));
  const finished = runs.filter(isDone)
    .sort((a, b) => (a.revealAt ?? 0) - (b.revealAt ?? 0) || rankOf.get(b.name) - rankOf.get(a.name));
  const under = runs.filter(r => !isDone(r)).sort((a, b) => a.name.localeCompare(b.name));

  const board = [
    ...finished.map(r => `<div class="dp-srow">
      <span>${done ? `${rankOf.get(r.name)}. ` : ''}${esc(r.name)}${r.wrong >= 3 ? ' <u>lost dives</u>' : ''}</span>
      <em>${r.placed}/${TILES} &middot; ${r.dives}d</em>
    </div>`),
    ...under.map(r => `<div class="dp-srow is-waiting"><span>${esc(r.name)}</span><em>in the water</em></div>`),
  ].join('');

  const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
  const weights = w.length ? `<div class="dp-weights">${w.map(([k, v]) =>
    `<span class="dp-w"><i>${esc(k)}</i><span class="dp-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('')}</div>` : '';

  const winner = runs[0];
  return `${_STYLE}<div class="rp-page sigdip">
    <div class="dp-bg"></div><div class="dp-caustic"></div>
    <div class="dp-wrap">
      <div class="dp-head">
        <div class="dp-eyebrow">Week ${esc(ep?.num || '')} &middot; ${actType === 'veto' ? 'Power of Veto' : 'Head of Household'}</div>
        <div class="dp-title">Memory Dip</div>
        <div class="dp-sub">Eight faces at the bottom of the water, and one lungful of air to spend
          on each of them.</div>
        ${comp.desc ? `<div class="dp-rules">${esc(comp.desc)}</div>` : ''}
        ${weights}
      </div>

      <div class="dp-deck">${deck}</div>

      <div class="dp-grid">
        <div>${cards}</div>
        <div class="dp-side">
          <div class="dp-side-h">${done ? 'BOARDS AND DIVES' : 'IN THE WATER'}</div>
          <div class="dp-side-s">${done
    ? 'Tiles laid, and the dives it took to lay them. The gap between those two numbers is memory.'
    : `${finished.length} of ${runs.length} boards done. Nobody is racing anybody — they are racing their own air.`}</div>
          ${board}
          ${done ? `<div class="dp-win">
            <div class="dp-win-f">${avatar(winner.name, 50)}</div>
            <b>${esc(winner.name)}</b>
            <i>${TILES} in order, off ${winner.dives} dives${winner.wrong ? ` and ${winner.wrong} wasted` : ' with nothing wasted'}</i>
          </div>` : ''}
        </div>
      </div>
    </div>
    ${reveal ? `<div class="dp-ctl">
      ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, key, at + 1)}">Next dive</button>`}
      ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, key, total - 1)}">Reveal all</button>`}
      <span style="font-size:10px;letter-spacing:1px;color:#84a3a6">${Math.min(total, at + 1)} / ${total}</span>
    </div>` : ''}
  </div>`;
}
