// ══════════════════════════════════════════════════════════════════════
// vp-bb-rivals.js — three people who already knew somebody in there
// ══════════════════════════════════════════════════════════════════════
//
// The visual idea is a case file that somebody in casting put together and
// nobody in the house was allowed to see: two photographs paper-clipped to a
// buff folder with a line drawn between them, and the relationship typed
// underneath on a form. Every screen in the twist is a page from it.
//
// Deliberately nothing like the other two season twists. The Saboteur is a
// television broadcasting static; the Twin Twist is two stat lines under one
// photograph. This is stationery — the flat, bureaucratic proof that somebody
// arranged this on purpose weeks before anybody walked through a door.

const STYLE = `<style>
.bbrv{--rv-ink:#2b2415;--rv-paper:#efe6d2;--rv-red:#b3382f;--rv-clip:#8d939b;
  position:relative;color:#e6edf3}
.bbrv .rv-wrap{max-width:1100px;margin:0 auto;padding:0 12px 24px}
.bbrv .rv-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(70% 45% at 50% 0%,rgba(224,123,57,.15),transparent 62%),
    linear-gradient(180deg,#171208,#0d0a06 60%,#070504)}
.bbrv .rv-head{position:relative;z-index:2;text-align:center;padding:14px 6px 4px}
.bbrv .rv-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:4px;color:#a09274}
.bbrv .rv-title{font-family:var(--font-display);font-size:32px;letter-spacing:3px;color:#fff;margin:7px 0 3px}
.bbrv .rv-sub{font-size:11.5px;color:#9b8f78;max-width:620px;margin:0 auto}

/* ── the folder ── */
.bbrv .rv-file{position:relative;z-index:2;max-width:780px;margin:16px auto 0;padding:20px 22px 18px;
  border-radius:3px 3px 6px 6px;background:linear-gradient(172deg,var(--rv-paper),#e2d6bd);
  color:var(--rv-ink);box-shadow:0 16px 38px rgba(0,0,0,.55);transform:rotate(-.35deg)}
.bbrv .rv-file + .rv-file{margin-top:16px;transform:rotate(.4deg)}
.bbrv .rv-stamp{position:absolute;top:12px;right:16px;font-family:ui-monospace,Consolas,monospace;
  font-size:9px;letter-spacing:2.4px;color:var(--rv-red);border:2px solid var(--rv-red);
  padding:3px 8px;border-radius:2px;transform:rotate(6deg);opacity:.82}
.bbrv .rv-case{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2.6px;color:#8a7a52}
.bbrv .rv-pair{display:grid;grid-template-columns:1fr 74px 1fr;gap:12px;align-items:center;margin:14px 0 4px}
@media(max-width:620px){.bbrv .rv-pair{grid-template-columns:1fr}}
.bbrv .rv-who{text-align:center}
.bbrv .rv-who figure{width:78px;height:78px;margin:0 auto;border-radius:2px;overflow:hidden;
  border:5px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35);transform:rotate(-1.4deg)}
.bbrv .rv-who:last-child figure{transform:rotate(1.6deg)}
.bbrv .rv-who figure .bb-av{width:78px!important;height:78px!important;border-radius:0}
.bbrv .rv-who b{display:block;margin-top:8px;font-family:var(--font-display);font-size:16px;color:var(--rv-ink)}
.bbrv .rv-who span{font-family:ui-monospace,Consolas,monospace;font-size:7.5px;letter-spacing:1.6px;color:#8a7a52}
.bbrv .rv-link{text-align:center;font-family:ui-monospace,Consolas,monospace;font-size:8px;
  letter-spacing:1.6px;color:var(--rv-red)}
.bbrv .rv-link i{display:block;height:1px;background:repeating-linear-gradient(90deg,var(--rv-red) 0 5px,transparent 5px 10px);
  margin:7px 0}
.bbrv .rv-line{margin-top:12px;padding-top:11px;border-top:1px dashed rgba(43,36,21,.3);
  font-size:13.5px;line-height:1.6}
.bbrv .rv-line b{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
  color:#8a7a52;display:block;margin-bottom:4px}

/* ── beats ── */
.bbrv .rv-beats{position:relative;z-index:2;max-width:780px;margin:16px auto 0;display:flex;
  flex-direction:column;gap:8px}
.bbrv .rv-beat{padding:11px 13px;border-radius:8px;font-size:13px;line-height:1.62;color:#e0d8c8;
  background:linear-gradient(180deg,rgba(34,25,14,.92),rgba(16,12,7,.95));
  border:1px solid rgba(224,123,57,.16);border-left:3px solid #e07b39}
.bbrv .rv-beat b{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;
  letter-spacing:1.8px;color:#a09274;margin-bottom:5px}
.bbrv .rv-beat.is-red{border-left-color:var(--rv-red)}
.bbrv .rv-beat.is-green{border-left-color:#3fb950}
.bbrv .rv-beat.is-blue{border-left-color:#58a6ff}
.bbrv .rv-beat.is-gold{border-left-color:#e3b341}

/* ── the handover ── */
.bbrv .rv-vote{position:relative;z-index:2;max-width:780px;margin:16px auto 0;padding:22px 18px;
  border-radius:10px;text-align:center;border:1px solid rgba(227,179,65,.45);
  background:radial-gradient(70% 120% at 50% 0%,rgba(227,179,65,.2),rgba(0,0,0,.5))}
.bbrv .rv-vote h3{margin:0;font-family:var(--font-display);font-size:clamp(24px,5vw,44px);
  letter-spacing:3px;color:#fff;line-height:1}
.bbrv .rv-vote .rv-vsub{margin-top:8px;font-size:12px;color:#b9ae97}
.bbrv .rv-ballots{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}
.bbrv .rv-ballot{min-width:118px;padding:10px 12px;border-radius:4px;background:var(--rv-paper);
  color:var(--rv-ink);box-shadow:0 6px 16px rgba(0,0,0,.4);transform:rotate(-1deg)}
.bbrv .rv-ballot:nth-child(2){transform:rotate(1.2deg)}
.bbrv .rv-ballot:nth-child(3){transform:rotate(-.6deg)}
.bbrv .rv-ballot u{display:block;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
  letter-spacing:1.6px;color:#8a7a52;text-decoration:none}
.bbrv .rv-ballot b{display:block;margin-top:5px;font-family:var(--font-display);font-size:17px}
.bbrv .rv-ledger{position:relative;z-index:2;max-width:780px;margin:14px auto 0;padding:12px 15px;
  border-radius:8px;background:rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.08)}
.bbrv .rv-ledger-h{font-family:ui-monospace,Consolas,monospace;font-size:8.5px;letter-spacing:1.8px;
  color:#a09274;margin-bottom:8px}
.bbrv .rv-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#d6ccb8;
  padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.bbrv .rv-row:last-child{border-bottom:0}
.bbrv .rv-row em{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:9px;color:#a09274}
</style>`;

