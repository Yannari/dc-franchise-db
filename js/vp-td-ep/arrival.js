// ══════════════════════════════════════════════════════════════════════
// js/vp-td-ep/arrival.js — episode one's arrivals, played like a game's character intro
// ══════════════════════════════════════════════════════════════════════
// The engine already wrote who arrives in what order and what they say (twists.js
// generateDockArrivals: ep.dockArrivals = [{ name, archetype, isReturnee, hostLine, playerLine,
// dockReaction: { reactor, text } }]). This screen stages it at each venue's own arrival place:
// the boat to Wawanakwa's dock, the bus at the lot, the jet on the runway, the canoe onto Soluna's
// beach, the walk through Stawaki's gate. Each newcomer gets a fighting-game style intro card (big
// portrait, name, the archetype in the show's words, three strongest stats), then the host's line,
// theirs, and whoever on the dock has something to say. The crowd on the dock grows as they come.
import { placeScene, plateKey, venueOf, cleanText } from './steps.js';

// where each venue's cast arrives, and on what
const ARRIVE = {
  // Total Drama Island: one boat per camper to the dock (returnees come in style: a yacht)
  'hosted-camp': { spot: 'dock', place: 'The Dock of Shame', ride: 'boat', back: 'yacht', hello: s => `Welcome to Camp Wawanakwa! I'm your host, and this is ${s}!` },
  // Total Drama Action: one bus drops the whole cast at the lot, then Chris rolls up in a tram
  'film-lot': { spot: 'studio-backlot', place: 'The Backlot', ride: 'bus', group: true, close: 'tram', hello: s => `Welcome to the film lot! Lights, camera... ${s}!` },
  // World Tour: everyone gathers on the runway, then the Jumbo Jet taxis in
  'world-tour': { spot: 'destination-staging', place: 'The Runway', ride: 'walk', close: 'jet', hello: s => `Welcome to the airport! Next stop: everywhere. This is ${s}!` },
  // Disventure Camp 5: the new players by boat, the returning Favorites by helicopter
  'survival-island': { spot: 'beach', place: 'Soluna Beach', ride: 'boat', group: true, back: 'helicopter', hello: s => `Welcome to Soluna! Sun, sand, and nowhere to hide. This is ${s}!` },
  // Disventure Camp 4: a helicopter per team lands at the fairground
  carnival: { spot: 'carnival-entrance', place: 'The Carnival Gate', ride: 'helicopter', group: true, byTeam: true, hello: s => `Welcome to the Stawaki Carnival! Step right up... this is ${s}!` },
};
// the archetype as the show would put it on a card
const TAG = {
  mastermind: 'The Mastermind', schemer: 'The Schemer', hothead: 'The Hothead', 'challenge-beast': 'The Competitor',
  'social-butterfly': 'The Social Butterfly', 'loyal-soldier': 'The Loyal One', wildcard: 'The Wildcard', 'chaos-agent': 'The Chaos Agent',
  floater: 'The Floater', underdog: 'The Underdog', hero: 'The Hero', villain: 'The Villain', goat: 'The Easy Target',
  'perceptive-player': 'The Observer', showmancer: 'The Romantic',
};
const STAT = { physical: 'Strength', endurance: 'Endurance', mental: 'Brains', social: 'Charm', strategic: 'Strategy', loyalty: 'Loyalty', boldness: 'Guts', intuition: 'Instinct', temperament: 'Cool' };

export function hasArrivals(ep) { return ep?.num === 1 && (ep.dockArrivals || []).length > 0; }

