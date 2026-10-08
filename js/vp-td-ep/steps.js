// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/steps.js — a Total Drama episode as screens of steps (spec 2026-10-06 §6, §7)
// ══════════════════════════════════════════════════════════════════════
//
// PURE: an episode record in, screens out, no DOM. One step is one click: a line, a stage
// direction, a confessional, a title card, a marshmallow. The stage (stage.js), the script
// under it and the Intel drawer all read the same list, so they cannot drift.
//
// RENDER, NEVER INVENT (§18.3). Camp words are the engine's (js/td/script wrote them when the
// scene fired); an event the script layer has not reached yet airs as a cutaway with the
// engine's own sentence. The only words written here are the host's ceremony calls, and
// tdStepTranscript() hands those to the text backlog so the transcript equals the screen.
//
// WHERE PEOPLE ARE is decided once per scene, from the plate's marks (marks.js: seats,
// standing spots, the host's place), never per click: a person never blinks out when they
// talk. Who else is around comes from the record (ep.campAccess: who was at that spot in that
// window), and they are busy with something of their own.
import { TD_MARKS } from './marks.js';
import { stableRng } from '../script/rng.js';
import { campFeed } from '../td/story/feed.js';

// ── the venues ────────────────────────────────────────────────────────
// The spots each venue has a plate for, and how its ceremony goes. Each checked against the
// shows' wikis (spec §7; the plates in tools/td-camp/venues).
export const VENUES = {
  'hosted-camp': { public: 'communal-grounds', ceremony: 'The Campfire Ceremony', style: 'handout', item: 'marshmallow', items: 'marshmallows',
    exitPlace: 'The Dock of Shame', exitLine: n => `${n}, the Dock of Shame awaits. The Boat of Losers waits for no one.`,
    open: t => [`Welcome to the campfire ceremony, ${t}.`, `${t}. Back at the campfire again.`, `${t}, welcome back to the campfire.`],
    voted: `You've all cast your votes in the confession cam.`, sit: ['campfire', 'mess-hall'] },
  'survival-island': { public: 'campfire', ceremony: 'The Elimination Trial', style: 'read',
    exitPlace: 'One Final Choice', exitLine: n => `${n}, it's time to go. Follow the path to the Motel.`,
    open: t => [`Welcome to the Elimination Trial, ${t}.`, `${t}. Take your seats.`, `${t}, back at the fire so soon.`],
    voted: `It's time to vote.`, sit: ['campfire'] },
  'film-lot': { public: 'studio-backlot', ceremony: 'The Gilded Chris Awards', style: 'handout', item: 'Gilded Chris', items: 'Gilded Chrises',
    exitPlace: 'The Walk of Shame', exitLine: n => `${n}, the Walk of Shame is that way. Your Lame-o-sine is waiting.`,
    open: t => [`Welcome to the Gilded Chris Awards, ${t}.`, `${t}. Back at the awards so soon.`, `${t}, welcome back to the awards.`],
    voted: `You've all cast your votes in the confessional trailer.`, sit: [] },
  'world-tour': { public: 'economy', ceremony: 'The Barf Bag Ceremony', style: 'handout', item: 'barf bag', items: 'barf bags',
    exitPlace: 'The Drop of Shame', exitLine: n => `${n}, grab a parachute. It's time for the Drop of Shame.`,
    open: t => [`Welcome to the Barf Bag Ceremony, ${t}.`, `${t}. Back at the back of the plane.`, `${t}, welcome back to the Barf Bag Ceremony.`],
    voted: `You've all stamped your votes in the confessional.`, sit: ['economy', 'first-class'] },
  'carnival': { public: 'campsite', ceremony: 'The Elimination Trial', style: 'read',
    exitPlace: 'The Boat of Losers', exitLine: n => `${n}, the Boat of Losers is waiting.`,
    open: t => [`Welcome to the Elimination Trial, ${t}.`, `${t}. Take a seat.`, `${t}, back at the trial again.`],
    voted: `You've all cast your votes at the booth.`, sit: [] },
};
export const venueOf = (ep, o = {}) => (VENUES[ep?.campAccess?.setting] ? ep.campAccess.setting : (VENUES[o.setting] ? o.setting : 'hosted-camp'));

// the label a spot is called on screen
const PLACE = {
  'communal-grounds': 'The Camp Grounds', cabins: 'The Cabins', 'mess-hall': 'The Mess Hall', dock: 'The Dock', campfire: 'The Campfire Pit',
  'forest-trail': 'The Forest Trail', confessional: 'The Confession Cam', shelter: 'The Shelter', beach: 'The Beach', shoreline: 'The Shoreline',
  'water-source': 'The Water Source', 'jungle-trail': 'The Bamboo Jungle', 'fishing-area': 'The Fishing Spot', trailers: 'The Trailers',
  'craft-services': 'Craft Services', 'studio-backlot': 'The Backlot', 'soundstage-corridor': 'The Soundstage', 'prop-storage': 'Prop Storage',
  economy: 'Economy Class', aisle: 'The Aisle', galley: 'The Galley', 'cargo-hold': 'The Cargo Hold', 'first-class': 'First Class',
  'destination-staging': 'The Landing Strip', campsite: 'The Campsite', 'forest-edge': 'The Forest', 'rocky-beach': 'The Rocky Beach',
  'lake-shore': 'The Lake Shore', 'carnival-entrance': 'The Carnival Gate', midway: 'The Midway', 'trial-area': 'The Trial Area',
  'haunted-mansion': 'The Haunted Mansion', 'corn-maze': 'The Corn Maze', 'theater-tent': 'The Theater Tent', 'big-top': 'The Big Top',
  'voting-booth': 'The Voting Booth', ceremony: 'The Ceremony', exit: 'The Exit', ruins: 'The Ruins', cave: 'The Cave',
};
// the places a scene can be staged in beyond the engine's spots (camp-access.js): a cabin's inside,
// the beach, the washrooms, the cliff (2026-10-07: "where is the rest… the interior
// of the cabin, the canteen, the lake")
Object.assign(PLACE, { 'cabin-inside': 'Inside the Cabin', washroom: 'The Washrooms', cliff: 'The Cliff' });
// Wawanakwa's other places (the wiki's locations) and the islands beyond camp
Object.assign(PLACE, { lake: 'The Lake', boathouse: 'The Boathouse', waterfall: 'The Waterfall', caves: 'The Caves', amphitheater: 'The Amphitheater',
  'boney-island': 'Boney Island', 'playa-des-losers': 'Playa Des Losers',
  'trailer-inside': 'Inside the Trailer', 'western-set': 'The Western Set', 'city-set': 'The City Set',
  'chris-quarters': "Chris's Quarters", cockpit: 'The Cockpit', river: 'The River', kitchen: "Chef's Kitchen",
  carousel: 'The Carousel', 'corn-maze-inside': 'Inside the Corn Maze', 'soluna-exile': 'Exile Island', 'stawaki-exile': 'Exile Beach', motel: 'The Motel', sign: 'One Final Choice', 'boat-side': 'The Boat of Losers', yacht: 'On the way in', 'bus-door': 'The Bus', drop: 'The Drop of Shame', 'limo-park': 'The Red Carpet', 'limo-back': 'The Lame-o-sine', 'limo-in': 'The Lame-o-sine', pier: 'The Pier', 'boat-deck': 'The Boat' });

// ── STAGING — where a scene plays, beyond where the engine says the people were ──────────
// The engine knows six places at Wawanakwa, chosen for privacy (who can overhear). Television
// uses every corner of camp: a private word at the cabins is shot on the porch or between the
// bunks; a public breakfast is the mess hall; an evening gathering is the campfire. A scene is
// moved only to a place of the same kind (public stays public, private stays private), only
// when its lines do not name the place it was written for, and never by dice: the same scene
// is always staged in the same place.
const STAGE = {
  'hosted-camp': {
    cabins: [['washroom', 2, null, 'morning'], ['cabin-inside', 3, /^(life\.(wakeup|mood|sleep)|romance\.(night|honeymoon)|friend\.(comfort|secret|bond)|blind\.|idol\.confide|drama\.paranoia)/], ['cabin-inside', 2], ['cabins', 2]],
    'communal-grounds': [['mess-hall', 4, /^(hosted\.slop|life\.(food|meal|hunger)|drama\.mess)/], ['mess-hall', 3, /^(life\.(work|chore)|hosted\.chore)/], ['washroom', 3, /^(life\.wakeup|drama\.(vanity|primp))/],
      // the camp clock: breakfast and dinner are the mess hall, mornings the washrooms, chores the mess hall,
      // the evening the campfire; the afternoon is the yard
      ['mess-hall', 3, null, 'morning'], ['washroom', 2, null, 'morning'], ['communal-grounds', 1, null, 'morning'],
      ['communal-grounds', 3, null, 'day'], ['mess-hall', 1, null, 'day'],
      ['communal-grounds', 2, null, 'return'], ['mess-hall', 2, null, 'return'],
      ['campfire', 3, null, 'evening'], ['mess-hall', 2, null, 'evening'], ['communal-grounds', 1, null, 'evening']],
    'forest-trail': [['beach', 3, /^(romance\.|friend\.(walk|laugh))/], ['waterfall', 2, /^(romance\.|friend\.(walk|laugh|comfort))/], ['cliff', 2, /^(drama\.(meltdown|clash)|plot\.|broker\.)/],
      ['caves', 1, /^(plot\.|broker\.|idol\.)/], ['forest-trail', 3], ['beach', 1], ['cliff', 1], ['waterfall', 1]],
    dock: [['dock', 3], ['beach', 2], ['lake', 1]],
    lake: [['lake', 3], ['dock', 1]],
  },
  // the lot's clock: meals at craft services, mornings at the trailers, the afternoon on the backlot
  'film-lot': {
    'studio-backlot': [['craft-services', 4, /^(crowd\.(meal|dinner)|hosted\.slop|life\.(food|meal|hunger)|drama\.mess)/],
      ['craft-services', 3, null, 'morning'], ['trailers', 2, null, 'morning'], ['studio-backlot', 1, null, 'morning'],
      ['studio-backlot', 3, null, 'day'], ['craft-services', 1, null, 'day'],
      ['studio-backlot', 2, null, 'return'], ['craft-services', 2, null, 'return'],
      ['craft-services', 2, null, 'evening'], ['studio-backlot', 2, null, 'evening'], ['trailers', 1, null, 'evening']],
    trailers: [['trailer-inside', 3, /^(life\.(wakeup|mood|sleep)|romance\.(night|honeymoon)|friend\.(comfort|secret|bond)|blind\.|idol\.confide|drama\.paranoia)/],
      ['trailers', 3], ['trailer-inside', 2, null, 'morning'], ['trailer-inside', 1, null, 'evening'], ['soundstage-corridor', 1, null, 'evening']],
  },
  // the island's clock: mornings and the night's private talk at the shelter, the afternoon on the beach,
  // the fire in the evening; a walk or a flirt on the shoreline goes down to the beach
  'survival-island': {
    campfire: [['shelter', 3, /^(life\.(wakeup|mood|sleep)|romance\.(night|honeymoon)|friend\.(comfort|secret)|blind\.|drama\.paranoia)/],
      ['shelter', 2, null, 'morning'], ['campfire', 2, null, 'morning'],
      ['beach', 2, null, 'day'], ['campfire', 2, null, 'day'], ['shelter', 1, null, 'day'],
      ['beach', 1, null, 'return'], ['campfire', 2, null, 'return'],
      ['campfire', 3, null, 'evening'], ['shelter', 1, null, 'evening']],
    shoreline: [['beach', 3, /^(romance\.|friend\.(walk|laugh))/], ['shoreline', 2], ['beach', 1]],
  },
  // Stawaki's clock: mornings and night talk in the team's tent, afternoons wandering the midway,
  // coming back through the gate; a walk in the woods turns down to the lake
  carnival: {
    campsite: [['shelter', 3, /^(life\.(wakeup|mood|sleep)|romance\.(night|honeymoon)|friend\.(comfort|secret)|blind\.|drama\.paranoia)/],
      ['shelter', 2, null, 'morning'], ['campsite', 2, null, 'morning'],
      ['midway', 2, null, 'day'], ['campsite', 2, null, 'day'],
      ['carnival-entrance', 2, null, 'return'], ['campsite', 2, null, 'return'], ['carnival-entrance', 1, null, 'day'],
      ['campsite', 3, null, 'evening'], ['midway', 1, null, 'evening']],
    'forest-edge': [['lake-shore', 3, /^(romance\.|friend\.(walk|laugh))/], ['forest-edge', 3], ['rocky-beach', 1]],
    'corn-maze': [['corn-maze-inside', 3], ['corn-maze', 2]],
    midway: [['midway', 3], ['carousel', 2, /^(romance\.|friend\.(walk|laugh|bond))/], ['carousel', 1]],
  },
  // the jet's clock: meals in the galley, the morning queue in the aisle, economy the rest of the time
  'world-tour': {
    economy: [['galley', 4, /^(crowd\.(meal|dinner)|hosted\.slop|life\.(food|meal|hunger)|drama\.mess)/],
      ['galley', 2, null, 'morning'], ['aisle', 2, null, 'morning'], ['economy', 2, null, 'morning'],
      ['economy', 3, null, 'day'], ['aisle', 2, null, 'day'],
      ['economy', 3, null, 'return'], ['aisle', 1, null, 'return'],
      ['galley', 1, null, 'evening'], ['economy', 3, null, 'evening'], ['aisle', 1, null, 'evening']],
  },
};
const PLACE_WORDS = { lake: /\b(lake|canoe|shore)\b/i, dock: /\b(dock|lake)\b/i, 'forest-trail': /\b(woods|forest|trail)\b/i, cabins: /\b(cabins?|porch)\b/i, campfire: /\bfire\b/i, 'mess-hall': /\b(mess hall|slop|tray|Chef)\b/i, 'communal-grounds': /\b(grounds|yard)\b/i };
// What a scene is doing, from its lines and its kind, and the places that can hold it.
const ACT_WASH = /\b(teeth|toothbrush|shower|wash(es|ing)? (up|my|your|his|her|their)|mirror|toilet|bathroom|washroom|sink)\b/i;
const ACT_OUTDOOR = /\b(leaves|firewood|wood|logs?|bucket|haul(ing)?|sweep(ing)?|dig(ging)?|fetch(ing)? water|chores|rake|fishing|fish|stones?|sticks?|branch(es)?|sand|swim(ming)?)\b/i;
const ACT_FOOD = /\b(breakfast|lunch|dinner|eat(ing)?|food|tray|slop|bowl|plate|spoon|snack|meal)\b/i;
const ACT_SLEEP = /\b(bunk|bed|asleep|sleeping|pillow|woke|wake up|snor(e|ing))\b/i;
const INDOOR = new Set(['washroom', 'cabin-inside', 'mess-hall', 'kitchen', 'trailer-inside', 'craft-services', 'galley', 'economy', 'aisle', 'cargo-hold', 'shelter', 'caves', 'cave', 'boathouse']);
const EATS = new Set(['mess-hall', 'kitchen', 'craft-services', 'galley', 'campfire', 'campsite']);
function fitsPlace(to, text, kind) {
  if (to === 'washroom') return ACT_WASH.test(text) || /^(life\.wakeup|drama\.(vanity|primp))/.test(kind);
  if (ACT_WASH.test(text) && !['washroom', 'cabin-inside', 'trailer-inside', 'water-source', 'lake-shore', 'aisle'].includes(to)) return false;
  if (ACT_OUTDOOR.test(text) && INDOOR.has(to) && !(to === 'mess-hall' && ACT_FOOD.test(text))) return false;
  if (ACT_FOOD.test(text) && !EATS.has(to) && !ACT_OUTDOOR.test(text) && /\b(breakfast|dinner|lunch|tray|slop|bowl|spoon)\b/i.test(text)) return false;
  if (ACT_SLEEP.test(text) && !INDOOR.has(to) && /\b(bunk|bed|pillow)\b/i.test(text)) return false;
  return true;
}

