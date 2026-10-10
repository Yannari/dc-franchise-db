// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/map.js — camp as a map you explore (the user, 2026-10-07: "a big map, you click a zone
// and it takes you inside… like the Sims, everyone doing their own thing")
// ══════════════════════════════════════════════════════════════════════
//
// PURE: an episode in, a map out; no DOM (screens.js draws it). The map holds one camp phase
// (the morning, or after the challenge) as TIME WINDOWS (camp-access.js: morning, camp work, the
// return, the scramble, before the vote), and in each window the ZONES of the venue, each with
// who is there and the CONVERSATIONS that happen there. A conversation is one camp event, played
// on the stepped stage exactly as the linear camp screen plays it (steps.js tdCampScreen).
//
// The rules the user chose:
// - the map is the default camp view; "Next" still walks every conversation in story order;
// - free order inside a time window; the clock moves on once that window's KEY conversations
//   (the ones the story turns on) have been watched;
// - teams: a shared camp (Wawanakwa, the film lot, the carnival, the plane) is ONE map with every
//   team on it; a venue where the teams live apart (Soluna) gets one map per team.
//
// Nothing here decides anything. Where a conversation is drawn is where the stepped stage stages
// it (stageSpot); who is idle where is the engine's own schedule (ep.campAccess).
import { TD_MARKS } from './marks.js';
import { ACCESS_PROFILES } from '../camp-access.js';
import { campFeed } from '../td/story/feed.js';
import { tdCampScreen, stageSpot, venueOf, VENUES, placeName, campSlot, unspoil } from './steps.js';
import { RI_VENUE, islandMapOn, islandName, islandEvents, islandResidents, islandPlaceOf, islandWindowOf, islandBadge, tdIslandConvScreen } from './twists.js';

// the venues with a painted map (tools/td-camp: '<venue>/map-day'), and how their teams live
export const MAP_VENUES = { 'hosted-camp': { shared: true }, 'film-lot': { shared: true }, 'world-tour': { shared: true }, 'survival-island': { shared: false }, carnival: { shared: false } };
export const hasMap = venue => !!(MAP_VENUES[venue] && TD_MARKS[`${venue}/map-day`]);

// which zone on the map each staged place belongs to; a zone may hold more than one place
// (the cabins: the porch and the inside)
export const ZONE_OF = {
  'hosted-camp': { cabins: 'cabins', 'cabin-inside': 'cabins', 'mess-hall': 'mess-hall', washroom: 'washroom', 'communal-grounds': 'communal-grounds',
    confessional: 'confessional', campfire: 'campfire', dock: 'dock', beach: 'beach', 'forest-trail': 'forest-trail', cliff: 'cliff',
    lake: 'lake', boathouse: 'boathouse', waterfall: 'waterfall', caves: 'caves', amphitheater: 'amphitheater', river: 'river', kitchen: 'mess-hall' },
  'film-lot': { trailers: 'trailers', 'craft-services': 'craft-services', 'studio-backlot': 'studio-backlot',
    'soundstage-corridor': 'soundstage-corridor', 'prop-storage': 'prop-storage', confessional: 'confessional',
    'trailer-inside': 'trailers', 'western-set': 'western-set', 'city-set': 'city-set' },
  'survival-island': { shelter: 'shelter', campfire: 'campfire', beach: 'beach', shoreline: 'shoreline', 'water-source': 'water-source',
    'jungle-trail': 'jungle-trail', 'fishing-area': 'fishing-area', confessional: 'confessional', ruins: 'ruins', cave: 'cave' },
  carnival: { campsite: 'campsite', shelter: 'shelter', 'forest-edge': 'forest-edge', 'rocky-beach': 'rocky-beach', 'lake-shore': 'lake-shore',
    'carnival-entrance': 'carnival-entrance', midway: 'midway', carousel: 'carousel', 'corn-maze-inside': 'corn-maze', 'haunted-mansion': 'haunted-mansion', 'corn-maze': 'corn-maze', 'theater-tent': 'theater-tent',
    confessional: 'confessional' },
  redemption: { 'skull-beach': 'skull-beach', shoreline: 'shoreline', 'rocky-beach': 'rocky-beach', 'cave-entrance': 'cave', 'cave-inside': 'cave' },
  'world-tour': { economy: 'economy', aisle: 'aisle', galley: 'galley', 'cargo-hold': 'cargo-hold', 'first-class': 'first-class',
    'destination-staging': 'destination-staging', confessional: 'confessional', 'chris-quarters': 'chris-quarters', cockpit: 'cockpit' },
};
export const ZONE_LABEL = { 'skull-beach': 'Skull Beach', cave: 'The Cave', campsite: 'The Campsite', 'forest-edge': 'The Forest Edge', 'rocky-beach': 'The Rocky Beach', 'lake-shore': 'The Lake Shore',
  'carnival-entrance': 'The Carnival Gate', midway: 'The Midway', 'haunted-mansion': 'The Haunted Mansion', 'corn-maze': 'The Corn Maze', 'theater-tent': 'The Theater Tent', shelter: 'The Shelter', campfire: 'The Campfire', shoreline: 'The Shoreline', 'water-source': 'The Waterfall Pool', 'jungle-trail': 'The Bamboo Jungle', ruins: 'The Ruins', cave: 'The Cave', 'fishing-area': 'The Fishing Dock', cabins: 'The Cabins', 'mess-hall': 'The Mess Hall', washroom: 'The Washrooms', 'communal-grounds': 'The Camp Grounds',
  trailers: 'The Trailers', 'craft-services': 'Craft Services', 'studio-backlot': 'The Backlot', 'soundstage-corridor': 'The Soundstages', 'prop-storage': 'Prop Storage',
  economy: 'Economy Class', aisle: 'The Aisle', galley: 'The Galley', 'cargo-hold': 'The Cargo Hold', 'first-class': 'First Class', 'destination-staging': 'Down on the Ground',
  confessional: 'The Confession Cam', campfire: 'The Campfire', dock: 'The Dock', beach: 'The Beach', 'forest-trail': 'The Forest Trail', cliff: 'The Cliff',
  'chris-quarters': "Chris's Quarters", cockpit: 'The Cockpit', carousel: 'The Carousel', 'western-set': 'The Western Set', 'city-set': 'The City Set', lake: 'The Lake', boathouse: 'The Boathouse', waterfall: 'The Waterfall', caves: 'The Caves', amphitheater: 'The Amphitheater', river: 'The River' };
