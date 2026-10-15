// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/steps.js — a Challenge episode as stepped screens (pure: no DOM)
// ══════════════════════════════════════════════════════════════════════
//
// A played row in (js/ch-run.js challengeRows: the aired scenes with their
// lines and facts, the daily, every ballot, each Arena game, the final), a list
// of screens out, each a list of steps. One step is one click: a line, a stage
// direction, a ballot, a round, a slam. The stage (stage.js), the script under
// it and the INTEL drawer all read this list, so they cannot drift (manual §18.1).
//
// The design is the approved mockup (mockup/mockup-ch-viewer.html v2): the show
// open, the daily with TJ's rules card and the game played out, the villa as a
// map, the vote out loud in the common room with the tally board, the call-out
// AT the Arena in front of the house, the game round by round, the walk out
// through the gate. Nothing is shown before the step that says it (§17.2).
//
// Words: every line a person says is the engine's (js/ch/script). The stage
// adds only what the camera sees (games.js pools, picked by a seeded hash) and
// the rules cards (the engine's own game descriptions).
import { CH_MARKS } from './marks.js';
import { marksOf, plateKey, lineup, hostSide, sizeAt } from './ground.js';
import { episodeScenes } from '../ch/transcript.js';
import { dailyPlay, ARENA_PLAY } from './play.js';
import { DAILY_STAGE, FINAL_STAGE, ARENA_STAGE, rulesOf, dailyDef, arenaDef, pickBy, nameList, fill,
  TJ_DAILY_OPEN, TJ_DAILY_NIGHT, TJ_GO, TJ_ARENA_ASK, TJ_ARENA_RULES, TJ_ARENA_OUT, PLAY, DUEL } from './games.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const HOST = 'TJ';

// ── places ────────────────────────────────────────────────────────────
// An engine spot as a place on the island: its plate, its name, its pin on the
// villa map (js/vp-ch-ep/marks.js villa-map spot ids) and on the island map.
const PLACE = {
  villa: { plate: 'villa', place: 'The Villa', room: 'loungers', icon: 'house' },
  public: { plate: 'common', place: 'The Common Room', room: 'common', icon: 'house' },
  kitchen: { plate: 'kitchen', place: 'The Kitchen', room: 'kitchen', icon: 'house' },
  gym: { plate: 'gym', place: 'The Gym', room: 'gym', icon: 'house' },
  'hot-tub': { plate: 'hottub', place: 'The Hot Tub', room: 'hottub', icon: 'house', water: 1 },
  bedroom: { plate: 'bunks', place: 'The Bedroom', room: 'bunk-a', icon: 'house' },
  pool: { plate: 'pooldeck', place: 'The Pool', room: 'pool', icon: 'house' },
  beach: { plate: 'beach', place: 'The Beach', room: null, island: 'beach', icon: 'island' },
  party: { plate: 'club', place: 'The Beach Club', room: null, island: 'club', icon: 'music', hour: 'night', lasers: 1 },
  deliberation: { plate: 'common', place: 'The Common Room', room: 'common', icon: 'fire', hour: 'night' },
  arena: { plate: 'arena', place: 'The Arena', room: null, island: 'arena', icon: 'skull', hour: 'night' },
};
// Somewhere quiet: by day the lookout or the bedroom, by night the pool or the beach.
const QUIET_DAY = [{ plate: 'lookout', place: 'The Lookout', island: 'lookout', icon: 'island' }, { plate: 'bunks', place: 'The Bedroom', room: 'bunk-b', icon: 'house' }];
const QUIET_NIGHT = [{ plate: 'pooldeck', place: 'The Pool', room: 'pool', icon: 'house' }, { plate: 'beach', place: 'The Beach', island: 'beach', icon: 'island' },
  { plate: 'hottub', place: 'The Hot Tub', room: 'hottub', icon: 'house', water: 1 }];

