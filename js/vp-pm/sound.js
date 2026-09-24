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
  if (fx.neon) return 'pm-sparkle';
  if (fx.phone || (st?.sceneStart && st?.voice === 'text')) return 'pm-ping';
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

// ── the cutaways: your own music between the parts of the day ─────────
// User: "those cuts between scenes with music". A few seconds of a track
// from assets/audio/mine/manifest.json (local only, gitignored: your music,
// licensed to you, not handed out) whenever the episode moves on to another
// part of the day — morning to the day, the day to the challenge, evening to
// the fire pit, and every Coming up / Next time break. Each clip starts on
// one of its track's strong points (`at`), fades in fast and out slowly, and
// the tracks take turns. No manifest, or no files: silence.
const MINE = 'assets/audio/mine/';
const CLIP = 5.5, FADE_IN = 0.12, FADE_OUT = 1.8, CLIP_VOL = 0.55;
let manifest, turn = 0, playing = null, lastPart = null;
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
export async function playTransition() {
  if (!musicWanted()) return;
  const out = engine.output?.();
  if (!out) return;
  const list = (await loadManifest())?.transition || [];
  if (!list.length) return;
  const pick = list[turn % list.length];
  const at = pick.at?.length ? pick.at[Math.floor(turn / list.length) % pick.at.length] : 0;
  turn++;
  const { ctx: c, dest } = out;
  const buf = await bufferOf(c, pick.file);
  if (!buf) return;
  try {
    const now = c.currentTime;
    // One clip at a time: the last one bows out quickly.
    if (playing) { try { playing.g.gain.cancelScheduledValues(now); playing.g.gain.setTargetAtTime(0.0001, now, 0.08); playing.src.stop(now + 0.4); } catch { /* ended */ } }
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(CLIP_VOL, now + FADE_IN);
    g.gain.setValueAtTime(CLIP_VOL, now + CLIP - FADE_OUT);
    g.gain.exponentialRampToValueAtTime(0.0001, now + CLIP);
    src.connect(g); g.connect(dest);
    src.start(now, Math.min(at, Math.max(0, buf.duration - CLIP)), CLIP + 0.1);
    playing = { src, g };
  } catch { /* never break the player */ }
}
// Music on/off is the simulator's (the header's music button), shared with every show.
const musicWanted = () => (engine.isMusicEnabled ? engine.isMusicEnabled() : true);

// ── the suspense: under a dumping or a recoupling, cut before the name ──
// As the real show scores it: the music builds under the host while the
// couples stand at the fire pit, and stops dead a beat before the verdict.
// A track from the manifest's `suspense`, starting at its first `at` (the
// quiet opening) and, if the ceremony outlasts it, looping loopFrom-loopTo
// (the building middle) rather than playing its ending.
const SUSPENSE_KINDS = new Set(['dump-buildup', 'dump-at-risk', 'ballot-reveal', 'save-vote', 'save-tie', 'top-couple-pick',
  'couples-vote', 'ex-return', 'ex-ballot', 'final-recoupling', 'recouple-pick', 'steal']);
const VERDICT_KINDS = new Set(['dump-verdict', 'dump-verdict-couple', 'dump-verdict-singles', 'final-result']);
const BED_VOL = 0.32;
let bed = null;
async function startSuspense() {
  if (bed || !musicWanted()) return;
  const out = engine.output?.();
  if (!out) return;
  const pick = ((await loadManifest())?.suspense || [])[0];
  if (!pick || bed) return;
  const { ctx: c, dest } = out;
  bed = { pending: true };
  const buf = await bufferOf(c, pick.file);
  if (!buf || !bed?.pending) { bed = null; return; }
  try {
    const now = c.currentTime;
    const src = c.createBufferSource(); src.buffer = buf;
    if (pick.loopTo) { src.loop = true; src.loopStart = pick.loopFrom || 0; src.loopEnd = Math.min(pick.loopTo, buf.duration); }
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(BED_VOL, now + 1.5);
    src.connect(g); g.connect(dest);
    src.start(now, pick.at?.[0] || 0);
    bed = { src, g };
  } catch { bed = null; }
}
/** Stop the suspense: `cut` is the dead stop before a verdict, otherwise a fade. */
function stopSuspense(cut = false) {
  if (!bed) return;
  const b = bed; bed = null;
  if (b.pending || !b.src) return;
  try {
    const c = b.src.context, now = c.currentTime, t = cut ? 0.06 : 1.2;
    b.g.gain.cancelScheduledValues(now);
    b.g.gain.setValueAtTime(b.g.gain.value, now);
    b.g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    b.src.stop(now + t + 0.05);
  } catch { /* already stopped */ }
}
/** A step of the episode just played: start, keep or cut the suspense. */
export function moodStep(st) {
  if (!st) return;
  if (VERDICT_KINDS.has(st.kind)) { stopSuspense(true); return; }
  if (SUSPENSE_KINDS.has(st.kind)) startSuspense();
}

/** A Perfect Match screen opened: a cutaway when the part of the day changed. */
export function pmScreenOpened(id) {
  const part = String(id || '').replace(/^villa-/, '').replace(/-\d+$/, '');
  if (!part || part === 'debug') { stopSuspense(); return; }
  // A ceremony split over two screens keeps its music; anywhere else lets it go.
  if (part !== lastPart) { stopSuspense(); playTransition(); }
  lastPart = part;
}
if (typeof document !== 'undefined' && !globalThis.__pmCutaways) {
  globalThis.__pmCutaways = true;
  document.addEventListener('vp:screen', e => {
    if (String(e.detail?.id || '').startsWith('villa-')) pmScreenOpened(e.detail.id);
    else { stopSuspense(); lastPart = null; }
  });
  // Leaving the Viewing Party takes the music with it.
  document.addEventListener('vp:close', () => { stopSuspense(); lastPart = null; });
}
