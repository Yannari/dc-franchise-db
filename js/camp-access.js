// Venue-aware camp time and conversation access.
//
// This module owns WHERE and WHEN people can realistically interact. It does
// not decide what they want to discuss; persistent-strategy code can request an
// opportunity through findConversationAccess without importing camp events.
import { gs, seasonConfig } from './core.js';

const freezeLocations = list => Object.freeze(list.map(location => Object.freeze(location)));

// Locations are deliberately franchise-specific. A physical island is not one
// universal venue: hosted Total Drama camp and a Survivor/DC survival island
// have different infrastructure and social routines.
export const ACCESS_PROFILES = Object.freeze({
  'hosted-camp': freezeLocations([
    { id:'communal-grounds', label:'Camp grounds', access:'everyday', privacy:0.10, overhear:0.85, capacity:20, public:true },
    { id:'cabins', label:'Cabins', access:'everyday', privacy:0.45, overhear:0.45, capacity:8 },
    { id:'mess-hall', label:'Mess hall', access:'everyday', privacy:0.10, overhear:0.90, capacity:20 },
    { id:'dock', label:'Dock', access:'everyday', privacy:0.40, overhear:0.45, capacity:6 },
    { id:'campfire', label:'Campfire', access:'everyday', privacy:0.05, overhear:0.95, capacity:20 },
    { id:'forest-trail', label:'Forest trail', access:'everyday', privacy:0.75, overhear:0.20, capacity:3 },
  ]),
  'survival-island': freezeLocations([
    { id:'shelter', label:'Shelter', access:'everyday', privacy:0.25, overhear:0.70, capacity:12 },
    { id:'campfire', label:'Campfire', access:'everyday', privacy:0.05, overhear:0.95, capacity:20, public:true },
    { id:'beach', label:'Beach', access:'everyday', privacy:0.20, overhear:0.65, capacity:20 },
    { id:'shoreline', label:'Shoreline', access:'everyday', privacy:0.50, overhear:0.35, capacity:5 },
    { id:'water-source', label:'Water source', access:'everyday', privacy:0.55, overhear:0.40, capacity:4 },
    { id:'jungle-trail', label:'Jungle trail', access:'everyday', privacy:0.80, overhear:0.18, capacity:3 },
    { id:'fishing-area', label:'Fishing area', access:'everyday', privacy:0.65, overhear:0.25, capacity:3 },
  ]),
  // Disventure Camp 4: Carnival of Chaos — Stawaki-specific safe locations.
  // Attractions exist but are not casual downtime spaces unless an episode
  // explicitly opens them.
  carnival: freezeLocations([
    { id:'campsite', label:'Team campsite', access:'everyday', privacy:0.15, overhear:0.80, capacity:12, public:true },
    { id:'shelter', label:'Team shelter', access:'everyday', privacy:0.35, overhear:0.60, capacity:9 },
    { id:'forest-edge', label:'Forest near camp', access:'everyday', privacy:0.70, overhear:0.25, capacity:4 },
    { id:'rocky-beach', label:'Rocky beach', access:'everyday', privacy:0.55, overhear:0.35, capacity:5 },
    { id:'lake-shore', label:'Lake shore', access:'everyday', privacy:0.60, overhear:0.30, capacity:4 },
    { id:'carnival-entrance', label:'Carnival entrance', access:'everyday', privacy:0.15, overhear:0.75, capacity:12 },
    { id:'midway', label:'The midway', access:'everyday', privacy:0.25, overhear:0.65, capacity:10 },
    { id:'trial-area', label:'Elimination Trial area', access:'restricted', privacy:0.05, overhear:1, capacity:20 },
    { id:'haunted-mansion', label:'Stawaki Haunted Mansion', access:'episode-opened', privacy:0.75, overhear:0.30, capacity:10, opensWith:['isHauntedHouse'] },
    { id:'corn-maze', label:'Corn maze', access:'episode-opened', privacy:0.85, overhear:0.15, capacity:10, opensWith:['isMazeOfTheFallen'] },
    { id:'theater-tent', label:'Theater Tent', access:'episode-opened', privacy:0.50, overhear:0.45, capacity:20, opensWith:['isTalentShow'] },
    { id:'big-top', label:'Big Top Tent', access:'challenge-only', privacy:0.30, overhear:0.60, capacity:20 },
  ]),
  'film-lot': freezeLocations([
    { id:'trailers', label:'Contestant trailers', access:'everyday', privacy:0.50, overhear:0.40, capacity:8 },
    { id:'craft-services', label:'Craft services', access:'everyday', privacy:0.10, overhear:0.90, capacity:20 },
    { id:'studio-backlot', label:'Studio backlot', access:'everyday', privacy:0.25, overhear:0.65, capacity:15, public:true },
    { id:'soundstage-corridor', label:'Soundstage corridor', access:'everyday', privacy:0.55, overhear:0.40, capacity:5 },
    { id:'prop-storage', label:'Prop storage', access:'restricted', privacy:0.80, overhear:0.15, capacity:4 },
  ]),
  'world-tour': freezeLocations([
    { id:'economy', label:'Economy class', access:'everyday', privacy:0.05, overhear:0.95, capacity:20, public:true },
    { id:'aisle', label:'Plane aisle', access:'everyday', privacy:0.15, overhear:0.80, capacity:6 },
    { id:'galley', label:'Plane galley', access:'everyday', privacy:0.40, overhear:0.50, capacity:4 },
    { id:'cargo-hold', label:'Cargo hold', access:'restricted', privacy:0.80, overhear:0.20, capacity:5 },
    { id:'first-class', label:'First class', access:'reward-only', privacy:0.45, overhear:0.40, capacity:8 },
    { id:'destination-staging', label:'Challenge destination', access:'episode-opened', privacy:0.20, overhear:0.65, capacity:20, opensWith:['worldTourDestination'] },
  ]),
});

