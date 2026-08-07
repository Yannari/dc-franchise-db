/**
 * Dizzy Discs — "THE CAROUSEL"
 *
 * A fairground ride built by somebody with a grudge. The rig sits at the top of
 * the screen with a padded arm sweeping round it, and under the arm is a ring of
 * discs — one per houseguest — that visibly EMPTY as the competition goes on.
 *
 * The ring is the point. This is an elimination competition, and a list of
 * cards tells you somebody went out while a ring of discs shows you the yard
 * getting quieter. A dark disc is a person who was standing there ten minutes
 * ago.
 *
 * Everything spins here — the arm, the ring, the badge stripes — because the
 * one thing every houseguest in this competition has in common is that they
 * cannot make it stop.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Barlow:wght@400;600&display=swap');
.sigdisc{--dz-night:#151033;--dz-night2:#0a0720;--dz-pink:#ff5da2;--dz-cyan:#4ce0e0;--dz-lamp:#ffd166;
  --dz-ink:#f2ecff;--dz-dim:#9d93c4;font-family:'Barlow',system-ui,sans-serif;color:var(--dz-ink);
  position:relative;overflow:clip}
.sigdisc .dz-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigdisc .dz-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(70% 44% at 50% 4%,rgba(255,93,162,0.18),transparent 62%),
    radial-gradient(50% 40% at 82% 40%,rgba(76,224,224,0.10),transparent 60%),
    linear-gradient(180deg,var(--dz-night),var(--dz-night2) 70%,#050418)}
.sigdisc .dz-bg::after{content:'';position:absolute;inset:0;opacity:.5;
  background:conic-gradient(from 0deg at 50% 12%,rgba(255,255,255,.05) 0 8deg,transparent 8deg 26deg);
  animation:dzSweepBg 12s linear infinite}
@keyframes dzSweepBg{to{transform:rotate(360deg)}}

.sigdisc .dz-head{text-align:center;padding:14px 8px 4px}
.sigdisc .dz-eyebrow{font-size:10px;letter-spacing:4px;color:var(--dz-cyan);text-transform:uppercase}
.sigdisc .dz-title{font-family:'Fredoka',cursive;font-size:44px;letter-spacing:1px;margin:4px 0 2px;
  color:var(--dz-pink);text-shadow:0 0 30px rgba(255,93,162,.45)}
.sigdisc .dz-sub{font-size:13px;color:#cdc3ec}

/* ── the ring of discs ── */
.sigdisc .dz-ring{position:relative;width:min(320px,86%);aspect-ratio:1;margin:10px auto 16px}
.sigdisc .dz-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:54px;height:54px;
  border-radius:50%;background:radial-gradient(circle at 40% 35%,#3a2f6b,#160f38);
  border:2px solid rgba(255,209,102,.5);box-shadow:0 0 22px rgba(255,209,102,.25)}
.sigdisc .dz-arm{position:absolute;left:50%;top:50%;width:46%;height:9px;transform-origin:0 50%;
  border-radius:5px;background:linear-gradient(90deg,var(--dz-lamp),rgba(255,209,102,.25));
  animation:dzArm 3.4s linear infinite}
