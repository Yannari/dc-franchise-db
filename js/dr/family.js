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

  /* A SHARED SURNAME IS AN AUTHOR TALKING. Names are entered by hand in the
     casting studio, so two queens called Deveraux are two queens somebody
     MEANT to be related — that is a stronger signal than any amount of style
     matching and it should not be possible for the draw to ignore it. It is
     not required, though: plenty of drag mothers and daughters do not share a
     name, and demanding one would refuse the most common real case. */
  const shared = surnameOf(a.name) && surnameOf(a.name) === surnameOf(b.name);
  if (shared) return 4;

  return (0.15 + sameStyle * 0.85) * shape;
}

/**
 * Cast the season's families.
 *
 * Returns the families and the bonds to seed, and mutates nothing — the
 * caller decides whether to apply them, which keeps this testable and keeps
 * a headless season that does not want families from getting them.
 */
/** The three relations anybody actually authors. Everything else is derived. */
export const AUTHORED_RELATIONS = ['mother', 'daughter', 'sister'];

/**
 * Families out of authored PAIRS.
 *
 * ── WHY PAIRS AND NOT A ROLE PER QUEEN ────────────────────────────────
 *
 * The first shape was `family: { name, role }` — one word per member — and it
 * cannot describe a family. Put Ivy, her sister Rita, and Ivy's two daughters
 * in one house and the roles read mother, sister, daughter, daughter: nothing
 * in that says Rita is IVY's sister rather than the girls', and nothing says
 * the two daughters are Ivy's rather than Rita's. It resolved Rita to nobody,
 * which is exactly right for the data and useless for the family.
 *
 * A relation is between two people, so it is stored between two people:
 *
 *   { a: 'Coco Deveraux', b: 'Ivy Deveraux', kind: 'mother' }
 *
 * reads "Ivy is Coco's mother", the same direction `relation(f, a, b)` answers
 * in. That is one row in an editable tab and it is unambiguous.
 *
 * Families are then the connected components of the graph — nobody has to
 * name a house for one to exist — and a component that shares a surname takes
 * it, which is what makes it visible from the door.
 */
/* ══════════════════════════════════════════════════════════════════════
   THE RELATIONSHIP TAB → EDGES
   ══════════════════════════════════════════════════════════════════════

   The cast builder's Relationships tab already carried both halves of this:
   `type` is how two queens FEEL about each other (which seeds a bond through
   initGameState, and always did work here) and `kin` is how they KNOW each
   other. A pair can be drag sisters and at war at the same time, which is the
   whole reason those are two fields and not one.

   What was missing is that no drag term existed on the kin axis and nothing
   read it. `drag-mother` / `drag-daughter` / `drag-sisters` are authored in
   the tab; this turns them into the edges the tree is built from.

   Direction is the only fiddly part, so it is stated once here: a tab row
   reads "A is B's mother", and an edge reads "b is a's mother". They are
   opposite ways round on purpose -- the tab is written from A, the resolver
   answers about B -- and this is the only place that has to know it. */
const KIN_EDGES = {
  // A is B's mother  →  B's mother is A
  'drag-mother': (a, b) => ({ a: b, b: a, kind: 'mother' }),
  // A is B's daughter  →  A's mother is B
  'drag-daughter': (a, b) => ({ a, b, kind: 'mother' }),
  'drag-sisters': (a, b) => ({ a, b, kind: 'sister' }),
};

/**
 * Authored edges out of the relationship list the cast builder saves.
 *
 * Everything that is not a drag term is dropped rather than guessed at: a pair
 * who are `best-friends` are close, and the bond already says so.
 */
export function dragRelationsFrom(relationships = []) {
  const out = [];
  for (const r of relationships || []) {
    const make = r && KIN_EDGES[r.kin];
    if (!make || !r.a || !r.b || r.a === r.b) continue;
    out.push(make(r.a, r.b));
  }
  return out;
}

