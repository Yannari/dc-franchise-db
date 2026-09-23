// js/social/packs/index.js
// Which shows bring their own game layer to the social feed.
//
// A PACK is one show's answer to "what does its fandom talk about": the events a
// night of that show produces, the topics those events start, the lines the
// topics are argued in, the regulars doing the arguing and what the alumni
// hosts say about it. A show with no pack is fed by the shared library in
// topics.js / phrasings.js / personas.js / voices.js / chat.js exactly as it
// always was — that library is written for shows decided by a vote, which is
// what Total Drama and Big Brother are.
//
// A show with a pack keeps the shared FANDOM topics (thirst, shipping, the
// edit, the pile-on — `layer: 'fandom'` in topics.js) and replaces every game
// topic with its own. A castle has no jury verdict to argue about and a runway
// has no blindside; the words were never the problem, the subjects were.
//
// Listed, not keyed by slug: each pack names its own format off the registry,
// so adding a show is one import and one array entry here and nothing else in
// the feed branches on which show it is.
import traitorsPack from './traitors.js';
import dragRacePack from './drag-race.js';
import perfectMatchPack from './perfect-match.js';

const PACKS = [traitorsPack, dragRacePack, perfectMatchPack];

/** The pack for a format, or null when the shared library serves it. */
export function packFor(format) {
  if (!format) return null;
  return PACKS.find(p => p.format === format) || null;
}

/** Every pack, for the contract guard. */
export function allPacks() {
  return [...PACKS];
}