export const PLACE_LABEL = { 'cave-entrance': 'The mouth', 'cave-inside': 'Inside', cabins: 'Porch', 'cabin-inside': 'Inside', trailers: 'Outside', 'trailer-inside': 'Inside', 'mess-hall': 'Dining hall', kitchen: 'Kitchen', 'corn-maze': 'Entrance', 'corn-maze-inside': 'Inside' };

// the camp's day, in the order it happens (camp-access.js windows)
export const WINDOW_ORDER = { pre: ['morning', 'camp-work'], post: ['return', 'scramble', 'before-tribal'] };
export const WINDOW_LABEL = { morning: 'Morning', 'camp-work': 'Camp chores', return: 'Back from the challenge', scramble: 'The scramble', 'before-tribal': 'Before the vote' };
export const WINDOW_TIME = { morning: '7:00 AM', 'camp-work': '10:00 AM', return: '3:00 PM', scramble: '4:30 PM', 'before-tribal': '7:00 PM' };
export const WINDOW_NIGHT = { 'before-tribal': true };

// The conversations the story turns on: a deal, an alliance, a lie, a betrayal, an idol, a
// showmance beginning or breaking, a blow-up. The clock waits for these; the rest are optional.
const KEY_KIND = /^(crowd\.(huddle|lost|clash)|alliance\.|deal\.|pitch\.|recruit\.|plot\.|broker\.|credit\.|idol\.(confide|leak|snoop|tip)|adv\.|fallout\.|caught\.|blind\.|goat\.|save\.|threat\.notice|romance\.(showmance|first|tri|affair|breakup|cut)|drama\.(bomb|nemesis|clash))/;
const KEY_TYPE = /^(allianceForm|allianceBetrayal|idolFound|idolConfession|idolBetrayal|betrayal|showmance|firstMove|secretFlip|stolenCredit|brokerExposed)/;
// how much a key conversation matters: a turning point the engine named, then a storyline's step or
// the vote plan, then a pitch or a deal
function keyRank(ev) {
  if (KEY_TYPE.test(ev?.type || '')) return 3;
  if (ev?.story && (ev.storyline || ev.storyType === 'vote')) return 2;
  return KEY_KIND.test(ev?.scene?.kind || '') ? 1 : 0;
}
export function isKey(ev) {
  // a step of a running storyline (td/story/director.js) or the talk before a vote is what the episode
  // turns on; the director's other scenes (first-day small talk, the morning, a challenge's aftermath,
  // a joke) are optional colour (the user, 2026-10-08: "why do we only have key conversations")
  const minor = /^(friendship\.|rivalry\.(friction|cold)|showmance\.spark|alliance\.checkin|underdog\.rise)/.test(`${ev?.storyType}.${ev?.step}`);
  // the talk before a vote: the plan and the warning are key, the first idea and the lining-up are colour
  // ...and a chapter of a story that runs across episodes (td/story/arcs.js, the mentor arc): miss one and the next makes no sense
  const storyKey = !!ev?.story && ((ev.storyType === 'vote' && !['spark', 'ally'].includes(ev.step)) || ev.storyType === 'arc' || (ev.storyType !== 'vote' && !!ev.storyline && !minor));
  return storyKey || KEY_KIND.test(ev?.scene?.kind || '') || KEY_TYPE.test(ev?.type || '');
}

