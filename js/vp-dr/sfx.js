// ══════════════════════════════════════════════════════════════════════
// vp-dr/sfx.js — the room reacts: sound effects on a Drag Race reveal
// ══════════════════════════════════════════════════════════════════════
//
// The music (music.js) is the bed under a moment. This is the one-shot on
// top of it: the crowd screaming at a death drop, the gasp at a wig that
// will not come off, the heartbeat before the host says the name.
//
// A card asks for its effect with `data-sfx` (see `tagSfx`); js/vp-dr/reveal.js
// calls `dragSfxStep` when a step is revealed. An effect fires once, on the
// step being revealed one click after the last — never again on a repaint,
// never in a burst when "reveal all" jumps to the end.
//
// Every effect is synthesised, so it works with nothing uploaded. A file
// uploaded as `sfx-<name>.mp3` (see music.js momentForFile) replaces it: a
// real crowd recording beats any synthesis, and the user can drop one in.
import { audio as engine } from '../audio.js';
import { momentTracks, DRAG_SFX } from './music.js';
export { DRAG_SFX };


export const sfxAttr = name => (name ? ` data-sfx="${String(name).replace(/[^a-z0-9-]/gi, '')}"` : '');
/** Put an effect on a card: its first `class="dr-step` gets `data-sfx`. */
export const tagSfx = (html, name) => (name ? String(html).replace(' class="dr-step', `${sfxAttr(name)} class="dr-step`) : html);

// ── THE SYNTH ─────────────────────────────────────────────────────────
function noiseBuf(c, secs) {
  const len = Math.max(1, Math.floor(c.sampleRate * secs));
  const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function env(g, now, { a = 0.01, peak, hold = 0, rel }) {
  // Silent from the start: a gain node is 1 until its first event, and a
  // voice that starts a moment late was a full-volume click (measured: peaks
  // of 1.9 on the gasp and the sashay).
  g.gain.setValueAtTime(0.0001, 0);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + a);
  if (hold) g.gain.setValueAtTime(peak, now + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, now + a + hold + rel);
}
function tone(c, d, now, { f, f2, type = 'sine', t = 0, dur, vol, a = 0.01 }) {
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, now + t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + t + dur);
  env(g, now + t, { a, peak: vol, rel: dur });
  o.connect(g); g.connect(d); o.start(now + t); o.stop(now + t + a + dur + 0.05);
}
function noise(c, d, now, { t = 0, dur, vol, type = 'bandpass', f = 1000, f2, q = 0.8, a = 0.01, hold = 0 }) {
  const s = c.createBufferSource(); s.buffer = noiseBuf(c, a + hold + dur + 0.1);
  const fl = c.createBiquadFilter(); fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f, now + t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, now + t + a + hold + dur);
  const g = c.createGain(); env(g, now + t, { a, peak: vol, hold, rel: dur });
  s.connect(fl); fl.connect(g); g.connect(d); s.start(now + t); s.stop(now + t + a + hold + dur + 0.1);
}

/* A CROWD IS MANY VOICES. Bands of noise in the vowel range, each swelling on
   its own clock, plus a few "woo"s gliding up — the shape of a room of people
   screaming, not one white-noise hiss. `size` scales everything. */
