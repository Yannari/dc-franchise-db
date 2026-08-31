// Who a character IS, as fields rather than prose.
//
// The Casting Studio has always collected age and origin, and it folded them
// into a sentence at the front of the voice profile — `"21, Asian Canadian,
// lesbian. Twin sister of Harriett…"` — because the episode writer reads the
// voice profile and nothing else. That worked for writing and failed for
// everything else: you cannot ask a sentence who the youngest winner is.
//
// So the bio is structured here, and the sentence becomes a rendering of it.
//
// WHY ETHNICITY AND NATIONALITY ARE SEPARATE FIELDS. The old single `origin`
// box holds all of `Latino`, `Nigerian`, `Scouse`, `Asian Canadian` and
// `Mixed Mexican Canadian` — three different kinds of fact in one column. A
// trivia engine asking "first Asian winner" against that would match `Asian
// Canadian` and miss `Japanese`, or match both and be wrong about one.
//
// WHAT THIS MODULE WILL NOT DO IS GUESS. `Nigerian` is a nationality; it does
// not set ethnicity to Black, because the character's own record does not say
// so and a database that invents demographics about people is worse than one
// that leaves a field empty. Anything it cannot classify is preserved verbatim
// in `descriptor` rather than being dropped or forced into the wrong column —
// `Scouse` is a real thing to know about somebody and belongs to neither field.
//
// Pure: no DOM, no database, no gs.

/**
 * Ethnicity words the roster actually uses, plus the obvious siblings.
 *
 * Deliberately a vocabulary rather than a guess: a value is an ethnicity
 * because it appears here, not because a heuristic thought so.
 */
const ETHNICITY = [
  'black', 'white', 'asian', 'east asian', 'south asian', 'southeast asian',
  'latino', 'latina', 'latinx', 'hispanic', 'arab', 'middle eastern',
  'indigenous', 'native', 'pacific islander', 'mixed', 'biracial',
];

/**
 * Demonyms that name where somebody is FROM.
 *
 * Only what the roster uses today plus close neighbours. An unknown demonym is
 * not silently treated as a nationality — it goes to `descriptor`, where it can
 * be seen and promoted by hand.
 */
const NATIONALITY = [
  'canadian', 'american', 'british', 'english', 'scottish', 'welsh', 'irish',
  'japanese', 'chinese', 'korean', 'filipino', 'vietnamese', 'thai', 'indian',
  'pakistani', 'nigerian', 'kenyan', 'ghanaian', 'egyptian', 'moroccan',
  'brazilian', 'mexican', 'colombian', 'argentine', 'argentinian', 'peruvian',
  'puerto rican', 'cuban', 'dominican', 'jamaican', 'haitian', 'french',
  'german', 'italian', 'spanish', 'portuguese', 'dutch', 'polish', 'russian',
  'ukrainian', 'greek', 'turkish', 'israeli', 'lebanese', 'iranian', 'iraqi',
  'australian', 'new zealander', 'south african', 'ethiopian', 'somali',
];

/** Orientations the Studio offers, so a lead-in fragment can be recognised. */
const SEXUALITY = [
  'straight', 'gay', 'lesbian', 'bi', 'bisexual', 'pan', 'pansexual',
  'asexual', 'ace', 'queer', 'aromantic', 'demisexual',
];

const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Longest match wins, so "south asian" is not read as "asian". */
function matchFrom(vocab, value) {
  const v = norm(value);
  if (!v) return null;
  const hits = vocab.filter(w => v === w || v.startsWith(w + ' ') || v.endsWith(' ' + w));
  if (!hits.length) return null;
  return hits.sort((a, b) => b.length - a.length)[0];
}

/** Title Case, but leaving things like "Asian Canadian" intact. */
const titled = s => String(s || '').split(' ')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/**
 * Split one freeform origin phrase into the facts it contains.
 *
 * `"Asian Canadian"` is an ethnicity AND a nationality; `"Latino"` is only an
 * ethnicity; `"Scouse"` is neither and survives as a descriptor.
 */
export function splitOrigin(origin) {
  const out = { ethnicity: '', nationality: '', descriptor: '' };
  const raw = norm(origin);
  if (!raw) return out;

  const eth = matchFrom(ETHNICITY, raw);
  const nat = matchFrom(NATIONALITY, raw);
  if (eth) out.ethnicity = titled(eth);
  if (nat) out.nationality = titled(nat);

  // Whatever the two vocabularies did not account for is kept rather than lost.
  let rest = raw;
  for (const found of [eth, nat]) if (found) rest = rest.replace(found, ' ');
  rest = rest.replace(/\s+/g, ' ').trim();
  if (rest && !eth && !nat) out.descriptor = titled(rest);
  else if (rest) out.descriptor = titled(rest);
  return out;
}

/**
 * The lead-in the Studio has been writing since it gained the age box.
 *
 * The comma clause is OPTIONAL, because a character with an age and nothing
 * else renders as plain "24." — and a pattern demanding a comma would not
 * recognise it. That is not cosmetic: an unrecognised lead is one that does not
 * get stripped before the next save, which is precisely how profiles ended up
 * reading "24, Canadian. 24, Canada. Scarred, half-blind loner…".
 *
 * Three digits at most, so a year at the start of some prose is not mistaken
 * for an age.
 */
