// js/audio.js — Web Audio soundscape (zero files, synthesized). Imports nothing from the project.
export const DEFAULT_PREFS = { muted: false, volume: 0.7 };
export const STORAGE_KEY = 'dc_audio';
export const MUSIC_KEY = 'dc_audio_music';   // background-music on/off (separate from master mute)

export function clampVolume(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return DEFAULT_PREFS.volume;
  return Math.max(0, Math.min(1, v));
}

export function parsePrefs(raw) {
  if (!raw) return { ...DEFAULT_PREFS };
  let o;
  try { o = JSON.parse(raw); } catch { return { ...DEFAULT_PREFS }; }
  if (!o || typeof o !== 'object') return { ...DEFAULT_PREFS };
  return { muted: !!o.muted, volume: clampVolume(o.volume) };
}

export function serializePrefs(prefs) {
  return JSON.stringify({ muted: !!prefs.muted, volume: clampVolume(prefs.volume) });
}

// --- Synth voice + bed builders ---
function _stub() { /* replaced with real synth graph later */ }

// js/audio.js — synth voice helpers
function _env(ctx, dest, { type='sine', f0, f1, dur, peak=0.3, now }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, now);
  if (f1 != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g); g.connect(dest);
  osc.start(now); osc.stop(now + dur + 0.02);
}
function _noise(ctx, dest, { dur, peak=0.25, type='lowpass', cutoff=1200, now }) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filt = ctx.createBiquadFilter(); filt.type = type; filt.frequency.setValueAtTime(cutoff, now);
  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(filt); filt.connect(g); g.connect(dest);
  src.start(now); src.stop(now + dur + 0.02);
}

function voiceWhoosh(ctx, d, now)    { _noise(ctx, d, { dur: 0.35, peak: 0.18, type: 'bandpass', cutoff: 900, now }); }
function voiceTorchSnuff(ctx, d, now){ _noise(ctx, d, { dur: 0.5, peak: 0.3, type: 'lowpass', cutoff: 700, now }); _env(ctx, d, { type:'sine', f0: 140, f1: 50, dur: 0.45, peak: 0.25, now }); }
function voiceIdolSting(ctx, d, now) { [523,659,784,1047].forEach((f,i)=>_env(ctx,d,{type:'triangle',f0:f,dur:0.4,peak:0.18,now:now+i*0.06})); }
function voiceVoteTick(ctx, d, now)  { _env(ctx, d, { type:'square', f0: 880, f1: 660, dur: 0.07, peak: 0.16, now }); }
function voiceTensionDrum(ctx, d, now){ _env(ctx, d, { type:'sine', f0: 70, f1: 45, dur: 0.6, peak: 0.32, now }); _noise(ctx, d, { dur: 0.2, peak: 0.12, cutoff: 400, now }); }
function voiceWinFanfare(ctx, d, now){ [392,523,659,784].forEach((f,i)=>_env(ctx,d,{type:'sawtooth',f0:f,dur:0.5,peak:0.16,now:now+i*0.1})); }
function voiceGong(ctx, d, now)      { [60,121,183,247].forEach((f)=>_env(ctx,d,{type:'sine',f0:f,dur:1.4,peak:0.12,now})); _noise(ctx,d,{dur:0.3,peak:0.15,cutoff:500,now}); }
function voiceSwoosh(ctx, d, now)    { _noise(ctx, d, { dur: 0.28, peak: 0.12, type: 'highpass', cutoff: 600, now }); }
function voiceTabSwoosh(ctx, d, now) { _noise(ctx, d, { dur: 0.18, peak: 0.08, type: 'bandpass', cutoff: 1500, now }); }
function voiceButtonTick(ctx, d, now){ _env(ctx, d, { type:'square', f0: 1200, dur: 0.04, peak: 0.07, now }); }
function voiceSaveChime(ctx, d, now) { [784,1047].forEach((f,i)=>_env(ctx,d,{type:'triangle',f0:f,dur:0.25,peak:0.12,now:now+i*0.08})); }