const shell = inner => `<div class="rp-page bbrv">${STYLE}
  <div class="rv-bg"></div><div class="rv-wrap">${inner}</div></div>`;

const beatCls = c => ({ red: 'is-red', green: 'is-green', blue: 'is-blue', gold: 'is-gold' }[c] || '');

const beats = (list, esc) => `<div class="rv-beats">${(list || []).map(b =>
  `<div class="rv-beat ${beatCls(b.badgeClass)}"><b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>`;

/** One pair, as a page out of the casting file nobody was shown. */
function fileCard(p, esc, avatar) {
  return `<div class="rv-file">
    <div class="rv-stamp">${p.declared ? 'ON FILE' : 'INFERRED'}</div>
    <div class="rv-case">CASE NOTE &middot; ${esc(String(p.label || '').toUpperCase())}</div>
    <div class="rv-pair">
      <div class="rv-who"><figure>${avatar(p.rival, 78)}</figure>
        <b>${esc(p.rival)}</b><span>ARRIVES LATE</span></div>
      <div class="rv-link">HISTORY<i></i>WITH</div>
      <div class="rv-who"><figure>${avatar(p.partner, 78)}</figure>
        <b>${esc(p.partner)}</b><span>ALREADY INSIDE</span></div>
    </div>
    <div class="rv-line"><b>THE RELATIONSHIP</b>${esc(p.grudge)}.</div>
  </div>`;
}

/** The arrival — three people walking into a house that is already a house. */
export function rpBuildBBRivalsOpen(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const n = (act.pairs || []).length;
  return shell(`
    <div class="rv-head">
      <div class="rv-eyebrow">RIVALS &middot; WEEK ${esc(act.week)} &middot; THE HOUSE HAS BEEN TOLD</div>
      <div class="rv-title">THEY ALREADY KNOW SOMEBODY</div>
      <div class="rv-sub">${n} ${n === 1 ? 'person walks' : 'people walk'} through that door tonight, and
        every one of them is here for somebody who is already inside.${
  act.guessed ? ' Some of these were inferred from who gets on worst, rather than declared.' : ''}</div>
    </div>
    ${(act.pairs || []).map(p => fileCard(p, esc, avatar)).join('')}
    ${beats(act.beats, esc)}
  `);
}

/** The handover — the one time power in this house is given rather than won. */
export function rpBuildBBRivalsHoh(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  return shell(`
    <div class="rv-head">
      <div class="rv-eyebrow">RIVALS &middot; WEEK ${esc(act.week)} &middot; NOT WON</div>
      <div class="rv-title">THEY DECIDE IT</div>
      <div class="rv-sub">The competition comes down to two and then stops. ${
  (act.rivals || []).length === 1 ? 'One person' : `${(act.rivals || []).length} people`} who ${
  (act.rivals || []).length === 1 ? 'has' : 'have'} been in this building for an hour, who could not
        play and cannot be nominated, choose which of them gets the house.</div>
    </div>
    <div class="rv-vote">
      <h3>${esc(act.winner)}</h3>
      <div class="rv-vsub">over ${esc(act.loser)} &middot; handed the house by
        ${esc((act.rivals || []).join(', '))}</div>
      <div class="rv-ballots">${(act.ballots || []).map(b => `<div class="rv-ballot">
        <u>${esc(b.rival)} WRITES</u><b>${esc(b.choice)}</b>${
  b.protecting ? `<u style="color:#b3382f;margin-top:4px">NOT ${esc(b.protecting)}</u>` : ''}</div>`).join('')}</div>
    </div>
    ${beats(act.beats, esc)}
  `);
}

/** A week of two people who cannot be in a room together. */
export function rpBuildBBRivalsWeek(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  return shell(`
    <div class="rv-head">
      <div class="rv-eyebrow">RIVALS &middot; WEEK ${esc(act.week)}</div>
      <div class="rv-title">STILL IN THE SAME HOUSE</div>
      <div class="rv-sub">Nobody gets to leave a room in here, which is the entire problem.</div>
    </div>
    ${beats(act.beats, esc)}
    <div class="rv-ledger">
      <div class="rv-ledger-h">WHERE THE GRUDGES STAND</div>
      ${(act.pairs || []).map(p => `<div class="rv-row">
        <span>${esc(p.rival)} &middot; ${esc(p.partner)}</span>
        <em>${esc(p.label)} &middot; ${p.bond > 0 ? '+' : ''}${p.bond}</em></div>`).join('')}
    </div>
  `);
}

/** One of them outlasts the other. */
export function rpBuildBBRivalsOut(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  return shell(`
    <div class="rv-head">
      <div class="rv-eyebrow">RIVALS &middot; WEEK ${esc(act.week)} &middot; ${esc(String(act.label || '').toUpperCase())}</div>
      <div class="rv-title">ONE OF THEM OUTLASTED THE OTHER</div>
      <div class="rv-sub">${act.rivalOutlasted
    ? 'The one who walked in late is the one still standing.'
    : 'The one who was already living here is the one still standing.'}</div>
    </div>
    <div class="rv-vote" style="border-color:rgba(179,56,47,.5);
      background:radial-gradient(70% 120% at 50% 0%,rgba(179,56,47,.2),rgba(0,0,0,.5))">
      <h3>${esc(act.stays)} STAYS</h3>
      <div class="rv-vsub">${esc(act.gone)} goes &middot; ${act.remaining}
        ${act.remaining === 1 ? 'pair' : 'pairs'} still intact</div>
    </div>
    ${beats(act.beats, esc)}
  `);
}
