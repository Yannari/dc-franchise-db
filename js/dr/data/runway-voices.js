// ══════════════════════════════════════════════════════════════════════
// dr/data/runway-voices.js — the runway, in her own voice
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The runway walk in stage-beats.js is a NARRATOR describing a queen from the
// outside, and it has one voice for thirteen women. Read a dumped season and
// every walk is the same sentence with a different name in it: "{a} turns the
// corner and the panel goes quiet." A fashion queen who lives and dies on
// proportion, a camp queen who built the joke on purpose, and a pageant queen
// who has done this since she was nineteen are all narrated identically, and
// the only thing that varies is how good the look was.
//
// The show does not do that. It puts HER VOICE over her own walk. So this
// file replaces the narrator with the queen, and gives her two things the
// narrator never had: what kind of drag she does, and what kind of person
// she is.
//
// ── THE THREE POOLS, AND WHY THEY ARE SEPARATE ────────────────────────
//
// A walk has to answer three questions and they have three different sources:
// what did she bring for THIS CATEGORY, how did her craft read it, and what
// does a woman like her think about the result. A single crossed pool —
// category × style × archetype × tier — is tens of thousands of lines, of
// which a thirteen-queen season would read thirteen. So the three axes are
// authored independently and JOINED at render time, in this order:
//
//   RUNWAY_THEMES    the garment.  8 families × 3 fits.   What she brought for {c}.
//   RUNWAY_VOICES    her craft.   10 styles  × 5 tiers.   How it read on the walk.
//   RUNWAY_SWAGGER   her nerve.    5 groups  × 5 tiers.   What she thinks of it.
//
// stage.js renders `theme + " " + voice + " " + swagger` as one paragraph.
// That is 384 lines producing 1,200 distinct paragraphs, every one of which
// is about the right category, in the right craft's voice, at the right
// place in the field, from the right kind of woman.
//
// ── THE TWO CONSTRAINTS THAT MAKE THE JOIN WORK ───────────────────────
//
// Each pool knows ONLY its own axis and must not trespass on another's.
//
//   A THEME line knows the category and whether it suits her. It must NOT
//   say how the look landed — it is written before the panel has reacted,
//   and it lands identically on a stunning walk and a disaster.
//
//   A VOICE line knows how it landed and what craft she does. It must NOT
//   name the garment, the fabric or the colour — the theme line already
//   chose those and it chose different ones last week.
//
//   A SWAGGER line knows only the tier. It must not name the garment, the
//   category, the colour or the concept. A swagger line that says "and the
//   feathers were worth it" is broken, because the theme line it lands
//   after may have been about a suit.
//
// The swagger line is also the LAST sentence of the paragraph and has to read
// as one after any two lines that preceded it.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// FIRST PERSON, UNQUOTED. This is her voiceover running over her own walk —
// the show's own device. Not "she walks out"; not a quoted line of dialogue.
// Just: I built this in four days and I can feel the front row stop talking.
// The screen already draws her portrait and her name beside the paragraph, so
// the reader never loses track of who is speaking.
//
// Placeholders:
//   {a}  her own name. AVAILABLE BUT RARELY RIGHT — she is speaking, and a
//        queen who refers to herself in the third person is doing a bit. Use
//        it for exactly that, and only in a style where the bit is in
//        character.
//   {c}  tonight's runway category, e.g. Mother of the Bride Realness.
//        REQUIRED IN EVERY THEME LINE and forbidden everywhere else — the
//        theme line is the only thing in the whole episode that tells the
//        viewer what she was asked to walk in.
//
// Same rules as every other pool, all enforced by tests: no real people,
// this show's vocabulary only, never quote a stat by number, four variants
// minimum per tier, prose rather than captions.
//
// ── THE TIERS ARE RANKED, NOT SCORED ──────────────────────────────────
//
// stage.js ranks the queens who walked TONIGHT and cuts the field: the top
// 15% are `stunning`, the next quarter `strong`, and so on down to
// `disaster`. So `stunning` means best in this room on this night, not a
// number — and a `weak` on a strong night is a look that would have been
// fine two weeks ago. Write to the room, not to a score.

import { runwayById } from './runways.js';

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The five score cuts, best to worst. Voice and swagger share them. */
export const RUNWAY_TIER_IDS = ['stunning', 'strong', 'fine', 'weak', 'disaster'];