@keyframes dzArm{from{transform:translateY(-50%) rotate(0)}to{transform:translateY(-50%) rotate(360deg)}}
.sigdisc .dz-disc{position:absolute;transform:translate(-50%,-50%);width:62px;text-align:center}
.sigdisc .dz-plate{width:46px;height:46px;margin:0 auto;border-radius:50%;
  background:radial-gradient(circle at 38% 32%,#5b4bb0,#241a52);border:2px solid rgba(76,224,224,.5);
  box-shadow:0 0 16px rgba(76,224,224,.25);animation:dzSpin 2.6s linear infinite;display:grid;place-items:center}
@keyframes dzSpin{to{transform:rotate(360deg)}}
.sigdisc .dz-plate i{display:block;width:4px;height:16px;border-radius:2px;background:rgba(255,255,255,.55)}
.sigdisc .dz-disc.is-out .dz-plate{background:#140f2e;border-color:rgba(157,147,196,.25);box-shadow:none;
  animation:none;opacity:.45}
.sigdisc .dz-disc-n{font-size:9.5px;margin-top:3px;color:#cdc3ec;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.sigdisc .dz-disc.is-out .dz-disc-n{color:#6f6796;text-decoration:line-through}

.sigdisc .dz-grid{display:grid;grid-template-columns:minmax(0,1fr) 232px;gap:16px;align-items:start}
@media(max-width:860px){.sigdisc .dz-grid{grid-template-columns:1fr}}
.sigdisc .dz-card{margin-bottom:10px;padding:12px 14px;border-radius:14px;
  border:1px solid rgba(255,93,162,.16);background:linear-gradient(160deg,rgba(35,26,80,.9),rgba(12,8,32,.94));
  box-shadow:0 10px 24px rgba(0,0,0,.45);animation:dzIn .34s ease both}
@keyframes dzIn{from{opacity:0;transform:translateY(9px) rotate(-.4deg)}to{opacity:1;transform:none}}
.sigdisc .dz-card.is-out{border-color:rgba(255,93,162,.45)}
.sigdisc .dz-card.is-final{border-color:rgba(255,209,102,.6);background:linear-gradient(160deg,rgba(80,58,20,.7),rgba(20,12,40,.94))}
.sigdisc .dz-tag{font-family:'Fredoka',cursive;font-size:10px;letter-spacing:2px;color:var(--dz-cyan);margin-bottom:6px}
.sigdisc .dz-card.is-out .dz-tag{color:var(--dz-pink)}
.sigdisc .dz-card.is-final .dz-tag{color:var(--dz-lamp)}
.sigdisc .dz-body{font-size:12.8px;line-height:1.6;color:#e6dffb}
.sigdisc .dz-locked{margin-bottom:10px;min-height:46px;border-radius:14px;border:1px dashed rgba(242,236,255,.14);
  display:grid;place-items:center;font-family:'Fredoka',cursive;font-size:11px;letter-spacing:3px;color:rgba(242,236,255,.24)}

.sigdisc .dz-side{position:sticky;top:56px;padding:13px;border-radius:14px;
  border:1px solid rgba(76,224,224,.22);background:linear-gradient(180deg,rgba(24,17,58,.96),rgba(8,5,24,.96))}
.sigdisc .dz-side-h{font-family:'Fredoka',cursive;font-size:11px;letter-spacing:2px;color:var(--dz-cyan);margin-bottom:2px}
.sigdisc .dz-side-s{font-size:11px;color:var(--dz-dim);margin-bottom:10px;line-height:1.45}
.sigdisc .dz-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:6px}
.sigdisc .dz-srow i{width:14px;font-style:normal;font-size:10px;color:var(--dz-dim)}
.sigdisc .dz-srow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigdisc .dz-srow b{font-family:'Fredoka',cursive;font-size:10.5px;color:var(--dz-lamp)}
.sigdisc .dz-win{margin-top:11px;text-align:center;padding:12px;border-radius:14px;
  border:1px solid var(--dz-lamp);background:rgba(255,209,102,.12)}
.sigdisc .dz-win-f{width:58px;height:58px;border-radius:50%;overflow:hidden;margin:0 auto 6px;border:2px solid var(--dz-lamp)}
.sigdisc .dz-win-f img{width:100%;height:100%;object-fit:cover}
.sigdisc .dz-win b{display:block;font-family:'Fredoka',cursive;font-size:15px;color:var(--dz-ink)}
.sigdisc .dz-win i{font-style:normal;font-size:11.5px;color:var(--dz-dim)}
.sigdisc .dz-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.sigdisc .dz-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.sigdisc .dz-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px auto 2px;max-width:720px}
.sigdisc .dz-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.sigdisc .dz-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigdisc .dz-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigdisc .dz-w u{text-decoration:none;opacity:.75}
.sigdisc .dz-w.is-spread{opacity:.7;font-style:italic}
.sigdisc .dz-w.is-beh{opacity:.75;text-transform:none;letter-spacing:0;font-size:10px}
.sigdisc .dz-count{font-family:'Fredoka',cursive;font-size:11px;letter-spacing:2px;color:var(--dz-dim)}
@media(prefers-reduced-motion:reduce){
  .sigdisc *,.sigdisc *::before,.sigdisc *::after{animation:none!important;transition:none!important}
}
</style>`;

export function rpBuildSigDizzyDiscs(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_disc_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;
  const roster = (act.participants && act.participants.length
    ? act.participants : (comp.placements || [])).filter(Boolean);

  // Who is already off, at the point the viewer has watched to. Read from the
  // revealed beats so the ring can never empty ahead of the story.
  const gone = new Set();
  beats.slice(0, state.idx + 1).forEach(b => {
    if (/OUT|RUNNER-UP/.test(b.badgeText || '')) (b.players || []).forEach(n => gone.add(n));
  });

  const n = Math.max(1, roster.length);
  const discs = roster.map((name, i) => {
    const ang = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
    const x = 50 + Math.cos(ang) * 38;
    const y = 50 + Math.sin(ang) * 38;
    return `<div class="dz-disc ${gone.has(name) ? 'is-out' : ''}" style="left:${x}%;top:${y}%">
      <div class="dz-plate"><i></i></div>
      <div class="dz-disc-n">${esc(name)}</div>
    </div>`;
  }).join('');

  let cards = '';
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="dz-locked">STILL SPINNING</div>`; return; }
    const outCard = /OUT|RUNNER-UP/.test(b.badgeText || '');
    const finalCard = (b.badgeText || '') === 'WINS IT';
    cards += `<div class="dz-card ${outCard ? 'is-out' : finalCard ? 'is-final' : ''}">
      <div class="dz-tag">${esc(b.badgeText || '')}</div>
      <div class="dz-body">${b.text}</div>
    </div>`;
  });

  const rows = (comp.placements || []).slice(0, 8).map((name, i) => {
    const row = breakdown[name] || {};
    return `<div class="dz-srow"><i>${i + 1}</i><span>${esc(name)}</span>
      <b>${done && row.rounds != null ? `${row.rounds} rd` : '—'}</b></div>`;
  }).join('');

  return `<div class="rp-page sigdisc">${_STYLE}
    <div class="dz-bg"></div>
    <div class="dz-wrap">
      <div class="dz-head">
        <div class="dz-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : 'Head of Household')}</div>
        <div class="dz-title">DIZZY DISCS</div>
        <div class="dz-sub">Spun, bashed, and holding a rope. Last one turning wins.</div>
        ${comp.desc ? `<div class="dz-rules">${esc(comp.desc)}</div>` : ''}
        ${(() => {
          // What the competition actually reads. `spreadStat` is drawn apart from
          // the weights on purpose: a stat that widens the SPREAD does not make a
          // houseguest better, it makes them less predictable, and putting it in
          // the same bar would say the opposite.
          const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
          if (!w.length) return '';
          const bars = w.map(([k, v]) => `<span class="dz-w"><i>${esc(k)}</i><span class="dz-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('');
          const spread = comp.spreadStat
            ? `<span class="dz-w is-spread" title="Widens the spread rather than raising the score"><i>± ${esc(comp.spreadStat)}</i><u>consistency</u></span>` : '';
          const beh = (comp.behaviour || []).map(b => `<span class="dz-w is-beh"><i>${esc(b.label)}</i><u>${Math.round(b.weight * 100)}%</u></span>`).join('');
          return `<div class="dz-weights">${bars}${spread}${beh}</div>`;
        })()}
      </div>
      <div class="dz-ring">
        <div class="dz-arm"></div>
        <div class="dz-hub"></div>
        ${discs}
      </div>
      <div class="dz-grid">
        <div>${cards}</div>
        <aside class="dz-side">
          <div class="dz-side-h">STILL ON</div>
          <div class="dz-side-s">${roster.length - gone.size} of ${roster.length} discs still turning.</div>
          ${rows}
          ${done && winner ? `<div class="dz-win">
            <div class="dz-win-f">${avatar(winner, 58)}</div>
            <b>${esc(winner)}</b><i>${breakdown[winner]?.rounds || 0} rounds of it</i></div>` : ''}
        </aside>
      </div>
      <div class="dz-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Next sweep</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Run it out</button>`}
        <span class="dz-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
