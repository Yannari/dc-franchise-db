// ══════════════════════════════════════════════════════════════════════
// vp-pm/sound.js — the villa's little sounds, made in the browser
// ══════════════════════════════════════════════════════════════════════
//
// User: "sound like when they're talking like a video game, like Animal
// Crossing, or when we click Next — just to feel in the simulator". No
// files: every sound is synthesised.
//
// ONE ENGINE. Everything plays through the simulator's own js/audio.js (user:
// "there's already audio in the browser from other sims, avoid conflicts"):
// its one AudioContext, its master channel, so the header's mute and volume
// silence and scale these too. The stings and the Next pop are cues in its
// catalogue (pm-*), so they duck its background bed like every other sting
// and show in its debug panel. The screen-change whoosh is already
// vp-ui.js's (screen-swoosh) — not played again here.
//
//   the voices   a blip every few letters as a line types out, pitched per
//                islander (the same islander always sounds the same; girls
//                higher, boys lower), the host brighter, the narrator low and
//                soft. Their own switch ("Voices"), since not everyone wants
//                them; mute is still the header's.
//   the stings   one per moment the stage already marks: a neon sign (a
//                sparkle), "Dumped" (a low fall), a shake (a thud), tears (two
//                sad notes), petals (a warm chime), the photos (a shutter),
//                the tape switch (static), a text (the phone)
//
// Words only for the ear: nothing here reads or changes the season. Silent
// under tests (no unlocked engine).
import { audio as engine, CUE_CATALOG } from '../audio.js';

/** One enveloped tone into `dest`. */
function tone(c, dest, now, { f, f2 = null, t = 0, dur = 0.08, type = 'sine', vol = 0.3, attack = 0.005 }) {
  const at = now + t;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, at);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g); g.connect(dest);
  o.start(at); o.stop(at + dur + 0.02);
}
/** A burst of filtered noise (shutter, static). */
function noise(c, dest, now, { t = 0, dur = 0.3, from = 400, to = 2400, q = 1.2, vol = 0.25, type = 'bandpass' }) {
  const at = now + t;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(from, at); fl.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(fl); fl.connect(g); g.connect(dest);
  src.start(at); src.stop(at + dur + 0.02);
}

// ── the stings, as cues of the shared engine ─────────────────────────
// `duck: true` dips the background bed under the big moments.
const PM_CUES = {
  'pm-pop': { duck: false, build: (c, d, n) => tone(c, d, n, { f: 880, f2: 660, dur: 0.06, vol: 0.1 }) },
  'pm-sparkle': { duck: false, build: (c, d, n) => [784, 988, 1175, 1568].forEach((f, i) => tone(c, d, n, { f, t: i * 0.06, dur: 0.22, vol: 0.08 })) },
  'pm-doom': { duck: true, build: (c, d, n) => { tone(c, d, n, { f: 220, f2: 110, dur: 0.9, type: 'triangle', vol: 0.22 }); tone(c, d, n, { f: 165, f2: 82, t: 0.05, dur: 1, vol: 0.18 }); } },
  'pm-thud': { duck: false, build: (c, d, n) => { tone(c, d, n, { f: 120, f2: 45, dur: 0.25, vol: 0.32 }); noise(c, d, n, { dur: 0.12, from: 200, to: 90, type: 'lowpass', vol: 0.14 }); } },
  'pm-sad': { duck: true, build: (c, d, n) => { tone(c, d, n, { f: 440, dur: 0.5, type: 'triangle', vol: 0.08 }); tone(c, d, n, { f: 349, t: 0.35, dur: 0.8, type: 'triangle', vol: 0.08 }); } },
  'pm-warm': { duck: false, build: (c, d, n) => [523, 659, 784].forEach((f, i) => tone(c, d, n, { f, t: i * 0.09, dur: 0.6, vol: 0.06 })) },
  'pm-shutter': { duck: false, build: (c, d, n) => { noise(c, d, n, { dur: 0.05, from: 3000, to: 5000, type: 'highpass', vol: 0.28 }); noise(c, d, n, { t: 0.08, dur: 0.06, from: 2500, to: 4000, type: 'highpass', vol: 0.22 }); } },
  'pm-ping': { duck: false, build: (c, d, n) => { tone(c, d, n, { f: 1319, dur: 0.12, vol: 0.11 }); tone(c, d, n, { f: 1760, t: 0.13, dur: 0.18, vol: 0.11 }); } },
  'pm-static': { duck: false, build: (c, d, n) => noise(c, d, n, { dur: 0.35, from: 1200, to: 1400, q: 0.3, vol: 0.12 }) },
  // A kiss: a soft rising two-note; one only one of them wanted: a deflating slide.
  'pm-kiss': { duck: false, build: (c, d, n) => { tone(c, d, n, { f: 660, f2: 880, dur: 0.12, vol: 0.09 }); tone(c, d, n, { f: 988, t: 0.1, dur: 0.3, vol: 0.07 }); } },
  'pm-kiss-awkward': { duck: false, build: (c, d, n) => tone(c, d, n, { f: 520, f2: 260, dur: 0.45, type: 'triangle', vol: 0.09 }) },
};
Object.assign(CUE_CATALOG, PM_CUES);

