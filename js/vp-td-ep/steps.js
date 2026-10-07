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

// ── the venues ────────────────────────────────────────────────────────
// The spots each venue has a plate for, and how its ceremony goes. Each checked against the
// shows' wikis (spec §7; the plates in tools/td-camp/venues).
export const VENUES = {
  'hosted-camp': { public: 'communal-grounds', ceremony: 'The Campfire Ceremony', style: 'handout', item: 'marshmallow', items: 'marshmallows',
    exitPlace: 'The Dock of Shame', exitLine: n => `${n}, the Dock of Shame awaits. The Boat of Losers waits for no one.`,
    open: t => [`Welcome to the campfire ceremony, ${t}.`, `${t}. Back at the campfire again.`, `${t}, welcome back to the campfire.`],
    voted: `You've all cast your votes in the confession cam.`, sit: ['campfire', 'mess-hall'] },
  'survival-island': { public: 'campfire', ceremony: 'The Elimination Trial', style: 'read',
    exitPlace: 'The Cannon of Shame', exitLine: n => `${n}, the Cannon of Shame awaits.`,
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
  'water-source': 'The Water Source', 'jungle-trail': 'The Jungle Trail', 'fishing-area': 'The Fishing Spot', trailers: 'The Trailers',
  'craft-services': 'Craft Services', 'studio-backlot': 'The Backlot', 'soundstage-corridor': 'The Soundstage', 'prop-storage': 'Prop Storage',
  economy: 'Economy Class', aisle: 'The Aisle', galley: 'The Galley', 'cargo-hold': 'The Cargo Hold', 'first-class': 'First Class',
  'destination-staging': 'The Landing Strip', campsite: 'The Campsite', 'forest-edge': 'The Forest', 'rocky-beach': 'The Rocky Beach',
  'lake-shore': 'The Lake Shore', 'carnival-entrance': 'The Carnival Gate', midway: 'The Midway', 'trial-area': 'The Trial Area',
  'haunted-mansion': 'The Haunted Mansion', 'corn-maze': 'The Corn Maze', 'theater-tent': 'The Theater Tent', 'big-top': 'The Big Top',
  'voting-booth': 'The Voting Booth', ceremony: 'The Ceremony', exit: 'The Exit',
};
// the places a scene can be staged in beyond the engine's spots (camp-access.js): a cabin's inside,
// the beach, the washrooms, the cliff (2026-10-07: "where is the rest… the interior
// of the cabin, the canteen, the lake")
Object.assign(PLACE, { 'cabin-inside': 'Inside the Cabin', washroom: 'The Washrooms', cliff: 'The Cliff' });

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
    'forest-trail': [['beach', 3, /^(romance\.|friend\.(walk|laugh))/], ['cliff', 2, /^(drama\.(meltdown|clash)|plot\.|broker\.)/], ['forest-trail', 3], ['beach', 1], ['cliff', 1]],
    dock: [['dock', 3], ['beach', 2]],
  },
  // the lot's clock: meals at craft services, mornings at the trailers, the afternoon on the backlot
  'film-lot': {
    'studio-backlot': [['craft-services', 4, /^(crowd\.(meal|dinner)|hosted\.slop|life\.(food|meal|hunger)|drama\.mess)/],
      ['craft-services', 3, null, 'morning'], ['trailers', 2, null, 'morning'], ['studio-backlot', 1, null, 'morning'],
      ['studio-backlot', 3, null, 'day'], ['craft-services', 1, null, 'day'],
      ['studio-backlot', 2, null, 'return'], ['craft-services', 2, null, 'return'],
      ['craft-services', 2, null, 'evening'], ['studio-backlot', 2, null, 'evening'], ['trailers', 1, null, 'evening']],
    trailers: [['trailers', 3], ['soundstage-corridor', 1, null, 'evening']],
  },
};
const PLACE_WORDS = { dock: /\b(dock|lake)\b/i, 'forest-trail': /\b(woods|forest|trail)\b/i, cabins: /\b(cabins?|porch)\b/i, campfire: /\bfire\b/i, 'mess-hall': /\b(mess hall|slop|tray|Chef)\b/i, 'communal-grounds': /\b(grounds|yard)\b/i };
export function stageSpot(venue, spot, ev, windowId) {
  const rules = STAGE[venue]?.[spot];
  if (!rules) return spot;
  const text = (ev.lines || []).map(l => l.text).join(' ') || String(ev.text || '');
  if (PLACE_WORDS[spot]?.test(text)) return spot;
  const kind = ev.scene?.kind || ev.type || '';
  const time = windowId === 'morning' ? 'morning' : windowId === 'before-tribal' || windowId === 'scramble' ? 'evening' : windowId === 'return' ? 'return' : 'day';
  const fit = rules.filter(([, , re, when]) => (!re || re.test(kind)) && (!when || when === time));
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
  shoreline: ['fish', 'read'], 'water-source': ['fetch', 'stretch'], 'jungle-trail': ['stretch'], 'fishing-area': ['fish', 'fish'], trailers: ['read', 'nap'],
  'craft-services': ['eat', 'eat'], 'studio-backlot': ['stretch', 'read'], 'soundstage-corridor': ['read'], 'prop-storage': ['read'],
  economy: ['nap', 'read'], aisle: ['read'], galley: ['eat'], 'cargo-hold': ['nap'], 'first-class': ['nap', 'read'], 'destination-staging': ['stretch'],
  campsite: ['whittle', 'read', 'nap'], 'forest-edge': ['stretch'], 'rocky-beach': ['fish', 'read'], 'lake-shore': ['fish', 'read'],
  'carnival-entrance': ['read'], midway: ['eat', 'stretch'],
  'cabin-inside': ['nap', 'read', 'nap'], beach: ['nap', 'stretch', 'fish'], washroom: ['sweep'], cliff: ['stretch'],
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
    // a group: everyone in a row across the floor, staggered in two depths, each on the nearest
    // floor mark's depth so nobody floats
    const n = focus.length, pool = front.length ? front : stands;
    focus.forEach((name, i) => {
      const u = .14 + (.72 * i) / (n - 1);
      const near = pool.length ? pool.reduce((a, b) => (Math.abs(b.u - u) < Math.abs(a.u - u) ? b : a)) : null;
      const v = Math.min(near ? near.v : .68, .72) - (i % 2 ? .05 : 0);   // never down behind the dialogue panel
      out[name] = { u, v, s: (near ? near.s : .2) * (i % 2 ? .9 : 1), sit: false };
    });
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

// ══════════════════════════════════════════════════════════════════════
// CAMP — one screen per camp and phase, cutting spot to spot
// ══════════════════════════════════════════════════════════════════════
export function tdCampScreen(ep, camp, phase, members = [], o = {}) {
  const block = ep?.campEvents?.[camp];
  const events = phase === 'pre' ? (Array.isArray(block) ? block : (block?.pre || [])) : (block?.post || []);
  if (!events.length) return null;
  const venue = venueOf(ep, o);
  const V = VENUES[venue];
  const windows = ep.campAccess?.phases?.[`${phase}:${camp}`] || [];
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
    const tod = clock >= 19 * 60 + 15 ? 'night' : 'day';
    const key = plateKey(venue, spot, tod) ? spot : V.public;
    const plate = plateKey(venue, key, tod);
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
      const who = Object.values(ev.scene?.who || {}).filter(Boolean);
      const focus = [...said, ...who.filter(n => !said.includes(n))].slice(0, Math.max(4, said.length));
      const onlyConf = ev.lines.every(l => l.kind === 'conf' || l.kind === 'beat') && !said.length;
      if (!onlyConf) open(spot === 'confessional' ? V.public : spot, windowId, focus.length ? focus : (ev.players || []).slice(0, 3), { why: badge });
      else if (!cur) open(V.public, windowId, (ev.players || []).slice(0, 3), { why: badge });
      let lastBy = null;
      for (const l of ev.lines) {
        const text = cleanText(l.text);
        if (!text) continue;
        if (l.kind === 'conf') steps.push({ k: 'conf', by: l.by, text });
        else if (l.kind === 'beat') steps.push({ k: 'beat', text, act: actOf(text, cast, lastBy) });
        else { steps.push({ k: 'say', by: l.by, text, loud: loud(text) }); lastBy = l.by; }
      }
      if (ev.type === 'idolFound') foundStep(steps, ev);
      if (ev.type === 'allianceForm' && ev.alliance) {
        steps.push({ k: 'title', kicker: 'Alliance formed', name: cleanText(ev.alliance), faces: (ev.members || ev.players || []).slice(0, 4),
          side: [{ tab: 'allies', name: cleanText(ev.alliance), who: (ev.members || ev.players || []).slice() }] });
      }
      const last = steps[steps.length - 1];
      (last.side ||= []).push({ tab: 'log', text: `${badge ? badge.text + ': ' : ''}${(ev.players || []).join(', ')}` });
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
  if ((ep.votingLog || []).some(v => v.isBlackVote || v.voter === 'THE GAME')) return false;
  return true;
}

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
  say(pick(V.open(callName)));
  // the questions (the same exchanges the classic screen asks: buildTribalQA)
  for (const item of (o.qa || [])) {
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
  // the vote
  const voters = [...new Set((ep.votingLog || []).map(v => v.voter).filter(n => tribal.includes(n)))];
  say(V.voted);
  steps.push({ k: 'ballots', who: voters, text: `${voters.length} votes are in.` });
  // advantages played
  for (const p of ep.idolPlays || []) {
    const t = IDOL_SAY(p);
    if (t) { steps.push({ k: 'beat', text: t, focus: [p.player].filter(n => tribal.includes(n)) }); continue; }
    const forWho = p.playedFor || p.player;
    steps.push({ k: 'idol', by: p.player, for: forWho, misplay: !!p.misplay, super: !!p.superIdol, focus: [p.player, forWho].filter((n, i, a) => tribal.includes(n) && a.indexOf(n) === i) });
    say(`This is a Hidden Immunity Idol. Any votes cast for ${forWho} will not count.`, { focus: [forWho] });
  }
  if (ep.shotInDark?.player) {
    const s = ep.shotInDark;
    steps.push({ k: 'beat', text: `${s.player} plays a Shot in the Dark.`, focus: [s.player] });
    say(s.safe ? `${s.player}: you're safe.` : `${s.player}: not safe.`, { focus: [s.player] });
  }
  // the counted votes, for the reading and the Intel tally afterwards
  const protectedSet = new Set((ep.idolPlays || []).filter(p => !p.type && !p.misplay).map(p => p.playedFor || p.player));
  if (ep.shotInDark?.safe) protectedSet.add(ep.shotInDark.player);
  const ballots = (ep.votingLog || []).filter(v => tribal.includes(v.voter) && v.voted);
  const counts = {};
  ballots.forEach(v => { if (!protectedSet.has(v.voted)) counts[v.voted] = (counts[v.voted] || 0) + 1; });
  const tie = !!ep.isTie;
  const revote = (ep.revoteLog || []).filter(v => v.voted);
  // the result, as the setting gives it
  if (V.style === 'handout') handout(steps, say, V, { tribal, elim, counts, immune: [].concat(ep.immunityWinner || []).filter(n => tribal.includes(n)), tie, revote, rocks: !!ep.isRockDraw, host });
  else readVotes(steps, say, V, { tribal, elim, ballots, protectedSet, tie, revote, rocks: !!ep.isRockDraw });
  // what the viewer may now see: the tally and each ballot's reason
  const outStep = steps.findIndex(s => s.k === 'out');
  const side = [];
  ballots.forEach(v => side.push({ tab: 'tally', voter: v.voter, target: v.voted, void: protectedSet.has(v.voted) }));
  ballots.forEach(v => side.push({ tab: 'why', voter: v.voter, target: v.voted, text: cleanText(v.reason).replace(/\[[A-Z \-]+\]\s*/g, '') }));
  (steps[outStep] || steps[steps.length - 1]).side = [...((steps[outStep] || {}).side || []), ...side];
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
  steps.push({ k: 'scene', spot: 'exit', tod: 'night', plate: exitPlate, place: V.exitPlace, time: '9:10 PM', card: true, focus: [elim], bg: [], places: exitPlaces, exit: elim });
  say(V.exitLine(elim));
  steps.push({ k: 'beat', text: `${elim} leaves the game.`, walk: elim });
  return { id: 'tribal', kind: 'tribal', venue, ep: ep.num, label: V.ceremony.replace(/^The /, ''), team, host, steps, elim };
}

function handout(steps, say, V, { tribal, elim, counts, immune, tie, revote, rocks, host }) {
  const n = tribal.length;
  // a tie: the revote happens before anyone is called
  if (tie) {
    steps.push({ k: 'title', kicker: 'Deadlock', name: 'A tie', faces: Object.entries(counts).sort((a, b) => b[1] - a[1]).filter(([, c], i, a) => c === a[0][1]).map(([nm]) => nm) });
    say(`We have a tie. Everyone else votes again.`);
    if (revote.length) steps.push({ k: 'ballots', who: [...new Set(revote.map(v => v.voter))], text: 'The revote is in.' });
    if (rocks) { steps.push({ k: 'title', kicker: 'Still deadlocked', name: 'Rocks', faces: [] }); say(`Still tied. It comes down to the rocks.`); }
  }
  say(`There are ${n} of you and only ${n - 1} ${n - 1 === 1 ? V.item : V.items} on this plate. When I call your name, come and get one.`);
  // safe order: immunity first, then the fewest votes; the last two are the boot and the closest call
  const others = tribal.filter(x => x !== elim && !immune.includes(x));
  const order = others.sort((a, b) => (counts[a] || 0) - (counts[b] || 0) || a.localeCompare(b));
  const runnerUp = order.length ? order[order.length - 1] : null;
  for (const im of immune) if (im !== elim) { steps.push({ k: 'safe', who: im, item: V.item, immune: true }); }
  const early = order.slice(0, Math.max(0, order.length - 1));
  for (const w of early) steps.push({ k: 'safe', who: w, item: V.item });
  if (runnerUp) {
    say(`${elim}. ${runnerUp}.`, { tense: true, focus: [elim, runnerUp] });
    say(`This is the final ${V.item} of the evening.`, { tense: true, focus: [elim, runnerUp] });
    steps.push({ k: 'beat', text: `${elim} and ${runnerUp} wait.`, tense: true, focus: [elim, runnerUp] });
    steps.push({ k: 'safe', who: runnerUp, item: V.item, last: true });
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
  for (const { v, dead: d, deciding } of order) {
    if (!d) tally[v.voted] = (tally[v.voted] || 0) + 1;
    steps.push({ k: 'read', vote: v.voted, dead: !!d, deciding: !!deciding, tally: { ...tally }, focus: [v.voted] });
  }
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
    else if (s.k === 'ballots') out.push(`(${s.text})`);
    else if (s.k === 'idol') out.push(`(${s.by} plays a Hidden Immunity Idol${s.for !== s.by ? ` for ${s.for}` : ''}.)`);
    else if (s.k === 'safe') out.push(`${screen.host || 'Chris'}: "${s.who}${s.immune ? ', you have immunity' : ''}." (${s.who} is safe${s.last ? ': the last ' + s.item : ''}.)`);
    else if (s.k === 'read') out.push(`${screen.host || 'Chris'}: "${s.vote}${s.dead ? '. Does not count' : ''}."`);
    else if (s.k === 'out') out.push(`(${s.who} is ${s.island ? 'voted out' : 'eliminated'}.)`);
    else if (s.k === 'found') out.push(s.text ? `[${s.label}] ${s.text}` : `[Found: ${s.label} — ${s.who}]`);
  }
  return out;
}
