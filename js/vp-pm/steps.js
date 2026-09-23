// ══════════════════════════════════════════════════════════════════════
// vp-pm/steps.js — an episode as screens of clicks (Plan 5)
// ══════════════════════════════════════════════════════════════════════
//
// PURE: a played row in, plain data out, no DOM. The stage, the cards, the
// rail and the Heart Map all read the SAME step list (ADDING-A-SHOW §6.5: one
// list feeds everything, or they drift a step apart).
//
// A STEP IS ONE SPOKEN LINE. The scene's staging is the caption on its first
// line and its beat on its last; a beach-hut cutaway and the voiceover are
// steps of their own. A scene with no lines is one step.
//
// A SCREEN IS A BEAT. Each part of the day (transcript.js `phasesOf`, the one
// place that decides the order) is cut at scene boundaries into screens of
// about MAX_STEPS clicks, preferring to cut before a major moment, and named
// after the biggest thing on it.
//
// NOTHING HERE DECIDES ANYTHING. Effects, pops and the Heart Map's changes
// are read off what the engine recorded: the kind, its cast, `extra`, aired,
// major. A pop says what the kind does (a steal leaves somebody cracked), not
// a number the engine never wrote.
import { phasesOf, momentTitle } from '../pm/transcript.js';
import { CHALLENGE_NAMES } from '../pm/schedule.js';
import { SHOWS } from '../shows.js';

export const MAX_STEPS = 20;
const words = () => SHOWS['perfect-match'].words;

// ── what each scene is called on the headline pill ────────────────────
export const KIND_LABEL = {
  'host-open': 'Welcome to Perfect Match', 'host-first': 'The first coupling', intro: 'Meet the islander',
  'first-arrival': 'The arrivals', 'first-look': 'First impressions', 'step-forward': 'Step forward', 'step-last': 'The last two',
  chat: 'A chat', 'deep-chat': 'A deep chat', kiss: 'A kiss', pull: 'Can I borrow you?', loyalty: 'Loyal',
  argument: 'An argument', friendship: 'Friends', gossip: 'Gossip', comedy: 'Villa life', ick: 'The ick',
  'challenge-kiss': 'A challenge kiss', 'challenge-win': 'Winners', entrance: 'A new arrival', date: 'The date',
  steal: 'A steal', 'recouple-pick': 'The recoupling', 'dump-buildup': 'At risk', 'dump-verdict': 'Dumped',
  'ballot-reveal': 'The vote', 'dump-reaction': 'The reaction', 'dump-goodbye': 'Goodbye', 'dump-fallout': 'Fallout',
  'casa-return': 'Stick or twist', photos: 'The photos', declaration: 'The declaration', 'final-result': 'The result',
  envelope: 'The envelope', walk: 'Leaving the villa', reveal: "What you didn't see", 'close-off': 'Closing off',
  'keeping-open': 'Keeping it open', 'open-back-up': 'Opening back up', 'head-turned': 'Head turned',
  'exclusive-ask': 'Exclusive?', 'official-ask': 'Official?', 'ask-declined': 'Not yet', 'love-said': 'I love you',
  'love-hanging': 'Left hanging', hideaway: 'The Hideaway', torch: 'Still carrying a torch',
  'jealous-confront': 'Jealous', 'jealous-sulk': 'A sulk', 'jealous-retaliate': 'Getting even', reassurance: 'Reassurance',
  overthinking: 'Overthinking', confession: 'A confession', advice: 'Advice', 'heart-rate': 'The heart-rate challenge',
  'snog-marry-pie': 'Snog, Marry, Pie', 'movie-night': 'Movie Night', 'double-standard': 'Double standard',
  notes: 'Anonymous notes', families: 'The families', solidarity: 'Leaving together', 'dump-at-risk': 'At risk',
  'dump-verdict-couple': 'Dumped', 'dump-verdict-singles': 'Dumped', 'group-entrance': 'New arrivals',
  'stand-up': 'Standing up', 'nobody-stands': 'Nobody stands', 'stand-up-pick': 'The pick', 'save-setup': 'At risk',
  'bombshell-save': 'Saved', 'public-match': 'The public decide', 'profile-pick': 'The profiles',
  'public-couple': 'The public decide', 'ranking-couple': 'The ranking', 'return-entrance': 'Back in the villa',
  'return-ex': 'The ex', 'mission-brief': 'A secret task', 'mission-dump': 'The secret task', 'mission-return': 'A second chance',
  'sleepover-invite': 'The sleepover', 'sleepover-night': 'The sleepover villa', 'sleepover-choice': 'The choice',
  'immunity-win': 'Safe tonight', 'challenge-text': 'I got a text!', receipt: 'The receipt', 'look-who': 'Who said it?',
  'snogger-kiss': 'The kiss', 'snogger-win': 'The winner', 'snogger-row': 'The scores', 'couple-goals': 'The boards',
  'couple-goals-row': 'After the game', 'knowing-me': 'The boards', 'knowing-row': 'The last question',
  'talent-act': 'The act', 'talent-win': 'The winner', 'talent-snub': 'The vote', 'baby-doll': 'The baby doll',
  'sorts-podium': 'The podium', 'grafties-award': 'The award', 'save-vote': 'The vote', 'top-couple-pick': 'The favourites decide',
  'couples-vote': 'The villa votes', 'ex-return': 'The exes are back', 'ex-ballot': 'The exes vote',
};

