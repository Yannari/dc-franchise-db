// ══════════════════════════════════════════════════════════════════════
// js/vp-td-ep/premiere.js — the season's first minutes: the pitch, the place, the rules, then the people
// ══════════════════════════════════════════════════════════════════════
// The user (2026-10-09): "for the first episode a real presentation of the season: present the
// venue with all the zones, empty, like a real show; then the season twist, before calling the
// people", and then "the dialogue is pretty bad: check the transcript of a first episode".
//
// What the premieres do (Disventure Camp 4's "Come One, Come All", Total Drama Island's "Not So
// Happy Campers"): the host sells the season straight to camera, with stakes and energy (how many
// people, the teams, the challenges, the elements, "and each other", how somebody goes home every
// time, only one left standing, "52 days, 18 people, 1 winner!"); shows the place off with a joke
// or a threat for each corner of it; and drops the twists as quick asides ("the hidden Immunity
// Totem is in play, so first come, first served"). arrival.js plays this before anyone arrives.
//
// PURE: the venue and the season's settings in, steps out. Every rule it says is a setting the
// season was created with.
import { plateKey, VENUES, placeName, teamSpot } from './steps.js';
import { mapZones, ZONE_OF, ZONE_LABEL } from './map.js';

const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four'];
const num = n => WORD[n] || String(n);
const Cap = t => t.charAt(0).toUpperCase() + t.slice(1);

// how somebody goes home here, in the venue's own words
const GO_HOME = {
  'hosted-camp': "Lose a challenge, and your team meets me at the campfire. Everybody who's safe gets a marshmallow. Whoever doesn't get one walks the Dock of Shame, catches the Boat of Losers, and never comes back. Ever.",
  'film-lot': "Lose, and your team comes to the Gilded Chris Awards. Everybody safe gets a statue. Whoever doesn't walks the Walk of Shame and takes the Lame-o-sine home.",
  'world-tour': "Lose, and your team flies straight to the Barf Bag Ceremony. No barf bag for you? Then you take the Drop of Shame. With a parachute. Probably.",
  'survival-island': "Lose a challenge, and your team faces the Elimination Trial. Every time, one of you goes home.",
  carnival: "Lose, and your team comes to the Elimination Trial. Somebody gets a one-way ride on the Boat of Losers. Every single time.",
};
const WHERE = { 'hosted-camp': 'Camp Wawanakwa', 'film-lot': 'the film lot', 'world-tour': 'thirty thousand feet', 'survival-island': 'Soluna Island', carnival: 'the Stawaki Carnival' };

