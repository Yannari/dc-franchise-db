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
import { clamp } from '../bb-comps/_shared.js';
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
  // BB19's second consequence: "Cody, Jason & Jessica will be dressed as
  // 'Ve-Toads' for the rest of the week" — frog suits, hopping only, lily pads
  // to stand on in every room.
  've-toads': {
    id: 've-toads',
    name: 'The Ve-Toads',
    rule: 'Three houseguests are Ve-Toads for the rest of the week: frog suits, they can only hop, and they may only stand or sit on the lily pads.',
  },
  // BB19's third: the Halting Hex let the Temptation Competition into the
  // house for three weeks. "The winner of the competition is safe for the
  // week while the houseguest that finishes last will go up as a third
  // nominee."
  'temptation-competition': {
    id: 'temptation-competition',
    name: 'The Temptation Competition',
    rule: 'For the next three weeks, anybody may opt in to a competition before the nominations. The winner is safe for the week; whoever finishes last is the third nominee.',
  },
});

/** Which consequence each of BB19's offers carried. Anything else curses a chair. */
const OFFER_CURSE = {
  'pendant-of-protection': 'third-chair',
  'ring-of-replacement': 've-toads',
  'halting-hex': 'temptation-competition',
};

// Beats are plain facts with a `part`; the words are written by
// bb/script/ceremony.js from lines/tempact.js.
const beat = (text, players, badgeText, badgeClass = 'twist', part = null, extra = {}) =>
  ({ type: 'temptation', text, players: [...players].filter(Boolean), badgeText, badgeClass, ...(part ? { part } : {}), ...extra });

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
 * Called at week opening, BEFORE nominations, because the curse has to name its
 * houseguest before the ceremony reads names out.
 *
 * It does not ADD a chair. The cursed houseguest fills a seat the Head of
 * Household would have filled — week.js takes one off `hohSeats` — so the block
 * is the size it always was and the HOH simply gets one fewer name on it. Said
 * here because "third chair" is what this said for months after it stopped
 * being true, and it is what the twist-compatibility tests went on asserting.
 */
