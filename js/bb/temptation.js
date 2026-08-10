// ══════════════════════════════════════════════════════════════════════
// bb/temptation.js — the Den of Temptation
// ══════════════════════════════════════════════════════════════════════
//
// BB19's whole season ran on one sentence: "for every temptation taken, there
// will be a consequence." The detail everybody misremembers — including me,
// until the wiki said otherwise — is WHO PAYS.
//
// Not the person who took it. Paul Abrahamian accepted the Pendant of
// Protection in week one and was safe for three evictions; the consequence
// landed on Ramses Soto, who had nothing to do with it and was forced to
// nominate himself. The taker walks away clean, in secret, while somebody
// else sits in a chair they did not earn.
//
// That is what makes this the distributor worth building. The other three are
// about acquisition: a competition you win, a box you open, an audience that
// picks you. This one is about CONSENT. The offer is free, the price is
// somebody else's week, and the house is told a curse has landed without ever
// being told whose greed caused it — so what the twist actually produces is a
// room full of people hunting a culprit, and a good chance they settle on the
// wrong one.
//
// Declining is real and costs nothing. That is deliberate: a decision you can
// only make one way is not a decision, and a houseguest who walks out of that
// den empty-handed rather than let a stranger take the hit is a genuine
// character beat the format cannot otherwise produce.

import { gs, players } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond, getPerceivedBond } from '../bonds.js';
import { makePicker, clamp } from '../bb-comps/_shared.js';
import { BB_POWER_DEFINITIONS, grantPower } from './powers.js';

/**
 * What the house pays. One kind for now, and it is the canonical one — a
 * houseguest who had nothing to do with the decision is forced to put
 * themselves on the block.
 */
export const TEMPTATION_CURSES = Object.freeze({
  'third-chair': {
    id: 'third-chair',
    name: 'The Curse of the Third Chair',
    rule: 'One houseguest, chosen at random, must nominate THEMSELVES alongside the Head of Household’s two.',
  },
});

const beat = (text, players, badgeText, badgeClass = 'twist') =>
  ({ type: 'temptation', text, players: [...players].filter(Boolean), badgeText, badgeClass });

const OFFER = [
  (n, p, power) => `${n} is called to the Den alone. The room is red and there is nothing in it but a screen, and the screen offers ${p.obj} ${power} — no competition, no vote, no catch that ${p.sub} can see.`,
  (n, p, power) => `The Den opens for ${n}. ${p.Sub} sits down and is offered ${power} outright, and then is told the other half: taking it puts a curse into the house, and the curse will not land on ${p.obj}.`,
  (n, p, power) => `${n} walks into the Den expecting a competition and finds a chair. ${power} is on the table. Somebody else pays for it. ${p.Sub} has about ninety seconds.`,
];

const ACCEPT = [
  (n, p) => `${n} takes it. ${p.Sub} does not agonise, and the part ${p.sub} will replay later is how easy ${p.sub} found it.`,
  (n, p) => `${n} accepts. Somewhere behind ${p.obj} a name is being drawn out of a hat and ${p.sub} has decided ${p.sub} can live with that.`,
  (n) => `${n} says yes before the screen has finished the sentence.`,
  (n, p) => `${n} asks whether the house will know. The screen says no. ${p.Sub} takes it.`,
];

const DECLINE = [
  (n, p) => `${n} says no. ${p.Sub} sits with it for a long moment and then says no again, and walks out of the Den with exactly what ${p.sub} walked in with.`,
  (n, p) => `${n} turns it down. Not out of strategy — ${p.sub} simply will not have somebody else pay for ${p.posAdj} week.`,
  (n) => `${n} refuses. The screen goes dark, the Den closes, and nothing at all happens to anybody.`,
];

const CURSED = [
  (v, p) => `Big Brother calls the house to the living room. Somebody accepted a temptation, and ${v} has been cursed for it — ${p.sub} will nominate ${p.ref} this week, and ${p.sub} does not get to know who did this to ${p.obj}.`,
  (v) => `The curse lands on ${v}. No competition, no vote, no reason: a name came out of a hat because somebody in that room said yes to something.`,
  (v, p) => `${v} is told to put ${p.ref} on the block. ${p.Sub} looks around the room at nine faces and knows one of them is the reason.`,
];

