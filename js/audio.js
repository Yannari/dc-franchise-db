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

// --- Synth voice + bed builders (real graphs filled in Tasks 6-7) ---
function _stub() { /* replaced with real synth graph later */ }

export const CUE_CATALOG = {
  'reveal-whoosh':     { duck: false, build: _stub },
  'torch-snuff':       { duck: true,  build: _stub },
  'idol-sting':        { duck: true,  build: _stub },
  'vote-tick':         { duck: false, build: _stub },
  'tension-drum':      { duck: false, build: _stub },
  'win-fanfare':       { duck: true,  build: _stub },
  'elimination-gong':  { duck: true,  build: _stub },
  'screen-swoosh':     { duck: false, build: _stub },
  'tab-swoosh':        { duck: false, build: _stub },
  'button-tick':       { duck: false, build: _stub },
  'save-chime':        { duck: false, build: _stub },
};

export const BED_CATALOG = {
  'camp-day':       { build: _stub, file: null },
  'camp-night':     { build: _stub, file: null },
  'tribal-tension': { build: _stub, file: null },
  'victory':        { build: _stub, file: null },
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
  // ambient() added in Task 7.
}
