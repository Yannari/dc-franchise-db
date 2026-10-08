// ══════════════════════════════════════════════════════════════════════
// td/story/twist.js — twists as conversations
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08: "make sure we have conversation for twists, the Summit for example".
// twists.js decides what a twist does and records it on the twist (ep.twists[]); this writes the
// people in it talking, in their own voices (write.js, phrase.js): ep.twistStory[type] = a list of
// scenes { lines, players, at: 'set' | 'camp', camp }. The twist screen plays them after the
// host's announcement (vp-td-ep/twist-screens.js) and the text backlog prints them.
//
// The Summit ('three-gifts'): one nominee per team meets the others; each takes the survival kit
// (gift 1), the idol clue (2) or the Immunity Totem (3), and the engine says why in its weights
// (loyalty and social for the kit, intuition and strategy for the clue, boldness and disloyalty
// for the totem). Back at camp the team asks; a totem-taker may brag, shrug or slip (giftDrama).
import { gs, seasonConfig } from '../../core.js';
import { pStats } from '../../players.js';
import { getBond } from '../../bonds.js';
import { writeStory } from './write.js';
import { factsFor } from '../script/facts.js';

const GIFT = { 1: 'kit', 2: 'clue', 3: 'totem' };

function teamOf(ep, name) {
  return (ep.tribesAtStart || gs.tribes || []).find(t => (t.members || []).includes(name)) || null;
}
const closestOf = (name, pool) => [...pool].sort((x, y) => getBond(name, y) - getBond(name, x) || x.localeCompare(y));

export function writeTwistStory(ep) {
  const out = {};
  for (const tw of ep.twists || []) {
    const put = (k, list) => { if (list?.length) out[k] = [...(out[k] || []), ...list]; };
    if (tw.type === 'three-gifts' && tw.giftResults?.length >= 2) put('three-gifts', summit(ep, tw));
    if (tw.type === 'journey' && ep.journey?.travelers?.length) put('journey', journey(ep));
    if (tw.type === 'returning-player' && (tw.returnees || []).length) put('returning-player', returning(ep, tw));
    if (tw.newTribes?.length) put(tw.type, split(ep, tw));
    if (tw.type === 'idol-wager' && (tw.idolWagerResults || []).some(r => r.holder)) put('idol-wager', wager(ep, tw));
    if ((tw.type === 'the-feast' || tw.type === 'merge-reward') && (ep.feastEvents || tw.feastEvents || []).length) put(tw.type, feast(ep, tw));
    if (tw.type === 'loved-ones' && tw.lovedOnesStandout) put('loved-ones', loved(ep, tw));
  }
  return Object.keys(out).length ? out : null;
}

function summit(ep, tw) {
  const scenes = [];
  const venue = seasonConfig?.setting || 'hosted-camp';
  const base = who => ({ ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'pre' }), venue, voteYet: (gs.episodeHistory || []).some(h => h.num < ep.num && h.eliminated) });
  let n = 500;
  const write = (pool, ending, who, data = {}) => writeStory(pool, ending, who, data, base(who), { ep: ep.num, camp: 'twist', phase: 'pre', n: n++, place: 'secret', unique: 'soft' });
  const nominees = tw.giftResults.map(r => r.player);

  // the nominees meet, far from both camps
  const [a, b, c, d] = nominees;
  const meet = write('twist.summit.meet', 'any', { a, b, ...(c ? { c } : {}), ...(d ? { d } : {}) });
  if (meet) scenes.push({ at: 'set', lines: meet.lines, players: nominees });

  // each one's choice, to the camera, for the reason the engine weighed
  for (const r of tw.giftResults) {
    const w = write('twist.summit.choose', GIFT[r.gift] || 'kit', { a: r.player });
    if (w) scenes.push({ at: 'set', lines: w.lines, players: [r.player] });
  }

  // back at camp: the closest teammates ask
  for (const r of tw.giftResults) {
    const team = teamOf(ep, r.player);
    const mates = closestOf(r.player, (team?.members || []).filter(m => m !== r.player && (gs.activePlayers || []).includes(m)));
    if (mates.length < 2) continue;
    const drama = (tw.giftDrama || []).find(x => x.player === r.player);
    let s = {}; try { s = pStats(r.player) || {}; } catch { s = {}; }
    const ending = r.gift === 1 ? 'kit'
      : r.gift === 2 ? (r.searchOutcome === 'found' ? 'found' : 'empty')
        : drama ? ((s.boldness ?? 5) >= 8 ? 'totem-brag' : (s.loyalty ?? 5) <= 3 ? 'totem-cold' : 'totem-slip') : 'totem';
    const who = { a: r.player, b: mates[0], c: mates[1], ...(mates[2] ? { d: mates[2] } : {}) };
    const w = write('twist.summit.back', ending, who, { tribe: team?.name || 'the team' });
    if (w) scenes.push({ at: 'camp', camp: team?.name || null, lines: w.lines, players: Object.values(who) });
  }
  return scenes;
}

