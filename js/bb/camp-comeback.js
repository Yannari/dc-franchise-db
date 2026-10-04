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
import { pStats } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { aptitude } from '../bb-comps/_shared.js';

// Beats are plain facts with a `part`; the words are written by
// bb/script/ceremony.js from lines/campact.js.
const beat = (text, players, badgeText, badgeClass = 'gold', part = null, extra = {}) =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass, ...(part ? { part } : {}), ...extra });

/** How many go to camp before the door opens. The show ran four. */
export const CAMP_SIZE = 4;

const store = () => { gs.bb ||= {}; gs.bb.camp ||= []; return gs.bb.camp; };

/** Everybody currently living in the house without a game to play. */
export const campers = () => store().filter(c => !c.returned && !c.gone).map(c => c.name);
/** Is this houseguest a camper right now? */
export const isCamper = name => campers().includes(name);


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
  const nth = campers().length;
  rng();   // the draw that used to pick this beat's wording
  const beats = [beat(`${evicted} is evicted but stays in the house, in camp (${nth} of ${CAMP_SIZE}).`,
    [evicted], 'NOT LEAVING', 'red', 'arrive', { nth })];

  // Whoever voted them out has to keep living with them, which is the whole
  // twist in one sentence.
  const against = (week?.ballots || []).filter(b => b.evict === evicted)
    .map(b => b.voter).filter(n => house.includes(n));
  // Not for the last camper: camp is full and the door opens tonight, so they
  // never have a breakfast with anybody.
  const full = campers().length >= CAMP_SIZE;
  if (against.length && !full) {
    beats.push(beat(`${against.slice(0, 3).join(', ')} voted ${evicted} out and still live with ${evicted}.`,
      [evicted, ...against.slice(0, 3)], 'STILL AT THE TABLE', 'red', 'voters'));
  }
  return {
    type: 'camp-comeback', week: week?.num || 0, secret: false,
    arrival: evicted, camp: campers(), nth, size: CAMP_SIZE, full, beats,
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
  const beats = [beat(`All ${living.length} campers play for one place back in the game.`,
    [...living], 'THE DOOR OPENS', 'gold', 'open')];

  // last place first, so the door closes on them one at a time
  for (const r of runs.slice(1).reverse()) {
    beats.push(beat(`${r.name} loses the return competition and leaves the house for good.`,
      [r.name], 'GONE FOR GOOD', 'red', 'out', { place: runs.indexOf(r) + 1 }));
  }

  // Who in the house is least pleased about this, which is a real fact rather
  // than a mood: the person the returnee has the worst standing with.
  const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
  const enemy = [...house].filter(n => n !== winner)
    .sort((a, b) => bond(winner, a) - bond(winner, b))[0];
  const since = camp.find(c => c.name === winner)?.week || 0;
  const weeks = Math.max(0, (week?.num || 0) - since);   // 0: sent to camp tonight
  beats.push(beat(weeks ? `${winner} wins and is back in the game after ${weeks} ${weeks === 1 ? 'week' : 'weeks'} in camp.`
    : `${winner} was sent to camp tonight, wins, and is straight back in the game.`,
    [winner, enemy].filter(Boolean), 'BACK IN, AND INFORMED', 'gold', 'back', { weeks }));

  for (const c of camp) {
    if (c.returned || c.gone) continue;
    if (c.name === winner) c.returned = true; else c.gone = true;
  }

  return {
    type: 'camp-return', week: week?.num || 0, secret: false,
    played: [...living], winner, order: runs.map(r => r.name),
    gone: living.filter(n => n !== winner), beats,
  };
}
