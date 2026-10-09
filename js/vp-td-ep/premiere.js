// ══════════════════════════════════════════════════════════════════════
// js/vp-td-ep/premiere.js — the season's first minutes: the place, then the rules, then the people
// ══════════════════════════════════════════════════════════════════════
// The user (2026-10-09): "for the first episode a real presentation of the season: present the
// island / venue with all the zones, empty obviously, like a real show; then if there's a season
// twist present it too, before calling the people." The host walks the venue before anyone arrives
// (every zone on the venue's map, on its own empty set), ends at the place where somebody leaves
// every week, then reads out how this season works (the teams, Redemption or Rescue Island, Exile
// Island, a mole, the coaches, how the winner is decided). arrival.js plays this before the first
// contestant arrives.
//
// PURE: the venue and the season's settings in, steps out. Nothing here decides anything; every
// rule it reads out is a setting the season was created with.
import { plateKey, VENUES, placeName, teamSpot } from './steps.js';
import { mapZones, ZONE_OF, ZONE_LABEL } from './map.js';

// what the host says about each place, as the camera finds it empty
const TOUR = {
  // Wawanakwa
  'communal-grounds': "The camp grounds. This is where you'll live, fight, and make friends you'll betray later.",
  cabins: "Your cabins. Bunk beds, no air conditioning, and a wildlife situation I'm not allowed to discuss.",
  'mess-hall': "The mess hall. Chef serves three meals a day. I'd eat before you get here.",
  washroom: 'The communal washrooms. Hot water is more of a rumour.',
  confessional: 'The confessional. Tell the camera everything. Everyone watching at home will hear it, and so will everyone here, eventually.',
  dock: "The dock. You'll walk down it once, on your way out.",
  beach: 'The beach. Swim at your own risk.',
  'forest-trail': 'The woods. Lots of trees, and lots of places to hide things.',
  cliff: "The cliff. You'll get to know it much better than you want to.",
  lake: "The lake. Don't ask what lives in it.",
  boathouse: 'The boathouse. Nobody goes in the boathouse.',
  waterfall: 'The waterfall. Lovely to look at. Less lovely to fall down.',
  caves: 'The caves. Dark, damp, and full of things nobody has named yet.',
  amphitheater: 'The amphitheater, for the challenges that need an audience.',
  river: 'The river. Fast, cold, and in a challenge near you soon.',
  // the film lot
  trailers: "Your trailers. Very glamorous from the outside. Don't look inside.",
  'craft-services': "Craft services. Free food, which is the only thing around here that's free.",
  'studio-backlot': "The backlot, where you'll do most of your challenges.",
  'soundstage-corridor': "The soundstages. Something is always filming, and something's usually on fire.",
  'prop-storage': "Prop storage. If you lose something, it's in here.",
  'western-set': 'The western set. Saloon doors, tumbleweeds, the works.',
  'city-set': 'The city set. Fake buildings, real danger.',
  // the jet
  economy: "Economy class. This is where you'll sleep. All of you.",
  'first-class': 'First class. You have to win your way in here.',
  galley: 'The galley, where the food is cooked. Loosely speaking.',
  'cargo-hold': "The cargo hold. Don't ask what else is down there.",
  aisle: "The aisle. It's narrow, so try not to stab each other in the back. Literally.",
  cockpit: 'The cockpit. Off limits.',
  'chris-quarters': 'My private quarters. Very off limits.',
  'destination-staging': 'And every week, we land somewhere new.',
  // Soluna
  shelter: "Your shelter. You'll build it yourselves. It's all you've got.",
  campfire: 'The fire. Keep it going, or eat everything raw.',
  shoreline: 'The shoreline. Pretty, until the tide comes in.',
  'water-source': 'Your water. Boil it before you drink it, unless you enjoy surprises.',
  'jungle-trail': 'The bamboo jungle. Easy to get lost in. Easier to get lost in on purpose.',
  'fishing-area': "The fishing spot. Catch your dinner, or don't eat it.",
  ruins: 'The ruins. Old, crumbling, and probably cursed.',
  cave: 'The cave. Bring a torch.',
  // Stawaki
  campsite: 'Your campsite, just outside the fairground.',
  'forest-edge': 'The edge of the woods. People will go there to talk where nobody can hear.',
  'rocky-beach': 'The rocky beach. Not a lot of sand. A lot of rocks.',
  'lake-shore': 'The lake shore.',
  'carnival-entrance': 'The front gate of the carnival.',
  midway: 'The midway. Games, rides, and a lot of ways to lose.',
  carousel: 'The carousel. It still works. Mostly.',
  'corn-maze': 'The corn maze. Go in at your own risk.',
  'haunted-mansion': "The haunted mansion. Yes, it's haunted.",
  'theater-tent': 'The theater tent.',
};
// a venue's own version of a place everyone has (Wawanakwa's campfire is a pit, not the cooking fire)
const TOUR_AT = { 'hosted-camp': { campfire: "The campfire pit. Good for roasting marshmallows, and for talking about each other behind your backs." }, carnival: { shelter: 'Your shelter. Build it well, because it gets cold out here at night.' } };
// the place inside a zone the camera shows (a zone may hold more than one place: the cabins' porch and inside)
function placeOfZone(venue, zone) {
  const own = Object.entries(ZONE_OF[venue] || {}).filter(([, z]) => z === zone).map(([p]) => p);
  const order = own.includes(zone) ? [zone, ...own.filter(p => p !== zone)] : own.length ? own : [zone];
  for (const p of order) for (const s of [teamSpot(venue, p, 0), p]) if (plateKey(venue, s, 'day')) return { place: p, key: plateKey(venue, s, 'day') };
  return null;
}