export const BIO_LEAD_RE = /^\s*(\d{1,3})(?:,([^.]{0,80}))?\.\s*/;

/**
 * Read a bio back out of a voice profile.
 *
 * This is how the 25 characters who already have one get their fields without
 * anybody retyping them. A profile with no lead-in returns empty fields and its
 * prose untouched — most of the roster is in that state and must stay readable.
 */
export function parseBio(voice) {
  const bio = {
    age: null, ethnicity: '', nationality: '', sexuality: '', descriptor: '',
    prose: String(voice || '').trim(),
  };
  const leftovers = [];

  // STACKED LEADS ARE REAL DATA, not a hypothetical. Avani ships as
  // "22. 22, straight. Soft, unhurried and spiritual…" — two lead-ins, because
  // an older save prepended one in front of another. Reading only the first
  // would take her age and leave "22, straight." sitting at the front of her
  // personality prose, where the episode writer would read it as character.
  //
  // So every layer is consumed and the first value found for each field wins.
  for (let depth = 0; depth < 6; depth++) {
    const m = bio.prose.match(BIO_LEAD_RE);
    if (!m) break;

    const age = Number(m[1]);
    if (bio.age == null && Number.isFinite(age)) bio.age = age;
    bio.prose = bio.prose.slice(m[0].length).trim();

    for (const part of (m[2] || '').split(',').map(x => x.trim()).filter(Boolean)) {
      const orientation = matchFrom(SEXUALITY, part);
      if (orientation && norm(part) === orientation) {
        if (!bio.sexuality) bio.sexuality = orientation;
        continue;
      }
      const split = splitOrigin(part);
      if (split.ethnicity && !bio.ethnicity) bio.ethnicity = split.ethnicity;
      if (split.nationality && !bio.nationality) bio.nationality = split.nationality;
      if (split.descriptor) leftovers.push(split.descriptor);
    }
  }

  if (leftovers.length) bio.descriptor = [...new Set(leftovers)].join(', ');
  return bio;
}

/**
 * Write the lead-in back.
 *
 * The episode writer reads the voice profile and nothing else, so the sentence
 * has to keep existing — it is now a RENDERING of the fields rather than the
 * only place they live. Order is fixed (age, ethnicity, nationality, other,
 * orientation) so re-saving a character never reshuffles their opening line.
 *
 * `straight` is omitted, matching what the Studio has always done: the lead-in
 * exists to tell the writer something it would not otherwise assume.
 */
/**
 * Ethnicity and nationality as ONE description, never the same word twice.
 *
 * Exported because this join existed in THREE places — here, the wiki infobox,
 * and the wiki bio line — and fixing only this one left Yul reading "Korean
 * Korean" on his own article. One rule, one home.
 */
export function joinOrigin(ethnicity, nationality) {
  const e = String(ethnicity || '').trim();
  const n = String(nationality || '').trim();
  if (!e) return n;
  if (!n) return e;
  const le = e.toLowerCase(), ln = n.toLowerCase();
  // Same word, or one already contains the other at a word boundary.
  if (le === ln) return e;
  if (ln.startsWith(le + ' ')) return n;
  if (le.startsWith(ln + ' ')) return e;
  return `${e} ${n}`;
}

export function composeBioLead({ age, ethnicity, nationality, sexuality, descriptor } = {}) {
  const bits = [];
  if (age) bits.push(String(age).trim());
  // "Asian Canadian" rather than "Asian, Canadian" — it is one description of a
  // person, and the comma made it read like two.
  //
  // Joined only when they are actually two words. Yul is ethnicity "Korean"
  // and nationality "Korean", and a plain join published him as "Korean
  // Korean." A nationality that already opens with the ethnicity ("Korean"
  // + "Korean American") says it once too, so the longer one wins.
  const origin = joinOrigin(ethnicity, nationality);
  if (origin) bits.push(origin);
  if (descriptor) bits.push(descriptor);
  if (sexuality && norm(sexuality) !== 'straight') bits.push(sexuality);
  return bits.length ? bits.join(', ') + '.' : '';
}

/** The full voice string: the lead-in, then the personality prose. */
export function composeVoice(bio, prose) {
  const lead = composeBioLead(bio);
  const body = String(prose || '').trim();
  return (lead && body) ? `${lead} ${body}` : (lead || body);
}

/**
 * Strip any lead-ins from prose.
 *
 * Loops because the text has doubled before: editing a character whose Studio
 * draft was missing loaded their voice back out of voice-profiles.json, which
 * already had a lead-in, and saving prepended another.
 */
export function stripBioLead(voice) {
  let out = String(voice || '').trim();
  for (let i = 0; i < 6; i++) {
    const m = out.match(BIO_LEAD_RE);
    if (!m) break;
    out = out.slice(m[0].length).trim();
  }
  return out;
}