const SUSPECT = [
  (who, at) => `${who} has decided it was ${at}, and says so quietly enough to be deniable and loudly enough to spread.`,
  (who, at) => `${who} works through who has looked comfortable all week and lands on ${at}.`,
  (who, at) => `${who} is certain it was ${at}. ${who} is not certain of much else, but ${who} is certain of that.`,
];

/**
 * Who goes into the Den.
 *
 * BB19 put it to America for the first three weeks, so this is the audience
 * channel's currency again — screen time, not merit. A floor keeps a quiet
 * houseguest a long shot rather than an impossibility.
 */
function pickEntrant(house, rng) {
  const pool = house.map(name => ({ name, weight: Math.max(0.6, 3 + (gs.popularity?.[name] || 0)) }));
  const total = pool.reduce((sum, c) => sum + c.weight, 0);
  let roll = rng() * total;
  for (const c of pool) { roll -= c.weight; if (roll <= 0) return c.name; }
  return pool[pool.length - 1]?.name || null;
}

/**
 * Does the offer get taken?
 *
 * Two halves, and the second one was missing entirely.
 *
 * WHO THEY ARE. Boldness and strategic play push towards yes; loyalty pushes
 * hard against, because this is the one place in the engine where loyalty
 * costs you something — the price is paid by somebody else.
 *
 * WHERE THEY STAND. A houseguest who can feel the week closing on them and a
 * houseguest nobody has thought about all season were evaluating that envelope
 * identically, which is exactly backwards: the whole point of a temptation is
 * that it is worth most to the person who needs it most. Being somebody's
 * target, having nobody left, and having spent time on the block all push
 * towards taking it — and a comfortable houseguest can afford the principle.
 *
 * Everything proportional, nothing gated, so a safe villain still grabs it and
 * a desperate hero can still refuse.
 */
function acceptRead(name, rng, { house = [], hoh = null } = {}) {
  const st = pStats(name);
  const archetype = players.find(p => p.name === name)?.archetype;
  const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(archetype);
  const wicked = ['villain', 'mastermind', 'schemer'].includes(archetype);

  // Base tuned against the REAL roster rather than a flat 5-across cast: it
  // averages loyalty 6.07, so the old numbers put an ordinary houseguest under
  // a coin flip and a loyal one near a quarter. On the show almost every
  // temptation offered was taken — refusing is the exception worth writing a
  // scene about, not the default — so an ordinary houseguest now says yes
  // about six times in ten and it is the principled ones who hold out.
  const who = 0.60
    + st.boldness * 0.035
    + st.strategic * 0.028
    - st.loyalty * 0.045
    + (wicked ? 0.16 : 0)
    - (nice ? 0.14 : 0);

  // ── where they stand ──
  const room = (house || []).filter(n => n && n !== name);
  // Everybody who is currently aiming at them. Being hunted by the house is
  // the clearest reason to take something that stops a nomination.
  const hunted = room.filter(n => gs.intentions?.[n]?.targets?.[0] === name).length;
  // The person holding the keys aiming at you is worth more than anybody else.
  const hohAim = hoh && gs.intentions?.[hoh]?.targets?.[0] === name ? 1 : 0;
  // Nobody to hide behind. Mean perceived bond across the room, so a
  // well-liked houseguest reads as safe and an isolated one does not.
  const warmth = room.length
    ? room.reduce((sum, n) => sum + (() => { try { return getPerceivedBond(name, n); } catch { return 0; } })(), 0) / room.length
    : 0;
  // And what has already happened to them this season.
  const blocked = Number(gs.bb?.stats?.[name]?.timesOnTheBlock || 0);

  const exposure =
      hunted * 0.09
    + hohAim * 0.16
    + Math.max(0, -warmth) * 0.055
    - Math.max(0, warmth) * 0.030
    + Math.min(3, blocked) * 0.05;

  return rng() < clamp(who + exposure, 0.05, 0.94);
}


/**
 * Run the Den for this week. Returns an act, or null if it cannot run.
 *
 * Called at week opening, BEFORE nominations, because the curse has to be able
 * to put a third chair on the stage before the ceremony reads names out.
 */
