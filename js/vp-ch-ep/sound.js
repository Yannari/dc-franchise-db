// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/sound.js — the sound of The Challenge
// ══════════════════════════════════════════════════════════════════════
//
// The user's downloads (Downloads/Challenge-art/music/<slot>/, 2026-10-15), made into
// assets/audio/ch/ by tools/ch-make-audio.py: trimmed, layered where one moment is several
// sounds (ELIMINATED is a stamp, a dark drum, a guitar slide and paper tearing), looped where
// it is ambience, levelled the house way (manual §6.6: beds -17 dB, stings -14 dB). The list
// of what plays when, and what each file is, is docs/ch-music.md.
//
// BEDS follow the moment, read off the step being painted (manual §6.6), never a second list:
//   the daily is quiet until TJ's GO, then the rock bed, until the winners are called;
//   the Arena walks in on tribal drums, the duel is metal, and the torches crackle after;
//   a house scene sounds like the event it is (a fight, a scheme, a showmance, the fun), and
//   anything else is the place itself (the sea, the crickets at night), never sad music under
//   ordinary talk (manual §18: "music only where the moment earns it").
// STINGS mark what is on screen: the gong, TJ's horn, a bell, a buzzer, a splash, the spray
// can of CALLED OUT, the ELIMINATED stamp, the gate the loser walks out of. Only a step the
// viewer moved to plays one (a click, or Play); going back or seeking changes only the music.
import { BED_CATALOG, CUE_CATALOG } from '../audio.js';

const dir = 'assets/audio/ch/';
// Headroom for voice acting (the user, 2026-10-16: "make sure the sound is not too loud for a future voice
// acting"): beds sit about 11 dB under a voice at -16 dB RMS, and the stings, mastered at -14 dB, are played
// 4.4 dB down (STING_VOL), so a sting never covers a line.
const MUSIC_VOL = 0.28;
const AMB_VOL = 0.18;
const STING_VOL = 0.6;