// ── shared helpers for the twists below ──
// opts.voteYet: a twist that is itself a vote (First Impressions) may talk about being voted out on day one
function writer(ep, opts = {}) {
  const venue = seasonConfig?.setting || 'hosted-camp';
  const voteYet = opts.voteYet || (gs.episodeHistory || []).some(h => h.num < ep.num && h.eliminated);
  let n = 700;
  return (pool, ending, who, data = {}, unique = 'soft') => writeStory(pool, ending, who, data,
    { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'pre' }), venue, voteYet, thing: !!data.thing, lot: !!data.lot }, { ep: ep.num, camp: 'twist', phase: 'pre', n: n++, place: 'secret', unique });
}
const sceneOf = (w, at, players, camp = null) => (w ? { at, camp, lines: w.lines, players } : null);

// The journey: the travellers meet; each learns what it cost or gave them (safe, a deal between
// them, an advantage, a lost vote) and says so to the camera.
function journey(ep) {
  const write = writer(ep);
  const J = ep.journey;
  const out = [];
  const [a, b, c] = J.travelers;
  const deal = (J.results || []).some(r => r.dealMade);
  out.push(sceneOf(write('twist.journey.meet', deal ? 'deal' : 'any', { a, b, ...(c ? { c } : {}) }), 'set', J.travelers));
  for (const r of J.results || []) {
    const ending = r.dealMade ? 'deal' : r.result === 'advantage' ? 'advantage' : r.result === 'lostVote' ? 'lostvote' : 'safe';
    out.push(sceneOf(write('twist.journey.result', ending, { a: r.name }), 'set', [r.name]));
  }
  return out.filter(Boolean);
}

// A player comes back: the closest person still in the game, and (when they are here) somebody
// who wrote their name, are the first to face them.
function returning(ep, tw) {
  const write = writer(ep);
  const out = [];
  for (const r of tw.returnees) {
    const name = r.name;
    const out1 = (gs.episodeHistory || []).filter(h => h.eliminated === name || (Array.isArray(h.eliminated) && h.eliminated.includes(name))).slice(-1)[0];
    const voters = (out1?.votingLog || []).filter(v => v.voted === name).map(v => v.voter).filter(v => (gs.activePlayers || []).includes(v) && v !== name);
    const here = (gs.activePlayers || []).filter(x => x !== name);
    const friend = closestOf(name, here.filter(x => !voters.includes(x)))[0] || null;
    const foe = voters.sort((x, y) => getBond(name, x) - getBond(name, y) || x.localeCompare(y))[0] || null;
    if (!friend) continue;
    const who = { a: name, b: friend, ...(foe ? { c: foe } : {}) };
    out.push(sceneOf(write('twist.return.arrive', foe ? 'foe' : 'any', who), 'camp', Object.values(who)));
  }
  return out.filter(Boolean);
}

