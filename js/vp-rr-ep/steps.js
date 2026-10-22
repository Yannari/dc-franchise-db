// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/steps.js — an aired Ridonculous Race leg as screens of clicks
// ══════════════════════════════════════════════════════════════════════
//
// PURE: the played season and its aired episodes in (js/rr/season.js playRaceSeason,
// js/rr/episode.js airSeason), plain data out, no DOM. The stage, the side panel and the
// tests all read this one list, so they never drift (ADDING-A-SHOW §6.5, §18).
//
// ONE CLICK IS ONE LINE (spec §9.1): every aired line, a beat, a confessional or Don, is
// exactly one step, in the director's order. The viewer adds only what the show adds
// around words: the logo, a title card per place, the Don Box tip being read, Don's pause
// before a placement, and the slams. A time card ("50 MINUTES LATER") rides on the first
// step after a gap instead of costing a click.
//
// A SCREEN is one shot: a plate (js/vp-rr-ep/plates.js), the teams on it, and where each
// one stands after every step. Staging is here, not in the stage, so the rules the user
// set can be tested: nobody talks from off screen, nobody stands in water, every team is
// on screen while it speaks, and the order is never shown before the mat.
//
// WHAT HAS AIRED: every step carries `intel`, the facts it makes public (where a team is,
// its money and leader as recorded in that scene, a placement, an exit, a storyline beat).
// The side panel folds them up to the current step (intelAt), never reading live state.
import { PLACES } from '../rr/places.js';
import { LOCALS, localFor, localUrl, placeLocal, personOf } from './locals.js';
import { aboutOf, cardOf } from './about.js';
import { OPENER_SHOTS } from './opener-shots.js';
import { PLACE_PLATES, RACE, stretchPlates, standable, findPlate, heldProp } from './plates.js';

export const TEAM_COLORS = ['#ff6fae', '#39c0ff', '#ffb020', '#4fd18b', '#b78cff', '#ff7a4a', '#5ee0d6', '#f2e94e', '#ff4f6d', '#8fb4ff', '#c7f464', '#e0a3ff',
  '#7fe3a0', '#ffc1a1'];

// The weather a place drifts across its shots (stage.js ambient), and the plates it never falls on: inside (the user,
// 2026-10-21, on Home City's stairwell and glass elevator: "and why is it snowing inside").
export const AMBIENT = { 'rock-north': 'snow', 'red-sand-desert': 'mote', 'tomb-sands': 'mote', 'red-outback': 'mote', 'fire-mountain-isle': 'ember',
  'great-wall-hills': 'mote', 'savanna-falls': 'mote', 'geyser-island': 'snow', 'treasure-isles': 'spark', 'torch-statue-harbour': 'mote', 'iron-tower-city': 'spark', 'skyline-finale': 'mote', 'home-city': 'mote' };
export const INDOOR = new Set([
  'home-city/task-9434855', 'home-city/task-9434868', 'home-city/task-9434876',
  'rock-north/chill-9441059', 'rock-north/task-9440800', 'rock-north/task-9441040', 'rock-north/task-9441122', 'rock-north/task-9441310',
  'red-sand-desert/travel-9435906',
  'tomb-sands/task-22409901', 'tomb-sands/task-22409920', 'tomb-sands/task-22409944', 'tomb-sands/task-22409957',
  'great-wall-hills/task-plane-door',
  'geyser-island/task-feast-hut', 'geyser-island/task-9437332', 'geyser-island/task-9437548',
  'treasure-isles/task-9449549', 'treasure-isles/task-9449621', 'treasure-isles/task-9449592', 'treasure-isles/task-9449759', 'treasure-isles/task-9449762',
  'torch-statue-harbour/task-22412499',
  'iron-tower-city/task-9436194', 'iron-tower-city/task-catacombs', 'iron-tower-city/travel-9436570', 'iron-tower-city/travel-9436604',
  'skyline-finale/task-9450082', 'skyline-finale/task-9450185',
]);
/** The weather over a shot: its place's, unless the plate is indoors (or the shot is a map, an interview...). */
export function weatherOf(s) {
  if (!s || !['world', 'title'].includes(s.kind)) return null;
  const place = s.plate?.place || s.place;
  const kind = AMBIENT[place];
  if (!kind || (s.plate?.f && INDOOR.has(`${place}/${s.plate.f}`))) return null;
  return kind;
}

