// pm/lines/dialect.js — how each islander says the words that change with
// where they are from. Data only.
//
// A spoken line writes a slot, `{~mate}`, and the SPEAKER's dialect fills it:
// an American and a Brit in one scene each sound like themselves. `{~Mate}`
// is the same slot, capitalised. Slots are for spoken turns only; staging and
// beats are narration and stay neutral (tests/pm-lines.test.js).
//
// A word that has no honest swap (an idiom that only works in one country)
// gets a variant reply keyed on `dialect` instead of a slot.
export const SLOTS = {
  mate:        { uk: 'mate',       us: 'man',          au: 'mate',       ie: 'lad' },      // said TO someone
  'a-mate':    { uk: 'mate',       us: 'friend',       au: 'mate',       ie: 'pal' },      // a friend, the noun
  lads:        { uk: 'the lads',   us: 'the guys',     au: 'the boys',   ie: 'the lads' },
  lad:         { uk: 'lad',        us: 'guy',          au: 'bloke',      ie: 'lad' },
  telly:       { uk: 'the telly',  us: 'TV',           au: 'the telly',  ie: 'the telly' },  // article included
  mum:         { uk: 'mum',        us: 'mom',          au: 'mum',        ie: 'mam' },
  proper:      { uk: 'proper',     us: 'real',         au: 'proper',     ie: 'proper' },
  properly:    { uk: 'properly',   us: 'really',       au: 'properly',   ie: 'properly' },
  fancy:       { uk: 'fancy',      us: 'like',         au: 'like',       ie: 'fancy' },
  buzzing:     { uk: 'buzzing',    us: 'so happy',     au: 'stoked',     ie: 'delighted' },
  gutted:      { uk: 'gutted',     us: 'crushed',      au: 'gutted',     ie: 'gutted' },
  knackered:   { uk: 'knackered',  us: 'wiped out',    au: 'stuffed',    ie: 'wrecked' },
  'mugged-off':{ uk: 'mugged off', us: 'played',       au: 'mugged off', ie: 'made a fool of' },
  grassed:     { uk: 'grassed',    us: 'snitched',     au: 'dobbed',     ie: 'ratted' },
  'oh-my-days':{ uk: 'oh my days', us: 'oh my God',    au: 'oh my God',  ie: 'Jesus' },
  bro:         { uk: 'bro',        us: 'bro',          au: 'bro',        ie: 'bud' },
  girl:        { uk: 'babe',       us: 'girl',         au: 'babe',       ie: 'hun' },      // girls to girls
  pint:        { uk: 'a pint',     us: 'a beer',       au: 'a schooner', ie: 'a pint' },
};

// American spelling, for American speakers only. Words, not suffix rules:
// "-ise" to "-ize" by rule would turn "promise" into "promize".
export const US_SPELLING = {
  favourite: 'favorite', favourites: 'favorites', apologise: 'apologize', apologised: 'apologized',
  realise: 'realize', realised: 'realized', colour: 'color', honour: 'honor', organise: 'organize',
  recognise: 'recognize', learnt: 'learned', grey: 'gray', whilst: 'while', towards: 'toward',
};

// Words that belong to one country and must go through a slot (or a dialect
// variant) rather than sit in a line where everyone would say them.
export const REGIONAL_WORDS = ['mate', 'mates', 'telly', 'mum', 'mam', 'mom', 'knackered', 'gutted', 'buzzing',
  'grassed', 'grass', 'mugged off', 'lads', 'lad', 'fancy', 'fancies', 'proper', 'innit',
  'oh my days', 'cracking on', 'cracked on', 'bloody', 'quid', 'fortnight', 'loo', 'arvo', 'reckon',
  'dude', 'y\'all', 'gotten', 'awesome', 'cheeky'];
// Not listed, on purpose: "properly" is ordinary English ("sleep properly")
// and only British as an intensifier ("properly nice"), which no word list
// can tell apart — those are fixed by hand. "Of course" is everywhere; only a
// bare "Course." opening a sentence is British, and the test checks for that.