export function tdArrivalScreen(ep, o = {}) {
  if (!hasArrivals(ep)) return null;
  const venue = venueOf(ep, o);
  const A = ARRIVE[venue] || ARRIVE['hosted-camp'];
  const plate = plateKey(venue, A.spot, 'day') || plateKey(venue, A.spot, 'night');
  if (!plate) return null;
  const host = o.host || 'Chris';
  const season = o.seasonName || (typeof window !== 'undefined' && window.seasonConfig?.name) || 'Total Drama';
  const players = (typeof window !== 'undefined' && window.players) || [];
  const steps = [];
  const here = [];
  const scene = (focus, extra = {}) => steps.push({ k: 'scene', spot: A.spot, tod: 'day', plate, place: A.place, time: 'Day one', card: !steps.length, focus,
    bg: here.filter(n => !focus.includes(n)).slice(-8).map(n => ({ n, act: null })),
    places: placeScene(plate, focus, here.filter(n => !focus.includes(n)).slice(-8), { host }), ...extra });
  // the host alone, before anyone arrives
  scene([], { arrivals: true });
  steps.push({ k: 'say', by: host, host: true, text: A.hello(season) });
  steps.push({ k: 'title', kicker: 'Episode one', name: season, faces: [] });
  steps.push({ k: 'say', by: host, host: true, text: `Let's meet our ${ep.dockArrivals.length} contestants!` });
  const teamOf = n => (ep.tribesAtStart || []).find(t => (t.members || []).includes(n))?.name || null;
  let lastRide = null, lastTeam = null;
  // a team arrives together (one helicopter each at Stawaki); at Soluna the new players come first, the
  // returning Favorites after (their helicopter lands on the beach the new players are already on)
  const order = [...ep.dockArrivals];
  if (A.byTeam) order.sort((x, y) => String(teamOf(x.name)).localeCompare(String(teamOf(y.name))) || x.order - y.order);
  else if (A.back) order.sort((x, y) => (x.isReturnee ? 1 : 0) - (y.isReturnee ? 1 : 0) || x.order - y.order);
  for (const a of order) {
    // what brings them: the venue's ride, a returnee's own, a group vehicle only once per load
    const ride = a.isReturnee && A.back ? A.back : A.ride;
    const team = A.byTeam ? teamOf(a.name) : null;
    const newLoad = ride !== lastRide || (A.byTeam && team !== lastTeam);
    const groupRide = (A.group || ride === 'helicopter') && ride !== 'walk';
    const showRide = groupRide ? newLoad : ride !== 'walk';
    lastRide = ride; lastTeam = team;
    const p = players.find(x => x.name === a.name) || {};
    const stats = Object.entries(p.stats || {}).filter(([k]) => STAT[k]).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => ({ k: STAT[k], v }));
    const reactor = a.dockReaction?.reactor && here.includes(a.dockReaction.reactor) ? a.dockReaction.reactor : null;
    if (showRide && groupRide) steps.push({ k: 'beat', text: ride === 'helicopter' ? (team ? `A helicopter comes in low over the fairground: the ${team} team.` : `A helicopter drops out of the sky onto the sand.`) : ride === 'bus' ? `A battered bus wheezes to a stop. The doors fold open.` : `A boat noses up to the shore, packed with new faces.`,
      act: { kind: 'ride', ride }, tense: false });
    scene([a.name, ...(reactor ? [reactor] : [])], { act: { kind: 'arrive', who: [a.name], ride: showRide && !groupRide ? ride : 'walk' } });
    steps.push({ k: 'intro', who: a.name, tag: TAG[a.archetype] || '', age: p.age || null, job: p.occupation || null, home: p.hometown || null,
      returnee: !!a.isReturnee, stats, n: here.length + 1, of: ep.dockArrivals.length, ride: A.ride });
    if (a.hostLine) steps.push({ k: 'say', by: host, host: true, text: cleanText(a.hostLine), focus: [a.name] });
    if (a.playerLine) steps.push({ k: 'say', by: a.name, text: cleanText(a.playerLine), focus: [a.name], loud: /!/.test(a.playerLine) });
    if (reactor && a.dockReaction.text) steps.push({ k: 'say', by: reactor, text: cleanText(a.dockReaction.text), focus: [reactor, a.name], act: { kind: 'lean', who: [reactor, a.name] } });
    here.push(a.name);
  }
  if (A.close === 'jet') { steps.push({ k: 'beat', text: `Chef rolls the Total Drama Jumbo Jet up the runway. It does not look safe.`, act: { kind: 'ride', ride: 'jet' } });
    steps.push({ k: 'say', by: host, host: true, text: `Everybody on board! Next stop: everywhere!` }); }
  if (A.close === 'tram') { steps.push({ k: 'beat', text: `${host} rolls up in a studio tram, waving like a parade float.`, act: { kind: 'ride', ride: 'tram' } });
    steps.push({ k: 'say', by: host, host: true, text: `Hop on! Time for the tour.` }); }
  steps.push({ k: 'title', kicker: 'The cast is complete', name: `${here.length} players`, faces: here.slice(-8) });
  return { id: 'arrivals', kind: 'arrivals', venue, ep: ep.num, label: 'Arrivals', host, steps };
}
