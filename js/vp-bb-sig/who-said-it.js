/**
 * Who Said It? — "THE EVIDENCE BOARD"
 *
 * A corkboard in a room nobody is supposed to be in. Every statement is pinned
 * up as a typed index card, three suspect polaroids hang under it, and a length
 * of red string runs from the card to whoever the house decided said it.
 *
 * The reason the screen is built this way: the competition's whole content is
 * ATTRIBUTION — a sentence and the question of whose mouth it came out of. A
 * list of quiz rounds renders that as trivia. A board with string on it renders
 * it as what it is, which is somebody being identified.
 *
 * The string is drawn to the ANSWER GIVEN, and turns green only when the card
 * resolves, so a wrong answer is visibly a line drawn to the wrong face.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Oswald:wght@400;600&display=swap');
.sigwsi{--ws-cork:#8a6236;--ws-cork2:#6b4a26;--ws-card:#f4ecd8;--ws-ink:#2a2118;--ws-string:#b3241f;
  --ws-ok:#2f7d46;--ws-brass:#c8a05a;font-family:'Oswald',system-ui,sans-serif;color:var(--ws-card);
  position:relative;overflow:clip}
.sigwsi .ws-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding-bottom:76px}
.sigwsi .ws-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(70% 50% at 50% 0%,rgba(255,229,168,0.14),transparent 60%),
    repeating-radial-gradient(circle at 20% 30%,rgba(0,0,0,0.05) 0 2px,transparent 2px 5px),
    linear-gradient(180deg,var(--ws-cork),var(--ws-cork2) 60%,#3d2a15)}
.sigwsi .ws-bg::after{content:'';position:absolute;inset:0;
  background:radial-gradient(120% 90% at 50% 0%,transparent 40%,rgba(0,0,0,.55));}

.sigwsi .ws-head{text-align:center;padding:14px 8px 6px}
.sigwsi .ws-eyebrow{font-size:9.5px;letter-spacing:4px;color:#e8d3a8;text-transform:uppercase}
.sigwsi .ws-title{font-family:'Special Elite',cursive;font-size:40px;letter-spacing:1px;margin:6px 0 2px;
  color:#fff7e4;text-shadow:0 3px 0 rgba(0,0,0,.45)}
.sigwsi .ws-sub{font-family:'Special Elite',cursive;font-size:13px;color:#efe0c0}
.sigwsi .ws-tape{display:inline-block;margin-top:8px;padding:3px 16px;background:rgba(244,236,216,.75);
  color:#3a2e20;font-family:'Special Elite',cursive;font-size:10px;letter-spacing:2px;transform:rotate(-1.2deg);
  box-shadow:0 2px 6px rgba(0,0,0,.35)}

.sigwsi .ws-grid{display:grid;grid-template-columns:minmax(0,1fr) 238px;gap:16px;align-items:start;margin-top:12px}
@media(max-width:860px){.sigwsi .ws-grid{grid-template-columns:1fr}}

/* ── a pinned statement ── */
.sigwsi .ws-case{position:relative;margin-bottom:20px;padding:16px 16px 14px;border-radius:2px;
  background:linear-gradient(178deg,#fbf5e6,var(--ws-card));color:var(--ws-ink);
  box-shadow:0 14px 30px rgba(0,0,0,.45);animation:wsIn .4s ease both}
.sigwsi .ws-case:nth-child(3n){transform:rotate(-.5deg)}
.sigwsi .ws-case:nth-child(3n+1){transform:rotate(.4deg)}
@keyframes wsIn{from{opacity:0;transform:translateY(12px) rotate(0)}to{opacity:1}}
.sigwsi .ws-pin{position:absolute;left:50%;top:-9px;transform:translateX(-50%);width:16px;height:16px;
  border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff6b63,#8f1712);
  box-shadow:0 3px 6px rgba(0,0,0,.5)}
.sigwsi .ws-no{font-family:'Special Elite',cursive;font-size:9.5px;letter-spacing:2px;color:#8a7355;
  text-transform:uppercase;margin-bottom:6px}
.sigwsi .ws-quote{font-family:'Special Elite',cursive;font-size:16px;line-height:1.5;
  padding:9px 10px;border-left:3px solid var(--ws-string);background:rgba(0,0,0,.045)}
.sigwsi .ws-suspects{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
.sigwsi .ws-pol{position:relative;width:78px;padding:5px 5px 16px;background:#fff;
  box-shadow:0 5px 12px rgba(0,0,0,.3);transform:rotate(var(--tilt,0deg))}
.sigwsi .ws-pol:nth-child(2){--tilt:-2deg}
.sigwsi .ws-pol:nth-child(3){--tilt:1.6deg}
.sigwsi .ws-pol-i{width:100%;aspect-ratio:1;overflow:hidden;background:#d8cdb8;display:grid;place-items:center}
.sigwsi .ws-pol-i img{width:100%;height:100%;object-fit:cover}
.sigwsi .ws-pol-n{position:absolute;left:0;right:0;bottom:2px;text-align:center;font-family:'Special Elite',cursive;
  font-size:9px;color:#3a2e20;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 3px}
.sigwsi .ws-pol.is-truth{outline:3px solid var(--ws-ok);outline-offset:2px}
.sigwsi .ws-pol.is-wrong{outline:3px solid var(--ws-string);outline-offset:2px;filter:saturate(.5)}
.sigwsi .ws-line{margin-top:10px;font-size:13px;color:#4a3c2a;line-height:1.55}
/* Who actually answered, said plainly.
   The narration names one houseguest out of twelve while the board shows three
   OTHER faces, so without this line a card is four names and no way to tell
   which of them is the person answering. */
.sigwsi .ws-verdict{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:13px;padding:8px 10px;
  border-radius:3px;background:rgba(42,33,24,.07);border:1px solid rgba(42,33,24,.14)}
.sigwsi .ws-who{width:26px;height:26px;border-radius:50%;overflow:hidden;flex:0 0 auto;
  border:1px solid rgba(42,33,24,.3)}
.sigwsi .ws-who img{width:100%;height:100%;object-fit:cover}
.sigwsi .ws-wrote{font-size:12.5px;color:#3a2e20}
.sigwsi .ws-wrote em{font-style:normal;font-weight:600;text-decoration:underline}
.sigwsi .ws-truth{margin-left:auto;font-size:11.5px;color:#6b5946}
.sigwsi .ws-truth b{color:var(--ws-ok)}
/* How the whole line did, so the running score on the board is explicable.
   Narrating one houseguest a round keeps the prose readable and hides the
   competition — a viewer could not see that six of eight got it. */
/* The WHOLE line's answers, not a headline count.
   "6 of 8 got this one" tells the viewer a number and hides the two people it
   is about — and those two are the entire reason the board moves. */
.sigwsi .ws-field{margin-top:11px;padding:9px 10px;border-radius:3px;background:rgba(42,33,24,.05);
  border:1px dashed rgba(42,33,24,.22)}
.sigwsi .ws-field-h{font-size:10.5px;letter-spacing:.6px;color:#7a6750;margin-bottom:7px}
.sigwsi .ws-field-h b{color:#3a2e20}
.sigwsi .ws-chips{display:flex;flex-wrap:wrap;gap:5px}
.sigwsi .ws-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:11px;
  font-size:10.5px;background:#fff;border:1px solid rgba(42,33,24,.18);color:#3a2e20}
.sigwsi .ws-chip i{width:6px;height:6px;border-radius:50%;flex:0 0 auto}
.sigwsi .ws-chip.is-ok i{background:var(--ws-ok)}
.sigwsi .ws-chip.is-no i{background:var(--ws-string)}
.sigwsi .ws-chip.is-no{background:rgba(179,36,31,.07);border-color:rgba(179,36,31,.3)}
.sigwsi .ws-chip em{font-style:normal;font-size:9.5px;color:#8a7355}
.sigwsi .ws-chip.is-no em{color:#a34b41}
.sigwsi .ws-stamp{position:absolute;right:10px;top:12px;font-family:'Special Elite',cursive;font-size:15px;
  letter-spacing:2px;padding:3px 9px;border:2.5px solid;border-radius:3px;transform:rotate(-11deg);opacity:.85}
.sigwsi .ws-stamp.is-ok{color:var(--ws-ok);border-color:var(--ws-ok)}
.sigwsi .ws-stamp.is-no{color:var(--ws-string);border-color:var(--ws-string)}
.sigwsi .ws-locked{margin-bottom:18px;min-height:70px;border:2px dashed rgba(244,236,216,.24);border-radius:2px;
  display:grid;place-items:center;font-family:'Special Elite',cursive;font-size:11px;letter-spacing:3px;
  color:rgba(244,236,216,.34)}

/* ── the board's own notes ── */
.sigwsi .ws-side{position:sticky;top:56px;padding:13px;border-radius:2px;background:rgba(20,13,6,.86);
  border:1px solid rgba(200,160,90,.3);box-shadow:0 10px 24px rgba(0,0,0,.4)}
.sigwsi .ws-side-h{font-family:'Special Elite',cursive;font-size:11px;letter-spacing:2px;color:var(--ws-brass);
  margin-bottom:2px}
.sigwsi .ws-side-s{font-size:11px;color:#c9b48c;margin-bottom:10px;line-height:1.45}
.sigwsi .ws-srow{display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:6px;color:#f0e3c6}
.sigwsi .ws-srow i{width:14px;font-style:normal;color:#9a8460;font-size:10px}
.sigwsi .ws-bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.09);overflow:hidden}
.sigwsi .ws-bar b{display:block;height:100%;background:linear-gradient(90deg,var(--ws-brass),#f0e3c6)}
.sigwsi .ws-srow em{font-style:normal;font-size:10.5px;color:var(--ws-brass);min-width:26px;text-align:right}
.sigwsi .ws-win{margin-top:11px;padding:11px;text-align:center;border:1px solid var(--ws-brass);
  background:rgba(200,160,90,.12)}
.sigwsi .ws-win-f{width:56px;height:56px;overflow:hidden;margin:0 auto 5px;border:3px solid #fff;
  box-shadow:0 4px 10px rgba(0,0,0,.4)}
.sigwsi .ws-win-f img{width:100%;height:100%;object-fit:cover}
.sigwsi .ws-win b{display:block;font-family:'Special Elite',cursive;font-size:14px;color:#fff7e4}
.sigwsi .ws-win i{font-size:11px;color:#c9b48c;font-style:normal}
.sigwsi .ws-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.12)}
.sigwsi .ws-rules{max-width:660px;margin:9px auto 0;padding:9px 12px;border-radius:6px;font-size:11.5px;line-height:1.55;opacity:.85;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
.sigwsi .ws-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px auto 2px;max-width:720px}
.sigwsi .ws-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;text-transform:uppercase}
.sigwsi .ws-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigwsi .ws-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigwsi .ws-w u{text-decoration:none;opacity:.75}
.sigwsi .ws-w.is-spread{opacity:.7;font-style:italic}
.sigwsi .ws-w.is-beh{opacity:.75;text-transform:none;letter-spacing:0;font-size:10px}
.sigwsi .ws-count{font-family:'Special Elite',cursive;font-size:11px;letter-spacing:2px;color:#d8c49c}
@media(prefers-reduced-motion:reduce){
  .sigwsi *,.sigwsi *::before,.sigwsi *::after{animation:none!important;transition:none!important}
}
</style>`;

export function rpBuildSigWhoSaidIt(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_wsi_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const rounds = comp.detail?.rounds || [];
  const winner = act.winner || comp.winner || null;
  const asked = Math.max(1, rounds.length || beats.length - 1);

  let cards = '';
  let qi = 0;
  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="ws-locked">UNPINNED</div>`; return; }
    // Matched by the statement itself rather than by a running index.
    //
    // Counting beats and counting rounds are two different counts the moment
    // anything else is ever narrated between questions, and when they drifted
    // the card showed one houseguest's quote above another question's three
    // suspects — with a MATCH stamp on it, because the stamp was reading the
    // wrong round too. Matching on content cannot drift.
    const quote = (b.text.match(/"([^"]+)"/) || [])[1];
    const round = quote ? rounds.find(r => b.text.includes(r.statement)) : null;
    // The closing card has no statement on it — it is the result, not evidence.
    if (!quote || !round) {
      cards += `<div class="ws-case"><span class="ws-pin"></span>
        <div class="ws-no">${esc(b.badgeText || 'THE BOARD')}</div>
        <div class="ws-line">${b.text}</div></div>`;
      return;
    }
    qi++;
    const rest = b.text.replace(`"${quote}"`, '').trim();
    // Read from the record, never from the prose.
    //
    // This used to scan the narration for whichever option name appeared in it
    // and call that the answer given. But the sentence describing a WRONG
    // answer names the right one too — "It was Raj, and the groan along the
    // line arrives before the answer does" — so cards narrating a miss were
    // being stamped MATCH. The competition now records who answered and what
    // they wrote, and this reads that.
    const truth = round.options[round.truthIndex];
    const answerer = round.spotlight || null;
    const named = round.given != null ? round.options[round.given] : null;
    const right = !!round.right;
    const suspects = round.options.map(o => `<figure class="ws-pol ${
      o === truth ? 'is-truth' : o === named ? 'is-wrong' : ''}">
      <div class="ws-pol-i">${avatar(o, 68)}</div>
      <figcaption class="ws-pol-n">${esc(o)}</figcaption></figure>`).join('');
    cards += `<div class="ws-case"><span class="ws-pin"></span>
      ${answerer ? `<div class="ws-stamp ${right ? 'is-ok' : 'is-no'}">${right ? 'MATCH' : 'NO MATCH'}</div>` : ''}
      <div class="ws-no">Statement ${qi} of ${asked}${round.week ? ` · week ${round.week}` : ''}</div>
      <div class="ws-quote">"${esc(quote)}"</div>
      <div class="ws-suspects">${suspects}</div>
      ${answerer ? `<div class="ws-verdict">
        <span class="ws-who">${avatar(answerer, 26)}</span>
        <span class="ws-wrote"><b>${esc(answerer)}</b> wrote <em>${esc(named || '—')}</em></span>
        <span class="ws-truth">it was <b>${esc(truth)}</b></span>
      </div>` : ''}
      ${round.answers ? `<div class="ws-field">
        <div class="ws-field-h"><b>${round.correct}</b> of <b>${round.field}</b> got it · a point each</div>
        <div class="ws-chips">${Object.entries(round.answers).map(([who, a]) => `
          <span class="ws-chip ${a.right ? 'is-ok' : 'is-no'}" title="${esc(who)} wrote ${esc(round.options[a.given] || '—')}">
            <i></i>${esc(who)}<em>${esc(round.options[a.given] || '—')}</em></span>`).join('')}</div>
      </div>` : ''}
      <div class="ws-line">${rest}</div>
    </div>`;
  });

  // The board as it stands RIGHT NOW, counted from the statements the viewer
  // has actually watched. It used to sit blank until the last card, which made
  // the one screen element that explains the scoring useless for the whole
  // competition.
  const seenRounds = [];
  let pinned = 0;
  beats.slice(0, state.idx + 1).forEach(b => {
    const q = (b.text.match(/"([^"]+)"/) || [])[1];
    const r = q ? rounds.find(x => b.text.includes(x.statement)) : null;
    if (r) { seenRounds.push(r); pinned++; }
  });
  const running = {};
  (act.participants || comp.placements || []).forEach(n => { running[n] = 0; });
  seenRounds.forEach(r => Object.entries(r.answers || {}).forEach(([n, a]) => {
    if (a.right) running[n] = (running[n] || 0) + 1;
  }));
  const standing = Object.keys(running).sort((a, b) => running[b] - running[a]);
  const board = standing.slice(0, 8).map((n, i) => {
    const got = running[n] || 0;
    const pct = pinned ? Math.round((got / pinned) * 100) : 0;
    const tb = done && breakdown[n]?.wonTiebreak;
    return `<div class="ws-srow"><i>${i + 1}</i>
      <span style="min-width:52px">${esc(n)}${tb ? ' ⧗' : ''}</span>
      <span class="ws-bar"><b style="width:${pct}%"></b></span>
      <em>${pinned ? `${got}/${pinned}` : '—'}</em></div>`;
  }).join('');

  return `<div class="rp-page sigwsi">${_STYLE}
    <div class="ws-bg"></div>
    <div class="ws-wrap">
      <div class="ws-head">
        <div class="ws-eyebrow">${esc(actType === 'veto' ? 'Power of Veto' : 'Head of Household')}</div>
        <div class="ws-title">WHO SAID IT?</div>
        <div class="ws-sub">Every statement is true of exactly one person in this house.</div>
        ${comp.desc ? `<div class="ws-rules">${esc(comp.desc)}</div>` : ''}
        ${(() => {
          // What the competition actually reads. `spreadStat` is drawn apart from
          // the weights on purpose: a stat that widens the SPREAD does not make a
          // houseguest better, it makes them less predictable, and putting it in
          // the same bar would say the opposite.
          const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
          if (!w.length) return '';
          const bars = w.map(([k, v]) => `<span class="ws-w"><i>${esc(k)}</i><span class="ws-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('');
          const spread = comp.spreadStat
            ? `<span class="ws-w is-spread" title="Widens the spread rather than raising the score"><i>± ${esc(comp.spreadStat)}</i><u>consistency</u></span>` : '';
          const beh = (comp.behaviour || []).map(b => `<span class="ws-w is-beh"><i>${esc(b.label)}</i><u>${Math.round(b.weight * 100)}%</u></span>`).join('');
          return `<div class="ws-weights">${bars}${spread}${beh}</div>`;
        })()}
        <div class="ws-tape">EVIDENCE · DO NOT REMOVE</div>
      </div>
      <div class="ws-grid">
        <div>${cards}</div>
        <aside class="ws-side">
          <div class="ws-side-h">THE BOARD</div>
          <div class="ws-side-s">Correct attributions after ${pinned} statement${pinned === 1 ? '' : 's'}. ⧗ won the tiebreaker.</div>
          ${board}
          ${done && winner ? `<div class="ws-win">
            <div class="ws-win-f">${avatar(winner, 56)}</div>
            <b>${esc(winner)}</b><i>was listening</i></div>` : ''}
        </aside>
      </div>
      <div class="ws-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Pin the next one</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Whole board</button>`}
        <span class="ws-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