// A swap splits people who were close: the closest pairs now on different teams say goodbye.
function split(ep, tw) {
  const before = (gs.episodeHistory || []).filter(h => h.num < ep.num).slice(-1)[0]?.gsSnapshot?.tribes || ep.tribesAtStart || [];
  const teamBefore = name => before.find(t => (t.members || []).includes(name))?.name;
  const teamAfter = name => tw.newTribes.find(t => (t.members || []).includes(name))?.name;
  const people = tw.newTribes.flatMap(t => t.members || []);
  const pairs = [];
  for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
    const x = people[i], y = people[j];
    if (teamBefore(x) && teamBefore(x) === teamBefore(y) && teamAfter(x) !== teamAfter(y) && getBond(x, y) >= 3) pairs.push([x, y, getBond(x, y)]);
  }
  pairs.sort((p, q) => q[2] - p[2] || p[0].localeCompare(q[0]));
  const write = writer(ep);
  const used = new Set();
  const out = [];
  for (const [x, y] of pairs) {
    if (used.has(x) || used.has(y) || out.length >= 2) continue;
    used.add(x); used.add(y);
    out.push(sceneOf(write('twist.swap.split', 'any', { a: x, b: y }, { mine: teamAfter(x), theirs: teamAfter(y) }), 'set', [x, y]));
  }
  return out.filter(Boolean);
}

// The idol wager: each holder decides, and the ones who play find out.
function wager(ep, tw) {
  const write = writer(ep);
  // one scene per holder, whatever they hold (two idols, one decision on screen)
  const seen = new Set();
  return tw.idolWagerResults.filter(r => r.holder && !seen.has(r.holder) && seen.add(r.holder)).map(r =>
    sceneOf(write('twist.wager', r.decision === 'declined' ? 'declined' : r.won ? 'won' : 'lost', { a: r.holder }), 'set', [r.holder])).filter(Boolean);
}

// The Exile Duel (episode.js): the one voted out waits on Exile for the next boot, and they duel.
// The night it starts, the exiled player says what they will do with it, and somebody at the
// table answers (the one who wrote their name and likes them least, else their closest friend).
// The duel night, the two face off before it (who they are to each other: rivals, friends or
// neither); the result belongs to the duel screen, so nothing here knows it.
// ep.exileStory = { sent?: lines, faceoff?: lines }.
export function writeExile(ep) {
  const write = writer(ep);
  const out = {};
  const tribal = ep.tribalPlayers || [];
  if (ep.exilePlayer && !ep.exileDuelResult) {
    const a = ep.exilePlayer;
    const wrote = (ep.votingLog || []).filter(v => v.voted === a && v.voter !== a && tribal.includes(v.voter)).map(v => v.voter);
    const foe = [...wrote].sort((x, y) => getBond(a, x) - getBond(a, y) || x.localeCompare(y))[0] || null;
    const b = foe && getBond(a, foe) <= 0 ? foe : closestOf(a, tribal.filter(x => x !== a))[0] || null;
    const w = write('exile.sent', b === foe ? 'foe' : 'friend', { a, ...(b ? { b } : {}) });
    if (w) out.sent = w.lines;
  }
  const R = ep.exileDuelResult;
  if (R?.exilePlayer && R.newBoot) {
    const bond = getBond(R.newBoot, R.exilePlayer);
    const w = write('exile.faceoff', bond <= -2 ? 'rivals' : bond >= 2 ? 'friends' : 'strangers', { a: R.newBoot, b: R.exilePlayer });
    if (w) out.faceoff = w.lines;
  }
  return Object.keys(out).length ? out : null;
}

