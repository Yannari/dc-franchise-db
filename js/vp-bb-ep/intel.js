// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/intel.js — the Intel drawer: what the house cannot see
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-14: "intel button should be in Big Brother too". Total Drama's drawer
// (vp-td-ep/stage.js intelHtml), on the Big Brother viewer: a button (and the i key) opens it over
// the stage, with tabs the viewer keeps open to read the game. The week's record (its snapshot, as
// the week ends) gives the bonds, the alliances, the deals and the showmances; the step gives what is
// in their heads right now (the side panel's "why" lines).
import { esc, img, col } from './stage.js';

export const TABS = [['heads', 'In their heads'], ['people', 'Relationships'], ['allies', 'Alliances'], ['deals', 'Deals'], ['power', 'Power'], ['kitty', 'Kitties']];
// (Kitties: Secret Story's only, every housemate's own pot of money: the user, 2026-10-28, "we need kitty in intel")
const money = n => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const ssOf = num => (globalThis.gs?.episodeHistory || []).find(e => +e.num === +num)?.gsSnapshot?.bb?.secretStory || null;
const BOND_WORD = v => (v >= 6 ? 'Close' : v >= 3 ? 'Friends' : v > -2 ? 'Neutral' : v > -5 ? 'Tension' : 'Enemies');
const BOND_CLS = v => (v >= 6 ? 'close' : v >= 3 ? 'friend' : v > -2 ? 'neutral' : v > -5 ? 'tense' : 'enemy');

/**
 * The house as it stands on the screen being watched (the user, 2026-10-14: "intel spoiled me who got
 * evicted before the final results"). `snap` is the last stretch's snapshot the screen has reached
 * (steps.js stamp); `shown` is who the stage has seen evicted so far (null: all of it). Until this
 * week's evictee is among them, nobody is marked out,
 * and the deals are the ones the week began with. Without a snapshot (an old save), the week's end.
 */
