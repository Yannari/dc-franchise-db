// ══════════════════════════════════════════════════════════════════════
// dr/data/partners.js — who walks through the door on a makeover
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The partners were six arrays of twelve invented first names typed into
// js/dr/chal/makeover.js, and two of those arrays were THE SAME TWELVE PEOPLE:
// `superfans` and `pit-crew` shared all twelve — Marco, Devon, Rafa, Ty,
// Bruno, Kai, Sol, Ivo, Nate, Quin, Ash, Rome — and differed only in how easy
// each was to work with. Booking the pit crew and booking the superfans got
// you the same room at a different difficulty. The names appeared nowhere else
// in the repo: no face, no history, nothing a viewer could recognise.
//
// They have faces now, so they are people. The collision is gone by
// construction — every cohort is its own roster and no name appears twice.
//
// ── WHERE THE PICTURES LIVE, AND WHY NOT WITH THE PLAYERS ─────────────
//
// `assets/guests/`, NOT `assets/avatars/`. The avatars directory is keyed by
// player slug and is what the roster draws from; a guest dropped in there is
// one bad glob away from becoming a contestant, and it already holds a
// `bruno.png` and a `harold.png` who are players with names this file would
// otherwise have wanted. A separate directory makes "these are not in the
// franchise" a fact about the filesystem rather than a convention somebody has
// to remember.
//
// Every file below exists. A missing one is not an error either — the card
// falls back to initials, the way an unphotographed judge does.
//
// ── THE PIT CREW RECURS. EVERYBODY ELSE DOES NOT ──────────────────────
//
// The crew is a fixture: the same faces every season, which is the whole
// reason making one of them over is worth an episode — the audience has
// watched him hand out props for two years and now he is somebody's drag
// sister. The other four are guests who come once.
//
// EIGHTEEN EACH, TWELVE FOR THE CREW, and the sizes are the point. A season
// needs one partner per queen, so a cohort of exactly twelve means every
// season meets all twelve and only the order changes. Eighteen means a room is
// a DRAW — two seasons booking superfans get overlapping but different people.
// The crew is twelve rather than six because six had to be handed out twice to
// fill a room, and the draft keys partners by id: the duplicates collapsed and
// three queens were paired with nobody at all.

/** How well a partner takes to it: 1 has to be carried, 10 walks in ready. */
const guest = (group, slug, name, ease, note) => ({
  id: `${group}-${slug}`,
  name,
  ease,
  note,
  portrait: `assets/guests/${group}-${slug}.png`,
  recurring: group === 'crew',
});

/**
 * The pit crew, who are the same people every season.
 *
 * Small enough that a viewer learns them, big enough to fill a room without
 * anybody being handed out twice. Each is a different afternoon to have: the
 * one who has been waiting years to be asked, and the one who agreed to be a
 * good sport and has regretted it since. `note` is a fact about him rather
 * than a score — it is what a line can reach for.
 */
export const PIT_CREW = [
  guest('crew', 'bryce', 'Bryce', 9,
    'Has been waiting to be asked since his first season and has opinions about his own contour.'),
  guest('crew', 'koa', 'Koa', 7,
    'Game for anything, right up until the corset, and then game for that too.'),
  guest('crew', 'jax', 'Jax', 5,
    'Said yes to be a good sport and has been quietly panicking about the heels all week.'),
  guest('crew', 'malakai', 'Malakai', 8,
    'Moves beautifully and knows it. The walk will not be the problem.'),
  guest('crew', 'reef', 'Reef', 4,
    'Shy off camera in a way nobody expects from somebody who works in a harness.'),
  guest('crew', 'zane', 'Zane', 6,
    'Deadpan throughout, which reads as reluctance and is actually concentration.'),
  guest('crew', 'keanu', 'Keanu', 8, 'Has done this before, in a bar, for money, and will not elaborate.'),
  guest('crew', 'roman', 'Roman', 5, 'Agreed on camera and regretted it off it, which everybody saw.'),
  guest('crew', 'rio', 'Rio', 9, 'Was born for this and has been waiting for somebody to notice.'),
  guest('crew', 'trey', 'Trey', 6, 'Takes direction beautifully and volunteers nothing.'),
  guest('crew', 'xavier', 'Xavier', 4, 'Cannot stop laughing, which ruins three sets of lashes.'),
  guest('crew', 'zed', 'Zed', 7, 'Treats it as a job and does the job extremely well.'),
];

