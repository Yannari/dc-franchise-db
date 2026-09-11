// ══════════════════════════════════════════════════════════════════════
// dr/data/scenes.js — what the acting family is actually about
// ══════════════════════════════════════════════════════════════════════
//
// The Rusical works because its parts have NAMES. "She took the Sparkling
// Diamond and could not sing it" is a sentence; "she took the lead role" is
// not. The acting challenge, the commercial and the improv challenge had
// nothing — they drafted a nameless lead/featured/standard ladder and ran a
// blend check, which is why all three read identically to a design challenge.
//
// So they get the Rusical's treatment: named scripts with named parts, named
// products with an angle to find, and named premises to build a character on
// with no preparation at all.
//
// Nothing here names a real film, show, brand or person. A parody is a shape,
// and the shape is what the queen has to play.

const P = (role, name, spotlight, needs) => ({ role, name, spotlight, needs });

// ── ACTING: PARODY SCRIPTS ────────────────────────────────────────────
//
// `needs` is 'acting' for a part that has to be played straight and 'comedy'
// for one that only works if she is funny — the same split the Rusical uses,
// and the reason a comic and a serious actress want different roles.
export const SCRIPTS = [
  { id: 'hospital', name: 'General Hospital Corner', blurb: 'A medical drama where nobody has any medical training.', parts: [
    P('lead', 'The Surgeon With A Secret', 1.0, 'acting'),
    P('featured', 'The Nurse Who Knows', 0.7, 'comedy'),
    P('featured', 'The Patient Who Will Not Die', 0.7, 'comedy'),
    P('standard', 'The Administrator', 0.45, 'acting'),
    P('standard', 'The Intern', 0.45, 'comedy'),
    P('ensemble', 'The Body On The Table', 0.2, 'comedy')] },
  { id: 'courtroom', name: 'Order In The Court', blurb: 'A legal thriller in which no law is ever cited.', parts: [
    P('lead', 'The Defence', 1.0, 'acting'),
    P('featured', 'The Judge', 0.7, 'comedy'),
    P('featured', 'The Witness', 0.7, 'comedy'),
    P('standard', 'The Prosecutor', 0.45, 'acting'),
    P('standard', 'The Stenographer', 0.45, 'comedy'),
    /* NOT "The Jury": that word belongs to the camp and the house, and a
       Drag Race screen printing it is the exact bug the vocabulary guard
       exists for. It was a landmine rather than a bug for as long as no
       season happened to draw this scene AND cast this part — which one
       finally did. The gallery is the same room and the same crowd. */
    P('ensemble', 'The Gallery', 0.2, 'comedy')] },
  { id: 'space', name: 'Deep Space Drag', blurb: 'A crew, a hull breach, and nobody qualified to fix it.', parts: [
    P('lead', 'The Captain', 1.0, 'acting'),
    P('featured', 'The Android', 0.7, 'acting'),
    P('featured', 'The Stowaway', 0.7, 'comedy'),
    P('standard', 'The Navigator', 0.45, 'comedy'),
    P('standard', 'The Doctor', 0.45, 'acting'),
    P('ensemble', 'The Alien', 0.2, 'comedy')] },
  { id: 'housewives', name: 'The Real Housewives of Nowhere', blurb: 'Five women, one dinner, and a decade of grievances.', parts: [
    P('lead', 'The One Who Started It', 1.0, 'comedy'),
    P('featured', 'The One Who Is Above It', 0.7, 'acting'),
    P('featured', 'The Instigator', 0.7, 'comedy'),
    P('standard', 'The Peacemaker', 0.45, 'acting'),
    P('standard', 'The New Girl', 0.45, 'comedy'),
    P('ensemble', 'The Husband', 0.2, 'comedy')] },
  { id: 'heist', name: 'The Last Job', blurb: 'A crew assembles for one final score, badly.', parts: [
    P('lead', 'The Mastermind', 1.0, 'acting'),
    P('featured', 'The Safecracker', 0.7, 'comedy'),
    P('featured', 'The Inside Woman', 0.7, 'acting'),
    P('standard', 'The Driver', 0.45, 'comedy'),
    P('standard', 'The Fence', 0.45, 'acting'),
    P('ensemble', 'The Guard', 0.2, 'comedy')] },
  { id: 'reunion', name: 'Class of Whenever', blurb: 'A school reunion where nobody has changed at all.', parts: [
    P('lead', 'The One Who Peaked', 1.0, 'comedy'),
    P('featured', 'The One Who Left', 0.7, 'acting'),
    P('featured', 'The Organiser', 0.7, 'comedy'),
    P('standard', 'The Teacher', 0.45, 'acting'),
    P('standard', 'The Gatecrasher', 0.45, 'comedy'),
    P('ensemble', 'The Caterer', 0.2, 'comedy')] },
  { id: 'infomercial', name: 'Shopping Channel After Dark', blurb: 'Live television selling something nobody needs.', parts: [
    P('lead', 'The Host', 1.0, 'comedy'),
    P('featured', 'The Expert', 0.7, 'acting'),
    P('featured', 'The Caller', 0.7, 'comedy'),
    P('standard', 'The Demonstrator', 0.45, 'comedy'),
    P('standard', 'The Producer', 0.45, 'acting'),
    P('ensemble', 'The Studio Audience', 0.2, 'comedy')] },
  { id: 'soap', name: 'Days Of Our Wigs', blurb: 'A soap opera in which everyone is somebody else\'s twin.', parts: [
    P('lead', 'The Matriarch', 1.0, 'acting'),
    P('featured', 'The Returning Twin', 0.7, 'comedy'),
    P('featured', 'The Amnesiac', 0.7, 'acting'),
    P('standard', 'The Butler', 0.45, 'comedy'),
    P('standard', 'The Lawyer', 0.45, 'acting'),
    P('ensemble', 'The Portrait', 0.2, 'comedy')] },
];

