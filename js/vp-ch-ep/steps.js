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
import { marksOf, plateKey, lineup, hostSide, sizeAt, teamColour } from './ground.js';
import { BEAT_PLAYS } from './daily-play.js';
import { episodeScenes } from '../ch/transcript.js';
import { SHOWS } from '../shows.js';
import { dailyPlay, ARENA_PLAY } from './play.js';
import { DAILY_VOICE, ARENA_VOICE, speak, tjLine } from './voices.js';
import { pronouns } from '../players.js';
import { cpLines, podiumLines } from '../ch/script/final-cp.js';
import { rankLines } from '../ch/script/rankings.js';
import { DAILY_STAGE, FINAL_STAGE, ARENA_STAGE, rulesOf, dailyDef, arenaDef, pickBy, nameList, fill,
  TJ_DAILY_OPEN, TJ_DAILY_NIGHT, TJ_GO, TJ_WELCOME, TJ_FIRST_DAILY, TJ_LANDING, TJ_SPEECH, TJ_ARENA_ASK, TJ_ARENA_RULES, TJ_ARENA_OUT, PLAY, DUEL } from './games.js';

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
  lookout: { plate: 'lookout', place: 'The Lookout', room: null, island: 'lookout', icon: 'island' },
  // Redemption House (redemption.js): the shack in the jungle, the user's set (job G15)
  redemption: { plate: 'redemption', place: 'Redemption House', room: null, island: 'lookout', icon: 'skull', hour: 'night' },
  final: { plate: 'field', place: 'The Final', room: null, island: 'beach-field', icon: 'island' },
  // a Pairs season's pairs (ch/pairs.js): named at the airstrip, or drafted off the premiere daily on the beach
  airstrip: { plate: 'airstrip', place: 'The Airstrip', room: null, icon: 'island' },
  challenge: { plate: 'beach', place: 'The Beach', room: null, island: 'beach', icon: 'island' },
};
// Somewhere quiet: by day the lookout or the bedroom, by night the pool or the beach.
const QUIET_DAY = [{ plate: 'lookout', place: 'The Lookout', island: 'lookout', icon: 'island' }, { plate: 'bunks', place: 'The Bedroom', room: 'bunk-b', icon: 'house' }];
const QUIET_NIGHT = [{ plate: 'pooldeck', place: 'The Pool', room: 'pool', icon: 'house' }, { plate: 'beach', place: 'The Beach', island: 'beach', icon: 'island' },
  { plate: 'hottub', place: 'The Hot Tub', room: 'hottub', icon: 'house', water: 1 }];

