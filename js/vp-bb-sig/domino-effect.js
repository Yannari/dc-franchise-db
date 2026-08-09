/**
 * Domino Effect — "STANDING"
 *
 * The only competition in the library whose failure is EARLY SUCCESS, so the
 * screen is built around the one number that says it: tiles standing when the
 * run was set off, against the number of times the pattern had to be built
 * again. A houseguest with a hundred tiles and two collapses built a hundred
 * tiles three times.
 *
 * Each houseguest gets a mat: a run of tiles drawn edge-on as thin standing
 * slabs, filling left to right. The rebuild count is drawn as small fallen
 * tiles under the mat — flat, on their side — so the cost of a pattern sits
 * beneath the pattern rather than in a column somewhere else.
 *
 * Nothing on this page animates. It is the quietest competition in the house
 * and the screen keeps still, which is the joke.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&display=swap');
.sigdom{--dm-tile:#e9e6df;--dm-tile2:#b6b2a8;--dm-mat:#15171c;--dm-mat2:#0a0b0e;
  --dm-lit:#9d8cff;--dm-fall:#e2795f;--dm-ink:#f0f0f3;--dm-dim:#8e8e9c;
  font-family:'Inter',system-ui,sans-serif;color:var(--dm-ink);position:relative;overflow:clip}
.sigdom .dm-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigdom .dm-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(58% 38% at 50% 0%,rgba(157,140,255,.12),transparent 62%),
             linear-gradient(180deg,var(--dm-mat),var(--dm-mat2) 76%,#050609)}

.sigdom .dm-head{text-align:center;padding:14px 8px 4px;position:relative;z-index:2}
.sigdom .dm-eyebrow{font-size:9.5px;letter-spacing:4px;color:var(--dm-dim);text-transform:uppercase}
.sigdom .dm-title{font-family:'Space Grotesk',sans-serif;font-size:40px;font-weight:700;
  letter-spacing:2px;margin:2px 0;text-transform:uppercase;color:#fff}
.sigdom .dm-sub{font-size:12.5px;color:#bcbcca;max-width:490px;margin:0 auto}
.sigdom .dm-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;
  line-height:1.55;opacity:.86;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.1)}
.sigdom .dm-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:9px auto 2px;max-width:720px}
.sigdom .dm-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.sigdom .dm-w i{font-style:normal}
.sigdom .dm-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigdom .dm-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigdom .dm-w u{text-decoration:none;opacity:.75}
.sigdom .dm-w.is-nerve{color:var(--dm-fall);opacity:1}

/* ── the mats ── */
.sigdom .dm-floor{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
  gap:8px 14px;margin:16px auto 4px;max-width:1040px}
.sigdom .dm-mat{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:8px;
  border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02)}
.sigdom .dm-mat.is-win{border-color:rgba(157,140,255,.5);background:rgba(157,140,255,.09)}
.sigdom .dm-mat.is-waiting{opacity:.4}
.sigdom .dm-av{width:26px;height:26px;border-radius:50%;overflow:hidden;flex:0 0 auto;
  border:1px solid rgba(255,255,255,.18)}