/* ── AND THE OTHER KIND OF ACTING CHALLENGE ──
   There are two, and the engine only had one. A six-part script is the scene
   that runs TWICE — the room cut in half, two casts, the same script, judged
   against each other. The other kind is one production the whole room is in:
   a big ensemble with a part for everybody, where the danger is not losing a
   head-to-head but disappearing inside a crowd of twelve.

   They are different challenges to be in and they need different scripts, so
   the shape is a property of the SCRIPT rather than a rule in the module. A
   script with enough parts for the room runs once, with everybody in it;
   anything smaller runs twice.

   THE LADDER IS DELIBERATELY BOTTOM-HEAVY here. A twelve-hander has one lead
   and a lot of people with two lines, which is the whole tension of the form:
   most of the room has to make something out of very little, and the queen
   who does is the story of the episode. */
export const ENSEMBLE_SCRIPTS = [
  { id: 'airport', name: 'Terminal Drama', ensemble: true,
    blurb: 'A grounded flight, a delayed crowd, and nobody in charge.', parts: [
      P('lead', 'The Gate Agent', 1.0, 'comedy'),
      P('featured', 'The Passenger With A Connection', 0.7, 'comedy'),
      P('featured', 'The Pilot Who Has Given Up', 0.7, 'acting'),
      P('standard', 'The Duty Free Girl', 0.45, 'comedy'),
      P('standard', 'The One Filming Everything', 0.45, 'comedy'),
      P('standard', 'The Air Marshal', 0.45, 'acting'),
      P('standard', 'The Emotional Support Animal', 0.45, 'comedy'),
      P('ensemble', 'The Standby List', 0.2, 'comedy'),
      P('ensemble', 'The Sleeper In Row Nine', 0.2, 'comedy'),
      P('ensemble', 'The Woman On The Phone', 0.2, 'comedy'),
      P('ensemble', 'The Trolley', 0.2, 'acting'),
      P('ensemble', 'The Announcement', 0.2, 'comedy')] },
  { id: 'wedding', name: 'Something Borrowed', ensemble: true,
    blurb: 'One wedding, two families, and a secret that will not keep.', parts: [
      P('lead', 'The Bride', 1.0, 'acting'),
      P('featured', 'The Ex Who Came Anyway', 0.7, 'comedy'),
      P('featured', 'The Mother Of The Bride', 0.7, 'comedy'),
      P('standard', 'The Officiant', 0.45, 'comedy'),
      P('standard', 'The Best Woman', 0.45, 'acting'),
      P('standard', 'The Caterer', 0.45, 'comedy'),
      P('standard', 'The Photographer', 0.45, 'comedy'),
      P('ensemble', 'The Flower Girl', 0.2, 'comedy'),
      P('ensemble', 'The Uncle At The Bar', 0.2, 'comedy'),
      P('ensemble', 'The One Who Objects', 0.2, 'acting'),
      P('ensemble', 'The Band', 0.2, 'comedy'),
      P('ensemble', 'The Cake', 0.2, 'comedy')] },
  { id: 'newsroom', name: 'Breaking Nothing', ensemble: true,
    blurb: 'A rolling news channel with no news and four hours to fill.', parts: [
      P('lead', 'The Anchor', 1.0, 'acting'),
      P('featured', 'The Field Reporter', 0.7, 'comedy'),
      P('featured', 'The Weather Girl', 0.7, 'comedy'),
      P('standard', 'The Expert Nobody Booked', 0.45, 'comedy'),
      P('standard', 'The Producer In Her Ear', 0.45, 'acting'),
      P('standard', 'The Sports Desk', 0.45, 'comedy'),
      P('standard', 'The Traffic Helicopter', 0.45, 'comedy'),
      P('ensemble', 'The Autocue', 0.2, 'acting'),
      P('ensemble', 'The Caller On Line Two', 0.2, 'comedy'),
      P('ensemble', 'The Crawl Along The Bottom', 0.2, 'comedy'),
      P('ensemble', 'The Intern With The Coffee', 0.2, 'comedy'),
      P('ensemble', 'The Camera Two Operator', 0.2, 'comedy')] },
  { id: 'cruise', name: 'All At Sea', ensemble: true,
    blurb: 'A pleasure cruise, a missing captain, and the buffet closing early.', parts: [
      P('lead', 'The Cruise Director', 1.0, 'comedy'),
      P('featured', 'The Widow In Cabin One', 0.7, 'acting'),
      P('featured', 'The Lounge Singer', 0.7, 'comedy'),
      P('standard', 'The Ship Doctor', 0.45, 'acting'),
      P('standard', 'The Bingo Caller', 0.45, 'comedy'),
      P('standard', 'The Honeymooner', 0.45, 'comedy'),
      P('standard', 'The Stowaway', 0.45, 'acting'),
      P('ensemble', 'The Deckhand', 0.2, 'comedy'),
      P('ensemble', 'The Buffet Queue', 0.2, 'comedy'),
      P('ensemble', 'The Seasick One', 0.2, 'comedy'),
      P('ensemble', 'The Foghorn', 0.2, 'comedy'),
      P('ensemble', 'The Lifeboat Drill', 0.2, 'acting')] },
];