// Scenes that happen at night.
const NIGHT = new Set(['party', 'party-callout', 'party-slip', 'party-deal', 'party-tears', 'expelled-goodbye', 'fight', 'fight-physical', 'hot-tub-truths', 'arena-eve-pep', 'arena-eve-alone', 'arena-eve-confront', 'spark', 'flirt', 'pda']);
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
    // the morning after an Arena (moved to the next day above): breakfast time, a scene every twenty minutes,
    // not spread out to midnight (a lone one landed at 3:55 PM)
    const morning = out[i].day > aired[i].day;
    for (let k = i; k < j; k++) {
      t = morning ? 8 * 60 + 20 * (k - i + 1) : Math.max(t + 10, prev + Math.round(gap * (k - i + 1) / (n + 1) / 5) * 5);
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

// Where a scene is staged, one answer for the map's bubble and for the stage (the user, 2026-10-15: "I
// clicked a bubble in the pool but I'm finding myself in the lookout"). A private talk goes somewhere quiet
// for the hour; a pep talk before the Arena is on the beach.
function stageOf(a, min) {
  const night = isNight(min);
  let place = PLACE[a.spot] || null;
  if (a.kind === 'arena-eve-pep') place = { plate: night ? 'beach' : 'sunset', place: 'The Beach', island: 'beach', icon: 'island' };
  // the Redemption residents fight in the Arena, not in the shack
  if (a.kind === 'redemption-duel') place = PLACE.arena;
  // TJ gathering the house at the villa gathers it in the common room, sat on the sofa (the user, 2026-10-17: after a
  // disqualification TJ addressed everybody by the pool); at the Arena, the club or a daily he stays where he is
  if (TJ_TO_HOUSE.has(a.kind) && (!a.spot || ['villa', 'pool', 'kitchen', 'beach', 'gym', 'bedroom', 'private'].includes(a.spot))) place = PLACE.public;
  if (!place || a.spot === 'private') place = pickBy(night ? QUIET_NIGHT : QUIET_DAY, `${a.kind}|${a.day}|${a.who.join()}`);
  return place;
}

// Which chapter of the episode a scene belongs to (one VP screen per run of them).
const DAILY_KINDS = new Set(['purge', 'daily', 'daily-clutch', 'daily-choke', 'partner-draw', 'partner-pick', 'partner-blame', 'partner-carried', 'team-blame', 'picked-last', 'throw', 'throw-caught']);
const FINAL_KINDS = new Set(['champion-reflect', 'final-start', 'final-cp', 'instant-elimination', 'final-lastword', 'overnight', 'overnight-sabotage', 'overnight-quit', 'overnight-talk', 'final-pact-help', 'final-pact-broken', 'final-podium', 'champions', 'final-congrats',
  'share-keep-rules', 'share-keep']);
// a Pairs season's Arena: the pair call-out, the two-on-two, inside each pair after it, a Pick season's swap
const PAIR_ARENA = new Set(['pair-callout', 'pair-arena', 'pair-arena-blame', 'pair-arena-win', 'pair-swap']);
function chapterOf(a) {
  if (a.kind === 'previously') return 'open';
  if (a.kind === 'arrival') return 'arrival';
  if (a.kind === 'pairs-revealed' || a.kind === 'pair-reveal') return 'pairs';
  // a Teams season (ch/teams.js): the teams named; the huddle before the vote (what the team says after it is the
  // villa's, as after-vote is: the ceremony ends its screen); a switch at the Arena
  if (a.kind === 'teams-revealed' || a.kind === 'team-reveal' || a.kind === 'team-captain') return 'teams';
  if (a.kind === 'team-huddle' || a.kind === 'team-only-one') return 'vote';
  if (a.kind === 'team-switch' || a.kind === 'team-fold') return 'arena';
  // said at the Arena between the call-out and the duel (director.js arenaNightTogether)
  if (a.kind === 'empty-threat') return 'arena';
  if (PAIR_ARENA.has(a.kind)) return 'arena';
  if (a.kind === 'pair-volunteer' || a.kind === 'pair-volunteer-refused') return 'vote';
  if (a.kind === 'pair-eve') return 'eve';
  if (a.kind === 'share-keep-rules' || a.kind === 'share-keep') return 'champions';
  if (a.kind === 'villa-reveal') return 'reveal';
  if (DAILY_KINDS.has(a.kind)) return 'daily';
  if (a.spot === 'party' || a.kind === 'party' || a.kind === 'fight' || a.kind === 'fight-physical') return 'party';
  if (a.kind === 'ceremony' || a.kind === 'volunteer' || a.kind === 'house-debate' || a.kind === 'arena-reveal' || a.kind.startsWith('tribunal-')) return 'vote';
  if (a.kind.startsWith('arena-eve')) return 'eve';
  if (a.kind === 'callout' || a.kind === 'arena' || a.kind === 'arena-goodbye') return 'arena';
  if (a.kind === 'return-arena') return 'return';
  if (a.kind === 'final-start' || a.kind === 'pass-cut') return 'final-start';
  if (a.kind === 'final-cp') return a.data?.day === 2 ? 'final-day2' : 'final-start';
  if (a.kind === 'final-lastword') return a.data?.when === 'instant' ? 'instant' : 'champions';
  if (a.kind === 'final-podium' || a.kind === 'final-congrats' || a.kind === 'champion-reflect') return 'champions';
  if (a.kind.startsWith('redemption-') && a.kind !== 'redemption-return') return 'redemption';
  if (a.kind === 'instant-elimination') return 'instant';
  if (a.kind.startsWith('overnight')) return 'overnight';
  if (a.kind.startsWith('final-pact')) return 'final-day2';
  if (a.kind === 'champions') return 'champions';
  return 'villa';
}
const LABEL = { return: 'The return', arrival: 'The arrival', reveal: 'The villa', open: 'Previously', daily: 'The daily', villa: 'The villa', party: 'Night out', vote: 'The vote', eve: 'The night before',
  arena: 'The Arena', 'final-start': 'The final: day one', instant: 'Instant elimination', overnight: 'The overnight', 'final-day2': 'The final: day two',
  champions: 'The finish line', redemption: 'Redemption House', pairs: 'The pairs', teams: 'The teams' };

// ── placing people on a plate ─────────────────────────────────────────
// Extra places when a plate has fewer marks than people: between and just behind its own.
function crowdSlots(base, n, { seated = false } = {}) {
  if (seated) {
    // a full sofa: people squeeze in between the ones already sitting, on the same cushions
    const src = [...base].sort((x, y) => x.u - y.u);
    const out = [];
    for (let i = 0; i + 1 < src.length && out.length < n; i++) {
      const a = src[i], b = src[i + 1];
      if (Math.abs(a.v - b.v) < .06 && Math.abs(a.u - b.u) < .16) out.push({ u: (a.u + b.u) / 2, v: (a.v + b.v) / 2 + .004, s: Math.min(a.s || .08, b.s || .08) * .96 });
    }
    if (out.length >= n) return out.slice(0, n);
    return [...out, ...crowdSlots(base, n - out.length)];
  }
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
export function placeScene(key, people, { group = null, crowd = [], keep = null } = {}) {
  if (!group && people.length > 6) {
    const slots = lineup(key, people.length);
    return Object.fromEntries(people.map((n, i) => [n, slots[i]]));
  }
  const ms = marksOf(key);
  const stands = ms.filter(m => m.kind === 'stand' && !m.group);
  const seats = ms.filter(m => m.kind === 'seat' && (!group || m.group === group));
  const spec = {};
  // a group (the sofa, the Arena's stand) keeps to its own seats and stands; the plate's open spots are for others.
  // `keep` leaves some of the group's stand marks free (a Teams Arena: the other team's side); indexes stay the plate's.
  const allGStands = group ? ms.filter(m => m.kind === 'stand' && m.group === group) : [];
  const gStands = keep ? allGStands.filter(keep) : allGStands;
  const pool = group ? [...seats.map((m, i) => ({ m, sp: ['seat', i, m.group] })), ...gStands.map(m => ({ m, sp: ['stand', allGStands.indexOf(m), group] })), ...(gStands.length || seats.length ? [] : stands.map((m, i) => ({ m, sp: ['stand', i] })))]
    : [...stands.map((m, i) => ({ m, sp: ['stand', i] })), ...ms.filter(m => m.kind === 'seat').map(m => ({ m, sp: ['seat', ms.filter(x => x.kind === 'seat' && x.group === m.group).indexOf(m), m.group] }))];
  const central = [...pool].sort((a, b) => (Math.abs(a.m.u - .5) - a.m.v * .6) - (Math.abs(b.m.u - .5) - b.m.v * .6));
  // a few people take one row of the plate, the most central marks of it, so nobody stands half behind
  // somebody else (the gym, the pool deck: two of three on top of each other)
  const rows = [];
  // a group with seats (the sofa) sits: its rows are its seats, never the open floor
  const rowPool = group && seats.length ? pool.filter(x => x.sp[0] === 'seat') : pool;
  for (const x of [...rowPool].sort((a, b) => b.m.v - a.m.v)) { const r = rows.find(r => Math.abs(r[0].m.v - x.m.v) < .05); if (r) r.push(x); else rows.push([x]); }
  const row = people.length <= 6 ? rows.filter(r => r[0].m.v <= .9).find(r => r.length >= people.length) : null;
  // seats: the longest row, and neighbours on it (a conversation sits together, not at both ends of the sofa)
  let seated = null;
  if (group && seats.length && people.length <= 6) {
    const best = [...rows].sort((x, y) => y.length - x.length)[0];
    if (best && best.length >= people.length) {
      const line = [...best].sort((x, y) => x.m.u - y.m.u);
      let pick = null, score = Infinity;
      for (let i = 0; i + people.length <= line.length; i++) {
        const w = line.slice(i, i + people.length);
        const span = w[w.length - 1].m.u - w[0].m.u, mid = (w[0].m.u + w[w.length - 1].m.u) / 2;
        const sc = span + Math.abs(mid - .5) * .5;
        if (sc < score) { score = sc; pick = w; }
      }
      seated = pick;
    }
  }
  const front = (seated || (row ? [...row].sort((a, b) => Math.abs(a.m.u - .5) - Math.abs(b.m.u - .5)).slice(0, people.length) : central.slice(0, people.length))).sort((a, b) => a.m.u - b.m.u);
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
  const slots = [...rest.map(x => x.sp), ...crowdSlots(base.length ? base : [{ u: .5, v: .75, s: .1 }], Math.max(0, extra.length - rest.length), { seated: !!group && seats.length > 0 })];
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
    if (a.kind === 'pair-arena') (a.data?.losers || []).forEach(n => gone.add(n));
    if (a.kind === 'partner-left') a.who.slice(0, 1).forEach(n => gone.add(n));
    if (['quit', 'medical', 'disqualified', 'overnight-quit'].includes(a.kind)) a.who.slice(0, 1).forEach(n => gone.add(n));
    if (a.kind === 'instant-elimination') { const w = a.data?.winner; (a.data?.losers || a.who.filter(n => n !== w)).forEach(n => gone.add(n)); }
    if (a.kind === 'purge') (a.data?.pair ? a.who.slice(0, 2) : a.who.slice(0, 1)).forEach(n => gone.add(n));
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
        else if ((a === 'hug' || a === 'kiss') && who.length >= 2) { step.embrace = who.slice(0, 2); step.act = Object.fromEntries(who.slice(0, 2).map(n => [n, 'hug'])); if (a === 'kiss') step.fx = { heart: who.slice(0, 2) }; }
        else if (a === 'hug' || a === 'kiss') step.act = { [who[0]]: 'lean' };
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
  // in the common room people sit on the sofa (the user, 2026-10-15: "they don't sit")
  if (group === 'none') group = null;
  else if (!group && place.plate === 'common') group = 'sofa';
  // (a scene's `away` people are talked about, not there: ch/transcript.js airedOf)
  const who = (a?.who || []).filter(n => n && n !== HOST && !(a?.away || []).includes(n));
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
  promise: (a, b) => `<b>${esc(a)}</b> told the house at the vote it would be <b>${esc(b)}</b>, and kept that promise.`,
  shot: (a, b) => `A game move. <b>${esc(a)}</b> went after <b>${esc(b)}</b>, the biggest threat to ${esc(a)}'s game, knowing it could be the harder fight.`,
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
  const pron = {};
  for (const n of house) { try { pron[n] = pronouns(n); } catch { /* no record */ } }
  const V = { used: new Set(), ties: ch.ties || {}, seed: `v${row.num}`, pron };
  let cur = null;
  const times = clockOf(aired, DAILY_STAGE[ch.daily?.id]?.hour === 'night');
  const S = {
    num: row.num,
    day: aired[0]?.day ?? row.day ?? 1, min: 8 * 60,
    V: null,
    push(step) {
      if (step.scene && this.pairMap && !step.scene.pairs) step.scene.pairs = this.pairMap;
      if (step.scene && this.teamMap && !step.scene.teams) { step.scene.teams = { ...this.teamMap }; step.scene.teamNames = { ...this.teamNames }; }
      // the switch recolours its player for the rest of the episode (later scenes are built after it)
      if (step.reband && this.teamMap) for (const [n, t] of Object.entries(step.reband)) { if (t) { this.teamMap[n] = teamColour(t); this.teamNames[n] = t; } else { delete this.teamMap[n]; delete this.teamNames[n]; } }
      cur.steps.push(step); return step;
    },
    last() { return cur.steps[cur.steps.length - 1]; },
    // the scene at airing index i: its day and time
    at(i) { const c = times[i]; if (c) { this.day = c.day; this.min = c.min; } },
  };
  S.V = V;
  // a Pairs season: who is whose partner this episode. The pairs as it began, then as it ended on top (a swap shows):
  // the end alone has no entry for the pair that went home tonight, and the vote's board showed one of them (the
  // user, 2026-10-18: "the dialogue box at the right doesn't show the pair, only 1 person, when counting")
  // ...and in the premiere the pairs are made during the episode, so the night's own record fills them in: every ballot
  // names a pair, and the Arena's two sides are pairs
  const named = [...(ch.votes || []).flatMap(v => (v.ballots || []).map(b => b.pair)), ...(ch.arena || []).flatMap(d => [d.pairA, d.pairB])]
    .filter(p => Array.isArray(p) && p.length === 2);
  const pairList = ch.pairs || named.length ? [...named, ...(ch.pairs?.start || []), ...(ch.pairs?.end || [])] : [];
  const podium = ch.final?.pairPodium ? Object.values(ch.final.pairPodium).flat() : [];
  S.pairMap = pairList.length || podium.length ? Object.fromEntries([...podium, ...pairList].flatMap(([x, y]) => [[x, y], [y, x]])) : null;
  // a Teams season: each player's team colour this episode, as the episode BEGAN (a switch recolours its player at the
  // switch: the user, 2026-10-17); none after the break-up (the break-up step clears it). Each team keeps one colour.
  const teamList = ch.teams?.start?.length ? ch.teams.start : ch.teams?.end || null;
  S.teamMap = teamList ? Object.fromEntries(teamList.flatMap(t => t.members.map(n => [n, teamColour(t.name)]))) : null;
  S.teamNames = teamList ? Object.fromEntries(teamList.flatMap(t => t.members.map(n => [n, t.name]))) : null;
  S.teamList = teamList;
  const open = (key, label) => { cur = { id: `${key}-${screens.length}`, key, label: label || LABEL[key] || 'The villa', steps: [] }; screens.push(cur); };

  // Group the aired scenes into chapters, in airing order.
  const chunks = [];
  let seenDaily = false;
  aired.forEach((a, i) => {
    let k = chapterOf(a);
    if (k === 'daily' && a.kind !== 'daily' && seenDaily && chunks[chunks.length - 1]?.key !== 'daily') k = 'villa';
    // TJ's name gag right after the daily is at the daily
    if (a.kind === 'run-name' && chunks[chunks.length - 1]?.key === 'daily') k = 'daily';
    if (a.kind === 'daily') seenDaily = true;
    // a Teams season's choice after the Arena (switch or stay) and a team folding belong on the Arena screen, in front of
    // both teams (the user, 2026-10-17: "at the arena for the choice switch or not we need to see every team")
    // (the choice goes on its own duel's screen: on a double elimination, the duel its chooser won)
    if (['team-switch', 'team-stay', 'team-fold'].includes(a.kind)) {
      const arenas = [...chunks].reverse().filter(c => c.key === 'arena');
      const own = arenas.find(c => c.items.some(j => aired[j].kind === 'arena' && aired[j].data?.winner === a.who[0])) || arenas[0];
      if (own) {
        // whatever aired between the duel and the choice (the bank changing hands, a storyline beat) comes along, in order
        const from = chunks.indexOf(own);
        for (const c of chunks.slice(from + 1)) { if (c.key === 'arena') continue; own.items.push(...c.items); c.items = []; }
        for (let j = chunks.length - 1; j > from; j--) if (!chunks[j].items.length) chunks.splice(j, 1);
        own.items.push(i); own.items.sort((x, y) => x - y);
        return;
      }
    }
    // the goodbye belongs to its own duel's screen, whatever aired in between (bank, skull)
    if (a.kind === 'arena-goodbye') { const own = [...chunks].reverse().find(c => c.key === 'arena' && c.items.some(j => (aired[j].kind === 'arena' && aired[j].data?.loser === a.data?.loser) || (aired[j].kind === 'pair-arena' && (aired[j].data?.losers || []).includes(a.data?.loser)))); if (own) { own.items.push(i); return; } }
    // the villa and the villa reveal are one screen, however they're interleaved; a night out is its own
    // (the user, 2026-10-16: "most of the time I don't see a night out, where is it supposed to be?")
    const LIFE = ['villa', 'reveal', 'eve'];
    // a scene that happens in the middle of the night out (a showmance at the bar) stays on the night out's screen
    if (k === 'villa' && chunks[chunks.length - 1]?.key === 'party' && aired.slice(i + 1, i + 3).some(x => chapterOf(x) === 'party')) k = 'party';
    if (LIFE.includes(k) && LIFE.includes(chunks[chunks.length - 1]?.key)) { chunks[chunks.length - 1].items.push(i); return; }
    if (k === 'eve') { chunks.push({ key: 'villa', items: [i] }); return; }   // the night before opens a villa screen, never its own
    const last = chunks[chunks.length - 1];
    if (last && last.key === k && k !== 'arena') last.items.push(i);
    // the call-out, what is said at the Arena before the duel, and the duel are one screen
    else if (last && k === 'arena' && last.key === 'arena' && (aired[last.items[last.items.length - 1]].kind === 'callout' || a.kind === 'arena-goodbye'
      || (last.items.some(j => aired[j].kind === 'callout') && !last.items.some(j => aired[j].kind === 'arena')))) last.items.push(i);
    // a pair's Arena is one screen: the call-out, the two-on-two, and what the pairs say after it
    else if (last && k === 'arena' && last.key === 'arena' && aired[last.items[0]].kind === 'pair-callout' && ['pair-arena', 'pair-arena-blame', 'pair-arena-win', 'pair-swap', 'bank-taken', 'pass-earned', 'empty-threat'].includes(a.kind)) last.items.push(i);
    else chunks.push({ key: k, items: [i] });
  });

  // The show open runs at the top of every episode, before "previously" (the premiere has none).
  open('open', aired.some(a => a.kind === 'previously') ? 'Previously' : 'Season premiere');
  S.push({ scene: { plate: plateKey('opener', false), place: 'Blue Lagoon', when: `<b>Episode ${esc(row.num)}</b>`, icon: 'island', island: 'villa', cast: {}, wipe: 0 },
    open: { cast: house.slice(0, 20), season: ctx.season || null, title: ctx.title || 'Blue Lagoon' } });
  let dailyDone = false;

  // A villa screen says WHEN it is (the user, 2026-10-15: the screen list read thin, five screens all
  // called "The villa"): before the daily, before the vote, the night after it, between two duels, after.
  // a vote chapter counts as a vote once its ceremony (or a volunteer) is in it: the deliberation alone is not one
  // (the user, 2026-10-16: "after that discussion we have Between the votes, I thought the votes already started")
  const voted = x => x.key === 'vote' && x.items.some(i => aired[i].kind === 'ceremony' || aired[i].kind === 'volunteer');
  const villaLabel = ci => {
    const before = chunks.slice(0, ci).map(x => (x.key === 'vote' && !voted(x) ? 'deliberation' : x.key)), after = chunks.slice(ci + 1).map(x => x.key);
    if (!before.includes('daily')) return before.includes('arrival') ? 'Settling in' : 'Morning at the villa';
    if (!before.includes('vote')) return after.includes('vote') ? 'Before the vote' : 'At the villa';
    // a duel FOUGHT, not an Arena chapter: the call-outs can have a chapter of their own before the first duel
    const fought = x => x.key === 'arena' && x.items.some(j => aired[j].kind === 'arena');
    const duelBefore = chunks.slice(0, ci).some(fought), duelAfter = chunks.slice(ci + 1).some(fought);
    if (!duelBefore) return after.includes('vote') ? 'Between the votes' : duelAfter ? 'Before the duels' : 'After the vote';
    return duelAfter ? 'Between the duels' : 'After the Arena';
  };
  const marks = [];   // where each chunk's screens start, for their day (below)
  for (const [ci, c] of chunks.entries()) {
    marks.push({ at: screens.length, c });
    const items = c.items.map(i => ({ a: aired[i], i, title: titles[i]?.title || '' }));
    if (c.key === 'open') {
      const lines = items.flatMap(x => x.a.lines || []);
      if (!lines.some(l => l.shot || l.roster)) { for (const { a } of items) linesToSteps(S, a.lines, { names, sceneWho: ['TJ'] }); continue; }
      // "Previously on": a title, then each beat cut back to where it happened, the clip in its speaker's voice,
      // and the board of who is left (the user, 2026-10-15: "too quick; get inspired from Total Drama's")
      S.push({ card: { k: `Episode ${row.num}`, t: 'Previously on The Challenge', sub: 'Last time, on the Blue Lagoon' } });
      let sig = null;
      for (const l of lines) {
        if (l.shot) { const g = JSON.stringify(l.shot); if (g !== sig) { sig = g; S.push(throwback(l.shot)); } }
        if (l.roster) { sig = null; S.push({ scene: { plate: plateKey('opener', false), place: 'Still in the game', when: `Episode ${row.num}`, icon: 'island', cast: {}, wipe: 1 }, roster: house.map(n => ({ n })) }); }
        linesToSteps(S, [l], { names, sceneWho: ['TJ', ...(l.shot?.who || [])] });
      }
      continue;
    }
    if (c.key === 'daily') { buildDaily(S, open, items, row, { names, house, goneAt, dailyDone }); dailyDone = true; continue; }
    if (c.key === 'vote') { buildVote(S, open, items, row, { names, house, goneAt }); continue; }
    if (c.key === 'arrival') { buildArrival(S, open, items, row, { names, house }); continue; }
    if (c.key === 'arena') { buildArena(S, open, items, row, { names, house, goneAt }); continue; }
    if (['final-start', 'instant', 'overnight', 'final-day2', 'champions'].includes(c.key)) { buildFinal(S, open, c.key, items, row, { names, house, goneAt }); continue; }
    // villa, party, eve: scene after scene on their plates, the villa opening on its map
    open(c.key, c.key === 'villa' ? villaLabel(ci) : null);
    if (c.key !== 'pairs' && items.filter(x => chapterOf(x.a) !== 'party').length >= 2) villaMap(S, items.filter(x => chapterOf(x.a) !== 'party'));
    let partied = false;
    for (const it of items) {
      const k = chapterOf(it.a);
      if (k === 'party' && !partied) { partied = true; S.at(it.i); S.push({ seg: ['Night out', 'Party'] }); }
      const at = cur.steps.length;
      scene(S, it, { names, house, goneAt, key: k });
      if (it.a.kind === 'villa-reveal' && cur.steps[at]) cur.steps[at].seg = ['Home for the season', 'The Villa'];
    }
  }
  // the opening screen only had the open itself when there was no "previously"
  for (const s of screens) if (!s.steps.length) s.steps.push({ dir: '' });
  // Each screen's day, from the first scene of the chunk it was built from (the sidebar heads each day with what
  // it holds: screens.js chPhaseOf). The open has none.
  marks.forEach((m, j) => {
    const end = marks[j + 1]?.at ?? screens.length;
    const day = aired[m.c.items[0]]?.day ?? null;
    for (let k = m.at; k < end; k++) if (screens[k] && screens[k].day == null) { screens[k].day = day; screens[k].chunk = m.c.key; }
  });
  // No two screens of an episode share a title (the user, 2026-10-16: "there's 2 night out for some reason": the
  // list read Before the vote, Night out, Before the vote in 348 of 599 episodes). The villa after a night out is the
  // morning after; a second duel is the second duel; anything else that repeats is later at the villa.
  const ORD = ['', 'second', 'third', 'fourth'];
  const seenLabel = {};
  // an Arena screen is a duel only if one is fought on it (a goodbye or the bank changing hands can have its own)
  let duels = 0;
  screens.forEach((s, i) => {
    const duel = s.key === 'arena' && s.steps.some(st => st.duel);
    if (duel) duels++;
    const n = seenLabel[s.label] = (seenLabel[s.label] || 0) + 1;
    if (n === 1) return;
    if (s.key === 'arena') s.label = duel ? (duels === 1 ? 'The first duel' : `The ${ORD[duels - 1] || 'next'} duel`) : 'At the Arena';
    else if (s.key === 'villa' && screens[i - 1]?.key === 'party' && !seenLabel['The morning after']) s.label = 'The morning after';
    else if (s.key === 'villa') s.label = seenLabel['Later at the villa'] ? `Later at the villa (${n})` : 'Later at the villa';
    seenLabel[s.label] = (seenLabel[s.label] || 0) + 1;
  });
  // map bubbles jump to the first step of their scene
  for (const s of screens) for (const st of s.steps) if (st.map) for (const r of [...st.map.rooms.flatMap(x => x.bubs), ...(st.map.isle || []).flatMap(x => x.bubs), ...st.map.later]) r.go = s.steps.findIndex(x => x.sceneIdx === r.scene);
  return screens;
}

// The moments that change the game get their own slam at the end of the scene (the user, 2026-10-15: "an
// alliance was created but we got no screen slam, no wow effect").
const BIG = {
  'alliance-form': a => ({ card: { k: 'New alliance', t: a.data?.name || 'An alliance', sub: 'They vote together, and nobody outside knows', faces: a.who.slice(0, 8) } }),
  'alliance-grow': a => ({ slam: { spray: 'NEW MEMBER', color: '#ffd21a' }, chip: [a.who[1], a.data?.name ? `IN ${String(a.data.name).toUpperCase()}` : 'NEW MEMBER'] }),
  'alliance-end': a => ({ card: { k: 'Alliance over', t: a.data?.name || 'The alliance', sub: a.data?.why === 'final' ? 'The final: from here it is every one for themselves' : 'Every one of them is on their own now', faces: a.who.slice(0, 8) } }),
  'alliance-betrayal': a => ({ slam: { spray: 'BETRAYED', color: '#e3262d' } }),
  // somebody leaving a group, whatever the way out (the user, 2026-10-16: "Yul got removed from Lagoon Sharks, but
  // there were no screen slams"): thrown out, cut loose, caught voting the other way, walking out, defecting
  'alliance-leave': a => ({ slam: { spray: ({ 'pushed-out': 'KICKED OUT', 'cut-loose': 'CUT LOOSE', exposed: 'EXPOSED', defected: 'DEFECTED', walked: 'WALKED OUT', 'walked-friend': 'WALKED OUT' })[a.data?.why] || 'OUT', color: '#e3262d' },
    chip: [a.who[0], a.data?.name ? `OUT OF ${String(a.data.name).toUpperCase()}` : 'OUT OF THE ALLIANCE'] }),
  // a deal to go to the end together (the user: "no screen slam for a final deal, and we don't say final two:
  // it can go to the final eight"), drunk at the bar or sober on the beach; an ordinary deal gets its chip
  'ride-to-the-final': a => ({ card: { k: 'Final deal', t: `${a.who[0]} & ${a.who[1]}`, sub: 'They take each other as far as it goes', faces: a.who.slice(0, 2) } }),
  'party-deal': a => ({ card: { k: 'Final deal', t: `${a.who[0]} & ${a.who[1]}`, sub: 'Made at the bar. Ask them tomorrow if it still stands', faces: a.who.slice(0, 2) } }),
  deal: a => ({ chip: [a.who[0], `DEAL WITH ${String(a.who[1] || '').toUpperCase()}`] }),
  'deal-broken': a => ({ slam: { spray: 'DEAL BROKEN', color: '#e3262d' } }),
  // TJ says tomorrow's game before the call-out (ch/season.js)
  'arena-reveal': a => ({ card: { k: "Tomorrow's Arena", t: a.data?.gameName || 'The game', sub: `${a.who[0]} knows the game before picking an opponent`, faces: a.who.slice(0, 1), icon: 'arena' }, shake: 1 }),
  // a double, announced (ch/season.js): the card says it before the vote does
  'tj-double': a => ({ card: { k: 'Tonight', t: 'Double elimination', sub: `${a.data?.elims || 2} go into the Arena tonight, one vote at a time`, icon: 'vote', faces: a.data?.immune || [], facesLabel: 'Safe' }, shake: 1 }),
  // the drunk kiss and what it costs (ch/party.js)
  'party-kiss': a => (a.data?.caught ? { slam: { spray: 'CAUGHT', color: '#e3262d' }, chip: [a.who[0], 'CAUGHT KISSING'] }
    : a.data?.partner || a.data?.home ? { slam: { spray: 'THE KISS', color: '#ff8fc7' }, chip: [a.who[0], 'HAS SOMEBODY'] } : { slam: { spray: 'THE KISS', color: '#ff8fc7' } }),
  'kiss-fallout': a => (a.data?.ended ? { slam: { spray: "IT'S OVER", color: '#e3262d' } } : { slam: { spray: 'BUSTED', color: '#e3262d' } }),
  // alliances that change shape (ch/alliances.js allianceShifts)
  'alliance-merge': a => ({ card: { k: 'Alliances merge', t: a.data?.name || 'One alliance', sub: a.data?.from ? `${a.data.from} folds into it, against ${a.data.against || 'the biggest group'}` : 'Two groups vote as one', faces: a.who.slice(0, 8) } }),
  'alliance-switch': a => ({ slam: { spray: 'SWITCHED SIDES', color: '#ff8a1a' }, chip: [a.who[1], a.data?.name ? `NOW IN ${String(a.data.name).toUpperCase()}` : 'SWITCHED'] }),
  'tribunal-verdict': a => ({ slam: { spray: 'SENT IN', color: '#e3262d' }, chip: [a.data?.chosen || a.who[1], 'SENT IN'] }),
  showmance: a => ({ card: { k: 'Showmance', t: `${a.who[0]} & ${a.who[1]}`, sub: 'It is official', faces: a.who.slice(0, 2) } }),
  breakup: a => ({ slam: { spray: "IT'S OVER", color: '#ff8fc7' } }),
  // the stakes (ch/stakes.js, ch/redemption.js)
  'pass-earned': a => (a.data?.first ? { slam: { spray: a.data.token === 'ring' ? 'RING EARNED' : 'RED SKULL', color: '#e3262d' }, chip: [a.who[0], a.data.token === 'ring' ? 'HAS A RING' : 'HAS A SKULL'] }
    : { chip: [a.who[0], `${a.data?.count || 2} ${a.data?.token === 'ring' ? 'RINGS' : 'SKULLS'}`] }),
  'pass-cut': a => (a.data?.spared ? { chip: [a.who[0], 'SPARED'] } : { slam: { spray: a.data?.token === 'ring' ? 'NO RING' : 'NO SKULL', color: '#e3262d' }, chip: [a.who[0], 'GOING HOME'] }),
  'bank-taken': a => ({ slam: { spray: 'PAYDAY', color: '#2fd35a' }, chip: [a.who[0], `+${a.data?.amount || ''}`] }),
  injury: a => (a.data?.sev >= 2 ? { slam: { spray: 'INJURED', color: '#ff8a1a' }, chip: [a.who[0], String(a.data.part || 'hurt').toUpperCase()] } : { chip: [a.who[0], 'BANGED UP'] }),
  'redemption-duel': a => ({ chip: [a.data?.winner || a.who[0], 'STILL ALIVE'] }),
  'redemption-return': a => ({ card: { k: 'Back from Redemption', t: a.who[0], sub: 'Fought their way out of Redemption House', faces: [a.who[0]] } }),
  // the one-episode twists (ch/ep-twists.js)
  'late-arrival': a => ({ card: { k: 'New arrivals', t: (a.data?.arrivals || a.who.slice(0, 2)).join(' & '), sub: 'Fresh legs, no enemies, and they want your spot', faces: a.data?.arrivals || a.who.slice(0, 2) } }),
  purge: a => ({ slam: { spray: 'PURGED', color: '#e3262d' }, chip: [a.who[0], 'GOING HOME'] }),
  // a Pairs return (ep-twists.js) brings two back and sends two home: the card names both of each
  'return-arena': a => {
    const back = a.data?.pair && a.data.winners?.length ? a.data.winners : [a.data?.winner || a.who[0]];
    const beat = a.data?.pair && a.data.losers?.length ? a.data.losers : [a.data?.loser || a.who[1]];
    return { card: { k: 'The Return', t: back.join(' & '), sub: `Back in the game after beating ${beat.join(' and ')}`, faces: back } };
  },
  // a fight's end (the user, 2026-10-16: "fight animations to feel like a big moment"): a shouting match is
  // pulled apart; a physical one is a brawl first; then who backed whom
  fight: a => [{ part: a.who.slice(0, 2), dir: `Friends get between ${a.who[0]} and ${a.who[1]} and drag them to opposite ends of the bar.`, act: { [a.who[0]]: 'shout' } }, ...sidesStep(a)],
  'fight-physical': a => [
    { brawl: a.who.slice(0, 2), dir: `${a.who[0]} shoves ${a.who[1]}, and it turns into a brawl. Drinks go flying.`, slam: { spray: 'PHYSICAL', color: '#e3262d' }, shake: 1 },
    { part: a.who.slice(0, 2), dir: `Security piles in and pulls ${a.who[0]} and ${a.who[1]} apart. ${a.who[0]} is still shouting.`, act: { [a.who[0]]: 'shout', [a.who[1]]: 'slump' }, shake: 1 },
    { dir: `The club goes quiet. Everybody knows the one rule: no violence. Somebody is going home for this.`, focus: [a.who[0]] },
    ...sidesStep(a)],
  disqualified: a => ({ slam: { tape: 'DISQUALIFIED' }, chip: [a.who[0], 'GOING HOME'] }),
  // a quit and a medevac are the size of an elimination (the user, 2026-10-16: "wheres the wow effect")
  quit: a => ({ slam: { stamp: 'QUIT' }, chip: [a.who[0], 'GOING HOME'] }),
  medical: a => ({ slam: { tape: 'MEDICAL' }, chip: [a.who[0], 'PULLED OUT'] }),
  'quit-decide': a => (a.data?.stays ? { chip: [a.who[0], 'STAYING'] } : []),
  // a Pairs season (ch/pairs.js): the pairs named, a pair that turned, a pair at war, a stolen partner, a swap
  'pairs-revealed': a => ({ card: { k: 'This season', t: 'Pairs', sub: 'You win together, you go in together, you go home together', faces: (a.data?.pairs || []).flat().slice(0, 12) }, shake: 1 }),
  'pair-reveal': a => ({ card: { k: 'Partners', t: `${a.who[0]} & ${a.who[1]}`, sub: ({ rivals: 'Production found the worst match it could', strangers: 'Two strangers, and production thinks they will clash', couple: 'Together outside the game, and now in it', ex: 'Exes, back together, for the money', family: 'Family, on the same side', friends: 'Old friends', drafted: 'A vet and the rookie they picked', picked: 'Picked by each other', unmatched: 'Nobody came for them, so they have each other' })[a.data?.how === 'fresh-meat' ? 'drafted' : a.data?.how === 'pick' ? 'picked' : a.data?.tie === 'couple' ? 'couple' : a.data?.tie === 'ex' ? 'ex' : a.data?.tie === 'family' ? 'family' : a.data?.how === 'rivals' ? (a.data?.why === 'guess' ? 'strangers' : 'rivals') : a.data?.why === 'guess' ? 'unmatched' : 'friends'] || '', faces: a.who.slice(0, 2) } }),
  'pair-turn': a => ({ card: { k: a.data?.rivals ? 'Rivals no more' : 'A real pair', t: `${a.who[0]} & ${a.who[1]}`, sub: 'They came in at war, and now they would go in for each other', faces: a.who.slice(0, 2) } }),
  'pair-war': a => ({ slam: { spray: 'AT WAR', color: '#e3262d' }, chip: [a.who[0], `WAR WITH ${String(a.who[1] || '').toUpperCase()}`] }),
  'pair-swap': a => ({ slam: { spray: 'PARTNER STOLEN', color: '#e3262d' }, chip: [a.who[1], `NOW WITH ${String(a.who[0] || '').toUpperCase()}`] }),
  'partner-swap': a => ({ card: { k: 'Twist', t: 'Partner Swap', sub: 'Every pair is broken up, and nobody gets their old partner back', faces: (a.data?.after || []).flat().slice(0, 12) }, shake: 1 }),
  'partner-left': a => ({ slam: { tape: 'PARTNER GONE' }, chip: [a.who[0], 'GOING HOME'] }),
  'pair-repaired': a => ({ card: { k: 'New pair', t: `${a.who[0]} & ${a.who[1]}`, sub: 'Both lost their partners, so now they have each other', faces: a.who.slice(0, 2) } }),
  'pair-volunteer': a => ({ slam: { spray: 'VOLUNTEERED', color: '#ffd21a' } }),
  // a Teams season (ch/teams.js): the teams named, a switch, a team gone, the break-up
  'teams-revealed': a => ({ card: { k: 'This season', t: 'Teams', sub: ({ shows: 'Everybody plays for the show they came from', champions: 'Past champions against everybody who never won', vets: 'The vets against the rookies', draft: 'Two captains pick their teams' })[a.data?.how] || 'Team against team',
    faces: (a.data?.teams || []).map(t => t.captain).filter(Boolean).slice(0, 6) }, shake: 1 }),
  'team-reveal': a => ({ card: { k: a.data?.how === 'draft' ? 'Captain ' + (a.who[0] || '') : 'Team', t: a.data?.team || 'Team', sub: `${a.data?.size || a.who.length} players. Win together, and the losers vote one of their own in.`, faces: (a.data?.members || a.who).slice(0, 14) } }),
  // the team's captain, chosen out loud (teams.js electCaptain): the name, and the count if there was a vote
  'team-captain': a => {
    const d = a.data || {};
    const count = Object.entries(d.votes || {}).sort((x, y) => y[1] - x[1]).map(([n, v]) => `${n} ${v}`).join(' · ');
    const how = { uncontested: 'Nobody ran against them', conceded: `${d.conceded || 'The other candidate'} stepped aside`, tie: 'A tie, settled on respect',
      clash: 'A vote that turned into an argument', fight: 'A vote that had to be broken up', contested: 'Voted in by the team' }[d.outcome] || 'Voted in by the team';
    return { card: { k: `Captain of ${d.team || 'the team'}`, t: d.captain || a.who[0], sub: count && d.outcome !== 'uncontested' ? `${how}: ${count}` : how, faces: [d.captain || a.who[0]] }, ...(d.outcome === 'fight' ? { shake: 1 } : {}) };
  },
  // (a switch, a stay and a fold play on the Arena screen: teamChoice)
  'teams-break': a => ({ card: { k: 'Twist', t: 'The teams are over', sub: 'Every player for themselves from here', faces: a.who.slice(0, 12) }, shake: 1, reband: Object.fromEntries(a.who.map(n => [n, null])) }),
  'team-last-stand': a => ({ chip: [a.who[0], `LAST OF ${String(a.data?.team || '').toUpperCase()}`] }),
  'team-poach': a => (a.data?.seen ? { chip: [a.data.seen, 'SAW IT'] } : []),
  // more of both modes (events.js, 2026-10-17)
  'team-coup': a => (a.data?.takes ? { slam: { spray: 'NEW CAPTAIN', color: '#ffd21a' }, chip: [a.who[0], `CAPTAIN OF ${String(a.data?.team || '').toUpperCase()}`], shake: 1 } : { chip: [a.who[1], 'STILL CAPTAIN'] }),
  'team-leak': a => (a.data?.caught ? { slam: { spray: 'CAUGHT', color: '#e3262d' }, chip: [a.data.caught, 'SAW THE LEAK'] } : []),
  'team-weak-link': a => ({ chip: [a.who[1], a.data?.defended ? 'DEFENDED' : 'BLAMED FOR THE LOSS'] }),
  'team-new-blood': a => ({ chip: [a.who[0], a.data?.welcome ? 'WELCOMED IN' : 'FROZEN OUT'] }),
  // after a team daily (teams.js teamDailyReactions)
  'team-daily-win': a => ({ chip: [a.who[0], 'CARRIED IT'] }),
  'team-daily-loss': a => (a.data?.streak ? { chip: [a.who[0], 'LOST AGAIN'] } : []),
  'team-vote-talk': a => ({ chip: [a.data?.target, a.data?.doubter ? 'NAMED, NOT BY ALL' : 'THE NAME'] }),
  'team-bloc': a => ({ card: { k: `Inside ${a.data?.team || 'the team'}`, t: a.data?.name || 'A bloc', sub: 'A group inside the team, voting together', faces: a.who.slice(0, 4) } }),
  'pair-money-talk': a => ({ chip: [a.who[1], a.data?.promise ? 'PROMISED TO SHARE' : 'DODGED THE QUESTION'] }),
  'pair-pact': a => ({ chip: [a.who[0], `A PACT WITH ${String(a.who[1] || '').toUpperCase()}`] }),
  'pair-tempt': a => (a.data?.tempted ? { chip: [a.who[1], 'TEMPTED'] } : [])
};

// who stood with whom when it kicked off (party.js: the house takes sides)
function sidesStep(a) {
  const sides = a.data?.sides || [];
  if (!sides.length) return [];
  const by = n => sides.filter(x => x.with === n).map(x => x.who);
  const A = by(a.who[0]), B = by(a.who[1]);
  const part = [A.length ? `${nameList(A.slice(0, 3))} ${A.length > 1 ? 'are' : 'is'} with ${a.who[0]}` : '', B.length ? `${nameList(B.slice(0, 3))} ${B.length > 1 ? 'back' : 'backs'} ${a.who[1]}` : ''].filter(Boolean);
  return [{ dir: `The house picks sides. ${part.join('; ')}.`, focus: [...A.slice(0, 2), ...B.slice(0, 2)] }];
}
// ...and the ones that open on something to look at: TJ's rankings on the board as he reads them
const SQUARE_UP = a => ({ clash: a.who.slice(0, 2), slam: { spray: "IT'S ON", color: '#e3262d' }, act: { [a.who[0]]: 'shout', [a.who[1]]: 'shout' }, shake: 1 });
const OPEN = {
  fight: SQUARE_UP,
  'fight-physical': SQUARE_UP,
  // the full list is on the side panel from here on (screens.js ranksPanel); no board over the screen
  'power-rankings': a => ({ ranksShown: 1 }),
};

// A cut back to last episode: the place a recap beat happened, its people on it, tinted as a flashback.
function throwback(shot) {
  let place;
  if (shot.daily) { const st = DAILY_STAGE[shot.daily] || DAILY_STAGE['gauntlet-run']; place = { plate: st.plate, place: st.place, hour: st.hour }; }
  else if (shot.spot === 'arena' || shot.kind === 'arena') place = { plate: ARENA_STAGE.plate, place: 'The Arena', hour: 'night' };
  else place = PLACE[shot.spot] || PLACE.villa;
  const key = plateKey(place.plate, place.hour === 'night');
  const who = (shot.who || []).filter(n => n && n !== HOST);
  return { scene: { plate: key, place: place.place, when: 'Last time', icon: place.icon || 'house', cast: placeScene(key, who), wipe: 1, flash: 1 }, focus: who };
}

// One villa/party/eve scene.
// The scenes where TJ gathers everybody: an announcement to the house, not a conversation
const TJ_TO_HOUSE = new Set(['tj-double', 'tj-house-meeting', 'tj-at-breakfast', 'power-rankings', 'quit', 'medical', 'disqualified', 'purge',
  'pass-earned', 'pass-cut', 'redemption-closed', 'late-arrival', 'partner-draw', 'partner-pick', 'pairs-revealed', 'partner-swap', 'teams-revealed', 'teams-break']);
function scene(S, { a, i, title }, { names, house, goneAt, key }) {
  S.at(i);
  const night = isNight(S.min);
  if (a.spot === 'confessional' || (a.lines.length && a.lines.every(l => l.kind === 'conf'))) {
    // a confessional on its own: the chair, no room
    const first = { scene: { plate: 'conf-day', place: 'Confessional', when: whenOf(S.day, S.min), icon: 'house', cast: {}, conf: 1 }, sceneIdx: i, title, kind: a.kind };
    linesToSteps(S, a.lines, { names, first, sceneWho: a.who });
    return;
  }
  const place = stageOf(a, S.min);
  const crowd = key === 'party' ? house.filter(n => !goneAt[i]?.has(n) && !a.who.includes(n)).filter((n, k) => (k * 7 + a.day) % 3 === 0).slice(0, 7) : [];
  // TJ talking to the whole house has the whole house in the room, stood in a line (the user, 2026-10-17: "when TJ
  // talks to everybody, only two or three people are in the common room"): everybody still in, up to fourteen
  const everyone = TJ_TO_HOUSE.has(a.kind) ? house.filter(n => !goneAt[i]?.has(n) && !a.who.includes(n)).slice(0, Math.max(0, 14 - a.who.length)) : [];
  // the room's own seating: the common room's sofa (as the vote sits), a line elsewhere (the user, 2026-10-17: a
  // forced line stood two rows in front of the fire, "they're not even sitting correctly in the common room")
  const first = sceneStep(S, a, place, { night: night || place.hour === 'night', crowd, ...(everyone.length ? { extraCast: everyone } : {}) });
  // the event it is (a fight, a showmance, a meeting): the music follows it (vp-ch-ep/sound.js)
  first.sceneIdx = i; first.title = title; first.kind = a.kind;
  if (key === 'party') { first.dance = crowd.slice(0, 5); first.bg = Object.fromEntries(crowd.slice(5).map(n => [n, 'sip'])); }
  const k = a.kind === 'meeting' ? meetingKnow(a.data) : bondKnow(a);
  if (k) first.know = k;
  if (OPEN[a.kind]) Object.assign(first, OPEN[a.kind](a));
  // TJ reads the rankings out loud before the house reacts (script/rankings.js: the backlog prints the same)
  if (a.kind === 'power-rankings' && a.data?.rows) {
    const told = rankLines(a.data.rows, { seed: `ranks|${S.num}` });
    told.forEach((l, k) => {
      const st = k === 0 ? first : {};
      if (l.by === HOST) { st.tj = l.text; st.focus = l.fx.who ? ['TJ', l.fx.who] : ['TJ']; }
      else { st.say = [l.by, l.text]; st.focus = [l.by]; st.act = { [l.by]: l.fx.move > 0 || l.fx.rank === 1 ? 'cheer' : l.fx.move < 0 || l.fx.rank === a.data.rows.length ? 'slump' : 'talkpop' }; }
      if (l.fx.who && l.by === HOST) { st.chip = [l.fx.who, `#${l.fx.rank}${l.fx.move ? (l.fx.move > 0 ? ` \u25b2${l.fx.move}` : ` \u25bc${-l.fx.move}`) : ''}`]; if (l.fx.top) { st.slam = { spray: 'NUMBER ONE', color: '#ffd21a' }; st.shake = 1; } }
      S.push(st);
    });
    linesToSteps(S, a.lines, { names, sceneWho: a.who });
  } else linesToSteps(S, a.lines, { names, first, sceneWho: a.who });
  if (BIG[a.kind]) for (const st of [].concat(BIG[a.kind](a))) S.push({ focus: a.who.slice(0, 4), ...st });
}

function villaMap(S, items) {
  const rooms = {}, isle = {}, later = [];
  for (const { a, i, title } of items) {
    S.at(i);
    const p = a.spot === 'confessional' || (a.lines.length && a.lines.every(l => l.kind === 'conf')) ? { room: 'confessional' } : stageOf(a, S.min);
    const star = ['meeting', 'recruit', 'plea', 'deal', 'alliance-form', 'outing', 'fight', 'showmance', 'leverage-threat', 'receipts', 'morning-after', 'return'].includes(a.kind);
    const bub = { bub: title, scene: i, star };
    if (p?.room) { const r = (rooms[p.room] ||= { at: p.room, who: [], bubs: [] }); a.who.forEach(n => !r.who.includes(n) && r.who.push(n)); r.bubs.push(bub); }
    else if (p?.island) { const r = (isle[p.island] ||= { at: p.island, place: p.place, who: [], bubs: [] }); a.who.forEach(n => !r.who.includes(n) && r.who.push(n)); r.bubs.push(bub); }
    else later.push(bub);
  }
  S.at(items[0].i);
  const list = Object.values(rooms).map(r => ({ at: r.at, who: r.who.slice(0, 5), bubs: r.bubs }));
  const out = Object.values(isle).map(r => ({ at: r.at, place: r.place, who: r.who.slice(0, 5), bubs: r.bubs }));
  S.push({ scene: { plate: plateKey('villa-map', false), place: 'The Villa', when: whenOf(items[0].a.day, S.min), icon: 'house', cast: {}, wipe: 1 },
    map: { rooms: list, isle: out, later, hint: true, clock: [['Morning', S.min < 12 * 60 ? 'now' : 'done'], ['Afternoon', S.min < 12 * 60 ? 'lock' : S.min < 18 * 60 ? 'now' : 'done'], ['Night', S.min >= 18 * 60 ? 'now' : 'lock']] },
    hint: 'Click a place to go there. Forward plays them in order.' });
}

// ── the arrival (episode 1) ───────────────────────────────────────────
// Off the plane in groups, each with a name plate (their show, vet or rookie); the old faces find each
// other (the engine's reunions); TJ welcomes them, the season's rules, and the first daily starts on the
// spot (the modern show's premiere; the user chose "challenge on arrival").
function buildArrival(S, open, items, row, { names, house }) {
  open('arrival');
  const key = plateKey('airstrip', false);
  const info = row.ch?.castInfo || {};
  S.at(items[0].i);
  const spots = placeScene(key, house);
  const plane = marksOf(key).find(m => m.kind === 'plane') || { u: .3, v: .76 };
  const door = { u: plane.u + .03, v: Math.min(.8, plane.v + .02), s: (spots[house[0]]?.s || .08) * .9 };
  const seed = `arrive|${row.num}`;
  S.push({ scene: { plate: key, place: 'The Airstrip', when: whenOf(S.day, S.min), icon: 'island', island: 'airstrip', cast: { TJ: hostSide(key) }, wipe: 1 },
    seg: ['Season premiere', 'The Arrival'], dir: "A plane comes in low over the lagoon and lands on the island's airstrip. TJ is waiting on the tarmac.", shake: 1, focus: [] });
  S.push({ tj: pickBy(TJ_LANDING, seed), focus: ['TJ'], act: { TJ: 'cheer' } });
  const showOf = n => SHOWS[info[n]?.origin]?.name || null;
  for (let i = 0; i < house.length; i += 4) {
    const g = house.slice(i, i + 4);
    S.push({ enter: Object.fromEntries(g.map(n => [n, spots[n]])), from: door, dir: `${nameList(g)} come down the steps.`, focus: g.slice(0, 2),
      roster: g.map(n => ({ n, show: showOf(n), rookie: !!info[n]?.rookie })) });
    // the introductions: one package per player, the way the show opens a season
    for (const n of g) {
      const card = introCard(n, info[n] || {});
      const lines = info[n]?.lines || [];
      if (!lines.length) { S.push({ intro: card, focus: [n] }); continue; }
      lines.forEach((t, k) => S.push({ intro: k ? { ...card, still: true } : card, conf: [n, t], focus: [n] }));
    }
  }
  for (const it of items) linesToSteps(S, it.a.lines, { names, sceneWho: it.a.who, first: { sceneIdx: it.i, title: it.title, kind: it.a.kind, focus: it.a.who.slice(0, 2) } });
  const gendered = !!row.ch?.division;
  const vets = house.filter(n => !info[n]?.rookie).length, rookies = house.length - vets;
  // the welcome speech, in full, before the rules card
  const WORD = ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty', 'Twenty-one', 'Twenty-two', 'Twenty-three', 'Twenty-four', 'Twenty-five', 'Twenty-six', 'Twenty-seven', 'Twenty-eight', 'Twenty-nine', 'Thirty'];
  const said = n => WORD[n] || String(n);
  for (const line of pickBy(TJ_SPEECH, seed)) S.push({ tj: fill(line, { vets: said(vets), rookies: said(rookies) }).replace(/, ([A-Z])([a-z-]*) rookies/, (m, a, b) => `, ${a.toLowerCase()}${b} rookies`), focus: ['TJ'] });
  S.push({ rules: { k: 'THIS SEASON', n: 'How it works', li: [
    'Every week starts with a <b>daily</b>. Win it and you are <b>safe</b> at the vote.',
    ...(gendered ? ["The weeks go <b>men's</b>, then <b>women's</b>: only that week's division can be voted in."] : []),
    'The house votes <b>out loud</b>, one at a time. The one with the most votes goes into the <b>Arena</b>.',
    'At the Arena they <b>call out</b> who goes in with them. Lose in there, and you go home.',
    `The ones still standing at the end run the <b>final</b>${gendered ? ': the first man and the first woman are the champions' : ''}.`,
  ], f: 'Win dailies. Make friends. Stay out of the Arena.' }, focus: ['TJ'] });
  S.push({ tj: pickBy(TJ_FIRST_DAILY, seed), focus: ['TJ'], act: { TJ: 'shout' } });
}

// A player's introduction: who they are, where they come from, and (a veteran) what they've done.
// The facts are the row's (ch-run.js introOf: the roster's authored fields, the franchise ledger).
const SHOW_PLATE = { 'total-drama': 'assets/sets/td/survival-island/campfire-night.webp', 'big-brother': 'assets/sets/bb/resort/default/bar-lobby-wide-night.webp',
  traitors: 'assets/sets/traitors/roundtable.webp', 'drag-race': 'assets/sets/dr/mainstage.webp', 'perfect-match': 'assets/sets/pm/firepit-night.webp',
  'the-circle': 'assets/sets/circle/studio.webp', 'the-challenge': 'assets/sets/ch/arena-night.webp' };
const ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
function introCard(n, i) {
  const career = (i.career || []).map(c => ({ where: c.where, show: SHOWS[c.format]?.name || null, plate: SHOW_PLATE[c.format] || null,
    result: c.winner ? 'WON' : c.finalist ? `Finalist${c.place ? `, ${ord(c.place)}` : ''}` : c.place ? `${ord(c.place)}${c.total ? ` of ${c.total}` : ''}` : 'Played',
    winner: !!c.winner, wins: c.wins || 0 }));
  const plates = [...new Set([SHOW_PLATE[i.origin], ...career.map(c => c.plate)].filter(Boolean))];
  const facts = [i.age ? `${i.age}` : null, i.hometown, i.occupation, i.atHome].filter(Boolean);
  return { n, show: SHOWS[i.origin]?.name || null, rookie: !!i.rookie, facts, story: career.length ? null : i.story || null, tag: !career.length && !i.story ? i.tag || null : null,
    career, badges: i.badges || [], rival: i.rival || null, plates: plates.length ? plates : [SHOW_PLATE['the-challenge']] };
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
  // a played daily (js/ch/daily/) stages its own people; before it starts, the house waits on the open ground
  const beatPlay = d.beats && BEAT_PLAYS[d.id] && st.show === 'played' ? BEAT_PLAYS[d.id] : null;
  const open0 = marksOf(key).filter(m => m.kind === 'stand' && !m.group).length;
  const cast = { TJ: hostSide(key), ...(beatPlay ? Object.fromEntries(people.slice(0, open0).map((n, j) => [n, ['stand', j]])) : placeScene(key, people)) };
  const wide = { plate: key, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast, wipe: 1, water: 0 };
  S.push({ scene: wide,
    card: { k: "Today's daily", t: d.name, sub: d.mode === 'solo' && (d.winners || []).length > 1 ? 'The best man and the best woman are safe at the vote' : 'Win it, and you are safe at the vote', icon: 'daily' },
    sceneIdx: main.i, title: main.title });
  // scenes that aired before the game (picking partners, picking teams) play first, on the same sand
  const before = items.filter(x => x.i < main.i), after = items.filter(x => x.i > main.i);
  for (const it of before) linesToSteps(S, it.a.lines, { names, sceneWho: it.a.who, first: { sceneIdx: it.i, title: it.title, kind: it.a.kind, focus: it.a.who.slice(0, 2) } });
  const seed = `${row.num}|${d.id}`;
  S.push({ tj: fill(pickBy(night ? TJ_DAILY_NIGHT : TJ_DAILY_OPEN, seed), { game: d.name }), focus: ['TJ'] });
  const mode = d.mode === 'pairs' ? 'In pairs. ' : d.mode === 'teams' ? 'Two teams. ' : '';
  const win = d.tally ? 'Everybody plays for themselves, and every finish counts for the team. The team with the better average place wins, and the whole team is safe at the vote.'
    : d.mode === 'solo' && (d.winners || []).length > 1 ? 'The best man and the best woman win, and they are safe at the vote.' : 'The winners are safe at the vote.';
  const card = { k: "TODAY'S DAILY", n: d.name, li: rulesOf(def?.desc), f: (d.tally ? '' : mode) + win };
  S.push({ rules: card, tj: S.last()?.tj ? null : tjLine('rules', {}, seed, S.V.used), focus: ['TJ'] });
  // the rules on one card, once (the user, 2026-10-15: 'only show the rules one time, no need to show them each time I click')
  S.push({ tj: pickBy(TJ_GO, seed), focus: ['TJ'], gong: 1 });
  const unitName = u => nameList(u);
  const winners = d.winners || [];
  const isWin = u => u.some(n => winners.includes(n));
  const know = [];
  if ((d.throws || []).length) know.push(['Thrown', `${esc(nameList(d.throws))} ${d.throws.length > 1 ? 'are' : 'is'} losing on purpose. ${(d.caught || []).length ? `${esc(nameList(d.caught.map(c => c.by)))} saw it.` : 'Nobody in the house has noticed.'}`]);
  // a played daily: every beat, in order (vp-ch-ep/daily-play.js); Hang On keeps its pier and its hang
  const playOf = d.beats && BEAT_PLAYS[d.id] ? BEAT_PLAYS[d.id] : null;
  if (playOf) {
    const sceneOf = (plate, nightHere, castSpec) => { const k = plateKey(plate, nightHere || night);
      // a close-up has nobody but the players in it (TJ: null)
      const cast = Object.fromEntries(Object.entries({ TJ: hostSide(k), ...castSpec }).filter(([, v]) => v));
      return { plate: k, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast, wipe: 1, water: 0 }; };
    const steps = playOf(d, { seed, V: S.V, teamNames: S.teamNames, plateKey, scene: sceneOf, plate: st.plate, night, people, wide, water: !!st.water, legacy: () => dailyPlay(d, { key, seed: row.num }) });
    if (know.length && steps[3]) steps[3].know = know.shift();
    for (const x of steps) S.push(x);
  }
  const played = playOf ? { steps: [], finish: {} } : st.show === 'hang' ? null : dailyPlay(d, { key, seed: row.num });
  if (playOf) { /* played above */ } else if (played) {
    const mid = [];
    for (const h of d.injuries || []) mid.push({ dir: fill(pickBy(st.water && st.verb === 'swim' ? PLAY.hurtWet : PLAY.hurt, seed + h), { who: h }), focus: [h], act: { [h]: 'slump' }, shake: st.verb === 'swim' ? 0 : 1 });
    const ch = (d.moments || []).find(m => m.kind === 'choke');
    if (ch) mid.push({ dir: fill(pickBy(PLAY.choke, seed), { who: ch.who }), focus: [ch.who], act: { [ch.who]: 'slump' } });
    played.steps.splice(Math.min(2, played.steps.length), 0, ...mid);
    played.steps.forEach((x, k) => { if (k === 1 && know.length && !x.know) x.know = know.shift(); });
    for (const x of weaveDaily(played.steps, d, st, S.V, people)) {
      if (!x.cut) { S.push(x); continue; }
      // a close-up (art jobs E01-E06): the beat on its own set with the people in it, then back to the wide
      const ck = plateKey(x.cut.plate, night);
      if (!CH_MARKS[ck]) { S.push(x); continue; }
      const who = (x.cut.who || []).filter(Boolean);
      const hasGroup = x.cut.group && marksOf(ck).some(m => m.group === x.cut.group);
      const { move, pose, cut, props, ...beat } = x;
      S.push({ ...beat, scene: { ...wide, plate: ck, place: wide.place, cast: placeScene(ck, who, hasGroup ? { group: x.cut.group } : {}), wipe: 1, close: 1 }, focus: who });
      S.push({ scene: { ...wide, wipe: 1 }, focus: [] });
    }
  } else if (st.show === 'hang' || st.show === 'last') {
    // Out in reverse order; the winners never drop.
    const out = [...units].reverse().filter(u => !isWin(u));
    const groups = [];
    const per = Math.max(1, Math.ceil(out.length / 4));
    for (let g = 0; g < out.length; g += per) groups.push(out.slice(g, g + per));
    const verb = st.verb;
    S.push({ hang: st.show === 'hang' ? 'start' : null, stand: st.show === 'last' ? 'start' : null, still: people,
      dir: st.show === 'hang' ? pickBy(PLAY.hang.start, seed) : pickBy(PLAY.last.start[verb] || PLAY.last.start.quiz, seed), focus: [] });
    const hangSteps = [];
    const pushHang = x => hangSteps.push(x);
    groups.forEach((g, k) => {
      const who = g.flat();
      const one = g.length === 1 && g[0].length === 1;
      const line = st.show === 'hang'
        ? fill(pickBy(one ? PLAY.hang.drop1 : PLAY.hang.dropN, seed + k), { who: g.map(unitName).join(', ').replace(/, ([^,]*)$/, ' and $1') })
        : fill(pickBy((one ? PLAY.last.drop1 : PLAY.last.dropN)[verb] || PLAY.last.drop1.quiz, seed + k), { who: nameList(g.map(unitName)) });
      const step = { drop: who, dir: (st.show === 'hang' && k > 0 ? pickBy(PLAY.hang.sag, seed + k) + ' ' : '') + line, sag: st.show === 'hang' ? k + 1 : 0, focus: who.slice(0, 2), shake: k === groups.length - 1 ? 1 : 0, splash: st.water ? 1 : 0 };
      if (k === 1 && know.length) step.know = know.shift();
      pushHang(step);
    });
    for (const x of weaveDaily(hangSteps, d, st, S.V, people)) S.push(x);
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
  if (!played && st.show !== 'hang') {
    for (const h of d.injuries || []) S.push({ dir: fill(pickBy(PLAY.hurt, seed + h), { who: h }), focus: [h], act: { [h]: 'slump' }, shake: 1 });
    const choke = (d.moments || []).find(m => m.kind === 'choke');
    if (choke) S.push({ dir: fill(pickBy(PLAY.choke, seed), { who: choke.who }), focus: [choke.who], act: { [choke.who]: 'slump' } });
  }
  // The finish: TJ calls it (the engine's own daily lines).
  const lines = main.a.lines;
  // a whole team is "Zoey's team", never twelve names (the user, 2026-10-16)
  const wTeam = winners.length > 3, wName = wTeam ? S.teamNames?.[winners[0]] || `${winners[0]}'s team` : nameList(winners), wVerb = winners.length > 1 && !wTeam ? 'win' : 'wins';
  if (played?.finish?.dir) { S.push({ ...played.finish, win: winners, power: winners, slam: { winner: `${wName} ${wVerb}` }, focus: winners.slice(0, 2) }); }
  const first = played ? (played.finish?.dir ? {} : { ...played.finish, win: winners, power: winners, slam: { winner: `${wName} ${wVerb}` } }) : { win: winners, slam: { winner: `${nameList(winners)} ${winners.length > 1 ? 'win' : 'wins'}` }, power: winners, finish: st.show, race: st.show === 'race' ? units.slice(0, Math.min(6, units.length)).map(u => ({ who: u, p: isWin(u) ? 1 : .9 })) : null };
  linesToSteps(S, lines, { names, first, sceneWho: ['TJ', ...people] });
  for (const k of know) { const last = S.last(); if (last && !last.know) last.know = k; }
  // a team daily played alone: TJ says how it added up, and why a heat won by the losing team did not save it
  if (d.tally?.length > 1) S.push({ tj: tallyLine(d.tally, S.teamNames), focus: ['TJ'], power: winners });
  // TJ with everybody after: how it went, and what happens now
  const week = row.ch?.division === 'm' ? "It's a men's week, so only a guy can be voted in." : row.ch?.division === 'f' ? "It's a women's week, so only a woman can be voted in." : '';
  const wn = wName;
  S.push({ tj: tjLine(wTeam ? 'debriefTeam' : 'debrief', { w: wn }, seed, S.V.used), focus: ['TJ'] });
  if (!row.ch?.final) S.push({ tj: tjLine('next', { w: wn, week }, seed + 'n', S.V.used), focus: ['TJ', ...winners.slice(0, 1)], power: winners });
  // the daily's aftermath scenes, on the same plate
  for (const it of after) {
    S.at(it.i);
    const first2 = { scene: { plate: key, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: { ...placeScene(key, it.a.who.filter(n => !(it.a.away || []).includes(n))) }, wipe: 1 }, sceneIdx: it.i, title: it.title, kind: it.a.kind, power: winners };
    if (it.a.lines.every(l => l.kind === 'conf')) first2.scene.cast = {};
    linesToSteps(S, it.a.lines, { names, first: first2, sceneWho: it.a.who });
  }
}

// TJ adds up a team daily that everybody played alone (dailies.js tally): every place, averaged per team. A heat won
// by somebody on a losing team is said out loud, because that is the result that looks wrong.
function tallyLine(tally, teamNames) {
  const name = t => teamNames?.[t.members[0]] || `${t.members[0]}'s team`;
  const fmt = n => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const [top, ...rest] = tally;
  const avgs = tally.map(t => `${name(t)}, ${fmt(t.avg)}`).join('. ');
  const lost = rest.flatMap(t => t.heats.map(h => ({ h, t })));
  const heat = lost.length
    ? ` ${nameList(lost.map(x => x.h))}, you won your heat for ${name(lost[0].t)}, but one great finish can't carry a whole team.`
    : top.heats.length ? ` And ${nameList(top.heats)} won ${top.heats.length > 1 ? 'their heats' : 'a heat'} on top of that.` : '';
  const level = rest[0] && fmt(rest[0].avg) === fmt(top.avg) ? ` That's level, so it goes to the best single finish, and that was ${top.best}.` : '';
  return `Here's how it adds up. Every finish counts for your team, and lower is better. Average place: ${avgs}.${level} ${name(top)} wins the daily.${heat}`;
}

// ── the vote ──────────────────────────────────────────────────────────
function buildVote(S, open, items, row, { names, house, goneAt }) {
  const cer = items.some(x => x.a.kind === 'ceremony'), vol = items.some(x => x.a.kind === 'volunteer');
  // TJ telling the one voted in tomorrow's game comes after the vote: its own short screen, never "Deliberation"
  if (!cer && !vol && items.every(x => x.a.kind === 'arena-reveal')) {
    open('vote', 'The game revealed');
    for (const it of items) scene(S, it, { names, house, goneAt, key: 'vote' });
    return;
  }
  const talk = !cer && !vol;   // the house talking it out before anybody votes
  const nVotes = (row.ch?.votes || []).length;
  const nth = cer ? (S._votes = (S._votes || 0) + 1) : 0;
  open('vote', talk ? 'Deliberation' : !cer && vol ? 'A volunteer' : nVotes > 1 ? `The ${['', 'first', 'second', 'third'][nth] || 'next'} vote` : null);
  const at = items.find(x => x.a.kind === 'ceremony') || items[0];
  S.at(at.i);
  // a Teams season's vote is one team's: only that team is in the common room (the user, 2026-10-17)
  const teamVote = (row.ch?.votes || []).find(v => v.team);
  const voters = teamVote ? new Set(teamVote.ballots.flatMap(b => [b.voter, b.target])) : null;
  const here = house.filter(n => !goneAt[at.i]?.has(n) && (!voters || voters.has(n)));
  const key = plateKey('common', true);
  const cast = { TJ: ['host'], ...placeScene(key, here, { group: 'sofa' }) };
  S.push({ scene: { plate: key, place: 'The Common Room', when: whenOf(S.day, S.min), icon: 'fire', room: 'common', cast, wipe: 1 },
    card: talk ? { k: 'Before the vote', t: 'Deliberation', sub: 'The house talks it out, in front of everybody' }
      : nVotes > 1 ? { k: `Vote ${nth} of ${nVotes}`, t: 'The Vote', sub: `A double elimination: ${nVotes} go into the Arena this week, one vote at a time` } :
      teamVote ? { k: 'Tonight', t: 'The Vote', sub: teamVote.winners ? `Nobody else can go in, so ${teamVote.team} votes one of its own` : `${teamVote.team} lost the daily. Only ${teamVote.team} votes, for one of its own`, faces: row.ch?.dailyWinners || [], facesLabel: 'Safe', icon: 'vote' } :
      { k: 'Tonight', t: 'The Vote', sub: S.pairMap ? (row.ch?.division === 'm' ? "Men's week: one men's pair goes into the Arena" : row.ch?.division === 'f' ? "Women's week: one women's pair goes into the Arena" : 'One pair goes into the Arena, together')
        : row.ch?.division === 'm' ? "Men's week: one guy goes into the Arena" : row.ch?.division === 'f' ? "Women's week: one woman goes into the Arena" : 'One of them goes into the Arena', faces: row.ch?.dailyWinners || [], facesLabel: 'Safe', icon: 'vote' },
    sceneIdx: at.i, title: 'The house vote', power: row.ch?.dailyWinners || [] });
  let ruled = false;
  for (const it of items) {
    if (it.a.kind !== 'ceremony') { linesToSteps(S, it.a.lines, { names, sceneWho: it.a.who, first: { sceneIdx: it.i, title: it.title, kind: it.a.kind } }); continue; }
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
      // the ceremony's own steps belong to it (Intel's Votes opens when they have all been read)
      linesToSteps(S, part.lines, { names, sceneWho: ['TJ'], ...(again ? {} : { first: { sceneIdx: cer.i } }) });
      const trib = row.ch?.tribunal;
      if (rules && trib) S.push({ rules: { k: 'HOW TONIGHT WORKS', n: 'The Tribunal', li: [div, `${esc(nameList(trib.tribunal))} won the daily, so ${trib.tribunal.length > 1 ? 'they are' : 'is'} <b>the Tribunal</b>, and cannot be voted for.`,
        'Everybody else <b>says a name out loud</b>. The <b>three with the most votes</b> are nominated.',
        'The nominees <b>plead their case</b> to the Tribunal, and the Tribunal decides <b>in private</b> who goes into the Arena.'], f: 'Win the daily, and you decide' }, focus: ['TJ'] });
      else if (rules && (row.ch?.votes || []).some(v => v.team)) {
        // a Teams season's vote (ch/teams.js): only the losing team votes, and only for one of its own
        const tv = row.ch.votes.find(v => v.team);
        S.push({ rules: { k: 'HOW TONIGHT WORKS', n: 'Out loud, by team', li: [div,
          tv.winners ? `Nobody else can go in, so <b>${esc(tv.team)}</b> has to vote for one of its own, even though they won.` : `<b>${esc(tv.team)}</b> lost the daily, so <b>only ${esc(tv.team)} votes</b>, and only for one of their own.`,
          'One at a time, you <b>stand up and say a teammate\'s name</b>, out loud, in front of everybody.',
          'The one with <b>the most votes</b> goes into the Arena, and at the Arena <b>picks who goes in with them</b>, from anybody not on the winning team.'],
          f: 'Your own team decides, and everybody hears it' }, focus: ['TJ'] });
      }
      else if (rules && S.pairMap) S.push({ rules: { k: 'HOW TONIGHT WORKS', n: 'Out loud, in pairs', li: [row.ch?.division === 'm' ? "It's a <b>men's week</b>: only a men's pair can be voted in." : row.ch?.division === 'f' ? "It's a <b>women's week</b>: only a women's pair can be voted in." : 'Any pair can be voted in this week.',
        'One at a time, you <b>stand up and name a pair</b>, out loud. You can never name your own.',
        safe.length ? `${esc(nameList(safe))} won the daily, so <b>nobody can vote for them</b>.` : 'Nobody won safety this week.',
        'The pair with <b>the most votes</b> goes into the Arena together, and there <b>picks the pair who goes in with them</b>.'], f: 'You vote for two people, and two people hear it' }, focus: ['TJ'] });
      else if (rules) S.push({ rules: { k: 'HOW TONIGHT WORKS', n: 'Out loud', li: [div, 'One at a time, you <b>stand up and say a name</b>, out loud, in front of everybody.',
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
        else linesToSteps(S, [l], { names, sceneWho: [part.voter, part.target, 'TJ'] });
      });
      continue;
    }
    if (part.kind === 'cer-result' && row.ch?.tribunal) {
      // a Tribunal week: the three nominees, not the one going in
      const noms = row.ch.tribunal.nominees;
      part.lines.forEach((l, k) => {
        if (k === 0) S.push({ tj: l.text, focus: [...noms, 'TJ'], slam: { spray: 'NOMINATED', color: '#ffd21a' }, ...(noms[0] ? { chip: [noms[0], 'NOMINATED'] } : {}) });
        else linesToSteps(S, [l], { names, sceneWho: [...noms, 'TJ'] });
      });
      for (const n of noms.slice(1)) S.push({ chip: [n, 'NOMINATED'], focus: noms });
      continue;
    }
    if (part.kind === 'cer-result') {
      const vi = cer.a.votedIn;
      part.lines.forEach(l => {
        if (l.by === HOST && vi && new RegExp(`\\b${vi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(l.text) && !called) {
          called = true;
          const pv = S.pairMap?.[vi];
          S.push({ tj: l.text, focus: [vi, ...(pv ? [pv] : []), 'TJ'], slam: { spray: 'VOTED IN', color: '#ffd21a' }, chip: [vi, 'VOTED IN'] });
          if (pv) S.push({ chip: [pv, 'VOTED IN'], focus: [vi, pv], act: { [vi]: 'slump', [pv]: 'slump' } });
        } else linesToSteps(S, [l], { names, sceneWho: [vi, 'TJ'] });
      });
    }
  }
}

// ── the Arena ─────────────────────────────────────────────────────────
function buildArena(S, open, items, row, { names, house, goneAt }) {
  if (items.some(x => x.a.kind === 'pair-callout' || x.a.kind === 'pair-arena')) return buildArenaPairs(S, open, items, row, { names, house, goneAt });
  open('arena');
  const co = items.find(x => x.a.kind === 'callout');
  const ar = items.find(x => x.a.kind === 'arena');
  const at = co || ar;
  if (!at) { for (const it of items) scene(S, it, { names, house, goneAt, key: 'arena' }); return; }
  S.at(at.i);
  const a = co?.a.who[0] || ar?.a.who[0], b = co?.a.who[1] || ar?.a.who[1];
  const duel = (row.ch?.duels || []).find(d => (d.a === a && d.b === b) || (d.a === b && d.b === a)) || null;
  const here = house.filter(n => !goneAt[at.i]?.has(n) && n !== a);
  // the Arena dressed for tonight's game, where the user painted it (art jobs D02-D11)
  const dressed = duel && CH_MARKS[`arena-${duel.game}-night`] ? `arena-${duel.game}` : ARENA_STAGE.plate;
  const key = plateKey(dressed, true);
  S.painted = dressed !== ARENA_STAGE.plate;
  // a Teams season: the stand sits team by team, so the switch or the stay plays in front of both (2026-10-17)
  const teamIdx = n => (S.teamList || []).findIndex(t => t.members.includes(n));
  const crowd = here.filter(n => n !== b).sort((x, y) => teamIdx(x) - teamIdx(y));
  const cast = { TJ: ['host'], [a]: ['gate'], ...(teamStands(key, b, crowd, teamIdx) || placeScene(key, [b, ...crowd], { group: 'house' })) };
  S.arenaCrowd = crowd; S.arenaCast = { key, cast };
  S.push({ scene: { plate: key, place: 'The Arena', when: whenOf(S.day, S.min), icon: 'skull', island: 'arena', cast, hidden: [a], wipe: 1, embers: 1 },
    card: { k: 'Elimination', t: 'The Arena', sub: `${a} is going in`, faces: [a], icon: 'arena' }, sceneIdx: at.i, title: 'The Arena' });
  S.push({ dir: 'The house is in the stand and the torches are lit. TJ hits the gong.', focus: ['TJ'], gong: 1 });
  S.push({ tj: tjLine('arenaWelcome', {}, `${row.num}|${a}`, S.V.used), focus: ['TJ'] });
  const vote = (row.ch?.votes || []).find(v => v.votedIn === a);
  const recap = vote ? tjLine('arenaRecap', { a, n: vote.tally?.[a] || vote.ballots?.filter(b => b.target === a).length || '' }, `${row.num}|${a}r`, S.V.used)
    : tjLine('arenaVolunteer', { a }, `${row.num}|${a}r`, S.V.used);
  S.push({ tj: recap, focus: ['TJ'] });
  S.push({ enter: { [a]: ['podium', 0, 'L'] }, dir: `${a} walks out of the gate and takes the left podium.`, focus: [a] });
  if (co) {
    S.push({ card: { k: 'The call-out', t: `${a} picks`, sub: `Who goes into the Arena with ${S.V.pron[a]?.obj || 'them'}?`, faces: [a], icon: 'callout' }, focus: [a] });
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
  // what is said at the Arena between the call-out and the duel (an empty threat), in airing order
  const between = items.filter(x => co && x.i > co.i && (!ar || x.i < ar.i) && x !== ar);
  for (const it of between) {
    S.at(it.i);
    linesToSteps(S, it.a.lines || [], { names, sceneWho: it.a.who, first: { sceneIdx: it.i, title: it.title, kind: it.a.kind, focus: it.a.who.slice(0, 2) } });
    if (BIG[it.a.kind]) for (const st of [].concat(BIG[it.a.kind](it.a))) S.push({ focus: it.a.who.slice(0, 4), ...st });
  }
  if (!ar || !duel) return;
  S.push({ card: { k: duel.name, t: `${a} vs ${b}`, sub: 'The loser goes home', faces: [a, b], vs: 1, icon: 'arena' }, focus: [a, b] });
  const g = arenaDef(duel.game);
  const { pre, post } = splitAtResult(ar.a.lines, duel);
  linesToSteps(S, pre, { names, sceneWho: [a, b, 'TJ'] });
  S.push({ rules: { k: "TONIGHT'S ELIMINATION", n: duel.name, li: rulesOf(g?.desc), f: 'The loser goes home' }, tj: pre.some(l => l.by === HOST) ? null : fill(pickBy(TJ_ARENA_RULES, `${row.num}|${duel.game}`), { game: duel.name }), focus: ['TJ'], props: ARENA_PLAY[duel.game]?.set({}) || [] });
  playDuel(S, duel, `${row.num}|${duel.game}`, S.arenaCrowd || []);
  const bye = items.find(x => x.a.kind === 'arena-goodbye' && x.a.data?.loser === duel.loser);
  finishDuel(S, duel, post, names, `${row.num}|${duel.game}`, S.arenaCrowd || [], bye);
  // a Teams season: the winner's choice, in front of both teams in the stand, a team folding, and anything that aired
  // on the Arena night between the duel and the choice, in airing order
  const done = new Set([co, ar, bye, ...between].filter(Boolean));
  for (const it of items.filter(x => !done.has(x)).sort((x, y) => x.i - y.i)) {
    if (['team-switch', 'team-stay', 'team-fold'].includes(it.a.kind)) { teamChoice(S, it, { names }); continue; }
    S.at(it.i);
    linesToSteps(S, it.a.lines || [], { names, sceneWho: it.a.who, first: { sceneIdx: it.i, title: it.title, kind: it.a.kind, focus: it.a.who.slice(0, 2) } });
    if (BIG[it.a.kind]) for (const st of [].concat(BIG[it.a.kind](it.a))) S.push({ focus: it.a.who.slice(0, 4), ...st });
  }
}

// A Teams season's Arena: one team in the bleachers on the left, the other on the plate's right-hand stand, so the
// winner's choice plays between them (the user, 2026-10-17: "we need to see every team"). Null when the plate has
// no right-hand stand or only one team is watching; the house then sits together as before.
function teamStands(key, b, crowd, teamIdx) {
  const sides = [...new Set(crowd.map(teamIdx))].filter(i => i >= 0);
  if (sides.length < 2) return null;
  const ms = marksOf(key);
  const gStands = ms.filter(m => m.kind === 'stand' && m.group === 'house');
  const right = gStands.map((m, i) => ({ m, i })).filter(x => x.m.u > .6);
  if (!right.length) return null;
  // the team with fewer people here takes the right, so the bleachers hold the bigger one
  const count = i => crowd.filter(n => teamIdx(n) === i).length;
  const rightTeam = [...sides].sort((x, y) => count(x) - count(y))[0];
  const R = crowd.filter(n => teamIdx(n) === rightTeam), L = crowd.filter(n => teamIdx(n) !== rightTeam);
  // the left side may not use the right-hand stand marks
  const spec = placeScene(key, [b, ...L], { group: 'house', keep: m => m.u <= .6 });
  const u0 = Math.min(...right.map(x => x.m.u)), v = Math.max(...right.map(x => x.m.v)), sz = right[0].m.s || .07;
  R.forEach((n, k) => {
    if (k < right.length) { spec[n] = ['stand', right[k].i, 'house']; return; }
    // the rest stand in rows behind the marks, spread across the same ground
    // (four across, a step wider than a face, each row a little further back and offset half a step)
    const j = k - right.length, row = Math.floor(j / 4) + 1, col = j % 4;
    const left = Math.max(.66, Math.min(u0, 1 - .06 - 3.5 * .062) - .04);
    spec[n] = { u: Math.min(.96, left + (col + (row % 2 ? .5 : 0)) * .062), v: v - .045 * row, s: sz * Math.pow(.93, row) };
  });
  return spec;
}

// Where an Arena winner goes after their answer: beside the front of the team they will play for, on its side of
// the Arena (teamStands), stepping in toward the middle. Null when that team has nobody in the stand.
function besideTeam(S, team, w) {
  const A = S.arenaCast; if (!A) return null;
  const ms = marksOf(A.key);
  const at = sp => {
    if (!sp) return null;
    if (!Array.isArray(sp)) return sp;
    const [kind, i = 0, group] = sp;
    return ms.filter(m => m.kind === kind && (group ? m.group === group : !m.group))[i] || null;
  };
  const mates = Object.entries(S.teamNames || {}).filter(([n, t]) => t === team && n !== w).map(([n]) => at(A.cast[n])).filter(Boolean);
  if (!mates.length) return null;
  const front = [...mates].sort((x, y) => y.v - x.v)[0];
  const inward = front.u < .5 ? 1 : -1;
  return { u: Math.min(.96, Math.max(.04, front.u + inward * .065)), v: Math.min(.7, front.v + .015), s: (front.s || .07) * 1.04 };
}

// The Arena winner's choice in a Teams season (ch/teams.js afterTeamDuel): TJ asks, both teams watch from the stand,
// the answer, and both teams react; a switch recolours the player from here on. A team down to one folds.
function teamChoice(S, it, { names }) {
  S.at(it.i);
  const a = it.a, d = a.data || {}, w = a.who[0];
  const stand = (S.teamList || []).map(t => t.name);
  if (a.kind === 'team-fold') {
    S.push({ card: { k: 'Team gone', t: d.from || 'A team', sub: `${w} is the last of them, and joins ${d.to || 'the others'}`, faces: [w], icon: 'arena' }, focus: [w], sceneIdx: it.i, title: 'A team folds' });
    linesToSteps(S, a.lines || [], { names, sceneWho: a.who });
    S.push({ reband: { [w]: d.to }, chip: [w, `NOW ${String(d.to || '').toUpperCase()}`], focus: [w] });
    return;
  }
  S.push({ card: { k: 'The choice', t: `${w}: stay or switch`, sub: `${d.from} voted ${w} in. ${stand.filter(n => n !== d.from).join(' and ') || 'The other team'} would take ${S.V.pron[w]?.obj || 'them'}.`, faces: [w], icon: 'arena' },
    focus: [], sceneIdx: it.i, title: a.kind === 'team-switch' ? 'Switching sides' : 'Staying put' });
  const lines = a.lines || [];
  // the answer is the first thing the winner says; the switch slams and recolours on it, and the winner walks over to
  // the side they chose (the team they join, or back to the one that voted them in)
  const answer = lines.findIndex(l => l.by === w && l.kind === 'say');
  const goTo = besideTeam(S, a.kind === 'team-switch' ? d.to : d.from, w);
  lines.forEach((l, k) => {
    if (k === answer) {
      // the answer is a wide shot: both teams' faces when it lands
      S.push({ say: [l.by, l.text], focus: [], ...(goTo ? { move: { [w]: goTo } } : {}), ...(a.kind === 'team-switch'
        ? { slam: { spray: 'SWITCHED SIDES', color: '#ffd21a' }, reband: { [w]: d.to }, chip: [w, `NOW ${String(d.to || '').toUpperCase()}`], shake: 1 }
        : { slam: { stamp: 'STAYING' }, chip: [w, `STAYS WITH ${String(d.from || '').toUpperCase()}`] }) });
    } else linesToSteps(S, [l], { names, sceneWho: a.who });
  });
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
// On a painted set the set itself is in the painting: only what moves is drawn over it (the ball, the
// pole turning, a lockbox going off), never a second ramp of barrels or a second wall of crates.
const MOVING = new Set(['ballring', 'pole', 'lockbox']);
const onSet = (S, props) => (S.painted ? (props || []).filter(p => MOVING.has(p.k)) : props);

function playDuel(S, duel, seed, crowd = []) {
  const { a, b } = duel;
  const AP = ARENA_PLAY[duel.game] || null;
  const format = duel.beats[0]?.kind || 'stage';
  const pose = POSE[duel.game];
  S.push({ move: { [a]: ['duel', 0, 'L'], [b]: ['duel', 0, 'R'] }, tj: pickBy(TJ_GO, seed), gong: 1, focus: [a, b], cam: [.5, .6, 1.2],
    duel: { a, b, format, score: { [a]: 0, [b]: 0 }, prog: { [a]: 0, [b]: 0 }, max: format === 'round' ? Math.max(...duel.beats.map(x => Math.max(...Object.values(x.score || { x: 0 })))) : 12 },
    hang: format === 'hold' ? 'duel' : null, pose: pose ? { [a]: pose, [b]: pose } : null, props: AP ? onSet(S, AP.set(setState(duel, {}))) : null });
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
    // somebody in the stand shouts to the one who needs it
    const cheerFor = k % 2 ? w : l;
    const by = fanOf(S.V, cheerFor, crowd);
    if (by) { const t = speak(ARENA_VOICE.shout, by, { a: cheerFor }, `${seed}|sh${k}`, S.V.used); if (t) S.push({ say: [by, t], focus: [cheerFor], act: { [by]: 'shout' }, duel: { a, b, format: bt.kind, score: S._lastScore || null, prog: { ...S._prevProg || prog } } }); }
    S.push({ dir: text, focus: [w, l], act: { [w]: bt.kind === 'hold' ? 'look' : 'cheer', [l]: 'flinch' }, cam: [w === a ? .44 : .56, .6, 1.28],
      duel: { a, b, format: bt.kind, score: bt.score ? { ...bt.score } : null, prog: { ...prog }, ahead: w }, dig: bt.kind === 'stage' && duel.game === 'puzzle-pit' ? [a, b] : null,
      props: AP ? onSet(S, AP.set(setState(duel, prog, { tilt, ball, sag, low: k + 1 }))) : null, shake: bt.kind === 'round' ? 1 : 0 });
    S._lastScore = bt.score ? { ...bt.score } : null; S._prevProg = { ...prog };
    // TJ calls the score between rounds; somebody in the stand talks to the camera halfway through
    const last = duel.beats.filter(x => x.kind !== 'finish').length - 1;
    if (bt.kind === 'round' && bt.score && k < last) {
      const sw = bt.score[w], sl = bt.score[l];
      const num = x => ['nothing', 'one', 'two', 'three', 'four'][x] || String(x);
      S.push({ tj: sw === sl ? tjLine('scoreTie', { s: `${num(sw)}-${num(sl)}` }, `${seed}|t${k}`, S.V.used) : tjLine('score', { s: `${num(sw)}-${num(sl)}`, w, l: sw > sl ? l : w }, `${seed}|t${k}`, S.V.used), focus: ['TJ', w, l] });
    }
    if (k === Math.floor(last / 2)) {
      const who = crowd.find(n => !(S.V.ties[n]?.friends || []).includes(a) && !(S.V.ties[n]?.friends || []).includes(b)) || crowd[0];
      if (who) { const t = speak(ARENA_VOICE.stand, who, { a: w, b: l, pron: S.V.pron }, `${seed}|st${k}`, S.V.used); if (t) S.push({ conf: [who, t] }); }
    }
  });
  S._lastProg = prog;
}
function finishDuel(S, duel, lines, names, seed, crowd = [], bye = null) {
  const { a, b, winner: w, loser: l } = duel;
  const fin = { a, b, format: duel.beats[0]?.kind || 'stage', score: duel.beats.filter(x => x.score).slice(-1)[0]?.score || null, prog: { [w]: 12, [l]: Math.max(6, (S._lastProg?.[l] || 8)) }, done: w };
  const beat = lines[0]?.kind === 'beat' ? 0 : -1;
  const AP = ARENA_PLAY[duel.game] || null;
  const done = { [w === a ? 'done' : 'doneR']: 1, done: w === a ? 'L' : 'R' };
  const first = { slam: { winner: `${w} wins` }, focus: [w], act: { [w]: 'cheer' }, shake: 1, duel: fin, cam: [w === a ? .44 : .56, .58, 1.3], drop: fin.format === 'hold' ? [l] : null,
    props: AP ? onSet(S, AP.set(setState(duel, fin.prog, { ...done, tilt: w === a ? -30 : 30, ball: w === a ? -1 : 1, sag: w === a ? 10 : 50, low: 4 }))) : null };
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
  if (!stamped) S.push({ tj: tjLine('farewell', { l }, seed, S.V.used), slam: { stamp: 'ELIMINATED' }, focus: [l], act: { [l]: 'slump' } });
  if (!lines.some(x => x.by === HOST && new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(x.text) && /stay|still|rejoin|back/i.test(x.text)))
    S.push({ tj: tjLine('winner', { w }, seed + 'w', S.V.used), focus: [w, 'TJ'] });
  // the goodbye at the gate (ch/goodbye.js): last words, the friends down from the stand, a parting shot, and the
  // exit interview as they walk out (the user, 2026-10-16: "its so quick")
  if (bye?.a.lines?.length) {
    S.at(bye.i);
    S.push({ bye: 1, seg: ['The goodbye', 'The Arena'], dir: '', focus: [l, ...(bye.a.data?.friends || [])] });
    linesToSteps(S, bye.a.lines, { names, sceneWho: [l, ...(bye.a.data?.friends || []), 'TJ'] });
    if (bye.a.data?.shot) S.push({ chip: [bye.a.data.shot, 'CALLED OUT ON THE WAY OUT'], focus: [bye.a.data.shot] });
  } else {
    const fan = fanOf(S.V, l, crowd);
    if (fan) { const t = speak(ARENA_VOICE.bye, fan, { l }, `${seed}|bye`, S.V.used); if (t) S.push({ say: [fan, t], focus: [l], act: { [fan]: 'shout' } }); }
    if (!lines.some(x => x.by === l && x.kind === 'conf')) { const t = speak(ARENA_VOICE.out, l, {}, `${seed}|out`, S.V.used); if (t) S.push({ conf: [l, t] }); }
  }
  S.push({ exit: [l], dir: `${l} walks back out through the gate.`, focus: [w] });
  if (crowd.length) S.push({ tj: tjLine('signoff', {}, seed + 's', S.V.used), focus: ['TJ'] });
}

// ── the Arena of a Pairs season: two on two ───────────────────────────
// The call-out decided by a pair (ch/pairs.js choosePairOpponent: agreed, or one overruled the other), both pairs at
// their podiums, the duel beat by beat with who won and who cost each one for their side, the losing pair's goodbyes,
// and what each pair says after it. A plate has one podium and one duel mark a side: the partner stands just outside
// it, a step back toward the middle (sideMark).
function sideMark(key, kind, side, k) {
  const m = marksOf(key).find(x => x.kind === kind && x.side === side);
  if (!m) return [kind, 0, side];
  if (!k) return m;
  // at the podiums the partner stands a step inside (outside is the stand); on the floor, a step outside (inside,
  // the two pairs would stand on each other)
  const out = kind === 'duel' ? -1 : 1;
  const dx = (side === 'L' ? 1 : -1) * out * (m.s || .07) * 0.95;
  return { ...m, u: Math.max(.03, Math.min(.97, m.u + dx)), v: m.v + (kind === 'duel' ? .01 : -.012) };
}
const sideOf = (key, kind, side, pair) => Object.fromEntries(pair.filter(Boolean).map((n, k) => [n, sideMark(key, kind, side, k)]));
function buildArenaPairs(S, open, items, row, { names, house, goneAt }) {
  open('arena');
  const co = items.find(x => x.a.kind === 'pair-callout');
  const ar = items.find(x => x.a.kind === 'pair-arena');
  const at = co || ar;
  S.at(at.i);
  const duels = (row.ch?.duels || []).filter(d => d.pairs);
  const has = (d, n) => d.pairA.includes(n) || d.pairB.includes(n);
  const duel = (co && duels.find(d => has(d, co.a.who[0]) && has(d, co.a.who[1]))) || (ar && duels.find(d => d.winners.includes(ar.a.data?.winners?.[0]))) || null;
  const A = duel ? duel.pairA : [co.a.who[0], co.a.who[2]].filter(Boolean);
  const B = duel ? duel.pairB : [co.a.who[1], co.a.who[3]].filter(Boolean);
  const here = house.filter(n => !goneAt[at.i]?.has(n));
  const dressed = duel && CH_MARKS[`arena-${duel.game}-night`] ? `arena-${duel.game}` : ARENA_STAGE.plate;
  const key = plateKey(dressed, true);
  S.painted = dressed !== ARENA_STAGE.plate;
  const crowd = here.filter(n => !A.includes(n) && !B.includes(n));
  const cast = { TJ: ['host'], ...Object.fromEntries(A.map(n => [n, ['gate']])), ...placeScene(key, [...B, ...crowd], { group: 'house' }) };
  S.arenaCrowd = crowd;
  const seed = `${row.num}|${duel?.game || 'arena'}|${A[0]}`;
  S.push({ scene: { plate: key, place: 'The Arena', when: whenOf(S.day, S.min), icon: 'skull', island: 'arena', cast, hidden: [...A], wipe: 1, embers: 1 },
    card: { k: 'Elimination', t: 'The Arena', sub: `${nameList(A)} are going in, together`, faces: A, icon: 'arena' }, sceneIdx: at.i, title: 'The Arena' });
  S.push({ dir: 'The house is in the stand and the torches are lit. TJ hits the gong.', focus: ['TJ'], gong: 1 });
  S.push({ tj: tjLine('arenaWelcome', {}, `${row.num}|${A[0]}`, S.V.used), focus: ['TJ'] });
  const vote = (row.ch?.votes || []).find(v => A.includes(v.votedIn));
  S.push({ tj: vote ? tjLine('pairRecap', { a: A[0], b: A[1] || A[0], n: vote.tally?.[vote.votedIn] || '' }, `${seed}r`, S.V.used) : tjLine('pairVolunteer', { a: A[0], b: A[1] || A[0] }, `${seed}r`, S.V.used), focus: ['TJ'] });
  S.push({ enter: sideOf(key, 'podium', 'L', A), dir: `${nameList(A)} walk out of the gate and take the left podium.`, focus: A });
  if (co) {
    const dec = co.a.who[0], about = co.a.who[1];
    S.push({ card: { k: 'The call-out', t: `${nameList(A)} pick`, sub: 'Which pair goes into the Arena with them?', faces: A, icon: 'callout' }, focus: A });
    const lines = co.a.lines;
    if (!lines.some(l => l.by === HOST)) S.push({ tj: tjLine('pairAsk', { a: A[0], b: A[1] || A[0] }, `${seed}a`, S.V.used), focus: [...A, 'TJ'] });
    const nm = x => new RegExp(`\\b${String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    const named = lines.findIndex(l => A.includes(l.by) && l.kind === 'say' && B.some(n => nm(n).test(l.text)));
    const callAt = named >= 0 ? named : lines.findIndex(l => A.includes(l.by) && l.kind === 'say');
    lines.forEach((l, k) => {
      if (k === callAt) S.push({ say: [l.by, l.text], focus: A, slam: { spray: 'CALLED OUT', color: '#ff6a1a' }, act: Object.fromEntries(B.map(n => [n, 'flinch'])), chip: [B[0], 'CALLED OUT'],
        know: REASON[co.a.data?.reason] ? [`Why ${nameList(B)}`, REASON[co.a.data.reason](dec, about) + (co.a.data?.overruled ? ` <b>${esc(co.a.data.overruled)}</b> wanted another pair, and was overruled.` : '')] : null });
      else linesToSteps(S, [l], { names, sceneWho: [...A, ...B, 'TJ'] });
    });
    if (B[1]) S.push({ chip: [B[1], 'CALLED OUT'], focus: B });
    S.push({ enter: sideOf(key, 'podium', 'R', B), dir: `${nameList(B)} come down from the stand and take the right podium.`, focus: B });
  }
  // what is said at the Arena between the call-out and the duel (an empty threat) plays before it, in airing order
  const between = co && ar ? items.filter(x => x.i > co.i && x.i < ar.i) : [];
  for (const it of between) afterPairDuel(S, it, names);
  const rest = items.filter(x => x !== co && x !== ar && !between.includes(x));
  if (!ar || !duel) { for (const it of rest) afterPairDuel(S, it, names); return; }
  S.push({ card: { k: duel.name, t: `${nameList(A)} vs ${nameList(B)}`, sub: 'The losing pair goes home', vsPairs: [A, B], icon: 'arena' }, focus: [...A, ...B] });
  const g = arenaDef(duel.game);
  // a two-on-two's lines are all after the result (lines/pairs.js: TJ calls it first): nothing is said before the play
  const pre = [], post = ar.a.lines || [];
  S.push({ rules: { k: "TONIGHT'S ELIMINATION", n: duel.name, li: [...rulesOf(g?.desc), 'Tonight it is <b>two on two</b>: both partners play, and every round counts for the pair.'], f: 'The losing pair goes home' },
    tj: pre.some(l => l.by === HOST) ? null : fill(pickBy(TJ_ARENA_RULES, `${row.num}|${duel.game}`), { game: duel.name }), focus: ['TJ'], props: ARENA_PLAY[duel.game]?.set({}) || [] });
  playPairDuelSteps(S, duel, seed, crowd, key);
  finishPairDuel(S, duel, post, names, seed, crowd, rest);
}

// A two-on-two's play, from its beats: each one names who won it for their side and who cost it for theirs.
function playPairDuelSteps(S, duel, seed, crowd, key) {
  const { a, b } = duel, A = duel.pairA || [a], B = duel.pairB || [b];
  const pairs = { [a]: A, [b]: B };
  const side = n => (A.includes(n) ? a : b);
  const AP = ARENA_PLAY[duel.game] || null;
  const format = duel.beats[0]?.kind || 'stage';
  const pose = POSE[duel.game];
  S.push({ move: { ...sideOf(key, 'duel', 'L', A), ...sideOf(key, 'duel', 'R', B) }, tj: pickBy(TJ_GO, seed), gong: 1, focus: [...A, ...B], cam: [.5, .6, 1.2],
    duel: { a, b, pairs, format, score: { [a]: 0, [b]: 0 }, prog: { [a]: 0, [b]: 0 }, max: format === 'round' ? Math.max(...duel.beats.map(x => Math.max(...Object.values(x.score || { x: 0 })))) : 12 },
    hang: format === 'hold' ? 'duel' : null, pose: pose ? Object.fromEntries([...A, ...B].map(n => [n, pose])) : null, props: AP ? onSet(S, AP.set(setState(duel, {}))) : null });
  let prev = null, prog = { [a]: 0, [b]: 0 };
  const last = duel.beats.filter(x => x.kind !== 'finish').length - 1;
  duel.beats.forEach((bt, k) => {
    if (bt.kind === 'finish') return;
    const w = bt.winner || bt.ahead;
    const l = w === a ? b : a;
    // the one who did it for the winning side, the one who cost it on the other
    const by = bt.by && side(bt.by) === w ? bt.by : pairs[w][0];
    const cost = bt.cost && side(bt.cost) === l ? bt.cost : pairs[l][0];
    let text;
    if (AP && bt.kind === 'round' && AP.round) text = fill(pickBy(AP.round, seed + k), { w: by, l: cost, n: bt.n });
    else if (AP && bt.kind === 'stage' && AP.stage) text = fill(pickBy(AP.stage[Math.min(k, AP.stage.length - 1)], seed + k), { w: by, l: cost });
    else if (AP && bt.kind === 'hold' && AP.hold) text = fill(AP.hold[Math.min(k, AP.hold.length - 1)], { w: by, l: cost });
    else if (bt.kind === 'round') text = fill(pickBy(bt.margin < .3 ? DUEL.rounds.close : DUEL.rounds.win, seed + k), { w: by, n: bt.n });
    else if (bt.kind === 'hold') text = fill(pickBy(bt.margin < .3 ? DUEL.hold.close : DUEL.hold.hold, seed + k), { w: by });
    else text = fill(pickBy(prev && prev !== w ? DUEL.stage.swap : bt.margin < .2 ? DUEL.stage.close : DUEL.stage.ahead, seed + k), { w: by });
    prev = w;
    prog = { [w]: Math.min(11, Math.round((k + 1) * 3.2 + bt.margin * 1.5)), [l]: Math.min(10, Math.round((k + 1) * 3.2 - bt.margin * 2.5)) };
    const tilt = w === a ? -18 : 18, ball = w === a ? -.8 : .8, sag = w === a ? 18 : 42;
    // somebody in the stand shouts to the one on the side that needs it
    const fan = fanOf(S.V, cost, crowd);
    if (fan && k % 2) { const t = speak(ARENA_VOICE.shout, fan, { a: cost }, `${seed}|sh${k}`, S.V.used); if (t) S.push({ say: [fan, t], focus: [cost], act: { [fan]: 'shout' }, duel: { a, b, pairs, format: bt.kind, score: S._lastScore || null, prog: { ...(S._prevProg || prog) } } }); }
    S.push({ dir: text, focus: [by, cost], act: { [by]: bt.kind === 'hold' ? 'look' : 'cheer', [cost]: 'flinch' }, cam: [w === a ? .42 : .58, .6, 1.24],
      duel: { a, b, pairs, format: bt.kind, score: bt.score ? { ...bt.score } : null, prog: { ...prog }, ahead: w }, dig: bt.kind === 'stage' && duel.game === 'puzzle-pit' ? [...A, ...B] : null,
      props: AP ? onSet(S, AP.set(setState(duel, prog, { tilt, ball, sag, low: k + 1 }))) : null, shake: bt.kind === 'round' ? 1 : 0 });
    S._lastScore = bt.score ? { ...bt.score } : null; S._prevProg = { ...prog };
    if (bt.kind === 'round' && bt.score && k < last) {
      const sw = bt.score[w], sl = bt.score[l];
      const num = x => ['nothing', 'one', 'two', 'three', 'four'][x] || String(x);
      S.push({ tj: sw === sl ? tjLine('scoreTie', { s: `${num(sw)}-${num(sl)}` }, `${seed}|t${k}`, S.V.used)
        : tjLine('pairScore', { s: `${num(Math.max(sw, sl))}-${num(Math.min(sw, sl))}`, w: nameList(pairs[sw > sl ? w : l]), l: nameList(pairs[sw > sl ? l : w]) }, `${seed}|t${k}`, S.V.used), focus: ['TJ', ...pairs[w]] });
    }
    if (k === Math.floor(last / 2)) {
      const who = crowd.find(n => ![...A, ...B].some(x => (S.V.ties[n]?.friends || []).includes(x))) || crowd[0];
      if (who) { const t = speak(ARENA_VOICE.stand, who, { a: by, b: cost, pron: S.V.pron }, `${seed}|st${k}`, S.V.used); if (t) S.push({ conf: [who, t] }); }
    }
  });
  S._lastProg = prog;
}

// The result, the losing pair stamped out, what each pair says after it, both goodbyes, and the walk out together.
function finishPairDuel(S, duel, lines, names, seed, crowd, rest) {
  const { a, b, winner: w, loser: l } = duel, W = duel.winners, L = duel.losers;
  const pairs = { [a]: duel.pairA, [b]: duel.pairB };
  const fin = { a, b, pairs, format: duel.beats[0]?.kind || 'stage', score: duel.beats.filter(x => x.score).slice(-1)[0]?.score || null, prog: { [w]: 12, [l]: Math.max(6, (S._lastProg?.[l] || 8)) }, done: w };
  const AP = ARENA_PLAY[duel.game] || null;
  const done = { [w === a ? 'done' : 'doneR']: 1, done: w === a ? 'L' : 'R' };
  const beat = lines[0]?.kind === 'beat' ? 0 : -1;
  const first = { slam: { winner: `${nameList(W)} win` }, focus: W, act: Object.fromEntries(W.map(n => [n, 'cheer'])), shake: 1, duel: fin, cam: [w === a ? .42 : .58, .58, 1.26], drop: fin.format === 'hold' ? L : null,
    props: AP ? onSet(S, AP.set(setState(duel, fin.prog, { ...done, tilt: w === a ? -30 : 30, ball: w === a ? -1 : 1, sag: w === a ? 10 : 50, low: 4 }))) : null };
  if (AP?.finish) { S.push({ ...first, dir: fill(AP.finish, { w: W[0], l: L[0] }) }); if (beat >= 0) S.push({ dir: lines[beat].text, focus: W }); }
  else if (beat >= 0) { first.dir = lines[beat].text; S.push(first); }
  else S.push({ ...first, dir: `${nameList(W)} win it.` });
  const nm = x => new RegExp(`\\b${String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  let stamped = false;
  lines.forEach((x, k) => {
    if (k === beat) return;
    if (!stamped && x.by === HOST && L.some(n => nm(n).test(x.text))) {
      stamped = true;
      S.push({ tj: x.text, slam: { stamp: 'ELIMINATED' }, focus: L, act: Object.fromEntries(L.map(n => [n, 'slump'])) });
    } else linesToSteps(S, [x], { names, sceneWho: [...W, ...L, 'TJ'] });
  });
  if (!stamped) S.push({ tj: tjLine('pairFarewell', { l: nameList(L) }, seed, S.V.used), slam: { stamp: 'ELIMINATED' }, focus: L, act: Object.fromEntries(L.map(n => [n, 'slump'])) });
  if (!lines.some(x => x.by === HOST && W.some(n => nm(n).test(x.text)) && /stay|still|rejoin|back/i.test(x.text)))
    S.push({ tj: tjLine('pairWinner', { w: nameList(W) }, seed + 'w', S.V.used), focus: [...W, 'TJ'] });
  for (const it of rest) afterPairDuel(S, it, names);
  S.push({ exit: L, dir: `${nameList(L)} walk back out through the gate, together.`, focus: W });
  if (crowd.length) S.push({ tj: tjLine('signoff', {}, seed + 's', S.V.used), focus: ['TJ'] });
}
// What follows a two-on-two on the same stage: inside each pair, the goodbyes, a stolen partner, the money and skulls.
function afterPairDuel(S, it, names) {
  S.at(it.i);
  if (it.a.kind === 'arena-goodbye') {
    const l = it.a.data?.loser, friends = it.a.data?.friends || [];
    S.push({ bye: 1, seg: ['The goodbye', 'The Arena'], dir: '', focus: [l, ...friends] });
    linesToSteps(S, it.a.lines || [], { names, sceneWho: [l, ...friends, 'TJ'] });
    if (it.a.data?.shot) S.push({ chip: [it.a.data.shot, 'CALLED OUT ON THE WAY OUT'], focus: [it.a.data.shot] });
    return;
  }
  linesToSteps(S, it.a.lines || [], { names, sceneWho: it.a.who, first: { sceneIdx: it.i, title: it.title, kind: it.a.kind, focus: it.a.who.slice(0, 2) } });
  if (BIG[it.a.kind]) for (const st of [].concat(BIG[it.a.kind](it.a))) S.push({ focus: it.a.who.slice(0, 4), ...st });
}

// ── share or keep (ch/share-keep.js) ───────────────────────────────────
// TJ's rules at the finish line, then each pair's chooser in turn (the last pair first, the champions last): the
// card, the pause, the word, and the slam that goes with it.
function shareKeepSteps(S, it, f, { names }) {
  const a = it.a;
  S.at(it.i);
  const st = FINAL_STAGE.finish, pk = plateKey(st.plate, false);
  const all = f.pairPodium ? Object.values(f.pairPodium).flat(2) : (f.finalists || a.who);
  const money = n => `$${Math.round(n || 0).toLocaleString('en-US')}`;
  if (a.kind === 'share-keep-rules') {
    const slots = lineup(pk, all.length);
    S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, Math.max(S.min, 14 * 60)), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...Object.fromEntries(all.map((n, i) => [n, slots[i]])) }, wipe: 1 },
      card: { k: 'The finish line', t: 'Share or keep', sub: 'The partner with more points decides what happens to the money', faces: all.slice(0, 10) }, sceneIdx: it.i, title: 'Share or keep' });
    S.push({ rules: { k: 'THE LAST DECISION', n: 'Share or keep', li: ['Every pair that finished with money makes one choice.', 'The partner who scored <b>more points</b> in the final decides.',
      '<b>Share</b>: the money is split down the middle. <b>Keep</b>: the one who decides takes every dollar.', 'The last pair goes first and the champions go last, in front of everybody who was sent home this season.'],
      f: 'One word, and the season is remembered by it' }, focus: ['TJ'] });
    linesToSteps(S, a.lines || [], { names, sceneWho: ['TJ', ...all] });
    return;
  }
  const [c, p] = a.who, keep = !!a.data?.keep, amt = money(a.data?.amount);
  S.push({ card: { k: `${(ORD[a.data?.place] || '').replace(/^./, x => x.toUpperCase())} place · ${amt}`, t: `${c} decides`, sub: `Share it with ${p}, or keep it all`, faces: [c, p], icon: 'final' },
    focus: [c, p], sceneIdx: it.i, title: 'Share or keep' });
  const callAt = (a.lines || []).findIndex(l => l.by === c && l.kind === 'say' && /\b(share|sharing|keep|keeping)\b/i.test(l.text));
  const slam = keep ? { slam: { stamp: 'KEPT IT ALL' }, chip: [c, `KEPT ${amt}`], act: { [p]: 'slump', [c]: 'look' }, shake: 1 }
    : { slam: { spray: 'SHARED', color: '#2fd35a' }, chip: [c, `SHARED ${amt}`], act: { [c]: 'hug', [p]: 'hug' }, ...(a.data?.champions ? { confetti: 1 } : {}) };
  (a.lines || []).forEach((l, k) => {
    if (k === callAt) S.push({ say: [l.by, l.text], focus: [c, p], ...slam });
    else linesToSteps(S, [l], { names, sceneWho: [c, p, 'TJ'] });
  });
  if (callAt < 0) S.push({ dir: keep ? `${c} keeps all of it.` : `${c} shares it with ${p}.`, focus: [c, p], ...slam });
}

// Somebody in the crowd who would shout for n: a friend first, else anyone there.
function fanOf(V, n, crowd) {
  const f = (V.ties[n]?.friends || []).find(x => crowd.includes(x));
  return f || crowd.find(x => x !== n && V.ties[x]?.rival !== n) || null;
}

// A rule as TJ says it: the game's description in the second person ("Players swim out" -> "You swim out").
export function toYou(t) {
  // what belongs to somebody else stays theirs ("knock a rival off their platform")
  const keep = [];
  let x = String(t).replace(/\b(rival|opponent|other)(['’]s)?(\s+\w+){0,2}\s+their\b/g, m => { keep.push(m); return `\u0000${keep.length - 1}\u0000`; });
  x = x
    // TJ is the one talking
    .replace(/\bTJ['’]s\b/g, 'my').replace(/\bTJ (\w+?)s\b/g, 'I $1').replace(/\bTJ\b/g, 'I')
    .replace(/\bThe players\b/g, 'You').replace(/\bthe players\b/g, 'you').replace(/\bthat player\b/g, 'you').replace(/\bThe two players\b/g, 'You two').replace(/\bthe two players\b/g, 'you two').replace(/\bBoth players\b/g, 'Both of you')
    .replace(/\bEach player\b/g, 'Each of you').replace(/\beach player\b/g, 'each of you').replace(/\bEvery player\b/g, 'Every one of you')
    .replace(/\bPlayers\b/g, 'You').replace(/\bplayers\b/g, 'you').replace(/\bThey\b/g, 'You').replace(/\bthey\b/g, 'you')
    .replace(/\bTheir\b/g, 'Your').replace(/\btheir\b/g, 'your').replace(/\bthemselves\b/g, 'yourselves').replace(/\bbehind them\b/g, 'behind you')
    .replace(/(?<![Ee]ach of )\byou has\b/g, 'you have').replace(/\byou is\b/g, 'you are').replace(/\byou was\b/g, 'you were');
  return x.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
}

// The house's voices woven through a daily (voices.js): nerves before it starts, the leader and somebody
// watching them, a shout to the one falling behind, their own struggle, and a friend's or a rival's word.
// At most nine voices a daily, two per person, each said once.
function weaveDaily(steps, d, st, V, people) {
  const out = [];
  const said = {};
  let n = 0;
  const units = d.order || [];
  const lead = (units.find(u => u.some(x => (d.winners || []).includes(x))) || units[0] || [])[0];
  const back = (units[units.length - 1] || [])[0];
  const nervous = (units[Math.floor(units.length * .7)] || [])[0];
  const verb = st.verb;
  const can = who => who && people.includes(who) && (said[who] || 0) < 2 && n < 14;
  const add = x => { out.push(x); n++; const w = x.say?.[0] || x.conf?.[0]; if (w) said[w] = (said[w] || 0) + 1; };
  const someone = not => people.find(p => !not.includes(p) && (said[p] || 0) === 0);
  const shout = (to, pool, key) => {
    if (!to) return;
    const by = (V.ties[to]?.friends || []).find(f => people.includes(f) && can(f)) || someone([to, lead, back]);
    if (!can(by)) return;
    const t = speak(pool, by, { a: to }, `${V.seed}|${key}|${to}`, V.used);
    if (t) add({ say: [by, t], focus: [by, to], act: { [by]: 'shout' } });
  };
  const conf = (who, pool, slots, key) => {
    if (!can(who)) return;
    const t = speak(pool, who, { ...slots, pron: V.pron }, `${V.seed}|${key}|${who}`, V.used);
    if (t) add({ conf: [who, t] });
  };
  let didLead = false, didBack = false;
  steps.forEach((x, k) => {
    if (x.tjCall) { const t = tjLine('call', x.tjCall, `${V.seed}|call${k}`, V.used); if (t) out.push({ tj: t, focus: x.focus }); return; }
    out.push(x);
    const f = x.focus || [];
    if (x.mid) conf(x.mid, DAILY_VOICE.mid, {}, `mid${k}`);
    if (k === 0) { conf(nervous, DAILY_VOICE.nerves, {}, 'nerves'); shout(lead, DAILY_VOICE.verb[verb] || DAILY_VOICE.go, 'v0'); }
    if (!didLead && lead && f.includes(lead)) {
      didLead = true;
      conf(lead, DAILY_VOICE.lead[verb] || DAILY_VOICE.lead.any, {}, 'lead');
      conf(V.ties[lead]?.rival && people.includes(V.ties[lead].rival) ? V.ties[lead].rival : someone([lead]), DAILY_VOICE.watchLead, { a: lead }, 'wl');
      shout(lead, DAILY_VOICE.go, 'go');
    }
    if (!didBack && back && (f.includes(back) || (x.drop || []).includes(back))) {
      didBack = true;
      shout(back, DAILY_VOICE.back, 'back');
      conf(back, DAILY_VOICE.back[verb] || DAILY_VOICE.back.any, {}, 'struggle');
      const r = V.ties[back]?.rival;
      if (r && people.includes(r)) conf(r, DAILY_VOICE.watchBackRival, { a: back }, 'wbr');
      else conf((V.ties[back]?.friends || []).find(p => people.includes(p)), DAILY_VOICE.watchBackFriend, { a: back }, 'wbf');
    }
  });
  return out;
}

// ── the final ─────────────────────────────────────────────────────────
// ── the final, taking its time (the user, 2026-10-16: "very expeditive ... 6 frames for a challenge is a joke,
// we barely know what they're supposed to do, no suspense, barely any last word or congratulations") ──
const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

function buildFinal(S, open, key, items, row, { names, house }) {
  const f = row.ch?.final || {};
  open(key);
  const finalists = f.finalists || house;
  const seed = `final|${row.num}`;
  const gendered = Object.keys(f.podium || {}).some(d => d !== 'all');
  const divName = d => (d === 'm' ? 'the men' : d === 'f' ? 'the women' : 'everybody');
  const lined = (pk, people) => { const slots = lineup(pk, people.length); return Object.fromEntries(people.map((n, i) => [n, slots[i]])); };
  const cpN = id => Number(String(id).replace('cp', ''));
  const boardOf = (rec, snap) => (snap ? Object.entries(snap).sort((x, y) => y[1] - x[1]).map(([n, p]) => ({ who: [n], p })) : null);
  // the standings go to the side tab, the same one TJ's rankings use every episode (the user, 2026-10-16: "so it
  // always there to see whos leading and it doesnt block the view ... when tj announced it so we see the animation
  // of the score increasing and the placement moving"): this checkpoint's totals, and where each stood before it
  const standing = (rec, d, prevRec) => {
    const rows = rec.standings?.[d] || [];
    const before = prevRec?.standings?.[d] || [];
    const was = Object.fromEntries(before.map(([n, t], i) => [n, { t, rank: i + 1 }]));
    return { standings: { cp: cpN(rec.id), div: d, label: gendered ? (d === 'm' ? 'Men' : d === 'f' ? 'Women' : 'Everybody') : null,
      rows: rows.map(([n, t], i) => ({ n, t, rank: i + 1, was: was[n]?.t ?? 0, wasRank: was[n]?.rank ?? null })) }, focus: rows.slice(0, 2).map(r => r[0]) };
  };

  // A checkpoint, beat by beat.
  const checkpoint = (rec, a, it) => {
    const st = FINAL_STAGE[rec.id];
    if (!st) return;
    const pk = plateKey(st.plate, false);
    const people = rec.order;
    S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...lined(pk, people) }, wipe: 1 },
      card: { k: `Checkpoint ${cpN(rec.id)} of 5`, t: st.name, sub: st.place, icon: 'final' }, sceneIdx: it.i, title: st.name, kind: 'final-cp' });
    // the checkpoint told (script/final-cp.js: the same lines the backlog prints), drawn with its board
    const prevRec = f.checkpoints?.[f.checkpoints.findIndex(c => c.id === rec.id) - 1];
    let ruled = false;
    let shotSig = null, shotPlate = st.plate, onStage = false, curStage = 0;
    for (const l of cpLines(rec, { seed, prev: prevRec?.standings || null })) {
      if (!ruled && l.at >= 0 || (!ruled && l.kind === 'say')) { ruled = true; S.push({ rules: { k: `CHECKPOINT ${cpN(rec.id)}`, n: st.name, li: st.rules, f: 'Points by place, every checkpoint' } }); }
      const b = l.at >= 0 ? rec.beats[l.at] : null;
      const step = l.kind === 'tj' ? { tj: l.text } : l.kind === 'say' ? { say: [l.by, l.text] } : { dir: l.text };
      step.focus = l.fx.focus || (l.kind === 'tj' ? ['TJ'] : [l.by, l.fx.to].filter(Boolean));
      if (b?.data?.snap) step.race = boardOf(rec, b.data.snap);
      if (l.fx.start) { step.race = boardOf(rec, Object.fromEntries(people.map(n => [n, 0.02]))); step.act = Object.fromEntries(people.map(n => [n, 'strain'])); }
      if (l.fx.finish) step.race = boardOf(rec, Object.fromEntries(rec.order.map((n, i) => [n, Math.max(0.3, 1 - i * 0.1)])));
      if (l.fx.act) step.act = { ...(step.act || {}), ...l.fx.act };
      if (l.fx.chip) step.chip = l.fx.chip;
      if (l.fx.shake) step.shake = 1;
      if (l.fx.gong) step.gong = 1;
      if (l.fx.standings) Object.assign(step, standing(rec, l.fx.standings, prevRec), { race: null });
      // the course: a stage on its own set (games.js FINAL_STAGE stages), with the people the line is about on it
      if (l.fx.stage != null) curStage = l.fx.stage;
      const sg = l.fx.finish ? null : l.fx.stage != null ? st.stages?.[l.fx.stage] : onStage ? st.stages?.[curStage] : null;
      if (sg || (l.fx.finish && (onStage || shotPlate !== (st.stages?.at(-1)?.plate || st.plate)))) {
        const plate = sg ? sg.plate : (st.stages?.at(-1)?.plate || st.plate);
        const ck = plateKey(plate, false);
        const who = (step.focus || []).filter(n => n !== 'TJ' && people.includes(n));
        const sig = `${plate}|${who.join('+')}`;
        if (CH_MARKS[ck] && sig !== shotSig && (!sg || who.length)) {
          const lead = sg && !l.fx.finish ? who : people;
          const hasGroup = sg?.group && marksOf(ck).some(m => m.group === sg.group);
          const host = marksOf(ck).some(m => m.kind === 'host') ? { TJ: hostSide(ck) } : {};
          step.scene = { plate: ck, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot,
            cast: { ...host, ...(sg && !l.fx.finish ? placeScene(ck, lead, hasGroup ? { group: sg.group } : {}) : lined(ck, people)) }, wipe: plate !== shotPlate ? 1 : 0, close: sg && !l.fx.finish ? 1 : 0 };
          shotSig = sig; shotPlate = plate; onStage = !!sg && !l.fx.finish;
        }
      }
      S.push(step);
    }
    // after it: the first and the last, in their own words
    linesToSteps(S, a.lines, { names, sceneWho: ['TJ', ...people] });
  };

  for (const it of items) {
    const a = it.a;
    S.at(it.i);
    // the morning of the final, before anything starts: TJ checks every skull (or ring), and the ones without go home
    if (a.kind === 'pass-cut') {
      const st = FINAL_STAGE.start, pk = plateKey(st.plate, false);
      if (!S._passCut) {
        S._passCut = 1;
        const all = [...new Set([...finalists, ...items.filter(x => x.a.kind === 'pass-cut').map(x => x.a.who[0])])];
        const ring = a.data?.token === 'ring';
        S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...lined(pk, all) }, wipe: 1 },
          card: { k: 'Before the final', t: ring ? 'Show me your rings' : 'Show me your skulls', sub: 'Nobody runs the final without one', faces: all.slice(0, 10) }, focus: ['TJ'] });
      }
      linesToSteps(S, a.lines, { names, sceneWho: ['TJ', a.who[0]] });
      S.push({ ...BIG['pass-cut'](a), focus: [a.who[0]], ...(a.data?.spared ? {} : { exit: [a.who[0]] }) });
      continue;
    }
    if (a.kind === 'final-start') {
      const st = FINAL_STAGE.start, pk = plateKey(st.plate, false);
      S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...lined(pk, finalists) }, wipe: 1 },
        card: { k: 'The final', t: 'The Final', sub: `${finalists.length} finalists, two days, five checkpoints`, faces: finalists.slice(0, 10) } });
      linesToSteps(S, a.lines, { names, sceneWho: ['TJ', ...finalists] });
      continue;
    }
    if (a.kind === 'final-cp') {
      const rec = (f.checkpoints || []).find(c => c.id === a.data?.id);
      if (rec?.day === 2 && !S._day2) { S._day2 = 1; S.day = (S.nightDay ?? S.day) + 1; S.min = 8 * 60 + 30; }
      S.min += 50;
      if (rec) checkpoint(rec, a, it); else linesToSteps(S, a.lines, { names, sceneWho: a.who });
      continue;
    }
    // a Pairs season's end: the rules, then each pair's chooser, the last pair first (ch/share-keep.js)
    if (a.kind === 'share-keep-rules' || a.kind === 'share-keep') { shareKeepSteps(S, it, f, { names }); continue; }
    if (a.kind === 'instant-elimination' && a.data?.pair) {
      const st = FINAL_STAGE.instant, pk = plateKey(st.plate, false);
      const W = a.data.winners || [], L = a.data.losers || [];
      const duel = (f.instant || []).find(d => d.pairs && d.winners?.includes(W[0]));
      S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...placeScene(pk, [...W, ...L]) }, wipe: 1 },
        card: { k: 'Surprise', t: 'Instant Elimination', sub: 'One of these pairs leaves the final now', vsPairs: [W, L] } });
      if (duel) {
        const def = arenaDef(duel.game);
        const { pre, post } = splitAtResult(a.lines, duel);
        linesToSteps(S, pre, { names, sceneWho: [...W, ...L, 'TJ'] });
        S.push({ rules: { k: 'INSTANT ELIMINATION', n: duel.name, li: rulesOf(def?.desc), f: 'The losing pair leaves the final now' }, props: ARENA_PLAY[duel.game]?.set({}) || [] });
        playPairDuelSteps(S, duel, seed + W[0], [], pk);
        linesToSteps(S, post, { names, sceneWho: [...W, ...L, 'TJ'] });
        S.push({ slam: { stamp: 'ELIMINATED' }, focus: L, act: Object.fromEntries(L.map(n => [n, 'slump'])) });
      } else linesToSteps(S, a.lines, { names, sceneWho: [...W, ...L, 'TJ'] });
      continue;
    }
    if (a.kind === 'instant-elimination') {
      const st = FINAL_STAGE.instant, pk = plateKey(st.plate, false);
      const [x, y] = a.who;
      const duel = (f.instant || []).find(d => [d.a, d.b].includes(x) && [d.a, d.b].includes(y));
      S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...placeScene(pk, [x, y]) }, wipe: 1 }, card: { k: 'Surprise', t: 'Instant Elimination', sub: `${x} or ${y}: one of them leaves the final now`, faces: [x, y] } });
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
    if (a.kind === 'final-lastword') {
      // their last words: in the confessional chair
      linesToSteps(S, a.lines, { names, sceneWho: a.who, first: { scene: { plate: 'conf-day', place: 'Confessional', when: whenOf(S.day, S.min), icon: 'house', cast: {}, conf: 1 }, sceneIdx: it.i, title: 'Last words' } });
      if (a.data?.when === 'instant') S.push({ dir: `${a.who[0]} walks down the path to the boat. The final is over for ${a.who[0]}.`, focus: [] });
      continue;
    }
    if (a.kind.startsWith('overnight')) {
      const st = FINAL_STAGE.overnight, pk = plateKey(st.plate, true);
      if (!S._night) {
        S._night = 1; S.min = Math.max(S.min, 21 * 60 + 30);
        S.nightDay = S.day;
        const still = finalists.filter(n => !(f.instant || []).some(d => d.loser === n));
        S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'fire', island: st.spot, cast: lined(pk, still), wipe: 1, embers: 1 }, card: { k: 'The final', t: 'The Overnight', sub: 'A night outside, no sleep, and the box', faces: still.slice(0, 10) } });
        S.push({ tj: "Congratulations, you made it through day one. Now, the bad news. Tonight you sleep out here. Actually, you don't sleep at all.", focus: ['TJ'] });
        S.push({ rules: { k: 'THE OVERNIGHT', n: 'The Box', li: ['Each finalist has a box full of tiles to empty, and the leaders on points go first.',
          'Emptying it first wins a chair, a pillow or a blanket for the night.', "The first ones out also get to dump extra tiles into somebody else's box.",
          'Then nobody sleeps. Anybody who quits in the night is out of the final.'], f: 'Holding on through the night is worth points' } });
      }
      linesToSteps(S, a.lines, { names, sceneWho: a.who, first: { sceneIdx: it.i, title: it.title } });
      if (a.kind === 'overnight-quit') S.push({ exit: [a.who[0]], dir: `${a.who[0]} walks out of the camp. The final is over for ${a.who[0]}.`, focus: [] });
      S.min += 40;
      continue;
    }
    if (a.kind.startsWith('final-pact')) {
      if (!S._day2) { S._day2 = 1; S.day = (S.nightDay ?? S.day) + 1; S.min = 8 * 60 + 30; }
      S.min += 20;
      linesToSteps(S, a.lines, { names, sceneWho: a.who, first: { sceneIdx: it.i, title: it.title } });
      continue;
    }
    if (a.kind === 'final-podium') {
      // the totals, read from the bottom up, division by division: the suspense before the crowning
      const st = FINAL_STAGE.finish, pk = plateKey(st.plate, false);
      const all = Object.values(f.podium || {}).flat();
      S._podium = 1;
      S.min = Math.max(S.min + 30, 14 * 60);
      S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, S.min), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...lined(pk, all) }, wipe: 1 }, card: { k: 'The finish line', t: 'The Totals', sub: 'Two days, five checkpoints, every point added up', faces: all.slice(0, 10) }, sceneIdx: it.i, title: 'The totals' });
      linesToSteps(S, a.lines, { names, sceneWho: ['TJ', ...all] });
      // the totals from the bottom up (script/final-cp.js podiumLines: the backlog prints the same)
      for (const l of podiumLines(f.podium || {}, f.totals || {}, f.pairPodium || null)) {
        const n = l.fx.who;
        const st = l.kind === 'tj' ? { tj: l.text, focus: n ? ['TJ', n] : ['TJ'] } : { dir: l.text, focus: [n] };
        if (n && l.fx.place > 1) { st.chip = [n, `${(ORD[l.fx.place] || `#${l.fx.place}`).toUpperCase()} PLACE`]; st.act = Object.fromEntries((l.fx.pair || [n]).map(x => [x, l.fx.place === 2 ? 'slump' : 'look'])); if (l.fx.pair) st.focus = ['TJ', ...l.fx.pair]; }
        if (n && l.fx.place === 1) st.act = { [n]: 'strain' };
        S.push(st);
      }
      continue;
    }
    if (a.kind === 'champions') {
      const st = FINAL_STAGE.finish, pk = plateKey(st.plate, false);
      const champs = f.champions || a.who;
      const all = Object.values(f.podium || {}).flat();
      if (!S._podium) S.push({ scene: { plate: pk, place: st.place, when: whenOf(S.day, Math.max(S.min, 14 * 60)), icon: 'island', island: st.spot, cast: { TJ: hostSide(pk), ...lined(pk, all.length ? all : champs) }, wipe: 1 }, sceneIdx: it.i, title: it.title });
      const lines = a.lines;
      const call = lines.findIndex(l => l.by === HOST && champs.some(c => l.text.includes(c)));
      lines.forEach((l, k) => {
        if (k === call) S.push({ tj: l.text, slam: { winner: `${nameList(champs)} ${champs.length > 1 ? 'are' : 'is'} the champion${champs.length > 1 ? 's' : ''}` }, focus: champs, act: Object.fromEntries(champs.map(n => [n, 'cheer'])), gong: 1, shake: 1, confetti: 1, power: champs, powerLabel: champs.length > 1 ? 'CHAMPIONS' : 'CHAMPION' });
        else linesToSteps(S, [l], { names, sceneWho: [...champs, 'TJ'] });
      });
      if (call < 0) S.push({ slam: { winner: `${nameList(champs)} ${champs.length > 1 ? 'are' : 'is'} the champion${champs.length > 1 ? 's' : ''}` }, focus: champs, confetti: 1, power: champs, powerLabel: champs.length > 1 ? 'CHAMPIONS' : 'CHAMPION' });
      continue;
    }
    // the season's last words: the champions looking back (ch/final.js pathOf)
    if (a.kind === 'champion-reflect') {
      S.push({ card: { k: a.who.length > 1 ? 'The champions' : 'The champion', t: 'Looking back', sub: 'The season, in their own words', faces: a.who.slice(0, 2) }, focus: a.who.slice(0, 2), sceneIdx: it.i, title: 'Looking back' });
      linesToSteps(S, a.lines || [], { names, sceneWho: a.who });
      continue;
    }
    if (a.kind === 'final-congrats') { linesToSteps(S, a.lines, { names, sceneWho: a.who, first: { sceneIdx: it.i, title: 'Congratulations', focus: a.who.slice(0, 2), act: { [a.who[0]]: 'lean' } } }); continue; }
    linesToSteps(S, a.lines || [], { names, sceneWho: a.who, first: { sceneIdx: it.i, title: it.title } });
  }
}

// ── the transcript of the steps (the text backlog prints exactly this) ─
export function chStepText(row) {
  const out = [];
  for (const scr of chStepScreens(row)) {
    out.push('', `== ${scr.label.toUpperCase()} ==`);
    for (const s of scr.steps) {
      if (s.scene && s.scene.place && !s.map) out.push(`[${s.scene.place}${s.scene.when ? ' — ' + s.scene.when.replace(/<[^>]+>/g, '') : ''}]`);
      if (s.seg) out.push(`${s.seg[0]}: ${s.seg[1]}`);
      if (s.card) out.push(`${s.card.k}: ${s.card.t}${s.card.sub ? ` (${s.card.sub})` : ''}`);
      if (s.rules) { out.push(`${s.rules.n}:`); for (const li of s.rules.li) out.push(`  - ${li.replace(/<[^>]+>/g, '')}`); out.push(`  (${s.rules.f})`); }
      if (s.tj) out.push(`TJ: ${s.tj}`);
      if (s.say) out.push(`${s.say[0]}: ${s.say[1]}`);
      if (s.conf) out.push(`${s.conf[0]} [confessional]: ${s.conf[1]}`);
      if (s.dir) out.push(`(${s.dir})`);
      if (s.intro) {
        const t = s.intro;
        out.push(`${t.n.toUpperCase()}${t.show ? ` — ${t.show}` : ''} · ${t.rookie ? 'ROOKIE' : 'VET'}${t.facts.length ? ` · ${t.facts.join(' · ')}` : ''}`);
        for (const c of t.career) out.push(`  ${c.where}: ${c.result}${c.wins ? ` · ${c.wins} challenge wins` : ''}`);
        if (t.badges.length) out.push(`  ${t.badges.join(' · ')}`);
        if (t.rival) out.push(`  Rival in the house: ${t.rival}`);
        if (t.story) out.push(`  "${t.story}"`);
        if (t.tag) out.push(`  ${t.tag}`);
      }
    }
  }
  return out.join('\n').trim();
}
