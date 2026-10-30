// THE CLUE ROOM (the user, 2026-10-30: "what about a room that always there but sometimes theres event in it").
// A room of the house from the first day. On its wall, THE BOARD: every clue that went to the whole house is pinned
// there. Allies go in to brainstorm over it, and that is where a clue becomes leverage: a housemate who was shown a
// clue privately can pin it for the group (a pact), trade it for a promise (no nomination this week), or keep it.
// A third housemate may see the group go in. About every two weeks, the Voice puts something in the room: an object
// to find, a locked box with a riddle, a clue up for auction, a fake clue on the board (production), or two rivals
// called in to pool their clues or lose them.
//
// The real show: Season 4's hidden corridor of secrets held object clues the housemates found; Season 6 announced a
// clue dispenser; Season 13 a clue room (docs/research). The room here is the user's design on top of them.
//
// Pure: reads and writes the Secret Story state; bonds and the public come back as `effects` for the adapter.

import { addEvidence, handClue, showClue, secretOf, huntOf } from './hunt.js';
import { burn, balance } from './kitty.js';

const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };
const bd = (ctx, a, b) => Number(ctx?.bond?.(a, b)) || 0;
const weighted = (rng, items, w) => {
  const ws = items.map(w);
  const tot = ws.reduce((a, b) => a + Math.max(0, b), 0);
  if (!tot) return items[0];
  let r = rng() * tot;
  for (let i = 0; i < items.length; i++) { r -= Math.max(0, ws[i]); if (r < 0) return items[i]; }
  return items.at(-1);
};

export function clueRoomOf(state) {
  state.clueRoom ||= { board: [], deals: {}, pacts: [], lastEvent: 0, lastKind: null };
  return state.clueRoom;
}

/** The week's clues that went to the whole house go up on the board. */
export function pinPublic(state, week) {
  const R = clueRoomOf(state);
  for (const c of huntOf(state).shownClues) {
    if (c.week !== week || !(c.to === 'house' || c.share === 'all')) continue;
    if (R.board.some(b => b.clue === c.clue && b.secretId === c.secretId)) continue;
    R.board.push({ clue: c.clue, secretId: c.secretId, holders: [...(c.holders || [])], week, fake: !!c.fake, fakeText: c.fakeText || null });
  }
  return R.board;
}

// how strongly a session at the board moves a theory (a clue already seen, read again with friends)
const BOARD = 0.06;
// a private clue pinned for the group: the friends see it for the first time
const POOLED = 0.3;

/**
 * One week in the clue room: the brainstorming sessions, and (about every other week) the Voice's event.
 * Returns `{ act, clueActs, effects }`: the room's act for the viewer, the clue acts the event handed out (for the
 * hunt to argue over; drawn inside the room's screen), and the bonds and the public.
 */
