// ══════════════════════════════════════════════════════════════════════
// ss/tells.js — a tell, said after a name
// ══════════════════════════════════════════════════════════════════════
//
// A secret's tells (js/ss/secret-pool.js) are written to follow a name: "goes quiet when anybody talks about famous
// families". Some are verb phrases and some are not ("completely fearless with the house's animals", "very good at
// something nobody asked them to do"), and they say "their" and "them" for anybody. Said after a real name, a tell
// gets its verb and that person's pronouns (the user, 2026-10-29: "we need writing fluent, with good English").

const MODAL = new Set(['can', 'could', 'will', 'would', 'cannot', "can't", "won't"]);
const ADV = new Set(['always', 'never', 'often', 'suddenly', 'really', 'oddly', 'strangely', 'weirdly', 'still', 'quietly', 'secretly', 'sometimes', 'just']);
// a third-person verb ("goes", "keeps", "spells"), not a word that only ends in an s ("fearless", "nervous", "famous")
const verb = w => /^[a-z]+s$/i.test(w || '') && !/(ss|ous|us|is)$/i.test(w);

/**
 * The tell as a predicate after `name`: "Millie is completely fearless with the house's animals", "Gwen spells words
 * out under her breath". `pr`: { sub, obj, posAdj, ref } (players.js pronouns), when known.
 */
export function tellAfter(tell, pr = null) {
  let t = String(tell || '').trim().replace(/[.\s]+$/, '');
  if (!t) return t;
  const [w0, w1] = t.split(/\s+/);
  if (!(verb(w0) || MODAL.has(w0.toLowerCase()) || (ADV.has(w0.toLowerCase()) && verb(w1)))) t = `is ${t}`;
  if (pr) {
    t = t.replace(/\btheir\b/g, pr.posAdj || 'their').replace(/\bthemselves\b/g, pr.ref || 'themselves').replace(/\bthem\b/g, pr.obj || 'them');
  }
  return t;
}