/** The one sting a step's staging calls for, if any, strongest first. */
export function stingFor(st, { switched = false } = {}) {
  const fx = st?.fx || {};
  if (fx.neonDie) return 'pm-doom';
  if (switched) return 'pm-static';
  if (fx.polaroid || fx.flash) return 'pm-shutter';
  if (fx.shake) return 'pm-thud';
  if (fx.tears === true) return 'pm-sad';
  if (fx.petals || fx.tears === 'warm') return 'pm-warm';
  // A text is the phone first, whatever else the moment is.
  if (fx.phone || (st?.sceneStart && st?.voice === 'text')) return 'pm-ping';
  if (fx.neon) return 'pm-sparkle';
  return null;
}
export function playSting(name) { if (name) engine.sfx(name); }
export function clickSound() { engine.sfx('pm-pop'); }

// ── the voices ────────────────────────────────────────────────────────
const VOICES_KEY = 'pm-voices';
export function voicesOn() {
  try { return localStorage.getItem(VOICES_KEY) !== '0'; } catch { return true; }
}
export function pmVoices() {
  const on = !voicesOn();
  try { localStorage.setItem(VOICES_KEY, on ? '1' : '0'); } catch { /* per-viewer convenience only */ }
  if (typeof document !== 'undefined') document.querySelectorAll('.pmv-soundBtn').forEach(b => b.classList.toggle('pmv-muted', !on));
}

const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
function genderOf(name) {
  try { return globalThis.gs?.pm?.profiles?.[name]?.gender || null; } catch { return null; }
}
/** Base pitch and timbre for whoever is talking: the same islander always sounds the same. */
function voiceOf(who, voice) {
  if (voice === 'narrator') return { f: 150, type: 'triangle', vol: 0.11 };
  if (voice === 'dior') return { f: 520, type: 'sine', vol: 0.13 };
  const h = hash(who);
  const g = genderOf(who);
  const base = g === 'm' ? 210 : g === 'f' ? 420 : 300;
  return { f: base * (0.85 + (h % 1000) / 1000 * 0.35), type: h % 3 === 0 ? 'square' : 'triangle', vol: h % 3 === 0 ? 0.05 : 0.11 };
}

let lastBlip = 0;
// ANIMALESE (user: "the talking voice Animal Crossing, like a video game /
// VN"). Each blip is a tiny vowel: a buzz shaped by two formant filters, so
// a line comes out as a run of "ba-ne-mi-lo" chirps in the speaker's pitch.
// A consonant borrows the shape of the vowel after it in the word, the way a
// syllable does; s, sh, f and the like add a breath of hiss.
const VOWEL = { a: [800, 1200], e: [450, 1900], i: [320, 2300], o: [480, 850], u: [340, 750] };
const HISS = new Set(['s', 'z', 'f', 'h', 'x', 'c']);
function vowelFor(text, k) {
  for (let j = k - 1; j < Math.min(text.length, k + 4); j++) {
    const ch = (text[j] || '').toLowerCase();
    if (VOWEL[ch]) return VOWEL[ch];
    if (ch === 'y') return VOWEL.i;
    if (!/[a-z]/.test(ch)) break;
  }
  return VOWEL.a;
}
/**
 * A letter just typed (`text` the whole line, `k` how many are shown). A
 * syllable every third letter; spaces and punctuation are the pauses.
 */