export function stageSpot(venue, spot, ev, windowId) {
  // a scene the story layer placed on purpose stays where it was put (td/story/places.js)
  if (ev?.scene?.spot?.fixed) return spot;
  const rules = STAGE[venue]?.[spot];
  if (!rules) return spot;
  const text = (ev.lines || []).map(l => l.text).join(' ') || String(ev.text || '');
  if (PLACE_WORDS[spot]?.test(text)) return spot;
  const kind = ev.scene?.kind || ev.type || '';
  const time = windowId === 'morning' ? 'morning' : windowId === 'before-tribal' || windowId === 'scramble' ? 'evening' : windowId === 'return' ? 'return' : 'day';
  // the move must make sense for what they are doing (the user, 2026-10-08: "carrying leaves in the
  // bathroom"): the washrooms only for washing up, never outdoor work indoors, food where they eat
  const fit = rules.filter(([to, , re, when]) => (!re || re.test(kind)) && (!when || when === time) && fitsPlace(to, text, kind));
  const pick = fit.find(([, , re]) => re) ? fit.filter(([, , re]) => re) : fit.filter(([, , re]) => !re);
  const total = pick.reduce((a, [, w]) => a + w, 0);
  let roll = hash(`${kind}|${(ev.players || []).join(',')}|${text.slice(0, 40)}`) % Math.max(total, 1);
  for (const [to, w] of pick) { if ((roll -= w) < 0) return to; }
  return spot;
}

export const placeName = spot => PLACE[spot] || String(spot || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// what someone does when they are at a spot and not in the conversation
const BUSY = {
  dock: ['fish', 'read', 'nap'], cabins: ['read', 'sweep', 'nap'], 'mess-hall': ['eat', 'eat', 'read'], campfire: ['stretch', 'read', 'whittle'],
  'communal-grounds': ['sweep', 'stretch', 'read'], 'forest-trail': ['stretch', 'read'], shelter: ['nap', 'whittle', 'sweep'], beach: ['nap', 'stretch', 'read'],
  shoreline: ['fish', 'read'], 'water-source': ['fetch', 'stretch'], 'jungle-trail': ['stretch'], 'fishing-area': ['fish', 'fish'], ruins: ['stretch', 'read'], cave: ['read'], trailers: ['read', 'nap'],
  'craft-services': ['eat', 'eat'], 'studio-backlot': ['stretch', 'read'], 'soundstage-corridor': ['read'], 'prop-storage': ['read'],
  economy: ['nap', 'read'], aisle: ['read'], galley: ['eat'], 'cargo-hold': ['nap'], 'first-class': ['nap', 'read'], 'destination-staging': ['stretch'],
  campsite: ['whittle', 'read', 'nap'], 'forest-edge': ['stretch'], 'rocky-beach': ['fish', 'read'], 'lake-shore': ['fish', 'read'],
  'carnival-entrance': ['read'], midway: ['eat', 'stretch'],
  'cabin-inside': ['nap', 'read', 'nap'], beach: ['nap', 'stretch', 'fish'], washroom: ['sweep'], cliff: ['stretch'],
  'chris-quarters': ['read'], cockpit: ['read'], carousel: ['stretch', 'read'], 'corn-maze-inside': ['stretch'], river: ['fish', 'stretch'], kitchen: ['eat'], 'trailer-inside': ['nap', 'read'], 'western-set': ['stretch', 'read'], 'city-set': ['stretch', 'read'],
  lake: ['fish', 'stretch', 'read'], boathouse: ['whittle', 'read'], waterfall: ['stretch', 'read'], caves: ['read'], amphitheater: ['stretch', 'read'],
};

// ── the clock ─────────────────────────────────────────────────────────
// Camp windows (js/camp-access.js) as hours on the clock; a phase never runs backwards.
const WINDOWS = { morning: [7 * 60, 9 * 60], 'camp-work': [9 * 60, 13 * 60], return: [15 * 60, 15 * 60 + 45], scramble: [15 * 60 + 45, 18 * 60 + 30], 'before-tribal': [18 * 60 + 30, 20 * 60 + 15] };
const clockText = m => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };

// ── names ─────────────────────────────────────────────────────────────
const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
export const cleanText = s => String(s || '').replace(/â€”/g, '—').replace(/â€“/g, '–').replace(/â€™/g, '’').replace(/â€œ|â€\u009d/g, '"').replace(/\s+/g, ' ').trim();

// ══════════════════════════════════════════════════════════════════════
// PLACING PEOPLE — once per scene, from the plate's marks
// ══════════════════════════════════════════════════════════════════════
// Venues where the teams live apart (DC5's Soluna, DC4's Stawaki): each team has its own campsite,
// painted as '<spot>-t<slot>' plates (tools/td-camp/venues/*_teams.py), the merged camp as
// '<spot>-merge'. A camp's slot is its team's place in the episode's team order, three campsites
// round; the camp map (map.js) uses the same slots.
export const APART = new Set(['survival-island', 'carnival']);
export function campSlot(ep, camp, venue) {
  if (!APART.has(venue)) return null;
  if (camp === 'merge') return 'merge';
  const i = (ep?.tribesAtStart || []).map(t => t.name).indexOf(camp);
  return i < 0 ? null : i % 3;
}
/** The spot's plate for this team's campsite, where one is painted; otherwise the shared one. */
export function teamSpot(venue, spot, slot) {
  if (slot == null) return spot;
  const s = `${spot}-${slot === 'merge' ? 'merge' : `t${slot}`}`;
  return TD_MARKS[`${venue}/${s}-day`] || TD_MARKS[`${venue}/${s}-night`] ? s : spot;
}
export const plateKey = (venue, spot, tod) => {
  for (const t of [tod, tod === 'night' ? 'day' : 'night']) if (TD_MARKS[`${venue}/${spot}-${t}`]) return `${venue}/${spot}-${t}`;
  return null;
};
const marksOf = (key, kind) => ((TD_MARKS[key] || {}).m || []).filter(m => m.kind === kind);

// Speakers up front and apart, in the band above the dialogue panel; the busy ones further back.
// Every name asked for gets a place: when the plate runs out of marks, the band is shared out.
export function placeScene(key, focus, bg = [], { sit = false, host = null } = {}) {
  const out = {};
  const used = [];
  const apart = (a, b) => Math.abs(a.u - b.u) > .13;
  const behind = (c, u) => apart(c, u) || u.v - c.v > .07;
  const score = m => m.s - Math.abs(m.u - .5) * .3;
  const seats = marksOf(key, 'seat').filter(m => m.u > .1 && m.u < .9 && m.v > .38 && m.v < .78);
  // .72: a name tag under a standing person must clear the dialogue panel, camera push included
  const stands = marksOf(key, 'stand').filter(m => m.u > .1 && m.u < .9 && m.v > .36 && m.v < .72);
  const front = [...(sit && seats.length >= Math.min(focus.length, 2) ? seats : stands)].sort((a, b) => score(b) - score(a));
  if (host) {
    const h = marksOf(key, 'host')[0];
    if (h) out[host] = { u: h.u, v: h.v, s: h.s, host: true };
  }
  if (focus.length > 3) {
    // a group (the user, 2026-10-08: "size them so we see everyone, no overlap, and if they have to
    // sit on a stump they sit on it"): on the set's seats when there are enough of them, otherwise in
    // one or two rows across the floor; each person sized to the gap they have, never wider than it
    const n = focus.length, W = .5625;   // a token's width is its height x 9/16 of the frame
    const seatsApart = [];
    for (const m of [...seats].sort((a, b) => score(b) - score(a))) if (seatsApart.every(x => Math.abs(x.u - m.u) > .045 || Math.abs(x.v - m.v) > .06)) seatsApart.push(m);
    if (seatsApart.length >= n) {
      const chosen = seatsApart.slice(0, n).sort((a, b) => a.u - b.u);
      const gap = Math.min(...chosen.slice(1).map((m, i) => (Math.abs(m.v - chosen[i].v) > .06 ? 1 : m.u - chosen[i].u)), .2);
      focus.forEach((name, i) => { const m = chosen[i]; out[name] = { u: m.u, v: m.v, s: m.s, sit: true, h: Math.max(8, Math.min(m.s * 95, 24, (gap * 1.05) / W * 100)) }; });
    } else {
      // on the ground (the user, 2026-10-08: "they're floating... everyone there without overlapping"):
      // the crowd stands on the floor in front of the set, two rows past six, each back-row person
      // between two in front with no more than the lower third behind them
      const placed = floorRows(focus, .1, .9, 22);
      for (const [name, p] of Object.entries(placed)) out[name] = p;
    }
  } else for (const n of focus) {
    const m = front.find(c => !used.includes(c) && used.every(u => apart(c, u)) && (!out[host] || apart(c, out[host])));
    if (m) { used.push(m); out[n] = { u: m.u, v: m.v, s: m.s, sit: sit && seats.includes(m) }; }
  }
  // whoever the marks could not seat or stand: the open slots across the band, never on top of
  // somebody already placed and never off screen
  const taken = () => Object.values(out).map(p => p.u);
  for (const n of focus.filter(x => !out[x])) {
    const slot = [.3, .7, .18, .82, .5, .42, .58].find(u => taken().every(t => Math.abs(t - u) > .11)) ?? .5;
    const near = front.length ? front.reduce((a, b) => (Math.abs(b.u - slot) < Math.abs(a.u - slot) ? b : a)) : null;
    out[n] = { u: slot, v: near ? near.v : .7, s: near ? near.s : .2, sit: false };
  }
  const back = [...marksOf(key, 'stand'), ...marksOf(key, 'seat')].filter(m => m.u > .08 && m.u < .92 && m.v > .22 && m.v < .74).sort((a, b) => a.s - b.s);
  for (const b of bg) {
    const m = back.find(c => !used.includes(c) && used.every(u => behind(c, u)));
    if (m) { used.push(m); out[b] = { u: m.u, v: m.v, s: m.s, sit: false, bg: true }; }
  }
  return out;
}