export function clueRoomWeek(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const R = clueRoomOf(state);
  huntOf(state);
  /** @type {any} */ const effects = { bond: [], pub: [] };
  const clueActs = [];
  const sessions = [];
  if (house.length >= 4) {
    const used = new Set();
    const nSess = house.length >= 8 && rng() < 0.55 ? 2 : 1;
    for (let s = 0; s < nSess; s++) {
      const free = house.filter(n => !used.has(n));
      if (free.length < 2) break;
      const leader = weighted(rng, free, n => st(ctx, n, 'intuition') + st(ctx, n, 'strategic') + st(ctx, n, 'mental') * 0.5 - 6);
      const friends = free.filter(n => n !== leader && bd(ctx, leader, n) > 0.5).sort((a, b) => bd(ctx, leader, b) - bd(ctx, leader, a)).slice(0, 1 + (rng() < 0.5 ? 1 : 0));
      if (!friends.length) continue;
      const group = [leader, ...friends];
      group.forEach(n => used.add(n));
      // reading the board together
      const read = R.board.filter(b => !b.holders.some(h => group.includes(h)) && b.holders.some(h => house.includes(h) && secretOf(state, h) && !secretOf(state, h).found)).slice(-4);
      for (const b of read) for (const m of group) addEvidence(state, ctx, m, b.holders[0], { strength: BOARD * (0.6 + st(ctx, m, 'mental') / 12), how: 'clue:board', toward: b.fake ? b.fakeText : null });
      // a private clue, in the room: pinned for the group, traded for a promise, or kept
      const pooled = [], deals = [], kept = [];
      for (const m of group) {
        const priv = huntOf(state).shownClues.filter(c => Array.isArray(c.to) && c.to.includes(m) && c.share !== 'all' && !c.fake && c.week >= week - 2
          && !c.holders.some(h => group.includes(h)) && secretOf(state, c.holders[0]) && !secretOf(state, c.holders[0]).found).at(-1);
        if (!priv) continue;
        const outside = group.filter(g => g !== m && !priv.to.includes(g));
        if (!outside.length) continue;
        const share = 0.3 + st(ctx, m, 'loyalty') * 0.08 + st(ctx, m, 'social') * 0.03;
        const trade = 0.15 + st(ctx, m, 'strategic') * 0.07 + st(ctx, m, 'boldness') * 0.02;
        const keep = 0.2 + st(ctx, m, 'strategic') * 0.05 + (10 - st(ctx, m, 'loyalty')) * 0.05;
        const pick = weighted(rng, ['pin', 'trade', 'keep'], k => ({ pin: share, trade, keep })[k]);
        if (pick === 'pin') {
          for (const g of outside) { addEvidence(state, ctx, g, priv.holders[0], { strength: POOLED, how: 'clue:pooled' }); priv.to.push(g); effects.bond.push([m, g, 0.5]); }
          pooled.push({ by: m, clue: priv.clue, about: priv.holders[0], to: outside });
        } else if (pick === 'trade') {
          // the friend the clue is worth most to: the one closest to nominating them
          const partner = outside.sort((a, b) => bd(ctx, m, a) - bd(ctx, m, b))[0];
          addEvidence(state, ctx, partner, priv.holders[0], { strength: POOLED, how: 'clue:traded' });
          priv.to.push(partner);
          (R.deals[week] ||= []).push({ spare: m, promised: partner, clue: priv.clue });
          deals.push({ by: m, to: partner, clue: priv.clue, about: priv.holders[0] });
          effects.pub.push([m, 'game', 0.12, 'traded a clue for a promise']);
        } else kept.push({ by: m, clue: priv.clue });
      }
      // (nothing on the board for them and nothing in their pockets: no session to show)
      if (!read.length && !pooled.length && !deals.length && !kept.length) continue;
      for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) effects.bond.push([group[i], group[j], 0.3]);
      // a pact: the ones who worked a secret out together; whoever buzzes it alone betrays the others (adapter)
      const about = [...new Set([...read.map(b => b.holders[0]), ...pooled.map(p => p.about), ...deals.map(d => d.about)])];
      if (about.length) R.pacts.push({ week, members: group, about });
      // somebody sees them go in: three people in the clue room is an alliance, and it gets talked about
      const watcher = rng() < 0.45 ? house.filter(n => !group.includes(n))[Math.floor(rng() * Math.max(1, house.length - group.length))] || null : null;
      if (watcher) { effects.bond.push([watcher, leader, -0.4]); effects.pub.push([leader, 'seen', 0.1, 'was seen in the clue room']); }
      // the faces the group pins to the cards: only where one of them is fairly sure (what they believe, on the board)
      const sure = h => Math.max(0, ...group.map(m => Number(state.theories?.[m]?.[h]?.conf) || 0));
      sessions.push({ leader, group, read: read.map(b => ({ clue: b.clue, about: b.holders[0], fake: b.fake, face: !b.fake && sure(b.holders[0]) >= 0.35 ? b.holders[0] : null })), pooled, deals, kept, watcher, pact: about.length > 0 });
    }
  }
  // THE VOICE'S EVENT, about every other week
  let event = null;
  const due = week >= 2 && (week - (R.lastEvent || 0) >= 2 ? rng() < 0.7 : rng() < 0.12);
  const hidden = house.filter(n => secretOf(state, n) && !secretOf(state, n).found);
  if (due && hidden.length && house.length >= 4) {
    const kinds = ['object', 'box', 'auction', 'tamper', 'rivals'].filter(k => k !== R.lastKind);
    const kind = weighted(rng, kinds, k => ({ object: 1.3, box: 1.1, auction: 0.9, tamper: 0.6, rivals: 0.8 })[k]);
    const target = finder => { const pool = hidden.filter(n => n !== finder); return pool[Math.floor(rng() * pool.length)] || null; };
    if (kind === 'object') {
      const searchers = house.slice().sort((a, b) => (st(ctx, b, 'intuition') + st(ctx, b, 'boldness') + rng() * 6) - (st(ctx, a, 'intuition') + st(ctx, a, 'boldness') + rng() * 6)).slice(0, 4);
      const finder = searchers[0];
      const c = handClue(state, ctx, { holder: target(finder), how: 'room', house, to: finder });
      if (c) event = { kind, finder, searchers, clue: c.clue, got: c.got, share: c.share, shared: c.shared }, clueActs.push({ ...c, inRoom: true });
    } else if (kind === 'box') {
      const tries = house.slice().sort((a, b) => (st(ctx, b, 'mental') ** 2 + rng() * 30) - (st(ctx, a, 'mental') ** 2 + rng() * 30)).slice(0, 3);
      const solver = tries[0];
      const c = handClue(state, ctx, { holder: target(solver), how: 'box', house, to: solver });
      if (c) event = { kind, finder: solver, searchers: tries, riddle: RIDDLES[Math.floor(rng() * RIDDLES.length)], clue: c.clue, got: c.got, share: c.share, shared: c.shared }, clueActs.push({ ...c, inRoom: true });
    } else if (kind === 'auction') {
      const bids = house.map(n => ({ n, bid: Math.round(balance(state, n) * (0.04 + st(ctx, n, 'strategic') * 0.012) * (0.6 + rng() * 0.8) / 100) * 100 }))
        .filter(b => b.bid >= 500).sort((a, b) => b.bid - a.bid);
      if (bids.length) {
        const w = bids[0];
        const holder = target(w.n);
        if (holder) {
          const paid = burn(state, w.n, w.bid, 'bought a clue at auction', week);
          const c = handClue(state, ctx, { holder, how: 'auction', house, to: w.n });
          if (c) event = { kind, finder: w.n, bids: bids.slice(0, 4), paid, clue: c.clue, got: c.got, share: c.share, shared: c.shared }, clueActs.push({ ...c, inRoom: true });
        }
      }
    } else if (kind === 'tamper') {
      const holder = hidden[Math.floor(rng() * hidden.length)];
      const c = showClue(state, ctx, { holder, how: 'sabotage', house, fake: true });
      if (c) {
        R.board.push({ clue: c.clue, secretId: c.secretId, holders: [...c.holders], week, fake: true, fakeText: c.fakeText || null });
        event = { kind, clue: c.clue, about: holder };
        clueActs.push({ ...c, inRoom: true });
      }
    } else if (kind === 'rivals') {
      const pairs = [];
      for (let i = 0; i < house.length; i++) for (let j = i + 1; j < house.length; j++) pairs.push([house[i], house[j]]);
      const [a, b] = pairs.sort((x, y) => bd(ctx, x[0], x[1]) - bd(ctx, y[0], y[1]))[0];
      const yes = n => rng() < 0.35 + st(ctx, n, 'loyalty') * 0.03 + (10 - st(ctx, n, 'strategic')) * 0.03 + bd(ctx, a, b) * 0.03;
      const ya = yes(a), yb = yes(b);
      if (ya && yb) {
        const seen = n => huntOf(state).shownClues.filter(c => !c.fake && Array.isArray(c.to) && c.to.includes(n)).slice(-3);
        for (const c of seen(a)) if (!c.holders.includes(b)) { addEvidence(state, ctx, b, c.holders[0], { strength: POOLED, how: 'clue:pooled' }); if (!c.to.includes(b)) c.to.push(b); }
        for (const c of seen(b)) if (!c.holders.includes(a)) { addEvidence(state, ctx, a, c.holders[0], { strength: POOLED, how: 'clue:pooled' }); if (!c.to.includes(a)) c.to.push(a); }
        effects.bond.push([a, b, 1.2]);
      } else {
        // they lose what they had worked out: every theory they hold fades
        for (const n of [a, b]) for (const th of Object.values(state.theories?.[n] || {})) if (th && typeof th === 'object' && 'conf' in th) th.conf *= 0.6;
        effects.bond.push([a, b, -1]);
        effects.pub.push([ya ? b : a, 'heat', 0.12, 'refused to pool clues in the clue room']);
      }
      event = { kind, pair: [a, b], yes: [ya, yb], pooled: ya && yb };
    }
    if (event) { R.lastEvent = week; R.lastKind = event.kind; }
  }
  if (!sessions.length && !event) return { act: null, clueActs, effects };
  const beats = [];
  for (const s of sessions) beats.push({ text: `In the clue room, ${s.group.join(', ')} go over the board together.${s.pooled.length ? ` ${s.pooled[0].by} pins up a clue the others had never seen.` : ''}${s.deals.length ? ` ${s.deals[0].by} shows ${s.deals[0].to} a clue, in exchange for a promise.` : ''}`,
    players: s.group, badgeText: 'CLUE ROOM', badgeClass: 'gold', part: 'clue-room' });
  if (event) beats.push({ text: EVENT_BEAT[event.kind]?.(event) || 'Something new in the clue room.', players: [event.finder, ...(event.pair || [])].filter(Boolean), badgeText: 'CLUE ROOM', badgeClass: 'gold', part: 'clue-room' });
  return { act: { type: 'ss-clue-room', week, sessions, event, board: R.board.slice(-8).map(b => ({ clue: b.clue, about: b.holders[0], fake: b.fake })), beats }, clueActs, effects };
}