// ── the set, from the part of the day ─────────────────────────────────
const CASA_NIGHTS = new Set(['casa-open', 'casa-nights']);
export function bgFor(row, phase) {
  if (row.moment === 'final' && phase === 'firepit') return 'final';
  if (phase === 'reunion' || row.moment === 'reunion') return 'final';
  if (phase === 'hut') return 'hut';
  if (CASA_NIGHTS.has(row.moment) && (phase === 'evening' || phase === 'firepit')) return 'casa';
  if (phase === 'firepit' || phase === 'dumping') return 'night';
  if (phase === 'evening') return 'terrace';
  return 'day';
}

// Where the busts stand, by how many are in the scene.
const SPOTS = { 1: [50], 2: [30, 70], 3: [20, 50, 80], 4: [14, 38, 62, 86], 5: [10, 30, 50, 70, 90] };

// ── what a scene does, said as the pops over the busts ────────────────
// [cast slot, words, style, icon]. Styles: '' warm · down · red · gold · teal.
const POPS = {
  'first-look': [[1, 'Attraction +', '', 'heart']],
  kiss: [[0, 'Connection +', '', 'heart'], [1, 'Connection +', '', 'heart']],
  'deep-chat': [[1, 'Connection +', '', 'heart']],
  pull: [[1, 'Head turned?', 'gold', 'eye']],
  loyalty: [[0, 'Loyal', 'teal', 'star']],
  argument: [[0, 'Connection −', 'red', 'crack'], [1, 'Connection −', 'red', 'crack']],
  friendship: [[1, 'Friendship +', 'teal', 'star']],
  ick: [[0, 'The ick', 'down', 'crack']],
  'challenge-kiss': [[1, 'Attraction +', '', 'heart']],
  date: [[1, 'Attraction +', '', 'heart']],
  steal: [[0, 'Steal!', 'gold', 'spark'], [2, 'Stolen from', 'red', 'crack']],
  'recouple-pick': [[1, 'Chosen', 'gold', 'heartW']],
  'step-forward': [[1, 'Chosen', 'gold', 'heartW']],
  'dump-verdict': [[0, 'Dumped', 'red', 'crack']],
  'dump-verdict-couple': [[0, 'Dumped', 'red', 'crack'], [1, 'Dumped', 'red', 'crack']],
  'dump-fallout': [[0, 'Single', 'down', 'crack']],
  'dump-reaction': [[0, 'Heartbroken', 'red', 'crack']],
  'close-off': [[1, 'Security +', '', 'heart']],
  'keeping-open': [[1, 'Security −', 'down', 'crack']],
  'open-back-up': [[1, 'Heartbroken', 'red', 'crack']],
  'exclusive-ask': [[0, 'Exclusive', 'gold', 'heartW'], [1, 'Exclusive', 'gold', 'heartW']],
  'official-ask': [[0, 'Official', 'gold', 'heartW'], [1, 'Official', 'gold', 'heartW']],
  'ask-declined': [[0, 'Turned down', 'red', 'crack']],
  'love-said': [[0, 'In love', 'gold', 'heartW'], [1, 'In love', 'gold', 'heartW']],
  'love-hanging': [[0, 'Left hanging', 'red', 'crack']],
  hideaway: [[0, 'Connection ++', '', 'heart'], [1, 'Connection ++', '', 'heart']],
  torch: [[0, 'Jealous', 'down', 'crack']],
  'jealous-confront': [[1, 'Trust −', 'red', 'crack']],
  'jealous-retaliate': [[2, 'Jealous', 'red', 'crack']],
  reassurance: [[0, 'Reassured', 'teal', 'heart']],
  confession: [[1, 'Trust −', 'red', 'crack']],
  'heart-rate': [[0, 'Heart racing', '', 'heart']],
  'movie-night': [[0, 'Caught', 'red', 'eye']],
  photos: [[0, 'Mugged off', 'red', 'crack']],
  'stand-up-pick': [[1, 'Chosen', 'gold', 'heartW']],
  'bombshell-save': [[1, 'Saved', 'gold', 'heartW'], [2, 'Not chosen', 'red', 'crack']],
  'mission-dump': [[1, 'Named', 'red', 'crack'], [2, 'Named', 'red', 'crack']],
  'mission-return': [[0, 'Back', 'gold', 'spark'], [1, 'Back', 'gold', 'spark']],
  'immunity-win': [[0, 'Safe', 'gold', 'star'], [1, 'Safe', 'gold', 'star']],
  receipt: [[2, 'Exposed', 'red', 'eye']],
  'snogger-row': [[0, 'Jealous', 'red', 'crack']],
  'snogger-win': [[0, 'Winner', 'gold', 'star']],
  'couple-goals-row': [[0, 'Friendship −', 'red', 'crack']],
  'knowing-row': [[1, 'Trust −', 'red', 'crack']],
  'talent-win': [[0, 'Winner', 'gold', 'star']],
  'talent-snub': [[0, 'Security −', 'down', 'crack']],
  'save-vote': [[1, 'Saved', 'gold', 'heartW']],
  'ballot-reveal': [[1, 'A vote', 'red', 'crack']],
  'ex-ballot': [[1, 'A vote', 'red', 'crack']],
};
const HURT_STYLES = new Set(['red']);
// A pop only where the scene did the thing: a receipt that read out "falling
// for you" exposed nobody.
const POPS_WHEN = { 'first-look': e => e.extra?.of === 'spark', receipt: e => ['secret', 'pull', 'head-turned'].includes(e.extra?.of),
  'casa-return': () => false, 'dump-reaction': () => true };