// `lift` is the dB a file could not be raised by without clipping (tools/ch-make-audio.py
// prints it), given back on playback.
export const CH_BEDS = {
  'ch-open':         { files: ['open.mp3', 'open-2.mp3'], what: 'the show open and "previously on": driving rock' },
  'ch-fun':          { files: ['fun.mp3'], what: 'the fun of the villa, the arrival: relaxed, sunny hip-hop' },
  'ch-scheming':     { files: ['scheming.mp3'], lift: { 'scheming.mp3': 2.3 }, what: 'a meeting, a deal, a recruit, a campaign: a low, tense beat' },
  'ch-drama':        { files: ['drama.mp3'], what: 'a fight, receipts, a betrayal, TJ laying down the law: nu-metal' },
  'ch-romance':      { files: ['romance.mp3', 'romance-2.mp3'], what: 'a spark, a showmance, a date: R&B, soul' },
  'ch-daily':        { files: ['daily.mp3'], what: 'the daily, from TJ\'s GO to the winners: driving nu-metal' },
  'ch-deliberation': { files: ['deliberation.mp3'], lift: { 'deliberation.mp3': 1.8 }, what: 'the vote: a heartbeat, the silence before a name' },
  'ch-tribunal':     { files: ['tribunal.mp3'], lift: { 'tribunal.mp3': 3 }, what: 'a Tribunal week\'s vote: brooding drums' },
  'ch-arena-walk':   { files: ['arena-walk.mp3', 'arena-walk-2.mp3'], lift: { 'arena-walk.mp3': 2.4, 'arena-walk-2.mp3': 0.4 }, what: 'the walk into the Arena and the call-out: tribal drums over the torches' },
  'ch-arena':        { files: ['arena.mp3'], what: 'the elimination itself: fast metal' },
  'ch-party':        { files: ['party.mp3'], what: 'the night out at the Beach Club: tech house' },
  'ch-party-walls':  { files: ['party-walls.mp3'], amb: true, what: 'back at the villa on a party night: the club through the walls' },
  'ch-final':        { files: ['final.mp3'], what: 'the final\'s checkpoints: epic, building rock' },
  'ch-overnight':    { files: ['overnight.mp3', 'overnight-2.mp3'], lift: { 'overnight.mp3': 3, 'overnight-2.mp3': 2 }, what: 'the final\'s overnight: dark, the fire, the wind' },
  'ch-champions':    { files: ['champions.mp3'], what: 'the champions crowned: anthem rock' },
  // the places themselves, when there is no music
  'ch-amb-day':      { files: ['amb-day.mp3'], amb: true, lift: { 'amb-day.mp3': 3 }, what: 'the sea against the rocks' },
  'ch-amb-night':    { files: ['amb-night.mp3'], amb: true, lift: { 'amb-night.mp3': 3 }, what: 'crickets and the sea at night' },
  'ch-amb-jungle':   { files: ['amb-jungle.mp3'], amb: true, lift: { 'amb-jungle.mp3': 3 }, what: 'the jungle: the maze, the tiki path, the trail' },
  'ch-amb-arena':    { files: ['amb-arena.mp3'], amb: true, lift: { 'amb-arena.mp3': 3 }, what: 'the Arena after the duel: the torches and the night' },
};
const bedName = (base, i, n) => (n > 1 ? `${base}-${i + 1}` : base);
for (const [base, bed] of Object.entries(CH_BEDS)) {
  bed.files.forEach((f, i) => {
    const vol = Math.min(1, (bed.amb ? AMB_VOL : MUSIC_VOL) * 10 ** ((bed.lift?.[f] || 0) / 20));
    BED_CATALOG[bedName(base, i, bed.files.length)] = { build: null, file: `${dir}${f}`, volume: Math.round(vol * 100) / 100 };
  });
}
const hashOf = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
/** One of a bed's tracks, kept by the screen (the same screen always plays the same one). */
export function variantOf(base, screen) {
  const bed = CH_BEDS[base];
  if (!bed) return base;
  const n = bed.files.length;
  return bedName(base, n > 1 ? hashOf(`${screen?.id}|${base}`) % n : 0, n);
}