const setting = () => ACCESS_PROFILES[seasonConfig?.setting] ? seasonConfig.setting : 'hosted-camp';

export function locationIsOpen(location, ep = {}, context = {}) {
  if (!location) return false;
  if (location.access === 'everyday') return true;
  if (location.access === 'reward-only') return Boolean(context.onReward);
  if (location.access === 'challenge-only') return Boolean(context.duringChallenge);
  if (location.access === 'restricted') return Boolean(context.allowRestricted);
  if (location.access === 'episode-opened') {
    return (location.opensWith || []).some(flag => Boolean(ep?.[flag] || ep?.challengeData?.[flag]));
  }
  return false;
}

export function availableLocations(ep = {}, context = {}) {
  return ACCESS_PROFILES[setting()].filter(location => locationIsOpen(location, ep, context));
}

function groupsForCurrentCamp() {
  if (gs.isMerged) return [{ key:gs.mergeName || 'merge', members:[...(gs.activePlayers || [])] }];
  return (gs.tribes || []).map(tribe => ({ key:tribe.name, members:(tribe.members || []).filter(p => gs.activePlayers.includes(p)) }));
}

function distribute(members, locations, rng) {
  // Unbiased Fisher-Yates shuffle (sort(()=>rng()-0.5) is non-uniform).
  const shuffled = [...members];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const buckets = locations.map(location => ({ locationId: location.id, capacity: location.capacity || 99, players: [] }));
  // Fill respecting capacity — spread evenly (by absolute count so people fan out
  // across the available spots instead of piling into the roomiest one), only
  // consider buckets with room, and spill into the least-crowded one if all full.
  shuffled.forEach(player => {
    const withRoom = buckets.filter(b => b.players.length < b.capacity);
    const bucket = (withRoom.length ? withRoom : buckets)
      .sort((a, b) => a.players.length - b.players.length || (a.players.length / a.capacity) - (b.players.length / b.capacity))[0];
    bucket.players.push(player);
  });
  return buckets.filter(b => b.players.length).map(({ locationId, players }) => ({ locationId, players }));
}

export function buildCampAccessSchedule(ep, phase = 'pre', rng = Math.random) {
  if (!ep) return null;
  ep.campAccess = ep.campAccess || { setting:setting(), groups:{}, phases:{} };
  ep.campAccess.setting = setting();
  const locations = availableLocations(ep);
  const publicLocation = locations.find(l => l.public) || locations[0];
  // Genuinely private spots people can slip away to (excludes the communal
  // location and low-privacy gathering spaces like a mess hall).
  const privateSpots = locations.filter(l => l.id !== publicLocation?.id && (l.privacy ?? 0) >= 0.3);
  const windows = phase === 'post'
    ? [
      { id:'return', label:'Return from the challenge', privacyNeed:'public', duration:1 },
      { id:'scramble', label:'Post-challenge scramble', privacyNeed:'mixed', duration:2 },
      { id:'before-tribal', label:'Before leaving for Tribal', privacyNeed:'mixed', duration:1 },
    ]
    : [
      { id:'morning', label:'Morning at camp', privacyNeed:'public', duration:1 },
      { id:'camp-work', label:'Camp work and downtime', privacyNeed:'mixed', duration:2 },
    ];

  groupsForCurrentCamp().forEach(group => {
    const records = windows.map(window => {
      let assignments;
      if (window.privacyNeed === 'public' || !privateSpots.length) {
        // Everyone together at the communal spot (return from challenge, morning).
        assignments = [{ locationId:publicLocation.id, players:[...group.members] }];
      } else {
        // Downtime/scramble: people fan out into small private clusters (~3 each)
        // plus the open communal area, so conversations happen in varied spots.
        const spots = Math.min(privateSpots.length, Math.max(2, Math.round(group.members.length / 3)));
        assignments = distribute(group.members, [publicLocation, ...privateSpots.slice(0, spots)], rng);
      }
      return { ...window, assignments };
    });
    ep.campAccess.groups[group.key] = { members:[...group.members] };
    ep.campAccess.phases[`${phase}:${group.key}`] = records;
  });
  // Voting and knowledge run later in the episode without receiving `ep`
  // directly. Keep a transient pointer to this episode's plain-data schedule,
  // stamped with the episode number so consumers can detect a stale schedule.
  ep.campAccess.epNum = ep.num;
  gs._campAccessThisEp = ep.campAccess;
  return ep.campAccess;
}