.sigdom .dm-av .bb-av{width:100%!important;height:100%!important}
.sigdom .dm-av .bb-av img{width:100%;height:100%;object-fit:cover}
.sigdom .dm-who{width:62px;flex:0 0 auto;font-size:11px;font-weight:500;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigdom .dm-stack{flex:1;min-width:0}
/* the run: thin standing slabs */
.sigdom .dm-run{display:flex;gap:1px;height:17px;align-items:flex-end}
.sigdom .dm-t{flex:1;height:100%;border-radius:1px;
  background:linear-gradient(180deg,var(--dm-tile),var(--dm-tile2));
  box-shadow:0 0 0 .5px rgba(0,0,0,.4)}
.sigdom .dm-t.is-gap{background:rgba(255,255,255,.07);box-shadow:none}
.sigdom .dm-mat.is-win .dm-t{background:linear-gradient(180deg,#cfc6ff,var(--dm-lit))}
/* rebuilds: tiles on their side, under the run */
.sigdom .dm-fallen{display:flex;gap:3px;margin-top:4px;height:4px}
.sigdom .dm-fallen i{width:13px;height:4px;border-radius:1px;background:var(--dm-fall);opacity:.85}
.sigdom .dm-fallen b{font-style:normal;font-weight:500;font-size:8px;letter-spacing:.8px;
  color:var(--dm-fall);margin-left:3px;line-height:4px}
.sigdom .dm-n{width:52px;flex:0 0 auto;text-align:right;font-family:'Space Grotesk',sans-serif;
  font-size:13px;font-variant-numeric:tabular-nums;color:var(--dm-dim)}
.sigdom .dm-mat.is-win .dm-n{color:var(--dm-lit)}

/* ── log + side ── */
.sigdom .dm-grid{display:grid;grid-template-columns:minmax(0,1fr) 228px;gap:16px;align-items:start;margin-top:14px}
@media(max-width:860px){.sigdom .dm-grid{grid-template-columns:1fr}}
.sigdom .dm-card{margin-bottom:10px;padding:11px 13px;border-radius:9px;
  border:1px solid rgba(255,255,255,.08);background:linear-gradient(160deg,rgba(23,25,32,.95),rgba(8,9,13,.96))}
.sigdom .dm-card-h{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.sigdom .dm-badge{margin-left:auto;font-size:8.5px;letter-spacing:2px;font-weight:700;padding:3px 8px;
  border-radius:999px;background:rgba(255,255,255,.09);color:var(--dm-dim)}
.sigdom .dm-badge.is-gold{background:rgba(157,140,255,.2);color:#cfc6ff}
.sigdom .dm-badge.is-red{background:rgba(226,121,95,.18);color:#ffb7a3}
.sigdom .dm-body{font-size:12.6px;line-height:1.62;color:#d8d8e2}
.sigdom .dm-locked{margin-bottom:10px;min-height:44px;border-radius:9px;
  border:1px dashed rgba(240,240,243,.13);display:grid;place-items:center;
  font-size:10px;letter-spacing:3px;color:rgba(240,240,243,.24)}
.sigdom .dm-side{position:sticky;top:56px;padding:12px;border-radius:9px;
  border:1px solid rgba(157,140,255,.22);background:linear-gradient(180deg,rgba(21,23,30,.96),rgba(6,7,10,.97))}
.sigdom .dm-side-h{font-size:10px;letter-spacing:2.2px;font-weight:700;color:var(--dm-lit)}
.sigdom .dm-side-s{font-size:10.5px;color:var(--dm-dim);margin:2px 0 10px;line-height:1.45}
.sigdom .dm-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:6px}
.sigdom .dm-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigdom .dm-srow em{font-style:normal;font-size:10.5px;color:var(--dm-lit);min-width:54px;text-align:right;
  font-variant-numeric:tabular-nums}
.sigdom .dm-srow.is-waiting{opacity:.42}
.sigdom .dm-srow.is-waiting em{color:var(--dm-dim);font-size:9.5px;letter-spacing:.5px}
.sigdom .dm-srow u{text-decoration:none;font-size:9px;letter-spacing:1px;color:var(--dm-fall)}
.sigdom .dm-win{margin-top:10px;text-align:center;padding:10px;border-radius:9px;
  border:1px solid var(--dm-lit);background:rgba(157,140,255,.1)}
.sigdom .dm-win-f{width:50px;height:50px;border-radius:50%;overflow:hidden;margin:0 auto 4px;
  border:2px solid var(--dm-lit)}
.sigdom .dm-win-f .bb-av{width:100%!important;height:100%!important}
.sigdom .dm-win-f .bb-av img{width:100%;height:100%;object-fit:cover}
.sigdom .dm-win b{display:block;font-size:13.5px}
.sigdom .dm-win i{font-style:normal;font-size:10.5px;color:var(--dm-dim)}
.sigdom .dm-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;
  justify-content:center;align-items:center;padding:10px 12px;
  background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.74));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
</style>`;

const esc0 = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function rpBuildSigDominoEffect(ep, actType, u = {}) {
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
  const key = `bb_sig_dom_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tv[key]) tv[key] = { idx: -1 };
  const at = Number.isFinite(tv[key].idx) ? tv[key].idx : -1;
  const total = beats.length;
  const done = at >= total - 1;
  const route = Math.max(comp.detail?.route || 120, 1);
  const SEGMENTS = 24;   // drawn slabs, not real tiles

  const isDone = r => at >= (Number(r.revealAt) ?? 0);

  const floor = runs.map((r, i) => {
    const shown = isDone(r);
    const tiles = shown ? Math.max(0, Number(r.tiles) || 0) : 0;
    const filled = Math.round((tiles / route) * SEGMENTS);
    const collapses = shown ? Math.max(0, Number(r.collapses) || 0) : 0;
    const run = Array.from({ length: SEGMENTS }, (_, k) =>
      `<span class="dm-t ${k < filled ? '' : 'is-gap'}"></span>`).join('');
    const fallen = collapses
      ? Array.from({ length: collapses }, () => '<i></i>').join('')
        + `<b>${collapses === 1 ? 'rebuilt once' : `rebuilt ${collapses}×`}</b>`
      : '';
    return `<div class="dm-mat ${shown && i === 0 ? 'is-win' : ''} ${shown ? '' : 'is-waiting'}">
      <span class="dm-av">${avatar(r.name, 26)}</span>
      <span class="dm-who">${esc(r.name)}</span>
      <span class="dm-stack">
        <span class="dm-run">${run}</span>
        <span class="dm-fallen">${fallen}</span>
      </span>
      <span class="dm-n">${shown ? tiles : '&mdash;'}</span>
    </div>`;
  }).join('');

  const cards = beats.map((b, i) => i > at
    ? '<div class="dm-locked">STILL BUILDING</div>'
    : `<div class="dm-card">
        <div class="dm-card-h">${(b.players || []).slice(0, 2).map(n => avatar(n, 26)).join('')}
          <span class="dm-badge ${b.badgeClass === 'gold' ? 'is-gold' : b.badgeClass === 'red' ? 'is-red' : ''}">${esc(b.badgeText || '')}</span></div>
        <div class="dm-body">${esc(b.text)}</div>
      </div>`).join('');

  const rankOf = new Map(runs.map((r, i) => [r.name, i + 1]));
  const finished = runs.filter(isDone)
    .sort((a, b) => (a.revealAt ?? 0) - (b.revealAt ?? 0) || rankOf.get(b.name) - rankOf.get(a.name));
  const building = runs.filter(r => !isDone(r)).sort((a, b) => a.name.localeCompare(b.name));

  const board = [
    ...finished.map(r => `<div class="dm-srow">
      <span>${done ? `${rankOf.get(r.name)}. ` : ''}${esc(r.name)}${r.collapses >= 2 ? ' <u>rebuilt</u>' : ''}</span>
      <em>${r.tiles}${r.collapses ? ` &middot; ${r.collapses}&#8635;` : ''}</em>
    </div>`),
    ...building.map(r => `<div class="dm-srow is-waiting"><span>${esc(r.name)}</span><em>building</em></div>`),
  ].join('');

  const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
  const weights = w.length ? `<div class="dm-weights">${w.map(([k, v]) =>
    `<span class="dm-w ${k === 'temperament' ? 'is-nerve' : ''}"><i>${esc(k)}${k === 'temperament' ? ' (the rebuilds)' : ''}</i><span class="dm-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('')}</div>` : '';

  const winner = runs[0];
  return `${_STYLE}<div class="rp-page sigdom">
    <div class="dm-bg"></div>
    <div class="dm-wrap">
      <div class="dm-head">
        <div class="dm-eyebrow">Week ${esc(ep?.num || '')} &middot; ${actType === 'veto' ? 'Power of Veto' : 'Competition'}</div>
        <div class="dm-title">Domino Effect</div>
        <div class="dm-sub">The only competition in this house you lose by succeeding too early.</div>
        ${comp.desc ? `<div class="dm-rules">${esc(comp.desc)}</div>` : ''}
        ${weights}
      </div>

      <div class="dm-floor">${floor}</div>

      <div class="dm-grid">
        <div>${cards}</div>
        <div class="dm-side">
          <div class="dm-side-h">${done ? 'TILES STANDING' : 'ON THE MATS'}</div>
          <div class="dm-side-s">${done
    ? 'What was standing at the end, and how many times it had to be stood up again to get there.'
    : `${finished.length} of ${runs.length} finished. Nobody is being timed out — they are being undone by their own hands.`}</div>
          ${board}
          ${done ? `<div class="dm-win">
            <div class="dm-win-f">${avatar(winner.name, 50)}</div>
            <b>${esc(winner.name)}</b>
            <i>${winner.collapses
    ? `the whole pattern, after rebuilding it ${winner.collapses === 1 ? 'once' : `${winner.collapses} times`}`
    : 'the whole pattern, and never once had to start again'}</i>
          </div>` : ''}
        </div>
      </div>
    </div>
    ${reveal ? `<div class="dm-ctl">
      ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, key, at + 1)}">Next mat</button>`}
      ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, key, total - 1)}">Reveal all</button>`}
      <span style="font-size:10px;letter-spacing:1px;color:#8e8e9c">${Math.min(total, at + 1)} / ${total}</span>
    </div>` : ''}
  </div>`;
}