// ── the night's big effects ───────────────────────────────────────────
function fxFor(row, e, first) {
  const fx = {};
  const k = e.kind;
  if (k === 'first-arrival' && first) fx.neon = ['Perfect Match', '#ff2e88'];
  if (k === 'entrance' || k === 'group-entrance') fx.neon = [row.moment === 'casa-open' ? 'Casa Amor' : 'Bombshell', '#ff7a59'];
  if (k === 'return-entrance') fx.neon = ['Back', '#ffc15e'];
  if (k === 'step-forward' && first) fx.neon = ['Step forward', '#ff2e88'];
  if (k === 'recouple-pick' && first) fx.neon = [row.moment === 'first-coupling' ? 'First coupling' : 'Recoupling', '#ff2e88'];
  if (k === 'dump-buildup' && first) fx.neon = ['The results', '#a78bfa'];
  if (k === 'dump-verdict' || k === 'dump-verdict-couple' || k === 'dump-verdict-singles') { fx.neonDie = ['Dumped', '#ff2e88']; fx.shake = true; }
  if (k === 'casa-return') fx.deal1 = [e.players[0], e.extra?.choice === 'twist' ? 'twist' : 'stick'];
  if (k === 'ballot-reveal' || k === 'ex-ballot' || k === 'save-vote') fx.deal = [[e.players[0], e.players[1]]];
  if (k === 'heart-rate') fx.ecg = [e.players[0]];
  if (k === 'challenge-text' || k === 'mission-brief') fx.phone = true;
  if (k === 'steal' || k === 'argument' || k === 'jealous-confront' || k === 'photos' || k === 'snogger-row') fx.shake = true;
  if (k === 'photos') fx.neon = ['Mugged off', '#ef4444'];
  if (k === 'movie-night' || k === 'reveal') fx.raw = true;
  if (e.aired && e.major?.length && !fx.neonDie) fx.toast = ['Major moment', KIND_LABEL[k] || 'A big moment'];
  return fx;
}