// a short name for a conversation on its bubble: the badge the engine gave it, else its kind
const KIND_TITLE = { alliance: 'An alliance', deal: 'A deal', pitch: 'A vote pitch', recruit: 'Recruiting', plot: 'A scheme', broker: 'Double agent', credit: 'Stolen credit',
  idol: 'An idol', adv: 'An advantage', fallout: 'Fallout', caught: 'Caught out', blind: 'A blind spot', goat: 'A read', save: 'The morning after', threat: 'A threat',
  romance: 'Romance', friend: 'Friends', drama: 'Drama', life: 'Camp life', hosted: 'Camp life', talk: 'A talk', flow: 'Gossip', read: 'A read', mind: 'Thinking', aside: 'After the challenge',
  merge: 'The merge', morning: 'The last morning', crowd: 'Together', game: 'Free time', arc: 'A story', kit: 'Camp life', cross: 'Across the line', villain: 'The villain', spot: 'Noticed', throw: 'A thrown challenge', misvote: 'A wrong vote', last: 'Camp life', tail: 'Camp life' };
const titleOf = ev => {
  const b = unspoil(String(ev.badgeText || '').trim()).text;
  if (b) return b.charAt(0) + b.slice(1).toLowerCase();
  const fam = String(ev.scene?.kind || ev.type || '').split('.')[0];
  return KIND_TITLE[fam] || 'At camp';
};

/**
 * The zone hotspots of a venue's map: { id: { u, v, label } } from the render's marks.
 * A venue where teams live apart marks each campsite's places with a slot ('shelter@1'). Given the
 * camp's own slot, those become its plain places ('shelter'); every other team's campsite is one
 * locked pin ({ rival: true }) named for that team — seen on the map, never entered. With no teams
 * (the merged camp) the first campsite is home and the others are left empty.
 */
export function mapZones(venue, slot = null, teams = []) {
  const M = TD_MARKS[`${venue}/map-day`];
  const out = {};
  for (const m of M?.m || []) {
    if (m.kind !== 'zone' || !m.id) continue;
    const [base, at] = String(m.id).split('@');
    if (at == null) { out[m.id] = { u: m.u, v: m.v, label: ZONE_LABEL[m.id] || placeName(m.id) }; continue; }
    const k = Number(at), home = slot ?? 0;
    if (k === home) out[base] = { u: m.u, v: m.v, label: ZONE_LABEL[base] || placeName(base) };
    else if (slot != null && teams[k] && base === 'shelter') out[m.id] = { u: m.u, v: m.v, label: `${teams[k]} camp`, rival: true };
  }
  return out;
}

/**
 * The map of one camp phase. camps: the camp keys it holds (every team's, at a shared camp; one, at a
 * venue where the teams live apart). Returns null when the venue has no map or nothing happens.
 * {
 *   venue, phase, camps, teamOf: { name: camp },
 *   windows: [{ id, label, time, night, idle: { zone: [names] } }],
 *   convs:   [{ i, window, zone, place, key, title, who, camp, screen }]   (story order)
 *   zones:   { id: { u, v, label } }
 * }
 */