// ── stings ─────────────────────────────────────────────────────────────
const sfx = n => `${dir}sfx/${n}.mp3`;
// [file(s), lift dB, what]; a second file is a variant, played in turn
const S = (files, lift, what) => ({ files: [].concat(files), lift, what });
export const CH_STINGS = {
  'ch-impact':      S(sfx('impact'), 1, 'the show open: the logo lands'),
  'ch-recap':       S(sfx('recap'), 1.5, '"Previously on The Challenge"'),
  'ch-card':        S(sfx('card'), 3, 'a title card: today\'s daily, tonight, a new alliance, the final'),
  'ch-gong':        S(sfx('gong'), 1.8, 'TJ hits the gong: the Arena opens, a GO, the summit'),
  'ch-horn':        S([sfx('horn'), sfx('horn-2')], 0, 'TJ blows the horn: Demolition, King of the Raft, Reef Dash, Deep Freeze'),
  'ch-arena-horn':  S(sfx('arena-horn'), 3, 'tonight\'s Arena game is named'),
  'ch-daily-win':   S(sfx('daily-win'), 1.5, 'the daily\'s winners: an impact and the house cheering'),
  'ch-arena-win':   S(sfx('arena-win'), 3, 'the Arena\'s winner: drums and the stand'),
  'ch-eliminated':  S(sfx('eliminated'), 3, 'ELIMINATED: the stamp, a dark drum, a guitar slide, the paper tearing'),
  'ch-called-out':  S(sfx('called-out'), 1.9, 'CALLED OUT: the spray can and a guitar stab'),
  'ch-voted-in':    S(sfx('voted-in'), 1.1, 'VOTED IN: the spray can and a low hit'),
  'ch-spray':       S(sfx('spray'), 3, 'a spray card: NEW MEMBER, NOMINATED, SENT IN'),
  'ch-betrayed':    S(sfx('betrayed'), 3, 'BETRAYED, IT\'S OVER: the spray can and a drum hit'),
  'ch-vote':        S(sfx('vote'), 0.9, 'a vote said out loud'),
  'ch-fight':       S(sfx('fight'), 3, 'a fight breaks out'),
  'ch-tj':          S([sfx('tj'), sfx('tj-2')], 2.7, 'TJ takes the floor at a daily'),
  'ch-whistle':     S(sfx('whistle'), 0, 'a quit'),
  'ch-tape':        S(sfx('tape'), 3, 'a disqualification'),
  'ch-gate':        S(sfx('gate'), 3, 'the loser walks out of the Arena'),
  'ch-crowd':       S(sfx('crowd'), 3, 'the house in the stand'),
  'ch-confetti':    S(sfx('confetti'), 3, 'the champions: confetti and the cheer'),
  'ch-plane':       S(sfx('plane'), 0, 'the plane lands on the airstrip'),
  // the games
  'ch-splash':      S('assets/audio/td/sfx/splash.ogg', 0, 'into the water'),
  'ch-mud':         S([sfx('mud'), sfx('mud-2')], 3, 'into the mud'),
  'ch-fall':        S(sfx('fall'), 3, 'a body hits the sand: off a bar, down hard'),
  'ch-sag':         S(sfx('sag'), 0, 'the net or the rope drops a notch'),
  'ch-creak':       S(sfx('creak'), 0, 'the bar tips toward the water'),
  'ch-dig':         S(sfx('dig'), 3, 'digging in the sand'),
  'ch-bell':        S(sfx('bell'), 1.5, 'a bell rung: the gauntlet, the cages, Hallway Hustle, Spin Stack'),
  'ch-buzzer':      S(sfx('buzzer'), 3, 'a buzzer: Food Wars, Puzzle Pit, Buried'),
  'ch-correct':     S(sfx('correct'), 3, 'a right answer'),
  'ch-wrong':       S(sfx('wrong'), 3, 'a wrong answer or a wrong word'),
  'ch-clock':       S(sfx('clock'), 3, 'the clock on the poles'),
  'ch-engine':      S(sfx('engine'), 3, 'the truck starts'),
  'ch-motor':       S(sfx('motor'), 0, 'the motor spins the log'),
  'ch-smoke-bomb':  S(sfx('smoke-bomb'), 3, 'the smoke bomb goes off'),
  'ch-ice':         S([sfx('ice'), sfx('ice-2')], 3, 'more ice'),
  'ch-crash':       S(sfx('crash'), 0.7, 'a tower in pieces'),
  'ch-smash':       S(sfx('smash'), 3, 'a ram hits a crate'),
  'ch-knife':       S(sfx('knife'), 3, 'the rope is cut'),
  'ch-knock':       S(sfx('knock'), 3, 'pounding on the coffin lid'),
  'ch-shovel':      S(sfx('shovel'), 3, 'sand shovelled over the coffins'),
  'ch-hiss':        S(sfx('hiss'), 3, 'a hand in the box of snakes'),
  'ch-squish':      S(sfx('squish'), 3, 'a bite in the box'),
  'ch-gag':         S(sfx('gag'), 3, 'a gag at the banquet'),
  'ch-eat':         S(sfx('eat'), 3, 'the dish is eaten'),
  'ch-barrel':      S(sfx('barrel'), 0.4, 'a barrel rolls back down the ramp'),
  'ch-car':         S(sfx('car'), 1.8, 'a jump into the next car'),
  'ch-bubbles':     S(sfx('bubbles'), 2.1, 'into the cages, under the water'),
  'ch-punch':       S(sfx('punch'), 3, 'a punch thrown'),
  'ch-smoke-alarm': S(sfx('smoke-alarm'), 3, 'the smoke alarm'),
  'ch-alarm-clock': S(sfx('alarm-clock'), 0, 'an alarm at five'),
  'ch-phone':       S('assets/audio/td/sfx/phone-ring.ogg', 0, 'the call home'),
  'ch-glass':       S(sfx('glass'), 3, 'shots at the bar'),
};
const buffers = {};
const turn = {};
function loadSting(ctx, name) {
  if (buffers[name] || typeof fetch !== 'function') return;
  buffers[name] = [];
  for (const file of CH_STINGS[name].files) {
    fetch(file).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(b => ctx.decodeAudioData(b)).then(buf => { buffers[name].push(buf); }).catch(() => { /* missing file: silence */ });
  }
}
// A crowd runs for seconds; the next step fades it out rather than letting it cheer under TJ.
const CROWD = new Set(['ch-crowd', 'ch-confetti', 'ch-arena-win', 'ch-daily-win']);
const live = [];
for (const [name, s] of Object.entries(CH_STINGS)) {
  CUE_CATALOG[name] = { duck: true, build(ctx, dest, now) {
    const got = buffers[name] || [];
    if (!got.length) { loadSting(ctx, name); return; }
    const src = ctx.createBufferSource();
    src.buffer = got[(turn[name] = ((turn[name] ?? -1) + 1)) % got.length];
    const g = ctx.createGain(); g.gain.value = STING_VOL * 10 ** ((s.lift || 0) / 20);
    src.connect(g); g.connect(dest); src.start(now);
    const item = { name, src, g, at: now };
    live.push(item);
    src.onended = () => { const i = live.indexOf(item); if (i >= 0) live.splice(i, 1); };
  } };
}
/** Fade out a crowd still cheering (the next line has started), and anything else still sounding from an
 *  earlier step (an engine, a motor): a sting belongs to its step. `all`: every sting, now (a new screen, the
 *  Viewing Party closed). */
