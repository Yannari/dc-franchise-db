// ══════════════════════════════════════════════════════════════════════
// bb/camp-comeback.js — evicted, and still at the breakfast table
// ══════════════════════════════════════════════════════════════════════
//
// The show's cruellest twist and the only one that changes what an eviction
// IS. The first few houseguests voted out do not leave: they stay in the
// house, in a camper's uniform, sleeping in a room nobody wants, watching the
// competitions they cannot enter on a small television. They cannot compete,
// cannot vote and cannot be nominated. One of them earns their way back.
//
// So the house acquires something no other twist gives it: people with total
// information, no stake, and nothing left to lose, sitting in every
// conversation. A camper cannot be hurt by anything the house does, which
// makes them the only honest person in the building — and the most dangerous,
// because one of them is coming back.
//
// ── the design decision that keeps this safe ──
//
// A camper is NOT put back into the week's roster. `gs.activePlayers` stays
// exactly what it was, so nothing about competitions, nominations, the veto,
// the vote or the jury has to know this twist exists — which is the whole
// reason it can be added without touching twenty modules.
//
// Their presence is expressed through a dedicated event family that casts
// from `gs.bb.camp` directly (see bb-events/camp-comeback.js). The alternative
// — widening the house roster for social acts — would have let the general
// event pool cast a camper as a voter, a nominee or a veto player in
// narration, which is a much worse bug than the one it solves.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { aptitude, makePicker } from '../bb-comps/_shared.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

/** How many go to camp before the door opens. The show ran four. */
export const CAMP_SIZE = 4;

const store = () => { gs.bb ||= {}; gs.bb.camp ||= []; return gs.bb.camp; };

/** Everybody currently living in the house without a game to play. */
export const campers = () => store().filter(c => !c.returned && !c.gone).map(c => c.name);
/** Is this houseguest a camper right now? */
export const isCamper = name => campers().includes(name);

const ARRIVAL = [
  (n, p) => `${n} is voted out, hugs everybody, walks to the door — and is told to turn around. The camper's uniform is already folded on the bed.`,
  (n, p) => `The vote goes against ${n}, and then nothing happens. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} still here, still at the table, with no game left to play and nowhere to go.`,
  (n, p) => `${n} is evicted and stays evicted, in the house, in the room with the small television and the bad bed.`,
  (n, p) => `"You are not leaving." It sounds like mercy for about four seconds, and then ${n} works out what the rest of the week is going to be like.`,
];

/**
 * Send an evictee to camp instead of out of the house.
 *
 * @returns {object|null} the act, or null when camp is full or off
 */
export function sendToCamp({ week, evicted, house = [], rng = Math.random } = {}) {
  if (!evicted) return null;
  const camp = store();
  const living = campers();
  if (living.length >= CAMP_SIZE) return null;        // the door is already full

  camp.push({ name: evicted, week: week?.num || 0, returned: false, gone: false });
  const p = pronouns(evicted);
  const say = makePicker(rng);
  const beats = [beat(say(ARRIVAL)(evicted, p), [evicted], 'NOT LEAVING', 'red')];

  // Whoever voted them out has to keep living with them, which is the whole
  // twist in one sentence.
  const against = (week?.ballots || []).filter(b => b.evict === evicted)
    .map(b => b.voter).filter(n => house.includes(n));
  if (against.length) {
    beats.push(beat(
      `${against.slice(0, 3).join(', ')} voted ${evicted} out and will be eating breakfast with ${p.obj} tomorrow, `
        + 'and every morning after that, for as long as this lasts.',
      [evicted, ...against.slice(0, 3)], 'STILL AT THE TABLE', 'red'));
  }
  const full = campers().length >= CAMP_SIZE;
  return {
    type: 'camp-comeback', week: week?.num || 0, secret: false,
    arrival: evicted, camp: campers(), full, beats,
  };
}

const RETURN_MIX = { endurance: 0.32, mental: 0.26, physical: 0.24, temperament: 0.18 };

/**
 * The door opens once, and only one of them goes through it.
 *
 * Everybody in camp plays; the winner rejoins the game and the rest are gone
 * for good — which is the moment the twist stops being a mercy. Somebody who
 * has spent four weeks watching from a camp bed walks back into a house that
 * had already finished grieving them.
 *
 * @returns {object|null} the act, or null when camp is not full
 */
export function runCampComeback({ week, house = [], rng = Math.random } = {}) {
  const camp = store();
  const living = campers();
  if (living.length < CAMP_SIZE) return null;

  const runs = living.map(name => ({
    name, score: aptitude(name, RETURN_MIX) + (rng() - 0.5) * 5.2,
  })).sort((a, b) => b.score - a.score);
  const winner = runs[0].name;
  const beats = [beat(
    `The camp room opens and all ${living.length} of them are walked into the yard. Only one is walking back `
      + 'into the game, and every houseguest still playing has to stand there and watch which.',
    [...living], 'THE DOOR OPENS', 'gold')];

  for (const r of runs.slice(1)) {
    const p = pronouns(r.name);
    beats.push(beat(
      `${r.name} does not get there. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} been evicted twice now, `
        + 'which is a thing almost nobody in this game can say.',
      [r.name], 'GONE FOR GOOD', 'red'));
  }

  // Who in the house is least pleased about this, which is a real fact rather
  // than a mood: the person the returnee has the worst standing with.
  const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
  const enemy = [...house].filter(n => n !== winner)
    .sort((a, b) => bond(winner, a) - bond(winner, b))[0];
  beats.push(beat(
    `${winner} walks back in with four weeks of watching behind ${pronouns(winner).obj} — every conversation `
      + `the house had while it thought ${pronouns(winner).sub} could not hear${enemy ? `, including the ones ${enemy} had` : ''}.`,
    [winner, enemy].filter(Boolean), 'BACK IN, AND INFORMED', 'gold'));

  for (const c of camp) {
    if (c.returned || c.gone) continue;
    if (c.name === winner) c.returned = true; else c.gone = true;
  }

  return {
    type: 'camp-return', week: week?.num || 0, secret: false,
    played: [...living], winner,
    gone: living.filter(n => n !== winner), beats,
  };
}
