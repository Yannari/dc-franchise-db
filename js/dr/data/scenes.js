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
    P('ensemble', 'The Jury', 0.2, 'comedy')] },
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