export function stopCrowd(fade = 0.6, all = false) {
  for (const it of live.slice()) {
    try {
      const c = it.g.context; const now = c.currentTime;
      if (!all && !CROWD.has(it.name) && now - it.at < 1.2) continue;   // a short sting finishes by itself
      if (!all && now - it.at < 0.4) continue;   // the one that has only just started is this step's own
      it.g.gain.cancelScheduledValues(now);
      it.g.gain.setValueAtTime(it.g.gain.value, now);
      it.g.gain.linearRampToValueAtTime(0.0001, now + fade);
      it.src.stop(now + fade + 0.05);
    } catch { /* already stopped */ }
  }
}
/** Fetch every sting once, so the first click is not silent. */
export function warmStings() {
  try {
    const ctx = typeof window !== 'undefined' ? window.audio?._ctx : null;
    if (ctx) for (const name of Object.keys(CH_STINGS)) loadSting(ctx, name);
  } catch { /* sound must never break a screen */ }
}

// ── the music of a moment ──────────────────────────────────────────────
// A house scene sounds like the event it is (steps.js tags each scene's first step with its kind).
const MOOD = {};
const moods = {
  'ch-scheming': ['meeting', 'meeting-spotted', 'recruit', 'deal', 'outing', 'leverage-threat', 'counter-pitch', 'spare-deal', 'plea',
    'house-debate', 'scheme-lie', 'overheard', 'loyalty-test', 'ride-to-the-final', 'alliance-form', 'alliance-grow', 'insurance',
    'tribunal-pitch', 'tribunal-room', 'volunteer', 'pick-guess'],
  'ch-drama': ['fight', 'physical', 'kitchen-blowup', 'receipts', 'old-show-grudge', 'trash-talk', 'floater-callout', 'gossip-backfire',
    'jealousy', 'breakup', 'tj-house-meeting', 'empty-threat', 'arena-eve-confront', 'vet-dismisses', 'rookie-uprising',
    'alliance-betrayal', 'deal-broken', 'disqualified', 'partner-blame', 'team-blame', 'ex-in-the-house'],
  'ch-romance': ['spark', 'showmance', 'flirt', 'beach-date', 'pda', 'hot-tub-truths', 'crush', 'romance'],
  'ch-fun': ['prank', 'gym-flex', 'gym-training', 'pool-games', 'show-banter', 'rookie-hazing', 'beach-run', 'comedy', 'kitchen-disaster',
    'bunk-war', 'tj-at-breakfast', 'villa-reveal', 'house-dinner'],
};
for (const [bed, kinds] of Object.entries(moods)) for (const k of kinds) MOOD[k] = bed;
export const MOOD_OF = MOOD;