// ══════════════════════════════════════════════════════════════════════
// THE TRAITORS — one sound per moment (2026-09-30)
// ══════════════════════════════════════════════════════════════════════
// Synthesised, like everything above: stone, chalk, ceramic, wax, a
// heartbeat, a chair on flagstones. Fired by js/vp-tr/sfx.js when a castle
// screen reveals the beat they belong to. Music beds come later, from files.

// A tone with a shaped attack, for swells and chords.
function _swell(ctx, dest, { type = 'sine', f, f1 = null, attack = 0.02, hold = 0, dur, peak = 0.2, now, detune = 0 }) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, now);
  if (detune && o.detune) o.detune.setValueAtTime(detune, now);
  if (f1 != null) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + attack);
  if (hold) g.gain.setValueAtTime(peak, now + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g); g.connect(dest);
  o.start(now); o.stop(now + dur + 0.05);
}
// Noise through a filter that can sweep, with its own envelope.
function _sweep(ctx, dest, { dur, peak = 0.2, type = 'bandpass', f0 = 1000, f1 = null, q = 1, attack = 0.005, now }) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filt = ctx.createBiquadFilter(); filt.type = type;
  filt.frequency.setValueAtTime(f0, now);
  if (f1 != null) filt.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur);
  if (filt.Q) filt.Q.setValueAtTime(q, now);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(filt); filt.connect(g); g.connect(dest);
  src.start(now); src.stop(now + dur + 0.02);
}