export function weekAt(num, snap = null, shown = null, at = null) {
  const E = (globalThis.gs?.episodeHistory || []).find(e => +e.num === +num);
  const S = E?.gsSnapshot;
  if (!S) return null;
  const evicted = E.evicted || E.eliminated;
  const ended = !shown || !evicted || evicted === 'No elimination' || shown.includes(evicted);
  const out = ended && evicted !== 'No elimination' ? evicted : null;
  // Mid-screen, the house as it stood before this stretch (the screen's snapStart, or for the week's first
  // stretch the last week's end), with the stretch's alliances added only once a line has said their name.
  // At the screen's last step, the stretch's end (snap).
  const prevEnd = () => {
    const P = (globalThis.gs?.episodeHistory || []).find(e => +e.num === +num - 1)?.gsSnapshot;
    return P ? { bonds: P.bonds, showmances: P.showmances, alliances: (P.namedAlliances || []).filter(a => a.active !== false && !a.dissolved) } : null;
  };
  let base = snap;
  if (snap && at && !at.atEnd) {
    // the first stretch of the first week starts from an empty house: nobody has made a pact yet
    const start = at.start || prevEnd() || { alliances: [] };
    if (start) {
      const said = (at.said || []).join(' \n ');
      const named = a => a?.name && said.includes(a.name);
      const end = snap.alliances || [];
      const before = (start.alliances || []).map(a => (named(a) && end.find(x => x.name === a.name)) || a);
      base = { ...snap, bonds: start.bonds || snap.bonds, showmances: start.showmances || snap.showmances,
        alliances: [...before, ...end.filter(a => named(a) && !before.some(x => x.name === a.name))] };
    }
  }
  const live = base && !ended ? base : null;
  const players = live && E.houseAtStart?.length ? [...E.houseAtStart]
    : [...new Set([...(S.activePlayers || []), ...(evicted && evicted !== 'No elimination' ? [evicted] : [])])];
  const bonds = live?.bonds || S.bonds;
  const bond = (a, b) => bonds?.[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0;
  const love = (a, b) => {
    const sh = ((live ? live.showmances : S.showmances) || []).find(x => x.players?.includes(a) && x.players?.includes(b));
    if (sh) return sh.breakupEp || sh.phase === 'broken-up' ? 'Broke up' : 'Showmance';
    if (live) return null;
    const sp = (S.romanticSparks || []).find(x => x.players?.includes(a) && x.players?.includes(b));
    return sp ? 'Spark' : null;
  };
  const week = +num;
  // before the eviction: the deals the week began with, standing as they stood then
  const deals = (S.sideDeals || []).filter(d => (d.players || []).every(n => players.includes(n)))
    .filter(d => !live || (Number(d.madeEp) || 0) < week)
    .map(d => (live && d.broken && (Number(d.brokenEp) || 0) >= week ? { ...d, broken: false, active: true, brokenBy: null } : d));
  return { players, out, bond, love, alliances: live ? (live.alliances || []) : (S.namedAlliances || []), gone: live ? [] : (S.dissolvedAlliances || []), deals, live: !!live };
}

/* ── THE POWER TAB ──────────────────────────────────────────────────────
   User, 2026-10-24: "in intel big brother can we have a tab power?". Who holds
   the week's power as far as the screen has got (the stage's ledger: L.hoh,
   L.nom, L.veto), then every secret power alive this week (the week's
   powerLedger, js/bb/powers.js powerLedgerFor): holder, who in the house knows
   it exists, what it does, its catch, its fuse. Nothing the screen has not
   reached: a power handed out THIS week stays off the drawer until a line has
   named it, and one fired this week reads spent only once its firing has
   aired — until the week is over, when everything is. */
const KNOWN = {
  public: ['The house knows', 'open'],
  'holder-secret': ['Holder unknown', 'half'],
  secret: ['Nobody knows', 'dark'],
};
function powerTab(num, L, face) {
  const E = (globalThis.gs?.episodeHistory || []).find(e => +e.num === +num);
  const evicted = E?.evicted || E?.eliminated;
  const ended = !!E && (!evicted || evicted === 'No elimination' || (L?.out || []).includes(evicted));
  const said = (L?.said || []).join(' \n ');
  let h = '<div class="bbi-sub">In charge right now</div>';
  const seat = (label, names, cls) => `<div class="bbi-row">${names.map(face).join('')}<b>${esc(names.join(' & '))}</b><span class="bbi-bond ${cls}">${esc(label)}</span></div>`;
  const rows = [];
  const SS = !!ssOf(num);
  if (L?.hoh) rows.push(seat(SS ? "Won the Voice's game" : 'Head of Household', [L.hoh], 'close'));
  const noms = (L?.nom || []).filter(n => !(L?.out || []).includes(n) || n === evicted);
  if (noms.length) rows.push(seat(noms.length === 1 ? 'Nominated' : 'On the block', noms, 'enemy'));
  if (L?.veto) rows.push(seat('Power of Veto', [L.veto], 'friend'));
  h += rows.length ? rows.join('') : `<div class="bbi-none">${SS ? "Nobody has won the Voice's game yet this week." :'No Head of Household yet this week.'}</div>`;
  const week = +num;
  const ledger = (E?.powerLedger || []).filter(p => p && p.powerId)
    .filter(p => ended || p.acquiredWeek < week || said.includes(p.name));
  h += '<div class="bbi-sub">Secret powers</div>';
  if (!ledger.length) return h + '<div class="bbi-none">No secret power in the house this week.</div>';
  h += ledger.map(p => {
    const [know, kcls] = KNOWN[p.visibility] || KNOWN.public;
    const spent = p.firedThisWeek && (ended || said.includes(`played a power: ${p.name}`));
    const fuse = spent ? 'Spent this week' : p.weeksLeft <= 0 ? 'Last week it exists' : `${p.weeksLeft} week${p.weeksLeft === 1 ? '' : 's'} left`;
    return `<div class="bbi-pw ${kcls}${spent ? ' spent' : ''}"><div class="bbi-row">${face(p.holder)}<b>${esc(p.name)}</b><span class="bbi-bond ${spent ? 'neutral' : 'tense'}">${esc(fuse)}</span></div>
      <div class="bbi-pwm">${esc(p.holder)} · ${esc(know)}</div>
      ${p.blurb ? `<div class="bbi-pwd">${esc(p.blurb)}</div>` : ''}
      ${p.catch ? `<div class="bbi-pwc"><span>The catch</span> ${esc(p.catch)}</div>` : ''}</div>`;
  }).join('');
  return h;
}

/** The drawer for a screen at a step. `L` is the stage's ledger (L.why), `tab` and `who` the viewer's picks. */
export function intelHtml(num, L, tab, who, snap = null, at = null) {
  const SS = ssOf(num);
  const tabs = TABS.filter(([k]) => k !== 'kitty' || SS);
  if (!tabs.some(t => t[0] === tab)) tab = 'heads';
  const W = weekAt(num, snap, L?.out || [], at && { ...at, said: L?.said || [] });
  let h = `<div class="bbi-head"><b>Intel</b><span>What the house doesn't know.</span><button type="button" class="bbi-x" data-close aria-label="Close Intel" title="Close (i)">&times;</button></div>
    <div class="bbi-tabs">${tabs.map(([k, l]) => `<button type="button" class="${k === tab ? 'on' : ''}" data-tab="${k}">${esc(l)}</button>`).join('')}</div><div class="bbi-body">`;
  const face = n => `<span class="bbi-f" style="--c:${col(n)}">${img(n)}</span>`;
  if (tab === 'heads') {
    h += L?.why?.length ? L.why.map(w => `<div class="bbi-why">${esc(w)}</div>`).join('') : '<div class="bbi-none">Nothing hidden in this moment. Keep watching.</div>';
  } else if (tab === 'power') {
    h += powerTab(num, L, face);
  } else if (tab === 'kitty' && SS) {
    // what each housemate has won, as the week began; the week's own winnings once the week has aired to its end
    // (a kitty that grew on a buzz nobody has seen yet would give the buzz away)
    const ended = W?.out != null;
    const K = ended ? SS.kitty || {} : SS.kittyAtWeekStart || SS.kitty || {};
    const room = (W?.players || Object.keys(K)).filter(n => K[n] != null);
    const rows = room.map(n => [n, Number(K[n]) || 0]).sort((x, y) => y[1] - x[1]);
    h += `<div class="bbi-sub">${ended ? 'Each kitty as the week ends' : 'Each kitty as the week began'}</div>`
      + (rows.length ? rows.map(([n, v]) => `<div class="bbi-row">${face(n)}<b>${esc(n)}</b><span class="bbi-bond ${v > 0 ? 'friend' : 'enemy'}">${v > 0 ? money(v) : 'Empty'}</span></div>`).join('')
        : '<div class="bbi-none">Nobody has a kitty yet.</div>')
      + '<div class="bbi-pwd" style="margin-top:8px">The money each housemate has won so far: a secret found with the buzzer takes the other one\'s kitty, and the public crowns the winner with whatever is left in theirs.</div>';
  } else if (!W) {
    h += '<div class="bbi-none">This week was saved without its record, so the house as it stood is not known.</div>';
  } else if (tab === 'people') {
    const me = W.players.includes(who) ? who : W.players[0];
    h += `<div class="bbi-pick">${W.players.map(n => `<button type="button" data-who="${esc(n)}" class="${n === me ? 'on' : ''} ${n === W.out ? 'out' : ''}" title="${esc(n)}">${face(n)}</button>`).join('')}</div>`;
    const rows = W.players.filter(n => n !== me).map(n => [n, W.bond(me, n), W.love(me, n)]).sort((x, y) => y[1] - x[1]);
    h += `<div class="bbi-sub">${esc(me)}${me === W.out ? ' · evicted this week' : ''}</div>`
      + rows.map(([n, v, love]) => `<div class="bbi-row">${face(n)}<b>${esc(n)}</b><span class="bbi-bond ${BOND_CLS(v)}">${BOND_WORD(v)}</span>${love ? `<span class="bbi-love">${esc(love)}</span>` : ''}</div>`).join('');
  } else if (tab === 'allies') {
    const live = W.alliances.filter(a => (a.members || []).filter(n => W.players.includes(n)).length >= 2);
    h += live.length ? live.map(a => `<div class="bbi-al"><div class="bbi-aln">${esc(a.name)}</div><div class="bbi-alm">${(a.members || []).filter(n => W.players.includes(n)).map(n => `<span>${face(n)}${esc(n)}</span>`).join('')}</div></div>`).join('')
      : '<div class="bbi-none">No named alliance in the house.</div>';
    const gone = W.gone.filter(a => a.name).slice(-4);
    if (gone.length) h += `<div class="bbi-sub">Broken up</div>${gone.map(a => `<div class="bbi-gone">${esc(a.name)}</div>`).join('')}`;
  } else if (tab === 'deals') {
    const kind = d => (d.tier || d.type || 'deal').replace(/-/g, ' ');
    const deals = W.deals.filter(d => d.active !== false && !d.broken);
    h += deals.length ? deals.map(d => `<div class="bbi-row">${(d.players || []).map(face).join('')}<b>${esc((d.players || []).join(' & '))}</b><span class="bbi-bond friend">${esc(kind(d))}</span></div>`).join('')
      : '<div class="bbi-none">No final-two or final-three deal standing.</div>';
    const broken = W.deals.filter(d => d.broken).slice(-4);
    if (broken.length) h += `<div class="bbi-sub">Broken</div>${broken.map(d => `<div class="bbi-gone">${esc((d.players || []).join(' & '))} · ${esc(kind(d))}${d.brokenBy ? ` · broken by ${esc(d.brokenBy)}` : ''}</div>`).join('')}`;
  }
  return `${h}${tab === 'heads' || tab === 'power' || tab === 'kitty' ? '' : `<div class="bbi-note">${W?.live ? 'As the house stands right now.' : 'As the week ends.'}</div>`}</div>`;
}

export const INTEL_CSS = `
.bbx{position:relative}
.bbx .bbi-btn{position:relative}
.bbx .bbi-btn.new::after{content:'';position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:50%;background:#ff2e4d;box-shadow:0 0 6px #ff2e4d}
.bbx .bbi{position:absolute;top:0;right:0;width:min(380px,94%);max-height:min(78vh,620px);display:none;flex-direction:column;z-index:60;
  background:rgba(9,13,24,.96);border:1px solid #2a3550;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.55);overflow:hidden;backdrop-filter:blur(6px)}
.bbx.intel-open .bbi{display:flex}
.bbx .bbi-head{display:flex;align-items:baseline;gap:10px;padding:12px 14px 6px}
.bbx .bbi-head b{font:800 15px 'Chakra Petch',sans-serif;letter-spacing:2px;color:#e8f2ff;text-transform:uppercase}
.bbx .bbi-head span{font-size:11.5px;color:#7d89a3;flex:1}
.bbx .bbi-x{background:none;border:0;color:#9fb0c6;font-size:20px;cursor:pointer;line-height:1}
.bbx .bbi-tabs{display:flex;gap:4px;padding:0 10px 8px;flex-wrap:wrap}
.bbx .bbi-tabs button{background:#121a2c;border:1px solid #24304a;color:#9fb0c6;border-radius:999px;padding:4px 10px;font:600 11px 'Chakra Petch',sans-serif;cursor:pointer}
.bbx .bbi-tabs button.on{background:#1b6cff;border-color:#1b6cff;color:#fff}
.bbx .bbi-body{overflow:auto;padding:4px 14px 14px}
.bbx .bbi-why{padding:7px 9px;margin:0 0 6px;border-left:3px solid #22e1ff;background:#0f1729;border-radius:4px;font-size:13px;color:#dbe6f7;line-height:1.35}
.bbx .bbi-none{color:#7d89a3;font-size:12.5px;padding:8px 0}
.bbx .bbi-note{color:#5f6b85;font-size:10.5px;margin-top:8px}
.bbx .bbi-sub{font:600 10px 'Chakra Petch',monospace;letter-spacing:2px;color:#7d89a3;text-transform:uppercase;margin:10px 0 6px}
.bbx .bbi-pick{display:flex;flex-wrap:wrap;gap:4px}
.bbx .bbi-pick button{background:none;border:2px solid transparent;border-radius:50%;padding:0;cursor:pointer;opacity:.75}
.bbx .bbi-pick button.on{border-color:#22e1ff;opacity:1}
.bbx .bbi-pick button.out{filter:grayscale(1)}
.bbx .bbi-f{display:inline-block;width:26px;height:26px;border-radius:50%;overflow:hidden;background:var(--c);vertical-align:middle;flex:none}
.bbx .bbi-f img{width:100%;height:100%;object-fit:cover}
.bbx .bbi-row{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;color:#dbe6f7}
.bbx .bbi-row b{flex:1;font-weight:700}
.bbx .bbi-bond{font:700 10.5px 'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:1px;padding:2px 7px;border-radius:999px;background:#1a2336;color:#9fb0c6}
.bbx .bbi-bond.close{background:#0f3b2a;color:#4ade80}.bbx .bbi-bond.friend{background:#0f2f3b;color:#5ee0ff}
.bbx .bbi-bond.tense{background:#3b2a0f;color:#fbbf24}.bbx .bbi-bond.enemy{background:#3b0f17;color:#ff6b81}
.bbx .bbi-love{font-size:10.5px;color:#ff8fc7}
.bbx .bbi-al{margin:0 0 10px;padding:8px 10px;border:1px solid #24304a;border-radius:8px;background:#0f1729}
.bbx .bbi-aln{font:800 12.5px 'Chakra Petch',sans-serif;color:#ffd166;margin-bottom:6px;letter-spacing:1px}
.bbx .bbi-alm{display:flex;flex-wrap:wrap;gap:6px 10px;font-size:12.5px;color:#dbe6f7}
.bbx .bbi-alm span{display:inline-flex;align-items:center;gap:5px}
.bbx .bbi-gone{font-size:12px;color:#7d89a3;padding:2px 0;text-decoration:line-through}
.bbx .bbi-pw{margin:0 0 8px;padding:4px 9px 7px;border:1px solid #24304a;border-left:3px solid #ffc758;border-radius:6px;background:#0f1729}
.bbx .bbi-pw.half{border-left-color:#7ee7ff}.bbx .bbi-pw.dark{border-left-color:#c9737f}.bbx .bbi-pw.spent{opacity:.7}
.bbx .bbi-pwm{font:600 10.5px 'Chakra Petch',sans-serif;letter-spacing:1px;text-transform:uppercase;color:#7d89a3;margin:0 0 4px}
.bbx .bbi-pwd{font-size:12.5px;color:#dbe6f7;line-height:1.35}
.bbx .bbi-pwc{font-size:12px;color:#c9b27a;line-height:1.35;margin-top:4px}
.bbx .bbi-pwc span{font:700 9.5px 'Chakra Petch',sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#ffc758}
`;