const textOf = st => [st?.tj, st?.dir, st?.say?.[1], st?.conf?.[1]].filter(Boolean).join(' ');
function plateAt(steps, idx) {
  for (let i = idx; i >= 0; i--) if (steps[i]?.scene?.plate) return steps[i].scene.plate;
  return '';
}
/** The step a scene starts on (steps.js marks it with sceneIdx), at or before idx. */
function sceneStart(steps, idx) {
  for (let i = idx; i >= 0; i--) if (steps[i] && steps[i].sceneIdx != null) return i;
  return -1;
}
/** What a place sounds like with no music. */
function placeBed(plate) {
  if (!plate || /^conf/.test(plate)) return 'none';
  if (/^arena/.test(plate)) return 'ch-amb-arena';
  if (/^(maze|tiki|trail)/.test(plate)) return 'ch-amb-jungle';
  return /-night$|^camp/.test(plate) ? 'ch-amb-night' : 'ch-amb-day';
}
function sceneBed(screen, idx) {
  const steps = screen.steps;
  const at = sceneStart(steps, idx);
  const plate = plateAt(steps, idx);
  const mood = at >= 0 ? MOOD[steps[at].kind] : null;
  if (mood) return mood;
  if (screen.key === 'party' && /^club/.test(plate)) return 'ch-party';
  if (screen.key === 'party' && /-night$/.test(plate)) return 'ch-party-walls';
  return placeBed(plate);
}
const firstIdx = (steps, test, from = 0) => { for (let i = from; i < steps.length; i++) if (test(steps[i])) return i; return -1; };
const isTribunal = screen => screen.steps.some(st => st.slam?.spray === 'SENT IN' || /tribunal/i.test(`${st.rules?.n || ''} ${st.card?.t || ''} ${st.card?.k || ''}`));

/** The bed under step idx of a screen: a bed name, or 'none' for silence. */
export function bedAt(screen, idx) {
  const steps = screen?.steps || [];
  if (!steps.length) return 'none';
  switch (screen.key) {
    case 'open': return 'ch-open';
    case 'arrival': case 'reveal': return 'ch-fun';
    case 'vote': return isTribunal(screen) ? 'ch-tribunal' : 'ch-deliberation';
    case 'overnight': return 'ch-overnight';
    case 'final-start': case 'final-day2': return 'ch-final';
    case 'champions': { const c = firstIdx(steps, st => st.confetti); return c >= 0 && idx >= c ? 'ch-champions' : 'ch-final'; }
    case 'instant': {
      const d = firstIdx(steps, st => st.duel), w = d < 0 ? -1 : firstIdx(steps, st => st.slam?.winner, d);
      return d >= 0 && idx >= d && (w < 0 || idx < w) ? 'ch-arena' : 'ch-final';
    }
    case 'arena': {
      const d = firstIdx(steps, st => st.duel), w = d < 0 ? -1 : firstIdx(steps, st => st.slam?.winner, d);
      if (d < 0 || idx < d) return 'ch-arena-walk';
      if (w < 0 || idx < w) return 'ch-arena';
      return sceneStart(steps, idx) > w ? sceneBed(screen, idx) : 'ch-amb-arena';
    }
    case 'daily': {
      // quiet while TJ explains it; the rock from the GO to the winners; after it, the scenes' own
      const g = firstIdx(steps, st => st.gong), w = g < 0 ? -1 : firstIdx(steps, st => st.slam?.winner, g);
      if (g >= 0 && idx >= g && (w < 0 || idx < w)) return 'ch-daily';
      if (w >= 0 && idx >= w && sceneStart(steps, idx) > w) return sceneBed(screen, idx);
      return placeBed(plateAt(steps, idx));
    }
    default: return sceneBed(screen, idx);
  }
}

