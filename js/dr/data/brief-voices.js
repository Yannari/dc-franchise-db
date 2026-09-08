// ══════════════════════════════════════════════════════════════════════
// dr/data/brief-voices.js — the announcement, in this challenge's words
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The same bug as the runway, one screen earlier, and it was found the same
// way: by reading a real episode. This is a Talent Show Extravaganza — every
// queen does a solo act on a bare stage with one rehearsal slot — and the
// reactions that printed under it were:
//
//   "...somewhere she is casting and choreographing and picking fabric..."
//   "...a plan, arriving fully formed..."
//   "...she is already building her approach..."
//
// Nobody is casting anybody. There is no fabric and no choreography and no
// team to build an approach with. Those sentences were written for a girl
// group number and they print, word for word, under a stand-up set, a
// makeover, a photoshoot and a Snatch Game, because `announce-reaction` was
// tiered on how well the week suited her and knew nothing whatsoever about
// what the week WAS.
//
// It is the same failure `familyForChallenge` was invented to fix one screen
// later, where a collapse on a Snatch Game is being stuck in a chair unable
// to drop the character and a collapse on a Rusical is being off-key in front
// of a live band. The announcement deserves the same treatment: the challenge
// is named in the brief and then never referred to again by anybody reacting
// to it.
//
// ── THE TWO POOLS ─────────────────────────────────────────────────────
//
//   BRIEF_VOICES      how the host explains THIS challenge.  17 families × 1.
//   REACTION_VOICES   how it lands on HER.  17 families × 3 aptitudes.
//
// Both key on the same family list as js/dr/data/maxi-performance.js, and
// `familyForChallenge` is the same function, so a challenge that has a
// performance family automatically has a brief and a set of reactions.
//
// ── THE THREE APTITUDES ARE RANKED, NOT SCORED ────────────────────────
//
// stage.js ranks the room on how well each queen's craft suits THIS
// challenge's own scoring blend — the same blend the performance is judged
// on, so "this is her week" means what the engine means by it — and cuts the
// field three ways. Only a handful of queens react out loud; it is not a
// register of the whole room.
//
//   delighted  top of the room for this brief. It is hers and she knows it.
//   braced     the middle. She can do it. She is not thrilled about it.
//   dreading   the bottom. This is the week she was afraid of.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THIRD PERSON HERE, unlike the runway pools. This is the werk room with a
// camera in it rather than her voiceover over her own walk, and the register
// of the werk room is already established — intimate, funny, watching people
// who have not yet had to perform.
//
// Placeholders:
//   {a}  the queen reacting. REACTION lines only — the brief is addressed to
//        the room and must not single anybody out.
//   {c}  the challenge, by name, e.g. Talent Show Extravaganza.
//
// SAY WHAT SHE IS ACTUALLY GOING TO HAVE TO DO. That is the whole instruction
// and it is the entire reason for the file. A delighted reaction to a Snatch
// Game is her already knowing which character she is doing; to a Rusical it is
// a trained singer hearing there is a live band; to a Talent Show it is a
// woman who has had the same eight-minute act since she was twenty-two and
// has finally been asked for it. Three different reactions to the same tier,
// because they are three different weeks. A line that would print correctly
// under any family is a line that has not been written yet.
//
// Same rules as every other pool, all enforced by tests: no real people, this
// show's vocabulary only, never quote a stat by number, four variants minimum
// per tier, prose rather than captions.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The three cuts, best to worst. Do not add to it. */
export const APTITUDE_IDS = ['delighted', 'braced', 'dreading'];

/**
 * The families, and what each one asks of a queen.
 *
 * `solo` is on every entry because it is the thing the old pool got most
 * visibly wrong — a reaction about casting and building an approach printed
 * under a challenge where she stands on a stage by herself. A writer filling
 * a solo family must never reach for a team.
 */
const fam = (family, solo, note, brief, reactions) => ({
  family, solo, note, brief, reactions,
});

const REACT = (delighted, braced, dreading) => [
  tier('delighted', delighted), tier('braced', braced), tier('dreading', dreading),
];

