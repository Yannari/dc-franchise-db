// ══════════════════════════════════════════════════════════════════════
// ci/twotiming.js — playing more than one person, and getting caught
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-02): "is it possible to catch someone having romance with many
// people ... playing 2 or more people / cheating? are they limited in
// romance". Before this, 109 of 175 players who flirted were flirting with
// two or more people at once and nobody could ever find out.
//
//   focus      a loyal player with a romance going leans away from a second;
//              a bold, low-loyalty one keeps several going. A player who is
//              really in a relationship holds back as much as they are loyal.
//   copy-paste a player juggling two may send the second the same line they
//              sent the first (the lazier and bolder, the likelier).
//   notes      two people being romanced by the same player get talking and
//              work it out — the closer and sharper they are, the likelier;
//              the same message, word for word, gives it away at once.
//   in public  a party (flirting with two in one night, in front of
//              everyone) and the flirting game (picking one crush while the
//              other watches) give it away to the room.
//   busted     the two of them bring the player into one group chat: they
//              charm their way out (keeping one), come clean, or deny it.
//   couple     two people together (a couple, married) sharing one profile and
//              one apartment: always taken, by each other. Real flirting is
//              rare (the partner is right there), but they can play it as a
//              strategy they agree on. When one of them wants to send a flirty
//              message, the other reacts: "it's a game move", or "you are NOT
//              sending that" — and wins or loses. Whoever they flirted with
//              who finds out it was a couple feels played.
//   taken      a player who is in a relationship. If the profile says so,
//              everyone knew, and being caught costs more at once; if it
//              shows "Single", nobody can know until they come clean in the
//              confrontation, and then it costs more.
//
// Everything proportional: stats scale chances and costs, never a gate.
import { rel, bump, S, clamp, addScene } from './state.js';
import { feel, mood } from './mind.js';
import { makeClaim, learn } from './claims.js';
import { togetherInCast, partnersOf, knowsKin } from './kin.js';

export const FOCUS = 0.75;           // how hard loyalty pulls a player toward one romance
export const TAKEN_RESTRAINT = 0.6;  // how hard loyalty holds back someone who is taken
export const COPY = 0.5;             // the most a player recycles a line
export const DISCOVER = 0.18;        // a day's chance two romanced people work it out, at most
export const COPY_GIVEAWAY = 2.6;    // the same message, word for word
export const TAKEN_COST = 1.6;       // being found out while really in a relationship
export const ROMANCE_AT = 2.5;       // attraction the romanced player feels back, for it to be a romance
export const FLING_DAYS = 6;         // how long a flirt still counts as going on
export const PARTY_SLIP = 0.9;       // how careless a bold, disloyal player gets at a party, at most

const isActive = (state, h) => state.active.includes(h);
const realOf = (state, h) => state.people[state.profiles[h]?.players[0]];
// How taken a status is (persona-data.js STATUSES): "Very single" is single,
// "It's complicated" is half of it.
const TAKEN_BY_STATUS = { Taken: 1, Married: 1, Engaged: 1, "It's complicated": 0.5 };
export const takenness = status => TAKEN_BY_STATUS[status] || 0;
export const COUPLE_ROOM = 0.6;      // how hard the partner in the room holds back real flirting
export const COUPLE_PLAY = 1.2;      // the most a couple flirts as a strategy, by how strategic they are
export const COUPLE_GAME = 0.9;      // how likely a couple's flirt is the agreed game move, at most
const ROMANTIC = new Set(['couple', 'married']);
/** Two people together, sharing one profile (shared.js relation). */
export const romanticPair = (state, h) => (state.profiles[h]?.players?.length || 0) > 1 && ROMANTIC.has(state.profiles[h]?.relation);
// A couple sharing a profile, or a spouse/partner who is in the cast too (ci/kin.js).
const takenOf = (state, h) => Math.max(romanticPair(state, h) ? 1 : 0, togetherInCast(state, h), takenness(realOf(state, h)?.status));
/** Really in a relationship (whatever the profile says); a couple is, by each other; dating counts. */
export const taken = (state, h) => takenOf(state, h) >= 0.8;
/** Says so on the profile? A taken player can show "Single" (profiles.js edits). */
const showsSingle = (state, h) => takenness(state.profiles[h]?.shown?.status) < 1;
/** Taken, and everybody can see it on the profile. */
export const openlyTaken = (state, h) => !showsSingle(state, h);