// A name talked about as not there ("Eureka isn't even here", "behind her back", "while he was gone"),
// who never speaks in the scene: off the stage. And a scene whose stage directions put a group there.
const reEsc = x => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function awayIn(lines, said) {
  const names = [...new Set(lines.flatMap(l => String(l.text || '').match(/\b[A-Z][a-z]+\b/g) || []))].filter(n => !said.includes(n));
  return names.filter(n => { const e = reEsc(n); return lines.some(l => new RegExp(`\\b${e}\\b('s)? (isn't|is not|wasn't|was not|ain't) (even )?(here|there|around)|behind ${e}'s back|while ${e} (was|is) (gone|away|off)|${e} (left|walked off|is off|went off) `, 'i').test(l.text || '')); });
}
const CROWD_BEAT = /\b(the group|everyone|everybody|the whole (team|camp|tribe)|around the fire|the others|the circle|hands? (go|goes|went) up|nobody else|the rest of (them|the team|the camp|the tribe)|the tribe (lies|takes|watches|stares|laughs|cheers|goes|sits|gathers|looks|is|turns|debates|claps)|the camp (watches|debates|stares|laughs|goes|turns|saw|is)|camp (saw|watches|remembers)|half the (camp|tribe)|in front of the (camp|tribe|group|others)|people (nod|laugh|stare|watch|clap|cheer|look)|nobody (can|is sure|says|moves|speaks|laughs)|heads turn)\b/i;
const crowdIn = lines => lines.some(l => (l.kind === 'beat' && CROWD_BEAT.test(l.text || ''))
  || (l.kind === 'say' && /\b(put it to a vote|hands up if|all of you|everybody listen|listen up)\b/i.test(l.text || '')));
// events the engine plays out in front of the whole group (two people fighting over who leads it, a
// group scene, a laugh the whole camp shares)
const CROWD_TYPES = new Set(['leadershipClash', 'groupArgument', 'campMeeting', 'teamMeeting', 'publicCallout', 'exclusion', 'groupScene', 'groupLaugh']);

// A crowd standing on the ground between u0 and u1: one row up to six, else a front row on the floor
// line and a back row a step behind, each back-row person in the gap between two in front, sized
// so no portrait is wider than its share and no more than a third of a back-row one is covered.
const FLOOR_FRONT = .81, FLOOR_BACK_MIN = .69;
function floorRows(names, u0, u1, hMax) {
  const n = names.length, W = .5625, out = {};
  const rows = n > 6 ? 2 : 1, nf = Math.ceil(n / rows), nb = n - nf;
  const slot = (u1 - u0) / Math.max(nf, 1);
  let h = Math.min(hMax, (slot * .92) / W * 100);
  if (rows === 2) h = Math.min(h, (FLOOR_FRONT - FLOOR_BACK_MIN) / .7 * 100);
  const vb = Math.max(FLOOR_BACK_MIN, FLOOR_FRONT - .7 * h / 100);
  // the front row centred in its slots, the back row in the gaps between them
  names.forEach((name, i) => {
    const back = rows === 2 && i % 2 === 1, k = rows === 2 ? Math.floor(i / 2) : i;
    // the gaps between the front row, and with as many behind as in front, the last one at the left edge
    const u = back ? u0 + slot * ((k + 1) % (nb === nf ? nf : nf + 1)) + (nb === nf && k === nf - 1 ? slot * .1 : 0) : u0 + slot * (k + .5);
    out[name] = { u: Math.min(.95, Math.max(.05, u)), v: back ? vb : (rows === 1 ? FLOOR_FRONT - .03 : FLOOR_FRONT), s: .2, h: back ? h * .96 : h, sit: false, crowd: true };
  });
  return out;
}

// Teams gathered apart (the user, 2026-10-08: "two circles with their colour flag"): each team in a
// ring around its own flag, side by side across the floor, the host between them. Returns the places
// and the flags for the scene (scene.flags, drawn by stage.js under the people).
export function placeTeams(key, teams, host, colorOf = null) {
  const stands = marksOf(key, 'stand').filter(m => m.u > .08 && m.u < .92 && m.v > .36 && m.v < .74);
  const k = teams.length, out = {}, flags = [];
  let hostH = 12;
  const PAL = ['#e8433f', '#3b7dd8', '#2fbf71', '#f2c83a', '#9b59d0'];
  const half = k === 1 ? .36 : Math.min(.2, .42 / k);
  teams.forEach((t, ti) => {
    const cu = k === 1 ? .5 : .08 + (.84 * (ti + .5)) / k;
    const placed = floorRows(t.members, cu - half + .02, cu + half - .02, 16);
    Object.assign(out, placed);
    const h = Math.max(...Object.values(placed).map(p => p.h), 8), backV = Math.min(...Object.values(placed).map(p => p.v));
    let color = PAL[ti % PAL.length]; try { color = (colorOf && colorOf(t.name)) || color; } catch { /* default */ }
    flags.push({ u: cu, v: backV - .006, name: t.name, color, h: h * 1.8 });
    hostH = Math.max(hostH, h * 1.12);
  });
  if (host) out[host] = { u: .5, v: FLOOR_FRONT, s: .2, host: true, h: hostH, crowd: true };
  return { places: out, flags };
}

// A whole room seated (the ceremony): every seat in the band, front row first, kept apart.
export function seatAll(key, names, host) {
  const out = {};
  if (host) { const h = marksOf(key, 'host')[0]; if (h) out[host] = { u: h.u, v: h.v, s: h.s, host: true }; }
  const seats = marksOf(key, 'seat').filter(m => m.v < .8 && m.u > .06 && m.u < .94).sort((a, b) => b.v - a.v || a.u - b.u);
  const chosen = [];
  for (const m of seats) if (chosen.length < names.length && chosen.every(c => Math.abs(c.u - m.u) > .09 || Math.abs(c.v - m.v) > .06)) chosen.push(m);
  for (const m of seats) if (chosen.length < names.length && !chosen.includes(m)) chosen.push(m);
  if (chosen.length < names.length) {
    const st = marksOf(key, 'stand').filter(m => m.v < .73).sort((a, b) => b.s - a.s);
    for (const m of st) if (chosen.length < names.length && chosen.every(c => Math.abs(c.u - m.u) > .08)) chosen.push({ ...m, stand: true });
  }
  chosen.sort((a, b) => a.u - b.u);
  names.forEach((n, i) => {
    const m = chosen[i];
    out[n] = m ? { u: m.u, v: m.v, s: m.s, sit: !m.stand } : { u: .12 + .76 * (i + .5) / names.length, v: .72, s: .16, sit: true };
  });
  return out;
}