/** The bed a screen opens on (a track of it): its first step's. */
export function bedFor(screen) {
  const b = bedAt(screen, 0);
  return b === 'none' ? 'none' : variantOf(b, screen);
}

// The game moments, read off the words the engine wrote for them (js/ch/daily, js/ch/script).
const BY_TEXT = [
  [/plane comes in low/, 'ch-plane'],
  [/blows the horn|The horn goes|on TJ's horn/, 'ch-horn'],
  [/\bcuts\. .{0,40}drops into the water/, 'ch-knife'],
  [/pounding on the lid|knocks three times on the lid/, 'ch-knock'],
  [/shovels? sand/, 'ch-shovel'],
  [/smoke bomb goes off/, 'ch-smoke-bomb'],
  [/smoke alarm goes off|Smoke pours out of the kitchen/, 'ch-smoke-alarm'],
  [/alarm goes off at five/, 'ch-alarm-clock'],
  [/The engine starts/, 'ch-engine'],
  [/motor kicks in/, 'ch-motor'],
  [/tips another bucket of ice|^More ice\./, 'ch-ice'],
  [/^Crash\./, 'ch-crash'],
  [/knock the top crate off|smashes through|through the crates/, 'ch-smash'],
  [/\brings the bell\b/, 'ch-bell'],
  [/^Buzz!|slams the buzzer|buzzes first/, 'ch-buzzer'],
  [/\bwrong word\b|^Wrong!/, 'ch-wrong'],
  [/\bgags\b/, 'ch-gag'],
  [/chews, swallows|eats every bite|eats it, looking/, 'ch-eat'],
  [/barrel gets away|rolls all the way down/, 'ch-barrel'],
  [/The bar tips toward the water/, 'ch-creak'],
  [/screams and pulls out|pulls out empty-handed/, 'ch-hiss'],
  [/\b(?:reaches|makes|jumps to|swings into) the (?:first|second|third|last) car\b/, 'ch-car'],
  [/\binto the cage\b/, 'ch-bubbles'],
  [/on the clock\./, 'ch-clock'],
  [/goes down hard/, 'ch-fall'],
  [/\bholds the phone\b/, 'ch-phone'],
  [/\bshoves [A-Z][\w ]*\. Hard\.|throws a punch|swings at\b/, 'ch-punch'],
];
const SPRAY = { 'CALLED OUT': 'ch-called-out', 'VOTED IN': 'ch-voted-in', BETRAYED: 'ch-betrayed', "IT'S OVER": 'ch-betrayed' };
const CARD_QUIET = new Set(['Showmance']);
const CARD_NAMED = new Set(["Today's daily", 'Tonight', 'Elimination', 'The call-out', 'New alliance', 'Alliance over', 'The final', 'Surprise']);

/** The sting for step idx of a screen: a cue, two cues played together, or null. What happens
 *  and what it means often land on one step ("drops into the mud. Fiore wins it", "opens the
 *  box, and the smoke bomb goes off" as the race is won): the action and the result are both heard. */
export function cueAt(screen, idx) {
  const steps = screen?.steps || [];
  if (!steps[idx]) return null;
  const did = actionCue(screen, idx);
  const means = resultCue(screen, idx);
  if (did && means && did !== means) return [did, means];
  return means || did || otherCue(screen, idx);
}
/** What physically happens: a fall, or a sound the engine's words name. */
function actionCue(screen, idx) {
  const steps = screen.steps;
  const st = steps[idx];
  if (st.drop) {
    // the stage splashes mud too (a hold game over the pit), so the plate says which
    if (/mud|hang-time/.test(plateAt(steps, idx))) return 'ch-mud';
    return st.splash ? 'ch-splash' : 'ch-fall';
  }
  const t = textOf(st);
  for (const [re, cue] of BY_TEXT) if (re.test(t)) return cue;
  return null;
}
/** What it means: a title, a slam, a vote. */
function resultCue(screen, idx) {
  const st = screen.steps[idx];
  const key = screen.key;
  if (st.open) return 'ch-impact';
  if (st.confetti) return 'ch-confetti';
  if (st.slam?.stamp) return 'ch-eliminated';
  if (st.slam?.spray) return SPRAY[st.slam.spray] || 'ch-spray';
  if (st.slam?.winner) return key === 'arena' || key === 'instant' ? 'ch-arena-win' : key === 'champions' ? 'ch-confetti' : 'ch-daily-win';
  if (st.vote) return 'ch-vote';
  return null;
}
function otherCue(screen, idx) {
  const steps = screen.steps;
  const st = steps[idx];
  const key = screen.key;
  // a daily TJ starts on the horn says so in its rules ("When I blow the horn..."); the rest start on the gong
  if (st.gong) return key === 'daily' && steps.slice(0, idx + 1).some(x => /\bhorn\b/i.test(`${textOf(x)} ${(x.rules?.li || []).join(' ')}`)) ? 'ch-horn' : 'ch-gong';
  if (st.sag) return 'ch-sag';
  if (st.dig) return 'ch-dig';
  if (st.exit) {
    if (key === 'arena' || key === 'instant') return 'ch-gate';
    const at = sceneStart(steps, idx), kind = at >= 0 ? steps[at].kind : null;
    return kind === 'quit' ? 'ch-whistle' : kind === 'disqualified' ? 'ch-tape' : null;
  }
  if (st.card) {
    if (/^Episode \d/.test(st.card.k)) return 'ch-recap';
    if (CARD_QUIET.has(st.card.k)) return null;
    if (key === 'arena' && !CARD_NAMED.has(st.card.k)) return 'ch-arena-horn';   // the game, named
    return 'ch-card';
  }
  // a fight breaking out; the house walking into the stand; TJ taking the floor at a daily
  if (st.sceneIdx != null && (st.kind === 'fight' || st.kind === 'physical')) return 'ch-fight';
  if (key === 'arena' && st.enter && !steps.slice(0, idx).some(x => x.enter)) return 'ch-crowd';
  if (key === 'daily' && st.tj && !steps.slice(0, idx).some(x => x.tj)) return 'ch-tj';
  return null;
}

/** { cue, bed }: the sting(s) for step idx, and the bed under it. */
export function soundFor(screen, idx) {
  if (!screen?.steps?.[idx]) return { cue: null, bed: null };
  return { cue: cueAt(screen, idx), bed: bedAt(screen, idx) };
}

/** Play what this step sounds like. `sting` is false when the viewer went back or seeked:
 *  the music follows, the sting does not. */
export function playStep(screen, idx, sting = true) {
  const a = typeof window !== 'undefined' ? window.audio : null;
  if (!a || typeof a.sfx !== 'function') return;
  // a closed Viewing Party is only hidden: never start music behind it
  const vp = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  if (vp && vp.style.display === 'none') return;
  const { cue, bed } = soundFor(screen, idx);
  stopCrowd();
  try {
    if (bed === 'none' && typeof a.ambient === 'function') a.ambient(null);
    else if (bed && typeof a.ambient === 'function') a.ambient(variantOf(bed, screen));
    if (sting && cue) for (const c of [].concat(cue)) a.sfx(c);
  } catch { /* sound must never break a screen */ }
}

if (typeof document !== 'undefined') { document.addEventListener('vp:screen', () => stopCrowd(0.3, true)); document.addEventListener('vp:close', () => stopCrowd(0.2, true)); }
