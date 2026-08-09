/**
 * Feeling Knotty — "SIX KNOTS"
 *
 * One rope per houseguest, drawn as a rope: a length of hemp running left to
 * right with six knots tied along it. Knots that came undone are drawn as open
 * loops and knots still holding are drawn tight, so a finished rope is a row of
 * loose loops and a beaten one is a row of fists.
 *
 * The mark that belongs only to this competition is the RED knot — one the
 * houseguest pulled tighter than they were handed. It is the whole trap of the
 * competition in one glyph: everybody else's failures are things that did not
 * happen yet, and these are damage somebody did to their own rope.
 *
 * Because that damage comes off temperament rather than a second roll, a viewer
 * can read the profile bar and the ropes together and see the same thing said
 * twice — which is the point of putting the weights on the page at all.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
.sigknot{--kn-hemp:#c9a568;--kn-hemp2:#8a6b3d;--kn-tight:#e6dcc8;--kn-red:#e0664c;
  --kn-open:#6fbf95;--kn-wood:#221c16;--kn-wood2:#14100c;--kn-ink:#f1ece2;--kn-dim:#9d9284;
  font-family:'Inter',system-ui,sans-serif;color:var(--kn-ink);position:relative;overflow:clip}
.sigknot .kn-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigknot .kn-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(66% 42% at 50% 0%,rgba(201,165,104,.12),transparent 64%),
             linear-gradient(180deg,var(--kn-wood),var(--kn-wood2) 76%,#0b0806)}
/* workbench grain, very faint */
.sigknot .kn-grain{position:absolute;inset:46px 0 0 0;z-index:1;pointer-events:none;opacity:.07;
  background:repeating-linear-gradient(0deg,transparent 0 6px,#000 6px 7px)}

.sigknot .kn-head{text-align:center;padding:14px 8px 4px;position:relative;z-index:2}
.sigknot .kn-eyebrow{font-size:9.5px;letter-spacing:4px;color:var(--kn-dim);text-transform:uppercase}
.sigknot .kn-title{font-family:'Bitter',serif;font-size:40px;font-weight:700;letter-spacing:1px;
  margin:3px 0 2px;color:var(--kn-tight)}
.sigknot .kn-sub{font-size:12.5px;color:#cbbfab;max-width:480px;margin:0 auto}
.sigknot .kn-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;
  line-height:1.55;opacity:.86;background:rgba(0,0,0,.24);border:1px solid rgba(255,255,255,.1)}
.sigknot .kn-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:9px auto 2px;max-width:720px}
.sigknot .kn-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.sigknot .kn-w i{font-style:normal}
.sigknot .kn-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigknot .kn-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigknot .kn-w u{text-decoration:none;opacity:.75}
.sigknot .kn-w.is-trap{color:var(--kn-red);opacity:1}

/* ── the ropes ── */
.sigknot .kn-bench{display:grid;grid-template-columns:repeat(auto-fill,minmax(298px,1fr));
  gap:7px 14px;margin:16px auto 4px;max-width:1040px}
.sigknot .kn-rope{display:flex;align-items:center;gap:9px;padding:6px 9px;border-radius:8px;
  border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02)}
.sigknot .kn-rope.is-win{border-color:rgba(111,191,149,.5);background:rgba(111,191,149,.09)}
.sigknot .kn-rope.is-waiting{opacity:.42}
.sigknot .kn-av{width:26px;height:26px;border-radius:50%;overflow:hidden;flex:0 0 auto;
  border:1px solid rgba(255,255,255,.18)}