// Scenes that happen at night.
const NIGHT = new Set(['party', 'fight', 'fight-physical', 'hot-tub-truths', 'arena-eve-pep', 'arena-eve-alone', 'arena-eve-confront', 'spark', 'flirt', 'pda']);
// The day's clock, in airing order: the daily, the vote and the Arena are fixed; the scenes between them are
// spaced out, a night scene never before 9:30 PM, and the clock never runs backwards. The morning after an
// Arena is the next morning, and everything aired after it on that day moves with it.
const ANCHOR = { daily: 9 * 60 + 10, ceremony: 20 * 60, volunteer: 19 * 60 + 40, callout: 21 * 60 + 40, arena: 21 * 60 + 50, 'final-start': 8 * 60 + 30 };
const NEXT_MORNING = new Set(['morning-after', 'arc-giant-falls', 'tj-at-breakfast']);
export function clockOf(aired, dailyNight = false) {
  const out = aired.map(a => ({ day: a.day, min: null }));
  let shift = 0, shiftDay = null;
  aired.forEach((a, i) => {
    if (shiftDay !== a.day) { shift = 0; shiftDay = a.day; }
    const arenaBefore = aired.slice(0, i).some(x => x.day === a.day && x.kind === 'arena');
    if (NEXT_MORNING.has(a.kind) && arenaBefore) shift = 1;
    out[i].day = a.day + shift;
    if (ANCHOR[a.kind] != null) out[i].min = a.kind === 'daily' && dailyNight ? 21 * 60 : ANCHOR[a.kind];
    if (shift && ANCHOR[a.kind] == null) out[i].min = null;
  });
  // fill the gaps: from the previous fixed time (or 8 AM) to the next (or 11:50 PM), in order
  let i = 0;
  while (i < out.length) {
    if (out[i].min != null) { i++; continue; }
    let j = i;
    while (j < out.length && out[j].min == null && out[j].day === out[i].day) j++;
    const prev = i > 0 && out[i - 1].day === out[i].day ? out[i - 1].min : 8 * 60;
    const next = j < out.length && out[j].day === out[i].day && out[j].min != null ? out[j].min : 23 * 60 + 50;
    const n = j - i, gap = Math.max(10 * (n + 1), next - prev);
    let t = prev;
    for (let k = i; k < j; k++) {
      t = Math.max(t + 10, prev + Math.round(gap * (k - i + 1) / (n + 1) / 5) * 5);
      if (NIGHT.has(aired[k].kind) && t < 21 * 60 + 30 && next > 21 * 60 + 40) t = Math.max(t, 21 * 60 + 30 + (k - i) * 15);
      out[k].min = Math.min(t, next - 5 * (j - k));
    }
    i = j;
  }
  for (let k = 1; k < out.length; k++) if (out[k].day === out[k - 1].day && out[k].min <= out[k - 1].min) out[k].min = out[k - 1].min + 5;
  return out;
}
const clock = min => { const h = Math.floor(min / 60) % 24, m = min % 60; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const whenOf = (day, min) => `<b>Day ${esc(day)}</b> · ${clock(min)}`;
const isNight = min => min >= 19 * 60 + 30 || min < 6 * 60;

// Which chapter of the episode a scene belongs to (one VP screen per run of them).
const DAILY_KINDS = new Set(['daily', 'daily-clutch', 'daily-choke', 'partner-draw', 'partner-pick', 'partner-blame', 'partner-carried', 'team-blame', 'picked-last', 'throw', 'throw-caught']);
const FINAL_KINDS = new Set(['final-start', 'instant-elimination', 'overnight', 'overnight-sabotage', 'overnight-quit', 'final-pact-help', 'final-pact-broken', 'champions']);
function chapterOf(a) {
  if (a.kind === 'previously') return 'open';
  if (DAILY_KINDS.has(a.kind)) return 'daily';
  if (a.spot === 'party' || a.kind === 'party' || a.kind === 'fight' || a.kind === 'fight-physical') return 'party';
  if (a.kind === 'ceremony' || a.kind === 'volunteer') return 'vote';
  if (a.kind.startsWith('arena-eve')) return 'eve';
  if (a.kind === 'callout' || a.kind === 'arena') return 'arena';
  if (a.kind === 'final-start') return 'final-start';
  if (a.kind === 'instant-elimination') return 'instant';
  if (a.kind.startsWith('overnight')) return 'overnight';
  if (a.kind.startsWith('final-pact')) return 'final-day2';
  if (a.kind === 'champions') return 'champions';
  return 'villa';
}
const LABEL = { open: 'Previously', daily: 'The daily', villa: 'The villa', party: 'Night out', vote: 'The vote', eve: 'The night before',
  arena: 'The Arena', 'final-start': 'The final', instant: 'Instant elimination', overnight: 'The overnight', 'final-day2': 'The last day',
  champions: 'The finish line' };

// ── placing people on a plate ─────────────────────────────────────────
// Extra places when a plate has fewer marks than people: between and just behind its own.
function crowdSlots(base, n) {
  const out = [];
  const src = [...base].sort((a, b) => a.u - b.u);
  for (let row = 0; out.length < n && row < 4; row++) {
    for (let i = 0; i < src.length && out.length < n; i++) {
      const a = src[i], b = src[i + 1] || src[i - 1] || a;
      const u = row % 2 === 0 ? (a.u + b.u) / 2 : a.u + (row > 1 ? .02 : -.02);
      out.push({ u: Math.min(.97, Math.max(.03, u)), v: a.v - .028 * (row + 1), s: (a.s || .08) * Math.pow(.9, row + 1) });
    }
  }
  return out;
}
// A conversation of a few: the stand marks nearest the middle, left to right; a crowd fills every mark.
export function placeScene(key, people, { group = null, crowd = [] } = {}) {
  if (!group && people.length > 6) {
    const slots = lineup(key, people.length);
    return Object.fromEntries(people.map((n, i) => [n, slots[i]]));
  }
  const ms = marksOf(key);
  const stands = ms.filter(m => m.kind === 'stand' && !m.group);
  const seats = ms.filter(m => m.kind === 'seat' && (!group || m.group === group));
  const spec = {};
  // a group (the sofa, the Arena's stand) keeps to its own seats and stands; the plate's open spots are for others
  const gStands = group ? ms.filter(m => m.kind === 'stand' && m.group === group) : [];
  const pool = group ? [...seats.map((m, i) => ({ m, sp: ['seat', i, m.group] })), ...gStands.map((m, i) => ({ m, sp: ['stand', i, group] })), ...(gStands.length ? [] : stands.map((m, i) => ({ m, sp: ['stand', i] })))]
    : [...stands.map((m, i) => ({ m, sp: ['stand', i] })), ...ms.filter(m => m.kind === 'seat').map(m => ({ m, sp: ['seat', ms.filter(x => x.kind === 'seat' && x.group === m.group).indexOf(m), m.group] }))];
  const central = [...pool].sort((a, b) => (Math.abs(a.m.u - .5) - a.m.v * .6) - (Math.abs(b.m.u - .5) - b.m.v * .6));
  const front = central.slice(0, people.length).sort((a, b) => a.m.u - b.m.u);
  people.forEach((n, i) => { if (front[i]) spec[n] = front[i].sp; });
  const used = new Set(front.map(x => x.m));
  const rest = central.filter(x => !used.has(x.m));
  if (!group && crowd.length) {
    // the ones talking stay on their marks; the crowd stands in rows behind them
    const slots = lineup(key, crowd.length, { back: true });
    crowd.forEach((n, i) => { spec[n] = slots[i]; });
    return spec;
  }
  const extra = people.filter(n => !spec[n]).concat(crowd);
  const base = group ? [...seats, ...gStands] : stands.length ? stands : seats;
  const slots = [...rest.map(x => x.sp), ...crowdSlots(base.length ? base : [{ u: .5, v: .75, s: .1 }], Math.max(0, extra.length - rest.length))];
  extra.forEach((n, i) => { if (slots[i]) spec[n] = slots[i]; });
  return spec;
}

// ── reading a line: what the person is doing ──────────────────────────
// Read from what happens (a stage direction names who does what) and from how a line is said
// (manual §18.2, Perfect Match: animate what people DO, never what they talk about).
const ACT_WORDS = [
  [/\b(storms? off|storms? out|walks? (?:off|out|away)|leaves?|heads? (?:off|out|inside)|stomps? off)\b/i, 'exit'],
  [/\b(hugs?|hugging|wraps? (?:his|her|their) arms)\b/i, 'hug'],
  [/\b(kiss(?:es)?|kissing)\b/i, 'kiss'],
  [/\b(laughs?|laughing|cracks? up|giggl)/i, 'laugh'],
  [/\b(cries|crying|tears|sobs?)\b/i, 'cry'],
  [/\b(slams?|smash(?:es)?|punch(?:es)?|shoves?|throws? (?:a|the|his|her) (?:drink|cup|glass))/i, 'slam'],
  [/\b(danc(?:e|es|ing))\b/i, 'dance'],
  [/\b(whispers?|leans? in|pulls? \w+ aside)\b/i, 'lean'],
  [/\b(cheers?|celebrat|jumps? up)/i, 'cheer'],
  [/\b(stares?|glares?)\b/i, 'look'],
];
export function actionOf(text) { for (const [re, a] of ACT_WORDS) if (re.test(text)) return a; return null; }
const shouted = t => /!/.test(t) && (/\b[A-Z]{3,}\b/.test(t) || /!{2,}|\?!|!\?/.test(t));
const laughed = t => /^(ha(ha)+|hah|lol)\b/i.test(t.trim());
const namesIn = (t, names) => names.filter(n => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t));

// ── the ledger of who has left the house ──────────────────────────────
function goneBefore(row) {
  const gone = new Set();
  const out = [];
  for (const a of row.ch?.aired || []) {
    out.push(new Set(gone));
    if (a.kind === 'arena') { const l = a.data?.loser; if (l) gone.add(l); }
    if (['quit', 'medical', 'disqualified', 'overnight-quit'].includes(a.kind)) a.who.slice(0, 1).forEach(n => gone.add(n));
    if (a.kind === 'instant-elimination') { const w = a.data?.winner; a.who.filter(n => n !== w).forEach(n => gone.add(n)); }
  }
  return out;
}