/** The three fits, from `fitFor` in js/dr/perform.js: 1, 0.5 and 0. */
export const RUNWAY_FIT_IDS = ['home', 'neutral', 'against'];

// ══════════════════════════════════════════════════════════════════════
// POOL 1 — THE GARMENT. What she brought, for this category.
// ══════════════════════════════════════════════════════════════════════
//
// THE CATEGORY IS THE ONE THING THE OLD RUNWAY NEVER SAID. Twenty prompts in
// js/dr/data/runways.js, each of them a real instruction to a designer — and
// the walk that followed was "she comes around the corner and the look is
// finished from the wig to the heel", which would print identically under
// Night of a Thousand Ghouls and under Denim and Diamonds. The engine knew
// which category it was and chose not to look.
//
// ── WHY FAMILIES RATHER THAN CATEGORIES ───────────────────────────────
//
// Twenty categories × three fits is 240 fragments, and the categories are not
// twenty different ideas — Ghouls, Creatures of the Deep and Leather and Lace
// are one instruction wearing three hats. So they collapse into eight
// families, exactly the way challenge families work in maxi-performance.js.
// The category still names itself in the line through {c}, so the reader sees
// Creatures of the Deep and not "the horror category".
//
// ── THE THREE FITS ARE THE THEME RELATION, AND THEY ARE MEASURED ──────
//
// `fitFor` in js/dr/perform.js already scores whether the category calls for
// her style — 1 when it is her wheelhouse, 0 when it clashes, 0.5 when the
// prompt names no styles and asks everybody the same question. Those are
// these three tiers, so `home` really is her wheelhouse and `against` really
// is a prompt she has to fight, by the same number the score used.
//
// This is where a queen's relationship to the theme lives, and it is the most
// interesting axis in the file: a spooky queen given Night of a Thousand
// Ghouls has been waiting all season and says so; the same queen given
// Pageant Perfection is doing an impression of somebody else's drag and knows
// the panel can tell.
//
// A theme line does NOT know how the look landed. Write it as the sentence
// she would say walking out of the workroom, before anybody has reacted.

const theme = (family, note, tiers) => ({ family, note, tiers });