// A hand on the shoulder in a silent hall: a soft cloth thump, and the room
// dropping away under it.
function voiceTrTap(ctx, d, now) {
  _sweep(ctx, d, { dur: 0.14, peak: 0.22, type: 'lowpass', f0: 900, now });
  _swell(ctx, d, { f: 110, f1: 70, dur: 0.25, peak: 0.25, now });
  _swell(ctx, d, { type: 'sine', f: 55, attack: 0.4, dur: 2.2, peak: 0.12, now: now + 0.05 });
}
// Footsteps on a stone stair: five heels, slightly uneven.
function voiceTrFootsteps(ctx, d, now) {
  [0, 0.31, 0.6, 0.93, 1.22].forEach((t, i) => {
    _sweep(ctx, d, { dur: 0.09, peak: 0.16 - i * 0.012, type: 'bandpass', f0: 700 + (i % 2) * 180, q: 1.4, now: now + t });
    _swell(ctx, d, { f: 95, f1: 60, dur: 0.1, peak: 0.12, now: now + t });
  });
}
// A cup turned over on a laid table: the china clink, then the dread under it.
function voiceTrCup(ctx, d, now) {
  [2380, 3170, 4650].forEach((f, i) => _swell(ctx, d, { f, dur: 0.5 - i * 0.1, peak: 0.07, now }));
  _sweep(ctx, d, { dur: 0.05, peak: 0.1, type: 'highpass', f0: 3000, now });
  [73.4, 77.8, 110].forEach(f => _swell(ctx, d, { type: 'sawtooth', f, attack: 0.9, dur: 3.2, peak: 0.035, now: now + 0.25 }));
  _sweep(ctx, d, { dur: 3.2, peak: 0.05, type: 'lowpass', f0: 300, attack: 0.9, now: now + 0.25 });
}
// The portrait taken off the wall and let go: the thud, and the glass.
function voiceTrFrameDrop(ctx, d, now) {
  _swell(ctx, d, { f: 90, f1: 40, dur: 0.5, peak: 0.35, now });
  _sweep(ctx, d, { dur: 0.35, peak: 0.25, type: 'lowpass', f0: 500, now });
  _sweep(ctx, d, { dur: 0.7, peak: 0.12, type: 'highpass', f0: 3500, now: now + 0.02 });
  [3900, 5200, 6100, 4400].forEach((f, i) => _swell(ctx, d, { f, dur: 0.25, peak: 0.03, now: now + 0.04 + i * 0.05 }));
}
// A heartbeat, twice: lub-dub, lub-dub.
function voiceTrHeartbeat(ctx, d, now) {
  [0, 0.78].forEach(t => {
    _swell(ctx, d, { f: 62, f1: 40, dur: 0.16, peak: 0.42, now: now + t });
    _swell(ctx, d, { f: 55, f1: 36, dur: 0.14, peak: 0.3, now: now + t + 0.2 });
  });
}
// One stroke of chalk on slate.
function voiceTrChalk(ctx, d, now) {
  _sweep(ctx, d, { dur: 0.11, peak: 0.07, type: 'bandpass', f0: 3800, f1: 2600, q: 3, attack: 0.012, now });
  _sweep(ctx, d, { dur: 0.06, peak: 0.03, type: 'highpass', f0: 6000, now: now + 0.03 });
}
// A slate turned face-up and set on the wood.
function voiceTrSlate(ctx, d, now) {
  _sweep(ctx, d, { dur: 0.22, peak: 0.08, type: 'bandpass', f0: 600, f1: 2200, now });
  _sweep(ctx, d, { dur: 0.06, peak: 0.18, type: 'bandpass', f0: 1200, q: 2, now: now + 0.2 });
  _swell(ctx, d, { f: 210, f1: 160, dur: 0.12, peak: 0.12, now: now + 0.2 });
}
// The count: a single deep drum.
function voiceTrDrum(ctx, d, now) {
  _swell(ctx, d, { f: 68, f1: 42, dur: 0.9, peak: 0.45, now });
  _sweep(ctx, d, { dur: 0.25, peak: 0.12, type: 'lowpass', f0: 350, now });
}
// A chair pushed back on flagstones, then the room's floor drops.
function voiceTrChair(ctx, d, now) {
  for (let i = 0; i < 7; i++) {
    _sweep(ctx, d, { dur: 0.08, peak: 0.1, type: 'bandpass', f0: 420 + i * 60, q: 5, now: now + i * 0.055 });
  }
  _swell(ctx, d, { f: 49, f1: 36, attack: 0.02, dur: 2.4, peak: 0.3, now: now + 0.45 });
  _sweep(ctx, d, { dur: 1.2, peak: 0.1, type: 'lowpass', f0: 260, now: now + 0.45 });
}
// Before the card turns: a held, rising tone — the whole room not breathing.
function voiceTrHold(ctx, d, now) {
  [98, 98.7, 147].forEach(f => _swell(ctx, d, { type: 'sawtooth', f, f1: f * 1.06, attack: 1.6, dur: 1.9, peak: 0.045, now }));
  _sweep(ctx, d, { dur: 1.9, peak: 0.06, type: 'bandpass', f0: 300, f1: 1400, attack: 1.6, now });
}
// FAITHFUL: a warm major chord opening out, with a shimmer on top.
function voiceTrFaithful(ctx, d, now) {
  [261.6, 329.6, 392, 523.3].forEach((f, i) => _swell(ctx, d, { type: 'triangle', f, attack: 0.25, hold: 0.6, dur: 3.2, peak: 0.1, now: now + i * 0.04 }));
  [1046.5, 1318.5, 1568].forEach((f, i) => _swell(ctx, d, { f, attack: 0.4, dur: 2.4, peak: 0.025, now: now + 0.15 + i * 0.12 }));
  _swell(ctx, d, { f: 65.4, attack: 0.1, dur: 2.6, peak: 0.18, now });
}
// TRAITOR: a low hit, a dark minor cluster, and a crack of noise.
function voiceTrTraitor(ctx, d, now) {
  _swell(ctx, d, { f: 55, f1: 30, dur: 1.8, peak: 0.55, now });
  _sweep(ctx, d, { dur: 0.6, peak: 0.3, type: 'lowpass', f0: 900, f1: 120, now });
  [110, 130.8, 155.6, 116.5].forEach((f, i) => _swell(ctx, d, { type: 'sawtooth', f, attack: 0.05, hold: 0.5, dur: 3, peak: 0.05, now: now + 0.02 * i }));
  _sweep(ctx, d, { dur: 2.8, peak: 0.05, type: 'bandpass', f0: 180, attack: 0.3, now: now + 0.1 });
}
// The turret door: a slow iron-hinge creak, then the latch.
function voiceTrDoor(ctx, d, now) {
  const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(70, now);
  [0.2, 0.4, 0.55, 0.75, 0.9, 1.1].forEach((t, i) => o.frequency.linearRampToValueAtTime(i % 2 ? 62 : 118, now + t));
  f.type = 'bandpass'; f.frequency.setValueAtTime(900, now); if (f.Q) f.Q.setValueAtTime(6, now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.09, now + 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
  o.connect(f); f.connect(g); g.connect(d);
  o.start(now); o.stop(now + 1.25);
  _sweep(ctx, d, { dur: 0.07, peak: 0.2, type: 'bandpass', f0: 1500, q: 3, now: now + 1.25 });
  _swell(ctx, d, { f: 140, f1: 90, dur: 0.12, peak: 0.15, now: now + 1.25 });
}
// A quill writing a name.
function voiceTrQuill(ctx, d, now) {
  for (let i = 0; i < 6; i++) {
    _sweep(ctx, d, { dur: 0.09, peak: 0.11, type: 'bandpass', f0: 4800 - (i % 3) * 500, q: 4, attack: 0.02, now: now + i * 0.13 });
  }
}
// Wax pressed onto the letter: a soft squash, and the seal.
function voiceTrWax(ctx, d, now) {
  _sweep(ctx, d, { dur: 0.3, peak: 0.16, type: 'lowpass', f0: 700, f1: 150, attack: 0.03, now });
  _swell(ctx, d, { f: 92, f1: 55, dur: 0.4, peak: 0.35, now: now + 0.05 });
  _swell(ctx, d, { f: 41, attack: 0.05, dur: 1.6, peak: 0.16, now: now + 0.08 });
}
// A name struck out.
function voiceTrStrike(ctx, d, now) {
  _sweep(ctx, d, { dur: 0.18, peak: 0.14, type: 'highpass', f0: 1500, f1: 5000, now });
  _swell(ctx, d, { f: 180, f1: 90, dur: 0.2, peak: 0.1, now: now + 0.1 });
}
// Coins into the chest.
function voiceTrCoins(ctx, d, now) {
  const hits = [0, 0.07, 0.11, 0.19, 0.24, 0.3, 0.38, 0.43, 0.52, 0.6, 0.69, 0.8];
  hits.forEach((t, i) => {
    const f = 2600 + ((i * 431) % 1900);
    _swell(ctx, d, { f, dur: 0.18, peak: 0.05, now: now + t });
    _swell(ctx, d, { f: f * 1.51, dur: 0.12, peak: 0.02, now: now + t });
  });
  _swell(ctx, d, { f: 120, f1: 80, dur: 0.3, peak: 0.12, now: now + 0.85 });
}
// Tyres on the gravel drive.
function voiceTrGravel(ctx, d, now) {
  for (let i = 0; i < 14; i++) {
    _sweep(ctx, d, { dur: 0.06, peak: 0.16 + (i % 3) * 0.03, type: 'bandpass', f0: 1400 + (i * 173) % 900, q: 1.5, now: now + i * 0.08 + (i % 2) * 0.02 });
  }
  _sweep(ctx, d, { dur: 1.3, peak: 0.05, type: 'lowpass', f0: 250, now });
}
// A letter opened: paper.
function voiceTrLetter(ctx, d, now) {
  _sweep(ctx, d, { dur: 0.25, peak: 0.08, type: 'highpass', f0: 2500, f1: 6000, now });
  _sweep(ctx, d, { dur: 0.3, peak: 0.06, type: 'bandpass', f0: 3200, q: 1, now: now + 0.22 });
}
// The armoury: metal on metal.
function voiceTrClang(ctx, d, now) {
  [523, 1377, 2051, 2890].forEach((f, i) => _swell(ctx, d, { type: 'triangle', f, dur: 1.4 - i * 0.2, peak: 0.07, now }));
  _sweep(ctx, d, { dur: 0.05, peak: 0.2, type: 'bandpass', f0: 2500, q: 2, now });
}
// A bell tolling, for the endgame.
function voiceTrToll(ctx, d, now) {
  [98, 196.5, 294, 392.7, 517].forEach((f, i) => _swell(ctx, d, { f, dur: 4 - i * 0.5, peak: 0.1 - i * 0.015, now }));
  _sweep(ctx, d, { dur: 0.08, peak: 0.1, type: 'bandpass', f0: 1800, now });
}
// The blindfold: a hush falls and a low wind moves.
function voiceTrHush(ctx, d, now) {
  _sweep(ctx, d, { dur: 2.6, peak: 0.07, type: 'bandpass', f0: 400, f1: 180, attack: 0.9, q: 0.8, now });
  _swell(ctx, d, { f: 65.4, attack: 1.2, dur: 2.8, peak: 0.1, now });
}

// --- Ambient bed builders (looping pad) ---
function _padBed(ctx, dest, freqs) {
  const oscs = freqs.map(f => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; return o; });
  const g = ctx.createGain(); g.gain.value = 0.0001;
  oscs.forEach(o => { o.connect(g); o.start(); });
  g.connect(dest);
  return { gain: g, stop: (now, t = 1.2) => {
    if (g.gain.setValueAtTime) g.gain.setValueAtTime(g.gain.value, now);
    if (g.gain.linearRampToValueAtTime) g.gain.linearRampToValueAtTime(0.0001, now + t); else g.gain.value = 0.0001;
    oscs.forEach(o => o.stop && o.stop(now + t + 0.05));
  } };
}
function bedCampDay(ctx, d)      { return _padBed(ctx, d, [196, 294, 392]); }
function bedCampNight(ctx, d)    { return _padBed(ctx, d, [110, 146, 220]); }
function bedTribalTension(ctx, d){ return _padBed(ctx, d, [98, 103, 147]); }
function bedVictory(ctx, d)      { return _padBed(ctx, d, [262, 330, 392, 523]); }
function bedChallenge(ctx, d)    { return _padBed(ctx, d, [131, 165, 196, 247]); } // driving, energetic
function bedAftermath(ctx, d)    { return _padBed(ctx, d, [220, 277, 330]); }      // bright talk-show lounge