// ── building one scene's steps ────────────────────────────────────────
// `S` is the builder: the step list and the screen's running clock.
function linesToSteps(S, lines, { names, first = null, sceneWho = [], host = false } = {}) {
  const present = new Set(sceneWho);
  if (!lines.length && first) { S.push(first); return; }
  lines.forEach((l, i) => {
    const step = i === 0 && first ? first : {};
    if (l.kind === 'beat') {
      step.dir = l.text;
      const a = actionOf(l.text), who = namesIn(l.text, names);
      if (a && who.length) {
        if (a === 'exit') step.exit = [who[0]];
        else if (a === 'hug' || a === 'kiss') { step.act = Object.fromEntries(who.slice(0, 2).map(n => [n, 'lean'])); if (a === 'kiss') step.fx = { heart: who.slice(0, 2) }; }
        else if (a === 'slam') { step.act = { [who[0]]: 'shout' }; step.shake = 1; }
        else if (a === 'cry') step.act = { [who[0]]: 'slump' };
        else step.act = { [who[0]]: a };
        step.focus = who.slice(0, 2);
      } else step.focus = who.filter(n => present.has(n)).slice(0, 2);
    } else if (l.kind === 'conf') {
      step.conf = [l.by, l.text];
    } else if (l.by === HOST) {
      step.tj = l.text; step.focus = ['TJ'];
      if (!present.has(HOST) && host) { step.enter = { ...(step.enter || {}), TJ: ['host'] }; present.add(HOST); }
    } else {
      step.say = [l.by, l.text];
      if (!present.has(l.by)) { step.enter = { ...(step.enter || {}), [l.by]: null }; present.add(l.by); }
      if (shouted(l.text)) { step.act = { [l.by]: 'shout' }; step.loud = 1; }
      else if (laughed(l.text)) step.act = { [l.by]: 'laugh' };
      const other = sceneWho.find(n => n !== l.by && present.has(n));
      step.focus = other && !shouted(l.text) ? [l.by, other] : [l.by];
    }
    S.push(step);
  });
}

// A scene's people on its plate, as the scene step's cast.
function sceneStep(S, a, place, { night, extraCast = [], hidden = [], group = null, crowd = [] } = {}) {
  const key = plateKey(place.plate, night);
  const who = (a?.who || []).filter(n => n && n !== HOST);
  const cast = placeScene(key, [...new Set([...who, ...extraCast])], { group, crowd: crowd.filter(n => !who.includes(n)) });
  return { scene: { plate: key, place: place.place, when: whenOf(S.day, S.min), icon: place.icon || 'house', room: place.room || null,
    island: place.island || null, cast, hidden, water: place.water || 0, lasers: place.lasers || 0, embers: place.embers || 0, wipe: 1, crowd } };
}

// Intel cards: what the viewer knows that the house doesn't.
const REASON = {
  survive: (a, b) => `<b>${esc(a)}</b> thinks <b>${esc(b)}</b> is the easiest win.`,
  grudge: (a, b) => `It's personal. <b>${esc(a)}</b> has a problem with <b>${esc(b)}</b>.`,
  prove: (a, b) => `<b>${esc(a)}</b> wants to beat somebody strong, to prove a point. That's <b>${esc(b)}</b>.`,
  'avoid-beast': (a, b) => `<b>${esc(a)}</b> picked <b>${esc(b)}</b> to stay away from the strongest players.`,
};
const ANSWER = { yes: 'said yes', no: 'said no', organiser: 'organised it' };
function meetingKnow(d) {
  if (!d?.target) return null;
  const by = {};
  for (const [n, v] of Object.entries(d.responses || {})) (by[v] ||= []).push(n);
  const parts = Object.entries(by).filter(([v]) => v !== 'organiser').map(([v, ns]) => `${esc(nameList(ns))} ${ANSWER[v] || esc(String(v).replace(/-/g, ' '))}.`);
  return [`${d.name || 'The meeting'}`, `<b>${esc(d.organiser)}</b> wants <b>${esc(d.target)}</b> in the Arena. ${parts.join(' ')}`];
}
const FEUD_KINDS = new Set(['fight', 'fight-physical', 'kitchen-blowup', 'trash-talk', 'arena-eve-confront', 'receipts', 'jealousy', 'breakup', 'showmance', 'spark', 'flirt', 'beach-date', 'arc-payback', 'arc-showdown']);
function bondKnow(a) {
  const b = a.snap?.bond;
  if (b == null || a.who.length < 2 || !FEUD_KINDS.has(a.kind)) return null;
  const cls = b >= 0 ? 'up' : 'dn', sign = b >= 0 ? '+' : '−';
  return ['Relationships', `<div class='b'><span>${esc(a.who[0])} and ${esc(a.who[1])}</span><span class='${cls}'>${sign}${Math.abs(b).toFixed(1)}</span></div>`];
}

// ── the episode ───────────────────────────────────────────────────────
/** The episode's stepped screens: [{ id, key, label, steps }]. */
export function chStepScreens(row, ctx = {}) {
  const ch = row?.ch || {};
  const aired = ch.aired || [];
  const titles = episodeScenes(row);
  const house = ch.house || ch.people || [];
  const names = [...new Set([...house, ...aired.flatMap(a => a.who || []), HOST])].sort((a, b) => b.length - a.length);
  const goneAt = goneBefore(row);
  const screens = [];
  let cur = null;
  const times = clockOf(aired, DAILY_STAGE[ch.daily?.id]?.hour === 'night');
  const S = {
    day: aired[0]?.day ?? row.day ?? 1, min: 8 * 60,
    push(step) { cur.steps.push(step); return step; },
    last() { return cur.steps[cur.steps.length - 1]; },
    // the scene at airing index i: its day and time
    at(i) { const c = times[i]; if (c) { this.day = c.day; this.min = c.min; } },
  };
  const open = (key, label) => { cur = { id: `${key}-${screens.length}`, key, label: label || LABEL[key] || 'The villa', steps: [] }; screens.push(cur); };

  // Group the aired scenes into chapters, in airing order.
  const chunks = [];
  let seenDaily = false;
  aired.forEach((a, i) => {
    let k = chapterOf(a);
    if (k === 'daily' && a.kind !== 'daily' && seenDaily && chunks[chunks.length - 1]?.key !== 'daily') k = 'villa';
    if (a.kind === 'daily') seenDaily = true;
    if ((k === 'party' || k === 'villa') && ['party', 'villa'].includes(chunks[chunks.length - 1]?.key)) { chunks[chunks.length - 1].items.push(i); return; }
    const last = chunks[chunks.length - 1];
    if (last && last.key === k && k !== 'arena') last.items.push(i);
    else if (last && k === 'arena' && last.key === 'arena' && aired[last.items[last.items.length - 1]].kind === 'callout') last.items.push(i);
    else chunks.push({ key: k, items: [i] });
  });

  // The show open runs at the top of every episode, before "previously".
  open('open', 'Previously');
  S.push({ scene: { plate: plateKey('opener', false), place: 'Blue Lagoon', when: `<b>Episode ${esc(row.num)}</b>`, icon: 'island', island: 'villa', cast: {}, wipe: 0 },
    open: { cast: house.slice(0, 20), season: ctx.season || null, title: ctx.title || 'Blue Lagoon' } });
  let dailyDone = false;

  for (const c of chunks) {
    const items = c.items.map(i => ({ a: aired[i], i, title: titles[i]?.title || '' }));
    if (c.key === 'open') {
      for (const { a } of items) linesToSteps(S, a.lines, { names, sceneWho: ['TJ'] });
      continue;
    }
    if (c.key === 'daily') { buildDaily(S, open, items, row, { names, house, goneAt, dailyDone }); dailyDone = true; continue; }
    if (c.key === 'vote') { buildVote(S, open, items, row, { names, house, goneAt }); continue; }
    if (c.key === 'arena') { buildArena(S, open, items, row, { names, house, goneAt }); continue; }
    if (['final-start', 'instant', 'overnight', 'final-day2', 'champions'].includes(c.key)) { buildFinal(S, open, c.key, items, row, { names, house, goneAt }); continue; }
    // villa, party, eve: scene after scene on their plates, the villa opening on its map
    open(c.key);
    if (c.key !== 'eve' && items.filter(x => chapterOf(x.a) !== 'party').length >= 2) villaMap(S, items.filter(x => chapterOf(x.a) !== 'party'));
    let partied = false;
    for (const it of items) {
      const k = chapterOf(it.a);
      if (k === 'party' && !partied) { partied = true; S.at(it.i); S.push({ seg: ['Night out', 'Party'] }); }
      scene(S, it, { names, house, goneAt, key: k });
    }
  }
  // the opening screen only had the open itself when there was no "previously"
  for (const s of screens) if (!s.steps.length) s.steps.push({ dir: '' });
  // map bubbles jump to the first step of their scene
  for (const s of screens) for (const st of s.steps) if (st.map) for (const r of [...st.map.rooms, ...st.map.later]) r.go = s.steps.findIndex(x => x.sceneIdx === r.scene);
  return screens;
}