/**
 * A script for a room this size, and the shape that comes with it.
 *
 * An ensemble script needs a part for everybody, so it is only reachable while
 * the room is still big enough to fill one; below that the two-cast scenes are
 * the whole pool, which is also when they read best — six queens, one script,
 * everybody with something to do.
 */
/**
 * A script for tonight, and optionally for a SHAPE the author asked for.
 *
 * `want` is the timeline's `actFormat` pin, translated: 'ensemble' for one
 * production with a part for everybody, 'split' for the six-hander that runs
 * twice with the room cut in half. Null is the ordinary roll.
 *
 * The shape follows the script rather than the room, so pinning the shape has
 * to pin the script — asking for two casts and then drawing an ensemble would
 * cast twelve people in a six-part play and pad the rest. Where the ask cannot
 * be met (no ensemble is big enough for the room) the roll stands, because a
 * booking that silently produces a worse night is worse than one that does not
 * take.
 */
export function scriptFor(roomSize, rng, want = null) {
  const ensembles = ENSEMBLE_SCRIPTS.filter(s => s.parts.length >= roomSize);
  if (want === 'ensemble' && ensembles.length) {
    return ensembles[Math.floor(rng() * ensembles.length)];
  }
  if (want === 'split' && SCRIPTS.length) {
    return SCRIPTS[Math.floor(rng() * SCRIPTS.length)];
  }
  // Half and half while both are available. Neither shape should become the
  // acting challenge; the point is that a season can have one of each.
  const pool = ensembles.length && rng() < 0.5 ? ensembles : SCRIPTS;
  return pool[Math.floor(rng() * pool.length)];
}

