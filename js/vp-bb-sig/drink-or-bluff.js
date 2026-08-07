/**
 * To Drink or to Bluff — "THE TABLE"
 *
 * Shot from directly above a round table, the way a card room is shot. Green
 * baize, a brass rail, and one glass in front of every houseguest.
 *
 * The centrepiece is the ACCUSATION MAP. Each round draws a line from every
 * accuser to the person they named, straight across the felt, and the poisoned
 * glass lights up only when the round resolves. A round where the whole table
 * points at one innocent person LOOKS like that — six lines converging on
 * somebody who did nothing — which is the entire drama of this competition and
 * cannot be conveyed by a list of sentences.
 *
 * The sidebar is a tells ledger rather than a leaderboard: who has been accused
 * and how often, because being wrongly accused twice is a real cost in this
 * competition and the house is deciding it in front of you.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap');
.sigbluff{--bf-felt:#12432f;--bf-felt2:#0a2a1e;--bf-brass:#c9a227;--bf-ivory:#f3ead6;
  --bf-poison:#7ee787;--bf-blood:#a8302c;--bf-dim:#8fae9d;
  font-family:'Cormorant Garamond',Georgia,serif;color:var(--bf-ivory);position:relative;overflow:clip}
.sigbluff .bf-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigbluff .bf-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(80% 50% at 50% 8%,rgba(201,162,39,0.16),transparent 62%),
    radial-gradient(120% 80% at 50% 110%,rgba(0,0,0,0.6),transparent 60%),
    linear-gradient(180deg,#0d2a1e,#071710 75%,#050d09)}
.sigbluff .bf-bg::after{content:'';position:absolute;inset:0;opacity:.25;
  background:repeating-linear-gradient(45deg,rgba(255,255,255,0.035) 0 3px,transparent 3px 7px)}

.sigbluff .bf-head{text-align:center;padding:14px 8px 4px}
.sigbluff .bf-eyebrow{font-family:'Cinzel',serif;font-size:9.5px;letter-spacing:5px;color:var(--bf-brass);text-transform:uppercase}
.sigbluff .bf-title{font-family:'Cinzel',serif;font-size:38px;letter-spacing:3px;margin:6px 0 2px;color:var(--bf-ivory);
  text-shadow:0 0 26px rgba(201,162,39,.3)}
.sigbluff .bf-sub{font-size:15px;font-style:italic;color:#cfe0d3}
.sigbluff .bf-rule{width:180px;height:1px;margin:10px auto 12px;
  background:linear-gradient(90deg,transparent,var(--bf-brass),transparent)}

.sigbluff .bf-grid{display:grid;grid-template-columns:minmax(0,1fr) 244px;gap:16px;align-items:start}
@media(max-width:860px){.sigbluff .bf-grid{grid-template-columns:1fr}}

/* ── the table ── */
.sigbluff .bf-table{position:relative;margin:0 auto 14px;width:100%;max-width:430px;aspect-ratio:1;
  border-radius:50%;background:radial-gradient(circle at 50% 42%,#1a5b40,var(--bf-felt) 55%,var(--bf-felt2));
  border:9px solid #3a2a16;box-shadow:0 0 0 3px var(--bf-brass),0 26px 60px rgba(0,0,0,.6),inset 0 0 60px rgba(0,0,0,.45)}
.sigbluff .bf-table::after{content:'';position:absolute;inset:16%;border-radius:50%;
  border:1px dashed rgba(201,162,39,.28)}
.sigbluff .bf-lines{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.sigbluff .bf-seat{position:absolute;transform:translate(-50%,-50%);text-align:center;width:74px}
.sigbluff .bf-seat-g{width:34px;height:46px;margin:0 auto}
.sigbluff .bf-seat-n{font-family:'Cinzel',serif;font-size:9.5px;letter-spacing:.6px;margin-top:2px;
  color:#dfeee4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigbluff .bf-seat.is-poisoned .bf-seat-n{color:var(--bf-poison)}
.sigbluff .bf-seat.is-accused .bf-seat-n{color:#ffb3b0}
.sigbluff .bf-glow{position:absolute;left:50%;top:26%;transform:translate(-50%,-50%);width:54px;height:54px;
  border-radius:50%;background:radial-gradient(circle,rgba(126,231,135,.55),transparent 70%);
  animation:bfPulse 2.2s ease-in-out infinite}
@keyframes bfPulse{0%,100%{opacity:.45;transform:translate(-50%,-50%) scale(.9)}50%{opacity:.9;transform:translate(-50%,-50%) scale(1.12)}}
.sigbluff .bf-centre{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;width:60%}
.sigbluff .bf-centre-r{font-family:'Cinzel',serif;font-size:11px;letter-spacing:3px;color:var(--bf-brass)}
.sigbluff .bf-centre-v{font-size:13px;font-style:italic;color:#dfeee4;margin-top:3px;line-height:1.35}

/* ── round cards ── */
.sigbluff .bf-round{margin-bottom:12px;padding:13px 15px;border-radius:4px;
  border:1px solid rgba(201,162,39,.22);border-left:3px solid var(--bf-brass);
  background:linear-gradient(160deg,rgba(10,42,30,.94),rgba(5,20,14,.94));
  box-shadow:0 10px 24px rgba(0,0,0,.4);animation:bfIn .38s ease both}
@keyframes bfIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.sigbluff .bf-round.is-verdict{border-left-color:var(--bf-poison)}
.sigbluff .bf-round.is-caught{border-left-color:var(--bf-blood)}
.sigbluff .bf-tag{font-family:'Cinzel',serif;font-size:9px;letter-spacing:2.4px;color:var(--bf-brass);
  text-transform:uppercase;margin-bottom:6px}
.sigbluff .bf-round.is-verdict .bf-tag{color:var(--bf-poison)}
.sigbluff .bf-round.is-caught .bf-tag{color:#ff8f8b}
.sigbluff .bf-body{font-size:14.5px;line-height:1.6}
.sigbluff .bf-locked{margin-bottom:12px;min-height:52px;border-radius:4px;border:1px dashed rgba(243,234,214,.16);
  display:grid;place-items:center;font-family:'Cinzel',serif;font-size:10px;letter-spacing:4px;color:rgba(243,234,214,.28)}

/* ── the ledger ── */
.sigbluff .bf-side{position:sticky;top:56px;padding:13px;border-radius:4px;
  border:1px solid rgba(201,162,39,.26);background:linear-gradient(180deg,rgba(8,32,23,.96),rgba(4,14,10,.96))}
.sigbluff .bf-side-h{font-family:'Cinzel',serif;font-size:10px;letter-spacing:2.6px;color:var(--bf-brass);margin-bottom:2px}
.sigbluff .bf-side-s{font-size:12px;font-style:italic;color:var(--bf-dim);margin-bottom:10px}
.sigbluff .bf-lrow{display:flex;align-items:center;gap:7px;margin-bottom:7px;font-size:12.5px}
.sigbluff .bf-lrow span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigbluff .bf-pips{display:flex;gap:2px}
.sigbluff .bf-pip{width:7px;height:7px;border-radius:50%;background:var(--bf-blood);opacity:.85}
.sigbluff .bf-pip.is-pt{background:var(--bf-brass)}
.sigbluff .bf-fin{margin-top:11px;padding-top:10px;border-top:1px solid rgba(201,162,39,.2)}
.sigbluff .bf-win{margin-top:11px;text-align:center;padding:11px;border-radius:4px;
  border:1px solid var(--bf-brass);background:rgba(201,162,39,.1)}
.sigbluff .bf-win-f{width:58px;height:58px;border-radius:50%;overflow:hidden;margin:0 auto 5px;border:1px solid var(--bf-brass)}
.sigbluff .bf-win-f img{width:100%;height:100%;object-fit:cover}
.sigbluff .bf-win b{display:block;font-family:'Cinzel',serif;font-size:14px;color:var(--bf-ivory)}
.sigbluff .bf-win i{font-size:12px;color:var(--bf-dim)}
.sigbluff .bf-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.sigbluff .bf-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.sigbluff .bf-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px auto 2px;max-width:720px}
.sigbluff .bf-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.sigbluff .bf-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigbluff .bf-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigbluff .bf-w u{text-decoration:none;opacity:.75}
.sigbluff .bf-w.is-spread{opacity:.7;font-style:italic}
.sigbluff .bf-w.is-beh{opacity:.75;text-transform:none;letter-spacing:0;font-size:10px}
.sigbluff .bf-count{font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;color:var(--bf-dim)}
@media(prefers-reduced-motion:reduce){
  .sigbluff *,.sigbluff *::before,.sigbluff *::after{animation:none!important;transition:none!important}
}
</style>`;

/** One glass, seen from slightly above. Poisoned ones have something rising. */
const _glass = poisoned => `<svg viewBox="0 0 24 34" width="34" height="46" aria-hidden="true">
  <ellipse cx="12" cy="31" rx="8" ry="2.4" fill="rgba(0,0,0,.35)"/>
  <path d="M5 3 h14 l-2.2 15 a4.8 4.8 0 0 1 -9.6 0 z"
    fill="${poisoned ? 'rgba(126,231,135,.55)' : 'rgba(220,235,228,.22)'}"
    stroke="${poisoned ? '#7ee787' : '#d9e6dd'}" stroke-width="1.1"/>
  <line x1="12" y1="23" x2="12" y2="28" stroke="#d9e6dd" stroke-width="1.3"/>
  <rect x="7.5" y="28" width="9" height="1.7" rx="0.85" fill="#d9e6dd"/>
  ${poisoned ? `<circle cx="12" cy="14" r="1.5" fill="#bcffc9"><animate attributeName="cy" values="17;6" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.4s" repeatCount="indefinite"/></circle>` : ''}
</svg>`;

export function rpBuildSigDrinkOrBluff(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_bluff_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const rounds = comp.detail?.rounds || [];
  const winner = act.winner || comp.winner || null;
  const seats = (act.participants && act.participants.length
    ? act.participants
    : (comp.placements || [])).filter(Boolean);

  // Which round the viewer is currently inside — the table draws THAT round.
  let shown = -1;
  beats.slice(0, state.idx + 1).forEach(b => {
    const m = String(b.badgeText || '').match(/ROUND (\d+)/);
    if (m) shown = Math.max(shown, Number(m[1]) - 1);
    if (b.badgeText === 'GOT AWAY WITH IT' || b.badgeText === 'CAUGHT') shown = Math.max(shown, 0);
  });
  const resolved = beats.slice(0, state.idx + 1).some(b =>
    b.badgeText === 'GOT AWAY WITH IT' || b.badgeText === 'CAUGHT');
  const live = rounds[Math.max(0, Math.min(shown, rounds.length - 1))] || null;

  // ── seat geometry: everybody around an ellipse ──
  const n = Math.max(2, seats.length);
  const pos = seats.map((name, i) => {
    const ang = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
    return { name, x: 50 + Math.cos(ang) * 37, y: 50 + Math.sin(ang) * 37 };
  });
  const at = name => pos.find(p => p.name === name);

  const accusationLines = live && resolved
    ? Object.entries(live.accusations || {}).map(([from, to]) => {
      const a = at(from);
      const b = at(to);
      if (!a || !b) return '';
      const right = to === live.poisoned;
      return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
        stroke="${right ? '#7ee787' : '#a8302c'}" stroke-width="${right ? 0.9 : 0.6}"
        stroke-dasharray="${right ? '' : '2 1.6'}" opacity="${right ? 0.9 : 0.55}"/>`;
    }).join('')
    : '';

  const seatEls = pos.map(p => {
    const poisoned = resolved && live && live.poisoned === p.name;
    const accused = resolved && live
      ? Object.values(live.accusations || {}).filter(t => t === p.name).length
      : 0;
    return `<div class="bf-seat ${poisoned ? 'is-poisoned' : accused ? 'is-accused' : ''}"
      style="left:${p.x}%;top:${p.y}%">
      <div class="bf-seat-g">${_glass(poisoned)}</div>
      <div class="bf-seat-n">${esc(p.name)}</div>
    </div>`;
  }).join('');

  let cards = '';
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="bf-locked">SEALED</div>`; return; }
    const verdict = b.badgeText === 'GOT AWAY WITH IT';
    const caught = b.badgeText === 'CAUGHT';
    cards += `<div class="bf-round ${verdict ? 'is-verdict' : caught ? 'is-caught' : ''}">
      <div class="bf-tag">${esc(b.badgeText || '')}</div>
      <div class="bf-body">${b.text}</div>
    </div>`;
  });

  const ledger = seats.map(name => {
    const row = breakdown[name] || {};
    const wrong = row.falselyAccused || 0;
    const pts = row.points || 0;
    return `<div class="bf-lrow">
      <span>${esc(name)}</span>
      <span class="bf-pips">${Array.from({ length: Math.min(4, wrong) }, () => '<i class="bf-pip"></i>').join('')}${
  done ? Array.from({ length: Math.min(6, pts) }, () => '<i class="bf-pip is-pt"></i>').join('') : ''}</span>
    </div>`;
  }).join('');

  return `<div class="rp-page sigbluff">${_STYLE}
    <div class="bf-bg"></div>
    <div class="bf-wrap">
      <div class="bf-head">
        <div class="bf-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : 'Head of Household')}</div>
        <div class="bf-title">TO DRINK OR TO BLUFF</div>
        <div class="bf-sub">One glass is worse than the others, and only one person knows which.</div>
        ${comp.desc ? `<div class="bf-rules">${esc(comp.desc)}</div>` : ''}
        ${(() => {
          // What the competition actually reads. `spreadStat` is drawn apart from
          // the weights on purpose: a stat that widens the SPREAD does not make a
          // houseguest better, it makes them less predictable, and putting it in
          // the same bar would say the opposite.
          const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
          if (!w.length) return '';
          const bars = w.map(([k, v]) => `<span class="bf-w"><i>${esc(k)}</i><span class="bf-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('');
          const spread = comp.spreadStat
            ? `<span class="bf-w is-spread" title="Widens the spread rather than raising the score"><i>± ${esc(comp.spreadStat)}</i><u>consistency</u></span>` : '';
          const beh = (comp.behaviour || []).map(b => `<span class="bf-w is-beh"><i>${esc(b.label)}</i><u>${Math.round(b.weight * 100)}%</u></span>`).join('');
          return `<div class="bf-weights">${bars}${spread}${beh}</div>`;
        })()}
        <div class="bf-rule"></div>
      </div>
      <div class="bf-grid">
        <div>
          <div class="bf-table">
            <svg class="bf-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${accusationLines}</svg>
            ${resolved && live ? `<div class="bf-glow" style="left:${at(live.poisoned)?.x || 50}%;top:${at(live.poisoned)?.y || 50}%"></div>` : ''}
            ${seatEls}
            <div class="bf-centre">
              <div class="bf-centre-r">${live && shown >= 0 ? `ROUND ${live.round}` : 'THE TABLE'}</div>
              <div class="bf-centre-v">${resolved && live
    ? `${esc(live.poisoned)} drew it${live.held ? ' — and held it' : ' — and the room saw'}`
    : 'Everybody drinks at the same time.'}</div>
            </div>
          </div>
          ${cards}
        </div>
        <aside class="bf-side">
          <div class="bf-side-h">THE LEDGER</div>
          <div class="bf-side-s">Red for a name taken in vain. Gold for a point.</div>
          ${ledger}
          ${done && winner ? `<div class="bf-fin"></div><div class="bf-win">
            <div class="bf-win-f">${avatar(winner, 58)}</div>
            <b>${esc(winner)}</b><i>read the table</i></div>` : ''}
        </aside>
      </div>
      <div class="bf-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Next pour</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">All rounds</button>`}
        <span class="bf-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
