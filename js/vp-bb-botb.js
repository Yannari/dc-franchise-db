// ══════════════════════════════════════════════════════════════════════
// vp-bb-botb.js — "Two Thrones"
// ══════════════════════════════════════════════════════════════════════
//
// The Battle of the Block screen. The competition is between PAIRS rather than
// people, and the prize is not safety alone — it is somebody else's power — so
// the screen is built as two blocks facing each other across the room, each
// under the Head of Household who filled it, with the two crowns above.
//
// It reveals in three beats: the two blocks as they stand, the competition
// itself, and the dethroning. The last card is the one the format exists for —
// a key coming off a houseguest who won it four days earlier.
//
// Interactivity is the shared reveal handler only, gated on _tvState.

const CROWN = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
  stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">
  <path d="M3 17l1.6-9 4.6 4L12 5l2.8 7 4.6-4L21 17z"/><path d="M3.6 20h16.8"/></svg>`;

/**
 * @param {object} ep    week record
 * @param {object} u     { tvState, reveal, avatar, esc }
 * @returns {string} html, or '' when the week had no battle
 */
export function rpBuildBBBattleOfTheBlock(ep, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === 'battle-of-the-block');
  if (!act || !act.hohs || act.hohs.length !== 2) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';

  const stateKey = `bb_botb_${ep.num}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const [a, b] = act.hohs;
  const comp = act.competition || {};
  const beats = (comp.beats || []).filter(x => x && x.text);

  // Three steps: the blocks, the competition, the dethroning.
  const total = 3;
  const idx = state.idx;
  const done = idx >= total - 1;
  const revealed = Math.min(total, Math.max(0, idx + 1));

  const blockCard = (owner, dim) => {
    const pair = act.pairs?.[owner] || [];
    const saved = idx >= 2 && owner === act.dethroned;
    const stuck = idx >= 2 && owner === act.reigning;
    return `<div class="botb-side ${saved ? 'is-saved' : ''} ${stuck ? 'is-stuck' : ''}">
      <div class="botb-crown ${idx >= 2 && owner === act.dethroned ? 'is-gone' : ''}">
        ${CROWN}<span>${idx >= 2 && owner === act.dethroned ? 'DETHRONED' : 'HEAD OF HOUSEHOLD'}</span>
      </div>
      <figure class="botb-hoh">${AV(owner, 56)}<figcaption>${E(owner)}</figcaption></figure>
      <div class="botb-arrow" aria-hidden="true">nominated</div>
      <div class="botb-pair">
        ${pair.map(n => `<figure class="botb-nom">${AV(n, 46)}<figcaption>${E(n)}</figcaption></figure>`).join('')}
      </div>
      ${idx >= 2 ? `<div class="botb-verdict">${saved ? 'OFF THE BLOCK' : 'STILL NOMINATED'}</div>` : ''}
    </div>`;
  };

  const cards = [];

  cards.push(`<article class="botb-card ${idx >= 0 ? '' : 'is-locked'}">
    ${idx >= 0 ? `<header class="botb-hd"><span class="botb-tag">TWO BLOCKS</span></header>
      <p class="botb-body">Two houseguests won that competition, and both of them had to nominate.
        Four names are on the wall, and by the end of the night one of these two keys is coming off.</p>`
      : '<span class="botb-lock">— —</span>'}
  </article>`);

  cards.push(`<article class="botb-card ${idx >= 1 ? '' : 'is-locked'}">
    ${idx >= 1 ? `<header class="botb-hd"><span class="botb-tag">${E(comp.name || 'THE BATTLE')}</span>
        <span class="botb-sub">${(act.saved || []).length + (act.stuck || []).length} playing, in pairs</span></header>
      ${comp.desc ? `<p class="botb-rules">${E(comp.desc)}</p>` : ''}
      <div class="botb-beats">${beats.map(x => `<p><span>${E(x.badgeText || '')}</span>${E(x.text)}</p>`).join('')}</div>
      ${comp.pairScores ? `<div class="botb-tally">${(act.hohs || []).map(owner => {
        // The winning pair is the DETHRONED Head of Household's — winning the
        // Battle is how you take the crown off the person who nominated you.
        const won = owner === act.dethroned;
        return `<div class="botb-tally-row ${won ? 'is-won' : ''}">
          <span class="botb-tally-pair">${E((act.pairs?.[owner] || []).join(' &amp; '))}</span>
          <span class="botb-tally-n">${E(comp.pairScores[owner])}</span></div>`;
      }).join('')}<div class="botb-tally-cap">One track each. Neither half of a pair scored a point of their own.</div></div>` : ''}`
      : '<span class="botb-lock">— —</span>'}
  </article>`);

  cards.push(`<article class="botb-card botb-final ${idx >= 2 ? '' : 'is-locked'}">
    ${idx >= 2 ? `<header class="botb-hd"><span class="botb-tag botb-tag-gold">THE DETHRONING</span></header>
      <div class="botb-final-b">
        <figure>${AV(act.dethroned, 64)}<figcaption>${E(act.dethroned)}</figcaption></figure>
        <div>
          <p class="botb-body"><b>${E((act.saved || []).join(' and '))}</b> win the Battle of the Block and
            come off the block — and they take <b>${E(act.dethroned)}</b>'s power with them.</p>
          <p class="botb-body">${E(act.dethroned)} is an ordinary houseguest again: no key, no safety, and a
            vote on Thursday. <b>${E(act.reigning)}</b> keeps the room, and
            <b>${E((act.stuck || []).join(' and '))}</b> are still sitting on the block.</p>
        </div>
      </div>`
      : '<span class="botb-lock">— —</span>'}
  </article>`);

  return `<div class="rp-page bb-room bb-power botb">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;500;600&display=swap');
  .botb{--bo-ink:#f0e9dd;--bo-dim:#a2947f;--bo-line:rgba(214,178,102,.28);--bo-gold:#d6b266;
    max-width:1100px;margin:0 auto;font-family:Inter,system-ui,sans-serif;color:var(--bo-ink);
    background:radial-gradient(120% 85% at 50% -10%,#2a2114 0%,#171106 55%,#0a0703 100%);
    border-radius:12px;padding:18px 16px 0;position:relative;overflow:clip}
  .botb-eyebrow{font-family:Cinzel,serif;font-size:10px;letter-spacing:4px;color:var(--bo-dim);text-align:center}
  .botb-title{font-family:Cinzel,serif;font-weight:700;font-size:32px;letter-spacing:3px;text-align:center;
    color:#fff5e0;text-shadow:0 0 26px rgba(214,178,102,.55);margin:3px 0 2px}
  .botb-tagline{text-align:center;font-size:12px;letter-spacing:2px;color:var(--bo-dim);margin-bottom:14px}

  .botb-floor{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:start;margin-bottom:14px}
  .botb-side{border:1px solid var(--bo-line);border-radius:12px;padding:12px;text-align:center;
    background:linear-gradient(180deg,rgba(44,34,16,.6),rgba(14,10,4,.7));transition:opacity .4s ease}
  .botb-side.is-saved{border-color:rgba(120,220,150,.5);background:linear-gradient(180deg,rgba(20,50,28,.6),rgba(10,16,8,.75))}
  .botb-side.is-stuck{border-color:rgba(229,72,77,.45)}
  .botb-crown{display:inline-flex;align-items:center;gap:6px;font-family:Cinzel,serif;font-size:9px;
    letter-spacing:2px;color:var(--bo-gold);margin-bottom:7px}
  .botb-crown.is-gone{color:#8b7f6b;text-decoration:line-through}
  .botb-hoh{margin:0}
  .botb-hoh .bb-av{border-radius:50%;border:2px solid var(--bo-gold)}
  .botb-crown.is-gone + .botb-hoh .bb-av{border-color:#6b6152;filter:grayscale(.6)}
  .botb-hoh figcaption,.botb-nom figcaption{font-family:Cinzel,serif;font-size:12px;letter-spacing:1px;margin-top:5px}
  .botb-arrow{font-size:9px;letter-spacing:2.4px;color:var(--bo-dim);margin:8px 0 6px;text-transform:uppercase}
  .botb-pair{display:flex;gap:10px;justify-content:center}
  .botb-nom{margin:0}
  .botb-nom .bb-av{border-radius:8px;border:2px solid rgba(255,255,255,.16)}
  .botb-verdict{margin-top:9px;font-family:Cinzel,serif;font-size:10px;letter-spacing:2px;
    padding:4px 8px;border-radius:4px;display:inline-block}
  .botb-side.is-saved .botb-verdict{background:rgba(120,220,150,.16);color:#9ef0bd}
  .botb-side.is-stuck .botb-verdict{background:rgba(229,72,77,.16);color:#ff9d9d}
  .botb-vs{align-self:center;font-family:Cinzel,serif;font-size:15px;letter-spacing:2px;color:var(--bo-gold)}

  .botb-card{border:1px solid var(--bo-line);border-radius:10px;padding:13px;margin-bottom:10px;
    background:linear-gradient(180deg,rgba(40,31,15,.7),rgba(12,9,4,.8));animation:botb-in .32s ease both}
  @keyframes botb-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .botb-card.is-locked{opacity:.13;text-align:center;padding:9px;animation:none;background:none}
  .botb-lock{font-family:Cinzel,serif;letter-spacing:6px;color:var(--bo-dim)}
  .botb-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
  .botb-tag{font-family:Cinzel,serif;font-size:10.5px;letter-spacing:2.2px;color:var(--bo-gold);
    border:1px solid rgba(214,178,102,.45);background:rgba(214,178,102,.12);padding:2px 9px;border-radius:3px}
  .botb-tag-gold{color:#ffe7a8;border-color:rgba(255,231,168,.6);background:rgba(255,231,168,.16)}
  .botb-sub{font-size:9px;letter-spacing:2px;color:var(--bo-dim)}
  .botb-body{font-size:14px;line-height:1.65;margin:0 0 8px}
  .botb-rules{font-size:12.5px;line-height:1.6;color:var(--bo-dim);margin:0 0 9px;
    padding-left:10px;border-left:2px solid var(--bo-line)}
  .botb-tally{margin-top:10px;border-top:1px solid var(--bo-line);padding-top:9px}
  .botb-tally-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:5px 8px;border-radius:6px}
  .botb-tally-row.is-won{background:rgba(214,178,102,.13);border:1px solid rgba(214,178,102,.34)}
  .botb-tally-pair{font-size:12.5px}
  .botb-tally-n{font-family:Cinzel,serif;font-size:17px;color:#d6b266}
  .botb-tally-cap{font-size:10.5px;color:var(--bo-dim);margin-top:6px;text-align:center}
  .botb-beats p{margin:0 0 7px;font-size:13.5px;line-height:1.6}
  .botb-beats span{display:block;font-family:Cinzel,serif;font-size:8.5px;letter-spacing:2px;color:var(--bo-dim);margin-bottom:2px}
  .botb-final{border-color:rgba(255,231,168,.45)}
  .botb-final-b{display:flex;gap:14px;align-items:flex-start}
  .botb-final-b .bb-av{border-radius:10px;border:2px solid #8b7f6b;filter:grayscale(.5)}
  .botb-final-b figcaption{font-family:Cinzel,serif;font-size:11px;letter-spacing:1px;margin-top:5px;text-align:center}

  .botb-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -16px 0;background:linear-gradient(180deg,rgba(10,7,3,0),rgba(10,7,3,.96) 40%)}
  .botb-count,.botb-done{font-family:Cinzel,serif;font-size:10px;letter-spacing:2.2px;color:var(--bo-dim)}

  @media(max-width:700px){.botb-floor{grid-template-columns:1fr}.botb-title{font-size:23px}}
  @media(prefers-reduced-motion:reduce){.botb *,.botb *::before{animation:none!important;transition:none!important}}
  </style>

  <div class="botb-eyebrow">WEEK ${E(ep.num)}</div>
  <div class="botb-title">BATTLE OF THE BLOCK</div>
  <div class="botb-tagline">two thrones &middot; four nominees &middot; one key comes off</div>

  <div class="botb-floor">
    ${blockCard(a)}
    <div class="botb-vs">VS</div>
    ${blockCard(b)}
  </div>

  ${cards.join('')}

  <div class="botb-ctrl">
    ${done ? '<span class="botb-done">ONE THRONE LEFT.</span>' : `
      <button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}">${
        idx < 0 ? 'Show both blocks' : idx === 0 ? 'Play the battle' : 'The dethroning'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="botb-count">${revealed} / ${total}</span>
  </div>
</div>`;
}