export const CUE_CATALOG = {
  'reveal-whoosh':     { duck: false, build: voiceWhoosh },
  'torch-snuff':       { duck: true,  build: voiceTorchSnuff },
  'idol-sting':        { duck: true,  build: voiceIdolSting },
  'vote-tick':         { duck: false, build: voiceVoteTick },
  'tension-drum':      { duck: false, build: voiceTensionDrum },
  'win-fanfare':       { duck: true,  build: voiceWinFanfare },
  'elimination-gong':  { duck: true,  build: voiceGong },
  'screen-swoosh':     { duck: false, build: voiceSwoosh },
  'tab-swoosh':        { duck: false, build: voiceTabSwoosh },
  'button-tick':       { duck: false, build: voiceButtonTick },
  'save-chime':        { duck: false, build: voiceSaveChime },
  // The Traitors (js/vp-tr/sfx.js decides when)
  'tr-tap':        { duck: true,  build: voiceTrTap },
  'tr-footsteps':  { duck: false, build: voiceTrFootsteps },
  'tr-cup':        { duck: true,  build: voiceTrCup },
  'tr-frame-drop': { duck: true,  build: voiceTrFrameDrop },
  'tr-heartbeat':  { duck: true,  build: voiceTrHeartbeat },
  'tr-chalk':      { duck: false, build: voiceTrChalk },
  'tr-slate':      { duck: false, build: voiceTrSlate },
  'tr-drum':       { duck: true,  build: voiceTrDrum },
  'tr-chair':      { duck: true,  build: voiceTrChair },
  'tr-hold':       { duck: true,  build: voiceTrHold },
  'tr-faithful':   { duck: true,  build: voiceTrFaithful },
  'tr-traitor':    { duck: true,  build: voiceTrTraitor },
  'tr-door':       { duck: false, build: voiceTrDoor },
  'tr-quill':      { duck: false, build: voiceTrQuill },
  'tr-wax':        { duck: true,  build: voiceTrWax },
  'tr-strike':     { duck: false, build: voiceTrStrike },
  'tr-coins':      { duck: false, build: voiceTrCoins },
  'tr-gravel':     { duck: false, build: voiceTrGravel },
  'tr-letter':     { duck: false, build: voiceTrLetter },
  'tr-clang':      { duck: false, build: voiceTrClang },
  'tr-toll':       { duck: true,  build: voiceTrToll },
  'tr-hush':       { duck: true,  build: voiceTrHush },
};

