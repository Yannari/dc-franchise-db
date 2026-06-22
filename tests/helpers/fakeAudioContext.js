// tests/helpers/fakeAudioContext.js — minimal Web Audio stand-in for jsdom (which has no AudioContext)
export function makeFakeParam(value = 0) {
  return {
    value,
    setValueAtTime(v) { this.value = v; return this; },
    // Real Web Audio ramps are scheduled for a future time and do NOT mutate
    // .value synchronously; the fake mirrors that so an immediate setValueAtTime
    // (e.g. ducking) is observable on .value while the ramp target is recorded.
    linearRampToValueAtTime(v) { this.target = v; return this; },
    exponentialRampToValueAtTime(v) { this.target = v; return this; },
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
