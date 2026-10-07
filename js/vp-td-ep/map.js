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
import { tdCampScreen, stageSpot, venueOf, VENUES, placeName } from './steps.js';

// the venues with a painted map (tools/td-camp: '<venue>/map-day'), and how their teams live
export const MAP_VENUES = { 'hosted-camp': { shared: true } };
export const hasMap = venue => !!(MAP_VENUES[venue] && TD_MARKS[`${venue}/map-day`]);

// which zone on the map each staged place belongs to; a zone may hold more than one place
// (the cabins: the porch and the inside)
const ZONE_OF = {
  'hosted-camp': { cabins: 'cabins', 'cabin-inside': 'cabins', 'mess-hall': 'mess-hall', washroom: 'washroom', 'communal-grounds': 'communal-grounds',
    confessional: 'confessional', campfire: 'campfire', dock: 'dock', beach: 'beach', 'forest-trail': 'forest-trail', cliff: 'cliff' },
};
export const ZONE_LABEL = { cabins: 'The Cabins', 'mess-hall': 'The Mess Hall', washroom: 'The Washrooms', 'communal-grounds': 'The Camp Grounds',
  confessional: 'The Confession Cam', campfire: 'The Campfire', dock: 'The Dock', beach: 'The Beach', 'forest-trail': 'The Forest Trail', cliff: 'The Cliff' };
export const PLACE_LABEL = { cabins: 'Porch', 'cabin-inside': 'Inside' };

// the camp's day, in the order it happens (camp-access.js windows)
export const WINDOW_ORDER = { pre: ['morning', 'camp-work'], post: ['return', 'scramble', 'before-tribal'] };
export const WINDOW_LABEL = { morning: 'Morning', 'camp-work': 'Camp chores', return: 'Back from the challenge', scramble: 'The scramble', 'before-tribal': 'Before the vote' };
export const WINDOW_TIME = { morning: '7:00 AM', 'camp-work': '10:00 AM', return: '3:00 PM', scramble: '4:30 PM', 'before-tribal': '7:00 PM' };
export const WINDOW_NIGHT = { 'before-tribal': true };

// The conversations the story turns on: a deal, an alliance, a lie, a betrayal, an idol, a
// showmance beginning or breaking, a blow-up. The clock waits for these; the rest are optional.
const KEY_KIND = /^(alliance\.|deal\.|pitch\.|recruit\.|plot\.|broker\.|credit\.|idol\.(confide|leak|snoop|tip)|adv\.|fallout\.|caught\.|blind\.|goat\.|save\.|threat\.notice|romance\.(showmance|first|tri|affair|breakup|cut)|drama\.(bomb|nemesis|clash))/;
const KEY_TYPE = /^(allianceForm|allianceBetrayal|idolFound|idolConfession|idolBetrayal|betrayal|showmance|firstMove|secretFlip|stolenCredit|brokerExposed)/;
export function isKey(ev) {
  return KEY_KIND.test(ev?.scene?.kind || '') || KEY_TYPE.test(ev?.type || '') || /^(red|gold)$/.test(ev?.badgeClass || '') && (ev.players || []).length >= 2;
}

// a short name for a conversation on its bubble: the badge the engine gave it, else its kind
const KIND_TITLE = { alliance: 'An alliance', deal: 'A deal', pitch: 'A vote pitch', recruit: 'Recruiting', plot: 'A scheme', broker: 'Double agent', credit: 'Stolen credit',
  idol: 'An idol', adv: 'An advantage', fallout: 'Fallout', caught: 'Caught out', blind: 'A blind spot', goat: 'A read', save: 'The morning after', threat: 'A threat',
  romance: 'Romance', friend: 'Friends', drama: 'Drama', life: 'Camp life', hosted: 'Camp life', talk: 'A talk', flow: 'Gossip', read: 'A read', mind: 'Thinking', aside: 'After the challenge',
  merge: 'The merge', morning: 'The last morning', villain: 'The villain', spot: 'Noticed', throw: 'A thrown challenge', misvote: 'A wrong vote', last: 'Camp life', tail: 'Camp life' };
const titleOf = ev => {
  const b = String(ev.badgeText || '').trim();
  if (b) return b.charAt(0) + b.slice(1).toLowerCase();
  const fam = String(ev.scene?.kind || ev.type || '').split('.')[0];
  return KIND_TITLE[fam] || 'At camp';
};

