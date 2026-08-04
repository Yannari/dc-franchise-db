// ══════════════════════════════════════════════════════════════════════
// vp-bb-roadkill.js — "The Third Key"
// ══════════════════════════════════════════════════════════════════════
//
// The screen for BB Roadkill: a competition played one at a time behind a
// closed door, whose result is never read out.
//
// It is built around the one thing the viewer has that the house does not.
// The board shows twelve doors, one per houseguest, and they close one after
// another as the reveal advances — because that is what the house sees, a
// procession of people going in and coming out saying nothing. Then a third
// key turns on the nomination wall with no hand on it.
//
// The truth is held back to the very last card and framed as a confidence,
// not a result: the viewer is told who it was, the house never is, and the
// screen then shows what the house decided INSTEAD — every wrong guess listed
// against the name that is going to pay for it. That gap is the twist, so it
// is the last thing on the screen rather than a footnote.
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {object} ep    the week record
 * @param {object} act   the roadkill act
 * @param {object} u     { tvState, reveal, avatar, esc }
 * @returns {string} html, or '' when there is nothing to draw
 */
export function rpBuildBBRoadkill(ep, act, u = {}) {
  if (!act || !act.winner || !act.nominee) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';

  const stateKey = `bb_roadkill_${ep.num}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const field = (act.results || []).map(r => r.name).filter(Boolean);
  const comp = act.competition || {};
  const guesses = (ep.roadkillGuesses || []).filter(g => g && g.who && g.guess);

  // One step per houseguest going in, then the third key, then the confidence,
  // then what the house decided instead.
  const steps = [
    { kind: 'open' },
    ...field.map(name => ({ kind: 'door', name })),
    { kind: 'key' },
    { kind: 'truth' },
    ...(guesses.length ? [{ kind: 'blame' }] : []),
  ];
  const total = steps.length;
  const idx = state.idx;
  const revealed = Math.min(total, Math.max(0, idx + 1));
  const done = idx >= total - 1;

  const doorsShut = steps.slice(0, revealed).filter(s => s.kind === 'door').length;
  const keyTurned = steps.slice(0, revealed).some(s => s.kind === 'key');
  const told = steps.slice(0, revealed).some(s => s.kind === 'truth');

  // The wall of doors. They shut as the field goes through, and not one of
  // them tells you anything on the way out — which is the point.
  const wall = `<div class="rk-wall">
    ${field.map((name, k) => `<div class="rk-door ${k < doorsShut ? 'is-shut' : ''}">
      <span class="rk-doorav">${AV(name, 30)}</span>
      <span class="rk-doorn">${E(String(name).split(' ')[0])}</span>
      <span class="rk-knob" aria-hidden="true"></span>
    </div>`).join('')}
  </div>`;

  const cards = steps.map((s, i) => {
    if (i > idx) return '<article class="rk-card is-shut"><span class="rk-lock">— — —</span></article>';

    if (s.kind === 'open') {
      return `<article class="rk-card rk-open">
        <header class="rk-hd"><span class="rk-tag">PLAYED ALONE</span>
          <span class="rk-sub">${field.length} houseguests, one at a time</span></header>
        <p class="rk-body">They go in one by one, and the door shuts behind each of them.
          ${comp.name ? `Tonight it is <b>${E(comp.name)}</b>.` : ''}
          ${comp.desc ? `<span class="rk-rules">${E(comp.desc)}</span>` : ''}</p>
      </article>`;
    }

    if (s.kind === 'door') {
      return `<article class="rk-card rk-door-card">
        <span class="rk-doorface">${AV(s.name, 34)}</span>
        <p class="rk-body"><b>${E(s.name)}</b> goes in. The door shuts. When it opens again
          ${E(String(s.name).split(' ')[0])} says nothing at all on the way past, which is exactly
          what everybody who has already been in said.</p>
      </article>`;
    }

    if (s.kind === 'key') {
      return `<article class="rk-card rk-key">
        <header class="rk-hd"><span class="rk-tag rk-tag-red">THE THIRD KEY</span></header>
        <div class="rk-keyb">
          <figure>${AV(act.nominee, 62)}<figcaption>${E(act.nominee)}</figcaption></figure>
          <p class="rk-body">A third key turns on the wall, and there is no hand on it.
            <b>${E(act.nominee)}</b> is nominated, beside two names that have somebody's
            signature on them and one that does not.</p>
        </div>
      </article>`;
    }

    if (s.kind === 'truth') {
      return `<article class="rk-card rk-truth">
        <header class="rk-hd"><span class="rk-tag rk-tag-gold">ONLY YOU KNOW THIS</span></header>
        <div class="rk-truthb">
          <figure>${AV(act.winner, 62)}<figcaption>${E(act.winner)}</figcaption></figure>
          <div>
            <p class="rk-body"><b>${E(act.winner)}</b> won BB Roadkill, and named
              ${E(act.nominee)}.</p>
            ${act.why ? `<p class="rk-why">${E(act.why)}</p>` : ''}
            <p class="rk-body rk-quiet">Nobody in that house is ever told this. It does not
              come out at the ceremony, it does not come out at the vote, and if the veto comes
              off ${E(act.nominee)} it is ${E(act.winner)} who quietly names the replacement.</p>
          </div>
        </div>
      </article>`;
    }

    // What the house decided instead.
    const wrong = guesses.filter(g => !g.correct);
    return `<article class="rk-card rk-blame">
      <header class="rk-hd"><span class="rk-tag">WHAT THE HOUSE DECIDED</span>
        <span class="rk-sub">${wrong.length} of ${guesses.length} wrong</span></header>
      <div class="rk-guesses">
        ${guesses.map(g => `<div class="rk-guess ${g.correct ? 'is-right' : 'is-wrong'}">
          <span>${AV(g.who, 26)}<b>${E(g.who)}</b></span>
          <em>blames</em>
          <span>${AV(g.guess, 26)}<b>${E(g.guess)}</b></span>
          <i>${g.correct ? 'and is right' : 'and is wrong'}</i>
        </div>`).join('')}
      </div>
      <p class="rk-body rk-quiet">${wrong.length
    ? 'Every wrong name up there is a real enemy made this week, by somebody who did nothing.'
    : 'The house read it correctly, which will not happen every time.'}</p>
    </article>`;
  }).join('');

  return `<div class="rp-page bb-room bb-block sigrk">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500&display=swap');
  .sigrk{--rk-ink:#efe6df;--rk-dim:#8b7d75;--rk-line:rgba(210,80,60,.26);--rk-red:#e2503c;
    max-width:1100px;margin:0 auto;color:var(--rk-ink);font-family:Inter,system-ui,sans-serif;
    background:
      radial-gradient(ellipse 50% 30% at 50% 0%,rgba(226,80,60,.16),transparent 70%),
      linear-gradient(180deg,#1d1512,#0d0908 84%);
    padding:0;position:relative;overflow:clip}

  .rk-head{text-align:center;padding:16px 16px 12px}
  .rk-week{font-size:9px;letter-spacing:3.2px;color:var(--rk-dim)}
  .rk-name{font-family:Anton,sans-serif;font-size:40px;line-height:1;letter-spacing:2px;
    text-transform:uppercase;color:#fff0e9;text-shadow:0 0 28px rgba(226,80,60,.5);margin:3px 0 3px}
  .rk-tagline{font-size:11px;letter-spacing:2.2px;color:var(--rk-red)}

  /* the wall of doors */
  .rk-wall{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;padding:12px 16px 4px}
  .rk-door{position:relative;width:54px;padding:7px 4px 9px;text-align:center;border-radius:3px 3px 0 0;
    background:linear-gradient(180deg,#3a2a24,#241a16);border:1px solid rgba(210,150,120,.2);
    transition:background .4s,opacity .4s}
  .rk-door .bb-av{border-radius:3px;opacity:.85}
  .rk-doorn{display:block;font-size:8px;letter-spacing:.6px;color:#c7b2a8;margin-top:3px}
  .rk-knob{position:absolute;right:5px;top:50%;width:4px;height:4px;border-radius:50%;
    background:rgba(226,190,170,.5)}
  .rk-door.is-shut{background:linear-gradient(180deg,#241a16,#150e0c)}
  .rk-door.is-shut .bb-av{opacity:.22;filter:grayscale(1)}
  .rk-door.is-shut .rk-doorn{color:var(--rk-dim)}

  .rk-body-wrap{padding:10px 16px 0}
  .rk-card{border:1px solid var(--rk-line);border-radius:8px;padding:12px 13px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(50,32,26,.6),rgba(12,8,7,.75));
    animation:rkIn .3s ease both}
  @keyframes rkIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .rk-card.is-shut{opacity:.13;text-align:center;padding:8px;animation:none;background:none}
  .rk-lock{letter-spacing:5px;color:var(--rk-dim)}
  .rk-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .rk-tag{font-size:8px;letter-spacing:2px;color:var(--rk-red);border:1px solid var(--rk-line);
    background:rgba(226,80,60,.1);padding:2px 9px;border-radius:3px}
  .rk-tag-red{color:#fff0e9;background:var(--rk-red);border-color:var(--rk-red)}
  .rk-tag-gold{color:#241a08;background:#ffd970;border-color:#ffd970}
  .rk-sub{font-size:8px;letter-spacing:1.4px;color:var(--rk-dim)}
  .rk-body{font-size:13.5px;line-height:1.65;margin:0}
  .rk-body b{color:#fff0e9}
  .rk-quiet{color:#c7b2a8;font-size:12.5px;margin-top:7px}
  .rk-rules{display:block;font-size:12px;color:#c7b2a8;margin-top:5px}
  .rk-why{font-size:12px;color:#d8c3b8;font-style:italic;margin:5px 0 0}

  .rk-door-card{display:flex;align-items:center;gap:11px}
  .rk-door-card .bb-av{border-radius:4px;border:1px solid rgba(210,150,120,.3)}

  .rk-key{border-color:var(--rk-red);background:linear-gradient(180deg,rgba(120,32,22,.45),rgba(12,8,7,.8))}
  .rk-keyb,.rk-truthb{display:flex;gap:13px;align-items:flex-start}
  .rk-keyb figure,.rk-truthb figure{margin:0;text-align:center;flex:none}
  .rk-keyb .bb-av{border-radius:5px;border:2px solid var(--rk-red)}
  .rk-truthb .bb-av{border-radius:5px;border:2px solid #ffd970}
  .rk-keyb figcaption,.rk-truthb figcaption{font-size:10px;letter-spacing:1px;color:#e8d5cc;margin-top:4px}
  .rk-truth{border-color:rgba(255,217,112,.5);
    background:linear-gradient(180deg,rgba(72,58,16,.45),rgba(12,8,7,.82))}

  .rk-guesses{display:flex;flex-direction:column;gap:5px;margin:8px 0}
  .rk-guess{display:grid;grid-template-columns:1fr auto 1fr auto;gap:9px;align-items:center;
    padding:5px 9px;border-radius:5px;background:rgba(226,80,60,.06)}
  .rk-guess span{display:flex;align-items:center;gap:6px;min-width:0}
  .rk-guess .bb-av{border-radius:3px}
  .rk-guess b{font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .rk-guess em{font-style:normal;font-size:8px;letter-spacing:1.6px;color:var(--rk-dim)}
  .rk-guess i{font-style:normal;font-size:9px;letter-spacing:1px}
  .rk-guess.is-wrong{background:rgba(226,80,60,.14)}
  .rk-guess.is-wrong i{color:var(--rk-red)}
  .rk-guess.is-right i{color:#8fe0a8}

  .rk-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:9px;justify-content:center;align-items:center;
    padding:11px;background:linear-gradient(180deg,rgba(13,9,8,0),rgba(13,9,8,.97) 45%)}
  .rk-count,.rk-done{font-size:9px;letter-spacing:2px;color:var(--rk-dim)}
  .rk-done{color:var(--rk-red)}

  @media(max-width:700px){.rk-name{font-size:27px}.rk-door{width:44px}
    .rk-guess{grid-template-columns:1fr;gap:4px}}
  @media(prefers-reduced-motion:reduce){
    .sigrk *,.sigrk *::before,.sigrk *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="rk-head">
    <div class="rk-week">WEEK ${E(ep.num)} &middot; NOMINATIONS</div>
    <div class="rk-name">BB Roadkill</div>
    <div class="rk-tagline">PLAYED ALONE &middot; RESULT SEALED &middot; THIRD KEY</div>
  </div>

  ${wall}

  <div class="rk-body-wrap">
    ${cards}
  </div>

  <div class="rk-ctrl">
    ${done ? '<span class="rk-done">THE HOUSE NEVER FINDS OUT.</span>' : `
      <button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.rk-card:not(.is-shut)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  idx < 0 ? 'Open the door' : keyTurned && !told ? 'Who was it' : 'Next in'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="rk-count">${revealed} / ${total}</span>
  </div>
</div>`;
}