/** Who `me` has a romance going with: a flirt that did not go cold, recently, with someone who feels it back. */
export function flingsOf(state, me) {
  const row = state.flings?.[me] || {};
  return Object.entries(row).filter(([to, f]) => isActive(state, to) && state.day - f.day <= FLING_DAYS
    && rel(to, me, 'attraction') >= ROMANCE_AT).map(([to, f]) => ({ to, ...f }));
}

/**
 * How much `me` still wants to flirt with `you`, 0..1 (chat.js utilities).
 * Loyalty pulls toward the romance already going, as much as it is wanted;
 * someone taken holds back as much as they are loyal.
 */
export function focusDamp(state, me, you) {
  const others = flingsOf(state, me).filter(f => f.to !== you);
  const pull = others.reduce((m, f) => Math.max(m, clamp(rel(me, f.to, 'attraction') / 10, 0, 1)), 0);
  const loyal = S(state, me, 'loyalty') / 10;
  let k = 1 - FOCUS * loyal * pull;
  k *= 1 - TAKEN_RESTRAINT * loyal * takenOf(state, me);
  // The partner is sitting right there.
  if (romanticPair(state, me)) k *= 1 - COUPLE_ROOM * loyal;
  return clamp(k, 0.05, 1);
}

/** After a flirt (conversation.js runChat): record the romance, and maybe a recycled line. */
export function noteFlirt(state, rng, sc) {
  if (sc.data.intent !== 'flirt' || sc.data.ending === 'cold') return;
  const [from, to] = sc.who;
  const other = flingsOf(state, from).filter(f => f.to !== to).sort((a, b) => b.day - a.day)[0];
  if (other) {
    // The lazier with words and the bolder, the likelier to reuse the line.
    const p = COPY * (1.1 - S(state, from, 'social') / 10) * (0.5 + S(state, from, 'boldness') / 10);
    if (rng() < p) sc.data.copyOf = { scene: other.scene, to: other.to };
  }
  ((state.flings ||= {})[from] ||= {})[to] = { day: state.day, scene: sc.id };
}

/** The text that was copied, once both chats are written (script.js fills it). */
const copiedText = (state, sceneId) => state.copiedTexts?.[sceneId] || null;

function alreadyCaught(state, p, b, c) {
  return (state.caught || []).some(x => x.player === p && x.pair.includes(b) && x.pair.includes(c));
}

/** What everyone who hears about it takes from it: the claim travels like gossip. */
function spread(state, p, by, scene, secrecy = 'between') {
  return makeClaim(state, { kind: 'playing', holder: p, about: p, truth: true, secrecy, by, weight: openlyTaken(state, p) ? 1.3 : 1 });
}

/** The two who found out: trust gone, the crush cooled, and a bond between them. */
function stung(state, p, b, c, cost) {
  for (const x of [b, c]) {
    bump(x, p, 'trust', -2.5 * cost);
    bump(x, p, 'attraction', -2 * cost);
    bump(x, p, 'resentment', 2 * cost);
    feel(state, x, 'stress', 1.2);
  }
  bump(b, c, 'affection', 1); bump(c, b, 'affection', 1);
  bump(b, c, 'trust', 0.8); bump(c, b, 'trust', 0.8);
}

/**
 * Comparing notes. Two people a player is romancing, talking: the closer and
 * the sharper, the likelier they put it together, and a message they both got
 * word for word gives it away. Then the three of them, in one group chat.
 */
export function compareNotes(state, rng) {
  const found = [];
  for (const p of state.active) {
    const fl = flingsOf(state, p);
    if (fl.length < 2) continue;
    for (let i = 0; i < fl.length; i++) for (let j = i + 1; j < fl.length; j++) {
      const [b, c] = [fl[i].to, fl[j].to];
      if (alreadyCaught(state, p, b, c)) continue;
      const talk = clamp((rel(b, c, 'affection') + rel(c, b, 'affection')) / 20 + 0.3, 0.1, 1);
      const sharp = (S(state, b, 'intuition') + S(state, c, 'intuition')) / 20;
      const copy = [fl[i].scene, fl[j].scene].map(id => state.scenes.find(s => s.id === id))
        .find(s => s?.data.copyOf && copiedText(state, s.id));
      const chance = clamp(DISCOVER * talk * (0.4 + sharp) * (copy ? COPY_GIVEAWAY : 1), 0, 0.85);
      if (rng() < chance) found.push({ p, b, c, copy: copy ? copy.id : null });
    }
  }
  // One a day, the juiciest: a recycled line, then the one with the most at stake.
  const pick = found.sort((x, y) => (y.copy ? 1 : 0) - (x.copy ? 1 : 0)
    || rel(y.b, y.p, 'attraction') + rel(y.c, y.p, 'attraction') - rel(x.b, x.p, 'attraction') - rel(x.c, x.p, 'attraction'))[0];
  if (!pick) return null;
  return caught(state, rng, pick.p, [pick.b, pick.c], { how: pick.copy ? 'copy' : 'notes', copy: pick.copy });
}