// One villa/party/eve scene.
function scene(S, { a, i, title }, { names, house, goneAt, key }) {
  S.at(i);
  const night = isNight(S.min);
  if (a.spot === 'confessional' || (a.lines.length && a.lines.every(l => l.kind === 'conf'))) {
    // a confessional on its own: the chair, no room
    const first = { scene: { plate: 'conf-day', place: 'Confessional', when: whenOf(S.day, S.min), icon: 'house', cast: {}, conf: 1 }, sceneIdx: i, title };
    linesToSteps(S, a.lines, { names, first, sceneWho: a.who });
    return;
  }
  let place = PLACE[a.spot] || null;
  if (a.kind === 'arena-eve-pep') place = { plate: night ? 'beach' : 'sunset', place: 'The Beach', island: 'beach', icon: 'island' };
  if (!place || a.spot === 'private') place = pickBy(night ? QUIET_NIGHT : QUIET_DAY, `${a.kind}|${a.day}|${a.who.join()}`);
  const crowd = key === 'party' ? house.filter(n => !goneAt[i]?.has(n) && !a.who.includes(n)).filter((n, k) => (k * 7 + a.day) % 3 === 0).slice(0, 7) : [];
  const first = sceneStep(S, a, place, { night: night || place.hour === 'night', crowd });
  first.sceneIdx = i; first.title = title;
  if (key === 'party') { first.dance = crowd.slice(0, 5); first.bg = Object.fromEntries(crowd.slice(5).map(n => [n, 'sip'])); }
  const k = a.kind === 'meeting' ? meetingKnow(a.data) : bondKnow(a);
  if (k) first.know = k;
  linesToSteps(S, a.lines, { names, first, sceneWho: a.who });
}

function villaMap(S, items) {
  const rooms = {}, later = [];
  for (const { a, i, title } of items) {
    const p = PLACE[a.spot];
    const star = ['meeting', 'recruit', 'plea', 'deal', 'alliance-form', 'outing', 'fight', 'showmance', 'leverage-threat', 'receipts', 'morning-after', 'return'].includes(a.kind);
    if (p?.room) { const r = (rooms[p.room] ||= { at: p.room, who: [], bubs: [] }); a.who.forEach(n => !r.who.includes(n) && r.who.push(n)); r.bubs.push({ bub: title, scene: i, star }); }
    else later.push({ bub: title, scene: i, star });
  }
  const list = Object.values(rooms).map(r => ({ at: r.at, who: r.who.slice(0, 5), bub: r.bubs[0].bub, scene: r.bubs[0].scene, star: r.bubs.some(b => b.star), more: r.bubs.length - 1 }));
  S.push({ scene: { plate: plateKey('villa-map', false), place: 'The Villa', when: whenOf(items[0].a.day, S.min), icon: 'house', cast: {}, wipe: 1 },
    map: { rooms: list, later: later.slice(0, 4), clock: [['Morning', S.min < 12 * 60 ? 'now' : 'done'], ['Afternoon', S.min < 12 * 60 ? 'lock' : S.min < 18 * 60 ? 'now' : 'done'], ['Night', S.min >= 18 * 60 ? 'now' : 'lock']] },
    dir: 'Back at the villa. The faces show who is in each room; a bubble is a conversation. Click one, or press Next to watch them in order.' });
}