export function findConversationAccess(ep, requester, target, { phase = 'post', privacy = 0, allowPublicPullAside = true } = {}) {
  if (!ep?.campAccess || !requester || !target || requester === target) return { possible:false, reason:'no-schedule' };
  const locationMap = new Map(ACCESS_PROFILES[ep.campAccess.setting || setting()].map(l => [l.id, l]));
  const entries = Object.entries(ep.campAccess.phases || {}).filter(([key]) => key.startsWith(`${phase}:`));
  // No schedule was built for this phase at all — fall back to a permissive
  // "camp is reachable" result rather than blocking every interaction. This is
  // distinct from a built phase where the pair genuinely never shared a window.
  if (!entries.length) {
    return { possible:true, reason:'no-phase-schedule', phase, windowId:null, windowLabel:'Around camp',
      locationId:null, location:'around camp', privacy, overhearRisk:0.5, nearby:[], pullAside:false };
  }
  const options = [];
  entries.forEach(([, windows]) => windows.forEach(window => window.assignments.forEach(assignment => {
    if (!assignment.players.includes(requester) || !assignment.players.includes(target)) return;
    const location = locationMap.get(assignment.locationId);
    if (!location) return;
    const privacyScore = location.privacy ?? 0;
    const pullAside = allowPublicPullAside && privacyScore < privacy && assignment.players.length > 2;
    options.push({ possible:true, phase, windowId:window.id, windowLabel:window.label, locationId:location.id,
      location:pullAside ? `${location.label} (off to the side)` : location.label,
      privacy:pullAside ? Math.min(0.55, privacyScore + 0.25) : privacyScore,
      overhearRisk:pullAside ? Math.min(1, location.overhear + 0.12) : location.overhear,
      nearby:assignment.players.filter(p => p !== requester && p !== target), pullAside });
  })));
  if (!options.length) return { possible:false, reason:'no-shared-window' };
  // Pick the spot that satisfies the requested privacy with the least excess,
  // preferring a genuine private location over stepping aside in the open.
  return options.sort((a, b) => {
    if (a.pullAside !== b.pullAside) return a.pullAside ? 1 : -1;   // real spot beats a public aside
    const aOK = a.privacy >= privacy, bOK = b.privacy >= privacy;
    if (aOK !== bOK) return aOK ? -1 : 1;                           // meets the need beats falling short
    return aOK ? a.privacy - b.privacy : b.privacy - a.privacy;     // sufficient → least excess; else → most private
  })[0];
}

export function currentCampAccessEpisode() {
  const schedule = gs._campAccessThisEp;
  if (!schedule) return null;
  // Reject a schedule left over from an earlier episode. Real schedules are
  // stamped with their episode number; an unstamped one (legacy/tests) is
  // trusted. gs.episode is set to the current episode number partway through
  // processing, so both it and it+1 count as "this episode".
  if (schedule.epNum != null) {
    const now = gs.episode || 0;
    if (schedule.epNum !== now && schedule.epNum !== now + 1) return null;
  }
  return { campAccess:schedule };
}

// Contact adapter for knowledge.propagate(). Only people who shared at least
// one physical window are available. Named allies remain preferred inside that
// reachable set; they are not granted magical cross-location access.
export function campKnowledgeContacts(knower, phase = 'post') {
  const ep = currentCampAccessEpisode();
  const reachable = new Set();
  if (ep) {
    Object.entries(ep.campAccess.phases || {}).filter(([key]) => key.startsWith(`${phase}:`))
      .forEach(([, windows]) => windows.forEach(window => window.assignments.forEach(assignment => {
        if (assignment.players.includes(knower)) assignment.players.forEach(p => { if (p !== knower) reachable.add(p); });
      })));
  }
  const allies = new Set();
  (gs.namedAlliances || []).forEach(alliance => {
    if (alliance.active !== false && alliance.members?.includes(knower)) {
      alliance.members.forEach(member => { if (reachable.has(member)) allies.add(member); });
    }
  });
  return { allies:[...allies], others:[...reachable].filter(person => !allies.has(person)) };
}

export function attachCampAccessToEvents(ep, phase = 'pre') {
  if (!ep?.campEvents || !ep.campAccess) return;
  Object.values(ep.campEvents).forEach(block => {
    const events = Array.isArray(block) ? block : (block?.[phase] || []);
    events.forEach(event => {
      if (event.access || !Array.isArray(event.players) || event.players.length < 2) return;
      const [a, b] = event.players;
      const access = findConversationAccess(ep, a, b, { phase, privacy:0.35 });
      if (access.possible) event.access = access;
    });
  });
}