export function tdCampMap(ep, phase, camps, o = {}) {
  const venue = venueOf(ep, o);
  if (!hasMap(venue)) return null;
  const zoneOf = ZONE_OF[venue] || {};
  // teams that live apart: this camp's slot among the episode's teams (the map has three campsites)
  const shared = !!MAP_VENUES[venue]?.shared;
  const teams = (ep.tribesAtStart || []).map(t => t.name).filter(Boolean);
  const own = !shared && camps.length === 1 ? teams.indexOf(camps[0]) : -1;
  const slot = own >= 0 ? own % 3 : null;
  const plateSlot = !shared && camps.length === 1 ? campSlot(ep, camps[0], venue) : null;
  const zones = mapZones(venue, slot, slot == null ? [] : teams.map((t, i) => (i % 3 === slot ? null : t)));
  const order = WINDOW_ORDER[phase];
  const teamOf = {};
  const convs = [];
  for (const camp of camps) {
    // the scenes that air, in story order (td/story/director.js)
    const events = campFeed(ep, camp, phase);
    const members = ep.campAccess?.groups?.[camp]?.members || (ep.tribesAtStart || []).find(t => t.name === camp)?.members || [];
    for (const n of members) teamOf[n] = camp;
    events.forEach((ev, k) => {
      if (!ev || (!ev.lines?.length && !String(ev.text || '').trim())) return;
      const confOnly = Array.isArray(ev.lines) && ev.lines.length && ev.lines.every(l => l.kind !== 'say');
      const engineSpot = ev.scene?.spot?.id || ev.access?.locationId || VENUES[venue].public;
      let win = ev.scene?.spot?.window || ev.access?.windowId || order[Math.min(order.length - 1, Math.floor(k / Math.max(1, Math.ceil(events.length / order.length))))];
      if (!order.includes(win)) win = order[order.length - 1];
      let place = confOnly || engineSpot === 'confessional' ? 'confessional' : stageSpot(venue, engineSpot, ev, win);
      // the viewer's restaging never packs a small room: past a third of its capacity in one window
      // (two talks in the jet's galley), a talk stays where the engine put it
      const cap = (ACCESS_PROFILES[venue] || []).find(l => l.id === place)?.capacity;
      if (place !== engineSpot && cap && convs.filter(c => c.window === win && c.place === place).length >= Math.max(2, Math.ceil(cap / 3))) place = engineSpot;
      const zone = zoneOf[place] || (zones[place] ? place : zoneOf[VENUES[venue].public] || VENUES[venue].public);
      // the conversation, played on its own: the same steps the linear camp screen gives it
      const members = ep.campAccess?.groups?.[camp]?.members || (ep.tribesAtStart || []).find(t => t.name === camp)?.members || (ep.gsSnapshot?.tribes || []).find(t => t.name === camp)?.members || [];
      const screen = tdCampScreen({ ...ep, campStory: null, campEvents: { [camp]: phase === 'pre' ? { pre: [ev], post: [] } : { pre: [], post: [ev] } } }, camp, phase, members, o);
      if (!screen) return;
      convs.push({ i: convs.length, window: win, zone, place, key: isKey(ev), rank: keyRank(ev), title: titleOf(ev), camp, storyline: ev.storyline || null,
        who: [...new Set([...(ev.lines || []).map(l => l.by).filter(Boolean), ...(ev.players || [])])].filter(n => typeof n === 'string').slice(0, 4),
        screen: { ...screen, id: `${screen.id}-c${convs.length}`, label: `${zones[zone]?.label || placeName(place)} · ${WINDOW_LABEL[win]}` } });
    });
  }
  if (!convs.length) return null;
  // at most three key conversations in a part of the day: the ones the episode turns on most; the
  // rest stay on the map to watch or skip
  for (const w of order) convs.filter(c => c.window === w && c.key).sort((a, b) => b.rank - a.rank || a.i - b.i).slice(3).forEach(c => { c.key = false; });
  // story order: the camp's day first, the engine's own order inside a window
  const rank = w => order.indexOf(w);
  convs.sort((a, b) => rank(a.window) - rank(b.window) || a.i - b.i);
  convs.forEach((c, i) => { c.i = i; });
  // cause before effect: a storyline's scene waits for the one before it in the same storyline
  const lastOf = {};
  convs.forEach(c => { if (!c.storyline) return; if (lastOf[c.storyline] != null) c.after = lastOf[c.storyline]; lastOf[c.storyline] = c.i; });
  // who is idle where in each window: the engine's schedule, drawn in the zone of that place
  const windows = order.map(id => {
    const idle = {};
    for (const camp of camps) {
      const rec = (ep.campAccess?.phases?.[`${phase}:${camp}`] || []).find(r => r.id === id);
      for (const a of rec?.assignments || []) {
        const z = zoneOf[a.locationId] || (zones[a.locationId] ? a.locationId : zoneOf[VENUES[venue].public] || VENUES[venue].public);
        (idle[z] ||= []).push(...a.players);
      }
    }
    return { id, label: WINDOW_LABEL[id], time: WINDOW_TIME[id], night: !!WINDOW_NIGHT[id], idle };
  }).filter(w => convs.some(c => c.window === w.id) || Object.keys(w.idle).length);
  return { venue, phase, camps: [...camps], teamOf, windows, convs, zones, slot: plateSlot };
}