// ══════════════════════════════════════════════════════════════════════
// ACTIONS — read from what HAPPENS (a stage direction), never from a line's words
// ══════════════════════════════════════════════════════════════════════
const ACTS = [
  ['storm', /\b(storms?|stomps?|walks? (off|away)|slams?|marches (off|back))\b/i],
  ['kiss', /\bkiss(es|ed)?\b/i],
  ['hug', /\b(hugs?|embraces?)\b/i],
  ['shake', /\b(slaps?|shoves?|pushes|smacks?|throws?)\b/i],
  ['laugh', /\b(laugh(s|ing)?|giggles?|cracks? up|snickers?)\b/i],
  ['lean', /\b(whispers?|leans? in|lowers? (his|her|their) voice)\b/i],
  ['shout', /\b(shouts?|yells?|screams?|snaps?|explodes?|erupts?)\b/i],
];
function actOf(text, cast, lastBy) {
  const t = String(text || '');
  for (const [kind, re] of ACTS) {
    if (!re.test(t)) continue;
    const who = cast.filter(n => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t));
    return { kind, who: who.length ? who : (lastBy ? [lastBy] : []) };
  }
  return null;
}
const loud = text => /!/.test(text) && (text.length < 80 || /\b[A-Z]{3,}\b/.test(text));
// a line that lands as a shock: disbelief at a reveal ("What? No.", "Are you kidding me?!", "You WHAT?")
const SHOCK = /^(what\?|wait\. ?(what|no|me)|no\. no|oh my (god|gosh)|are you (kidding|serious)|you what\?|me\? it's me|seriously\?|unbelievable|hold on\. hold on)/i;
const shock = text => SHOCK.test(String(text || '').trim());
// the big moments of camp get the show's title card (an alliance forming already has its own)
const STORY_TITLE = [
  [/^(long\.)?deal\.side/, ev => ({ kicker: 'The deal', name: `Final ${ev.scene?.data?.size || 'two'}` })],
  [/^(long\.)?fallout\.flip/, () => ({ kicker: 'Secret flip', name: 'Nobody knows', shock: true })],
  [/^(long\.)?romance\.spark/, () => ({ kicker: 'Showmance', name: "It's official" })],
  [/^(long\.)?romance\.(fade|tri\.ultimatum|affair\.(exposed|leaves))/, () => ({ kicker: 'Heartbreak', name: "It's over", shock: true })],
  [/^(long\.)?drama\.(fight|explode)/, () => ({ kicker: 'Blow-up', name: 'Camp erupts', shock: true })],
  [/^(long\.)?drama\.bomb/, () => ({ kicker: 'Said it', name: 'Out loud, in front of everyone' })],
  [/^(long\.)?leak\.heard/, () => ({ kicker: 'Overheard', name: 'Somebody was listening', shock: true })],
  [/^(long\.)?alliance\.expel/, ev => ({ kicker: 'Kicked out', name: ev.scene?.data?.group || 'Out of the alliance', shock: true })],
  [/^(long\.)?alliance\.end/, ev => ({ kicker: 'Alliance over', name: ev.scene?.data?.group || "It's finished" })],
  [/^(long\.)?recruit\.join/, ev => ({ kicker: 'New member', name: ev.scene?.data?.group || 'The alliance grows' })],
  [/^(long\.)?(plot\.lie|talk\.lie)/, () => ({ kicker: 'A lie', name: 'Planted' })],
  [/^story\.morning$/, ev => (ev.step === 'blindside' ? { kicker: 'The morning after', name: 'Blindside', shock: true } : null)],
];

// ══════════════════════════════════════════════════════════════════════
// CAMP — one screen per camp and phase, cutting spot to spot
// ══════════════════════════════════════════════════════════════════════
export function tdCampScreen(ep, camp, phase, members = [], o = {}) {
  // the scenes that air, in story order (td/story/director.js); an episode without one plays every event
  const events = campFeed(ep, camp, phase);
  if (!events.length) return null;
  const venue = venueOf(ep, o);
  const V = VENUES[venue];
  const windows = ep.campAccess?.phases?.[`${phase}:${camp}`] || [];
  const slot = o.slot !== undefined ? o.slot : campSlot(ep, camp, venue);
  const cast = [...new Set([...members, ...events.flatMap(e => e.players || [])])].filter(Boolean);
  const steps = [];
  let clock = phase === 'pre' ? 7 * 60 + 5 : 15 * 60 + 10;
  let cur = null;                       // the scene on screen: { spot, tod, people }
  // who else is around: whoever the engine put at that spot in that window, busy with something
  // that fits the place the scene is shown in
  const busyAt = (spot, windowId, focus, shown = spot) => {
    const w = windows.find(x => x.id === windowId) || windows[windows.length - 1];
    const here = (w?.assignments || []).find(a => a.locationId === spot)?.players || [];
    return here.filter(n => !focus.includes(n) && cast.includes(n)).slice(0, 3)
      .map(n => ({ n, act: (BUSY[shown] || ['read'])[hash(n + shown) % (BUSY[shown] || ['read']).length] }));
  };
  let engineAt = null;
  const open = (spot, windowId, focus, { cut = false, why = null } = {}) => {
    const win = WINDOWS[windowId];
    clock = Math.max(clock + 6 + (hash(spot + clock) % 9), win ? win[0] : 0);
    // the window the map draws at night is night in every scene in it (the user, 2026-10-08: "the fishing
    // spot doesn't use the night version": a 6:45 PM talk played in daylight on a night map)
    const tod = windowId === 'before-tribal' || clock >= 19 * 60 + 15 ? 'night' : 'day';
    const key = plateKey(venue, spot, tod) ? spot : V.public;
    const plate = plateKey(venue, teamSpot(venue, key, slot), tod);
    const bg = busyAt(engineAt || key, windowId, focus, key);
    const sit = V.sit.includes(key);
    const places = placeScene(plate, focus, bg.map(b => b.n), { sit });
    const same = cur && cur.spot === key && cur.tod === tod;
    cur = { spot: key, tod };
    steps.push({ k: 'scene', spot: key, tod, plate, place: placeName(key), time: clockText(clock), card: !same, cut, focus, bg, places, why });
  };
  for (const ev of events) {
    const engineSpot = ev.scene?.spot?.id || ev.access?.locationId || V.public;
    const windowId = ev.scene?.spot?.window || ev.access?.windowId || (phase === 'pre' ? 'camp-work' : 'scramble');
    const spot = engineSpot === 'confessional' ? engineSpot : stageSpot(venue, engineSpot, ev, windowId);
    const badge = ev.badgeText ? { text: cleanText(ev.badgeText), cls: ev.badgeClass || '' } : null;
    engineAt = engineSpot === 'confessional' ? null : engineSpot;
    if (Array.isArray(ev.lines) && ev.lines.length) {
      // everyone who speaks is on stage, always (a speaker without a place is a person who blinks out)
      const said = [...new Set(ev.lines.filter(l => l.kind === 'say').map(l => l.by).filter(Boolean))];
      // who is really there (the user, 2026-10-08: "why is she even here... where is everyone you talk
      // about"): somebody the scene talks about as away is not put on stage, and a scene set among
      // the group brings the group on
      const absent = awayIn(ev.lines, said);
      const who = Object.values(ev.scene?.who || {}).filter(n => n && !absent.includes(n));
      let focus = [...said, ...who.filter(n => !said.includes(n))].slice(0, Math.max(4, said.length));
      if (CROWD_TYPES.has(ev.type) || /^crowd\./.test(ev.scene?.kind || '') || crowdIn(ev.lines)) focus = [...focus, ...(members || []).filter(n => !focus.includes(n) && !absent.includes(n))].slice(0, 8);
      const onlyConf = ev.lines.every(l => l.kind === 'conf' || l.kind === 'beat') && !said.length;
      if (!onlyConf) open(spot === 'confessional' ? V.public : spot, windowId, focus.length ? focus : (ev.players || []).slice(0, 3), { why: badge });
      else if (!cur) open(V.public, windowId, (ev.players || []).slice(0, 3), { why: badge });
      let lastBy = null;
      for (const l of ev.lines) {
        const text = cleanText(l.text);
        if (!text) continue;
        if (l.kind === 'conf') steps.push({ k: 'conf', by: l.by, text });
        else if (l.kind === 'beat') steps.push({ k: 'beat', text, act: actOf(text, cast, lastBy) });
        else { steps.push({ k: 'say', by: l.by, text, loud: loud(text), shock: shock(text) }); lastBy = l.by; }
      }
      if (ev.type === 'idolFound') foundStep(steps, ev);
      const tt = ev.type !== 'allianceForm' ? STORY_TITLE.find(([re]) => re.test(ev.kind || ev.scene?.kind || ''))?.[1](ev) : null;
      if (tt) steps.push({ k: 'title', kicker: tt.kicker, name: cleanText(tt.name), faces: [...new Set((ev.players || []).filter(Boolean))].slice(0, 4), shock: !!tt.shock, sting: !tt.shock });
      if (ev.type === 'allianceForm' && ev.alliance) {
        steps.push({ k: 'title', kicker: 'Alliance formed', name: cleanText(ev.alliance), faces: (ev.members || ev.players || []).slice(0, 4),
          side: [{ tab: 'allies', name: cleanText(ev.alliance), who: (ev.members || ev.players || []).slice() }] });
      }
      const last = steps[steps.length - 1];
      (last.side ||= []).push({ tab: 'log', text: `${badge ? badge.text + ': ' : ''}${(ev.players || []).join(', ')}` });
      // what the dialogue doesn't say: why this is happening now, and what only the viewer knows (td/story)
      for (const t of ev.why || []) last.side.push({ tab: 'mind', text: cleanText(t) });
      // ...and what it did to the relationships of the people in it (bonds.js journal, td/script/write.js)
      const BW = v => v >= 6 ? 'very close' : v >= 3 ? 'friends' : v > -2 ? 'neutral' : v > -5 ? 'wary of each other' : 'enemies';
      for (const x of ev.bondDelta || []) last.side.push({ tab: 'bonds', a: x.a, b: x.b, d: x.d, now: x.now, word: BW(x.now) });
    } else {
      // An event the script layer has not reached yet: a cutaway, in the engine's own sentence.
      const text = cleanText(ev.text);
      if (!text) continue;
      const focus = (ev.players || []).filter(Boolean).slice(0, 3);
      open(spot === 'confessional' ? V.public : spot, windowId, focus, { cut: true, why: badge });
      steps.push({ k: 'beat', text, badge, cut: true, act: actOf(text, cast, null),
        side: [{ tab: 'log', text: `${badge ? badge.text + ': ' : ''}${focus.join(', ')}` }] });
      if (ev.type === 'idolFound' && focus[0]) { steps[steps.length - 1].side.push({ tab: 'secrets', text: `${focus[0]} found a Hidden Immunity Idol.` }); foundStep(steps, ev); }
    }
  }
  if (!steps.length) return null;
  const isMerge = /^merge|merged$/i.test(camp) || camp === (o.mergeName || '');
  return { id: `camp-${phase}-${camp}`, kind: 'camp', venue, camp, phase, ep: ep.num,
    label: `${isMerge ? 'Camp' : camp} · ${phase === 'pre' ? 'Morning' : 'After the challenge'}`, team: isMerge ? null : camp, steps };
}

// A find (an idol, an advantage) as its own moment: the thing rises out of the ground. Only a
// single finder's find; an activation of everyone's idols (Beware) stays a line.
const FIND_NAME = { idol: 'Hidden Immunity Idol', extraVote: 'Extra Vote', voteSteal: 'Vote Steal', legacy: 'Legacy Advantage', kip: 'Knowledge is Power',
  amulet: 'Amulet', secondLife: 'Second Life Amulet', 'idol-totem': 'Hidden Immunity Idol', beware: 'Beware Advantage' };
function foundStep(steps, ev) {
  const who = (ev.players || []).filter(Boolean);
  if (who.length !== 1 || /ACTIVATED/i.test(ev.badgeText || '')) return;
  const item = FIND_NAME[ev.advType] ? ev.advType : 'idol';
  const prev = steps[steps.length - 1];
  steps.push({ k: 'found', who: who[0], item, label: FIND_NAME[item], text: '', side: prev?.side?.some(x => x.tab === 'secrets') ? [] : [{ tab: 'secrets', text: `${who[0]} found the ${FIND_NAME[item]}.` }] });
}

// ══════════════════════════════════════════════════════════════════════
// TRIBAL — the ceremony the season's setting holds
// ══════════════════════════════════════════════════════════════════════
/** Whether this episode's Tribal plays on the stepped stage. Anything unusual keeps the classic screens. */
export function tdTribalStepped(ep) {
  if (!ep || !(ep.votingLog || []).length) return false;
  const elim = ep.eliminated;
  const tribal = ep.tribalPlayers || [];
  if (!elim || elim === 'No elimination' || !tribal.includes(elim)) return false;
  if ((ep.multiTribalResults || []).length || ep.openVote || ep.exileDuelVotedOut || ep.firstEliminated || ep.isFireMaking) return false;
  if (ep.isSlasherNight || ep.isTripleDogDare || ep.isSuddenDeath || ep.emissary || ep.blackVoteApplied || ep.isFinale) return false;
  if (Object.keys(ep.coachData || {}).length) return false;
  return true;
}

// the powers, as a card names them (the classic Votes screen's advantage plays)
const POWER = {
  idol: { name: 'Hidden Immunity Idol', the: 'a Hidden Immunity Idol' }, extraVote: { name: 'Extra Vote', the: 'an Extra Vote' }, voteSteal: { name: 'Steal a Vote', the: 'Steal a Vote' },
  voteBlock: { name: 'Block a Vote', the: 'Block a Vote' }, kip: { name: 'Knowledge is Power', the: 'Knowledge is Power' }, soleVote: { name: 'Sole Vote', the: 'the Sole Vote' },
  safetyNoPower: { name: 'Safety Without Power', the: 'Safety Without Power' }, teamSwap: { name: 'Team Swap', the: 'Team Swap' },
  legacy: { name: 'Legacy Advantage', the: 'the Legacy Advantage' }, amulet: { name: 'Amulet', the: 'an Amulet' },
};
const IDOL_SAY = p => p.type === 'voteBlock' ? `${p.player} blocks ${p.blockedPlayer}'s vote. ${p.blockedPlayer} cannot vote tonight.`
  : p.type === 'voteSteal' ? `${p.player} steals ${p.stolenFrom ? `${p.stolenFrom}'s vote` : 'a vote'}.`
  : p.type === 'extraVote' ? `${p.player} plays an Extra Vote.`
  : p.type === 'kip' ? (p.failed ? `${p.player} guesses ${p.stolenFrom} has an advantage. Wrong.` : `${p.player} takes ${p.stolenFrom}'s ${p.stolenType || 'advantage'}.`)
  : p.type === 'soleVote' ? `${p.player} plays the Sole Vote. Only ${p.player}'s vote counts tonight.`
  : p.type === 'safetyNoPower' ? `${p.player} leaves the ceremony: safe tonight, but without a vote.`
  : p.type === 'teamSwap' ? `${p.player} plays Team Swap.` : null;

export function tdTribalScreen(ep, o = {}) {
  if (!tdTribalStepped(ep)) return null;
  const venue = venueOf(ep, o);
  const V = VENUES[venue];
  const host = o.host || 'Chris';
  const tribal = [...ep.tribalPlayers];
  const elim = ep.eliminated;
  const team = ep.tribalTribe || null;
  const callName = team || 'campers';
  const rng = stableRng('td-tribal', String(ep.num), team || 'merge', elim);
  const pick = arr => arr[Math.floor(rng() * arr.length)];
  const plate = plateKey(venue, 'ceremony', 'night');
  const places = seatAll(plate, tribal, host);
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  steps.push({ k: 'scene', spot: 'ceremony', tod: 'night', plate, place: V.ceremony, time: '8:30 PM', card: true, focus: [], bg: [], places, seated: tribal, host, ceremony: true });
  // the first opener welcomes; the others say they have been here before, so they need a vote behind
  // them (the user: "back at the fire so soon" on a team's first vote). The merge counts from the merge.
  const been = (window.gs?.episodeHistory || []).some(h => h.num < ep.num && h.eliminated && (team ? h.tribalTribe === team : (h.isMerge || h.gsSnapshot?.isMerged)));
  const opens = V.open(callName);
  say(been ? pick(opens.slice(1)) : opens[0]);
  // the questions: the host asks about what happened today (td/story/tribal.js tribalQA); an episode
  // written before that keeps the classic screen's exchanges (buildTribalQA)
  const storyQA = ep.tribalStory?.qa || [];
  for (const ex of storyQA) for (const l of ex.lines || []) {
    const text = cleanText(l.text);
    if (!text) continue;
    if (l.kind === 'beat') steps.push({ k: 'beat', text, focus: ex.players.filter(p => places[p]) });
    else if (l.kind === 'conf') steps.push({ k: 'conf', by: l.by, text });
    else if (l.by === host) say(text, { focus: ex.players.filter(p => places[p]).slice(0, 1) });
    else steps.push({ k: 'say', by: l.by, text, focus: [l.by], loud: loud(text) });
  }
  for (const item of (storyQA.length ? [] : o.qa || [])) {
    const ask = q => { const m = String(q).match(/^(.*?)"(.+)"\s*$/s); return m ? { lead: cleanText(m[1]), quote: cleanText(m[2]) } : { lead: '', quote: cleanText(q) }; };
    if (item.type === 'group') {
      const { lead, quote } = ask(item.question);
      if (lead) steps.push({ k: 'beat', text: lead, focus: [] });
      say(quote);
      for (const ex of item.exchanges || []) steps.push({ k: 'say', by: ex.player, text: cleanText(ex.line), focus: [ex.player] });
    } else {
      const { lead, quote } = ask(item.question);
      if (lead) steps.push({ k: 'beat', text: lead, focus: [item.player] });
      say(quote, { focus: [item.player] });
      steps.push({ k: 'say', by: item.player, text: cleanText(item.answer), focus: [item.player], loud: loud(item.answer) });
    }
    if (item.consequence) steps[steps.length - 1].side = [{ tab: 'room', text: cleanText(item.consequence) }];
  }
  // advantages: who holds what tonight (the viewer sees them glow), and the powers played before the vote
  // (an Extra Vote, a stolen vote, a blocked vote...) each revealed on its own card (the user, 2026-10-08:
  // "they just said Ellie used an extra vote, they didn't show it")
  const plays = ep.idolPlays || [];
  const precast = (ep.votingLog || []).filter(v => (v.voter === 'THE GAME' || v.isBlackVote) && v.voted && tribal.includes(v.voted) && !tribal.includes(v.voter));
  const PRE = new Set(['extraVote', 'voteSteal', 'voteBlock', 'kip', 'soleVote', 'safetyNoPower', 'teamSwap', 'legacy']);
  const prePlays = plays.filter(p => PRE.has(p.type));
  const held = {};
  for (const a of ep.gsSnapshot?.advantages || []) if (tribal.includes(a.holder)) (held[a.holder] ||= new Set()).add(a.type === 'superIdol' ? 'idol' : a.type);
  for (const p of plays) if (tribal.includes(p.player)) (held[p.player] ||= new Set()).add(p.type || 'idol');
  const holdList = Object.entries(held).map(([n, t]) => [n, [...t]]);
  if (holdList.length) steps[0].side = [...(steps[0].side || []), ...holdList.map(([n, t]) => ({ tab: 'room', text: `${n} is holding ${t.map(x => POWER[x]?.the || x).join(' and ')}.` }))];
  steps[0].glow = Object.fromEntries(holdList.map(([n, t]) => [n, t.includes('idol') ? 'idol' : 'power']));
  // the room reacting to a play (td/story/tribal.js playReactions), right after its card
  const reacted = p => {
    const r = (ep.tribalStory?.plays || []).find(x => x.idx === (ep.idolPlays || []).indexOf(p));
    for (const l of r?.lines || []) {
      const text = cleanText(l.text);
      if (!text) continue;
      if (l.kind === 'beat') steps.push({ k: 'beat', text, focus: [p.player].filter(n => tribal.includes(n)) });
      else if (l.kind === 'conf') steps.push({ k: 'conf', by: l.by, text });
      else if (l.by === host) say(text);
      else steps.push({ k: 'say', by: l.by, text, focus: [l.by], loud: loud(text), shock: shock(text) });
    }
  };
  if (prePlays.length) {
    say(`Before we vote: if anybody has an advantage they want to play, now is the time.`);
    for (const p of prePlays) {
      const P = POWER[p.type] || { name: p.type };
      steps.push({ k: 'power', by: p.player, type: p.type, name: P.name, the: P.the || P.name, on: p.blockedPlayer || p.stolenFrom || p.swappedPlayer || null,
        focus: [p.player, p.blockedPlayer || p.stolenFrom].filter(n => n && tribal.includes(n)) });
      const t = IDOL_SAY(p);
      if (t) say(t, { focus: [p.player].filter(n => tribal.includes(n)) });
      reacted(p);
    }
  }
  // the vote
  const voters = [...new Set((ep.votingLog || []).map(v => v.voter).filter(n => tribal.includes(n)))];
  say(V.voted);
  // the voting booth: the show cuts to two or three of them casting (DC4's clown urn on its counter,
  // DC5's tiki urn on the treehouse platform, the confessional where a venue has no booth), each
  // naming their own pick, then back to the ceremony for the reading
  const booth = plateKey(venue, 'voting-booth', 'night') || plateKey(venue, 'confessional', 'day');
  const extraOf = v => plays.filter(p => p.player === v.voter && (p.type === 'extraVote' || p.type === 'voteSteal') && p.target)
    .map(p => ({ voter: p.player, voted: p.target, venue, extra: p.type === 'extraVote' ? 'Extra Vote' : `${p.stolenFrom}'s vote` }));
  const cast = (ep.votingLog || []).filter(v => tribal.includes(v.voter) && v.voted && !v.voteStolen && !v.voteBlocked);
  // Every voter, in their own words (td/story/tribal.js; the user, 2026-10-07: "we need to see all
  // the votes, not just 2 or 3"): the votes for somebody else first, the ones that send the boot
  // home last. An episode written before the story layer keeps the old three-voter cut.
  const story = ep.tribalStory || null;
  if (booth && cast.length >= 2 && story?.booth?.length) {
    const said = new Map(story.booth.map(b => [b.voter, b.line]));
    const order = [...cast.filter(v => v.voted !== elim), ...cast.filter(v => v.voted === elim)];
    order.forEach((v, i) => {
      steps.push({ k: 'scene', spot: 'voting-booth', tod: 'night', plate: booth, place: PLACE['voting-booth'], time: '8:50 PM', card: i === 0, cut: i > 0, focus: [v.voter], bg: [], places: placeScene(booth, [v.voter]) });
      steps.push({ k: 'say', by: v.voter, text: cleanText(said.get(v.voter) || `${v.voted}.`), focus: [v.voter] });
      steps.push({ k: 'ballot', voter: v.voter, voted: v.voted, venue });
      for (const x of extraOf(v)) { steps.push({ k: 'beat', text: `${v.voter} writes a second name: the ${x.extra}.`, focus: [v.voter] }); steps.push({ k: 'ballot', ...x }); }
    });
    steps.push({ k: 'scene', spot: 'ceremony', tod: 'night', plate, place: V.ceremony, time: '9:00 PM', card: false, cut: true, focus: [], bg: [], places, seated: tribal, host, ceremony: true });
  } else if (booth && cast.length >= 2) {
    const shown = [];
    const forElim = cast.filter(v => v.voted === elim), other = cast.filter(v => v.voted !== elim);
    for (const pool of [forElim, other, forElim]) {
      const left = pool.filter(v => !shown.some(s => s.voter === v.voter));
      if (left.length && shown.length < 3) shown.push(left[Math.floor(rng() * left.length)]);
    }
    const LINES = [t => `${t}. Nothing personal.`, t => `I'm writing down ${t}.`, t => `${t}. It's just the game.`, t => `It has to be ${t}.`, t => `${t}. I've made up my mind.`];
    shown.forEach((v, i) => {
      steps.push({ k: 'scene', spot: 'voting-booth', tod: 'night', plate: booth, place: PLACE['voting-booth'], time: '8:50 PM', card: i === 0, cut: i > 0, focus: [v.voter], bg: [], places: placeScene(booth, [v.voter]) });
      steps.push({ k: 'say', by: v.voter, text: LINES[Math.floor(rng() * LINES.length)](v.voted), focus: [v.voter] });
      steps.push({ k: 'ballot', voter: v.voter, voted: v.voted, venue });
      for (const x of extraOf(v)) { steps.push({ k: 'beat', text: `${v.voter} writes a second name: the ${x.extra}.`, focus: [v.voter] }); steps.push({ k: 'ballot', ...x }); }
    });
    steps.push({ k: 'scene', spot: 'ceremony', tod: 'night', plate, place: V.ceremony, time: '9:00 PM', card: false, cut: true, focus: [], bg: [], places, seated: tribal, host, ceremony: true });
  }
  steps.push({ k: 'ballots', who: voters, text: `${voters.length} votes are in.` });
  // a vote cast before anybody wrote a name: the challenge's penalty, or a Black Vote left by an earlier boot
  for (const v of precast) say(v.isBlackVote ? `Before we read: ${v.voter} left us a parting gift on the way out. A Black Vote, against ${v.voted}.` : `Before we read: there's already one vote against ${v.voted}. The penalty from today's challenge.`,
    { focus: [v.voted].filter(n => tribal.includes(n)), side: [{ tab: 'room', text: v.isBlackVote ? `${v.voter}'s Black Vote: ${v.voted}.` : `Penalty vote: ${v.voted}.` }] });
  // Chris asks, every time; then whoever stands up
  say(`If anybody has a Hidden Immunity Idol and you want to play it, now would be the time to do so.`);
  const idolPlays = plays.filter(p => !PRE.has(p.type));
  if (!idolPlays.length) steps.push({ k: 'beat', text: Object.values(steps[0].glow || {}).includes('idol') ? `Nobody moves. Whoever has one is keeping it.` : `Nobody moves.`, focus: [], tense: true });
  for (const p of idolPlays) {
    const t = IDOL_SAY(p);
    if (t) { steps.push({ k: 'beat', text: t, focus: [p.player].filter(n => tribal.includes(n)) }); reacted(p); continue; }
    const forWho = p.playedFor || p.player;
    steps.push({ k: 'idol', by: p.player, for: forWho, misplay: !!p.misplay, super: !!p.superIdol, focus: [p.player, forWho].filter((n, i, a) => tribal.includes(n) && a.indexOf(n) === i) });
    say(`This is a Hidden Immunity Idol. Any votes cast for ${forWho} will not count.`, { focus: [forWho] });
    reacted(p);
  }
  if (ep.shotInDark?.player) {
    const s = ep.shotInDark;
    steps.push({ k: 'beat', text: `${s.player} plays a Shot in the Dark.`, focus: [s.player] });
    say(s.safe ? `${s.player}: you're safe.` : `${s.player}: not safe.`, { focus: [s.player] });
  }
  // the counted votes, for the reading and the Intel tally afterwards
  const protectedSet = new Set((ep.idolPlays || []).filter(p => !p.type && !p.misplay).map(p => p.playedFor || p.player));
  if (ep.shotInDark?.safe) protectedSet.add(ep.shotInDark.player);
  const ballots = [...(ep.votingLog || []).filter(v => tribal.includes(v.voter) && v.voted && !v.voteStolen && !v.voteBlocked), ...precast.map(v => ({ ...v, voter: v.isBlackVote ? `${v.voter} (Black Vote)` : 'Penalty' })),
    ...plays.filter(p => (p.type === 'extraVote' || p.type === 'voteSteal') && p.target && tribal.includes(p.player))
      .map(p => ({ voter: p.player, voted: p.target, reason: p.type === 'extraVote' ? `[EXTRA VOTE] ${p.player}'s second vote${p.forAlly ? `, cast for ${p.forAlly}` : ''}.` : `[STOLEN VOTE] taken from ${p.stolenFrom}.`, extra: true }))];
  const counts = {};
  ballots.forEach(v => { if (!protectedSet.has(v.voted)) counts[v.voted] = (counts[v.voted] || 0) + 1; });
  const tie = !!ep.isTie;
  const revote = (ep.revoteLog || []).filter(v => v.voted);
  // the result, as the setting gives it
  if (V.style === 'handout') handout(steps, say, V, { tribal, elim, counts, immune: [].concat(ep.immunityWinner || []).filter(n => tribal.includes(n)), tie, revote, rocks: !!ep.isRockDraw, host, alsoOut: ep._alsoOut || null });
  else {
    // who has gone before this one: the boot is the nth voted out of the game
    const gone = (window.gs?.episodeHistory || []).filter(e => e.num < ep.num && e.eliminated).length;
    const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth'];
    readVotes(steps, say, { ...V, _host: host, _nth: ORD[gone] || null, _of: 'of the game' }, { tribal, elim, ballots, protectedSet, tie, revote, rocks: !!ep.isRockDraw });
  }
  // the reading lands: how the one going home takes it, and who answers (td/story/tribal.js)
  const lineStep = l => (l.kind === 'beat' ? { k: 'beat', text: cleanText(l.text), focus: [] }
    : l.kind === 'conf' ? { k: 'conf', by: l.by, text: cleanText(l.text) }
      : { k: 'say', by: l.by, text: cleanText(l.text), focus: [l.by], loud: loud(l.text), shock: shock(l.text) });
  // (played before the 'out' step: the boot is still in their seat when the last vote is read)
  const outAt = steps.map(x => x.k).lastIndexOf('out');
  const moment = [];
  // a blindside lands as one: the show's shock card before the boot finds words
  if (story?.shocking && story.reveal?.length) moment.push({ k: 'title', kicker: 'Blindside', name: elim, faces: [elim], shock: true });
  for (const l of story?.reveal || []) moment.push(lineStep(l));
  // ...and the room: a plan that did not happen lands on everybody it touched (td/story/tribal.js room)
  for (const l of story?.room || []) moment.push(lineStep(l));
  // ...and the classic screen's Tribal Blowup or Crashout: the boot goes out swinging, and what
  // they say changes the game (episode.js checkTribalBlowup; vp-screens.js buildCrashout)
  const swing = ep.tribalBlowup?.player === elim ? { ...ep.tribalBlowup, kind: 'Tribal Blowup' }
    : story?.crashout?.player === elim || (story?.crashout && !story.crashout.player) ? { ...story.crashout, player: elim, kind: 'Crashout' } : null;
  if (swing?.reveals?.length) {
    moment.push({ k: 'title', kicker: swing.kind, name: swing.trigger === 'temperament' ? `${elim} can't hold it in` : `${elim} goes out swinging`, faces: [elim], shock: true });
    for (const r of swing.reveals) {
      moment.push({ k: 'say', by: elim, text: cleanText(r.text), focus: [elim], loud: true,
        side: r.consequence ? [{ tab: 'room', text: cleanText(r.consequence) }] : [] });
    }
  }
  if (moment.length) steps.splice(outAt >= 0 ? outAt : steps.length, 0, ...moment);
  // what the viewer may now see: the tally and each ballot's reason
  // what the viewer may see, and when (the user, 2026-10-08): every ballot's reason as soon as the votes
  // are in, before the read; the tally live, a vote at a time as the host reads them
  const outStep = steps.findIndex(s => s.k === 'out');
  const atBallots = steps.findIndex(s => s.k === 'ballots');
  // Why reads the classic Votes screen: the reason, the alliance the vote went with (and who in it voted
  // the same way), a broken plan or a vote against an alliance-mate called a betrayal, the engine's tags
  const blocs = (ep.alliances || []).filter(a => a.type !== 'solo' && (a.members || []).length >= 2);
  const namedAll = (typeof window !== 'undefined' && window.gs?.namedAlliances) || [];
  const why = ballots.map(v => {
    const raw = String(v.reason || '');
    const tags = [...new Set([...raw.matchAll(/\[([A-Z][A-Z \-]+)\]/g)].map(m => m[1].trim().toLowerCase()))];
    const bloc = blocs.find(a => a.members.includes(v.voter));
    const withThem = bloc ? ballots.filter(x => x.voter !== v.voter && bloc.members.includes(x.voter) && x.voted === v.voted).map(x => x.voter) : [];
    const def = (ep.defections || []).find(d => d.player === v.voter);
    const mate = namedAll.find(a => a.active !== false && (a.members || []).includes(v.voter) && (a.members || []).includes(v.voted));
    const betray = def ? `Broke from ${def.alliance || 'the alliance'}: the plan was ${def.consensusWas}.`
      : bloc && bloc.target && bloc.target !== v.voted ? `Went against ${bloc.label || 'the alliance'}'s plan to vote ${bloc.target}.`
      : mate ? `Voted against ${mate.name}, an alliance-mate.`
      : v.planBreak?.label ? `${v.planBreak.label}${v.planBreak.explanation ? `: ${v.planBreak.explanation}` : ''}` : null;
    return { tab: 'why', voter: v.voter, target: v.voted, text: cleanText(raw.replace(/\s*—\s*\[[^\]]+\].*$/, '')).replace(/\[[A-Z \-]+\]\s*/g, ''),
      bloc: bloc ? (bloc.label || 'Alliance') : null, with: withThem, betray, tags: tags.filter(t => !/betray/.test(t)) };
  });
  // the plans, as the alliances made them before anyone voted (the classic Voting Plans screen)
  const plans = blocs.map(a => ({ tab: 'plans', name: a.label || 'Alliance', who: a.members, target: a.target }));
  if (plans.length) steps[0].side = [...(steps[0].side || []), ...plans];
  const left = ballots.map(v => ({ tab: 'tally', voter: v.voter, target: v.voted, void: protectedSet.has(v.voted) }));
  // in the booth (the user, 2026-10-08: "as the votes are written"): each ballot, as it is written,
  // puts its vote on the tally and its reason under Why
  for (const s of steps) {
    if (s.k !== 'ballot') continue;
    const i = left.findIndex(x => x.voter === s.voter), j = why.findIndex(x => x.voter === s.voter);
    s.side = [...(s.side || []), ...(i >= 0 ? left.splice(i, 1) : []), ...(j >= 0 ? why.splice(j, 1) : [])];
  }
  const whyStep = steps[atBallots >= 0 ? atBallots : outStep] || steps[steps.length - 1];
  whyStep.side = [...(whyStep.side || []), ...why];
  for (const s of steps) {
    if (s.k !== 'read' || s.revote) continue;
    const i = left.findIndex(x => x.target === s.vote);
    if (i >= 0) s.side = [...(s.side || []), left.splice(i, 1)[0]];
  }
  if (left.length) { const t = steps[outStep] || steps[steps.length - 1]; t.side = [...(t.side || []), ...left]; }
  // voted out onto an island: nobody leaves the game tonight, the host says where they go next
  if (ep.riChoice) {
    steps.forEach(x => { if (x.k === 'out') x.island = true; });
    say(ep.riChoice === 'RESCUE ISLAND' ? `${elim}, you're not going home. You're going to Rescue Island.` : `${elim}, grab your torch. You have one more choice to make.`, { focus: [elim] });
    return { id: 'tribal', kind: 'tribal', venue, ep: ep.num, label: V.ceremony.replace(/^The /, ''), team, host, steps, elim };
  }
  // the walk out
  // the host walks them out (the Dock of Shame, the red carpet, the hatch): both on screen
  const exitPlate = plateKey(venue, 'exit', 'night');
  const exitPlaces = { [elim]: { u: .6, v: .74, s: .24 } };
  const hs = ((TD_MARKS[exitPlate] || {}).m || []).filter(m => m.kind === 'stand' && m.u < .36 && m.u > .12 && m.v > .45 && m.v < .78).sort((a, b) => b.s - a.s)[0];
  exitPlaces[host] = hs ? { u: hs.u, v: hs.v, s: Math.min(hs.s, .24), host: true } : { u: .26, v: .72, s: .22, host: true };
  // last words: their person walks them down, or they turn round for one more shot (tribal.js)
  const exitWith = story?.exit?.length && story.exitWith && story.exitKind !== 'alone' ? story.exitWith : null;
  if (exitWith) exitPlaces[exitWith] = { u: .78, v: .74, s: .22 };
  // the Jumbo Jet's hatch (Tdwtelimination): close on the three of them, the open door on the left
  const hatch = venue === 'world-tour' && plateKey(venue, 'drop', 'night');
  if (hatch) {
    exitPlaces[elim] = { u: .36, v: .97, s: .35, h: 42, close: true };
    exitPlaces[host] = { u: .84, v: .97, s: .35, h: 42, host: true, close: true };
    if (exitWith) exitPlaces[exitWith] = { u: .6, v: .97, s: .33, h: 40, close: true };
  }
  steps.push({ k: 'scene', spot: 'exit', tod: 'night', plate: exitPlate, place: V.exitPlace, time: '9:10 PM', card: true, focus: [elim, exitWith].filter(Boolean), bg: [], places: exitPlaces, exit: elim, exitWith });
  // the film lot: the Lame-o-sine pulls up at the end of the red carpet (the user's frames), then the
  // same frame with the car painted in for the goodbyes
  const limo = venue === 'film-lot' && plateKey(venue, 'limo-in', 'night');
  const clown = venue === 'carnival' && plateKey(venue, 'boat-deck', 'night');
  if (limo) {
    // either side of the carpet, so the car pulling up between them stays in view
    exitPlaces[host] = { u: .14, v: .74, s: .18, host: true };
    exitPlaces[elim] = { u: .8, v: .74, s: .19 };
    if (exitWith) exitPlaces[exitWith] = { u: .91, v: .73, s: .18 };
    steps.push({ k: 'beat', text: `The Lame-o-sine pulls up at the end of the red carpet, coughing exhaust.`, act: { kind: 'park', ride: 'limo' } });
    steps.push({ k: 'scene', spot: 'limo-park', tod: 'night', plate: plateKey(venue, 'limo-park', 'night'), place: V.exitPlace, time: '9:10 PM', focus: [elim, exitWith].filter(Boolean), bg: [], places: exitPlaces, exit: elim, exitWith });
  }
  // whoever walks them out is introduced, not just standing there (the user: "why is Nick there")
  if (exitWith) steps.push({ k: 'beat', text: `${exitWith} walks ${elim} down to say goodbye.`, focus: [exitWith, elim] });
  say(V.exitLine(elim));
  // where the goodbye ends in a close-up (inside the car, on the boat's deck), their own last line waits for it
  const exitLines = [...(story?.exit || [])];
  const side = venue === 'hosted-camp' ? plateKey(venue, 'boat-side', 'night') : null;
  const lastWords = (limo || clown || side) && exitLines.length && exitLines[exitLines.length - 1].by === elim ? exitLines.pop() : null;
  for (const l of exitLines) steps.push(lineStep(l));
  if (hatch) {
    // World Tour: no boat, no carpet. They run at the open hatch and jump (the Drop of Shame)
    steps.push({ k: 'beat', text: `${elim} takes a run at the open hatch and jumps. Out of the plane, out of the game.`, act: { kind: 'jump', who: [elim], tu: .22 }, focus: [elim] });
    steps.push({ k: 'scene', spot: 'drop', tod: 'night', plate: hatch, place: V.exitPlace, time: '9:12 PM', focus: [elim], bg: [], wide: true, places: { [elim]: { u: .5, v: .5, s: .2, h: 24 } } });
    steps.push({ k: 'beat', text: `The parachute opens. ${elim} drifts down toward the ground below.`, act: { kind: 'chute', who: [elim] }, focus: [elim] });
  } else if (side) {
    // Wawanakwa: alongside the Boat of Losers for the last step aboard, the horn, the motor
    steps.push({ k: 'scene', spot: 'boat-side', tod: 'night', plate: side, place: 'The Boat of Losers', time: '9:12 PM', focus: [elim], bg: [], wide: true, places: { [elim]: { u: .36, v: .99, s: .5, h: 64, close: true } } });
    if (lastWords) steps.push(lineStep(lastWords));
    steps.push({ k: 'beat', text: `${elim} steps aboard the Boat of Losers and leaves the game.`, act: { kind: 'board', who: [elim] }, focus: [elim] });
  } else if (limo) {
    // from behind the car, the walk to its door; inside, the last words; then it drives off in a cloud of smoke
    steps.push({ k: 'scene', spot: 'limo-back', tod: 'night', plate: plateKey(venue, 'limo-back', 'night'), place: 'The Lame-o-sine', time: '9:12 PM', focus: [elim], bg: [], wide: true, places: { [elim]: { u: .84, v: .99, s: .5, h: 58, close: true } } });
    steps.push({ k: 'beat', text: `${elim} walks the last of the red carpet to the car.`, act: { kind: 'approach', who: [elim], tu: .6, tv: .7, th: 15 }, focus: [elim] });
    steps.push({ k: 'scene', spot: 'limo-in', tod: 'night', plate: limo, place: 'The Lame-o-sine', time: '9:13 PM', focus: [elim], bg: [], wide: true, places: { [elim]: { u: .78, v: .75, s: .34, h: 30, sit: true } } });
    steps.push(lastWords ? lineStep(lastWords) : { k: 'beat', text: `${elim} sinks into the torn back seat.`, focus: [elim] });
    steps.push({ k: 'scene', spot: 'exit', tod: 'night', plate: exitPlate, place: V.exitPlace, time: '9:14 PM', focus: [], bg: [], wide: true, places: { [host]: exitPlaces[host] }, parked: 'limo' });
    steps.push({ k: 'beat', text: `The Lame-o-sine pulls away in a cloud of smoke. ${elim} leaves the game.`, act: { kind: 'depart', ride: 'limo' } });
  } else if (clown) {
    // Stawaki: the clown boat pulls up to the end of the pier, a jump down into it, the last words on its deck, and away
    const pier = plateKey(venue, 'pier', 'night');
    steps.push({ k: 'scene', spot: 'pier', tod: 'night', plate: pier, place: 'The Pier', time: '9:12 PM', focus: [elim], bg: [], wide: true, places: { [elim]: { u: .12, v: .745, s: .2, h: 22 } } });
    steps.push({ k: 'beat', text: `A boat strung with lights chugs out of the dark and pulls up to the end of the pier.`, act: { kind: 'park', ride: 'clownboat' } });
    steps.push({ k: 'beat', text: `${elim} jumps down into the boat.`, act: { kind: 'hop', who: [elim], tu: .45, tv: .7 }, focus: [elim], parked: 'clownboat' });
    steps.push({ k: 'scene', spot: 'boat-deck', tod: 'night', plate: clown, place: 'The Boat', time: '9:13 PM', focus: [elim], bg: [], wide: true, places: { [elim]: { u: .5, v: .99, s: .5, h: 66, close: true } } });
    steps.push(lastWords ? lineStep(lastWords) : { k: 'beat', text: `${elim} looks back at the carnival lights.`, focus: [elim] });
    steps.push({ k: 'scene', spot: 'pier', tod: 'night', plate: pier, place: 'The Pier', time: '9:14 PM', focus: [], bg: [], wide: true, places: {}, parked: 'clownboat' });
    steps.push({ k: 'beat', text: `The boat pulls away from Stawaki. ${elim} leaves the game.`, act: { kind: 'depart', ride: 'clownboat' } });
  } else steps.push({ k: 'beat', text: `${elim} leaves the game.`, walk: elim });
  // after: the people who did it, or the one who lost their person, to the camera
  const confPlate = plateKey(venue, 'confessional', 'night') || plateKey(venue, 'confessional', 'day');
  const afterLines = (story?.after || []).filter(l => l.kind === 'conf' && l.by);
  if (afterLines.length && confPlate) {
    steps.push({ k: 'scene', spot: 'confessional', tod: 'night', plate: confPlate, place: PLACE.confessional || 'Confessional', time: 'Later', card: true, focus: [afterLines[0].by], bg: [], places: placeScene(confPlate, [afterLines[0].by]) });
    afterLines.forEach(l => steps.push(lineStep(l)));
  }
  // at Wawanakwa the Boat of Losers runs to Playa Des Losers, the resort the voted-out wait at (Total Drama Island)
  const playa = venue === 'hosted-camp' ? plateKey('islands', 'playa-des-losers', 'day') : null;
  if (playa) {
    steps.push({ k: 'scene', spot: 'playa-des-losers', tod: 'day', plate: playa, place: 'Playa Des Losers', time: 'The next morning', card: true, focus: [elim], bg: [], places: placeScene(playa, [elim], []) });
    steps.push({ k: 'beat', text: `The Boat of Losers drops ${elim} at Playa Des Losers.`, focus: [elim] });
  }
  // Disventure Camp's voted-out check in at the Motel
  const motel = (venue === 'carnival' || venue === 'survival-island') ? plateKey('islands', 'motel', 'night') : null;
  if (motel) {
    steps.push({ k: 'scene', spot: 'motel', tod: 'night', plate: motel, place: 'The Motel', time: 'Later that night', card: true, focus: [elim], bg: [], places: placeScene(motel, [elim], []) });
    steps.push({ k: 'beat', text: `${elim} checks in at the Motel.`, focus: [elim] });
  }
  return { id: 'tribal', kind: 'tribal', venue, ep: ep.num, label: V.ceremony.replace(/^The /, ''), team, host, steps, elim };
}

