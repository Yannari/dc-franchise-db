# Audio System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a synthesized, zero-file Web Audio soundscape — cinematic VP cues, ambient beds, and subtle app-wide UI feedback — driven declaratively via `data-sfx`/`data-ambient` attributes, default-on with a header mute/volume control.

**Architecture:** One self-contained `js/audio.js` module exposes an `AudioEngine` singleton wrapping a single `AudioContext`. Pure logic (prefs, volume math, cue resolution, ducking) is separated from Web Audio calls so it is unit-testable; the engine takes an injectable `ctxFactory` + `storage` for tests. VP reveal/render handlers read declarative attributes and call the engine. `core.js` stays a leaf; `audio.js` imports nothing from the project.

**Tech Stack:** Vanilla ES modules (no build step), Web Audio API, vitest + jsdom for tests.

## Global Constraints

- ES modules, no build step. Open `simulator.html` in a browser. (CLAUDE.md)
- `js/audio.js` MUST NOT import from `core.js` or any project module — keep it dependency-free and independently testable.
- Tests live in `tests/**/*.test.js`, run via `npx vitest run`. Env is jsdom — **jsdom has no `AudioContext`**, so engine tests MUST inject a fake context.
- All exported functions exposed on `window` for onclick handlers, via the existing `main.js` module-spread pattern.
- localStorage key: `dc_audio` = `{ muted: boolean, volume: number 0..1 }`.
- Default prefs: `{ muted: false, volume: 0.7 }`.
- Cue names (exact, lowercase-kebab): `reveal-whoosh`, `torch-snuff`, `idol-sting`, `vote-tick`, `tension-drum`, `win-fanfare`, `elimination-gong`, `screen-swoosh`, `tab-swoosh`, `button-tick`, `save-chime`. Bed names: `camp-day`, `camp-night`, `tribal-tension`, `victory`.
- Audio is never required for function; muted/suspended → every cue no-ops without throwing.

---

### Task 1: Preferences + volume math (pure)

**Files:**
- Create: `js/audio.js`
- Test: `tests/audio.test.js`

**Interfaces:**
- Produces: `DEFAULT_PREFS = { muted:false, volume:0.7 }`, `STORAGE_KEY = 'dc_audio'`, `clampVolume(v:number):number`, `parsePrefs(raw:string|null):{muted:boolean,volume:number}`, `serializePrefs(prefs):string`.

- [ ] **Step 1: Write the failing test**

```js
// tests/audio.test.js
import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, STORAGE_KEY, clampVolume, parsePrefs, serializePrefs } from '../js/audio.js';

describe('audio prefs', () => {
  it('STORAGE_KEY and defaults', () => {
    expect(STORAGE_KEY).toBe('dc_audio');
    expect(DEFAULT_PREFS).toEqual({ muted: false, volume: 0.7 });
  });
  it('clampVolume clamps to [0,1] and guards NaN', () => {
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(-2)).toBe(0);
    expect(clampVolume(9)).toBe(1);
    expect(clampVolume(NaN)).toBe(0.7);
    expect(clampVolume('x')).toBe(0.7);
  });
  it('parsePrefs handles null, junk, and valid', () => {
    expect(parsePrefs(null)).toEqual({ muted: false, volume: 0.7 });
    expect(parsePrefs('not json')).toEqual({ muted: false, volume: 0.7 });
    expect(parsePrefs('{"muted":true,"volume":0.3}')).toEqual({ muted: true, volume: 0.3 });
    expect(parsePrefs('{"volume":5}')).toEqual({ muted: false, volume: 1 });
  });
  it('serializePrefs round-trips through parsePrefs', () => {
    const s = serializePrefs({ muted: true, volume: 0.42 });
    expect(parsePrefs(s)).toEqual({ muted: true, volume: 0.42 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio.test.js`
Expected: FAIL — `Failed to resolve import "../js/audio.js"` (file does not exist yet).