// The feast (twists.js 'the-feast' / 'merge-reward'): everybody at one table, then what the engine
// says happened at it, one scene each (three at most): a deal across tribes, two people connecting,
// two clashing, a slip (a let something out, b heard it: an advantage when {thing} is set), and
// somebody sizing up the biggest threat at the table.
const FEAST = { 'strategic-deal': 'deal', 'emotional-positive': 'connect', 'emotional-negative': 'clash', 'intel-leak': 'leak', 'sizing-up': 'sizeup', 'power-revealed': 'sizeup' };
function feast(ep, tw) {
  const write = writer(ep);
  const evs = (ep.feastEvents || tw.feastEvents || []).filter(e => FEAST[e.type] && (e.players || []).length === 2);
  const out = [];
  // the table: the loudest, most social people there do the talking
  const all = [...new Set([...(gs.activePlayers || [])])];
  const st = n => { try { return pStats(n) || {}; } catch { return {}; } };
  const talkers = [...all].sort((x, y) => (st(y).social || 0) + (st(y).boldness || 0) - (st(x).social || 0) - (st(x).boldness || 0) || x.localeCompare(y)).slice(0, 4);
  if (talkers.length >= 3) {
    const [a, b, c, d] = talkers;
    out.push(sceneOf(write('twist.feast', 'table', { a, b, c, ...(d ? { d } : {}) }), 'set', talkers));
  }
  const seen = new Set();
  for (const e of evs) {
    if (out.length >= 4) break;
    const [a, b] = e.players;
    if (seen.has(a) || seen.has(b)) continue;
    const thing = e.type === 'intel-leak' && / Exposed$/.test(e.badgeText || '') ? e.badgeText.replace(/ Exposed$/, '') : null;
    const sc = sceneOf(write('twist.feast', FEAST[e.type], { a, b }, thing ? { thing } : {}), 'set', [a, b]);
    if (sc) { out.push(sc); seen.add(a); seen.add(b); }
  }
  return out.filter(Boolean);
}

// Loved ones (twists.js 'loved-ones'): the one it hit hardest (the engine's standout: loyal, not
// bold) with the closest person they have here, who it brought them nearer to.
function loved(ep, tw) {
  const write = writer(ep);
  const a = tw.lovedOnesStandout;
  const b = closestOf(a, (gs.activePlayers || []).filter(x => x !== a))[0] || null;
  return [sceneOf(write('twist.loved', 'standout', { a, ...(b ? { b } : {}) }), 'set', [a, b].filter(Boolean))].filter(Boolean);
}

// ── First Impressions (twists.js executeFirstImpressions) ────────────────────────────────────
// Day one: each tribe votes somebody out on gut alone, and the one voted out joins the other
// tribe instead of going home. Per tribe: the huddle before it (the boldest voter of the boot
// says the name, a second agrees, somebody who will not vote that way hesitates), every voter's
// booth line in their voice and for their own read of {target} (log.why: enemy, calculated,
// threat, outsider, gut, loud, nothing), the boot hearing it, the twist landing, the walk into
// the new camp (its most social member does the welcome), and one voter to the camera after.
// ep.tdFirstImp = [{ tribe, sentTo, boot, votes, huddle, booth: [{ voter, voted, lines }], read, twist, welcome, after }].
export function writeFirstImpressions(ep, tw) {
  const write = writer(ep, { voteYet: true });
  const host = seasonConfig?.host || 'Chris';
  const st = n => { try { return pStats(n) || {}; } catch { return {}; } };
  const by = k => (x, y) => (st(y)[k] || 0) - (st(x)[k] || 0) || x.localeCompare(y);
  const lines = w => w?.lines || [];
  return (tw.firstImpressions || []).map(r => {
    const boot = r.votedOut;
    const voters = [...(r.voters || [])];
    const doubters = (r.nonVoters || []).filter(x => x !== boot);
    const lead = [...voters].sort(by('boldness'))[0];
    const second = voters.filter(v => v !== lead).sort((x, y) => getBond(lead, y) - getBond(lead, x) || x.localeCompare(y))[0] || null;
    const doubt = [...doubters].sort((x, y) => getBond(boot, y) - getBond(boot, x) || x.localeCompare(y))[0] || null;
    const why = (r.log || []).find(l => l.voter === lead)?.why || 'nothing';
    const huddle = lead ? lines(write('fi.huddle', why, { a: lead, ...(second ? { b: second } : {}), ...(doubt ? { c: doubt } : {}) }, { target: boot })) : [];
    // every booth line its own: a fresh one for that read, else a fresh general one, else the least used
    const booth = (r.log || []).map(l => { const w = { a: l.voter }, d = { target: l.voted };
      return { voter: l.voter, voted: l.voted, lines: lines(write('fi.booth', l.why || 'nothing', w, d, true) || write('fi.booth', 'nothing', w, d, true) || write('fi.booth', l.why || 'nothing', w, d)) }; });
    const meanest = [...voters].sort((x, y) => getBond(boot, x) - getBond(boot, y) || x.localeCompare(y))[0] || null;
    const read = lines(write('fi.read', 'any', { a: boot, ...(meanest ? { b: meanest } : {}), h: host }, { tribe: r.tribe }));
    const twist = lines(write('fi.twist', 'any', { a: boot, ...(meanest ? { b: meanest } : {}), h: host }, { tribe: r.tribe, theirs: r.sentTo }));
    const dest = ((tw.newTribes || []).find(t => t.name === r.sentTo)?.members || []).filter(m => m !== boot);
    const [wa, wb] = [...dest].sort(by('social'));
    const welcome = wa ? lines(write('fi.welcome', 'any', { a: boot, b: wa, ...(wb ? { c: wb } : {}) }, { tribe: r.tribe, theirs: r.sentTo })) : [];
    const sorry = voters.filter(v => v !== lead).sort((x, y) => getBond(boot, y) - getBond(boot, x) || x.localeCompare(y))[0] || lead;
    const after = sorry ? lines(write('fi.after', 'any', { a: sorry }, { target: boot, theirs: r.sentTo })) : [];
    return { tribe: r.tribe, sentTo: r.sentTo, boot, votes: r.votes, huddle, booth, read, twist, welcome, after };
  });
}