// what the host says about each place as the camera finds it empty: a joke, a threat, or both
const TOUR = {
  // Wawanakwa
  'communal-grounds': "The heart of camp. You'll eat here, fight here, and make friends here that you'll stab in the back later.",
  cabins: "Your cabins. Boys on one side, girls on the other. The bunks are brand new. The mattresses are not.",
  'mess-hall': "The mess hall, where Chef serves three meals a day. He used to cook for the army. I don't ask which army.",
  washroom: "The communal washrooms. One mirror, one shower, and the hot water lasts about four seconds.",
  confessional: "And this is the confessional. Vent about your teammates, spill your secrets, confess your undying love. The whole country gets to hear it. So, eventually, does everyone you talked about.",
  dock: "The dock. You'll walk down it at least once. Hopefully not on your way out.",
  beach: "The beach. Great for a tan. Also great for challenges.",
  'forest-trail': "The woods. Lots of trees, lots of places to hide things, and lots of things that bite.",
  cliff: "And that's the cliff. You'll be jumping off it. Not today. But soon.",
  lake: "The lake. Crystal clear, perfectly safe, and I'm legally required to stop the sentence there.",
  boathouse: "The boathouse. Nobody goes in the boathouse. Trust me on this one.",
  waterfall: "The waterfall. Beautiful to look at. Less beautiful to go over.",
  caves: "The caves. Dark, damp, and nobody who went in last season wants to talk about it.",
  amphitheater: "The amphitheater. Some challenges need an audience. Some need a place to scream. This one does both.",
  river: "The river. Fast, freezing, and coming soon to a challenge near you.",
  // the film lot
  trailers: "Your trailers. They look very glamorous from out here. Don't look inside.",
  'craft-services': "Craft services. Free food all day, which, trust me, is the only free thing on this lot.",
  'studio-backlot': "The backlot. Most of your challenges happen out here, in front of the cameras, where you belong.",
  'soundstage-corridor': "The soundstages. Something's always filming in there, and something's usually on fire.",
  'prop-storage': "Prop storage. If something goes missing on this lot, it's in here.",
  'western-set': "The western set. Saloon doors, tumbleweeds, a horse who hates everyone. The works.",
  'city-set': "The city set. Fake buildings, real danger.",
  // the jet
  economy: "Economy class. This is where you'll live. All of you. Together. With one bathroom.",
  'first-class': "First class. Massage chairs, real food, and only the winning team gets to sleep here. Everybody else gets to watch.",
  galley: "The galley, where Chef cooks your meals. Loosely speaking.",
  'cargo-hold': "The cargo hold. Don't ask what else is down there.",
  aisle: "The aisle. It's narrow, so try not to stab each other in the back. Literally.",
  cockpit: "The cockpit, where Chef flies this thing. No, he doesn't have a licence. Yes, that's fine.",
  'chris-quarters': "My private quarters. Off limits. Very, very off limits.",
  'destination-staging': "And every week, we land somewhere new, and somebody doesn't get back on the plane.",
  // Soluna
  shelter: "Your shelter. Or it will be, once you build it yourselves. It's all you've got out here.",
  campfire: "The fire pit. Keep the fire going, or eat everything raw. Your choice.",
  shoreline: "The shoreline. Gorgeous, until the tide comes in.",
  'water-source': "Your water. Boil it before you drink it, unless you enjoy surprises.",
  'jungle-trail': "The bamboo jungle. Easy to get lost in. Even easier to get lost in on purpose.",
  'fishing-area': "The fishing spot. You catch dinner, or you don't eat dinner.",
  ruins: "The old ruins. Ancient, crumbling, and almost definitely cursed.",
  cave: "The cave. Bring a torch. Bring a friend. Bring a friend you can outrun.",
  // Stawaki
  campsite: "Your campsite, right outside the fairground. Cosy. Ish.",
  'forest-edge': "The edge of the woods, where people go to talk when they don't want to be heard. It never works.",
  'rocky-beach': "The rocky beach. Not a lot of sand. A lot of rocks.",
  'lake-shore': "The lake shore. Lovely for a swim, if you don't mind the company.",
  'carnival-entrance': "The front gate of the carnival. Closed for years. Open again, just for you.",
  midway: "The midway. Games, rides, and a lot of ways to lose. Most of them rigged.",
  carousel: "The carousel. It still works. Mostly.",
  'corn-maze': "The corn maze. Go in at your own risk. Coming out is a separate risk.",
  'haunted-mansion': "The haunted mansion. Yes, it's actually haunted. No, that's not a joke.",
  'theater-tent': "The theater tent. Every great carnival needs a show, and you're it.",
};
// the order a host walks a place: where they'll live first, then the rest of it, the confessional last
const WALK = ['communal-grounds', 'campsite', 'carnival-entrance', 'cabins', 'trailers', 'economy', 'shelter', 'mess-hall', 'craft-services', 'galley', 'washroom', 'first-class',
  'campfire', 'dock', 'beach', 'shoreline', 'rocky-beach', 'lake', 'lake-shore', 'water-source', 'fishing-area', 'forest-trail', 'forest-edge', 'jungle-trail', 'studio-backlot',
  'midway', 'carousel', 'western-set', 'city-set', 'soundstage-corridor', 'prop-storage', 'cargo-hold', 'aisle', 'river', 'waterfall', 'caves', 'cave', 'ruins', 'corn-maze',
  'haunted-mansion', 'theater-tent', 'boathouse', 'amphitheater', 'cliff', 'cockpit', 'chris-quarters', 'destination-staging', 'confessional'];
const walkRank = p => { const i = WALK.indexOf(p); return i < 0 ? WALK.length - 1 : i; };
// a venue's own version of a place everyone has
const TOUR_AT = {
  'hosted-camp': { campfire: "And the campfire pit, where you'll come every time you lose, and where somebody goes home. But we'll get to that." },
  carnival: { shelter: "Your shelter. Build it well, because it gets cold out here at night." },
};
// the place inside a zone the camera shows (a zone may hold more than one place: the cabins' porch and inside)
function placeOfZone(venue, zone) {
  const own = Object.entries(ZONE_OF[venue] || {}).filter(([, z]) => z === zone).map(([p]) => p);
  const order = own.includes(zone) ? [zone, ...own.filter(p => p !== zone)] : own.length ? own : [zone];
  for (const p of order) for (const s of [teamSpot(venue, p, 0), p]) if (plateKey(venue, s, 'day')) return { place: p, key: plateKey(venue, s, 'day') };
  return null;
}

/**
 * The pitch, the tour and the season's rules, as steps. o: { host, season (the season's settings),
 * teams, cast (how many are about to arrive), back (how many of them are returnees) }. arrival.js calls this after the host's welcome.
 */