- [ ] **Step 3: Write minimal implementation**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add js/audio.js tests/audio.test.js
git commit -m "feat(audio): preferences + volume math"
```

---

### Task 2: Cue & bed catalogs + resolveCue (pure)

**Files:**
- Modify: `js/audio.js`
- Test: `tests/audio.test.js`

**Interfaces:**
- Produces: `CUE_CATALOG` (object: name → `{ duck:boolean, build:Function }`), `BED_CATALOG` (object: name → `{ build:Function, file:string|null }`), `resolveCue(name):object|null`, `resolveBed(name):object|null`. (`build` functions are placeholders here, filled with real synth graphs in Task 6/7; tests only assert shape.)

- [ ] **Step 1: Write the failing test**

```js
// append to tests/audio.test.js
import { CUE_CATALOG, BED_CATALOG, resolveCue, resolveBed } from '../js/audio.js';

describe('audio catalogs', () => {
  const cueNames = ['reveal-whoosh','torch-snuff','idol-sting','vote-tick','tension-drum','win-fanfare','elimination-gong','screen-swoosh','tab-swoosh','button-tick','save-chime'];
  const bedNames = ['camp-day','camp-night','tribal-tension','victory'];
  it('every required cue exists with build fn + duck flag', () => {
    for (const n of cueNames) {
      expect(CUE_CATALOG[n], n).toBeDefined();
      expect(typeof CUE_CATALOG[n].build).toBe('function');
      expect(typeof CUE_CATALOG[n].duck).toBe('boolean');
    }
  });
  it('every required bed exists with build fn + file slot', () => {
    for (const n of bedNames) {
      expect(BED_CATALOG[n], n).toBeDefined();
      expect(typeof BED_CATALOG[n].build).toBe('function');
      expect('file' in BED_CATALOG[n]).toBe(true);
    }
  });
  it('resolveCue / resolveBed return null for unknown', () => {
    expect(resolveCue('reveal-whoosh')).toBe(CUE_CATALOG['reveal-whoosh']);
    expect(resolveCue('nope')).toBeNull();
    expect(resolveBed('camp-day')).toBe(BED_CATALOG['camp-day']);
    expect(resolveBed('nope')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio.test.js`
Expected: FAIL — `CUE_CATALOG is not defined` / undefined import.

- [ ] **Step 3: Write minimal implementation**

Add to `js/audio.js`. Voice/bed builders are stubbed now (real graphs land in Tasks 6–7); a stub keeps the catalog shape valid and tests green.

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio.test.js`
Expected: PASS (all prior + 3 new).

- [ ] **Step 5: Commit**

```bash
git add js/audio.js tests/audio.test.js
git commit -m "feat(audio): cue + bed catalogs with resolvers"
```

---

### Task 3: Ducking gain math (pure)

**Files:**
- Modify: `js/audio.js`
- Test: `tests/audio.test.js`

**Interfaces:**
- Produces: `duckGain(base:number, ducking:boolean, amount=0.5):number`.

- [ ] **Step 1: Write the failing test**

```js
// append to tests/audio.test.js
import { duckGain } from '../js/audio.js';

describe('duckGain', () => {
  it('returns base when not ducking', () => { expect(duckGain(1, false)).toBe(1); });
  it('reduces by amount when ducking', () => { expect(duckGain(1, true, 0.5)).toBe(0.5); });
  it('clamps amount to [0,1]', () => {
    expect(duckGain(1, true, 2)).toBe(0);
    expect(duckGain(1, true, -1)).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio.test.js`
Expected: FAIL — `duckGain is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
// add to js/audio.js
export function duckGain(base, ducking, amount = 0.5) {
  const a = Math.max(0, Math.min(1, amount));
  return ducking ? base * (1 - a) : base;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/audio.js tests/audio.test.js
git commit -m "feat(audio): ducking gain math"
```

---

### Task 4: AudioEngine — state, mute/volume, persistence, unlock

**Files:**
- Modify: `js/audio.js`
- Create: `tests/helpers/fakeAudioContext.js`
- Test: `tests/audio.test.js`

**Interfaces:**
- Consumes: `parsePrefs`, `serializePrefs`, `clampVolume` (Task 1).
- Produces: `class AudioEngine` with constructor `({ ctxFactory, storage })`; methods `isMuted()`, `getVolume()`, `isUnlocked()`, `setMuted(bool)`, `setVolume(num)`, `unlock()`. Persists to injected `storage` under `STORAGE_KEY`.

- [ ] **Step 1: Write the fake AudioContext helper**

```js
// tests/helpers/fakeAudioContext.js — minimal Web Audio stand-in for jsdom (which has no AudioContext)
export function makeFakeParam(value = 0) {
  return {
    value,
    setValueAtTime(v) { this.value = v; return this; },
    linearRampToValueAtTime(v) { this.value = v; return this; },
    exponentialRampToValueAtTime(v) { this.value = v; return this; },
    cancelScheduledValues() { return this; },
  };
}
export class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'suspended';
    this.destination = { _isDestination: true };
    this.created = []; // log of node types created
    this.resumed = 0;
  }
  resume() { this.resumed++; this.state = 'running'; return Promise.resolve(); }
  _node(type, extra = {}) { const n = { type, connect() {}, disconnect() {}, ...extra }; this.created.push(n); return n; }
  createGain() { return this._node('gain', { gain: makeFakeParam(1) }); }
  createOscillator() { return this._node('oscillator', { frequency: makeFakeParam(440), type: 'sine', start() {}, stop() {} }); }
  createBufferSource() { return this._node('buffersource', { buffer: null, loop: false, start() {}, stop() {} }); }
  createBuffer() { return { getChannelData: () => new Float32Array(1) }; }
  createBiquadFilter() { return this._node('filter', { frequency: makeFakeParam(800), Q: makeFakeParam(1), type: 'lowpass' }); }
}
export function fakeStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}
```

- [ ] **Step 2: Write the failing test**

```js
// append to tests/audio.test.js
import { AudioEngine } from '../js/audio.js';
import { FakeAudioContext, fakeStorage } from './helpers/fakeAudioContext.js';

function makeEngine(over = {}) {
  const ctxFactory = () => new FakeAudioContext();
  return new AudioEngine({ ctxFactory, storage: fakeStorage(), ...over });
}

describe('AudioEngine state', () => {
  it('loads defaults when storage empty', () => {
    const e = makeEngine();
    expect(e.isMuted()).toBe(false);
    expect(e.getVolume()).toBe(0.7);
    expect(e.isUnlocked()).toBe(false);
  });
  it('loads persisted prefs', () => {
    const storage = fakeStorage();
    storage.setItem('dc_audio', '{"muted":true,"volume":0.2}');
    const e = new AudioEngine({ ctxFactory: () => new FakeAudioContext(), storage });
    expect(e.isMuted()).toBe(true);
    expect(e.getVolume()).toBe(0.2);
  });
  it('setVolume/setMuted persist and clamp', () => {
    const storage = fakeStorage();
    const e = new AudioEngine({ ctxFactory: () => new FakeAudioContext(), storage });
    e.setVolume(5); expect(e.getVolume()).toBe(1);
    e.setMuted(true); expect(e.isMuted()).toBe(true);
    expect(JSON.parse(storage.getItem('dc_audio'))).toEqual({ muted: true, volume: 1 });
  });
  it('unlock creates context once and resumes', () => {
    const e = makeEngine();
    e.unlock();
    expect(e.isUnlocked()).toBe(true);
    e.unlock(); // idempotent
    expect(e.isUnlocked()).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/audio.test.js`
Expected: FAIL — `AudioEngine is not a constructor`.

- [ ] **Step 4: Write minimal implementation**

```js
// add to js/audio.js
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
  // sfx() and ambient() added in Tasks 5 and 6.
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/audio.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/audio.js tests/audio.test.js tests/helpers/fakeAudioContext.js
git commit -m "feat(audio): AudioEngine state, mute/volume, persistence, unlock"
```

---

### Task 5: AudioEngine.sfx() — playback gating + ducking

**Files:**
- Modify: `js/audio.js`
- Test: `tests/audio.test.js`

**Interfaces:**
- Consumes: `resolveCue` (Task 2), `duckGain` (Task 3), engine state (Task 4).
- Produces: `AudioEngine.sfx(name:string):void` — no-op if muted, not unlocked, or unknown cue (warns once); otherwise calls the cue's `build(ctx, master, now)` and ducks the bed gain if `cue.duck`.

- [ ] **Step 1: Write the failing test**

```js
// append to tests/audio.test.js
import { vi } from 'vitest';

describe('AudioEngine.sfx', () => {
  it('no-op when not unlocked', () => {
    const e = makeEngine();
    let called = 0; e._ctxFactory = () => new FakeAudioContext();
    e.sfx('reveal-whoosh'); // not unlocked
    expect(e.isUnlocked()).toBe(false);
  });
  it('no-op when muted', () => {
    const e = makeEngine(); e.setMuted(true); e.unlock();
    const before = e._ctx.created.length;
    e.sfx('reveal-whoosh');
    expect(e._ctx.created.length).toBe(before); // built nothing
  });
  it('invokes the cue build fn when unlocked + unmuted', () => {
    const e = makeEngine(); e.unlock();
    const spy = vi.fn();
    e._catalogOverride = { 'spy-cue': { duck: false, build: spy } };
    e.sfx('spy-cue');
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('warns once on unknown cue, never throws', () => {
    const e = makeEngine(); e.unlock();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => { e.sfx('does-not-exist'); e.sfx('does-not-exist'); }).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
  it('ducks bed gain for duck cues', () => {
    const e = makeEngine(); e.unlock();
    e._bedGain.gain.value = 1;
    e._catalogOverride = { 'duck-cue': { duck: true, build: () => {} } };
    e.sfx('duck-cue');
    expect(e._bedGain.gain.value).toBeLessThan(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio.test.js`
Expected: FAIL — `e.sfx is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
// add inside the AudioEngine class (after unlock())
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/audio.js tests/audio.test.js
git commit -m "feat(audio): sfx() playback gating + ducking"
```

---

### Task 6: Real synth voices (browser graphs)

**Files:**
- Modify: `js/audio.js` (replace `_stub` builders in `CUE_CATALOG`)

**Interfaces:**
- Consumes: cue catalog (Task 2).
- Produces: real `build(ctx, dest, now)` graphs for all 11 cues. Not unit-testable (needs real Web Audio); verified in the Audio debug panel (Task 11). Catalog-shape tests from Task 2 must still pass.

- [ ] **Step 1: Replace the stub builders with real graphs**

Replace `_stub` and wire each cue. Helper + voices:

```js
// js/audio.js — synth voice helpers (replace the `function _stub(){}` block)
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
```

Then update `CUE_CATALOG` builder references to these functions (e.g. `'reveal-whoosh': { duck:false, build: voiceWhoosh }`, etc.), and update `BED_CATALOG` builders to the bed functions from Task 7 (use temporary `_stub` for beds until Task 7).

- [ ] **Step 2: Run catalog tests to verify still green**

Run: `npx vitest run tests/audio.test.js`
Expected: PASS (shape tests unaffected; `build` is still a function).

- [ ] **Step 3: Commit**

```bash
git add js/audio.js
git commit -m "feat(audio): real synthesized SFX voices"
```

---

### Task 7: Ambient beds + crossfade

**Files:**
- Modify: `js/audio.js`
- Test: `tests/audio.test.js`

**Interfaces:**
- Consumes: `resolveBed` (Task 2), engine state (Task 4).
- Produces: bed builder functions (looping pads) wired into `BED_CATALOG`; `AudioEngine.ambient(name)` — crossfades to the named bed, no-op if already current, queues if not unlocked, `ambient(null)` fades out.

- [ ] **Step 1: Write the failing test**

```js
// append to tests/audio.test.js
describe('AudioEngine.ambient', () => {
  it('queues bed when not unlocked, plays on unlock', () => {
    const e = makeEngine();
    e.ambient('camp-day');
    expect(e._currentBed).toBe(null);
    e.unlock();
    expect(e._currentBed).toBe('camp-day');
  });
  it('switching beds updates currentBed; same bed is a no-op', () => {
    const e = makeEngine(); e.unlock();
    e.ambient('camp-day'); expect(e._currentBed).toBe('camp-day');
    const builtA = e._ctx.created.length;
    e.ambient('camp-day'); // no-op
    expect(e._ctx.created.length).toBe(builtA);
    e.ambient('tribal-tension'); expect(e._currentBed).toBe('tribal-tension');
  });
  it('ambient(null) clears current bed', () => {
    const e = makeEngine(); e.unlock();
    e.ambient('victory'); expect(e._currentBed).toBe('victory');
    e.ambient(null); expect(e._currentBed).toBe(null);
  });
  it('unknown bed is ignored', () => {
    const e = makeEngine(); e.unlock();
    e.ambient('nope'); expect(e._currentBed).toBe(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio.test.js`
Expected: FAIL — `e.ambient is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
// add bed builders (looping pad) to js/audio.js
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
```

Wire these into `BED_CATALOG` (replace the bed `_stub`s: `'camp-day': { build: bedCampDay, file: null }`, etc.). Then add `ambient()`:

```js
// add inside AudioEngine
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/audio.js tests/audio.test.js
git commit -m "feat(audio): ambient beds + crossfade"
```

---

### Task 8: Singleton + initAudio() first-gesture unlock + window exposure

**Files:**
- Modify: `js/audio.js` (add singleton + `initAudio`)
- Modify: `js/main.js` (import + spread `audioMod`, call `initAudio()`)
- Test: `tests/audio.test.js`

**Interfaces:**
- Consumes: `AudioEngine` (Task 4).
- Produces: `export const audio = new AudioEngine();`, `export function initAudio(opts?)` — attaches a one-time `pointerdown`/`keydown` listener on `document` that calls `audio.unlock()`, returns the engine. Idempotent.

- [ ] **Step 1: Write the failing test**

```js
// append to tests/audio.test.js — initAudio attaches a one-time unlock gesture
import { initAudio, audio } from '../js/audio.js';

describe('initAudio', () => {
  it('unlocks the singleton on first document gesture', () => {
    // singleton has no fake ctx; give it one for the test
    audio._ctxFactory = () => new FakeAudioContext();
    initAudio();
    expect(audio.isUnlocked()).toBe(false);
    document.dispatchEvent(new window.Event('pointerdown'));
    expect(audio.isUnlocked()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio.test.js`
Expected: FAIL — `initAudio is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
// add to end of js/audio.js
export const audio = new AudioEngine();

let _initDone = false;
export function initAudio() {
  if (_initDone) return audio;
  _initDone = true;
  const unlock = () => {
    audio.unlock();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
  return audio;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio.test.js`
Expected: PASS.

- [ ] **Step 5: Wire into main.js**

In `js/main.js`, add near the other module imports:

```js
import * as audioMod from './audio.js';
```

Add `audioMod` to the module spread array that exposes functions on `window` (same array the other `*Mod` modules are in). After the DOM/app is ready (end of the init path that calls `loadAll()`/`renderRunTab()`), add:

```js
audioMod.initAudio();
```

- [ ] **Step 6: Verify app still loads**

Run a server and load the app:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/simulator.html`, open DevTools console. Expected: no errors; `window.audio` is defined; after one click, `window.audio.isUnlocked()` returns `true`.

- [ ] **Step 7: Commit**

```bash
git add js/audio.js js/main.js tests/audio.test.js
git commit -m "feat(audio): singleton + first-gesture unlock + window exposure"
```

---

### Task 9: Header mute/volume control + one-time toast

**Files:**
- Modify: `simulator.html` (header markup + CSS for control & toast)
- Modify: `js/audio.js` (add `_maybeToast()` call + `wireAudioControl()` helper) OR put the control wiring in `js/run-ui.js` if that owns header rendering — use `js/cast-ui.js` `showTab` neighbor if header is static. Header here is static HTML, so wire in `initAudio()`.

**Interfaces:**
- Consumes: `audio` singleton.
- Produces: `window.toggleAudioMute()`, `window.setAudioVolume(value)` (exposed via audioMod) updating the engine + the control's icon; a one-time toast shown on first unlock.

- [ ] **Step 1: Add the control markup to the header**

In `simulator.html`, inside `<nav class="sim-tabs">` (after the last tab button) or just after it within `.sim-header`, add:

```html
<div class="audio-ctrl" id="audio-ctrl">
  <button class="audio-btn" id="audio-toggle" title="Mute / unmute" onclick="toggleAudioMute()">🔊</button>
  <input type="range" id="audio-vol" min="0" max="100" value="70" oninput="setAudioVolume(this.value/100)" title="Volume">
</div>
```

- [ ] **Step 2: Add CSS (in the `<style>` block of simulator.html)**

```css
.audio-ctrl { display:flex; align-items:center; gap:6px; margin-left:auto; padding-left:12px; }
.audio-btn { background:none; border:none; font-size:16px; cursor:pointer; color:var(--text); line-height:1; }
.audio-ctrl input[type=range] { width:80px; accent-color:var(--accent); }
.audio-toast { position:fixed; bottom:18px; left:50%; transform:translateX(-50%); background:var(--surface2);
  border:1px solid var(--border); color:var(--text); padding:10px 16px; border-radius:8px; font-size:13px;
  box-shadow:0 6px 24px rgba(0,0,0,.4); z-index:9999; opacity:0; transition:opacity .4s; }
.audio-toast.show { opacity:1; }
```

- [ ] **Step 3: Add control + toast wiring in js/audio.js**

```js
// add to js/audio.js
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
```

In `initAudio()`, after the `unlock()` call inside the `unlock` handler, add `_syncAudioControl(); _audioToastOnce();`. Expose `toggleAudioMute`, `setAudioVolume` via `audioMod` on `window` (already covered by the module spread in Task 8). Call `_syncAudioControl()` once at the end of `initAudio()` so the control reflects persisted state on load.

- [ ] **Step 4: Manual verification**

Reload `simulator.html`. Expected: speaker + slider visible in the header; clicking it toggles 🔊/🔇; the slider changes volume; reload preserves the choice; first interaction shows the toast once.

- [ ] **Step 5: Commit**

```bash
git add simulator.html js/audio.js
git commit -m "feat(audio): header mute/volume control + one-time toast"
```

---

### Task 10: Declarative cue layer (VP reveal + screen ambience)

**Files:**
- Modify: `js/vp-ui.js` (reveal handlers + `renderVPScreen`)
- Modify: `js/audio.js` (add pure `cueFromElement(el)` helper)
- Test: `tests/audio.test.js`

**Interfaces:**
- Consumes: `audio` singleton.
- Produces: `cueFromElement(el):string|null` (reads `data-sfx`, falls back to `null`); reveal handlers play `cueFromElement(revealedEl) || 'reveal-whoosh'`; `renderVPScreen` reads `data-ambient` on the screen root and calls `audio.ambient(bed)` + `audio.sfx('screen-swoosh')`.

- [ ] **Step 1: Write the failing test (pure helper)**

```js
// append to tests/audio.test.js
import { cueFromElement } from '../js/audio.js';
describe('cueFromElement', () => {
  it('reads data-sfx', () => {
    const el = document.createElement('div'); el.setAttribute('data-sfx', 'idol-sting');
    expect(cueFromElement(el)).toBe('idol-sting');
  });
  it('returns null when absent', () => {
    expect(cueFromElement(document.createElement('div'))).toBe(null);
    expect(cueFromElement(null)).toBe(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio.test.js`
Expected: FAIL — `cueFromElement is not a function`.

- [ ] **Step 3: Implement helper + wire reveal/render**

In `js/audio.js`:

```js
export function cueFromElement(el) {
  if (!el || !el.getAttribute) return null;
  return el.getAttribute('data-sfx') || null;
}
```

In `js/vp-ui.js`, import the engine + helper at top:

```js
import { audio, cueFromElement } from './audio.js';
```

In the reveal handler(s) where a step element is made visible (the `vpReveal*` family — find where a step element gets its "visible" class added), after the element is revealed add:

```js
audio.sfx(cueFromElement(revealedEl) || 'reveal-whoosh');
```

(Use the actual revealed element variable name in that function.) In `renderVPScreen` (vp-ui.js:567), after the screen root is inserted, add:

```js
const _bed = screenRootEl && screenRootEl.getAttribute && screenRootEl.getAttribute('data-ambient');
if (_bed) audio.ambient(_bed);
audio.sfx('screen-swoosh');
```

(Use the screen root element variable in that function.)

- [ ] **Step 4: Run test + manual VP check**

Run: `npx vitest run tests/audio.test.js` → PASS.
Manual: load app, run an episode, open VP, click through reveals → whoosh on each reveal, swoosh on screen change.

- [ ] **Step 5: Commit**

```bash
git add js/audio.js js/vp-ui.js tests/audio.test.js
git commit -m "feat(audio): declarative cue layer for VP reveals + ambience"
```

---

### Task 11: App-wide subtle hooks + Audio debug panel

**Files:**
- Modify: `js/cast-ui.js` (`showTab` → tab swoosh)
- Modify: `js/audio.js` (delegated `.btn` click tick installer + debug panel builder)
- Modify: `simulator.html` (optional debug panel mount, gated)

**Interfaces:**
- Consumes: `audio` singleton, `CUE_CATALOG`, `BED_CATALOG`.
- Produces: `installUiSounds()` (delegated `.btn` click → `button-tick`; call from `initAudio`), `showTab` plays `tab-swoosh`, `buildAudioDebugPanel():string` (HTML listing every cue + bed with play buttons), `window.audioPlay(name)` / `window.audioBed(name)`.

- [ ] **Step 1: Tab swoosh in showTab**

In `js/cast-ui.js`, at the top of `showTab(name)`, add:

```js
import { audio } from './audio.js'; // top of file
// inside showTab:
audio.sfx('tab-swoosh');
```

- [ ] **Step 2: Delegated button tick + debug panel in js/audio.js**

```js
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
```

Call `installUiSounds()` at the end of `initAudio()`. Ensure `audioPlay`, `audioBed`, `buildAudioDebugPanel` are exposed on `window` via `audioMod`.

- [ ] **Step 3: Wire the save-chime**

In `js/savestate.js`, at the end of `saveGameState()` (after `repairGsSets(gs)`), add a guarded chime so a manual/auto save gives soft feedback:

```js
import { audio } from './audio.js'; // top of savestate.js
// end of saveGameState():
try { audio.sfx('save-chime'); } catch (e) {}
```

If `saveGameState` fires very frequently (per-episode auto-saves), instead wire the chime only to the explicit "Save Season" button handler `saveSeasonToStorage()` (`js/cast-ui.js`) to avoid chime spam. Implementer picks based on save frequency observed when running the app.

- [ ] **Step 4: Mount the debug panel**

Mount `buildAudioDebugPanel()` into the existing debug/results area the same way other debug tabs are mounted (follow the existing challenge-debug pattern in `run-ui.js`/`results` tab). Minimum: a button in the Results/debug tab that sets a container's `innerHTML = buildAudioDebugPanel()`.

- [ ] **Step 5: Manual verification (audition every sound)**

Load app, open the Audio debug panel, click every cue and bed button. Expected: each produces a distinct, non-clipping sound; beds loop and crossfade; "stop bed" fades out. Tune any harsh voice in `js/audio.js`.

- [ ] **Step 6: Commit**

```bash
git add js/cast-ui.js js/audio.js js/savestate.js simulator.html
git commit -m "feat(audio): app-wide UI ticks + tab swoosh + save chime + audio debug panel"
```

---

### Task 12: Seed data-sfx / data-ambient on universal VP moments

**Files:**
- Modify: `js/vp-screens.js` (add attributes to torch-snuff, idol, vote, winner, boot, and phase-tagged screens)

**Interfaces:**
- Consumes: the declarative cue layer (Task 10).
- Produces: `data-sfx`/`data-ambient` attributes on the universal moments — no engine changes.

- [ ] **Step 1: Seed the attributes**

In `js/vp-screens.js`, add attributes to the step/element HTML for each universal moment (search for the noted markers):

- Torch-snuff element (`torch-snuffed`, ~lines 3489 / 5123): add `data-sfx="torch-snuff"` to that step's container.
- Idol/advantage played (`superIdolPlayed`, ~10543+): add `data-sfx="idol-sting"` to the idol-play reveal step.
- Vote tally reveal steps: add `data-sfx="vote-tick"` to each vote-reveal step; `data-sfx="tension-drum"` on the final-vote/blindside step.
- Immunity/challenge winner reveal step: add `data-sfx="win-fanfare"`.
- Boot/elimination confirmed step: add `data-sfx="elimination-gong"`.
- Tribal-council screen root: add `data-ambient="tribal-tension"`. Camp day/night screens: `data-ambient="camp-day"` / `camp-night` per time-of-day. Finale winner screen: `data-ambient="victory"`.

Add the attribute strings inside the existing template literals where each element/step is built. Example pattern (match the real surrounding markup):

```js
// before
`<div class="vp-step ...">`
// after
`<div class="vp-step ..." data-sfx="torch-snuff">`
```

- [ ] **Step 2: Manual verification**

Run a full episode through to tribal in the VP. Expected: ambience shifts by phase, vote ticks fire, a blindside lands a tension drum, the boot gets a gong, a challenge win gets a fanfare.

- [ ] **Step 3: Commit**

```bash
git add js/vp-screens.js
git commit -m "feat(audio): seed data-sfx/data-ambient on universal VP moments"
```

---

## Self-Review

**Spec coverage:**
- `js/audio.js` engine + injectable ctx/storage → Tasks 1,4. ✓
- Synth SFX + beds, zero files → Tasks 6,7. ✓
- Declarative `data-sfx`/`data-ambient` layer → Tasks 10,12. ✓
- App-wide subtle UI (tab/button/save) → Task 11 (tab + button). **Gap:** save-chime cue exists (Task 2/6) but no task wires it to the save path. → Wire `audio.sfx('save-chime')` inside the save flow during Task 11 Step 2 (add to `saveGameState`/`saveSeasonToStorage` call sites, or the Save Season button handler). Added here as a note; implementer must include it in Task 11.
- Header control + persistence + toast + default-on → Tasks 8,9. ✓
- Autoplay handling (suspended until gesture) → Tasks 4,8. ✓
- Ducking → Tasks 3,5. ✓
- Dev/test panel → Task 11. ✓
- Headless unit tests with mocked AudioContext → Tasks 1-10 (FakeAudioContext). ✓

**Placeholder scan:** No "TBD/TODO"; every code step shows real code. The vp-ui.js/vp-screens.js edits reference "the actual variable name in that function" because exact local names must be read at implementation time — implementer reads the function first (allowed: these are real files with stable structure).

**Type consistency:** `audio` singleton, `sfx(name)`, `ambient(name)`, `setMuted`, `setVolume`, `unlock`, `cueFromElement`, `resolveCue`, `resolveBed`, `duckGain`, `CUE_CATALOG`, `BED_CATALOG` used consistently across tasks. Engine `_catalogOverride` (Task 5 test hook) defined and read in `_resolveCue`. ✓

**Save-chime gap:** folded into Task 11 Step 2 (see above).