export function runDenOfTemptation({ week, house, rng = Math.random, offered = 'random' } = {}) {
  const room = (house || []).filter(Boolean);
  // The curse needs somebody who is not the taker, and a house this small has
  // no room for a third chair anyway.
  if (room.length < 5) return null;

  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  const say = makePicker(rng);
  const beats = [];

  const shelf = Object.keys(BB_POWER_DEFINITIONS);
  const powerId = shelf.includes(offered) ? offered : shelf[Math.floor(rng() * shelf.length)];
  const def = BB_POWER_DEFINITIONS[powerId];

  const entrant = pickEntrant(room, rng);
  if (!entrant) return null;
  const pr = pronouns(entrant);

  beats.push(beat(say(OFFER)(entrant, pr, def.name), [entrant], 'THE DEN', 'gold'));

  const accepted = acceptRead(entrant, rng, { house: room, hoh: week?.hoh || null });

  if (!accepted) {
    beats.push(beat(say(DECLINE)(entrant, pr), [entrant], 'DECLINED', 'grey'));
    // Nobody will ever know they did this, which is exactly the point — the
    // house gets no curse and no explanation for why not.
    gs.popularity ||= {};
    gs.popularity[entrant] = (gs.popularity[entrant] || 0) + 1;
    return {
      type: 'temptation', week: weekNum, entrant, offered: powerId,
      power: def.name, accepted: false, curse: null, cursed: null,
      guesses: [], beats,
    };
  }

  grantPower(powerId, entrant, { week: weekNum, visibility: 'secret', source: 'bb-den-of-temptation' });
  beats.push(beat(say(ACCEPT)(entrant, pr), [entrant], 'ACCEPTED', 'red'));

  // ── the house pays, but not yet ──
  //
  // The victim is NOT drawn here. It is drawn at the nomination ceremony by
  // resolveCurse below, from houseguests who can actually be seated.
  //
  // Drawing it here was a real bug: the Den runs at week opening, the draw
  // included the Head of Household and anybody about to be safe, and when it
  // landed on one of them the chair could not be filled — so the act
  // announced "the curse lands on X, X must nominate themselves" and X was
  // then simply absent from the ceremony. A curse the viewer was promised and
  // never saw is worse than no curse.
  //
  // It is also how the show ran it: the temptation is taken on one night and
  // the cursed houseguest is revealed at the ceremony, which is a better beat
  // anyway — the house spends the gap knowing a curse is coming for somebody.
  const curse = TEMPTATION_CURSES['third-chair'];

  // ── and starts hunting ──
  //
  // Intuition-proportional and allowed to be wrong, which is the whole value:
  // the bond damage lands on the name they PICKED, not on the person who
  // actually did it. An innocent houseguest spends the week defending
  // something they had no part in.
  const guesses = [];
  const suspicious = [...room]
    .filter(n => n !== entrant)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)
    .slice(0, 3);
  for (const who of suspicious) {
    const st = pStats(who);
    const right = rng() < clamp(0.12 + st.intuition * 0.045, 0.1, 0.62);
    const others = room.filter(n => n !== who && n !== entrant);
    const guess = right ? entrant : (others[Math.floor(rng() * others.length)] || entrant);
    if (!guess) continue;
    guesses.push({ who, guess, correct: guess === entrant });
    beats.push(beat(say(SUSPECT)(who, guess), [who, guess], guess === entrant ? 'CLOSE' : 'WRONG NAME',
      guess === entrant ? 'gold' : 'grey'));
    addBond(who, guess, -1.1);
  }

  return {
    type: 'temptation', week: weekNum, entrant, offered: powerId,
    power: def.name, accepted: true,
    curse: { id: curse.id, name: curse.name, rule: curse.rule },
    cursed: null, cursePending: true, guesses, beats,
  };
}

/**
 * Draw the cursed houseguest and put them in the third chair.
 *
 * Called AT the nomination ceremony, and the eligibility list is the whole
 * point: the curse belongs to the HOUSE, not to one pre-selected person, so
 * if the first name drawn is wearing the key or is already safe the draw
 * simply goes to somebody who can actually sit down. That is the difference
 * between a curse that misses and a curse that lands somewhere else.
 *
 * Returns null only when literally nobody in the house can be seated — and
 * the caller must still say so out loud, because the Den already promised the
 * house a curse.
 */
