// ══════════════════════════════════════════════════════════════════════
// ci/categories.js — the Circle's cast categories, filled like tribes
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "let me fill each part like we fill tribes in Total
// Drama: I put people from the roster in the cast"; "the categories are
// pre-established, I just fill them". A Circle season's tribes are these
// three, fixed: the cast form's dropdown and the Cast Room's columns are the
// Total Drama ones, filled with this list.
//
//   Day 1          plays from the first day
//   Newcomers      plays, arriving later
//   Catfish faces  does not play: a real character someone plays AS (ci-run.js
//                  facePersonas builds the persona from their profile)
export const CIRCLE_CATEGORIES = [
  { name: 'Day 1', color: '#3fd8ff', kind: 'starter' },
  { name: 'Newcomers', color: '#ffb347', kind: 'newcomer' },
  { name: 'Catfish faces', color: '#ff4fb4', kind: 'face' },
];
export const FACE_CATEGORY = 'Catfish faces';
const KIND = Object.fromEntries(CIRCLE_CATEGORIES.map(c => [c.name, c.kind]));
/** 'starter' | 'newcomer' | 'face' | null, from a cast member's category. */
export const categoryKind = tribe => KIND[tribe] || null;
export const isFace = p => categoryKind(p?.tribe) === 'face';

// Why a player plays as this person, from who they are to them (spec 4.2's
// reasons). A relative or a partner is family; anyone else, strategy.
const FAMILY_KIN = new Set(['twins', 'siblings', 'step-siblings', 'parent-child', 'grandparent', 'aunt-uncle', 'cousins',
  'in-laws', 'married', 'engaged', 'partners', 'dating']);
export const reasonFromKin = kin => (FAMILY_KIN.has(kin) ? 'family' : 'strategic');

// What the user calls each link (girlfriend, mother, friend...), as the
// Relationships tab's kinds. '' = a stranger or a celebrity: no row.
export const FACE_LINKS = [
  ['', 'A stranger / a celebrity'],
  ['dating', 'Girlfriend / boyfriend'], ['partners', 'Partner'], ['engaged', 'Fiancé(e)'], ['married', 'Wife / husband'],
  ['parent-child', 'Parent / child'], ['siblings', 'Brother / sister'], ['twins', 'Twin'], ['cousins', 'Cousin'],
  ['grandparent', 'Grandparent / grandchild'], ['aunt-uncle', 'Aunt / uncle'],
  ['best-friends', 'Best friend'], ['old-friends', 'Friend'], ['colleagues', 'Co-worker'], ['exes', 'Ex'],
];