const hhmm = m => { const d = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`; };
const TASKS = new Set(['either', 'botch', 'allin', 'route', 'superteam']);
const KIND_NAME = { either: 'Either/Or', botch: 'Botch or Watch', allin: 'All-In', route: 'Route Info', superteam: 'Superteam' };
// scenes shot at the Chill Zone whatever their stretch says
const MAT_KINDS = new Set(['don-place', 'don-elim', 'don-fakeout', 'don-crown', 'mat-montage', 'console', 'goodbye-kiss', 'call-home', 'reward',
  'medevac-choice', 'save-used', 'don-arrives']);
const ACT_KINDS = new Set(['task-try', 'task-done', 'task-montage']);
const RIDE_KINDS = new Set(['ride', 'travel-mishap']);
// romance and crush interviews are said alone (spec §9.4: solo when the subject demands it)
const SOLO_KINDS = /crush|flirt|confession|spark|jealous|romance|kiss/;

const PLACE_RE = /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|last|number (one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve))\b/i;
const ELIM_RE = /eliminat|you're out|you are out|\bout\b|going home/i;
const NONELIM_RE = /non-elimination|still in the race|keep racing|you're safe|you get to stay/i;
const CROWN_RE = /win|won|million|champion/i;

function timeWords(m) {
  if (m < 55) return `${Math.max(5, Math.round(m / 5) * 5)} MINUTES LATER`;
  if (m < 90) return 'AN HOUR LATER';
  const h = Math.round(m / 60);
  return `${h} HOURS LATER`;
}

// ── who is who ─────────────────────────────────────────────────────────
export function castIndex(state) {
  const teamOf = {}, color = {};
  state.order.forEach((id, i) => {
    const t = state.teams[id];
    teamOf[t.a] = id; teamOf[t.b] = id;
    color[id] = TEAM_COLORS[i % TEAM_COLORS.length];
  });
  return { teamOf, color };
}

// ── the plate for a moment ─────────────────────────────────────────────
function pick(list, n) { return list?.length ? list[n % list.length] : null; }

function matPlate(placeId, n = 0, mid = false) {
  const s = stretchPlates(placeId, mid ? 'midmat' : 'mat');
  return pick(s?.talk, n) || PLACE_PLATES[placeId]?.opener;
}

// Where a scene at the airport is: the gate before the flight, the cabin in the air, the
// arrival after it lands (from the leg's own flight scenes).
function airportPhase(flights, team, t) {
  const f = flights.find(x => x.teams.includes(team));
  if (!f) return 'gate';
  if (t < f.departs) return 'gate';
  if (f.lands != null && t >= f.lands) return 'arrive';
  return 'air';
}

// ── the episode ────────────────────────────────────────────────────────
/**
 * @param res   playRaceSeason's result (state, legs)
 * @param eps   airSeason(res)
 * @param i     the episode (0-based)
 * @returns {{ screens, n, place, placeName, kind, teams }}
 */
export function episodeScreens(res, eps, i) {
  const st = res.state, leg = res.legs[i], ep = eps[i];
  const prevLeg = i ? res.legs[i - 1] : null, nextLeg = res.legs[i + 1] || null;
  const placeId = leg.place, place = PLACES[placeId];
  const plates = PLACE_PLATES[placeId];
  const { teamOf, color } = castIndex(st);
  const sceneById = new Map(st.scenes.map(s => [s.id, s]));
  const stretchOf = id => place?.stretches.find(s => s.id === id) || null;
  const racing = leg.order.slice();
  const flights = st.scenes.filter(s => s.leg === leg.n && s.kind === 'same-flight')
    .map(s => ({ teams: s.data.teams || [], departs: s.data.t, lands: s.data.lands }));
  const clock0 = leg.clockStart ?? 420;
  const used = {};                  // plate rotation: the nth scene at a stretch gets its nth plate
  const opened = new Set();         // the challenges (stretch|side) already seen this leg: the first moment there opens wide
  const nth = key => (used[key] = (used[key] ?? -1) + 1);
  const named = new Set();          // teams captioned in the confessional already this episode
  const screens = [];
  let lastPlate = plates?.opener || null, lastT = null;
  // where each team was last seen standing at a stretch, and when (one place at a time: see SAME_SPOT)
  const seenAt = {};

  const push = s => { s.id = `e${leg.n}s${screens.length}`; screens.push(s); return s; };
  const nameOfTeam = id => st.teams[id]?.name || id;
  const membersOf = id => (st.teams[id] ? [st.teams[id].a, st.teams[id].b] : []);
  const say = l => ({ by: l.by || null, part: l.kind === 'beat' ? 'beat' : l.kind === 'conf' ? 'conf' : 'say', text: l.text,
    team: l.by ? teamOf[l.by] || null : null, intel: {} });

  // 1. the show's open (leg one) and "previously"
  if (leg.n === 1) {
    push({ kind: 'logo', place: placeId, plate: { f: plates?.title, place: placeId }, hud: null,
      steps: [{ by: null, part: 'card', text: `${racing.length} teams · around the world · one million dollars`, intel: {} }] });
  }
  if (ep.previously?.lines?.length) {
    // Don over the map; after each of his lines, the clip it points at, replayed on that scene's own plate
    // (js/rr/story/previously.js: `clip: true` lines, `clips` the scenes they come from, in order)
    const clips = [...(ep.previously.clips || [])];
    const runs = [];
    for (const l of ep.previously.lines) {
      const clip = !!(l.clip || (l.by && l.by !== 'Don'));
      const last = runs.at(-1);
      if (last && last.clip === clip) last.lines.push(l); else runs.push({ clip, lines: [l] });
    }
    for (const run of runs) {
      if (!run.clip) {
        push({ kind: 'map', place: placeId, from: prevLeg?.place || null, to: placeId, hud: { task: 'PREVIOUSLY', clock: null },
          steps: run.lines.map(l => ({ ...say(l), map: true })) });
        continue;
      }
      // which scene each line was said in: the next clipped scene with that speaker in it
      let group = null;
      for (const l of run.lines) {
        // a clip line names its scene (previously.js); an older one is matched by who is in it
        const at = l.scene != null ? clips.indexOf(l.scene) : clips.findIndex(id => whoOfClip(st, id).includes(l.by));
        const id = l.scene ?? (at >= 0 ? clips.splice(at, 1)[0] : (group?.id ?? null));
        if (!group || group.id !== id) { group = { id, lines: [] }; run.groups = [...(run.groups || []), group]; }
        group.lines.push(l);
      }
      for (const g of run.groups) {
        const conf = g.lines.every(l => l.kind === 'conf');
        const speakers = [...new Set(g.lines.map(l => l.by))];
        const teams = [...new Set(speakers.map(n => teamOf[n]).filter(Boolean))];
        const steps = g.lines.map(l => ({ ...say(l), clip: true }));
        if (conf && teams.length === 1) {
          push({ kind: 'iv', seg: 'replay', replay: true, place: placeId, team: teams[0], solo: null, caption: false,
            people: membersOf(teams[0]), hud: { task: 'LAST TIME', clock: null }, steps });
          continue;
        }
        const plate = clipPlate(st, g.id, prevLeg) || { ...(prevLeg ? matPlate(prevLeg.place) : plates.opener), place: prevLeg?.place || placeId };
        push({ kind: 'world', seg: 'replay', replay: true, mode: 'talk', place: placeId, stretch: null, plate: plate.race ? plate : { ...plate, place: plate.place || prevLeg?.place || placeId },
          teams, locals: speakers.filter(n => n !== 'Don' && !teamOf[n]), don: speakers.includes('Don'), narrator: false,
          hud: { task: 'LAST TIME', clock: null }, steps, members: Object.fromEntries(teams.map(id => [id, membersOf(id)])), who: speakers });
      }
    }
  }
  // 2. the title card
  const kinds = [...new Set((place?.stretches || []).filter(s => TASKS.has(s.kind)).map(s => KIND_NAME[s.kind]))];
  push({ kind: 'title', place: placeId, plate: { f: plates?.title, place: placeId }, hud: null,
    title: { pre: leg.kind === 'final' ? 'THE FINAL LEG' : `LEG ${leg.n}`, big: (leg.placeName || place?.name || '').toUpperCase(), sub: kinds.join(' · ') },
    steps: [{ by: null, part: 'card', text: '', intel: {} }] });

  // 3. the leg, in the director's order
  for (const seg of ep.segments) {
    if (!seg.lines?.length) continue;
    const scene = typeof seg.scene === 'number' ? sceneById.get(seg.scene) : null;
    const snap = scene?.data?.snap || null;
    const segTeams = [...new Set((seg.teams || []).filter(id => st.teams[id]))];
    const stretch = seg.stretch ? stretchOf(seg.stretch) : null;
    const sideLabel = seg.side && stretch?.sides ? stretch.sides.find(x => x.id === seg.side)?.label : null;

    // where it is shot
    let mode = 'talk', plate = null, hudTask = stretch?.label?.toUpperCase() || '', parked = null, failStamp = null;
    let placeFor = placeId;
    const k = seg.kind;
    if (k === 'don-narrate') {
      // the season's first words: Don, on camera at the start line ("I'm your host, Don"), not a voice over an empty
      // street (2026-10-21, the user: "why is don avatar just not here in this shot")
      if (seg.ending === 'welcome') { plate = plates.opener; mode = 'don'; hudTask = 'THE START'; }
      else if (seg.ending === 'depart') { placeFor = prevLeg?.place || placeId; plate = prevLeg ? matPlate(prevLeg.place) : plates.opener; hudTask = 'DEPARTURE'; mode = 'narrate'; }
      else if (seg.ending === 'flight-wait') { mode = 'flight'; hudTask = 'IN THE AIR'; }
      // (each landing on another of the place's arrivals, each last stretch on another view of the Chill Zone)
      else if (/landed/.test(seg.ending || '')) { plate = pick(plates.arrive, nth(`${placeId}|arrive`)) || plates.opener; mode = 'landing'; hudTask = 'ARRIVAL'; }
      else if (seg.ending === 'last-stretch') {
        const v = (plates.views || []).filter(x => x.at === 'mat'), n = nth(`${placeId}|matviews`);
        plate = v.length && n % 2 === 0 ? pick(v, n / 2) : matPlate(placeId); mode = 'narrate'; hudTask = 'CHILL ZONE';
      }
      // Don at the mat, before the first team reaches it, introducing the Chill Zone
      else if (seg.ending === 'chill') { plate = matPlate(placeId); mode = 'mat'; hudTask = 'CHILL ZONE'; }
      // Don over the place: every other time one of its views (the user's wide shots), else where the race is
      else {
        const v = (plates.views || []).filter(x => x.at !== 'mat'), n = nth(`${placeId}|views`);
        plate = v.length && n % 2 === 0 ? pick(v, n / 2) : (lastPlate?.place === placeId ? lastPlate : plates.opener); mode = 'narrate';
      }
    } else if (k === 'don-opener') {
      // the place, presented (2026-10-20, the user: "we need presentation of the actual place with a description and
      // image by don"): Don says what it is over its own wide shots, one line a shot; then he opens the leg standing
      // there (it was shot at the last leg's Chill Zone while he described the new place)
      // ...first its card: the name, a pin on the race map, a line about it and three facts (2026-10-21, the user: "more
      // text showing more images more descriptions"); then its shots, each with a caption ("keep the challenges a
      // surprise": a look at where they are, never what they are)
      const card = cardOf(placeId);
      if (card?.plate) push({ kind: 'world', seg: 'place-card', ending: null, mode: 'narrate', place: placeId, stretch: null, side: null,
        plate: { ...card.plate, place: placeId }, parked: null, teams: [], locals: [], localFaces: {}, don: false, narrator: true,
        card: { name: leg.placeName || place?.name || '', tag: card.tag, facts: card.facts, map: place?.map || null, leg: leg.n, final: leg.kind === 'final' },
        hud: { task: (leg.placeName || place?.name || '').toUpperCase(), clock: null }, timecard: null,
        steps: [{ by: 'Don', part: 'say', text: card.say, team: null, intel: {}, viewer: true }], from: prevLeg?.place || null, to: placeId, who: [],
        stretchKind: null, members: {}, t: seg.t });
      for (const { plate: pp, text, cap } of aboutOf(placeId)) {
        push({ kind: 'world', seg: 'place-present', ending: null, mode: 'narrate', place: placeId, stretch: null, side: null, caption: cap || null,
          plate: { ...pp, place: placeId }, parked: null, teams: [], locals: [], localFaces: {}, don: false, narrator: true,
          hud: { task: (leg.placeName || place?.name || '').toUpperCase(), clock: null }, timecard: null,
          steps: [{ by: 'Don', part: 'say', text, team: null, intel: {}, viewer: true }], from: prevLeg?.place || null, to: placeId, who: [],
          stretchKind: null, members: {}, t: seg.t });
      }
      // ...shot where the opener says Don is (opener-shots.js): a plate the place has, a made job, with the cut-outs
      // he is with (a hammock, a sunlounger)
      const os = (seg.lineId || '').split(',').map(id => OPENER_SHOTS[id]).find(Boolean);
      let op = plates.opener;
      if (os?.job) op = { f: os.job, g: 90, x: [10, 90] };
      else if (os?.f) { try { op = findPlate(placeId, os.f); } catch { op = plates.opener; } }
      if (op.water || op.people === false) op = { ...op, water: false, people: undefined, g: op.g || 90, x: op.x?.[1] > op.x?.[0] ? op.x : [10, 90] };
      // (a shot whose ground the place never set, the treetops over the coast: the opener says where it is)
      if (os?.g) op = { ...op, g: os.g };
      if (os?.deco) op = { ...op, deco: [...(op.deco || []), ...os.deco] };
      plate = op; placeFor = placeId; mode = 'don'; hudTask = 'THE START';
    }
    // the pick-a-team Boomerang happens at the start too, where the opener is, before anybody leaves
    else if (k === 'boomerang-vote' || (k === 'don-rule' && !seg.stretch)) {
      plate = leg.n === 1 ? plates.opener : (prevLeg ? matPlate(prevLeg.place) : plates.opener);
      placeFor = leg.n === 1 ? placeId : (prevLeg?.place || placeId); hudTask = 'THE START';
    }
    else if (k === 'don-demo') {
      // Don shows the challenge wide (the whole course), else in the room it is done in, else where its moments are
      const sp = stretchPlates(placeId, seg.stretch, null);
      const room = sp?.act && standable(sp.act) && IN_PLACE.has(sp.act.mode) ? sp.act : null;
      plate = pick((sp?.wide || []).filter(standable), 0) || room || pick(sp?.talk, 0) || plates.opener; mode = 'demo';
    } else if (k === 'same-flight' || (seg.stretch === 'airport' && airportPhase(flights, segTeams[0], seg.t) === 'air')) {
      plate = { ...(RACE[k === 'same-flight' && segTeams.length > 2 ? 'galley' : 'cabin']), race: true }; mode = 'cabin'; hudTask = 'IN THE AIR';
      if (plate.seats && seg.who.length > 2) plate = { ...RACE.galley, race: true };
    } else if (seg.stretch === 'airport') {
      const ph = airportPhase(flights, segTeams[0], seg.t);
      if (ph === 'arrive') { plate = pick(plates.arrive, nth(`${placeId}|arrive`)) || plates.opener; hudTask = 'ARRIVAL'; }
      else { plate = { ...RACE.gate, race: true }; hudTask = 'THE AIRPORT'; }
    } else if (seg.stretch === 'duel') {
      // the Head-to-Head stands just short of the mat: on the last stretch before it, never on the Chill Zone (the
      // user, 2026-10-20: "make no sense that they are on the mat before the course is over")
      const ss = place?.stretches || [];
      const before = ss.slice(0, Math.max(0, ss.findIndex(x => x.kind === 'mat'))).reverse();
      const matFiles = new Set((stretchPlates(placeId, 'mat', null)?.talk || []).map(p => p.f));
      const pickFrom = st0 => { const sp0 = stretchPlates(placeId, st0.id, null); return [...(sp0?.talk || []), sp0?.act].filter(p => p && standable(p) && !p.closed && !p.mat && !matFiles.has(p.f)); };
      plate = before.map(pickFrom).find(l => l.length)?.[0] || plates.opener; hudTask = 'HEAD-TO-HEAD';
    } else if (MAT_KINDS.has(k) || seg.stretch === 'mat' || seg.stretch === 'midmat') {
      const mid = seg.stretch === 'midmat' || !!scene?.data?.midmat;
      // (the finale's mat is the finish line: the race ends on a stage, not at a Chill Zone)
      // (each team's check-in on another of the Chill Zone's angles: the first one only, always, left the rest unseen)
      plate = matPlate(placeId, Math.max(0, st.order.indexOf(segTeams[0])), mid); mode = 'mat'; hudTask = mid ? 'THE MIDPOINT' : leg.kind === 'final' ? 'THE FINISH LINE' : 'CHILL ZONE';
    } else if (k.startsWith('int-')) {
      mode = 'iv';
    } else if (stretch) {
      const sp = stretchPlates(placeId, seg.stretch, seg.side);
      const wantsAct = (TASKS.has(stretch.kind) && ACT_KINDS.has(k)) || (stretch.kind === 'travel' && RIDE_KINDS.has(k));
      // a task done in two halves (over the gorge, then the coconut pile) shows its second half when it is done
      // a team's own angle on the action: the stretch's action plate, or another the user made of it (alt)
      // a stage of a staged challenge: the stage's own shot (where it went wrong: its fail shot), a team's own angle
      const sg = k === 'task-stage' ? sp?.stages?.[seg.stage] : null;
      if (sg) {
        const ti = Math.max(0, st.order.indexOf(segTeams[0]));
        const opts = seg.ending === 'fail' && sg.fail ? [sg.fail] : [sg.plate, ...(sg.alt || [])];
        plate = opts[ti % opts.length];
        mode = plate.mode && (plate.path || IN_PLACE.has(plate.mode)) ? 'act' : 'talk';
        hudTask += ` · ${sg.label}`;
        if (seg.ending === 'fail' && sg.stamp) failStamp = sg.stamp;
        opened.add(`${seg.stretch}|${seg.side || ''}`);
      } else if (wantsAct && sp?.act) {
        const ti = Math.max(0, st.order.indexOf(segTeams[0]));
        const acts = [sp.act, ...(sp.alt || [])], acts2 = sp.act2 ? [sp.act2, ...(sp.alt2 || [])] : [];
        plate = (k === 'task-done' && acts2.length && acts2[ti % acts2.length]) || acts[ti % acts.length]; mode = 'act';
      }
      else {
        // (2026-10-20, the user: "the shots u are using are too close sometimes", "they dont even enter that dance
        // academy"): a challenge opens wide (the first moment there this leg) and a crowd of teams is shot wide; a
        // challenge done in one room has its moments in that room; else the stretch's own standing shots
        const key = `${seg.stretch}|${seg.side || ''}`;
        // a challenge in stages: a team's own moment is shot where the team is at that minute, at the stage it is at
        // (the user, 2026-10-21, on Home City: "theyre not even in the staircase nor climbing it", a deck walker's fear
        // in the elevator)
        // (a challenge a place's own local runs starts and ends with them: the guide at the cliff, the farmer's sack)
        const withLocal = ['task-start', 'task-done'].includes(k) && placeLocal(placeId, seg.stretch, seg.side);
        // (two teams of different sides meeting at an Either/Or's start, before either took a side: no stage yet;
        // director.js marks it `split`)
        const atStart = !!seg.split;
        const row = TASKS.has(stretch.kind) && !withLocal && !atStart && segTeams.length && segTeams.length <= 2 ? (st.taskLog || [])
          .filter(r => r.leg === leg.n && r.team === segTeams[0] && r.stretch === seg.stretch).find(r => r.from <= seg.t + 0.5 && seg.t <= r.to + 0.5) : null;
        const stageNow = row?.stages?.find(x => x.t >= seg.t - 0.5)?.id;
        const sgNow = stageNow ? sp?.stages?.[stageNow] : null;
        const here = sgNow ? [sgNow.plate, ...(sgNow.alt || [])].filter(standable) : [];
        const wides = TASKS.has(stretch.kind) ? (sp?.wide || []).filter(standable) : [];
        const room = TASKS.has(stretch.kind) && sp?.act && standable(sp.act) && IN_PLACE.has(sp.act.mode)
          ? [sp.act, ...(sp.alt || []).filter(a => standable(a) && IN_PLACE.has(a.mode))] : [];
        // a team seen at this stretch minutes ago is still where it was seen: the shot of the latest sighting of any team in
        // the scene (the user, 2026-10-21: "FINN and Manu are outside then right after inside again", both at 08:12)
        const near = segTeams.map(id => seenAt[id]).filter(p => p && p.stretch === seg.stretch
          && Math.abs(p.t - seg.t) <= SAME_SPOT && standable(p.plate)).sort((x, y) => Math.abs(x.t - seg.t) - Math.abs(y.t - seg.t) || y.n - x.n)[0];
        // (only a conversation between two teams: a team's own moment is where its stage is, a challenge opens wide, a crowd
        // is shot wide, and two teams of different sides meet at the foot)
        const talking = segTeams.length === 2 && !atStart && !/^task-/.test(k) && !(wides.length && !opened.has(key));
        // (the team the scene is about at a stage of the challenge: the scene is there, and the other team with it)
        if (near && talking && !here.length) plate = near.plate;
        else if (here.length) plate = pick(here, nth(`${placeId}|${key}|${stageNow}`));
        else if (wides.length && (!opened.has(key) || segTeams.length >= 3)) plate = pick(wides, nth(`${placeId}|${key}|wide`));
        else if (room.length) plate = pick(room, nth(`${placeId}|${key}|room`));
        else plate = pick(sp?.talk, nth(`${placeId}|${key}`)) || sp?.act || (lastPlate?.place === placeId ? lastPlate : plates.opener);
        opened.add(key);
      }
      if (!standable(plate) && mode !== 'act') plate = pick(sp?.talk?.filter(standable), 0) || plates.opener;
      // a narrow corner (a stair landing) holds two teams: three or more go to the stretch's widest standing plate
      if (mode === 'talk' && segTeams.length > 2 && plate?.x && plate.x[1] - plate.x[0] < 11 * segTeams.length) {
        const wide = (sp?.talk || []).filter(standable).sort((a, b) => (b.x[1] - b.x[0]) - (a.x[1] - a.x[0]))[0];
        if (wide && wide.x[1] - wide.x[0] > plate.x[1] - plate.x[0]) plate = wide;
      }
      if (sideLabel) hudTask += ` · ${sideLabel.toUpperCase()}`;
      // a team at a ride challenge stands beside its vehicle before and after the race (the sled, the rickshaw)
      if (mode === 'talk' && TASKS.has(stretch.kind) && sp?.act?.prop && ['ride', 'push'].includes(sp.act.mode) && !personOf(placeId, sp.act.prop)) parked = sp.act.prop;
    } else if (seg.stretch === 'board' || seg.stretch === 'speed-bump' || seg.stretch === 'zip') {
      plate = (lastPlate?.place === placeId ? lastPlate : plates.opener);
      hudTask = { board: 'THE BOARD', 'speed-bump': 'SPEED BUMP', zip: 'THE ZIP-IT' }[seg.stretch];
    } else {
      plate = (lastPlate?.place === placeId ? lastPlate : plates.opener);
    }
    if (plate && !plate.race) plate = { ...plate, place: plate.place || placeFor };
    if (plate && mode !== 'iv' && standable(plate)) lastPlate = { ...plate };
    if (plate && mode === 'talk' && seg.stretch && seg.t != null && standable(plate)) for (const id of segTeams) seenAt[id] = { stretch: seg.stretch, t: seg.t, plate, n: screens.length };

    // the time card, on the first step after a gap in the clock
    let timecard = null;
    if (seg.t >= 0 && lastT != null && seg.t - lastT >= 30) timecard = timeWords(seg.t - lastT);
    if (seg.t >= 0) lastT = Math.max(lastT ?? 0, seg.t);
    const clock = seg.t >= 0 ? hhmm(clock0 + seg.t) : null;

    // the scene's lines: world runs and confessional runs
    const runs = [];
    for (const l of seg.lines) {
      const conf = l.kind === 'conf' || (k.startsWith('int-') && l.by);
      const team = l.by ? teamOf[l.by] || null : null;
      const last = runs.at(-1);
      if (last && last.conf === conf && (!conf || last.team === team)) last.lines.push(l);
      else runs.push({ conf, team, lines: [l] });
    }

    const segIntel = {};
    const where = { label: hudTask ? hudTask.toLowerCase() : 'racing', t: seg.t, clock };
    if (segTeams.length && mode !== 'iv' && seg.kind !== 'don-narrate') {
      segIntel.where = Object.fromEntries(segTeams.map(id => [id, where]));
      if (snap && scene?.data?.team && snap.money != null) segIntel.money = { [scene.data.team]: snap.money };
      if (snap && scene?.data?.team && snap.lead) segIntel.lead = { [scene.data.team]: snap.lead };
    }
    const ev = eventOf(seg, nameOfTeam);
    if (ev) segIntel.event = ev;

    let first = true;
    for (const run of runs) {
      if (run.conf) {
        const speakers = [...new Set(run.lines.map(l => l.by).filter(Boolean))];
        if (speakers.length === 1 && !teamOf[speakers[0]]) {
          // Don's own interview (or a local's): alone in front of the map
          const steps = run.lines.map(l => say(l));
          if (first) Object.assign(steps[0].intel, segIntel);
          push({ kind: 'iv', seg: seg.kind, place: placeId, team: null, solo: speakers[0], caption: false, people: [speakers[0]],
            hud: { task: 'INTERVIEW', clock: null }, steps });
          first = false;
          continue;
        }
        const team = run.team || segTeams[0];
        const solo = speakers.length === 1 && (SOLO_KINDS.test(k) || !seg.who.includes(membersOf(team).find(n => n !== speakers[0])));
        const caption = !named.has(team + (solo ? ':' + speakers[0] : ''));
        named.add(team + (solo ? ':' + speakers[0] : ''));
        const steps = run.lines.map(l => say(l));
        if (first) Object.assign(steps[0].intel, segIntel);
        push({ kind: 'iv', seg: seg.kind, place: placeId, team, solo: solo ? speakers[0] : null, caption,
          people: solo ? [speakers[0]] : membersOf(team), hud: { task: 'INTERVIEW', clock: null }, steps });
        first = false;
        continue;
      }
      const steps = run.lines.map(l => say(l));
      const speakerTeams = run.lines.map(l => teamOf[l.by]).filter(Boolean);
      const teams = [...new Set([...segTeams, ...speakerTeams])];
      const locals = [...new Set(run.lines.filter(l => l.by && l.by !== 'Don' && !teamOf[l.by]).map(l => l.by))];
      // people are avatars (2026-10-20, the user: "the cutout use is still the fullbody"): a plate's full-body cut-out
      // of a local (the farmer judging, the tango teacher dancing) comes off, and their avatar stands there instead
      const persons = [];
      if (plate) {
        const pj = personOf(placeId, plate.judge?.[0]), pp = personOf(placeId, plate.prop);
        const deco = (plate.deco || []).filter(d => !personOf(placeId, d[0]));
        for (const d of plate.deco || []) if (personOf(placeId, d[0])) persons.push(personOf(placeId, d[0]));
        if (pj || pp || deco.length !== (plate.deco || []).length) {
          plate = { ...plate, ...(pj ? { judge: null } : {}), ...(pp ? { prop: null } : {}), deco };
          if (pj) persons.push(pj);
          if (pp) persons.push(pp);
        }
      }
      // the place's own local stands at their challenge as it starts and as a team gets through it (the fisherman at
      // the welcome rite), in a shot where the teams and the local are spread out together
      const own = placeLocal(placeId, seg.stretch, seg.side);
      // (not out where the teams travel a path: the rancher stays at the fence while they ride the plain)
      // (a stage in a room has its local in it: the instructor in the academy)
      // (`local: false`: a stage away from the local's post, the cliff ledge far from the pepper cart)
      if (own && plate?.local !== false && ((mode === 'talk' && ['task-start', 'task-done'].includes(k) && !plate?.closed) || (k === 'task-stage' && !plate?.path)) && standable(plate)) persons.push(own);
      for (const id of new Set(persons)) if (!locals.some(n => localFor(n, placeId, seg.stretch, '', seg.side)?.id === id)) locals.push(LOCALS[id]);
      // each local's face (the user's avatars): who a speaking "A local" or "The judge" is, here
      const localFaces = Object.fromEntries(locals.map(n => [n, localFor(n, placeId, seg.stretch, seg.scene ?? seg.t, seg.side)]).filter(([, f]) => f));
      // (the people a plate stands there are exactly who they are, whatever their title says)
      for (const id of new Set(persons)) localFaces[LOCALS[id]] = { id, name: LOCALS[id], url: localUrl(id) };
      const donSpeaks = run.lines.some(l => l.by === 'Don');
      const scr = {
        kind: mode === 'flight' ? 'flight' : 'world', seg: k, ending: seg.ending, mode, place: placeId, stretch: seg.stretch, side: seg.side, ...(seg.split ? { split: true } : {}),
        plate, parked, stage: seg.stage ?? null, ...(failStamp ? { failStamp } : {}), teams, locals, localFaces, don: donSpeaks && !['narrate', 'flight', 'landing'].includes(mode) || ['mat', 'demo', 'don'].includes(mode),
        narrator: donSpeaks && ['narrate', 'flight', 'landing'].includes(mode),
        hud: { task: hudTask, clock }, timecard: first ? timecard : null, steps,
        from: prevLeg?.place || null, to: placeId, who: [...(seg.who || [])], stretchKind: stretch?.kind || null,
        members: Object.fromEntries(teams.map(id => [id, membersOf(id)])), t: seg.t,
      };
      if (first) Object.assign(steps[0].intel, segIntel);
      decorate(scr, seg, scene, leg, { nameOfTeam, membersOf, teamOf, stretch, sceneById });
      push(scr);
      first = false;
    }
  }

  // 4. next time
  const won = leg.kind === 'final' ? leg.order?.[0] : null;
  push({ kind: 'end', place: placeId, plate: { f: plates?.title, place: placeId }, hud: null,
    title: won ? { pre: 'THE WINNERS', big: nameOfTeam(won).toUpperCase(), sub: `${st.teams[won].a} & ${st.teams[won].b} · one million dollars` }
      : { pre: 'NEXT TIME', big: (nextLeg?.placeName || '').toUpperCase(), sub: 'on the Ridonculous Race' },
    steps: [{ by: null, part: 'card', text: '', intel: {} }] });

  for (const s of screens) stageScreen(s, color);
  // a line that sends people away takes them off the stage (and a later one brings them back)
  const teamNames = Object.fromEntries(Object.entries(st.teams).map(([id, t]) => [id, t.name]));
  for (const s of screens) if (s.kind === 'world' && s.plate) planExits(s, { teamNames });
  // the rest of the race around each shot, the people's reactions, how they come in, and the camera
  const rows = (leg.log || []).map(r => ({ ...r }));
  const tries = (st.taskLog || []).filter(r => r.leg === leg.n);
  const aired = new Set();                 // teams whose placement has been read out on screen so far
  const introduced = [];                   // the premiere's teams, in the order they arrived on screen
  screens.forEach((s, si) => {
    if (s.kind === 'world' && s.plate) {
      const next = screens.slice(si + 1).find(x => x.t != null && x.t > (s.t ?? Infinity));
      const t1 = s.t == null || s.t < 0 ? null : Math.min(s.t + 12, Math.max(s.t + 2, next?.t ?? s.t + 6));
      planCrowd(s, { rows, tries, place, aired, t1, members: membersOf, teamOf, introduced, racing: st.order.filter(id => racing.includes(id)), first: leg.n === 1 });
      if (s.seg === 'team-intro') introduced.push(...s.teams.filter(id => !introduced.includes(id)));
      declutterCrowd(s);
      relift(s);
      planEnter(s, screens, si);
      planReact(s, teamOf, membersOf);
      planCrowdReact(s);
      planCamera(s);
      planHide(s);
      planStamps(s);
    } else if (s.steps) {
      s.steps.forEach(x => { x.cam = { shot: 'wide', s: 1, x: 0, y: 0 }; });
      if (s.kind === 'iv') planIvReact(s);
    }
    for (const x of s.steps || []) if (x.rank?.team != null && !x.rank.out) aired.add(x.rank.team);
  });
  return { screens, n: leg.n, place: placeId, placeName: leg.placeName, kind: leg.kind, racing, color, total: res.legs.length,
    startOrder: prevLeg ? prevLeg.order.filter(id => racing.includes(id)).concat(racing.filter(id => !prevLeg.order.includes(id))) : racing.slice() };
}

// ── a clip from last time: who was in it, and the plate it was shot on ─
function clipScene(st, id) {
  if (typeof id === 'number') return st.scenes.find(s => s.id === id) || null;
  const m = String(id || '').match(/^(task|ride):(\d+):([^:]+):([^:]+)/);
  if (!m) return null;
  const tm = st.teams[m[3]];
  return { kind: m[1] === 'ride' ? 'ride' : 'task-try', leg: +m[2], who: tm ? [tm.a, tm.b] : [], data: { team: m[3], stretch: m[4] } };
}
function whoOfClip(st, id) { return clipScene(st, id)?.who || []; }
function clipPlate(st, id, prevLeg) {
  const sc = clipScene(st, id);
  const place = prevLeg?.place;
  if (!sc || !place) return null;
  const stretch = sc.data?.stretch;
  if (MAT_KINDS.has(sc.kind) || stretch === 'mat' || stretch === 'midmat') return { ...matPlate(place, 0, stretch === 'midmat'), place };
  if (stretch === 'airport') return { ...RACE.gate, race: true };
  const sp = stretch ? stretchPlates(place, stretch, sc.data?.snap?.side || null) : null;
  const p = sp?.talk?.find(standable) || null;
  return p ? { ...p, place } : { ...PLACE_PLATES[place].opener, place };
}

// ── the show's beats around the words: the tip, the pause, the slams ───
function decorate(scr, seg, scene, leg, ctx) {
  const k = seg.kind;
  const donIdx = re => scr.steps.findIndex(s => s.by === 'Don' && re.test(s.text));
  const firstDon = () => scr.steps.findIndex(s => s.by === 'Don');
  const pauseBefore = (at, team) => {
    if (at < 0) return at;
    scr.steps.splice(at, 0, { by: 'Don', part: 'pause', text: '. . .', team: null, focus: team, intel: {} });
    if (at === 0) { scr.steps[0].intel = scr.steps[1].intel; scr.steps[1].intel = {}; }
    return at + 1;
  };
  if (k === 'don-demo' && ctx.stretch) {
    const s = ctx.stretch;
    scr.steps.unshift({ by: null, part: 'tip', text: s.desc || s.label, team: null, intel: scr.steps[0].intel,
      tip: { kind: (KIND_NAME[s.kind] || 'Travel Tip').toUpperCase(), label: s.label, desc: s.desc || '', sides: (s.sides || []).map(x => x.label) } });
    scr.steps[1].intel = {};
    scr.donBox = true;
  }
  // (not indoors: Don by his fire, in his tea room, in the pub; the Don Box is out on the course)
  if (k === 'don-opener' && !/^don-/.test(scr.plate?.f || '')) scr.donBox = true;
  if (k === 'don-place' && scene?.data?.team) {
    const team = scene.data.team, place = scene.data.place;
    scr.arriving = [team];
    let at = donIdx(PLACE_RE); if (at < 0) at = firstDon();
    at = pauseBefore(at, team);
    if (at >= 0) { scr.steps[at].rank = { team, place, mid: !!scene.data.midmat }; (scr.steps[at].intel.placed ||= {})[team] = place; }
  }
  if (k === 'mat-montage') {
    const ids = (seg.scenes || []).map(id => ctx.sceneById.get(id)).filter(Boolean);
    scr.arriving = ids.map(s => s.data.team);
    let next = 0;
    scr.steps.forEach((step, si) => {
      if (step.by !== 'Don') return;
      let s = ids.find(x => ctx.membersOf(x.data.team).some(n => step.text.includes(n)) || step.text.includes(ctx.nameOfTeam(x.data.team)));
      if (!s) s = ids[next];
      if (!s || step.rank) return;
      next = ids.indexOf(s) + 1;
      step.rank = { team: s.data.team, place: s.data.place };
      (step.intel.placed ||= {})[s.data.team] = s.data.place;
      step.arrive = s.data.team;
    });
  }
  const team = seg.teams?.[0];
  if (k === 'don-elim' && team) {
    scr.arriving = [team];
    let at = donIdx(ELIM_RE); if (at < 0) at = firstDon();
    at = pauseBefore(at, team);
    if (at >= 0) {
      const place = leg.order.indexOf(team) + 1 || leg.order.length;
      scr.steps[at].slam = { text: 'ELIMINATED', cls: 'red' };
      scr.steps[at].rank = { team, place, out: true };
      scr.steps[at].intel.out = { [team]: leg.how?.[team] || 'last' };
      (scr.steps[at].intel.placed ||= {})[team] = place;
    }
  }
  if (k === 'don-fakeout' && team) {
    scr.arriving = [team];
    let at = donIdx(NONELIM_RE); if (at < 0) at = firstDon();
    at = pauseBefore(at, team);
    if (at >= 0) { scr.steps[at].slam = { text: 'NON-ELIMINATION', cls: 'gold' }; scr.steps[at].intel.safe = { [team]: true }; }
  }
  if (k === 'don-crown' && team) {
    // the final mat: the winners, then the runners-up (the ending says which this is)
    const crown = scene?.data?.team || team;
    const place = scene?.data?.place ?? (seg.ending === 'winner' ? 1 : 2);
    scr.arriving = [crown];
    let at = place === 1 ? donIdx(CROWN_RE) : donIdx(PLACE_RE); if (at < 0) at = firstDon();
    at = pauseBefore(at, crown);
    if (at >= 0) {
      if (place === 1) { scr.steps[at].slam = { text: 'THE WINNERS!', cls: 'gold' }; scr.steps[at].intel.winner = crown; }
      scr.steps[at].rank = { team: crown, place };
      (scr.steps[at].intel.placed ||= {})[crown] = place;
    }
  }
  const SLAM = { 'boomerang-hit': ['BOOMERANG!', 'boom'], 'boomerang-found': ['BOOMERANG', 'boom'], yield: ['YIELD', 'red'], 'zip-it': ['ZIP IT', 'red'],
    'head-to-head': ['HEAD-TO-HEAD', 'red'], 'boomerang-reveal': ['WHO DID IT', 'boom'],
    'speed-bump': ['SPEED BUMP', 'red'], 'don-ruling': ['PENALTY', 'red'], 'save-used': ['SAVE', 'gold'], 'medevac-choice': ['MEDEVAC', 'red'] };
  if (SLAM[k] && scr.steps.length) {
    const at = k === 'don-ruling' ? Math.max(0, scr.steps.findIndex(s => /minute|penalt|stopwatch|clock/i.test(s.text))) : 0;
    scr.steps[at].slam = { text: SLAM[k][0], cls: SLAM[k][1] };
    // a Boomerang never just appears (2026-10-20, the user): the one found comes out of the tip into the finders' hands,
    // and they hold it from then on; the one used flies in and hits its team. The board lands after it does (stage.js).
    if ((k === 'boomerang-found' || k === 'boomerang-hit') && scr.teams?.[0]) {
      const team = scr.teams[0];
      scr.steps[at].boom = { kind: k === 'boomerang-found' ? 'found' : 'hit', team };
      if (k === 'boomerang-found') for (const x of scr.steps.slice(at + 1)) x.held = team;
    }
  }
}

// a storyline beat the side panel can name (the teams only: what it was is on screen)
function eventOf(seg, name) {
  const [a, b] = seg.teams || [];
  const A = a && name(a), B = b && name(b);
  const k = seg.kind, e = seg.ending || '';
  if (k === 'alliance-pitch' && /accept/.test(e) && B) return { icon: 'ally', text: `Alliance: ${A} + ${B}` };
  if (k === 'alliance-betrayal' && B) return { icon: 'knife', text: `Betrayal: ${A} / ${B}` };
  if (k === 'deal' && /struck/.test(e) && B) return { icon: 'deal', text: `Deal: ${A} owe ${B}` };
  if (k === 'deal-broken' && B) return { icon: 'knife', text: `Deal broken: ${A} / ${B}` };
  if (['push', 'shove', 'steal', 'course-sabotage', 'admin-sabotage', 'fake-shortcut', 'mind-game', 'kidnap-pet', 'revenge', 'lie'].includes(k) && B)
    return { icon: 'grudge', text: `Grudge: ${A} vs ${B}` };
  if (['trash-talk', 'gloat', 'accusation'].includes(k) && B) return { icon: 'grudge', text: `Rivalry: ${A} vs ${B}` };
  if (['help-offer', 'mentor', 'share-info', 'rescue', 'save-your-enemy'].includes(k) && B) return { icon: 'help', text: `Help: ${A} and ${B}` };
  if (/crush|flirt/.test(k)) return { icon: 'heart', text: `Crush: ${A}${B ? ' / ' + B : ''}` };
  if (['snap', 'blame', 'old-wound', 'silent-treatment'].includes(k)) return { icon: 'row', text: `Row: ${A}` };
  if (k === 'leader-shift') return { icon: 'lead', text: `New leader: ${A}` };
  if (k === 'boomerang-hit' && B) return { icon: 'boom', text: `Boomerang: ${A} → ${B}` };
  if (k === 'speed-bump') return { icon: 'bump', text: `Speed Bump: ${A}` };
  if (k === 'don-ruling') return { icon: 'clock', text: `Penalty: ${A}` };
  if (k === 'reward') return { icon: 'gift', text: `Reward: ${A}` };
  if (k === 'phobia') return { icon: 'fear', text: `Fear: ${A}` };
  return null;
}

// ── staging: where everybody is after every step ───────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
export function pathAt(path, f) {
  if (!path?.length) return null;
  if (path.length === 1 || f <= 0) return [...path[0]];
  if (f >= 1) return [...path.at(-1)];
  const segs = path.length - 1, x = f * segs, i = Math.floor(x), t = x - i;
  return [lerp(path[i][0], path[i + 1][0], t), lerp(path[i][1], path[i + 1][1], t)];
}
const groundY = (plate, i) => (Array.isArray(plate.g) ? (i % 2 ? plate.g[0] : plate.g[1]) : plate.g);

// Spread n standers along the plate's ground (or onto its spots), keeping clear of `avoid`.
function spread(plate, n, avoid = [], margin = 0) {
  if (plate.spots?.length) return Array.from({ length: n }, (_, i) => { const s = plate.spots[i % plate.spots.length]; return [s[0] + Math.floor(i / plate.spots.length) * 3, s[1]]; });
  // a token is wider than its feet: keep the whole pair inside the frame
  const x0 = Math.max(plate.x[0], margin), x1 = Math.min(plate.x[1], 100 - margin);
  const free = [];
  const N = Math.max(n, 1);
  for (let i = 0; i < 60 && free.length < N; i++) {
    // evenly spaced, then shifted out of anything to avoid
    const cand = N === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * (free.length + 0.5) / N;
    let x = cand;
    for (const a of avoid) if (Math.abs(x - a) < 9) x = a + (x < a ? -9 : 9);
    x = Math.min(x1, Math.max(x0, x));
    free.push(x);
  }
  return free.slice(0, n).map((x, i) => [x, groundY(plate, i)]);
}

// n places on the ground clear of everything in `avoid` ([x, half-width]), left to right; spread() when they do not fit
// (the layout is then tried again smaller)
function placeRow(plate, n, avoid, half, margin) {
  if (!n) return [];
  const got = freeSpots(plate, n, avoid, half, 0.1, margin);
  if (got.length < n) return spread(plate, n, avoid.map(a => a[0]), margin);
  return got.sort((a, b) => a[0] - b[0]);
}

function sizeFor(n, mode) {
  if (mode === 'cabin') return 13;
  if (n <= 1) return 11;
  if (n === 2) return 9.5;
  if (n <= 4) return 8;
  if (n <= 6) return 6.8;
  return 5.6;
}

// Progress through a task over a screen's steps: up, a slip back on a failed try, through.
// the line of a stage that says what they carried went: "the chest tumbles", "drops the statue", "lets go"
export const DROPS = /\b(drops?|dropped|tumbles?|slips?|lets? go|falls?|fell)\b/i;
function progressPlan(n, ending, failAt = -1) {
  const out = [];
  // (a stage where it went wrong plays like a try after fails: on its way, then back to the start of the stage)
  if (ending === 'fail') ending = 'after-fails';
  if (ending === 'after-fails' || ending === 'struggling') {
    // (it goes wrong halfway, or on the line that says it does: `failAt`)
    const fail = failAt >= 0 && failAt < n ? failAt : Math.max(1, Math.floor(n / 2));
    for (let i = 0; i < n; i++) out.push(i < fail ? 0.15 + 0.5 * (i + 1) / fail : i === fail ? 0 : (i - fail) / Math.max(1, n - 1 - fail));
    return { p: out, fail: n > 1 ? fail : -1 };
  }
  if (ending === 'quit') { for (let i = 0; i < n; i++) out.push(Math.min(0.5, 0.15 + 0.4 * (i + 1) / n)); return { p: out, quit: n - 1 }; }
  for (let i = 0; i < n; i++) out.push(n === 1 ? 1 : 0.2 + 0.8 * i / (n - 1));
  return { p: out };
}

// Nobody stands on anybody: a standing shot whose people would overlap is laid out again a little smaller, down to a
// floor; a crowded plane cabin moves to the galley, where the teams stand in two rows (by the cart, and down the
// aisle), and a cabin that cannot hold everyone at the floor keeps the ones the scene is about (the user, 2026-10-19:
// "a crowded same-flight galley overlaps").
export const OVERLAP_OK = 0.08;                 // two faces may touch by this much of the smaller one, no more
// minutes in which a team seen at a stretch is still where it was seen
export const SAME_SPOT = 5;
const STAGED = ['marks', 'as', 'pos', 'plan', 'swimmers', 'away', 'inset', 'donStand', 'localAt', 'boxAt', 'matAt', 'donAt', 'hiddenUntil', 'onMatAt', 'work', 'lift', 'liftAt',
  'workProp', 'judgeAt', 'leapAt', 'dropAt'];
// The work's cut-out beside the team doing it (a sand palace, a mitten, a platter), on the side with more room, and the
// local who judges it (the surfer boy, the carnival dancer, the coach) beyond it, as tall as a racer: placed here so
// the teams behind the shot keep clear of them (planCrowd) and the stage only draws them.
// the works whose cut-out is built up by the work (a sand palace, an igloo): drawn growing, a third of it at the start
export const GROWS = new Set(['sculpt', 'saw']);
function placeWorkProps(s, marks) {
  const pl = s.plate;
  if (!s.work || !pl?.prop) return;
  const anchor = marks[s.teams[0]] || [50, groundY(pl, 0)];
  const z = s.size || 8, off = z * 1.9 + 4;
  // a thing they hold (HELD: the vial, the racket, the bowl) is in their hands, in front of them at chest height
  if (heldProp(s.place, pl)) {
    s.workProp = { at: [Math.round((anchor[0] + z * 0.45) * 10) / 10, Math.round((anchor[1] - z * 0.55) * 10) / 10], w: z * 0.55 * (pl.heldW || 1), held: true };
    if (pl.judge && pl.judgeAt) s.judgeAt = { at: pl.judgeAt, w: z * 1.35 * pl.judge[1], flip: false };
    else if (pl.judge) {
      const [, ja] = pl.judge, jw = z * 1.35 * ja, gy0 = Array.isArray(pl.g) ? pl.g[1] : pl.g;
      const side = anchor[0] < 50 ? 1 : -1;
      s.judgeAt = { at: [Math.max(jw / 2 + 2, Math.min(98 - jw / 2, anchor[0] + side * (z * 1.9 + jw / 2))), gy0], w: jw, flip: side < 0 };
    }
    return;
  }
  const others = s.teams.slice(1).map(id => marks[id]?.[0]).filter(x => x != null);
  const room = dir => { const x = anchor[0] + dir * off; return Math.min(x - 4, 96 - x, ...others.map(o => Math.abs(o - x))); };
  // (`under`: the cut-out is what they ride or stand on, a mechanical bull: right under them)
  const px = pl.under ? anchor[0] : Math.max(6, Math.min(94, anchor[0] + (room(-1) > room(1) ? -off : off)));
  const gy = Array.isArray(pl.g) ? pl.g[1] : pl.g;
  // (`propW`: a plate's own scale for its cut-out, a racket smaller than a sand palace)
  const w = z * 1.5 * (GROWS.has(s.work) ? 1.5 : 1) * (pl.propW || 1);
  s.workProp = { at: [Math.round(px * 10) / 10, gy], w };
  if (pl.judge && pl.judgeAt) {
    // (`judgeAt`: a judge the plate itself places, the launcher robot across the net; its width is of the plate, in cqw)
    s.judgeAt = { at: pl.judgeAt, w: z * 1.35 * pl.judge[1], flip: false };
  } else if (pl.judge) {
    const [, ja] = pl.judge, jw = z * 1.35 * ja, side = px >= anchor[0] ? 1 : -1;
    const jx = Math.max(jw / 2 + 2, Math.min(98 - jw / 2, px + side * (w / 2 + jw / 2 + 1.5)));
    s.judgeAt = { at: [Math.round(jx * 10) / 10, gy], w: jw, flip: side < 0 };
  }
}
function overlapsAt(s, k) {
  const f = facesAt(s, k);
  for (let a = 0; a < f.length; a++) for (let b = a + 1; b < f.length; b++) if (f[a].key !== f[b].key && overlapOf(f[a].box, f[b].box) > OVERLAP_OK) return true;
  return false;
}
function stageScreen(s, color) {
  s.color = color;
  if (s.kind !== 'world' || !s.plate) return;
  if ((s.mode === 'cabin' || s.kind === 'flight') && s.plate.seats && s.teams.length + s.locals.length + (s.don ? 1 : 0) > 1) s.plate = { ...RACE.galley, race: true };
  const base = (s.plate?.scale || 1) * sizeFor(s.teams.length + (s.don ? 0.5 : 0), s.mode);
  const floor = s.mode === 'cabin' ? 7 : Math.max(4.5, base * 0.62);
  for (let z = base; ; z *= 0.94) {
    for (const key of STAGED) delete s[key];
    layout(s, Math.max(floor, z));
    const clash = !s.pos && s.steps.some((_, k) => overlapsAt(s, k) || facesAt(s, k).some(f => { const b = padOf(f, f.z); return b[0] < EDGE || b[2] > 100 - EDGE; }));
    if (!clash) break;
    if (z > floor) continue;
    // at the floor and still too many: a cabin keeps the teams the scene is about and lets the others sit out of the shot
    const need = new Set([...s.steps.map(x => x.team), s.teams[0]].filter(Boolean));
    const spare = s.teams.filter(id => !need.has(id));
    if (s.mode !== 'cabin' || !spare.length) break;
    s.teams = s.teams.filter(id => id !== spare.at(-1));
    z = base / 0.94;
  }
}
function layout(s, size) {
  const plate = s.plate;
  const n = s.teams.length;
  s.size = Math.round(size * 100) / 100;
  const marks = {};
  const as = {};
  const ps = s.steps.length;
  const M = Math.max(s.size * 0.95 + 1, s.size * 0.86 + EDGE + 1.4);    // (+ a work loop's sway)
  // Don and the Don Box stand on the ground too
  const extras = [];
  if (s.mode === 'cabin' || s.kind === 'flight') {
    const seats = plate?.seats;
    if (seats && n <= 1) s.teams.forEach((id, i) => { marks[id] = seats[i]; as[id] = 'seat'; });
    else if (plate.rows) {
      // the galley: rows at two depths, front row first, everybody side by side (Don and a local too)
      const who = [...(s.don ? ['Don'] : []), ...s.locals, ...s.teams];
      const per = Math.ceil(who.length / plate.rows.length);
      const half = w => (w === 'Don' || s.locals.includes(w) ? 0.55 : 0.8) * s.size;
      plate.rows.forEach((row, r) => {
        const here = who.slice(r * per, r * per + per);
        const x0 = Math.max(row.x[0], 1), x1 = Math.min(row.x[1], 99);
        const hs = here.map(half), room = x1 - x0 - hs.reduce((a, b) => a + 2 * b, 0);
        const gap = here.length ? Math.max(0, room) / (here.length + 1) : 0;
        let x = x0 + gap;
        here.forEach((w, i) => {
          const at = [Math.round((x + hs[i]) * 10) / 10, row.g];
          x += 2 * hs[i] + gap;
          if (w === 'Don') s.donStand = at;
          else if (s.locals.includes(w)) (s.localAt ||= {})[w] = at;
          else { marks[w] = at; as[w] = 'stand'; }
        });
      });
    } else {
      const pts = spread(plate || RACE.galley, n, [], M);
      s.teams.forEach((id, i) => { marks[id] = pts[i]; as[id] = 'stand'; });
    }
  } else if (s.mode === 'mat') {
    const mat = plate.mat || plate.matPos || [lerp(plate.x[0], plate.x[1], 0.45), groundY(plate, 0)];
    s.matAt = [...mat];
    const donX = mat[0] + 16 <= plate.x[1] ? mat[0] + 16 : mat[0] - 16;
    s.donAt = [Math.min(plate.x[1], Math.max(plate.x[0], donX)), groundY(plate, 0)];
    const arriving = (s.arriving || []).filter(id => s.teams.includes(id));
    const others = s.teams.filter(id => !arriving.includes(id));
    // the others stand clear of the mat and of Don (spread() only nudged them off by a few per cent)
    const z = s.size, obst = [[mat[0], 0.8 * z], [s.donAt[0], 0.55 * z]];
    const pts = placeRow(plate, others.length, obst, 0.8 * z, M);
    others.forEach((id, i) => { marks[id] = pts[i]; as[id] = 'stand'; });
    // a montage: each team steps on the mat in turn and then stands aside
    if (arriving.length > 1) {
      const aside = placeRow(plate, arriving.length, obst.concat(pts.map(p => [p[0], 0.8 * z])), 0.8 * z, M);
      arriving.forEach((id, i) => { marks[id] = aside[i]; as[id] = 'stand'; });
      // nobody is at the Chill Zone before Don checks them in
      s.hiddenUntil = {};
      arriving.forEach(id => { const k = s.steps.findIndex(x => x.arrive === id); s.hiddenUntil[id] = k < 0 ? 0 : k; });
      s.onMatAt = Object.fromEntries(Object.entries(s.hiddenUntil));
    } else arriving.forEach(id => { marks[id] = [...mat]; as[id] = 'stand'; });
    s.donStand = s.donAt;
  } else if (s.mode === 'act' && plate?.path && PATH_MODES.has(plate.mode)) {
    // (a climb that drops what it carries slips on the line that says so: the chest tumbles as it is read)
    const said = plate.drop ? s.steps.findIndex(x => x.part === 'beat' && DROPS.test(x.text || '')) : -1;
    const plan = progressPlan(ps, s.ending === 'any' && s.seg === 'task-done' ? 'done' : s.ending, said);
    s.plan = plan;
    // what the climb carried goes on the step it fails: out of their arms, down to where it lands (plates.js `drop`)
    // (`from`: where they were on the climb when it went, so the fall plays even when the screen opens on it)
    if (plate.drop && plate.carry && plan.fail >= 0) s.dropAt = { k: plan.fail, to: plate.drop, what: plate.carry, from: pathAt(plate.path, plan.fail > 0 ? plan.p[plan.fail - 1] : 0.65) };
    s.pos = [];
    const ride = plate.mode === 'ride';
    // teams on the same path keep a face's width and more apart along it (the path's length in % of the frame)
    const plen = plate.path.slice(1).reduce((a, q, j) => a + Math.hypot(q[0] - plate.path[j][0], q[1] - plate.path[j][1]), 0) || 1;
    // (a ride keeps a vehicle's length apart: the sled, the raft, the jeep is wider than the faces on it; 2026-10-20,
    // two teams' sleds drawn one on top of the other)
    const gapF = Math.max(0.12, (s.size || 8) * (ride && plate.prop ? 1.9 + 1.6 * (plate.propW || 1) : 1.9) / plen);
    // a leap off the top (`leap`): on the edge until the line that has them jump (else the second line), in the water
    // from then on; the stage draws the jump itself (2026-10-21, the user: "theres no animation for jumping from a cliff")
    if (plate.leap) {
      const j = s.steps.findIndex(x => x.part === 'beat' && LEAPS.test(x.text || ''));
      s.leapAt = j < 0 ? Math.min(1, ps - 1) : j;
    }
    for (let k = 0; k < ps; k++) {
      const pos = {};
      s.teams.forEach((id, i) => {
        let f = plate.leap ? (k < s.leapAt ? 0 : 1) : ride ? (k === 0 ? 0.5 : 0.5 + 0.12 * k / Math.max(1, ps - 1)) : plan.p[k];
        // three or more on one path go two abreast (side by side, then the next pair behind them)
        const abreast = s.teams.length > 2 && !ride && !['swim', 'dive', 'hop'].includes(plate.mode);
        f = Math.max(0, Math.min(1, f - (abreast ? i >> 1 : i) * gapF));
        let pt = pathAt(plate.path, f);
        if (abreast) pt = [pt[0] + (i % 2 ? 1 : -1) * 0.95 * s.size, pt[1]];
        if (plate.mode === 'hop') { const idx = Math.round(f * (plate.path.length - 1)); pt = [...plate.path[idx]]; }
        if (['swim', 'dive'].includes(plate.mode)) {
          // a head in the water is centred on its point, its name under it: both stay above the frame's bottom
          const gap = Math.max(5, s.size * 0.95);
          pt = [Math.min(100 - M - gap, Math.max(M, pt[0])), Math.min(100 - 1.2 * s.size - 2, pt[1] + i * 4)];
        } else if (plate.mode === 'ride') pt = [pt[0], Math.max(s.size * 2.9 + 6, pt[1] + i * 4)];    // a high flier's faces stay in
        // (the slow push on the plate moves the edges out by a few per cent: the margins allow for it)
        // a climber or a jumper is never so high (or so far to the side) that their faces leave the frame
        else pt = [Math.min(100 - M, Math.max(M, pt[0])), Math.max(s.size * 2.45 + 7, pt[1])];
        pos[id] = pt;
      });
      s.pos.push(pos);
    }
    s.teams.forEach(id => { marks[id] = s.pos[0][id]; as[id] = plate.mode; });
    if (['swim', 'dive'].includes(plate.mode)) {
      // in the water: a Botch sends one partner (the one doing it) and the other watches from the inset
      s.swimmers = {};
      const watching = [];
      for (const id of s.teams) {
        const pair = s.members[id] || [];
        // (a stage moment names the one doing it first, then the partner watching: director.js stageBeats)
        // (`swimmer: 'b'`: an All-In where only one goes in, the partner who jumps for the milk while the eater waits)
        const doer = s.seg === 'task-stage' && plate.swimmer === 'b' && pair.includes(s.who[1]) ? s.who[1]
          : s.stretchKind !== 'botch' ? null
          : (s.seg === 'task-stage' && pair.includes(s.who[0]) ? s.who[0] : pair.find(x => s.who.includes(x)) || pair[0]);
        s.swimmers[id] = doer ? [doer] : pair;
        if (doer) watching.push(...pair.filter(x => x !== doer));
      }
      if (watching.length) s.inset = { title: plate.inset || 'WATCHING', people: watching };
    } else if (((['zip', 'para', 'swing'].includes(plate.mode) && s.stretchKind === 'botch') || plate.solo) && s.seg === 'task-stage') {
      // (`solo`: an All-In where they take turns, one the pinball while the other works the flippers)
      // on a line, a canopy or a rope in a Botch: the one doing it goes, the partner stays behind in the box (the winch
      // at the top of the borehole)
      s.away = {};
      const watching = [];
      for (const id of s.teams) {
        const pair = s.members[id] || [];
        const doer = pair.includes(s.who[0]) ? s.who[0] : pair[0];
        s.away[id] = pair.filter(x => x !== doer);
        watching.push(...s.away[id]);
      }
      if (watching.length) s.inset = { title: plate.inset || 'WATCHING', people: watching };
    }
  } else {
    // standing scenes; an in-place task (search, cook, build) plays its work beside them
    // (an opener that puts Don with a cut-out, a hammock or a rocking chair (opener-shots.js), seats him on it: the
    // teams and the Don Box keep off it)
    const seat = s.mode === 'don' && s.don && (plate?.deco || []).find(d => /@race$/.test(d[0]));
    const avoid = seat ? [seat[1] - seat[3] / 3, seat[1], seat[1] + seat[3] / 3] : [];
    const pts = spread(plate, n + (s.don ? 1 : 0) + s.locals.length, avoid, M);
    let j = 0;
    if (s.don) { s.donStand = pts[j++]; }
    if (seat) s.donStand = [seat[1], seat[2] - seat[3] * 0.4];
    s.locals.forEach(nm => { (s.localAt ||= {})[nm] = pts[j++]; });
    s.teams.forEach(id => { marks[id] = pts[j++]; as[id] = 'stand'; });
    if (s.mode === 'act' && plate?.mode) { s.work = plate.mode; s.plan = progressPlan(ps, s.ending); placeWorkProps(s, marks); }
    // (`solo` in place: one partner does it on the spot, the slap dance on the pad, the other in the box)
    if (s.mode === 'act' && plate?.solo && s.seg === 'task-stage') {
      s.away = {};
      const watching = [];
      for (const id of s.teams) {
        const pair = s.members[id] || [];
        const doer = pair.includes(s.who[0]) ? s.who[0] : pair[0];
        s.away[id] = pair.filter(x => x !== doer);
        watching.push(...s.away[id]);
      }
      if (watching.length) s.inset = { title: plate.inset || 'WATCHING', people: watching };
    }
    // a local keeps clear of the work and of what is judged (the rancher stood in front of the emu, 2026-10-20)
    if (s.localAt && (s.workProp || s.judgeAt)) {
      const avoid = [...Object.values(marks).map(m => m[0]), s.workProp?.at[0], s.judgeAt?.at[0], s.donStand?.[0]].filter(x => x != null);
      const pts = spread(plate, s.locals.length, avoid, M);
      s.locals.forEach((nm, i) => { if (pts[i]) s.localAt[nm] = pts[i]; });
    }
    if (s.donBox) s.boxAt = seat ? [spread(plate, 1, [...avoid, ...Object.values(marks).map(m => m[0])], M)[0][0], groundY(plate, 0)]
      : [lerp(plate.x[0], plate.x[1], s.don ? 0.3 : 0.5), groundY(plate, 0)];
  }
  if (s.don && !s.donStand && s.mode !== 'mat') {
    const pts = spread(plate, 1, Object.values(marks).map(m => m[0]));
    s.donStand = pts[0];
  }
  if (s.locals.length && !s.localAt) {
    s.localAt = {};
    const pts = spread(plate?.water ? { ...plate, x: [6, 20], g: 95, spots: null } : plate, s.locals.length, Object.values(marks).map(m => m[0]));
    s.locals.forEach((nm, i) => { s.localAt[nm] = pts[i]; });
  }
  s.marks = marks;
  s.as = as;
  s.lift = liftFor(s);
  // a climb or a drop spans the frame: the camera follows the team instead, step by step
  if (s.pos && extentOf(s).bottom - s.lift > 100 - BAR) s.liftAt = s.pos.map(pos => liftFor({ ...s, marks: {}, pos: [pos] }));
  void extras;
}

// The dialogue bar sits over the bottom of the picture (BAR: its share of the frame's height, with its margin).
// A screen whose people stand low is lifted by just enough that every face and name stays clear of the bar,
// and never so far that the highest face leaves the top of the frame. A shot nobody stands low in isn't moved.
export const BAR = 17;
export function extentOf(s) {
  let bottom = 0, top = 100;
  const add = (b, t) => { bottom = Math.max(bottom, b); top = Math.min(top, t); };
  const z = s.size || 8;
  const one = (as, [, y]) => {
    if (as === 'swim' || as === 'dive') add(y + 1.2 * z, y - 1.15 * z);
    else if (as === 'ride') add(y + 0.5 * z, y - 2.8 * z);
    else add(y, y - (s.mode === 'mat' ? 2.8 * z + 1.5 : 2.45 * z));
  };
  for (const [id, m] of Object.entries(s.marks || {})) one(s.as?.[id], m);
  for (const pos of s.pos || []) for (const [id, m] of Object.entries(pos)) one(s.as?.[id], m);
  for (const d of [s.donStand, ...Object.values(s.localAt || {})].filter(Boolean)) add(d[1], d[1] - 2.25 * z);
  if (s.matAt) add(s.matAt[1] + 1, s.matAt[1] - 2.45 * z);
  // the rest of the race behind them: smaller, but just as clear of the bar
  const zc = s.crowdSize || z * CROWD_SCALE;
  for (const c of s.crowd || []) for (const p of c.pos) if (p && p[0] > -2 && p[0] < 102) {
    if (c.as === 'swim' || c.as === 'dive') add(p[1] + 1.2 * zc, p[1] - 0.9 * zc);
    else if (c.as === 'ride') add(p[1] + 0.5 * zc, p[1] - 2.8 * zc);
    else add(p[1], p[1] - 2.45 * zc);
  }
  return { bottom, top };
}
export const crowdAt = (s, k) => (s.crowd || []).map(c => ({ ...c, pos: [c.pos[k]] }));
// the lift again once the crowd is on the plate (a climb is lifted step by step, with the crowd as it is then)
function relift(s) {
  // the shot is framed for the teams it is about; the crowd fits in it or is out of it
  const own = { ...s, crowd: null };
  s.lift = liftFor(own);
  delete s.liftAt;
  if (s.pos && extentOf(own).bottom - s.lift > 100 - BAR) s.liftAt = s.pos.map(pos => liftFor({ ...own, marks: {}, pos: [pos] }));
  // a crowd team that the shot cannot hold above the bar (the bottom of a climb while the team is at the top) is out of the shot
  let dropped = false;
  for (const c of s.crowd || []) c.pos.forEach((p, k) => {
    if (!p) return;
    const L = s.liftAt ? s.liftAt[k] : s.lift;
    const one = extentOf({ size: s.size, crowdSize: s.crowdSize, crowd: [{ ...c, pos: [p] }] });
    if (one.bottom - L > 100 - BAR || one.top - L < 1.9) { c.pos[k] = null; c.st[k] = 'off'; dropped = true; }
  });
  if (dropped) { s.crowd = s.crowd.filter(c => c.pos.some(Boolean)); if (!s.crowd.length) delete s.crowd; }
}
function liftFor(s) {
  const { bottom, top } = extentOf(s);
  if (!bottom) return 0;
  const need = bottom + 3 - (100 - BAR);           // (+3: the plate's slow push moves the bottom out a little, DRIFT)
  return Math.round(Math.max(0, Math.min(need, top - 2)) * 10) / 10;
}

// ── the rest of the race: the teams the log puts at this stretch at this moment, doing the same thing ──
// The user (2026-10-19), first: "we dont see them at the same zone running is part of the charm"; then: "if they are
// alone they are alone but even in close space we have people running around should they even be at this part of the
// leg? also they are people but they never interact". So the background has a reason or it is empty:
//   * only in an open space (a task area, a road, the Chill Zone): never an elevator, a plane, a cab, a stairwell,
//     a small room or a close-up (closedShot; a plate says `closed: true`);
//   * only the teams the leg's log (leg.log) has at this stretch in the minutes the shot covers: a team the log has
//     alone is alone;
//   * doing what the team in the shot is doing, at their own attempt from the task log (state.taskLog): on the
//     task's path (a climb, a swim, a ride) or at its work (digging, eating, shearing) on the plate the task is done
//     on. A conversation at a task whose work happens elsewhere has nobody behind it; on a road, a team may pass
//     through once;
//   * two teams at most (the start line, where every team is, is the one exception), never a team in the scene;
//   * reacting to a big moment in front: a glance, a cheer, a wince (planCrowdReact).
// At the Chill Zone the teams already checked in on screen wait to one side; never a rank on the crowd.
// (batch 1 of the 46 places, 2026-10-19: sculpting sand, chipping ice, a hand in a mitten of ants, sewing a costume,
// the beam and the vault; a swing on a vine, a coffin pushed)
// (batch 2: a squeegee on the glass, a tennis serve, a spoon at a cell wall; over the hot coals in grass skirts)
const IN_PLACE = new Set(['search', 'eat', 'draw', 'sweat', 'guitar', 'photo', 'bob', 'chase', 'build', 'shear', 'bungee', 'sculpt', 'chip', 'mitten', 'sew', 'beam',
  'squeegee', 'serve', 'spoon',
  // (batch 3: the war dance, the mechanical bull, rings at a narwhal, sawing ice for an igloo, a vial of dragon drool)
  'dance', 'bull', 'toss', 'saw', 'venom',
  // (batch 4: a buggy driven by remote, the lever that opens the lion's cage)
  'remote', 'lever',
  // (batch 5: tea picked into a basket)
  'pick',
  // (batch 7: wrestling in the ring)
  'wrestle']);
const LEAPS = /\b(jumps?|leaps?|drops?|dives?|steps off)\b/i;
const PATH_MODES = new Set(['climb', 'walk', 'hop', 'run', 'zip', 'para', 'swim', 'dive', 'ride', 'swing', 'push', 'coals', 'roll']);
const TASK_KINDS = new Set(['either', 'botch', 'allin', 'route', 'superteam']);
export const MAX_CROWD = 2;
export const CROWD_SCALE = 0.7;

/** A shot nobody else could be in: a closed space, a vehicle's inside, the airport, a close-up plate. */
export function closedShot(s) {
  if (!s || s.kind !== 'world' || !s.plate) return true;
  if (['cabin', 'narrate', 'landing', 'flight'].includes(s.mode)) return true;
  if (s.plate.race || s.plate.closed) return true;
  if (['airport', 'board', 'speed-bump', 'zip'].includes(s.stretch)) return true;
  return false;
}

// Where a team is in its run at a task at time tk: progress p (0..1 along the task), and what it is doing.
// Every failed attempt climbs part of the way and slips back; the last one goes all the way (or is a quit).
export function attemptAt(row, tk) {
  const span = Math.max(1, row.to - row.from);
  const f = Math.max(0, Math.min(1, (tk - row.from) / span));
  const A = Math.max(1, row.attempts || 1);
  if (A === 1 && !row.quit) return { f, p: 0.1 + 0.9 * f, st: f > 0.92 ? 'done' : 'try' };
  const x = Math.min(A - 1e-6, f * A), a = Math.floor(x), u = x - a;
  if (a < A - 1) return { f, p: 0.12 + 0.55 * u, st: u > 0.78 ? 'fail' : 'try' };
  if (row.quit) return { f, p: 0.12 + 0.3 * u, st: u > 0.85 ? 'quit' : 'try' };
  return { f, p: 0.12 + 0.88 * u, st: u > 0.9 ? 'done' : 'try' };
}

const groundTop = plate => (Array.isArray(plate.g) ? Math.min(...plate.g) : plate.g);
// n free places on the ground, as far as possible from where the shot's own people stand
// `avoid`: [x, half-width] of everybody already there; a crowd token needs its own width clear of each of them
// `pack`: how far a token may tuck behind another, as a share of a third of its half-width (0.2: barely touching)
function freeSpots(plate, n, avoid, half, pack = 0.2, margin = 0) {
  if (plate.spots?.length) {
    const free = plate.spots.filter(sp => !avoid.some(([a, h]) => Math.abs(a - sp[0]) < (h + half) * 0.97));
    return free.slice(0, n).map(sp => [sp[0], sp[1]]);
  }
  const x0 = Math.max(plate.x[0], half * 1.08 + EDGE + 0.7, margin), x1 = Math.min(plate.x[1], 100 - Math.max(half * 1.08 + EDGE + 0.7, margin));
  if (x1 <= x0) return [];
  const out = [], taken = [...avoid];
  for (let i = 0; i < n; i++) {
    let best = null, bestD = -Infinity;
    for (let x = x0; x <= x1; x += 0.5) {
      // the clearance left between this token's edge and the nearest other's
      const d = taken.length ? Math.min(...taken.map(([a, h]) => Math.abs(a - x) - h - half)) : 50;
      if (d > bestD) { bestD = d; best = x; }
    }
    if (best == null || bestD < -half * 0.35 * pack) break;
    taken.push([best, half]); out.push([Math.round(best * 10) / 10, groundTop(plate)]);
  }
  return out;
}

function planCrowd(s, ctx) {
  const ps = s.steps.length;
  const z = (s.size || 8) * CROWD_SCALE, half = z * 0.775;
  const fz = (s.size || 8) * 0.8;
  const fgX = Object.values(s.marks || {}).map(m => [m[0], fz]).concat([s.donStand, s.boxAt, ...Object.values(s.localAt || {})].filter(Boolean).map(m => [m[0], fz * 0.7]))
    .concat(s.matAt ? [[s.matAt[0], (s.size || 8) * 1.4]] : [])
    // the work's cut-out and its judge: nobody behind the shot stands in front of them
    .concat([s.workProp, s.judgeAt].filter(p => p && !(p === s.workProp && s.plate?.under)).map(p => [p.at[0], p.w / 2]));
  if (closedShot(s)) return;
  // everybody in the scene is in front of it: a team that talks or is part of it is never an extra
  const inScene = new Set([...s.teams, ...(s.who || []).map(n => ctx.teamOf?.[n]).filter(Boolean),
    ...s.steps.map(x => (x.by ? ctx.teamOf?.[x.by] : null)).filter(Boolean)]);
  // the premiere: every team at the start line in front of Don, and each team arriving finds the ones before it waiting
  const lineUp = (ids, zz, work = 'wait') => {
    // side by side, never one on another: smaller until they all fit (the start line holds every team)
    let spots = freeSpots(s.plate, ids.length, fgX, zz * 0.8);
    while (spots.length < ids.length && zz > 3) { zz = Math.max(3, zz * 0.92); spots = freeSpots(s.plate, ids.length, fgX, zz * 0.8); }
    if (!spots.length) return;
    spots.sort((a, b) => a[0] - b[0]);
    ids = ids.slice(0, spots.length);
    s.crowdSize = zz;
    s.crowd = spots.map((at, i) => ({ team: ids[i], as: 'stand', work, pos: s.steps.map(() => at), st: s.steps.map(() => work) }));
  };
  if (s.seg === 'don-opener' && ctx.first && standable(s.plate)) {
    const ids = ctx.racing.filter(id => !inScene.has(id));
    const span = Math.max(20, s.plate.x[1] - s.plate.x[0] - 8 - (s.donStand ? 12 : 0));
    lineUp(ids, Math.max(3.6, Math.min(z, span / (ids.length * 1.25))));
    return;
  }
  if (s.seg === 'team-intro' && standable(s.plate)) {
    // the two teams that arrived just before, waiting
    const ids = ctx.introduced.filter(id => !inScene.has(id)).slice(-MAX_CROWD);
    if (ids.length) lineUp(ids, z);
    return;
  }
  if (s.mode === 'mat') {
    if (!standable(s.plate)) return;
    // the teams checked in just before, at the side of the Chill Zone
    const done = [...ctx.aired].filter(id => !inScene.has(id)).slice(-MAX_CROWD);
    if (done.length) lineUp(done, z, 'chill');
    return;
  }
  if (!s.stretch || ['mat', 'midmat'].includes(s.stretch) || s.t == null || s.t < 0 || ctx.t1 == null || s.replay) return;
  if (['don', 'demo'].includes(s.mode)) return;
  // a shot for one team alone (the condor's nest up in the sky: nobody else is up there)
  if (s.plate?.crowd === false) return;
  s.crowdWin = [s.t, ctx.t1];
  const plate = s.plate;
  const stretch = ctx.place?.stretches.find(x => x.id === s.stretch) || null;
  const task = !!stretch && TASK_KINDS.has(stretch.kind);
  const sps = stretchPlates(s.place, s.stretch, s.side);
  // (on the action itself, the plate IS the action plate: a team's own angle, or a cut-out swapped in)
  const actPlate = s.mode === 'act' ? plate : (sps?.act2 && sps.act2.f === plate.f ? sps.act2 : sps?.act) || null;
  const act = s.mode === 'act' && plate.path && PATH_MODES.has(plate.mode) ? plate.mode : null;
  const work = s.work || actPlate?.mode || null;
  // what the teams behind can be doing in this picture
  let how = null;
  if (act) how = 'path';
  else if (IN_PLACE.has(work) && standable(plate) && (s.mode === 'act' || (actPlate && actPlate.f === plate.f))) how = 'work';
  else if (!task && standable(plate) && !s.plate.water) how = 'pass';
  if (!how) return;
  const T = Array.from({ length: ps }, (_, k) => s.t + (ctx.t1 - s.t) * (ps > 1 ? k / (ps - 1) : 0));
  const seen = new Set();
  const here = ctx.rows.filter(r => r.stretch === s.stretch && !inScene.has(r.id) && r.from <= ctx.t1 + 0.5 && r.to >= s.t - 0.5)
    .map(r => ({ r, tr: ctx.tries.find(x => x.team === r.id && x.stretch === s.stretch && x.from <= r.to + 0.5 && x.to >= r.from - 0.5) || null }))
    // an Either: only the teams on this side of it are in this picture
    .filter(({ tr }) => !s.side || stretch?.kind !== 'either' || !tr || !tr.side || tr.side === s.side)
    .sort((a, b) => Math.abs(Math.max(a.r.from, s.t) - s.t) - Math.abs(Math.max(b.r.from, s.t) - s.t))
    .filter(({ r }) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .slice(0, how === 'pass' ? 1 : MAX_CROWD);
  if (!here.length) return;
  const within = (r, tk) => tk >= r.from - 1 && tk <= r.to + 1;
  s.crowdSize = z;
  s.crowdT = T.map(t => Math.round(t * 10) / 10);
  const M = Math.max(z * 0.95 + 1, z * 0.86 + EDGE + 0.7);
  const fgRow = ctx.rows.find(r => r.id === s.teams[0] && r.stretch === s.stretch);
  s.crowd = [];
  here.forEach(({ r, tr }, i) => {
    const row = tr || { from: r.from, to: r.to, attempts: 1 };
    const pos = [], sts = [];
    let at = null;
    if (how === 'work') {
      at = freeSpots(plate, 1, fgX.concat(s.crowd.map(c => c.pos.find(Boolean)).filter(Boolean).map(p => [p[0], half])), half)[0] || null;
      if (!at) return;                       // no room at the task: not in this picture (never running round it instead)
    }
    T.forEach((tk, k) => {
      if (!within(r, tk)) { pos.push(null); sts.push(tk < r.from ? 'away' : 'gone'); return; }
      const a = attemptAt(row, tk);
      if (act === 'ride') {
        const ff = fgRow ? Math.max(0, Math.min(1, (tk - fgRow.from) / Math.max(1, fgRow.to - fgRow.from))) : 0.5;
        let x = 50 + (a.f - ff) * 150;
        // never on top of the team the shot is about: level with them means beside them
        if (Math.abs(x - 50) < 16) x = 50 + (x < 50 || (x === 50 && i % 2) ? -16 - 7 * (i >> 1) : 16 + 7 * (i >> 1));
        x = Math.max(-18, Math.min(118, x));
        const y = (pathAt(plate.path, 0.5)[1]) - 5 - (i % 2) * 3;
        pos.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]); sts.push('ride');
      } else if (act) {
        let pt = pathAt(plate.path, a.p);
        if (act === 'hop') pt = [...plate.path[Math.round(a.p * (plate.path.length - 1))]];
        if (act === 'swim' || act === 'dive') {
          // in the water beside the team the shot is about, never on top of its heads
          const fg = s.pos?.[k]?.[s.teams[0]], lo = M, hi = 100 - M - z;
          let x = pt[0] + (i % 2 ? 9 : -9);
          if (fg && Math.abs(x - fg[0]) < 14) x = fg[0] + (x >= fg[0] ? 14 : -14) + (i >> 1) * (x >= fg[0] ? 8 : -8);
          if (x < lo || x > hi) x = fg ? fg[0] + (x < lo ? 14 : -14) : Math.min(hi, Math.max(lo, x));
          pt = [Math.min(hi, Math.max(lo, x)), Math.min(100 - 1.2 * z - 2, pt[1] - 4 - 2 * i)];
        }
        else if (act === 'hop') pt = [pt[0] + (i % 2 ? 2.5 : -2.5), pt[1]];
        else pt = [Math.min(100 - M, Math.max(M, pt[0] + (i % 2 ? 6 : -6))), Math.max(z * 2.35 + 7, pt[1])];
        pos.push([Math.round(pt[0] * 10) / 10, Math.round(pt[1] * 10) / 10]); sts.push(a.st);
      } else if (how === 'work') {
        pos.push(at); sts.push(a.st);
      } else { pos.push('run'); sts.push('run'); }
    });
    // a team on the road passes through once: in at one side of the ground, out at the other, over up to three steps
    if (pos.includes('run')) {
      const ks = pos.map((p, k) => (p === 'run' ? k : -1)).filter(k => k >= 0);
      const start = ks[0];
      const span = ks.filter(k => k >= start).slice(0, 3);
      const gx0 = Math.max(plate.x[0], half + EDGE + 0.3), gx1 = Math.min(plate.x[1], 100 - half - EDGE - 0.3);
      const ltr = true;
      const fr = span.length === 1 ? [0.5] : span.length === 2 ? [0.25, 0.75] : [0.12, 0.5, 0.88];
      pos.forEach((p, k) => {
        if (p !== 'run') return;
        const j = span.indexOf(k);
        if (j < 0) { pos[k] = null; sts[k] = k < start ? 'away' : 'gone'; return; }
        const f = ltr ? fr[j] : 1 - fr[j];
        pos[k] = [Math.round((gx0 + (gx1 - gx0) * f) * 10) / 10, groundTop(plate)];
      });
    }
    if (!pos.some(Boolean)) return;
    const as = act || (how === 'pass' ? 'run' : 'stand');
    s.crowd.push({ team: r.id, as, work: how === 'work' ? work : null, pos, st: sts, ltr: true, row: { from: r.from, to: r.to } });
  });
  if (!s.crowd.length) { delete s.crowd; delete s.crowdT; }
}

// ── the background sees the big moments in front: a glance, a cheer, a wince ──
function planCrowdReact(s) {
  if (!s.crowd?.length) return;
  const last = s.steps.length - 1;
  s.steps.forEach((st, k) => {
    if (!s.crowd.some(c => c.pos[k] && c.st[k] !== 'gone')) return;
    let how = null;
    if (st.slam) how = st.slam.cls === 'gold' ? 'cheer' : 'wince';
    else if (st.rank && !st.rank.out) how = st.rank.place === 1 ? 'cheer' : 'glance';
    else if (s.plan?.fail === k || s.plan?.quit === k) how = 'wince';
    else if (k === last && s.seg === 'task-done') how = 'glance';
    else if (k === s.exitAt) how = 'glance';
    else if (s.leaveAt?.[k]) how = 'glance';
    else if (st.react && ['jump', 'shake'].includes(st.react.how) && st.part !== 'conf' && k % 3 === 0) how = 'glance';
    if (how) st.crowdReact = how;
  });
}

// ── how the teams come in: at a run, the first time the episode sees them at a stretch ──
function planEnter(s, screens, si) {
  // Don's GO at the start line: on his last line, if it is the GO, the teams sprint off
  if (s.mode === 'don' && (s.teams.length || s.crowd?.length)) {
    const last = s.steps.length - 1;
    if (last > 0 && s.steps[last].by === 'Don' && /\bgo\b|\brace\b|\brun\b/i.test(s.steps[last].text || '')) s.exitAt = last;
  }
  // the premiere: each team runs in to the start line
  if (s.seg === 'team-intro' && !s.replay) { s.enter = Object.fromEntries(s.teams.filter(id => s.marks?.[id]).map(id => [id, 'left'])); return; }
  if (!s.stretch || s.mode === 'mat' || s.mode === 'cabin' || s.mode === 'act' || s.replay) return;
  const before = screens.slice(0, si).filter(x => x.stretch === s.stretch && x.kind === 'world');
  s.enter = {};
  s.teams.forEach((id, i) => { if (!before.some(x => x.teams.includes(id)) && s.marks?.[id]) s.enter[id] = s.marks[id][0] > 50 ? 'right' : 'left'; void i; });
  if (!Object.keys(s.enter).length) delete s.enter;
}

// ── exits: a stage direction that sends people away takes them off the stage ──
// The user (2026-10-19): "it says x and y are gone but theyre still on the screen". A beat whose subject is named
// people (or a team by its name) followed by a leaving verb ("are gone", "run off", "walk away", "leaves.", "are out
// of there", "storm off", "disappear") walks them off at that step; they stay off until a later line brings them
// back: their own line, or a beat with them coming back. A subject has to open its clause ("Before Bruno leaves"
// is nobody leaving), and "leave" counts only on its own or on its way out ("Kai leaves a note" is not a departure).
const rx = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const GO_VERBS = 'run|runs|ran|race|races|raced|sprint|sprints|sprinted|dash|dashes|dashed|hurry|hurries|hurried|rush|rushes|rushed|storm|storms|stormed|stomp|stomps|stomped|walk|walks|walked|head|heads|headed|bolt|bolts|bolted|peel|peels|peeled|stalk|stalks|stalked|march|marches|marched|wander|wanders|wandered|zoom|zooms|zoomed|speed|speeds|sped|tear|tears|tore|drive|drives|drove|limp|limps|limped|scramble|scrambles|scrambled|scurry|scurries|scurried|flee|flees|fled|jog|jogs|jogged|stride|strides|strode|slip|slips|slipped|charge|charges|charged';
const LEAVE_RE = `(?:(?:are|is|were|was)\\s+(?:already\\s+|long\\s+|both\\s+|all\\s+)?(?:gone|out\\s+of\\s+(?:there|here|sight)|out\\s+the\\s+door|off(?=[\\s.,!;?]|$)|away\\b)`
  + `|(?:${GO_VERBS})\\s+(?:off|away|out(?!\\s+of\\b))\\b`
  + `|(?:take|takes|took|set|sets|push|pushes|pushed)\\s+off\\b`
  + `|(?:clear|clears|cleared)\\s+out\\b`
  + `|(?:disappear|disappears|disappeared|vanish|vanishes|vanished)\\b`
  + `|(?:leave|leaves|left)(?=\\s*(?:[.,;!?]|$)|\\s+(?:without|together|first|at\\s+a|in\\s+a|the\\s+(?:mat|room|scene|shop|stall|market|square|station|platform|dock|beach|stage|car|cab|bench|others|rest))))`;
const BACK_RE = `(?:(?:come|comes|came|run|runs|ran|race|races|raced|hurry|hurries|hurried|rush|rushes|rushed|walk|walks|walked|sprint|sprints|sprinted|stomp|stomps|stomped|jog|jogs|jogged|double|doubles|doubled|head|heads|headed)\\s+back\\b`
  + `|(?:return|returns|returned|rejoin|rejoins|rejoined|reappear|reappears|reappeared)\\b|(?:are|is|were|was)\\s+back\\b)`;
function subjectRe(names, teamNames, verbs) {
  const alts = [...names.map(rx), ...Object.values(teamNames).map(n => `(?:the\\s+)?${rx(n)}`)].sort((a, b) => b.length - a.length);
  if (!alts.length) return null;
  const NAME = `(?:${alts.join('|')})`;
  const SUBJ = `(${NAME}(?:\\s*(?:,\\s*(?:and\\s+)?|\\s+and\\s+|\\s*&\\s*)${NAME})*)`;
  const ADV = '(?:\\s+(?:both|then|just|already|quickly|promptly|finally|simply|immediately|soon|all))*';
  return new RegExp(`(?:^|[.!?;:\\u2014\\u2013]\\s*|,\\s*|\\b(?:and\\s+then|then|so)\\s+)${SUBJ}${ADV}\\s+${verbs}`, 'gi');
}
function subjectsOf(re, text, names, teamNames) {
  const out = [];
  if (!re) return out;
  const byName = new Map(names.map(n => [n.toLowerCase(), n]));
  const byTeam = new Map(Object.entries(teamNames).map(([id, n]) => [n.toLowerCase(), id]));
  for (const m of String(text || '').matchAll(re)) {
    const subj = m[1].replace(/^the\s+/i, '');
    // the names in the subject, longest first so a team's name is not read as one of its words
    const parts = [...byTeam.keys(), ...byName.keys()].sort((a, b) => b.length - a.length);
    let rest = subj.toLowerCase();
    const found = [];
    for (const p of parts) {
      let i = rest.indexOf(p);
      while (i >= 0) { found.push([i, p]); rest = rest.slice(0, i) + ' '.repeat(p.length) + rest.slice(i + p.length); i = rest.indexOf(p); }
    }
    found.sort((a, b) => a[0] - b[0]).forEach(([, p]) => { const v = byTeam.get(p) || byName.get(p); if (v && !out.includes(v)) out.push(v); });
  }
  return out;
}
/** Who a stage direction sends away: people's names, or team ids for a team named by its name. */
export function exitsIn(text, names, teamNames = {}) {
  return subjectsOf(subjectRe(names, teamNames, LEAVE_RE), text, names, teamNames);
}
/** Who a stage direction brings back. */
export function returnsIn(text, names, teamNames = {}) {
  return subjectsOf(subjectRe(names, teamNames, BACK_RE), text, names, teamNames);
}
/** Is team `id` on the stage at step k (a partner who walked off alone leaves the other one there)? */
export function onStage(s, id, k) { return s.offAt?.[k]?.[id] !== 'team'; }
/** Who of team `id` is off at step k: 'team', a list of names, or nothing. */
export const offOf = (s, id, k) => s.offAt?.[k]?.[id] || null;

export function planExits(s, { teamNames = {} } = {}) {
  const members = s.members || {};
  const names = s.teams.flatMap(id => members[id] || []);
  const tn = Object.fromEntries(s.teams.filter(id => teamNames[id]).map(id => [id, teamNames[id]]));
  const teamOfName = n => s.teams.find(id => (members[id] || []).includes(n)) || null;
  const off = {};                         // id -> 'team' | Set(names)
  const offAt = [], leaveAt = {}, backAt = {};
  let any = false;
  const goes = (id, who, k) => {
    const pair = members[id] || [];
    const cur = off[id];
    if (cur === 'team') return;
    const set = new Set(cur || []);
    (who === 'team' ? pair : who).forEach(n => set.add(n));
    off[id] = pair.every(n => set.has(n)) ? 'team' : set;
    (leaveAt[k] ||= []).includes(id) || leaveAt[k].push(id);
    any = true;
  };
  const comes = (id, who, k) => {
    const cur = off[id];
    if (!cur) return;
    if (who === 'team' || cur === 'team') delete off[id];
    else { who.forEach(n => cur.delete(n)); if (!cur.size) delete off[id]; }
    (backAt[k] ||= []).includes(id) || backAt[k].push(id);
  };
  s.steps.forEach((st, k) => {
    // whoever speaks is back with that line (nobody talks from off the stage)
    if (st.by && st.team && off[st.team]) comes(st.team, off[st.team] === 'team' ? 'team' : [st.by], k);
    if (st.part === 'beat' && st.text) {
      for (const x of returnsIn(st.text, names, tn)) { const id = tn[x] ? x : teamOfName(x); if (id) comes(id, tn[x] ? 'team' : [x], k); }
      for (const x of exitsIn(st.text, names, tn)) { const id = tn[x] ? x : teamOfName(x); if (id) goes(id, tn[x] ? 'team' : [x], k); }
    }
    offAt.push(Object.fromEntries(Object.entries(off).map(([id, v]) => [id, v === 'team' ? 'team' : [...v]])));
  });
  if (!any) { delete s.offAt; delete s.leaveAt; delete s.backAt; return s; }
  s.offAt = offAt; s.leaveAt = leaveAt; s.backAt = backAt;
  return s;
}

// ── who reacts to a line: the partner, or the other team in the shot ──
const EXCITED = /\b(yes|yay|woo+|amazing|awesome|love|best|won|win|first|go go|let's go|we did it)\b|!{1,}$/i;
const UPSET = /\b(no|not|never|ugh|stop|seriously|hate|wrong|lost|worst|kill|idiot|shut up|ow|gross|eww?)\b/i;
const FUNNY = /\b(ha(ha)+|lol|joke|funny|kidding)\b/i;
export function reactionTo(text) {
  const t = String(text || '');
  if (FUNNY.test(t)) return 'laugh';
  if (UPSET.test(t) && /[!?]/.test(t)) return 'shake';
  if (EXCITED.test(t)) return 'jump';
  if (/\?\s*$/.test(t)) return 'tilt';
  return 'nod';
}
function planReact(s, teamOf, membersOf) {
  let lastTeam = null;
  s.steps.forEach((st, k) => {
    if (st.by === 'Don') {
      const team = st.rank?.team ?? st.focus ?? null;
      if (team && st.rank) st.react = { team, how: st.rank.out ? 'slump' : st.rank.place <= 3 ? 'jump' : 'nod' };
      else if (st.slam?.cls === 'gold' && team) st.react = { team, how: 'jump' };
      else if (st.slam?.cls === 'red' && (s.arriving?.[0] || s.teams[0])) st.react = { team: s.arriving?.[0] || s.teams[0], how: 'shake' };
      return;
    }
    const team = st.by ? teamOf[st.by] : null;
    if (!team || st.part === 'conf' || st.part === 'beat') return;
    const how = reactionTo(st.text);
    // an ordinary line gets a nod on every other click; a loud one always gets its reaction
    if (how === 'nod' && k % 2) { lastTeam = team; return; }
    const next = s.steps.slice(k + 1).find(x => x.by && teamOf[x.by] && teamOf[x.by] !== team);
    const here = id => s.teams.includes(id) && onStage(s, id, k);
    const other = (lastTeam && lastTeam !== team && here(lastTeam)) ? lastTeam : next && here(teamOf[next.by]) ? teamOf[next.by] : null;
    if (other) st.react = { team: other, how };
    else {
      const partner = membersOf(team).find(n => n !== st.by && !(offOf(s, team, k) || []).includes?.(n));
      if (partner && here(team)) st.react = { team, who: partner, how };
    }
    lastTeam = team;
  });
}

// ── the confessional: the one not talking listens, and it shows (a nod, a laugh, a tilt, a shake) ──
function planIvReact(s) {
  if (s.solo || s.people?.length !== 2) return;
  s.steps.forEach((st, k) => {
    if (!st.by || !s.people.includes(st.by)) return;
    const how = reactionTo(st.text);
    if (how === 'nod' && k % 2) return;
    st.react = { team: s.team, who: s.people.find(n => n !== st.by), how };
  });
}

// ── the camera: wide for the action, in where a line earns it, and held ──
// A shot is { shot, on, s, x, y }: `s` the zoom, (x, y) the world point at the frame's top-left (in % of the
// plate), chosen so that everybody it is ON is inside the frame and above the dialogue bar. Wide is the whole
// plate, lifted by the screen's lift so the bar covers nobody. The rules (spec §9.3; the user, 2026-10-19):
//   * wide on a scene's first line, on a stage direction, on the Don Box, on an arrival montage;
//   * in on a punchline, a short loud reply, Don's dig: the speaker's whole team in the frame;
//   * Don's pause before a placement is a push-in on the team, and a slam a quick push-in;
//   * a climb or a jump is followed;
//   * a shot holds for at least two lines unless the next speaker is out of it (nobody talks from off screen).
const MIN_HOLD = 2;
const PUNCH = /[!?]\s*$|!\s|\.\.\.|—|\b(no|what|ugh|seriously|wow|great|perfect|never|love|hate|dead|kill|run|go)\b/i;
const FOLLOW = new Set(['climb', 'zip', 'para', 'swing']);
export function boxOf(s, who, k) {
  const z = s.size || 8;
  if (s.offAt && s.teams?.includes(who) && !onStage(s, who, k)) return null;     // walked off
  if (who === 'Don') { const d = s.donStand; return d ? [d[0] - 0.56 * z - 0.4, d[1] - 2.35 * z - 1.9, d[0] + 0.56 * z + 0.4, d[1]] : null; }
  if (s.localAt?.[who]) { const d = s.localAt[who]; return [d[0] - 0.5 * z - 0.4, d[1] - 2.1 * z - 1.9, d[0] + 0.5 * z + 0.4, d[1]]; }
  const at = s.pos?.[k]?.[who] || (s.hiddenUntil?.[who] != null && k === s.hiddenUntil[who] ? s.matAt : null) || s.marks?.[who];
  if (!at) return null;
  const as = s.as?.[who];
  if (as === 'swim' || as === 'dive') { const gap = Math.max(5, z * 0.95); const n = s.swimmers?.[who]?.length || 1; return [at[0] - 0.6 * z, at[1] - 1.2 * z - 1.9, at[0] + (n - 1) * gap + 0.6 * z, at[1] + 1.25 * z]; }
  if (as === 'ride') return [at[0] - 1.3 * z, at[1] - 2.9 * z - 1.9, at[0] + 1.3 * z, at[1] + 0.6 * z];
  // at the Chill Zone a placed team wears its rank above its heads (style.js .tok .rank): the frame holds it too
  // (with the face's own bounce, padOf: a talking face jumps and leans)
  return [at[0] - 0.86 * z - 0.3, at[1] - (s.mode === 'mat' ? 2.8 * z + 1.9 : 2.52 * z + 1.9), at[0] + 0.86 * z + 0.3, at[1] + 0.3];
}
export function inView(cam, b, bar = BAR) {
  if (!b) return true;
  // what the shot holds whatever the plate's slow push is doing (DRIFT)
  const r = safeRect(viewRect(cam, bar));
  return b[0] >= r[0] - 0.05 && b[2] <= r[2] + 0.05 && b[1] >= r[1] - 0.05 && b[3] <= r[3] + 0.05;
}
// Everybody the scene is about at step k (its teams, Don, a local): a shot holds them all whole, or it is wider. Only
// the teams behind it (the crowd) may fade out of a close-up (the user, 2026-10-19: never hide a scene team).
export function sceneOf(s, k) {
  const out = s.teams.filter(id => boxOf(s, id, k));
  if (s.don && s.donStand) out.push('Don');
  for (const nm of Object.keys(s.localAt || {})) out.push(nm);
  return out;
}
export const holdsAll = (cam, s, k) => sceneOf(s, k).every(w => inView(cam, boxOf(s, w, k)));
function frameOn(s, k, who, maxS, shot) {
  // the subject, and everybody else in the scene with it: a close-up that would cut one of them is a wider shot
  const all = [...new Set([...who, ...sceneOf(s, k)])];
  if (all.length > who.length && shot === 'close') shot = 'two';
  who = all;
  const boxes = who.map(w => boxOf(s, w, k)).filter(Boolean);
  if (!boxes.length) return null;
  // the margins hold the plate's slow push (DRIFT) and a talking bounce
  const z = s.size || 8, mx = 3.3, mt = 3.4, mb = 3.2;          // boxOf has the bounce; these hold the DRIFT
  const b = [Math.min(...boxes.map(x => x[0])) - mx, Math.min(...boxes.map(x => x[1])) - mt, Math.max(...boxes.map(x => x[2])) + mx, Math.max(...boxes.map(x => x[3])) + mb];
  const w = b[2] - b[0], h = b[3] - b[1];
  let sc = Math.min(maxS, 100 / (w * 1.15), (100 - BAR) / (h * 1.12));
  if (sc < 1.12) return null;
  sc = Math.round(sc * 100) / 100;
  const vw = 100 / sc, vh = (100 - BAR) / sc;
  let x = (b[0] + b[2]) / 2 - vw / 2;
  x = Math.max(0, Math.min(100 - vw, x));
  let y = b[3] - vh + (vh - h) * 0.35;            // the faces a little above the middle of the space over the bar
  y = Math.max(0, Math.min(100 - vh, Math.min(y, b[1])));
  // a subject the frame cannot hold whole above the bar gets no close-up (the shot stays wide)
  if (b[1] < y - 0.3 || b[3] > y + vh + 0.3 || b[0] < x - 0.3 || b[2] > x + vw + 0.3) return null;
  // slide along (the subject still whole) to where the frame's edge cuts the fewest of the others: the ones it still
  // cuts fade out of the shot (planHide)
  const mine = new Set(who.map(keyOf(s)));
  const others = facesAt(s, k).filter(f => !mine.has(f.key));
  if (others.length) {
    const lo = Math.max(0, b[2] - vw), hi = Math.min(100 - vw, b[0]);
    const cost = cx => {
      const r = [cx, y, cx + vw, y + vh];
      let c = Math.abs(cx - x) * 0.01;
      for (const f of others) if (meets(f.box, r) && !inRect(f.box, r, 0)) c += f.kind === 'crowd' ? 1 : 3;
      return c;
    };
    let best = x, bc = cost(x);
    for (let cx = lo; cx <= hi + 1e-6; cx += 0.5) { const c = cost(cx); if (c < bc - 1e-9) { bc = c; best = cx; } }
    x = best;
  }
  const r = (v, max) => Math.min(Math.floor(max * 100) / 100, Math.round(v * 10) / 10);
  return { shot, on: who, s: sc, x: r(x, 100 - vw), y: r(y, 100 - vh) };
}
// the facesAt key of a camera subject (a team id, Don, a local's name)
const keyOf = s => w => (w === 'Don' || s.localAt?.[w] ? 'p:' + w : 't:' + w);

// ── nobody is cut by the frame: whoever a shot cannot hold whole fades out of it ──
// The user (2026-10-19): "close-ups crop the crowd". A close-up or a two-shot frames its subjects whole; anybody else
// it would cut at its edge, or leave behind the dialogue bar, fades out while the camera is in and back when it pulls
// out (st.hide: facesAt keys). A wide shot hides only what it cannot hold (a rider half in at the side). A speaker is
// never hidden (the camera always holds the one talking); a reaction by somebody hidden is not played.
export function planHide(s) {
  s.steps.forEach((st, k) => {
    delete st.hide;
    if (!st.cam) return;
    const r = safeRect(viewRect(st.cam));
    const hide = new Set();
    // only the teams behind the scene: a team in it (or Don, or a local) is never faded (the camera holds them all)
    for (const f of facesAt(s, k)) if (f.kind === 'crowd' && !inRect(padOf(f, f.z), r, 0)) hide.add(f.key);
    const sp = st.by === 'Don' ? 'p:Don' : st.team ? 't:' + st.team : st.by && s.localAt?.[st.by] ? 'p:' + st.by : null;
    if (sp) hide.delete(sp);
    if (hide.size) st.hide = [...hide];
    if (st.react && !st.react.who && hide.has('t:' + st.react.team)) delete st.react;
    if (st.react?.who && hide.has('t:' + st.react.team)) delete st.react;
  });
}
function planCamera(s) {
  const steps = s.steps;
  const wideAt = k => ({ shot: 'wide', on: [], s: 1, x: 0, y: (s.liftAt ? s.liftAt[k] : s.lift) || 0 });
  const speakerOf = st => (st.part === 'pause' ? null : st.by === 'Don' ? (s.donStand ? 'Don' : null) : st.team && s.teams.includes(st.team) ? st.team : st.by && s.localAt?.[st.by] ? st.by : null);
  const want = k => {
    const st = steps[k], prev = steps[k - 1];
    const sp = speakerOf(st);
    const focus = st.rank?.team ?? st.focus ?? null;
    if (st.part === 'pause' && focus != null) return { ...(frameOn(s, k, [focus], 1.6, 'close') || wideAt(k)), force: true };
    if (st.slam && (focus ?? s.arriving?.[0]) != null) return { ...(frameOn(s, k, [focus ?? s.arriving[0]], 1.35, 'close') || wideAt(k)), force: true };
    if (st.rank && s.donStand) return frameOn(s, k, ['Don', st.rank.team], 1.4, 'two') || wideAt(k);
    if (s.pos && FOLLOW.has(s.plate?.mode) && s.teams[0] != null) return frameOn(s, k, [s.teams[0]], 1.25, 'follow') || wideAt(k);
    if (k === 0 || ['beat', 'tip', 'card'].includes(st.part) || (s.seg === 'mat-montage' && st.arrive)) return wideAt(k);
    if (sp != null && prev?.by && prev.by !== st.by && String(st.text || '').length <= 70 && PUNCH.test(st.text || '')) return frameOn(s, k, [sp], 1.55, 'close') || wideAt(k);
    if (sp != null && st.react?.team != null && st.react.team !== sp && ['jump', 'shake', 'laugh'].includes(st.react.how)) return frameOn(s, k, [sp, st.react.team], 1.35, 'two') || wideAt(k);
    if (sp != null && s.teams.length >= 3 && sp !== 'Don') return frameOn(s, k, [sp], 1.22, 'two') || wideAt(k);
    return wideAt(k);
  };
  const same = (a, b) => a.shot === b.shot && a.s === b.s && a.x === b.x && a.y === b.y;
  let cur = null, held = 0;
  steps.forEach((st, k) => {
    const w = want(k);
    const sp = speakerOf(st);
    const spBox = sp != null ? boxOf(s, sp, k) : null;
    if (!cur) { cur = w; held = 1; }
    else if (w.force) { cur = w; held = 1; }
    else if (cur.shot === 'follow' || w.shot === 'follow') { cur = w; held = 1; }     // a follow moves with its subject
    // a held close-up whose subject has moved out of it (a swimmer across the water, a team walking off) lets go
    else if (cur.shot !== 'wide' && !holdsAll(cur, s, k)) { cur = w.shot === 'wide' || holdsAll(w, s, k) ? w : wideAt(k); held = 1; }
    else if (!inView(cur, spBox)) {
      // the next speaker is out of the shot: a shot with them in it, both teams if it was soon after a cut
      const both = held < MIN_HOLD && cur.on?.length ? frameOn(s, k, [...new Set([...cur.on, sp])], 1.35, 'two') : null;
      cur = (inView(w, spBox) && held >= MIN_HOLD ? w : both) || wideAt(k); held = 1;
    } else if (held >= MIN_HOLD && !same(w, cur)) { cur = w; held = 1; }
    else held++;
    // a shot that would cut somebody in the scene (one arriving on the mat, one coming back) is the wide one
    if (cur.shot !== 'wide' && !holdsAll(cur, s, k)) { cur = wideAt(k); held = 1; }
    const { force, ...shot } = cur; void force;
    st.cam = shot;
  });
}

// ── every face on the picture: what the camera, the overlays and the checks all measure ──
// A face box is the rectangle of an avatar's portrait (both of a pair), in % of the plate: x of its width, y of its
// height. The shapes were measured on the stage (stage.js draws them; tools/rr-vp-check.mjs measures them again in
// the browser): a token's pair of faces sits above its feet and its name, Don's and a local's single face the same,
// a swimmer's head is centred on its point. Units of the avatar's own size (cqw).
export const FACE = {
  stand: [-0.8, -2.4, 0.8, -0.45], ride: [-0.8, -2.75, 0.8, -0.8], one: [-0.53, -2.4, 0.53, -0.45],
  person: [-0.53, -2.32, 0.53, -0.44], swim: [-0.55, -1.29, 0.55, 0.66], cswim: [-0.55, -1.02, 0.55, 0.93],
};
const fbox = (f, [x, y], z, dx = 0) => [x + f[0] * z + dx, y + f[1] * z, x + f[2] * z + dx, y + f[3] * z];
/** Where team `id` stands at step k (as the stage draws it), or null. */
export function teamAt(s, id, k) {
  if (s.pos?.[k]?.[id]) return s.pos[k][id];
  if (s.hiddenUntil?.[id] != null) {
    if (k < s.hiddenUntil[id]) return null;
    if (k === s.hiddenUntil[id]) return s.matAt;
  }
  return s.marks?.[id] || null;
}
/**
 * Every face drawn at step k of a world screen: { key, kind, team?, who?, box }. `key` names what the stage hides as
 * one: 'p:<name>' (Don, a local), 't:<team>' (a team in the shot), 'c:<team>' (a team behind it).
 */
export function facesAt(s, k) {
  const out = [];
  if (s.kind !== 'world' || !s.plate) return out;
  const z = s.size || 8;
  if (s.don && s.donStand) out.push({ key: 'p:Don', kind: 'person', who: 'Don', z: z * 0.95, box: fbox(FACE.person, s.donStand, z * 0.95) });
  for (const [nm, at] of Object.entries(s.localAt || {})) out.push({ key: 'p:' + nm, kind: 'person', who: nm, z: z * 0.85, box: fbox(FACE.person, at, z * 0.85) });
  if (s.exitAt != null && k > s.exitAt) return out;
  for (const id of s.teams || []) {
    const at = teamAt(s, id, k);
    if (!at) continue;
    const off = offOf(s, id, k);
    if (off === 'team') continue;
    const gone = Array.isArray(off) ? off : [];
    if (s.swimmers?.[id]) {
      const zs = Math.max(5, z * 0.85), gap = Math.max(5, z * 0.95);
      s.swimmers[id].filter(n => !gone.includes(n)).forEach((n, j) => out.push({ key: 't:' + id, kind: 'team', team: id, who: n, z: zs,
        box: fbox(FACE.swim, [at[0] + j * gap, at[1] + j * 1.5], zs) }));
      continue;
    }
    const as = s.as?.[id];
    const dx = as === 'ride' && s.mode === 'act' && /^rickshaw/.test(s.plate.prop || '') ? 0.45 * z : 0;
    const f = as === 'ride' ? FACE.ride : gone.length ? FACE.one : FACE.stand;
    const work = s.work ? (s.teams[0] === id ? s.work : 'watch') : ['swing', 'coals', 'roll'].includes(as) ? as : null;
    out.push({ key: 't:' + id, kind: 'team', team: id, z, work, box: fbox(f, at, z, dx) });
  }
  const zc = s.crowdSize || z * CROWD_SCALE;
  for (const c of s.crowd || []) if (c.pos[k]) for (const box of crowdBoxes(s, c, c.pos[k])) out.push({ key: 'c:' + c.team, kind: 'crowd', team: c.team, z: zc, work: c.as === 'run' || c.as === 'swing' ? c.as : c.work, box });
  return out;
}
/** The faces of a team behind the shot standing (or swimming) at `at`. */
export function crowdBoxes(s, c, at) {
  const zc = s.crowdSize || (s.size || 8) * CROWD_SCALE;
  if (c.as === 'swim' || c.as === 'dive') {
    const zs = Math.max(3.5, zc * 0.85), gap = Math.max(4, zc * 0.95);
    return [0, 1].map(j => fbox(FACE.cswim, [at[0] + j * gap, at[1] + j * 1.2], zs));
  }
  const b = fbox(c.as === 'ride' ? FACE.ride : FACE.stand, at, zc);
  // a runner drifts on while the step plays (style.js driftR): its box runs with it
  if (c.as === 'run') { if (c.ltr === false) b[0] -= 4; else b[2] += 4; }
  return [b];
}

// ── the teams behind never stand on anybody: moved along to a clear place, or out of that picture ──
function declutterCrowd(s) {
  if (!s.crowd?.length) return;
  const own = { ...s, crowd: null };
  s.steps.forEach((_, k) => {
    // (a team pushing a coffin keeps its coffin's room too)
    const taken = facesAt(own, k).map(f => (f.kind === 'team' && s.as?.[f.team] === 'push' ? [f.box[0], f.box[1], f.box[2] + 1.6 * f.z, f.box[3]] : f.box));
    for (const c of s.crowd) {
      const at = c.pos[k];
      if (!at) continue;
      const boxes = crowdBoxes(s, c, at);
      // off the picture (a rider still to come in): nobody to stand on
      if (boxes.every(b => b[2] <= 0 || b[0] >= 100)) continue;
      // (the faces themselves too: padding the crowd's box makes it bigger, and a share of a bigger box is smaller; a real
      // 0.081 overlap passed as 0.079, 2026-10-21)
      const clear = bs => bs.every(b => { const p = padOf({ box: b, work: ['run', 'swing', 'push'].includes(c.as) ? c.as : c.work }, s.crowdSize || (s.size || 8) * CROWD_SCALE); return taken.every(t => overlapOf(p, t) <= OVERLAP_OK && overlapOf(b, t) <= OVERLAP_OK); });
      // and whole in the wide picture, its work loop and the plate's slow push included (a face half out would fade)
      const zc = s.crowdSize || (s.size || 8) * CROWD_SCALE, work = c.as === 'run' || c.as === 'swing' ? c.as : c.work;
      const inside = bs => bs.every(b => { const p = padOf({ box: b, work }, zc); return p[0] >= EDGE && p[2] <= 100 - EDGE; });
      if (clear(boxes) && inside(boxes)) { taken.push(...boxes); continue; }
      const ground = ['stand', 'run'].includes(c.as) && s.plate?.x ? s.plate.x : [0, 100];
      // a runner keeps running one way: never back behind where it already was
      const before = c.as === 'run' ? c.pos.slice(0, k).filter(Boolean).at(-1) : null;
      let best = null;
      for (let d = 0.5; d <= 45 && !best; d += 0.5) for (const dx of [d, -d]) {
        const x = at[0] + dx;
        if (before && (c.ltr === false ? x > before[0] : x < before[0])) continue;
        const bs = boxes.map(b => [b[0] + dx, b[1], b[2] + dx, b[3]]);
        if (x < ground[0] || x > ground[1] || !inside(bs)) continue;
        if (clear(bs)) { best = [Math.round(x * 10) / 10, at[1]]; break; }
      }
      if (best) { c.pos[k] = best; taken.push(...crowdBoxes(s, c, best)); } else { c.pos[k] = null; c.st[k] = 'off'; }
    }
  });
  s.crowd = s.crowd.filter(c => c.pos.some(Boolean));
  if (!s.crowd.length) { delete s.crowd; delete s.crowdT; }
}
// The plate never stands still (style.js kbIn/kbPan/kbOut: a slow push between these scales, a pan this far), and the
// people stand on it: what a shot shows for certain is its view shrunk by that push, toward the plate's middle.
export const DRIFT = { lo: 1.025, hi: 1.045, t: 0.75 };
export const EDGE = 50 - (50 - DRIFT.t) / DRIFT.hi + 0.1;        // ~2.9: how close to the plate's edge a face may come
/** The part of a view (plate %) that stays in the picture whatever the drift is doing. */
export function safeRect(r) {
  const inv = v => [DRIFT.lo, DRIFT.hi].flatMap(sc => [-DRIFT.t, DRIFT.t].map(t => 50 + (v - 50 - t) / sc));
  return [Math.max(...inv(r[0])), Math.max(...inv(r[1])), Math.min(...inv(r[2])), Math.min(...inv(r[3]))];
}
/** A box as the drift can carry it: everywhere it may be, in plate %. */
export function driftBox(b) {
  const at = v => [DRIFT.lo, DRIFT.hi].flatMap(sc => [-DRIFT.t, DRIFT.t].map(t => 50 + (v - 50) * sc + t));
  return [Math.min(...at(b[0])), Math.min(...at(b[1])), Math.max(...at(b[2])), Math.max(...at(b[3]))];
}
// how far a face moves on its own: the idle bob and the talking bounce, and the work loops (style.js wChase, wLean...)
const WORK_PAD = { chase: [0, 0, 3, 0], lean: [0, 0, 1.1, 0], dunk: [0, 0, 0, 2.9], headbang: [0.4, 0.6, 0.4, 0.6], dig: [0.3, 0.5, 0.3, 1.3], eat: [0.6, 0.3, 0.6, 0.4],
  draw: [0.4, 0, 0.4, 0], sweat: [0.2, 0, 0.5, 0.6], build: [0.2, 1.1, 0.2, 0.4], shear: [0, 0, 0.4, 0], run: [0.3, 1.7, 0.3, 0],
  swing: [0.5, 0.3, 0.5, 0.3], coals: [0.3, 1.6, 0.3, 0], squeegee: [0.6, 0.4, 0.6, 0.2], serve: [0.6, 0.8, 0.6, 0.3], spoon: [0.3, 0.5, 0.3, 1.3],
  sculpt: [0.3, 0.3, 0.3, 1.3], dance: [0.6, 1.2, 0.6, 0.2], bull: [0.9, 1.4, 0.9, 0.4], toss: [0.3, 0.6, 0.6, 0.2], saw: [0.4, 0.2, 0.4, 0.3],
  venom: [0.6, 0.2, 0.6, 0.6], remote: [0.4, 0.4, 0.4, 0.3], pick: [0.4, 0.2, 0.4, 0.9], wrestle: [0.9, 0.6, 0.9, 0.3], roll: [0.6, 0.6, 0.6, 0.6], lever: [0.5, 0.6, 0.5, 0.6], chip: [0.2, 1.1, 0.2, 0.4], mitten: [0.6, 0.5, 0.6, 0.5], sew: [0.4, 0, 0.4, 0], beam: [0.6, 1.3, 0.6, 0.4] };
export function padOf(f, z) {
  // a coffin pushed in front takes its own room ahead of the faces (style.js .tok.push .veh)
  const w = f.work === 'push' ? [0, 0, 1.6 * z, 0] : WORK_PAD[f.work] || [0, 0, 0, 0];
  return [f.box[0] - 0.06 * z - 0.3 - w[0], f.box[1] - 0.12 * z - 1.9 - w[1], f.box[2] + 0.06 * z + 0.3 + w[2], f.box[3] + 0.5 + w[3]];
}
/** Is the dialogue bar over the picture on this step (a line, a pause), or stepped aside (a narration card, a tip)? */
export const barShown = step => !!step && !['card', 'tip', 'beat'].includes(step.part) && (step.part === 'pause' || !!step.text);
/** A shot as framed: lifted for the bar only while the bar is over the picture; without it a wide shot comes back down
 *  and a close-up keeps inside the plate, so nothing under the plate is ever shown (2026-10-21, the user: "what is this
 *  black bar in all the screens?"). */
export function framed(c, barOver) {
  const s = c?.s || 1;
  let x = c?.x || 0, y = c?.y || 0;
  if (!barOver) y = c?.shot === 'wide' ? 0 : Math.max(0, Math.min(100 - 100 / s, y));
  return { s, x, y };
}
/** The part of the picture a shot shows clear of the dialogue bar, in plate %: [x0, y0, x1, y1]. */
export function viewRect(cam, bar = BAR) {
  const s = cam?.s || 1, x = cam?.x || 0, y = cam?.y || 0;
  return [x, y, x + 100 / s, y + (100 - bar) / s];
}
export const inRect = (b, r, tol = 0.3) => b[0] >= r[0] - tol && b[2] <= r[2] + tol && b[1] >= r[1] - tol && b[3] <= r[3] + tol;
const meets = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
/** How much of the smaller of two boxes the other covers (0..1). */
export function overlapOf(a, b) {
  const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  if (w <= 0 || h <= 0) return 0;
  const area = r => (r[2] - r[0]) * (r[3] - r[1]);
  return (w * h) / Math.min(area(a), area(b));
}
/** A box in plate % as it lands on the screen under a shot (screen % of the stage). */
export function toScreen(b, cam) {
  const s = cam?.s || 1, x = cam?.x || 0, y = cam?.y || 0;
  return [(b[0] - x) * s, (b[1] - y) * s, (b[2] - x) * s, (b[3] - y) * s];
}

// ── the stamps and the slams never sit on a face ──
// The user (2026-10-19): "the TRY AGAIN stamp can sit over a face". A stamp (TRY AGAIN, QUIT, DONE!) goes above its
// team, or beside it, inside the picture, under the HUD and over the bar; a slam (ELIMINATED, BOOMERANG) keeps its
// place in the middle unless a face is there, and then moves up (or down) to where none is. All in screen % of the
// stage: x of its width, y of its height.
export const HUD_H = 9;                            // the leg and the task pills along the top
const CQ_H = 16 / 9;                               // a cqw is this many % of the stage's height
/** The screen boxes of the faces a shot shows at step k (the hidden ones are not there). */
export function screenFaces(s, k, cam) {
  const hidden = new Set(s.steps[k]?.hide || []);
  return facesAt(s, k).filter(f => !hidden.has(f.key)).map(f => ({ ...f, box: toScreen(driftBox(padOf(f, f.z)), cam) }));
}
// A stamp's size on screen (style.js .stamp: Bungee 2.2cqw, padded, turned 12 degrees), as [width %, height %].
export function stampSize(text) {
  const w = String(text).length * 2.2 * 0.86 + 2.8, h = 2.2 * 1.25 + 1.2;            // cqw
  const a = 12 * Math.PI / 180;
  return [w * Math.cos(a) + h * Math.sin(a), (w * Math.sin(a) + h * Math.cos(a)) * CQ_H];
}
/**
 * Where an overlay of [w, h] goes: the first of `prefer` (centres) that covers no face once kept inside the picture,
 * else the nearest place on a sweep of the picture that covers none, else the one that covers least.
 */
export function placeOverlay([w, h], faces, prefer, { top = HUD_H, bottom = 100 - BAR } = {}) {
  const fit = ([cx, cy]) => [Math.min(100 - w / 2 - 0.8, Math.max(w / 2 + 0.8, cx)), Math.min(bottom - h / 2 - 0.5, Math.max(top + h / 2, cy))];
  const covers = c => coverOf([w, h], c, faces);
  const tries = prefer.map(fit);
  const [px, py] = tries[0];
  for (let dy = 0; dy <= 100; dy += 2) for (const sy of dy ? [-1, 1] : [1]) for (const dx of [0, -10, 10, -20, 20, -30, 30, -40, 40]) tries.push(fit([px + dx, py + sy * dy]));
  let best = tries[0], bc = Infinity;
  for (const c of tries) { const v = covers(c); if (v === 0) return c.map(n => Math.round(n * 10) / 10); if (v < bc) { bc = v; best = c; } }
  return best.map(n => Math.round(n * 10) / 10);
}
/** How much face an overlay of [w, h] centred at c covers (0: none; a hair of clearance counts). */
export function coverOf([w, h], [cx, cy], faces) {
  const r = [cx - w / 2 - 0.3, cy - h / 2 - 0.3, cx + w / 2 + 0.3, cy + h / 2 + 0.3];
  return faces.reduce((a, f) => a + overlapOf(r, f.box || f), 0);
}
/** placeOverlay at full size, or smaller (down the `scales`) until a place covers no face: { at, k }. */
export function fitOverlay([w, h], faces, prefer, opts, scales = [1, 0.9, 0.8, 0.7, 0.6, 0.52, 0.45]) {
  let best = null;
  for (const k of scales) {
    const sz = [w * k, h * k];
    const at = placeOverlay(sz, faces, prefer(sz), opts);
    const c = coverOf(sz, at, faces);
    if (!c) return { at, k };
    if (!best || c < best.c) best = { at, k, c };
  }
  return { at: best.at, k: best.k };
}
// The Don Box tip card (style.js .tipcard: the card 27cqw tall beside a 44cqw panel), [width %, height %], estimated.
export const TIP_SIZE = [10.2 + 44 - 2 + 1.5, 27 * CQ_H + 1.5];
/** Where step k's tip card goes and how big: at the top in the middle, else beside, else smaller; never on a face. */
export function tipSpot(s, k, cam, size = TIP_SIZE, opts) {
  const faces = s.kind === 'world' ? screenFaces(s, k, cam) : [];
  const top = opts?.top ?? HUD_H;
  return fitOverlay(size, faces, ([w, h]) => [[50, top + h / 2 + 0.5], [w / 2 + 1, top + h / 2 + 0.5], [100 - w / 2 - 1, top + h / 2 + 0.5]], opts);
}
// The beat card's box on the picture (style.js .beatcard: centred at 50%, 37%; Rubik 1.6cqw in up to 56cqw, padded),
// [x0, y0, x1, y1] in %: what a stamp on the same click keeps off, estimated from the text's length.
export function beatCardBox(text) {
  const chars = String(text || '').length, lineW = 56 - 5.2;
  const w = Math.max(26, Math.min(56, chars * 1.6 * 0.5 + 5.2));
  const lines = Math.max(1, Math.ceil(chars * 1.6 * 0.5 / lineW));
  const h = (lines * 1.6 * 1.42 + 3.2 + 1.9) * CQ_H;
  // (the gold tape holding it down sticks out 1.6cqw past each side; a stamp against the tape reads as under the card)
  return [50 - w / 2 - 2.4, 37 - h / 2 - 1.5, 50 + w / 2 + 2.4, 37 + h / 2 + 1.5];
}
/** The stamp of step k at its place under a shot: above its team, or beside it, off the beat card on the same click. */
export function stampSpot(s, k, cam, size, opts) {
  const st = s.steps[k]?.stamp;
  if (!st) return null;
  const step = s.steps[k];
  const faces = screenFaces(s, k, cam).concat(step.part === 'beat' && step.text ? [{ key: 'card', box: beatCardBox(step.text) }] : []);
  const [w, h] = size || stampSize(st.text);
  const mine = faces.filter(f => f.key === 't:' + st.team).map(f => f.box);
  const fb = mine.length ? [Math.min(...mine.map(b => b[0])), Math.min(...mine.map(b => b[1])), Math.max(...mine.map(b => b[2])), Math.max(...mine.map(b => b[3]))] : [45, 40, 55, 60];
  const cx = (fb[0] + fb[2]) / 2, cy = (fb[1] + fb[3]) / 2;
  // above it or beside it; with no room (a narrow window, a crowded shot) a little smaller: `at.k` is the scale
  const r = fitOverlay([w, h], faces, ([ww, hh]) => [[cx, fb[1] - hh / 2 - 1], [fb[2] + ww / 2 + 1, cy], [fb[0] - ww / 2 - 1, cy], [fb[2] + ww / 2, fb[1] - hh / 2], [fb[0] - ww / 2, fb[1] - hh / 2]],
    opts, [1, 0.85, 0.72, 0.6]);
  const at = r.at; at.k = r.k;
  return at;
}
// The size of a slam (style.js .slam: Bungee 5.4cqw in a band, the boomerang under it), [width %, height %].
export function slamSize(slam) {
  const w = String(slam.text).length * 5.4 * 0.86 + 5.2, h = (5.4 + 1.4 + 0.6) * CQ_H + (slam.cls === 'boom' ? 21 * CQ_H : 0);
  return [Math.min(98, w), h];
}
/** What the beat card on step k keeps off: every face in the shot, and the slam on the same click (the BOOMERANG board
 *  and the card both wanted the top middle, and the card hid half the board). */
export function overlayObstacles(s, k, cam, opts) {
  const out = s.kind === 'world' ? screenFaces(s, k, cam) : [];
  const sl = s.steps[k]?.slam;
  if (sl) {
    const spot = slamSpot(s, k, cam, undefined, opts), [w, h] = slamSize(sl).map(v => v * (spot.k ?? 1));
    out.push({ key: 'slam', kind: 'slam', box: [spot[0] - w / 2, spot[1] - h / 2, spot[0] + w / 2, spot[1] + h / 2] });
  }
  return out;
}
/** The centre of step k's slam under a shot: its place in the middle, up or down off any face. */
export function slamSpot(s, k, cam, size, opts) {
  const sl = s.steps[k]?.slam;
  if (!sl) return null;
  const faces = s.kind === 'world' ? screenFaces(s, k, cam) : [];
  const [w, h] = size || slamSize(sl);
  const r = fitOverlay([w, h], faces, () => [[50, 34]], opts, [1, 0.85, 0.72, 0.6]);
  const at = r.at; at.k = r.k;
  return at;
}
// which steps stamp what: a failed try, a quit, the task done
function planStamps(s) {
  const last = s.steps.length - 1;
  s.steps.forEach((st, k) => {
    delete st.stamp;
    const team = s.teams[0];
    if (team == null) return;
    if (s.plan?.fail === k) st.stamp = { text: s.failStamp || 'TRY AGAIN', cls: '', team };
    else if (s.plan?.quit === k) st.stamp = { text: 'QUIT', cls: '', team };
    else if (k === last && s.mode === 'act' && (s.seg === 'task-done' || (s.seg === 'task-try' && !['quit', 'struggling'].includes(s.ending)))) st.stamp = { text: 'DONE!', cls: 'gold', team };
    // (a team still struggling at the end of its scene is not through: no DONE! over "back we go")
    if (st.stamp) st.stamp.at = stampSpot(s, k, st.cam);
  });
}

const CHAPTER_TASK = new Set(['either', 'botch', 'allin', 'route', 'superteam', 'midmat']);
// ── the chapters of a leg: the start, then each new task the race's front reaches, then the Chill Zone ──
/** [{ key, name, from, to }]: screen ranges (vp.js shows one per chapter; sound.js switches music at each). */
export function chaptersOf(e, placeId) {
  const place = PLACES[placeId];
  const order = new Map((place?.stretches || []).map((s, k) => [s.id, k]));
  const label = new Map((place?.stretches || []).map(s => [s.id, s.label || s.called || s.id]));
  const milestone = new Map((place?.stretches || []).filter(s => CHAPTER_TASK.has(s.kind) || s.kind === 'mat').map(s => [s.id, s]));
  const matId = (place?.stretches || []).find(s => s.kind === 'mat')?.id || 'mat';
  const chapters = [];
  let front = -1;
  // a challenge in stages: each stage the leaders reach opens its own chapter (2026-10-20, the user: "1 screen for 1
  // step of the challenge"); a team behind on an earlier stage cuts in where it is, as the teams behind always have
  const stagesOfStretch = (id, side) => { const st = place?.stretches.find(x => x.id === id);
    return (side && st?.sides?.find(d => d.id === side)?.stages) || st?.stages || null; };
  const stageFront = {};
  e.screens.forEach((s, si) => {
    const task = String(s.hud?.task || '').toUpperCase();
    let key = null, name = null;
    if (!chapters.length && (task === 'PREVIOUSLY' || task === 'LAST TIME')) { key = 'previously'; name = 'Previously'; }
    else if (!chapters.length || (chapters.length === 1 && chapters[0].key === 'previously' && task !== 'PREVIOUSLY' && task !== 'LAST TIME')) {
      key = 'start'; name = e.kind === 'final' ? 'The Finale' : 'The Start';
    }
    const stretch = s.stretch || (task === 'CHILL ZONE' || task === 'THE FINISH LINE' ? matId : null);
    if (!key && stretch && milestone.has(stretch) && (order.get(stretch) ?? -1) > front) {
      front = order.get(stretch);
      key = stretch;
      name = stretch === matId ? (e.kind === 'final' ? 'The Finish Line' : 'The Chill Zone') : label.get(stretch);
    }
    let stage = false;
    if (!key && s.seg === 'task-stage' && s.stage && (order.get(s.stretch) ?? -1) === front) {
      const list = stagesOfStretch(s.stretch, s.side), k = (list || []).findIndex(x => x.id === s.stage);
      if (k > (stageFront[s.stretch] ?? -1)) {
        stageFront[s.stretch] = k;
        const sg = stretchPlates(placeId, s.stretch, s.side)?.stages?.[s.stage];
        const nice = String(sg?.label || s.stage.replace(/-/g, ' ')).toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
        key = `${s.stretch}:${s.stage}`; name = `${label.get(s.stretch)} · ${nice}`; stage = true;
      }
    }
    if (key) chapters.push({ key, name, from: si, to: si, ...(stage ? { stage: true } : {}) });
    else chapters.at(-1).to = si;
  });
  return chapters;
}

// ── navigation and what has aired ──────────────────────────────────────
export function flatSteps(screens) {
  const out = [];
  screens.forEach((s, si) => s.steps.forEach((_, idx) => out.push({ si, idx })));
  return out;
}

// The facts on screen by step `idx` of screen `si`, folded from every step before it.
export function intelAt(epData, si, idx) {
  const it = { where: {}, money: {}, lead: {}, placed: {}, out: {}, safe: {}, events: [], winner: null };
  epData.screens.forEach((s, i) => {
    if (i > si) return;
    const upto = i < si ? s.steps.length - 1 : idx;
    for (let k = 0; k <= upto; k++) {
      const x = s.steps[k]?.intel;
      if (!x) continue;
      for (const f of ['where', 'money', 'lead', 'placed', 'out', 'safe']) if (x[f]) Object.assign(it[f], x[f]);
      if (x.event) it.events.push(x.event);
      if (x.winner) it.winner = x.winner;
    }
  });
  return it;
}