function crowd(c, d, now, { t = 0, size = 1, dur = 2 }) {
  for (let i = 0; i < 7; i++) {
    const f = 700 + Math.random() * 2200;
    noise(c, d, now, { t: t + Math.random() * 0.15, dur: dur * (0.7 + Math.random() * 0.5), vol: 0.2 * size, f, f2: f * (0.8 + Math.random() * 0.3), q: 1.4, a: 0.12 + Math.random() * 0.2, hold: 0.2 * size });
  }
  const woos = Math.round(3 * size);
  for (let i = 0; i < woos; i++) {
    const f = 380 + Math.random() * 320;
    tone(c, d, now, { f, f2: f * 1.5, type: 'triangle', t: t + 0.05 + Math.random() * 0.4, dur: 0.5 + Math.random() * 0.4, vol: 0.03 * size, a: 0.08 });
  }
}
/* APPLAUSE IS CLAPS: short high bursts at random, thinning out. */
function claps(c, d, now, { t = 0, dur = 2.2, rate = 38, vol = 0.3 }) {
  const n = Math.round(dur * rate);
  for (let i = 0; i < n; i++) {
    const at = t + Math.pow(Math.random(), 1.6) * dur;
    noise(c, d, now, { t: at, dur: 0.035, vol: vol * (1 - at / (t + dur + 0.3)), type: 'bandpass', f: 1200 + Math.random() * 1800, q: 1.2, a: 0.002 });
  }
}
function boom(c, d, now, { t = 0, vol = 0.5, f = 110, f2 = 38, dur = 0.6 } = {}) {
  tone(c, d, now, { f, f2, t, dur, vol });
  noise(c, d, now, { t, dur: 0.18, vol: vol * 0.4, type: 'lowpass', f: 600 });
}
/* A BRASS HIT: detuned saws through a closing filter. */
function brass(c, d, now, { t = 0, freqs, dur = 0.9, vol = 0.06 }) {
  const fl = c.createBiquadFilter(); fl.type = 'lowpass';
  fl.frequency.setValueAtTime(3200, now + t); fl.frequency.exponentialRampToValueAtTime(380, now + t + dur);
  fl.connect(d);
  for (const f of freqs) for (const det of [-6, 6]) {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
    env(g, now + t, { a: 0.015, peak: vol, rel: dur });
    o.connect(g); g.connect(fl); o.start(now + t); o.stop(now + t + dur + 0.1);
  }
}
/* A VOWEL: a buzz through two formant filters — "ooh" and "aww". */
function vowel(c, d, now, { t = 0, f = 220, f2, dur = 0.8, formants = [450, 850], vol = 0.05, voices = 5 }) {
  for (let v = 0; v < voices; v++) {
    const o = c.createOscillator(); o.type = 'sawtooth';
    const base = f * (0.85 + Math.random() * 0.4);
    o.frequency.setValueAtTime(base, now + t);
    if (f2) o.frequency.exponentialRampToValueAtTime(base * (f2 / f), now + t + dur);
    const g = c.createGain(); env(g, now + t + Math.random() * 0.06, { a: 0.07, peak: vol / voices * 2, rel: dur });
    for (const fm of formants) {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fm; bp.Q.value = 6;
      o.connect(bp); bp.connect(g);
    }
    g.connect(d); o.start(now + t); o.stop(now + t + dur + 0.2);
  }
}

