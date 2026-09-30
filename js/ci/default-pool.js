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
// has to keep up, ci/cover.js personaStyle), ages 21 to 41 so an older player
// can play young and a young one can play a parent, four women and four men.
// Each face was picked from ci/faces.js for its age and look; faceFit agrees.
//
// Fields: reasons — why a player would take it (strategic is scheme-only,
// profiles.js reasonFor); tells — the topics a real person in that life would
// know, where a fake gets caught (ci/slips.js).

export const DEFAULT_POOL = [
  { id: 'ci-kayla', handle: 'Kayla', face: 'fan-kiki', age: 22, gender: 'f',
    job: 'college student', hometown: 'Columbus, Ohio', status: 'Single',
    bio: 'Psych major, senior year. Iced coffee, true crime, and very little patience for fake people.',
    reasons: ['strategic', 'experimental'], tells: ['sorority rush', 'finals week'], fits: {} },
  { id: 'ci-jake', handle: 'Jake', face: 'athlete-brett', age: 26, gender: 'm',
    job: 'personal trainer', hometown: 'Scottsdale, Arizona', status: 'Single',
    bio: "Trainer, dog dad, early riser. If you're not sweating, you're not trying.",
    reasons: ['strategic', 'protective'], tells: ['macros', 'leg day'], fits: {} },
  { id: 'ci-sienna', handle: 'Sienna', face: 'fan-sonny', age: 25, gender: 'f',
    job: 'bartender', hometown: 'Miami, Florida', status: 'Single',
    bio: "I make the drinks and hear the secrets. Here for a good time and a good story.",
    reasons: ['strategic', 'experimental'], tells: ['cocktail recipes', 'closing shifts'], fits: {} },
  { id: 'ci-marcus', handle: 'Marcus', face: 'crew-xavier', age: 29, gender: 'm',
    job: 'firefighter', hometown: 'Baltimore, Maryland', status: 'In a relationship',
    bio: 'Firefighter, big brother to four, Sunday cook. I show up for my people.',
    reasons: ['protective', 'family'], tells: ['station life', '24-hour shifts'], fits: {} },
  { id: 'ci-grace', handle: 'Grace', face: 'senior-nona', age: 34, gender: 'f',
    job: 'pediatric nurse', hometown: 'Nashville, Tennessee', status: 'Single',
    bio: "Pediatric nurse. I hold babies for a living and I'm not sorry about it.",
    reasons: ['protective', 'family'], tells: ['night shifts', 'scrubs'], fits: {} },
  { id: 'ci-david', handle: 'David', face: 'senior-oswald', age: 41, gender: 'm',
    job: 'high school teacher', hometown: 'Madison, Wisconsin', status: 'Married',
    bio: 'History teacher, husband, father of two teenagers who think I am very uncool.',
    reasons: ['family', 'protective'], tells: ['lesson plans', 'teenagers'], fits: {} },
  { id: 'ci-tyler', handle: 'Tyler', face: 'crew-koa', age: 21, gender: 'm',
    job: 'music student', hometown: 'Portland, Oregon', status: 'Single',
    bio: 'Guitar, vinyl, bad sleep schedule. I write songs about people I meet.',
    reasons: ['experimental', 'strategic'], tells: ['campus', 'open mic nights'], fits: {} },
  { id: 'ci-denise', handle: 'Denise', face: 'senior-midge', age: 39, gender: 'f',
    job: 'realtor', hometown: 'Houston, Texas', status: 'Divorced',
    bio: "Realtor, single mom, zero filter. I'll tell you what your house is worth and what you are too.",
    reasons: ['strategic', 'protective'], tells: ['open houses', 'closing costs'], fits: {} },
];