// ── the Heart Map's changes ───────────────────────────────────────────
const COUPLES_BY = { 'step-last': [0, 1], 'recouple-pick': [0, 1], steal: [0, 1], 'stand-up-pick': [0, 1], 'public-match': [0, 1],
  'bombshell-save': [0, 1], 'profile-pick': [0, 1], 'public-couple': [0, 1], 'ranking-couple': [0, 1] };
function relOps(e) {
  const k = e.kind, p = e.players;
  if (COUPLES_BY[k]) return [['couple', p[0], p[1]]];
  if (k === 'casa-return') return p[1] ? [['couple', p[0], p[1]]] : [['single', p[0]]];
  if (k === 'sleepover-choice' && p[1]) return [['couple', p[0], p[1]]];
  if (k === 'dump-verdict') return [['leave', p[0]]];
  if (k === 'dump-verdict-couple' || k === 'dump-verdict-singles') return p.map(n => ['leave', n]);
  if (k === 'walk') return [['leave', p[0]]];
  if (k === 'entrance' || k === 'group-entrance' || k === 'return-entrance') return p.map(n => ['arrive', n]);
  if (k === 'first-arrival') return [['arrive', p[0]]];
  // The boy walks in, and walks out coupled (or waiting).
  if (k === 'step-forward') return p[1] ? [['arrive', p[0]], ['couple', p[0], p[1]]] : [['arrive', p[0]]];
  return [];
}

// ── the dumping's five phases ─────────────────────────────────────────
export const DUMP_RAIL = ['Build-up', 'Verdict', 'Reaction', 'Goodbye', 'Fallout'];
const RAIL_OF = { 'dump-buildup': 0, 'dump-at-risk': 0, 'save-setup': 0, 'ex-return': 0,
  'ballot-reveal': 1, 'save-vote': 1, 'top-couple-pick': 1, 'couples-vote': 1, 'ex-ballot': 1,
  'dump-verdict': 1, 'dump-verdict-couple': 1, 'dump-verdict-singles': 1,
  'dump-reaction': 2, solidarity: 2, 'dump-goodbye': 3, 'dump-fallout': 4 };

function castOf(e, who, host) {
  const names = e.players.filter(Boolean).slice(0, 5);
  const withHost = who === host && !names.includes(host) ? [...names.slice(0, 4), host] : names;
  const at = SPOTS[withHost.length] || SPOTS[5];
  // The host stands in the middle; everyone else keeps their order around her.
  const order = who === host ? [...withHost.filter(n => n !== host).slice(0, Math.ceil((withHost.length - 1) / 2)), host,
    ...withHost.filter(n => n !== host).slice(Math.ceil((withHost.length - 1) / 2))] : withHost;
  return order.map((n, i) => [n, at[i], n === who ? 'speak' : 'back']);
}