function handout(steps, say, V, { tribal, elim, counts, immune, tie, revote, rocks, host, alsoOut = null }) {
  const n = tribal.length;
  // a tie: the revote happens before anyone is called
  if (tie) {
    steps.push({ k: 'title', kicker: 'Deadlock', name: 'A tie', faces: Object.entries(counts).sort((a, b) => b[1] - a[1]).filter(([, c], i, a) => c === a[0][1]).map(([nm]) => nm) });
    say(`We have a tie. Everyone else votes again.`);
    if (revote.length) steps.push({ k: 'ballots', who: [...new Set(revote.map(v => v.voter))], text: 'The revote is in.' });
    if (rocks) { steps.push({ k: 'title', kicker: 'Still deadlocked', name: 'Rocks', faces: [] }); say(`Still tied. It comes down to the rocks.`); }
  }
  const left = n - (alsoOut ? 2 : 1);
  say(`There are ${n} of you and only ${left} ${left === 1 ? V.item : V.items} on this plate. When I call your name, come and get one.`);
  // safe order: immunity first, then the fewest votes; the last two are the boot and the closest call
  const others = tribal.filter(x => x !== elim && x !== alsoOut && !immune.includes(x));
  const order = others.sort((a, b) => (counts[a] || 0) - (counts[b] || 0) || a.localeCompare(b));
  // a double elimination announced in advance: the last two both go, nobody gets the final one
  const runnerUp = alsoOut ? null : order.length ? order[order.length - 1] : null;
  for (const im of immune) if (im !== elim) { steps.push({ k: 'safe', who: im, item: V.item, immune: true }); }
  const early = alsoOut ? order : order.slice(0, Math.max(0, order.length - 1));
  for (const w of early) steps.push({ k: 'safe', who: w, item: V.item });
  if (runnerUp) {
    say(`${elim}. ${runnerUp}.`, { tense: true, focus: [elim, runnerUp] });
    say(`This is the final ${V.item} of the evening.`, { tense: true, focus: [elim, runnerUp] });
    steps.push({ k: 'beat', text: `${elim} and ${runnerUp} wait.`, tense: true, focus: [elim, runnerUp] });
    steps.push({ k: 'safe', who: runnerUp, item: V.item, last: true });
  }
  if (alsoOut) {
    say(`${elim}. ${alsoOut}.`, { tense: true, focus: [elim, alsoOut] });
    say(`The plate is empty. No more ${V.items} tonight.`, { tense: true, focus: [elim, alsoOut] });
  }
  steps.push({ k: 'out', who: elim, focus: [elim] });
}