export const RUNWAY_THEMES = [
  theme('haunted',
    'Horror, the deep, the occult, leather. A prompt that wants to frighten '
    + 'somebody. Texture, silhouette and a face that is doing something wrong.', [
      tier('home', 'Her prompt. She has had this look in her head for years.'),
      tier('neutral', 'Not her language, but a language she can speak.'),
      tier('against', 'She does not do frightening and is going to try anyway.'),
    ]),
  theme('pageant',
    'Pageant Perfection, Black and White Ball, Something Borrowed. Polish, '
    + 'symmetry, correctness, and a rulebook everybody in the room knows.', [
      tier('home', 'The rulebook is hers. She has won on this prompt before it was a prompt.'),
      tier('neutral', 'She can do correct. Correct is not what she is known for.'),
      tier('against', 'Being asked to be tasteful by people who cast her for not being.'),
    ]),
  theme('structure',
    'Structure and Silhouette, The Colour Wheel. A design prompt. Line, '
    + 'proportion, construction and an idea you can see from the back row.', [
      tier('home', 'A question about shape, asked of somebody who thinks in shapes.'),
      tier('neutral', 'She built something. Whether it is an idea is somebody else’s call.'),
      tier('against', 'The prompt wants a concept and she brought a garment.'),
    ]),
  theme('spectacle',
    'Feathers and Fringe, Showgirl, Curtain Up. Showbusiness. Big, plumed, '
    + 'lit from the front, and unembarrassed about any of it.', [
      tier('home', 'Enormous, and she was built for enormous.'),
      tier('neutral', 'She can be big for one night.'),
      tier('against', 'Asked to be a showgirl when her whole thing is not being one.'),
    ]),
  theme('nightlife',
    'Club Kid Couture, Bodysuit Realness, Denim and Diamonds. The room this '
    + 'drag actually comes from. Body, nerve, silhouette, three in the morning.', [
      tier('home', 'Finally, the prompt is her Friday night.'),
      tier('neutral', 'She has been to a club. This is not the same as being of one.'),
      tier('against', 'A prompt that asks for a body and a nerve she does not trade on.'),
    ]),
  theme('cartoon',
    'Cartoon Come to Life, Two Looks in One. Camp, colour, a reveal, a joke '
    + 'built into the construction. Nothing here is subtle and it must not be.', [
      tier('home', 'Permission, in writing, to be ridiculous.'),
      tier('neutral', 'Playing along, and enjoying it more than she expected.'),
      tier('against', 'She does not do silly and this prompt is only silly.'),
    ]),
  theme('personal',
    'Hometown Pride, Bring Back My Girls, Best Drag, Category Is: You. The '
    + 'prompt is her. No brief to hide behind and nothing to blame.', [
      tier('home', 'The easiest brief she will ever get and the most exposing.'),
      tier('neutral', 'Asked who she is, on a night when she is not certain.'),
      tier('against', 'A prompt with no walls, which is the only kind she cannot build for.'),
    ]),
  theme('open',
    'FALLBACK. A category this catalogue does not name — a challenge-derived '
    + 'eleganza, one walk of a Ball, an authored one-off. The line may use {c} '
    + 'but must not assume anything about what {c} means, because it could be '
    + 'anything. Describe the making and the wearing, not the theme.', [
      tier('home', 'Whatever it turned out to be, it turned out to be hers.'),
      tier('neutral', 'A brief, answered.'),
      tier('against', 'A brief she read three times and still does not have an angle on.'),
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 2 — HER CRAFT. One voice per drag style.
// ══════════════════════════════════════════════════════════════════════
//
// The ten styles are js/dr/queen.js's DRAG_STYLES and this file must carry
// all ten: a queen's style is either authored on her roster entry or derived
// from her strongest craft stat, so every queen in every season has one.
//
// WHAT SEPARATES THEM IS WHAT SHE NOTICES. That is the whole instruction. A
// fashion queen walking a stunning look talks about proportion and line and
// the exact weight of the fabric; a camp queen walking the same tier talks
// about the moment the joke lands and the fact that she meant every stupid
// inch of it; a pageant queen talks about the years of doing this and the
// fact that this is what she is FOR. Same tier, same room, three different
// women — because they are looking at three different things.
//
// And the failure tiers separate hardest of all. A fashion queen's disaster
// is a taste failure and she knows it before she reaches the mark. A club-kid
// queen's disaster is that the room did not get it, which is not the same
// admission at all.

const voice = (style, note, tiers) => ({ style, note, tiers });

export const RUNWAY_VOICES = [
  voice('pageant',
    'Trained, symmetrical, decades of it. Poise is not an accident and she '
    + 'will tell you what it cost. Reads a sloppy queen without saying so.', [
      tier('stunning', 'This is the room she was built for, and she knows it.'),
      tier('strong', 'Clean, correct, expensive. She will take it.'),
      tier('fine', 'Textbook. Nothing to fault and nothing to remember.'),
      tier('weak', 'Dated, and she can feel the panel deciding that word.'),
      tier('disaster', 'The training does not save her and that is the humiliation.'),
    ]),
  voice('comedy',
    'The look is a delivery system for a bit. She is watching for the laugh '
    + 'the way another queen watches for the gasp, and she times the walk to it.', [
      tier('stunning', 'The bit lands on the runway and the panel breaks.'),
      tier('strong', 'It works. She hears exactly the laugh she built for.'),
      tier('fine', 'A smile, not a laugh, and she knows the difference.'),
      tier('weak', 'The joke does not read as a joke, which is worse than not being funny.'),
      tier('disaster', 'Silence, and she has to keep walking through it.'),
    ]),
  voice('fashion',
    'Proportion, line, fabric, reference. Unsentimental about her own work and '
    + 'contemptuous of a look with no idea under it, including when it is hers.', [
      tier('stunning', 'The line is right and she can see the panel see it.'),
      tier('strong', 'A good garment worn correctly. She wanted more.'),
      tier('fine', 'It is a look. That is the most she will say for it.'),
      tier('weak', 'A taste failure, diagnosed in real time by the person who made it.'),
      tier('disaster', 'She knew before she left the room and wore it anyway.'),
    ]),
  voice('camp',
    'On purpose. Every stupid inch of it on purpose, and the joy is in the '
    + 'commitment. Would rather be enormous and wrong than small and correct.', [
      tier('stunning', 'Ridiculous, total, and the room goes with her.'),
      tier('strong', 'Big and committed and it lands.'),
      tier('fine', 'They are amused. She was going for something louder than amused.'),
      tier('weak', 'Committed to something the room does not want to go along with.'),
      tier('disaster', 'The commitment is the problem and there is no dialling it back mid-walk.'),
    ]),
  voice('club-kid',
    'Nightlife, not theatre. Silhouette over sewing, nerve over finish, and a '
    + 'suspicion that this panel is not the room her drag was made for.', [
      tier('stunning', 'The shape does what it does in a dark room, in the light, in front of them.'),
      tier('strong', 'It reads, and reading was the risk.'),
      tier('fine', 'Legible. Safe. Not why she does this.'),
      tier('weak', 'Under these lights it looks like what it is made of.'),
      tier('disaster', 'They do not get it, and she is not sure that is entirely their fault.'),
    ]),
  voice('spooky',
    'Horror, ritual, the uncanny. Slow and deliberate; she is building a '
    + 'feeling rather than presenting a garment, and the feeling can fail.', [
      tier('stunning', 'The temperature of the room actually changes.'),
      tier('strong', 'Unsettling and controlled. She holds it the whole way.'),
      tier('fine', 'Atmospheric enough. Nobody is frightened.'),
      tier('weak', 'Costume, not dread, and the difference is everything.'),
      tier('disaster', 'It reads as funny, which is the one thing it must not do.'),
    ]),
  voice('broadway',
    'Theatre-trained, projects to the back row, thinks in acts. The walk has '
    + 'a beginning and an ending and she has rehearsed the ending.', [
      tier('stunning', 'She plays the room and the room plays back.'),
      tier('strong', 'A performance, delivered. The technique holds.'),
      tier('fine', 'Competent stagecraft with nothing behind it tonight.'),
      tier('weak', 'Too big for the room, and she can hear that it is too big.'),
      tier('disaster', 'The ending she rehearsed does not survive contact with the runway.'),
    ]),
  voice('dancer',
    'It is a body and it moves. The look exists to be moved in and she is '
    + 'impatient with anything that restricts her.', [
      tier('stunning', 'The movement is the look and she has never been more certain of anything.'),
      tier('strong', 'She moves well and the garment lets her.'),
      tier('fine', 'A walk. She wanted somewhere to put the energy and there was nowhere.'),
      tier('weak', 'The construction is fighting her and it wins.'),
      tier('disaster', 'She cannot move in it, and standing still is not a skill she has.'),
    ]),
  voice('glamour',
    'Beauty as the entire argument. Face, hair, silhouette, light. No concept '
    + 'is needed because she IS the concept, which is either true tonight or it is not.', [
      tier('stunning', 'Beautiful, and beautiful is enough when it is this beautiful.'),
      tier('strong', 'She looks expensive and she knows how to be looked at.'),
      tier('fine', 'Pretty. Pretty is the faintest praise on this stage.'),
      tier('weak', 'The face is doing all the work and it cannot carry it alone.'),
      tier('disaster', 'The one thing she sells did not turn up tonight.'),
    ]),
  voice('art',
    'Conceptual, difficult, uninterested in being liked. If it has to be '
    + 'explained she will explain it, and she resents having to.', [
      tier('stunning', 'The idea arrives whole and lands without a word of explanation.'),
      tier('strong', 'Difficult, and they follow her anyway.'),
      tier('fine', 'They see a garment. She made an argument.'),
      tier('weak', 'The concept did not survive being made out of fabric.'),
      tier('disaster', 'Nobody can tell what it is, and you had to be there is not available on a runway.'),
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 3 — HER NERVE. One closing sentence per archetype group.
// ══════════════════════════════════════════════════════════════════════
//
// Five groups rather than fifteen archetypes, because fifteen would be four
// hundred lines for a distinction the reader cannot hear: a mastermind and a
// schemer walking a bad runway have the same thought.
//
// READ THE CONSTRAINT AT THE TOP OF THIS FILE BEFORE WRITING THESE. A swagger
// line lands after a voice line it has never seen, so it may not name the
// garment, the fabric, the colour, the concept or the category. It knows one
// thing and one thing only: how the walk went.
//
// Still first person. Still one to two sentences — this is the button on the
// paragraph, not a second paragraph.

const swagger = (group, note, tiers) => ({ group, note, tiers });

export const RUNWAY_SWAGGER = [
  swagger('predator',
    'villain, mastermind, schemer. Reads the runway as a move in a longer '
    + 'game. Notices who is watching, and what tonight buys her next week.', [
      tier('stunning', 'A win she intends to spend.'),
      tier('strong', 'Banked. Not the point of the evening, but banked.'),
      tier('fine', 'Invisible tonight, which has its uses and she says so.'),
      tier('weak', 'Recalculating, out loud, before she has left the stage.'),
      tier('disaster', 'She is already deciding who this gets blamed on.'),
    ]),
  swagger('sunshine',
    'hero, loyal-soldier, social-butterfly, showmancer. Generous, and means '
    + 'it. Thinks about the room and the girls in it as much as her own night.', [
      tier('stunning', 'Delighted, and slightly embarrassed to be delighted.'),
      tier('strong', 'Happy with it and happy to say so.'),
      tier('fine', 'Fine is fine. Somebody else needed tonight more.'),
      tier('weak', 'Disappointed in herself and refusing to be a burden about it.'),
      tier('disaster', 'Holding it together for everybody else, which is its own exhaustion.'),
    ]),
  swagger('firecracker',
    'hothead, chaos-agent, wildcard. Feels it immediately and entirely. No '
    + 'distance between what happened and what she thinks about it.', [
      tier('stunning', 'Euphoric and completely without composure about it.'),
      tier('strong', 'Buzzing. Wants to do it again immediately.'),
      tier('fine', 'Bored by her own walk, which is the worst thing that could have happened.'),
      tier('weak', 'Furious, and not with herself.'),
      tier('disaster', 'Detonating internally, and the internally part will not last.'),
    ]),
  swagger('professional',
    'challenge-beast, perceptive-player. Assesses. Knows where she probably '
    + 'landed before the panel opens its mouth, and is usually right.', [
      tier('stunning', 'Notes the result and moves on. There is a critique to survive.'),
      tier('strong', 'Where she expected to be. That is the job.'),
      tier('fine', 'Middle of the pack, correctly identified, mildly annoying.'),
      tier('weak', 'Diagnosing the error while still walking, so it does not happen twice.'),
      tier('disaster', 'A failure she can name precisely, which does not help at all.'),
    ]),
  swagger('scrapper',
    'underdog, goat, floater. Did not expect to be here and has not stopped '
    + 'noticing. Every good night is a surprise and every bad one is a confirmation.', [
      tier('stunning', 'Astonished by herself, and daring anybody to take it off her.'),
      tier('strong', 'Waiting for somebody to tell her it does not count.'),
      tier('fine', 'Survived another one. That was the entire ambition.'),
      tier('weak', 'The thing she was afraid of, happening on schedule.'),
      tier('disaster', 'Confirmation. She had a whole speech ready for this and no need to give it.'),
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP — how stage.js turns a queen into a voice
// ══════════════════════════════════════════════════════════════════════

/**
 * Which swagger group an archetype belongs to.
 *
 * Every one of the fifteen archetypes is mapped. An unknown one — a roster
 * entry from before this show, a typo, a future archetype — falls to
 * `scrapper`, which is the most neutral of the five and the only one whose
 * lines assume nothing about how the season has gone for her.
 */
export const SWAGGER_BY_ARCHETYPE = {
  villain: 'predator', mastermind: 'predator', schemer: 'predator',
  hero: 'sunshine', 'loyal-soldier': 'sunshine',
  'social-butterfly': 'sunshine', showmancer: 'sunshine',
  hothead: 'firecracker', 'chaos-agent': 'firecracker', wildcard: 'firecracker',
  'challenge-beast': 'professional', 'perceptive-player': 'professional',
  underdog: 'scrapper', goat: 'scrapper', floater: 'scrapper',
};

export const SWAGGER_GROUPS = [...new Set(Object.values(SWAGGER_BY_ARCHETYPE))];

export function swaggerGroupFor(archetype) {
  return SWAGGER_BY_ARCHETYPE[archetype] || 'scrapper';
}

/**
 * Which theme family a category belongs to.
 *
 * Every label in js/dr/data/runways.js is mapped. ANYTHING ELSE FALLS TO
 * `open`, and a great many things are anything else: a week with no authored
 * category gets "<Challenge name> eleganza", a Ball generates its own three
 * walks, and an author may pin a one-off. `open` is written to be honest
 * about that — it describes the making and the wearing and assumes nothing
 * about what the prompt meant.
 */
export const THEME_BY_CATEGORY = {
  'Night of a Thousand Ghouls': 'haunted',
  'Creatures of the Deep': 'haunted',
  'Leather and Lace': 'haunted',
  'Pageant Perfection': 'pageant',
  'Black and White Ball': 'pageant',
  'Something Borrowed': 'pageant',
  'Structure and Silhouette': 'structure',
  'The Colour Wheel': 'structure',
  'Feathers and Fringe': 'spectacle',
  Showgirl: 'spectacle',
  'Curtain Up': 'spectacle',
  'Club Kid Couture': 'nightlife',
  'Bodysuit Realness': 'nightlife',
  'Denim and Diamonds': 'nightlife',
  'Cartoon Come to Life': 'cartoon',
  'Two Looks in One': 'cartoon',
  'Hometown Pride': 'personal',
  'Bring Back My Girls': 'personal',
  'Best Drag': 'personal',
  'Category Is: You': 'personal',
};

export function themeFamilyFor(category) {
  return THEME_BY_CATEGORY[category] || 'open';
}

/**
 * Her relationship to tonight's prompt.
 *
 * READ FROM THE CATEGORY, NOT FROM THE SCORE'S `fit`, and the difference is
 * the whole reason `clashes` was added to js/dr/data/runways.js.
 *
 * `runwayScore` records fit as 1, 0.5 or 0 — and 0 means "her style is not on
 * this category's list", which for a prompt naming two styles out of ten is
 * eight queens in ten. Dumping an episode and reading it is what showed what
 * that does to the prose: the off-theme paragraph fired for eight of ten
 * walks and printed verbatim three times in one runway, because a four-variant
 * tier cannot cover eight queens. "Not her wheelhouse" and "fighting the
 * prompt" were the same number and they are not the same sentence.
 *
 * So the narration reads the two authored lists directly: `styles` is home,
 * `clashes` is against, everything else is neutral — about six queens in ten.
 * The score is untouched and still reads `fitFor`, because that term was
 * calibrated and this is prose.
 *
 * A category with no entry in the catalogue — a challenge-derived eleganza, a
 * Ball's own walk, an authored one-off — is neutral, which is the honest read:
 * nobody declared what it flatters.
 */
export function fitTierFor(style, category) {
  const c = runwayById(category);
  if (!c || !style) return 'neutral';
  if ((c.styles || []).includes(style)) return 'home';
  if ((c.clashes || []).includes(style)) return 'against';
  return 'neutral';
}

/** What she brought for tonight, or null — see voiceLinesFor on why null. */
export function themeLinesFor(family, fitId) {
  const f = RUNWAY_THEMES.find(x => x.family === family);
  const t = f && f.tiers.find(x => x.id === fitId);
  return t && t.lines.length ? t.lines : null;
}

/**
 * Her craft lines for tonight, or null.
 *
 * NULL RATHER THAN A FALLBACK LINE, and that is deliberate: this file ships
 * empty and is filled style by style, so for most of its life some styles are
 * written and some are not. stage.js reads a null here and falls back to the
 * narrator walk in stage-beats.js, which means a half-filled file gives a
 * season where six queens speak for themselves and four are narrated — never
 * a season with holes in the runway.
 */
export function voiceLinesFor(style, tierId) {
  const v = RUNWAY_VOICES.find(x => x.style === style);
  const t = v && v.tiers.find(x => x.id === tierId);
  return t && t.lines.length ? t.lines : null;
}

/** Her closing sentence, or null — omitted entirely rather than faked. */
export function swaggerLinesFor(group, tierId) {
  const g = RUNWAY_SWAGGER.find(x => x.group === group);
  const t = g && g.tiers.find(x => x.id === tierId);
  return t && t.lines.length ? t.lines : null;
}

/** Every (style, tier) and (group, tier) pair still waiting on prose. */
export function unwrittenRunwayVoices() {
  const out = [];
  for (const f of RUNWAY_THEMES) {
    for (const t of f.tiers) if (t.lines.length < 4) out.push(`theme:${f.family}/${t.id}`);
  }
  for (const v of RUNWAY_VOICES) {
    for (const t of v.tiers) if (t.lines.length < 4) out.push(`voice:${v.style}/${t.id}`);
  }
  for (const g of RUNWAY_SWAGGER) {
    for (const t of g.tiers) if (t.lines.length < 4) out.push(`swagger:${g.group}/${t.id}`);
  }
  return out;
}

/** How many tiers exist across both pools, for the progress report. */
export function runwayVoiceTierCount() {
  return RUNWAY_THEMES.reduce((n, f) => n + f.tiers.length, 0)
    + RUNWAY_VOICES.reduce((n, v) => n + v.tiers.length, 0)
    + RUNWAY_SWAGGER.reduce((n, g) => n + g.tiers.length, 0);
}
