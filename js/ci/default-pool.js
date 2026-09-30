// ══════════════════════════════════════════════════════════════════════
// ci/default-pool.js — the Catfish Pool a season uses when nobody wrote one
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.2: the author writes the pool; the engine never invents a persona.
// This IS an authored pool — eight personas, written once — so a season
// started without one still looks like the show (about a third of the cast
// behind somebody else's photos). An author's own pool replaces it whole; an
// author who deletes every persona gets a season with no catfish.
//
// Spread on purpose: six ways of typing (the job sets the register a player
// has to keep up), ages 21 to 41 so an older player can play young and a
// young one can play a parent, four women and four men.
//
// Every field is a pick from ci/persona-data.js: the job (how it types, what
// it can be caught on), life details (more to be caught on), the photo picks
// the image prompt is built from. No stock faces: the images are the
// author's own (face = that image's id, null until one is added). The bios
// here are written by hand; a new persona's bio is written from its picks.
// reasons — why a player would take it (strategic is scheme-only).

const P = (id, handle, age, gender, jobId, status, hometown, details, photo, reasons, bio) =>
  ({ id, handle, face: null, age, gender, jobId, status, hometown, details, photo, reasons, bio, fits: {} });

export const DEFAULT_POOL = [
  P('ci-kayla', 'Kayla', 22, 'f', 'college-student', 'Single', 'Columbus, Ohio', [],
    { hair: 'long-dark', style: 'cozy', setting: 'campus' }, ['strategic', 'experimental'],
    'Psych major, senior year. Iced coffee, true crime, and very little patience for fake people.'),
  P('ci-jake', 'Jake', 26, 'm', 'personal-trainer', 'Single', 'Scottsdale, Arizona', ['dog'],
    { hair: 'short-dark', style: 'sporty', setting: 'gym' }, ['strategic', 'protective'],
    "Trainer, dog dad, early riser. If you're not sweating, you're not trying."),
  P('ci-sienna', 'Sienna', 25, 'f', 'bartender', 'Single', 'Miami, Florida', [],
    { hair: 'long-blond', style: 'glam', setting: 'night' }, ['strategic', 'experimental'],
    'I make the drinks and hear the secrets. Here for a good time and a good story.'),
  P('ci-marcus', 'Marcus', 29, 'm', 'firefighter', 'Taken', 'Baltimore, Maryland', ['church'],
    { hair: 'bald', style: 'work', setting: 'work' }, ['protective', 'family'],
    'Firefighter, big brother to four, Sunday cook. I show up for my people.'),
  P('ci-grace', 'Grace', 34, 'f', 'pediatric-nurse', 'Single', 'Nashville, Tennessee', ['dog'],
    { hair: 'wavy-auburn', style: 'scrubs', setting: 'home' }, ['protective', 'family'],
    "Pediatric nurse, dog mom. I hold babies for a living and I'm not sorry about it."),
  P('ci-david', 'David', 41, 'm', 'high-school-teacher', 'Married', 'Madison, Wisconsin', ['kids'],
    { hair: 'thinning', style: 'sweater', setting: 'work' }, ['family', 'protective'],
    'History teacher, husband, father of two teenagers who think I am very uncool.'),
  P('ci-tyler', 'Tyler', 21, 'm', 'music-student', 'Single', 'Portland, Oregon', ['band'],
    { hair: 'bun', style: 'cozy', setting: 'stage' }, ['experimental', 'strategic'],
    'Guitar, vinyl, bad sleep schedule. I write songs about people I meet.'),
  P('ci-denise', 'Denise', 39, 'f', 'realtor', 'Single', 'Houston, Texas', ['kids'],
    { hair: 'curly-dark', style: 'smart', setting: 'work' }, ['strategic', 'protective'],
    "Realtor, single mom, zero filter. I'll tell you what your home is worth, and what you're worth too."),
];