export function voiceTick(who, voice, ch, k, text = '') {
  if (voice === 'stage' || voice === 'clip' || !ch || !/[a-z0-9]/i.test(ch) || k % 3 || !voicesOn()) return;
  const out = engine.output?.();
  if (!out) return;
  const { ctx: c, dest } = out;
  const now = c.currentTime;
  if (now - lastBlip < 0.04) return;
  lastBlip = now;
  try {
    if (voice === 'text') { tone(c, dest, now, { f: 1320, dur: 0.03, vol: 0.04 }); return; }
    const v = voiceOf(who || voice, voice);
    // The pitch wanders a little syllable to syllable, and rises at a question.
    const q = /\?\s*$/.test(text) && k > text.length - 12 ? 1.12 : 1;
    const f0 = v.f * (1 + ((ch.toLowerCase().charCodeAt(0) % 7) - 3) * 0.035) * (voice === 'hut' ? 0.93 : 1) * q;
    const [f1, f2] = vowelFor(text || ch, k);
    const dur = 0.07;
    const src = c.createOscillator(); src.type = 'sawtooth';
    src.frequency.setValueAtTime(f0, now); src.frequency.linearRampToValueAtTime(f0 * 1.04, now + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(v.vol * 1.6, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    for (const [fq, gain] of [[f1, 1], [f2, 0.6]]) {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 6;
      const bg = c.createGain(); bg.gain.value = gain;
      src.connect(bp); bp.connect(bg); bg.connect(g);
    }
    g.connect(dest);
    src.start(now); src.stop(now + dur + 0.02);
    if (HISS.has(ch.toLowerCase())) noise(c, dest, now, { dur: 0.035, from: 4000, to: 6000, type: 'highpass', vol: v.vol * 0.5 });
  } catch { /* a bad voice must never break the player */ }
}

// ── THE MUSIC: a track for a situation, never a background ───────────
// User: "remove the music that's not for a particular occasion … an
// arrival is a situation, major events (comedy / drama / cheating / cry /
// kiss) all have particular music". So an ordinary chat plays in silence,
// and a scene that IS a situation starts that situation's track under the
// dialogue: it carries on while the scenes after it are the same situation
// and fades when the situation ends. Two are one-shots: a text arriving (the
// phone, then a few seconds of its tune — user: "I got a text, can I have a
// music, a notification sound and a transition music") and the cutaway
// between the parts of the day. The suspense is the one the verdict cuts dead.
//
// The tracks are the user's, in assets/audio/mine/manifest.json — royalty
// free, chosen and named by the user for their moments, and published with
// the site — each situation a list of { file, at: [start seconds], loopFrom,
// loopTo }, taken in turn. A situation with no track is silence.

/**
 * Which situation a scene is, by its kind — named as the viewer's own
 * folder names them (user, 2026-09-24: arrival-onlystarters,
 * arrival-onlyforbombshell, ex-arrival, intro, first-kiss, cheating,
 * drama-conflict, comedy, sad, the goodbye message, elimination suspense,
 * winner waiting for the reveal / after the reveal, the transition songs).
 * A text arriving has no music: the phone's ping is the whole of it (user:
 * "for text just build the notification ping, forget the 5 s music").
 */
const SITUATION = {
  // Night one: the starters walking in, meeting, the first coupling.
  // …and night one's kissing games, which are how that coupling is played.
  starters: ['host-open', 'first-arrival', 'arrival-chat', 'first-toast', 'first-look', 'host-first', 'step-forward', 'step-last',
    'step-reveal', 'step-choose', 'step-back',
    'icebreaker', 'lady-luck-kiss', 'kiss-pick', 'lady-luck-pick'],
  intro: ['intro'],
  arrival: ['entrance', 'group-entrance', 'bombshell-react', 'casa-host', 'kin-entrance'],
  ex: ['return-entrance', 'return-ex', 'ex-return', 'ex-awkward', 'ex-jealous'],
  // The first REAL kiss of a couple only (musicOf, below): never a game's kiss
  // (user: "first kiss doesn't count challenge kiss, like real first kiss").
  kiss: [],
  // Romance without a first kiss in it: silent until it has a track.
  romance: ['date', 'love-said', 'official-ask', 'exclusive-ask', 'reunite', 'hideaway',
    // the final dates and each couple's film
    'final-date', 'journey-open', 'journey-clip', 'journey-react', 'journey-end'],
  cheating: ['photos', 'head-turned', 'bed-share'],
  drama: ['argument', 'blowup', 'pile-in', 'villa-divided', 'jealous-confront', 'jealous-retaliate', 'cold-shoulder',
    'casa-row', 'photo-row', 'movie-row', 'lie-row', 'triangle-rivals', 'triangle-ultimatum', 'apology-rejected', 'kin-protect'],
  cry: ['breakdown', 'comfort', 'dump-reaction', 'photo-split', 'movie-split', 'torch', 'ask-declined', 'jealous-sulk'],
  // The dumped saying goodbye, and anyone walking out.
  goodbye: ['dump-goodbye', 'walk', 'solidarity', 'kin-goodbye', 'kin-walk'],
  comedy: ['comedy', 'blow-dare', 'blow-slip', 'baby-doll', 'talent-act'],
  suspense: ['dump-buildup', 'dump-at-risk', 'ballot-reveal', 'save-vote', 'save-tie', 'top-couple-pick', 'couples-vote',
    'ex-ballot', 'final-recoupling', 'recouple-pick', 'steal'],
  // The final: the declarations and the places under the wait, then the
  // winners (steps.js finalSteps marks which is which).
  'final-wait': ['declaration'],
  winner: ['final-result', 'envelope'],
};
const BY_KIND = Object.fromEntries(Object.entries(SITUATION).flatMap(([sit, ks]) => ks.map(k => [k, sit])));
const ONE_SHOT = new Set(['transition']);
const CUTS_BEFORE = new Set(['dump-verdict', 'dump-verdict-couple', 'dump-verdict-singles']);
/**
 * The situation of one event, from what the engine recorded (words only),
 * for steps.js to carry on each step. A kiss, a pull or a bed shared behind a
 * partner's back is cheating, not romance; a Movie Night clip or a Casa
 * reaction is cheating when it exposes someone; a night-one kiss is romance
 * only when it landed.
 */
export function musicOf(e) {
  if (!e?.kind) return null;
  if (e.extra?.secret && ['kiss', 'pull', 'bed-share', 'vent', 'hideaway'].includes(e.kind)) return 'cheating';
  if (e.kind === 'movie-clip') return e.extra?.of === 'loyalty' ? null : 'cheating';
  if (e.kind === 'casa-react') return ['devastated', 'turned', 'both'].includes(e.extra?.of) ? 'cheating' : null;
  // A couple's FIRST kiss is the moment (events.js records it, counting only
  // real kisses — a challenge's kiss is not one); the tenth is a chat.
  if (e.kind === 'kiss') return e.extra?.firstKiss ? 'kiss' : null;
  // Night one's presentation tapes are part of the starters walking in; a
  // bombshell's or Casa's tape is its own.
  if (e.kind === 'intro') return ['arrival', 'arrival-2', 'coupling'].includes(e.phase) ? 'starters' : 'intro';
  return BY_KIND[e.kind] || null;
}

const MINE = 'assets/audio/mine/';
const CLIP = 5.5, FADE_IN = 0.12, FADE_OUT = 1.8, CLIP_VOL = 0.55, BED_VOL = 0.32;
let manifest, lastPart = null, bed = null, shot = null;
const turns = {};
const buffers = {};
async function loadManifest() {
  if (manifest !== undefined) return manifest;
  try {
    const res = await fetch(MINE + 'manifest.json', { cache: 'no-cache' });
    manifest = res.ok ? await res.json() : null;
  } catch { manifest = null; }
  return manifest;
}
async function bufferOf(c, file) {
  if (buffers[file] !== undefined) return buffers[file];
  try {
    const res = await fetch(MINE + file);
    buffers[file] = res.ok ? await c.decodeAudioData(await res.arrayBuffer()) : null;
  } catch { buffers[file] = null; }
  return buffers[file];
}
// Music on/off is the simulator's (the header's music button), shared with every show.
const musicWanted = () => (engine.isMusicEnabled ? engine.isMusicEnabled() : true);
/** The situation's next track, and where in it to start, in turn. */
async function nextTrack(sit) {
  const list = (await loadManifest())?.[sit] || [];
  if (!list.length) return null;
  const n = turns[sit] = (turns[sit] || 0) + 1;
  const pick = list[(n - 1) % list.length];
  const at = pick.at?.length ? pick.at[Math.floor((n - 1) / list.length) % pick.at.length] : 0;
  return { ...pick, start: at };
}
function fadeOut(node, t) {
  if (!node?.src) return;
  try {
    const c = node.src.context, now = c.currentTime;
    node.g.gain.cancelScheduledValues(now);
    node.g.gain.setValueAtTime(Math.max(0.0001, node.g.gain.value), now);
    node.g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    node.src.stop(now + t + 0.05);
  } catch { /* already stopped */ }
}

/** A one-shot: a few seconds of the situation's tune, fast in and slow out. */
async function playShot(sit) {
  if (!musicWanted() || !engine.output?.()) return;
  const pick = await nextTrack(sit);
  const out = engine.output?.();
  if (!pick || !out) return;
  const { ctx: c, dest } = out;
  const buf = await bufferOf(c, pick.file);
  if (!buf) return;
  try {
    const now = c.currentTime;
    if (shot) fadeOut(shot, 0.25);
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(CLIP_VOL, now + FADE_IN);
    g.gain.setValueAtTime(CLIP_VOL, now + CLIP - FADE_OUT);
    g.gain.exponentialRampToValueAtTime(0.0001, now + CLIP);
    src.connect(g); g.connect(dest);
    src.start(now, Math.min(pick.start, Math.max(0, buf.duration - CLIP)), CLIP + 0.1);
    shot = { src, g };
  } catch { /* never break the player */ }
}
export const playTransition = () => playShot('transition');

/** The situation's track under the scene, looping its middle if the scene outlasts it. */
async function startBed(sit) {
  if (bed?.sit === sit) return;
  stopBed();
  if (!musicWanted() || !engine.output?.()) return;
  const mine = bed = { sit, pending: true };
  const pick = await nextTrack(sit);
  const out = engine.output?.();
  if (!pick || !out || bed !== mine) { if (bed === mine) bed = { sit, pending: false }; return; }
  const { ctx: c, dest } = out;
  const buf = await bufferOf(c, pick.file);
  if (!buf || bed !== mine) { if (bed === mine) bed = { sit, pending: false }; return; }
  try {
    const now = c.currentTime;
    const src = c.createBufferSource(); src.buffer = buf;
    if (pick.loopTo) { src.loop = true; src.loopStart = pick.loopFrom || 0; src.loopEnd = Math.min(pick.loopTo, buf.duration); }
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(BED_VOL, now + 1.2);
    src.connect(g); g.connect(dest);
    src.start(now, Math.min(pick.start, Math.max(0, buf.duration - 1)));
    mine.src = src; mine.g = g; mine.pending = false;
  } catch { if (bed === mine) bed = null; }
}
/** Stop the situation's track: `cut` is the dead stop before a verdict, otherwise a fade. */
function stopBed(cut = false) {
  const b = bed; bed = null;
  if (b && !b.pending) fadeOut(b, cut ? 0.06 : 1.2);
}

/** A step of the episode just played: start, keep, change or cut the music. */
export function moodStep(st) {
  if (!st) return;
  // The name is read out in silence.
  if (CUTS_BEFORE.has(st.kind)) { stopBed(true); return; }
  if (!st.sceneStart) return;
  const sit = st.music || null;
  if (sit && ONE_SHOT.has(sit)) { stopBed(); playShot(sit); return; }
  if (!sit) { stopBed(); return; }
  // The winners' names cut the wait dead, as the verdict cuts the suspense.
  if (sit === 'winner' && bed?.sit === 'final-wait') stopBed(true);
  startBed(sit);
}

/** A Perfect Match screen opened: a cutaway when the part of the day changed. */
export function pmScreenOpened(id) {
  const part = String(id || '').replace(/^villa-/, '').replace(/-\d+$/, '');
  if (!part || part === 'debug') { stopBed(); return; }
  // A ceremony split over two screens keeps its music; anywhere else lets it go.
  if (part !== lastPart) { stopBed(); playTransition(); }
  lastPart = part;
}
if (typeof document !== 'undefined' && !globalThis.__pmCutaways) {
  globalThis.__pmCutaways = true;
  document.addEventListener('vp:screen', e => {
    if (String(e.detail?.id || '').startsWith('villa-')) pmScreenOpened(e.detail.id);
    else { stopBed(); lastPart = null; }
  });
  // Leaving the Viewing Party takes the music with it.
  document.addEventListener('vp:close', () => { stopBed(); lastPart = null; });
}
