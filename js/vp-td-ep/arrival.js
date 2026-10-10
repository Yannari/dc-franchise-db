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
import { premiereSteps } from './premiere.js';

// where each venue's cast arrives, and on what
const ARRIVE = {
  // Wawanakwa: the yacht brings the campers to the dock a few at a time (the user, 2026-10-08), the
  // first load seen out at sea on the way in
  'hosted-camp': { spot: 'dock', place: 'The Dock of Shame', ride: 'yacht', group: true, load: 4, sea: true, hello: (s, h) => `Yo! We're coming at you live from Camp Wawanakwa, somewhere in the middle of nowhere. I'm your host, ${h}, and this is ${s}!` },
  // Total Drama Action: one bus drops the whole cast at the lot (each one seen stepping out of its door),
  // then Chris rolls up in a tram
  'film-lot': { spot: 'studio-backlot', place: 'The Backlot', ride: 'bus', group: true, door: true, close: 'tram', hello: (s, h) => `Welcome to the film lot! I'm your host, ${h}, and this summer, the cameras never stop rolling. Lights, camera... ${s}!` },
  // World Tour: a bus to the landing strip, then the Jumbo Jet taxis in
  'world-tour': { spot: 'destination-staging', place: 'The Landing Strip', ride: 'bus', group: true, door: true, close: 'jet', hello: (s, h) => `Welcome to the airport! I'm your host, ${h}, and this season we're taking the show around the world. Next stop: everywhere. This is ${s}!` },
  // Disventure Camp 5: the cast lands on the beach by helicopter, the returning Favorites in a second one
  'survival-island': { spot: 'beach', place: 'Soluna Beach', ride: 'helicopter', group: true, back: 'helicopter', hello: (s, h) => `It's been a long time... but we're finally back! Welcome to Soluna. Sun, sand, and nowhere to hide. I'm your host, ${h}, and this is ${s}!` },
  // Disventure Camp 4: a helicopter per team lands at the fairground
  carnival: { spot: 'carnival-entrance', place: 'The Carnival Gate', ride: 'helicopter', group: true, byTeam: true, hello: (s, h) => `The carnival. Once a place of fun and games. Now? A battleground. Step right up! I'm your host, ${h}, and this is ${s}!` },
};
// the archetype as the show would put it on a card
const TAG = {
  mastermind: 'The Mastermind', schemer: 'The Schemer', hothead: 'The Hothead', 'challenge-beast': 'The Competitor',
  'social-butterfly': 'The Social Butterfly', 'loyal-soldier': 'The Loyal One', wildcard: 'The Wildcard', 'chaos-agent': 'The Chaos Agent',
  floater: 'The Floater', underdog: 'The Underdog', hero: 'The Hero', villain: 'The Villain', goat: 'The Easy Target',
  'perceptive-player': 'The Observer', showmancer: 'The Romantic',
};
const STAT = { physical: 'Strength', endurance: 'Endurance', mental: 'Brains', social: 'Charm', strategic: 'Strategy', loyalty: 'Loyalty', boldness: 'Guts', intuition: 'Instinct', temperament: 'Cool' };

