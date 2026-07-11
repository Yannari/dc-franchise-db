// js/auction.js — "Hell of a Deal": the Survivor Auction, rebuilt as a live, iterative, dramatic set-piece.
//
// Replaces the old one-shot silent max-bid. Each item is auctioned LIVE in $20 increments: a starting bidder
// opens, interested players counter one increment at a time (driven by valuation + rivalry spite), and the item
// SELLS when nobody challenges. The auction ENDS WITHOUT WARNING (a hidden endpoint leaves late items unsold).
// Players can LEND money (not share items); rivals REFUSE. Blind bids hide the item until won; the host may offer
// a curtain SWITCH (rotten coconut vs. spaghetti). Every outcome has gameplay consequences.
//
// Toggle — seasonConfig.auctionAwardsImmunity (default ON): when ON, the auction awards the only immunity of the
// night (sets ep.noChallenge) and a blind-immunity item is on the block — which can go UNSOLD, leaving nobody safe.
// When OFF, the auction is a pure reward alongside the normal immunity challenge (no immunity item).
import { gs, seasonConfig, players, ADVANTAGES } from './core.js';
import { pStats, pronouns } from './players.js';
import { getBond, addBond } from './bonds.js';

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const noise = (r = 1) => (Math.random() - 0.5) * r;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round20 = v => Math.round(v / 20) * 20;
const arch = n => players.find(p => p.name === n)?.archetype || 'floater';
function popDelta(n, d) { if (!gs.popularity) gs.popularity = {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; }
function hostName() { return seasonConfig?.host || 'Chris'; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ── flavour pools ──
const FOODS = ['a peanut butter & jelly sandwich', 'a full BBQ rib platter', 'a stack of buttermilk pancakes', 'a steaming bowl of ramen', 'a cheeseburger and fries', 'a personal pizza'];
const BLIND_FOOD = ['a plate of loaded nachos and a mocktail', 'spaghetti and meatballs with sparkling grape juice', 'a gourmet double cheeseburger', 'chicken and waffles drowned in maple syrup', 'a seafood boil', 'a slice of triple-chocolate cake'];
const DUDS = ['a rotten coconut', 'a single stale cracker', 'a cup of warm swamp water', 'a plate of plain boiled cabbage', 'an empty covered plate'];
const COMFORTS = ['a portable shower', 'a comfort kit — pillow, blanket, and clean socks', 'a hammock and bug net', 'a hot bath and a spa robe'];

const HOST_OPEN = [
  (h) => `${h} throws open a curtain on a table stacked with covered platters, cash boxes, and mystery boxes. "Welcome to the Auction! You've each got $500. Bid in twenty-dollar jumps on food, comforts, advantages — and some of it's hidden until you win it. You can lend money, you can't share what you buy, and I can end this thing whenever I feel like it. So if you want it, bid."`,
  (h) => `${h} rings a little brass bell. "Auction's open. Five hundred bucks each, twenty-dollar increments, blind bids on the covered items. Lend all the money you want — but whatever you win, you eat or use alone. And fair warning: I'm not telling you when it ends."`,
  (h) => `${h} fans a stack of bills. "Everybody's got $500. Some of these items you can see. Some are behind the curtain and you're bidding blind. Immunity might be in the mix — might not. Bid smart, bid fast, because when I say the auction's over, it's over."`,
];

// ── valuation: what a given player is roughly willing to pay (in dollars) for an item ──
function valuation(item, p, immunityMode) {
  const s = pStats(p);
  let appeal;
  if (item.blind) {
    // bidding on a MYSTERY: gambling appetite (boldness) + strategic curiosity + the hope it's immunity
    appeal = s.boldness * 0.5 + s.strategic * 0.42 + 2 + (immunityMode ? 1.6 : 0);
  } else if (item.role === 'food' || item.role === 'snack') {
    appeal = s.endurance * 0.42 + 3;            // the hungry pay up
  } else if (item.role === 'comfort') {
    appeal = s.social * 0.38 + 2.5;
  } else if (item.emotional) {
    appeal = s.loyalty * 0.6 + 3;               // homesick — letters/videos hit the loyal hardest
  } else appeal = 3;
  // no artificial dollar cap — a player values an item by their stats; the only real ceiling is the money
  // in play. Clamp only to their starting stake so they can, in principle, want to spend it all.
  return clamp(Math.round(appeal * 28 + noise(60)), 0, 500);
}

// ── build the item lineup for the night (always at least 8 lots) ──
function buildItems(immunityMode) {
  const usedF = new Set(), usedC = new Set();
  const food = () => { const f = pick(FOODS.filter(x => !usedF.has(x))) || pick(FOODS); usedF.add(f); return f; };
  const comfy = () => { const c = pick(COMFORTS.filter(x => !usedC.has(x))) || pick(COMFORTS); usedC.add(c); return c; };
  const items = [
    { role: 'food', blind: false, label: food(), start: 20 },
    { role: 'snack', blind: false, label: 'a bag of trail mix and beef jerky', start: 20 },
    { role: 'comfort', blind: false, label: comfy(), start: 40 },
    { role: Math.random() < 0.5 ? 'letter' : 'video', emotional: true, blind: false,
      label: Math.random() < 0.5 ? 'a letter from home' : 'a video message from loved ones', start: 40 },
    { role: 'advantage', blind: true, start: 60 },                      // a blind advantage
    { role: Math.random() < 0.5 ? 'idol-clue' : 'intel', blind: true, start: 60 },
    { role: 'food', blind: false, label: food(), start: 30 },
    { role: 'comfort', blind: false, label: comfy(), start: 30 },
  ];
  // one or two more lots for a fuller board (a mix, at most one extra power item)
  const extras = [
    { role: 'advantage', blind: true, start: 70 },
    { role: 'snack', blind: false, label: 'a fruit basket and a cooler of cold drinks', start: 20 },
    { role: 'comfort', blind: false, label: comfy(), start: 30 },
  ];
  shuffle(extras);
  items.push(...extras.slice(0, 1 + Math.floor(Math.random() * 2)));   // → 9-10 base lots
  if (seasonConfig.advantages?.secondLife?.enabled && !gs.advantages.some(a => a.type === 'secondLife') && Math.random() < 0.25)
    items.push({ role: 'sl-amulet', blind: true, start: 80 });
  shuffle(items);
  // immunity (immunity-mode only) goes into a back-half slot so it can be cut off if the auction ends early
  if (immunityMode) {
    const lo = Math.ceil(items.length * 0.45);
    const slot = lo + Math.floor(Math.random() * (items.length - lo + 1));
    items.splice(slot, 0, { role: 'immunity', blind: true, start: 80 });
  }
  items.forEach((it, i) => it.order = i + 1);
  return items;
}

// ── run a single item's live bidding war ──
function auctionItem(item, budgets, players_, immunityMode) {
  const val = {}; players_.forEach(p => val[p] = valuation(item, p, immunityMode));
  const dropped = new Set();
  let interested = players_.filter(p => val[p] >= item.start && budgets[p] >= 20);
  if (!interested.length) interested = players_.filter(p => val[p] >= 20 && budgets[p] >= 20);
  if (!interested.length) return { role: item.role, blind: item.blind, emotional: item.emotional, label: item.label, order: item.order, start: item.start, offered: true, sold: false, bidLog: [], winner: null, finalBid: 0 };

  const opener = interested.sort((a, b) => val[b] - val[a] || Math.random() - 0.5)[0];
  let curBid = clamp(round20(Math.min(item.start, val[opener], budgets[opener])), 20, budgets[opener]);
  if (curBid < 20) curBid = 20;
  let curHolder = opener;
  const bidLog = [{ bidder: opener, amount: curBid }];
  const backing = {};    // bidder → { from, amount }: the ally currently covering their shortfall (settled only if they win)
  const refusals = [];   // { asker, refuser }
  let guard = 0;

  // spite premium vs a rival holder — DISCIPLINE-GATED so it's smart, not random: impulsive, bold players will
  // chase an enemy well past an item's worth; strategic, even-tempered players won't. No artificial dollar cap —
  // an impulsive grudge match can climb toward the players' whole banks.
  const spiteOf = (p, holder) => {
    if (getBond(p, holder) > -2) return 0;
    const s = pStats(p);
    return clamp((8 - s.temperament) * 6 + s.boldness * 3 - s.strategic * 2 + Math.abs(getBond(p, holder)) * 5, 0, 240);
  };

  while (guard++ < 600) {
    const nextBid = curBid + 20;
    // a player challenges up to their willingness = valuation + spite — but only if they still have some of
    // their OWN money left. Once you're at $0 you're tapped out for the night: you can't bid, and you can't
    // borrow your way back in (a loan only tops up a player who still has skin in the game).
    const cand = players_.filter(p => p !== curHolder && !dropped.has(p) && budgets[p] > 0)
      .map(p => ({ p, ceiling: val[p] + spiteOf(p, curHolder) }))
      .filter(x => x.ceiling >= nextBid).sort((a, b) => b.ceiling - a.ceiling);
    if (!cand.length) break;                            // nobody able & willing → SOLD

    const chal = cand[0].p;
    let lent = null;
    if (budgets[chal] < nextBid) {
      // out of their own cash but still want it. Borrowing is allowed IF a willing ally (positive bond) has the
      // money to spare to cover the whole shortfall (keeping a $20 cushion). Better bond = more willing. No able,
      // willing lender → they drop out. gap is the TOTAL shortfall over their own budget at this price.
      const gap = nextBid - budgets[chal];
      const lender = players_.filter(l => l !== chal && l !== curHolder && getBond(l, chal) >= 2 && budgets[l] - 20 >= gap)
        .sort((a, b) => getBond(b, chal) - getBond(a, chal) || budgets[b] - budgets[a])[0];
      if (lender) { lent = { from: lender, amount: gap }; backing[chal] = { from: lender, amount: gap }; }
      else {
        dropped.add(chal);                              // no cash and no willing lender with cash → out
        const refuser = players_.find(l => l !== chal && l !== curHolder && getBond(l, chal) < 0 && budgets[l] - 20 >= gap);
        bidLog.push({ bidder: chal, amount: nextBid, failed: true, refusedBy: refuser || null });
        if (refuser) refusals.push({ asker: chal, refuser });
        continue;
      }
    }
    curBid = nextBid; curHolder = chal;
    bidLog.push({ bidder: chal, amount: curBid, lent });

    // occasional intimidation jump — bounded by BOTH the holder's valuation and their actual cash (no jumping on credit)
    if (Math.random() < 0.12) {
      const room = Math.min(val[curHolder], budgets[curHolder] + (lent ? lent.amount : 0));
      if (room > curBid + 40) {
        const jump = clamp(round20(curBid + 40 + Math.floor(Math.random() * 3) * 20), curBid + 20, room);
        if (jump > curBid) { curBid = jump; bidLog.push({ bidder: curHolder, amount: curBid, jump: true }); }
      }
    }
  }

  // settle: winner pays finalBid — own cash first, the shortfall covered by their backer
  const borrowed = Math.max(0, curBid - budgets[curHolder]);
  let winnerLoans = [];
  if (borrowed > 0 && backing[curHolder]?.from) {
    const from = backing[curHolder].from;
    const amt = Math.min(borrowed, budgets[from]);
    budgets[from] = Math.max(0, budgets[from] - amt);
    budgets[curHolder] = 0;
    winnerLoans = [{ to: curHolder, from, amount: amt }];
  } else {
    budgets[curHolder] = Math.max(0, budgets[curHolder] - curBid);
  }

  return {
    role: item.role, blind: item.blind, emotional: item.emotional, label: item.label, order: item.order, start: item.start,
    offered: true, sold: true, startingBidder: opener, startingBid: bidLog[0].amount,
    bidLog, winner: curHolder, finalBid: curBid, loans: winnerLoans, refusals,
  };
}

// ── reveal & apply the effect of a sold item; mutates `res` with revealedLabel + effect ──
function resolveEffect(res, ep) {
  if (!res.blind) { res.revealedLabel = res.label; res.effect = res.role; return; }
  const winner = res.winner;
  if (res.role === 'immunity') {
    gs.guaranteedImmuneThisEp = winner;
    res.effect = 'immunity'; res.revealedLabel = 'INDIVIDUAL IMMUNITY';
  } else if (res.role === 'advantage') {
    const advTypes = ['extraVote', 'voteSteal', 'voteBlock', 'safetyNoPower', 'soleVote'].filter(t => {
      const _src = seasonConfig.advantages?.[t]?.sources || ADVANTAGES.find(a => a.key === t)?.defaultSources || [];
      if (!_src.includes('auction')) return false;
      const tc = seasonConfig.advantages?.[t];
      if (!tc?.enabled) return false;
      const max = tc.count || 1;
      if (gs.advantages.filter(a => a.type === t).length >= max) return false;
      if (tc.oncePer === 'season' && (gs.advantagesFoundThisSeason?.[t] || 0) >= max) return false;
      if (tc.oncePer === 'phase' && (gs.advantagesFoundThisPhase?.[t] || 0) >= max) return false;
      return true;
    });
    if (!advTypes.length) advTypes.push('extraVote', 'voteSteal');
    const chosen = pick(advTypes);
    const advMax = seasonConfig.advantages?.[chosen]?.count || 1;
    if (gs.advantages.filter(a => a.type === chosen).length < advMax) {
      gs.advantages.push({ holder: winner, type: chosen, foundEp: ep.num, fromAuction: true });
      const _oncePer = seasonConfig.advantages?.[chosen]?.oncePer;
      if (_oncePer) { const _ck = _oncePer === 'phase' ? 'advantagesFoundThisPhase' : 'advantagesFoundThisSeason'; if (!gs[_ck]) gs[_ck] = {}; gs[_ck][chosen] = (gs[_ck][chosen] || 0) + 1; }
      const lbl = { extraVote: 'an Extra Vote', voteSteal: 'a Vote Steal', voteBlock: 'a Vote Block', safetyNoPower: 'Safety Without Power', soleVote: 'the Sole Vote' }[chosen] || chosen;
      res.effect = chosen; res.revealedLabel = lbl.toUpperCase(); res.isPower = true;
    } else { res.effect = 'food'; res.revealedLabel = pick(BLIND_FOOD) + ' (the advantage was already gone)'; }
  } else if (res.role === 'idol-clue') {
    const tribeName = gs.tribes.find(t => t.members.includes(winner))?.name;
    if (tribeName && gs.idolSlots?.[tribeName] && Math.random() < 0.8) {
      gs.advantages.push({ holder: winner, type: 'idol', foundEp: ep.num, fromAuction: true });
      gs.idolSlots[tribeName] = Math.max(0, (gs.idolSlots[tribeName] || 1) - 1);
      ep.idolFinds.push({ finder: winner, type: 'idol', tribe: tribeName, fromAuction: true });
      res.effect = 'idol'; res.revealedLabel = 'an IDOL CLUE — and it led straight to a Hidden Immunity Idol'; res.isPower = true;
    } else { res.effect = 'idolClue'; res.revealedLabel = 'an IDOL CLUE (the trail went cold this time)'; }
  } else if (res.role === 'intel') {
    res.effect = 'intel'; res.revealedLabel = 'GAME INTEL — a folded note naming who\'s coming for whom';
  } else if (res.role === 'sl-amulet') {
    if (!gs.advantages.some(a => a.type === 'secondLife')) {
      gs.advantages.push({ holder: winner, type: 'secondLife', foundEp: ep.num, fromAuction: true });
      ep.idolFinds.push({ finder: winner, type: 'secondLife', tribe: 'auction' });
      res.effect = 'secondLife'; res.revealedLabel = 'a SECOND LIFE AMULET'; res.isPower = true;
    } else { res.effect = 'food'; res.revealedLabel = pick(BLIND_FOOD); }
  } else { // blind that's just food
    res.effect = 'food'; res.revealedLabel = pick(BLIND_FOOD);
  }
}

// ── narrate a lot: turn the raw bid war into a prose play-by-play (VP + text + worker context) ──
function narrate(res) {
  const H = hostName();
  const N = [];
  const bids = res.bidLog.filter(b => !b.failed);
  const bidders = [...new Set(bids.map(b => b.bidder))];
  const counts = {}; bids.forEach(b => counts[b.bidder] = (counts[b.bidder] || 0) + 1);
  const combat = bidders.slice().sort((a, b) => counts[b] - counts[a]).slice(0, 2);
  const [A, B] = combat;
  const heat = bids.length;
  const w = res.winner, pr = pronouns(w);

  // OPEN
  if (res.blind) N.push(pick([
    `${H} wheels a covered item onto the block — no label, no hint, just a cloth over the top. Whatever it is, you bid blind.`,
    `A shape under a black cloth rolls out. Could be a feast, could be immunity, could be a rotten coconut. Nobody knows.`,
    `${H} pats a covered lot and grins: "Bid on the mystery." Not one person can see what's underneath.`,
  ]));
  else N.push(pick([
    `Up on the block: ${res.label}.`,
    res.emotional ? `${H} holds up ${res.label}, and the whole camp goes quiet — this one's personal.` : `${H} unveils ${res.label} to a ripple of interest.`,
    `Next lot: ${res.label}.`,
  ]));
  N.push(`${res.startingBidder} opens the bidding at $${res.startingBid}.`);

  // THE WAR
  if (heat >= 7 && combat.length === 2) N.push(pick([
    `${A} and ${B} lock horns and won't let go — twenty by twenty the number climbs to $${res.finalBid} before it finally breaks. Two people, one lot, and neither willing to blink.`,
    `It becomes a duel: ${A} bids, ${B} answers, ${A} again, all the way up to $${res.finalBid} while the rest of the table just watches.`,
    `${A} against ${B}, cutthroat right up to $${res.finalBid}. Every raise drew a counter.`,
  ]));
  else if (heat >= 7) N.push(pick([
    `It's a free-for-all — ${bidders.slice(0, 3).join(', ')} all diving in, paddles up, the price jumping twenty at a time to $${res.finalBid}.`,
    `Half the table wants it, and the bidding sprays in every direction before ${res.winner} lands it at $${res.finalBid}.`,
  ]));
  else if (heat >= 4) N.push(pick([
    `${A} and ${B} trade raises in a real tug of war before it settles.`,
    `A brisk little bidding war breaks out between ${A} and ${B}.`,
  ]));
  else N.push(pick([
    `Barely a contest — a couple of raises and it's done.`,
    `Nobody puts up much of a fight; it goes quick.`,
  ]));

  // NOTABLE BEATS
  const jump = bids.find(b => b.jump);
  if (jump) { N.push(pick([
    `${jump.bidder} doesn't nibble — the paddle comes down hard and the bid vaults to $${jump.amount}, trying to scare everyone off.`,
    `${jump.bidder} goes big to end it, jumping straight to $${jump.amount}.`,
    `No more twenties from ${jump.bidder} — a hard jump to $${jump.amount} to break the rhythm.`,
  ])); }
  if (res.loans?.length) { const l = res.loans[0]; N.push(pick([
    `${l.from} quietly slides ${w} the cash to stay in — bankrolling a bid ${pr.sub} couldn't cover alone. A favor like that gets remembered.`,
    `Short on funds, ${w} gets a loan from ${l.from} at exactly the right moment. Money changes hands under the table.`,
  ])); }
  if (res.refusals?.length) { const r = res.refusals[0]; N.push(pick([
    `${r.asker} comes up short and looks around for a loan. ${r.refuser} won't give it. ${r.asker} is out — and won't forget who said no.`,
    `${r.asker} needs a spot of cash to keep going. ${r.refuser} folds ${pronouns(r.refuser).posAdj} arms. Cold. ${r.asker} drops out.`,
  ])); }

  // SOLD
  N.push(pick([
    `Going once, going twice — SOLD to ${w} for $${res.finalBid}.`,
    `"Sold!" ${w} takes it for $${res.finalBid}.`,
    `The gavel drops. ${w} wins the lot at $${res.finalBid}.`,
  ]));

  // REVEAL REACTION
  if (res.blind) {
    if (res.effect === 'immunity') N.push(pick([
      `${w} pulls back the cloth — INDIVIDUAL IMMUNITY. ${pr.Sub} just bought ${pr.posAdj} way out of tonight's vote, and the whole table deflates.`,
      `The cover comes off: immunity. ${w} is safe, and everyone else just watched their easiest target buy a shield.`,
    ]));
    else if (res.isPower) N.push(pick([
      `The cloth drops — ${res.revealedLabel}. Real power, bought in the open. Every strategist at the table just filed that away.`,
      `${w} uncovers ${res.revealedLabel}. Nobody says a word. Everybody's thinking the same thing.`,
    ]));
    else if (res.effect === 'intel') N.push(`Underneath: ${res.revealedLabel}. ${w} now knows something the rest of them don't.`);
    else N.push(pick([
      `${w} paid ${res.finalBid > 200 ? 'a small fortune' : 'good money'}... for ${res.revealedLabel}. ${res.finalBid > 200 ? 'Ouch.' : 'Could be worse.'}`,
      `The big reveal: ${res.revealedLabel}. ${w} laughs it off — what else can you do.`,
    ]));
  }

  // SWITCH
  if (res.switchOffer) {
    if (res.switchOffer.took) N.push(res.switchOutcome === 'downgrade'
      ? `Then ${H} offers a switch. ${w} gambles it away — and gets stuck with ${res.switchOffer.otherLabel}. Should've kept the first one.`
      : `${H} offers a switch and ${w} rolls the dice, trading up to ${res.switchOffer.otherLabel}. Gutsy — and it paid off.`);
    else N.push(`Offered a switch for the unknown curtain, ${w} holds firm and keeps ${res.switchOffer.keptLabel}.`);
  }
  // FED / RESTED — a personal meal or comfort you can't share, but it fuels the body (not if they gambled it into a dud)
  const finalEff = res.effect;
  if ((finalEff === 'food' || finalEff === 'snack') && !res.gotDud) N.push(pick([
    `${finalEff === 'snack' ? 'Not a feast, but real calories' : 'A proper meal this deep in the game'} — ${w} eats every bite alone and looks steadier and better-fueled than anyone else out here.`,
    `${w} devours it solo — no sharing allowed — and the energy shows. A fed player competes harder.`,
  ]));
  else if (res.role === 'comfort' && !res.gotDud) N.push(pick([
    `A hot shower and real rest. ${w} looks human again — and a rested body is a sharper competitor.`,
    `${w} finally gets clean and comfortable. Small thing; a real lift to the body and the morale.`,
  ]));
  else if (res.gotDud) N.push(`${w} gambled a good thing away for that — and got nothing worth eating. Rough.`);
  return N;
}

// ── main entry: run the whole auction, mutate gs/ep, and store results on twistObj ──
export function runAuction(ep, twistObj) {
  // per-episode setting from the designer ('immunity' default | 'reward'); legacy season toggle honored as a fallback
  const immunityMode = twistObj.auctionImmunity != null
    ? twistObj.auctionImmunity !== 'reward'
    : (seasonConfig?.auctionAwardsImmunity !== false);
  const players_ = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  if (players_.length < 3) return;                     // needs a crowd
  ep.idolFinds = ep.idolFinds || [];

  const budgets = {}; players_.forEach(p => budgets[p] = 500);
  const items = buildItems(immunityMode);
  // hidden endpoint — the auction ends without warning, cutting 0–2 items off the end
  const cut = Math.random() < 0.6 ? 0 : Math.random() < 0.75 ? 1 : 2;
  const endpoint = clamp(items.length - cut, 7, items.length);   // always at least 7 lots go up

  const soldResults = [];
  const unsold = [];
  for (const item of items) {
    if (item.order > endpoint) { unsold.push({ ...item, offered: false, sold: false, revealedLabel: item.blind ? 'a covered mystery item' : item.label }); continue; }
    const res = auctionItem(item, budgets, players_, immunityMode);
    if (res.sold) resolveEffect(res, ep);
    // switch offer — only for plain food/comfort wins, ~35%
    if (res.sold && (res.effect === 'food' || res.effect === 'comfort' || res.effect === 'snack' || res.emotional) && !res.isPower && Math.random() < 0.35) {
      const s = pStats(res.winner);
      const other = Math.random() < 0.45 ? pick(DUDS) : pick(BLIND_FOOD);
      const took = (s.boldness * 0.6 + noise(4)) > 5;   // bold players gamble the switch
      res.switchOffer = { otherLabel: other, took, keptLabel: res.revealedLabel };
      if (took) {
        const otherIsDud = DUDS.includes(other);
        res.revealedLabel = other;
        res.switchOutcome = otherIsDud ? 'downgrade' : 'upgrade';
        if (otherIsDud) { res.gotDud = true; res.effect = 'dud'; popDelta(res.winner, 1); }   // gambled the meal away — no food, crowd sympathy
      } else {
        res.switchOutcome = 'declined';
      }
    }
    if (res.sold) res.narration = narrate(res);   // prose play-by-play for VP + text + worker
    res.budgetsAfter = { ...budgets };   // snapshot for the live bank sidebar
    soldResults.push(res);
  }

  // ── consequences ──
  const conf = [];
  const addConf = (res, text) => { conf.push({ player: res.winner, text }); res.confessional = text; };
  const immuneWinner = soldResults.find(r => r.effect === 'immunity')?.winner || null;
  soldResults.forEach(res => {
    if (!res.sold) return;
    // lending builds a bond (and a debt); refusals are remembered
    (res.loans || []).forEach(l => { addBond(res.winner, l.from, 1.5); });
    (res.refusals || []).forEach(r => { addBond(r.asker, r.refuser, -1); });
    // a publicly-bought power tips the table off
    if (res.isPower && ['advantage', 'extraVote', 'voteSteal', 'voteBlock', 'safetyNoPower', 'soleVote', 'idol', 'secondLife'].includes(res.effect)) {
      players_.filter(p => p !== res.winner && pStats(p).intuition >= 6).forEach(p => addBond(res.winner, p, -0.6));
      if (Math.random() < 0.5) addConf(res, `Buying that in the open was a risk. Everyone at the table just watched me spend real money on something that isn't food. They know exactly what that means.`);
    }
    // rivalry drain — the two who fought hardest lose a little more goodwill
    if (res.bidLog?.length >= 5) {
      const fighters = [...new Set(res.bidLog.filter(b => !b.failed).map(b => b.bidder))];
      if (fighters.length >= 2 && getBond(fighters[0], fighters[1]) < 0) addBond(fighters[0], fighters[1], -0.8);
    }
    // emotional beats
    if (res.emotional && res.sold) {
      popDelta(res.winner, 2);
      addConf(res, res.role === 'video' ? `Hearing their voices... I needed that more than any advantage. That's my whole reason for being out here.` : `Reading that letter, alone, away from the game for two minutes — it put everything back in focus.`);
    }
    // immunity purchase
    if (res.effect === 'immunity') {
      addConf(res, `I bought my way out of the vote. Not flashy — but nobody can touch me tonight, and that's all that matters.`);
    }
    // FOOD & COMFORT — a personal meal/rest (can't be shared). Restores the winner's energy meter, which
    // reduces the challenge-performance penalty and carries a little morale. A full meal beats a snack.
    if ((res.effect === 'food' || res.effect === 'snack') && !res.gotDud) {
      if (!gs.survival) gs.survival = {};
      const amt = res.effect === 'snack' ? 10 : 22;
      gs.survival[res.winner] = Math.min(100, (gs.survival[res.winner] || 80) + amt);
      res.energyGain = amt;
    } else if (res.role === 'comfort' && !res.gotDud) {
      if (!gs.survival) gs.survival = {};
      gs.survival[res.winner] = Math.min(100, (gs.survival[res.winner] || 80) + 10);
      popDelta(res.winner, 1);
      res.energyGain = 10;
    }
  });

  // in immunity mode, the auction replaces the challenge
  if (immunityMode) ep.noChallenge = true;

  // camp event capturing the night's biggest beat
  const campKey = gs.mergeName || 'merge';
  const bigBeat = (() => {
    if (immunityMode && !immuneWinner) return { type: 'auctionNoImmunity', text: `The auction ended before immunity ever hit the block — or nobody had the cash left when it did. Tonight, nobody is safe. Every single person walks into tribal wide open.`, badgeText: 'NO IMMUNITY', badgeClass: 'red', players: players_.slice() };
    if (immuneWinner) return { type: 'auctionImmunity', text: `${immuneWinner} won individual immunity out of a blind bid at the auction — spending real money to buy safety while everyone else stayed exposed.`, badgeText: 'IMMUNITY BOUGHT', badgeClass: 'gold', players: [immuneWinner] };
    const power = soldResults.find(r => r.isPower);
    if (power) return { type: 'auctionAdvantage', text: `${power.winner} spent big on a covered item and walked away with real power. The whole table saw the bid — and filed it away.`, badgeText: 'ADVANTAGE', badgeClass: 'purple', players: [power.winner] };
    const letter = soldResults.find(r => r.emotional);
    if (letter) return { type: 'auctionLetter', text: `${letter.winner} spent their money on a piece of home instead of an edge in the game. Camp went quiet for a minute. Some things are worth more than a vote.`, badgeText: 'A PIECE OF HOME', badgeClass: 'teal', players: [letter.winner] };
    return { type: 'auctionCalm', text: `The auction filled some stomachs and not much else. A relaxed camp this deep in the game — which is exactly when the knives come out.`, badgeText: 'THE AUCTION', badgeClass: 'grey', players: players_.slice() };
  })();
  ep.campEvents = ep.campEvents || {};
  (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({ ...bigBeat, tag: 'auction' });

  // ── store results ──
  twistObj.auction = {
    immunityMode, hostOpener: pick(HOST_OPEN)(hostName()), host: hostName(),
    items: [...soldResults, ...unsold].sort((a, b) => a.order - b.order),
    endpoint, budgetsStart: 500, budgetsRemaining: { ...budgets },
    immuneWinner, unsoldLabels: unsold.map(u => u.blind ? 'a covered mystery item' : u.label), confessionals: conf,
    roster: players_.slice(),
  };
  twistObj.budgetsRemaining = { ...budgets };
  // back-compat shape for existing twist-scene / summary consumers
  twistObj.auctionResults = soldResults.map(r => ({
    item: r.role, label: r.blind ? `Blind Bid (revealed: ${r.revealedLabel})` : r.revealedLabel,
    winner: r.winner, winnerName: r.winner, bid: r.finalBid, isBlind: r.blind, effect: r.effect,
    startingBidder: r.startingBidder, startingBid: r.startingBid,
  }));
}
