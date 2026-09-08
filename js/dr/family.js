// ══════════════════════════════════════════════════════════════════════
// dr/family.js — who was already related when they walked in
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────
//
// Drag is a family business and this show had no families in it. Every queen
// arrived a stranger, every bond started at zero, and the room on day one was
// twelve people who had never met — which is not what a cast is. Somebody is
// always somebody's drag daughter, two of them came up in the same bar, and
// the room knows both of those things before a challenge has been announced.
//
// ── ASSIGNED, NOT AUTHORED ────────────────────────────────────────────
//
// There are 194 people in the roster and NOT ONE of them carries a `drag`
// block — the craft stats are derived at runtime by `dragOf`. So authoring a
// family per player is not a small data job, it is a data job that would have
// to be redone for every future cast.
//
// Instead a family is DERIVED at cast time from what already exists: the age
// on the roster and the drag style `dragOf` gives her. A mother and daughter
// are two queens a generation apart doing the same kind of drag; sisters came
// up together; a house is three of them who share a scene. None of that needs
// a field nobody has filled in.
//
// ── WEIGHTED, NOT THRESHOLDED ─────────────────────────────────────────
//
// Which pairs are related is a weighted draw over every eligible pair, so a
// cast does not produce the same family every time it is used and a queen one
// year older is not suddenly somebody else's mother. The KIND of family — a
// line or a house — is decided by the age gap once the pair is chosen, which
// is narrative selection rather than a gameplay threshold.
//
// ── WHAT IT IS WORTH ──────────────────────────────────────────────────
//
// A starting bond, a shared name, and something for the room to know on day
// one. It is deliberately small in points and large in story: a family bond
// is +4, which is a warm acquaintance rather than an alliance, and everything
// after that has to be earned like anybody else's.

import { dragOf } from './queen.js';

/** How many families a season gets. Two is a thread; five is a soap. */
export const FAMILY_CAP = 2;

/** A family bond on day one. Warm, not an alliance. */
export const FAMILY_BOND = 4;

/** A generation. Below this the two of them are sisters, above it a line. */
const GENERATION = 9;

const ageOf = p => {
  const n = Number(p && p.age);
  return Number.isFinite(n) ? n : 27;
};

/**
 * House names, for a family that is a scene rather than a bloodline.
 *
 * Invented rather than real: this universe has no drag scene outside its own
 * shows, so a house cannot be named after one that exists.
 */
const HOUSE_WORDS = ['Static', 'Vellum', 'Harrow', 'Neon', 'Cinder', 'Marrow',
  'Halcyon', 'Vesper', 'Tinsel', 'Umbra', 'Riot', 'Saffron'];

/**
 * The surname a line shares.
 *
 * Taken from the elder queen when her name has one to give — a drag daughter
 * takes her mother's name and that is the whole point of the institution. A
 * single-word name gets a house instead, because "the House of Bowie" is a
 * real thing a queen would say and "Bowie Bowie" is not.
 */