const VOICES = {
  // "The time has come…": the drop before a lip sync.
  stinger: (c, d, n) => { boom(c, d, n, { vol: 0.55 }); brass(c, d, n, { freqs: [73.4, 110, 146.8, 174.6], dur: 1.3, vol: 0.05 }); },
  // Under the call: two thumps, then two more, slower than you want.
  heartbeat: (c, d, n) => { for (const t of [0, 0.22, 0.95, 1.17]) tone(c, d, n, { f: 62, f2: 40, t, dur: 0.22, vol: t % 0.95 ? 0.35 : 0.5 }); },
  cheer: (c, d, n) => { crowd(c, d, n, { size: 0.8, dur: 1.6 }); claps(c, d, n, { t: 0.1, dur: 1.6, rate: 22, vol: 0.2 }); },
  roar: (c, d, n) => { crowd(c, d, n, { size: 1.5, dur: 2.6 }); claps(c, d, n, { t: 0.2, dur: 2.4 }); },
  // The death drop: the floor, then the room.
  slam: (c, d, n) => { boom(c, d, n, { vol: 0.7, f: 95, f2: 32, dur: 0.5 }); noise(c, d, n, { dur: 0.08, vol: 0.3, type: 'highpass', f: 2500 }); crowd(c, d, n, { t: 0.12, size: 1.6, dur: 2.6 }); claps(c, d, n, { t: 0.3, dur: 2.2 }); },
  gasp: (c, d, n) => { noise(c, d, n, { dur: 0.35, vol: 0.35, type: 'bandpass', f: 1800, f2: 2600, q: 1, a: 0.04 }); vowel(c, d, n, { t: 0.1, f: 240, f2: 300, dur: 0.7, formants: [400, 800], vol: 0.7 }); },
  groan: (c, d, n) => { vowel(c, d, n, { f: 200, f2: 150, dur: 1.0, formants: [600, 1000], vol: 0.8 }); },
  // "Shantay, you stay": a bright chord and the room exhales.
  shantay: (c, d, n) => { brass(c, d, n, { freqs: [261.6, 329.6, 392, 523.3], dur: 1.1, vol: 0.08 }); [1568, 2093, 2637].forEach((f, i) => tone(c, d, n, { f, t: 0.1 + i * 0.07, dur: 0.5, vol: 0.03, type: 'triangle' })); claps(c, d, n, { t: 0.25, dur: 1.8, rate: 26, vol: 0.22 }); },
  // "Sashay away": the air goes out of the room.
  sashay: (c, d, n) => { noise(c, d, n, { dur: 0.9, vol: 0.14, type: 'bandpass', f: 2400, f2: 180, q: 1.5, a: 0.05 }); boom(c, d, n, { t: 0.35, vol: 0.5, f: 80, f2: 30, dur: 1.1 }); vowel(c, d, n, { t: 0.3, f: 210, f2: 160, dur: 1.0, formants: [600, 1000], vol: 0.5 }); },
  win: (c, d, n) => { brass(c, d, n, { freqs: [261.6, 329.6, 392], dur: 0.35, vol: 0.05 }); brass(c, d, n, { t: 0.32, freqs: [349.2, 440, 523.3, 698.5], dur: 1.2, vol: 0.05 }); crowd(c, d, n, { t: 0.2, size: 1.3, dur: 2.4 }); claps(c, d, n, { t: 0.3, dur: 2.6 }); },
  // The runway: camera shutters, a few at once.
  flash: (c, d, n) => { for (let i = 0; i < 5; i++) { const t = Math.random() * 0.5; noise(c, d, n, { t, dur: 0.03, vol: 0.45, type: 'highpass', f: 3000, a: 0.002 }); noise(c, d, n, { t: t + 0.05, dur: 0.025, vol: 0.3, type: 'highpass', f: 4000, a: 0.002 }); } },
  applause: (c, d, n) => { claps(c, d, n, { dur: 2.0, rate: 30, vol: 0.5 }); },
};

/** The voices, for the debug screen and the tests. */
export const SFX_VOICES = VOICES;

// ── UPLOADED RECORDINGS, WHEN THERE ARE ANY ──────────────────────────
const buffers = {};
async function recorded(c, name) {
  let url = null;
  try { url = (await momentTracks())?.[`sfx-${name}`]?.[0]?.url || null; } catch { /* offline */ }
  if (!url) return null;
  if (buffers[url] !== undefined) return buffers[url];
  try { const r = await fetch(url); buffers[url] = r.ok ? await c.decodeAudioData(await r.arrayBuffer()) : null; } catch { buffers[url] = null; }
  return buffers[url];
}

/** Play one effect now. Obeys the page's mute and volume (engine.output). */
const MUSICAL = new Set(['stinger', 'heartbeat', 'shantay', 'sashay']);
export async function playSfx(name, under = []) {
  const out = engine.output?.();
  if (!out || !VOICES[name]) return;
  /* A MUSICAL EFFECT YIELDS TO THE SHOW'S OWN CUE. The stinger, the
     heartbeat and the shantay/sashay hits stand in for music; where the
     real cue plays (the user's files), the show has no effect on top of it.
     The crowd, the applause and the cameras always play. */
  if (MUSICAL.has(name) && under.length) {
    try { const t = await momentTracks(); if (under.some(k => t?.[k]?.length)) return; } catch { /* offline */ }
  }
  const { ctx: c, dest } = out;
  const buf = await recorded(c, name);
  if (buf) {
    const s = c.createBufferSource(); s.buffer = buf; const g = c.createGain(); g.gain.value = 0.9;
    s.connect(g); g.connect(dest); s.start();
    return;
  }
  try { VOICES[name](c, dest, c.currentTime + 0.02); } catch { /* a bad voice never breaks the show */ }
}

