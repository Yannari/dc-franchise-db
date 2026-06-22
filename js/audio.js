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
