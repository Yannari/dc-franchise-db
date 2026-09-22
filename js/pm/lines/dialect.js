// pm/lines/dialect.js — how each islander says the words that change with
// where they are from. Data only.
//
// A spoken line writes a slot, `{~mate}`, and the SPEAKER's dialect fills it:
// an American and a Scot in one scene each sound like themselves. `{~Mate}`
// is the same slot, capitalised. Slots are for spoken turns only; staging and
// beats are narration and stay neutral (tests/pm-lines.test.js).
//
// A dialect only lists the words where it differs: anything it leaves out
// comes from its `base` (Scotland from the UK, Canada from the US, New Zealand
// from Australia), so adding a region is a few words, not a whole table.
//
// A word that has no honest swap (an idiom that only works in one country)
// gets a variant reply keyed on `dialect` instead of a slot.

export const DIALECTS = {
  uk:      { label: 'UK' },
  scot:    { label: 'Scotland',      base: 'uk' },
  geordie: { label: 'Newcastle',     base: 'uk' },
  essex:   { label: 'Essex',         base: 'uk' },
  ie:      { label: 'Ireland',       base: 'uk' },
  za:      { label: 'South Africa',  base: 'uk' },
  us:      { label: 'US' },
  ca:      { label: 'Canada',        base: 'us' },
  au:      { label: 'Australia',     base: 'uk' },
  nz:      { label: 'New Zealand',   base: 'au' },
  // English as a second language. Plain words in every slot (base `esl`), the
  // odd word of their own at the start of a line, fewer contractions — and
  // never broken grammar, which on a screen reads as mockery, not character.
  esl:     { label: 'Second language', esl: true },
  es:      { label: 'Spain',   base: 'esl', esl: true, own: ['Vale,', 'Bueno,', 'Madre mía,'] },
  it:      { label: 'Italy',   base: 'esl', esl: true, own: ['Allora,', 'Dai,', 'Mamma mia,'] },
  fr:      { label: 'France',  base: 'esl', esl: true, own: ['Bon,', 'Enfin,', 'Oh là là,'] },
  br:      { label: 'Brazil',  base: 'esl', esl: true, own: ['Nossa,', 'Então,', 'Gente,'] },
  de:      { label: 'Germany', base: 'esl', esl: true, own: ['Mensch,', 'Na ja,', 'Ach,'] },
};

