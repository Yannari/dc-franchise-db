// ══════════════════════════════════════════════════════════════════════
// ci/persona-data.js — what a Catfish Pool persona is built from
// ══════════════════════════════════════════════════════════════════════
//
// A persona is PICKED, not typed (user, 2026-09-30: "am I supposed to write the
// description myself — how does the simulator read it?"). Everything the
// engine reads comes from these lists:
//
//   the JOB   decides how the persona types (a register, ci/cover.js) and how
//             sharp it reads (smarts), and brings the topics a real one would
//             know;
//   DETAILS   (has kids, has a dog…) add topics of their own;
//   TOPICS    are where a fake gets caught: a knowledge slip in a chat names
//             one, and is written from that topic's own pool
//             (ci/lines/slip-topics.js — US 4's golfer who didn't know what an
//             eagle is).
//
// The bio and the photo prompt are WRITTEN from the picks (bioFor, promptFor);
// the author may overwrite the bio, which is only ever shown.

export const TOPICS = {
  hospital: { label: 'hospital life' },
  'night-shifts': { label: 'night shifts' },
  childcare: { label: 'looking after kids' },
  gym: { label: 'training' },
  bar: { label: 'bartending' },
  music: { label: 'music' },
  school: { label: 'teaching' },
  law: { label: 'the law' },
  firehouse: { label: 'the fire station' },
  'real-estate': { label: 'selling homes' },
  garage: { label: 'cars' },
  campus: { label: 'college life' },
  modeling: { label: 'modeling' },
  kids: { label: 'being a parent' },
  dog: { label: 'the dog' },
  church: { label: 'church' },
  'college-sports': { label: 'college sports' },
  gaming: { label: 'gaming' },
};

// register and smarts follow ci/cover.js's reading of a job title, so a
// picked job and a typed one agree.
const J = (id, name, group, register, smarts, topics) => ({ id, name, group, register, smarts, topics });
export const JOBS = [
  J('pediatric-nurse', 'Pediatric nurse', 'Care', 'warm', 6, ['hospital', 'night-shifts']),
  J('er-nurse', 'ER nurse', 'Care', 'warm', 6, ['hospital', 'night-shifts']),
  J('nanny', 'Nanny', 'Care', 'warm', 6, ['childcare']),
  J('youth-pastor', 'Youth pastor', 'Care', 'warm', 6, ['church', 'childcare']),
  J('personal-trainer', 'Personal trainer', 'Fitness & nightlife', 'hype', 5, ['gym']),
  J('college-athlete', 'College athlete', 'Fitness & nightlife', 'hype', 5, ['college-sports', 'gym', 'campus']),
  J('dj', 'DJ', 'Fitness & nightlife', 'hype', 5, ['music', 'bar']),
  J('bartender', 'Bartender', 'Fitness & nightlife', 'flirty', 5, ['bar', 'night-shifts']),
  J('model', 'Model', 'Fitness & nightlife', 'flirty', 5, ['modeling']),
  J('dancer', 'Dancer', 'Fitness & nightlife', 'flirty', 5, ['music', 'gym']),
  J('high-school-teacher', 'High school teacher', 'Office & school', 'formal', 7, ['school']),
  J('kindergarten-teacher', 'Kindergarten teacher', 'Office & school', 'formal', 7, ['school', 'childcare']),
  J('lawyer', 'Lawyer', 'Office & school', 'formal', 8, ['law']),
  J('firefighter', 'Firefighter', 'Trades & service', 'blunt', 5, ['firehouse', 'night-shifts']),
  J('realtor', 'Realtor', 'Trades & service', 'blunt', 5, ['real-estate']),
  J('mechanic', 'Mechanic', 'Trades & service', 'blunt', 5, ['garage']),
  J('college-student', 'College student', 'Students', 'dry', 5, ['campus']),
  J('music-student', 'Music student', 'Students', 'dry', 5, ['music', 'campus']),
  J('streamer', 'Streamer', 'Students', 'dry', 5, ['gaming']),
];
export const JOB_GROUPS = [...new Set(JOBS.map(j => j.group))];
const JOB_BY_ID = new Map(JOBS.map(j => [j.id, j]));
export const jobOf = persona => JOB_BY_ID.get(persona?.jobId) || null;

export const DETAILS = [
  { id: 'kids', name: 'has kids', topics: ['kids'] },
  { id: 'dog', name: 'has a dog', topics: ['dog'] },
  { id: 'night-shifts', name: 'works night shifts', topics: ['night-shifts'] },
  { id: 'gym', name: 'at the gym every day', topics: ['gym'] },
  { id: 'church', name: 'goes to church', topics: ['church'] },
  { id: 'college-sports', name: 'played college sports', topics: ['college-sports'] },
  { id: 'gamer', name: 'big gamer', topics: ['gaming'] },
  { id: 'band', name: 'plays in a band', topics: ['music'] },
];
const DETAIL_BY_ID = new Map(DETAILS.map(d => [d.id, d]));

// The real show's own bios: "Single. Very single." (US 2), "It's complicated".
export const STATUSES = ['Single', 'Very single', 'Taken', 'Married', "It's complicated"];

/** The topics a persona can be caught on: its job's and its life's. An
 *  author's own list (an older pool) stands as written. */
export function tellsOf(persona = {}) {
  if (!persona.jobId && Array.isArray(persona.tells)) return [...persona.tells];
  const t = [...(jobOf(persona)?.topics || []), ...(persona.details || []).flatMap(d => DETAIL_BY_ID.get(d)?.topics || [])];
  return [...new Set(t)];
}

