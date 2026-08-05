// ══════════════════════════════════════════════════════════════════════
// vp-bb-split.js — "The Wall"
// ══════════════════════════════════════════════════════════════════════
//
// The night the house stops being one house. One competition crowns two Heads
// of Household, they pick sides in front of everybody, and a wall comes down
// the middle of the screen that does not come back up until eviction night.
//
// The screen is built as that division: a single crowning at the top, then the
// schoolyard pick played out one name at a time, and finally the two sides
// sealed apart. The pick is the drama — you are watching people choose who
// they will be locked in with, and, silently, who they are abandoning.

/**
 * @param {object} ep   week record carrying a `split-house` act
 * @param {object} u    { tvState, reveal, avatar, esc }
 * @returns {string} html, or '' when the house never split
 */
export function rpBuildBBSplitHouse(ep, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === 'split-house');
  if (!act || !(act.hohs || []).length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';

  const stateKey = `bb_split_${ep.num}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const [a, b] = act.hohs;
  const picks = act.picks || [];
  // One step for the crowning, one per pick, one for the wall coming down.
  const total = picks.length + 2;
  const idx = state.idx;
  const revealed = Math.min(total, Math.max(0, idx + 1));
  const done = idx >= total - 1;

  // A side, as far as the reveal has got.
  const sideSoFar = owner => [owner, ...picks.slice(0, Math.max(0, idx - 1))
    .filter(p => p.by === owner).map(p => p.picked)];

  const column = owner => {
    const names = idx >= total - 1 ? (act.sides?.[owner] || []) : sideSoFar(owner);
    return `<div class="spl-side">
      <div class="spl-side-h">
        <figure class="spl-hoh">${AV(owner, 50)}<figcaption>${E(owner)}</figcaption></figure>
        <span class="spl-count">${names.length}</span>
      </div>
      <div class="spl-names">
        ${names.map(n => `<figure class="spl-name ${n === owner ? 'is-hoh' : ''}">
          ${AV(n, 34)}<figcaption>${E(String(n).split(' ')[0])}</figcaption></figure>`).join('')}
      </div>
    </div>`;
  };

  const cards = [];

  cards.push(idx >= 0
    ? `<article class="spl-card">
        <header class="spl-hd"><span class="spl-tag">ONE COMPETITION, TWO ROOMS</span></header>
        <p class="spl-body">${E(act.crowning?.name || 'The competition')} is played by the whole house,
          and it crowns two: <b>${E(a)}</b> and <b>${E(b)}</b>. Neither of them knows yet that the
          prize is not a room. It is a side.</p>
      </article>`
    : '<article class="spl-card is-locked"><span class="spl-lock">— —</span></article>');

  picks.forEach((pick, i) => {
    const shown = idx >= i + 1;
    cards.push(shown
      ? `<article class="spl-card spl-pick">
          <div class="spl-pick-b">
            <figure>${AV(pick.by, 38)}<figcaption>${E(pick.by)}</figcaption></figure>
            <span class="spl-takes">takes</span>
            <figure>${AV(pick.picked, 38)}<figcaption>${E(pick.picked)}</figcaption></figure>
          </div>
          ${pick.why ? `<p class="spl-why">${E(pick.why)}.</p>` : ''}
        </article>`
      : '<article class="spl-card is-locked"><span class="spl-lock">— —</span></article>');
  });

  cards.push(idx >= total - 1
    ? `<article class="spl-card spl-final">
        <header class="spl-hd"><span class="spl-tag spl-tag-red">THE WALL</span></header>
        <p class="spl-body">That is the house divided. From this moment the two sides cannot see
          or speak to each other: separate nominations, separate veto, separate vote. On eviction
          night one houseguest leaves from each side — and neither gets to say goodbye to anybody
          on the other.</p>
      </article>`
    : '<article class="spl-card is-locked"><span class="spl-lock">— —</span></article>');

  return `<div class="rp-page bb-room bb-power spl">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
  .spl{--sp-ink:#e9edf5;--sp-dim:#8d97ac;--sp-line:rgba(140,160,200,.26);--sp-a:#5aa9e6;--sp-b:#e6725a;
    max-width:1100px;margin:0 auto;font-family:Inter,system-ui,sans-serif;color:var(--sp-ink);
    background:radial-gradient(120% 85% at 50% -10%,#1b2436 0%,#111726 55%,#070a12 100%);
    border-radius:12px;padding:18px 16px 0;position:relative;overflow:clip}
  .spl-eyebrow{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:4px;color:var(--sp-dim);text-align:center}
  .spl-title{font-family:Oswald,sans-serif;font-weight:700;font-size:33px;letter-spacing:5px;text-align:center;
    color:#f2f6ff;text-shadow:0 0 24px rgba(120,170,230,.5);margin:3px 0 2px}
  .spl-tagline{text-align:center;font-size:12px;letter-spacing:2px;color:var(--sp-dim);margin-bottom:14px}

  /* Two columns with a wall between them that closes as the pick finishes. */
  .spl-floor{display:grid;grid-template-columns:1fr 3px 1fr;gap:12px;margin-bottom:14px;align-items:start}
  .spl-wall{align-self:stretch;background:repeating-linear-gradient(180deg,rgba(200,215,240,.5) 0 8px,transparent 8px 16px);
    border-radius:2px}
  .spl-side{border:1px solid var(--sp-line);border-radius:12px;padding:11px;
    background:linear-gradient(180deg,rgba(28,38,58,.66),rgba(10,14,24,.72))}
  .spl-side:first-of-type{border-color:rgba(90,169,230,.4)}
  .spl-side:last-of-type{border-color:rgba(230,114,90,.4)}
  .spl-side-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
  .spl-hoh{margin:0;display:flex;align-items:center;gap:9px}
  .spl-hoh .bb-av{border-radius:50%;border:2px solid rgba(255,255,255,.35)}
  .spl-hoh figcaption{font-family:Oswald,sans-serif;font-size:14px;letter-spacing:1.4px}
  .spl-count{font-family:Oswald,sans-serif;font-size:20px;color:var(--sp-dim)}
  .spl-names{display:flex;flex-wrap:wrap;gap:8px}
  .spl-name{margin:0;text-align:center;width:44px;animation:spl-in .3s ease both}
  .spl-name .bb-av{border-radius:7px;border:1px solid rgba(255,255,255,.16)}
  .spl-name figcaption{font-size:9px;letter-spacing:.5px;color:#c9d3e6;margin-top:3px}
  .spl-name.is-hoh .bb-av{border-color:#ffd970}

  .spl-card{border:1px solid var(--sp-line);border-radius:10px;padding:12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(26,35,54,.7),rgba(9,13,22,.8));animation:spl-in .3s ease both}
  @keyframes spl-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .spl-card.is-locked{opacity:.12;text-align:center;padding:8px;animation:none;background:none}
  .spl-lock{font-family:Oswald,sans-serif;letter-spacing:5px;color:var(--sp-dim)}
  .spl-hd{margin-bottom:7px}
  .spl-tag{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:2.2px;color:var(--sp-a);
    border:1px solid rgba(90,169,230,.45);background:rgba(90,169,230,.12);padding:2px 9px;border-radius:3px}
  .spl-tag-red{color:var(--sp-b);border-color:rgba(230,114,90,.5);background:rgba(230,114,90,.12)}
  .spl-body{font-size:14px;line-height:1.65;margin:0}
  .spl-pick-b{display:flex;align-items:center;gap:12px;justify-content:center}
  .spl-pick-b figure{margin:0;text-align:center}
  .spl-pick-b .bb-av{border-radius:8px;border:1px solid rgba(255,255,255,.18)}
  .spl-pick-b figcaption{font-family:Oswald,sans-serif;font-size:11px;letter-spacing:1px;margin-top:4px}
  .spl-takes{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:2.4px;color:var(--sp-dim)}
  .spl-final{border-color:rgba(230,114,90,.45)}

  .spl-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -16px 0;background:linear-gradient(180deg,rgba(7,10,18,0),rgba(7,10,18,.96) 40%)}
  .spl-count-n,.spl-done{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:2.2px;color:var(--sp-dim)}

  @media(max-width:700px){.spl-floor{grid-template-columns:1fr}.spl-wall{display:none}.spl-title{font-size:24px}}
  @media(prefers-reduced-motion:reduce){.spl *{animation:none!important;transition:none!important}}
  </style>

  <div class="spl-eyebrow">WEEK ${E(ep.num)}</div>
  <div class="spl-title">THE HOUSE SPLITS</div>
  <div class="spl-tagline">two sides &middot; no contact &middot; two evictions</div>

  <div class="spl-floor">
    ${column(a)}
    <div class="spl-wall" aria-hidden="true"></div>
    ${column(b)}
  </div>

  ${cards.join('')}

  <div class="spl-ctrl">
    ${done ? '<span class="spl-done">THE WALL IS UP.</span>' : `
      <button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}">${
        idx < 0 ? 'Crown them' : idx < total - 2 ? 'Next pick' : 'Close the wall'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="spl-count-n">${revealed} / ${total}</span>
  </div>
</div>`;
}