// Each bed prefers its mp3 file (looped). Drop the files in assets/audio/ to
// enable them. If a file is set but missing/unloadable, the bed plays SILENCE
// (not the synth pad) — `build` is kept only as an opt-in fallback when file is null.
export const BED_CATALOG = {
  'camp-day':       { build: bedCampDay,       file: 'assets/audio/bed-camp-day.mp3',   volume: 0.40 },
  'camp-night':     { build: bedCampNight,     file: 'assets/audio/bed-camp-night.mp3', volume: 0.40 },
  'tribal-tension': { build: bedTribalTension, file: 'assets/audio/bed-tribal.mp3',     volume: 0.42 },
  'victory':        { build: bedVictory,       file: 'assets/audio/bed-victory.mp3',    volume: 0.45 },
  'challenge':      { build: bedChallenge,     file: 'assets/audio/bed-challenge.mp3',  volume: 0.40 },
  'aftermath':      { build: bedAftermath,     file: 'assets/audio/bed-aftermath.mp3',  volume: 0.40 },
};

export function resolveCue(name) { return CUE_CATALOG[name] || null; }
export function resolveBed(name) { return BED_CATALOG[name] || null; }

export function duckGain(base, ducking, amount = 0.5) {
  const a = Math.max(0, Math.min(1, amount));
  return ducking ? base * (1 - a) : base;
}

