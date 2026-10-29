// ══════════════════════════════════════════════════════════════════════
// ss/duos.js — the secrets two people keep together
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "couple secrets are one of the most common; the struggle to hide your relationship to
// protect your secret is one of the most common storylines". A real tie between two housemates, invented for the
// season when the roster has none: a couple, a family, two friends. One secret, kept by both (`pair` on each entry,
// as the roster's real ties already are: js/ss/casting.js historySecretOptions). The week of hiding it is
// js/ss/couples.js.

/** The shared secrets. `rel`: what the two are to each other (romance needs two who could be a couple). */
export const DUO_POOL = [
  { id: 'duo-couple', rel: 'romance', text: 'We are a couple', clues: ['two toothbrushes in one cup', 'a photo of two people on a beach, faces cut out', 'the word "us"'],
    tells: ['keeps finding a reason to be near {other}', 'goes quiet when {other} flirts with somebody else'], difficulty: 0.55 },
  { id: 'duo-married', rel: 'romance', text: 'We are married', clues: ['two rings on one chain', 'a wedding invitation with the names torn off', 'the word "forever"'],
    tells: ['finishes {other}\'s sentences', 'knows exactly how {other} takes their coffee'], difficulty: 0.55 },
  { id: 'duo-engaged', rel: 'romance', text: 'We are engaged', clues: ['a ring box, empty', 'a wedding magazine with one page folded', 'the word "yes"'],
    tells: ['looks at {other}\'s left hand when nobody is watching'], difficulty: 0.55 },
  { id: 'duo-exes', rel: 'romance', text: 'We used to be together', clues: ['a heart cut in two', 'an old cinema ticket for two', 'the word "before"'],
    tells: ['knows things about {other} nobody told them in here', 'avoids being alone in a room with {other}'], difficulty: 0.6 },
  { id: 'duo-siblings', rel: 'family', text: 'We are brother and sister', clues: ['two halves of one photo', 'a family tree with two branches circled', 'the word "blood"'],
    tells: ['defends {other} far too quickly', 'has the same laugh as {other}'], difficulty: 0.55 },
  { id: 'duo-cousins', rel: 'family', text: 'We are cousins', clues: ['a family reunion photo', 'two names on one birthday card', 'the word "family"'],
    tells: ['tells a childhood story and stops halfway, looking at {other}'], difficulty: 0.6 },
  { id: 'duo-best-friends', rel: 'friends', text: 'We are best friends', clues: ['two halves of a friendship bracelet', 'a holiday photo of two people', 'the word "always"'],
    tells: ['laughs at {other}\'s jokes before they are finished'], difficulty: 0.6 },
  { id: 'duo-childhood', rel: 'friends', text: 'We grew up together', clues: ['a school photo with two faces circled', 'a skipping rope', 'the word "street"'],
    tells: ['knows the name of {other}\'s first pet', 'calls {other} by a nickname and corrects it'], difficulty: 0.6 },
  { id: 'duo-colleagues', rel: 'friends', text: 'We work together', clues: ['two identical name badges, names scratched off', 'a staff rota', 'the word "shift"'],
    tells: ['knows how {other} acts with customers'], difficulty: 0.6 },
  { id: 'duo-neighbours', rel: 'friends', text: 'We are neighbours', clues: ['a spare key with a tag', 'a borrowed cup with someone else\'s name', 'the word "next door"'],
    tells: ['knows what {other} has for breakfast'], difficulty: 0.6 },
];

/** What a duo is to each other, from its entry (or an old save's words). */
export function duoRel(e) {
  if (e?.rel) return e.rel;
  const t = String(e?.text || '');
  if (/couple|married|engaged|together|dating|wedding|husband|wife|girlfriend|boyfriend/i.test(t) && !/grew up together/i.test(t)) return 'romance';
  if (/brother|sister|sibling|cousin|twin|parent|child|family|mother|father|son|daughter/i.test(t)) return 'family';
  return 'friends';
}

// a family secret worded for the two who keep it
const siblingsText = (ga, gb) => (ga === 'm' && gb === 'm' ? 'We are brothers' : ga === 'f' && gb === 'f' ? 'We are sisters' : 'We are brother and sister');

/**
 * The cast entries for a duo secret: one secret, kept by both, as the season stores a real tie.
 * `def` a DUO_POOL entry, or `{ text, rel }` for one the user wrote. a, b: players (or names).
 */
export function duoSecret(def, a, b) {
  const na = typeof a === 'string' ? a : a?.name, nb = typeof b === 'string' ? b : b?.name;
  if (!def?.text || !na || !nb || na === nb) return null;
  const text = def.id === 'duo-siblings' ? siblingsText(a?.gender, b?.gender) : def.text;
  const rel = def.rel || duoRel(def);
  const one = (me, other) => ({ source: def.id ? 'chosen' : 'own', id: def.id || null, kind: rel === 'romance' ? 'love' : 'family', rel, text, pair: other,
    clues: [...(def.clues || ['two halves of one photo', 'the word "together"'])], tells: (def.tells || ['keeps finding a reason to be near {other}']).map(t => t.replace(/\{other\}/g, other)),
    difficulty: Number(def.difficulty) || 0.55 });
  return { [na]: one(na, nb), [nb]: one(nb, na) };
}

/**
 * A duo drawn for this cast: `rel` romance (only two who could be a couple: `compat`), family or friends.
 * Returns { def, a, b } (players) or null.
 */
export function drawDuo(cast = [], { rng = Math.random, compat = () => true, rel = 'romance', avoid = new Set() } = {}) {
  const free = cast.filter(p => p?.name && !avoid.has(p.name));
  const defs = DUO_POOL.filter(d => d.rel === rel);
  if (!defs.length || free.length < 2) return null;
  const pairs = [];
  for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
    const [a, b] = [free[i], free[j]];
    if (rel === 'romance' && !(compat(a.name, b.name) && compat(b.name, a.name))) continue;
    pairs.push([a, b]);
  }
  if (!pairs.length) return null;
  const [a, b] = pairs[Math.floor(rng() * pairs.length) % pairs.length];
  const def = defs[Math.floor(rng() * defs.length) % defs.length];
  return { def, a, b };
}