export function familiesFromRelations(cast = [], relations = []) {
  const inCast = new Set(cast.map(p => p && p.name).filter(Boolean));
  const edges = [];
  for (const r of relations || []) {
    if (!r || !inCast.has(r.a) || !inCast.has(r.b) || r.a === r.b) continue;
    if (!AUTHORED_RELATIONS.includes(r.kind)) continue;
    edges.push(r);
  }
  if (!edges.length) return [];

  // Union-find over everybody an edge touches: a family is whoever is
  // connected, which means an author never has to name one.
  const up = new Map();
  const find = x => {
    while (up.get(x) !== x) { up.set(x, up.get(up.get(x))); x = up.get(x); }
    return x;
  };
  const join = (x, y) => {
    if (!up.has(x)) up.set(x, x);
    if (!up.has(y)) up.set(y, y);
    up.set(find(x), find(y));
  };
  for (const e of edges) join(e.a, e.b);

  const parents = {};
  const roles = {};
  for (const e of edges) {
    // "b is a's mother" puts a under b; "b is a's daughter" puts b under a.
    if (e.kind === 'mother') { parents[e.a] = e.b; roles[e.b] = 'mother'; roles[e.a] = roles[e.a] || 'daughter'; }
    if (e.kind === 'daughter') { parents[e.b] = e.a; roles[e.a] = 'mother'; roles[e.b] = roles[e.b] || 'daughter'; }
    if (e.kind === 'sister') {
      roles[e.a] = roles[e.a] || 'sister';
      roles[e.b] = roles[e.b] || 'sister';
    }
  }
  /* SISTERS NEED A COMMON ANCESTOR OR THEY ARE NOT MEASURABLE. The kinship
     walk works on distance to a shared node, so two sisters with no authored
     parent have nothing between them and resolve to nobody — and every term
     that runs THROUGH them dies with it: Rita cannot be Coco's aunt if Rita
     is not anybody's sister.
     So a sister edge slots into the tree: it takes whichever parent either of
     them already has, and invents one when neither does. The invented node is
     never a queen, appears in no member list and is named nothing — it exists
     only so that two sisters are one step from the same place. */
  let synthetic = 0;
  for (const e of edges) {
    if (e.kind !== 'sister') continue;
    const known = parents[e.a] || parents[e.b] || ` kin-${synthetic++}`;
    parents[e.a] = parents[e.a] || known;
    parents[e.b] = parents[e.b] || known;
  }

  const groups = new Map();
  for (const n of up.keys()) {
    const root = find(n);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(n);
  }

  const ageOfName = n => ageOf(cast.find(p => p.name === n));
  const out = [];
  for (const [root, members] of groups) {
    if (members.length < 2) continue;
    const surnames = members.map(surnameOf);
    const shared = surnames[0] && surnames.every(x => x === surnames[0]) ? surnames[0] : null;
    const elder = [...members].sort((x, y) => ageOfName(y) - ageOfName(x))[0];
    out.push({
      id: `authored:${String(root).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      kind: members.some(m => roles[m] === 'mother') ? 'line' : 'house',
      name: shared ? `The House of ${shared}` : `${elder}'s girls`,
      surname: shared,
      authored: true,
      members,
      roles: Object.fromEntries(members.map(m => [m, roles[m] || 'sister'])),
      // The tree itself, which is what the kinship walk reads.
      parents: Object.fromEntries(members.filter(m => parents[m]).map(m => [m, parents[m]])),
    });
  }
  return out;
}

/**
 * The older flat form, kept because a preset may still use it.
 *
 * `family: 'The Static Sisters'` on two queens is a house and needs nothing
 * else. It cannot describe a line with more than one generation in it — see
 * `familiesFromRelations` for why — so a `role` here is taken at face value
 * and nothing is inferred from it.
 */