export const SLOTS = {
  // said TO someone
  mate:        { uk: 'mate', scot: 'pal', essex: 'bruv', ie: 'lad', za: 'bru', us: 'man', ca: 'buddy', nz: 'bro', esl: 'my friend' },
  // a friend, the noun
  'a-mate':    { uk: 'mate', scot: 'pal', geordie: 'marra', ie: 'pal', us: 'friend', ca: 'buddy', esl: 'friend' },
  lads:        { uk: 'the lads', scot: 'the boys', essex: 'the boys', za: 'the okes', us: 'the guys', au: 'the boys', esl: 'the boys' },
  lad:         { uk: 'lad', scot: 'boy', essex: 'geezer', za: 'oke', us: 'guy', au: 'bloke', nz: 'guy', esl: 'boy' },
  telly:       { uk: 'the telly', za: 'TV', us: 'TV', au: 'the telly', nz: 'TV', esl: 'TV' },          // article included
  mum:         { uk: 'mum', geordie: 'mam', ie: 'mam', za: 'mom', us: 'mom', au: 'mum', esl: 'mother' },
  proper:      { uk: 'proper', us: 'real', au: 'proper', esl: 'real' },
  properly:    { uk: 'properly', us: 'really', au: 'properly', esl: 'really' },
  fancy:       { uk: 'fancy', za: 'like', us: 'like', au: 'like', esl: 'like' },
  buzzing:     { uk: 'buzzing', ie: 'delighted', za: 'stoked', us: 'so happy', au: 'stoked', esl: 'so happy' },
  gutted:      { uk: 'gutted', us: 'crushed', au: 'gutted', esl: 'so sad' },
  knackered:   { uk: 'knackered', scot: 'shattered', ie: 'wrecked', za: 'finished', us: 'wiped out', au: 'stuffed', nz: 'knackered', esl: 'so tired' },
  'mugged-off':{ uk: 'mugged off', ie: 'made a fool of', za: 'played', us: 'played', au: 'mugged off', esl: 'made a fool of' },
  grassed:     { uk: 'grassed', ie: 'ratted', za: 'snitched', us: 'snitched', au: 'dobbed', nz: 'narked', esl: 'told on' },
  'oh-my-days':{ uk: 'oh my days', scot: 'oh my God', geordie: 'oh my God', essex: 'shut up', ie: 'Jesus', za: 'eish',
                 us: 'oh my God', au: 'oh my God', esl: 'oh my God', es: 'madre mía', it: 'mamma mia', fr: 'oh là là',
                 br: 'nossa', de: 'oh mein Gott' },
  bro:         { uk: 'bro', scot: 'pal', ie: 'bud', za: 'bru', us: 'bro', ca: 'bud', esl: 'bro' },
  girl:        { uk: 'babe', scot: 'hen', geordie: 'pet', essex: 'babe', ie: 'hun', us: 'girl', au: 'babe',
                 esl: 'girl', es: 'guapa', it: 'bella', fr: 'ma belle', br: 'amiga', de: 'Süße' },          // girls to girls
  // the two words islanders say most that carry a region with them
  yeah:        { uk: 'yeah', scot: 'aye', geordie: 'aye', za: 'ja', us: 'yeah', esl: 'yes' },
  little:      { uk: 'little', scot: 'wee', us: 'little', esl: 'little' },
  pint:        { uk: 'a pint', za: 'a beer', us: 'a beer', au: 'a schooner', nz: 'a beer', esl: 'a drink' },
};

/** A slot's word for this dialect, walking the base chain; UK if nobody set it. */
export function slotWord(key, dialect) {
  const slot = SLOTS[key];
  if (!slot) return null;
  for (let d = dialect; d; d = DIALECTS[d]?.base) if (slot[d] != null) return slot[d];
  return slot.uk;
}

// American spelling, for American and Canadian speakers. Words, not suffix
// rules: "-ise" to "-ize" by rule would turn "promise" into "promize".
export const US_SPELLING = {
  favourite: 'favorite', favourites: 'favorites', apologise: 'apologize', apologised: 'apologized',
  realise: 'realize', realised: 'realized', colour: 'color', honour: 'honor', organise: 'organize',
  recognise: 'recognize', learnt: 'learned', grey: 'gray', whilst: 'while', towards: 'toward',
};
export const US_SPELLERS = ['us'];   // Canada keeps "colour" and "favourite"

// What a second-language speaker says in full more often than not.
export const ESL_EXPANSIONS = { "I'm": 'I am', "you're": 'you are', "it's": 'it is', "that's": 'that is',
  "don't": 'do not', "can't": 'cannot', "I've": 'I have', "I'd": 'I would', "we're": 'we are', "isn't": 'is not' };

// Words that belong to one country and must go through a slot (or a dialect
// variant) rather than sit in a line where everyone would say them.
export const REGIONAL_WORDS = ['mate', 'mates', 'telly', 'mum', 'mam', 'mom', 'knackered', 'gutted', 'buzzing',
  'grassed', 'grass', 'mugged off', 'lads', 'lad', 'fancy', 'fancies', 'proper', 'innit',
  'oh my days', 'cracking on', 'cracked on', 'bloody', 'quid', 'fortnight', 'loo', 'arvo', 'reckon',
  'dude', 'y\'all', 'gotten', 'awesome', 'cheeky', 'wee', 'aye', 'hen', 'pet', 'howay', 'bruv', 'geezer',
  'eh', 'sweet as', 'lekker', 'eish', 'bru'];
// Not listed, on purpose: "properly" is ordinary English ("sleep properly")
// and only British as an intensifier ("properly nice"), which no word list
// can tell apart — those are fixed by hand. "Of course" is everywhere; only a
// bare "Course." opening a sentence is British, and the test checks for that.