/** Fans of the show, thrilled to be there and impossible to embarrass. */
export const SUPERFANS = [
  guest('fan', 'casey', 'Casey', 9, 'Knows every season by number and will tell you which one.'),
  guest('fan', 'gabe', 'Gabe', 8, 'Brought a scrapbook. An actual one.'),
  guest('fan', 'riley', 'Riley', 9, 'Has practised the walk at home. It shows, mostly well.'),
  guest('fan', 'sami', 'Sami', 7, 'Enthusiastic and entirely uncoordinated.'),
  guest('fan', 'milo', 'Milo', 8, 'Says yes to everything and means it every time.'),
  guest('fan', 'nico', 'Nico', 9, 'Already knows what he wants his drag name to be.'),
  guest('fan', 'toni', 'Toni', 7, 'Nervous until the wig, and then unstoppable.'),
  guest('fan', 'jamie', 'Jamie', 8, 'Cries when the queen says they look like sisters.'),
  guest('fan', 'robin', 'Robin', 9, 'Would have done this for free and keeps saying so.'),
  guest('fan', 'parker', 'Parker', 7, 'Overthinks the pose and underthinks the shoes.'),
  guest('fan', 'oakley', 'Oakley', 8, 'Quietly the most natural performer in the room.'),
  guest('fan', 'sonny', 'Sonny', 8, 'Laughs at everything, including the parts that hurt.'),
  guest('fan', 'jessi', 'Jessi', 9, 'Has a tattoo of a catchphrase and will show anybody.'),
  guest('fan', 'kiki', 'Kiki', 8, 'Auditioned twice. Is not bitter. Mentions it anyway.'),
  guest('fan', 'lexi', 'Lexi', 7, 'Nervous, sweet, and word-perfect on every lip sync.'),
  guest('fan', 'maddie', 'Maddie', 9, 'Screamed at the door and has not stopped since.'),
  guest('fan', 'nikki', 'Nikki', 8, 'Came in her own drag, which nobody asked for and everybody enjoyed.'),
  guest('fan', 'phoebe', 'Phoebe', 7, 'Quiet until the reveal and then completely undone by it.'),
];

/** Service veterans: disciplined, game, and starting from absolute zero. */
export const VETERANS = [
  guest('vet', 'bradley', 'Sergeant Bradley', 5, 'Treats the makeover as an operation with a timetable.'),
  guest('vet', 'curtis', 'Corporal Curtis', 6, 'Follows every instruction exactly and offers nothing extra.'),
  guest('vet', 'desmond', 'Captain Desmond', 4, 'Has commanded people and cannot be told to relax.'),
  guest('vet', 'frank', 'Private Frank', 7, 'The youngest in the room and the first to laugh at himself.'),
  guest('vet', 'gordon', 'Major Gordon', 4, 'Polite, immovable, and clearly counting the minutes.'),
  guest('vet', 'lance', 'Lieutenant Lance', 5, 'Wants to be good at it, which is not the same as being ready.'),
  guest('vet', 'miller', 'Sergeant Miller', 6, 'Cracks halfway through and enjoys the rest of it.'),
  guest('vet', 'norton', 'Officer Norton', 7, 'Was talked into it by his daughter and is glad he came.'),
  guest('vet', 'percy', 'Airman Percy', 5, 'Stands to attention in heels, which does not work.'),
  guest('vet', 'rex', 'Gunner Rex', 4, 'Built like a door and moves like one.'),
  guest('vet', 'silas', 'Ensign Silas', 6, 'Quiet, watchful, and better at this than he expected.'),
  guest('vet', 'vincent', 'Commander Vincent', 5, 'Keeps calling the queen ma’am. Nobody corrects him.'),
  guest('vet', 'barry', 'Corporal Barry', 6, 'Volunteered because nobody else would and grew to like it.'),
  guest('vet', 'clark', 'Sergeant Clark', 5, 'Has a parade-ground voice and no volume control.'),
  guest('vet', 'conrad', 'Captain Conrad', 4, 'Asks what the objective is. Twice.'),
  guest('vet', 'dwight-jr', 'Private Dwight Jr', 7, 'Youngest, keenest, and the first into a heel.'),
  guest('vet', 'gideon', 'Major Gideon', 5, 'Solemn about it in a way that turns out to be funny.'),
  guest('vet', 'martin', 'Officer Martin', 6, 'Retired last year and has decided to say yes to things.'),
];