export class AudioEngine {
  constructor({ ctxFactory, storage } = {}) {
    this._ctxFactory = ctxFactory || (() => new (globalThis.AudioContext || globalThis.webkitAudioContext)());
    this._storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    const prefs = parsePrefs(this._storage ? this._storage.getItem(STORAGE_KEY) : null);
    this._muted = prefs.muted;
    this._volume = prefs.volume;
    // Background music (ambient beds) on/off — independent of master mute, so the
    // user can keep SFX while silencing beds. Stored under its own key (default ON).
    this._musicOn = this._storage ? this._storage.getItem(MUSIC_KEY) !== '0' : true;
    this._desiredBed = null;   // last bed requested, played only while _musicOn
    this._unlocked = false;
    this._ctx = null;
    this._master = null;
    this._bedGain = null;
    this._currentBed = null;
    this._bedNodes = null;
    this._pendingBed = null;
    this._warned = new Set();
  }
  isMuted() { return this._muted; }
  getVolume() { return this._volume; }
  isUnlocked() { return this._unlocked; }
  isMusicEnabled() { return this._musicOn; }
  _persist() { if (this._storage) this._storage.setItem(STORAGE_KEY, serializePrefs({ muted: this._muted, volume: this._volume })); }
  _applyMaster() { if (this._master) this._master.gain.value = this._muted ? 0 : this._volume; }
  setMuted(m) { this._muted = !!m; this._applyMaster(); this._persist(); }
  setVolume(v) { this._volume = clampVolume(v); this._applyMaster(); this._persist(); }
  setMusicEnabled(on) {
    this._musicOn = !!on;
    if (this._storage) this._storage.setItem(MUSIC_KEY, this._musicOn ? '1' : '0');
    this._applyAmbient();   // start the current scene's bed, or stop it
  }
  unlock() {
    if (this._unlocked) return;
    this._ctx = this._ctxFactory();
    this._master = this._ctx.createGain();
    this._applyMaster();
    this._master.connect(this._ctx.destination);
    this._bedGain = this._ctx.createGain();
    this._bedGain.gain.value = 1;
    this._bedGain.connect(this._master);
    if (this._ctx.resume) this._ctx.resume();
    this._unlocked = true;
    if (this._pendingBed) { const b = this._pendingBed; this._pendingBed = null; this.ambient(b); }
  }
  _resolveCue(name) {
    if (this._catalogOverride && this._catalogOverride[name]) return this._catalogOverride[name];
    return resolveCue(name);
  }
  // The live context and master channel, for a caller that plays its own
  // tones (Perfect Match's talking blips, vp-pm/sound.js): null while muted or
  // locked, so it obeys the same mute and volume as every cue.
  output() {
    if (this._muted || !this._unlocked || !this._ctx) return null;
    return { ctx: this._ctx, dest: this._master };
  }
  sfx(name) {
    if (this._muted || !this._unlocked || !this._ctx) return;
    const cue = this._resolveCue(name);
    if (!cue) {
      if (!this._warned.has(name)) { this._warned.add(name); console.warn('[audio] unknown cue:', name); }
      return;
    }
    const now = this._ctx.currentTime;
    if (cue.duck) this._duck(now);
    try { cue.build(this._ctx, this._master, now); } catch (e) { /* a bad voice must never break the app */ }
  }
  _duck(now) {
    if (!this._bedGain) return;
    const g = this._bedGain.gain;
    if (g.cancelScheduledValues) g.cancelScheduledValues(now);
    if (g.setValueAtTime) g.setValueAtTime(duckGain(1, true), now); else g.value = duckGain(1, true);
    if (g.linearRampToValueAtTime) g.linearRampToValueAtTime(1, now + 0.8);
  }
  ambient(name) {
    this._desiredBed = name;   // remember the scene's bed even if music is off
    this._applyAmbient();
  }