export function familiesFromCast(cast = []) {
  const byName = new Map();
  for (const p of cast) {
    const raw = p && (p.family || p.dragFamily);
    if (!raw) continue;
    const name = typeof raw === 'string' ? raw : raw.name;
    if (!name) continue;
    const role = typeof raw === 'string' ? null : raw.role || null;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push({ name: p.name, role });
  }

  const out = [];
  for (const [name, members] of byName) {
    if (members.length < 2) continue;
    const roles = {};
    for (const m of members) roles[m.name] = m.role || 'sister';
    const mothers = members.filter(m => m.role === 'mother');
    const surnames = members.map(m => surnameOf(m.name));
    const shared = surnames[0] && surnames.every(x => x === surnames[0]) ? surnames[0] : null;
    const parents = {};
    // One mother is unambiguous; two are not, and guessing would invent a
    // family nobody authored.
    if (mothers.length === 1) {
      for (const m of members) if (m.role === 'daughter') parents[m.name] = mothers[0].name;
    }
    out.push({
      id: `authored:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      kind: mothers.length ? 'line' : 'house',
      name,
      surname: shared,
      authored: true,
      members: members.map(m => m.name),
      roles,
      parents,
    });
  }
  return out;
}

export function assignDragFamilies({
  cast = [], rng = Math.random, cap = FAMILY_CAP,
  // Authored pairs from the relationship tab. These outrank everything.
  relations = [],
} = {}) {
  /* Whatever the author entered, kept whole. Derivation only ever fills the
     space left over — it is the fallback for a cast nobody has annotated,
     which is most of the 194-player roster. */
  const authored = familiesFromRelations(cast, relations);
  const inAuthored = new Set(authored.flatMap(f => f.members));
  const families = [
    ...authored,
    // The flat form only covers queens the pairs did not already claim.
    ...familiesFromCast(cast).filter(f => !f.members.some(m => inAuthored.has(m))),
  ];
  const bonds = families.flatMap(f => {
    const out = [];
    for (let i = 0; i < f.members.length; i++) {
      for (let j = i + 1; j < f.members.length; j++) {
        out.push([f.members[i], f.members[j], FAMILY_BOND]);
      }
    }
    return out;
  });
  const taken = new Set(families.flatMap(f => f.members));
  if (cast.length < 4 || families.length >= cap) return { families, bonds };

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

    /* A LINE IS THE AGE GAP; THE NAME IS OPTIONAL AND IS THE GIVEAWAY.
       The first version named the family after the elder's surname whether or
       not the younger shared it, which produced the House of Sharpe with a
       daughter called Rae — a house whose daughter never took the name. The
       fix is not to demand the name: most drag mothers and daughters do not
       share one, and requiring it would refuse the common case.
       So the gap makes the line and the SHARED name makes it visible. Two
       queens called Deveraux are noticed from the door and asked about in
       front of everybody; a mother and daughter with different names have to
       tell people, which is the better scene anyway. */
    const shared = surname && surnameOf(younger.name) === surname;
    if (gap >= GENERATION) {
      families.push({
        id: `line:${younger.slug || younger.name}`,
        kind: 'line',
        // Named for the shared surname where there is one, and for the mother
        // where there is not — "Ivy's girls" is what the room would say.
        name: shared ? `The House of ${surname}` : `${elder.name}'s girls`,
        surname: shared ? surname : null,
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

/* ══════════════════════════════════════════════════════════════════════
   KINSHIP — a tree, not three words
   ══════════════════════════════════════════════════════════════════════

   `mother`, `daughter` and `sister` are the only relations anybody AUTHORS,
   because they are the only ones anybody thinks in: you know who your drag
   mother is and you know who your sisters are. Everything else in a family is
   implied by those and should not have to be typed — if Ivy is Coco's mother
   and Ivy has a drag sister, that sister is Coco's aunt whether anybody wrote
   it down or not.

   So the authored edges build a tree and the term is COMPUTED from it. Two
   numbers do all of it: how far up from A to the nearest common ancestor, and
   how far back down to B.

     up  down
      0    1   daughter          1    0   mother
      0    2   granddaughter     2    0   grandmother
      0    3   great-grand...    3    0   great-grandmother
      1    1   sister            2    2   cousin
      2    1   aunt              1    2   niece
      3    1   great-aunt        1    3   great-niece

   SIBLINGS GET A SYNTHETIC PARENT when they have no authored one, which is
   what turns a flat house into a tree the same walk can read. It is invisible
   — it has no name and appears in nothing — and without it two sisters have
   no common ancestor and the resolver has nothing to measure. */

const GREATS = ['', 'great-', 'great-great-'];

/** The authored edges, as a tree. Cheap enough to rebuild per lookup. */
function treeOf(families) {
  const parent = new Map();
  const sibs = new Map();
  let synth = 0;

  for (const f of families || []) {
    const roles = f.roles || {};
    const mothers = f.members.filter(m => roles[m] === 'mother');
    // An explicit `of` wins; otherwise a family's single mother is the parent
    // of everybody it lists as a daughter, which is the flat form still
    // meaning what an author expects it to mean.
    for (const m of f.members) {
      const of = (f.parents && f.parents[m]) || null;
      if (of) { parent.set(m, of); continue; }
      if (roles[m] === 'daughter' && mothers.length === 1) parent.set(m, mothers[0]);
    }
    // Sisters share a parent. If none of them has one, invent it.
    const sisters = f.members.filter(m => (roles[m] || 'sister') === 'sister');
    if (sisters.length > 1) {
      const known = sisters.map(x => parent.get(x)).find(Boolean);
      const key = known || `\u0000synthetic-${f.id}-${synth++}`;
      for (const x of sisters) if (!parent.has(x)) parent.set(x, key);
      sibs.set(f.id, sisters);
    }
  }
  return { parent, sibs };
}

/** Every ancestor of `n`, nearest first, with the distance to each. */
function chain(parent, n) {
  const out = new Map([[n, 0]]);
  let cur = n;
  let d = 0;
  const guard = new Set([n]);
  while (parent.has(cur)) {
    cur = parent.get(cur);
    d += 1;
    if (guard.has(cur)) break;      // an author can always draw a circle
    guard.add(cur);
    out.set(cur, d);
  }
  return out;
}

/**
 * What B is to A, or null.
 *
 * Directional on purpose: `relation(f, 'Ivy', 'Coco')` is what COCO is to
 * IVY, so a card can say "her daughter" rather than "they are related".
 */
export function relation(families, a, b) {
  if (!a || !b || a === b) return null;
  const { parent } = treeOf(families);
  const up = chain(parent, a);
  const down = chain(parent, b);

  let best = null;
  for (const [node, u] of up) {
    const d = down.get(node);
    if (d === undefined) continue;
    if (!best || u + d < best.u + best.d) best = { u, d };
  }
  if (!best) return null;

  const { u, d } = best;
  if (u === 0 && d === 0) return null;
  // Straight down the line: her daughter, her granddaughter.
  if (u === 0) return d === 1 ? 'daughter' : `${GREATS[Math.min(d - 2, 2)]}granddaughter`;
  // Straight up: her mother, her grandmother.
  if (d === 0) return u === 1 ? 'mother' : `${GREATS[Math.min(u - 2, 2)]}grandmother`;
  // Level with each other: sisters, then cousins.
  if (u === d) return u === 1 ? 'sister' : 'cousin';
  // Off to the side and up: her aunt, her great-aunt.
  if (d === 1) return `${GREATS[Math.min(u - 2, 2)]}aunt`;
  // Off to the side and down: her niece.
  if (u === 1) return `${GREATS[Math.min(d - 2, 2)]}niece`;
  // Anything further out is a cousin, which is what everybody calls it.
  return 'cousin';
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
  // The shared surname, and nothing else. A line without one looks like any
  // other two queens until somebody says otherwise.
  return !!(family && family.surname);
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