/** The steps of one scene. */
export function sceneSteps(row, e, evIndex, bg) {
  const host = words().host, narrator = words().narratorName;
  const s = e.script || { lines: [] };
  const lines = s.lines || [];
  const pops = (POPS_WHEN[e.kind]?.(e) === false ? [] : POPS[e.kind] || []).map(([slot, t, style, icon]) => [e.players[slot], t, style, icon]).filter(p => p[0]);
  const hurt = new Set(pops.filter(p => HURT_STYLES.has(p[2])).map(p => p[0]));
  const base = { ev: evIndex, kind: e.kind, raw: !e.aired, headline: KIND_LABEL[e.kind] || null,
    big: !!(e.aired && e.major?.length) };
  const out = [];
  const make = (part, who, text, voice, extra = {}) => {
    const cast = voice === 'narrator' ? castOf(e, null, host).map(c => [c[0], c[1], 'back']) : castOf(e, who, host);
    for (const c of cast) if (hurt.has(c[0]) && c[2] !== 'speak') c[2] = 'hurt';
    out.push({ ...base, part, who, text, voice, cast, bg, ...extra });
  };
  if (!lines.length) make('stage', null, s.stage || KIND_LABEL[e.kind] || e.kind, 'stage');
  lines.forEach((l, i) => {
    const voice = l.who === host ? 'dior' : l.who === narrator ? 'narrator' : e.kind === 'challenge-text' && i === 0 ? 'text' : '';
    make('line', l.who, l.text, voice, { line: i });
  });
  // Staging opens the scene; the beat closes it.
  if (out.length) {
    if (lines.length && s.stage) out[0].caption = s.stage;
    if (s.beat) out[out.length - 1].beat = s.beat;
  }
  for (const l of e.narrator?.lines || []) make('narr', l.who, l.text, 'narrator');
  // The beach hut: its own set, one face, straight to camera.
  for (const l of e.hut?.script?.lines || []) {
    out.push({ ...base, part: 'hut', who: e.hut.who, text: l.text, voice: 'hut', cast: [[e.hut.who, 50, 'speak']], bg: 'hut',
      stance: e.hut.stance, headline: 'Beach hut' });
  }
  // One-shot business rides on the scene's first step; the Heart Map moves on its last.
  const first = out[0];
  first.fx = fxFor(row, e, evIndex === firstOfKind(row, e));
  first.pops = pops;
  if (first.fx.phone) first.fx.phone = [e.players[0], (lines[0]?.text || s.stage || '')];
  // A big scene stays pushed in for all of its lines.
  const close = !!(first.big || first.fx.shake);
  for (const s of out) s.close = close;
  first.sceneStart = true;
  out[out.length - 1].rel = relOps(e);
  out[out.length - 1].sceneEnd = true;
  return out;
}
const firstOfKind = (row, e) => (row.pm.events || []).findIndex(x => x.kind === e.kind);

