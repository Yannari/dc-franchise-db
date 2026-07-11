// js/auction-vp.js — VP screens for the Survivor Auction ("Hell of a Deal").
// A night auction house: green-felt block under a spotlight, gold trim, covered curtains for blind lots,
// bidder paddles as escalating bid chips, a SOLD stamp, and a live BANK board down the side that drains
// as lots sell. Lot-by-lot click-to-reveal; DOM-only updates on reveal (never rebuilds the page).
import { gs, players } from './core.js';

function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function portrait(name, size = 26) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0" onerror="this.style.visibility='hidden'">`;
}
function getAuc(ep) { return (ep.twists || []).find(t => t.type === 'auction')?.auction || ep._auctionData || null; }

// item-type → display badge
function lotBadge(res) {
  if (res.blind) return { t: 'BLIND LOT', c: 'blind' };
  if (res.emotional) return { t: 'FROM HOME', c: 'home' };
  if (res.role === 'comfort') return { t: 'COMFORT', c: 'comfort' };
  return { t: 'FOOD', c: 'food' };
}
function revealClass(effect) {
  if (effect === 'immunity') return 'gold';
  if (['extraVote', 'voteSteal', 'voteBlock', 'safetyNoPower', 'soleVote', 'idol', 'secondLife', 'advantage'].includes(effect)) return 'power';
  if (effect === 'intel' || effect === 'idolClue') return 'intel';
  return 'food';
}