// ── the daily ─────────────────────────────────────────────────────────
function buildDaily(S, open, items, row, { names, house, goneAt }) {
  const d = row.ch?.daily;
  const main = items.find(x => x.a.kind === 'daily');
  open('daily');
  if (!d || !main) { for (const it of items) scene(S, it, { names, house, goneAt, key: 'daily' }); return; }
  const st = DAILY_STAGE[d.id] || DAILY_STAGE['gauntlet-run'];
  const def = dailyDef(d.id);
  S.at(main.i);
  const night = st.hour === 'night';
  const units = d.order || [];
  const people = units.flat();
  const key = plateKey(st.plate, night);
  const cast = { TJ: hostSide(key), ...placeScene(key, people) };
  S.push({ scene: { plate: key, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast, wipe: 1, water: 0 },
    seg: ["Today's daily", d.name], sceneIdx: main.i, title: main.title });
  // scenes that aired before the game (picking partners, picking teams) play first, on the same sand
  const before = items.filter(x => x.i < main.i), after = items.filter(x => x.i > main.i);
  for (const it of before) linesToSteps(S, it.a.lines, { names, sceneWho: it.a.who, first: { sceneIdx: it.i, title: it.title, focus: it.a.who.slice(0, 2) } });
  const seed = `${row.num}|${d.id}`;
  S.push({ tj: fill(pickBy(night ? TJ_DAILY_NIGHT : TJ_DAILY_OPEN, seed), { game: d.name }), focus: ['TJ'] });
  const mode = d.mode === 'pairs' ? 'In pairs. ' : d.mode === 'teams' ? 'Two teams. ' : '';
  const win = d.mode === 'solo' && (d.winners || []).length > 1 ? 'The best man and the best woman win, and they are safe at the vote.' : 'The winners are safe at the vote.';
  S.push({ rules: { k: "TODAY'S DAILY", n: d.name, li: rulesOf(def?.desc), f: mode + win }, focus: ['TJ'] });
  S.push({ tj: pickBy(TJ_GO, seed), focus: ['TJ'], gong: 1 });
  const unitName = u => nameList(u);
  const winners = d.winners || [];
  const isWin = u => u.some(n => winners.includes(n));
  const know = [];
  if ((d.throws || []).length) know.push(['Thrown', `${esc(nameList(d.throws))} ${d.throws.length > 1 ? 'are' : 'is'} losing on purpose. ${(d.caught || []).length ? `${esc(nameList(d.caught.map(c => c.by)))} saw it.` : 'Nobody in the house has noticed.'}`]);
  const played = st.show === 'hang' ? null : dailyPlay(d, { key, seed: row.num });
  if (played) {
    const mid = [];
    for (const h of d.injuries || []) mid.push({ dir: fill(pickBy(st.water && st.verb === 'swim' ? PLAY.hurtWet : PLAY.hurt, seed + h), { who: h }), focus: [h], act: { [h]: 'slump' }, shake: st.verb === 'swim' ? 0 : 1 });
    const ch = (d.moments || []).find(m => m.kind === 'choke');
    if (ch) mid.push({ dir: fill(pickBy(PLAY.choke, seed), { who: ch.who }), focus: [ch.who], act: { [ch.who]: 'slump' } });
    played.steps.splice(Math.min(2, played.steps.length), 0, ...mid);
    played.steps.forEach((x, k) => { if (k === 1 && know.length && !x.know) x.know = know.shift(); S.push(x); });
  } else if (st.show === 'hang' || st.show === 'last') {
    // Out in reverse order; the winners never drop.
    const out = [...units].reverse().filter(u => !isWin(u));
    const groups = [];
    const per = Math.max(1, Math.ceil(out.length / 4));
    for (let g = 0; g < out.length; g += per) groups.push(out.slice(g, g + per));
    const verb = st.verb;
    S.push({ hang: st.show === 'hang' ? 'start' : null, stand: st.show === 'last' ? 'start' : null, still: people,
      dir: st.show === 'hang' ? pickBy(PLAY.hang.start, seed) : pickBy(PLAY.last.start[verb] || PLAY.last.start.quiz, seed), focus: [] });
    groups.forEach((g, k) => {
      const who = g.flat();
      const one = g.length === 1 && g[0].length === 1;
      const line = st.show === 'hang'
        ? fill(pickBy(one ? PLAY.hang.drop1 : PLAY.hang.dropN, seed + k), { who: g.map(unitName).join(', ').replace(/, ([^,]*)$/, ' and $1') })
        : fill(pickBy((one ? PLAY.last.drop1 : PLAY.last.dropN)[verb] || PLAY.last.drop1.quiz, seed + k), { who: nameList(g.map(unitName)) });
      const step = { drop: who, dir: (st.show === 'hang' && k > 0 ? pickBy(PLAY.hang.sag, seed + k) + ' ' : '') + line, sag: st.show === 'hang' ? k + 1 : 0, focus: who.slice(0, 2), shake: k === groups.length - 1 ? 1 : 0, splash: st.water ? 1 : 0 };
      if (k === 1 && know.length) step.know = know.shift();
      S.push(step);
    });
  } else {
    // a race: three looks at the board, then the finish
    const R = units.length;
    const rank = u => units.indexOf(u);
    const board = k => units.slice(0, Math.min(6, R)).map(u => ({ who: u, p: Math.min(.95, (k / 4) * (1.25 - rank(u) / Math.max(1, R) * .7)) }));
    S.push({ race: board(1), dir: pickBy(PLAY.race.start[st.verb] || PLAY.race.start.run, seed), focus: [] });
    const lead = units[0], back = units[R - 1];
    S.push({ race: board(2), dir: fill(pickBy(lead.length > 1 ? PLAY.race.leadN : PLAY.race.lead, seed + 2), { who: unitName(lead) }), focus: lead.slice(0, 2), know: know.shift() });
    if (R > 2) S.push({ race: board(3), dir: fill(pickBy(back.length > 1 ? PLAY.race.backN : PLAY.race.back, seed + 3), { who: unitName(back) }), focus: back.slice(0, 2), act: { [back[0]]: 'slump' } });
    const clutch = (d.moments || []).find(m => m.kind === 'clutch');
    if (clutch) S.push({ race: board(3.5), dir: fill(pickBy(PLAY.clutch, seed), { who: clutch.who }), focus: [clutch.who], act: { [clutch.who]: 'cheer' } });
  }
  if (!played) {
    for (const h of d.injuries || []) S.push({ dir: fill(pickBy(PLAY.hurt, seed + h), { who: h }), focus: [h], act: { [h]: 'slump' }, shake: 1 });
    const choke = (d.moments || []).find(m => m.kind === 'choke');
    if (choke) S.push({ dir: fill(pickBy(PLAY.choke, seed), { who: choke.who }), focus: [choke.who], act: { [choke.who]: 'slump' } });
  }
  // The finish: TJ calls it (the engine's own daily lines).
  const lines = main.a.lines;
  if (played?.finish?.dir) { S.push({ ...played.finish, win: winners, power: winners, slam: { winner: `${nameList(winners)} ${winners.length > 1 ? 'win' : 'wins'}` }, focus: winners.slice(0, 2) }); }
  const first = played ? (played.finish?.dir ? {} : { ...played.finish, win: winners, power: winners, slam: { winner: `${nameList(winners)} ${winners.length > 1 ? 'win' : 'wins'}` } }) : { win: winners, slam: { winner: `${nameList(winners)} ${winners.length > 1 ? 'win' : 'wins'}` }, power: winners, finish: st.show, race: st.show === 'race' ? units.slice(0, Math.min(6, units.length)).map(u => ({ who: u, p: isWin(u) ? 1 : .9 })) : null };
  linesToSteps(S, lines, { names, first, sceneWho: ['TJ', ...people] });
  for (const k of know) { const last = S.last(); if (last && !last.know) last.know = k; }
  // the daily's aftermath scenes, on the same plate
  for (const it of after) {
    S.at(it.i);
    const first2 = { scene: { plate: key, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: { ...placeScene(key, it.a.who) }, wipe: 1 }, sceneIdx: it.i, title: it.title, power: winners };
    if (it.a.lines.every(l => l.kind === 'conf')) first2.scene.cast = {};
    linesToSteps(S, it.a.lines, { names, first: first2, sceneWho: it.a.who });
  }
}

// ── the vote ──────────────────────────────────────────────────────────
function buildVote(S, open, items, row, { names, house, goneAt }) {
  open('vote');
  const at = items.find(x => x.a.kind === 'ceremony') || items[0];
  S.at(at.i);
  const here = house.filter(n => !goneAt[at.i]?.has(n));
  const key = plateKey('common', true);
  const cast = { TJ: ['host'], ...placeScene(key, here, { group: 'sofa' }) };
  S.push({ scene: { plate: key, place: 'The Common Room', when: whenOf(S.day, S.min), icon: 'fire', room: 'common', cast, wipe: 1 }, seg: ['Tonight', 'The Vote'], sceneIdx: at.i, title: 'The house vote', power: row.ch?.dailyWinners || [] });
  let ruled = false;
  for (const it of items) {
    if (it.a.kind !== 'ceremony') { linesToSteps(S, it.a.lines, { names, sceneWho: it.a.who, first: { sceneIdx: it.i, title: it.title } }); continue; }
    ceremony(S, it, row, { names, rules: !ruled, again: ruled });
    ruled = true;
  }
}

