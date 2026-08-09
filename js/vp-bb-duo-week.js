// ══════════════════════════════════════════════════════════════════════
// vp-bb-duo-week.js — You Go, They Go, on screen
// ══════════════════════════════════════════════════════════════════════
//
// Three screens for the three things this week does that no other week does:
//
//   the pairing    four keys are coming and they come in twos
//   the week       what being chained to somebody makes people say
//   the door       two names read out, and only one of them was voted for
//
// ── the visual idea: the chain ──
//
// Deliberately NOT the Duos gold. That twist is a key — a thing you are handed,
// a reward with a catch. This one is a length of chain: two cards physically
// linked, and on eviction night the link is what drags the second one out. Cold
// steel against a red room, and the link between two names is drawn rather
// than described, because "and their partner too" is a spatial idea.
//
// The Twin Twist shipped with its changeover passed to a screen that never drew
// it, so these are written alongside the module rather than after it.
const CSS = `
.bbdw{--steel:#c9d4e2;--link:#8fa6c4;--blood:#e0452e;--ink:#eef2f8;position:relative;
  padding:26px 22px 30px;background:radial-gradient(ellipse at 50% -10%,rgba(143,166,196,.18),transparent 62%),#0f1319;
  color:var(--ink);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;}
.bbdw.is-door{background:radial-gradient(ellipse at 50% -10%,rgba(224,69,46,.2),transparent 62%),#150e0e;}
.bbdw .dw-eyebrow{font-size:11px;letter-spacing:.18em;font-weight:800;opacity:.55;text-align:center;}
.bbdw .dw-title{font-size:31px;font-weight:900;letter-spacing:-.015em;text-align:center;margin:6px 0 4px;}
.bbdw .dw-sub{text-align:center;opacity:.72;max-width:600px;margin:0 auto 20px;line-height:1.55;font-size:14px;}
.bbdw .dw-rules{max-width:660px;margin:0 auto 24px;display:flex;flex-direction:column;gap:8px;}
.bbdw .dw-rule{padding:10px 14px;border-left:3px solid var(--link);background:rgba(143,166,196,.08);
  border-radius:0 8px 8px 0;font-size:13.5px;line-height:1.6;}
.bbdw .dw-rule.is-hard{border-left-color:var(--blood);background:rgba(224,69,46,.1);font-weight:600;}

/* two cards, and the chain between them */
.bbdw .dw-pairs{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;max-width:780px;margin:0 auto;}
.bbdw .dw-pairwrap{flex:0 1 350px;display:flex;flex-direction:column;gap:7px;align-items:center;}
.bbdw .dw-react{font-size:12.5px;line-height:1.55;opacity:.72;text-align:center;max-width:340px;}
.bbdw .dw-pair{display:flex;align-items:center;gap:0;padding:8px 10px;border-radius:12px;
  border:1px solid rgba(201,212,226,.22);background:rgba(201,212,226,.06);}
.bbdw .dw-half{display:flex;align-items:center;gap:7px;padding:5px 9px;font-weight:700;font-size:13.5px;}
.bbdw .dw-chain{width:34px;height:12px;position:relative;flex:0 0 auto;opacity:.85;}
.bbdw .dw-chain::before,.bbdw .dw-chain::after{content:'';position:absolute;top:0;width:16px;height:12px;
  border:2.5px solid var(--link);border-radius:6px;}
.bbdw .dw-chain::before{left:0;}
.bbdw .dw-chain::after{right:0;}
.bbdw .dw-pair.is-nom{border-color:rgba(224,69,46,.55);background:rgba(224,69,46,.1);}
.bbdw .dw-pair.is-nom .dw-chain::before,.bbdw .dw-pair.is-nom .dw-chain::after{border-color:var(--blood);}

.bbdw .dw-solo{margin:18px auto 0;max-width:560px;text-align:center;padding:12px 15px;
  border:1px dashed rgba(201,212,226,.3);border-radius:10px;font-size:13.5px;opacity:.85;}
.bbdw .dw-events{max-width:660px;margin:0 auto;display:flex;flex-direction:column;gap:11px;}
.bbdw .dw-ev{padding:12px 15px;border-radius:11px;background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.09);border-left:3px solid var(--link);font-size:13.5px;line-height:1.62;}
.bbdw .dw-ev .dw-badge{display:inline-block;margin-bottom:6px;font-size:10.5px;letter-spacing:.13em;
  font-weight:800;padding:3px 8px;border-radius:999px;background:rgba(143,166,196,.2);color:var(--steel);}
.bbdw .dw-ev.k-red{border-left-color:var(--blood);}
.bbdw .dw-ev.k-red .dw-badge{background:rgba(224,69,46,.22);color:#ffb3a6;}
.bbdw .dw-ev.k-green{border-left-color:#4fbf87;}
.bbdw .dw-ev.k-green .dw-badge{background:rgba(79,191,135,.2);color:#a9e8c8;}

/* the door */
.bbdw .dw-door{max-width:620px;margin:0 auto;display:flex;align-items:stretch;gap:0;justify-content:center;}
.bbdw .dw-gone{flex:1 1 0;padding:20px 16px;border-radius:14px;text-align:center;
  border:1px solid rgba(224,69,46,.45);background:linear-gradient(160deg,rgba(224,69,46,.16),rgba(224,69,46,.04));}
.bbdw .dw-name{font-size:22px;font-weight:900;margin:8px 0 3px;}
.bbdw .dw-votes{font-size:12px;letter-spacing:.12em;font-weight:800;opacity:.75;}
.bbdw .dw-drag{flex:0 0 46px;position:relative;}
.bbdw .dw-drag::before{content:'';position:absolute;top:50%;left:-4px;right:-4px;height:0;
  border-top:3px dashed var(--blood);transform:translateY(-50%);}
.bbdw .dw-zero{margin:20px auto 0;max-width:560px;text-align:center;font-size:14px;line-height:1.6;
  padding:13px 16px;border-radius:11px;border:1px solid rgba(224,69,46,.4);background:rgba(224,69,46,.09);}
.bbdw .dw-beats{max-width:620px;margin:20px auto 0;display:flex;flex-direction:column;gap:10px;}
.bbdw .dw-beat{padding:11px 14px;border-radius:10px;background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.08);font-size:13.5px;line-height:1.6;}
@media(prefers-reduced-motion:reduce){.bbdw *{animation:none!important;transition:none!important;}}
`;