function readVotes(steps, say, V, { tribal, elim, ballots, protectedSet, tie, revote, rocks }) {
  say(`I'll read the votes.`);
  // the deciding vote last: everyone else's first, the boot's held back until the end
  const live = ballots.filter(v => !protectedSet.has(v.voted));
  const dead = ballots.filter(v => protectedSet.has(v.voted));
  const forElim = live.filter(v => v.voted === elim);
  const rest = live.filter(v => v.voted !== elim);
  const order = [];
  dead.forEach(v => order.push({ v, dead: true }));
  // interleave so the count stays close as long as it can
  const a = [...forElim], b = [...rest];
  while (a.length > 1 || b.length) {
    if (b.length) order.push({ v: b.shift() });
    if (a.length > 1) order.push({ v: a.shift() });
  }
  if (a.length) order.push({ v: a.shift(), deciding: !tie });
  const tally = {};
  // the read is the show's suspense: Chris holds the paper, keeps the count, and the closer it gets the
  // longer he takes (the user, 2026-10-08: "Chris just reads the paper, no suspense")
  const word = n => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] || String(n);
  const lead = (t) => { const e = Object.entries(t).sort((a, b) => b[1] - a[1]); return e; };
  const OPEN = [`First vote...`, `Here we go. First vote...`];
  const HOLD = [`Next vote...`, `Okay. Next vote...`];
  order.forEach(({ v, dead: d, deciding }, i) => {
    const before = lead(tally);
    const close = before.length >= 2 && before[0][1] - before[1][1] <= 1 && before[0][1] >= 1;
    // a pause before a vote that could swing it, longer before the one that ends it
    if (deciding || (close && i >= 2)) {
      steps.push({ k: 'say', by: V._host, host: true, text: HOLD[i % HOLD.length], focus: before.slice(0, 2).map(x => x[0]), tense: true, hold: true });
      if (deciding) steps.push({ k: 'beat', text: `${V._host} unfolds the paper and takes a long look at it before turning it around.`, focus: before.slice(0, 2).map(x => x[0]), tense: true });
    } else if (i === 0) steps.push({ k: 'say', by: V._host, host: true, text: OPEN[(ballots.length + i) % OPEN.length] });
    if (!d) tally[v.voted] = (tally[v.voted] || 0) + 1;
    const after = lead(tally);
    let line;
    if (d) line = `${v.voted}. Does not count.`;
    else if (deciding) line = `The ${V._nth || 'next'} person voted out ${V._of}... ${v.voted}.`;
    else if (after.length >= 2 && i >= 1) line = `${v.voted}. That's ${word(after[0][1])} vote${after[0][1] === 1 ? '' : 's'} ${after[0][0]}, ${word(after[1][1])} vote${after[1][1] === 1 ? '' : 's'} ${after[1][0]}.`;
    else if (after.length === 1 && tally[v.voted] > 1) line = `${v.voted}. That's ${word(tally[v.voted])} votes ${v.voted}.`;
    else line = `${v.voted}.`;
    steps.push({ k: 'read', vote: v.voted, dead: !!d, deciding: !!deciding, tally: { ...tally }, focus: [v.voted], line, tense: !!deciding || close });
    if (d) steps.push({ k: 'beat', text: `A vote for ${v.voted}, and it doesn't count. ${v.voted} lets out a breath.`, focus: [v.voted] });
  });
  if (tie) {
    steps.push({ k: 'title', kicker: 'Deadlock', name: 'A tie', faces: Object.entries(tally).filter(([, c]) => c === Math.max(...Object.values(tally))).map(([n]) => n) });
    say(`We have a tie. We vote again.`);
    const rt = {};
    revote.forEach((v, i) => { rt[v.voted] = (rt[v.voted] || 0) + 1; steps.push({ k: 'read', vote: v.voted, revote: true, deciding: i === revote.length - 1 && !rocks, tally: { ...rt }, focus: [v.voted] }); });
    if (rocks) { steps.push({ k: 'title', kicker: 'Still deadlocked', name: 'Rocks', faces: [] }); say(`Still tied. It comes down to the rocks.`); }
  }
  steps.push({ k: 'out', who: elim, focus: [elim] });
}