// ══ CSS ══
function aucCss() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@500;700&family=Cutive+Mono&display=swap');
  .auc-shell{--felt:#0d3b2e;--felt2:#0a2b22;--gold:#e9c46a;--gold2:#c99a3a;--ink:#08150f;--paper:#f4ead2;--cash:#5ec98a;--blood:#d9556b;
    max-width:1100px;margin:0 auto;font-family:'Oswald',sans-serif;color:#f2ecd9;background:#08150f;padding:6px 4px 96px}
  .auc-shell *{box-sizing:border-box}
  /* stage header */
  .auc-stage{position:sticky;top:46px;z-index:14;border:3px solid #072019;border-radius:12px;overflow:hidden;padding:16px 18px;
    background:radial-gradient(ellipse at 50% -30%,#1c6b52 0%,#125141 32%,#0b3227 62%,#07231b 100%);box-shadow:inset 0 -30px 50px rgba(0,0,0,.5)}
  .auc-spot{position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:340px;height:200px;pointer-events:none;
    background:radial-gradient(ellipse at 50% 0%,rgba(233,196,106,.28),transparent 68%)}
  .auc-title{font-family:'Anton';font-size:30px;letter-spacing:1px;color:var(--gold);text-shadow:2px 2px 0 #000;line-height:.95;position:relative}
  .auc-title small{display:block;font-family:'Cutive Mono';font-size:10px;letter-spacing:3px;color:#bfe6d2;margin-top:5px}
  .auc-lotcount{position:absolute;top:14px;right:16px;font-family:'Cutive Mono';font-size:11px;color:var(--gold);background:rgba(0,0,0,.35);border:1px solid var(--gold2);border-radius:20px;padding:3px 10px}
  /* layout */
  .auc-layout{display:grid;grid-template-columns:1fr 320px;gap:12px;align-items:start;margin-top:12px}
  .auc-feed{min-width:0}
  .auc-side{position:sticky;top:150px;background:linear-gradient(180deg,#0e3a2d,#092a20);border:2px solid #1c5c46;border-radius:12px;padding:11px;max-height:calc(100vh - 180px);overflow:auto;z-index:6}
  .auc-shdr{font-family:'Anton';letter-spacing:1px;font-size:15px;color:var(--gold);display:flex;align-items:center;gap:7px;margin:2px 0 9px}
  .auc-bank{display:flex;flex-direction:column;gap:7px}
  .auc-brow{display:flex;align-items:center;gap:8px;min-width:0}
  .auc-brow img{width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid #1c5c46;flex-shrink:0}
  .auc-brow.broke{opacity:.55}
  .auc-bn{flex:1;min-width:0}
  .auc-bn .nm{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:5px;line-height:1.1}
  .auc-badge-imm{font-size:9px;background:#4a3410;color:var(--gold);border-radius:8px;padding:0 5px;font-family:'Cutive Mono'}
  .auc-badge-pow{font-size:9px;background:#2e1c42;color:#c9a9e4;border-radius:8px;padding:0 5px;font-family:'Cutive Mono'}
  .auc-bar{height:8px;border-radius:5px;background:#06231a;border:1px solid #1c5c46;overflow:hidden;margin-top:3px}
  .auc-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--cash),var(--gold));transition:width .5s}
  .auc-cash{font-family:'Cutive Mono';font-size:11px;color:var(--cash)}
  .auc-won{font-size:10px;color:#9fdcc0;margin-top:2px;line-height:1.3}
  /* lot card */
  .auc-lot{border:2px solid #1c5c46;border-left:5px solid var(--gold2);border-radius:10px;padding:12px 14px;margin:11px 0;background:linear-gradient(180deg,#103a2d,#0b2a20)}
  .auc-lot-head{display:flex;align-items:center;gap:9px;margin-bottom:8px}
  .auc-lot-no{font-family:'Anton';font-size:18px;color:var(--gold)}
  .auc-tag{font-family:'Cutive Mono';font-size:9px;padding:2px 8px;border-radius:10px;letter-spacing:1px}
  .auc-tag.blind{background:#2a2450;color:#c9b6ff}.auc-tag.home{background:#0e3540;color:#7fe6d0}.auc-tag.comfort{background:#123a4a;color:#8af0f7}.auc-tag.food{background:#123820;color:#8affb0}
  .auc-item{font-family:'Oswald';font-weight:700;font-size:18px;color:#f7f0dd;margin:2px 0 10px;display:flex;align-items:center;gap:10px}
  .auc-curtain{width:48px;height:48px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Anton';font-size:26px;color:#0a1a13;
    background:repeating-linear-gradient(90deg,#7a1f2b,#7a1f2b 6px,#8f2733 6px,#8f2733 12px);border:2px solid #5a141d;box-shadow:inset 0 0 10px rgba(0,0,0,.5)}
  /* narration play-by-play */
  .auc-narr{margin:2px 0 10px;display:flex;flex-direction:column;gap:5px}
  .auc-narr p{margin:0;font-size:14px;line-height:1.5;color:#e9e2cf;padding-left:15px;position:relative}
  .auc-narr p::before{content:'▸';position:absolute;left:0;top:2px;color:var(--gold2);font-size:11px}
  .auc-tickcap{font-family:'Cutive Mono';font-size:9px;letter-spacing:1px;color:#6f9a86;margin:2px 0 4px}
  /* ticker */
  .auc-ticker{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px}
  .auc-chip{display:inline-flex;align-items:center;gap:5px;background:#0a2b21;border:1px solid #1c5c46;border-radius:20px;padding:2px 9px 2px 3px;font-size:12px;
    opacity:0;transform:translateY(6px);animation:aucChip .32s ease-out forwards}
  @keyframes aucChip{to{opacity:1;transform:translateY(0)}}
  .auc-chip img{width:20px;height:20px;border-radius:50%;object-fit:cover}
  .auc-chip .amt{font-family:'Cutive Mono';color:var(--cash);font-weight:700}
  .auc-chip.open{border-color:var(--gold2)}.auc-chip.open .amt{color:var(--gold)}
  .auc-chip.jump{border-color:#e08a2a;background:#2a1c0e}.auc-chip.jump .amt{color:#ffb15a}
  .auc-chip.lend{border-color:#5ec98a;background:#0c2f22}
  .auc-chip.fail{opacity:.55;border-style:dashed;text-decoration:line-through}
  .auc-arrow{color:#4f7a68;font-size:12px}
  /* sold + reveal */
  .auc-sold{display:inline-flex;align-items:center;gap:8px;font-family:'Anton';font-size:15px;letter-spacing:1px;color:#0a1a13;background:var(--gold);border-radius:6px;padding:4px 12px;transform:rotate(-2deg);box-shadow:0 2px 8px rgba(0,0,0,.4)}
  .auc-sold .amt{font-family:'Cutive Mono'}
  .auc-reveal{margin-top:9px;border-radius:8px;padding:9px 12px;font-family:'Oswald';font-size:15px;display:flex;align-items:center;gap:9px;border:1px dashed}
  .auc-reveal .lead{font-family:'Cutive Mono';font-size:9px;letter-spacing:2px;opacity:.8}
  .auc-reveal.gold{background:linear-gradient(180deg,#2c2408,#1a1404);border-color:var(--gold);color:var(--gold);box-shadow:0 0 18px rgba(233,196,106,.25)}
  .auc-reveal.power{background:linear-gradient(180deg,#20123a,#150c26);border-color:#a877e0;color:#d5b8ff}
  .auc-reveal.intel{background:linear-gradient(180deg,#0e2a33,#0a1f26);border-color:#5fd0c4;color:#9fe8de}
  .auc-reveal.food{background:linear-gradient(180deg,#12301e,#0c2216);border-color:#4ac47a;color:#a9f0c4}
  .auc-switch{margin-top:8px;border-left:3px solid #e08a2a;background:linear-gradient(180deg,#241a0e,#180f06);border-radius:6px;padding:8px 11px;font-size:13px;color:#f0d9b0}
  .auc-switch b{color:#ffb15a}
  .auc-conf{margin-top:8px;border-left:3px dashed #8a8a8a;background:linear-gradient(180deg,#161616,#0f0f0f);border-radius:6px;padding:8px 11px;font-style:italic;font-size:13px;color:#d7d2c4;display:flex;gap:8px;align-items:flex-start}
  /* closed / unsold */
  .auc-closed{text-align:center;border:2px dashed var(--blood);border-radius:12px;padding:18px;margin:12px 0;background:linear-gradient(180deg,#2a1014,#180b0e)}
  .auc-closed .big{font-family:'Anton';font-size:26px;color:var(--blood);letter-spacing:1px}
  .auc-closed .sub{font-family:'Cutive Mono';font-size:11px;color:#e6a9b3;margin-top:6px}
  .auc-unsold{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:12px}
  .auc-unsold .u{font-size:12px;color:#c9a0a6;background:rgba(0,0,0,.3);border:1px solid #4a2a2e;border-radius:8px;padding:5px 10px}
  /* controls */
  .auc-ctrl{position:fixed;bottom:0;left:0;right:0;background:rgba(8,21,15,.96);border-top:2px solid #1c5c46;padding:9px;display:flex;justify-content:center;gap:10px;z-index:40}
  .auc-btn{font-family:'Anton';letter-spacing:1px;font-size:14px;padding:6px 20px;border:2px solid var(--gold);background:#0d3b2e;color:var(--gold);border-radius:8px;cursor:pointer}
  .auc-cnt{font-family:'Cutive Mono';color:#bfe6d2;align-self:center;font-size:12px}
  .auc-done{text-align:center;font-family:'Cutive Mono';color:var(--gold2);font-size:12px;padding:8px}
  /* title cover */
  .auc-cover{text-align:center;padding:22px 18px}
  .auc-cover .big{font-family:'Anton';font-size:48px;letter-spacing:1px;color:var(--gold);text-shadow:3px 3px 0 #000,0 0 30px rgba(233,196,106,.35);line-height:.95}
  .auc-cover .sub{font-family:'Cutive Mono';font-size:11px;letter-spacing:2px;color:#bfe6d2;margin-top:8px}
  .auc-quote{max-width:660px;margin:14px auto;font-size:17px;line-height:1.55;color:#f2ecd9}
  .auc-immbadge{display:inline-block;margin-top:10px;font-family:'Cutive Mono';font-size:11px;letter-spacing:1px;border-radius:20px;padding:5px 14px}
  .auc-immbadge.on{background:#2c2408;color:var(--gold);border:1px solid var(--gold2)}
  .auc-immbadge.off{background:#123a4a;color:#8af0f7;border:1px solid #2f6a7a}
  .auc-paddles{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:18px}
  .auc-paddle{width:92px;background:#103a2d;border:1px solid #1c5c46;border-radius:10px;padding:9px 6px;text-align:center}
  .auc-paddle img{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid var(--gold2)}
  .auc-paddle .nm{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px}
  .auc-paddle .cash{font-family:'Cutive Mono';font-size:12px;color:var(--cash)}
  @media(prefers-reduced-motion:reduce){.auc-chip{animation:none!important;opacity:1!important;transform:none!important}.auc-bar i{transition:none!important}}
  </style>`;
}
function _shell(inner) { return `<div class="auc-shell">${aucCss()}${inner}</div>`; }

// ══ TITLE CARD ══
export function rpBuildAuctionTitle(ep) {
  const a = getAuc(ep); if (!a) return '';
  const paddles = a.roster.map(n =>
    `<div class="auc-paddle">${portrait(n, 46)}<div class="nm">${n}</div><div class="cash">$500</div></div>`).join('');
  const imm = a.immunityMode
    ? `<div class="auc-immbadge on">🛡️ IMMUNITY IS ON THE BLOCK — WIN IT OR GO IN EXPOSED</div>`
    : `<div class="auc-immbadge off">🍗 REWARD AUCTION — IMMUNITY IS STILL DECIDED IN THE CHALLENGE</div>`;
  return _shell(`<div class="auc-cover">
    <div class="sub">${a.host.toUpperCase()} PRESENTS</div>
    <div class="big">HELL OF<br>A DEAL</div>
    <div class="sub">THE AUCTION · $500 EACH · $20 INCREMENTS · LEND MONEY, NEVER SHARE THE GOODS</div>
    <div class="auc-quote">"${a.hostOpener}"</div>
    ${imm}
    <div class="auc-paddles">${paddles}</div>
  </div>`);
}

// ── one lot card ──
function _lotCard(res) {
  if (res.kind === 'closed') {
    const unsold = res.unsold.length ? `<div class="auc-unsold">${res.unsold.map(u => `<div class="u">🚫 never came up: ${u}</div>`).join('')}</div>` : '';
    if (res.immunityMode && !res.immuneWinner) {
      return `<div class="auc-closed"><div class="big">— AUCTION CLOSED —</div>
        <div class="sub">Immunity never sold. NOBODY is safe tonight — everyone walks into tribal wide open.</div>${unsold}</div>`;
    }
    return `<div class="auc-closed" style="border-color:var(--gold2);background:linear-gradient(180deg,#1a1608,#0f0d05)">
      <div class="big" style="color:var(--gold)">— GOING ONCE, GOING TWICE, SOLD —</div>
      <div class="sub" style="color:#e6d4a0">${res.host} bangs the gavel. The auction is closed.</div>${unsold}</div>`;
  }
  const b = lotBadge(res);
  const head = `<div class="auc-lot-head"><span class="auc-lot-no">LOT ${res.order}</span><span class="auc-tag ${b.c}">${b.t}</span></div>`;
  const stage = res.blind
    ? `<div class="auc-item"><span class="auc-curtain">?</span>A covered item — nobody knows what's behind the curtain.</div>`
    : `<div class="auc-item">🍽️ ${res.label}</div>`;
  if (!res.sold) {
    return `<div class="auc-lot">${head}${stage}<div class="auc-reveal food" style="border-color:#4f7a68;color:#9fc0b2">No bids — the lot passes untouched.</div></div>`;
  }
  // ticker
  const chips = res.bidLog.map((bd, i) => {
    const cls = bd.failed ? 'fail' : bd.jump ? 'jump' : bd.lent ? 'lend' : (i === 0 ? 'open' : '');
    const extra = bd.lent ? ` 🤝<span style="font-size:10px;color:#8affb0">${bd.lent.from}</span>` : bd.failed && bd.refusedBy ? ` <span style="font-size:10px;color:#d9556b">${bd.refusedBy} says no</span>` : bd.jump ? ' ⤴' : i === 0 ? ' ·OPEN' : '';
    const arrow = i > 0 ? '<span class="auc-arrow">›</span>' : '';
    return `${arrow}<span class="auc-chip ${cls}" style="animation-delay:${(i * 0.14).toFixed(2)}s">${portrait(bd.bidder, 20)}${bd.bidder}<span class="amt">$${bd.amount}</span>${extra}</span>`;
  }).join('');
  const narr = res.narration?.length ? `<div class="auc-narr">${res.narration.map(t => `<p>${t}</p>`).join('')}</div>` : '';
  const ticker = `<div class="auc-tickcap">THE BIDS</div><div class="auc-ticker">${chips}</div>`;
  const sold = `<div style="margin:6px 0"><span class="auc-sold">SOLD ${portrait(res.winner, 22)} ${res.winner} <span class="amt">$${res.finalBid}</span></span></div>`;
  let reveal = '';
  if (res.blind) {
    reveal = `<div class="auc-reveal ${revealClass(res.effect)}"><span class="lead">BEHIND THE CURTAIN →</span> ${res.revealedLabel}</div>`;
  }
  const conf = res.confessional ? `<div class="auc-conf">${portrait(res.winner, 22)}<div>"${res.confessional}"</div></div>` : '';
  return `<div class="auc-lot">${head}${stage}${narr}${ticker}${sold}${reveal}${conf}</div>`;
}

// ── bank sidebar at a given reveal index ──
function _bank(a, events, revIdx) {
  // budgets = snapshot after the last revealed offered lot
  let budgets = {}; a.roster.forEach(n => budgets[n] = a.budgetsStart);
  const won = {}; a.roster.forEach(n => won[n] = []);
  let immune = null; const power = {};
  for (let i = 0; i <= Math.min(revIdx, events.length - 1); i++) {
    const e = events[i]; if (!e || e.kind === 'closed') continue;
    if (e.budgetsAfter) budgets = e.budgetsAfter;
    if (e.sold) {
      won[e.winner] = won[e.winner] || [];
      won[e.winner].push(e.blind ? (e.revealedLabel || 'a mystery item') : e.label);
      if (e.effect === 'immunity') immune = e.winner;
      if (e.isPower) power[e.winner] = true;
    }
  }
  const rows = a.roster.slice().sort((x, y) => (budgets[y] - budgets[x])).map(n => {
    const $ = budgets[n] ?? 0; const pct = Math.max(0, Math.min(100, ($ / a.budgetsStart) * 100));
    const flags = `${immune === n ? '<span class="auc-badge-imm">IMMUNE</span>' : ''}${power[n] ? '<span class="auc-badge-pow">POWER</span>' : ''}`;
    const wl = won[n]?.length ? `<div class="auc-won">${won[n].map(w => '• ' + w).join('<br>')}</div>` : '';
    return `<div class="auc-brow ${$ <= 0 ? 'broke' : ''}">${portrait(n, 28)}
      <div class="auc-bn"><div class="nm">${n} ${flags}</div>
        <div class="auc-bar"><i style="width:${pct}%"></i></div>${wl}</div>
      <div class="auc-cash">$${$}</div></div>`;
  }).join('');
  return `<div class="auc-shdr">💰 THE BANK</div><div class="auc-bank">${rows}</div>`;
}

// ══ THE FLOOR (main event) ══
function _floorEvents(a) {
  const offered = a.items.filter(it => it.offered);
  const events = offered.map(it => ({ ...it, kind: 'lot' }));
  events.push({ kind: 'closed', unsold: a.unsoldLabels || [], immunityMode: a.immunityMode, immuneWinner: a.immuneWinner, host: a.host });
  return events;
}
export function rpBuildAuctionFloor(ep) {
  const a = getAuc(ep); if (!a) return '';
  const events = _floorEvents(a);
  const key = 'auc-floor';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[key]) window._tvState[key] = { idx: -1 };
  const revIdx = window._tvState[key].idx;
  window.aucData = a; window.aucFloorEvents = events;
  const steps = events.map((e, i) =>
    `<div class="auc-step" id="auc-step-floor-${i}" style="display:${i <= revIdx ? '' : 'none'}">${_lotCard(e)}</div>`).join('');
  const done = revIdx >= events.length - 1;
  const ctrl = `<div class="auc-ctrl" id="auc-ctrl-floor" style="${done ? 'display:none' : ''}">
      <button class="auc-btn" onclick="auctionRevealNext('auc-floor',${events.length})">NEXT LOT ▸</button>
      <span class="auc-cnt" id="auc-cnt-floor">${Math.max(0, revIdx + 1)} / ${events.length}</span>
      <button class="auc-btn" onclick="auctionRevealAll('auc-floor',${events.length})">ALL ⏭</button>
    </div>
    <div class="auc-done" id="auc-done-floor" style="${done ? '' : 'display:none'}">— the gavel falls —</div>`;
  return _shell(`
    <div class="auc-stage"><div class="auc-spot"></div>
      <div class="auc-title">THE AUCTION<small>${a.host.toUpperCase()} · $20 INCREMENTS · ENDS WITHOUT WARNING</small></div>
      <div class="auc-lotcount" id="auc-lotcount">LOT ${Math.max(0, Math.min(revIdx + 1, events.length))} / ${events.length}</div>
    </div>
    <div class="auc-layout">
      <div class="auc-feed">${steps}${ctrl}</div>
      <div class="auc-side" id="auc-side-floor">${_bank(a, events, revIdx)}</div>
    </div>`);
}

// ══ FINAL BOARD ══
export function rpBuildAuctionResults(ep) {
  const a = getAuc(ep); if (!a) return '';
  const events = _floorEvents(a);
  const board = _bank(a, events, events.length - 1);
  let verdict;
  if (a.immunityMode && !a.immuneWinner) {
    verdict = `<div class="auc-closed"><div class="big">NOBODY IS IMMUNE</div><div class="sub">Immunity never sold. Every player is exposed at tonight's vote.</div></div>`;
  } else if (a.immuneWinner) {
    verdict = `<div class="auc-closed" style="border-color:var(--gold);background:linear-gradient(180deg,#2c2408,#0f0d05)"><div class="big" style="color:var(--gold)">🛡️ ${a.immuneWinner.toUpperCase()} IS SAFE</div><div class="sub" style="color:#e6d4a0">Bought individual immunity out of a blind bid.</div></div>`;
  } else {
    verdict = `<div class="auc-closed" style="border-color:#2f6a7a;background:linear-gradient(180deg,#0e2a33,#08161b)"><div class="big" style="color:#8af0f7">A REWARD NIGHT</div><div class="sub" style="color:#bfe6d2">Immunity is still decided at the challenge. The auction filled stomachs and pockets.</div></div>`;
  }
  return _shell(`<div class="auc-cover"><div class="sub">THE FINAL LEDGER</div><div class="big" style="font-size:34px">CLOSING BOOKS</div></div>
    ${verdict}
    <div class="auc-side" style="position:static;max-width:520px;margin:14px auto;max-height:none">${board}</div>`);
}

// ══ reveal handlers (DOM-only) ══
function _aucRebuildSidebar(revIdx) {
  const el = document.getElementById('auc-side-floor'); const a = window.aucData; const events = window.aucFloorEvents;
  if (el && a && events) el.innerHTML = _bank(a, events, revIdx);
  const lc = document.getElementById('auc-lotcount');
  if (lc && events) lc.textContent = `LOT ${Math.max(0, Math.min(revIdx + 1, events.length))} / ${events.length}`;
}
export function auctionRevealNext(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const s = window._tvState[screenKey];
  if (s.idx >= total - 1) return;
  s.idx++;
  const el = document.getElementById(`auc-step-floor-${s.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById('auc-cnt-floor'); if (cnt) cnt.textContent = `${s.idx + 1} / ${total}`;
  if (s.idx >= total - 1) {
    const c = document.getElementById('auc-ctrl-floor'); if (c) c.style.display = 'none';
    const d = document.getElementById('auc-done-floor'); if (d) d.style.display = '';
  }
  try { _aucRebuildSidebar(s.idx); } catch (e) {}
}
export function auctionRevealAll(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const s = window._tvState[screenKey];
  for (let i = s.idx + 1; i < total; i++) { const el = document.getElementById(`auc-step-floor-${i}`); if (el) el.style.display = ''; }
  s.idx = total - 1;
  const cnt = document.getElementById('auc-cnt-floor'); if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById('auc-ctrl-floor'); if (c) c.style.display = 'none';
  const d = document.getElementById('auc-done-floor'); if (d) d.style.display = '';
  try { _aucRebuildSidebar(s.idx); } catch (e) {}
}