// ── The bio, written from the picks ────────────────────────────────────
// Plain, first person, the way the real profiles read. Varied by the handle,
// so two personas with the same job do not share a bio.
const JOB_LINES = {
  'pediatric-nurse': ['I hold babies for a living and I am not sorry about it.', 'Tiny patients, big hearts.'],
  'er-nurse': ['I have seen everything, twice.', 'Calm in a crisis, chaos on my day off.'],
  nanny: ['Professional snack negotiator.', 'I can get any kid to eat their vegetables.'],
  'youth-pastor': ['Faith, family and a very loud youth group.', 'Ask me about my Wednesday nights.'],
  'personal-trainer': ["If you're not sweating, you're not trying.", 'Early mornings and big goals.'],
  'college-athlete': ['Game days are my whole personality.', 'Practice twice a day, study in between.'],
  dj: ['I play the song you did not know you needed.', 'Weekends behind the decks.'],
  bartender: ['I make the drinks and hear the secrets.', "I'll remember your order and your drama."],
  model: ['Camera ready, most days.', 'Lots of shoots, lots of waiting around.'],
  dancer: ['Rehearsal all day, dancing all night.', 'I cannot sit still, ask anyone.'],
  'high-school-teacher': ['My students think I am very uncool.', 'I grade papers for fun, apparently.'],
  'kindergarten-teacher': ['Twenty-two five-year-olds and one of me.', 'Glitter is in my hair forever.'],
  lawyer: ['I argue for a living.', 'Long hours, strong opinions.'],
  firefighter: ['I show up for my people.', 'Station life, Sunday cook.'],
  realtor: ["I'll tell you what your home is worth.", 'Open houses every weekend.'],
  mechanic: ['If it has an engine, I can fix it.', 'Grease under my nails, no apologies.'],
  'college-student': ['Senior year, running on iced coffee.', 'Finals week is my villain era.'],
  'music-student': ['I write songs about people I meet.', 'Guitar, vinyl, bad sleep schedule.'],
  streamer: ['Live most nights, come say hi.', 'My chat is my family.'],
};
const DETAIL_WORDS = { kids: 'mom', dog: 'dog', 'night-shifts': 'night-shift survivor', gym: 'gym rat',
  church: 'church on Sundays', 'college-sports': 'former college athlete', gamer: 'gamer', band: 'plays in a band' };
const STATUS_LINES = { Single: 'Single and ready to mingle.', 'Very single': 'Single. Very single.', Taken: 'Happily taken.',
  Married: 'Married to my best friend.', "It's complicated": "Relationship status: it's complicated." };
const hash = s => [...String(s || '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function bioFor(persona = {}) {
  const job = jobOf(persona);
  const h = hash(persona.handle);
  const parent = persona.gender === 'm' ? 'dad' : 'mom';
  const tags = (persona.details || []).map(d => (d === 'kids' ? parent : d === 'dog' ? `dog ${parent}` : DETAIL_WORDS[d])).filter(Boolean);
  const head = [job ? job.name : (persona.job || null), ...tags].filter(Boolean).join(', ');
  const lines = job ? JOB_LINES[job.id] : null;
  const line = lines ? lines[h % lines.length] : '';
  const status = h % 3 === 0 ? STATUS_LINES[persona.status] || '' : '';
  return [head ? `${head}.` : '', line, status].filter(Boolean).join(' ');
}

// ── The photo prompt, for the author's own image ──────────────────────
const P = (id, name, words) => ({ id, name, words });
export const PHOTO = {
  hair: [
    P('long-dark', 'Long, dark', 'long dark hair'), P('long-blond', 'Long, blond', 'long blond hair'),
    P('wavy-auburn', 'Wavy, auburn', 'wavy auburn hair'), P('curly-dark', 'Curly, dark', 'dark curly hair'),
    P('short-dark', 'Short, dark', 'short dark hair'), P('short-light', 'Short, light', 'short light-brown hair'),
    P('buzzed', 'Buzzed', 'a buzz cut'), P('bald', 'Shaved head', 'a shaved head'), P('bun', 'Top bun', 'hair in a top bun'),
    P('thinning', 'Thinning', 'thinning hair'), P('braids', 'Braids', 'long braids'),
  ],
  style: [
    P('casual', 'Casual', 'casual clothes'), P('glam', 'Glam', 'glam makeup and a going-out top'), P('sporty', 'Sporty', 'gym clothes'),
    P('work', 'Work clothes', 'work clothes'), P('scrubs', 'Scrubs', 'scrubs'), P('smart', 'Smart', 'a blazer'),
    P('cozy', 'Cozy', 'a hoodie'), P('sweater', 'Sweater vest', 'a sweater vest and glasses'),
  ],
  setting: [
    P('home', 'At home', 'at home'), P('work', 'At work', 'at work'), P('gym', 'At the gym', 'at the gym'),
    P('night', 'Night out', 'on a night out, neon behind'), P('beach', 'Beach', 'on the beach'), P('car', 'In the car', 'in the car'),
    P('campus', 'On campus', 'on a college campus'), P('stage', 'On stage', 'on a small stage'),
  ],
};
const photoWords = (k, id) => PHOTO[k].find(x => x.id === id)?.words;

export function promptFor(persona = {}) {
  const ph = persona.photo || {};
  const parts = [photoWords('hair', ph.hair), photoWords('style', ph.style), photoWords('setting', ph.setting)].filter(Boolean);
  const job = jobOf(persona)?.name?.toLowerCase() || persona.job;
  return [`${persona.handle || 'Persona'}, ${persona.age ?? ''}`.replace(/, $/, ''), job, ...parts,
    'phone selfie, natural light, looking at the camera'].filter(Boolean).join(', ');
}
