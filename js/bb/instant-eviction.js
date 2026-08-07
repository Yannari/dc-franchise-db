// ══════════════════════════════════════════════════════════════════════
// bb/instant-eviction.js — the twist is the sequestration, not the missing veto
// ══════════════════════════════════════════════════════════════════════
//
// The catalogue had this as `rules: { vetoCount: 0 }` and nothing else, which
// is the one part of it the wiki treats as incidental: "there is no Power of
// Veto competition, and one of the nominees is evicted as usual." The sentence
// before that is the twist:
//
//   "The newly crowned Head of Household is SEQUESTERED, where they must make
//   their nominations WITHOUT SPEAKING TO ANY of their fellow houseguests."
//
// Every instance on the page turns on that and not on the veto:
//
//   • BBCAN1 — Topaz got a few minutes in the HOH room, said her thinking OUT
//     LOUD, and did not know the house was watching her do it on the screen
//     downstairs. She nominated to target Andrew. AJ went home.
//   • BBCAN3 — Kevin got five minutes in the Vault, nominated Naeha and
//     Brittnee, came back down, was talked round within the hour, and could not
//     change a thing. Naeha went home anyway.
//   • BBCAN2 — Neda was blindfolded into a secret room with three silent spy
//     screens and nominated the following day.
//   • BBCAN9 — the competition itself decided the nominations.
//
// So what this module models is INFORMATION, not scheduling. An ordinary Head
// of Household nominates after a day of people coming to the room to explain
// why it should be somebody else; a sequestered one nominates on what they knew
// before they won, and then has to live in the house with what they got wrong.
import { gs, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { rememberStrategy } from '../strategy-memory.js';

const P = name => { try { return pronouns(name); } catch { return { sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They' }; } };
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;
const round2 = v => Math.round(v * 100) / 100;

/**
 * Where they were put, and for how long.
 *
 * Straight off the page — the four rooms it has actually happened in, with the
 * time each of them got. The variant decides how much the house sees.
 */
const ROOMS = [
  { id: 'hoh-room', where: 'the Head of Household room', minutes: 6, watched: true,
    how: 'The door is locked from the outside and the screen downstairs is left on.' },
  { id: 'vault', where: 'the Vault', minutes: 5, watched: false,
    how: 'Five minutes, a locked door and no way to ask anybody anything.' },
  { id: 'war-room', where: 'a room nobody knew was there', minutes: 0, watched: false,
    how: 'Blindfolded on the way in, three screens with no sound, and the whole night to look at them.' },
  { id: 'sequestered', where: 'the storeroom', minutes: 8, watched: false,
    how: 'Eight minutes and a chair, with the rest of the house on the other side of the door.' },
];

/**
 * Lock the Head of Household away before they can be talked to.
 *
 * Called the moment the crown lands and before nominations are decided. What it
 * returns is the record; what it CHANGES is on the week — `sequestered` is read
 * by the nomination path to cut the conversations off.
 */
export function sequesterHoh(week, house, rng = Math.random) {
  const hoh = week?.hoh;
  if (!hoh || !house?.length) return null;
  const room = ROOMS[Math.floor(rng() * ROOMS.length)];

  // What they walk in there believing. Frozen now, because in ninety seconds
  // nobody is going to be able to tell them any different — and this is the
  // whole difference between an instant eviction and a Thursday.
  const reads = Object.fromEntries(house.filter(n => n !== hoh)
    .map(n => [n, round2(getBond(hoh, n))]));

  week.sequestered = {
    hoh, room: room.id, where: room.where, minutes: room.minutes,
    // The War Room version is overnight rather than a countdown, and printing
    // "0 minutes" is how that reads if nothing says so.
    clock: room.minutes ? `${room.minutes} minutes` : 'overnight',
    watched: room.watched, how: room.how, reads,
  };
  return week.sequestered;
}

const THINKING = [
  (h, a, b) => `"It has to be ${a}. ${a} and — I don't know. ${b}? ${b} has not done anything to me `
    + `but I am not sitting ${a} up there on ${P(a).posAdj} own."`,
  (h, a, b) => `"Everyone is going to be angry about this and I do not have time to be careful, so: ${a}. `
    + `And ${b}, because ${b} will understand it afterwards."`,
  (h, a, b) => `"${a}. It was always going to be ${a}. The other one is the problem." ${h} says two more `
    + `names out loud and talks ${P(h).obj}self out of both of them before settling on ${b}.`,
];

/**
 * The house watching them decide.
 *
 * Topaz's version, and the best thing on the page: she reasoned out loud in a
 * locked room with the television on downstairs, and the entire house sat and
 * listened to exactly who she was going to put up and why. It costs her every
 * private reason she had.
 */
export function leakDeliberation(week, house, plan, rng = Math.random) {
  const seq = week?.sequestered;
  if (!seq || !seq.watched) return null;
  const hoh = seq.hoh;
  const [a, b] = (plan?.nominees || week?.initialNominees || []).filter(n => n && n !== hoh);
  if (!a) return null;

  const heard = house.filter(n => n !== hoh);
  // Everybody hears it, and the two people in it hear it worst.
  for (const n of heard) {
    try { addBond(n, hoh, n === a || n === b ? -1.8 : -0.5); } catch { /* nothing to lose */ }
  }
  for (const n of [a, b].filter(Boolean)) {
    try {
      rememberStrategy(n, hoh, 'said-it-out-loud', week.num, 2,
        { format: 'big-brother', twist: 'bb-instant-eviction' });
    } catch { /* the grudge stands */ }
  }
  return {
    hoh, overheard: [a, b].filter(Boolean),
    text: `${hoh} talks it through out loud, alone, the way anybody would in a locked room. `
      + `The screen in the living room is still on. `
      + THINKING[Math.floor(rng() * THINKING.length)](hoh, a, b || a),
    reaction: `${(b ? [a, b] : [a]).join(' and ')} ${b ? 'hear' : 'hears'} every word of it, `
      + `along with everybody else, and ${hoh} comes back down not knowing that.`,
  };
}

/**
 * What they would have done if anybody had been allowed to talk to them.
 *
 * Kevin's version: nominated in five minutes, came back down, was talked round
 * inside an hour and could not change a thing. Measured rather than asserted —
 * the informed choice is recomputed from what the house ACTUALLY thinks now,
 * and if it differs from what they locked in, that gap is the twist doing its
 * job and it costs them.
 */
export function sequesterRegret(week, house, rng = Math.random) {
  const seq = week?.sequestered;
  const locked = (week?.initialNominees || []).filter(Boolean);
  if (!seq || locked.length < 2) return null;
  const hoh = seq.hoh;
  const others = house.filter(n => n !== hoh);
  if (others.length < 3) return null;

  // Who the room would have pointed them at, given the chance. Threat as the
  // house reads it now — not as the Head of Household read it before the
  // competition, which is the only information they were allowed.
  const pressure = name => others.reduce((sum, n) =>
    sum + (n === name ? 0 : Math.max(0, -getBond(n, name))), 0)
    + stat(name, 'strategic') * 0.4 + stat(name, 'social') * 0.3;
  const shouldHave = [...others].sort((a, b) => pressure(b) - pressure(a))[0];
  if (!shouldHave || locked.includes(shouldHave)) return null;

  // Only when the room is CLEARLY pointing somewhere else. Any nomination is
  // second-best to somebody, and firing on that gave thirteen weeks of regret
  // out of fourteen — which is not a twist landing, it is a Head of Household
  // who is always wrong. The gap has to be big enough that a houseguest would
  // actually walk up and say it, and even then it does not always get said.
  const best = Math.max(...locked.map(pressure));
  if (pressure(shouldHave) < best * 1.35) return null;
  if (rng() > 0.62) return null;

  // They find out within the hour, and there is nothing to be done about it.
  const p = P(hoh);
  const missed = shouldHave;
  try { addBond(hoh, missed, -0.6); } catch { /* fine */ }
  return {
    hoh, locked: [...locked], missed,
    text: `${hoh} is back downstairs for under an hour before the first person explains, kindly, `
      + `why it should have been ${missed}. The second person says the same thing. So does the third.`,
    cost: `There is no veto and no ceremony to change anything at. ${p.Sub} nominated `
      + `${locked.join(' and ')} on what ${p.sub} knew at the top of the stairs, and ${missed} `
      + `spends this week entirely safe because of it.`,
  };
}
