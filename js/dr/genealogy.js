// ═══════════════════════════════════════════════════════════════════
// genealogy.js — every house the franchise has ever recorded, as one tree
// ═══════════════════════════════════════════════════════════════════
//
// A drag family is a fact about a QUEEN, not about a season. The woman who put
// you in your first pair of heels is still your drag mother three seasons
// later, and she is still your drag mother in a season she is not cast in.
// js/dr/family.js answers within one room; this answers across the franchise.
//
// TWO SOURCES, UNIONED.
//
//   the roster        — `drag.family = { mother, sisters[] }` on the character
//                       sheet, authored in the Studio. The master record: it
//                       covers queens who have never played a season and it is
//                       the same answer every season.
//   season documents  — `dr.families[].edges`, which is where houses the SHOW
//                       put together get recorded. A season can also break a
//                       family up, and the season it happened in still has it.
//
// Unions work because both sides are EDGES. The same mother recorded by the
// roster and by four seasons is one edge; two trees that disagreed could not
// be reconciled at all, which is the reason nothing here stores a tree.
//
// A NAME IS THE KEY. Not a slug and not a roster id: a drag mother who has
// never competed has neither, and she belongs in the tree anyway — leaving her
// out would break every line that runs through her and silently split one
// house into two.
import { dedupeEdges, familiesFromRelations, familyTree, relation } from './family.js';
import { DRAG_FORMAT } from '../shows.js';

/** Edges from the character sheets — including queens who never competed. */
export function rosterEdges(roster = []) {
  const out = [];
  for (const p of roster) {
    const fam = p && p.drag && p.drag.family;
    if (!fam || !p.name) continue;
    if (fam.mother && fam.mother !== p.name) out.push({ a: p.name, b: fam.mother, kind: 'mother' });
    for (const sis of fam.sisters || []) {
      if (sis && sis !== p.name) out.push({ a: p.name, b: sis, kind: 'sister' });
    }
  }
  return out;
}

/** Edges from every drag season document that recorded a house. */
export function seasonEdges(seasonDocs = []) {
  const out = [];
  for (const doc of seasonDocs) {
    if (!doc || (doc.format && doc.format !== DRAG_FORMAT)) continue;
    for (const f of doc.dr?.families || []) out.push(...(f.edges || []));
  }
  return out;
}

/**
 * The whole franchise as families.
 *
 * Everybody an edge names is a member, whether or not they are on the roster
 * and whether or not they have ever played — see the note above about why a
 * name is the key. `ages` lets a house be named after its head; without it the
 * naming falls back to the tree's own root, which is usually the same queen.
 */
export function franchiseFamilies({ roster = [], seasonDocs = [] } = {}) {
  const edges = dedupeEdges([...rosterEdges(roster), ...seasonEdges(seasonDocs)]);
  if (!edges.length) return [];
  const byName = new Map((roster || []).filter(p => p && p.name).map(p => [p.name, p]));
  // Everybody named by an edge, so a mother who never competed is still cast.
  const cast = [];
  const seen = new Set();
  for (const e of edges) {
    for (const n of [e.a, e.b]) {
      if (seen.has(n)) continue;
      seen.add(n);
      const row = byName.get(n);
      cast.push({ name: n, age: row?.age ?? 0, onRoster: !!row });
    }
  }
  return familiesFromRelations(cast, edges);
}

/**
 * One queen's family, seen FROM HER.
 *
 * Returns the house drawn as a tree — so the generations stay generations —
 * with each member additionally carrying what she is TO THE QUEEN ASKED
 * ABOUT: her grandmother, her cousin, her daughter. Both are needed and they
 * are different questions. The tree is the shape of the house; `toFocus` is
 * the sentence a reader wants on the row.
 */
export function genealogyFor(families, name) {
  const family = (families || []).find(f => f.members.includes(name));
  if (!family) return null;
  return {
    family,
    nodes: familyTree(families, family).map(n => ({
      ...n,
      focus: n.name === name,
      // Null for the queen herself: nobody is her own anything.
      toFocus: n.name === name ? null : relation(families, name, n.name),
    })),
  };
}

/** Every queen the genealogy knows, for a lookup box. */
export function genealogyIndex(families = []) {
  const out = [];
  for (const f of families) {
    for (const m of f.members) out.push({ name: m, family: f.name, familyId: f.id });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