// ── ONE CLICK, ONE EFFECT ────────────────────────────────────────────
const shown = {};
export function dragSfxStep(suffix, idx) {
  if (typeof document === 'undefined') return;
  const last = shown[suffix] ?? -1;
  shown[suffix] = Math.max(last, idx);
  if (idx !== last + 1) return;   // a repaint, or "reveal all": silence
  const el = document.getElementById(`dr-step-${suffix}-${idx}`);
  if (!el) return;
  const name = sfxOfStep(suffix, el, document.getElementById(`dr-step-${suffix}-${idx - 1}`));
  if (!name) return;
  // The music under this card, and on the lip sync stage the verdict cue the
  // pause and the verdict both play under.
  const m = el.dataset?.music;
  const under = [m, ...(/lipsync|legacy/.test(suffix) && /suspense|shantay|sashay/.test(m || '') ? ['verdict'] : [])].filter(Boolean);
  playSfx(name, under);
}

/* A SCREEN'S OWN SOUND, for cards that do not ask for one: the runway is
   camera shutters on every look. */
const SCREEN_SFX = { runway: 'flash', finrunway: 'flash' };

/**
 * The effect for one revealed card: its own `data-sfx` first ('none' is
 * silence); then the first card of a winner or crowning moment gets the win
 * (only the first — the reaction after the name is not a second win); then
 * the screen's own sound.
 */
export function sfxOfStep(suffix, el, prev) {
  const own = el?.dataset?.sfx;
  if (own) return own === 'none' ? null : own;
  const m = el?.dataset?.music;
  if ((m === 'crowned' || m === 'winner') && prev?.dataset?.music !== m) return 'win';
  return SCREEN_SFX[suffix] || null;
}
if (typeof document !== 'undefined' && !globalThis.__drSfx) {
  globalThis.__drSfx = true;
  document.addEventListener('vp:screen', () => { for (const k of Object.keys(shown)) delete shown[k]; });
}

// ── WHAT EACH LIP SYNC CARD SOUNDS LIKE ─────────────────────────────
/** The effect for one lip sync scene, from what happened in it. */
export function lipsyncSfxOf(sc) {
  const k = String(sc?.kind || '').replace(/^stage:/, '');
  const tier = sc?.data?.tier;
  if (k === 'lipsync-intro' || k === 'lipsync-legacy-choice') return 'stinger';
  if (k === 'lipsync-call' && tier === 'double-shantay') return 'shantay';   // both stay: one card says it
  if (k === 'lipsync-call' && tier === 'double-sashay') return 'sashay';
  if (k === 'lipsync-suspense' || k === 'lipsync-call') return 'heartbeat';
  if (k === 'lipsync-beat') return tier === 'legendary' ? 'roar' : tier === 'strong' ? 'cheer' : tier === 'lost' ? 'groan' : null;
  if (k === 'lipsync-hook') return tier === 'nailed' ? 'roar' : null;
  // The finish: the room goes up for a runaway or a finish nobody lost.
  if (k === 'lipsync-last-chorus') return tier === 'runaway' || tier === 'both-great' ? 'roar'
    : tier === 'close' || tier === 'ahead' ? 'cheer' : null;
  if (k === 'lipsync-stunt') return tier === 'landed' ? 'slam' : tier === 'failed' ? 'gasp' : null;
  if (k === 'lipsync-shantay') return 'shantay';
  if (k === 'lipsync-sashay') return 'sashay';
  if (k === 'lipsync-win-name') return 'win';
  return null;
}