export function premiereSteps(venue, o = {}) {
  const host = o.host || 'Chris';
  const S = o.season || {};
  const V = VENUES[venue] || VENUES['hosted-camp'];
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  const show = (key, place, time = 'Day one') => steps.push({ k: 'scene', spot: key.split('/')[1].replace(/-(day|night)$/, ''), tod: /-night$/.test(key) ? 'night' : 'day', plate: key, place, time, card: false, cut: false, focus: [], bg: [], places: {}, wide: true });
  const teams = (o.teams || []).filter(Boolean);
  const n = o.cast || 0;

  // ── the pitch, straight to camera ──
  // who is coming: all new, all back (an all-stars season), or a mix — never "brand-new" over a returnee
  const back = Math.min(o.back || 0, n);
  const fresh = n - back;
  const who = !n ? (back ? 'Our cast is' : 'A brand-new cast is')
    : !back ? `${Cap(num(n))} brand-new contestants are`
    : !fresh ? `${Cap(num(n))} familiar faces, all of them back for another shot, are`
    : `${Cap(num(n))} contestants, ${num(fresh)} brand-new and ${num(back)} who've been here before, are`;
  say(`Here's the deal. ${who} about to move in right here at ${WHERE[venue] || 'camp'}${teams.length >= 2 ? `, split into ${num(teams.length)} teams` : ''}.`);
  if (back && !fresh) say(`They've all played before, they all know the game, and this time nobody gets to say they didn't see it coming.`);
  else if (back) say(`And trust me, the ones who've been here before haven't forgotten a thing. Neither have I.`);
  say(`They'll face challenges, the elements, and worst of all... each other.`);
  say(GO_HOME[venue] || GO_HOME['hosted-camp']);
  say(`In the end, only one of them will be left standing, with the prize, the glory, and a lot of people who don't talk to them anymore.`);
  say(n ? `${Cap(num(n))} people. One winner. But first, let me show you around.` : `But first, let me show you around.`);

  // ── the tour: every zone on the map, empty ──
  const zones = Object.entries(mapZones(venue)).filter(([, Z]) => !Z.rival).sort(([a], [b]) => walkRank(placeOfZone(venue, a)?.place || a) - walkRank(placeOfZone(venue, b)?.place || b));
  const seen = new Set();
  for (const [zone, Z] of zones) {
    const at = placeOfZone(venue, zone);
    if (!at || seen.has(at.key)) continue;
    seen.add(at.key);
    show(at.key, Z.label || ZONE_LABEL[zone] || placeName(at.place));
    say(TOUR_AT[venue]?.[at.place] || TOUR[at.place] || TOUR[zone] || `And this is ${Z.label || placeName(at.place)}.`);
  }
  // ...and where somebody goes home
  const cer = plateKey(venue, 'ceremony', 'night');
  if (cer) {
    show(cer, V.ceremony || 'The Ceremony', 'Every week');
    say(V.item ? `And this is where it all ends. ${V.ceremony}. Get a ${V.item}, and you're safe. Don't get one... and you're gone.`
      : `And this is where it all ends. ${V.ceremony}. Every time your team loses, you sit right here, and one of you doesn't leave the way you came in.`, { tense: true });
  }

  // ── the twists, as the asides they are on the show ──
  const asides = [];
  if (S.ri) asides.push(S.riFormat === 'rescue'
    ? { name: 'Rescue Island', plate: plateKey('redemption', 'map', 'day'), place: 'Boney Island', lines: [`Oh, and getting voted off this season? Not necessarily the end. The voted-out go to Rescue Island, and if they can survive out there, one of them might just win their way back in.`] }
    : { name: 'Redemption Island', plate: plateKey('redemption', 'map', 'day'), place: 'Boney Island', lines: [`Oh, and getting voted off this season? Not necessarily the end. You'll get one last choice: go home, or grab a torch and head to Redemption Island.`, `Out there, you duel. Lose, and you're gone for good. Keep winning, and one day you walk right back into this game.`] });
  if (S.exile) asides.push({ name: 'Exile Island', plate: plateKey('islands', 'skull-rock', 'day'), place: 'Exile Island', lines: [`Some of you will get a little vacation on Exile Island. Alone. No food, no friends, no team. But there might be something hidden out there, if you look hard enough.`] });
  const adv = S.advantages || {};
  if (Object.values(adv).some(a => a && (a === true || a.enabled))) asides.push({ name: 'Hidden immunity idols', lines: [`The hidden immunity idols are in play, too. Find one, and it can save you. So, first come, first served.`] });
  if (S.mole && S.mole !== 'disabled') asides.push({ name: 'The Mole', lines: [`And one of you isn't here to win at all. One of you works for me, and will be quietly ruining everything the rest of you do. Have fun figuring out who.`] });
  if (S.coaches && S.coaches !== 'disabled') asides.push({ name: 'The Coaches', lines: [`Every team gets a coach this season. Somebody who's been through all this before, and who will absolutely yell at you.`] });
  if (S.foodWater && S.foodWater !== 'disabled') asides.push({ name: 'Survival', lines: [`And nobody's feeding you this time. You want dinner? Go catch it.`] });
  const fin = S.finaleFormat || 'traditional';
  asides.push(fin === 'fan-vote' ? { name: 'The fans decide', lines: [`And at the very end, the fans at home pick the winner. So smile for the camera.`] }
    : /challenge/.test(fin) ? { name: 'The final challenge', lines: [`And at the very end, it all comes down to one final challenge. Winner takes everything.`] }
      : { name: 'The jury decides', lines: [`And remember: everyone you vote off comes back at the end to vote for the winner. So be nice to them. Or don't. That's way better TV.`] });
  asides.forEach((r, i) => {
    if (r.plate) show(r.plate, r.place || r.name);
    steps.push({ k: 'title', kicker: i === asides.length - 1 ? 'How to win' : 'This season', name: r.name, faces: [] });
    for (const l of r.lines) say(l);
  });
  return steps;
}