function ceremony(S, cer, row, { names, rules, again }) {
  const v = (row.ch?.votes || []).find(x => x.votedIn === cer.a.votedIn) || (row.ch?.votes || [])[0];
  const total = v?.ballots?.length || 0;
  const div = row.ch?.division === 'm' ? "It's a <b>men's week</b>, so only a guy can be voted in." : row.ch?.division === 'f' ? "It's a <b>women's week</b>, so only a woman can be voted in." : 'Anybody can be voted in this week.';
  const safe = (row.ch?.dailyWinners || []);
  let read = 0, decided = false, called = false;
  const tally = {};
  if (again) S.push({ boardReset: 1, dir: 'One more vote tonight. The house votes again.', focus: ['TJ'], sceneIdx: cer.i });
  for (const part of cer.a.cer || []) {
    if (part.kind === 'cer-open') {
      linesToSteps(S, part.lines, { names, sceneWho: ['TJ'] });
      if (rules) S.push({ rules: { k: 'HOW TONIGHT WORKS', n: 'Out loud', li: [div, 'One at a time, you <b>stand up and say a name</b>, out loud, in front of everybody.',
        safe.length ? `${esc(nameList(safe))} won the daily, so <b>nobody can vote for ${safe.length > 1 ? 'them' : 'them'}</b>.` : 'Nobody won safety this week.',
        'The one with <b>the most votes</b> goes into the Arena, and at the Arena <b>picks who goes in with them</b>.'], f: 'No secret ballots: everybody hears what you say' }, focus: ['TJ'] });
      continue;
    }
    if (part.kind === 'ballot') {
      read++;
      tally[part.target] = (tally[part.target] || 0) + 1;
      const b = (v?.ballots || []).find(x => x.voter === part.voter);
      let know = null;
      if (b && b.told && b.told !== b.target) know = ['A flip', `<b>${esc(b.voter)}</b> told everybody ${esc(b.told)}, and said <b>${esc(b.target)}</b>.`];
      else if (b && b.wanted && b.wanted !== b.target) know = ['Ballots', `<b>${esc(b.voter)}</b> wanted ${esc(b.wanted)} gone, ${b.asked && b.asked !== b.wanted ? `was asked for ${esc(b.asked)}, ` : ''}and said <b>${esc(b.target)}</b>.`];
      const lead = Object.entries(tally).sort((x, y) => y[1] - x[1]);
      const left = total - read;
      if (!know && lead.length && lead[0][1] > (lead[1]?.[1] || 0) + left && !decided) { decided = true; know = ["It's decided", `That's ${lead[0][1]} for ${esc(lead[0][0])}, with ${left} left to vote. Nobody can catch that now.`]; }
      const said = part.lines.findIndex(l => l.by === part.voter && l.kind === 'say');
      if (said < 0) S.push({ vote: [part.voter, part.target], dir: `${part.voter} votes for ${part.target}.`, focus: [part.voter], of: total, know });
      part.lines.forEach((l, k) => {
        if (k === said) { const st = { vote: [part.voter, part.target], say: [l.by, l.text], focus: [part.voter], of: total }; if (know) st.know = know; if (shouted(l.text)) { st.act = { [l.by]: 'shout' }; st.loud = 1; } S.push(st); }
        else linesToSteps(S, [l], { names, sceneWho: [part.voter, 'TJ'] });
      });
      continue;
    }
    if (part.kind === 'cer-result') {
      const vi = cer.a.votedIn;
      part.lines.forEach(l => {
        if (l.by === HOST && vi && new RegExp(`\\b${vi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(l.text) && !called) {
          called = true;
          S.push({ tj: l.text, focus: [vi, 'TJ'], slam: { spray: 'VOTED IN', color: '#ffd21a' }, chip: [vi, 'VOTED IN'] });
        } else linesToSteps(S, [l], { names, sceneWho: [vi, 'TJ'] });
      });
    }
  }
}

// ── the Arena ─────────────────────────────────────────────────────────
function buildArena(S, open, items, row, { names, house, goneAt }) {
  open('arena');
  const co = items.find(x => x.a.kind === 'callout');
  const ar = items.find(x => x.a.kind === 'arena');
  const at = co || ar;
  S.at(at.i);
  const a = co?.a.who[0] || ar?.a.who[0], b = co?.a.who[1] || ar?.a.who[1];
  const duel = (row.ch?.duels || []).find(d => (d.a === a && d.b === b) || (d.a === b && d.b === a)) || null;
  const here = house.filter(n => !goneAt[at.i]?.has(n) && n !== a);
  const key = plateKey(ARENA_STAGE.plate, true);
  const crowd = here.filter(n => n !== b);
  const cast = { TJ: ['host'], [a]: ['gate'], ...placeScene(key, [b, ...crowd], { group: 'house' }) };
  S.push({ scene: { plate: key, place: 'The Arena', when: whenOf(S.day, S.min), icon: 'skull', island: 'arena', cast, hidden: [a], wipe: 1, embers: 1 },
    seg: ['Elimination', 'The Arena'], sceneIdx: at.i, title: 'The Arena' });
  S.push({ dir: 'The house is in the stand and the torches are lit. TJ hits the gong.', focus: ['TJ'], gong: 1 });
  S.push({ enter: { [a]: ['podium', 0, 'L'] }, dir: `${a} walks out of the gate and takes the left podium.`, focus: [a] });
  if (co) {
    const lines = co.a.lines;
    if (!lines.some(l => l.by === HOST)) S.push({ tj: fill(pickBy(TJ_ARENA_ASK, `${row.num}|${a}`), { a }), focus: [a, 'TJ'] });
    const named = lines.findIndex(l => l.by === a && l.kind === 'say' && new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(l.text));
    const callAt = named >= 0 ? named : lines.findIndex(l => l.by === a && l.kind === 'say');
    lines.forEach((l, k) => {
      if (k === callAt) S.push({ say: [l.by, l.text], focus: [a], slam: { spray: 'CALLED OUT', color: '#ff6a1a' }, act: { [b]: 'flinch' }, chip: [b, 'CALLED OUT'],
        know: REASON[co.a.data?.reason] ? [`Why ${b}`, REASON[co.a.data.reason](a, b) + (co.a.data?.votedMe ? ` And <b>${esc(b)}</b> voted for ${esc(a)}.` : '')] : null });
      else linesToSteps(S, [l], { names, sceneWho: [a, b, 'TJ'] });
    });
    S.push({ enter: { [b]: ['podium', 0, 'R'] }, dir: `${b} comes down from the stand and takes the right podium.`, focus: [b] });
  }
  if (!ar || !duel) return;
  const g = arenaDef(duel.game);
  const { pre, post } = splitAtResult(ar.a.lines, duel);
  linesToSteps(S, pre, { names, sceneWho: [a, b, 'TJ'] });
  S.push({ rules: { k: "TONIGHT'S ELIMINATION", n: duel.name, li: rulesOf(g?.desc), f: 'The loser goes home' }, tj: pre.some(l => l.by === HOST) ? null : fill(pickBy(TJ_ARENA_RULES, `${row.num}|${duel.game}`), { game: duel.name }), focus: ['TJ'], props: ARENA_PLAY[duel.game]?.set({}) || [] });
  playDuel(S, duel, `${row.num}|${duel.game}`);
  finishDuel(S, duel, post, names, `${row.num}|${duel.game}`);
}

// A game's lines: what is said before it is played, and the result with everything after. The result is
// the first stage direction that names the winner (or the first one at all), else the first line that does.
function splitAtResult(lines, duel) {
  const w = duel.winner;
  const nm = x => new RegExp(`\\b${String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  let at = lines.findIndex(l => l.kind === 'beat' && nm(w).test(l.text));
  if (at < 0) at = lines.findIndex(l => l.kind === 'beat');
  if (at < 0) at = lines.findIndex((l, k) => k > 0 && (nm(w).test(l.text) || nm(duel.loser).test(l.text)) && l.kind !== 'conf');
  if (at < 0) at = lines.length;
  return { pre: lines.slice(0, at), post: lines.slice(at) };
}

// A duel's play, from its beats: rounds, stages of a race, or holding on, each in the game's own terms
// (play.js ARENA_PLAY), with its set on the floor changing as it goes (the pole tilts, crates break, tiles
// are laid, barrels go up the ramp).
const POSE = { 'pole-grapple': 'pull', 'tug-pit': 'pull', 'hallway-hustle': 'run', 'ball-brawl': 'run', 'barrel-ramp': 'pull', 'memory-swim': 'swim' };
const SET_MAX = { 'puzzle-pit': 12, 'ram-wall': 6, 'memory-swim': 8, 'barrel-ramp': 10, 'spin-stack': 10, 'knot-bomb': 12 };
function setState(duel, prog, extra = {}) {
  const { a, b } = duel, max = SET_MAX[duel.game] || 12;
  const n = x => Math.round(Math.max(0, Math.min(12, prog[x] || 0)) / 12 * max);
  return { nL: n(a), nR: n(b), ...extra };
}
function playDuel(S, duel, seed) {
  const { a, b } = duel;
  const AP = ARENA_PLAY[duel.game] || null;
  const format = duel.beats[0]?.kind || 'stage';
  const pose = POSE[duel.game];
  S.push({ move: { [a]: ['duel', 0, 'L'], [b]: ['duel', 0, 'R'] }, tj: pickBy(TJ_GO, seed), gong: 1, focus: [a, b], cam: [.5, .6, 1.2],
    duel: { a, b, format, score: { [a]: 0, [b]: 0 }, prog: { [a]: 0, [b]: 0 }, max: format === 'round' ? Math.max(...duel.beats.map(x => Math.max(...Object.values(x.score || { x: 0 })))) : 12 },
    hang: format === 'hold' ? 'duel' : null, pose: pose ? { [a]: pose, [b]: pose } : null, props: AP ? AP.set(setState(duel, {})) : null });
  let prev = null, prog = { [a]: 0, [b]: 0 };
  duel.beats.forEach((bt, k) => {
    if (bt.kind === 'finish') return;
    const w = bt.winner || bt.ahead;
    const l = w === a ? b : a;
    let text;
    if (AP && bt.kind === 'round' && AP.round) text = fill(pickBy(AP.round, seed + k), { w, l, n: bt.n });
    else if (AP && bt.kind === 'stage' && AP.stage) text = fill(pickBy(AP.stage[Math.min(k, AP.stage.length - 1)], seed + k), { w, l });
    else if (AP && bt.kind === 'hold' && AP.hold) text = fill(AP.hold[Math.min(k, AP.hold.length - 1)], { w, l });
    else if (bt.kind === 'round') text = fill(pickBy(bt.margin < .3 ? DUEL.rounds.close : DUEL.rounds.win, seed + k), { w, n: bt.n });
    else if (bt.kind === 'hold') text = fill(pickBy(bt.margin < .3 ? DUEL.hold.close : DUEL.hold.hold, seed + k), { w });
    else text = fill(pickBy(prev && prev !== w ? DUEL.stage.swap : bt.margin < .2 ? DUEL.stage.close : DUEL.stage.ahead, seed + k), { w });
    prev = w;
    prog = { [w]: Math.min(11, Math.round((k + 1) * 3.2 + bt.margin * 1.5)), [l]: Math.min(10, Math.round((k + 1) * 3.2 - bt.margin * 2.5)) };
    const tilt = w === a ? -18 : 18, ball = w === a ? -.8 : .8, sag = w === a ? 18 : 42;
    S.push({ dir: text, focus: [w, l], act: { [w]: bt.kind === 'hold' ? 'look' : 'cheer', [l]: 'flinch' }, cam: [w === a ? .44 : .56, .6, 1.28],
      duel: { a, b, format: bt.kind, score: bt.score ? { ...bt.score } : null, prog: { ...prog }, ahead: w }, dig: bt.kind === 'stage' && duel.game === 'puzzle-pit' ? [a, b] : null,
      props: AP ? AP.set(setState(duel, prog, { tilt, ball, sag, low: k + 1 })) : null, shake: bt.kind === 'round' ? 1 : 0 });
  });
  S._lastProg = prog;
}
function finishDuel(S, duel, lines, names, seed) {
  const { a, b, winner: w, loser: l } = duel;
  const fin = { a, b, format: duel.beats[0]?.kind || 'stage', score: duel.beats.filter(x => x.score).slice(-1)[0]?.score || null, prog: { [w]: 12, [l]: Math.max(6, (S._lastProg?.[l] || 8)) }, done: w };
  const beat = lines[0]?.kind === 'beat' ? 0 : -1;
  const AP = ARENA_PLAY[duel.game] || null;
  const done = { [w === a ? 'done' : 'doneR']: 1, done: w === a ? 'L' : 'R' };
  const first = { slam: { winner: `${w} wins` }, focus: [w], act: { [w]: 'cheer' }, shake: 1, duel: fin, cam: [w === a ? .44 : .56, .58, 1.3], drop: fin.format === 'hold' ? [l] : null,
    props: AP ? AP.set(setState(duel, fin.prog, { ...done, tilt: w === a ? -30 : 30, ball: w === a ? -1 : 1, sag: w === a ? 10 : 50, low: 4 })) : null };
  // the game's own finish ("locks the board and hits the buzzer"), then the engine's word on how it went
  if (AP?.finish) { S.push({ ...first, dir: fill(AP.finish, { w, l }) }); if (beat >= 0) S.push({ dir: lines[beat].text, focus: [w] }); }
  else if (beat >= 0) { first.dir = lines[beat].text; S.push(first); }
  else S.push({ ...first, dir: `${w} wins it.` });
  let stamped = false;
  lines.forEach((x, k) => {
    if (k === beat) return;
    if (!stamped && x.by === HOST && new RegExp(`\\b${l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(x.text)) {
      stamped = true;
      S.push({ tj: x.text, slam: { stamp: 'ELIMINATED' }, focus: [l], act: { [l]: 'slump' } });
    } else linesToSteps(S, [x], { names, sceneWho: [a, b, 'TJ'] });
  });
  if (!stamped) S.push({ tj: fill(pickBy(TJ_ARENA_OUT, seed), { b: l }), slam: { stamp: 'ELIMINATED' }, focus: [l], act: { [l]: 'slump' } });
  S.push({ exit: [l], dir: `${l} walks back out through the gate.`, focus: [w] });
}

// ── the final ─────────────────────────────────────────────────────────
function buildFinal(S, open, key, items, row, { names, house }) {
  const f = row.ch?.final || {};
  open(key);
  const finalists = f.finalists || house;
  const seed = `final|${row.num}`;
  const scoreOf = id => (f.checkpoints || []).find(c => c.id === id)?.scores || {};
  const board = (id, k) => { const sc = scoreOf(id); const order = Object.keys(sc).sort((x, y) => sc[y] - sc[x]); return order.slice(0, 6).map((n, i) => ({ who: [n], p: Math.min(1, k * (1.1 - i / Math.max(1, order.length) * .6)) })); };
  const checkpoint = (id, night = false) => {
    const st = FINAL_STAGE[id];
    const sc = scoreOf(id); const order = Object.keys(sc).sort((x, y) => sc[y] - sc[x]);
    if (!order.length) return;
    const pk = plateKey(st.plate, night);
    S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: placeScene(pk, order), wipe: 1 }, seg: ['The final', st.name] });
    S.push({ rules: { k: 'THE FINAL', n: st.name, li: st.rules, f: 'Every second counts toward the total' } });
    S.push({ race: board(id, .4), dir: `${order[0]} is out in front.`, focus: [order[0]] });
    S.push({ race: board(id, .75), dir: `${order[order.length - 1]} is falling behind.`, focus: [order[order.length - 1]], act: { [order[order.length - 1]]: 'slump' } });
    S.push({ race: board(id, 1), dir: `${order[0]} finishes ${st.name} first.`, focus: [order[0]], act: { [order[0]]: 'cheer' } });
  };
  for (const it of items) {
    const a = it.a;
    S.at(it.i);
    if (a.kind === 'final-start') {
      const st = FINAL_STAGE.start, pk = plateKey(st.plate, false);
      S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...placeScene(pk, finalists) }, wipe: 1 }, seg: ['The final', 'The Final'], sceneIdx: it.i, title: it.title });
      linesToSteps(S, a.lines, { names, sceneWho: ['TJ', ...finalists] });
      checkpoint('cp1');
      continue;
    }
    if (a.kind === 'instant-elimination') {
      const st = FINAL_STAGE.instant, pk = plateKey(st.plate, false);
      const [x, y] = a.who;
      const duel = (f.instant || []).find(d => [d.a, d.b].includes(x) && [d.a, d.b].includes(y));
      S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...placeScene(pk, [x, y]) }, wipe: 1 }, seg: ['Surprise', 'Instant Elimination'], sceneIdx: it.i, title: it.title });
      const def = duel ? arenaDef(duel.game) : null;
      if (duel) {
        const { pre, post } = splitAtResult(a.lines, duel);
        linesToSteps(S, pre, { names, sceneWho: [x, y, 'TJ'] });
        S.push({ rules: { k: 'INSTANT ELIMINATION', n: duel.name, li: rulesOf(def?.desc), f: 'The loser leaves the final now' }, props: ARENA_PLAY[duel.game]?.set({}) || [] });
        playDuel(S, duel, seed + x);
        finishDuel(S, duel, post, names, seed + x);
      } else linesToSteps(S, a.lines, { names, sceneWho: [x, y, 'TJ'] });
      continue;
    }
    if (a.kind.startsWith('overnight')) {
      const st = FINAL_STAGE.overnight, pk = plateKey(st.plate, true);
      if (!S._night) {
        S._night = 1; S.min = Math.max(S.min, 21 * 60 + 30);
        S.nightDay = S.day;
        const still = finalists.filter(n => !(f.instant || []).some(d => d.loser === n));
        S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'fire', island: st.spot, cast: placeScene(pk, still, { group: 'stumps' }), wipe: 1, embers: 1 }, seg: ['The final', 'The Overnight'], sceneIdx: it.i, title: it.title });
        S.push({ rules: { k: 'THE OVERNIGHT', n: 'The Box', li: ['Each finalist has a box full of tiles to empty, and the fastest at checkpoint one go first.',
          'Emptying it first wins a chair, a pillow or a blanket for the night.', 'The first ones out also get to dump extra tiles into somebody else\'s box.',
          'Then nobody sleeps. Anybody who quits in the night is out of the final.'], f: 'The night counts toward the total' } });
      }
      linesToSteps(S, a.lines, { names, sceneWho: a.who, first: { sceneIdx: it.i, title: it.title } });
      if (a.kind === 'overnight-quit') S.push({ exit: [a.who[0]], dir: `${a.who[0]} walks out of the camp. The final is over for ${a.who[0]}.`, focus: [] });
      continue;
    }
    if (a.kind.startsWith('final-pact')) {
      if (!S._day2) { S._day2 = 1; checkpointOpen(); }
      S.min += 20;
      linesToSteps(S, a.lines, { names, sceneWho: a.who, first: { sceneIdx: it.i, title: it.title } });
      continue;
    }
    if (a.kind === 'champions') {
      if (!S._day2) { S._day2 = 1; checkpointOpen(); }
      S.min = Math.max(S.min + 40, 11 * 60);
      checkpoint('cp3');
      const st = FINAL_STAGE.finish, pk = plateKey(st.plate, false);
      const champs = f.champions || a.who;
      S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, Math.max(S.min, 14 * 60)), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...placeScene(pk, champs) }, wipe: 1 }, sceneIdx: it.i, title: it.title });
      const lines = a.lines;
      const call = lines.findIndex(l => l.by === HOST);
      lines.forEach((l, k) => {
        if (k === call) S.push({ tj: l.text, slam: { winner: `${nameList(champs)} ${champs.length > 1 ? 'are' : 'is'} the champions` }, focus: champs, act: Object.fromEntries(champs.map(n => [n, 'cheer'])), gong: 1, shake: 1, confetti: 1, power: champs });
        else linesToSteps(S, [l], { names, sceneWho: [...champs, 'TJ'] });
      });
      continue;
    }
  }
  function checkpointOpen() { S.day = (S.nightDay ?? S.day) + 1; S.min = 8 * 60 + 30; checkpoint('cp2'); }
}

// ── the transcript of the steps (the text backlog prints exactly this) ─
export function chStepText(row) {
  const out = [];
  for (const scr of chStepScreens(row)) {
    out.push('', `== ${scr.label.toUpperCase()} ==`);
    for (const s of scr.steps) {
      if (s.scene && s.scene.place && !s.map) out.push(`[${s.scene.place}${s.scene.when ? ' — ' + s.scene.when.replace(/<[^>]+>/g, '') : ''}]`);
      if (s.seg) out.push(`${s.seg[0]}: ${s.seg[1]}`);
      if (s.rules) { out.push(`${s.rules.n}:`); for (const li of s.rules.li) out.push(`  - ${li.replace(/<[^>]+>/g, '')}`); out.push(`  (${s.rules.f})`); }
      if (s.tj) out.push(`TJ: ${s.tj}`);
      if (s.say) out.push(`${s.say[0]}: ${s.say[1]}`);
      if (s.conf) out.push(`${s.conf[0]} [confessional]: ${s.conf[1]}`);
      if (s.dir) out.push(`(${s.dir})`);
    }
  }
  return out.join('\n').trim();
}