/** The zone hotspots of a venue's map: { id: { u, v, label } } from the render's marks. */
export function mapZones(venue) {
  const M = TD_MARKS[`${venue}/map-day`];
  const out = {};
  for (const m of M?.m || []) if (m.kind === 'zone' && m.id) out[m.id] = { u: m.u, v: m.v, label: ZONE_LABEL[m.id] || placeName(m.id) };
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
  const zones = mapZones(venue);
  const order = WINDOW_ORDER[phase];
  const teamOf = {};
  const convs = [];
  for (const camp of camps) {
    const block = ep?.campEvents?.[camp];
    const events = phase === 'pre' ? (Array.isArray(block) ? block : (block?.pre || [])) : (block?.post || []);
    const members = ep.campAccess?.groups?.[camp]?.members || (ep.tribesAtStart || []).find(t => t.name === camp)?.members || [];
    for (const n of members) teamOf[n] = camp;
    events.forEach((ev, k) => {
      if (!ev || (!ev.lines?.length && !String(ev.text || '').trim())) return;
      const confOnly = Array.isArray(ev.lines) && ev.lines.length && ev.lines.every(l => l.kind !== 'say');
      const engineSpot = ev.scene?.spot?.id || ev.access?.locationId || VENUES[venue].public;
      let win = ev.scene?.spot?.window || ev.access?.windowId || order[Math.min(order.length - 1, Math.floor(k / Math.max(1, Math.ceil(events.length / order.length))))];
      if (!order.includes(win)) win = order[order.length - 1];
      const place = confOnly || engineSpot === 'confessional' ? 'confessional' : stageSpot(venue, engineSpot, ev, win);
      const zone = zoneOf[place] || (zones[place] ? place : 'communal-grounds');
      // the conversation, played on its own: the same steps the linear camp screen gives it
      const screen = tdCampScreen({ ...ep, campEvents: { [camp]: phase === 'pre' ? { pre: [ev], post: [] } : { pre: [], post: [ev] } } }, camp, phase, [], o);
      if (!screen) return;
      convs.push({ i: convs.length, window: win, zone, place, key: isKey(ev), title: titleOf(ev), camp,
        who: [...new Set([...(ev.lines || []).map(l => l.by).filter(Boolean), ...(ev.players || [])])].filter(n => typeof n === 'string').slice(0, 4),
        screen: { ...screen, id: `${screen.id}-c${convs.length}`, label: `${zones[zone]?.label || placeName(place)} · ${WINDOW_LABEL[win]}` } });
    });
  }
  if (!convs.length) return null;
  // story order: the camp's day first, the engine's own order inside a window
  const rank = w => order.indexOf(w);
  convs.sort((a, b) => rank(a.window) - rank(b.window) || a.i - b.i);
  convs.forEach((c, i) => { c.i = i; });
  // who is idle where in each window: the engine's schedule, drawn in the zone of that place
  const windows = order.map(id => {
    const idle = {};
    for (const camp of camps) {
      const rec = (ep.campAccess?.phases?.[`${phase}:${camp}`] || []).find(r => r.id === id);
      for (const a of rec?.assignments || []) {
        const z = zoneOf[a.locationId] || (zones[a.locationId] ? a.locationId : 'communal-grounds');
        (idle[z] ||= []).push(...a.players);
      }
    }
    return { id, label: WINDOW_LABEL[id], time: WINDOW_TIME[id], night: !!WINDOW_NIGHT[id], idle };
  }).filter(w => convs.some(c => c.window === w.id) || Object.keys(w.idle).length);
  return { venue, phase, camps: [...camps], teamOf, windows, convs, zones };
}

/** Where the viewer is allowed to go next: the first window that still has an unwatched key talk. */
export function openWindow(map, seen) {
  for (let w = 0; w < map.windows.length; w++) {
    const left = map.convs.filter(c => c.window === map.windows[w].id && c.key && !seen.has(c.i));
    if (left.length) return w;
  }
  return map.windows.length - 1;
}
/** The next conversation in story order the viewer has not watched yet (the Next button). */
export function nextConv(map, seen) { return map.convs.find(c => !seen.has(c.i)) || null; }
