/**
 * The Run — "THE GHOST RACE"
 *
 * Part two of the final Head of Household, and the only competition in the
 * library run with no audience at all: the two houseguests take the same course
 * separately, against a clock, and neither of them is allowed to see the other
 * one do it. Everything else in this directory draws a shared yard where the
 * players can watch each other. This one cannot, and that is the whole subject.
 *
 * So the screen shows the viewer the thing neither runner was permitted to
 * know. Both runs are drawn on ONE timeline, segment by segment, at their real
 * proportions: the first runner's splits become a ghost, and the second runner
 * moves against it. Where the bars cross is where the lead changed hands, and
 * nobody in that yard could have told you it had.
 *
 * The penalty is the point of the competition — a section built in the wrong
 * order comes apart and gets rebuilt with the clock running — so a misread is
 * drawn as a hatched red block welded onto that segment, at its true width in
 * seconds. On the nights the sim flags `stolen`, the block is visibly wider
 * than the gap between the two totals, which is the entire story of the night
 * in one picture: the faster houseguest lost, and here is the piece of time
 * that did it.
 *
 * Cool, clinical, floodlit — a timing rig rather than a set. Nothing here is
 * borrowed from another screen.
 */

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const P = 'fr';

const ICONS = {
  crate: `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="6.5" width="17" height="11" rx="1.5"/><path d="M3.5 10h17M9 6.5v11"/></g></svg>`,
  board: `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M8 9h8M8 13h5"/></g></svg>`,
  net: `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 4v16M12 4v16M20 4v16M4 9h16M4 15h16"/></g></svg>`,
  beam: `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2 15h20M7 15V9M17 15v-6"/></g></svg>`,
  buzz: `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="13" r="6" fill="currentColor"/><path d="M12 3.5v2M4.6 6.4 6 7.8M19.4 6.4 18 7.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5.4l3.4 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
};
const SEG_ICON = { haul: ICONS.crate, sort: ICONS.board, climb: ICONS.net, balance: ICONS.beam, finish: ICONS.buzz };

/** Seconds the way a competition clock says them. */
const clock = secs => {
  const s = Math.max(0, Math.round(Number(secs) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@500;600;700&family=Rubik:wght@400;500;600&display=swap');
.sigrun{--fr-ink:#e7edf2;--fr-dim:#7f8f9c;--fr-line:rgba(150,180,200,.18);
  --fr-a:#5ad2e8;--fr-b:#f2c14e;--fr-pen:#e05a4a;--fr-go:#63bf88;
  font-family:'Rubik',system-ui,sans-serif;color:var(--fr-ink);position:relative;overflow:clip}
/* a timing rig under floodlight: cold, flat, unglamorous */
.sigrun .fr-yard{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(60% 30% at 50% 0%,rgba(90,210,232,.13),transparent 66%),
    repeating-linear-gradient(90deg,rgba(255,255,255,.022) 0 1px,transparent 1px 44px),
    linear-gradient(180deg,#0b1116 0%,#101a21 55%,#0a1015 100%)}
.sigrun .fr-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:3;padding-bottom:78px}

.sigrun .fr-head{text-align:center;padding:14px 12px 12px;margin-top:10px;border-radius:2px;
  background:linear-gradient(180deg,rgba(18,29,37,.92),rgba(10,17,22,.8));border:1px solid var(--fr-line)}
.sigrun .fr-eyebrow{font-family:'Archivo Narrow',sans-serif;font-size:11px;letter-spacing:6px;color:var(--fr-dim);text-transform:uppercase}
.sigrun .fr-title{font-family:'Archivo Narrow',sans-serif;font-size:38px;font-weight:700;letter-spacing:5px;
  margin:2px 0 4px;color:#fff}
.sigrun .fr-sub{font-size:12px;color:#9fb1bf;max-width:520px;margin:0 auto 9px}
.sigrun .fr-clocks{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.sigrun .fr-cl{display:flex;align-items:center;gap:9px;padding:6px 14px;border-radius:2px;
  border:1px solid var(--fr-line);background:rgba(6,12,16,.7)}
.sigrun .fr-cl i{width:9px;height:9px;border-radius:2px;flex:none}
.sigrun .fr-cl b{font-family:'Archivo Narrow',sans-serif;font-size:22px;font-weight:700;
  font-variant-numeric:tabular-nums;letter-spacing:1px}
.sigrun .fr-cl span{font-size:10.5px;color:var(--fr-dim)}
.sigrun .fr-rules{max-width:700px;margin:11px auto 0;padding:9px 13px;border-radius:2px;font-size:11.5px;
  line-height:1.6;color:#a4b6c3;background:rgba(0,0,0,.28);border:1px solid var(--fr-line)}

/* ── the timeline ── */
.sigrun .fr-rig{margin:15px auto 0;padding:13px 14px;border-radius:2px;background:rgba(9,16,21,.72);
  border:1px solid var(--fr-line)}
.sigrun .fr-rig-h{display:flex;align-items:baseline;gap:10px;margin-bottom:11px}
.sigrun .fr-rig-h b{font-family:'Archivo Narrow',sans-serif;font-size:11px;letter-spacing:3px;color:#fff}
.sigrun .fr-rig-h span{font-size:10.5px;color:var(--fr-dim)}
.sigrun .fr-lane{margin-bottom:20px}
.sigrun .fr-lane-n{display:flex;align-items:center;gap:7px;font-size:11.5px;margin-bottom:5px;color:#c6d5e0}
.sigrun .fr-lane-n i{width:9px;height:9px;border-radius:2px;flex:none}
.sigrun .fr-lane-n em{font-style:normal;margin-left:auto;font-family:'Archivo Narrow',sans-serif;
  font-size:14px;font-variant-numeric:tabular-nums;color:#fff}
.sigrun .fr-bar{display:flex;height:26px;border-radius:2px;overflow:hidden;background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.07)}
.sigrun .fr-seg{position:relative;display:flex;align-items:center;justify-content:center;
  font-size:9px;letter-spacing:.4px;color:rgba(255,255,255,.82);white-space:nowrap;overflow:hidden;
  border-right:1px solid rgba(10,16,21,.55);transition:width .5s ease}
.sigrun .fr-seg.is-stumble{background-image:repeating-linear-gradient(115deg,rgba(0,0,0,.22) 0 5px,transparent 5px 10px)}
.sigrun .fr-seg.is-pen{background:var(--fr-pen)!important;
  background-image:repeating-linear-gradient(115deg,rgba(0,0,0,.3) 0 5px,transparent 5px 12px)!important;
  color:#fff;font-weight:600}
.sigrun .fr-seg.is-todo{background:rgba(255,255,255,.05);color:transparent}
/* the other runner's finish, laid over the lane as a ghost */
.sigrun .fr-ghost{position:relative;height:0}
.sigrun .fr-ghost i{position:absolute;top:-31px;bottom:5px;width:2px;background:#fff;opacity:.85}
.sigrun .fr-ghost b{position:absolute;top:3px;transform:translateX(-50%);font-size:8.5px;letter-spacing:1.4px;
  color:#fff;background:rgba(10,16,21,.92);padding:1px 5px;border-radius:2px;white-space:nowrap;
  border:1px solid rgba(255,255,255,.22)}
.sigrun .fr-scale{display:flex;justify-content:space-between;font-size:9px;color:var(--fr-dim);
  font-variant-numeric:tabular-nums;margin-top:2px}
.sigrun .fr-key{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;font-size:9.5px;color:var(--fr-dim)}
.sigrun .fr-key span{display:flex;align-items:center;gap:5px}
.sigrun .fr-key i{width:10px;height:8px;border-radius:1px;display:block}

/* ── cards ── */
.sigrun .fr-grid{display:grid;grid-template-columns:minmax(0,1fr) 224px;gap:16px;align-items:start;margin-top:15px}
@media(max-width:880px){.sigrun .fr-grid{grid-template-columns:1fr}}
.sigrun .fr-card{margin-bottom:9px;padding:11px 13px;border-radius:2px;background:rgba(16,26,33,.85);
  border:1px solid var(--fr-line);border-left:3px solid var(--fr-a);animation:frIn .3s ease both}
@keyframes frIn{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:none}}
.sigrun .fr-tag{font-family:'Archivo Narrow',sans-serif;font-size:10px;letter-spacing:2.4px;color:var(--fr-dim);
  margin-bottom:5px;display:flex;align-items:center;gap:6px;font-weight:600}
.sigrun .fr-body{font-size:12.8px;line-height:1.65;color:#c8d6e0}
.sigrun .fr-card.k-b{border-left-color:var(--fr-b)}
.sigrun .fr-card.k-pen{border-left-color:var(--fr-pen);background:linear-gradient(180deg,rgba(58,20,16,.6),rgba(14,20,25,.85))}
.sigrun .fr-card.k-pen .fr-tag{color:var(--fr-pen)}
.sigrun .fr-card.k-split{border-left-color:#8f9fac;background:rgba(12,19,25,.7)}
.sigrun .fr-card.k-times,.sigrun .fr-card.k-win{border:1px solid rgba(242,193,78,.5);
  border-left:3px solid var(--fr-b);background:linear-gradient(180deg,rgba(52,40,10,.65),rgba(12,18,23,.85))}
.sigrun .fr-card.k-times .fr-tag,.sigrun .fr-card.k-win .fr-tag{color:var(--fr-b)}
.sigrun .fr-card.k-stolen{border:1px solid rgba(224,90,74,.55);border-left:3px solid var(--fr-pen);
  background:linear-gradient(180deg,rgba(62,20,16,.7),rgba(12,18,23,.85))}
.sigrun .fr-card.k-stolen .fr-tag{color:var(--fr-pen)}
.sigrun .fr-win-b{display:flex;align-items:center;gap:13px;margin-top:3px}
.sigrun .fr-win-b .bb-av,.sigrun .fr-win-b img{border-radius:2px;border:2px solid var(--fr-b)}
.sigrun .fr-locked{margin-bottom:9px;min-height:34px;border-radius:2px;border:1px dashed rgba(150,180,200,.16);
  display:grid;place-items:center;font-family:'Archivo Narrow',sans-serif;font-size:10px;letter-spacing:4px;
  color:rgba(180,210,225,.26)}

.sigrun .fr-side{position:sticky;top:56px;padding:12px;border-radius:2px;background:rgba(14,23,30,.9);
  border:1px solid var(--fr-line)}
.sigrun .fr-side-h{font-family:'Archivo Narrow',sans-serif;font-size:11px;letter-spacing:3px;color:#fff}
.sigrun .fr-side-s{font-size:10.5px;color:var(--fr-dim);margin:3px 0 10px;line-height:1.5}
.sigrun .fr-srow{display:flex;align-items:center;gap:7px;font-size:11px;margin-bottom:5px;color:#bccbd6}
.sigrun .fr-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigrun .fr-srow em{font-style:normal;font-variant-numeric:tabular-nums;color:#fff}
.sigrun .fr-srow.is-pen em{color:var(--fr-pen)}
.sigrun .fr-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;
  align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(5,9,12,.42),rgba(5,9,12,.9));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid var(--fr-line)}
.sigrun .fr-count{font-family:'Archivo Narrow',sans-serif;font-size:11px;letter-spacing:2.4px;color:var(--fr-dim)}
${sealCss(P, '#5ad2e8')}
@media(prefers-reduced-motion:reduce){
  .sigrun *,.sigrun *::before,.sigrun *::after{animation:none!important;transition:none!important}
}
</style>`;

export function rpBuildSigFinalRun(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';

  const allSteps = comp.detail?.steps;
  const allBeats = (comp.beats || []).filter(b => b && b.text);
  // A finale saved before the run was indexed by card has no timeline to draw.
  if (!Array.isArray(allSteps) || allSteps.length !== allBeats.length || allSteps.length < 2) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';

  const runners = comp.detail?.runners || comp.placements || [];
  const segments = comp.detail?.segments || [];
  if (runners.length < 2 || !segments.length) return '';

  // A final Head of Household is never sealed — the Invisible HOH is a weekly
  // twist — but the helper costs nothing and the night is handled correctly if
  // one is ever staged.
  const sealed = isSealedHoh(act, actType);
  const limit = sealed
    ? planSeal(allSteps, { isResult: s => s.kind === 'times' || s.kind === 'win', countKind: 'segment', cap: 3 })
    : allSteps.length;

  const steps = allSteps.slice(0, limit);
  const beats = allBeats.slice(0, limit);
  const extra = sealed ? 2 : 0;
  const total = steps.length + extra;

  const stateKey = `bb_sig_run_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const idx = Math.min(state.idx, total - 1);
  const done = idx >= total - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;

  // ── replay: only the segments actually revealed ──
  const runSoFar = Object.fromEntries(runners.map(n => [n, []]));
  let stolen = false;
  let finishedTimes = null;
  steps.slice(0, Math.max(0, idx + 1)).forEach(s => {
    if (s.kind === 'segment' && runSoFar[s.who]) {
      runSoFar[s.who].push({ key: s.key, label: s.label, seconds: s.seconds,
        stumbled: s.stumbled, penalty: s.penalty });
    }
    if (s.kind === 'times') { stolen = !!s.stolen; finishedTimes = s; }
  });

  const elapsed = n => runSoFar[n].reduce((t, x) => t + x.seconds, 0);
  const complete = n => runSoFar[n].length >= segments.length;
  // The scale is the longest FINISHED run, so bars stay comparable while the
  // second runner is still going and never rescale under the viewer.
  const longest = Math.max(1, ...runners.map(n => (complete(n) ? elapsed(n) : 0)),
    ...runners.map(n => elapsed(n)));

  const hue = i => (i === 0 ? 'var(--fr-a)' : 'var(--fr-b)');

  // ── the lanes ──
  const lanes = runners.map((name, ri) => {
    const mine = runSoFar[name];
    const segsHtml = segments.map((seg, i) => {
      const run = mine[i];
      if (!run) return `<span class="fr-seg is-todo" style="width:${(100 / segments.length).toFixed(2)}%"></span>`;
      const clean = Math.max(0, run.seconds - (run.penalty || 0));
      const w = (clean / longest) * 100;
      const pw = ((run.penalty || 0) / longest) * 100;
      const base = `<span class="fr-seg ${run.stumbled ? 'is-stumble' : ''}"
          style="width:${w.toFixed(2)}%;background:${hue(ri)};color:#08131a"
          title="${esc(run.label)} · ${clean}s">${w > 7 ? esc(run.label.replace('THE ', '')) : ''}</span>`;
      const pen = run.penalty
        ? `<span class="fr-seg is-pen" style="width:${pw.toFixed(2)}%"
            title="rebuilt ${esc(run.label)} · +${run.penalty}s">${pw > 6 ? `+${run.penalty}s` : ''}</span>`
        : '';
      return base + pen;
    }).join('');

    // The other runner's finish, drawn across this lane. This is the whole
    // screen: neither of them could see it and the viewer can.
    const other = runners[ri === 0 ? 1 : 0];
    const ghostAt = complete(other) && !sealed ? (elapsed(other) / longest) * 100 : null;
    const ghost = ghostAt != null && ghostAt <= 100
      ? `<div class="fr-ghost"><i style="left:${ghostAt.toFixed(2)}%"></i>
          <b style="left:${ghostAt.toFixed(2)}%">${esc(other)} ${clock(elapsed(other))}</b></div>`
      : '';

    return `<div class="fr-lane">
      <div class="fr-lane-n"><i style="background:${hue(ri)}"></i>
        <span>${esc(name)}</span>
        <em>${sealed ? MASK : complete(name) ? clock(elapsed(name)) : mine.length ? `${clock(elapsed(name))}…` : '—'}</em></div>
      <div class="fr-bar">${segsHtml}</div>
      ${ghost}
    </div>`;
  }).join('');

  // ── cards ──
  let cards = '';
  beats.forEach((b, i) => {
    if (i > idx) { cards += `<div class="fr-locked">ON THE COURSE</div>`; return; }
    const s = steps[i] || {};
    let kind = 'a';
    if (s.kind === 'segment') kind = s.penalty ? 'pen' : (runners.indexOf(s.who) === 1 ? 'b' : 'a');
    else if (s.kind === 'split') kind = 'split';
    else if (s.kind === 'times') kind = s.stolen ? 'stolen' : 'times';
    else if (s.kind === 'win') kind = 'win';
    const icon = s.kind === 'segment' ? (SEG_ICON[s.key] || '') : s.kind === 'times' ? ICONS.clock : '';
    const right = s.kind === 'segment'
      ? `<span style="margin-left:auto;font-variant-numeric:tabular-nums;opacity:.7">${s.seconds}s${s.penalty ? ` (+${s.penalty})` : ''}</span>`
      : '';
    const isWin = s.kind === 'win' && winner;
    cards += `<article class="fr-card k-${kind}">
      <div class="fr-tag">${icon}${esc(b.badgeText || '')}${right}</div>
      ${isWin
    ? `<div class="fr-win-b">${avatar(winner, 54)}<div class="fr-body">${b.text}</div></div>`
    : `<div class="fr-body">${b.text}</div>`}
    </article>`;
  });

  if (sealed) {
    cards += idx >= steps.length
      ? sealCutCard(P, { standing: null, salt: ep.num || 0 })
      : `<div class="fr-locked">ON THE COURSE</div>`;
    cards += idx >= steps.length + 1 && winner
      ? sealIronyCard(P, { winner, avatar, esc, isHoh: true })
      : `<div class="fr-locked">ON THE COURSE</div>`;
  }

  // ── side: the splits, section by section ──
  const sideRows = segments.map((seg, i) => {
    const cells = runners.map(name => {
      const run = runSoFar[name][i];
      if (!run) return '<em>—</em>';
      return `<em class="${run.penalty ? 'pen' : ''}" style="min-width:42px;text-align:right;${run.penalty ? 'color:var(--fr-pen)' : ''}">${sealed ? MASK : `${run.seconds}s`}</em>`;
    }).join('');
    return `<div class="fr-srow"><span>${esc(seg.label.replace('THE ', ''))}</span>${cells}</div>`;
  }).join('');

  const clocks = runners.map((name, ri) => `<div class="fr-cl">
      <i style="background:${hue(ri)}"></i>
      <b style="color:${hue(ri)}">${sealed ? MASK : complete(name) ? clock(elapsed(name)) : mine0(runSoFar[name]) ? `${clock(elapsed(name))}` : '—:—'}</b>
      <span>${esc(name)}${complete(name) ? '' : runSoFar[name].length ? ' · running' : ' · to run'}</span>
    </div>`).join('');

  return `<div class="rp-page sigrun">${_STYLE}
    <div class="fr-yard"></div>
    <div class="fr-wrap">
      <div class="fr-head">
        <div class="fr-eyebrow">Final Head of Household · Part Two</div>
        <div class="fr-title">THE RUN</div>
        <div class="fr-sub">They run it separately, against a clock, and neither of them is allowed to watch the other one go. You are.</div>
        <div class="fr-clocks">${clocks}</div>
        ${comp.desc ? `<div class="fr-rules">${esc(comp.desc)}</div>` : ''}
      </div>

      <div class="fr-rig">
        <div class="fr-rig-h"><b>THE SAME COURSE, TWICE</b>
          <span>${idx < 0 ? 'Nobody has run yet.'
    : stolen ? 'The red block is wider than the gap between them.'
      : 'Each block is a section at its true width in seconds.'}</span></div>
        ${lanes}
        <div class="fr-scale"><span>0:00</span><span>${sealed ? MASK : clock(longest)}</span></div>
        <div class="fr-key">
          <span><i style="background:var(--fr-a)"></i>${esc(runners[0] || '')}</span>
          <span><i style="background:var(--fr-b)"></i>${esc(runners[1] || '')}</span>
          <span><i style="background:var(--fr-pen)"></i>rebuilt after a misread</span>
          <span><i style="background:#fff"></i>the other one's finish</span>
        </div>
      </div>

      <div class="fr-grid">
        <div>${cards}</div>
        <aside class="fr-side">
          <div class="fr-side-h">THE SPLITS</div>
          <div class="fr-side-s">${idx < 0
    ? 'Five sections, two runs, one clock.'
    : finishedTimes
      ? `${esc(finishedTimes.who)} by ${finishedTimes.margin}s.`
      : 'Section times as they come in.'}</div>
          ${sideRows}
          ${done && winner && !sealed ? `<div style="margin-top:11px;text-align:center;padding:10px;border-radius:2px;border:1px solid rgba(242,193,78,.5);background:rgba(242,193,78,.1)">
            <div style="width:48px;height:48px;border-radius:2px;overflow:hidden;margin:0 auto 6px;border:2px solid var(--fr-b)">${avatar(winner, 48)}</div>
            <b style="display:block;font-size:12.5px">${esc(winner)}</b>
            <i style="font-style:normal;font-size:10.5px;color:var(--fr-dim)">${clock(elapsed(winner) || breakdown[winner]?.totalSeconds || 0)} · goes to part three</i></div>` : ''}
        </aside>
      </div>

      <div class="fr-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}">Next section</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Run it out</button>`}
        <span class="fr-count">${Math.min(total, Math.max(0, idx + 1))} / ${total}</span>
      </div>
    </div>
  </div>`;
}

/** Has this runner started? Kept out of the template for legibility. */
function mine0(list) { return Array.isArray(list) && list.length > 0; }

export default rpBuildSigFinalRun;