/** Where the viewer is allowed to go next: the first window that still has an unwatched key talk. */
export function openWindow(map, seen) {
  for (let w = 0; w < map.windows.length; w++) {
    const left = map.convs.filter(c => c.window === map.windows[w].id && c.key && !seen.has(c.i));
    if (left.length) return w;
  }
  return map.windows.length - 1;
}
/** Whether a conversation waits for an earlier scene of its storyline the viewer has not watched. */
export const lockedConv = (map, seen, c) => c?.after != null && !seen.has(c.after);

/** The next conversation in story order the viewer has not watched yet (the Next button). */
export function nextConv(map, seen) { return map.convs.find(c => !seen.has(c.i)) || null; }

// ══════════════════════════════════════════════════════════════════════
// THE ISLAND'S MAP — Redemption Island and Rescue Island on Boney Island (the user, 2026-10-09):
// the same map the camps have, its places Skull Beach, the Shoreline, the Rocky Beach and the Cave.
// A day there has a morning, an afternoon and a night; each of the engine's island moments is one
// conversation at the place that kind of moment happens (twists.js islandPlaceOf); whoever is not in
// one is idle on a beach. The fights, the plots and the arrivals are the ones the clock waits for.
// ══════════════════════════════════════════════════════════════════════
const ISLAND_WINDOWS = [{ id: 'ri-day', label: 'Morning', time: '9:00 AM' }, { id: 'ri-later', label: 'Afternoon', time: '3:00 PM' }, { id: 'ri-night', label: 'Night', time: '9:00 PM', night: true }];
const ISLAND_KEY = new Set(['sizing-up', 'enemy-arrives', 'ally-arrives', 'grudge-confrontation', 'explosive-fight', 'alliance-plot', 'revenge-talk', 'quit', 'group-comeback']);
const ISLAND_IDLE = ['skull-beach', 'shoreline', 'rocky-beach'];
const titleCase = t => String(t || '').toLowerCase().replace(/(^|\s)\w/g, c => c.toUpperCase());
export function tdIslandMap(ep, rescue, o = {}) {
  if (!islandMapOn(ep, o)) return null;
  const events = islandEvents(ep, rescue);
  if (!events.length) return null;
  const isle = islandName(rescue);
  const residents = islandResidents(ep, rescue);
  const zones = mapZones(RI_VENUE);
  const zoneOf = ZONE_OF[RI_VENUE];
  const convs = [];
  for (const e of events) {
    const screen = tdIslandConvScreen(ep, rescue, e, o);
    if (!screen) continue;
    const w = ISLAND_WINDOWS[islandWindowOf(e)], place = islandPlaceOf(e), zone = zoneOf[place] || 'skull-beach';
    const who = [e.player, e.player2, e.player3].filter(n => n && residents.includes(n));
    convs.push({ i: convs.length, window: w.id, zone, place, key: ISLAND_KEY.has(e.type), rank: 0, title: titleCase(islandBadge(e)), camp: isle, storyline: null, who,
      screen: { ...screen, id: `ri-${rescue ? 'rescue' : 'redemption'}-c${convs.length}`, label: `${zones[zone]?.label || placeName(place)} · ${w.label}` } });
  }
  if (!convs.length) return null;
  const windows = ISLAND_WINDOWS.map(w => {
    const busy = new Set(convs.filter(c => c.window === w.id).flatMap(c => c.who));
    const idle = {};
    residents.filter(n => !busy.has(n)).forEach(n => {
      let h = 0; for (const ch of `${n}|${w.id}|${ep.num}`) h = (h * 31 + ch.charCodeAt(0)) | 0;
      (idle[ISLAND_IDLE[(h >>> 0) % ISLAND_IDLE.length]] ||= []).push(n);
    });
    return { ...w, night: !!w.night, idle };
  }).filter(w => convs.some(c => c.window === w.id) || Object.keys(w.idle).length);
  return { venue: RI_VENUE, phase: rescue ? 'rescue' : 'redemption', camps: [isle], teamOf: Object.fromEntries(residents.map(n => [n, isle])), windows, convs, zones, slot: null, title: isle };
}