const shell = (inner, cls = '') => `<style>${CSS}</style><div class="bbdw ${cls}">${inner}</div>`;
const esc0 = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const beats = (act, esc) => (act.beats || []).length
  ? `<div class="dw-beats">${act.beats.map(b => `<div class="dw-beat">${esc(b.text)}</div>`).join('')}</div>`
  : '';

/** Two people, one chain drawn between them, and what they made of it. */
const pairCard = (a, b, esc, avatar, reaction = '', cls = '') => `<div class="dw-pairwrap">
  <div class="dw-pair ${cls}">
    <div class="dw-half">${avatar(a, 26)}<span>${esc(a)}</span></div>
    <div class="dw-chain"></div>
    <div class="dw-half">${avatar(b, 26)}<span>${esc(b)}</span></div>
  </div>
  ${reaction ? `<div class="dw-react">${esc(reaction)}</div>` : ''}
</div>`;

/** The line written about this specific pair, if there is one. */
const reactionFor = (act, a, b) => ((act.beats || []).find(x =>
  (x.players || []).length === 2 && x.players.includes(a) && x.players.includes(b))?.text) || '';

/** The pairing: four keys are coming, and they come in twos. */
export function rpBuildBBDuoWeekOpen(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const rules = act.rules || [];

  return shell(`
    <div class="dw-eyebrow">WEEK ${esc(act.week)} &middot; ONE WEEK ONLY</div>
    <div class="dw-title">YOU GO, THEY GO</div>
    <div class="dw-sub">${act.source === 'season'
      ? 'The pairs this house has been living in since night one are about to decide who leaves.'
      : 'This house was paired this morning. It has until Thursday to work out what that cost.'}</div>

    <div class="dw-rules">
      ${rules.map((r, i) => `<div class="dw-rule${i === 2 ? ' is-hard' : ''}">${esc(r)}</div>`).join('')}
    </div>

    <div class="dw-pairs">
      ${(act.pairs || []).map(([a, b]) =>
    pairCard(a, b, esc, avatar, reactionFor(act, a, b))).join('')}
    </div>

    ${act.solo ? `<div class="dw-solo"><b>${esc(act.solo)}</b> has nobody to be chained to, and there is
      no such thing as a block with three people on it this week. ${esc(act.solo)} cannot be nominated.</div>` : ''}

    ${(() => {
    // Everything the pairs did not already say: the headline, the Head of
    // Household standing outside all of this, and the solo player's week.
    const rest = (act.beats || []).filter(b => !(act.pairs || [])
      .some(([a, c]) => (b.players || []).length === 2 && b.players.includes(a) && b.players.includes(c)));
    return rest.length
      ? `<div class="dw-beats">${rest.map(b => `<div class="dw-beat">${esc(b.text)}</div>`).join('')}</div>`
      : '';
  })()}
  `);
}

/** The week: what being chained to somebody makes people say. */
export function rpBuildBBDuoWeekEvents(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const events = act.events || [];
  const kind = e => e.badgeClass === 'red' ? 'k-red' : e.badgeClass === 'green' ? 'k-green' : '';

  return shell(`
    <div class="dw-eyebrow">WEEK ${esc(act.week)} &middot; STRATEGY FOR TWO</div>
    <div class="dw-title">CHAINED</div>
    <div class="dw-sub">Four people on that block and every one of them is really two. This is the week
      the house spends working out what it is willing to do about that.</div>

    <div class="dw-events">
      ${events.map(e => `<div class="dw-ev ${kind(e)}">
        <div class="dw-badge">${esc(e.badgeText || '')}</div>
        <div>${esc(e.text)}</div>
      </div>`).join('')}
    </div>
  `);
}

/** The door: two names, one vote. */
export function rpBuildBBDuoWeekEviction(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const v = Number(act.votesAgainstTaken) || 0;

  return shell(`
    <div class="dw-eyebrow">WEEK ${esc(act.week)} &middot; EVICTION NIGHT</div>
    <div class="dw-title">AND THEIR PARTNER</div>

    <div class="dw-door">
      <div class="dw-gone">
        ${avatar(act.evicted, 72)}
        <div class="dw-name">${esc(act.evicted)}</div>
        <div class="dw-votes">VOTED OUT</div>
      </div>
      <div class="dw-drag"></div>
      <div class="dw-gone">
        ${avatar(act.taken, 72)}
        <div class="dw-name">${esc(act.taken)}</div>
        <div class="dw-votes">${act.gotNothing ? 'ZERO VOTES' : `${v} VOTE${v === 1 ? '' : 'S'}`}</div>
      </div>
    </div>

    ${act.gotNothing ? `<div class="dw-zero">Nobody wrote <b>${esc(act.taken)}</b>'s name down.
      Not one houseguest in that room voted to evict ${esc(act.taken)}, and ${esc(act.taken)} is
      leaving this game tonight.</div>` : ''}

    ${beats(act, esc)}
  `);
}
