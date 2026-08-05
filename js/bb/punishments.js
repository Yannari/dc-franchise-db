// ══════════════════════════════════════════════════════════════════════
// bb/punishments.js — the costume is not a joke, it is a handicap
// ══════════════════════════════════════════════════════════════════════
//
// Every punishment this show has ever handed out looks like a gag and works
// like a tax. A houseguest in a full-body costume cannot have a quiet word in
// the storage room, cannot be taken seriously in a pitch, and spends every
// conversation being the thing in the costume rather than the person making
// the argument.
//
// So punishments here are not narration. Each one carries a `drag`, which is
// subtracted from that houseguest's persuasion everywhere the vote operation
// asks somebody to move — recruiting for a bloc and campaigning off the block
// both read it. A week in the Egg Detective suit measurably costs you votes,
// which is the only version of this worth simulating.
//
// The catalogue is the one the show actually used for the BB Time Capsule,
// plus slop, which is ours.
import { gs } from '../core.js';

/**
 * What a punishment does.
 *
 *   drag     subtracted from persuasion while it is live. 1.0 is roughly a
 *            third of an average houseguest's social contribution, so 1.6 is
 *            severe without being a mute button — an excellent player in a
 *            costume is still an excellent player, just a taxed one.
 *   weeks    how long it runs.
 *   tether   needs a second houseguest, tied to the first.
 *   slop     puts them on the Have-Not list for its duration.
 */
export const BB_PUNISHMENTS = {
  'egg-detective': {
    id: 'egg-detective', name: 'the Egg Detective costume', drag: 1.6, weeks: 1,
    blurb: 'A full-body egg suit with a detective hat, worn everywhere, at all times.',
    cost: 'Nobody has a serious conversation with an egg. Every pitch this week starts a foot behind.',
  },
  'red-unitard': {
    id: 'red-unitard', name: 'the red unitard', drag: 1.4, weeks: 1,
    blurb: 'The unitard. It has been in this house since long before any of them arrived.',
    cost: 'It is the oldest humiliation the show owns, and the house treats whoever is in it accordingly.',
  },
  'lord-of-the-latrine': {
    id: 'lord-of-the-latrine', name: 'Lord of the Latrine', drag: 1.2, weeks: 1,
    blurb: 'Robes, a crown, and the duty of announcing every single visit anybody makes to the bathroom.',
    cost: 'It is impossible to hold a private conversation when your job is to interrupt the house all day.',
  },
  'hamazon': {
    id: 'hamazon', name: 'Hamazon', drag: 0.9, weeks: 1,
    blurb: 'A siren goes off, ham arrives, and they have to eat it. Repeatedly. All week.',
    cost: 'Being summoned out of every room you are working is its own kind of tax.',
  },
  'camp-guide': {
    id: 'camp-guide', name: 'Camp Guide', drag: 1.3, weeks: 1,
    blurb: 'Build the camp. Take the camp down. Build the camp again, on the horn, whenever it sounds.',
    cost: 'Hours a day spent outside, alone, while the house decides things inside without them.',
  },
  'adam-and-eve': {
    id: 'adam-and-eve', name: 'Adam and Eve', drag: 1.5, weeks: 1, tether: true,
    blurb: 'Two houseguests, two costumes, and a tether between them they cannot take off.',
    cost: 'Neither of them can have a private conversation again until it comes off — including with each other.',
  },
  'slop': {
    id: 'slop', name: 'a week on slop', drag: 0.7, weeks: 1, slop: true,
    blurb: 'No costume. Just slop, for the week, in a house that eats in front of them.',
    cost: 'Quieter than the costumes and longer-lasting: hunger makes people short with each other.',
  },
};

const store = () => { gs.bb ||= {}; gs.bb.punishments ||= []; return gs.bb.punishments; };

/**
 * Hand one out.
 *
 * @returns {object|null} the live instance
 */
export function applyPunishment(name, punishmentId, { week = 1, partner = null } = {}) {
  const def = BB_PUNISHMENTS[punishmentId];
  if (!def || !name) return null;
  const inst = {
    id: punishmentId, name, partner: def.tether ? partner : null,
    fromWeek: week, untilWeek: week + (def.weeks || 1) - 1,
  };
  store().push(inst);
  return inst;
}

/** Everything being served this week. */
export function activePunishments(week) {
  return store().filter(p => p.fromWeek <= week && week <= p.untilWeek);
}

/** What this houseguest is wearing, or null. */
export function punishmentFor(name, week) {
  return activePunishments(week).find(p => p.name === name || p.partner === name) || null;
}

/**
 * How much harder it is to talk anybody into anything while wearing it.
 *
 * Read by BOTH persuasion sites in the vote operation. It is deliberately a
 * flat subtraction rather than a multiplier: a costume does not scale with how
 * good you are, it is a fixed weight everybody carries the same way, which is
 * why it hurts a strong social player more than a weak one in practice — they
 * had more to lose from the conversation going badly.
 */
export function socialDrag(name, week) {
  const p = punishmentFor(name, week);
  if (!p) return 0;
  const def = BB_PUNISHMENTS[p.id];
  if (!def) return 0;
  // The tethered partner carries it too — they are attached to the thing.
  return def.drag * (p.name === name ? 1 : 0.8);
}

/** Anybody on slop because of a punishment this week. */
export function punishedHaveNots(week) {
  return activePunishments(week)
    .filter(p => BB_PUNISHMENTS[p.id]?.slop)
    .map(p => p.name);
}
