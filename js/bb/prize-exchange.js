// ══════════════════════════════════════════════════════════════════════
// bb/prize-exchange.js — the veto is one of the boxes
// ══════════════════════════════════════════════════════════════════════
//
// The show's oldest and best veto format, and the only competition it runs
// where WINNING is not the decision. Everybody picks a wrapped box; the Power
// of Veto is in one of them; the rest are cash, trips, and punishments. Later
// pickers may steal what has already been opened. So the veto changes hands in
// public, repeatedly, and somebody always ends up choosing five thousand
// dollars over the only thing in the room that can save them.
//
// That choice is the whole reason to build it. Every other competition asks
// how good you are; this one asks what you actually came here for, in front of
// everybody, with a number attached — and the answer is different for a
// mastermind, a goat and somebody sitting on the block.
//
// The competition does not vanish: it sets the PICK ORDER. Finish last and you
// pick first, out of boxes nobody has opened; win it and you pick last, with
// everything on the table visible and stealable. That is what winning buys
// here, and it is worth more than a veto handed over quietly.
//
// TERMINATION, because a steal loop is a real hazard: nobody gets a second
// turn. Each houseguest opens once and may swap once, so the exchange is
// bounded by the field and cannot cycle — see the note above the picking loop
// for why the chain version, with its per-box freeze, was thrown away.
//
// The veto can therefore change hands more than once in a night, and that is
// the format working rather than a leak: each later picker sees a table the
// previous one did not, and taking it is exactly what the last seat is for.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { BB_PUNISHMENTS, applyPunishment, drawPunishment } from './punishments.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

/**
 * What is in the boxes besides the veto.
 *
 *   want   how much an ordinary houseguest covets it, before archetype. The
 *          veto is scored separately because what it is worth depends entirely
 *          on whether you are sitting on the block.
 */
export const EXCHANGE_PRIZES = [
  { id: 'cash', name: '$5,000', want: 6.5, line: n => `${n} unwraps five thousand dollars, and the room makes the noise it always makes at money.` },
  { id: 'trip', name: 'a holiday', want: 5.2, line: n => `${n} gets a holiday somewhere warm, for after all this, assuming there is an after all this.` },
  { id: 'call-home', name: 'a call home', want: 7.4, line: n => `${n} opens a phone call home, which is the one prize in this house nobody pretends not to want.` },
  { id: 'suite', name: 'a night in the HOH suite', want: 3.1, line: n => `${n} wins a night in the HOH suite, which is a bed and a bath and somebody else's room.` },
  { id: 'nothing', name: 'a bag of confetti', want: 0.4, line: n => `${n} unwraps a bag of confetti. It is not a metaphor for anything, it is just confetti.` },
];

/**
 * How badly this houseguest wants the veto, which is mostly about the block.
 *
 * Priced ABOVE the prize pool rather than inside it. The first pass had an
 * off-the-block houseguest valuing the veto at roughly what a holiday was
 * worth, so the room treated the only piece of power on the table as one more
 * parcel — the veto ended with a nominee 2% of the time and with the
 * competition winner 0.8%, which is not this format, it is a raffle.
 *
 * It still loses to money for the people money actually speaks to, because
 * that is the story this competition exists to tell — just not for everybody,
 * every time.
 */
function vetoDesire(name, nominees) {
  const st = pStats(name);
  if (nominees.includes(name)) return 40;            // nothing else is close
  // Off the block it is currency: leverage over the week, and a favour to sell.
  return 6.5 + (st.strategic || 5) * 0.45 + (st.boldness || 5) * 0.12;
}

/** How badly they want a given prize, which is mostly about who they are. */
function prizeDesire(name, prize, archetypeOf) {
  const st = pStats(name);
  const arch = archetypeOf(name);
  let want = prize.want;
  // Money talks loudest to the people who are not winning this game and know it.
  if (prize.id === 'cash' || prize.id === 'trip') {
    want += Math.max(0, 6 - (st.strategic || 5)) * 0.55;
    if (['goat', 'floater', 'underdog'].includes(arch)) want += 2.2;
    if (['mastermind', 'schemer', 'villain'].includes(arch)) want -= 1.8;
  }
  if (prize.id === 'call-home') want += (st.loyalty || 5) * 0.18;
  return want;
}