  // Reconcile playback with the desired bed + music-on state. When music is off,
  // the effective bed is null (silence) but _desiredBed is retained so toggling
  // music back on resumes the current scene's bed.
  _applyAmbient() {
    const name = this._musicOn ? this._desiredBed : null;
    if (!this._unlocked || !this._ctx) { this._pendingBed = this._desiredBed; return; }
    if (this._currentBed === name) return;
    const now = this._ctx.currentTime;
    if (this._bedNodes) { try { this._bedNodes.stop(now); } catch (e) {} this._bedNodes = null; }
    this._currentBed = null;
    if (!name) return;
    const bed = resolveBed(name);
    if (!bed) return;
    this._currentBed = name;
    // Prefer the bed's mp3 file; only fall back to the synth pad when no file is set.
    if (bed.file) this._playBedFile(name, bed);
    else this._playBedSynth(now, bed, 0.18);
  }

  // Build the synth pad bed and fade it in to `target`.
  _playBedSynth(now, bed, target = 0.18) {
    const nodes = bed.build(this._ctx, this._bedGain);
    if (nodes && nodes.gain) {
      const g = nodes.gain.gain;
      if (g.setValueAtTime) g.setValueAtTime(0.0001, now);
      if (g.linearRampToValueAtTime) g.linearRampToValueAtTime(target, now + 1.2); else g.value = target;
    }
    this._bedNodes = nodes;
  }

  // Fetch + decode + loop the bed's mp3 through the bed-gain channel. Decoded
  // buffers are cached. On any failure (missing file, decode error, no fetch),
  // the bed stays SILENT — never throws, never falls back to the synth pad.
  _playBedFile(name, bed) {
    const ctx = this._ctx;
    const target = typeof bed.volume === 'number' ? bed.volume : 0.4;
    const start = (buffer) => {
      if (this._currentBed !== name || !this._ctx) return; // user switched beds mid-load
      try {
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true;
        const g = ctx.createGain();
        const now = ctx.currentTime;
        if (g.gain.setValueAtTime) g.gain.setValueAtTime(0.0001, now); else g.gain.value = 0.0001;
        if (g.gain.linearRampToValueAtTime) g.gain.linearRampToValueAtTime(target, now + 1.2); else g.gain.value = target;
        src.connect(g); g.connect(this._bedGain);
        src.start(0);
        this._bedNodes = {
          gain: g,
          stop: (t0, fade = 1.2) => {
            try {
              if (g.gain.cancelScheduledValues) g.gain.cancelScheduledValues(t0);
              if (g.gain.setValueAtTime) g.gain.setValueAtTime(g.gain.value, t0);
              if (g.gain.linearRampToValueAtTime) g.gain.linearRampToValueAtTime(0.0001, t0 + fade); else g.gain.value = 0.0001;
              if (src.stop) src.stop(t0 + fade + 0.05);
            } catch (e) { /* node already stopped */ }
          },
        };
      } catch (e) { /* node graph unavailable — stay silent */ }
    };
    if (this._bedBufCache && this._bedBufCache[name]) { start(this._bedBufCache[name]); return; }
    let p;
    try { p = fetch(bed.file); } catch (e) { this._warnBedOnce(name, bed.file); return; }
    if (!p || !p.then) { this._warnBedOnce(name, bed.file); return; }
    p.then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.arrayBuffer(); })
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => { if (!this._bedBufCache) this._bedBufCache = {}; this._bedBufCache[name] = decoded; start(decoded); })
      .catch(() => this._warnBedOnce(name, bed.file)); // missing/undecodable → silence
  }

  _warnBedOnce(name, file) {
    if (!this._warnedBeds) this._warnedBeds = new Set();
    if (this._warnedBeds.has(name)) return;
    this._warnedBeds.add(name);
    console.warn(`[audio] ambient bed "${name}" file not loaded (${file}) — playing silence. Drop the mp3 in to enable it.`);
  }
}