export function resolveCurse({ week, house, protectedNames = [], rng = Math.random } = {}) {
  const t = week?.temptation;
  if (!t?.accepted || t.cursed) return null;
  const off = new Set([t.entrant, ...protectedNames].filter(Boolean));
  const eligible = (house || []).filter(n => n && !off.has(n));
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  const say = makePicker(rng);

  if (!eligible.length) {
    // Everybody left is safe. The curse has nowhere to go, and the house is
    // owed an explanation because it was told one was coming.
    t.curseMissed = true;
    return {
      type: 'temptation-curse', week: weekNum, cursed: null, missed: true,
      curse: t.curse,
      beats: [beat(
        'Big Brother calls the house in to name the cursed houseguest and then does not name one. Everybody still standing is protected by something, so the curse has nowhere to land — and somebody in that room is realising they took a temptation for free.',
        [], 'CURSE MISSES', 'grey')],
    };
  }

  // ── WHO PAYS, AND WHY IT IS NOT A NAME OUT OF A HAT ──
  //
  // A uniform draw made accepting free. The offer costs nothing, refusing
  // costs nothing, and the bill went to a stranger — so there was no decision
  // in it, only a dice roll somebody else lost. Weighted toward the people the
  // taker is CLOSEST to, accepting becomes a gamble with your own alliance:
  // most of the time the curse lands near you, and the person it seats is
  // somebody you needed.
  //
  // Proportional, and deliberately not deterministic. Always-the-closest-ally
  // would name the taker out loud — the room would read the block and know —
  // and nobody would ever accept again. A LEAN means the house's inference is
  // usually right and occasionally, expensively, wrong, which is the same
  // shape as every other read in this game.
  const _bondTo = n => { try { return getBond(t.entrant, n); } catch { return 0; } };
  const weights = eligible.map(n => 1 + Math.max(0, _bondTo(n)) * 0.4);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  let cursed = eligible[eligible.length - 1];
  for (let i = 0; i < eligible.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { cursed = eligible[i]; break; }
  }
  t.cursed = cursed;
  // What the room can actually see: the cursed and the taker were close.
  t.curseCloseness = Math.max(0, _bondTo(cursed));

  gs.popularity ||= {};
  gs.popularity[cursed] = (gs.popularity[cursed] || 0) + 2;
  // The suspicion the Den generated now has a second victim: the person who
  // is actually paying resents whoever the room decided was responsible.
  for (const g of t.guesses || []) {
    if (g.guess && g.guess !== cursed) addBond(cursed, g.guess, -0.6);
  }

  // ── AND NOW THE ROOM HAS SOMETHING TO READ ──
  //
  // The guesses made back in the Den were a dice roll against intuition that
  // looked at nothing that had happened — the house was suspicious on cue and
  // suspicious of nobody in particular. The curse leans toward the taker's own
  // people, so the block is EVIDENCE: whoever the cursed is closest to is
  // worth a hard look, and the sharpest person in the room is the one who
  // thinks of it.
  //
  // Read off PERCEIVED bonds, not real ones. The house infers from what it has
  // been allowed to see, which is exactly why it can be confidently wrong about
  // a pair that has been careful.
  const reader = (house || [])
    .filter(n => n !== cursed && n !== t.entrant)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  const inferenceBeats = [];
  if (reader) {
    const near = (house || [])
      .filter(n => n !== cursed && n !== reader)
      .sort((a, b) => getPerceivedBond(cursed, b) - getPerceivedBond(cursed, a))[0];
    if (near && getPerceivedBond(cursed, near) > 2) {
      const rightForTheRightReason = near === t.entrant;
      inferenceBeats.push(beat(
        `${reader} works the block backwards. Nobody put ${cursed} up, so the question is who benefits from ${cursed} being there — and the answer ${reader} keeps arriving at is ${near}, because they are the person ${cursed} has been closest to all week.`,
        [reader, near], rightForTheRightReason ? 'READS IT RIGHT' : 'READS IT WRONG',
        rightForTheRightReason ? 'gold' : 'grey'));
      addBond(reader, near, -0.8);
      t.inference = { reader, accused: near, correct: rightForTheRightReason };
    }
  }

  return {
    type: 'temptation-curse', week: weekNum, cursed, missed: false, curse: t.curse,
    inference: t.inference || null,
    beats: [beat(say(CURSED)(cursed, pronouns(cursed)), [cursed], 'CURSED', 'red'),
      ...inferenceBeats],
  };
}