// ── the final: the board, then the envelope ───────────────────────────
const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
function finalSteps(row) {
  const shares = [...(row.pm.shares || [])].sort((a, b) => a.share - b.share);
  if (!shares.length) return [];
  const host = words().host;
  const pct = s => `${Math.round(s.share * 1000) / 10}%`;
  const board = [...shares].map(s => [s.couple.join(' & '), Math.round(s.share * 1000) / 10]);
  const steps = [{ part: 'result', who: host, voice: 'dior', bg: 'final', headline: 'The final vote', cast: [[host, 50, 'speak']],
    text: `The public have been voting for their Perfect Match, and the votes are in. Let's find out who has won.`,
    fx: { board: 0, neon: ['The Final', '#ffc15e'] }, board, sceneStart: true, sceneEnd: true, ev: -1 }];
  shares.forEach((s, i) => {
    const place = shares.length - i, win = place === 1;
    const [a, b] = s.couple;
    steps.push({ part: 'result', who: host, voice: 'dior', bg: 'final', ev: -1, board, sceneStart: true, sceneEnd: true,
      headline: win ? 'Your Perfect Match' : `In ${ORDINAL[place - 1]} place`, big: win,
      cast: [[a, 26, win ? 'speak' : 'back'], [host, 50, 'speak'], [b, 74, win ? 'speak' : 'back']],
      text: win ? `${a} and ${b}, with ${pct(s)} of the vote… you are this year's Perfect Match!`
        : `In ${ORDINAL[place - 1]} place, with ${pct(s)} of the vote… ${a} and ${b}.`,
      fx: { board: i + 1, ...(win ? { petals: true, neon: ['Perfect Match', '#ff2e88'], toast: ['Winners', `${pct(s)} of the vote`] } : {}) },
      pops: win ? [[a, 'Winners', 'gold', 'star'], [b, 'Winners', 'gold', 'star']] : [] });
  });
  const env = row.pm.envelope;
  if (env?.holder) {
    const other = shares[shares.length - 1].couple.find(n => n !== env.holder);
    const steal = env.choice === 'steal';
    steps.push({ part: 'result', who: env.holder, voice: '', bg: 'final', ev: -1, sceneStart: true, sceneEnd: true,
      headline: 'The envelope', big: steal, cast: [[env.holder, 34, 'speak'], [other, 66, steal ? 'hurt' : 'back']],
      caption: `${env.holder} opens the envelope. Inside is a choice: split the prize money with ${other}, or steal all of it.`,
      text: steal ? `I'm sorry. I'm stealing it.` : `Split. Of course it's split.`,
      fx: { env: steal ? 'STEAL' : 'SPLIT', ...(steal ? { shake: true } : {}) },
      pops: [[env.holder, steal ? 'Steal' : 'Split', steal ? 'red' : 'gold', steal ? 'crack' : 'heartW']] });
  }
  return steps;
}

// ── cutting a part of the day into screens ────────────────────────────
function cut(scenes) {
  const total = scenes.reduce((s, x) => s + x.steps.length, 0);
  if (total <= MAX_STEPS + 4) return [scenes];
  const n = Math.ceil(total / MAX_STEPS), target = total / n;
  const out = [[]];
  let acc = 0;
  scenes.forEach(sc => {
    const cur = out[out.length - 1];
    // Cut before a major moment once the screen is most of the way full, or
    // before any scene that would take it well past its share.
    const full = acc >= target * 0.7 && (sc.big || acc + sc.steps.length > target * 1.25);
    if (cur.length && (full || acc >= target) && out.length < n + 1) { out.push([]); acc = 0; }
    out[out.length - 1].push(sc);
    acc += sc.steps.length;
  });
  // A last screen of two clicks goes on the one before it.
  const last = out[out.length - 1];
  if (out.length > 1 && last.reduce((s, x) => s + x.steps.length, 0) < 5) out[out.length - 2].push(...out.pop());
  return out;
}

/**
 * The episode's screens: [{ key, label, bg, rail, steps }]. Step `i` of a
 * screen is card line `i`, stage state `i` and Heart Map state `i`.
 */
export function episodeScreens(row) {
  if (!row?.pm) return [];
  const events = row.pm.events || [];
  const index = new Map(events.map((e, i) => [e, i]));
  const screens = [];
  for (const [phase, evs, label] of phasesOf(row)) {
    const night = MOMENT_PHASE.has(phase) || phase === 'moment';
    const scenes = evs.map(e => {
      // A scene of the night is at the fire pit whatever part of the day it borrowed.
      const set = night ? (e.phase === 'reunion' ? 'reunion' : 'firepit') : e.phase === 'challenge' ? 'day' : e.phase;
      const bg = bgFor(row, set);
      const steps = sceneSteps(row, e, index.get(e), bg);
      return { steps, big: steps[0].big };
    });
    const hasDump = evs.some(e => RAIL_OF[e.kind] != null);
    cut(scenes).forEach((chunk, i) => {
      const steps = chunk.flatMap(sc => sc.steps);
      if (hasDump) {
        let at = 0;
        for (const st of steps) { if (RAIL_OF[st.kind] != null) at = Math.max(at, RAIL_OF[st.kind]); st.rail = at; }
      }
      const name = i === 0 ? label : nameFor(label, chunk, screens);
      screens.push({ key: `${phase}-${screens.length}`, phase, label: name, bg: steps[0]?.bg || 'day',
        rail: hasDump ? DUMP_RAIL : null, steps });
    });
  }
  if (row.moment === 'final') {
    const steps = finalSteps(row);
    if (steps.length) screens.push({ key: `result-${screens.length}`, phase: 'result', label: 'The winners', bg: 'final', rail: null, steps });
  }
  return screens;
}
const MOMENT_PHASE = new Set(['firepit', 'dumping', 'reunion']);