// ── COMMERCIAL: PRODUCTS ──────────────────────────────────────────────
//
// A pair gets thirty seconds and a product that is difficult to sell. `angle`
// is the trap: the obvious approach that everybody reaches for and that never
// wins.
export const PRODUCTS = [
  { id: 'perfume', name: 'a perfume that smells like nothing', angle: 'everybody plays it as luxury and luxury is boring' },
  { id: 'mattress', name: 'a mattress with a hole in the middle', angle: 'the hole has to be a feature by the end' },
  { id: 'cereal', name: 'a breakfast cereal for adults only', angle: 'the wrong kind of adult is the easy joke' },
  { id: 'gym', name: 'a gym with one piece of equipment', angle: 'the temptation is to mock it rather than sell it' },
  { id: 'app', name: 'an app that tells you the time, badly', angle: 'nobody remembers a tagline about being late' },
  { id: 'cruise', name: 'a cruise that never leaves the harbour', angle: 'the sea is not the selling point and pretending it is fails' },
  { id: 'insurance', name: 'insurance against embarrassment', angle: 'a claim scene is funnier than a testimonial and most pairs pick the testimonial' },
  { id: 'furniture', name: 'flat-pack furniture with no instructions', angle: 'the frustration is universal and therefore not distinctive' },
  { id: 'water', name: 'bottled water from somewhere alarming', angle: 'the source is the joke and the joke expires in four seconds' },
  { id: 'dating', name: 'a dating service for people who hate people', angle: 'cynicism does not sell; commitment to the bit does' },
];

// ── IMPROV: PREMISES ──────────────────────────────────────────────────
//
// She is handed one of these cold, on stage, with no preparation. That is the
// mechanical difference from every other challenge in this family and the
// reason nerve matters more here than craft.
export const PREMISES = [
  { id: 'psychic', name: 'a psychic who is always slightly wrong' },
  { id: 'tour-guide', name: 'a tour guide of a building she has never entered' },
  { id: 'sommelier', name: 'a wine expert tasting tap water' },
  { id: 'newsreader', name: 'a newsreader whose autocue has failed' },
  { id: 'life-coach', name: 'a life coach whose own life is visibly collapsing' },
  { id: 'auctioneer', name: 'an auctioneer selling things nobody brought' },
  { id: 'translator', name: 'a translator who does not speak either language' },
  { id: 'weather', name: 'a weather presenter in a room with no windows' },
  { id: 'referee', name: 'a referee for a sport being invented live' },
  { id: 'therapist', name: 'a therapist who keeps making it about herself' },
  { id: 'curator', name: 'a museum curator describing an empty plinth' },
  { id: 'chef', name: 'a chef explaining a dish she has not cooked' },
];

export const scriptById = id => SCRIPTS.find(s => s.id === id) || null;
export const productById = id => PRODUCTS.find(p => p.id === id) || null;
export const premiseById = id => PREMISES.find(p => p.id === id) || null;