/** Older guests, usually more relaxed about it than the queen painting them. */
export const SENIORS = [
  guest('senior', 'albert', 'Albert', 3, 'Agreed before he understood what he was agreeing to.'),
  guest('senior', 'arthur', 'Arthur', 4, 'Has worn worse to a wedding and says so.'),
  guest('senior', 'alma', 'Alma', 7, 'Was a dancer once and the body remembers.'),
  guest('senior', 'bea', 'Bea', 8, 'Delighted, filthy, and impossible to shock.'),
  guest('senior', 'bonnie', 'Bonnie', 6, 'Brought her own lipstick and intends to use it.'),
  guest('senior', 'gertrude', 'Gertrude', 5, 'Sceptical for an hour and converted for the rest.'),
  guest('senior', 'hortense', 'Hortense', 7, 'Has strong opinions about the wig and every one of them lands.'),
  guest('senior', 'irene', 'Irene', 6, 'Wants to know whether it will come off before Sunday.'),
  guest('senior', 'mabel', 'Mabel', 6, 'Falls asleep in the chair and wakes up transformed.'),
  guest('senior', 'ralph', 'Ralph', 3, 'Did this for his late wife’s sense of humour.'),
  guest('senior', 'wally', 'Wally', 4, 'Complains the entire time and asks for photographs after.'),
  guest('senior', 'maureen', 'Maureen', 7, 'Steals the runway and knows exactly what she did.'),
  guest('senior', 'hazel', 'Hazel', 7, 'Ran a pub for forty years. Nothing here is new.'),
  guest('senior', 'irwin', 'Irwin', 4, 'Came for the biscuits and stayed for the wig.'),
  guest('senior', 'midge', 'Midge', 8, 'Was in a chorus line once and has never fully left it.'),
  guest('senior', 'nona', 'Nona', 6, 'Corrects the queen’s eyeliner and is right to.'),
  guest('senior', 'oswald', 'Oswald', 3, 'Deeply unconvinced and entirely too polite to leave.'),
  guest('senior', 'patricia', 'Patricia', 7, 'Has brought photographs of herself at twenty-five, for reference.'),
];

/** Athletes: physically fearless and completely lost in a heel. */
export const ATHLETES = [
  guest('athlete', 'blake', 'Blake', 6, 'Can do a backflip and cannot do a turn.'),
  guest('athlete', 'brett', 'Brett', 5, 'Competitive about it, which helps and then does not.'),
  guest('athlete', 'chad', 'Chad', 7, 'Committed the second he saw the wig.'),
  guest('athlete', 'clay', 'Clay', 5, 'Strong, willing, and shaped nothing like the dress.'),
  guest('athlete', 'damon', 'Damon', 8, 'Has the walk already and does not know why.'),
  guest('athlete', 'dusty', 'Dusty', 6, 'Treats the runway as a race and has to be slowed down.'),
  guest('athlete', 'hudson', 'Hudson', 5, 'Nervous in front of a camera for the first time in his life.'),
  guest('athlete', 'jabari', 'Jabari', 8, 'Moves like he has been performing for years. He has, just not this.'),
  guest('athlete', 'killian', 'Killian', 4, 'Teammates are watching and he cannot stop thinking about it.'),
  guest('athlete', 'troy', 'Troy', 7, 'Says yes to every idea, including the bad ones.'),
  guest('athlete', 'wyatt', 'Wyatt', 6, 'Grim concentration throughout, and a genuine smile at the reveal.'),
  guest('athlete', 'travis', 'Travis', 7, 'The one his team will never let forget this.'),
  guest('athlete', 'cory', 'Cory', 6, 'Warms up before the runway. Actually warms up.'),
  guest('athlete', 'curtis', 'Curtis', 5, 'Has been tackled by larger men and finds this harder.'),
  guest('athlete', 'evan', 'Evan', 7, 'Instantly good at the walk and insufferable about it.'),
  guest('athlete', 'jordan', 'Jordan', 8, 'Understood the assignment before it finished being explained.'),
  guest('athlete', 'lance', 'Lance', 4, 'Built entirely wrong for the dress and gamely wearing it.'),
  guest('athlete', 'zach', 'Zach', 6, 'Keeps checking whether his team is watching. They are.'),
];

/** Every authored cohort, by the key a season books it under. */
export const GUEST_POOLS = {
  superfans: SUPERFANS,
  veterans: VETERANS,
  seniors: SENIORS,
  athletes: ATHLETES,
  'pit-crew': PIT_CREW,
};

/**
 * A room of partners for the cohort a season booked.
 *
 * TWELVE AUTHORED, A ROOM DRAWN FROM THEM. A season needs one partner per
 * queen and the cohorts hold twelve, so handing back the whole list in written
 * order means two seasons meet the same people in the same order — which is
 * what a fixed array did. Drawn from the season's own rng instead: a replay of
 * the same seed meets the same room, and two different seasons rarely do.
 *
 * THE CREW IS THE EXCEPTION and it is the point of them: the same six every
 * season, in a room bigger than six they repeat rather than growing a seventh,
 * because a made-up crew member is a stranger wearing the crew's name.
 */
export function drawPartners(cohort, rng = Math.random, n = 12) {
  const pool = GUEST_POOLS[cohort];
  if (!pool) return [];
  /* THE CREW USED TO REPEAT to fill a room, and repeating broke it: the draft
     keys partners by id, so six people offered twice collapsed back to six and
     three queens were paired with nobody at all — "a stranger" on the card.
     Twelve of them now, like every other cohort, so nobody is handed out
     twice and nobody is left over. */
  const bag = [...pool];
  const out = [];
  while (out.length < n && bag.length) {
    out.push(bag.splice(Math.floor(rng() * bag.length), 1)[0]);
  }
  return out;
}