const PUNISH_LINE = [
  (n, p) => `${n} opens ${p.name} and holds it up like a dead fish. There is no putting it back.`,
  (n, p) => `${n} gets ${p.name}, which the room finds a great deal funnier than ${n} does.`,
  (n, p) => `It is ${p.name} for ${n}. ${p.blurb}`,
  (n, p) => `${n} unwraps ${p.name} and the laugh goes round the room twice.`,
];

/**
 * Run the exchange.
 *
 * @param {string[]} order  pick order, first to last (worst comp finish first)
 * @returns {object|null} the act, or null when there is nobody to play
 */
export function runPrizeExchange({ week, order = [], nominees = [], hoh = null,
  rng = Math.random, archetypeOf = () => '' } = {}) {
  const pickers = [...order].filter(Boolean);
  if (pickers.length < 3) return null;

  // One box each. The veto, then punishments for about a third of the rest,
  // then prizes — a pool with real teeth in it, which is what makes opening an
  // unknown box a gamble rather than a formality.
  const boxes = [{ kind: 'veto', name: 'the Power of Veto' }];
  const punishCount = Math.max(1, Math.round((pickers.length - 1) * 0.34));
  for (let i = 0; i < punishCount; i++) {
    // No tether in a box: Adam and Eve ties two people together and a box has
    // one person's name on it.
    const id = drawPunishment(rng, p => !p.tether);
    boxes.push({ kind: 'punishment', id, name: BB_PUNISHMENTS[id].name, def: BB_PUNISHMENTS[id] });
  }
  while (boxes.length < pickers.length) {
    const p = EXCHANGE_PRIZES[Math.floor(rng() * EXCHANGE_PRIZES.length)];
    boxes.push({ kind: 'prize', id: p.id, name: p.name, prize: p });
  }
  // Shuffle so the veto is not always the first box opened.
  for (let i = boxes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [boxes[i], boxes[j]] = [boxes[j], boxes[i]];
  }
  // A stable number per box. The pool can legitimately hold two $5,000 boxes,
  // so nothing downstream may treat the LABEL as identity — and the frozen
  // rule, which is what makes this terminate, turns on identity.
  boxes.forEach((b, i) => { b.boxNo = i + 1; });

  const held = new Map();          // name -> box
  const beats = [];
  const steals = [];
  const unopened = [...boxes];

  // How much this houseguest wants that box, right now, with a wobble on it.
  //
  // The wobble is not decoration. Without it every valuation was a pure
  // function of stats and archetype, so the exchange was deterministic: one
  // tuning pass had the last picker taking the veto in 100% of two thousand
  // runs. People are not that consistent about a wrapped box, and a
  // competition nobody can be surprised by is not worth watching.
  //
  // A nominee's 40 is far outside the noise band on purpose. Nothing talks
  // somebody on the block out of the veto.
  const valueTo = (name, box) => {
    if (!box) return 0;
    const base = box.kind === 'veto' ? vetoDesire(name, nominees)
      : box.kind === 'prize' ? prizeDesire(name, box.prize, archetypeOf)
        : -6;                      // nobody swaps TOWARDS a punishment
    return base + (rng() - 0.5) * 5;
  };

  const openFor = (name) => {
    const box = unopened.splice(Math.floor(rng() * unopened.length), 1)[0];
    held.set(name, box);
    if (box.kind === 'veto') {
      beats.push(beat(
        `${name} opens the box with the Power of Veto in it, in front of everybody, with people still to pick.`,
        [name], 'THE VETO IS OUT', 'gold'));
    } else if (box.kind === 'punishment') {
      beats.push(beat(PUNISH_LINE[Math.floor(rng() * PUNISH_LINE.length)](name, box.def),
        [name], 'A BOX NOBODY WANTED', 'red'));
    } else {
      beats.push(beat(box.prize.line(name), [name], 'OPENED', 'blue'));
    }
    return box;
  };

  // ── the picking ──
  //
  // The show's actual mechanic, and it is a SWAP rather than a steal chain:
  // each houseguest in turn opens a box, then either keeps it or trades it
  // with somebody who has already opened one. The person traded with simply
  // receives what was handed over — they do not get another turn.
  //
  // I built the chain version first, where being robbed earned you another go.
  // It is a real party-game rule and it broke the format: the victim could
  // immediately take the veto straight back, so the last pick — the thing
  // winning the competition actually buys — was worth LESS than random chance.
  // A straight swap makes every later picker strictly better informed than the
  // one before, which is the whole shape of the thing.
  for (const picker of pickers) {
    if (!unopened.length) break;
    const mine = openFor(picker);
    const options = [...held.entries()]
      .filter(([owner]) => owner !== picker)
      .map(([owner, box]) => ({ owner, box, gain: valueTo(picker, box) - valueTo(picker, mine) }))
      .sort((a, b) => b.gain - a.gain);
    const best = options[0];
    if (!best || best.gain <= 0) continue;
    // Taking from a friend costs something, and some people will not do it at
    // all — which is how a hero ends up holding confetti next to somebody who
    // is holding the only thing that mattered.
    const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'goat']
      .includes(archetypeOf(picker));
    let socialCost = Math.max(0, getPerceivedBond(picker, best.owner)) * (nice ? 0.75 : 0.25);
    // Taking the veto off somebody who is ON THE BLOCK is not a trade, it is a
    // declaration — you are removing the only thing standing between them and
    // the door, in front of the people who will vote. Most houseguests will not
    // do it to anybody they like, and the kind ones will not do it at all.
    if (best.box.kind === 'veto' && nominees.includes(best.owner)) {
      socialCost = socialCost * 3 + (nice ? 11 : 5);
    }
    if (best.gain <= socialCost) continue;

    held.set(picker, best.box);
    held.set(best.owner, mine);
    steals.push({ thief: picker, victim: best.owner, item: best.box.name,
      kind: best.box.kind, boxNo: best.box.boxNo, gave: mine.name, gaveKind: mine.kind });
    beats.push(beat(
      best.box.kind === 'veto'
        ? `${picker} trades ${mine.name} to ${best.owner} for the Power of Veto, and does it without a flicker.`
        : `${picker} hands ${mine.name} to ${best.owner} and takes ${best.box.name} instead.`,
      [picker, best.owner],
      best.box.kind === 'veto' ? 'THE VETO CHANGES HANDS' : 'TRADED', 'red'));
  }

  // Anybody still empty-handed takes what is left.
  for (const name of pickers) {
    if (!held.has(name) && unopened.length) openFor(name);
  }

  // ── what everybody walked away with ──
  let vetoHolder = null;
  const punished = [];
  const prizes = [];
  for (const [name, box] of held.entries()) {
    if (box.kind === 'veto') vetoHolder = name;
    else if (box.kind === 'punishment') {
      applyPunishment(name, box.id, { week: week?.num || 1 });
      punished.push({ name, id: box.id, punishment: box.name });
    } else prizes.push({ name, id: box.id, prize: box.name });
  }

  // The moment this format exists for: somebody had the veto and let it go.
  const gaveItUp = steals.find(s => s.kind === 'veto');
  if (gaveItUp && nominees.includes(gaveItUp.victim)) {
    beats.push(beat(
      `${gaveItUp.victim} is on the block and had the veto in ${pronouns(gaveItUp.victim).posAdj} hands. `
        + `${gaveItUp.thief} took it. There is no version of this week where that is forgotten.`,
      [gaveItUp.victim, gaveItUp.thief], 'TAKEN OFF A NOMINEE', 'red'));
  }
  const soldOut = [...held.entries()].find(([name, box]) =>
    box.kind === 'prize' && nominees.includes(name) && box.id !== 'call-home');
  if (soldOut) {
    beats.push(beat(
      `${soldOut[0]} is sitting on the block holding ${soldOut[1].name}, and will be explaining that choice `
        + 'to a jury in about six weeks.',
      [soldOut[0]], 'CHOSE THE MONEY', 'gold'));
  }

  return {
    type: 'prize-exchange', week: week?.num || 0, secret: false,
    order: [...pickers], vetoHolder, steals, punished, prizes,
    held: [...held.entries()].map(([name, box]) => ({ name, item: box.name, kind: box.kind, boxNo: box.boxNo })),
    beats,
  };
}