export const BRIEF_FAMILIES = [
  fam('snatch-game', true,
    'The celebrity impersonation game. She picks a character, sits at a desk '
    + 'and has to be funny in someone else\'s voice for as long as it takes.',
    tier('brief', 'The host explains the game, the desk, and the picking of a character.'),
    REACT(
      'An impressionist who has had a character ready since the day she was cast.',
      'She has one character she can do and is about to find out if it is enough.',
      'She cannot do voices, has never been able to do voices, and everybody knows.')),
  fam('girl-group', false,
    'A track, a verse each and choreography, in a group. Writing, singing and '
    + 'dancing at once, and a team that can sink her.',
    tier('brief', 'A song, verses to write, choreography to learn, and teams.'),
    REACT(
      'She writes, she dances, and a group is where she has always been best.',
      'Two of the three, and she is hoping the third is somebody else\'s verse.',
      'She cannot dance and the verse has to be written by tonight.')),
  fam('rusical', false,
    'A staged musical number with a live vocal and a live band. The most '
    + 'technical week of the season and the least forgiving.',
    tier('brief', 'A musical, a part to be cast in, and a live vocal.'),
    REACT(
      'A trained singer hearing the words "live band" and going somewhere else.',
      'She can hold a tune. Holding it while dancing is a different question.',
      'She does not sing, and this is the week where not singing is audible.')),
  fam('roast', true,
    'Stand-up, on a stage, to a live audience, about people sitting in front '
    + 'of her. Her own material, her own timing, nowhere to hide.',
    tier('brief', 'A roast: her own jokes, a live room, and the people she is roasting in it.'),
    REACT(
      'A comedian who has been waiting all season to be given a microphone.',
      'She is funny in a room. A stage is not a room and she knows the difference.',
      'She has never written a joke and now has an afternoon to write seven.')),
  fam('makeover', false,
    'She has to drag somebody else and make them her sister. Somebody else\'s '
    + 'face, body and nerve, and a look built for two.',
    tier('brief', 'A stranger to paint, dress and turn into family, then walk with.'),
    REACT(
      'A queen with drag daughters, being asked to do the only thing she loves more.',
      'She can paint a face. Getting a stranger to walk is the part she cannot rehearse.',
      'She can barely paint her own face and now there are two of them.')),
  fam('ball', true,
    'Three looks in one night, at least one of them sewn from scratch. The '
    + 'week that is decided by how much she can physically make.',
    tier('brief', 'Three categories, three looks, and one of them built from nothing.'),
    REACT(
      'A seamstress being told to sew, which is the whole reason she came.',
      'Two looks she packed and one she has to make, and the making is the risk.',
      'She does not sew, and there is no version of this week where that is hidden.')),
  fam('design', true,
    'Build a garment out of what she is given, against the clock, and walk in '
    + 'it. Judged on the building.',
    tier('brief', 'An unlikely material, a machine, and a runway at the end of it.'),
    REACT(
      'She sews, and a challenge scored on sewing is a challenge she has already won.',
      'She can put a garment together. Whether it survives a walk is another matter.',
      'A machine she cannot use and a deadline she cannot move.')),
  fam('talent-show', true,
    'ALONE, ON A BARE STAGE, WITH ONE REHEARSAL SLOT. Whatever she can do, '
    + 'done live, with no brief to interpret and no team to blame. THE FAMILY '
    + 'THIS FILE WAS WRITTEN FOR — the old generic reactions had her casting '
    + 'and choreographing, and there is nobody to cast and nothing to '
    + 'choreograph that she is not doing herself.',
    tier('brief', 'One act each, her own choosing, same stage and same time for everybody.'),
    REACT(
      'She has had the same act since she was twenty-two and has finally been asked for it.',
      'She has something she can do. She is not sure it is worth four minutes.',
      'Asked what her talent is, and genuinely not knowing what to say.')),
  fam('lalaparuza', true,
    'Lip syncs, one after another, in a bracket. No garment, no script, no '
    + 'preparation that helps — only whether she can perform a song.',
    tier('brief', 'A bracket of lip syncs, and everybody is in it.'),
    REACT(
      'A performer who would lip sync every week if they let her.',
      'She can do a lip sync. Doing four of them is a different ask.',
      'She survives on craft and craft is not in this room tonight.')),
  fam('acting', false,
    'A scripted scene, on camera, with a director watching and lines to '
    + 'remember. Timing, character, and doing it again when it is wrong.',
    tier('brief', 'A script, a part, a camera and a director who will stop her.'),
    REACT(
      'An actor being handed a script, which is the only thing she has ever wanted.',
      'She can hit a line. She has never been directed and is about to be.',
      'She cannot remember lines and the camera does not forgive it.')),
  fam('commercial', false,
    'Sell something absurd, on camera, in under a minute, with a co-star and '
    + 'a director. Charm compressed into a very small space.',
    tier('brief', 'A product, a camera, a co-star and almost no time.'),
    REACT(
      'A natural salesman finding out the product is ridiculous, which is better.',
      'She can be charming. She has never been charming to a lens on a count.',
      'She freezes on camera and this is entirely camera.')),
  fam('improv', false,
    'No script. A premise, a partner and a live audience, and whatever she '
    + 'says is what happens.',
    tier('brief', 'A premise, a scene partner and nothing written down.'),
    REACT(
      'Quick, unwriteable and finally in the week that rewards it.',
      'She is funny when she has thought about it, which is the problem.',
      'She needs a script and has been told there is not one.')),
  fam('photoshoot', true,
    'Stills. A photographer, a concept and a body that has to say the whole '
    + 'thing without moving or speaking.',
    tier('brief', 'A concept, a photographer, and a still image that has to carry it.'),
    REACT(
      'A face and a body that have never once let her down in front of a lens.',
      'She photographs well enough. Directing herself is the harder half.',
      'She is a performer and this week has taken away everything she performs with.')),
  fam('choreography', false,
    'Learn it, hit it, and be on the count. A choreographer teaching in the '
    + 'morning and judging in the evening.',
    tier('brief', 'A routine to learn today and perform tonight, on the count.'),
    REACT(
      'A dancer being asked to dance, at last, by somebody who can tell.',
      'She picks up choreography slowly and there is not much time to be slow in.',
      'She does not dance, and being off the count is the one thing that shows.')),
  fam('singing', false,
    'A live vocal, unhidden. A track she has to actually sing, in front of '
    + 'people who will know immediately if she cannot.',
    tier('brief', 'A song, sung live, with nothing to hide behind.'),
    REACT(
      'A live vocalist hearing the only brief she has been waiting for.',
      'She can carry a tune in a bar. This is not a bar.',
      'She cannot sing and there is no arrangement in the world that fixes it.')),
  fam('runway-challenge', true,
    'The runway IS the challenge. No performance, no team, no script — only '
    + 'what she brought and what she does with it.',
    tier('brief', 'No maxi to hide inside. The looks are the whole week.'),
    REACT(
      'A look queen finding out the week is only looks.',
      'She packed well. She did not pack for this to be the entire challenge.',
      'She wins weeks on personality and personality does not walk.')),
  fam('generic', true,
    'FALLBACK, for a challenge with no family of its own. The line may use '
    + '{c} but must assume NOTHING about what {c} involves — no stage, no '
    + 'team, no sewing, no script — because it could be any of them. Write '
    + 'about how she takes news, not about what the news is.',
    tier('brief', 'A challenge this file does not know the shape of.'),
    REACT(
      'It suits her, whatever it is, and she can tell from the first sentence.',
      'She could go either way on this one and knows it.',
      'It is not her week and she worked that out before the host finished.')),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP — how stage.js turns a challenge into a voice
// ══════════════════════════════════════════════════════════════════════

/**
 * The brief and reactions for a family.
 *
 * `familyForChallenge` in maxi-performance.js already maps every challenge id
 * to a family and falls back to `generic`, so this takes the family it
 * returns rather than duplicating that mapping and letting the two drift.
 */
export function briefFamily(family) {
  return BRIEF_FAMILIES.find(f => f.family === family)
    || BRIEF_FAMILIES.find(f => f.family === 'generic');
}

/**
 * How the host explains this challenge, or null.
 *
 * Null rather than a fallback line, for the same reason the runway pools hand
 * back null: this file ships empty and is filled a family at a time, and an
 * unwritten family keeps the generic beat in challenge-beats.js exactly as it
 * reads today rather than printing a blank.
 */
export function briefLinesFor(family) {
  const f = briefFamily(family);
  return f && f.brief.lines.length ? f.brief.lines : null;
}

/** How the brief lands on a queen at this aptitude, or null. */
export function reactionLinesFor(family, aptitude) {
  const f = briefFamily(family);
  const t = f && f.reactions.find(x => x.id === aptitude);
  return t && t.lines.length ? t.lines : null;
}

/** Every (family, tier) pair still waiting on prose. */
export function unwrittenBriefVoices() {
  const out = [];
  for (const f of BRIEF_FAMILIES) {
    if (f.brief.lines.length < 4) out.push(`brief:${f.family}`);
    for (const t of f.reactions) {
      if (t.lines.length < 4) out.push(`reaction:${f.family}/${t.id}`);
    }
  }
  return out;
}

/** How many tiers exist across both pools, for the progress report. */
export function briefVoiceTierCount() {
  return BRIEF_FAMILIES.reduce((n, f) => n + 1 + f.reactions.length, 0);
}
