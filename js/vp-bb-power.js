// ══════════════════════════════════════════════════════════════════════
// vp-bb-power.js — a power gets played
// ══════════════════════════════════════════════════════════════════════
//
// The Diamond has its detonation screen, the Bonus Life has its own, and the
// other two — the Coup d'État and the Cloud — emitted a `power-played` act
// that NOTHING read. No screen, no transcript line. A Coup could lift both
// nominees off the block and seat two new ones, and the only evidence on the
// player was a veto ceremony showing names nobody recognised.
//
// So this is the shared screen for a power being spent. One builder rather
// than one per power, because what a viewer needs is always the same four
// things: whose it was, what the rule says, what it just did to the week, and
// what it cannot do — that last one being where every one of these powers is
// misremembered.
import { BB_POWER_DEFINITIONS } from './bb/powers.js';

/**
 * @param {object} ep   the week record
 * @param {object} act  the `power-played` act
 * @param {object} u    { avatar, esc }
 */
export function rpBuildBBPowerPlayed(ep, act, u = {}) {
  if (!act || !act.powerId || !act.holder) return '';
  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const def = BB_POWER_DEFINITIONS[act.powerId] || {};
  const name = act.name || def.name || act.powerId;
  const removed = (act.removed || []).filter(Boolean);
  const seated = (act.nominees || []).filter(Boolean);

  // Three different things, and the house lived through a different week in
  // each: a power nobody knew existed, one everybody knew existed without
  // knowing whose it was, or one that was announced with a name on it.
  const stamp = act.secret ? 'NOBODY KNEW THIS EXISTED'
    : act.visibility === 'holder-secret' ? 'THE HOUSE KNEW IT EXISTED — NOT WHOSE'
      : 'PLAYED IN FRONT OF EVERYBODY';
  const when = act.timing === 'nominations' ? 'BEFORE THE KEYS TURNED'
    : act.timing === 'veto-ceremony' ? 'AT THE VETO CEREMONY'
      : 'ON EVICTION NIGHT';

  return `<div class="rp-page bb-room bb-block sigpw">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600&display=swap');
  .sigpw{--pw-gold:#ffc758;--pw-ink:#f4ece0;--pw-dim:#9a8f80;--pw-line:rgba(255,199,88,.26);
    max-width:1100px;margin:0 auto;color:var(--pw-ink);font-family:Inter,system-ui,sans-serif;
    background:radial-gradient(ellipse 55% 35% at 50% 0%,rgba(255,199,88,.13),transparent 70%),
      linear-gradient(180deg,#171208,#0a0805 86%);position:relative;overflow:clip}
  .pw-head{text-align:center;padding:20px 16px 8px}
  .pw-kick{font-size:9px;letter-spacing:3.4px;color:var(--pw-dim)}
  .pw-name{font-family:'Cormorant Garamond',Georgia,serif;font-size:46px;line-height:1.05;
    color:#fff6e4;text-shadow:0 0 30px rgba(255,199,88,.4);margin:4px 0 2px}
  .pw-stamp{display:inline-block;margin-top:6px;border:1px solid var(--pw-line);border-radius:3px;
    padding:3px 12px;font-size:9px;letter-spacing:2.4px;color:var(--pw-gold);
    background:rgba(255,199,88,.08)}
  .pw-wrap{max-width:760px;margin:0 auto;padding:8px 16px 18px}
  .pw-card{border:1px solid var(--pw-line);border-radius:9px;padding:14px 15px;margin-bottom:10px;
    background:linear-gradient(180deg,rgba(48,36,12,.42),rgba(8,7,5,.8));
    animation:pwIn .32s ease both}
  @keyframes pwIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .pw-who{display:flex;align-items:center;gap:12px;margin-bottom:9px}
  .pw-who .bb-av{border-radius:6px;border:2px solid var(--pw-gold);flex:none}
  .pw-who b{font-size:16px;color:#fff6e4;display:block}
  .pw-who span{font-size:10px;letter-spacing:1.6px;color:var(--pw-dim)}
  .pw-body{font-size:14px;line-height:1.7;margin:0 0 8px;color:#efe3d2}
  .pw-rule{font-size:12.5px;line-height:1.6;color:#c9bdac;margin:0}
  .pw-catch{margin:9px 0 0;padding:9px 11px;border-left:3px solid #ff9d6b;border-radius:0 5px 5px 0;
    background:rgba(255,157,107,.08);font-size:12.5px;line-height:1.55;color:#f0d6c4}
  .pw-catch b{display:block;font-size:8px;letter-spacing:2px;color:#ff9d6b;margin-bottom:3px}
  .pw-move{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin:10px 0 2px}
  .pw-slot{border:1px dashed var(--pw-line);border-radius:7px;padding:10px 8px;text-align:center}
  .pw-slot.is-out{border-color:rgba(120,200,150,.4)}
  .pw-slot.is-in{border-style:solid;border-color:#e2503c;box-shadow:0 0 18px rgba(226,80,60,.18)}
  .pw-slot figure{margin:0 0 4px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
  .pw-slot .bb-av{border-radius:4px}
  .pw-slot figcaption{font-size:9px;letter-spacing:1.6px;color:var(--pw-dim)}
  .pw-slot b{display:block;font-size:12px;color:#f4ece0;margin-top:3px}
  .pw-arrow{font-size:18px;color:var(--pw-gold)}
  @media(max-width:700px){.pw-name{font-size:32px}
    .pw-move{grid-template-columns:1fr}.pw-arrow{transform:rotate(90deg)}}
  @media(prefers-reduced-motion:reduce){.sigpw *{animation:none!important;transition:none!important}}
  </style>

  <div class="pw-head">
    <div class="pw-kick">WEEK ${E(ep.num)} &middot; ${when}</div>
    <div class="pw-name">${E(name)}</div>
    <div class="pw-stamp">${stamp}</div>
  </div>

  <div class="pw-wrap">
    <article class="pw-card">
      <div class="pw-who">
        ${AV(act.holder, 54)}
        <div><b>${E(act.holder)}</b><span>HAS BEEN HOLDING THIS</span></div>
      </div>
      ${act.detail ? `<p class="pw-body">${E(act.detail)}</p>` : ''}
      ${/* The act's detail is what happened THIS week; the blurb is the
            general rule. Printing both says the same thing twice. */
  !act.detail && def.blurb ? `<p class="pw-rule">${E(def.blurb)}</p>` : ''}
      ${def.catch ? `<p class="pw-catch"><b>THE CATCH</b>${E(def.catch)}</p>` : ''}
    </article>

    ${(removed.length || seated.length) ? `<article class="pw-card">
      <div class="pw-move">
        <div class="pw-slot is-out">
          <figure>${removed.map(n => AV(n, 40)).join('')}</figure>
          <figcaption>OFF THE BLOCK</figcaption>
          <b>${removed.map(n => E(n)).join(' &amp; ') || '—'}</b>
        </div>
        <div class="pw-arrow">&#9654;&#9654;</div>
        <div class="pw-slot is-in">
          <figure>${seated.map(n => AV(n, 40)).join('')}</figure>
          <figcaption>NAMED INSTEAD</figcaption>
          <b>${seated.map(n => E(n)).join(' &amp; ') || '—'}</b>
        </div>
      </div>
      <p class="pw-body" style="margin-top:10px">Every plan made this week was made about a block
        that stopped existing thirty seconds ago.</p>
    </article>` : ''}
  </div>
</div>`;
}