/** It came out: the scene where they put it together, the claim, the confrontation. */
export function caught(state, rng, p, [b, c], { how, copy = null, scene = null } = {}) {
  // A relationship on the profile: they could see it all along, and it costs more.
  const open = openlyTaken(state, p);
  const cost = open ? TAKEN_COST : 1;
  (state.caught ||= []).push({ player: p, pair: [b, c], day: state.day, how });
  // b and c compare notes: a private chat, the two of them.
  const notes = how === 'notes' || how === 'copy'
    ? addScene(state, 'chat', [b, c], { intent: 'notes', ending: 'warm', about: p, how, copy,
      openlyTaken: open, turns: [], claims: [], pact: null })
    : null;
  stung(state, p, b, c, cost);
  const cl = spread(state, p, b, notes || scene, how === 'party' || how === 'game' ? 'public' : 'between');
  for (const x of [b, c]) learn(state, x, cl, x === b ? c : b, notes || scene);
  if (how === 'party' || how === 'game') for (const x of state.active) if (x !== p && x !== b && x !== c) learn(state, x, cl, b, scene);
  if (notes) notes.data.claims.push(cl.id);
  feel(state, p, 'paranoia', 1);
  const gc = busted(state, rng, p, [b, c], cost);
  return { notes, busted: gc };
}

/**
 * The three of them in one group chat. How the player meets it, by their own
 * read: charm (social and bold: talks one of them round), come clean (loyal or
 * guilty: both cool, but the grudge eases), deny (neither: it gets worse).
 */
export function busted(state, rng, p, [b, c], cost = 1) {
  const st = k => S(state, p, k) / 10;
  const w = {
    charm: st('social') * st('boldness') * 1.4,
    confess: st('loyalty') * 0.8 + mood(state, p, 'guilt') / 10,
    deny: (1 - st('loyalty')) * (0.4 + st('strategic') * 0.6),
  };
  const tot = w.charm + w.confess + w.deny;
  let r = rng() * tot, response = 'deny';
  for (const [k, v] of Object.entries(w)) if ((r -= v) <= 0) { response = k; break; }
  // Charm keeps the one who is more into them, at the other's expense.
  // Taken behind a "Single" profile: only coming clean brings it out.
  const cheat = response === 'confess' && taken(state, p) && !openlyTaken(state, p);
  const kept = response === 'charm' ? (rel(b, p, 'attraction') >= rel(c, p, 'attraction') ? b : c) : null;
  const lost = kept ? (kept === b ? c : b) : null;
  if (response === 'charm') {
    bump(kept, p, 'trust', 1.5); bump(kept, p, 'resentment', -1.2); bump(kept, p, 'attraction', 1);
    bump(lost, p, 'resentment', 1.2 * cost); bump(lost, kept, 'resentment', 0.8);
  } else if (response === 'confess') {
    for (const x of [b, c]) { bump(x, p, 'resentment', -1); bump(x, p, 'trust', 0.6); }
    feel(state, p, 'guilt', -1.5);
    // Coming clean all the way: "I'm not actually single." It costs them.
    if (cheat) for (const x of [b, c]) { bump(x, p, 'trust', -1.5 * (TAKEN_COST - 1) * 2); bump(x, p, 'attraction', -2); bump(x, p, 'resentment', 1); }
  } else {
    for (const x of [b, c]) { bump(x, p, 'resentment', 1.2 * cost); bump(x, p, 'trust', -1); }
  }
  feel(state, p, 'stress', 1.5);
  // The romances are over, except the one the charm kept.
  for (const x of [b, c]) if (x !== kept && state.flings?.[p]) delete state.flings[p][x];
  return addScene(state, 'group-chat', [b, c, p], { name: null, event: 'busted', player: p, pair: [b, c], response, kept, lost,
    openlyTaken: openlyTaken(state, p), cheat }, [b, c, p]);
}

