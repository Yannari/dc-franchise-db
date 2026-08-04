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
import { addBond } from '../bonds.js';
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
 * Proportional and never gated, but the stat that dominates is loyalty, which
 * is the only place in this engine where loyalty buys nothing and costs
 * something. Boldness and strategic play push towards yes; a hero or a
 * loyal-soldier has to talk themselves into it.
 */
function acceptRead(name, rng) {
  const st = pStats(name);
  const archetype = players.find(p => p.name === name)?.archetype;
  const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(archetype);
  const wicked = ['villain', 'mastermind', 'schemer'].includes(archetype);

  const pull = 0.42
    + st.boldness * 0.035
    + st.strategic * 0.028
    - st.loyalty * 0.055
    + (wicked ? 0.16 : 0)
    - (nice ? 0.14 : 0);
  return rng() < clamp(pull, 0.05, 0.94);
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

  const accepted = acceptRead(entrant, rng);

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

  // ── the house pays ──
  const curse = TEMPTATION_CURSES['third-chair'];
  const eligible = room.filter(n => n !== entrant);
  const cursed = eligible[Math.floor(rng() * eligible.length)] || null;
  if (cursed) {
    beats.push(beat(say(CURSED)(cursed, pronouns(cursed)), [cursed], 'CURSED', 'red'));
    gs.popularity ||= {};
    gs.popularity[cursed] = (gs.popularity[cursed] || 0) + 2;
  }

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
    if (cursed && cursed !== who) addBond(cursed, guess, -0.6);
  }

  return {
    type: 'temptation', week: weekNum, entrant, offered: powerId,
    power: def.name, accepted: true,
    curse: { id: curse.id, name: curse.name, rule: curse.rule },
    cursed, guesses, beats,
  };
}