function surnameOf(name) {
  const parts = String(name || '').trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

/**
 * How likely these two are to have known each other, before any draw.
 *
 * Style is the big term: drag families come out of a shared scene, so two
 * pageant queens are far likelier than a pageant queen and a club kid. Age
 * shapes what KIND of family rather than whether there is one, so it only
 * contributes a little here — enough that a cast of identical ages does not
 * produce a mother and daughter born the same year.
 */
function affinity(a, b) {
  const da = dragOf(a);
  const db = dragOf(b);
  const sameStyle = da.style === db.style ? 1 : 0;
  const gap = Math.abs(ageOf(a) - ageOf(b));
  // Either clearly a generation apart or clearly contemporaries. The muddle
  // in between — six or seven years — is the least likely to read as either.
  const shape = gap >= GENERATION ? 1 : gap <= 4 ? 0.9 : 0.35;
  return (0.15 + sameStyle * 0.85) * shape;
}

/**
 * Cast the season's families.
 *
 * Returns the families and the bonds to seed, and mutates nothing — the
 * caller decides whether to apply them, which keeps this testable and keeps
 * a headless season that does not want families from getting them.
 */
export function assignDragFamilies({ cast = [], rng = Math.random, cap = FAMILY_CAP } = {}) {
  const families = [];
  const bonds = [];
  const taken = new Set();
  if (cast.length < 4) return { families, bonds };

  // Every pair worth considering, best first, with the roll folded in so the
  // same cast does not produce the same family every season.
  const pairs = [];
  for (let i = 0; i < cast.length; i++) {
    for (let j = i + 1; j < cast.length; j++) {
      const w = affinity(cast[i], cast[j]);
      if (w <= 0.2) continue;
      pairs.push({ a: cast[i], b: cast[j], w: w * (0.5 + rng()) });
    }
  }
  pairs.sort((x, y) => y.w - x.w);

  let houses = 0;
  for (const { a, b } of pairs) {
    if (families.length >= cap) break;
    if (taken.has(a.name) || taken.has(b.name)) continue;

    const gap = Math.abs(ageOf(a) - ageOf(b));
    const [elder, younger] = ageOf(a) >= ageOf(b) ? [a, b] : [b, a];
    const surname = surnameOf(elder.name);

    if (gap >= GENERATION && surname) {
      /* A LINE. She took her mother's name, which is the institution working
         exactly as it does — and it is why this needs a surname to exist at
         all: without one there is nothing for the daughter to take. */
      families.push({
        id: `line:${younger.slug || younger.name}`,
        kind: 'line',
        name: `The House of ${surname}`,
        surname,
        members: [elder.name, younger.name],
        roles: { [elder.name]: 'mother', [younger.name]: 'daughter' },
      });
    } else {
      // A HOUSE. Contemporaries out of the same scene, or a pair a generation
      // apart whose elder has no name to hand down.
      const word = HOUSE_WORDS[(houses + Math.floor(rng() * HOUSE_WORDS.length))
        % HOUSE_WORDS.length];
      houses += 1;
      families.push({
        id: `house:${a.slug || a.name}`,
        kind: 'house',
        name: `The House of ${word}`,
        surname: null,
        members: [a.name, b.name],
        roles: { [a.name]: 'sister', [b.name]: 'sister' },
      });
    }
    taken.add(a.name);
    taken.add(b.name);
    bonds.push([a.name, b.name, FAMILY_BOND]);
  }

  return { families, bonds };
}

/** The family a queen belongs to, or null. */
export function familyOf(families, name) {
  return (families || []).find(f => f.members.includes(name)) || null;
}

/**
 * What these two are to each other, or null.
 *
 * Directional on purpose: `relation(f, 'Ivy', 'Coco')` is what COCO is to
 * IVY, so a card can say "her daughter" rather than "they are related".
 */
export function relation(families, a, b) {
  const f = familyOf(families, a);
  if (!f || !f.members.includes(b)) return null;
  const mine = f.roles[a];
  const theirs = f.roles[b];
  if (mine === 'mother' && theirs === 'daughter') return 'daughter';
  if (mine === 'daughter' && theirs === 'mother') return 'mother';
  return 'sister';
}

/**
 * WHO THE ROOM COULD WORK IT OUT ABOUT, AND WHO IT COULD NOT.
 *
 * A shared surname is a thing anybody can see on day one — two Deveraux
 * queens walk in and somebody asks before the door has closed. A house is
 * not: two club kids from the same bar look like two club kids, and the room
 * only finds out because one of them says so.
 *
 * That difference is worth keeping, because it is two different scenes. The
 * obvious one is a question asked in front of everybody; the other is a
 * confession, and a confession is worth more.
 */
export function familyIsObvious(family) {
  return !!(family && family.kind === 'line' && family.surname);
}

/**
 * A FAMILY IS A PRE-ALLIANCE AND NOT AN ALLIANCE.
 *
 * They arrived trusting each other, which is a head start nobody else has —
 * and it is a head start rather than a pact: it buys a warm bond, the benefit
 * of the doubt, and somebody to sit with, and it buys no votes, because there
 * are none, and no protection from the panel, which has never heard of any of
 * this.
 *
 * What it costs is the interesting half. Two queens in the same family in the
 * bottom two is the worst night either of them will have, and a mother
 * watching her daughter go home is a different exit from anybody else's.
 */
export function familyFacts(families, a, b) {
  const fam = familyOf(families, a);
  const rel = b ? relation(families, a, b) : null;
  return {
    inFamily: !!fam,
    familyName: fam ? fam.name : null,
    familyKind: fam ? fam.kind : null,
    familyRole: fam ? fam.roles[a] || null : null,
    familyObvious: familyIsObvious(fam),
    // What B is to A, from A's side: 'mother', 'daughter', 'sister' or null.
    relation: rel,
    sameFamily: !!rel,
  };
}