.sigknot .kn-av .bb-av{width:100%!important;height:100%!important}
.sigknot .kn-av .bb-av img{width:100%;height:100%;object-fit:cover}
.sigknot .kn-who{width:66px;flex:0 0 auto;font-size:11px;font-weight:600;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* the rope line with its six knots */
.sigknot .kn-line{position:relative;flex:1;height:22px;display:flex;align-items:center;gap:3px}
.sigknot .kn-line::before{content:'';position:absolute;left:0;right:0;top:50%;height:3px;
  transform:translateY(-50%);border-radius:2px;
  background:linear-gradient(90deg,var(--kn-hemp2),var(--kn-hemp) 20%,var(--kn-hemp) 80%,var(--kn-hemp2))}
.sigknot .kn-k{position:relative;z-index:1;width:16px;height:18px;flex:0 0 auto}
.sigknot .kn-k svg{width:100%;height:100%;display:block}
.sigknot .kn-n{width:30px;flex:0 0 auto;text-align:right;font-size:11px;font-variant-numeric:tabular-nums;
  color:var(--kn-dim)}
.sigknot .kn-rope.is-win .kn-n{color:var(--kn-open)}
.sigknot .kn-fought{font-size:8.5px;letter-spacing:1px;color:var(--kn-red);white-space:nowrap;
  flex:0 0 auto;width:52px;text-align:right}

/* ── log + side ── */
.sigknot .kn-grid{display:grid;grid-template-columns:minmax(0,1fr) 228px;gap:16px;
  align-items:start;margin-top:14px}
@media(max-width:860px){.sigknot .kn-grid{grid-template-columns:1fr}}
.sigknot .kn-card{margin-bottom:10px;padding:11px 13px;border-radius:9px;
  border:1px solid rgba(255,255,255,.08);background:linear-gradient(160deg,rgba(37,30,23,.95),rgba(15,12,9,.96));
  animation:knIn .3s ease both}
@keyframes knIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.sigknot .kn-card-h{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.sigknot .kn-badge{margin-left:auto;font-size:8.5px;letter-spacing:2px;font-weight:700;padding:3px 8px;
  border-radius:999px;background:rgba(255,255,255,.09);color:var(--kn-dim)}
.sigknot .kn-badge.is-gold{background:rgba(111,191,149,.18);color:var(--kn-open)}
.sigknot .kn-badge.is-red{background:rgba(224,102,76,.18);color:#ffb09c}
.sigknot .kn-body{font-size:12.6px;line-height:1.62;color:#ded4c4}
.sigknot .kn-locked{margin-bottom:10px;min-height:44px;border-radius:9px;
  border:1px dashed rgba(241,236,226,.13);display:grid;place-items:center;
  font-size:10px;letter-spacing:3px;color:rgba(241,236,226,.24)}
.sigknot .kn-side{position:sticky;top:56px;padding:12px;border-radius:9px;
  border:1px solid rgba(201,165,104,.22);background:linear-gradient(180deg,rgba(34,28,22,.96),rgba(12,9,7,.97))}
.sigknot .kn-side-h{font-size:10px;letter-spacing:2.2px;font-weight:700;color:var(--kn-hemp)}
.sigknot .kn-side-s{font-size:10.5px;color:var(--kn-dim);margin:2px 0 10px;line-height:1.45}
.sigknot .kn-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:6px}
.sigknot .kn-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigknot .kn-srow em{font-style:normal;font-size:10.5px;color:var(--kn-hemp);min-width:44px;text-align:right;
  font-variant-numeric:tabular-nums}
.sigknot .kn-srow.is-waiting{opacity:.42}
.sigknot .kn-srow.is-waiting em{color:var(--kn-dim);font-size:9.5px;letter-spacing:.5px}
.sigknot .kn-win{margin-top:10px;text-align:center;padding:10px;border-radius:9px;
  border:1px solid var(--kn-open);background:rgba(111,191,149,.1)}
.sigknot .kn-win-f{width:50px;height:50px;border-radius:50%;overflow:hidden;margin:0 auto 4px;
  border:2px solid var(--kn-open)}
.sigknot .kn-win-f .bb-av{width:100%!important;height:100%!important}
.sigknot .kn-win-f .bb-av img{width:100%;height:100%;object-fit:cover}
.sigknot .kn-win b{display:block;font-size:13.5px}
.sigknot .kn-win i{font-style:normal;font-size:10.5px;color:var(--kn-dim)}
.sigknot .kn-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;
  justify-content:center;align-items:center;padding:10px 12px;
  background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.74));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
@media(prefers-reduced-motion:reduce){.sigknot *{animation:none!important;transition:none!important}}
</style>`;

/** A knot still holding — compact, drawn tight. */
const KNOT_TIGHT = c => `<svg viewBox="0 0 16 18" aria-hidden="true">
  <path d="M3 9c0-3 2.2-5 5-5s5 2 5 5-2.2 5-5 5-5-2-5-5z" fill="none" stroke="${c}" stroke-width="2.6"/>
  <path d="M4.6 5.6l6.8 6.8M11.4 5.6l-6.8 6.8" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;

/** A knot that came undone — a loose loop, open at the bottom. */
const KNOT_OPEN = `<svg viewBox="0 0 16 18" aria-hidden="true">
  <path d="M4 11c0-3.6 1.8-6 4-6s4 2.4 4 6" fill="none" stroke="#6fbf95" stroke-width="2.2"
        stroke-linecap="round" opacity=".95"/>
  <path d="M4 11c0 1.4.7 2.4 1.6 2.6M12 11c0 1.4-.7 2.4-1.6 2.6" fill="none" stroke="#6fbf95"
        stroke-width="2" stroke-linecap="round" opacity=".6"/>
</svg>`;

const esc0 = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function rpBuildSigFeelingKnotty(ep, actType, u = {}) {
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
  const key = `bb_sig_knot_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tv[key]) tv[key] = { idx: -1 };
  const at = Number.isFinite(tv[key].idx) ? tv[key].idx : -1;
  const total = beats.length;
  const done = at >= total - 1;
  const KNOTS = comp.detail?.knots || 6;

  // Every houseguest, resolved by the card that resolves them — so the bench
  // opens up in step with the log rather than all at once at the end.
  const ropes = runs.map((r, i) => {
    const shown = at >= (Number(r.revealAt) ?? 0);
    const opened = shown ? Math.max(0, Number(r.opened) || 0) : 0;
    const fought = shown ? Math.max(0, Number(r.tightened) || 0) : 0;
    const knots = Array.from({ length: KNOTS }, (_, k) => {
      if (k < opened) return `<span class="kn-k">${KNOT_OPEN}</span>`;
      // Red marks the damage still ON the rope. Somebody can have tightened
      // more knots than they have left — they got those open in the end — and
      // the count beside the rope carries the true number.
      const stillTight = Math.min(fought, KNOTS - opened);
      const isFought = shown && k >= KNOTS - stillTight;
      return `<span class="kn-k">${KNOT_TIGHT(isFought ? '#e0664c' : '#e6dcc8')}</span>`;
    }).join('');
    return `<div class="kn-rope ${shown && i === 0 ? 'is-win' : ''} ${shown ? '' : 'is-waiting'}">
      <span class="kn-av">${avatar(r.name, 26)}</span>
      <span class="kn-who">${esc(r.name)}</span>
      <span class="kn-line">${knots}</span>
      <span class="kn-n">${shown ? `${opened}/${KNOTS}` : '&mdash;'}</span>
      <span class="kn-fought">${shown && fought ? `${fought} TIGHTENED` : ''}</span>
    </div>`;
  }).join('');

  const cards = beats.map((b, i) => i > at
    ? '<div class="kn-locked">STILL WORKING</div>'
    : `<div class="kn-card">
        <div class="kn-card-h">${(b.players || []).slice(0, 2).map(n => avatar(n, 26)).join('')}
          <span class="kn-badge ${b.badgeClass === 'gold' ? 'is-gold' : b.badgeClass === 'red' ? 'is-red' : ''}">${esc(b.badgeText || '')}</span></div>
        <div class="kn-body">${esc(b.text)}</div>
      </div>`).join('');

  /* SAME SPOILER AS THE POLES HAD: the order was the answer.
     `runs` is in finishing order, so listing it — even with every number
     hidden — told the viewer who had won before the first card. Resolved ropes
     are listed in the order they resolved, which has actually happened;
     everybody still working is alphabetical, because nothing about them is
     known. Placement numbers wait for the end. */
  const isDone = r => at >= (Number(r.revealAt) ?? 0);
  const rankOf = new Map(runs.map((r, i) => [r.name, i + 1]));
  const finished = runs.filter(isDone)
    .sort((a, b) => (a.revealAt ?? 0) - (b.revealAt ?? 0) || rankOf.get(b.name) - rankOf.get(a.name));
  const working = runs.filter(r => !isDone(r)).sort((a, b) => a.name.localeCompare(b.name));
  const cleared = finished.length;

  const board = [
    ...finished.map(r => `<div class="kn-srow">
      <span>${done ? `${rankOf.get(r.name)}. ` : ''}${esc(r.name)}</span>
      <em>${r.opened}/${KNOTS}${r.tightened ? ` &middot; ${r.tightened}&uarr;` : ''}</em>
    </div>`),
    ...working.map(r =>
      `<div class="kn-srow is-waiting"><span>${esc(r.name)}</span><em>working</em></div>`),
  ].join('');

  // The weights, with temperament marked as the TRAP rather than a stat you
  // are simply good at — which is the whole difference in this competition.
  const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
  const weights = w.length ? `<div class="kn-weights">${w.map(([k, v]) =>
    `<span class="kn-w ${k === 'temperament' ? 'is-trap' : ''}"><i>${esc(k)}${k === 'temperament' ? ' (the trap)' : ''}</i><span class="kn-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('')}</div>` : '';

  const winner = runs[0];
  return `${_STYLE}<div class="rp-page sigknot">
    <div class="kn-bg"></div><div class="kn-grain"></div>
    <div class="kn-wrap">
      <div class="kn-head">
        <div class="kn-eyebrow">Week ${esc(ep?.num || '')} &middot; ${actType === 'veto' ? 'Power of Veto' : 'Competition'}</div>
        <div class="kn-title">Feeling Knotty</div>
        <div class="kn-sub">Six knots, no tools, and a rope that gets worse every time somebody pulls on it.</div>
        ${comp.desc ? `<div class="kn-rules">${esc(comp.desc)}</div>` : ''}
        ${weights}
      </div>

      <div class="kn-bench">${ropes}</div>

      <div class="kn-grid">
        <div>${cards}</div>
        <div class="kn-side">
          <div class="kn-side-h">${done ? 'THE ROPES' : 'ON THE BENCH'}</div>
          <div class="kn-side-s">${done
    ? 'Knots opened, and the ones that were pulled tighter than they were handed out.'
    : `${cleared} of ${runs.length} finished with their rope. Nobody is being timed out — they are being beaten by it.`}</div>
          ${board}
          ${done ? `<div class="kn-win">
            <div class="kn-win-f">${avatar(winner.name, 50)}</div>
            <b>${esc(winner.name)}</b>
            <i>${winner.tightened
    ? `all ${KNOTS}, after tightening ${winner.tightened}`
    : `all ${KNOTS}, without tightening one`}</i>
          </div>` : ''}
        </div>
      </div>
    </div>
    ${reveal ? `<div class="kn-ctl">
      ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, key, at + 1)}">Next rope</button>`}
      ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, key, total - 1)}">Reveal all</button>`}
      <span style="font-size:10px;letter-spacing:1px;color:#9d9284">${Math.min(total, at + 1)} / ${total}</span>
    </div>` : ''}
  </div>`;
}