export function runDenOfTemptation({ week = undefined, house = undefined, rng = Math.random, offered = 'random' } = {}) {
  const room = (house || []).filter(Boolean);
  // The curse needs somebody who is not the taker, and a house this small has
  // nobody spare to take the seat anyway.
  if (room.length < 5) return null;

  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  const say = () => rng();   // each beat's wording used to be one draw here; the draw stays
  const beats = [];

  const shelf = Object.keys(BB_POWER_DEFINITIONS);
  const powerId = shelf.includes(offered) ? offered : shelf[Math.floor(rng() * shelf.length)];
  const def = BB_POWER_DEFINITIONS[powerId];

  const entrant = pickEntrant(room, rng);
  if (!entrant) return null;
  say();
  beats.push(beat(`${entrant} is offered ${def.name} in the Den.`, [entrant], 'THE DEN', 'gold', 'offer', { power: def.name }));

  // BB19's three Den offers were all taken on the show; one of them refused is
  // the rare scene, not a coin flip that cancels the Temptation Competition.
  const accepted = acceptRead(entrant, rng, { house: room, hoh: week?.hoh || null })
    || (OFFER_CURSE[powerId] ? rng() < 0.7 : false);

  if (!accepted) {
    say();
    beats.push(beat(`${entrant} turns the temptation down.`, [entrant], 'DECLINED', 'grey', 'declined'));
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
  say();
  beats.push(beat(`${entrant} accepts the temptation.`, [entrant], 'ACCEPTED', 'red', 'accepted'));

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
  const curse = TEMPTATION_CURSES[OFFER_CURSE[powerId] || 'third-chair'];
  const epNow = (gs.episodeHistory?.length || 0) + 1;
  let vetoads = null;
  if (curse.id === 've-toads') {
    // Three, drawn from everybody but the taker, and the house is not told why it was them.
    const pool = room.filter(n => n !== entrant);
    vetoads = [];
    while (vetoads.length < 3 && pool.length) vetoads.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    for (const n of vetoads) {
      gs.popularity ||= {};
      gs.popularity[n] = (gs.popularity[n] || 0) + 0.8;   // the country loves a frog
    }
    (gs.bb ||= {}).vetoads = { week: weekNum, names: [...vetoads] };
    beats.push(beat(`${listOfNames(vetoads)} are Ve-Toads for the rest of the week.`, vetoads, 'VE-TOADS', 'green', 'toads'));
  }
  if (curse.id === 'temptation-competition') {
    (gs.bb ||= {}).temptationCompWeeks = [epNow + 1, epNow + 2, epNow + 3];
    beats.push(beat('The Temptation Competition is coming to the house for three weeks.', [entrant], 'THE CONSEQUENCE', 'red', 'tcomp'));
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
    say();
    beats.push(beat(`${who} suspects ${guess} took the temptation.`, [who, guess], guess === entrant ? 'CLOSE' : 'WRONG NAME',
      guess === entrant ? 'gold' : 'grey', 'suspect', { correct: guess === entrant }));
    addBond(who, guess, -1.1);
  }

  return {
    type: 'temptation', week: weekNum, entrant, offered: powerId,
    power: def.name, accepted: true,
    curse: { id: curse.id, name: curse.name, rule: curse.rule },
    // Only the chair waits for the nominations; the frogs and the competition land now.
    cursed: null, cursePending: curse.id === 'third-chair', vetoads, guesses, beats,
    // BB19's self-nomination was IN ADDITION to the Head of Household's two.
    curseAdds: curse.id === 'third-chair' && OFFER_CURSE[powerId] === 'third-chair',
  };
}

/**
 * BB19's Tree of Temptation (weeks 8 to 10). Five apples on a tree in the
 * house; before the nominations its lights turn red, and the first houseguest
 * to reach the Diary Room and claim one takes an apple without knowing which:
 * Save a Friend, Can't Play in the Next HOH, Bounty on Your Head (the Head of
 * Household is paid $5,000 if they evict the holder that week), Eliminate Two
 * Eviction Votes, or a Second Veto. Whatever it is, it is that week's only.
 * Nobody may take two. The real house mostly left it alone: one apple was
 * pulled in three weeks.
 */
export const TREE_APPLES = Object.freeze({
  'save-a-friend': { id: 'save-a-friend', name: 'Save a Friend', good: true },
  'no-hoh': { id: 'no-hoh', name: "Can't Play in the Next HOH", good: false },
  'bounty': { id: 'bounty', name: 'Bounty on Your Head', good: false },
  'minus-two': { id: 'minus-two', name: 'Eliminate Two Eviction Votes', good: true },
  'second-veto': { id: 'second-veto', name: 'A Second Veto', good: true },
});
export function runTreeOfTemptation({ week = undefined, house = undefined, hoh = undefined, rng = Math.random } = {}) {
  const b = (gs.bb ||= {});
  if (!b.treeApples) {
    const all = Object.keys(TREE_APPLES);
    b.treeApples = [];
    while (all.length) b.treeApples.push(all.splice(Math.floor(rng() * all.length), 1)[0]);
    b.treePicked = [];
  }
  const room = (house || []).filter(n => n && n !== hoh && !(b.treePicked || []).includes(n));
  const lean = n => {
    const st = pStats(n);
    const aimed = hoh && gs.intentions?.[hoh]?.targets?.includes?.(n) ? 0.12 : 0;
    return clamp(0.02 + st.boldness * 0.012 + aimed, 0.01, 0.3);
  };
  const runners = room.filter(n => rng() < lean(n));
  const base = { type: 'tree-of-temptation', week: Number(week?.num) || null, applesLeft: b.treeApples.length };
  if (!runners.length || !b.treeApples.length) {
    return { ...base, picker: null, apple: null,
      beats: [beat('The Tree of Temptation lights up red. Nobody goes near it.', [], 'THE TREE', 'grey', 'nobody')] };
  }
  const picker = runners.slice().sort((x, y) => pStats(y).physical - pStats(x).physical)[0];
  const apple = TREE_APPLES[b.treeApples.shift()];
  b.treePicked.push(picker);
  /** @type {Record<string, any>} */
  const out = { ...base, picker, apple: apple.id, appleName: apple.name, good: apple.good };
  if (apple.id === 'save-a-friend') {
    const friend = room.filter(n => n !== picker).sort((x, y) => { try { return getBond(picker, y) - getBond(picker, x); } catch { return 0; } })[0] || null;
    out.saved = friend;
    if (friend) try { addBond(friend, picker, 1.5); } catch { /* */ }
  }
  if (apple.id === 'no-hoh') b.barredFromHoh = { name: picker, week: (Number(week?.num) || 0) + 1 };
  gs.popularity ||= {};
  gs.popularity[picker] = (gs.popularity[picker] || 0) + (apple.good ? 0.5 : 1);
  out.beats = [beat(`${picker} reaches the Diary Room first and takes an apple from the Tree of Temptation: ${apple.name}.`, [picker, out.saved].filter(Boolean),
    apple.good ? 'A PRIZE' : 'A PUNISHMENT', apple.good ? 'gold' : 'red', 'apple')];
  return out;
}

const listOfNames = l => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);