/**
 * The tour and the season's rules, as steps. o: { host, season (the season's settings), teams }.
 * The arrival screen calls this right after the host's welcome.
 */
export function premiereSteps(venue, o = {}) {
  const host = o.host || 'Chris';
  const S = o.season || {};
  const V = VENUES[venue] || VENUES['hosted-camp'];
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  const show = (key, place, time = 'Day one') => steps.push({ k: 'scene', spot: key.split('/')[1].replace(/-(day|night)$/, ''), tod: /-night$/.test(key) ? 'night' : 'day', plate: key, place, time, card: false, cut: false, focus: [], bg: [], places: {}, wide: true });

  // ── the tour: every zone on the map, empty ──
  const zones = Object.entries(mapZones(venue)).filter(([, Z]) => !Z.rival).sort(([, a], [, b]) => a.u - b.u);
  const seen = new Set();
  if (zones.length) say(`Before anybody gets here, let me show you around.`);
  for (const [zone, Z] of zones) {
    const at = placeOfZone(venue, zone);
    if (!at || seen.has(at.key)) continue;
    seen.add(at.key);
    show(at.key, Z.label || ZONE_LABEL[zone] || placeName(at.place));
    say(TOUR_AT[venue]?.[at.place] || TOUR[at.place] || TOUR[zone] || `This is ${Z.label || placeName(at.place)}.`);
  }
  // ...and the place where somebody goes home every week
  const cer = plateKey(venue, 'ceremony', 'night');
  if (cer) {
    show(cer, V.ceremony || 'The Ceremony', 'Every week');
    say(`And this is the most important place on the whole ${venue === 'world-tour' ? 'plane' : venue === 'film-lot' ? 'lot' : venue === 'carnival' ? 'fairground' : 'island'}. Every time you lose, you come here, and one of you goes home.`, { tense: true });
  }

  // ── the season's rules ──
  const rules = [];
  const teams = (o.teams || []).filter(Boolean);
  if (teams.length >= 2) rules.push({ kicker: 'The teams', name: teams.join(' vs ').slice(0, 60), lines: [`You'll be split into ${teams.length === 2 ? 'two' : teams.length === 3 ? 'three' : teams.length} teams. Win as a team, or vote somebody off as a team.`] });
  if (S.ri) {
    const rescue = S.riFormat === 'rescue';
    rules.push({ kicker: 'Season twist', name: rescue ? 'Rescue Island' : 'Redemption Island', plate: plateKey('redemption', 'map', 'day') || plateKey('islands', 'skull-rock', 'day'), place: 'Boney Island',
      lines: rescue
        ? [`Getting voted out does not mean you are done. The voted-out go to Rescue Island, where you'll wait, train, and fight for a way back in.`, `Every so often, the people on Rescue Island compete, and the winner comes back into the game.`]
        : [`Getting voted out does not mean you are done. You'll get one final choice: go home, or take a torch to Redemption Island.`, `On Redemption Island, you'll duel whoever else is out there. Lose a duel, and you are gone for good. Keep winning, and one day you walk back into this game.`] });
  }
  if (S.exile) rules.push({ kicker: 'Season twist', name: 'Exile Island', plate: plateKey('islands', 'skull-rock', 'day'), place: 'Exile Island',
    lines: [`Every week, somebody gets sent to Exile Island. Alone. No team, no food, nobody to talk to.`, `But there might be something out there worth finding.`] });
  if (S.mole && S.mole !== 'disabled') rules.push({ kicker: 'Season twist', name: 'The Mole', lines: [`One more thing. One of you isn't here to win. One of you is working for me, and sabotaging everything you do.`, `Find the Mole, and maybe you stop them. Trust the wrong person, and you'll never know what hit you.`] });
  if (S.coaches && S.coaches !== 'disabled') rules.push({ kicker: 'Season twist', name: 'The Coaches', lines: [`This season, every team has a coach. Somebody who has played this game before, and who wants their team to win almost as much as you do.`] });
  if (S.foodWater && S.foodWater !== 'disabled') rules.push({ kicker: 'Season rule', name: 'Survival', lines: [`And this season, nobody's feeding you. Find your own food, find your own water, and keep each other alive.`] });
  const adv = S.advantages || {};
  if (Object.values(adv).some(a => a && (a === true || a.enabled))) rules.push({ kicker: 'Season rule', name: 'Hidden advantages', lines: [`Hidden around this place are idols and advantages. Find one, and it could save you. Tell the wrong person you have it, and it could cost you everything.`] });
  const fin = S.finaleFormat || 'traditional';
  rules.push({ kicker: 'How to win', name: fin === 'fan-vote' ? 'The fans decide' : /challenge/.test(fin) ? 'The final challenge' : 'The jury decides',
    lines: [fin === 'fan-vote' ? `At the very end, it's not up to the people you voted out. The fans at home pick the winner.`
      : /challenge/.test(fin) ? `At the very end, the last ones standing face one final challenge. Win it, and you win everything.`
        : `At the very end, the people you voted out come back as the jury, and they decide who wins. So be careful how you send them home.`] });
  if (rules.length) {
    say(`Now, the rules.`);
    for (const r of rules) {
      if (r.plate) show(r.plate, r.place || r.name);
      steps.push({ k: 'title', kicker: r.kicker, name: r.name, faces: [] });
      for (const l of r.lines) say(l);
    }
  }
  return steps;
}