// ── The auction (auction.js), lot by lot ─────────────────────────────────────────────────────
// The host puts each lot up; the people bidding say their bids (the opener, the raises, a bidding
// war between two of them as an exchange, a jump, a loan given, a loan refused); the host sells
// it; the winner reacts to what is under the cover (somebody sharp reacts to a power or immunity
// bought in the open); a switch offer is the host's dare. Then the close, and who kept their
// money. Every bid line is the bidLog's: who, how much, against whom.
// ep.tdAuction = { open, lots: [{ order, title, blind, winner, finalBid, bank, lines }], close }.
const AUC_KIND = r => (!r.sold ? null : r.effect === 'immunity' ? 'immunity' : r.effect === 'idol' ? 'idol' : r.isPower ? 'power'
  : r.effect === 'idolClue' ? 'clue' : r.effect === 'intel' ? 'intel' : r.emotional ? 'letter' : r.role === 'comfort' ? 'comfort'
  : r.blind ? 'blindfood' : 'food');
const money = n => `$${n}`;
export function writeAuctionScript(ep, A) {
  const write = writer(ep);
  const host = A.host || seasonConfig?.host || 'Chris';
  const st = n => { try { return pStats(n) || {}; } catch { return {}; } };
  const L = w => w?.lines || [];
  const roster = A.roster || [];
  const bold = [...roster].sort((x, y) => (st(y).boldness || 0) - (st(x).boldness || 0) || x.localeCompare(y));
  const open = L(write('auc.open', 'any', { h: host, a: bold[0], b: bold[1] }, {}));
  const lots = [];
  for (const r of (A.items || []).filter(x => x.offered !== false)) {
    const out = [];
    const lot = r.blind ? null : r.label;
    const lotKind = r.blind ? (r.role === 'immunity' ? 'immunity' : 'covered') : r.emotional ? 'letter' : r.role === 'comfort' ? 'comfort' : 'food';
    out.push(...L(write('auc.lot', lotKind, { h: host }, { ...(lot ? { lot } : {}), amount: money(r.start || 20) })));
    if (!r.sold) {
      out.push(...L(write('auc.nobid', 'any', { h: host }, {})));
      lots.push({ order: r.order, title: lot || 'A covered lot', blind: r.blind, winner: null, finalBid: 0, bank: null, lines: out });
      continue;
    }
    const log = r.bidLog || [];
    const good = log.filter(b => !b.failed);
    const fighters = [...new Set(good.map(b => b.bidder))];
    // a real bidding war (two people, a long climb to a big price) plays as one exchange from the
    // first bid; anything else is the bids worth hearing, one line each
    const war = fighters.length === 2 && good.length >= 6 && r.finalBid >= 160;
    if (!war) out.push(...L(write('auc.bid', 'open', { a: log[0].bidder }, { amount: money(log[0].amount) })));
    if (war) {
      const loser = fighters.find(x => x !== r.winner);
      const mid = good[Math.floor(good.length / 2)];
      out.push(...L(write('auc.bid', 'war', { a: loser, b: r.winner, h: host }, { amount: money(mid.amount), top: money(r.finalBid) })));
    } else {
      // the bids worth hearing: each new bidder's first, a jump, a loan, a refusal, and the last one
      let prev = log[0].bidder, said = 0;
      const heard = new Set([log[0].bidder]);
      for (let i = 1; i < log.length && said < 3; i++) {
        const b = log[i];
        if (b.failed) {
          out.push(...L(write('auc.bid', b.refusedBy ? 'refused' : 'broke', { a: b.bidder, ...(b.refusedBy ? { b: b.refusedBy } : {}) }, { amount: money(b.amount) })));
          said++; continue;
        }
        const last = log.slice(i + 1).every(x => x.failed);
        if (b.jump) { out.push(...L(write('auc.bid', 'jump', { a: b.bidder, b: prev, h: host }, { amount: money(b.amount) }))); said++; }
        else if (b.lent) { out.push(...L(write('auc.bid', 'loan', { a: b.bidder, b: b.lent.from }, { amount: money(b.amount) }))); said++; }
        else if (!heard.has(b.bidder) || last) { out.push(...L(write('auc.bid', 'raise', { a: b.bidder, b: prev }, { amount: money(b.amount) }))); said++; }
        heard.add(b.bidder); prev = b.bidder;
      }
    }
    out.push(...L(write('auc.sold', 'any', { a: r.winner, h: host }, { amount: money(r.finalBid) })));
    const kind = AUC_KIND(r);
    const watcher = ['power', 'immunity', 'idol'].includes(kind)
      ? roster.filter(m => m !== r.winner).sort((x, y) => (st(y).intuition || 0) - (st(x).intuition || 0) || x.localeCompare(y))[0] : null;
    const shown = r.switchOffer?.took ? r.switchOffer.keptLabel : r.revealedLabel;
    const what = String(shown || r.label || '').replace(/\s*\(.*\)\s*$/, '').replace(/ — .*$/, '').toLowerCase();
    out.push(...L(write('auc.win', kind, { a: r.winner, h: host, ...(watcher ? { b: watcher } : {}) }, { lot: what, amount: money(r.finalBid) })));
    if (r.switchOffer) {
      const other = String(r.switchOffer.otherLabel || '').toLowerCase();
      const how = r.switchOffer.took ? (r.switchOutcome === 'downgrade' ? 'dud' : 'upgrade') : 'kept';
      out.push(...L(write('auc.switch', how, { a: r.winner, h: host }, { lot: what, thing: other })));
    }
    lots.push({ order: r.order, title: r.blind ? 'A covered lot' : r.label, blind: r.blind, winner: r.winner, finalBid: r.finalBid, bank: r.budgetsAfter || null, lines: out });
  }
  const left = A.budgetsRemaining || {};
  const names = Object.keys(left);
  const saver = [...names].sort((x, y) => (left[y] || 0) - (left[x] || 0) || x.localeCompare(y))[0];
  const spender = [...names].sort((x, y) => (left[x] || 0) - (left[y] || 0) || x.localeCompare(y))[0];
  const close = [...L(write('auc.close', A.immunityMode && !A.immuneWinner ? 'noimmunity' : 'any', { h: host }, {})),
    ...(saver && (left[saver] || 0) >= 200 ? L(write('auc.saver', 'any', { a: saver }, { amount: money(left[saver]) })) : []),
    ...(spender && spender !== saver ? L(write('auc.spender', 'any', { a: spender }, {})) : [])];
  return { open, lots, close };
}