// ══════════════════════════════════════════════════════════════════════
// THE TRANSCRIPT — what the screen says that the engine did not (spec §8: transcript = screen)
// ══════════════════════════════════════════════════════════════════════
export function tdStepTranscript(screen) {
  if (!screen) return [];
  const out = [];
  for (const s of screen.steps) {
    if (s.k === 'scene') out.push(`— ${s.place}${s.time ? ', ' + s.time : ''} —`);
    else if (s.k === 'say') out.push(`${s.by}: "${s.text}"`);
    else if (s.k === 'conf') out.push(`${s.by} (confessional): "${s.text}"`);
    else if (s.k === 'beat') out.push(`(${s.text})`);
    else if (s.k === 'title') out.push(`[${s.kicker}: ${s.name}]`);
    else if (s.k === 'ballot') out.push(`[${s.voter} votes: ${s.voted}]`);
    else if (s.k === 'ballots') out.push(`(${s.text})`);
    else if (s.k === 'power') out.push(`(${s.by} plays ${s.the || s.name}${s.on ? ` on ${s.on}` : ''}.)`);
    else if (s.k === 'idol') out.push(`(${s.by} plays a Hidden Immunity Idol${s.for !== s.by ? ` for ${s.for}` : ''}.)`);
    else if (s.k === 'safe') out.push(`${screen.host || 'Chris'}: "${s.who}${s.immune ? ', you have immunity' : ''}." (${s.who} is safe${s.last ? ': the last ' + s.item : ''}.)`);
    else if (s.k === 'read') out.push(`${screen.host || 'Chris'}: "${s.line || `${s.vote}${s.dead ? '. Does not count' : ''}.`}"`);
    else if (s.k === 'out') out.push(`(${s.who} is ${s.island ? 'voted out' : 'eliminated'}.)`);
    else if (s.k === 'found') out.push(s.text ? `[${s.label}] ${s.text}` : `[Found: ${s.label} — ${s.who}]`);
  }
  return out;
}