// A later screen of the same part of the day is named after its most
// dramatic scene — a major moment first, then the kinds that move a story —
// and never twice in one episode ("The day · An argument", not "continued").
const QUIET = ['chat', 'comedy', 'friendship', 'kiss', 'challenge-win', 'deep-chat', 'reassurance', 'advice', 'gossip', 'overthinking'];
const drama = sc => (sc.big ? 100 : 0) + (QUIET.includes(sc.steps[0].kind) ? QUIET.length - QUIET.indexOf(sc.steps[0].kind) : 20);
function nameFor(label, chunk, screens) {
  const taken = new Set(screens.map(s => s.label));
  for (const sc of [...chunk].sort((a, b) => drama(b) - drama(a))) {
    const h = sc.steps[0].headline;
    const name = `${label} · ${h || 'more'}`;
    if (h && h !== label && !taken.has(name)) return name;
  }
  let n = 2;
  while (taken.has(`${label} · part ${n}`)) n++;
  return `${label} · part ${n}`;
}

// ── the Heart Map's state at any click ────────────────────────────────
/** Who was in the villa, and coupled with whom, when the episode began. */
export function startOfEpisode(row, prev) {
  if (prev?.pm) return { villa: [...prev.pm.villa], couples: prev.pm.couples.map(c => [...c]) };
  // Night one: everybody who did not walk in during the episode, nobody coupled.
  const arrived = new Set((row.pm.events || []).flatMap(e => (e.kind === 'entrance' || e.kind === 'group-entrance' ? e.players
    : e.kind === 'first-arrival' || e.kind === 'step-forward' ? [e.players[0]] : [])));
  return { villa: (row.pm.villa || []).filter(n => !arrived.has(n)), couples: [] };
}

/** The villa after `upto` steps of screen `si` (every earlier screen played through). */
export function villaAt(row, prev, screens, si, upto) {
  const st = startOfEpisode(row, prev);
  const villa = new Set(st.villa), gone = new Set();
  let couples = st.couples.map(c => [...c]);
  const lastScreen = si === screens.length - 1;
  for (let s = 0; s <= si; s++) {
    const steps = screens[s].steps;
    const end = s < si ? steps.length - 1 : upto;
    for (let k = 0; k <= end && k < steps.length; k++) for (const [op, a, b] of steps[k].rel || []) {
      if (op === 'couple') { couples = couples.filter(c => !c.includes(a) && !c.includes(b)); couples.push([a, b]); villa.add(a); villa.add(b); }
      if (op === 'single') couples = couples.filter(c => !c.includes(a));
      if (op === 'leave') { villa.delete(a); gone.add(a); couples = couples.filter(c => !c.includes(a)); }
      if (op === 'arrive') { villa.add(a); gone.delete(a); }
    }
  }
  // The last click of the episode is the episode's own end state.
  if (lastScreen && upto >= screens[si].steps.length - 1) {
    return { villa: [...row.pm.villa], couples: row.pm.couples.map(c => [...c]), gone: [...gone].filter(n => !row.pm.villa.includes(n)) };
  }
  return { villa: [...villa], couples, gone: [...gone] };
}

export { CHALLENGE_NAMES, momentTitle };