/** A party (party.js): flirting with two people in one night, in front of everyone. */
export function partyTwoTimer(state, rng, sc) {
  const flirts = sc.data.flirts || [];
  const count = {};
  for (const [x, y] of flirts) { count[x] = (count[x] || 0) + 1; count[y] = (count[y] || 0) + 1; }
  // Only a player with two romances going, flirting with both of them in one
  // room; and only as careless as they are bold and disloyal.
  const options = Object.keys(count).filter(h => count[h] >= 2).map(h => {
    const going = new Set(flingsOf(state, h).map(f => f.to));
    const pair = flirts.filter(f => f.includes(h)).map(f => (f[0] === h ? f[1] : f[0])).filter(x => going.has(x))
      .sort((x, y) => rel(y, h, 'attraction') - rel(x, h, 'attraction')).slice(0, 2);
    return { h, pair };
  }).filter(o => o.pair.length === 2 && !alreadyCaught(state, o.h, o.pair[0], o.pair[1]));
  const o = options[0];
  if (!o) return null;
  const p = o.h, pair = o.pair;
  if (rng() >= PARTY_SLIP * (S(state, p, 'boldness') / 10) * (1.2 - S(state, p, 'loyalty') / 10)) return null;
  sc.data.twoTimer = { by: p, with: pair };
  caught(state, rng, p, pair, { how: 'party', scene: sc });
  return sc.data.twoTimer;
}

/** The flirting game (games.js flirt): picking one crush while the other watches. */
export function gameTwoTimer(state, rng, sc) {
  const answers = sc.data.rounds?.[0]?.answers || {};
  for (const [p, picked] of Object.entries(answers)) {
    const watcher = flingsOf(state, p).map(f => f.to).find(x => x !== picked && rel(x, p, 'attraction') >= ROMANCE_AT);
    if (!watcher || !flingsOf(state, p).some(f => f.to === picked) || alreadyCaught(state, p, picked, watcher)) continue;
    sc.data.twoTimer = { by: p, with: [picked, watcher], watcher };
    caught(state, rng, p, [picked, watcher], { how: 'game', scene: sc });
    return sc.data.twoTimer;
  }
  return null;
}

/** A couple flirting as a game move: as strategic as they are, and as wanted as the profile is. */
export function couplePlay(state, me, you) {
  if (!romanticPair(state, me)) return 0;
  return clamp(rel(you, me, 'attraction') / 10, 0, 1) * S(state, me, 'strategic') / 10 * COUPLE_PLAY;
}

/**
 * One of a couple wants to send a flirty message (conversation.js runChat,
 * before the effects). Either it's the game move they agreed on, or the other
 * one objects — and wins (the message goes out tame: no more than neutral) or
 * loses (it goes out, and the room gets tense). Returns the ending to use.
 */
export function coupleFlirt(state, rng, sc, ending) {
  const h = sc.who[0];
  if (sc.data.intent !== 'flirt' || !romanticPair(state, h)) return ending;
  const p = state.profiles[h];
  const flirter = sc.data.lead || p.roles?.face || p.players[0];
  const other = p.players.find(n => n !== flirter);
  const st = (n, k) => (state.people[n]?.stats?.[k] ?? 5) / 10;
  const role = flirter === (p.roles?.face || p.players[0]) ? 'face' : 'brain';
  const game = COUPLE_GAME * (st(flirter, 'strategic') + st(other, 'strategic')) / 2;
  if (rng() < game) { sc.data.couple = { stance: 'game', outcome: 'sent', role }; return ending; }
  const objection = st(other, 'loyalty') * 0.6 + (1 - st(other, 'temperament')) * 0.5 + rng();
  const push = st(flirter, 'boldness') * 0.8 + rng();
  const stopped = objection > push;
  sc.data.couple = { stance: 'jealous', outcome: stopped ? 'stopped' : 'sent', role };
  feel(state, h, 'stress', stopped ? 0.6 : 1.2);
  (state.coupleTension ||= {})[h] = (state.coupleTension[h] || 0) + 1;
  return stopped && ending === 'warm' ? 'neutral' : ending;
}

/**
 * Somebody finds out who was behind a profile (reveal.js revealTo). If it was
 * a couple who flirted with them, and they fell for it, they feel played.
 */
export function coupleRevealed(state, obs, h, scene) {
  if (!romanticPair(state, h) || !state.flings?.[h]?.[obs] || rel(obs, h, 'attraction') < ROMANCE_AT) return false;
  bump(obs, h, 'attraction', -3);
  bump(obs, h, 'resentment', 1.5);
  bump(obs, h, 'trust', -1);
  feel(state, obs, 'stress', 0.8);
  (state.coupleReveals ||= []).push({ obs, h, scene: scene?.id ?? null, day: state.day });
  return true;
}