const EVENT_BEAT = {
  object: e => `A new object appears in the clue room. ${e.finder} finds it first: ${e.clue}.`,
  box: e => `A locked box in the clue room opens on a riddle. ${e.finder} solves it and takes the clue inside.`,
  auction: e => `The Voice auctions one clue in the clue room. ${e.finder} pays $${(e.paid || 0).toLocaleString('en-US')} for it.`,
  tamper: e => `Overnight, a new clue appears on the board: ${e.clue}. Nobody saw who put it there.`,
  rivals: e => `${e.pair[0]} and ${e.pair[1]} are called into the clue room: pool their clues, or lose them. ${e.pooled ? 'They pool them.' : 'They refuse, and lose them.'}`,
};

// the locked box's riddles: none gives anything away; the answer opens the padlock
export const RIDDLES = [
  ['The more of me you take, the more you leave behind. What am I?', 'Footsteps'],
  ['I have keys but open no locks. What am I?', 'A piano'],
  ['What has a face and two hands, but no arms or legs?', 'A clock'],
  ['I am always in front of you but can never be seen. What am I?', 'The future'],
  ['What can you keep after giving it to somebody?', 'Your word'],
  ['What gets wetter the more it dries?', 'A towel'],
  ['The person who makes it sells it. The person who buys it never uses it. What is it?', 'A coffin'],
  ['What has to be broken before you can use it?', 'An egg'],
];

/**
 * After the nominations: who kept the promise a clue bought, and who named the one who gave it to them anyway.
 * Returns the outcomes with their bonds (applied by the caller).
 */
export function settleDeals(state, week, ballots = []) {
  const R = clueRoomOf(state);
  const out = [];
  for (const d of R.deals[week] || []) {
    const b = ballots.find(x => x.voter === d.promised);
    if (!b) continue;
    const broken = (b.picks || []).includes(d.spare);
    out.push({ ...d, broken });
  }
  return out;
}

/** A right buzz on a secret a pact worked out together: the other members of the pact, betrayed. */
export function pactBetrayed(state, buzz, week) {
  const R = clueRoomOf(state);
  const p = R.pacts.filter(x => week - x.week <= 2 && x.members.includes(buzz.by) && x.about.includes(buzz.target)).at(-1);
  return p ? p.members.filter(n => n !== buzz.by && n !== buzz.target) : [];
}