const listOf = ns => ns.length < 2 ? ns.join('') : `${ns.slice(0, -1).join(', ')} and ${ns[ns.length - 1]}`;

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
  steps.push({ k: 'say', by: host, host: true, text: A.hello(season, host) });
  steps.push({ k: 'title', kicker: 'Episode one', name: season, faces: [] });
  // the season presented before anyone arrives: the venue zone by zone, empty, then this season's rules
  const pre = premiereSteps(venue, { host, season: o.season || (typeof window !== 'undefined' && window.seasonConfig) || {}, teams: (ep.tribesAtStart || []).map(t => t.name), cast: ep.dockArrivals.length });
  if (pre.length) { steps.push(...pre); scene([], { arrivals: true, card: true }); say0(host, `Okay! Enough about the place. Here come the people.`); }
  steps.push({ k: 'say', by: host, host: true, text: `Let's meet our ${ep.dockArrivals.length} contestants!` });
  function say0(by, text) { steps.push({ k: 'say', by, host: true, text }); }
  const teamOf = n => (ep.tribesAtStart || []).find(t => (t.members || []).includes(n))?.name || null;
  let lastRide = null, lastTeam = null, lastRet = null, inLoad = 0;
  // a team arrives together (one helicopter each at Stawaki); at Soluna the new players come first, the
  // returning Favorites after (their helicopter lands on the beach the new players are already on)
  const order = [...ep.dockArrivals];
  if (A.byTeam) order.sort((x, y) => String(teamOf(x.name)).localeCompare(String(teamOf(y.name))) || x.order - y.order);
  else if (A.back) order.sort((x, y) => (x.isReturnee ? 1 : 0) - (y.isReturnee ? 1 : 0) || x.order - y.order);
  // who rides together: a team, the returnees, or the next few off the yacht
  const loads = [];
  for (const a of order) {
    const ride = a.isReturnee && A.back ? A.back : A.ride;
    const team = A.byTeam ? teamOf(a.name) : null;
    const fresh = !loads.length || ride !== lastRide || (A.byTeam && team !== lastTeam) || (A.back && !!a.isReturnee !== lastRet) || inLoad >= (A.load || 99);
    if (fresh) { loads.push([]); inLoad = 0; }
    loads[loads.length - 1].push(a.name); inLoad++;
    lastRide = ride; lastTeam = team; lastRet = !!a.isReturnee;
  }
  const loadOf = n => loads.find(l => l.includes(n)) || [n];
  const door = A.door ? plateKey(venue, 'bus-door', 'day') : null;
  // the first load out at sea, on the yacht's deck, before it reaches the dock
  const sea = A.sea ? plateKey(venue, 'yacht', 'day') : null;
  if (sea && loads[0]) {
    const DECK = [[.235, .47], [.29, .468], [.345, .47], [.66, .445]];
    const first = loads[0].slice(0, DECK.length);
    steps.push({ k: 'scene', spot: 'yacht', tod: 'day', plate: sea, place: 'On the way in', time: 'Day one', focus: first, bg: [],
      places: Object.fromEntries(first.map((n, i) => [n, { u: DECK[i][0], v: DECK[i][1], s: .06, h: 7.5, aboard: true }])), bobAmp: 6 });
    steps.push({ k: 'beat', text: `The yacht cuts across the lake toward camp, ${listOf(first)} out on the deck.`, focus: first });
  }
  for (const a of order) {
    // what brings them: the venue's ride, a returnee's own; a group vehicle shows once per load
    const ride = a.isReturnee && A.back ? A.back : A.ride;
    const team = A.byTeam ? teamOf(a.name) : null;
    const load = loadOf(a.name);
    const newLoad = load[0] === a.name;
    const groupRide = (A.group || ride === 'helicopter') && ride !== 'walk';
    const showRide = groupRide ? newLoad : ride !== 'walk';
    const p = players.find(x => x.name === a.name) || {};
    const stats = Object.entries(p.stats || {}).filter(([k]) => STAT[k]).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => ({ k: STAT[k], v }));
    const reactor = a.dockReaction?.reactor && here.includes(a.dockReaction.reactor) ? a.dockReaction.reactor : null;
    if (showRide && groupRide) {
      // back to the arrival place first: the ride pulls in where the others are waiting
      const lastScene = [...steps].reverse().find(x => x.k === 'scene');
      if (lastScene && lastScene.spot !== A.spot) scene([]);
      const second = a.isReturnee && loads.indexOf(load) > 0;
      steps.push({ k: 'beat', text: ride === 'helicopter' ? (team ? `A helicopter comes in low over the fairground: the ${team} team.` : second ? `A second helicopter comes in over the trees with the returning players.` : `A helicopter drops out of the sky onto the sand.`)
        : ride === 'bus' ? `A battered bus wheezes to a stop. The doors fold open.` : ride === 'yacht' ? `The yacht pulls up to the dock with ${listOf(load)} on deck.` : `A boat noses up to the shore, packed with new faces.`,
        act: { kind: 'ride', ride, riders: ride === 'yacht' ? load : [] }, tense: false });
    }
    const intro = { k: 'intro', who: a.name, tag: TAG[a.archetype] || '', age: p.age || null, job: p.occupation || null, home: p.hometown || null,
      returnee: !!a.isReturnee, stats, n: here.length + 1, of: ep.dockArrivals.length, ride: A.ride };
    // off the bus: a close-up in its doorway, the card, then down onto the lot with everyone else
    if (door) {
      steps.push({ k: 'scene', spot: 'bus-door', tod: 'day', plate: door, place: A.place, time: 'Day one', focus: [a.name], bg: [], wide: true,
        places: { [a.name]: { u: .665, v: .99, s: .5, h: 76, close: true } }, act: { kind: 'step', who: [a.name] } });
      steps.push(intro);
    }
    scene([a.name, ...(reactor ? [reactor] : [])], { act: { kind: 'arrive', who: [a.name], ride: showRide && !groupRide ? ride : 'walk' } });
    if (!door) steps.push(intro);
    if (a.lines?.length) {
      // the arrival as a scene (td/story/arrival.js): the host, the newcomer, and whoever on the dock
      // has a reason to say something, each line its own beat
      for (const l of a.lines) {
        const text = cleanText(l.text);
        if (!text) continue;
        if (l.kind === 'beat') steps.push({ k: 'beat', text, focus: [a.name, ...(reactor ? [reactor] : [])] });
        else if (l.kind === 'conf') steps.push({ k: 'conf', by: l.by, text });
        else if (l.by === host) steps.push({ k: 'say', by: host, host: true, text, focus: [a.name] });
        else steps.push({ k: 'say', by: l.by, text, focus: l.by === a.name ? [a.name, ...(reactor ? [reactor] : [])] : [l.by, a.name], loud: /!/.test(text),
          ...(l.by === reactor ? { act: { kind: 'lean', who: [reactor, a.name] } } : {}) });
      }
    } else {
      if (a.hostLine) steps.push({ k: 'say', by: host, host: true, text: cleanText(a.hostLine), focus: [a.name] });
      if (a.playerLine) steps.push({ k: 'say', by: a.name, text: cleanText(a.playerLine), focus: [a.name], loud: /!/.test(a.playerLine) });
      if (reactor && a.dockReaction.text) steps.push({ k: 'say', by: reactor, text: cleanText(a.dockReaction.text), focus: [reactor, a.name], act: { kind: 'lean', who: [reactor, a.name] } });
    }
    here.push(a.name);
  }
  if (A.close === 'jet') { steps.push({ k: 'beat', text: `Chef rolls the Total Drama Jumbo Jet up the runway. It does not look safe.`, act: { kind: 'ride', ride: 'jet' } });
    steps.push({ k: 'say', by: host, host: true, text: `Everybody on board! Next stop: everywhere!` }); }
  if (A.close === 'tram') { steps.push({ k: 'beat', text: `${host} rolls up in a studio tram, waving like a parade float.`, act: { kind: 'ride', ride: 'tram' } });
    steps.push({ k: 'say', by: host, host: true, text: `Hop on! Time for the tour.` }); }
  steps.push({ k: 'title', kicker: 'The cast is complete', name: `${here.length} players`, faces: here.slice(-8) });
  return { id: 'arrivals', kind: 'arrivals', venue, ep: ep.num, label: 'Arrivals', host, steps };
}
