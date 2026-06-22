// js/audio.js — Web Audio soundscape (zero files, synthesized). Imports nothing from the project.
export const DEFAULT_PREFS = { muted: false, volume: 0.7 };
export const STORAGE_KEY = 'dc_audio';

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
};

export const BED_CATALOG = {
  'camp-day':       { build: bedCampDay, file: null },
  'camp-night':     { build: bedCampNight, file: null },
  'tribal-tension': { build: bedTribalTension, file: null },
  'victory':        { build: bedVictory, file: null },
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
  _persist() { if (this._storage) this._storage.setItem(STORAGE_KEY, serializePrefs({ muted: this._muted, volume: this._volume })); }
  _applyMaster() { if (this._master) this._master.gain.value = this._muted ? 0 : this._volume; }
  setMuted(m) { this._muted = !!m; this._applyMaster(); this._persist(); }
  setVolume(v) { this._volume = clampVolume(v); this._applyMaster(); this._persist(); }
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
    if (!this._unlocked || !this._ctx) { this._pendingBed = name; return; }
    if (this._currentBed === name) return;
    const now = this._ctx.currentTime;
    if (this._bedNodes) { try { this._bedNodes.stop(now); } catch (e) {} this._bedNodes = null; }
    this._currentBed = null;
    if (!name) return;
    const bed = resolveBed(name);
    if (!bed) return;
    const nodes = bed.build(this._ctx, this._bedGain);
    if (nodes && nodes.gain) {
      const g = nodes.gain.gain;
      if (g.setValueAtTime) g.setValueAtTime(0.0001, now);
      if (g.linearRampToValueAtTime) g.linearRampToValueAtTime(0.18, now + 1.2); else g.value = 0.18;
    }
    this._bedNodes = nodes;
    this._currentBed = name;
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

export function _syncAudioControl() {
  const btn = document.getElementById('audio-toggle');
  const vol = document.getElementById('audio-vol');
  if (btn) btn.textContent = audio.isMuted() ? '🔇' : '🔊';
  if (vol) vol.value = String(Math.round(audio.getVolume() * 100));
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