/**
 * A double elimination (ep.firstEliminated): two votes in one ceremony. The engine keeps the first
 * vote on votingLog/votes/idolPlays1 and the second on votingLog2/votes2/idolPlays, so each plays
 * as the ordinary stepped Tribal, the first boot walked out, then the second vote among who is left.
 */
export function tdDoubleTribalScreen(ep, o = {}) {
  if (ep?.swapResult?.swapper && !ep.eliminated) return elimSwap(ep, o);
  if (ep?.exileDuelVotedOut && ep.exileDuelResult) return duelNight(ep, o);
  if (ep?.exilePlayer && !ep.eliminated && (ep.tribalPlayers || []).includes(ep.exilePlayer)) return exileSetup(ep, o);
  if (ep?.firstEliminated && ep.announcedDoubleElim && !(ep.votingLog2 || []).length) return announcedDouble(ep, o);
  if (!ep?.firstEliminated || !(ep.votingLog2 || []).length) return null;
  const first = ep.firstEliminated;
  const key = p => `${p.player}:${p.type || 'idol'}:${p.stolenFrom || ''}`;
  const once = new Set((ep.idolPlays1 || []).map(key));
  const v1 = { ...ep, eliminated: first, firstEliminated: null, idolPlays: ep.idolPlays1 || [], tribalStory: null, riChoice: ep.firstRIChoice || null,
    isTie: false, revoteLog: [], shotInDark: ep.shotInDark1 || null, tiebreakerResult: ep.tiebreakerResult1 || null };
  const v2 = { ...ep, firstEliminated: null, votingLog: ep.votingLog2, votes: ep.votes2, idolPlays: (ep.idolPlays || []).filter(p => !once.has(key(p))),
    tribalPlayers: (ep.tribalPlayers || []).filter(n => n !== first), alliances: ep.alliances2 || [], defections: [] };
  if (!tdTribalStepped(v1) || !tdTribalStepped(v2)) return null;
  const a = tdTribalScreen(v1, o), b = tdTribalScreen(v2, { ...o, qa: [] });
  if (!a || !b) return null;
  const host = a.host;
  const tag = (steps, round) => steps.forEach(s => { if (s.side) s.side = s.side.map(x => (['tally', 'why', 'plans'].includes(x.tab) ? { ...x, round } : x)); });
  tag(a.steps, 1); tag(b.steps, 2);
  // back at the ceremony for the second vote: no second welcome, the host springs it (or says it, if it was announced)
  b.steps[0] = { ...b.steps[0], card: false, cut: false };
  const left = v2.tribalPlayers.length;
  const turn = ep.announcedDoubleElim
    ? [{ k: 'say', by: host, host: true, text: `As promised, we're not done. ${left} of you left, and one more of you is going home tonight.` }]
    : [{ k: 'say', by: host, host: true, text: `Before anybody gets comfortable... we're not done tonight.` },
      { k: 'title', kicker: 'Surprise', name: 'Double elimination', faces: v2.tribalPlayers.slice(0, 8), tone: 'fire' },
      { k: 'say', by: host, host: true, text: `There's a second vote. Right now. ${left} of you, and one more is going home.` }];
  if (b.steps[1]?.k === 'say' && b.steps[1].host) b.steps.splice(1, 1, ...turn); else b.steps.splice(1, 0, ...turn);
  const { keep, later } = afterlife(a.steps);
  return { ...b, id: 'tribal', label: `${b.label} · Double elimination`, steps: [...keep, ...b.steps, ...later], elim: ep.eliminated, first };
}

// the first boot of a double night arrives at Playa / the Motel after the second, not in the middle of the ceremony
function afterlife(steps) {
  const keep = [], later = [];
  let away = false;
  for (const s of steps) { if (s.k === 'scene') away = ['playa-des-losers', 'motel'].includes(s.spot); (away ? later : keep).push(s); }
  return { keep, later };
}
// announced in advance: one vote, and the two with the most votes both go home
function announcedDouble(ep, o) {
  const first = ep.firstEliminated, second = ep.eliminated;
  const v1 = { ...ep, eliminated: first, firstEliminated: null, tribalStory: null, announcedDoubleElim: false, _alsoOut: second, isTie: false, revoteLog: [] };
  const v2 = { ...ep, firstEliminated: null, announcedDoubleElim: false };
  if (!tdTribalStepped(v1) || !tdTribalStepped(v2)) return null;
  const a = tdTribalScreen(v1, o), c = tdTribalScreen(v2, { ...o, qa: [] });
  if (!a || !c) return null;
  const host = a.host;
  a.steps.splice(2, 0, { k: 'say', by: host, host: true, text: `Remember: tonight is a double elimination. The two of you with the most votes are both going home.` });
  const out2 = c.steps.findIndex(s => s.k === 'out');
  if (out2 < 0) return a;
  const tail = c.steps.slice(out2).map(s => ({ ...s, side: (s.side || []).filter(x => !['tally', 'why', 'plans'].includes(x.tab)) }));
  const back = c.steps.find(s => s.k === 'scene' && s.ceremony);
  const n2 = (ep.votes || {})[second] || 0;
  const named = a.steps.some(s => s.k === 'say' && /plate is empty/.test(s.text || ''));
  const { keep, later } = afterlife(a.steps);
  return { ...a, label: `${a.label} · Double elimination`, elim: second, first, steps: [...keep,
    ...(back ? [{ ...back, card: false, cut: false, time: '9:20 PM' }] : []),
    ...(named ? [{ k: 'say', by: host, host: true, text: `${second}. You're going home tonight too.`, focus: [second] }]
      : [{ k: 'say', by: host, host: true, text: `But we're not done. Two of you are going home tonight.` },
        { k: 'beat', text: `Everyone looks at the ones still holding their breath.`, focus: [], tense: true },
        { k: 'say', by: host, host: true, text: `With ${n2} vote${n2 === 1 ? '' : 's'}, the second person leaving tonight... ${second}.`, focus: [second] }]),
    ...tail, ...later] };
}

// an Elimination Swap: the one voted out is not going home; they join the other tribe, and pick
// somebody from it to send back the other way
function elimSwap(ep, o) {
  const { swapper, fromTribe, toTribe, pickedPlayer } = ep.swapResult;
  const v = { ...ep, eliminated: swapper, tribalStory: null, riChoice: null };
  if (!tdTribalStepped(v)) return null;
  const a = tdTribalScreen(v, o);
  if (!a) return null;
  const out = a.steps.findIndex(s => s.k === 'out');
  if (out < 0) return null;
  const host = a.host;
  const steps = a.steps.slice(0, out + 1);
  steps[out] = { ...steps[out], island: true };
  steps.push({ k: 'say', by: host, host: true, text: `${swapper}, you're not going home. Tonight is an Elimination Swap.`, focus: [swapper] },
    { k: 'title', kicker: 'Elimination Swap', name: `${swapper} joins ${toTribe}`, faces: [swapper, pickedPlayer].filter(Boolean), tone: 'fire' },
    { k: 'say', by: host, host: true, text: `You're joining ${toTribe}. And you get to pick one of them to take your place on ${fromTribe}.`, focus: [swapper] });
  if (pickedPlayer) steps.push({ k: 'beat', text: `${swapper} picks ${pickedPlayer}. ${pickedPlayer} is going to ${fromTribe}.`, focus: [swapper], tense: true,
    side: [{ tab: 'room', text: `${swapper} moves to ${toTribe}; ${pickedPlayer} moves to ${fromTribe}. Nobody goes home.` }] });
  return { ...a, label: `${a.label} · Elimination Swap`, steps, elim: null };
}

// voted out into an Exile Duel: the vote is read, but the one voted out goes to face the exiled player
// (the duel itself plays after the vote, on the post-vote screen)
// a story line as a step (td/story: beats, confessionals, spoken lines)
const storyStep = (l, focus) => (l.kind === 'beat' ? { k: 'beat', text: cleanText(l.text), focus } : l.kind === 'conf' ? { k: 'conf', by: l.by, text: cleanText(l.text) }
  : { k: 'say', by: l.by, text: cleanText(l.text), focus: [l.by] });

function duelNight(ep, o) {
  const boot = ep.exileDuelVotedOut, R = ep.exileDuelResult;
  const v = { ...ep, eliminated: boot, exileDuelVotedOut: null, tribalStory: null, riChoice: null };
  if (!tdTribalStepped(v)) return null;
  const a = tdTribalScreen(v, o);
  if (!a) return null;
  const out = a.steps.findIndex(s => s.k === 'out');
  if (out < 0) return null;
  const host = a.host;
  const steps = a.steps.slice(0, out + 1);
  steps[out] = { ...steps[out], island: true };
  steps.push({ k: 'say', by: host, host: true, text: `${boot}, you're not out of the game yet. ${R.exilePlayer} has been waiting on Exile for a rematch.`, focus: [boot] },
    { k: 'title', kicker: 'Exile Duel', name: `${boot} vs ${R.exilePlayer}`, faces: [boot, R.exilePlayer], vs: true },
    { k: 'say', by: host, host: true, text: `The two of you duel${R.challengeLabel ? ` in ${R.challengeLabel}` : ''}. The winner stays in the game. The loser is gone for good.` });
  // the two of them, before it (td/story/twist.js writeExile)
  for (const l of ep.exileStory?.faceoff || []) steps.push(storyStep(l, [boot, R.exilePlayer]));
  return { ...a, label: `${a.label} · Exile Duel`, steps, elim: null };
}

// the night the Exile Duel begins: the one voted out goes to Exile, to wait for the next boot
function exileSetup(ep, o) {
  const boot = ep.exilePlayer;
  const v = { ...ep, eliminated: boot, exileDuelVotedOut: null, tribalStory: null, riChoice: null };
  if (!tdTribalStepped(v)) return null;
  const a = tdTribalScreen(v, o);
  if (!a) return null;
  const out = a.steps.findIndex(s => s.k === 'out');
  if (out < 0) return null;
  const host = a.host;
  const steps = a.steps.slice(0, out + 1);
  steps[out] = { ...steps[out], island: true };
  steps.push({ k: 'say', by: host, host: true, text: `${boot}, you're not going home. You're going to Exile.`, focus: [boot] },
    { k: 'title', kicker: 'Exile Duel', name: `${boot} goes to Exile`, faces: [boot], tone: 'fire' },
    { k: 'say', by: host, host: true, text: `You'll wait there for the next person voted out. Beat them in a duel and you're back in the game.`, focus: [boot] });
  // what they say to that, and who answers (td/story/twist.js writeExile)
  for (const l of ep.exileStory?.sent || []) steps.push(storyStep(l, [boot]));
  return { ...a, label: `${a.label} · Exile Duel`, steps, elim: null };
}