// ── A kiss at the door, with a partner in the building ────────────────
// User (2026-10-04): "when Axel got eliminated she kissed Wayne on her way out
// but there wasn't even a cheating allegation even though her boyfriend is in
// the same game ... it doesn't affect real life". The kiss is private, but
// the one who was kissed can talk, it travels as gossip, and if it reaches
// the partner — who knows that profile is theirs — they find out. The season
// records it either way (ledger-record.js): the audience saw it.
export const KISS_TELL = 0.7;   // how readily the one kissed tells somebody, at most
export const KISS_WARN = 0.45;  // how readily a friend who knows both things tells the partner, at most
/** A visit kiss (blocking.js runVisit). Taken: remember it, it can come out. */
export function noteKiss(state, sc, h, to) {
  const partners = partnersOf(state, h).filter(p => p !== to);
  if (!partners.length && !taken(state, h)) return null;
  const k = { kisser: h, kissed: to, partners, day: state.day, scene: sc.id, told: false, found: [] };
  (state.kisses ||= []).push(k);
  sc.data.cheat = true;
  return k;
}
/**
 * Each day: the one who was kissed may tell their closest friend (the more
 * social and the less discreet, the likelier), in a chat of its own; from
 * there it is gossip. Then any partner who has heard it, and knows that
 * profile is theirs, finds out.
 */
export function kissFallout(state, rng) {
  const out = [];
  for (const k of state.kisses || []) {
    if (!k.told && state.active.includes(k.kissed) && state.day > k.day) {
      const st = x => S(state, k.kissed, x) / 10;
      if (rng() < KISS_TELL * (0.4 + st('social') * 0.6) * (1.15 - st('loyalty') * 0.7)) {
        const friend = state.active.filter(o => o !== k.kissed && o !== k.kisser)
          .sort((x, y) => rel(k.kissed, y, 'trust') + rel(k.kissed, y, 'affection') - rel(k.kissed, x, 'trust') - rel(k.kissed, x, 'affection'))[0];
        if (friend) {
          const sc = addScene(state, 'chat', [k.kissed, friend], { intent: 'kisstold', ending: 'warm', about: k.kisser,
            partner: k.partners.includes(friend) ? friend : null, turns: [], claims: [], pact: null });
          const cl = makeClaim(state, { kind: 'playing', holder: k.kisser, about: k.kissed, truth: true, by: k.kissed, to: friend });
          learn(state, friend, cl, k.kissed, sc); sc.data.claims.push(cl.id);
          k.told = true; k.claim = cl.id;
          out.push(sc);
        }
      }
    }
    if (!k.claim) continue;
    // Somebody who heard about the kiss AND knows the two are together (one of
    // them told them, kin.js) goes and tells the partner: the closer, the likelier.
    for (const p of k.partners) {
      if (k.found.includes(p) || !state.active.includes(p) || state.know[p]?.[k.claim]) continue;
      const knowsCouple = x => state.claims.some(c => c.kind === 'ally' && state.know[x]?.[c.id]
        && ((c.holder === p && c.about === k.kisser) || (c.holder === k.kisser && c.about === p)));
      const teller = state.active.filter(x => x !== p && x !== k.kissed && state.know[x]?.[k.claim] && knowsCouple(x))
        .sort((x, y) => rel(y, p, 'affection') - rel(x, p, 'affection'))[0];
      if (!teller || rng() >= KISS_WARN * clamp(0.3 + rel(teller, p, 'affection') / 10, 0.1, 1)) continue;
      const sc = addScene(state, 'chat', [teller, p], { intent: 'kisswarn', ending: 'neutral', about: k.kisser, with: k.kissed, turns: [], claims: [], pact: null });
      learn(state, p, state.claims.find(c => c.id === k.claim), teller, sc); sc.data.claims.push(k.claim);
      k.warnedBy = teller;
      out.push(sc);
    }
    for (const p of k.partners) {
      if (k.found.includes(p) || !state.active.includes(p) || !state.know[p]?.[k.claim] || !knowsKin(state, p, k.kisser)) continue;
      k.found.push(p);
      bump(p, k.kisser, 'resentment', 3); bump(p, k.kisser, 'trust', -3); bump(p, k.kisser, 'affection', -2);
      bump(p, k.kissed, 'resentment', 2);
      feel(state, p, 'stress', 2); feel(state, p, 'loneliness', 1);
      // Told to their face by the one who was kissed: the chat itself is the reveal. Otherwise, alone in the apartment.
      const direct = state.scenes.find(s => ((s.data?.intent === 'kisstold' && s.data.partner === p) || (s.data?.intent === 'kisswarn' && s.who[1] === p)) && s.data.about === k.kisser);
      if (!direct) out.push(addScene(state, 'life', [p], { habit: 'cheated', event: 'cheated', about: k.kisser, with: k.kissed }, [p]));
    }
  }
  return out;
}