/**
 * BB19's Temptation Competition, run before the nominations on the weeks the
 * Halting Hex unleashed it. Anybody but the Head of Household may opt in; the
 * winner is safe for the week and whoever finishes last is the third nominee.
 * Opting in is the gamble: the people who feel the week closing on them are
 * the ones who take it.
 */
export function runTemptationCompetition({ week = undefined, house = undefined, hoh = undefined, protectedNames = [], rng = Math.random } = {}) {
  const room = (house || []).filter(n => n && n !== hoh);
  const want = n => {
    const st = pStats(n);
    const aimed = hoh && gs.intentions?.[hoh]?.targets?.includes?.(n) ? 0.35 : 0;
    return clamp(0.25 + st.boldness * 0.04 + ((st.physical + st.mental) / 2) * 0.025 + aimed - (protectedNames.includes(n) ? 0.5 : 0), 0.05, 0.92);
  };
  const entrants = room.filter(n => rng() < want(n));
  if (entrants.length < 2) return null;
  const score = n => { const st = pStats(n); return st.physical * 0.35 + st.mental * 0.35 + st.endurance * 0.2 + rng() * 3.5; };
  const scores = Object.fromEntries(entrants.map(n => [n, Math.round(score(n) * 10) / 10]));
  const order = entrants.slice().sort((a, b) => scores[b] - scores[a]);
  const winner = order[0];
  const last = order[order.length - 1];
  gs.popularity ||= {};
  gs.popularity[winner] = (gs.popularity[winner] || 0) + 0.8;
  // which of the three it is: BB19 ran Bowlerina, then Strangest Things, then Where Were You?
  const nth = ((gs.bb ||= {}).temptationCompsRun = (gs.bb.temptationCompsRun || 0) + 1);
  return {
    type: 'temptation-competition', week: Number(week?.num) || null, nth, entrants, scores, order, winner, last,
    sitOut: room.filter(n => !entrants.includes(n)),
    beats: [beat(`${winner} wins the Temptation Competition and is safe for the week. ${last} finishes last and will be the third nominee.`, [winner, last], 'TEMPTATION COMPETITION', 'red', 'result')],
  };
}

/**
 * Draw the cursed houseguest and seat them.
 *
 * Into a chair the Head of Household then does not get to fill, not an extra
 * one — see runDenOfTemptation.
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
export function resolveCurse({ week = undefined, house = undefined, protectedNames = [], rng = Math.random } = {}) {
  const t = week?.temptation;
  // only the chair waits for the nominations: Ve-Toads and the Temptation Competition already landed
  if (!t?.accepted || t.cursed || t.cursePending === false) return null;
  const off = new Set([t.entrant, ...protectedNames].filter(Boolean));
  const eligible = (house || []).filter(n => n && !off.has(n));
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  const say = () => rng();   // the cursed beat's wording used to be one draw here; the draw stays

  if (!eligible.length) {
    // Everybody left is safe. The curse has nowhere to go, and the house is
    // owed an explanation because it was told one was coming.
    t.curseMissed = true;
    return {
      type: 'temptation-curse', week: weekNum, cursed: null, missed: true,
      curse: t.curse,
      beats: [beat('The curse has nowhere to land: everybody eligible is protected.', [t.entrant], 'CURSE MISSES', 'grey', 'missed')],
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
      inferenceBeats.push(beat(`${reader} decides ${near}, the person closest to ${cursed}, took the temptation.`,
        [reader, near, cursed], rightForTheRightReason ? 'READS IT RIGHT' : 'READS IT WRONG',
        rightForTheRightReason ? 'gold' : 'grey', 'reads', { correct: rightForTheRightReason }));
      addBond(reader, near, -0.8);
      t.inference = { reader, accused: near, correct: rightForTheRightReason };
    }
  }

  return {
    type: 'temptation-curse', week: weekNum, cursed, missed: false, curse: t.curse,
    inference: t.inference || null,
    beats: [(say(), beat(`${cursed} is cursed and must nominate themselves.`, [cursed], 'CURSED', 'red', 'cursed')),
      ...inferenceBeats],
  };
}