// ── Declarative cue helper ──
export function cueFromElement(el) {
  if (!el || !el.getAttribute) return null;
  return el.getAttribute('data-sfx') || null;
}

// ── Singleton + first-gesture unlock ──
export const audio = new AudioEngine();

// ── Header mute/volume control + one-time toast ──
export function toggleAudioMute() {
  audio.setMuted(!audio.isMuted());
  const btn = document.getElementById('audio-toggle');
  if (btn) btn.textContent = audio.isMuted() ? '🔇' : '🔊';
}
export function setAudioVolume(v) { audio.setVolume(Number(v)); }

// Background-music on/off — independent of the master mute. Keeps SFX, toggles beds.
export function toggleAudioMusic() {
  audio.setMusicEnabled(!audio.isMusicEnabled());
  _syncMusicControl();
}
export function _syncMusicControl() {
  const btn = document.getElementById('audio-music');
  if (btn) {
    const on = audio.isMusicEnabled();
    btn.textContent = '🎵';              // state shown via the .off class (dimmed + struck through)
    btn.classList.toggle('off', !on);
    btn.title = on ? 'Background music: on (click to mute music only)' : 'Background music: off (SFX still play)';
  }
}

export function _syncAudioControl() {
  const btn = document.getElementById('audio-toggle');
  const vol = document.getElementById('audio-vol');
  if (btn) btn.textContent = audio.isMuted() ? '🔇' : '🔊';
  if (vol) vol.value = String(Math.round(audio.getVolume() * 100));
  _syncMusicControl();
}
export function _audioToastOnce() {
  if (audio.isMuted()) return;
  if (audio._storage && audio._storage.getItem('dc_audio_toast')) return;
  if (audio._storage) audio._storage.setItem('dc_audio_toast', '1');
  const t = document.createElement('div');
  t.className = 'audio-toast'; t.textContent = '🔊 Sound on — click the speaker to mute';
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3500);
}

// ── App-wide subtle UI sounds + dev/test panel ──
export function installUiSounds() {
  document.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest && e.target.closest('.btn, .tab-btn');
    if (btn) audio.sfx('button-tick');
  }, true);
}
export function audioPlay(name) { audio.sfx(name); }
export function audioBed(name) { audio.ambient(name || null); }
export function buildAudioDebugPanel() {
  const cues = Object.keys(CUE_CATALOG).map(n => `<button class="btn btn-sm" onclick="audioPlay('${n}')">${n}</button>`).join(' ');
  const beds = Object.keys(BED_CATALOG).map(n => `<button class="btn btn-sm" onclick="audioBed('${n}')">${n}</button>`).join(' ')
    + ` <button class="btn btn-sm" onclick="audioBed(null)">stop bed</button>`;
  return `<div style="padding:12px"><h3>Audio cues</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${cues}</div>
    <h3 style="margin-top:14px">Ambient beds</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${beds}</div></div>`;
}

let _initDone = false;
export function initAudio() {
  if (_initDone) return audio;
  _initDone = true;
  const unlock = () => {
    audio.unlock();
    _syncAudioControl();
    _audioToastOnce();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
  installUiSounds();
  // Reflect persisted state on the control immediately on load.
  _syncAudioControl();
  return audio;
}
