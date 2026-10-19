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
import { PLACE_PLATES, RACE, stretchPlates, standable } from './plates.js';

export const TEAM_COLORS = ['#ff6fae', '#39c0ff', '#ffb020', '#4fd18b', '#b78cff', '#ff7a4a', '#5ee0d6', '#f2e94e', '#ff4f6d', '#8fb4ff', '#c7f464', '#e0a3ff',
  '#7fe3a0', '#ffc1a1'];

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
  const nth = key => (used[key] = (used[key] ?? -1) + 1);
  const named = new Set();          // teams captioned in the confessional already this episode
  const screens = [];
  let lastPlate = plates?.opener || null, lastT = null;

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
        const at = clips.findIndex(id => whoOfClip(st, id).includes(l.by));
        const id = at >= 0 ? clips.splice(at, 1)[0] : (group?.id ?? null);
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
    let mode = 'talk', plate = null, hudTask = stretch?.label?.toUpperCase() || '';
    let placeFor = placeId;
    const k = seg.kind;
    if (k === 'don-narrate') {
      if (seg.ending === 'depart') { placeFor = prevLeg?.place || placeId; plate = prevLeg ? matPlate(prevLeg.place) : plates.opener; hudTask = 'DEPARTURE'; mode = 'narrate'; }
      else if (seg.ending === 'flight-wait') { mode = 'flight'; hudTask = 'IN THE AIR'; }
      else if (/landed/.test(seg.ending || '')) { plate = pick(plates.arrive, 0) || plates.opener; mode = 'landing'; hudTask = 'ARRIVAL'; }
      else if (seg.ending === 'last-stretch') { plate = matPlate(placeId); mode = 'narrate'; hudTask = 'CHILL ZONE'; }
      // Don at the mat, before the first team reaches it, introducing the Chill Zone
      else if (seg.ending === 'chill') { plate = matPlate(placeId); mode = 'mat'; hudTask = 'CHILL ZONE'; }
      else { plate = (lastPlate?.place === placeId ? lastPlate : plates.opener); mode = 'narrate'; }
    } else if (k === 'don-opener') { plate = leg.n === 1 ? plates.opener : (prevLeg ? matPlate(prevLeg.place) : plates.opener); placeFor = leg.n === 1 ? placeId : (prevLeg?.place || placeId); mode = 'don'; hudTask = 'THE START'; }
    else if (k === 'don-demo') {
      const sp = stretchPlates(placeId, seg.stretch, null);
      plate = pick(sp?.talk, 0) || plates.opener; mode = 'demo';
    } else if (k === 'same-flight' || (seg.stretch === 'airport' && airportPhase(flights, segTeams[0], seg.t) === 'air')) {
      plate = { ...(RACE[k === 'same-flight' && segTeams.length > 2 ? 'galley' : 'cabin']), race: true }; mode = 'cabin'; hudTask = 'IN THE AIR';
      if (plate.seats && seg.who.length > 2) plate = { ...RACE.galley, race: true };
    } else if (seg.stretch === 'airport') {
      const ph = airportPhase(flights, segTeams[0], seg.t);
      if (ph === 'arrive') { plate = pick(plates.arrive, nth(`${placeId}|arrive`)) || plates.opener; hudTask = 'ARRIVAL'; }
      else { plate = { ...RACE.gate, race: true }; hudTask = 'THE AIRPORT'; }
    } else if (MAT_KINDS.has(k) || seg.stretch === 'mat' || seg.stretch === 'midmat') {
      const mid = seg.stretch === 'midmat' || !!scene?.data?.midmat;
      plate = matPlate(placeId, 0, mid); mode = 'mat'; hudTask = mid ? 'THE MIDPOINT' : 'CHILL ZONE';
    } else if (k.startsWith('int-')) {
      mode = 'iv';
    } else if (stretch) {
      const sp = stretchPlates(placeId, seg.stretch, seg.side);
      const wantsAct = (TASKS.has(stretch.kind) && ACT_KINDS.has(k)) || (stretch.kind === 'travel' && RIDE_KINDS.has(k));
      if (wantsAct && sp?.act) { plate = sp.act; mode = 'act'; }
      else plate = pick(sp?.talk, nth(`${placeId}|${seg.stretch}|${seg.side || ''}`)) || sp?.act || (lastPlate?.place === placeId ? lastPlate : plates.opener);
      if (!standable(plate) && mode !== 'act') plate = pick(sp?.talk?.filter(standable), 0) || plates.opener;
      if (sideLabel) hudTask += ` · ${sideLabel.toUpperCase()}`;
    } else if (seg.stretch === 'board' || seg.stretch === 'speed-bump') {
      plate = (lastPlate?.place === placeId ? lastPlate : plates.opener); hudTask = seg.stretch === 'board' ? 'THE BOARD' : 'SPEED BUMP';
    } else {
      plate = (lastPlate?.place === placeId ? lastPlate : plates.opener);
    }
    if (plate && !plate.race) plate = { ...plate, place: plate.place || placeFor };
    if (plate && mode !== 'iv' && standable(plate)) lastPlate = { ...plate };

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
      const donSpeaks = run.lines.some(l => l.by === 'Don');
      const scr = {
        kind: mode === 'flight' ? 'flight' : 'world', seg: k, ending: seg.ending, mode, place: placeId, stretch: seg.stretch, side: seg.side,
        plate, teams, locals, don: donSpeaks && !['narrate', 'flight', 'landing'].includes(mode) || ['mat', 'demo', 'don'].includes(mode),
        narrator: donSpeaks && ['narrate', 'flight', 'landing'].includes(mode),
        hud: { task: hudTask, clock }, timecard: first ? timecard : null, steps,
        from: prevLeg?.place || null, to: placeId, who: [...(seg.who || [])], stretchKind: stretch?.kind || null,
        members: Object.fromEntries(teams.map(id => [id, membersOf(id)])),
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
  if (k === 'don-opener') scr.donBox = true;
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
    'speed-bump': ['SPEED BUMP', 'red'], 'don-ruling': ['PENALTY', 'red'], 'save-used': ['SAVE', 'gold'], 'medevac-choice': ['MEDEVAC', 'red'] };
  if (SLAM[k] && scr.steps.length) {
    const at = k === 'don-ruling' ? Math.max(0, scr.steps.findIndex(s => /minute|penalt|stopwatch|clock/i.test(s.text))) : 0;
    scr.steps[at].slam = { text: SLAM[k][0], cls: SLAM[k][1] };
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

function sizeFor(n, mode) {
  if (mode === 'cabin') return 13;
  if (n <= 1) return 11;
  if (n === 2) return 9.5;
  if (n <= 4) return 8;
  if (n <= 6) return 6.8;
  return 5.6;
}

// Progress through a task over a screen's steps: up, a slip back on a failed try, through.
function progressPlan(n, ending) {
  const out = [];
  if (ending === 'after-fails' || ending === 'struggling') {
    const fail = Math.max(1, Math.floor(n / 2));
    for (let i = 0; i < n; i++) out.push(i < fail ? 0.15 + 0.5 * (i + 1) / fail : i === fail ? 0 : (i - fail) / Math.max(1, n - 1 - fail));
    return { p: out, fail: n > 1 ? fail : -1 };
  }
  if (ending === 'quit') { for (let i = 0; i < n; i++) out.push(Math.min(0.5, 0.15 + 0.4 * (i + 1) / n)); return { p: out, quit: n - 1 }; }
  for (let i = 0; i < n; i++) out.push(n === 1 ? 1 : 0.2 + 0.8 * i / (n - 1));
  return { p: out };
}

function stageScreen(s, color) {
  s.color = color;
  if (s.kind !== 'world' || !s.plate) return;
  const plate = s.plate;
  const n = s.teams.length;
  s.size = (plate?.scale || 1) * sizeFor(n + (s.don ? 0.5 : 0), s.mode);
  const marks = {};
  const as = {};
  const ps = s.steps.length;
  const M = s.size * 0.95 + 1;
  // Don and the Don Box stand on the ground too
  const extras = [];
  if (s.mode === 'cabin' || s.kind === 'flight') {
    const seats = plate?.seats;
    const people = s.teams.flatMap(id => [id]);
    if (seats && n <= 1) s.teams.forEach((id, i) => { marks[id] = seats[i]; as[id] = 'seat'; });
    else {
      const pts = spread(plate || RACE.galley, n, [], M);
      s.teams.forEach((id, i) => { marks[id] = pts[i]; as[id] = 'stand'; });
    }
    void people;
  } else if (s.mode === 'mat') {
    const mat = plate.mat || plate.matPos || [lerp(plate.x[0], plate.x[1], 0.45), groundY(plate, 0)];
    s.matAt = [...mat];
    const donX = mat[0] + 16 <= plate.x[1] ? mat[0] + 16 : mat[0] - 16;
    s.donAt = [Math.min(plate.x[1], Math.max(plate.x[0], donX)), groundY(plate, 0)];
    const arriving = (s.arriving || []).filter(id => s.teams.includes(id));
    const others = s.teams.filter(id => !arriving.includes(id));
    const pts = spread(plate, others.length, [mat[0], s.donAt[0]], M);
    others.forEach((id, i) => { marks[id] = pts[i]; as[id] = 'stand'; });
    // a montage: each team steps on the mat in turn and then stands aside
    if (arriving.length > 1) {
      const aside = spread(plate, arriving.length + others.length, [mat[0], s.donAt[0]], M).slice(others.length);
      arriving.forEach((id, i) => { marks[id] = aside[i]; as[id] = 'stand'; });
      // nobody is at the Chill Zone before Don checks them in
      s.hiddenUntil = {};
      arriving.forEach(id => { const k = s.steps.findIndex(x => x.arrive === id); s.hiddenUntil[id] = k < 0 ? 0 : k; });
      s.onMatAt = Object.fromEntries(Object.entries(s.hiddenUntil));
    } else arriving.forEach(id => { marks[id] = [...mat]; as[id] = 'stand'; });
    s.donStand = s.donAt;
  } else if (s.mode === 'act' && plate?.path && ['climb', 'walk', 'hop', 'run', 'zip', 'para', 'swim', 'dive', 'ride'].includes(plate.mode)) {
    const plan = progressPlan(ps, s.ending === 'any' && s.seg === 'task-done' ? 'done' : s.ending);
    s.plan = plan;
    s.pos = [];
    const ride = plate.mode === 'ride';
    for (let k = 0; k < ps; k++) {
      const pos = {};
      s.teams.forEach((id, i) => {
        let f = ride ? (k === 0 ? 0.5 : 0.5 + 0.12 * k / Math.max(1, ps - 1)) : plan.p[k];
        f = Math.max(0, Math.min(1, f - i * 0.12));
        let pt = pathAt(plate.path, f);
        if (plate.mode === 'hop') { const idx = Math.round(f * (plate.path.length - 1)); pt = [...plate.path[idx]]; }
        if (['swim', 'dive'].includes(plate.mode)) {
          // a head in the water is centred on its point, its name under it: both stay above the frame's bottom
          const gap = Math.max(5, s.size * 0.95);
          pt = [Math.min(100 - M - gap, Math.max(M, pt[0])), Math.min(100 - 1.2 * s.size - 2, pt[1] + i * 4)];
        } else if (plate.mode === 'ride') pt = [pt[0], pt[1] + i * 4];
        // (the slow push on the plate moves the edges out by a few per cent: the margins allow for it)
        // a climber or a jumper is never so high (or so far to the side) that their faces leave the frame
        else pt = [Math.min(100 - M, Math.max(M, pt[0])), Math.max(s.size * 2.35 + 7, pt[1])];
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
        const doer = s.stretchKind === 'botch' ? (pair.find(x => s.who.includes(x)) || pair[0]) : null;
        s.swimmers[id] = doer ? [doer] : pair;
        if (doer) watching.push(...pair.filter(x => x !== doer));
      }
      if (watching.length) s.inset = { title: plate.inset || 'WATCHING', people: watching };
    }
  } else {
    // standing scenes; an in-place task (search, cook, build) plays its work beside them
    const avoid = s.don ? [] : [];
    const pts = spread(plate, n + (s.don ? 1 : 0) + s.locals.length, avoid, M);
    let j = 0;
    if (s.don) { s.donStand = pts[j++]; }
    s.locals.forEach(nm => { (s.localAt ||= {})[nm] = pts[j++]; });
    s.teams.forEach(id => { marks[id] = pts[j++]; as[id] = 'stand'; });
    if (s.mode === 'act' && plate?.mode) { s.work = plate.mode; s.plan = progressPlan(ps, s.ending); }
    if (s.donBox) s.boxAt = [lerp(plate.x[0], plate.x[1], s.don ? 0.3 : 0.5), groundY(plate, 0)];
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
    if (as === 'swim' || as === 'dive') add(y + 1.2 * z, y - 0.8 * z);
    else if (as === 'ride') add(y + 0.5 * z, y - 2.6 * z);
    else add(y, y - 2.35 * z);
  };
  for (const [id, m] of Object.entries(s.marks || {})) one(s.as?.[id], m);
  for (const pos of s.pos || []) for (const [id, m] of Object.entries(pos)) one(s.as?.[id], m);
  for (const d of [s.donStand, ...Object.values(s.localAt || {})].filter(Boolean)) add(d[1], d[1] - 2.1 * z);
  if (s.matAt) add(s.matAt[1] + 1, s.matAt[1] - 2.35 * z);
  return { bottom, top };
}
function liftFor(s) {
  const { bottom, top } = extentOf(s);
  if (!bottom) return 0;
  const need = bottom + 2 - (100 - BAR);           // (+2: the plate's slow push moves the bottom out a little)
  return Math.round(Math.max(0, Math.min(need, top - 2)) * 10) / 10;
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
